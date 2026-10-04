import React, { useState } from 'react';
import {
  Check,
  Edit2,
  RefreshCw,
  ThumbsDown,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Award,
} from 'lucide-react';
import { QuestionItem, QuestionFeedback } from '../../types';
import { SourceModal } from './SourceModal';
import { EditQuestionModal } from './EditQuestionModal';
import { RegenerateModal, RegenerateStrategy } from './RegenerateModal';
import { RejectModal } from './RejectModal';

interface QuestionCardProps {
  question: QuestionItem;
  onApprove: (question: QuestionItem) => void;
  onEdit: (updatedQuestion: QuestionItem) => void;
  onRegenerate: (strategy: RegenerateStrategy) => void;
  onReject: (reason: QuestionFeedback['rejection_reason'], notes?: string) => void;
  hideActionButtons?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onApprove,
  onEdit,
  onRegenerate,
  onReject,
  hideActionButtons = false,
}) => {
  const [showMetadata, setShowMetadata] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const isVerified = (question.source?.source_confidence || 0) >= 0.75;
  const isApproved = question.status === 'approved';
  const isRejected = question.status === 'rejected';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden">
      {/* Top Bar with Type & Marks */}
      <div className="bg-slate-50/70 px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 uppercase tracking-wide">
            {question.question_type.replace(/_/g, ' ')}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 font-medium">
            {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 font-medium capitalize">
            {question.difficulty}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 font-medium capitalize">
            Bloom: {question.bloom_level}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              isApproved
                ? 'bg-emerald-50 text-emerald-700'
                : isRejected
                ? 'bg-rose-50 text-rose-700'
                : question.status === 'edited'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            {isApproved
              ? 'Approved'
              : isRejected
              ? 'Rejected'
              : question.status === 'edited'
              ? 'Edited'
              : 'AI Generated'}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-6 space-y-6">
        {/* Question Formulation */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Question</span>
          </div>
          <p className="text-base font-semibold text-slate-900 leading-relaxed font-sans whitespace-pre-line">
            {question.question_text}
          </p>

          {/* Options for MCQ */}
          {question.options && question.options.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
              {question.options.map((opt, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-medium">
                  {opt}
                </div>
              ))}
            </div>
          )}

          {/* Diagram description if applicable */}
          {question.diagram_description && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-semibold block mb-0.5 text-slate-900">Figure / Diagram Instruction:</span>
              <p>{question.diagram_description}</p>
            </div>
          )}
        </div>

        {/* Model Answer */}
        {question.answer && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Model Answer</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100/70 text-xs font-normal text-slate-900 leading-relaxed font-sans whitespace-pre-line">
              {question.answer.answer_text}
            </div>
          </div>
        )}

        {/* Marking Scheme */}
        {question.answer?.marking_scheme && question.answer.marking_scheme.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>Marking Scheme</span>
            </div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden text-xs">
              {question.answer.marking_scheme.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white text-slate-700">
                  <span className="font-medium pr-2">{item.criterion}</span>
                  <span className="font-bold text-slate-900 shrink-0">
                    {item.marks} {item.marks === 1 ? 'mark' : 'marks'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grounding Source Section */}
        {question.source && (
          <div className="pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Source: {question.source.book_title || question.book_name || 'Class X Physical Science'}
                    </span>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        Verification required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chapter: {question.source.chapter_title || question.chapter_name} · Pages {question.source.page_start}–{question.source.page_end}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSourceModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>View Source</span>
              </button>
            </div>

            {/* Collapsible Internal Metadata Toggle */}
            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setShowMetadata(!showMetadata)}
                className="flex items-center justify-between w-full text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <span>Assessment Internal Metadata</span>
                {showMetadata ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showMetadata && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Chapter</span>
                    <span className="font-medium text-slate-800">{question.chapter_name || question.source.chapter_title}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Topic</span>
                    <span className="font-medium text-slate-800">{question.topic_name || 'Core Concept'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bloom Level</span>
                    <span className="font-medium text-slate-800 capitalize">{question.bloom_level}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Source Confidence</span>
                    <span className="font-medium text-slate-800">{Math.round((question.source.source_confidence || 0.9) * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Allocated Marks</span>
                    <span className="font-medium text-slate-800">{question.marks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Language</span>
                    <span className="font-medium text-slate-800 uppercase">{question.language}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
                    <span className="font-medium text-slate-800 capitalize">{question.status}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Source Pages</span>
                    <span className="font-medium text-slate-800">{question.source.page_start}–{question.source.page_end}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Teacher Action Buttons (Section 10) */}
      {!hideActionButtons && (
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Reject Button */}
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            {/* Regenerate Button */}
            <button
              type="button"
              onClick={() => setIsRegenerateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Regenerate</span>
            </button>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
          </div>

          {/* Approve Button */}
          <button
            type="button"
            onClick={() => onApprove(question)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isApproved
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{isApproved ? 'Approved & Saved' : 'Approve & Save to My Questions'}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <SourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        source={question.source}
        isVerified={isVerified}
      />

      <EditQuestionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        question={question}
        onSave={onEdit}
      />

      <RegenerateModal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        onConfirm={onRegenerate}
      />

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        questionId={question.id}
        onConfirmReject={onReject}
      />
    </div>
  );
};
