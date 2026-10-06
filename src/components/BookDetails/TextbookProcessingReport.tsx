import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Eye,
  Lock,
  Unlock,
  Check,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  DocumentItem,
  Chapter,
  Topic,
  KnowledgeChunk,
  PageCoverageRecord,
  ChapterDetectionDiagnostics,
} from '../../types';
import { storageService } from '../../services/storageService';
import { examPaperService } from '../../services/examPaperService';
import { chapterDetectionService } from '../../services/chapterDetectionService';
import { ocrService } from '../../services/ocrService';

interface TextbookProcessingReportProps {
  document: DocumentItem;
  chapters: Chapter[];
  topics: Topic[];
  chunks: KnowledgeChunk[];
  onConfirmSuccess?: (updatedDoc: DocumentItem, updatedChapters: Chapter[]) => void;
  onNavigateToExamBuilder?: () => void;
}

export const TextbookProcessingReport: React.FC<TextbookProcessingReportProps> = ({
  document,
  chapters,
  topics,
  chunks,
  onConfirmSuccess,
  onNavigateToExamBuilder,
}) => {
  // Page coverage records and cached pages from storage (reactive state)
  const [pageRecords, setPageRecords] = useState<PageCoverageRecord[]>(() =>
    storageService.getPageCoverage(document.id)
  );
  const [rawPages, setRawPages] = useState<any[]>(() =>
    storageService.getDocumentPages(document.id)
  );

  React.useEffect(() => {
    setPageRecords(storageService.getPageCoverage(document.id));
    setRawPages(storageService.getDocumentPages(document.id));
  }, [document.id]);

  // Editable chapter state: never fabricate placeholder Chapter 1 if 0 chapters exist
  const [editedChapters, setEditedChapters] = useState<Chapter[]>(() =>
    chapters.length > 0 ? chapters.map((c) => ({ ...c })) : []
  );

  // Sync when chapters prop changes
  React.useEffect(() => {
    setEditedChapters(chapters.map((c) => ({ ...c })));
  }, [chapters]);

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<ChapterDetectionDiagnostics | null>(() =>
    storageService.getChapterDiagnostics(document.id)
  );

  // Retry chapter detection state
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // Gemini Vision recovery state
  const [isRecoveringPage, setIsRecoveringPage] = useState<number | null>(null);
  const [isRecoveringBatch, setIsRecoveringBatch] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState<string | null>(null);

  // Selected chapter for "VIEW PROCESSING SAMPLE" modal
  const [activeSampleChapter, setActiveSampleChapter] = useState<Chapter | null>(null);

  // Filter for pages view
  const [showAttentionOnly, setShowAttentionOnly] = useState(true);
  const [isPagesExpanded, setIsPagesExpanded] = useState(false);

  // Saving / Confirmation state
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);

  // Language state (Requirement 7: allow teacher to select/confirm)
  const [documentLanguage, setDocumentLanguage] = useState<DocumentItem['language']>(
    document.language || 'Not yet verified'
  );

  const handleLanguageChange = (newLang: DocumentItem['language']) => {
    setDocumentLanguage(newLang);
    const updated: DocumentItem = { ...document, language: newLang };
    storageService.saveDocument(updated);
  };

  // Safe Hybrid OCR Recovery Handler
  const handleRecoverPages = async (targetPages: number[]) => {
    if (targetPages.length === 0) return;
    setIsRecoveringBatch(true);
    if (targetPages.length === 1) {
      setIsRecoveringPage(targetPages[0]);
    }
    setRecoveryProgress(`Initializing Gemini Vision fallback for ${targetPages.length} page(s)...`);

    try {
      await ocrService.processOcr(
        document,
        `/api/document-pdf/${document.id}`,
        targetPages,
        (_curr, _tot, msg) => {
          setRecoveryProgress(msg);
        }
      );

      // Refresh records and pages from storage
      const updatedRecs = storageService.getPageCoverage(document.id);
      const updatedPgs = storageService.getDocumentPages(document.id);
      setPageRecords(updatedRecs);
      setRawPages(updatedPgs);
      setRecoveryProgress(`Successfully recovered ${targetPages.length} page(s) with Gemini Vision.`);
      setTimeout(() => setRecoveryProgress(null), 3500);
    } catch (err: any) {
      console.error('Vision recovery failed:', err);
      setRecoveryProgress(`Vision recovery failed: ${err.message}`);
    } finally {
      setIsRecoveringBatch(false);
      setIsRecoveringPage(null);
    }
  };

  // Document-level calculated numbers (never fabricated!)
  // Canonical Classification:
  // hasUsableText = extractionStatus === "verified" || extractionStatus === "vision_recovered" || extractionStatus === "read"
  // Mutually exclusive: Successfully Read (hasUsableText) + Needing Attention (!hasUsableText) = Total Physical Pages
  const totalPhysicalPages =
    pageRecords.length > 0 ? pageRecords.length : (document.page_count || rawPages.length || 1);
  const usablePagesCount = pageRecords.filter((p) => p.hasUsableText).length;
  const verifiedNativeCount = pageRecords.filter((p) => p.extractionStatus === 'verified').length;
  const visionRecoveredCount = pageRecords.filter((p) => p.extractionStatus === 'vision_recovered').length;
  const attentionPages = pageRecords.filter((p) => !p.hasUsableText);
  const attentionPagesCount = attentionPages.length;

  const totalExtractedChars =
    document.total_extracted_chars ||
    pageRecords.reduce((sum, p) => sum + p.characterCount, 0);

  const approxTotalWords =
    document.total_words ||
    pageRecords.reduce((sum, p) => sum + p.wordCount, 0);

  const coveragePercentage =
    totalPhysicalPages > 0
      ? Number(((usablePagesCount / totalPhysicalPages) * 100).toFixed(1))
      : 100;

  const isConfirmed = !!document.teacher_confirmed;

  // Chapter edit handlers
  const handleUpdateChapter = (idx: number, field: keyof Chapter, value: any) => {
    setEditedChapters((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleAddChapter = () => {
    const nextNum = editedChapters.length + 1;
    const lastChapter = editedChapters[editedChapters.length - 1];
    const newStart = lastChapter ? lastChapter.page_end + 1 : 1;
    const newEnd = Math.min(totalPhysicalPages, newStart + 15);

    const newChap: Chapter = {
      id: `chap-${document.id}-${Date.now()}-${nextNum}`,
      document_id: document.id,
      title: `Chapter ${nextNum}`,
      chapter_number: nextNum,
      page_start: newStart,
      page_end: Math.max(newStart, newEnd),
      status: 'custom',
    };

    setEditedChapters([...editedChapters, newChap]);
  };

  const handleRemoveChapter = (idx: number) => {
    if (editedChapters.length <= 1) return;
    setEditedChapters(editedChapters.filter((_, i) => i !== idx));
  };

  // Helper to extract real excerpts for a chapter from stored physical PDF page text
  const getChapterExcerpts = (chap: Chapter) => {
    const chapPages = rawPages.filter(
      (p) =>
        p.pageNumber >= chap.page_start &&
        p.pageNumber <= chap.page_end &&
        ((p.text && p.text.trim().length > 0) || (p.rawExtractedText && p.rawExtractedText.trim().length > 0))
    );

    const getSampleForPage = (pageObj?: any, fallbackNum?: number) => {
      const pageNum = pageObj?.pageNumber || fallbackNum || 1;
      const rec = pageRecords.find((r) => r.pageNumber === pageNum);
      const text = rec?.finalText || pageObj?.text?.trim() || rec?.rawExtractedText || pageObj?.rawExtractedText || '';
      return {
        pageNum,
        printedNum: rec?.printedPageNumber ?? pageObj?.printedPageNumber ?? (pageNum >= 12 ? pageNum - 11 : undefined),
        sampleText: text.slice(0, 600) || 'No extractable text found on this physical page.',
        rawText: rec?.rawExtractedText || pageObj?.rawExtractedText || text,
        extractionMethod: rec?.extractionMethod || pageObj?.extractionMethod || 'native_pdf',
        extractionStatus: rec?.extractionStatus || pageObj?.extractionStatus || 'needs_review',
        extractionConfidence: rec?.extractionConfidence ?? pageObj?.extractionConfidence ?? 0.5,
        validationFlags: (rec?.validationFlags || pageObj?.validationFlags || []) as string[],
        flagReason: rec?.flagReason || pageObj?.flagReason,
        isTrustworthy: rec?.hasUsableText ?? pageObj?.isTrustworthy ?? false,
      };
    };

    const firstP = chapPages.length > 0 ? chapPages[0] : undefined;
    const midIdx = chapPages.length > 0 ? Math.floor(chapPages.length / 2) : 0;
    const midP = chapPages.length > 0 ? chapPages[midIdx] : undefined;
    const lastP = chapPages.length > 0 ? chapPages[chapPages.length - 1] : undefined;

    return {
      begSample: getSampleForPage(firstP, chap.page_start),
      midSample: getSampleForPage(midP, Math.floor((chap.page_start + chap.page_end) / 2)),
      endSample: getSampleForPage(lastP, chap.page_end),
    };
  };

  // Handler: Confirm mapping
  const handleConfirmMapping = async () => {
    setConfirmationError(null);

    // Validate page numbers
    for (const c of editedChapters) {
      if (!c.title.trim()) {
        setConfirmationError('Every chapter must have a valid title.');
        return;
      }
      if (c.page_start < 1) {
        setConfirmationError(`"${c.title}" physical start page must be at least 1.`);
        return;
      }
      if (c.page_end < c.page_start) {
        setConfirmationError(
          `"${c.title}" end page (${c.page_end}) cannot be less than start page (${c.page_start}).`
        );
        return;
      }
      if (c.page_end > totalPhysicalPages) {
        setConfirmationError(
          `"${c.title}" end page (${c.page_end}) exceeds total physical PDF pages (${totalPhysicalPages}).`
        );
        return;
      }
    }

    // Requirement 2: Sort edited chapters by physical PDF page_start and validate overlapping ranges
    const sorted = [...editedChapters].sort((a, b) => a.page_start - b.page_start);

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      if (curr.page_end >= next.page_start) {
        setConfirmationError(
          `Chapter page ranges overlap:\n${curr.title} (${curr.page_start}–${curr.page_end})\n${next.title} (${next.page_start}–${next.page_end}).\nPlease correct the physical PDF ranges.`
        );
        return;
      }
    }

    setIsConfirming(true);
    try {
      const verifiedChapters: Chapter[] = sorted.map((c, idx) => ({
        ...c,
        chapter_number: idx + 1,
        status: 'verified' as const,
      }));

      // Requirement 5: Do NOT set teacher_confirmed = true if chunks rebuild fails
      if (!rawPages || rawPages.length === 0) {
        throw new Error(
          'Textbook verification could not be completed because chapter source content could not be rebuilt. Please retry.'
        );
      }

      const res = await fetch('/api/rebuild-chapter-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          chapters: verifiedChapters,
          allPages: rawPages,
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

      // 4. Replace stored chapter list authoritatively (removes deleted chapters, obsolete topics, obsolete chunks)
      storageService.replaceChaptersForDocument(document.id, verifiedChapters);

      // 5. Replace document chunks with newly rebuilt verified chunks
      storageService.replaceChunksForDocument(document.id, data.chunks);
      setEditedChapters(verifiedChapters);

      // 6. Mark teacher_confirmed = true
      const updatedDoc: DocumentItem = {
        ...document,
        language: documentLanguage,
        status: 'ready',
        teacher_confirmed: true,
        teacher_confirmed_at: new Date().toISOString(),
        detected_chapters_count: verifiedChapters.length,
      };

      storageService.saveDocument(updatedDoc);

      // 7. Synchronize saved exam paper
      examPaperService.synchronizeSavedPaper(updatedDoc, verifiedChapters);
      setConfirmationSuccess(true);

      if (onConfirmSuccess) {
        onConfirmSuccess(updatedDoc, verifiedChapters);
      }
    } catch (err: any) {
      console.error(err);
      setConfirmationError(
        err.message ||
          'Textbook verification could not be completed because chapter source content could not be rebuilt. Please retry.'
      );
    } finally {
      setIsConfirming(false);
    }
  };

  // Handler: Retry Chapter Detection reusing cached raw document pages
  const handleRetryDetection = async () => {
    setIsRetrying(true);
    setRetryMessage(null);
    setConfirmationError(null);
    try {
      const result = await chapterDetectionService.retryChapterDetection(document.id);
      setEditedChapters(result.chapters);
      if (result.diagnostics) {
        setDiagnostics(result.diagnostics);
      }
      setDocumentLanguage(result.document.language);
      setRetryMessage(
        result.chapters.length > 0
          ? `Retry complete: ${result.chapters.length} chapter(s) detected (${result.diagnostics?.mappingSource || 'deterministic'} scan).`
          : 'Retry complete: No chapter headers detected in text layer. You can add chapters manually.'
      );
      if (onConfirmSuccess) {
        onConfirmSuccess(result.document, result.chapters);
      }
    } catch (err: any) {
      console.error(err);
      setConfirmationError(err.message || 'Retry chapter detection failed.');
    } finally {
      setIsRetrying(false);
    }
  };

  // Chapter-level statistics
  const chapterReports = editedChapters.map((chap) => {
    const rangePages = pageRecords.filter(
      (p) => p.pageNumber >= chap.page_start && p.pageNumber <= chap.page_end
    );
    const totalRange = Math.max(1, chap.page_end - chap.page_start + 1);
    const usableInRange = rangePages.filter((p) => p.hasUsableText).length;
    const attentionInRange = rangePages.filter((p) => !p.hasUsableText);
    const chapChunks = chunks.filter((c) => c.chapter_id === chap.id);
    const chapTopics = topics.filter((t) => t.chapter_id === chap.id);
    const wordsInRange = rangePages.reduce((s, p) => s + p.wordCount, 0);

    const hasAttention = attentionInRange.length > 0;
    const hasVisionRecovered = rangePages.some((p) => p.extractionStatus === 'vision_recovered');

    let status: 'verified' | 'vision_recovered' | 'verify' = 'verify';
    if (!hasAttention && rangePages.length > 0) {
      status = hasVisionRecovered ? 'vision_recovered' : 'verified';
    } else {
      status = 'verify';
    }

    return {
      chap,
      totalRange,
      usableInRange,
      attentionInRange,
      chapChunksCount: chapChunks.length,
      chapTopicsCount: chapTopics.length,
      wordsInRange,
      status,
    };
  });

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                Audited Extraction Record
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                editedChapters.length === 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {editedChapters.length === 0
                  ? 'Text extraction completed, but chapter mapping needs review.'
                  : 'Textbook processed and indexed'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              TEXTBOOK PROCESSING & VERIFICATION REPORT
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              File: <span className="font-semibold text-slate-800">{document.file_name}</span> · Title: <span className="font-semibold text-slate-800">{document.title}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              disabled={isRetrying}
              onClick={handleRetryDetection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Scanning Pages...' : 'RETRY CHAPTER DETECTION'}</span>
            </button>

            {isConfirmed ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>TEACHER CONFIRMED ✓</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>PENDING TEACHER CONFIRMATION</span>
              </span>
            )}
          </div>
        </div>

        {retryMessage && (
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{retryMessage}</span>
          </div>
        )}

        {/* DOCUMENT-LEVEL SUMMARY (Exact Section 2 Requirement) */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            TEXTBOOK PROCESSING SUMMARY
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Physical PDF Pages</span>
              <span className="font-extrabold text-slate-900 text-base">{totalPhysicalPages}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Pages Successfully Read</span>
              <span className="font-extrabold text-emerald-800 text-base">
                {usablePagesCount} / {totalPhysicalPages}
              </span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                {verifiedNativeCount} verified native{visionRecoveredCount > 0 ? `, ${visionRecoveredCount} vision` : ''}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Pages Needing Attention</span>
              <span className={`font-extrabold text-base ${attentionPagesCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {attentionPagesCount}
              </span>
              {attentionPagesCount > 0 && (
                <span className="block text-[10px] text-amber-700 mt-0.5">
                  Needs review or Vision OCR
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Text Coverage</span>
              <span className="font-extrabold text-slate-900 text-base">{coveragePercentage}%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Total Extracted Characters</span>
              <span className="font-semibold text-slate-800 text-sm">
                {totalExtractedChars.toLocaleString()} chars
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Approximate Total Words</span>
              <span className="font-semibold text-slate-800 text-sm">
                ~{approxTotalWords.toLocaleString()} words
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Detected Chapters</span>
              <span className="font-semibold text-slate-800 text-sm">
                {editedChapters.length === 0 ? '0 Chapters' : `${editedChapters.length} Chapters`}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Knowledge Chunks Created</span>
              <span className="font-semibold text-slate-800 text-sm">{chunks.length} Chunks</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Language Specification</span>
              <div className="mt-1 flex items-center gap-1.5">
                <select
                  value={documentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Not yet verified">Not yet verified</option>
                  <option value="English">English</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Bilingual">Bilingual</option>
                  <option value="Other">Other</option>
                </select>
                {documentLanguage !== 'Not yet verified' && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                    Verified ✓
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Chapter Mapping Status</span>
              <span className={`font-bold text-xs ${
                editedChapters.length === 0
                  ? 'text-amber-700'
                  : isConfirmed
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}>
                {editedChapters.length === 0
                  ? 'Mapping not ready'
                  : isConfirmed
                  ? 'Verified & Confirmed'
                  : 'Needs Teacher Verification'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Teacher Confirmation</span>
              <span className={`font-bold text-xs ${isConfirmed ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isConfirmed ? 'Confirmed ✓' : 'Pending'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[11px]">Exam Paper Generation</span>
              <span className={`font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 ${
                isConfirmed ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {isConfirmed ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>UNLOCKED</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>LOCKED</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Safe Hybrid Extraction Action Banner */}
        {attentionPagesCount > 0 && (
          <div className="mt-4 p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-purple-950">
                  Safe Hybrid Extraction Active · {attentionPagesCount} Page(s) Require Attention
                </h3>
                <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                  Native PDF parsing detected damaged fractions, non-standard symbols, or unverified font encodings.
                  You can invoke Gemini Vision fallback to transcribe these pages verbatim with authentic math expressions.
                </p>
                {recoveryProgress && (
                  <p className="text-xs font-semibold text-purple-700 mt-1.5 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{recoveryProgress}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled={isRecoveringBatch}
              onClick={() => handleRecoverPages(attentionPages.map((p) => p.pageNumber))}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isRecoveringBatch ? 'animate-spin' : ''}`} />
              <span>{isRecoveringBatch ? 'Recovering Pages...' : `Recover All Attention Pages (${attentionPagesCount})`}</span>
            </button>
          </div>
        )}
      </div>

      {/* CHAPTER DETECTION DIAGNOSTICS */}
      {diagnostics && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Chapter Detection Diagnostics</span>
            </h3>
            <span className="text-xs text-slate-500">
              Mapping Source: <strong className="font-mono text-slate-800">{diagnostics.mappingSource}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Physical Pages Scanned</span>
              <span className="font-bold text-slate-900 text-sm">{diagnostics.totalPagesScanned}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Chapter Candidates</span>
              <span className="font-bold text-slate-900 text-sm">{diagnostics.candidateHeadingsCount}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">TOC Candidate Pages</span>
              <span className="font-bold text-slate-900 text-sm truncate">
                {diagnostics.tocCandidatePages && diagnostics.tocCandidatePages.length > 0
                  ? diagnostics.tocCandidatePages.join(', ')
                  : 'None (Body Scan)'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Final Detected Chapters</span>
              <span className="font-bold text-slate-900 text-sm">{diagnostics.finalChaptersCount}</span>
            </div>
          </div>

          {diagnostics.first10CandidateHeadings && diagnostics.first10CandidateHeadings.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                First Chapter Candidate Markers:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {diagnostics.first10CandidateHeadings.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono font-medium text-slate-800"
                  >
                    Ch {c.chapterNumber} @ PDF {c.physicalPage}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GLOBAL COVERAGE WARNINGS (Section 6 Requirement) */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-950 font-bold text-xs tracking-wider uppercase">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>PROCESSING WARNINGS & ADVISORIES</span>
        </div>

        <ul className="text-xs text-amber-900 space-y-1.5 list-disc list-inside leading-relaxed">
          {attentionPagesCount > 0 ? (
            <li>
              <strong>{attentionPagesCount} physical PDF pages</strong> contain little or no extractable text.
            </li>
          ) : (
            <li>All physical PDF pages contain extractable text layers.</li>
          )}

          {chapterReports
            .filter((cr) => cr.status === 'verify')
            .map((cr) => (
              <li key={cr.chap.id}>
                <strong>Chapter {cr.chap.chapter_number} ({cr.chap.title})</strong> has only{' '}
                {Math.round((cr.usableInRange / Math.max(1, cr.totalRange)) * 100)}% readable page coverage.
              </li>
            ))}

          <li>
            Mathematical diagrams, geometric constructions, and graphical notation may not be fully represented by textual extraction alone.
          </li>
          <li>
            Scanned or image-only pages may require Optical Character Recognition (OCR) for full coverage.
          </li>
        </ul>
      </div>

      {/* PAGE-LEVEL COVERAGE CHECK (Section 3 Requirement) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Page-Level Text Coverage Audit
            </h3>
            <p className="text-xs text-slate-500">
              Audits physical PDF pages for readable character density and mathematical content
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAttentionOnly(!showAttentionOnly)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              {showAttentionOnly
                ? `Showing Pages Requiring Attention (${attentionPagesCount})`
                : `Showing All Pages (${pageRecords.length})`}
            </button>

            <button
              type="button"
              onClick={() => setIsPagesExpanded(!isPagesExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {isPagesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Attention pages banner */}
        {attentionPagesCount > 0 ? (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2">
            <span className="font-bold text-slate-900 block">
              Pages Requiring Attention ({attentionPagesCount} Physical Pages):
            </span>
            <div className="flex flex-wrap gap-2">
              {attentionPages.slice(0, 15).map((p) => (
                <div
                  key={p.pageNumber}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold"
                >
                  <span>
                    PDF Page {p.pageNumber}
                    {p.printedPageNumber !== undefined ? ` (p.${p.printedPageNumber})` : ''} —{' '}
                    {p.validationFlags && p.validationFlags.length > 0
                      ? p.validationFlags[0].replace(/_/g, ' ')
                      : p.extractionStatus === 'empty'
                      ? 'No text'
                      : 'Low text'}{' '}
                    ({p.characterCount}c)
                  </span>
                  <button
                    type="button"
                    disabled={isRecoveringBatch || isRecoveringPage === p.pageNumber}
                    onClick={() => handleRecoverPages([p.pageNumber])}
                    title="Recover with Gemini Vision"
                    className="p-0.5 text-purple-600 hover:text-purple-800 cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {attentionPages.length > 15 && (
                <span className="px-2.5 py-1 rounded-md text-slate-500 text-[11px]">
                  +{attentionPages.length - 15} more pages
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 italic pt-1">
              Possible reason: "These pages may contain scanned text, diagrams, vertically broken fractions, or non-standard font encodings. Use Gemini Vision to transcribe them verbatim."
            </p>
          </div>
        ) : (
          <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All physical PDF pages have verified usable character content. No damaged or unverified pages detected.</span>
          </p>
        )}

        {/* Detailed Pages Table (Collapsible) */}
        {isPagesExpanded && (
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Physical PDF Page</th>
                  <th className="py-2 px-3">Character Count</th>
                  <th className="py-2 px-3">Method</th>
                  <th className="py-2 px-3">Extraction Status</th>
                  <th className="py-2 px-3">Details / Signal</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {(showAttentionOnly ? attentionPages : pageRecords).map((rec) => (
                  <tr key={rec.pageNumber} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-bold text-slate-900">
                      Page {rec.pageNumber}
                      {rec.printedPageNumber !== undefined ? (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          (p.{rec.printedPageNumber})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 px-3">{rec.characterCount} chars</td>
                    <td className="py-2 px-3 font-mono text-[10px]">
                      {rec.extractionMethod === 'vision' ? 'vision' : 'native_pdf'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rec.extractionStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.extractionStatus === 'vision_recovered'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.extractionStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-500">
                      {rec.flagReason || (rec.validationFlags && rec.validationFlags.length > 0 ? rec.validationFlags.join(', ') : 'Verified text')}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {!rec.hasUsableText && (
                        <button
                          type="button"
                          disabled={isRecoveringBatch || isRecoveringPage === rec.pageNumber}
                          onClick={() => handleRecoverPages([rec.pageNumber])}
                          className="p-1 text-purple-600 hover:text-purple-800 cursor-pointer disabled:opacity-40"
                          title="Recover with Gemini Vision"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CHAPTER-LEVEL PROCESSING REPORT & VERIFICATION (Section 4 & 8 Requirement) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Chapter-Level Processing & Physical Page Alignment
            </h3>
            <p className="text-xs text-slate-500">
              Teacher must verify or adjust start and end physical PDF pages before confirming mapping
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddChapter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Chapter</span>
          </button>
        </div>

        {/* Physical Page Calibration Advisory */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Physical PDF Page Calibration:</strong> Printed textbook page numbers often differ from physical PDF pages due to front covers, prefaces, and roman numeral indices. The ranges below must reference the <strong>actual physical PDF page numbers</strong> (1 to {totalPhysicalPages}) to ensure genuine knowledge chunks.
          </p>
        </div>

        {/* Chapter Table or Empty State */}
        {editedChapters.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">0 Chapters Mapped · Mapping not ready</h4>
              <p className="text-xs text-slate-600 mt-1">
                No chapters mapped yet. Retry automatic detection or add chapters manually.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isRetrying}
                onClick={handleRetryDetection}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>RETRY CHAPTER DETECTION</span>
              </button>
              <button
                type="button"
                onClick={handleAddChapter}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter Manually</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Chapter Title</th>
                  <th className="py-2.5 px-3 w-28 text-center">Physical Start</th>
                  <th className="py-2.5 px-3 w-28 text-center">Physical End</th>
                  <th className="py-2.5 px-3 w-20 text-center">Pages</th>
                  <th className="py-2.5 px-3 w-28 text-center">Read / Attention</th>
                  <th className="py-2.5 px-3 w-20 text-center">Chunks</th>
                  <th className="py-2.5 px-3 w-24 text-center">Status</th>
                  <th className="py-2.5 px-3 w-40 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {chapterReports.map((item, idx) => {
                  const chap = item.chap;
                  return (
                    <tr key={chap.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={chap.title}
                          onChange={(e) => handleUpdateChapter(idx, 'title', e.target.value)}
                          className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={totalPhysicalPages}
                          value={chap.page_start}
                          onChange={(e) =>
                            handleUpdateChapter(
                              idx,
                              'page_start',
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={chap.page_start}
                          max={totalPhysicalPages}
                          value={chap.page_end}
                          onChange={(e) =>
                            handleUpdateChapter(
                              idx,
                              'page_end',
                              Math.max(chap.page_start, parseInt(e.target.value) || chap.page_start)
                            )
                          }
                          className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {item.totalRange}p
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-semibold text-emerald-800">
                          {item.usableInRange} / {item.totalRange}
                        </span>
                        {item.attentionInRange.length > 0 && (
                          <span className="block text-[10px] text-amber-700 font-medium">
                            {item.attentionInRange.length} flag
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {item.chapChunksCount}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'vision_recovered'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status === 'verified'
                            ? 'VERIFIED ✓'
                            : item.status === 'vision_recovered'
                            ? 'VISION RECOVERED'
                            : 'NEEDS REVIEW ⚠'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center space-x-1">
                        {/* VIEW PROCESSING SAMPLE BUTTON */}
                        <button
                          type="button"
                          onClick={() => setActiveSampleChapter(chap)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors cursor-pointer"
                          title="View Actual Extracted Excerpts"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          <span>Preview</span>
                        </button>

                        {item.attentionInRange.length > 0 && (
                          <button
                            type="button"
                            disabled={isRecoveringBatch}
                            onClick={() => handleRecoverPages(item.attentionInRange.map((p) => p.pageNumber))}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition-colors cursor-pointer border border-purple-200 disabled:opacity-50"
                            title="Recover unverified pages in this chapter using Gemini Vision"
                          >
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>Recover ({item.attentionInRange.length})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveChapter(idx)}
                          disabled={editedChapters.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          title="Remove chapter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation error notice */}
        {confirmationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{confirmationError}</span>
          </div>
        )}

        {/* Confirmation success notice */}
        {confirmationSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Textbook and chapter mappings confirmed! Real knowledge chunks rebuilt. Exam paper generation is now unlocked.
            </span>
          </div>
        )}

        {/* Action Button: CONFIRM TEXTBOOK & CHAPTER MAPPING */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {editedChapters.length} Chapters · {editedChapters.length === 0 ? 'Mapping not ready' : `Total verified range: Page ${editedChapters[0]?.page_start || 1} to Page ${editedChapters[editedChapters.length - 1]?.page_end || totalPhysicalPages}`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isConfirming || editedChapters.length === 0}
              onClick={handleConfirmMapping}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                editedChapters.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : isConfirmed
                  ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer'
              }`}
            >
              {isConfirming ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Rebuilding Knowledge Chunks...</span>
                </>
              ) : isConfirmed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>UPDATE CONFIRMED CHAPTER MAPPING</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>CONFIRM TEXTBOOK & CHAPTER MAPPING</span>
                </>
              )}
            </button>

            {isConfirmed && onNavigateToExamBuilder && (
              <button
                type="button"
                onClick={onNavigateToExamBuilder}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                <span>Proceed to Exam Builder</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CHAPTER CONTENT PREVIEW MODAL (VIEW PROCESSING SAMPLE - Section 5 Requirement) */}
      {activeSampleChapter && (() => {
        const samples = getChapterExcerpts(activeSampleChapter);
        const chapTopics = topics.filter((t) => t.chapter_id === activeSampleChapter.id);

        const renderExcerptCard = (title: string, s: any) => {
          const isRecovering = isRecoveringPage === s.pageNum;
          return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800">
                <div>
                  <span>{title}</span>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Physical PDF Page {s.pageNum}
                    {s.printedNum !== undefined ? ` · Printed Page ${s.printedNum}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    s.extractionMethod === 'vision'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {s.extractionMethod === 'vision' ? 'Gemini Vision' : 'Native PDF'}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    s.extractionStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : s.extractionStatus === 'vision_recovered'
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {s.extractionStatus === 'verified'
                      ? 'VERIFIED ✓'
                      : s.extractionStatus === 'vision_recovered'
                      ? 'VISION RECOVERED'
                      : 'NEEDS REVIEW ⚠'}
                  </span>

                  <span className="text-[10px] text-slate-400 font-medium">
                    ({Math.round((s.extractionConfidence || 0.5) * 100)}% conf)
                  </span>
                </div>
              </div>

              {s.validationFlags && s.validationFlags.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Text Quality Signal: </span>
                    {s.flagReason || s.validationFlags.join(', ')}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-700 leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-line max-h-48 overflow-y-auto">
                {s.sampleText}
              </p>

              {(!s.isTrustworthy || s.extractionStatus === 'needs_review' || (s.validationFlags && s.validationFlags.length > 0)) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500">
                    Detected damaged layout or font corruption. Recover with Gemini Vision fallback.
                  </span>
                  <button
                    type="button"
                    disabled={isRecoveringBatch || isRecovering}
                    onClick={() => handleRecoverPages([s.pageNum])}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isRecovering ? 'animate-spin' : ''}`} />
                    <span>{isRecovering ? 'Transcribing...' : 'Recover with Gemini Vision'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 transition-all max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Authentic PDF Text Excerpt Preview
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Chapter {activeSampleChapter.chapter_number}: {activeSampleChapter.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Physical PDF Pages: {activeSampleChapter.page_start}–{activeSampleChapter.page_end}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSampleChapter(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Advisory note */}
              <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 shrink-0">
                These excerpts show authentic extracted textbook content and validation status. Damaged mathematical expressions or corrupted font encodings can be recovered using Gemini Vision.
              </div>

              {recoveryProgress && (
                <div className="mt-3 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-medium text-purple-700 flex items-center gap-2 shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
                  <span>{recoveryProgress}</span>
                </div>
              )}

              {/* Excerpts List */}
              <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
                {renderExcerptCard('Beginning of Chapter Sample', samples.begSample)}
                {renderExcerptCard('Middle of Chapter Sample', samples.midSample)}
                {renderExcerptCard('End of Chapter Sample', samples.endSample)}

                {/* Detected Topics List */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">
                      Curricular Learning Units & Subtopics ({chapTopics.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      AI Classifications (Not authentic textbook headings)
                    </span>
                  </div>
                  {chapTopics.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {chapTopics.map((top) => (
                        <div
                          key={top.id}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 flex items-center justify-between gap-2"
                        >
                          <span className="font-medium">{top.title}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold shrink-0 uppercase tracking-wider">
                            {top.category === 'authentic_heading' ? 'Textbook Heading' : 'AI Classification'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Standard core chapter topics will be analyzed during weightage assignment.
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSampleChapter(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
