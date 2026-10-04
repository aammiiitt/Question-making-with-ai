import React, { useState } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { QuestionItem, MarkingCriterion, DifficultyLevel } from '../../types';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionItem;
  onSave: (updated: QuestionItem) => void;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  onClose,
  question,
  onSave,
}) => {
  if (!isOpen) return null;

  const [questionText, setQuestionText] = useState(question.question_text);
  const [answerText, setAnswerText] = useState(question.answer?.answer_text || '');
  const [marks, setMarks] = useState(question.marks);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(question.difficulty);
  const [markingScheme, setMarkingScheme] = useState<MarkingCriterion[]>(
    question.answer?.marking_scheme?.length
      ? question.answer.marking_scheme
      : [{ criterion: 'Complete correct response', marks: question.marks }]
  );

  const handleAddCriterion = () => {
    setMarkingScheme([...markingScheme, { criterion: '', marks: 1 }]);
  };

  const handleUpdateCriterion = (index: number, field: 'criterion' | 'marks', value: any) => {
    const updated = [...markingScheme];
    if (field === 'criterion') {
      updated[index].criterion = value;
    } else {
      updated[index].marks = Number(value);
    }
    setMarkingScheme(updated);
  };

  const handleRemoveCriterion = (index: number) => {
    setMarkingScheme(markingScheme.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedQuestion: QuestionItem = {
      ...question,
      question_text: questionText.trim(),
      marks: Number(marks),
      difficulty,
      status: 'edited',
      updated_at: new Date().toISOString(),
      answer: {
        id: question.answer?.id || `ans-${Date.now()}`,
        question_id: question.id,
        answer_text: answerText.trim(),
        marking_scheme: markingScheme,
      },
    };

    onSave(updatedQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Question & Rubric</h2>
            <p className="text-xs text-slate-500">
              Refine question phrasing, model answer, marks, and grading criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Question Formulation
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 leading-relaxed font-sans"
            />
          </div>

          {/* Marks & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marks Allocated
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 capitalize bg-white"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
              </select>
            </div>
          </div>

          {/* Model Answer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Model Answer / Solution Steps
            </label>
            <textarea
              rows={4}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 leading-relaxed font-sans"
            />
          </div>

          {/* Marking Scheme */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Marking Scheme Breakdown
              </label>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-900 hover:text-slate-700 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-2">
              {markingScheme.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.criterion}
                    onChange={(e) => handleUpdateCriterion(idx, 'criterion', e.target.value)}
                    placeholder="e.g. Correct statement of principle"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={item.marks}
                      onChange={(e) => handleUpdateCriterion(idx, 'marks', e.target.value)}
                      className="w-16 px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-center"
                    />
                    <span className="text-[11px] text-slate-500">m</span>
                  </div>
                  {markingScheme.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Modifications</span>
          </button>
        </div>
      </div>
    </div>
  );
};
