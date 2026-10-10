import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeNote, Flashcard, ViewMode } from './types';
import { INITIAL_NOTES, INITIAL_FLASHCARDS, ARABIC_SAMPLE_NOTES, ARABIC_SAMPLE_FLASHCARDS } from './data/sampleVault';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { translations } from './utils/i18n';
import Sidebar from './components/Sidebar';
import NotesListView from './components/NotesListView';
import NoteEditor from './components/NoteEditor';
import BacklinksPanel from './components/BacklinksPanel';
import GraphView from './components/GraphView';
import FlashcardsView from './components/FlashcardsView';
import AIAssistantModal from './components/AIAssistantModal';
import VaultHealthModal from './components/VaultHealthModal';
import CommandPalette from './components/CommandPalette';
import { PanelLeft, PanelRight, Sparkles, Languages } from 'lucide-react';

const STORAGE_KEY_NOTES = 'synapse_vault_notes_v1';
const STORAGE_KEY_FLASHCARDS = 'synapse_vault_flashcards_v1';

function AppContent() {
  const { lang, dir, toggleLang, setLang } = useLanguage();
  const t = translations[lang] || translations.ar;

  // 1. Core State Persistence
  const [notes, setNotes] = useState<KnowledgeNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
    }
    // Default to Arabic knowledge base if language is Arabic
    const savedLang = localStorage.getItem('synapse_language');
    if (savedLang === 'en') {
      return INITIAL_NOTES;
    }
    return ARABIC_SAMPLE_NOTES;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FLASHCARDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load flashcards from localStorage', e);
    }
    const savedLang = localStorage.getItem('synapse_language');
    if (savedLang === 'en') {
      return INITIAL_FLASHCARDS;
    }
    return ARABIC_SAMPLE_FLASHCARDS;
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FLASHCARDS, JSON.stringify(flashcards));
    } catch (e) {
      console.error('Failed to save flashcards', e);
    }
  }, [flashcards]);

  // 2. Navigation and View State
  const [activeView, setActiveView] = useState<ViewMode>('editor');
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || 'note-ar-second-brain';
  });

  // Sidebar and Panel Toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBacklinksOpen, setIsBacklinksOpen] = useState(true);

  // Filters
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [aiModalConfig, setAiModalConfig] = useState<{
    isOpen: boolean;
    mode: 'ask' | 'summarize' | 'suggest-links' | 'unlinked-references' | 'flashcards' | 'mindmap';
  }>({
    isOpen: false,
    mode: 'ask',
  });

  // Folders list
  const folders = useMemo(() => {
    const set = new Set(notes.map((n) => n.folder));
    return Array.from(set);
  }, [notes]);

  // Current active note
  const currentNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0];
  }, [notes, activeNoteId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Notes
  const handleUpdateNote = (updated: KnowledgeNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleCreateNewNote = () => {
    const isAr = lang === 'ar';
    const newNote: KnowledgeNote = {
      id: `note-${Date.now()}`,
      title: isAr ? 'مفهوم جديد بدون عنوان' : 'Untitled Concept',
      content: isAr
        ? '# مفهوم جديد بدون عنوان\n\nابدأ الكتابة أو اكتب [[ لربط الأفكار بمفاهيم أخرى في خزانتك...'
        : '# Untitled Concept\n\nStart writing or type [[ to link to existing ideas in your vault...',
      folder: selectedFolderFilter || (isAr ? 'عام' : 'General'),
      tags: selectedTagFilter ? [selectedTagFilter] : ['concept'],
      status: 'seed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setActiveView('editor');
  };

  const handleDeleteNote = (noteId: string) => {
    const confirmMsg = lang === 'ar' ? 'هل أنت متأكد من حذف هذه الملاحظة؟' : 'Are you sure you want to delete this note?';
    if (confirm(confirmMsg)) {
      const remaining = notes.filter((n) => n.id !== noteId);
      setNotes(remaining);
      if (activeNoteId === noteId && remaining.length > 0) {
        setActiveNoteId(remaining[0].id);
      }
    }
  };

  // Navigate to Note by ID or Title (creates note on the fly if non-existent)
  const handleNavigateToNote = (titleOrId: string) => {
    // Check if ID matches
    const byId = notes.find((n) => n.id === titleOrId);
    if (byId) {
      setActiveNoteId(byId.id);
      setActiveView('editor');
      return;
    }

    // Check if title matches (case-insensitive & trimmed)
    const cleanQuery = titleOrId.replace(/[\[\]]/g, '').trim().toLowerCase();
    const byTitle = notes.find((n) => n.title.toLowerCase().trim() === cleanQuery);
    if (byTitle) {
      setActiveNoteId(byTitle.id);
      setActiveView('editor');
      return;
    }

    // Create note if non-existent
    const cleanTitle = titleOrId.replace(/[\[\]]/g, '').trim();
    const isAr = lang === 'ar';
    const newNote: KnowledgeNote = {
      id: `note-${Date.now()}`,
      title: cleanTitle,
      content: isAr
        ? `# ${cleanTitle}\n\nمرتبط من [[${currentNote?.title || 'الخزانة'}]]\n\nتوسع في هذا المفهوم وكتابة التفاصيل...`
        : `# ${cleanTitle}\n\nConnected from [[${currentNote?.title || 'Vault'}]]\n\nElaborate on this concept...`,
      folder: currentNote?.folder || (isAr ? 'عام' : 'General'),
      tags: ['seed'],
      status: 'seed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setActiveView('editor');
  };

  // Flashcards Handlers
  const handleUpdateCard = (updated: Flashcard) => {
    setFlashcards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddCard = (cardData: Omit<Flashcard, 'id'>) => {
    const newCard: Flashcard = {
      ...cardData,
      id: `fc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setFlashcards((prev) => [newCard, ...prev]);
  };

  const handleAddMultipleCards = (newCards: Omit<Flashcard, 'id'>[]) => {
    const formatted = newCards.map((c) => ({
      ...c,
      id: `fc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    }));
    setFlashcards((prev) => [...formatted, ...prev]);
  };

  const handleDeleteCard = (cardId: string) => {
    setFlashcards((prev) => prev.filter((c) => c.id !== cardId));
  };

  // Export / Import Handlers
  const handleExportVault = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
      flashcards,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    let combined = '';
    notes.forEach((n) => {
      combined += `\n\n========================================\n# FILE: ${n.title}.md\nFOLDER: ${n.folder}\nTAGS: ${n.tags.join(', ')}\nSTATUS: ${n.status}\n========================================\n\n${n.content}\n`;
    });
    const blob = new Blob([combined], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-notes-archive.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.notes && Array.isArray(parsed.notes)) {
          setNotes(parsed.notes);
          if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
            setFlashcards(parsed.flashcards);
          }
          if (parsed.notes.length > 0) {
            setActiveNoteId(parsed.notes[0].id);
          }
          alert(lang === 'ar' ? `تم استيراد ${parsed.notes.length} ملاحظة بنجاح!` : `Successfully imported ${parsed.notes.length} notes!`);
        }
      } catch (err) {
        alert(lang === 'ar' ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid vault JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleVault = () => {
    const confirmMsg = lang === 'ar' ? 'هل تريد استعادة خزانة النماذج الإنجليزية الأصلية؟' : 'Reset knowledge base to the original curated English sample vault?';
    if (confirm(confirmMsg)) {
      setNotes(INITIAL_NOTES);
      setFlashcards(INITIAL_FLASHCARDS);
      setActiveNoteId(INITIAL_NOTES[0].id);
      setIsHealthModalOpen(false);
    }
  };

  const handleLoadArabicVault = () => {
    const confirmMsg = lang === 'ar' ? 'هل تريد تحميل خزانة المعرفة النموذجية باللغة العربية؟' : 'Load the curated Arabic knowledge sample vault?';
    if (confirm(confirmMsg)) {
      setNotes(ARABIC_SAMPLE_NOTES);
      setFlashcards(ARABIC_SAMPLE_FLASHCARDS);
      setActiveNoteId(ARABIC_SAMPLE_NOTES[0].id);
      setIsHealthModalOpen(false);
    }
  };

  return (
    <div
      id="synapse-app-root"
      dir={dir}
      className="h-screen w-screen flex bg-stone-100 text-stone-900 overflow-hidden font-sans"
    >
      {/* 1. Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          notes={notes}
          flashcards={flashcards}
          activeNoteId={activeNoteId}
          activeView={activeView}
          onSelectNote={(id) => {
            setActiveNoteId(id);
            setActiveView('editor');
          }}
          onSwitchView={(v) => setActiveView(v)}
          onCreateNewNote={handleCreateNewNote}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenHealth={() => setIsHealthModalOpen(true)}
          onOpenAI={() => setAiModalConfig({ isOpen: true, mode: 'ask' })}
          selectedTagFilter={selectedTagFilter}
          onSelectTagFilter={(t) => {
            setSelectedTagFilter(t);
            setActiveView('editor');
          }}
          selectedFolderFilter={selectedFolderFilter}
          onSelectFolderFilter={(f) => {
            setSelectedFolderFilter(f);
            setActiveView('editor');
          }}
          lang={lang}
          onToggleLang={toggleLang}
        />
      )}

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Universal Top Header */}
        <div
          id="app-universal-header"
          className="h-12 border-b border-stone-200 px-4 flex items-center justify-between bg-white shrink-0 z-20"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              title={isSidebarOpen ? (lang === 'ar' ? 'إخفاء الشريط الجانبي' : 'Hide Sidebar') : (lang === 'ar' ? 'إظهار الشريط الجانبي' : 'Show Sidebar')}
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="font-semibold text-stone-800">{lang === 'ar' ? 'سينابس' : 'Synapse'}</span>
              <span>/</span>
              <span>{activeView === 'editor' ? t.editor : activeView === 'graph' ? t.graphView : t.flashcards}</span>
              {activeView === 'editor' && currentNote && (
                <>
                  <span>/</span>
                  <span className="truncate max-w-[200px] text-stone-700 font-medium">
                    {currentNote.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switch Button */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <Languages className="w-3.5 h-3.5 text-stone-500" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAiModalConfig({ isOpen: true, mode: 'ask' })}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">{t.askAiVault}</span>
            </button>

            {activeView === 'editor' && (
              <button
                type="button"
                onClick={() => setIsBacklinksOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isBacklinksOpen
                    ? 'bg-stone-100 text-stone-800 border-stone-300'
                    : 'text-stone-400 hover:text-stone-700 border-stone-200'
                }`}
                title={isBacklinksOpen ? (lang === 'ar' ? 'إخفاء لوحة الروابط الخلفية' : 'Hide Backlinks Panel') : (lang === 'ar' ? 'إظهار لوحة الروابط الخلفية' : 'Show Backlinks Panel')}
              >
                <PanelRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic View Switcher */}
        <div className="flex-1 flex overflow-hidden">
          {/* VIEW: Editor Mode with Notes List, Editor, and Backlinks */}
          {activeView === 'editor' && (
            <>
              <NotesListView
                notes={notes}
                activeNoteId={activeNoteId}
                onSelectNote={(id) => setActiveNoteId(id)}
                onCreateNote={handleCreateNewNote}
                selectedTagFilter={selectedTagFilter}
                onClearTagFilter={() => setSelectedTagFilter(null)}
                selectedFolderFilter={selectedFolderFilter}
                onClearFolderFilter={() => setSelectedFolderFilter(null)}
                lang={lang}
              />

              {/* Central Editor */}
              <div className="flex-1 h-full overflow-hidden flex flex-col">
                {currentNote ? (
                  <NoteEditor
                    note={currentNote}
                    allNotes={notes}
                    folders={folders}
                    lang={lang}
                    onUpdateNote={handleUpdateNote}
                    onNavigateToNote={handleNavigateToNote}
                    onOpenAIAction={(action, note) => {
                      setAiModalConfig({ isOpen: true, mode: action });
                    }}
                    onDeleteNote={handleDeleteNote}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-400">
                    {lang === 'ar' ? 'لم يتم تحديد أي ملاحظة. أنشئ واحدة لتبدأ!' : 'No note selected. Create one to get started!'}
                  </div>
                )}
              </div>

              {/* Right Side: Backlinks Inspector */}
              {isBacklinksOpen && currentNote && (
                <div className="w-72 xl:w-80 h-full shrink-0">
                  <BacklinksPanel
                    currentNote={currentNote}
                    allNotes={notes}
                    onSelectNote={(id) => setActiveNoteId(id)}
                    onUpdateSourceNote={handleUpdateNote}
                    lang={lang}
                  />
                </div>
              )}
            </>
          )}

          {/* VIEW: 2D Interactive Knowledge Graph */}
          {activeView === 'graph' && (
            <GraphView
              notes={notes}
              activeNoteId={activeNoteId}
              lang={lang}
              onSelectNote={(id) => {
                setActiveNoteId(id);
                setActiveView('editor');
              }}
            />
          )}

          {/* VIEW: Active Recall Flashcards */}
          {activeView === 'flashcards' && (
            <FlashcardsView
              cards={flashcards}
              notes={notes}
              lang={lang}
              onUpdateCard={handleUpdateCard}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onNavigateToNote={(id) => {
                setActiveNoteId(id);
                setActiveView('editor');
              }}
            />
          )}
        </div>
      </main>

      {/* 3. Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        onSelectNote={(id) => {
          setActiveNoteId(id);
          setActiveView('editor');
        }}
        onCreateNote={handleCreateNewNote}
        onSwitchView={(v) => setActiveView(v)}
        onOpenAI={() => setAiModalConfig({ isOpen: true, mode: 'ask' })}
        onOpenHealth={() => setIsHealthModalOpen(true)}
        lang={lang}
      />

      <AIAssistantModal
        isOpen={aiModalConfig.isOpen}
        onClose={() => setAiModalConfig((prev) => ({ ...prev, isOpen: false }))}
        initialMode={aiModalConfig.mode}
        currentNote={currentNote}
        allNotes={notes}
        onAddFlashcards={handleAddMultipleCards}
        onNavigateToNote={handleNavigateToNote}
        onUpdateNote={handleUpdateNote}
        lang={lang}
      />

      <VaultHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        notes={notes}
        onSelectNote={(id) => {
          setActiveNoteId(id);
          setActiveView('editor');
        }}
        onExportVault={handleExportVault}
        onExportMarkdown={handleExportMarkdown}
        onImportVault={handleImportVault}
        onResetSampleVault={handleResetSampleVault}
        onLoadArabicVault={handleLoadArabicVault}
        lang={lang}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
