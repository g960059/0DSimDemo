import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  calciumDriveEventFromElectricalV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  canonicalizeJson,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1,
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  generatePhaseB1ProjectSyntheticNormalSinusCycleEventsV1,
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
  phaseB1ProjectSyntheticNormalSinusEventScheduleHashPayloadV1,
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const EXPECTED_SCHEDULE_SHA256 =
  "341c9f3eee1df13cc4e5615741c9911ac8315191d3ce5fbd90611985b5ea8c50";

describe("Phase B1 project-synthetic normal-sinus event schedule", () => {
  const schedule =
    buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);

  it("is a recursively frozen, self-hashed candidate prior with explicit literature boundaries", () => {
    expect(validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      schedule,
      sha256,
    )).toBe(schedule);
    expect(schedule.contentSha256).toBe(EXPECTED_SCHEDULE_SHA256);
    expect(schedule.contentSha256).toBe(sha256(canonicalizeJson(
      phaseB1ProjectSyntheticNormalSinusEventScheduleHashPayloadV1(schedule),
    )));
    expectRecursivelyFrozen(schedule);
    expect(schedule).toMatchObject({
      status: "candidate-prior-project-reduction-not-physiological-acceptance",
      rhythm: "normal-sinus-project-synthetic",
      heartRateBpm: 75,
      cycleLengthSec: 0.8,
      intervalOwnership: {
        interval: "(start,end]",
        startBoundaryIncluded: false,
        endBoundaryIncluded: true,
      },
      literatureContext: {
        atrial: {
          doi: "10.3389/fphys.2017.00965",
          pmcId: "PMC5650557",
        },
        ventricular: {
          doi: "10.3389/fphys.2016.01337",
          pmcId: "PMC5225966",
        },
        valueDerivation:
          "project-reduction-not-direct-calibration-from-cited-literature",
      },
      claimBoundary: {
        candidatePrior: true,
        projectSynthetic: true,
        citedLiteratureIsContextOnly: true,
        valuesDirectlyCalibratedFromCitedLiterature: false,
        physiologicalAcceptanceClaimed: false,
        fullBeatAcceptanceClaimed: false,
        phaseB1AcceptanceClaimed: false,
        modelCoreOrBrowserRuntimeAdopted: false,
        releaseRuntimeReachable: false,
      },
    });
    for (const wallId of WALL_IDS) {
      expect(schedule.sourceBindings.timingByWall[wallId]
        .electricalToCalciumDelaySec).toBe(0.012);
    }
  });

  it("derives the ordered five-wall calcium times only through the manifest-owned delay", () => {
    expect(schedule.activationOrder).toEqual(
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1,
    );
    expect(schedule.events.map((event) => event.wallId)).toEqual([
      "RA",
      "LA",
      "SEP",
      "RVFW",
      "LVFW",
    ]);
    expect(schedule.events.map((event) =>
      event.electricalOffsetWithinCycleSec)).toEqual([
      0,
      0.030,
      0.160,
      0.170,
      0.180,
    ]);
    const expectedCalciumOffsets = [0.012, 0.042, 0.172, 0.182, 0.192];
    schedule.events.forEach((event, index) => {
      expect(event.calciumDriveOffsetWithinCycleSec)
        .toBeCloseTo(expectedCalciumOffsets[index], 15);
    });

    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const binding = buildPhaseB1WallMaterialBindingV1(bundle, sha256);
    for (const event of schedule.events) {
      const independentlyConverted = calciumDriveEventFromElectricalV1(
        event.electricalEvent,
        binding.runtimeByWall[event.wallId].prescribedCalciumParameters,
      );
      expect(event.calciumDriveEvent).toEqual({
        wallId: event.wallId,
        ...independentlyConverted,
      });
      expect(event.eventKey).toBe(
        `${event.wallId}:${independentlyConverted.eventId}`,
      );
    }
    expect(new Set(schedule.events.map((event) => event.eventKey)).size).toBe(5);
    expect(new Set(schedule.events.map((event) =>
      event.calciumDriveEvent.eventId)).size).toBe(5);
  });

  it("generates deterministic repeat cycles with globally unique event keys", () => {
    const cycleTwo = generatePhaseB1ProjectSyntheticNormalSinusCycleEventsV1(
      schedule,
      2,
      sha256,
    );
    expect(cycleTwo).toHaveLength(5);
    expect(cycleTwo.map((event) => event.wallId)).toEqual(
      schedule.events.map((event) => event.wallId),
    );
    for (let index = 0; index < cycleTwo.length; index += 1) {
      expect(cycleTwo[index].cycleIndex).toBe(2);
      expect(cycleTwo[index].electricalEvent.electricalTimeSec)
        .toBe(
          schedule.events[index].electricalOffsetWithinCycleSec + 1.6,
        );
      expect(cycleTwo[index].calciumDriveEvent.calciumDriveTimeSec)
        .toBe(
          schedule.events[index].calciumDriveOffsetWithinCycleSec + 1.6,
        );
      expect(cycleTwo[index].calciumDriveOffsetWithinCycleSec)
        .toBe(schedule.events[index].calciumDriveOffsetWithinCycleSec);
      expect(cycleTwo[index].eventKey).toContain(":cycle-2:");
    }
    const allKeys = [
      ...schedule.events.map((event) => event.eventKey),
      ...cycleTwo.map((event) => event.eventKey),
    ];
    expect(new Set(allKeys).size).toBe(10);
    expectRecursivelyFrozen(cycleTwo);
  });

  it("owns repeated events on the exact right-continuous (start,end] interval", () => {
    const firstTime = schedule.events[0].calciumDriveEvent.calciumDriveTimeSec;
    const secondTime = schedule.events[1].calciumDriveEvent.calciumDriveTimeSec;
    expect(generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      0,
      firstTime,
      sha256,
    ).map((event) => event.wallId)).toEqual(["RA"]);
    expect(generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      firstTime,
      secondTime,
      sha256,
    ).map((event) => event.wallId)).toEqual(["LA"]);
    expect(generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      0,
      0.8,
      sha256,
    )).toHaveLength(5);

    const cycleOne = generatePhaseB1ProjectSyntheticNormalSinusCycleEventsV1(
      schedule,
      1,
      sha256,
    );
    const cycleOneFirstTime =
      cycleOne[0].calciumDriveEvent.calciumDriveTimeSec;
    expect(generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      0.8,
      cycleOneFirstTime,
      sha256,
    ).map((event) => event.eventKey)).toEqual([cycleOne[0].eventKey]);
    expect(generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      cycleOneFirstTime,
      cycleOneFirstTime,
      sha256,
    )).toEqual([]);

    const cycleOneHundred =
      generatePhaseB1ProjectSyntheticNormalSinusCycleEventsV1(
        schedule,
        100,
        sha256,
      );
    const lateEnd = 100 * schedule.cycleLengthSec
      + schedule.events[4].calciumDriveOffsetWithinCycleSec;
    expect(cycleOneHundred[4].calciumDriveEvent.calciumDriveTimeSec)
      .toBe(lateEnd);
    expect(generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      100 * schedule.cycleLengthSec,
      lateEnd,
      sha256,
    ).map((event) => event.eventKey)).toEqual(
      cycleOneHundred.map((event) => event.eventKey),
    );
  });

  it("rejects unfrozen, schema-widened, duplicate-key, and hash-mutated schedules", () => {
    expect(() => validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      structuredClone(schedule),
      sha256,
    )).toThrow(/recursively frozen/);

    const widened = structuredClone(schedule) as Record<string, unknown>;
    widened.unownedTimingGain = 1;
    expect(() => validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      deepFreeze(widened),
      sha256,
    )).toThrow(/must contain exactly/);

    const duplicated = structuredClone(schedule);
    (duplicated.events[1] as { eventKey: string }).eventKey =
      duplicated.events[0].eventKey;
    expect(() => validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      deepFreeze(duplicated),
      sha256,
    )).toThrow(/duplicate eventKey/);

    const wrongHash = structuredClone(schedule);
    (wrongHash as { contentSha256: string }).contentSha256 = "0".repeat(64);
    expect(() => validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      deepFreeze(wrongHash),
      sha256,
    )).toThrow(/does not match/);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function expectRecursivelyFrozen(
  value: unknown,
  seen = new WeakSet<object>(),
): void {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    expectRecursivelyFrozen(child, seen);
  }
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
}
