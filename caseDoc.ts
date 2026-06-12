// App-layer CaseDocument: the canonical, shareable, knob-primary representation
// of a workbench scene (milestone #3-b). This wraps the engine's pure physiology
// resolution (engine/caseResolve) with the UI layer (instances' name/color,
// panels, notes, meta) + the version stamps that make a saved case reproducible.
//
// Bridge contract:
//   save: SimInstance[] -> CaseDocument   (stores knobs + baselinePatch, NEVER
//                                          the derived params)
//   load: CaseDocument -> SimInstance[]   (resolves knobs->params; verifies the
//                                          knobMappingVersion, no silent fallback)

import type { SimInstance, PanelDef, PanelRole, WorkbenchRegionId, WorkbenchRegionPosition, WorkbenchWorkspace, ControllerItem } from "@/types";
import type { NoteContent } from "@/noteTypes";
import type { ExpectedFinding, StructuredModelLimitation } from "@/caseValidation";
import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";
import type { GraphBoardLayout, ViewSpec } from "@/features/workbench/viewSpec";
import {
  type BaselineDef,
  type CaseInstanceSpec,
  KNOB_MAPPING_VERSION,
  resolveInstance,
} from "@/engine/caseResolve";
import { OFFICIAL_BASELINES } from "@/engine/caseBaselines";
import { type ClinicalKnobs, type KnobKey, neutralKnobs, resolveKnobMappingVersion } from "@/engine/knobs";
import { roleOf } from "@/paneRole";

export const CASE_SCHEMA_VERSION = 2;
export const WORKSPACE_SCHEMA_VERSION = 1;
export const ENGINE_VERSION = "circleheart@0.0.0";

/** Deterministic replay config; travels in the document. */
export interface SolverConfig {
  dt: number;
  sampleHz: number;
  settleSeconds: number;
  recordSeconds: number;
}
export const DEFAULT_SOLVER: SolverConfig = { dt: 0.001, sampleHz: 120, settleSeconds: 8, recordSeconds: 3 };

/** Teaching metadata. modelLimitations is MANDATORY for a displayable case. */
export interface CaseSpec {
  title?: string;
  description?: string;
  modelLimitations: string[];
  expectedFindings?: ExpectedFinding[];
  structuredLimitations?: StructuredModelLimitation[];
  validationProfileId?: string;
}

export type CaseKind = "case" | "lesson" | "promptGenerated";
export type CaseStatus = "draft" | "published" | "archived";
export type CaseVisibility = "private" | "unlisted" | "public" | "official";

export type CaseInstanceSource =
  | { kind: "baselinePreset"; id: string }
  | { kind: "officialCase"; caseId: string; instanceId?: string }
  | { kind: "calibratedPreset"; calibrationId: string }
  | { kind: "manualPatch"; requiresReview: true };

export type CaseSource =
  | { kind: "authored" }
  | { kind: "official"; id: string }
  | { kind: "remix"; caseId: string }
  | { kind: "prompt"; prompt: string; model?: string };

export type CaseLessonKnobKey = Exclude<KnobKey, "baroreflexEnabled">;

/** Portable instance = physiology spec (engine) + UI identity (app). */
export interface CaseInstance extends CaseInstanceSpec {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  source?: CaseInstanceSource;
}

export interface CaseLessonStep {
  id: string;
  title?: string;
  note: NoteContent;
  stage: {
    visibleInstances: string[];
    visiblePanels?: string[];
    challenge?: {
      kind: "predict" | "free";
      prompt?: string;
      revealLabel?: string;
    };
    exposedKnobs?: CaseLessonKnobKey[];
    knobInstanceId?: string;
    initialState?: Partial<Record<CaseLessonKnobKey, number>>;
  };
}

export interface CaseLessonLayer {
  noteSpine: NoteContent;
  objective?: string;
  level?: string;
  steps?: CaseLessonStep[];
}

export type ReadingColumnEntry =
  | { kind: "paneRef"; panelId: string; generated?: boolean }
  | { kind: "noteRef"; noteId: string }
  | { kind: "viewRef"; viewId: string };

export interface CaseReadingManifest {
  schemaVersion: 1;
  column: ReadingColumnEntry[];
}

export interface CaseExposedController {
  items: ControllerItem[];
  targetPolicy: "fixedInstance" | "legendEditTarget";
  instanceId?: string;
  defaultOpen?: boolean;
}

export type CaseLocalizedPanel = {
  title?: string;
};

export type CaseLocalizedInstance = {
  name?: string;
};

export type CaseI18nContent = {
  title?: string;
  description?: string;
  modelLimitations?: string[];
  notes?: Record<string, NoteContent>;
  panels?: Record<string, CaseLocalizedPanel>;
  instances?: Record<string, CaseLocalizedInstance>;
};

