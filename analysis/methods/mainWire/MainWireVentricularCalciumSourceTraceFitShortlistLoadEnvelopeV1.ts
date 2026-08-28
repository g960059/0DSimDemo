import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1";
import {
  evaluateMainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectiveEvaluationV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";
import type {
  MainWireNormalAdultFiveWallCycleDiagnosticsV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_CANDIDATE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1,
  resolveMainWireVentricularCalciumSourceTraceFitShortlistArmV1,
  resolveMainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistArmV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistCandidateIdV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_ANALYSIS_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-shortlist-load-envelope-analysis-v1" as const;

const FLOW_DURATION_ABSOLUTE_FLOOR_ML_PER_SEC = 1;
const FLOW_DURATION_PEAK_FRACTION = 0.01;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    acceptedStepReadbackOnly: true as const,
    mitralPeakEa: "peak-forward-flow-ratio-by-existing-E-and-A-windows" as const,
    mitralVtiEa:
      "modeled-bulk-flow-over-instantaneous-physical-EOA-integral-ratio" as const,
    ivrt:
      "flow-threshold-AoV-closure-to-MV-opening-duration" as const,
    dctSurrogate:
      "observed-E-peak-to-strict-intervening-flow-valley-no-extrapolation" as const,
    clinicalDctClaimed: false as const,
    pulmonaryVenousSignal:
      "aggregate-PVein-to-LA-edge-not-separate-vein-Doppler" as const,
    pulmonaryVenousPva:
      "atrial-window-peak-reverse-flow-magnitude-not-velocity" as const,
    pulmonaryVenousPvad:
      "contiguous-reverse-flow-duration-around-peak-at-max-one-ml-per-sec-or-one-percent-threshold" as const,
    pulmonaryVenousAreaAvailable: false as const,
    valveAreaReadback:
      "algebraic-direction-selected-effective-orifice-area-not-imaged-anatomic-area" as const,
    cavityWorkSignConvertedToPumpWork:
      "negative-of-positive-work-on-wall-ledger" as const,
    formalPressureVolumeAreaComputed: false as const,
    formalPressureVolumeAreaReason:
      "requires-qualified-settled-preload-family-not-independent-cold-load-points" as const,
    loadCoordinatesAreRobustnessAxesNotCalibrationKnobs: true as const,
    gradientsExcludedFromObjectivesToAvoidDuplicateFixedEoaFlowWeighting:
      true as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireVentricularCalciumSourceTraceFitShortlistLoadInputV1 =
  Readonly<{
    armId: MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1;
    contextId:
      MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireVentricularCalciumSourceTraceFitShortlistDiastolicFlowV1 =
  Readonly<{
    mitral: Readonly<{
      peakEFlowMlPerSec: number;
      peakAFlowMlPerSec: number;
      peakEToARatio: number | null;
      eForwardVolumeMl: number;
      aForwardVolumeMl: number;
      forwardVolumeEToARatio: number | null;
      eModeledVtiCm: number | null;
      aModeledVtiCm: number | null;
      modeledVtiEToARatio: number | null;
      waveSeparationStatus: "separated" | "fused-or-unresolved";
      ePeakToInterveningValleySec: number | null;
      ePeakToInterveningValleyDefinition:
        "DCT-like-observed-interval-not-clinical-extrapolated-DCT";
      aForwardDurationSec: number | null;
      durationThresholdMlPerSec: number;
    }>;
    relaxation: Readonly<{
      ivrtLikeSec: number;
      relaxationTauSec: number | null;
      tauFitR2: number | null;
      tauStatus: MainWireNormalAdultFiveWallCycleDiagnosticsV1["ivrtLike"]["reason"];
    }>;
    pulmonaryVenous: Readonly<{
      sPeakForwardFlowMlPerSec: number;
      dPeakForwardFlowMlPerSec: number;
      sToDPeakForwardFlowRatio: number | null;
      sForwardVolumeMl: number;
      dForwardVolumeMl: number;
      sToDForwardVolumeRatio: number | null;
      atrialReversalPeakFlowMagnitudeMlPerSec: number;
      atrialReversalVolumeMl: number;
      atrialReversalDurationSec: number | null;
      atrialReversalDurationMinusMitralADurationSec: number | null;
      durationThresholdMlPerSec: number;
      signalBasis: "aggregate-flow-not-velocity";
    }>;
  }>;

export type MainWireVentricularCalciumSourceTraceFitShortlistValveAreaV1 =
  Readonly<{
    maximumForwardEoaCm2: number;
    forwardActiveEoaOverCycleRangeCm2: readonly [number, number];
    activeEoaDuringForwardFlowRangeCm2: readonly [number, number] | null;
    forwardFlowWeightedMeanActiveEoaCm2: number | null;
    activeEoaAtPeakForwardFlowCm2: number;
    openingTargetAtPeakForwardFlow01: number;
    peakForwardFlowMlPerSec: number;
  }>;

export type MainWireVentricularCalciumSourceTraceFitShortlistCycleWorkV1 =
  Readonly<{
    leftVentricularExternalStrokeWorkMilliJ: number;
    rightVentricularExternalStrokeWorkMilliJ: number;
    combinedVentricularExternalStrokeWorkMilliJ: number;
    combinedVentricularWallStressWorkOnWallMilliJ: Readonly<{
      total: number;
      active: number;
      passive: number;
      sls: number;
    }>;
    formalPressureVolumeArea: Readonly<{
      status: "not-computed";
      reason:
        "independent-cold-load-envelope-is-not-qualified-settled-preload-family";
    }>;
  }>;

export type MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1 =
  Readonly<{
    arm: MainWireVentricularCalciumSourceTraceFitShortlistArmV1;
    context:
      MainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1;
    protocolIdentityHash: string;
    periodicSteadyStateClaimed: boolean;
    integrationCompletedWithoutFailure: boolean;
    morphologyInterpretationEligible: boolean;
    readback:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    objectiveEvaluation:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectiveEvaluationV1
      | null;
    diastolicFlow:
      MainWireVentricularCalciumSourceTraceFitShortlistDiastolicFlowV1 | null;
    diastolicFlowUnavailabilityReason: string | null;
    valveArea: Readonly<{
      aortic: MainWireVentricularCalciumSourceTraceFitShortlistValveAreaV1;
      pulmonary: MainWireVentricularCalciumSourceTraceFitShortlistValveAreaV1;
    }>;
    cycleWork:
      MainWireVentricularCalciumSourceTraceFitShortlistCycleWorkV1 | null;
  }>;

export type MainWireVentricularCalciumSourceTraceFitShortlistCandidateLoadSummaryV1 =
  Readonly<{
    candidateId:
      MainWireVentricularCalciumSourceTraceFitShortlistCandidateIdV1;
    meanEqualWeightThreeObjectiveDistanceToContextCanonical: number;
    maximumEqualWeightThreeObjectiveDistanceToContextCanonical: number;
    baselineEqualWeightThreeObjectiveDistanceToCanonical: number;
    maximumDiastolicRmsRelativeDistanceToContextCanonical: number | null;
    configuredAorticForwardEoaInvariantAcrossEnvelopeAndComparator: boolean;
    configuredPulmonaryForwardEoaInvariantAcrossEnvelopeAndComparator: boolean;
    allRunsPeriod1AndIntegrated: boolean;
    allDiastolicFlowReadbacksAvailable: boolean;
    aorticGradientRelativeToContextCanonical: Readonly<{
      simplifiedDoppler: MainWireVentricularCalciumSourceTraceFitShortlistGradientEnvelopeV1;
      proximalVelocityCorrectedDoppler:
        MainWireVentricularCalciumSourceTraceFitShortlistGradientEnvelopeV1;
      geometryRecoveredStaticCounterfactual:
        MainWireVentricularCalciumSourceTraceFitShortlistGradientEnvelopeV1;
    }>;
    systemicResistanceResponse: Readonly<{
      peakAorticFlowStrictlyDecreasesWithResistance: boolean;
      aorticForwardVolumeStrictlyDecreasesWithResistance: boolean;
    }>;
    fixedTbvResponse: Readonly<{
      aorticForwardVolumeStrictlyIncreasesWithTbv: boolean;
      meanLeftAtrialPressureStrictlyIncreasesWithTbv: boolean;
    }>;
  }>;

export type MainWireVentricularCalciumSourceTraceFitShortlistGradientEnvelopeV1 =
  Readonly<{
    timeMeanRelativeDifferenceRange: readonly [number, number];
    peakRelativeDifferenceRange: readonly [number, number];
    timeMeanLowerAtEveryContext: boolean;
    peakLowerAtEveryContext: boolean;
  }>;

export type MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_ANALYSIS_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    arms:
      readonly MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1[];
    candidateSummaries:
      readonly MainWireVentricularCalciumSourceTraceFitShortlistCandidateLoadSummaryV1[];
    rankAtBaselineByEqualWeightThreeObjectiveDistance:
      readonly MainWireVentricularCalciumSourceTraceFitShortlistCandidateIdV1[];
    allProtocolIdentitiesDistinct: boolean;
    allRunsPeriod1AndIntegrated: boolean;
    allDiastolicFlowReadbacksAvailable: boolean;
    interpretationEligible: boolean;
    pressureVolumeAreaBoundary: Readonly<{
      formalPvaStatus: "not-computed";
      availableEnergeticReadback:
        "accepted-step-single-beat-transmural-stroke-work";
      nextRequirement:
        "qualified-settled-multi-point-preload-family-with-common-protocol-semantics";
    }>;
    claim:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1;
  }>;

export function measureMainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1(
  inputs:
    readonly MainWireVentricularCalciumSourceTraceFitShortlistLoadInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1 {
  const byKey = new Map<
    string,
    MainWireVentricularCalciumSourceTraceFitShortlistLoadInputV1
  >();
  for (const input of inputs) {
    const key = armKey(input.contextId, input.armId);
    if (byKey.has(key)) throw new Error(`duplicate shortlist-load arm: ${key}`);
    byKey.set(key, input);
  }
  const expectedCount =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1.length
    * MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1.length;
  if (byKey.size !== expectedCount) {
    throw new Error(`source-calcium shortlist load envelope requires ${expectedCount} arms`);
  }
  for (const contextId of
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1) {
    for (const armId of
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1) {
      if (!byKey.has(armKey(contextId, armId))) {
        throw new Error(`missing shortlist-load arm: ${armKey(contextId, armId)}`);
      }
    }
  }
  const dtSet = new Set(inputs.map(({ periodicResult }) => periodicResult.dtSec));
  if (dtSet.size !== 1) {
    throw new Error("source-calcium shortlist load envelope requires one common dt");
  }

  const sourceCalcium =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const arms: MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1[] = [];
  for (const contextId of
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1) {
    const canonicalInput = byKey.get(armKey(contextId, "canonical"))!;
    const canonicalReadback =
      measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
        canonicalInput.periodicResult,
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        `${contextId}-canonical`,
        geometry,
      );
    for (const armId of
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1) {
      const input = byKey.get(armKey(contextId, armId))!;
      const arm = resolveMainWireVentricularCalciumSourceTraceFitShortlistArmV1(
        armId,
      );
      const context =
        resolveMainWireVentricularCalciumSourceTraceFitShortlistLoadContextV1(
          contextId,
        );
      const readback = armId === "canonical"
        ? canonicalReadback
        : measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
          input.periodicResult,
          sourceCalcium,
          `${contextId}-${armId}`,
          geometry,
        );
      const summary =
        summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
          input.periodicResult,
        );
      const selectedBeat = input.periodicResult.retainedCompleteBeats.at(-1);
      if (selectedBeat === undefined || selectedBeat.samples.length === 0) {
        throw new Error(`${contextId}/${armId} has no retained complete beat`);
      }
      const diastolicFlow = measureDiastolicFlow(
        selectedBeat.samples,
        input.periodicResult.dtSec,
        summary,
      );
      arms.push(Object.freeze({
        arm,
        context,
        protocolIdentityHash: input.periodicResult.protocolIdentityHash,
        periodicSteadyStateClaimed:
          input.periodicResult.periodicSteadyStateClaimed,
        integrationCompletedWithoutFailure:
          input.periodicResult.integrationCompletedWithoutFailure,
        morphologyInterpretationEligible:
          summary.morphologyInterpretation.eligible,
        readback,
        objectiveEvaluation: armId === "canonical"
          ? null
          : evaluateMainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1(
            readback,
            canonicalReadback,
            `${contextId}-${armId}`,
          ),
        diastolicFlow: diastolicFlow.value,
        diastolicFlowUnavailabilityReason: diastolicFlow.reason,
        valveArea: Object.freeze({
          aortic: measureValveArea(
            selectedBeat.samples,
            "AoV",
            input.periodicResult.protocolIdentity.circulation
              .valveResearchInputSnapshot.valves.AoV.maximumForwardEoaCm2,
          ),
          pulmonary: measureValveArea(
            selectedBeat.samples,
            "PV",
            input.periodicResult.protocolIdentity.circulation
              .valveResearchInputSnapshot.valves.PV.maximumForwardEoaCm2,
          ),
        }),
        cycleWork: summary.cyclePhysiology === null
          ? null
          : measureCycleWork(summary.cyclePhysiology),
      }));
    }
  }
  const frozenArms = Object.freeze(arms);
  assertPairedProtocolAxes(frozenArms);
  const candidateSummaries = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_CANDIDATE_IDS_V1
      .map((candidateId) => summarizeCandidate(candidateId, frozenArms)),
  );
  const rankAtBaseline = Object.freeze([...candidateSummaries]
    .sort((left, right) =>
      left.baselineEqualWeightThreeObjectiveDistanceToCanonical
      - right.baselineEqualWeightThreeObjectiveDistanceToCanonical)
    .map(({ candidateId }) => candidateId));
  const allRunsPeriod1AndIntegrated = frozenArms.every((arm) =>
    arm.periodicSteadyStateClaimed
    && arm.integrationCompletedWithoutFailure);
  const allDiastolicFlowReadbacksAvailable = frozenArms.every((arm) =>
    arm.diastolicFlow !== null);
  const allProtocolIdentitiesDistinct = new Set(frozenArms.map((arm) =>
    arm.protocolIdentityHash)).size === expectedCount;
  return Object.freeze({
    methodId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_ANALYSIS_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    arms: frozenArms,
    candidateSummaries,
    rankAtBaselineByEqualWeightThreeObjectiveDistance: rankAtBaseline,
    allProtocolIdentitiesDistinct,
    allRunsPeriod1AndIntegrated,
    allDiastolicFlowReadbacksAvailable,
    interpretationEligible:
      allProtocolIdentitiesDistinct
      && allRunsPeriod1AndIntegrated
      && allDiastolicFlowReadbacksAvailable
      && frozenArms.every((arm) => arm.morphologyInterpretationEligible),
    pressureVolumeAreaBoundary: Object.freeze({
      formalPvaStatus: "not-computed" as const,
      availableEnergeticReadback:
        "accepted-step-single-beat-transmural-stroke-work" as const,
      nextRequirement:
        "qualified-settled-multi-point-preload-family-with-common-protocol-semantics" as const,
    }),
    claim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  });
}

