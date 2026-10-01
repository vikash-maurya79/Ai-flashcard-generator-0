import React, { useState } from 'react';
import { Deck, Flashcard } from '../types/flashcard';
import { 
  exportToAnkiTSV, 
  exportToQuizletCSV, 
  exportToJSON, 
  downloadFile, 
  triggerPrintSheet 
} from '../lib/exportUtils';
import { 
  Download, 
  Copy, 
  Check, 
  Printer, 
  FileCode, 
  X, 
  Layers, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface ExportModalProps {
  deck: Deck;
  cards: Flashcard[];
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintView: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  deck,
  cards,
  isOpen,
  onClose,
  onOpenPrintView,
}) => {
  const [activeTab, setActiveTab] = useState<'anki' | 'quizlet' | 'print' | 'json'>('anki');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const ankiContent = exportToAnkiTSV(deck, cards);
  const quizletContent = exportToQuizletCSV(cards);
  const jsonContent = exportToJSON(deck, cards);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanSlug = deck.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
              Export Deck: {deck.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('anki')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'anki'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Anki (.tsv / .txt)
          </button>
          <button
            onClick={() => setActiveTab('quizlet')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'quizlet'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Quizlet (CSV / TSV)
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'print'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Print Cutting Grid
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            JSON Backup
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          {activeTab === 'anki' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Anki Import Instructions
                </h4>
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                  1. Download the <code className="font-mono bg-white dark:bg-stone-900 px-1 py-0.5 rounded">.tsv</code> file below.<br />
                  2. In Anki Desktop, click <strong>File &rarr; Import</strong>.<br />
                  3. Select the file, make sure <em>"Field separator: Tab"</em> and <em>"Allow HTML in fields"</em> are checked.<br />
                  4. For cloze cards, set Note Type to <strong>Cloze</strong>.
                </p>
              </div>

              {/* Code Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>File Preview ({cards.length} cards)</span>
                  <span className="font-mono text-[11px]">Tab-delimited</span>
                </div>
                <pre className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-mono text-[11px] text-stone-800 dark:text-stone-300 overflow-x-auto max-h-48 leading-relaxed">
                  {ankiContent}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleCopy(ankiContent)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  onClick={() => downloadFile(ankiContent, `${cleanSlug}-anki.tsv`, 'text/tab-separated-values')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Anki .tsv</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'quizlet' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Quizlet Quick Import
                </h4>
                <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                  1. Click <strong>"Copy to Clipboard"</strong> below.<br />
                  2. On Quizlet, click <strong>Create &rarr; Flashcard Set</strong>.<br />
                  3. Click <strong>"+ Import from Word, Excel, Google Docs"</strong>.<br />
                  4. Paste the text. Quizlet will automatically populate all terms and definitions!
                </p>
              </div>

              {/* Code Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>Quizlet Format (Term \t Definition)</span>
                </div>
                <pre className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-mono text-[11px] text-stone-800 dark:text-stone-300 overflow-x-auto max-h-48 leading-relaxed">
                  {quizletContent}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleCopy(quizletContent)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy for Quizlet'}</span>
                </button>

                <button
                  onClick={() => downloadFile(quizletContent, `${cleanSlug}-quizlet.txt`, 'text/plain')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5 text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                  <Printer className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                  Print-Ready Physical Cutting Grid & Cheat Sheet
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Print your flashcards on standard Letter / A4 paper with scissor cut guides and dashed borders.
                  Cards are formatted with front and back side-by-side for folding or double-sided cutting.
                </p>
              </div>

              <div className="p-4 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50/50 dark:bg-stone-900/50">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    {deck.title} ({cards.length} Cards)
                  </div>
                  <div className="text-xs text-stone-500">
                    High-contrast black & white print styling with page-break protection.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onOpenPrintView();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-xs text-stone-700 dark:text-stone-300"
                  >
                    View Layout
                  </button>

                  <button
                    onClick={() => {
                      onOpenPrintView();
                      onClose();
                      setTimeout(() => triggerPrintSheet(), 200);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print PDF Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="bg-purple-50/70 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <FileCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Full RecallForge Deck JSON
                </h4>
                <p className="text-xs leading-relaxed text-purple-800 dark:text-purple-300">
                  Export complete deck schema including all cards, tags, spaced-repetition intervals (SM-2 parameters), and timestamps.
                </p>
              </div>

              <pre className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-mono text-[11px] text-stone-800 dark:text-stone-300 overflow-x-auto max-h-48 leading-relaxed">
                {jsonContent}
              </pre>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => downloadFile(jsonContent, `${cleanSlug}-recallforge.json`, 'application/json')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .json Backup</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
