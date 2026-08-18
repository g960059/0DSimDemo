import { pathToFileURL } from "node:url";

import {
  runMainWireNormalAdultPassiveEquilibriumEngineeringEvidenceV2,
  sealMainWireNormalAdultPassiveEquilibriumCommitAV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2";

export async function verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2() {
  return runMainWireNormalAdultPassiveEquilibriumEngineeringEvidenceV2();
}

export async function sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2() {
  return sealMainWireNormalAdultPassiveEquilibriumCommitAV2();
}

export async function mainMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2(
  args: readonly string[] = process.argv.slice(2),
): Promise<"verify" | "seal"> {
  if (args.length === 0) {
    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();
    process.stdout.write(`${JSON.stringify(artifact)}\n`);
    if (!artifact.payload.officialSealedEngineeringEvidenceEligible)
      process.exitCode = 1;
    return "verify";
  }
  if (args.length === 1 && args[0] === "seal") {
    const manifest =
      await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    process.stdout.write(`${JSON.stringify(manifest)}\n`);
    return "seal";
  }
  throw new Error(
    "usage: [seal]; omit arguments for the official evidence attempt",
  );
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
)
  await mainMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();
