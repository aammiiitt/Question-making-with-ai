import React, { useState } from 'react';
import { X, ThumbsDown, AlertCircle } from 'lucide-react';
import { QuestionFeedback } from '../../types';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  onConfirmReject: (reason: QuestionFeedback['rejection_reason'], notes?: string) => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  questionId,
  onConfirmReject,
}) => {
  if (!isOpen) return null;

  const [selectedReason, setSelectedReason] = useState<QuestionFeedback['rejection_reason']>('incorrect');
  const [notes, setNotes] = useState('');

  const reasons: { id: QuestionFeedback['rejection_reason']; label: string }[] = [
    { id: 'incorrect', label: 'Incorrect scientific fact / formula' },
    { id: 'wrong_answer', label: 'Wrong model answer or solution' },
    { id: 'too_easy', label: 'Too easy / trivial for specified marks' },
    { id: 'too_difficult', label: 'Too difficult / out of depth for grade level' },
    { id: 'outside_syllabus', label: 'Outside prescribed syllabus / chapter scope' },
    { id: 'poor_language', label: 'Poor phrasing or unnatural translation' },
    { id: 'duplicate', label: 'Duplicate / repetitive question' },
    { id: 'other', label: 'Other feedback' },
  ];

  const handleConfirm = () => {
    onConfirmReject(selectedReason, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ThumbsDown className="w-4 h-4 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">Reject Question</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-2 mb-3">
          Why are you rejecting this question? Your feedback trains the assessment engine and prevents duplicate errors.
        </p>

        {/* Reason Selector */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {reasons.map((r) => (
            <label
              key={r.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                selectedReason === r.id
                  ? 'border-slate-900 bg-slate-50 font-medium text-slate-900'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="rejection_reason"
                checked={selectedReason === r.id}
                onChange={() => setSelectedReason(r.id)}
                className="text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>

        {/* Optional Notes */}
        <div className="mt-3">
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Additional teacher notes (optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. In WBBSE class 10, this derivation is usually reserved for higher secondary..."
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};
