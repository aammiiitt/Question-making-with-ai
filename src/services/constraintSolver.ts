import { SectionBlueprint, ChapterWeightage, QuestionSlot, DifficultyLevel, QuestionType } from '../types';

export interface SolverSuggestion {
  type: 'chapter_adjustment' | 'blueprint_adjustment' | 'redistribute';
  title: string;
  description: string;
  actionLabel: string;
  applyAdjustment: () => {
    chapters?: { chapter_id: string; marks: number }[];
    sections?: SectionBlueprint[];
  };
}

export type SolverResult =
  | {
      success: true;
      slots: QuestionSlot[];
      errorMessage?: string;
      suggestions?: SolverSuggestion[];
    }
  | {
      success: false;
      slots: QuestionSlot[];
      errorMessage: string;
      suggestions?: SolverSuggestion[];
    };

export class ConstraintSolver {
  /**
   * Solves the question-slot allocation problem deterministically.
   * Maps each chapter's target marks to exact question slots across sections.
   */
  public solve(
    sections: SectionBlueprint[],
    chapters: ChapterWeightage[],
    targetTotalMarks: number = 70
  ): SolverResult {
    const includedChapters = chapters.filter((c) => c.included && c.marks > 0);

    // 1. Basic validation: sum of marks must equal targetTotalMarks
    const totalChapterMarks = includedChapters.reduce((acc, c) => acc + c.marks, 0);
    if (totalChapterMarks !== targetTotalMarks) {
      const diff = targetTotalMarks - totalChapterMarks;
      return {
        success: false,
        slots: [],
        errorMessage: `Total chapter marks (${totalChapterMarks}) does not equal required ${targetTotalMarks} marks. ${
          diff > 0 ? `${diff} marks remaining to allocate.` : `Reduce allocation by ${Math.abs(diff)} marks.`
        }`,
      };
    }

    if (includedChapters.length === 0) {
      return {
        success: false,
        slots: [],
        errorMessage: 'Please include at least one chapter in the examination.',
      };
    }

    // Check if sections represent the Benchmark V1 structure with sub-groups
    const hasGroups = sections.some((s) => s.groups && s.groups.length > 0);
    if (hasGroups) {
      return this.solveBenchmarkV1(sections, includedChapters, targetTotalMarks);
    }

    // 2. Tally available slots per mark denomination
    const denominationCounts: Record<number, number> = {};
    for (const sec of sections) {
      const mark = sec.marksPerQuestion;
      denominationCounts[mark] = (denominationCounts[mark] || 0) + sec.numberOfQuestions;
    }

    const availableMarks = Object.keys(denominationCounts)
      .map(Number)
      .sort((a, b) => b - a); // descending: [4, 3, 2, 1]

    // 3. Backtracking search to find an integer allocation matrix x[chapIndex][mark]
    // x[i][m] = number of questions of mark m assigned to chapter i
    const numChapters = includedChapters.length;
    const remainingDenoms = { ...denominationCounts };

    const allocationMatrix: Record<number, number>[] = Array.from(
      { length: numChapters },
      () => ({})
    );

    let bestSolution: Record<number, number>[] | null = null;
    let bestBalanceScore = Infinity;

    // Helper to find all integer partitions of targetM using availableMarks and remaining capacity
    function searchChapter(chapIndex: number): boolean {
      if (chapIndex === numChapters) {
        // Verify all section slots are fully utilized
        const allUsed = availableMarks.every((m) => (remainingDenoms[m] || 0) === 0);
        if (allUsed) {
          // Compute balance score: penalty for chapters having too few or too many questions
          let score = 0;
          for (let i = 0; i < numChapters; i++) {
            const qCount = Object.values(allocationMatrix[i]).reduce((a, b) => a + b, 0);
            score += Math.pow(qCount - 5, 2);
          }
          if (score < bestBalanceScore) {
            bestBalanceScore = score;
            bestSolution = allocationMatrix.map((row) => ({ ...row }));
          }
          return true;
        }
        return false;
      }

      const chapter = includedChapters[chapIndex];
      const targetMarks = chapter.marks;

      // Find combinations of (count_4, count_3, count_2, count_1) summing to targetMarks
      const validPartitions: Record<number, number>[] = [];

      function findPartitions(
        denomIdx: number,
        remainingMarks: number,
        currentCombo: Record<number, number>
      ) {
        if (remainingMarks === 0) {
          validPartitions.push({ ...currentCombo });
          return;
        }
        if (denomIdx >= availableMarks.length) return;

        const mark = availableMarks[denomIdx];
        const maxCanUse = Math.min(
          Math.floor(remainingMarks / mark),
          remainingDenoms[mark] || 0
        );

        // Try from high count to 0, favoring balanced variety
        for (let count = maxCanUse; count >= 0; count--) {
          currentCombo[mark] = count;
          findPartitions(denomIdx + 1, remainingMarks - count * mark, currentCombo);
        }
      }

      findPartitions(0, targetMarks, {});

      // Sort partitions so that chapters get a healthy variety of marks
      validPartitions.sort((a, b) => {
        const countA = Object.values(a).reduce((sum, v) => sum + v, 0);
        const countB = Object.values(b).reduce((sum, v) => sum + v, 0);
        return countA - countB;
      });

      for (const part of validPartitions) {
        // Check if current partition respects remainingDenoms
        let possible = true;
        for (const m of availableMarks) {
          if ((part[m] || 0) > (remainingDenoms[m] || 0)) {
            possible = false;
            break;
          }
        }
        if (!possible) continue;

        // Apply
        for (const m of availableMarks) {
          remainingDenoms[m] -= part[m] || 0;
        }
        allocationMatrix[chapIndex] = { ...part };

        const found = searchChapter(chapIndex + 1);
        if (found && bestSolution) {
          // Keep searching for a few alternatives or return if very balanced
          if (bestBalanceScore < 5) return true;
        }

        // Backtrack
        for (const m of availableMarks) {
          remainingDenoms[m] += part[m] || 0;
        }
        allocationMatrix[chapIndex] = {};
      }

      return bestSolution !== null;
    }

    const solved = searchChapter(0);

    if (!solved || !bestSolution) {
      // Generate intelligent suggestions
      const suggestions = this.generateSuggestions(sections, includedChapters);
      return {
        success: false,
        slots: [],
        errorMessage:
          'Your chapter weightage cannot be fitted exactly into the current question pattern.',
        suggestions,
      };
    }

    // 4. Construct concrete QuestionSlot array based on bestSolution
    const slots: QuestionSlot[] = [];
    let slotIndex = 1;

    // Distribute difficulty across slots: ~30% Easy, ~50% Moderate, ~20% Difficult
    const difficulties: DifficultyLevel[] = ['easy', 'moderate', 'moderate', 'difficult', 'easy'];

    for (const sec of sections) {
      const mark = sec.marksPerQuestion;
      const neededForSection = sec.numberOfQuestions;
      let allocatedForSection = 0;

      for (let cIdx = 0; cIdx < numChapters && allocatedForSection < neededForSection; cIdx++) {
        const chapter = includedChapters[cIdx];
        const count = bestSolution[cIdx][mark] || 0;

        for (let q = 0; q < count && allocatedForSection < neededForSection; q++) {
          const diffIndex = (slotIndex - 1) % difficulties.length;
          const assignedDifficulty =
            mark === 1 ? 'easy' : mark >= 4 ? 'difficult' : difficulties[diffIndex];

          let qType: QuestionType = sec.questionType;
          if (mark === 1) {
            // Mix of MCQ and Fill in Blank for 1 mark
            qType = slotIndex % 2 === 1 ? 'mcq' : 'very_short_answer';
          } else if (mark >= 4) {
            qType = 'long_answer';
          }

          slots.push({
            slotNumber: slotIndex++,
            sectionId: sec.id,
            sectionName: sec.name,
            chapterId: chapter.chapter_id,
            chapterTitle: chapter.chapter_title,
            marks: mark,
            questionType: qType,
            difficulty: assignedDifficulty,
            status: 'pending',
          });

          allocatedForSection++;
          bestSolution[cIdx][mark]--;
        }
      }
    }

    return {
      success: true,
      slots,
    };
  }

