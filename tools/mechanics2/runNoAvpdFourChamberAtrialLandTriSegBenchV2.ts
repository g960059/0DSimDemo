import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_BENCH_ID_V2,
  runNoAvpdFourChamberAtrialLandTriSegBenchV2,
  type NoAvpdFourChamberAtrialLandBenchOptionsV2,
  type NoAvpdFourChamberAtrialLandBenchResultV2,
  type NoAvpdFourChamberAtrialLandWarmStartProvenanceV2,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberAtrialLandTriSegBenchV2";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2,
  initialNoAvpdFourChamberAtrialLandTriSegStateV2,
  noAvpdFourChamberAtrialLandParameterIdentityV2,
  totalBloodVolumeMl,
  type NoAvpdFourChamberAtrialLandTriSegStateV2,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberAtrialLandTriSegV2";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");

export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_ID_V2 =
  "no-avpd-four-chamber-atrial-land-triseg-report-v2" as const;

export const DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2 =
  resolve(
    repoRoot,
    "data/mechanics2/reports/no-avpd-four-chamber-atrial-land-triseg-report-v2.json",
  );

/** Files that can change an accepted state transition or its readback. */
export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_STATE_TRANSITION_PATHS_V2 =
  Object.freeze([
    "engine/mechanics2/activation/Land2017ActiveOnlyV1.ts",
    "engine/mechanics2/activation/LandFormCaTroponinActivationV1.ts",
    "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV1.ts",
    "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2.ts",
    "engine/mechanics2/constitutive/HillCeSeeSlsV1.ts",
    "engine/mechanics2/constitutive/HillPassiveSlsParallelV1.ts",
    "engine/mechanics2/geometry/OneFiberVolumeGeometryV1.ts",
    "engine/mechanics2/geometry/TriSegGeometryV1.ts",
    "engine/mechanics2/solver/DampedNewtonV1.ts",
    "engine/mechanics2/subsystems/NoAvpdFourChamberAtrialLandTriSegV2.ts",
    "engine/mechanics2/valve/SmoothInertialValveV2.ts",
    "engine/myocardium/atrialLandNiederer2018.ts",
    "engine/myocardium/calcium/PrescribedCalciumTransientV1.ts",
    "engine/myocardium/contracts.ts",
    "engine/myocardium/myofilament/land2017/equations.ts",
    "engine/myocardium/myofilament/land2017/jacobian.ts",
    "engine/myocardium/myofilament/land2017/outputs.ts",
    "engine/myocardium/myofilament/land2017/parameterSets.ts",
    "engine/myocardium/myofilament/land2017/residual.ts",
    "engine/myocardium/myofilament/land2017/sdirk2.ts",
    "engine/myocardium/myofilament/land2017/solver.ts",
    "engine/myocardium/myofilament/land2017/stabilization.ts",
    "engine/myocardium/myofilament/land2017/types.ts",
    "engine/myocardium/units.ts",
  ] as const);

/** Files that can change report retention, gates, hashing, or CLI semantics. */
export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_HARNESS_PATHS_V2 = Object.freeze([
  "engine/mechanics2/benches/NoAvpdFourChamberAtrialLandTriSegBenchV2.ts",
  "tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegBenchV2.ts",
] as const);

export type NoAvpdFourChamberAtrialLandPeriodClassificationV2 =
  | "within-caller-one-beat-return-tolerance"
  | "outside-caller-one-beat-return-tolerance"
  | "unavailable";

export type NoAvpdFourChamberAtrialLandRunControlV2 = {
  /** Caller-selected engineering tolerance on the full-state one-beat return map. */
  readonly periodicToleranceMaxAbsDimensionless?: number;
  /** If true, failure to meet the caller's one-beat return tolerance makes the CLI fail. */
  readonly requirePeriodicConvergenceForCliSuccess?: boolean;
};

