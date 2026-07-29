import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3,
  limitMainWireIntegratedModelCandidateTimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  AcceptedComposedRhythmTransactionConfigurationV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";

describe("integrated V3 accepted-state validation stamp", () => {
  it("reuses only the exact frozen context triple and rejects configuration B", () => {
    const fixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const state = fixture.cold.acceptedState;
    let configurationPropertyReadCount = 0;
    const observedConfiguration = new Proxy(
      fixture.rhythm.configuration,
      {
        get(target, property, receiver) {
          configurationPropertyReadCount += 1;
          return Reflect.get(target, property, receiver);
        },
      },
    );
    const limitWithConfiguration = (
      configuration: AcceptedComposedRhythmTransactionConfigurationV2,
    ) => limitMainWireIntegratedModelCandidateTimeV3(
      state,
      0.0005,
      {
        configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );

    expect(limitWithConfiguration(observedConfiguration).candidateTimeSec)
      .toBe(0.0005);
    const readsAfterFullValidation = configurationPropertyReadCount;
    expect(readsAfterFullValidation).toBeGreaterThan(0);
    expect(limitWithConfiguration(observedConfiguration).candidateTimeSec)
      .toBe(0.0005);
    expect(configurationPropertyReadCount).toBe(readsAfterFullValidation);

    const configurationB = deepFreeze({
      ...fixture.rhythm.configuration,
      calciumParametersByWall: {
        ...fixture.rhythm.configuration.calciumParametersByWall,
        LVFW: {
          ...fixture.rhythm.configuration.calciumParametersByWall.LVFW,
          calciumGainUMPerUnitDrive:
            fixture.rhythm.configuration.calciumParametersByWall.LVFW
              .calciumGainUMPerUnitDrive + 0.125,
        },
      },
    }) as AcceptedComposedRhythmTransactionConfigurationV2;
    expect(configurationB.configurationId)
      .toBe(fixture.rhythm.configuration.configurationId);
    expect(() => limitWithConfiguration(configurationB))
      .toThrow(/rhythm configuration mismatch/);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3
        .acceptedTupleValidation,
    ).toBe(
      "once-per-internally-issued-state-and-exact-frozen-rhythm-profile-config-triple",
    );
  });
});

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