  /**
   * Solves the Benchmark V1 structure deterministically with Section A Q1-Q4 groups and optional choices.
   */
  private solveBenchmarkV1(
    sections: SectionBlueprint[],
    chapters: ChapterWeightage[],
    targetTotalMarks: number
  ): SolverResult {
    const slots: QuestionSlot[] = [];
    let slotIndex = 1;

    // Create weighted round-robin distribution of chapters
    const weightedChapters: ChapterWeightage[] = [];
    for (const c of chapters) {
      const weight = Math.max(1, Math.round((c.marks / targetTotalMarks) * 50));
      for (let w = 0; w < weight; w++) {
        weightedChapters.push(c);
      }
    }

    let chapCursor = 0;
    const nextChapter = () => {
      const chap = weightedChapters[chapCursor % weightedChapters.length];
      chapCursor++;
      return chap;
    };

    const difficulties: DifficultyLevel[] = ['easy', 'moderate', 'moderate', 'difficult', 'easy'];

    for (const sec of sections) {
      if (sec.groups && sec.groups.length > 0) {
        // Section with groups (e.g. Section A: Q1 MCQ, Q2 T/F, Q3 Fill in blanks, Q4 VSA)
        for (const grp of sec.groups) {
          const offered = grp.questionsOffered || 7;
          for (let q = 1; q <= offered; q++) {
            const chap = nextChapter();
            const romanLabels = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
            const subLabel = romanLabels[q - 1] || `(${q})`;

            slots.push({
              slotNumber: slotIndex++,
              sectionId: sec.id,
              sectionName: sec.name,
              groupId: grp.id,
              groupTitle: grp.title,
              subQuestionLabel: subLabel,
              chapterId: chap.chapter_id,
              chapterTitle: chap.chapter_title,
              marks: grp.marksPerQuestion || 1,
              questionType: grp.questionType,
              difficulty: q <= 3 ? 'easy' : q <= 6 ? 'moderate' : 'difficult',
              status: 'pending',
              isDerivedFromExercise: q % 5 !== 0, // Target >= 80% exercise derived
              isNumerical: ['fill_in_the_blank', 'very_short_answer', 'mcq'].includes(grp.questionType),
            });
          }
        }
      } else {
        // Standard section (e.g. Section B, Section C, Section D)
        const offered = sec.questionsOffered || sec.numberOfQuestions;
        const mark = sec.marksPerQuestion || 2;
        const romanLabels = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)', '(xi)', '(xii)'];

        for (let q = 1; q <= offered; q++) {
          const chap = nextChapter();
          const subLabel = romanLabels[q - 1] || `(${q})`;
          const diff = mark === 2 ? (q % 2 === 0 ? 'moderate' : 'easy') : mark === 3 ? 'moderate' : 'difficult';

          const isGeom = chap.chapter_title.toLowerCase().includes('geometr') || chap.chapter_title.toLowerCase().includes('shape');
          const isSubpart = mark === 2 && q % 3 === 0;

          slots.push({
            slotNumber: slotIndex++,
            sectionId: sec.id,
            sectionName: sec.name,
            subQuestionLabel: subLabel,
            chapterId: chap.chapter_id,
            chapterTitle: chap.chapter_title,
            marks: mark,
            questionType: sec.questionType || (mark >= 4 ? 'long_answer' : 'short_answer'),
            difficulty: diff,
            status: 'pending',
            isDerivedFromExercise: q % 5 !== 0, // Target >= 80% exercise derived
            isGeometryConstruction: isGeom && mark >= 3,
            hasDiagram: isGeom,
            isNumerical: true,
            subparts: isSubpart ? [
              { label: '(a)', marks: 1, text: 'Fundamental conceptual definition or rule' },
              { label: '(b)', marks: 1, text: 'Numerical problem application' },
            ] : undefined,
          });
        }
      }
    }

