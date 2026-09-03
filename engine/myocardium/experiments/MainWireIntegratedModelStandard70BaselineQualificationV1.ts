import {
  restoreMainWireIntegratedModelStandard68V1,
  type MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  checkpointMainWireIntegratedModelStandard70V1,
  restoreMainWireIntegratedModelStandard70V1,
  type MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  checkpointMainWireIntegratedModelStandardV2,
  type RestoredMainWireIntegratedModelStandardCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  measureMainWireIntegratedModelBaselineValidationV1,
  measureMainWireIntegratedModelExactBaselineCardiacSizeAndFunctionV1,
  measureMainWireIntegratedModelExactBaselineHemodynamicPressureV1,
  type MainWireIntegratedModelBaselineValidationMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  assertMainWireIntegratedModelStandard70BaselinePassedV1,
  buildMainWireIntegratedModelStandard70BaselineChecksV1,
  measureMainWireIntegratedModelStandard70BaselineV1,
  type MainWireIntegratedModelStandard70BaselineCheckV1,
  type MainWireIntegratedModelStandard70BaselineMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
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
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
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

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID =
  "main-wire-integrated-model-standard70-baseline-qualification-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_NOMINAL_DT_SEC_V1 =
  0.002 as const;

export type MainWireIntegratedModelStandard70CandidateInitializationV1 =
  | Readonly<{ kind: "cold" }>
  | Readonly<{
      kind: "standard68-construction-continuation";
      sourceCheckpoint: MainWireIntegratedModelStandard68CheckpointV1;
      sourceHemodynamicResearchInputs:
        MainWireIntegratedModelHemodynamicResearchInputsV3;
      sourceVentricularContractilityScale: number;
      sourceMechanismResearchInputs:
        MainWireIntegratedModelMechanismResearchInputsV3;
    }>
  | Readonly<{
      kind: "standard70-exact-checkpoint";
      checkpoint: MainWireIntegratedModelStandard70CheckpointV1;
    }>
  | Readonly<{
      kind: "standard70-parameter-continuation";
      sourceCheckpoint: MainWireIntegratedModelStandard70CheckpointV1;
      sourceHemodynamicResearchInputs:
        MainWireIntegratedModelHemodynamicResearchInputsV3;
      sourceVentricularContractilityScale: number;
      sourceMechanismResearchInputs:
        MainWireIntegratedModelMechanismResearchInputsV3;
    }>;

export type MainWireIntegratedModelStandard70CandidateOptionsV1 = Readonly<{
  hemodynamicResearchInputs?: MainWireIntegratedModelHemodynamicResearchInputsV3;
  ventricularContractilityScale?: number;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
  nominalDtSec?: number;
  initialization?: MainWireIntegratedModelStandard70CandidateInitializationV1;
}>;

export type MainWireIntegratedModelStandard70BaselineQualificationV1 =
  Readonly<{
    qualificationId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID;
    nominalDtSec: number;
    initializationKind:
      MainWireIntegratedModelStandard70CandidateInitializationV1["kind"];
    completedCycleCount: number;
    classification: MainWireIntegratedModelPeriodicClassificationV3;
    measurements: MainWireIntegratedModelStandard70BaselineMeasurementsV1;
    checks: readonly MainWireIntegratedModelStandard70BaselineCheckV1[];
    checkpoint: MainWireIntegratedModelStandard70CheckpointV1;
    terminalTrace:
      readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  }>;

export async function qualifyMainWireIntegratedModelStandard70BaselineV1(
  sourceCheckpoint: MainWireIntegratedModelStandard68CheckpointV1,
): Promise<MainWireIntegratedModelStandard70BaselineQualificationV1> {
  const qualification =
    await evaluateMainWireIntegratedModelStandard70CandidateV1({
      hemodynamicResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
      mechanismResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
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
  assertMainWireIntegratedModelStandard70BaselinePassedV1(
    qualification.checks,
    qualification.measurements,
  );
  return qualification;
}

/**
 * Candidate runner for fitting and mint qualification. A verified same-model
 * checkpoint or nearest compatible candidate can be continued and then must
 * independently re-establish the exact three-cycle periodic criterion.
 */
export async function evaluateMainWireIntegratedModelStandard70CandidateV1(
  options: MainWireIntegratedModelStandard70CandidateOptionsV1 = {},
): Promise<MainWireIntegratedModelStandard70BaselineQualificationV1> {
  const hemodynamicResearchInputs = options.hemodynamicResearchInputs
    ?? MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1;
  const ventricularContractilityScale = options.ventricularContractilityScale
    ?? 1;
  const mechanismResearchInputs = options.mechanismResearchInputs
    ?? MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1;
  const nominalDtSec = options.nominalDtSec
    ?? MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_NOMINAL_DT_SEC_V1;
  if (!(nominalDtSec > 0) || !Number.isFinite(nominalDtSec)) {
    throw new Error("Standard70 candidate nominalDtSec must be positive finite");
  }
  const initialization = options.initialization
    ?? Object.freeze({ kind: "cold" as const });
  const fixture = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    mechanismResearchInputs,
  );
  const periodicFixture = fixture as unknown as
    MainWireIntegratedModelRegularSinusAllOffFixtureV3;
  const protocolIdentityHash = await sha256CanonicalJsonHex(Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID,
    nominalDtSec,
    periodicPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    referenceScales: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
    construction: fixture.algebraicPulmonaryRootAssemblyClaim,
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
  > | null = null;
  let continuedAcceptedState: MainWireAcceptedStateV1 | null = null;
  if (initialization.kind === "standard70-exact-checkpoint") {
    restored = await restoreMainWireIntegratedModelStandard70V1(
      standard70RestoreContextV1(fixture),
      initialization.checkpoint,
    );
  } else if (
    initialization.kind === "standard68-construction-continuation"
  ) {
    const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
      initialization.sourceHemodynamicResearchInputs,
      initialization.sourceVentricularContractilityScale,
      initialization.sourceMechanismResearchInputs,
    );
    const source = await restoreMainWireIntegratedModelStandard68V1(
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
      source: source.acceptedState,
      sourceRuntime: sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
      targetRuntime: fixture as unknown as MainWireIntegratedModelRuntimeV3,
    });
  } else if (initialization.kind === "standard70-parameter-continuation") {
    const sourceFixture =
      createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
        initialization.sourceHemodynamicResearchInputs,
        initialization.sourceVentricularContractilityScale,
        initialization.sourceMechanismResearchInputs,
      );
    const source = await restoreMainWireIntegratedModelStandard70V1(
      standard70RestoreContextV1(sourceFixture),
      initialization.sourceCheckpoint,
    );
    continuedAcceptedState = warmStartMainWireIntegratedModelV3({
      source: source.acceptedState,
      sourceRuntime: sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
      targetRuntime: fixture as unknown as MainWireIntegratedModelRuntimeV3,
    });
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
  let completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null =
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

  if (completedBeatMetrics === null) {
    throw new Error("Standard70 candidate execution completed no beat");
  }
  const traceMeasurements =
    measureMainWireIntegratedModelBaselineValidationV1(terminalTrace);
  const exactAorticValve =
    completedBeatMetrics.valveForwardPressureGradients.AoV;
  const exactLeftPressureRate =
    completedBeatMetrics.ventricularAbsolutePressureRateExtrema.LV;
  if (
    exactAorticValve.timeWeightedMeanMmHg === null
    || exactAorticValve.peakMmHg === null
  ) {
    throw new Error("Standard70 aortic beat metrics are incomplete");
  }
  const baseMeasurements: MainWireIntegratedModelBaselineValidationMeasurementsV1 =
    Object.freeze({
      ...traceMeasurements,
      aorticValve: Object.freeze({
        ejectionTimeSec: exactAorticValve.forwardFlowDurationSec,
        meanGradientMmHg: exactAorticValve.timeWeightedMeanMmHg,
        peakGradientMmHg: exactAorticValve.peakMmHg,
      }),
      leftVentricle: Object.freeze({
        maximumDpDtMmHgPerSec: exactLeftPressureRate.maximumMmHgPerSec,
        minimumDpDtMmHgPerSec: exactLeftPressureRate.minimumMmHgPerSec,
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
  const measurements = measureMainWireIntegratedModelStandard70BaselineV1(
    baseMeasurements,
    terminalTrace,
    completedBeatMetrics,
  );
  const checks = buildMainWireIntegratedModelStandard70BaselineChecksV1(
    measurements,
    classification.status === "period1-converged",
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
  const checkpoint = await checkpointMainWireIntegratedModelStandard70V1(
    fixture.algebraicPulmonaryRootAssemblyId,
    baseCheckpoint,
  );
  return Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID,
    nominalDtSec,
    initializationKind: initialization.kind,
    completedCycleCount,
    classification,
    measurements,
    checks,
    checkpoint,
    terminalTrace,
  });
}

type MainWireAcceptedStateV1 = Readonly<
  ReturnType<typeof warmStartMainWireIntegratedModelV3>
>;

function standard70RestoreContextV1(
  fixture: ReturnType<
    typeof createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1
  >,
) {
  return Object.freeze({
    base: Object.freeze({
      ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      ),
      mechanismResearchInputs: fixture.mechanismResearchInputs,
    }),
    algebraicPulmonaryRootAssemblyId:
      fixture.algebraicPulmonaryRootAssemblyId,
  });
}

function candidateInitializationIdentityV1(
  initialization: MainWireIntegratedModelStandard70CandidateInitializationV1,
) {
  if (initialization.kind === "cold") return initialization;
  if (initialization.kind === "standard70-exact-checkpoint") {
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
