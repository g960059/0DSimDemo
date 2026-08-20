import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { canonicalJsonStringify } from "@/engine/integrity";
import {
  auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationDefinitionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_OUTPUT_PATH_V1 =
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1
    .artifact.path;

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
    await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
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
  return serialized;
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
  const parsed = JSON.parse(
    readback,
  ) as MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1;
  const readbackAudit =
    await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
      parsed,
    );
  if (readbackAudit.status !== "report-audit-passed")
    throw new Error("mechanical-port ledger dt artifact readback audit failed");
  return Object.freeze({ sizeBytes: Buffer.byteLength(readback, "utf8") });
}
