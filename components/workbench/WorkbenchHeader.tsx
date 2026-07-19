import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Edit3,
  MoreHorizontal,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Pause,
  Play,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import { SimInstance } from '../../types';
import { SimulationHealth } from '../../engine/protocol';
import { HealthBadge, MorphologyBadge } from '../HealthIndicators';
import { ModelLimitations } from '../ModelLimitations';
import type { MorphologyCheckSummary } from '../../engine/verification/morphologyCheck';
import { WorkbenchHeaderMode, WorkbenchSceneMeta, WorkbenchSidePanel, type WorkbenchThemeId } from './WorkbenchSidePanel';
import type { MetricsSpanMode } from './PanelGrid';
import { ReadExploreSwitcher } from './ReadExploreSwitcher';
import type { ReadExploreMode } from '../../features/workbench/readExplore';
import { PublishStatusBadge } from './PublishStatusBadge';
import type { CaseStatus, CaseVisibility } from '../../caseDoc';

interface WorkbenchHeaderProps {
  mode: WorkbenchHeaderMode;
  backHref: string;
  backLabel: string;
  sceneMeta: WorkbenchSceneMeta;
  onSceneMetaChange: (meta: WorkbenchSceneMeta) => void;
  onPrimaryAction: () => void | Promise<void>;
  onResetToAuthorState?: () => void;
  instances: SimInstance[];
  instanceHealth: Record<string, SimulationHealth>;
  instanceMorphology?: Record<string, MorphologyCheckSummary>;
  getLiveHealth: (id: string) => SimulationHealth | undefined;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportFile: (file: File) => void;
  onExport: () => void;
  isSavingCase?: boolean;
  primaryActionDisabled?: boolean;
  primaryActionUnavailableReason?: string;
  fileActionsDisabled?: boolean;
  fileActionsUnavailableReason?: string;
  isPlaying: boolean;
  togglePlay: () => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  noteOpen: boolean;
  metricsOpen: boolean;
  rightRailVisible: boolean;
  metricsSpan: MetricsSpanMode;
  hasNotePanel: boolean;
  onToggleNote: () => void;
  onToggleMetrics: () => void;
  onToggleRightRail: () => void;
  onMetricsSpanChange: (span: MetricsSpanMode) => void;
  theme: WorkbenchThemeId;
  onThemeChange: (theme: WorkbenchThemeId) => void;
  showReadExploreSwitcher?: boolean;
  readExploreMode?: ReadExploreMode;
  onReadExploreModeChange?: (mode: ReadExploreMode) => void;
  publishStatus?: CaseStatus;
  publishVisibility?: CaseVisibility;
  onOpenPublishDialog?: () => void;
  settingsContent?: React.ReactNode;
}

const SPEEDS = [0.5, 1, 2, 5];

function speedLabel(value: number) {
  return `${value}x`;
}

