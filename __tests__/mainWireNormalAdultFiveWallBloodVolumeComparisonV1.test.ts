import { describe, expect, it } from "vitest";

import controlArtifact from "@/data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-canonical-dt2ms-summary-v1.json";
import {
  compareMainWireNormalAdultFiveWallBloodVolumeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallBloodVolumeComparisonV1";
import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  resolveMainWireNormalAdultBloodVolumePriorV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumePriorV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

describe("main-wire normal-adult five-wall fixed TBV comparison V1", () => {
  it("qualifies only the fixed blood-volume owner difference", () => {
    const control = clone(controlArtifact);
    const challenger = challengerFrom(control);
    const comparison = compareMainWireNormalAdultFiveWallBloodVolumeV1(
      control,
      challenger,
    );

    expect(comparison.interpretable).toBe(true);
    expect(comparison.interpretabilityReasons).toEqual([]);
    expect(comparison.pairing).toMatchObject({
      controlVariant: "cold-seed-control",
      challengerVariant:
        "official-target-minus-excluded-coronary-cold-seed",
      bloodVolumeHashChanged: true,
      nonBloodVolumeComponentHashesExactMatch: true,
      nonBloodVolumeProtocolIdentityExactMatch: true,
    });
    expect(comparison.metrics?.totalBloodVolumeMl.control)
      .toBeCloseTo(4589.457569593876, 9);
    expect(comparison.metrics?.totalBloodVolumeMl.challenger)
      .toBeCloseTo(5522.11, 9);
    expect(comparison.claim).toMatchObject({
      intervention: "initial-total-blood-volume-only",
      parameterSearchOrPvShapeFitting: false,
      automaticPhysiologyAcceptanceGate: false,
    });
  });

  it("withholds physiology readback until both arms establish period-1", () => {
    const control = clone(controlArtifact);
    const challenger = challengerFrom(control);
    challenger.convergence.periodicSteadyStateClaimed = false;
    challenger.morphologyInterpretation.eligible = false;

    const comparison = compareMainWireNormalAdultFiveWallBloodVolumeV1(
      control,
      challenger,
    );
    expect(comparison.interpretable).toBe(false);
    expect(comparison.interpretabilityReasons).toEqual(expect.arrayContaining([
      "challenger did not establish formal period-1 closure",
      "challenger morphology is not eligible for interpretation",
    ]));
    expect(comparison.metrics).toBeNull();
    expect(comparison.topology).toBeNull();
  });

  it("rejects any simultaneous non-TBV protocol change", () => {
    const control = clone(controlArtifact);
    const challenger = challengerFrom(control);
    challenger.protocol.componentHashes.circulationRuntimeStableHash =
      "other-runtime";

    const comparison = compareMainWireNormalAdultFiveWallBloodVolumeV1(
      control,
      challenger,
    );
    expect(comparison.interpretable).toBe(false);
    expect(comparison.interpretabilityReasons).toEqual(expect.arrayContaining([
      "challenger protocol identity failed strict integrity: periodic circulation topology/runtime differs from its configuration snapshot",
      "a non-blood-volume protocol component hash differs",
    ]));
  });

  it("does not hide a future non-TBV operating-point owner", () => {
    const control = clone(controlArtifact);
    const challenger = challengerFrom(control);
    control.protocol.identity.operatingPoint.futureNonTbvOwner = "control";
    challenger.protocol.identity.operatingPoint.futureNonTbvOwner =
      "challenger";
    control.protocol.identityHash = stableHash(sanitizeForStableHash(
      control.protocol.identity,
    ));
    challenger.protocol.identityHash = stableHash(sanitizeForStableHash(
      challenger.protocol.identity,
    ));

    const comparison = compareMainWireNormalAdultFiveWallBloodVolumeV1(
      control,
      challenger,
    );
    expect(comparison.interpretable).toBe(false);
    expect(comparison.interpretabilityReasons).toContain(
      "non-blood-volume protocol identity differs",
    );
  });
});

type MutableSummary = {
  -readonly [K in keyof MainWireNormalAdultFiveWallPeriodicSummaryV1]: any;
};

function clone(value: unknown): MutableSummary {
  return JSON.parse(JSON.stringify(value)) as MutableSummary;
}

function challengerFrom(control: MutableSummary): MutableSummary {
  const challenger = clone(control);
  const prior = resolveMainWireNormalAdultBloodVolumePriorV1(
    "official-target-minus-excluded-coronary-cold-seed",
  );
  challenger.source.bloodVolumePriorVariant = prior.snapshot.variant;
  challenger.source.bloodVolumePriorAudit = prior.audit;
  challenger.protocol.identity.operatingPoint = {
    bloodVolumePriorSnapshot: prior.snapshot,
    bloodVolumePriorSnapshotStableHash: prior.snapshotStableHash,
  };
  challenger.protocol.componentHashes.bloodVolumePriorStableHash =
    prior.snapshotStableHash;
  challenger.protocol.identityHash = stableHash(sanitizeForStableHash(
    challenger.protocol.identity,
  ));
  return challenger;
}
