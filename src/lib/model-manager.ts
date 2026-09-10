/**
 * Browser-based AI Model Manager
 * Downloads, caches, and manages AI models in the browser
 * Models are stored in IndexedDB via the respective libraries
 */

export type ModelStatus = 'not_downloaded' | 'downloading' | 'ready' | 'error';

export interface AIModel {
  id: string;
  name: string;
  type: 'llm' | 'whisper' | 'ffmpeg';
  description: string;
  sizeMB: number;
  ramRequiredMB: number;
  status: ModelStatus;
  progress: number; // 0-100
  error?: string;
}

// Available models for the browser pipeline
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'qwen2.5-0.5b',
    name: 'Qwen 2.5 0.5B',
    type: 'llm',
    description: 'LLM for highlight detection',
    sizeMB: 400,
    ramRequiredMB: 800,
    status: 'not_downloaded',
    progress: 0,
  },
  {
    id: 'whisper-tiny',
    name: 'Whisper Tiny',
    type: 'whisper',
    description: 'Audio transcription',
    sizeMB: 75,
    ramRequiredMB: 150,
    status: 'not_downloaded',
    progress: 0,
  },
  {
    id: 'ffmpeg-wasm',
    name: 'FFmpeg WASM',
    type: 'ffmpeg',
    description: 'Video processing',
    sizeMB: 30,
    ramRequiredMB: 200,
    status: 'not_downloaded',
    progress: 0,
  },
];

// Model cache key in localStorage
const MODEL_CACHE_KEY = 'ai_model_cache';

/**
 * Get cached model statuses from localStorage
 */
export function getCachedModelStatuses(): Record<string, { status: ModelStatus; timestamp: number }> {
  try {
    const cached = localStorage.getItem(MODEL_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return {};
}

/**
 * Save model status to localStorage
 */
export function saveModelStatus(modelId: string, status: ModelStatus): void {
  try {
    const cached = getCachedModelStatuses();
    cached[modelId] = { status, timestamp: Date.now() };
    localStorage.setItem(MODEL_CACHE_KEY, JSON.stringify(cached));
  } catch {}
}

/**
 * Clear all cached model statuses
 */
export function clearModelCache(): void {
  try {
    localStorage.removeItem(MODEL_CACHE_KEY);
  } catch {}
}

/**
 * Get total RAM required for selected models
 */
export function getTotalRAMRequired(selectedModels: string[]): number {
  return AVAILABLE_MODELS
    .filter(m => selectedModels.includes(m.id))
    .reduce((sum, m) => sum + m.ramRequiredMB, 0);
}

/**
 * Get total download size for selected models
 */
export function getTotalDownloadSize(selectedModels: string[]): number {
  return AVAILABLE_MODELS
    .filter(m => selectedModels.includes(m.id))
    .reduce((sum, m) => sum + m.sizeMB, 0);
}
