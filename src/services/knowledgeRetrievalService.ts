import { KnowledgeChunk, QuestionType, SourceContentType } from '../types';
import { storageService } from './storageService';
import { classifySourceContent } from '../utils/sourceClassification';

export interface RetrievedPassage {
  chunkId: string;
  pageStart: number;
  pageEnd: number;
  text: string;
  relevanceScore: number;
  contentType: SourceContentType;
}

export class KnowledgeRetrievalService {
  /**
   * Retrieves top source passages grounded in the specified document and chapter.
   * Requirement 4: When preferExercise is true:
   * 1. Prefers chunks/passages classified as exercise.
   * 2. If suitable exercise content exists, uses it.
   * 3. If no suitable exercise content exists, uses another valid textbook source.
   * 4. Keeps its real classification.
   * 5. Never invents an exercise source.
   */
  public async retrieveRelevantPassages(
    documentId: string,
    chapterId: string,
    topicId?: string,
    topicTitle?: string,
    questionType?: QuestionType,
    additionalInstructions?: string,
    preferExercise?: boolean
  ): Promise<RetrievedPassage[]> {
    // 1. Filter chunks by document + chapter
    const chunks = storageService.getChunks(documentId, chapterId);

    // Strict Grounding Rule: If no real chunks exist for this chapter, do NOT fabricate text.
    if (chunks.length === 0) {
      return [];
    }

    // 2. Compute relevance scores
    const queryTerms = [
      topicTitle || '',
      questionType || '',
      additionalInstructions || '',
    ]
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter((term) => term.length > 2);

    const scored = chunks.map((chunk) => {
      let score = 0.5; // base score

      // Real source content classification on chunk text
      const contentType = classifySourceContent(chunk.text);

      // Requirement 4: Exercise-preferred retrieval
      if (preferExercise && contentType === 'exercise') {
        score += 0.40;
      }

      // If chunk is explicitly tagged with the chosen topic
      if (topicId && chunk.topic_id === topicId) {
        score += 0.35;
      }

      const chunkLower = chunk.text.toLowerCase();
      // Match query terms
      for (const term of queryTerms) {
        if (chunkLower.includes(term)) {
          score += 0.08;
        }
      }

      // Bonus for high extraction confidence
      score = Math.min(1.0, score * (chunk.extraction_confidence || 0.9));

      return {
        chunkId: chunk.id,
        pageStart: chunk.page_start,
        pageEnd: chunk.page_end,
        text: chunk.text,
        relevanceScore: Number(score.toFixed(2)),
        contentType,
      };
    });

    // 3. Sort by relevance descending and take the top 2-3 most relevant chunks
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.slice(0, 3);
  }
}

export const knowledgeRetrievalService = new KnowledgeRetrievalService();
