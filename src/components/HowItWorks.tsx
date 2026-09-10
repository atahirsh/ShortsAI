export default function HowItWorks() {
  const pipelineSteps = [
    {
      step: 1,
      icon: '📥',
      title: 'Download',
      description: 'Fetches the source video from YouTube using yt-dlp or MuAPI',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: 2,
      icon: '🎤',
      title: 'Transcribe (Local)',
      description: 'faster-whisper runs on your CPU — produces timestamped transcript with word-level segments. No GPU needed!',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      step: 3,
      icon: '🧠',
      title: 'Content Detection (Local)',
      description: 'Local LLM (Ollama) classifies video type (podcast, tutorial, vlog) to tune the analysis',
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: 4,
      icon: '🔥',
      title: 'Highlight Ranking (Local)',
      description: 'Local LLM scores hooks, emotional peaks, revelations & quotables using the virality framework',
      color: 'from-pink-500 to-rose-500',
    },
    {
      step: 5,
      icon: '♻️',
      title: 'Deduplication',
      description: 'Overlapping candidates are collapsed by score to avoid duplicates',
      color: 'from-rose-500 to-orange-500',
    },
    {
      step: 6,
      icon: '🎬',
      title: 'Auto-Crop',
      description: 'Each highlight is rendered as a vertical short with face tracking',
      color: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Our AI pipeline processes your video through 6 intelligent steps to extract 
            the most viral-worthy moments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelineSteps.map((step) => (
            <div
              key={step.step}
              className="glass-card rounded-2xl p-6 hover:border-indigo-500/30 transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step {step.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Virality Criteria */}
        <div className="mt-16 glass-card rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            🧠 Virality Detection Framework (Runs 100% Locally)
          </h3>
          <p className="text-slate-400 text-center mb-8 max-w-2xl mx-auto">
            A local LLM (via Ollama) analyzes each moment through 8 virality signals to find clips that 
            will actually perform on social media — not just "interesting" segments. 
            <span className="text-green-400 font-medium"> No API keys, no cloud costs, fully private.</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '🎣', label: 'Hook Moments', desc: 'Attention-grabbing openings' },
              { icon: '💥', label: 'Emotional Peaks', desc: 'High-arousal moments' },
              { icon: '💣', label: 'Opinion Bombs', desc: 'Bold, controversial takes' },
              { icon: '💡', label: 'Revelations', desc: 'Surprising insights' },
              { icon: '⚡', label: 'Conflict', desc: 'Tension & disagreement' },
              { icon: '💬', label: 'Quotable Lines', desc: 'Shareable one-liners' },
              { icon: '📖', label: 'Story Peaks', desc: 'Narrative climaxes' },
              { icon: '🛠️', label: 'Practical Value', desc: 'Actionable takeaways' },
            ].map((criterion) => (
              <div key={criterion.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-xl">{criterion.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{criterion.label}</div>
                  <div className="text-xs text-slate-500">{criterion.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
