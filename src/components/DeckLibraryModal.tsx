import React, { useRef } from 'react';
import { Deck, Flashcard } from '../types/flashcard';
import { 
  FolderOpen, 
  Trash2, 
  Plus, 
  Upload, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  X,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface DeckLibraryModalProps {
  decks: Deck[];
  currentDeckId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
  onNewDeck: () => void;
  onImportDeckJSON: (deck: Deck, cards: Flashcard[]) => void;
}

export const DeckLibraryModal: React.FC<DeckLibraryModalProps> = ({
  decks,
  currentDeckId,
  isOpen,
  onClose,
  onSelectDeck,
  onDeleteDeck,
  onNewDeck,
  onImportDeckJSON,
}) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleJSONFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.deck && Array.isArray(parsed.cards)) {
          onImportDeckJSON(parsed.deck, parsed.cards);
          onClose();
        } else {
          alert('Invalid RecallForge JSON file format.');
        }
      } catch (err) {
        alert('Could not parse JSON deck file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
              Deck Library ({decks.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action strip */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950/40 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleJSONFileChange}
          />

          <button
            onClick={() => jsonInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/80 text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Import JSON Deck</span>
          </button>

          <button
            onClick={() => {
              onNewDeck();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Forge New Deck</span>
          </button>
        </div>

        {/* Decks List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {decks.map((deck) => {
            const isSelected = deck.id === currentDeckId;

            return (
              <div
                key={deck.id}
                onClick={() => {
                  onSelectDeck(deck);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">
                      {deck.title}
                    </h4>
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {deck.subject}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Layers className="w-3 h-3 text-stone-400" />
                      {deck.cardCount} cards
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {new Date(deck.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onDeleteDeck(deck.id)}
                    title="Delete deck"
                    disabled={decks.length <= 1}
                    className={`p-2 rounded-xl transition-colors ${
                      decks.length <= 1
                        ? 'opacity-20 cursor-not-allowed text-stone-400'
                        : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
