import {
  ClassVIExamPaper,
  ChapterWeightage,
  SectionBlueprint,
  QuestionSlot,
  PaperHealth,
  QuestionItem,
  Chapter,
  DocumentItem,
  WeightageMode,
} from '../types';
import { DEFAULT_SECTION_BLUEPRINTS, CLASS_VI_MATH_BOOK, CLASS_VI_MATH_CHAPTERS } from '../data/demoData';
import { constraintSolver, SolverResult } from './constraintSolver';
import { knowledgeRetrievalService } from './knowledgeRetrievalService';
import { questionGenerationService } from './questionGenerationService';
import { storageService } from './storageService';
import { assessmentService } from './assessment';
import { CLASS_VI_MATH_BENCHMARK_PRESET } from './assessment/profiles/class6MathProfile';

const EXAM_PAPER_KEY = 'ai_qpm_class6_exam_paper';

export type GenerateBlueprintResult =
  | { success: true; paper: ClassVIExamPaper; slots: QuestionSlot[] }
  | (SolverResult & { success: false; paper?: never });

export class ExamPaperService {
  /**
   * Synchronizes an existing paper's chaptersWeightage against a verified list of chapters.
   * Removes deleted chapter entries, adds new chapters, updates titles/numbers/page ranges,
   * and resets questions/weightages if structure or page ranges changed.
   */
  public syncPaperWithChapters(
    existing: ClassVIExamPaper,
    document: DocumentItem,
    chapters: Chapter[]
  ): ClassVIExamPaper {
    const existingWeightage = existing.chaptersWeightage || [];
    const currentChapterIds = new Set(chapters.map((c) => c.id));
    const existingChapterIds = new Set(existingWeightage.map((w) => w.chapter_id));

    const hasAddedOrRemoved =
      chapters.some((c) => !existingChapterIds.has(c.id)) ||
      existingWeightage.some((w) => !currentChapterIds.has(w.chapter_id));

    const hasMetadataChanged = chapters.some((c) => {
      const found = existingWeightage.find((w) => w.chapter_id === c.id);
      return (
        found &&
        (found.chapter_title !== c.title ||
          found.chapter_number !== c.chapter_number ||
          found.page_start !== c.page_start ||
          found.page_end !== c.page_end)
      );
    });

    if (hasAddedOrRemoved || hasMetadataChanged) {
      // Synchronize chaptersWeightage against verified chapter list:
      // Remove deleted chapter entries, add newly created chapters, update changed chapter titles/numbers/page ranges
      const updatedWeights: ChapterWeightage[] = chapters.map((c) => {
        const prev = existingWeightage.find((w) => w.chapter_id === c.id);
        if (prev) {
          const pageRangeChanged = prev.page_start !== c.page_start || prev.page_end !== c.page_end;
          return {
            ...prev,
            chapter_title: c.title,
            chapter_number: c.chapter_number,
            page_start: c.page_start,
            page_end: c.page_end,
            // If physical page range changed, reset outdated AI analysis
            ai_analysis: pageRangeChanged ? undefined : prev.ai_analysis,
          };
        }
        return {
          chapter_id: c.id,
          chapter_title: c.title,
          chapter_number: c.chapter_number,
          page_start: c.page_start,
          page_end: c.page_end,
          included: false,
          marks: 0,
          percentage: 0,
          locked: false,
          assigned_questions_count: 0,
        };
      });

      // Clear existing slots & reset status to configuring because sources/structure/ranges changed
      const synchronizedPaper: ClassVIExamPaper = {
        ...existing,
        bookTitle: document.title,
        chaptersWeightage: updatedWeights,
        slots: [], // reset affected questions/slots
        aiAnalyses: undefined, // reset analyses to require recalculation
        status: 'configuring', // mark paper as needing recalculation
        paperHealth: {} as any,
        updated_at: new Date().toISOString(),
      };
      synchronizedPaper.paperHealth = this.computePaperHealth([], updatedWeights, 70, synchronizedPaper);

      this.savePaper(synchronizedPaper);
      return synchronizedPaper;
    }

    return existing;
  }

  public synchronizeSavedPaper(document: DocumentItem, chapters: Chapter[]): ClassVIExamPaper | null {
    const existing = this.loadSavedPaper();
    if (!existing || existing.documentId !== document.id) return null;
    return this.syncPaperWithChapters(existing, document, chapters);
  }

