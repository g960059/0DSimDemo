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
  type MainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1,
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
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID =
  "main-wire-integrated-model-standard70-baseline-qualification-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_NOMINAL_DT_SEC_V1 =
  0.002 as const;
export const MAIN_WIRE_STANDARD70_TIMING_AND_INLET_WINDOW_POLICY_V1_ID =
  "main-wire-standard70-timing-and-inlet-real-lookahead-window-v1" as const;

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
  /** Analysis-only callback: excluded from exact model, parameter and checkpoint
   * identities. Omission retains the historical measurement path unchanged. */
  timingAndInletObserver?: MainWireIntegratedModelStandard70TimingAndInletObserverV1;
}>;

export type MainWireIntegratedModelStandard70TimingAndInletObserverV1 = (input: Readonly<{
  terminalTrace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  completedBeat: MainWireIntegratedModelCompletedBeatMetricsV3;
}>) => Readonly<{
  left: MainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1;
  right: MainWireIntegratedModelBaselineVentricularTimingAndInletFlowV1;
}>;

export class MainWireIntegratedModelStandard70ObservationUnavailableErrorV1
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "MainWireIntegratedModelStandard70ObservationUnavailableErrorV1";
  }
}

export class MainWireIntegratedModelStandard70InitializationRejectedErrorV1
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "MainWireIntegratedModelStandard70InitializationRejectedErrorV1";
  }
}

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
    /** Actual accepted endpoints beyond the retained checkpoint, used only for
     * timing/inlet observation. The checkpoint and canonical cycle stay fixed. */
    timingAndInletTrace?: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
    timingAndInletObservationWindow?: MainWireStandard70TimingAndInletWindowV1;
  }>;

type MainWireStandard70TimingAndInletWindowV1 = Readonly<{
  policyId: typeof MAIN_WIRE_STANDARD70_TIMING_AND_INLET_WINDOW_POLICY_V1_ID;
  checkpointAcceptedTimeSec: number;
  observedThroughAcceptedTimeSec: number;
  lookaheadCycleCount: 1;
  executedLookaheadStepCount: number;
  retainedLookaheadStepCount: number;
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
  try {
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
        sourceRuntime:
          sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
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
        sourceRuntime:
          sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
        targetRuntime: fixture as unknown as MainWireIntegratedModelRuntimeV3,
      });
    }
  } catch (error) {
    throw new MainWireIntegratedModelStandard70InitializationRejectedErrorV1(
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
    // Each immutable report and its boundary chain has now been validated.
    // Retain the classifier's suffix plus its predecessor for the next call;
    // rewalking every historical closure report adds no new evidence.
    if (observations.length > classifierOptions.consecutiveCycles) observations.shift();
    completedCycleCount = cycleIndex;
    terminalTrace = run.traceSamples;
    boundaries.push(accepted);
    if (boundaries.length > 3) boundaries.shift();
    if (classification.status !== "not-converged") break;
  }

  let measurements: MainWireIntegratedModelStandard70BaselineMeasurementsV1;
  let timingWindow: Pick<MainWireIntegratedModelStandard70BaselineQualificationV1,
    "timingAndInletTrace" | "timingAndInletObservationWindow"> = {};
  try {
    if (completedBeatMetrics === null) {
      throw new Error("Standard70 candidate execution completed no beat");
    }
    if (options.timingAndInletObserver !== undefined) {
      timingWindow = completeMainWireStandard70TimingAndInletTraceV1({
        terminalTrace,
        completedBeatEndTimeSec: completedBeatMetrics.endTimeSec,
        runLookaheadCycle: () => runMainWireIntegratedModelRegularSinusAllOffCycleV3(
          periodicFixture, accepted, completedCycleCount + 1, nominalDtSec,
          // No beat-accumulator callback: this real measurement lookahead must
          // not advance the qualified state, completed beat or periodic chain.
        ).traceSamples,
      });
    }
    measurements = measureMainWireIntegratedModelStandard70CandidateEvidenceV1({
      terminalTrace, completedBeat: completedBeatMetrics,
      timingAndInletObserver: options.timingAndInletObserver,
      ...timingWindow,
    });
  } catch (error) {
    throw new MainWireIntegratedModelStandard70ObservationUnavailableErrorV1(
      error instanceof Error ? error.message : String(error),
    );
  }
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
    ...timingWindow,
  });
}

