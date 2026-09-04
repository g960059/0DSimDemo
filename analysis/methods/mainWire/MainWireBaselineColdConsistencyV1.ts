import { canonicalJsonStringify } from "@/engine/integrity";
import type { MainWireStandard70BaselineCalibrationAcceptedEvaluationV1 } from
  "./MainWireStandard70BaselineCalibrationEvaluatorV1";

export const MAIN_WIRE_BASELINE_COLD_CONSISTENCY_V1_ID = "main-wire-baseline-cold-consistency-v1" as const;
export const MAIN_WIRE_BASELINE_COLD_CONSISTENCY_POLICY_V1 = Object.freeze({
  provenance: "existing-fixed-tone-output-closure-scales-with-extrema-and-event-resolution-extension" as const,
  maximumAorticPressureDifferenceMmHg: 0.5,
  maximumAtrialPressureDifferenceMmHg: 0.15,
  maximumCardiacOutputAbsoluteDifferenceLPerMin: 0.05,
  maximumCardiacOutputRelativeDifference: 0.01,
  maximumVentricularVolumeDifferenceMl: 1,
  maximumEjectionDurationDifferenceInNominalSteps: 2,
  // Beat durations subtract different absolute clocks after cold/warm runs.
  maximumBeatDurationRoundoffSec: 1e-9,
  comparison: "same-dt-initialization-consistency-not-unique-equilibrium-or-accuracy-proof" as const,
  physiologicalNormalityClaimed: false as const,
});

export type MainWireBaselineColdConsistencySourceV1 = Readonly<{
  evaluation: MainWireStandard70BaselineCalibrationAcceptedEvaluationV1;
  /** Actual candidate inputs, excluding initialization and dt. Caller verifies
   * request identities and the exact checkpoints before supplying evidence. */
  candidateIdentitySha256: string;
}>;
export type MainWireBaselineColdConsistencyInputV1 = Readonly<{
  warm: MainWireBaselineColdConsistencySourceV1;
  cold: MainWireBaselineColdConsistencySourceV1;
}>;

const fieldsV1 = [
  ["aortic-pressure.maximum", "mmHg"], ["aortic-pressure.minimum", "mmHg"],
  ["aortic-pressure.mean", "mmHg"], ["systemic-forward-flow.cardiac-index", "L/min/m2"],
  ["central-venous-pressure.mean", "mmHg"], ["pcwp-surrogate.mean", "mmHg"],
  ["left-ventricle.edv", "mL"], ["left-ventricle.esv", "mL"],
  ["right-ventricle.edv", "mL"], ["right-ventricle.esv", "mL"],
  ["aortic-valve.ejection-time", "s"], ["pulmonary-valve.ejection-time", "s"],
] as const;
type FieldV1 = (typeof fieldsV1)[number][0];
type SnapshotV1 = Readonly<{
  candidateIdentitySha256: string; requestIdentitySha256: string; exactModelIdentitySha256: string;
  constructionPolicyIdentitySha256: string; constructionPolicyRevisionId: string;
  evaluatorId: string; observationMethodId: string; objectiveAnalysisMethodId: string; safetyAnalysisMethodId: string;
  initializationKind: string; nominalDtSec: number; checkpointSha256: string;
  modelIdentity: Readonly<Record<string, string>>; bodySurfaceAreaM2: number; beatDurationSec: number;
  values: Readonly<Record<FieldV1, number>>;
}>;
type SourcesV1 = Readonly<{ warm: SnapshotV1; cold: SnapshotV1 }>;
const initializationKindsV1 = ["cold", "standard68-construction-continuation", "standard70-exact-checkpoint", "standard70-parameter-continuation"];

/** Cheap final-only observation. It does not run, restore, or alter the model.
 * P1's successive-beat tolerance is not an equilibrium error bound: use the
 * existing dimensional output scales, without the reservoir stop factor 0.1.
 * Two nominal steps allow the two sampled ends of an ejection duration. */
export function evaluateMainWireBaselineColdConsistencyV1(input: MainWireBaselineColdConsistencyInputV1) {
  let sources: SourcesV1 | null = null;
  let issue: string | null = null;
  try {
    sources = Object.freeze({ warm: snapshotV1(input.warm), cold: snapshotV1(input.cold) });
    validatePairV1(sources);
  } catch (error) { issue = error instanceof Error ? error.message : "invalid-source"; }
  return reportV1(sources, issue);
}
export type MainWireBaselineColdConsistencyV1 = ReturnType<typeof evaluateMainWireBaselineColdConsistencyV1>;

/** Recompute persisted passed evidence rather than trusting its status. Supply
 * either or both actual sources to bind their identities and exact readbacks.
 * The caller still owns candidate/request hashing and checkpoint validation. */
