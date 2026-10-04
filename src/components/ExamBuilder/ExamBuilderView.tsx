import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  ShieldCheck,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Edit2,
  FileCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Upload,
  Lock,
} from 'lucide-react';
import {
  DocumentItem,
  Chapter,
  ClassVIExamPaper,
  QuestionSlot,
  ChapterWeightage,
  WeightageMode,
  SectionBlueprint,
  QuestionItem,
} from '../../types';
import { examPaperService } from '../../services/examPaperService';
import { storageService } from '../../services/storageService';
import { SolverResult } from '../../services/constraintSolver';
import { ChapterWeightageSelector } from './ChapterWeightageSelector';
import { ChapterVerificationModal } from './ChapterVerificationModal';
import { WeightageReviewModal } from './WeightageReviewModal';
import { PaperHealthCard } from './PaperHealthCard';
import { ReplaceQuestionModal } from './ReplaceQuestionModal';
import { PrintExamPaperModal } from './PrintExamPaperModal';
import { SourceModal } from '../QuestionReview/SourceModal';
import { EditQuestionModal } from '../QuestionReview/EditQuestionModal';

interface ExamBuilderViewProps {
  documents: DocumentItem[];
  onOpenUpload: () => void;
  onNavigateToLibrary: () => void;
}

export const ExamBuilderView: React.FC<ExamBuilderViewProps> = ({
  documents,
  onOpenUpload,
  onNavigateToLibrary,
}) => {
  // Requirement 8: Real exam builder must require a real textbook, never silently fallback to unrelated doc
  const realDocuments = documents.filter((d) => !d.is_demo);
  const realMathBook = realDocuments.find(
    (d) =>
      d.title.toLowerCase().includes('class vi') ||
      d.title.toLowerCase().includes('class 6') ||
      d.title.toLowerCase().includes('math') ||
      d.title.includes('গণিত')
  );
  const defaultRealBook = realMathBook;

  const [useDemoBook, setUseDemoBook] = useState(false);
  const sampleBook =
    documents.find((d) => d.id === 'doc-class6-math-sample') || documents.find((d) => d.is_demo);

  const activeInitialBook = defaultRealBook || (useDemoBook ? sampleBook : undefined);

  const [selectedBookId, setSelectedBookId] = useState<string>(activeInitialBook?.id || '');
  const [currentBook, setCurrentBook] = useState<DocumentItem | undefined>(activeInitialBook);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Paper state
  const [paper, setPaper] = useState<ClassVIExamPaper | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [solverDeficiency, setSolverDeficiency] = useState<SolverResult | null>(null);

  // Modals
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeReplaceSlot, setActiveReplaceSlot] = useState<QuestionSlot | null>(null);
  const [activeSourceSlot, setActiveSourceSlot] = useState<QuestionSlot | null>(null);
  const [activeEditSlot, setActiveEditSlot] = useState<QuestionSlot | null>(null);

  // Generation state
  const [isGeneratingPaper, setIsGeneratingPaper] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingSlotText, setCurrentGeneratingSlotText] = useState('');

  // Expandable sections in paper view
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec-a': true,
    'sec-b': true,
    'sec-c': true,
    'sec-d': true,
  });

  // Load book & chapters
  useEffect(() => {
    if (selectedBookId) {
      const book = documents.find((d) => d.id === selectedBookId);
      if (book) {
        setCurrentBook(book);
        const chaps = storageService.getChapters(book.id);
        setChapters(chaps);
        const p = examPaperService.getOrCreatePaper(book, chaps);
        setPaper(p);
      }
    } else if (defaultRealBook) {
      setSelectedBookId(defaultRealBook.id);
    }
  }, [selectedBookId, documents, defaultRealBook]);

  // Requirement 9: If no real uploaded textbook exists and demo not explicitly requested, show real exam requirement screen
  if (realDocuments.length === 0 && !useDemoBook) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-8 border border-slate-800 shadow-md">
          <div className="max-w-xl space-y-3">
            <span className="text-[11px] font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Real Examination Requirement
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              Class VI Mathematics (70-Mark Summative Exam)
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload your actual Class VI Mathematics textbook PDF to begin the real 70-mark examination.
              Unrelated demo textbooks are strictly prevented from automatically entering real examination mode to guarantee authentic syllabus citations and marking schemes.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenUpload}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-950 rounded-xl font-bold text-xs hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Class VI Mathematics Textbook PDF</span>
              </button>

              {sampleBook && (
                <button
                  type="button"
                  onClick={() => {
                    setUseDemoBook(true);
                    setSelectedBookId(sampleBook.id);
                  }}
                  className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Explore with DEMO / SAMPLE Book (Testing Only)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3 Core Rules Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900">100% Genuine Textbook Grounding</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Every question slot extracts authentic physical page excerpts from your uploaded PDF with zero hallucinations.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Strict Chapter Marks Lock</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Deterministic integer solver ensures chapter marks total exactly 70 marks across Sections A, B, C, and D.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900">Physical PDF Page Verification</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Verify and align detected printed page numbers with actual PDF cover and preface offsets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!paper || !currentBook) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
        <p className="text-xs text-slate-500">Loading Class VI Mathematics Workspace...</p>
      </div>
    );
  }

  // Requirement 3 & 5: Handler for confirming physical chapter mapping
  const handleConfirmChapterMapping = async (verifiedChapters: Chapter[]) => {
    // 1. Rebuild chunks and strictly validate for real books
    const docPages = storageService.getDocumentPages(currentBook.id);
    if (!currentBook.is_demo) {
      if (!docPages || docPages.length === 0) {
        throw new Error(
          'Textbook verification could not be completed because chapter source content could not be rebuilt. Please retry.'
        );
      }

      const res = await fetch('/api/rebuild-chapter-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: currentBook.id,
          chapters: verifiedChapters,
          allPages: docPages,
        }),
      });

      if (!res.ok) {
        throw new Error(
          'Textbook verification could not be completed because chapter source content could not be rebuilt. Please retry.'
        );
      }

      const data = await res.json();
      if (!data.chunks || !Array.isArray(data.chunks) || data.chunks.length === 0) {
        throw new Error(
          'Textbook verification could not be completed because chapter source content could not be rebuilt. Please retry.'
        );
      }

      // Check that every verified chapter received at least one chunk
      for (const vc of verifiedChapters) {
        const chapterChunks = data.chunks.filter((chk: any) => chk.chapter_id === vc.id);
        if (!chapterChunks || chapterChunks.length === 0) {
          throw new Error(
            'Textbook verification could not be completed because chapter source content could not be rebuilt. Please retry.'
          );
        }
      }

      storageService.replaceChunksForDocument(currentBook.id, data.chunks);
    } else if (docPages.length > 0) {
      try {
        const res = await fetch('/api/rebuild-chapter-chunks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: currentBook.id,
            chapters: verifiedChapters,
            allPages: docPages,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.chunks && Array.isArray(data.chunks)) {
            storageService.replaceChunksForDocument(currentBook.id, data.chunks);
          }
        }
      } catch (e) {
        console.warn('Could not rebuild chunks on backend:', e);
      }
    }

    // 2. Save all updated chapters to storage
    verifiedChapters.forEach((vc) => storageService.saveChapter(vc));
    setChapters(verifiedChapters);

    // 3. Mark document verified and confirmed by teacher ONLY after successful rebuild
    const updatedDoc: DocumentItem = {
      ...currentBook,
      status: 'ready',
      teacher_confirmed: true,
      teacher_confirmed_at: new Date().toISOString(),
      detected_chapters_count: verifiedChapters.length,
    };
    storageService.saveDocument(updatedDoc);
    setCurrentBook(updatedDoc);

    // 4. Update paper weightage and slots with verified chapters
    const updatedPaper = examPaperService.getOrCreatePaper(updatedDoc, verifiedChapters);
    setPaper(updatedPaper);
    setSolverDeficiency(null);
  };

  const handleModeChange = (mode: WeightageMode) => {
    const updated = examPaperService.updateWeightage(paper, paper.chaptersWeightage, mode);
    setPaper(updated);
    setSolverDeficiency(null);
  };

  const handleChaptersChange = (updatedWeights: ChapterWeightage[]) => {
    const updated = examPaperService.updateWeightage(paper, updatedWeights, paper.weightageMode);
    setPaper(updated);
    setSolverDeficiency(null);
  };

  const handleSolveAndProceed = () => {
    setIsSolving(true);
    setSolverDeficiency(null);

    const res = examPaperService.generateBlueprintSlots(paper);
    setIsSolving(false);

    if (res.success) {
      setPaper(res.paper);
      setIsReviewModalOpen(true);
    } else {
      setSolverDeficiency(res as SolverResult);
    }
  };

  const handleApplySolverSuggestion = (adjustment: {
    chapters?: { chapter_id: string; marks: number }[];
    sections?: SectionBlueprint[];
  }) => {
    let updatedWeights = [...paper.chaptersWeightage];
    if (adjustment.chapters) {
      updatedWeights = updatedWeights.map((cw) => {
        const found = adjustment.chapters?.find((a) => a.chapter_id === cw.chapter_id);
        if (found) {
          return {
            ...cw,
            marks: found.marks,
            percentage: Number(((found.marks / 70) * 100).toFixed(1)),
          };
        }
        return cw;
      });
    }

    let updatedPaper: ClassVIExamPaper = {
      ...paper,
      chaptersWeightage: updatedWeights,
      sections: adjustment.sections || paper.sections,
    };

    updatedPaper = examPaperService.updateWeightage(updatedPaper, updatedWeights, paper.weightageMode);
    setPaper(updatedPaper);
    setSolverDeficiency(null);
  };

  const handleStartGeneration = async () => {
    setIsReviewModalOpen(false);

    if (!currentBook?.teacher_confirmed && !currentBook?.is_demo) {
      setIsVerificationModalOpen(true);
      return;
    }

    setIsGeneratingPaper(true);
    setGenerationProgress(0);

    try {
      const finished = await examPaperService.generateFullPaper(paper, (slot, progressPct) => {
        setGenerationProgress(progressPct);
        setCurrentGeneratingSlotText(
          `Slot #${slot.slotNumber} of ${paper.slots.length}: "${slot.chapterTitle}" (${slot.marks} Marks)`
        );
        // Live update in slots
        setPaper((prev) => {
          if (!prev) return prev;
          const slots = [...prev.slots];
          const idx = slots.findIndex((s) => s.slotNumber === slot.slotNumber);
          if (idx !== -1) {
            slots[idx] = slot;
          }
          return { ...prev, slots };
        });
      });

      setPaper(finished);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPaper(false);
    }
  };

  const handleConfirmReplace = async (
    strategy: 'similar' | 'easier' | 'harder' | 'different_topic',
    newChapterId?: string
  ) => {
    if (!activeReplaceSlot) return;

    if (newChapterId && newChapterId !== activeReplaceSlot.chapterId) {
      // Reassign chapter
      const oldChap = activeReplaceSlot.chapterTitle;
      const targetChap = paper.chaptersWeightage.find((c) => c.chapter_id === newChapterId);

      const updatedSlots = paper.slots.map((s) => {
        if (s.slotNumber === activeReplaceSlot.slotNumber) {
          return {
            ...s,
            chapterId: newChapterId,
            chapterTitle: targetChap?.chapter_title || s.chapterTitle,
            status: 'pending' as const,
          };
        }
        return s;
      });

      // Update chapter weightage totals
      const updatedWeights = paper.chaptersWeightage.map((cw) => {
        if (cw.chapter_id === activeReplaceSlot.chapterId) {
          return { ...cw, marks: Math.max(0, cw.marks - activeReplaceSlot.marks) };
        }
        if (cw.chapter_id === newChapterId) {
          return { ...cw, marks: cw.marks + activeReplaceSlot.marks };
        }
        return cw;
      });

      let updatedPaper: ClassVIExamPaper = {
        ...paper,
        slots: updatedSlots,
        chaptersWeightage: updatedWeights,
      };

      const regeneratedSlot = await examPaperService.generateSlotQuestion(
        updatedPaper,
        updatedSlots.find((s) => s.slotNumber === activeReplaceSlot.slotNumber)!
      );

      const finalSlots = updatedSlots.map((s) =>
        s.slotNumber === activeReplaceSlot.slotNumber ? regeneratedSlot : s
      );

      updatedPaper.slots = finalSlots;
      updatedPaper.paperHealth = examPaperService.computePaperHealth(finalSlots, updatedWeights, 70);
      examPaperService.savePaper(updatedPaper);
      setPaper(updatedPaper);
    } else {
      // Strict hard constraint: same chapter & same marks
      const updatedPaper = await examPaperService.replaceSlotQuestion(
        paper,
        activeReplaceSlot.slotNumber,
        strategy
      );
      setPaper(updatedPaper);
    }

    setActiveReplaceSlot(null);
  };

  const toggleSectionExpand = (secId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const isPaperGenerated = paper.slots.length > 0 && paper.slots.some((s) => s.status === 'generated');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Class VI Mathematics Examination Builder
            </h1>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-300">
              70 Marks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real school examination engine with hard chapter weightage constraints & deterministic slot allocation
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isPaperGenerated && (
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print / Export 70M Paper</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Upload Textbook PDF</span>
          </button>
        </div>
      </div>

      {/* Textbook Source Banner */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200">
            <BookOpen className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Selected Textbook:</span>
              <span className="font-bold text-slate-900 text-sm">{currentBook.title}</span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              File: {currentBook.file_name} · {chapters.length} Detected Chapters · Strict Source Grounding Active
            </p>
          </div>
        </div>

        {/* Change book dropdown if teacher has multiple */}
        {documents.length > 1 && (
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.is_demo ? `[DEMO / SAMPLE] ${d.title}` : d.title} ({d.page_count}p)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Requirement 8 & 10: Teacher Confirmation Lock Banner */}
      {!currentBook.teacher_confirmed && !currentBook.is_demo && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
              <Lock className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <span className="font-extrabold text-amber-950 text-sm block">
                EXAM GENERATION LOCKED: Pending Teacher Confirmation
              </span>
              <p className="text-amber-900 text-xs mt-0.5 leading-relaxed">
                Textbook processing completed. Please verify chapter page ranges and confirm textbook before generating examination.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsVerificationModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-950 hover:bg-amber-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Verify & Confirm Chapters</span>
          </button>
        </div>
      )}

      {/* PAPER HEALTH CARD (When slots exist) */}
      {paper.slots.length > 0 && (
        <PaperHealthCard health={paper.paperHealth} />
      )}

      {/* Live Generation Progress Card */}
      {isGeneratingPaper && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Generating 70-Mark Question Paper...
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {currentGeneratingSlotText || 'Processing slots with strict textbook source grounding...'}
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-md mx-auto">
            <div
              className="bg-slate-900 h-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block font-semibold">
            {generationProgress}% Completed · Gemini 3.8 Flash
          </span>
        </div>
      )}

      {/* Main Two-State Flow: Configuration vs Generated Paper */}
      {!isGeneratingPaper && !isPaperGenerated ? (
        /* Configuration Phase: Chapter Weightage & Solver */
        <ChapterWeightageSelector
          chapters={paper.chaptersWeightage}
          document={currentBook}
          mode={paper.weightageMode}
          onModeChange={handleModeChange}
          onChaptersChange={handleChaptersChange}
          onSolveAndProceed={handleSolveAndProceed}
          onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
          solverDeficiency={solverDeficiency}
          onApplySuggestion={handleApplySolverSuggestion}
        />
      ) : (
        /* Paper Ready Phase: Sections with Question Slots */
        !isGeneratingPaper && (
          <div className="space-y-6">
            {/* Paper Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  {paper.slots.length} Question Slots Allocated Across 4 Sections
                </span>
                <p className="text-slate-500 text-[11px]">
                  Every question slot preserves its assigned marks and chapter weightage quota.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reconfigure chapter weightage? This will return to the blueprint editor.')) {
                      setPaper({
                        ...paper,
                        slots: [],
                        status: 'configuring',
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reconfigure Weightage</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartGeneration}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regenerate Entire Paper</span>
                </button>
              </div>
            </div>

            {/* Sections Accordions */}
            <div className="space-y-4">
              {paper.sections.map((sec) => {
                const secSlots = paper.slots.filter((s) => s.sectionId === sec.id);
                const isExpanded = expandedSections[sec.id] !== false;

                return (
                  <div key={sec.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Section Header */}
                    <div
                      onClick={() => toggleSectionExpand(sec.id)}
                      className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {sec.name.replace('Section ', '')}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{sec.name}</h3>
                            <span className="text-[11px] font-semibold text-slate-500">
                              ({sec.numberOfQuestions} Questions × {sec.marksPerQuestion}M = {sec.totalSectionMarks} Marks)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal">
                            {sec.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">
                          {secSlots.filter((s) => s.status === 'generated').length} / {secSlots.length} Ready
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Section Slots List */}
                    {isExpanded && (
                      <div className="p-4 divide-y divide-slate-100">
                        {secSlots.map((slot) => {
                          const qItem = slot.questionItem;
                          const hasError = slot.status === 'failed' || slot.status === 'source_required';

                          return (
                            <div key={slot.slotNumber} className="py-4 first:pt-0 last:pb-0 space-y-3">
                              {/* Slot Metadata Bar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                    Q{slot.slotNumber}
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {slot.chapterTitle}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="font-semibold text-slate-700">
                                    {slot.marks} {slot.marks === 1 ? 'Mark' : 'Marks'}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="uppercase text-slate-500 font-medium">
                                    {slot.questionType.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="capitalize text-slate-500 font-medium">
                                    {slot.difficulty}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {slot.status === 'generated' ? (
                                    qItem?.source_grounding_status === 'verified' ? (
                                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Verified</span>
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>Needs Review</span>
                                      </span>
                                    )
                                  ) : slot.status === 'generating' ? (
                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Generating...</span>
                                    </span>
                                  ) : hasError ? (
                                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>Source Required</span>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400">Pending</span>
                                  )}
                                </div>
                              </div>

                              {/* Question Body */}
                              {qItem ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-slate-900 leading-relaxed font-sans whitespace-pre-line">
                                    {qItem.question_text}
                                  </p>

                                  {/* MCQ Options */}
                                  {qItem.options && qItem.options.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-800 font-sans pt-1">
                                      {qItem.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                          {opt}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Model Answer Preview */}
                                  {qItem.answer && (
                                    <div className="mt-2 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs text-slate-800 leading-relaxed font-sans">
                                      <span className="font-bold text-slate-900 block mb-0.5">Model Answer / Solution:</span>
                                      <p>{qItem.answer.answer_text}</p>
                                    </div>
                                  )}
                                </div>
                              ) : hasError ? (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-1">
                                  <p className="font-bold">{slot.errorReason}</p>
                                  <p className="text-[11px] text-rose-800">
                                    In accordance with Real Exam Grounding Rules, questions cannot be fabricated without textbook passages.
                                  </p>
                                </div>
                              ) : null}

                              {/* Slot Action Bar */}
                              <div className="pt-2 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                                  {qItem?.source && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveSourceSlot(slot)}
                                      className="hover:text-slate-900 font-medium underline cursor-pointer"
                                    >
                                      Source: Pages {qItem.source.page_start}–{qItem.source.page_end}
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {qItem && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveEditSlot(slot)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setActiveReplaceSlot(slot)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer shadow-2xs"
                                  >
                                    <RefreshCw className="w-3 h-3 text-amber-400" />
                                    <span>Replace Slot</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Pre-Generation Weightage Summary Review Modal */}
      <WeightageReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        paper={paper}
        onConfirmAndGenerate={handleStartGeneration}
      />

      {/* Replace Slot Modal (Preserves chapter & marks constraint) */}
      {activeReplaceSlot && (
        <ReplaceQuestionModal
          isOpen={true}
          onClose={() => setActiveReplaceSlot(null)}
          slot={activeReplaceSlot}
          allChapters={paper.chaptersWeightage}
          onConfirmReplace={handleConfirmReplace}
        />
      )}

      {/* Official Print/Export Paper Modal */}
      <PrintExamPaperModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        paper={paper}
      />

      {/* Source Viewer Modal */}
      {activeSourceSlot && activeSourceSlot.questionItem?.source && (
        <SourceModal
          isOpen={true}
          onClose={() => setActiveSourceSlot(null)}
          source={activeSourceSlot.questionItem.source}
          isVerified={activeSourceSlot.questionItem.source_grounding_status === 'verified'}
        />
      )}

      {/* Chapter Physical PDF Page Verification Modal */}
      <ChapterVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        document={currentBook}
        chapters={chapters}
        onConfirmMapping={handleConfirmChapterMapping}
      />

      {/* Edit Slot Question Modal */}
      {activeEditSlot && activeEditSlot.questionItem && (
        <EditQuestionModal
          isOpen={true}
          onClose={() => setActiveEditSlot(null)}
          question={activeEditSlot.questionItem}
          onSave={(updatedQ) => {
            const updatedSlots = paper.slots.map((s) =>
              s.slotNumber === activeEditSlot.slotNumber
                ? { ...s, questionItem: updatedQ }
                : s
            );
            const health = examPaperService.computePaperHealth(
              updatedSlots,
              paper.chaptersWeightage,
              70
            );
            const updated = {
              ...paper,
              slots: updatedSlots,
              paperHealth: health,
            };
            examPaperService.savePaper(updated);
            setPaper(updated);
            setActiveEditSlot(null);
          }}
        />
      )}
    </div>
  );
};
