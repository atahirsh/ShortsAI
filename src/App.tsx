import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ModelManager from './components/ModelManager';
import Generator from './components/Generator';
import Features from './components/Features';
import Comparison from './components/Comparison';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [modelsReady, setModelsReady] = useState(false);
  const [modelStatus, setModelStatus] = useState('');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      
      {/* Floating Download Button - Always Visible */}
      {!modelsReady && (
        <a
          href="#models"
          className="fixed bottom-6 right-6 z-50 px-6 py-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-full shadow-2xl shadow-indigo-500/50 transition-all hover:scale-105 animate-pulse"
        >
          <span className="flex items-center gap-2">
            <span className="text-xl">⬇️</span>
            <span>Download AI Models</span>
          </span>
        </a>
      )}
      
      <main>
        <Hero />
        
        {/* Model Manager Section - PROMINENT */}
        <section id="models" className="py-16 relative bg-gradient-to-b from-indigo-950/20 to-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Big attention-grabbing header */}
            <div className="text-center mb-10">
              <div className="inline-block mb-6">
                <div className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-bold shadow-2xl shadow-green-500/50 animate-bounce">
                  👇 START HERE 👇
                </div>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Step 1: Download AI Models
              </h2>
              <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
                Click the <span className="text-indigo-400 font-bold">"⚡ Download All Models"</span> button below to download AI models into your browser. 
                <span className="text-green-400 font-semibold"> One-click, cached forever, 100% private.</span>
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-indigo-400">💡</span>
                <span className="text-sm text-indigo-300">Models are ~500MB total and cached in your browser forever</span>
              </div>
            </div>
            
            {/* Model Manager with extra visual emphasis */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 rounded-3xl blur opacity-20"></div>
              <div className="relative">
                <ModelManager 
                  onModelsReady={setModelsReady} 
                  onStatusChange={setModelStatus}
                />
              </div>
            </div>
            
            {modelStatus && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-indigo-400">ℹ️</span>
                  <span className="text-sm text-indigo-300 font-medium">{modelStatus}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Generator Section */}
        <section id="generator" className="py-12 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Step 2: Generate Shorts
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Upload a video and let the AI find the most viral moments. 
                Everything runs in your browser — your video never leaves your machine.
              </p>
            </div>
            <Generator modelsReady={modelsReady} />
          </div>
        </section>

        <HowItWorks />
        <Features />
        <Comparison />
      </main>
      <Footer />
    </div>
  );
}
