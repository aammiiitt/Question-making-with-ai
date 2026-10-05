import { Chapter, Topic, KnowledgeChunk, ChapterDetectionDiagnostics } from '../types';
import {
  scanDocumentChapterHeadings,
  discoverTocCandidatePages,
  parseTocTitles,
  buildDeterministicChapters,
} from '../utils/chapterHeadingScanner';

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
        });
      });

      // Build real knowledge chunks from physical pages
      const chapterPages = extractedPages.filter(
        (p) =>
          p.pageNumber >= chap.page_start &&
          p.pageNumber <= chap.page_end &&
          p.text &&
          p.text.trim().length > 0
      );

      if (chapterPages.length > 0) {
        const chunkSize = 2;
        for (let cIdx = 0; cIdx < chapterPages.length; cIdx += chunkSize) {
          const group = chapterPages.slice(cIdx, cIdx + chunkSize);
          const startP = group[0].pageNumber;
          const endP = group[group.length - 1].pageNumber;
          const actualText = group
            .map((gp) => `[Page ${gp.pageNumber}]\n${gp.text.trim()}`)
            .join('\n\n');

          detectedChunks.push({
            id: `chunk-${chap.id}-${Math.floor(cIdx / chunkSize) + 1}`,
            document_id: documentId,
            chapter_id: chap.id,
            page_start: startP,
            page_end: endP,
            text: actualText,
            extraction_confidence: 0.98,
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
}

export const chapterDetectionService = new ChapterDetectionService();
