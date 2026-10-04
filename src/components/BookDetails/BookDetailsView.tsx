import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Languages,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DocumentItem, Chapter, Topic, KnowledgeChunk } from '../../types';

interface BookDetailsViewProps {
  document: DocumentItem;
  chapters: Chapter[];
  topics: Topic[];
  chunks: KnowledgeChunk[];
  onBack: () => void;
  onGenerateForChapter: (bookId: string, chapterId: string) => void;
  onSaveChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  onAddChapter: (newChap: Partial<Chapter>) => void;
}

export const BookDetailsView: React.FC<BookDetailsViewProps> = ({
  document,
  chapters,
  topics,
  chunks,
  onBack,
  onGenerateForChapter,
  onSaveChapter,
  onDeleteChapter,
  onAddChapter,
}) => {
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartPage, setEditStartPage] = useState<number>(1);
  const [editEndPage, setEditEndPage] = useState<number>(10);

  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartPage, setNewStartPage] = useState<number>(1);
  const [newEndPage, setNewEndPage] = useState<number>(15);

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  const startEdit = (chap: Chapter) => {
    setEditingChapterId(chap.id);
    setEditTitle(chap.title);
    setEditStartPage(chap.page_start);
    setEditEndPage(chap.page_end);
  };

  const handleSaveEdit = (chap: Chapter) => {
    if (!editTitle.trim()) return;
    onSaveChapter({
      ...chap,
      title: editTitle.trim(),
      page_start: Number(editStartPage),
      page_end: Number(editEndPage),
      status: 'verified',
    });
    setEditingChapterId(null);
  };

  const handleCreateNew = () => {
    if (!newTitle.trim()) return;
    onAddChapter({
      document_id: document.id,
      title: newTitle.trim(),
      chapter_number: chapters.length + 1,
      page_start: Number(newStartPage),
      page_end: Number(newEndPage),
      status: 'custom',
    });
    setIsAddingChapter(false);
    setNewTitle('');
  };

  const dateStr = new Date(document.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Library</span>
      </button>

      {/* Book Metadata Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Textbook Specification
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md capitalize">
                {document.status}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {document.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              File: {document.file_name} · {(document.file_size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>

          <button
            onClick={() => onGenerateForChapter(document.id, chapters[0]?.id || '')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Generate From Book</span>
          </button>
        </div>

        {/* 4-Stat Line */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Pages</span>
            <span className="font-semibold text-slate-900 text-sm">{document.page_count} Pages</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Language</span>
            <span className="font-semibold text-slate-900 text-sm">{document.language}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Detected Chapters</span>
            <span className="font-semibold text-slate-900 text-sm">{chapters.length} Chapters</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Uploaded Date</span>
            <span className="font-semibold text-slate-900 text-sm">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Manual Correction Notice Box */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-950">Teacher Calibration & Chapter Verification</p>
          <p className="mt-0.5 leading-relaxed text-amber-800 text-[11px]">
            AI chapter detection provides initial estimates from tables of contents. You can edit chapter titles, correct page ranges, delete inaccurate chapters, or add missing ones before generating test items.
          </p>
        </div>
      </div>

      {/* Detected Chapters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Detected Chapters</h2>
            <p className="text-xs text-slate-500">
              Select any chapter to generate syllabus-grounded questions
            </p>
          </div>
          {!isAddingChapter && (
            <button
              onClick={() => setIsAddingChapter(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Add Missing Chapter</span>
            </button>
          )}
        </div>

        {/* Add Chapter Form */}
        {isAddingChapter && (
          <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Add New Chapter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Chapter Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chemical Reactions and Equations"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Start Page
                  </label>
                  <input
                    type="number"
                    value={newStartPage}
                    onChange={(e) => setNewStartPage(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    End Page
                  </label>
                  <input
                    type="number"
                    value={newEndPage}
                    onChange={(e) => setNewEndPage(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddingChapter(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Save Chapter
              </button>
            </div>
          </div>
        )}

        {/* Chapters List */}
        <div className="space-y-3">
          {chapters.map((chap, idx) => {
            const isEditing = editingChapterId === chap.id;
            const chapTopics = topics.filter((t) => t.chapter_id === chap.id);
            const chapChunks = chunks.filter((c) => c.chapter_id === chap.id);
            const isExpanded = expandedChapterId === chap.id;

            return (
              <div
                key={chap.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 transition-all"
              >
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Chapter Title
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 font-semibold text-slate-900"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Start Page
                          </label>
                          <input
                            type="number"
                            value={editStartPage}
                            onChange={(e) => setEditStartPage(Number(e.target.value))}
                            className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            End Page
                          </label>
                          <input
                            type="number"
                            value={editEndPage}
                            onChange={(e) => setEditEndPage(Number(e.target.value))}
                            className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingChapterId(null)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(chap)}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Update Chapter</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Chapter View */
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              {chap.title}
                            </h3>
                            {chap.status === 'verified' && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="font-medium text-slate-700">
                              Pages {chap.page_start}–{chap.page_end}
                            </span>
                            <span>·</span>
                            <span>{chapTopics.length || chap.topics_count || 3} Extracted Topics</span>
                            <span>·</span>
                            <span>{chapChunks.length} Knowledge Chunks</span>
                          </div>
                        </div>
                      </div>

                      {/* Chapter Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => onGenerateForChapter(document.id, chap.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Generate Question</span>
                        </button>

                        <button
                          onClick={() => startEdit(chap)}
                          title="Rename or Correct Page Range"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remove chapter "${chap.title}"?`)) {
                              onDeleteChapter(chap.id);
                            }
                          }}
                          title="Delete Chapter"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            setExpandedChapterId(isExpanded ? null : chap.id)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="View Topics"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Topics & Knowledge Chunks Preview */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                        <span className="font-semibold text-slate-600 block mb-2">
                          Extracted Chapter Topics & Concepts:
                        </span>
                        {chapTopics.length === 0 ? (
                          <p className="text-slate-400 italic">No subtopics defined yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {chapTopics.map((top) => (
                              <div
                                key={top.id}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                <span className="truncate">{top.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
