import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { restoreMainWireFiveWallNonCoronaryV1 } from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import { createCanonicalMainWireNormalAdultFiveWallProviderV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { loadMainWireAdultFiveWallNonCoronaryReleaseV1 } from "@/engine/scientific/assembly";
import { createMainWireScientificFastTbvPreviewTargetsV1 } from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import {
  estimateMainWireScientificFastTbvPreviewPointV1,
  prepareMainWireScientificGuytonStarlingBaselineV2,
  refineMainWireScientificFastTbvPreviewPointV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import { verifyOfficialHealthyPeriodicPresetBundleAssetsV1 } from "@/engine/scientific/presets";
import { restoreMainWireScientificSessionExactV2 } from "@/engine/scientific/runtime";

describe("main-wire scientific rapid TBV finite-hold preview V1", () => {
  it("keeps two natural beats finite and cannot leak a settled or fit claim", async () => {
    const capsule = await healthyCapsule();
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
    const sourceState = restoreMainWireFiveWallNonCoronaryV1(
      provider,
      capsule.transactionCheckpoint,
    );
    const sourceJson = JSON.stringify(sourceState);
    const dependencies = Object.freeze({
      provider,
      runtime: capsule.runtime,
      pericardium: capsule.pericardium,
      calciumDriveParams: capsule.calciumDriveParams,
    });
    const baseline = prepareMainWireScientificGuytonStarlingBaselineV2(
      dependencies,
      sourceState,
    );
    const targets = createMainWireScientificFastTbvPreviewTargetsV1(
      baseline.source.fixedTotalBloodVolumeMl,
    );
    expect(
      targets["lower-volume"].map(({ targetScale }) => targetScale),
    ).toEqual([0.88, 0.82, 0.76, 0.7, 0.64]);
    expect(
      targets["higher-volume"].map(({ targetScale }) => targetScale),
    ).toEqual([1.075, 1.15, 1.225, 1.3]);

    const target = targets["lower-volume"][0]!;
    const evaluated = estimateMainWireScientificFastTbvPreviewPointV1(
      dependencies,
      baseline.continuationSeedState,
      target,
      "official-healthy-checkpoint",
    );

    expect(JSON.stringify(sourceState)).toBe(sourceJson);
    expect(evaluated.evidence.evidenceClass).toBe("finite-hold-unclassified");
    if (evaluated.evidence.evidenceClass === "failure") {
      throw new Error(evaluated.evidence.reason);
    }
    expect(evaluated.evidence.acquisition).toMatchObject({
      plannedNaturalBeatCountAfterPrediction: 2,
      completedNaturalBeatCountAfterPrediction: 2,
      initializer: {
        referenceEvidence: "trusted-p1",
        targetTbvProjectionErrorMl: expect.closeTo(0, 6),
      },
    });
    expect(evaluated.evidence.observation.quality.numerics.passed).toBe(true);
    expect(evaluated.evidence.observation.quality.lvEvents).toEqual({
      status: "complete",
      endpointDisplayEligible: true,
    });
    expect(evaluated.evidence.observation.lvPressureVolume).toMatchObject({
      endDiastolicVolumeMl: expect.any(Number),
      endDiastolicTransmuralPressureMmHg: expect.any(Number),
      endSystolicVolumeMl: expect.any(Number),
      endSystolicTransmuralPressureMmHg: expect.any(Number),
      strokeWorkMmHgMl: expect.any(Number),
    });
    expect(
      [
        evaluated.evidence.closure
          .predictorToFirstNaturalBeatMaximumNormalizedDelta,
        evaluated.evidence.closure.latestPeriod1MaximumNormalizedDelta,
      ].every(Number.isFinite),
    ).toBe(true);
    expect(
      evaluated.evidence.closure.observedCanonicalConsecutivePeriod1Beats,
    ).toBeLessThanOrEqual(1);
    expect(
      evaluated.evidence.closure.predictorInjectionExcludedFromCanonicalP1Count,
    ).toBe(true);
    expect(evaluated.evidence.eligibility).toMatchObject({
      hemodynamicPreview: true,
      rapidFiniteHoldLocus: true,
      settledP1Locus: false,
      continuationSeed: false,
      espvrEdpvrPrswFit: false,
    });
    expect(evaluated.terminalState?.circulation.totalBloodVolumeMl).toBeCloseTo(
      target.totalBloodVolumeMl,
      6,
    );
    if (evaluated.terminalState === null) {
      throw new Error("initial rapid point did not retain a refinement state");
    }
    expect(() => refineMainWireScientificFastTbvPreviewPointV1(
      dependencies,
      baseline.continuationSeedState,
      evaluated.evidence,
    )).toThrow(/state does not match its evidence target/);
    expect(evaluated.refinementAssessment).toMatchObject({
      completedNaturalBeatCount: 2,
      tier: "baseline-third-beat",
      claimBoundary: {
        periodicityClaim: "none",
        mayEnterSettledP1OrP2Evidence: false,
        maySeedCanonicalContinuation: false,
        mayEnterEspvrEdpvrPrswFit: false,
      },
    });
    const refined = refineMainWireScientificFastTbvPreviewPointV1(
      dependencies,
      evaluated.terminalState,
      evaluated.evidence,
    );
    if (refined.evidence.evidenceClass === "failure") {
      throw new Error(refined.evidence.reason);
    }
    expect(refined.evidence.evidenceId).toBe(evaluated.evidence.evidenceId);
    expect(refined.evidence.acquisition).toMatchObject({
      plannedNaturalBeatCountAfterPrediction: 3,
      completedNaturalBeatCountAfterPrediction: 3,
    });
    expect(refined.evidence.periodicityClaim).toBe("not-demonstrated");
    expect(refined.evidence.eligibility).toMatchObject({
      settledP1Locus: false,
      continuationSeed: false,
      espvrEdpvrPrswFit: false,
    });
    expect(refined.refinementAssessment?.completedNaturalBeatCount).toBe(3);
    expect(refined.refinementAssessment?.claimBoundary.periodicityClaim)
      .toBe("none");
  }, 30_000);
});

let capsulePromise: ReturnType<typeof buildHealthyCapsule> | null = null;

function healthyCapsule() {
  capsulePromise ??= buildHealthyCapsule();
  return capsulePromise;
}

async function buildHealthyCapsule() {
  const [release, catalogRawJson, presetRawJson, checkpointRawJson] =
    await Promise.all([
      loadMainWireAdultFiveWallNonCoronaryReleaseV1(),
      readFile(
        new URL("../data/scientific/presets/catalog-v1.json", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../data/scientific/presets/official-healthy-periodic-v1.json",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ]);
  const preset = await verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
    {
      presetId: "circleheart/official-healthy-periodic",
      presetVersion: "1.0.0",
    },
    release,
    { catalogRawJson, presetRawJson, checkpointRawJson },
  );
  const session = await restoreMainWireScientificSessionExactV2(
    preset.release,
    preset.checkpoint,
  );
  return session.createHemodynamicJobCapsuleV2();
}
