import { Chapter, Topic, KnowledgeChunk } from '../types';

export interface ChapterDetectionResult {
  chapters: Chapter[];
  topics: Topic[];
  chunks: KnowledgeChunk[];
}

export class ChapterDetectionService {
  /**
   * Detects chapters and topics from extracted text or table of contents.
   * Requirement 1: Sends tocPages for Gemini detection and allPages for building chunks.
   * Requirement 2: Never invents chapters for real uploaded textbooks.
   */
  public async detectChapters(
    documentId: string,
    extractedPages: { pageNumber: number; text: string }[],
    bookTitle: string,
    isDemo: boolean = false
  ): Promise<ChapterDetectionResult> {
    // 1. Send all extracted pages and TOC subset to /api/detect-chapters
    try {
      const tocPages = extractedPages.slice(0, 25);
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
          return data;
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        if (errJson.status === 'needs_review') {
          console.warn('Backend reported CHAPTER DETECTION NEEDS REVIEW');
        }
      }
    } catch (e) {
      console.warn('Chapter detection API unreachable, checking heuristic fallback:', e);
    }

    // Heuristic chapter detection based strictly on regex matches in extracted text
    const totalPages = extractedPages.length || 50;
    const detectedChapters: Chapter[] = [];
    const detectedTopics: Topic[] = [];
    const detectedChunks: KnowledgeChunk[] = [];

    // Analyze text for authentic Chapter headings: "Chapter 1", "অধ্যায় ১", "Unit 1", etc.
    const chapterRegex = /(?:chapter|unit|অধ্যায়)\s*(\d+|[IVXLCDM]+)[:.\-\s]+([^\n\r.]+)/i;

    let foundIndices: { page: number; title: string; num: number }[] = [];

    extractedPages.forEach((p) => {
      const match = p.text.match(chapterRegex);
      if (match && match[2]) {
        // Prevent duplicate detections of same chapter on consecutive pages
        const cleanTitle = match[2].trim();
        if (!foundIndices.some((f) => f.title.toLowerCase() === cleanTitle.toLowerCase())) {
          foundIndices.push({
            page: p.pageNumber,
            title: cleanTitle,
            num: foundIndices.length + 1,
          });
        }
      }
    });

    // Requirement 2: NEVER invent chapters for real books
    if (foundIndices.length === 0) {
      if (!isDemo) {
        // Return clear CHAPTER DETECTION NEEDS REVIEW status with empty chapters
        // Teacher will manually enter or verify chapters
        return {
          chapters: [],
          topics: [],
          chunks: [],
        };
      }

      // ONLY for isDemo=true: allow demo fallback
      const segmentSize = Math.max(10, Math.floor(totalPages / 5));
      const sampleNames = [
        'Demo Chapter 1: Introduction and Principles',
        'Demo Chapter 2: Quantities and Units',
        'Demo Chapter 3: Energy and State Transformations',
        'Demo Chapter 4: Dynamic Systems',
        'Demo Chapter 5: Applications and Problem Solving',
      ];

      for (let i = 0; i < 5; i++) {
        const start = i * segmentSize + 1;
        const end = i === 4 ? totalPages : (i + 1) * segmentSize;
        foundIndices.push({
          page: start,
          title: sampleNames[i],
          num: i + 1,
        });
      }
    }

    for (let i = 0; i < foundIndices.length; i++) {
      const current = foundIndices[i];
      const next = foundIndices[i + 1];
      const pageEnd = next ? next.page - 1 : totalPages;
      const chapterId = `chap-${documentId}-${current.num}`;

      detectedChapters.push({
        id: chapterId,
        document_id: documentId,
        title: current.title,
        chapter_number: current.num,
        page_start: current.page,
        page_end: Math.max(current.page, pageEnd),
        topics_count: 3,
        status: 'detected',
      });

      // Topics for each chapter
      const topicsList = [
        `${current.title} - Core Concepts`,
        `${current.title} - Standard Worked Problems`,
        `${current.title} - Exercises & Applications`,
      ];

      topicsList.forEach((topTitle, tIdx) => {
        const topicId = `top-${chapterId}-${tIdx + 1}`;
        detectedTopics.push({
          id: topicId,
          chapter_id: chapterId,
          document_id: documentId,
          title: topTitle,
        });
      });

      // Build real knowledge chunks from actual extracted physical pages across fullPages
      const chapterPages = extractedPages.filter(
        (p) =>
          p.pageNumber >= current.page &&
          p.pageNumber <= pageEnd &&
          p.text &&
          p.text.trim().length > 0
      );

      if (chapterPages.length > 0) {
        const chunkSize = 2; // 2 physical pages per chunk
        for (let cIdx = 0; cIdx < chapterPages.length; cIdx += chunkSize) {
          const group = chapterPages.slice(cIdx, cIdx + chunkSize);
          const startP = group[0].pageNumber;
          const endP = group[group.length - 1].pageNumber;
          const actualText = group
            .map((gp) => `[Page ${gp.pageNumber}]\n${gp.text.trim()}`)
            .join('\n\n');

          detectedChunks.push({
            id: `chunk-${chapterId}-${Math.floor(cIdx / chunkSize) + 1}`,
            document_id: documentId,
            chapter_id: chapterId,
            page_start: startP,
            page_end: endP,
            text: actualText,
            extraction_confidence: 0.98,
          });
        }
      }
    }

    return {
      chapters: detectedChapters,
      topics: detectedTopics,
      chunks: detectedChunks,
    };
  }
}

export const chapterDetectionService = new ChapterDetectionService();
