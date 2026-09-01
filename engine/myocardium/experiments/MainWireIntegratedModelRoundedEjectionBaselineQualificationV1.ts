import {
  checkpointMainWireIntegratedModelStandard68V1,
  type MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  checkpointMainWireIntegratedModelStandardV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  assertMainWireIntegratedModelBaselineValidationPassedV1,
  buildMainWireIntegratedModelBaselineValidationChecksV1,
  measureMainWireIntegratedModelBaselineValidationV1,
  type MainWireIntegratedModelBaselineValidationCheckV1,
  type MainWireIntegratedModelBaselineValidationMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  classifyMainWireIntegratedModelPeriodicityV3,
  type MainWireIntegratedModelPeriodicClassificationV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import {
  compareMainWireIntegratedModelAcceptedStatesV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID =
  "main-wire-integrated-model-rounded-ejection-baseline-qualification-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1 =
  0.002 as const;

export type MainWireIntegratedModelRoundedEjectionBaselineQualificationV1 =
  Readonly<{
    qualificationId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID;
    nominalDtSec:
      typeof MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1;
    completedCycleCount: number;
    classification: MainWireIntegratedModelPeriodicClassificationV3;
    measurements: MainWireIntegratedModelBaselineValidationMeasurementsV1;
    checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[];
    checkpoint: MainWireIntegratedModelStandard68CheckpointV1;
    terminalTrace:
      readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  }>;

/**
 * Release-time qualification of the exact Standard68 default construction.
 * It uses the preregistered complete-state period-1 policy and raw accepted
 * endpoints. The separately advanced exact Session must land on the identical
 * accepted boundary before its settled checkpoint can be admitted.
 */
export async function qualifyMainWireIntegratedModelRoundedEjectionBaselineV1():
  Promise<MainWireIntegratedModelRoundedEjectionBaselineQualificationV1> {
  const fixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
  const periodicFixture = fixture as unknown as
    MainWireIntegratedModelRegularSinusAllOffFixtureV3;
  const protocolIdentityHash = await sha256CanonicalJsonHex(Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID,
    nominalDtSec:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1,
    periodicPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    referenceScales: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
    construction:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
  }));
  const classifierOptions = Object.freeze({
    period1NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
    period2NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3
        .period2MinimumPeriod1NormalizedDelta,
    consecutiveCycles:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles,
  });
  let accepted = fixture.cold.acceptedState;
  const boundaries = [accepted];
  const observations: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
  let terminalTrace:
    readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] = [];
  let classification = classifyMainWireIntegratedModelPeriodicityV3(
    observations,
    classifierOptions,
  );
  let completedCycleCount = 0;
  const beatAccumulator = new MainWireIntegratedModelBeatAccumulatorV3();
  let completedBeatMetrics:
    MainWireIntegratedModelCompletedBeatMetricsV3 | null = null;

  for (
    let cycleIndex = 1;
    cycleIndex <= MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.maximumCycleCount;
    cycleIndex += 1
  ) {
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      periodicFixture,
      accepted,
      cycleIndex,
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1,
      (step) => {
        completedBeatMetrics =
          beatAccumulator.accept(step) ?? completedBeatMetrics;
      },
    );
    accepted = run.terminalAcceptedState;
    const previous = boundaries.at(-1)!;
    const twoBack = boundaries.length >= 2 ? boundaries.at(-2)! : null;
    observations.push(Object.freeze({
      cycleIndex,
      evidenceRole: "canonical-periodic-protocol" as const,
      protocolIdentityHash,
      period1: compareMainWireIntegratedModelAcceptedStatesV3(
        accepted,
        previous,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        fixture.config,
      ),
      period2: twoBack === null
        ? null
        : compareMainWireIntegratedModelAcceptedStatesV3(
            accepted,
            twoBack,
            MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
            fixture.config,
          ),
    }));
    classification = classifyMainWireIntegratedModelPeriodicityV3(
      observations,
      classifierOptions,
    );
    completedCycleCount = cycleIndex;
    terminalTrace = run.traceSamples;
    boundaries.push(accepted);
    if (boundaries.length > 3) boundaries.shift();
    if (classification.status !== "not-converged") break;
  }

  const period1Established = classification.status === "period1-converged";
  if (completedBeatMetrics === null) {
    throw new Error("Standard68 baseline qualification completed no beat");
  }
  const traceMeasurements = measureMainWireIntegratedModelBaselineValidationV1(
    terminalTrace,
  );
  const exactAorticValve = completedBeatMetrics
    .valveForwardPressureGradients.AoV;
  const exactLeftVentricularPressureRate = completedBeatMetrics
    .ventricularAbsolutePressureRateExtrema.LV;
  if (
    exactAorticValve.timeWeightedMeanMmHg === null
    || exactAorticValve.peakMmHg === null
    || exactLeftVentricularPressureRate.maximumMmHgPerSec === null
    || exactLeftVentricularPressureRate.minimumMmHgPerSec === null
  ) {
    throw new Error(
      "Standard68 baseline exact beat metrics are incomplete",
    );
  }
  // Release gates use the same accepted-step beat owner exposed as exact
  // outputs. Morphology, E/A, ICT, and IRT remain analysis-owned trace
  // measurements and are never reserved as placeholders in exact frames.
  const measurements = Object.freeze({
    ...traceMeasurements,
    aorticValve: Object.freeze({
      ejectionTimeSec: exactAorticValve.forwardFlowDurationSec,
      meanGradientMmHg: exactAorticValve.timeWeightedMeanMmHg,
      peakGradientMmHg: exactAorticValve.peakMmHg,
    }),
    leftVentricle: Object.freeze({
      maximumDpDtMmHgPerSec:
        exactLeftVentricularPressureRate.maximumMmHgPerSec,
      minimumDpDtMmHgPerSec:
        exactLeftVentricularPressureRate.minimumMmHgPerSec,
    }),
  }) satisfies MainWireIntegratedModelBaselineValidationMeasurementsV1;
  const checks = buildMainWireIntegratedModelBaselineValidationChecksV1(
    measurements,
    period1Established,
  );
  assertMainWireIntegratedModelBaselineValidationPassedV1(checks);

  const baseCheckpoint = await checkpointMainWireIntegratedModelStandardV2(
    Object.freeze({
      ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        periodicFixture,
      ),
      mechanismResearchInputs: fixture.mechanismResearchInputs,
    }),
    accepted,
    beatAccumulator,
    completedBeatMetrics,
  );
  const checkpoint = await checkpointMainWireIntegratedModelStandard68V1(
    fixture.roundedEjectionAssemblyId,
    baseCheckpoint,
  );

  return Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID,
    nominalDtSec:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1,
    completedCycleCount,
    classification,
    measurements,
    checks,
    checkpoint,
    terminalTrace,
  });
}
