import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Sliders, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileCheck,
  Zap,
  Info
} from 'lucide-react';
import { RigorLevel } from '../types/flashcard';
import { parseUploadedFile, ExtractedFileResult } from '../lib/fileParser';

interface InputSuiteProps {
  onGenerate: (params: {
    content: string;
    cardCount: number | 'auto';
    cardType: 'mixed' | 'basic' | 'cloze' | 'mcq';
    rigor: RigorLevel;
    subject: string;
  }) => void;
  isGenerating: boolean;
}

const SAMPLE_PRESETS = [
  {
    title: 'Biochemistry: Krebs Cycle',
    subject: 'Biology',
    rigor: 'undergrad' as RigorLevel,
    text: `Cellular respiration is the multi-stage metabolic pathway that converts biochemical energy from nutrients into adenosine triphosphate (ATP). In eukaryotes, cellular respiration begins in the cytoplasm with glycolysis, where one 6-carbon glucose molecule is broken down into two 3-carbon pyruvate molecules, yielding a net 2 ATP and 2 NADH. The committed and rate-limiting step of glycolysis is catalyzed by phosphofructokinase-1 (PFK-1), which is allosterically inhibited by high ATP and citrate levels.

In the presence of oxygen, pyruvate enters the mitochondrial matrix via the pyruvate translocase and is converted into acetyl-CoA by the pyruvate dehydrogenase multienzyme complex (PDH). The Krebs cycle (citric acid cycle) takes place in the mitochondrial matrix. Acetyl-CoA combines with 4-carbon oxaloacetate to form 6-carbon citrate, catalyzed by citrate synthase. Through successive oxidative decarboxylations catalyzed by isocitrate dehydrogenase and alpha-ketoglutarate dehydrogenase, the cycle produces 3 NADH, 1 FADH2, 1 GTP (equivalent to ATP), and releases 2 CO2 per turn.

The electron transport chain (ETC) operates on the inner mitochondrial membrane across four protein complexes (I, II, III, IV). Complexes I, III, and IV pump protons from the matrix into the intermembrane space, generating a steep proton-motive force. Complex II (succinate dehydrogenase) accepts electrons from FADH2 but does not pump protons. Molecular oxygen acts as the terminal electron acceptor at Complex IV (cytochrome c oxidase), reducing to water. ATP synthase (Complex V) couples the downhill flow of protons back into the matrix to synthesize ATP via rotary chemiosmosis.`,
  },
  {
    title: 'World History: Cuban Missile Crisis',
    subject: 'World History',
    rigor: 'high_school' as RigorLevel,
    text: `The Cuban Missile Crisis was a 13-day political and military standoff in October 1962 between the United States and the Soviet Union over the installation of nuclear-armed Soviet missiles in Cuba, just 90 miles from the U.S. shores.

In May 1960, Soviet Premier Nikita Khrushchev conceived the idea of placing intermediate-range ballistic missiles in Cuba to deter future U.S. invasions (following the failed Bay of Pigs invasion of April 1961) and to balance U.S. nuclear superiority, especially U.S. Jupiter missiles based in Turkey and Italy. On October 14, 1962, a U.S. U-2 spy plane piloted by Major Richard Heyser photographed SS-4 medium-range ballistic missile sites under construction in Cuba.

President John F. Kennedy convened the Executive Committee of the National Security Council (EXCOMM). Rejecting calls for an immediate airstrike or full-scale invasion, Kennedy chose a naval "quarantine" (blockade) of Cuba on October 22 to prevent further offensive weapons shipments. The crisis peaked on "Black Saturday" (October 27) when an American U-2 reconnaissance aircraft was shot down over Cuba, killing pilot Rudolf Anderson. A secret diplomatic backchannel between Attorney General Robert F. Kennedy and Soviet Ambassador Anatoly Dobrynin brokered the resolution: Khrushchev agreed to dismantle the Cuban missile sites in exchange for a public U.S. pledge never to invade Cuba and a secret U.S. agreement to remove its Jupiter missiles from Turkey.`,
  },
  {
    title: 'CS: JavaScript Event Loop',
    subject: 'Computer Science',
    rigor: 'undergrad' as RigorLevel,
    text: `JavaScript is a single-threaded, non-blocking, asynchronous concurrent programming language governed by an event loop. The execution model consists of the Call Stack, the Heap, the Web APIs runtime environment, the Microtask Queue, and the Macrotask (Callback) Queue.

The Call Stack records execution contexts (LIFO order). When synchronous code runs, frames are pushed onto and popped off the stack. Asynchronous operations like setTimeout, fetch, or DOM events are delegated to browser Web APIs or Node.js libuv threads. When completed, their callbacks are placed in queues.

The Microtask Queue has strict execution priority over the Macrotask Queue. Microtasks include Promise reactions (.then, .catch, .finally), queueMicrotask(), and MutationObserver callbacks. The Macrotask Queue handles setTimeout, setInterval, setImmediate (Node.js), and I/O tasks. 

Crucially, the Event Loop algorithm continually monitors the Call Stack. When the Call Stack becomes completely empty, the Event Loop immediately executes ALL tasks in the Microtask Queue until it is completely drained, before ever checking the Macrotask Queue or performing a browser rendering cycle. If microtasks spawn additional microtasks recursively, the Event Loop will experience microtask starvation, indefinitely blocking macrotasks and freezing the UI render thread.`,
  },
  {
    title: 'Cardiology: EKG & Arrhythmias',
    subject: 'Cardiology / Medicine',
    rigor: 'medical_legal' as RigorLevel,
    text: `The surface electrocardiogram (EKG/ECG) reflects the summation of electrical vectors generated during cardiac conduction. The P wave represents atrial depolarization (normal duration <120 ms). The PR interval represents conduction through the atrioventricular (AV) node (normal 120-200 ms). A PR interval exceeding 200 ms defines First-Degree AV Block.

The QRS complex represents ventricular depolarization (normal <120 ms). QRS duration >=120 ms indicates intraventricular conduction delay such as Right Bundle Branch Block (RBBB, displaying 'rsR' bunny ears in V1/V2) or Left Bundle Branch Block (LBBB, broad slurred R waves in I, aVL, V5/V6). The ST segment reflects the plateau phase (Phase 2) of the ventricular action potential. ST-elevation in contiguous leads indicates acute myocardial infarction (STEMI) due to transmural ischemia.

Atrial fibrillation is characterized by an irregularly irregular ventricular rhythm with absent P waves and undulating fibrillatory baseline waves. Atrial flutter demonstrates classic 'sawtooth' flutter (F) waves, typically at an atrial rate of 300 bpm with 2:1 AV block resulting in a ventricular rate of ~150 bpm. Ventricular tachycardia (VT) is defined as three or more consecutive ventricular beats at a rate >100 bpm with wide QRS complexes (>120 ms). Synchronized cardioversion is the immediate treatment of choice for unstable VT with a pulse, whereas defibrillation (unsynchronized shock) is indicated for pulseless VT or Ventricular Fibrillation (VF).`,
  },
];

