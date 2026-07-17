import { describe, expect, it } from "vitest";

import {
  LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1,
  LAND2017_HUMAN_ATRIAL_LITERATURE_PRIOR_V1,
} from "@/engine/myocardium/myofilament/land2017/atrialPrior";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from
  "@/engine/myocardium/myofilament/land2017/parameterSets";

describe("Land 2017 human atrial literature prior", () => {
  it("keeps the ventricular source immutable and records only the literature overrides", () => {
    const atrial = LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1;
    const ventricular = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    expect(atrial.values.CaT50Ref).toBe(0.86);
    expect(atrial.values.kws).toBe(3 * ventricular.values.kws);
    expect(ventricular.values.CaT50Ref).toBe(0.805);
    expect(ventricular.values.kws).toBe(12);
    expect(atrial.parameterSetStableHash).not.toBe(
      ventricular.parameterSetStableHash,
    );
    expect(LAND2017_HUMAN_ATRIAL_LITERATURE_PRIOR_V1.shapeFitIncluded)
      .toBe(false);
  });

  it("recomputes dependent Land rates from the overridden source parameters", () => {
    const atrial = LAND2017_HUMAN_ATRIAL_EFFECTIVE_PARAMETER_SET_V1;
    const ventricular = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    expect(atrial.derived.ksu / ventricular.derived.ksu).toBeCloseTo(3, 14);
    expect(atrial.derived.cs / ventricular.derived.cs).toBeCloseTo(3, 14);
  });
});
