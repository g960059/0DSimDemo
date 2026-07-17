import {
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  sanitizeForStableHash,
  stableCanonicalStringify,
} from "@/engine/myocardium/kinematics/stableHash";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_BLOOD_VOLUME_COMPARISON_V1_ID =
  "main-wire-normal-adult-five-wall-blood-volume-comparison-v1" as const;

type MetricPair = Readonly<{
  control: number;
  challenger: number;
  absoluteDifference: number;
  relativeDifference: number | null;
}>;

export type MainWireNormalAdultFiveWallBloodVolumeComparisonV1 = Readonly<{
  comparisonId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_BLOOD_VOLUME_COMPARISON_V1_ID;
  interpretable: boolean;
  interpretabilityReasons: readonly string[];
  pairing: Readonly<{
    controlVariant: string;
    challengerVariant: string;
    controlProtocolIdentityHash: string;
    challengerProtocolIdentityHash: string;
    bloodVolumeHashChanged: boolean;
    nonBloodVolumeComponentHashesExactMatch: boolean;
    nonBloodVolumeProtocolIdentityExactMatch: boolean;
    dtSec: number;
    initialization: string;
    laSlsMode: string;
    calciumDrivePriorVariant: string;
  }>;
  metrics: null | Readonly<{
    totalBloodVolumeMl: MetricPair;
    cardiacOutputLPerMin: MetricPair;
    cardiacIndexLPerMinPerM2: MetricPair;
    meanAorticPressureMmHg: MetricPair;
    leftVentricularEjectionFraction01: MetricPair;
    rightVentricularEjectionFraction01: MetricPair;
    leftAtrialMinimumVolumeMl: MetricPair;
    leftAtrialMaximumVolumeMl: MetricPair;
    leftAtrialExcursionMl: MetricPair;
    leftAtrialMinimumPressureMmHg: MetricPair;
    leftAtrialMaximumPressureMmHg: MetricPair;
    leftVentricularMinimumVolumeMl: MetricPair;
    leftVentricularMaximumVolumeMl: MetricPair;
    mitralPeakERatioToA: MetricPair | null;
    pulmonaryVenousSOverDForwardVolume: MetricPair | null;
    aLobeAreaMmHgMl: MetricPair | null;
    vLobeAreaMmHgMl: MetricPair | null;
    reservoirMinusConduitMeanMmHg: MetricPair | null;
  }>;
  topology: null | Readonly<{
    controlSelfIntersectionCount: number | null;
    challengerSelfIntersectionCount: number | null;
    controlOpposedLobeOrientation: boolean | null;
    challengerOpposedLobeOrientation: boolean | null;
    controlReservoirAboveConduitFraction01: number | null;
    challengerReservoirAboveConduitFraction01: number | null;
  }>;
  claim: Readonly<{
    comparison: "fixed-prior-paired-periodic-summary-readback";
    intervention: "initial-total-blood-volume-only";
    allowedProtocolDifference: "blood-volume-prior-only";
    vascularOrMaterialParameterChanged: false;
    venousToneOrUnstressedVolumeChanged: false;
    parameterSearchOrPvShapeFitting: false;
    automaticPhysiologyAcceptanceGate: false;
    morphologyInterpretationRequiresBothPeriod1: true;
    timeStepRobustnessAssessed: false;
    physiologicalNormalityClaimedForChallenger: false;
  }>;
}>;

