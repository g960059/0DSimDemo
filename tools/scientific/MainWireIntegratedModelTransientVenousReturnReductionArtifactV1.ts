import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { canonicalJsonStringify } from "@/engine/integrity";
import {
  auditCommittedMainWireIntegratedModelTransientVenousReturnReductionReportV1,
  type MainWireIntegratedModelTransientVenousReturnReductionReportV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionEngineeringV1";
import { MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionDefinitionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_OUTPUT_PATH_V1 =
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1
    .artifact.path;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_COMMITTED_RAW_FILE_SHA256_V1 =
  "81a37af6c8f68497efb75102d737f6b28bb8a2e837dc2089f30790bf04358a26" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_COMMITTED_SIZE_BYTES_V1 =
  100_788 as const;

export function assertMainWireIntegratedModelTransientVenousReturnReductionOutputAbsentV1(
  outputPath: string,
): void {
  if (existsSync(outputPath)) {
    throw new Error(
      "transient venous-return characterization output already exists; create-only execution refused",
    );
  }
}

export function assertMainWireIntegratedModelTransientVenousReturnReductionArtifactSizeV1(
  serializedArtifact: string,
): number {
  const sizeBytes = Buffer.byteLength(serializedArtifact, "utf8");
  const maximumBytes =
    MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1
      .artifact.maximumCommittedBytes;
  if (sizeBytes > maximumBytes) {
    throw new Error(
      `transient venous-return artifact is ${sizeBytes} bytes; limit is ${maximumBytes}`,
    );
  }
  return sizeBytes;
}

export async function serializeMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
  report: MainWireIntegratedModelTransientVenousReturnReductionReportV1,
): Promise<string> {
  const audit =
    await auditCommittedMainWireIntegratedModelTransientVenousReturnReductionReportV1(
      report,
    );
  if (audit.status !== "report-audit-passed") {
    throw new Error(
      `transient venous-return report audit failed: ${canonicalJsonStringify(audit)}`,
    );
  }
  const serialized = `${canonicalJsonStringify(report)}\n`;
  assertMainWireIntegratedModelTransientVenousReturnReductionArtifactSizeV1(
    serialized,
  );
  const parsed =
    await parseAndAuditCommittedMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
      serialized,
    );
  if (parsed.payloadSha256 !== report.payloadSha256) {
    throw new Error("transient venous-return serialized payload SHA differs");
  }
  return serialized;
}

export async function parseAndAuditCommittedMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
  rawArtifact: string,
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportV1> {
  const sizeBytes = Buffer.byteLength(rawArtifact, "utf8");
  if (
    sizeBytes !==
    MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_COMMITTED_SIZE_BYTES_V1
  ) {
    throw new Error(
      "transient venous-return committed artifact byte count differs",
    );
  }
  const rawSha256 = createHash("sha256").update(rawArtifact).digest("hex");
  if (
    rawSha256 !==
    MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_COMMITTED_RAW_FILE_SHA256_V1
  ) {
    throw new Error(
      "transient venous-return committed artifact raw SHA differs",
    );
  }
  const parsed = JSON.parse(
    rawArtifact,
  ) as MainWireIntegratedModelTransientVenousReturnReductionReportV1;
  if (`${canonicalJsonStringify(parsed)}\n` !== rawArtifact) {
    throw new Error("transient venous-return artifact is not canonical JSON");
  }
  const audit =
    await auditCommittedMainWireIntegratedModelTransientVenousReturnReductionReportV1(
      parsed,
    );
  if (audit.status !== "report-audit-passed") {
    throw new Error(
      `transient venous-return parsed report audit failed: ${canonicalJsonStringify(audit)}`,
    );
  }
  return parsed;
}

export async function writeMainWireIntegratedModelTransientVenousReturnReductionArtifactCreateOnlyV1(
  outputPath: string,
  report: MainWireIntegratedModelTransientVenousReturnReductionReportV1,
): Promise<Readonly<{ sizeBytes: number }>> {
  assertMainWireIntegratedModelTransientVenousReturnReductionOutputAbsentV1(
    outputPath,
  );
  const serialized =
    await serializeMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
      report,
    );
  writeFileSync(outputPath, serialized, { encoding: "utf8", flag: "wx" });
  const readback = readFileSync(outputPath, "utf8");
  if (readback !== serialized) {
    throw new Error("transient venous-return artifact readback differs");
  }
  await parseAndAuditCommittedMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
    readback,
  );
  return Object.freeze({ sizeBytes: Buffer.byteLength(readback, "utf8") });
}
