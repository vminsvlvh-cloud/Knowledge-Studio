import { useState, useMemo } from 'react';
import { KnowledgeNote, ViewMode, Flashcard } from '../types';
import { STATUS_META } from '../utils/wikiLinks';
import { Language, translations } from '../utils/i18n';
import {
  FileText,
  Network,
  Layers,
  Sparkles,
  Plus,
  Search,
  Folder,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Star,
  Activity,
  Tag,
  Hash,
  Languages
} from 'lucide-react';

interface SidebarProps {
  notes: KnowledgeNote[];
  flashcards: Flashcard[];
  activeNoteId?: string;
  activeView: ViewMode;
  onSelectNote: (noteId: string) => void;
  onSwitchView: (view: ViewMode) => void;
  onCreateNewNote: () => void;
  onOpenCommandPalette: () => void;
  onOpenHealth: () => void;
  onOpenAI: () => void;
  selectedTagFilter: string | null;
  onSelectTagFilter: (tag: string | null) => void;
  selectedFolderFilter: string | null;
  onSelectFolderFilter: (folder: string | null) => void;
  lang?: Language;
  onToggleLang?: () => void;
}

export default function Sidebar({
  notes,
  flashcards,
  activeNoteId,
  activeView,
  onSelectNote,
  onSwitchView,
  onCreateNewNote,
  onOpenCommandPalette,
  onOpenHealth,
  onOpenAI,
  selectedTagFilter,
  onSelectTagFilter,
  selectedFolderFilter,
  onSelectFolderFilter,
  lang = 'ar',
  onToggleLang,
}: SidebarProps) {
  const t = translations[lang];

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'Knowledge Systems': true,
    'Mental Models': true,
    'Engineering & Systems': true,
    'Cognitive Science': true,
    'أنظمة المعرفة': true,
    'النماذج الذهنية': true,
    'هندسة الأنظمة': true,
    'العلوم المعرفية': true,
  });

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  // Group notes by folder
  const folderGroups = useMemo(() => {
    const groups: Record<string, KnowledgeNote[]> = {};
    notes.forEach((n) => {
      const f = n.folder || 'General';
      if (!groups[f]) groups[f] = [];
      groups[f].push(n);
    });
    return groups;
  }, [notes]);

  // Unique tags with frequencies
  const tagsWithCounts = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Pinned and Favorites
  const pinnedNotes = useMemo(() => notes.filter((n) => n.pinned), [notes]);

  // Count due flashcards
  const dueCount = useMemo(() => {
    const now = new Date().toISOString();
    return flashcards.filter((c) => !c.dueDate || c.dueDate <= now).length;
  }, [flashcards]);

  return (
    <aside
      id="synapse-sidebar"
      className="w-64 md:w-72 bg-stone-900 text-stone-200 flex flex-col h-full border-r border-stone-800 shrink-0 select-none overflow-hidden"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-stone-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>{t.brandName}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {t.studio}
              </span>
            </div>
            <div className="text-[11px] text-stone-400">{t.brandSubtitle}</div>
          </div>
        </div>

        {onToggleLang && (
          <button
            id="sidebar-lang-toggle-btn"
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
            title={t.toggleLanguage}
          >
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        )}
      </div>

      {/* Primary Actions */}
      <div className="p-3 space-y-2 border-b border-stone-800/60">
        <button
          id="sidebar-new-note-btn"
          type="button"
          onClick={onCreateNewNote}
          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.newNote}</span>
        </button>

        <button
          id="sidebar-quick-search-btn"
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700/80 text-stone-400 text-xs flex items-center justify-between transition-colors cursor-pointer border border-stone-750"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>{t.quickJump}</span>
          </div>
          <kbd className="text-[10px] font-mono bg-stone-900 px-1.5 py-0.5 rounded border border-stone-700 text-stone-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Main Views Navigation */}
      <div className="px-3 py-2 border-b border-stone-800/60 space-y-0.5">
        <button
          id="nav-notes-btn"
          type="button"
          onClick={() => {
            onSwitchView('editor');
            onSelectFolderFilter(null);
            onSelectTagFilter(null);
          }}
          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            activeView === 'editor' && !selectedFolderFilter && !selectedTagFilter
              ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{t.notesVault}</span>
          </div>
          <span className="text-[10px] text-stone-500">{notes.length}</span>
        </button>

        <button
          id="nav-graph-btn"
          type="button"
          onClick={() => onSwitchView('graph')}
          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            activeView === 'graph'
              ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            <span>{t.knowledgeGraph}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold">
            2D
          </span>
        </button>

        <button
          id="nav-flashcards-btn"
          type="button"
          onClick={() => onSwitchView('flashcards')}
          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            activeView === 'flashcards'
              ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>{t.activeRecall}</span>
          </div>
          {dueCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {dueCount}
            </span>
          )}
        </button>

        <button
          id="nav-ask-ai-btn"
          type="button"
          onClick={onOpenAI}
          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-indigo-300 hover:bg-indigo-600/15 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{t.askVaultAI}</span>
          </div>
          <span className="text-[10px] text-indigo-400 font-mono">Gemini</span>
        </button>
      </div>

      {/* Scrollable Taxonomy Area (Pinned, Folders, Tags) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div>
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              <span>{t.pinnedNotes}</span>
            </div>
            <div className="space-y-0.5">
              {pinnedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => {
                    onSelectNote(note.id);
                    onSwitchView('editor');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium truncate flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeNoteId === note.id && activeView === 'editor'
                      ? 'bg-stone-800 text-white font-semibold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                  }`}
                >
                  <span className="text-[11px]">{STATUS_META[note.status]?.icon}</span>
                  <span className="truncate">{note.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Folders & Notes Hierarchy */}
        <div>
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1">
            <Folder className="w-3 h-3" />
            <span>{t.foldersCategories}</span>
          </div>

          <div className="space-y-1">
            {Object.entries(folderGroups).map(([folderName, folderNotes]) => {
              const isExpanded = expandedFolders[folderName];
              const isFolderActive = selectedFolderFilter === folderName;

              return (
                <div key={folderName} className="space-y-0.5">
                  <div
                    onClick={() => toggleFolder(folderName)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-stone-300 hover:bg-stone-800/60 cursor-pointer ${
                      isFolderActive ? 'bg-stone-800 text-indigo-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      )}
                      <span className="truncate">{folderName}</span>
                    </div>
                    <span className="text-[10px] text-stone-500">{folderNotes.length}</span>
                  </div>

                  {/* Notes under folder */}
                  {isExpanded && (
                    <div className="space-y-0.5 border-stone-800/80 ms-3 ps-3 border-s">
                      {folderNotes.map((note) => {
                        const isNoteSelected = activeNoteId === note.id && activeView === 'editor';
                        return (
                          <button
                            key={note.id}
                            type="button"
                            onClick={() => {
                              onSelectNote(note.id);
                              onSwitchView('editor');
                            }}
                            className={`w-full px-2 py-1 rounded-md text-xs truncate flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isNoteSelected
                                ? 'bg-indigo-600/30 text-indigo-200 font-semibold'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                            }`}
                          >
                            <span className="text-[10px]">{STATUS_META[note.status]?.icon}</span>
                            <span className="truncate">{note.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags Cloud */}
        {tagsWithCounts.length > 0 && (
          <div>
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              <span>{t.tags}</span>
            </div>
            <div className="flex flex-wrap gap-1 px-1">
              {tagsWithCounts.slice(0, 14).map(([tag, count]) => {
                const isSelected = selectedTagFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectTagFilter(isSelected ? null : tag)}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    #{tag} <span className="opacity-60 text-[9px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Vault Health Footer Widget */}
      <div className="p-3 border-t border-stone-800 bg-stone-950/60">
        <button
          id="sidebar-health-analytics-btn"
          type="button"
          onClick={onOpenHealth}
          className="w-full p-2 rounded-xl bg-stone-800/70 hover:bg-stone-800 border border-stone-750 flex items-center justify-between text-stone-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div className="text-start">
              <div className="text-xs font-semibold text-stone-200">{t.vaultHealth}</div>
              <div className="text-[10px] text-stone-500">{t.analyticsTopology}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
            98%
          </span>
        </button>
      </div>
    </aside>
  );
}