    return {
      success: true,
      slots,
    };
  }

  /**
   * Generates actionable suggestions for the teacher when chapter marks cannot fit blueprint.
   */
  private generateSuggestions(
    sections: SectionBlueprint[],
    chapters: ChapterWeightage[]
  ): SolverResult['suggestions'] {
    const suggestions: NonNullable<SolverResult['suggestions']> = [];

    // Suggestion A: Adjust odd/even parity in chapters
    if (chapters.length >= 2) {
      const c1 = chapters[0];
      const c2 = chapters[1];
      suggestions.push({
        type: 'chapter_adjustment',
        title: `Option A: Adjust "${c1.chapter_title}" from ${c1.marks} → ${c1.marks - 1}m and "${c2.chapter_title}" from ${c2.marks} → ${c2.marks + 1}m`,
        description: 'Transfers 1 mark between chapters to align with 2-mark and 3-mark question combinations.',
        actionLabel: 'Apply 1-mark transfer',
        applyAdjustment: () => ({
          chapters: [
            { chapter_id: c1.chapter_id, marks: c1.marks - 1 },
            { chapter_id: c2.chapter_id, marks: c2.marks + 1 },
          ],
        }),
      });
    }

    // Suggestion B: Blueprint adjustment (convert two 1m questions to one 2m, or adjust Section B)
    suggestions.push({
      type: 'blueprint_adjustment',
      title: 'Option B: Adapt Question Pattern (e.g. 12 × 1m, 8 × 2m, 8 × 3m, 4 × 4m)',
      description: 'Increases 1-mark questions to provide finer granularity for odd chapter mark allocations.',
      actionLabel: 'Adapt section pattern',
      applyAdjustment: () => ({
        sections: [
          {
            id: 'sec-a',
            name: 'Section A',
            description: 'Multiple Choice & Very Short Answer (1 mark each)',
            marksPerQuestion: 1,
            numberOfQuestions: 12,
            totalSectionMarks: 12,
            questionType: 'mcq',
          },
          {
            id: 'sec-b',
            name: 'Section B',
            description: 'Short Answer Type I (2 marks each)',
            marksPerQuestion: 2,
            numberOfQuestions: 9,
            totalSectionMarks: 18,
            questionType: 'short_answer',
          },
          {
            id: 'sec-c',
            name: 'Section C',
            description: 'Short Answer Type II (3 marks each)',
            marksPerQuestion: 3,
            numberOfQuestions: 8,
            totalSectionMarks: 24,
            questionType: 'short_answer',
          },
          {
            id: 'sec-d',
            name: 'Section D',
            description: 'Long Answer / Word Problem (4 marks each)',
            marksPerQuestion: 4,
            numberOfQuestions: 4,
            totalSectionMarks: 16,
            questionType: 'long_answer',
          },
        ],
      }),
    });

    // Suggestion C: Standard Equal Distribution
    const count = chapters.length;
    if (count > 0) {
      const base = Math.floor(70 / count);
      const rem = 70 % count;
      suggestions.push({
        type: 'redistribute',
        title: 'Option C: Equalize chapter weightage to standard multiples',
        description: `Distribute 70 marks evenly (${base} marks each with balance added to core chapters).`,
        actionLabel: 'Equalize Weightage',
        applyAdjustment: () => ({
          chapters: chapters.map((c, i) => ({
            chapter_id: c.chapter_id,
            marks: base + (i < rem ? 1 : 0),
          })),
        }),
      });
    }

    return suggestions;
  }
}

export const constraintSolver = new ConstraintSolver();
