import React, { useState, useEffect } from 'react';
import { CommentType } from '../types';
import { X, Check } from 'lucide-react';

interface CommentModalProps {
  isOpen: boolean;
  initialText?: string;
  initialType?: CommentType;
  onClose: () => void;
  onSave: (type: CommentType, text: string) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ 
    isOpen, 
    initialText = '', 
    initialType = 'general', 
    onClose, 
    onSave 
}) => {
  const [text, setText] = useState(initialText);
  const [type, setType] = useState<CommentType>(initialType);

  // Update state when initial props change or modal opens
  useEffect(() => {
    if (isOpen) {
        setText(initialText);
        setType(initialType);
    }
  }, [isOpen, initialText, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(type, text);
      setText('');
      setType('general');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{initialText ? 'Edit Instruction' : 'Add Instruction'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Close">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {(['must', 'maybe', 'creative', 'general'] as CommentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  title={`Select category: ${t}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all
                    ${type === t 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Instruction</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-24"
              placeholder="e.g., Use a metaphor about the ocean..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              title="Save changes"
            >
              <Check size={16} />
              Save Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
