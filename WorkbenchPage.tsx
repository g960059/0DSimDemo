import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DEFAULT_PARAMS } from './constants';
import { SimulationParams, SimInstance, PanelDef, PanelType, PanelInstanceConfig, ChamberId, SignalType, MetricType, type ControllerItem, type ControlPanelView, type DockviewViewState, type WorkbenchWorkspace, type WorkbenchZoneId } from './types';
import { SimulationHealth } from './engine/protocol';
import { type ClinicalKnobs } from './engine/knobs';
import { resolveRawEdit, resolveKnobEdit } from './engine/instanceKnobs';
import { OFFICIAL_BASELINES } from './engine/caseBaselines';
import { type CaseDocument, type CaseSource, type CaseStatus, type CaseVisibility, simInstancesToCaseDocument, caseDocumentToSimInstances, workspaceForPanels } from './caseDoc';
import { exportCaseFile, readCaseFile, saveDraft } from './casePersist';
import { createUserCaseId, fetchCase, isValidCaseId, saveCase } from './caseCloud';
import { officialCaseById } from './officialCases';
import { createUserLessonId, getUserLesson, saveLesson } from './lessonPersist';
import { publishLesson } from './lessonCloud';
import { normalizeStepsForSave } from './lessonAuthoring';
import type { Lesson, LessonStep } from './lessonDoc';
import { remapWorkbenchLoadIds } from './workbenchLoad';
import { useAuth } from './contexts/AuthContext';
import { HealthToasts, HealthToast } from './components/HealthIndicators';
import { PreviewController } from './engine/previewController';
import { WorkbenchHeader } from './components/workbench/WorkbenchHeader';
import type { WorkbenchHeaderMode, WorkbenchSceneMeta, WorkbenchThemeId } from './components/workbench/WorkbenchSidePanel';
import { PanelGrid } from './components/workbench/PanelGrid';
import type { WorkbenchControlsSide, WorkbenchLayoutState } from './components/workbench/PanelGrid';
import type { NoteContent } from './noteTypes';
import { addPane, removePane } from './layoutOps';
import { defaultZoneOf } from './paneZone';
import { normalizeControllerItems } from './controllerItems';
import { toTypedPanelView } from './panelView';

// Colors for instances
const INSTANCE_COLORS = ['#a855f7', '#f472b6', '#22c55e', '#38bdf8', '#fbbf24'];

const ALL_CHAMBERS: ChamberId[] = ['LV', 'LA', 'RV', 'RA'];
const ALL_SIGNALS: SignalType[] = [
  'LVP', 'AoP', 'LAP', 'RVP', 'PAP', 'RAP',
  'QAo', 'QMV', 'QPA', 'QPV', 'QTV', 'PVF', 'SVF',
  'QCorLAD', 'QCorLCx', 'QCorRCA', 'QCorTotal', 'QCS',
  'PimLAD', 'PimLCx', 'PimRCA', 'PLADArt', 'PLCxArt', 'PRCAArt', 'PCS',
  'VRA', 'aRA', 'cRA', 'xiMV', 'xiAoV', 'xiTV', 'xiPV',
  'dP_MV', 'dP_AoV', 'dP_TV', 'dP_PV',
  'AoV_areaRatio', 'AoV_loss_R', 'AoV_loss_B', 'AoV_loss_residual',
  'LVPressureFloorHit01', 'RVPressureFloorHit01',
  'ELV_active', 'ERV_active', 'ELV_timeVarying', 'ERV_timeVarying',
  'Pperi', 'Ppc', 'VHeart', 'septumShiftMl', 'VLVeff', 'VRVeff',
  'PLVfw', 'PRVfw', 'PVI_LV', 'PVI_RV', 'septalForceMmHg',
];
const ALL_METRICS: MetricType[] = ['ABP', 'CVP', 'PAP', 'PCWP', 'SV', 'CO', 'LVEF', 'COR', 'COR_PCT', 'LAD_DF', 'RCA_DF', 'FFR_LAD'];
const ALL_CONTROL_GROUPS: string[] = ['clinical', 'Global', 'ventricles', 'atria', 'vascular', 'coronary', 'fluids', 'valves', 'resp', 'advanced'];
const DEFAULT_MODEL_LIMITATIONS = [
  '0D lumped-parameter closed-loop model — no regional wall motion or spatial flow.',
  'Active-stress single-fibre ventricles; parameters are not yet calibrated (M12).',
];
const WORKBENCH_THEME_STORAGE_KEY = 'hemosim.workbench.theme';
const DEFAULT_WORKBENCH_THEME: WorkbenchThemeId = 'midnight';
const WORKBENCH_THEMES = new Set<WorkbenchThemeId>(['midnight', 'graphite', 'clinical']);
const LOCAL_COPY_AUTHOR = 'Local copy';
const EMPTY_NOTE_SPINE: NoteContent = [
  { type: 'paragraph', content: [{ type: 'text', text: '', styles: {} }] },
];
const INITIAL_PANELS: PanelDef[] = [
  {
      id: 'p1', type: 'WAVEFORM', title: 'Waveforms', w: 5, h: 6,
      config: { '1': { visible: true, selectedSignals: ['LVP', 'AoP'] } },
      isSettingsOpen: false, timeWindow: 5000
  },
  {
      id: 'p2', type: 'PVLOOP', title: 'PV Loop', w: 3, h: 6,
      config: { '1': { visible: true, selectedSignals: ['LV'] } },
      isSettingsOpen: false, showGuides: true
  },
  {
      id: 'p0', type: 'SCENARIOS', title: 'Scenarios', zone: 'sideRail', w: 4, h: 4,
      config: { '1': { visible: true, selectedSignals: [] } },
      isSettingsOpen: false
  },
  {
      id: 'p4', type: 'CONTROLS', title: 'Controls', w: 4, h: 4,
      // Keep ventricular mechanics visible as a collapsed group so the
      // pericardium/septum controls are discoverable without opening panel
      // settings. Default model stays active-stress.
      config: { '1': { visible: true, selectedSignals: ['clinical', 'Global', 'ventricles', 'fluids'] } },
      isSettingsOpen: false
  },
  {
      id: 'p3', type: 'METRICS', title: 'Metrics', w: 4, h: 4,
      config: { '1': { visible: true, selectedSignals: ['ABP', 'CO', 'CVP'] } },
      isSettingsOpen: false
  }
];

