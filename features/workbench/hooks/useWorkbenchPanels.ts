import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { workspaceForPanels } from "@/caseDoc";
import { addPane, removePane } from "@/layoutOps";
import type { NoteContent } from "@/noteTypes";
import type {
  ControllerItem,
  DockviewViewState,
  LegendPosition,
  PanelDef,
  PanelInstanceConfig,
  PanelType,
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
  addHiddenInstanceConfigsToPanels,
  cloneInitialPanels,
  layoutStateFromWorkspace,
  mergePanelControllerItems,
  mergePanelLegendPosition,
} from "@/features/workbench/workbenchDefaults";
import { mainDockviewViewStatesOnly } from "@/features/workbench/p1aStructuralHosts";
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

export function useWorkbenchPanels({
  instances,
  headerMode,
  markUserEdited,
}: {
  instances: SimInstance[];
  headerMode: WorkbenchHeaderMode;
  markUserEdited: () => void;
}) {
  const [panels, setPanels] = useState<PanelDef[]>(cloneInitialPanels);
  const [workspace, setWorkspace] = useState<WorkbenchWorkspace>(() => workspaceForPanels(INITIAL_PANELS));
  const [workbenchLayout, setWorkbenchLayoutState] = useState<WorkbenchLayoutState>(DEFAULT_WORKBENCH_LAYOUT);
  const [dockviewLayoutVersion, setDockviewLayoutVersion] = useState(0);
  const [noteCaseKey, setNoteCaseKey] = useState("draft");
  const [notes, setNotes] = useState<Record<string, NoteContent>>({});
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
      if (workspaceVisibilityChanged) {
        setWorkspace((prevWorkspace) => {
          const { size: _controlSize, ...controlRegion } = prevWorkspace.regions.control ?? {};
          const { size: _noteSize, ...noteRegion } = prevWorkspace.regions.note ?? {};
          const { size: _outputSize, ...outputRegion } = prevWorkspace.regions.output ?? {};
          return {
            ...prevWorkspace,
            regions: {
              ...prevWorkspace.regions,
              control: {
                ...controlRegion,
                position: "right",
                visible: resolved.rightRailVisible,
              },
              note: {
                ...noteRegion,
                visible: resolved.noteOpen,
              },
              output: {
                ...outputRegion,
                visible: resolved.metricsOpen ? "compact" : false,
              },
            },
          };
        });
      }
      const selectedControllerOnly = Object.entries(resolved).every(([key, value]) => (
        key === "selectedControllerViewId" || value === prevLayout[key as keyof WorkbenchLayoutState]
      ));
      if (!selectedControllerOnly && headerMode !== "learner") markUserEdited();
      return resolved;
    });
  }, [headerMode, markUserEdited]);

  const updateDockviewViewState = useCallback((zone: WorkbenchZoneId, viewState: DockviewViewState) => {
    if (zone !== "main") return;
    setWorkspace((prev) => workspaceForPanels(panels, {
      ...prev,
      viewStates: { main: viewState },
    }));
    if (headerMode !== "learner") markUserEdited();
  }, [headerMode, markUserEdited, panels]);

  const addHiddenInstanceConfigs = useCallback((ids: string[]) => {
    setPanels((prev) => addHiddenInstanceConfigsToPanels(prev, ids));
  }, []);

  const replacePanelState = useCallback((next: {
    panels: PanelDef[];
    workspace?: WorkbenchWorkspace;
    notes: Record<string, NoteContent>;
    noteCaseKey: string;
  }) => {
    setPanels(next.panels);
    const nextWorkspace = mainDockviewViewStatesOnly(workspaceForPanels(next.panels, next.workspace));
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
  }, [markUserEdited]);

  const addPanel = useCallback((type: PanelType, zone?: WorkbenchZoneId) => {
    const newConfig = createDefaultPanelConfig(type, instances);
    if (type === "NOTE" || type === "SCENARIOS") {
      appendPanel(createPanelDef(type, newConfig, zone));
      return;
    }
    setAddingPanelConfig(newConfig);
    setAddingPanelType(type);
    setAddingPanelZone(zone ?? defaultZoneOf(type));
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
    setPanels((prev) => prev.map((panel) => panel.id === id ? { ...panel, title: newTitle } : panel));
  }, [markUserEdited]);

  const toggleShowLegend = useCallback((id: string) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === id ? { ...panel, showLegend: panel.showLegend === false ? true : false } : panel));
  }, [markUserEdited]);

  const updatePanelInstanceColor = useCallback((panelId: string, instId: string, newColor: string) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? {
      ...panel,
      config: { ...panel.config, [instId]: { ...panel.config[instId], customBaseColor: newColor } },
    } : panel));
  }, [markUserEdited]);

  const updatePanelInstanceName = useCallback((panelId: string, instId: string, newName: string) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? {
      ...panel,
      config: { ...panel.config, [instId]: { ...panel.config[instId], customName: newName } },
    } : panel));
  }, [markUserEdited]);

  const updatePanelSignalColor = useCallback((panelId: string, instId: string, sig: string, newColor: string) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? {
      ...panel,
      config: {
        ...panel.config,
        [instId]: {
          ...panel.config[instId],
          customSignalColors: { ...(panel.config[instId].customSignalColors || {}), [sig]: newColor },
        },
      },
    } : panel));
  }, [markUserEdited]);

  const updatePanelSignalName = useCallback((panelId: string, instId: string, sig: string, newName: string) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? {
      ...panel,
      config: {
        ...panel.config,
        [instId]: {
          ...panel.config[instId],
          customSignalNames: { ...(panel.config[instId].customSignalNames || {}), [sig]: newName },
        },
      },
    } : panel));
  }, [markUserEdited]);

  const toggleSettings = useCallback((panelId: string) => {
    setPanels((prev) => prev.map((panel) => (
      panel.id === panelId ? { ...panel, isSettingsOpen: !panel.isSettingsOpen } : { ...panel, isSettingsOpen: false }
    )));
  }, []);

  const togglePaneMembership = useCallback((panelId: string, instId: string) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? {
      ...panel,
      config: { ...panel.config, [instId]: { ...panel.config[instId], visible: !panel.config[instId].visible } },
    } : panel));
  }, [markUserEdited]);

  const updateInstanceSignals = useCallback((panelId: string, instId: string, signal: string) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => {
      if (panel.id !== panelId) return panel;
      const currentSignals = new Set(panel.config[instId].selectedSignals);
      if (currentSignals.has(signal)) currentSignals.delete(signal);
      else currentSignals.add(signal);
      return {
        ...panel,
        config: {
          ...panel.config,
          [instId]: { ...panel.config[instId], selectedSignals: Array.from(currentSignals) },
        },
      };
    }));
  }, [markUserEdited]);

  const toggleGuides = useCallback((panelId: string) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? { ...panel, showGuides: !panel.showGuides } : panel));
  }, [markUserEdited]);

  const updateTimeWindow = useCallback((panelId: string, val: number) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? { ...panel, timeWindow: val } : panel));
  }, [markUserEdited]);

  const updatePanelControllerItems = useCallback((panelId: string, items: ControllerItem[]) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? mergePanelControllerItems(panel, items) : panel));
  }, [markUserEdited]);

  const updatePanelLegendPosition = useCallback((panelId: string, pos?: LegendPosition) => {
    markUserEdited();
    setPanels((prev) => prev.map((panel) => panel.id === panelId ? mergePanelLegendPosition(panel, pos) : panel));
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
      const { size: _controlSize, ...controlRegion } = prev.regions.control ?? {};
      const { size: _noteSize, ...noteRegion } = prev.regions.note ?? {};
      const { size: _outputSize, ...outputRegion } = prev.regions.output ?? {};
      const nextWorkspace = workspaceForPanels(panels, {
        ...prev,
        regions: {
          ...prev.regions,
          control: {
            ...controlRegion,
            position: DEFAULT_WORKBENCH_LAYOUT.controlsSide,
            visible: DEFAULT_WORKBENCH_LAYOUT.rightRailVisible,
          },
          note: { ...noteRegion, visible: DEFAULT_WORKBENCH_LAYOUT.noteOpen },
          output: { ...outputRegion, visible: DEFAULT_WORKBENCH_LAYOUT.metricsOpen ? "compact" : false },
        },
        viewStates: undefined,
      });
      const { viewStates: _viewStates, ...withoutViewStates } = nextWorkspace;
      return withoutViewStates;
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
    addHiddenInstanceConfigs,
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
    updatePanelControllerItems,
    updatePanelLegendPosition,
    onNoteChange,
    toggleNoteDrawer,
    resetWorkbenchLayout,
    emptyNoteSpine: EMPTY_NOTE_SPINE,
  };
}

export type WorkbenchPanelsState = ReturnType<typeof useWorkbenchPanels>;
