import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1,
  type MainWireFiveWallMechanicalPortLedgerV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalPortLedgerEngineeringV1";
import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROJECTION_V1_ID,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1,
  type MainWireFiveWallMechanicalPortLedgerAlgebraicResidualMetricIdV1,
  type MainWireFiveWallMechanicalPortLedgerClosureMetricIdV1,
  type MainWireFiveWallMechanicalPortLedgerFiniteLimitMetricIdV1,
  type MainWireFiveWallMechanicalPortLedgerZeroLimitMetricIdV1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmIdV1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerNominalDtSecV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationDefinitionV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export type MainWireFiveWallMechanicalPortLedgerMetricV1<
  TMetricId extends string,
> = Readonly<{
  metricId: TMetricId;
  valueMilliJ: number;
}>;

export type MainWireFiveWallMechanicalPortLedgerDtProjectionPayloadV1 =
  Readonly<{
    projectionOwnerId: typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROJECTION_V1_ID;
    armId: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmIdV1;
    nominalDtSec: MainWireIntegratedModelPeriodicMechanicalPortLedgerNominalDtSecV1;
    sourceLedgerId: typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID;
    sourceLedgerSha256: string;
    intervalCount: number;
    elapsedTimeSec: number;
    minimumAcceptedDtSec: number;
    maximumAcceptedDtSec: number;
    finiteLimitMetrics: readonly MainWireFiveWallMechanicalPortLedgerMetricV1<MainWireFiveWallMechanicalPortLedgerFiniteLimitMetricIdV1>[];
    zeroLimitMetrics: readonly MainWireFiveWallMechanicalPortLedgerMetricV1<MainWireFiveWallMechanicalPortLedgerZeroLimitMetricIdV1>[];
    closureMetrics: readonly MainWireFiveWallMechanicalPortLedgerMetricV1<MainWireFiveWallMechanicalPortLedgerClosureMetricIdV1>[];
    algebraicResidualMetrics: readonly MainWireFiveWallMechanicalPortLedgerMetricV1<MainWireFiveWallMechanicalPortLedgerAlgebraicResidualMetricIdV1>[];
  }>;

export type MainWireFiveWallMechanicalPortLedgerDtProjectionV1 = Readonly<{
  payload: MainWireFiveWallMechanicalPortLedgerDtProjectionPayloadV1;
  payloadSha256: string;
}>;

export type MainWireFiveWallMechanicalPortLedgerOrderV1 = Readonly<{
  status: "defined" | "undefined";
  value: number | null;
  reason: "left-zero" | "right-zero" | "both-zero" | null;
}>;

export type MainWireFiveWallMechanicalPortLedgerFiniteLimitCharacterizationV1 =
  Readonly<{
    metricId: MainWireFiveWallMechanicalPortLedgerFiniteLimitMetricIdV1;
    valueMilliJ: Readonly<{ coarse: number; middle: number; fine: number }>;
    signClass: Readonly<{
      coarse: "negative" | "zero" | "positive";
      middle: "negative" | "zero" | "positive";
      fine: "negative" | "zero" | "positive";
    }>;
    signConsistent: boolean;
    coarseMiddleAbsoluteDifferenceMilliJ: number;
    middleFineAbsoluteDifferenceMilliJ: number;
    coarseMiddleScaledDifference: number;
    middleFineScaledDifference: number;
    adjacentDifferenceShrank: boolean;
    differenceOrder: MainWireFiveWallMechanicalPortLedgerOrderV1;
  }>;

export type MainWireFiveWallMechanicalPortLedgerZeroLimitCharacterizationV1 =
  Readonly<{
    metricId: MainWireFiveWallMechanicalPortLedgerZeroLimitMetricIdV1;
    valueMilliJ: Readonly<{ coarse: number; middle: number; fine: number }>;
    magnitudeMilliJ: Readonly<{
      coarse: number;
      middle: number;
      fine: number;
    }>;
    coarseToMiddleMagnitudeDecreased: boolean;
    middleToFineMagnitudeDecreased: boolean;
    coarseToMiddleOrder: MainWireFiveWallMechanicalPortLedgerOrderV1;
    middleToFineOrder: MainWireFiveWallMechanicalPortLedgerOrderV1;
  }>;

