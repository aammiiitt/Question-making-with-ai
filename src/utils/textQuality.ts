import { TextQualityStatus } from '../types';

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
}

// Typical legacy font glyphs that appear when non-Unicode Bengali fonts (Bijoy, STM, SutonnyMJ, etc.) are extracted
const LEGACY_BENGALI_CORRUPTED_CHARS =
  /[˛ˆÏÑÓÃ≤ôÿõ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/g;

// Obvious corrupted ngrams commonly seen in legacy font dumps
const SUSPECT_CORRUPTED_NGRAMS =
  /(?:ô!|ÿ˛|õÓ|≤Ã|yÑ|Ñ˛|ˆÏ|Ãy|˛õ|ÏÓ|Ó≤|ÃÑ|ˆy|õ!|≤y|ôÿ|˛Ñ|ÏÑ)/i;

/**
 * Evaluates the trustworthiness of native PDF page text extraction.
 * Distinguishes between:
 * - native_good: clean Unicode Bengali or readable English/math text
 * - native_low_text: very short extractable text (e.g. headers, formulas)
 * - native_garbled: corrupted legacy-font encoding artifacts (e.g. ô!ÿ˛õÓ, ≤ÃyÑ)
 * - image_only: no extractable text at all (scanned or purely diagrammatic)
 */
export function evaluateTextQuality(rawText?: string | null): TextQualityAnalysis {
  const cleanText = rawText ? rawText.trim() : '';
  const characterCount = cleanText.length;
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // 1. Completely empty -> image_only
  if (characterCount === 0) {
    return {
      score: 0,
      status: 'image_only',
      requiresOcr: true,
      bengaliCharCount: 0,
      garbledGlyphCount: 0,
      garbledRatio: 0,
      characterCount: 0,
      wordCount: 0,
      flagReason: 'No extractable text detected — page is scanned or image-only.',
    };
  }

  // Count Unicode Bengali characters (\u0980 - \u09FF)
  const bengaliMatches = cleanText.match(/[\u0980-\u09FF]/g);
  const bengaliCharCount = bengaliMatches ? bengaliMatches.length : 0;

  // Count corrupted legacy glyphs and replacement characters (\uFFFD)
  const legacyMatches = cleanText.match(LEGACY_BENGALI_CORRUPTED_CHARS);
  const replacementMatches = cleanText.match(/\uFFFD/g);
  const garbledGlyphCount = (legacyMatches ? legacyMatches.length : 0) + (replacementMatches ? replacementMatches.length : 0);
  const garbledRatio = characterCount > 0 ? garbledGlyphCount / characterCount : 0;

  // Check for suspect ngrams characteristic of legacy Bijoy/Sutonny fonts
  const hasSuspectNgrams = SUSPECT_CORRUPTED_NGRAMS.test(cleanText);

  // 2. Corrupted Legacy Encoding Check
  // Even if character count is high, legacy font artifacts MUST be flagged as garbled!
  const isGarbled =
    garbledRatio >= 0.05 ||
    (garbledGlyphCount >= 5 && garbledRatio >= 0.02) ||
    (hasSuspectNgrams && garbledGlyphCount >= 2) ||
    cleanText.includes('\uFFFD');

  if (isGarbled) {
    const penalty = Math.min(100, Math.round(garbledRatio * 250));
    const score = Math.max(5, 45 - penalty);
    return {
      score,
      status: 'native_garbled',
      requiresOcr: true,
      bengaliCharCount,
      garbledGlyphCount,
      garbledRatio,
      characterCount,
      wordCount,
      flagReason: `Corrupted legacy font encoding detected (${garbledGlyphCount} artifacts like ˛, ˆ, Ï, Ñ, Ó, Ã). OCR required.`,
    };
  }

  // 3. Low text (< 40 characters)
  if (characterCount < 40) {
    return {
      score: 30,
      status: 'native_low_text',
      requiresOcr: true,
      bengaliCharCount,
      garbledGlyphCount,
      garbledRatio,
      characterCount,
      wordCount,
      flagReason: 'Low extractable text (< 40 characters) — may contain mathematical diagrams or illustrations.',
    };
  }

  // 4. Sufficient clean text (Unicode Bengali or standard Latin math)
  if (characterCount >= 150 && wordCount >= 20) {
    return {
      score: 95,
      status: 'native_good',
      requiresOcr: false,
      bengaliCharCount,
      garbledGlyphCount,
      garbledRatio,
      characterCount,
      wordCount,
    };
  }

  // Intermediate text (40 to 149 chars)
  return {
    score: 70,
    status: 'native_low_text',
    requiresOcr: false,
    bengaliCharCount,
    garbledGlyphCount,
    garbledRatio,
    characterCount,
    wordCount,
    flagReason: 'Moderate text volume — may contain formula headers or partial worked problems.',
  };
}
