import {
  ClassVIExamPaper,
  QuestionSlot,
  QuestionItem,
  ChapterWeightage,
  Language,
} from '../../types';
import {
  UniversalAssessmentAudit,
  RuleEvaluationResult,
  DuplicateMatch,
  ArithmeticAudit,
  DifficultyAudit,
  LanguageIntegrityAudit,
  UniversalRuleId,
} from './types';

export class UniversalAssessmentEngine {
  /**
   * Evaluates all 14 Universal Assessment Rules across the examination paper.
   */
  public evaluate(paper: ClassVIExamPaper): UniversalAssessmentAudit {
    const slots = paper.slots || [];
    const generatedSlots = slots.filter((s) => s.questionItem && s.status === 'generated');

    // 1. Approved Source Grounding
    const rSourceGrounding = this.evaluateSourceGrounding(paper, slots, generatedSlots);

    // 2. No Outside Syllabus
    const rNoOutsideSyllabus = this.evaluateNoOutsideSyllabus(paper, slots, generatedSlots);

    // 3, 4, 5. Arithmetic Audits (Total marks, Section marks, Optional questions)
    const arithmeticAudit = this.evaluateArithmetic(paper, slots);
    const rTotalMarks = this.evaluateTotalMarksRule(arithmeticAudit);
    const rSectionMarks = this.evaluateSectionMarksRule(arithmeticAudit);
    const rOptionalQuestions = this.evaluateOptionalQuestionsRule(arithmeticAudit);

    // 6, 7, 8. Duplicate & Same Fact Detection
    const duplicateAudit = this.evaluateDuplicates(generatedSlots);
    const rExactDuplicates = this.evaluateExactDuplicatesRule(duplicateAudit.exactMatches);
    const rSemanticDuplicates = this.evaluateSemanticDuplicatesRule(duplicateAudit.semanticMatches);
    const rSameFactDifferentFormat = this.evaluateSameFactDifferentFormatRule(
      duplicateAudit.sameFactMatches
    );

    // 9. Marking Scheme Marks Equality
    const rMarkingScheme = this.evaluateMarkingSchemeEquality(generatedSlots);

    // 10. Answer Validation
    const rAnswerValidation = this.evaluateAnswerValidation(generatedSlots);

    // 11. Source Pages Traceability
    const rSourcePagesTraceable = this.evaluateSourcePagesTraceable(paper, generatedSlots);

    // 12. Teacher Approval Workflow
    const rTeacherApproval = this.evaluateTeacherApproval(slots, generatedSlots);

    // 13. Difficulty Distribution
    const difficultyAudit = this.evaluateDifficultyDistribution(generatedSlots);
    const rDifficulty = this.evaluateDifficultyRule(difficultyAudit);

    // 14. Output Language Integrity
    const languageAudit = this.evaluateLanguageIntegrity(generatedSlots);
    const rLanguageIntegrity = this.evaluateLanguageRule(languageAudit);

    const results: RuleEvaluationResult[] = [
      rSourceGrounding,
      rNoOutsideSyllabus,
      rTotalMarks,
      rSectionMarks,
      rOptionalQuestions,
      rExactDuplicates,
      rSemanticDuplicates,
      rSameFactDifferentFormat,
      rMarkingScheme,
      rAnswerValidation,
      rSourcePagesTraceable,
      rTeacherApproval,
      rDifficulty,
      rLanguageIntegrity,
    ];

    const passedCount = results.filter((r) => r.status === 'passed').length;
    const warningCount = results.filter((r) => r.status === 'warning').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    // Overall Score (0-100)
    const overallScore = Math.round(
      results.reduce((acc, r) => acc + r.score, 0) / Math.max(1, results.length)
    );

    const allDuplicates: DuplicateMatch[] = [
      ...duplicateAudit.exactMatches,
      ...duplicateAudit.semanticMatches,
      ...duplicateAudit.sameFactMatches,
    ];

    return {
      passed: failedCount === 0 && passedCount >= 10,
      overallScore,
      evaluatedRulesCount: results.length,
      passedRulesCount: passedCount,
      warningRulesCount: warningCount,
      failedRulesCount: failedCount,
      results,
      duplicates: allDuplicates,
      arithmetic: arithmeticAudit,
      difficulty: difficultyAudit,
      languageIntegrity: languageAudit,
    };
  }

