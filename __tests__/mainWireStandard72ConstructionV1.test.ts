import { describe, expect, it } from "vitest";
import { buildNodes } from "@/engine/core/topology";
import { vascularPvLawFromNodeV1 } from "@/engine/core/circulationGraphKernelV1";
import { complianceFromPtm, ptmFromStressedVolume, stressedVolumeFromPtm } from "@/engine/vascularPv";
import { MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1 as selected } from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as createFixture,
  MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemodynamics,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanism } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";

describe("Standard72 fixed physical construction", () => {
  it("leaves all source vascular laws identical at unit scale", () => {
    for (const node of buildNodes().filter(n => n.kind !== "heartActive")) {
      expect(vascularPvLawFromNodeV1(node, { ...hemodynamics, systemicArterialComplianceResearchScale: 1 }))
        .toEqual(vascularPvLawFromNodeV1(node, hemodynamics));
    }
  });

  it("scales only systemic arterial storage and preserves the constitutive inverse", () => {
    for (const node of buildNodes().filter(n => n.kind !== "heartActive")) {
      const source = vascularPvLawFromNodeV1(node, hemodynamics);
      const actual = vascularPvLawFromNodeV1(node, { ...hemodynamics, systemicArterialComplianceResearchScale: .65 });
      if (!["Ao", "SA", "Art"].includes(node.name)) { expect(actual).toEqual(source); continue; }
      expect(actual.Vu).toBe(source.Vu);
      for (const pressure of [60, 90, 120]) {
        expect(complianceFromPtm(actual, pressure)).toBeCloseTo(complianceFromPtm(source, pressure) * .65, 12);
        expect(stressedVolumeFromPtm(actual, pressure)).toBeCloseTo(stressedVolumeFromPtm(source, pressure) * .65, 12);
        expect(ptmFromStressedVolume(actual, stressedVolumeFromPtm(actual, pressure))).toBeCloseTo(pressure, 10);
      }
    }
  });

  it("rejects invalid storage scales and a competing selected-aortic construction", () => {
    const node = buildNodes().find(n => n.name === "Ao")!;
    for (const scale of [0, -1, NaN, Infinity]) {
      expect(() => vascularPvLawFromNodeV1(node, { ...hemodynamics, systemicArterialComplianceResearchScale: scale })).toThrow();
    }
    expect(() => vascularPvLawFromNodeV1(node, { ...hemodynamics, systemicArterialComplianceResearchScale: .65,
      selectedAorticOutflowProfile: selected })).toThrow(/compatibility/);
  });

  it("retains contractility headroom while keeping the qualified calcium law fixed", () => {
    const baseline = createFixture(), increased = createFixture(hemodynamics, 1.1);
    expect(increased.provider.parameterIdentityHash).not.toBe(baseline.provider.parameterIdentityHash);
    expect(increased.rhythm).toEqual(baseline.rhythm);
    expect(() => createFixture(hemodynamics, 1, { ...mechanism,
      chamberMechanics: { ...mechanism.chamberMechanics,
        calciumDecayTimeScaleByWall: { ...mechanism.chamberMechanics.calciumDecayTimeScaleByWall, LVFW: 1.1 } } }))
      .toThrow(/fixed calcium law/);
  });
});
