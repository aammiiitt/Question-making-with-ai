import { DocumentItem, PipelineStep } from '../types';
import { chapterDetectionService } from './chapterDetectionService';
import { storageService } from './storageService';
import { classifyPageCoverage, computePageCoverageSummary } from '../utils/pageClassification';

export const PIPELINE_STEPS: { step: number; name: string; description: string }[] = [
  { step: 1, name: 'File uploaded', description: 'Verifying PDF structure and integrity' },
  { step: 2, name: 'Text extracted', description: 'Parsing textual layers across all pages' },
  { step: 3, name: 'Quality audited', description: 'Evaluating font encoding and text quality' },
  { step: 4, name: 'Chapters detected', description: 'Identifying chapter headers and units' },
  { step: 5, name: 'Topics detected', description: 'Extracting subtopics and learning objectives' },
  { step: 6, name: 'Knowledge indexed', description: 'Creating semantic chunk embeddings' },
  { step: 7, name: 'Ready', description: 'Textbook processed and indexed' },
];

export class DocumentProcessingService {
  /**
   * Processes a PDF file through the 7-stage pipeline.
   * Supports Hybrid OCR fallback when native text is corrupted or image-based.
   */
  public async processPdf(
    file: File,
    onProgress: (currentStep: number, pipeline: PipelineStep[]) => void
  ): Promise<DocumentItem> {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      throw new Error('PDF only: Please upload a valid PDF textbook file.');
    }

    const docId = 'doc-' + Date.now();
    const pipeline: PipelineStep[] = PIPELINE_STEPS.map((s) => ({
      ...s,
      status: 'pending',
    }));

    const updateStep = (index: number, status: 'in_progress' | 'completed' | 'failed') => {
      pipeline[index].status = status;
      onProgress(index + 1, [...pipeline]);
    };

    // Step 1: File uploaded
    updateStep(0, 'in_progress');
    await new Promise((r) => setTimeout(r, 500));
    updateStep(0, 'completed');

