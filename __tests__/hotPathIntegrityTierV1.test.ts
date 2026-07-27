import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOT_PATH_INTEGRITY_TIER_V1,
  hotPathIntegrityTierV1,
  selectHotPathIntegrityTierV1,
  type HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  cloneLandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  createMainWireScientificSessionV1,
} from "@/engine/scientific/runtime";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

const STEP_COUNT = 120;
const DT_SEC = 0.002;

type TierRun = Readonly<{
  observationsSha256: string;
  diagnosticsSha256: string;
  checkpointSha256: string;
  finalState: unknown;
}>;

async function runTierV1(tier: HotPathIntegrityTierV1): Promise<TierRun> {
  const previous = hotPathIntegrityTierV1();
  selectHotPathIntegrityTierV1(tier);
  try {
    const session = await createMainWireScientificSessionV1();
    const observations: unknown[] = [];
    const diagnostics: unknown[] = [];
    for (let index = 0; index < STEP_COUNT; index += 1) {
      const stepped = session.step(DT_SEC);
      if (stepped.converged === false) {
        throw new Error(`${tier} run failed at step ${index}: ${stepped.message}`);
      }
      observations.push(stepped.observation);
      diagnostics.push(stepped.observation.diagnostics);
    }
    const checkpoint = await session.checkpointExactV3();
    return Object.freeze({
      observationsSha256: await sha256CanonicalJsonHex(observations),
      diagnosticsSha256: await sha256CanonicalJsonHex(diagnostics),
      checkpointSha256: checkpoint.checkpointSha256,
      finalState: session.stateIdentity(),
    });
  } finally {
    selectHotPathIntegrityTierV1(previous);
  }
}

describe("hot-path integrity tier V1", () => {
  it("defaults to the full-invariant tier", () => {
    // Every harness, verifier, generator and test therefore keeps every check
    // without opting in. Only a live Workbench Worker selects the lean tier.
    expect(DEFAULT_HOT_PATH_INTEGRITY_TIER_V1).toBe("full-invariant");
    expect(hotPathIntegrityTierV1()).toBe("full-invariant");
  });

  it("actually gates a hot-path defensive check", () => {
    // Without this, the equality pin below could pass because the tier never
    // reaches the guarded modules at all.
    const malformed = {
      landState: new Float64Array(6),
      slsState: { viscousLogStrain: Number.NaN },
      previousFiberLogStrain: 0,
      previousFreeCalciumUM: 0,
    };

    selectHotPathIntegrityTierV1("full-invariant");
    try {
      expect(() => cloneLandSlsWallMaterialStateV1(malformed)).toThrow();
    } finally {
      selectHotPathIntegrityTierV1("full-invariant");
    }

    selectHotPathIntegrityTierV1("hot-path-lean");
    try {
      expect(() => cloneLandSlsWallMaterialStateV1(malformed)).not.toThrow();
    } finally {
      selectHotPathIntegrityTierV1("full-invariant");
    }
  });

  it("produces bit-identical numbers in both tiers", async () => {
    const full = await runTierV1("full-invariant");
    const lean = await runTierV1("hot-path-lean");

    expect(lean.observationsSha256).toBe(full.observationsSha256);
    expect(lean.diagnosticsSha256).toBe(full.diagnosticsSha256);
    expect(lean.checkpointSha256).toBe(full.checkpointSha256);
    expect(lean.finalState).toEqual(full.finalState);
    expect(hotPathIntegrityTierV1()).toBe("full-invariant");
  }, 60_000);
});
