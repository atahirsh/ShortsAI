import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS, type AIModel, type ModelStatus, saveModelStatus, getCachedModelStatuses } from '../lib/model-manager';
import { initLLM, initWhisper, initFFmpeg, disposeAll } from '../lib/browser-pipeline';

interface ModelManagerProps {
  onModelsReady: (ready: boolean) => void;
  onStatusChange: (status: string) => void;
}

// Map model IDs to actual library model names
const MODEL_MAP: Record<string, string> = {
  'qwen2.5-0.5b': 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  'qwen2.5-1.5b': 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  'whisper-tiny': 'Xenova/whisper-tiny',
  'whisper-base': 'Xenova/whisper-base',
  'ffmpeg-wasm': 'ffmpeg-wasm',
};

export default function ModelManager({ onModelsReady, onStatusChange }: ModelManagerProps) {
  const [models, setModels] = useState<AIModel[]>(() => {
    const cached = getCachedModelStatuses();
    return AVAILABLE_MODELS.map(m => ({
      ...m,
      status: cached[m.id]?.status === 'ready' ? 'ready' : 'not_downloaded',
    }));
  });
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check WebGPU support
    if (navigator.gpu) {
      navigator.gpu.requestAdapter().then(adapter => {
        setWebgpuSupported(!!adapter);
      }).catch(() => setWebgpuSupported(false));
    } else {
      setWebgpuSupported(false);
    }
  }, []);

  useEffect(() => {
    const allReady = models.filter(m => m.type !== 'ffmpeg').every(m => m.status === 'ready');
    const ffmpegReady = models.find(m => m.id === 'ffmpeg-wasm')?.status === 'ready';
    onModelsReady(allReady && ffmpegReady);
  }, [models, onModelsReady]);

  const downloadModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model || model.status === 'ready' || model.status === 'downloading') return;

    setDownloading(prev => ({ ...prev, [modelId]: true }));
    setErrors(prev => ({ ...prev, [modelId]: '' }));
    updateModelStatus(modelId, 'downloading', 0);
    onStatusChange(`Downloading ${model.name}...`);

    try {
      if (model.type === 'llm') {
        const libModel = MODEL_MAP[modelId];
        await initLLM(libModel, (progress) => {
          updateModelStatus(modelId, 'downloading', progress.progress);
          onStatusChange(progress.message);
        });
      } else if (model.type === 'whisper') {
        const libModel = MODEL_MAP[modelId];
        await initWhisper(libModel, (progress) => {
          updateModelStatus(modelId, 'downloading', progress.progress);
          onStatusChange(progress.message);
        });
      } else if (model.type === 'ffmpeg') {
        await initFFmpeg((progress) => {
          updateModelStatus(modelId, 'downloading', progress.progress);
          onStatusChange(progress.message);
        });
      }

      updateModelStatus(modelId, 'ready', 100);
      saveModelStatus(modelId, 'ready');
      onStatusChange(`${model.name} ready!`);
    } catch (e) {
      const errorMsg = (e as Error).message;
      updateModelStatus(modelId, 'error', 0);
      setErrors(prev => ({ ...prev, [modelId]: errorMsg }));
      onStatusChange(`Error: ${errorMsg}`);
    } finally {
      setDownloading(prev => ({ ...prev, [modelId]: false }));
    }
  };

  const downloadAll = async () => {
    // Download in order: ffmpeg first, then whisper, then LLM
    const order = ['ffmpeg-wasm', 'whisper-tiny', 'qwen2.5-0.5b'];
    for (const id of order) {
      const model = models.find(m => m.id === id);
      if (model && model.status !== 'ready') {
        await downloadModel(id);
      }
    }
  };

  const updateModelStatus = (modelId: string, status: ModelStatus, progress: number) => {
    setModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, status, progress } : m
    ));
  };

  const resetAll = () => {
    disposeAll();
    setModels(AVAILABLE_MODELS.map(m => ({ ...m, status: 'not_downloaded' as ModelStatus, progress: 0 })));
    setErrors({});
    onStatusChange('All models reset');
  };

  const readyModels = models.filter(m => m.status === 'ready');
  const totalRAM = readyModels.reduce((sum, m) => sum + m.ramRequiredMB, 0);
  const allReady = models.every(m => m.status === 'ready');

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🧠</span> AI Models
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Download once, cached in your browser. Runs 100% locally.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {!allReady && (
            <button
              onClick={downloadAll}
              disabled={Object.values(downloading).some(Boolean)}
              className="flex-1 sm:flex-none px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold transition-all shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/70 hover:scale-105 animate-pulse"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">⚡</span>
                <span>Download All Models</span>
              </span>
            </button>
          )}
          {allReady && (
            <button
              onClick={resetAll}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-base font-semibold transition-all shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <span>✅</span>
                <span>All Models Ready!</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* WebGPU Warning */}
      {webgpuSupported === false && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400 font-medium">⚠️ WebGPU not supported</p>
          <p className="text-xs text-slate-400 mt-1">
            Your browser doesn't support WebGPU. Please use Chrome 113+, Edge 113+, or a recent version of Safari/Firefox Nightly.
            Without WebGPU, the LLM and Whisper models cannot run in the browser.
          </p>
        </div>
      )}

      {/* Status Summary */}
      <div className="flex flex-wrap gap-4 mb-6 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="text-sm">
          <span className="text-slate-400">Ready:</span>{' '}
          <span className="text-green-400 font-medium">{readyModels.length}/{models.length}</span>
        </div>
        <div className="text-sm">
          <span className="text-slate-400">RAM:</span>{' '}
          <span className="text-amber-400 font-medium">~{Math.round(totalRAM / 1024 * 10) / 10}GB</span>
        </div>
        <div className="text-sm">
          <span className="text-slate-400">WebGPU:</span>{' '}
          <span className={webgpuSupported ? 'text-green-400' : 'text-red-400'}>
            {webgpuSupported === null ? 'Checking...' : webgpuSupported ? '✅ Available' : '❌ Not available'}
          </span>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isDownloading={downloading[model.id] || false}
            error={errors[model.id]}
            webgpuSupported={webgpuSupported}
            onDownload={() => downloadModel(model.id)}
          />
        ))}
      </div>

      {/* Recommended Setup */}
      <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <p className="text-sm text-indigo-300 font-medium mb-2">💡 Recommended for 3-4GB RAM laptops:</p>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• <strong className="text-slate-300">Qwen 2.5 0.5B</strong> + <strong className="text-slate-300">Whisper Tiny</strong> = ~1GB RAM total</li>
          <li>• <strong className="text-slate-300">Qwen 2.5 1.5B</strong> + <strong className="text-slate-300">Whisper Base</strong> = ~2.3GB RAM (better quality)</li>
          <li>• Close other browser tabs for best performance</li>
          <li>• First download takes time; subsequent loads are instant (cached)</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Individual Model Card ───