export const InputSuite: React.FC<InputSuiteProps> = ({ onGenerate, isGenerating }) => {
  const [content, setContent] = useState('');
  const [cardCount, setCardCount] = useState<number | 'auto'>('auto');
  const [cardType, setCardType] = useState<'mixed' | 'basic' | 'cloze' | 'mcq'>('mixed');
  const [rigor, setRigor] = useState<RigorLevel>('undergrad');
  const [subject, setSubject] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<ExtractedFileResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.ceil(charCount / 4);

  const handlePresetSelect = (preset: typeof SAMPLE_PRESETS[0]) => {
    setContent(preset.text);
    setSubject(preset.subject);
    setRigor(preset.rigor);
    setUploadedFileInfo(null);
    setUploadError(null);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsParsingFile(true);
      setUploadError(null);
      const result = await parseUploadedFile(file);
      setUploadedFileInfo(result);
      setContent(result.text);

      // Guess subject from file name
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (!subject) {
        setSubject(cleanName.slice(0, 30));
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isGenerating) return;
    onGenerate({
      content,
      cardCount,
      cardType,
      rigor,
      subject,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          Transform Raw Notes into Atomic Active-Recall Flashcards
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
          Adheres to the cognitive science <span className="font-semibold text-amber-600 dark:text-amber-400">Minimum Information Principle</span>.
          Upload lecture slides, PDFs, or paste raw notes to forge study-ready spaced repetition decks.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="bg-stone-100/70 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Sample Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="text-xs px-3 py-1.5 rounded-xl font-medium bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700/80 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-all shadow-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3 h-3 text-amber-500" />
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Ingestion Box */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          {/* File Upload Zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer transition-all border-b border-dashed border-stone-200 dark:border-stone-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDragging
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400'
                : 'bg-stone-50/50 dark:bg-stone-950/30 hover:bg-stone-100/60 dark:hover:bg-stone-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.docx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Drop lecture files or click to browse
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Accepts <span className="font-mono font-medium">.pdf</span>, <span className="font-mono font-medium">.docx</span>, <span className="font-mono font-medium">.md</span>, <span className="font-mono font-medium">.txt</span>
                </p>
              </div>
            </div>

            {uploadedFileInfo ? (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-medium">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate max-w-[160px] font-mono">{uploadedFileInfo.fileName}</span>
                <span className="text-emerald-600 dark:text-emerald-400">({uploadedFileInfo.wordCount} words)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFileInfo(null);
                    setContent('');
                  }}
                  className="hover:text-emerald-950 dark:hover:text-emerald-100 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-stone-400 font-medium hidden sm:block">
                Auto-extracts text locally
              </div>
            )}
          </div>

          {/* Upload error banner */}
          {uploadError && (
            <div className="px-6 py-2 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Parsing loading state */}
          {isParsingFile && (
            <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
              <span>Extracting and indexing text from document...</span>
            </div>
          )}

          {/* Textarea Area */}
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="notes-area" className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-stone-500" />
                <span>Source Notes & Lecture Content</span>
              </label>

              {content && (
                <button
                  type="button"
                  onClick={() => {
                    setContent('');
                    setUploadedFileInfo(null);
                  }}
                  className="text-xs text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Clear notes
                </button>
              )}
            </div>

            <textarea
              id="notes-area"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste lecture notes, study guide transcripts, book excerpts, or code documentation here..."
              className="w-full px-4 py-3 text-sm bg-stone-50/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-stone-900 dark:text-stone-100 placeholder-stone-400 leading-relaxed font-sans resize-y"
            />

            {/* Metrics bar */}
            <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-4">
                <span>
                  <strong className="font-mono text-stone-800 dark:text-stone-200">{charCount}</strong> characters
                </span>
                <span>
                  <strong className="font-mono text-stone-800 dark:text-stone-200">{wordCount}</strong> words
                </span>
                <span className="hidden sm:inline">
                  ~<strong className="font-mono text-stone-800 dark:text-stone-200">{estimatedTokens}</strong> tokens
                </span>
              </div>
              <div className="text-[11px] text-stone-400">
                Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">Ctrl+Enter</kbd> to generate
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Controls Grid */}
        <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-800 dark:text-stone-200">
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>Card Customization & Synthesis Controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Card Count
              </label>
              <select
                value={cardCount}
                onChange={(e) => {
                  const val = e.target.value;
                  setCardCount(val === 'auto' ? 'auto' : parseInt(val, 10));
                }}
                className="w-full text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="auto">Auto (Density-based)</option>
                <option value="5">5 Cards (Quick review)</option>
                <option value="10">10 Cards (Standard)</option>
                <option value="15">15 Cards (Comprehensive)</option>
                <option value="20">20 Cards (Deep dive)</option>
                <option value="30">30 Cards (Extensive)</option>
              </select>
              <p className="text-[11px] text-stone-400">Auto selects optimal density</p>
            </div>

            {/* Card Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Card Architecture
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value as any)}
                className="w-full text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="mixed">Mixed (Q&A + Cloze + MCQ)</option>
                <option value="basic">Standard Active Recall (Front/Back)</option>
                <option value="cloze">Cloze Deletion (&#123;&#123;c1::term&#125;&#125;)</option>
                <option value="mcq">Multiple Choice (4 Options)</option>
              </select>
              <p className="text-[11px] text-stone-400">Format of memory prompts</p>
            </div>

            {/* Target Audience / Rigor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Target Rigor
              </label>
              <select
                value={rigor}
                onChange={(e) => setRigor(e.target.value as RigorLevel)}
                className="w-full text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="middle_school">Middle School (Accessible)</option>
                <option value="high_school">High School / AP Prep</option>
                <option value="undergrad">Undergrad (Mechanisms)</option>
                <option value="medical_legal">Medical / Legal Boards</option>
              </select>
              <p className="text-[11px] text-stone-400">Depth of reasoning & vocab</p>
            </div>

            {/* Subject Domain */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Subject (Optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biochemistry, Law"
                className="w-full text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-stone-400"
              />
              <p className="text-[11px] text-stone-400">Inferred if left blank</p>
            </div>
          </div>
        </div>

        {/* Forge Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Guaranteed 1 atomic fact per card with temperature 0.3 for maximum fidelity.</span>
          </div>

          <button
            type="submit"
            disabled={!content.trim() || isGenerating}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all shadow-md ${
              !content.trim() || isGenerating
                ? 'bg-stone-300 dark:bg-stone-800 text-stone-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-400 active:scale-[0.98] shadow-amber-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing Flashcards...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Forge Flashcards with AI</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