function measureDiastolicFlow(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  dtSec: number,
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): Readonly<{
  value:
    MainWireVentricularCalciumSourceTraceFitShortlistDiastolicFlowV1 | null;
  reason: string | null;
}> {
  const cycle = summary.cyclePhysiology;
  if (cycle === null) {
    const availability = summary.cyclePhysiologyAvailability;
    return Object.freeze({
      value: null,
      reason: availability.status === "not-measurable"
        ? availability.reason
        : "cycle-physiology-unavailable",
    });
  }
  const pumpingIndices = cyclicHalfOpenIndices(
    samples.length,
    cycle.events.atrialCalciumOnset.sampleIndex,
    cycle.events.mitralValveClosure.sampleIndex,
  );
  const aDuration = durationAroundPeak(
    pumpingIndices,
    samples.map((sample) => Math.max(0, sample.flowMlPerSec.MV)),
    dtSec,
  );
  const pvaDuration = durationAroundPeak(
    pumpingIndices,
    samples.map((sample) => Math.max(0, -sample.flowMlPerSec.PVein_LA)),
    dtSec,
  );
  const ePeakToValleySec = cycle.mitral.waveSeparation.valley === null
    ? null
    : cyclicForwardSampleDelta(
      cycle.mitral.eFlowPeak.sampleIndex,
      cycle.mitral.waveSeparation.valley.sampleIndex,
      samples.length,
    ) * dtSec;
  const modeledVtiEToARatio = safeRatio(
    cycle.mitral.E.modeledAreaVtiCm,
    cycle.mitral.A.modeledAreaVtiCm,
  );
  return Object.freeze({
    value: Object.freeze({
      mitral: Object.freeze({
        peakEFlowMlPerSec: cycle.mitral.E.peakForwardMlPerSec,
        peakAFlowMlPerSec: cycle.mitral.A.peakForwardMlPerSec,
        peakEToARatio: cycle.mitral.peakERatioToA,
        eForwardVolumeMl: cycle.mitral.E.forwardVolumeMl,
        aForwardVolumeMl: cycle.mitral.A.forwardVolumeMl,
        forwardVolumeEToARatio: cycle.mitral.forwardVolumeERatioToA,
        eModeledVtiCm: cycle.mitral.E.modeledAreaVtiCm,
        aModeledVtiCm: cycle.mitral.A.modeledAreaVtiCm,
        modeledVtiEToARatio,
        waveSeparationStatus: cycle.mitral.waveSeparation.status,
        ePeakToInterveningValleySec: ePeakToValleySec,
        ePeakToInterveningValleyDefinition:
          "DCT-like-observed-interval-not-clinical-extrapolated-DCT" as const,
        aForwardDurationSec: aDuration.durationSec,
        durationThresholdMlPerSec: aDuration.thresholdMlPerSec,
      }),
      relaxation: Object.freeze({
        ivrtLikeSec: cycle.ivrtLike.durationSec,
        relaxationTauSec: cycle.ivrtLike.relaxationTauSec,
        tauFitR2: cycle.ivrtLike.fitR2,
        tauStatus: cycle.ivrtLike.reason,
      }),
      pulmonaryVenous: Object.freeze({
        sPeakForwardFlowMlPerSec:
          cycle.pulmonaryVenous.S.peakForwardMlPerSec,
        dPeakForwardFlowMlPerSec:
          cycle.pulmonaryVenous.D.peakForwardMlPerSec,
        sToDPeakForwardFlowRatio: safeRatio(
          cycle.pulmonaryVenous.S.peakForwardMlPerSec,
          cycle.pulmonaryVenous.D.peakForwardMlPerSec,
        ),
        sForwardVolumeMl: cycle.pulmonaryVenous.S.forwardVolumeMl,
        dForwardVolumeMl: cycle.pulmonaryVenous.D.forwardVolumeMl,
        sToDForwardVolumeRatio: safeRatio(
          cycle.pulmonaryVenous.S.forwardVolumeMl,
          cycle.pulmonaryVenous.D.forwardVolumeMl,
        ),
        atrialReversalPeakFlowMagnitudeMlPerSec:
          cycle.pulmonaryVenous.Ar.peakReverseMlPerSec,
        atrialReversalVolumeMl: cycle.pulmonaryVenous.Ar.reverseVolumeMl,
        atrialReversalDurationSec: pvaDuration.durationSec,
        atrialReversalDurationMinusMitralADurationSec:
          pvaDuration.durationSec === null || aDuration.durationSec === null
            ? null
            : pvaDuration.durationSec - aDuration.durationSec,
        durationThresholdMlPerSec: pvaDuration.thresholdMlPerSec,
        signalBasis: "aggregate-flow-not-velocity" as const,
      }),
    }),
    reason: null,
  });
}