export type NoAvpdFourChamberAtrialLandReportV2 =
  NoAvpdFourChamberAtrialLandBenchResultV2 & {
    readonly artifactId:
      typeof NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_ID_V2;
    readonly continuationProtocol: {
      readonly mode:
        | "single-uninterrupted-deterministic-cold-start"
        | "exact-cycle-boundary-checkpoint-resume";
      readonly rationale:
        | "cold-start-run-to-fixed-beat-horizon"
        | "caller-supplied-validated-cycle-boundary-continuation";
      readonly requestedBeatHorizon: number;
      readonly exactCycleBoundaryCheckpointIncluded: true;
      readonly exactCheckpointResumeClaimed: boolean;
      readonly earlyStopAtPeriodicity: false;
      readonly periodicMetric:
        "full-dynamic-state-final-two-cycle-boundaries-max-abs-normalized";
      readonly periodicToleranceMaxAbsDimensionless: number;
      readonly periodicClassification:
        NoAvpdFourChamberAtrialLandPeriodClassificationV2;
      readonly periodicConvergenceRequiredForCliSuccess: boolean;
    };
    readonly parameterSha256: string;
    readonly provenance: {
      readonly implementationSha256: string;
      readonly harnessSha256: string;
      readonly executionEnvironment: {
        readonly nodeVersion: string;
        readonly platform: NodeJS.Platform;
        readonly architecture: string;
        readonly packageLockSha256: string;
      };
      readonly implementationSourcePaths:
        typeof NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_STATE_TRANSITION_PATHS_V2;
      readonly harnessSourcePaths:
        typeof NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_HARNESS_PATHS_V2;
    };
    readonly normalizedSha256: string;
  };

export type NoAvpdFourChamberAtrialLandReportValidationOptionsV2 = {
  readonly expectedParameterSha256?: string;
  readonly expectedDtSec?: number;
  readonly requireAcceptedStructuralRun?: boolean;
  readonly requireCurrentImplementation?: boolean;
  readonly requireCurrentHarness?: boolean;
};

export type NoAvpdFourChamberAtrialLandCheckpointV2 = {
  readonly initialState: NoAvpdFourChamberAtrialLandTriSegStateV2;
  readonly provenance: NoAvpdFourChamberAtrialLandWarmStartProvenanceV2;
};

export function writeNoAvpdFourChamberAtrialLandTriSegReportV2(
  options: NoAvpdFourChamberAtrialLandBenchOptionsV2 = {},
  destinationPath =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
  runControl: NoAvpdFourChamberAtrialLandRunControlV2 = {},
): NoAvpdFourChamberAtrialLandReportV2 {
  const periodicToleranceMaxAbsDimensionless =
    runControl.periodicToleranceMaxAbsDimensionless ?? 1e-4;
  validateNonnegativeFinite(
    periodicToleranceMaxAbsDimensionless,
    "periodicToleranceMaxAbsDimensionless",
  );
  const requirePeriodicConvergenceForCliSuccess =
    runControl.requirePeriodicConvergenceForCliSuccess ?? false;
  assertCanonicalDestinationProtocol(
    destinationPath,
    options,
    periodicToleranceMaxAbsDimensionless,
    requirePeriodicConvergenceForCliSuccess,
  );
  if (
    options.fullStateReturnMapMaxAbsDimensionlessTolerance != null &&
    options.fullStateReturnMapMaxAbsDimensionlessTolerance !==
      periodicToleranceMaxAbsDimensionless
  ) {
    throw new Error(
      "bench and report periodic tolerances must match",
    );
  }
  const result = runNoAvpdFourChamberAtrialLandTriSegBenchV2(
    requirePeriodicConvergenceForCliSuccess
      ? {
          ...options,
          fullStateReturnMapMaxAbsDimensionlessTolerance:
            periodicToleranceMaxAbsDimensionless,
        }
      : options,
  );
  const periodicClassification = classifyNoAvpdFourChamberAtrialLandPeriodV2(
    result,
    periodicToleranceMaxAbsDimensionless,
  );
  const parameterSha256 = sha256Json(result.parameterSnapshot);
  const resumed = result.protocol.initialization.mode ===
    "exact-cycle-boundary-warm-resume";
  const body = Object.freeze({
    artifactId: NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_ID_V2,
    ...result,
    continuationProtocol: Object.freeze({
      mode: resumed
        ? "exact-cycle-boundary-checkpoint-resume" as const
        : "single-uninterrupted-deterministic-cold-start" as const,
      rationale: resumed
        ? "caller-supplied-validated-cycle-boundary-continuation" as const
        : "cold-start-run-to-fixed-beat-horizon" as const,
      requestedBeatHorizon: result.protocol.beatsRequested,
      exactCycleBoundaryCheckpointIncluded: true as const,
      exactCheckpointResumeClaimed: resumed,
      earlyStopAtPeriodicity: false as const,
      periodicMetric:
        "full-dynamic-state-final-two-cycle-boundaries-max-abs-normalized" as const,
      periodicToleranceMaxAbsDimensionless,
      periodicClassification,
      periodicConvergenceRequiredForCliSuccess:
        requirePeriodicConvergenceForCliSuccess,
    }),
    parameterSha256,
    provenance: Object.freeze({
      implementationSha256:
        currentNoAvpdFourChamberAtrialLandImplementationSha256V2(),
      harnessSha256: currentNoAvpdFourChamberAtrialLandHarnessSha256V2(),
      executionEnvironment: Object.freeze({
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        packageLockSha256: sha256File(resolve(repoRoot, "package-lock.json")),
      }),
      implementationSourcePaths:
        NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_STATE_TRANSITION_PATHS_V2,
      harnessSourcePaths: NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_HARNESS_PATHS_V2,
    }),
  });
  const artifact = Object.freeze({
    ...body,
    normalizedSha256: sha256Json(body),
  }) as NoAvpdFourChamberAtrialLandReportV2;
  writeJsonAtomically(destinationPath, artifact);
  return artifact;
}

