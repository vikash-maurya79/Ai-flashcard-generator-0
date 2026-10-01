import React, { useState } from 'react';
import { 
  Flashcard, 
  Deck, 
  CardType, 
  CardDifficulty 
} from '../types/flashcard';
import { 
  Edit3, 
  Trash2, 
  Split, 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Download, 
  Tag, 
  Check, 
  HelpCircle,
  Layers,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import { createDefaultRepetition } from '../lib/spacedRepetition';

interface CardEditorGridProps {
  deck: Deck;
  cards: Flashcard[];
  onUpdateCard: (card: Flashcard) => void;
  onDeleteCard: (cardId: string) => void;
  onAddCard: (card: Flashcard) => void;
  onSplitCard: (card: Flashcard) => Promise<void>;
  onRegenerateCard: (card: Flashcard, instruction?: string) => Promise<void>;
  onStartStudy: () => void;
  onOpenExport: () => void;
  isProcessingCardId: string | null;
}

export const CardEditorGrid: React.FC<CardEditorGridProps> = ({
  deck,
  cards,
  onUpdateCard,
  onDeleteCard,
  onAddCard,
  onSplitCard,
  onRegenerateCard,
  onStartStudy,
  onOpenExport,
  isProcessingCardId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CardType>('all');
  const [diffFilter, setDiffFilter] = useState<'all' | CardDifficulty>('all');

  // Modal State for Edit / New Card
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isNewCard, setIsNewCard] = useState(false);

  // Single card AI prompt modal
  const [refineModalCard, setRefineModalCard] = useState<Flashcard | null>(null);
  const [refineInstruction, setRefineInstruction] = useState('');

  // Filter cards
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.explanation && card.explanation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      card.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || card.type === typeFilter;
    const matchesDiff = diffFilter === 'all' || card.difficulty === diffFilter;

    return matchesSearch && matchesType && matchesDiff;
  });

  const handleOpenNewCard = () => {
    const newCard: Flashcard = {
      id: `manual-card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      deckId: deck.id,
      front: '',
      back: '',
      explanation: '',
      type: 'basic',
      tags: [deck.subject || 'General'],
      difficulty: 'medium',
      repetition: createDefaultRepetition(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setIsNewCard(true);
    setEditingCard(newCard);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    if (isNewCard) {
      onAddCard(editingCard);
    } else {
      onUpdateCard(editingCard);
    }
    setEditingCard(null);
    setIsNewCard(false);
  };

  const renderClozePreview = (text: string) => {
    const parts = text.split(/(\{\{c\d+::.*?\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/\{\{c\d+::(.*?)\}\}/);
      if (match) {
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold"
          >
            [{match[1]}]
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Deck Header Bar */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {deck.title}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800/60">
              {deck.subject}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 capitalize">
              {deck.targetAudience.replace('_', ' ')}
            </span>
          </div>
          {deck.description && (
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {deck.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={onStartStudy}
            disabled={cards.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Study Session ({cards.length})</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700"
          >
            <Download className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <span>Export Deck</span>
          </button>

          <button
            onClick={handleOpenNewCard}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-100/80 dark:bg-stone-900/80 p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts, answers, or tags..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-stone-800 dark:text-stone-200 placeholder-stone-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Type filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
            <span className="text-stone-400 px-1 text-[11px] font-semibold">Type:</span>
            {(['all', 'basic', 'cloze', 'mcq'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded-lg capitalize transition-colors ${
                  typeFilter === t
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
            <span className="text-stone-400 px-1 text-[11px] font-semibold">Diff:</span>
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDiffFilter(d)}
                className={`px-2 py-0.5 rounded-lg capitalize transition-colors ${
                  diffFilter === d
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Count Summary */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
        <span>
          Showing <strong>{filteredCards.length}</strong> of <strong>{cards.length}</strong> atomic cards
        </span>
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          Minimum Information Principle Active
        </span>
      </div>

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
          <Layers className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">
            No cards found matching your query
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try adjusting your search keywords or filter pills, or add a new card manually.
          </p>
          <button
            onClick={handleOpenNewCard}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500"
          >
            Create New Card
          </button>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card, index) => {
          const isProcessing = isProcessingCardId === card.id;

          return (
            <div
              key={card.id}
              className={`bg-white dark:bg-stone-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                isProcessing
                  ? 'border-amber-400 ring-2 ring-amber-400/30 opacity-75'
                  : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              <div className="space-y-3">
                {/* Card Top Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-stone-400">
                      #{index + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        card.type === 'cloze'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : card.type === 'mcq'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {card.type}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      card.difficulty === 'easy'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : card.difficulty === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {card.difficulty}
                  </span>
                </div>

                {/* Front Prompt */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Prompt (Front)
                  </div>
                  <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                    {card.type === 'cloze' ? renderClozePreview(card.front) : card.front}
                  </div>

                  {/* MCQ Options preview */}
                  {card.type === 'mcq' && card.options && (
                    <div className="mt-2 space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800/80">
                      {card.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`text-xs px-2 py-1 rounded-md flex items-center gap-1.5 ${
                            optIdx === card.correctOptionIndex
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/60'
                              : 'text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/40'
                          }`}
                        >
                          <span className="font-mono text-[10px]">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                          {optIdx === card.correctOptionIndex && (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Back Answer */}
                <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Answer (Back)
                  </div>
                  <div className="text-xs text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
                    {card.back}
                  </div>

                  {card.explanation && (
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg mt-1 border border-stone-100 dark:border-stone-800/60">
                      Note: {card.explanation}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {card.tags && card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setRefineModalCard(card);
                      setRefineInstruction('');
                    }}
                    title="Regenerate single card with AI"
                    disabled={isProcessing}
                    className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Refine</span>
                  </button>

                  <button
                    onClick={() => onSplitCard(card)}
                    title="Split into two atomic cards (Minimum Information Principle)"
                    disabled={isProcessing}
                    className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors flex items-center gap-1 font-medium"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Split 2x</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsNewCard(false);
                      setEditingCard({ ...card });
                    }}
                    title="Edit card"
                    className="p-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteCard(card.id)}
                    title="Delete card"
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / New Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                {isNewCard ? 'Create Atomic Flashcard' : 'Edit Flashcard'}
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-6 space-y-4">
              {/* Type & Difficulty Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Card Type
                  </label>
                  <select
                    value={editingCard.type}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        type: e.target.value as CardType,
                      })
                    }
                    className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2 mt-1 text-stone-800 dark:text-stone-200"
                  >
                    <option value="basic">Basic (Front/Back)</option>
                    <option value="cloze">Cloze Deletion (&#123;&#123;c1::term&#125;&#125;)</option>
                    <option value="mcq">Multiple Choice (MCQ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Difficulty
                  </label>
                  <select
                    value={editingCard.difficulty}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        difficulty: e.target.value as CardDifficulty,
                      })
                    }
                    className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2 mt-1 text-stone-800 dark:text-stone-200"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Front Prompt */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>Prompt / Question (Front)</span>
                  {editingCard.type === 'cloze' && (
                    <span className="text-[10px] text-amber-600 font-mono">
                      Wrap hidden word: &#123;&#123;c1::term&#125;&#125;
                    </span>
                  )}
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingCard.front}
                  onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })}
                  className="w-full text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 mt-1 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500/50"
                  placeholder={
                    editingCard.type === 'cloze'
                      ? 'The rate-limiting enzyme of glycolysis is {{c1::PFK-1}}.'
                      : 'What is the rate-limiting enzyme of glycolysis?'
                  }
                />
              </div>

              {/* Back Answer */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Target Answer (Back)
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingCard.back}
                  onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })}
                  className="w-full text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 mt-1 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500/50"
                  placeholder="Phosphofructokinase-1 (PFK-1)"
                />
              </div>

              {/* MCQ Options (if type === 'mcq') */}
              {editingCard.type === 'mcq' && (
                <div className="space-y-2 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    MCQ Choices (Select radio for correct answer)
                  </label>
                  {([0, 1, 2, 3] as const).map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct-option"
                        checked={editingCard.correctOptionIndex === idx}
                        onChange={() => setEditingCard({ ...editingCard, correctOptionIndex: idx })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-mono font-bold w-4">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <input
                        type="text"
                        value={editingCard.options?.[idx] || ''}
                        onChange={(e) => {
                          const newOpts = [...(editingCard.options || ['', '', '', ''])];
                          newOpts[idx] = e.target.value;
                          setEditingCard({ ...editingCard, options: newOpts });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation Note */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Explanation / Clinical Vignette (Optional)
                </label>
                <input
                  type="text"
                  value={editingCard.explanation || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, explanation: e.target.value })}
                  placeholder="e.g. Allosterically inhibited by high ATP and activated by AMP."
                  className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 mt-1 text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editingCard.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="biochemistry, enzymes, glycolysis"
                  className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 mt-1 text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-sm"
                >
                  {isNewCard ? 'Add Card' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Refine Modal */}
      {refineModalCard && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Refine Card with AI</span>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              Provide optional guidance on how to make this card tighter, simpler, or more memorable:
            </p>

            <textarea
              rows={3}
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              placeholder="e.g. Focus specifically on the allosteric inhibitor, or convert to a cloze deletion..."
              className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500/50"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefineModalCard(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRegenerateCard(refineModalCard, refineInstruction);
                  setRefineModalCard(null);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500"
              >
                Refine Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