export function compareMainWireNormalAdultFiveWallBloodVolumeV1(
  control: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): MainWireNormalAdultFiveWallBloodVolumeComparisonV1 {
  const reasons: string[] = [];
  validateProtocol(control, "control", reasons);
  validateProtocol(challenger, "challenger", reasons);
  const controlVariant = control.source.bloodVolumePriorVariant;
  const challengerVariant = challenger.source.bloodVolumePriorVariant;
  if (controlVariant !== "cold-seed-control") {
    reasons.push("control blood-volume prior is not the fixed cold-seed control");
  }
  if (
    challengerVariant
      !== "official-target-minus-excluded-coronary-cold-seed"
  ) {
    reasons.push("challenger blood-volume prior is not the fixed registry challenger");
  }
  for (const [label, summary] of [
    ["control", control],
    ["challenger", challenger],
  ] as const) {
    if (!summary.source.integrationCompletedWithoutFailure) {
      reasons.push(`${label} integration did not complete without failure`);
    }
    if (!summary.convergence.periodicSteadyStateClaimed) {
      reasons.push(`${label} did not establish formal period-1 closure`);
    }
    if (!summary.morphologyInterpretation.eligible) {
      reasons.push(`${label} morphology is not eligible for interpretation`);
    }
  }
  if (control.source.dtSec !== challenger.source.dtSec) {
    reasons.push("time steps differ");
  }
  if (control.source.initialization !== challenger.source.initialization) {
    reasons.push("initialization variants differ");
  }
  if (control.source.laSlsMode !== challenger.source.laSlsMode) {
    reasons.push("LA SLS modes differ");
  }
  if (
    control.source.calciumDrivePriorVariant
      !== challenger.source.calciumDrivePriorVariant
  ) reasons.push("calcium drive variants differ");
  const nonBloodVolumeComponentHashesExactMatch =
    sameNonBloodVolumeComponentHashes(control, challenger);
  if (!nonBloodVolumeComponentHashesExactMatch) {
    reasons.push("a non-blood-volume protocol component hash differs");
  }
  const nonBloodVolumeProtocolIdentityExactMatch =
    sameNonBloodVolumeProtocolIdentity(control, challenger);
  if (!nonBloodVolumeProtocolIdentityExactMatch) {
    reasons.push("non-blood-volume protocol identity differs");
  }
  const bloodVolumeHashChanged =
    control.protocol.componentHashes.bloodVolumePriorStableHash
      !== challenger.protocol.componentHashes.bloodVolumePriorStableHash;
  if (!bloodVolumeHashChanged) reasons.push("blood-volume prior hash did not change");
  const interpretable = reasons.length === 0;

  return Object.freeze({
    comparisonId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_BLOOD_VOLUME_COMPARISON_V1_ID,
    interpretable,
    interpretabilityReasons: Object.freeze(reasons),
    pairing: Object.freeze({
      controlVariant,
      challengerVariant,
      controlProtocolIdentityHash: control.protocol.identityHash,
      challengerProtocolIdentityHash: challenger.protocol.identityHash,
      bloodVolumeHashChanged,
      nonBloodVolumeComponentHashesExactMatch,
      nonBloodVolumeProtocolIdentityExactMatch,
      dtSec: control.source.dtSec,
      initialization: control.source.initialization,
      laSlsMode: control.source.laSlsMode,
      calciumDrivePriorVariant: control.source.calciumDrivePriorVariant,
    }),
    metrics: interpretable ? metrics(control, challenger) : null,
    topology: interpretable ? topology(control, challenger) : null,
    claim: Object.freeze({
      comparison: "fixed-prior-paired-periodic-summary-readback" as const,
      intervention: "initial-total-blood-volume-only" as const,
      allowedProtocolDifference: "blood-volume-prior-only" as const,
      vascularOrMaterialParameterChanged: false as const,
      venousToneOrUnstressedVolumeChanged: false as const,
      parameterSearchOrPvShapeFitting: false as const,
      automaticPhysiologyAcceptanceGate: false as const,
      morphologyInterpretationRequiresBothPeriod1: true as const,
      timeStepRobustnessAssessed: false as const,
      physiologicalNormalityClaimedForChallenger: false as const,
    }),
  });
}