export function assertMainWireBaselineColdConsistencyV1(
  value: unknown, boundSources: Partial<MainWireBaselineColdConsistencyInputV1> = {},
): asserts value is MainWireBaselineColdConsistencyV1 {
  try {
    const report = recordV1(value), sources = recordV1(report.sources) as unknown as SourcesV1;
    validateSnapshotV1(sources.warm); validateSnapshotV1(sources.cold); validatePairV1(sources);
    if (report.status !== "passed" || canonicalJsonStringify(report) !== canonicalJsonStringify(reportV1(sources, null))) {
      throw new Error("report-policy-coverage-or-arithmetic-mismatch");
    }
    for (const side of ["warm", "cold"] as const) if (boundSources[side] !== undefined
      && canonicalJsonStringify(snapshotV1(boundSources[side]!)) !== canonicalJsonStringify(sources[side])) {
      throw new Error(`${side}-evaluation-binding-mismatch`);
    }
  } catch (error) {
    throw new Error(`Cold consistency report is not bound passed V1 evidence: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function snapshotV1(source: MainWireBaselineColdConsistencySourceV1): SnapshotV1 {
  const e = source.evaluation, q = e.exactResult;
  if (e.status !== "accepted" || q.classification.status !== "period1-converged") throw new Error("accepted-period1-required");
  if (e.nominalDtSec !== q.nominalDtSec || e.initializationKind !== q.initializationKind) throw new Error("evaluation-exact-metadata-mismatch");
  const beat = q.checkpoint.baseStandardCheckpointV2.completedBeatMetrics;
  if (!beat || !nearV1(beat.endTimeSec - beat.startTimeSec, beat.durationSec)) throw new Error("complete-exact-beat-required");
  const measurements = q.measurements, size = measurements.cardiacSizeAndFunction, pressure = measurements.hemodynamicPressure;
  const values = [pressure.aortic.maximumMmHg, pressure.aortic.minimumMmHg, beat.meanAorticPressureMmHg,
    size.systemicForwardFlow.cardiacIndexLPerMinPerM2, pressure.centralVenousMeanMmHg, pressure.pcwpSurrogateMeanMmHg,
    size.leftVentricle.endDiastolicVolumeMl, size.leftVentricle.endSystolicVolumeMl,
    size.rightVentricle.endDiastolicVolumeMl, size.rightVentricle.endSystolicVolumeMl,
    measurements.aorticValve.ejectionTimeSec, measurements.pulmonaryValve.ejectionTimeSec];
  const left = beat.leftVentricularValveEventMetrics, right = beat.rightVentricularValveEventMetrics;
  const exact = [beat.pressureSummaries.Ao.maximumMmHg, beat.pressureSummaries.Ao.minimumMmHg,
    beat.pressureSummaries.Ao.timeWeightedMeanMmHg, beat.nativeLeftCardiacOutputLPerMin / size.bodySurfaceAreaM2,
    beat.pressureSummaries.RA.timeWeightedMeanMmHg, beat.pressureSummaries.LA.timeWeightedMeanMmHg,
    left.endDiastolic?.volumeMl, left.endSystolic?.volumeMl, right.endDiastolic?.volumeMl, right.endSystolic?.volumeMl,
    beat.valveForwardPressureGradients.AoV.forwardFlowDurationSec, beat.valveForwardPressureGradients.PV.forwardFlowDurationSec];
  if (values.some((v, i) => !nearV1(v, exact[i]))
    || !nearV1(size.systemicForwardFlow.cardiacOutputLPerMin, beat.nativeLeftCardiacOutputLPerMin)) {
    throw new Error("measurement-exact-beat-binding-mismatch");
  }
  const snapshot = Object.freeze({ candidateIdentitySha256: source.candidateIdentitySha256,
    requestIdentitySha256: e.requestIdentitySha256, exactModelIdentitySha256: e.exactModelIdentitySha256,
    constructionPolicyIdentitySha256: e.constructionPolicyIdentitySha256, constructionPolicyRevisionId: e.constructionPolicyRevisionId,
    evaluatorId: e.evaluatorId, observationMethodId: (q as typeof q & { observation?: { methodId?: string } }).observation?.methodId,
    objectiveAnalysisMethodId: e.objectiveAnalysisMethodId, safetyAnalysisMethodId: e.safetyAnalysisMethodId,
    initializationKind: e.initializationKind, nominalDtSec: e.nominalDtSec, checkpointSha256: q.checkpoint.checkpointSha256,
    modelIdentity: Object.freeze({ ...q.checkpoint.modelIdentity }), bodySurfaceAreaM2: size.bodySurfaceAreaM2,
    beatDurationSec: beat.durationSec,
    values: Object.freeze(Object.fromEntries(fieldsV1.map(([id], i) => [id, values[i]])) as Record<FieldV1, number>),
  });
  validateSnapshotV1(snapshot);
  return snapshot;
}

function validateSnapshotV1(value: unknown): asserts value is SnapshotV1 {
  const s = recordV1(value), values = recordV1(s.values), model = recordV1(s.modelIdentity);
  if ([s.candidateIdentitySha256, s.requestIdentitySha256, s.exactModelIdentitySha256,
    s.constructionPolicyIdentitySha256, s.checkpointSha256].some((v) => typeof v !== "string" || !/^[0-9a-f]{64}$/.test(v))) {
    throw new Error("invalid-source-identity");
  }
  if ([s.constructionPolicyRevisionId, s.evaluatorId, s.observationMethodId, s.objectiveAnalysisMethodId, s.safetyAnalysisMethodId]
    .some((v) => typeof v !== "string" || !v.length) || !initializationKindsV1.includes(s.initializationKind as string)
    || !Object.keys(model).length || Object.values(model).some((v) => typeof v !== "string" || !v.length)) {
    throw new Error("invalid-source-method-or-model");
  }
  if ([s.nominalDtSec, s.bodySurfaceAreaM2, s.beatDurationSec].some((v) => !finiteV1(v) || v <= 0)
    || (s.nominalDtSec as number) >= (s.beatDurationSec as number)
    || Object.keys(values).length !== fieldsV1.length || fieldsV1.some(([id]) => !finiteV1(values[id]))) {
    throw new Error("missing-finite-numerical-observation");
  }
}

function validatePairV1({ warm, cold }: SourcesV1): void {
  if (cold.initializationKind !== "cold") throw new Error("cold-initialization-required");
  if (warm.candidateIdentitySha256 !== cold.candidateIdentitySha256) throw new Error("candidate-identity-mismatch");
  if (warm.nominalDtSec !== cold.nominalDtSec) throw new Error("same-dt-required");
  if (warm.bodySurfaceAreaM2 !== cold.bodySurfaceAreaM2
    || Math.abs(warm.beatDurationSec - cold.beatDurationSec) > MAIN_WIRE_BASELINE_COLD_CONSISTENCY_POLICY_V1.maximumBeatDurationRoundoffSec) {
    throw new Error("body-size-or-beat-clock-mismatch");
  }
  if (warm.exactModelIdentitySha256 !== cold.exactModelIdentitySha256
    || canonicalJsonStringify(warm.modelIdentity) !== canonicalJsonStringify(cold.modelIdentity)) throw new Error("exact-model-identity-mismatch");
  if (["constructionPolicyIdentitySha256", "constructionPolicyRevisionId", "evaluatorId", "observationMethodId",
    "objectiveAnalysisMethodId", "safetyAnalysisMethodId"].some((key) => warm[key] !== cold[key])) throw new Error("observation-or-policy-mismatch");
}

function reportV1(sources: SourcesV1 | null, issue: string | null) {
  const policy = MAIN_WIRE_BASELINE_COLD_CONSISTENCY_POLICY_V1;
  const checks = issue !== null || sources === null ? [] : fieldsV1.map(([checkId, unit], i) => {
    const warm = sources.warm.values[checkId], cold = sources.cold.values[checkId];
    const tolerance = i < 3 ? policy.maximumAorticPressureDifferenceMmHg
      : i === 3 ? Math.max(policy.maximumCardiacOutputAbsoluteDifferenceLPerMin / sources.warm.bodySurfaceAreaM2,
        policy.maximumCardiacOutputRelativeDifference * Math.max(Math.abs(warm), Math.abs(cold)))
        : i < 6 ? policy.maximumAtrialPressureDifferenceMmHg
          : i < 10 ? policy.maximumVentricularVolumeDifferenceMl
            : policy.maximumEjectionDurationDifferenceInNominalSteps * sources.warm.nominalDtSec;
    const absoluteDifference = Math.abs(warm - cold);
    return Object.freeze({ checkId, unit, warm, cold, absoluteDifference, tolerance,
      status: absoluteDifference <= tolerance + roundingV1(warm, cold) ? "passed" as const : "failed" as const });
  });
  return Object.freeze({ methodId: MAIN_WIRE_BASELINE_COLD_CONSISTENCY_V1_ID,
    status: issue !== null || sources === null ? "unresolved" as const
      : checks.some((c) => c.status === "failed") ? "failed" as const : "passed" as const,
    policy, sources, issue, checks: Object.freeze(checks) });
}

function recordV1(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("missing-source-record");
  return value as Record<string, unknown>;
}
function finiteV1(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function roundingV1(a: number, b: number): number { return 128 * Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b)); }
function nearV1(a: unknown, b: unknown): boolean { return finiteV1(a) && finiteV1(b) && Math.abs(a - b) <= roundingV1(a, b); }
