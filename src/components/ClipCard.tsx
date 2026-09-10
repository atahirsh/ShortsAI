interface Clip {
  id: number;
  title: string;
  score: number;
  hook: string;
  reason: string;
  startTime: string;
  endTime: string;
  duration: string;
}

interface ClipCardProps {
  clip: Clip;
  index: number;
  aspectRatio: string;
}

export default function ClipCard({ clip, index, aspectRatio }: ClipCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-orange-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
    if (score >= 80) return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30';
    if (score >= 70) return 'from-amber-500/20 to-yellow-500/20 border-amber-500/30';
    return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
  };

  const gradients = [
    'from-indigo-900/60 via-purple-900/40 to-pink-900/60',
    'from-blue-900/60 via-cyan-900/40 to-teal-900/60',
    'from-rose-900/60 via-pink-900/40 to-fuchsia-900/60',
    'from-amber-900/60 via-orange-900/40 to-red-900/60',
    'from-emerald-900/60 via-green-900/40 to-lime-900/60',
  ];

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all hover:-translate-y-1 group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Video Preview */}
      <div className={`relative aspect-[9/16] max-h-64 bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center overflow-hidden`}>
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Rank badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs font-bold text-white border border-white/20">
          #{index + 1}
        </div>

        {/* Score badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r ${getScoreBg(clip.score)} border text-xs font-bold ${getScoreColor(clip.score)}`}>
          🔥 {clip.score}/100
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 text-xs text-white font-mono">
          {clip.duration}
        </div>

        {/* Aspect ratio indicator */}
        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/60 text-xs text-slate-300">
          {aspectRatio}
        </div>

        {/* Center icon */}
        <div className="text-slate-600">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2">
          {clip.title}
        </h4>

        {/* Hook */}
        <div className="mb-3">
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide">Hook:</span>
          <p className="text-xs text-slate-300 mt-0.5 italic">
            {clip.hook}
          </p>
        </div>

        {/* Reason */}
        <div className="mb-3">
          <span className="text-xs font-medium text-pink-400 uppercase tracking-wide">Why it works:</span>
          <p className="text-xs text-slate-400 mt-0.5">
            {clip.reason}
          </p>
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
          <span className="text-xs text-slate-500 font-mono">
            {clip.startTime} → {clip.endTime}
          </span>
          <div className="flex gap-1.5">
            <button className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all" title="Download">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all" title="Share">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
