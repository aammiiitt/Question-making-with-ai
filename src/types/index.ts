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

export interface DocumentItem {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_url?: string;
  file_size: number;
  page_count: number;
  language: 'English' | 'Bengali' | 'Bilingual';
  status: DocumentStatus;
  processing_step?: number; // 1 to 7 in pipeline
  detected_chapters_count: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  document_id: string;
  title: string;
  chapter_number: number;
  page_start: number;
  page_end: number;
  topics_count?: number;
  status: 'detected' | 'verified' | 'custom';
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

export type WeightageMode = 'exact_marks' | 'percentage' | 'equal';

export interface ChapterWeightage {
  chapter_id: string;
  chapter_title: string;
  chapter_number: number;
  included: boolean;
  marks: number;
  percentage: number;
  locked: boolean;
  assigned_questions_count: number;
}

export interface SectionBlueprint {
  id: string;
  name: string;
  description: string;
  marksPerQuestion: number;
  numberOfQuestions: number;
  totalSectionMarks: number;
  questionType: QuestionType;
}

export interface QuestionSlot {
  slotNumber: number;
  sectionId: string;
  sectionName: string;
  chapterId: string;
  chapterTitle: string;
  marks: number;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  status: 'pending' | 'generating' | 'generated' | 'failed' | 'source_required';
  questionItem?: QuestionItem;
  errorReason?: string;
}

export interface ChapterHealthCheck {
  chapterId: string;
  chapterTitle: string;
  expectedMarks: number;
  actualMarks: number;
  passed: boolean;
}

export interface PaperHealth {
  totalMarksExpected: number;
  totalMarksActual: number;
  totalQuestionsExpected: number;
  totalQuestionsActual: number;
  chapterChecks: ChapterHealthCheck[];
  allChaptersPassed: boolean;
  answerKeysCount: number;
  markingSchemesCount: number;
  duplicateCount: number;
  sourceGroundingPassed: boolean;
  isReady: boolean;
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
  weightageMode: WeightageMode;
  chaptersWeightage: ChapterWeightage[];
  sections: SectionBlueprint[];
  slots: QuestionSlot[];
  paperHealth: PaperHealth;
  status: 'draft' | 'configuring' | 'blueprint_ready' | 'generating' | 'ready';
  created_at: string;
  updated_at: string;
}

