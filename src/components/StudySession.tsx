import React, { useState, useEffect, useRef } from 'react';
import { 
  Flashcard, 
  Deck, 
  ReviewRating 
} from '../types/flashcard';
import { 
  calculateNextReview, 
  formatIntervalPreview 
} from '../lib/spacedRepetition';
import confetti from 'canvas-confetti';
import { 
  RotateCw, 
  Check, 
  X, 
  Sparkles, 
  Award, 
  ArrowLeft, 
  Clock, 
  HelpCircle, 
  Flame, 
  ChevronRight,
  Eye,
  RefreshCcw,
  Zap
} from 'lucide-react';

interface StudySessionProps {
  deck: Deck;
  cards: Flashcard[];
  onReviewCard: (cardId: string, rating: ReviewRating) => void;
  onExit: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  deck,
  cards,
  onReviewCard,
  onExit,
}) => {
  // Study Queue
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([...cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);

  // Review statistics for session
  const [ratingsCount, setRatingsCount] = useState<Record<ReviewRating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentCard = studyQueue[currentIndex] as Flashcard | undefined;
  const isFinished = currentIndex >= studyQueue.length || !currentCard;

  // Session timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime, isFinished]);

  // Celebration confetti upon finish
  useEffect(() => {
    if (isFinished && studyQueue.length > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isFinished, studyQueue.length]);

  // Handle rating a card
  const handleRate = (rating: ReviewRating) => {
    if (!currentCard) return;

    onReviewCard(currentCard.id, rating);
    setRatingsCount((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

    // If "again", re-insert into current session queue at end for repetition!
    if (rating === 'again') {
      setStudyQueue((prev) => [...prev, currentCard]);
    }

    // Reset card state for next
    setIsFlipped(false);
    setSelectedMcqOption(null);
    setCurrentIndex((prev) => prev + 1);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentCard]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Minimum swipe threshold
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
      if (isFlipped) {
        if (diffX < 0) {
          // Swipe left -> Again
          handleRate('again');
        } else {
          // Swipe right -> Good
          handleRate('good');
        }
      } else {
        // Swipe to flip
        setIsFlipped(true);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Helper to render front cloze deletion with concealed slot
  const renderClozeFront = (text: string) => {
    const parts = text.split(/(\{\{c\d+::.*?\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/\{\{c\d+::(.*?)\}\}/);
      if (match) {
        return (
          <span
            key={i}
            className="inline-block px-2.5 py-0.5 mx-1 rounded-md bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700/80 font-bold select-none cursor-pointer hover:bg-amber-300 dark:hover:bg-amber-900 transition-colors"
            title="Click or flip to reveal"
          >
            [ ... ]
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Helper to render back cloze deletion with highlighted solution
  const renderClozeBack = (text: string) => {
    const parts = text.split(/(\{\{c\d+::.*?\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/\{\{c\d+::(.*?)\}\}/);
      if (match) {
        return (
          <span
            key={i}
            className="inline-block px-2 py-0.5 mx-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-extrabold underline decoration-emerald-500 decoration-2"
          >
            {match[1]}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Completion Screen
  if (isFinished) {
    const totalReviews = ratingsCount.again + ratingsCount.hard + ratingsCount.good + ratingsCount.easy;
    const rememberedCount = ratingsCount.good + ratingsCount.easy;
    const accuracy = totalReviews > 0 ? Math.round((rememberedCount / totalReviews) * 100) : 100;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 text-center animate-in fade-in zoom-in-95">
        <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-emerald-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              Study Session Complete!
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Great active retrieval practice. Your next intervals have been scheduled via SM-2.
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
                {studyQueue.length}
              </div>
              <div className="text-xs text-stone-500">Cards Practiced</div>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {accuracy}%
              </div>
              <div className="text-xs text-stone-500">Retention Score</div>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatTimer(elapsedSeconds)}
              </div>
              <div className="text-xs text-stone-500">Duration</div>
            </div>
          </div>

          {/* Ratings breakdown */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Feedback Distribution
            </div>
            <div className="flex items-center justify-center gap-3 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                Again: {ratingsCount.again}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Hard: {ratingsCount.hard}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                Good: {ratingsCount.good}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Easy: {ratingsCount.easy}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setStudyQueue([...cards]);
                setCurrentIndex(0);
                setIsFlipped(false);
                setRatingsCount({ again: 0, hard: 0, good: 0, easy: 0 });
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Study Again</span>
            </button>

            <button
              onClick={onExit}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-amber-600 hover:bg-amber-500 shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Back to Deck Editor</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((currentIndex / studyQueue.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Session Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Session</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-medium text-stone-600 dark:text-stone-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </span>
          <span className="font-mono bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700">
            Card {currentIndex + 1} of {studyQueue.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="w-full perspective-1000 min-h-[380px] sm:min-h-[420px] cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] transition-transform duration-500 ease-out preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-lg flex flex-col justify-between">
            {/* Top metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    currentCard.type === 'cloze'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : currentCard.type === 'mcq'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {currentCard.type}
                </span>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    currentCard.difficulty === 'easy'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : currentCard.difficulty === 'medium'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {currentCard.difficulty}
                </span>
              </div>

              <div className="text-[11px] text-stone-400 font-mono">
                [Space] to flip
              </div>
            </div>

            {/* Front Content */}
            <div className="my-auto py-4 space-y-4">
              <div className="text-lg sm:text-2xl font-bold text-stone-900 dark:text-stone-100 leading-relaxed text-center sm:text-left">
                {currentCard.type === 'cloze' ? renderClozeFront(currentCard.front) : currentCard.front}
              </div>

              {/* MCQ Options on front */}
              {currentCard.type === 'mcq' && currentCard.options && (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2"
                  onClick={(e) => e.stopPropagation()} // don't flip immediately when clicking option
                >
                  {currentCard.options.map((option, idx) => {
                    const isSelected = selectedMcqOption === idx;
                    const isCorrect = idx === currentCard.correctOptionIndex;
                    const showFeedback = selectedMcqOption !== null;

                    let btnStyle = 'border-stone-200 dark:border-stone-700 hover:border-amber-400 bg-stone-50/50 dark:bg-stone-800/50';
                    if (showFeedback) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold';
                      } else if (isSelected) {
                        btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 line-through';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedMcqOption(idx)}
                        className={`text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-2.5 ${btnStyle}`}
                      >
                        <span className="font-mono font-bold w-4 shrink-0 text-stone-400">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="flex-1">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom cue */}
            <div className="flex items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-800/80">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tap card or press Space to reveal answer</span>
              </span>
              <span className="hidden sm:inline text-[11px]">
                Mobile: swipe left/right to grade
              </span>
            </div>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white dark:bg-stone-900 rounded-3xl border-2 border-amber-500/40 dark:border-amber-500/30 p-6 sm:p-10 shadow-xl flex flex-col justify-between">
            {/* Top metadata */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Solution & Retrieval Target
              </span>
              <div className="text-[11px] text-stone-400 font-mono">
                Press [1 - 4] to rate
              </div>
            </div>

            {/* Back Content */}
            <div className="my-auto py-3 space-y-4">
              <div className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 leading-relaxed text-center sm:text-left">
                {currentCard.type === 'cloze' ? renderClozeBack(currentCard.front) : currentCard.back}
              </div>

              {currentCard.explanation && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  <strong className="text-amber-800 dark:text-amber-300">Explanation: </strong>
                  {currentCard.explanation}
                </div>
              )}
            </div>

            {/* Spaced Repetition Buttons Bar */}
            <div
              className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800"
              onClick={(e) => e.stopPropagation()} // don't flip back when rating
            >
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider text-center">
                Evaluate Retention (SM-2 Interval):
              </div>

              <div className="grid grid-cols-4 gap-2">
                {/* 1. Again */}
                <button
                  type="button"
                  onClick={() => handleRate('again')}
                  className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 transition-all active:scale-95"
                >
                  <span className="text-[10px] font-mono opacity-60">[1]</span>
                  <span className="text-xs sm:text-sm font-bold">Again</span>
                  <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
                    {formatIntervalPreview(currentCard.repetition, 'again')}
                  </span>
                </button>

                {/* 2. Hard */}
                <button
                  type="button"
                  onClick={() => handleRate('hard')}
                  className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 transition-all active:scale-95"
                >
                  <span className="text-[10px] font-mono opacity-60">[2]</span>
                  <span className="text-xs sm:text-sm font-bold">Hard</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    {formatIntervalPreview(currentCard.repetition, 'hard')}
                  </span>
                </button>

                {/* 3. Good */}
                <button
                  type="button"
                  onClick={() => handleRate('good')}
                  className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 transition-all active:scale-95"
                >
                  <span className="text-[10px] font-mono opacity-60">[3]</span>
                  <span className="text-xs sm:text-sm font-bold">Good</span>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                    {formatIntervalPreview(currentCard.repetition, 'good')}
                  </span>
                </button>

                {/* 4. Easy */}
                <button
                  type="button"
                  onClick={() => handleRate('easy')}
                  className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 transition-all active:scale-95"
                >
                  <span className="text-[10px] font-mono opacity-60">[4]</span>
                  <span className="text-xs sm:text-sm font-bold">Easy</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    {formatIntervalPreview(currentCard.repetition, 'easy')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Strip */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-stone-500 dark:text-stone-400 pt-2">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">Space</kbd>
          Flip Card
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">1</kbd> Again
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">2</kbd> Hard
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">3</kbd> Good
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">4</kbd> Easy
        </span>
      </div>
    </div>
  );
};