export interface CaseDocument {
  schemaVersion: number;
  defaultLocale?: string;
  availableLocales?: string[];
  i18n?: Record<string, CaseI18nContent>;
  engineVersion: string;
  knobMappingVersion: string;
  solver: SolverConfig;
  meta: { id: string; title: string; author?: string; createdAt: number; updatedAt: number };
  kind?: CaseKind;
  status?: CaseStatus;
  visibility?: CaseVisibility;
  ownerId?: string;
  source?: CaseSource;
  derivedFrom?: string;
  spec: CaseSpec;
  instances: CaseInstance[];
  panels: PanelDef[];
  workspace?: WorkbenchWorkspace;
  views?: ViewSpec[];
  graphBoardLayout?: GraphBoardLayout;
  initialActiveScenarioId?: string;
  notes?: Record<string, NoteContent>;
  reading?: CaseReadingManifest;
  exposedControllers?: CaseExposedController[];
  lesson?: CaseLessonLayer;
}

/** A shareable case MUST surface model limitations. Gate before display. */
export function isCaseDisplayable(doc: CaseDocument): boolean {
  return Array.isArray(doc.spec?.modelLimitations) && doc.spec.modelLimitations.length > 0;
}

const ALL_KNOB_KEYS: KnobKey[] = [
  "HR", "contractility", "contractilityRV", "relaxation", "diastolicStiffness",
  "afterload", "arterialStiffness", "pulmonaryResistance", "venousTone", "peep",
  "aorticStenosis", "aorticRegurgitation", "mitralStenosis", "mitralRegurgitation",
  "tricuspidRegurgitation", "pulmonicStenosis", "baroreflexEnabled",
];

function roleForPanel(panel: PanelDef): PanelRole {
  return panel.role ?? roleOf(panel.type);
}

function panelsForRole(panels: PanelDef[], role: PanelRole): string[] {
  return panels.filter((panel) => roleForPanel(panel) === role).map((panel) => panel.id);
}

function scenarioPanelIds(panels: PanelDef[]): string[] {
  return panels.filter((panel) => panel.type === "SCENARIOS").map((panel) => panel.id);
}

function mergeRegionState(
  next: WorkbenchWorkspace["regions"][WorkbenchRegionId],
  previous: WorkbenchWorkspace["regions"][WorkbenchRegionId],
): WorkbenchWorkspace["regions"][WorkbenchRegionId] {
  if (!next) return previous;
  if (!previous) return next;

  const nextPanelIds = next.panelIds;
  const hasPanels = (nextPanelIds?.length ?? 0) > 0;
  const activePanelId = nextPanelIds?.includes(previous.activePanelId ?? "")
    ? previous.activePanelId
    : next.activePanelId;

  const merged = {
    ...next,
    ...previous,
    visible: hasPanels ? previous.visible : next.visible,
    ...(nextPanelIds ? { panelIds: nextPanelIds } : {}),
    ...(activePanelId ? { activePanelId } : {}),
  };

  if (!activePanelId) delete merged.activePanelId;

  return merged;
}

export function defaultWorkspaceForPanels(
  panels: PanelDef[],
): WorkbenchWorkspace {
  const graphPanelIds = panelsForRole(panels, "graph");
  const notePanelIds = panelsForRole(panels, "note");
  const outputPanelIds = panelsForRole(panels, "output");
  const scenariosPanelIds = scenarioPanelIds(panels);
  const controlPanelIds = panels
    .filter((panel) => roleForPanel(panel) === "control" && panel.type !== "SCENARIOS")
    .map((panel) => panel.id);
  const regions: WorkbenchWorkspace["regions"] = {
    scenarios: {
      visible: scenariosPanelIds.length > 0,
      position: "right",
      panelIds: scenariosPanelIds,
      activePanelId: scenariosPanelIds[0],
    },
    graph: { visible: true, position: "center", panelIds: graphPanelIds, activePanelId: graphPanelIds[0], split: "single" },
    note: { visible: notePanelIds.length > 0, position: "left", panelIds: notePanelIds, activePanelId: notePanelIds[0] },
    output: { visible: outputPanelIds.length > 0 ? "compact" : false, position: "bottom", panelIds: outputPanelIds, activePanelId: outputPanelIds[0] },
    control: { visible: controlPanelIds.length > 0, position: "right", panelIds: controlPanelIds, activePanelId: controlPanelIds[0] },
  };
  return { schemaVersion: WORKSPACE_SCHEMA_VERSION, regions, learnerLocked: true };
}

