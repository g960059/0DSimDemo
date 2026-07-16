import { describe, expect, it } from "vitest";

import {
  ATRIAL_ONE_FIBER_PASSIVE_CLAIM_V1,
  compileAtrialOneFiberPassiveV1,
  evaluateAtrialOneFiberPassiveV1,
  type AtrialOneFiberPassiveParamsV1,
} from "@/engine/myocardium/atria/atrialOneFiberPassiveV1";

const LA_PARAMS: AtrialOneFiberPassiveParamsV1 = {
  parameterSetId: "test-la-effective-one-fiber-passive-v1",
  atriumId: "LA",
  wallReferenceMaterialVolumeMl: 18,
  referenceCavityBloodVolumeMl: 55,
  centralTangentPa: 700,
  tensionScalePa: 700,
  tensionExponent: 14,
  compressionAdditionalTangentPa: 700,
  transitionWidthStrain: 0.001,
};

describe("AtrialOneFiberPassiveV1", () => {
  it("is work-conjugate to real cavity blood volume by finite differences", () => {
    const compiled = compileAtrialOneFiberPassiveV1(LA_PARAMS);
    const cavityVolumeMl = 72;
    const stepMl = 0.001;
    const center = evaluateAtrialOneFiberPassiveV1(cavityVolumeMl, compiled);
    const lower = evaluateAtrialOneFiberPassiveV1(cavityVolumeMl - stepMl, compiled);
    const upper = evaluateAtrialOneFiberPassiveV1(cavityVolumeMl + stepMl, compiled);
    const pressureFromEnergyPa = (upper.storedEnergyJ - lower.storedEnergyJ) /
      (2 * stepMl * 1e-6);
    expect(pressureFromEnergyPa).toBeCloseTo(center.transmuralPressurePa, 5);

    const strainDerivativeFiniteDifference =
      (upper.fiberLogStrain - lower.fiberLogStrain) / (2 * stepMl);
    expect(strainDerivativeFiniteDifference)
      .toBeCloseTo(center.dFiberLogStrainDCavityVolumePerMl, 9);
    expect(center.pressureFormula).toBe("V_wall*sigma*de/dV");
  });

  it("has zero stress and a strictly positive pressure tangent at reference volume", () => {
    const compiled = compileAtrialOneFiberPassiveV1(LA_PARAMS);
    const atReference = evaluateAtrialOneFiberPassiveV1(
      LA_PARAMS.referenceCavityBloodVolumeMl,
      compiled,
    );
    expect(atReference.fiberLogStrain).toBe(0);
    expect(atReference.equilibriumKirchhoffStressPa).toBe(0);
    expect(atReference.transmuralPressurePa).toBe(0);
    expect(atReference.dStressDFiberLogStrainPa)
      .toBeCloseTo(LA_PARAMS.centralTangentPa, 12);
    expect(atReference.dTransmuralPressureDCavityVolumePaPerMl)
      .toBeGreaterThan(0);

    const stepMl = 0.001;
    const lower = evaluateAtrialOneFiberPassiveV1(
      LA_PARAMS.referenceCavityBloodVolumeMl - stepMl,
      compiled,
    );
    const upper = evaluateAtrialOneFiberPassiveV1(
      LA_PARAMS.referenceCavityBloodVolumeMl + stepMl,
      compiled,
    );
    const pressureTangentFiniteDifference =
      (upper.transmuralPressurePa - lower.transmuralPressurePa) / (2 * stepMl);
    expect(pressureTangentFiniteDifference)
      .toBeCloseTo(atReference.dTransmuralPressureDCavityVolumePaPerMl, 5);
  });

  it("represents compression and tension without stress or pressure clamps", () => {
    const compiled = compileAtrialOneFiberPassiveV1(LA_PARAMS);
    const compressed = evaluateAtrialOneFiberPassiveV1(25, compiled);
    const stretched = evaluateAtrialOneFiberPassiveV1(90, compiled);
    expect(compressed.fiberLogStrain).toBeLessThan(0);
    expect(compressed.equilibriumKirchhoffStressPa).toBeLessThan(0);
    expect(compressed.transmuralPressurePa).toBeLessThan(0);
    expect(compressed.storedEnergyJ).toBeGreaterThan(0);
    expect(stretched.fiberLogStrain).toBeGreaterThan(0);
    expect(stretched.equilibriumKirchhoffStressPa).toBeGreaterThan(0);
    expect(stretched.transmuralPressurePa).toBeGreaterThan(0);
    expect(stretched.storedEnergyJ).toBeGreaterThan(0);
    expect(compressed.stressClipped).toBe(false);
    expect(compressed.pressureClipped).toBe(false);
  });

  it("owns no hidden blood volume or secondary atrial compartment", () => {
    const compiled = compileAtrialOneFiberPassiveV1(LA_PARAMS);
    const inputBloodVolumeMl = 64.25;
    const output = evaluateAtrialOneFiberPassiveV1(inputBloodVolumeMl, compiled);
    expect(output.cavityBloodVolumeMl).toBe(inputBloodVolumeMl);
    expect(output.hiddenBloodVolumeMl).toBe(0);
    expect(output.midwallEnclosedVolumeMl).toBe(
      inputBloodVolumeMl + 0.5 * LA_PARAMS.wallReferenceMaterialVolumeMl,
    );
    expect(output.claim).toBe(ATRIAL_ONE_FIBER_PASSIVE_CLAIM_V1);
    expect(output.claim.bloodVolumeOwner).toBe("main-wire-cavity-node");
    expect(output.claim.laaOrBodyCompartments).toBe(false);
    expect(output.claim.avpdTerms).toBe(false);
    expect(output.claim.phaseTerms).toBe(false);
  });

  it("provides a stable, complete parameter identity", () => {
    const mutableSource = { ...LA_PARAMS };
    const first = compileAtrialOneFiberPassiveV1(mutableSource);
    mutableSource.centralTangentPa = 999;
    expect(first.params.centralTangentPa).toBe(LA_PARAMS.centralTangentPa);
    expect(first.parameterSetId).toBe(LA_PARAMS.parameterSetId);
    expect(first.parameterIdentityHash).toMatch(/^[0-9a-f]{8}$/);
    const replay = compileAtrialOneFiberPassiveV1({ ...LA_PARAMS });
    expect(replay.parameterIdentityHash).toBe(first.parameterIdentityHash);
    const changed = compileAtrialOneFiberPassiveV1({
      ...LA_PARAMS,
      tensionScalePa: LA_PARAMS.tensionScalePa * 1.01,
    });
    expect(changed.parameterIdentityHash).not.toBe(first.parameterIdentityHash);
  });
});
