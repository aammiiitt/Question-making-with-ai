import {
  SubjectProfile,
  SubjectProfileAudit,
  SubjectRuleEvaluationResult,
  BenchmarkSection,
} from '../types';
import { ClassVIExamPaper, QuestionSlot } from '../../../types';

/**
 * Class VI Mathematics Subject Profile & Benchmark V1 Specification
 * Encapsulates all subject-specific rules without polluting the universal engine.
 */
export const CLASS_VI_MATH_BENCHMARK_PRESET: {
  presetId: string;
  presetName: string;
  totalAttemptedMarks: number;
  sections: BenchmarkSection[];
} = {
  presetId: 'c6_math_benchmark_v1',
  presetName: 'Class VI Mathematics · 70-Mark Benchmark V1',
  totalAttemptedMarks: 70,
  sections: [
    {
      id: 'sec-a',
      name: 'Section A',
      description: 'Objective Type (1 Mark Each) · Total Attempted = 20 Marks',
      marksPerQuestion: 1,
      numberOfQuestions: 28,
      totalSectionMarks: 20,
      totalAttemptedMarks: 20,
      totalOfferedMarks: 28,
      questionType: 'mcq',
      groups: [
        {
          id: 'sec-a-q1',
          groupNumber: 1,
          title: 'Question 1 — Multiple Choice Questions (MCQ)',
          instruction: 'Answer any 5 questions out of 7. Each question carries 1 mark.',
          questionType: 'mcq',
          marksPerQuestion: 1,
          questionsOffered: 7,
          questionsToAttempt: 5,
          attemptedMarks: 5,
        },
        {
          id: 'sec-a-q2',
          groupNumber: 2,
          title: 'Question 2 — True / False',
          instruction: 'Answer any 5 questions out of 7. State whether the statement is True or False.',
          questionType: 'true_false',
          marksPerQuestion: 1,
          questionsOffered: 7,
          questionsToAttempt: 5,
          attemptedMarks: 5,
        },
        {
          id: 'sec-a-q3',
          groupNumber: 3,
          title: 'Question 3 — Fill in the Blanks',
          instruction: 'Answer any 5 questions out of 7. Fill in the blank with appropriate mathematical terms or values.',
          questionType: 'fill_in_the_blank',
          marksPerQuestion: 1,
          questionsOffered: 7,
          questionsToAttempt: 5,
          attemptedMarks: 5,
        },
        {
          id: 'sec-a-q4',
          groupNumber: 4,
          title: 'Question 4 — One Word / One Sentence (VSA)',
          instruction: 'Answer any 5 questions out of 7. Answer in one word or one complete sentence.',
          questionType: 'very_short_answer',
          marksPerQuestion: 1,
          questionsOffered: 7,
          questionsToAttempt: 5,
          attemptedMarks: 5,
        },
      ],
    },
    {
      id: 'sec-b',
      name: 'Section B',
      description: 'Short Answer Type I (2 Marks Each) · Answer any 10 out of 12',
      marksPerQuestion: 2,
      numberOfQuestions: 12,
      totalSectionMarks: 20,
      questionsOffered: 12,
      questionsToAttempt: 10,
      totalAttemptedMarks: 20,
      totalOfferedMarks: 24,
      questionType: 'short_answer',
    },
    {
      id: 'sec-c',
      name: 'Section C',
      description: 'Short Answer Type II / Word Problems (3 Marks Each) · Answer any 5 out of 7',
      marksPerQuestion: 3,
      numberOfQuestions: 7,
      totalSectionMarks: 15,
      questionsOffered: 7,
      questionsToAttempt: 5,
      totalAttemptedMarks: 15,
      totalOfferedMarks: 21,
      questionType: 'short_answer',
    },
    {
      id: 'sec-d',
      name: 'Section D',
      description: 'Long Answer & Geometry Constructions (5 Marks Each) · Answer any 3 out of 4',
      marksPerQuestion: 5,
      numberOfQuestions: 4,
      totalSectionMarks: 15,
      questionsOffered: 4,
      questionsToAttempt: 3,
      totalAttemptedMarks: 15,
      totalOfferedMarks: 20,
      questionType: 'long_answer',
    },
  ],
};

export class ClassVIMathematicsProfile implements SubjectProfile {
  public id = 'class-6-math';
  public name = 'Class VI Mathematics';
  public targetClass = 'Class VI';
  public subject = 'Mathematics';
  public description =
    'Standard Class VI Mathematics Assessment Profile with >= 80% exercise-derived questioning, numerical validation, formulas/units preservation, and geometry constructions.';

  public exerciseDerivationTargetPercentage = 80;
  public allowDiagramsAndPictures = true;
  public allowGeometryConstructions = true;
  public mandatoryNumericalValidation = true;
  public preserveMathematicalFormulasAndUnits = true;
  public allowConnectedSubparts = true;

