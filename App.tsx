
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Block, Comment, ApiKeys, GenerationStatus, CommentType, Template,
  OutlineSettings, TextSettings, EditingCommentState, AppState, Snapshot, ExportData, Suggestion
} from './types';
import { generateOutline, generateContentFromBlocks, generateSuggestion, generateBlocksFromContent } from './services/geminiService';
import { BlockItem } from './components/BlockItem';
import { CommentModal } from './components/CommentModal';
import { RegenerationModal } from './components/RegenerationModal';
import { HistoryModal } from './components/HistoryModal';
import { RemarksPanel } from './components/RemarksPanel'; // Assuming this component exists or will be created
import {
  Settings, PenTool, Sparkles, Wand2, RefreshCw, Key, ArrowRight,
  Layout, Type, Copy, FileText, ChevronDown, Sliders, History,
  Download, Upload, Save, FileJson, MessageSquarePlus, Send, MessageSquare, PanelRightOpen, PanelRightClose, X, Globe,
  AlignLeft, List
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const LOCAL_STORAGE_KEY_API = 'structura_api_keys';

const TEMPLATES: Template[] = [
  {
    id: 'blog',
    name: 'Blog Post',
    defaultTone: 'casual',
    defaultBlocks: [
      { title: "Catchy Headline", level: 0 },
      { title: "Introduction (Hook)", level: 1 },
      { title: "Key Takeaway 1", level: 0 },
      { title: "Supporting Argument", level: 1 },
      { title: "Key Takeaway 2", level: 0 },
      { title: "Actionable Tips", level: 1 },
      { title: "Conclusion & Call to Action", level: 0 }
    ]
  },
  {
    id: 'grant',
    name: 'Grant Proposal',
    defaultTone: 'formal',
    defaultBlocks: [
      { title: "Executive Summary", level: 0 },
      { title: "Problem Statement", level: 0 },
      { title: "Needs Assessment", level: 1 },
      { title: "Program Goals & Objectives", level: 0 },
      { title: "Methodology", level: 0 },
      { title: "Evaluation Plan", level: 1 },
      { title: "Budget Narrative", level: 0 }
    ]
  },
  {
    id: 'creative',
    name: 'Creative Story',
    defaultTone: 'creative',
    defaultBlocks: [
      { title: "Inciting Incident", level: 0 },
      { title: "Character Introduction", level: 1 },
      { title: "Rising Action", level: 0 },
      { title: "Climax", level: 0 },
      { title: "Falling Action", level: 1 },
      { title: "Resolution", level: 0 }
    ]
  },
  {
    id: 'email',
    name: 'Cold Email',
    defaultTone: 'persuasive',
    defaultBlocks: [
      { title: "Subject Line Ideas", level: 0 },
      { title: "Personalized Opener", level: 1 },
      { title: "Value Proposition", level: 0 },
      { title: "Social Proof", level: 1 },
      { title: "Call to Action", level: 0 }
    ]
  }
];

const App = () => {
  // --- State ---
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ google: '', model: 'gemini-2.5-flash' });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');

  // Content State
  const [inputMode, setInputMode] = useState<'topic' | 'content'>('topic');
  const [topic, setTopic] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());

  // History State
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // UI State
  const [activeCommentBlockId, setActiveCommentBlockId] = useState<string | null>(null);
  const [activeRemarkBlockId, setActiveRemarkBlockId] = useState<string | null>(null);
  const [inlineRemarksBlockIds, setInlineRemarksBlockIds] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<EditingCommentState | null>(null);
  const [regenerationTargetBlockId, setRegenerationTargetBlockId] = useState<string | null>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showOutlineSettings, setShowOutlineSettings] = useState(false);
  const [showTextSettings, setShowTextSettings] = useState(false);

  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  // Settings State
  const [outlineSettings, setOutlineSettings] = useState<OutlineSettings>({
    length: 'medium',
    detailLevel: 'low'
  });
  const [textSettings, setTextSettings] = useState<TextSettings>({
    tone: 'formal',
    customInstructions: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load keys on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_API);
    if (saved) {
      setApiKeys(JSON.parse(saved));
    } else {
      setShowKeyModal(true);
    }
  }, []);

  // --- Version History Logic ---

  const createSnapshot = (label: string) => {
    const currentState: AppState = {
      topic,
      blocks: JSON.parse(JSON.stringify(blocks)), // Deep copy
      outlineSettings: { ...outlineSettings },
      textSettings: { ...textSettings }
    };

    const snapshot: Snapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      label,
      state: currentState
    };

    setHistory(prev => [...prev, snapshot]);
  };

  const restoreSnapshot = (snapshot: Snapshot) => {
    setTopic(snapshot.state.topic);
    setBlocks(JSON.parse(JSON.stringify(snapshot.state.blocks))); // Deep copy back
    setOutlineSettings(snapshot.state.outlineSettings);
    setTextSettings(snapshot.state.textSettings);
    setSelectedBlockIds(new Set()); // Clear selection on restore
    setStatusMessage(`Restored version: ${snapshot.label}`);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 2000);
  };

  // --- Import / Export Logic ---

  const handleExport = (type: 'current' | 'full') => {
    const currentState: AppState = {
      topic,
      blocks,
      outlineSettings,
      textSettings
    };

    const exportData: ExportData = {
      metadata: {
        appName: 'Structura AI Writer',
        version: '1.0',
        exportType: type,
        timestamp: Date.now()
      },
      current: currentState,
      history: type === 'full' ? history : []
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `structura-${type}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setShowFileMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);

        let importedState: AppState | null = null;
        let importedHistory: Snapshot[] = [];

        // Type Guard / Detection
        // 1. Full ExportData structure
        if (raw.metadata && raw.current && Array.isArray(raw.current.blocks)) {
          importedState = raw.current;
          if (Array.isArray(raw.history)) {
            importedHistory = raw.history;
          }
        }
        // 2. Simple AppState structure (root is the state)
        else if (raw.blocks && Array.isArray(raw.blocks)) {
          importedState = {
            topic: raw.topic || '',
            blocks: raw.blocks,
            outlineSettings: raw.outlineSettings || { length: 'medium', detailLevel: 'low' },
            textSettings: raw.textSettings || { tone: 'formal', customInstructions: '' }
          };
        }
        // 3. Just an array of blocks
        else if (Array.isArray(raw)) {
          importedState = {
            topic: '',
            blocks: raw,
            outlineSettings: { length: 'medium', detailLevel: 'low' },
            textSettings: { tone: 'formal', customInstructions: '' }
          };
        }

        if (!importedState) {
          alert('Invalid file format. Could not detect structure.');
          return;
        }

        if (window.confirm("Importing will overwrite your current workspace. Continue?")) {
          // Update State
          setTopic(importedState.topic);
          setBlocks(importedState.blocks);
          setOutlineSettings(importedState.outlineSettings);
          setTextSettings(importedState.textSettings);
          setSelectedBlockIds(new Set());

          // Handle History
          if (importedHistory.length > 0) {
            setHistory(importedHistory);
          } else {
            // Initialize history with the imported state as the first snapshot.
            // We manually construct the snapshot to ensure it uses the *imported* data, 
            // avoiding issues with stale state closures.
            const initialSnapshot: Snapshot = {
              id: uuidv4(),
              timestamp: Date.now(),
              label: 'Imported File',
              state: importedState
            };
            setHistory([initialSnapshot]);
          }

          setStatusMessage('Import successful');
          setStatus('success');
          setTimeout(() => setStatus('idle'), 2000);
        }

      } catch (err) {
        console.error(err);
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Resizing Logic ---
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth > 300 && newWidth < 800) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Save keys
  const saveKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem(LOCAL_STORAGE_KEY_API, JSON.stringify(keys));
    setShowKeyModal(false);
  };

  // --- Actions ---

  const handleTemplateSelect = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Convert template partials to full blocks
    const newBlocks: Block[] = template.defaultBlocks.map(b => ({
      id: uuidv4(),
      title: b.title || "Untitled",
      level: b.level || 0,
      comments: [],
      suggestions: [],
      content: ""
    }));

    setBlocks(newBlocks);
    setTextSettings(prev => ({ ...prev, tone: template.defaultTone }));

    // Defer snapshot slightly to ensure state update
    setTimeout(() => createSnapshot(`Applied Template: ${template.name}`), 100);
  };

  // 1. Generate Outline
  const handleGenerateOutline = async () => {
    if (!apiKeys.google) {
      setShowKeyModal(true);
      return;
    }
    if (!topic.trim()) return;

    setStatus('loading');
    setStatusMessage('Crafting structure...');
    try {
      const rawOutline = await generateOutline(apiKeys.google, apiKeys.model, language, topic, blocks.length > 0 ? blocks : undefined, outlineSettings);

      const newBlocks: Block[] = rawOutline.map(item => ({
        id: uuidv4(),
        title: item.title || "Untitled Block",
        level: item.level ?? 0,
        comments: [],
        suggestions: [],
        content: ""
      }));

      setBlocks(newBlocks);
      setStatus('success');
      setShowOutlineSettings(false);

      createSnapshot('Generated Outline');

    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusMessage('Failed to generate outline.');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // 1.5 Generate Structure from Content
  const handleGenerateStructure = async () => {
    if (!apiKeys.google) {
      setShowKeyModal(true);
      return;
    }
    if (!rawContent.trim()) return;

    setStatus('loading');
    setStatusMessage('Analyzing content structure...');
    try {
      const rawBlocks = await generateBlocksFromContent(apiKeys.google, rawContent);

      const newBlocks: Block[] = rawBlocks.map(item => ({
        id: uuidv4(),
        title: item.title || "Untitled Block",
        level: item.level ?? 0,
        comments: [],
        suggestions: [],
        content: item.content || ""
      }));

      setBlocks(newBlocks);
      setStatus('success');

      createSnapshot('Generated Structure from Content');

    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusMessage('Failed to generate structure.');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // 2. Generate Content
  const handleGenerateContent = async (onlySelected = false, refinementInstructions?: Record<string, string>) => {
    if (!apiKeys.google) {
      setShowKeyModal(true);
      return;
    }

    let targets = blocks;

    if (refinementInstructions) {
      targets = blocks.filter(b => Object.keys(refinementInstructions).includes(b.id));
    } else if (onlySelected) {
      targets = blocks.filter(b => selectedBlockIds.has(b.id));
    }

    if (targets.length === 0) {
      alert("No blocks selected or available.");
      return;
    }

    setStatus('loading');
    setStatusMessage(`Drafting content for ${targets.length} block(s)...`);

    try {
      const contentMap = await generateContentFromBlocks(apiKeys.google, apiKeys.model, language, targets, topic, textSettings, refinementInstructions);

      setBlocks(prev => {
        const next = prev.map(b => {
          if (contentMap[b.id]) {
            return { ...b, content: contentMap[b.id] };
          }
          return b;
        });
        return next;
      });

      setStatus('success');
      setShowTextSettings(false);

      // Determine label
      let label = 'Generated Content';
      if (refinementInstructions) label = 'Regenerated Block(s)';
      else if (onlySelected) label = 'Generated Selected Content';

      createSnapshot(label);

    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusMessage('Failed to generate content.');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleRegenerationWithInstructions = (instruction: string) => {
    if (regenerationTargetBlockId) {
      const map = { [regenerationTargetBlockId]: instruction };
      handleGenerateContent(true, map);
      setRegenerationTargetBlockId(null);
    }
  };

  // Block Manipulations
  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // Cascade Delete
  const removeBlock = (id: string) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;

    const targetLevel = blocks[index].level;
    const idsToRemove = new Set([id]);

    // Look ahead to find children
    for (let i = index + 1; i < blocks.length; i++) {
      if (blocks[i].level > targetLevel) {
        idsToRemove.add(blocks[i].id);
      } else {
        // Stop when we hit a sibling or higher level
        break;
      }
    }

    setBlocks(prev => prev.filter(b => !idsToRemove.has(b.id)));

    const newSet = new Set(selectedBlockIds);
    idsToRemove.forEach(remId => newSet.delete(remId));
    setSelectedBlockIds(newSet);
  };

  const addBlock = () => {
    const newBlock: Block = {
      id: uuidv4(),
      title: "",
      level: 0,
      comments: [],
      suggestions: [],
      content: ""
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
  };

  // --- Markdown Conversion ---
  const blocksToMarkdown = (currentBlocks: Block[]): string => {
    return currentBlocks.map(b => {
      const prefix = '#'.repeat(b.level + 1);
      return `${prefix} ${b.title}`;
    }).join('\n');
  };

  const markdownToBlocks = (markdown: string): Block[] => {
    const lines = markdown.split('\n');
    const newBlocks: Block[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(/^(#{1,3})\s+(.*)/);
      if (match) {
        const level = match[1].length - 1; // # -> 0, ## -> 1, ### -> 2
        const title = match[2].trim();

        // Try to find existing block to preserve ID/content if possible (simple heuristic)
        // For now, we'll just create new blocks to keep it simple and robust
        newBlocks.push({
          id: uuidv4(),
          title,
          level,
          content: '',
          suggestions: [],
          comments: []
        });
      }
    });
    return newBlocks;
  };

  const toggleMarkdownMode = () => {
    if (isMarkdownMode) {
      // Switch to Visual: Parse markdown
      const newBlocks = markdownToBlocks(markdownContent);
      if (newBlocks.length > 0) {
        setBlocks(newBlocks);
      } else if (markdownContent.trim().length > 0) {
        alert("No valid headers found. Use #, ##, or ### to define points.");
        return; // Don't switch if invalid content but not empty
      }
      setIsMarkdownMode(false);
    } else {
      // Switch to Markdown: Convert blocks
      setMarkdownContent(blocksToMarkdown(blocks));
      setIsMarkdownMode(true);
    }
  };

  const changeLevel = (id: string, delta: number) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === id) {
        const newLevel = Math.max(0, Math.min(2, b.level + delta));
        return { ...b, level: newLevel };
      }
      return b;
    }));
  };

  const handleBlockSelect = (id: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      const newSet = new Set(selectedBlockIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedBlockIds(newSet);
    } else {
      setSelectedBlockIds(new Set([id]));
    }

    const element = document.getElementById(`text-block-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleInlineRemarks = (id: string) => {
    const newSet = new Set(inlineRemarksBlockIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setInlineRemarksBlockIds(newSet);
  };

  // Comments
  const saveComment = (type: CommentType, text: string) => {
    if (editingComment) {
      // Update existing
      setBlocks(prev => prev.map(b => {
        if (b.id === editingComment.blockId) {
          return {
            ...b,
            comments: b.comments.map(c => c.id === editingComment.commentId ? { ...c, type, text } : c)
          };
        }
        return b;
      }));
      setEditingComment(null);
    } else if (activeCommentBlockId) {
      // Create new
      const newComment: Comment = { id: uuidv4(), type, text };
      setBlocks(prev => prev.map(b => {
        if (b.id === activeCommentBlockId) {
          return { ...b, comments: [...b.comments, newComment] };
        }
        return b;
      }));
      setActiveCommentBlockId(null);
    }
  };

  const startEditingComment = (blockId: string, commentId: string) => {
    const block = blocks.find(b => b.id === blockId);
    const comment = block?.comments.find(c => c.id === commentId);
    if (block && comment) {
      setEditingComment({
        blockId,
        commentId,
        text: comment.text,
        type: comment.type
      });
    }
  };

  const handleTextFocus = (id: string) => {
    if (!selectedBlockIds.has(id)) {
      setSelectedBlockIds(new Set([id]));
    }
  };

  const handleCopyAll = () => {
    const allText = blocks
      .filter(b => b.content)
      .map(b => b.content)
      .join('\n\n');
    navigator.clipboard.writeText(allText);
    setStatusMessage('Copied to clipboard!');
    setStatus('success');
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 select-none">

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        hidden
      />

      {/* Header */}
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
              className={`p-2 rounded-md transition-all ${showFileMenu ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              title="Import / Export"
            >
              <Save size={20} />
            </button>
            {showFileMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-fade-in-up z-50">
                <button onClick={handleImportClick} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-left">
                  <Upload size={16} /> Import JSON
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button onClick={() => handleExport('current')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-left">
                  <FileJson size={16} /> Export Current
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

      {/* Main Content Container */}
      <div className="flex-1 flex overflow-hidden w-full relative">

        {/* Left Panel: Outline & Controls */}
        <aside
          style={{ width: sidebarWidth }}
          className="flex flex-col bg-slate-50 shrink-0 border-r border-slate-200"
        >

          {/* Input Area */}
          <div className="p-4 bg-white border-b border-slate-200 relative">
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setInputMode('topic')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputMode === 'topic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  TOPIC
                </button>
                <button
                  onClick={() => setInputMode('content')}
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
                  >
                    <option value="" disabled>Load Template...</option>
                    {TEMPLATES.map(t => (
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

          <div className="flex gap-2 px-4 py-2 border-b border-slate-100">
            <button
              onClick={toggleMarkdownMode}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title={isMarkdownMode ? "Switch to Visual View" : "Edit as Markdown"}
            >
              {isMarkdownMode ? <List size={20} /> : <AlignLeft size={20} />}
            </button>
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

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className={`w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize z-50 flex flex-col justify-center items-center transition-colors ${isResizing ? 'bg-blue-500 w-1.5' : ''}`}
          title="Drag to resize"
        >
          <div className="h-8 w-1 bg-slate-300 rounded-full mb-1"></div>
        </div>

        {/* Right Panel: Content Editor */}
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
                    className={`transition-all duration-300 ${selectedBlockIds.has(block.id) ? 'translate-x-1 mb-2' : 'mb-1'}`}
                  >
                    {/* Combined Header: Title + Toolbar */}
                    <div className="flex items-center justify-between mb-1 min-h-[24px]">
                      {/* Block Title Label */}
                      <div className={`text-[10px] uppercase font-bold text-slate-300 flex items-center gap-2 ${selectedBlockIds.has(block.id) ? 'text-indigo-400' : 'opacity-0 hover:opacity-100'}`}>
                        <FileText size={10} />
                        {block.title}
                      </div>

                      {/* Toolbar (Visible on Hover/Select) */}
                      <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${selectedBlockIds.has(block.id) ? 'opacity-100' : ''}`}>
                        {/* Right Side Toolbar Actions */}
                        <div className="flex bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                          <button
                            onClick={() => setActiveRemarkBlockId(block.id)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                            title="Open remarks panel"
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                          <div className="w-px bg-slate-200 mx-1"></div>
                          <button
                            onClick={() => toggleInlineRemarks(block.id)}
                            className={`p-1.5 hover:bg-slate-100 ${inlineRemarksBlockIds.has(block.id) ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600'}`}
                            title="Toggle inline remarks view"
                          >
                            {inlineRemarksBlockIds.has(block.id) ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content Area Wrapper */}
                    <div className="flex gap-4">
                      {/* Text Editor */}
                      <div className={`relative rounded-lg group ${selectedBlockIds.has(block.id) ? 'ring-2 ring-blue-100' : ''} ${inlineRemarksBlockIds.has(block.id) ? 'w-2/3' : 'w-full'}`}>
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          onFocus={() => handleTextFocus(block.id)}
                          placeholder="Drafting content..."
                          className={`w-full bg-transparent resize-none overflow-hidden outline-none leading-relaxed min-h-[1.5em] px-0 py-1 rounded hover:bg-slate-50 transition-colors font-serif ${block.level === 0 ? 'text-2xl font-bold text-slate-800' : 'text-lg text-slate-700'}`}
                          style={{ height: 'auto', minHeight: '1.5em' }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = el.scrollHeight + 'px';
                            }
                          }}
                        />
                        {/* Inline Actions (Regenerate) */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-slate-200 rounded flex overflow-hidden">
                          <button
                            onClick={() => { setRegenerationTargetBlockId(block.id); }}
                            className="p-1.5 hover:bg-slate-100 text-indigo-600"
                            title="Regenerate this section with options"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
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
      </div>

      {/* Modals */}
      <CommentModal
        isOpen={!!activeCommentBlockId || !!editingComment}
        onClose={() => { setActiveCommentBlockId(null); setEditingComment(null); }}
        onSave={saveComment}
        initialText={editingComment?.text}
        initialType={editingComment?.type}
      />

      <RegenerationModal
        isOpen={!!regenerationTargetBlockId}
        onClose={() => setRegenerationTargetBlockId(null)}
        onRegenerate={handleRegenerationWithInstructions}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        onRestore={restoreSnapshot}
      />

      <RemarksPanel
        isOpen={!!activeRemarkBlockId}
        onClose={() => setActiveRemarkBlockId(null)}
        blockId={activeRemarkBlockId}
        blocks={blocks}
        apiKeys={apiKeys}
        language={language}
        updateBlock={updateBlock}
        setStatus={setStatus}
        setStatusMessage={setStatusMessage}
      />

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                <Key size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">API Configuration</h2>
                <p className="text-sm text-slate-500">Enter your provider keys to enable AI features.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Google Gemini Key <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="AIzaSy..."
                  value={apiKeys.google}
                  onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">Required for main generation features.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Model Name</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="gemini-2.5-flash"
                  value={apiKeys.model}
                  onChange={(e) => setApiKeys({ ...apiKeys, model: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">Specify the Gemini model version (default: gemini-2.5-flash).</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-400 mb-1">OpenAI Key (Optional)</label>
                <input
                  type="password"
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-500 focus:bg-white transition-colors outline-none"
                  placeholder="sk-..."
                  value={apiKeys.openai || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                  disabled
                />
                <p className="text-xs text-slate-400 mt-1">Currently disabled in this demo version.</p>
              </div>

              <div className="">
                <label className="block text-sm font-semibold text-slate-400 mb-1">Claude Key (Optional)</label>
                <input
                  type="password"
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-500 focus:bg-white transition-colors outline-none"
                  placeholder="sk-ant-..."
                  value={apiKeys.claude || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                  disabled
                />
                <p className="text-xs text-slate-400 mt-1">Currently disabled in this demo version.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => saveKeys(apiKeys)}
                disabled={!apiKeys.google}
                className="bg-slate-900 hover:bg-black disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                title="Save keys and close modal"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
