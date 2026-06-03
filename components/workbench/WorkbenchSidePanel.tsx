import React, { useMemo, useState } from 'react';
import { Download, FileUp, Info, Link2, Settings, Share2, X } from 'lucide-react';

export type WorkbenchHeaderMode = 'learner' | 'author' | 'sandbox';

export interface WorkbenchSceneMeta {
  title: string;
  description: string;
  modelLimitations: string[];
}

interface WorkbenchSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: WorkbenchHeaderMode;
  sceneMeta: WorkbenchSceneMeta;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportFile: (file: File) => void;
  onExport: () => void;
  onOpenScenarioManager: () => void;
  onCreateLesson: () => void;
  onSaveLesson: () => void;
  onExitAuthoring: () => void;
  authoringMode: boolean;
  savedLesson: { id: string; title: string } | null;
  publishedLesson: { id: string; title: string; url: string } | null;
  copyShareUrl: () => void;
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
  onOpenScenarioManager,
  onCreateLesson,
  onSaveLesson,
  onExitAuthoring,
  authoringMode,
  savedLesson,
  publishedLesson,
  copyShareUrl,
}: WorkbenchSidePanelProps) {
  const tabs = useMemo(() => {
    const available: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
      { id: 'details', label: 'Details', icon: <Info className="h-4 w-4" /> },
    ];
    if (mode !== 'learner') {
      available.push(
        { id: 'files', label: 'Files', icon: <Download className="h-4 w-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
      );
    }
    if (mode !== 'learner' || publishedLesson || savedLesson) {
      available.unshift({ id: 'share', label: 'Share', icon: <Share2 className="h-4 w-4" /> });
    }
    return available;
  }, [mode, publishedLesson, savedLesson]);
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? 'details');
  const currentTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id ?? 'details';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl"
        aria-label="Workbench details"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 px-4">
          <div>
            <div className="text-sm font-bold text-slate-100">Workbench</div>
            <div className="text-[11px] text-slate-500">{mode === 'learner' ? 'Learning scene' : mode === 'author' ? 'Author workspace' : 'Sandbox scene'}</div>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200" aria-label="Close panel">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-slate-800 px-3 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors ${
                currentTab === tab.id ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {currentTab === 'share' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Share</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">Use published lesson links when available. Saving and sharing stay separate.</p>
              </div>
              {publishedLesson ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <a href={publishedLesson.url} className="block truncate text-sm font-bold text-emerald-100 hover:text-emerald-50">
                    {publishedLesson.url}
                  </a>
                  <button onClick={copyShareUrl} className="mt-3 inline-flex items-center gap-2 rounded bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/25">
                    <Link2 className="h-3.5 w-3.5" />
                    Copy link
                  </button>
                </div>
              ) : savedLesson ? (
                <a href={`/lesson/${savedLesson.id}`} className="inline-flex rounded bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-500/25">
                  Open saved lesson
                </a>
              ) : (
                <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-400">
                  No share link yet.
                </div>
              )}
            </div>
          )}

          {currentTab === 'files' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Files</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">Export a portable case file or load a local case. Loading replaces the current scene.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.circleheart.json,application/json"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) onImportFile(file); e.target.value = ''; }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onExport} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
                  <FileUp className="h-4 w-4" />
                  Load
                </button>
              </div>
            </div>
          )}

          {currentTab === 'details' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100">{sceneMeta.title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">{sceneMeta.description || 'No description set.'}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Model limitations</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {sceneMeta.modelLimitations.map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-slate-600">-</span>
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
                <h2 className="text-sm font-bold text-slate-100">Settings</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">Manage scenarios and authoring state.</p>
              </div>
              <button onClick={onOpenScenarioManager} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm font-bold text-slate-200 hover:bg-slate-800">
                Scenarios
              </button>
              {authoringMode ? (
                <>
                  <button onClick={onSaveLesson} className="w-full rounded-md border border-blue-500/50 bg-blue-600 px-3 py-2 text-left text-sm font-bold text-white hover:bg-blue-500">
                    Save as lesson
                  </button>
                  <button onClick={onExitAuthoring} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm font-bold text-slate-200 hover:bg-slate-800">
                    Exit authoring
                  </button>
                </>
              ) : (
                <button onClick={onCreateLesson} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm font-bold text-slate-200 hover:bg-slate-800">
                  Create lesson
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