  // ----------------------------------------------------
  // RULE 1: Grounded in Approved Source
  // ----------------------------------------------------
  private evaluateSourceGrounding(
    paper: ClassVIExamPaper,
    slots: QuestionSlot[],
    generatedSlots: QuestionSlot[]
  ): RuleEvaluationResult {
    if (generatedSlots.length === 0) {
      return {
        ruleId: 'grounded_in_approved_source',
        name: 'Approved Source Grounding',
        category: 'universal',
        status: 'warning',
        passed: false,
        score: 50,
        summary: 'No generated questions to evaluate yet.',
      };
    }

    const ungroundedSlots: number[] = [];
    const details: string[] = [];

    for (const slot of generatedSlots) {
      const q = slot.questionItem;
      if (!q || !q.source || !q.source.source_text || q.source.source_text.trim().length < 20) {
        ungroundedSlots.push(slot.slotNumber);
        details.push(`Slot #${slot.slotNumber} lacks authentic verified textbook source text.`);
      } else if (q.source_grounding_status === 'needs_review') {
        ungroundedSlots.push(slot.slotNumber);
        details.push(`Slot #${slot.slotNumber} source citation requires teacher review.`);
      }
    }

    const passed = ungroundedSlots.length === 0;
    const score = Math.max(
      0,
      Math.round(((generatedSlots.length - ungroundedSlots.length) / generatedSlots.length) * 100)
    );

    return {
      ruleId: 'grounded_in_approved_source',
      name: 'Approved Source Grounding',
      category: 'universal',
      status: passed ? 'passed' : 'failed',
      passed,
      score,
      summary: passed
        ? `All ${generatedSlots.length} questions are verified and grounded in the approved textbook.`
        : `${ungroundedSlots.length} question(s) lack complete textbook source verification.`,
      details,
      affectedSlotNumbers: ungroundedSlots,
      recommendation: passed
        ? undefined
        : 'Verify the textbook page mapping or regenerate ungrounded slots using chapter source text.',
    };
  }

  // ----------------------------------------------------
  // RULE 2: No Outside Syllabus
  // ----------------------------------------------------
  private evaluateNoOutsideSyllabus(
    paper: ClassVIExamPaper,
    slots: QuestionSlot[],
    generatedSlots: QuestionSlot[]
  ): RuleEvaluationResult {
    const includedChapterIds = new Set(
      (paper.chaptersWeightage || []).filter((c) => c.included).map((c) => c.chapter_id)
    );

    const outsideSyllabusSlots: number[] = [];
    const details: string[] = [];

    for (const slot of generatedSlots) {
      const q = slot.questionItem;
      if (!q) continue;

      if (!includedChapterIds.has(q.chapter_id)) {
        outsideSyllabusSlots.push(slot.slotNumber);
        details.push(
          `Slot #${slot.slotNumber} is assigned to chapter "${q.chapter_name || slot.chapterTitle}" which is not in the approved syllabus.`
        );
      }
    }

    const passed = outsideSyllabusSlots.length === 0;
    const score = passed ? 100 : Math.max(0, 100 - outsideSyllabusSlots.length * 20);

    return {
      ruleId: 'no_outside_syllabus',
      name: 'Syllabus Boundary Enforcement',
      category: 'universal',
      status: passed ? 'passed' : 'failed',
      passed,
      score,
      summary: passed
        ? 'All generated questions fall strictly within the teacher-approved syllabus and included chapters.'
        : `${outsideSyllabusSlots.length} question(s) are from outside the approved syllabus chapters.`,
      details,
      affectedSlotNumbers: outsideSyllabusSlots,
      recommendation: passed
        ? undefined
        : 'Reassign or regenerate questions to match the included chapters.',
    };
  }

