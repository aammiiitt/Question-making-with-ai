import {
  DocumentItem,
  Chapter,
  Topic,
  KnowledgeChunk,
  QuestionItem,
  QuestionFeedback,
  User,
  PageCoverageRecord,
  ChapterDetectionDiagnostics,
} from '../types';
import { classifyPageCoverage } from '../utils/pageClassification';
import {
  DEMO_BOOK,
  DEMO_CHAPTERS,
  DEMO_TOPICS,
  DEMO_KNOWLEDGE_CHUNKS,
  DEMO_QUESTIONS,
  INITIAL_USER,
  CLASS_VI_MATH_BOOK,
  CLASS_VI_MATH_CHAPTERS,
  CLASS_VI_MATH_TOPICS,
  CLASS_VI_MATH_CHUNKS,
} from '../data/demoData';

const ALL_INITIAL_BOOKS = [DEMO_BOOK];
const ALL_INITIAL_CHAPTERS = [...DEMO_CHAPTERS];
const ALL_INITIAL_TOPICS = [...DEMO_TOPICS];
const ALL_INITIAL_CHUNKS = [...DEMO_KNOWLEDGE_CHUNKS];

const STORAGE_KEYS = {
  USER: 'ai_qpm_user',
  DOCUMENTS: 'ai_qpm_documents',
  DOCUMENT_PAGES: 'ai_qpm_document_pages',
  PAGE_COVERAGE: 'ai_qpm_page_coverage',
  CHAPTERS: 'ai_qpm_chapters',
  TOPICS: 'ai_qpm_topics',
  CHUNKS: 'ai_qpm_chunks',
  QUESTIONS: 'ai_qpm_questions',
  FEEDBACK: 'ai_qpm_feedback',
  CHAPTER_DIAGNOSTICS: 'ai_qpm_chapter_diagnostics',
};

class StorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  public getUser(): User {
    if (!this.isBrowser()) return INITIAL_USER;
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
      return INITIAL_USER;
    }
    return JSON.parse(data);
  }

  public updateUser(user: Partial<User>): User {
    const current = this.getUser();
    const updated = { ...current, ...user };
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    }
    return updated;
  }

  public getDocuments(): DocumentItem[] {
    if (!this.isBrowser()) return ALL_INITIAL_BOOKS;
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    let docs: DocumentItem[] = [];
    if (!data) {
      docs = ALL_INITIAL_BOOKS;
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    } else {
      docs = JSON.parse(data);
      // Remove any previously auto-injected hardcoded fake 'doc-class6-math' that is not a real upload
      const filtered = docs.filter((d) => d.id !== 'doc-class6-math');
      if (filtered.length !== docs.length) {
        docs = filtered;
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
      }
    }
    return docs;
  }

  /**
   * Returns real uploaded textbooks (excluding demo/sample material)
   */
  public getRealDocuments(): DocumentItem[] {
    return this.getDocuments().filter((d) => !d.is_demo);
  }

  public saveDocument(doc: DocumentItem): void {
    const docs = this.getDocuments();
    const index = docs.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.unshift(doc);
    }
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  }

  public deleteDocument(id: string): void {
    const docs = this.getDocuments().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    // also remove chapters, topics, chunks, and pages
    const chaps = this.getChapters().filter((c) => c.document_id !== id);
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chaps));
    const tops = this.getTopics().filter((t) => t.document_id !== id);
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(tops));
    const chunks = this.getChunks().filter((c) => c.document_id !== id);
    localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(chunks));
    if (this.isBrowser()) {
      try {
        const pagesStore = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENT_PAGES) || '{}');
        delete pagesStore[id];
        localStorage.setItem(STORAGE_KEYS.DOCUMENT_PAGES, JSON.stringify(pagesStore));
      } catch {
        // ignore
      }
    }
  }

  public saveDocumentPages(docId: string, pages: { pageNumber: number; text: string }[]): void {
    if (!this.isBrowser()) return;
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENT_PAGES) || '{}');
      store[docId] = pages;
      localStorage.setItem(STORAGE_KEYS.DOCUMENT_PAGES, JSON.stringify(store));
    } catch (e) {
      console.warn('Could not save full document pages to localStorage:', e);
    }
  }

  public getDocumentPages(docId: string): { pageNumber: number; text: string }[] {
    if (!this.isBrowser()) return [];
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENT_PAGES) || '{}');
      return store[docId] || [];
    } catch {
      return [];
    }
  }

  public savePageCoverage(docId: string, records: PageCoverageRecord[]): void {
    if (!this.isBrowser()) return;
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGE_COVERAGE) || '{}');
      store[docId] = records;
      localStorage.setItem(STORAGE_KEYS.PAGE_COVERAGE, JSON.stringify(store));
    } catch (e) {
      console.warn('Could not save page coverage records to localStorage:', e);
    }
  }

  public getPageCoverage(docId: string): PageCoverageRecord[] {
    if (!this.isBrowser()) return [];
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGE_COVERAGE) || '{}');
      if (store[docId] && Array.isArray(store[docId])) {
        return store[docId];
      }
    } catch {
      // ignore
    }

    // Compute dynamically from stored document pages if cached records don't exist
    const rawPages = this.getDocumentPages(docId);
    if (rawPages.length > 0) {
      const computed: PageCoverageRecord[] = rawPages.map((p) => {
        return classifyPageCoverage(p.pageNumber, p.text);
      });

      this.savePageCoverage(docId, computed);
      return computed;
    }

    // For demo books without raw pages, synthesize consistent coverage records
    const doc = this.getDocuments().find((d) => d.id === docId);
    if (doc && doc.is_demo && doc.page_count > 0) {
      const demoRecords: PageCoverageRecord[] = [];
      const total = doc.page_count;
      const attentionCount = doc.attention_pages_count || Math.min(4, total);
      const readCount = Math.max(0, total - attentionCount);
      for (let i = 1; i <= total; i++) {
        if (i <= readCount) {
          demoRecords.push(
            classifyPageCoverage(
              i,
              'Standard textbook instructional page containing definitions, theorems, worked examples, and comprehensive exercise problems for students to practice.'.repeat(3)
            )
          );
        } else {
          demoRecords.push(classifyPageCoverage(i, 'Diagram'));
        }
      }
      this.savePageCoverage(docId, demoRecords);
      return demoRecords;
    }

    return [];
  }

  public replaceChunksForDocument(docId: string, newChunks: KnowledgeChunk[]): void {
    const allChunks = this.getChunks().filter((c) => c.document_id !== docId);
    allChunks.push(...newChunks);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(allChunks));
    }
  }

  public getChapters(documentId?: string): Chapter[] {
    if (!this.isBrowser()) return ALL_INITIAL_CHAPTERS;
    const data = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
    let chapters: Chapter[] = [];
    if (!data) {
      chapters = ALL_INITIAL_CHAPTERS;
      localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
    } else {
      chapters = JSON.parse(data);
      // Remove any previously auto-injected hardcoded fake 'doc-class6-math' chapters
      const filtered = chapters.filter((c) => c.document_id !== 'doc-class6-math');
      if (filtered.length !== chapters.length) {
        chapters = filtered;
        localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
      }
    }
    return documentId ? chapters.filter((c) => c.document_id === documentId) : chapters;
  }

  public saveChapter(chapter: Chapter): void {
    const chapters = this.getChapters();
    const index = chapters.findIndex((c) => c.id === chapter.id);
    if (index >= 0) {
      chapters[index] = chapter;
    } else {
      chapters.push(chapter);
    }
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
  }

  public deleteChapter(id: string): void {
    const chapters = this.getChapters().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
  }

  /**
   * Authoritatively replaces all stored chapters for a document with the teacher-confirmed list.
   * 1. Removes ALL existing stored chapters belonging to that document.
   * 2. Stores ONLY the teacher-confirmed verifiedChapters.
   * 3. Removes topics belonging to deleted chapters where appropriate.
   * 4. Removes obsolete knowledge chunks before rebuilt chunks are saved.
   * 5. Preserves other documents completely.
   */
  public replaceChaptersForDocument(documentId: string, verifiedChapters: Chapter[]): void {
    if (!this.isBrowser()) return;

    // 1. Get existing chapters, identify deleted chapters for this document
    const allChapters = this.getChapters();
    const verifiedIds = new Set(verifiedChapters.map((c) => c.id));
    const deletedChapterIds = new Set(
      allChapters
        .filter((c) => c.document_id === documentId && !verifiedIds.has(c.id))
        .map((c) => c.id)
    );

    // 2. Remove ALL existing stored chapters belonging to this document & store ONLY verifiedChapters
    const preservedChapters = allChapters.filter((c) => c.document_id !== documentId);
    const updatedChapters = [...preservedChapters, ...verifiedChapters];
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(updatedChapters));

    // 3. Remove topics belonging to deleted chapters where appropriate
    if (deletedChapterIds.size > 0) {
      const allTopics = this.getTopics();
      const preservedTopics = allTopics.filter(
        (t) => !deletedChapterIds.has(t.chapter_id)
      );
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(preservedTopics));
    }

    // 4. Remove obsolete knowledge chunks belonging to this document or deleted chapters
    const allChunks = this.getChunks();
    const preservedChunks = allChunks.filter(
      (c) => c.document_id !== documentId && !deletedChapterIds.has(c.chapter_id)
    );
    localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(preservedChunks));
  }

  public getTopics(chapterId?: string): Topic[] {
    if (!this.isBrowser()) return ALL_INITIAL_TOPICS;
    const data = localStorage.getItem(STORAGE_KEYS.TOPICS);
    let topics: Topic[] = [];
    if (!data) {
      topics = ALL_INITIAL_TOPICS;
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
    } else {
      topics = JSON.parse(data);
      for (const initTop of ALL_INITIAL_TOPICS) {
        if (!topics.some((t) => t.id === initTop.id)) {
          topics.push(initTop);
        }
      }
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
    }
    return chapterId ? topics.filter((t) => t.chapter_id === chapterId) : topics;
  }

  public saveTopic(topic: Topic): void {
    const topics = this.getTopics();
    const index = topics.findIndex((t) => t.id === topic.id);
    if (index >= 0) {
      topics[index] = topic;
    } else {
      topics.push(topic);
    }
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  }

  public getChunks(documentId?: string, chapterId?: string): KnowledgeChunk[] {
    if (!this.isBrowser()) return DEMO_KNOWLEDGE_CHUNKS;
    const data = localStorage.getItem(STORAGE_KEYS.CHUNKS);
    let chunks: KnowledgeChunk[] = [];
    if (!data) {
      chunks = DEMO_KNOWLEDGE_CHUNKS;
      localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(chunks));
    } else {
      chunks = JSON.parse(data);
      // Auto-migrate: ensure all demo chunks exist in the stored array
      let updated = false;
      for (const demoChunk of DEMO_KNOWLEDGE_CHUNKS) {
        if (!chunks.some((c) => c.id === demoChunk.id)) {
          chunks.push(demoChunk);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(chunks));
      }
    }

    let filtered = chunks.filter((c) => {
      if (documentId && c.document_id !== documentId) return false;
      if (chapterId && c.chapter_id !== chapterId) return false;
      return true;
    });

    return filtered;
  }

  public saveChunk(chunk: KnowledgeChunk): void {
    const chunks = this.getChunks();
    const index = chunks.findIndex((c) => c.id === chunk.id);
    if (index >= 0) {
      chunks[index] = chunk;
    } else {
      chunks.push(chunk);
    }
    localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(chunks));
  }

  public getQuestions(): QuestionItem[] {
    if (!this.isBrowser()) return DEMO_QUESTIONS;
    const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEMO_QUESTIONS));
      return DEMO_QUESTIONS;
    }
    return JSON.parse(data);
  }

  public saveQuestion(question: QuestionItem): void {
    const questions = this.getQuestions();
    const index = questions.findIndex((q) => q.id === question.id);
    if (index >= 0) {
      questions[index] = { ...question, updated_at: new Date().toISOString() };
    } else {
      questions.unshift(question);
    }
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  }

  public deleteQuestion(id: string): void {
    const questions = this.getQuestions().filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  }

  public saveFeedback(feedback: QuestionFeedback): void {
    if (!this.isBrowser()) return;
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    const list: QuestionFeedback[] = data ? JSON.parse(data) : [];
    list.unshift(feedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(list));
  }

  public getFeedback(): QuestionFeedback[] {
    if (!this.isBrowser()) return [];
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    return data ? JSON.parse(data) : [];
  }

  public saveChapterDiagnostics(documentId: string, diag: ChapterDetectionDiagnostics): void {
    if (!this.isBrowser()) return;
    const key = `${STORAGE_KEYS.CHAPTER_DIAGNOSTICS}_${documentId}`;
    localStorage.setItem(key, JSON.stringify(diag));
  }

  public getChapterDiagnostics(documentId: string): ChapterDetectionDiagnostics | null {
    if (!this.isBrowser()) return null;
    const key = `${STORAGE_KEYS.CHAPTER_DIAGNOSTICS}_${documentId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  public resetAllToDemo(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([DEMO_BOOK]));
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(DEMO_CHAPTERS));
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(DEMO_TOPICS));
    localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(DEMO_KNOWLEDGE_CHUNKS));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEMO_QUESTIONS));
    localStorage.removeItem(STORAGE_KEYS.FEEDBACK);
  }

  public clearAllData(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.FEEDBACK);
  }
}

export const storageService = new StorageService();
