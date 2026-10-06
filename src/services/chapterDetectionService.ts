import { Chapter, Topic, KnowledgeChunk, ChapterDetectionDiagnostics, DocumentItem } from '../types';
import {
  scanDocumentChapterHeadings,
  discoverTocCandidatePages,
  parseTocTitles,
  buildDeterministicChapters,
} from '../utils/chapterHeadingScanner';
import { storageService } from './storageService';
import { classifyPageCoverage, computePageCoverageSummary } from '../utils/pageClassification';
import { detectSourceLanguage } from '../utils/sourceClassification';

export interface ChapterDetectionResult {
  chapters: Chapter[];
  topics: Topic[];
  chunks: KnowledgeChunk[];
  diagnostics?: ChapterDetectionDiagnostics;
}

export class ChapterDetectionService {
  /**
   * Detects chapters and topics from extracted text or table of contents.
   * Requirement 1: Sends discovered tocPages and allPages for Gemini detection and chunk building.
   * Requirement 2: Never invents chapters for real uploaded textbooks.
   */
  public async detectChapters(
    documentId: string,
    extractedPages: { pageNumber: number; text: string }[],
    bookTitle: string,
    isDemo: boolean = false
  ): Promise<ChapterDetectionResult> {
    const totalPages = extractedPages.length || 1;

    // Requirement 5: Discover candidate TOC pages across first 40–60 pages
    const tocCandidatePages = discoverTocCandidatePages(extractedPages, 60);
    const tocPages = extractedPages.filter((p) => tocCandidatePages.includes(p.pageNumber));

    // 1. Send all extracted pages and TOC subset to /api/detect-chapters
    try {
      const response = await fetch('/api/detect-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          bookTitle,
          tocPages,
          allPages: extractedPages,
          isDemo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chapters && data.chapters.length > 0) {
          return {
            chapters: data.chapters,
            topics: data.topics || [],
            chunks: data.chunks || [],
            diagnostics: data.diagnostics,
          };
        }
        // If server returned no chapters, fall through to deterministic client-side scan
      }
    } catch (e) {
      console.warn('Chapter detection API unreachable, checking deterministic scanner fallback:', e);
    }

    // 2. Deterministic client-side scan across ALL physical pages
    const candidates = scanDocumentChapterHeadings(extractedPages, bookTitle);
    const tocTitles = parseTocTitles(tocPages, bookTitle);

    let mappingSource: ChapterDetectionDiagnostics['mappingSource'] = 'deterministic';

    if (candidates.length === 0) {
      if (!isDemo) {
        return {
          chapters: [],
          topics: [],
          chunks: [],
          diagnostics: {
            totalPagesScanned: totalPages,
            candidateHeadingsCount: 0,
            first10CandidateHeadings: [],
            tocCandidatePages,
            finalChaptersCount: 0,
            mappingSource: 'deterministic',
          },
        };
      }
    }

    const detectedChapters = buildDeterministicChapters(
      candidates,
      totalPages,
      documentId,
      tocTitles
    );

    if (candidates.some((c) => !c.nearbyTitle && !tocTitles.get(c.chapterNumber))) {
      mappingSource = 'provisional_fallback';
    }

    const detectedTopics: Topic[] = [];
    const detectedChunks: KnowledgeChunk[] = [];

    for (const chap of detectedChapters) {
      const topicsList = [
        `${chap.title} - Core Concepts`,
        `${chap.title} - Standard Worked Problems`,
        `${chap.title} - Exercises & Applications`,
      ];

      topicsList.forEach((topTitle, tIdx) => {
        const topicId = `top-${chap.id}-${tIdx + 1}`;
        detectedTopics.push({
          id: topicId,
          chapter_id: chap.id,
          document_id: documentId,
          title: topTitle,
          category: 'ai_classified_unit',
          is_authentic_heading: false,
        });
      });

      // Build real knowledge chunks from physical pages
      const chapterPages = extractedPages.filter(
        (p: any) =>
          p.pageNumber >= chap.page_start &&
          p.pageNumber <= chap.page_end &&
          ((p.finalText && p.finalText.trim().length > 0) || (p.text && p.text.trim().length > 0))
      );

      if (chapterPages.length > 0) {
        const chunkSize = 2;
        for (let cIdx = 0; cIdx < chapterPages.length; cIdx += chunkSize) {
          const group = chapterPages.slice(cIdx, cIdx + chunkSize);
          const startP = group[0].pageNumber;
          const endP = group[group.length - 1].pageNumber;
          const actualText = group
            .map((gp: any) => {
              const body = gp.finalText || gp.text || '';
              return `[Physical PDF Page ${gp.pageNumber}${gp.pageNumber >= 12 ? ` · Printed Page ${gp.pageNumber - 11}` : ''}]\n${body.trim()}`;
            })
            .join('\n\n');

          detectedChunks.push({
            id: `chunk-${chap.id}-${Math.floor(cIdx / chunkSize) + 1}`,
            document_id: documentId,
            chapter_id: chap.id,
            page_start: startP,
            page_end: endP,
            text: actualText,
            extraction_confidence: 0.98,
            source_physical_pages: group.map((gp: any) => gp.pageNumber),
            printed_pages: group
              .map((gp: any) => gp.printedPageNumber || (gp.pageNumber >= 12 ? gp.pageNumber - 11 : undefined))
              .filter(Boolean),
            extraction_method: group.some((gp: any) => gp.extractionMethod === 'vision') ? 'vision' : 'native_pdf',
          });
        }
      }
    }

