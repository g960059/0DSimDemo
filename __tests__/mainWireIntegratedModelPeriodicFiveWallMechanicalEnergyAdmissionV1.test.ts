import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ALGEBRAIC_RESIDUAL_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CONJUGACY_AGGREGATE_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_PHYSICAL_METRIC_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_QUADRATURE_CHAMBERS_V1,
  assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1";

type Arm =
  MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1;
type Overrides = Partial<Omit<Arm, "gates">> &
  Readonly<{
    gates?: Partial<Arm["gates"]>;
  }>;

describe("periodic five-wall mechanical-energy admission V1", () => {
  it("freezes the exact sealed-only policy and reportable vectors", () => {
    const policy =
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1;

    expect(policy).toMatchObject({
      declarationStatus:
        "declared-before-new-0.5ms-mechanical-energy-ledger-result",
      requiredArmId: "normal-default",
      requiredNumericalAccessId:
        "main-wire-integrated-model-periodic-work-refinement-1ms-0.5ms-access-v1",
      requiredRequestedMaximumCycleCount: 250,
      coarseDtSec: 0.001,
      fineDtSec: 0.0005,
      physicalRefinement: {
        requiredMetricCount: 53,
        maximumScaledDifference: 0.01,
        denominatorFloorMilliJ: 1,
        signAgreementThresholdMilliJ: 1,
      },
      exactAccounting: {
        requiredResidualCount: 20,
        maximumAbsoluteResidualMilliJ: 1e-8,
      },
      finiteIncrementConjugacy: {
        maximumFineScaledResidual: 2e-3,
        coarseToFineDecreaseRequired: false,
      },
      numericalAggregates: {
        allFiveSlsBackwardEulerNumericalDissipationMinimumMilliJ: 0,
        allFiveEquilibriumPassiveBackwardEulerRemainderMinimumMilliJ: -1e-8,
        strictCoarseToFineDecreaseRequired: true,
      },
      septalAllocationPermitted: false,
      commonPericardialBagRole:
        "readback-and-characterization-only-not-admission",
      publicLiveOutputCatalogAdmissionEstablished: false,
      publicGraphCatalogAdmissionEstablished: false,
      PEEstablished: false,
      PVAEstablished: false,
      MVO2Established: false,
      ATPUseEstablished: false,
      mechanicalEfficiencyEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_PHYSICAL_METRIC_IDS_V1,
    ).toHaveLength(53);
    expect(
      new Set(
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_PHYSICAL_METRIC_IDS_V1,
      ).size,
    ).toBe(53);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ALGEBRAIC_RESIDUAL_IDS_V1,
    ).toHaveLength(20);
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.physicalRefinement.requiredMetricIds)).toBe(
      true,
    );
  });

  it("admits a complete independent normal-default refinement pair", () => {
    const coarse = arm(0.001, "a".repeat(64));
    const fine = arm(0.0005, "b".repeat(64), {
      sourceCycleIndex: 140,
      bridgeCycleIndex: 141,
      measurementCycleIndex: 142,
      rawMechanicalTraceSha256: "1".repeat(64),
      sourceCheckpointSha256: "2".repeat(64),
      bridgeTerminalAcceptedStepSampleSha256: "3".repeat(64),
      terminalCheckpointSha256: "4".repeat(64),
    });
    const result =
      assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1(
        coarse,
        fine,
      );

    expect(result.status).toBe("comparison-passed");
    expect(result.numericalAdmissionConjunctionPassed).toBe(true);
    expect(result.officialSealedMechanicalEnergyAnalysisEligible).toBe(false);
    expect(Object.values(result.gates).every(Boolean)).toBe(true);
    expect(result.physicalMetricComparisons).toHaveLength(53);
    expect(result.algebraicResidualAssessments).toHaveLength(40);
    expect(result.quadratureBridgeAssessments).toHaveLength(4);
    expect(result.conjugacyComparisons[0]).toMatchObject({
      absoluteResidualTrend: "decreased",
      finePassed: true,
    });
    expect(result.failureReasons).toEqual([]);
    expect(result).toMatchObject({
      publicLiveOutputCatalogAdmissionEstablished: false,
      publicGraphCatalogAdmissionEstablished: false,
      PEEstablished: false,
      PVAEstablished: false,
      MVO2Established: false,
      ATPUseEstablished: false,
      mechanicalEfficiencyEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });
    expect(Object.isFrozen(result.coarse.physicalMetrics)).toBe(true);
  });

  it("fails closed for matching but incomplete physical and algebraic ID sets", () => {
    const coarse = arm(0.001, "a".repeat(64));
    const fine = arm(0.0005, "b".repeat(64));
    const metric = [coarse.physicalMetrics[0]!];
    const residual = [coarse.algebraicResiduals[0]!];
    const result =
      assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1(
        { ...coarse, physicalMetrics: metric, algebraicResiduals: residual },
        { ...fine, physicalMetrics: metric, algebraicResiduals: residual },
      );

    expect(result.gates).toMatchObject({
      physicalMetricVectorsComplete: false,
      physicalMetricIdsMatch: true,
      algebraicResidualVectorsValid: false,
      algebraicResidualsPassed: false,
    });
    expect(result.failureReasons).toEqual(
      expect.arrayContaining([
        "physical-metric-vector-incomplete",
        "algebraic-residual-vector-invalid",
      ]),
    );
    expect(result.numericalAdmissionConjunctionPassed).toBe(false);
    expect(result.officialSealedMechanicalEnergyAnalysisEligible).toBe(false);
  });

  it("enforces physical, aggregate, conjugacy, algebraic, and bridge gates", () => {
    const coarseBase = arm(0.001, "a".repeat(64));
    const fineBase = arm(0.0005, "b".repeat(64));
    const coarse: Arm = {
      ...coarseBase,
      physicalMetrics: coarseBase.physicalMetrics.map((metric, index) =>
        index === 0 ? { ...metric, valueMilliJ: -10 } : metric,
      ),
      allFiveSlsBackwardEulerNumericalDissipationMilliJ: 0.2,
      allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: 0.1,
    };
    const fine: Arm = {
      ...fineBase,
      physicalMetrics: fineBase.physicalMetrics.map((metric) =>
        metric.metricId === "aggregate.all-five.stress-work.total"
          ? { ...metric, valueMilliJ: metric.valueMilliJ + 1 }
          : metric,
      ),
      allFiveSlsBackwardEulerNumericalDissipationMilliJ: 0.2,
      allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: 0.2,
      conjugacy: fineBase.conjugacy.map((entry, index) =>
        index === 0 ? { ...entry, residualMilliJ: 0.201 } : entry,
      ),
      algebraicResiduals: fineBase.algebraicResiduals.map((entry, index) =>
        index === 0
          ? { ...entry, valueMilliJ: 1.01e-8, passed: true }
          : entry.residualId.endsWith("readback-agreement")
            ? { ...entry, valueMilliJ: 1e-4, passed: true }
            : entry,
      ),
      quadratureBridges: fineBase.quadratureBridges.map((entry, index) =>
        index === 0
          ? {
              ...entry,
              backwardEulerCavityWorkOnWallMilliJ:
                entry.backwardEulerCavityWorkOnWallMilliJ + 1,
              residualMilliJ: 0,
              passed: true,
            }
          : entry,
      ),
    };
    const result =
      assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1(
        coarse,
        fine,
      );

    expect(result.gates).toMatchObject({
      physicalRefinementThresholdPassed: false,
      physicalSignAgreementPassed: false,
      aggregatePhysicalMetricSumsPassed: false,
      stressAssemblyResidualReadbacksPassed: false,
      slsBalanceResidualReadbacksPassed: false,
      numericalAggregateScalarReadbacksPassed: false,
      slsBackwardEulerNumericalDissipationStrictlyDecreased: false,
      equilibriumPassiveBackwardEulerRemainderStrictlyDecreased: false,
      fineConjugacyThresholdPassed: false,
      conjugacyResidualReadbacksPassed: false,
      conjugacyPhysicalVectorBindingsPassed: false,
      algebraicResidualsPassed: false,
      quadratureBridgesPassed: false,
      quadraturePhysicalVectorBindingsPassed: false,
    });
    expect(
      result.quadratureBridgeAssessments.find(
        ({ grid, chamber }) => grid === "fine" && chamber === "LV",
      ),
    ).toMatchObject({
      reportedResidualMilliJ: 0,
      recomputedResidualMilliJ: 1,
      residualReadbackDifferenceMilliJ: 1,
      reportedPassed: true,
      passed: false,
    });
  });

  it("requires qualified arms, exact protocol scope, hashes, and lineage", () => {
    const coarse = arm(0.001, "a".repeat(64));
    const fine = arm(0.0005, "a".repeat(64), {
      numericalAccessId: "wrong-access",
      requestedMaximumCycleCount: 249,
      bridgeCycleIndex: 103,
      bridgeAcceptedStepCount: 0,
      sourceCheckpointSha256: "invalid",
      bridgeTerminalAcceptedStepSampleSha256: null,
      status: "not-qualified",
      perStepSlsResidualEvidence: {
        assessedAcceptedStepCount: 1_002,
        assessedWallStepCount: 5_010,
        maximumAbsoluteReconstructedResidualDensityJPerM3: 0,
        maximumAbsoluteReadbackAgreementResidualDensityJPerM3: 0,
        maximumReconstructedResidualToleranceRatio: 1.01,
        maximumReadbackAgreementToleranceRatio: 0.5,
      },
      gates: {
        normalDefaultConditionPassed: false,
        sourceCheckpointExactParityPassed: false,
      },
    });
    const result =
      assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1(
        coarse,
        fine,
      );

    expect(result.gates).toMatchObject({
      bothNormalDefaultArms: false,
      bothWorkRefinementNumericalAccesses: false,
      bothCanonicalRequestedHorizons: false,
      bothSingleArmQualified: false,
      allSingleArmGatesPassed: false,
      protocolIdentitiesDistinct: false,
      bothCycleAndAcceptedStepLineagesValid: false,
      bothAcceptedPathLineagesComplete: false,
      bothCheckpointExactParitiesPassed: false,
      sourceCheckpointHashesValid: false,
      bridgeTerminalSampleHashesValid: false,
      perStepSlsResidualEvidenceValid: false,
    });
    expect(result.status).toBe("comparison-failed");
  });
});

