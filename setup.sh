#!/bin/bash

echo "🚀 Setting up AI YouTube Shorts Generator..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy FFmpeg files
echo ""
echo "📋 Copying FFmpeg WASM files..."
node scripts/copy-ffmpeg.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
