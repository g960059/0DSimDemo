import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
import {
  assertAdditiveModelSurfaceUpgradeV1,
  assertModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import { studioCanonicalJsonStringify } from "@/studio/infrastructure/json/StudioCanonicalJson";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

await main();

async function main(): Promise<void> {
  const options = parseArgumentsV1(process.argv.slice(2));
  const manifest = readManifestV1(options.manifestPath);
  if (manifest.predecessorSurfaceReleaseId === null) {
    if (options.previousPath !== null) {
      throw new Error("A root Model Surface must not declare --previous");
    }
  } else {
    if (options.previousPath === null) {
      throw new Error(
        `Model Surface ${manifest.surfaceReleaseId} requires --previous for `
          + manifest.predecessorSurfaceReleaseId,
      );
    }
    assertAdditiveModelSurfaceUpgradeV1(
      readManifestV1(options.previousPath),
      manifest,
    );
  }
  assertImmutableAgainstBaseV1(options.manifestPath, manifest);
  const canonical = studioCanonicalJsonStringify(manifest);
  const digest = createHash("sha256").update(canonical).digest("hex");
  process.stdout.write(
    `Model Surface verified: ${manifest.surfaceReleaseId} (${digest})\n`,
  );
}

type VerifyOptionsV1 = Readonly<{
  manifestPath: string;
  previousPath: string | null;
}>;

function parseArgumentsV1(args: readonly string[]): VerifyOptionsV1 {
  if (args.length !== 2 && args.length !== 4) throw usageErrorV1();
  if (args[0] !== "--manifest" || args[1] === undefined) throw usageErrorV1();
  if (args.length === 4 && (args[2] !== "--previous" || args[3] === undefined)) {
    throw usageErrorV1();
  }
  return Object.freeze({
    manifestPath: args[1],
    previousPath: args[3] ?? null,
  });
}

function usageErrorV1(): Error {
  return new Error(
    "Usage: --manifest <repo-relative.json> [--previous <repo-relative.json>]",
  );
}

function readManifestV1(inputPath: string): ModelSurfaceReleaseManifestV1 {
  const absolutePath = repositoryPathV1(inputPath);
  const parsed: unknown = JSON.parse(readFileSync(absolutePath, "utf8"));
  assertModelSurfaceReleaseManifestV1(parsed);
  return parsed;
}

function repositoryPathV1(inputPath: string): string {
  const absolutePath = path.resolve(repositoryRoot, inputPath);
  const relativePath = path.relative(repositoryRoot, absolutePath);
  if (
    relativePath.length === 0
    || relativePath.startsWith("..")
    || path.isAbsolute(relativePath)
  ) {
    throw new Error("Model Surface manifest must be inside the repository");
  }
  return absolutePath;
}

/** CI catches an edited manifest that reuses an immutable release identity. */
function assertImmutableAgainstBaseV1(
  inputPath: string,
  current: ModelSurfaceReleaseManifestV1,
): void {
  const baseRef = process.env.CIRCLEHEART_REGISTRY_BASE_REF;
  if (baseRef === undefined || baseRef.length === 0 || /^0+$/.test(baseRef)) return;
  const relativePath = path.relative(repositoryRoot, repositoryPathV1(inputPath));
  let priorRaw: string;
  try {
    priorRaw = execFileSync("git", ["show", `${baseRef}:${relativePath}`], {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return;
  }
  const priorValue: unknown = JSON.parse(priorRaw);
  assertModelSurfaceReleaseManifestV1(priorValue);
  if (
    priorValue.surfaceReleaseId === current.surfaceReleaseId
    && studioCanonicalJsonStringify(priorValue)
      !== studioCanonicalJsonStringify(current)
  ) {
    throw new Error(
      `Model Surface ${current.surfaceReleaseId} changed without a new `
        + "surfaceReleaseId",
    );
  }
}
