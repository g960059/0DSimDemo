import { describe, expect, it } from "vitest";

import canonicalSummaryArtifact from "@/data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-canonical-dt2ms-summary-v1.json";
import challengerSummaryArtifact from "@/data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-human-atrial-calcium-biomarker-dt2ms-summary-v1.json";
import committedComparisonArtifact from "@/data/myocardium/reports/mainwire-normal-adult-five-wall-atrial-calcium-timing-comparison-dt2ms-v1.json";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  resolveFiveWallNormalCalciumDriveFixedPriorV1,
  type FiveWallNormalCalciumDrivePriorVariantV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallAtrialCalciumTimingComparisonV1";
import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

describe("main-wire normal-adult fixed atrial calcium timing comparison V1", () => {
  it("keeps the committed comparison exactly reproducible from its summaries", () => {
    const recomputed = compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
      canonicalSummaryArtifact as unknown as
        MainWireNormalAdultFiveWallPeriodicSummaryV1,
      challengerSummaryArtifact as unknown as
        MainWireNormalAdultFiveWallPeriodicSummaryV1,
    );
    expect(recomputed).toEqual(committedComparisonArtifact);
  });

  it("qualifies an exact paired comparison and reports direction without gates", () => {
    const canonical = summary("land-atrial-twitch-output");
    const challenger = summary("human-atrial-calcium-biomarker");
    challenger.laPvMorphology.twoLobes.aLobe.areaMmHgMl = 6;
    challenger.laPvMorphology.twoLobes.aLobe.signedAreaMmHgMl = 6;
    challenger.cyclePhysiology.leftAtrialPressureWaves
      .boosterEmptyingCompletedAtAPeakFraction = 0.3;

    const comparison = compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
      canonical,
      challenger,
    );

    expect(comparison.interpretable).toBe(true);
    expect(comparison.interpretabilityReasons).toEqual([]);
    expect(comparison.pairing).toMatchObject({
      calciumHashChanged: true,
      nonCalciumComponentHashesExactMatch: true,
      nonCalciumProtocolIdentityExactMatch: true,
    });
    expect(comparison.metrics?.aLobeAreaMmHgMl.challenger).toBe(6);
    expect(comparison.directionReadback
      ?.challengerReducedEmptyingBeforeAPeak).toBe(true);
    expect(comparison.topology).toMatchObject({
      aLobeSignedOrientationPreserved: true,
      canonicalSelectionEvidenceSource: "activation-burden",
      challengerSelectionEvidenceSource: "activation-burden",
    });
    expect(comparison.claim).toMatchObject({
      intervention: "prescribed-biatrial-free-calcium-time-constants-only",
      calciumAmplitudeChanged: false,
      ventricularCalciumChanged: false,
      landActivationOrCrossbridgeKineticsChanged: false,
      automaticPhysiologyAcceptanceGate: false,
    });
  });

  it("withholds qualified readbacks when pairing is not exact", () => {
    const canonical = summary("land-atrial-twitch-output");
    const challenger = summary("human-atrial-calcium-biomarker");
    challenger.source.dtSec = 0.001;
    challenger.source.requestedMaximumBeatCount = 48;
    challenger.protocol.componentHashes.circulationRuntimeStableHash =
      "other-runtime";

    const comparison = compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
      canonical,
      challenger,
    );

    expect(comparison.interpretable).toBe(false);
    expect(comparison.interpretabilityReasons).toEqual(expect.arrayContaining([
      "time steps differ",
      "requested maximum beat counts differ",
      "a non-calcium protocol component hash differs",
    ]));
    expect(comparison.metrics).toBeNull();
    expect(comparison.topology).toBeNull();
    expect(comparison.directionReadback).toBeNull();
  });

  it("rejects drive, variant, parameter, and hash inconsistencies", () => {
    const canonical = summary("land-atrial-twitch-output");
    const challenger = summary("human-atrial-calcium-biomarker");
    challenger.source.calciumDrivePriorVariant = "land-atrial-twitch-output";
    challenger.protocol.identity.calciumDrive.driveId = "wrong-drive";
    challenger.protocol.identity.calciumDrive.parameterSetId = "wrong-set";
    challenger.protocol.componentHashes.calciumDriveFixedParamsStableHash =
      "wrong-hash";

    const comparison = compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
      canonical,
      challenger,
    );

    expect(comparison.interpretable).toBe(false);
    expect(comparison.interpretabilityReasons).toEqual(expect.arrayContaining([
      "challenger source calcium variant is inconsistent",
      "challenger calcium driveId is inconsistent",
      "challenger protocol calcium parameterSetId is inconsistent",
      "challenger calcium component hash is inconsistent",
      "non-calcium protocol identity differs",
    ]));
    expect(comparison.metrics).toBeNull();
  });

  it("detects an activation-dependent A/V lobe label orientation change", () => {
    const canonical = summary("land-atrial-twitch-output");
    const challenger = summary("human-atrial-calcium-biomarker");
    challenger.laPvMorphology.twoLobes.aLobe.signedAreaMmHgMl *= -1;

    const comparison = compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
      canonical,
      challenger,
    );

    expect(comparison.interpretable).toBe(false);
    expect(comparison.interpretabilityReasons).toContain(
      "activation-dependent A/V lobe labels changed orientation",
    );
    expect(comparison.metrics).toBeNull();
  });

  it("does not call an out-of-window booster fraction an improvement", () => {
    const canonical = summary("land-atrial-twitch-output");
    const challenger = summary("human-atrial-calcium-biomarker");
    challenger.cyclePhysiology.leftAtrialPressureWaves
      .boosterEmptyingCompletedAtAPeakStatus = "at-or-after-cycle-minimum";

    const comparison = compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
      canonical,
      challenger,
    );

    expect(comparison.interpretable).toBe(true);
    expect(comparison.directionReadback
      ?.challengerReducedEmptyingBeforeAPeak).toBeNull();
  });

  it("compares reordered non-calcium identity keys by stable value", () => {
    const canonical = summary("land-atrial-twitch-output");
    const challenger = summary("human-atrial-calcium-biomarker");
    const mechanics = challenger.protocol.identity.mechanicsProvider;
    challenger.protocol.identity.mechanicsProvider = {
      stateSchemaVersion: mechanics.stateSchemaVersion,
      parameterIdentityHash: mechanics.parameterIdentityHash,
      parameterSetId: mechanics.parameterSetId,
      providerId: mechanics.providerId,
    };

    expect(compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
      canonical,
      challenger,
    ).interpretable).toBe(true);
  });
});

