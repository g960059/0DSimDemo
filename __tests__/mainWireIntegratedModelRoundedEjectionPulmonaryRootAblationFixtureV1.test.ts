import { describe, expect, it } from "vitest";

import {
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1";
import {
  MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
  createMainWirePulmonaryValveSeriesResistanceResearchInputV1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";

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

  it("marks an optional causal valve override in instance provenance", () => {
    const valveResearchInput =
      createMainWirePulmonaryValveSeriesResistanceResearchInputV1(
        MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
        0.0125,
      );
    const fixture =
      createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
        undefined,
        1,
        undefined,
        undefined,
        valveResearchInput,
      );

    expect(fixture.runtime.valveResearchInput).toBe(valveResearchInput);
    expect(fixture.roundedEjectionPulmonaryRootAblationAssemblyClaim)
      .toMatchObject({
        valveLawsChanged: true,
        parameterSearchOrFitting: true,
      });
  });
});
