import React from 'react';
import { X, Lightbulb, BookOpen, PenTool, MessageCircle } from 'lucide-react';
import { Insights } from '../types';

interface InsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    insights: Insights | null;
}

export const InsightsModal: React.FC<InsightsModalProps> = ({ isOpen, onClose, insights }) => {
    if (!isOpen || !insights) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Lightbulb size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Analysis Insights</h2>
                            <p className="text-sm text-slate-500">Derived from your reference materials</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Style & Tone Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-indigo-600 font-semibold text-sm uppercase tracking-wide">
                                <PenTool size={16} /> Writing Style
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed">{insights.style}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-indigo-600 font-semibold text-sm uppercase tracking-wide">
                                <MessageCircle size={16} /> Tone
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed">{insights.tone}</p>
                        </div>
                    </div>

                    {/* Structure */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-base">
                            <BookOpen size={18} className="text-indigo-500" /> Structural Analysis
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{insights.structure}</p>
                    </div>

                    {/* Key Points */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Key Themes & Points</h3>
                        <div className="grid gap-2">
                            {insights.keyPoints.map((point, index) => (
                                <div key={index} className="flex gap-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-slate-700">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};
