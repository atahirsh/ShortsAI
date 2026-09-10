import { useState, useEffect, useCallback } from 'react';
import ClipCard from './ClipCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

type ProcessingStep = 'idle' | 'downloading' | 'transcribing' | 'detecting' | 'cropping' | 'complete';

interface Clip {
  id: number;
  title: string;
  score: number;
  hook: string;
  reason: string;
  startTime: string;
  endTime: string;
  duration: string;
  clip_url?: string;
}

const mockClips: Clip[] = [
  {
    id: 1,
    title: "The one mistake that cost me $50K in my first startup",
    score: 92,
    hook: "\"Nobody talks about this, but it killed my first startup...\"",
    reason: "Strong hook with specific dollar amount creates curiosity. Personal failure story resonates with entrepreneurial audience.",
    startTime: "2:04",
    endTime: "3:07",
    duration: "1:03",
  },
  {
    id: 2,
    title: "Why 99% of startups fail in their first year",
    score: 88,
    hook: "\"Here's the uncomfortable truth about why most businesses die...\"",
    reason: "Bold statistic grabs attention. Contrarian angle challenges common assumptions about startup success.",
    startTime: "5:32",
    endTime: "6:15",
    duration: "0:43",
  },
  {
    id: 3,
    title: "The secret habit that changed everything for me",
    score: 85,
    hook: "\"I was doing this for 3 years before I realized what it actually did...\"",
    reason: "Mystery hook with personal transformation angle. Promises a reveal that keeps viewers watching.",
    startTime: "8:45",
    endTime: "9:30",
    duration: "0:45",
  },
  {
    id: 4,
    title: "How I went from $0 to $1M in 12 months",
    score: 79,
    hook: "\"Everyone said it was impossible, but here's exactly how I did it...\"",
    reason: "Aspirational content with specific timeline. 'Impossible' framing creates dramatic tension.",
    startTime: "12:18",
    endTime: "13:05",
    duration: "0:47",
  },
  {
    id: 5,
    title: "The productivity hack that billionaires use daily",
    score: 74,
    hook: "\"This takes 5 minutes but it's worth more than an MBA...\"",
    reason: "Authority appeal combined with time efficiency. Specific '5 minutes' makes it feel actionable.",
    startTime: "15:42",
    endTime: "16:20",
    duration: "0:38",
  },
];

const steps: { id: ProcessingStep; label: string; icon: string; description: string }[] = [
  { id: 'downloading', label: 'Downloading Video', icon: '📥', description: 'Fetching video from YouTube via yt-dlp' },
  { id: 'transcribing', label: 'Transcribing Audio', icon: '🎤', description: 'Local Whisper (faster-whisper) transcription' },
  { id: 'detecting', label: 'Detecting Highlights', icon: '🤖', description: 'Local LLM (Ollama) virality analysis & ranking' },
  { id: 'cropping', label: 'Auto-Cropping Clips', icon: '🎬', description: 'Vertical reframing with ffmpeg' },
  { id: 'complete', label: 'Complete!', icon: '✅', description: 'Your viral shorts are ready' },
];

