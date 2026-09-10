#!/usr/bin/env node

/**
 * Copy FFmpeg WASM files from node_modules to public directory
 * Run this after npm install to bundle FFmpeg with the app
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'node_modules', '@ffmpeg', 'core', 'dist', 'umd');
const targetDir = path.join(__dirname, 'public', 'ffmpeg');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Files to copy
const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];

console.log('Copying FFmpeg WASM files to public/ffmpeg/...');

files.forEach(file => {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);
  
  if (!fs.existsSync(source)) {
    console.error(`❌ Source file not found: ${source}`);
    process.exit(1);
  }
  
  fs.copyFileSync(source, target);
  console.log(`✓ Copied ${file}`);
});

console.log('\n✅ FFmpeg files ready!');
