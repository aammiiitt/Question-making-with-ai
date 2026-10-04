import {
  ClassVIExamPaper,
  ChapterWeightage,
  SectionBlueprint,
  QuestionSlot,
  PaperHealth,
  QuestionItem,
  Chapter,
  DocumentItem,
} from '../types';
import { DEFAULT_SECTION_BLUEPRINTS, CLASS_VI_MATH_BOOK, CLASS_VI_MATH_CHAPTERS } from '../data/demoData';
import { constraintSolver, SolverResult } from './constraintSolver';
import { knowledgeRetrievalService } from './knowledgeRetrievalService';
import { questionGenerationService } from './questionGenerationService';
import { storageService } from './storageService';

const EXAM_PAPER_KEY = 'ai_qpm_class6_exam_paper';

export type GenerateBlueprintResult =
  | { success: true; paper: ClassVIExamPaper; slots: QuestionSlot[] }
  | (SolverResult & { success: false; paper?: never });

export class ExamPaperService {
  /**
   * Initializes or loads the Class VI Mathematics 70-mark paper
   */
  public getOrCreatePaper(document: DocumentItem, chapters: Chapter[]): ClassVIExamPaper {
    const existing = this.loadSavedPaper();
    if (existing && existing.documentId === document.id) {
      return existing;
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
      title: 'ANNUAL / SUMMATIVE EVALUATION (MATHEMATICS)',
      schoolName: 'MODEL HIGH SCHOOL',
      className: 'Class VI',
      subject: 'Mathematics',
      totalMarks: 70,
      timeAllowed: '2 Hours 30 Minutes',
      documentId: document.id,
      bookTitle: document.title,
      weightageMode: 'exact_marks',
      chaptersWeightage: initialWeights,
      sections: DEFAULT_SECTION_BLUEPRINTS,
      slots: [],
      paperHealth: this.computePaperHealth([], initialWeights, 70),
      status: 'configuring',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.savePaper(paper);
    return paper;
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
    mode: ChapterWeightage['marks'] extends number ? 'exact_marks' | 'percentage' | 'equal' : any
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

    updated.paperHealth = this.computePaperHealth(updated.slots, updatedWeights, 70);
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
      70
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
      const generated = await questionGenerationService.generateQuestion({
        documentId: paper.documentId,
        chapterId: slot.chapterId,
        questionType: slot.questionType,
        marks: slot.marks,
        difficulty: slot.difficulty,
        language: 'en', // Class VI math default
        additionalInstructions: `Strict Class VI Mathematics standards. Test conceptual accuracy and step-by-step working for ${slot.marks} mark(s). Include units and intermediate steps in marking scheme.`,
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

    const health = this.computePaperHealth(updatedSlots, paper.chaptersWeightage, 70);
    const finishedPaper: ClassVIExamPaper = {
      ...paper,
      slots: updatedSlots,
      paperHealth: health,
      status: health.isReady ? 'ready' : 'draft',
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

    const health = this.computePaperHealth(updatedSlots, paper.chaptersWeightage, 70);
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
   * Evaluates PAPER HEALTH comprehensively.
   * Total Marks 70/70, Question Counts, Chapter Checks, Answer Keys, Marking Schemes, Duplicates.
   */
  public computePaperHealth(
    slots: QuestionSlot[],
    chaptersWeightage: ChapterWeightage[],
    targetTotalMarks: number = 70
  ): PaperHealth {
    const includedChapters = chaptersWeightage.filter((c) => c.included && c.marks > 0);

    const actualTotalMarks = slots.reduce((acc, s) => {
      // If generated, use questionItem.marks, else use slot.marks
      return acc + (s.questionItem?.marks || s.marks || 0);
    }, 0);

    const expectedQuestions = slots.length;
    const actualQuestions = slots.filter((s) => s.status === 'generated' && s.questionItem).length;

    // Check every chapter's assigned marks vs expected
    const chapterChecks = includedChapters.map((cw) => {
      const chapterSlots = slots.filter((s) => s.chapterId === cw.chapter_id);
      const actualMarks = chapterSlots.reduce((acc, s) => acc + (s.questionItem?.marks || s.marks || 0), 0);
      return {
        chapterId: cw.chapter_id,
        chapterTitle: cw.chapter_title,
        expectedMarks: cw.marks,
        actualMarks,
        passed: actualMarks === cw.marks,
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

    for (const s of slots) {
      if (s.questionItem) {
        if (s.questionItem.answer?.answer_text?.trim()) answerKeysCount++;
        if (s.questionItem.answer?.marking_scheme?.length) markingSchemesCount++;

        const normText = s.questionItem.question_text.toLowerCase().trim();
        if (questionTexts.includes(normText)) {
          duplicateCount++;
        } else {
          questionTexts.push(normText);
        }

        if (!s.questionItem.source?.source_text) {
          sourceGroundingPassed = false;
        }
      }
    }

    const isReady =
      actualTotalMarks === targetTotalMarks &&
      expectedQuestions > 0 &&
      actualQuestions === expectedQuestions &&
      allChaptersPassed &&
      duplicateCount === 0 &&
      answerKeysCount === expectedQuestions &&
      markingSchemesCount === expectedQuestions;

    return {
      totalMarksExpected: targetTotalMarks,
      totalMarksActual: actualTotalMarks,
      totalQuestionsExpected: expectedQuestions,
      totalQuestionsActual: actualQuestions,
      chapterChecks,
      allChaptersPassed,
      answerKeysCount,
      markingSchemesCount,
      duplicateCount,
      sourceGroundingPassed,
      isReady,
    };
  }
}

export const examPaperService = new ExamPaperService();
