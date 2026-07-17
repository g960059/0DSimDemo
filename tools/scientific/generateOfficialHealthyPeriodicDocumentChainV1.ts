import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  OFFICIAL_HEALTHY_PERIODIC_CASE_DOCUMENT_V1_PATH,
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_PATH,
  OFFICIAL_HEALTHY_PERIODIC_PRESET_DOCUMENT_V1_PATH,
  OFFICIAL_HEALTHY_PERIODIC_V3_CHECKPOINT_PATH,
  OFFICIAL_HEALTHY_PERIODIC_WORKSPACE_DOCUMENT_V1_PATH,
} from "@/engine/scientific/documents";
import {
  buildOfficialHealthyPeriodicDocumentChainV1,
} from "@/tools/scientific/officialHealthyPeriodicDocumentChainV1";
import {
  verifyOfficialHealthyPeriodicDocumentChainV1,
} from "@/tools/scientific/verifyOfficialHealthyPeriodicDocumentChainV1";

export async function generateOfficialHealthyPeriodicDocumentChainCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const unsupported = args.filter((arg) => arg !== "--check");
  if (unsupported.length > 0) {
    throw new Error(`unsupported arguments: ${unsupported.join(", ")}`);
  }
  const checkOnly = args.includes("--check");
  const built = await buildOfficialHealthyPeriodicDocumentChainV1(rootDir);
  const assets = [
    [
      OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_PATH,
      built.bytes.catalog,
    ],
    [OFFICIAL_HEALTHY_PERIODIC_V3_CHECKPOINT_PATH, built.bytes.checkpoint],
    [
      OFFICIAL_HEALTHY_PERIODIC_PRESET_DOCUMENT_V1_PATH,
      built.bytes.presetDocument,
    ],
    [
      OFFICIAL_HEALTHY_PERIODIC_CASE_DOCUMENT_V1_PATH,
      built.bytes.caseDocument,
    ],
    [
      OFFICIAL_HEALTHY_PERIODIC_WORKSPACE_DOCUMENT_V1_PATH,
      built.bytes.workspaceDocument,
    ],
  ] as const;

  if (checkOnly) {
    const fileMatches = Object.fromEntries(assets.map(([relativePath, bytes]) =>
      [relativePath, bytesMatch(rootDir, relativePath, bytes)]));
    const verification = await verifyOfficialHealthyPeriodicDocumentChainV1(
      rootDir,
    );
    const allFilesMatch = Object.values(fileMatches).every(Boolean);
    process.stdout.write(`${JSON.stringify({
      mode: "check",
      allFilesMatch,
      fileMatches,
      verification,
      checkpointSha256: built.checkpoint.checkpointSha256,
      sessionInputSha256: built.checkpoint.sessionInputSha256,
      presetDocumentSha256: built.presetDocument.ref.sha256,
      caseDocumentSha256: built.caseDocument.ref.sha256,
      workspaceDocumentSha256: built.workspaceDocument.ref.sha256,
    }, null, 2)}\n`);
    return allFilesMatch && verification.valid ? 0 : 1;
  }

  for (const [relativePath, bytes] of assets) {
    const absolutePath = path.resolve(rootDir, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, bytes);
  }
  process.stdout.write(`${JSON.stringify({
    mode: "generated",
    assets: Object.fromEntries(assets.map(([relativePath, bytes]) => [
      relativePath,
      { byteLength: bytes.byteLength },
    ])),
    checkpointSha256: built.checkpoint.checkpointSha256,
    sessionInputSha256: built.checkpoint.sessionInputSha256,
    presetDocumentSha256: built.presetDocument.ref.sha256,
    caseDocumentSha256: built.caseDocument.ref.sha256,
    workspaceDocumentSha256: built.workspaceDocument.ref.sha256,
  }, null, 2)}\n`);
  return 0;
}

function bytesMatch(
  rootDir: string,
  relativePath: string,
  expected: Buffer,
): boolean {
  try {
    return readFileSync(path.resolve(rootDir, relativePath)).equals(expected);
  } catch {
    return false;
  }
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  generateOfficialHealthyPeriodicDocumentChainCliV1()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exitCode = 1;
    });
}