function arm(
  nominalDtSec: 0.001 | 0.0005,
  protocolIdentityHash: string,
  overrides: Overrides = {},
): Arm {
  const scale = nominalDtSec === 0.001 ? 1.005 : 1;
  const physicalMetrics = physicalMetricVector(scale);
  const algebraicResiduals =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ALGEBRAIC_RESIDUAL_IDS_V1.map(
      (residualId) => ({ residualId, valueMilliJ: 0, passed: true }),
    );
  const numericalAggregates = numericalAggregateValues(
    physicalMetrics,
    algebraicResiduals,
  );
  const baseGates: Arm["gates"] = {
    protocolIdentityValid: true,
    modelConditionIdentityValid: true,
    normalDefaultConditionPassed: true,
    canonicalLatestPeriod1Source: true,
    sourceCycleIntegrityPassed: true,
    sourceCheckpointExactParityPassed: true,
    continuationPeriod1Passed: true,
    acceptedPathTraceComplete: true,
    finiteAcceptedReadback: true,
    materialVolumeIdentityPassed: true,
    mechanicalSourceIdentityPassed: true,
    perStepSlsPassivityPassed: true,
    perStepSlsResidualReconstructionPassed: true,
    cycleIntegratedSlsDissipationNonnegative: true,
    equilibriumPassiveBackwardEulerRemainderNonnegative: true,
    algebraicResidualsPassed: true,
    measurementExternalWorkQualified: true,
    quadratureBridgePassed: true,
    continuationCheckpointExactParityPassed: true,
  };
  const base: Arm = {
    armId: "normal-default",
    executionPurpose: "canonical-evidence",
    numericalAccessId:
      "main-wire-integrated-model-periodic-work-refinement-1ms-0.5ms-access-v1",
    requestedMaximumCycleCount: 250,
    independentColdStart: true,
    status: "qualified-for-refinement-comparison",
    nominalDtSec,
    modelConditionIdentityHash: "c".repeat(64),
    protocolIdentityHash,
    sourceCycleIndex: 100,
    sourceAcceptedStepCount: 1_000,
    bridgeCycleIndex: 101,
    bridgeAcceptedStepCount: 1_001,
    measurementCycleIndex: 102,
    measurementAcceptedStepCount: 1_002,
    gates: baseGates,
    materialVolumeBindingSha256: "d".repeat(64),
    rawMechanicalTraceSha256:
      nominalDtSec === 0.001 ? "e".repeat(64) : "f".repeat(64),
    sourceCheckpointSha256:
      nominalDtSec === 0.001 ? "1".repeat(64) : "2".repeat(64),
    bridgeTerminalAcceptedStepSampleSha256:
      nominalDtSec === 0.001 ? "3".repeat(64) : "4".repeat(64),
    terminalCheckpointSha256:
      nominalDtSec === 0.001 ? "5".repeat(64) : "6".repeat(64),
    physicalMetrics,
    allFiveSlsBackwardEulerNumericalDissipationMilliJ: numericalAggregates.sls,
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ:
      numericalAggregates.passive,
    conjugacy: conjugacyVector(physicalMetrics),
    algebraicResiduals,
    quadratureBridges: quadratureVector(physicalMetrics),
    perStepSlsResidualEvidence: {
      assessedAcceptedStepCount: 1_002,
      assessedWallStepCount: 5_010,
      maximumAbsoluteReconstructedResidualDensityJPerM3: 1e-12,
      maximumAbsoluteReadbackAgreementResidualDensityJPerM3: 1e-12,
      maximumReconstructedResidualToleranceRatio: 0.5,
      maximumReadbackAgreementToleranceRatio: 0.5,
    },
  };
  const { gates, ...topLevel } = overrides;
  return { ...base, ...topLevel, gates: { ...baseGates, ...gates } };
}