export function classifyNoAvpdFourChamberAtrialLandPeriodV2(
  report: Pick<
    NoAvpdFourChamberAtrialLandBenchResultV2,
    "exactOneBeatFullStateReturnMap"
  >,
  toleranceMaxAbsDimensionless: number,
): NoAvpdFourChamberAtrialLandPeriodClassificationV2 {
  validateNonnegativeFinite(
    toleranceMaxAbsDimensionless,
    "toleranceMaxAbsDimensionless",
  );
  const metric = report.exactOneBeatFullStateReturnMap?.maxAbsDimensionless;
  if (metric == null || !Number.isFinite(metric)) return "unavailable";
  return metric <= toleranceMaxAbsDimensionless
    ? "within-caller-one-beat-return-tolerance"
    : "outside-caller-one-beat-return-tolerance";
}

export function noAvpdFourChamberAtrialLandTriSegCliExitCodeV2(
  report: NoAvpdFourChamberAtrialLandReportV2,
): 0 | 1 {
  if (report.status !== "pass") return 1;
  if (
    report.continuationProtocol.periodicConvergenceRequiredForCliSuccess &&
    report.continuationProtocol.periodicClassification !==
      "within-caller-one-beat-return-tolerance"
  ) {
    return 1;
  }
  return 0;
}

/**
 * Loads and verifies an artifact. Current-source checks are opt-in so archived
 * evidence remains inspectable; checkpoint loading below enables them.
 */
export function loadNoAvpdFourChamberAtrialLandTriSegReportV2(
  sourcePath: string,
  expectations: NoAvpdFourChamberAtrialLandReportValidationOptionsV2 = {},
): NoAvpdFourChamberAtrialLandReportV2 {
  const parsed = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
  return validateNoAvpdFourChamberAtrialLandTriSegReportV2(
    parsed,
    expectations,
  );
}

