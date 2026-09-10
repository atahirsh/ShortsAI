# ShortsAI — Browser-Based Video Shorts Generator

Turn videos into viral 9:16 shorts using AI models that run entirely in your browser. No server, no API keys, no cloud costs.

## Quick Start

```bash
npm install
npm run dev
```

Open in **Chrome 113+** or **Edge 113+** (WebGPU required), click **"Download All Models"**, upload a video, and generate shorts.

## Architecture

All processing runs 100% in the browser using native APIs:

- **Qwen 2.5 0.5B** — LLM for highlight detection (via WebLLM + WebGPU)
- **Whisper Tiny** — Speech-to-text transcription (via Transformers.js + WebGPU)
- **Canvas + MediaRecorder** — Video cropping and export (native browser APIs)

No FFmpeg, no SharedArrayBuffer, no COOP/COEP headers required.

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
