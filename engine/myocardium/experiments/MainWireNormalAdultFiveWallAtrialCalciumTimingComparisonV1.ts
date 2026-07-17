import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  resolveFiveWallNormalCalciumDriveFixedPriorV1,
  type FiveWallNormalCalciumDrivePriorVariantV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  sanitizeForStableHash,
  stableCanonicalStringify,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ATRIAL_CALCIUM_TIMING_COMPARISON_V1_ID =
  "main-wire-normal-adult-five-wall-atrial-calcium-timing-comparison-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ATRIAL_CALCIUM_TIMING_COMPARISON_CLAIM_V1 =
  Object.freeze({
    comparison: "fixed-prior-paired-periodic-summary-readback" as const,
    intervention:
      "prescribed-biatrial-free-calcium-time-constants-only" as const,
    allowedProtocolDifference: "calcium-drive-fixed-params-only" as const,
    calciumAmplitudeChanged: false as const,
    ventricularCalciumChanged: false as const,
    landActivationOrCrossbridgeKineticsChanged: false as const,
    parameterSearchOrPvShapeFitting: false as const,
    automaticPhysiologyAcceptanceGate: false as const,
    morphologyInterpretationRequiresBothPeriod1: true as const,
    timeStepRobustnessAssessed: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1 = Readonly<{
  canonical: number | null;
  challenger: number | null;
  absoluteDifference: number | null;
  relativeDifference: number | null;
}>;

export type MainWireNormalAdultFiveWallAtrialCalciumTimingComparisonV1 = Readonly<{
  comparisonId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ATRIAL_CALCIUM_TIMING_COMPARISON_V1_ID;
  interpretable: boolean;
  interpretabilityReasons: readonly string[];
  pairing: Readonly<{
    canonicalVariant: string;
    challengerVariant: string;
    canonicalProtocolIdentityHash: string;
    challengerProtocolIdentityHash: string;
    calciumHashChanged: boolean;
    nonCalciumComponentHashesExactMatch: boolean;
    nonCalciumProtocolIdentityExactMatch: boolean;
    dtSec: number;
    initialization: string;
    laSlsMode: string;
  }>;
  metrics: Readonly<{
    aLobeAreaMmHgMl: MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    vLobeAreaMmHgMl: MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    aToVLobeAreaRatio: MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    reservoirMinusConduitMeanMmHg:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    boosterEmptyingCompletedAtAPeakFraction:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    aPeakDelayFromAtrialCalciumOnsetSec:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    aPressurePeakToMitralAFlowPeakSec:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    mitralPeakERatioToA:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    mitralAForwardVolumeMl:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    pulmonaryVenousSOverDForwardVolume:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    pulmonaryVenousArReverseVolumeMl:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    leftAtrialVolumeExcursionMl:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    cardiacIndexLPerMinPerM2:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    meanAorticPressureMmHg:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
    leftAtrialSlsPhysicalDissipationMilliJ:
      MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1;
  }> | null;
  topology: Readonly<{
    canonicalSelfIntersectionCount: number | null;
    challengerSelfIntersectionCount: number | null;
    canonicalOpposedLobeOrientation: boolean | null;
    challengerOpposedLobeOrientation: boolean | null;
    canonicalReservoirAboveConduitFraction01: number | null;
    challengerReservoirAboveConduitFraction01: number | null;
    canonicalSelectionEvidenceSource: string | null;
    challengerSelectionEvidenceSource: string | null;
    aLobeSignedOrientationPreserved: boolean | null;
    canonicalAActivationBurden01: number | null;
    challengerAActivationBurden01: number | null;
    canonicalVActivationBurden01: number | null;
    challengerVActivationBurden01: number | null;
  }> | null;
  directionReadback: Readonly<{
    challengerReducedEmptyingBeforeAPeak: boolean | null;
    challengerMovedAPeakEarlierFromCalciumOnset: boolean | null;
    challengerPreservedSingleOpposedLobes: boolean | null;
    challengerPreservedGlobalReservoirAboveConduit: boolean | null;
  }> | null;
  claim:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ATRIAL_CALCIUM_TIMING_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
  canonical: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): MainWireNormalAdultFiveWallAtrialCalciumTimingComparisonV1 {
  const nonCalciumComponentHashesExactMatch = sameNonCalciumComponentHashes(
    canonical,
    challenger,
  );
  const nonCalciumProtocolIdentityExactMatch = sameNonCalciumProtocolIdentity(
    canonical,
    challenger,
  );
  const calciumHashChanged =
    canonical.protocol.componentHashes.calciumDriveFixedParamsStableHash
      !== challenger.protocol.componentHashes.calciumDriveFixedParamsStableHash;
  const reasons: string[] = [];
  if (canonical.fixedActivationPrior.variant !== "land-atrial-twitch-output") {
    reasons.push("canonical input is not the fixed Land atrial twitch-output prior");
  }
  if (challenger.fixedActivationPrior.variant !== "human-atrial-calcium-biomarker") {
    reasons.push("challenger input is not the fixed human atrial calcium-biomarker prior");
  }
  if (!canonical.morphologyInterpretation.eligible) {
    reasons.push("canonical input is not eligible period-1 morphology");
  }
  if (!challenger.morphologyInterpretation.eligible) {
    reasons.push("challenger input is not eligible period-1 morphology");
  }
  if (canonical.source.dtSec !== challenger.source.dtSec) {
    reasons.push("time steps differ");
  }
  if (canonical.source.initialization !== challenger.source.initialization) {
    reasons.push("initializations differ");
  }
  if (canonical.source.laSlsMode !== challenger.source.laSlsMode) {
    reasons.push("LA SLS modes differ");
  }
  if (
    canonical.source.requestedMaximumBeatCount
      !== challenger.source.requestedMaximumBeatCount
  ) {
    reasons.push("requested maximum beat counts differ");
  }
  if (!nonEmptyHash(canonical.protocol.identityHash)) {
    reasons.push("canonical protocol identity hash is empty");
  }
  if (!nonEmptyHash(challenger.protocol.identityHash)) {
    reasons.push("challenger protocol identity hash is empty");
  }
  reasons.push(...protocolIdentityConsistencyReasons(canonical, "canonical"));
  reasons.push(...protocolIdentityConsistencyReasons(challenger, "challenger"));
  reasons.push(...calciumSummaryConsistencyReasons(
    canonical,
    "land-atrial-twitch-output",
    "canonical",
  ));
  reasons.push(...calciumSummaryConsistencyReasons(
    challenger,
    "human-atrial-calcium-biomarker",
    "challenger",
  ));
  if (!calciumHashChanged) reasons.push("calcium fixed-prior hash did not change");
  if (!nonCalciumComponentHashesExactMatch) {
    reasons.push("a non-calcium protocol component hash differs");
  }
  if (!nonCalciumProtocolIdentityExactMatch) {
    reasons.push("non-calcium protocol identity differs");
  }

  const canonicalLobes = measurableLobes(canonical);
  const challengerLobes = measurableLobes(challenger);
  const canonicalBranch = measurableBranch(canonical);
  const challengerBranch = measurableBranch(challenger);
  const cWave = canonical.cyclePhysiology.leftAtrialPressureWaves;
  const hWave = challenger.cyclePhysiology.leftAtrialPressureWaves;
  const aLobeSignedOrientationPreserved = sameNonZeroSign(
    canonicalLobes?.aLobe.signedAreaMmHgMl ?? null,
    challengerLobes?.aLobe.signedAreaMmHgMl ?? null,
  );
  if (aLobeSignedOrientationPreserved === false) {
    reasons.push("activation-dependent A/V lobe labels changed orientation");
  }
  const interpretable = reasons.length === 0;
  const metrics = interpretable
    ? buildMetrics(canonical, challenger, canonicalLobes, challengerLobes)
    : null;
  const topology = interpretable
    ? Object.freeze({
      canonicalSelfIntersectionCount:
        canonicalLobes?.selfIntersectionCount ?? null,
      challengerSelfIntersectionCount:
        challengerLobes?.selfIntersectionCount ?? null,
      canonicalOpposedLobeOrientation:
        canonicalLobes?.opposedLobeOrientation ?? null,
      challengerOpposedLobeOrientation:
        challengerLobes?.opposedLobeOrientation ?? null,
      canonicalReservoirAboveConduitFraction01:
        canonicalBranch?.reservoirAboveConduitFraction01 ?? null,
      challengerReservoirAboveConduitFraction01:
        challengerBranch?.reservoirAboveConduitFraction01 ?? null,
      canonicalSelectionEvidenceSource:
        canonicalLobes?.selectionEvidenceSource ?? null,
      challengerSelectionEvidenceSource:
        challengerLobes?.selectionEvidenceSource ?? null,
      aLobeSignedOrientationPreserved,
      canonicalAActivationBurden01:
        canonicalLobes?.aLobe.activationBurden01 ?? null,
      challengerAActivationBurden01:
        challengerLobes?.aLobe.activationBurden01 ?? null,
      canonicalVActivationBurden01:
        canonicalLobes?.vLobe.activationBurden01 ?? null,
      challengerVActivationBurden01:
        challengerLobes?.vLobe.activationBurden01 ?? null,
    })
    : null;
  const directionReadback = interpretable
    ? Object.freeze({
      challengerReducedEmptyingBeforeAPeak:
        comparableBoosterEmptyingDirection(cWave, hWave),
      challengerMovedAPeakEarlierFromCalciumOnset: compareLess(
        hWave.aPeakDelayFromAtrialCalciumOnsetSec,
        cWave.aPeakDelayFromAtrialCalciumOnsetSec,
      ),
      challengerPreservedSingleOpposedLobes:
        challengerLobes === null
          ? null
          : challengerLobes.selfIntersectionCount === 1
            && challengerLobes.opposedLobeOrientation,
      challengerPreservedGlobalReservoirAboveConduit:
        challengerBranch === null
          ? null
          : challengerBranch.reservoirAboveConduitFraction01 === 1,
    })
    : null;

  return Object.freeze({
    comparisonId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ATRIAL_CALCIUM_TIMING_COMPARISON_V1_ID,
    interpretable,
    interpretabilityReasons: Object.freeze(reasons),
    pairing: Object.freeze({
      canonicalVariant: canonical.fixedActivationPrior.variant,
      challengerVariant: challenger.fixedActivationPrior.variant,
      canonicalProtocolIdentityHash: canonical.protocol.identityHash,
      challengerProtocolIdentityHash: challenger.protocol.identityHash,
      calciumHashChanged,
      nonCalciumComponentHashesExactMatch,
      nonCalciumProtocolIdentityExactMatch,
      dtSec: canonical.source.dtSec,
      initialization: canonical.source.initialization,
      laSlsMode: canonical.source.laSlsMode,
    }),
    metrics,
    topology,
    directionReadback,
    claim:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ATRIAL_CALCIUM_TIMING_COMPARISON_CLAIM_V1,
  });
}

type MeasurableLobes = Exclude<
  MainWireNormalAdultFiveWallPeriodicSummaryV1["laPvMorphology"]["twoLobes"],
  { status: "not-measurable" }
>;

function buildMetrics(
  canonical: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  canonicalLobes: MeasurableLobes | null,
  challengerLobes: MeasurableLobes | null,
): NonNullable<
  MainWireNormalAdultFiveWallAtrialCalciumTimingComparisonV1["metrics"]
> {
  const canonicalBranch = measurableBranch(canonical);
  const challengerBranch = measurableBranch(challenger);
  const cWave = canonical.cyclePhysiology.leftAtrialPressureWaves;
  const hWave = challenger.cyclePhysiology.leftAtrialPressureWaves;
  const cPv = canonical.cyclePhysiology.pulmonaryVenous;
  const hPv = challenger.cyclePhysiology.pulmonaryVenous;
  return Object.freeze({
    aLobeAreaMmHgMl: metric(
      canonicalLobes?.aLobe.areaMmHgMl ?? null,
      challengerLobes?.aLobe.areaMmHgMl ?? null,
    ),
    vLobeAreaMmHgMl: metric(
      canonicalLobes?.vLobe.areaMmHgMl ?? null,
      challengerLobes?.vLobe.areaMmHgMl ?? null,
    ),
    aToVLobeAreaRatio: metric(
      safeRatio(
        canonicalLobes?.aLobe.areaMmHgMl,
        canonicalLobes?.vLobe.areaMmHgMl,
      ),
      safeRatio(
        challengerLobes?.aLobe.areaMmHgMl,
        challengerLobes?.vLobe.areaMmHgMl,
      ),
    ),
    reservoirMinusConduitMeanMmHg: metric(
      canonicalBranch?.reservoirMinusConduitMeanMmHg ?? null,
      challengerBranch?.reservoirMinusConduitMeanMmHg ?? null,
    ),
    boosterEmptyingCompletedAtAPeakFraction: metric(
      cWave.boosterEmptyingCompletedAtAPeakFraction,
      hWave.boosterEmptyingCompletedAtAPeakFraction,
    ),
    aPeakDelayFromAtrialCalciumOnsetSec: metric(
      cWave.aPeakDelayFromAtrialCalciumOnsetSec,
      hWave.aPeakDelayFromAtrialCalciumOnsetSec,
    ),
    aPressurePeakToMitralAFlowPeakSec: metric(
      cWave.aPressurePeakToMitralAFlowPeakSec,
      hWave.aPressurePeakToMitralAFlowPeakSec,
    ),
    mitralPeakERatioToA: metric(
      canonical.cyclePhysiology.mitral.peakERatioToA,
      challenger.cyclePhysiology.mitral.peakERatioToA,
    ),
    mitralAForwardVolumeMl: metric(
      canonical.cyclePhysiology.mitral.A.forwardVolumeMl,
      challenger.cyclePhysiology.mitral.A.forwardVolumeMl,
    ),
    pulmonaryVenousSOverDForwardVolume: metric(
      safeRatio(cPv.S.forwardVolumeMl, cPv.D.forwardVolumeMl),
      safeRatio(hPv.S.forwardVolumeMl, hPv.D.forwardVolumeMl),
    ),
    pulmonaryVenousArReverseVolumeMl: metric(
      cPv.Ar.reverseVolumeMl,
      hPv.Ar.reverseVolumeMl,
    ),
    leftAtrialVolumeExcursionMl: metric(
      volumeExcursion(canonical, "LA"),
      volumeExcursion(challenger, "LA"),
    ),
    cardiacIndexLPerMinPerM2: metric(
      canonical.hemodynamics.cardiacIndexLPerMinPerM2,
      challenger.hemodynamics.cardiacIndexLPerMinPerM2,
    ),
    meanAorticPressureMmHg: metric(
      canonical.hemodynamics.meanAorticAbsolutePressureMmHg,
      challenger.hemodynamics.meanAorticAbsolutePressureMmHg,
    ),
    leftAtrialSlsPhysicalDissipationMilliJ: metric(
      canonical.cyclePhysiology.workEnergy.perWall.LA.sls
        .physicalDissipationMilliJ,
      challenger.cyclePhysiology.workEnergy.perWall.LA.sls
        .physicalDissipationMilliJ,
    ),
  });
}

function metric(
  canonical: number | null,
  challenger: number | null,
): MainWireNormalAdultFiveWallAtrialCalciumTimingMetricV1 {
  if (canonical === null || challenger === null) {
    return Object.freeze({
      canonical,
      challenger,
      absoluteDifference: null,
      relativeDifference: null,
    });
  }
  return Object.freeze({
    canonical,
    challenger,
    absoluteDifference: challenger - canonical,
    relativeDifference: canonical === 0
      ? null
      : (challenger - canonical) / Math.abs(canonical),
  });
}

function measurableLobes(summary: MainWireNormalAdultFiveWallPeriodicSummaryV1) {
  const lobes = summary.laPvMorphology.twoLobes;
  return lobes.status === "measurable" ? lobes : null;
}

function measurableBranch(summary: MainWireNormalAdultFiveWallPeriodicSummaryV1) {
  const branch = summary.laPvMorphology.reservoirConduitEqualVolumeOrder;
  return branch.status === "measurable" ? branch : null;
}

function safeRatio(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): number | null {
  if (
    numerator === null || numerator === undefined
    || denominator === null || denominator === undefined
    || !Number.isFinite(numerator) || !Number.isFinite(denominator)
    || denominator === 0
  ) return null;
  return numerator / denominator;
}

function volumeExcursion(
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  chamber: "LA",
): number {
  const range = summary.ranges.chamberVolumeMl[chamber];
  return range.maximum - range.minimum;
}

function compareLess(
  challenger: number | null,
  canonical: number | null,
): boolean | null {
  if (challenger === null || canonical === null) return null;
  return challenger < canonical;
}

function comparableBoosterEmptyingDirection(
  canonical: MainWireNormalAdultFiveWallPeriodicSummaryV1[
    "cyclePhysiology"
  ]["leftAtrialPressureWaves"],
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1[
    "cyclePhysiology"
  ]["leftAtrialPressureWaves"],
): boolean | null {
  if (
    canonical.boosterEmptyingCompletedAtAPeakStatus !== "within-active-emptying"
    || challenger.boosterEmptyingCompletedAtAPeakStatus
      !== "within-active-emptying"
  ) return null;
  return compareLess(
    challenger.boosterEmptyingCompletedAtAPeakFraction,
    canonical.boosterEmptyingCompletedAtAPeakFraction,
  );
}

function sameNonZeroSign(
  left: number | null,
  right: number | null,
): boolean | null {
  if (left === null || right === null || left === 0 || right === 0) return null;
  return Math.sign(left) === Math.sign(right);
}

function calciumSummaryConsistencyReasons(
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  expectedVariant: FiveWallNormalCalciumDrivePriorVariantV1,
  label: "canonical" | "challenger",
): readonly string[] {
  const reasons: string[] = [];
  const expected = resolveFiveWallNormalCalciumDriveFixedPriorV1(
    expectedVariant,
  );
  const expectedHash = stableHash(sanitizeForStableHash(expected));
  const protocolCalcium = summary.protocol.identity.calciumDrive;
  const componentHash =
    summary.protocol.componentHashes.calciumDriveFixedParamsStableHash;
  if (summary.source.calciumDrivePriorVariant !== expectedVariant) {
    reasons.push(`${label} source calcium variant is inconsistent`);
  }
  if (summary.fixedActivationPrior.variant !== expectedVariant) {
    reasons.push(`${label} fixed activation prior variant is inconsistent`);
  }
  if (summary.fixedActivationPrior.parameterSetId !== expected.parameterSetId) {
    reasons.push(`${label} fixed activation prior parameterSetId is inconsistent`);
  }
  if (protocolCalcium.driveId !== FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID) {
    reasons.push(`${label} calcium driveId is inconsistent`);
  }
  if (protocolCalcium.parameterSetId !== expected.parameterSetId) {
    reasons.push(`${label} protocol calcium parameterSetId is inconsistent`);
  }
  if (componentHash !== expectedHash) {
    reasons.push(`${label} calcium component hash is inconsistent`);
  }
  if (protocolCalcium.fixedParamsStableHash !== componentHash) {
    reasons.push(`${label} protocol calcium hash does not match component hash`);
  }
  if (
    summary.fixedActivationPrior.atrialRiseTimeConstantSec
      !== expected.atrial.riseTimeConstantSec
    || summary.fixedActivationPrior.atrialDecayTimeConstantSec
      !== expected.atrial.decayTimeConstantSec
  ) {
    reasons.push(`${label} reported atrial calcium time constants are inconsistent`);
  }
  return Object.freeze(reasons);
}

function nonEmptyHash(value: string): boolean {
  return typeof value === "string" && value.length > 0;
}

function protocolIdentityConsistencyReasons(
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  label: "canonical" | "challenger",
): readonly string[] {
  const reasons: string[] = [];
  const identity = summary.protocol.identity;
  const hashes = summary.protocol.componentHashes;
  try {
    assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1({
      identity,
      identityHash: summary.protocol.identityHash,
      componentHashes: hashes,
      periodicPolicy: summary.convergence.policy,
    });
  } catch (error) {
    reasons.push(
      `${label} protocol identity failed strict integrity: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (summary.protocol.identityHash !== protocolHash(identity)) {
    reasons.push(`${label} protocol identity hash is inconsistent`);
  }
  if (
    hashes.mechanicsProviderMetadataStableHash
      !== protocolHash(identity.mechanicsProvider)
  ) reasons.push(`${label} mechanics component hash is inconsistent`);
  const topologyHash = protocolHash(identity.circulation.topologyGraphSnapshot);
  if (
    hashes.circulationTopologyGraphStableHash !== topologyHash
    || identity.circulation.topologyGraphStableHash !== topologyHash
  ) reasons.push(`${label} circulation topology hash is inconsistent`);
  if (
    hashes.circulationRuntimeStableHash
      !== identity.circulation.runtimeStableHash
  ) reasons.push(`${label} circulation runtime hash is inconsistent`);
  const periodicPolicyHash = protocolHash(summary.convergence.policy);
  if (
    hashes.periodicPolicyStableHash !== periodicPolicyHash
    || identity.periodicPolicy.policyStableHash !== periodicPolicyHash
  ) reasons.push(`${label} periodic policy hash is inconsistent`);
  return Object.freeze(reasons);
}

function protocolHash(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}

function sameNonCalciumComponentHashes(
  canonical: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): boolean {
  const left = canonical.protocol.componentHashes;
  const right = challenger.protocol.componentHashes;
  return left.mechanicsProviderMetadataStableHash
      === right.mechanicsProviderMetadataStableHash
    && left.circulationTopologyGraphStableHash
      === right.circulationTopologyGraphStableHash
    && left.circulationRuntimeStableHash === right.circulationRuntimeStableHash
    && left.circulationConfigurationSnapshotStableHash
      === right.circulationConfigurationSnapshotStableHash
    && left.periodicPolicyStableHash === right.periodicPolicyStableHash;
}

function sameNonCalciumProtocolIdentity(
  canonical: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  challenger: MainWireNormalAdultFiveWallPeriodicSummaryV1,
): boolean {
  const stripCalcium = (
    summary: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  ) => {
    const { calciumDrive, ...withoutCalcium } =
      summary.protocol.identity;
    return Object.freeze({
      ...withoutCalcium,
      calciumDrive: Object.freeze({ driveId: calciumDrive.driveId }),
    });
  };
  return stableCanonicalStringify(sanitizeForStableHash(
    stripCalcium(canonical),
  )) === stableCanonicalStringify(sanitizeForStableHash(
    stripCalcium(challenger),
  ));
}
