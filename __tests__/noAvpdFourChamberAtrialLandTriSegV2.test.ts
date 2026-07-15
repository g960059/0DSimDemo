import { describe, expect, it } from "vitest";

import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_CLAIM_BOUNDARY_V2,
  initialNoAvpdFourChamberAtrialLandTriSegStateV2,
  stepNoAvpdFourChamberAtrialLandTriSegV2,
  totalBloodVolumeMl,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberAtrialLandTriSegV2";

describe("NoAvpdFourChamberAtrialLandTriSegV2", () => {
  it("uses a heterogeneous LA Land + passive + SLS state without CE or SEE", () => {
    const leftMaterial =
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2.atria.left
        .passiveSlsSourceMaterial;
    expect(Object.keys(leftMaterial).sort()).toEqual([
      "parameterSetId",
      "passive",
      "sls",
    ]);
    expect(leftMaterial.parameterSetId).toBe(
      "no-avpd-la-passive-sls-engineering-seed-v2",
    );
    expect(leftMaterial).not.toHaveProperty("contractileElement");
    expect(leftMaterial).not.toHaveProperty("seriesElasticElement");
    expect(leftMaterial).not.toHaveProperty("calciumTroponinActivation");

    const previous = initialNoAvpdFourChamberAtrialLandTriSegStateV2();
    const before = JSON.stringify(previous);
    const first = stepNoAvpdFourChamberAtrialLandTriSegV2(previous, 0.001);
    const repeated = stepNoAvpdFourChamberAtrialLandTriSegV2(previous, 0.001);

    expect(first.accepted).toBe(true);
    expect(repeated.accepted).toBe(true);
    expect(JSON.stringify(previous)).toBe(before);
    expect(repeated.state).toEqual(first.state);
    expect(previous.walls.leftAtrium.kind).toBe(
      "land-active-parallel-passive-sls-v1",
    );
    expect(previous.walls.leftAtrium).not.toHaveProperty("ceStrain");
    expect(previous.walls.leftAtrium.active).not.toHaveProperty("ceStrain");
    expect(previous.parameterIdentityCanonicalJson.length).toBeGreaterThan(100);
    expect(first.state.walls.leftAtrium.active.landState).not.toBe(
      first.evaluation!.leftAtrium.materialTrial.activeTrial.nextState!.landState,
    );
    expect(
      first.state.walls.leftAtrium.active.previousFiberLogStrain,
    ).toBe(first.state.walls.leftAtrium.passiveSls.totalStrain);

    const stresses = first.evaluation!.leftAtrium.materialTrial.readback!.stresses;
    const activeReadback = first.evaluation!.leftAtrium.materialTrial
      .activeTrial.readback!;
    expect(stresses.landActivePa).toBe(
      activeReadback.wallActiveKirchhoffStressPa,
    );
    expect(activeReadback.claim.externalSeriesElasticElementAdded).toBe(false);
    expect(activeReadback.claim.postHocForceVelocityMultiplierAdded).toBe(false);
    expect(activeReadback.claim.activeStressGainAdded).toBe(false);
    expect(
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_CLAIM_BOUNDARY_V2
        .leftAtrialExternalSeriesElasticElement,
    ).toBe(false);
    expect(
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_CLAIM_BOUNDARY_V2
        .leftAtrialPostHocForceVelocityMultiplier,
    ).toBe(false);
    expect(
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_CLAIM_BOUNDARY_V2
        .leftAtrialActiveStressGain,
    ).toBe(false);
    expect(stresses.totalTransmittedPa).toBeCloseTo(
      stresses.passiveEquilibriumPa +
        stresses.landActivePa +
        stresses.slsOverstressPa,
      12,
    );
    expect(
      Math.abs(
        first.evaluation!.leftAtrium.materialTrial.passiveSlsTrial.readback!
          .slsBalance.discreteBalanceResidualJPerM3,
      ),
    ).toBeLessThan(1e-12);
    expect(
      Math.abs(
        totalBloodVolumeMl(first.state.volumes) -
          totalBloodVolumeMl(previous.volumes),
      ),
    ).toBeLessThan(1e-6);
  });

  it("rolls back every accepted state when the global solve is rejected", () => {
    const params = {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
      solver: {
        ...DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2.solver,
        maxIterations: 1,
        residualTolerance: 1e-16,
      },
    };
    const previous = initialNoAvpdFourChamberAtrialLandTriSegStateV2(params);
    const output = stepNoAvpdFourChamberAtrialLandTriSegV2(
      previous,
      0.005,
      params,
    );
    expect(output.accepted).toBe(false);
    expect(output.state).toBe(previous);
    expect(output.candidateState).toBeNull();
  });

  it("rejects hot replacement of the LA constitutive identity", () => {
    const previous = initialNoAvpdFourChamberAtrialLandTriSegStateV2();
    const params = {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
      atria: {
        ...DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2.atria,
        left: {
          ...DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2.atria
            .left,
          passiveSlsSourceMaterial: {
            ...DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2.atria
              .left.passiveSlsSourceMaterial,
            parameterSetId: "changed-without-cold-initialization",
          },
        },
      },
    };
    expect(() =>
      stepNoAvpdFourChamberAtrialLandTriSegV2(previous, 0.001, params)
    ).toThrow(/cold reinitialization/);
  });

  it.each([
    {
      label: "same-id passive stiffness",
      change: () => {
        const base = DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2;
        return {
          ...base,
          atria: {
            ...base.atria,
            left: {
              ...base.atria.left,
              passiveSlsSourceMaterial: {
                ...base.atria.left.passiveSlsSourceMaterial,
                passive: {
                  ...base.atria.left.passiveSlsSourceMaterial.passive,
                  tangentModulusPa:
                    base.atria.left.passiveSlsSourceMaterial.passive
                      .tangentModulusPa * 1.01,
                },
              },
            },
          },
        };
      },
    },
    {
      label: "same-id SLS relaxation time",
      change: () => {
        const base = DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2;
        return {
          ...base,
          atria: {
            ...base.atria,
            left: {
              ...base.atria.left,
              passiveSlsSourceMaterial: {
                ...base.atria.left.passiveSlsSourceMaterial,
                sls: {
                  ...base.atria.left.passiveSlsSourceMaterial.sls,
                  relaxationTimeSec:
                    base.atria.left.passiveSlsSourceMaterial.sls
                      .relaxationTimeSec * 1.01,
                },
              },
            },
          },
        };
      },
    },
    {
      label: "same-hash Land slack stretch",
      change: () => {
        const base = DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2;
        return {
          ...base,
          atria: {
            ...base.atria,
            left: {
              ...base.atria.left,
              active: {
                ...base.atria.left.active,
                lambdaLandSlack: base.atria.left.active.lambdaLandSlack * 1.01,
              },
            },
          },
        };
      },
    },
    {
      label: "same-material LA geometry",
      change: () => {
        const base = DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2;
        return {
          ...base,
          atria: {
            ...base.atria,
            left: {
              ...base.atria.left,
              geometry: {
                ...base.atria.left.geometry,
                wallVolumeMl: base.atria.left.geometry.wallVolumeMl + 0.1,
              },
            },
          },
        };
      },
    },
  ])("requires cold initialization after a $label change", ({ change }) => {
    const previous = initialNoAvpdFourChamberAtrialLandTriSegStateV2();
    expect(() =>
      stepNoAvpdFourChamberAtrialLandTriSegV2(previous, 0.001, change())
    ).toThrow(/effective subsystem parameters changed.*cold reinitialization/);
  });
});
