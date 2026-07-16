import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseFivePatchPhysiologyEnvelopeCliArgsV2,
  runFivePatchPhysiologyEnvelopeCliV2,
} from "@/tools/mechanics2/runFivePatchPhysiologyEnvelopeV2";

describe("five-patch physiology-envelope V2 CLI", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts only immutable phase selection, deterministic sharding, and output", () => {
    expect(parseFivePatchPhysiologyEnvelopeCliArgsV2([
      "--phase",
      "screening",
      "--shard",
      "3/8",
      "--output-dir",
      "relative-output",
    ])).toMatchObject({
      phase: "screening",
      shard: { shardIndex: 3, shardCount: 8 },
      planOnly: false,
    });
    expect(() => parseFivePatchPhysiologyEnvelopeCliArgsV2([
      "--phase",
      "screening",
      "--periodicity-tolerance",
      "0.1",
    ])).toThrow(/unknown argument/);
    expect(() => parseFivePatchPhysiologyEnvelopeCliArgsV2([
      "--phase",
      "screening",
      "--plan-only",
      "--output-dir",
      "x",
    ])).toThrow(/cannot be combined/);
  });

  it("prints the complete fixed full plan without executing a run", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    const results = runFivePatchPhysiologyEnvelopeCliV2([
      "--phase",
      "full",
      "--plan-only",
    ], {
      executeRun: vi.fn(() => {
        throw new Error("plan-only must not execute");
      }),
    });
    expect(results).toEqual([]);
    const payload = JSON.parse(String(write.mock.calls[0]![0]));
    expect(payload).toMatchObject({
      mode: "plan-only",
      phase: "full",
      completePlanRunCount: 232,
      shardPlanRunCount: 232,
    });
    expect(payload.requests).toHaveLength(232);
  });
});