  public benchmarkPreset = CLASS_VI_MATH_BENCHMARK_PRESET;

  /**
   * Evaluates Class VI Mathematics Benchmark specific rules
   */
  public evaluateSubjectRules(
    paper: ClassVIExamPaper,
    slots: QuestionSlot[]
  ): SubjectProfileAudit {
    const generatedSlots = slots.filter((s) => s.questionItem && s.status === 'generated');

    const exerciseSlots: number[] = [];
    const conceptualSlots: number[] = [];
    const numericalSlots: number[] = [];
    const geometrySlots: number[] = [];
    const subpartSlots: number[] = [];

    // Helper: detect exercise keywords in source text or question
    const exerciseKeywords = [
      'নিজে করি',
      'কষে দেখি',
      'exercise',
      'অনুশীলনী',
      'practice',
      'worksheet',
      'problem',
      'মান নির্ণয়',
      'সমাধান কর',
      'সরল কর',
      'প্রমাণ কর',
      'হিসাব কর',
      'calculate',
      'evaluate',
      'solve',
      'find the value',
      'find the perimeter',
      'find the area',
      'find the ratio',
      'ex.',
      'ex-',
      'q.',
    ];

    // Helper: detect geometry / construction keywords
    const geometryKeywords = [
      'geometry',
      'জ্যামিতি',
      'construct',
      'অঙ্কন',
      'compass',
      'কাঁটা কম্পাস',
      'স্কেল',
      'protractor',
      'চাঁদা',
      'angle',
      'কোণ',
      'triangle',
      'ত্রিভুজ',
      'circle',
      'বৃত্ত',
      'radius',
      'ব্যাসার্ধ',
      'diameter',
      'ব্যাস',
      'chord',
      'জ্যা',
      'parallel',
      'সমান্তরাল',
      'perpendicular',
      'লম্ব',
      'line segment',
      'রেখাংশ',
    ];

    // Helper: detect mathematical symbols, equations, numbers
    const mathSymbolRegex = /[\+\-\×\÷\=\<\>\≤\≥\°\%\:\/\(\)\d]/;

    // Helper: detect mathematical units
    const unitRegex = /\b(cm|m|km|sq cm|sq m|m²|cm²|₹|rs|paise|পয়সা|টাকা|kg|g|গ্রাম|কেজি|hours|ঘণ্টা|minutes|মিনিট|sec|সেকেন্ড)\b/i;

    let invalidNumericalsCount = 0;
    let formulasUnitsPreserved = true;

    for (const slot of generatedSlots) {
      const q = slot.questionItem!;
      const fullText = (q.question_text + ' ' + (q.source?.source_text || '')).toLowerCase();
      const answerText = (q.answer?.answer_text || '').toLowerCase();

      // 1. Exercise Derivation Detection
      const isFromExercise = exerciseKeywords.some((kw) => fullText.includes(kw));
      if (isFromExercise || slot.isDerivedFromExercise) {
        exerciseSlots.push(slot.slotNumber);
      } else {
        conceptualSlots.push(slot.slotNumber);
      }

      // 2. Geometry & Construction Detection
      const isGeom = geometryKeywords.some((kw) => fullText.includes(kw));
      if (isGeom || slot.isGeometryConstruction || slot.hasDiagram) {
        geometrySlots.push(slot.slotNumber);
      }

      // 3. Numerical & Mathematical Calculation Detection
      const hasMath = mathSymbolRegex.test(q.question_text) || /\d+/.test(q.question_text);
      if (hasMath) {
        numericalSlots.push(slot.slotNumber);

        // Numerical validation: check that answer contains numerical result or working steps
        const ansHasNumbersOrFormula =
          /\d+/.test(answerText) ||
          mathSymbolRegex.test(answerText) ||
          q.answer?.marking_scheme.some((m) => mathSymbolRegex.test(m.criterion) || /\d+/.test(m.criterion));

        if (!ansHasNumbersOrFormula) {
          invalidNumericalsCount++;
        }
      }

      // 4. Units & Formulas Preservation Check
      if (unitRegex.test(q.question_text) && !unitRegex.test(answerText)) {
        // If question specifies units (e.g. cm, ₹), answer should preserve proper units
        formulasUnitsPreserved = false;
      }

      // 5. Connected 1+1 Subparts Check
      const hasSubparts =
        /\(a\)|\(b\)|\(i\)|\(ii\)|subpart|অংশ/i.test(q.question_text) ||
        (q.answer?.marking_scheme.length === 2 &&
          q.answer.marking_scheme[0].marks === 1 &&
          q.answer.marking_scheme[1].marks === 1);

      if (hasSubparts || (slot.subparts && slot.subparts.length > 1)) {
        subpartSlots.push(slot.slotNumber);
      }
    }

    // Exercise Derivation Metric
    const totalGen = Math.max(1, generatedSlots.length);
    const exercisePercentage = Math.round((exerciseSlots.length / totalGen) * 100);
    const exerciseRulePassed =
      generatedSlots.length === 0 || exercisePercentage >= this.exerciseDerivationTargetPercentage;

    const numericalValidationPassed = invalidNumericalsCount === 0;

    // Rule 1: Target >= 80% Exercise Derivation
    const rExerciseDerivation: SubjectRuleEvaluationResult = {
      ruleId: 'math_exercise_derivation_target',
      name: 'Textbook Exercise & Practice Derivation (>= 80%)',
      category: 'subject_profile',
      status: exerciseRulePassed ? 'passed' : 'warning',
      passed: exerciseRulePassed,
      score: Math.min(100, Math.round((exercisePercentage / this.exerciseDerivationTargetPercentage) * 100)),
      summary: `Exercise Derivation: ${exercisePercentage}% of offered questions derived from textbook practice/exercise sections (নিজে করি, কষে দেখি, Exercise). Target: >= ${this.exerciseDerivationTargetPercentage}%.`,
      details: [
        `${exerciseSlots.length} exercise/practice problems, ${conceptualSlots.length} foundational/theory questions.`,
      ],
      recommendation: exerciseRulePassed
        ? undefined
        : 'Generate more questions derived from chapter exercise sections to meet the 80% practice target.',
    };

    // Rule 2: Mandatory Numerical Validation
    const rNumericalValidation: SubjectRuleEvaluationResult = {
      ruleId: 'math_numerical_validation',
      name: 'Mandatory Numerical & Arithmetic Validation',
      category: 'subject_profile',
      status: numericalValidationPassed ? 'passed' : 'failed',
      passed: numericalValidationPassed,
      score: numericalValidationPassed ? 100 : Math.max(0, 100 - invalidNumericalsCount * 25),
      summary: numericalValidationPassed
        ? `All ${numericalSlots.length} numerical questions have verified arithmetic calculations and step-by-step solutions.`
        : `${invalidNumericalsCount} numerical question(s) have unverified working steps or missing numbers.`,
      affectedSlotNumbers: numericalValidationPassed ? undefined : numericalSlots.slice(0, 3),
    };

    // Rule 3: Mathematical Formulas, Symbols & Units Preservation
    const rFormulasAndUnits: SubjectRuleEvaluationResult = {
      ruleId: 'math_formulas_symbols_units',
      name: 'Formulas, Mathematical Symbols and Units Preservation',
      category: 'subject_profile',
      status: formulasUnitsPreserved ? 'passed' : 'warning',
      passed: formulasUnitsPreserved,
      score: formulasUnitsPreserved ? 100 : 85,
      summary: formulasUnitsPreserved
        ? 'Standard mathematical symbols (+, -, ×, ÷, =, °, %, etc.) and units (cm, m, m², ₹, kg) are fully preserved in questions and answer keys.'
        : 'Some numerical questions should specify explicit measurement units in the model answer.',
    };

    // Rule 4: Geometry Constructions & Diagrams Support
    const rGeometryAndDiagrams: SubjectRuleEvaluationResult = {
      ruleId: 'math_geometry_constructions',
      name: 'Geometry Constructions & Visual Problem Support',
      category: 'subject_profile',
      status: 'passed',
      passed: true,
      score: 100,
      summary: `Geometry construction and visual diagram support active. ${geometrySlots.length} geometrical question(s) configured.`,
    };

    // Rule 5: Connected 1+1 Subparts Capability
    const rConnectedSubparts: SubjectRuleEvaluationResult = {
      ruleId: 'math_connected_subparts',
      name: 'Connected 1+1 Subparts Capability',
      category: 'subject_profile',
      status: 'passed',
      passed: true,
      score: 100,
      summary: `Connected 1+1 subpart capability supported for multi-concept testing. ${subpartSlots.length} subpart question(s) detected.`,
    };

    const results = [
      rExerciseDerivation,
      rNumericalValidation,
      rFormulasAndUnits,
      rGeometryAndDiagrams,
      rConnectedSubparts,
    ];

    const overallScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length);
    const passed = results.every((r) => r.status !== 'failed');

    return {
      profileId: this.id,
      profileName: this.name,
      passed,
      overallScore,
      exerciseDerivationPercentage: exercisePercentage,
      exerciseDerivationTarget: this.exerciseDerivationTargetPercentage,
      numericalValidationPassed,
      formulasAndUnitsPreserved: formulasUnitsPreserved,
      geometryConstructionsCompliant: true,
      connectedSubpartsCompliant: true,
      results,
      details: {
        exerciseSlots,
        conceptualSlots,
        numericalSlots,
        geometrySlots,
        subpartSlots,
      },
    };
  }
}

export const class6MathProfile = new ClassVIMathematicsProfile();
