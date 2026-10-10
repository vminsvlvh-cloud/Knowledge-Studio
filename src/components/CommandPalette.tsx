import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeNote, ViewMode } from '../types';
import { Language } from '../utils/i18n';
import { Search, Plus, Network, Layers, Sparkles, Activity, FileText, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: KnowledgeNote[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onSwitchView: (view: ViewMode) => void;
  onOpenAI: () => void;
  onOpenHealth: () => void;
  lang?: Language;
}

export default function CommandPalette({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onCreateNote,
  onSwitchView,
  onOpenAI,
  onOpenHealth,
  lang = 'ar',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Combined searchable actions and notes
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    const actions = [
      {
        id: 'act-new',
        type: 'action',
        title: lang === 'ar' ? 'إنشاء ملاحظة ذرية جديدة' : 'Create New Note',
        icon: Plus,
        run: () => onCreateNote(),
      },
      {
        id: 'act-graph',
        type: 'action',
        title: lang === 'ar' ? 'فتح الرسم البياني المعرفي' : 'Open Knowledge Graph View',
        icon: Network,
        run: () => onSwitchView('graph'),
      },
      {
        id: 'act-flashcards',
        type: 'action',
        title: lang === 'ar' ? 'مراجعة بطاقات الاسترجاع النشط' : 'Review Active Recall Flashcards',
        icon: Layers,
        run: () => onSwitchView('flashcards'),
      },
      {
        id: 'act-ai',
        type: 'action',
        title: lang === 'ar' ? 'اسأل الذكاء الاصطناعي / توليف المعرفة' : 'Ask AI Vault / Synthesize Ideas',
        icon: Sparkles,
        run: () => onOpenAI(),
      },
      {
        id: 'act-health',
        type: 'action',
        title: lang === 'ar' ? 'صحة الخزانة وتحليلات الشبكة' : 'Vault Health & Link Analytics',
        icon: Activity,
        run: () => onOpenHealth(),
      },
    ];

    if (!q) {
      return [
        ...actions,
        ...notes.slice(0, 5).map((n) => ({
          id: n.id,
          type: 'note',
          title: n.title,
          folder: n.folder,
          tags: n.tags,
          icon: FileText,
          run: () => onSelectNote(n.id),
        })),
      ];
    }

    const filteredActions = actions.filter((a) => a.title.toLowerCase().includes(q));
    const filteredNotes = notes
      .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)))
      .slice(0, 8)
      .map((n) => ({
        id: n.id,
        type: 'note',
        title: n.title,
        folder: n.folder,
        tags: n.tags,
        icon: FileText,
        run: () => onSelectNote(n.id),
      }));

    return [...filteredActions, ...filteredNotes];
  }, [query, notes, lang]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = searchResults[selectedIndex];
      if (target) {
        target.run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="command-palette-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
    >
      <div
        id="command-palette-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-stone-200 gap-3">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            id="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={lang === 'ar' ? 'اكتب عنوان ملاحظة، مفهوماً، أو أمراً...' : 'Type a note title, concept, or command...'}
            className="w-full text-sm text-stone-800 border-0 focus:ring-0 focus:outline-hidden placeholder:text-stone-400 p-0"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-semibold text-stone-400 px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {searchResults.length > 0 ? (
            searchResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                    isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-stone-400'}`} />
                    <span className="truncate">{item.title}</span>
                    {item.type === 'note' && (item as any).folder && (
                      <span className="text-[10px] text-stone-400">· {(item as any).folder}</span>
                    )}
                  </div>

                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${lang === 'ar' ? 'rotate-180' : ''} ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-stone-400">
              {lang === 'ar' ? `لا توجد ملاحظات أو أوامر تطابق "${query}".` : `No notes or commands match "${query}".`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
