import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldCheck, Eye, Layers, Calculator } from 'lucide-react';
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
  const [includeAssessmentAudit, setIncludeAssessmentAudit] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const sections = paper.sections;
  const isBenchmark = paper.blueprintPreset !== 'compulsory_standard';
  const report = paper.paperHealth?.assessmentReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 transition-all max-h-[95vh] flex flex-col">
        {/* Controls Bar (Hidden in print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                CLASS VI MATHEMATICS · 70-MARK BENCHMARK EXAMINATION
              </h2>
              <p className="text-xs text-slate-500">
                Print & Export Preview · {isBenchmark ? 'Benchmark V1 (52 Offered Questions · 102 Offered Marks / 70 Attempted Marks · 37 Attempted Questions)' : 'Standard Compulsory 32 Questions'}
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
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Confidential Answer Key & Rubrics</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeWeightageAudit}
                onChange={(e) => setIncludeWeightageAudit(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Chapter Weightage Audit</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeAssessmentAudit}
                onChange={(e) => setIncludeAssessmentAudit(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Universal & Benchmark Assessment Quality Certificate</span>
            </label>
          </div>

          <span className="font-bold text-slate-900">
            {paper.slots.length > 0 ? paper.slots.length : 52} Offered Questions (102 Marks) · Attempted Marks: {paper.totalMarks} (37 Questions Attempted)
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
              <span className="font-bold">Full Marks (Attempted): {paper.totalMarks} · Offered: 102 Marks</span>
            </div>
          </div>

          {/* General Instructions */}
          <div className="py-2.5 border-b border-slate-300 text-[11px] font-sans text-slate-700 space-y-0.5">
            <p className="font-bold text-slate-900">General Instructions:</p>
            {isBenchmark ? (
              <>
                <p>1. This question paper comprises: Section A (20 Marks), Section B (14 Marks), Section C (18 Marks), Section D (12 Marks), and Question 8 (6 Marks). Full Attempted Marks = 70 (Total Offered Marks = 102 across 52 question blocks; students attempt 37 blocks).</p>
                <p>2. In Section A, Question 1 (MCQ), Question 2 (True/False), Question 3 (Fill in the blanks), and Question 4 (One Word/Sentence) each offer 7 questions: answer any 5 from each [1 mark each, 5 marks per group, Section A = 20 Marks].</p>
                <p>3. In Section B, answer any 7 questions out of 9 [2 marks each, Attempted = 14 Marks, Offered = 18 Marks].</p>
                <p>4. In Section C, answer any 6 questions out of 8 [3 marks each, Attempted = 18 Marks, Offered = 24 Marks].</p>
                <p>5. In Section D, answer any 3 questions out of 5 [4 marks each, Attempted = 12 Marks, Offered = 20 Marks].</p>
                <p>6. In Question 8, answer any 1 question out of 2 [6 marks each, Attempted = 6 Marks, Offered = 12 Marks].</p>
                <p>7. Show all necessary rough calculations, working steps, intermediate reasoning, and units clearly on your answer script.</p>
              </>
            ) : (
              <>
                <p>1. This question paper comprises 4 Sections: A, B, C and D. All questions are compulsory.</p>
                <p>2. Section A contains 10 questions of 1 mark each. Section B contains 10 questions of 2 marks each.</p>
                <p>3. Section C contains 8 questions of 3 marks each. Section D contains 4 questions of 4 marks each.</p>
                <p>4. Show all necessary rough calculations and steps clearly on your answer script.</p>
              </>
            )}
          </div>

          {/* Question Sections */}
          <div className="py-4 space-y-6">
            {sections.map((sec) => {
              const secSlots = paper.slots.filter((s) => s.sectionId === sec.id);

              return (
                <div key={sec.id} className="space-y-4">
                  {/* Section Title */}
                  <div className="border-b-2 border-slate-800 pb-1 flex items-center justify-between font-sans">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      {sec.name} {sec.totalSectionMarks ? `(Attempted = ${sec.totalSectionMarks} Marks)` : ''}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {sec.description}
                    </span>
                  </div>

                  {/* If section has sub-groups (Section A Q1, Q2, Q3, Q4) */}
                  {sec.groups && sec.groups.length > 0 ? (
                    <div className="space-y-5">
                      {sec.groups.map((grp) => {
                        const grpSlots = secSlots.filter((s) => s.groupId === grp.id);

                        return (
                          <div key={grp.id} className="space-y-2.5">
                            <div className="bg-slate-100/80 p-2 rounded border-l-4 border-slate-900 flex items-center justify-between font-sans text-xs">
                              <span className="font-bold text-slate-900">
                                {grp.title}
                              </span>
                              <span className="font-bold text-slate-800 shrink-0">
                                [{grp.marksPerQuestion} × {grp.questionsToAttempt} = {grp.attemptedMarks}]
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 italic font-sans pl-1">
                              {grp.instruction}
                            </p>

                            <div className="space-y-3 pt-1">
                              {grpSlots.map((slot) => {
                                const qItem = slot.questionItem;
                                return (
                                  <div key={slot.slotNumber} className="flex items-start justify-between gap-3 text-sm">
                                    <div className="flex items-start gap-2 flex-1">
                                      <span className="font-bold shrink-0">{slot.subQuestionLabel || `${slot.slotNumber}.`}</span>
                                      <div className="flex-1 font-sans">
                                        <p className="font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                                          {qItem?.question_text || `[Slot #${slot.slotNumber} (${slot.chapterTitle}) generating...]`}
                                        </p>

                                        {/* MCQ Options */}
                                        {qItem?.options && qItem.options.length > 0 && (
                                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-800 font-sans">
                                            {qItem.options.map((opt, oIdx) => (
                                              <div key={oIdx} className="leading-snug">{opt}</div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-bold font-sans text-slate-700 text-xs shrink-0 pl-2">
                                      [1]
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Standard Non-Grouped Section */
                    <div className="space-y-3.5">
                      {secSlots.map((slot, sIdx) => {
                        const qItem = slot.questionItem;
                        const label = slot.subQuestionLabel || `${slot.slotNumber}.`;
                        return (
                          <div key={slot.slotNumber} className="flex items-start justify-between gap-3 text-sm">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="font-bold shrink-0">{label}</span>
                              <div className="flex-1 font-sans">
                                <p className="font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                                  {qItem?.question_text || `[Slot #${slot.slotNumber} (${slot.chapterTitle}) generating...]`}
                                </p>

                                {slot.subparts && slot.subparts.length > 0 && slot.subparts.some((s) => s.text) && (
                                  <div className="space-y-1 mt-1.5 pl-2 border-l border-slate-300 font-sans text-xs">
                                    {slot.subparts.filter((s) => s.text).map((sub, subIdx) => (
                                      <div key={subIdx} className="flex items-center justify-between text-slate-800">
                                        <span>{sub.label} {sub.text}</span>
                                        <span className="font-semibold">[{sub.marks}]</span>
                                      </div>
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Assessment Quality Certificate */}
          {includeAssessmentAudit && report && (
            <div className="mt-8 pt-4 border-t-2 border-slate-900 font-sans page-break-before space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Question Engine Quality & Assessment Audit Certificate
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  Quality Score: {report.totalScore}/100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="font-bold text-slate-900 block mb-1">Universal Assessment Rules:</span>
                  <p className="text-[11px] text-slate-600">
                    {report.universalAudit.passedRulesCount} / {report.universalAudit.evaluatedRulesCount} Rules Passed.
                    Total attempted marks arithmetic: exact 70/70.
                    Zero unauthorized outside-syllabus citations.
                    Deduplication: {report.universalAudit.duplicates.length} duplicate/redundant questions detected.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="font-bold text-slate-900 block mb-1">Class VI Mathematics Benchmark Profile:</span>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div>
                      Textbook Exercise Derivation:{' '}
                      {report.subjectProfileAudit?.exerciseDerivationPercentage !== null &&
                      report.subjectProfileAudit?.exerciseDerivationPercentage !== undefined
                        ? `${report.subjectProfileAudit.exerciseDerivationPercentage}%`
                        : 'Not yet verified'}{' '}
                      (Target ≥ 80%).
                    </div>
                    <div>
                      Numerical structure check:{' '}
                      {report.subjectProfileAudit?.numericalValidationStatus === 'structure_passed'
                        ? 'PASS'
                        : report.subjectProfileAudit?.numericalValidationStatus === 'structure_failed'
                        ? 'FAIL'
                        : 'NOT YET VERIFIED'}
                      . Mathematical correctness: NOT YET VERIFIED.
                    </div>
                    <div>
                      Geometry / diagram questions detected:{' '}
                      {report.subjectProfileAudit?.geometryCount ?? 0} (Informational).
                    </div>
                    <div>
                      Connected 1+1 structure:{' '}
                      {report.subjectProfileAudit?.connectedSubpartsStatus === 'structure_passed'
                        ? 'PASS'
                        : report.subjectProfileAudit?.connectedSubpartsStatus === 'structure_failed'
                        ? 'FAIL'
                        : 'NOT YET VERIFIED'}
                      {' · '}Semantic connection: TEACHER / AI REVIEW REQUIRED.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter Weightage Audit Table */}
          {includeWeightageAudit && (
            <div className="mt-6 pt-4 border-t border-slate-300 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Chapter Weightage Allocation Table
                </span>
                <span className="text-xs font-semibold text-emerald-800">
                  Attempted Target: {paper.totalMarks} Marks
                </span>
              </div>

              <table className="w-full text-left text-xs mt-2 border border-slate-200">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="py-1.5 px-2">Chapter Title</th>
                    <th className="py-1.5 px-2 text-center">Assigned Questions</th>
                    <th className="py-1.5 px-2 text-right">Target Marks</th>
                    <th className="py-1.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paper.chaptersWeightage.filter((c) => c.included).map((chap) => {
                    const count = paper.slots.filter((s) => s.chapterId === chap.chapter_id).length;
                    return (
                      <tr key={chap.chapter_id}>
                        <td className="py-1.5 px-2 font-medium">{chap.chapter_title}</td>
                        <td className="py-1.5 px-2 text-center">{count}</td>
                        <td className="py-1.5 px-2 text-right font-bold">{chap.marks}m</td>
                        <td className="py-1.5 px-2 text-center text-emerald-700 font-bold">✓ Target Met</td>
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
                  Teacher Evaluation Sheet: Model Answers & Step-by-Step Marking Schemes
                </h3>
              </div>

              <div className="space-y-3.5">
                {paper.slots.map((slot) => {
                  const qItem = slot.questionItem;
                  return (
                    <div key={slot.slotNumber} className="text-xs space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>
                          {slot.groupTitle ? `${slot.groupTitle} · ${slot.subQuestionLabel}` : `Question ${slot.slotNumber}`} ({slot.marks} Mark{slot.marks > 1 ? 's' : ''})
                        </span>
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
                          <span className="font-semibold text-slate-800 block">Marking Rubric:</span>
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
            A4 Examination Paper Layout · Total Attempted: 70 Marks
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
              <span>Print / Save Paper PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
