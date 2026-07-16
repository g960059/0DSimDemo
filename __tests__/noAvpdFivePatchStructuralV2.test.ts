import { describe, expect, it } from "vitest";
import {
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1,
  initialNoAvpdFivePatchLandTriSegStateV1,
  stepNoAvpdFivePatchLandTriSegV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";
import {
  NO_AVPD_FIVE_PATCH_STRUCTURAL_ARM_IDS_V2,
  createNoAvpdFivePatchStructuralParamsV2,
  initialNoAvpdFivePatchStructuralStateV2,
  stepNoAvpdFivePatchStructuralV2,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchStructuralV2";

describe("NoAvpdFivePatchStructuralV2", () => {
  it("keeps legacy V1 separate and gives every V2 arm the same dynamic-valve background", () => {
    const arm = "single-wall__no-pericardium" as const;
    const base = createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");
    const legacyState = initialNoAvpdFivePatchLandTriSegStateV1(base);
    expect(legacyState.dynamicValveOpeningFractions01).toBeUndefined();
    const legacyOutput = stepNoAvpdFivePatchLandTriSegV1(
      legacyState,
      0.005,
      base,
    );
    expect(legacyOutput.accepted).toBe(true);

    const params = createNoAvpdFivePatchStructuralParamsV2(arm, base);
    expect(params).not.toBe(base);
    expect(params.structuralExtension?.dynamicValves).toBeDefined();
    const structuralState = initialNoAvpdFivePatchStructuralStateV2(
      arm,
      params,
    );
    expect(structuralState.dynamicValveOpeningFractions01).toEqual({
      mitral: 0,
      aortic: 0,
      tricuspid: 0,
      pulmonary: 0,
    });

    const commonDynamicValvePrior = JSON.stringify(
      params.structuralExtension!.dynamicValves,
    );
    for (const otherArm of NO_AVPD_FIVE_PATCH_STRUCTURAL_ARM_IDS_V2) {
      expect(JSON.stringify(
        createNoAvpdFivePatchStructuralParamsV2(otherArm, base)
          .structuralExtension!.dynamicValves,
      )).toBe(commonDynamicValvePrior);
    }
  });

  it("preserves aggregate LA wall and reference blood volumes in both LAA arms", () => {
    for (const arm of [
      "body-laa-parallel__no-pericardium",
      "body-laa-parallel__common-pericardium",
    ] as const) {
      const params = createNoAvpdFivePatchStructuralParamsV2(arm);
      const aggregate = params.atria.left.geometry;
      const parallel =
        params.structuralExtension!.leftAtrialParallelWall!;
      expect(
        parallel.body.geometry.wallVolumeMl +
          parallel.appendage.geometry.wallVolumeMl,
      ).toBe(aggregate.wallVolumeMl);
      expect(
        parallel.body.geometry.referenceCavityVolumeMl +
          parallel.appendage.geometry.referenceCavityVolumeMl,
      ).toBe(aggregate.referenceCavityVolumeMl);
    }
  });

  it("fails closed if the accepted valve-state topology is removed", () => {
    const arm = "single-wall__no-pericardium" as const;
    const params = createNoAvpdFivePatchStructuralParamsV2(arm);
    const state = initialNoAvpdFivePatchStructuralStateV2(arm, params);
    const malformed = {
      ...state,
      dynamicValveOpeningFractions01: undefined,
    };
    expect(() => stepNoAvpdFivePatchStructuralV2(
      arm,
      malformed,
      0.005,
      params,
    )).toThrow("dynamic-valve topology changed");
  });

  it("fails closed if an arm label and supplied structural topology disagree", () => {
    const params = createNoAvpdFivePatchStructuralParamsV2(
      "single-wall__no-pericardium",
    );
    expect(() => initialNoAvpdFivePatchStructuralStateV2(
      "body-laa-parallel__no-pericardium",
      params,
    )).toThrow("does not match supplied LAA/pericardium topology");
  });

  it("uses the dynamic valve smoothing owner in the analytic flow column", () => {
    const arm = "single-wall__no-pericardium" as const;
    const base = createNoAvpdFivePatchStructuralParamsV2(arm);
    const dynamic = base.structuralExtension!.dynamicValves!;
    const params = {
      ...base,
      structuralExtension: {
        ...base.structuralExtension!,
        dynamicValves: {
          ...dynamic,
          mitral: {
            ...dynamic.mitral,
            flowSmoothingMlPerSec: 50,
          },
        },
      },
    };
    const state = initialNoAvpdFivePatchStructuralStateV2(arm, params);
    const unknowns = [
      ...Object.values(state.volumes),
      40,
      state.flows.aorticValve.qMlPerSec,
      state.flows.tricuspidValve.qMlPerSec,
      state.flows.pulmonaryValve.qMlPerSec,
      state.flows.pulmonaryVenousFlowMlPerSec,
      state.flows.systemicVenousFlowMlPerSec,
    ];
    const at = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
      state,
      unknowns,
      0.005,
      8,
      params,
    )!;
    const h = 1e-5;
    const plusUnknowns = [...unknowns];
    const minusUnknowns = [...unknowns];
    plusUnknowns[8] += h;
    minusUnknowns[8] -= h;
    const plus = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
      state,
      plusUnknowns,
      0.005,
      8,
      params,
    )!;
    const minus = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
      state,
      minusUnknowns,
      0.005,
      8,
      params,
    )!;
    const finiteDifference =
      (plus.residuals[8]! - minus.residuals[8]!) / (2 * h);
    expect(at.analyticJacobianColumn![8]).toBeCloseTo(
      finiteDifference,
      6,
    );
  });

  it("advances all four fixed structural arms and exposes mechanism readbacks", () => {
    for (const arm of NO_AVPD_FIVE_PATCH_STRUCTURAL_ARM_IDS_V2) {
      const params = createNoAvpdFivePatchStructuralParamsV2(arm);
      const state = initialNoAvpdFivePatchStructuralStateV2(arm, params);
      const output = stepNoAvpdFivePatchStructuralV2(
        arm,
        state,
        0.005,
        params,
      );
      expect(output.accepted, `${arm}: ${output.failureReasons.join(",")}`)
        .toBe(true);
      expect(output.solver.unknowns).toHaveLength(
        arm.startsWith("body-laa") ? 15 : 14,
      );
      const evaluation = output.evaluation!;
      expect(output.state.dynamicValveOpeningFractions01).toBeDefined();
      for (const valve of Object.values(evaluation.valves)) {
        expect("openingStateResidual01" in valve).toBe(true);
        if ("openingStateResidual01" in valve) {
          expect(Math.abs(valve.openingStateResidual01)).toBeLessThanOrEqual(
            1e-7,
          );
        }
      }
      if (arm.startsWith("body-laa")) {
        expect(evaluation.leftAtrialParallelWall).not.toBeNull();
        expect(
          Math.abs(
            evaluation.leftAtrialParallelWall!.pressureMismatchMmHg!,
          ),
        ).toBeLessThanOrEqual(1e-6);
        expect(output.state.leftAtrialParallelWall).toBeDefined();
      } else {
        expect(evaluation.leftAtrialParallelWall).toBeNull();
      }
      if (arm.endsWith("common-pericardium")) {
        expect(evaluation.commonPericardium).not.toBeNull();
        const external =
          evaluation.commonPericardium!.pressureMmHg;
        expect(
          evaluation.pressures.leftAtriumMmHg -
            evaluation.transmuralPressures.leftAtriumMmHg,
        ).toBeCloseTo(external, 12);
        expect(
          evaluation.pressures.rightVentricleMmHg -
            evaluation.transmuralPressures.rightVentricleMmHg,
        ).toBeCloseTo(external, 12);
        expect(
          evaluation.pressures.rightAtriumMmHg -
            evaluation.transmuralPressures.rightAtriumMmHg,
        ).toBeCloseTo(external, 12);
        expect(
          evaluation.pressures.leftVentricleMmHg -
            evaluation.transmuralPressures.leftVentricleMmHg,
        ).toBeCloseTo(external, 12);
        expect(evaluation.leftAtrium.transmuralPressureMmHg).toBeCloseTo(
          evaluation.transmuralPressures.leftAtriumMmHg,
          12,
        );
        expect(evaluation.rightAtrium.transmuralPressureMmHg).toBeCloseTo(
          evaluation.transmuralPressures.rightAtriumMmHg,
          12,
        );
      } else {
        expect(evaluation.commonPericardium).toBeNull();
      }
    }
  });
});
