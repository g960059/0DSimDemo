import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  restoreMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import { createCanonicalMainWireNormalAdultFiveWallProviderV1 } from
  "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import { loadMainWireAdultFiveWallNonCoronaryReleaseV1 } from
  "@/engine/scientific/assembly";
import { runMainWireScientificPvRelationsProtocolV2 } from
  "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";
import { verifyOfficialHealthyPeriodicPresetBundleAssetsV1 } from
  "@/engine/scientific/presets";
import { restoreMainWireScientificSessionExactV2 } from
  "@/engine/scientific/runtime";

describe("main-wire fixed-TBV PV relations V2 integration", () => {
  it("is source-phase invariant and bounded under 1 ms sensitivity", async () => {
    const capsule = await healthyCapsule();
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
    const sourceState = restoreMainWireFiveWallNonCoronaryV1(
      provider,
      capsule.transactionCheckpoint,
    );
    const dependencies = Object.freeze({
      provider,
      runtime: capsule.runtime,
      pericardium: capsule.pericardium,
      calciumDriveParams: capsule.calciumDriveParams,
    });
    const sourceJson = JSON.stringify(sourceState);
    const reference = runMainWireScientificPvRelationsProtocolV2(
      dependencies,
      sourceState,
    );
    const shiftedSource = advanceAcceptedState(
      dependencies,
      sourceState,
      150,
      0.002,
    );
    const shifted = runMainWireScientificPvRelationsProtocolV2(
      dependencies,
      shiftedSource,
    );
    const halvedStep = runMainWireScientificPvRelationsProtocolV2(
      dependencies,
      sourceState,
      { policy: { integrationTimeStepSec: 0.001, outputStride: 10 } },
    );

    expect(JSON.stringify(sourceState)).toBe(sourceJson);
    expect(reference.terminationReason)
      .toBe("predeclared-loading-span-reached");
    expect(reference.policy.maximumVcRaResistanceScale).toBe(16);
    expect(reference.beats.every((beat) =>
      beat.valid && beat.interventionRampCompletedBeforeEndDiastole)).toBe(true);
    expect("prsw" in reference.analysis).toBe(false);
    expect(reference.analysis.transientPathWorkEdvSensitivity.fit).toMatchObject({
      conventionalPrswClaimed: false,
    });
    expect(shifted.terminationReason).toBe(reference.terminationReason);
    expect(shifted.fitPointSelection.includedBeatIds)
      .toEqual(reference.fitPointSelection.includedBeatIds);
    expect(relationStatuses(shifted)).toEqual(relationStatuses(reference));
    expect(maximumEndpointDifference(reference, shifted, "volumeMl"))
      .toBeLessThan(0.05);
    expect(maximumEndpointDifference(
      reference,
      shifted,
      "transmuralPressureMmHg",
    )).toBeLessThan(0.05);

    // The checked-in source is a 2 ms accepted orbit. It must not silently be
    // relabelled as a 1 ms P1 source when the halved-step replay misses the
    // canonical closure tolerance; a separately settled 1 ms checkpoint is
    // required before endpoint/fit comparisons are scientifically eligible.
    expect(halvedStep.failureReason).toBeNull();
    expect(halvedStep.terminationReason).toBe("source-periodicity-gate-failed");
    expect(halvedStep.baselinePeriodicity).toBe("not-converged");
    expect(halvedStep.fitPointSelection.includedBeatIds).toEqual([]);
  }, 45_000);
});

type ProtocolResult = ReturnType<
  typeof runMainWireScientificPvRelationsProtocolV2
>;

function relationStatuses(result: ProtocolResult) {
  return Object.freeze({
    espvr: result.analysis.espvr.status,
    edpvr: result.analysis.edpvr.status,
    transientPathWorkEdv:
      result.analysis.transientPathWorkEdvSensitivity.status,
  });
}

function maximumEndpointDifference(
  reference: ProtocolResult,
  compared: ProtocolResult,
  field: "volumeMl" | "transmuralPressureMmHg",
): number {
  return Math.max(...reference.beats.flatMap((beat, index) => {
    const other = compared.beats[index];
    if (other === undefined) return [Number.POSITIVE_INFINITY];
    return (["endDiastolic", "endSystolic"] as const).map((endpoint) => {
      const left = beat[endpoint];
      const right = other[endpoint];
      return left === null || right === null
        ? Number.POSITIVE_INFINITY
        : Math.abs(left[field] - right[field]);
    });
  }));
}

function advanceAcceptedState(
  dependencies: Readonly<{
    provider: ReturnType<
      typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
    >;
    runtime: Parameters<
      typeof stepMainWireFiveWallNonCoronaryV1
    >[2]["runtime"];
    pericardium: Parameters<
      typeof stepMainWireFiveWallNonCoronaryV1
    >[2]["pericardium"];
    calciumDriveParams: Parameters<
      typeof stepMainWireFiveWallNonCoronaryV1
    >[2]["calciumDriveParams"];
  }>,
  initialState: MainWireFiveWallNonCoronaryAcceptedStateV1<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >,
  stepCount: number,
  dtSec: number,
) {
  let state = initialState;
  for (let index = 0; index < stepCount; index += 1) {
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      dependencies.provider,
      state,
      {
        dtSec,
        runtime: dependencies.runtime,
        pericardium: dependencies.pericardium,
        calciumDriveParams: dependencies.calciumDriveParams,
      },
    );
    if (stepped.converged === false) {
      throw new Error(`phase-shift step ${index + 1} failed: ${stepped.message}`);
    }
    state = stepped.acceptedState;
  }
  return state;
}

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
