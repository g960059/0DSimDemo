import { createHash } from "node:crypto";
import {
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1,
  initializePhaseB1NormalSinusBeLivePeriodicControllerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1,
  buildPhaseB1NormalSinusBePairedSourceParityAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  buildPhaseB1NormalSinusBeTerminalTimestepObservationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  assertCanonicalPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  runPhaseB1LivePeriodicRetainedModeV1,
} from "@/tools/myocardium/phaseB1LivePeriodicRetainedModeRunV1";
import {
  buildPhaseB1TerminalWaveformArtifactV1,
  serializePhaseB1TerminalWaveformArtifactV1,
} from "@/tools/myocardium/phaseB1TerminalWaveformArtifactV1";

const DIAGNOSTIC_ID =
  "phase-b1-normal-sinus-be-sls-on-terminal-waveform-diagnostic-v1" as const;
const OUTPUT_ENV = "PHASE_B1_TERMINAL_WAVEFORM_OUTPUT" as const;
const DEFAULT_OUTPUT =
  "docs/myocardium/verification/four-chamber-triseg-land-phase-b1-sls-on-live-periodic-terminal-waveform-1ms.json" as const;
const NOMINAL_DT_SEC = 0.001 as const;

let sequence = 0;

runDiagnostic();

function runDiagnostic(): void {
  const startedAtMs = performance.now();
  try {
    const outputPath = resolveOutputPath(process.argv.slice(2), process.env);

    // This pre-result definition is deliberately frozen before any numerical
    // cycle is advanced.
    const comparisonManifest =
      assertCanonicalPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
        buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1({
          sha256Hex: sha256,
        }),
      );
    print({
      stage: "comparison-manifest-ready",
      comparisonManifestContentSha256: comparisonManifest.contentSha256,
      comparisonPolicyContentSha256:
        comparisonManifest.bindings.comparisonPolicyContentSha256,
      numericalThreeGridComparisonExecuted: false,
      elapsedSec: elapsedSec(startedAtMs),
    });

    const parentStartedAtMs = performance.now();
    const parentManifest =
      assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
        buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256),
      );
    const parentNumericalEvidence =
      assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
        buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
          parentManifest,
          sha256,
        ),
        parentManifest,
      );
    const schedule = buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      sha256,
    );
    const initialSourceParityAudit =
      assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
        buildPhaseB1NormalSinusBePairedSourceParityAuditV1({
          parentManifest,
          parentNumericalEvidence,
          schedule,
          sha256Hex: sha256,
        }),
        sha256,
      );
    if (
      initialSourceParityAudit.initialCommonCoordinateParityPass !== true
      || initialSourceParityAudit.allEightInitialFlowsExactlyEqualAndZero
        !== true
    ) {
      throw new Error("initial SLS source parity gate did not pass");
    }
    print({
      stage: "parent-ready",
      stageElapsedSec: elapsedSec(parentStartedAtMs),
      elapsedSec: elapsedSec(startedAtMs),
      parentManifestContentSha256: parentManifest.contentSha256,
      parentNumericalEvidenceContentSha256:
        parentNumericalEvidence.certificate.contentSha256,
      scheduleContentSha256: schedule.contentSha256,
      initialSourceParityAuditContentSha256:
        initialSourceParityAudit.contentSha256,
      parentScheduleAndSourceParityBuiltOnce: true,
    });

    const controller =
      assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
        initializePhaseB1NormalSinusBeLivePeriodicControllerV1({
          sourceCase: parentNumericalEvidence.results.on.eventFreeCase,
          schedule,
          nominalDtSec: NOMINAL_DT_SEC,
          sha256Hex: sha256,
        }),
      );
    const parityModeSource = initialSourceParityAudit.slsOnSourceCase;
    if (
      controller.slsMode !== "on"
      || controller.nominalDtSec !== NOMINAL_DT_SEC
      || !Object.is(controller.schedule, schedule)
      || !Object.is(controller.sourceCase.inverse, parityModeSource.inverse)
      || !Object.is(
        controller.sourceCase.referenceEndpoint,
        parityModeSource.referenceEndpoint,
      )
    ) {
      throw new Error(
        "SLS-on 1 ms retained controller lineage or binding differs",
      );
    }
    print({
      stage: "mode-start",
      slsMode: "on",
      nominalDtSec: NOMINAL_DT_SEC,
      definitionContentSha256: controller.definition.contentSha256,
      newtonScaleRegistryContentSha256:
        controller.sourceCase.destinationRegistry.registryContentSha256,
      elapsedSec: elapsedSec(startedAtMs),
    });

    const outcome = runPhaseB1LivePeriodicRetainedModeV1({
      parentManifest,
      parentNumericalEvidence,
      schedule,
      initialController: controller,
      sha256Hex: sha256,
      emitCycleRecord: (record) => print({
        stage: "cycle-complete",
        mode: record.mode,
        nominalDtSec: record.nominalDtSec,
        cycleIndex: record.cycleIndex,
        cycleElapsedSec: record.cycleElapsedSec,
        adjacentMaximumNormalizedDistance:
          record.adjacentMaximumNormalizedDistance,
        streakWindowMaximumNormalizedDistance:
          record.streakWindowMaximumNormalizedDistance,
        adjacentMaximumSlsNormalizedDistance:
          record.adjacentMaximumSlsNormalizedDistance,
        maximumRelativeSignedNetFlowMismatch:
          record.maximumRelativeSignedNetFlowMismatch,
        consecutivePassingSupercycles:
          record.consecutivePassingSupercycles,
        terminalStatus: record.terminalStatus,
        periodicConvergenceCriterionPass:
          record.periodicConvergenceCriterionPass,
        cycleEvidenceContentSha256: record.cycleEvidenceContentSha256,
        elapsedSec: elapsedSec(startedAtMs),
      }),
    });
    if (outcome.completed === false) {
      const failureHash = outcome.livePeriodicFailure?.contentSha256
        ?? outcome.terminalCycleCapsuleFailure?.contentSha256
        ?? "unavailable";
      throw new Error(
        `SLS-on 1 ms retained run failed (${outcome.failureKind}; ${failureHash})`,
      );
    }
    const capsule = outcome.terminalCycleCapsule;
    const energy = outcome.committedCycleMechanicalEnergyAudit;
    if (
      capsule.terminalStatus !== "converged"
      || capsule.terminalCycleConvergencePass !== true
      || capsule.liveSingleStartPeriodOneCriterionPass !== true
      || !Object.is(energy.sourceTerminalCycleCapsule, capsule)
    ) {
      throw new Error("retained run did not return matching converged evidence");
    }

    const terminalObservation =
      assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
        buildPhaseB1NormalSinusBeTerminalTimestepObservationV1({
          comparisonManifest,
          initialSourceParityAudit,
          terminalCycleCapsule: capsule,
          committedCycleEnergyAudit: energy,
          sha256Hex: sha256,
        }),
        sha256,
      );
    const artifact = buildPhaseB1TerminalWaveformArtifactV1({
      terminalObservation,
      sha256Hex: sha256,
    });
    writeAtomically(
      outputPath,
      serializePhaseB1TerminalWaveformArtifactV1(artifact, sha256),
    );

    print({
      stage: "final",
      outputPath,
      artifactContentSha256: artifact.contentSha256,
      terminalTimestepObservationContentSha256:
        terminalObservation.contentSha256,
      terminalCycleCapsuleContentSha256: capsule.contentSha256,
      committedCycleEnergyAuditContentSha256: energy.contentSha256,
      sampleTraceContentSha256: terminalObservation.sampleTrace.contentSha256,
      sampleCount: artifact.grid.selectedSampleCount,
      terminalObservationGatePass:
        terminalObservation.terminalObservationGatePass,
      authenticatedNegativeObservationIssued:
        terminalObservation.authenticatedNegativeObservationIssued,
      sourceAuthenticatedInProcessBeforeSerialization: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
      numericalThreeGridComparisonPass: false,
      timestepConvergenceAcceptancePass: false,
      cycleEnergyAcceptancePass: false,
      physiologicalValidationPass: false,
      phaseB1AcceptancePass: false,
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      releaseRuntimeReachable: false,
      elapsedSec: elapsedSec(startedAtMs),
    });
    process.exitCode = 0;
  } catch (error) {
    print({
      stage: "diagnostic-tool-failure",
      failureReason: error instanceof Error ? error.message : String(error),
      sourceAuthenticatedInProcessBeforeSerialization: false,
      builderIssuedAuthenticationSurvivesSerialization: false,
      numericalThreeGridComparisonPass: false,
      timestepConvergenceAcceptancePass: false,
      cycleEnergyAcceptancePass: false,
      physiologicalValidationPass: false,
      phaseB1AcceptancePass: false,
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      releaseRuntimeReachable: false,
      elapsedSec: elapsedSec(startedAtMs),
    });
    process.exitCode = 1;
  }
}

