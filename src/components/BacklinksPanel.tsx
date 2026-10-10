import { useMemo } from 'react';
import { KnowledgeNote } from '../types';
import { computeBacklinks, extractOutgoingLinks, STATUS_META } from '../utils/wikiLinks';
import { Language, translations } from '../utils/i18n';
import { Link2, Unlink, ArrowUpRight, Plus, Compass } from 'lucide-react';

interface BacklinksPanelProps {
  currentNote: KnowledgeNote;
  allNotes: KnowledgeNote[];
  onSelectNote: (noteId: string) => void;
  onUpdateSourceNote: (updatedNote: KnowledgeNote) => void;
  lang?: Language;
}

export default function BacklinksPanel({
  currentNote,
  allNotes,
  onSelectNote,
  onUpdateSourceNote,
  lang = 'ar',
}: BacklinksPanelProps) {
  const t = translations[lang];

  // Compute backlinks
  const { linked, unlinked } = useMemo(() => {
    return computeBacklinks(currentNote, allNotes);
  }, [currentNote, allNotes]);

  // Compute outgoing links
  const outgoingTitles = useMemo(() => {
    return extractOutgoingLinks(currentNote.content);
  }, [currentNote.content]);

  // Turn unlinked mention into explicit link in the source note
  const handleTurnIntoLink = (sourceNoteId: string) => {
    const source = allNotes.find((n) => n.id === sourceNoteId);
    if (!source) return;

    // Replace first unlinked occurrence with [[currentNote.title]]
    const escaped = currentNote.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Unicode-aware word boundaries for Arabic and English
    const regex = new RegExp(`(?<!\\[\\[)(?<![\\p{L}\\p{N}])(${escaped})(?![\\p{L}\\p{N}])(?!\\]\\])`, 'iu');

    const newContent = source.content.replace(regex, `[[${currentNote.title}]]`);
    onUpdateSourceNote({
      ...source,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div id="backlinks-panel-container" className="h-full flex flex-col bg-stone-50/70 border-s border-stone-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2 text-stone-800">
          <Compass className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">{t.connectedContext}</h2>
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5">{t.bidirectionalBacklinks}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Section 1: Linked Mentions */}
        <div id="linked-mentions-section">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
              <Link2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.linkedMentions}</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              {linked.length}
            </span>
          </div>

          {linked.length > 0 ? (
            <div className="space-y-2">
              {linked.map((item) => (
                <div
                  key={item.sourceNoteId}
                  onClick={() => onSelectNote(item.sourceNoteId)}
                  className="p-2.5 bg-white rounded-xl border border-stone-200 hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800 group-hover:text-indigo-600">
                    <span className="truncate">{item.sourceNoteTitle}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1 line-clamp-2 italic bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                    "{item.snippet}"
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-stone-400 p-3 bg-white/60 rounded-xl border border-dashed border-stone-200 text-center">
              {t.noIncomingLinks} <span className="font-mono text-indigo-500">[[{currentNote.title}]]</span>.
            </div>
          )}
        </div>

        {/* Section 2: Unlinked Mentions */}
        <div id="unlinked-mentions-section">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
              <Unlink className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.unlinkedMentions}</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              {unlinked.length}
            </span>
          </div>

          {unlinked.length > 0 ? (
            <div className="space-y-2">
              {unlinked.map((item) => (
                <div
                  key={item.sourceNoteId}
                  className="p-2.5 bg-white rounded-xl border border-amber-200/60 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                    <span
                      onClick={() => onSelectNote(item.sourceNoteId)}
                      className="cursor-pointer hover:text-indigo-600 truncate"
                    >
                      {item.sourceNoteTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTurnIntoLink(item.sourceNoteId)}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                      title="Convert this mention to an explicit [[link]]"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{t.link}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1 line-clamp-2 italic bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                    "{item.snippet}"
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-stone-400 p-3 bg-white/60 rounded-xl border border-dashed border-stone-200 text-center">
              {t.noUnlinkedMentions}
            </div>
          )}
        </div>

        {/* Section 3: Outgoing Links */}
        <div id="outgoing-links-section">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
              <span>{t.outgoingLinks}</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {outgoingTitles.length}
            </span>
          </div>

          {outgoingTitles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {outgoingTitles.map((title) => {
                const targetNote = allNotes.find((n) => n.title.toLowerCase() === title.toLowerCase());
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      if (targetNote) onSelectNote(targetNote.id);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-all ${
                      targetNote
                        ? 'bg-white hover:bg-indigo-50 text-stone-700 hover:text-indigo-700 border-stone-200 hover:border-indigo-200 cursor-pointer shadow-2xs'
                        : 'bg-stone-100 text-stone-400 border-dashed border-stone-300 cursor-not-allowed'
                    }`}
                  >
                    <span>{title}</span>
                    {targetNote?.status && (
                      <span className="text-[10px]">{STATUS_META[targetNote.status]?.icon}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-stone-400 p-3 bg-white/60 rounded-xl border border-dashed border-stone-200 text-center">
              {t.noOutgoingLinks}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
