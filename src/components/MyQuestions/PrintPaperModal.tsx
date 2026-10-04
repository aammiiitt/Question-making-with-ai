import React, { useState } from 'react';
import { X, Printer, Download, Eye, FileText, CheckSquare, Square } from 'lucide-react';
import { QuestionItem } from '../../types';

interface PrintPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
}

export const PrintPaperModal: React.FC<PrintPaperModalProps> = ({
  isOpen,
  onClose,
  questions,
}) => {
  if (!isOpen) return null;

  const [schoolName, setSchoolName] = useState('MODEL HIGH SCHOOL');
  const [examTitle, setExamTitle] = useState('SUMMATIVE EVALUATION / PERIODIC TEST');
  const [className, setClassName] = useState('Class X');
  const [subject, setSubject] = useState('Physical Science & Environment');
  const [timeAllowed, setTimeAllowed] = useState('1 Hour 30 Minutes');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeMarkingScheme, setIncludeMarkingScheme] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    questions.map((q) => q.id)
  );

  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));
  const totalMarks = selectedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 transition-all max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Generate Question Paper & Answer Key
              </h2>
              <p className="text-xs text-slate-500">
                Format approved questions into an official printable school examination paper
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

        {/* Paper Header Settings (Hidden during print) */}
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0 print:hidden">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
              Institution Name
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
              Exam Title
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
              Class & Subject
            </label>
            <input
              type="text"
              value={`${className} - ${subject}`}
              onChange={(e) => {
                const parts = e.target.value.split('-');
                setClassName(parts[0]?.trim() || '');
                setSubject(parts[1]?.trim() || '');
              }}
              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
              Time Allowed
            </label>
            <input
              type="text"
              value={timeAllowed}
              onChange={(e) => setTimeAllowed(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs"
            />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 px-1 shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Include Model Answers</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMarkingScheme}
                onChange={(e) => setIncludeMarkingScheme(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Include Marking Scheme</span>
            </label>
          </div>
          <span className="font-semibold text-slate-800">
            {selectedQuestions.length} Questions · Total Marks: {totalMarks}
          </span>
        </div>

        {/* Paper Document Preview Area (Formatted for clean printing) */}
        <div className="mt-3 flex-1 overflow-y-auto border border-slate-200 rounded-xl p-6 bg-white print:border-none print:p-0 font-serif">
          {/* Official Exam Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
              {schoolName}
            </h1>
            <p className="text-sm font-semibold uppercase text-slate-800 tracking-wide">
              {examTitle}
            </p>
            <div className="flex items-center justify-between text-xs pt-2 font-sans font-medium text-slate-700">
              <span>{className} · {subject}</span>
              <span>Time: {timeAllowed}</span>
              <span className="font-bold">Total Marks: {totalMarks}</span>
            </div>
          </div>

          {/* General Instructions */}
          <div className="py-2.5 border-b border-slate-300 text-[11px] font-sans text-slate-600 space-y-0.5">
            <p className="font-semibold text-slate-800">General Instructions:</p>
            <p>1. All questions are compulsory. Marks allocated to each question are indicated on the right margin.</p>
            <p>2. Answer in your own words as far as practicable in accordance with syllabus guidelines.</p>
          </div>

          {/* Questions Section */}
          <div className="py-4 space-y-5">
            {selectedQuestions.map((q, idx) => (
              <div key={q.id} className="relative group">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="font-bold shrink-0">{idx + 1}.</span>
                    <div className="flex-1 font-sans">
                      <p className="font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                        {q.question_text}
                      </p>

                      {/* MCQ Options if applicable */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-800 font-sans">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="leading-snug">{opt}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold font-sans text-slate-800 text-xs shrink-0 pl-3">
                    [{q.marks}]
                  </span>
                </div>

                {/* Print selector toggle in screen preview */}
                <button
                  type="button"
                  onClick={() => toggleSelect(q.id)}
                  className="absolute -left-5 top-0 print:hidden text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Toggle question inclusion"
                >
                  {selectedIds.includes(q.id) ? (
                    <CheckSquare className="w-3.5 h-3.5 text-slate-900" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Optional Answer Key & Marking Scheme Section */}
          {(includeAnswerKey || includeMarkingScheme) && (
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-400 space-y-4 font-sans">
              <div className="text-center pb-2 border-b border-slate-300">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Confidential: Teacher's Marking Scheme & Model Solutions
                </h3>
              </div>

              <div className="space-y-4">
                {selectedQuestions.map((q, idx) => (
                  <div key={q.id} className="text-xs space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Question {idx + 1} ({q.marks} {q.marks === 1 ? 'Mark' : 'Marks'})</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Grounding: {q.chapter_name || q.source?.chapter_title}, pp. {q.source?.page_start}–{q.source?.page_end}
                      </span>
                    </div>

                    {includeAnswerKey && q.answer && (
                      <div>
                        <span className="font-semibold text-slate-700">Model Answer: </span>
                        <span className="text-slate-800 whitespace-pre-line leading-relaxed">
                          {q.answer.answer_text}
                        </span>
                      </div>
                    )}

                    {includeMarkingScheme && q.answer?.marking_scheme && (
                      <div className="mt-1 pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700 block">Marking Rubric:</span>
                        <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                          {q.answer.marking_scheme.map((crit, cIdx) => (
                            <li key={cIdx}>
                              {crit.criterion} — <span className="font-semibold">{crit.marks} mark</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs text-slate-500">
            Formatted for standard A4 educational printing
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF Paper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
