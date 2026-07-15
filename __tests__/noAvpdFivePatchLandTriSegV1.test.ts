import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { LAND_ACTIVE_PASSIVE_SLS_V1_ID } from "@/engine/mechanics2/constitutive/LandActivePassiveSlsV1";
import { evaluateOneFiberVolumeGeometryV1 } from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";
import {
  DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1,
  NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1,
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1,
  initialNoAvpdFivePatchLandTriSegStateV1,
  solveNoAvpdPassiveTriSegEquilibriumV1,
  stepNoAvpdFivePatchLandTriSegV1,
  totalBloodVolumeMl,
  type NoAvpdFivePatchLandTriSegParamsV1,
  type NoAvpdFivePatchLandTriSegStateV1,
  type NoAvpdWallIdV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

const WALL_IDS: readonly NoAvpdWallIdV1[] = [
  "leftAtrium",
  "rightAtrium",
  "leftFreeWall",
  "septum",
  "rightFreeWall",
];

function materialAt(
  params: NoAvpdFivePatchLandTriSegParamsV1,
  wallId: NoAvpdWallIdV1,
) {
  switch (wallId) {
    case "leftAtrium":
      return params.atria.left.material;
    case "rightAtrium":
      return params.atria.right.material;
    case "leftFreeWall":
      return params.triSeg.leftFreeWall.material;
    case "septum":
      return params.triSeg.septum.material;
    case "rightFreeWall":
      return params.triSeg.rightFreeWall.material;
  }
}

function globalUnknownsFromState(
  state: NoAvpdFivePatchLandTriSegStateV1,
): number[] {
  return [
    state.volumes.leftAtriumMl,
    state.volumes.leftVentricleMl,
    state.volumes.systemicArteryMl,
    state.volumes.systemicVeinMl,
    state.volumes.rightAtriumMl,
    state.volumes.rightVentricleMl,
    state.volumes.pulmonaryArteryMl,
    state.volumes.pulmonaryVeinMl,
    state.flows.mitralValve.qMlPerSec,
    state.flows.aorticValve.qMlPerSec,
    state.flows.tricuspidValve.qMlPerSec,
    state.flows.pulmonaryValve.qMlPerSec,
    state.flows.pulmonaryVenousFlowMlPerSec,
    state.flows.systemicVenousFlowMlPerSec,
  ];
}

function paramsWithValveRegime(
  regime: "closed" | "transition" | "open",
  transitionMidpoints: Readonly<Record<
    "mitral" | "aortic" | "tricuspid" | "pulmonary",
    number
  >>,
): NoAvpdFivePatchLandTriSegParamsV1 {
  const base = DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1;
  const openingMidpointMmHg = regime === "closed" ? 1e6 : -1e6;
  const valve = <T extends NoAvpdFivePatchLandTriSegParamsV1["valves"][keyof NoAvpdFivePatchLandTriSegParamsV1["valves"]]>(
    value: T,
    valveName: keyof typeof transitionMidpoints,
  ): T => ({
    ...value,
    openingMidpointMmHg:
      regime === "transition"
        ? transitionMidpoints[valveName]
        : openingMidpointMmHg,
  });
  return {
    ...base,
    valves: {
      mitral: valve(base.valves.mitral, "mitral"),
      aortic: valve(base.valves.aortic, "aortic"),
      tricuspid: valve(base.valves.tricuspid, "tricuspid"),
      pulmonary: valve(base.valves.pulmonary, "pulmonary"),
    },
  };
}

describe("NoAvpdFivePatchLandTriSegV1", () => {
  it("does not import V2, Hill CE-SEE, or an external CaTRPN front end", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1.ts",
      ),
      "utf8",
    );
    expect(source).not.toContain("NoAvpdFourChamberAtrialLandTriSegV2");
    expect(source).not.toContain("constitutive/HillCeSeeSlsV1");
    expect(source).not.toContain("constitutive/HillPassiveSlsParallelV1");
    expect(source).not.toContain("activation/LandFormCaTroponinActivationV1");
  });

  it("uses one Land active + equilibrium passive + optional SLS topology on all five patches", () => {
    const params = DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1;
    const state = initialNoAvpdFivePatchLandTriSegStateV1(params);
    const materialIds = new Set<string>();

    for (const wallId of WALL_IDS) {
      const material = materialAt(params, wallId);
      materialIds.add(material.materialId);
      expect(Object.keys(material).sort()).toEqual([
        "active",
        "activeHomogenizationScale",
        "materialId",
        "passiveSls",
      ]);
      expect(material.activeHomogenizationScale).toBe(1);
      expect(material.materialId).toMatch(/engineering-seed-v1$/);
      expect(material.materialId).not.toMatch(/literature-prior/);
      expect(material).not.toHaveProperty("contractileElement");
      expect(material).not.toHaveProperty("seriesElasticElement");
      expect(material).not.toHaveProperty("calciumTroponinActivation");
      expect(state.walls[wallId].kind).toBe(LAND_ACTIVE_PASSIVE_SLS_V1_ID);
      expect(state.walls[wallId]).not.toHaveProperty("ceStrain");
      expect(state.walls[wallId].active).not.toHaveProperty("ceStrain");
      expect(material.active.parameterPackStableHash.length).toBeGreaterThan(0);
    }

    expect(materialIds.size).toBe(5);
    const atrialPack = params.atria.left.material.active.parameterPackId;
    expect(params.atria.right.material.active.parameterPackId).toBe(atrialPack);
    const ventricularPack =
      params.triSeg.leftFreeWall.material.active.parameterPackId;
    expect(params.triSeg.septum.material.active.parameterPackId).toBe(
      ventricularPack,
    );
    expect(params.triSeg.rightFreeWall.material.active.parameterPackId).toBe(
      ventricularPack,
    );
    expect(ventricularPack).not.toBe(atrialPack);
    expect(NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1.activeLaw).toBe(
      "Land2017-active-only-on-all-five-myocardial-patches",
    );
    expect(
      NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1.externalSeriesElasticElement,
    ).toBe(false);
    expect(
      NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1.postHocForceVelocityMultiplier,
    ).toBe(false);
    expect(
      NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1.sourceLandTrefOrKineticsModifiedByHomogenization,
    ).toBe(false);
    expect(
      NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1.parameterPriors.passive,
    ).toMatch(/engineering-seeds/);
  });

  it("cold-starts from passive TriSeg equilibrium with zero SLS overstress", () => {
    const params = DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1;
    expect(params.triSegGeneralizedForceMapping).toBe(
      "full-fiber-energy-gradient",
    );
    expect(
      NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1
        .triSegGeneralizedForceMappingDefault,
    ).toBe("full-fiber-energy-gradient");
    expect(params.triSegColdInitialization).toBe("passive-reequilibrated");
    expect(
      NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1.triSegColdInitializationDefault,
    ).toBe("passive-reequilibrated");
    expect(
      NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1.coldInitializationBasalLandLimitation,
    ).toMatch(/nonzero-basal-active-stress-may-remain/);

    const state = initialNoAvpdFivePatchLandTriSegStateV1(params);
    const passive = solveNoAvpdPassiveTriSegEquilibriumV1(
      state.volumes,
      params,
    );
    expect(passive.converged).toBe(true);
    expect(passive.geometry.valid).toBe(true);
    expect(state.triSegContinuation.junctionRadiusCm).toBeCloseTo(
      passive.coordinates.junctionRadiusCm,
      12,
    );
    expect(state.triSegContinuation.septalCapVolumeMl).toBeCloseTo(
      passive.coordinates.septalCapVolumeMl,
      12,
    );
    for (const wallId of WALL_IDS) {
      expect(state.walls[wallId].passiveSls.slsOverstressPa).toBe(0);
    }
    expect(state.walls.leftAtrium.passiveSls.totalStrain).toBeCloseTo(
      evaluateOneFiberVolumeGeometryV1(
        state.volumes.leftAtriumMl,
        params.atria.left.geometry,
      ).fiberNaturalStrain,
      12,
    );
    expect(state.walls.rightAtrium.passiveSls.totalStrain).toBeCloseTo(
      evaluateOneFiberVolumeGeometryV1(
        state.volumes.rightAtriumMl,
        params.atria.right.geometry,
      ).fiberNaturalStrain,
      12,
    );
    for (const wallId of ["leftFreeWall", "septum", "rightFreeWall"] as const) {
      expect(state.walls[wallId].passiveSls.totalStrain).toBeCloseTo(
        passive.geometry.walls[wallId].fiberNaturalStrain,
        12,
      );
    }
  });

  it("exposes off, atrial-only, and all-patch SLS as nested variants", () => {
    const expectedEnabled = {
      off: [],
      "atrial-only": ["leftAtrium", "rightAtrium"],
      "all-patch": WALL_IDS,
    } as const;

    for (const variant of ["off", "atrial-only", "all-patch"] as const) {
      const params = createDefaultNoAvpdFivePatchLandTriSegParamsV1(variant);
      for (const wallId of WALL_IDS) {
        const sls = materialAt(params, wallId).passiveSls.sls;
        const enabled = expectedEnabled[variant].includes(wallId as never);
        expect(sls.enabled, `${variant}:${wallId}`).toBe(enabled);
        expect(sls.modulusPa, `${variant}:${wallId}`).toBeGreaterThanOrEqual(0);
        if (!enabled) expect(sls.modulusPa).toBe(0);
      }
    }
    expect(() =>
      createDefaultNoAvpdFivePatchLandTriSegParamsV1("invalid" as never),
    ).toThrow(/unsupported five-patch SLS variant/);
  });

  it("drives every Land branch from prescribed free Ca and commits transactionally", () => {
    const previous = initialNoAvpdFivePatchLandTriSegStateV1();
    const before = JSON.stringify(previous);
    const output = stepNoAvpdFivePatchLandTriSegV1(previous, 0.001);
    const repeated = stepNoAvpdFivePatchLandTriSegV1(previous, 0.001);

    expect(output.accepted).toBe(true);
    expect(repeated.accepted).toBe(true);
    expect(JSON.stringify(previous)).toBe(before);
    expect(repeated.state).toEqual(output.state);
    expect(output.solver.jacobianReusedIterations).toBe(0);
    expect(output.solver.jacobianEvaluations).toBeGreaterThan(0);
    expect(output.evaluation).not.toBeNull();

    const trials = {
      leftAtrium: output.evaluation!.leftAtrium.materialTrial,
      rightAtrium: output.evaluation!.rightAtrium.materialTrial,
      ...output.evaluation!.ventricles.materialTrials,
    };
    for (const wallId of WALL_IDS) {
      const trial = trials[wallId];
      expect(trial.valid).toBe(true);
      expect(trial.readback!.freeCalciumUm).toBe(
        output.evaluation!.freeCalciumUm[wallId],
      );
      expect(trial.activeTrial.readback!.claim.prescribedFreeCalciumInput).toBe(
        true,
      );
      expect(
        trial.activeTrial.readback!.claim.externalSeriesElasticElementAdded,
      ).toBe(false);
      const stresses = trial.readback!.stresses;
      expect(stresses.totalTransmittedPa).toBeCloseTo(
        stresses.passiveEquilibriumPa +
          stresses.effectiveTransmittedActivePa +
          stresses.slsOverstressPa,
        12,
      );
      expect(stresses.mappedCellularLandActivePa).toBe(
        trial.activeTrial.readback!.wallActiveKirchhoffStressPa,
      );
      expect(output.state.walls[wallId].active.previousFiberLogStrain).toBe(
        output.state.walls[wallId].passiveSls.totalStrain,
      );
    }
    const laMechanism = output.evaluation!.leftAtrium.mechanismReadback;
    const laPressureComponents = laMechanism.pressureComponentsMmHg;
    expect(laPressureComponents.totalMmHg).toBeCloseTo(
      output.evaluation!.pressures.leftAtriumMmHg,
      12,
    );
    expect(
      laPressureComponents.equilibriumPassiveMmHg +
        laPressureComponents.effectiveLandActiveMmHg +
        laPressureComponents.slsOverstressMmHg,
    ).toBeCloseTo(laPressureComponents.totalMmHg, 12);
    expect(laPressureComponents.componentSumMinusTotalMmHg).toBeCloseTo(
      0,
      12,
    );
    expect(laMechanism.fiberLogStrain).toBeCloseTo(
      output.state.walls.leftAtrium.passiveSls.totalStrain,
      12,
    );
    expect(
      laMechanism.fiberLogStrainBackwardDifferenceRatePerSec,
    ).toBeCloseTo(
      (output.state.walls.leftAtrium.passiveSls.totalStrain -
        previous.walls.leftAtrium.passiveSls.totalStrain) / 0.001,
      12,
    );
    expect(
      Math.abs(
        totalBloodVolumeMl(output.state.volumes) -
          totalBloodVolumeMl(previous.volumes),
      ),
    ).toBeLessThan(1e-6);
  });

  it("applies a Ca peak protocol control without changing parameter identity or normalized Ca state", () => {
    const previous = initialNoAvpdFivePatchLandTriSegStateV1();
    let fullState = previous;
    let quarterState = previous;
    let full = stepNoAvpdFivePatchLandTriSegV1(fullState, 0.001);
    let quarter = stepNoAvpdFivePatchLandTriSegV1(
      quarterState,
      0.001,
      DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1,
      { prescribedCalciumPeakAboveDiastolicScale01: 0.25 },
    );
    for (let step = 1; step < 20; step += 1) {
      expect(full.accepted).toBe(true);
      expect(quarter.accepted).toBe(true);
      fullState = full.state;
      quarterState = quarter.state;
      full = stepNoAvpdFivePatchLandTriSegV1(fullState, 0.001);
      quarter = stepNoAvpdFivePatchLandTriSegV1(
        quarterState,
        0.001,
        DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1,
        { prescribedCalciumPeakAboveDiastolicScale01: 0.25 },
      );
    }

    expect(full.accepted).toBe(true);
    expect(quarter.accepted).toBe(true);
    expect(quarter.protocolControls).toEqual({
      prescribedCalciumPeakAboveDiastolicScale01: 0.25,
    });
    expect(quarter.state.parameterIdentityCanonicalJson).toBe(
      previous.parameterIdentityCanonicalJson,
    );
    expect(quarter.state.calciumDrivers).toEqual(full.state.calciumDrivers);
    expect(quarter.evaluation!.freeCalciumUm.leftFreeWall).toBeLessThan(
      full.evaluation!.freeCalciumUm.leftFreeWall,
    );
    expect(() => stepNoAvpdFivePatchLandTriSegV1(
      previous,
      0.005,
      DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1,
      { prescribedCalciumPeakAboveDiastolicScale01: 1.01 },
    )).toThrow(/must lie in \[0, 1\]/);
  });

  it("matches finite differences for all ten analytic global Jacobian columns", () => {
    const dtSec = 0.001;
    const analyticColumns = [2, 3, 6, 7, 8, 9, 10, 11, 12, 13] as const;
    const probePrevious = initialNoAvpdFivePatchLandTriSegStateV1();
    const probeUnknowns = globalUnknownsFromState(probePrevious);
    const probe = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
      probePrevious,
      probeUnknowns,
      dtSec,
      2,
    );
    expect(probe).not.toBeNull();
    const transitionMidpoints = probe!.valvePressureGradientsMmHg;
    const scenarios = [
      { regime: "closed", flowMlPerSec: 0 },
      { regime: "transition", flowMlPerSec: -75 },
      { regime: "open", flowMlPerSec: 90 },
    ] as const;

    for (const scenario of scenarios) {
      const params = paramsWithValveRegime(
        scenario.regime,
        transitionMidpoints,
      );
      const previous = initialNoAvpdFivePatchLandTriSegStateV1(params);
      const unknowns = globalUnknownsFromState(previous);
      for (let column = 8; column < 14; column += 1) {
        unknowns[column] = scenario.flowMlPerSec;
      }

      for (const column of analyticColumns) {
        const at = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
          previous,
          unknowns,
          dtSec,
          column,
          params,
        );
        expect(at, `${scenario.regime}:column-${column}:base`).not.toBeNull();
        expect(at!.analyticJacobianColumn).not.toBeNull();
        if (scenario.regime === "transition") {
          for (const openFraction of Object.values(at!.valveOpenFractions01)) {
            expect(openFraction).toBeCloseTo(0.5, 10);
          }
        }
        const h = 1e-6 * Math.max(1, Math.abs(unknowns[column]!));
        const plusUnknowns = [...unknowns];
        const minusUnknowns = [...unknowns];
        plusUnknowns[column] += h;
        minusUnknowns[column] -= h;
        const plus = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
          previous,
          plusUnknowns,
          dtSec,
          column,
          params,
        );
        const minus = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
          previous,
          minusUnknowns,
          dtSec,
          column,
          params,
        );
        expect(plus, `${scenario.regime}:column-${column}:plus`).not.toBeNull();
        expect(minus, `${scenario.regime}:column-${column}:minus`).not.toBeNull();

        for (let row = 0; row < 14; row += 1) {
          const finiteDifference =
            (plus!.residuals[row]! - minus!.residuals[row]!) / (2 * h);
          const analytic = at!.analyticJacobianColumn![row]!;
          const scale = Math.max(1, Math.abs(finiteDifference), Math.abs(analytic));
          expect(
            Math.abs(finiteDifference - analytic) / scale,
            `${scenario.regime}:flow-${scenario.flowMlPerSec}:row-${row}:column-${column}`,
          ).toBeLessThan(2e-6);
        }
      }
    }
  });

  it("matches the valve dt floor in analytic flow columns", () => {
    const dtSec = 1e-10;
    const base = DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1;
    const previous = initialNoAvpdFivePatchLandTriSegStateV1(base);
    const unknowns = globalUnknownsFromState(previous);
    for (let column = 8; column <= 11; column += 1) unknowns[column] = 25;

    for (const column of [8, 9, 10, 11] as const) {
      const at = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
        previous,
        unknowns,
        dtSec,
        column,
        base,
      );
      expect(at).not.toBeNull();
      const h = 1e-3;
      const plusUnknowns = [...unknowns];
      const minusUnknowns = [...unknowns];
      plusUnknowns[column] += h;
      minusUnknowns[column] -= h;
      const plus = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
        previous,
        plusUnknowns,
        dtSec,
        column,
        base,
      );
      const minus = evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
        previous,
        minusUnknowns,
        dtSec,
        column,
        base,
      );
      expect(plus).not.toBeNull();
      expect(minus).not.toBeNull();
      const row = column;
      const finiteDifference =
        (plus!.residuals[row]! - minus!.residuals[row]!) / (2 * h);
      const analytic = at!.analyticJacobianColumn![row]!;
      expect(
        Math.abs(analytic - finiteDifference) /
          Math.max(1, Math.abs(analytic), Math.abs(finiteDifference)),
      ).toBeLessThan(1e-9);
    }
  });

  it("rolls back all five material histories when the global solve rejects", () => {
    const base = DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1;
    const params = {
      ...base,
      solver: { ...base.solver, maxIterations: 1, residualTolerance: 1e-16 },
    };
    const previous = initialNoAvpdFivePatchLandTriSegStateV1(params);
    const output = stepNoAvpdFivePatchLandTriSegV1(previous, 0.005, params);
    expect(output.accepted).toBe(false);
    expect(output.state).toBe(previous);
    expect(output.candidateState).toBeNull();
  });
});
