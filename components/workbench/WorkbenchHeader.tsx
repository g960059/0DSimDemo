import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Edit3,
  LayoutGrid,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Save,
  Share2,
} from 'lucide-react';
import { SimInstance, PanelType } from '../../types';
import { SimulationHealth } from '../../engine/protocol';
import { HealthBadge } from '../HealthIndicators';
import { ModelLimitations } from '../ModelLimitations';
import { WorkbenchHeaderMode, WorkbenchSceneMeta, WorkbenchSidePanel } from './WorkbenchSidePanel';

interface WorkbenchHeaderProps {
  mode: WorkbenchHeaderMode;
  backHref: string;
  backLabel: string;
  sceneMeta: WorkbenchSceneMeta;
  onSceneMetaChange: (meta: WorkbenchSceneMeta) => void;
  onPrimaryAction: () => void;
  instances: SimInstance[];
  instanceHealth: Record<string, SimulationHealth>;
  getLiveHealth: (id: string) => SimulationHealth | undefined;
  onOpenScenarioManager: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportFile: (file: File) => void;
  onExport: () => void;
  authoringMode: boolean;
  setAuthoringMode: React.Dispatch<React.SetStateAction<boolean>>;
  stepsDraftLength: number;
  openLessonDialog: () => void;
  onExitAuthoring: () => void;
  user: unknown;
  isAdmin: boolean;
  publishCurrentLesson: () => void;
  isPublishingLesson: boolean;
  savedLesson: { id: string; title: string } | null;
  publishedLesson: { id: string; title: string; url: string } | null;
  copyShareUrl: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
  timeScale: number;
  setTimeScale: React.Dispatch<React.SetStateAction<number>>;
  addPanel: (type: PanelType) => void;
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
  instances,
  instanceHealth,
  getLiveHealth,
  onOpenScenarioManager,
  fileInputRef,
  onImportFile,
  onExport,
  authoringMode,
  setAuthoringMode,
  stepsDraftLength,
  openLessonDialog,
  onExitAuthoring,
  user,
  isAdmin,
  publishCurrentLesson,
  isPublishingLesson,
  savedLesson,
  publishedLesson,
  copyShareUrl,
  isPlaying,
  togglePlay,
  timeScale,
  setTimeScale,
  addPanel,
}: WorkbenchHeaderProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isPaneMenuOpen, setIsPaneMenuOpen] = useState(false);
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [draftMeta, setDraftMeta] = useState(sceneMeta);

  const isLearner = mode === 'learner';
  const primaryLabel = mode === 'learner' ? 'Save a copy' : mode === 'author' ? 'Share' : 'Save case';

  const openMetaEditor = () => {
    setDraftMeta(sceneMeta);
    setIsMetaOpen(true);
  };

  const saveMeta = () => {
    onSceneMetaChange({
      title: draftMeta.title.trim() || 'Untitled scene',
      description: draftMeta.description.trim(),
      modelLimitations: draftMeta.modelLimitations.map((item) => item.trim()).filter(Boolean),
    });
    setIsMetaOpen(false);
  };

  const runPrimaryAction = () => {
    if (mode === 'author') publishCurrentLesson();
    else onPrimaryAction();
  };

  return (
    <>
      <header className="h-14 bg-slate-950 border-b border-slate-800 z-50 flex items-center gap-2 px-3 sm:px-4 shrink-0">
        <a href={backHref} className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-slate-100">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </a>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isLearner ? (
            <div className="flex min-w-0 items-center gap-1">
              <h1 className="truncate text-sm font-bold text-slate-100">{sceneMeta.title}</h1>
              <ModelLimitations compact limitations={sceneMeta.modelLimitations} />
            </div>
          ) : (
            <button onClick={openMetaEditor} className="flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-left hover:bg-slate-900">
              <Edit3 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span className="truncate text-sm font-bold text-slate-100">{sceneMeta.title || 'Untitled scene'}</span>
              {authoringMode && stepsDraftLength > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-300" title="Unsaved authoring changes" />}
            </button>
          )}

          {isLearner && (
            <button className="hidden items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800 sm:inline-flex">
              <span className="flex -space-x-1">
                {instances.slice(0, 3).map((instance) => (
                  <span key={instance.id} className="h-2.5 w-2.5 rounded-full border border-slate-900" style={{ backgroundColor: instance.color }} />
                ))}
              </span>
              Compare
              <ChevronDown className="h-3 w-3" />
            </button>
          )}

          {mode === 'author' && (
            <button className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-slate-100 lg:inline-flex">
              <LayoutGrid className="h-3.5 w-3.5" />
              Edit layout
            </button>
          )}

          {!isLearner && (
            <div className="relative hidden sm:block">
              <button onClick={() => setIsPaneMenuOpen((open) => !open)} className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-slate-100">
                <Plus className="h-4 w-4" />
                Pane
              </button>
              {isPaneMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPaneMenuOpen(false)} />
                  <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-slate-700 bg-slate-900 py-1 shadow-xl">
                    {[
                      ['NOTE', 'Notes'],
                      ['PVLOOP', 'PV Loop'],
                      ['WAVEFORM', 'Waveforms'],
                      ['METRICS', 'Metrics'],
                      ['CONTROLS', 'Controls'],
                      ['GUYTON_LEFT', 'Guyton (L)'],
                      ['GUYTON_RIGHT', 'Guyton (R)'],
                    ].map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => { addPanel(type as PanelType); setIsPaneMenuOpen(false); }}
                        className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <HealthBadge items={instances.filter(i => instanceHealth[i.id]).map(i => ({ id: i.id, name: i.name, color: i.color, health: instanceHealth[i.id] }))} getLiveHealth={getLiveHealth} />
          <div className="flex items-center rounded-md border border-slate-800 bg-slate-900">
            <button
              onClick={togglePlay}
              className="inline-flex h-9 w-9 items-center justify-center text-slate-200 hover:bg-slate-800"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="relative border-l border-slate-800">
              <button onClick={() => setIsSpeedOpen((open) => !open)} className="inline-flex h-9 items-center gap-1 px-2 text-xs font-bold text-slate-300 hover:bg-slate-800">
                {speedLabel(timeScale)}
                <ChevronDown className="h-3 w-3" />
              </button>
              {isSpeedOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSpeedOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-24 rounded-md border border-slate-700 bg-slate-900 p-1 shadow-xl">
                    {SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => { setTimeScale(speed); setIsSpeedOpen(false); }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
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

          <button
            onClick={runPrimaryAction}
            disabled={mode === 'author' && isPublishingLesson}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === 'author' ? <Share2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{mode === 'author' && isPublishingLesson ? 'Publishing...' : primaryLabel}</span>
          </button>

          <button onClick={() => setIsPanelOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-900 hover:text-slate-100" aria-label="Open workbench panel">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      {isMetaOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-100">Scene details</h2>
            </div>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-400">Title</span>
                <input value={draftMeta.title} onChange={(e) => setDraftMeta((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-400">Description</span>
                <textarea value={draftMeta.description} onChange={(e) => setDraftMeta((prev) => ({ ...prev, description: e.target.value }))} className="h-24 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-400">Model limitations</span>
                <textarea
                  value={draftMeta.modelLimitations.join('\n')}
                  onChange={(e) => setDraftMeta((prev) => ({ ...prev, modelLimitations: e.target.value.split('\n') }))}
                  className="h-28 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3">
              <button onClick={() => setIsMetaOpen(false)} className="rounded px-3 py-1.5 text-sm font-bold text-slate-400 hover:text-slate-100">Cancel</button>
              <button onClick={saveMeta} className="rounded bg-blue-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-500">Save</button>
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
        onOpenScenarioManager={onOpenScenarioManager}
        onCreateLesson={() => setAuthoringMode(true)}
        onExitAuthoring={onExitAuthoring}
        authoringMode={authoringMode}
        savedLesson={savedLesson}
        publishedLesson={publishedLesson}
        copyShareUrl={copyShareUrl}
      />
    </>
  );
}
