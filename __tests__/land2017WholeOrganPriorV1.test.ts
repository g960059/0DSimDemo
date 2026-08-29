import { describe, expect, it } from "vitest";

import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1_ID,
  LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1,
  LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1_ID,
  land2017ParameterSetHashInput,
  stableHash,
} from "@/engine/myocardium/myofilament/land2017";
import {
  measureMainWireVentricularLandSourceVelocityProtocolAuditV2,
} from "@/analysis/methods/mainWire/MainWireVentricularLandSourceVelocityProtocolAuditV2";

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

  it("keeps the skinned-human source column distinct and passes its velocity shortlist", () => {
    const skinned = LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1;
    expect(skinned.parameterSetId)
      .toBe(LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1_ID);
    expect(skinned.values).toMatchObject({
      CaT50Ref: 2.5,
      nTm: 2.2,
      kuw: 26,
      kws: 4,
      Aeff: 25,
      Tref: 40_500,
    });
    expect(skinned.parameterSetStableHash).toBe("8de7ae0c");
    expect(skinned.parameterSetStableHash)
      .toBe(stableHash(land2017ParameterSetHashInput(skinned)));
    expect(skinned.parameterSetStableHash)
      .not.toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET
        .parameterSetStableHash);

    const audit =
      measureMainWireVentricularLandSourceVelocityProtocolAuditV2(
        skinned,
        { dtSec: 0.0005 },
      );
    expect(audit.sourceConstantVelocityCost).toBeCloseTo(
      13.298190497738213,
      10,
    );
    expect(audit.passesSourceConstantVelocityShortlistThreshold).toBe(true);
    expect(audit.constantVelocityShortening).toHaveLength(3);
    expect(audit.claim.passiveForceIncludedInSourceQuickStretchFitButExcludedHere)
      .toBe(true);
  });
});
