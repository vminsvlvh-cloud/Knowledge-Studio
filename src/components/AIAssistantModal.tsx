import { useState, useEffect } from 'react';
import { KnowledgeNote, Flashcard } from '../types';
import { Sparkles, X, Bot, BrainCircuit, Layers, Send, Link, Plus, Check, Loader2, BookOpen, Unlink, Zap, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language, translations } from '../utils/i18n';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'ask' | 'summarize' | 'suggest-links' | 'unlinked-references' | 'flashcards' | 'mindmap';
  currentNote?: KnowledgeNote;
  allNotes: KnowledgeNote[];
  onAddFlashcards: (newCards: Omit<Flashcard, 'id'>[]) => void;
  onNavigateToNote: (title: string) => void;
  onUpdateNote: (note: KnowledgeNote) => void;
  lang?: Language;
}

export default function AIAssistantModal({
  isOpen,
  onClose,
  initialMode,
  currentNote,
  allNotes,
  onAddFlashcards,
  onNavigateToNote,
  onUpdateNote,
  lang = 'ar',
}: AIAssistantModalProps) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'ask' | 'summarize' | 'suggest-links' | 'unlinked-references' | 'flashcards' | 'mindmap'>(initialMode);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [qaHistory, setQaHistory] = useState<{ query: string; answer: string; citedNotes: string[] }[]>([]);
  const [summaryData, setSummaryData] = useState<{ summary: string; keyTakeaways: string[]; tags: string[] } | null>(null);
  const [suggestedLinks, setSuggestedLinks] = useState<{ noteTitle: string; reason: string }[]>([]);
  const [unlinkedReferences, setUnlinkedReferences] = useState<{
    conceptId?: string;
    conceptTitle: string;
    folder?: string;
    matchedText: string;
    snippet: string;
    occurrencesCount: number;
    reason: string;
    linked?: boolean;
  }[]>([]);
  const [generatedCards, setGeneratedCards] = useState<{ question: string; answer: string; saved?: boolean }[]>([]);
  const [mindmapData, setMindmapData] = useState<any>(null);

  useEffect(() => {
    setActiveTab(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  // Trigger actions when tab changes if currentNote is set
  useEffect(() => {
    if (!isOpen || !currentNote) return;

    if (activeTab === 'summarize' && !summaryData) {
      handleSummarize();
    } else if (activeTab === 'suggest-links' && suggestedLinks.length === 0) {
      handleSuggestLinks();
    } else if (activeTab === 'unlinked-references' && unlinkedReferences.length === 0) {
      handleFindUnlinkedReferences();
    } else if (activeTab === 'flashcards' && generatedCards.length === 0) {
      handleGenerateCards();
    } else if (activeTab === 'mindmap' && !mindmapData) {
      handleGenerateMindmap();
    }
  }, [activeTab, isOpen, currentNote]);

  if (!isOpen) return null;

  // 1. Ask Your Vault
  const handleAskVault = async (customPrompt?: string) => {
    const q = customPrompt || question;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    // Prepare vault notes context
    const notesContext = allNotes
      .map((n) => `--- Title: ${n.title} (Folder: ${n.folder}, Tags: #${n.tags.join(', #')}) ---\n${n.content.slice(0, 800)}`)
      .join('\n\n');

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, notesContext, language: lang }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setQaHistory((prev) => [{ query: q, answer: data.answer, citedNotes: data.citedNotes || [] }, ...prev]);
      setQuestion('');
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل الاستعلام من خزانة المعرفة' : 'Failed to query knowledge vault'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Auto-Summarize Note
  const handleSummarize = async () => {
    if (!currentNote) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: currentNote.title, content: currentNote.content, language: lang }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummaryData(data);
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل تلخيص الملاحظة' : 'Failed to summarize note'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Suggest Connections
  const handleSuggestLinks = async () => {
    if (!currentNote) return;
    setLoading(true);
    setError(null);

    try {
      const vaultTitles = allNotes.map((n) => n.title);
      const res = await fetch('/api/ai/suggest-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTitle: currentNote.title,
          currentContent: currentNote.content,
          vaultTitles,
          language: lang,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestedLinks(data.suggestedLinks || []);
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل اقتراح الروابط' : 'Failed to suggest links'));
    } finally {
      setLoading(false);
    }
  };

  // 3b. Find Unlinked References (existing vault concepts mentioned in active note text without [[...]])
  const handleFindUnlinkedReferences = async () => {
    if (!currentNote) return;
    setLoading(true);
    setError(null);

    try {
      const vaultConcepts = allNotes.map((n) => ({
        id: n.id,
        title: n.title,
        folder: n.folder,
        tags: n.tags,
      }));

      const res = await fetch('/api/ai/find-unlinked-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTitle: currentNote.title,
          currentContent: currentNote.content,
          vaultConcepts,
          language: lang,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUnlinkedReferences(data.unlinkedReferences || []);
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل البحث عن الإشارات غير المرتبطة' : 'Failed to find unlinked references'));
    } finally {
      setLoading(false);
    }
  };

  // Turn unlinked mention into [[Link]] inside active note
  const handleLinkReferenceInNote = (conceptTitle: string, matchedText?: string) => {
    if (!currentNote) return;

    const targetText = matchedText || conceptTitle;
    const escaped = targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Unicode-aware word boundaries for Arabic and English
    const regex = new RegExp(`(?<!\\[\\[)(?<![\\p{L}\\p{N}])(${escaped})(?![\\p{L}\\p{N}])(?!\\]\\])`, 'iu');

    let newContent = currentNote.content;
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, `[[${conceptTitle}]]`);
    } else {
      // Fallback: append link
      newContent = `${newContent}\n\n- ${lang === 'ar' ? 'مرتبط بـ' : 'Connected to'} [[${conceptTitle}]]`;
    }

    onUpdateNote({
      ...currentNote,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });

    setUnlinkedReferences((prev) =>
      prev.map((item) =>
        item.conceptTitle.toLowerCase() === conceptTitle.toLowerCase()
          ? { ...item, linked: true }
          : item
      )
    );
  };

  // Link ALL unlinked references at once
  const handleLinkAllReferences = () => {
    if (!currentNote) return;

    let newContent = currentNote.content;
    const updatedList = [...unlinkedReferences];

    for (let i = 0; i < updatedList.length; i++) {
      const item = updatedList[i];
      if (item.linked) continue;

      const targetText = item.matchedText || item.conceptTitle;
      const escaped = targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<!\\[\\[)(?<![\\p{L}\\p{N}])(${escaped})(?![\\p{L}\\p{N}])(?!\\]\\])`, 'giu');

      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, `[[${item.conceptTitle}]]`);
        updatedList[i] = { ...item, linked: true };
      }
    }

    onUpdateNote({
      ...currentNote,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });

    setUnlinkedReferences(updatedList);
  };

  // 4. Generate Flashcards
  const handleGenerateCards = async () => {
    if (!currentNote) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: currentNote.title, content: currentNote.content, language: lang }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedCards(data.flashcards || []);
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل توليد بطاقات الاسترجاع' : 'Failed to generate flashcards'));
    } finally {
      setLoading(false);
    }
  };

  // 5. Generate Mindmap
  const handleGenerateMindmap = async () => {
    if (!currentNote) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: currentNote.title, content: currentNote.content, language: lang }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMindmapData(data.root);
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل إنشاء الخريطة الذهنية' : 'Failed to generate mindmap'));
    } finally {
      setLoading(false);
    }
  };

  // Quick action: Link a suggested note into current note
  const handleAddLinkToNote = (targetTitle: string) => {
    if (!currentNote) return;
    const newContent = `${currentNote.content}\n\n- ${lang === 'ar' ? 'مرتبط بـ' : 'Connected to'} [[${targetTitle}]]`;
    onUpdateNote({
      ...currentNote,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });
    // Remove from suggestions
    setSuggestedLinks((prev) => prev.filter((s) => s.noteTitle !== targetTitle));
  };

  // Save all flashcards to deck
  const handleSaveAllCards = () => {
    if (!currentNote || generatedCards.length === 0) return;
    const newItems = generatedCards.map((c) => ({
      noteId: currentNote.id,
      noteTitle: currentNote.title,
      question: c.question,
      answer: c.answer,
      interval: 1,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
    }));
    onAddFlashcards(newItems);
    setGeneratedCards((prev) => prev.map((c) => ({ ...c, saved: true })));
  };

  const presetQuestions = lang === 'ar' ? [
    'لخّص كيف ترتبط النماذج الذهنية بهندسة الأنظمة البرمجية',
    'كيف يساعد أسلوب تسيتلكاستن (Zettelkasten) في تقليل الحمل الإدراكي؟',
    'اشرح المقايضات بين الاتساق والتوافر (نظرية CAP)',
    'ما هي المفاهيم في هذه الخزانة الأكثر ارتباطاً بحلقات التغذية الراجعة؟',
  ] : [
    'Synthesize how mental models connect to software architecture',
    'How does Zettelkasten prevent cognitive overload?',
    'Explain the trade-offs between consistency and availability',
    'What ideas in this vault are most closely related to feedback loops?',
  ];

  return (
    <div
      id="ai-assistant-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="ai-assistant-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 tracking-tight">{t.aiModalTitle}</h2>
              <p className="text-xs text-stone-500">
                {currentNote ? `${lang === 'ar' ? 'السياق' : 'Context'}: ${currentNote.title}` : (lang === 'ar' ? 'متصل عبر كامل خزانة المعرفة' : 'Connected across full knowledge vault')}
              </p>
            </div>
          </div>

          <button
            id="ai-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ask')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ask'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{t.askTab}</span>
          </button>

          {currentNote && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('summarize')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'summarize'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t.summarizeTab}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('suggest-links')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'suggest-links'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>{t.suggestLinksTab}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('unlinked-references')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'unlinked-references'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>{t.unlinkedReferencesTab}</span>
                {unlinkedReferences.filter((u) => !u.linked).length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700">
                    {unlinkedReferences.filter((u) => !u.linked).length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('flashcards')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'flashcards'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.flashcardsTab}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mindmap')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'mindmap'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.mindmapTab}</span>
              </button>
            </>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/40">
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
              {error}
            </div>
          )}

          {/* TAB 1: ASK VAULT */}
          {activeTab === 'ask' && (
            <div className="space-y-6">
              {/* Preset Discovery Chips */}
              <div>
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  {lang === 'ar' ? 'استكشف التوليف المعرفي' : 'EXPLORE KNOWLEDGE SYNTHESIS'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setQuestion(preset);
                        handleAskVault(preset);
                      }}
                      className="text-xs px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-indigo-300 hover:text-indigo-600 text-stone-700 font-medium transition-all text-start shadow-2xs cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskVault();
                }}
                className="flex items-center gap-2 bg-white rounded-xl border border-stone-200 p-2 shadow-xs"
              >
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t.askPlaceholder}
                  className="flex-1 text-xs text-stone-800 border-0 focus:ring-0 focus:outline-hidden px-2"
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{t.synthesize}</span>
                </button>
              </form>

              {/* Answers Stream */}
              <div className="space-y-4">
                {qaHistory.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs space-y-3">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-600" />
                      <span>{item.query}</span>
                    </div>

                    <div className="text-xs text-stone-700 leading-relaxed prose prose-stone max-w-none">
                      <ReactMarkdown>{item.answer}</ReactMarkdown>
                    </div>

                    {item.citedNotes.length > 0 && (
                      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-stone-400">{t.referencedNotes}</span>
                        {item.citedNotes.map((title) => (
                          <button
                            key={title}
                            type="button"
                            onClick={() => {
                              onNavigateToNote(title);
                              onClose();
                            }}
                            className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-medium transition-colors cursor-pointer"
                          >
                            🔗 {title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTIVE SUMMARY */}
          {activeTab === 'summarize' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-stone-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">{t.synthesizingSummary}</span>
                </div>
              ) : summaryData ? (
                <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-xs space-y-5">
                  <div>
                    <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                      {lang === 'ar' ? 'الملخص التنفيذي' : 'EXECUTIVE SUMMARY'}
                    </div>
                    <p className="text-sm text-stone-800 leading-relaxed font-medium">
                      {summaryData.summary}
                    </p>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                      {t.keyTakeaways}
                    </div>
                    <ul className="space-y-2">
                      {summaryData.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {summaryData.tags.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                        {t.recommendedTags}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {summaryData.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8">
                  <button
                    type="button"
                    onClick={handleSummarize}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    {t.generateSummary}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUGGEST LINKS */}
          {activeTab === 'suggest-links' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-stone-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">{t.scanningVaultBridges}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-stone-600">
                    {lang === 'ar' ? 'فحص الذكاء الاصطناعي خزانتك واكتشف هذه الروابط المفاهيمية المحتملة:' : 'The AI examined your vault and discovered these potential cross-connections:'}
                  </div>

                  {suggestedLinks.length > 0 ? (
                    suggestedLinks.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <Link className="w-3.5 h-3.5 text-indigo-600" />
                            <span>[[{suggestion.noteTitle}]]</span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">{suggestion.reason}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddLinkToNote(suggestion.noteTitle)}
                          className="shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.addLink}</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-stone-400 p-8 text-center bg-white rounded-xl border border-dashed border-stone-200">
                      {t.noMissingLinks}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3B: FIND UNLINKED REFERENCES */}
          {activeTab === 'unlinked-references' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-stone-800">
                    {t.existingConceptsInText}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {t.unlinkedDesc}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFindUnlinkedReferences}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors cursor-pointer"
                    title="Rescan active note text"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{t.rescan}</span>
                  </button>

                  {unlinkedReferences.some((u) => !u.linked) && (
                    <button
                      type="button"
                      onClick={handleLinkAllReferences}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{t.linkAll} ({unlinkedReferences.filter((u) => !u.linked).length})</span>
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-stone-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">{t.scanningUnlinked}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {unlinkedReferences.length > 0 ? (
                    unlinkedReferences.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          item.linked
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-white border-stone-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                <Link className="w-3.5 h-3.5 text-indigo-600" />
                                <span>[[{item.conceptTitle}]]</span>
                              </span>
                              {item.folder && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                                  {item.folder}
                                </span>
                              )}
                              {item.occurrencesCount > 1 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                  {item.occurrencesCount} {t.mentionsCount}
                                </span>
                              )}
                            </div>

                            {/* Context snippet */}
                            <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100 font-mono text-[11px] leading-relaxed">
                              "{item.snippet}"
                            </div>

                            <p className="text-[11px] text-stone-500">{item.reason}</p>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            {item.linked ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-lg border border-emerald-200">
                                <Check className="w-3.5 h-3.5" />
                                <span>{t.linkedState}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleLinkReferenceInNote(item.conceptTitle, item.matchedText)}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{t.linkConcept}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-stone-500 p-8 text-center bg-white rounded-xl border border-dashed border-stone-200 space-y-2">
                      <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                      <div className="font-semibold text-stone-800">{t.allMentionsLinked}</div>
                      <p className="text-stone-400 max-w-sm mx-auto">
                        {t.allMentionsLinkedDesc}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600">
                  {lang === 'ar' ? `بطاقات الاسترجاع النشط المولدة من "${currentNote?.title}"` : `Active recall cards generated from "${currentNote?.title}"`}
                </span>
                {generatedCards.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveAllCards}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.saveToReviewDeck}</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-stone-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">{t.formulatingCards}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {generatedCards.map((card, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all ${
                        card.saved
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-white border-stone-200 shadow-xs'
                      }`}
                    >
                      <div className="text-xs font-bold text-stone-900 mb-1">
                        {lang === 'ar' ? 'س:' : 'Q:'} {card.question}
                      </div>
                      <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        {lang === 'ar' ? 'ج:' : 'A:'} {card.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MINDMAP */}
          {activeTab === 'mindmap' && (
            <div>
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-stone-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">{t.extractingHierarchy}</span>
                </div>
              ) : mindmapData ? (
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-3">
                  <div className="text-sm font-bold text-indigo-700 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>{mindmapData.label}</span>
                  </div>

                  <div className="space-y-3 ps-4 border-indigo-200 border-s-2">
                    {mindmapData.children?.map((child: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <div className="text-xs font-bold text-stone-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>{child.label}</span>
                        </div>
                        {child.children?.length > 0 && (
                          <div className="ps-5 space-y-1.5 border-stone-200 border-s">
                            {child.children.map((sub: any, sIdx: number) => (
                              <div key={sIdx} className="text-xs text-stone-600 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                                <span>{sub.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <button
                    type="button"
                    onClick={handleGenerateMindmap}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    {t.generateMindmap}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
