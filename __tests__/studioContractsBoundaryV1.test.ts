import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  type RuntimeControlIntentV1,
  type RuntimeTargetIntentCommandV1,
  type StudioArtifactRefV1,
} from "@/studio/contracts/v1";

describe("Studio V1 contract and dependency boundary", () => {
  it("keeps contracts/application/infrastructure independent from engine and UI packages", () => {
    const studioRoot = path.resolve(process.cwd(), "studio");
    const problems = typescriptFilesV1(studioRoot)
      .filter((file) => !file.includes(`${path.sep}adapters${path.sep}`))
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        return [
          /(?:from|import\()\s*["'][^"']*(?:\/engine\/|@\/engine\/)/.test(source)
            ? `${relativeV1(file)} imports engine`
            : null,
          /(?:from|import\()\s*["'][^"']*(?:react|firebase|components\/)/.test(source)
            ? `${relativeV1(file)} imports presentation/host code`
            : null,
        ].filter((problem): problem is string => problem !== null);
      });

    expect(problems).toEqual([]);
  });

  it("keeps aggregate runtime commands and refs as plain serializable values", () => {
    const runRef = refV1("run-artifact", "a");
    const intent: RuntimeControlIntentV1 = {
      intentId: "intent/shared-afterload",
      targets: [
        {
          scenarioId: "baseline",
          patch: {
            targetInputSha256: "b".repeat(64),
            values: { "circulation.svr-scale": 1.25 },
          },
        },
        {
          scenarioId: "hfrEF",
          patch: {
            targetInputSha256: "c".repeat(64),
            values: { "circulation.svr-scale": 1.25 },
          },
        },
      ],
    };
    const command: RuntimeTargetIntentCommandV1 = {
      sessionId: "session/one",
      intentId: intent.intentId,
      targets: intent.targets.map((target, index) => ({
        scenarioId: target.scenarioId,
        liveBranchId: `branch/${target.scenarioId}`,
        targetGeneration: index + 1,
        presentationRevision: index + 1,
        patch: target.patch,
      })),
    };

    expect(JSON.parse(JSON.stringify({ runRef, intent, command }))).toEqual({
      runRef,
      intent,
      command,
    });
    expect(command.targets).toHaveLength(2);
    expect(runRef.schemaId).toBe(STUDIO_ARTIFACT_REF_V1_SCHEMA_ID);
  });
});

function typescriptFilesV1(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFilesV1(absolute);
    return entry.isFile() && entry.name.endsWith(".ts") ? [absolute] : [];
  });
}

function relativeV1(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}

function refV1<TKind extends StudioArtifactRefV1["kind"]>(
  kind: TKind,
  digit: string,
): StudioArtifactRefV1<TKind> {
  return {
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind,
    sha256: digit.repeat(64),
    mediaType: "application/json",
    byteLength: 1,
  };
}
