import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  Brain,
  Edit3,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import {
  ChapterWeightage,
  WeightageMode,
  SectionBlueprint,
  DocumentItem,
  ChapterAIAnalysis,
  Chapter,
} from '../../types';
import { SolverResult } from '../../services/constraintSolver';
import { aiWeightageService } from '../../services/aiWeightageService';
import { storageService } from '../../services/storageService';

interface ChapterWeightageSelectorProps {
  chapters: ChapterWeightage[];
  document: DocumentItem;
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
  document,
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

  // AI Weightage State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalyses, setAiAnalyses] = useState<ChapterAIAnalysis[]>([]);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [isManualEditActive, setIsManualEditActive] = useState(false);

  // Run AI analysis on selected chapters
  const runAiAnalysis = async (targetChapters?: ChapterWeightage[]) => {
    const list = targetChapters || chapters;
    const selected = list.filter((c) => c.included);
    if (selected.length === 0) return;

    setIsAnalyzing(true);
    try {
      const docChapters = storageService.getChapters(document.id);
      const matched = selected.map((sc) => {
        const found = docChapters.find((dc) => dc.id === sc.chapter_id);
        return (
          found || {
            id: sc.chapter_id,
            document_id: document.id,
            title: sc.chapter_title,
            chapter_number: sc.chapter_number,
            page_start: 1,
            page_end: 20,
            status: 'detected' as const,
          }
        );
      });

      const analyses = await aiWeightageService.analyzeChapters(document, matched);
      setAiAnalyses(analyses);

      // Apply recommended marks to chapters
      const updated = list.map((c) => {
        if (!c.included) {
          return { ...c, marks: 0, percentage: 0 };
        }
        const rec = analyses.find((a) => a.chapter_id === c.chapter_id);
        const marks = rec ? rec.final_marks : c.marks;
        return {
          ...c,
          marks,
          percentage: Number(((marks / targetTotal) * 100).toFixed(1)),
          ai_analysis: rec,
        };
      });

      onChaptersChange(updated);
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger analysis if switching to ai_recommended and not yet analyzed
  useEffect(() => {
    if (mode === 'ai_recommended' && aiAnalyses.length === 0 && includedChapters.length > 0) {
      runAiAnalysis();
    }
  }, [mode]);

  const handleToggleInclude = (chapterId: string) => {
    const updated = chapters.map((c) => {
      if (c.chapter_id === chapterId) {
        const nextIncluded = !c.included;
        return {
          ...c,
          included: nextIncluded,
          marks: nextIncluded ? (c.marks > 0 ? c.marks : 10) : 0,
          percentage: nextIncluded
            ? Number((((c.marks > 0 ? c.marks : 10) / targetTotal) * 100).toFixed(1))
            : 0,
        };
      }
      return c;
    });

    onChaptersChange(updated);

    if (mode === 'ai_recommended') {
      runAiAnalysis(updated);
    }
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

  const handleResetToAiRecommendation = () => {
    if (aiAnalyses.length === 0) {
      runAiAnalysis();
      return;
    }
    const updated = chapters.map((c) => {
      if (!c.included) {
        return { ...c, marks: 0, percentage: 0 };
      }
      const match = aiAnalyses.find((a) => a.chapter_id === c.chapter_id);
      const marks = match ? match.final_marks : c.marks;
      return {
        ...c,
        marks,
        percentage: Number(((marks / targetTotal) * 100).toFixed(1)),
      };
    });
    onChaptersChange(updated);
    setIsManualEditActive(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Chapter-Wise Weightage Configuration
            </h2>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
              Hard Constraint (Total: 70M)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select chapters included in the examination and set exact mark quotas totaling exactly 70.
          </p>
        </div>

        {/* 4 Weightage Modes: AI Recommended, Exact Marks, Percentage, Equal */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl self-start lg:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => onModeChange('ai_recommended')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'ai_recommended'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Recommended (Default)</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('exact_marks')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'exact_marks'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exact Marks
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
                ? '70 / 70 ✓ · Exact weightage match. Ready for question-slot allocation.'
                : currentTotalMarks < targetTotal
                ? `${remainingMarks} marks remaining to allocate across included chapters.`
                : `Allocation exceeds 70 marks. Please reduce allocation by ${Math.abs(remainingMarks)} marks.`}
            </span>
          </div>
        </div>

        {mode === 'ai_recommended' ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => runAiAnalysis()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Reanalyze'}</span>
            </button>
          </div>
        ) : (
          !isExact70 && (
            <button
              type="button"
              onClick={handleQuickDistributeEqual}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Auto-Balance to 70</span>
            </button>
          )
        )}
      </div>

      {/* Mode Specific Toolbar for AI RECOMMENDED */}
      {mode === 'ai_recommended' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-amber-500" />
              <span>AI RECOMMENDED CHAPTER WEIGHTAGE (5 ACADEMIC FACTORS)</span>
            </span>
            <p className="text-[11px] text-slate-600">
              Evaluates: Content Volume (30%), Foundational Importance (30%), Relationships (20%), Skill Breadth (15%), Assessment Richness (5%). Marks allocated deterministically via largest-remainder.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsManualEditActive(!isManualEditActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                isManualEditActive
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isManualEditActive ? 'Done Editing' : 'Edit Weightage'}</span>
            </button>

            {isManualEditActive && (
              <button
                type="button"
                onClick={handleResetToAiRecommendation}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium cursor-pointer"
              >
                Reset to AI Recommendation
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chapters Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">Inc.</th>
              <th className="py-2.5 px-3">Chapter</th>
              {mode === 'ai_recommended' && (
                <>
                  <th className="py-2.5 px-3 w-28 text-center">Effective Pages</th>
                  <th className="py-2.5 px-3 w-32">Importance</th>
                  <th className="py-2.5 px-3 w-20 text-center">Score</th>
                </>
              )}
              <th className="py-2.5 px-3 w-32">
                {mode === 'ai_recommended' ? 'Recommended Marks' : 'Weightage (Marks)'}
              </th>
              {mode !== 'ai_recommended' && (
                <th className="py-2.5 px-3 w-28 text-right">Weightage (%)</th>
              )}
              <th className="py-2.5 px-3 w-28 text-center">
                {mode === 'ai_recommended' ? 'Why This Weightage?' : 'Lock Rule'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {chapters.map((chap) => {
              const aiMatch = aiAnalyses.find((a) => a.chapter_id === chap.chapter_id);
              const isExpanded = expandedChapterId === chap.chapter_id;

              return (
                <React.Fragment key={chap.chapter_id}>
                  <tr
                    className={`transition-colors ${
                      chap.included
                        ? 'bg-white hover:bg-slate-50/60'
                        : 'bg-slate-50/40 text-slate-400'
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
                        <span
                          className={`font-semibold ${
                            chap.included ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {chap.chapter_title}
                        </span>
                      </div>
                    </td>

                    {/* AI Columns */}
                    {mode === 'ai_recommended' && (
                      <>
                        <td className="py-3 px-3 text-center">
                          {chap.included ? (
                            <span className="font-medium text-slate-700">
                              {aiMatch ? `${aiMatch.effective_pages} pages` : 'Analyzing...'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {chap.included && aiMatch ? (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                aiMatch.importance_label === 'Essential Foundation'
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : aiMatch.importance_label === 'High'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {aiMatch.importance_label}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {chap.included && aiMatch ? (
                            <span className="font-extrabold text-slate-800">
                              {aiMatch.overall_score}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Weightage in Marks */}
                    <td className="py-3 px-3">
                      {chap.included ? (
                        mode === 'ai_recommended' && !isManualEditActive ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-slate-900">
                              {chap.marks}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">marks</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={70}
                              value={chap.marks || ''}
                              onChange={(e) => handleMarksChange(chap.chapter_id, e.target.value)}
                              className="w-16 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-slate-900"
                            />
                            <span className="text-[11px] text-slate-500 font-medium">marks</span>
                          </div>
                        )
                      ) : (
                        <span className="text-slate-400 italic">Excluded (0 marks)</span>
                      )}
                    </td>

                    {/* Percentage Column (Non-AI modes) */}
                    {mode !== 'ai_recommended' && (
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
                                onChange={(e) =>
                                  handlePercentageChange(chap.chapter_id, e.target.value)
                                }
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
                    )}

                    {/* Action Column: Why This Weightage toggle OR Lock */}
                    <td className="py-3 px-3 text-center">
                      {chap.included && (
                        mode === 'ai_recommended' ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedChapterId(isExpanded ? null : chap.chapter_id)
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                              isExpanded
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>Why?</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleLock(chap.chapter_id)}
                            title={chap.locked ? 'Locked: Exact Weightage Enforced' : 'Unlocked'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              chap.locked
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                            }`}
                          >
                            {chap.locked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )
                      )}
                    </td>
                  </tr>

                  {/* Expandable "WHY THIS WEIGHTAGE?" Card */}
                  {mode === 'ai_recommended' && isExpanded && aiMatch && (
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <td colSpan={7} className="p-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>ACADEMIC WEIGHTAGE JUSTIFICATION · {chap.chapter_title}</span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              Recommended: {aiMatch.final_marks} Marks ({((aiMatch.final_marks / 70) * 100).toFixed(1)}%)
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                            "{aiMatch.short_reason}"
                          </p>

                          {/* 5 Factors Breakdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs">
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between font-bold text-[11px] text-slate-800">
                                <span>1. Content Volume (30%)</span>
                                <span className="text-slate-900">{aiMatch.page_volume_score}/100</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {aiMatch.factor_notes.content_volume}
                              </p>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between font-bold text-[11px] text-slate-800">
                                <span>2. Foundational Importance (30%)</span>
                                <span className="text-slate-900">{aiMatch.importance_score}/100</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {aiMatch.factor_notes.foundational_importance}
                              </p>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between font-bold text-[11px] text-slate-800">
                                <span>3. Inter-Chapter Relevance (20%)</span>
                                <span className="text-slate-900">{aiMatch.chapter_relationship_score}/100</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {aiMatch.factor_notes.inter_chapter_relevance}
                              </p>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between font-bold text-[11px] text-slate-800">
                                <span>4. Problem-Solving Breadth (15%)</span>
                                <span className="text-slate-900">{aiMatch.skill_breadth_score}/100</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {aiMatch.factor_notes.problem_solving_breadth}
                              </p>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 sm:col-span-2 lg:col-span-2">
                              <div className="flex items-center justify-between font-bold text-[11px] text-slate-800">
                                <span>5. Assessment Richness (5%)</span>
                                <span className="text-slate-900">{aiMatch.assessment_richness_score}/100</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {aiMatch.factor_notes.assessment_richness}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200 text-xs">
              <td
                colSpan={mode === 'ai_recommended' ? 5 : 2}
                className="py-3 px-4 uppercase tracking-wider"
              >
                Total Examination Marks
              </td>
              <td className="py-3 px-3 font-extrabold text-sm">
                <span className={isExact70 ? 'text-emerald-700' : 'text-rose-600'}>
                  {currentTotalMarks} / {targetTotal}
                </span>
                <span className="text-slate-400 font-normal ml-1">marks</span>
              </td>
              {mode !== 'ai_recommended' && (
                <td className="py-3 px-3 text-right">
                  <span className={isExact70 ? 'text-emerald-700' : 'text-slate-600'}>
                    {Number(((currentTotalMarks / targetTotal) * 100).toFixed(1))}%
                  </span>
                </td>
              )}
              <td className="py-3 px-3 text-center">
                {isExact70 && <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Solver Deficiency Banner */}
      {solverDeficiency && !solverDeficiency.success && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3 text-xs text-amber-950">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Chapter Weightage Blueprint Conflict</p>
              <p className="mt-0.5 text-amber-900">{solverDeficiency.errorMessage}</p>
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
          {includedChapters.length} chapters selected · Every question slot strictly constrained
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
          <span>
            {mode === 'ai_recommended'
              ? 'Accept AI Weightage & Allocate Question Slots'
              : 'Solve Blueprint & Allocate Question Slots'}
          </span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
