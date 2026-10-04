import { DocumentItem, Chapter, Topic, KnowledgeChunk, QuestionItem, QuestionFeedback, User } from '../types';
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
  CHAPTERS: 'ai_qpm_chapters',
  TOPICS: 'ai_qpm_topics',
  CHUNKS: 'ai_qpm_chunks',
  QUESTIONS: 'ai_qpm_questions',
  FEEDBACK: 'ai_qpm_feedback',
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
