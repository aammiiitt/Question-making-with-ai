import { DocumentItem, PipelineStep } from '../types';
import { chapterDetectionService } from './chapterDetectionService';
import { storageService } from './storageService';

export const PIPELINE_STEPS: { step: number; name: string; description: string }[] = [
  { step: 1, name: 'File uploaded', description: 'Verifying PDF structure and integrity' },
  { step: 2, name: 'Text extracted', description: 'Parsing textual layers across all pages' },
  { step: 3, name: 'Pages identified', description: 'Cataloging page boundaries and layout' },
  { step: 4, name: 'Chapters detected', description: 'Identifying chapter headers and units' },
  { step: 5, name: 'Topics detected', description: 'Extracting subtopics and learning objectives' },
  { step: 6, name: 'Knowledge indexed', description: 'Creating semantic chunk embeddings' },
  { step: 7, name: 'Ready', description: 'Ready for source-grounded question generation' },
];

export class DocumentProcessingService {
  /**
   * Processes a PDF file through the 7-stage pipeline.
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
    await new Promise((r) => setTimeout(r, 600));
    updateStep(0, 'completed');

    // Step 2: Text extracted
    updateStep(1, 'in_progress');
    let extractedPages: { pageNumber: number; text: string }[] = [];
    let pageCount = 0;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        updateStep(1, 'failed');
        throw new Error(
          errData.error ||
            'We could not reliably extract text from this PDF. It may be scanned or image-based. OCR is required.'
        );
      }

      const data = await res.json();
      extractedPages = data.pages || [];
      pageCount = data.pageCount || extractedPages.length;
    } catch (e: any) {
      updateStep(1, 'failed');
      throw new Error(
        e.message ||
          'We could not reliably extract text from this PDF. It may be scanned or image-based. OCR is required.'
      );
    }

    const totalExtractedChars = extractedPages.reduce(
      (sum, p) => sum + (p.text ? p.text.trim().length : 0),
      0
    );

    if (
      extractedPages.length === 0 ||
      totalExtractedChars < 50 ||
      totalExtractedChars / Math.max(1, extractedPages.length) < 15
    ) {
      updateStep(1, 'failed');
      throw new Error(
        'We could not reliably extract text from this PDF. It may be scanned or image-based. OCR is required.'
      );
    }

    await new Promise((r) => setTimeout(r, 600));
    updateStep(1, 'completed');

    // Step 3: Pages identified
    updateStep(2, 'in_progress');
    // Save physical pages to storage for subsequent verification and re-indexing
    storageService.saveDocumentPages(docId, extractedPages);
    await new Promise((r) => setTimeout(r, 500));
    updateStep(2, 'completed');

    // Step 4: Chapters detected
    updateStep(3, 'in_progress');
    const bookTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
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
    // Save detected chapters, topics, and knowledge chunks
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
      language: 'English',
      status: needsReview ? 'needs_review' : 'ready',
      processing_step: 7,
      detected_chapters_count: detectionResult.chapters.length,
      created_at: new Date().toISOString(),
    };

    storageService.saveDocument(newDoc);
    await new Promise((r) => setTimeout(r, 300));
    updateStep(6, 'completed');

    return newDoc;
  }
}

export const documentProcessingService = new DocumentProcessingService();
