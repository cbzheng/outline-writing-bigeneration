import React from 'react';
import {
    Sliders, RefreshCw, Wand2, Layout, List, AlignLeft, ChevronDown, Type, Lightbulb, Sparkles
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BlockItem } from './BlockItem';
import { Block, OutlineSettings, TextSettings, Template, GenerationStatus, ReferenceFile, Insights } from '../types';

interface SidebarProps {
    sidebarWidth: number;
    inputMode: 'topic' | 'content';
    setInputMode: (mode: 'topic' | 'content') => void;
    isInputPanelOpen: boolean;
    setIsInputPanelOpen: (isOpen: boolean) => void;
    topic: string;
    setTopic: (topic: string) => void;
    rawContent: string;
    setRawContent: (content: string) => void;
    handleTemplateSelect: (id: string) => void;
    showOutlineSettings: boolean;
    setShowOutlineSettings: (show: boolean) => void;
    outlineSettings: OutlineSettings;
    setOutlineSettings: (settings: OutlineSettings) => void;
    handleGenerateOutline: () => void;
    handleGenerateStructure: () => void;
    status: GenerationStatus;
    isMarkdownMode: boolean;
    toggleMarkdownMode: () => void;
    blocks: Block[];
    addBlock: () => void;
    markdownContent: string;
    setMarkdownContent: (content: string) => void;
    handleDragEnd: (result: DropResult) => void;
    selectedBlockIds: Set<string>;
    handleBlockSelect: (id: string, multi: boolean) => void;
    updateBlock: (id: string, updates: Partial<Block>) => void;
    removeBlock: (id: string) => void;
    setActiveCommentBlockId: (id: string) => void;
    startEditingComment: (blockId: string, commentId: string) => void;
    moveBlock: (index: number, direction: 'up' | 'down') => void;
    changeLevel: (id: string, delta: number) => void;
    showTextSettings: boolean;
    setShowTextSettings: (show: boolean) => void;
    textSettings: TextSettings;
    setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
    handleGenerateContent: (onlySelected: boolean) => void;
    templates: Template[];
    referenceFiles: ReferenceFile[];
    setReferenceFiles: React.Dispatch<React.SetStateAction<ReferenceFile[]>>;
    insights: Insights | null;
    onAnalyzeFiles: () => void;
    onShowInsights: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    sidebarWidth,
    inputMode,
    setInputMode,
    isInputPanelOpen,
    setIsInputPanelOpen,
    topic,
    setTopic,
    rawContent,
    setRawContent,
    handleTemplateSelect,
    showOutlineSettings,
    setShowOutlineSettings,
    outlineSettings,
    setOutlineSettings,
    handleGenerateOutline,
    handleGenerateStructure,
    status,
    isMarkdownMode,
    toggleMarkdownMode,
    blocks,
    addBlock,
    markdownContent,
    setMarkdownContent,
    handleDragEnd,
    selectedBlockIds,
    handleBlockSelect,
    updateBlock,
    removeBlock,
    setActiveCommentBlockId,
    startEditingComment,
    moveBlock,
    changeLevel,
    showTextSettings,
    setShowTextSettings,
    textSettings,
    setTextSettings,
    handleGenerateContent,
    templates,
    referenceFiles,
    setReferenceFiles,
    insights,
    onAnalyzeFiles,
    onShowInsights,
}) => {
    const handleReferenceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles: ReferenceFile[] = [];

            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const isPdf = file.type === 'application/pdf';

                // Read file
                const content = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result as string;
                        // For PDF (base64), remove the data URL prefix
                        if (isPdf) {
                            resolve(result.split(',')[1]);
                        } else {
                            resolve(result);
                        }
                    };
                    reader.onerror = reject;
                    if (isPdf) {
                        reader.readAsDataURL(file);
                    } else {
                        reader.readAsText(file);
                    }
                });

                newFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: file.type,
                    content: content,
                    isBase64: isPdf
                });
            }

            setReferenceFiles(prev => [...prev, ...newFiles]);
            // Reset input
            e.target.value = '';
        }
    };

    const removeReferenceFile = (id: string) => {
        setReferenceFiles(prev => prev.filter(f => f.id !== id));
    };

    return (
        <aside
            style={{ width: sidebarWidth }}
            className="flex flex-col bg-slate-50 shrink-0 border-r border-slate-200"
        >

            {/* Input Area */}
            <div className="bg-white border-b border-slate-200 relative transition-all duration-300 ease-in-out">
                {/* Header / Toggle */}
                <div
                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => setIsInputPanelOpen(!isInputPanelOpen)}
                >
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {inputMode === 'topic' ? 'Topic & Outline' : 'Content Input'}
                    </span>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <ChevronDown size={16} className={`transition-transform duration-300 ${isInputPanelOpen ? '' : '-rotate-90'}`} />
                    </button>
                </div>

                {/* Collapsible Content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isInputPanelOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 pt-0">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setInputMode('topic'); }}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputMode === 'topic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    TOPIC
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setInputMode('content'); }}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputMode === 'content' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    CONTENT
                                </button>
                            </div>

                            {inputMode === 'topic' && (
                                <div className="relative group">
                                    <select
                                        onChange={(e) => handleTemplateSelect(e.target.value)}
                                        className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded cursor-pointer outline-none hover:bg-slate-200"
                                        defaultValue=""
                                        title="Select a document template"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value="" disabled>Load Template...</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {inputMode === 'topic' ? (
                            <>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="What do you want to write about? (e.g., 'The Future of AI in Healthcare')"
                                    className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <button
                                        onClick={() => setShowOutlineSettings(!showOutlineSettings)}
                                        className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                    >
                                        <Sliders size={14} /> Configure Outline
                                    </button>
                                    <button
                                        onClick={handleGenerateOutline}
                                        disabled={!topic.trim() || status === 'loading'}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        {status === 'loading' ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                        Generate Outline
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <textarea
                                    value={rawContent}
                                    onChange={(e) => setRawContent(e.target.value)}
                                    placeholder="Paste your existing content here..."
                                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all font-mono"
                                />
                                <div className="flex justify-end items-center mt-3">
                                    <button
                                        onClick={handleGenerateStructure}
                                        disabled={!rawContent.trim() || status === 'loading'}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        {status === 'loading' ? <RefreshCw size={16} className="animate-spin" /> : <Layout size={16} />}
                                        Generate Structure
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Reference Files Section (New) */}
                        <div className="p-4 border-b border-slate-200">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Reference Materials
                            </label>

                            <div className="space-y-2 mb-3">
                                {referenceFiles.map(file => (
                                    <div key={file.id} className="flex items-center justify-between bg-slate-100 px-2 py-1.5 rounded text-xs">
                                        <span className="truncate max-w-[180px] text-slate-700" title={file.name}>{file.name}</span>
                                        <button
                                            onClick={() => removeReferenceFile(file.id)}
                                            className="text-slate-400 hover:text-red-500 ml-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.txt,.md,.json"
                                    onChange={handleReferenceFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-full border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:bg-slate-50 hover:border-indigo-300 transition-colors">
                                    <div className="text-xs text-slate-500 font-medium">
                                        <span className="text-indigo-600">Upload files</span> to analyze style
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">PDF, TXT, MD</div>
                                </div>
                            </div>

                            {referenceFiles.length > 0 && (
                                <button
                                    onClick={onAnalyzeFiles}
                                    disabled={status === 'loading'}
                                    className="w-full mt-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    {status === 'loading' ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    Analyze Files
                                </button>
                            )}
                        </div>

                        {/* Outline Settings Panel (Conditional) */}
                        {showOutlineSettings && inputMode === 'topic' && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-2 gap-2 animate-fade-in-down">
                                <div>
                                    <label className="block text-slate-400 mb-1">Length</label>
                                    <select
                                        value={outlineSettings.length}
                                        onChange={(e) => setOutlineSettings({ ...outlineSettings, length: e.target.value as any })}
                                        className="w-full p-1 border rounded bg-white"
                                        title="Target length of the outline"
                                    >
                                        <option value="short">Short (3-5 pts)</option>
                                        <option value="medium">Medium</option>
                                        <option value="long">Long (Detailed)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Depth</label>
                                    <select
                                        value={outlineSettings.detailLevel}
                                        onChange={(e) => setOutlineSettings({ ...outlineSettings, detailLevel: e.target.value as any })}
                                        className="w-full p-1 border rounded bg-white"
                                        title="Complexity of nested levels"
                                    >
                                        <option value="low">Simple</option>
                                        <option value="high">Complex (Nested)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 px-4 py-2 border-b border-slate-100">
                <button
                    onClick={toggleMarkdownMode}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title={isMarkdownMode ? "Switch to Visual View" : "Edit as Markdown"}
                >
                    {isMarkdownMode ? <List size={20} /> : <AlignLeft size={20} />}
                </button>

                {insights && (
                    <button
                        onClick={onShowInsights}
                        className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all animate-pulse-subtle"
                        title="View Analysis Insights"
                    >
                        <Lightbulb size={20} />
                    </button>
                )}
                {blocks.length > 0 && (
                    <button
                        onClick={addBlock}
                        className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-xl ml-auto"
                        title="Add manual block"
                    >
                        +
                    </button>
                )}
            </div>

            {/* Outline List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isMarkdownMode ? (
                    <div className="h-full flex flex-col">
                        <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs p-2 rounded mb-2">
                            <strong>Markdown Mode:</strong> Use <code>#</code> for Main Sections, <code>##</code> for Sub-sections, <code>###</code> for Details.
                        </div>
                        <textarea
                            value={markdownContent}
                            onChange={(e) => setMarkdownContent(e.target.value)}
                            className="flex-1 w-full p-4 font-mono text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="# Introduction&#10;## Background&#10;### Key Concept"
                        />
                    </div>
                ) : blocks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
                        <Layout size={48} className="mb-4 opacity-50" />
                        <p className="text-sm">Enter a topic or pick a template.</p>
                    </div>
                ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="outline-list">
                            {(provided) => (
                                <div
                                    className="space-y-1 pb-20"
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {blocks.map((block, index) => (
                                        <Draggable draggableId={block.id} index={index} key={block.id}>
                                            {(provided, snapshot) => (
                                                <BlockItem
                                                    block={block}
                                                    isSelected={selectedBlockIds.has(block.id)}
                                                    onSelect={(id) => handleBlockSelect(id, true)}
                                                    onUpdate={updateBlock}
                                                    onRemove={removeBlock}
                                                    onAddComment={(id) => setActiveCommentBlockId(id)}
                                                    onEditComment={startEditingComment}
                                                    onMoveUp={() => moveBlock(index, 'up')}
                                                    onMoveDown={() => moveBlock(index, 'down')}
                                                    onIndent={() => changeLevel(block.id, 1)}
                                                    onOutdent={() => changeLevel(block.id, -1)}
                                                    dragProvided={provided}
                                                />
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>

            {/* Content Gen Controls */}
            {blocks.length > 0 && (
                <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
                    {/* Text Settings Toggle */}
                    <div className="mb-2 flex justify-between items-center">
                        <button
                            onClick={() => setShowTextSettings(!showTextSettings)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-medium"
                            title="Adjust writing style parameters"
                        >
                            <Sliders size={12} />
                            Generation Style
                            {showTextSettings ? <ChevronDown size={12} className="rotate-180" /> : <ChevronDown size={12} />}
                        </button>
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wide">{textSettings.tone}</span>
                    </div>

                    {showTextSettings && (
                        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg animate-fade-in-up z-20">
                            <div className="mb-3">
                                <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Tone</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['formal', 'casual', 'persuasive', 'technical', 'creative'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTextSettings(p => ({ ...p, tone: t }))}
                                            className={`px-3 py-1 rounded-full text-xs border ${textSettings.tone === t ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}
                                            title={`Set tone to ${t}`}
                                        >
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">Custom Style Instructions</label>
                                <input
                                    type="text"
                                    value={textSettings.customInstructions}
                                    onChange={(e) => setTextSettings(p => ({ ...p, customInstructions: e.target.value }))}
                                    placeholder="e.g. Use lots of metaphors, speak like a pirate..."
                                    className="w-full text-sm p-2 border border-slate-200 rounded outline-none focus:border-indigo-500"
                                    title="Add specific style instructions for the AI"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleGenerateContent(false)}
                            disabled={status === 'loading'}
                            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            title="Generate text for all blocks"
                        >
                            <Type size={16} />
                            Generate Text
                        </button>
                        <button
                            onClick={() => handleGenerateContent(true)}
                            disabled={status === 'loading' || selectedBlockIds.size === 0}
                            className="px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 py-2.5 rounded-lg text-sm font-semibold transition-all"
                            title="Generate text only for selected blocks"
                        >
                            Selected
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
};