export default function Generator() {
  const [url, setUrl] = useState('');
  const [numClips, setNumClips] = useState(3);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [mode, setMode] = useState<'api' | 'local'>('api');
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Clip[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendDeps, setBackendDeps] = useState<{ ytdlp: boolean; ffmpeg: boolean; openai: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useDemoMode, setUseDemoMode] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    checkBackend();
  }, []);

  async function checkBackend() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`, { 
        signal: AbortSignal.timeout(3000) 
      });
      const data = await res.json();
      setBackendStatus('online');
      setBackendDeps({
        ytdlp: data.dependencies.ytdlp,
        ffmpeg: data.dependencies.ffmpeg,
        openai: data.dependencies.ollama && data.dependencies.ollama_model && data.dependencies.faster_whisper,
      });
    } catch {
      setBackendStatus('offline');
    }
  }

  const simulateProcessing = useCallback(() => {
    setIsProcessing(true);
    setResults([]);
    setProgress(0);
    setError(null);

    const stepOrder: ProcessingStep[] = ['downloading', 'transcribing', 'detecting', 'cropping', 'complete'];
    let stepIndex = 0;

    const advanceStep = () => {
      if (stepIndex < stepOrder.length) {
        setCurrentStep(stepOrder[stepIndex]);
        setProgress((stepIndex / stepOrder.length) * 100);
        stepIndex++;
        
        if (stepIndex < stepOrder.length) {
          setTimeout(advanceStep, 1500 + Math.random() * 1000);
        } else {
          setProgress(100);
          setTimeout(() => {
            setResults(mockClips.slice(0, numClips));
            setIsProcessing(false);
          }, 800);
        }
      }
    };

    setTimeout(advanceStep, 500);
  }, [numClips]);

  const handleGenerate = async () => {
    if (!url.trim()) return;
    
    setError(null);
    setResults([]);
    setIsProcessing(true);
    setProgress(0);

    if (useDemoMode || backendStatus === 'offline') {
      simulateProcessing();
      return;
    }

    // Real API call
    setCurrentStep('downloading');
    setProgress(5);

    try {
      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          num_clips: numClips,
          aspect_ratio: aspectRatio,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Generation failed');
      }

      // Simulate step progression while waiting
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          const idx = steps.findIndex(s => s.id === prev);
          if (idx < steps.length - 2) {
            return steps[idx + 1].id;
          }
          return prev;
        });
        setProgress(prev => Math.min(prev + 15, 90));
      }, 3000);

      const data = await response.json();
      clearInterval(stepInterval);

      setCurrentStep('complete');
      setProgress(100);

      // Map API response to our clip format
      const clips: Clip[] = data.shorts.map((short: any) => ({
        id: short.id,
        title: short.title,
        score: short.score,
        hook: short.hook,
        reason: short.reason,
        startTime: short.start_time,
        endTime: short.end_time,
        duration: short.duration,
        clip_url: short.clip_url ? `${BACKEND_URL}${short.clip_url}` : undefined,
      }));

      setResults(clips);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Generation failed:', err);
      setError(err.message || 'Something went wrong');
      setIsProcessing(false);
      setCurrentStep('idle');
      setProgress(0);
    }
  };

  const handleDemo = () => {
    setUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    setUseDemoMode(true);
    simulateProcessing();
  };

  useEffect(() => {
    if (results.length > 0) {
      setCurrentStep('complete');
    }
  }, [results]);

  return (
    <section id="generator" className="py-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-pink-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Generate Viral Shorts
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Paste any YouTube URL and our AI will find the most viral moments, 
            rank them, and auto-crop them into vertical shorts.
          </p>
        </div>

        {/* Backend Status Banner */}
        <div className="max-w-4xl mx-auto mb-6">
          {backendStatus === 'checking' && (
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
              <span className="text-sm text-slate-300">Checking backend connection...</span>
            </div>
          )}
          {backendStatus === 'online' && backendDeps && (
            <div className="glass-card rounded-xl p-4 border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-sm font-medium text-green-400">Backend Connected — 100% Local AI</span>
                <span className="text-xs text-slate-500">— No API keys, no cloud costs</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span className={backendDeps.ytdlp ? 'text-green-400' : 'text-red-400'}>
                  {backendDeps.ytdlp ? '✅' : '❌'} yt-dlp
                </span>
                <span className={backendDeps.ffmpeg ? 'text-green-400' : 'text-red-400'}>
                  {backendDeps.ffmpeg ? '✅' : '❌'} ffmpeg
                </span>
                <span className={backendDeps.openai ? 'text-green-400' : 'text-red-400'}>
                  {backendDeps.openai ? '✅' : '❌'} Ollama + Whisper
                </span>
              </div>
            </div>
          )}
          {backendStatus === 'offline' && (
            <div className="glass-card rounded-xl p-4 border-amber-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span className="text-sm font-medium text-amber-400">Backend Offline</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                The backend server isn't running. You can use <strong>Demo Mode</strong> to see how it works, 
                or set up the local backend to process real videos — <strong>100% free, no API keys needed</strong>.
              </p>
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer hover:text-slate-300 transition-colors">
                  How to set up the local backend →
                </summary>
                <div className="mt-2 p-3 bg-slate-900 rounded-lg font-mono text-slate-400 space-y-1">
                  <div className="text-slate-500"># Option A: One-command setup (recommended)</div>
                  <div className="text-green-400">cd server && bash setup.sh</div>
                  <div className="text-slate-500 mt-2"># Option B: Manual setup</div>
                  <div className="text-slate-500"># 1. Install system tools</div>
                  <div className="text-green-400">brew install yt-dlp ffmpeg</div>
                  <div className="text-slate-500 mt-2"># 2. Install Ollama (local LLM)</div>
                  <div className="text-green-400">brew install ollama</div>
                  <div className="text-green-400">ollama serve &</div>
                  <div className="text-green-400">ollama pull qwen2.5:3b</div>
                  <div className="text-slate-500 mt-2"># 3. Install Python transcription</div>
                  <div className="text-green-400">pip install faster-whisper</div>
                  <div className="text-slate-500 mt-2"># 4. Start the server</div>
                  <div className="text-green-400">cd server && npm install && npm start</div>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            {/* URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                YouTube Video URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isProcessing || !url.trim()}
                  className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 whitespace-nowrap"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Generate Shorts'
                  )}
                </button>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={handleDemo}
                  disabled={isProcessing}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  ← Try demo mode
                </button>
                {backendStatus === 'offline' && (
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={useDemoMode}
                      onChange={(e) => setUseDemoMode(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    Demo mode (no backend needed)
                  </label>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Number of Clips</label>
                <select
                  value={numClips}
                  onChange={(e) => setNumClips(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} clip{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="9:16">9:16 (TikTok/Reels/Shorts)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:5">4:5 (Instagram)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Processing Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'api' | 'local')}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="api">API (Fast, Cloud)</option>
                  <option value="local">Local (Offline)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 animate-slide-up">
            <div className="glass-card rounded-xl p-4 border-red-500/20 bg-red-500/5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-400">Generation Failed</p>
                  <p className="text-sm text-slate-400 mt-1">{error}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Check that your backend is running and all dependencies are installed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Pipeline */}
        {(isProcessing || currentStep !== 'idle') && (
          <div className="max-w-4xl mx-auto mb-12 animate-slide-up">
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-white mb-6">Processing Pipeline</h3>
              
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {steps.map((step, index) => {
                  const stepIndex = steps.findIndex(s => s.id === currentStep);
                  const isActive = step.id === currentStep;
                  const isComplete = index < stepIndex || (currentStep === 'complete' && step.id !== 'idle');
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                        isActive ? 'bg-indigo-500/10 border border-indigo-500/30' :
                        isComplete ? 'bg-green-500/10 border border-green-500/20' :
                        'bg-slate-800/50 border border-slate-700/50'
                      }`}
                    >
                      <div className={`text-2xl mb-2 ${isActive ? 'animate-bounce' : ''}`}>
                        {isComplete ? '✅' : step.icon}
                      </div>
                      <span className={`text-xs font-medium ${
                        isActive ? 'text-indigo-300' :
                        isComplete ? 'text-green-300' :
                        'text-slate-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Current step description */}
              {currentStep !== 'idle' && currentStep !== 'complete' && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-400">
                    {steps.find(s => s.id === currentStep)?.description}
                  </p>
                  {backendStatus === 'online' && !useDemoMode && (
                    <p className="text-xs text-slate-500 mt-2">
                      ⏳ This may take 1-3 minutes depending on video length...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="max-w-6xl mx-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {useDemoMode || backendStatus === 'offline' ? '🎭 Demo Results' : 'Generated Shorts'}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {results.length} viral clips detected and ranked by virality score
                  {(useDemoMode || backendStatus === 'offline') && (
                    <span className="text-amber-400 ml-2">(demo data)</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setResults([]);
                  setCurrentStep('idle');
                  setUrl('');
                  setProgress(0);
                  setError(null);
                  setUseDemoMode(false);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all border border-slate-700"
              >
                New Generation
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((clip, index) => (
                <ClipCard key={clip.id} clip={clip} index={index} aspectRatio={aspectRatio} />
              ))}
            </div>

            {/* Export options */}
            <div className="mt-8 glass-card rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Export Options</h4>
              <div className="flex flex-wrap gap-3">
                {results.some(c => c.clip_url) && (
                  <button 
                    onClick={() => {
                      results.forEach(clip => {
                        if (clip.clip_url) {
                          const a = document.createElement('a');
                          a.href = clip.clip_url;
                          a.download = `short_${clip.id}.mp4`;
                          a.click();
                        }
                      });
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All MP4s
                  </button>
                )}
                <button 
                  onClick={() => {
                    const data = JSON.stringify(results, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'shorts_result.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export JSON
                </button>
                <button 
                  onClick={() => {
                    const text = results.map(c => 
                      `#${c.id} [Score: ${c.score}] ${c.title}\nHook: ${c.hook}\nTime: ${c.startTime} → ${c.endTime}\nWhy: ${c.reason}\n`
                    ).join('\n---\n\n');
                    navigator.clipboard.writeText(text);
                  }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  Copy Summary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
