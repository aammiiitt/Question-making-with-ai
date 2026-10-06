import { SourceContentType } from '../types';

/**
 * Deterministic Source Content Classification.
 * Classifies the ACTUAL supporting textbook source passage/chunk.
 *
 * Rules:
 * 1. Strong exercise indicators identify textbook practice sections.
 * 2. Ordinary text containing "calculate", "solve", "find", etc. MUST NOT be classified
 *    as exercise unless authentic exercise section indicators are present in the source.
 * 3. Ambiguous content is classified as 'unknown' without guessing.
 */

// Strong exercise header & section indicators (Bengali & English)
const STRONG_EXERCISE_PATTERNS = [
  /\b(let['’]s\s+work\s+out\s+ourselves)\b/i,
  /\b(let['’]s\s+work\s+out)\b/i,
  /\b(let['’]s\s+do\s+ourselves)\b/i,
  /\b(exercises?)\b/i,
  /\b(practice\s+(set|problems?|questions?|sheet)?)\b/i,
  /\b(worksheet)\b/i,
  /\b(ex\.?\s*\d+)/i,
  /নিজে\s*করি/i,
  /কষে\s*দেখি/i,
  /অনুশীলনী/i,
  /প্রশ্নমালা/i,
  /কর্মপত্র/i,
];

// Strong worked example indicators
const STRONG_WORKED_EXAMPLE_PATTERNS = [
  /\b(worked\s+examples?)\b/i,
  /\b(example\s*[:\d\-]+)/i,
  /\b(solution\s*[:\-]+)/i,
  /\b(model\s+problem)\b/i,
  /উদাহরণ\s*[:\d\-]+/i,
  /সমাধান\s*[:\-]+/i,
  /করে\s*দেওয়া\s*হলো/i,
  /নিদর্শন/i,
];

// Strong definition indicators
const STRONG_DEFINITION_PATTERNS = [
  /\b(definition\s*[:\-]+)/i,
  /\b(is\s+defined\s+as)\b/i,
  /\b(we\s+define)\b/i,
  /সংজ্ঞা\s*[:\-]+/i,
  /কাকে\s+বলে/i,
  /বলা\s*হয়\s*[:\-।]/i,
];

// Strong activity indicators
const STRONG_ACTIVITY_PATTERNS = [
  /\b(activity\s*[:\d\-]+)/i,
  /\b(hands[\s\-]on\s+activity)\b/i,
  /কার্যকলাপ/i,
  /হাতে\s*কলমে/i,
];

// Strong diagram indicators
const STRONG_DIAGRAM_PATTERNS = [
  /\b(fig(ure)?\.?\s*\d+)/i,
  /\b(diagram\s*[:\d\-]+)/i,
  /চিত্র\s*[:\d\-]+/i,
  /রেখাচিত্র/i,
];

// Strong table indicators
const STRONG_TABLE_PATTERNS = [
  /\b(table\s*[:\d\-]+)/i,
  /সারণি\s*[:\d\-]+/i,
  /তালিকা\s*[:\d\-]+/i,
];

/**
 * Classifies an authentic textbook source passage deterministically.
 */
export function classifySourceContent(
  sourceText?: string | null,
  contextHeading?: string | null
): SourceContentType {
  if (!sourceText || sourceText.trim().length === 0) {
    return 'unknown';
  }

  const combined = `${contextHeading || ''}\n${sourceText}`.trim();

  // 1. Check strong exercise indicators
  for (const pattern of STRONG_EXERCISE_PATTERNS) {
    if (pattern.test(combined)) {
      return 'exercise';
    }
  }

  // 2. Check worked example indicators
  for (const pattern of STRONG_WORKED_EXAMPLE_PATTERNS) {
    if (pattern.test(combined)) {
      return 'worked_example';
    }
  }

  // 3. Check definition indicators
  for (const pattern of STRONG_DEFINITION_PATTERNS) {
    if (pattern.test(combined)) {
      return 'definition';
    }
  }

  // 4. Check activity indicators
  for (const pattern of STRONG_ACTIVITY_PATTERNS) {
    if (pattern.test(combined)) {
      return 'activity';
    }
  }

  // 5. Check diagram indicators
  for (const pattern of STRONG_DIAGRAM_PATTERNS) {
    if (pattern.test(combined)) {
      return 'diagram';
    }
  }

  // 6. Check table indicators
  for (const pattern of STRONG_TABLE_PATTERNS) {
    if (pattern.test(combined)) {
      return 'table';
    }
  }

  // 7. Check if passage is purely theoretical/explanatory prose without exercise headers
  const isLengthyProse = sourceText.length > 200 && sourceText.split(/[।\.]/).length >= 3;
  const hasIntroductoryPhrases = /\b(let\s+us|we\s+observe|in\s+this\s+chapter|remember\s+that|note\s+that)\b/i.test(sourceText) ||
    /(আমরা\s+জানি|মনে\s+রাখো|লক্ষ\s+করো)/i.test(sourceText);

  if (isLengthyProse && hasIntroductoryPhrases) {
    return 'theory';
  }

  // If ambiguous: do not guess. Return 'unknown'
  return 'unknown';
}

/**
 * Detects the source language of a textbook from extracted physical pages.
 * Uses script counts across approximately the first 40–50 pages:
 * - Latin A–Z/a–z
 * - Bengali Unicode (\u0980-\u09FF)
 * - Devanagari (\u0900-\u097F)
 *
 * If Latin characters strongly dominate, classifies as English.
 * Does NOT infer Bengali simply because some extracted glyphs look garbled.
 */
export function detectSourceLanguage(
  pages: { pageNumber?: number; text: string }[]
): 'English' | 'Bengali' | 'Hindi' | 'Not yet verified' {
  if (!pages || pages.length === 0) return 'Not yet verified';

  // Sample approximately first 40–50 pages
  const samplePages = pages.slice(0, 50);
  const sampleText = samplePages.map((p) => p.text || '').join(' ');

  const latinMatches = sampleText.match(/[a-zA-Z]/g);
  const bengaliMatches = sampleText.match(/[\u0980-\u09FF]/g);
  const devanagariMatches = sampleText.match(/[\u0900-\u097F]/g);

  const latinCount = latinMatches ? latinMatches.length : 0;
  const bengaliCount = bengaliMatches ? bengaliMatches.length : 0;
  const devanagariCount = devanagariMatches ? devanagariMatches.length : 0;

  if (latinCount === 0 && bengaliCount === 0 && devanagariCount === 0) {
    return 'Not yet verified';
  }

  // If Latin characters strongly dominate (or are greater than non-Latin scripts), classify as English
  if (latinCount > bengaliCount && latinCount > devanagariCount) {
    return 'English';
  }

  if (bengaliCount > latinCount && bengaliCount > devanagariCount) {
    return 'Bengali';
  }

  if (devanagariCount > latinCount && devanagariCount > bengaliCount) {
    return 'Hindi';
  }

  return latinCount > 0 ? 'English' : 'Not yet verified';
}