export function normalizeWorkspaceForAdr0007(workspace: WorkbenchWorkspace): WorkbenchWorkspace {
  const regions: WorkbenchWorkspace["regions"] = { ...workspace.regions };
  const legacyPositions: Partial<Record<WorkbenchRegionId, WorkbenchRegionPosition>> = {
    scenarios: "left",
    control: "left",
    note: "right",
  };
  const adr0007Positions: Partial<Record<WorkbenchRegionId, WorkbenchRegionPosition>> = {
    scenarios: "right",
    control: "right",
    note: "left",
    graph: "center",
    output: "bottom",
  };

  for (const region of ["scenarios", "control", "note"] as const) {
    const current = regions[region];
    if (!current || current.position !== legacyPositions[region]) continue;
    regions[region] = { ...current, position: adr0007Positions[region] };
  }

  return { ...workspace, regions };
}

export function workspaceForPanels(
  panels: PanelDef[],
  previous?: WorkbenchWorkspace,
): WorkbenchWorkspace {
  const defaults = defaultWorkspaceForPanels(panels);
  if (!previous) return defaults;
  const normalizedPrevious = normalizeWorkspaceForAdr0007(previous);

  const regions: WorkbenchWorkspace["regions"] = {};
  for (const region of ["scenarios", "control", "graph", "output", "note"] as const) {
    const merged = mergeRegionState(defaults.regions[region], normalizedPrevious.regions?.[region]);
    if (merged) regions[region] = merged;
  }

  return {
    ...defaults,
    regions,
    learnerLocked: normalizedPrevious.learnerLocked ?? defaults.learnerLocked,
    ...(normalizedPrevious.viewState ? { viewState: normalizedPrevious.viewState } : {}),
    ...(normalizedPrevious.viewStates ? { viewStates: normalizedPrevious.viewStates } : {}),
  };
}

/** Sparse diff of a full param set against a baseline (deep-compared per key). */
export function diffParams(target: CoreRuntimeParams, base: CoreRuntimeParams): ParameterPatch {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(target) as (keyof CoreRuntimeParams)[]) {
    if (JSON.stringify(target[key]) !== JSON.stringify(base[key])) out[key] = target[key];
  }
  return out as ParameterPatch;
}

/** Sparse diff of clinical knobs against the neutral set (only deviations). */
export function diffKnobs(full: ClinicalKnobs, neutral: ClinicalKnobs): Partial<ClinicalKnobs> {
  const out: Partial<ClinicalKnobs> = {};
  for (const key of ALL_KNOB_KEYS) {
    if (full[key] !== neutral[key]) (out as Record<KnobKey, unknown>)[key] = full[key];
  }
  return out;
}

// -----------------------------------------------------------------------------
// SAVE: SimInstance -> CaseInstance (stores knobs + baselinePatch, not params)
// -----------------------------------------------------------------------------

/** Default baseline every workbench instance is serialized against. */
const DEFAULT_BASELINE_ID = "active-normal";

export function simInstanceToCaseInstance(
  inst: SimInstance,
  baselines: Record<string, BaselineDef> = OFFICIAL_BASELINES,
): CaseInstance {
  // A knob-primary instance must carry BOTH knobs and knobBaseline (the app sets
  // them together). knobs-without-baseline would mean serializing derived params
  // as the baseline — reject it rather than corrupt the document.
  if (inst.knobs && !inst.knobBaseline) {
    throw new Error(`Instance "${inst.id}" has knobs but no knobBaseline (invalid knob-primary state); refusing to serialize.`);
  }
  const baseParams = baselines[DEFAULT_BASELINE_ID].params;
  // The authored base the knobs multiply over. For a knob-primary instance that
  // is its knobBaseline; for a legacy raw-only instance the params ARE authored.
  const authoredBase = inst.knobBaseline ?? inst.params;
  const knobs = inst.knobs ?? neutralKnobs(authoredBase);
  return {
    id: inst.id,
    name: inst.name,
    color: inst.color,
    isVisible: inst.isVisible,
    baseline: DEFAULT_BASELINE_ID,
    baselinePatch: diffParams(authoredBase, baseParams),
    // Diff against neutralKnobs(authoredBase) — the SAME base the loader
    // reconstructs (baseline + baselinePatch) — so the absolute knobs
    // (HR/venousTone/PEEP), whose neutral value comes from the base, round-trip
    // losslessly. Diffing against the default baseline's neutral would drop an
    // absolute knob that equals the DEFAULT while the base carries a deviation,
    // silently corrupting the reload.
    knobs: diffKnobs(knobs, neutralKnobs(authoredBase)),
    interventions: [],
    rawPatch: {},
    targetVolume: inst.targetVolume,
    source: { kind: "baselinePreset", id: DEFAULT_BASELINE_ID },
  };
}

