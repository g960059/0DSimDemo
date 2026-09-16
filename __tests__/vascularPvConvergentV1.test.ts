import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { buildAuthoritativeCirculationGraphV1, vascularPvLawFromNodeV1 } from "@/engine/core/circulationGraphKernelV1";
import { ptmFromStressedVolume as oldInverse, stressedVolumeFromPtm, type VascularPvLaw } from "@/engine/vascularPvConstitutiveV1";
import { ptmFromStressedVolume as inverse, ptmAndVolumeTangentFromStressedVolume as paired,
  VenousPressureInverseConvergenceErrorV1 } from "@/engine/vascularPvConvergentV1";

const vc = Object.freeze({ kind: "venous3", Vu: 150.091, Ccoll: 5, Copen: 45, Cdist: 12,
  Popen: -1, Pstiff: 12, dOpen: 1, dStiff: 3 } as const);
function reference(law: VascularPvLaw, target: number): number {
  let lower = -20, upper = 45;
  for (let i = 0; i < 80; i++) {
    const mid = (lower + upper) / 2;
    if (stressedVolumeFromPtm(law, mid) < target) lower = mid;
    else upper = mid;
  }
  return (lower + upper) / 2;
}

describe("convergent venous pressure inverse", () => {
  it("solves the actual large-TBV-edit counterexamples without an unchecked midpoint", () => {
    for (const law of [vc, { ...vc }]) for (const physicalVolume of [169.43023662405744, 169.2976081900824, 169.22759941802735, 169.26784265322985]) {
      const target = physicalVolume - law.Vu;
      const result = inverse(law, target);
      expect(Math.abs(result - reference(law, target))).toBeLessThan(1e-9);
      expect(Math.abs(stressedVolumeFromPtm(law, result) - target)).toBeLessThan(1e-9);
      expect(paired(law, target).transmuralPressure).toBe(result);
    }
  });

  it("is monotonic and agrees with the forward law throughout the narrow failure region", () => {
    let previous = -Infinity;
    for (let i = 0; i <= 4000; i++) {
      const target = 10 + i * .005, pressure = inverse(vc, target);
      expect(pressure).toBeGreaterThan(previous);
      expect(Math.abs(stressedVolumeFromPtm(vc, pressure) - target)).toBeLessThan(1e-9);
      previous = pressure;
    }
  });

  it("checks all graph venous laws at three tones over the entire admitted pressure range", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const fingerprint = createHash("sha256"), encoded = Buffer.alloc(16);
    for (const venousTone of [0, .15, 1]) for (const node of graph.nodes) {
      if (node.kind !== "venousPressure") continue;
      const law = Object.freeze(vascularPvLawFromNodeV1(node, { venousTone, arterialStiffness: .75 }));
      let maxPressureError = 0, maxVolumeError = 0;
      for (let i = 0; i <= 6500; i++) {
        const pressure = -20 + i * .01, volume = stressedVolumeFromPtm(law, pressure);
        const result = inverse(law, volume);
        const tangent = paired(law, volume);
        expect(tangent.transmuralPressure).toBe(result);
        encoded.writeDoubleLE(result, 0); encoded.writeDoubleLE(tangent.dPtmDStressedVolume, 8);
        fingerprint.update(encoded); fingerprint.update(tangent.branch);
        maxPressureError = Math.max(maxPressureError, Math.abs(result - pressure));
        maxVolumeError = Math.max(maxVolumeError, Math.abs(stressedVolumeFromPtm(law, result) - volume));
      }
      expect(maxPressureError, `${node.name}, tone ${venousTone}`).toBeLessThan(2e-9);
      expect(maxVolumeError, `${node.name}, tone ${venousTone}`).toBeLessThan(2e-9);
    }
    // Captured before preparation caching: preserve all 97,515 primal values,
    // tangents and branches, not just a relaxed forward-law tolerance.
    expect(fingerprint.digest("hex")).toBe("8d018e8e119296b3525ec803ba06b8c43b1aaf440a47c8bc944e5289c7b5b061");
  });

  it("keeps immutable preparation numerically identical to uncached mutable laws", () => {
    const mutable = { ...vc };
    for (const volume of [-100, 0, 19.225, 100, 500, 2000]) {
      for (const options of [{}, { pressureToleranceMmHg: 1e-7 }, { stressedVolumeToleranceMl: 1e-7 }])
        expect(paired(vc, volume, options)).toEqual(paired(mutable, volume, options));
    }
    mutable.Copen = 50 as 45;
    expect(paired(Object.freeze({ ...mutable }), 19.225)).toEqual(paired(mutable, 19.225));
    expect(paired(mutable, 19.225)).not.toEqual(paired(vc, 19.225));
  });

  it("does not cache a frozen accessor or inherited coefficients", () => {
    let compliance = 5;
    const accessor = Object.freeze({ ...vc, get Ccoll() { return compliance; } });
    const inherited = Object.freeze(Object.create({ ...vc })) as typeof accessor;
    expect(paired(accessor, 19.225)).toEqual(paired(inherited, 19.225));
    compliance = 7;
    Object.getPrototypeOf(inherited).Ccoll = compliance;
    expect(paired(accessor, 19.225)).toEqual(paired({ ...vc, Ccoll: compliance }, 19.225));
    expect(paired(inherited, 19.225)).toEqual(paired(accessor, 19.225));
    compliance = -1;
    expect(() => paired(accessor, 19.225)).toThrow(RangeError);
  });

  it("returns a tangent consistent with the evaluated inverse near the failure and transitions", () => {
    for (const pressure of [-5, -1, 0, .53969, .54405, 1, 6, 12, 20]) {
      const target = stressedVolumeFromPtm(vc, pressure), h = 1e-4;
      const numerical = (inverse(vc, target + h) - inverse(vc, target - h)) / (2 * h);
      expect(Math.abs(paired(vc, target).dPtmDStressedVolume - numerical)).toBeLessThan(1e-7);
    }
  });

  it("keeps saturation, arterial, linear and explicit fixed-iteration semantics", () => {
    for (const [pressure, branch] of [[-20, "venous-lower-saturation"], [45, "venous-upper-saturation"]] as const) {
      const target = stressedVolumeFromPtm(vc, pressure);
      expect(paired(vc, target)).toEqual({ transmuralPressure: pressure, dPtmDStressedVolume: 0, branch });
      expect(inverse(vc, target + (pressure < 0 ? -100 : 100))).toBe(pressure);
    }
    for (const law of [{ kind: "arterial", Vu: 10, P0: 20, VsEff: 15 }, { kind: "linear", Vu: 10, C: 5 }] as const)
      for (const volume of [-50, 0, 20]) expect(inverse(law, volume)).toBe(oldInverse(law, volume));
    for (const target of [-10, 19.225, 500])
      expect(inverse(vc, target, { termination: "fixed-iterations", maxIterations: 32 }))
        .toBe(oldInverse(vc, target, { termination: "fixed-iterations", maxIterations: 32 }));
  });

  it("fails explicitly when its budget is exhausted, including the paired API", () => {
    expect(() => inverse(vc, 19.225, { maxIterations: 1 })).toThrow(VenousPressureInverseConvergenceErrorV1);
    expect(() => paired(vc, 19.225, { maxIterations: 1 })).toThrow(VenousPressureInverseConvergenceErrorV1);
    try { inverse(vc, 19.225, { maxIterations: 1 }); } catch (error) {
      expect(error).toBeInstanceOf(VenousPressureInverseConvergenceErrorV1);
      const d = (error as VenousPressureInverseConvergenceErrorV1).diagnostic;
      expect(d.iterations).toBe(1);
      expect(d.volumeResidualMl).toBe(stressedVolumeFromPtm(vc, d.pressureMmHg) - d.targetStressedVolumeMl);
    }
  });

  it("rejects nonfinite and invalid budgets, tolerances and laws", () => {
    for (const maxIterations of [0, -1, 1.5, NaN, Infinity]) expect(() => inverse(vc, 19, { maxIterations })).toThrow(RangeError);
    for (const value of [-1, NaN, Infinity]) {
      expect(() => inverse(vc, 19, { pressureToleranceMmHg: value })).toThrow(RangeError);
      expect(() => inverse(vc, 19, { stressedVolumeToleranceMl: value })).toThrow(RangeError);
    }
    for (const value of [NaN, Infinity, -Infinity]) expect(() => inverse(vc, value)).toThrow(RangeError);
    expect(() => inverse({ ...vc, Copen: 1 }, 19)).toThrow(RangeError);
    const mutable = { ...vc }; inverse(mutable, 19); mutable.Ccoll = -1 as 5;
    expect(() => inverse(mutable, 19)).toThrow(RangeError);
  });
});
