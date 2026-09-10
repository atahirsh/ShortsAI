import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Configuration ───
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'base';
const PYTHON_CMD = process.env.PYTHON_CMD || 'python3';

// Middleware
app.use(cors());
app.use(express.json());

// Create output directory
const OUTPUT_DIR = path.join(__dirname, 'output');
await fs.mkdir(OUTPUT_DIR, { recursive: true });

// ─── Helper: Check if a command exists ───
function commandExists(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ─── Helper: Check if Ollama is running ───
async function isOllamaRunning() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Helper: Check if model is available in Ollama ───
async function isModelAvailable(modelName) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return data.models?.some(m => m.name.startsWith(modelName));
  } catch {
    return false;
  }
}

// ─── Helper: Check if Python + faster-whisper are available ───
function isPythonReady() {
  try {
    execSync(`${PYTHON_CMD} -c "import faster_whisper"`, { stdio: 'ignore', timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

// ─── Step 1: Download video from YouTube ───
async function downloadVideo(url) {
  console.log('📥 Downloading video...');
  const videoId = extractVideoId(url);
  const outputPath = path.join(OUTPUT_DIR, `${videoId}.mp4`);

  // Check if already downloaded
  try {
    await fs.access(outputPath);
    console.log('  ✓ Video already cached');
    return { path: outputPath, videoId };
  } catch {}

  const cmd = `yt-dlp -f "best[height<=720]" -o "${outputPath}" "${url}"`;
  await execAsync(cmd, { timeout: 300000 });
  console.log('  ✓ Download complete');
  return { path: outputPath, videoId };
}

function extractVideoId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : `video_${Date.now()}`;
}

// ─── Step 2: Extract audio ───
async function extractAudio(videoPath) {
  console.log('🎤 Extracting audio...');
  const audioPath = videoPath.replace('.mp4', '.wav');

  try {
    await fs.access(audioPath);
    console.log('  ✓ Audio already extracted');
    return audioPath;
  } catch {}

  const cmd = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}" -y`;
  await execAsync(cmd, { timeout: 120000 });
  console.log('  ✓ Audio extracted');
  return audioPath;
}

// ─── Step 3: Transcribe with local faster-whisper ───
async function transcribeAudio(audioPath) {
  console.log(`📝 Transcribing with local Whisper (${WHISPER_MODEL} model)...`);

  const scriptPath = path.join(__dirname, 'transcribe.py');
  const srtPath = audioPath.replace('.wav', '.json');

  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_CMD, [
      scriptPath,
      '--audio', audioPath,
      '--model', WHISPER_MODEL,
      '--output', srtPath,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`  [whisper] ${data.toString().trim()}`);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Whisper transcription failed (exit ${code}): ${stderr}`));
        return;
      }

      try {
        const raw = await fs.readFile(srtPath, 'utf-8');
        const result = JSON.parse(raw);
        console.log(`  ✓ Transcribed ${result.segments?.length || 0} segments`);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to read transcription output: ${e.message}`));
      }
    });
  });
}

