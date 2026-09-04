import { cloneAndFreezeCanonicalJson, sha256CanonicalJsonHex, type CanonicalJsonValue } from "@/engine/integrity";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { applyMainWireBaselineCalibrationParametersV1, mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1,
  type MainWireBaselineCalibrationCandidateInputsV1 } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { assertMainWireBaselineCheckCoverageV1, mainWireBaselineCheckBlocksV1,
  mainWireBaselineGateRoleV1, MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1 } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 } from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import { MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID } from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
  buildMainWireStandard70BaselineCalibrationRequestIdentityV1,
  evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  initializationIdentityV1,
  MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
  type MainWireStandard70BaselineCalibrationAcceptedEvaluationV1 as Accepted,
  type MainWireStandard70BaselineCalibrationEvaluationV1 as Evaluation,
  type MainWireStandard70BaselineCalibrationEvaluationRequestV1 as Request,
} from "./MainWireStandard70BaselineCalibrationEvaluatorV1";
import { evaluateMainWireBaselineColdConsistencyV1 } from "./MainWireBaselineColdConsistencyV1";
import { evaluateMainWireBaselinePressureRateQualityV1 } from "./MainWireBaselinePressureRateQualityV1";

const TBV = "hemodynamics.total-blood-volume-ml" as const;
const ACTIVE = "myocardium.common-ventricular-active-tension-scale" as const;
export type RecoveryPointV1 = readonly [number, number];
export const MAIN_WIRE_BASELINE_SYNTHETIC_RECOVERY_V1 = ownedV1({
  policyId: "main-wire-current-reference-synthetic-recovery-v1",
  referenceId: "baseline", baselineId: "main-wire-standard70-pressure-flow-baseline-v2",
  coordinateIds: [TBV, ACTIVE],
  controls: { A: [5000, 1.30], B: [5050, 1.31] },
  starts: { reference: [5050, 1.32], alternate: [4950, 1.29] },
  bounds: [[4900, 5150], [1.27, 1.32]], steps: [50, 0.01],
  maximumSearchEvaluations: 17, nominalDtSec: 0.002, refinedDtSec: 0.001,
  // Max residual is primary, RMS breaks flat max-norm ties. Neither counts
  // these correlated observations as independent likelihood evidence.
  observationIds: ["aortic-pressure.maximum", "aortic-pressure.minimum", "pcwp-surrogate.mean",
    "left-ventricle.edv-index", "left-ventricle.esv-index"],
  maximumNormalizedTargetResidual: 0.005,
  residualToleranceRole: "engineering-smoke-tolerance-not-measurement-uncertainty-or-numerical-floor",
  search: "bounded-axis-pattern-search-max-residual-then-rms-deterministic-ties",
  initialization: "cold-target-cold-start-then-incumbent-only-continuation",
  afterload: "not-required",
  qualificationPending: ["bidirectional-preload-reserve", "other-allowed-heart-rate", "condition-order-comparison"],
  claims: { practicalRankEstablished: false, parameterUniquenessClaimed: false,
    presetOrCaseFittingQualified: false, baselineAdopted: false, modelMinted: false },
} as const);
const POLICY = MAIN_WIRE_BASELINE_SYNTHETIC_RECOVERY_V1;
export type RecoveryControlV1 = keyof typeof POLICY.controls;
export type RecoveryStartV1 = keyof typeof POLICY.starts;
type Assessment = Readonly<{ status: "admitted" | "construction-deviation" | "scientific-invalid" | "execution-failure";
  reasons: readonly string[] }>;
type Observation = Readonly<{ checkId: string; unit: string; minimum: number; maximum: number; actual: number }>;
type SearchEvaluation = Readonly<{ assessment: Assessment; observations: readonly Observation[] }>;
type EvaluatedPoint = Readonly<{ point: RecoveryPointV1; evaluation: SearchEvaluation; residual: number | null; tieResidual: number | null }>;

