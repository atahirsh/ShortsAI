# YouTube URL Support Implementation

## Overview
The app now supports generating shorts from YouTube URLs in addition to file uploads. Users can toggle between two input modes: file upload and YouTube URL.

## Implementation Details

### 1. YouTube Downloader (`src/lib/youtube-downloader.ts`)
- **Purpose**: Downloads YouTube videos directly in the browser
- **Approach**: Uses public Piped and Invidious API instances as fallbacks
- **Features**:
  - Extracts video ID from various YouTube URL formats
  - Fetches video stream URLs from multiple API instances
  - Downloads video with progress tracking
  - Returns video blob and metadata (title, duration, thumbnail)
  - Prefers 720p or lower resolution for faster processing

### 2. UI Changes (`src/App.tsx`)
- **Input Mode Toggle**: Two-button toggle between "Upload File" and "YouTube URL"
- **YouTube URL Input**: Text input field with validation
- **Dynamic Validation**: Generate button disabled until valid input is provided
- **Progress Integration**: YouTube download progress (0-20%) merged with processing pipeline (20-100%)

### 3. State Management
```typescript
const [youtubeUrl, setYoutubeUrl] = useState('')
const [inputMode, setInputMode] = useState<'file' | 'url'>('file')
```

### 4. Processing Flow
1. User selects input mode (file or URL)
2. If URL mode:
   - Validate YouTube URL format
   - Download video via Piped/Invidious API
   - Convert to blob
3. Pass blob to existing pipeline
4. Pipeline processes video normally (extract audio → transcribe → detect highlights → crop)

### 5. Progress Calculation
- YouTube download: 0-20% of total progress
- Pipeline processing: 20-100% of total progress
  - Init: 20-40%
  - Extract: 40-50%
  - Transcribe: 50-70%
  - Detect: 70-90%
  - Crop: 90-100%

## API Instances

### Piped API (Primary)
- `https://pipedapi.kavin.rocks`
- `https://pipedapi.adminforge.de`
- `https://api.piped.privacy.com.de`

### Invidious API (Fallback)
- `https://vid.puffyan.us`
- `https://invidious.snopyta.org`
- `https://inv.riverside.rocks`

## Limitations
- Depends on public API availability (instances may go offline)
- Some videos may be restricted or unavailable
- Download speed depends on API instance and user's connection
- No guarantee of specific video quality (prefers 720p or lower)

## User Experience
1. User clicks "YouTube URL" button
2. Pastes YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. Clicks "Generate Shorts"
4. Sees progress: "Downloading YouTube video..." → "Processing..."
5. Gets generated shorts as usual

## Error Handling
- Invalid YouTube URL format
- Video not found or restricted
- API instances unavailable
- Download timeout (5 minutes)
- Network errors

All errors are displayed in the existing error UI component.
