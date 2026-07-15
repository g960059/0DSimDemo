import { createHash } from "node:crypto";
import {
  FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1,
  FOUR_CHAMBER_PHASE_A0_SCOPE,
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
  buildPhaseA0ContractManifestV1,
  canonicalizeJson,
  createPhaseA0ContractManifestPayloadV1,
} from "@/engine/myocardium/fourChamberV1";

const payload = createPhaseA0ContractManifestPayloadV1();
const contentSha256 = sha256(canonicalizeJson(payload));
const manifest = buildPhaseA0ContractManifestV1(contentSha256, sha256);
const failures: string[] = [];

if (manifest.stateLayout.stateCount !== 59 || manifest.stateLayout.stateInventory.length !== 59) {
  failures.push("canonical differential state layout is not 59 states");
}
if (manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM) {
  failures.push("contract manifest does not use canonical JSON SHA-256");
}
if (
  FOUR_CHAMBER_PHASE_A0_SCOPE.modelCoreIntegration
  || FOUR_CHAMBER_PHASE_A0_SCOPE.browserRuntimeAdopted
  || FOUR_CHAMBER_PHASE_A0_SCOPE.mechanics2Dependency
) {
  failures.push("Phase A0 escaped its clean-slate runtime boundary");
}
if (manifest.stateLayout.layoutDiagnosticHash !== FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.layoutDiagnosticHash) {
  failures.push("contract manifest and canonical state layout diagnostic hashes disagree");
}

const report = {
  pass: failures.length === 0,
  phase: manifest.phase,
  modelId: manifest.modelId,
  contractManifestSha256: manifest.contentSha256,
  stateCount: manifest.stateLayout.stateCount,
  stateLayoutDiagnosticHash: manifest.stateLayout.layoutDiagnosticHash,
  runtimeBoundary: manifest.runtimeBoundary,
  acuteWallConstraint: manifest.acuteWallConstraint,
  releaseBlockers: manifest.releaseBlockers,
  failures,
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
