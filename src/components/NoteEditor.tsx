import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { KnowledgeNote, NoteStatus } from '../types';
import { STATUS_META, extractOutgoingLinks } from '../utils/wikiLinks';
import { translations } from '../utils/i18n';
import {
  Edit3,
  Eye,
  Columns,
  Sparkles,
  Bookmark,
  Star,
  Tag,
  Folder,
  Calendar,
  Hash,
  ListOrdered,
  List,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Link as LinkIcon,
  Bot,
  BrainCircuit,
  Layers,
  ChevronDown,
  Clock,
  FileText,
  Unlink
} from 'lucide-react';

interface NoteEditorProps {
  note: KnowledgeNote;
  allNotes: KnowledgeNote[];
  folders: string[];
  lang?: 'en' | 'ar';
  onUpdateNote: (updated: KnowledgeNote) => void;
  onNavigateToNote: (titleOrId: string) => void;
  onOpenAIAction: (action: 'summarize' | 'suggest-links' | 'unlinked-references' | 'flashcards' | 'mindmap', note: KnowledgeNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function NoteEditor({
  note,
  allNotes,
  folders,
  lang = 'en',
  onUpdateNote,
  onNavigateToNote,
  onOpenAIAction,
  onDeleteNote,
}: NoteEditorProps) {
  const t = translations[lang] || translations.en;
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [newTagInput, setNewTagInput] = useState('');
  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);

  // Wiki link auto-complete
  const [showLinkSuggest, setShowLinkSuggest] = useState(false);
  const [linkSuggestFilter, setLinkSuggestFilter] = useState('');
  const [suggestCursorPos, setSuggestCursorPos] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Available titles for auto-complete
  const matchingNotes = useMemo(() => {
    if (!linkSuggestFilter) return allNotes.slice(0, 6);
    const q = linkSuggestFilter.toLowerCase();
    return allNotes
      .filter((n) => n.id !== note.id && n.title.toLowerCase().includes(q))
      .slice(0, 6);
  }, [allNotes, note.id, linkSuggestFilter]);

  // Handle text change and check for `[[` trigger
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;

    onUpdateNote({
      ...note,
      content: val,
      updatedAt: new Date().toISOString(),
    });

    // Check if user just typed `[[`
    const textBefore = val.slice(0, cursorPos);
    const lastDoubleBracket = textBefore.lastIndexOf('[[');
    if (lastDoubleBracket !== -1 && lastDoubleBracket >= textBefore.length - 20) {
      const query = textBefore.slice(lastDoubleBracket + 2);
      if (!query.includes(']]') && !query.includes('\n')) {
        setShowLinkSuggest(true);
        setLinkSuggestFilter(query);
        setSuggestCursorPos(lastDoubleBracket);
        return;
      }
    }
    setShowLinkSuggest(false);
  };

