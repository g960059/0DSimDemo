import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  runNoAvpdFourChamberHillTriSegBenchV1,
  type NoAvpdFourChamberBenchOptionsV1,
  type NoAvpdFourChamberWarmStartProvenanceV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1,
  totalBloodVolumeMl,
  type NoAvpdFourChamberHillTriSegStateV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/no-avpd-four-chamber-hill-triseg-report-v1.json",
);

const STATE_TRANSITION_SOURCE_PATHS = [
  "engine/mechanics2/activation/LandFormCaTroponinActivationV1.ts",
  "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV1.ts",
  "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2.ts",
  "engine/mechanics2/constitutive/HillCeSeeSlsV1.ts",
  "engine/mechanics2/geometry/OneFiberVolumeGeometryV1.ts",
  "engine/mechanics2/geometry/TriSegGeometryV1.ts",
  "engine/mechanics2/solver/DampedNewtonV1.ts",
  "engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1.ts",
  "engine/mechanics2/valve/SmoothInertialValveV2.ts",
  "engine/myocardium/calcium/PrescribedCalciumTransientV1.ts",
  "engine/myocardium/calcium/index.ts",
] as const;

const HARNESS_SOURCE_PATHS = [
  "engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1.ts",
  "engine/mechanics2/diagnostics/NoAvpdEventResolvedDiagnosticsV1.ts",
  "tools/mechanics2/runNoAvpdFourChamberHillTriSegBenchV1.ts",
] as const;

export function writeNoAvpdFourChamberHillTriSegReportV1(
  options?: NoAvpdFourChamberBenchOptionsV1,
  destinationPath = outputPath,
) {
  const report = runNoAvpdFourChamberHillTriSegBenchV1(options);
  const parameterSha256 = sha256Json(report.parameterSnapshot);
  const implementationSha256 = currentImplementationSha256();
  const harnessImplementationSha256 = currentHarnessImplementationSha256();
  const normalized = JSON.stringify({
    ...report,
    parameterSha256,
    implementationSha256,
    harnessImplementationSha256,
  });
  const withHash = {
    ...report,
    parameterSha256,
    implementationSha256,
    harnessImplementationSha256,
    normalizedSha256: createHash("sha256").update(normalized).digest("hex"),
  };
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(withHash, null, 2)}\n`);
  renameSync(temporaryPath, destinationPath);
  return withHash;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const beats = numericArgument("--beats", 2);
  const dtSec = numericArgument("--dt", 0.002);
  const sampleEverySteps = numericArgument("--sample-every", 2);
  const jacobianReuseSteps = nonnegativeIntegerArgument(
    "--jacobian-reuse-steps",
    DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.solver
      .jacobianReuse.maxAcceptedSteps,
  );
  const destinationPath = resolve(
    repoRoot,
    stringArgument("--output") ?? outputPath,
  );
  const resumeReportPath = stringArgument("--resume-report");
  if (resumeReportPath != null && stringArgument("--output") == null) {
    throw new Error("--resume-report requires --output so the source artifact is not overwritten");
  }
  if (
    resumeReportPath != null
    && resolve(repoRoot, resumeReportPath) === destinationPath
  ) {
    throw new Error("resume source and output paths must differ");
  }
  const sampleRetention = sampleRetentionArgument();
  const params = {
    ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
    solver: {
      ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.solver,
      jacobianReuse: {
        ...DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.solver.jacobianReuse,
        maxAcceptedSteps: jacobianReuseSteps,
      },
    },
  };
  const parameterSha256 = sha256Json(params);
  const resume = resumeReportPath == null
    ? null
    : loadResumeReport(resolve(repoRoot, resumeReportPath), parameterSha256, dtSec);
  const startedAt = performance.now();
  const report = writeNoAvpdFourChamberHillTriSegReportV1({
    beats,
    dtSec,
    sampleEverySteps,
    sampleRetention,
    params,
    initialState: resume?.initialState,
    warmStartProvenance: resume?.provenance,
  }, destinationPath);
  console.log(JSON.stringify({
    benchId: report.benchId,
    status: report.status,
    failureReason: report.failureReason,
    beatsCompleted: report.beatsCompleted,
    elapsedSec: (performance.now() - startedAt) / 1_000,
    outputPath: destinationPath,
    initialization: report.runProtocol.initialization,
    sampleRetention: report.runProtocol.sampleRetention,
    solverWork: report.solverWork,
    hardDiagnostics: report.hardDiagnostics,
    reportOnlyCycleConvergence: report.reportOnlyCycleConvergence,
    reportOnlyExactBeatBoundaryReturnMap: report.reportOnlyExactBeatBoundaryReturnMap,
    reportOnlyLvpMorphology: report.reportOnlyLvpMorphology,
    reportOnlyLvActivationTiming: report.reportOnlyLvActivationTiming,
    reportOnlyPhysiology: report.reportOnlyPhysiology,
    reportOnlyEventResolvedDiagnostics: report.reportOnlyEventResolvedDiagnostics,
    sampleCount: report.samples.length,
    parameterSha256: report.parameterSha256,
    implementationSha256: report.implementationSha256,
    harnessImplementationSha256: report.harnessImplementationSha256,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}

function numericArgument(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${flag} must be followed by a positive finite number`);
  }
  return value;
}

