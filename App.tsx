
import React, { useState } from 'react';
import { UserAnswers, BoardBlueprint } from './types';
import { Interview } from './components/Interview';
import { PinBoard } from './components/PinBoard';
import { generateBoardBlueprint } from './geminiService';
import { Button } from './components/Button';
import { Sparkles, ArrowRight } from 'lucide-react';

type Screen = 'welcome' | 'interview' | 'loading' | 'board';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [blueprint, setBlueprint] = useState<BoardBlueprint | null>(null);

  const startInterview = () => setScreen('interview');

  const handleInterviewComplete = async (answers: UserAnswers) => {
    setScreen('loading');
    try {
      const result = await generateBoardBlueprint(answers);
      setBlueprint(result);
      setScreen('board');
    } catch (error) {
      console.error("Failed to generate board blueprint", error);
      alert("Something went wrong brewing your vision. Please try again.");
      setScreen('interview');
    }
  };

  return (
    <div className="min-h-screen">
      {screen === 'welcome' && (
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-sm uppercase tracking-widest shadow-sm">
            <Sparkles size={16} /> Welcome to 2026
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-6 tracking-tight">
            Build your 2026 <span className="text-indigo-600 italic">Vision Board</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Turn vague resolutions into a visual, actionable plan. Answer a few questions, get a tactile board you can edit anytime.
          </p>
          <Button size="lg" onClick={startInterview} className="group px-12 py-5 text-xl font-bold">
            Start Journey <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm text-left">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Interview</h3>
              <p className="text-gray-500">We ask deep questions to uncover what truly matters for your next year.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm text-left">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Visualizer</h3>
              <p className="text-gray-500">Nano Banana AI generates custom high-quality images for every life goal.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm text-left">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Tactile Editor</h3>
              <p className="text-gray-500">Drag, pin, and edit your board like a real pinboard in your workspace.</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Crafting Your Vision...</h2>
          <p className="text-lg text-gray-500 max-w-md animate-pulse">
            We're analyzing your answers, generating your 2026 blueprint, and preparing your workspace. Just a moment.
          </p>
          <div className="mt-8 space-y-2">
            <p className="text-sm text-gray-400">Summarizing your core identity...</p>
            <p className="text-sm text-gray-400">Plotting category milestones...</p>
            <p className="text-sm text-gray-400">Staging the green felt pinboard...</p>
          </div>
        </div>
      )}

      {screen === 'board' && blueprint && (
        <PinBoard blueprint={blueprint} onUpdate={setBlueprint} />
      )}
    </div>
  );
};

export default App;
