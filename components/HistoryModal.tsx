
import React from 'react';
import { Snapshot } from '../types';
import { X, RotateCcw, Clock, Calendar } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  history: Snapshot[];
  onClose: () => void;
  onRestore: (snapshot: Snapshot) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  isOpen, 
  history, 
  onClose, 
  onRestore 
}) => {
  if (!isOpen) return null;

  // Sort history by timestamp descending (newest first)
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(ts));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600"/>
            Version History
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar size={48} className="mx-auto mb-3 opacity-20" />
              <p>No history snapshots available yet.</p>
              <p className="text-xs mt-1">Snapshots are created automatically after generation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((snap) => (
                <div key={snap.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{snap.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{formatTime(snap.timestamp)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {snap.state.blocks.length} blocks • {snap.state.blocks.filter(b => b.content).length} generated
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                        if (window.confirm("Are you sure you want to restore this version? Current unsaved changes will be lost.")) {
                            onRestore(snap);
                            onClose();
                        }
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
                    title="Restore this version"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-400 shrink-0">
            Showing {sortedHistory.length} versions
        </div>
      </div>
    </div>
  );
};
