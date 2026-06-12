import { useCallback, useState, type MutableRefObject, type SetStateAction } from "react";
import { DEFAULT_PARAMS } from "@/constants";
import type { CaseDocument, CaseI18nContent, CaseSource } from "@/caseDoc";
import {
  authoredViewsForLoad,
  addVisibleScenariosToMetricsViews,
  appendMissingStandardViews,
  createControllerViewSpec,
  createMetricsViewSpec,
  deleteAuthoredView,
  duplicateAuthoredView,
  serializableAuthoredViews,
  standardAuthoredViews,
  upsertAuthoredView,
  type AuthoredViewSpec,
} from "@/features/workbench/authoredViews";
import type { GraphBoardLayout } from "@/features/workbench/viewSpec";
import { OFFICIAL_BASELINES } from "@/engine/caseBaselines";
import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs, type ClinicalKnobs } from "@/engine/knobs";
import { resolveKnobEdit, resolveRawEdit } from "@/engine/instanceKnobs";
import type { ControllerItem, MetricType, PanelDef, SimulationParams, SimInstance } from "@/types";
import type { WorkbenchHeaderMode, WorkbenchSceneMeta } from "@/components/workbench/WorkbenchSidePanel";
import {
  DEFAULT_MODEL_LIMITATIONS,
  INSTANCE_COLORS,
  LOCAL_COPY_AUTHOR,
  UNTITLED_CASE_TITLE,
  type AddedInstanceConfig,
  inferCaseSource,
  pickDistinctInstanceColor,
  resolveHeaderModeFromAuthor,
} from "@/features/workbench/workbenchDefaults";

type AuthUser = {
  uid: string;
} | null;

type ReplaceScenePayload = {
  instances: SimInstance[];
  activeInstanceId: string;
  panels: PanelDef[];
  doc: CaseDocument;
  trustedOfficial?: boolean;
};

type SavedCasePayload = {
  title: string;
  description: string;
  author?: string;
  caseId: string;
  ownerId: string;
  createdAt: number;
  source: CaseSource;
  derivedFrom?: string;
  modelLimitations: string[];
  defaultLocale?: string;
  availableLocales?: string[];
  i18n?: Record<string, CaseI18nContent>;
  reading?: CaseDocument["reading"];
  exposedControllers?: CaseDocument["exposedControllers"];
  views?: AuthoredViewSpec[];
  graphBoardLayout?: GraphBoardLayout;
  initialActiveScenarioId?: string;
};

export type AuthorRuntimeSnapshot = {
  instances: SimInstance[];
  activeInstanceId: string;
};

