import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PARAMS } from './constants';
import { SimulationParams, SimInstance, PanelDef, PanelType, PanelInstanceConfig, ChamberId, SignalType, MetricType } from './types';
import { SimulationHealth } from './engine/protocol';
import { type ClinicalKnobs } from './engine/knobs';
import { resolveRawEdit, resolveKnobEdit } from './engine/instanceKnobs';
import { type CaseDocument, simInstancesToCaseDocument, caseDocumentToSimInstances } from './caseDoc';
import { exportCaseFile, readCaseFile, saveDraft } from './casePersist';
import { officialCaseById } from './officialCases';
import { createUserLessonId, getUserLesson, saveLesson } from './lessonPersist';
import { publishLesson } from './lessonCloud';
import { normalizeStepsForSave } from './lessonAuthoring';
import type { Lesson, LessonStep } from './lessonDoc';
import { remapWorkbenchLoadIds } from './workbenchLoad';
import { useAuth } from './contexts/AuthContext';
import { HealthToasts, HealthToast } from './components/HealthIndicators';
import { PreviewController } from './engine/previewController';
import { ScenarioManager } from './components/ScenarioManager';
import { WorkbenchHeader } from './components/workbench/WorkbenchHeader';
import type { WorkbenchHeaderMode, WorkbenchSceneMeta } from './components/workbench/WorkbenchSidePanel';
import { PanelGrid } from './components/workbench/PanelGrid';
import type { NoteContent } from './noteTypes';
import { addPane, removePane } from './layoutOps';

// Colors for instances
const INSTANCE_COLORS = ['#a855f7', '#f472b6', '#22c55e', '#38bdf8', '#fbbf24'];