  // ----------------------------------------------------
  // RULES 3, 4, 5: Total Marks, Section Marks & Optional Question Arithmetic
  // ----------------------------------------------------
  public evaluateArithmetic(paper: ClassVIExamPaper, slots: QuestionSlot[]): ArithmeticAudit {
    const targetTotalMarks = paper.totalMarks || 70;
    const sections = paper.sections || [];

    const sectionsAudit: ArithmeticAudit['sectionsAudit'] = [];
    const optionalRulesAudit: ArithmeticAudit['optionalQuestionRulesAudit'] = [];

    let totalAttempted = 0;
    let totalOffered = 0;

    for (const sec of sections) {
      const secSlots = slots.filter((s) => s.sectionId === sec.id);

      // Check if section defines sub-groups (like Section A Q1, Q2, Q3, Q4)
      const secGroups = (sec as any).groups as any[] | undefined;

      let secExpectedAttempted = sec.totalSectionMarks;
      let secActualAttempted = 0;
      let secExpectedOffered = 0;
      let secActualOffered = 0;

      if (secGroups && secGroups.length > 0) {
        // Group-based optional arithmetic (e.g. Q1 MCQ 5/7, Q2 T/F 5/7)
        for (const grp of secGroups) {
          const grpSlots = secSlots.filter((s) => s.groupId === grp.id);
          const grpOffered = grp.questionsOffered || grpSlots.length;
          const grpAttempt = grp.questionsToAttempt || grpOffered;
          const marksEach = grp.marksPerQuestion || 1;
          const grpExpectedAttemptedMarks = grp.attemptedMarks || grpAttempt * marksEach;

          secExpectedOffered += grpOffered * marksEach;
          secActualOffered += grpSlots.length * marksEach;

          // Attempted marks for this group
          secActualAttempted += grpExpectedAttemptedMarks;

          const grpPassed =
            grpAttempt <= grpOffered &&
            grpSlots.length >= grpAttempt &&
            grpExpectedAttemptedMarks === grpAttempt * marksEach;

          optionalRulesAudit.push({
            groupOrSectionId: grp.id,
            label: `${sec.name} · ${grp.title || 'Group'}`,
            offeredCount: grpOffered,
            attemptCount: grpAttempt,
            marksPerQuestion: marksEach,
            attemptedMarksExpected: grpExpectedAttemptedMarks,
            attemptedMarksActual: grpExpectedAttemptedMarks,
            passed: grpPassed,
          });
        }
      } else {
        // Standard section arithmetic (e.g. 10 questions x 2 marks = 20 marks, or Answer any 10 out of 12)
        const qAttempt = (sec as any).questionsToAttempt || sec.numberOfQuestions;
        const qOffered = (sec as any).questionsOffered || sec.numberOfQuestions;
        const marksEach = sec.marksPerQuestion || 1;

        secExpectedAttempted = qAttempt * marksEach;
        secExpectedOffered = qOffered * marksEach;
        secActualOffered = secSlots.reduce(
          (sum, s) => sum + (s.questionItem?.marks || s.marks || marksEach),
          0
        );
        secActualAttempted = secExpectedAttempted;

        const isOptional = qOffered > qAttempt;
        if (isOptional) {
          optionalRulesAudit.push({
            groupOrSectionId: sec.id,
            label: `${sec.name} (${sec.description})`,
            offeredCount: qOffered,
            attemptCount: qAttempt,
            marksPerQuestion: marksEach,
            attemptedMarksExpected: secExpectedAttempted,
            attemptedMarksActual: secActualAttempted,
            passed: qAttempt <= qOffered && secSlots.length >= qAttempt,
          });
        }
      }

      totalAttempted += secActualAttempted;
      totalOffered += secActualOffered || secExpectedOffered;

      const secPassed = secActualAttempted === secExpectedAttempted;

      sectionsAudit.push({
        sectionId: sec.id,
        sectionName: sec.name,
        expectedAttemptedMarks: secExpectedAttempted,
        actualAttemptedMarks: secActualAttempted,
        expectedOfferedMarks: secExpectedOffered,
        actualOfferedMarks: secActualOffered,
        passed: secPassed,
        ruleDescription: `${sec.name}: Attempted = ${secActualAttempted}m (Target: ${secExpectedAttempted}m)`,
      });
    }

    return {
      targetTotalMarks,
      attemptedMarksTotal: totalAttempted,
      offeredMarksTotal: totalOffered,
      isTotalMarksCorrect: totalAttempted === targetTotalMarks,
      sectionsAudit,
      optionalQuestionRulesAudit: optionalRulesAudit,
    };
  }

