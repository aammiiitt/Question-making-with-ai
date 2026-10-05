import { ChapterHeadingCandidate, Chapter, ChapterDetectionDiagnostics } from '../types';

/**
 * Converts Bengali digits, Roman numerals, or standard digits into a number
 */
export function parseChapterNumber(raw: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // 1. Standard digits
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    return isNaN(num) ? null : num;
  }

  // 2. Bengali numerals (০-৯)
  if (/^[০-৯]+$/.test(trimmed)) {
    const bnToEnMap: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    const converted = trimmed.replace(/[০-৯]/g, (d) => bnToEnMap[d] || d);
    const num = parseInt(converted, 10);
    return isNaN(num) ? null : num;
  }

  // 3. Roman numerals (I, II, III, IV, V, VI, etc.)
  if (/^[ivxlcdm]+$/i.test(trimmed)) {
    const romanMap: Record<string, number> = {
      i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000,
    };
    const str = trimmed.toLowerCase();
    let result = 0;
    for (let i = 0; i < str.length; i++) {
      const current = romanMap[str[i]] || 0;
      const next = romanMap[str[i + 1]] || 0;
      if (current < next) {
        result -= current;
      } else {
        result += current;
      }
    }
    return result > 0 ? result : null;
  }

  return null;
}

/**
 * Normalizes text and strips textbook headers/footers to avoid false chapter titles
 * (e.g. "Ganit Prava – Class VI" must NEVER be accepted as a chapter title!)
 */
