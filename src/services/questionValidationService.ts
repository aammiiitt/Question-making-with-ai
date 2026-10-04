import { QuestionItem, MarkingCriterion } from '../types';

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
}

export class QuestionValidationService {
  /**
   * Validates raw JSON output from AI against schema and checks source grounding.
   */
  public validate(raw: any, allowedPages: { min: number; max: number }): ValidationResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return { isValid: false, errors: ['Output is not a valid JSON object.'], isSourceVerified: false };
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

    const bloom_level = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].includes(raw.bloom_level)
      ? raw.bloom_level
      : 'understand';

    // Marking scheme validation
    let marking_scheme: MarkingCriterion[] = [];
    if (Array.isArray(raw.marking_scheme) && raw.marking_scheme.length > 0) {
      marking_scheme = raw.marking_scheme.map((item: any) => ({
        criterion: String(item.criterion || 'Step accuracy'),
        marks: Number(item.marks) || 1,
      }));
    } else {
      marking_scheme = [{ criterion: 'Complete correct response', marks }];
    }

    // Source pages verification
    let source_pages: number[] = [];
    let isSourceVerified = true;

    if (Array.isArray(raw.source_pages) && raw.source_pages.length > 0) {
      source_pages = raw.source_pages.map((p: any) => Number(p)).filter((p: number) => !isNaN(p));
      // Grounding check: verify that claimed pages fall within the provided source range
      for (const page of source_pages) {
        if (page < allowedPages.min || page > allowedPages.max) {
          isSourceVerified = false;
        }
      }
    } else {
      source_pages = [allowedPages.min, allowedPages.max];
      isSourceVerified = false;
    }

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
      source_confidence: typeof raw.source_confidence === 'number' ? Math.min(1.0, Math.max(0.1, raw.source_confidence)) : (isSourceVerified ? 0.92 : 0.65),
      source_excerpt: raw.source_excerpt ? String(raw.source_excerpt) : undefined,
    };

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
      isSourceVerified,
    };
  }
}

export const questionValidationService = new QuestionValidationService();
