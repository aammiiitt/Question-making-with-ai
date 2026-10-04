import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Percent,
  Check,
  RotateCcw,
  ArrowRight,
  Info,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { ChapterWeightage, WeightageMode, SectionBlueprint } from '../../types';
import { SolverResult } from '../../services/constraintSolver';

interface ChapterWeightageSelectorProps {
  chapters: ChapterWeightage[];
  mode: WeightageMode;
  onModeChange: (mode: WeightageMode) => void;
  onChaptersChange: (updated: ChapterWeightage[]) => void;
  onSolveAndProceed: () => void;
  solverDeficiency?: SolverResult | null;
  onApplySuggestion?: (adjustment: {
    chapters?: { chapter_id: string; marks: number }[];
    sections?: SectionBlueprint[];
  }) => void;
}

export const ChapterWeightageSelector: React.FC<ChapterWeightageSelectorProps> = ({
  chapters,
  mode,
  onModeChange,
  onChaptersChange,
  onSolveAndProceed,
  solverDeficiency,
  onApplySuggestion,
}) => {
  const targetTotal = 70;
  const includedChapters = chapters.filter((c) => c.included);
  const currentTotalMarks = includedChapters.reduce((acc, c) => acc + (c.marks || 0), 0);
  const isExact70 = currentTotalMarks === targetTotal;
  const remainingMarks = targetTotal - currentTotalMarks;

  const handleToggleInclude = (chapterId: string) => {
    const updated = chapters.map((c) => {
      if (c.chapter_id === chapterId) {
        const nextIncluded = !c.included;
        return {
          ...c,
          included: nextIncluded,
          marks: nextIncluded ? (c.marks > 0 ? c.marks : 10) : 0,
          percentage: nextIncluded ? Number((((c.marks > 0 ? c.marks : 10) / targetTotal) * 100).toFixed(1)) : 0,
        };
      }
      return c;
    });
    onChaptersChange(updated);
  };

  const handleToggleLock = (chapterId: string) => {
    const updated = chapters.map((c) => {
      if (c.chapter_id === chapterId) {
        return { ...c, locked: !c.locked };
      }
      return c;
    });
    onChaptersChange(updated);
  };

  const handleMarksChange = (chapterId: string, val: string) => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    const updated = chapters.map((c) => {
      if (c.chapter_id === chapterId) {
        return {
          ...c,
          marks: parsed,
          percentage: Number(((parsed / targetTotal) * 100).toFixed(1)),
        };
      }
      return c;
    });
    onChaptersChange(updated);
  };

  const handlePercentageChange = (chapterId: string, val: string) => {
    const pct = Math.max(0, Math.min(100, parseFloat(val) || 0));
    const calculatedMarks = Math.round((pct / 100) * targetTotal);
    const updated = chapters.map((c) => {
      if (c.chapter_id === chapterId) {
        return {
          ...c,
          marks: calculatedMarks,
          percentage: pct,
        };
      }
      return c;
    });
    onChaptersChange(updated);
  };

  const handleQuickDistributeEqual = () => {
    const included = chapters.filter((c) => c.included);
    if (included.length === 0) return;
    const base = Math.floor(targetTotal / included.length);
    const rem = targetTotal % included.length;

    const updated = chapters.map((c) => {
      if (!c.included) {
        return { ...c, marks: 0, percentage: 0 };
      }
      const incIdx = included.findIndex((i) => i.chapter_id === c.chapter_id);
      const m = base + (incIdx < rem ? 1 : 0);
      return {
        ...c,
        marks: m,
        percentage: Number(((m / targetTotal) * 100).toFixed(1)),
      };
    });
    onChaptersChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Chapter-Wise Weightage Configuration
            </h2>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
              Hard Constraint
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select chapters included in the examination and set exact mark quotas totaling 70
          </p>
        </div>

        {/* 3 Weightage Modes */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => onModeChange('exact_marks')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'exact_marks'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exact Marks (Default)
          </button>
          <button
            type="button"
            onClick={() => onModeChange('percentage')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'percentage'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Percentage %
          </button>
          <button
            type="button"
            onClick={() => {
              onModeChange('equal');
              handleQuickDistributeEqual();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'equal'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Equal Distribution
          </button>
        </div>
      </div>

      {/* Strict Weightage Validation Indicator Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isExact70
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : currentTotalMarks < targetTotal
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : 'bg-rose-50/80 border-rose-300 text-rose-950'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isExact70 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          )}
          <div>
            <span className="font-bold text-sm block">
              CHAPTER WEIGHTAGE: {currentTotalMarks} / {targetTotal} marks
            </span>
            <span className="text-[11px] mt-0.5 block font-medium">
              {isExact70
                ? 'Exact weightage match (70 / 70 ✓). Ready for question-slot allocation.'
                : currentTotalMarks < targetTotal
                ? `${remainingMarks} marks remaining to allocate across included chapters.`
                : `Allocation exceeds 70 marks. Please reduce by ${Math.abs(remainingMarks)} marks.`}
            </span>
          </div>
        </div>

        {!isExact70 && (
          <button
            type="button"
            onClick={handleQuickDistributeEqual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Auto-Balance to 70</span>
          </button>
        )}
      </div>

      {/* Chapters Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">Inc.</th>
              <th className="py-2.5 px-3">Chapter Name</th>
              <th className="py-2.5 px-3 w-32">Weightage (Marks)</th>
              <th className="py-2.5 px-3 w-28 text-right">Weightage (%)</th>
              <th className="py-2.5 px-3 w-24 text-center">Lock Rule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {chapters.map((chap) => {
              return (
                <tr
                  key={chap.chapter_id}
                  className={`transition-colors ${
                    chap.included ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/40 text-slate-400'
                  }`}
                >
                  {/* Included Toggle */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={chap.included}
                      onChange={() => handleToggleInclude(chap.chapter_id)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Chapter Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">
                        {chap.chapter_number}.
                      </span>
                      <span className={`font-semibold ${chap.included ? 'text-slate-900' : 'text-slate-400'}`}>
                        {chap.chapter_title}
                      </span>
                    </div>
                  </td>

                  {/* Weightage in Marks */}
                  <td className="py-3 px-3">
                    {chap.included ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={70}
                          value={chap.marks || ''}
                          onChange={(e) => handleMarksChange(chap.chapter_id, e.target.value)}
                          className="w-20 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg text-center focus:ring-2 focus:ring-slate-900"
                        />
                        <span className="text-[11px] text-slate-500 font-medium">marks</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Excluded (0 marks)</span>
                    )}
                  </td>

                  {/* Weightage in Percentage */}
                  <td className="py-3 px-3 text-right">
                    {chap.included ? (
                      mode === 'percentage' ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={chap.percentage}
                            onChange={(e) => handlePercentageChange(chap.chapter_id, e.target.value)}
                            className="w-16 px-1.5 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg text-right"
                          />
                          <span className="text-slate-500 font-medium">%</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-700">
                          {chap.percentage}%
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">0%</span>
                    )}
                  </td>

                  {/* Lock Hard Constraint */}
                  <td className="py-3 px-3 text-center">
                    {chap.included && (
                      <button
                        type="button"
                        onClick={() => handleToggleLock(chap.chapter_id)}
                        title={chap.locked ? 'Locked: Gemini cannot alter marks' : 'Unlocked'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          chap.locked
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                        }`}
                      >
                        {chap.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200 text-xs">
              <td colSpan={2} className="py-3 px-4 uppercase tracking-wider">
                Total Allocated Weightage
              </td>
              <td className="py-3 px-3 font-extrabold text-sm">
                <span className={isExact70 ? 'text-emerald-700' : 'text-rose-600'}>
                  {currentTotalMarks} / {targetTotal}
                </span>
                <span className="text-slate-400 font-normal ml-1">marks</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className={isExact70 ? 'text-emerald-700' : 'text-slate-600'}>
                  {Number(((currentTotalMarks / targetTotal) * 100).toFixed(1))}%
                </span>
              </td>
              <td className="py-3 px-3 text-center">
                {isExact70 && <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Solver Deficiency Banner with Actionable Suggestions */}
      {solverDeficiency && !solverDeficiency.success && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3 text-xs text-amber-950">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                Chapter Weightage Pattern Conflict
              </p>
              <p className="mt-0.5 text-amber-900">
                {solverDeficiency.errorMessage}
              </p>
            </div>
          </div>

          {solverDeficiency.suggestions && solverDeficiency.suggestions.length > 0 && (
            <div className="pt-2 border-t border-amber-200/80 space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-amber-950">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Deterministic Solver Suggestions (Teacher Approval Required):</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                {solverDeficiency.suggestions.map((sug, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-lg border border-amber-200 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{sug.title}</p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {sug.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onApplySuggestion?.(sug.applyAdjustment())}
                      className="mt-3 w-full py-1.5 bg-slate-900 text-white rounded-md font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {sug.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500">
          {includedChapters.length} chapters selected · Every question slot will be hard-constrained
        </div>

        <button
          type="button"
          disabled={!isExact70}
          onClick={onSolveAndProceed}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
            isExact70
              ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-98'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Solve Blueprint & Allocate Question Slots</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
