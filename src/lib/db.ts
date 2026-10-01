import Dexie, { type EntityTable } from 'dexie';
import { Deck, Flashcard, ReviewLog } from '../types/flashcard';
import { createDefaultRepetition } from './spacedRepetition';

const db = new Dexie('RecallForgeDB') as Dexie & {
  decks: EntityTable<Deck, 'id'>;
  cards: EntityTable<Flashcard, 'id'>;
  reviewLogs: EntityTable<ReviewLog, 'id'>;
};

// Schema declaration
db.version(1).stores({
  decks: 'id, title, subject, targetAudience, createdAt, updatedAt',
  cards: 'id, deckId, type, difficulty, createdAt, repetition.dueDate',
  reviewLogs: 'id, deckId, cardId, timestamp',
});

export { db };

// Pre-seeded starter decks for instant exploration
const STARTER_DECKS: { deck: Deck; cards: Flashcard[] }[] = [
  {
    deck: {
      id: 'starter-biology-krebs',
      title: 'Cellular Respiration & Krebs Cycle',
      subject: 'Biochemistry',
      description: 'Active-recall fundamentals of glycolysis, citric acid cycle, and oxidative phosphorylation.',
      targetAudience: 'undergrad',
      cardCount: 6,
      tags: ['Biology', 'Krebs Cycle', 'Mitochondria', 'ATP'],
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2,
    },
    cards: [
      {
        id: 'bio-card-1',
        deckId: 'starter-biology-krebs',
        front: 'Where in the eukaryotic cell does the Krebs cycle (Citric Acid Cycle) take place?',
        back: 'In the mitochondrial matrix.',
        explanation: 'Glycolysis occurs in the cytosol, whereas the Krebs cycle enzymes are localized inside the inner mitochondrial membrane (matrix).',
        type: 'basic',
        tags: ['anatomy', 'mitochondria'],
        difficulty: 'easy',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'bio-card-2',
        deckId: 'starter-biology-krebs',
        front: 'The primary regulatory enzyme and rate-limiting step of glycolysis is {{c1::phosphofructokinase-1 (PFK-1)}}.',
        back: 'phosphofructokinase-1 (PFK-1)',
        explanation: 'PFK-1 is allosterically inhibited by high levels of ATP and citrate, and activated by AMP and fructose-2,6-bisphosphate.',
        type: 'cloze',
        tags: ['enzymes', 'glycolysis'],
        difficulty: 'medium',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'bio-card-3',
        deckId: 'starter-biology-krebs',
        front: 'What is the net yield of ATP produced directly per molecule of glucose in glycolysis alone?',
        back: '2 net ATP (4 produced minus 2 consumed in investment phase)',
        explanation: 'Glucose + 2 NAD+ + 2 ADP + 2 Pi -> 2 Pyruvate + 2 NADH + 2 H+ + 2 ATP.',
        type: 'basic',
        tags: ['glycolysis', 'ATP'],
        difficulty: 'easy',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'bio-card-4',
        deckId: 'starter-biology-krebs',
        front: 'Which complex in the electron transport chain does NOT pump protons across the inner mitochondrial membrane?',
        back: 'Complex II (Succinate Dehydrogenase)',
        explanation: 'Complex I, III, and IV pump protons into the intermembrane space; Complex II transfers electrons from FADH2 without proton translocation.',
        type: 'mcq',
        options: [
          'Complex I (NADH dehydrogenase)',
          'Complex II (Succinate dehydrogenase)',
          'Complex III (Cytochrome c oxidoreductase)',
          'Complex IV (Cytochrome c oxidase)',
        ],
        correctOptionIndex: 1,
        tags: ['ETC', 'bioenergetics'],
        difficulty: 'hard',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'bio-card-5',
        deckId: 'starter-biology-krebs',
        front: 'What is the final electron acceptor in aerobic cellular respiration?',
        back: 'Molecular oxygen (O2)',
        explanation: 'Oxygen combines with electrons and free protons at Complex IV to form H2O.',
        type: 'basic',
        tags: ['ETC', 'respiration'],
        difficulty: 'easy',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'bio-card-6',
        deckId: 'starter-biology-krebs',
        front: 'During intense anaerobic exercise, pyruvate is reduced to {{c1::lactate}} by lactate dehydrogenase to regenerate {{c2::NAD+}}.',
        back: 'lactate | NAD+',
        explanation: 'Regenerating NAD+ allows glycolysis to continue producing quick ATP under hypoxic conditions.',
        type: 'cloze',
        tags: ['fermentation', 'metabolism'],
        difficulty: 'medium',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
    ],
  },
  {
    deck: {
      id: 'starter-js-event-loop',
      title: 'JavaScript Event Loop & Concurrency',
      subject: 'Computer Science',
      description: 'Core execution architecture: Call Stack, Web APIs, Microtask Queue vs Macrotask Queue.',
      targetAudience: 'undergrad',
      cardCount: 5,
      tags: ['JavaScript', 'Async', 'V8', 'Concurrency'],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    cards: [
      {
        id: 'js-card-1',
        deckId: 'starter-js-event-loop',
        front: 'In JavaScript, which task queue has higher execution priority: the microtask queue or the macrotask (callback) queue?',
        back: 'The microtask queue.',
        explanation: 'The event loop completely drains all microtasks before picking the next macrotask.',
        type: 'basic',
        tags: ['event loop', 'queues'],
        difficulty: 'medium',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'js-card-2',
        deckId: 'starter-js-event-loop',
        front: 'Promise reactions (`.then`, `.catch`, `.finally`) are scheduled on the {{c1::microtask}} queue, while `setTimeout` callbacks are queued on the {{c2::macrotask}} queue.',
        back: 'microtask | macrotask',
        explanation: '`queueMicrotask()` and `MutationObserver` also append directly to the microtask queue.',
        type: 'cloze',
        tags: ['promises', 'timers'],
        difficulty: 'medium',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'js-card-3',
        deckId: 'starter-js-event-loop',
        front: 'What will be printed first by this script?\n`console.log("A"); setTimeout(() => console.log("B"), 0); Promise.resolve().then(() => console.log("C"));`',
        back: 'A, then C, then B',
        explanation: 'A executes synchronously. C is a microtask executed right after sync stack clears. B is a macrotask executed on the next tick.',
        type: 'basic',
        tags: ['execution order'],
        difficulty: 'medium',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'js-card-4',
        deckId: 'starter-js-event-loop',
        front: 'Which of the following is executed as a macrotask in the browser?',
        back: 'MessageChannel / setTimeout',
        explanation: 'SetTimeout, setInterval, setImmediate (Node), and I/O are macrotasks.',
        type: 'mcq',
        options: [
          'Promise.then() callback',
          'queueMicrotask() callback',
          'setTimeout() callback',
          'MutationObserver callback',
        ],
        correctOptionIndex: 2,
        tags: ['queues', 'apis'],
        difficulty: 'easy',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'js-card-5',
        deckId: 'starter-js-event-loop',
        front: 'What happens to browser rendering (UI paint) if an infinite recursive microtask loop is triggered (`function loop() { Promise.resolve().then(loop); }`)?',
        back: 'The UI freezes completely because the microtask queue never drains to allow the render step.',
        explanation: 'Rendering occurs between macrotask ticks only after all pending microtasks are emptied.',
        type: 'basic',
        tags: ['rendering', 'starvation'],
        difficulty: 'hard',
        repetition: createDefaultRepetition(),
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
    ],
  },
];

export async function initializeDatabase() {
  try {
    const count = await db.decks.count();
    if (count === 0) {
      for (const starter of STARTER_DECKS) {
        await db.decks.add(starter.deck);
        await db.cards.bulkAdd(starter.cards);
      }
    }
  } catch (err) {
    console.error('Failed to seed starter database:', err);
  }
}
