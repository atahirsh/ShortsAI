import { useState, useRef } from 'react';
import { runFullPipeline, type PipelineResult } from '../lib/browser-pipeline';

type ProcessingStep = 'idle' | 'init' | 'extract' | 'transcribe' | 'detect' | 'crop' | 'complete';

interface Clip {
  id: number;
  title: string;
  score: number;
  hook: string;
  reason: string;
  startTime: string;
  endTime: string;
  duration: string;
  videoUrl: string;
}

export default function Generator({ modelsReady }: { modelsReady: boolean }) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [numClips, setNumClips] = useState(3);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [results, setResults] = useState<Clip[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    if (!modelsReady) {
      setError('Please download all required AI models first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setCurrentStep('init');
    setProgress(0);
    setStatusMessage('Initializing...');

    try {
      const result = await runFullPipeline(
        videoFile,
        {
          numClips,
          aspectRatio,
          llmModel: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
          whisperModel: 'Xenova/whisper-tiny',
        },
        (progress) => {
          setStatusMessage(progress.message);
          
          // Map pipeline steps to UI steps
          if (progress.step === 'init' || progress.step === 'llm' || progress.step === 'whisper' || progress.step === 'ffmpeg') {
            setCurrentStep('init');
            setProgress(progress.progress * 0.2); // 0-20%
          } else if (progress.step === 'extract' || progress.step === 'extract_audio') {
            setCurrentStep('extract');
            setProgress(20 + progress.progress * 0.1); // 20-30%
          } else if (progress.step === 'transcribe') {
            setCurrentStep('transcribe');
            setProgress(30 + progress.progress * 0.3); // 30-60%
          } else if (progress.step === 'detect') {
            setCurrentStep('detect');
            setProgress(60 + progress.progress * 0.3); // 60-90%
          } else if (progress.step === 'crop') {
            setCurrentStep('crop');
            setProgress(90 + progress.progress * 0.1); // 90-100%
          } else if (progress.step === 'complete') {
            setCurrentStep('complete');
            setProgress(100);
          }
        }
      );

      // Map results to clip format
      const clips: Clip[] = result.clips.map((clip, i) => ({
        id: i + 1,
        title: clip.highlight.title || `Highlight ${i + 1}`,
        score: clip.highlight.score || 50,
        hook: clip.highlight.hook || '',
        reason: clip.highlight.reason || '',
        startTime: formatTime(clip.highlight.start_time),
        endTime: formatTime(clip.highlight.end_time),
        duration: formatTime(clip.highlight.end_time - clip.highlight.start_time),
        videoUrl: clip.url,
      }));

      setResults(clips);
      setStatusMessage('Complete!');
    } catch (err) {
      console.error('Pipeline failed:', err);
      setError((err as Error).message || 'Processing failed');
      setCurrentStep('idle');
      setProgress(0);
      setStatusMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setResults([]);
    setVideoFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl('');
    setCurrentStep('idle');
    setProgress(0);
    setStatusMessage('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const steps = [
    { id: 'init', label: 'Loading Models', icon: '🧠' },
    { id: 'extract', label: 'Extracting Audio', icon: '🎵' },
    { id: 'transcribe', label: 'Transcribing', icon: '🎤' },
    { id: 'detect', label: 'Detecting Highlights', icon: '🔥' },
    { id: 'crop', label: 'Cropping Clips', icon: '✂️' },
    { id: 'complete', label: 'Complete', icon: '✅' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="text-2xl font-bold text-white mb-6">Generate Viral Shorts</h2>

        {/* Video Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Upload Video File
          </label>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors bg-slate-800/30"
            >
              <svg className="w-10 h-10 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-slate-400">
                {videoFile ? videoFile.name : 'Click to upload or drag and drop'}
              </span>
              {videoFile && (
                <span className="text-xs text-slate-500 mt-1">
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
            </label>
          </div>
        </div>

        {/* Video Preview */}
        {videoUrl && (
          <div className="mb-6">
            <video
              src={videoUrl}
              controls
              className="w-full max-h-64 rounded-xl bg-black"
            />
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isProcessing || !videoFile || !modelsReady}
          className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : !modelsReady ? (
            '⬇️ Download Models First'
          ) : (
            '🚀 Generate Shorts'
          )}
        </button>

        {!modelsReady && (
          <p className="text-xs text-amber-400 mt-2 text-center">
            Please download all AI models in the section above first
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card rounded-xl p-4 mb-6 border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-400">Processing Failed</p>
              <p className="text-sm text-slate-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Pipeline */}
      {(isProcessing || currentStep !== 'idle') && (
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-white mb-4">Processing Pipeline</h3>
          
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>{statusMessage || 'Processing...'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {steps.map((step) => {
              const stepIndex = steps.findIndex(s => s.id === currentStep);
              const currentIndex = steps.findIndex(s => s.id === step.id);
              const isActive = step.id === currentStep;
              const isComplete = currentIndex < stepIndex;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center text-center p-2 rounded-lg transition-all ${
                    isActive ? 'bg-indigo-500/10 border border-indigo-500/30' :
                    isComplete ? 'bg-green-500/10 border border-green-500/20' :
                    'bg-slate-800/50 border border-slate-700/50'
                  }`}
                >
                  <div className={`text-xl mb-1 ${isActive ? 'animate-bounce' : ''}`}>
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
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              Generated Shorts ({results.length})
            </h3>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-all"
            >
              New Video
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((clip) => (
              <div key={clip.id} className="glass-card rounded-xl overflow-hidden hover:border-indigo-500/40 transition-all">
                {/* Video */}
                <div className="aspect-[9/16] bg-black relative">
                  <video
                    src={clip.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    playsInline
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-green-400">#{clip.id}</span>
                    <span className="text-xs text-amber-400 font-semibold">Score: {clip.score}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                    {clip.title}
                  </h4>
                  {clip.hook && (
                    <p className="text-xs text-slate-400 italic mb-2">"{clip.hook}"</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500 font-mono">
                      {clip.startTime} → {clip.endTime}
                    </span>
                    <a
                      href={clip.videoUrl}
                      download={`short_${clip.id}.mp4`}
                      className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
