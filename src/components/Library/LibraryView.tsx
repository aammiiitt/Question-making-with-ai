import React, { useState } from 'react';
import {
  UploadCloud,
  BookOpen,
  FileText,
  Trash2,
  RefreshCw,
  FolderOpen,
  Calendar,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { DocumentItem } from '../../types';

interface LibraryViewProps {
  documents: DocumentItem[];
  onUploadClick: () => void;
  onOpenBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onProcessAgain: (book: DocumentItem) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  documents,
  onUploadClick,
  onOpenBook,
  onDeleteBook,
  onProcessAgain,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: DocumentItem['status']) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </span>
        );
      case 'processing':
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
            <AlertTriangle className="w-3 h-3" />
            Needs Review
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Library</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your uploaded textbooks, detected syllabus chapters, and indexed knowledge
          </p>
        </div>
        <button
          onClick={onUploadClick}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4 text-amber-400" />
          <span>Upload Book</span>
        </button>
      </div>

      {/* Search & Counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search textbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium self-end sm:self-auto">
          {filteredDocs.length} {filteredDocs.length === 1 ? 'textbook' : 'textbooks'} available
        </span>
      </div>

      {/* Book Cards Grid */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 shadow-xs">
          <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Textbooks Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? 'No books match your search filter.'
              : 'Upload your first syllabus textbook to begin.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onUploadClick}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Upload Textbook PDF
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const dateStr = new Date(doc.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const sizeMb = (doc.file_size / (1024 * 1024)).toFixed(1);

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>

                  <h3
                    onClick={() => onOpenBook(doc.id)}
                    className="font-bold text-slate-900 text-sm leading-snug cursor-pointer hover:text-slate-700 transition-colors line-clamp-2"
                  >
                    {doc.title}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.detected_chapters_count} Detected Chapters</span>
                      <span>·</span>
                      <span>{doc.page_count} Pages</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Languages className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.language}</span>
                      <span>·</span>
                      <span>PDF ({sizeMb} MB)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Uploaded {dateStr}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenBook(doc.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>

                  <button
                    onClick={() => onProcessAgain(doc)}
                    title="Process Again"
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                        onDeleteBook(doc.id);
                      }
                    }}
                    title="Delete Book"
                    className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
