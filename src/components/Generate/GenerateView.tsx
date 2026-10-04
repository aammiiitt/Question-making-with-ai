import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  FileCheck2,
  Languages,
  CheckCircle2,
  Loader2,
  AlertCircle,
  HelpCircle,
  Check,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import {
  DocumentItem,
  Chapter,
  Topic,
  QuestionType,
  DifficultyLevel,
  Language,
  QuestionItem,
  QuestionFeedback,
} from '../../types';
import { questionGenerationService } from '../../services/questionGenerationService';
import { storageService } from '../../services/storageService';
import { QuestionCard } from '../QuestionReview/QuestionCard';
import { RegenerateStrategy } from '../QuestionReview/RegenerateModal';

interface GenerateViewProps {
  documents: DocumentItem[];
  preselectedBookId?: string;
  preselectedChapterId?: string;
  onQuestionApproved: (question: QuestionItem) => void;
  onNavigateToUpload: () => void;
}

const QUESTION_TYPES: { id: QuestionType; label: string; defaultMarks: number }[] = [
  { id: 'mcq', label: 'Multiple Choice (MCQ)', defaultMarks: 1 },
  { id: 'short_answer', label: 'Short Answer (2–3 marks)', defaultMarks: 2 },
  { id: 'very_short_answer', label: 'Very Short Answer (1 mark)', defaultMarks: 1 },
  { id: 'numerical', label: 'Numerical / Problem Solving', defaultMarks: 3 },
  { id: 'long_answer', label: 'Long Answer (4–5 marks)', defaultMarks: 5 },
  { id: 'assertion_reason', label: 'Assertion–Reasoning', defaultMarks: 1 },
  { id: 'fill_in_the_blank', label: 'Fill in the Blank', defaultMarks: 1 },
  { id: 'true_false', label: 'True / False', defaultMarks: 1 },
  { id: 'case_based', label: 'Case-Based / Comprehension', defaultMarks: 4 },
  { id: 'diagram_based', label: 'Diagram-Based / Figure Question', defaultMarks: 3 },
  { id: 'match_the_following', label: 'Match the Following Column', defaultMarks: 3 },
];

const GENERATION_PROGRESS_STEPS = [
  'Loading selected chapter',
  'Finding relevant textbook content',
  'Building question with Gemini AI',
  'Checking model answer & marking scheme',
  'Checking source page citations',
  'Finalizing question card',
];