export function WorkbenchHeader({
  mode,
  backHref,
  backLabel,
  sceneMeta,
  onSceneMetaChange,
  onPrimaryAction,
  onResetToAuthorState,
  instances,
  instanceHealth,
  instanceMorphology = {},
  getLiveHealth,
  fileInputRef,
  onImportFile,
  onExport,
  isSavingCase = false,
  primaryActionDisabled = false,
  primaryActionUnavailableReason,
  fileActionsDisabled = false,
  fileActionsUnavailableReason,
  isPlaying,
  togglePlay,
  timeScale,
  setTimeScale,
  noteOpen,
  metricsOpen,
  rightRailVisible,
  metricsSpan,
  hasNotePanel,
  onToggleNote,
  onToggleMetrics,
  onToggleRightRail,
  onMetricsSpanChange,
  theme,
  onThemeChange,
  showReadExploreSwitcher = false,
  readExploreMode,
  onReadExploreModeChange,
  publishStatus,
  publishVisibility,
  onOpenPublishDialog,
  settingsContent,
}: WorkbenchHeaderProps) {
  const { t } = useTranslation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [draftMeta, setDraftMeta] = useState(sceneMeta);

  const isLearner = mode === 'learner';
  const showNoteToggle = !isLearner || hasNotePanel;
  const primaryLabel = isLearner ? t('workbench.header.fork') : t('workbench.header.saveCase');
  const visibilityButtonClass = (pressed: boolean) => (
    `inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
      pressed
        ? 'bg-wb-active text-wb-text'
        : 'text-wb-subtle hover:bg-wb-hover hover:text-wb-muted'
    }`
  );

  const openMetaEditor = () => {
    setDraftMeta(sceneMeta);
    setIsMetaOpen(true);
  };

  const saveMeta = () => {
    onSceneMetaChange({
      title: draftMeta.title.trim() || t('workbench.header.untitledScene'),
      description: draftMeta.description.trim(),
      modelLimitations: draftMeta.modelLimitations.map((item) => item.trim()).filter(Boolean),
    });
    setIsMetaOpen(false);
  };

  return (
    <>
      <header className="workbench-header h-14 z-50 flex items-center gap-2 px-3 sm:px-4 shrink-0">
        <a href={backHref} className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-wb-muted hover:bg-wb-hover hover:text-wb-text">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </a>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isLearner ? (
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-bold text-wb-text">{sceneMeta.title}</h1>
              <span className="hidden shrink-0 rounded border border-wb-line bg-wb-strip px-2 py-0.5 text-[11px] font-semibold text-wb-subtle sm:inline">
                {t('workbench.header.readOnlyBadge')}
              </span>
              <ModelLimitations compact limitations={sceneMeta.modelLimitations} />
              {showReadExploreSwitcher && readExploreMode && onReadExploreModeChange && (
                <ReadExploreSwitcher mode={readExploreMode} onModeChange={onReadExploreModeChange} className="ml-1" />
              )}
            </div>
          ) : (
            <button onClick={openMetaEditor} className="flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-left hover:bg-wb-hover">
              <Edit3 className="h-3.5 w-3.5 shrink-0 text-wb-subtle" />
              <span className="truncate text-sm font-bold text-wb-text">{sceneMeta.title || t('workbench.header.untitledScene')}</span>
            </button>
          )}

        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <MorphologyBadge items={instances.filter(i => instanceMorphology[i.id]).map(i => ({ id: i.id, name: i.name, color: i.color, morphology: instanceMorphology[i.id] }))} />
          <HealthBadge items={instances.filter(i => instanceHealth[i.id]).map(i => ({ id: i.id, name: i.name, color: i.color, health: instanceHealth[i.id] }))} getLiveHealth={getLiveHealth} />
          {showNoteToggle && (
            <button
              type="button"
              onClick={onToggleNote}
              className={visibilityButtonClass(noteOpen)}
              title={t('workbench.header.toggleNoteDrawer')}
              aria-label={t('workbench.header.toggleNoteDrawer')}
              aria-pressed={noteOpen}
            >
              <PanelLeft className="h-4.5 w-4.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleMetrics}
            className={visibilityButtonClass(metricsOpen)}
            title={t('workbench.header.toggleMetricsHost')}
            aria-label={t('workbench.header.toggleMetricsHost')}
            aria-pressed={metricsOpen}
          >
            <PanelBottom className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={onToggleRightRail}
            className={visibilityButtonClass(rightRailVisible)}
            title={t('workbench.header.toggleRightRail')}
            aria-label={t('workbench.header.toggleRightRail')}
            aria-pressed={rightRailVisible}
          >
            <PanelRight className="h-4.5 w-4.5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLayoutOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover hover:text-wb-text"
              title={t('workbench.header.customizeLayout')}
              aria-label={t('workbench.header.customizeLayout')}
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </button>
            {isLayoutOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLayoutOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-md border border-wb-line bg-wb-panel p-2 shadow-xl">
                  <div className="mb-3 text-[11px] font-medium text-wb-subtle">{t('workbench.header.customizeLayout')}</div>
                  <div className="px-2 pb-1 text-xs font-medium text-wb-muted">{t('workbench.header.metricsSpanLabel')}</div>
                  <div className="grid gap-1">
                    {(['main', 'full'] as const).map((span) => (
                      <button
                        key={span}
                        type="button"
                        onClick={() => {
                          onMetricsSpanChange(span);
                          setIsLayoutOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded px-2 py-2 text-xs font-bold transition-colors ${
                          metricsSpan === span
                            ? 'bg-wb-active text-wb-text'
                            : 'text-wb-muted hover:bg-wb-hover hover:text-wb-text'
                        }`}
                      >
                        <span>{t(`workbench.header.metricsSpan${span === 'main' ? 'Main' : 'Full'}`)}</span>
                        {metricsSpan === span && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center rounded-md border border-wb-line bg-wb-panel">
            <button
              onClick={togglePlay}
              className="inline-flex h-9 w-9 items-center justify-center text-wb-text hover:bg-wb-hover"
              title={isPlaying ? t('workbench.header.pause') : t('workbench.header.play')}
              aria-label={isPlaying ? t('workbench.header.pause') : t('workbench.header.play')}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="relative border-l border-wb-line">
              <button onClick={() => setIsSpeedOpen((open) => !open)} className="inline-flex h-9 items-center gap-1 px-2 text-xs font-medium text-wb-muted hover:bg-wb-hover">
                {speedLabel(timeScale)}
                <ChevronDown className="h-3 w-3" />
              </button>
              {isSpeedOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSpeedOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-24 rounded-md border border-wb-line bg-wb-panel p-1 shadow-xl">
                    {SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => { setTimeScale(speed); setIsSpeedOpen(false); }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs font-medium text-wb-muted hover:bg-wb-hover"
                      >
                        {speedLabel(speed)}
                        {timeScale === speed && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {!isLearner && onOpenPublishDialog && (
            <PublishStatusBadge
              status={publishStatus}
              visibility={publishVisibility}
              onClick={onOpenPublishDialog}
            />
          )}

          {isLearner && onResetToAuthorState && (
            <button
              type="button"
              onClick={onResetToAuthorState}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-wb-line bg-transparent px-2.5 text-xs font-bold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{t('workbench.header.resetToAuthorState')}</span>
            </button>
          )}

          <button
            onClick={onPrimaryAction}
            disabled={isSavingCase || primaryActionDisabled}
            title={primaryActionDisabled ? primaryActionUnavailableReason : undefined}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md bg-wb-primary px-3 text-xs font-bold text-white hover:bg-wb-primary-hover disabled:cursor-not-allowed disabled:opacity-60 ${isLearner ? 'ml-2' : ''}`}
          >
            {isLearner ? <Copy className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isSavingCase ? t('workbench.header.saving') : primaryLabel}</span>
          </button>

          <button onClick={() => setIsPanelOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover hover:text-wb-text" aria-label={t('workbench.header.openPanel')}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      {isMetaOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-lg border border-wb-line bg-wb-panel shadow-2xl">
            <div className="border-b border-wb-line px-5 py-3">
              <h2 className="text-sm font-bold text-wb-text">{t('workbench.header.sceneDetails')}</h2>
            </div>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-wb-muted">{t('common.title')}</span>
                <input value={draftMeta.title} onChange={(e) => setDraftMeta((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded border border-wb-line bg-wb-input px-3 py-2 text-sm text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-wb-muted">{t('common.description')}</span>
                <textarea value={draftMeta.description} onChange={(e) => setDraftMeta((prev) => ({ ...prev, description: e.target.value }))} className="h-24 w-full rounded border border-wb-line bg-wb-input px-3 py-2 text-sm text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-wb-muted">{t('modelLimitations.titleShort')}</span>
                <textarea
                  value={draftMeta.modelLimitations.join('\n')}
                  onChange={(e) => setDraftMeta((prev) => ({ ...prev, modelLimitations: e.target.value.split('\n') }))}
                  className="h-28 w-full rounded border border-wb-line bg-wb-input px-3 py-2 text-sm text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-wb-line px-5 py-3">
              <button onClick={() => setIsMetaOpen(false)} className="rounded px-3 py-1.5 text-sm font-bold text-wb-muted hover:text-wb-text">{t('common.cancel')}</button>
              <button onClick={saveMeta} className="rounded bg-wb-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-wb-primary-hover">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      <WorkbenchSidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        mode={mode}
        sceneMeta={sceneMeta}
        fileInputRef={fileInputRef}
        onImportFile={onImportFile}
        onExport={onExport}
        fileActionsDisabled={fileActionsDisabled}
        fileActionsUnavailableReason={fileActionsUnavailableReason}
        theme={theme}
        onThemeChange={onThemeChange}
        settingsContent={settingsContent}
      />
    </>
  );
}