const ALL_CHAMBERS: ChamberId[] = ['LV', 'LA', 'RV', 'RA'];
const ALL_SIGNALS: SignalType[] = [
  'LVP', 'AoP', 'LAP', 'RVP', 'PAP', 'RAP',
  'QAo', 'QMV', 'QPA', 'QPV', 'QTV', 'PVF', 'SVF',
  'VRA', 'aRA', 'cRA', 'xiTV', 'xiPV', 'dP_TV', 'dP_PV',
  'Pperi', 'Ppc', 'VHeart', 'septumShiftMl', 'VLVeff', 'VRVeff',
  'PLVfw', 'PRVfw', 'PVI_LV', 'PVI_RV', 'septalForceMmHg',
];
const ALL_METRICS: MetricType[] = ['ABP', 'CVP', 'PAP', 'PCWP', 'SV', 'CO', 'LVEF'];
const ALL_CONTROL_GROUPS: string[] = ['clinical', 'Global', 'ventricles', 'atria', 'vascular', 'fluids', 'valves', 'resp', 'advanced'];
const DEFAULT_MODEL_LIMITATIONS = [
  '0D lumped-parameter closed-loop model — no regional wall motion or spatial flow.',
  'Active-stress single-fibre ventricles; parameters are not yet calibrated (M12).',
];
const EMPTY_NOTE_SPINE: NoteContent = [
  { type: 'paragraph', content: [{ type: 'text', text: '', styles: {} }] },
];

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
  const [searchParams] = useSearchParams();
  const { user, isAdmin, signIn } = useAuth();
  // --- State ---
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [isLayoutEditing, setIsLayoutEditing] = useState(false);
  
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
  const [isScenarioManagerOpen, setIsScenarioManagerOpen] = useState<boolean>(false);

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
  const fromParam = searchParams.get('from');
  const headerMode: WorkbenchHeaderMode = authoringMode ? 'author' : searchParams.get('case') ? 'learner' : 'sandbox';
  const layoutEditable = !isMobile && headerMode !== 'learner' && isLayoutEditing;
  const backTarget = fromParam === 'cases'
    ? { href: '/cases', label: 'Cases' }
    : fromParam === 'lesson'
      ? { href: '/', label: 'Home' }
      : { href: '/', label: 'Home' };

  // --- Panel Management State ---
  const [panels, setPanels] = useState<PanelDef[]>([
      {
          id: 'p_note', type: 'NOTE', title: 'Interactive Notes', w: 4, h: 10,
          config: {},
          isSettingsOpen: false
      },
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
  ]);

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
    if (isMobile || headerMode === 'learner') setIsLayoutEditing(false);
  }, [headerMode, isMobile]);

  // Wire driver callbacks and start the loop once. Declared BEFORE the
  // setInstances effect so callbacks are live before the first reconcile.
  useEffect(() => {
    controller.onHealthChange = (map) => setInstanceHealth(map);
    controller.onToasts = (toasts) => setHealthToasts((prev) => [...prev, ...toasts].slice(-3));
    controller.onInstancesAdded = (ids) => {
      setPanels((prev) => prev.map((p) => {
        let changed = false;
        const newConfig = { ...p.config };
        for (const id of ids) {
          if (newConfig[id]) continue;
          let defaultSigs: string[] = [];
          if (p.type === 'PVLOOP') defaultSigs = ['LV'];
          else if (p.type === 'WAVEFORM') defaultSigs = ['LVP', 'AoP'];
          else if (p.type === 'METRICS') defaultSigs = ['ABP', 'CO'];
          else if (p.type === 'CONTROLS') defaultSigs = ['clinical', 'Global', 'ventricles', 'fluids'];
          else if (p.type === 'GUYTON_RIGHT' || p.type === 'GUYTON_LEFT' || p.type === 'GUYTON_3D') defaultSigs = ['Default'];
          newConfig[id] = { visible: true, selectedSignals: defaultSigs };
          changed = true;
        }
        return changed ? { ...p, config: newConfig } : p;
      }));
    };
    controller.start();
    return () => controller.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push UI state into the driver.
  useEffect(() => { controller.setInstances(instances); }, [instances]);
  useEffect(() => { controller.setTimeScale(timeScale); }, [timeScale]);
  useEffect(() => { controller.setPlaying(isPlaying); }, [isPlaying]);

  // --- Save / load (ROADMAP #3-c): canonical knob-primary CaseDocument, local
  // file (.hemosim.json) + a localStorage working draft. No network/Firebase. ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultSceneTitle = () => sceneMeta.title.trim() || (instances[0] ? `${instances[0].name} scene` : 'Workbench scene');

  const buildCurrentDoc = (overrides: {
    id?: string;
    title?: string;
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
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      spec: {
        title,
        ...(sceneMeta.description.trim() ? { description: sceneMeta.description.trim() } : {}),
        modelLimitations,
      },
      notes: overrides.includeNotes === false ? undefined : notes,
    });
  };

  const markUserEdited = () => { userEditedRef.current = true; };

  const replaceWorkbenchDoc = useCallback((doc: CaseDocument, opts: { confirm: boolean }) => {
    if (opts.confirm && !window.confirm('Load this case? It will replace the current scene; unsaved changes are lost.')) return false;

    try {
      const loaded = caseDocumentToSimInstances(doc); // throws on unknown version/schema
      const nonce = `${Date.now().toString(36)}${(loadNonceRef.current++).toString(36)}`;
      const remapped = remapWorkbenchLoadIds(loaded, doc.panels, nonce);

      setInstances(remapped.instances);
      setPanels(remapped.panels);
      setSceneMeta({
        title: doc.spec.title || 'Untitled scene',
        description: doc.spec.description ?? '',
        modelLimitations: doc.spec.modelLimitations.length > 0 ? doc.spec.modelLimitations : DEFAULT_MODEL_LIMITATIONS,
      });
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
    const caseId = searchParams.get('case');
    if (!caseId || caseId === lastLoadedCaseIdRef.current) return;

    const doc = officialCaseById(caseId);
    if (!doc) {
      lastLoadedCaseIdRef.current = caseId;
      pushWarningToast('Case route', `Unknown case "${caseId}" — loaded the default scene`);
      return;
    }

    if (replaceWorkbenchDoc(doc, { confirm: userEditedRef.current || stepsDraft.length > 0 })) {
      lastLoadedCaseIdRef.current = caseId;
    }
  }, [searchParams, replaceWorkbenchDoc, pushWarningToast, stepsDraft.length]);

  const handleExport = () => {
    try { exportCaseFile(buildCurrentDoc()); }
    catch (err) { window.alert(`Export failed: ${(err as Error).message}`); }
  };

  const saveCurrentDraft = (doc: CaseDocument = buildCurrentDoc()) => {
    saveDraft(doc);
    userEditedRef.current = false;
    pushWarningToast('Workbench', 'Saved locally.');
  };

  const forkCurrentScene = () => {
    const now = Date.now();
    const sourceTitle = sceneMeta.title.trim() || defaultSceneTitle();
    const forkTitle = `${sourceTitle} copy`;
    const sourceDescription = sceneMeta.description.trim();
    const forkDescription = [sourceDescription, `Forked from ${sourceTitle}`].filter(Boolean).join('\n\n');
    const forkDoc = buildCurrentDoc({
      id: `fork-${now}`,
      title: forkTitle,
      createdAt: now,
      updatedAt: now,
    });
    const ownedCopy: CaseDocument = {
      ...forkDoc,
      meta: {
        ...forkDoc.meta,
        title: forkTitle,
        author: 'Local copy',
        createdAt: now,
        updatedAt: now,
      },
      spec: {
        ...forkDoc.spec,
        title: forkTitle,
        ...(forkDescription ? { description: forkDescription } : {}),
      },
    };

    saveCurrentDraft(ownedCopy);
    setSceneMeta({
      title: forkTitle,
      description: forkDescription,
      modelLimitations: ownedCopy.spec.modelLimitations,
    });
    setAuthoringMode(true);
    setSavedLesson(null);
    setPublishedLesson(null);
    pushWarningToast('Workbench', 'コピーを編集中です');
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
  
  const addInstance = (sourceId?: string) => {
      markUserEdited();
      const newId = Date.now().toString();
      const color = INSTANCE_COLORS[instances.length % INSTANCE_COLORS.length];
      const sourceInstance = instances.find(i => i.id === (typeof sourceId === 'string' ? sourceId : activeInstanceId));
      const initialParams = sourceInstance ? JSON.parse(JSON.stringify(sourceInstance.params)) : { ...DEFAULT_PARAMS };
      const initialVol = sourceInstance ? sourceInstance.targetVolume : 5600;
      // Preserve knob-primary state when duplicating, so a copied instance keeps
      // its clinical knobs / authored baseline instead of degrading to raw-only.
      const initialKnobs = sourceInstance?.knobs ? JSON.parse(JSON.stringify(sourceInstance.knobs)) : undefined;
      const initialKnobBaseline = sourceInstance?.knobBaseline ? JSON.parse(JSON.stringify(sourceInstance.knobBaseline)) : undefined;

      const baseName = sourceInstance ? sourceInstance.name : 'New Scenario';
      const name = `${baseName} (Copy)`;

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
      
      setPanels(prev => prev.map(p => {
          let defaultSigs: string[] = [];
          if (p.type === 'PVLOOP') defaultSigs = ['LV'];
          else if (p.type === 'WAVEFORM') defaultSigs = ['LVP', 'AoP'];
          else if (p.type === 'METRICS') defaultSigs = ['ABP', 'CO'];
          else if (p.type === 'CONTROLS') defaultSigs = ['clinical', 'Global', 'ventricles', 'fluids'];
          else if (p.type === 'GUYTON_RIGHT' || p.type === 'GUYTON_LEFT' || p.type === 'GUYTON_3D') defaultSigs = ['Default'];
          
          return {
              ...p,
              config: {
                  ...p.config,
                  [newId]: { visible: true, selectedSignals: defaultSigs }
              }
          };
      }));
      
      setActiveInstanceId(newId);
  };
  
  const removeInstance = (id: string) => {
      markUserEdited();
      setInstances(prev => prev.filter(i => i.id !== id));
      if (activeInstanceId === id) setActiveInstanceId(instances[0]?.id || '');
  };

  const updateInstanceName = (id: string, name: string) => {
      markUserEdited();
      setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, name } : inst));
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const [addingPanelType, setAddingPanelType] = useState<PanelType | null>(null);
  const [addingPanelConfig, setAddingPanelConfig] = useState<Record<string, PanelInstanceConfig>>({});
  const addPanel = (type: PanelType) => {
      const newConfig: Record<string, PanelInstanceConfig> = {};
      instances.forEach(i => {
          let defaultSigs: string[] = [];
          if (type === 'PVLOOP') defaultSigs = ['LV'];
          else if (type === 'WAVEFORM') defaultSigs = ['LVP', 'AoP'];
          else if (type === 'METRICS') defaultSigs = ['ABP', 'CO'];
          else if (type === 'CONTROLS') defaultSigs = ['clinical', 'Global', 'ventricles', 'fluids'];
          else if (type === 'GUYTON_RIGHT' || type === 'GUYTON_LEFT' || type === 'GUYTON_3D') defaultSigs = ['Default'];
          newConfig[i.id] = { visible: true, selectedSignals: defaultSigs };
      });
      setAddingPanelConfig(newConfig);
      setAddingPanelType(type);
  };
  
  const confirmAddPanel = () => {
      if (!addingPanelType) return;
      markUserEdited();
      const type = addingPanelType;
      const newPanel: PanelDef = {
          id: Date.now().toString(), type, 
          title: type === 'PVLOOP' ? 'PV Loop' : type === 'WAVEFORM' ? 'Waveforms' : type === 'METRICS' ? 'Metrics' : type === 'CONTROLS' ? 'Controls' : type === 'NOTE' ? 'Interactive Note' : 'Guyton',
          w: type === 'NOTE' ? 6 : type === 'METRICS' ? 4 : type === 'CONTROLS' ? 4 : 6, h: type === 'NOTE' ? 10 : type === 'METRICS' ? 6 : type === 'CONTROLS' ? 10 : 8,
          config: addingPanelConfig, isSettingsOpen: false,
          showGuides: type === 'PVLOOP', timeWindow: type === 'WAVEFORM' ? 5000 : undefined
      };
      setPanels(prev => addPane(prev, newPanel));
      setAddingPanelType(null);
  };

  const removePanel = (id: string) => {
      markUserEdited();
      setPanels(prev => removePane(prev, id));
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

  const updateSceneMeta = (next: WorkbenchSceneMeta) => {
    setSceneMeta(next);
    markUserEdited();
  };

  const runHeaderPrimaryAction = () => {
    if (headerMode === 'learner') {
      forkCurrentScene();
      return;
    }
    saveCurrentDraft();
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
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
        onOpenScenarioManager={() => setIsScenarioManagerOpen(true)}
        fileInputRef={fileInputRef}
        onImportFile={handleImportFile}
        onExport={handleExport}
        authoringMode={authoringMode}
        setAuthoringMode={setAuthoringMode}
        stepsDraftLength={stepsDraft.length}
        openLessonDialog={openLessonDialog}
        onExitAuthoring={() => { setIsLessonDialogOpen(false); setAuthoringMode(false); }}
        user={user}
        isAdmin={isAdmin}
        publishCurrentLesson={publishCurrentLesson}
        isPublishingLesson={isPublishingLesson}
        savedLesson={savedLesson}
        publishedLesson={publishedLesson}
        copyShareUrl={copyShareUrl}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        addPanel={addPanel}
      />

      <PanelGrid
        authoringMode={authoringMode}
        publishedLesson={publishedLesson}
        copyShareUrl={copyShareUrl}
        instances={instances}
        stepsDraft={stepsDraft}
        setStepsDraft={setStepsDraft}
        panels={panels}
        onPanelsChange={(nextPanels) => {
          markUserEdited();
          setPanels(nextPanels);
        }}
        mode={headerMode}
        layoutEditable={layoutEditable}
        setLayoutEditable={setIsLayoutEditing}
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

      <ScenarioManager 
          isOpen={isScenarioManagerOpen} 
          onClose={() => setIsScenarioManagerOpen(false)} 
          instances={instances} 
          addInstance={addInstance} 
          removeInstance={removeInstance} 
          updateInstanceName={updateInstanceName} 
          updateInstanceColor={updateInstanceColor} 
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
                      <button onClick={() => setAddingPanelType(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
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
