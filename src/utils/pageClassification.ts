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
  },
  knownPrintedPageNumber?: number
): PageCoverageRecord {
  // Only use printed page number when genuinely known/detected; do not assume a hard-coded offset
  const printedPageNumber = knownPrintedPageNumber !== undefined ? knownPrintedPageNumber : undefined;

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
      nativeConfidence: 0,
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

  // If OCR / Vision result is provided, validate it strictly
  if (ocrResult) {
    if (ocrResult.status === 'ocr_success' && ocrResult.text.trim().length > 0) {
      const cleanOcr = ocrResult.text.trim();
      const ocrChars = cleanOcr.length;
      const ocrWords = cleanOcr.split(/\s+/).filter(Boolean).length;
      
      // CRITICAL ISSUE 3: Run comprehensive quality validation on recovered transcription too
      const ocrQuality = validatePageTextQuality(cleanOcr);
      const isVisionTrustworthy = ocrQuality.isTrustworthy && (ocrChars >= 20 || ocrWords >= 4);

      if (isVisionTrustworthy) {
        return {
          pageNumber,
          physicalPdfPage: pageNumber,
          printedPageNumber,
          characterCount: ocrChars,
          wordCount: ocrWords,
          hasUsableText: true,
          extractionStatus: 'vision_recovered',
          extractionMethod: 'vision',
          extractionConfidence: Number(ocrQuality.extractionConfidence.toFixed(2)),
          nativeConfidence: Number(quality.extractionConfidence.toFixed(2)),
          visionConfidence: Number(ocrQuality.extractionConfidence.toFixed(2)),
          rawExtractedText: cleanNative,
          normalizedText: ocrQuality.normalizedText,
          validationFlags: ocrQuality.validationFlags,
          isTrustworthy: true,
          flagReason: ocrQuality.flagReason,
          nativeText: cleanNative,
          nativeCharacterCount: nativeCharCount,
          nativeWordCount: nativeWordCount,
          visionText: cleanOcr,
          textQualityScore: ocrQuality.score,
          textQualityStatus: 'ocr_success',
          requiresOcr: false,
          finalText: cleanOcr,
          ocrStatus: 'success',
        };
      } else {
        // Vision output did not pass quality validation: keep needs_review
        const mergedFlags = Array.from(new Set([...quality.validationFlags, ...ocrQuality.validationFlags]));
        return {
          pageNumber,
          physicalPdfPage: pageNumber,
          printedPageNumber,
          characterCount: ocrChars > 0 ? ocrChars : nativeCharCount,
          wordCount: ocrWords > 0 ? ocrWords : nativeWordCount,
          hasUsableText: false,
          extractionStatus: 'needs_review',
          extractionMethod: 'vision',
          extractionConfidence: Number(Math.min(quality.extractionConfidence, ocrQuality.extractionConfidence).toFixed(2)),
          nativeConfidence: Number(quality.extractionConfidence.toFixed(2)),
          visionConfidence: Number(ocrQuality.extractionConfidence.toFixed(2)),
          rawExtractedText: cleanNative,
          normalizedText: ocrQuality.normalizedText || quality.normalizedText,
          validationFlags: mergedFlags,
          isTrustworthy: false,
          flagReason: ocrQuality.flagReason || 'Vision output did not pass quality validation (damaged mathematical layout or symbols).',
          nativeText: cleanNative,
          nativeCharacterCount: nativeCharCount,
          nativeWordCount: nativeWordCount,
          visionText: cleanOcr,
          textQualityScore: Math.min(quality.score, ocrQuality.score),
          textQualityStatus: 'ocr_failed',
          requiresOcr: true,
          finalText: cleanNative,
          ocrStatus: 'failed',
          ocrErrorReason: ocrQuality.flagReason || 'Vision transcription failed quality checks',
        };
      }
    } else {
      return {
        pageNumber,
        physicalPdfPage: pageNumber,
        printedPageNumber,
        characterCount: nativeCharCount,
        wordCount: nativeWordCount,
        hasUsableText: false,
        extractionStatus: 'needs_review',
        extractionMethod: 'native_pdf',
        extractionConfidence: Number((quality.extractionConfidence * 0.5).toFixed(2)),
        nativeConfidence: Number(quality.extractionConfidence.toFixed(2)),
        visionConfidence: 0,
        rawExtractedText: cleanNative,
        normalizedText: quality.normalizedText,
        validationFlags: Array.from(new Set([...quality.validationFlags, 'vision_failed'])),
        isTrustworthy: false,
        flagReason: ocrResult.errorReason || 'Gemini Vision fallback extraction failed for this physical page.',
        nativeText: cleanNative,
        nativeCharacterCount: nativeCharCount,
        nativeWordCount: nativeWordCount,
        visionText: '',
        textQualityScore: quality.score,
        textQualityStatus: 'ocr_failed',
        requiresOcr: true,
        finalText: cleanNative,
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
    extractionConfidence: Number(quality.extractionConfidence.toFixed(2)),
    nativeConfidence: Number(quality.extractionConfidence.toFixed(2)),
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
    finalText: cleanNative,
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
