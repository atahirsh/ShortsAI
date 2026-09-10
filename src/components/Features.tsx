export default function Features() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'YouTube In, Vertical Out',
      description: 'Hand it any YouTube URL — get back N viral-ready 9:16 MP4s ready for TikTok, Reels, and Shorts.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Two Modes — API or Local',
      description: 'API mode uses cloud services for speed. Local mode runs entirely on your machine with yt-dlp, faster-whisper, and ffmpeg.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Virality-Aware Detection',
      description: 'Clips ranked on hooks, emotional peaks, opinion bombs, revelations, conflict, quotables, story peaks, and practical value.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Score + Hook + Reason',
      description: 'Every highlight comes with a viral score (0-100), an opening hook line, and a one-sentence explanation of why it works.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: '100% Local Transcription',
      description: 'faster-whisper runs on your CPU — no GPU needed. Tiny model uses ~75MB RAM, base model ~150MB. Fast and private.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      title: 'Long-Video Aware',
      description: 'Videos over 30 minutes are auto-chunked with overlap so nothing gets missed. Smart dedupe prevents near-duplicates.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      title: 'Smart Vertical Crop',
      description: 'API mode uses auto-crop; local mode runs OpenCV face tracking with motion smoothing for perfect framing.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: 'CLI + Python Library',
      description: 'Use it from the shell or import generate_shorts() into your own pipeline. JSON output for downstream automation.',
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Everything you need to turn long-form content into scroll-stopping shorts — 
            with full control and zero limitations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 hover:border-indigo-500/30 transition-all hover:-translate-y-1 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Code example */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-xs text-slate-500 font-mono">terminal</span>
            </div>
            <div className="p-6 font-mono text-sm overflow-x-auto">
              <div className="text-slate-500"># One-command setup (installs everything)</div>
              <div className="text-green-400">$ cd server && bash setup.sh</div>
              <div className="mt-4 text-slate-500"># Start the backend</div>
              <div className="text-green-400">$ npm start</div>
              <div className="mt-4 text-slate-500"># Or run manually with custom settings</div>
              <div className="text-green-400">$ OLLAMA_MODEL=phi3:mini WHISPER_MODEL=small npm start</div>
              <div className="mt-4 text-slate-500"># Available local models (3-4GB RAM):</div>
              <div className="text-slate-400">#   qwen2.5:3b    (~2GB) — Best balance</div>
              <div className="text-slate-400">#   qwen2.5:1.5b  (~1GB) — Faster</div>
              <div className="text-slate-400">#   tinyllama     (~600MB) — Fastest</div>
              <div className="text-slate-400">#   phi3:mini     (~2.3GB) — Good quality</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