export function simInstancesToCaseDocument(
  instances: SimInstance[],
  panels: PanelDef[],
  opts: {
    id: string;
    title: string;
    author?: string;
    ownerId?: string;
    kind?: CaseKind;
    status?: CaseStatus;
    visibility?: CaseVisibility;
    source?: CaseSource;
    derivedFrom?: string;
    createdAt: number;
    updatedAt: number;
    spec: CaseSpec;
    solver?: SolverConfig;
    workspace?: WorkbenchWorkspace;
    views?: ViewSpec[];
    graphBoardLayout?: GraphBoardLayout;
    initialActiveScenarioId?: string;
    notes?: Record<string, NoteContent>;
    reading?: CaseReadingManifest;
    exposedControllers?: CaseExposedController[];
    lesson?: CaseLessonLayer;
    defaultLocale?: string;
    availableLocales?: string[];
    i18n?: Record<string, CaseI18nContent>;
  },
): CaseDocument {
  const defaultLocale = opts.defaultLocale ?? "en";
  const availableLocales = opts.availableLocales ?? [defaultLocale];
  const notes = opts.notes;
  const localizedPanels = Object.fromEntries(panels.map((panel) => [panel.id, { title: panel.title }]));
  const caseInstances = instances.map((i) => simInstanceToCaseInstance(i));
  const i18n = opts.i18n ?? {
    [defaultLocale]: {
      title: opts.spec.title || opts.title,
      ...(opts.spec.description ? { description: opts.spec.description } : {}),
      modelLimitations: opts.spec.modelLimitations,
      ...(notes ? { notes } : {}),
      panels: localizedPanels,
      instances: Object.fromEntries(caseInstances.map((instance) => [instance.id, { name: instance.name }])),
    },
  };

  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    defaultLocale,
    availableLocales,
    i18n,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: opts.solver ?? DEFAULT_SOLVER,
    meta: { id: opts.id, title: opts.title, author: opts.author, createdAt: opts.createdAt, updatedAt: opts.updatedAt },
    kind: opts.kind ?? "case",
    status: opts.status ?? "draft",
    visibility: opts.visibility ?? "private",
    ...(opts.ownerId ? { ownerId: opts.ownerId } : {}),
    ...(opts.source ? { source: opts.source } : {}),
    ...(opts.derivedFrom ? { derivedFrom: opts.derivedFrom } : {}),
    spec: opts.spec,
    instances: caseInstances,
    panels,
    workspace: opts.workspace ?? defaultWorkspaceForPanels(panels),
    ...(opts.views ? { views: opts.views } : {}),
    ...(opts.graphBoardLayout ? { graphBoardLayout: opts.graphBoardLayout } : {}),
    ...(opts.initialActiveScenarioId ? { initialActiveScenarioId: opts.initialActiveScenarioId } : {}),
    ...(notes ? { notes } : {}),
    ...(opts.reading ? { reading: opts.reading } : {}),
    ...(opts.exposedControllers ? { exposedControllers: opts.exposedControllers } : {}),
    ...(opts.lesson ? { lesson: opts.lesson } : {}),
  };
}

// -----------------------------------------------------------------------------
// LOAD: CaseDocument -> SimInstance[] (resolve knobs->params; verify version)
// -----------------------------------------------------------------------------

export function caseInstanceToSimInstance(
  ci: CaseInstance,
  baselines: Record<string, BaselineDef>,
  version: string,
): SimInstance {
  const { params, targetVolume, knobs, base } = resolveInstance(ci, baselines, version);
  return {
    id: ci.id,
    name: ci.name,
    color: ci.color,
    isVisible: ci.isVisible,
    params,
    targetVolume,
    knobs,           // loaded instance is immediately knob-primary & editable
    knobBaseline: base,
  };
}

export function caseDocumentToSimInstances(
  doc: CaseDocument,
  baselines: Record<string, BaselineDef> = OFFICIAL_BASELINES,
): SimInstance[] {
  // Reject an unknown schema (future docs must be migrated, not mis-loaded) and
  // verify the mapping version up front (throws on unknown) — a case authored
  // against another engine is never silently resolved with the current map.
  if (doc.schemaVersion !== CASE_SCHEMA_VERSION && doc.schemaVersion !== 1) {
    throw new Error(`Unsupported case schemaVersion ${doc.schemaVersion} (this build supports ${CASE_SCHEMA_VERSION}).`);
  }
  resolveKnobMappingVersion(doc.knobMappingVersion);
  return doc.instances.map((ci) => caseInstanceToSimInstance(ci, baselines, doc.knobMappingVersion));
}
