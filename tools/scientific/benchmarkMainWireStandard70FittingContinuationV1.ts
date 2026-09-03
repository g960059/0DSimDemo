import type {
  MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  evaluateMainWireIntegratedModelStandard70CandidateV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import { cloneAndFreezeStudioJson } from "@/domain/json/CanonicalJson";
import standard69CheckpointJsonV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-settled-baseline-checkpoint.json";

const sourceCheckpoint = cloneAndFreezeStudioJson(
  standard69CheckpointJsonV1,
) as unknown as MainWireIntegratedModelStandard68CheckpointV1;

const includeColdReference =
  process.env.CIRCLEHEART_STANDARD70_BENCHMARK_COLD === "1";
const coldStartedAt = performance.now();
const cold = includeColdReference
  ? await evaluateMainWireIntegratedModelStandard70CandidateV1({
      initialization: Object.freeze({ kind: "cold" as const }),
    })
  : null;
const coldDurationMs = performance.now() - coldStartedAt;

const constructionStartedAt = performance.now();
const construction =
  await evaluateMainWireIntegratedModelStandard70CandidateV1({
    initialization: Object.freeze({
      kind: "standard68-construction-continuation" as const,
      sourceCheckpoint,
      sourceHemodynamicResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
      sourceVentricularContractilityScale: 1,
      sourceMechanismResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
    }),
  });
const constructionDurationMs = performance.now() - constructionStartedAt;

const verifiedStartedAt = performance.now();
const verified = await evaluateMainWireIntegratedModelStandard70CandidateV1({
  initialization: Object.freeze({
    kind: "standard70-exact-checkpoint" as const,
    checkpoint: construction.checkpoint,
  }),
});
const verifiedDurationMs = performance.now() - verifiedStartedAt;

const neighborInputs = Object.freeze({
  ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  systemicResistance:
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1
      .systemicResistance + 0.01,
});
const neighborStartedAt = performance.now();
const neighbor = await evaluateMainWireIntegratedModelStandard70CandidateV1({
  hemodynamicResearchInputs: neighborInputs,
  initialization: Object.freeze({
    kind: "standard70-parameter-continuation" as const,
    sourceCheckpoint: construction.checkpoint,
    sourceHemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
    sourceVentricularContractilityScale: 1,
    sourceMechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
  }),
});
const neighborDurationMs = performance.now() - neighborStartedAt;

process.stdout.write(`${JSON.stringify({
  benchmarkId: "main-wire-standard70-fitting-continuation-benchmark-v1",
  performanceIsMachineLocalAndNonGating: true,
  coldReference: cold === null
    ? "set CIRCLEHEART_STANDARD70_BENCHMARK_COLD=1 to include"
    : summaryV1(cold, coldDurationMs),
  baselineColdWallTimeRatios: cold === null
    ? null
    : Object.freeze({
        constructionContinuation: coldDurationMs / constructionDurationMs,
        verifiedCheckpoint: coldDurationMs / verifiedDurationMs,
      }),
  constructionContinuation: summaryV1(
    construction,
    constructionDurationMs,
  ),
  verifiedCheckpoint: summaryV1(verified, verifiedDurationMs),
  nearestCandidateContinuation: summaryV1(neighbor, neighborDurationMs),
}, null, 2)}\n`);

function summaryV1(
  qualification: Awaited<
    ReturnType<typeof evaluateMainWireIntegratedModelStandard70CandidateV1>
  >,
  durationMs: number,
) {
  return Object.freeze({
    durationMs,
    completedCycleCount: qualification.completedCycleCount,
    periodicity: qualification.classification.status,
    latestPeriod1MaximumNormalizedDelta:
      qualification.classification.latestPeriod1MaximumNormalizedDelta,
    failedChecks: qualification.checks
      .filter(({ status }) => status === "failed")
      .map(({ checkId, actual, minimum, maximum }) =>
        Object.freeze({ checkId, actual, minimum, maximum })),
    selectedMeasurements: Object.freeze({
      aorticPressureMaximumMmHg:
        qualification.measurements.hemodynamicPressure.aortic.maximumMmHg,
      pulmonaryValve: qualification.measurements.pulmonaryValve,
      rightVentricle: qualification.measurements.rightVentricle,
      tricuspidPeakEToA: qualification.measurements.tricuspidFlow.peakEToA,
      rightTiming: qualification.measurements.rightTiming,
      RVP: qualification.measurements.RVP,
      pulmonaryRootMorphology:
        qualification.measurements.pulmonaryRootMorphology,
    }),
  });
}
