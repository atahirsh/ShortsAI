import express from 'express';
import cors from 'cors';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create output directory
const OUTPUT_DIR = path.join(__dirname, 'output');
await fs.mkdir(OUTPUT_DIR, { recursive: true });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// ─── Step 3: Transcribe with Whisper ───
async function transcribeAudio(audioPath) {
  console.log('📝 Transcribing with Whisper...');

  // Use toFile helper from OpenAI SDK for proper file handling
  const { toFile } = await import('openai');
  const audioBuffer = await fs.readFile(audioPath);
  const audioFile = await toFile(audioBuffer, 'audio.wav', { type: 'audio/wav' });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  console.log(`  ✓ Transcribed ${transcription.segments?.length || 0} segments`);
  return transcription;
}

// ─── Step 4: Detect highlights with GPT ───
async function detectHighlights(transcript, numClips) {
  console.log('🤖 Detecting highlights with GPT...');

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

Respond with a JSON array of objects, each containing:
- start_time: number (seconds)
- end_time: number (seconds)
- score: number (0-100)
- title: string (catchy short title)
- hook: string (opening hook sentence, in quotes)
- reason: string (one sentence explaining why it's viral)

Only return the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Transcript:\n\n${transcriptText}` },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  let highlights;
  try {
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    highlights = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch (e) {
    console.error('Failed to parse highlights:', e);
    highlights = [];
  }

  console.log(`  ✓ Found ${highlights.length} highlights`);
  return highlights;
}

// ─── Step 5: Crop clips ───
async function cropClips(videoPath, highlights, videoId) {
  console.log('🎬 Cropping clips...');
  const clips = [];

  for (let i = 0; i < highlights.length; i++) {
    const highlight = highlights[i];
    const outputPath = path.join(OUTPUT_DIR, `${videoId}_short_${i + 1}.mp4`);
    const duration = highlight.end_time - highlight.start_time;

    // Crop to 9:16 vertical with center focus
    // Using ffmpeg to crop and scale
    const cmd = `ffmpeg -ss ${highlight.start_time} -i "${videoPath}" -t ${duration} ` +
      `-vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920" ` +
      `-c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k ` +
      `"${outputPath}" -y`;

    try {
      await execAsync(cmd, { timeout: 60000 });
      clips.push({
        ...highlight,
        clip_path: outputPath,
        clip_url: `/output/${videoId}_short_${i + 1}.mp4`,
      });
      console.log(`  ✓ Clip ${i + 1}/${highlights.length} created`);
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
app.get('/api/health', (req, res) => {
  const deps = {
    ytdlp: commandExists('yt-dlp'),
    ffmpeg: commandExists('ffmpeg'),
    openai: !!process.env.OPENAI_API_KEY,
  };
  res.json({
    status: 'ok',
    dependencies: deps,
    ready: deps.ytdlp && deps.ffmpeg && deps.openai,
  });
});

// Generate shorts from YouTube URL
app.post('/api/generate', async (req, res) => {
  const { url, num_clips = 3, aspect_ratio = '9:16' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
  }

  try {
    // Step 1: Download
    const { path: videoPath, videoId } = await downloadVideo(url);

    // Step 2: Extract audio
    const audioPath = await extractAudio(videoPath);

    // Step 3: Transcribe
    const transcript = await transcribeAudio(audioPath);

    // Step 4: Detect highlights
    const highlights = await detectHighlights(transcript, num_clips);

    // Step 5: Crop clips
    const clips = await cropClips(videoPath, highlights, videoId);

    // Format response
    const result = {
      source_video_url: url,
      video_id: videoId,
      transcript_duration: transcript.duration,
      total_segments: transcript.segments?.length || 0,
      shorts: clips.map((clip, i) => ({
        id: i + 1,
        title: clip.title,
        score: clip.score,
        hook: clip.hook,
        reason: clip.reason,
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

// Serve output files
app.use('/output', express.static(OUTPUT_DIR));

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          AI YouTube Shorts Generator - Backend           ║
╠══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                ║
║                                                          ║
║  Dependencies:                                           ║
║    yt-dlp:   ${commandExists('yt-dlp') ? '✅' : '❌ (install: brew install yt-dlp)'}                            ║
║    ffmpeg:   ${commandExists('ffmpeg') ? '✅' : '❌ (install: brew install ffmpeg)'}                            ║
║    OpenAI:   ${process.env.OPENAI_API_KEY ? '✅' : '❌ (set OPENAI_API_KEY)'}                              ║
║                                                          ║
║  Endpoints:                                              ║
║    GET  /api/health    - Check dependencies              ║
║    POST /api/generate  - Generate shorts from URL        ║
╚══════════════════════════════════════════════════════════╝
  `);
});
