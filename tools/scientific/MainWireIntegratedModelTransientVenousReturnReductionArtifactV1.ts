import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { canonicalJsonStringify } from "@/engine/integrity";
import {
  auditMainWireIntegratedModelTransientVenousReturnReductionReportV1,
  type MainWireIntegratedModelTransientVenousReturnReductionReportV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionEngineeringV1";
import { MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionDefinitionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_OUTPUT_PATH_V1 =
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1
    .artifact.path;

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
    await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
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
    await parseAndAuditMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
      serialized,
    );
  if (parsed.payloadSha256 !== report.payloadSha256) {
    throw new Error("transient venous-return serialized payload SHA differs");
  }
  return serialized;
}

export async function parseAndAuditMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
  rawArtifact: string,
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportV1> {
  assertMainWireIntegratedModelTransientVenousReturnReductionArtifactSizeV1(
    rawArtifact,
  );
  const parsed = JSON.parse(
    rawArtifact,
  ) as MainWireIntegratedModelTransientVenousReturnReductionReportV1;
  if (`${canonicalJsonStringify(parsed)}\n` !== rawArtifact) {
    throw new Error("transient venous-return artifact is not canonical JSON");
  }
  const audit =
    await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
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
  await parseAndAuditMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
    readback,
  );
  return Object.freeze({ sizeBytes: Buffer.byteLength(readback, "utf8") });
}
