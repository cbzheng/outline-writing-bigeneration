import React from 'react';
import {
    Copy, ArrowRight, FileText, MessageSquarePlus, PanelRightClose, PanelRightOpen, RefreshCw, Sparkles, X
} from 'lucide-react';
import { Block } from '../types';

interface EditorProps {
    blocks: Block[];
    selectedBlockIds: Set<string>;
    handleCopyAll: () => void;
    updateBlock: (id: string, updates: Partial<Block>) => void;
    handleTextFocus: (id: string) => void;
    setActiveRemarkBlockId: (id: string) => void;
    toggleInlineRemarks: (id: string) => void;
    inlineRemarksBlockIds: Set<string>;
    setRegenerationTargetBlockId: (id: string) => void;
}

export const Editor: React.FC<EditorProps> = ({
    blocks,
    selectedBlockIds,
    handleCopyAll,
    updateBlock,
    handleTextFocus,
    setActiveRemarkBlockId,
    toggleInlineRemarks,
    inlineRemarksBlockIds,
    setRegenerationTargetBlockId,
}) => {
    return (
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 bg-white relative">
            <div className="max-w-5xl mx-auto min-h-full">

                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleCopyAll}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Copy all generated text to clipboard"
                    >
                        <Copy size={14} />
                        Copy All
                    </button>
                </div>

                {blocks.filter(b => b.content).length === 0 ? (
                    <div className="h-[70vh] flex flex-col items-center justify-center text-slate-300">
                        <ArrowRight size={64} className="mb-6 opacity-20" />
                        <h2 className="text-xl font-medium text-slate-400">Content will appear here</h2>
                        <p className="text-slate-400 mt-2">Generate content from your outline to start writing.</p>
                    </div>
                ) : (
                    blocks.map((block) => {
                        if (!block.content && !selectedBlockIds.has(block.id)) return null;

                        return (
                            <div
                                id={`text-block-${block.id}`}
                                key={block.id}
                                className={`group flex flex-row gap-6 transition-all duration-300 ${selectedBlockIds.has(block.id) ? 'translate-x-1 mb-6' : 'mb-4'}`}
                            >
                                {/* Left Sidebar: Title */}
                                <div className="w-32 md:w-48 shrink-0 pt-1.5 text-right select-none">
                                    <div
                                        className={`text-[11px] uppercase font-bold tracking-wide transition-colors duration-200 ${selectedBlockIds.has(block.id) ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-400'}`}
                                    >
                                        {block.title}
                                    </div>
                                </div>

                                {/* Right Content Area */}
                                <div className="flex-1 min-w-0 flex gap-4">
                                    {/* Text Editor Wrapper */}
                                    <div className={`relative rounded-lg transition-all duration-200 ${selectedBlockIds.has(block.id) ? 'ring-2 ring-indigo-50 bg-indigo-50/10' : ''} ${inlineRemarksBlockIds.has(block.id) ? 'w-2/3' : 'w-full'} ${block.isOutdated ? 'ring-2 ring-amber-300 bg-amber-50/30' : ''}`}>
                                        <textarea
                                            value={block.content}
                                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                            onFocus={() => handleTextFocus(block.id)}
                                            placeholder="Drafting content..."
                                            className={`w-full bg-transparent resize-none overflow-hidden outline-none leading-relaxed min-h-[1em] px-3 py-1 rounded hover:bg-slate-50 transition-colors font-serif ${block.level === 0 ? 'text-2xl font-bold text-slate-800' : 'text-lg text-slate-700'}`}
                                            style={{ height: 'auto', minHeight: '1.5em' }}
                                            ref={(el) => {
                                                if (el) {
                                                    el.style.height = 'auto';
                                                    el.style.height = el.scrollHeight + 'px';
                                                }
                                            }}
                                        />

                                        {/* Unified Floating Toolbar */}
                                        <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white shadow-sm border border-slate-200 rounded-full flex items-center overflow-hidden z-10 scale-90 hover:scale-100 origin-right">
                                            <button
                                                onClick={() => setActiveRemarkBlockId(block.id)}
                                                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Open remarks panel"
                                            >
                                                <MessageSquarePlus size={14} />
                                            </button>
                                            <div className="w-px h-3 bg-slate-100"></div>
                                            <button
                                                onClick={() => toggleInlineRemarks(block.id)}
                                                className={`p-1.5 hover:bg-slate-50 transition-colors ${inlineRemarksBlockIds.has(block.id) ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                                                title="Toggle inline remarks view"
                                            >
                                                {inlineRemarksBlockIds.has(block.id) ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                                            </button>
                                            <div className="w-px h-3 bg-slate-100"></div>
                                            <button
                                                onClick={() => { setRegenerationTargetBlockId(block.id); }}
                                                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Regenerate this section"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        </div>

                                        {/* Outdated Warning */}
                                        {block.isOutdated && (
                                            <div className="absolute -top-3 left-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-2 shadow-sm z-10">
                                                <span>OUTDATED</span>
                                                <button
                                                    onClick={() => updateBlock(block.id, { isOutdated: false })}
                                                    className="hover:text-amber-950"
                                                    title="Dismiss warning"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inline Remarks Section */}
                                    {inlineRemarksBlockIds.has(block.id) && (
                                        <div className="w-1/3 bg-slate-50 rounded-lg border border-slate-200 p-3 text-sm animate-fade-in-left">
                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                                                <span className="font-semibold text-slate-500 text-xs uppercase tracking-wide">Remarks & AI</span>
                                                <button onClick={() => toggleInlineRemarks(block.id)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                                {block.suggestions?.map(s => (
                                                    <div key={s.id} className="bg-white border border-slate-200 rounded p-2 shadow-sm">
                                                        <div className="text-xs text-slate-500 mb-1 font-medium">"{s.userText}"</div>
                                                        <div className="text-slate-700 text-xs leading-relaxed pl-2 border-l-2 border-indigo-200">
                                                            <Sparkles size={10} className="inline mr-1 text-indigo-500" />
                                                            {s.aiText}
                                                        </div>
                                                    </div>
                                                ))}
                                                {block.comments?.map(c => (
                                                    <div key={c.id} className="bg-yellow-50 border border-yellow-100 rounded p-2 text-xs text-slate-700">
                                                        <span className="font-bold text-yellow-600 uppercase text-[10px] mr-1">{c.type}</span>
                                                        {c.text}
                                                    </div>
                                                ))}
                                                {(!block.suggestions?.length && !block.comments?.length) && (
                                                    <div className="text-center text-slate-400 text-xs py-4 italic">
                                                        No remarks yet. Open panel to add.
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setActiveRemarkBlockId(block.id)}
                                                className="w-full mt-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <MessageSquarePlus size={12} /> Add Remark
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                <div className="h-40"></div> {/* Bottom spacer */}
            </div>
        </main>
    );
};
