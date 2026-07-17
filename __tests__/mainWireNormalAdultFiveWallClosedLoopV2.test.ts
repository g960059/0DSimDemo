import { describe, expect, it } from "vitest";

import {
  runMainWireNormalAdultFiveWallClosedLoopV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

describe("main-wire normal-adult five-wall closed loop V2", () => {
  it("defaults to healthy-slack on without changing the exact-off trace", () => {
    const healthy = runMainWireNormalAdultFiveWallClosedLoopV2({
      mode: "canonical",
      dtSec: 0.02,
      beatCount: 1,
    });
    const exactOff = runMainWireNormalAdultFiveWallClosedLoopV2({
      mode: "canonical",
      dtSec: 0.02,
      beatCount: 1,
      pericardiumMode: "exact-off",
    });

    expect(healthy).toMatchObject({
      experimentId: "main-wire-normal-adult-five-wall-closed-loop-v2",
      schemaVersion: 2,
      completed: true,
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      claim: {
        pericardialConstraintInterfaceIncluded: true,
        pericardialConstraintEnabled: true,
        parameterSearch: false,
      },
    });
    expect(exactOff).toMatchObject({
      completed: true,
      pericardiumMode: "exact-off",
      pericardiumCase: "healthy-slack",
      claim: { pericardialConstraintEnabled: false },
    });
    expect(healthy.samples).toEqual(exactOff.samples);
    expect(healthy.beatClosure).toEqual(exactOff.beatClosure);
  }, 60_000);

  it("rejects common-pericardium modes outside the fixed registry", () => {
    expect(() => runMainWireNormalAdultFiveWallClosedLoopV2({
      mode: "canonical",
      dtSec: 0.02,
      beatCount: 1,
      pericardiumMode: "bad" as never,
    })).toThrow("unsupported common pericardium mode");
  });
});
