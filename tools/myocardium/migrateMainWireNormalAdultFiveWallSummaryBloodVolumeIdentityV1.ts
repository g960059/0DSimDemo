import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  resolveMainWireNormalAdultBloodVolumePriorV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumePriorV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

const inputPath = path.resolve(requiredArgument("--input"));
const outputPath = path.resolve(requiredArgument("--output"));
const source = JSON.parse(readFileSync(inputPath, "utf8")) as Record<
  string,
  any
>;
const prior = resolveMainWireNormalAdultBloodVolumePriorV1(
  "cold-seed-control",
);

if (source.summaryId !== "main-wire-normal-adult-five-wall-periodic-summary-v1") {
  throw new Error("input is not a periodic five-wall summary V1");
}
if (source.protocol?.identity?.operatingPoint !== undefined) {
  throw new Error("input already carries an operating-point identity");
}
if (source.protocol?.componentHashes?.bloodVolumePriorStableHash !== undefined) {
  throw new Error("input already carries a blood-volume component hash");
}

source.protocol.identity.operatingPoint = {
  bloodVolumePriorSnapshot: prior.snapshot,
  bloodVolumePriorSnapshotStableHash: prior.snapshotStableHash,
};
source.protocol.componentHashes.bloodVolumePriorStableHash =
  prior.snapshotStableHash;
source.protocol.identityHash = stableHash(sanitizeForStableHash(
  source.protocol.identity,
));
source.source.bloodVolumePriorVariant = "cold-seed-control";
source.source.bloodVolumePriorAudit = prior.audit;

const migrated = source as MainWireNormalAdultFiveWallPeriodicSummaryV1;
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(migrated, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  inputPath,
  outputPath,
  dynamicsRegenerated: false,
  migration:
    "add-fixed-control-TBV-owner-to-protocol-identity-and-summary-source",
  bloodVolumePriorVariant: migrated.source.bloodVolumePriorVariant,
  bloodVolumePriorStableHash:
    migrated.protocol.componentHashes.bloodVolumePriorStableHash,
  protocolIdentityHash: migrated.protocol.identityHash,
}, null, 2)}\n`);

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) throw new Error(`${name} is required`);
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
