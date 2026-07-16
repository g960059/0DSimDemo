import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createFiniteThicknessTriSegBendingPriorV2,
  evaluateEnergyConjugateFiniteThicknessTriSegV2,
  evaluateFiniteThicknessTriSegWallDerivativeV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegV2";
import {
  evaluatePublishedTaylorTriSegStagePowerAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/wholeHeartEnergyLedgerV1";
import {
  evaluatePhaseB1TriSegGeometryPowerAccountingV2,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  buildPhaseB1WholeHeartMechanicalEnergyStageSnapshotV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyStageSnapshotV1";
import type {
  PhaseB1EventFreeEndpointEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID,
  stepPhaseB1EventFreeMonolithicBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryInputV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";

const WALLS = Object.freeze({
  LVFW: Object.freeze({
    wallMaterialVolumeM3: 67.07543664065403e-6,
    referenceMidwallAreaM2: 93.54352893865039e-4,
  }),
  SEP: Object.freeze({
    wallMaterialVolumeM3: 35.77356620834881e-6,
    referenceMidwallAreaM2: 39.65081992591075e-4,
  }),
  RVFW: Object.freeze({
    wallMaterialVolumeM3: 36.08736942070275e-6,
    referenceMidwallAreaM2: 129.11294586037828e-4,
  }),
});

const REFERENCE_INPUT: PublishedTriSegGeometryInputV1 = Object.freeze({
  leftVentricularCavityVolumeM3: 144.4e-6,
  rightVentricularCavityVolumeM3: 155.8e-6,
  septalMidwallCapVolumeM3: 42e-6,
  junctionRadiusM: 0.033,
  walls: WALLS,
});

const STRESS = Object.freeze({ LVFW: 12_000, SEP: -800, RVFW: 5_000 });

describe("energy-conjugate finite-thickness TriSeg v2", () => {
  it("matches analytic wall strain and curvature derivatives to centered differences", () => {
    const geometry = trialGeometry({});
    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      const wall = geometry.walls[wallId];
      const derivative = evaluateFiniteThicknessTriSegWallDerivativeV2(wall);
      const capStep = 1e-10;
      const radiusStep = 1e-7;
      const capDerivative = centeredWallDerivative(
        geometry,
        wallId,
        "septalMidwallCapVolumeM3",
        capStep,
      );
      const radiusDerivative = centeredWallDerivative(
        geometry,
        wallId,
        "junctionRadiusM",
        radiusStep,
      );
      expect(derivative.dFiberLogStrainDCapVolumePerM3 / capDerivative.strain)
        .toBeCloseTo(1, 8);
      expect(derivative.dFiberLogStrainDJunctionRadiusPerM / radiusDerivative.strain)
        .toBeCloseTo(1, 8);
      expect(derivative.dCurvatureDCapVolumePerM4 / capDerivative.curvature)
        .toBeCloseTo(1, 8);
      expect(derivative.dCurvatureDJunctionRadiusPerM2 / radiusDerivative.curvature)
        .toBeCloseTo(1, 8);
    }
  });

  it("derives both cavity pressures and both shape forces from one frozen-state potential", () => {
    const reference = evaluatePublishedTriSegGeometryV1(REFERENCE_INPUT);
    const prior = buildBendingPrior(reference);
    const input = trialInput({});
    const geometry = evaluatePublishedTriSegGeometryV1(input);
    const result = evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry,
      fiberKirchhoffStressPaByWall: STRESS,
      bendingPrior: prior,
    });
    const volumeStep = 1e-10;
    const radiusStep = 1e-7;
    const derivative = (field: keyof Pick<
      PublishedTriSegGeometryInputV1,
      | "leftVentricularCavityVolumeM3"
      | "rightVentricularCavityVolumeM3"
      | "septalMidwallCapVolumeM3"
      | "junctionRadiusM"
    >, step: number) => (
      frozenPotential({ ...input, [field]: input[field] + step }, prior)
      - frozenPotential({ ...input, [field]: input[field] - step }, prior)
    ) / (2 * step);

    expect(result.totalGeneralizedForce.leftVentricularPressurePa)
      .toBeCloseTo(derivative("leftVentricularCavityVolumeM3", volumeStep), 4);
    expect(result.totalGeneralizedForce.rightVentricularPressurePa)
      .toBeCloseTo(derivative("rightVentricularCavityVolumeM3", volumeStep), 4);
    expect(result.totalGeneralizedForce.septalMidwallCapVolumePa)
      .toBeCloseTo(derivative("septalMidwallCapVolumeM3", volumeStep), 4);
    expect(result.totalGeneralizedForce.junctionRadiusN)
      .toBeCloseTo(derivative("junctionRadiusM", radiusStep), 6);
    expect(result.equilibriumResidual.axialNPerM)
      .toBeCloseTo(
        0.5 * geometry.junctionRadiusM
          * result.totalGeneralizedForce.septalMidwallCapVolumePa,
        14,
      );
    expect(result.equilibriumResidual.radialNPerM)
      .toBeCloseTo(
        result.totalGeneralizedForce.junctionRadiusN
          / (2 * Math.PI * geometry.junctionRadiusM),
        14,
      );
  });

  it("has symmetric mixed shape derivatives at fixed material state", () => {
    const reference = evaluatePublishedTriSegGeometryV1(REFERENCE_INPUT);
    const prior = buildBendingPrior(reference);
    const input = trialInput({});
    const volumeStep = 1e-10;
    const radiusStep = 1e-7;
    const evaluate = (candidate: PublishedTriSegGeometryInputV1) =>
      evaluateEnergyConjugateFiniteThicknessTriSegV2({
        geometry: evaluatePublishedTriSegGeometryV1(candidate),
        fiberKirchhoffStressPaByWall: STRESS,
        bendingPrior: prior,
      }).totalGeneralizedForce;
    const dGvDy = (
      evaluate({ ...input, junctionRadiusM: input.junctionRadiusM + radiusStep })
        .septalMidwallCapVolumePa
      - evaluate({ ...input, junctionRadiusM: input.junctionRadiusM - radiusStep })
        .septalMidwallCapVolumePa
    ) / (2 * radiusStep);
    const dGyDvs = (
      evaluate({
        ...input,
        septalMidwallCapVolumeM3:
          input.septalMidwallCapVolumeM3 + volumeStep,
      }).junctionRadiusN
      - evaluate({
        ...input,
        septalMidwallCapVolumeM3:
          input.septalMidwallCapVolumeM3 - volumeStep,
      }).junctionRadiusN
    ) / (2 * volumeStep);
    expect(dGvDy).toBeCloseTo(dGyDvs, 4);
  });

  it("makes the loaded reference moment-free and scales flexural rigidity with thickness cubed", () => {
    const reference = evaluatePublishedTriSegGeometryV1(REFERENCE_INPUT);
    const prior = buildBendingPrior(reference);
    const atReference = evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry: reference,
      fiberKirchhoffStressPaByWall: { LVFW: 0, SEP: 0, RVFW: 0 },
      bendingPrior: prior,
    });
    expect(atReference.bendingStoredEnergyJ).toBe(0);
    expect(Math.abs(atReference.bendingGeneralizedForce.leftVentricularPressurePa))
      .toBe(0);
    expect(Math.abs(atReference.bendingGeneralizedForce.rightVentricularPressurePa))
      .toBe(0);
    expect(Math.abs(atReference.bendingGeneralizedForce.septalMidwallCapVolumePa))
      .toBe(0);
    expect(Math.abs(atReference.bendingGeneralizedForce.junctionRadiusN)).toBe(0);

    const doubledWalls = Object.freeze({
      ...WALLS,
      LVFW: Object.freeze({
        ...WALLS.LVFW,
        wallMaterialVolumeM3: 2 * WALLS.LVFW.wallMaterialVolumeM3,
      }),
    });
    const doubledReference = evaluatePublishedTriSegGeometryV1({
      ...REFERENCE_INPUT,
      walls: doubledWalls,
    });
    const doubled = evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry: doubledReference,
      fiberKirchhoffStressPaByWall: { LVFW: 0, SEP: 0, RVFW: 0 },
      bendingPrior: buildBendingPrior(doubledReference),
    });
    expect(doubled.bendingByWall.LVFW.plateFlexuralRigidityNm
      / atReference.bendingByWall.LVFW.plateFlexuralRigidityNm)
      .toBeCloseTo(8, 14);
  });

  it("matches the independent isotropic Koiter trace-curvature energy coefficient", () => {
    const reference = evaluatePublishedTriSegGeometryV1(REFERENCE_INPUT);
    const prior = buildBendingPrior(reference);
    const geometry = trialGeometry({});
    const result = evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry,
      fiberKirchhoffStressPaByWall: { LVFW: 0, SEP: 0, RVFW: 0 },
      bendingPrior: prior,
    });
    const wallId = "LVFW" as const;
    const wall = geometry.walls[wallId];
    const h0 = wall.parameters.wallMaterialVolumeM3
      / wall.parameters.referenceMidwallAreaM2;
    const nu = prior.poissonRatio;
    const plateRigidity = prior.effectiveBendingYoungModulusPa * h0 ** 3
      / (12 * (1 - nu * nu));
    const deltaCurvature = wall.signedMidwallCurvaturePerM
      - prior.referenceCurvaturePerMByWall[wallId];
    const expectedKoiterEnergyJ = 0.25 * plateRigidity * (1 + nu)
      * wall.parameters.referenceMidwallAreaM2
      * deltaCurvature * deltaCurvature;
    expect(result.bendingByWall[wallId].storedEnergyJ)
      .toBeCloseTo(expectedKoiterEnergyJ, 14);
    expect(result.bendingByWall[wallId].reducedSphericalBendingRigidityNm)
      .toBeCloseTo(0.5 * (1 + nu) * plateRigidity, 14);
  });

  it("retains negative membrane stress without a stress clamp or a numerical shape spring", () => {
    const reference = evaluatePublishedTriSegGeometryV1(REFERENCE_INPUT);
    const negativeStress = { LVFW: -81, SEP: -52, RVFW: -90 } as const;
    const result = evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry: trialGeometry({
        leftVentricularCavityVolumeM3: 60.99e-6,
        rightVentricularCavityVolumeM3: 72.45e-6,
      }),
      fiberKirchhoffStressPaByWall: negativeStress,
      bendingPrior: buildBendingPrior(reference),
    });
    expect(result.fiberKirchhoffStressPaByWall).toEqual(negativeStress);
    expect(result.negativeMembraneStressClipped).toBe(false);
    expect(result.numericalShapeSpringApplied).toBe(false);
    expect(result.publishedTaylorUsedForRuntimePressure).toBe(false);
    expect(result.publishedTaylorUsedForRuntimeEquilibrium).toBe(false);
    expect(result.bendingStoredEnergyJ).toBeGreaterThan(0);
  });

  it("accounts for Koiter energy rate without subtracting a Taylor defect", () => {
    const reference = evaluatePublishedTriSegGeometryV1(REFERENCE_INPUT);
    const result = evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry: trialGeometry({}),
      fiberKirchhoffStressPaByWall: STRESS,
      bendingPrior: buildBendingPrior(reference),
    });
    const volumeRate = { LV: -70e-6, RV: 55e-6 } as const;
    const membranePowerW = result.membraneGeneralizedForce
      .leftVentricularPressurePa * volumeRate.LV
      + result.membraneGeneralizedForce.rightVentricularPressurePa
        * volumeRate.RV;
    const wallPowerByWall = Object.freeze({
      LVFW: membranePowerW,
      SEP: 0,
      RVFW: 0,
    });
    const publishedTaylorDiagnostic = evaluatePublishedTaylorTriSegStagePowerAuditV1({
      wallMechanicalPowerByWallW: wallPowerByWall,
      hydraulicPowerW: { LV: 0, RV: 0 },
    });
    const evaluation = {
      closedLoop: {
        chamberTransmuralPressurePa: {
          LV: result.cavityTransmuralPressuresPa.LV,
          RV: result.cavityTransmuralPressuresPa.RV,
        },
        energyConjugateTriSeg: result,
      },
    } as unknown as PhaseB1EventFreeEndpointEvaluationV1;
    const accounting = evaluatePhaseB1TriSegGeometryPowerAccountingV2({
      evaluation,
      ventricularWallMechanicalPowerByWallW: wallPowerByWall,
      volumeRateM3PerSecByVentricle: volumeRate,
      triSegCoordinateRate: {
        septalMidwallCapVolumeM3PerSec: 0,
        junctionRadiusMPerSec: 0,
      },
      publishedTaylorGeometryPowerAudit: publishedTaylorDiagnostic,
    });
    const expectedBendingPowerW = result.bendingGeneralizedForce
      .leftVentricularPressurePa * volumeRate.LV
      + result.bendingGeneralizedForce.rightVentricularPressurePa
        * volumeRate.RV;
    expect(accounting.runtimeAssembly)
      .toBe("energy-conjugate-finite-thickness-triseg-v2");
    expect(accounting.triSegBendingStoredEnergyRateW)
      .toBeCloseTo(expectedBendingPowerW, 14);
    expect(accounting.wholeHeartBalanceCorrectionW).toBe(0);
    expect(accounting.publishedTaylorDefectSubtractedFromWholeHeartBalance)
      .toBe(false);
    expect(accounting.triSegBendingStoredEnergyIncludedInWholeHeartBalance)
      .toBe(true);
    expect(accounting.normalizedWorkConjugacyResidual).toBeLessThan(1e-12);
    expect(accounting.workConjugacyAccepted).toBe(true);
  });

  it("closes accepted-stage TriSeg power with analytic five-wall strain rates", () => {
    const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
      sha256,
    );
    const initial = candidate.warmStart.endpoint;
    const referenceGeometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3:
        initial.differentialState.bloodVolumesM3.LV,
      rightVentricularCavityVolumeM3:
        initial.differentialState.bloodVolumesM3.RV,
      septalMidwallCapVolumeM3: initial.triSegCoordinates.V_m_S,
      junctionRadiusM: initial.triSegCoordinates.y_m,
      walls: candidate.model.closedLoopParameters.triSegWalls,
    });
    const model = Object.freeze({
      ...candidate.model,
      modelId: PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID,
      closedLoopParameters: Object.freeze({
        ...candidate.model.closedLoopParameters,
        finiteThicknessTriSegBendingPriorV2:
          createFiniteThicknessTriSegBendingPriorV2({
            priorId: "accepted-stage-analytic-work-conjugacy-test-v2",
            effectiveBendingYoungModulusPa: 3_000,
            poissonRatio: 0.45,
            referenceGeometry,
            wallBendingMultiplierByWall: { LVFW: 1, SEP: 1, RVFW: 1 },
          }),
      }),
    });
    const dtSec = 0.25e-3;
    const step = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
      model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: initial,
      dtSec,
    });
    if (step.converged === false) {
      throw new Error(`${step.reason}: ${step.message}`);
    }
    const snapshot = buildPhaseB1WholeHeartMechanicalEnergyStageSnapshotV1({
      model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      acceptedStep: step,
      dtSec,
    });

    expect(snapshot.kinematics.fiberLogStrainRateSource)
      .toBe("analytic-five-wall-geometry-chain-rule");
    expect(snapshot.kinematics.centeredFiniteDifferenceFiberRateUsedForMechanicalPower)
      .toBe(false);
    expect(snapshot.kinematics.stepHalvingAudit.centeredFiniteDifferenceRole)
      .toBe("audit-only");
    expect(snapshot.kinematics.stepHalvingAudit.analyticAgreementAccepted)
      .toBe(true);
    expect(snapshot.triSegGeometryPowerAccounting.runtimeAssembly)
      .toBe("energy-conjugate-finite-thickness-triseg-v2");
    expect(snapshot.triSegGeometryPowerAccounting.normalizedWorkConjugacyResidual)
      .toBeLessThan(1e-12);
    expect(snapshot.triSegGeometryPowerAccounting.workConjugacyAccepted)
      .toBe(true);
    expect(snapshot.geometryWorkConjugacyAccepted).toBe(true);
    expect(snapshot.correctedStageLedgerAccepted).toBe(true);
  });
});