/** Re-observation reads the same source trace plus its recorded real suffix,
 * never a replacement trace silently detached from the qualified cycle. */
export function mainWireStandard70TimingAndInletObservationTraceV1(input: Pick<
  MainWireIntegratedModelStandard70BaselineQualificationV1,
  "terminalTrace" | "timingAndInletTrace" | "timingAndInletObservationWindow"
>) {
  const trace = input.timingAndInletTrace, window = input.timingAndInletObservationWindow;
  if (trace === undefined && window === undefined) return input.terminalTrace;
  const retained = (trace?.length ?? 0) - input.terminalTrace.length;
  if (trace === undefined || window === undefined
    || window.policyId !== MAIN_WIRE_STANDARD70_TIMING_AND_INLET_WINDOW_POLICY_V1_ID
    || window.lookaheadCycleCount !== 1 || retained <= 0 || window.retainedLookaheadStepCount !== retained
    || !Number.isSafeInteger(window.executedLookaheadStepCount) || window.executedLookaheadStepCount < retained
    || window.checkpointAcceptedTimeSec !== input.terminalTrace.at(-1)?.acceptedTimeSec
    || window.observedThroughAcceptedTimeSec !== trace.at(-1)?.acceptedTimeSec
    || !(window.observedThroughAcceptedTimeSec > window.checkpointAcceptedTimeSec)
    || canonicalJsonStringify(trace.slice(0, input.terminalTrace.length)) !== canonicalJsonStringify(input.terminalTrace)) {
    throw new Error("Timing/inlet lookahead is not bound to its original terminal trace and window");
  }
  return trace;
}

/** Fill only the missing real post-capture inlet closures. Executing one normal
 * cycle reuses the scheduler and all its invariants; retaining its shortest
 * required prefix avoids a second ejection in the timing evidence. No periodic
 * copy, extrapolated closure, or replacement completed beat is permitted. */
export function completeMainWireStandard70TimingAndInletTraceV1(input: Readonly<{
  terminalTrace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  completedBeatEndTimeSec: number;
  runLookaheadCycle: () => readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
}>): Pick<MainWireIntegratedModelStandard70BaselineQualificationV1,
  "timingAndInletTrace" | "timingAndInletObservationWindow"> {
  const { terminalTrace, completedBeatEndTimeSec } = input;
  if (terminalTrace.length < 2 || !Number.isFinite(completedBeatEndTimeSec)) {
    throw new Error("Timing/inlet window requires a terminal trace and finite completed-beat end");
  }
  const closures = new Set<"MV" | "TV">();
  const acceptPair = (previous: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
    next: MainWireIntegratedModelPeriodicTerminalTraceSampleV3) => {
    const elapsed = next.acceptedTimeSec - previous.acceptedTimeSec;
    const tolerance = 128 * Number.EPSILON * Math.max(1, Math.abs(next.acceptedTimeSec));
    if (!(elapsed > 0) || !Number.isFinite(elapsed) || !Number.isFinite(next.acceptedDtSec)
      || Math.abs(elapsed - next.acceptedDtSec) > tolerance) {
      throw new Error("Timing/inlet lookahead must contain contiguous actual accepted endpoints");
    }
    for (const valve of ["MV", "TV"] as const) {
      const left = previous.valveFlowMlPerSec[valve], right = next.valveFlowMlPerSec[valve];
      if (!Number.isFinite(left) || !Number.isFinite(right)) throw new Error("Timing/inlet window has nonfinite flow");
      if (left > 0 && right <= 0
        && previous.acceptedTimeSec + left / (left - right) * elapsed > completedBeatEndTimeSec) {
        closures.add(valve);
      }
    }
  };
  for (let index = 1; index < terminalTrace.length; index += 1) acceptPair(terminalTrace[index - 1]!, terminalTrace[index]!);
  if (closures.size === 2) return Object.freeze({});
  const lookahead = input.runLookaheadCycle();
  const last = terminalTrace.at(-1)!;
  let retainedLookaheadStepCount = 0;
  for (const next of lookahead) {
    acceptPair(retainedLookaheadStepCount === 0 ? last : lookahead[retainedLookaheadStepCount - 1]!, next);
    retainedLookaheadStepCount += 1;
    if (closures.size === 2) break;
  }
  if (closures.size !== 2) throw new Error("Timing/inlet observation has no complete post-capture inlet closures within one real lookahead cycle");
  return Object.freeze({
    timingAndInletTrace: Object.freeze([...terminalTrace, ...lookahead.slice(0, retainedLookaheadStepCount)]),
    timingAndInletObservationWindow: Object.freeze({
      policyId: MAIN_WIRE_STANDARD70_TIMING_AND_INLET_WINDOW_POLICY_V1_ID,
      checkpointAcceptedTimeSec: last.acceptedTimeSec,
      observedThroughAcceptedTimeSec: lookahead[retainedLookaheadStepCount - 1]!.acceptedTimeSec,
      lookaheadCycleCount: 1 as const,
      executedLookaheadStepCount: lookahead.length,
      retainedLookaheadStepCount,
    }),
  });
}

