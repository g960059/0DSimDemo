import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberFlowId,
  type FourChamberWallId,
  type InertialFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  PHASE_B0_CLOSED_LOOP_FLOW_IDS_V1,
  PHASE_B0_INCIDENCE_MATRIX_V1,
  evaluatePhaseB0BackwardEulerVolumeResidualV1,
  evaluatePhaseB0VolumeRatesV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/incidenceLedgerV1";
import {
  PHASE_B0_NUMERICAL_REVERSE_AREA_RATIO_CANDIDATES_V1,
  buildPhaseB0ValveNumericalPolicyCandidateV1,
  phaseB0ValveNumericalPolicyHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/valveNumericalPolicyV1";
import {
  evaluatePhaseB0SmoothActiveStressDoubleV1,
  type PhaseB0SmoothActiveStressDoubleParametersV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/smoothActiveStressDoubleV1";
import {
  PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
  auditPhaseB0AlgorithmicJacobianDirectionV1,
  evaluatePhaseB0AlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import {
  PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1,
  PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1,
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
  evaluatePublishedTaylorTriSegStagePowerAuditV1,
  evaluateWholeHeartBackwardEulerStepEnergyAuditV1,
  evaluateWholeHeartEndpointStoredEnergyV1,
  evaluateWholeHeartStagePowerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/wholeHeartEnergyLedgerV1";
import { canonicalizeJson } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  diagnoseScaledJacobian2x2V1,
  solveScaledDampedNewtonV1,
  solveScaledDensePartialPivotLuV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import { FOUR_CHAMBER_PHASE_B0_STATUS_V1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/phaseB0ReadinessV1";

describe("four-chamber Phase B0 conservative contracts", () => {
  it("derives all eight volume balances from one zero-column-sum incidence matrix", () => {
    expect(PHASE_B0_INCIDENCE_MATRIX_V1).toHaveLength(8);
    expect(PHASE_B0_INCIDENCE_MATRIX_V1.every((row) => row.length === 8)).toBe(true);
    for (let column = 0; column < 8; column += 1) {
      const entries = PHASE_B0_INCIDENCE_MATRIX_V1.map((row) => row[column]);
      expect(entries.filter((entry) => entry === -1)).toHaveLength(1);
      expect(entries.filter((entry) => entry === 1)).toHaveLength(1);
      expect(entries.reduce<number>((sum, entry) => sum + entry, 0)).toBe(0);
    }

    const flows = flowRecord((_, index) => (index - 3) * 7e-6);
    const rates = evaluatePhaseB0VolumeRatesV1(flows);
    expect(Math.abs(rates.totalVolumeRateM3PerSec)).toBeLessThan(1e-20);
    expect(rates.bloodVolumeProjectionApplied).toBe(false);
    expect(rates.flowClampApplied).toBe(false);

    const dtSec = 1e-3;
    const previous = volumeRecord((_, index) => (100 + 10 * index) * 1e-6);
    const next = volumeRecord((compartment) =>
      previous[compartment] + dtSec * rates.volumeRatesM3PerSec[compartment]);
    const residual = evaluatePhaseB0BackwardEulerVolumeResidualV1({
      previousVolumesM3: previous,
      nextVolumesM3: next,
      nextFlowsM3PerSec: flows,
      dtSec,
    });
    expect(residual.maximumAbsoluteResidualM3PerSec).toBeLessThan(3e-17);
    expect(Math.abs(residual.totalBloodVolumeChangeM3)).toBeLessThan(3e-19);
    expect(residual.fallbackApplied).toBe(false);
  });

  it("hashes an unselected valve-floor candidate without turning it into physiology", () => {
    expect(PHASE_B0_NUMERICAL_REVERSE_AREA_RATIO_CANDIDATES_V1).toEqual([1e-2, 3e-3, 1e-3]);
    const candidate = buildPhaseB0ValveNumericalPolicyCandidateV1({
      nominalSetId: "phase-b0-symmetric-test-valves-v1",
      evidenceClass: "project-synthetic-test-only-nominal",
      numericalReverseAreaRatio: 3e-3,
      baselineOpenAreaM2ByValve: valveRecord(() => 3e-4),
      pressureGateWidthPaByValve: valveRecord(() => 20),
      flowSmoothingM3PerSecByValve: valveRecord(() => 1e-9),
    }, sha256);
    expect(candidate.absoluteNumericalReverseAreaM2ByValve.Q_MV).toBe(9e-7);
    expect(candidate.absoluteNumericalReverseAreaFrozenAfterBuild).toBe(true);
    expect(candidate.selectionClaims).toEqual({
      floorSelectionCompleted: false,
      physiologicalValidationClaimed: false,
      clinicalReleaseEligibilityClaimed: false,
    });
    expect(candidate.contentSha256).toBe(
      sha256(canonicalizeJson(phaseB0ValveNumericalPolicyHashPayloadV1(candidate))),
    );
    expect(() => buildPhaseB0ValveNumericalPolicyCandidateV1({
      nominalSetId: "invalid",
      evidenceClass: "project-synthetic-test-only-nominal",
      numericalReverseAreaRatio: 2e-3 as never,
      baselineOpenAreaM2ByValve: valveRecord(() => 3e-4),
      pressureGateWidthPaByValve: valveRecord(() => 20),
      flowSmoothingM3PerSecByValve: valveRecord(() => 1e-9),
    }, sha256)).toThrow(/1e-2, 3e-3, or 1e-3/);
  });

  it("keeps the smooth active-stress double periodic, differentiable, and test-only", () => {
    const parameters = activeParameters();
    const timeSec = 0.137;
    const evaluation = evaluatePhaseB0SmoothActiveStressDoubleV1(timeSec, parameters);
    const periodic = evaluatePhaseB0SmoothActiveStressDoubleV1(
      timeSec + parameters.periodSec,
      parameters,
    );
    expect(evaluation.testOnly).toBe(true);
    expect(evaluation.releaseRuntimeReachable).toBe(false);
    expect(evaluation.stressClampApplied).toBe(false);
    expect(evaluation.fallbackApplied).toBe(false);
    for (const wallId of WALL_IDS) {
      expect(periodic.walls[wallId].scalarKirchhoffFiberStressPa)
        .toBeCloseTo(evaluation.walls[wallId].scalarKirchhoffFiberStressPa, 11);
      const step = 1e-7;
      const derivative = (
        evaluatePhaseB0SmoothActiveStressDoubleV1(timeSec + step, parameters)
          .walls[wallId].scalarKirchhoffFiberStressPa
        - evaluatePhaseB0SmoothActiveStressDoubleV1(timeSec - step, parameters)
          .walls[wallId].scalarKirchhoffFiberStressPa
      ) / (2 * step);
      expect(relativeError(
        derivative,
        evaluation.walls[wallId].scalarKirchhoffFiberStressTimeDerivativePaPerSec,
      )).toBeLessThan(1e-8);
    }
  });

  it("verifies the injected five-point scaled Jacobian against analytic and independent directions", () => {
    const residual = (x: readonly number[]) => [
      3 * x[0] * x[0] + Math.sin(x[1]),
      Math.exp(x[0] - x[1]),
    ];
    const point = [0.7, -0.2];
    const options = {
      unknownScales: [2, 0.5],
      residualScales: [4, 3],
      lowerBounds: [null, null],
      scaledStep: 2 ** -12,
    } as const;
    const result = evaluatePhaseB0AlgorithmicJacobianV1(residual, point, options);
    expect(result.algorithmId)
      .toBe("phase-b0-scaled-five-point-algorithmic-jacobian-v1");
    expect(result.algorithmId)
      .toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);
    expect(Object.keys(result)).toEqual([
      "algorithmId",
      "rawJacobian",
      "scaledJacobian",
      "stencilByColumn",
      "scaledStep",
    ]);
    expect(result.stencilByColumn).toEqual([
      "centered-five-point",
      "centered-five-point",
    ]);
    const exact = [
      [6 * point[0], Math.cos(point[1])],
      [Math.exp(point[0] - point[1]), -Math.exp(point[0] - point[1])],
    ];
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 2; column += 1) {
        expect(relativeError(result.rawJacobian[row][column], exact[row][column]))
          .toBeLessThan(2e-11);
      }
    }
    const audit = auditPhaseB0AlgorithmicJacobianDirectionV1(
      residual,
      point,
      [0.4, -0.9],
      result,
      options,
      2 ** -15,
    );
    expect(audit.maximumRelativeDifference).toBeLessThan(2e-8);
    expect(audit.algorithmId).toBe(PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID);

    const nearLowerBound = evaluatePhaseB0AlgorithmicJacobianV1(
      (x) => [x[0] * x[0]],
      [1e-8],
      {
        unknownScales: [1],
        residualScales: [1],
        lowerBounds: [0],
        scaledStep: 1e-4,
      },
    );
    expect(nearLowerBound.stencilByColumn).toEqual(["forward-five-point"]);
  });

  it("solves scaled Newton systems transactionally and reports 2x2 conditioning", () => {
    const initial = Object.freeze([0.2, 3]);
    const solved = solveScaledDampedNewtonV1({
      initialUnknowns: initial,
      unknownScales: [1, 2],
      residualScales: [1, 4],
      strictLowerBounds: [0, null],
      evaluate: (unknowns) => ({
        status: "ok",
        residual: [unknowns[0] ** 2 - 2, unknowns[1] - 1],
        jacobianRowMajor: [2 * unknowns[0], 0, 0, 1],
      }),
      options: {
        residualInfinityTolerance: 1e-13,
        updateInfinityTolerance: 1e-13,
      },
    });
    expect(solved.converged).toBe(true);
    if (!solved.converged) return;
    expect(solved.unknowns[0]).toBeCloseTo(Math.sqrt(2), 12);
    expect(solved.unknowns[1]).toBeCloseTo(1, 14);
    expect(initial).toEqual([0.2, 3]);
    expect(solved.diagnostics.finalResidualInfinityNorm).toBeLessThan(1e-8);
    expect(solved.diagnostics.finalUpdateInfinityNorm).toBeLessThan(1e-8);

    const oneUpdate = solveScaledDampedNewtonV1({
      initialUnknowns: [0],
      unknownScales: [1],
      residualScales: [1],
      evaluate: (unknowns) => ({
        status: "ok",
        residual: [unknowns[0] - 1],
        jacobianRowMajor: [1],
      }),
      options: { maxIterations: 1 },
    });
    expect(oneUpdate.converged).toBe(true);
    if (oneUpdate.converged) {
      expect(oneUpdate.unknowns[0]).toBe(1);
      expect(oneUpdate.diagnostics.acceptedStepCount).toBe(1);
    }

    const smallResidualLargeCorrection = solveScaledDampedNewtonV1({
      initialUnknowns: [0],
      unknownScales: [1],
      residualScales: [1],
      evaluate: (unknowns) => ({
        status: "ok",
        residual: [5e-9 + 1e-20 * unknowns[0]],
        jacobianRowMajor: [1e-20],
      }),
    });
    expect(smallResidualLargeCorrection.converged).toBe(true);
    if (smallResidualLargeCorrection.converged) {
      expect(smallResidualLargeCorrection.diagnostics.acceptedStepCount).toBe(1);
      expect(Math.abs(smallResidualLargeCorrection.unknowns[0])).toBeGreaterThan(1e11);
    }

    const failed = solveScaledDampedNewtonV1({
      initialUnknowns: initial,
      unknownScales: [1, 1],
      residualScales: [1, 1],
      evaluate: () => ({ status: "failed", reason: "deliberate model failure" }),
    });
    expect(failed.converged).toBe(false);
    if (failed.converged === true) return;
    expect(failed.unknowns).toEqual(initial);
    expect(failed.reason).toBe("model-evaluation-failed");

    const lu = solveScaledDensePartialPivotLuV1([0, 2, 1, 3], [4, 7]);
    expect(lu.success).toBe(true);
    if (lu.success) {
      expect(lu.solution[0]).toBeCloseTo(1, 14);
      expect(lu.solution[1]).toBeCloseTo(2, 14);
      expect(lu.diagnostics.rowSwapCount).toBe(1);
    }
    const smallMatrixLu = solveScaledDensePartialPivotLuV1(
      [1e-12, 0, 0.5e-12, 1e-12],
      [1e-12, 1.5e-12],
    );
    expect(smallMatrixLu.success).toBe(true);
    if (smallMatrixLu.success) {
      expect(smallMatrixLu.diagnostics.pivotGrowthFactor).toBeCloseTo(1, 14);
    }
    const conditioning = diagnoseScaledJacobian2x2V1([3, 0, 0, 0.5]);
    expect(conditioning.sigmaMaximum).toBeCloseTo(3, 14);
    expect(conditioning.sigmaMinimum).toBeCloseTo(0.5, 14);
    expect(conditioning.conditionNumber2).toBeCloseTo(6, 14);
    expect(conditioning.numericallySingular).toBe(false);
  });

  it("keeps Taylor geometry defect explicit in SLS-on and SLS-off whole-heart ledgers", () => {
    const previous = endpointEnergy("on", 1);
    const next = endpointEnergy("on", 1.01);
    const delta = next.totals.storedEnergyJ - previous.totals.storedEnergyJ;
    const dtSec = 0.01;
    const stage = evaluateWholeHeartStagePowerV1({
      storedEnergyRateW: delta / dtSec,
      peripheralDissipationW: { systemic: 0.02, pulmonary: 0.01 },
      signedEdgeDissipationByEdgeW: inertialRecord(() => 0.005),
      sls: { mode: "on", slsByWallW: wallRecord(() => 0.002) },
      activeMechanicalOutputPowerByWallW: wallRecord(() => 0.01),
      prescribedExternalEnvironmentPowerExcludingPericardium: {
        powerW: -0.03,
        convention: PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1,
        pericardialPressureWorkIncluded: false,
      },
      rawPublishedTaylorGeometryPowerResidual: {
        powerResidualW: 0.04,
        assembly: "published-Taylor-2009",
        definition: PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1,
        workConjugacyProven: false,
      },
    });
    expect(stage.publishedTaylorGeometryPowerTreatment).toMatchObject({
      rawResidualRetained: true,
      subtractedFromEnergyResidual: true,
      workConjugacyProven: false,
    });
    const audit = evaluateWholeHeartBackwardEulerStepEnergyAuditV1({
      previousEndpoint: previous,
      nextEndpoint: next,
      endpointStage: stage,
      dtSec,
    });
    expect(audit.workConjugacyClaimed).toBe(false);
    expect(audit.normalization.denominatorJ).toBeGreaterThan(0);
    expect(Number.isFinite(audit.normalization.rho)).toBe(true);

    const off = endpointEnergy("off", 1);
    expect(off.sls).toEqual({ mode: "off", slsByWallJ: {} });
    expect(() => evaluateWholeHeartEndpointStoredEnergyV1({
      vascularByCompartmentJ: { SA: 1, SV: 1, PA: 1, PV: 1 },
      pericardialJ: 0,
      equilibriumPassiveByWallJ: wallRecord(() => 1),
      sls: { mode: "off", slsByWallJ: { LA: 1 } as never },
      inertialByEdgeJ: inertialRecord(() => 1),
    })).toThrow(/must contain exactly/);
    expect(() => evaluateWholeHeartStagePowerV1({
      storedEnergyRateW: 0,
      peripheralDissipationW: { systemic: -1, pulmonary: 0 },
      signedEdgeDissipationByEdgeW: inertialRecord(() => 0),
      sls: { mode: "off", slsByWallW: {} },
      activeMechanicalOutputPowerByWallW: wallRecord(() => 0),
      prescribedExternalEnvironmentPowerExcludingPericardium: {
        powerW: 0,
        convention: PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1,
        pericardialPressureWorkIncluded: false,
      },
      rawPublishedTaylorGeometryPowerResidual: {
        powerResidualW: 0,
        assembly: "published-Taylor-2009",
        definition: PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1,
        workConjugacyProven: false,
      },
    })).toThrow(/nonnegative/);
  });

  it("computes the raw published-Taylor power residual and normalization from signed terms", () => {
    const audit = evaluatePublishedTaylorTriSegStagePowerAuditV1({
      wallMechanicalPowerByWallW: { LVFW: 2, SEP: -3, RVFW: 5 },
      hydraulicPowerW: { LV: 7, RV: -11 },
    });
    const expectedRawResidualW = (2 - 3 + 5) - 7 - (-11);
    const expectedDenominatorW = WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1
      + Math.abs(2) + Math.abs(-3) + Math.abs(5) + Math.abs(7) + Math.abs(-11);
    expect(audit.rawGeometryPowerResidualW).toBe(expectedRawResidualW);
    expect(audit.normalization.numeratorW).toBe(Math.abs(expectedRawResidualW));
    expect(audit.normalization.denominatorW).toBe(expectedDenominatorW);
    expect(audit.normalization.rhoStage)
      .toBe(Math.abs(expectedRawResidualW) / expectedDenominatorW);
    expect(audit.workConjugacyClaimed).toBe(false);
  });

  it("keeps the B0 active double and solver unreachable from release runtime entrypoints", () => {
    const sourceRoots = [
      "engine",
      "components",
      "contexts",
      "data",
      "features",
      "hooks",
      "locales",
      "utils",
    ];
    const nestedSourceFiles = sourceRoots.flatMap((relativeRoot) =>
      collectTypeScriptFiles(resolve(process.cwd(), relativeRoot)));
    const topLevelSourceFiles = readdirSync(process.cwd(), { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name))
      .map((entry) => resolve(process.cwd(), entry.name));
    const testOnlySidecarDirectories = [
      "engine/myocardium/fourChamberV1/phaseB0",
      "engine/myocardium/fourChamberV1/phaseB1",
      "engine/myocardium/fourChamberV1/calibration",
    ].map((path) => resolve(process.cwd(), path));
    const releaseBoundaryFiles = [...nestedSourceFiles, ...topLevelSourceFiles]
      .filter((absolutePath) => !testOnlySidecarDirectories.some(
        (directory) => absolutePath.startsWith(`${directory}${sep}`),
      ));
    expect(releaseBoundaryFiles.length).toBeGreaterThan(4);
    for (const absolutePath of releaseBoundaryFiles) {
      const source = readFileSync(absolutePath, "utf8");
      expect(source).not.toMatch(
        /phaseB0|PHASE_B0|phaseB1|PHASE_B1|SmoothActiveStressDouble/,
      );
    }
    const publicFourChamberIndex = readFileSync(
      resolve(process.cwd(), "engine/myocardium/fourChamberV1/index.ts"),
      "utf8",
    );
    expect(publicFourChamberIndex).not.toMatch(/fourChamberV1\/calibration/);
    expect(FOUR_CHAMBER_PHASE_B0_STATUS_V1.runtimeBoundary).toEqual({
      testOnly: true,
      releaseRuntimeReachable: false,
      exportedFromFourChamberMainIndex: false,
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      mechanics2Dependency: false,
    });
  });
});

function endpointEnergy(mode: "on" | "off", factor: number) {
  return evaluateWholeHeartEndpointStoredEnergyV1({
    vascularByCompartmentJ: { SA: factor, SV: 2 * factor, PA: factor, PV: factor },
    pericardialJ: 0.5 * factor,
    equilibriumPassiveByWallJ: wallRecord(() => 0.1 * factor),
    sls: mode === "on"
      ? { mode: "on", slsByWallJ: wallRecord(() => 0.02 * factor) }
      : { mode: "off", slsByWallJ: {} },
    inertialByEdgeJ: inertialRecord(() => 0.03 * factor),
  });
}

function activeParameters(): PhaseB0SmoothActiveStressDoubleParametersV1 {
  return {
    parameterSetId: "phase-b0-contract-test-double-v1",
    evidenceClass: "project-synthetic-test-only",
    periodSec: 0.8,
    walls: wallRecord((_, index) => ({
      baselineStressPa: 1_000 + 100 * index,
      pulseAmplitudePa: 500 + 50 * index,
      peakPhaseFraction: (0.1 * index) % 1,
    })),
    testOnly: true,
    releaseRuntimeReachable: false,
  };
}

function flowRecord(
  value: (id: FourChamberFlowId, index: number) => number,
): Record<FourChamberFlowId, number> {
  return Object.fromEntries(PHASE_B0_CLOSED_LOOP_FLOW_IDS_V1.map((id, index) => [
    id,
    value(id, index),
  ])) as Record<FourChamberFlowId, number>;
}

function volumeRecord(
  value: (id: BloodCompartmentId, index: number) => number,
): Record<BloodCompartmentId, number> {
  return Object.fromEntries(BLOOD_COMPARTMENT_IDS.map((id, index) => [
    id,
    value(id, index),
  ])) as Record<BloodCompartmentId, number>;
}

function wallRecord<T>(
  value: (id: FourChamberWallId, index: number) => T,
): Record<FourChamberWallId, T> {
  return Object.fromEntries(WALL_IDS.map((id, index) => [id, value(id, index)])) as
    Record<FourChamberWallId, T>;
}

function inertialRecord(
  value: (id: InertialFlowId, index: number) => number,
): Record<InertialFlowId, number> {
  return Object.fromEntries(INERTIAL_FLOW_IDS.map((id, index) => [id, value(id, index)])) as
    Record<InertialFlowId, number>;
}

function valveRecord<T>(value: (index: number) => T) {
  return {
    Q_MV: value(0),
    Q_AoV: value(1),
    Q_TV: value(2),
    Q_PuV: value(3),
  };
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(actual), Math.abs(expected), 1e-14);
}

function collectTypeScriptFiles(absoluteDirectory: string): string[] {
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(absoluteDirectory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(absolutePath);
    return entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}
