import { useState, useMemo } from 'react';
import { KnowledgeNote } from '../types';
import { calculateVaultStats, STATUS_META } from '../utils/wikiLinks';
import { translations } from '../utils/i18n';
import {
  Activity,
  ChevronUp,
  ChevronDown,
  X,
  Crosshair,
  ExternalLink,
  Share2,
  CheckCircle2,
  AlertCircle,
  Link2,
  Sparkles,
  Tag,
  GitFork,
  SlidersHorizontal,
} from 'lucide-react';

interface GraphStatsOverlayProps {
  notes: KnowledgeNote[];
  tags: [string, number][];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  layoutStyle: 'force' | 'hierarchical';
  onToggleLayoutStyle: (style: 'force' | 'hierarchical') => void;
  visibleNodesCount: number;
  visibleEdgesCount: number;
  isFiltered: boolean;
  activeFilterLabel?: string;
  lang?: 'en' | 'ar';
  onFocusNode: (noteId: string) => void;
  onSelectNote: (noteId: string) => void;
  onHoverHub: (noteId: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function GraphStatsOverlay({
  notes,
  tags,
  selectedTag,
  onSelectTag,
  layoutStyle,
  onToggleLayoutStyle,
  visibleNodesCount,
  visibleEdgesCount,
  isFiltered,
  activeFilterLabel,
  lang = 'en',
  onFocusNode,
  onSelectNote,
  onHoverHub,
  isOpen,
  onClose,
}: GraphStatsOverlayProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = translations[lang] || translations.en;

  // Compute live vault stats
  const stats = useMemo(() => {
    return calculateVaultStats(notes);
  }, [notes]);

  // Compute visible graph density if filtered
  const visibleDensity = useMemo(() => {
    if (visibleNodesCount === 0) return 0;
    return Number((visibleEdgesCount / visibleNodesCount).toFixed(2));
  }, [visibleNodesCount, visibleEdgesCount]);

  if (!isOpen) return null;

  return (
    <div
      id="graph-realtime-stats-overlay"
      className="absolute top-16 start-4 z-20 w-80 sm:w-88 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-stone-200/90 text-stone-800 transition-all duration-200 overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 bg-stone-50/80 border-b border-stone-200/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200/70 flex items-center justify-center shrink-0">
            <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-stone-900 truncate tracking-tight">
                {t.graphStatsTitle}
              </h3>
              {/* Live indicator badge */}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[9px] font-bold text-emerald-700 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {t.liveUpdates}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 truncate">
              {isFiltered && activeFilterLabel
                ? `${activeFilterLabel} (${visibleNodesCount}/${stats.totalNotes})`
                : t.graphStatsSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            id="graph-stats-collapse-btn"
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
            title={isCollapsed ? t.expandStats : t.collapseStats}
            aria-label={isCollapsed ? t.expandStats : t.collapseStats}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            id="graph-stats-close-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
            title={t.close || 'Close'}
            aria-label="Close statistics overlay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsed Pill View */}
      {isCollapsed ? (
        <div className="p-3 flex items-center justify-between text-xs font-medium text-stone-600 bg-white gap-2">
          <div className="flex items-center gap-2 truncate">
            <span>
              <strong className="text-stone-900 font-bold">{stats.totalNotes}</strong> {t.totalNotes}
            </span>
            <span>·</span>
            <span className="hidden sm:inline">
              <strong className="text-indigo-600 font-bold">{stats.linkDensity}</strong> {t.linksPerNoteAvg}
            </span>
            {selectedTag !== 'all' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 font-medium truncate max-w-[80px]">
                #{selectedTag}
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              {layoutStyle === 'force' ? '🌱 Organic' : '🌲 Tree'}
            </span>
          </div>
          {stats.hubNotes.length > 0 && (
            <button
              type="button"
              onClick={() => onFocusNode(stats.hubNotes[0].id)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold truncate max-w-[100px] cursor-pointer flex items-center gap-1 shrink-0"
              title={stats.hubNotes[0].title}
            >
              <span>👑</span>
              <span className="truncate">{stats.hubNotes[0].title}</span>
            </button>
          )}
        </div>
      ) : (
        /* Expanded Full Analytics Dashboard */
        <div className="p-3.5 space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Controls Section: Tag Filter & Layout Style Toggle */}
          <div className="space-y-2 bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/70">
            {/* Tag Filter Dropdown */}
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="overlay-tag-filter-select" className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 shrink-0 cursor-pointer">
                <Tag className="w-3.5 h-3.5 text-pink-500" />
                <span>{t.tagFilter}</span>
              </label>

              <select
                id="overlay-tag-filter-select"
                value={selectedTag}
                onChange={(e) => onSelectTag(e.target.value)}
                aria-label={t.tagFilter}
                className="bg-white border border-stone-200/90 rounded-lg text-xs font-medium text-stone-800 py-1 px-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer max-w-[160px] truncate shadow-2xs"
              >
                <option value="all">
                  {t.allTags} ({notes.length})
                </option>
                {tags.map(([tagName, count]) => (
                  <option key={tagName} value={tagName}>
                    #{tagName} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Layout Style Toggle: Organic (Force-directed) vs Hierarchical */}
            <div className="space-y-1 pt-1 border-t border-stone-200/60">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                <span className="flex items-center gap-1.5 text-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.layoutStyle}</span>
                </span>
                <span className="text-[10px] text-stone-500 font-normal">
                  {layoutStyle === 'force' ? t.organicDesc : t.hierarchicalDesc}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 p-0.5 bg-stone-200/70 rounded-lg">
                <button
                  type="button"
                  id="layout-toggle-force-btn"
                  onClick={() => onToggleLayoutStyle('force')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    layoutStyle === 'force'
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title={t.organicDesc}
                >
                  <Sparkles className={`w-3 h-3 ${layoutStyle === 'force' ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <span>{t.layoutForce}</span>
                </button>

                <button
                  type="button"
                  id="layout-toggle-hierarchical-btn"
                  onClick={() => onToggleLayoutStyle('hierarchical')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    layoutStyle === 'hierarchical'
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title={t.hierarchicalDesc}
                >
                  <GitFork className={`w-3 h-3 ${layoutStyle === 'hierarchical' ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <span>{t.layoutHierarchical}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics 3-Card Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Total Notes */}
            <div className="p-2.5 bg-stone-50/80 rounded-xl border border-stone-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                {t.totalNoteCount}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold text-stone-900">{stats.totalNotes}</span>
                {isFiltered && (
                  <span className="text-[10px] text-indigo-600 font-medium">
                    ({visibleNodesCount} {lang === 'ar' ? 'معروض' : 'vis'})
                  </span>
                )}
              </div>
              <span className="text-[9px] text-stone-400 mt-0.5">
                {stats.statusCounts.evergreen || 0} {lang === 'ar' ? 'مكتمل' : 'evergreen'}
              </span>
            </div>

            {/* 2. Average Links / Node (Density) */}
            <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-200/60 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider">
                {t.avgLinksPerNode}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold text-indigo-700">
                  {isFiltered ? visibleDensity : stats.linkDensity}
                </span>
                <span className="text-[10px] text-indigo-600/70 font-semibold">/ {lang === 'ar' ? 'ملاحظة' : 'note'}</span>
              </div>
              <span className="text-[9px] text-indigo-600/80 mt-0.5 font-medium">
                {stats.linkDensity >= 2 ? t.healthyDensity : `${stats.totalLinks} ${t.totalConnections}`}
              </span>
            </div>

            {/* 3. Total Connections / Network Edges */}
            <div className="p-2.5 bg-stone-50/80 rounded-xl border border-stone-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                {t.totalConnections}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold text-stone-900">
                  {isFiltered ? visibleEdgesCount : stats.totalLinks}
                </span>
                <Link2 className="w-3 h-3 text-stone-400 ms-auto" />
              </div>
              <span className="text-[9px] text-stone-400 mt-0.5">
                {stats.orphanedNotes.length === 0 ? (
                  <span className="text-emerald-600 font-medium inline-flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> 0 {lang === 'ar' ? 'معزول' : 'orphans'}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium inline-flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" /> {stats.orphanedNotes.length} {lang === 'ar' ? 'معزول' : 'orphans'}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Growth Lifecycle Mini Progress Bar */}
          <div className="p-2.5 bg-stone-50/70 rounded-xl border border-stone-200/60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700 mb-1.5">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                {t.gardenStages}
              </span>
              <span className="text-[10px] text-stone-400">
                {stats.totalNotes} {t.notesCount}
              </span>
            </div>
            {/* Visual ratio bar */}
            <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden flex">
              <div
                style={{ width: `${stats.totalNotes > 0 ? ((stats.statusCounts.evergreen || 0) / stats.totalNotes) * 100 : 0}%` }}
                className="h-full bg-indigo-500 transition-all duration-300"
                title={`${stats.statusCounts.evergreen || 0} Evergreen`}
              />
              <div
                style={{ width: `${stats.totalNotes > 0 ? ((stats.statusCounts.growing || 0) / stats.totalNotes) * 100 : 0}%` }}
                className="h-full bg-amber-400 transition-all duration-300"
                title={`${stats.statusCounts.growing || 0} Growing`}
              />
              <div
                style={{ width: `${stats.totalNotes > 0 ? ((stats.statusCounts.seed || 0) / stats.totalNotes) * 100 : 0}%` }}
                className="h-full bg-emerald-400 transition-all duration-300"
                title={`${stats.statusCounts.seed || 0} Seed`}
              />
            </div>
            {/* Legend pills */}
            <div className="flex items-center justify-between gap-1 text-[10px] font-medium text-stone-600 mt-2">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{stats.statusCounts.seed || 0} {t.seed}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{stats.statusCounts.growing || 0} {t.growing}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>{stats.statusCounts.evergreen || 0} {t.evergreen}</span>
              </span>
            </div>
          </div>

          {/* Core Feature: Most Connected 'Hub' Concepts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                  {t.topHubConcepts}
                </h4>
              </div>
              <span className="text-[10px] text-stone-400 font-medium">
                {stats.hubNotes.length} {lang === 'ar' ? 'محاور رئيسية' : 'central hubs'}
              </span>
            </div>

            {stats.hubNotes.length === 0 ? (
              <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-400">
                {t.noHubsFound}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {stats.hubNotes.slice(0, 5).map((hub, index) => {
                  const noteObj = notes.find((n) => n.id === hub.id);
                  const statusIcon = noteObj?.status ? STATUS_META[noteObj.status]?.icon : '📝';

                  return (
                    <div
                      key={hub.id}
                      onMouseEnter={() => onHoverHub(hub.id)}
                      onMouseLeave={() => onHoverHub(null)}
                      className="group flex items-center justify-between gap-2 p-2 rounded-xl bg-stone-50/70 hover:bg-indigo-50/70 border border-stone-200/60 hover:border-indigo-200/80 transition-all duration-150"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Rank Badge */}
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          index === 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                            : index === 1
                            ? 'bg-stone-200 text-stone-700'
                            : 'bg-stone-100 text-stone-500'
                        }`}>
                          {index === 0 ? '👑' : `#${index + 1}`}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{statusIcon}</span>
                            <span
                              onClick={() => onFocusNode(hub.id)}
                              className="text-xs font-semibold text-stone-800 group-hover:text-indigo-700 truncate cursor-pointer hover:underline"
                              title={hub.title}
                            >
                              {hub.title}
                            </span>
                          </div>
                          {noteObj?.folder && (
                            <span className="text-[10px] text-stone-400 truncate block">
                              {noteObj.folder}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Link Count Badge & Interactive Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-stone-700 border border-stone-200 text-[10px] font-bold group-hover:border-indigo-200 group-hover:text-indigo-700">
                          <Link2 className="w-2.5 h-2.5 text-indigo-500" />
                          <span>{hub.linkCount}</span>
                        </span>

                        {/* Focus in Graph Button */}
                        <button
                          type="button"
                          onClick={() => onFocusNode(hub.id)}
                          className="p-1 rounded-md text-stone-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
                          title={t.focusInGraph}
                          aria-label={`${t.focusInGraph}: ${hub.title}`}
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                        </button>

                        {/* Open Note in Editor Button */}
                        <button
                          type="button"
                          onClick={() => onSelectNote(hub.id)}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-white transition-colors cursor-pointer"
                          title={t.openNoteDoc}
                          aria-label={`${t.openNoteDoc}: ${hub.title}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
