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

import type { SimInstance, PanelDef } from "@/types";
import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";
import {
  type BaselineDef,
  type CaseInstanceSpec,
  KNOB_MAPPING_VERSION,
  resolveInstance,
} from "@/engine/caseResolve";
import { OFFICIAL_BASELINES } from "@/engine/caseBaselines";
import { type ClinicalKnobs, type KnobKey, neutralKnobs, resolveKnobMappingVersion } from "@/engine/knobs";

export const CASE_SCHEMA_VERSION = 1;
export const ENGINE_VERSION = "hemosim-0d@0.0.0";

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
}

/** Portable instance = physiology spec (engine) + UI identity (app). */
export interface CaseInstance extends CaseInstanceSpec {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
}

export interface CaseDocument {
  schemaVersion: number;
  engineVersion: string;
  knobMappingVersion: string;
  solver: SolverConfig;
  meta: { id: string; title: string; author?: string; createdAt: number; updatedAt: number };
  spec: CaseSpec;
  instances: CaseInstance[];
  panels: PanelDef[];
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
    knobs: diffKnobs(knobs, neutralKnobs(baseParams)),
    interventions: [],
    rawPatch: {},
    targetVolume: inst.targetVolume,
  };
}

export function simInstancesToCaseDocument(
  instances: SimInstance[],
  panels: PanelDef[],
  opts: { id: string; title: string; author?: string; createdAt: number; updatedAt: number; spec: CaseSpec; solver?: SolverConfig },
): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: opts.solver ?? DEFAULT_SOLVER,
    meta: { id: opts.id, title: opts.title, author: opts.author, createdAt: opts.createdAt, updatedAt: opts.updatedAt },
    spec: opts.spec,
    instances: instances.map((i) => simInstanceToCaseInstance(i)),
    panels,
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
  // Verify the mapping version up front (throws on unknown) — a case authored
  // against another engine is never silently resolved with the current map.
  resolveKnobMappingVersion(doc.knobMappingVersion);
  return doc.instances.map((ci) => caseInstanceToSimInstance(ci, baselines, doc.knobMappingVersion));
}
