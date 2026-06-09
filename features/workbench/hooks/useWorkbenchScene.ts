import { useCallback, useState, type MutableRefObject, type SetStateAction } from "react";
import { DEFAULT_PARAMS } from "@/constants";
import type { CaseDocument, CaseI18nContent, CaseSource } from "@/caseDoc";
import { OFFICIAL_BASELINES } from "@/engine/caseBaselines";
import { type ClinicalKnobs } from "@/engine/knobs";
import { resolveKnobEdit, resolveRawEdit } from "@/engine/instanceKnobs";
import type { SimulationParams, SimInstance } from "@/types";
import type { WorkbenchHeaderMode, WorkbenchSceneMeta } from "@/components/workbench/WorkbenchSidePanel";
import {
  DEFAULT_MODEL_LIMITATIONS,
  INSTANCE_COLORS,
  LOCAL_COPY_AUTHOR,
  UNTITLED_CASE_TITLE,
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
};

export function useWorkbenchScene({
  user,
  markUserEdited,
  requestSteadyTransitionRef,
  addHiddenInstanceConfigsRef,
}: {
  user: AuthUser;
  markUserEdited: () => void;
  requestSteadyTransitionRef: MutableRefObject<(id: string, nextInstances: SimInstance[]) => void>;
  addHiddenInstanceConfigsRef: MutableRefObject<(ids: string[]) => void>;
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

  const ownsCurrentCase = Boolean(user && currentCaseOwnerId === user.uid);
  const headerMode: WorkbenchHeaderMode = authoringMode
    ? "author"
    : ownsCurrentCase || caseAuthor === LOCAL_COPY_AUTHOR
      ? "sandbox"
      : resolveHeaderModeFromAuthor(caseAuthor, currentCaseSource);

  const updateSceneMeta = useCallback((next: WorkbenchSceneMeta) => {
    setSceneMeta(next);
    markUserEdited();
  }, [markUserEdited]);

  const updateInstanceParams = useCallback((id: string, newParams: Partial<SimulationParams>) => {
    markUserEdited();
    setInstances((prev) => prev.map((instance) =>
      instance.id === id
        ? { ...instance, ...resolveRawEdit({ params: instance.params, knobs: instance.knobs, knobBaseline: instance.knobBaseline }, newParams) }
        : instance
    ));
  }, [markUserEdited]);

  const updateInstanceKnobs = useCallback((id: string, newKnobs: ClinicalKnobs) => {
    markUserEdited();
    setInstances((prev) => {
      const next = prev.map((instance) =>
        instance.id === id
          ? { ...instance, ...resolveKnobEdit({ params: instance.params, knobs: instance.knobs, knobBaseline: instance.knobBaseline }, newKnobs) }
          : instance
      );
      requestSteadyTransitionRef.current(id, next);
      return next;
    });
  }, [markUserEdited, requestSteadyTransitionRef]);

  const updateInstanceVolume = useCallback((id: string, vol: number) => {
    markUserEdited();
    setInstances((prev) => {
      const next = prev.map((instance) => (
        instance.id === id ? { ...instance, targetVolume: vol } : instance
      ));
      requestSteadyTransitionRef.current(id, next);
      return next;
    });
  }, [markUserEdited, requestSteadyTransitionRef]);

  const updateInstanceColor = useCallback((id: string, color: string) => {
    markUserEdited();
    setInstances((prev) => prev.map((instance) => (
      instance.id === id ? { ...instance, color } : instance
    )));
  }, [markUserEdited]);

  const updateInstanceName = useCallback((id: string, name: string) => {
    markUserEdited();
    setInstances((prev) => prev.map((instance) => (
      instance.id === id ? { ...instance, name } : instance
    )));
  }, [markUserEdited]);

  const addInstance = useCallback((sourceId?: string, presetId?: string) => {
    markUserEdited();
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
    addHiddenInstanceConfigsRef.current([newId]);
  }, [activeInstanceId, addHiddenInstanceConfigsRef, instances, markUserEdited]);

  const removeInstance = useCallback((id: string) => {
    markUserEdited();
    setInstances((prev) => {
      const next = prev.filter((instance) => instance.id !== id);
      if (activeInstanceId === id) setActiveInstanceId(next[0]?.id || "");
      return next;
    });
  }, [activeInstanceId, markUserEdited]);

  const replaceSceneFromDoc = useCallback((payload: ReplaceScenePayload) => {
    const { doc } = payload;
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
    setActiveInstanceId(payload.activeInstanceId);
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
    ownsCurrentCase,
    headerMode,
    updateInstanceParams,
    updateInstanceKnobs,
    updateInstanceVolume,
    updateInstanceColor,
    updateInstanceName,
    addInstance,
    removeInstance,
    replaceSceneFromDoc,
    applySavedCase,
  };
}

export type WorkbenchSceneState = ReturnType<typeof useWorkbenchScene>;