function metrics(
  control: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): NonNullable<MainWireNormalAdultFiveWallBloodVolumeComparisonV1["metrics"]> {
  const controlLobes = measurableLobes(control);
  const challengerLobes = measurableLobes(challenger);
  const controlOrder = measurableBranchOrder(control);
  const challengerOrder = measurableBranchOrder(challenger);
  return Object.freeze({
    totalBloodVolumeMl: pair(
      control.source.bloodVolumePriorAudit.resolvedTotalBloodVolumeMl,
      challenger.source.bloodVolumePriorAudit.resolvedTotalBloodVolumeMl,
    ),
    cardiacOutputLPerMin: pair(
      control.hemodynamics.netAorticCardiacOutputLPerMin,
      challenger.hemodynamics.netAorticCardiacOutputLPerMin,
    ),
    cardiacIndexLPerMinPerM2: pair(
      control.hemodynamics.cardiacIndexLPerMinPerM2,
      challenger.hemodynamics.cardiacIndexLPerMinPerM2,
    ),
    meanAorticPressureMmHg: pair(
      control.hemodynamics.meanAorticAbsolutePressureMmHg,
      challenger.hemodynamics.meanAorticAbsolutePressureMmHg,
    ),
    leftVentricularEjectionFraction01: pair(
      control.hemodynamics.leftVentricularEjectionFraction01,
      challenger.hemodynamics.leftVentricularEjectionFraction01,
    ),
    rightVentricularEjectionFraction01: pair(
      control.hemodynamics.rightVentricularEjectionFraction01,
      challenger.hemodynamics.rightVentricularEjectionFraction01,
    ),
    leftAtrialMinimumVolumeMl: pair(
      control.ranges.chamberVolumeMl.LA.minimum,
      challenger.ranges.chamberVolumeMl.LA.minimum,
    ),
    leftAtrialMaximumVolumeMl: pair(
      control.ranges.chamberVolumeMl.LA.maximum,
      challenger.ranges.chamberVolumeMl.LA.maximum,
    ),
    leftAtrialExcursionMl: pair(
      rangeWidth(control.ranges.chamberVolumeMl.LA),
      rangeWidth(challenger.ranges.chamberVolumeMl.LA),
    ),
    leftAtrialMinimumPressureMmHg: pair(
      control.ranges.chamberTransmuralPressureMmHg.LA.minimum,
      challenger.ranges.chamberTransmuralPressureMmHg.LA.minimum,
    ),
    leftAtrialMaximumPressureMmHg: pair(
      control.ranges.chamberTransmuralPressureMmHg.LA.maximum,
      challenger.ranges.chamberTransmuralPressureMmHg.LA.maximum,
    ),
    leftVentricularMinimumVolumeMl: pair(
      control.ranges.chamberVolumeMl.LV.minimum,
      challenger.ranges.chamberVolumeMl.LV.minimum,
    ),
    leftVentricularMaximumVolumeMl: pair(
      control.ranges.chamberVolumeMl.LV.maximum,
      challenger.ranges.chamberVolumeMl.LV.maximum,
    ),
    mitralPeakERatioToA: nullablePair(
      control.cyclePhysiology.mitral.peakERatioToA,
      challenger.cyclePhysiology.mitral.peakERatioToA,
    ),
    pulmonaryVenousSOverDForwardVolume: nullablePair(
      safeRatio(
        control.cyclePhysiology.pulmonaryVenous.S.forwardVolumeMl,
        control.cyclePhysiology.pulmonaryVenous.D.forwardVolumeMl,
      ),
      safeRatio(
        challenger.cyclePhysiology.pulmonaryVenous.S.forwardVolumeMl,
        challenger.cyclePhysiology.pulmonaryVenous.D.forwardVolumeMl,
      ),
    ),
    aLobeAreaMmHgMl: controlLobes && challengerLobes
      ? pair(controlLobes.aLobe.areaMmHgMl, challengerLobes.aLobe.areaMmHgMl)
      : null,
    vLobeAreaMmHgMl: controlLobes && challengerLobes
      ? pair(controlLobes.vLobe.areaMmHgMl, challengerLobes.vLobe.areaMmHgMl)
      : null,
    reservoirMinusConduitMeanMmHg: controlOrder && challengerOrder
      ? pair(
        controlOrder.reservoirMinusConduitMeanMmHg,
        challengerOrder.reservoirMinusConduitMeanMmHg,
      )
      : null,
  });
}

