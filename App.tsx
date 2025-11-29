
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Block, Comment, ApiKeys, GenerationStatus, CommentType, Template,
  OutlineSettings, TextSettings, EditingCommentState, AppState, Snapshot, ExportData, Suggestion, ReferenceFile, Insights
} from './types';
import { generateOutline, generateContentFromBlocks, generateSuggestion, generateBlocksFromContent, generateInsights } from './services/geminiService';
import { fileSystemStorageProvider } from './services/storageService';
import { CommentModal } from './components/CommentModal';
import { RegenerationModal } from './components/RegenerationModal';
import { HistoryModal } from './components/HistoryModal';
import { RemarksPanel } from './components/RemarksPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { InsightsModal } from './components/InsightsModal';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { Sidebar } from './components/Sidebar';
import { DropResult } from '@hello-pangea/dnd';

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
  const [isInputPanelOpen, setIsInputPanelOpen] = useState(true);
  const [inputMode, setInputMode] = useState<'topic' | 'content'>('topic');
  const [topic, setTopic] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // History State
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // UI State
  const [activeCommentBlockId, setActiveCommentBlockId] = useState<string | null>(null);
  const [activeRemarkBlockId, setActiveRemarkBlockId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<EditingCommentState | null>(null);
  const [regenerationTargetBlockId, setRegenerationTargetBlockId] = useState<string | null>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showOutlineSettings, setShowOutlineSettings] = useState(false);
  const [showTextSettings, setShowTextSettings] = useState(false);
  const [inlineRemarksBlockIds, setInlineRemarksBlockIds] = useState<Set<string>>(new Set());

  // Auto-Save State
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // --- Effects ---

  // Auto-Save Effect
  useEffect(() => {
    // If we have a file handle and changes are made (status is unsaved), trigger auto-save
    if (fileHandle && saveStatus === 'unsaved') {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          const exportData = getExportData();
          await fileSystemStorageProvider.saveFile(exportData, fileHandle);
          setSaveStatus('saved');
          setLastSavedTimestamp(Date.now());
        } catch (error) {
          console.error('Auto-save failed:', error);
          setSaveStatus('unsaved'); // Retry next time
        }
      }, 3000); // 3 seconds debounce
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [blocks, topic, outlineSettings, textSettings, history, fileHandle, saveStatus]);

  // Mark as unsaved on changes
  useEffect(() => {
    if (fileHandle) {
      setSaveStatus('unsaved');
    }
  }, [blocks, topic, outlineSettings, textSettings]); // Track relevant state changes

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

  const getExportData = (): ExportData => {
    return {
      metadata: {
        appName: 'Structura',
        version: '1.0.0',
        exportType: 'full',
        timestamp: Date.now()
      },
      current: {
        topic,
        blocks,
        outlineSettings,
        textSettings
      },
      history
    };
  };

  const handleExport = () => {
    const data = getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `structura-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const data = getExportData();
      const handle = await fileSystemStorageProvider.saveFile(data, fileHandle || undefined);
      setFileHandle(handle);
      setSaveStatus('saved');
      setLastSavedTimestamp(Date.now());

      // Create a snapshot on manual save if it's been a while since the last one?
      // Or just always create one to ensure "each save corresponds to one version"
      createSnapshot(`Saved: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('unsaved');
    }
  };

  const handleOpen = async () => {
    try {
      const { data, handle } = await fileSystemStorageProvider.openFile();

      // Restore State
      setTopic(data.current.topic);
      setBlocks(data.current.blocks);
      setOutlineSettings(data.current.outlineSettings);
      setTextSettings(data.current.textSettings);
      setHistory(data.history || []);

      setFileHandle(handle);
      setSaveStatus('saved');
      setLastSavedTimestamp(Date.now());

      // Reset UI
      setIsInputPanelOpen(false);

    } catch (error) {
      console.error('Open failed:', error);
    }
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
      const generatedBlocks = await generateOutline(
        apiKeys.google,
        apiKeys.model,
        language,
        topic,
        undefined,
        outlineSettings,
        referenceFiles,
        insights
      );
      const newBlocks: Block[] = generatedBlocks.map(item => ({
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
      setIsInputPanelOpen(false); // Auto-collapse on success

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
      const contentMap = await generateContentFromBlocks(apiKeys.google, apiKeys.model, language, targets,
        topic,
        textSettings,
        refinementInstructions,
        blocks // Pass full context
      );

      setBlocks(prev => {
        const next = prev.map(b => {
          if (contentMap[b.id]) {
            return { ...b, content: contentMap[b.id], isOutdated: false };
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

  const handleAnalyzeFiles = async () => {
    if (referenceFiles.length === 0) return;
    setStatus('loading');
    setStatusMessage('Analyzing reference files...');
    try {
      const result = await generateInsights(apiKeys.google, apiKeys.model, referenceFiles);
      setInsights(result);
      setShowInsightsModal(true);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusMessage('Failed to analyze files.');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // Block Manipulations
  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== id) return b;

      const newBlock = { ...b, ...updates };

      // Check if title changed and content exists -> mark as outdated
      if (updates.title !== undefined && updates.title !== b.title && b.content.trim().length > 0) {
        newBlock.isOutdated = true;
      }

      // If content is updated manually, clear outdated flag
      if (updates.content !== undefined) {
        newBlock.isOutdated = false;
      }

      // If isOutdated is explicitly passed (e.g. dismiss), respect it
      if (updates.isOutdated !== undefined) {
        newBlock.isOutdated = updates.isOutdated;
      }

      return newBlock;
    }));
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
      // Only show outline structure, ignore content
      return `${prefix} ${b.title}`;
    }).join('\n');
  };

  const markdownToBlocks = (markdown: string, previousBlocks: Block[]): Block[] => {
    const lines = markdown.split('\n');
    const parsedBlocks: { title: string; level: number }[] = [];

    // 1. Parse Markdown
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const match = trimmed.match(/^(#{1,3})\s+(.*)/);
      if (match) {
        parsedBlocks.push({
          level: match[1].length - 1,
          title: match[2].trim()
        });
      }
    });

    const newBlocks: Block[] = [];
    const matches: { oldIndex: number; isRename: boolean }[] = new Array(parsedBlocks.length).fill(null);
    const usedOldIndices = new Set<number>();

    // 2. Pass 1: Exact Title Matches
    parsedBlocks.forEach((pBlock, i) => {
      // Find first unused match
      const matchIndex = previousBlocks.findIndex((b, idx) =>
        b.title === pBlock.title && !usedOldIndices.has(idx)
      );

      if (matchIndex !== -1) {
        matches[i] = { oldIndex: matchIndex, isRename: false };
        usedOldIndices.add(matchIndex);
      }
    });

    // 3. Pass 2: Gap Filling (Renames)
    // We look for gaps in matches and try to fill them with unused blocks from the corresponding gap in previousBlocks
    let i = 0;
    while (i < parsedBlocks.length) {
      if (matches[i] === null) {
        // Found a gap start
        const gapStart = i;
        let gapEnd = i;
        while (gapEnd < parsedBlocks.length && matches[gapEnd] === null) {
          gapEnd++;
        }
        // Gap is [gapStart, gapEnd)

        // Determine boundaries in old blocks
        const prevOldIndex = gapStart > 0 && matches[gapStart - 1] ? matches[gapStart - 1].oldIndex : -1;
        const nextOldIndex = gapEnd < parsedBlocks.length && matches[gapEnd] ? matches[gapEnd].oldIndex : previousBlocks.length;

        // If the order is preserved (prev < next), we can look for candidates in between
        if (prevOldIndex < nextOldIndex) {
          const candidates: number[] = [];
          for (let k = prevOldIndex + 1; k < nextOldIndex; k++) {
            if (!usedOldIndices.has(k)) {
              candidates.push(k);
            }
          }

          // Map candidates to gap items 1-to-1
          const mapCount = Math.min(candidates.length, gapEnd - gapStart);
          for (let k = 0; k < mapCount; k++) {
            matches[gapStart + k] = { oldIndex: candidates[k], isRename: true };
            usedOldIndices.add(candidates[k]);
          }
        }

        i = gapEnd;
      } else {
        i++;
      }
    }

    // 4. Construct Result
    parsedBlocks.forEach((pBlock, i) => {
      const match = matches[i];
      if (match) {
        const oldBlock = previousBlocks[match.oldIndex];
        newBlocks.push({
          ...oldBlock,
          title: pBlock.title,
          level: pBlock.level,
          isOutdated: match.isRename ? true : oldBlock.isOutdated // Mark outdated if renamed
        });
      } else {
        // New Block
        newBlocks.push({
          id: uuidv4(),
          title: pBlock.title,
          level: pBlock.level,
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
      const newBlocks = markdownToBlocks(markdownContent, blocks);
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

      <Header
        status={status}
        statusMessage={statusMessage}
        language={language}
        setLanguage={setLanguage}
        showLanguageMenu={showLanguageMenu}
        setShowLanguageMenu={setShowLanguageMenu}
        showFileMenu={showFileMenu}
        setShowFileMenu={setShowFileMenu}
        handleImportClick={handleImportClick}
        handleExport={handleExport}
        setShowHistoryModal={setShowHistoryModal}
        setShowKeyModal={setShowKeyModal}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        saveStatus={saveStatus}
        onSave={handleSave}
        onOpen={handleOpen}
        lastSavedTimestamp={lastSavedTimestamp}
        hasFileHandle={!!fileHandle}
      />

      {/* Main Content Container */}
      <div className="flex-1 flex overflow-hidden w-full relative">

        <Sidebar
          sidebarWidth={sidebarWidth}
          inputMode={inputMode}
          setInputMode={setInputMode}
          isInputPanelOpen={isInputPanelOpen}
          setIsInputPanelOpen={setIsInputPanelOpen}
          topic={topic}
          setTopic={setTopic}
          rawContent={rawContent}
          setRawContent={setRawContent}
          handleTemplateSelect={handleTemplateSelect}
          showOutlineSettings={showOutlineSettings}
          setShowOutlineSettings={setShowOutlineSettings}
          outlineSettings={outlineSettings}
          setOutlineSettings={setOutlineSettings}
          handleGenerateOutline={handleGenerateOutline}
          handleGenerateStructure={handleGenerateStructure}
          status={status}
          isMarkdownMode={isMarkdownMode}
          toggleMarkdownMode={toggleMarkdownMode}
          blocks={blocks}
          addBlock={addBlock}
          markdownContent={markdownContent}
          setMarkdownContent={setMarkdownContent}
          handleDragEnd={handleDragEnd}
          selectedBlockIds={selectedBlockIds}
          handleBlockSelect={handleBlockSelect}
          updateBlock={updateBlock}
          removeBlock={removeBlock}
          setActiveCommentBlockId={setActiveCommentBlockId}
          startEditingComment={startEditingComment}
          moveBlock={moveBlock}
          changeLevel={changeLevel}
          showTextSettings={showTextSettings}
          setShowTextSettings={setShowTextSettings}
          textSettings={textSettings}
          setTextSettings={setTextSettings}
          handleGenerateContent={handleGenerateContent}
          templates={TEMPLATES}
          referenceFiles={referenceFiles}
          setReferenceFiles={setReferenceFiles}
          insights={insights}
          onAnalyzeFiles={handleAnalyzeFiles}
          onShowInsights={() => setShowInsightsModal(true)}
        />

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className={`w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize z-50 flex flex-col justify-center items-center transition-colors ${isResizing ? 'bg-blue-500 w-1.5' : ''}`}
          title="Drag to resize"
        >
          <div className="h-8 w-1 bg-slate-300 rounded-full mb-1"></div>
        </div>

        <Editor
          blocks={blocks}
          selectedBlockIds={selectedBlockIds}
          handleCopyAll={handleCopyAll}
          updateBlock={updateBlock}
          handleTextFocus={handleTextFocus}
          setActiveRemarkBlockId={setActiveRemarkBlockId}
          toggleInlineRemarks={toggleInlineRemarks}
          inlineRemarksBlockIds={inlineRemarksBlockIds}
          setRegenerationTargetBlockId={setRegenerationTargetBlockId}
        />
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
        currentBlocks={blocks}
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

      <ApiKeyModal
        isOpen={showKeyModal}
        apiKeys={apiKeys}
        onSave={setApiKeys}
        onClose={() => setShowKeyModal(false)}
      />

      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        insights={insights}
      />
    </div>
  );
};

export default App;
