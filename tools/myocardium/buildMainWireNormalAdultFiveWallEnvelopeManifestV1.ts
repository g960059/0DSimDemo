import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import type {
  MainWireNormalAdultFiveWallDtHalvingComparisonV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallDtHalvingV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

const MANIFEST_ID =
  "main-wire-normal-adult-five-wall-fixed-envelope-manifest-v1" as const;

const verificationDirectory = path.resolve(requiredArgument("--verification"));
const visualDirectory = path.resolve(requiredArgument("--visuals"));
const outputPath = path.resolve(requiredArgument("--output"));
const sourceRevision = requiredArgument("--source-revision");

const bootstrapPath = verificationPath("periodic-dt4ms-converged.json");
const runSpecs = Object.freeze({
  healthyDt2ms: Object.freeze({
    raw: verificationPath("healthy-dt2ms.json"),
    summary: verificationPath("healthy-summary-dt2ms.json"),
    visualHtml: null,
    visualSvg: null,
    visualNominalDtMatchesRun: false,
    warmStartSource: bootstrapPath,
  }),
  healthyDt1ms: Object.freeze({
    raw: verificationPath("healthy-dt1ms.json"),
    summary: verificationPath("healthy-summary-dt1ms.json"),
    visualHtml: visualPath(
      "mainwire-shared-circulation-kernel-v1-healthy-dt1ms.html",
    ),
    visualSvg: visualPath(
      "mainwire-shared-circulation-kernel-v1-healthy-dt1ms.svg",
    ),
    visualNominalDtMatchesRun: true,
    warmStartSource: bootstrapPath,
  }),
  effusionDt2ms: Object.freeze({
    raw: verificationPath("effusion-dt2ms.json"),
    summary: verificationPath("effusion-summary-dt2ms.json"),
    visualHtml: visualPath(
      "mainwire-shared-circulation-kernel-v1-effusion-dt2ms.html",
    ),
    visualSvg: visualPath(
      "mainwire-shared-circulation-kernel-v1-effusion-dt2ms.svg",
    ),
    visualNominalDtMatchesRun: true,
    warmStartSource: bootstrapPath,
  }),
  effusionDt1ms: Object.freeze({
    raw: verificationPath("effusion-dt1ms.json"),
    summary: verificationPath("effusion-summary-dt1ms.json"),
    visualHtml: null,
    visualSvg: null,
    visualNominalDtMatchesRun: false,
    warmStartSource: bootstrapPath,
  }),
  slsOffDt2ms: Object.freeze({
    raw: verificationPath("sls-off-dt2ms.json"),
    summary: verificationPath("sls-off-summary-dt2ms.json"),
    visualHtml: visualPath(
      "mainwire-shared-circulation-kernel-v1-sls-off-dt2ms.html",
    ),
    visualSvg: visualPath(
      "mainwire-shared-circulation-kernel-v1-sls-off-dt2ms.svg",
    ),
    visualNominalDtMatchesRun: true,
    warmStartSource: null,
  }),
});

const manifest = Object.freeze({
  manifestId: MANIFEST_ID,
  sourceRevision,
  claims: Object.freeze({
    parameterSearch: false,
    morphologyFit: false,
    timeSeriesSmoothingOrInterpolation: false,
    convergenceOrderClaimed: false,
    postHocPassThresholdApplied: false,
    healthyMorphologyRequiresPeriod1: true,
    effusionMorphologyAccepted: false,
    slsOffOneCrossingTopologyRequired: false,
    rawResultsCommitted: false,
  }),
  bootstrap: Object.freeze({
    role: "shared-cycle-boundary-warm-start-source",
    artifact: artifact(bootstrapPath, "local-raw-not-committed"),
    evidence: runEvidence(
      readJson<MainWireNormalAdultFiveWallPeriodicResultV1>(bootstrapPath),
      readJson<MainWireNormalAdultFiveWallPeriodicSummaryV1>(
        verificationPath("periodic-summary-dt4ms-converged.json"),
      ),
      null,
    ),
  }),
  runs: Object.freeze(Object.fromEntries(
    Object.entries(runSpecs).map(([runId, spec]) => {
      const raw = readJson<MainWireNormalAdultFiveWallPeriodicResultV1>(
        spec.raw,
      );
      const summary = readJson<MainWireNormalAdultFiveWallPeriodicSummaryV1>(
        spec.summary,
      );
      return [runId, Object.freeze({
        evidence: runEvidence(raw, summary, spec.warmStartSource),
        artifacts: Object.freeze({
          raw: artifact(spec.raw, "local-raw-not-committed"),
          summary: artifact(spec.summary, "commit"),
          visualHtml: spec.visualHtml === null
            ? null : artifact(spec.visualHtml, "commit"),
          visualSvg: spec.visualSvg === null
            ? null : artifact(spec.visualSvg, "commit"),
          visualNominalDtMatchesRun: spec.visualNominalDtMatchesRun,
        }),
      })];
    }),
  )),
  dtHalving: Object.freeze({
    healthy: comparisonEvidence(
      verificationPath("healthy-dt2ms-to-dt1ms.json"),
    ),
    effusion: comparisonEvidence(
      verificationPath("effusion-dt2ms-to-dt1ms.json"),
    ),
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  outputPath,
  manifestId: MANIFEST_ID,
  sourceRevision,
  runIds: Object.keys(manifest.runs),
  healthyDtHalvingInterpretable: manifest.dtHalving.healthy.interpretable,
  effusionDtHalvingInterpretable: manifest.dtHalving.effusion.interpretable,
}, null, 2)}\n`);

function runEvidence(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV1,
  warmStartSourcePath: string | null,
) {
  const terminal = result.terminalCycleBoundaryWarmStart;
  return Object.freeze({
    options: Object.freeze({
      dtSec: result.dtSec,
      requestedMaximumBeatCount: result.requestedMaximumBeatCount,
      initialization: result.initialization,
      laSlsMode: result.laSlsMode,
      pericardiumMode: result.pericardiumMode,
      pericardiumCase: result.pericardiumCase,
      pericardiumParameterSetId: result.pericardiumParameterSetId,
    }),
    warmStartSource: warmStartSourcePath === null ? null : artifact(
      warmStartSourcePath,
      "local-raw-not-committed",
    ),
    initializationAudit: result.initializationAudit,
    protocol: Object.freeze({
      identityHash: result.protocolIdentityHash,
      componentHashes: result.protocolComponentHashes,
      bloodVolumeOperatingPoint: summary.bloodVolumeOperatingPoint,
    }),
    integration: Object.freeze({
      completedWithoutFailure: result.integrationCompletedWithoutFailure,
      failure: result.failure,
      retainedPartialBeat: result.retainedPartialBeat,
      terminalCheckpointAvailable: terminal !== null,
      terminalEnvelopeFingerprint: terminal?.envelopeFingerprint ?? null,
      terminalCheckpointFingerprint:
        terminal?.checkpoint.checkpointFingerprint ?? null,
      terminalCheckpointTotalBloodVolumeMl:
        terminal?.checkpoint.circulation.state.totalBloodVolumeMl ?? null,
    }),
    periodicity: Object.freeze({
      terminationReason: result.terminationReason,
      completedBeatCount: result.completedBeatCount,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      period2OrbitSuspected: result.period2OrbitSuspected,
      classifier: summary.convergence.classifier,
      evidenceClosures: summary.convergence.evidenceClosures,
    }),
    morphologyInterpretation: summary.morphologyInterpretation,
    laPvMorphology: summary.laPvMorphology,
    hemodynamics: summary.hemodynamics,
    cyclePhysiologyAvailability: summary.cyclePhysiologyAvailability,
    leftAtrialVolumes: summary.cyclePhysiology?.leftAtrialVolumes ?? null,
    leftAtrialPressureWaves:
      summary.cyclePhysiology?.leftAtrialPressureWaves ?? null,
    commonPericardium: summary.ranges.commonPericardium,
    laSlsEnergy: summary.cyclePhysiology?.workEnergy.perWall.LA.sls ?? null,
    residualMaxima: summary.residualMaxima,
  });
}

function comparisonEvidence(inputPath: string) {
  const comparison = readJson<
    MainWireNormalAdultFiveWallDtHalvingComparisonV1
  >(inputPath);
  return Object.freeze({
    artifact: artifact(inputPath, "commit"),
    protocolIdentity: comparison.protocolIdentity,
    coarseDtSec: comparison.coarseDtSec,
    fineDtSec: comparison.fineDtSec,
    bothPeriod1Converged: comparison.bothPeriod1Converged,
    interpretable: comparison.interpretable,
    interpretabilityReasons: comparison.interpretabilityReasons,
    signalMetrics: comparison.signalMetrics,
    claim: comparison.claim,
  });
}

function artifact(
  inputPath: string,
  repositoryDisposition: "commit" | "local-raw-not-committed",
) {
  const bytes = readFileSync(inputPath);
  return Object.freeze({
    path: path.relative(process.cwd(), inputPath),
    bytes: statSync(inputPath).size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    repositoryDisposition,
  });
}

function readJson<T>(inputPath: string): T {
  return JSON.parse(readFileSync(inputPath, "utf8")) as T;
}

function verificationPath(fileName: string): string {
  return path.join(verificationDirectory, fileName);
}

function visualPath(fileName: string): string {
  return path.join(visualDirectory, fileName);
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
