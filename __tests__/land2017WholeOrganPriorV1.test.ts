import { describe, expect, it } from "vitest";

import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1_ID,
  land2017ParameterSetHashInput,
  stableHash,
} from "@/engine/myocardium/myofilament/land2017";

describe("Land 2017 whole-organ source prior V1", () => {
  it("changes only the explicitly published whole-organ Tref column", () => {
    const cellular = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    const wholeOrgan = LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1;

    expect(wholeOrgan.parameterSetId)
      .toBe(LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1_ID);
    expect(wholeOrgan.values.Tref).toBe(120_000);
    expect(cellular.values.Tref).toBe(40_500);
    for (const name of Object.keys(cellular.values) as Array<keyof typeof cellular.values>) {
      if (name !== "Tref") expect(wholeOrgan.values[name]).toBe(cellular.values[name]);
    }
    expect(wholeOrgan.derived).toEqual(cellular.derived);
    expect(wholeOrgan.sourceParameters.find((entry) => entry.parameter === "Tref"))
      .toMatchObject({
        original: { value: 120, unit: "kPa" },
        runtime: { value: 120_000, unit: "Pa" },
        location: expect.stringMatching(/whole-organ model column/),
      });
  });

  it("has a stable identity distinct from the cellular parameter set", () => {
    const wholeOrgan = LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1;
    expect(wholeOrgan.parameterSetStableHash)
      .toBe(stableHash(land2017ParameterSetHashInput(wholeOrgan)));
    expect(wholeOrgan.parameterSetStableHash)
      .not.toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.parameterSetStableHash);
    expect(Object.isFrozen(wholeOrgan)).toBe(true);
    expect(Object.isFrozen(wholeOrgan.values)).toBe(true);
  });
});