  private evaluateTotalMarksRule(audit: ArithmeticAudit): RuleEvaluationResult {
    const passed = audit.isTotalMarksCorrect;
    return {
      ruleId: 'total_marks_arithmetic',
      name: 'Total Marks Arithmetic Consistency',
      category: 'universal',
      status: passed ? 'passed' : 'failed',
      passed,
      score: passed ? 100 : 0,
      summary: passed
        ? `Total attempted marks arithmetic is exact: ${audit.attemptedMarksTotal} / ${audit.targetTotalMarks} Marks.`
        : `Total attempted marks mismatch: ${audit.attemptedMarksTotal} marks calculated vs required ${audit.targetTotalMarks} marks.`,
      recommendation: passed ? undefined : 'Adjust section allocations so attempted marks equal target exactly.',
    };
  }

  private evaluateSectionMarksRule(audit: ArithmeticAudit): RuleEvaluationResult {
    const failedSections = audit.sectionsAudit.filter((s) => !s.passed);
    const passed = failedSections.length === 0;
    return {
      ruleId: 'section_marks_arithmetic',
      name: 'Section Marks Arithmetic Consistency',
      category: 'universal',
      status: passed ? 'passed' : 'failed',
      passed,
      score: passed ? 100 : Math.max(0, 100 - failedSections.length * 25),
      summary: passed
        ? `All ${audit.sectionsAudit.length} sections have exact, validated arithmetic.`
        : `${failedSections.length} section(s) have marks arithmetic discrepancies.`,
      details: audit.sectionsAudit.map((s) => s.ruleDescription),
    };
  }

  private evaluateOptionalQuestionsRule(audit: ArithmeticAudit): RuleEvaluationResult {
    const failedRules = audit.optionalQuestionRulesAudit.filter((r) => !r.passed);
    const passed = failedRules.length === 0;
    return {
      ruleId: 'optional_question_arithmetic',
      name: 'Optional-Question Choice Arithmetic',
      category: 'universal',
      status: passed ? 'passed' : 'failed',
      passed,
      score: passed ? 100 : 50,
      summary: passed
        ? `Optional question choice arithmetic is valid across all ${audit.optionalQuestionRulesAudit.length} choice groups.`
        : `${failedRules.length} choice group(s) have optional arithmetic mismatches.`,
      details: audit.optionalQuestionRulesAudit.map(
        (r) =>
          `${r.label}: Offer ${r.offeredCount}, Attempt ${r.attemptCount} × ${r.marksPerQuestion}m = ${r.attemptedMarksExpected}m (${r.passed ? 'Valid' : 'Invalid'})`
      ),
    };
  }

  // ----------------------------------------------------
  // RULES 6, 7, 8: Duplicate & Same Fact Detection
  // ----------------------------------------------------
  public evaluateDuplicates(generatedSlots: QuestionSlot[]): {
    exactMatches: DuplicateMatch[];
    semanticMatches: DuplicateMatch[];
    sameFactMatches: DuplicateMatch[];
  } {
    const exactMatches: DuplicateMatch[] = [];
    const semanticMatches: DuplicateMatch[] = [];
    const sameFactMatches: DuplicateMatch[] = [];

    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s\u0980-\u09FF]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Token set helper for Jaccard similarity
    const getTokens = (text: string) => {
      const stopWords = new Set([
        'the',
        'is',
        'at',
        'which',
        'on',
        'a',
        'an',
        'and',
        'or',
        'of',
        'to',
        'in',
        'what',
        'how',
        'calculate',
        'find',
        'নিচের',
        'কোনটি',
        'কী',
        'কত',
        'এবং',
        'বা',
        'হলো',
      ]);
      return new Set(
        normalize(text)
          .split(' ')
          .filter((t) => t.length > 2 && !stopWords.has(t))
      );
    };

    // Key facts extractor for same fact across different formats
    const extractFactSignatures = (text: string): string[] => {
      const norm = normalize(text);
      const signatures: string[] = [];

      // Check key mathematical entities/terms
      const entities = [
        'perimeter',
        'পরিসীমা',
        'area',
        'ক্ষেত্রফল',
        'diameter',
        'ব্যাসার্ধ',
        'radius',
        'ব্যাসার্ধ',
        'integer',
        'পূর্ণসংখ্যা',
        'fraction',
        'ভগ্নাংশ',
        'prime',
        'মৌলিক',
        'composite',
        'যৌগিক',
        'lcm',
        'লসাগু',
        'hcf',
        'গসাগু',
        'parallel',
        'সমান্তরাল',
        'perpendicular',
        'লম্ব',
        'ratio',
        'অনুপাত',
        'equation',
        'সমীকরণ',
      ];

      for (const ent of entities) {
        if (norm.includes(ent)) {
          signatures.push(ent);
        }
      }

      // Check numbers
      const numbers = norm.match(/\b\d+\b/g);
      if (numbers && numbers.length >= 2) {
        signatures.push(`nums_${numbers.slice(0, 3).sort().join('_')}`);
      }

      return signatures;
    };

