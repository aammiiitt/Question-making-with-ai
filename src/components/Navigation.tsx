import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  FileQuestion,
  Settings,
  Plus,
  GraduationCap,
  Languages,
} from 'lucide-react';
import { User } from '../types';

export type ActiveTab = 'dashboard' | 'library' | 'generate' | 'questions' | 'settings' | 'book_details';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: User;
  onOpenUpload: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenUpload,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'My Library', icon: BookOpen },
    { id: 'generate', label: 'Generate Question', icon: Sparkles },
    { id: 'questions', label: 'My Questions', icon: FileQuestion },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-screen fixed top-0 left-0 bottom-0 z-30 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <GraduationCap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 leading-tight text-base tracking-tight">
              AI Question Paper Maker
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Teacher Assessment Assistant
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-4">
          <button
            onClick={() => setActiveTab('generate')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-medium text-sm shadow-sm hover:shadow active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Generate Question</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Core Product Principle Banner */}
        <div className="p-3 mx-3 mb-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
          <div className="font-semibold mb-1 flex items-center gap-1.5 text-amber-950">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Assessment Principle
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            AI generates · Rules control · Teacher approves. Every question is source-grounded.
          </p>
        </div>

        {/* Teacher Profile Summary Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
            {user.name.charAt(0) || 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
              <Languages className="w-3 h-3 inline text-slate-400" />
              <span>{user.preferred_language === 'bn' ? 'বাংলা' : user.preferred_language === 'bilingual' ? 'Bilingual' : 'English'}</span>
              <span>·</span>
              <span>{user.board || 'CBSE/WBBSE'}</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-xs font-medium ${
            activeTab === 'dashboard' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-xs font-medium ${
            activeTab === 'library' || activeTab === 'book_details' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Library</span>
        </button>

        <button
          onClick={() => setActiveTab('generate')}
          className="flex flex-col items-center -mt-4 bg-slate-900 text-white rounded-full p-2.5 shadow-md active:scale-95"
          aria-label="Generate Question"
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-xs font-medium ${
            activeTab === 'questions' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <FileQuestion className="w-5 h-5" />
          <span>Questions</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-xs font-medium ${
            activeTab === 'settings' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>
    </>
  );
};
