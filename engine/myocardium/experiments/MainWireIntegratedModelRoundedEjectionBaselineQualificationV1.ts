import {
  checkpointMainWireIntegratedModelStandard68V1,
  restoreMainWireIntegratedModelStandard68V1,
  type MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  checkpointMainWireIntegratedModelStandardV2,
  type RestoredMainWireIntegratedModelStandardCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  assertMainWireIntegratedModelBaselineValidationPassedV1,
  buildMainWireIntegratedModelBaselineValidationChecksV1,
  measureMainWireIntegratedModelExactBaselineCardiacSizeAndFunctionV1,
  measureMainWireIntegratedModelExactBaselineHemodynamicPressureV1,
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
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import type {
  MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type {
  MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  warmStartMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID =
  "main-wire-integrated-model-rounded-ejection-baseline-qualification-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1 =
  0.002 as const;

export type MainWireIntegratedModelRoundedEjectionBaselineQualificationV1 =
  Readonly<{
    qualificationId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID;
    nominalDtSec: number;
    completedCycleCount: number;
    classification: MainWireIntegratedModelPeriodicClassificationV3;
    measurements: MainWireIntegratedModelBaselineValidationMeasurementsV1;
    checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[];
    checkpoint: MainWireIntegratedModelStandard68CheckpointV1;
    terminalTrace:
      readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  }>;

export type MainWireIntegratedModelRoundedEjectionCandidateInitializationV1 =
  | Readonly<{ kind: "cold" }>
  | Readonly<{
      kind: "standard68-exact-checkpoint";
      checkpoint: MainWireIntegratedModelStandard68CheckpointV1;
    }>
  | Readonly<{
      kind: "standard68-parameter-continuation";
      sourceCheckpoint: MainWireIntegratedModelStandard68CheckpointV1;
      sourceHemodynamicResearchInputs:
        MainWireIntegratedModelHemodynamicResearchInputsV3;
      sourceVentricularContractilityScale: number;
      sourceMechanismResearchInputs:
        MainWireIntegratedModelMechanismResearchInputsV3;
    }>;

export type MainWireIntegratedModelRoundedEjectionCandidateOptionsV1 =
  Readonly<{
    hemodynamicResearchInputs?:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
    ventricularContractilityScale?: number;
    mechanismResearchInputs?:
      MainWireIntegratedModelMechanismResearchInputsV3;
    nominalDtSec?: number;
    initialization?:
      MainWireIntegratedModelRoundedEjectionCandidateInitializationV1;
  }>;

export class MainWireIntegratedModelRoundedEjectionObservationUnavailableErrorV1
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "MainWireIntegratedModelRoundedEjectionObservationUnavailableErrorV1";
  }
}

export class MainWireIntegratedModelRoundedEjectionInitializationRejectedErrorV1
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "MainWireIntegratedModelRoundedEjectionInitializationRejectedErrorV1";
  }
}

/**
 * Release-time qualification of the exact Standard68 default construction.
 * It uses the preregistered complete-state period-1 policy and raw accepted
 * endpoints. The separately advanced exact Session must land on the identical
 * accepted boundary before its settled checkpoint can be admitted.
 */
export async function qualifyMainWireIntegratedModelRoundedEjectionBaselineV1():
  Promise<MainWireIntegratedModelRoundedEjectionBaselineQualificationV1> {
  const qualification =
    await evaluateMainWireIntegratedModelRoundedEjectionCandidateV1();
  assertMainWireIntegratedModelBaselineValidationPassedV1(
    qualification.checks,
    qualification.measurements,
  );
  return qualification;
}

/**
 * Exact candidate execution used by analysis-owned calibration. Unlike the
 * release qualifier, this returns completed candidates whose construction
 * gates fail, so an optimizer cannot confuse a valid simulation with a mint.
 */