function topology(
  control: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): NonNullable<MainWireNormalAdultFiveWallBloodVolumeComparisonV1["topology"]> {
  const controlLobes = measurableLobes(control);
  const challengerLobes = measurableLobes(challenger);
  const controlOrder = measurableBranchOrder(control);
  const challengerOrder = measurableBranchOrder(challenger);
  return Object.freeze({
    controlSelfIntersectionCount: controlLobes?.selfIntersectionCount ?? null,
    challengerSelfIntersectionCount:
      challengerLobes?.selfIntersectionCount ?? null,
    controlOpposedLobeOrientation:
      controlLobes?.opposedLobeOrientation ?? null,
    challengerOpposedLobeOrientation:
      challengerLobes?.opposedLobeOrientation ?? null,
    controlReservoirAboveConduitFraction01:
      controlOrder?.reservoirAboveConduitFraction01 ?? null,
    challengerReservoirAboveConduitFraction01:
      challengerOrder?.reservoirAboveConduitFraction01 ?? null,
  });
}

function validateProtocol(
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  label: "control" | "challenger",
  reasons: string[],
): void {
  try {
    assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1({
      identity: summary.protocol.identity,
      identityHash: summary.protocol.identityHash,
      componentHashes: summary.protocol.componentHashes,
      periodicPolicy: summary.convergence.policy,
    });
  } catch (error) {
    reasons.push(`${label} protocol identity failed strict integrity: ${
      error instanceof Error ? error.message : String(error)
    }`);
  }
}

function sameNonBloodVolumeComponentHashes(
  control: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): boolean {
  const strip = (value: Record<string, string>) => {
    const { bloodVolumePriorStableHash: _bloodVolume, ...rest } = value;
    return rest;
  };
  return stableCanonicalStringify(sanitizeForStableHash(strip(
    control.protocol.componentHashes as Record<string, string>,
  ))) === stableCanonicalStringify(sanitizeForStableHash(strip(
    challenger.protocol.componentHashes as Record<string, string>,
  )));
}

function sameNonBloodVolumeProtocolIdentity(
  control: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): boolean {
  const strip = (summary: MainWireNormalAdultFiveWallPeriodicSummaryV1) => {
    const {
      bloodVolumePriorSnapshot: _bloodVolumePriorSnapshot,
      bloodVolumePriorSnapshotStableHash: _bloodVolumePriorSnapshotStableHash,
      ...nonBloodVolumeOperatingPoint
    } = summary.protocol.identity.operatingPoint;
    return {
      ...summary.protocol.identity,
      operatingPoint: nonBloodVolumeOperatingPoint,
    };
  };
  return stableCanonicalStringify(sanitizeForStableHash(strip(control)))
    === stableCanonicalStringify(sanitizeForStableHash(strip(challenger)));
}

function measurableLobes(summary: MainWireNormalAdultFiveWallPeriodicSummaryV1) {
  const value = summary.laPvMorphology.twoLobes;
  return value.status === "measurable" ? value : null;
}

function measurableBranchOrder(
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV1,
) {
  const value = summary.laPvMorphology.reservoirConduitEqualVolumeOrder;
  return value.status === "measurable" ? value : null;
}

function pair(control: number, challenger: number): MetricPair {
  const absoluteDifference = challenger - control;
  return Object.freeze({
    control,
    challenger,
    absoluteDifference,
    relativeDifference: Math.abs(control) > 1e-12
      ? absoluteDifference / Math.abs(control)
      : null,
  });
}

function nullablePair(
  control: number | null,
  challenger: number | null,
): MetricPair | null {
  return control === null || challenger === null
    ? null
    : pair(control, challenger);
}

function rangeWidth(range: Readonly<{ minimum: number; maximum: number }>) {
  return range.maximum - range.minimum;
}

function safeRatio(numerator: number, denominator: number): number | null {
  return Math.abs(denominator) > 1e-12 ? numerator / denominator : null;
}
