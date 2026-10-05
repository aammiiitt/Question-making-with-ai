import {
  QuestionItem,
  QuestionSlot,
  ChapterWeightage,
  SectionBlueprint,
  ClassVIExamPaper,
  QuestionType,
  DifficultyLevel,
  Language,
} from '../../types';

// ==========================================
// UNIVERSAL ASSESSMENT RULES TYPES
// ==========================================

export type UniversalRuleId =
  | 'grounded_in_approved_source'
  | 'no_outside_syllabus'
  | 'total_marks_arithmetic'
  | 'section_marks_arithmetic'
  | 'optional_question_arithmetic'
  | 'exact_duplicate_detection'
  | 'semantic_duplicate_detection'
  | 'same_fact_different_format'
  | 'marking_scheme_marks_equality'
  | 'answer_validation'
  | 'source_pages_traceable'
  | 'teacher_approval_workflow'
  | 'difficulty_distribution'
  | 'output_language_integrity';

export type RuleStatus = 'passed' | 'warning' | 'failed' | 'informational';

export interface RuleEvaluationResult {
  ruleId: UniversalRuleId;
  name: string;
  category: 'universal';
  status: RuleStatus;
  passed: boolean;
  score: number; // 0 to 100
  summary: string;
  details?: string[];
  affectedSlotNumbers?: number[];
  recommendation?: string;
}

export interface DuplicateMatch {
  slotA: number;
  slotB: number;
  questionTextA: string;
  questionTextB: string;
  similarityScore: number;
  type: 'exact' | 'semantic' | 'same_fact_different_format';
  reason: string;
}

export interface ArithmeticAudit {
  targetTotalMarks: number;
  attemptedMarksConfigured: number;
  offeredMarksExpected: number;
  offeredMarksActual: number;
  isAttemptedMarksCorrect: boolean;
  isOfferedMarksCorrect: boolean;
  isTotalMarksCorrect: boolean;
  sectionsAudit: {
    sectionId: string;
    sectionName: string;
    expectedAttemptedMarks: number;
    actualAttemptedMarks: number;
    expectedOfferedMarks: number;
    actualOfferedMarks: number;
    passed: boolean;
    ruleDescription: string;
  }[];
  optionalQuestionRulesAudit: {
    groupOrSectionId: string;
    label: string;
    offeredCount: number;
    attemptCount: number;
    marksPerQuestion: number;
    offeredMarksExpected: number;
    offeredMarksActual: number;
    attemptedMarksExpected: number;
    attemptedMarksActual: number;
    passed: boolean;
  }[];
}

export interface DifficultyAudit {
  easyPercentage: number;
  moderatePercentage: number;
  difficultPercentage: number;
  targetProfile: {
    easy: number;
    moderate: number;
    difficult: number;
  };
  passed: boolean;
  notes: string;
}

export interface LanguageIntegrityAudit {
  expectedLanguage: Language;
  detectedLanguage: string;
  bengaliScriptIntegrity: boolean; // deterministic script check
  noCorruptedUnicode: boolean; // deterministic glyph check
  mathematicalLocalizationEquivalence: 'verified' | 'not_yet_verified';
  passed: boolean;
  flaggedSlots: number[];
  notes: string;
}

export interface UniversalAssessmentAudit {
  passed: boolean;
  overallScore: number; // 0 - 100
  evaluatedRulesCount: number;
  passedRulesCount: number;
  warningRulesCount: number;
  failedRulesCount: number;
  results: RuleEvaluationResult[];
  duplicates: DuplicateMatch[];
  arithmetic: ArithmeticAudit;
  difficulty: DifficultyAudit;
  languageIntegrity: LanguageIntegrityAudit;
}

// ==========================================
// SUBJECT PROFILE TYPES
// ==========================================

export interface SubjectRuleEvaluationResult {
  ruleId: string;
  name: string;
  category: 'subject_profile';
  status: RuleStatus;
  passed: boolean;
  score: number; // 0 to 100
  summary: string;
  verificationStatus?:
    | 'verified'
    | 'not_yet_verified'
    | 'failed'
    | 'structure_passed'
    | 'structure_failed'
    | 'informational'
    | 'review_required';
  details?: string[];
  affectedSlotNumbers?: number[];
  recommendation?: string;
}

export interface SubjectProfileAudit {
  profileId: string;
  profileName: string;
  passed: boolean;
  overallScore: number;
  exerciseDerivationPercentage: number | null; // e.g. 80% or null if not yet proven
  exerciseDerivationTarget: number; // 80%
  exerciseCount: number;
  exerciseKnownCount: number;
  exerciseUnknownCount: number;
  exerciseDerivationStatus: 'compliant' | 'not_yet_verified' | 'failed';
  numericalValidationStatus: 'structure_passed' | 'structure_failed' | 'not_yet_verified';
  numericalStructureCheckPassed: boolean | null;
  mathematicalCorrectnessStatus: 'not_yet_verified' | 'verified' | 'failed';
  numericalValidationPassed?: boolean;
  structureCheckPassed: boolean;
  formulasAndUnitsPreserved: boolean | 'not_yet_verified';
  geometryConstructionsStatus: 'informational' | 'compliant' | 'not_yet_verified' | 'none_detected';
  geometryCount: number;
  connectedSubpartsStatus: 'structure_passed' | 'structure_failed' | 'not_yet_verified';
  connectedSubpartsSemanticStatus: 'review_required' | 'verified' | 'not_yet_verified';
  results: SubjectRuleEvaluationResult[];
  details: {
    exerciseSlots: number[];
    workedExampleSlots: number[];
    theorySlots: number[];
    unknownClassificationSlots: number[];
    numericalSlots: number[];
    geometrySlots: number[];
    subpartSlots: number[];
  };
}

export interface AssessmentValidationReport {
  timestamp: string;
  isReady: boolean;
  totalScore: number; // 0 to 100
  universalAudit: UniversalAssessmentAudit;
  subjectProfileAudit?: SubjectProfileAudit;
  criticalErrors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface BenchmarkSectionGroup {
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

export interface BenchmarkSection {
  id: string;
  name: string;
  description: string;
  marksPerQuestion: number;
  numberOfQuestions: number;
  totalSectionMarks: number;
  totalAttemptedMarks: number;
  totalOfferedMarks: number;
  groups?: BenchmarkSectionGroup[];
  questionsOffered?: number;
  questionsToAttempt?: number;
  questionType: QuestionType;
}

export interface SubjectProfile {
  id: string;
  name: string;
  targetClass: string;
  subject: string;
  description: string;

  // Benchmark rules
  exerciseDerivationTargetPercentage: number; // 80% for Class VI Math
  allowDiagramsAndPictures: boolean;
  allowGeometryConstructions: boolean;
  mandatoryNumericalValidation: boolean;
  preserveMathematicalFormulasAndUnits: boolean;
  allowConnectedSubparts: boolean; // e.g. 1+1

  // Benchmark blueprint preset
  benchmarkPreset: {
    presetId: string;
    presetName: string;
    totalAttemptedMarks: number; // 70
    sections: BenchmarkSection[];
  };

  // Evaluation hook
  evaluateSubjectRules: (
    paper: ClassVIExamPaper,
    slots: QuestionSlot[]
  ) => SubjectProfileAudit;
}
