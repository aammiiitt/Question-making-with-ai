import { PageCoverageRecord, TextQualityStatus } from '../types';
import { evaluateTextQuality } from './textQuality';

/**
 * Canonical classification for physical PDF page coverage with Hybrid OCR support.
 *
 * READ (Usable Text):
 *   native_good (characterCount >= 150 AND wordCount >= 20 without garbled encoding)
 *   OR successful OCR transcribed text
 *
 * LOW_TEXT / ATTENTION:
 *   native_low_text, native_garbled, empty, image_only, or ocr_failed
 *
 * Guarantee: Mutually exclusive groups.
 * Successfully Read + Needs Attention = Total Physical PDF Pages
 * Coverage Percentage = (Successfully Read / Total Physical PDF Pages) * 100
 */
export function classifyPageCoverage(
  pageNumber: number,
  rawText?: string | null,
  isFailed?: boolean,
  ocrResult?: {
    text: string;
    status: 'ocr_success' | 'ocr_failed';
    errorReason?: string;
  }
): PageCoverageRecord {
  if (isFailed) {
    return {
      pageNumber,
      characterCount: 0,
      wordCount: 0,
      hasUsableText: false,
      extractionStatus: 'failed',
      flagReason: 'Page extraction failed during PDF parsing or file was unreadable.',
      nativeText: '',
      nativeCharacterCount: 0,
      nativeWordCount: 0,
      textQualityScore: 0,
      textQualityStatus: 'image_only',
      requiresOcr: true,
      finalText: '',
      extractionMethod: 'native',
      ocrStatus: 'none',
    };
  }

  const cleanNative = rawText ? rawText.trim() : '';
  const nativeCharCount = cleanNative.length;
  const nativeWords = cleanNative ? cleanNative.split(/\s+/).filter(Boolean) : [];
  const nativeWordCount = nativeWords.length;

  const quality = evaluateTextQuality(cleanNative);

  // If OCR result is provided, merge it authoritatively (Requirement 7)
  if (ocrResult) {
    if (ocrResult.status === 'ocr_success' && ocrResult.text.trim().length > 0) {
      const cleanOcr = ocrResult.text.trim();
      const ocrChars = cleanOcr.length;
      const ocrWords = cleanOcr.split(/\s+/).filter(Boolean).length;
      const hasUsable = ocrChars >= 40 || ocrWords >= 10;

      return {
        pageNumber,
        characterCount: ocrChars,
        wordCount: ocrWords,
        hasUsableText: hasUsable,
        extractionStatus: hasUsable ? 'read' : 'low_text',
        flagReason: hasUsable ? undefined : 'OCR extracted short formula/diagram content.',
        nativeText: cleanNative,
        nativeCharacterCount: nativeCharCount,
        nativeWordCount: nativeWordCount,
        textQualityScore: Math.min(100, Math.max(80, Math.round((ocrChars / 150) * 100))),
        textQualityStatus: 'ocr_success',
        requiresOcr: false,
        finalText: cleanOcr,
        extractionMethod: 'ocr',
        ocrStatus: 'success',
      };
    } else {
      return {
        pageNumber,
        characterCount: nativeCharCount,
        wordCount: nativeWordCount,
        hasUsableText: false,
        extractionStatus: 'failed',
        flagReason: ocrResult.errorReason || 'OCR transcription failed for this physical page.',
        nativeText: cleanNative,
        nativeCharacterCount: nativeCharCount,
        nativeWordCount: nativeWordCount,
        textQualityScore: quality.score,
        textQualityStatus: 'ocr_failed',
        requiresOcr: true,
        finalText: quality.status === 'native_garbled' ? '' : cleanNative,
        extractionMethod: 'ocr',
        ocrStatus: 'failed',
        ocrErrorReason: ocrResult.errorReason,
      };
    }
  }

  // Native classification based on text quality analysis
  let extractionStatus: 'read' | 'low_text' | 'empty' | 'failed';
  let hasUsableText = false;

  if (quality.status === 'image_only') {
    extractionStatus = 'empty';
    hasUsableText = false;
  } else if (quality.status === 'native_garbled') {
    // Corrupted legacy encoding must NEVER be counted as successfully read!
    extractionStatus = 'low_text';
    hasUsableText = false;
  } else if (quality.status === 'native_good') {
    extractionStatus = 'read';
    hasUsableText = true;
  } else {
    // native_low_text
    extractionStatus = 'low_text';
    hasUsableText = false;
  }

  return {
    pageNumber,
    characterCount: nativeCharCount,
    wordCount: nativeWordCount,
    hasUsableText,
    extractionStatus,
    flagReason: quality.flagReason,
    nativeText: cleanNative,
    nativeCharacterCount: nativeCharCount,
    nativeWordCount: nativeWordCount,
    textQualityScore: quality.score,
    textQualityStatus: quality.status,
    requiresOcr: quality.requiresOcr,
    finalText: quality.status === 'native_garbled' ? '' : cleanNative,
    extractionMethod: 'native',
    ocrStatus: 'none',
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
  nativeGoodCount: number;
  nativeGarbledCount: number;
  nativeLowTextCount: number;
  imageOnlyCount: number;
  ocrProcessedCount: number;
  ocrSuccessfulCount: number;
  ocrFallbackMode: boolean;
} {
  const totalPhysicalPages = records.length > 0 ? records.length : (fallbackTotalPages || 1);
  const usablePagesCount = records.filter((r) => r.hasUsableText).length;
  const attentionPagesCount = records.filter((r) => !r.hasUsableText).length;
  const totalExtractedChars = records.reduce((sum, r) => sum + r.characterCount, 0);
  const approxTotalWords = records.reduce((sum, r) => sum + r.wordCount, 0);
  const coveragePercentage = totalPhysicalPages > 0
    ? Number(((usablePagesCount / totalPhysicalPages) * 100).toFixed(1))
    : 100;

  const nativeGoodCount = records.filter((r) => r.textQualityStatus === 'native_good').length;
  const nativeGarbledCount = records.filter((r) => r.textQualityStatus === 'native_garbled').length;
  const nativeLowTextCount = records.filter((r) => r.textQualityStatus === 'native_low_text').length;
  const imageOnlyCount = records.filter((r) => r.textQualityStatus === 'image_only').length;
  const ocrProcessedCount = records.filter((r) => r.extractionMethod === 'ocr' || r.ocrStatus === 'success' || r.ocrStatus === 'failed').length;
  const ocrSuccessfulCount = records.filter((r) => r.ocrStatus === 'success').length;

  // OCR Fallback mode triggers if garbled + image_only pages form > 30% of total pages or if more than 10 pages are garbled
  const ocrFallbackMode =
    (nativeGarbledCount + imageOnlyCount) > (totalPhysicalPages * 0.3) ||
    nativeGarbledCount >= 10;

  return {
    totalPhysicalPages,
    usablePagesCount,
    attentionPagesCount,
    coveragePercentage,
    totalExtractedChars,
    approxTotalWords,
    nativeGoodCount,
    nativeGarbledCount,
    nativeLowTextCount,
    imageOnlyCount,
    ocrProcessedCount,
    ocrSuccessfulCount,
    ocrFallbackMode,
  };
}
