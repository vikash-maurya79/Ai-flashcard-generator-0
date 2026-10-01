import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle2, Clock, Zap } from 'lucide-react';

const GENERATION_STEPS = [
  'Ingesting & tokenizing source material...',
  'Extracting key conceptual entities & mechanisms...',
  'Applying Minimum Information Principle (atomic facts)...',
  'Crafting active-recall prompts and cloze deletions...',
  'Synthesizing diagnostic explanations & distractors...',
  'Assembling your spaced-repetition deck...',
];

const ACTIVE_RECALL_TIPS = [
  'Tip: The Minimum Information Principle states that simpler, atomic cards yield significantly higher retention and faster review speeds than complex paragraph cards.',
  'Tip: Spaced repetition counters the Ebbinghaus Forgetting Curve by exponentially spacing review intervals each time you recall a fact successfully.',
  'Tip: Cloze deletions ({{c1::term}}) are ideal for memorizing precise enzyme names, statutory dates, or technical syntax in context.',
  'Tip: During study mode, always attempt to retrieve the answer mentally BEFORE flipping the card.',
];

export const GeneratingSkeleton: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ACTIVE_RECALL_TIPS.length);
    }, 4500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(tipInterval);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-fadeIn">
      {/* Central Pulsing Card */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10 relative">
          <Brain className="w-10 h-10 animate-bounce text-amber-500" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          Synthesizing Atomic Flashcards
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
          Our AI engine is parsing your notes with strict adherence to cognitive learning principles.
        </p>
      </div>

      {/* Stepper Progress Card */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            AI Parsing Pipeline
          </span>
          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
            Step {currentStepIndex + 1} of {GENERATION_STEPS.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((currentStepIndex + 1) / GENERATION_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="space-y-2.5 pt-2">
          {GENERATION_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step}
                className={`flex items-center gap-3 text-xs sm:text-sm transition-all duration-300 ${
                  isCurrent
                    ? 'text-amber-600 dark:text-amber-400 font-bold translate-x-1'
                    : isCompleted
                    ? 'text-stone-700 dark:text-stone-300'
                    : 'text-stone-400 dark:text-stone-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-700 shrink-0" />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skeleton Card Grid Shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-stone-200 dark:bg-stone-800 rounded-md animate-pulse" />
              <div className="h-4 w-12 bg-amber-100 dark:bg-amber-950/60 rounded-md animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded-md animate-pulse" />
              <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-800 rounded-md animate-pulse" />
            </div>
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
              <div className="h-3 w-1/3 bg-stone-100 dark:bg-stone-800 rounded-md animate-pulse" />
              <div className="h-3 w-5/6 bg-stone-100 dark:bg-stone-800 rounded-md animate-pulse" />
            </div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
          </div>
        ))}
      </div>

      {/* Rotating Learning Tip Banner */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3">
        <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
          {ACTIVE_RECALL_TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
};
