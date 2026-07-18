import { describe, expect, it } from "vitest";

import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
  assembleScientificWorkbenchResearchTerminalCycleV1,
  assembleScientificWorkbenchTerminalCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchTerminalCycleV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import type { SimulationReleaseRef } from "@/engine/scientific/release";

const RELEASE = Object.freeze({
  id: "circleheart-main-wire-adult-five-wall-noncoronary",
  version: "0.2.0",
  sha256: "1".repeat(64),
}) satisfies SimulationReleaseRef;

describe("scientific workbench terminal cycle V1", () => {
  it("retains both P1 boundaries and all accepted steps without resampling", () => {
    const boundary = frame(2_000, 12, "exact-checkpoint-restore");
    const accepted = completeAcceptedCycle();

    const cycle = assembleScientificWorkbenchTerminalCycleV1(
      boundary,
      accepted,
    );

    expect(cycle.frames).toHaveLength(501);
    expect(cycle.frames[0]).toBe(boundary);
    expect(cycle.frames.at(-1)).toBe(accepted.at(-1));
    expect(cycle.durationSec).toBeCloseTo(1, 12);
    expect(cycle.evidence).toEqual({
      startsAtExactCheckpointRestore: true,
      subsequentFramesAreAcceptedSteps: true,
      exactReleaseRefUniform: true,
      revisionsContiguous: true,
      cadenceUniform: true,
      bothCycleBoundariesRetained: true,
      smoothingOrInterpolationApplied: false,
    });
  });

  it("keeps a research P1 boundary distinct from an exact checkpoint restore", () => {
    const boundary = frame(2_000, 12, "accepted-step");
    const cycle = assembleScientificWorkbenchResearchTerminalCycleV1(
      boundary,
      completeAcceptedCycle(),
    );

    expect(cycle.frames).toHaveLength(501);
    expect(cycle.frames[0]).toBe(boundary);
    expect(cycle.durationSec).toBeCloseTo(1, 12);
    expect(cycle.evidence).toEqual({
      startsAtAcceptedPeriod1Boundary: true,
      subsequentFramesAreAcceptedSteps: true,
      exactReleaseRefUniform: true,
      revisionsContiguous: true,
      cadenceUniform: true,
      bothCycleBoundariesRetained: true,
      smoothingOrInterpolationApplied: false,
    });
    expect(() => assembleScientificWorkbenchResearchTerminalCycleV1(
      frame(2_000, 12, "exact-checkpoint-restore"),
      completeAcceptedCycle(),
    )).toThrow(/accepted P1 boundary/);
  });

  it.each([
    {
      name: "a non-checkpoint boundary",
      boundary: frame(2_000, 12, "accepted-step"),
      mutate: (frames: MainWireScientificObservableFrameV1[]) => frames,
      message: /exact V3 checkpoint restore boundary/,
    },
    {
      name: "a missing accepted step",
      boundary: frame(2_000, 12, "exact-checkpoint-restore"),
      mutate: (frames: MainWireScientificObservableFrameV1[]) => frames.slice(1),
      message: /expected 500 accepted-step frames/,
    },
    {
      name: "a revision discontinuity",
      boundary: frame(2_000, 12, "exact-checkpoint-restore"),
      mutate: (frames: MainWireScientificObservableFrameV1[]) => [
        { ...frames[0]!, revision: 9_999 },
        ...frames.slice(1),
      ],
      message: /revision-contiguous/,
    },
    {
      name: "a cadence discontinuity",
      boundary: frame(2_000, 12, "exact-checkpoint-restore"),
      mutate: (frames: MainWireScientificObservableFrameV1[]) => [
        { ...frames[0]!, acceptedTimeSec: frames[0]!.acceptedTimeSec + 0.001 },
        ...frames.slice(1),
      ],
      message: /fixed 2 ms cadence/,
    },
    {
      name: "a release discontinuity",
      boundary: frame(2_000, 12, "exact-checkpoint-restore"),
      mutate: (frames: MainWireScientificObservableFrameV1[]) => [
        {
          ...frames[0]!,
          releaseRef: { ...RELEASE, sha256: "2".repeat(64) },
        },
        ...frames.slice(1),
      ],
      message: /different simulation release/,
    },
  ])("rejects $name", ({ boundary, mutate, message }) => {
    expect(() => assembleScientificWorkbenchTerminalCycleV1(
      boundary,
      mutate(completeAcceptedCycle()),
    )).toThrow(message);
  });
});

function completeAcceptedCycle(): MainWireScientificObservableFrameV1[] {
  return Array.from(
    { length: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.stepCount },
    (_, index) => frame(
      2_001 + index,
      12 + (index + 1) * SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
      "accepted-step",
    ),
  );
}

function frame(
  revision: number,
  acceptedTimeSec: number,
  source: MainWireScientificObservableFrameV1["source"],
): MainWireScientificObservableFrameV1 {
  return Object.freeze({
    frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    releaseRef: RELEASE,
    sourceObservationId: "main-wire-scientific-session-observation-v1",
    source,
    revision,
    acceptedTimeSec,
    values: Object.freeze(Object.fromEntries(
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map(({ observableId }) => [
        observableId,
        Object.freeze({
          observableId,
          value: 0,
          availability: "available" as const,
          quality: "authoritative-state" as const,
        }),
      ]),
    )) as MainWireScientificObservableFrameV1["values"],
  });
}