/** Pure post-run projection; keeping this seam separate makes observation
 * availability testable without executing or altering the exact model. */
export function measureMainWireIntegratedModelStandard70CandidateEvidenceV1(input: Readonly<{
  terminalTrace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  timingAndInletTrace?: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  timingAndInletObservationWindow?: MainWireStandard70TimingAndInletWindowV1;
  completedBeat: MainWireIntegratedModelCompletedBeatMetricsV3;
  timingAndInletObserver?: MainWireIntegratedModelStandard70TimingAndInletObserverV1;
}>): MainWireIntegratedModelStandard70BaselineMeasurementsV1 {
  const { terminalTrace, completedBeat } = input;
  const observed = input.timingAndInletObserver?.({
    terminalTrace: mainWireStandard70TimingAndInletObservationTraceV1(input), completedBeat,
  });
  if (input.timingAndInletObserver !== undefined && (observed?.left === undefined || observed.right === undefined)) {
    throw new Error("explicit timing/inlet observer must return both ventricles");
  }
  const traceMeasurements = measureMainWireIntegratedModelBaselineValidationV1(terminalTrace, observed?.left);
  const exactAorticValve = completedBeat.valveForwardPressureGradients.AoV;
  const exactLeftPressureRate = completedBeat.ventricularAbsolutePressureRateExtrema.LV;
  if (exactAorticValve.timeWeightedMeanMmHg === null || exactAorticValve.peakMmHg === null) {
    throw new Error("Standard70 aortic beat metrics are incomplete");
  }
  if (observed !== undefined) for (const [side, valve] of [["left", "AoV"], ["right", "PV"]] as const) {
    const actual = observed[side].ejectionTimeSec, exact = completedBeat.valveForwardPressureGradients[valve].forwardFlowDurationSec;
    if (!Number.isFinite(actual) || !Number.isFinite(exact)
      || Math.abs(actual - exact) > 128 * Number.EPSILON * Math.max(1, Math.abs(actual), Math.abs(exact))) {
      throw new Error("timing/inlet observer ET differs from the exact completed-beat forward duration");
    }
  }
  const baseMeasurements: MainWireIntegratedModelBaselineValidationMeasurementsV1 = Object.freeze({
    ...traceMeasurements,
    aorticValve: Object.freeze({ ejectionTimeSec: exactAorticValve.forwardFlowDurationSec,
      meanGradientMmHg: exactAorticValve.timeWeightedMeanMmHg, peakGradientMmHg: exactAorticValve.peakMmHg }),
    leftVentricle: Object.freeze({ maximumDpDtMmHgPerSec: exactLeftPressureRate.maximumMmHgPerSec,
      minimumDpDtMmHgPerSec: exactLeftPressureRate.minimumMmHgPerSec }),
    hemodynamicPressure: measureMainWireIntegratedModelExactBaselineHemodynamicPressureV1(completedBeat),
    cardiacSizeAndFunction: measureMainWireIntegratedModelExactBaselineCardiacSizeAndFunctionV1(completedBeat),
  });
  return measureMainWireIntegratedModelStandard70BaselineV1(baseMeasurements, terminalTrace, completedBeat, observed?.right);
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