export function validateNoAvpdFourChamberAtrialLandTriSegReportV2(
  value: unknown,
  expectations: NoAvpdFourChamberAtrialLandReportValidationOptionsV2 = {},
): NoAvpdFourChamberAtrialLandReportV2 {
  if (!isRecord(value)) throw new Error("V2 report must be a JSON object");
  const normalizedSha256 = value.normalizedSha256;
  if (typeof normalizedSha256 !== "string") {
    throw new Error("V2 report has no normalized hash");
  }
  const { normalizedSha256: omitted, ...normalizedBody } = value;
  void omitted;
  if (sha256Json(normalizedBody) !== normalizedSha256) {
    throw new Error("V2 report normalized hash does not match its contents");
  }
  if (value.artifactId !== NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_ID_V2) {
    throw new Error("V2 report has an incompatible artifact id");
  }
  if (value.benchId !== NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_BENCH_ID_V2) {
    throw new Error("V2 report has an incompatible bench id");
  }
  if (!isRecord(value.model)) throw new Error("V2 report has no model metadata");
  if (value.model.modelId !== NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2) {
    throw new Error("V2 report has an incompatible model id");
  }
  if (
    value.model.equationsVersionId !==
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2
  ) {
    throw new Error("V2 report has an incompatible equations version");
  }
  if (
    value.model.stateLayoutId !==
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2
  ) {
    throw new Error("V2 report has an incompatible state layout");
  }
  if (
    value.model.rhythmTopologyId !==
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2
  ) {
    throw new Error("V2 report has an incompatible rhythm topology");
  }
  if (value.parameterSnapshot == null || typeof value.parameterSha256 !== "string") {
    throw new Error("V2 report has no parameter snapshot/hash pair");
  }
  if (sha256Json(value.parameterSnapshot) !== value.parameterSha256) {
    throw new Error("V2 report parameter hash does not match its snapshot");
  }
  if (
    expectations.expectedParameterSha256 != null &&
    value.parameterSha256 !== expectations.expectedParameterSha256
  ) {
    throw new Error("V2 report parameter hash does not match the target parameters");
  }
  if (!isRecord(value.protocol) || !isPositiveFinite(value.protocol.dtSec)) {
    throw new Error("V2 report has no valid time step");
  }
  if (
    expectations.expectedDtSec != null &&
    value.protocol.dtSec !== expectations.expectedDtSec
  ) {
    throw new Error("V2 report time step does not match the target protocol");
  }
  if (!isRecord(value.provenance)) {
    throw new Error("V2 report has no provenance metadata");
  }
  if (
    expectations.requireCurrentImplementation === true &&
    value.provenance.implementationSha256 !==
      currentNoAvpdFourChamberAtrialLandImplementationSha256V2()
  ) {
    throw new Error("V2 report implementation hash does not match current equations");
  }
  if (
    expectations.requireCurrentHarness === true &&
    value.provenance.harnessSha256 !==
      currentNoAvpdFourChamberAtrialLandHarnessSha256V2()
  ) {
    throw new Error("V2 report harness hash does not match current reporting code");
  }
  if (expectations.requireAcceptedStructuralRun === true) {
    if (
      value.status !== "pass" ||
      !isRecord(value.numericalGates) ||
      value.numericalGates.allRequestedStepsAccepted !== true
    ) {
      throw new Error("V2 report is not an accepted structural run");
    }
  }
  if (!isRecord(value.finalState)) {
    throw new Error("V2 report has no finalState checkpoint");
  }
  if (!isRecord(value.continuationProtocol)) {
    throw new Error("V2 report has no continuation protocol");
  }
  return value as NoAvpdFourChamberAtrialLandReportV2;
}

/**
 * Integrity-checks and exposes an accepted cycle-boundary checkpoint. Loading
 * does not itself claim that a resumed trajectory has been executed; the next
 * bench run owns that acceptance decision.
 */