export const GenerateView: React.FC<GenerateViewProps> = ({
  documents,
  preselectedBookId,
  preselectedChapterId,
  onQuestionApproved,
  onNavigateToUpload,
}) => {
  // Form State
  const [selectedBookId, setSelectedBookId] = useState<string>(
    preselectedBookId || documents[0]?.id || ''
  );
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    preselectedChapterId || ''
  );
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  const [questionType, setQuestionType] = useState<QuestionType>('short_answer');
  const [marks, setMarks] = useState<number>(2);
  const [customMarks, setCustomMarks] = useState<string>('');
  const [isCustomMarks, setIsCustomMarks] = useState(false);

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('moderate');
  const [language, setLanguage] = useState<Language>('en');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Generation process state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('Loading selected chapter');
  const [progressStep, setProgressStep] = useState<number>(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Result state
  const [generatedQuestion, setGeneratedQuestion] = useState<QuestionItem | null>(null);

  // Load chapters when book changes
  useEffect(() => {
    if (selectedBookId) {
      const chaps = storageService.getChapters(selectedBookId);
      setAvailableChapters(chaps);
      if (preselectedChapterId && chaps.some((c) => c.id === preselectedChapterId)) {
        setSelectedChapterId(preselectedChapterId);
      } else {
        setSelectedChapterId(chaps[0]?.id || '');
      }
    } else {
      setAvailableChapters([]);
      setSelectedChapterId('');
    }
  }, [selectedBookId, preselectedChapterId]);

  // Load topics when chapter changes
  useEffect(() => {
    if (selectedChapterId) {
      const tops = storageService.getTopics(selectedChapterId);
      setAvailableTopics(tops);
      setSelectedTopicId('');
    } else {
      setAvailableTopics([]);
      setSelectedTopicId('');
    }
  }, [selectedChapterId]);

  // Sync marks when question type changes (if not custom)
  const handleQuestionTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    if (!isCustomMarks) {
      const found = QUESTION_TYPES.find((q) => q.id === type);
      if (found) setMarks(found.defaultMarks);
    }
  };

  const handleGenerate = async (
    regenerationStrategy?: RegenerateStrategy,
    prevQuestionId?: string
  ) => {
    if (!selectedBookId || !selectedChapterId) {
      setGenerationError('Please select both a textbook and a chapter.');
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);
    setProgressStep(0);
    setProgressStatus('Loading selected chapter...');

    const actualMarks = isCustomMarks && Number(customMarks) ? Number(customMarks) : marks;

    try {
      const result = await questionGenerationService.generateQuestion(
        {
          documentId: selectedBookId,
          chapterId: selectedChapterId,
          topicId: selectedTopicId || undefined,
          questionType,
          marks: actualMarks,
          difficulty,
          language,
          additionalInstructions: additionalInstructions.trim() || undefined,
          regenerationContext: regenerationStrategy
            ? {
                previousQuestionId: prevQuestionId,
                strategy: regenerationStrategy,
              }
            : undefined,
        },
        (status, stepIndex) => {
          setProgressStatus(status);
          setProgressStep(stepIndex);
        }
      );

      setGeneratedQuestion(result);
    } catch (err: any) {
      console.error(err);
      setGenerationError(
        err.message || 'AI error: The question could not be generated. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = (q: QuestionItem) => {
    const updated = { ...q, status: 'approved' as const };
    storageService.saveQuestion(updated);
    setGeneratedQuestion(updated);
    onQuestionApproved(updated);
  };

  const handleEdit = (updated: QuestionItem) => {
    storageService.saveQuestion(updated);
    setGeneratedQuestion(updated);
  };

  const handleRegenerate = (strategy: RegenerateStrategy) => {
    handleGenerate(strategy, generatedQuestion?.id);
  };

  const handleReject = (reason: QuestionFeedback['rejection_reason'], notes?: string) => {
    if (generatedQuestion) {
      storageService.saveFeedback({
        id: 'fb-' + Date.now(),
        question_id: generatedQuestion.id,
        user_id: 'teacher-101',
        action: 'reject',
        rejection_reason: reason,
        notes,
        created_at: new Date().toISOString(),
      });
      const updated = { ...generatedQuestion, status: 'rejected' as const };
      storageService.saveQuestion(updated);
      setGeneratedQuestion(updated);
    }
  };

  // If no books exist in library
  if (documents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 shadow-xs">
        <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Upload a Textbook First</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          AI Question Paper Maker requires syllabus source material to ground all generated questions and citations.
        </p>
        <button
          onClick={onNavigateToUpload}
          className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm cursor-pointer"
        >
          Upload Textbook PDF
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200/80">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate Question</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select syllabus source passages and configure assessment rules for source-grounded formulation
        </p>
      </div>

      {/* Error Banner */}
      {generationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-950">Generation Error</p>
            <p className="mt-0.5 leading-relaxed">{generationError}</p>
          </div>
        </div>
      )}

      {/* Main Configuration Form Card */}
      {!isGenerating && !generatedQuestion && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Section 1: Source Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-slate-700" />
              <span>1. Source Material</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Book */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Book
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.page_count} pages)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Chapter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Chapter
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  {availableChapters.map((chap) => (
                    <option key={chap.id} value={chap.id}>
                      {chap.chapter_number}. {chap.title} (pp. {chap.page_start}–{chap.page_end})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Topic */}
            {availableTopics.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Target Specific Topic (Optional)</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Leave blank to sample across entire chapter
                  </span>
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-normal text-slate-800"
                >
                  <option value="">Entire Chapter (Automatic RAG semantic ranking)</option>
                  {availableTopics.map((top) => (
                    <option key={top.id} value={top.id}>
                      {top.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 2: Question Type & Specifications */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>2. Assessment Format & Rules</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Question Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Question Type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => handleQuestionTypeChange(e.target.value as QuestionType)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900"
                >
                  {QUESTION_TYPES.map((qt) => (
                    <option key={qt.id} value={qt.id}>
                      {qt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Marks Allocation
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setIsCustomMarks(false);
                        setMarks(m);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        !isCustomMarks && marks === m
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomMarks(true)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      isCustomMarks
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {isCustomMarks && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={25}
                      placeholder="Enter marks"
                      value={customMarks}
                      onChange={(e) => setCustomMarks(e.target.value)}
                      className="w-28 px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                    />
                    <span className="text-xs text-slate-500">marks</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'moderate', 'difficult'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 text-xs font-semibold capitalize rounded-xl border transition-all cursor-pointer ${
                        difficulty === diff
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Output Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('bn')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      language === 'bn'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    বাংলা (Bengali)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('bilingual')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      language === 'bilingual'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Bilingual
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Additional Teacher Instructions (Optional)</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Syllabus constraints & pedagogical focus
                </span>
              </label>
              <textarea
                rows={2}
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Example: Focus on application-based understanding rather than memorization. Include real-life Indian context."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 leading-relaxed font-sans placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Passages retrieved dynamically from selected chapter pages
            </span>
            <button
              type="button"
              onClick={() => handleGenerate()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generate Question</span>
            </button>
          </div>
        </div>
      )}

      {/* Section 8: Transparent Processing Progress State */}
      {isGenerating && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center space-y-6 max-w-xl mx-auto">
          <div>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs mb-3">
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Generating Your Question</h2>
            <p className="text-xs text-slate-500 mt-1">
              Applying RAG retrieval and strict source grounding
            </p>
          </div>

          {/* Milestones list */}
          <div className="space-y-2.5 text-left max-w-md mx-auto pt-2">
            {GENERATION_PROGRESS_STEPS.map((stepLabel, idx) => {
              const isPast = progressStep > idx;
              const isCurrent = progressStep === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                    isPast
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium'
                      : isCurrent
                      ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                      : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-slate-800 animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center text-slate-400">
                        {idx + 1}
                      </span>
                    )}
                    <span>{stepLabel}</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold">
                    {isPast ? 'Done' : isCurrent ? 'Active' : 'Waiting'}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Retrieval-Augmented Generation strictly verifies textbook page citations.
          </p>
        </div>
      )}

      {/* Generated Question Result Review */}
      {!isGenerating && generatedQuestion && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Generated Question Review</span>
                <span className="text-xs font-normal text-slate-500">
                  (Teacher verification required)
                </span>
              </h2>
            </div>
            <button
              onClick={() => {
                setGeneratedQuestion(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Configure Another</span>
            </button>
          </div>

          <QuestionCard
            question={generatedQuestion}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onRegenerate={handleRegenerate}
            onReject={handleReject}
          />
        </div>
      )}
    </div>
  );
};
