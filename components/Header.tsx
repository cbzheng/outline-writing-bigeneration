import React from 'react';
import {
    PenTool, Sparkles, History, Globe, Save, Upload, FileJson, Download, Settings, FileText, FolderOpen, CheckCircle, AlertCircle
} from 'lucide-react';
import { GenerationStatus } from '../types';

interface HeaderProps {
    status: GenerationStatus;
    statusMessage: string;
    language: string;
    setLanguage: (lang: string) => void;
    showLanguageMenu: boolean;
    setShowLanguageMenu: (show: boolean) => void;
    showFileMenu: boolean;
    setShowFileMenu: (show: boolean) => void;
    handleImportClick: () => void;
    handleExport: (type: 'current' | 'full') => void;
    setShowHistoryModal: (show: boolean) => void;
    setShowKeyModal: (show: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveStatus: 'saved' | 'saving' | 'unsaved';
    onSave: () => void;
    onOpen: () => void;
    lastSavedTimestamp: number;
    hasFileHandle: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    status,
    statusMessage,
    language,
    setLanguage,
    showLanguageMenu,
    setShowLanguageMenu,
    showFileMenu,
    setShowFileMenu,
    handleImportClick,
    handleExport,
    setShowHistoryModal,
    setShowKeyModal,
    fileInputRef,
    handleFileChange,
    saveStatus,
    onSave,
    onOpen,
    lastSavedTimestamp,
    hasFileHandle,
}) => {
    const getSaveStatusDisplay = () => {
        switch (saveStatus) {
            case 'saving':
                return <span className="text-slate-500 flex items-center gap-1"><Sparkles size={12} className="animate-spin" /> Saving...</span>;
            case 'saved':
                return <span className="text-slate-400 flex items-center gap-1"><CheckCircle size={12} /> Saved</span>;
            case 'unsaved':
                return <span className="text-amber-600 flex items-center gap-1"><AlertCircle size={12} /> Unsaved</span>;
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                hidden
            />

            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                        <PenTool size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight text-slate-800">Structura</h1>
                        <p className="text-xs text-slate-500 font-medium">AI-Assisted Drafting</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {status !== 'idle' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium animate-pulse mr-2" title="Current system status">
                            <Sparkles size={14} />
                            {statusMessage}
                        </div>
                    )}

                    {/* Toolbar Buttons */}

                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                        title="Version History"
                    >
                        <History size={20} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            className={`p-2 rounded-md transition-all flex items-center gap-1 ${showLanguageMenu ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                            title="Output Language"
                        >
                            <Globe size={20} />
                            <span className="text-xs font-medium hidden sm:inline">{language}</span>
                        </button>
                        {showLanguageMenu && (
                            <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-fade-in-up">
                                {['English', '中文', 'Spanish', 'French', 'German', 'Japanese'].map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            setLanguage(lang);
                                            setShowLanguageMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 ${language === lang ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-600'}`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button
                                    onClick={() => {
                                        const custom = prompt("Enter custom language:", language);
                                        if (custom) setLanguage(custom);
                                        setShowLanguageMenu(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-600 italic"
                                >
                                    Custom...
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowFileMenu(!showFileMenu)}
                            className={`p-2 rounded-md transition-all flex items-center gap-2 ${showFileMenu ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                            title="File Menu"
                        >
                            <FileText size={20} />
                            {/* Save Status Indicator (Compact) */}
                            <div className="hidden md:flex flex-col items-start leading-none">
                                <span className="text-[10px] uppercase font-bold tracking-wider">{hasFileHandle ? 'File' : 'Draft'}</span>
                                <span className="text-[10px] font-medium">{getSaveStatusDisplay()}</span>
                            </div>
                        </button>
                        {showFileMenu && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-fade-in-up z-50">
                                <button onClick={() => { onSave(); setShowFileMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-left font-medium">
                                    <Save size={16} /> {hasFileHandle ? 'Save' : 'Save As...'}
                                </button>
                                <button onClick={() => { onOpen(); setShowFileMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-left">
                                    <FolderOpen size={16} /> Open File...
                                </button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button onClick={handleImportClick} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-left">
                                    <Upload size={16} /> Import Legacy JSON
                                </button>
                                <button onClick={() => handleExport('current')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-left">
                                    <FileJson size={16} /> Export Snapshot
                                </button>
                                <button onClick={() => handleExport('full')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-left">
                                    <Download size={16} /> Export Full History
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-6 bg-slate-200 mx-2"></div>

                    <button
                        onClick={() => setShowKeyModal(true)}
                        className="p-2 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Configure API Keys"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </header>
        </>
    );
};
