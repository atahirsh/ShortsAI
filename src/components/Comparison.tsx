export default function Comparison() {
  const comparisons = [
    { feature: 'Price', us: 'Free + open source', competitors: '$20–$300/month' },
    { feature: 'Per-clip credits', us: 'None — unlimited', competitors: 'Monthly minute caps' },
    { feature: 'Watermarks', us: 'Never', competitors: 'On free tiers' },
    { feature: 'Highlight algorithm', us: 'Fully editable', competitors: 'Black box' },
    { feature: 'Output format', us: 'Any ratio, any resolution', competitors: 'Locked presets' },
    { feature: 'Batch processing', us: 'Entire URL lists', competitors: 'Manual one-by-one' },
    { feature: 'JSON / API output', us: 'Built-in', competitors: 'Limited or paid tier' },
    { feature: 'Self-hostable', us: 'Yes — your machine', competitors: 'SaaS only' },
    { feature: 'White-label', us: 'Yes — MIT licensed', competitors: 'No' },
  ];

  return (
    <section id="comparison" className="py-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why Choose This Over Paid Tools?
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Compare our open-source solution against Opus Clip, Vidyo.ai, Klap, and SubMagic.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Feature</th>
                  <th className="text-center px-6 py-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-pink-500/20 border border-indigo-500/30">
                      <span className="text-sm font-bold text-indigo-300">ShortsAI</span>
                    </div>
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-400">
                    Opus Clip / Vidyo.ai / Klap
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-300">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-400 font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {row.us}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-sm text-red-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {row.competitors}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing callout */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">ShortsAI (This Project)</h3>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">Free</div>
            <p className="text-sm text-slate-400 mb-4">
              Open source, MIT licensed. Pay only for API usage if you choose cloud mode. 
              No subscriptions, no limits, no watermarks.
            </p>
            <ul className="space-y-2">
              {['Unlimited clips', 'No watermarks', 'Self-hostable', 'Full source code'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-6 border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Paid Alternatives</h3>
            </div>
            <div className="text-3xl font-bold text-red-400 mb-2">$20–$300<span className="text-lg text-slate-500">/mo</span></div>
            <p className="text-sm text-slate-400 mb-4">
              Monthly subscriptions with minute caps, overage fees, and watermarks on free tiers. 
              Your videos sit on their servers.
            </p>
            <ul className="space-y-2">
              {['Monthly subscriptions', 'Per-clip credits', 'Watermarks on free tier', 'No self-hosting'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