function ModelCard({
  model,
  isDownloading,
  error,
  webgpuSupported,
  onDownload,
}: {
  model: AIModel;
  isDownloading: boolean;
  error?: string;
  webgpuSupported: boolean | null;
  onDownload: () => void;
}) {
  const typeIcons: Record<string, string> = {
    llm: '🤖',
    whisper: '🎤',
    ffmpeg: '🎬',
  };

  const typeColors: Record<string, string> = {
    llm: 'from-purple-500 to-indigo-500',
    whisper: 'from-blue-500 to-cyan-500',
    ffmpeg: 'from-green-500 to-emerald-500',
  };

  const needsWebGPU = model.type === 'llm' || model.type === 'whisper';
  const canDownload = !needsWebGPU || webgpuSupported !== false;

  return (
    <div className={`rounded-xl p-4 border transition-all ${
      model.status === 'ready'
        ? 'bg-green-500/5 border-green-500/20'
        : model.status === 'error'
        ? 'bg-red-500/5 border-red-500/20'
        : 'bg-slate-800/50 border-slate-700/50'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColors[model.type]} flex items-center justify-center text-lg flex-shrink-0`}>
          {typeIcons[model.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white truncate">{model.name}</h4>
            {model.status === 'ready' && <span className="text-green-400 text-xs">✓ Ready</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{model.description}</p>
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span>📦 {model.sizeMB}MB download</span>
            <span>💾 ~{model.ramRequiredMB}MB RAM</span>
          </div>

          {/* Progress bar */}
          {isDownloading && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Downloading...</span>
                <span>{model.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${model.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}

          {/* Download button */}
          {model.status !== 'ready' && (
            <button
              onClick={onDownload}
              disabled={isDownloading || !canDownload}
              className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isDownloading
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : !canDownload
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isDownloading ? '⏳ Downloading...' : !canDownload ? '🚫 WebGPU Required' : '⬇️ Download'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