    const diagnostics: ChapterDetectionDiagnostics = {
      totalPagesScanned: totalPages,
      candidateHeadingsCount: candidates.length,
      first10CandidateHeadings: candidates.slice(0, 10),
      tocCandidatePages,
      finalChaptersCount: detectedChapters.length,
      mappingSource,
    };

    return {
      chapters: detectedChapters,
      topics: detectedTopics,
      chunks: detectedChunks,
      diagnostics,
    };
  }

  /**
   * Retries chapter detection reusing cached physical PDF pages from storageService.
   * Does NOT require the PDF to be uploaded again.
   *
   * Steps:
   * 1. Re-audit page quality & page coverage
   * 2. Rerun source-language detection
   * 3. Rerun chapter detection
   * 4. Replace chapters/topics/chunks for this document
   * 5. Update diagnostics
   * 6. Keep teacher confirmation false until teacher verifies mapping
   */
  public async retryChapterDetection(
    documentId: string
  ): Promise<ChapterDetectionResult & { document: DocumentItem }> {
    const rawPages = storageService.getDocumentPages(documentId);
    if (!rawPages || rawPages.length === 0) {
      throw new Error(
        'No cached document pages found for this textbook. Please upload the PDF again.'
      );
    }

    const doc = storageService.getDocuments().find((d) => d.id === documentId);
    const bookTitle = doc?.title || 'Textbook';

    // 1. Re-audit page quality and page coverage
    const pageCoverageRecords = rawPages.map((p) => classifyPageCoverage(p.pageNumber, p.text));
    const summary = computePageCoverageSummary(pageCoverageRecords, rawPages.length);
    storageService.savePageCoverage(documentId, pageCoverageRecords);

    // 2. Rerun source-language detection using first 40–50 pages
    const detectedLanguage = detectSourceLanguage(rawPages);

    // 3. Rerun chapter detection
    const result = await this.detectChapters(
      documentId,
      rawPages,
      bookTitle,
      doc?.is_demo || false
    );

    // 4. Replace chapters/topics/chunks for this document
    storageService.replaceChaptersForDocument(documentId, result.chapters);
    storageService.replaceChunksForDocument(documentId, result.chunks);

    // Replace topics for document
    const currentTopics = storageService.getTopics().filter((t) => t.document_id !== documentId);
    currentTopics.push(...result.topics);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_qpm_topics', JSON.stringify(currentTopics));
    }

    // 5. Update diagnostics
    if (result.diagnostics) {
      storageService.saveChapterDiagnostics(documentId, result.diagnostics);
    }

    // 6. Update document (keep teacher confirmation false until verified)
    const updatedDoc: DocumentItem = {
      ...(doc || {
        id: documentId,
        user_id: 'teacher-101',
        title: bookTitle,
        file_name: bookTitle + '.pdf',
        file_size: 0,
        page_count: rawPages.length,
        created_at: new Date().toISOString(),
      }),
      language: detectedLanguage,
      status: 'needs_review',
      teacher_confirmed: false,
      detected_chapters_count: result.chapters.length,
      total_extracted_chars: summary.totalExtractedChars,
      total_words: summary.approxTotalWords,
      usable_pages_count: summary.usablePagesCount,
      attention_pages_count: summary.attentionPagesCount,
      coverage_percentage: summary.coveragePercentage,
      native_good_pages_count: summary.nativeGoodCount,
      native_garbled_pages_count: summary.nativeGarbledCount,
      native_low_text_pages_count: summary.nativeLowTextCount,
      image_only_pages_count: summary.imageOnlyCount,
      ocr_fallback_mode: summary.ocrFallbackMode,
    };

    storageService.saveDocument(updatedDoc);

    return {
      ...result,
      document: updatedDoc,
    };
  }
}

export const chapterDetectionService = new ChapterDetectionService();
