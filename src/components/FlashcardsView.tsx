import { useState, useMemo } from 'react';
import { Flashcard, KnowledgeNote } from '../types';
import { Language, translations } from '../utils/i18n';
import { Layers, CheckCircle2, RotateCw, ArrowRight, Sparkles, BookOpen, Plus, Trash2 } from 'lucide-react';

interface FlashcardsViewProps {
  cards: Flashcard[];
  notes: KnowledgeNote[];
  onUpdateCard: (updated: Flashcard) => void;
  onAddCard: (card: Omit<Flashcard, 'id'>) => void;
  onDeleteCard: (cardId: string) => void;
  onNavigateToNote: (noteId: string) => void;
  lang?: Language;
}

export default function FlashcardsView({
  cards,
  notes,
  onUpdateCard,
  onAddCard,
  onDeleteCard,
  onNavigateToNote,
  lang = 'ar',
}: FlashcardsViewProps) {
  const t = translations[lang] || translations.en;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'due'>('all');

  // Filter cards due or all
  const filteredCards = useMemo(() => {
    const now = new Date().toISOString();
    if (reviewFilter === 'due') {
      return cards.filter((c) => !c.dueDate || c.dueDate <= now);
    }
    return cards;
  }, [cards, reviewFilter]);

  const currentCard = filteredCards[currentIndex];

  // Grade Card with SM-2 spaced repetition
  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    let { interval, repetition, easeFactor } = currentCard;

    if (rating === 'again') {
      repetition = 0;
      interval = 1;
    } else {
      if (rating === 'hard') {
        interval = Math.max(1, Math.round(interval * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.15);
      } else if (rating === 'good') {
        if (repetition === 0) interval = 1;
        else if (repetition === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);
        repetition += 1;
      } else if (rating === 'easy') {
        if (repetition === 0) interval = 4;
        else interval = Math.round(interval * easeFactor * 1.3);
        repetition += 1;
        easeFactor += 0.15;
      }
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + interval);

    onUpdateCard({
      ...currentCard,
      interval,
      repetition,
      easeFactor,
      dueDate: nextDueDate.toISOString(),
      lastReviewed: new Date().toISOString(),
    });

    setIsFlipped(false);

    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  const dueCount = cards.filter((c) => !c.dueDate || c.dueDate <= new Date().toISOString()).length;

  return (
    <div id="flashcards-container" className="h-full flex flex-col bg-stone-50/50 overflow-y-auto p-6 md:p-10">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">{t.flashcardsTitle}</h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {t.flashcardsSubtitle}
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center bg-white border border-stone-200 p-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setReviewFilter('all');
                handleRestart();
              }}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                reviewFilter === 'all' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t.allCards} ({cards.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setReviewFilter('due');
                handleRestart();
              }}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                reviewFilter === 'due' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t.dueForReview} ({dueCount})
            </button>
          </div>
        </div>

        {/* Card Arena */}
        {filteredCards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-stone-900 mb-1">{t.deckUpToDate}</h3>
            <p className="text-xs text-stone-500 max-w-sm mb-6">
              {t.noCardsDue}
            </p>
            <button
              type="button"
              onClick={() => setReviewFilter('all')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {t.reviewAllAnyway}
            </button>
          </div>
        ) : sessionCompleted ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
            <Sparkles className="w-12 h-12 text-indigo-600 mb-3" />
            <h3 className="text-lg font-bold text-stone-900 mb-1">{t.sessionCompletedTitle}</h3>
            <p className="text-xs text-stone-500 max-w-sm mb-6">
              {t.sessionCompletedDesc}
            </p>
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{t.studyAgain}</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            {/* Progress counter */}
            <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
              <span>
                {t.card} {currentIndex + 1} {t.of} {filteredCards.length}
              </span>
              <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Flip Card */}
            <div
              id="active-flashcard"
              onClick={() => setIsFlipped((prev) => !prev)}
              className="relative min-h-[320px] md:min-h-[380px] bg-white rounded-2xl border border-stone-200 p-8 shadow-xs cursor-pointer hover:border-indigo-300 transition-all flex flex-col justify-between select-none"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {isFlipped ? t.answer : t.question}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToNote(currentCard.noteId);
                    }}
                    className="text-xs text-stone-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>{t.source}: {currentCard.noteTitle}</span>
                  </button>
                </div>

                <div className="text-[11px] text-stone-400">
                  {t.clickToFlip}
                </div>
              </div>

              {/* Card Center Content */}
              <div className="my-auto py-6">
                {!isFlipped ? (
                  <div className="text-lg md:text-xl font-semibold text-stone-900 leading-snug">
                    {currentCard.question}
                  </div>
                ) : (
                  <div className="text-base md:text-lg text-stone-800 leading-relaxed bg-stone-50/70 p-5 rounded-xl border border-stone-200/80">
                    {currentCard.answer}
                  </div>
                )}
              </div>

              {/* Card Footer Hint */}
              <div className="flex items-center justify-between text-xs text-stone-400 pt-4 border-t border-stone-100">
                <span>{t.repetitions}: {currentCard.repetition}</span>
                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                  <span>{isFlipped ? (lang === 'ar' ? 'انقر لإظهار السؤال' : 'Click to show question') : (lang === 'ar' ? 'انقر لكشف الإجابة' : 'Click to reveal answer')}</span>
                  <RotateCw className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Action Grading Bar (shown when flipped) */}
            <div className="mt-6">
              {isFlipped ? (
                <div className="space-y-2">
                  <div className="text-center text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    {t.gradeRetrievalDifficulty}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRate('again')}
                      className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span>{t.again}</span>
                      <span className="text-[10px] text-red-500 font-normal">{lang === 'ar' ? '< يوم' : '< 1 day'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate('hard')}
                      className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span>{t.hard}</span>
                      <span className="text-[10px] text-amber-500 font-normal">{lang === 'ar' ? 'يومان' : '2 days'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate('good')}
                      className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span>{t.good}</span>
                      <span className="text-[10px] text-emerald-600 font-normal">{lang === 'ar' ? '4-6 أيام' : '4-6 days'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate('easy')}
                      className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span>{t.easy}</span>
                      <span className="text-[10px] text-blue-500 font-normal">{lang === 'ar' ? '10+ أيام' : '10+ days'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {t.showAnswer}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