export function loadAcceptedNoAvpdFourChamberAtrialLandCheckpointV2(
  sourcePath: string,
  expectedParameterSha256: string,
  expectedDtSec: number,
): NoAvpdFourChamberAtrialLandCheckpointV2 {
  const report = loadNoAvpdFourChamberAtrialLandTriSegReportV2(sourcePath, {
    expectedParameterSha256,
    expectedDtSec,
    requireAcceptedStructuralRun: true,
    requireCurrentImplementation: true,
    requireCurrentHarness: true,
  });
  const cycleLengthSec = report.parameterSnapshot.cycleLengthSec;
  const phaseSec = ((report.finalState.timeSec % cycleLengthSec) + cycleLengthSec) %
    cycleLengthSec;
  const phaseDistanceSec = Math.min(phaseSec, cycleLengthSec - phaseSec);
  if (phaseDistanceSec > Math.max(1e-9, cycleLengthSec * 1e-9)) {
    throw new Error("V2 report final checkpoint is not at a cycle boundary");
  }
  if (
    report.finalState.parameterIdentityCanonicalJson !==
      noAvpdFourChamberAtrialLandParameterIdentityV2(report.parameterSnapshot)
  ) {
    throw new Error("V2 report final checkpoint parameter identity is incompatible");
  }
  const coldInitial = initialNoAvpdFourChamberAtrialLandTriSegStateV2(
    report.parameterSnapshot,
  );
  if (
    Math.abs(
      totalBloodVolumeMl(report.finalState.volumes) -
        totalBloodVolumeMl(coldInitial.volumes),
    ) > Math.max(report.parameterSnapshot.solver.totalBloodVolumeToleranceMl, 1e-6)
  ) {
    throw new Error("V2 report final checkpoint total blood volume is incompatible");
  }
  return Object.freeze({
    initialState: report.finalState,
    provenance: Object.freeze({
      resumeMode: "exact-same-parameter-checkpoint" as const,
      sourceArtifactId: sourcePath,
      sourceNormalizedSha256: report.normalizedSha256,
      sourceParameterSha256: report.parameterSha256,
      sourceImplementationSha256: report.provenance.implementationSha256,
      sourceHarnessSha256: report.provenance.harnessSha256,
      sourceCheckpointStateSha256: sha256Json(report.finalState),
      sourceModelId: NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2,
      sourceEquationsVersionId:
        NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2,
      sourceStateLayoutId:
        NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2,
      sourceRhythmTopologyId:
        NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2,
      sourceDtSec: report.protocol.dtSec,
      sourceCycleLengthSec: report.parameterSnapshot.cycleLengthSec,
      sourceTotalBloodVolumeMl: totalBloodVolumeMl(report.finalState.volumes),
      periodClassification: report.continuationProtocol.periodicClassification ===
          "within-caller-one-beat-return-tolerance"
        ? "one-beat-return-within-caller-tolerance" as const
        : "unclassified" as const,
    }),
  });
}

export function currentNoAvpdFourChamberAtrialLandImplementationSha256V2(): string {
  return hashFiles(
    "no-avpd-four-chamber-atrial-land-state-transition-v2",
    NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_STATE_TRANSITION_PATHS_V2,
  );
}