export function cleanCandidateTitle(rawText: string, bookTitle?: string): string | undefined {
  if (!rawText) return undefined;

  let text = rawText
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip running book headers and common grade indicators
  const bookHeaderPatterns = [
    /ganit\s*prava[^\w\s]*/gi,
    /ganit\s*prabha[^\w\s]*/gi,
    /mathematics[^\w\s]*/gi,
    /class\s*[-–—:]?\s*(?:vi|6|six|vii|7|viii|8|ix|9|x|10)/gi,
    /ষষ্ঠ\s*শ্রেণী/gi,
    /wbbse|cbse|ncert|wbchse/gi,
    /government\s*of\s*west\s*bengal/gi,
    /page\s*\d+/gi,
    /chapter\s*[:\-–—.]?\s*\d+/gi,
  ];

  for (const p of bookHeaderPatterns) {
    text = text.replace(p, ' ');
  }

  if (bookTitle) {
    // Strip words from the uploaded book title itself
    const bookWords = bookTitle.split(/[\s\-–_]+/i).filter((w) => w.length > 3);
    for (const bw of bookWords) {
      const bwRegex = new RegExp(`\\b${bw}\\b`, 'gi');
      text = text.replace(bwRegex, ' ');
    }
  }

  // Clean leading/trailing punctuation and symbols
  text = text.replace(/^[\s:\-–—.,|/•：ঃ\(\)\[\]{}#]+|[\s:\-–—.,|/•：ঃ\(\)\[\]{}#]+$/g, '').trim();

  // If text contains introductory text after the title, cut at standard punctuation or clause boundary
  const clauseCut = text.split(/\s*(?:let\s*us|exercise|in\s*this|we\s*shall|নিজে\s*করি|কষে\s*দেখি|[.?!;])\b/i)[0];
  if (clauseCut && clauseCut.trim().length >= 3) {
    text = clauseCut.replace(/^[\s:\-–—.,|/•：ঃ]+|[\s:\-–—.,|/•：ঃ]+$/g, '').trim();
  }

  // Check if string contains meaningful title characters
  if (text.length < 3 || text.length > 80) return undefined;
  if (/^\d+$/.test(text)) return undefined; // only numbers
  if (/^(exercise|let's\s*work\s*out|নিজে\s*করি|কষে\s*দেখি)/i.test(text)) return undefined;

  return text;
}

/**
 * Searches around the chapter match position on a page for a clean title candidate.
 * Checks adjacent lines, previous page lines, and next page lines.
 */
export function findNearbyTitle(
  pageText: string,
  matchLineIndex: number,
  lines: string[],
  bookTitle?: string,
  precedingPageText?: string,
  followingPageText?: string
): string | undefined {
  // 1. Check lines immediately following or preceding the matched chapter heading on the same page
  const offsets = [1, 2, -1, 3, -2, 4];
  for (const offset of offsets) {
    const idx = matchLineIndex + offset;
    if (idx >= 0 && idx < lines.length) {
      const candidate = cleanCandidateTitle(lines[idx], bookTitle);
      if (candidate) {
        return candidate;
      }
    }
  }

  // 2. If pageText was un-split or single line, search within sentences on the page
  const sentences = pageText.split(/(?:[.\n\r]+|\s{3,})/).map((s) => s.trim()).filter(Boolean);
  for (let sIdx = 0; sIdx < Math.min(sentences.length, 6); sIdx++) {
    const candidate = cleanCandidateTitle(sentences[sIdx], bookTitle);
    if (candidate) {
      return candidate;
    }
  }

  // 3. Check following page top lines
  if (followingPageText) {
    const nextLines = followingPageText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < Math.min(nextLines.length, 3); i++) {
      const candidate = cleanCandidateTitle(nextLines[i], bookTitle);
      if (candidate) return candidate;
    }
  }

  // 4. Check preceding page bottom lines
  if (precedingPageText) {
    const prevLines = precedingPageText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (let i = Math.max(0, prevLines.length - 3); i < prevLines.length; i++) {
      const candidate = cleanCandidateTitle(prevLines[i], bookTitle);
      if (candidate) return candidate;
    }
  }

  return undefined;
}

/**
 * Scans candidate pages in the first 40–60 physical pages to discover Table of Contents pages
 * Requirement 5: Scans approximately first 40-60 physical pages deterministically for TOC / chapter-list pages
 * using indicators such as Contents, Table of Contents, Chapter, Chapter :, Index, সূচিপত্র, অধ্যায়,
 * and multiple chapter-number patterns on a page.
 */
export function discoverTocCandidatePages(
  pages: { pageNumber: number; text: string }[],
  maxPagesToScan: number = 60
): number[] {
  const scoredPages: { pageNumber: number; score: number }[] = [];

  const scanLimit = Math.min(maxPagesToScan, pages.length);
  for (let i = 0; i < scanLimit; i++) {
    const page = pages[i];
    const text = page.text || '';
    if (text.trim().length < 20) continue;

    let score = 0;

    // Strong keywords: Contents, Table of Contents, Index, সূচিপত্র, বিষয়সূচী
    if (/\b(table\s*of\s*contents|contents|সূচিপত্র|বিষয়সূচী|বিষয়সূচী)\b/i.test(text)) {
      score += 70;
    } else if (/\bindex\b/i.test(text)) {
      score += 30;
    }

    // Direct chapter heading patterns: Chapter 17, Chapter : 17, অধ্যায় ১৭
    const chapterMatches = text.match(/(?:chapter|unit|lesson|অধ্যায়|অধ্যায়)\s*(?:no\.?|number|num\.?|নং)?\s*[:\-–—.,|/•：ঃ]?\s*\d+/gi) || [];
    // If a single page has multiple chapters (e.g. 3 or more), it is almost certainly a TOC or syllabus page!
    if (chapterMatches.length >= 3) {
      score += chapterMatches.length * 15;
    } else if (chapterMatches.length > 0) {
      score += chapterMatches.length * 5;
    }

    // Dot leader patterns (e.g. "Perimeter and Area ......... 194")
    const dotLeaderMatches = text.match(/\.{2,}\s*\d+/g) || [];
    score += dotLeaderMatches.length * 15;

    // Lines ending with trailing page numbers (common in TOCs without dot leaders)
    const linesWithTrailingPageNums = text.match(/[A-Za-z\u0980-\u09FF]{3,}.*?\s{2,}\d{1,3}\b/g) || [];
    score += linesWithTrailingPageNums.length * 8;

    // Numbered topic list patterns (e.g. "1. Integers ... 2. Fractions ...")
    const numberedListMatches = text.match(/(?:^|\s)\d{1,2}\.\s+[A-Za-z\u0980-\u09FF]{3,}/g) || [];
    score += numberedListMatches.length * 6;

    if (score >= 20) {
      scoredPages.push({ pageNumber: page.pageNumber, score });
    }
  }

  if (scoredPages.length === 0) {
    // Fallback: take pages 1 to min(15, pages.length)
    return Array.from({ length: Math.min(15, pages.length) }, (_, i) => i + 1);
  }

  // Sort by score descending and take up to 8 top candidate pages
  scoredPages.sort((a, b) => b.score - a.score);
  const topPages = scoredPages.slice(0, 8).map((p) => p.pageNumber);

  // Return in sequential reading order
  return Array.from(new Set(topPages)).sort((a, b) => a - b);
}

/**
 * Extracts candidate chapter titles and page numbers from Table of Contents text directly.
 */
export function parseTocTitles(
  tocPages: { pageNumber: number; text: string }[],
  bookTitle?: string
): Map<number, string> {
  const titles = new Map<number, string>();

  // Pattern A: "Chapter : 17 Perimeter and Area ...... 194" or "Chapter 17 Perimeter and Area 194"
  const tocLinePatternA = /(?:(?:chapter|unit|lesson|অধ্যায়|অধ্যায়)\s*(?:no\.?|number|num\.?|নং)?\s*[:\-–—.,|/•：ঃ]?\s*)(\d+|[IVXLCDM]+|[০-৯]+)[\s.:\-–—.,|/•：ঃ]+([^\d\n\r]+?)(?:\s*\.{2,}|\s{2,}|\t|\s+)(\d+)\b/gi;

  // Pattern B: "17. Perimeter and Area ...... 194"
  const tocLinePatternB = /(?:^|[\r\n\s])(\d+|[IVXLCDM]+|[০-৯]+)\s*[\.\-–—]\s*([^\d\n\r]+?)(?:\s*\.{2,}|\s{2,}|\t|\s+)(\d+)\b/gi;

  for (const p of tocPages) {
    const text = p.text || '';
    let match: RegExpExecArray | null;

    while ((match = tocLinePatternA.exec(text)) !== null) {
      const num = parseChapterNumber(match[1]);
      const rawTitle = match[2];
      if (num !== null && num >= 1 && num <= 50 && rawTitle) {
        const clean = cleanCandidateTitle(rawTitle, bookTitle);
        if (clean && !titles.has(num)) {
          titles.set(num, clean);
        }
      }
    }

    while ((match = tocLinePatternB.exec(text)) !== null) {
      const num = parseChapterNumber(match[1]);
      const rawTitle = match[2];
      if (num !== null && num >= 1 && num <= 50 && rawTitle) {
        const clean = cleanCandidateTitle(rawTitle, bookTitle);
        if (clean && !titles.has(num)) {
          titles.set(num, clean);
        }
      }
    }
  }

  return titles;
}

/**
 * Deterministically scans ALL physical pages in the textbook for authentic chapter heading patterns.
 * Supports:
 * - Chapter 17
 * - Chapter: 17
 * - Chapter : 17
 * - Chapter - 17
 * - Chapter – 17
 * - Chapter — 17
 * - Chapter No. 17
 * - Chapter No: 17
 * - Chapter No.- 17
 * - Chapter No : 17
 * - Chapter Number 17
 * - CHAPTER 17
 * - CHAPTER : 17
 * - CHAPTER: 17
 * - CHAPTER - 17
 * - Unit 17
 * - Unit : 17
 * - UNIT 17
 * - অধ্যায় ১৭
 * - অধ্যায় : ১৭
 * - অধ্যায়-১৭
 *
 * And handles headers like:
 * "Chapter : 17 Ganit Prava – Class VI"
 * "194 Chapter : 17 Ganit Prava – Class VI"
 */
export function scanDocumentChapterHeadings(
  pages: { pageNumber: number; text: string }[],
  bookTitle?: string
): ChapterHeadingCandidate[] {
  const candidates: ChapterHeadingCandidate[] = [];
  const seenChapterNumbers = new Set<number>();

  // Identify TOC candidate pages so we don't accidentally treat a TOC listing as the body start
  const tocCandidatePageNumbers = new Set(discoverTocCandidatePages(pages, 60));

  // Regex matching any of the supported chapter heading patterns
  // Uses global search to find multiple chapters on a page if present
  const CHAPTER_HEADING_REGEX = /(?:^|[\r\n\s·|•\(\)\[\]{}:;,\-–—])(?:chapter|unit|lesson|অধ্যায়|অধ্যায়)\s*(?:no\.?|number|num\.?|নং)?\s*[:\-–—.,|/•：ঃ]?\s*(\d+|[IVXLCDM]+|[০-৯]+)(?:[\s:\-–—.,|/•：ঃ]+([^\n\r]*))?/gi;

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const text = page.text || '';
    if (text.length < 15) continue;

    // Is this page a TOC page?
    const isTocPage = tocCandidatePageNumbers.has(page.pageNumber);

    const prevPageText = pIdx > 0 ? pages[pIdx - 1]?.text : undefined;
    const nextPageText = pIdx < pages.length - 1 ? pages[pIdx + 1]?.text : undefined;

    // Split lines if available, otherwise analyze sentences
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let match: RegExpExecArray | null;
    CHAPTER_HEADING_REGEX.lastIndex = 0;

    while ((match = CHAPTER_HEADING_REGEX.exec(text)) !== null) {
      if (!match[1]) continue;
      const chapterNum = parseChapterNumber(match[1]);
      if (chapterNum === null || chapterNum < 1 || chapterNum > 50) continue;

      // If already recorded for this chapter number, skip later occurrences
      // (running headers repeat on every subsequent page of the chapter)
      if (seenChapterNumbers.has(chapterNum)) continue;

      // If this match is on a recognized TOC page, do NOT treat it as the physical body start
      // unless we find no body occurrence later.
      if (isTocPage && page.pageNumber <= 40) {
        // Skip treating early TOC pages as chapter body start
        continue;
      }

      seenChapterNumbers.add(chapterNum);

      // Find the line index where this match occurred
      let matchLineIndex = 0;
      for (let l = 0; l < lines.length; l++) {
        if (lines[l].includes(match[0].trim())) {
          matchLineIndex = l;
          break;
        }
      }

      // Resolve authentic nearby title candidate
      let titleCandidate: string | undefined = undefined;
      if (match[2]) {
        titleCandidate = cleanCandidateTitle(match[2], bookTitle);
      }
      if (!titleCandidate) {
        titleCandidate = findNearbyTitle(
          text,
          matchLineIndex,
          lines,
          bookTitle,
          prevPageText,
          nextPageText
        );
      }

      const matchSnippet = text.slice(Math.max(0, match.index - 10), Math.min(text.length, match.index + 80)).trim();

      candidates.push({
        chapterNumber: chapterNum,
        physicalPage: page.pageNumber,
        headingText: matchSnippet,
        nearbyTitle: titleCandidate,
        confidence: titleCandidate ? 'high' : 'medium',
      });
    }
  }

  // Sort candidates primarily by physicalPage, then chapterNumber
  candidates.sort((a, b) => a.physicalPage - b.physicalPage);
  return candidates;
}

/**
 * Constructs authentic chapters from deterministic evidence.
 * If titles cannot be resolved, assigns provisional entries:
 * "Chapter 17 — Title needs teacher verification" (Requirement 9)
 */
export function buildDeterministicChapters(
  candidates: ChapterHeadingCandidate[],
  totalPages: number,
  documentId: string,
  tocTitles?: Map<number, string>
): Chapter[] {
  if (candidates.length === 0) return [];

  const chapters: Chapter[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const current = candidates[i];
    const next = candidates[i + 1];

    const pageStart = current.physicalPage;
    const pageEnd = next ? Math.max(pageStart, next.physicalPage - 1) : totalPages;

    const resolvedTitle =
      tocTitles?.get(current.chapterNumber) ||
      current.nearbyTitle ||
      `Chapter ${current.chapterNumber} — Title needs teacher verification`;

    const isProvisional = !tocTitles?.get(current.chapterNumber) && !current.nearbyTitle;

    chapters.push({
      id: `chap-${documentId}-${current.chapterNumber}`,
      document_id: documentId,
      title: resolvedTitle,
      chapter_number: current.chapterNumber,
      page_start: pageStart,
      page_end: pageEnd,
      topics_count: 3,
      status: isProvisional ? 'needs_review' : 'detected',
    });
  }

  return chapters;
}
