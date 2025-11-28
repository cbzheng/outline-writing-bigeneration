import React, { useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

interface RegenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (instructions: string) => void;
}

const PREDEFINED_OPTIONS = [
    "Make it shorter",
    "Make it longer",
    "Simpler language",
    "More formal",
    "Include an example",
    "Focus on key facts"
];

export const RegenerationModal: React.FC<RegenerationModalProps> = ({ isOpen, onClose, onRegenerate }) => {
  const [instruction, setInstruction] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <RefreshCw size={16} className="text-indigo-600"/>
            Regenerate Block
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-xs text-slate-500 mb-3">How should this section be improved?</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {PREDEFINED_OPTIONS.map(opt => (
                <button
                    key={opt}
                    onClick={() => setInstruction(opt)}
                    className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-full transition-colors border border-slate-200"
                    title={`Use preset: ${opt}`}
                >
                    {opt}
                </button>
            ))}
          </div>

          <textarea
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-24"
            placeholder="Type specific instructions..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            autoFocus
          />

          <div className="flex justify-end pt-4 gap-2">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
                title="Cancel regeneration"
            >
                Cancel
            </button>
            <button
              onClick={() => onRegenerate(instruction)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              title="Start regeneration with these instructions"
            >
              <Sparkles size={16} />
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