function buildBendingPrior(referenceGeometry: ReturnType<
  typeof evaluatePublishedTriSegGeometryV1
>) {
  return createFiniteThicknessTriSegBendingPriorV2({
    priorId: "normal-adult-cmr-moment-free-bending-candidate-v2",
    effectiveBendingYoungModulusPa: 3_000,
    poissonRatio: 0.45,
    referenceGeometry,
    wallBendingMultiplierByWall: { LVFW: 1, SEP: 1, RVFW: 1 },
  });
}

function trialInput(
  override: Partial<PublishedTriSegGeometryInputV1>,
): PublishedTriSegGeometryInputV1 {
  return {
    ...REFERENCE_INPUT,
    leftVentricularCavityVolumeM3: 130e-6,
    rightVentricularCavityVolumeM3: 140e-6,
    septalMidwallCapVolumeM3: 35e-6,
    junctionRadiusM: 0.031,
    ...override,
    walls: override.walls ?? WALLS,
  };
}

function trialGeometry(override: Partial<PublishedTriSegGeometryInputV1>) {
  return evaluatePublishedTriSegGeometryV1(trialInput(override));
}

function centeredWallDerivative(
  center: ReturnType<typeof evaluatePublishedTriSegGeometryV1>,
  wallId: "LVFW" | "SEP" | "RVFW",
  field: "septalMidwallCapVolumeM3" | "junctionRadiusM",
  step: number,
) {
  const input: PublishedTriSegGeometryInputV1 = {
    leftVentricularCavityVolumeM3: center.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: center.rightVentricularCavityVolumeM3,
    septalMidwallCapVolumeM3: center.septalMidwallCapVolumeM3,
    junctionRadiusM: center.junctionRadiusM,
    walls: WALLS,
  };
  const lower = evaluatePublishedTriSegGeometryV1({
    ...input,
    [field]: input[field] - step,
  }).walls[wallId];
  const upper = evaluatePublishedTriSegGeometryV1({
    ...input,
    [field]: input[field] + step,
  }).walls[wallId];
  return {
    strain: (upper.fiberLogStrain - lower.fiberLogStrain) / (2 * step),
    curvature: (
      upper.signedMidwallCurvaturePerM - lower.signedMidwallCurvaturePerM
    ) / (2 * step),
  };
}

function frozenPotential(
  input: PublishedTriSegGeometryInputV1,
  prior: ReturnType<typeof buildBendingPrior>,
): number {
  const geometry = evaluatePublishedTriSegGeometryV1(input);
  let energy = 0;
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    const wall = geometry.walls[wallId];
    energy += wall.parameters.wallMaterialVolumeM3
      * STRESS[wallId]
      * wall.fiberLogStrain;
    const h0 = wall.parameters.wallMaterialVolumeM3
      / wall.parameters.referenceMidwallAreaM2;
    const nu = prior.poissonRatio;
    const plate = prior.effectiveBendingYoungModulusPa * h0 ** 3
      / (12 * (1 - nu * nu));
    const reduced = (1 + nu) / 2 * plate
      * prior.wallBendingMultiplierByWall[wallId];
    const deltaCurvature = wall.signedMidwallCurvaturePerM
      - prior.referenceCurvaturePerMByWall[wallId];
    energy += 0.5 * reduced * wall.parameters.referenceMidwallAreaM2
      * deltaCurvature * deltaCurvature;
  }
  return energy;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
