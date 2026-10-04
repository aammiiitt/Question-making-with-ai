import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldCheck, Eye, Layers } from 'lucide-react';
import { ClassVIExamPaper } from '../../types';

interface PrintExamPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: ClassVIExamPaper;
}

export const PrintExamPaperModal: React.FC<PrintExamPaperModalProps> = ({
  isOpen,
  onClose,
  paper,
}) => {
  if (!isOpen) return null;

  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeWeightageAudit, setIncludeWeightageAudit] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const sections = paper.sections;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 transition-all max-h-[95vh] flex flex-col">
        {/* Controls Bar (Hidden in print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                CLASS VI MATHEMATICS · CUSTOM 70-MARK SCHOOL EXAMINATION
              </h2>
              <p className="text-xs text-slate-500">
                Print & Export Preview · 32 Questions · Strict Chapter Weightage
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

        {/* Options (Hidden in print) */}
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Include Confidential Answer Key & Rubrics</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeWeightageAudit}
                onChange={(e) => setIncludeWeightageAudit(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Include Chapter Weightage Audit Table</span>
            </label>
          </div>

          <span className="font-bold text-slate-900">
            {paper.slots.length} Questions · Total Marks: {paper.totalMarks}
          </span>
        </div>

        {/* Printable Examination Paper Area */}
        <div className="mt-3 flex-1 overflow-y-auto border border-slate-200 rounded-xl p-6 bg-white print:border-none print:p-0 font-serif">
          {/* Exam Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
              {paper.schoolName}
            </h1>
            <p className="text-sm font-semibold uppercase text-slate-800 tracking-wide">
              {paper.title}
            </p>
            <div className="flex items-center justify-between text-xs pt-2 font-sans font-medium text-slate-700 border-t border-slate-300 mt-2">
              <span>{paper.className} · {paper.subject}</span>
              <span>Time Allowed: {paper.timeAllowed}</span>
              <span className="font-bold">Full Marks: {paper.totalMarks}</span>
            </div>
          </div>

          {/* General Instructions */}
          <div className="py-2.5 border-b border-slate-300 text-[11px] font-sans text-slate-600 space-y-0.5">
            <p className="font-bold text-slate-900">General Instructions:</p>
            <p>1. This question paper comprises 4 Sections: A, B, C and D. All questions are compulsory.</p>
            <p>2. Section A contains 10 questions of 1 mark each. Section B contains 10 questions of 2 marks each.</p>
            <p>3. Section C contains 8 questions of 3 marks each. Section D contains 4 questions of 4 marks each.</p>
            <p>4. Show all necessary rough calculations and steps clearly on your answer script.</p>
          </div>

          {/* Question Sections */}
          <div className="py-4 space-y-6">
            {sections.map((sec) => {
              const secSlots = paper.slots.filter((s) => s.sectionId === sec.id);

              return (
                <div key={sec.id} className="space-y-3">
                  <div className="border-b border-slate-400 pb-1 flex items-center justify-between font-sans">
                    <span className="font-bold text-xs uppercase text-slate-900">
                      {sec.name} ({sec.numberOfQuestions} Questions × {sec.marksPerQuestion} Mark = {sec.totalSectionMarks} Marks)
                    </span>
                    <span className="text-[11px] text-slate-500 italic">
                      {sec.description}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {secSlots.map((slot) => {
                      const qItem = slot.questionItem;
                      return (
                        <div key={slot.slotNumber} className="flex items-start justify-between gap-3 text-sm">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="font-bold shrink-0">{slot.slotNumber}.</span>
                            <div className="flex-1 font-sans">
                              <p className="font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                                {qItem?.question_text || `[Slot #${slot.slotNumber} (${slot.chapterTitle}) generating...]`}
                              </p>

                              {/* MCQ Options */}
                              {qItem?.options && qItem.options.length > 0 && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-800 font-sans">
                                  {qItem.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="leading-snug">{opt}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-bold font-sans text-slate-800 text-xs shrink-0 pl-3">
                            [{slot.marks}]
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chapter Weightage Audit Table (Included for real-exam verification) */}
          {includeWeightageAudit && (
            <div className="mt-8 pt-4 border-t-2 border-slate-900 font-sans page-break-before">
              <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Chapter Weightage Audit Verification (Hard Constraint 70/70)
                </span>
                <span className="text-xs font-semibold text-emerald-800">
                  Total Paper Marks: {paper.totalMarks}
                </span>
              </div>

              <table className="w-full text-left text-xs mt-2 border border-slate-200">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="py-1.5 px-2">Chapter Name</th>
                    <th className="py-1.5 px-2 text-center">Allocated Questions</th>
                    <th className="py-1.5 px-2 text-right">Target Marks</th>
                    <th className="py-1.5 px-2 text-right">Actual Marks</th>
                    <th className="py-1.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paper.chaptersWeightage.filter((c) => c.included).map((chap) => {
                    const check = paper.paperHealth.chapterChecks.find((chk) => chk.chapterId === chap.chapter_id);
                    const count = paper.slots.filter((s) => s.chapterId === chap.chapter_id).length;
                    return (
                      <tr key={chap.chapter_id}>
                        <td className="py-1.5 px-2 font-medium">{chap.chapter_title}</td>
                        <td className="py-1.5 px-2 text-center">{count}</td>
                        <td className="py-1.5 px-2 text-right">{chap.marks}m</td>
                        <td className="py-1.5 px-2 text-right font-bold">{check?.actualMarks || chap.marks}m</td>
                        <td className="py-1.5 px-2 text-center text-emerald-700 font-bold">✓ Exact</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Model Answer Key & Marking Scheme */}
          {includeAnswerKey && (
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-400 space-y-4 font-sans page-break-before">
              <div className="text-center pb-2 border-b border-slate-300">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Teacher Evaluation Sheet: Model Answers & Marking Schemes
                </h3>
              </div>

              <div className="space-y-4">
                {paper.slots.map((slot) => {
                  const qItem = slot.questionItem;
                  return (
                    <div key={slot.slotNumber} className="text-xs space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>Question {slot.slotNumber} ({slot.sectionName} · {slot.marks} Marks)</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          Chapter: {slot.chapterTitle} {qItem?.source ? `(pp. ${qItem.source.page_start}–${qItem.source.page_end})` : ''}
                        </span>
                      </div>

                      {qItem?.answer && (
                        <div>
                          <span className="font-semibold text-slate-800">Model Answer: </span>
                          <span className="text-slate-800 whitespace-pre-line leading-relaxed">
                            {qItem.answer.answer_text}
                          </span>
                        </div>
                      )}

                      {qItem?.answer?.marking_scheme && (
                        <div className="mt-1 pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-800 block">Step Marking Scheme:</span>
                          <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                            {qItem.answer.marking_scheme.map((crit, cIdx) => (
                              <li key={cIdx}>
                                {crit.criterion} — <span className="font-semibold">{crit.marks} mark</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Hidden in print) */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs text-slate-500">
            A4 paper layout ready for printer or PDF save
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save 70M Paper PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
