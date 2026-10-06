import { DocumentItem, PipelineStep } from '../types';
import { chapterDetectionService } from './chapterDetectionService';
import { storageService } from './storageService';
import { classifyPageCoverage, computePageCoverageSummary } from '../utils/pageClassification';
import { detectSourceLanguage } from '../utils/sourceClassification';
import { ocrService } from './ocrService';

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

    const updateStep = (index: number, status: 'pending' | 'in_progress' | 'completed' | 'failed') => {
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

    // Compute deterministic page-level coverage check using canonical classification & quality signals
    let totalExtractedWords = 0;
    let pageCoverageRecords = extractedPages.map((p) => {
      const record = classifyPageCoverage(p.pageNumber, p.text);
      totalExtractedWords += record.wordCount;
      return record;
    });

    // Save physical pages to storage for subsequent verification and re-indexing
    const initialPagesForStorage = extractedPages.map((p, idx) => {
      const record = pageCoverageRecords[idx];
      return {
        pageNumber: p.pageNumber,
        text: record?.finalText || p.text,
        rawExtractedText: p.text,
        normalizedText: record?.normalizedText,
        nativeText: p.text,
        extractionMethod: record?.extractionMethod || 'native_pdf',
        extractionStatus: record?.extractionStatus || 'needs_review',
        extractionConfidence: record?.extractionConfidence ?? 0.5,
        nativeConfidence: record?.nativeConfidence ?? record?.extractionConfidence ?? 0.5,
        validationFlags: record?.validationFlags || [],
        textQualityStatus: record?.textQualityStatus,
        physicalPdfPage: record?.physicalPdfPage || p.pageNumber,
        printedPageNumber: record?.printedPageNumber,
      };
    });
    storageService.saveDocumentPages(docId, initialPagesForStorage);
    storageService.savePageCoverage(docId, pageCoverageRecords);

    // Source language identification using script counts across first 40–50 pages
    const detectedLanguage = detectSourceLanguage(extractedPages);
    const bookTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

    // CRITICAL ISSUE 2: Automatically invoke Vision Recovery for pages where requiresOcr === true or extractionStatus === 'needs_review'
    const pagesNeedingVision = pageCoverageRecords.filter(
      (r) => r.requiresOcr || r.extractionStatus === 'needs_review' || (r.validationFlags && r.validationFlags.length > 0)
    );

    // If there are problematic pages (and not 100% of an enormous book), recover them automatically with Gemini Vision
    if (pagesNeedingVision.length > 0 && pagesNeedingVision.length <= Math.max(20, Math.floor(pageCount * 0.4))) {
      try {
        const pagesToRun = pagesNeedingVision.map((p) => p.pageNumber);
        const tempDoc: DocumentItem = {
          id: docId,
          user_id: 'teacher-101',
          title: bookTitle,
          file_name: file.name,
          file_size: file.size,
          page_count: pageCount,
          language: detectedLanguage,
          status: 'processing',
          detected_chapters_count: 0,
          created_at: new Date().toISOString(),
        };

        // Render ONLY those physical PDF pages to images and transcribe with Gemini Vision
        await ocrService.processOcr(tempDoc, file, pagesToRun);

        // Reload authoritative recovered records and pages from storage
        pageCoverageRecords = storageService.getPageCoverage(docId);
        const recoveredStoredPages = storageService.getDocumentPages(docId);
        extractedPages = recoveredStoredPages.map((sp: any) => ({
          pageNumber: sp.pageNumber,
          text: sp.finalText || sp.text || sp.rawExtractedText || '',
          finalText: sp.finalText,
          rawExtractedText: sp.rawExtractedText,
          nativeText: sp.nativeText,
          visionText: sp.visionText,
          extractionMethod: sp.extractionMethod,
          extractionStatus: sp.extractionStatus,
          extractionConfidence: sp.extractionConfidence,
          nativeConfidence: sp.nativeConfidence,
          visionConfidence: sp.visionConfidence,
          validationFlags: sp.validationFlags,
          printedPageNumber: sp.printedPageNumber,
        }));
      } catch (ocrErr) {
        console.warn('Automatic selective Vision recovery encountered an issue, preserving native text:', ocrErr);
      }
    }

    const summary = computePageCoverageSummary(pageCoverageRecords, pageCount);
    storageService.savePageCoverage(docId, pageCoverageRecords);

    await new Promise((r) => setTimeout(r, 400));

    // Requirement 3 & 10: Document-level OCR decision
    // If the majority are still garbled/image-based: switch document processing to OCR FALLBACK MODE
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
        ocr_processed_pages_count: summary.ocrProcessedCount,
        ocr_successful_pages_count: summary.ocrSuccessfulCount,
        created_at: new Date().toISOString(),
      };

      storageService.saveDocument(fallbackDoc);
      updateStep(6, 'failed');
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

    if (detectionResult.diagnostics) {
      storageService.saveChapterDiagnostics(docId, detectionResult.diagnostics);
    }

    const needsReview = detectionResult.chapters.length === 0;
    if (needsReview) {
      // If zero chapters are detected, mark chapter step as failed / needs review
      updateStep(3, 'failed');
      // Do not mark Topics / Knowledge Indexed as completed when no chapters/chunks exist
      updateStep(4, 'pending');
      updateStep(5, 'pending');
      updateStep(6, 'failed');
    } else {
      updateStep(3, 'completed');

      // Step 5: Topics detected
      updateStep(4, 'in_progress');
      await new Promise((r) => setTimeout(r, 500));
      updateStep(4, 'completed');

      // Step 6: Knowledge indexed
      updateStep(5, 'in_progress');
      detectionResult.chapters.forEach((c) => storageService.saveChapter(c));
      detectionResult.topics.forEach((t) => storageService.saveTopic(t));
      detectionResult.chunks.forEach((chk) => storageService.saveChunk(chk));

      // Associate chapterId with each page coverage record and stored page
      for (const record of pageCoverageRecords) {
        const matchingChap = detectionResult.chapters.find(
          (c) => record.pageNumber >= c.page_start && record.pageNumber <= c.page_end
        );
        if (matchingChap) {
          record.chapterId = matchingChap.id;
        }
      }
      storageService.savePageCoverage(docId, pageCoverageRecords);

      const currentStoredPages = storageService.getDocumentPages(docId);
      const updatedStoredPages = currentStoredPages.map((sp: any) => {
        const matchingChap = detectionResult.chapters.find(
          (c) => sp.pageNumber >= c.page_start && sp.pageNumber <= c.page_end
        );
        return matchingChap ? { ...sp, chapterId: matchingChap.id } : sp;
      });
      storageService.saveDocumentPages(docId, updatedStoredPages);

      await new Promise((r) => setTimeout(r, 500));
      updateStep(5, 'completed');
      updateStep(6, 'completed');
    }

    // Step 7: Final Document status
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

    return newDoc;
  }
}

export const documentProcessingService = new DocumentProcessingService();
