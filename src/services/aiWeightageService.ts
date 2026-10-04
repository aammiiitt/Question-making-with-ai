import { DocumentItem, Chapter, KnowledgeChunk, ChapterAIAnalysis } from '../types';
import { storageService } from './storageService';

export class AIWeightageService {
  /**
   * Analyzes selected chapters using Gemini (evaluating the 5 academic factors)
   * and deterministically allocates integer marks using the largest-remainder method.
   *
   * 5 Factors (Total 100%):
   * 1. Effective Content Volume / Page Coverage (30%)
   * 2. Mathematical / Foundational Importance (30%)
   * 3. Relationship to Other Chapters (20%)
   * 4. Skill & Problem-Solving Breadth (15%)
   * 5. Assessment Richness (5%)
   */
  public async analyzeChapters(
    document: DocumentItem,
    selectedChapters: Chapter[]
  ): Promise<ChapterAIAnalysis[]> {
    if (!selectedChapters || selectedChapters.length === 0) {
      return [];
    }

    // 1. Gather real extracted text from chunks for each selected chapter
    const chaptersPayload = selectedChapters.map((chap) => {
      const realChunks = storageService.getChunks(document.id, chap.id);
      const sampleText = realChunks
        .map((c) => c.text)
        .join('\n\n')
        .slice(0, 2000);

      const topics = storageService.getTopics(chap.id);

      return {
        chapter_id: chap.id,
        chapter_title: chap.title,
        chapter_number: chap.chapter_number,
        page_start: chap.page_start,
        page_end: chap.page_end,
        topics: topics.map((t) => t.title),
        sample_text: sampleText,
      };
    });

    let aiResults: any[] = [];

    try {
      const response = await fetch('/api/analyze-chapter-weightage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle: document.title,
          selectedChapters: chaptersPayload,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
          aiResults = data.chapters;
        }
      }
    } catch (err) {
      console.warn('Backend analyze-chapter-weightage failed, using local academic heuristic:', err);
    }

    // 2. If AI call failed or returned incomplete data, compute academic rubric scores
    const analyses: Omit<ChapterAIAnalysis, 'raw_marks' | 'final_marks'>[] = selectedChapters.map((chap) => {
      const match = aiResults.find((r) => r.chapter_id === chap.id);
      const rawPages = Math.max(1, (chap.page_end - chap.page_start) + 1);

      if (match) {
        // Compute overall score from the 5 factors
        const pv = Math.max(0, Math.min(100, Number(match.page_volume_score) || 70));
        const imp = Math.max(0, Math.min(100, Number(match.importance_score) || 75));
        const rel = Math.max(0, Math.min(100, Number(match.chapter_relationship_score) || 70));
        const skl = Math.max(0, Math.min(100, Number(match.skill_breadth_score) || 70));
        const ass = Math.max(0, Math.min(100, Number(match.assessment_richness_score) || 70));

        const overall = Number((0.30 * pv + 0.30 * imp + 0.20 * rel + 0.15 * skl + 0.05 * ass).toFixed(1));

        return {
          chapter_id: chap.id,
          chapter_title: chap.title,
          effective_pages: Number(match.effective_pages) || rawPages,
          page_volume_score: pv,
          importance_score: imp,
          chapter_relationship_score: rel,
          skill_breadth_score: skl,
          assessment_richness_score: ass,
          overall_score: overall,
          importance_label: match.importance_label || 'High',
          short_reason: match.short_reason || `Foundational Class VI unit covering essential properties and problem solving in ${chap.title}.`,
          factor_notes: match.factor_notes || {
            content_volume: `Covers ${rawPages} instructional pages with standard exercise problems.`,
            foundational_importance: `Core numeracy and syllabus requirement for Class VI.`,
            inter_chapter_relevance: `Provides conceptual prerequisites for advanced topics.`,
            problem_solving_breadth: `Supports computation and step-by-step applications.`,
            assessment_richness: `Provides rich variety of 1M, 2M, 3M and 4M questions.`,
          },
        };
      }

      // Academic Rubric Heuristic
      const titleLower = chap.title.toLowerCase();
      let impScore = 75;
      let impLabel: ChapterAIAnalysis['importance_label'] = 'High';

      if (titleLower.includes('fraction') || titleLower.includes('integer') || titleLower.includes('geometry')) {
        impScore = 90;
        impLabel = 'Essential Foundation';
      } else if (titleLower.includes('algebra') || titleLower.includes('mensuration') || titleLower.includes('decimal')) {
        impScore = 84;
        impLabel = 'High';
      } else if (titleLower.includes('ratio') || titleLower.includes('shape')) {
        impScore = 76;
        impLabel = 'Moderate';
      }

      const pvScore = Math.min(95, Math.max(55, Math.round(50 + rawPages * 2)));
      const relScore = impScore >= 85 ? 85 : 72;
      const sklScore = 78;
      const assScore = 80;
      const overall = Number((0.30 * pvScore + 0.30 * impScore + 0.20 * relScore + 0.15 * sklScore + 0.05 * assScore).toFixed(1));

      return {
        chapter_id: chap.id,
        chapter_title: chap.title,
        effective_pages: rawPages,
        page_volume_score: pvScore,
        importance_score: impScore,
        chapter_relationship_score: relScore,
        skill_breadth_score: sklScore,
        assessment_richness_score: assScore,
        overall_score: overall,
        importance_label: impLabel,
        short_reason: `Foundational Class VI syllabus unit with ${rawPages} effective pages and high assessment richness.`,
        factor_notes: {
          content_volume: `Contains ${rawPages} physical textbook pages with instructional theory and exercises.`,
          foundational_importance: `Fundamental conceptual maturity for Class VI level assessment.`,
          inter_chapter_relevance: `Strong conceptual link with arithmetic, algebraic and geometrical modules.`,
          problem_solving_breadth: `Supports calculation, reasoning, and multi-step problem solving.`,
          assessment_richness: `Supports multiple question denominations (1M, 2M, 3M, 4M).`,
        },
      };
    });

