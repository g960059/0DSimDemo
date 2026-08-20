import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { canonicalJsonStringify } from "@/engine/integrity";
import {
  auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1,
  type MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1,
} from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1";
import { MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1 } from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotDefinitionV1";

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_OUTPUT_PATH_V1 =
  "artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json" as const;

export function assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotOutputAbsentV1(
  outputPath: string,
): void {
  if (existsSync(outputPath))
    throw new Error(
      "intrinsic ventricular passive surface pilot output already exists; create-only execution refused",
    );
}

export function assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactSizeV1(
  serializedArtifact: string,
): number {
  const sizeBytes = Buffer.byteLength(serializedArtifact, "utf8");
  if (
    sizeBytes >
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.maximumCommittedArtifactBytes
  )
    throw new Error(
      `intrinsic ventricular passive surface pilot artifact is ${sizeBytes} bytes; limit is ${MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.maximumCommittedArtifactBytes}`,
    );
  return sizeBytes;
}

export async function serializeMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactV1(
  report: MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1,
): Promise<string> {
  const audit =
    await auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1(
      report,
    );
  if (audit.status !== "report-audit-passed")
    throw new Error(
      `intrinsic ventricular passive surface pilot report audit failed: ${canonicalJsonStringify(audit)}`,
    );
  const serialized = `${canonicalJsonStringify(report)}\n`;
  assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactSizeV1(
    serialized,
  );
  return serialized;
}

export async function writeMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactCreateOnlyV1(
  outputPath: string,
  report: MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1,
): Promise<Readonly<{ sizeBytes: number }>> {
  assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotOutputAbsentV1(
    outputPath,
  );
  const serialized =
    await serializeMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactV1(
      report,
    );
  writeFileSync(outputPath, serialized, { encoding: "utf8", flag: "wx" });
  const readback = readFileSync(outputPath, "utf8");
  if (readback !== serialized)
    throw new Error(
      "intrinsic ventricular passive surface pilot artifact readback mismatch",
    );
  const parsed = JSON.parse(
    readback,
  ) as MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1;
  const readbackAudit =
    await auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1(
      parsed,
    );
  if (readbackAudit.status !== "report-audit-passed")
    throw new Error(
      "intrinsic ventricular passive surface pilot artifact readback audit failed",
    );
  return Object.freeze({ sizeBytes: Buffer.byteLength(readback, "utf8") });
}