  // Insert wiki-link
  const insertWikiLink = (title: string) => {
    if (!textareaRef.current) return;
    const content = note.content;
    const before = content.slice(0, suggestCursorPos);
    const after = content.slice(textareaRef.current.selectionStart);
    const newContent = `${before}[[${title}]]${after}`;

    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });

    setShowLinkSuggest(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Markdown Formatting Buttons
  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.slice(start, end);

    const replacement = `${prefix}${selection || 'text'}${suffix}`;
    const newContent = text.slice(0, start) + replacement + text.slice(end);

    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection ? selection.length : 4));
    }, 50);
  };

  // Tag management
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, '').toLowerCase();
      if (!note.tags.includes(cleanTag)) {
        onUpdateNote({
          ...note,
          tags: [...note.tags, cleanTag],
          updatedAt: new Date().toISOString(),
        });
      }
      setNewTagInput('');
      setIsTagInputOpen(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote({
      ...note,
      tags: note.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
  };

  // Stats
  const wordCount = useMemo(() => {
    return note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
  }, [note.content]);

  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const outgoingLinks = useMemo(() => {
    return extractOutgoingLinks(note.content);
  }, [note.content]);

  // Custom text renderer to transform `[[Link]]` into clickable spans
  const renderFormattedMarkdown = (text: string) => {
    const parts: (string | { link: string })[] = [];
    let lastIdx = 0;
    const regex = /\[\[(.*?)\]\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }
      parts.push({ link: match[1].trim() });
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx));
    }

    return parts;
  };

  return (
    <div id="note-editor-container" className="h-full flex flex-col bg-white overflow-hidden">
      {/* Top Header Bar */}
      <div id="note-editor-top-bar" className="border-b border-stone-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          {/* Status selector */}
          <div className="relative group">
            <button
              id="note-status-btn"
              type="button"
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                STATUS_META[note.status]?.badgeColor
              }`}
            >
              <span>{STATUS_META[note.status]?.icon}</span>
              <span>
                {lang === 'ar'
                  ? (note.status === 'seed' ? 'بذرة' : note.status === 'growing' ? 'نامية' : note.status === 'evergreen' ? 'دائمة الخضرة' : 'مؤرشفة')
                  : STATUS_META[note.status]?.label}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <div className="hidden group-hover:block absolute start-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-40">
              {(Object.keys(STATUS_META) as NoteStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onUpdateNote({ ...note, status: st, updatedAt: new Date().toISOString() })}
                  className="w-full px-3 py-1.5 text-start text-xs font-medium flex items-center gap-2 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <span>{STATUS_META[st].icon}</span>
                  <span className="text-stone-700">
                    {lang === 'ar'
                      ? (st === 'seed' ? 'بذرة' : st === 'growing' ? 'نامية' : st === 'evergreen' ? 'دائمة الخضرة' : 'مؤرشفة')
                      : STATUS_META[st].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Folder selector */}
          <div className="flex items-center gap-1 text-xs text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-lg">
            <Folder className="w-3.5 h-3.5 text-stone-400" />
            <select
              id="note-folder-select"
              value={note.folder}
              onChange={(e) => onUpdateNote({ ...note, folder: e.target.value, updatedAt: new Date().toISOString() })}
              aria-label="Select note folder"
              className="bg-transparent border-0 text-xs font-medium text-stone-700 focus:ring-0 cursor-pointer pe-3"
            >
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Pin & Favorite */}
          <button
            id="note-pin-btn"
            type="button"
            onClick={() => onUpdateNote({ ...note, pinned: !note.pinned, updatedAt: new Date().toISOString() })}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              note.pinned ? 'bg-amber-50 text-amber-600 border-amber-200' : 'text-stone-400 hover:text-stone-600 border-stone-200'
            }`}
            title={note.pinned ? (lang === 'ar' ? 'إلغاء التثبيت' : 'Unpin note') : (lang === 'ar' ? 'تثبيت الملاحظة في الأعلى' : 'Pin note to top')}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button
            id="note-favorite-btn"
            type="button"
            onClick={() => onUpdateNote({ ...note, favorite: !note.favorite, updatedAt: new Date().toISOString() })}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              note.favorite ? 'bg-amber-50 text-amber-500 border-amber-200 fill-amber-500' : 'text-stone-400 hover:text-stone-600 border-stone-200'
            }`}
            title={note.favorite ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Favorite note')}
          >
            <Star className={`w-3.5 h-3.5 ${note.favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Action Controls & AI */}
        <div className="flex items-center gap-2">
          {/* AI Knowledge Actions Dropdown */}
          <div className="relative">
            <button
              id="note-ai-actions-btn"
              type="button"
              onClick={() => setShowAiMenu((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.aiSynapse}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showAiMenu && (
              <div
                id="note-ai-actions-menu"
                className="absolute end-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-40"
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 tracking-wider">
                  {t.aiCognitiveActions}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiMenu(false);
                    onOpenAIAction('summarize', note);
                  }}
                  className="w-full px-3 py-2 text-start text-xs flex items-center gap-2.5 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-medium">{t.summarizeInsights}</div>
                    <div className="text-[10px] text-stone-400">{t.extractTakeaways}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiMenu(false);
                    onOpenAIAction('suggest-links', note);
                  }}
                  className="w-full px-3 py-2 text-start text-xs flex items-center gap-2.5 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <BrainCircuit className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-medium">{t.suggestConnections}</div>
                    <div className="text-[10px] text-stone-400">{t.discoverMissingLinks}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiMenu(false);
                    onOpenAIAction('unlinked-references', note);
                  }}
                  className="w-full px-3 py-2 text-start text-xs flex items-center gap-2.5 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Unlink className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-medium">{t.findUnlinkedRefsMenu}</div>
                    <div className="text-[10px] text-stone-400">{t.findUnlinkedRefsDesc}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiMenu(false);
                    onOpenAIAction('flashcards', note);
                  }}
                  className="w-full px-3 py-2 text-start text-xs flex items-center gap-2.5 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-medium">{t.generateCardsMenu}</div>
                    <div className="text-[10px] text-stone-400">{t.activeRecallDeck}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiMenu(false);
                    onOpenAIAction('mindmap', note);
                  }}
                  className="w-full px-3 py-2 text-start text-xs flex items-center gap-2.5 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-medium">{t.synthesizeMindmapMenu}</div>
                    <div className="text-[10px] text-stone-400">{t.conceptTree}</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              id="viewmode-edit-btn"
              type="button"
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'edit' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-500 hover:text-stone-700'
              }`}
              title={t.editorOnly}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id="viewmode-split-btn"
              type="button"
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-500 hover:text-stone-700'
              }`}
              title={t.splitView}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              id="viewmode-preview-btn"
              type="button"
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'preview' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-500 hover:text-stone-700'
              }`}
              title={t.previewOnly}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Note Title & Tags Bar */}
      <div id="note-metadata-header" className="px-8 pt-6 pb-4 border-b border-stone-100">
        <input
          id="note-title-input"
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote({ ...note, title: e.target.value, updatedAt: new Date().toISOString() })}
          placeholder={t.noteTitlePlaceholder}
          className="w-full text-2xl font-bold text-stone-900 border-0 focus:ring-0 focus:outline-hidden p-0 placeholder:text-stone-300 tracking-tight"
        />

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium group hover:bg-stone-200 transition-colors"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-stone-400 hover:text-stone-600 ms-0.5 text-xs cursor-pointer"
                title={`Remove #${tag}`}
              >
                ×
              </button>
            </span>
          ))}

          {isTagInputOpen ? (
            <input
              id="new-tag-input"
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              onBlur={() => setIsTagInputOpen(false)}
              autoFocus
              placeholder={t.tagInputPlaceholder}
              className="text-xs px-2 py-0.5 rounded-md border border-indigo-300 focus:outline-hidden text-stone-800 w-28"
            />
          ) : (
            <button
              id="add-tag-btn"
              type="button"
              onClick={() => setIsTagInputOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 px-2 py-0.5 rounded-full border border-dashed border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
            >
              <Tag className="w-2.5 h-2.5" />
              <span>{t.addTag}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Markdown Toolbar (visible in edit or split mode) */}
      {viewMode !== 'preview' && (
        <div id="note-editor-toolbar" className="border-b border-stone-100 px-8 py-2 flex flex-wrap items-center gap-1 bg-stone-50/60 text-stone-600 text-xs">
          <button
            type="button"
            onClick={() => insertFormat('**', '**')}
            className="p-1.5 hover:bg-stone-200/70 rounded-md transition-colors"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('*', '*')}
            className="p-1.5 hover:bg-stone-200/70 rounded-md transition-colors"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('# ')}
            className="p-1.5 hover:bg-stone-200/70 rounded-md transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('## ')}
            className="p-1.5 hover:bg-stone-200/70 rounded-md transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('- ')}
            className="p-1.5 hover:bg-stone-200/70 rounded-md transition-colors"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('- [ ] ')}
            className="p-1.5 hover:bg-stone-200/70 rounded-md transition-colors"
            title="Task Checkbox"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('`', '`')}
            className="p-1.5 hover:bg-stone-200/70 rounded-md transition-colors"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-stone-200 mx-1" />
          <button
            type="button"
            onClick={() => insertFormat('[[', ']]')}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-md transition-colors"
            title="Insert [[Wiki Link]]"
          >
            <LinkIcon className="w-3 h-3" />
            <span>[[Wiki Link]]</span>
          </button>
        </div>
      )}

      {/* Main Workspace Area (Editor, Preview, or Split) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`h-full overflow-y-auto flex flex-col relative ${viewMode === 'split' ? 'w-1/2 border-r border-stone-200' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              id="note-markdown-textarea"
              value={note.content}
              onChange={handleContentChange}
              placeholder="Start writing in Markdown or type [[ to link to another note..."
              className="flex-1 w-full p-8 font-mono text-sm leading-relaxed text-stone-800 bg-transparent resize-none focus:outline-hidden border-0"
              spellCheck={false}
            />

            {/* Wiki Link Suggestion Popup when user types `[[` */}
            {showLinkSuggest && (
              <div
                id="wiki-link-autocomplete"
                className="absolute z-50 bg-white rounded-xl shadow-xl border border-stone-200 w-72 max-h-60 overflow-y-auto py-1 left-8 bottom-12"
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 border-b border-stone-100">
                  LINK TO NOTE
                </div>
                {matchingNotes.length > 0 ? (
                  matchingNotes.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => insertWikiLink(target.title)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-indigo-50/70 flex items-center justify-between transition-colors"
                    >
                      <span className="font-semibold text-stone-800 truncate">{target.title}</span>
                      <span className="text-[10px] text-stone-400 capitalize">{target.folder}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-stone-400">
                    No matching note. Press Enter to create new link.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live Rendered Markdown Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            id="note-markdown-preview-pane"
            className={`h-full overflow-y-auto p-8 bg-stone-50/30 prose prose-stone max-w-none ${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            }`}
          >
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom rendering for text to highlight [[Wiki-links]]
                  p: ({ children }) => {
                    return (
                      <p className="mb-4 text-stone-800 leading-relaxed text-base">
                        {React.Children.map(children, (child) => {
                          if (typeof child === 'string') {
                            const fragments = renderFormattedMarkdown(child);
                            return fragments.map((f, i) => {
                              if (typeof f === 'string') return f;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => onNavigateToNote(f.link)}
                                  className="inline-flex items-center mx-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors text-xs cursor-pointer shadow-2xs"
                                  title={`Jump to ${f.link}`}
                                >
                                  🔗 {f.link}
                                </button>
                              );
                            });
                          }
                          return child;
                        })}
                      </p>
                    );
                  },
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-stone-900 mt-6 mb-3 tracking-tight">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold text-stone-900 mt-5 mb-2.5 tracking-tight">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-stone-800 mt-4 mb-2">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-400 pl-4 py-1 italic text-stone-600 my-4 bg-stone-100/50 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children, className }) => {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-xs text-indigo-600">
                        {children}
                      </code>
                    );
                  },
                  ul: ({ children }) => <ul className="list-disc pl-5 my-3 space-y-1 text-stone-700">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-3 space-y-1 text-stone-700">{children}</ol>,
                }}
              >
                {note.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Metadata & Statistics Footer */}
      <div id="note-editor-footer" className="border-t border-stone-200 px-6 py-2 bg-stone-50 text-stone-500 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-stone-400" />
            <span>{wordCount} {t.words}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>~{readTimeMin} {t.readingTime}</span>
          </span>
          <span className="flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-stone-400" />
            <span>{outgoingLinks.length} {t.outgoingLinks}</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-stone-400 text-[11px]">
          <span>{t.updated} {new Date(note.updatedAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            type="button"
            onClick={() => onDeleteNote(note.id)}
            className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            {t.deleteNote}
          </button>
        </div>
      </div>
    </div>
  );
}
