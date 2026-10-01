/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, initializeDatabase } from './lib/db';
import { Deck, Flashcard, RigorLevel, ReviewRating, GeneratedDeckResponse } from './types/flashcard';
import { calculateNextReview, createDefaultRepetition } from './lib/spacedRepetition';
import { Header } from './components/Header';
import { InputSuite } from './components/InputSuite';
import { GeneratingSkeleton } from './components/GeneratingSkeleton';
import { CardEditorGrid } from './components/CardEditorGrid';
import { StudySession } from './components/StudySession';
import { ExportModal } from './components/ExportModal';
import { PrintableGrid } from './components/PrintableGrid';
import { DeckLibraryModal } from './components/DeckLibraryModal';
import { AlertCircle, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'editor' | 'study' | 'export'>('create');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  
  // UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingCardId, setIsProcessingCardId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('recallforge_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('recallforge_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('recallforge_theme', 'light');
    }
  }, [darkMode]);

  // Load Decks & initialize DB
  useEffect(() => {
    async function loadData() {
      await initializeDatabase();
      const allDecks = await db.decks.orderBy('updatedAt').reverse().toArray();
      setDecks(allDecks);
      if (allDecks.length > 0 && !currentDeck) {
        setCurrentDeck(allDecks[0]);
      }
    }
    loadData();
  }, []);

  // When current deck changes, load its cards
  useEffect(() => {
    async function loadCards() {
      if (!currentDeck) {
        setCards([]);
        return;
      }
      const deckCards = await db.cards.where('deckId').equals(currentDeck.id).toArray();
      setCards(deckCards);
    }
    loadCards();
  }, [currentDeck]);

  // Notification helper
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Generate Flashcards
  const handleGenerate = async (params: {
    content: string;
    cardCount: number | 'auto';
    cardType: 'mixed' | 'basic' | 'cloze' | 'mcq';
    rigor: RigorLevel;
    subject: string;
  }) => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards');
      }

      const data: GeneratedDeckResponse = await response.json();

      // Create new Deck record in IndexedDB
      const newDeckId = `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newDeck: Deck = {
        id: newDeckId,
        title: data.deckTitle || 'Untitled Active Recall Deck',
        subject: data.subject || params.subject || 'General Knowledge',
        description: data.description || 'Generated with RecallForge Minimum Information Principle',
        targetAudience: params.rigor,
        cardCount: data.cards.length,
        tags: [data.subject || 'Study'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Create cards with default SM-2 repetition parameters
      const newCards: Flashcard[] = data.cards.map((c, i) => ({
        id: c.id || `card-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        deckId: newDeckId,
        front: c.front,
        back: c.back,
        explanation: c.explanation || '',
        type: c.type || 'basic',
        tags: c.tags || [data.subject || 'General'],
        difficulty: c.difficulty || 'medium',
        options: c.options,
        correctOptionIndex: c.correctOptionIndex,
        repetition: createDefaultRepetition(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      // Save to IndexedDB
      await db.decks.add(newDeck);
      await db.cards.bulkAdd(newCards);

      // Update State
      setDecks((prev) => [newDeck, ...prev]);
      setCurrentDeck(newDeck);
      setCards(newCards);
      setActiveTab('editor');
      showToast(`Forged ${newCards.length} atomic flashcards successfully!`);
    } catch (err: any) {
      console.error('Generation failure:', err);
      setErrorMessage(err.message || 'Error communicating with generation engine.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Card Operations
  const handleUpdateCard = async (updated: Flashcard) => {
    await db.cards.put(updated);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast('Card updated');
  };

  const handleDeleteCard = async (cardId: string) => {
    await db.cards.delete(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    if (currentDeck) {
      const newCount = Math.max(0, currentDeck.cardCount - 1);
      await db.decks.update(currentDeck.id, { cardCount: newCount, updatedAt: Date.now() });
      setCurrentDeck({ ...currentDeck, cardCount: newCount });
      setDecks((prev) =>
        prev.map((d) => (d.id === currentDeck.id ? { ...d, cardCount: newCount } : d))
      );
    }
    showToast('Card removed');
  };

  const handleAddCard = async (newCard: Flashcard) => {
    await db.cards.add(newCard);
    setCards((prev) => [newCard, ...prev]);
    if (currentDeck) {
      const newCount = currentDeck.cardCount + 1;
      await db.decks.update(currentDeck.id, { cardCount: newCount, updatedAt: Date.now() });
      setCurrentDeck({ ...currentDeck, cardCount: newCount });
      setDecks((prev) =>
        prev.map((d) => (d.id === currentDeck.id ? { ...d, cardCount: newCount } : d))
      );
    }
    showToast('Card added to deck');
  };

  // AI Refine single card
  const handleRegenerateCard = async (card: Flashcard, instruction?: string) => {
    setIsProcessingCardId(card.id);
    try {
      const res = await fetch('/api/regenerate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card, instruction }),
      });
      if (!res.ok) throw new Error('Failed to refine card');
      const refined: Flashcard = await res.json();
      await db.cards.put(refined);
      setCards((prev) => prev.map((c) => (c.id === refined.id ? refined : c)));
      showToast('Card refined with AI active recall');
    } catch (err: any) {
      showToast(err.message || 'Could not refine card', 'error');
    } finally {
      setIsProcessingCardId(null);
    }
  };

  // AI Split card into 2 atomic cards
  const handleSplitCard = async (card: Flashcard) => {
    setIsProcessingCardId(card.id);
    try {
      const res = await fetch('/api/split-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card }),
      });
      if (!res.ok) throw new Error('Failed to split card');
      const data = await res.json();
      const newCards: Flashcard[] = data.cards;

      // Delete old card, add the 2 new ones
      await db.cards.delete(card.id);
      await db.cards.bulkAdd(newCards);

      setCards((prev) => [...newCards, ...prev.filter((c) => c.id !== card.id)]);
      if (currentDeck) {
        const newCount = currentDeck.cardCount + 1; // replaced 1 with 2 => +1 net
        await db.decks.update(currentDeck.id, { cardCount: newCount, updatedAt: Date.now() });
        setCurrentDeck({ ...currentDeck, cardCount: newCount });
      }
      showToast('Card successfully split into 2 atomic facts!');
    } catch (err: any) {
      showToast(err.message || 'Could not split card', 'error');
    } finally {
      setIsProcessingCardId(null);
    }
  };

  // Spaced Repetition Review Handler
  const handleReviewCard = async (cardId: string, rating: ReviewRating) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || !currentDeck) return;

    const nextRep = calculateNextReview(card.repetition, rating);
    const updatedCard: Flashcard = {
      ...card,
      repetition: nextRep,
      updatedAt: Date.now(),
    };

    await db.cards.put(updatedCard);
    setCards((prev) => prev.map((c) => (c.id === cardId ? updatedCard : c)));

    // Log review
    await db.reviewLogs.add({
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      deckId: currentDeck.id,
      cardId: card.id,
      rating,
      timestamp: Date.now(),
      intervalAfter: nextRep.interval,
      easeFactorAfter: nextRep.easeFactor,
    });
  };

  // Delete an entire deck
  const handleDeleteDeck = async (deckId: string) => {
    await db.decks.delete(deckId);
    await db.cards.where('deckId').equals(deckId).delete();
    const remaining = decks.filter((d) => d.id !== deckId);
    setDecks(remaining);
    if (currentDeck?.id === deckId) {
      setCurrentDeck(remaining[0] || null);
    }
    showToast('Deck deleted');
  };

  // Import JSON deck
  const handleImportDeckJSON = async (deck: Deck, importedCards: Flashcard[]) => {
    const newId = `imported-${Date.now()}`;
    const newDeck = { ...deck, id: newId, cardCount: importedCards.length };
    const remappedCards = importedCards.map((c, i) => ({
      ...c,
      id: `card-imp-${Date.now()}-${i}`,
      deckId: newId,
    }));

    await db.decks.add(newDeck);
    await db.cards.bulkAdd(remappedCards);

    setDecks((prev) => [newDeck, ...prev]);
    setCurrentDeck(newDeck);
    setCards(remappedCards);
    setActiveTab('editor');
    showToast(`Imported deck "${newDeck.title}" with ${remappedCards.length} cards.`);
  };

  if (isPrintView && currentDeck) {
    return (
      <PrintableGrid
        deck={currentDeck}
        cards={cards}
        onBack={() => setIsPrintView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notifications */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'export') {
            setIsExportOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        currentDeck={currentDeck}
        decks={decks}
        onSelectDeck={(d) => {
          setCurrentDeck(d);
          setActiveTab('editor');
        }}
        onOpenNewDeck={() => setActiveTab('create')}
        onOpenDeckLibrary={() => setIsLibraryOpen(true)}
        cardCount={cards.length}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-16">
        {isGenerating ? (
          <GeneratingSkeleton />
        ) : activeTab === 'create' ? (
          <InputSuite
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        ) : activeTab === 'editor' && currentDeck ? (
          <CardEditorGrid
            deck={currentDeck}
            cards={cards}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onAddCard={handleAddCard}
            onSplitCard={handleSplitCard}
            onRegenerateCard={handleRegenerateCard}
            onStartStudy={() => setActiveTab('study')}
            onOpenExport={() => setIsExportOpen(true)}
            isProcessingCardId={isProcessingCardId}
          />
        ) : activeTab === 'study' && currentDeck ? (
          <StudySession
            deck={currentDeck}
            cards={cards}
            onReviewCard={handleReviewCard}
            onExit={() => setActiveTab('editor')}
          />
        ) : (
          <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto" />
            <h2 className="text-xl font-bold text-stone-700 dark:text-stone-300">
              No deck selected
            </h2>
            <p className="text-xs text-stone-500">
              Please choose a deck from your library or forge a new set of flashcards.
            </p>
            <button
              onClick={() => setActiveTab('create')}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
            >
              Forge Flashcards
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-stone-200 dark:border-stone-800/80 py-6 px-4 text-center text-xs text-stone-500 dark:text-stone-400 bg-white/50 dark:bg-stone-900/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-900 dark:text-stone-200">
              RecallForge
            </span>
            <span>&bull;</span>
            <span>Powered by Gemini Active Recall & SM-2 Engine</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Minimum Information Principle</span>
            <span>&bull;</span>
            <span>Anki & Quizlet Ready</span>
            <span>&bull;</span>
            <span>Offline IndexedDB Storage</span>
          </div>
        </div>
      </footer>

      {/* Export Modal */}
      {currentDeck && (
        <ExportModal
          deck={currentDeck}
          cards={cards}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onOpenPrintView={() => setIsPrintView(true)}
        />
      )}

      {/* Deck Library Modal */}
      <DeckLibraryModal
        decks={decks}
        currentDeckId={currentDeck?.id}
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectDeck={(d) => {
          setCurrentDeck(d);
          setActiveTab('editor');
        }}
        onDeleteDeck={handleDeleteDeck}
        onNewDeck={() => setActiveTab('create')}
        onImportDeckJSON={handleImportDeckJSON}
      />
    </div>
  );
}