function measureValveArea(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  valveId: "AoV" | "PV",
  maximumForwardEoaCm2: number,
): MainWireVentricularCalciumSourceTraceFitShortlistValveAreaV1 {
  const configured = samples.map((sample) =>
    sample.valveHydraulics[valveId].forwardActiveEoaCm2);
  const forward = samples
    .map((sample, sampleIndex) => Object.freeze({
      sampleIndex,
      flowMlPerSec: Math.max(0, sample.flowMlPerSec[valveId]),
      activeEoaCm2: sample.valveHydraulics[valveId].activeEoaCm2,
      openingTarget01: sample.valveHydraulics[valveId].openingTarget01,
    }))
    .filter(({ flowMlPerSec }) => flowMlPerSec > 0);
  const peakIndex = maximumIndex(samples.map((sample) =>
    Math.max(0, sample.flowMlPerSec[valveId])));
  const peakHydraulics = samples[peakIndex]!.valveHydraulics[valveId];
  const forwardFlowSum = forward.reduce((sum, point) =>
    sum + point.flowMlPerSec, 0);
  return Object.freeze({
    maximumForwardEoaCm2,
    forwardActiveEoaOverCycleRangeCm2: Object.freeze([
      Math.min(...configured),
      Math.max(...configured),
    ] as const),
    activeEoaDuringForwardFlowRangeCm2: forward.length === 0
      ? null
      : Object.freeze([
        Math.min(...forward.map(({ activeEoaCm2 }) => activeEoaCm2)),
        Math.max(...forward.map(({ activeEoaCm2 }) => activeEoaCm2)),
      ] as const),
    forwardFlowWeightedMeanActiveEoaCm2: forwardFlowSum > 0
      ? forward.reduce((sum, point) =>
        sum + point.flowMlPerSec * point.activeEoaCm2, 0) / forwardFlowSum
      : null,
    activeEoaAtPeakForwardFlowCm2: peakHydraulics.activeEoaCm2,
    openingTargetAtPeakForwardFlow01: peakHydraulics.openingTarget01,
    peakForwardFlowMlPerSec:
      Math.max(0, samples[peakIndex]!.flowMlPerSec[valveId]),
  });
}

