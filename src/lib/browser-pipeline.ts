/**
 * Browser-based AI Pipeline
 * Runs entirely in the browser using WebGPU and WASM
 * No server required (except optional YouTube download)
 */

import { CreateMLCEngine, type MLCEngineInterface } from '@mlc-ai/web-llm';
import { pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

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

// ─── FFmpeg ───
export async function initFFmpeg(onProgress?: ProgressCallback): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) return ffmpegInstance;

  // Check for SharedArrayBuffer support
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  console.log('[FFmpeg] SharedArrayBuffer available:', hasSharedArrayBuffer);

  try {
    onProgress?.({ step: 'ffmpeg', progress: 0, message: 'Initializing FFmpeg...' });

    ffmpegInstance = new FFmpeg();

    // Log events for debugging
    ffmpegInstance.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    // Use @ffmpeg/core (single-threaded, doesn't require SharedArrayBuffer)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    onProgress?.({ step: 'ffmpeg', progress: 20, message: 'Loading FFmpeg core...' });
    console.log('[FFmpeg] Loading core from:', `${baseURL}/ffmpeg-core.js`);
    
    const coreURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      'text/javascript'
    );
    console.log('[FFmpeg] Core loaded successfully');
    
    onProgress?.({ step: 'ffmpeg', progress: 40, message: 'Loading FFmpeg WASM...' });
    console.log('[FFmpeg] Loading WASM from:', `${baseURL}/ffmpeg-core.wasm`);
    
    const wasmURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      'application/wasm'
    );
    console.log('[FFmpeg] WASM loaded successfully');
    
    onProgress?.({ step: 'ffmpeg', progress: 60, message: 'Starting FFmpeg...' });
    
    await ffmpegInstance.load({
      coreURL,
      wasmURL,
    });
    console.log('[FFmpeg] FFmpeg started successfully');

    ffmpegLoaded = true;
    onProgress?.({ step: 'ffmpeg', progress: 100, message: 'FFmpeg ready' });
    return ffmpegInstance;
  } catch (error) {
    console.error('[FFmpeg] Initialization failed:', error);
    const errorMessage = (error as Error).message;
    
    // Provide helpful error messages
    if (errorMessage.includes('SharedArrayBuffer')) {
      throw new Error(
        'FFmpeg requires SharedArrayBuffer support. Please ensure your hosting service sets these HTTP headers:\n' +
        'Cross-Origin-Opener-Policy: same-origin\n' +
        'Cross-Origin-Embedder-Policy: require-corp'
      );
    }
    
    throw new Error(`Failed to initialize FFmpeg: ${errorMessage}`);
  }
}

// ─── Transcribe Audio ───
export async function transcribeAudio(
  audioBlob: Blob,
  onProgress?: ProgressCallback
): Promise<Transcript> {
  if (!whisperPipeline) throw new Error('Whisper not initialized');

  onProgress?.({ step: 'transcribe', progress: 0, message: 'Transcribing audio...' });

  // Convert blob to Float32Array for Whisper
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const audioData = audioBuffer.getChannelData(0); // mono

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

// ─── Crop Video ───
export async function cropVideo(
  videoBlob: Blob,
  highlight: Highlight,
  aspectRatio: string = '9:16',
  onProgress?: ProgressCallback
): Promise<Blob> {
  const ffmpeg = await initFFmpeg(onProgress);

  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  // Write input file
  await ffmpeg.writeFile(inputName, await fetchFile(videoBlob));

  const duration = highlight.end_time - highlight.start_time;

  // Determine crop filter
  let vfFilter: string;
  switch (aspectRatio) {
    case '1:1':
      vfFilter = 'crop=ih:ih:(iw-ih)/2:0,scale=720:720';
      break;
    case '4:5':
      vfFilter = 'crop=ih*4/5:ih:(iw-ih*4/5)/2:0,scale=720:900';
      break;
    case '9:16':
    default:
      vfFilter = 'crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=720:1280';
      break;
  }

  onProgress?.({ step: 'crop', progress: 0, message: `Cropping clip (${duration.toFixed(1)}s)...` });

  await ffmpeg.exec([
    '-ss', String(highlight.start_time),
    '-i', inputName,
    '-t', String(duration),
    '-vf', vfFilter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '28',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' });

  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  onProgress?.({ step: 'crop', progress: 100, message: 'Clip ready' });
  return blob;
}

// ─── Extract Audio from Video ───
export async function extractAudioFromVideo(videoBlob: Blob, onProgress?: ProgressCallback): Promise<Blob> {
  const ffmpeg = await initFFmpeg(onProgress);

  const inputName = 'input_video.mp4';
  const outputName = 'audio.wav';

  await ffmpeg.writeFile(inputName, await fetchFile(videoBlob));

  onProgress?.({ step: 'extract_audio', progress: 0, message: 'Extracting audio...' });

  await ffmpeg.exec([
    '-i', inputName,
    '-vn',
    '-acodec', 'pcm_s16le',
    '-ar', '16000',
    '-ac', '1',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data as unknown as BlobPart], { type: 'audio/wav' });

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  onProgress?.({ step: 'extract_audio', progress: 100, message: 'Audio extracted' });
  return blob;
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

  // Initialize all engines
  onProgress?.({ step: 'init', progress: 0, message: 'Initializing AI models...' });

  const [llm, whisper] = await Promise.all([
    initLLM(llmModel, onProgress),
    initWhisper(whisperModel, onProgress),
  ]);

  await initFFmpeg(onProgress);

  // Extract audio
  onProgress?.({ step: 'extract', progress: 0, message: 'Extracting audio from video...' });
  const audioBlob = await extractAudioFromVideo(videoBlob, onProgress);

  // Transcribe
  onProgress?.({ step: 'transcribe', progress: 0, message: 'Transcribing with Whisper...' });
  const transcript = await transcribeAudio(audioBlob, onProgress);

  if (transcript.segments.length === 0) {
    throw new Error('No speech detected in the video. Try a different video or check audio quality.');
  }

  // Detect highlights
  onProgress?.({ step: 'detect', progress: 0, message: 'Detecting viral highlights...' });
  const highlights = await detectHighlights(transcript, numClips, onProgress);

  if (highlights.length === 0) {
    throw new Error('No viral highlights detected. The LLM could not find compelling moments.');
  }

  // Crop clips
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
  if (ffmpegInstance) {
    ffmpegInstance.terminate();
    ffmpegInstance = null;
    ffmpegLoaded = false;
  }
}
