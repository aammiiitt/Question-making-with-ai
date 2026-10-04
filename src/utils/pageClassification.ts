import { PageCoverageRecord } from '../types';

/**
 * Canonical classification for physical PDF page coverage.
 *
 * READ:
 *   characterCount >= 150 AND wordCount >= 20
 *
 * LOW_TEXT:
 *   characterCount >= 20 but does not satisfy READ
 *
 * EMPTY:
 *   characterCount < 20
 *
 * FAILED:
 *   only when actual extraction failure is known.
 *
 * hasUsableText = extractionStatus === "read"
 * Pages Successfully Read = count(extractionStatus === "read")
 * Pages Needing Attention = count(low_text + empty + failed)
 *
 * Guarantee: Mutually exclusive groups.
 * Successfully Read + Needs Attention = Total Physical PDF Pages
 * Coverage Percentage = (Successfully Read / Total Physical PDF Pages) * 100
 */
export function classifyPageCoverage(
  pageNumber: number,
  rawText?: string | null,
  isFailed?: boolean
): PageCoverageRecord {
  if (isFailed) {
    return {
      pageNumber,
      characterCount: 0,
      wordCount: 0,
      hasUsableText: false,
      extractionStatus: 'failed',
      flagReason: 'Page extraction failed during PDF parsing or file was unreadable.',
    };
  }

  const cleanText = rawText ? rawText.trim() : '';
  const characterCount = cleanText.length;
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  let extractionStatus: 'read' | 'low_text' | 'empty' | 'failed';
  let flagReason: string | undefined = undefined;

  if (characterCount < 20) {
    extractionStatus = 'empty';
    flagReason = 'No extractable text detected — page may contain scanned text, illustrations, blank page, or full-page geometry diagram.';
  } else if (characterCount >= 150 && wordCount >= 20) {
    extractionStatus = 'read';
  } else {
    extractionStatus = 'low_text';
    flagReason = 'Low text detected — page may contain mathematical diagrams, formulas, tables, or section headers only.';
  }

  const hasUsableText = extractionStatus === 'read';

  return {
    pageNumber,
    characterCount,
    wordCount,
    hasUsableText,
    extractionStatus,
    flagReason,
  };
}

/**
 * Computes canonical aggregate summary numbers from page coverage records
 */
export function computePageCoverageSummary(
  records: PageCoverageRecord[],
  fallbackTotalPages?: number
): {
  totalPhysicalPages: number;
  usablePagesCount: number;
  attentionPagesCount: number;
  coveragePercentage: number;
  totalExtractedChars: number;
  approxTotalWords: number;
} {
  const totalPhysicalPages = records.length > 0 ? records.length : (fallbackTotalPages || 1);
  const usablePagesCount = records.filter((r) => r.extractionStatus === 'read').length;
  const attentionPagesCount = records.filter((r) => r.extractionStatus !== 'read').length;
  const totalExtractedChars = records.reduce((sum, r) => sum + r.characterCount, 0);
  const approxTotalWords = records.reduce((sum, r) => sum + r.wordCount, 0);
  const coveragePercentage = totalPhysicalPages > 0
    ? Number(((usablePagesCount / totalPhysicalPages) * 100).toFixed(1))
    : 100;

  return {
    totalPhysicalPages,
    usablePagesCount,
    attentionPagesCount,
    coveragePercentage,
    totalExtractedChars,
    approxTotalWords,
  };
}
