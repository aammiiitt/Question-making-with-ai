import React from 'react';
import { X, BookOpen, ShieldCheck, AlertCircle, Quote } from 'lucide-react';
import { QuestionSource } from '../../types';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: QuestionSource;
  isVerified: boolean;
}

export const SourceModal: React.FC<SourceModalProps> = ({
  isOpen,
  onClose,
  source,
  isVerified,
}) => {
  if (!isOpen || !source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Textbook Grounding Source
              </h2>
              <p className="text-xs text-slate-500">
                Verbatim passages retrieved from syllabus document
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

        {/* Source Meta Banner */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs shrink-0">
          <div>
            <p className="font-bold text-slate-900">{source.book_title || 'Class X Physical Science'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chapter: {source.chapter_title} · Pages {source.page_start}–{source.page_end}
            </p>
          </div>
          <div className="text-right">
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified ({Math.round(source.source_confidence * 100)}%)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Source verification required</span>
              </span>
            )}
          </div>
        </div>

        {/* Verbatim Source Passage */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Quote className="w-3.5 h-3.5 text-slate-400" />
            <span>Retrieved Source Text (Pages {source.page_start}–{source.page_end}):</span>
          </div>
          <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap selection:bg-amber-100">
            {source.source_text}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>AI formulation strictly constrained to this content</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Source
          </button>
        </div>
      </div>
    </div>
  );
};
