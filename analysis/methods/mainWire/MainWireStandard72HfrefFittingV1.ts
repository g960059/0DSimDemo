import { canonicalJsonStringify, cloneAndFreezeCanonicalJson, sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { assessMainWireHfrefRestV1 as assess } from "@/analysis/policies/mainWire/MainWireHfrefReferenceV1";
import { executeMainWireStandard72FittingCandidateV1 as evaluate,
  type MainWireStandard72FittingInitializationV1 as Initialization } from "./MainWireStandard72BaselineCalibrationEvaluatorV1";
import { observeMainWireHfrefV1 as observe } from "./MainWireHfrefObservationV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

export const MAIN_WIRE_STANDARD72_HFREF_SEARCH_PLAN_V1 = Object.freeze({
  planId: "research-hfref-ventricular-domain-three-coordinate-search-v1",
  // Search restrictions, NOT new exact-input bounds or biological priors.
  coordinates: [
    { id: "lvActive", lower: .25, upper: 1, initial: [.3, .45, .6], scope: "LVFW and shared SEP together; RVFW/atria unchanged" },
    { id: "tbv", lower: 4200, upper: 5700, initial: [4200, 4935, 5700], scope: "total blood volume, mL; tone fixed" },
    { id: "resistance", lower: .75, upper: 1.25, initial: [.75, 1.04, 1.25], scope: "systemic resistance scale; stiffness fixed" },
  ],
  maximumNeighborRounds: 4, initialStepFraction: .125,
  maximumEvaluations: 51, nominalDtSec: .002,
  fixed: "seed HR70, BSA1.9, venous tone, pulmonary resistance, arterial stiffness, passive mechanics, calcium kinetics, valves, pericardium, coronary and oxygen inputs",
  finalQualification: "not-performed-by-search", publicPromotionAuthorized: false,
});
export type MainWireHfrefPointV1 = Readonly<{ lvActive: number; tbv: number; resistance: number }>;

export function applyMainWireHfrefPointV1(point: MainWireHfrefPointV1, source: Candidate = seed.candidateInputs): Candidate {
  if (Object.keys(point).sort().join() !== "lvActive,resistance,tbv") throw new Error("HFrEF point must contain exactly three coordinates");
  for (const c of MAIN_WIRE_STANDARD72_HFREF_SEARCH_PLAN_V1.coordinates) {
    const x = point[c.id as keyof MainWireHfrefPointV1];
    if (!Number.isFinite(x) || x < c.lower || x > c.upper) throw new Error(`HFrEF search coordinate outside declared scope: ${c.id}`);
  }
  const mechanism = source.mechanismResearchInputs;
  return { ...source, ventricularContractilityScale: 1,
    hemodynamicResearchInputs: { ...source.hemodynamicResearchInputs, heartRateBpm: 70,
      totalBloodVolumeMl: point.tbv, systemicResistance: point.resistance },
    mechanismResearchInputs: { ...mechanism, chamberMechanics: { ...mechanism.chamberMechanics,
      activeTensionScaleByWall: { ...mechanism.chamberMechanics.activeTensionScaleByWall,
        LVFW: point.lvActive, SEP: point.lvActive } } } };
}

export type MainWireHfrefFittingTaskV1 = Readonly<{ point: MainWireHfrefPointV1;
  initialization?: Initialization; nominalDtSec?: .002 | .001; expectedReferenceSha256?: string }>;

/** Disease assessment is separate from healthy rest comparisons. The existing
 * evaluator supplies exact execution and periodic evidence, never a disease vote. */
export async function runMainWireStandard72HfrefCaseV1(task: MainWireHfrefFittingTaskV1, abortSignal?: AbortSignal) {
  const owned = cloneAndFreezeCanonicalJson(task) as MainWireHfrefFittingTaskV1;
  const reference = resolveMainWireFittingReferenceV1("hfref-lv-systolic-v1");
  const referenceSha256 = await sha256CanonicalJsonHex(reference);
  if (owned.expectedReferenceSha256 && owned.expectedReferenceSha256 !== referenceSha256) throw new Error("HFrEF reference changed after plan registration");
  const candidateInputs = applyMainWireHfrefPointV1(owned.point);
  // Research-only derivative: never import the released Standard72 checkpoint.
  const initialization = owned.initialization ?? { kind: "cold" as const };
  const evaluation = await evaluate({ candidateInputs, initialization, nominalDtSec: owned.nominalDtSec ?? .002,
    retainTerminalDiagnostics: true, abortSignal });
  return projectResultV1({ point: owned.point, candidateInputs, evaluation, reference, referenceSha256 });
}

/** Re-observation retains the original exact execution and its source result;
 * it is not a new integration, cold restart or additional validation sample. */
export async function reassessMainWireStandard72HfrefResultV1(input: MainWireHfrefFittingResultV1) {
  const saved = cloneAndFreezeCanonicalJson(input) as MainWireHfrefFittingResultV1;
  const { resultSha256, ...body } = saved;
  if (resultSha256 !== await sha256CanonicalJsonHex(body)) throw new Error("HFrEF saved result digest mismatch");
  const reference = resolveMainWireFittingReferenceV1("hfref-lv-systolic-v1");
  const referenceSha256 = await sha256CanonicalJsonHex(reference);
  const candidateInputs = applyMainWireHfrefPointV1(saved.point);
  if (saved.schemaId !== "research-hfref-domain-fitting-result-v1"
    || saved.referenceSha256 !== referenceSha256 || await sha256CanonicalJsonHex(saved.reference) !== referenceSha256
    || canonicalJsonStringify(saved.candidateInputs) !== canonicalJsonStringify(candidateInputs)
    || saved.candidateSha256 !== await sha256CanonicalJsonHex(candidateInputs)
    || (saved.evaluation.status === "accepted" && canonicalJsonStringify(saved.evaluation.candidateInputs) !== canonicalJsonStringify(candidateInputs))) {
    throw new Error("HFrEF saved result/reference/input mismatch");
  }
  return projectResultV1({ point: saved.point, candidateInputs, evaluation: saved.evaluation,
    reference, referenceSha256, reobservedFromResultSha256: resultSha256 });
}

async function projectResultV1(input: { point: MainWireHfrefPointV1; candidateInputs: Candidate;
  evaluation: Awaited<ReturnType<typeof evaluate>>;
  reference: ReturnType<typeof resolveHfrefReferenceV1>; referenceSha256: string; reobservedFromResultSha256?: string }) {
  const { evaluation, candidateInputs, reference, referenceSha256 } = input;
  let observation: ReturnType<typeof observe> | null = null, observationIssue: string | null = null;
  if (evaluation.status === "accepted") {
    try { observation = observe(evaluation); }
    catch (error) { observationIssue = error instanceof Error ? error.message : String(error); }
  }
  const assessment = observation === null ? null : assess(observation.values);
  const body = { schemaId: "research-hfref-domain-fitting-result-v1", reference, referenceSha256,
    point: input.point, candidateInputs, candidateSha256: await sha256CanonicalJsonHex(candidateInputs),
    ...(input.reobservedFromResultSha256 ? { reobservedFromResultSha256: input.reobservedFromResultSha256 } : {}),
    evaluation, observation, observationIssue, assessment,
    status: evaluation.status !== "accepted" ? "execution-failed" : !assessment || assessment.status === "unresolved"
      ? "observation-unresolved" : assessment.screenPassed ? "rest-screen-passed" : "rest-screen-failed",
    finalQualificationPerformed: false, publicPromotionAuthorized: false, clinicalValidationClaimed: false };
  return { ...body, resultSha256: await sha256CanonicalJsonHex(body) };
}

function resolveHfrefReferenceV1() { return resolveMainWireFittingReferenceV1("hfref-lv-systolic-v1"); }

export type MainWireHfrefFittingResultV1 = Awaited<ReturnType<typeof runMainWireStandard72HfrefCaseV1>>;

export function compareMainWireHfrefResultsV1(a: MainWireHfrefFittingResultV1, b: MainWireHfrefFittingResultV1) {
  const aa = a.assessment?.ranking, bb = b.assessment?.ranking;
  if (!aa || !bb) return Number(!aa) - Number(!bb);
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return aa[i]! - bb[i]!;
  return 0; // Stable array order, not worker completion time.
}

export function mainWireHfrefInitialPointsV1(): MainWireHfrefPointV1[] {
  const [a, v, r] = MAIN_WIRE_STANDARD72_HFREF_SEARCH_PLAN_V1.coordinates;
  return a!.initial.flatMap(lvActive => v!.initial.flatMap(tbv => r!.initial.map(resistance => ({ lvActive, tbv, resistance }))));
}

export function mainWireHfrefNeighborPointsV1(point: MainWireHfrefPointV1, fraction: number,
  visited: ReadonlySet<string>): MainWireHfrefPointV1[] {
  const candidates: MainWireHfrefPointV1[] = [], seen = new Set(visited);
  for (const c of MAIN_WIRE_STANDARD72_HFREF_SEARCH_PLAN_V1.coordinates) for (const sign of [-1, 1]) {
    const id = c.id as keyof MainWireHfrefPointV1;
    const value = Math.max(c.lower, Math.min(c.upper, point[id] + sign * fraction * (c.upper - c.lower)));
    const p = { ...point, [id]: Number(value.toPrecision(14)) }, key = canonicalJsonStringify(p);
    if (!seen.has(key)) { candidates.push(p); seen.add(key); }
  }
  return candidates;
}
