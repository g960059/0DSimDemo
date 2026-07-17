import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadOfficialHealthyPeriodicCheckpointPresetDocumentV1,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
} from "@/engine/scientific/presets";
import {
  canonicalJsonStringify,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
  MainWireScientificSessionV1,
  type MainWireScientificSessionExactCheckpointV2,
} from "@/engine/scientific/runtime";
import {
  evaluateMainWireHealthyReferenceAcceptanceV1,
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1,
} from "@/engine/scientific/validation";
import {
  verifyOfficialHealthyPeriodicCheckpointPresetV1,
} from "@/tools/scientific/verifyOfficialHealthyPeriodicCheckpointPresetV1";

export const MAIN_WIRE_OFFICIAL_HEALTHY_REFERENCE_ACCEPTANCE_V1_PATH =
  "data/scientific/validation/official-healthy-reference-acceptance-v1.json" as const;

export async function buildMainWireOfficialHealthyReferenceAcceptanceV1(
  rootDir = process.cwd(),
) {
  const officialVerification =
    await verifyOfficialHealthyPeriodicCheckpointPresetV1(rootDir);
  if (!officialVerification.valid) {
    throw new Error(
      `official healthy preset failed verification: ${officialVerification.issues.join("; ")}`,
    );
  }
  const presetDocument = loadOfficialHealthyPeriodicCheckpointPresetDocumentV1(
    JSON.parse(readFileSync(path.resolve(
      rootDir,
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
    ), "utf8")),
  );
  const checkpoint = JSON.parse(readFileSync(path.resolve(
    rootDir,
    presetDocument.initialization.checkpoint.path,
  ), "utf8")) as MainWireScientificSessionExactCheckpointV2;
  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  const session =
    await MainWireScientificSessionV1.restoreLegacyCanonicalExactV2(
      release,
      checkpoint,
    );
  const terminal = session.settlePeriodic();
  if (
    !terminal.completed
    || terminal.status !== "period1-converged"
    || !terminal.periodicSteadyStateClaimed
    || terminal.beatCompletedThisCall
    || terminal.completedStepCountThisCall !== 0
  ) {
    throw new Error("official healthy checkpoint is not a terminal P1 state");
  }
  const cycle = session.runTransient({
    dtSec: MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.dtSec,
    stepCount: MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.stepsPerBeat,
  });
  if (!cycle.completed) {
    throw new Error(
      `official healthy measurement cycle failed: ${cycle.failure.message}`,
    );
  }
  const acceptance = evaluateMainWireHealthyReferenceAcceptanceV1(
    cycle.observations,
  );
  const failedGateIds = acceptance.gateResults
    .filter(({ status }) => status !== "pass")
    .map(({ gateId }) => gateId);
  return Object.freeze({
    reportId: "main-wire-official-healthy-reference-acceptance-v1" as const,
    schemaVersion: 1 as const,
    source: Object.freeze({
      releaseRef: release.ref,
      officialPreset: Object.freeze({
        presetId: presetDocument.preset.id,
        presetVersion: presetDocument.preset.version,
      }),
      checkpoint: Object.freeze({
        checkpointId: checkpoint.checkpointId,
        checkpointSchemaVersion: checkpoint.schemaVersion,
        checkpointSha256: checkpoint.checkpointSha256,
      }),
      periodicStateConfirmedBeforeMeasurement: true as const,
      measurementProtocol: Object.freeze({
        dtSec: MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.dtSec,
        stepCount: MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.stepsPerBeat,
        durationSec:
          MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.dtSec
          * MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.stepsPerBeat,
      }),
    }),
    targetPack: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1,
    acceptance,
    cutoverReadiness: Object.freeze({
      evaluatedTargetGatesPassed: acceptance.overallStatus === "pass",
      productionDefaultCutoverAllowed: false as const,
      failedOrUnavailableGateIds: Object.freeze(failedGateIds),
      deferredBlockers:
        MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.deferredAcceptance,
      reason:
        "the first healthy reference screen is necessary but not sufficient; load, basin, dt, morphology, and transient gates remain explicit",
    }),
    claim: Object.freeze({
      deterministicFromCheckedInReleaseAndCheckpoint: true as const,
      noParameterSearchOrFitting: true as const,
      noSmoothing: true as const,
      notClinicalValidation: true as const,
      referenceMissIsNotDiagnosis: true as const,
    }),
  });
}

export async function generateMainWireOfficialHealthyReferenceAcceptanceCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const checkOnly = args.includes("--check");
  const report = await buildMainWireOfficialHealthyReferenceAcceptanceV1(
    rootDir,
  );
  const bytes = Buffer.from(`${canonicalJsonStringify(report)}\n`, "utf8");
  const artifactPath = path.resolve(
    rootDir,
    MAIN_WIRE_OFFICIAL_HEALTHY_REFERENCE_ACCEPTANCE_V1_PATH,
  );
  if (checkOnly) {
    const artifactMatches = readFileSync(artifactPath).equals(bytes);
    process.stdout.write(`${JSON.stringify({
      mode: "check",
      artifactMatches,
      artifactPath: MAIN_WIRE_OFFICIAL_HEALTHY_REFERENCE_ACCEPTANCE_V1_PATH,
      overallStatus: report.acceptance.overallStatus,
      physiologyStatus: report.acceptance.physiologyStatus,
      numericalIntegrityStatus: report.acceptance.numericalIntegrityStatus,
      failedOrUnavailableGateIds:
        report.cutoverReadiness.failedOrUnavailableGateIds,
      deferredBlockers: report.cutoverReadiness.deferredBlockers,
      byteLength: bytes.byteLength,
    }, null, 2)}\n`);
    return artifactMatches ? 0 : 1;
  }
  mkdirSync(path.dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, bytes);
  process.stdout.write(`${JSON.stringify({
    mode: "generated",
    artifactPath: MAIN_WIRE_OFFICIAL_HEALTHY_REFERENCE_ACCEPTANCE_V1_PATH,
    overallStatus: report.acceptance.overallStatus,
    physiologyStatus: report.acceptance.physiologyStatus,
    numericalIntegrityStatus: report.acceptance.numericalIntegrityStatus,
    failedOrUnavailableGateIds:
      report.cutoverReadiness.failedOrUnavailableGateIds,
    deferredBlockers: report.cutoverReadiness.deferredBlockers,
    byteLength: bytes.byteLength,
  }, null, 2)}\n`);
  return 0;
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  generateMainWireOfficialHealthyReferenceAcceptanceCliV1()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.stack : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
