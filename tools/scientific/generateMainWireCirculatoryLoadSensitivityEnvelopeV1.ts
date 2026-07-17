import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalJsonStringify,
} from "@/engine/scientific/release";
import {
  runMainWireCirculatoryLoadSensitivityEnvelopeV1,
  type MainWireCirculatoryLoadSensitivityEnvelopeV1,
} from "@/engine/scientific/validation";

export const MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_ENVELOPE_V1_PATH =
  "data/scientific/validation/circulatory-load-sensitivity-envelope-v1.json" as const;

export const MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_GENERATION_V1 =
  Object.freeze({
    dtSec: 0.004 as const,
    maximumBeatCount: 32 as const,
  });

export async function buildMainWireCirculatoryLoadSensitivityArtifactV1() {
  return runMainWireCirculatoryLoadSensitivityEnvelopeV1(
    MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_GENERATION_V1,
  );
}

export async function generateMainWireCirculatoryLoadSensitivityEnvelopeCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const checkOnly = args.includes("--check");
  const unsupported = args.filter((argument) => argument !== "--check");
  if (unsupported.length > 0) {
    throw new Error(`unsupported argument: ${unsupported.join(", ")}`);
  }
  const report = await buildMainWireCirculatoryLoadSensitivityArtifactV1();
  const bytes = Buffer.from(`${canonicalJsonStringify(report)}\n`, "utf8");
  const artifactPath = path.resolve(
    rootDir,
    MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_ENVELOPE_V1_PATH,
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
    artifactPath:
      MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_ENVELOPE_V1_PATH,
    artifactMatches,
    envelopeSha256: report.envelopeSha256,
    numerics: report.requestedNumerics,
    runs: summarizeRuns(report),
    byteLength: bytes.byteLength,
  }, null, 2)}\n`);
  return artifactMatches === false ? 1 : 0;
}

function summarizeRuns(
  report: MainWireCirculatoryLoadSensitivityEnvelopeV1,
) {
  return report.runs.map((run) => Object.freeze({
    pointId: run.point.pointId,
    terminationReason: run.outcome.terminationReason,
    completedBeatCount: run.outcome.completedBeatCount,
    periodicityStatus: run.outcome.periodicityStatus,
    aorticMeanPressureMmHg: run.cycleMetrics.aorticMeanPressureMmHg,
    pulmonaryArteryMeanPressureMmHg:
      run.cycleMetrics.pulmonaryArteryMeanPressureMmHg,
    netAorticCardiacOutputLPerMin:
      run.cycleMetrics.netAorticCardiacOutputLPerMin,
    leftVentricularEjectionFraction01:
      run.cycleMetrics.leftVentricularEjectionFraction01,
    rightVentricularEjectionFraction01:
      run.cycleMetrics.rightVentricularEjectionFraction01,
  }));
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  generateMainWireCirculatoryLoadSensitivityEnvelopeCliV1()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.stack : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
