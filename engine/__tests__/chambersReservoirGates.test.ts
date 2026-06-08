import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { runScenario } from "@/engine/harness";

describe("ChamberModel reservoir gate integration", () => {
  it("AV-plane reservoir disabled gates are neutral against each other", () => {
    const strokeZero = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 0, reservoirBranchGain: 1 } } },
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialInertanceL: 0 } },
    });
    const gainZero = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 94, reservoirBranchGain: 0 } } },
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialInertanceL: 0 } },
    });
    expect(strokeZero.metrics).toEqual(gainZero.metrics);
    expect(strokeZero.health).toEqual(gainZero.health);
    expect(strokeZero.samples.at(-1)).toEqual(gainZero.samples.at(-1));
    expect(strokeZero.samples.at(-1)?.rLA).toBe(0);
  });

  it("PV ostial inertance nonpositive gates are neutral against each other", () => {
    const negative = runScenario({
      ...DEFAULT_PARAMS,
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialInertanceL: -1 } },
    });
    const explicitZero = runScenario({
      ...DEFAULT_PARAMS,
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialInertanceL: 0 } },
    });
    expect(explicitZero.metrics).toEqual(negative.metrics);
    expect(explicitZero.health).toEqual(negative.health);
    expect(explicitZero.samples.at(-1)).toEqual(negative.samples.at(-1));
  });

  it("PV ostial dynamic edge honors legacy R-only edge overrides", () => {
    const legacyR = runScenario({
      ...DEFAULT_PARAMS,
      edgeOverrides: { PVein_LA: { R: 0.0075 } },
    });
    const explicitOstialR = runScenario({
      ...DEFAULT_PARAMS,
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialResistanceR: 0.0075 } },
    });
    expect(legacyR.metrics).toEqual(explicitOstialR.metrics);
    expect(legacyR.health).toEqual(explicitOstialR.health);
    expect(legacyR.samples.at(-1)).toEqual(explicitOstialR.samples.at(-1));
  });
});
