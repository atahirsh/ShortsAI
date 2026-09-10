import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Generator from './components/Generator';
import Features from './components/Features';
import Comparison from './components/Comparison';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      <main>
        <Hero />
        <Generator />
        <HowItWorks />
        <Features />
        <Comparison />
      </main>
      <Footer />
    </div>
  );
}
