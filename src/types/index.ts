/**
 * Data Model for AI Question Paper Maker
 * Section 12 Specification & Domain Entities
 */

export type Language = 'en' | 'bn' | 'bilingual';

export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'fill_in_the_blank'
  | 'very_short_answer'
  | 'short_answer'
  | 'long_answer'
  | 'numerical'
  | 'assertion_reason'
  | 'case_based'
  | 'diagram_based'
  | 'match_the_following';

export type DifficultyLevel = 'easy' | 'moderate' | 'difficult';

export type QuestionStatus = 'ai_generated' | 'approved' | 'edited' | 'rejected';

export type DocumentStatus = 'uploading' | 'processing' | 'needs_review' | 'ready' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  board?: string;
  preferred_language: Language;
  created_at: string;
}

export type TextQualityStatus =
  | 'native_good'
  | 'native_low_text'
  | 'native_garbled'
  | 'image_only'
  | 'ocr_pending'
  | 'ocr_success'
  | 'ocr_failed';

export interface PageCoverageRecord {
  pageNumber: number;
  characterCount: number;
  wordCount: number;
  hasUsableText: boolean;
  extractionStatus: 'read' | 'low_text' | 'empty' | 'failed';
  flagReason?: string;
  // Hybrid OCR fields
  nativeText?: string;
  nativeCharacterCount?: number;
  nativeWordCount?: number;
  textQualityScore?: number; // 0-100
  textQualityStatus?: TextQualityStatus;
  requiresOcr?: boolean;
  finalText?: string;
  extractionMethod?: 'native' | 'ocr';
  ocrStatus?: 'none' | 'pending' | 'success' | 'failed';
  ocrErrorReason?: string;
}

export interface ChapterProcessingReport {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  pageStart: number;
  pageEnd: number;
  totalPages: number;
  usablePagesCount: number;
  attentionPages: number[];
  chunkCount: number;
  approxWords: number;
  topics: string[];
  status: 'read' | 'verify';
  beginningSample: string;
  middleSample: string;
  endingSample: string;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_url?: string;
  file_size: number;
  page_count: number;
  language: 'English' | 'Bengali' | 'Hindi' | 'Bilingual' | 'Other' | 'Not yet verified';
  status: DocumentStatus;
  processing_step?: number; // 1 to 7 in pipeline
  detected_chapters_count: number;
  is_demo?: boolean;
  teacher_confirmed?: boolean;
  teacher_confirmed_at?: string;
  total_extracted_chars?: number;
  total_words?: number;
  usable_pages_count?: number;
  attention_pages_count?: number;
  coverage_percentage?: number;
  created_at: string;
  // Hybrid OCR summary fields
  ocr_fallback_mode?: boolean;
  native_good_pages_count?: number;
  native_garbled_pages_count?: number;
  native_low_text_pages_count?: number;
  image_only_pages_count?: number;
  ocr_processed_pages_count?: number;
  ocr_successful_pages_count?: number;
  chapter_detection_diagnostics?: ChapterDetectionDiagnostics;
}

export interface ChapterHeadingCandidate {
  chapterNumber: number;
  physicalPage: number;
  headingText: string;
  nearbyTitle?: string;
  confidence?: 'high' | 'medium' | 'provisional';
}

export interface ChapterDetectionDiagnostics {
  totalPagesScanned: number;
  candidateHeadingsCount: number;
  first10CandidateHeadings: ChapterHeadingCandidate[];
  tocCandidatePages: number[];
  finalChaptersCount: number;
  mappingSource: 'deterministic' | 'gemini' | 'hybrid' | 'provisional_fallback' | 'teacher_edit';
}

export interface Chapter {
  id: string;
  document_id: string;
  title: string;
  chapter_number: number;
  page_start: number;
  page_end: number;
  topics_count?: number;
  status: 'detected' | 'verified' | 'custom' | 'needs_review';
}

export interface Topic {
  id: string;
  chapter_id: string;
  document_id: string;
  title: string;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chapter_id: string;
  topic_id?: string;
  page_start: number;
  page_end: number;
  text: string;
  embedding_reference?: string;
  extraction_confidence: number;
}

export interface MarkingCriterion {
  criterion: string;
  marks: number;
}

