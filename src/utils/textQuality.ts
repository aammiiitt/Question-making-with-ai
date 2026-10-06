import { TextQualityStatus, ExtractionMethod, ExtractionStatus, ValidationFlag } from '../types';

export interface TextQualityAnalysis {
  score: number; // 0 to 100
  status: TextQualityStatus;
  requiresOcr: boolean;
  bengaliCharCount: number;
  garbledGlyphCount: number;
  garbledRatio: number;
  characterCount: number;
  wordCount: number;
  flagReason?: string;
  isTrustworthy?: boolean;
  extractionStatus?: ExtractionStatus;
  extractionMethod?: ExtractionMethod;
  extractionConfidence?: number;
  validationFlags?: (ValidationFlag | string)[];
}

export interface TextValidationResult {
  isTrustworthy: boolean;
  extractionStatus: ExtractionStatus;
  extractionMethod: ExtractionMethod;
  extractionConfidence: number; // 0.0 to 1.0
  validationFlags: (ValidationFlag | string)[];
  flagReason?: string;
  score: number; // 0 to 100
  status: TextQualityStatus;
  requiresOcr: boolean;
  characterCount: number;
  wordCount: number;
  bengaliCharCount: number;
  latinCharCount: number;
  garbledGlyphCount: number;
  garbledRatio: number;
  normalizedText: string;
}