type MutableSummary = {
  -readonly [K in keyof MainWireNormalAdultFiveWallPeriodicSummaryV1]: any;
};

function summary(
  variant: FiveWallNormalCalciumDrivePriorVariantV1,
): MutableSummary {
  const value = JSON.parse(JSON.stringify(canonicalSummaryArtifact)) as
    MutableSummary;
  const prior = resolveFiveWallNormalCalciumDriveFixedPriorV1(variant);
  const calciumHash = stableHash(sanitizeForStableHash(prior));
  value.source.calciumDrivePriorVariant = variant;
  value.source.requestedMaximumBeatCount = 32;
  value.source.dtSec = 0.002;
  value.fixedActivationPrior = {
    variant,
    parameterSetId: prior.parameterSetId,
    atrialRiseTimeConstantSec: prior.atrial.riseTimeConstantSec,
    atrialDecayTimeConstantSec: prior.atrial.decayTimeConstantSec,
    atrialCalciumOnsetPhase01: 0.852,
    purpose:
      "normalized-Ca-lobe-selection-proxy-not-Land-activation-or-tension-law",
    activationNormalization:
      "clamp((freeCa-diastolicCa)/peakAmplitude,0,1)",
  };
  value.protocol.identity.calciumDrive = {
    driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
    parameterSetId: prior.parameterSetId,
    fixedParamsStableHash: calciumHash,
  };
  value.protocol.componentHashes.calciumDriveFixedParamsStableHash = calciumHash;
  value.protocol.identityHash = stableHash(
    sanitizeForStableHash(value.protocol.identity),
  );
  value.morphologyInterpretation = {
    eligible: true,
    scope: "current-dt-period1-only",
    timeStepRobustnessEstablished: false,
    reason: "eligible-current-dt-period1-only",
  };
  return value;
}