/** Pure bounded search. The synthetic truth and target checkpoint are never inputs. */
export async function searchMainWireBaselineSyntheticTargetV1(
  start: RecoveryPointV1, target: readonly Observation[],
  evaluate: (point: RecoveryPointV1, incumbent: RecoveryPointV1 | null) => Promise<SearchEvaluation>,
) {
  validatePointV1(start);
  const visited = new Map<string, EvaluatedPoint>();
  async function visit(point: RecoveryPointV1, incumbent: RecoveryPointV1 | null) {
    const evaluation = await evaluate(point, incumbent);
    const residual = ["admitted", "construction-deviation"].includes(evaluation.assessment.status)
      ? recoveryResidualV1(evaluation.observations, target) : null;
    const tieResidual = residual === null ? null : Math.hypot(...target.map((row) =>
      (evaluation.observations.find((other) => other.checkId === row.checkId)!.actual - row.actual)
      / (row.maximum - row.minimum))) / Math.sqrt(target.length);
    const entry = { point, evaluation, residual, tieResidual };
    visited.set(keyV1(point), entry);
    return entry;
  }
  let best = await visit(ownedV1(start), null);
  let stopReason = "initialization-rejected";
  while (best.residual !== null) {
    if (best.evaluation.assessment.status === "admitted" && best.residual <= POLICY.maximumNormalizedTargetResidual) {
      stopReason = "target-residual-reached"; break;
    }
    if (visited.size >= POLICY.maximumSearchEvaluations) { stopReason = "evaluation-budget"; break; }
    const anchor = best;
    let compared = 0;
    for (const neighbor of recoveryNeighborsV1(anchor.point)) {
      const prior = visited.get(keyV1(neighbor));
      if (!prior && visited.size >= POLICY.maximumSearchEvaluations) break;
      const candidate = prior ?? await visit(neighbor, anchor.point);
      compared++;
      if (betterV1(candidate, best)) best = candidate;
    }
    if (best === anchor) { stopReason = visited.size >= POLICY.maximumSearchEvaluations
      ? "evaluation-budget" : compared ? "local-lattice-stall" : "no-admissible-neighbor"; break; }
  }
  return { best, stopReason, evaluations: [...visited.values()], evaluationCount: visited.size };
}

export function recoveryNeighborsV1(point: RecoveryPointV1): readonly RecoveryPointV1[] {
  validatePointV1(point);
  return ([0, 1] as const).flatMap((axis) => ([-1, 1] as const).flatMap((direction) => {
    const changed = [...point] as [number, number];
    changed[axis] = Number((changed[axis] + direction * POLICY.steps[axis]).toFixed(8));
    const bound = POLICY.bounds[axis];
    return changed[axis] < bound[0] || changed[axis] > bound[1] ? [] : [Object.freeze(changed)];
  }));
}