    // 3. Phase 11: Largest Remainder (Hare-Niemeyer) Deterministic 70-Mark Allocation
    return this.allocateDeterministicMarks(analyses, 70);
  }

  /**
   * Deterministically maps chapter overall scores to exact 70 integer marks using Largest Remainder.
   * Ensures sum(final_marks) === 70 exactly.
   * Guarantees a minimum representation of 2 marks per chapter where mathematically possible.
   */
  public allocateDeterministicMarks(
    analyses: Omit<ChapterAIAnalysis, 'raw_marks' | 'final_marks'>[],
    targetTotal: number = 70
  ): ChapterAIAnalysis[] {
    const numChapters = analyses.length;
    if (numChapters === 0) return [];

    const totalScore = analyses.reduce((sum, a) => sum + Math.max(1, a.overall_score), 0);

    // Compute raw shares and raw marks
    const rawAllocations = analyses.map((a) => {
      const share = Math.max(1, a.overall_score) / totalScore;
      const rawMarks = share * targetTotal;
      return {
        analysis: a,
        share,
        rawMarks,
      };
    });

    // Step A: Base marks with minimum representation
    // If numChapters * 2 <= targetTotal, give minimum 2 marks per chapter
    const minPerChap = numChapters * 2 <= targetTotal ? 2 : 1;

    let baseTotal = 0;
    const items = rawAllocations.map((item) => {
      const base = Math.max(minPerChap, Math.floor(item.rawMarks));
      baseTotal += base;
      return {
        ...item,
        base,
        remainder: item.rawMarks - base,
        finalMarks: base,
      };
    });

    // If sum of base marks exceeds targetTotal (e.g. many chapters), revert to standard floor
    if (baseTotal > targetTotal) {
      baseTotal = 0;
      for (const item of items) {
        item.base = Math.max(1, Math.floor(item.rawMarks));
        baseTotal += item.base;
        item.remainder = item.rawMarks - item.base;
        item.finalMarks = item.base;
      }
    }

    // Step B: Distribute remaining marks to items with largest remainder
    let remainingMarks = targetTotal - baseTotal;

    // Sort by remainder descending
    const sortedIndices = items
      .map((item, idx) => ({ idx, remainder: item.remainder }))
      .sort((a, b) => b.remainder - a.remainder);

    let rank = 0;
    while (remainingMarks > 0 && rank < sortedIndices.length) {
      const targetIdx = sortedIndices[rank % sortedIndices.length].idx;
      items[targetIdx].finalMarks += 1;
      remainingMarks--;
      rank++;
    }

    // In case baseTotal was somehow > targetTotal (excess marks), reduce from lowest remainder
    while (remainingMarks < 0) {
      const targetIdx = sortedIndices[sortedIndices.length - 1 - (Math.abs(remainingMarks) % sortedIndices.length)].idx;
      if (items[targetIdx].finalMarks > 1) {
        items[targetIdx].finalMarks -= 1;
        remainingMarks++;
      }
    }

    // Return finalized list
    return items.map((item) => ({
      ...item.analysis,
      raw_marks: Number(item.rawMarks.toFixed(2)),
      final_marks: item.finalMarks,
    }));
  }
}

export const aiWeightageService = new AIWeightageService();
