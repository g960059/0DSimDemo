import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runAtrialActiveLawShootoutBenchV1 } from
  "@/engine/mechanics2/benches/AtrialActiveLawShootoutBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const defaultOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/atrial-active-law-shootout-v1.json",
);

const IMPLEMENTATION_SOURCE_PATHS = Object.freeze([
  "data/myocardium/sources.json",
  "data/myocardium/protocols/land2017-phase1c-source-protocols.json",
  "data/myocardium/protocols/prescribed-calcium-phase2a-synthetic-protocols.json",
  "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV1.ts",
  "engine/mechanics2/activation/LandFormCaTroponinActivationV1.ts",
  "engine/mechanics2/activation/Land2017ActiveOnlyV1.ts",
  "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2.ts",
  "engine/mechanics2/constitutive/HillCeSeeSlsV1.ts",
  "engine/mechanics2/geometry/OneFiberVolumeGeometryV1.ts",
  "engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1.ts",
  "engine/myocardium/atrialLandNiederer2018.ts",
  "engine/myocardium/calcium/PrescribedCalciumTransientV1.ts",
  "engine/myocardium/calcium/index.ts",
  "engine/myocardium/calcium/protocols.ts",
  "engine/myocardium/contracts.ts",
  "engine/myocardium/myofilament/land2017/equations.ts",
  "engine/myocardium/myofilament/land2017/index.ts",
  "engine/myocardium/myofilament/land2017/jacobian.ts",
  "engine/myocardium/myofilament/land2017/outputs.ts",
  "engine/myocardium/myofilament/land2017/parameterSets.ts",
  "engine/myocardium/myofilament/land2017/protocols.ts",
  "engine/myocardium/myofilament/land2017/residual.ts",
  "engine/myocardium/myofilament/land2017/sdirk2.ts",
  "engine/myocardium/myofilament/land2017/solver.ts",
  "engine/myocardium/myofilament/land2017/stabilization.ts",
  "engine/myocardium/myofilament/land2017/tangents.ts",
  "engine/myocardium/myofilament/land2017/types.ts",
  "engine/myocardium/units.ts",
  "engine/mechanics2/geometry/TriSegGeometryV1.ts",
  "engine/mechanics2/solver/DampedNewtonV1.ts",
  "engine/mechanics2/valve/SmoothInertialValveV2.ts",
  "package-lock.json",
  "package.json",
] as const);

const HARNESS_SOURCE_PATHS = Object.freeze([
  "engine/mechanics2/benches/AtrialActiveLawShootoutBenchV1.ts",
  "tools/mechanics2/runAtrialActiveLawShootoutV1.ts",
] as const);

export function writeAtrialActiveLawShootoutV1(
  options: Parameters<typeof runAtrialActiveLawShootoutBenchV1>[0] = {},
  destinationPath = defaultOutputPath,
) {
  const report = runAtrialActiveLawShootoutBenchV1(options);
  const implementationSha256 = hashSourceManifest(IMPLEMENTATION_SOURCE_PATHS);
  const harnessSha256 = hashSourceManifest(HARNESS_SOURCE_PATHS);
  const normalizedBody = {
    ...report,
    provenance: {
      implementationSha256,
      harnessSha256,
      implementationSourcePaths: IMPLEMENTATION_SOURCE_PATHS,
      harnessSourcePaths: HARNESS_SOURCE_PATHS,
      repositoryRelativeOutputPath: relative(repoRoot, destinationPath),
    },
  };
  const normalizedSha256 = sha256Json(normalizedBody);
  const artifact = Object.freeze({ ...normalizedBody, normalizedSha256 });
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(artifact, null, 2)}\n`);
  renameSync(temporaryPath, destinationPath);
  return artifact;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const dtSec = numberArgument("--dt", 0.001);
  const warmupCycles = integerArgument("--warmup-cycles", 6);
  const destinationPath = resolve(
    repoRoot,
    stringArgument("--output") ?? defaultOutputPath,
  );
  const startedAt = performance.now();
  const artifact = writeAtrialActiveLawShootoutV1(
    {
      dtSec,
      warmupCycles,
      includeDtRefinement: !process.argv.includes("--no-dt-refinement"),
    },
    destinationPath,
  );
  const causalRows = artifact.results
    .filter((row) => row.protocolId === "a-wave-shortening-stop")
    .map((row) => ({
      variantId: row.variantId,
      peakActiveStressKPa: row.peakActiveStressKPa,
      peakActiveStressPhase01: row.peakActiveStressPhase01,
      velocityStopRecovery:
        row.velocityStopDiagnostics.recoveryFromFastestToStopNormalizedByPeak,
      postStopGain:
        row.velocityStopDiagnostics.postStopGainNormalizedByPeak,
      remainingShorteningAtPeak:
        row.velocityStopDiagnostics.remainingShorteningAtGlobalStressPeak01,
    }));
  console.log(JSON.stringify({
    benchId: artifact.benchId,
    outputPath: destinationPath,
    elapsedSec: (performance.now() - startedAt) / 1_000,
    numericalGates: artifact.numericalGates,
    causalRows,
    normalizedSha256: artifact.normalizedSha256,
  }, null, 2));
  if (!artifact.numericalGates.allNumericalGatesPass) process.exitCode = 1;
}

function hashSourceManifest(paths: readonly string[]): string {
  const hash = createHash("sha256");
  for (const path of [...paths].sort()) {
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stringArgument(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value == null || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function numberArgument(flag: string, fallback: number): number {
  const raw = stringArgument(flag);
  if (raw == null) return fallback;
  const value = Number(raw);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${flag} must be positive and finite`);
  }
  return value;
}

function integerArgument(flag: string, fallback: number): number {
  const value = numberArgument(flag, fallback);
  if (!Number.isInteger(value)) throw new Error(`${flag} must be an integer`);
  return value;
}
