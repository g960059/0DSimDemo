import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Download, FileUp, Info, Link2, Palette, Settings, Share2, X } from 'lucide-react';
import { lessonHref } from '@/homeLinks';
import { localeFromPathname } from '@/localeRouting';

export type WorkbenchHeaderMode = 'learner' | 'author' | 'sandbox';
export type WorkbenchThemeId = 'midnight' | 'graphite' | 'clinical' | 'light';

export interface WorkbenchSceneMeta {
  title: string;
  description: string;
  modelLimitations: string[];
}

export const WORKBENCH_THEME_OPTIONS: Array<{ id: WorkbenchThemeId; label: string; swatch: string }> = [
  { id: 'midnight', label: 'Midnight', swatch: '#2563eb' },
  { id: 'graphite', label: 'Graphite', swatch: '#14b8a6' },
  { id: 'clinical', label: 'Clinical', swatch: '#22c55e' },
  { id: 'light', label: 'Light', swatch: '#0284c7' },
];

interface WorkbenchSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: WorkbenchHeaderMode;
  sceneMeta: WorkbenchSceneMeta;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportFile: (file: File) => void;
  onExport: () => void;
  onCreateLesson: () => void;
  onSaveLesson: () => void;
  onExitAuthoring: () => void;
  authoringMode: boolean;
  savedLesson: { id: string; title: string } | null;
  publishedLesson: { id: string; title: string; url: string } | null;
  copyShareUrl: () => void;
  theme: WorkbenchThemeId;
  onThemeChange: (theme: WorkbenchThemeId) => void;
}

type TabId = 'share' | 'files' | 'details' | 'settings';

