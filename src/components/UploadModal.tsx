import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { documentProcessingService, PIPELINE_STEPS } from '../services/documentProcessingService';
import { DocumentItem, PipelineStep } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: DocumentItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' }))
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedDoc, setCompletedDoc] = useState<DocumentItem | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('PDF only: Please upload a textbook in PDF format.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const doc = await documentProcessingService.processPdf(
        selectedFile,
        (currentStep, updatedPipeline) => {
          setCurrentStepIndex(currentStep);
          setPipelineSteps(updatedPipeline);
        }
      );
      setCompletedDoc(doc);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'PDF could not be processed. We could not read enough text from this PDF. It may be scanned.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    if (completedDoc) {
      onSuccess(completedDoc);
    }
    handleClose();
  };

  const handleClose = () => {
    if (isProcessing) return; // prevent closing midway
    setSelectedFile(null);
    setIsProcessing(false);
    setCurrentStepIndex(0);
    setPipelineSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' })));
    setErrorMessage(null);
    setCompletedDoc(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 transition-all max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upload Textbook PDF</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated chapter detection, topic extraction & source indexing
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-950">PDF Processing Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Step A: Select file */}
        {!isProcessing && !completedDoc && (
          <div className="mt-5 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-slate-800 bg-slate-50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedFile ? selectedFile.name : 'Click to upload or drag & drop textbook PDF'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for pipeline analysis`
                  : 'Supports Indian board curriculum textbooks (CBSE, ICSE, WBBSE) up to 40 MB'}
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-slate-700" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · PDF
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile}
                onClick={handleStartProcessing}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                  selectedFile
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Process Textbook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step B: Visual Processing Pipeline */}
        {(isProcessing || completedDoc) && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium pb-2 border-b border-slate-100">
              <span>Textbook Processing Pipeline</span>
              <span>
                {completedDoc
                  ? (completedDoc.detected_chapters_count === 0
                      ? 'Text extraction completed, but chapter mapping needs review.'
                      : '7 of 7 stages completed')
                  : `Stage ${Math.max(1, currentStepIndex)} of 7`}
              </span>
            </div>

            <div className="space-y-2.5 py-1">
              {pipelineSteps.map((step) => {
                const isDone = step.status === 'completed';
                const isFailed = step.status === 'failed';
                const isCurrent = step.status === 'in_progress';

                return (
                  <div
                    key={step.step}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                      isDone
                        ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                        : isFailed
                        ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                        : isCurrent
                        ? 'bg-slate-100/90 border-slate-300 text-slate-900 font-semibold'
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isFailed ? (
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-slate-800 animate-spin" />
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {step.step}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={isDone ? 'font-medium text-emerald-900' : isFailed ? 'font-semibold text-amber-950' : isCurrent ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                          {step.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[11px] font-semibold ${isDone ? 'text-emerald-700' : isFailed ? 'text-amber-700' : isCurrent ? 'text-slate-700' : 'text-slate-400'}`}>
                      {isDone ? 'Done' : isFailed ? 'Needs Review' : isCurrent ? 'Active...' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>

            {completedDoc && (
              <div className={`mt-4 p-4 rounded-xl space-y-2 border ${
                completedDoc.detected_chapters_count === 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className={`flex items-center gap-2 font-semibold text-xs ${
                  completedDoc.detected_chapters_count === 0 ? 'text-amber-950' : 'text-emerald-950'
                }`}>
                  {completedDoc.detected_chapters_count === 0 ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>
                    {completedDoc.detected_chapters_count === 0
                      ? 'Text extraction completed, but chapter mapping needs review.'
                      : 'Textbook processed and indexed! Software proofs & coverage ready.'}
                  </span>
                </div>
                <div className={`text-xs flex items-center gap-3 ${
                  completedDoc.detected_chapters_count === 0 ? 'text-amber-800' : 'text-emerald-800'
                }`}>
                  <span>{completedDoc.detected_chapters_count} Chapters detected</span>
                  <span>·</span>
                  <span>{completedDoc.page_count} Physical PDF Pages indexed</span>
                </div>
                <p className={`text-[11px] mt-1 ${
                  completedDoc.detected_chapters_count === 0 ? 'text-amber-900' : 'text-emerald-900'
                }`}>
                  Next Step: Review the Textbook Processing & Verification Report and verify physical chapter page numbers before exam generation.
                </p>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={handleDone}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Processing Report & Verify Mapping</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
