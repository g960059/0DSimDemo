import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { workspaceForPanels } from "@/caseDoc";
import { addPane, removePane } from "@/layoutOps";
import type { NoteContent } from "@/noteTypes";
import {
  DEFAULT_HEMODYNAMIC_ALLOW_NEGATIVE_FILLING_PRESSURE,
  DEFAULT_HEMODYNAMIC_DETAIL_MODE,
  DEFAULT_HEMODYNAMIC_PARAMETER_HISTORY_COUNT,
} from "@/types";
import type {
  ControllerItem,
  DockviewViewState,
  HemodynamicResponsePanelSettings,
  LegendPosition,
  PanelDef,
  PanelInstanceConfig,
  PanelType,
  PvLoopDebugTraceMode,
  PvLoopHistoryMode,
  SimInstance,
  WorkbenchWorkspace,
  WorkbenchZoneId,
} from "@/types";
import type { WorkbenchHeaderMode } from "@/components/workbench/WorkbenchSidePanel";
import type { WorkbenchLayoutState } from "@/components/workbench/PanelGrid";
import {
  DEFAULT_WORKBENCH_LAYOUT,
  EMPTY_NOTE_SPINE,
  INITIAL_PANELS,
  addVisibleInstanceConfigsToPanels,
  cloneInitialPanels,
  layoutStateFromWorkspace,
  mergePanelControllerItems,
  mergePanelLegendPosition,
  removeInstanceConfigsFromPanels,
  updatePanelWithSourceViewMirrors,
  type AddedInstanceConfig,
} from "@/features/workbench/workbenchDefaults";
import {
  createDefaultPanelConfig,
  createPanelDef,
  ensureNotePanelForDrawer,
  noteModesAfterPanelAdded,
  noteModesAfterPanelRemoved,
  notesAfterPanelAdded,
  notesAfterPanelRemoved,
  workspaceAfterPanelsChanged,
} from "@/features/workbench/panelModel";
import { defaultZoneOf } from "@/paneZone";

export function workspaceForPanelStateReplacement(next: {
  panels: PanelDef[];
  workspace?: WorkbenchWorkspace;
}): WorkbenchWorkspace {
  return workspaceForPanels(next.panels, next.workspace);
}

export type WorkbenchPanelStateInitializer = {
  panels: PanelDef[];
  workspace?: WorkbenchWorkspace;
  notes: Record<string, NoteContent>;
  noteCaseKey: string;
};