export type SourceContentType =
  | 'theory'
  | 'definition'
  | 'worked_example'
  | 'exercise'
  | 'activity'
  | 'diagram'
  | 'table'
  | 'other'
  | 'unknown';

export interface QuestionSource {
  id: string;
  question_id: string;
  document_id: string;
  book_title?: string;
  chapter_title?: string;
  page_start: number;
  page_end: number;
  source_text: string;
  source_confidence: number;
  retrieved_chunk_ids?: string[];
  is_real_pdf_grounded?: boolean;
  ai_source_excerpt?: string;
  is_excerpt_matched?: boolean;
  extraction_method?: 'native' | 'ocr';
  content_type?: SourceContentType;
}

export interface AnswerItem {
  id: string;
  question_id: string;
  answer_text: string;
  solution?: string;
  marking_scheme: MarkingCriterion[];
}

export interface QuestionFeedback {
  id: string;
  question_id: string;
  user_id: string;
  action: 'reject' | 'edit' | 'regenerate';
  rejection_reason?:
    | 'incorrect'
    | 'too_easy'
    | 'too_difficult'
    | 'outside_syllabus'
    | 'poor_language'
    | 'wrong_answer'
    | 'duplicate'
    | 'other';
  notes?: string;
  created_at: string;
}

export interface QuestionItem {
  id: string;
  user_id: string;
  document_id: string;
  chapter_id: string;
  topic_id?: string;
  question_text: string;
  options?: string[]; // For MCQ / Assertion-Reason
  diagram_description?: string;
  match_pairs?: { left: string; right: string }[];
  question_type: QuestionType;
  marks: number;
  difficulty: DifficultyLevel;
  bloom_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  language: Language;
  status: QuestionStatus;
  source_grounding_status?: 'verified' | 'needs_review' | 'unverified';
  created_at: string;
  updated_at: string;
  // Embedded / joined properties for UX
  answer?: AnswerItem;
  source?: QuestionSource;
  chapter_name?: string;
  book_name?: string;
  topic_name?: string;
}

export interface GenerateQuestionRequest {
  documentId: string;
  chapterId: string;
  topicId?: string;
  questionType: QuestionType;
  marks: number;
  difficulty: DifficultyLevel;
  language: Language;
  preferExercise?: boolean;
  additionalInstructions?: string;
  regenerationContext?: {
    previousQuestionId?: string;
    strategy: 'similar' | 'easier' | 'harder' | 'same_topic_diff' | 'diff_topic';
  };
}

export interface PipelineStep {
  step: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export type WeightageMode = 'ai_recommended' | 'exact_marks' | 'percentage' | 'equal';
export type AIWeightageAnalysisStatus = 'not_started' | 'analyzing' | 'success' | 'failed';

export interface ChapterAIAnalysis {
  chapter_id: string;
  chapter_title: string;
  effective_pages: number;
  page_volume_score: number; // 0-100 (30%)
  importance_score: number; // 0-100 (30%)
  chapter_relationship_score: number; // 0-100 (20%)
  skill_breadth_score: number; // 0-100 (15%)
  assessment_richness_score: number; // 0-100 (5%)
  overall_score: number; // weighted sum (0-100)
  importance_label: 'Essential Foundation' | 'High' | 'Moderate' | 'Supplementary';
  short_reason: string;
  raw_marks: number;
  final_marks: number;
  factor_notes: {
    content_volume: string;
    foundational_importance: string;
    inter_chapter_relevance: string;
    problem_solving_breadth: string;
    assessment_richness: string;
  };
}

export interface ChapterWeightage {
  chapter_id: string;
  chapter_title: string;
  chapter_number: number;
  included: boolean;
  marks: number;
  percentage: number;
  locked: boolean;
  assigned_questions_count: number;
  ai_analysis?: ChapterAIAnalysis;
  page_start?: number;
  page_end?: number;
  offered_marks?: number;
  attemptable_exposure?: number;
}

export interface SectionGroupBlueprint {
  id: string;
  groupNumber: number;
  title: string;
  instruction: string;
  questionType: QuestionType;
  marksPerQuestion: number;
  questionsOffered: number;
  questionsToAttempt: number;
  attemptedMarks: number;
}

export interface SectionBlueprint {
  id: string;
  name: string;
  description: string;
  marksPerQuestion: number;
  numberOfQuestions: number; // Offered count
  totalSectionMarks: number; // Attempted marks
  questionType: QuestionType;
  questionsOffered?: number;
  questionsToAttempt?: number;
  groups?: SectionGroupBlueprint[];
}

export interface QuestionSlot {
  slotNumber: number;
  sectionId: string;
  sectionName: string;
  groupId?: string;
  groupTitle?: string;
  subQuestionLabel?: string;
  chapterId: string;
  chapterTitle: string;
  marks: number;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  status: 'pending' | 'generating' | 'generated' | 'failed' | 'source_required';
  questionItem?: QuestionItem;
  errorReason?: string;
  // Honest source classification & benchmark tags (no fake flags!)
  sourceContentType?: SourceContentType;
  preferExerciseSource?: boolean;
  isDerivedFromExercise?: boolean;
  requiresConnectedSubparts?: boolean;
  hasDiagram?: boolean;
  isGeometryConstruction?: boolean;
  isNumerical?: boolean;
  subparts?: { label: string; marks: number; text?: string }[];
}

export interface ChapterHealthCheck {
  chapterId: string;
  chapterTitle: string;
  expectedMarks: number;
  actualMarks: number;
  offeredMarks?: number;
  passed: boolean;
  statusLabel?: string;
}

export interface PaperHealth {
  // Attempted marks (student choice rules)
  attemptedMarksExpected: number; // 70
  attemptedMarksConfigured: number; // 70
  totalMarksExpected: number; // 70
  totalMarksActual: number; // attemptedMarksConfigured (70)