// ─── Step 4: Detect highlights with local Ollama LLM ───
async function detectHighlights(transcript, numClips) {
  console.log(`🤖 Detecting highlights with local LLM (${OLLAMA_MODEL})...`);

  const segments = transcript.segments || [];
  const transcriptText = segments
    .map(s => `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s] ${s.text}`)
    .join('\n');

  const systemPrompt = `You are an expert at identifying viral-worthy moments in YouTube videos.
Analyze the transcript and find the top ${numClips} most viral-worthy clips.

For each clip, score it 0-100 based on these virality criteria:
- Hook moments (attention-grabbing openings)
- Emotional peaks (high-arousal moments)
- Opinion bombs (bold, controversial takes)
- Revelations (surprising insights)
- Conflict (tension & disagreement)
- Quotable lines (shareable one-liners)
- Story peaks (narrative climaxes)
- Practical value (actionable takeaways)

Respond with ONLY a valid JSON array. No markdown, no explanation, just the array.
Each object must have: start_time (number), end_time (number), score (number 0-100), title (string), hook (string), reason (string).

Example: [{"start_time":10.5,"end_time":45.2,"score":85,"title":"Amazing moment","hook":"You won't believe...","reason":"Strong emotional hook"}]`;

  const userPrompt = `Transcript:\n\n${transcriptText}`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048,
        },
      }),
      signal: AbortSignal.timeout(300000), // 5 min timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.response || '';

    // Parse JSON from response (handle markdown code blocks)
    let highlights;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        highlights = JSON.parse(jsonMatch[0]);
      } else {
        highlights = JSON.parse(content);
      }
    } catch (e) {
      console.error('Failed to parse highlights from LLM output:', content.slice(0, 500));
      highlights = [];
    }

    // Validate and limit
    highlights = highlights
      .filter(h => h.start_time != null && h.end_time != null && h.score != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, numClips);

    console.log(`  ✓ Found ${highlights.length} highlights`);
    return highlights;
  } catch (e) {
    console.error('LLM detection failed:', e.message);
    throw new Error(`Local LLM failed: ${e.message}. Make sure Ollama is running with model "${OLLAMA_MODEL}" loaded.`);
  }
}

// ─── Step 5: Crop clips ───
async function cropClips(videoPath, highlights, videoId, aspectRatio) {
  console.log('🎬 Cropping clips with ffmpeg...');
  const clips = [];

  // Determine crop filter based on aspect ratio
  let vfFilter;
  switch (aspectRatio) {
    case '1:1':
      vfFilter = 'crop=ih:ih:(iw-ih)/2:0,scale=1080:1080';
      break;
    case '4:5':
      vfFilter = 'crop=ih*4/5:ih:(iw-ih*4/5)/2:0,scale=1080:1350';
      break;
    case '9:16':
    default:
      vfFilter = 'crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920';
      break;
  }

  for (let i = 0; i < highlights.length; i++) {
    const highlight = highlights[i];
    const outputPath = path.join(OUTPUT_DIR, `${videoId}_short_${i + 1}.mp4`);
    const duration = highlight.end_time - highlight.start_time;

    const cmd = `ffmpeg -ss ${highlight.start_time} -i "${videoPath}" -t ${duration} ` +
      `-vf "${vfFilter}" ` +
      `-c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k ` +
      `"${outputPath}" -y`;

    try {
      await execAsync(cmd, { timeout: 60000 });
      clips.push({
        ...highlight,
        clip_path: outputPath,
        clip_url: `/output/${videoId}_short_${i + 1}.mp4`,
      });
      console.log(`  ✓ Clip ${i + 1}/${highlights.length} created (${duration.toFixed(1)}s)`);
    } catch (e) {
      console.error(`  ✗ Failed to create clip ${i + 1}:`, e.message);
    }
  }

  return clips;
}

// ─── Format timestamps ───
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ─── API Routes ───

// Health check
app.get('/api/health', async (req, res) => {
  const ollamaRunning = await isOllamaRunning();
  const modelAvailable = ollamaRunning ? await isModelAvailable(OLLAMA_MODEL) : false;
  const pythonReady = isPythonReady();

  const deps = {
    ytdlp: commandExists('yt-dlp'),
    ffmpeg: commandExists('ffmpeg'),
    ollama: ollamaRunning,
    ollama_model: modelAvailable,
    python: commandExists(PYTHON_CMD),
    faster_whisper: pythonReady,
  };

  res.json({
    status: 'ok',
    dependencies: deps,
    config: {
      ollama_url: OLLAMA_URL,
      ollama_model: OLLAMA_MODEL,
      whisper_model: WHISPER_MODEL,
    },
    ready: deps.ytdlp && deps.ffmpeg && deps.ollama && deps.ollama_model && deps.faster_whisper,
  });
});

