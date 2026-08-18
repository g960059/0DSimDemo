import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
  type MainWireFiveWallMechanicalEnergyLedgerV1,
  type MainWireFiveWallMechanicalEnergyWallIdV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalEnergyLedgerV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_PROJECTION_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-energy-ledger-projection-v1" as const;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1 =
  Readonly<{
    metricId: string;
    valueMilliJ: number;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1 =
  Readonly<{
    residualId: string;
    valueMilliJ: number;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1 =
  Readonly<{
    aggregateId:
      "left-atrium" | "right-atrium" | "ventricles-combined" | "whole-heart";
    residualMilliJ: number;
    wallWorkMilliJ: number;
    cavityWorkMilliJ: number;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyLedgerProjectionV1 =
  Readonly<{
    physicalMetrics: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[];
    allFiveSlsBackwardEulerNumericalDissipationMilliJ: number;
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: number;
    conjugacy: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1[];
    algebraicResiduals: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[];
  }>;

const VENTRICULAR_WALL_IDS_V1 = Object.freeze(["LVFW", "SEP", "RVFW"] as const);

const STRESS_WORK_COMPONENTS_V1 = Object.freeze([
  ["total", "total"],
  ["landActive", "land-active"],
  ["equilibriumPassive", "equilibrium-passive"],
  ["parallelSls", "parallel-sls"],
] as const);

/**
 * Canonical compact projection of one measured five-wall ledger.
 *
 * Aggregate addition order is part of this projection owner. In particular,
 * whole-heart wall and cavity terms use the declared wall/chamber ID order and
 * are reused verbatim for the conjugacy residual. Mathematically equivalent
 * regrouping is intentionally avoided because it can differ by an ULP.
 */
export function projectMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyLedgerV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
  algebraicResidualAbsoluteToleranceMilliJ: number,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyLedgerProjectionV1 {
  const physicalMetrics: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[] =
    [];
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    const wall = ledger.perWall[wallId];
    for (const [component, componentId] of STRESS_WORK_COMPONENTS_V1) {
      physicalMetrics.push(
        Object.freeze({
          metricId: `wall.${wallId}.stress-work.${componentId}`,
          valueMilliJ: wall.stressWorkOnWallMilliJ[component],
        }),
      );
    }
    physicalMetrics.push(
      Object.freeze({
        metricId: `wall.${wallId}.equilibrium-passive-stored-energy-change`,
        valueMilliJ: wall.equilibriumPassiveStoredEnergyChangeMilliJ,
      }),
      Object.freeze({
        metricId: `wall.${wallId}.parallel-sls-stored-energy-change`,
        valueMilliJ: wall.parallelSls.storedEnergyChangeMilliJ,
      }),
      Object.freeze({
        metricId: `wall.${wallId}.sls-physical-dissipation`,
        valueMilliJ: wall.parallelSls.physicalDissipationMilliJ,
      }),
    );
  }
  for (const chamber of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1) {
    physicalMetrics.push(
      Object.freeze({
        metricId: `cavity.${chamber}.work-on-wall`,
        valueMilliJ: ledger.cavityWorkOnWallMilliJ[chamber],
      }),
    );
  }

  const allFive = aggregateMetricsV1(
    "all-five",
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
    ledger,
  );
  const ventricular = aggregateMetricsV1(
    "ventricular-walls",
    VENTRICULAR_WALL_IDS_V1,
    ledger,
  );
  physicalMetrics.push(...allFive.metrics, ...ventricular.metrics);

  const algebraicResiduals: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[] =
    [];
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    const wall = ledger.perWall[wallId];
    for (const [residualId, valueMilliJ] of [
      [`wall.${wallId}.stress-assembly`, wall.stressAssemblyResidualMilliJ],
      [
        `wall.${wallId}.parallel-sls.reported-balance`,
        wall.parallelSls.reportedDiscreteBalanceResidualMilliJ,
      ],
      [
        `wall.${wallId}.parallel-sls.reconstructed-balance`,
        wall.parallelSls.reconstructedDiscreteBalanceResidualMilliJ,
      ],
      [
        `wall.${wallId}.parallel-sls.readback-agreement`,
        wall.parallelSls.readbackAgreementResidualMilliJ,
      ],
    ] as const) {
      algebraicResiduals.push(
        Object.freeze({
          residualId,
          valueMilliJ,
          passed:
            Number.isFinite(valueMilliJ) &&
            Math.abs(valueMilliJ) <= algebraicResidualAbsoluteToleranceMilliJ,
        }),
      );
    }
  }

  const leftAtrialWall = ledger.perWall.LA.stressWorkOnWallMilliJ.total;
  const rightAtrialWall = ledger.perWall.RA.stressWorkOnWallMilliJ.total;
  const ventricularCavity = sumInDeclaredOrderV1(
    ["LV", "RV"],
    (chamber) => ledger.cavityWorkOnWallMilliJ[chamber],
  );
  const allFiveCavity = sumInDeclaredOrderV1(
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1,
    (chamber) => ledger.cavityWorkOnWallMilliJ[chamber],
  );
  const conjugacy = Object.freeze([
    conjugacyEntryV1(
      "left-atrium",
      leftAtrialWall,
      ledger.cavityWorkOnWallMilliJ.LA,
      ledger.workConjugacyResidualMilliJ.leftAtrium,
    ),
    conjugacyEntryV1(
      "right-atrium",
      rightAtrialWall,
      ledger.cavityWorkOnWallMilliJ.RA,
      ledger.workConjugacyResidualMilliJ.rightAtrium,
    ),
    conjugacyEntryV1(
      "ventricles-combined",
      ventricular.totalStressWorkMilliJ,
      ventricularCavity,
      ledger.workConjugacyResidualMilliJ.ventricularWallsCombined,
    ),
    conjugacyEntryV1(
      "whole-heart",
      allFive.totalStressWorkMilliJ,
      allFiveCavity,
      ledger.workConjugacyResidualMilliJ.allFiveWalls,
    ),
  ]);

  return Object.freeze({
    physicalMetrics: Object.freeze(physicalMetrics),
    allFiveSlsBackwardEulerNumericalDissipationMilliJ: sumInDeclaredOrderV1(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
      (wallId) =>
        ledger.perWall[wallId].parallelSls
          .backwardEulerNumericalDissipationMilliJ,
    ),
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: sumInDeclaredOrderV1(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
      (wallId) =>
        ledger.perWall[wallId].equilibriumPassiveBackwardEulerRemainderMilliJ,
    ),
    conjugacy,
    algebraicResiduals: Object.freeze(algebraicResiduals),
  });
}

function aggregateMetricsV1(
  aggregateId: "all-five" | "ventricular-walls",
  wallIds: readonly MainWireFiveWallMechanicalEnergyWallIdV1[],
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): Readonly<{
  totalStressWorkMilliJ: number;
  metrics: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[];
}> {
  const metrics: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[] =
    [];
  let totalStressWorkMilliJ = 0;
  for (const [component, componentId] of STRESS_WORK_COMPONENTS_V1) {
    const valueMilliJ = sumInDeclaredOrderV1(
      wallIds,
      (wallId) => ledger.perWall[wallId].stressWorkOnWallMilliJ[component],
    );
    if (component === "total") totalStressWorkMilliJ = valueMilliJ;
    metrics.push(
      Object.freeze({
        metricId: `aggregate.${aggregateId}.stress-work.${componentId}`,
        valueMilliJ,
      }),
    );
  }
  metrics.push(
    Object.freeze({
      metricId: `aggregate.${aggregateId}.equilibrium-passive-stored-energy-change`,
      valueMilliJ: sumInDeclaredOrderV1(
        wallIds,
        (wallId) =>
          ledger.perWall[wallId].equilibriumPassiveStoredEnergyChangeMilliJ,
      ),
    }),
    Object.freeze({
      metricId: `aggregate.${aggregateId}.parallel-sls-stored-energy-change`,
      valueMilliJ: sumInDeclaredOrderV1(
        wallIds,
        (wallId) => ledger.perWall[wallId].parallelSls.storedEnergyChangeMilliJ,
      ),
    }),
    Object.freeze({
      metricId: `aggregate.${aggregateId}.sls-physical-dissipation`,
      valueMilliJ: sumInDeclaredOrderV1(
        wallIds,
        (wallId) =>
          ledger.perWall[wallId].parallelSls.physicalDissipationMilliJ,
      ),
    }),
  );
  return Object.freeze({
    totalStressWorkMilliJ,
    metrics: Object.freeze(metrics),
  });
}

function conjugacyEntryV1(
  aggregateId: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1["aggregateId"],
  wallWorkMilliJ: number,
  cavityWorkMilliJ: number,
  residualMilliJ: number,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1 {
  return Object.freeze({
    aggregateId,
    residualMilliJ,
    wallWorkMilliJ,
    cavityWorkMilliJ,
  });
}

function sumInDeclaredOrderV1<T>(
  ids: readonly T[],
  value: (id: T) => number,
): number {
  return ids.reduce((sum, id) => sum + value(id), 0);
}
