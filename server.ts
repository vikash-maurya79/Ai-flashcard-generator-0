import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '25mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // POST /api/generate - Generate atomic flashcard deck
  app.post('/api/generate', async (req: Request, res: Response) => {
    try {
      const {
        content,
        cardCount = 'auto',
        cardType = 'mixed',
        rigor = 'undergrad',
        subject = '',
      } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length < 10) {
        return res.status(400).json({ error: 'Please provide valid source content (minimum 10 characters).' });
      }

      const countInstruction =
        cardCount === 'auto'
          ? 'Determine an optimal number of cards based on content density (typically 6 to 15 cards) so that every core concept is captured without redundancy.'
          : `Generate exactly ${cardCount} flashcards.`;

      let cardTypeInstruction = '';
      if (cardType === 'basic') {
        cardTypeInstruction = 'All cards MUST be standard active-recall basic Q&A cards (type: "basic"). Front is an atomic, clear question. Back is the direct answer.';
      } else if (cardType === 'cloze') {
        cardTypeInstruction = 'All cards MUST be cloze deletion cards (type: "cloze"). Front must contain the sentence with the key term wrapped in {{c1::hidden term}} (or {{c2::second term}}). Back contains the revealed word(s).';
      } else if (cardType === 'mcq') {
        cardTypeInstruction = 'All cards MUST be multiple choice questions (type: "mcq"). Provide exactly 4 options in the `options` array, set `correctOptionIndex` (0 to 3), and place the question on the front.';
      } else {
        cardTypeInstruction = 'Provide an effective pedagogical mix: 50% basic Q&A, 30% cloze deletion (using {{c1::term}}), and 20% high-yield conceptual multiple choice questions (with 4 options and correctOptionIndex).';
      }

      let rigorInstruction = '';
      switch (rigor) {
        case 'middle_school':
          rigorInstruction = 'Target audience: Middle School students. Use straightforward, accessible vocabulary, intuitive analogies, and focus on foundational core definitions.';
          break;
        case 'high_school':
          rigorInstruction = 'Target audience: High School / AP exam prep. Emphasize standard academic curriculum depth, key dates/formulas, and precise terminology.';
          break;
        case 'medical_legal':
          rigorInstruction = 'Target audience: Medical (USMLE/NCLEX) or Legal (Bar exam) board preparation. Use clinical vignettes, high-yield diagnostic criteria, statutory elements, mechanism of action, and board-style discriminators.';
          break;
        case 'undergrad':
        default:
          rigorInstruction = 'Target audience: Undergraduate college students. Focus on mechanistic reasoning, analytical depth, cause-and-effect relationships, and conceptual synthesis.';
          break;
      }

      const systemPrompt = `You are a Principal Spaced-Repetition Expert & Cognitive Science Professor specializing in active-recall flashcard synthesis.
Your mission is to transform messy raw notes, lecture transcripts, study materials, or textbooks into an elite flashcard deck.

CRITICAL RULES:
1. "MINIMUM INFORMATION PRINCIPLE":
   - Every single flashcard must test exactly ONE atomic fact. Never combine two unrelated questions onto one card.
   - If a concept has three sub-parts, create three separate atomic cards rather than a single list question.
   - Front questions must be unambiguous: the student must instantly know what is being asked without guessing the prompt's intent.
2. Active Recall over Passive Recognition:
   - Formulate questions that trigger deep retrieval practice.
   - Avoid trivial yes/no questions; prefer "Why", "What mechanism", "How does X affect Y", or targeted Cloze deletions.
3. For Cloze Deletions:
   - Use standard Anki syntax: "The primary organ responsible for insulin production is {{c1::the pancreas}}."
   - Keep the surrounding context helpful so the answer is identifiable, but do not give the answer away.
4. For Multiple Choice (MCQ):
   - Always supply 4 plausible, high-quality distractors in the options array. Distractors should target common student misconceptions.
   - Set correctOptionIndex (0-3).
5. Explanations:
   - Provide a concise 1-2 sentence explanation reinforcing WHY the answer is correct or highlighting clinical/practical significance.
6. Rigor & Audience: ${rigorInstruction}
7. Card Count: ${countInstruction}
8. Types: ${cardTypeInstruction}`;

      const userPrompt = `Subject Context: ${subject || 'Infer from content'}

Source Material to transform:
"""
${content.slice(0, 30000)}
"""

Generate the structured flashcard deck adhering strictly to the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              deckTitle: { type: Type.STRING, description: 'Engaging, descriptive title for the deck' },
              subject: { type: Type.STRING, description: 'Subject domain e.g. Biochemistry, Computer Science, Constitutional Law' },
              description: { type: Type.STRING, description: '1-sentence overview of the deck scope' },
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING, description: 'The prompt, question, or cloze sentence' },
                    back: { type: Type.STRING, description: 'The atomic answer or cloze solution' },
                    explanation: { type: Type.STRING, description: 'Brief context or mnemonic' },
                    type: { type: Type.STRING, description: 'basic, cloze, or mcq' },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Relevant thematic tags'
                    },
                    difficulty: { type: Type.STRING, description: 'easy, medium, or hard' },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'For MCQ: exactly 4 choices'
                    },
                    correctOptionIndex: { type: Type.INTEGER, description: 'For MCQ: 0-3 index' }
                  },
                  required: ['front', 'back', 'type', 'tags', 'difficulty']
                }
              }
            },
            required: ['deckTitle', 'subject', 'cards']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received empty response from AI model');
      }

      const parsedData = JSON.parse(responseText);

      // Validate & post-process cards
      const processedCards = (parsedData.cards || []).map((card: any, idx: number) => ({
        id: `gen-card-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        front: card.front || 'Question',
        back: card.back || 'Answer',
        explanation: card.explanation || '',
        type: ['basic', 'cloze', 'mcq'].includes(card.type) ? card.type : 'basic',
        tags: Array.isArray(card.tags) && card.tags.length > 0 ? card.tags : [parsedData.subject || 'General'],
        difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
        options: Array.isArray(card.options) && card.options.length >= 2 ? card.options : undefined,
        correctOptionIndex: typeof card.correctOptionIndex === 'number' ? card.correctOptionIndex : undefined,
      }));

      res.json({
        deckTitle: parsedData.deckTitle || 'Untitled Deck',
        subject: parsedData.subject || 'General',
        description: parsedData.description || 'Generated with RecallForge',
        cards: processedCards,
      });
    } catch (err: any) {
      console.error('Deck generation error:', err);
      res.status(500).json({
        error: 'Failed to generate flashcards. Please verify your content and try again.',
        details: err.message || String(err),
      });
    }
  });

  // POST /api/regenerate-card - Re-craft a single card for enhanced atomic clarity
  app.post('/api/regenerate-card', async (req: Request, res: Response) => {
    try {
      const { card, instruction = 'Make this card more atomic, clear, and focused on active recall.' } = req.body;
      if (!card) {
        return res.status(400).json({ error: 'Card payload is required.' });
      }

      const prompt = `You are a spaced-repetition flashcard engineer. Refine this flashcard:
Front: "${card.front}"
Back: "${card.back}"
Explanation: "${card.explanation || ''}"
Type: "${card.type}"
Difficulty: "${card.difficulty}"

User feedback / instruction: "${instruction}"

Follow the Minimum Information Principle: ensure one atomic fact, unambiguous wording, and memorable clarity.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              explanation: { type: Type.STRING },
              type: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficulty: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctOptionIndex: { type: Type.INTEGER }
            },
            required: ['front', 'back', 'type', 'difficulty']
          }
        }
      });

      const refined = JSON.parse(response.text || '{}');
      res.json({
        ...card,
        ...refined,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Card regeneration error:', err);
      res.status(500).json({ error: 'Failed to regenerate card', details: err.message });
    }
  });

  // POST /api/split-card - Break a complex card into two atomic cards
  app.post('/api/split-card', async (req: Request, res: Response) => {
    try {
      const { card } = req.body;
      if (!card) {
        return res.status(400).json({ error: 'Card payload is required.' });
      }

      const prompt = `This flashcard tests more than one piece of information or is too complex:
Front: "${card.front}"
Back: "${card.back}"
Explanation: "${card.explanation || ''}"

Split this card into EXACTLY TWO separate, atomic flashcards adhering strictly to the Minimum Information Principle. Each new card must test only ONE distinct fact.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                explanation: { type: Type.STRING },
                type: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                difficulty: { type: Type.STRING }
              },
              required: ['front', 'back', 'type', 'difficulty']
            }
          }
        }
      });

      const cards = JSON.parse(response.text || '[]');
      const results = cards.map((c: any, i: number) => ({
        id: `split-card-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        deckId: card.deckId,
        front: c.front,
        back: c.back,
        explanation: c.explanation || card.explanation || '',
        type: c.type || card.type || 'basic',
        tags: c.tags || card.tags || [],
        difficulty: c.difficulty || card.difficulty || 'medium',
        repetition: { ...card.repetition },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      res.json({ cards: results });
    } catch (err: any) {
      console.error('Card split error:', err);
      res.status(500).json({ error: 'Failed to split card', details: err.message });
    }
  });

  // Serve static assets or mount Vite in dev
  const distPath = path.resolve(__dirname, 'dist');
  if (process.env.NODE_ENV === 'production' || fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RecallForge server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
