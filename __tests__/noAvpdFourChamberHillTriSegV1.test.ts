import { describe, expect, it } from "vitest";

import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1,
  initialNoAvpdFourChamberHillTriSegStateV1,
  solveNoAvpdPassiveTriSegEquilibriumV1,
  stepNoAvpdFourChamberHillTriSegV1,
  totalBloodVolumeMl,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpdFourChamberHillTriSegV1", () => {
  it("applies the septal area re-reference to the septum rather than the LV free wall", () => {
    const params = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    const septalReferenceShift = 0.5 * Math.log(25 / 34);

    expect(
      params.triSeg.leftFreeWall.material.contractileElement.optimalStrain,
    ).toBeCloseTo(0.1, 15);
    expect(
      params.triSeg.septum.material.contractileElement.optimalStrain,
    ).toBeCloseTo(0.1 + septalReferenceShift, 15);
  });

  it("owns blood volume only in the eight closed-loop compartments", () => {
    const state = initialNoAvpdFourChamberHillTriSegStateV1();
    expect(Object.keys(state.volumes)).toHaveLength(8);
    expect(totalBloodVolumeMl(state.volumes)).toBe(4_950);
    expect(
      NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1.closedBloodVolumeLedger,
    ).toBe(true);
    expect(
      NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1.avPlaneDynamicState,
    ).toBe(false);
    expect(
      NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1.avpdObserverIncluded,
    ).toBe(false);
    expect(
      NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1.calciumMyofilamentPairing,
    ).toContain("not-jointly-calibrated");
    expect(
      NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1.atrialLandFrontEndUse,
    ).toContain("engineering-extrapolation");
    expect("avPlane" in state).toBe(false);
    expect(Object.keys(state.calciumDrivers)).toHaveLength(5);
    expect(state.triSegGeneralizedForceMapping).toBe(
      "lumens-2009-representative-tension-area-work",
    );
    expect(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.triSegColdInitialization,
    ).toBe("legacy-seed");
    expect(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.triSeg.leftFreeWall
        .material.parameterSetId,
    ).toContain("engineering-seed");
    for (const wall of Object.values(state.walls)) {
      expect(wall.caTroponin01).toBeGreaterThan(0);
      expect(Math.exp(wall.ceStrain)).toBeLessThan(1.2);
    }
  });

  it("initializes and advances an opt-in dynamic thin-filament wall state", () => {
    const defaults = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    const leftMaterial = defaults.atria.left.material;
    const params = {
      ...defaults,
      atria: {
        ...defaults.atria,
        left: {
          ...defaults.atria.left,
          material: {
            ...leftMaterial,
            parameterSetId: `${leftMaterial.parameterSetId}-dynamic-thin-filament-test`,
            calciumTroponinActivation: {
              ...leftMaterial.calciumTroponinActivation,
              parameterSetId: `${leftMaterial.calciumTroponinActivation.parameterSetId}-dynamic-thin-filament-test`,
              thinFilamentDynamics: {
                mode: "one-state-normalized-lag" as const,
                timeConstantSec: 0.025,
              },
            },
          },
        },
      },
    };
    const initial = initialNoAvpdFourChamberHillTriSegStateV1(params);

    expect(initial.walls.leftAtrium.thinFilamentAvailability01).toBeDefined();
    expect(
      initial.walls.rightAtrium.thinFilamentAvailability01,
    ).toBeUndefined();

    const output = stepNoAvpdFourChamberHillTriSegV1(initial, 0.001, params);
    expect(output.accepted, output.failureReasons.join(", ")).toBe(true);
    expect(
      output.state.walls.leftAtrium.thinFilamentAvailability01,
    ).toBeDefined();
  });

  it("provides the same passive-reequilibrated cold protocol for either mapping", () => {
    const legacyParams = {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      triSegColdInitialization: "passive-reequilibrated" as const,
    };
    const fullFiberParams = {
      ...legacyParams,
      triSegGeneralizedForceMapping: "full-fiber-energy-gradient" as const,
    };
    const volumes =
      initialNoAvpdFourChamberHillTriSegStateV1(legacyParams).volumes;
    const legacy = solveNoAvpdPassiveTriSegEquilibriumV1(volumes, legacyParams);
    const fullFiber = solveNoAvpdPassiveTriSegEquilibriumV1(
      volumes,
      fullFiberParams,
    );

    expect(
      legacy.converged,
      legacy.diagnostics.failureReason ?? undefined,
    ).toBe(true);
    expect(
      fullFiber.converged,
      fullFiber.diagnostics.failureReason ?? undefined,
    ).toBe(true);
    expect("generalizedForceMapping" in legacy).toBe(false);
    expect("generalizedForceMapping" in fullFiber).toBe(true);
    if (!("generalizedForceMapping" in fullFiber)) return;
    expect(
      fullFiber.fullFiberEnergyGradient?.residuals.relativeMagnitude,
    ).toBeLessThan(1e-7);

    const exactState =
      initialNoAvpdFourChamberHillTriSegStateV1(fullFiberParams);
    expect(exactState.triSegGeneralizedForceMapping).toBe(
      "full-fiber-energy-gradient",
    );
    expect(exactState.triSegContinuation).toEqual(fullFiber.coordinates);
  });

  it("requires cold reinitialization when the generalized-force mapping changes", () => {
    const previous = initialNoAvpdFourChamberHillTriSegStateV1();
    const exactParams = {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      triSegGeneralizedForceMapping: "full-fiber-energy-gradient" as const,
      triSegColdInitialization: "passive-reequilibrated" as const,
    };
    expect(() =>
      stepNoAvpdFourChamberHillTriSegV1(previous, 0.001, exactParams),
    ).toThrow(/cold reinitialization is required/);
    expect(() =>
      initialNoAvpdFourChamberHillTriSegStateV1({
        ...exactParams,
        triSegColdInitialization: "legacy-seed",
      }),
    ).toThrow(/requires passive-reequilibrated cold initialization/);
  });

  it("advances the opt-in full-fiber work mapping without legacy tension readbacks", () => {
    const params = {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      triSegGeneralizedForceMapping: "full-fiber-energy-gradient" as const,
      triSegColdInitialization: "passive-reequilibrated" as const,
    };
    const previous = initialNoAvpdFourChamberHillTriSegStateV1(params);
    const output = stepNoAvpdFourChamberHillTriSegV1(previous, 0.001, params);

    expect(output.accepted, output.failureReasons.join(", ")).toBe(true);
    const triSeg = output.evaluation?.ventricles.triSeg;
    expect(triSeg).toBeDefined();
    expect(triSeg && "generalizedForceMapping" in triSeg).toBe(true);
    if (triSeg === undefined || !("generalizedForceMapping" in triSeg)) return;
    expect(
      triSeg.fullFiberEnergyGradient?.residuals.relativeMagnitude,
    ).toBeLessThan(1e-7);
    expect(
      triSeg.fullFiberEnergyGradient?.pressures.leftVentricleTransmuralMmHg,
    ).toBeCloseTo(
      output.evaluation?.pressures.leftVentricleMmHg ?? Number.NaN,
      12,
    );
    expect("tensionsNPerM" in triSeg).toBe(false);
    expect("virtualWork" in triSeg).toBe(false);
  });

  it("advances one fully coupled step while preserving total blood volume", () => {
    const previous = initialNoAvpdFourChamberHillTriSegStateV1();
    const output = stepNoAvpdFourChamberHillTriSegV1(previous, 0.001);
    expect(output.accepted, output.failureReasons.join(", ")).toBe(true);
    expect(output.state).not.toBe(previous);
    expect(output.evaluation).not.toBeNull();
    expect(
      Math.abs(output.totalBloodVolumeResidualMl ?? Number.NaN),
    ).toBeLessThanOrEqual(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.solver
        .totalBloodVolumeToleranceMl,
    );
    expect(totalBloodVolumeMl(output.state.volumes)).toBeCloseTo(
      totalBloodVolumeMl(previous.volumes),
      8,
    );
    expect(output.evaluation?.freeCalciumUm.leftFreeWall).toBeGreaterThan(0);
    expect(output.evaluation?.activations01.leftFreeWall).toBeCloseTo(
      output.evaluation?.ventricles.materialTrials.leftFreeWall.readback
        .activation01 ?? Number.NaN,
      12,
    );
  });

  it("stages prescribed Ca and commits it atomically with CaTRPN mechanics", () => {
    const initial = initialNoAvpdFourChamberHillTriSegStateV1();
    let state = initial;
    let finalEvaluation = null as ReturnType<
      typeof stepNoAvpdFourChamberHillTriSegV1
    >["evaluation"];
    for (let index = 0; index < 6; index += 1) {
      const output = stepNoAvpdFourChamberHillTriSegV1(state, 0.005);
      expect(output.accepted, output.failureReasons.join(", ")).toBe(true);
      state = output.state;
      finalEvaluation = output.evaluation;
    }
    expect(state.calciumDrivers.leftFreeWall.decayState01).toBeGreaterThan(
      initial.calciumDrivers.leftFreeWall.decayState01,
    );
    expect(state.walls.leftFreeWall.caTroponin01).not.toBe(
      initial.walls.leftFreeWall.caTroponin01,
    );
    expect(finalEvaluation?.freeCalciumUm.leftFreeWall).toBeGreaterThan(0.1);
    expect(
      finalEvaluation?.ventricles.materialTrials.leftFreeWall.readback
        .caTroponin01,
    ).toBeCloseTo(state.walls.leftFreeWall.caTroponin01, 12);
  });

  it("never commits a rejected candidate", () => {
    const previous = initialNoAvpdFourChamberHillTriSegStateV1();
    const deliberatelyImpossible = {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      solver: {
        ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.solver,
        maxIterations: 1,
        residualTolerance: 1e-30,
      },
    };
    const output = stepNoAvpdFourChamberHillTriSegV1(
      previous,
      0.005,
      deliberatelyImpossible,
    );
    expect(output.accepted).toBe(false);
    expect(output.state).toBe(previous);
    expect(output.candidateState).toBeNull();
    expect(previous.timeSec).toBe(0);
    expect(output.state.calciumDrivers).toBe(previous.calciumDrivers);
    expect(output.state.walls).toBe(previous.walls);
  });

  it("rejects a time step that under-resolves the prescribed-Ca release without advancing state", () => {
    const previous = initialNoAvpdFourChamberHillTriSegStateV1();
    const output = stepNoAvpdFourChamberHillTriSegV1(previous, 0.01);
    expect(output.accepted).toBe(false);
    expect(
      output.failureReasons.some((reason) =>
        reason.startsWith("calcium-driver:"),
      ),
    ).toBe(true);
    expect(output.state).toBe(previous);
  });

  it("requires one subsystem cycle length and unique wall target ownership", () => {
    const mismatched = {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      calciumDrivers: {
        ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.calciumDrivers,
        leftAtrium: {
          ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.calciumDrivers
            .leftAtrium,
          cycleLengthSec: 0.9,
        },
      },
    };
    expect(() => initialNoAvpdFourChamberHillTriSegStateV1(mismatched)).toThrow(
      /cycle length must equal/,
    );
  });
});
