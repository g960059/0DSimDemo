import { describe, expect, it } from "vitest";

import {
  hotPathIntegrityTierV1,
  selectHotPathIntegrityTierV1,
  type HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";

const PRESENTATION_STEP_COUNT_V3 = 500;

type HotPathRunV3 = Readonly<{
  acceptedResultsSha256: string;
  checkpoint: Awaited<
    ReturnType<MainWireIntegratedModelSessionV3["checkpointOperational"]>
  >;
  finalAcceptedState: ReturnType<
    MainWireIntegratedModelSessionV3["currentAcceptedState"]
  >;
}>;

describe("Main Wire Integrated Model V3 hot-path integrity", () => {
  it("keeps full and lean accepted results and checkpoints bit-identical for one second", async () => {
    const initialTier = hotPathIntegrityTierV1();
    const full = await runHotPathTierV3("full-invariant");
    const lean = await runHotPathTierV3("hot-path-lean");

    expect(lean.acceptedResultsSha256).toBe(full.acceptedResultsSha256);
    expect(lean.checkpoint).toEqual(full.checkpoint);
    expect(lean.finalAcceptedState).toEqual(full.finalAcceptedState);
    expect(lean.finalAcceptedState.acceptedTimeSec).toBe(1);
    expect(hotPathIntegrityTierV1()).toBe(initialTier);
  }, 30_000);

  it("rejects a mutated published accepted material state in both tiers", async () => {
    const initialTier = hotPathIntegrityTierV1();
    try {
      for (const tier of [
        "full-invariant",
        "hot-path-lean",
      ] as const satisfies readonly HotPathIntegrityTierV1[]) {
        selectHotPathIntegrityTierV1(tier);
        const session = await MainWireIntegratedModelSessionV3.create();
        session.currentAcceptedState().coronary.mechanics.materialState
          .wallStateByWall.LA.landState[0] += 1;

        const result = session.advanceToPresentationTime(
          mainWireIntegratedModelPresentationTargetTimeSecV3(1),
        );

        expect(result).toMatchObject({
          status: "failed",
          acceptedTimeSec: 0,
          acceptedRevision: 0,
          partiallyAdvanced: false,
          internalAcceptedSubstepCount: 0,
          message: expect.stringMatching(
            /accepted material state fingerprint mismatch/,
          ),
        });
      }
    } finally {
      selectHotPathIntegrityTierV1(initialTier);
    }
  });
});

async function runHotPathTierV3(
  tier: HotPathIntegrityTierV1,
): Promise<HotPathRunV3> {
  const previousTier = hotPathIntegrityTierV1();
  selectHotPathIntegrityTierV1(tier);
  try {
    expect(hotPathIntegrityTierV1()).toBe(tier);
    const session = await MainWireIntegratedModelSessionV3.create();
    const acceptedResults: unknown[] = [];

    for (
      let ordinal = 1;
      ordinal <= PRESENTATION_STEP_COUNT_V3;
      ordinal += 1
    ) {
      const result = session.advanceToPresentationTime(
        mainWireIntegratedModelPresentationTargetTimeSecV3(ordinal),
      );
      if (result.status !== "advanced") {
        throw new Error(unexpectedAdvanceV3(tier, ordinal, result));
      }
      acceptedResults.push(plainDataProjectionV3(result));
    }

    return Object.freeze({
      acceptedResultsSha256: await sha256CanonicalJsonHex(acceptedResults),
      checkpoint: await session.checkpointOperational(),
      finalAcceptedState: session.currentAcceptedState(),
    });
  } finally {
    selectHotPathIntegrityTierV1(previousTier);
  }
}

function unexpectedAdvanceV3(
  tier: HotPathIntegrityTierV1,
  ordinal: number,
  result: Exclude<
    MainWireIntegratedModelPresentationAdvanceV3,
    { status: "advanced" }
  >,
): string {
  return `${tier} V3 run failed at presentation ordinal ${ordinal}: ${
    result.status === "failed" ? result.message : result.status
  }`;
}

function plainDataProjectionV3(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) {
    throw new Error("V3 hot-path accepted result contains a cycle");
  }
  seen.add(value);
  let projected: unknown;
  if (ArrayBuffer.isView(value)) {
    projected = value instanceof DataView
      ? Array.from(new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength,
      ))
      : Array.from(value as unknown as ArrayLike<number>);
  } else if (Array.isArray(value)) {
    projected = value.map((child) => plainDataProjectionV3(child, seen));
  } else {
    projected = Object.fromEntries(Object.keys(value).map((key) => [
      key,
      plainDataProjectionV3(
        (value as Readonly<Record<string, unknown>>)[key],
        seen,
      ),
    ]));
  }
  seen.delete(value);
  return projected;
}