export type MainWireFiveWallMechanicalPortLedgerClosureCharacterizationV1 =
  Readonly<{
    metricId: MainWireFiveWallMechanicalPortLedgerClosureMetricIdV1;
    valueMilliJ: Readonly<{ coarse: number; middle: number; fine: number }>;
    magnitudeMilliJ: Readonly<{
      coarse: number;
      middle: number;
      fine: number;
    }>;
    signClass: Readonly<{
      coarse: "negative" | "zero" | "positive";
      middle: "negative" | "zero" | "positive";
      fine: "negative" | "zero" | "positive";
    }>;
  }>;

export type MainWireFiveWallMechanicalPortLedgerAlgebraicResidualCharacterizationV1 =
  Readonly<{
    metricId: MainWireFiveWallMechanicalPortLedgerAlgebraicResidualMetricIdV1;
    valueMilliJ: Readonly<{ coarse: number; middle: number; fine: number }>;
    maximumAbsoluteValueMilliJ: number;
  }>;

export type MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationPayloadV1 =
  Readonly<{
    projectionOwnerId: typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROJECTION_V1_ID;
    projectionPayloadSha256ByArm: Readonly<{
      coarse: string;
      middle: string;
      fine: string;
    }>;
    finiteLimit: readonly MainWireFiveWallMechanicalPortLedgerFiniteLimitCharacterizationV1[];
    zeroLimit: readonly MainWireFiveWallMechanicalPortLedgerZeroLimitCharacterizationV1[];
    closure: readonly MainWireFiveWallMechanicalPortLedgerClosureCharacterizationV1[];
    algebraicResidual: readonly MainWireFiveWallMechanicalPortLedgerAlgebraicResidualCharacterizationV1[];
    descriptiveSummary: Readonly<{
      finiteLimitMetricCount: 25;
      finiteLimitSignConsistentCount: number;
      finiteLimitAdjacentDifferenceShrankCount: number;
      zeroLimitMetricCount: 21;
      zeroLimitCoarseToMiddleMagnitudeDecreasedCount: number;
      zeroLimitMiddleToFineMagnitudeDecreasedCount: number;
      closureMetricCount: 11;
      algebraicResidualMetricCount: 20;
      maximumAbsoluteAlgebraicResidualMilliJ: number;
      numericalTrendIsQualificationGate: false;
    }>;
  }>;

export type MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationV1 =
  Readonly<{
    payload: MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationPayloadV1;
    payloadSha256: string;
  }>;

