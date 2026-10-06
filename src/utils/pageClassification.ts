import { PageCoverageRecord, TextQualityStatus, ExtractionMethod, ExtractionStatus } from '../types';
import { validatePageTextQuality, evaluateTextQuality } from './textQuality';

/**
 * Canonical classification for physical PDF page coverage with Safe Hybrid OCR pipeline support.
 *
 * READ / VERIFIED (Usable Text):
 *   native_pdf verified (characterCount >= 40, without garbled font encoding or vertically split fractions)
 *   OR successful Gemini Vision transcribed text (vision_recovered)
 *
 * NEEDS REVIEW / ATTENTION:
 *   damaged fractions (vertically_separated_digits), gibberish encoding (7KLV %RRN),
 *   corrupted legacy fonts, empty, or ocr_failed
 *
 * Guarantee: Mutually exclusive groups.
 * Successfully Read + Needing Attention = Total Physical PDF Pages
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
  // Approximate front-matter offset: Physical PDF page 12 is textbook page 1
  const printedPageNumber = pageNumber >= 12 ? pageNumber - 11 : undefined;

  if (isFailed) {
    return {
      pageNumber,
      physicalPdfPage: pageNumber,
      printedPageNumber,
      characterCount: 0,
      wordCount: 0,
      hasUsableText: false,
      extractionStatus: 'failed',
      extractionMethod: 'native_pdf',
      extractionConfidence: 0,
      rawExtractedText: '',
      normalizedText: '',
      validationFlags: ['empty_page'],
      isTrustworthy: false,
      flagReason: 'Page extraction failed during PDF parsing or file was unreadable.',
      nativeText: '',
      nativeCharacterCount: 0,
      nativeWordCount: 0,
      textQualityScore: 0,
      textQualityStatus: 'image_only',
      requiresOcr: true,
      finalText: '',
      ocrStatus: 'none',
    };
  }

  const cleanNative = rawText ? rawText.trim() : '';
  const nativeCharCount = cleanNative.length;
  const nativeWords = cleanNative ? cleanNative.split(/\s+/).filter(Boolean) : [];
  const nativeWordCount = nativeWords.length;

  const quality = validatePageTextQuality(cleanNative);

  // If OCR / Vision result is provided, merge it authoritatively
  if (ocrResult) {
    if (ocrResult.status === 'ocr_success' && ocrResult.text.trim().length > 0) {
      const cleanOcr = ocrResult.text.trim();
      const ocrChars = cleanOcr.length;
      const ocrWords = cleanOcr.split(/\s+/).filter(Boolean).length;
      const ocrQuality = validatePageTextQuality(cleanOcr);
      const hasUsable = ocrChars >= 25 || ocrWords >= 6;

      return {
        pageNumber,
        physicalPdfPage: pageNumber,
        printedPageNumber,
        characterCount: ocrChars,
        wordCount: ocrWords,
        hasUsableText: hasUsable,
        extractionStatus: hasUsable ? 'vision_recovered' : 'needs_review',
        extractionMethod: 'vision',
        extractionConfidence: hasUsable ? 0.92 : 0.4,
        rawExtractedText: cleanNative,
        normalizedText: cleanOcr.replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n'),
        validationFlags: hasUsable ? [] : ['low_text_diagram'],
        isTrustworthy: hasUsable,
        flagReason: hasUsable ? undefined : 'Vision extracted short formula/diagram content.',
        nativeText: cleanNative,
        nativeCharacterCount: nativeCharCount,
        nativeWordCount: nativeWordCount,
        textQualityScore: Math.min(100, Math.max(80, Math.round((ocrChars / 150) * 100))),
        textQualityStatus: 'ocr_success',
        requiresOcr: false,
        finalText: cleanOcr,
        ocrStatus: 'success',
      };
    } else {
      return {
        pageNumber,
        physicalPdfPage: pageNumber,
        printedPageNumber,
        characterCount: nativeCharCount,
        wordCount: nativeWordCount,
        hasUsableText: false,
        extractionStatus: 'failed',
        extractionMethod: 'vision',
        extractionConfidence: 0.1,
        rawExtractedText: cleanNative,
        normalizedText: quality.normalizedText,
        validationFlags: [...quality.validationFlags, 'vision_failed'],
        isTrustworthy: false,
        flagReason: ocrResult.errorReason || 'Gemini Vision fallback extraction failed for this physical page.',
        nativeText: cleanNative,
        nativeCharacterCount: nativeCharCount,
        nativeWordCount: nativeWordCount,
        textQualityScore: quality.score,
        textQualityStatus: 'ocr_failed',
        requiresOcr: true,
        finalText: quality.isTrustworthy ? cleanNative : '',
        ocrStatus: 'failed',
        ocrErrorReason: ocrResult.errorReason,
      };
    }
  }

  // Native classification based on text quality analysis
  let extractionStatus: ExtractionStatus;
  let hasUsableText = false;

  if (quality.isTrustworthy) {
    extractionStatus = 'verified';
    hasUsableText = true;
  } else {
    extractionStatus = 'needs_review';
    hasUsableText = false;
  }

  return {
    pageNumber,
    physicalPdfPage: pageNumber,
    printedPageNumber,
    characterCount: nativeCharCount,
    wordCount: nativeWordCount,
    hasUsableText,
    extractionStatus,
    extractionMethod: 'native_pdf',
    extractionConfidence: quality.extractionConfidence,
    rawExtractedText: cleanNative,
    normalizedText: quality.normalizedText,
    validationFlags: quality.validationFlags,
    isTrustworthy: quality.isTrustworthy,
    flagReason: quality.flagReason,
    nativeText: cleanNative,
    nativeCharacterCount: nativeCharCount,
    nativeWordCount: nativeWordCount,
    textQualityScore: quality.score,
    textQualityStatus: quality.status,
    requiresOcr: quality.requiresOcr,
    finalText: quality.isTrustworthy ? cleanNative : '',
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
