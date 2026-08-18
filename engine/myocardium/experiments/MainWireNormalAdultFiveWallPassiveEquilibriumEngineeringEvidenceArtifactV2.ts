import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { canonicalJsonStringify } from "@/engine/integrity";

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ARTIFACT_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-evidence-v1" as const;

export type MainWireNormalAdultPassiveEquilibriumEngineeringPlatformV2 =
  Readonly<{
    repositoryRoot: () => string;
    gitCommonDirectory: (repositoryRoot: string) => string;
    gitHeadSha: (repositoryRoot: string) => string;
    gitParentSha: (repositoryRoot: string, commitSha: string) => string;
    gitTreeSha: (repositoryRoot: string, commitSha: string) => string;
    gitBlobSha: (
      repositoryRoot: string,
      commitSha: string,
      relativePath: string,
    ) => string;
    gitBlobBytes: (repositoryRoot: string, blobSha: string) => Uint8Array;
    gitDiffNames: (
      repositoryRoot: string,
      fromCommitSha: string,
      toCommitSha: string,
    ) => readonly string[];
    gitStatusPorcelain: (repositoryRoot: string) => string;
    exists: (absolutePath: string) => boolean;
    readUtf8: (absolutePath: string) => string;
    ensureDirectoryDurable: (absolutePath: string) => void;
    writeJsonCreateOnlyDurable: (
      absolutePath: string,
      payload: unknown,
    ) => void;
    replaceJsonViaCreateOnlyStageDurable: (
      destinationPath: string,
      stagePath: string,
      payload: unknown,
    ) => void;
    randomOpaqueId32Hex: () => string;
    rawSha256Hex: (bytes: Uint8Array) => string;
  }>;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2: MainWireNormalAdultPassiveEquilibriumEngineeringPlatformV2 =
  Object.freeze({
    repositoryRoot: () =>
      realpathSync(gitTextV2(process.cwd(), ["rev-parse", "--show-toplevel"])),
    gitCommonDirectory: (repositoryRoot) => {
      const reported = gitTextV2(repositoryRoot, [
        "rev-parse",
        "--git-common-dir",
      ]);
      return realpathSync(
        path.isAbsolute(reported)
          ? reported
          : path.resolve(repositoryRoot, reported),
      );
    },
    gitHeadSha: (repositoryRoot) =>
      gitTextV2(repositoryRoot, ["rev-parse", "HEAD"]),
    gitParentSha: (repositoryRoot, commitSha) =>
      gitTextV2(repositoryRoot, ["rev-parse", `${commitSha}^`]),
    gitTreeSha: (repositoryRoot, commitSha) =>
      gitTextV2(repositoryRoot, ["rev-parse", `${commitSha}^{tree}`]),
    gitBlobSha: (repositoryRoot, commitSha, relativePath) =>
      gitTextV2(repositoryRoot, ["rev-parse", `${commitSha}:${relativePath}`]),
    gitBlobBytes: (repositoryRoot, blobSha) =>
      new Uint8Array(
        execFileSync("git", ["cat-file", "blob", blobSha], {
          cwd: repositoryRoot,
          maxBuffer: 32 * 1024 * 1024,
        }),
      ),
    gitDiffNames: (repositoryRoot, fromCommitSha, toCommitSha) => {
      const output = gitTextV2(repositoryRoot, [
        "diff",
        "--name-only",
        `${fromCommitSha}..${toCommitSha}`,
      ]);
      return Object.freeze(output === "" ? [] : output.split("\n"));
    },
    gitStatusPorcelain: (repositoryRoot) =>
      execFileSync(
        "git",
        ["status", "--porcelain=v1", "--untracked-files=all"],
        {
          cwd: repositoryRoot,
          encoding: "utf8",
          maxBuffer: 16 * 1024 * 1024,
        },
      ),
    exists: existsSync,
    readUtf8: (absolutePath) => readFileSync(absolutePath, "utf8"),
    ensureDirectoryDurable: (absolutePath) => {
      mkdirSync(absolutePath, { recursive: true });
      fsyncDirectoryV2(absolutePath);
    },
    writeJsonCreateOnlyDurable: (absolutePath, payload) => {
      const parent = path.dirname(absolutePath);
      const descriptor = openSync(absolutePath, "wx", 0o600);
      try {
        writeFileSync(
          descriptor,
          `${canonicalJsonStringify(payload)}\n`,
          "utf8",
        );
        fsyncSync(descriptor);
      } finally {
        closeSync(descriptor);
      }
      fsyncDirectoryV2(parent);
    },
    replaceJsonViaCreateOnlyStageDurable: (
      destinationPath,
      stagePath,
      payload,
    ) => {
      const parent = path.dirname(destinationPath);
      const descriptor = openSync(stagePath, "wx", 0o600);
      try {
        writeFileSync(
          descriptor,
          `${canonicalJsonStringify(payload)}\n`,
          "utf8",
        );
        fsyncSync(descriptor);
      } finally {
        closeSync(descriptor);
      }
      renameSync(stagePath, destinationPath);
      fsyncDirectoryV2(parent);
    },
    randomOpaqueId32Hex: () => randomBytes(16).toString("hex"),
    rawSha256Hex: (bytes) => createHash("sha256").update(bytes).digest("hex"),
  });

function gitTextV2(repositoryRoot: string, args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
}

function fsyncDirectoryV2(absolutePath: string): void {
  const descriptor = openSync(absolutePath, "r");
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}
