import React, { useState } from 'react';
import {
  User as UserIcon,
  Languages,
  Sliders,
  Shield,
  Trash2,
  RotateCcw,
  Check,
  Building,
  GraduationCap,
} from 'lucide-react';
import { User, Language, DifficultyLevel } from '../../types';
import { storageService } from '../../services/storageService';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (user: Partial<User>) => void;
  onResetData: () => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onResetData,
  onClearAllData,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [board, setBoard] = useState(user.board || 'WBBSE / CBSE');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(
    user.preferred_language
  );
  const [defaultDifficulty, setDefaultDifficulty] = useState<DifficultyLevel>('moderate');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: name.trim(),
      email: email.trim(),
      board: board.trim(),
      preferred_language: preferredLanguage,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200/80">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage teacher academic profile, curriculum boards, default parameters, and storage
        </p>
      </div>

      {/* Profile Settings */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Teacher Academic Profile</h2>
          </div>
          {isSaved && (
            <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              <Check className="w-3.5 h-3.5" />
              Saved successfully
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teacher Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Curriculum Board / Examination
            </label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="WBBSE (West Bengal Board - Madhyamik)">
                WBBSE (West Bengal Board - Madhyamik)
              </option>
              <option value="WBCHSE (Higher Secondary)">WBCHSE (Higher Secondary)</option>
              <option value="CBSE (Central Board)">CBSE (Central Board)</option>
              <option value="ICSE / ISC">ICSE / ISC</option>
              <option value="State Secondary Board">State Secondary Board</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Instruction Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="bilingual">Bilingual (English + Bengali)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* Default Question Generation Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">Default Question Configuration</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Difficulty
            </label>
            <select
              value={defaultDifficulty}
              onChange={(e) => setDefaultDifficulty(e.target.value as DifficultyLevel)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="easy">Easy (Knowledge / Recall)</option>
              <option value="moderate">Moderate (Understanding / Direct)</option>
              <option value="difficult">Difficult (Application / Analysis)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Assessment Standards
            </label>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              Rules require model answers and marking rubrics with exact mark breakdowns for every generated question.
            </div>
          </div>
        </div>
      </div>

      {/* Future Roadmap / Extension Architecture */}
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
          <GraduationCap className="w-4 h-4 text-slate-700" />
          <span>Platform Extension Roadmap (Future Architecture)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          This AI Question Paper Maker prototype is engineered with modular services (RAG retrieval, chapter indexing, structured schemas). Upcoming institutional tiers will introduce:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            · Automatic Board Blueprint Compliance (CBSE / WBBSE formats)
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            · Multi-Set Paper Generator (Set A, B, C with shuffle parity)
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            · Previous-Year Question Paper Analyzer & Weightage Matrix
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            · Institution / School Multi-Teacher Department Accounts
          </div>
        </div>
      </div>

      {/* Data Management & Privacy */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">Privacy & Data Management</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          All uploaded textbooks, detected chapters, and generated questions are stored in your secure workspace storage.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset workspace to demo textbook (Class X Physical Science)?')) {
                onResetData();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo Textbook & Sample Questions</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Permanently delete all uploaded textbooks and generated questions?')) {
                onClearAllData();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
