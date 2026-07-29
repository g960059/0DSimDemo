import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOT_PATH_INTEGRITY_TIER_V1,
  hotPathIntegrityTierV1,
  selectHotPathIntegrityTierV1,
  type HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  validateCoronaryAcceptedAutoregulationStateV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  validateDynamicMechanicalSupportAcceptedStateV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  validateMainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  cloneLandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  MainWireIntegratedScientificSession,
  integratedLanePresentationTargetTimeSecV1,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  validateAcceptedComposedRhythmTransactionConfigurationV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import {
  createMainWireScientificSessionV1,
} from "@/engine/scientific/runtime";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

const STEP_COUNT = 120;
const INTEGRATED_PRESENTATION_STEP_COUNT = 500;
const DT_SEC = 0.002;

type TierRun = Readonly<{
  observationsSha256: string;
  diagnosticsSha256: string;
  checkpointSha256: string;
  finalState: unknown;
}>;

type IntegratedTierRun = Readonly<{
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

async function runIntegratedTierV3(
  tier: HotPathIntegrityTierV1,
): Promise<IntegratedTierRun> {
  const previous = hotPathIntegrityTierV1();
  selectHotPathIntegrityTierV1(tier);
  try {
    const session = await MainWireIntegratedScientificSession.create();
    const observations: unknown[] = [];
    const diagnostics: unknown[] = [];
    for (
      let ordinal = 1;
      ordinal <= INTEGRATED_PRESENTATION_STEP_COUNT;
      ordinal += 1
    ) {
      const advanced = session.advanceToPresentationTime(
        integratedLanePresentationTargetTimeSecV1(ordinal),
      );
      if (advanced.status !== "advanced") {
        throw new Error(
          `${tier} integrated run failed at ordinal ${ordinal}: `
            + (advanced.status === "failed"
              ? advanced.message
              : advanced.status),
        );
      }
      observations.push(plainDataProjection(advanced.observation));
      const acceptedStep = advanced.observation.lastAcceptedStep;
      if (acceptedStep === null) {
        throw new Error(`${tier} integrated run omitted its accepted step`);
      }
      diagnostics.push(plainDataProjection({
        candidateTimeLimit: acceptedStep.candidateTimeLimit,
        circulation:
          acceptedStep.coronaryStep.baseStep.circulationTrial.diagnostics,
        coronary:
          acceptedStep.coronaryStep.baseStep.coronaryTrial.diagnostics,
        dynamicMechanicalSupport:
          acceptedStep.dynamicMechanicalSupportTrial,
      }));
    }
    const checkpoint = await session.checkpointOperational();
    return Object.freeze({
      observationsSha256: await sha256CanonicalJsonHex(observations),
      diagnosticsSha256: await sha256CanonicalJsonHex(diagnostics),
      checkpointSha256: checkpoint.checkpointSha256,
      finalState: session.currentAcceptedState(),
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

  it("keeps malformed caller-supplied rhythm configuration validation in lean", () => {
    const fixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const malformed = Object.freeze({
      ...fixture.rhythm.configuration,
      configurationId: "",
    });

    selectHotPathIntegrityTierV1("hot-path-lean");
    try {
      expect(() =>
        validateAcceptedComposedRhythmTransactionConfigurationV2(malformed))
        .toThrow(/configurationId/);
    } finally {
      selectHotPathIntegrityTierV1("full-invariant");
    }
  });

  it("keeps unstamped accepted-state boundaries complete in lean", () => {
    const fixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const accepted = fixture.cold.acceptedState;
    const dynamicClone = Object.freeze({
      ...accepted.dynamicMechanicalSupport,
    });
    const autoregulationClone = Object.freeze({
      ...accepted.coronary.coronaryAutoregulation,
      acceptedDurationSec: Number.NaN,
    });
    const integratedClone = Object.freeze({
      ...accepted,
      acceptedTimeSec: accepted.acceptedTimeSec + 0.001,
    });

    selectHotPathIntegrityTierV1("hot-path-lean");
    try {
      expect(() => validateDynamicMechanicalSupportAcceptedStateV1(
        dynamicClone,
        fixture.profile,
        fixture.config,
      )).toThrow(/live factory provenance/);
      expect(() => validateCoronaryAcceptedAutoregulationStateV3(
        accepted.coronary.coronaryAutoregulationBinding,
        autoregulationClone,
      )).toThrow(/acceptedDurationSec/);
      expect(() => validateMainWireIntegratedModelAcceptedStateV3(
        integratedClone,
        { configuration: fixture.rhythm.configuration },
        fixture.profile,
        fixture.config,
      )).toThrow(/owner clocks differ/);
    } finally {
      selectHotPathIntegrityTierV1("full-invariant");
    }
  });

  it("limits persistent proof caches to actually immutable plain-data graphs", () => {
    const fixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const accepted = fixture.cold.acceptedState;

    for (const cachedGraph of [
      fixture.rhythm.configuration,
      accepted.composedRhythm,
      fixture.profile,
      fixture.config,
      accepted.dynamicMechanicalSupport,
      accepted.coronary.coronaryAutoregulationBinding,
      accepted.coronary.coronaryAutoregulation,
    ]) {
      expect(isTransitivelyFrozenPlainData(cachedGraph)).toBe(true);
    }
    expect(isTransitivelyFrozenPlainData(
      accepted.coronary.mechanics.materialState,
    )).toBe(false);
    expect(Object.isFrozen(
      accepted.coronary.mechanics.materialState.wallStateByWall.LA.landState,
    )).toBe(false);
  });

  it("rejects a mutated published accepted material state in both tiers", async () => {
    const attack = async (tier: HotPathIntegrityTierV1) => {
      selectHotPathIntegrityTierV1(tier);
      const session = await MainWireIntegratedScientificSession.create();
      session.currentAcceptedState().coronary.mechanics.materialState
        .wallStateByWall.LA.landState[0] += 1;
      return session.advanceToPresentationTime(
        integratedLanePresentationTargetTimeSecV1(1),
      );
    };

    try {
      const full = await attack("full-invariant");
      const lean = await attack("hot-path-lean");
      for (const result of [full, lean]) {
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

  it("produces bit-identical integrated V3 observations, diagnostics, and checkpoint", async () => {
    const full = await runIntegratedTierV3("full-invariant");
    const lean = await runIntegratedTierV3("hot-path-lean");

    expect(lean.observationsSha256).toBe(full.observationsSha256);
    expect(lean.diagnosticsSha256).toBe(full.diagnosticsSha256);
    expect(lean.checkpointSha256).toBe(full.checkpointSha256);
    expect(lean.finalState).toEqual(full.finalState);
    expect(hotPathIntegrityTierV1()).toBe("full-invariant");
  }, 60_000);
});

function plainDataProjection(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) throw new Error("integrated tier pin contains a cycle");
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
    projected = value.map((child) => plainDataProjection(child, seen));
  } else {
    projected = Object.fromEntries(Object.keys(value).map((key) => [
      key,
      plainDataProjection((value as Record<string, unknown>)[key], seen),
    ]));
  }
  seen.delete(value);
  return projected;
}

function isTransitivelyFrozenPlainData(
  value: unknown,
  seen = new WeakSet<object>(),
): boolean {
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  if (!Object.isFrozen(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (
    prototype !== null
    && prototype !== Object.prototype
    && prototype !== Array.prototype
  ) return false;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || !isTransitivelyFrozenPlainData(descriptor.value, seen)
    ) return false;
  }
  return true;
}
