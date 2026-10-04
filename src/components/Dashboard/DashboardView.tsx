import React from 'react';
import {
  UploadCloud,
  Sparkles,
  BookOpen,
  CheckCircle,
  FileQuestion,
  Layers,
  ArrowRight,
  Clock,
  ChevronRight,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import { DocumentItem, QuestionItem, User } from '../../types';

interface DashboardViewProps {
  user: User;
  documents: DocumentItem[];
  questions: QuestionItem[];
  onUploadClick: () => void;
  onGenerateClick: () => void;
  onOpenBook: (bookId: string) => void;
  onViewQuestions: () => void;
  onOpenQuestionReview: (question: QuestionItem) => void;
  onExamBuilderClick?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  documents,
  questions,
  onUploadClick,
  onGenerateClick,
  onOpenBook,
  onViewQuestions,
  onOpenQuestionReview,
  onExamBuilderClick,
}) => {
  const approvedQuestions = questions.filter((q) => q.status === 'approved');
  const totalChapters = documents.reduce(
    (acc, doc) => acc + (doc.detected_chapters_count || 0),
    0
  );

  const recentDocs = [...documents].slice(0, 3);
  const recentQuestions = [...questions].slice(0, 4);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              AI Question Paper Maker
            </h1>
            <span className="text-[11px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
              Beta MVP
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Your personal AI assessment assistant · Source-grounded question formulation
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Upload Textbook</span>
          </button>
          <button
            onClick={onGenerateClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Generate Question</span>
          </button>
        </div>
      </div>

      {/* Class VI Mathematics Mode Spotlight Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                Hard-Constraint Exam Module
              </span>
              <span className="text-xs font-semibold bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-md">
                Class: VI · Subject: Mathematics · Total: 70 Marks
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Class VI Summative Mathematics Question Paper (70 Marks)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Engineered for real school summative examinations. Chapter weightage is treated as a hard mathematical constraint that cannot be overridden by Gemini. Deterministic rules assign question slots, verify source textbook grounding, and await your strict approval.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Exact 70/70 Marks Lock
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Section A (10M), B (20M), C (24M), D (16M) · 32 Questions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Verified Textbook Source Grounding
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            {onExamBuilderClick && (
              <button
                onClick={onExamBuilderClick}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-slate-950" />
                <span>Open 70M Exam Builder</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Profile Card & Core Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Teacher Profile
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active"></span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg border border-slate-200">
                {user.name.charAt(0) || 'T'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{user.name}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Academic Board</span>
              <span className="font-semibold text-slate-700">
                {user.board || 'Not configured'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Preferred Language</span>
              <span className="font-semibold text-slate-700 capitalize">
                {user.preferred_language === 'bn' ? 'Bengali (বাংলা)' : user.preferred_language === 'bilingual' ? 'Bilingual' : 'English'}
              </span>
            </div>
          </div>
        </div>

        {/* Core Product Principle Card */}
        <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Core Assessment Principle</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2 tracking-tight">
              AI generates. Rules control. Teacher approves.
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every question is verified against real page numbers in your syllabus textbook.
              No hallucinations, no unverified facts. You remain in full control of difficulty, marks,
              marking scheme, and final curriculum approval.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              RAG Grounded
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              English + Bengali
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              Manual Chapter Calibrations
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Uploaded Books</span>
            <BookOpen className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{documents.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Syllabus textbooks in library</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Processed Chapters</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalChapters}</p>
          <p className="text-[11px] text-slate-500 mt-1">Indexed with page ranges</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Generated Questions</span>
            <FileQuestion className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{questions.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Formulated by AI RAG</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Approved Questions</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{approvedQuestions.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Saved to Question Bank</p>
        </div>
      </div>

      {/* Empty State when no books exist */}
      {documents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Textbooks Uploaded Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Upload your first textbook to start generating source-grounded questions.
          </p>
          <button
            onClick={onUploadClick}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Textbook</span>
          </button>
        </div>
      ) : (
        /* Recent Activity Section */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Uploaded Books */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span>Recently Uploaded Books</span>
              </h3>
              <button
                onClick={() => onOpenBook(recentDocs[0]?.id)}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onOpenBook(doc.id)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-slate-950">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{doc.detected_chapters_count} Chapters</span>
                      <span>·</span>
                      <span>{doc.page_count} Pages</span>
                      <span>·</span>
                      <span className="capitalize">{doc.language}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md capitalize">
                      {doc.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Generated Questions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Recently Generated Questions</span>
              </h3>
              <button
                onClick={onViewQuestions}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
              >
                View all
              </button>
            </div>

            {recentQuestions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No questions generated yet. Click Generate Question to create your first test item!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {recentQuestions.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => onOpenQuestionReview(q)}
                    className="py-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
                  >
                    <p className="text-xs font-medium text-slate-900 line-clamp-2 leading-relaxed">
                      {q.question_text}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 uppercase">
                          {q.question_type.replace(/_/g, ' ')}
                        </span>
                        <span>·</span>
                        <span>{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</span>
                        <span>·</span>
                        <span className="capitalize">{q.difficulty}</span>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                          q.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {q.status === 'approved'
                          ? 'Approved'
                          : q.status === 'rejected'
                          ? 'Rejected'
                          : 'AI Generated'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