export async function evaluateMainWireIntegratedModelRoundedEjectionCandidateV1(
  options: MainWireIntegratedModelRoundedEjectionCandidateOptionsV1 = {},
): Promise<MainWireIntegratedModelRoundedEjectionBaselineQualificationV1> {
  const hemodynamicResearchInputs = options.hemodynamicResearchInputs
    ?? MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1;
  const ventricularContractilityScale =
    options.ventricularContractilityScale ?? 1;
  const mechanismResearchInputs = options.mechanismResearchInputs
    ?? MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1;
  const nominalDtSec = options.nominalDtSec
    ?? MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_NOMINAL_DT_SEC_V1;
  if (!(nominalDtSec > 0) || !Number.isFinite(nominalDtSec)) {
    throw new Error(
      "rounded-ejection candidate nominalDtSec must be positive and finite",
    );
  }
  const initialization = options.initialization
    ?? Object.freeze({ kind: "cold" as const });
  const fixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    mechanismResearchInputs,
  );
  const periodicFixture = fixture as unknown as
    MainWireIntegratedModelRegularSinusAllOffFixtureV3;
  const protocolIdentityHash = await sha256CanonicalJsonHex(Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID,
    nominalDtSec,
    periodicPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    referenceScales: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
    construction:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
    candidate: Object.freeze({
      hemodynamicResearchInputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    }),
    initialization: candidateInitializationIdentityV1(initialization),
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
  let restored: RestoredMainWireIntegratedModelStandardCheckpointV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  > | null;
  let continuedAcceptedState:
    MainWireNormalAdultFiveWallAcceptedStateV1 | null = null;
  try {
    if (initialization.kind === "standard68-exact-checkpoint") {
      restored = await restoreMainWireIntegratedModelStandard68V1(
          Object.freeze({
            base: Object.freeze({
              ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
                periodicFixture,
              ),
              mechanismResearchInputs: fixture.mechanismResearchInputs,
            }),
            roundedEjectionAssemblyId: fixture.roundedEjectionAssemblyId,
          }),
          initialization.checkpoint,
        );
    } else if (initialization.kind === "standard68-parameter-continuation") {
      const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
        initialization.sourceHemodynamicResearchInputs,
        initialization.sourceVentricularContractilityScale,
        initialization.sourceMechanismResearchInputs,
      );
      const restoredSource = await restoreMainWireIntegratedModelStandard68V1(
        Object.freeze({
          base: Object.freeze({
            ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
              sourceFixture,
            ),
            mechanismResearchInputs: sourceFixture.mechanismResearchInputs,
          }),
          roundedEjectionAssemblyId: sourceFixture.roundedEjectionAssemblyId,
        }),
        initialization.sourceCheckpoint,
      );
      continuedAcceptedState = warmStartMainWireIntegratedModelV3({
        source: restoredSource.acceptedState,
        sourceRuntime: sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
        targetRuntime: fixture as unknown as MainWireIntegratedModelRuntimeV3,
      });
      restored = null;
    } else {
      restored = null;
    }
  } catch (error) {
    throw new MainWireIntegratedModelRoundedEjectionInitializationRejectedErrorV1(
      error instanceof Error ? error.message : String(error),
    );
  }
  let accepted = continuedAcceptedState
    ?? restored?.acceptedState
    ?? fixture.cold.acceptedState;
  const boundaries = [accepted];
  const observations: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
  let terminalTrace:
    readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] = [];
  let classification = classifyMainWireIntegratedModelPeriodicityV3(
    observations,
    classifierOptions,
  );
  let completedCycleCount = 0;
  const beatAccumulator = continuedAcceptedState === null
    ? restored?.beatAccumulator ?? new MainWireIntegratedModelBeatAccumulatorV3()
    : new MainWireIntegratedModelBeatAccumulatorV3();
  let completedBeatMetrics:
    MainWireIntegratedModelCompletedBeatMetricsV3 | null =
      continuedAcceptedState === null
        ? restored?.completedBeatMetrics ?? null
        : null;

  for (
    let cycleIndex = 1;
    cycleIndex <= MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.maximumCycleCount;
    cycleIndex += 1
  ) {
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      periodicFixture,
      accepted,
      cycleIndex,
      nominalDtSec,
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
  let measurements: MainWireIntegratedModelBaselineValidationMeasurementsV1;
  try {
    if (completedBeatMetrics === null) {
      throw new Error("candidate execution completed no beat");
    }
    const traceMeasurements =
      measureMainWireIntegratedModelBaselineValidationV1(terminalTrace);
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
      throw new Error("candidate exact beat metrics are incomplete");
    }
    // Release gates use the same accepted-step beat owner exposed as exact
    // outputs. Morphology, E/A, ICT, and IRT remain analysis-owned trace
    // measurements and are never reserved as placeholders in exact frames.
    measurements = Object.freeze({
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
      hemodynamicPressure:
        measureMainWireIntegratedModelExactBaselineHemodynamicPressureV1(
          completedBeatMetrics,
        ),
      cardiacSizeAndFunction:
        measureMainWireIntegratedModelExactBaselineCardiacSizeAndFunctionV1(
          completedBeatMetrics,
        ),
    });
  } catch (error) {
    throw new MainWireIntegratedModelRoundedEjectionObservationUnavailableErrorV1(
      error instanceof Error ? error.message : String(error),
    );
  }
  const checks = buildMainWireIntegratedModelBaselineValidationChecksV1(
    measurements,
    period1Established,
  );

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
    nominalDtSec,
    completedCycleCount,
    classification,
    measurements,
    checks,
    checkpoint,
    terminalTrace,
  });
}

type MainWireNormalAdultFiveWallAcceptedStateV1 = Readonly<
  ReturnType<typeof warmStartMainWireIntegratedModelV3>
>;

function candidateInitializationIdentityV1(
  initialization: MainWireIntegratedModelRoundedEjectionCandidateInitializationV1,
) {
  if (initialization.kind === "cold") return initialization;
  if (initialization.kind === "standard68-exact-checkpoint") {
    return Object.freeze({
      kind: initialization.kind,
      checkpointSha256: initialization.checkpoint.checkpointSha256,
    });
  }
  return Object.freeze({
    kind: initialization.kind,
    sourceCheckpointSha256:
      initialization.sourceCheckpoint.checkpointSha256,
    sourceHemodynamicResearchInputs:
      initialization.sourceHemodynamicResearchInputs,
    sourceVentricularContractilityScale:
      initialization.sourceVentricularContractilityScale,
    sourceMechanismResearchInputs:
      initialization.sourceMechanismResearchInputs,
  });
}
