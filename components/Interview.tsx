
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

export const Interview: React.FC<InterviewProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserAnswers>>({
    themeWords: [],
    selectedCategories: [],
    categoryDetails: {},
    visualVibe: 'Minimal',
    imageStyle: 'photoreal',
    layoutStyle: 'clean',
    weeklyHours: 5
  });

  const updateAnswer = <K extends keyof UserAnswers>(key: K, value: UserAnswers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const isCategoryComplete = answers.selectedCategories?.every(cat => 
    answers.categoryDetails?.[cat]?.outcome && 
    answers.categoryDetails?.[cat]?.habit &&
    answers.categoryDetails?.[cat]?.why
  );

  const steps = [
    // Step 0: Identity & Theme
    <div key="step-0" className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Your 2026 Identity</h3>
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
      <h3 className="text-xl font-semibold text-gray-800">What areas of life are you focusing on?</h3>
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

    // Step 2: Adaptive Category Questions
    <div key="step-2" className="space-y-8 max-h-[60vh] overflow-y-auto px-2">
      <h3 className="text-xl font-semibold text-gray-800">Let's go deeper into your choices</h3>
      {answers.selectedCategories?.map(cat => (
        <div key={cat} className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h4 className="text-lg font-bold text-indigo-600 border-b border-gray-100 pb-2">{cat}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">#1 Outcome for {cat}</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Vision statement..."
                value={answers.categoryDetails?.[cat]?.outcome || ''}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), outcome: e.target.value } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Target Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={answers.categoryDetails?.[cat]?.targetDate || ''}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), targetDate: e.target.value } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500 mb-1 block">Why is this important?</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Your motivation..."
                value={answers.categoryDetails?.[cat]?.why || ''}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), why: e.target.value } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Weekly habit?</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. 15 mins daily"
                value={answers.categoryDetails?.[cat]?.habit || ''}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), habit: e.target.value } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Biggest obstacle?</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="What stands in your way?"
                value={answers.categoryDetails?.[cat]?.obstacle || ''}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), obstacle: e.target.value } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Priority (1-10)</label>
              <input 
                type="range" min="1" max="10"
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={answers.categoryDetails?.[cat]?.priority || 5}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), priority: parseInt(e.target.value) } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Confidence (1-10)</label>
              <input 
                type="range" min="1" max="10"
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                value={answers.categoryDetails?.[cat]?.confidence || 5}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), confidence: parseInt(e.target.value) } as any;
                  updateAnswer('categoryDetails', details);
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500 mb-1 block">Support System</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Tools, mentors, etc."
                value={answers.categoryDetails?.[cat]?.support || ''}
                onChange={e => {
                  const details = { ...answers.categoryDetails };
                  details[cat] = { ...(details[cat] || {}), support: e.target.value } as any;
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
      <h3 className="text-xl font-semibold text-gray-800">Constraints & Reality Check</h3>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">Hours per week for self-investment?</label>
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
          placeholder="e.g. Time, Family, Peace..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
          value={answers.protectionList || ''}
          onChange={e => updateAnswer('protectionList', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">What will you say NO to?</label>
        <input 
          type="text" 
          placeholder="e.g. Scrolling, over-commitment..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
          value={answers.sayNoTo || ''}
          onChange={e => updateAnswer('sayNoTo', e.target.value)}
        />
      </div>
    </div>,

    // Step 4: Motivation & Emotions
    <div key="step-4" className="space-y-6">
       <h3 className="text-xl font-semibold text-gray-800">Motivation & Emotional Anchor</h3>
       <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">Describe a perfect day in 2026</label>
        <textarea 
          placeholder="I wake up at..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={answers.perfectDay || ''}
          onChange={e => updateAnswer('perfectDay', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">Emotion to feel most often?</label>
        <input 
          type="text" 
          placeholder="e.g. Radiant energy, deep calm..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
          value={answers.targetEmotion || ''}
          onChange={e => updateAnswer('targetEmotion', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">One fear you're willing to outgrow?</label>
        <input 
          type="text" 
          placeholder="e.g. Fear of failure, social anxiety..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
          value={answers.fearToOutgrow || ''}
          onChange={e => updateAnswer('fearToOutgrow', e.target.value)}
        />
      </div>
    </div>
  ];

  const canProgress = () => {
    if (step === 0) return !!answers.title2026 && (answers.themeWords?.length || 0) >= 1;
    if (step === 1) return (answers.selectedCategories?.length || 0) >= 1;
    if (step === 2) return isCategoryComplete;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
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
