import React, { useState, useEffect } from 'react';
import { Navigation, ActiveTab } from './components/Navigation';
import { DashboardView } from './components/Dashboard/DashboardView';
import { LibraryView } from './components/Library/LibraryView';
import { BookDetailsView } from './components/BookDetails/BookDetailsView';
import { GenerateView } from './components/Generate/GenerateView';
import { MyQuestionsView } from './components/MyQuestions/MyQuestionsView';
import { SettingsView } from './components/Settings/SettingsView';
import { UploadModal } from './components/UploadModal';
import { storageService } from './services/storageService';
import {
  User,
  DocumentItem,
  Chapter,
  Topic,
  KnowledgeChunk,
  QuestionItem,
} from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [user, setUser] = useState<User>(storageService.getUser());
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedBookIdForDetails, setSelectedBookIdForDetails] = useState<string | null>(null);

  // Quick generate navigation state
  const [preselectedBookId, setPreselectedBookId] = useState<string | undefined>();
  const [preselectedChapterId, setPreselectedChapterId] = useState<string | undefined>();

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const refreshData = () => {
    setUser(storageService.getUser());
    setDocuments(storageService.getDocuments());
    setQuestions(storageService.getQuestions());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenBook = (bookId: string) => {
    setSelectedBookIdForDetails(bookId);
    setActiveTab('book_details');
  };

  const handleDeleteBook = (bookId: string) => {
    storageService.deleteDocument(bookId);
    refreshData();
    showToast('Textbook deleted from library.', 'info');
  };

  const handleProcessAgain = (book: DocumentItem) => {
    setIsUploadOpen(true);
  };

  const handleGenerateForChapter = (bookId: string, chapterId: string) => {
    setPreselectedBookId(bookId);
    setPreselectedChapterId(chapterId);
    setActiveTab('generate');
  };

  const handleQuestionApproved = (q: QuestionItem) => {
    refreshData();
    showToast('Question approved and saved to Question Bank!');
  };

  const handleGenerateSimilarFromBank = (q: QuestionItem) => {
    setPreselectedBookId(q.document_id);
    setPreselectedChapterId(q.chapter_id);
    setActiveTab('generate');
    showToast(`Configuring generation targeting chapter "${q.chapter_name || 'Selected Chapter'}"`, 'info');
  };

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    refreshData();
    setSelectedBookIdForDetails(newDoc.id);
    setActiveTab('book_details');
    showToast(`"${newDoc.title}" processed with ${newDoc.detected_chapters_count} detected chapters.`);
  };

  const handleResetData = () => {
    storageService.resetAllToDemo();
    refreshData();
    showToast('Reset to demo textbook (Class X Physical Science).');
  };

  const handleClearAllData = () => {
    storageService.clearAllData();
    refreshData();
    showToast('All textbooks and questions cleared.', 'info');
  };

  // Selected Book for Book Details view
  const currentBook = documents.find((d) => d.id === selectedBookIdForDetails) || documents[0];
  const currentChapters = currentBook ? storageService.getChapters(currentBook.id) : [];
  const currentTopics = currentBook ? storageService.getTopics() : [];
  const currentChunks = currentBook ? storageService.getChunks(currentBook.id) : [];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col md:flex-row antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Navigation (Sidebar on Desktop, Bottom Bar on Mobile) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'generate') {
            // Keep existing preselection if set
          }
        }}
        user={user}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pb-20 md:pb-12 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={user}
              documents={documents}
              questions={questions}
              onUploadClick={() => setIsUploadOpen(true)}
              onGenerateClick={() => {
                setPreselectedBookId(documents[0]?.id);
                setActiveTab('generate');
              }}
              onOpenBook={handleOpenBook}
              onViewQuestions={() => setActiveTab('questions')}
              onOpenQuestionReview={(q) => {
                setActiveTab('questions');
              }}
            />
          )}

          {activeTab === 'library' && (
            <LibraryView
              documents={documents}
              onUploadClick={() => setIsUploadOpen(true)}
              onOpenBook={handleOpenBook}
              onDeleteBook={handleDeleteBook}
              onProcessAgain={handleProcessAgain}
            />
          )}

          {activeTab === 'book_details' && currentBook && (
            <BookDetailsView
              document={currentBook}
              chapters={currentChapters}
              topics={currentTopics}
              chunks={currentChunks}
              onBack={() => setActiveTab('library')}
              onGenerateForChapter={handleGenerateForChapter}
              onSaveChapter={(chap) => {
                storageService.saveChapter(chap);
                refreshData();
                showToast(`Chapter "${chap.title}" updated.`);
              }}
              onDeleteChapter={(chapId) => {
                storageService.deleteChapter(chapId);
                refreshData();
                showToast('Chapter removed.', 'info');
              }}
              onAddChapter={(newChap) => {
                storageService.saveChapter(newChap as Chapter);
                refreshData();
                showToast(`Added chapter "${newChap.title}".`);
              }}
            />
          )}

          {activeTab === 'generate' && (
            <GenerateView
              documents={documents}
              preselectedBookId={preselectedBookId}
              preselectedChapterId={preselectedChapterId}
              onQuestionApproved={handleQuestionApproved}
              onNavigateToUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeTab === 'questions' && (
            <MyQuestionsView
              questions={questions}
              documents={documents}
              chapters={storageService.getChapters()}
              onNavigateToGenerate={() => setActiveTab('generate')}
              onGenerateSimilar={handleGenerateSimilarFromBank}
              onRefreshQuestions={refreshData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              onUpdateUser={(updated) => {
                const u = storageService.updateUser(updated);
                setUser(u);
                showToast('Profile updated.');
              }}
              onResetData={handleResetData}
              onClearAllData={handleClearAllData}
            />
          )}
        </div>
      </main>

      {/* Upload PDF Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
