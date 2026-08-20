import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  evaluateMainWireIntegratedModelCalciumDriveV3,
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepInputV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
  measureMainWireFiveWallMechanicalPortLedgerV1,
  type MainWireFiveWallMechanicalPortAcceptedEndpointV1,
  type MainWireFiveWallMechanicalPortAcceptedIntervalV1,
  type MainWireFiveWallMechanicalPortLedgerV1,
  type MainWireFiveWallMechanicalPortMaterialBindingV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalPortLedgerEngineeringV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1,
  createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3,
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelPeriodicSteadyV3,
  type MainWireIntegratedModelPeriodicSteadyOptionsV3,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffCycleRunV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  type MainWireFiveWallLandTriSegReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
  type MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-engineering-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM =
  deepFreeze({
    scientificInterpretation:
      "periodic-five-wall-mechanical-port-passive-storage-and-dissipation-ledger-only" as const,
    sourcePeriodicity:
      "caller-declared-canonical-period1-with-fixture-and-checkpoint-consistency-gates" as const,
    canonicalSourceAuthenticationEstablished: false as const,
    sourceProvenanceVerified: false as const,
    historicalQualificationTransferred: false as const,
    periodicityEstablishedByThisAdapter: false as const,
    sourceCheckpoint: "exact-round-trip-before-continuation" as const,
    continuation:
      "one-unmeasured-bridge-cycle-then-one-measured-cycle" as const,
    acceptedStepCollection:
      "committed-success-only-event-clipped-no-resampling" as const,
    bridgeCycleIncludedInLedger: false as const,
    measurementCycleIncludedInLedger: true as const,
    materialVolumeOwner: "normal-adult-five-wall-fixed-prior-v1" as const,
    changesPeriodicSteadyStandardOwner: false as const,
    changesAcceptedModelState: false as const,
    officialQualificationEstablished: false as const,
    publicOutputEstablished: false as const,
    pressureVolumeAreaClaimed: false as const,
    myocardialOxygenConsumptionClaimed: false as const,
    atpHydrolysisOrHeatClaimed: false as const,
    physiologyValidated: false as const,
    clinicalValidationClaimed: false as const,
  });

type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<WallState>;

export type MainWireIntegratedModelMechanicalPortAcceptedSuccessObservationV1 =
  Readonly<{
    cycleIndex: number;
    acceptedStepIndexWithinCycle: number;
    cycleStartTimeSec: number;
    cycleEndTimeSec: number;
    acceptedDtSec: number;
    previousAcceptedRevision: number;
    previousAcceptedTimeSec: number;
    acceptedRevision: number;
    acceptedTimeSec: number;
    terminalTraceSample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
    successfulStep: SuccessfulStep;
  }>;

export type MainWireIntegratedModelMechanicalPortAcceptedSuccessObserverV1 = (
  observation: MainWireIntegratedModelMechanicalPortAcceptedSuccessObservationV1,
) => void;