const DEFAULT_WORKBENCH_LAYOUT: WorkbenchLayoutState = {
  controlsSide: 'left',
  controlsWidth: 320,
  caseRailWidth: 260,
  outputHeight: 190,
};

function layoutStateFromWorkspace(workspace?: WorkbenchWorkspace): WorkbenchLayoutState {
  const controlPosition = workspace?.regions.control?.position;
  const controlsSide: WorkbenchControlsSide = controlPosition === 'right' ? 'right' : 'left';
  return {
    controlsSide,
    controlsWidth: workspace?.regions.control?.size ?? DEFAULT_WORKBENCH_LAYOUT.controlsWidth,
    caseRailWidth: workspace?.regions.note?.size ?? DEFAULT_WORKBENCH_LAYOUT.caseRailWidth,
    outputHeight: workspace?.regions.output?.size ?? DEFAULT_WORKBENCH_LAYOUT.outputHeight,
  };
}

function getStoredWorkbenchTheme(): WorkbenchThemeId {
  if (typeof localStorage === 'undefined') return DEFAULT_WORKBENCH_THEME;
  const stored = localStorage.getItem(WORKBENCH_THEME_STORAGE_KEY);
  return WORKBENCH_THEMES.has(stored as WorkbenchThemeId) ? (stored as WorkbenchThemeId) : DEFAULT_WORKBENCH_THEME;
}

function cloneInitialPanels(): PanelDef[] {
  return INITIAL_PANELS.map((panel) => ({
    ...panel,
    config: Object.fromEntries(
      Object.entries(panel.config).map(([id, config]) => [id, { ...config, selectedSignals: [...config.selectedSignals] }]),
    ),
  }));
}

export function defaultSignalsForPanelType(type: PanelType): string[] {
  if (type === 'PVLOOP') return ['LV'];
  if (type === 'WAVEFORM') return ['LVP', 'AoP'];
  if (type === 'METRICS') return ['ABP', 'CO'];
  if (type === 'SCENARIOS') return [];
  if (type === 'CONTROLS') return ['clinical', 'Global', 'ventricles', 'fluids'];
  if (type === 'GUYTON_RIGHT' || type === 'GUYTON_LEFT' || type === 'GUYTON_3D') return ['Default'];
  return [];
}

export function addHiddenInstanceConfigsToPanels(panels: PanelDef[], ids: string[]): PanelDef[] {
  return panels.map((panel) => {
    let changed = false;
    const config = { ...panel.config };
    for (const id of ids) {
      if (config[id]) continue;
      config[id] = { visible: false, selectedSignals: defaultSignalsForPanelType(panel.type) };
      changed = true;
    }
    return changed ? { ...panel, config } : panel;
  });
}

export function mergePanelControllerItems(panel: PanelDef, items: ControllerItem[]): PanelDef {
  if (panel.type !== 'CONTROLS') return panel;

  const normalized = normalizeControllerItems(items).items;
  const baseView: ControlPanelView = panel.view?.kind === 'control'
    ? panel.view
    : (toTypedPanelView({ ...panel, type: 'CONTROLS', view: undefined }) as ControlPanelView);
  return {
    ...panel,
    view: {
      ...baseView,
      kind: 'control',
      controllerItems: normalized,
    },
  };
}

function resolveHeaderModeFromAuthor(author?: string, source?: CaseSource): WorkbenchHeaderMode {
  if (source?.kind === 'official') return 'learner';
  const normalized = author?.trim();
  if (!normalized) return 'sandbox';
  if (normalized === LOCAL_COPY_AUTHOR) return 'sandbox';
  return 'learner';
}

function inferCaseSource(doc: CaseDocument, opts: { trustedOfficial?: boolean } = {}): CaseSource | undefined {
  if (opts.trustedOfficial) return { kind: 'official', id: doc.meta.id };
  if (doc.source?.kind === 'official') return undefined;
  return doc.source;
}

function textFromNoteBlock(block: unknown): string {
  if (!block || typeof block !== 'object') return '';
  const content = (block as { content?: unknown }).content;
  if (!Array.isArray(content)) return '';
  return content
    .map((item) => item && typeof item === 'object' ? ((item as { text?: unknown }).text ?? '') : '')
    .filter((text): text is string => typeof text === 'string')
    .join(' ')
    .trim();
}

function noteExcerpt(note: NoteContent): string {
  const text = note.map(textFromNoteBlock).find(Boolean);
  return text ? (text.length > 96 ? `${text.slice(0, 93)}...` : text) : 'Empty note';
}