export function currentNoAvpdFourChamberAtrialLandHarnessSha256V2(): string {
  const hash = createHash("sha256");
  hash.update("no-avpd-four-chamber-atrial-land-harness-v2\0");
  hash.update(currentNoAvpdFourChamberAtrialLandImplementationSha256V2());
  hash.update("\0");
  updateHashWithFiles(hash, NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_HARNESS_PATHS_V2);
  return hash.digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const beats = integerAtLeastArgument("--beats", 12, 3);
  const dtSec = positiveNumericArgument("--dt", 0.001);
  const periodicToleranceMaxAbsDimensionless = nonnegativeNumericArgument(
    "--periodic-tolerance",
    1e-4,
  );
  const destinationPath = resolve(
    repoRoot,
    stringArgument("--output") ??
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
  );
  const requirePeriodicConvergenceForCliSuccess =
    process.argv.includes("--require-periodic");
  const resumeReportPath = stringArgument("--resume-report");
  if (resumeReportPath != null && stringArgument("--output") == null) {
    throw new Error("--resume-report requires --output so the source artifact is not overwritten");
  }
  if (
    resumeReportPath != null &&
    resolve(repoRoot, resumeReportPath) === destinationPath
  ) {
    throw new Error("resume source and output paths must differ");
  }
  const parameterSha256 = sha256Json(
    DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
  );
  const checkpoint = resumeReportPath == null
    ? null
    : loadAcceptedNoAvpdFourChamberAtrialLandCheckpointV2(
        resolve(repoRoot, resumeReportPath),
        parameterSha256,
        dtSec,
      );
  const startedAt = performance.now();
  const report = writeNoAvpdFourChamberAtrialLandTriSegReportV2(
    {
      beats,
      dtSec,
      params: DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
      initialState: checkpoint?.initialState,
      warmStartProvenance: checkpoint?.provenance,
    },
    destinationPath,
    {
      periodicToleranceMaxAbsDimensionless,
      requirePeriodicConvergenceForCliSuccess,
    },
  );
  console.log(JSON.stringify({
    artifactId: report.artifactId,
    benchId: report.benchId,
    status: report.status,
    failureReason: report.failureReason,
    beatsCompleted: report.beatsCompleted,
    elapsedSec: (performance.now() - startedAt) / 1_000,
    outputPath: destinationPath,
    continuationProtocol: report.continuationProtocol,
    solverWork: report.solverWork,
    hardDiagnostics: report.hardDiagnostics,
    numericalGates: report.numericalGates,
    exactOneBeatFullStateReturnMap: report.exactOneBeatFullStateReturnMap,
    reportOnlyPhysiology: report.reportOnlyPhysiology,
    sampleCount: report.samples.length,
    parameterSha256: report.parameterSha256,
    implementationSha256: report.provenance.implementationSha256,
    harnessSha256: report.provenance.harnessSha256,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
  process.exitCode = noAvpdFourChamberAtrialLandTriSegCliExitCodeV2(report);
}

function writeJsonAtomically(destinationPath: string, value: unknown): void {
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
      flag: "wx",
    });
    renameSync(temporaryPath, destinationPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function assertCanonicalDestinationProtocol(
  destinationPath: string,
  options: NoAvpdFourChamberAtrialLandBenchOptionsV2,
  periodicToleranceMaxAbsDimensionless: number,
  requirePeriodicConvergenceForCliSuccess: boolean,
): void {
  if (
    resolve(destinationPath) !==
      resolve(DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2)
  ) {
    return;
  }
  const beats = options.beats ?? 12;
  const dtSec = options.dtSec ?? 0.001;
  const params = options.params ??
    DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2;
  if (
    beats !== 30 ||
    dtSec !== 0.001 ||
    periodicToleranceMaxAbsDimensionless !== 1e-4 ||
    !requirePeriodicConvergenceForCliSuccess ||
    sha256Json(params) !==
      sha256Json(DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2) ||
    options.initialState != null ||
    options.warmStartProvenance != null
  ) {
    throw new Error(
      "canonical V2 report requires an independent 30-beat cold start at dt=0.001 s with the 1e-4 caller one-beat-return gate required",
    );
  }
}

function hashFiles(
  domain: string,
  relativePaths: readonly string[],
): string {
  const hash = createHash("sha256");
  hash.update(`${domain}\0`);
  updateHashWithFiles(hash, relativePaths);
  return hash.digest("hex");
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function updateHashWithFiles(
  hash: ReturnType<typeof createHash>,
  relativePaths: readonly string[],
): void {
  for (const relativePath of relativePaths) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, relativePath)));
    hash.update("\0");
  }
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function positiveNumericArgument(flag: string, fallback: number): number {
  const raw = stringArgument(flag);
  if (raw == null) return fallback;
  const value = Number(raw);
  validatePositiveFinite(value, flag);
  return value;
}

function nonnegativeNumericArgument(flag: string, fallback: number): number {
  const raw = stringArgument(flag);
  if (raw == null) return fallback;
  const value = Number(raw);
  validateNonnegativeFinite(value, flag);
  return value;
}

function integerAtLeastArgument(
  flag: string,
  fallback: number,
  minimum: number,
): number {
  const raw = stringArgument(flag);
  if (raw == null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${flag} must be followed by an integer >= ${minimum}`);
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

function validatePositiveFinite(value: number, label: string): void {
  if (!isPositiveFinite(value)) {
    throw new Error(`${label} must be positive and finite`);
  }
}

function validateNonnegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