export type MainWireIntegratedModelPeriodicMechanicalPortContinuationV1 =
  Readonly<{
    sourceCycleIndex: number;
    sourceCheckpointSha256: string;
    sourceCheckpointExactRoundTripVerified: true;
    bridgeCycle: MainWireIntegratedModelRegularSinusAllOffCycleRunV3;
    measurementCycle: MainWireIntegratedModelRegularSinusAllOffCycleRunV3;
    measurementAcceptedIntervals: readonly MainWireFiveWallMechanicalPortAcceptedIntervalV1[];
    materialBinding: MainWireFiveWallMechanicalPortMaterialBindingV1;
    ledger: MainWireFiveWallMechanicalPortLedgerV1;
    terminalCheckpoint: MainWireIntegratedModelCheckpointV3;
    terminalCheckpointExactRoundTripVerified: true;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringResultV1 =
  Readonly<{
    experimentId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID;
    source: Readonly<{
      experimentId: MainWireIntegratedModelPeriodicSteadyResultV3["experimentId"];
      executionPurpose: "canonical-evidence";
      protocolIdentityHash: string;
      modelConditionIdentityHash: string;
      sourceCycleIndex: number;
      numericalPeriod1DeclaredByInput: true;
      sourceProvenanceVerified: false;
      historicalQualificationTransferred: false;
      periodicityEstablishedByThisAdapter: false;
    }>;
    continuation: MainWireIntegratedModelPeriodicMechanicalPortContinuationV1;
    ledger: MainWireFiveWallMechanicalPortLedgerV1;
    coreLedgerClaim: typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM;
    claim: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerRunInputV1 =
  Readonly<{
    source: MainWireIntegratedModelPeriodicSteadyResultV3;
    hemodynamicResearchInputs?: MainWireIntegratedModelPeriodicSteadyOptionsV3["hemodynamicResearchInputs"];
    ventricularContractilityScale?: number;
    mechanismResearchInputs?: MainWireIntegratedModelPeriodicSteadyOptionsV3["mechanismResearchInputs"];
  }>;

/**
 * Analysis-only mirror of the frozen periodic one-cycle executor.
 *
 * The observer sees committed successful steps only. The returned cycle result
 * deliberately has the same shape and arithmetic as the canonical runner so a
 * parity test can detect future drift without revising the Standard owner.
 */
export function runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayV1(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  initial: AcceptedState,
  cycleIndex: number,
  nominalDtSec: number,
  observer?: MainWireIntegratedModelMechanicalPortAcceptedSuccessObserverV1,
): MainWireIntegratedModelRegularSinusAllOffCycleRunV3 {
  assertNominalDt(nominalDtSec);
  if (!Number.isSafeInteger(cycleIndex) || cycleIndex < 1) {
    throw new Error("mechanical-port replay cycle index must be positive");
  }
  const window = initial.coronary.coronaryAutoregulation;
  const windowPolicy =
    initial.coronary.coronaryAutoregulationBinding.windowPolicy;
  const startTimeSec = initial.acceptedTimeSec;
  const endTimeSec = startTimeSec + fixture.cycleLengthSec;
  if (
    cycleIndex !== window.windowIndex + 1 ||
    startTimeSec !== window.windowStartAcceptedTimeSec ||
    window.acceptedDurationSec !== 0 ||
    window.acceptedStepCount !== 0 ||
    !nearlyEqual(windowPolicy.durationSec, fixture.cycleLengthSec)
  ) {
    throw new Error(
      "mechanical-port replay cycle/window boundary identity differs",
    );
  }
  const expectedWindowIndex = window.windowIndex;
  let accepted = initial;
  let acceptedStepCount = 0;
  let nominalGridIndex = 1;
  let maximumGlobalTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  let oneComposedCalciumOwnerOnly = true;
  let allRawValuesFinite = true;
  let allDynamicMcsAcceptedFlowsExactlyZero = true;
  const traceSamples: MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] =
    [];
  const acceptedAtrialCaptureIds: string[] = [];
  const acceptedVentricularCaptureIds: string[] = [];
  const deliveredCalciumDepositIds: string[] = [];
  const completions: MainWireIntegratedModelPeriodicSteadyResultV3["cycles"][number]["coronaryAutoregulationWindow"][] =
    [];

  while (accepted.acceptedTimeSec < endTimeSec) {
    if (
      acceptedStepCount >=
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.maximumAcceptedStepCountPerRun
    ) {
      throw new Error("mechanical-port replay exceeded accepted-step bound");
    }
    const nominalTargetTimeSec = Math.min(
      endTimeSec,
      startTimeSec + nominalGridIndex * nominalDtSec,
    );
    const requestedStepSec = nominalTargetTimeSec - accepted.acceptedTimeSec;
    if (!(requestedStepSec > 0)) {
      nominalGridIndex += 1;
      continue;
    }
    const maximum = limitMainWireIntegratedModelCandidateTimeV3(
      accepted,
      nominalTargetTimeSec,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    if (
      !(maximum.candidateTimeSec > accepted.acceptedTimeSec) ||
      maximum.candidateTimeSec > nominalTargetTimeSec
    ) {
      throw new Error(
        "mechanical-port replay scheduler returned an invalid step",
      );
    }
    const previousAccepted = accepted;
    const acceptedDtSec = maximum.candidateTimeSec - accepted.acceptedTimeSec;
    const stepped = stepMainWireIntegratedModelV3(
      fixture.provider,
      accepted,
      replayStepInput(fixture, maximum.candidateTimeSec),
    );
    if (stepped.converged === false) {
      throw new Error(
        `mechanical-port replay step failed at ${accepted.acceptedTimeSec}s: ${stepped.message}`,
      );
    }
    accepted = stepped.acceptedState;
    acceptedStepCount += 1;
    if (Math.abs(accepted.acceptedTimeSec - nominalTargetTimeSec) <= 1e-14) {
      nominalGridIndex += 1;
    }
    if (stepped.coronaryStep.autoregulationWindowCompleted) {
      const completion = stepped.coronaryStep.autoregulationCompletion;
      if (completion === null) {
        throw new Error("mechanical-port replay completion flag lacks state");
      }
      completions.push(
        Object.freeze({
          windowIndex: completion.windowIndex,
          startTimeSec: completion.windowStartAcceptedTimeSec,
          endTimeSec: completion.windowEndAcceptedTimeSec,
          acceptedDurationSec: completion.aggregate.acceptedWindowDurationSec,
          acceptedStepCount: completion.acceptedStepCount,
        }),
      );
    }
    const expectedCalcium = evaluateMainWireIntegratedModelCalciumDriveV3(
      accepted.composedRhythm,
    );
    oneComposedCalciumOwnerOnly =
      oneComposedCalciumOwnerOnly &&
      canonicalJsonStringify(expectedCalcium) ===
        canonicalJsonStringify(stepped.calciumDrive) &&
      canonicalJsonStringify(stepped.coronaryStep.baseStep.calciumDrive) ===
        canonicalJsonStringify(stepped.calciumDrive) &&
      !("generatedRhythmCalcium" in accepted) &&
      !("rhythmCalcium" in accepted) &&
      !("fixedPeriodicCalcium" in accepted);
    assertAllOffAcceptedFlow(accepted);
    allDynamicMcsAcceptedFlowsExactlyZero =
      allDynamicMcsAcceptedFlowsExactlyZero &&
      Object.values(
        accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec,
      ).every((value) => value === 0);
    const candidate = stepped.composedRhythmCandidate;
    if (candidate.capturedAtrialActivation !== null) {
      acceptedAtrialCaptureIds.push(
        candidate.capturedAtrialActivation.capturedActivationId,
      );
    }
    if (candidate.capturedVentricularActivation !== null) {
      acceptedVentricularCaptureIds.push(
        candidate.capturedVentricularActivation.capturedActivationId,
      );
    }
    deliveredCalciumDepositIds.push(
      ...candidate.deliveredCalciumDeposits.map((deposit) => deposit.depositId),
    );
    const sample = replayTraceSample(
      cycleIndex,
      acceptedStepCount,
      startTimeSec,
      fixture.cycleLengthSec,
      acceptedDtSec,
      stepped,
    );
    traceSamples.push(sample);
    notifyAcceptedSuccess(
      observer,
      cycleIndex,
      acceptedStepCount,
      startTimeSec,
      endTimeSec,
      acceptedDtSec,
      previousAccepted,
      stepped,
      sample,
    );
    allRawValuesFinite = allRawValuesFinite && allNumericLeavesFinite(sample);
    maximumGlobalTotalBloodVolumeErrorMl = Math.max(
      maximumGlobalTotalBloodVolumeErrorMl,
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl),
    );
    maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
      maximumCoronaryBloodVolumeLedgerResidualMl,
      Math.abs(sample.diagnostics.coronaryBloodVolumeLedgerResidualMl),
    );
    maximumDynamicMcsConservationResidualMlPerSec = Math.max(
      maximumDynamicMcsConservationResidualMlPerSec,
      Math.abs(sample.diagnostics.dynamicMcsConservationResidualMlPerSec),
    );
  }

  if (
    accepted.acceptedTimeSec !== endTimeSec ||
    completions.length !== 1 ||
    completions[0]!.windowIndex !== expectedWindowIndex ||
    completions[0]!.startTimeSec !== startTimeSec ||
    completions[0]!.endTimeSec !== endTimeSec ||
    !nearlyEqual(completions[0]!.acceptedDurationSec, fixture.cycleLengthSec)
  ) {
    throw new Error("mechanical-port replay cycle/window boundary differs");
  }
  if (!oneComposedCalciumOwnerOnly || !allRawValuesFinite) {
    throw new Error("mechanical-port replay owner/finite gate failed");
  }
  if (!allDynamicMcsAcceptedFlowsExactlyZero) {
    throw new Error("mechanical-port all-off replay produced nonzero MCS flow");
  }
  if (
    acceptedAtrialCaptureIds.length !== 1 ||
    acceptedVentricularCaptureIds.length !== 1 ||
    deliveredCalciumDepositIds.length !== 2
  ) {
    throw new Error("mechanical-port regular-sinus event identity differs");
  }
  rejectDuplicateIds(acceptedAtrialCaptureIds, "atrial capture");
  rejectDuplicateIds(acceptedVentricularCaptureIds, "ventricular capture");
  rejectDuplicateIds(deliveredCalciumDepositIds, "calcium deposit");
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance;
  if (
    maximumGlobalTotalBloodVolumeErrorMl >
      tolerance.globalTotalBloodVolumeErrorMl ||
    maximumCoronaryBloodVolumeLedgerResidualMl >
      tolerance.coronaryBloodVolumeLedgerResidualMl ||
    maximumDynamicMcsConservationResidualMlPerSec >
      tolerance.dynamicMcsConservationResidualMlPerSec
  ) {
    throw new Error("mechanical-port replay exceeds conservation tolerance");
  }
  return deepFreeze({
    startTimeSec,
    endTimeSec,
    acceptedStepCount,
    terminalAcceptedState: accepted,
    traceSamples,
    coronaryAutoregulationWindow: completions[0]!,
    acceptedAtrialCaptureIds,
    acceptedVentricularCaptureIds,
    deliveredCalciumDepositIds,
    maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec,
    allRawValuesFinite,
    oneComposedCalciumOwnerOnly,
    allDynamicMcsAcceptedFlowsExactlyZero,
  });
}

