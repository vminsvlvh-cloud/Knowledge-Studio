import { KnowledgeNote } from '../types';
import { calculateVaultStats, STATUS_META } from '../utils/wikiLinks';
import { Language, translations } from '../utils/i18n';
import { Activity, X, Share2, AlertCircle, Download, Upload, RotateCcw, Check, Sparkles } from 'lucide-react';

interface VaultHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: KnowledgeNote[];
  onSelectNote: (noteId: string) => void;
  onExportVault: () => void;
  onExportMarkdown: () => void;
  onImportVault: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSampleVault: () => void;
  onLoadArabicVault?: () => void;
  lang?: Language;
}

export default function VaultHealthModal({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onExportVault,
  onExportMarkdown,
  onImportVault,
  onResetSampleVault,
  onLoadArabicVault,
  lang = 'ar',
}: VaultHealthModalProps) {
  if (!isOpen) return null;

  const t = translations[lang] || translations.en;
  const stats = calculateVaultStats(notes);

  return (
    <div
      id="vault-health-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="vault-health-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 tracking-tight">{t.vaultHealthTitle}</h2>
              <p className="text-xs text-stone-500">{t.vaultHealthSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-400 uppercase">{t.totalNotes}</div>
              <div className="text-xl font-bold text-stone-900 mt-1">{stats.totalNotes}</div>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-400 uppercase">{t.connections}</div>
              <div className="text-xl font-bold text-stone-900 mt-1">{stats.totalLinks}</div>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-400 uppercase">{t.linkDensity}</div>
              <div className="text-xl font-bold text-indigo-600 mt-1">{stats.linkDensity}</div>
              <div className="text-[10px] text-stone-400">{t.linksPerNoteAvg}</div>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-400 uppercase">{t.uniqueTags}</div>
              <div className="text-xl font-bold text-stone-900 mt-1">{stats.totalTags}</div>
            </div>
          </div>

          {/* Growth Lifecycle Distribution */}
          <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              {t.gardenStages}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-800">
                  <span>🌱</span>
                  <span>{t.seed}</span>
                </div>
                <div className="text-base font-bold text-emerald-900 mt-1">{stats.statusCounts.seed || 0}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/60">
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                  <span>🌿</span>
                  <span>{t.growing}</span>
                </div>
                <div className="text-base font-bold text-amber-900 mt-1">{stats.statusCounts.growing || 0}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200/60">
                <div className="flex items-center gap-1 text-xs font-semibold text-indigo-800">
                  <span>🌲</span>
                  <span>{t.evergreen}</span>
                </div>
                <div className="text-base font-bold text-indigo-900 mt-1">{stats.statusCounts.evergreen || 0}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-200">
                <div className="flex items-center gap-1 text-xs font-semibold text-stone-700">
                  <span>📦</span>
                  <span>{t.archived}</span>
                </div>
                <div className="text-base font-bold text-stone-800 mt-1">{stats.statusCounts.archived || 0}</div>
              </div>
            </div>
          </div>

          {/* Hub Notes vs Orphan Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Hub Notes */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2.5">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.centralHubs}</span>
              </h3>
              <div className="space-y-1.5">
                {stats.hubNotes.map((hub) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => {
                      onSelectNote(hub.id);
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-start text-xs hover:bg-indigo-50/60 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <span className="font-semibold text-stone-800 group-hover:text-indigo-600 truncate">
                      {hub.title}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {hub.linkCount} {lang === 'ar' ? 'روابط' : 'links'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Orphan Notes */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2.5">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {t.orphanNotes} ({stats.orphanedNotes.length})
                </span>
              </h3>
              {stats.orphanedNotes.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {stats.orphanedNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => {
                        onSelectNote(note.id);
                        onClose();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-start text-xs hover:bg-amber-50 text-stone-700 truncate cursor-pointer transition-colors"
                    >
                      {note.title}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-stone-400 p-3 bg-stone-50 rounded-lg text-center">
                  {t.zeroOrphans}
                </div>
              )}
            </div>
          </div>

          {/* Backup, Export & Restore Section */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              {t.dataManagement}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportVault}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.exportVaultJson}</span>
              </button>

              <button
                type="button"
                onClick={onExportMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.exportNotesMd}</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.importBackup}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportVault}
                  className="hidden"
                />
              </label>

              {onLoadArabicVault && (
                <button
                  type="button"
                  onClick={onLoadArabicVault}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.loadArabicKnowledge}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onResetSampleVault}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>{t.resetSeedVault}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
