import {
  SubjectProfile,
  SubjectProfileAudit,
  SubjectRuleEvaluationResult,
  BenchmarkSection,
  RuleStatus,
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
  totalOfferedMarks: number;
  totalOfferedQuestions: number;
  totalAttemptedQuestions: number;
  sections: BenchmarkSection[];
} = {
  presetId: 'c6_math_benchmark_v1',
  presetName: 'Class VI Mathematics · 70-Mark Benchmark V1',
  totalAttemptedMarks: 70,
  totalOfferedMarks: 102,
  totalOfferedQuestions: 52,
  totalAttemptedQuestions: 37,
  sections: [
    {
      id: 'sec-a',
      name: 'Section A',
      description: 'Objective Type (1 Mark Each) · Answer 20 out of 28 (Attempted = 20 Marks, Offered = 28 Marks)',
      marksPerQuestion: 1,
      numberOfQuestions: 28,
      totalSectionMarks: 20,
      totalAttemptedMarks: 20,
      totalOfferedMarks: 28,
      questionsOffered: 28,
      questionsToAttempt: 20,
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
      description: 'Short Answer Type I (2 Marks Each) · Answer any 7 out of 9 (Attempted = 14 Marks, Offered = 18 Marks)',
      marksPerQuestion: 2,
      numberOfQuestions: 9,
      totalSectionMarks: 14,
      questionsOffered: 9,
      questionsToAttempt: 7,
      totalAttemptedMarks: 14,
      totalOfferedMarks: 18,
      questionType: 'short_answer',
    },
    {
      id: 'sec-c',
      name: 'Section C',
      description: 'Short Answer Type II / Word Problems (3 Marks Each) · Answer any 6 out of 8 (Attempted = 18 Marks, Offered = 24 Marks)',
      marksPerQuestion: 3,
      numberOfQuestions: 8,
      totalSectionMarks: 18,
      questionsOffered: 8,
      questionsToAttempt: 6,
      totalAttemptedMarks: 18,
      totalOfferedMarks: 24,
      questionType: 'short_answer',
    },
    {
      id: 'sec-d',
      name: 'Section D',
      description: 'Long Answer & Geometry Constructions (4 Marks Each) · Answer any 3 out of 5 (Attempted = 12 Marks, Offered = 20 Marks)',
      marksPerQuestion: 4,
      numberOfQuestions: 5,
      totalSectionMarks: 12,
      questionsOffered: 5,
      questionsToAttempt: 3,
      totalAttemptedMarks: 12,
      totalOfferedMarks: 20,
      questionType: 'long_answer',
    },
    {
      id: 'sec-q8',
      name: 'Question 8',
      description: 'Comprehensive / Advanced Problem (6 Marks Each) · Answer any 1 out of 2 (Attempted = 6 Marks, Offered = 12 Marks)',
      marksPerQuestion: 6,
      numberOfQuestions: 2,
      totalSectionMarks: 6,
      questionsOffered: 2,
      questionsToAttempt: 1,
      totalAttemptedMarks: 6,
      totalOfferedMarks: 12,
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

    let knownSourceCount = 0;
    let exerciseCount = 0;
    let unknownCount = 0;

    for (const slot of generatedSlots) {
      const q = slot.questionItem!;
      const fullText = (q.question_text + ' ' + (q.source?.source_text || '')).toLowerCase();
      const answerText = (q.answer?.answer_text || '').toLowerCase();

      // Requirement 2 & 3: Source Content Classification
      // Classification MUST come from actual supporting source, NOT from question text keywords or pre-tagging
      const rawContentType = q.source?.content_type || slot.sourceContentType || 'unknown';
      const isKnown = rawContentType !== 'unknown';
      const isExercise = rawContentType === 'exercise';

      if (isKnown) {
        knownSourceCount++;
        if (isExercise) {
          exerciseCount++;
          exerciseSlots.push(slot.slotNumber);
        } else {
          conceptualSlots.push(slot.slotNumber);
        }
      } else {
        unknownCount++;
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

    // Requirement 3: Exercise Benchmark Metric
    // knownSourceCount = questions whose source.content_type !== 'unknown'
    // exerciseCount = questions whose source.content_type === 'exercise'
    // unknownCount = questions whose source.content_type === 'unknown' or missing classification
    const hasSufficientEvidence = generatedSlots.length > 0 && knownSourceCount >= 5;
    const exercisePercentage = knownSourceCount > 0 ? Math.round((exerciseCount / knownSourceCount) * 100) : 0;

    let exerciseDerivationStatus: 'compliant' | 'not_yet_verified' | 'failed' = 'not_yet_verified';
    let exerciseRuleStatus: RuleStatus = 'warning';
    let exerciseRulePassed = false;
    let exerciseSummary = '';

    if (!hasSufficientEvidence) {
      exerciseDerivationStatus = 'not_yet_verified';
      exerciseRuleStatus = 'warning';
      exerciseRulePassed = false;
      exerciseSummary = generatedSlots.length === 0
        ? 'Exercise Derivation: NOT YET VERIFIED (no generated questions).'
        : `NOT YET VERIFIED: Insufficient classified source evidence (${knownSourceCount} known source passages). Target: >= ${this.exerciseDerivationTargetPercentage}%.`;
    } else if (exercisePercentage >= this.exerciseDerivationTargetPercentage) {
      exerciseDerivationStatus = 'compliant';
      exerciseRuleStatus = 'passed';
      exerciseRulePassed = true;
      exerciseSummary = `COMPLIANT: ${exercisePercentage}% of verified sources derived from textbook exercises (${exerciseCount}/${knownSourceCount} known sources). Target: >= ${this.exerciseDerivationTargetPercentage}%.`;
    } else {
      exerciseDerivationStatus = 'failed';
      exerciseRuleStatus = 'failed';
      exerciseRulePassed = false;
      exerciseSummary = `FAILED / NEEDS IMPROVEMENT: ${exercisePercentage}% of verified sources derived from textbook exercises (${exerciseCount}/${knownSourceCount} known sources). Target: >= ${this.exerciseDerivationTargetPercentage}%.`;
    }

    // Rule 1: Target >= 80% Exercise Derivation
    const rExerciseDerivation: SubjectRuleEvaluationResult = {
      ruleId: 'math_exercise_derivation_target',
      name: 'Textbook Exercise & Practice Derivation (>= 80%)',
      category: 'subject_profile',
      status: exerciseRuleStatus,
      passed: exerciseRulePassed,
      verificationStatus: exerciseDerivationStatus === 'compliant' ? 'verified' : exerciseDerivationStatus,
      score: hasSufficientEvidence
        ? Math.min(100, Math.round((exercisePercentage / this.exerciseDerivationTargetPercentage) * 100))
        : 0,
      summary: exerciseSummary,
      details: [
        `Exercise-derived: ${exerciseCount}`,
        `Known classified sources: ${knownSourceCount}`,
        `Unknown source classification: ${unknownCount}`,
        `Exercise percentage among known sources: ${hasSufficientEvidence ? `${exercisePercentage}%` : 'N/A (Not yet verified)'}`,
        `Target: >= ${this.exerciseDerivationTargetPercentage}%`,
      ],
      recommendation: exerciseRulePassed
        ? undefined
        : hasSufficientEvidence
        ? 'Generate or retrieve more questions derived from chapter exercise/practice sections (নিজে করি, কষে দেখি) to achieve >=80%.'
        : 'Generate examination slots to verify source classifications against authentic textbook pages.',
    };

    // Point 1: Numerical Structure Check vs Mathematical Correctness
    // Presence of numbers/formulas is ONLY a structural check, NOT independent proof of arithmetic correctness.
    const isNumericalEmpty = generatedSlots.length === 0;
    const numericalStructurePassed = !isNumericalEmpty && invalidNumericalsCount === 0;

    // Rule 2A: Numerical Structure Check (PASS / FAIL)
    const rNumericalStructure: SubjectRuleEvaluationResult = {
      ruleId: 'math_numerical_validation',
      name: 'Numerical Structure Check',
      category: 'subject_profile',
      status: isNumericalEmpty ? 'warning' : numericalStructurePassed ? 'passed' : 'failed',
      passed: numericalStructurePassed,
      verificationStatus: isNumericalEmpty
        ? 'not_yet_verified'
        : numericalStructurePassed
        ? 'structure_passed'
        : 'structure_failed',
      score: isNumericalEmpty ? 0 : numericalStructurePassed ? 100 : Math.max(0, 100 - invalidNumericalsCount * 25),
      summary: isNumericalEmpty
        ? 'Numerical Structure Check: NOT YET VERIFIED (no generated questions).'
        : `Numerical Structure Check: ${numericalStructurePassed ? 'PASS' : 'FAIL'} (${numericalSlots.length} numerical question(s) structurally evaluated).`,
      details: isNumericalEmpty
        ? ['Awaiting question generation to evaluate numerical structure.']
        : numericalStructurePassed
        ? ['Mathematical expressions, model answers, and step-by-step marking rubrics are structurally present where expected.']
        : [`${invalidNumericalsCount} numerical question(s) have unverified working steps or missing numbers in rubric.`],
      affectedSlotNumbers: isNumericalEmpty || numericalStructurePassed ? undefined : numericalSlots.slice(0, 3),
      recommendation: numericalStructurePassed
        ? undefined
        : 'Ensure multi-mark numerical questions include intermediate working steps and point allocations.',
    };

    // Rule 2B: Mathematical Correctness (NOT YET VERIFIED)
    const rMathematicalCorrectness: SubjectRuleEvaluationResult = {
      ruleId: 'math_correctness_verification',
      name: 'Mathematical Correctness',
      category: 'subject_profile',
      status: 'warning',
      passed: false,
      verificationStatus: 'not_yet_verified',
      score: 0,
      summary: 'Mathematical Correctness: NOT YET VERIFIED',
      details: [
        'Independent arithmetic verification is NOT YET IMPLEMENTED.',
        'Presence of numbers and formulas confirms structural formatting only; independent calculation proof is pending teacher review.',
      ],
      recommendation: 'Teacher manual verification of arithmetic calculations is recommended.',
    };

    // Rule 3: Mathematical Formulas, Symbols & Units Preservation
    const rFormulasAndUnits: SubjectRuleEvaluationResult = {
      ruleId: 'math_formulas_symbols_units',
      name: 'Formulas, Mathematical Symbols and Units Preservation',
      category: 'subject_profile',
      status: isNumericalEmpty ? 'warning' : formulasUnitsPreserved ? 'passed' : 'warning',
      passed: isNumericalEmpty ? false : formulasUnitsPreserved,
      verificationStatus: isNumericalEmpty ? 'not_yet_verified' : formulasUnitsPreserved ? 'structure_passed' : 'structure_failed',
      score: isNumericalEmpty ? 0 : formulasUnitsPreserved ? 100 : 85,
      summary: isNumericalEmpty
        ? 'Formulas and Units Preservation: NOT YET VERIFIED (no generated questions).'
        : formulasUnitsPreserved
        ? 'Formulas and Units Preservation: PASS'
        : 'Formulas and Units Preservation: NOTICE (some numerical questions should specify explicit measurement units).',
      details: [
        'Checks preservation of standard mathematical symbols (+, -, ×, ÷, =, °, %, etc.) and units (cm, m, m², ₹, kg).',
      ],
    };

    // Point 3: Geometry Status — INFORMATIONAL ONLY
    // Do not award a quality PASS simply for feature availability.
    const rGeometryAndDiagrams: SubjectRuleEvaluationResult = {
      ruleId: 'math_geometry_constructions',
      name: 'Geometry & Diagram Content Detection',
      category: 'subject_profile',
      status: 'informational',
      passed: false,
      verificationStatus: 'informational',
      score: 0,
      summary: `Geometry / diagram questions detected: ${geometrySlots.length}`,
      details: [
        `Found ${geometrySlots.length} question(s) involving geometry constructions, angles, shapes, or diagrams.`,
        'INFORMATIONAL: Subject benchmark does not mandate a fixed quota; detection tracks presence only.',
      ],
    };

    // Point 4: Connected 1+1 Subparts Check
    // Benchmark requires EXACTLY TWO Section-B offered slots with requiresConnectedSubparts = true.
    const subpartConfiguredSlots = (paper.slots || []).filter(
      (s) => (s.sectionId === 'sec-b' || s.sectionName?.includes('Section B')) && s.requiresConnectedSubparts
    );
    const configuredCount = subpartConfiguredSlots.length;
    const isConfigCountValid = configuredCount === 2;

    const subpartSlotNumbers = subpartConfiguredSlots.map((s) => s.slotNumber);
    const generatedTargetSlots = generatedSlots.filter((s) => subpartSlotNumbers.includes(s.slotNumber));

    let subpartStructurePassed = isConfigCountValid;
    let generatedSubpartValidCount = 0;
    const subpartDetails: string[] = [
      `Section B configured 1+1 subpart slots: ${configuredCount} (Benchmark target: exactly 2). Configuration: ${isConfigCountValid ? 'PASS' : 'FAIL'}.`,
    ];

    if (generatedTargetSlots.length === 0) {
      subpartDetails.push('Connected 1+1 structure: NOT YET VERIFIED (slots not yet generated).');
      subpartDetails.push('Semantic connection: NOT YET VERIFIED.');
    } else {
      for (const slot of generatedTargetSlots) {
        const q = slot.questionItem;
        if (!q) continue;

        const is2Marks = slot.marks === 2 && q.marks === 2;
        const hasTwoSubparts =
          (slot.subparts && slot.subparts.length === 2) ||
          (/\(a\)[\s\S]*\(b\)/i.test(q.question_text)) ||
          (/\(i\)[\s\S]*\(ii\)/i.test(q.question_text));

        const ms = q.answer?.marking_scheme;
        const hasTwo1MarkCriteria =
          Array.isArray(ms) &&
          ms.length === 2 &&
          Number(ms[0].marks) === 1 &&
          Number(ms[1].marks) === 1;

        if (is2Marks && hasTwoSubparts && hasTwo1MarkCriteria) {
          generatedSubpartValidCount++;
          subpartDetails.push(`Slot #${slot.slotNumber}: 2 marks, 2 subparts, 1+1 marking rubric structurally verified.`);
        } else {
          subpartStructurePassed = false;
          subpartDetails.push(
            `Slot #${slot.slotNumber}: Structural discrepancy (2 marks: ${is2Marks ? 'yes' : 'no'}, 2 subparts: ${hasTwoSubparts ? 'yes' : 'no'}, 1+1 rubric criteria: ${hasTwo1MarkCriteria ? 'yes' : 'no'}).`
          );
        }
      }

      subpartDetails.push('Semantic connection: TEACHER / AI REVIEW REQUIRED');
    }

    const isSubpartDone = generatedTargetSlots.length > 0 && generatedTargetSlots.length === configuredCount && isConfigCountValid;
    const subpartOverallPassed = isSubpartDone && subpartStructurePassed && generatedSubpartValidCount === 2;

    const rConnectedSubparts: SubjectRuleEvaluationResult = {
      ruleId: 'math_connected_subparts',
      name: 'Connected 1+1 Subparts (Section B)',
      category: 'subject_profile',
      status: !isSubpartDone
        ? 'warning'
        : subpartOverallPassed
        ? 'passed'
        : 'failed',
      passed: subpartOverallPassed,
      verificationStatus: !isSubpartDone
        ? 'not_yet_verified'
        : subpartOverallPassed
        ? 'structure_passed'
        : 'structure_failed',
      score: !isSubpartDone ? 0 : subpartOverallPassed ? 90 : 30,
      summary: !isSubpartDone
        ? (generatedSlots.length === 0
            ? 'Connected 1+1 structure: NOT YET VERIFIED (no generated questions). Semantic connection: NOT YET VERIFIED'
            : `Connected 1+1 structure: NOT YET VERIFIED (${generatedTargetSlots.length}/${configuredCount} generated). Semantic connection: NOT YET VERIFIED`)
        : subpartOverallPassed
        ? 'Connected 1+1 structure: PASS · Semantic connection: TEACHER / AI REVIEW REQUIRED'
        : 'Connected 1+1 structure: FAIL · Semantic connection: TEACHER / AI REVIEW REQUIRED',
      details: subpartDetails,
      recommendation: 'Verify that both 1-mark subparts in Section B belong to the same connected topic.',
    };

    const results = [
      rExerciseDerivation,
      rNumericalStructure,
      rMathematicalCorrectness,
      rFormulasAndUnits,
      rGeometryAndDiagrams,
      rConnectedSubparts,
    ];

    const nonInfoResults = results.filter((r) => r.status !== 'informational');
    const overallScore = Math.round(
      nonInfoResults.reduce((acc, r) => acc + r.score, 0) / Math.max(1, nonInfoResults.length)
    );
    const passed = results.every((r) => r.status !== 'failed');

    return {
      profileId: this.id,
      profileName: this.name,
      passed:
        generatedSlots.length > 0 &&
        passed &&
        exerciseDerivationStatus === 'compliant' &&
        numericalStructurePassed &&
        subpartOverallPassed,
      overallScore: generatedSlots.length === 0 ? 0 : overallScore,
      exerciseDerivationPercentage: hasSufficientEvidence ? exercisePercentage : null,
      exerciseDerivationTarget: this.exerciseDerivationTargetPercentage,
      exerciseCount,
      exerciseKnownCount: knownSourceCount,
      exerciseUnknownCount: unknownCount,
      exerciseDerivationStatus,
      numericalValidationStatus: isNumericalEmpty
        ? 'not_yet_verified'
        : numericalStructurePassed
        ? 'structure_passed'
        : 'structure_failed',
      numericalStructureCheckPassed: isNumericalEmpty ? null : numericalStructurePassed,
      mathematicalCorrectnessStatus: 'not_yet_verified',
      numericalValidationPassed: isNumericalEmpty ? undefined : numericalStructurePassed,
      structureCheckPassed: isConfigCountValid,
      formulasAndUnitsPreserved: isNumericalEmpty ? 'not_yet_verified' : formulasUnitsPreserved,
      geometryConstructionsStatus: 'informational',
      geometryCount: geometrySlots.length,
      connectedSubpartsStatus: !isSubpartDone
        ? 'not_yet_verified'
        : subpartOverallPassed
        ? 'structure_passed'
        : 'structure_failed',
      connectedSubpartsSemanticStatus: generatedSlots.length === 0 ? 'not_yet_verified' : 'review_required',
      results,
      details: {
        exerciseSlots,
        workedExampleSlots: [],
        theorySlots: conceptualSlots,
        unknownClassificationSlots: generatedSlots
          .filter((s) => (s.questionItem?.source?.content_type || s.sourceContentType) === 'unknown')
          .map((s) => s.slotNumber),
        numericalSlots,
        geometrySlots,
        subpartSlots,
      },
    };
  }
}

export const class6MathProfile = new ClassVIMathematicsProfile();
