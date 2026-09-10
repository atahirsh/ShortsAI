# AI YouTube Shorts Generator - 100% Local AI

A web interface for turning YouTube videos into viral 9:16 shorts using **entirely local AI models** — no API keys, no cloud costs, no subscriptions.

## 🖥️ What Runs Where

| Component | Technology | RAM Usage |
|---|---|---|
| **Video Download** | yt-dlp | ~50MB |
| **Transcription** | faster-whisper (local) | ~75-500MB (depends on model) |
| **Highlight Detection** | Ollama (local LLM) | ~600MB-2.5GB (depends on model) |
| **Video Cropping** | ffmpeg | ~100MB |
| **Frontend** | React + Vite | ~50MB |
| **Backend** | Node.js + Express | ~50MB |

**Total: ~1-3GB RAM** — runs comfortably on any modern laptop.

## 🚀 Quick Start

### One-Command Setup (Recommended)

```bash
cd server
bash setup.sh
```

This automatically installs everything: yt-dlp, ffmpeg, Ollama, faster-whisper, and pulls a recommended model.

### Manual Setup

#### 1. System Dependencies

```bash
# macOS
brew install yt-dlp ffmpeg

# Linux (Ubuntu/Debian)
sudo apt update && sudo apt install yt-dlp ffmpeg

# Windows
winget install yt-dlp ffmpeg
```

#### 2. Install Ollama (Local LLM)

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

#### 3. Pull a Model

Choose based on your available RAM:

| Model | Size | RAM | Speed | Quality |
|---|---|---|---|---|
| `tinyllama` | ~600MB | ~1GB | ⚡⚡⚡ | Basic |
| `qwen2.5:1.5b` | ~1GB | ~1.5GB | ⚡⚡⚡ | Good |
| `gemma2:2b` | ~1.5GB | ~2GB | ⚡⚡ | Good |
| `qwen2.5:3b` | ~2GB | ~2.5GB | ⚡⚡ | **Best balance** |
| `phi3:mini` | ~2.3GB | ~3GB | ⚡ | Great |

```bash
# Start Ollama server
ollama serve &

# Pull recommended model (best balance of speed & quality)
ollama pull qwen2.5:3b
```

#### 4. Install Python Transcription

```bash
pip install faster-whisper
```

#### 5. Start the Backend

```bash
cd server
npm install
npm start
```

#### 6. Start the Frontend

```bash
# In another terminal, from project root
npm run dev
```

Open http://localhost:5173 and paste a YouTube URL!

## 📁 Project Structure

```
├── src/                    # React frontend
│   ├── App.tsx            # Main app
│   └── components/        # UI components
├── server/                # Node.js backend
│   ├── index.js          # Express server + pipeline
│   ├── transcribe.py     # Local Whisper transcription
│   ├── setup.sh          # One-command setup
│   ├── .env              # Configuration
│   └── output/           # Generated clips
└── README.md
```

## ⚙️ Configuration

Edit `server/.env` to customize:

```bash
# LLM model for highlight detection
OLLAMA_MODEL=qwen2.5:3b

# Whisper model for transcription
WHISPER_MODEL=base    # tiny/base/small/medium

# Ollama server URL
OLLAMA_URL=http://localhost:11434
```

## 📡 API Endpoints

### `GET /api/health`
Check backend status and local dependencies.

### `POST /api/generate`
Generate shorts from a YouTube URL.

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "num_clips": 3,
  "aspect_ratio": "9:16"
}
```

### `GET /api/models`
List available Ollama models on your system.

### `POST /api/pull-model`
Pull a new Ollama model.

## 💡 Tips

### Better Quality Results
Use a larger model if you have RAM to spare:
```bash
OLLAMA_MODEL=phi3:mini npm start
```

### Faster Processing
Use smaller models for speed:
```bash
OLLAMA_MODEL=tinyllama WHISPER_MODEL=tiny npm start
```

### Non-English Videos
faster-whisper auto-detects language, but you can force it:
```bash
# Edit transcribe.py or pass --language en
```

### GPU Acceleration (Optional)
If you have an NVIDIA GPU:
```bash
# In .env
WHISPER_MODEL=large-v3  # Use bigger model with GPU
```
And in `transcribe.py`, change `--device cpu` to `--device cuda`.

## 🔒 Privacy

Everything runs on your machine:
- Videos are downloaded to your local disk
- Audio is transcribed locally (never sent to any server)
- Highlight detection runs on your local LLM
- Generated clips stay on your machine

**The only internet access is to download the YouTube video itself.**

## 🐛 Troubleshooting

### "Ollama not running"
```bash
ollama serve
```

### "Model not found"
```bash
ollama pull qwen2.5:3b
```

### "faster-whisper not installed"
```bash
pip install faster-whisper
```

### Out of memory
Use smaller models:
```bash
OLLAMA_MODEL=tinyllama WHISPER_MODEL=tiny npm start
```

### Slow transcription
- Use `tiny` or `base` Whisper model
- Shorter videos process faster
- Consider GPU if available

## 📝 License

MIT — same as the original [AI YouTube Shorts Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator).
