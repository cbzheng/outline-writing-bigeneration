
import React from 'react';
import { Snapshot, Block } from '../types';
import { X, RotateCcw, Clock, Calendar, ArrowRight, FileDiff } from 'lucide-react';
import * as Diff from 'diff';

interface HistoryModalProps {
  isOpen: boolean;
  history: Snapshot[];
  onClose: () => void;
  onClose: () => void;
  onRestore: (snapshot: Snapshot) => void;
  currentBlocks: Block[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  onClose,
  onRestore,
  currentBlocks
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = React.useState<Snapshot | null>(null);

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

  // Helper to generate text representation of blocks for diffing
  const blocksToText = (blocks: Block[]) => {
    return blocks.map(b => `${'#'.repeat(b.level + 1)} ${b.title}\n${b.content || ''}`).join('\n\n');
  };

  const renderDiff = () => {
    if (!selectedSnapshot) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <FileDiff size={48} className="mb-4 opacity-20" />
        <p>Select a version to compare changes</p>
      </div>
    );

    const oldText = blocksToText(selectedSnapshot.state.blocks);
    const newText = blocksToText(currentBlocks);
    const diff = Diff.diffLines(oldText, newText);

    return (
      <div className="font-mono text-xs overflow-y-auto h-full p-4 bg-slate-50 rounded-lg border border-slate-200 custom-scrollbar">
        {diff.map((part, index) => {
          const color = part.added ? 'bg-green-100 text-green-800' :
            part.removed ? 'bg-red-100 text-red-800' : 'text-slate-600';
          const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
          return (
            <div key={index} className={`${color} whitespace-pre-wrap`}>
              {part.value.split('\n').map((line, i) => {
                if (!line) return null;
                return <div key={i}>{prefix}{line}</div>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-fade-in-up flex flex-col h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            Version History & Comparison
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: Version List */}
          <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
            <div className="p-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Snapshots
            </div>
            <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
              {sortedHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No history yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedHistory.map((snap) => (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshot(snap)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedSnapshot?.id === snap.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-slate-800 text-sm">{snap.label}</div>
                        {selectedSnapshot?.id === snap.id && <div className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">ACTIVE</div>}
                      </div>
                      <div className="text-xs text-slate-400 mb-2">{formatTime(snap.timestamp)}</div>
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {snap.state.blocks.length} blocks
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to restore this version? Current unsaved changes will be lost.")) {
                              onRestore(snap);
                              onClose();
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1 hover:underline"
                          title="Restore this version"
                        >
                          <RotateCcw size={10} /> Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Area: Diff View */}
          <div className="flex-1 flex flex-col bg-slate-50/50">
            <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-600">{selectedSnapshot ? selectedSnapshot.label : 'Select a version'}</span>
                {selectedSnapshot && (
                  <>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="font-medium text-indigo-600">Current State</span>
                  </>
                )}
              </div>
              {selectedSnapshot && (
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div> Added</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div> Removed</div>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden p-4">
              {renderDiff()}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-400 shrink-0">
          Showing {sortedHistory.length} versions
        </div>
      </div>
    </div>
  );
};