export function assessMainWireBaselineSyntheticEvaluationV1(evaluation: Evaluation): Assessment {
  if (evaluation.status !== "accepted") return { status: "execution-failure", reasons: [evaluation.status, evaluation.phase] };
  const checks = [...evaluation.objectiveChecks, ...evaluation.safetySentinelChecks];
  try { assertMainWireBaselineCheckCoverageV1(checks); }
  catch { return { status: "scientific-invalid", reasons: ["incomplete-or-duplicate-observations"] }; }
  const expectedObjectiveIds = new Set<string>(MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1.flatMap((group) => group.checkIds));
  const expectedSafetyIds = new Set<string>(MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1);
  if (evaluation.objectiveChecks.length !== expectedObjectiveIds.size || evaluation.safetySentinelChecks.length !== expectedSafetyIds.size
    || evaluation.objectiveChecks.some((row) => !expectedObjectiveIds.has(row.checkId))
    || evaluation.safetySentinelChecks.some((row) => !expectedSafetyIds.has(row.checkId))) {
    return { status: "scientific-invalid", reasons: ["observation-partitions-differ"] };
  }
  if (evaluation.exactResult.classification.status !== "period1-converged"
    || checks.some((c) => !Number.isFinite(c.actual) || !Number.isFinite(c.minimum) || !Number.isFinite(c.maximum)
      || c.minimum > c.maximum || !["passed", "failed"].includes(c.status))) return { status: "scientific-invalid", reasons: ["nonsettled-or-invalid-observations"] };
  const failures = checks.filter(mainWireBaselineCheckBlocksV1);
  const safetyIds = new Set<string>(evaluation.safetySentinelChecks.map(({ checkId }) => checkId));
  if (evaluation.safetySentinelStatus !== "passed" || evaluation.failedSafetySentinelCheckIds.length
    || failures.some((c) => safetyIds.has(c.checkId) || mainWireBaselineGateRoleV1(c.checkId) !== "physiological-target")) {
    return { status: "scientific-invalid", reasons: [...new Set([...failures.map((c) => c.checkId),
      ...evaluation.failedSafetySentinelCheckIds, "numerical-event-morphology-or-safety-rejected"])] };
  }
  if (failures.length || evaluation.constructionGateStatus !== "passed" || evaluation.objectiveGateStatus !== "passed"
    || evaluation.failedConstructionCheckIds.length || evaluation.failedObjectiveCheckIds.length) {
    return { status: "construction-deviation", reasons: [...new Set([...failures.map((c) => c.checkId),
      ...evaluation.failedConstructionCheckIds, ...evaluation.failedObjectiveCheckIds])] };
  }
  return { status: "admitted", reasons: [] };
}

export function recoveryResidualV1(actual: readonly Observation[], target: readonly Observation[]): number {
  const rows = (input: readonly Observation[]) => {
    const map = new Map(input.map((row) => [row.checkId, row]));
    if (map.size !== input.length || map.size !== POLICY.observationIds.length) throw new Error("recovery observation inventory differs");
    return map;
  };
  const a = rows(actual), t = rows(target);
  return Math.max(...POLICY.observationIds.map((id) => {
    const left = a.get(id), right = t.get(id);
    if (!left || !right || left.unit !== right.unit || left.minimum !== right.minimum || left.maximum !== right.maximum
      || !Number.isFinite(left.actual) || !Number.isFinite(right.actual) || !Number.isFinite(right.minimum)
      || !Number.isFinite(right.maximum) || !(right.maximum > right.minimum)) {
      throw new Error(`recovery observation definition differs: ${id}`);
    }
    return Math.abs(left.actual - right.actual) / (right.maximum - right.minimum);
  }));
}

