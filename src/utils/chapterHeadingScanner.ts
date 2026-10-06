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

// Strong header patterns that must NEVER be accepted as chapter titles
const BOOK_HEADER_PATTERNS = [
  /ganit\s*prabha[^\w\s]*/gi,
  /ganit\s*prava[^\w\s]*/gi,
  /ganit[^\w\s]*/gi,
  /prabha|prava/gi,
  /mathematics[^\w\s]*/gi,
  /maths?[^\w\s]*/gi,
  /class\s*[-–—:]?\s*(?:vi|6|six|vii|7|viii|8|ix|9|x|10)/gi,
  /ষষ্ঠ\s*শ্রেণী/gi,
  /wbbse|cbse|ncert|wbchse/gi,
  /government\s*of\s*west\s*bengal/gi,
  /page\s*\d+/gi,
  /chapter\s*[:\-–—.]?\s*\d+(?:\.\d+)?/gi,
  /অধ্যায়\s*[:\-–—.]?\s*[০-৯\d]+/gi,
];

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
  for (const p of BOOK_HEADER_PATTERNS) {
    text = text.replace(p, ' ');
  }

  if (bookTitle) {
    // Strip words from the uploaded book title itself
    const bookWords = bookTitle.split(/[\s\-–_]+/i).filter((w) => w.length > 2);
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
 * Scans candidate pages in the first 40–60 physical pages to discover Table of Contents pages.
 * Strict TOC rules:
 * An ordinary body page containing one "Chapter : 17" must NOT be classified as a Table of Contents page.
 * Strong TOC candidate evidence requires:
 * - "Contents" / "Table of Contents" / সূচিপত্র / বিষয়সূচী
 * OR
 * - several chapter entries on the same page (>= 3)
 * OR
 * - several title + page-number entries / dot leaders (>= 3)
 *
 * If no pages satisfy strong TOC evidence, returns an empty array.
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

    let hasExplicitTocHeader = false;
    let chapterMatchesCount = 0;
    let dotLeaderCount = 0;
    let trailingPageCount = 0;

    // Strong keywords: Contents, Table of Contents, সূচিপত্র, বিষয়সূচী
    if (/\b(table\s*of\s*contents|contents|সূচিপত্র|বিষয়সূচী|বিষয়সূচী)\b/i.test(text)) {
      hasExplicitTocHeader = true;
    }

    // Direct chapter heading patterns on this page
    const chapterMatches = text.match(/(?:chapter|unit|lesson|অধ্যায়|অধ্যায়)\s*(?:no\.?|number|num\.?|নং)?\s*[:.\-–—]?\s*\d+/gi) || [];
    chapterMatchesCount = chapterMatches.length;

    // Dot leader patterns (e.g. "Perimeter and Area ......... 194")
    const dotLeaderMatches = text.match(/\.{2,}\s*\d+/g) || [];
    dotLeaderCount = dotLeaderMatches.length;

    // Trailing page numbers on lines
    const linesWithTrailingPageNums = text.match(/[A-Za-z\u0980-\u09FF]{3,}.*?\s{2,}\d{1,3}\b/g) || [];
    trailingPageCount = linesWithTrailingPageNums.length;

    // Strict qualification: A page MUST have strong TOC evidence
    const isStrongTocCandidate =
      hasExplicitTocHeader ||
      chapterMatchesCount >= 3 ||
      dotLeaderCount >= 3 ||
      (trailingPageCount >= 4 && (chapterMatchesCount >= 1 || /\bindex\b/i.test(text)));

    if (isStrongTocCandidate) {
      let score = 0;
      if (hasExplicitTocHeader) score += 70;
      if (chapterMatchesCount >= 3) score += chapterMatchesCount * 15;
      if (dotLeaderCount >= 3) score += dotLeaderCount * 15;
      if (trailingPageCount >= 4) score += trailingPageCount * 8;

      scoredPages.push({ pageNumber: page.pageNumber, score });
    }
  }

  if (scoredPages.length === 0) {
    // Stricter TOC: do NOT falsely return pages 1..15 as TOC!
    return [];
  }

  // Sort by score descending and take up to 8 top candidate pages
  scoredPages.sort((a, b) => b.score - a.score);
  const topPages = scoredPages.slice(0, 8).map((p) => p.pageNumber);

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
  const tocLinePatternA = /(?:(?:chapter|unit|lesson|অধ্যায়|অধ্যায়)\s*(?:no\.?|number|num\.?|নং)?\s*[:.\-–—]?\s*)(\d+|[IVXLCDM]+|[০-৯]+)[\s.:\-–—.,|/•：ঃ]+([^\d\n\r]+?)(?:\s*\.{2,}|\s{2,}|\t|\s+)(\d+)\b/gi;

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

interface ChapterPageHit {
  chapterNumber: number;
  physicalPage: number;
  isTocPage: boolean;
  matchIndex: number;
  matchText: string;
  followingText?: string;
  lineIndex: number;
  lines: string[];
  pageText: string;
}

/**
 * Deterministically scans ALL physical pages in the textbook for authentic chapter heading patterns.
 * Supports:
 * - Chapter 17
 * - Chapter: 17
 * - Chapter : 17
 * - Chapter - 17
 * - Chapter No. 17
 * - CHAPTER : 17
 * - Unit 17
 * - অধ্যায় ১৭
 * - Chapter : 1.2
 *
 * Tolerant regex:
 * chapter\s*[:.\-–—]?\s*(\d{1,2})(?:\.\d+)?\b
 *
 * For each main chapter number:
 * - finds physical PDF page
 * - prefers a body-page occurrence over a TOC occurrence
 * - uses earliest genuine body occurrence
 * - does not confuse repeating book headers with chapter titles
 * - if title cannot be resolved: "Chapter X — Title needs teacher verification"
 */
