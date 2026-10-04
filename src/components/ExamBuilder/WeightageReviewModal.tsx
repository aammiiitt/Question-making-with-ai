import React from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles, Layers, FileText } from 'lucide-react';
import { ClassVIExamPaper } from '../../types';

interface WeightageReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: ClassVIExamPaper;
  onConfirmAndGenerate: () => void;
}

export const WeightageReviewModal: React.FC<WeightageReviewModalProps> = ({
  isOpen,
  onClose,
  paper,
  onConfirmAndGenerate,
}) => {
  if (!isOpen) return null;

  const includedChapters = paper.chaptersWeightage.filter((c) => c.included && c.marks > 0);
  const totalAllocatedMarks = includedChapters.reduce((acc, c) => acc + c.marks, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-900" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pre-Generation Blueprint Verification
              </h2>
              <p className="text-xs text-slate-500">
                Review deterministic slot allocation and hard constraint assignments before AI runs
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

        {/* Paper Overview Badge */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs shrink-0 font-sans">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Official Examination Standard
            </span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">
              CLASS VI MATHEMATICS
            </p>
            <p className="text-slate-600 text-xs">
              Textbook: {paper.bookTitle}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">FULL MARKS</span>
            <span className="text-xl font-extrabold text-slate-900">70 MARKS</span>
            <span className="text-[11px] text-emerald-700 block font-semibold">100% Locked</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Chapter Distribution Table */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Chapter Distribution (Hard Constraints)</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Chapter</th>
                    <th className="py-2 px-3 text-center">Assigned Slots</th>
                    <th className="py-2 px-3 text-right">Marks</th>
                    <th className="py-2 px-3 text-right">Weightage (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {includedChapters.map((chap) => {
                    const slotCount = paper.slots.filter((s) => s.chapterId === chap.chapter_id).length;
                    return (
                      <tr key={chap.chapter_id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {chap.chapter_title}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">
                          {slotCount} questions
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {chap.marks} marks
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                          {chap.percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-900">
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td className="py-2.5 px-3 text-center">
                      {paper.slots.length} questions
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">
                      {totalAllocatedMarks} marks
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">
                      100.0%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section Blueprint Breakdown */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Section Pattern Breakdown</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paper.sections.map((sec) => (
                <div key={sec.id} className="p-2.5 rounded-xl border border-slate-200 bg-white">
                  <span className="font-bold text-slate-900 block">{sec.name}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {sec.numberOfQuestions} Qs × {sec.marksPerQuestion}m = {sec.totalSectionMarks}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Real Exam Grounding Guarantee */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold block text-amber-950 mb-0.5">Strict Examination Rule:</span>
            Every question will be generated strictly from the uploaded Class VI Mathematics textbook with verbatim citations. If reliable textbook material is missing for any slot, it will be marked "SOURCE REQUIRED" rather than synthesized generically.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Back to Edit
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirmAndGenerate();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>CONFIRM BLUEPRINT & GENERATE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
