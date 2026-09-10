/**
 * YouTube video downloader
 * Uses public APIs to fetch YouTube videos for browser processing
 */

export interface YouTubeVideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
}

/**
 * Extract YouTube video ID from URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Fetch YouTube video info using Piped API
 */
async function fetchFromPiped(videoId: string): Promise<{ url: string; info: YouTubeVideoInfo } | null> {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://api.piped.privacy.com.de',
  ];

  for (const instance of instances) {
    try {
      const response = await fetch(`${instance}/streams/${videoId}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const data = await response.json();

      // Find best video stream (prefer 720p or lower for faster processing)
      const videoStreams = data.videoStreams || [];
      const targetStream = videoStreams.find((s: any) => s.height === 720) ||
                          videoStreams.find((s: any) => s.height === 480) ||
                          videoStreams.find((s: any) => s.height === 360) ||
                          videoStreams[0];

      if (!targetStream) continue;

      return {
        url: targetStream.url,
        info: {
          title: data.title || 'YouTube Video',
          duration: data.duration || 0,
          thumbnail: data.thumbnailUrl || '',
        },
      };
    } catch (e) {
      console.warn(`Piped instance ${instance} failed:`, e);
      continue;
    }
  }

  return null;
}

/**
 * Fetch YouTube video info using Invidious API
 */
async function fetchFromInvidious(videoId: string): Promise<{ url: string; info: YouTubeVideoInfo } | null> {
  const instances = [
    'https://vid.puffyan.us',
    'https://invidious.snopyta.org',
    'https://inv.riverside.rocks',
  ];

  for (const instance of instances) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const data = await response.json();

      // Find adaptive format with video
      const formatStreams = data.formatStreams || [];
      const targetStream = formatStreams.find((s: any) => s.type.includes('video')) || formatStreams[0];

      if (!targetStream) continue;

      return {
        url: targetStream.url,
        info: {
          title: data.title || 'YouTube Video',
          duration: data.lengthSeconds || 0,
          thumbnail: data.videoThumbnails?.[0]?.url || '',
        },
      };
    } catch (e) {
      console.warn(`Invidious instance ${instance} failed:`, e);
      continue;
    }
  }

  return null;
}

/**
 * Download YouTube video as blob
 */
export async function downloadYouTubeVideo(
  url: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{ blob: Blob; info: YouTubeVideoInfo }> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  onProgress?.(0, 'Fetching video info...');

  // Try multiple APIs
  let result = await fetchFromPiped(videoId);
  if (!result) {
    onProgress?.(10, 'Trying alternative source...');
    result = await fetchFromInvidious(videoId);
  }

  if (!result) {
    throw new Error('Could not fetch video from any source. The video might be restricted or unavailable.');
  }

  onProgress?.(20, `Downloading: ${result.info.title}`);

  // Download the video
  try {
    const response = await fetch(result.url, {
      signal: AbortSignal.timeout(300000), // 5 minute timeout
    });

    if (!response.ok) {
      throw new Error('Failed to download video');
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Could not read response');
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      received += value.length;

      if (total > 0) {
        const progress = 20 + (received / total) * 80;
        onProgress?.(progress, `Downloading: ${Math.round(received / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB`);
      }
    }

    // Concatenate all chunks into a single Uint8Array
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    const blob = new Blob([combined], { type: 'video/mp4' });
    onProgress?.(100, 'Download complete');

    return { blob, info: result.info };
  } catch (e) {
    throw new Error(`Download failed: ${(e as Error).message}`);
  }
}
