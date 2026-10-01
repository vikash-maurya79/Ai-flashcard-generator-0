import { Deck, Flashcard } from '../types/flashcard';

/**
 * Anki TSV Exporter
 * Format: Front \t Back \t Tags
 * For cloze cards: Front has {{c1::term}} and Back has explanation or definition.
 * Escapes tabs and HTML newlines <br> for seamless Anki import.
 */
export function exportToAnkiTSV(deck: Deck, cards: Flashcard[]): string {
  const lines: string[] = [
    `#separator:tab`,
    `#html:true`,
    `#tags column:3`,
    `#deck:${deck.title.replace(/[\t\n]/g, ' ')}`,
  ];

  for (const card of cards) {
    let front = card.front.replace(/\t/g, '  ').replace(/\n/g, '<br>');
    let back = card.back.replace(/\t/g, '  ').replace(/\n/g, '<br>');

    if (card.explanation) {
      back += `<br><br><small style="color: #666;">Note: ${card.explanation.replace(/\t/g, ' ').replace(/\n/g, '<br>')}</small>`;
    }

    if (card.type === 'mcq' && card.options && card.options.length > 0) {
      const optionsHtml = card.options
        .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`)
        .join('<br>');
      front += `<br><br>${optionsHtml}`;
      if (card.correctOptionIndex !== undefined) {
        back = `<strong>Correct: Option ${String.fromCharCode(65 + card.correctOptionIndex)}</strong><br>${back}`;
      }
    }

    const tags = (card.tags && card.tags.length > 0)
      ? card.tags.map(t => t.trim().replace(/\s+/g, '_')).join(' ')
      : 'recallforge';

    lines.push(`${front}\t${back}\t${tags}`);
  }

  return lines.join('\n');
}

/**
 * Quizlet-compatible CSV / TSV format
 * Term \t Definition
 */
export function exportToQuizletCSV(cards: Flashcard[]): string {
  return cards
    .map((card) => {
      let term = card.front.replace(/[\t\r\n]+/g, ' ').trim();
      let definition = card.back.replace(/[\t\r\n]+/g, ' ').trim();
      if (card.explanation) {
        definition += ` (Explanation: ${card.explanation.replace(/[\t\r\n]+/g, ' ')})`;
      }
      return `${term}\t${definition}`;
    })
    .join('\n');
}

/**
 * Full JSON Deck Export (includes metadata, card settings, and repetition history)
 */
export function exportToJSON(deck: Deck, cards: Flashcard[]): string {
  return JSON.stringify(
    {
      app: 'RecallForge',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      deck,
      cards,
    },
    null,
    2
  );
}

/**
 * Triggers a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger print dialog with clean print styling
 */
export function triggerPrintSheet() {
  window.print();
}