export function WorkbenchSidePanel({
  isOpen,
  onClose,
  mode,
  sceneMeta,
  fileInputRef,
  onImportFile,
  onExport,
  onCreateLesson,
  onSaveLesson,
  onExitAuthoring,
  authoringMode,
  savedLesson,
  publishedLesson,
  copyShareUrl,
  theme,
  onThemeChange,
}: WorkbenchSidePanelProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const tabs = useMemo(() => {
    const available: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
      { id: 'details', label: t('workbench.sidePanel.tabs.details'), icon: <Info className="h-4 w-4" /> },
      { id: 'settings', label: t('workbench.sidePanel.tabs.settings'), icon: <Settings className="h-4 w-4" /> },
    ];
    if (mode !== 'learner') {
      available.push(
        { id: 'files', label: t('workbench.sidePanel.tabs.files'), icon: <Download className="h-4 w-4" /> },
      );
    }
    if (mode !== 'learner' || publishedLesson || savedLesson) {
      available.unshift({ id: 'share', label: t('workbench.sidePanel.tabs.share'), icon: <Share2 className="h-4 w-4" /> });
    }
    return available;
  }, [mode, publishedLesson, savedLesson, t]);
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? 'details');
  const currentTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id ?? 'details';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside
        className="workbench-side-panel absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-wb-line bg-wb-panel shadow-2xl"
        aria-label={t('workbench.sidePanel.aria')}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-wb-line px-4">
          <div>
            <div className="text-sm font-bold text-wb-text">{t('nav.workbench')}</div>
            <div className="text-[11px] text-wb-subtle">{mode === 'learner' ? t('workbench.sidePanel.learningScene') : mode === 'author' ? t('workbench.sidePanel.authorWorkspace') : t('workbench.sidePanel.sandboxScene')}</div>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent" aria-label={t('workbench.sidePanel.closePanel')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-wb-line px-3 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent ${
                currentTab === tab.id ? 'bg-wb-active text-wb-text' : 'text-wb-subtle hover:bg-wb-hover hover:text-wb-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
          {currentTab === 'share' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-wb-text">{t('workbench.sidePanel.share.title')}</h2>
                <p className="mt-1 text-xs leading-5 text-wb-muted">{t('workbench.sidePanel.share.description')}</p>
              </div>
              {publishedLesson ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <a href={publishedLesson.url} className="block truncate text-sm font-bold text-emerald-100 hover:text-emerald-50">
                    {publishedLesson.url}
                  </a>
                  <button onClick={copyShareUrl} className="mt-3 inline-flex items-center gap-2 rounded bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">
                    <Link2 className="h-3.5 w-3.5" />
                    {t('workbench.sidePanel.share.copyLink')}
                  </button>
                </div>
              ) : savedLesson ? (
                <a href={lessonHref(savedLesson.id, locale)} className="inline-flex rounded bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-500/25">
                  {t('workbench.sidePanel.share.openSavedLesson')}
                </a>
              ) : (
                <div className="rounded-md border border-wb-line bg-wb-strip p-3 text-sm text-wb-muted">
                  {t('workbench.sidePanel.share.noLink')}
                </div>
              )}
            </div>
          )}

          {currentTab === 'files' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-wb-text">{t('workbench.sidePanel.files.title')}</h2>
                <p className="mt-1 text-xs leading-5 text-wb-muted">{t('workbench.sidePanel.files.description')}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.circleheart.json,application/json"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) onImportFile(file); e.target.value = ''; }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onExport} className="inline-flex items-center justify-center gap-2 rounded-md border border-wb-line bg-wb-panel px-3 py-2 text-sm font-bold text-wb-text hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">
                  <Download className="h-4 w-4" />
                  {t('workbench.sidePanel.files.export')}
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-md border border-wb-line bg-wb-panel px-3 py-2 text-sm font-bold text-wb-text hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">
                  <FileUp className="h-4 w-4" />
                  {t('workbench.sidePanel.files.load')}
                </button>
              </div>
            </div>
          )}

          {currentTab === 'details' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-wb-text">{sceneMeta.title}</h2>
                <p className="mt-1 text-xs leading-5 text-wb-muted">{sceneMeta.description || t('workbench.sidePanel.details.noDescription')}</p>
              </div>
              <div>
                <h3 className="text-[11px] font-medium text-wb-subtle">{t('modelLimitations.titleShort')}</h3>
                <ul className="mt-2 space-y-2 text-sm text-wb-muted">
                  {sceneMeta.modelLimitations.map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-wb-subtle">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {currentTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-wb-text">{t('workbench.sidePanel.settings.title')}</h2>
                <p className="mt-1 text-xs leading-5 text-wb-muted">{t('workbench.sidePanel.settings.description')}</p>
              </div>
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-medium text-wb-subtle">
                  <Palette className="h-3.5 w-3.5" />
                  {t('workbench.sidePanel.settings.appearance')}
                </div>
                <div>
                  <div className="mb-2 text-xs font-bold text-wb-muted">{t('workbench.sidePanel.settings.theme')}</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {WORKBENCH_THEME_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onThemeChange(option.id)}
                        className={`flex min-w-0 items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent ${
                          theme === option.id
                            ? 'border-wb-line bg-wb-active text-wb-text'
                            : 'border-wb-line bg-wb-panel text-wb-muted hover:bg-wb-hover'
                        }`}
                        aria-pressed={theme === option.id}
                      >
                        <span className="h-3 w-3 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: option.swatch }} />
                        <span className="truncate">{t(`workbench.sidePanel.themes.${option.id}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
              {mode !== 'learner' && (authoringMode ? (
                <>
                  <button onClick={onSaveLesson} className="w-full rounded-md border border-wb-line bg-wb-primary px-3 py-2 text-left text-sm font-bold text-white hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">
                    {t('workbench.sidePanel.settings.saveAsLesson')}
                  </button>
                  <button onClick={onExitAuthoring} className="w-full rounded-md border border-wb-line bg-wb-panel px-3 py-2 text-left text-sm font-bold text-wb-text hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">
                    {t('workbench.sidePanel.settings.exitAuthoring')}
                  </button>
                </>
              ) : (
                <button onClick={onCreateLesson} className="w-full rounded-md border border-wb-line bg-wb-panel px-3 py-2 text-left text-sm font-bold text-wb-text hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">
                  {t('workbench.sidePanel.settings.createLesson')}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