function Workbench() {
  const { caseId: routeCaseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin, signIn, loading: authLoading } = useAuth();
  // --- State ---
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [workbenchTheme, setWorkbenchTheme] = useState<WorkbenchThemeId>(getStoredWorkbenchTheme);
  
  // Instance Management
  const [instances, setInstances] = useState<SimInstance[]>([
      { 
          id: '1', name: 'Heart A', color: INSTANCE_COLORS[0], 
          params: { ...DEFAULT_PARAMS }, 
          targetVolume: 5600, 
          isVisible: true 
      }
  ]);
  const [activeInstanceId, setActiveInstanceId] = useState<string>('1');

  // Health UX (ROADMAP S1): computed in the PreviewController, surfaced via callbacks.
  const [instanceHealth, setInstanceHealth] = useState<Record<string, SimulationHealth>>({});
  const [healthToasts, setHealthToasts] = useState<HealthToast[]>([]);
  // Stable identity so a toast's 6s auto-dismiss timer isn't reset by re-renders.
  const dismissToast = useCallback((id: string) => setHealthToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const pushWarningToast = useCallback((name: string, message: string) => {
    const toast: HealthToast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      status: 'warning',
      message,
    };
    setHealthToasts((prev) => [...prev, toast].slice(-3));
  }, []);
  const userEditedRef = useRef(false);
  const lastLoadedCaseIdRef = useRef<string | null>(null);
  const loadNonceRef = useRef(0);
  const [noteCaseKey, setNoteCaseKey] = useState('draft');
  const [notes, setNotes] = useState<Record<string, NoteContent>>({});
  const [noteModes, setNoteModes] = useState<Record<string, 'read' | 'edit'>>({});
  const [sceneMeta, setSceneMeta] = useState<WorkbenchSceneMeta>({
    title: 'Untitled scene',
    description: '',
    modelLimitations: DEFAULT_MODEL_LIMITATIONS,
  });
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [savedLesson, setSavedLesson] = useState<{ id: string; title: string } | null>(null);
  const [stepsDraft, setStepsDraft] = useState<LessonStep[]>([]);
  const [authoringMode, setAuthoringMode] = useState(false);
  const [lessonDraftId, setLessonDraftId] = useState<string | null>(null);
  const [publishedLesson, setPublishedLesson] = useState<{ id: string; title: string; url: string } | null>(null);
  const [isPublishingLesson, setIsPublishingLesson] = useState(false);
  const [caseAuthor, setCaseAuthor] = useState<string | undefined>(undefined);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [currentCaseOwnerId, setCurrentCaseOwnerId] = useState<string | undefined>(undefined);
  const [currentCaseCreatedAt, setCurrentCaseCreatedAt] = useState<number | undefined>(undefined);
  const [currentCaseSource, setCurrentCaseSource] = useState<CaseSource | undefined>(undefined);
  const [currentCaseDerivedFrom, setCurrentCaseDerivedFrom] = useState<string | undefined>(undefined);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const fromParam = searchParams.get('from');
  const ownsCurrentCase = Boolean(user && currentCaseOwnerId === user.uid);
  const headerMode: WorkbenchHeaderMode = authoringMode
    ? 'author'
    : ownsCurrentCase || caseAuthor === LOCAL_COPY_AUTHOR
      ? 'sandbox'
      : resolveHeaderModeFromAuthor(caseAuthor, currentCaseSource);
  const backTarget = fromParam === 'cases'
    ? { href: '/cases', label: 'Cases' }
    : fromParam === 'lesson'
      ? { href: '/', label: 'Home' }
      : { href: '/', label: 'Home' };

  // --- Panel Management State ---
  const [panels, setPanels] = useState<PanelDef[]>(cloneInitialPanels);
  const [workspace, setWorkspace] = useState<WorkbenchWorkspace>(() => workspaceForPanels(INITIAL_PANELS));
  const [workbenchLayout, setWorkbenchLayoutState] = useState<WorkbenchLayoutState>(DEFAULT_WORKBENCH_LAYOUT);
  const [dockviewLayoutVersion, setDockviewLayoutVersion] = useState(0);
  const setWorkbenchLayout: React.Dispatch<React.SetStateAction<WorkbenchLayoutState>> = useCallback((next) => {
    setWorkbenchLayoutState((prevLayout) => {
      const resolved = typeof next === 'function' ? next(prevLayout) : next;
      setWorkspace((prevWorkspace) => ({
        ...prevWorkspace,
        regions: {
          ...prevWorkspace.regions,
          control: {
            ...prevWorkspace.regions.control,
            position: resolved.controlsSide,
            size: resolved.controlsWidth,
          },
          note: {
            ...prevWorkspace.regions.note,
            size: resolved.caseRailWidth,
          },
          output: {
            ...prevWorkspace.regions.output,
            size: resolved.outputHeight,
          },
        },
      }));
      return resolved;
    });
    if (headerMode !== 'learner') userEditedRef.current = true;
  }, [headerMode]);

  // --- Simulation driver (ROADMAP S3a): the loop + cores live here, not in React. ---
  const controllerRef = useRef<PreviewController | null>(null);
  const controller = (controllerRef.current ??= new PreviewController());
  // Stable handle to the driver's live buffers, consumed by the chart panels.
  const physicsRefs = useRef(controller.refs);

  // Window Resize Hook for Mobile Detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(WORKBENCH_THEME_STORAGE_KEY, workbenchTheme);
  }, [workbenchTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.workbenchTheme = workbenchTheme;
    return () => {
      if (document.body.dataset.workbenchTheme === workbenchTheme) {
        delete document.body.dataset.workbenchTheme;
      }
    };
  }, [workbenchTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const timers = new WeakMap<Element, number>();
    const scrollableSelector = '.custom-scrollbar, .workbench-dockview .dv-scrollable';
    const handleScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const scrollable = target.closest(scrollableSelector);
      if (!scrollable) return;
      scrollable.classList.add('is-scrolling');
      const previousTimer = timers.get(scrollable);
      if (previousTimer) window.clearTimeout(previousTimer);
      timers.set(scrollable, window.setTimeout(() => {
        scrollable.classList.remove('is-scrolling');
        timers.delete(scrollable);
      }, 850));
    };
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // Wire driver callbacks and start the loop once. Declared BEFORE the
  // setInstances effect so callbacks are live before the first reconcile.
  useEffect(() => {
    controller.onHealthChange = (map) => setInstanceHealth(map);
    controller.onToasts = (toasts) => setHealthToasts((prev) => [...prev, ...toasts].slice(-3));
    controller.onInstancesAdded = (ids) => {
      setPanels((prev) => addHiddenInstanceConfigsToPanels(prev, ids));
    };
    controller.start();
    return () => controller.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push UI state into the driver.
  useEffect(() => { controller.setInstances(instances); }, [instances]);
  useEffect(() => { controller.setTimeScale(timeScale); }, [timeScale]);
  useEffect(() => { controller.setPlaying(isPlaying); }, [isPlaying]);

  // --- Save / load: canonical knob-primary CaseDocument, portable local files,
  // local draft cache, and Firestore-owned user cases. ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultSceneTitle = () => sceneMeta.title.trim() || (instances[0] ? `${instances[0].name} scene` : 'Workbench scene');

  const buildCurrentDoc = (overrides: {
    id?: string;
    title?: string;
    author?: string;
    ownerId?: string;
    status?: CaseStatus;
    visibility?: CaseVisibility;
    source?: CaseSource;
    derivedFrom?: string;
    createdAt?: number;
    updatedAt?: number;
    includeNotes?: boolean;
  } = {}): CaseDocument => {
    const now = Date.now();
    const title = overrides.title ?? defaultSceneTitle();
    const modelLimitations = sceneMeta.modelLimitations.length > 0 ? sceneMeta.modelLimitations : DEFAULT_MODEL_LIMITATIONS;
    return simInstancesToCaseDocument(instances, panels, {
      id: overrides.id ?? `wb-${now}`,
      title,
      author: overrides.author ?? caseAuthor,
      ownerId: overrides.ownerId ?? currentCaseOwnerId,
      status: overrides.status,
      visibility: overrides.visibility,
      source: overrides.source ?? currentCaseSource,
      derivedFrom: overrides.derivedFrom ?? currentCaseDerivedFrom,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      spec: {
        title,
        ...(sceneMeta.description.trim() ? { description: sceneMeta.description.trim() } : {}),
        modelLimitations,
      },
      workspace: workspaceForPanels(panels, workspace),
      notes: overrides.includeNotes === false ? undefined : notes,
    });
  };

  const markUserEdited = () => { userEditedRef.current = true; };
  const updateDockviewViewState = useCallback((zone: WorkbenchZoneId, viewState: DockviewViewState) => {
    setWorkspace((prev) => workspaceForPanels(panels, {
      ...prev,
      viewStates: { ...(prev.viewStates ?? {}), [zone]: viewState },
    }));
    if (headerMode !== 'learner') userEditedRef.current = true;
  }, [headerMode, panels]);

  const replaceWorkbenchDoc = useCallback((doc: CaseDocument, opts: { confirm: boolean; trustedOfficial?: boolean }) => {
    if (opts.confirm && !window.confirm('Load this case? It will replace the current scene; unsaved changes are lost.')) return false;

    try {
      const loaded = caseDocumentToSimInstances(doc); // throws on unknown version/schema
      const nonce = `${Date.now().toString(36)}${(loadNonceRef.current++).toString(36)}`;
      const remapped = remapWorkbenchLoadIds(loaded, doc.panels, nonce);

      setInstances(remapped.instances);
      setPanels(remapped.panels);
      const nextWorkspace = workspaceForPanels(remapped.panels, doc.workspace);
      setWorkspace(nextWorkspace);
      setWorkbenchLayoutState(layoutStateFromWorkspace(nextWorkspace));
      setDockviewLayoutVersion((value) => value + 1);
      setSceneMeta({
        title: doc.spec.title || 'Untitled scene',
        description: doc.spec.description ?? '',
        modelLimitations: doc.spec.modelLimitations.length > 0 ? doc.spec.modelLimitations : DEFAULT_MODEL_LIMITATIONS,
      });
      setCaseAuthor(doc.meta.author);
      setCurrentCaseId(doc.meta.id);
      setCurrentCaseOwnerId(doc.ownerId);
      setCurrentCaseCreatedAt(doc.meta.createdAt);
      setCurrentCaseSource(inferCaseSource(doc, { trustedOfficial: opts.trustedOfficial || doc.visibility === 'official' }));
      setCurrentCaseDerivedFrom(doc.derivedFrom);
      setNotes(doc.notes ?? {});
      setNoteModes({});
      setNoteCaseKey(`${doc.meta.id}:${nonce}`);
      setActiveInstanceId(remapped.activeInstanceId);
      setStepsDraft([]);
      setIsLessonDialogOpen(false);
      setAuthoringMode(false);
      setSavedLesson(null);
      setLessonDraftId(null);
      setPublishedLesson(null);
      userEditedRef.current = false;
      return true;
    } catch (err) {
      pushWarningToast('Case load', (err as Error).message);
      return false;
    }
  }, [pushWarningToast]);

  useEffect(() => {
    const caseId = routeCaseId ?? searchParams.get('case');
    if (!caseId || caseId === lastLoadedCaseIdRef.current) return;

    let cancelled = false;
    const localDoc = officialCaseById(caseId);
    if (!localDoc && authLoading) return;
    const loadDoc = async (): Promise<{ doc: CaseDocument; trustedOfficial: boolean } | undefined> => {
      if (localDoc) return { doc: localDoc, trustedOfficial: true };
      const cloudDoc = await fetchCase(caseId);
      return cloudDoc ? { doc: cloudDoc, trustedOfficial: cloudDoc.visibility === 'official' } : undefined;
    };

    loadDoc().then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        lastLoadedCaseIdRef.current = caseId;
        pushWarningToast('Case route', `Unknown case "${caseId}" — loaded the default scene`);
        return;
      }

      if (replaceWorkbenchDoc(loaded.doc, {
        confirm: userEditedRef.current || stepsDraft.length > 0,
        trustedOfficial: loaded.trustedOfficial,
      })) {
        lastLoadedCaseIdRef.current = caseId;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, routeCaseId, searchParams, replaceWorkbenchDoc, pushWarningToast, stepsDraft.length]);

  const handleExport = () => {
    try { exportCaseFile(buildCurrentDoc()); }
    catch (err) { window.alert(`Export failed: ${(err as Error).message}`); }
  };

  const cacheCurrentDraft = (doc: CaseDocument) => {
    saveDraft(doc);
    userEditedRef.current = false;
  };

  const signedInUserForCaseSave = async () => {
    if (user) return user;
    const signedIn = await signIn();
    if (!signedIn) {
      pushWarningToast('Case save', 'Sign in is required to save a case.');
      return null;
    }
    return signedIn;
  };

  const userDisplayName = (activeUser: NonNullable<typeof user>) => (
    activeUser.displayName?.trim() || activeUser.email?.trim() || 'User case'
  );

  const saveCurrentCaseToCloud = async (opts: { copy: boolean }) => {
    if (isSavingCase) return;

    const activeUser = await signedInUserForCaseSave();
    if (!activeUser) return;

    const now = Date.now();
    const canUpdateCurrentCase = !opts.copy &&
      Boolean(currentCaseId && isValidCaseId(currentCaseId) && currentCaseOwnerId === activeUser.uid);
    const rawSourceCaseId = !canUpdateCurrentCase
      ? (currentCaseId ?? routeCaseId)
      : undefined;
    const sourceCaseId = rawSourceCaseId && isValidCaseId(rawSourceCaseId) ? rawSourceCaseId : undefined;
    const sourceTitle = sceneMeta.title.trim() || defaultSceneTitle();
    const title = opts.copy ? `${sourceTitle} copy` : sourceTitle;
    const sourceDescription = sceneMeta.description.trim();
    const description = opts.copy
      ? [sourceDescription, `Forked from ${sourceTitle}`].filter(Boolean).join('\n\n')
      : sourceDescription;
    const caseId = canUpdateCurrentCase
      ? currentCaseId!
      : createUserCaseId(title, activeUser.uid, now);
    const source: CaseSource = canUpdateCurrentCase
      ? (currentCaseSource ?? { kind: 'authored' })
      : sourceCaseId
        ? { kind: 'remix', caseId: sourceCaseId }
        : { kind: 'authored' };
    const derivedFrom = canUpdateCurrentCase ? currentCaseDerivedFrom : sourceCaseId;
    const caseDoc = buildCurrentDoc({
      id: caseId,
      title,
      author: userDisplayName(activeUser),
      ownerId: activeUser.uid,
      status: 'draft',
      visibility: 'private',
      source,
      derivedFrom,
      createdAt: canUpdateCurrentCase ? (currentCaseCreatedAt ?? now) : now,
      updatedAt: now,
    });
    const nextDoc: CaseDocument = {
      ...caseDoc,
      meta: {
        ...caseDoc.meta,
        title,
        updatedAt: now,
      },
      spec: {
        ...caseDoc.spec,
        title,
        ...(description ? { description } : {}),
      },
    };

    setIsSavingCase(true);
    try {
      const result = await saveCase(nextDoc, activeUser.uid, { visibility: 'private', kind: 'case' });
      if (result.ok === false) {
        const details = [result.code, result.message].filter(Boolean).join(': ');
        pushWarningToast('Case save', details || 'Case save failed.');
        return;
      }

      cacheCurrentDraft(nextDoc);
      setSceneMeta({
        title,
        description,
        modelLimitations: nextDoc.spec.modelLimitations,
      });
      setCaseAuthor(nextDoc.meta.author);
      setCurrentCaseId(caseId);
      setCurrentCaseOwnerId(activeUser.uid);
      setCurrentCaseCreatedAt(nextDoc.meta.createdAt);
      setCurrentCaseSource(source);
      setCurrentCaseDerivedFrom(derivedFrom);
      setAuthoringMode(false);
      setSavedLesson(null);
      setPublishedLesson(null);
      lastLoadedCaseIdRef.current = caseId;
      navigate(`/workbench/${encodeURIComponent(caseId)}?from=cases`, { replace: true });
      pushWarningToast('Case save', opts.copy ? 'Created an editable copy.' : 'Saved case.');
    } finally {
      setIsSavingCase(false);
    }
  };

  const openLessonDialog = () => {
    setLessonTitle(savedLesson?.title ?? defaultSceneTitle());
    setIsLessonDialogOpen(true);
  };

  const buildLessonDraft = (id: string, title: string, now: number): { lesson?: Lesson; message?: string } => {
    const notePanel = panels.find((panel) => panel.type === 'NOTE');
    const noteSpine = notePanel ? (notes[notePanel.id] ?? EMPTY_NOTE_SPINE) : EMPTY_NOTE_SPINE;
    const caseDoc = buildCurrentDoc({ id, title, createdAt: now, updatedAt: now, includeNotes: false });
    const normalizedSteps = normalizeStepsForSave(stepsDraft, caseDoc.instances.map((instance) => instance.id));
    if (normalizedSteps.ok === false) return { message: normalizedSteps.message };

    return {
      lesson: {
        meta: { id, title, createdAt: now },
        case: caseDoc,
        noteSpine,
        ...(normalizedSteps.steps ? { steps: normalizedSteps.steps } : {}),
      },
    };
  };

  const nextLessonId = (now: number) => savedLesson?.id ?? lessonDraftId ?? createUserLessonId(now);

  const saveCurrentLesson = () => {
    try {
      const title = lessonTitle.trim() || defaultSceneTitle();
      const now = Date.now();
      const id = nextLessonId(now);
      const draft = buildLessonDraft(id, title, now);
      if (!draft.lesson) {
        pushWarningToast('Lesson save', draft.message ?? 'Could not build this lesson.');
        return;
      }

      if (!saveLesson(draft.lesson) || !getUserLesson(id)) {
        pushWarningToast('Lesson save', 'Could not save this lesson locally.');
        return;
      }
      setSavedLesson({ id, title });
      setLessonDraftId(id);
      setIsLessonDialogOpen(false);
    } catch (err) {
      pushWarningToast('Lesson save', (err as Error).message);
    }
  };

  const shareUrlFor = (id: string) => `${window.location.origin}/lesson/${encodeURIComponent(id)}`;

  const copyShareUrl = async () => {
    if (!publishedLesson) return;
    try {
      await navigator.clipboard.writeText(publishedLesson.url);
      pushWarningToast('Lesson publish', 'Share URL copied.');
    } catch {
      pushWarningToast('Lesson publish', 'Could not copy the share URL.');
    }
  };

  const publishCurrentLesson = async () => {
    if (isPublishingLesson) return;
    if (!user) {
      await signIn();
      pushWarningToast('Lesson publish', 'Signed in. If this account is admin, click Publish again.');
      return;
    }
    if (!isAdmin) {
      pushWarningToast('Lesson publish', '公開権限がない/規則未デプロイ: current user is not an admin.');
      return;
    }

    const now = Date.now();
    const id = nextLessonId(now);
    const title = savedLesson?.title ?? (lessonTitle.trim() || defaultSceneTitle());
    const draft = buildLessonDraft(id, title, now);
    if (!draft.lesson) {
      pushWarningToast('Lesson publish', draft.message ?? 'Could not build this lesson.');
      return;
    }

    setIsPublishingLesson(true);
    try {
      const result = await publishLesson(draft.lesson, user.uid);
      if (result.ok === false) {
        const details = result.code === 'permission-denied'
          ? `公開権限がない/規則未デプロイ (${result.code})`
          : [result.code, result.message].filter(Boolean).join(': ');
        pushWarningToast('Lesson publish', details || 'Lesson publish failed.');
        return;
      }

      const url = shareUrlFor(id);
      setLessonDraftId(id);
      setPublishedLesson({ id, title, url });
      pushWarningToast('Lesson publish', 'Published. Share URL is ready.');
    } finally {
      setIsPublishingLesson(false);
    }
  };

  const handleImportFile = async (file: File) => {
    try { replaceWorkbenchDoc(await readCaseFile(file), { confirm: userEditedRef.current || stepsDraft.length > 0 }); }
    catch (err) { window.alert(`Import failed: ${(err as Error).message}`); }
  };

  // Raw (advanced) edit. resolveRawEdit composes with the clinical knobs when the
  // instance is knob-primary (absolute-knob keys route to the knob; the rest edit
  // the authored baseline) and is a plain param edit otherwise. See engine/instanceKnobs.
  const updateInstanceParams = (id: string, newParams: Partial<SimulationParams>) => {
      markUserEdited();
      setInstances(prev => prev.map(inst =>
          inst.id === id
            ? { ...inst, ...resolveRawEdit({ params: inst.params, knobs: inst.knobs, knobBaseline: inst.knobBaseline }, newParams) }
            : inst
      ));
  };

  // Clinical knob edit: makes the instance knob-primary, deriving params.
  const updateInstanceKnobs = (id: string, newKnobs: ClinicalKnobs) => {
      markUserEdited();
      setInstances(prev => prev.map(inst =>
          inst.id === id
            ? { ...inst, ...resolveKnobEdit({ params: inst.params, knobs: inst.knobs, knobBaseline: inst.knobBaseline }, newKnobs) }
            : inst
      ));
  };
  
  const updateInstanceVolume = (id: string, vol: number) => {
      markUserEdited();
      setInstances(prev => prev.map(inst =>
          inst.id === id ? { ...inst, targetVolume: vol } : inst
      ));
      controller.setInstanceVolume(id, vol);
  }

  const updateInstanceColor = (id: string, color: string) => {
      markUserEdited();
      setInstances(prev => prev.map(inst => 
        inst.id === id ? { ...inst, color: color } : inst
    ));
  }
  
  const addInstance = (sourceId?: string, presetId?: string) => {
      markUserEdited();
      const newId = Date.now().toString();
      const color = INSTANCE_COLORS[instances.length % INSTANCE_COLORS.length];
      const preset = presetId ? OFFICIAL_BASELINES[presetId] : undefined;
      const sourceInstance = preset ? undefined : instances.find(i => i.id === (typeof sourceId === 'string' ? sourceId : activeInstanceId));
      const initialParams = preset
        ? JSON.parse(JSON.stringify(preset.params))
        : sourceInstance
          ? JSON.parse(JSON.stringify(sourceInstance.params))
          : { ...DEFAULT_PARAMS };
      const initialVol = preset ? preset.targetVolume : sourceInstance ? sourceInstance.targetVolume : 5600;
      // Preserve knob-primary state when duplicating, so a copied instance keeps
      // its clinical knobs / authored baseline instead of degrading to raw-only.
      const initialKnobs = sourceInstance?.knobs ? JSON.parse(JSON.stringify(sourceInstance.knobs)) : undefined;
      const initialKnobBaseline = sourceInstance?.knobBaseline ? JSON.parse(JSON.stringify(sourceInstance.knobBaseline)) : undefined;

      const baseName = preset
        ? preset.label.replace(/\s*\([^)]*\)\s*$/, '')
        : sourceInstance
          ? `${sourceInstance.name} (Copy)`
          : 'New Scenario';
      const existingNames = new Set(instances.map((instance) => instance.name));
      let name = baseName;
      let suffix = 2;
      while (existingNames.has(name)) {
        name = `${baseName} ${suffix}`;
        suffix += 1;
      }

      setInstances(prev => [...prev, {
          id: newId,
          name: name,
          color,
          params: initialParams,
          targetVolume: initialVol,
          isVisible: true,
          knobs: initialKnobs,
          knobBaseline: initialKnobBaseline
      }]);
      
      setPanels(prev => addHiddenInstanceConfigsToPanels(prev, [newId]));
  };
  
  const removeInstance = (id: string) => {
      markUserEdited();
      setInstances(prev => {
          const next = prev.filter(i => i.id !== id);
          if (activeInstanceId === id) setActiveInstanceId(next[0]?.id || '');
          return next;
      });
  };

  const updateInstanceName = (id: string, name: string) => {
      markUserEdited();
      setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, name } : inst));
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const [addingPanelType, setAddingPanelType] = useState<PanelType | null>(null);
  const [addingPanelZone, setAddingPanelZone] = useState<WorkbenchZoneId | null>(null);
  const [addingPanelConfig, setAddingPanelConfig] = useState<Record<string, PanelInstanceConfig>>({});

  const createDefaultPanelConfig = (type: PanelType): Record<string, PanelInstanceConfig> => (
      Object.fromEntries(instances.map((instance) => [
          instance.id,
          { visible: type !== 'NOTE', selectedSignals: defaultSignalsForPanelType(type) },
      ]))
  );

  const titleForPanelType = (type: PanelType) => {
      if (type === 'PVLOOP') return 'PV Loop';
      if (type === 'WAVEFORM') return 'Waveforms';
      if (type === 'METRICS') return 'Metrics';
      if (type === 'SCENARIOS') return 'Scenarios';
      if (type === 'CONTROLS') return 'Controls';
      if (type === 'NOTE') return 'Notes';
      if (type === 'GUYTON_LEFT') return 'Guyton Left';
      if (type === 'GUYTON_RIGHT') return 'Guyton Right';
      return 'Guyton';
  };

  const createPanelDef = (type: PanelType, config: Record<string, PanelInstanceConfig>, zone: WorkbenchZoneId = defaultZoneOf(type)): PanelDef => ({
      id: Date.now().toString(),
      type,
      zone,
      title: titleForPanelType(type),
      w: type === 'NOTE' ? 6 : type === 'METRICS' ? 4 : type === 'CONTROLS' || type === 'SCENARIOS' ? 4 : 6,
      h: type === 'NOTE' ? 10 : type === 'METRICS' ? 6 : type === 'CONTROLS' ? 10 : type === 'SCENARIOS' ? 4 : 8,
      config,
      isSettingsOpen: false,
      showGuides: type === 'PVLOOP',
      timeWindow: type === 'WAVEFORM' ? 5000 : undefined,
  });

  const appendPanel = (newPanel: PanelDef) => {
      markUserEdited();
      setPanels(prev => {
          const nextPanels = addPane(prev, newPanel);
          setWorkspace((prevWorkspace) => workspaceForPanels(nextPanels, prevWorkspace));
          return nextPanels;
      });
      if (newPanel.type === 'NOTE') {
          setNotes(prev => ({ ...prev, [newPanel.id]: EMPTY_NOTE_SPINE }));
          setNoteModes(prev => ({ ...prev, [newPanel.id]: 'edit' }));
      }
  };

  const addPanel = (type: PanelType, zone?: WorkbenchZoneId) => {
      const newConfig = createDefaultPanelConfig(type);
      if (type === 'NOTE' || type === 'SCENARIOS') {
          appendPanel(createPanelDef(type, newConfig, zone));
          return;
      }
      setAddingPanelConfig(newConfig);
      setAddingPanelType(type);
      setAddingPanelZone(zone ?? defaultZoneOf(type));
  };
  
  const confirmAddPanel = () => {
      if (!addingPanelType) return;
      const type = addingPanelType;
      appendPanel(createPanelDef(type, addingPanelConfig, addingPanelZone ?? defaultZoneOf(type)));
      setAddingPanelType(null);
      setAddingPanelZone(null);
  };

  const removePanel = (id: string) => {
      markUserEdited();
      setPanels(prev => {
          const nextPanels = removePane(prev, id);
          setWorkspace((prevWorkspace) => workspaceForPanels(nextPanels, prevWorkspace));
          return nextPanels;
      });
      setNotes(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
      });
      setNoteModes(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
      });
  };
  
  const updatePanelTitle = (id: string, newTitle: string) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p)); };
  const toggleShowLegend = (id: string) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === id ? { ...p, showLegend: p.showLegend === false ? true : false } : p)); };
  const updatePanelInstanceColor = (panelId: string, instId: string, newColor: string) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === panelId ? { ...p, config: { ...p.config, [instId]: { ...p.config[instId], customBaseColor: newColor } } } : p)); };
  const updatePanelInstanceName = (panelId: string, instId: string, newName: string) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === panelId ? { ...p, config: { ...p.config, [instId]: { ...p.config[instId], customName: newName } } } : p)); };
  const updatePanelSignalColor = (panelId: string, instId: string, sig: string, newColor: string) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === panelId ? { ...p, config: { ...p.config, [instId]: { ...p.config[instId], customSignalColors: { ...(p.config[instId].customSignalColors || {}), [sig]: newColor } } } } : p)); };
  const updatePanelSignalName = (panelId: string, instId: string, sig: string, newName: string) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === panelId ? { ...p, config: { ...p.config, [instId]: { ...p.config[instId], customSignalNames: { ...(p.config[instId].customSignalNames || {}), [sig]: newName } } } } : p)); };

  const toggleSettings = (panelId: string) => setPanels(prev => prev.map(p => p.id === panelId ? { ...p, isSettingsOpen: !p.isSettingsOpen } : { ...p, isSettingsOpen: false }));
  const toggleInstanceVisibility = (panelId: string, instId: string) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === panelId ? { ...p, config: { ...p.config, [instId]: { ...p.config[instId], visible: !p.config[instId].visible } } } : p)); };
  const updateInstanceSignals = (panelId: string, instId: string, signal: string) => {
    markUserEdited();
    setPanels(prev => prev.map(p => {
      if (p.id !== panelId) return p;
      const currentSigs = new Set(p.config[instId].selectedSignals);
      if (currentSigs.has(signal)) currentSigs.delete(signal); else currentSigs.add(signal);
      return { ...p, config: { ...p.config, [instId]: { ...p.config[instId], selectedSignals: Array.from(currentSigs) } } };
    }));
  };
  const toggleGuides = (panelId: string) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === panelId ? { ...p, showGuides: !p.showGuides } : p)); };
  const updateTimeWindow = (panelId: string, val: number) => { markUserEdited(); setPanels(prev => prev.map(p => p.id === panelId ? { ...p, timeWindow: val } : p)); };
  const updatePanelControllerItems = (panelId: string, items: ControllerItem[]) => {
    markUserEdited();
    setPanels(prev => prev.map(p => p.id === panelId ? mergePanelControllerItems(p, items) : p));
  };

  const updateSceneMeta = (next: WorkbenchSceneMeta) => {
    setSceneMeta(next);
    markUserEdited();
  };

  const runHeaderPrimaryAction = () => {
    if (headerMode === 'learner') {
      void saveCurrentCaseToCloud({ copy: true });
      return;
    }
    void saveCurrentCaseToCloud({ copy: false });
  };

  const setWorkbenchAuthoringMode: React.Dispatch<React.SetStateAction<boolean>> = (next) => {
    const resolved = typeof next === 'function' ? next(authoringMode) : next;
    if (resolved && !caseAuthor && !currentCaseOwnerId) setCaseAuthor(LOCAL_COPY_AUTHOR);
    setAuthoringMode(resolved);
  };

  const resetWorkbenchLayout = () => {
    setWorkbenchLayout(DEFAULT_WORKBENCH_LAYOUT);
    setWorkspace((prev) => {
      const nextWorkspace = workspaceForPanels(panels, {
        ...prev,
        regions: {
          ...prev.regions,
          control: { ...prev.regions.control, position: DEFAULT_WORKBENCH_LAYOUT.controlsSide, size: DEFAULT_WORKBENCH_LAYOUT.controlsWidth },
          note: { ...prev.regions.note, size: DEFAULT_WORKBENCH_LAYOUT.caseRailWidth },
          output: { ...prev.regions.output, size: DEFAULT_WORKBENCH_LAYOUT.outputHeight },
        },
        viewStates: undefined,
      });
      const { viewStates: _viewStates, ...withoutViewStates } = nextWorkspace;
      return withoutViewStates;
    });
    setDockviewLayoutVersion((value) => value + 1);
  };

  return (
    <div
      className="workbench-root flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative"
      data-workbench-theme={workbenchTheme}
    >
      <WorkbenchHeader
        mode={headerMode}
        backHref={backTarget.href}
        backLabel={backTarget.label}
        sceneMeta={sceneMeta}
        onSceneMetaChange={updateSceneMeta}
        onPrimaryAction={runHeaderPrimaryAction}
        instances={instances}
        instanceHealth={instanceHealth}
        getLiveHealth={(id) => controller.getLiveHealth(id)}
        fileInputRef={fileInputRef}
        onImportFile={handleImportFile}
        onExport={handleExport}
        authoringMode={authoringMode}
        setAuthoringMode={setWorkbenchAuthoringMode}
        stepsDraftLength={stepsDraft.length}
        openLessonDialog={openLessonDialog}
        onExitAuthoring={() => { setIsLessonDialogOpen(false); setAuthoringMode(false); }}
        user={user}
        isAdmin={isAdmin}
        publishCurrentLesson={publishCurrentLesson}
        isPublishingLesson={isPublishingLesson}
        isSavingCase={isSavingCase}
        savedLesson={savedLesson}
        publishedLesson={publishedLesson}
        copyShareUrl={copyShareUrl}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        controlsSide={workbenchLayout.controlsSide}
        onControlsSideChange={(side) => setWorkbenchLayout((prev) => ({ ...prev, controlsSide: side }))}
        onResetLayout={resetWorkbenchLayout}
        theme={workbenchTheme}
        onThemeChange={setWorkbenchTheme}
      />

      <PanelGrid
        authoringMode={authoringMode}
        publishedLesson={publishedLesson}
        copyShareUrl={copyShareUrl}
        instances={instances}
        stepsDraft={stepsDraft}
        setStepsDraft={setStepsDraft}
        panels={panels}
        layoutState={workbenchLayout}
        onLayoutStateChange={setWorkbenchLayout}
        dockviewLayoutKey={`${noteCaseKey}:${dockviewLayoutVersion}`}
        dockviewViewStates={workspace.viewStates}
        onDockviewViewStateChange={updateDockviewViewState}
        mode={headerMode}
        isMobile={isMobile}
        noteModes={noteModes}
        setNoteModes={setNoteModes}
        physicsRefs={physicsRefs}
        instanceHealth={instanceHealth}
        activeInstanceId={activeInstanceId}
        setActiveInstanceId={setActiveInstanceId}
        updateInstanceParams={updateInstanceParams}
        updateInstanceKnobs={updateInstanceKnobs}
        updateInstanceVolume={updateInstanceVolume}
        updateInstanceColor={updateInstanceColor}
        updateInstanceName={updateInstanceName}
        addInstance={addInstance}
        removeInstance={removeInstance}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        addPanel={addPanel}
        removePanel={removePanel}
        updatePanelTitle={updatePanelTitle}
        toggleShowLegend={toggleShowLegend}
        updatePanelInstanceColor={updatePanelInstanceColor}
        updatePanelInstanceName={updatePanelInstanceName}
        updatePanelSignalColor={updatePanelSignalColor}
        updatePanelSignalName={updatePanelSignalName}
        toggleSettings={toggleSettings}
        toggleInstanceVisibility={toggleInstanceVisibility}
        updateInstanceSignals={updateInstanceSignals}
        toggleGuides={toggleGuides}
        updateTimeWindow={updateTimeWindow}
        updatePanelControllerItems={updatePanelControllerItems}
        noteCaseKey={noteCaseKey}
        notes={notes}
        onNoteChange={(panelId, blocks) => {
          setNotes((prev) => ({ ...prev, [panelId]: blocks }));
          markUserEdited();
        }}
        chambers={ALL_CHAMBERS}
        signals={ALL_SIGNALS}
        metrics={ALL_METRICS}
        controlGroups={ALL_CONTROL_GROUPS}
      />

      {addingPanelType && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-lg">
                  <h2 className="text-lg font-bold text-slate-200 mb-4 tracking-tight">Configure {addingPanelType} Panel</h2>
                  
                  <div className="max-h-[60vh] overflow-y-auto space-y-4 mb-6 custom-scrollbar pr-2">
                       {instances.map(inst => (
                           <div key={inst.id} className="bg-slate-800/50 p-3 rounded border border-slate-700">
                               <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center gap-3">
                                       <input 
                                         type="checkbox" 
                                         className="w-4 h-4 cursor-pointer accent-blue-500"
                                         checked={addingPanelConfig[inst.id]?.visible || false} 
                                         onChange={() => setAddingPanelConfig(prev => ({
                                             ...prev, [inst.id]: { ...prev[inst.id], visible: !prev[inst.id]?.visible }
                                         }))} 
                                       />
                                       <div className="flex items-center gap-2">
                                           <span className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: inst.color}}></span>
                                           <span className="text-sm font-bold text-slate-300">{inst.name}</span>
                                       </div>
                                   </div>
                               </div>
                               {addingPanelConfig[inst.id]?.visible && addingPanelType !== 'GUYTON_RIGHT' && addingPanelType !== 'GUYTON_LEFT' && (
                                   <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/50">
                                        {((addingPanelType === 'PVLOOP' ? ALL_CHAMBERS : (addingPanelType === 'WAVEFORM' ? ALL_SIGNALS : addingPanelType === 'METRICS' ? ALL_METRICS : ALL_CONTROL_GROUPS))).map(sig => {
                                             const isSelected = addingPanelConfig[inst.id]?.selectedSignals.includes(sig);
                                             return (
                                                <button 
                                                    key={sig} 
                                                    onClick={() => {
                                                        setAddingPanelConfig(prev => {
                                                            const currentSigs = new Set(prev[inst.id].selectedSignals);
                                                            if (currentSigs.has(sig)) currentSigs.delete(sig); else currentSigs.add(sig);
                                                            return { ...prev, [inst.id]: { ...prev[inst.id], selectedSignals: Array.from(currentSigs) } };
                                                        });
                                                    }}
                                                    className={`py-1.5 px-2 text-xs rounded transition-colors text-center font-mono ${isSelected ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-600'}`}
                                                >
                                                    {sig}
                                                </button>
                                             );
                                        })}
                                   </div>
                               )}
                           </div>
                       ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                      <button onClick={() => { setAddingPanelType(null); setAddingPanelZone(null); }} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                      <button onClick={confirmAddPanel} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded shadow transition-colors">Add Panel</button>
                  </div>
              </div>
          </div>
      )}

      {isLessonDialogOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-md">
                  <h2 className="text-lg font-bold text-slate-200 mb-4 tracking-tight">Save as lesson</h2>
                  <div className="space-y-4 mb-6">
                      <label className="block">
                          <span className="block text-xs font-bold text-slate-400 mb-2">Title</span>
                          <input
                              type="text"
                              value={lessonTitle}
                              onChange={(e) => setLessonTitle(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-blue-500 rounded px-3 py-2 text-sm font-medium text-slate-100"
                              autoFocus
                          />
                      </label>
                      <div className="rounded border border-slate-800 bg-slate-950/60 p-3">
                          <div className="text-xs font-bold text-slate-400 mb-1">Note spine</div>
                          <div className="text-sm text-slate-200 truncate">
                              {noteExcerpt(notes[panels.find((panel) => panel.type === 'NOTE')?.id ?? ''] ?? EMPTY_NOTE_SPINE)}
                          </div>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-950/60 p-3">
                          <div className="text-xs font-bold text-slate-400 mb-1">Captured steps</div>
                          <div className="text-sm text-slate-200">{stepsDraft.length} steps</div>
                      </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                      <button onClick={() => setIsLessonDialogOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                      <button onClick={saveCurrentLesson} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded shadow transition-colors">Save</button>
                  </div>
              </div>
          </div>
      )}

      <HealthToasts toasts={healthToasts} onDismiss={dismissToast} />
    </div>
  );
}

export default Workbench;