/** Exact checkpoint continuation; only the second replay cycle is measured. */
export async function continueMainWireIntegratedModelPeriodicMechanicalPortLedgerV1(
  input: Readonly<{
    fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3;
    sourceCheckpoint: MainWireIntegratedModelCheckpointV3;
    sourceCycleIndex: number;
    nominalDtSec: number;
  }>,
): Promise<MainWireIntegratedModelPeriodicMechanicalPortContinuationV1> {
  if (
    !Number.isSafeInteger(input.sourceCycleIndex) ||
    input.sourceCycleIndex < 0
  ) {
    throw new Error("mechanical-port source cycle index must be nonnegative");
  }
  assertNominalDt(input.nominalDtSec);
  const context =
    createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
      input.fixture,
    );
  const restoredSource = await restoreMainWireIntegratedModelV3(
    context,
    JSON.parse(canonicalJsonStringify(input.sourceCheckpoint)),
  );
  const replayedSourceCheckpoint = await checkpointMainWireIntegratedModelV3(
    context,
    restoredSource,
  );
  if (
    canonicalJsonStringify(replayedSourceCheckpoint) !==
    canonicalJsonStringify(input.sourceCheckpoint)
  ) {
    throw new Error("mechanical-port source checkpoint round-trip differs");
  }
  if (
    restoredSource.coronary.coronaryAutoregulation.windowIndex !==
    input.sourceCycleIndex
  ) {
    throw new Error("mechanical-port source checkpoint cycle identity differs");
  }

  let bridgeTerminalEndpoint: MainWireFiveWallMechanicalPortAcceptedEndpointV1 | null =
    null;
  const bridgeCycle =
    runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayV1(
      input.fixture,
      restoredSource,
      input.sourceCycleIndex + 1,
      input.nominalDtSec,
      (observation) => {
        bridgeTerminalEndpoint = endpointFromAcceptedSuccess(
          observation,
          input.fixture.provider,
        );
      },
    );
  if (bridgeTerminalEndpoint === null) {
    throw new Error("mechanical-port bridge cycle lacks accepted readback");
  }
  const measurementAcceptedIntervals: MainWireFiveWallMechanicalPortAcceptedIntervalV1[] =
    [];
  let previousEndpoint = bridgeTerminalEndpoint;
  const measurementCycle =
    runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayV1(
      input.fixture,
      bridgeCycle.terminalAcceptedState,
      input.sourceCycleIndex + 2,
      input.nominalDtSec,
      (observation) => {
        const next = endpointFromAcceptedSuccess(
          observation,
          input.fixture.provider,
        );
        measurementAcceptedIntervals.push(
          Object.freeze({ previous: previousEndpoint, next }),
        );
        previousEndpoint = next;
      },
    );
  if (
    measurementAcceptedIntervals.length !== measurementCycle.acceptedStepCount
  ) {
    throw new Error("mechanical-port measurement accepted path is incomplete");
  }
  assertDisjointEventIds(bridgeCycle, measurementCycle);
  const materialBinding = normalAdultMaterialBinding(input.fixture);
  const ledger = measureMainWireFiveWallMechanicalPortLedgerV1({
    acceptedIntervals: measurementAcceptedIntervals,
    materialBinding,
  });
  const terminalCheckpoint = await checkpointMainWireIntegratedModelV3(
    context,
    measurementCycle.terminalAcceptedState,
  );
  const restoredTerminal = await restoreMainWireIntegratedModelV3(
    context,
    JSON.parse(canonicalJsonStringify(terminalCheckpoint)),
  );
  const replayedTerminalCheckpoint = await checkpointMainWireIntegratedModelV3(
    context,
    restoredTerminal,
  );
  if (
    canonicalJsonStringify(replayedTerminalCheckpoint) !==
    canonicalJsonStringify(terminalCheckpoint)
  ) {
    throw new Error("mechanical-port terminal checkpoint round-trip differs");
  }
  return deepFreeze({
    sourceCycleIndex: input.sourceCycleIndex,
    sourceCheckpointSha256: input.sourceCheckpoint.checkpointSha256,
    sourceCheckpointExactRoundTripVerified: true as const,
    bridgeCycle,
    measurementCycle,
    measurementAcceptedIntervals,
    materialBinding,
    ledger,
    terminalCheckpoint,
    terminalCheckpointExactRoundTripVerified: true as const,
  });
}

