import { useState, useMemo } from 'react';
import { KnowledgeNote, NoteStatus } from '../types';
import { STATUS_META, extractOutgoingLinks } from '../utils/wikiLinks';
import { Language, translations } from '../utils/i18n';
import { Search, Filter, ArrowUpDown, Bookmark, Star, Calendar, Hash, Plus, Sparkles, Folder } from 'lucide-react';

interface NotesListViewProps {
  notes: KnowledgeNote[];
  activeNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  selectedTagFilter: string | null;
  onClearTagFilter: () => void;
  selectedFolderFilter: string | null;
  onClearFolderFilter: () => void;
  lang?: Language;
}

export default function NotesListView({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  selectedTagFilter,
  onClearTagFilter,
  selectedFolderFilter,
  onClearFolderFilter,
  lang = 'ar',
}: NotesListViewProps) {
  const t = translations[lang] || translations.en;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NoteStatus>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        if (statusFilter !== 'all' && note.status !== statusFilter) return false;
        if (selectedTagFilter && !note.tags.includes(selectedTagFilter)) return false;
        if (selectedFolderFilter && note.folder !== selectedFolderFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchTag = note.tags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchContent || matchTag;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [notes, statusFilter, selectedTagFilter, selectedFolderFilter, searchQuery, sortBy]);

  return (
    <div id="notes-list-pane" className="w-80 md:w-96 border-e border-stone-200 bg-white flex flex-col h-full shrink-0">
      {/* Header with Search and Create */}
      <div className="p-4 border-b border-stone-200 space-y-3 bg-stone-50/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">{t.notesVault}</h2>
          <span className="text-xs text-stone-400 font-medium">
            {filteredNotes.length} {t.notesCount}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute start-3 top-2.5" />
          <input
            id="notes-list-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ps-8 pe-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* Active Filters Bar */}
        {(selectedTagFilter || selectedFolderFilter) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {selectedTagFilter && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Hash className="w-2.5 h-2.5" />
                <span>{selectedTagFilter}</span>
                <button type="button" onClick={onClearTagFilter} className="hover:text-indigo-900 ms-0.5 cursor-pointer">
                  ×
                </button>
              </span>
            )}
            {selectedFolderFilter && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                <Folder className="w-2.5 h-2.5" />
                <span>{selectedFolderFilter}</span>
                <button type="button" onClick={onClearFolderFilter} className="hover:text-blue-900 ms-0.5 cursor-pointer">
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Status Lifecycle Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium pt-1">
          {(['all', 'seed', 'growing', 'evergreen'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-500 hover:bg-stone-200/60'
              }`}
            >
              {st === 'all'
                ? t.all
                : lang === 'ar'
                ? (st === 'seed' ? 'بذرة' : st === 'growing' ? 'نامية' : 'دائمة الخضرة')
                : STATUS_META[st]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const isSelected = note.id === activeNoteId;
            const outgoing = extractOutgoingLinks(note.content);

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`p-4 cursor-pointer transition-colors border-s-3 ${
                  isSelected
                    ? 'bg-indigo-50/50 border-s-indigo-600'
                    : 'hover:bg-stone-50 border-s-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-stone-900 leading-snug">
                    <span>{STATUS_META[note.status]?.icon}</span>
                    <span className="line-clamp-1">{note.title}</span>
                  </div>
                  {note.pinned && <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                </div>

                <p className="text-xs text-stone-500 line-clamp-2 mt-1.5 leading-relaxed">
                  {note.summary || note.content.replace(/[#*`_\[\]]/g, '').slice(0, 100)}
                </p>

                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2.5">
                  <span className="truncate max-w-[120px]">{note.folder}</span>
                  <div className="flex items-center gap-2">
                    {outgoing.length > 0 && (
                      <span className="text-indigo-600 font-medium">🔗 {outgoing.length}</span>
                    )}
                    <span>
                      {new Date(note.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-stone-400">
            {lang === 'ar' ? 'لا توجد ملاحظات تطابق معايير الفلترة.' : 'No notes match your filters.'}
          </div>
        )}
      </div>
    </div>
  );
}
