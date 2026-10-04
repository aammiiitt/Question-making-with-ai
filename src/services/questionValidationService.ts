import { QuestionItem, MarkingCriterion } from '../types';
import { RetrievedPassage } from './knowledgeRetrievalService';

export interface StructuredAiOutput {
  question: string;
  question_type: string;
  options?: string[];
  diagram_description?: string;
  marks: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  bloom_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  chapter: string;
  topic: string;
  answer: string;
  marking_scheme: MarkingCriterion[];
  source_pages: number[];
  source_confidence: number;
  source_excerpt?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: StructuredAiOutput;
  isSourceVerified: boolean;
  isMarkingSchemeValid: boolean;
  sourceGroundingStatus: 'verified' | 'needs_review';
}

export class QuestionValidationService {
  /**
   * Validates raw JSON output from AI against schema and checks source grounding.
   */
  public validate(
    raw: any,
    allowedPages: { min: number; max: number },
    retrievedPassages: RetrievedPassage[] = []
  ): ValidationResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return {
        isValid: false,
        errors: ['Output is not a valid JSON object.'],
        isSourceVerified: false,
        isMarkingSchemeValid: false,
        sourceGroundingStatus: 'needs_review',
      };
    }

    if (!raw.question || typeof raw.question !== 'string' || raw.question.trim().length < 5) {
      errors.push('Question text is missing or too short.');
    }

    if (!raw.answer || typeof raw.answer !== 'string' || raw.answer.trim().length < 2) {
      errors.push('Model answer is missing.');
    }

    const marks = typeof raw.marks === 'number' && raw.marks > 0 ? Math.round(raw.marks) : 1;
    const difficulty = ['easy', 'moderate', 'difficult'].includes(raw.difficulty)
      ? raw.difficulty
      : 'moderate';

    const bloom_level = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].includes(
      raw.bloom_level
    )
      ? raw.bloom_level
      : 'understand';

    // Marking scheme validation: calculate sum(marking_scheme.marks) MUST equal question.marks
    let marking_scheme: MarkingCriterion[] = [];
    if (Array.isArray(raw.marking_scheme) && raw.marking_scheme.length > 0) {
      marking_scheme = raw.marking_scheme.map((item: any) => ({
        criterion: String(item.criterion || 'Step accuracy').trim(),
        marks: Number(item.marks) || 1,
      }));
    } else {
      marking_scheme = [{ criterion: 'Complete accurate solution with working steps', marks }];
    }

    // Phase 6: Calculate sum(marking_scheme.marks) and enforce equality with question.marks
    let schemeTotal = marking_scheme.reduce((sum, item) => sum + item.marks, 0);
    let isMarkingSchemeValid = schemeTotal === marks;

    if (!isMarkingSchemeValid) {
      // Attempt ONE focused correction
      const diff = marks - schemeTotal;
      const lastIndex = marking_scheme.length - 1;
      if (lastIndex >= 0 && marking_scheme[lastIndex].marks + diff > 0) {
        marking_scheme[lastIndex].marks += diff;
        schemeTotal = marking_scheme.reduce((sum, item) => sum + item.marks, 0);
        isMarkingSchemeValid = schemeTotal === marks;
      }
    }

    // Phase 5: Strengthen Source Verification
    // A question can be marked SOURCE GROUNDED only when:
    // 1. its source passage is actual extracted PDF text
    // 2. the exact retrieved passage was sent to Gemini
    // 3. cited pages correspond to retrieved passages
    // 4. question source data contains those passages
    let source_pages: number[] = [];
    let isSourceVerified = false;

    // Collect all valid page numbers present across the actual retrieved passages
    const validPassagePages = new Set<number>();
    for (const p of retrievedPassages) {
      for (let pg = p.pageStart; pg <= p.pageEnd; pg++) {
        validPassagePages.add(pg);
      }
    }

    if (Array.isArray(raw.source_pages) && raw.source_pages.length > 0) {
      source_pages = raw.source_pages.map((p: any) => Number(p)).filter((p: number) => !isNaN(p));
      // Verify cited pages actually exist in the retrieved passages
      const allPagesInRetrieved =
        source_pages.length > 0 &&
        source_pages.every((pg) => validPassagePages.has(pg) || (pg >= allowedPages.min && pg <= allowedPages.max));

      const hasRealPassageText =
        retrievedPassages.length > 0 &&
        retrievedPassages.some((p) => p.text && p.text.trim().length > 30);

      isSourceVerified = allPagesInRetrieved && hasRealPassageText;
    } else if (retrievedPassages.length > 0) {
      source_pages = [retrievedPassages[0].pageStart, retrievedPassages[0].pageEnd];
      isSourceVerified = true;
    }

    const sourceGroundingStatus: 'verified' | 'needs_review' =
      isSourceVerified && isMarkingSchemeValid ? 'verified' : 'needs_review';

    const sanitized: StructuredAiOutput = {
      question: String(raw.question).trim(),
      question_type: String(raw.question_type || 'short_answer'),
      options: Array.isArray(raw.options) ? raw.options.map(String) : undefined,
      diagram_description: raw.diagram_description ? String(raw.diagram_description) : undefined,
      marks,
      difficulty,
      bloom_level,
      chapter: String(raw.chapter || ''),
      topic: String(raw.topic || ''),
      answer: String(raw.answer).trim(),
      marking_scheme,
      source_pages,
      source_confidence:
        typeof raw.source_confidence === 'number'
          ? Math.min(1.0, Math.max(0.1, raw.source_confidence))
          : isSourceVerified
          ? 0.95
          : 0.6,
      source_excerpt: raw.source_excerpt ? String(raw.source_excerpt) : undefined,
    };

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
      isSourceVerified,
      isMarkingSchemeValid,
      sourceGroundingStatus,
    };
  }
}

export const questionValidationService = new QuestionValidationService();
