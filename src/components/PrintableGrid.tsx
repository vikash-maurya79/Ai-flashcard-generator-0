import React from 'react';
import { Deck, Flashcard } from '../types/flashcard';
import { Printer, ArrowLeft, Scissors } from 'lucide-react';
import { triggerPrintSheet } from '../lib/exportUtils';

interface PrintableGridProps {
  deck: Deck;
  cards: Flashcard[];
  onBack: () => void;
}

export const PrintableGrid: React.FC<PrintableGridProps> = ({
  deck,
  cards,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 p-4 sm:p-8">
      {/* Floating Toolbar (Hidden during print) */}
      <div className="no-print sticky top-4 z-40 max-w-4xl mx-auto mb-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deck Editor</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500 hidden sm:inline">
            Print-Ready Flashcard Cutting Grid (2-up folding format)
          </span>
          <button
            onClick={triggerPrintSheet}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print to PDF / Paper</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Sheet Container */}
      <div className="max-w-4xl mx-auto bg-white text-stone-900 p-8 rounded-3xl shadow-sm border border-stone-200 print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Print Header */}
        <div className="border-b-2 border-stone-800 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-stone-900">
              {deck.title}
            </h1>
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-1 border border-stone-800 rounded-md">
              {deck.subject}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-600 mt-2">
            <span>
              {cards.length} Flashcards &bull; Target: {deck.targetAudience.replace('_', ' ')}
            </span>
            <span className="font-mono text-[11px]">
              RecallForge Active Recall Sheet &bull; {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Cutting Grid */}
        <div className="space-y-4">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="print-break-inside-avoid border-2 border-dashed border-stone-400 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative"
            >
              {/* Scissors cut indicator */}
              <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] text-stone-500 font-mono flex items-center gap-1 border border-stone-300 rounded">
                <Scissors className="w-3 h-3 text-stone-400" />
                <span>Card #{idx + 1} &bull; Fold on center or cut</span>
              </div>

              {/* Front Side */}
              <div className="border-r-0 md:border-r md:border-dashed md:border-stone-300 pr-0 md:pr-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    Front (Prompt)
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                    {card.type}
                  </span>
                </div>
                <div className="text-sm font-semibold text-stone-900 leading-snug">
                  {card.front}
                </div>

                {card.type === 'mcq' && card.options && (
                  <div className="text-xs space-y-1 pt-1 text-stone-700">
                    {card.options.map((opt, oIdx) => (
                      <div key={oIdx} className="font-mono text-[11px]">
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Back Side */}
              <div className="space-y-2 pl-0 md:pl-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    Back (Answer)
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                    {card.difficulty}
                  </span>
                </div>
                <div className="text-sm font-bold text-stone-900 leading-snug">
                  {card.back}
                </div>
                {card.explanation && (
                  <div className="text-[11px] text-stone-600 italic bg-stone-50 p-2 rounded border border-stone-200">
                    Note: {card.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Print Footer */}
        <div className="mt-8 pt-4 border-t border-stone-300 text-center text-xs text-stone-500 font-mono">
          Generated with RecallForge &bull; Minimum Information Principle &bull; Spaced Repetition Ready
        </div>
      </div>
    </div>
  );
};