function physicalMetricVector(scale: number): Arm["physicalMetrics"] {
  const values = new Map<string, number>();
  const walls = ["LA", "LVFW", "SEP", "RVFW", "RA"] as const;
  for (const [index, wall] of walls.entries()) {
    const total = 10 + index;
    const landActive = 2 + index * 0.1;
    const equilibriumPassive = 3 + index * 0.1;
    const parallelSls = total - landActive - equilibriumPassive;
    values.set(`wall.${wall}.stress-work.total`, total);
    values.set(`wall.${wall}.stress-work.land-active`, landActive);
    values.set(
      `wall.${wall}.stress-work.equilibrium-passive`,
      equilibriumPassive,
    );
    values.set(`wall.${wall}.stress-work.parallel-sls`, parallelSls);
    values.set(
      `wall.${wall}.equilibrium-passive-stored-energy-change`,
      1 + index * 0.1,
    );
    values.set(
      `wall.${wall}.parallel-sls-stored-energy-change`,
      1 + index * 0.1,
    );
    values.set(`wall.${wall}.sls-physical-dissipation`, 0.5 + index * 0.05);
  }
  values.set("cavity.LA.work-on-wall", 9.985);
  values.set("cavity.LV.work-on-wall", 17.99);
  values.set("cavity.RA.work-on-wall", 13.985);
  values.set("cavity.RV.work-on-wall", 17.99);
  const suffixes = [
    "stress-work.total",
    "stress-work.land-active",
    "stress-work.equilibrium-passive",
    "stress-work.parallel-sls",
    "equilibrium-passive-stored-energy-change",
    "parallel-sls-stored-energy-change",
    "sls-physical-dissipation",
  ] as const;
  for (const aggregate of ["all-five", "ventricular-walls"] as const) {
    const aggregateWalls: readonly string[] =
      aggregate === "all-five" ? walls : (["LVFW", "SEP", "RVFW"] as const);
    for (const suffix of suffixes) {
      values.set(
        `aggregate.${aggregate}.${suffix}`,
        aggregateWalls.reduce<number>(
          (sum, wall) => sum + values.get(`wall.${wall}.${suffix}`)!,
          0,
        ),
      );
    }
  }
  return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_PHYSICAL_METRIC_IDS_V1.map(
    (metricId) => ({
      metricId,
      valueMilliJ: values.get(metricId)! * scale,
    }),
  );
}

