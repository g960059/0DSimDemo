import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  createMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadOfficialHealthyPeriodicCheckpointPresetDocumentV1,
  loadOfficialScientificPresetCatalogV1,
  OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
  type OfficialHealthyPeriodicCheckpointPresetDocumentV1,
  type OfficialScientificPresetCatalogV1,
} from "@/engine/scientific/presets";
import {
  canonicalJsonStringify,
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MainWireScientificSessionV1,
  type MainWireScientificSessionExactCheckpointV2,
} from "@/engine/scientific/runtime";

export type OfficialHealthyPeriodicCheckpointVerificationReportV1 = Readonly<{
  valid: boolean;
  issues: readonly string[];
  presetId: string | null;
  releaseRefMatches: boolean;
  manifestRawFileSha256Matches: boolean;
  rawFileSha256Matches: boolean;
  exactRestoreSucceeded: boolean;
  terminalPeriod1Confirmed: boolean;
  checkpointByteLength: number | null;
}>;

export async function verifyOfficialHealthyPeriodicCheckpointPresetV1(
  rootDir = process.cwd(),
): Promise<OfficialHealthyPeriodicCheckpointVerificationReportV1> {
  const issues: string[] = [];
  let catalog: OfficialScientificPresetCatalogV1 | null = null;
  let document: OfficialHealthyPeriodicCheckpointPresetDocumentV1 | null = null;
  let checkpoint: MainWireScientificSessionExactCheckpointV2 | null = null;
  let checkpointBytes: Buffer | null = null;
  let releaseRefMatches = false;
  let manifestRawFileSha256Matches = false;
  let rawFileSha256Matches = false;
  let exactRestoreSucceeded = false;
  let terminalPeriod1Confirmed = false;

  try {
    const catalogBytes = readFileSync(path.resolve(
      rootDir,
      OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
    ));
    catalog = loadOfficialScientificPresetCatalogV1(
      JSON.parse(catalogBytes.toString("utf8")),
    );
    const canonicalCatalogBytes = Buffer.from(
      `${canonicalJsonStringify(catalog)}\n`,
      "utf8",
    );
    if (!catalogBytes.equals(canonicalCatalogBytes)) {
      issues.push("preset catalog is not the deterministic canonical JSON byte form");
    }
  } catch (error) {
    issues.push(`preset catalog: ${errorMessage(error)}`);
  }
  if (catalog !== null) try {
    const entry = catalog.entries[0];
    const documentBytes = readFileSync(path.resolve(
      rootDir,
      entry.manifest.path,
    ));
    const manifestRawSha = createHash("sha256")
      .update(documentBytes)
      .digest("hex");
    manifestRawFileSha256Matches = manifestRawSha
      === entry.manifest.rawFileSha256;
    if (!manifestRawFileSha256Matches) {
      issues.push("preset manifest raw-file SHA-256 mismatch");
    }
    if (documentBytes.byteLength !== entry.manifest.byteLength) {
      issues.push("preset manifest raw-file byte length mismatch");
    }
    document = loadOfficialHealthyPeriodicCheckpointPresetDocumentV1(
      JSON.parse(documentBytes.toString("utf8")),
    );
    const canonicalDocumentBytes = Buffer.from(
      `${canonicalJsonStringify(document)}\n`,
      "utf8",
    );
    if (!documentBytes.equals(canonicalDocumentBytes)) {
      issues.push("preset manifest is not the deterministic canonical JSON byte form");
    }
  } catch (error) {
    issues.push(`preset document: ${errorMessage(error)}`);
  }
  if (document !== null) {
    try {
      checkpointBytes = readFileSync(path.resolve(
        rootDir,
        document.initialization.checkpoint.path,
      ));
      const rawSha = createHash("sha256").update(checkpointBytes).digest("hex");
      rawFileSha256Matches = rawSha
        === document.initialization.checkpoint.rawFileSha256;
      if (!rawFileSha256Matches) issues.push("checkpoint raw-file SHA-256 mismatch");
      if (checkpointBytes.byteLength
        !== document.initialization.checkpoint.byteLength) {
        issues.push("checkpoint raw-file byte length mismatch");
      }
      checkpoint = JSON.parse(
        checkpointBytes.toString("utf8"),
      ) as MainWireScientificSessionExactCheckpointV2;
      const canonicalBytes = Buffer.from(
        `${canonicalJsonStringify(checkpoint)}\n`,
        "utf8",
      );
      if (!checkpointBytes.equals(canonicalBytes)) {
        issues.push("checkpoint file is not the deterministic canonical JSON byte form");
      }
      if (checkpoint.checkpointId
        !== document.initialization.checkpoint.checkpointId
        || checkpoint.schemaVersion
          !== document.initialization.checkpoint.checkpointSchemaVersion
        || checkpoint.checkpointSha256
          !== document.initialization.checkpoint.checkpointEnvelopeSha256) {
        issues.push("checkpoint envelope identity does not match the preset document");
      }
    } catch (error) {
      issues.push(`checkpoint asset: ${errorMessage(error)}`);
    }
  }
  if (catalog !== null && document !== null && checkpoint !== null) {
    try {
      const release = await createMainWireAdultFiveWallNonCoronaryReleaseV1();
      releaseRefMatches = sameSimulationReleaseRef(
        release.ref,
        document.releaseRef,
      ) && sameSimulationReleaseRef(release.ref, checkpoint.releaseRef);
      if (!releaseRefMatches) issues.push("full SimulationReleaseRef mismatch");
      if (JSON.stringify(release.manifest).includes(
        document.initialization.checkpoint.path,
      ) || JSON.stringify(release.manifest).includes(
        document.initialization.checkpoint.rawFileSha256,
      ) || JSON.stringify(release.manifest).includes(
        catalog.entries[0].manifest.path,
      ) || JSON.stringify(release.manifest).includes(
        catalog.entries[0].manifest.rawFileSha256,
      )) {
        issues.push("SimulationRelease must not embed preset/checkpoint asset references");
      }
      const restored = await MainWireScientificSessionV1.restoreExact(
        release,
        checkpoint,
      );
      exactRestoreSucceeded = true;
      const roundTrip = await restored.checkpointExact();
      if (canonicalJsonStringify(roundTrip) !== canonicalJsonStringify(checkpoint)) {
        issues.push("restored exact checkpoint did not round-trip identically");
      }
      const before = restored.stateIdentity();
      const terminal = restored.settlePeriodic();
      const after = restored.stateIdentity();
      terminalPeriod1Confirmed = terminal.completed
        && terminal.status === "period1-converged"
        && terminal.periodicSteadyStateClaimed
        && !terminal.period2OrbitSuspected
        && !terminal.beatCompletedThisCall
        && terminal.completedStepCountThisCall === 0
        && terminal.completedBeatCount
          === document.protocol.result.completedBeatCount
        && terminal.periodicity.latestPeriod1MaximumNormalizedDelta
          === document.protocol.result.latestPeriod1MaximumNormalizedDelta
        && canonicalJsonStringify(terminal.retainedBeatClosure)
          === canonicalJsonStringify(document.protocol.result.retainedBeatClosure)
        && canonicalJsonStringify(before) === canonicalJsonStringify(after);
      if (!terminalPeriod1Confirmed) {
        issues.push("restored tracker did not confirm the recorded terminal P1 state");
      }
    } catch (error) {
      issues.push(`exact restore: ${errorMessage(error)}`);
    }
  }
  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze(issues),
    presetId: document?.preset.id ?? null,
    releaseRefMatches,
    manifestRawFileSha256Matches,
    rawFileSha256Matches,
    exactRestoreSucceeded,
    terminalPeriod1Confirmed,
    checkpointByteLength: checkpointBytes?.byteLength ?? null,
  });
}

export async function verifyOfficialHealthyPeriodicCheckpointPresetCliV1():
Promise<number> {
  const report = await verifyOfficialHealthyPeriodicCheckpointPresetV1();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.valid ? 0 : 1;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  verifyOfficialHealthyPeriodicCheckpointPresetCliV1()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exitCode = 1;
    });
}
