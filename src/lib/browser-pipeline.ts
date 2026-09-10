/**
 * Browser-based AI Pipeline
 * Runs entirely in the browser using WebGPU and native APIs
 * No server required, no FFmpeg needed
 */

import { CreateMLCEngine, type MLCEngineInterface } from '@mlc-ai/web-llm';
import { pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  duration: number;
  language: string;
  segments: TranscriptSegment[];
}

export interface Highlight {
  start_time: number;
  end_time: number;
  score: number;
  title: string;
  hook: string;
  reason: string;
}

export interface PipelineProgress {
  step: string;
  progress: number;
  message: string;
}

type ProgressCallback = (progress: PipelineProgress) => void;

// ─── Singleton instances ───
let llmEngine: MLCEngineInterface | null = null;
let whisperPipeline: AutomaticSpeechRecognitionPipeline | null = null;

// ─── LLM Engine ───
export async function initLLM(
  modelId: string = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  onProgress?: ProgressCallback
): Promise<MLCEngineInterface> {
  if (llmEngine) return llmEngine;

  onProgress?.({ step: 'llm', progress: 0, message: 'Loading LLM model...' });

  llmEngine = await CreateMLCEngine(modelId, {
    initProgressCallback: (report) => {
      const progress = Math.round(report.progress * 100);
      onProgress?.({
        step: 'llm',
        progress,
        message: `Loading LLM: ${report.text || `${progress}%`}`,
      });
    },
  });

  onProgress?.({ step: 'llm', progress: 100, message: 'LLM ready' });
  return llmEngine;
}

// ─── Whisper Pipeline ───
export async function initWhisper(
  modelId: string = 'Xenova/whisper-tiny',
  onProgress?: ProgressCallback
): Promise<AutomaticSpeechRecognitionPipeline> {
  if (whisperPipeline) return whisperPipeline;

  onProgress?.({ step: 'whisper', progress: 0, message: 'Loading Whisper model...' });

  whisperPipeline = await pipeline('automatic-speech-recognition', modelId, {
    device: 'webgpu',
    progress_callback: (progress: any) => {
      if (progress.status === 'progress' && progress.progress) {
        onProgress?.({
          step: 'whisper',
          progress: Math.round(progress.progress),
          message: `Loading Whisper: ${Math.round(progress.progress)}%`,
        });
      }
    },
  } as any);

  onProgress?.({ step: 'whisper', progress: 100, message: 'Whisper ready' });
  return whisperPipeline;
}

// ─── Extract Audio from Video (using native AudioContext) ───
export async function extractAudioFromVideo(
  videoBlob: Blob,
  onProgress?: ProgressCallback
): Promise<AudioBuffer> {
  onProgress?.({ step: 'extract_audio', progress: 0, message: 'Extracting audio...' });

  const arrayBuffer = await videoBlob.arrayBuffer();
  
  onProgress?.({ step: 'extract_audio', progress: 50, message: 'Decoding audio...' });

  const audioContext = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  onProgress?.({ step: 'extract_audio', progress: 100, message: 'Audio extracted' });
  return audioBuffer;
}

// ─── Transcribe Audio ───
export async function transcribeAudio(
  audioBuffer: AudioBuffer,
  onProgress?: ProgressCallback
): Promise<Transcript> {
  if (!whisperPipeline) throw new Error('Whisper not initialized');

  onProgress?.({ step: 'transcribe', progress: 0, message: 'Transcribing audio...' });

  // Get mono channel data
  const audioData = audioBuffer.getChannelData(0);

  const result = await whisperPipeline(audioData, {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  } as any) as any;

  const segments: TranscriptSegment[] = (result.chunks || []).map((chunk: any) => ({
    start: chunk.timestamp?.[0] ?? 0,
    end: chunk.timestamp?.[1] ?? 0,
    text: chunk.text?.trim() || '',
  }));

  onProgress?.({ step: 'transcribe', progress: 100, message: `Transcribed ${segments.length} segments` });

  return {
    duration: audioBuffer.duration,
    language: (result as any).language || 'en',
    segments,
  };
}

