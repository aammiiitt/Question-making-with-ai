import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, BookOpen, Save, Plus, Trash2, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { Chapter, DocumentItem } from '../../types';
import { storageService } from '../../services/storageService';

interface ChapterVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  chapters: Chapter[];
  onConfirmMapping: (updatedChapters: Chapter[]) => Promise<void>;
}

export const ChapterVerificationModal: React.FC<ChapterVerificationModalProps> = ({
  isOpen,
  onClose,
  document,
  chapters,
  onConfirmMapping,
}) => {
  const [editedChapters, setEditedChapters] = useState<Chapter[]>(() =>
    chapters.length > 0
      ? chapters.map((c) => ({ ...c }))
      : [
          {
            id: `chap-${document.id}-1`,
            document_id: document.id,
            title: 'Chapter 1',
            chapter_number: 1,
            page_start: 1,
            page_end: Math.min(20, document.page_count || 30),
            topics_count: 3,
            status: 'needs_review',
          },
        ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = (index: number, field: keyof Chapter, val: any) => {
    setEditedChapters((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddChapter = () => {
    const nextNum = editedChapters.length + 1;
    const lastChapter = editedChapters[editedChapters.length - 1];
    const newStart = lastChapter ? lastChapter.page_end + 1 : 1;
    const newEnd = Math.min(document.page_count || 200, newStart + 15);

    const newChap: Chapter = {
      id: `chap-${document.id}-${Date.now()}-${nextNum}`,
      document_id: document.id,
      title: `Chapter ${nextNum}`,
      chapter_number: nextNum,
      page_start: newStart,
      page_end: Math.max(newStart, newEnd),
      topics_count: 3,
      status: 'custom',
    };

    setEditedChapters([...editedChapters, newChap]);
  };

  const handleRemoveChapter = (index: number) => {
    if (editedChapters.length <= 1) return;
    setEditedChapters(editedChapters.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    setErrorMsg(null);

    // Validate page numbers
    for (const c of editedChapters) {
      if (!c.title.trim()) {
        setErrorMsg('Every chapter must have a valid title.');
        return;
      }
      if (c.page_start < 1) {
        setErrorMsg(`"${c.title}" start page must be at least 1.`);
        return;
      }
      if (c.page_end < c.page_start) {
        setErrorMsg(`"${c.title}" end page (${c.page_end}) cannot be less than start page (${c.page_start}).`);
        return;
      }
      if (document.page_count && c.page_end > document.page_count) {
        setErrorMsg(
          `"${c.title}" end page (${c.page_end}) exceeds total PDF physical pages (${document.page_count}).`
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const verified = editedChapters.map((c, idx) => ({
        ...c,
        chapter_number: idx + 1,
        status: 'verified' as const,
      }));

      await onConfirmMapping(verified);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save verified chapter mappings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-900" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Verify Textbook Chapters & Physical PDF Pages
              </h2>
              <p className="text-xs text-slate-500">
                Textbook: <span className="font-semibold text-slate-800">{document.title}</span> ({document.page_count} Physical Pages)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Physical PDF vs Print Page Warning */}
        <div className="mt-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block text-amber-900">Important Physical Page Alignment:</span>
            Printed textbook page numbers often differ from physical PDF page numbers by 4–12 pages due to front cover, title sheets, and prefaces. Verify each chapter's <strong>physical PDF start and end page</strong> numbers below so question source citations and knowledge chunks correspond to the actual pages.
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Chapters Table */}
        <div className="mt-4 flex-1 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-[11px] text-slate-600 uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Chapter Title</th>
                <th className="py-2.5 px-3 w-32 text-center">Physical Start PDF Page</th>
                <th className="py-2.5 px-3 w-32 text-center">Physical End PDF Page</th>
                <th className="py-2.5 px-3 w-28 text-center">Effective Pages</th>
                <th className="py-2.5 px-3 w-24 text-center">Status</th>
                <th className="py-2.5 px-3 w-14 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {editedChapters.map((chap, idx) => {
                const effective = Math.max(1, (chap.page_end - chap.page_start) + 1);
                return (
                  <tr key={chap.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={chap.title}
                        onChange={(e) => handleUpdate(idx, 'title', e.target.value)}
                        placeholder="e.g. Integers"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={document.page_count || 1000}
                        value={chap.page_start}
                        onChange={(e) => handleUpdate(idx, 'page_start', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min={chap.page_start}
                        max={document.page_count || 1000}
                        value={chap.page_end}
                        onChange={(e) => handleUpdate(idx, 'page_end', Math.max(chap.page_start, parseInt(e.target.value) || chap.page_start))}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                      {effective} {effective === 1 ? 'page' : 'pages'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        chap.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {chap.status === 'verified' ? 'Verified' : 'Detected'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveChapter(idx)}
                        disabled={editedChapters.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer p-1"
                        title="Remove chapter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Toolbar & Add Chapter */}
        <div className="mt-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleAddChapter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Chapter</span>
          </button>

          <span className="text-[11px] text-slate-500">
            {editedChapters.length} Chapters · Total range: Page {editedChapters[0]?.page_start || 1} to Page {editedChapters[editedChapters.length - 1]?.page_end || document.page_count}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-98 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Rebuilding Knowledge Chunks...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>CONFIRM CHAPTER MAPPING</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
