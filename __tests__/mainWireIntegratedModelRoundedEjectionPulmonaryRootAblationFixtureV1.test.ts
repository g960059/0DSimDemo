import { describe, expect, it } from "vitest";

import {
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1";

describe("rounded-ejection pulmonary-root research fixture", () => {
  it("keeps the fixed-profile provenance claim narrow", () => {
    const fixture =
      createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1();

    expect(fixture.roundedEjectionPulmonaryRootAblationAssemblyClaim)
      .toMatchObject({
        sourcePulmonaryResistanceQuadraticLossAndCompliancePreserved: true,
        parameterSearchOrFitting: false,
      });
  });

  it("does not inherit source-preservation claims for fitted profiles", () => {
    const profile =
      createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
        0.024,
        0,
        {
          proximalPaStiffnessMultiplier: 0.75,
          distalPArtStiffnessMultiplier: 1.25,
        },
      );
    const fixture =
      createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
        undefined,
        1,
        undefined,
        profile,
      );

    expect(fixture.roundedEjectionPulmonaryRootAblationAssemblyClaim)
      .toMatchObject({
        sourcePulmonaryResistanceQuadraticLossAndCompliancePreserved: false,
        parameterSearchOrFitting: true,
      });
  });
});