function measureCycleWork(
  cycle: Omit<MainWireNormalAdultFiveWallCycleDiagnosticsV1, "phaseBySample">,
): MainWireVentricularCalciumSourceTraceFitShortlistCycleWorkV1 {
  const walls = ["LVFW", "SEP", "RVFW"] as const;
  const component = (key: "total" | "active" | "passive" | "sls") =>
    walls.reduce((sum, wallId) =>
      sum + cycle.workEnergy.perWall[wallId].stressWorkOnWallMilliJ[key], 0);
  const lv = -cycle.workEnergy.cavityWorkOnWallMilliJ.LV;
  const rv = -cycle.workEnergy.cavityWorkOnWallMilliJ.RV;
  return Object.freeze({
    leftVentricularExternalStrokeWorkMilliJ: lv,
    rightVentricularExternalStrokeWorkMilliJ: rv,
    combinedVentricularExternalStrokeWorkMilliJ: lv + rv,
    combinedVentricularWallStressWorkOnWallMilliJ: Object.freeze({
      total: component("total"),
      active: component("active"),
      passive: component("passive"),
      sls: component("sls"),
    }),
    formalPressureVolumeArea: Object.freeze({
      status: "not-computed" as const,
      reason:
        "independent-cold-load-envelope-is-not-qualified-settled-preload-family" as const,
    }),
  });
}

