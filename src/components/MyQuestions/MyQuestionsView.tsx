import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Printer,
  Copy,
  Trash2,
  Edit2,
  Sparkles,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Layers,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import { QuestionItem, DocumentItem, Chapter } from '../../types';
import { QuestionCard } from '../QuestionReview/QuestionCard';
import { PrintPaperModal } from './PrintPaperModal';
import { storageService } from '../../services/storageService';

interface MyQuestionsViewProps {
  questions: QuestionItem[];
  documents: DocumentItem[];
  chapters: Chapter[];
  onNavigateToGenerate: () => void;
  onGenerateSimilar: (question: QuestionItem) => void;
  onRefreshQuestions: () => void;
}

export const MyQuestionsView: React.FC<MyQuestionsViewProps> = ({
  questions,
  documents,
  chapters,
  onNavigateToGenerate,
  onGenerateSimilar,
  onRefreshQuestions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookFilter, setSelectedBookFilter] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedMarksFilter, setSelectedMarksFilter] = useState('');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const [activePreviewQuestion, setActivePreviewQuestion] = useState<QuestionItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    // Search query
    if (searchQuery) {
      const matchText = q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAns = q.answer?.answer_text?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchChap = (q.chapter_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchText && !matchAns && !matchChap) return false;
    }

    if (selectedBookFilter && q.document_id !== selectedBookFilter) return false;
    if (selectedChapterFilter && q.chapter_id !== selectedChapterFilter) return false;
    if (selectedTypeFilter && q.question_type !== selectedTypeFilter) return false;
    if (selectedMarksFilter && q.marks !== Number(selectedMarksFilter)) return false;
    if (selectedDifficultyFilter && q.difficulty !== selectedDifficultyFilter) return false;
    if (selectedLanguageFilter && q.language !== selectedLanguageFilter) return false;
    if (selectedStatusFilter && q.status !== selectedStatusFilter) return false;

    return true;
  });

  const handleDuplicate = (q: QuestionItem) => {
    const duplicated: QuestionItem = {
      ...q,
      id: 'q-' + Date.now(),
      question_text: `[Duplicate] ${q.question_text}`,
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storageService.saveQuestion(duplicated);
    onRefreshQuestions();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this question from your Question Bank?')) {
      storageService.deleteQuestion(id);
      if (activePreviewQuestion?.id === id) {
        setActivePreviewQuestion(null);
      }
      onRefreshQuestions();
    }
  };

  const handleUpdate = (updated: QuestionItem) => {
    storageService.saveQuestion(updated);
    setActivePreviewQuestion(updated);
    onRefreshQuestions();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBookFilter('');
    setSelectedChapterFilter('');
    setSelectedTypeFilter('');
    setSelectedMarksFilter('');
    setSelectedDifficultyFilter('');
    setSelectedLanguageFilter('');
    setSelectedStatusFilter('');
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedBookFilter ||
    selectedChapterFilter ||
    selectedTypeFilter ||
    selectedMarksFilter ||
    selectedDifficultyFilter ||
    selectedLanguageFilter ||
    selectedStatusFilter
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Syllabus-grounded question repository with filters, answers, and print export
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {filteredQuestions.length > 0 && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Export Paper</span>
            </button>
          )}

          <button
            onClick={onNavigateToGenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Generate Question</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions, model answers, or chapters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {/* Book Filter */}
          <select
            value={selectedBookFilter}
            onChange={(e) => setSelectedBookFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px]"
          >
            <option value="">All Books</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>

          {/* Chapter Filter */}
          <select
            value={selectedChapterFilter}
            onChange={(e) => setSelectedChapterFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px]"
          >
            <option value="">All Chapters</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Question Type */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px]"
          >
            <option value="">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="short_answer">Short Answer</option>
            <option value="very_short_answer">Very Short</option>
            <option value="long_answer">Long Answer</option>
            <option value="numerical">Numerical</option>
            <option value="assertion_reason">Assertion-Reason</option>
            <option value="true_false">True / False</option>
            <option value="case_based">Case-Based</option>
          </select>

          {/* Marks */}
          <select
            value={selectedMarksFilter}
            onChange={(e) => setSelectedMarksFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px]"
          >
            <option value="">All Marks</option>
            <option value="1">1 Mark</option>
            <option value="2">2 Marks</option>
            <option value="3">3 Marks</option>
            <option value="4">4 Marks</option>
            <option value="5">5 Marks</option>
          </select>

          {/* Difficulty */}
          <select
            value={selectedDifficultyFilter}
            onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px]"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="difficult">Difficult</option>
          </select>

          {/* Language */}
          <select
            value={selectedLanguageFilter}
            onChange={(e) => setSelectedLanguageFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px]"
          >
            <option value="">All Languages</option>
            <option value="en">English</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="bilingual">Bilingual</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px]"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="ai_generated">AI Generated</option>
            <option value="edited">Edited</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Showing {filteredQuestions.length} of {questions.length} questions
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 cursor-pointer font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Questions Grid / List */}
      {filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 shadow-xs">
          <FileQuestion className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Questions Match Filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            {hasActiveFilters
              ? 'Try adjusting or resetting your filter criteria.'
              : 'Generate and approve your first syllabus question.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={onNavigateToGenerate}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Generate Question
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const dateStr = new Date(q.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Metadata Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 uppercase tracking-wide">
                        {q.question_type.replace(/_/g, ' ')}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">
                        {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{q.difficulty}</span>
                      <span>·</span>
                      <span className="capitalize">{q.chapter_name || q.source?.chapter_title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Created {dateStr}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          q.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : q.status === 'edited'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {q.status === 'approved'
                          ? 'Approved'
                          : q.status === 'rejected'
                          ? 'Rejected'
                          : q.status === 'edited'
                          ? 'Edited'
                          : 'AI Generated'}
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="py-3">
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed font-sans whitespace-pre-line">
                      {q.question_text}
                    </p>

                    {/* Source Tag */}
                    {q.source && (
                      <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>Source: Pages {q.source.page_start}–{q.source.page_end} ({q.source.book_title || q.book_name})</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Question Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActivePreviewQuestion(q)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open & Review</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onGenerateSimilar(q)}
                      title="Generate Similar"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(q)}
                      title="Duplicate Question"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(q.id)}
                      title="Delete Question"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Preview Modal for Selected Question */}
      {activePreviewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Question Details & Verification</h2>
              <button
                onClick={() => setActivePreviewQuestion(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <QuestionCard
              question={activePreviewQuestion}
              onApprove={(q) => handleUpdate({ ...q, status: 'approved' })}
              onEdit={handleUpdate}
              onRegenerate={() => {
                setActivePreviewQuestion(null);
                onGenerateSimilar(activePreviewQuestion);
              }}
              onReject={(reason, notes) => {
                storageService.saveFeedback({
                  id: 'fb-' + Date.now(),
                  question_id: activePreviewQuestion.id,
                  user_id: 'teacher-101',
                  action: 'reject',
                  rejection_reason: reason,
                  notes,
                  created_at: new Date().toISOString(),
                });
                handleUpdate({ ...activePreviewQuestion, status: 'rejected' });
              }}
            />
          </div>
        </div>
      )}

      {/* Printable Exam Paper Modal */}
      <PrintPaperModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        questions={filteredQuestions.filter((q) => q.status === 'approved' || q.status === 'edited')}
      />
    </div>
  );
};