function numericalAggregateValues(
  metrics: Arm["physicalMetrics"],
  residuals: Arm["algebraicResiduals"],
): Readonly<{ sls: number; passive: number }> {
  const metric = new Map(
    metrics.map((entry) => [entry.metricId, entry.valueMilliJ]),
  );
  const residual = new Map(
    residuals.map((entry) => [entry.residualId, entry.valueMilliJ]),
  );
  const reconstructedSum = ["LA", "LVFW", "SEP", "RVFW", "RA"].reduce(
    (sum, wall) =>
      sum + residual.get(`wall.${wall}.parallel-sls.reconstructed-balance`)!,
    0,
  );
  return Object.freeze({
    sls:
      metric.get("aggregate.all-five.stress-work.parallel-sls")! -
      metric.get("aggregate.all-five.parallel-sls-stored-energy-change")! -
      metric.get("aggregate.all-five.sls-physical-dissipation")! -
      reconstructedSum,
    passive:
      metric.get("aggregate.all-five.stress-work.equilibrium-passive")! -
      metric.get(
        "aggregate.all-five.equilibrium-passive-stored-energy-change",
      )!,
  });
}

function conjugacyVector(metrics: Arm["physicalMetrics"]): Arm["conjugacy"] {
  const metric = new Map(
    metrics.map((entry) => [entry.metricId, entry.valueMilliJ]),
  );
  const values = {
    "left-atrium": {
      wall: metric.get("wall.LA.stress-work.total")!,
      cavity: metric.get("cavity.LA.work-on-wall")!,
    },
    "right-atrium": {
      wall: metric.get("wall.RA.stress-work.total")!,
      cavity: metric.get("cavity.RA.work-on-wall")!,
    },
    "ventricles-combined": {
      wall: metric.get("aggregate.ventricular-walls.stress-work.total")!,
      cavity:
        metric.get("cavity.LV.work-on-wall")! +
        metric.get("cavity.RV.work-on-wall")!,
    },
    "whole-heart": {
      wall: metric.get("aggregate.all-five.stress-work.total")!,
      cavity:
        metric.get("cavity.LA.work-on-wall")! +
        metric.get("cavity.LV.work-on-wall")! +
        metric.get("cavity.RA.work-on-wall")! +
        metric.get("cavity.RV.work-on-wall")!,
    },
  } as const;
  return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CONJUGACY_AGGREGATE_IDS_V1.map(
    (aggregateId) => ({
      aggregateId,
      residualMilliJ: values[aggregateId].wall - values[aggregateId].cavity,
      wallWorkMilliJ: values[aggregateId].wall,
      cavityWorkMilliJ: values[aggregateId].cavity,
    }),
  );
}

function quadratureVector(
  metrics: Arm["physicalMetrics"],
): Arm["quadratureBridges"] {
  const metric = new Map(
    metrics.map((entry) => [entry.metricId, entry.valueMilliJ]),
  );
  return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_QUADRATURE_CHAMBERS_V1.map(
    (chamber) => {
      const backwardEulerCavityWorkOnWallMilliJ = metric.get(
        `cavity.${chamber}.work-on-wall`,
      )!;
      const trapezoidalExternalWorkMilliJ = -8;
      return {
        chamber,
        backwardEulerCavityWorkOnWallMilliJ,
        trapezoidalExternalWorkMilliJ,
        endpointCorrectionMilliJ:
          backwardEulerCavityWorkOnWallMilliJ + trapezoidalExternalWorkMilliJ,
        residualMilliJ: 0,
        passed: true,
      };
    },
  );
}
