import { describe, expect, it } from "vitest";

import {
  buildAtrialPopulationOnlyLandV1,
} from "@/engine/myocardium/fourChamberV1/land/atrialPopulationOnlyLandV1";
import {
  evaluateLandBackwardEulerDistortionEquivalenceV1,
  landDistortionEquivalenceParametersV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeDistortionEquivalenceV1";
import {
  buildAtrialHumanPriorLandEquationParametersV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";

describe("atrial population-only Land reduction", () => {
  it("changes only Aeff and its Aw/As derivatives", () => {
    const source = buildAtrialHumanPriorLandEquationParametersV1();
    const reduced = buildAtrialPopulationOnlyLandV1(source);

    expect(reduced.audit.changedPrimitiveParameters).toEqual(["Aeff"]);
    expect(reduced.audit.changedDerivedParameters).toEqual(["As", "Aw"]);
    expect(reduced.parameterSet.values.Aeff).toBe(0);
    expect(reduced.parameterSet.derived.Aw).toBe(0);
    expect(reduced.parameterSet.derived.As).toBe(0);
    expect(reduced.parameterSet.values.Tref).toBe(source.values.Tref);
    expect(reduced.audit.pvLoopMorphologyUsedForReduction).toBe(false);
  });

  it("admits the zero-distortion invariant manifold at changing stretch", () => {
    const reduced = buildAtrialPopulationOnlyLandV1(
      buildAtrialHumanPriorLandEquationParametersV1(),
    );
    const parameters = landDistortionEquivalenceParametersV1(
      reduced.parameterSet.derived,
    );
    const step = evaluateLandBackwardEulerDistortionEquivalenceV1(
      { w: 0, s: 0 },
      1.05,
      0.87,
      0.004,
      parameters,
    );

    expect(step.sourceZetaNext.w).toBe(0);
    expect(step.sourceZetaNext.s).toBe(0);
    expect(step.reconstructedZetaNext.w).toBe(0);
    expect(step.reconstructedZetaNext.s).toBe(0);
    expect(Math.max(...Object.values(step.sourceResidual).map(Math.abs)))
      .toBe(0);
  });
});
