import { describe, expect, it } from "vitest";

import {
  createMainWireAorticOutflowComponentFactorialResearchProfileV1,
  mainWireAorticOutflowComponentUsesStandard66V1,
  validateMainWireAorticOutflowComponentFactorialResearchProfileV1,
} from "@/engine/core/MainWireAorticOutflowComponentFactorialResearchProfileV1";
import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  buildAuthoritativeCirculationGraphV1,
  vascularPvLawFromNodeV1,
  type VascularPvRuntimeParameterViewV1,
} from "@/engine/core/circulationGraphKernelV1";

const all65 = createMainWireAorticOutflowComponentFactorialResearchProfileV1({
  valvePressureStationAndResistancePlacement: "standard65",
  systemicArterialPvLaw: "standard65",
  aorticRootInertance: "standard65",
});
const all66 = createMainWireAorticOutflowComponentFactorialResearchProfileV1({
  valvePressureStationAndResistancePlacement: "standard66",
  systemicArterialPvLaw: "standard66",
  aorticRootInertance: "standard66",
});

describe("aortic outflow component factorial research profile V1", () => {
  it("owns three fixed binary research components and rejects fitting semantics", () => {
    expect(validateMainWireAorticOutflowComponentFactorialResearchProfileV1(
      all65,
    )).toEqual([]);
    expect(Object.keys(all65).sort()).toEqual([
      "aorticRootInertance",
      "parameterSearchOrFitting",
      "profileId",
      "systemicArterialPvLaw",
      "totalProximalResistanceConserved",
      "valvePressureStationAndResistancePlacement",
    ]);
    expect(all65.totalProximalResistanceConserved).toBe(true);
    expect(all65.parameterSearchOrFitting).toBe(false);
    expect(() => createMainWireAorticOutflowComponentFactorialResearchProfileV1({
      ...all65,
    } as never)).toThrow(/keys are invalid/);
  });

  it("treats an absent research profile as the bit-compatible all-66 selection", () => {
    for (const component of [
      "valvePressureStationAndResistancePlacement",
      "systemicArterialPvLaw",
      "aorticRootInertance",
    ] as const) {
      expect(mainWireAorticOutflowComponentUsesStandard66V1(
        undefined,
        component,
      )).toBe(true);
      expect(mainWireAorticOutflowComponentUsesStandard66V1(
        all66,
        component,
      )).toBe(true);
      expect(mainWireAorticOutflowComponentUsesStandard66V1(
        all65,
        component,
      )).toBe(false);
    }
  });

  it("isolates the systemic arterial PV-law level without changing the selected profile", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const ao = graph.nodes[graph.nodeIndex.get("Ao")!]!;
    const base = Object.freeze({
      venousTone: 0.15,
      arterialStiffness: 0.75,
    }) satisfies VascularPvRuntimeParameterViewV1;
    const selected = Object.freeze({
      ...base,
      selectedAorticOutflowProfile:
        MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
    }) satisfies VascularPvRuntimeParameterViewV1;
    const selectedAll65 = Object.freeze({
      ...selected,
      aorticOutflowComponentFactorialResearchProfile: all65,
    }) satisfies VascularPvRuntimeParameterViewV1;
    const selectedAll66 = Object.freeze({
      ...selected,
      aorticOutflowComponentFactorialResearchProfile: all66,
    }) satisfies VascularPvRuntimeParameterViewV1;

    expect(vascularPvLawFromNodeV1(ao, selectedAll65))
      .toEqual(vascularPvLawFromNodeV1(ao, base));
    expect(vascularPvLawFromNodeV1(ao, selectedAll66))
      .toEqual(vascularPvLawFromNodeV1(ao, selected));
  });
});
