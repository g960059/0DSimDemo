import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export type MainWireNormalAdultBloodVolumeOperatingPointReportV1 =
  | Readonly<{
    status: "available";
    unavailableReason: null;
    ownerId: string;
    parameterSetId: string;
    topologyScopeId: string;
    fixedTotalBloodVolumeMl: number;
    initialDistributionPolicyId: string;
    coldSeedTotalBloodVolumeMl: number;
    resolvedTotalBloodVolumeMl: number;
    addedBloodVolumeMl: number;
    sharedSvVcTransmuralPressureOffsetMmHg: number;
    excludedCoronaryColdSeedVolumeMl: number;
    maximumInverseOffsetResidualMmHg: number;
    unchangedNodeMaximumAbsoluteDeltaMl: number;
    targetResidualMl: number;
  }>
  | Readonly<{
    status: "legacy-unavailable";
    unavailableReason:
      | "legacy-result-missing-semantic-owner-or-construction-audit"
      | "incomplete-semantic-owner-or-construction-audit";
    ownerId: null;
    parameterSetId: null;
    topologyScopeId: null;
    fixedTotalBloodVolumeMl: null;
    initialDistributionPolicyId: null;
    coldSeedTotalBloodVolumeMl: null;
    resolvedTotalBloodVolumeMl: null;
    addedBloodVolumeMl: null;
    sharedSvVcTransmuralPressureOffsetMmHg: null;
    excludedCoronaryColdSeedVolumeMl: null;
    maximumInverseOffsetResidualMmHg: null;
    unchangedNodeMaximumAbsoluteDeltaMl: null;
    targetResidualMl: null;
  }>;

/**
 * Report-only compatibility adapter. Current results expose a semantic owner
 * in protocol identity and a deterministic, unhashed construction audit.
 * Historical JSON may have neither; that is represented explicitly instead
 * of synthesizing an owner from the old total or throwing while rendering.
 */
export function readMainWireNormalAdultBloodVolumeOperatingPointReportV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultBloodVolumeOperatingPointReportV1 {
  const resultRecord = record(result);
  const protocolIdentity = record(resultRecord?.protocolIdentity);
  const owner = record(protocolIdentity?.bloodVolumeOperatingPoint);
  const audit = record(resultRecord?.bloodVolumeOperatingPointAudit);
  if (owner === null || audit === null) {
    return unavailable(
      "legacy-result-missing-semantic-owner-or-construction-audit",
    );
  }

  const values = {
    ownerId: stringValue(owner.ownerId),
    parameterSetId: stringValue(owner.parameterSetId),
    topologyScopeId: stringValue(owner.topologyScopeId),
    fixedTotalBloodVolumeMl: finiteNumber(owner.fixedTotalBloodVolumeMl),
    initialDistributionPolicyId:
      stringValue(owner.initialDistributionPolicyId),
    coldSeedTotalBloodVolumeMl:
      finiteNumber(audit.coldSeedTotalBloodVolumeMl),
    resolvedTotalBloodVolumeMl:
      finiteNumber(audit.resolvedTotalBloodVolumeMl),
    addedBloodVolumeMl: finiteNumber(audit.addedBloodVolumeMl),
    sharedSvVcTransmuralPressureOffsetMmHg:
      finiteNumber(audit.sharedTransmuralPressureOffsetMmHg),
    excludedCoronaryColdSeedVolumeMl:
      finiteNumber(audit.excludedCoronaryColdSeedVolumeMl),
    maximumInverseOffsetResidualMmHg: finiteNumber(
      audit.maximumSharedTransmuralPressureOffsetResidualMmHg,
    ),
    unchangedNodeMaximumAbsoluteDeltaMl:
      finiteNumber(audit.unchangedNodeMaximumAbsoluteDeltaMl),
    targetResidualMl: finiteNumber(audit.targetResidualMl),
  };
  if (Object.values(values).some((value) => value === null)) {
    return unavailable("incomplete-semantic-owner-or-construction-audit");
  }
  return Object.freeze({
    status: "available" as const,
    unavailableReason: null,
    ownerId: values.ownerId!,
    parameterSetId: values.parameterSetId!,
    topologyScopeId: values.topologyScopeId!,
    fixedTotalBloodVolumeMl: values.fixedTotalBloodVolumeMl!,
    initialDistributionPolicyId: values.initialDistributionPolicyId!,
    coldSeedTotalBloodVolumeMl: values.coldSeedTotalBloodVolumeMl!,
    resolvedTotalBloodVolumeMl: values.resolvedTotalBloodVolumeMl!,
    addedBloodVolumeMl: values.addedBloodVolumeMl!,
    sharedSvVcTransmuralPressureOffsetMmHg:
      values.sharedSvVcTransmuralPressureOffsetMmHg!,
    excludedCoronaryColdSeedVolumeMl:
      values.excludedCoronaryColdSeedVolumeMl!,
    maximumInverseOffsetResidualMmHg:
      values.maximumInverseOffsetResidualMmHg!,
    unchangedNodeMaximumAbsoluteDeltaMl:
      values.unchangedNodeMaximumAbsoluteDeltaMl!,
    targetResidualMl: values.targetResidualMl!,
  });
}

function unavailable(
  unavailableReason: Extract<
    MainWireNormalAdultBloodVolumeOperatingPointReportV1,
    { status: "legacy-unavailable" }
  >["unavailableReason"],
): MainWireNormalAdultBloodVolumeOperatingPointReportV1 {
  return Object.freeze({
    status: "legacy-unavailable" as const,
    unavailableReason,
    ownerId: null,
    parameterSetId: null,
    topologyScopeId: null,
    fixedTotalBloodVolumeMl: null,
    initialDistributionPolicyId: null,
    coldSeedTotalBloodVolumeMl: null,
    resolvedTotalBloodVolumeMl: null,
    addedBloodVolumeMl: null,
    sharedSvVcTransmuralPressureOffsetMmHg: null,
    excludedCoronaryColdSeedVolumeMl: null,
    maximumInverseOffsetResidualMmHg: null,
    unchangedNodeMaximumAbsoluteDeltaMl: null,
    targetResidualMl: null,
  });
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