  // Offered marks (sum of all 52 printed question blocks)
  offeredMarksExpected: number; // 102 for benchmark V1
  offeredMarksActual: number; // sum of actual offered question marks

  totalQuestionsExpected: number; // 52
  totalQuestionsActual: number;
  attemptedQuestionsCount?: number; // 37

  chapterChecks: ChapterHealthCheck[];
  allChaptersPassed: boolean;
  answerKeysCount: number;
  markingSchemesCount: number;
  allMarkingSchemesSumValid: boolean;
  invalidMarkingSchemeSlotNumbers: number[];
  duplicateCount: number;
  sourceGroundingPassed: boolean;
  allSourceGroundingPassed: boolean;
  isReady: boolean;
  healthIssues: string[];

  // Assessment validation metrics
  assessmentQualityScore?: number;
  universalRulesPassedCount?: number;
  universalRulesTotalCount?: number;
  exerciseDerivationPercentage?: number;
  exerciseCount?: number;
  exerciseKnownCount?: number;
  exerciseUnknownCount?: number;
  exerciseDerivationStatus?: 'compliant' | 'not_yet_verified' | 'failed';
  numericalValidationStatus?: 'structure_passed' | 'structure_failed' | 'not_yet_verified';
  numericalStructureCheckPassed?: boolean | null;
  mathematicalCorrectnessStatus?: 'not_yet_verified' | 'verified' | 'failed';
  numericalValidationPassed?: boolean;
  geometryConstructionsStatus?: 'informational' | 'compliant' | 'not_yet_verified' | 'none_detected';
  geometryCount?: number;
  connectedSubpartsStatus?: 'structure_passed' | 'structure_failed' | 'not_yet_verified';
  connectedSubpartsSemanticStatus?: 'review_required' | 'verified' | 'not_yet_verified';
  assessmentReport?: any;
}

export interface ClassVIExamPaper {
  id: string;
  title: string;
  schoolName: string;
  className: string;
  subject: string;
  totalMarks: number;
  timeAllowed: string;
  documentId: string;
  bookTitle: string;
  sourceLanguage?: string; // from textbook (e.g. English)
  outputLanguage?: Language; // teacher selected (e.g. bn)
  weightageMode: WeightageMode;
  blueprintPreset?: 'benchmark_v1' | 'compulsory_standard';
  chaptersWeightage: ChapterWeightage[];
  sections: SectionBlueprint[];
  slots: QuestionSlot[];
  paperHealth: PaperHealth;
  aiAnalyses?: ChapterAIAnalysis[];
  status: 'draft' | 'configuring' | 'blueprint_ready' | 'generating' | 'ready' | 'needs_review';
  created_at: string;
  updated_at: string;
}