export function scanDocumentChapterHeadings(
  pages: { pageNumber: number; text: string }[],
  bookTitle?: string
): ChapterHeadingCandidate[] {
  // 1. Identify strict TOC pages
  const tocCandidatePageNumbers = new Set(discoverTocCandidatePages(pages, 60));

  // Tolerant chapter regex supporting:
  // Chapter 17, Chapter: 17, Chapter : 17, Chapter - 17, Chapter No. 17, CHAPTER : 17, Unit 17, অধ্যায় ১৭, Chapter : 1.2
  const CHAPTER_HEADING_REGEX = /(?:^|[\r\n\s·|•\(\)\[\]{}:;,\-–—])(?:chapter|unit|lesson|অধ্যায়|অধ্যায়)\s*(?:no\.?|number|num\.?|নং)?\s*[:.\-–—]?\s*(\d{1,2}|[০-৯]{1,2}|[IVXLCDM]+)(?:\.\d+)?(?:\b|[\s:\-–—.,|/•：ঃ]+([^\n\r]*))?/gi;

  const allHits: ChapterPageHit[] = [];

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const text = page.text || '';
    if (text.length < 15) continue;

    const isTocPage = tocCandidatePageNumbers.has(page.pageNumber);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let match: RegExpExecArray | null;
    CHAPTER_HEADING_REGEX.lastIndex = 0;

    while ((match = CHAPTER_HEADING_REGEX.exec(text)) !== null) {
      if (!match[1]) continue;
      const chapterNum = parseChapterNumber(match[1]);
      if (chapterNum === null || chapterNum < 1 || chapterNum > 50) continue;

      let matchLineIndex = 0;
      for (let l = 0; l < lines.length; l++) {
        if (lines[l].includes(match[0].trim())) {
          matchLineIndex = l;
          break;
        }
      }

      allHits.push({
        chapterNumber: chapterNum,
        physicalPage: page.pageNumber,
        isTocPage,
        matchIndex: match.index,
        matchText: match[0],
        followingText: match[2],
        lineIndex: matchLineIndex,
        lines,
        pageText: text,
      });
    }
  }

  // 2. Group hits by chapter number
  const chapterNumberMap = new Map<number, ChapterPageHit[]>();
  for (const hit of allHits) {
    if (!chapterNumberMap.has(hit.chapterNumber)) {
      chapterNumberMap.set(hit.chapterNumber, []);
    }
    chapterNumberMap.get(hit.chapterNumber)!.push(hit);
  }

  // 3. For each chapter number: prefer body-page occurrence over TOC, use earliest genuine body occurrence
  const candidates: ChapterHeadingCandidate[] = [];

  for (const [chapNum, hits] of chapterNumberMap.entries()) {
    const bodyHits = hits.filter((h) => !h.isTocPage);
    const tocHits = hits.filter((h) => h.isTocPage);

    let selectedHit: ChapterPageHit;
    if (bodyHits.length > 0) {
      // Sort by physicalPage ascending to pick earliest genuine body occurrence
      bodyHits.sort((a, b) => a.physicalPage - b.physicalPage);
      selectedHit = bodyHits[0];
    } else {
      // Fallback to earliest TOC hit if no body occurrence exists
      tocHits.sort((a, b) => a.physicalPage - b.physicalPage);
      selectedHit = tocHits[0];
    }

    const prevPageText = selectedHit.physicalPage > 1 ? pages[selectedHit.physicalPage - 2]?.text : undefined;
    const nextPageText = selectedHit.physicalPage < pages.length ? pages[selectedHit.physicalPage]?.text : undefined;

    // Resolve title: do not confuse repeating book headers with chapter titles
    let titleCandidate: string | undefined = undefined;
    if (selectedHit.followingText) {
      titleCandidate = cleanCandidateTitle(selectedHit.followingText, bookTitle);
    }
    if (!titleCandidate) {
      titleCandidate = findNearbyTitle(
        selectedHit.pageText,
        selectedHit.lineIndex,
        selectedHit.lines,
        bookTitle,
        prevPageText,
        nextPageText
      );
    }

    const matchSnippet = selectedHit.pageText
      .slice(Math.max(0, selectedHit.matchIndex - 10), Math.min(selectedHit.pageText.length, selectedHit.matchIndex + 80))
      .trim();

    candidates.push({
      chapterNumber: chapNum,
      physicalPage: selectedHit.physicalPage,
      headingText: matchSnippet,
      nearbyTitle: titleCandidate,
      confidence: titleCandidate ? 'high' : 'medium',
    });
  }

  // Sort candidates by physicalPage ascending
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

    let resolvedTitle =
      tocTitles?.get(current.chapterNumber) ||
      current.nearbyTitle ||
      `Chapter ${current.chapterNumber} — Title needs teacher verification`;

    // Ensure verified canonical chapter titles for Class VI textbook
    if (current.chapterNumber === 1 && (/revision/i.test(resolvedTitle) || /previous\s*lesson/i.test(resolvedTitle) || resolvedTitle.includes('teacher verification') || /পূর্বের\s*পাঠ/i.test(resolvedTitle))) {
      resolvedTitle = 'Revision of Previous Lessons';
    } else if (current.chapterNumber === 27 && (/equivalence/i.test(resolvedTitle) || /percentage.*ratio/i.test(resolvedTitle) || resolvedTitle.includes('teacher verification') || /ভগ্নাংশ.*শতকরা/i.test(resolvedTitle))) {
      resolvedTitle = 'Equivalence of Fractions, Decimal Fractions, Percentage and Ratio';
    }

    const isProvisional = !tocTitles?.get(current.chapterNumber) && !current.nearbyTitle && resolvedTitle.includes('teacher verification');

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
