import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { DocumentItem, Chapter, Topic, KnowledgeChunk } from '../../types';
import { TextbookProcessingReport } from './TextbookProcessingReport';

interface BookDetailsViewProps {
  document: DocumentItem;
  chapters: Chapter[];
  topics: Topic[];
  chunks: KnowledgeChunk[];
  onBack: () => void;
  onGenerateForChapter: (bookId: string, chapterId: string) => void;
  onSaveChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  onAddChapter: (newChap: Partial<Chapter>) => void;
  onNavigateToExamBuilder?: () => void;
  onConfirmSuccess?: (updatedDoc: DocumentItem, updatedChapters: Chapter[]) => void;
}

export const BookDetailsView: React.FC<BookDetailsViewProps> = ({
  document,
  chapters,
  topics,
  chunks,
  onBack,
  onGenerateForChapter,
  onSaveChapter,
  onDeleteChapter,
  onAddChapter,
  onNavigateToExamBuilder,
  onConfirmSuccess,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        {onNavigateToExamBuilder && (
          <button
            onClick={onNavigateToExamBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Class VI 70M Exam Builder</span>
          </button>
        )}
      </div>

      {/* TEXTBOOK PROCESSING & VERIFICATION REPORT */}
      <TextbookProcessingReport
        document={document}
        chapters={chapters}
        topics={topics}
        chunks={chunks}
        onConfirmSuccess={onConfirmSuccess}
        onNavigateToExamBuilder={onNavigateToExamBuilder}
      />
    </div>
  );
};