export async function projectMainWireFiveWallMechanicalPortLedgerDtV1(
  armId: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmIdV1,
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
): Promise<MainWireFiveWallMechanicalPortLedgerDtProjectionV1> {
  const arm =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1.find(
      (candidate) => candidate.armId === armId,
    );
  if (arm === undefined) throw new Error("mechanical-port dt arm is unknown");
  assertLedgerEnvelopeV1(ledger);
  const payload = deepFreeze({
    projectionOwnerId:
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROJECTION_V1_ID,
    armId,
    nominalDtSec: arm.nominalDtSec,
    sourceLedgerId: ledger.ledgerId,
    sourceLedgerSha256: await sha256CanonicalJsonHex(ledger),
    intervalCount: ledger.intervalCount,
    elapsedTimeSec: ledger.elapsedTimeSec,
    minimumAcceptedDtSec: ledger.minimumAcceptedDtSec,
    maximumAcceptedDtSec: ledger.maximumAcceptedDtSec,
    finiteLimitMetrics: finiteLimitMetricsV1(ledger),
    zeroLimitMetrics: zeroLimitMetricsV1(ledger),
    closureMetrics: closureMetricsV1(ledger),
    algebraicResidualMetrics: algebraicResidualMetricsV1(ledger),
  }) satisfies MainWireFiveWallMechanicalPortLedgerDtProjectionPayloadV1;
  return deepFreeze({
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1(
  projections: readonly MainWireFiveWallMechanicalPortLedgerDtProjectionV1[],
): Promise<MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationV1> {
  for (const projection of projections)
    if (
      projection.payloadSha256 !==
      (await sha256CanonicalJsonHex(projection.payload))
    )
      throw new Error("mechanical-port projection payload hash differs");
  const byArm = exactProjectionArmRecordV1(projections);
  const finiteLimit = characterizeFiniteLimitV1(byArm);
  const zeroLimit = characterizeZeroLimitV1(byArm);
  const closure = characterizeClosureV1(byArm);
  const algebraicResidual = characterizeAlgebraicResidualV1(byArm);
  const payload = deepFreeze({
    projectionOwnerId:
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROJECTION_V1_ID,
    projectionPayloadSha256ByArm: {
      coarse: byArm.coarse.payloadSha256,
      middle: byArm.middle.payloadSha256,
      fine: byArm.fine.payloadSha256,
    },
    finiteLimit,
    zeroLimit,
    closure,
    algebraicResidual,
    descriptiveSummary: {
      finiteLimitMetricCount: 25 as const,
      finiteLimitSignConsistentCount: finiteLimit.filter(
        (metric) => metric.signConsistent,
      ).length,
      finiteLimitAdjacentDifferenceShrankCount: finiteLimit.filter(
        (metric) => metric.adjacentDifferenceShrank,
      ).length,
      zeroLimitMetricCount: 21 as const,
      zeroLimitCoarseToMiddleMagnitudeDecreasedCount: zeroLimit.filter(
        (metric) => metric.coarseToMiddleMagnitudeDecreased,
      ).length,
      zeroLimitMiddleToFineMagnitudeDecreasedCount: zeroLimit.filter(
        (metric) => metric.middleToFineMagnitudeDecreased,
      ).length,
      closureMetricCount: 11 as const,
      algebraicResidualMetricCount: 20 as const,
      maximumAbsoluteAlgebraicResidualMilliJ: Math.max(
        ...algebraicResidual.map((metric) => metric.maximumAbsoluteValueMilliJ),
      ),
      numericalTrendIsQualificationGate: false as const,
    },
  }) satisfies MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationPayloadV1;
  assertAllNumericLeavesFiniteOrNullV1(payload);
  return deepFreeze({
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function auditMainWireFiveWallMechanicalPortLedgerThreeGridV1(
  ledgers: Readonly<{
    coarse: MainWireFiveWallMechanicalPortLedgerV1;
    middle: MainWireFiveWallMechanicalPortLedgerV1;
    fine: MainWireFiveWallMechanicalPortLedgerV1;
  }>,
  projections: readonly MainWireFiveWallMechanicalPortLedgerDtProjectionV1[],
  characterization: MainWireFiveWallMechanicalPortLedgerThreeGridCharacterizationV1,
): Promise<
  Readonly<{
    status: "audit-passed" | "audit-failed";
    firstMismatchPath: string | null;
  }>
> {
  const expectedProjections = await Promise.all(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1.map(
      (arm) =>
        projectMainWireFiveWallMechanicalPortLedgerDtV1(
          arm.armId,
          ledgers[arm.armId],
        ),
    ),
  );
  if (
    canonicalJsonStringify(expectedProjections) !==
    canonicalJsonStringify(projections)
  )
    return Object.freeze({
      status: "audit-failed" as const,
      firstMismatchPath: "projections",
    });
  const expectedCharacterization =
    await characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1(
      expectedProjections,
    );
  if (
    canonicalJsonStringify(expectedCharacterization) !==
    canonicalJsonStringify(characterization)
  )
    return Object.freeze({
      status: "audit-failed" as const,
      firstMismatchPath: "characterization",
    });
  return Object.freeze({
    status: "audit-passed" as const,
    firstMismatchPath: null,
  });
}

function finiteLimitMetricsV1(
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
): readonly MainWireFiveWallMechanicalPortLedgerMetricV1<MainWireFiveWallMechanicalPortLedgerFiniteLimitMetricIdV1>[] {
  const metrics = [
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1.map((chamberId) => ({
      metricId: `cavity.${chamberId}.trapezoidalWorkOnWallMilliJ` as const,
      valueMilliJ: ledger.cavityWork.trapezoidalWorkOnWallMilliJ[chamberId],
    })),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.flatMap((wallId) => [
      {
        metricId:
          `wall.${wallId}.activeMechanical.deliveryPositiveMilliJ` as const,
        valueMilliJ:
          ledger.perWall[wallId].activeMechanical.deliveryPositiveMilliJ,
      },
      {
        metricId:
          `wall.${wallId}.activeMechanical.absorptionMagnitudeMilliJ` as const,
        valueMilliJ:
          ledger.perWall[wallId].activeMechanical.absorptionMagnitudeMilliJ,
      },
      {
        metricId: `wall.${wallId}.activeMechanical.netDeliveryMilliJ` as const,
        valueMilliJ: ledger.perWall[wallId].activeMechanical.netDeliveryMilliJ,
      },
    ]),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map((wallId) => ({
      metricId: `wall.${wallId}.parallelSls.physicalDissipationMilliJ` as const,
      valueMilliJ: ledger.perWall[wallId].parallelSls.physicalDissipationMilliJ,
    })),
    {
      metricId: "commonPericardium.trapezoidalPressureWorkOnBagMilliJ" as const,
      valueMilliJ: ledger.commonPericardium.trapezoidalPressureWorkOnBagMilliJ,
    },
  ];
  return exactMetricSetV1(
    metrics,
    MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1,
    "finite-limit",
  );
}

function zeroLimitMetricsV1(
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
): readonly MainWireFiveWallMechanicalPortLedgerMetricV1<MainWireFiveWallMechanicalPortLedgerZeroLimitMetricIdV1>[] {
  const metrics = [
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map((wallId) => ({
      metricId:
        `wall.${wallId}.equilibriumPassiveBackwardEulerRemainderMilliJ` as const,
      valueMilliJ:
        ledger.perWall[wallId].equilibriumPassiveBackwardEulerRemainderMilliJ,
    })),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map((wallId) => ({
      metricId:
        `wall.${wallId}.parallelSls.backwardEulerNumericalDissipationMilliJ` as const,
      valueMilliJ:
        ledger.perWall[wallId].parallelSls
          .backwardEulerNumericalDissipationMilliJ,
    })),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1.map((chamberId) => ({
      metricId: `cavity.${chamberId}.quadratureDifferenceMilliJ` as const,
      valueMilliJ: ledger.cavityWork.quadratureDifferenceMilliJ[chamberId],
    })),
    {
      metricId: "commonPericardium.quadratureDifferenceMilliJ" as const,
      valueMilliJ: ledger.commonPericardium.quadratureDifferenceMilliJ,
    },
    {
      metricId: "commonPericardium.backwardEulerRemainderMilliJ" as const,
      valueMilliJ: ledger.commonPericardium.backwardEulerRemainderMilliJ,
    },
    {
      metricId: "commonPericardium.trapezoidalRemainderMilliJ" as const,
      valueMilliJ: ledger.commonPericardium.trapezoidalRemainderMilliJ,
    },
    {
      metricId: "conjugacy.leftAtrium" as const,
      valueMilliJ: ledger.backwardEulerWorkConjugacyResidualMilliJ.leftAtrium,
    },
    {
      metricId: "conjugacy.rightAtrium" as const,
      valueMilliJ: ledger.backwardEulerWorkConjugacyResidualMilliJ.rightAtrium,
    },
    {
      metricId: "conjugacy.ventricularWallsCombined" as const,
      valueMilliJ:
        ledger.backwardEulerWorkConjugacyResidualMilliJ
          .ventricularWallsCombined,
    },
    {
      metricId: "conjugacy.allFiveWalls" as const,
      valueMilliJ: ledger.backwardEulerWorkConjugacyResidualMilliJ.allFiveWalls,
    },
  ];
  return exactMetricSetV1(
    metrics,
    MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1,
    "zero-limit",
  );
}

function closureMetricsV1(
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
): readonly MainWireFiveWallMechanicalPortLedgerMetricV1<MainWireFiveWallMechanicalPortLedgerClosureMetricIdV1>[] {
  const metrics = [
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map((wallId) => ({
      metricId:
        `wall.${wallId}.equilibriumPassiveStoredEnergyChangeMilliJ` as const,
      valueMilliJ:
        ledger.perWall[wallId].equilibriumPassiveStoredEnergyChangeMilliJ,
    })),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map((wallId) => ({
      metricId: `wall.${wallId}.parallelSls.storedEnergyChangeMilliJ` as const,
      valueMilliJ: ledger.perWall[wallId].parallelSls.storedEnergyChangeMilliJ,
    })),
    {
      metricId: "commonPericardium.storedEnergyChangeMilliJ" as const,
      valueMilliJ: ledger.commonPericardium.storedEnergyChangeMilliJ,
    },
  ];
  return exactMetricSetV1(
    metrics,
    MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1,
    "closure",
  );
}

function algebraicResidualMetricsV1(
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
): readonly MainWireFiveWallMechanicalPortLedgerMetricV1<MainWireFiveWallMechanicalPortLedgerAlgebraicResidualMetricIdV1>[] {
  const metrics = [
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map((wallId) => ({
      metricId: `wall.${wallId}.stressAssemblyResidualMilliJ` as const,
      valueMilliJ: ledger.perWall[wallId].stressAssemblyResidualMilliJ,
    })),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.flatMap((wallId) => [
      {
        metricId:
          `wall.${wallId}.parallelSls.reportedDiscreteBalanceResidualMilliJ` as const,
        valueMilliJ:
          ledger.perWall[wallId].parallelSls
            .reportedDiscreteBalanceResidualMilliJ,
      },
      {
        metricId:
          `wall.${wallId}.parallelSls.reconstructedDiscreteBalanceResidualMilliJ` as const,
        valueMilliJ:
          ledger.perWall[wallId].parallelSls
            .reconstructedDiscreteBalanceResidualMilliJ,
      },
      {
        metricId:
          `wall.${wallId}.parallelSls.readbackAgreementResidualMilliJ` as const,
        valueMilliJ:
          ledger.perWall[wallId].parallelSls.readbackAgreementResidualMilliJ,
      },
    ]),
  ];
  return exactMetricSetV1(
    metrics,
    MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1,
    "algebraic-residual",
  );
}

function exactMetricSetV1<TMetricId extends string>(
  metrics: readonly MainWireFiveWallMechanicalPortLedgerMetricV1<TMetricId>[],
  expectedIds: readonly TMetricId[],
  label: string,
): readonly MainWireFiveWallMechanicalPortLedgerMetricV1<TMetricId>[] {
  if (
    canonicalJsonStringify(metrics.map((metric) => metric.metricId)) !==
    canonicalJsonStringify(expectedIds)
  )
    throw new Error(`mechanical-port ${label} metric identity set differs`);
  for (const metric of metrics)
    if (!Number.isFinite(metric.valueMilliJ))
      throw new Error(`mechanical-port ${label} metric is non-finite`);
  return deepFreeze(metrics.map((metric) => ({ ...metric })));
}

function exactProjectionArmRecordV1(
  projections: readonly MainWireFiveWallMechanicalPortLedgerDtProjectionV1[],
): Readonly<{
  coarse: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
  middle: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
  fine: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
}> {
  if (projections.length !== 3)
    throw new Error(
      "mechanical-port characterization requires three projections",
    );
  const expectedIds =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1.map(
      (arm) => arm.armId,
    );
  if (
    canonicalJsonStringify(
      projections.map((projection) => projection.payload.armId),
    ) !== canonicalJsonStringify(expectedIds)
  )
    throw new Error("mechanical-port projection arm order differs");
  for (let index = 0; index < projections.length; index += 1) {
    const projection = projections[index]!;
    const arm =
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1[
        index
      ]!;
    if (
      projection.payload.nominalDtSec !== arm.nominalDtSec ||
      projection.payloadSha256.length !== 64
    )
      throw new Error("mechanical-port projection arm binding differs");
  }
  return Object.freeze({
    coarse: projections[0]!,
    middle: projections[1]!,
    fine: projections[2]!,
  });
}

function characterizeFiniteLimitV1(
  byArm: Readonly<{
    coarse: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    middle: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    fine: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
  }>,
): readonly MainWireFiveWallMechanicalPortLedgerFiniteLimitCharacterizationV1[] {
  return deepFreeze(
    MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1.map(
      (metricId, index) => {
        const values = valuesAtIndexV1(
          byArm,
          "finiteLimitMetrics",
          metricId,
          index,
        );
        const coarseMiddle = finiteAbsoluteDifferenceV1(
          values.coarse,
          values.middle,
        );
        const middleFine = finiteAbsoluteDifferenceV1(
          values.middle,
          values.fine,
        );
        const signs = {
          coarse: signClassV1(values.coarse),
          middle: signClassV1(values.middle),
          fine: signClassV1(values.fine),
        };
        return {
          metricId,
          valueMilliJ: values,
          signClass: signs,
          signConsistent:
            signs.coarse === signs.middle && signs.middle === signs.fine,
          coarseMiddleAbsoluteDifferenceMilliJ: coarseMiddle,
          middleFineAbsoluteDifferenceMilliJ: middleFine,
          coarseMiddleScaledDifference: finiteScaledDifferenceV1(
            values.coarse,
            values.middle,
          ),
          middleFineScaledDifference: finiteScaledDifferenceV1(
            values.middle,
            values.fine,
          ),
          adjacentDifferenceShrank: middleFine < coarseMiddle,
          differenceOrder: observedOrderV1(coarseMiddle, middleFine),
        };
      },
    ),
  );
}

function characterizeZeroLimitV1(
  byArm: Readonly<{
    coarse: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    middle: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    fine: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
  }>,
): readonly MainWireFiveWallMechanicalPortLedgerZeroLimitCharacterizationV1[] {
  return deepFreeze(
    MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1.map(
      (metricId, index) => {
        const values = valuesAtIndexV1(
          byArm,
          "zeroLimitMetrics",
          metricId,
          index,
        );
        const magnitude = {
          coarse: Math.abs(values.coarse),
          middle: Math.abs(values.middle),
          fine: Math.abs(values.fine),
        };
        assertFiniteValuesV1(Object.values(magnitude), "zero-limit magnitude");
        return {
          metricId,
          valueMilliJ: values,
          magnitudeMilliJ: magnitude,
          coarseToMiddleMagnitudeDecreased: magnitude.middle < magnitude.coarse,
          middleToFineMagnitudeDecreased: magnitude.fine < magnitude.middle,
          coarseToMiddleOrder: observedOrderV1(
            magnitude.coarse,
            magnitude.middle,
          ),
          middleToFineOrder: observedOrderV1(magnitude.middle, magnitude.fine),
        };
      },
    ),
  );
}

function characterizeClosureV1(
  byArm: Readonly<{
    coarse: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    middle: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    fine: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
  }>,
): readonly MainWireFiveWallMechanicalPortLedgerClosureCharacterizationV1[] {
  return deepFreeze(
    MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1.map(
      (metricId, index) => {
        const values = valuesAtIndexV1(
          byArm,
          "closureMetrics",
          metricId,
          index,
        );
        const magnitude = {
          coarse: Math.abs(values.coarse),
          middle: Math.abs(values.middle),
          fine: Math.abs(values.fine),
        };
        assertFiniteValuesV1(Object.values(magnitude), "closure magnitude");
        return {
          metricId,
          valueMilliJ: values,
          magnitudeMilliJ: magnitude,
          signClass: {
            coarse: signClassV1(values.coarse),
            middle: signClassV1(values.middle),
            fine: signClassV1(values.fine),
          },
        };
      },
    ),
  );
}

function characterizeAlgebraicResidualV1(
  byArm: Readonly<{
    coarse: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    middle: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    fine: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
  }>,
): readonly MainWireFiveWallMechanicalPortLedgerAlgebraicResidualCharacterizationV1[] {
  return deepFreeze(
    MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1.map(
      (metricId, index) => {
        const values = valuesAtIndexV1(
          byArm,
          "algebraicResidualMetrics",
          metricId,
          index,
        );
        const maximumAbsoluteValueMilliJ = Math.max(
          Math.abs(values.coarse),
          Math.abs(values.middle),
          Math.abs(values.fine),
        );
        if (!Number.isFinite(maximumAbsoluteValueMilliJ))
          throw new Error(
            "mechanical-port algebraic residual maximum is non-finite",
          );
        return { metricId, valueMilliJ: values, maximumAbsoluteValueMilliJ };
      },
    ),
  );
}

function valuesAtIndexV1<
  TKey extends
    | "finiteLimitMetrics"
    | "zeroLimitMetrics"
    | "closureMetrics"
    | "algebraicResidualMetrics",
>(
  byArm: Readonly<{
    coarse: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    middle: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
    fine: MainWireFiveWallMechanicalPortLedgerDtProjectionV1;
  }>,
  key: TKey,
  metricId: string,
  index: number,
): Readonly<{ coarse: number; middle: number; fine: number }> {
  const records = {
    coarse: byArm.coarse.payload[key][index],
    middle: byArm.middle.payload[key][index],
    fine: byArm.fine.payload[key][index],
  };
  if (
    records.coarse?.metricId !== metricId ||
    records.middle?.metricId !== metricId ||
    records.fine?.metricId !== metricId
  )
    throw new Error("mechanical-port characterization metric order differs");
  const values = {
    coarse: records.coarse.valueMilliJ,
    middle: records.middle.valueMilliJ,
    fine: records.fine.valueMilliJ,
  };
  assertFiniteValuesV1(Object.values(values), "characterization value");
  return Object.freeze(values);
}

function finiteAbsoluteDifferenceV1(left: number, right: number): number {
  const difference = Math.abs(left - right);
  if (!Number.isFinite(difference))
    throw new Error("mechanical-port adjacent difference overflowed");
  return difference;
}

function finiteScaledDifferenceV1(left: number, right: number): number {
  const denominator = Math.max(Math.abs(left), Math.abs(right), 1);
  const scaled = finiteAbsoluteDifferenceV1(left, right) / denominator;
  if (!Number.isFinite(scaled))
    throw new Error("mechanical-port scaled difference is non-finite");
  return scaled;
}

function observedOrderV1(
  leftMagnitude: number,
  rightMagnitude: number,
): MainWireFiveWallMechanicalPortLedgerOrderV1 {
  if (leftMagnitude === 0 && rightMagnitude === 0)
    return Object.freeze({
      status: "undefined" as const,
      value: null,
      reason: "both-zero" as const,
    });
  if (leftMagnitude === 0)
    return Object.freeze({
      status: "undefined" as const,
      value: null,
      reason: "left-zero" as const,
    });
  if (rightMagnitude === 0)
    return Object.freeze({
      status: "undefined" as const,
      value: null,
      reason: "right-zero" as const,
    });
  const value = Math.log2(leftMagnitude) - Math.log2(rightMagnitude);
  if (!Number.isFinite(value))
    throw new Error("mechanical-port observed order is non-finite");
  return Object.freeze({
    status: "defined" as const,
    value,
    reason: null,
  });
}

function signClassV1(value: number): "negative" | "zero" | "positive" {
  if (value < 0) return "negative";
  if (value > 0) return "positive";
  return "zero";
}

function assertLedgerEnvelopeV1(
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
): void {
  if (
    ledger.ledgerId !==
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID ||
    !Number.isSafeInteger(ledger.intervalCount) ||
    ledger.intervalCount < 1 ||
    !(ledger.elapsedTimeSec > 0) ||
    !(ledger.minimumAcceptedDtSec > 0) ||
    !(ledger.maximumAcceptedDtSec > 0) ||
    ledger.minimumAcceptedDtSec > ledger.maximumAcceptedDtSec
  )
    throw new Error("mechanical-port source ledger envelope differs");
  if (
    canonicalJsonStringify(ledger.claim) !==
      canonicalJsonStringify(
        MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
      ) ||
    ledger.materialBinding.ownerId.length === 0 ||
    ledger.materialBinding.parameterIdentityHash.length === 0 ||
    ledger.materialBinding.mechanicsProviderIdentity.contractId.length === 0 ||
    ledger.materialBinding.mechanicsProviderIdentity.providerId.length === 0 ||
    ledger.materialBinding.mechanicsProviderIdentity.parameterSetId.length ===
      0 ||
    ledger.materialBinding.mechanicsProviderIdentity.parameterIdentityHash
      .length === 0
  )
    throw new Error("mechanical-port source ledger binding differs");
  assertAllNumericLeavesFiniteOrNullV1(ledger);
}

function assertFiniteValuesV1(values: readonly number[], label: string): void {
  if (!values.every(Number.isFinite))
    throw new Error(`mechanical-port ${label} is non-finite`);
}

function assertAllNumericLeavesFiniteOrNullV1(value: unknown): void {
  if (typeof value === "number" && !Number.isFinite(value))
    throw new Error("mechanical-port projection contains a non-finite number");
  if (Array.isArray(value)) {
    for (const child of value) assertAllNumericLeavesFiniteOrNullV1(child);
    return;
  }
  if (value !== null && typeof value === "object")
    for (const child of Object.values(value))
      assertAllNumericLeavesFiniteOrNullV1(child);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreeze(child);
  }
  return value;
}