/**
 * Binds a caller-declared canonical P1 source to the analysis continuation.
 * Fixture/checkpoint consistency is checked, but source provenance is not
 * authenticated and no historical qualification is transferred. This is an
 * Engineering result and never promotes the source or ledger to an
 * official/public output.
 */
export async function projectMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringV1(
  input: MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerRunInputV1,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringResultV1> {
  const { source } = input;
  if (
    source.executionPurpose !== "canonical-evidence" ||
    source.classification.status !== "period1-converged" ||
    source.numericalPeriod1Established !== true ||
    source.allCyclesFiniteConservedAndEventExact !== true ||
    source.terminalCheckpointExactRoundTripVerified !== true
  ) {
    throw new Error("mechanical-port analysis requires a canonical P1 source");
  }
  const sourceCycleIndex = source.terminalCycleTrace.cycleIndex;
  if (source.cycles.at(-1)?.cycleIndex !== sourceCycleIndex) {
    throw new Error("mechanical-port source terminal cycle identity differs");
  }
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    input.hemodynamicResearchInputs,
    input.ventricularContractilityScale,
    input.mechanismResearchInputs,
  );
  const [conditionIdentityHash, protocolIdentityHash] = await Promise.all([
    sha256CanonicalJsonHex(
      createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1(
        fixture,
      ),
    ),
    sha256CanonicalJsonHex(
      createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3(fixture, {
        executionPurpose: source.executionPurpose,
        nominalDtSec: source.nominalDtSec,
        maximumCycleCount: source.requestedMaximumCycleCount,
      }),
    ),
  ]);
  if (
    conditionIdentityHash !== source.modelConditionIdentityHash ||
    protocolIdentityHash !== source.protocolIdentityHash
  ) {
    throw new Error("mechanical-port source fixture identity differs");
  }
  const continuation =
    await continueMainWireIntegratedModelPeriodicMechanicalPortLedgerV1({
      fixture,
      sourceCheckpoint: source.terminalCheckpoint,
      sourceCycleIndex,
      nominalDtSec: source.nominalDtSec,
    });
  return deepFreeze({
    experimentId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID,
    source: {
      experimentId: source.experimentId,
      executionPurpose: "canonical-evidence" as const,
      protocolIdentityHash: source.protocolIdentityHash,
      modelConditionIdentityHash: source.modelConditionIdentityHash,
      sourceCycleIndex,
      numericalPeriod1DeclaredByInput: true as const,
      sourceProvenanceVerified: false as const,
      historicalQualificationTransferred: false as const,
      periodicityEstablishedByThisAdapter: false as const,
    },
    continuation,
    ledger: continuation.ledger,
    coreLedgerClaim:
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
    claim:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
  });
}