export function useWorkbenchPanels({
  instances,
  headerMode,
  markUserEdited,
  initialPanelState,
  normalizePanelControllerItems,
}: {
  instances: SimInstance[];
  headerMode: WorkbenchHeaderMode;
  markUserEdited: () => void;
  initialPanelState?: WorkbenchPanelStateInitializer;
  normalizePanelControllerItems?: (items: ControllerItem[]) => ControllerItem[];
}) {
  const [panels, setPanels] = useState<PanelDef[]>(() => initialPanelState?.panels ?? cloneInitialPanels());
  const [workspace, setWorkspace] = useState<WorkbenchWorkspace>(() => initialPanelState ? workspaceForPanelStateReplacement(initialPanelState) : workspaceForPanels(INITIAL_PANELS));
  const [workbenchLayout, setWorkbenchLayoutState] = useState<WorkbenchLayoutState>(() => initialPanelState ? layoutStateFromWorkspace(workspaceForPanelStateReplacement(initialPanelState)) : DEFAULT_WORKBENCH_LAYOUT);
  const [dockviewLayoutVersion, setDockviewLayoutVersion] = useState(0);
  const [noteCaseKey, setNoteCaseKey] = useState(initialPanelState?.noteCaseKey ?? "draft");
  const [notes, setNotes] = useState<Record<string, NoteContent>>(() => initialPanelState?.notes ?? {});
  const [noteModes, setNoteModes] = useState<Record<string, "read" | "edit">>({});
  const [addingPanelType, setAddingPanelType] = useState<PanelType | null>(null);
  const [addingPanelZone, setAddingPanelZone] = useState<WorkbenchZoneId | null>(null);
  const [addingPanelConfig, setAddingPanelConfig] = useState<Record<string, PanelInstanceConfig>>({});

  const setWorkbenchLayout: Dispatch<SetStateAction<WorkbenchLayoutState>> = useCallback((next) => {
    setWorkbenchLayoutState((prevLayout) => {
      const resolved = typeof next === "function" ? next(prevLayout) : next;
      const workspaceVisibilityChanged = resolved.rightRailVisible !== prevLayout.rightRailVisible
        || resolved.noteOpen !== prevLayout.noteOpen
        || resolved.metricsOpen !== prevLayout.metricsOpen;
      const workspaceHostStateChanged = workspaceVisibilityChanged
        || resolved.metricsSpan !== prevLayout.metricsSpan
        || resolved.scenarioListCollapsed !== prevLayout.scenarioListCollapsed;
      if (workspaceHostStateChanged) {
        setWorkspace((prevWorkspace) => {
          const nextWorkspace = workspaceForPanels(panels, {
            ...prevWorkspace,
            hosts: {
              ...prevWorkspace.hosts,
              note: { open: resolved.noteOpen },
              rightRail: {
                open: resolved.rightRailVisible,
                ...(resolved.scenarioListCollapsed ? { scenarioListCollapsed: true } : {}),
              },
              metrics: {
                open: resolved.metricsOpen,
                ...(resolved.metricsSpan === "full" ? { span: "full" as const } : {}),
              },
              main: prevWorkspace.hosts.main,
            },
          });
          return nextWorkspace;
        });
      }
      const selectedLocalOnly = Object.entries(resolved).every(([key, value]) => (
        key === "selectedControllerViewId" || value === prevLayout[key as keyof WorkbenchLayoutState]
      ));
      if (!selectedLocalOnly && headerMode !== "learner") markUserEdited();
      return resolved;
    });
  }, [headerMode, markUserEdited, panels]);

  const updateDockviewViewState = useCallback((zone: WorkbenchZoneId, viewState: DockviewViewState) => {
    if (zone !== "main") return;
    setWorkspace((prev) => workspaceForPanels(panels, {
      ...prev,
      hosts: {
        ...prev.hosts,
        main: { dockviewState: viewState },
      },
    }));
    if (headerMode !== "learner") markUserEdited();
  }, [headerMode, markUserEdited, panels]);

  const addVisibleInstanceConfigs = useCallback((additions: AddedInstanceConfig[]) => {
    setPanels((prev) => addVisibleInstanceConfigsToPanels(prev, additions));
  }, []);

  const removeInstanceConfigs = useCallback((instanceIds: readonly string[]) => {
    setPanels((prev) => removeInstanceConfigsFromPanels(prev, instanceIds));
  }, []);

  const replacePanelState = useCallback((next: {
    panels: PanelDef[];
    workspace?: WorkbenchWorkspace;
    notes: Record<string, NoteContent>;
    noteCaseKey: string;
  }) => {
    setPanels(next.panels);
    const nextWorkspace = workspaceForPanelStateReplacement(next);
    setWorkspace(nextWorkspace);
    setWorkbenchLayoutState(layoutStateFromWorkspace(nextWorkspace));
    setDockviewLayoutVersion((value) => value + 1);
    setNotes(next.notes);
    setNoteModes({});
    setNoteCaseKey(next.noteCaseKey);
  }, []);

  const appendPanel = useCallback((newPanel: PanelDef) => {
    markUserEdited();
    setPanels((prev) => {
      const nextPanels = addPane(prev, newPanel);
      setWorkspace((prevWorkspace) => workspaceAfterPanelsChanged(nextPanels, prevWorkspace));
      return nextPanels;
    });
    setNotes((prev) => notesAfterPanelAdded(prev, newPanel));
    setNoteModes((prev) => noteModesAfterPanelAdded(prev, newPanel));
    return newPanel;
  }, [markUserEdited]);

  const addPanel = useCallback((type: PanelType, zone?: WorkbenchZoneId): PanelDef => {
    const newConfig = createDefaultPanelConfig(type, instances);
    const newPanel = createPanelDef(type, newConfig, zone ?? defaultZoneOf(type));
    return appendPanel(newPanel);
  }, [appendPanel, instances]);

  const duplicatePanel = useCallback((panelId: string): PanelDef | undefined => {
    const source = panels.find((panel) => panel.id === panelId);
    if (!source) return undefined;
    markUserEdited();
    const newPanel: PanelDef = JSON.parse(JSON.stringify({
      ...source,
      id: `${source.id}-${Date.now().toString(36)}`,
      isSettingsOpen: false,
    }));
    setPanels((prev) => {
      const nextPanels = addPane(prev, newPanel);
      setWorkspace((prevWorkspace) => workspaceAfterPanelsChanged(nextPanels, prevWorkspace));
      return nextPanels;
    });
    setNotes((prev) => notesAfterPanelAdded(prev, newPanel));
    setNoteModes((prev) => noteModesAfterPanelAdded(prev, newPanel));
    return newPanel;
  }, [markUserEdited, panels]);

  const confirmAddPanel = useCallback(() => {
    if (headerMode === "learner") return;
    if (!addingPanelType) return;
    appendPanel(createPanelDef(addingPanelType, addingPanelConfig, addingPanelZone ?? defaultZoneOf(addingPanelType)));
    setAddingPanelType(null);
    setAddingPanelZone(null);
  }, [addingPanelConfig, addingPanelType, addingPanelZone, appendPanel]);

  const cancelAddPanel = useCallback(() => {
    setAddingPanelType(null);
    setAddingPanelZone(null);
  }, []);

  const removePanel = useCallback((id: string) => {
    markUserEdited();
    setPanels((prev) => {
      const nextPanels = removePane(prev, id);
      setWorkspace((prevWorkspace) => workspaceAfterPanelsChanged(nextPanels, prevWorkspace));
      return nextPanels;
    });
    setNotes((prev) => notesAfterPanelRemoved(prev, id));
    setNoteModes((prev) => noteModesAfterPanelRemoved(prev, id));
  }, [markUserEdited]);

  const updatePanelTitle = useCallback((id: string, newTitle: string) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(
      prev,
      id,
      (panel) => ({ ...panel, title: newTitle }),
    ));
  }, [markUserEdited]);

  const toggleShowLegend = useCallback((id: string) => {
    markUserEdited();
    setPanels((prev) => {
      const target = prev.find((panel) => panel.id === id);
      if (!target) return prev;
      const showLegend = target.showLegend === false;
      return updatePanelWithSourceViewMirrors(
        prev,
        id,
        (panel) => ({ ...panel, showLegend }),
      );
    });
  }, [markUserEdited]);

  const updatePanelInstanceColor = useCallback((panelId: string, instId: string, newColor: string) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(prev, panelId, (panel) => {
      const instanceConfig = panel.config[instId];
      return instanceConfig ? {
        ...panel,
        config: { ...panel.config, [instId]: { ...instanceConfig, customBaseColor: newColor } },
      } : panel;
    }));
  }, [markUserEdited]);

  const updatePanelInstanceName = useCallback((panelId: string, instId: string, newName: string) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(prev, panelId, (panel) => {
      const instanceConfig = panel.config[instId];
      return instanceConfig ? {
        ...panel,
        config: { ...panel.config, [instId]: { ...instanceConfig, customName: newName } },
      } : panel;
    }));
  }, [markUserEdited]);

  const updatePanelSignalColor = useCallback((panelId: string, instId: string, sig: string, newColor: string) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(prev, panelId, (panel) => {
      const instanceConfig = panel.config[instId];
      return instanceConfig ? {
        ...panel,
        config: {
          ...panel.config,
          [instId]: {
            ...instanceConfig,
            customSignalColors: { ...(instanceConfig.customSignalColors || {}), [sig]: newColor },
          },
        },
      } : panel;
    }));
  }, [markUserEdited]);

  const updatePanelSignalName = useCallback((panelId: string, instId: string, sig: string, newName: string) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(prev, panelId, (panel) => {
      const instanceConfig = panel.config[instId];
      return instanceConfig ? {
        ...panel,
        config: {
          ...panel.config,
          [instId]: {
            ...instanceConfig,
            customSignalNames: { ...(instanceConfig.customSignalNames || {}), [sig]: newName },
          },
        },
      } : panel;
    }));
  }, [markUserEdited]);

  const toggleSettings = useCallback((panelId: string) => {
    setPanels((prev) => prev.map((panel) => (
      panel.id === panelId ? { ...panel, isSettingsOpen: !panel.isSettingsOpen } : { ...panel, isSettingsOpen: false }
    )));
  }, []);

  const togglePaneMembership = useCallback((panelId: string, instId: string) => {
    markUserEdited();
    setPanels((prev) => {
      const targetConfig = prev.find((panel) => panel.id === panelId)?.config[instId];
      if (!targetConfig) return prev;
      const visible = !targetConfig.visible;
      return updatePanelWithSourceViewMirrors(prev, panelId, (panel) => {
        const instanceConfig = panel.config[instId];
        return instanceConfig ? {
          ...panel,
          config: { ...panel.config, [instId]: { ...instanceConfig, visible } },
        } : panel;
      });
    });
  }, [markUserEdited]);

  const updateInstanceSignals = useCallback((panelId: string, instId: string, signal: string) => {
    markUserEdited();
    setPanels((prev) => {
      const targetConfig = prev.find((panel) => panel.id === panelId)?.config[instId];
      if (!targetConfig) return prev;
      const currentSignals = new Set(targetConfig.selectedSignals);
      if (currentSignals.has(signal)) currentSignals.delete(signal);
      else currentSignals.add(signal);
      const selectedSignals = Array.from(currentSignals);
      return updatePanelWithSourceViewMirrors(prev, panelId, (panel) => {
        const instanceConfig = panel.config[instId];
        return instanceConfig ? {
          ...panel,
          config: {
            ...panel.config,
            [instId]: { ...instanceConfig, selectedSignals: [...selectedSignals] },
          },
        } : panel;
      });
    });
  }, [markUserEdited]);

  const toggleGuides = useCallback((panelId: string) => {
    markUserEdited();
    setPanels((prev) => {
      const target = prev.find((panel) => panel.id === panelId);
      if (!target) return prev;
      const showGuides = !target.showGuides;
      return updatePanelWithSourceViewMirrors(
        prev,
        panelId,
        (panel) => ({ ...panel, showGuides }),
      );
    });
  }, [markUserEdited]);

  const updateTimeWindow = useCallback((panelId: string, val: number) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(
      prev,
      panelId,
      (panel) => ({ ...panel, timeWindow: val }),
    ));
  }, [markUserEdited]);

  const togglePvDebugOverlay = useCallback((panelId: string) => {
    markUserEdited();
    setPanels((prev) => {
      const target = prev.find((panel) => panel.id === panelId);
      if (!target) return prev;
      const pvDebugOverlay = !target.pvDebugOverlay;
      return updatePanelWithSourceViewMirrors(
        prev,
        panelId,
        (panel) => ({ ...panel, pvDebugOverlay }),
      );
    });
  }, [markUserEdited]);

  const updatePvDebugTraceMode = useCallback((panelId: string, mode: PvLoopDebugTraceMode) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(
      prev,
      panelId,
      (panel) => ({ ...panel, pvDebugTraceMode: mode }),
    ));
  }, [markUserEdited]);

  const updatePanelPvHistory = useCallback((
    panelId: string,
    history: Readonly<{ beats?: number; mode?: PvLoopHistoryMode }>,
  ) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(
      prev,
      panelId,
      (panel) => {
        if (panel.type !== 'PVLOOP') return panel;
        const beats = history.beats === undefined
          ? panel.pvHistoryBeats ?? 8
          : Math.min(16, Math.max(0, Math.round(history.beats)));
        const mode = history.mode ?? panel.pvHistoryMode ?? 'fade';
        return {
          ...panel,
          pvHistoryBeats: beats,
          pvHistoryMode: mode,
          view: panel.view?.kind === 'graph'
            ? { ...panel.view, pvHistoryBeats: beats, pvHistoryMode: mode }
            : panel.view,
        };
      },
    ));
  }, [markUserEdited]);

  const updatePanelHemodynamicSettings = useCallback((
    panelId: string,
    settings: Readonly<Partial<HemodynamicResponsePanelSettings>>,
  ) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(
      prev,
      panelId,
      (panel) => {
        if (panel.type !== 'GUYTON_LEFT' && panel.type !== 'GUYTON_RIGHT') {
          return panel;
        }
        const detailMode = settings.detailMode
          ?? panel.hemodynamicDetailMode
          ?? DEFAULT_HEMODYNAMIC_DETAIL_MODE;
        const parameterHistoryCount = settings.parameterHistoryCount
          ?? panel.hemodynamicParameterHistoryCount
          ?? DEFAULT_HEMODYNAMIC_PARAMETER_HISTORY_COUNT;
        const allowNegativeFillingPressure =
          settings.allowNegativeFillingPressure
          ?? panel.hemodynamicAllowNegativeFillingPressure
          ?? DEFAULT_HEMODYNAMIC_ALLOW_NEGATIVE_FILLING_PRESSURE;
        return {
          ...panel,
          hemodynamicDetailMode: detailMode,
          hemodynamicParameterHistoryCount: parameterHistoryCount,
          hemodynamicAllowNegativeFillingPressure:
            allowNegativeFillingPressure,
          view: panel.view?.kind === 'graph'
            ? {
              ...panel.view,
              hemodynamicDetailMode: detailMode,
              hemodynamicParameterHistoryCount: parameterHistoryCount,
              hemodynamicAllowNegativeFillingPressure:
                allowNegativeFillingPressure,
            }
            : panel.view,
        };
      },
    ));
  }, [markUserEdited]);

  const updatePanelControllerItems = useCallback((panelId: string, items: ControllerItem[]) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId
      ? mergePanelControllerItems(panel, items, normalizePanelControllerItems)
      : panel));
  }, [markUserEdited, normalizePanelControllerItems]);

  const updatePanelLegendPosition = useCallback((panelId: string, pos?: LegendPosition) => {
    markUserEdited();
    setPanels((prev) => updatePanelWithSourceViewMirrors(
      prev,
      panelId,
      (panel) => mergePanelLegendPosition(panel, pos),
    ));
  }, [markUserEdited]);

  const onNoteChange = useCallback((panelId: string, blocks: NoteContent) => {
    setNotes((prev) => ({ ...prev, [panelId]: blocks }));
    markUserEdited();
  }, [markUserEdited]);

  const ensureNoteDrawerPanel = useCallback(() => {
    setPanels((prev) => {
      const result = ensureNotePanelForDrawer({
        panels: prev,
        instances,
        notes: {},
        noteModes: {},
      });
      if (!result.created) return prev;
      setWorkspace((prevWorkspace) => workspaceAfterPanelsChanged(result.panels, prevWorkspace));
      setNotes((prevNotes) => notesAfterPanelAdded(prevNotes, result.panel));
      setNoteModes((prevModes) => noteModesAfterPanelAdded(prevModes, result.panel));
      return result.panels;
    });
  }, [instances]);

  const toggleNoteDrawer = useCallback(() => {
    const hasNotePanel = panels.some((panel) => panel.type === "NOTE");
    if (workbenchLayout.noteOpen) {
      setWorkbenchLayout((prev) => ({ ...prev, noteOpen: false }));
      return;
    }
    if (!hasNotePanel) {
      if (headerMode === "learner") return;
      ensureNoteDrawerPanel();
    }
    setWorkbenchLayout((prev) => ({ ...prev, noteOpen: true }));
  }, [ensureNoteDrawerPanel, headerMode, panels, setWorkbenchLayout, workbenchLayout.noteOpen]);

  const resetWorkbenchLayout = useCallback(() => {
    setWorkbenchLayout(DEFAULT_WORKBENCH_LAYOUT);
    setWorkspace((prev) => {
      return workspaceForPanels(panels, {
        ...prev,
        hosts: {
          note: { open: DEFAULT_WORKBENCH_LAYOUT.noteOpen },
          rightRail: { open: DEFAULT_WORKBENCH_LAYOUT.rightRailVisible },
          metrics: { open: DEFAULT_WORKBENCH_LAYOUT.metricsOpen },
          main: {},
        },
      });
    });
    setDockviewLayoutVersion((value) => value + 1);
  }, [panels, setWorkbenchLayout]);

  return {
    panels,
    setPanels,
    workspace,
    workbenchLayout,
    setWorkbenchLayout,
    dockviewLayoutVersion,
    noteCaseKey,
    notes,
    setNotes,
    noteModes,
    setNoteModes,
    addingPanelType,
    addingPanelConfig,
    setAddingPanelConfig,
    addVisibleInstanceConfigs,
    removeInstanceConfigs,
    replacePanelState,
    updateDockviewViewState,
    addPanel,
    duplicatePanel,
    confirmAddPanel,
    cancelAddPanel,
    removePanel,
    updatePanelTitle,
    toggleShowLegend,
    updatePanelInstanceColor,
    updatePanelInstanceName,
    updatePanelSignalColor,
    updatePanelSignalName,
    toggleSettings,
    togglePaneMembership,
    updateInstanceSignals,
    toggleGuides,
    updateTimeWindow,
    togglePvDebugOverlay,
    updatePvDebugTraceMode,
    updatePanelPvHistory,
    updatePanelHemodynamicSettings,
    updatePanelControllerItems,
    updatePanelLegendPosition,
    onNoteChange,
    toggleNoteDrawer,
    resetWorkbenchLayout,
    emptyNoteSpine: EMPTY_NOTE_SPINE,
  };
}

export type WorkbenchPanelsState = ReturnType<typeof useWorkbenchPanels>;
