import React from 'react';
import { 
  Sparkles, 
  Brain, 
  Layers, 
  GraduationCap, 
  Download, 
  PlusCircle, 
  FolderOpen,
  Sun,
  Moon
} from 'lucide-react';
import { Deck } from '../types/flashcard';

interface HeaderProps {
  activeTab: 'create' | 'editor' | 'study' | 'export';
  setActiveTab: (tab: 'create' | 'editor' | 'study' | 'export') => void;
  currentDeck: Deck | null;
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  onOpenNewDeck: () => void;
  onOpenDeckLibrary: () => void;
  cardCount: number;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentDeck,
  decks,
  onSelectDeck,
  onOpenNewDeck,
  onOpenDeckLibrary,
  cardCount,
  darkMode,
  setDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-400 flex items-center justify-center shadow-md shadow-amber-500/20 text-white font-bold text-lg group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-stone-900 dark:text-stone-100 tracking-tight text-lg">
                    RecallForge
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    AI Active Recall
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
                  Atomic Flashcard Synthesis & Spaced Repetition
                </p>
              </div>
            </button>
          </div>

          {/* Stepper Tabs */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 text-sm font-medium">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>1. Ingest & Forge</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              disabled={!currentDeck}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                !currentDeck ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-500" />
              <span>2. Card Editor</span>
              {cardCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 font-mono text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {cardCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('study')}
              disabled={!currentDeck || cardCount === 0}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                !currentDeck || cardCount === 0 ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                activeTab === 'study'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              <span>3. Study (SM-2)</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              disabled={!currentDeck || cardCount === 0}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                !currentDeck || cardCount === 0 ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Download className="w-4 h-4 text-purple-500" />
              <span>4. Export</span>
            </button>
          </nav>

          {/* Right Controls: Decks & Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Current Deck Quick Switcher */}
            <div className="hidden lg:flex items-center">
              <select
                value={currentDeck?.id || ''}
                onChange={(e) => {
                  const found = decks.find((d) => d.id === e.target.value);
                  if (found) onSelectDeck(found);
                }}
                className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 font-medium max-w-[180px] truncate focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.title} ({deck.cardCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Deck Library modal button */}
            <button
              onClick={onOpenDeckLibrary}
              title="View Decks Library"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700/80 transition-colors border border-stone-200 dark:border-stone-700"
            >
              <FolderOpen className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span className="hidden sm:inline">Decks ({decks.length})</span>
            </button>

            {/* New Deck Button */}
            <button
              onClick={onOpenNewDeck}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 transition-colors shadow-sm shadow-amber-600/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Deck</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 justify-around bg-stone-100/60 dark:bg-stone-900/60 text-xs">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-md ${
            activeTab === 'create' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-semibold' : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Ingest</span>
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          disabled={!currentDeck}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-md ${
            activeTab === 'editor' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-semibold' : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>Cards ({cardCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('study')}
          disabled={!currentDeck || cardCount === 0}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-md ${
            activeTab === 'study' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-semibold' : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
          <span>Study</span>
        </button>
        <button
          onClick={() => setActiveTab('export')}
          disabled={!currentDeck || cardCount === 0}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-md ${
            activeTab === 'export' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-semibold' : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-purple-500" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