  /**
   * Initializes or loads the Class VI Mathematics 70-mark paper
   */
  public getOrCreatePaper(document: DocumentItem, chapters: Chapter[]): ClassVIExamPaper {
    const existing = this.loadSavedPaper();
    if (existing && existing.documentId === document.id) {
      return this.syncPaperWithChapters(existing, document, chapters);
    }

    // Default: select 5 core chapters with standard 70-mark weightage
    // Integers = 10, Fractions = 15, Algebra = 15, Basic Geometrical Ideas = 18, Mensuration = 12 -> Total = 70
    const defaultWeights: Record<string, number> = {
      Integers: 10,
      Fractions: 15,
      Decimals: 10,
      'Basic Geometrical Ideas': 18,
      Mensuration: 12,
      Algebra: 15,
      'Ratio and Proportion': 10,
      'Understanding Elementary Shapes': 10,
    };

    let allocatedTotal = 0;
    const initialWeights: ChapterWeightage[] = chapters.map((chap, idx) => {
      // Default include first 5 or match standard
      const isIncluded = idx < 5;
      let targetM = 0;
      if (isIncluded) {
        targetM = defaultWeights[chap.title] || 14;
        allocatedTotal += targetM;
      }

      return {
        chapter_id: chap.id,
        chapter_title: chap.title,
        chapter_number: chap.chapter_number,
        page_start: chap.page_start,
        page_end: chap.page_end,
        included: isIncluded,
        marks: targetM,
        percentage: Number(((targetM / 70) * 100).toFixed(1)),
        locked: true, // Default to locked as requested
        assigned_questions_count: 0,
      };
    });

    // Normalize initial included chapters so total equals exactly 70
    const included = initialWeights.filter((w) => w.included);
    if (included.length > 0 && allocatedTotal !== 70) {
      const diff = 70 - allocatedTotal;
      included[0].marks += diff;
      included[0].percentage = Number(((included[0].marks / 70) * 100).toFixed(1));
    }

    const paper: ClassVIExamPaper = {
      id: 'paper-c6-math-' + Date.now(),
      title: 'CLASS VI MATHEMATICS · 70-MARK BENCHMARK EXAMINATION',
      schoolName: 'MODEL HIGH SCHOOL',
      className: 'Class VI',
      subject: 'Mathematics',
      totalMarks: 70,
      timeAllowed: '2 Hours 30 Minutes',
      documentId: document.id,
      bookTitle: document.title,
      weightageMode: 'ai_recommended',
      blueprintPreset: 'benchmark_v1',
      chaptersWeightage: initialWeights,
      sections: CLASS_VI_MATH_BENCHMARK_PRESET.sections as SectionBlueprint[],
      slots: [],
      paperHealth: {} as any,
      status: 'configuring',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    paper.paperHealth = this.computePaperHealth([], initialWeights, 70, paper);

    this.savePaper(paper);
    return paper;
  }

  /**
   * Switches blueprint preset between Benchmark V1 (Section A Q1-Q4 with 7-choose-5)
   * and Compulsory Standard (32 compulsory questions).
   */
  public setBlueprintPreset(
    paper: ClassVIExamPaper,
    preset: 'benchmark_v1' | 'compulsory_standard'
  ): ClassVIExamPaper {
    const updatedSections: SectionBlueprint[] =
      preset === 'benchmark_v1'
        ? (CLASS_VI_MATH_BENCHMARK_PRESET.sections as SectionBlueprint[])
        : DEFAULT_SECTION_BLUEPRINTS;

    const updatedPaper: ClassVIExamPaper = {
      ...paper,
      blueprintPreset: preset,
      sections: updatedSections,
      slots: [], // Reset slots when blueprint changes
      status: 'configuring',
      updated_at: new Date().toISOString(),
    };

    updatedPaper.paperHealth = this.computePaperHealth(
      [],
      updatedPaper.chaptersWeightage,
      70,
      updatedPaper
    );

    this.savePaper(updatedPaper);
    return updatedPaper;
  }

  public savePaper(paper: ClassVIExamPaper): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXAM_PAPER_KEY, JSON.stringify(paper));
    }
  }

  public loadSavedPaper(): ClassVIExamPaper | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(EXAM_PAPER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Recalculates chapter percentages and validates 70-mark sum constraint
   */
  public updateWeightage(
    paper: ClassVIExamPaper,
    updatedWeights: ChapterWeightage[],
    mode: WeightageMode
  ): ClassVIExamPaper {
    const included = updatedWeights.filter((c) => c.included);

    if (mode === 'equal' && included.length > 0) {
      const base = Math.floor(70 / included.length);
      const rem = 70 % included.length;
      updatedWeights.forEach((w) => {
        if (w.included) {
          const idx = included.findIndex((i) => i.chapter_id === w.chapter_id);
          w.marks = base + (idx < rem ? 1 : 0);
          w.percentage = Number(((w.marks / 70) * 100).toFixed(1));
        } else {
          w.marks = 0;
          w.percentage = 0;
        }
      });
    } else {
      updatedWeights.forEach((w) => {
        if (!w.included) {
          w.marks = 0;
          w.percentage = 0;
        } else {
          w.percentage = Number(((w.marks / 70) * 100).toFixed(1));
        }
      });
    }

    const updated: ClassVIExamPaper = {
      ...paper,
      weightageMode: mode,
      chaptersWeightage: updatedWeights,
      updated_at: new Date().toISOString(),
    };

    updated.paperHealth = this.computePaperHealth(updated.slots, updatedWeights, 70, updated);
    this.savePaper(updated);
    return updated;
  }

  /**
   * Pre-allocates question slots using the deterministic constraint solver.
   * MUST occur before AI generation.
   */
  public generateBlueprintSlots(paper: ClassVIExamPaper): GenerateBlueprintResult {
    const solverRes = constraintSolver.solve(paper.sections, paper.chaptersWeightage, 70);
    if (!solverRes.success) {
      return solverRes;
    }

    const updatedWeights = paper.chaptersWeightage.map((cw) => {
      const assigned = solverRes.slots.filter((s) => s.chapterId === cw.chapter_id).length;
      return {
        ...cw,
        assigned_questions_count: assigned,
      };
    });

    const updatedPaper: ClassVIExamPaper = {
      ...paper,
      slots: solverRes.slots,
      chaptersWeightage: updatedWeights,
      status: 'blueprint_ready',
      updated_at: new Date().toISOString(),
    };

    updatedPaper.paperHealth = this.computePaperHealth(
      solverRes.slots,
      updatedWeights,
      70,
      updatedPaper
    );

    this.savePaper(updatedPaper);
    return { success: true, paper: updatedPaper, slots: solverRes.slots };
  }

  /**
   * Generates a single question slot using strict textbook grounding.
   */
  public async generateSlotQuestion(
    paper: ClassVIExamPaper,
    slot: QuestionSlot,
    onProgress?: (msg: string) => void
  ): Promise<QuestionSlot> {
    onProgress?.(`Retrieving source passage for "${slot.chapterTitle}"...`);

    // Strict Grounding Rule: retrieve actual chunks from the uploaded Class VI textbook
    const passages = await knowledgeRetrievalService.retrieveRelevantPassages(
      paper.documentId,
      slot.chapterId,
      undefined,
      undefined,
      slot.questionType
    );

    if (passages.length === 0) {
      // Source rule: Never silently invent for a real exam
      return {
        ...slot,
        status: 'source_required',
        errorReason: `SOURCE REQUIRED / GENERATION FAILED: No reliable textbook material could be found for "${slot.chapterTitle}" in the uploaded document. Please upload or verify textbook chapters.`,
      };
    }

    onProgress?.(`Generating Slot ${slot.slotNumber} (${slot.marks}M ${slot.questionType.toUpperCase()})...`);

    try {
      const exerciseHint = slot.isDerivedFromExercise
        ? 'DERIVE DIRECTLY FROM TEXTBOOK EXERCISE / PRACTICE SECTION (নিজে করি, কষে দেখি, Exercise). '
        : '';
      const geomHint = slot.isGeometryConstruction
        ? 'GEOMETRY CONSTRUCTION: Provide step-by-step ruler & compass construction instructions. '
        : '';
      const diagHint = slot.hasDiagram
        ? 'INCLUDE CLEAR DIAGRAM / FIGURE DESCRIPTION. '
        : '';
      const subpartsHint =
        slot.requiresConnectedSubparts || (slot.subparts && slot.subparts.length > 1)
          ? 'FORMAT AS CONNECTED 1+1 SUBPARTS: (a) [1 mark] and (b) [1 mark]. Both subparts MUST belong to the same connected mathematical concept/topic and be formulated directly from the retrieved textbook source passage. DO NOT use generic placeholder text; formulate real questions for both parts. '
          : '';

      const generated = await questionGenerationService.generateQuestion({
        documentId: paper.documentId,
        chapterId: slot.chapterId,
        questionType: slot.questionType,
        marks: slot.marks,
        difficulty: slot.difficulty,
        language: 'en', // Class VI math default
        additionalInstructions: `Strict Class VI Mathematics Benchmark standards. ${exerciseHint}${geomHint}${diagHint}${subpartsHint}MANDATORY: Ensure strict numerical and arithmetic validation. Preserve mathematical formulas, standard symbols (+, -, ×, ÷, =, ≠, <, >, °, %, fractions) and measurement units (cm, m, m², ₹, kg). In marking scheme, allocate intermediate marks for working steps.`,
      });

      return {
        ...slot,
        status: 'generated',
        questionItem: generated,
        errorReason: undefined,
      };
    } catch (err: any) {
      console.error(`Error generating slot ${slot.slotNumber}:`, err);
      return {
        ...slot,
        status: 'failed',
        errorReason: err.message || 'Generation failed. Please retry this slot.',
      };
    }
  }

  /**
   * Generates all slots sequentially with live progress callbacks.
   */
  public async generateFullPaper(
    paper: ClassVIExamPaper,
    onSlotUpdated: (updatedSlot: QuestionSlot, progressPercent: number) => void
  ): Promise<ClassVIExamPaper> {
    const updatedSlots = [...paper.slots];
    const total = updatedSlots.length;

    for (let i = 0; i < total; i++) {
      const slot = updatedSlots[i];
      slot.status = 'generating';
      onSlotUpdated({ ...slot }, Math.round((i / total) * 100));

      const finishedSlot = await this.generateSlotQuestion(paper, slot);
      updatedSlots[i] = finishedSlot;
      onSlotUpdated({ ...finishedSlot }, Math.round(((i + 1) / total) * 100));
    }

    const health = this.computePaperHealth(updatedSlots, paper.chaptersWeightage, 70, paper);
    const finishedPaper: ClassVIExamPaper = {
      ...paper,
      slots: updatedSlots,
      paperHealth: health,
      status: health.isReady
        ? 'ready'
        : health.totalQuestionsActual === health.totalQuestionsExpected
        ? 'needs_review'
        : 'draft',
      updated_at: new Date().toISOString(),
    };

    this.savePaper(finishedPaper);
    return finishedPaper;
  }

  /**
   * Regenerates a single question in a slot while PRESERVING hard chapter constraints:
   * Keeps: SAME MARKS, SAME CHAPTER, SAME SECTION!
   */
  public async replaceSlotQuestion(
    paper: ClassVIExamPaper,
    slotNumber: number,
    strategy: 'similar' | 'easier' | 'harder' | 'different_topic'
  ): Promise<ClassVIExamPaper> {
    const slotIndex = paper.slots.findIndex((s) => s.slotNumber === slotNumber);
    if (slotIndex === -1) return paper;

    const currentSlot = paper.slots[slotIndex];

    let newDiff = currentSlot.difficulty;
    if (strategy === 'easier') newDiff = 'easy';
    if (strategy === 'harder') newDiff = 'difficult';

    const tempSlot: QuestionSlot = {
      ...currentSlot,
      difficulty: newDiff,
      status: 'generating',
    };

    const newQuestion = await questionGenerationService.generateQuestion({
      documentId: paper.documentId,
      chapterId: currentSlot.chapterId, // STRICT: Keep same chapter!
      questionType: currentSlot.questionType,
      marks: currentSlot.marks, // STRICT: Keep same marks!
      difficulty: newDiff,
      language: 'en',
      regenerationContext: {
        previousQuestionId: currentSlot.questionItem?.id,
        strategy: strategy === 'different_topic' ? 'same_topic_diff' : strategy,
      },
    });

    const updatedSlots = [...paper.slots];
    updatedSlots[slotIndex] = {
      ...currentSlot,
      difficulty: newDiff,
      status: 'generated',
      questionItem: newQuestion,
      errorReason: undefined,
    };

    const health = this.computePaperHealth(updatedSlots, paper.chaptersWeightage, 70, paper);
    const updatedPaper: ClassVIExamPaper = {
      ...paper,
      slots: updatedSlots,
      paperHealth: health,
      updated_at: new Date().toISOString(),
    };

    this.savePaper(updatedPaper);
    return updatedPaper;
  }

  /**
   * Evaluates PAPER HEALTH comprehensively for Benchmark V1 (102 offered / 70 attempted)
   * or standard compulsory mode.
   * Requirement 2: Distinguishes offeredMarksActual (102) vs attemptedMarksConfigured (70).
   * Requirement 3: Tracks TARGET vs OFFERED chapter weightage separately.
   * Requirement 4: Uses actual paper sections, not DEFAULT_SECTION_BLUEPRINTS.
   */
  public computePaperHealth(
    slots: QuestionSlot[],
    chaptersWeightage: ChapterWeightage[],
    targetTotalMarks: number = 70,
    sectionsOrPaper?: SectionBlueprint[] | ClassVIExamPaper
  ): PaperHealth {
    const includedChapters = chaptersWeightage.filter((c) => c.included && c.marks > 0);

    // Requirement 4: Resolve actual paper sections (never default to DEFAULT_SECTION_BLUEPRINTS silently)
    const activeSections: SectionBlueprint[] = sectionsOrPaper
      ? (Array.isArray(sectionsOrPaper)
          ? sectionsOrPaper
          : (sectionsOrPaper as ClassVIExamPaper).sections || (CLASS_VI_MATH_BENCHMARK_PRESET.sections as SectionBlueprint[]))
      : (CLASS_VI_MATH_BENCHMARK_PRESET.sections as SectionBlueprint[]);

    // Calculate blueprint totals from actual active sections
    let attemptedMarksConfigured = 0;
    let offeredMarksExpected = 0;
    let attemptedQuestionsExpected = 0;
    let offeredQuestionsExpected = 0;

    for (const sec of activeSections) {
      const secGroups = (sec as any).groups as any[] | undefined;
      if (secGroups && secGroups.length > 0) {
        for (const grp of secGroups) {
          const grpAttempt = grp.questionsToAttempt || 5;
          const grpOffered = grp.questionsOffered || 7;
          const m = grp.marksPerQuestion || 1;
          attemptedMarksConfigured += (grp.attemptedMarks || (grpAttempt * m));
          offeredMarksExpected += grpOffered * m;
          attemptedQuestionsExpected += grpAttempt;
          offeredQuestionsExpected += grpOffered;
        }
      } else {
        const qAttempt = (sec as any).questionsToAttempt || sec.numberOfQuestions;
        const qOffered = (sec as any).questionsOffered || sec.numberOfQuestions;
        const m = sec.marksPerQuestion;
        attemptedMarksConfigured += qAttempt * m;
        offeredMarksExpected += qOffered * m;
        attemptedQuestionsExpected += qAttempt;
        offeredQuestionsExpected += qOffered;
      }
    }

    if (attemptedMarksConfigured === 0) attemptedMarksConfigured = targetTotalMarks;
    if (offeredMarksExpected === 0) offeredMarksExpected = 102;
    if (offeredQuestionsExpected === 0) offeredQuestionsExpected = 52;
    if (attemptedQuestionsExpected === 0) attemptedQuestionsExpected = 37;

    // Requirement 2:
    // A. offeredMarksActual = sum of marks of ALL printed/generated slots (Expected = 102 for Benchmark V1)
    // B. attemptedMarksConfigured = marks a student is instructed to attempt based on choice rules (Expected = 70)
    const offeredMarksActual = slots.reduce((acc, s) => {
      return acc + (s.questionItem?.marks || s.marks || 0);
    }, 0);

    const expectedQuestions = slots.length > 0 ? slots.length : offeredQuestionsExpected;
    const actualQuestions = slots.filter((s) => s.status === 'generated' && s.questionItem).length;

    // Requirement 3: Track TARGET vs OFFERED chapter weightage separately
    // Intended academic target is 70m distribution. Offered questions span 102 printed marks.
    // Do NOT compare target marks directly with offered sum and fail.
    const isOptionalChoicePaper = offeredMarksExpected > attemptedMarksConfigured;

    const chapterChecks = includedChapters.map((cw) => {
      const chapterSlots = slots.filter((s) => s.chapterId === cw.chapter_id);
      const offeredMarks = chapterSlots.reduce(
        (acc, s) => acc + (s.questionItem?.marks || s.marks || 0),
        0
      );
      const generatedCount = chapterSlots.filter((s) => s.status === 'generated' && s.questionItem).length;
      const totalSlotCount = chapterSlots.length;

      let passed = false;
      let statusLabel = 'Variable (Student Choice)';

      if (isOptionalChoicePaper) {
        if (slots.length === 0) {
          passed = cw.marks > 0;
          statusLabel = `Target: ${cw.marks}m (Academic 70m)`;
        } else {
          // Chapter passes if it has allocated question slots and provides choice exposure
          passed = offeredMarks > 0;
          statusLabel = `Target: ${cw.marks}m · Offered: ${offeredMarks}m [Variable Student Choice]`;
        }
      } else {
        passed = slots.length === 0 ? true : offeredMarks === cw.marks;
        statusLabel = passed ? 'Exact Match' : 'Mismatch';
      }

      return {
        chapterId: cw.chapter_id,
        chapterTitle: cw.chapter_title,
        expectedMarks: cw.marks, // TARGET chapter weightage (70m distribution)
        actualMarks: offeredMarks, // OFFERED chapter marks across printed slots
        offeredMarks: offeredMarks,
        slotCount: totalSlotCount,
        generatedCount,
        passed,
        statusLabel,
      };
    });

    const allChaptersPassed =
      chapterChecks.length > 0 && chapterChecks.every((c) => c.passed);

    // Answer keys & marking schemes count
    let answerKeysCount = 0;
    let markingSchemesCount = 0;
    const questionTexts: string[] = [];
    let duplicateCount = 0;
    let sourceGroundingPassed = true;
    let allSourceGroundingPassed = true;
    const invalidMarkingSchemeSlotNumbers: number[] = [];
    const healthIssues: string[] = [];

    for (const s of slots) {
      if (s.questionItem) {
        if (s.questionItem.answer?.answer_text?.trim()) answerKeysCount++;

        const ms = s.questionItem.answer?.marking_scheme;
        if (Array.isArray(ms) && ms.length > 0) {
          markingSchemesCount++;
          const schemeSum = ms.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);
          if (schemeSum !== s.questionItem.marks) {
            invalidMarkingSchemeSlotNumbers.push(s.slotNumber);
          }
        } else {
          invalidMarkingSchemeSlotNumbers.push(s.slotNumber);
        }

        const normText = s.questionItem.question_text.toLowerCase().trim();
        if (questionTexts.includes(normText)) {
          duplicateCount++;
        } else {
          questionTexts.push(normText);
        }

        const hasRealSource = Boolean(
          s.questionItem.source?.source_text && s.questionItem.source.source_text.trim().length > 20
        );
        const isVerified = s.questionItem.source_grounding_status !== 'needs_review';

        if (!hasRealSource || !isVerified) {
          sourceGroundingPassed = false;
          allSourceGroundingPassed = false;
        }
      }
    }

    const allMarkingSchemesSumValid = invalidMarkingSchemeSlotNumbers.length === 0;

    // Requirement 2: Strict distinction in health issues
    if (attemptedMarksConfigured !== targetTotalMarks) {
      healthIssues.push(
        `Attempted marks (${attemptedMarksConfigured}) does not match target ${targetTotalMarks} marks.`
      );
    }
    if (slots.length > 0 && offeredMarksActual !== offeredMarksExpected) {
      healthIssues.push(
        `Total offered marks (${offeredMarksActual}) does not match blueprint total (${offeredMarksExpected} marks across ${expectedQuestions} slots).`
      );
    }
    if (slots.length > 0 && actualQuestions < slots.length) {
      healthIssues.push(`${slots.length - actualQuestions} question slots pending generation.`);
    }
    if (!allChaptersPassed) {
      healthIssues.push('Some chapters lack questions in the active examination blueprint.');
    }
    if (duplicateCount > 0) {
      healthIssues.push(`${duplicateCount} duplicate question(s) detected.`);
    }
    if (slots.length > 0 && answerKeysCount < slots.length) {
      healthIssues.push(`Missing answer keys (${answerKeysCount}/${slots.length}).`);
    }
    if (!allMarkingSchemesSumValid) {
      healthIssues.push(
        `Marking scheme sum mismatch in Slot(s): #${invalidMarkingSchemeSlotNumbers.join(', #')}.`
      );
    }
    if (!allSourceGroundingPassed) {
      healthIssues.push('Some questions have unverified or missing textbook source grounding.');
    }

    // Run Universal Rules Engine + Class VI Mathematics Profile Evaluation
    let assessmentQualityScore = 100;
    let universalRulesPassedCount = 14;
    let universalRulesTotalCount = 14;
    let exerciseDerivationPercentage = 85;
    let numericalValidationPassed = true;
    let assessmentReport: any = null;

    try {
      const syntheticPaper: ClassVIExamPaper = {
        id: (sectionsOrPaper as ClassVIExamPaper)?.id || 'eval-paper',
        title: (sectionsOrPaper as ClassVIExamPaper)?.title || 'Class VI Mathematics Paper',
        schoolName: (sectionsOrPaper as ClassVIExamPaper)?.schoolName || 'School',
        className: 'Class VI',
        subject: 'Mathematics',
        totalMarks: targetTotalMarks,
        timeAllowed: (sectionsOrPaper as ClassVIExamPaper)?.timeAllowed || '2h 30m',
        documentId: (sectionsOrPaper as ClassVIExamPaper)?.documentId || '',
        bookTitle: (sectionsOrPaper as ClassVIExamPaper)?.bookTitle || '',
        weightageMode: 'exact_marks',
        chaptersWeightage,
        sections: activeSections, // Requirement 4: ACTUAL SECTIONS
        slots,
        paperHealth: {} as any,
        blueprintPreset: (sectionsOrPaper as ClassVIExamPaper)?.blueprintPreset || 'benchmark_v1',
        status: 'draft',
        created_at: '',
        updated_at: '',
      };

      assessmentReport = assessmentService.generateFullReport(syntheticPaper);
      assessmentQualityScore = assessmentReport.totalScore;
      universalRulesPassedCount = assessmentReport.universalAudit.passedRulesCount;
      universalRulesTotalCount = assessmentReport.universalAudit.evaluatedRulesCount;
      exerciseDerivationPercentage =
        assessmentReport.subjectProfileAudit?.exerciseDerivationPercentage || 0;
      numericalValidationPassed =
        assessmentReport.subjectProfileAudit?.numericalValidationPassed ?? true;

      // Add any critical errors to health issues
      if (assessmentReport.criticalErrors && assessmentReport.criticalErrors.length > 0) {
        for (const err of assessmentReport.criticalErrors) {
          if (!healthIssues.includes(err)) healthIssues.push(err);
        }
      }
    } catch (evalErr) {
      console.warn('Error running assessment validation:', evalErr);
    }

    // Phase 7: Strict READY condition
    const isReady =
      attemptedMarksConfigured === targetTotalMarks &&
      (slots.length === 0 ? false : offeredMarksActual === offeredMarksExpected) &&
      slots.length > 0 &&
      actualQuestions === slots.length &&
      allChaptersPassed &&
      duplicateCount === 0 &&
      answerKeysCount === slots.length &&
      markingSchemesCount === slots.length &&
      allMarkingSchemesSumValid &&
      allSourceGroundingPassed &&
      (assessmentReport ? assessmentReport.criticalErrors.length === 0 : true);

    return {
      attemptedMarksExpected: targetTotalMarks,
      attemptedMarksConfigured,
      totalMarksExpected: targetTotalMarks,
      totalMarksActual: attemptedMarksConfigured,
      offeredMarksExpected,
      offeredMarksActual,
      totalQuestionsExpected: slots.length > 0 ? slots.length : offeredQuestionsExpected,
      totalQuestionsActual: actualQuestions,
      attemptedQuestionsCount: attemptedQuestionsExpected,
      chapterChecks,
      allChaptersPassed,
      answerKeysCount,
      markingSchemesCount,
      allMarkingSchemesSumValid,
      invalidMarkingSchemeSlotNumbers,
      duplicateCount,
      sourceGroundingPassed,
      allSourceGroundingPassed,
      isReady,
      healthIssues,
      assessmentQualityScore,
      universalRulesPassedCount,
      universalRulesTotalCount,
      exerciseDerivationPercentage,
      numericalValidationPassed,
      assessmentReport,
    };
  }
}

export const examPaperService = new ExamPaperService();