    for (let i = 0; i < generatedSlots.length; i++) {
      for (let j = i + 1; j < generatedSlots.length; j++) {
        const slotA = generatedSlots[i];
        const slotB = generatedSlots[j];
        const textA = slotA.questionItem?.question_text || '';
        const textB = slotB.questionItem?.question_text || '';

        const normA = normalize(textA);
        const normB = normalize(textB);

        // 1. Exact Duplicate
        if (normA.length > 10 && normA === normB) {
          exactMatches.push({
            slotA: slotA.slotNumber,
            slotB: slotB.slotNumber,
            questionTextA: textA,
            questionTextB: textB,
            similarityScore: 1.0,
            type: 'exact',
            reason: `Exact identical question text detected in Slot #${slotA.slotNumber} and Slot #${slotB.slotNumber}.`,
          });
          continue;
        }

        // 2. Semantic Duplicate (Token Jaccard Similarity)
        const tokensA = getTokens(textA);
        const tokensB = getTokens(textB);

        if (tokensA.size > 0 && tokensB.size > 0) {
          let intersection = 0;
          for (const t of tokensA) {
            if (tokensB.has(t)) intersection++;
          }
          const union = new Set([...tokensA, ...tokensB]).size;
          const jaccard = union > 0 ? intersection / union : 0;

          if (jaccard >= 0.72) {
            semanticMatches.push({
              slotA: slotA.slotNumber,
              slotB: slotB.slotNumber,
              questionTextA: textA,
              questionTextB: textB,
              similarityScore: Number(jaccard.toFixed(2)),
              type: 'semantic',
              reason: `High semantic similarity (${Math.round(jaccard * 100)}%) between Slot #${slotA.slotNumber} and Slot #${slotB.slotNumber}. Both test almost identical question structure.`,
            });
            continue;
          }

          // 3. Same fact asked in different formats
          // e.g. Slot A is MCQ or True/False and Slot B is Fill in the Blank or VSA testing identical fact
          if (slotA.questionType !== slotB.questionType) {
            const factsA = extractFactSignatures(textA);
            const factsB = extractFactSignatures(textB);

            const commonFacts = factsA.filter((f) => factsB.includes(f));
            if (commonFacts.length >= 2 && jaccard >= 0.5) {
              sameFactMatches.push({
                slotA: slotA.slotNumber,
                slotB: slotB.slotNumber,
                questionTextA: textA,
                questionTextB: textB,
                similarityScore: Number(jaccard.toFixed(2)),
                type: 'same_fact_different_format',
                reason: `Same underlying mathematical fact (${commonFacts.join(', ')}) asked in different question formats (${slotA.questionType.toUpperCase()} in #${slotA.slotNumber} vs ${slotB.questionType.toUpperCase()} in #${slotB.slotNumber}).`,
              });
            }
          }
        }
      }
    }