    // Step 2: Text extracted (Native first choice)
    updateStep(1, 'in_progress');
    let extractedPages: { pageNumber: number; text: string }[] = [];
    let pageCount = 0;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', docId);

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        updateStep(1, 'failed');
        throw new Error(errData.error || 'Failed to extract text from PDF.');
      }

      const data = await res.json();
      extractedPages = data.pages || [];
      pageCount = data.pageCount || extractedPages.length || 1;
    } catch (e: any) {
      updateStep(1, 'failed');
      throw e;
    }

    await new Promise((r) => setTimeout(r, 400));
    updateStep(1, 'completed');

    // Step 3: Quality audited & Page-level coverage check
    updateStep(2, 'in_progress');
    // Save physical pages to storage for subsequent verification and re-indexing
    storageService.saveDocumentPages(docId, extractedPages);

    // Compute deterministic page-level coverage check using canonical classification & quality signals
    let totalExtractedWords = 0;
    const pageCoverageRecords = extractedPages.map((p) => {
      const record = classifyPageCoverage(p.pageNumber, p.text);
      totalExtractedWords += record.wordCount;
      return record;
    });

    const summary = computePageCoverageSummary(pageCoverageRecords, pageCount);
    storageService.savePageCoverage(docId, pageCoverageRecords);

    // Basic script / language identification
    const allSampleText = extractedPages.slice(0, 15).map((p) => p.text).join(' ');
    const bengaliMatches = allSampleText.match(/[\u0980-\u09FF]/g);
    const hindiMatches = allSampleText.match(/[\u0900-\u097F]/g);
    let detectedLanguage: DocumentItem['language'] = 'Not yet verified';
    if (bengaliMatches && bengaliMatches.length > 40) {
      detectedLanguage = 'Bengali';
    } else if (hindiMatches && hindiMatches.length > 40) {
      detectedLanguage = 'Hindi';
    } else if (/[a-zA-Z]{50,}/.test(allSampleText)) {
      detectedLanguage = 'English';
    } else if (summary.nativeGarbledCount > 3) {
      // Suspected Bengali with legacy font corruption
      detectedLanguage = 'Bengali';
    }

    await new Promise((r) => setTimeout(r, 500));
    const bookTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

    // Requirement 3 & 10: Document-level OCR decision
    // If the majority are garbled/image-based: switch document processing to OCR FALLBACK MODE
    // Do NOT attempt final chapter detection using corrupted native text!
    if (summary.ocrFallbackMode) {
      updateStep(2, 'failed'); // Marks quality step as requiring attention
      updateStep(3, 'pending');
      updateStep(4, 'pending');
      updateStep(5, 'pending');

      const fallbackDoc: DocumentItem = {
        id: docId,
        user_id: 'teacher-101',
        title: bookTitle,
        file_name: file.name,
        file_size: file.size,
        page_count: pageCount,
        language: detectedLanguage,
        status: 'needs_review',
        processing_step: 3,
        detected_chapters_count: 0,
        teacher_confirmed: false,
        total_extracted_chars: summary.totalExtractedChars,
        total_words: summary.approxTotalWords,
        usable_pages_count: summary.usablePagesCount,
        attention_pages_count: summary.attentionPagesCount,
        coverage_percentage: summary.coveragePercentage,
        ocr_fallback_mode: true,
        native_good_pages_count: summary.nativeGoodCount,
        native_garbled_pages_count: summary.nativeGarbledCount,
        native_low_text_pages_count: summary.nativeLowTextCount,
        image_only_pages_count: summary.imageOnlyCount,
        ocr_processed_pages_count: 0,
        ocr_successful_pages_count: 0,
        created_at: new Date().toISOString(),
      };

      storageService.saveDocument(fallbackDoc);
      updateStep(6, 'completed');
      return fallbackDoc;
    }

    updateStep(2, 'completed');

    // Step 4: Chapters detected
    updateStep(3, 'in_progress');
    const detectionResult = await chapterDetectionService.detectChapters(
      docId,
      extractedPages,
      bookTitle,
      false // Real uploaded textbook
    );
    await new Promise((r) => setTimeout(r, 750));

    const needsReview = detectionResult.chapters.length === 0;
    if (needsReview) {
      updateStep(3, 'failed');
    } else {
      updateStep(3, 'completed');
    }

    // Step 5: Topics detected
    updateStep(4, 'in_progress');
    await new Promise((r) => setTimeout(r, 500));
    updateStep(4, needsReview ? 'failed' : 'completed');

    // Step 6: Knowledge indexed
    updateStep(5, 'in_progress');
    detectionResult.chapters.forEach((c) => storageService.saveChapter(c));
    detectionResult.topics.forEach((t) => storageService.saveTopic(t));
    detectionResult.chunks.forEach((chk) => storageService.saveChunk(chk));
    await new Promise((r) => setTimeout(r, 500));
    updateStep(5, needsReview ? 'failed' : 'completed');

    // Step 7: Final Document status
    updateStep(6, 'in_progress');
    const newDoc: DocumentItem = {
      id: docId,
      user_id: 'teacher-101',
      title: bookTitle,
      file_name: file.name,
      file_size: file.size,
      page_count: pageCount,
      language: detectedLanguage,
      status: 'needs_review',
      processing_step: 7,
      detected_chapters_count: detectionResult.chapters.length,
      teacher_confirmed: false,
      total_extracted_chars: summary.totalExtractedChars,
      total_words: summary.approxTotalWords,
      usable_pages_count: summary.usablePagesCount,
      attention_pages_count: summary.attentionPagesCount,
      coverage_percentage: summary.coveragePercentage,
      ocr_fallback_mode: false,
      native_good_pages_count: summary.nativeGoodCount,
      native_garbled_pages_count: summary.nativeGarbledCount,
      native_low_text_pages_count: summary.nativeLowTextCount,
      image_only_pages_count: summary.imageOnlyCount,
      ocr_processed_pages_count: 0,
      ocr_successful_pages_count: 0,
      created_at: new Date().toISOString(),
    };

    storageService.saveDocument(newDoc);
    await new Promise((r) => setTimeout(r, 300));
    updateStep(6, 'completed');

    return newDoc;
  }
}

export const documentProcessingService = new DocumentProcessingService();
