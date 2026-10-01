export type CardType = 'basic' | 'cloze' | 'mcq' | 'concept';
export type CardDifficulty = 'easy' | 'medium' | 'hard';
export type RigorLevel = 'middle_school' | 'high_school' | 'undergrad' | 'medical_legal';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface RepetitionData {
  state: 'new' | 'learning' | 'review';
  interval: number; // in days (or fractions for learning)
  easeFactor: number; // starts at 2.5
  repetitions: number;
  lapses: number;
  dueDate: number; // timestamp ms
  lastReviewed?: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  explanation?: string;
  type: CardType;
  tags: string[];
  difficulty: CardDifficulty;
  options?: string[]; // for mcq
  correctOptionIndex?: number; // for mcq (0-based)
  repetition: RepetitionData;
  createdAt: number;
  updatedAt: number;
}

export interface Deck {
  id: string;
  title: string;
  subject: string;
  description?: string;
  targetAudience: RigorLevel;
  cardCount: number;
  tags: string[];
  sourceSnippet?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReviewLog {
  id: string;
  deckId: string;
  cardId: string;
  rating: ReviewRating;
  timestamp: number;
  intervalAfter: number;
  easeFactorAfter: number;
}

export interface GeneratedDeckResponse {
  deckTitle: string;
  subject: string;
  description?: string;
  cards: Array<{
    id?: string;
    front: string;
    back: string;
    explanation?: string;
    type: 'basic' | 'cloze' | 'mcq';
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    options?: string[];
    correctOptionIndex?: number;
  }>;
}

export interface DeckStats {
  totalCards: number;
  dueToday: number;
  mastered: number; // interval > 21 days
  learning: number;
  averageEase: number;
}
