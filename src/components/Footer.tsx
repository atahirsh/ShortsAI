export default function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-[#020617]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                AI YouTube Shorts Generator
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Open-source alternative to Opus Clip, Vidyo.ai, Klap & SubMagic. 
              Turn long-form YouTube videos into viral 9:16 shorts using LLM highlight 
              detection and Whisper transcription — free, no watermarks, no per-clip credits.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a
                href="https://github.com/Anil-matcha/awesome-generative-ai-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                More AI Apps →
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Project</h4>
            <ul className="space-y-2">
              {[
                { label: 'GitHub Repository', href: 'https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator' },
                { label: 'Issues & Bugs', href: 'https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator/issues' },
                { label: 'Contributing', href: 'https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator#contributing' },
                { label: 'MIT License', href: 'https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator/blob/main/LICENSE' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Related Projects</h4>
            <ul className="space-y-2">
              {[
                { label: 'AI Influencer Generator', href: 'https://github.com/SamurAIGPT/AI-Influencer-Generator' },
                { label: 'Text to Video AI', href: 'https://github.com/SamurAIGPT/Text-To-Video-AI' },
                { label: 'Faceless Video Generator', href: 'https://github.com/SamurAIGPT/Faceless-Video-Generator' },
                { label: 'AI B-roll Generator', href: 'https://github.com/Anil-matcha/AI-B-roll' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2024 AI YouTube Shorts Generator. Open source under MIT License.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Built with Python, Whisper & GPT
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
