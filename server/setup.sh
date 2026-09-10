#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AI YouTube Shorts Generator - Local Setup Script
# 100% local AI — no API keys, no cloud costs
# ═══════════════════════════════════════════════════════════════

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   AI YouTube Shorts Generator — Local Setup                 ║"
echo "║   100% Local AI • No API Keys • No Cloud Costs              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Check system ───
echo -e "${BLUE}[1/6]${NC} Checking system..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="windows"
else
    OS="unknown"
fi
echo "  OS: $OS"

# ─── Check/install yt-dlp ───
echo ""
echo -e "${BLUE}[2/6]${NC} Checking yt-dlp..."
if command -v yt-dlp &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} yt-dlp found: $(yt-dlp --version)"
else
    echo -e "  ${YELLOW}⚠${NC} yt-dlp not found. Installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install yt-dlp
    elif [[ "$OS" == "linux" ]]; then
        sudo apt update && sudo apt install -y yt-dlp
    elif [[ "$OS" == "windows" ]]; then
        echo "  Please install yt-dlp: https://github.com/yt-dlp/yt-dlp#installation"
        echo "  Or use: winget install yt-dlp"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} yt-dlp installed"
fi

# ─── Check/install ffmpeg ───
echo ""
echo -e "${BLUE}[3/6]${NC} Checking ffmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} ffmpeg found: $(ffmpeg -version 2>&1 | head -1)"
else
    echo -e "  ${YELLOW}⚠${NC} ffmpeg not found. Installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install ffmpeg
    elif [[ "$OS" == "linux" ]]; then
        sudo apt update && sudo apt install -y ffmpeg
    elif [[ "$OS" == "windows" ]]; then
        echo "  Please install ffmpeg: https://ffmpeg.org/download.html"
        echo "  Or use: winget install ffmpeg"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} ffmpeg installed"
fi

# ─── Check/install Ollama ───
echo ""
echo -e "${BLUE}[4/6]${NC} Checking Ollama..."
if command -v ollama &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Ollama found"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Ollama is running"
    else
        echo -e "  ${YELLOW}⚠${NC} Ollama is not running. Starting..."
        ollama serve &
        sleep 3
        echo -e "  ${GREEN}✓${NC} Ollama started"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Ollama not found. Installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install ollama
    elif [[ "$OS" == "linux" ]]; then
        curl -fsSL https://ollama.com/install.sh | sh
    elif [[ "$OS" == "windows" ]]; then
        echo "  Please install Ollama: https://ollama.com/download"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Ollama installed"
    echo "  Starting Ollama..."
    ollama serve &
    sleep 3
fi

# ─── Pull recommended model ───
echo ""
echo -e "${BLUE}[5/6]${NC} Setting up AI models..."
echo "  Recommended models for 3-4GB RAM:"
echo "    • qwen2.5:3b    (~2GB) — Best balance of speed & quality"
echo "    • qwen2.5:1.5b  (~1GB) — Faster, slightly less accurate"
echo "    • tinyllama     (~600MB) — Fastest, basic quality"
echo "    • phi3:mini     (~2.3GB) — Good quality, Microsoft model"
echo ""

# Check if model exists
MODEL_NAME="qwen2.5:3b"
if ollama list 2>/dev/null | grep -q "$MODEL_NAME"; then
    echo -e "  ${GREEN}✓${NC} Model '$MODEL_NAME' already available"
else
    echo -e "  ${YELLOW}⚠${NC} Pulling model '$MODEL_NAME' (this may take a few minutes)..."
    ollama pull "$MODEL_NAME"
    echo -e "  ${GREEN}✓${NC} Model '$MODEL_NAME' ready"
fi

# ─── Install Python dependencies ───
echo ""
echo -e "${BLUE}[6/6]${NC} Setting up Python (faster-whisper)..."

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "  ${RED}✗${NC} Python not found. Please install Python 3.8+"
    exit 1
fi

echo "  Python: $($PYTHON_CMD --version)"

# Check if faster-whisper is installed
if $PYTHON_CMD -c "import faster_whisper" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} faster-whisper already installed"
else
    echo -e "  ${YELLOW}⚠${NC} Installing faster-whisper..."
    $PYTHON_CMD -m pip install faster-whisper
    echo -e "  ${GREEN}✓${NC} faster-whisper installed"
fi

# ─── Install Node.js dependencies ───
echo ""
echo -e "${BLUE}[Bonus]${NC} Installing Node.js dependencies..."
cd "$(dirname "$0")"
npm install
echo -e "  ${GREEN}✓${NC} Node.js dependencies installed"

# ─── Create .env if not exists ───
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "  ${GREEN}✓${NC} Created .env file (edit to customize settings)"
fi

# ─── Summary ───
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP COMPLETE!                        ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  All dependencies installed. You're ready to go!             ║"
echo "║                                                              ║"
echo "║  Start the backend:                                          ║"
echo "║    cd server && npm start                                    ║"
echo "║                                                              ║"
echo "║  Start the frontend (in another terminal):                   ║"
echo "║    npm run dev                                               ║"
echo "║                                                              ║"
echo "║  Then open http://localhost:5173 and paste a YouTube URL!    ║"
echo "║                                                              ║"
echo "║  💡 Tip: Edit server/.env to change models or settings       ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