function nonnegativeIntegerArgument(flag: string, fallback: number): number {
  const raw = stringArgument(flag);
  if (raw == null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${flag} must be followed by a nonnegative integer`);
  }
  return value;
}

function stringArgument(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value == null || value.startsWith("--") || value.length === 0) {
    throw new Error(`${flag} must be followed by a value`);
  }
  return value;
}

function sampleRetentionArgument(): "all" | "last-two-complete-beats" {
  const value = stringArgument("--retain-samples") ?? "last-two";
  if (value === "all") return "all";
  if (value === "last-two") return "last-two-complete-beats";
  throw new Error("--retain-samples must be all or last-two");
}

type ResumeReportV1 = {
  readonly benchId?: string;
  readonly status?: string;
  readonly hardDiagnostics?: { readonly allStepsAccepted?: boolean };
  readonly normalizedSha256?: string;
  readonly parameterSha256?: string;
  readonly implementationSha256?: string;
  readonly harnessImplementationSha256?: string;
  readonly parameterSnapshot?: unknown;
  readonly stateLayoutId?: string;
  readonly dtSec?: number;
  readonly finalState?: NoAvpdFourChamberHillTriSegStateV1;
  readonly runProtocol?: {
    readonly modelId?: string;
    readonly equationsVersionId?: string;
    readonly stateLayoutId?: string;
    readonly rhythmTopologyId?: string;
    readonly cycleLengthSec?: number;
  };
};

export function loadResumeReport(
  sourcePath: string,
  expectedParameterSha256: string,
  expectedDtSec: number,
): {
  readonly initialState: NoAvpdFourChamberHillTriSegStateV1;
  readonly provenance: NoAvpdFourChamberWarmStartProvenanceV1;
} {
  const parsed = JSON.parse(readFileSync(sourcePath, "utf8")) as ResumeReportV1;
  const { normalizedSha256, ...normalizedBody } = parsed;
  if (
    normalizedSha256 == null
    || sha256Json(normalizedBody) !== normalizedSha256
  ) {
    throw new Error("resume report normalized hash does not match its contents");
  }
  if (
    parsed.parameterSnapshot == null
    || parsed.parameterSha256 == null
    || sha256Json(parsed.parameterSnapshot) !== parsed.parameterSha256
  ) {
    throw new Error("resume report parameter hash does not match its snapshot");
  }
  if (
    parsed.implementationSha256 == null
    || parsed.implementationSha256 !== currentImplementationSha256()
  ) {
    throw new Error("resume report implementation hash does not match current equations");
  }
  if (parsed.benchId !== "no-avpd-four-chamber-hill-triseg-bench-v1") {
    throw new Error("resume report has an incompatible bench id");
  }
  if (parsed.status !== "pass" || parsed.hardDiagnostics?.allStepsAccepted !== true) {
    throw new Error("resume report is not an accepted structural run");
  }
  if (parsed.parameterSha256 !== expectedParameterSha256) {
    throw new Error("resume report parameter hash does not match the target parameters");
  }
  if (parsed.dtSec !== expectedDtSec) {
    throw new Error("resume report time step does not match the target protocol");
  }
  if (
    parsed.stateLayoutId !== NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1
    || parsed.runProtocol?.stateLayoutId
      !== NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1
  ) {
    throw new Error("resume report has an incompatible state layout");
  }
  if (parsed.runProtocol?.modelId !== NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1) {
    throw new Error("resume report has an incompatible model id");
  }
  if (
    parsed.runProtocol?.equationsVersionId
    !== NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1
  ) {
    throw new Error("resume report has an incompatible equations version");
  }
  if (
    parsed.runProtocol?.rhythmTopologyId
    !== NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1
  ) {
    throw new Error("resume report has an incompatible rhythm topology");
  }
  if (parsed.finalState == null) throw new Error("resume report has no finalState checkpoint");
  const cycleLengthSec = parsed.runProtocol?.cycleLengthSec;
  if (!Number.isFinite(cycleLengthSec)) throw new Error("resume report has no cycle length");
  return {
    initialState: parsed.finalState,
    provenance: {
      resumeMode: "exact-same-parameter-checkpoint",
      sourceArtifactId: sourcePath,
      sourceNormalizedSha256: normalizedSha256,
      sourceParameterSha256: parsed.parameterSha256,
      sourceImplementationSha256: parsed.implementationSha256,
      sourceModelId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1,
      sourceEquationsVersionId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1,
      sourceStateLayoutId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1,
      sourceRhythmTopologyId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1,
      sourceCycleLengthSec: cycleLengthSec as number,
      sourceDtSec: parsed.dtSec,
      sourceTotalBloodVolumeMl: totalBloodVolumeMl(parsed.finalState.volumes),
      periodClassification: "unclassified",
    },
  };
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function currentImplementationSha256(): string {
  const hash = createHash("sha256");
  for (const relativePath of STATE_TRANSITION_SOURCE_PATHS) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, relativePath)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function currentHarnessImplementationSha256(): string {
  const hash = createHash("sha256");
  hash.update("state-transition-sha256");
  hash.update("\0");
  hash.update(currentImplementationSha256());
  hash.update("\0");
  for (const relativePath of HARNESS_SOURCE_PATHS) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, relativePath)));
    hash.update("\0");
  }
  return hash.digest("hex");
}