function summarizeCandidate(
  candidateId: MainWireVentricularCalciumSourceTraceFitShortlistCandidateIdV1,
  arms: readonly MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1[],
): MainWireVentricularCalciumSourceTraceFitShortlistCandidateLoadSummaryV1 {
  const candidateArms =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1
      .map((contextId) => requiredArm(arms, contextId, candidateId));
  const objectiveDistances = candidateArms.map((arm) =>
    requiredObjective(arm).objectives
      .equalWeightThreeObjectiveRmsDistanceToCanonical);
  const baseline = requiredArm(arms, "baseline", candidateId);
  const systemic = ([
    "systemic-resistance-low",
    "baseline",
    "systemic-resistance-high",
  ] as const).map((contextId) => requiredArm(arms, contextId, candidateId));
  const preload = ([
    "stressed-venous-volume-low",
    "baseline",
    "stressed-venous-volume-high",
  ] as const).map((contextId) => requiredArm(arms, contextId, candidateId));
  const diastolicDistances = candidateArms.map((candidateArm) =>
    diastolicRmsRelativeDistance(
      candidateArm.diastolicFlow,
      requiredArm(
        arms,
        candidateArm.context.contextId,
        "canonical",
      ).diastolicFlow,
    )).filter((value): value is number => value !== null);
  return Object.freeze({
    candidateId,
    meanEqualWeightThreeObjectiveDistanceToContextCanonical:
      mean(objectiveDistances),
    maximumEqualWeightThreeObjectiveDistanceToContextCanonical:
      Math.max(...objectiveDistances),
    baselineEqualWeightThreeObjectiveDistanceToCanonical:
      requiredObjective(baseline).objectives
        .equalWeightThreeObjectiveRmsDistanceToCanonical,
    maximumDiastolicRmsRelativeDistanceToContextCanonical:
      diastolicDistances.length === 0 ? null : Math.max(...diastolicDistances),
    configuredAorticForwardEoaInvariantAcrossEnvelopeAndComparator:
      configuredEoaInvariant(arms, candidateId, "aortic"),
    configuredPulmonaryForwardEoaInvariantAcrossEnvelopeAndComparator:
      configuredEoaInvariant(arms, candidateId, "pulmonary"),
    allRunsPeriod1AndIntegrated: candidateArms.every((arm) =>
      arm.periodicSteadyStateClaimed
      && arm.integrationCompletedWithoutFailure),
    allDiastolicFlowReadbacksAvailable: candidateArms.every((arm) =>
      arm.diastolicFlow !== null),
    aorticGradientRelativeToContextCanonical: Object.freeze({
      simplifiedDoppler: gradientEnvelope(
        arms,
        candidateId,
        "simplifiedDoppler",
      ),
      proximalVelocityCorrectedDoppler: gradientEnvelope(
        arms,
        candidateId,
        "proximalVelocityCorrectedDoppler",
      ),
      geometryRecoveredStaticCounterfactual: gradientEnvelope(
        arms,
        candidateId,
        "geometryRecoveredStaticCounterfactual",
      ),
    }),
    systemicResistanceResponse: Object.freeze({
      peakAorticFlowStrictlyDecreasesWithResistance: strictlyDecreasing(
        systemic.map((arm) => arm.readback.cycle.aorticMaximumFlowMlPerSec),
      ),
      aorticForwardVolumeStrictlyDecreasesWithResistance: strictlyDecreasing(
        systemic.map((arm) => arm.readback.cycle.aorticForwardVolumeMl),
      ),
    }),
    fixedTbvResponse: Object.freeze({
      aorticForwardVolumeStrictlyIncreasesWithTbv: strictlyIncreasing(
        preload.map((arm) => arm.readback.cycle.aorticForwardVolumeMl),
      ),
      meanLeftAtrialPressureStrictlyIncreasesWithTbv: strictlyIncreasing(
        preload.map((arm) => arm.readback.fillingAndPressureReadback
          .meanLeftAtrialAbsolutePressureMmHg),
      ),
    }),
  });
}

