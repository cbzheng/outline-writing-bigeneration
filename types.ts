
export type CommentType = 'must' | 'maybe' | 'creative' | 'general';

export interface Comment {
  id: string;
  type: CommentType;
  text: string;
}

export interface Block {
  id: string;
  title: string;
  level: number; // 0 (H1), 1 (H2), 2 (H3)
  comments: Comment[];
  content: string; // The generated prose for this block
}

export interface ApiKeys {
  google: string;
  openai?: string;
  claude?: string;
}

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface OutlineSettings {
  length: 'short' | 'medium' | 'long';
  detailLevel: 'low' | 'high';
}

export interface TextSettings {
  tone: 'formal' | 'casual' | 'persuasive' | 'technical' | 'creative';
  customInstructions: string;
}

export interface Template {
  id: string;
  name: string;
  defaultBlocks: Partial<Block>[];
  defaultTone: TextSettings['tone'];
}

export interface EditingCommentState {
    blockId: string;
    commentId: string;
    text: string;
    type: CommentType;
}

// --- Version History & Export Types ---

export interface AppState {
  topic: string;
  blocks: Block[];
  outlineSettings: OutlineSettings;
  textSettings: TextSettings;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  label: string;
  state: AppState;
}

export interface ExportData {
  metadata: {
    appName: string;
    version: string;
    exportType: 'current' | 'full';
    timestamp: number;
  };
  current: AppState;
  history: Snapshot[];
}
