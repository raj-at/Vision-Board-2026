
import React, { useState } from 'react';
import { UserAnswers, VisualVibe, ImageStyle } from '../types';
import { Button } from './Button';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface InterviewProps {
  onComplete: (answers: UserAnswers) => void;
}

const CATEGORIES = [
  "Health & Fitness", "Career / Business", "Money / Wealth", "Relationships", 
  "Travel / Lifestyle", "Personal Growth", "Spiritual / Mental health", 
  "Creativity / Learning", "Home / Environment"
];

const VIBES: VisualVibe[] = ['Minimal', 'Cinematic', 'Cozy', 'Luxury', 'Nature', 'Futuristic', 'Street', 'Corporate'];
const STYLES: ImageStyle[] = ['photoreal', 'illustration', 'collage', 'paper cut', '3D'];

export const Interview: React.FC<InterviewProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserAnswers>>({
    themeWords: [],
    selectedCategories: [],
    categoryDetails: {},
    visualVibe: 'Cinematic',
    imageStyle: 'photoreal',
    layoutStyle: 'messy'
  });

  const updateAnswer = <K extends keyof UserAnswers>(key: K, value: UserAnswers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const isCategoryComplete = answers.selectedCategories?.every(cat => 
    answers.categoryDetails?.[cat]?.outcome && answers.categoryDetails?.[cat]?.habit
  );

  const steps = [
    // Step 0: Identity
    <div key="step-0" className="space-y-6">
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">If 2026 had a title, what would it be?</label>
        <input 
          type="text" 
          placeholder="e.g. The Year of Radical Growth"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={answers.title2026 || ''}
          onChange={e => updateAnswer('title2026', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">Pick 3 words for your ideal 2026</label>
        <div className="flex flex-wrap gap-2">
          {['Freedom', 'Discipline', 'Joy', 'Impact', 'Peace', 'Abundance', 'Adventure', 'Clarity', 'Health'].map(word => (
            <button
              key={word}
              onClick={() => {
                const current = answers.themeWords || [];
                if (current.includes(word)) updateAnswer('themeWords', current.filter(w => w !== word));
                else if (current.length < 3) updateAnswer('themeWords', [...current, word]);
              }}
              className={`px-4 py-2 rounded-full border transition-all ${
                answers.themeWords?.includes(word) 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400'
              }`}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">What do you want to be known for?</label>
        <textarea 
          placeholder="I want to be known for..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
          value={answers.identityGoal || ''}
          onChange={e => updateAnswer('identityGoal', e.target.value)}
        />
      </div>
    </div>,

    // Step 1: Categories
    <div key="step-1" className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Select categories relevant to you</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => {
              const current = answers.selectedCategories || [];
              if (current.includes(cat)) updateAnswer('selectedCategories', current.filter(c => c !== cat));
              else updateAnswer('selectedCategories', [...current, cat]);
            }}
            className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all text-left ${
              answers.selectedCategories?.includes(cat) 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300'
            }`}
          >
            <span>{cat}</span>
            {answers.selectedCategories?.includes(cat) && <Check size={18} className="text-emerald-500" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Adaptive Category Questions (simplified for MVP, would normally loop)
    <div key="step-2" className="space-y-8 max-h-[60vh] overflow-y-auto px-2">
      {answers.selectedCategories?.map(cat => (
        <div key={cat} className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="text-lg font-bold text-indigo-600">{cat}</h4>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">What's your #1 outcome for {cat}?</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
              placeholder="Your vision..."
              value={answers.categoryDetails?.[cat]?.outcome || ''}
              onChange={e => {
                const details = { ...answers.categoryDetails };
                details[cat] = { ...(details[cat] || {}), outcome: e.target.value } as any;
                updateAnswer('categoryDetails', details);
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Smallest habit that moves you forward?</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
              placeholder="e.g. 10 min walk daily"
              value={answers.categoryDetails?.[cat]?.habit || ''}
              onChange={e => {
                const details = { ...answers.categoryDetails };
                details[cat] = { ...(details[cat] || {}), habit: e.target.value } as any;
                updateAnswer('categoryDetails', details);
              }}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Priority (1-10)</label>
              <input 
                type="range" min="1" max="10" 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={answers.categoryDetails?.[cat]?.priority || 5}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), priority: parseInt(e.target.value) } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Confidence (1-10)</label>
              <input 
                type="range" min="1" max="10" 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                value={answers.categoryDetails?.[cat]?.confidence || 5}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), confidence: parseInt(e.target.value) } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>,

    // Step 3: Reality Check
    <div key="step-3" className="space-y-6">
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">How many hours per week can you invest in yourself?</label>
        <div className="flex items-center gap-4">
          <input 
            type="range" min="1" max="40" 
            className="flex-1 h-3 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            value={answers.weeklyHours || 5}
            onChange={e => updateAnswer('weeklyHours', parseInt(e.target.value))}
          />
          <span className="text-2xl font-bold text-indigo-600 w-12">{answers.weeklyHours || 5}h</span>
        </div>
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">What must you protect?</label>
        <input 
          type="text" 
          placeholder="e.g. My morning peace, family dinners..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
          value={answers.protectionList || ''}
          onChange={e => updateAnswer('protectionList', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">What should you say NO to in 2026?</label>
        <input 
          type="text" 
          placeholder="e.g. Aimless scrolling, over-commitment..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
          value={answers.sayNoTo || ''}
          onChange={e => updateAnswer('sayNoTo', e.target.value)}
        />
      </div>
    </div>,

    // Step 4: Motivation
    <div key="step-4" className="space-y-6">
       <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">Describe a perfect day in your 2026 life</label>
        <textarea 
          placeholder="Waking up at 6am to the sound of..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 h-24"
          value={answers.perfectDay || ''}
          onChange={e => updateAnswer('perfectDay', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">What emotion do you want to feel most often?</label>
        <input 
          type="text" 
          placeholder="e.g. Radiant energy, deep calm..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none"
          value={answers.targetEmotion || ''}
          onChange={e => updateAnswer('targetEmotion', e.target.value)}
        />
      </div>
    </div>,

    // Step 5: Visual Prefs
    <div key="step-5" className="space-y-6">
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">Pick a visual vibe</label>
        <div className="flex flex-wrap gap-2">
          {VIBES.map(v => (
            <button
              key={v}
              onClick={() => updateAnswer('visualVibe', v)}
              className={`px-4 py-2 rounded-full border transition-all ${
                answers.visualVibe === v
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">Image style</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button
              key={s}
              onClick={() => updateAnswer('imageStyle', s)}
              className={`px-4 py-2 rounded-full border transition-all ${
                answers.imageStyle === s
                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-600 hover:border-emerald-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">Board layout preference</label>
        <div className="flex gap-4">
          <button 
            onClick={() => updateAnswer('layoutStyle', 'clean')}
            className={`flex-1 py-4 rounded-xl border text-center font-medium ${answers.layoutStyle === 'clean' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white'}`}
          >
            Clean Grid
          </button>
          <button 
            onClick={() => updateAnswer('layoutStyle', 'messy')}
            className={`flex-1 py-4 rounded-xl border text-center font-medium ${answers.layoutStyle === 'messy' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white'}`}
          >
            Messy Scrapbook
          </button>
        </div>
      </div>
    </div>
  ];

  const canProgress = () => {
    if (step === 0) return answers.title2026 && (answers.themeWords?.length || 0) >= 1;
    if (step === 1) return (answers.selectedCategories?.length || 0) >= 1;
    if (step === 2) return isCategoryComplete;
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase">Step {step + 1} of {steps.length}</span>
          <span className="text-sm text-gray-400">{Math.round(((step + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-500 ease-out" 
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="min-h-[400px]">
        {steps[step]}
      </div>

      <div className="mt-12 flex justify-between gap-4">
        {step > 0 ? (
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
            <ChevronLeft size={20} /> Back
          </Button>
        ) : <div />}
        
        {step < steps.length - 1 ? (
          <Button 
            disabled={!canProgress()} 
            onClick={handleNext} 
            className="flex items-center gap-2"
          >
            Continue <ChevronRight size={20} />
          </Button>
        ) : (
          <Button 
            onClick={() => onComplete(answers as UserAnswers)}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg text-white"
          >
            Build My 2026 Board
          </Button>
        )}
      </div>
    </div>
  );
};