function gradientEnvelope(
  arms: readonly MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1[],
  candidateId: MainWireVentricularCalciumSourceTraceFitShortlistCandidateIdV1,
  station:
    | "simplifiedDoppler"
    | "proximalVelocityCorrectedDoppler"
    | "geometryRecoveredStaticCounterfactual",
): MainWireVentricularCalciumSourceTraceFitShortlistGradientEnvelopeV1 {
  const pairs =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1
      .map((contextId) => Object.freeze({
        canonical: requiredArm(arms, contextId, "canonical"),
        candidate: requiredArm(arms, contextId, candidateId),
      }));
  const timeMean = pairs.map(({ canonical, candidate }) =>
    candidate.readback.observationStations.timeMeanGradientMmHg[station]
    / canonical.readback.observationStations.timeMeanGradientMmHg[station] - 1);
  const peak = pairs.map(({ canonical, candidate }) =>
    candidate.readback.observationStations.peakGradientMmHg[station]
    / canonical.readback.observationStations.peakGradientMmHg[station] - 1);
  return Object.freeze({
    timeMeanRelativeDifferenceRange: Object.freeze([
      Math.min(...timeMean),
      Math.max(...timeMean),
    ] as const),
    peakRelativeDifferenceRange: Object.freeze([
      Math.min(...peak),
      Math.max(...peak),
    ] as const),
    timeMeanLowerAtEveryContext: timeMean.every((value) => value < 0),
    peakLowerAtEveryContext: peak.every((value) => value < 0),
  });
}

