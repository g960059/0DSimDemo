import { describe, expect, it } from "vitest";
import {
  PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2,
  solvePhaseB1PreAOperatingPointV2,
  solvePhaseB1QuasiSteadyInertialFlowRootV2,
  type PhaseB1PreAOperatingPointInputV2,
  type PhaseB1PreAOperatingPointUnknownsV2,
  type PhaseB1PreARelaxedMechanicsEvaluatorV2,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PreAOperatingPointInitializerV2";

const PRESSURE_SHAPE_PA = Object.freeze({
  LA: 300,
  LV: 250,
  SA: 9_000,
  SV: 0,
  RA: -200,
  RV: -250,
  PA: 1_200,
  PV: 500,
});

const BASE_CHAMBER_VOLUME_M3 = Object.freeze({
  LA: 30e-6,
  LV: 100e-6,
  RA: 40e-6,
  RV: 110e-6,
});

const CHAMBER_PRESSURE_SLOPE_PA_PER_M3 = 1e8;

const RELAXED_MECHANICS: PhaseB1PreARelaxedMechanicsEvaluatorV2 = (
  unknowns,
) => {
  const volumes = unknowns.chamberBloodVolumesM3;
  const targetVms = 20e-6 + 0.1 * (volumes.LV - volumes.RV);
  const targetY = 0.03 + 10 * (volumes.LV + volumes.RV - 220e-6);
  return Object.freeze({
    status: "ok" as const,
    chamberAbsolutePressurePa: Object.freeze({
      LA: CHAMBER_PRESSURE_SLOPE_PA_PER_M3
        * (volumes.LA - BASE_CHAMBER_VOLUME_M3.LA),
      LV: CHAMBER_PRESSURE_SLOPE_PA_PER_M3
        * (volumes.LV - BASE_CHAMBER_VOLUME_M3.LV),
      RA: CHAMBER_PRESSURE_SLOPE_PA_PER_M3
        * (volumes.RA - BASE_CHAMBER_VOLUME_M3.RA),
      RV: CHAMBER_PRESSURE_SLOPE_PA_PER_M3
        * (volumes.RV - BASE_CHAMBER_VOLUME_M3.RV),
    }),
    triSegResidualNPerM: Object.freeze({
      axial: 1e8 * (unknowns.triSegCoordinates.V_m_S - targetVms),
      radial: 1e5 * (unknowns.triSegCoordinates.y_m - targetY),
    }),
    materialConsistency: Object.freeze({
      maximumAbsoluteLandRhsPerSec: 0,
      maximumAbsoluteSlsOverstressPa: 0,
      importedOldLandHistory: false as const,
      importedOldSlsHistory: false as const,
    }),
  });
};

describe("Phase B1 pre-atrial physiological operating-point initializer V2", () => {
  it("solves the seven state unknowns with fixed V0, exact TBV, relaxed mechanics, and consistent nonzero flows", () => {
    const result = solvePhaseB1PreAOperatingPointV2(makeInput(5.6e-3));
    expect(result.converged).toBe(true);
    if (result.converged === false) return;

    expect(result.audit.pass).toBe(true);
    expect(result.audit.fixedVascularV0UsedExact).toBe(true);
    expect(result.audit.individualVolumeRateStationarityRequired).toBe(false);
    expect(Math.abs(result.audit.totalBloodVolumeDifferenceM3)).toBeLessThan(1e-12);
    expect(result.audit.maximumAbsoluteChamberPressureReplayDifferencePa)
      .toBeLessThan(1e-4);
    expect(result.audit.maximumAbsoluteTriSegResidualNPerM).toBeLessThan(1e-5);
    expect(result.audit.maximumAbsoluteInertialFlowAccelerationM3PerSec2)
      .toBeLessThan(1e-10);
    expect(Math.abs(result.volumeRates.totalVolumeRateM3PerSec)).toBeLessThan(1e-15);
    expect(Math.max(...Object.values(result.volumeRates.volumeRatesM3PerSec)
      .map(Math.abs))).toBeGreaterThan(0);

    expect(result.inertialFlowsM3PerSec.Q_MV).toBeGreaterThan(0);
    expect(result.inertialFlowsM3PerSec.Q_TV).toBeGreaterThan(0);
    expect(result.inertialFlowsM3PerSec.Q_VC).toBeGreaterThan(0);
    expect(result.inertialFlowsM3PerSec.Q_PV).toBeGreaterThan(0);
    expect(result.inertialFlowsM3PerSec.Q_AoV).toBeLessThan(0);
    expect(result.inertialFlowsM3PerSec.Q_PuV).toBeLessThan(0);
    expect(Object.values(result.inertialFlowRootByFlow).every(
      (root) => root.uniqueMonotoneRoot && root.zeroFlowForced === false,
    )).toBe(true);
  });

  it("keeps every vascular V0 fixed when TBV changes and moves the common filling-pressure offset instead", () => {
    const baselineInput = makeInput(5.6e-3);
    const expandedInput = makeInput(5.7e-3);
    const baseline = solvePhaseB1PreAOperatingPointV2(baselineInput);
    const expanded = solvePhaseB1PreAOperatingPointV2(expandedInput);
    expect(baseline.converged).toBe(true);
    expect(expanded.converged).toBe(true);
    if (baseline.converged === false || expanded.converged === false) return;

    expect(expanded.unknowns.commonFillingPressureOffsetPa)
      .toBeGreaterThan(baseline.unknowns.commonFillingPressureOffsetPa);
    for (const id of ["SA", "SV", "PA", "PV"] as const) {
      const expectedV0 = baselineInput
        .vascularComplianceParametersByCompartment[id].unstressedVolumeM3;
      expect(baseline.vascularEvaluationByCompartment[id].volumeM3
        - baseline.vascularEvaluationByCompartment[id].elasticVolumeM3)
        .toBeCloseTo(expectedV0, 15);
      expect(expanded.vascularEvaluationByCompartment[id].volumeM3
        - expanded.vascularEvaluationByCompartment[id].elasticVolumeM3)
        .toBeCloseTo(expectedV0, 15);
    }
  });

  it("rejects a pressure shape that opens a semilunar valve in the declared pre-atrial phase", () => {
    const base = makeInput(5.6e-3);
    expect(() => solvePhaseB1PreAOperatingPointV2({
      ...base,
      pressureShapePaRelativeToSvByCompartment: Object.freeze({
        ...PRESSURE_SHAPE_PA,
        SA: 100,
      }),
    })).toThrow(/pre-atrial valve phase/);
  });

  it("fails closed when the mechanics callback imports old Land or SLS history", () => {
    const input = makeInput(5.6e-3);
    const result = solvePhaseB1PreAOperatingPointV2({
      ...input,
      evaluateRelaxedMechanics: ((unknowns: PhaseB1PreAOperatingPointUnknownsV2) => {
        const valid = RELAXED_MECHANICS(unknowns);
        if (valid.status === "inadmissible") return valid;
        return {
          ...valid,
          materialConsistency: {
            ...valid.materialConsistency,
            importedOldLandHistory: true,
          },
        };
      }) as unknown as PhaseB1PreARelaxedMechanicsEvaluatorV2,
    });
    expect(result.converged).toBe(false);
    if (result.converged !== false) return;
    expect(result.reason).toBe("model-evaluation-failed");
    expect(result.projectionApplied).toBe(false);
    expect(result.clampApplied).toBe(false);
    expect(result.fallbackApplied).toBe(false);
  });

  it("solves positive, negative, and exactly-zero signed momentum roots without a flow clamp", () => {
    const parameters = inletLossParameters();
    const positive = solvePhaseB1QuasiSteadyInertialFlowRootV2({
      flowId: "Q_VC",
      pressureGradientPa: 500,
      inletLossParameters: parameters,
    });
    const negative = solvePhaseB1QuasiSteadyInertialFlowRootV2({
      flowId: "Q_PV",
      pressureGradientPa: -500,
      inletLossParameters: parameters,
    });
    const zero = solvePhaseB1QuasiSteadyInertialFlowRootV2({
      flowId: "Q_PV",
      pressureGradientPa: 0,
      inletLossParameters: parameters,
    });
    expect(positive.flowM3PerSec).toBeGreaterThan(0);
    expect(negative.flowM3PerSec).toBeLessThan(0);
    expect(negative.flowM3PerSec).toBeCloseTo(-positive.flowM3PerSec, 15);
    expect(zero.flowM3PerSec).toBe(0);
    expect(Math.abs(positive.flowAccelerationM3PerSec2)).toBeLessThan(1e-10);
    expect(Math.abs(negative.flowAccelerationM3PerSec2)).toBeLessThan(1e-10);
    expect(positive.lossDerivativePaSecPerM3).toBeGreaterThan(0);
    expect(negative.lossDerivativePaSecPerM3).toBeGreaterThan(0);
    expect(positive.zeroFlowForced).toBe(false);
    expect(PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2.projectionAllowed).toBe(false);
  });
});

function makeInput(totalBloodVolumeM3: number): PhaseB1PreAOperatingPointInputV2 {
  const initialFillingPressurePa = 800;
  const initialGuess = Object.freeze({
    chamberBloodVolumesM3: Object.freeze({
      LA: BASE_CHAMBER_VOLUME_M3.LA
        + (initialFillingPressurePa + PRESSURE_SHAPE_PA.LA)
          / CHAMBER_PRESSURE_SLOPE_PA_PER_M3,
      LV: BASE_CHAMBER_VOLUME_M3.LV
        + (initialFillingPressurePa + PRESSURE_SHAPE_PA.LV)
          / CHAMBER_PRESSURE_SLOPE_PA_PER_M3,
      RA: BASE_CHAMBER_VOLUME_M3.RA
        + (initialFillingPressurePa + PRESSURE_SHAPE_PA.RA)
          / CHAMBER_PRESSURE_SLOPE_PA_PER_M3,
      RV: BASE_CHAMBER_VOLUME_M3.RV
        + (initialFillingPressurePa + PRESSURE_SHAPE_PA.RV)
          / CHAMBER_PRESSURE_SLOPE_PA_PER_M3,
    }),
    triSegCoordinates: Object.freeze({ V_m_S: 20e-6, y_m: 0.03 }),
    commonFillingPressureOffsetPa: initialFillingPressurePa,
  });
  return Object.freeze({
    totalBloodVolumeM3,
    pressureShapePaRelativeToSvByCompartment: PRESSURE_SHAPE_PA,
    vascularComplianceParametersByCompartment: Object.freeze({
      SA: Object.freeze({
        unstressedVolumeM3: 500e-6,
        complianceM3PerPa: 11.25e-9,
        externalPressurePa: 0,
      }),
      SV: Object.freeze({
        unstressedVolumeM3: 3_300e-6,
        complianceM3PerPa: 750e-9,
        externalPressurePa: 0,
      }),
      PA: Object.freeze({
        unstressedVolumeM3: 150e-6,
        complianceM3PerPa: 30e-9,
        externalPressurePa: 0,
      }),
      PV: Object.freeze({
        unstressedVolumeM3: 250e-6,
        complianceM3PerPa: 112.5e-9,
        externalPressurePa: 0,
      }),
    }),
    peripheralResistancePaSecPerM3ByFlow: Object.freeze({
      Q_sys: 1.25e8,
      Q_pul: 1.1e7,
    }),
    valveLossParametersByFlow: Object.freeze({
      Q_MV: valveLossParameters(),
      Q_AoV: valveLossParameters(),
      Q_TV: valveLossParameters(),
      Q_PuV: valveLossParameters(),
    }),
    inletLossParametersByFlow: Object.freeze({
      Q_VC: inletLossParameters(),
      Q_PV: inletLossParameters(),
    }),
    initialGuess,
    numericalPolicy: Object.freeze({
      triSegResidualScaleNPerM: 1_000,
      chamberPressureResidualScalePa: 1_333,
    }),
    evaluateRelaxedMechanics: RELAXED_MECHANICS,
  });
}

function valveLossParameters() {
  return Object.freeze({
    openAreaM2: 5e-4,
    physiologicalRegurgitantAreaM2: 0,
    numericalReverseAreaM2: 1e-6,
    pressureGateWidthPa: 10,
    bloodDynamicViscosityPaSec: 0.0035,
    bloodDensityKgPerM3: 1_060,
    viscousEffectiveLengthM: 0.01,
    inertialEffectiveLengthM: 0.01,
    inertialReferenceAreaM2: 5e-4,
    flowSmoothingM3PerSec: 1e-9,
  });
}

function inletLossParameters() {
  return Object.freeze({
    inertancePaSec2PerM3: 2e4,
    linearResistancePaSecPerM3: 4e6,
    quadraticResistancePaSec2PerM6: 1e9,
    flowSmoothingM3PerSec: 1e-9,
  });
}
