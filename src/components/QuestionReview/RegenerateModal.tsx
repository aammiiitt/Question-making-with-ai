import React, { useState } from 'react';
import { X, RefreshCw, Sparkles, TrendingUp, TrendingDown, Layers, Split } from 'lucide-react';

export type RegenerateStrategy =
  | 'similar'
  | 'easier'
  | 'harder'
  | 'same_topic_diff'
  | 'diff_topic';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: RegenerateStrategy) => void;
}

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const [selectedStrategy, setSelectedStrategy] = useState<RegenerateStrategy>('similar');

  const strategies: {
    id: RegenerateStrategy;
    title: string;
    description: string;
    icon: any;
  }[] = [
    {
      id: 'similar',
      title: 'Similar Question',
      description: 'Generate an equivalent parallel question covering the same core learning outcome.',
      icon: Sparkles,
    },
    {
      id: 'easier',
      title: 'Easier Question',
      description: 'Lower cognitive demand to basic recall or straightforward comprehension.',
      icon: TrendingDown,
    },
    {
      id: 'harder',
      title: 'Harder Question',
      description: 'Increase cognitive complexity with application, analysis, or numerical multi-step reasoning.',
      icon: TrendingUp,
    },
    {
      id: 'same_topic_diff',
      title: 'Same Topic, Different Question',
      description: 'Explore an alternative angle, sub-equation, or conceptual detail in this topic.',
      icon: Split,
    },
    {
      id: 'diff_topic',
      title: 'Different Topic within Chapter',
      description: 'Sample from adjacent sections and learning objectives of the selected chapter.',
      icon: Layers,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Regenerate Question</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2 mb-4">
          Select how you want Gemini AI to adjust its formulation while keeping strict textbook grounding:
        </p>

        {/* Strategy Options */}
        <div className="space-y-2.5">
          {strategies.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedStrategy === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedStrategy(s.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{s.title}</p>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(selectedStrategy);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New Variant</span>
          </button>
        </div>
      </div>
    </div>
  );
};
