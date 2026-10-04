import React, { useState } from 'react';
import { X, RefreshCw, Sparkles, TrendingDown, TrendingUp, Layers, AlertTriangle } from 'lucide-react';
import { QuestionSlot, ChapterWeightage } from '../../types';

interface ReplaceQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: QuestionSlot;
  allChapters: ChapterWeightage[];
  onConfirmReplace: (
    strategy: 'similar' | 'easier' | 'harder' | 'different_topic',
    newChapterId?: string
  ) => void;
}

export const ReplaceQuestionModal: React.FC<ReplaceQuestionModalProps> = ({
  isOpen,
  onClose,
  slot,
  allChapters,
  onConfirmReplace,
}) => {
  if (!isOpen) return null;

  const [strategy, setStrategy] = useState<'similar' | 'easier' | 'harder' | 'different_topic'>('similar');
  const [targetChapterId, setTargetChapterId] = useState<string>(slot.chapterId);
  const [showChapterChangeWarning, setShowChapterChangeWarning] = useState(false);

  const isChangingChapter = targetChapterId !== slot.chapterId;
  const currentChapter = allChapters.find((c) => c.chapter_id === slot.chapterId);
  const selectedNewChapter = allChapters.find((c) => c.chapter_id === targetChapterId);

  const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setTargetChapterId(newId);
    setShowChapterChangeWarning(newId !== slot.chapterId);
  };

  const handleConfirm = () => {
    onConfirmReplace(strategy, isChangingChapter ? targetChapterId : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 transition-all text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-800" />
            <h2 className="text-base font-bold text-slate-900">
              Replace Question (Slot #{slot.slotNumber})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Constraints Banner */}
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>{slot.sectionName} · {slot.marks} Marks · {slot.questionType.toUpperCase()}</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
              Weightage Preserved
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Chapter: <span className="font-bold text-slate-700">{slot.chapterTitle}</span>
          </p>
        </div>

        {/* Replacement Strategy Selection */}
        <div className="mt-4 space-y-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Replacement Strategy (Keeps {slot.marks} Marks & Section)
          </label>

          <div className="grid grid-cols-1 gap-2">
            {[
              {
                id: 'similar',
                title: 'Same Chapter — Similar',
                desc: 'Generate a parallel question testing the same mathematical principle.',
                icon: Sparkles,
              },
              {
                id: 'easier',
                title: 'Same Chapter — Easier',
                desc: 'Direct computation or simpler numbers to lower cognitive demand.',
                icon: TrendingDown,
              },
              {
                id: 'harder',
                title: 'Same Chapter — Harder',
                desc: 'Multi-step application or higher-order conceptual challenge.',
                icon: TrendingUp,
              },
              {
                id: 'different_topic',
                title: 'Same Chapter — Different Topic',
                desc: 'Pick an alternative subtopic within this chapter.',
                icon: Layers,
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = strategy === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setStrategy(opt.id as any)}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50 text-slate-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{opt.title}</p>
                    <p className="text-[11px] font-normal text-slate-500">{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deliberate Chapter Reassignment (With Explicit Warning) */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Reassign to Another Chapter (Optional)
          </label>
          <select
            value={targetChapterId}
            onChange={handleChapterSelect}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          >
            {allChapters
              .filter((c) => c.included)
              .map((c) => (
                <option key={c.chapter_id} value={c.chapter_id}>
                  {c.chapter_number}. {c.chapter_title} (Current: {c.marks}m)
                </option>
              ))}
          </select>

          {showChapterChangeWarning && currentChapter && selectedNewChapter && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-950 text-[11px]">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Chapter Weightage Shift Warning:</p>
                <p className="mt-0.5">
                  Moving this question will reduce "{currentChapter.chapter_title}" by {slot.marks} marks ({currentChapter.marks} → {currentChapter.marks - slot.marks}m) and increase "{selectedNewChapter.chapter_title}" by {slot.marks} marks ({selectedNewChapter.marks} → {selectedNewChapter.marks + slot.marks}m).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            Regenerate Slot
          </button>
        </div>
      </div>
    </div>
  );
};