// ─── Detect Highlights ───
export async function detectHighlights(
  transcript: Transcript,
  numClips: number = 3,
  onProgress?: ProgressCallback
): Promise<Highlight[]> {
  if (!llmEngine) throw new Error('LLM not initialized');

  onProgress?.({ step: 'detect', progress: 0, message: 'Analyzing transcript for viral moments...' });

  const transcriptText = transcript.segments
    .map(s => `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s] ${s.text}`)
    .join('\n');

  const systemPrompt = `You are an expert at identifying viral-worthy moments in videos.
Analyze the transcript and find the top ${numClips} most viral-worthy clips.

Score each clip 0-100 based on:
- Hook moments (attention-grabbing openings)
- Emotional peaks (high-arousal moments)
- Opinion bombs (bold, controversial takes)
- Revelations (surprising insights)
- Conflict (tension & disagreement)
- Quotable lines (shareable one-liners)
- Story peaks (narrative climaxes)
- Practical value (actionable takeaways)

Respond with ONLY a valid JSON array. No markdown, no explanation.
Each object: {"start_time":number,"end_time":number,"score":number,"title":"string","hook":"string","reason":"string"}`;

  const userPrompt = `Transcript:\n\n${transcriptText}`;

  onProgress?.({ step: 'detect', progress: 30, message: 'LLM analyzing highlights...' });

  const response = await llmEngine.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || '';

  onProgress?.({ step: 'detect', progress: 80, message: 'Parsing results...' });

  // Parse JSON from response
  let highlights: Highlight[];
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      highlights = JSON.parse(jsonMatch[0]);
    } else {
      highlights = JSON.parse(content);
    }
  } catch {
    console.error('Failed to parse highlights:', content.slice(0, 500));
    highlights = [];
  }

  // Validate and limit
  highlights = highlights
    .filter(h => h.start_time != null && h.end_time != null && h.score != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, numClips);

  onProgress?.({ step: 'detect', progress: 100, message: `Found ${highlights.length} highlights` });
  return highlights;
}

// ─── Crop Video using Canvas + MediaRecorder (no FFmpeg needed!) ───
export async function cropVideo(
  videoBlob: Blob,
  highlight: Highlight,
  aspectRatio: string = '9:16',
  onProgress?: ProgressCallback
): Promise<Blob> {
  onProgress?.({ step: 'crop', progress: 0, message: 'Preparing video crop...' });

  // Create video element
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoBlob);
  video.muted = false;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
  });

  // Calculate crop dimensions
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  
  let targetWidth: number;
  let targetHeight: number;
  let cropX: number;
  let cropY: number;
  let cropWidth: number;
  let cropHeight: number;

  // Determine target aspect ratio
  let targetAspect: number;
  switch (aspectRatio) {
    case '1:1':
      targetAspect = 1;
      targetWidth = 720;
      targetHeight = 720;
      break;
    case '4:5':
      targetAspect = 4 / 5;
      targetWidth = 720;
      targetHeight = 900;
      break;
    case '9:16':
    default:
      targetAspect = 9 / 16;
      targetWidth = 720;
      targetHeight = 1280;
      break;
  }

  // Calculate crop region (center crop)
  const videoAspect = videoWidth / videoHeight;
  if (videoAspect > targetAspect) {
    // Video is wider than target - crop sides
    cropHeight = videoHeight;
    cropWidth = videoHeight * targetAspect;
    cropX = (videoWidth - cropWidth) / 2;
    cropY = 0;
  } else {
    // Video is taller than target - crop top/bottom
    cropWidth = videoWidth;
    cropHeight = videoWidth / targetAspect;
    cropX = 0;
    cropY = (videoHeight - cropHeight) / 2;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  // Setup MediaRecorder
  const canvasStream = canvas.captureStream(30); // 30fps
  
  // Also capture audio from the video
  try {
    const audioStream = (video as any).captureStream?.() || 
                       (video as any).mozCaptureStream?.();
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        canvasStream.addTrack(track);
      });
    }
  } catch (e) {
    console.warn('Could not capture audio stream:', e);
  }

  // Determine supported MIME type
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 2500000, // 2.5 Mbps
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const duration = highlight.end_time - highlight.start_time;

  onProgress?.({ step: 'crop', progress: 10, message: `Cropping ${duration.toFixed(1)}s clip...` });

  // Seek to start time
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
    video.currentTime = highlight.start_time;
  });

  // Start recording
  recorder.start(100); // Collect data every 100ms
  video.play();

  // Draw frames
  const startTime = highlight.start_time;
  const endTime = highlight.end_time;

  await new Promise<void>((resolve) => {
    const drawFrame = () => {
      if (video.currentTime >= endTime || video.ended) {
        resolve();
        return;
      }

      // Draw cropped video to canvas
      ctx.drawImage(
        video,
        cropX, cropY, cropWidth, cropHeight, // source
        0, 0, targetWidth, targetHeight // destination
      );

      // Update progress
      const elapsed = video.currentTime - startTime;
      const progress = Math.min(90, 10 + (elapsed / duration) * 80);
      onProgress?.({ step: 'crop', progress, message: `Recording: ${elapsed.toFixed(1)}s / ${duration.toFixed(1)}s` });

      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  });

  // Stop recording
  video.pause();
  recorder.stop();

  // Wait for recording to finish
  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };
  });

  const resultBlob = await recordingPromise;

  // Cleanup
  URL.revokeObjectURL(video.src);
  canvasStream.getTracks().forEach(track => track.stop());

  onProgress?.({ step: 'crop', progress: 100, message: 'Clip ready' });
  return resultBlob;
}

