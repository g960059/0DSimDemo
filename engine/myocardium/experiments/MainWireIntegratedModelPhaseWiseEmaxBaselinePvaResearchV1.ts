import type { MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import {
  MMHG_ML_TO_JOULE_V1,
  type MainWireIntegratedModelPvaLinearRelationV1,
  type MainWireIntegratedModelPvaVentricleV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import {
  integratePositivePiecewiseLinearReferenceV1,
  type MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
  type MainWireIntrinsicPassiveCenterSliceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import {
  decomposeMainWireIntegratedModelSystolicLineAreaV2,
  findMainWireIntegratedModelSupportedIntersectionV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2";
import {
  sampleMainWireIntegratedModelTransientPvCompactLoopV1,
  type MainWireIntegratedModelTransientPvCompactLoopPointV1,
  type MainWireIntegratedModelTransientPvRawBeatV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionPureV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_EMAX_BASELINE_PVA_RESEARCH_V1_ID =
  "main-wire-integrated-model-phase-wise-emax-baseline-pva-research-v1" as const;

const PHASE_SAMPLE_COUNT_V1 = 64;
const VENTRICLES_V1 = Object.freeze(["LV", "RV"] as const);
const DIRECTIONS_V1 = Object.freeze(["occlusion", "release"] as const);

export type MainWireIntegratedModelPhaseWiseEmaxDirectionV1 =
  (typeof DIRECTIONS_V1)[number];

export type MainWireIntegratedModelPhaseWiseEmaxFitV1 = Readonly<{
  ventricleId: MainWireIntegratedModelPvaVentricleV1;
  directionId: MainWireIntegratedModelPhaseWiseEmaxDirectionV1;
  phaseIndex: number;
  phase01: number;
  pointCount: number;
  beatOrdinals: readonly number[];
  relation: MainWireIntegratedModelPvaLinearRelationV1;
  rootMeanSquaredResidualMmHg: number;
  measuredVolumeSpanMl: number;
}>;

export type MainWireIntegratedModelPhaseWiseEmaxCandidateV1 = Readonly<{
  ventricleId: MainWireIntegratedModelPvaVentricleV1;
  primaryDirectionId: "occlusion";
  selectedPhaseIndex: number;
  selectedPhase01: number;
  selectedRelation: MainWireIntegratedModelPvaLinearRelationV1;
  selectedRootMeanSquaredResidualMmHg: number;
  selectedMeasuredVolumeSpanMl: number;
  baselineEndpoint: Readonly<{
    beatOrdinal: 1;
    volumeMl: number;
    observedPressureMmHg: number;
    fittedPressureMmHg: number;
    fittedMinusObservedPressureMmHg: number;
  }>;
  releaseAtSelectedPhase: Readonly<{
    slopeMmHgPerMl: number;
    volumeAxisInterceptMl: number;
    rSquared: number | null;
    releaseMinusOcclusionSlopeMmHgPerMl: number;
    releaseMinusOcclusionVolumeAxisInterceptMl: number;
  }>;
  releasePeak: Readonly<{
    phaseIndex: number;
    phase01: number;
    slopeMmHgPerMl: number;
    volumeAxisInterceptMl: number;
    rSquared: number | null;
  }>;
  peakPhaseDifferenceSamples: number;
  leaveOneBeatOut: Readonly<{
    outcomes: readonly Readonly<{
      omittedBeatOrdinal: number;
      selectedPhaseIndex: number;
      selectedPhase01: number;
      slopeMmHgPerMl: number;
      volumeAxisInterceptMl: number;
    }>[];
    minimumSelectedPhaseIndex: number;
    maximumSelectedPhaseIndex: number;
    allSelectedPhasesWithinOneSampleOfFullFit: boolean;
    minimumSlopeMmHgPerMl: number;
    maximumSlopeMmHgPerMl: number;
    minimumVolumeAxisInterceptMl: number;
    maximumVolumeAxisInterceptMl: number;
  }>;
}>;

export type MainWireIntegratedModelBaselineResearchPvaV1 = Readonly<{
  ventricleId: MainWireIntegratedModelPvaVentricleV1;
  status:
    | "domain-supported-baseline-pva"
    | "extrapolation-dependent-baseline-pva"
    | "unavailable";
  pressureBasis: "ventricular-transmural";
  externalWorkSource: "periodic-1ms-five-wall-mechanical-ledger";
  periodicExternalWorkJ: number;
  periodicExternalWorkByDt: readonly Readonly<{
    nominalDtSec: number;
    externalWorkJ: number;
  }>[];
  systolicEndpointVolumeMl: number;
  systolicEndpointObservedPressureMmHg: number;
  systolicEndpointFittedPressureMmHg: number;
  intrinsicPassiveSupportedVolumeRangeMl: readonly [number, number];
  supportedIntersectionVolumeMl: number | null;
  supportedPotentialEnergyJ: number | null;
  extrapolatedVolumeAxisInterceptMl: number;
  extrapolatedPotentialEnergyJ: number | null;
  reportedPotentialEnergyJ: number | null;
  reportedPressureVolumeAreaJ: number | null;
  potentialEnergyBasis:
    | "supported-systolic-passive-intersection"
    | "extrapolated-systolic-volume-axis-intercept"
    | null;
  observedDomainAreaStripJ: number | null;
  systolicLineAreaOutsideMeasuredRangeFraction: number;
  reasons: readonly string[];
}>;

export type MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1 =
  Readonly<{
    studyId: typeof MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_EMAX_BASELINE_PVA_RESEARCH_V1_ID;
    status: "completed";
    scope: "research-only-phase-wise-emax-and-baseline-pva";
    pressureBasis: "ventricular-transmural";
    source: Readonly<{
      transientBeatCount: 21;
      phaseSampleCount: 64;
      periodicLedgerDtSec: 0.001;
      passiveReference: "intrinsic-passive-center-slice";
    }>;
    method: Readonly<{
      phaseScan: "linear-isochronal-fit-at-each-retained-compact-loop-phase";
      primaryCandidate: "maximum-positive-occlusion-elastance";
      releaseUse: "same-phase-and-independent-peak-diagnostic";
      externalWork: "negative-periodic-trapezoidal-cavity-work-on-wall";
      potentialEnergy: "systolic-line-minus-intrinsic-passive-center-slice";
    }>;
    phaseFits: readonly MainWireIntegratedModelPhaseWiseEmaxFitV1[];
    candidates: readonly MainWireIntegratedModelPhaseWiseEmaxCandidateV1[];
    baselinePva: readonly MainWireIntegratedModelBaselineResearchPvaV1[];
    summary: Readonly<{
      phaseFitCount: number;
      candidateCount: number;
      domainSupportedBaselinePvaCount: number;
      extrapolationDependentBaselinePvaCount: number;
      unavailableBaselinePvaCount: number;
      allLeaveOneOutPeakPhasesStableWithinOneSample: boolean;
      maximumPeakPhaseDifferenceSamples: number;
    }>;
    interpretation: Readonly<{
      operationalEmaxEstablished: false;
      genericPvaEstablished: false;
      baselineResearchPvaComputed: boolean;
      transientBeatPvaComputed: false;
      syntheticStraightClosureUsedAsExternalWork: false;
      crossArtifactSourceIdentityEstablished: false;
      productionOutputEstablished: false;
      oxygenConsumptionEstablished: false;
    }>;
  }>;

type CompactLoopFamilyV1 = ReadonlyMap<
  string,
  readonly MainWireIntegratedModelTransientPvCompactLoopPointV1[]
>;

export function analyzeMainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1(
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  ledgerReport: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
  passiveComparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
): MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1 {
  const beats = ownBeatFamilyV1(rawBeats);
  const loops = compactLoopsV1(beats);
  const phaseFits = Object.freeze(
    VENTRICLES_V1.flatMap((ventricleId) =>
      DIRECTIONS_V1.flatMap((directionId) =>
        phaseScanV1(beats, loops, ventricleId, directionId),
      ),
    ),
  );
  const candidates = Object.freeze(
    VENTRICLES_V1.map((ventricleId) =>
      emaxCandidateV1(beats, loops, phaseFits, ventricleId),
    ),
  );
  const slices = availableSlicesV1(passiveComparison);
  const periodicExternalWork = periodicExternalWorkV1(ledgerReport);
  const baselinePva = Object.freeze(
    candidates.map((candidate) =>
      baselinePvaV1(
        candidate,
        slices.get(candidate.ventricleId)!,
        periodicExternalWork.get(candidate.ventricleId)!,
      ),
    ),
  );

  const result = Object.freeze({
    studyId:
      MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_EMAX_BASELINE_PVA_RESEARCH_V1_ID,
    status: "completed" as const,
    scope: "research-only-phase-wise-emax-and-baseline-pva" as const,
    pressureBasis: "ventricular-transmural" as const,
    source: Object.freeze({
      transientBeatCount: 21 as const,
      phaseSampleCount: 64 as const,
      periodicLedgerDtSec: 0.001 as const,
      passiveReference: "intrinsic-passive-center-slice" as const,
    }),
    method: Object.freeze({
      phaseScan:
        "linear-isochronal-fit-at-each-retained-compact-loop-phase" as const,
      primaryCandidate: "maximum-positive-occlusion-elastance" as const,
      releaseUse: "same-phase-and-independent-peak-diagnostic" as const,
      externalWork:
        "negative-periodic-trapezoidal-cavity-work-on-wall" as const,
      potentialEnergy:
        "systolic-line-minus-intrinsic-passive-center-slice" as const,
    }),
    phaseFits,
    candidates,
    baselinePva,
    summary: Object.freeze({
      phaseFitCount: phaseFits.length,
      candidateCount: candidates.length,
      domainSupportedBaselinePvaCount: baselinePva.filter(
        ({ status }) => status === "domain-supported-baseline-pva",
      ).length,
      extrapolationDependentBaselinePvaCount: baselinePva.filter(
        ({ status }) => status === "extrapolation-dependent-baseline-pva",
      ).length,
      unavailableBaselinePvaCount: baselinePva.filter(
        ({ status }) => status === "unavailable",
      ).length,
      allLeaveOneOutPeakPhasesStableWithinOneSample: candidates.every(
        ({ leaveOneBeatOut }) =>
          leaveOneBeatOut.allSelectedPhasesWithinOneSampleOfFullFit,
      ),
      maximumPeakPhaseDifferenceSamples: Math.max(
        ...candidates.map(
          ({ peakPhaseDifferenceSamples }) => peakPhaseDifferenceSamples,
        ),
      ),
    }),
    interpretation: Object.freeze({
      operationalEmaxEstablished: false as const,
      genericPvaEstablished: false as const,
      baselineResearchPvaComputed: baselinePva.some(
        ({ reportedPressureVolumeAreaJ }) =>
          reportedPressureVolumeAreaJ !== null,
      ),
      transientBeatPvaComputed: false as const,
      syntheticStraightClosureUsedAsExternalWork: false as const,
      crossArtifactSourceIdentityEstablished: false as const,
      productionOutputEstablished: false as const,
      oxygenConsumptionEstablished: false as const,
    }),
  });
  requireFiniteNumericLeavesV1(result, "phase-wise Emax/baseline PVA result");
  return result;
}

function ownBeatFamilyV1(
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
): readonly MainWireIntegratedModelTransientPvRawBeatV1[] {
  if (rawBeats.length !== 21)
    throw new RangeError("phase-wise Emax requires exactly 21 beats");
  return Object.freeze(
    rawBeats.map((beat, index) => {
      if (beat.beatOrdinal !== index + 1)
        throw new Error("phase-wise Emax beats must retain ordinal order");
      if (beat.samples.length < 2)
        throw new Error("phase-wise Emax beat requires accepted samples");
      if (
        beat.samples[0]!.timeSec !== beat.startTimeSec ||
        beat.samples[beat.samples.length - 1]!.timeSec !== beat.endTimeSec
      ) {
        throw new Error("phase-wise Emax beat boundaries must match samples");
      }
      return beat;
    }),
  );
}

function compactLoopsV1(
  beats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
): CompactLoopFamilyV1 {
  return new Map(
    beats.flatMap((beat) =>
      VENTRICLES_V1.map(
        (ventricleId) =>
          [
            loopKeyV1(beat.beatOrdinal, ventricleId),
            sampleMainWireIntegratedModelTransientPvCompactLoopV1(
              beat,
              ventricleId,
            ),
          ] as const,
      ),
    ),
  );
}

function phaseScanV1(
  beats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  loops: CompactLoopFamilyV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  directionId: MainWireIntegratedModelPhaseWiseEmaxDirectionV1,
): readonly MainWireIntegratedModelPhaseWiseEmaxFitV1[] {
  const family = beats.filter((beat) =>
    directionId === "occlusion"
      ? beat.beatOrdinal <= 11
      : beat.beatOrdinal >= 11,
  );
  return Object.freeze(
    Array.from({ length: PHASE_SAMPLE_COUNT_V1 }, (_, phaseIndex) =>
      fitAtPhaseV1(family, loops, ventricleId, directionId, phaseIndex),
    ),
  );
}

function fitAtPhaseV1(
  beats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  loops: CompactLoopFamilyV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  directionId: MainWireIntegratedModelPhaseWiseEmaxDirectionV1,
  phaseIndex: number,
): MainWireIntegratedModelPhaseWiseEmaxFitV1 {
  const points = beats.map((beat) => {
    const point = loops.get(loopKeyV1(beat.beatOrdinal, ventricleId))?.[
      phaseIndex
    ];
    if (point === undefined) throw new Error("phase-wise compact loop missing");
    return Object.freeze({
      beatOrdinal: beat.beatOrdinal,
      volumeMl: point.volumeMl,
      pressureMmHg: point.transmuralPressureMmHg,
    });
  });
  const relation = linearFitV1(points);
  const predicted = points.map(
    ({ volumeMl }) =>
      relation.slopeMmHgPerMl * volumeMl + relation.interceptMmHg,
  );
  const rss = points.reduce(
    (sum, point, index) => sum + (point.pressureMmHg - predicted[index]!) ** 2,
    0,
  );
  return Object.freeze({
    ventricleId,
    directionId,
    phaseIndex,
    phase01: phaseIndex / PHASE_SAMPLE_COUNT_V1,
    pointCount: points.length,
    beatOrdinals: Object.freeze(points.map(({ beatOrdinal }) => beatOrdinal)),
    relation,
    rootMeanSquaredResidualMmHg: Math.sqrt(rss / points.length),
    measuredVolumeSpanMl:
      relation.measuredVolumeRangeMl[1] - relation.measuredVolumeRangeMl[0],
  });
}

function emaxCandidateV1(
  beats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  loops: CompactLoopFamilyV1,
  phaseFits: readonly MainWireIntegratedModelPhaseWiseEmaxFitV1[],
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
): MainWireIntegratedModelPhaseWiseEmaxCandidateV1 {
  const occlusion = phaseFits.filter(
    (fit) => fit.ventricleId === ventricleId && fit.directionId === "occlusion",
  );
  const release = phaseFits.filter(
    (fit) => fit.ventricleId === ventricleId && fit.directionId === "release",
  );
  const selected = maximumPositiveSlopeFitV1(occlusion);
  const releasePeak = maximumPositiveSlopeFitV1(release);
  const releaseAtSelected = release[selected.phaseIndex];
  if (releaseAtSelected === undefined)
    throw new Error("release phase scan is incomplete");
  const baselinePoint = loops.get(loopKeyV1(1, ventricleId))?.[
    selected.phaseIndex
  ];
  if (baselinePoint === undefined)
    throw new Error("baseline compact-loop endpoint is missing");
  const fittedPressureMmHg =
    selected.relation.slopeMmHgPerMl * baselinePoint.volumeMl +
    selected.relation.interceptMmHg;
  const leaveOneBeatOut = leaveOneBeatOutV1(
    beats,
    loops,
    ventricleId,
    selected.phaseIndex,
  );

  return Object.freeze({
    ventricleId,
    primaryDirectionId: "occlusion" as const,
    selectedPhaseIndex: selected.phaseIndex,
    selectedPhase01: selected.phase01,
    selectedRelation: selected.relation,
    selectedRootMeanSquaredResidualMmHg: selected.rootMeanSquaredResidualMmHg,
    selectedMeasuredVolumeSpanMl: selected.measuredVolumeSpanMl,
    baselineEndpoint: Object.freeze({
      beatOrdinal: 1 as const,
      volumeMl: baselinePoint.volumeMl,
      observedPressureMmHg: baselinePoint.transmuralPressureMmHg,
      fittedPressureMmHg,
      fittedMinusObservedPressureMmHg:
        fittedPressureMmHg - baselinePoint.transmuralPressureMmHg,
    }),
    releaseAtSelectedPhase: Object.freeze({
      slopeMmHgPerMl: releaseAtSelected.relation.slopeMmHgPerMl,
      volumeAxisInterceptMl: releaseAtSelected.relation.volumeAxisInterceptMl,
      rSquared: releaseAtSelected.relation.rSquared,
      releaseMinusOcclusionSlopeMmHgPerMl:
        releaseAtSelected.relation.slopeMmHgPerMl -
        selected.relation.slopeMmHgPerMl,
      releaseMinusOcclusionVolumeAxisInterceptMl:
        releaseAtSelected.relation.volumeAxisInterceptMl -
        selected.relation.volumeAxisInterceptMl,
    }),
    releasePeak: Object.freeze({
      phaseIndex: releasePeak.phaseIndex,
      phase01: releasePeak.phase01,
      slopeMmHgPerMl: releasePeak.relation.slopeMmHgPerMl,
      volumeAxisInterceptMl: releasePeak.relation.volumeAxisInterceptMl,
      rSquared: releasePeak.relation.rSquared,
    }),
    peakPhaseDifferenceSamples: circularPhaseDistanceV1(
      selected.phaseIndex,
      releasePeak.phaseIndex,
    ),
    leaveOneBeatOut,
  });
}

function leaveOneBeatOutV1(
  beats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  loops: CompactLoopFamilyV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  selectedPhaseIndex: number,
): MainWireIntegratedModelPhaseWiseEmaxCandidateV1["leaveOneBeatOut"] {
  const occlusion = beats.filter(({ beatOrdinal }) => beatOrdinal <= 11);
  const outcomes = Object.freeze(
    occlusion.map(({ beatOrdinal: omittedBeatOrdinal }) => {
      const retained = occlusion.filter(
        ({ beatOrdinal }) => beatOrdinal !== omittedBeatOrdinal,
      );
      const scan = Array.from({ length: PHASE_SAMPLE_COUNT_V1 }, (_, index) =>
        fitAtPhaseV1(retained, loops, ventricleId, "occlusion", index),
      );
      const selected = maximumPositiveSlopeFitV1(scan);
      return Object.freeze({
        omittedBeatOrdinal,
        selectedPhaseIndex: selected.phaseIndex,
        selectedPhase01: selected.phase01,
        slopeMmHgPerMl: selected.relation.slopeMmHgPerMl,
        volumeAxisInterceptMl: selected.relation.volumeAxisInterceptMl,
      });
    }),
  );
  const phaseIndices = outcomes.map(({ selectedPhaseIndex: value }) => value);
  const slopes = outcomes.map(({ slopeMmHgPerMl }) => slopeMmHgPerMl);
  const intercepts = outcomes.map(
    ({ volumeAxisInterceptMl }) => volumeAxisInterceptMl,
  );
  return Object.freeze({
    outcomes,
    minimumSelectedPhaseIndex: Math.min(...phaseIndices),
    maximumSelectedPhaseIndex: Math.max(...phaseIndices),
    allSelectedPhasesWithinOneSampleOfFullFit: phaseIndices.every(
      (phaseIndex) =>
        circularPhaseDistanceV1(phaseIndex, selectedPhaseIndex) <= 1,
    ),
    minimumSlopeMmHgPerMl: Math.min(...slopes),
    maximumSlopeMmHgPerMl: Math.max(...slopes),
    minimumVolumeAxisInterceptMl: Math.min(...intercepts),
    maximumVolumeAxisInterceptMl: Math.max(...intercepts),
  });
}

function maximumPositiveSlopeFitV1(
  fits: readonly MainWireIntegratedModelPhaseWiseEmaxFitV1[],
): MainWireIntegratedModelPhaseWiseEmaxFitV1 {
  const positive = fits.filter(({ relation }) => relation.slopeMmHgPerMl > 0);
  if (positive.length === 0)
    throw new Error("phase scan has no positive-slope fit");
  let selected = positive[0]!;
  for (const fit of positive.slice(1)) {
    if (fit.relation.slopeMmHgPerMl > selected.relation.slopeMmHgPerMl) {
      selected = fit;
    }
  }
  return selected;
}

function availableSlicesV1(
  comparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
): ReadonlyMap<
  MainWireIntegratedModelPvaVentricleV1,
  MainWireIntrinsicPassiveCenterSliceV1
> {
  if (
    comparison.studyId !==
      "main-wire-integrated-model-pva-diastolic-reference-comparison-v1" ||
    comparison.status !== "completed" ||
    comparison.scope !==
      "research-only-diastolic-reference-method-comparison" ||
    comparison.pressureBasis !== "ventricular-transmural"
  ) {
    throw new Error(
      "baseline PVA requires the completed intrinsic reference study",
    );
  }
  const entries = comparison.intrinsicSlices.flatMap((slice) =>
    slice.status === "available" ? ([[slice.ventricleId, slice]] as const) : [],
  );
  if (entries.length !== 2)
    throw new Error("baseline PVA requires both intrinsic passive slices");
  return new Map(entries);
}

function periodicExternalWorkV1(
  report: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
): ReadonlyMap<
  MainWireIntegratedModelPvaVentricleV1,
  readonly Readonly<{ nominalDtSec: number; externalWorkJ: number }>[]
> {
  if (
    report.payload.sourceOutcome.status !== "source-p1-established" ||
    !report.payload.assessment.sourceP1Established ||
    !report.payload.assessment.allThreeArmsFulfilled ||
    !report.payload.assessment
      .threeGridMechanicalPortLedgerCharacterizationCompleted
  ) {
    throw new Error(
      "baseline PVA requires the completed periodic ledger study",
    );
  }
  const fulfilled = report.payload.armOutcomes.filter(
    (outcome) => outcome.status === "fulfilled",
  );
  if (fulfilled.length !== 3)
    throw new Error("baseline PVA requires all three periodic ledger arms");
  const retainedDt = [...fulfilled]
    .map(({ nominalDtSec }) => nominalDtSec)
    .sort((left, right) => right - left);
  if (
    retainedDt.length !== 3 ||
    retainedDt[0] !== 0.001 ||
    retainedDt[1] !== 0.0005 ||
    retainedDt[2] !== 0.00025
  ) {
    throw new Error(
      "baseline PVA requires the declared 1/0.5/0.25 ms ledger arms",
    );
  }
  return new Map(
    VENTRICLES_V1.map((ventricleId) => [
      ventricleId,
      Object.freeze(
        fulfilled
          .map((outcome) =>
            Object.freeze({
              nominalDtSec: outcome.nominalDtSec,
              externalWorkJ:
                -outcome.ledger.cavityWork.trapezoidalWorkOnWallMilliJ[
                  ventricleId
                ] / 1000,
            }),
          )
          .sort((left, right) => right.nominalDtSec - left.nominalDtSec),
      ),
    ]),
  );
}

function baselinePvaV1(
  candidate: MainWireIntegratedModelPhaseWiseEmaxCandidateV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  externalWorkByDt: readonly Readonly<{
    nominalDtSec: number;
    externalWorkJ: number;
  }>[],
): MainWireIntegratedModelBaselineResearchPvaV1 {
  const relation = candidate.selectedRelation;
  const endpointVolumeMl = candidate.baselineEndpoint.volumeMl;
  const periodicExternalWorkJ = externalWorkByDt.find(
    ({ nominalDtSec }) => nominalDtSec === 0.001,
  )?.externalWorkJ;
  if (periodicExternalWorkJ === undefined)
    throw new Error("1 ms periodic external work is missing");

  const supportedVolumeRangeMl = Object.freeze([
    slice.modelMinimumVolumeMl,
    slice.maximumSampledVolumeMl,
  ] as const);
  const commonRange = intersectRangesV1(
    relation.measuredVolumeRangeMl,
    supportedVolumeRangeMl,
  );
  const supportedIntersectionVolumeMl =
    commonRange === null
      ? null
      : findMainWireIntegratedModelSupportedIntersectionV2(
          relation,
          commonRange,
          endpointVolumeMl,
          (volumeMl) => intrinsicPressureV1(slice, volumeMl),
        );
  const systolicUpperBoundaryMaintained =
    supportedIntersectionVolumeMl !== null &&
    systolicLineDominatesIntrinsicReferenceV1(
      relation,
      slice,
      supportedIntersectionVolumeMl,
      endpointVolumeMl,
    );
  const endpointInsideMeasuredRelation = insideRangeV1(
    endpointVolumeMl,
    relation.measuredVolumeRangeMl,
  );
  const endpointInsidePassive = insideRangeV1(
    endpointVolumeMl,
    supportedVolumeRangeMl,
  );
  const supportedPotentialEnergyJ =
    supportedIntersectionVolumeMl !== null &&
    systolicUpperBoundaryMaintained &&
    endpointInsideMeasuredRelation &&
    endpointInsidePassive
      ? potentialEnergyBetweenV1(
          relation,
          slice,
          supportedIntersectionVolumeMl,
          endpointVolumeMl,
        ) * MMHG_ML_TO_JOULE_V1
      : null;
  const extrapolatedPotentialEnergyJ = extrapolatedPotentialEnergyV1(
    relation,
    slice,
    endpointVolumeMl,
  );
  const area = decomposeMainWireIntegratedModelSystolicLineAreaV2(
    relation,
    relation.measuredVolumeRangeMl,
    relation.volumeAxisInterceptMl,
    endpointVolumeMl,
  );
  const observedDomainAreaStripJ = observedDomainAreaStripV1(
    relation,
    slice,
    commonRange,
    endpointVolumeMl,
  );
  const status =
    supportedPotentialEnergyJ !== null
      ? ("domain-supported-baseline-pva" as const)
      : extrapolatedPotentialEnergyJ !== null
        ? ("extrapolation-dependent-baseline-pva" as const)
        : ("unavailable" as const);
  const reportedPotentialEnergyJ =
    supportedPotentialEnergyJ ?? extrapolatedPotentialEnergyJ;
  const reasons: string[] = [];
  if (!endpointInsideMeasuredRelation)
    reasons.push("baseline endpoint lies outside fitted relation volume range");
  if (!endpointInsidePassive)
    reasons.push("baseline endpoint lies outside intrinsic passive domain");
  if (supportedIntersectionVolumeMl === null)
    reasons.push(
      "no systolic-passive intersection exists inside the common supported domain",
    );
  else if (!systolicUpperBoundaryMaintained)
    reasons.push(
      "systolic line does not remain above the passive reference after intersection",
    );
  if (area.outsideMeasuredAreaFraction > 0)
    reasons.push("potential energy includes systolic-line extrapolation");

  return Object.freeze({
    ventricleId: candidate.ventricleId,
    status,
    pressureBasis: "ventricular-transmural" as const,
    externalWorkSource: "periodic-1ms-five-wall-mechanical-ledger" as const,
    periodicExternalWorkJ,
    periodicExternalWorkByDt: Object.freeze([...externalWorkByDt]),
    systolicEndpointVolumeMl: endpointVolumeMl,
    systolicEndpointObservedPressureMmHg:
      candidate.baselineEndpoint.observedPressureMmHg,
    systolicEndpointFittedPressureMmHg:
      candidate.baselineEndpoint.fittedPressureMmHg,
    intrinsicPassiveSupportedVolumeRangeMl: supportedVolumeRangeMl,
    supportedIntersectionVolumeMl,
    supportedPotentialEnergyJ,
    extrapolatedVolumeAxisInterceptMl: relation.volumeAxisInterceptMl,
    extrapolatedPotentialEnergyJ,
    reportedPotentialEnergyJ,
    reportedPressureVolumeAreaJ:
      reportedPotentialEnergyJ === null
        ? null
        : periodicExternalWorkJ + reportedPotentialEnergyJ,
    potentialEnergyBasis:
      supportedPotentialEnergyJ !== null
        ? ("supported-systolic-passive-intersection" as const)
        : extrapolatedPotentialEnergyJ !== null
          ? ("extrapolated-systolic-volume-axis-intercept" as const)
          : null,
    observedDomainAreaStripJ,
    systolicLineAreaOutsideMeasuredRangeFraction:
      area.outsideMeasuredAreaFraction,
    reasons: Object.freeze(reasons),
  });
}

/**
 * Both operands are linear between retained passive knots. Checking the
 * intersection, endpoint, and every intervening knot therefore excludes a
 * second crossing without relying on a dense numerical scan.
 */
function systolicLineDominatesIntrinsicReferenceV1(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
): boolean {
  if (!(upperVolumeMl >= lowerVolumeMl)) return false;
  const volumes = [
    lowerVolumeMl,
    ...slice.points.flatMap(({ volumeMl }) =>
      volumeMl > lowerVolumeMl && volumeMl < upperVolumeMl ? [volumeMl] : [],
    ),
    upperVolumeMl,
  ];
  return volumes.every((volumeMl) => {
    const passivePressure = intrinsicPressureV1(slice, volumeMl);
    const difference =
      relation.slopeMmHgPerMl * volumeMl +
      relation.interceptMmHg -
      (passivePressure ?? Number.NaN);
    return Number.isFinite(difference) && difference >= -1e-9;
  });
}

function linearFitV1(
  points: readonly Readonly<{
    volumeMl: number;
    pressureMmHg: number;
  }>[],
): MainWireIntegratedModelPvaLinearRelationV1 {
  if (points.length < 3)
    throw new RangeError("isochronal fit requires at least three points");
  const meanVolume = meanV1(points.map(({ volumeMl }) => volumeMl));
  const meanPressure = meanV1(points.map(({ pressureMmHg }) => pressureMmHg));
  let volumeVariance = 0;
  let covariance = 0;
  let pressureVariance = 0;
  for (const point of points) {
    const volumeDelta = point.volumeMl - meanVolume;
    const pressureDelta = point.pressureMmHg - meanPressure;
    volumeVariance += volumeDelta * volumeDelta;
    covariance += volumeDelta * pressureDelta;
    pressureVariance += pressureDelta * pressureDelta;
  }
  if (!(volumeVariance > 0))
    throw new Error("isochronal fit volumes are degenerate");
  const slopeMmHgPerMl = covariance / volumeVariance;
  const interceptMmHg = meanPressure - slopeMmHgPerMl * meanVolume;
  const volumeAxisInterceptMl = -interceptMmHg / slopeMmHgPerMl;
  const residualSumOfSquaresMmHgSquared = points.reduce(
    (sum, point) =>
      sum +
      (point.pressureMmHg -
        (slopeMmHgPerMl * point.volumeMl + interceptMmHg)) **
        2,
    0,
  );
  for (const value of [
    slopeMmHgPerMl,
    interceptMmHg,
    volumeAxisInterceptMl,
    residualSumOfSquaresMmHgSquared,
  ]) {
    requireFiniteV1(value, "isochronal fit");
  }
  const volumes = points.map(({ volumeMl }) => volumeMl);
  return Object.freeze({
    slopeMmHgPerMl,
    interceptMmHg,
    volumeAxisInterceptMl,
    measuredVolumeRangeMl: Object.freeze([
      Math.min(...volumes),
      Math.max(...volumes),
    ] as const),
    residualSumOfSquaresMmHgSquared,
    rSquared:
      pressureVariance === 0
        ? null
        : 1 - residualSumOfSquaresMmHgSquared / pressureVariance,
  });
}

function extrapolatedPotentialEnergyV1(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  endpointVolumeMl: number,
): number | null {
  if (
    !(relation.slopeMmHgPerMl > 0) ||
    !(endpointVolumeMl > relation.volumeAxisInterceptMl) ||
    !insideRangeV1(endpointVolumeMl, [
      slice.modelMinimumVolumeMl,
      slice.maximumSampledVolumeMl,
    ])
  ) {
    return null;
  }
  const systolicIntegralMmHgMl =
    0.5 *
    relation.slopeMmHgPerMl *
    (endpointVolumeMl - relation.volumeAxisInterceptMl) ** 2;
  const passiveIntegralMmHgMl = integratePositivePiecewiseLinearReferenceV1(
    slice,
    endpointVolumeMl,
  );
  const value =
    (systolicIntegralMmHgMl - passiveIntegralMmHgMl) * MMHG_ML_TO_JOULE_V1;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function potentialEnergyBetweenV1(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
): number {
  const systolic = lineIntegralV1(relation, lowerVolumeMl, upperVolumeMl);
  const passive =
    integratePositivePiecewiseLinearReferenceV1(slice, upperVolumeMl) -
    integratePositivePiecewiseLinearReferenceV1(slice, lowerVolumeMl);
  const value = systolic - passive;
  if (!Number.isFinite(value) || value < -1e-10)
    throw new Error("supported potential energy is invalid");
  return Math.max(0, value);
}

function observedDomainAreaStripV1(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  commonRange: readonly [number, number] | null,
  endpointVolumeMl: number,
): number | null {
  if (commonRange === null) return null;
  const upper = Math.min(commonRange[1], endpointVolumeMl);
  if (!(upper > commonRange[0])) return null;
  return (
    (lineIntegralV1(relation, commonRange[0], upper) -
      (integratePositivePiecewiseLinearReferenceV1(slice, upper) -
        integratePositivePiecewiseLinearReferenceV1(slice, commonRange[0]))) *
    MMHG_ML_TO_JOULE_V1
  );
}

function intrinsicPressureV1(
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  volumeMl: number,
): number | null {
  if (
    volumeMl < slice.modelMinimumVolumeMl ||
    volumeMl > slice.maximumSampledVolumeMl
  ) {
    return null;
  }
  if (volumeMl <= slice.zeroPressureVolumeMl) return 0;
  const points = slice.points;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    if (volumeMl <= right.volumeMl) {
      const fraction =
        (volumeMl - left.volumeMl) / (right.volumeMl - left.volumeMl);
      return Math.max(
        0,
        left.intrinsicPressureMmHg +
          fraction * (right.intrinsicPressureMmHg - left.intrinsicPressureMmHg),
      );
    }
  }
  return null;
}

function lineIntegralV1(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
): number {
  return (
    0.5 * relation.slopeMmHgPerMl * (upperVolumeMl ** 2 - lowerVolumeMl ** 2) +
    relation.interceptMmHg * (upperVolumeMl - lowerVolumeMl)
  );
}

function intersectRangesV1(
  left: readonly [number, number],
  right: readonly [number, number],
): readonly [number, number] | null {
  const lower = Math.max(left[0], right[0]);
  const upper = Math.min(left[1], right[1]);
  return upper > lower ? Object.freeze([lower, upper] as const) : null;
}

function insideRangeV1(
  value: number,
  range: readonly [number, number],
): boolean {
  return value >= range[0] && value <= range[1];
}

function circularPhaseDistanceV1(left: number, right: number): number {
  const direct = Math.abs(left - right);
  return Math.min(direct, PHASE_SAMPLE_COUNT_V1 - direct);
}

function loopKeyV1(
  beatOrdinal: number,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
): string {
  return `${beatOrdinal}:${ventricleId}`;
}

function meanV1(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function requireFiniteV1(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function requireFiniteNumericLeavesV1(value: unknown, name: string): void {
  if (typeof value === "number") {
    requireFiniteV1(value, name);
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const child of Object.values(value)) {
    requireFiniteNumericLeavesV1(child, name);
  }
}