// Typical legacy font glyphs that appear when non-Unicode Bengali fonts (Bijoy, STM, SutonnyMJ, etc.) are extracted
const LEGACY_BENGALI_CORRUPTED_CHARS =
  /[˛ˆÏÑÓÃ≤ôÿõ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/g;

// Obvious corrupted ngrams commonly seen in legacy font dumps
const SUSPECT_CORRUPTED_NGRAMS =
  /(?:ô!|ÿ˛|õÓ|≤Ã|yÑ|Ñ˛|ˆÏ|Ãy|˛õ|ÏÓ|Ó≤|ÃÑ|ˆy|õ!|≤y|ôÿ|˛Ñ|ÏÑ)/i;

// Standard English/Math vocabulary to test dictionary validity
const COMMON_ENGLISH_MATH_WORDS = new Set([
  'the', 'and', 'is', 'in', 'to', 'of', 'for', 'with', 'on', 'at', 'from', 'by', 'as', 'this',
  'that', 'these', 'those', 'book', 'chapter', 'class', 'exercise', 'page', 'let', 'us', 'we',
  'shall', 'find', 'write', 'draw', 'count', 'calculate', 'number', 'numbers', 'fraction',
  'fractions', 'decimal', 'decimals', 'ratio', 'percentage', 'perimeter', 'area', 'line',
  'triangle', 'square', 'rectangle', 'circle', 'angle', 'sum', 'difference', 'product',
  'divide', 'multiply', 'add', 'subtract', 'meter', 'centimeter', 'cm', 'km', 'kg', 'rupees',
  'answer', 'question', 'problem', 'solve', 'solution', 'equal', 'equals', 'unit', 'units',
  'part', 'parts', 'total', 'value', 'each', 'more', 'less', 'greater', 'smaller', 'table',
  'side', 'sides', 'vertex', 'points', 'point', 'bar', 'graph', 'diagram', 'geometry',
  'measure', 'formula', 'example', 'step', 'following', 'given', 'show', 'true', 'false',
  'previous', 'lesson', 'lessons', 'revision', 'primary', 'secondary', 'school', 'board',
  'odd', 'even', 'prime', 'composite', 'factor', 'multiple', 'lcm', 'hcf', 'gcd'
]);

// Known Caesar-shift or corrupted font encoding patterns observed in damaged PDF text layers
// e.g. "7KLV %RRN" (THIS BOOK +3 shift), "1R *DQ", "WKH" (THE), "DQG" (AND), "IRU" (FOR), "WR" (TO)
const SUSPECT_GIBBERISH_PATTERNS = [
  /\b7KLV\b/i,
  /\b%RRN\b/i,
  /\b1R\s*\*DQ\b/i,
  /\bWKH\b/i,
  /\bDQG\b/i,
  /\bIRU\b/i,
  /\bWR\b/i,
  /\bFKDSWHU\b/i,
  /\bPDWKHPDWLFV\b/i,
  /\bH\[HUFLVH\b/i,
  /\b[A-Za-z0-9]*[%*#@^~][A-Za-z0-9]+\b/,
  /\b\d+[A-Z]{2,}\b/,
];

/**
 * Detects vertically separated numbers/fractions where digits appear isolated on consecutive lines.
 * E.g.:
 * 2
 * 8
 * 4
 * 1
 * 4
 */
export function detectVerticallySeparatedDigits(text: string): {
  detected: boolean;
  isolatedCount: number;
  maxConsecutive: number;
} {
  if (!text) return { detected: false, isolatedCount: 0, maxConsecutive: 0 };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  let isolatedCount = 0;
  let maxConsecutive = 0;
  let currentConsecutive = 0;

  for (const line of lines) {
    if (/^[0-9০-৯]$/.test(line) || /^[0-9০-৯]\s*[\/+\-xX×÷=]\s*$/.test(line)) {
      isolatedCount++;
      currentConsecutive++;
      if (currentConsecutive > maxConsecutive) {
        maxConsecutive = currentConsecutive;
      }
    } else {
      currentConsecutive = 0;
    }
  }

  const detected = maxConsecutive >= 3 || (isolatedCount >= 5 && isolatedCount / Math.max(1, lines.length) > 0.2);
  return { detected, isolatedCount, maxConsecutive };
}

/**
 * Detects suspicious font encoding / gibberish shift patterns (like "1R *DQ...", "7KLV %RRN...")
 */
export function detectGibberishFontEncoding(
  cleanText: string,
  words: string[],
  latinCharCount: number
): { detected: boolean; reason?: string } {
  if (cleanText.length < 30) return { detected: false };

  // 1. Direct regex match on known Caesar-shifted font artifacts
  for (const pattern of SUSPECT_GIBBERISH_PATTERNS) {
    if (pattern.test(cleanText)) {
      return {
        detected: true,
        reason: 'Corrupted font encoding artifacts detected (e.g. 7KLV, %RRN, 1R *DQ).',
      };
    }
  }

  // 2. High density of letters mixed with punctuation symbols inside tokens
  const symbolMixedTokens = words.filter((w) => /[a-zA-Z]+[%*#@^~&]+[a-zA-Z]+/i.test(w));
  if (symbolMixedTokens.length >= 2) {
    return {
      detected: true,
      reason: 'Tokens containing internal symbols and corrupted encoding detected.',
    };
  }

  // 3. For Latin-heavy text with substantial words: check dictionary validity
  if (latinCharCount >= 80 && words.length >= 12) {
    const latinTokens = words.filter((w) => /^[a-zA-Z]{2,15}$/.test(w));
    if (latinTokens.length >= 10) {
      const recognized = latinTokens.filter((w) => COMMON_ENGLISH_MATH_WORDS.has(w.toLowerCase())).length;
      const validRatio = recognized / latinTokens.length;

      // If recognizable English/math words are almost zero (< 6%) despite large Latin character count,
      // the font layer has invalid identity/CMap mapping.
      if (validRatio < 0.06 && latinTokens.some((t) => /[A-Z]{3,}/.test(t))) {
        return {
          detected: true,
          reason: 'Severe font encoding corruption: unreadable non-dictionary token sequence.',
        };
      }
    }
  }

  return { detected: false };
}

/**
 * Comprehensive Safe Text Quality Validator.
 * Evaluates whether extracted text is reliable and authentic, or requires Vision fallback.
 */
export function validatePageTextQuality(rawText?: string | null): TextValidationResult {
  const cleanText = rawText ? rawText.trim() : '';
  const characterCount = cleanText.length;
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const validationFlags: ValidationFlag[] = [];
  const flagReasons: string[] = [];

  // 1. Empty Page Check
  if (characterCount === 0) {
    validationFlags.push('empty_page');
    return {
      isTrustworthy: false,
      extractionStatus: 'needs_review',
      extractionMethod: 'native_pdf',
      extractionConfidence: 0,
      validationFlags,
      flagReason: 'No extractable text detected — page is scanned or image-only.',
      score: 0,
      status: 'image_only',
      requiresOcr: true,
      characterCount: 0,
      wordCount: 0,
      bengaliCharCount: 0,
      latinCharCount: 0,
      garbledGlyphCount: 0,
      garbledRatio: 0,
      normalizedText: '',
    };
  }

  // Count character types
  const bengaliMatches = cleanText.match(/[\u0980-\u09FF]/g);
  const bengaliCharCount = bengaliMatches ? bengaliMatches.length : 0;

  const latinMatches = cleanText.match(/[a-zA-Z]/g);
  const latinCharCount = latinMatches ? latinMatches.length : 0;

  const legacyMatches = cleanText.match(LEGACY_BENGALI_CORRUPTED_CHARS);
  const replacementMatches = cleanText.match(/\uFFFD/g);
  const replacementCount = replacementMatches ? replacementMatches.length : 0;
  const garbledGlyphCount = (legacyMatches ? legacyMatches.length : 0) + replacementCount;
  const garbledRatio = characterCount > 0 ? garbledGlyphCount / characterCount : 0;
  const hasSuspectNgrams = SUSPECT_CORRUPTED_NGRAMS.test(cleanText);

  // 2. Check for Vertically Separated Digits / Damaged Fractions
  const verticalDigits = detectVerticallySeparatedDigits(cleanText);
  if (verticalDigits.detected) {
    validationFlags.push('vertically_separated_digits');
    flagReasons.push(
      `Damaged mathematical fraction/columnar layout (${verticalDigits.isolatedCount} vertically separated digits).`
    );
  }

  // 3. Check for Suspicious Gibberish / Font-Encoded Sequences
  const gibberishCheck = detectGibberishFontEncoding(cleanText, words, latinCharCount);
  if (gibberishCheck.detected) {
    validationFlags.push('gibberish_encoded_text');
    flagReasons.push(gibberishCheck.reason || 'Suspicious font encoding or gibberish sequence.');
  }

  // 4. Check for Corrupted Legacy Glyphs / Replacement Characters
  const isLatinDominant =
    latinCharCount >= 80 ||
    (characterCount > 40 && latinCharCount / characterCount > 0.40);

  let isGarbledLegacy = false;
  if (isLatinDominant) {
    isGarbledLegacy =
      (replacementCount >= 10 && replacementCount / characterCount >= 0.05) ||
      (hasSuspectNgrams && garbledRatio >= 0.15 && replacementCount >= 2);
  } else {
    isGarbledLegacy =
      (replacementCount >= 5 && replacementCount / characterCount >= 0.03) ||
      (hasSuspectNgrams && garbledGlyphCount >= 5 && garbledRatio >= 0.04) ||
      (garbledRatio >= 0.12 && garbledGlyphCount >= 12 && bengaliCharCount === 0);
  }

  if (isGarbledLegacy) {
    validationFlags.push('corrupted_legacy_glyphs');
    flagReasons.push(
      `Corrupted legacy font encoding detected (${garbledGlyphCount} artifacts like ˛, ˆ, Ï, Ñ, Ó, Ã).`
    );
  }

  // 5. Check for Excessive Symbols
  const symbolMatches = cleanText.match(/[^a-zA-Z0-9\s\u0980-\u09FF.,;:!?'"()\-–—+=\/×÷<>%[\]]/g);
  const symbolCount = symbolMatches ? symbolMatches.length : 0;
  if (characterCount >= 50 && symbolCount / characterCount > 0.18) {
    validationFlags.push('excessive_symbols');
    flagReasons.push(`Excessive non-language symbols (${symbolCount} symbols).`);
  }

  // 6. Check for Low Text / Diagram
  if (characterCount < 40) {
    validationFlags.push('low_text_diagram');
    flagReasons.push('Low extractable text (< 40 characters) — contains diagram, illustration or exercise header.');
  }

  // Determine Trustworthiness & Extraction Status
  const hasDamagingFlags =
    validationFlags.includes('vertically_separated_digits') ||
    validationFlags.includes('gibberish_encoded_text') ||
    validationFlags.includes('corrupted_legacy_glyphs') ||
    validationFlags.includes('empty_page');

  const isTrustworthy = !hasDamagingFlags && characterCount >= 40 && !validationFlags.includes('excessive_symbols');

  let score = 95;
  let status: TextQualityStatus = 'native_good';
  let extractionStatus: ExtractionStatus = 'verified';
  let extractionConfidence = 0.95;

  if (hasDamagingFlags) {
    score = Math.max(10, Math.min(45, 50 - validationFlags.length * 15));
    status = isGarbledLegacy ? 'native_garbled' : 'native_low_text';
    extractionStatus = 'needs_review';
    extractionConfidence = Math.max(0.15, score / 100);
  } else if (validationFlags.includes('low_text_diagram')) {
    score = 30;
    status = 'native_low_text';
    extractionStatus = 'needs_review';
    extractionConfidence = 0.35;
  } else if (validationFlags.includes('excessive_symbols')) {
    score = 45;
    status = 'native_low_text';
    extractionStatus = 'needs_review';
    extractionConfidence = 0.45;
  }

  const normalizedText = cleanText.replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n');

  return {
    isTrustworthy,
    extractionStatus,
    extractionMethod: 'native_pdf',
    extractionConfidence,
    validationFlags,
    flagReason: flagReasons.length > 0 ? flagReasons.join(' ') : undefined,
    score,
    status,
    requiresOcr: !isTrustworthy,
    characterCount,
    wordCount,
    bengaliCharCount,
    latinCharCount,
    garbledGlyphCount,
    garbledRatio,
    normalizedText,
  };
}

/**
 * Backward compatible evaluateTextQuality delegating to validatePageTextQuality
 */
export function evaluateTextQuality(rawText?: string | null): TextQualityAnalysis {
  const result = validatePageTextQuality(rawText);
  return {
    score: result.score,
    status: result.status,
    requiresOcr: result.requiresOcr,
    bengaliCharCount: result.bengaliCharCount,
    garbledGlyphCount: result.garbledGlyphCount,
    garbledRatio: result.garbledRatio,
    characterCount: result.characterCount,
    wordCount: result.wordCount,
    flagReason: result.flagReason,
    isTrustworthy: result.isTrustworthy,
    extractionStatus: result.extractionStatus,
    extractionMethod: result.extractionMethod,
    extractionConfidence: result.extractionConfidence,
    validationFlags: result.validationFlags,
  };
}
