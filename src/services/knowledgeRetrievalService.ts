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
  extractionConfidence?: number;
  extractionStatus?: string;
  extractionMethod?: string;
  printedPages?: number[];
  sourcePhysicalPages?: number[];
}

export class KnowledgeRetrievalService {
  /**
   * Retrieves top source passages grounded in the specified document and chapter.
   * CRITICAL ISSUE 7: Enforces strict safety gate.
   * Rejects chunks that are unverified, damaged, or below safe confidence threshold.
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
    const allChunks = storageService.getChunks(documentId, chapterId);

    // Strict Grounding Rule: If no real chunks exist for this chapter, do NOT fabricate text.
    if (allChunks.length === 0) {
      return [];
    }

    // CRITICAL ISSUE 7: QUESTION GENERATION SAFETY GATE
    // Only allow verified native content or successfully validated vision-recovered content.
    // Reject or exclude chunks when:
    // - extractionStatus === 'needs_review' OR 'failed'
    // - minimum source-page confidence is below the safe threshold (< 0.65)
    // - source pages contain unresolved damaging validation flags
    // - text contains severe [অস্পষ্ট] or [UNCERTAIN] markers
    const damagingFlags = new Set([
      'vertically_separated_digits',
      'gibberish_encoded_text',
      'corrupted_legacy_glyphs',
      'empty_page',
      'vision_failed',
    ]);

    const safeChunks = allChunks.filter((chunk) => {
      // Exclude failed or unverified material
      if (chunk.extraction_status === 'failed' || chunk.extraction_status === 'needs_review') {
        return false;
      }

      // Check safety confidence (minimum page confidence across chunk source pages)
      const safetyConfidence = chunk.minimum_page_confidence ?? chunk.extraction_confidence ?? 1.0;
      if (safetyConfidence < 0.65) {
        return false;
      }

      // Check for unresolved damaging validation flags
      if (chunk.validation_flags && chunk.validation_flags.some((flag) => damagingFlags.has(flag))) {
        return false;
      }

      // Check for illegible markers
      if (chunk.text.includes('[অস্পষ্ট]') || chunk.text.includes('[UNCERTAIN]')) {
        const markerCount = (chunk.text.match(/\[অস্পষ্ট\]|\[UNCERTAIN\]/g) || []).length;
        if (markerCount >= 2) {
          return false;
        }
      }

      return true;
    });

    // If no chunks pass the safety gate, return empty to prevent contaminated questions
    if (safeChunks.length === 0) {
      return [];
    }

    // 2. Compute relevance scores on safe chunks
    const queryTerms = [
      topicTitle || '',
      questionType || '',
      additionalInstructions || '',
    ]
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter((term) => term.length > 2);

    const scored = safeChunks.map((chunk) => {
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

      // Prefer verified native content and successfully validated vision content
      if (chunk.extraction_status === 'verified') {
        score += 0.10;
      } else if (chunk.extraction_status === 'vision_recovered') {
        score += 0.08;
      }

      // Weight by real safety confidence
      score = Math.min(1.0, score * (chunk.minimum_page_confidence ?? chunk.extraction_confidence ?? 0.9));

      return {
        chunkId: chunk.id,
        pageStart: chunk.page_start,
        pageEnd: chunk.page_end,
        text: chunk.text,
        relevanceScore: Number(score.toFixed(2)),
        contentType,
        extractionConfidence: chunk.extraction_confidence,
        extractionStatus: chunk.extraction_status,
        extractionMethod: chunk.extraction_method,
        printedPages: chunk.printed_pages,
        sourcePhysicalPages: chunk.source_physical_pages,
      };
    });

    // 3. Sort by relevance descending and take the top 2-3 most relevant chunks
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.slice(0, 3);
  }
}

export const knowledgeRetrievalService = new KnowledgeRetrievalService();
