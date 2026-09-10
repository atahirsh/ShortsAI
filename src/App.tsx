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
      <main>
        <Hero />
        
        {/* Model Manager Section */}
        <section id="models" className="py-12 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Step 1: Download AI Models
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                One-click download — models are cached in your browser and run 100% locally. 
                No API keys, no cloud costs, fully private.
              </p>
            </div>
            <ModelManager 
              onModelsReady={setModelsReady} 
              onStatusChange={setModelStatus}
            />
            {modelStatus && (
              <div className="mt-4 text-center text-sm text-slate-400">
                <span className="text-indigo-400">ℹ️</span> {modelStatus}
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