function nextViewId(kind: "controller" | "metrics"): string {
  return `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function cloneInstances(instances: readonly SimInstance[]): SimInstance[] {
  return JSON.parse(JSON.stringify(instances)) as SimInstance[];
}

export function resolveAuthorActiveInstanceId(
  instances: readonly SimInstance[],
  fallbackActiveInstanceId: string,
  initialActiveScenarioId?: string,
): string {
  if (initialActiveScenarioId && instances.some((instance) => instance.id === initialActiveScenarioId)) {
    return initialActiveScenarioId;
  }
  return fallbackActiveInstanceId;
}

export function createAuthorRuntimeSnapshot(
  instances: readonly SimInstance[],
  activeInstanceId: string,
): AuthorRuntimeSnapshot {
  return {
    instances: cloneInstances(instances),
    activeInstanceId,
  };
}

export function useWorkbenchScene({
  user,
  markUserEdited,
  requestSteadyTransitionRef,
  addVisibleInstanceConfigsRef,
}: {
  user: AuthUser;
  markUserEdited: () => void;
  requestSteadyTransitionRef: MutableRefObject<(id: string, nextInstances: SimInstance[]) => void>;
  addVisibleInstanceConfigsRef: MutableRefObject<(additions: AddedInstanceConfig[]) => void>;
}) {
  const [instances, setInstances] = useState<SimInstance[]>([
    {
      id: "1",
      name: "Heart A",
      color: INSTANCE_COLORS[0],
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5600,
      isVisible: true,
    },
  ]);
  const [activeInstanceId, setActiveInstanceId] = useState<string>("1");
  const [sceneMeta, setSceneMeta] = useState<WorkbenchSceneMeta>({
    title: UNTITLED_CASE_TITLE,
    description: "",
    modelLimitations: DEFAULT_MODEL_LIMITATIONS,
  });
  const [authoringMode, setAuthoringMode] = useState(false);
  const [caseAuthor, setCaseAuthor] = useState<string | undefined>(undefined);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [currentCaseOwnerId, setCurrentCaseOwnerId] = useState<string | undefined>(undefined);
  const [currentCaseCreatedAt, setCurrentCaseCreatedAt] = useState<number | undefined>(undefined);
  const [currentCaseSource, setCurrentCaseSource] = useState<CaseSource | undefined>(undefined);
  const [currentCaseDerivedFrom, setCurrentCaseDerivedFrom] = useState<string | undefined>(undefined);
  const [currentCaseDefaultLocale, setCurrentCaseDefaultLocale] = useState<string | undefined>(undefined);
  const [currentCaseAvailableLocales, setCurrentCaseAvailableLocales] = useState<string[] | undefined>(undefined);
  const [currentCaseI18n, setCurrentCaseI18n] = useState<Record<string, CaseI18nContent> | undefined>(undefined);
  const [currentCaseReading, setCurrentCaseReading] = useState<CaseDocument["reading"] | undefined>(undefined);
  const [currentCaseExposedControllers, setCurrentCaseExposedControllers] = useState<CaseDocument["exposedControllers"] | undefined>(undefined);
  const [currentCaseViews, setCurrentCaseViews] = useState<AuthoredViewSpec[]>(() => standardAuthoredViews(nextViewId));
  const [currentCaseGraphBoardLayout, setCurrentCaseGraphBoardLayout] = useState<GraphBoardLayout | undefined>(undefined);
  const [currentCaseInitialActiveScenarioId, setCurrentCaseInitialActiveScenarioId] = useState<string | undefined>(undefined);
  const [authorRuntimeSnapshot, setAuthorRuntimeSnapshot] = useState<AuthorRuntimeSnapshot | undefined>(undefined);

  const ownsCurrentCase = Boolean(user && currentCaseOwnerId === user.uid);
  const headerMode: WorkbenchHeaderMode = authoringMode
    ? "author"
    : ownsCurrentCase || caseAuthor === LOCAL_COPY_AUTHOR
      ? "sandbox"
      : resolveHeaderModeFromAuthor(caseAuthor, currentCaseSource);
  const markDocumentEdited = useCallback(() => {
    if (headerMode !== "learner") markUserEdited();
  }, [headerMode, markUserEdited]);

  const updateSceneMeta = useCallback((next: WorkbenchSceneMeta) => {
    if (headerMode === "learner") return;
    setSceneMeta(next);
    markDocumentEdited();
  }, [headerMode, markDocumentEdited]);

  const updateInstanceParams = useCallback((id: string, newParams: Partial<SimulationParams>) => {
    markDocumentEdited();
    setInstances((prev) => prev.map((instance) =>
      instance.id === id
        ? { ...instance, ...resolveRawEdit({ params: instance.params, knobs: instance.knobs, knobBaseline: instance.knobBaseline }, newParams) }
        : instance
    ));
  }, [markDocumentEdited]);

  const updateInstanceKnobs = useCallback((id: string, newKnobs: ClinicalKnobs) => {
    markDocumentEdited();
    setInstances((prev) => {
      const next = prev.map((instance) =>
        instance.id === id
          ? { ...instance, ...resolveKnobEdit({ params: instance.params, knobs: instance.knobs, knobBaseline: instance.knobBaseline }, newKnobs) }
          : instance
      );
      requestSteadyTransitionRef.current(id, next);
      return next;
    });
  }, [markDocumentEdited, requestSteadyTransitionRef]);

  const updateInstanceVolume = useCallback((id: string, vol: number) => {
    markDocumentEdited();
    setInstances((prev) => {
      const next = prev.map((instance) => (
        instance.id === id ? { ...instance, targetVolume: vol } : instance
      ));
      requestSteadyTransitionRef.current(id, next);
      return next;
    });
  }, [markDocumentEdited, requestSteadyTransitionRef]);

  const updateInstanceColor = useCallback((id: string, color: string) => {
    if (headerMode === "learner") return;
    markDocumentEdited();
    setInstances((prev) => prev.map((instance) => (
      instance.id === id ? { ...instance, color } : instance
    )));
  }, [headerMode, markDocumentEdited]);

  const updateInstanceName = useCallback((id: string, name: string) => {
    if (headerMode === "learner") return;
    markDocumentEdited();
    setInstances((prev) => prev.map((instance) => (
      instance.id === id ? { ...instance, name } : instance
    )));
  }, [headerMode, markDocumentEdited]);

  const toggleScenarioGlobalVisibility = useCallback((id: string) => {
    markDocumentEdited();
    setInstances((prev) => prev.map((instance) => (
      instance.id === id ? { ...instance, isVisible: instance.isVisible === false } : instance
    )));
  }, [markDocumentEdited]);

  const resetInstanceKnobs = useCallback((id: string) => {
    markDocumentEdited();
    setInstances((prev) => {
      let changed = false;
      const next = prev.map((instance) => {
        if (instance.id !== id || !instance.knobBaseline) return instance;
        changed = true;
        const knobs = neutralKnobs(instance.knobBaseline);
        return {
          ...instance,
          knobs,
          params: applyKnobs(instance.knobBaseline, knobs, KNOB_MAPPING_VERSION),
        };
      });
      if (changed) requestSteadyTransitionRef.current(id, next);
      return next;
    });
  }, [markDocumentEdited, requestSteadyTransitionRef]);

  const updateGraphBoardLayout = useCallback((layout: GraphBoardLayout | undefined) => {
    if (headerMode === "learner") return;
    setCurrentCaseGraphBoardLayout(layout);
    markDocumentEdited();
  }, [headerMode, markDocumentEdited]);

  const createControllerView = useCallback((title: string, items: ControllerItem[] = []) => {
    if (headerMode === "learner") return createControllerViewSpec(nextViewId("controller"), title, items);
    const view = createControllerViewSpec(nextViewId("controller"), title, items);
    setCurrentCaseViews((prev) => upsertAuthoredView(prev ?? [], view));
    markDocumentEdited();
    return view;
  }, [headerMode, markDocumentEdited]);

  const createMetricsView = useCallback((title: string, metrics: MetricType[] = []) => {
    if (headerMode === "learner") return createMetricsViewSpec(nextViewId("metrics"), title, metrics, instances);
    const view = createMetricsViewSpec(nextViewId("metrics"), title, metrics, instances);
    setCurrentCaseViews((prev) => upsertAuthoredView(prev ?? [], view));
    markDocumentEdited();
    return view;
  }, [headerMode, instances, markDocumentEdited]);

  const restoreStandardViews = useCallback(() => {
    if (headerMode === "learner") return;
    setCurrentCaseViews((prev) => appendMissingStandardViews(prev, nextViewId, instances, currentCaseDefaultLocale));
    markDocumentEdited();
  }, [currentCaseDefaultLocale, headerMode, instances, markDocumentEdited]);

  const updateAuthoredView = useCallback((view: AuthoredViewSpec) => {
    if (headerMode === "learner") return;
    setCurrentCaseViews((prev) => upsertAuthoredView(prev ?? [], view));
    markDocumentEdited();
  }, [headerMode, markDocumentEdited]);

  const renameAuthoredView = useCallback((id: string, title: string) => {
    if (headerMode === "learner") return;
    setCurrentCaseViews((prev) => (prev ?? []).map((view) => view.id === id ? { ...view, title } : view));
    markDocumentEdited();
  }, [headerMode, markDocumentEdited]);

  const duplicateView = useCallback((id: string) => {
    if (headerMode === "learner") return undefined;
    const source = currentCaseViews?.find((view) => view.id === id);
    if (!source) return undefined;
    const view = duplicateAuthoredView(source, nextViewId(source.kind), `${source.title ?? (source.kind === "controller" ? "Controller view" : "Metrics view")} copy`);
    setCurrentCaseViews((prev) => upsertAuthoredView(prev ?? [], view));
    markDocumentEdited();
    return view;
  }, [currentCaseViews, headerMode, markDocumentEdited]);

  const deleteView = useCallback((id: string) => {
    if (headerMode === "learner") return;
    setCurrentCaseViews((prev) => deleteAuthoredView(prev ?? [], id));
    markDocumentEdited();
  }, [headerMode, markDocumentEdited]);

  const addInstance = useCallback((sourceId?: string, presetId?: string) => {
    if (headerMode === "learner") return;
    markDocumentEdited();
    const newId = Date.now().toString();
    const preset = presetId ? OFFICIAL_BASELINES[presetId] : undefined;
    const sourceInstance = preset ? undefined : instances.find((instance) => (
      instance.id === (typeof sourceId === "string" ? sourceId : activeInstanceId)
    ));
    const color = pickDistinctInstanceColor(
      instances.map((instance) => instance.color),
      sourceInstance?.color,
    );
    const initialParams = preset
      ? JSON.parse(JSON.stringify(preset.params))
      : sourceInstance
        ? JSON.parse(JSON.stringify(sourceInstance.params))
        : { ...DEFAULT_PARAMS };
    const initialVol = preset ? preset.targetVolume : sourceInstance ? sourceInstance.targetVolume : 5600;
    const initialKnobs = sourceInstance?.knobs ? JSON.parse(JSON.stringify(sourceInstance.knobs)) : undefined;
    const initialKnobBaseline = sourceInstance?.knobBaseline ? JSON.parse(JSON.stringify(sourceInstance.knobBaseline)) : undefined;
    const baseName = preset
      ? preset.label.replace(/\s*\([^)]*\)\s*$/, "")
      : sourceInstance
        ? `${sourceInstance.name} (Copy)`
        : "New Scenario";
    const existingNames = new Set(instances.map((instance) => instance.name));
    let name = baseName;
    let suffix = 2;
    while (existingNames.has(name)) {
      name = `${baseName} ${suffix}`;
      suffix += 1;
    }

    setInstances((prev) => [...prev, {
      id: newId,
      name,
      color,
      params: initialParams,
      targetVolume: initialVol,
      isVisible: true,
      knobs: initialKnobs,
      knobBaseline: initialKnobBaseline,
    }]);
    addVisibleInstanceConfigsRef.current([{ id: newId, sourceId: sourceInstance?.id }]);
    setCurrentCaseViews((prev) => addVisibleScenariosToMetricsViews(prev ?? [], [newId]));
  }, [activeInstanceId, addVisibleInstanceConfigsRef, headerMode, instances, markDocumentEdited]);

  const removeInstance = useCallback((id: string) => {
    if (headerMode === "learner") return;
    markDocumentEdited();
    setInstances((prev) => {
      const next = prev.filter((instance) => instance.id !== id);
      if (activeInstanceId === id) setActiveInstanceId(next[0]?.id || "");
      return next;
    });
  }, [activeInstanceId, headerMode, markDocumentEdited]);

  const resetToAuthorState = useCallback(() => {
    if (!authorRuntimeSnapshot) return;
    const next = cloneInstances(authorRuntimeSnapshot.instances);
    setInstances(next);
    setActiveInstanceId(authorRuntimeSnapshot.activeInstanceId);
    next.forEach((instance) => requestSteadyTransitionRef.current(instance.id, next));
  }, [authorRuntimeSnapshot, requestSteadyTransitionRef]);

  const replaceSceneFromDoc = useCallback((payload: ReplaceScenePayload) => {
    const { doc } = payload;
    const initialActiveInstanceId = resolveAuthorActiveInstanceId(payload.instances, payload.activeInstanceId, doc.initialActiveScenarioId);
    setInstances(payload.instances);
    setSceneMeta({
      title: doc.spec.title || UNTITLED_CASE_TITLE,
      description: doc.spec.description ?? "",
      modelLimitations: doc.spec.modelLimitations.length > 0 ? doc.spec.modelLimitations : DEFAULT_MODEL_LIMITATIONS,
    });
    setCaseAuthor(doc.meta.author);
    setCurrentCaseId(doc.meta.id);
    setCurrentCaseOwnerId(doc.ownerId);
    setCurrentCaseCreatedAt(doc.meta.createdAt);
    setCurrentCaseSource(inferCaseSource(doc, { trustedOfficial: payload.trustedOfficial || doc.visibility === "official" }));
    setCurrentCaseDerivedFrom(doc.derivedFrom);
    setCurrentCaseDefaultLocale(doc.defaultLocale);
    setCurrentCaseAvailableLocales(doc.availableLocales);
    setCurrentCaseI18n(doc.i18n);
    setCurrentCaseReading(doc.reading);
    setCurrentCaseExposedControllers(doc.exposedControllers);
    setCurrentCaseViews(authoredViewsForLoad(doc.views, payload.panels, {
      idFactory: nextViewId,
      instances: payload.instances,
      locale: doc.defaultLocale,
    }));
    setCurrentCaseGraphBoardLayout(doc.graphBoardLayout);
    setCurrentCaseInitialActiveScenarioId(doc.initialActiveScenarioId);
    setActiveInstanceId(initialActiveInstanceId);
    setAuthorRuntimeSnapshot(createAuthorRuntimeSnapshot(payload.instances, initialActiveInstanceId));
    setAuthoringMode(false);
  }, []);

  const applySavedCase = useCallback((payload: SavedCasePayload) => {
    setSceneMeta({
      title: payload.title,
      description: payload.description,
      modelLimitations: payload.modelLimitations,
    });
    setCaseAuthor(payload.author);
    setCurrentCaseId(payload.caseId);
    setCurrentCaseOwnerId(payload.ownerId);
    setCurrentCaseCreatedAt(payload.createdAt);
    setCurrentCaseSource(payload.source);
    setCurrentCaseDerivedFrom(payload.derivedFrom);
    setCurrentCaseDefaultLocale(payload.defaultLocale);
    setCurrentCaseAvailableLocales(payload.availableLocales);
    setCurrentCaseI18n(payload.i18n);
    setCurrentCaseReading(payload.reading);
    setCurrentCaseExposedControllers(payload.exposedControllers);
    setCurrentCaseViews(serializableAuthoredViews(payload.views));
    setCurrentCaseGraphBoardLayout(payload.graphBoardLayout);
    setCurrentCaseInitialActiveScenarioId(payload.initialActiveScenarioId);
    setAuthoringMode(false);
  }, []);

  const setWorkbenchAuthoringMode = useCallback((next: SetStateAction<boolean>) => {
    const resolved = typeof next === "function" ? next(authoringMode) : next;
    if (resolved && !caseAuthor && !currentCaseOwnerId) setCaseAuthor(LOCAL_COPY_AUTHOR);
    setAuthoringMode(resolved);
  }, [authoringMode, caseAuthor, currentCaseOwnerId]);

  return {
    instances,
    setInstances,
    activeInstanceId,
    setActiveInstanceId,
    sceneMeta,
    setSceneMeta,
    updateSceneMeta,
    authoringMode,
    setAuthoringMode,
    setWorkbenchAuthoringMode,
    caseAuthor,
    setCaseAuthor,
    currentCaseId,
    currentCaseOwnerId,
    currentCaseCreatedAt,
    currentCaseSource,
    currentCaseDerivedFrom,
    currentCaseDefaultLocale,
    currentCaseAvailableLocales,
    currentCaseI18n,
    currentCaseReading,
    currentCaseExposedControllers,
    currentCaseViews,
    createControllerView,
    createMetricsView,
    updateAuthoredView,
    renameAuthoredView,
    restoreStandardViews,
    duplicateAuthoredView: duplicateView,
    deleteAuthoredView: deleteView,
    currentCaseGraphBoardLayout,
    updateGraphBoardLayout,
    currentCaseInitialActiveScenarioId,
    ownsCurrentCase,
    headerMode,
    updateInstanceParams,
    updateInstanceKnobs,
    updateInstanceVolume,
    updateInstanceColor,
    updateInstanceName,
    toggleScenarioGlobalVisibility,
    resetInstanceKnobs,
    resetToAuthorState,
    addInstance,
    removeInstance,
    replaceSceneFromDoc,
    applySavedCase,
  };
}

export type WorkbenchSceneState = ReturnType<typeof useWorkbenchScene>;
