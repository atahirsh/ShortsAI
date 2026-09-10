# AI YouTube Shorts Generator - Web App

A web interface for the [AI YouTube Shorts Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator). 
Turn long-form YouTube videos into viral 9:16 shorts using AI.

## 🚀 Quick Start

### What You Need

| Requirement | Purpose | Install |
|---|---|---|
| **Node.js 18+** | Run frontend & backend | [nodejs.org](https://nodejs.org) |
| **yt-dlp** | Download YouTube videos | `brew install yt-dlp` (Mac) / `apt install yt-dlp` (Linux) |
| **ffmpeg** | Video processing & cropping | `brew install ffmpeg` (Mac) / `apt install ffmpeg` (Linux) |
| **OpenAI API Key** | Whisper transcription + GPT highlight detection | [platform.openai.com](https://platform.openai.com/api-keys) |

### Step 1: Install System Dependencies

```bash
# macOS
brew install yt-dlp ffmpeg

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install yt-dlp ffmpeg

# Windows (using winget)
winget install yt-dlp
winget install ffmpeg
```

### Step 2: Setup the Backend

```bash
cd server
npm install

# Create your environment file
cp .env.example .env

# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Start the Backend

```bash
cd server
npm start
```

You should see:
```
╔══════════════════════════════════════════════════════════╗
║          AI YouTube Shorts Generator - Backend           ║
╠══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:3001                 ║
║                                                          ║
║  Dependencies:                                           ║
║    yt-dlp:   ✅                                          ║
║    ffmpeg:   ✅                                          ║
║    OpenAI:   ✅                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Step 4: Start the Frontend (Development)

```bash
# In a separate terminal, from the project root
npm run dev
```

### Step 5: Use It!

1. Open `http://localhost:5173` in your browser
2. Paste a YouTube URL
3. Click "Generate Shorts"
4. Wait 1-3 minutes for processing
5. Download your viral clips!

## 🏗️ Architecture

```
┌─────────────────┐     POST /api/generate     ┌──────────────────┐
│   React Frontend │ ──────────────────────────► │  Node.js Backend  │
│   (Vite + TS)    │ ◄────────────────────────── │  (Express)        │
│   Port 5173      │     JSON response           │  Port 3001        │
└─────────────────┘                              └────────┬─────────┘
                                                          │
                                                          ▼
                                              ┌───────────────────────┐
                                              │   External Services   │
                                              │  • YouTube (yt-dlp)   │
                                              │  • OpenAI Whisper     │
                                              │  • OpenAI GPT-4o-mini │
                                              │  • ffmpeg (local)     │
                                              └───────────────────────┘
```

## 📡 API Endpoints

### `GET /api/health`
Returns backend status and dependency check.

```json
{
  "status": "ok",
  "dependencies": { "ytdlp": true, "ffmpeg": true, "openai": true },
  "ready": true
}
```

### `POST /api/generate`
Generate shorts from a YouTube URL.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "num_clips": 3,
  "aspect_ratio": "9:16"
}
```

**Response:**
```json
{
  "source_video_url": "...",
  "video_id": "VIDEO_ID",
  "transcript_duration": 1873.4,
  "total_segments": 342,
  "shorts": [
    {
      "id": 1,
      "title": "The one mistake that cost me $50K",
      "score": 92,
      "hook": "\"Nobody talks about this...\"",
      "reason": "Strong hook with specific dollar amount...",
      "start_time": "2:04",
      "end_time": "3:07",
      "duration": "1:03",
      "clip_url": "/output/VIDEO_ID_short_1.mp4"
    }
  ]
}
```

## 💰 Cost Estimate

For a typical 30-minute YouTube video:
- **Whisper transcription**: ~$0.006/minute → ~$0.18
- **GPT-4o-mini highlight detection**: ~$0.01-0.05
- **Total per video**: ~$0.20-0.25

That's about **$5-10/month** for daily use — vs $20-300/month for commercial tools.

## 🔧 Troubleshooting

### "Backend Offline" message
- Make sure `npm start` is running in the `server/` directory
- Check that port 3001 is not blocked

### "yt-dlp not found"
```bash
# macOS
brew install yt-dlp

# Linux
sudo apt install yt-dlp

# Verify
yt-dlp --version
```

### "ffmpeg not found"
```bash
# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

### OpenAI API errors
- Check your API key is valid: `echo $OPENAI_API_KEY`
- Ensure you have credits: [platform.openai.com/usage](https://platform.openai.com/usage)
- The key must be set in `server/.env`

### Video download fails
- Some videos are region-restricted or age-gated
- Try a different video to confirm the setup works
- Check yt-dlp is up to date: `yt-dlp -U`

## 📁 Project Structure

```
├── src/                    # React frontend
│   ├── App.tsx            # Main app component
│   ├── components/
│   │   ├── Header.tsx     # Navigation
│   │   ├── Hero.tsx       # Landing section
│   │   ├── Generator.tsx  # Main generator UI
│   │   ├── ClipCard.tsx   # Individual clip display
│   │   ├── HowItWorks.tsx # Pipeline explanation
│   │   ├── Features.tsx   # Feature cards
│   │   ├── Comparison.tsx # vs paid tools
│   │   └── Footer.tsx     # Footer
│   └── index.css          # Tailwind + custom styles
├── server/                # Node.js backend
│   ├── index.js          # Express server + pipeline
│   ├── package.json      # Backend dependencies
│   ├── .env.example      # Environment template
│   └── output/           # Generated clips (auto-created)
└── README.md             # This file
```

## 🛡️ Environment Variables

### Frontend (optional)
| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:3001` | Backend server URL |

### Backend (required)
| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for Whisper + GPT |
| `PORT` | ❌ | Server port (default: 3001) |

## 📝 License

MIT — same as the original [AI YouTube Shorts Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator).
