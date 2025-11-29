import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, MessageSquare, RefreshCw, MessageSquarePlus } from 'lucide-react';
import { Block, ApiKeys, GenerationStatus, Suggestion } from '../types';
import { generateContentFromBlocks, generateSuggestion } from '../services/geminiService';

interface RemarksPanelProps {
    isOpen: boolean;
    onClose: () => void;
    blockId: string | null;
    blocks: Block[];
    apiKeys: ApiKeys;
    updateBlock: (id: string, updates: Partial<Block>) => void;
    setStatus: (status: GenerationStatus) => void;
    setStatusMessage: (msg: string) => void;
}

export const RemarksPanel: React.FC<RemarksPanelProps> = ({
    isOpen,
    onClose,
    blockId,
    blocks,
    apiKeys,
    updateBlock,
    setStatus,
    setStatusMessage
}) => {
    const [remark, setRemark] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const block = blocks.find(b => b.id === blockId);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [block?.suggestions]);

    if (!isOpen || !block) return null;

    const handleRegenerate = async () => {
        if (!remark.trim() || !apiKeys.google) return;

        setIsProcessing(true);
        setStatus('loading');
        setStatusMessage('Regenerating based on remarks...');

        try {
            const map = await generateContentFromBlocks(
                apiKeys.google,
                apiKeys.model,
                [block],
                "", // Topic not needed for refinement usually, or passed from context if available. 
                // Ideally App should pass topic, but for refinement, block context is key.
                // Let's assume the service handles empty topic if refinement is present.
                undefined,
                { [block.id]: remark }
            );

            if (map[block.id]) {
                updateBlock(block.id, { content: map[block.id] });
                setRemark('');
                setStatus('success');
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
            setStatusMessage('Failed to regenerate.');
        } finally {
            setIsProcessing(false);
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const handleSuggest = async () => {
        if (!remark.trim() || !apiKeys.google) return;

        setIsProcessing(true);
        try {
            const suggestionText = await generateSuggestion(
                apiKeys.google,
                apiKeys.model,
                block.content,
                remark
            );

            const newSuggestion: Suggestion = {
                id: Date.now().toString(),
                userText: remark,
                aiText: suggestionText,
                timestamp: Date.now()
            };

            updateBlock(block.id, {
                suggestions: [...(block.suggestions || []), newSuggestion]
            });
            setRemark('');
        } catch (e) {
            console.error(e);
            alert("Failed to get suggestion");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddComment = () => {
        if (!remark.trim()) return;

        const newComment = {
            id: Date.now().toString(),
            type: 'general' as const,
            text: remark
        };

        updateBlock(block.id, {
            comments: [...block.comments, newComment]
        });
        setRemark('');
    };

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-40 flex flex-col animate-slide-in-right">
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <MessageSquarePlus size={18} className="text-indigo-600" />
                    <span>Remarks & AI</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {/* Suggestions History */}
                {block.suggestions?.map(s => (
                    <div key={s.id} className="space-y-2">
                        <div className="flex justify-end">
                            <div className="bg-indigo-600 text-white px-3 py-2 rounded-2xl rounded-tr-none text-sm max-w-[85%] shadow-sm">
                                {s.userText}
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-2xl rounded-tl-none text-sm max-w-[90%] shadow-sm">
                                <div className="flex items-center gap-1 text-xs text-indigo-500 font-bold mb-1 uppercase tracking-wide">
                                    <Sparkles size={10} /> AI Suggestion
                                </div>
                                {s.aiText}
                            </div>
                        </div>
                    </div>
                ))}

                {block.suggestions?.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-8">
                        <Sparkles size={32} className="mx-auto mb-2 opacity-20" />
                        <p>Ask for suggestions or regenerate content based on your remarks.</p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Enter your remarks, questions, or instructions..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 mb-3"
                />

                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={handleRegenerate}
                        disabled={isProcessing || !remark.trim()}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors text-xs font-medium"
                        title="Regenerate content based on these notes"
                    >
                        <RefreshCw size={16} />
                        Regenerate
                    </button>

                    <button
                        onClick={handleSuggest}
                        disabled={isProcessing || !remark.trim()}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors text-xs font-medium"
                        title="Get AI suggestions without changing content"
                    >
                        <Sparkles size={16} />
                        Suggest
                    </button>

                    <button
                        onClick={handleAddComment}
                        disabled={isProcessing || !remark.trim()}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors text-xs font-medium"
                        title="Just add as a comment"
                    >
                        <MessageSquare size={16} />
                        Comment
                    </button>
                </div>
            </div>
        </div>
    );
};