// ─── Full Pipeline ───
export interface PipelineResult {
  transcript: Transcript;
  highlights: Highlight[];
  clips: {
    highlight: Highlight;
    blob: Blob;
    url: string;
  }[];
}

export async function runFullPipeline(
  videoBlob: Blob,
  options: {
    numClips?: number;
    aspectRatio?: string;
    llmModel?: string;
    whisperModel?: string;
  } = {},
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  const {
    numClips = 3,
    aspectRatio = '9:16',
    llmModel = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    whisperModel = 'Xenova/whisper-tiny',
  } = options;

  // Initialize AI models
  onProgress?.({ step: 'init', progress: 0, message: 'Initializing AI models...' });

  await Promise.all([
    initLLM(llmModel, onProgress),
    initWhisper(whisperModel, onProgress),
  ]);

  // Extract audio using native AudioContext (no FFmpeg!)
  onProgress?.({ step: 'extract', progress: 0, message: 'Extracting audio from video...' });
  const audioBuffer = await extractAudioFromVideo(videoBlob, onProgress);

  // Transcribe
  onProgress?.({ step: 'transcribe', progress: 0, message: 'Transcribing with Whisper...' });
  const transcript = await transcribeAudio(audioBuffer, onProgress);

  if (transcript.segments.length === 0) {
    throw new Error('No speech detected in the video. Try a different video or check audio quality.');
  }

  // Detect highlights
  onProgress?.({ step: 'detect', progress: 0, message: 'Detecting viral highlights...' });
  const highlights = await detectHighlights(transcript, numClips, onProgress);

  if (highlights.length === 0) {
    throw new Error('No viral highlights detected. The LLM could not find compelling moments.');
  }

  // Crop clips using Canvas + MediaRecorder (no FFmpeg!)
  const clips: PipelineResult['clips'] = [];
  for (let i = 0; i < highlights.length; i++) {
    onProgress?.({
      step: 'crop',
      progress: (i / highlights.length) * 100,
      message: `Cropping clip ${i + 1}/${highlights.length}...`,
    });

    const clipBlob = await cropVideo(videoBlob, highlights[i], aspectRatio, onProgress);
    const url = URL.createObjectURL(clipBlob);

    clips.push({
      highlight: highlights[i],
      blob: clipBlob,
      url,
    });
  }

  onProgress?.({ step: 'complete', progress: 100, message: 'All clips ready!' });

  return { transcript, highlights, clips };
}

// ─── Cleanup ───
export function disposeAll(): void {
  if (llmEngine) {
    (llmEngine as any).dispose?.();
    llmEngine = null;
  }
  whisperPipeline = null;
}