// Generate shorts from YouTube URL
app.post('/api/generate', async (req, res) => {
  const { url, num_clips = 3, aspect_ratio = '9:16' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  try {
    // Step 1: Download
    const { path: videoPath, videoId } = await downloadVideo(url);

    // Step 2: Extract audio
    const audioPath = await extractAudio(videoPath);

    // Step 3: Transcribe (local Whisper)
    const transcript = await transcribeAudio(audioPath);

    // Step 4: Detect highlights (local Ollama LLM)
    const highlights = await detectHighlights(transcript, num_clips);

    if (highlights.length === 0) {
      return res.status(422).json({
        error: 'No highlights detected',
        message: 'The LLM could not find viral-worthy moments. Try a different video or a larger model.',
      });
    }

    // Step 5: Crop clips (local ffmpeg)
    const clips = await cropClips(videoPath, highlights, videoId, aspect_ratio);

    // Format response
    const result = {
      source_video_url: url,
      video_id: videoId,
      transcript_duration: transcript.duration || 0,
      total_segments: transcript.segments?.length || 0,
      model_used: OLLAMA_MODEL,
      whisper_model: WHISPER_MODEL,
      shorts: clips.map((clip, i) => ({
        id: i + 1,
        title: clip.title || `Highlight ${i + 1}`,
        score: clip.score || 50,
        hook: clip.hook || '',
        reason: clip.reason || '',
        start_time: formatTime(clip.start_time),
        end_time: formatTime(clip.end_time),
        start_seconds: clip.start_time,
        end_seconds: clip.end_time,
        duration: formatTime(clip.end_time - clip.start_time),
        clip_url: clip.clip_url,
      })),
    };

    res.json(result);
  } catch (error) {
    console.error('Generation failed:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message,
    });
  }
});

// List available Ollama models
app.get('/api/models', async (req, res) => {
  try {
    const ollamaRunning = await isOllamaRunning();
    if (!ollamaRunning) {
      return res.json({ models: [], ollama_running: false });
    }
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    res.json({
      models: (data.models || []).map(m => ({
        name: m.name,
        size: m.size,
        size_gb: (m.size / 1024 / 1024 / 1024).toFixed(2),
      })),
      ollama_running: true,
    });
  } catch (e) {
    res.json({ models: [], ollama_running: false, error: e.message });
  }
});

// Pull a model
app.post('/api/pull-model', async (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: 'Model name required' });

  try {
    // Ollama pull is streaming, so we use exec
    console.log(`📦 Pulling model: ${model}...`);
    const { stdout, stderr } = await execAsync(`ollama pull ${model}`, { timeout: 600000 });
    console.log('  ✓ Model pulled successfully');
    res.json({ success: true, model });
  } catch (e) {
    res.status(500).json({ error: `Failed to pull model: ${e.message}` });
  }
});

// Serve output files
app.use('/output', express.static(OUTPUT_DIR));

// Start server
app.listen(PORT, async () => {
  const ollamaRunning = await isOllamaRunning();
  const modelAvailable = ollamaRunning ? await isModelAvailable(OLLAMA_MODEL) : false;

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        AI YouTube Shorts Generator — 100% LOCAL              ║
╠══════════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                              ║
║                                                              ║
║  Local AI Stack:                                             ║
║    yt-dlp:        ${commandExists('yt-dlp') ? '✅' : '❌ install: brew install yt-dlp'}                              ║
║    ffmpeg:        ${commandExists('ffmpeg') ? '✅' : '❌ install: brew install ffmpeg'}                              ║
║    Ollama:        ${ollamaRunning ? '✅' : '❌ start: ollama serve'}                              ║
║    Model:         ${modelAvailable ? '✅' : '❌ pull: ollama pull ' + OLLAMA_MODEL}  ║
║    Python:        ${commandExists(PYTHON_CMD) ? '✅' : '❌ install python3'}                              ║
║    faster-whisper:${isPythonReady() ? '✅' : '❌ pip install faster-whisper'}                              ║
║                                                              ║
║  Config:                                                     ║
║    Ollama URL:    ${OLLAMA_URL}                ║
║    LLM Model:     ${OLLAMA_MODEL.padEnd(20)}                       ║
║    Whisper Model: ${WHISPER_MODEL.padEnd(20)}                       ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