function assertPairedProtocolAxes(
  arms: readonly MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1[],
): void {
  for (const contextId of
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1) {
    const canonical = requiredArm(arms, contextId, "canonical");
    for (const candidateId of
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_CANDIDATE_IDS_V1) {
      const candidate = requiredArm(arms, contextId, candidateId);
      const left = canonical.readback;
      const right = candidate.readback;
      if (left.fillingAndPressureReadback.fixedTotalBloodVolumeMl
        !== right.fillingAndPressureReadback.fixedTotalBloodVolumeMl) {
        throw new Error(`${contextId}/${candidateId} fixed TBV mismatch`);
      }
    }
  }
}

function requiredArm(
  arms: readonly MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1[],
  contextId:
    MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1,
  armId: MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1,
): MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1 {
  const arm = arms.find((candidate) =>
    candidate.context.contextId === contextId && candidate.arm.armId === armId);
  if (arm === undefined) throw new Error(`missing measured arm: ${armKey(contextId, armId)}`);
  return arm;
}

function requiredObjective(
  arm: MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectiveEvaluationV1 {
  if (arm.objectiveEvaluation === null) {
    throw new Error(`${arm.context.contextId}/${arm.arm.armId} has no candidate objective`);
  }
  return arm.objectiveEvaluation;
}

function configuredEoaInvariant(
  arms: readonly MainWireVentricularCalciumSourceTraceFitShortlistLoadArmV1[],
  candidateId: MainWireVentricularCalciumSourceTraceFitShortlistCandidateIdV1,
  valve: "aortic" | "pulmonary",
): boolean {
  return MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1
    .every((contextId) => {
      const canonical = requiredArm(arms, contextId, "canonical")
        .valveArea[valve].maximumForwardEoaCm2;
      const candidate = requiredArm(arms, contextId, candidateId)
        .valveArea[valve].maximumForwardEoaCm2;
      return nearlyEqual(canonical, candidate);
    });
}

function diastolicRmsRelativeDistance(
  value:
    MainWireVentricularCalciumSourceTraceFitShortlistDiastolicFlowV1 | null,
  canonical:
    MainWireVentricularCalciumSourceTraceFitShortlistDiastolicFlowV1 | null,
): number | null {
  if (value === null || canonical === null) return null;
  const pairs: readonly (readonly [number | null, number | null])[] = [
    [value.mitral.peakEToARatio, canonical.mitral.peakEToARatio],
    [value.mitral.modeledVtiEToARatio, canonical.mitral.modeledVtiEToARatio],
    [value.relaxation.ivrtLikeSec, canonical.relaxation.ivrtLikeSec],
    [
      value.mitral.ePeakToInterveningValleySec,
      canonical.mitral.ePeakToInterveningValleySec,
    ],
    [
      value.pulmonaryVenous.atrialReversalPeakFlowMagnitudeMlPerSec,
      canonical.pulmonaryVenous.atrialReversalPeakFlowMagnitudeMlPerSec,
    ],
    [
      value.pulmonaryVenous.atrialReversalDurationSec,
      canonical.pulmonaryVenous.atrialReversalDurationSec,
    ],
  ];
  const relative = pairs.flatMap(([candidateValue, canonicalValue]) =>
    candidateValue === null || canonicalValue === null
      || !Number.isFinite(candidateValue) || !Number.isFinite(canonicalValue)
      || Math.abs(canonicalValue) <= 1e-12
      ? []
      : [candidateValue / canonicalValue - 1]);
  return relative.length === 0
    ? null
    : Math.sqrt(mean(relative.map((value) => value * value)));
}

function durationAroundPeak(
  indices: readonly number[],
  magnitudeBySample: readonly number[],
  dtSec: number,
): Readonly<{ durationSec: number | null; thresholdMlPerSec: number }> {
  if (indices.length === 0) {
    return Object.freeze({
      durationSec: null,
      thresholdMlPerSec: FLOW_DURATION_ABSOLUTE_FLOOR_ML_PER_SEC,
    });
  }
  let peakPosition = 0;
  for (let position = 1; position < indices.length; position += 1) {
    if (magnitudeBySample[indices[position]!]!
      > magnitudeBySample[indices[peakPosition]!]!) peakPosition = position;
  }
  const peak = magnitudeBySample[indices[peakPosition]!]!;
  const thresholdMlPerSec = Math.max(
    FLOW_DURATION_ABSOLUTE_FLOOR_ML_PER_SEC,
    FLOW_DURATION_PEAK_FRACTION * peak,
  );
  if (!(peak >= thresholdMlPerSec)) {
    return Object.freeze({ durationSec: null, thresholdMlPerSec });
  }
  let first = peakPosition;
  let last = peakPosition;
  while (first > 0
    && magnitudeBySample[indices[first - 1]!]! >= thresholdMlPerSec) first -= 1;
  while (last + 1 < indices.length
    && magnitudeBySample[indices[last + 1]!]! >= thresholdMlPerSec) last += 1;
  return Object.freeze({
    durationSec: (last - first + 1) * dtSec,
    thresholdMlPerSec,
  });
}

function cyclicHalfOpenIndices(
  length: number,
  start: number,
  end: number,
): readonly number[] {
  const indices: number[] = [];
  for (let index = start; index !== end; index = (index + 1) % length) {
    indices.push(index);
    if (indices.length > length) throw new Error("cyclic interval exceeded cycle");
  }
  return Object.freeze(indices);
}

function cyclicForwardSampleDelta(
  start: number,
  end: number,
  length: number,
): number {
  return (end - start + length) % length;
}

function maximumIndex(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum index requires samples");
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function safeRatio(
  numerator: number | null,
  denominator: number | null,
): number | null {
  if (numerator === null || denominator === null
    || !Number.isFinite(numerator) || !Number.isFinite(denominator)
    || Math.abs(denominator) <= 1e-12) return null;
  return numerator / denominator;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function strictlyIncreasing(values: readonly number[]): boolean {
  return values.every((value, index) =>
    index === 0 || value > values[index - 1]!);
}

function strictlyDecreasing(values: readonly number[]): boolean {
  return values.every((value, index) =>
    index === 0 || value < values[index - 1]!);
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right)
    <= 1e-12 * Math.max(1, Math.abs(left), Math.abs(right));
}

function armKey(
  contextId:
    MainWireVentricularCalciumSourceTraceFitShortlistLoadContextIdV1,
  armId: MainWireVentricularCalciumSourceTraceFitShortlistArmIdV1,
): string {
  return `${contextId}/${armId}`;
}