function resolveOutputPath(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): string {
  let cliValue: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output") {
      if (cliValue !== undefined || index + 1 >= argv.length) {
        throw new Error("--output must be supplied exactly once with a path");
      }
      cliValue = argv[index + 1];
      index += 1;
    } else if (argument.startsWith("--output=")) {
      if (cliValue !== undefined) {
        throw new Error("--output must be supplied at most once");
      }
      cliValue = argument.slice("--output=".length);
    } else {
      throw new Error(`unsupported argument ${argument}`);
    }
  }
  const raw = cliValue ?? env[OUTPUT_ENV] ?? DEFAULT_OUTPUT;
  if (raw.trim().length === 0 || raw.includes("\0")) {
    throw new Error("terminal waveform output path must be non-empty");
  }
  return path.resolve(process.cwd(), raw);
}

function writeAtomically(outputPath: string, serialized: string): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  try {
    writeFileSync(temporaryPath, serialized, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    renameSync(temporaryPath, outputPath);
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    throw error;
  }
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function elapsedSec(startedAtMs: number): number {
  return (performance.now() - startedAtMs) / 1000;
}

function print(value: Readonly<Record<string, unknown>>): void {
  // Builder-issued WeakSet authentication is intentionally never claimed for
  // this serialized progress projection.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    diagnosticId: DIAGNOSTIC_ID,
    sequence,
    ...value,
    testOnly: true,
  }));
  sequence += 1;
}
