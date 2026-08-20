import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { canonicalJsonStringify } from "@/engine/integrity";
import {
  auditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationDefinitionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_OUTPUT_PATH_V1 =
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1
    .artifact.path;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_RAW_FILE_SHA256_V1 =
  "a60278ce159172e86e7c115840325f5de49fa353162742ef7d1b63daa9a2613e" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_SIZE_BYTES_V1 =
  154_062 as const;

export function assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtOutputAbsentV1(
  outputPath: string,
): void {
  if (existsSync(outputPath))
    throw new Error(
      "mechanical-port ledger dt characterization output already exists; create-only execution refused",
    );
}

export function assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactSizeV1(
  serializedArtifact: string,
): number {
  const sizeBytes = Buffer.byteLength(serializedArtifact, "utf8");
  const maximum =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1
      .artifact.maximumCommittedBytes;
  if (sizeBytes > maximum)
    throw new Error(
      `mechanical-port ledger dt artifact is ${sizeBytes} bytes; limit is ${maximum}`,
    );
  return sizeBytes;
}

export async function serializeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
  report: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
): Promise<string> {
  const audit =
    await auditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
      report,
    );
  if (audit.status !== "report-audit-passed")
    throw new Error(
      `mechanical-port ledger dt report audit failed: ${canonicalJsonStringify(audit)}`,
    );
  const serialized = `${canonicalJsonStringify(report)}\n`;
  assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactSizeV1(
    serialized,
  );
  await parseAndAuditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
    serialized,
  );
  return serialized;
}

export async function parseAndAuditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
  rawArtifact: string,
): Promise<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1> {
  const sizeBytes = Buffer.byteLength(rawArtifact, "utf8");
  if (
    sizeBytes !==
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_SIZE_BYTES_V1
  )
    throw new Error("mechanical-port ledger dt committed byte count differs");
  const rawSha256 = createHash("sha256").update(rawArtifact).digest("hex");
  if (
    rawSha256 !==
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_RAW_FILE_SHA256_V1
  )
    throw new Error("mechanical-port ledger dt committed raw SHA differs");
  const parsed = JSON.parse(
    rawArtifact,
  ) as MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1;
  if (`${canonicalJsonStringify(parsed)}\n` !== rawArtifact)
    throw new Error("mechanical-port ledger dt artifact is not canonical JSON");
  const audit =
    await auditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
      parsed,
    );
  if (audit.status !== "report-audit-passed")
    throw new Error(
      `mechanical-port ledger dt committed report audit failed: ${canonicalJsonStringify(audit)}`,
    );
  return parsed;
}

export async function writeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactCreateOnlyV1(
  outputPath: string,
  report: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
): Promise<Readonly<{ sizeBytes: number }>> {
  assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtOutputAbsentV1(
    outputPath,
  );
  const serialized =
    await serializeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
      report,
    );
  writeFileSync(outputPath, serialized, { encoding: "utf8", flag: "wx" });
  const readback = readFileSync(outputPath, "utf8");
  if (readback !== serialized)
    throw new Error("mechanical-port ledger dt artifact readback mismatch");
  await parseAndAuditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
    readback,
  );
  return Object.freeze({ sizeBytes: Buffer.byteLength(readback, "utf8") });
}
