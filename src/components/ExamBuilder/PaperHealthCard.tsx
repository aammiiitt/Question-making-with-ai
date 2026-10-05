import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Check,
  XCircle,
  FileCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  BookOpen,
  Compass,
  Calculator,
  Copy,
  Languages,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { PaperHealth } from '../../types';
import {
  RuleEvaluationResult,
  SubjectRuleEvaluationResult,
  DuplicateMatch,
} from '../../services/assessment/types';

interface PaperHealthCardProps {
  health: PaperHealth;
}

export const PaperHealthCard: React.FC<PaperHealthCardProps> = ({ health }) => {
  const [activeTab, setActiveTab] = useState<'universal' | 'benchmark_math' | 'duplicates'>('universal');
  const [isExpanded, setIsExpanded] = useState(true);

  const report = health.assessmentReport;
  const universalAudit = report?.universalAudit;
  const mathAudit = report?.subjectProfileAudit;
  const duplicates = universalAudit?.duplicates || [];

  const isMarksExact = health.totalMarksActual === health.totalMarksExpected;
  const isQuestionsExact =
    health.totalQuestionsActual === health.totalQuestionsExpected && health.totalQuestionsExpected > 0;
  const hasGeneratedQuestions = (health.totalQuestionsActual || 0) > 0;
  const isAuditNeedsReview = !health.isReady && isQuestionsExact;

  const qualityScore = hasGeneratedQuestions
    ? health.assessmentQualityScore ?? null
    : null;
  const exerciseStatus =
    health.exerciseDerivationStatus ||
    mathAudit?.exerciseDerivationStatus ||
    'not_yet_verified';
  const exerciseCount = health.exerciseCount ?? (mathAudit?.exerciseCount || 0);
  const exerciseKnown = health.exerciseKnownCount ?? (mathAudit?.exerciseKnownCount || 0);
  const exerciseUnknown = health.exerciseUnknownCount ?? (mathAudit?.exerciseUnknownCount || 0);
  const rawExercisePct = health.exerciseDerivationPercentage ?? (mathAudit?.exerciseDerivationPercentage ?? null);
  const exercisePct = rawExercisePct ?? 0;
  const rulesPassed = hasGeneratedQuestions
    ? health.universalRulesPassedCount ?? (universalAudit?.passedRulesCount || 0)
    : null;
  const rulesTotal = health.universalRulesTotalCount ?? (universalAudit?.evaluatedRulesCount || 14);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 pb-4 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  QUESTION ENGINE VALIDATION & HEALTH AUDIT
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Universal Rules + Benchmark V1
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Evaluating 14 Universal Assessment Rules and Class VI Mathematics Subject Profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Quality Score:</span>
              <span
                className={`font-bold ${
                  qualityScore === null
                    ? 'text-slate-500'
                    : qualityScore >= 90
                    ? 'text-emerald-700'
                    : qualityScore >= 75
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {qualityScore !== null ? `${qualityScore} / 100` : 'Pending Generation'}
              </span>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                health.isReady
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : isAuditNeedsReview
                  ? 'bg-rose-50 text-rose-800 border border-rose-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-300'
              }`}
            >
              {health.isReady ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Certified Ready</span>
                </>
              ) : isAuditNeedsReview ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Review Required</span>
                </>
              ) : !hasGeneratedQuestions ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending Generation</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Configuring / In Progress</span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs pt-1">
          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-medium">Attempted Marks</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {health.totalMarksActual} / {health.totalMarksExpected}m
              </span>
              {isMarksExact ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
            </div>
          </div>

          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-medium">Offered Marks</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {health.offeredMarksActual} / {health.offeredMarksExpected || 102}m
              </span>
              {health.offeredMarksActual === (health.offeredMarksExpected || 102) ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </div>
          </div>

          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-medium">Universal Rules</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {hasGeneratedQuestions ? `${rulesPassed} / ${rulesTotal}` : 'Not Evaluated'}
              </span>
              {hasGeneratedQuestions && rulesPassed === rulesTotal ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider block mt-0.5 text-slate-500">
              {hasGeneratedQuestions ? `${rulesPassed} Passed` : 'NOT YET VERIFIED'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-medium">Math Exercise Derivation</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {rawExercisePct !== null ? `${rawExercisePct}%` : 'Pending'} (≥80%)
              </span>
              {exerciseStatus === 'compliant' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : exerciseStatus === 'failed' ? (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${
                exerciseStatus === 'compliant'
                  ? 'text-emerald-700'
                  : exerciseStatus === 'failed'
                  ? 'text-rose-700'
                  : 'text-amber-700'
              }`}
            >
              {exerciseStatus === 'compliant'
                ? 'COMPLIANT'
                : exerciseStatus === 'failed'
                ? 'FAILED / NEEDS IMPROVEMENT'
                : 'NOT YET VERIFIED'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-medium">Numerical Structure</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {!hasGeneratedQuestions || health.numericalValidationStatus === 'not_yet_verified'
                  ? 'NOT YET VERIFIED'
                  : health.numericalValidationStatus === 'structure_passed'
                  ? 'PASS'
                  : 'FAIL'}
              </span>
              <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider block mt-0.5 text-amber-700">
              Correctness: NOT YET VERIFIED
            </span>
          </div>

          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 block font-medium">Duplicates / Overlap</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {duplicates.length} Detected
              </span>
              {duplicates.length === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('universal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'universal'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Universal Assessment Rules (14)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('benchmark_math')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'benchmark_math'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Class VI Math Benchmark Profile</span>
            </button>

            {duplicates.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('duplicates')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'duplicates'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicates & Repetitions ({duplicates.length})</span>
              </button>
            )}
          </div>

          {/* TAB 1: UNIVERSAL ASSESSMENT RULES */}
          {activeTab === 'universal' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Rules governing assessment integrity across all school subjects:</span>
                <span className="font-semibold text-slate-700">
                  {rulesPassed} of {rulesTotal} Rules Passed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {universalAudit?.results.map((rule: RuleEvaluationResult) => (
                  <div
                    key={rule.ruleId}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                      rule.status === 'passed'
                        ? 'bg-emerald-50/30 border-emerald-200/70 text-slate-800'
                        : rule.status === 'warning'
                        ? 'bg-amber-50/50 border-amber-200 text-slate-900'
                        : 'bg-rose-50/50 border-rose-200 text-slate-900'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {rule.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : rule.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rule.name}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            rule.status === 'passed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rule.status === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rule.score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{rule.summary}</p>
                      {rule.recommendation && (
                        <p className="text-[10px] font-medium text-amber-800 pt-0.5">
                          💡 {rule.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CLASS VI MATH BENCHMARK PROFILE */}
          {activeTab === 'benchmark_math' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Class VI Mathematics Subject Profile Requirements</span>
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-full">
                    Benchmark V1
                  </span>
                </div>
                <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                  These rules are specific to the Mathematics test environment and separate from universal engine logic.
                  They require high exercise/practice section derivation (≥80%), verified step-by-step arithmetic,
                  preserved units and symbols, connected 1+1 subparts, and geometry constructions.
                </p>
              </div>

              {/* Benchmark Rules List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mathAudit?.results.map((rule: SubjectRuleEvaluationResult) => {
                  const isInformational = rule.status === 'informational';
                  const isPassed = rule.status === 'passed';
                  const isFailed = rule.status === 'failed';

                  return (
                    <div
                      key={rule.ruleId}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        isInformational
                          ? 'bg-blue-50/40 border-blue-200/70 text-slate-800'
                          : isPassed
                          ? 'bg-emerald-50/30 border-emerald-200/70 text-slate-800'
                          : isFailed
                          ? 'bg-rose-50/50 border-rose-200 text-slate-900'
                          : 'bg-amber-50/50 border-amber-200 text-slate-900'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isInformational ? (
                          <Compass className="w-4 h-4 text-blue-600" />
                        ) : isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isFailed ? (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{rule.name}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isInformational
                                ? 'bg-blue-100 text-blue-800'
                                : isPassed
                                ? 'bg-emerald-100 text-emerald-800'
                                : isFailed
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isInformational
                              ? 'Informational'
                              : isPassed
                              ? 'Compliant'
                              : isFailed
                              ? 'Failed'
                              : 'Not Yet Verified'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{rule.summary}</p>
                        {rule.details && (
                          <ul className="text-[10px] text-slate-500 list-disc pl-4 pt-0.5">
                            {rule.details.map((d: string, i: number) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Visible Benchmark Metric Breakdown for Exercise Derivation */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800">
                    Textbook Exercise Derivation Rate (Target: ≥ 80%)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      exerciseStatus === 'compliant'
                        ? 'bg-emerald-100 text-emerald-800'
                        : exerciseStatus === 'failed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {exerciseStatus === 'compliant'
                      ? 'COMPLIANT'
                      : exerciseStatus === 'failed'
                      ? 'FAILED / NEEDS IMPROVEMENT'
                      : 'NOT YET VERIFIED'}
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      exerciseStatus === 'compliant'
                        ? 'bg-emerald-500'
                        : exerciseStatus === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, rawExercisePct || 0)}%` }}
                  />
                </div>

                {/* Visible Benchmark Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-sans">Exercise-derived</span>
                    <span className="font-bold text-slate-900 text-xs">{exerciseCount}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-sans">Known classified sources</span>
                    <span className="font-bold text-slate-900 text-xs">{exerciseKnown}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-sans">Unknown source classification</span>
                    <span className="font-bold text-slate-900 text-xs">{exerciseUnknown}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-sans">Exercise percentage (known)</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {rawExercisePct !== null ? `${rawExercisePct}%` : 'N/A (Not yet verified)'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-sans">Target</span>
                    <span className="font-bold text-slate-900 text-xs">≥ 80%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DUPLICATES & REPETITIONS */}
          {activeTab === 'duplicates' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-amber-700" />
                  <span>Detected Duplicate & Repetitive Questions ({duplicates.length})</span>
                </span>
                <p className="text-[11px] text-amber-900/80">
                  Universal assessment rules enforce strict deduplication: exact duplicates, semantic similarities,
                  and identical facts asked in different formats are flagged for teacher review.
                </p>
              </div>

              <div className="space-y-2">
                {duplicates.map((dup: DuplicateMatch, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-mono">
                          Slot #{dup.slotA} ↔ Slot #{dup.slotB}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">
                          {dup.type === 'exact'
                            ? 'EXACT DUPLICATE — deterministic'
                            : dup.type === 'semantic'
                            ? 'POTENTIAL SEMANTIC DUPLICATE — heuristic'
                            : 'POTENTIAL SAME-FACT DUPLICATE — heuristic'}
                        </span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Similarity: {Math.round(dup.similarityScore * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-600 block mb-0.5">Slot #{dup.slotA}:</span>
                        <p className="text-slate-800 line-clamp-2">{dup.questionTextA}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-600 block mb-0.5">Slot #{dup.slotB}:</span>
                        <p className="text-slate-800 line-clamp-2">{dup.questionTextB}</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 italic">💡 {dup.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter-wise Breakdown Verification */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-1">
              <div>
                <span className="font-bold">CHAPTER WEIGHTAGE & OPTIONAL CHOICE EXPOSURE</span>
                <p className="text-[11px] text-slate-500">
                  Target = intended 70-mark academic distribution · Offered = marks across 102 printed questions · Student choice exposure is variable.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                {health.allChaptersPassed ? '✓ All chapters represented' : 'Discrepancy detected'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {health.chapterChecks.map((chk) => (
                <div
                  key={chk.chapterId}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${
                    chk.passed
                      ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950 font-medium'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2 font-bold text-slate-900">{chk.chapterTitle}</span>
                    {chk.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-sans">
                    <span>
                      Target: <strong className="text-slate-900">{chk.expectedMarks}m</strong>
                    </span>
                    <span>
                      Offered: <strong className="text-slate-900">{chk.offeredMarks ?? chk.actualMarks}m</strong>
                    </span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                      Variable Choice
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
