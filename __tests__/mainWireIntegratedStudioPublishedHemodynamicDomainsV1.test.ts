import { describe, expect, it } from "vitest";
import {
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { createCircleHeartExactModelReleaseV1 as standard69Release } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualifiedBaselineExactModelV1";
import { createCircleHeartExactModelReleaseV1 as standard70Release } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1";
import standard68Client from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionExactModelV1.client.json";
import standard69Client from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualifiedBaselineExactModelV1.client.json";
import standard70Client from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json";

import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1,
  createMainWireIntegratedStudioRoundedEjectionReleaseV1,
  createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";

describe("published hemodynamic input domains", () => {
  it("keeps Standard65-67 at their published stiffness ceiling", () => {
    const standard65 = createCircleHeartExactModelReleaseV1();
    const stiffnessControl = standard65.manifest.primitiveControlCatalog.find(
      ({ controlId }) => controlId === "hemodynamics.arterial-stiffness",
    );
    expect(stiffnessControl?.maximum).toBe(1);
    expect(standard65.manifest.fixtureSchema.definition).toMatchObject({
      hemodynamicResearchInputRanges: {
        arterialStiffness: { maximum: 1 },
      },
    });

    expectFixtureStiffnessRejectedV1(
      standard65,
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      1.01,
    );
    expectFixtureStiffnessRejectedV1(
      createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1(),
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
      1.01,
    );
    expectFixtureStiffnessRejectedV1(
      createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1(),
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
      1.01,
    );
  });

  it("preserves Standard68's admitted HR60 qualified baseline", () => {
    const standard68 = createMainWireIntegratedStudioRoundedEjectionReleaseV1();
    const stiffnessControl = standard68.manifest.primitiveControlCatalog.find(
      ({ controlId }) => controlId === "hemodynamics.arterial-stiffness",
    );
    expect(stiffnessControl).toMatchObject({
      defaultValue: 1.27,
      maximum: 1.5,
    });
    expect(
      MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1
        .hemodynamicResearchInputs.heartRateBpm,
    ).toBe(60);
    expect(() =>
      standard68.executables.fixtureAdapter.validateCompleteFixture({
        context: {
          modelId: standard68.manifest.modelId,
          scenarioId: "standard68/published-domain",
        },
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1,
      }),
    ).not.toThrow();
  });

  it("widens research only and preserves all Standard68-70 published manifests and guards", () => {
    const base = MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1;
    expect(MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3.arterialStiffness.maximum).toBe(2.2);
    expect(() => validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
      ...base.hemodynamicResearchInputs, arterialStiffness: 2.2,
    })).not.toThrow();
    expect(() => validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
      ...base.hemodynamicResearchInputs, arterialStiffness: 2.21,
    })).toThrow();
    for (const [release, descriptor] of [
      [createMainWireIntegratedStudioRoundedEjectionReleaseV1(), standard68Client],
      [standard69Release(), standard69Client],
      [standard70Release(), standard70Client],
    ] as const) {
      expect(release.manifest).toEqual(descriptor.manifest);
      for (const stiffness of [1.51, 2.2]) {
        expect(() => release.executables.fixtureAdapter.validateCompleteFixture({
          context: { modelId: release.manifest.modelId, scenarioId: "published-domain" },
          fixture: { ...base, hemodynamicResearchInputs: { ...base.hemodynamicResearchInputs,
            arterialStiffness: stiffness } },
        })).toThrow(/Standard68-70 arterialStiffness exceeds its published maximum/);
      }
    }
  });
});

function expectFixtureStiffnessRejectedV1(
  release: ReturnType<typeof createCircleHeartExactModelReleaseV1>,
  fixture:
    | typeof MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1
    | typeof MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  arterialStiffness: number,
): void {
  expect(() =>
    release.executables.fixtureAdapter.validateCompleteFixture({
      context: {
        modelId: release.manifest.modelId,
        scenarioId: "pre-standard68/published-domain",
      },
      fixture: {
        ...fixture,
        hemodynamicResearchInputs: {
          ...fixture.hemodynamicResearchInputs,
          arterialStiffness,
        },
      },
    }),
  ).toThrow(/pre-Standard68 arterialStiffness exceeds its published maximum/);
}
