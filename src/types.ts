export type NoteStatus = 'seed' | 'growing' | 'evergreen' | 'archived';

export interface KnowledgeNote {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  status: NoteStatus;
  pinned?: boolean;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  color?: string;
}

export interface Flashcard {
  id: string;
  noteId: string;
  noteTitle: string;
  question: string;
  answer: string;
  interval: number; // in days
  repetition: number;
  easeFactor: number; // default 2.5
  dueDate: string; // ISO date
  lastReviewed?: string;
}

export interface BacklinkItem {
  sourceNoteId: string;
  sourceNoteTitle: string;
  snippet: string;
  isExplicitLink: boolean;
}

export interface GraphNode {
  id: string;
  title: string;
  type: 'note' | 'tag';
  val: number; // link weight / radius
  color: string;
  folder: string;
  tags: string[];
  status?: NoteStatus;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface AISearchResult {
  answer: string;
  citedNotes: string[];
  suggestedQuestions?: string[];
}

export type ViewMode = 'editor' | 'graph' | 'flashcards' | 'ask-ai';

export interface VaultStats {
  totalNotes: number;
  totalLinks: number;
  linkDensity: number; // links per note
  orphanedNotes: KnowledgeNote[];
  hubNotes: { title: string; linkCount: number; id: string }[];
  statusCounts: Record<NoteStatus, number>;
  totalTags: number;
}