/** Explicit convenience path; can perform a long canonical source solve. */
export async function runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringV1(
  options: MainWireIntegratedModelPeriodicSteadyOptionsV3,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringResultV1> {
  const source = await runMainWireIntegratedModelPeriodicSteadyV3(options);
  return projectMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringV1(
    {
      source,
      hemodynamicResearchInputs: options.hemodynamicResearchInputs,
      ventricularContractilityScale: options.ventricularContractilityScale,
      mechanismResearchInputs: options.mechanismResearchInputs,
    },
  );
}

export function normalAdultMainWireFiveWallMechanicalPortMaterialBindingV1(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
): MainWireFiveWallMechanicalPortMaterialBindingV1 {
  return normalAdultMaterialBinding(fixture);
}

function endpointFromAcceptedSuccess(
  observation: MainWireIntegratedModelMechanicalPortAcceptedSuccessObservationV1,
  expectedProvider: MainWireIntegratedModelRegularSinusAllOffFixtureV3["provider"],
): MainWireFiveWallMechanicalPortAcceptedEndpointV1 {
  const base = observation.successfulStep.coronaryStep.baseStep;
  const mechanics = base.mechanicsTrial;
  const readback = mechanics.diagnostics
    .readback as unknown as MainWireFiveWallLandTriSegReadbackV1 | null;
  if (
    readback === null ||
    readback.providerModelId !==
      MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID ||
    readback.solveMode !== "trial" ||
    readback.hiddenBloodVolumeMl !== 0 ||
    readback.pistonVolumeApplied !== false ||
    mechanics.candidateTimeSec !== observation.acceptedTimeSec ||
    mechanics.contractId !== expectedProvider.contractId ||
    mechanics.providerId !== expectedProvider.providerId ||
    mechanics.parameterSetId !== expectedProvider.parameterSetId ||
    mechanics.parameterIdentityHash !==
      expectedProvider.parameterIdentityHash ||
    mechanics.stateSchemaVersion !== expectedProvider.stateSchemaVersion
  ) {
    throw new Error("mechanical-port accepted readback identity differs");
  }
  const circulation = base.circulationTrial;
  return deepFreeze({
    acceptedRevision: observation.acceptedRevision,
    acceptedTimeSec: observation.acceptedTimeSec,
    nodeVolumeMl: {
      LA: circulation.candidateNodeVolumesMl.LA,
      LV: circulation.candidateNodeVolumesMl.LV,
      RA: circulation.candidateNodeVolumesMl.RA,
      RV: circulation.candidateNodeVolumesMl.RV,
    },
    chamberTransmuralPressureMmHg: {
      ...mechanics.transmuralPressuresMmHg,
    },
    commonPericardium: {
      excessPressureMmHg: base.pericardium.excessPressureMmHg,
      storedEnergyMilliJ: base.pericardium.storedEnergyJ * 1e3,
    },
    wallStressPa: wallRecord((wallId) => {
      const wall = materialReadback(readback, wallId);
      return {
        total: wall.totalKirchhoffStressPa,
        landActive: wall.landActiveKirchhoffStressPa,
        equilibriumPassive:
          wall.totalKirchhoffStressPa -
          wall.landActiveKirchhoffStressPa -
          wall.slsOverstressPa,
        parallelSls: wall.slsOverstressPa,
      };
    }),
    wallFiberLogStrain: { ...readback.effectiveFiberLogStrainByWall },
    wallEnergyLedgerDensity: wallRecord((wallId) => {
      const energy = materialReadback(readback, wallId).energyLedger;
      if (
        energy.slsPassive !== true ||
        energy.landThermodynamicStoredEnergyClaimed !== false ||
        energy.totalThermodynamicPotentialIncludingLandClaimed !== false
      ) {
        throw new Error("mechanical-port wall energy claim boundary differs");
      }
      return {
        equilibriumPassiveStoredEnergyDensityJPerM3:
          energy.equilibriumPassiveStoredEnergyDensityJPerM3,
        slsPreviousStoredEnergyDensityJPerM3:
          energy.slsPreviousStoredEnergyDensityJPerM3,
        slsNextStoredEnergyDensityJPerM3:
          energy.slsNextStoredEnergyDensityJPerM3,
        slsPhysicalDissipationIncrementDensityJPerM3:
          energy.slsPhysicalDissipationIncrementDensityJPerM3,
        slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
          energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3,
        slsDiscreteEnergyBalanceResidualJPerM3:
          energy.slsDiscreteEnergyBalanceResidualJPerM3,
      };
    }),
  });
}

function materialReadback(
  readback: MainWireFiveWallLandTriSegReadbackV1,
  wallId: "LA" | "LVFW" | "SEP" | "RVFW" | "RA",
): MainWireNormalAdultWallMaterialReadbackV1 {
  const wall = readback.wallMaterialReadbackByWall[
    wallId
  ] as unknown as MainWireNormalAdultWallMaterialReadbackV1 | null;
  if (
    wall === null ||
    wall.adapterId !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID ||
    wall.wallId !== wallId
  ) {
    throw new Error(`mechanical-port ${wallId} material readback differs`);
  }
  return wall;
}

function normalAdultMaterialBinding(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
): MainWireFiveWallMechanicalPortMaterialBindingV1 {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  const walls = prior.anatomy.triSeg.wallGeometryParameters;
  const provider = fixture.provider;
  if (!provider.parameterSetId.startsWith(`${prior.priorId}-`)) {
    throw new Error(
      "mechanical-port provider does not bind the normal-adult volume prior",
    );
  }
  return deepFreeze({
    ownerId: prior.priorId,
    parameterIdentityHash: prior.parameterIdentityHash,
    mechanicsProviderIdentity: {
      contractId: provider.contractId,
      providerId: provider.providerId,
      parameterSetId: provider.parameterSetId,
      parameterIdentityHash: provider.parameterIdentityHash,
      stateSchemaVersion: provider.stateSchemaVersion,
    },
    wallMaterialVolumeMlByWall: {
      LA: prior.anatomy.atria.LA.wallMaterialVolumeMl,
      LVFW: walls.LVFW.wallMaterialVolumeM3 * 1e6,
      SEP: walls.SEP.wallMaterialVolumeM3 * 1e6,
      RVFW: walls.RVFW.wallMaterialVolumeM3 * 1e6,
      RA: prior.anatomy.atria.RA.wallMaterialVolumeMl,
    },
  });
}

function replayStepInput(
  fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  candidateTimeSec: number,
): MainWireIntegratedModelStepInputV3 {
  return Object.freeze({
    candidateTimeSec,
    coronary: fixture.coronaryStepInput,
    rhythm: Object.freeze({
      configuration: fixture.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    }),
    dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
  });
}

function replayTraceSample(
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  cycleStartTimeSec: number,
  cycleLengthSec: number,
  acceptedDtSec: number,
  stepped: SuccessfulStep,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  const base = stepped.coronaryStep.baseStep;
  const circulation = base.circulationTrial;
  const pressures = circulation.nodeAbsolutePressuresMmHg;
  const volumes = circulation.candidateNodeVolumesMl;
  const valves = circulation.valveEvaluations;
  const hydraulics = base.coronaryTrial.diagnostics.hydraulics;
  const candidate = stepped.composedRhythmCandidate;
  return deepFreeze({
    cycleIndex,
    acceptedStepIndexWithinCycle,
    acceptedTimeSec: stepped.acceptedState.acceptedTimeSec,
    cyclePhase01:
      (stepped.acceptedState.acceptedTimeSec - cycleStartTimeSec) /
      cycleLengthSec,
    acceptedDtSec,
    chamberVolumeMl: {
      LA: volumes.LA,
      LV: volumes.LV,
      RA: volumes.RA,
      RV: volumes.RV,
    },
    absolutePressureMmHg: {
      LA: pressures.LA,
      LV: pressures.LV,
      RA: pressures.RA,
      RV: pressures.RV,
      Ao: pressures.Ao,
      PA: pressures.PA,
      PVein: pressures.PVein,
    },
    transmuralPressureMmHg: {
      LV: base.mechanicsTrial.transmuralPressuresMmHg.LV,
      RV: base.mechanicsTrial.transmuralPressuresMmHg.RV,
    },
    valveFlowMlPerSec: {
      MV: valves.MV.flowMlPerSec,
      AoV: valves.AoV.flowMlPerSec,
      TV: valves.TV.flowMlPerSec,
      PV: valves.PV.flowMlPerSec,
    },
    coronary: {
      totalInletFlowMlPerSec: hydraulics.totalInletFlowMlPerSec,
      ladSubendocardialQmFlowMlPerSec:
        hydraulics.layerQmInternalFlowMlPerSecByTerritory.LAD.subendocardial,
    },
    freeCalciumUMByWall: stepped.calciumDrive.freeCalciumUMByWall,
    dynamicMcsAcceptedFlowMlPerSec:
      stepped.acceptedState.dynamicMechanicalSupport.acceptedFlowMlPerSec,
    acceptedEventIdentity: {
      atrialCapturedActivationId:
        candidate.capturedAtrialActivation?.capturedActivationId ?? null,
      ventricularCapturedActivationId:
        candidate.capturedVentricularActivation?.capturedActivationId ?? null,
      deliveredCalciumDepositIds: candidate.deliveredCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
      scheduledCalciumDepositIds: candidate.scheduledCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
    },
    diagnostics: {
      mechanicsResidualNorm: base.mechanicsTrial.diagnostics.residualNorm,
      circulationScaledResidualInfinityNorm:
        circulation.diagnostics.finalScaledResidualInfinityNorm,
      maximumContinuityResidualMl:
        circulation.diagnostics.finalMaximumContinuityResidualMl,
      totalBloodVolumeErrorMl: circulation.diagnostics.totalBloodVolumeErrorMl,
      coronaryBloodVolumeLedgerResidualMl:
        base.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl,
      dynamicMcsConservationResidualMlPerSec:
        stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
    },
  });
}

function notifyAcceptedSuccess(
  observer:
    MainWireIntegratedModelMechanicalPortAcceptedSuccessObserverV1 | undefined,
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  cycleStartTimeSec: number,
  cycleEndTimeSec: number,
  acceptedDtSec: number,
  previousAccepted: AcceptedState,
  stepped: SuccessfulStep,
  terminalTraceSample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
): void {
  if (observer === undefined) return;
  const accepted = stepped.acceptedState;
  const base = stepped.coronaryStep.baseStep;
  const mechanics = base.mechanicsTrial;
  if (
    stepped.mechanicsCommitted !== true ||
    stepped.circulationCommitted !== true ||
    stepped.coronaryCommitted !== true ||
    stepped.mvcReferenceCommitted !== true ||
    stepped.autoregulationCommitted !== true ||
    stepped.composedRhythmCommitted !== true ||
    stepped.dynamicMechanicalSupportCommitted !== true ||
    accepted.revision !== previousAccepted.revision + 1 ||
    Math.abs(
      accepted.acceptedTimeSec -
        previousAccepted.acceptedTimeSec -
        acceptedDtSec,
    ) >
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance
        .acceptedOwnerClockSkewSec ||
    base.acceptedState.revision !== accepted.revision ||
    base.acceptedState.acceptedTimeSec !== accepted.acceptedTimeSec ||
    mechanics.baseRevision !== previousAccepted.revision ||
    mechanics.baseAcceptedTimeSec !== previousAccepted.acceptedTimeSec ||
    mechanics.candidateTimeSec !== accepted.acceptedTimeSec ||
    mechanics.stepDtSec !== acceptedDtSec ||
    terminalTraceSample.cycleIndex !== cycleIndex ||
    terminalTraceSample.acceptedStepIndexWithinCycle !==
      acceptedStepIndexWithinCycle ||
    terminalTraceSample.acceptedTimeSec !== accepted.acceptedTimeSec ||
    terminalTraceSample.acceptedDtSec !== acceptedDtSec
  ) {
    throw new Error("mechanical-port observer saw a discontinuous tuple");
  }
  observer(
    Object.freeze({
      cycleIndex,
      acceptedStepIndexWithinCycle,
      cycleStartTimeSec,
      cycleEndTimeSec,
      acceptedDtSec,
      previousAcceptedRevision: previousAccepted.revision,
      previousAcceptedTimeSec: previousAccepted.acceptedTimeSec,
      acceptedRevision: accepted.revision,
      acceptedTimeSec: accepted.acceptedTimeSec,
      terminalTraceSample,
      successfulStep: stepped,
    }),
  );
}

function wallRecord<T>(
  build: (wallId: "LA" | "LVFW" | "SEP" | "RVFW" | "RA") => T,
): Readonly<Record<"LA" | "LVFW" | "SEP" | "RVFW" | "RA", T>> {
  return Object.freeze({
    LA: build("LA"),
    LVFW: build("LVFW"),
    SEP: build("SEP"),
    RVFW: build("RVFW"),
    RA: build("RA"),
  });
}

function assertNominalDt(nominalDtSec: number): void {
  if (
    !Number.isFinite(nominalDtSec) ||
    nominalDtSec <
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.minimumNominalDtSec ||
    nominalDtSec >
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.maximumNominalDtSec
  ) {
    throw new RangeError("mechanical-port nominal dt is outside V3 policy");
  }
}

function assertAllOffAcceptedFlow(state: AcceptedState): void {
  if (
    !Object.values(state.dynamicMechanicalSupport.acceptedFlowMlPerSec).every(
      (value) => value === 0,
    )
  ) {
    throw new Error("mechanical-port accepted MCS flow must be zero");
  }
}

function rejectDuplicateIds(ids: readonly string[], label: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`mechanical-port duplicate ${label} identity`);
  }
}

function assertDisjointEventIds(
  bridge: MainWireIntegratedModelRegularSinusAllOffCycleRunV3,
  measurement: MainWireIntegratedModelRegularSinusAllOffCycleRunV3,
): void {
  for (const [label, left, right] of [
    [
      "atrial capture",
      bridge.acceptedAtrialCaptureIds,
      measurement.acceptedAtrialCaptureIds,
    ],
    [
      "ventricular capture",
      bridge.acceptedVentricularCaptureIds,
      measurement.acceptedVentricularCaptureIds,
    ],
    [
      "calcium deposit",
      bridge.deliveredCalciumDepositIds,
      measurement.deliveredCalciumDepositIds,
    ],
  ] as const) {
    const seen = new Set(left);
    if (right.some((id) => seen.has(id))) {
      throw new Error(`mechanical-port duplicate cross-cycle ${label}`);
    }
  }
}

function allNumericLeavesFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumericLeavesFinite);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(allNumericLeavesFinite);
  }
  return true;
}

function nearlyEqual(left: number, right: number): boolean {
  return (
    Math.abs(left - right) <=
    64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right))
  );
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null &&
    typeof value === "object" &&
    !ArrayBuffer.isView(value)
  ) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
