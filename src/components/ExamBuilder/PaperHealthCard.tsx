import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Check,
  XCircle,
  FileCheck,
  Hash,
} from 'lucide-react';
import { PaperHealth } from '../../types';

interface PaperHealthCardProps {
  health: PaperHealth;
}

export const PaperHealthCard: React.FC<PaperHealthCardProps> = ({ health }) => {
  const isMarksExact = health.totalMarksActual === health.totalMarksExpected;
  const isQuestionsExact =
    health.totalQuestionsActual === health.totalQuestionsExpected && health.totalQuestionsExpected > 0;

  const isAuditNeedsReview = !health.isReady && isQuestionsExact;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-slate-800" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">STRICT PAPER HEALTH AUDIT</h3>
            <p className="text-[11px] text-slate-500">
              Deterministic verification of 70-mark constraints, chapter targets, marking scheme sums & real textbook grounding
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto ${
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
              <span>Needs Review</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Generation Pending</span>
            </>
          )}
        </span>
      </div>

      {/* Global Strict Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block font-medium">Total Marks</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-base font-bold text-slate-900">
              {health.totalMarksActual} / {health.totalMarksExpected}
            </span>
            {isMarksExact ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block font-medium">Question Slots</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-base font-bold text-slate-900">
              {health.totalQuestionsActual} / {health.totalQuestionsExpected}
            </span>
            {isQuestionsExact ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block font-medium">Marking Scheme Sums</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold text-slate-900 truncate">
              {health.allMarkingSchemesSumValid ? 'Exact Match' : 'Discrepancy'}
            </span>
            {health.allMarkingSchemesSumValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block font-medium">Source Grounding</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold text-slate-900 truncate">
              {health.allSourceGroundingPassed ? '100% Grounded' : 'Needs Review'}
            </span>
            {health.allSourceGroundingPassed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-500 block font-medium">Duplicate Questions</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-base font-bold text-slate-900">
              {health.duplicateCount === 0 ? '0' : health.duplicateCount}
            </span>
            {health.duplicateCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
        </div>
      </div>

      {/* Health Issues List if not Ready */}
      {health.healthIssues && health.healthIssues.length > 0 && !health.isReady && (
        <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs space-y-1.5 text-rose-950">
          <span className="font-bold flex items-center gap-1.5 text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Audit Findings (Must Be Resolved for Paper Certification):</span>
          </span>
          <ul className="list-disc pl-5 space-y-0.5 text-rose-800 text-[11px]">
            {health.healthIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Chapter-wise Breakdown Verification */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-2">
          <span>CHAPTER WEIGHTAGE AUDIT (HARD CONSTRAINT)</span>
          <span className="text-[11px] font-normal text-slate-500">
            {health.allChaptersPassed ? 'All chapter marks exact' : 'Discrepancy detected'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {health.chapterChecks.map((chk) => (
            <div
              key={chk.chapterId}
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                chk.passed
                  ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950 font-medium'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <span className="truncate pr-2">{chk.chapterTitle}</span>
              <div className="flex items-center gap-1.5 shrink-0 font-bold">
                <span>
                  {chk.actualMarks} / {chk.expectedMarks}m
                </span>
                {chk.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
