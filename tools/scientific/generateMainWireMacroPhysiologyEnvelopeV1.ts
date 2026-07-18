import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  runMainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1,
  type MainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const MAIN_WIRE_MACRO_PHYSIOLOGY_ENVELOPE_V1_PATH =
  "data/scientific/validation/macro-physiology-envelope-v1.json" as const;

export const MAIN_WIRE_MACRO_PHYSIOLOGY_GENERATION_V1 = Object.freeze({
  dtSec: 0.004 as const,
  maximumBeatCount: 32 as const,
});

export function buildMainWireMacroPhysiologyArtifactV1() {
  return runMainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1(
    MAIN_WIRE_MACRO_PHYSIOLOGY_GENERATION_V1,
  );
}

export async function generateMainWireMacroPhysiologyEnvelopeCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const checkOnly = args.includes("--check");
  const unsupported = args.filter((argument) => argument !== "--check");
  if (unsupported.length > 0) {
    throw new Error(`unsupported argument: ${unsupported.join(", ")}`);
  }
  const report = buildMainWireMacroPhysiologyArtifactV1();
  const bytes = Buffer.from(`${canonicalJsonStringify(report)}\n`, "utf8");
  const canonicalPayloadSha256 = await sha256CanonicalJsonHex(report);
  const rawFileSha256 = createHash("sha256").update(bytes).digest("hex");
  const artifactPath = path.resolve(
    rootDir,
    MAIN_WIRE_MACRO_PHYSIOLOGY_ENVELOPE_V1_PATH,
  );
  const artifactMatches = checkOnly
    ? readFileSync(artifactPath).equals(bytes)
    : null;
  if (!checkOnly) {
    mkdirSync(path.dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, bytes);
  }
  process.stdout.write(`${JSON.stringify({
    mode: checkOnly ? "check" : "generated",
    artifactPath: MAIN_WIRE_MACRO_PHYSIOLOGY_ENVELOPE_V1_PATH,
    artifactMatches,
    canonicalPayloadSha256,
    rawFileSha256,
    numerics: report.requestedNumerics,
    hardGateSummary: report.hardGateSummary,
    runs: summarizeRuns(report),
    byteLength: bytes.byteLength,
  }, null, 2)}\n`);
  return artifactMatches === false ? 1 : 0;
}

function summarizeRuns(
  report: MainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1,
) {
  return report.runs.map((run) => Object.freeze({
    pointId: run.point.pointId,
    terminationReason: run.outcome.terminationReason,
    completedBeatCount: run.outcome.completedBeatCount,
    period1Converged: run.outcome.period1Converged,
    leftVentricularEndDiastolicVolumeMl:
      run.cycleMetrics.values.leftVentricularEndDiastolicVolumeMl,
    leftVentricularEndSystolicVolumeMl:
      run.cycleMetrics.values.leftVentricularEndSystolicVolumeMl,
    leftVentricularEjectionFraction01:
      run.cycleMetrics.values.leftVentricularEjectionFraction01,
    aorticMeanPressureMmHg:
      run.cycleMetrics.values.aorticMeanPressureMmHg,
    netAorticCardiacOutputLPerMin:
      run.cycleMetrics.values.netAorticCardiacOutputLPerMin,
  }));
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  generateMainWireMacroPhysiologyEnvelopeCliV1()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.stack : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
