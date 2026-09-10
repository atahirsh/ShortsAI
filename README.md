# AI YouTube Shorts Generator — 100% In-Browser AI

Turn videos into viral 9:16 shorts using **AI models that run entirely in your browser**. No server, no API keys, no cloud costs. Your video never leaves your machine.

## 🌐 How It Works

Everything runs in your browser using **WebGPU** and **WASM**:

| Component | Technology | Where it runs |
|---|---|---|
| **Transcription** | Whisper (via transformers.js + WebGPU) | Your browser |
| **Highlight Detection** | Qwen 2.5 LLM (via WebLLM + WebGPU) | Your browser |
| **Video Cropping** | FFmpeg (via ffmpeg.wasm) | Your browser |
| **Model Storage** | Browser Cache API | Your browser |

**Zero backend required.** Open the page, download models once, and generate clips forever.

## 🚀 Quick Start

### Just open it!

1. Open the app in **Chrome 113+** or **Edge 113+** (WebGPU required)
2. Click **"⚡ Download All"** to download AI models (~500MB total, cached forever)
3. Upload a video file
4. Click **"🚀 Generate Shorts"**
5. Download your viral clips!

That's it. No `npm install`, no Python, no terminal.

## 🧠 Available Models

### LLM (Highlight Detection)
| Model | Download Size | RAM Usage | Quality |
|---|---|---|---|
| Qwen 2.5 0.5B | ~400MB | ~800MB | Good for quick results |
| Qwen 2.5 1.5B | ~970MB | ~2GB | **Recommended** |

### Whisper (Transcription)
| Model | Download Size | RAM Usage | Quality |
|---|---|---|---|
| Whisper Tiny | ~75MB | ~150MB | Fast, basic accuracy |
| Whisper Base | ~150MB | ~300MB | **Recommended** |

### FFmpeg (Video Processing)
| Model | Download Size | RAM Usage |
|---|---|---|
| FFmpeg WASM | ~30MB | ~200MB |

**Total for recommended setup: ~1.1GB download, ~2.5GB RAM**

## 💻 System Requirements

- **Browser**: Chrome 113+, Edge 113+, or Safari 18+ (WebGPU support required)
- **RAM**: 4GB minimum (8GB recommended)
- **GPU**: Any GPU that supports WebGPU (most GPUs from 2020+)
- **Storage**: ~1.1GB for model cache (one-time download)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Your Browser                        │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  WebLLM      │  │ transformers │  │ ffmpeg.wasm│ │
│  │  (Qwen 2.5) │  │  (Whisper)   │  │ (Video)    │ │
│  │  via WebGPU  │  │  via WebGPU  │  │ via WASM   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                  │                 │        │
│         └──────────┬───────┴─────────────────┘        │
│                    │                                   │
│            Browser Pipeline                            │
│         (orchestrates everything)                      │
│                    │                                   │
│         ┌──────────┴──────────┐                       │
│         │   Video File Input   │                       │
│         │   (drag & drop)      │                       │
│         └─────────────────────┘                       │
│                                                      │
│  Models cached in Browser Cache API (persistent)     │
└─────────────────────────────────────────────────────┘
```

## 🔒 Privacy

- ✅ Your video **never leaves your browser**
- ✅ All AI processing happens **locally via WebGPU**
- ✅ Models are cached in **your browser's storage**
- ✅ No data sent to any server
- ✅ No tracking, no analytics

## 📁 Project Structure

```
src/
├── App.tsx                    # Main app
├── components/
│   ├── Header.tsx            # Navigation
│   ├── Hero.tsx              # Landing section
│   ├── ModelManager.tsx      # One-click model download UI
│   ├── Generator.tsx         # Video upload + generation
│   ├── ClipCard.tsx          # Individual clip display
│   ├── HowItWorks.tsx        # Pipeline explanation
│   ├── Features.tsx          # Feature cards
│   ├── Comparison.tsx        # vs paid tools
│   └── Footer.tsx            # Footer
├── lib/
│   ├── browser-pipeline.ts   # Core AI pipeline (WebGPU)
│   ├── model-manager.ts      # Model download/cache management
│   └── webgpu-check.ts       # WebGPU capability detection
└── index.css                 # Tailwind + custom styles
```

## 🔧 Development

```bash
npm install
npm run dev
```

## 🐛 Troubleshooting

### "WebGPU not supported"
- Use **Chrome 113+** or **Edge 113+**
- Make sure hardware acceleration is enabled in browser settings
- On Linux, you may need to enable WebGPU flags: `chrome://flags/#enable-unsafe-webgpu`

### "Out of memory"
- Close other browser tabs
- Use smaller models (Qwen 0.5B + Whisper Tiny = ~1GB RAM)
- Use shorter videos (< 10 minutes)

### "Model download stuck"
- Models are downloaded from Hugging Face CDN and MLC AI CDN
- Check your internet connection
- Try clearing browser cache and re-downloading

### "LLM output is poor quality"
- Try the larger model (Qwen 2.5 1.5B)
- Shorter videos tend to produce better results
- Videos with clear speech work best

## 💡 Tips

- **First load**: Models download once (~500MB-1GB). Subsequent visits load instantly from cache.
- **Best results**: Use videos with clear speech, 5-30 minutes long
- **RAM management**: Close other tabs when processing long videos
- **Multiple runs**: Models stay cached — just upload a new video and go!

## 📝 License

MIT — based on [AI YouTube Shorts Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator) by Anil-matcha.
