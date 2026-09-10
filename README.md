# ShortsAI — Browser-Based Video Shorts Generator

Turn videos into viral 9:16 shorts using AI models that run entirely in your browser. No server, no API keys, no cloud costs.

## Quick Start

1. Open the app in **Chrome 113+** or **Edge 113+** (WebGPU required)
2. Click **"Download All Models"** (~500MB, cached forever)
3. Upload a video
4. Click **"Generate Shorts"**
5. Download your clips

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