/** Direct evaluator execution avoids accepting serialized, caller-asserted target evidence. */
export async function runMainWireBaselineSyntheticRecoveryV1(
  selection: Readonly<{ controlId: RecoveryControlV1; startId: RecoveryStartV1 }>,
  evaluate = evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  record?: (entry: Readonly<{ ordinal: number; stage: string; request: Request; evaluation: Evaluation }>) => Promise<void>,
) {
  selection = ownedV1(selection);
  const reference = resolveMainWireFittingReferenceV1("baseline");
  if (reference.selectedConstruction.baselineId !== POLICY.baselineId
    || reference.selectedConstruction.candidateInputs.hemodynamicResearchInputs.heartRateBpm !== 70) {
    throw new Error("synthetic recovery requires explicit rebinding to the selected baseline");
  }
  const truth = POLICY.controls[selection.controlId], start = POLICY.starts[selection.startId];
  if (!truth || !start) throw new Error("unknown synthetic recovery control/start");
  validatePointV1(truth); validatePointV1(start);
  if (keyV1(truth) === keyV1(start)) throw new Error("synthetic start must not equal truth");
  const anchor = reference.selectedConstruction.candidateInputs;
  const candidate = (point: RecoveryPointV1) => applyMainWireBaselineCalibrationParametersV1(anchor,
    [{ parameterId: TBV, value: point[0] }, { parameterId: ACTIVE, value: point[1] }]);
  const construction = await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
  const exactIdentity = await sha256CanonicalJsonHex(MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1);
  const provenance = { referenceIdentitySha256: await sha256CanonicalJsonHex(reference),
    policyIdentitySha256: await sha256CanonicalJsonHex(POLICY), exactModelIdentitySha256: exactIdentity,
    constructionPolicyIdentitySha256: construction.constructionPolicyIdentitySha256,
    evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    selection, reference, policy: POLICY };
  let ordinal = 0;
  async function execute(stage: string, point: RecoveryPointV1, initialization: NonNullable<Request["initialization"]>, dt = POLICY.nominalDtSec as number) {
    const request = ownedV1({ ...candidate(point), nominalDtSec: dt, initialization });
    const evaluation = await evaluate(request);
    await record?.({ ordinal: ordinal++, stage, request, evaluation });
    if (evaluation.status === "accepted") {
      const expected = await buildMainWireStandard70BaselineCalibrationRequestIdentityV1({ ...request,
        initialization: initializationIdentityV1(request.initialization),
        constructionPolicyIdentitySha256: construction.constructionPolicyIdentitySha256 });
      if (evaluation.requestIdentitySha256 !== expected || evaluation.exactModelIdentitySha256 !== exactIdentity
        || evaluation.evaluatorId !== MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID
        || evaluation.objectiveAnalysisMethodId !== MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID
        || evaluation.safetyAnalysisMethodId !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID
        || evaluation.constructionPolicyIdentitySha256 !== construction.constructionPolicyIdentitySha256
        || evaluation.nominalDtSec !== dt || evaluation.exactResult.nominalDtSec !== dt
        || evaluation.initializationKind !== initialization.kind || evaluation.exactResult.initializationKind !== initialization.kind) {
        throw new Error("synthetic recovery evaluator context differs from the actual request");
      }
    }
    return evaluation;
  }
  const target = await execute("target-cold", truth, { kind: "cold" });
  const targetAssessment = assessMainWireBaselineSyntheticEvaluationV1(target);
  const observations = (e: Evaluation) => e.status === "accepted" ? POLICY.observationIds.map((id) => {
    const check = e.objectiveChecks.find((row) => row.checkId === id);
    if (!check) throw new Error(`missing recovery observation: ${id}`);
    return { checkId: check.checkId, unit: check.unit, minimum: check.minimum, maximum: check.maximum, actual: check.actual };
  }) : [];
  if (targetAssessment.status !== "admitted") return { ...provenance, status: "target-rejected" as const, targetAssessment,
    evaluationCount: ordinal, finalQualification: null };
  const targetRows = observations(target);
  const evaluated = new Map<string, Accepted>(); // Never insert the target or its checkpoint.
  const search = await searchMainWireBaselineSyntheticTargetV1(start, targetRows, async (point, incumbent) => {
    const source = incumbent === null ? undefined : evaluated.get(keyV1(incumbent));
    if (incumbent !== null && !source) throw new Error("missing actual search-incumbent checkpoint");
    const sourceInputs = incumbent === null ? null : candidate(incumbent);
    const initialization: NonNullable<Request["initialization"]> = source && sourceInputs
      ? { kind: "standard70-parameter-continuation", sourceCheckpoint: source.exactResult.checkpoint,
          sourceHemodynamicResearchInputs: sourceInputs.hemodynamicResearchInputs,
          sourceVentricularContractilityScale: sourceInputs.ventricularContractilityScale,
          sourceMechanismResearchInputs: sourceInputs.mechanismResearchInputs }
      : { kind: "cold" };
    const result = await execute("search", point, initialization);
    const assessment = assessMainWireBaselineSyntheticEvaluationV1(result);
    if (result.status === "accepted" && ["admitted", "construction-deviation"].includes(assessment.status)) evaluated.set(keyV1(point), result);
    return { assessment, observations: observations(result) };
  });
  const nominal = evaluated.get(keyV1(search.best.point));
  if (!nominal || search.best.evaluation.assessment.status !== "admitted") return { ...provenance,
    status: "search-unresolved" as const, targetAssessment, search, evaluationCount: ordinal, finalQualification: null };
  const cold = await execute("finalist-cold", search.best.point, { kind: "cold" });
  const fine = await execute("finalist-refined", search.best.point,
    { kind: "standard70-exact-checkpoint", checkpoint: nominal.exactResult.checkpoint }, POLICY.refinedDtSec);
  const candidateIdentitySha256 = await sha256CanonicalJsonHex(candidate(search.best.point));
  const coldAssessment = assessMainWireBaselineSyntheticEvaluationV1(cold), fineAssessment = assessMainWireBaselineSyntheticEvaluationV1(fine);
  const coldConsistency = cold.status === "accepted" ? evaluateMainWireBaselineColdConsistencyV1({
    warm: { evaluation: nominal, candidateIdentitySha256 }, cold: { evaluation: cold, candidateIdentitySha256 } }) : null;
  const pressureRateQuality = fine.status === "accepted" ? evaluateMainWireBaselinePressureRateQualityV1({
    coarse: { qualification: nominal.exactResult, candidateIdentitySha256 },
    fine: { qualification: fine.exactResult, candidateIdentitySha256 } }) : null;
  const finalQualification = { coldAssessment, fineAssessment, coldConsistency, pressureRateQuality,
    coldTargetResidual: coldAssessment.status === "admitted" ? recoveryResidualV1(observations(cold), targetRows) : null,
    refinedTargetResidual: fineAssessment.status === "admitted" ? recoveryResidualV1(observations(fine), targetRows) : null,
    refinedTargetComparisonRole: "cross-dt-smoke-not-refined-synthetic-truth-or-accuracy-proof",
    pending: POLICY.qualificationPending };
  const localChecksPassed = search.best.residual! <= POLICY.maximumNormalizedTargetResidual
    && coldAssessment.status === "admitted" && fineAssessment.status === "admitted"
    && coldConsistency?.status === "passed" && pressureRateQuality?.status === "passed"
    && finalQualification.coldTargetResidual! <= POLICY.maximumNormalizedTargetResidual
    && finalQualification.refinedTargetResidual! <= POLICY.maximumNormalizedTargetResidual;
  return { ...provenance, status: localChecksPassed ? "local-smoke-passed" as const : "local-smoke-unresolved" as const,
    targetAssessment, search, finalQualification, evaluationCount: ordinal,
    declaredTruthPointMatched: keyV1(search.best.point) === keyV1(truth) };
}

function validatePointV1(point: RecoveryPointV1) {
  if (point.length !== 2 || point.some((value, axis) => !mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1(
    POLICY.coordinateIds[axis]!, value) || value < POLICY.bounds[axis]![0] || value > POLICY.bounds[axis]![1])) {
    throw new Error("synthetic recovery point lies outside the frozen lattice");
  }
}
function betterV1(candidate: EvaluatedPoint, best: EvaluatedPoint): boolean {
  if (candidate.residual === null) return false;
  if (best.residual === null) return true;
  if (candidate.evaluation.assessment.status !== best.evaluation.assessment.status) return candidate.evaluation.assessment.status === "admitted";
  return candidate.residual < best.residual - 1e-12
    || (Math.abs(candidate.residual - best.residual) <= 1e-12 && candidate.tieResidual! < best.tieResidual! - 1e-12);
}
function keyV1(point: RecoveryPointV1) { return `${point[0]}:${point[1].toFixed(8)}`; }
function ownedV1<T>(value: T): T { return cloneAndFreezeCanonicalJson(value as CanonicalJsonValue) as T; }
