
import React, { useState, useEffect } from 'react';
import { UserAnswers, BoardBlueprint } from './types';
import { Interview } from './components/Interview';
import { PinBoard } from './components/PinBoard';
import { generateBoardBlueprint } from './geminiService';
import { Button } from './components/Button';
import { Sparkles, ArrowRight, Target, Zap, Heart, RotateCcw, Key } from 'lucide-react';

type Screen = 'welcome' | 'interview' | 'loading' | 'board';

const STORAGE_KEY = 'vision_board_2026_blueprint';

// Fix: Removed the custom 'declare global' block for 'window.aistudio' as it conflicts 
// with the existing 'AIStudio' type definition provided by the environment.

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [blueprint, setBlueprint] = useState<BoardBlueprint | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);

  // Persistence and Key Check
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBlueprint(JSON.parse(saved));
        setScreen('board');
      } catch (e) {
        console.error("Failed to load saved blueprint", e);
      }
    }

    const checkKey = async () => {
      // Fix: Access the global aistudio object safely using the window reference.
      // We rely on the platform provided AIStudio types to avoid conflicts.
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    }
    checkKey();
  }, []);

  useEffect(() => {
    if (blueprint) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [blueprint]);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      // Assume success as per instructions to avoid race condition
      setHasKey(true);
    }
  };

  const startInterview = () => {
    if (!hasKey) {
      handleSelectKey();
    } else {
      setScreen('interview');
    }
  };

  const handleInterviewComplete = async (answers: UserAnswers) => {
    setScreen('loading');
    try {
      const result = await generateBoardBlueprint(answers);
      setBlueprint(result);
      setScreen('board');
    } catch (error) {
      console.error("Failed to generate board blueprint", error);
      alert("Something went wrong brewing your vision. Please ensure you have a valid billing account linked to your project.");
      setScreen('interview');
    }
  };

  const resetApp = () => {
    if (confirm("This will delete your current board and start over. Are you sure?")) {
      setBlueprint(null);
      setScreen('welcome');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      {screen === 'welcome' && (
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center mb-16">
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-sm uppercase tracking-widest shadow-sm border border-indigo-100">
              <Sparkles size={16} /> Welcome to 2026
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-6 tracking-tight">
              Build your 2026 <span className="text-indigo-600 italic">Vision Board</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience Pro-grade vision planning. We use high-fidelity AI models to render your future in 1K detail.
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <Button size="lg" onClick={startInterview} className="group px-12 py-5 text-xl font-bold">
                {hasKey ? "Start Your Vision" : "Select Pro Key to Start"} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              {!hasKey && (
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Key size={14} /> 
                  A paid Google Cloud project key is required for Pro Image generation. 
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-indigo-600">Learn more</a>
                </p>
              )}
            </div>
          </div>

          <div className="relative mb-32">
            <div className="absolute -inset-4 bg-indigo-100/50 rounded-[3rem] blur-3xl -z-10"></div>
            <div className="bg-[#2d5a27] rounded-[2.5rem] shadow-2xl p-8 md:p-12 min-h-[500px] relative overflow-hidden pinboard-texture border-8 border-[#3d2b1f]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="bg-[#fffde7] p-6 shadow-xl card-rough-edge rotate-[-2deg] relative group transition-transform hover:rotate-0 duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg z-10 bg-red-500" />
                  <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">My Identity 2026</h3>
                  <p className="font-handwriting text-2xl text-gray-800 leading-tight">
                    "I am a globally connected creator living with radical intention."
                  </p>
                </div>

                <div className="bg-white p-3 shadow-xl card-rough-edge rotate-[1deg] relative group transition-transform hover:rotate-[-1deg] duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg z-10 bg-blue-500" />
                  <img 
                    src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" 
                    alt="Yoga Lifestyle" 
                    className="w-full h-48 object-cover rounded shadow-inner mb-2"
                  />
                  <p className="font-handwriting text-center text-gray-700 text-lg">Daily sunrise yoga in Kyoto</p>
                </div>

                <div className="bg-[#f0fdf4] p-6 shadow-xl card-rough-edge rotate-[-1deg] relative group transition-transform hover:rotate-[2deg] duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg z-10 bg-yellow-500" />
                  <h3 className="text-[10px] font-bold uppercase text-emerald-600 mb-3 tracking-widest">Career Momentum</h3>
                  <p className="font-handwriting text-xl text-gray-800 leading-tight mb-4">
                    Writing 1,000 words of my novel every single morning.
                  </p>
                  <div className="mt-auto pt-3 border-t border-black/5 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">2026 Habit Loop</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
                <Target size={200} className="text-white" />
              </div>
              <div className="absolute bottom-[-20px] left-[-20px] opacity-5 pointer-events-none rotate-12">
                <Heart size={300} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'interview' && (
        <Interview onComplete={handleInterviewComplete} />
      )}

      {screen === 'loading' && (
        <div className="h-screen flex flex-col items-center justify-center text-center px-6">
          <div className="relative mb-12">
            <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-indigo-600 animate-pulse" size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Crafting Your Pro Vision...</h2>
          <p className="text-lg text-gray-500 max-w-md animate-pulse">
            Using Gemini 3 Pro to synthesize your 2026 strategy and render your future in 1K high-definition.
          </p>
        </div>
      )}

      {screen === 'board' && blueprint && (
        <PinBoard 
          blueprint={blueprint} 
          onReset={resetApp}
        />
      )}
    </div>
  );
};

export default App;