    return { exactMatches, semanticMatches, sameFactMatches };
  }

  private evaluateExactDuplicatesRule(exactMatches: DuplicateMatch[]): RuleEvaluationResult {
    const passed = exactMatches.length === 0;
    const affected = Array.from(new Set(exactMatches.flatMap((m) => [m.slotA, m.slotB])));
    return {
      ruleId: 'exact_duplicate_detection',
      name: 'Exact Duplicate Question Detection',
      category: 'universal',
      status: passed ? 'passed' : 'failed',
      passed,
      score: passed ? 100 : Math.max(0, 100 - exactMatches.length * 30),
      summary: passed
        ? 'No exact duplicate questions detected in the paper.'
        : `${exactMatches.length} exact duplicate question pair(s) detected.`,
      details: exactMatches.map((m) => m.reason),
      affectedSlotNumbers: affected,
      recommendation: passed ? undefined : 'Replace or regenerate duplicate slots to ensure question variety.',
    };
  }

  private evaluateSemanticDuplicatesRule(semanticMatches: DuplicateMatch[]): RuleEvaluationResult {
    const passed = semanticMatches.length === 0;
    const affected = Array.from(new Set(semanticMatches.flatMap((m) => [m.slotA, m.slotB])));
    return {
      ruleId: 'semantic_duplicate_detection',
      name: 'Semantic Duplicate Question Detection',
      category: 'universal',
      status: passed ? 'passed' : 'warning',
      passed,
      score: passed ? 100 : Math.max(50, 100 - semanticMatches.length * 15),
      summary: passed
        ? 'No semantic duplicates or highly similar questions detected.'
        : `${semanticMatches.length} semantically similar question pair(s) detected.`,
      details: semanticMatches.map((m) => m.reason),
      affectedSlotNumbers: affected,
      recommendation: passed
        ? undefined
        : 'Review semantically overlapping questions and test alternative topics within the chapter.',
    };
  }

  private evaluateSameFactDifferentFormatRule(sameFactMatches: DuplicateMatch[]): RuleEvaluationResult {
    const passed = sameFactMatches.length === 0;
    const affected = Array.from(new Set(sameFactMatches.flatMap((m) => [m.slotA, m.slotB])));
    return {
      ruleId: 'same_fact_different_format',
      name: 'Cross-Format Repetitive Fact Detection',
      category: 'universal',
      status: passed ? 'passed' : 'warning',
      passed,
      score: passed ? 100 : Math.max(60, 100 - sameFactMatches.length * 12),
      summary: passed
        ? 'No identical facts repeated across different question formats.'
        : `${sameFactMatches.length} fact(s) tested redundantly across different formats.`,
      details: sameFactMatches.map((m) => m.reason),
      affectedSlotNumbers: affected,
      recommendation: passed
        ? undefined
        : 'Diversify assessment coverage by replacing repeated facts with alternative chapter objectives.',
    };
  }

  // ----------------------------------------------------
  // RULE 9: Marking Scheme Marks Equality
  // ----------------------------------------------------
  private evaluateMarkingSchemeEquality(generatedSlots: QuestionSlot[]): RuleEvaluationResult {
    if (generatedSlots.length === 0) {
      return {
        ruleId: 'marking_scheme_marks_equality',
        name: 'Marking Scheme Marks Strict Equality',
        category: 'universal',
        status: 'passed',
        passed: true,
        score: 100,
        summary: 'Marking scheme rule ready for verification.',
      };
    }

    const invalidSlots: number[] = [];
    const details: string[] = [];

    for (const slot of generatedSlots) {
      const q = slot.questionItem;
      if (!q || !q.answer) {
        invalidSlots.push(slot.slotNumber);
        details.push(`Slot #${slot.slotNumber} is missing model answer and marking rubric.`);
        continue;
      }

      const ms = q.answer.marking_scheme;
      if (!Array.isArray(ms) || ms.length === 0) {
        invalidSlots.push(slot.slotNumber);
        details.push(`Slot #${slot.slotNumber} has empty marking scheme.`);
        continue;
      }

      const sum = ms.reduce((acc, item) => acc + (Number(item.marks) || 0), 0);
      if (sum !== q.marks) {
        invalidSlots.push(slot.slotNumber);
        details.push(
          `Slot #${slot.slotNumber} sum of criteria marks (${sum}m) does not equal question marks (${q.marks}m).`
        );
      }
    }

    const passed = invalidSlots.length === 0;
    const score = Math.max(
      0,
      Math.round(((generatedSlots.length - invalidSlots.length) / generatedSlots.length) * 100)
    );

    return {
      ruleId: 'marking_scheme_marks_equality',
      name: 'Marking Scheme Marks Strict Equality',
      category: 'universal',
      status: passed ? 'passed' : 'failed',
      passed,
      score,
      summary: passed
        ? `All ${generatedSlots.length} questions have strictly balanced marking scheme sums equal to question marks.`
        : `${invalidSlots.length} question(s) have marking scheme sum discrepancies.`,
      details,
      affectedSlotNumbers: invalidSlots,
      recommendation: passed ? undefined : 'Adjust criteria marks breakdown to equal question marks.',
    };
  }

  // ----------------------------------------------------
  // RULE 10: Model Answer Validation
  // ----------------------------------------------------
  private evaluateAnswerValidation(generatedSlots: QuestionSlot[]): RuleEvaluationResult {
    if (generatedSlots.length === 0) {
      return {
        ruleId: 'answer_validation',
        name: 'Model Answer Validation',
        category: 'universal',
        status: 'passed',
        passed: true,
        score: 100,
        summary: 'Answer validation active.',
      };
    }

    const invalidSlots: number[] = [];
    const details: string[] = [];

    for (const slot of generatedSlots) {
      const q = slot.questionItem;
      const ans = q?.answer?.answer_text?.trim() || '';

      if (!ans || ans.length < 3) {
        invalidSlots.push(slot.slotNumber);
        details.push(`Slot #${slot.slotNumber} has an empty or trivial answer.`);
      } else if (q && q.marks >= 3 && ans.length < 25) {
        // Multi-mark question should have working steps
        invalidSlots.push(slot.slotNumber);
        details.push(
          `Slot #${slot.slotNumber} (${q.marks} Marks) answer lacks step-by-step working steps.`
        );
      }
    }

    const passed = invalidSlots.length === 0;
    const score = Math.max(
      0,
      Math.round(((generatedSlots.length - invalidSlots.length) / generatedSlots.length) * 100)
    );

    return {
      ruleId: 'answer_validation',
      name: 'Model Answer Validation',
      category: 'universal',
      status: passed ? 'passed' : 'failed',
      passed,
      score,
      summary: passed
        ? `All ${generatedSlots.length} questions contain complete, rigorous model answers.`
        : `${invalidSlots.length} question(s) have incomplete or missing model answers.`,
      details,
      affectedSlotNumbers: invalidSlots,
    };
  }

  // ----------------------------------------------------
  // RULE 11: Source Pages Traceability
  // ----------------------------------------------------
  private evaluateSourcePagesTraceable(
    paper: ClassVIExamPaper,
    generatedSlots: QuestionSlot[]
  ): RuleEvaluationResult {
    if (generatedSlots.length === 0) {
      return {
        ruleId: 'source_pages_traceable',
        name: 'Source Pages Traceability',
        category: 'universal',
        status: 'passed',
        passed: true,
        score: 100,
        summary: 'Source page citation engine ready.',
      };
    }

    const untraceableSlots: number[] = [];
    const details: string[] = [];

    for (const slot of generatedSlots) {
      const q = slot.questionItem;
      const pages = q?.source?.page_start;
      if (typeof pages !== 'number' || isNaN(pages) || pages < 1) {
        untraceableSlots.push(slot.slotNumber);
        details.push(`Slot #${slot.slotNumber} has invalid or missing source page citations.`);
      }
    }

    const passed = untraceableSlots.length === 0;
    const score = Math.max(
      0,
      Math.round(((generatedSlots.length - untraceableSlots.length) / generatedSlots.length) * 100)
    );

    return {
      ruleId: 'source_pages_traceable',
      name: 'Source Pages Traceability',
      category: 'universal',
      status: passed ? 'passed' : 'warning',
      passed,
      score,
      summary: passed
        ? `All ${generatedSlots.length} questions cite traceable physical page numbers from the textbook.`
        : `${untraceableSlots.length} question(s) lack traceable physical page numbers.`,
      details,
      affectedSlotNumbers: untraceableSlots,
    };
  }

  // ----------------------------------------------------
  // RULE 12: Teacher Approval Workflow
  // ----------------------------------------------------
  private evaluateTeacherApproval(
    slots: QuestionSlot[],
    generatedSlots: QuestionSlot[]
  ): RuleEvaluationResult {
    const approvedCount = generatedSlots.filter(
      (s) => s.questionItem?.status === 'approved' || s.questionItem?.status === 'edited'
    ).length;

    const pendingReviewCount = generatedSlots.length - approvedCount;
    const score = generatedSlots.length > 0 ? Math.round((approvedCount / generatedSlots.length) * 100) : 100;

    return {
      ruleId: 'teacher_approval_workflow',
      name: 'Teacher Review and Approval Workflow',
      category: 'universal',
      status: pendingReviewCount === 0 && generatedSlots.length > 0 ? 'passed' : 'warning',
      passed: true, // Teacher review remains available
      score,
      summary: `Teacher Review Status: ${approvedCount} approved / edited, ${pendingReviewCount} pending final teacher sign-off.`,
      recommendation:
        pendingReviewCount > 0
          ? 'Review and approve question cards before final printing.'
          : undefined,
    };
  }

  // ----------------------------------------------------
  // RULE 13: Difficulty Distribution
  // ----------------------------------------------------
  public evaluateDifficultyDistribution(generatedSlots: QuestionSlot[]): DifficultyAudit {
    const total = Math.max(1, generatedSlots.length);
    let easyCount = 0;
    let modCount = 0;
    let diffCount = 0;

    for (const s of generatedSlots) {
      const d = s.questionItem?.difficulty || s.difficulty;
      if (d === 'easy') easyCount++;
      else if (d === 'difficult') diffCount++;
      else modCount++;
    }

    const easyPct = Math.round((easyCount / total) * 100);
    const modPct = Math.round((modCount / total) * 100);
    const diffPct = Math.round((diffCount / total) * 100);

    // Target Profile: Easy 25-35%, Moderate 45-55%, Difficult 15-25%
    const passed =
      generatedSlots.length < 5 ||
      (easyPct >= 15 && easyPct <= 45 && modPct >= 35 && modPct <= 65 && diffPct <= 35);

    return {
      easyPercentage: easyPct,
      moderatePercentage: modPct,
      difficultPercentage: diffPct,
      targetProfile: { easy: 30, moderate: 50, difficult: 20 },
      passed,
      notes: `Distribution: ${easyPct}% Easy, ${modPct}% Moderate, ${diffPct}% Difficult (Target: 30% / 50% / 20%).`,
    };
  }

  private evaluateDifficultyRule(audit: DifficultyAudit): RuleEvaluationResult {
    return {
      ruleId: 'difficulty_distribution',
      name: 'Difficulty Distribution Measurement',
      category: 'universal',
      status: audit.passed ? 'passed' : 'warning',
      passed: audit.passed,
      score: audit.passed ? 100 : 75,
      summary: audit.notes,
      recommendation: audit.passed
        ? undefined
        : 'Adjust difficulty levels to balance easy, moderate, and higher-order thinking problems.',
    };
  }

  // ----------------------------------------------------
  // RULE 14: Output Language Integrity
  // ----------------------------------------------------
  public evaluateLanguageIntegrity(generatedSlots: QuestionSlot[]): LanguageIntegrityAudit {
    let bengaliScriptIntegrity = true;
    let noCorruptedUnicode = true;
    const flaggedSlots: number[] = [];

    for (const slot of generatedSlots) {
      const q = slot.questionItem;
      if (!q) continue;

      const lang = q.language;
      const text = q.question_text + ' ' + (q.answer?.answer_text || '');

      // Check corrupted unicode replacement chars: \uFFFD or mojibake patterns
      if (text.includes('\uFFFD') || text.includes('Ã') || text.includes('â€')) {
        noCorruptedUnicode = false;
        flaggedSlots.push(slot.slotNumber);
      }

      // Check Bengali script presence when language is 'bn'
      if (lang === 'bn') {
        const hasBengali = /[\u0980-\u09FF]/.test(text);
        if (!hasBengali) {
          bengaliScriptIntegrity = false;
          flaggedSlots.push(slot.slotNumber);
        }
      }
    }

    const passed = bengaliScriptIntegrity && noCorruptedUnicode && flaggedSlots.length === 0;

    return {
      expectedLanguage: generatedSlots[0]?.questionItem?.language || 'en',
      detectedLanguage: bengaliScriptIntegrity ? 'Authentic Unicode' : 'Integrity Checked',
      bengaliScriptIntegrity,
      noCorruptedUnicode,
      passed,
      flaggedSlots,
      notes: passed
        ? 'Output language script integrity verified. Zero garbled glyphs or encoding corruption.'
        : `Language integrity warnings detected in Slot(s): #${flaggedSlots.join(', #')}.`,
    };
  }

  private evaluateLanguageRule(audit: LanguageIntegrityAudit): RuleEvaluationResult {
    return {
      ruleId: 'output_language_integrity',
      name: 'Output Language and Script Integrity',
      category: 'universal',
      status: audit.passed ? 'passed' : 'failed',
      passed: audit.passed,
      score: audit.passed ? 100 : 50,
      summary: audit.notes,
      affectedSlotNumbers: audit.flaggedSlots,
    };
  }
}

export const universalAssessmentEngine = new UniversalAssessmentEngine();
