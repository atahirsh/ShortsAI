# ShortsAI — Browser-Based Video Shorts Generator

Turn videos into viral 9:16 shorts using AI models that run entirely in your browser. No server, no API keys, no cloud costs.

## Quick Start

### First-time Setup

```bash
# Clone and setup
git clone <repository-url>
cd shorts-ai

# Run setup script (installs deps + bundles FFmpeg)
bash setup.sh

# Or manually:
npm install
node scripts/copy-ffmpeg.js
```

### Usage

1. Start the dev server: `npm run dev`
2. Open in **Chrome 113+** or **Edge 113+** (WebGPU required)
3. Click **"Download All Models"** (~500MB, cached forever)
4. Upload a video
5. Click **"Generate Shorts"**
6. Download your clips

## Requirements

- **Browser**: Chrome 113+, Edge 113+, or Safari 18+ (WebGPU)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: ~500MB for model cache (one-time)

## Tech Stack

- **React + Vite + TypeScript** — Frontend
- **shadcn/ui** — UI components
- **@mlc-ai/web-llm** — LLM in browser (Qwen 2.5)
- **@huggingface/transformers** — Whisper transcription
- **@ffmpeg/ffmpeg** — Video processing

## Development

```bash
npm install
npm run dev
```

## License

MIT
