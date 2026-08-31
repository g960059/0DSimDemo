import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_CLAIM_V1,
  MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1,
  assertMainWireStandard66ValidationRunArtifactV1,
  createMainWireStandard66ValidationRunArtifactV1,
  parseMainWireStandard66ValidationRunArtifactV1,
  serializeMainWireStandard66ValidationRunArtifactV1,
} from "@/analysis/runtime/MainWireStandard66ValidationRunArtifactV1";
import {
  runMainWireStandard66ValidationArmV1,
  type MainWireStandard66ValidationArmResultV1,
} from "@/analysis/runtime/MainWireStandard66ValidationArmRunnerV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";
import {
  parseMainWireStandard66ValidationArmCliArgumentsV1,
  runMainWireStandard66ValidationArmCliV1,
} from "@/tools/scientific/runMainWireStandard66ValidationArmV1";

describe("Standard66 validation run artifact V1", () => {
  let boundedSmoke: MainWireStandard66ValidationArmResultV1;

  beforeAll(async () => {
    boundedSmoke = await runMainWireStandard66ValidationArmV1({
      clockArmId: "dt-2ms-production",
      executionPurpose: "bounded-smoke",
      boundedSmokeHorizonSec: 0.01,
    });
  }, 120_000);

  it("wraps the integrated arm record without inventing outcomes or acceptance claims", async () => {
    const artifact = await createMainWireStandard66ValidationRunArtifactV1({
      study: Object.freeze({
        studyKind: "validation-envelope",
        caseId: "default",
      }),
      armResult: boundedSmoke,
    });

    expect(artifact.payload.armResult).toEqual(boundedSmoke);
    expect(artifact.payload.armResult.status).toBe("bounded-smoke-complete");
    expect(artifact.payload.armResult.confirmation).toBeNull();
    expect(artifact.payload.armResult.outcomes).toBeNull();
    expect(artifact.payload.claim).toEqual(
      MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_CLAIM_V1,
    );
    expect(artifact.payload.claim).toMatchObject({
      researchOnly: true,
      artifactIntegrityIsIndependentValidation: false,
      clinicalUseAuthorized: false,
      releaseAcceptanceEstablished: false,
      causalAttributionClaimed: false,
    });
    expect(artifact.protocolManifestSha256).toBe(
      await sha256CanonicalJsonHex(
        MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1,
      ),
    );
    expect(artifact.payloadSha256).toBe(
      await sha256CanonicalJsonHex(artifact.payload),
    );
  });

  it("round-trips as deterministic canonical JSON and returns a detached frozen record", async () => {
    const artifact = await createMainWireStandard66ValidationRunArtifactV1({
      study: Object.freeze({
        studyKind: "geometry-profile",
        stageId: "held-out-load-default",
      }),
      armResult: boundedSmoke,
    });
    const first =
      await serializeMainWireStandard66ValidationRunArtifactV1(artifact);
    const parsed = await parseMainWireStandard66ValidationRunArtifactV1(first);
    const second =
      await serializeMainWireStandard66ValidationRunArtifactV1(parsed);

    expect(second).toBe(first);
    expect(parsed).toEqual(artifact);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.payload)).toBe(true);
    expect(Object.isFrozen(parsed.payload.armResult.protocolIdentity)).toBe(
      true,
    );
  });

  it("accepts only coordinates evidenced by construction and rejects unauthenticated variant labels", async () => {
    const heldOutLoad = await createMainWireStandard66ValidationRunArtifactV1({
      study: Object.freeze({
        studyKind: "geometry-profile",
        stageId: "held-out-load-default",
      }),
      armResult: boundedSmoke,
    });

    expect(heldOutLoad.payload.study).toEqual({
      studyKind: "geometry-profile",
      stageId: "held-out-load-default",
    });
    await expect(
      createMainWireStandard66ValidationRunArtifactV1({
        study: Object.freeze({
          studyKind: "geometry-profile",
          stageId: "diameter-3p0cm",
        }),
        armResult: boundedSmoke,
      }),
    ).rejects.toThrow(/authenticated geometry variant identity/);
    await expect(
      createMainWireStandard66ValidationRunArtifactV1({
        study: Object.freeze({
          studyKind: "mechanism-knockout",
          mechanismId: "pressure-recovery",
          comparisonRole: "reference",
        }),
        armResult: boundedSmoke,
      }),
    ).rejects.toThrow(/authenticated mechanism variant identity/);
    await expect(
      createMainWireStandard66ValidationRunArtifactV1({
        study: Object.freeze({
          studyKind: "validation-envelope",
          caseId: "resolution-iv-01",
        }),
        armResult: boundedSmoke,
      }),
    ).rejects.toThrow(/differs from envelope case/);
  });

  it("rejects both stale integrity hashes and self-consistent semantic overclaims", async () => {
    const artifact = await createMainWireStandard66ValidationRunArtifactV1({
      study: Object.freeze({
        studyKind: "validation-envelope",
        caseId: "default",
      }),
      armResult: boundedSmoke,
    });
    const stale = JSON.parse(
      await serializeMainWireStandard66ValidationRunArtifactV1(artifact),
    ) as Record<string, any>;
    stale.payload.claim.causalAttributionClaimed = true;
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(stale),
    ).rejects.toThrow(/payload hash is invalid/);

    const overclaim = JSON.parse(
      await serializeMainWireStandard66ValidationRunArtifactV1(artifact),
    ) as Record<string, any>;
    overclaim.payload.armResult.status = "terminal-analysis-complete";
    overclaim.payloadSha256 = await sha256CanonicalJsonHex(overclaim.payload);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(overclaim),
    ).rejects.toThrow(/outcome availability is inconsistent/);
  });

  it("parses only preregistered envelope and clock coordinates", () => {
    expect(
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--case",
        "resolution-iv-16",
        "--arm",
        "dt-0p5ms-reference",
      ]),
    ).toEqual({
      caseId: "resolution-iv-16",
      clockArmId: "dt-0p5ms-reference",
      outputPath: null,
      boundedSmokeHorizonSec: null,
      forceOverwrite: false,
    });
    expect(
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--force",
        "--case",
        "default",
        "--arm",
        "dt-2ms-production",
      ]).forceOverwrite,
    ).toBe(true);
    expect(() =>
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--case",
        "resolution-iv-17",
        "--arm",
        "dt-2ms-production",
      ]),
    ).toThrow(/preregistered validation-envelope case/);
    expect(() =>
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--case",
        "default",
        "--arm",
        "dt-3ms",
      ]),
    ).toThrow(/preregistered clock arm/);
    expect(() =>
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--case",
        "default",
        "--arm",
        "dt-2ms-production",
        "--bounded-smoke-seconds",
        "49",
      ]),
    ).toThrow(/preregistered initial horizon/);
    expect(() =>
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--case",
        "default",
        "--case",
        "resolution-iv-01",
        "--arm",
        "dt-2ms-production",
      ]),
    ).toThrow(/specified only once/);
    expect(() =>
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--case",
        "default",
        "--arm",
        "dt-2ms-production",
        "--force",
        "--force",
      ]),
    ).toThrow(/--force may be specified only once/);
  });

  it("writes canonical JSON exclusively and overwrites only with explicit force", async () => {
    const directory = mkdtempSync(
      path.join(tmpdir(), "standard66-validation-cli-v1-"),
    );
    const outputPath = path.join(directory, "nested", "artifact.json");
    const args = [
      "--case",
      "resolution-iv-01",
      "--arm",
      "dt-2ms-production",
      "--bounded-smoke-seconds",
      "0.01",
      "--output",
      outputPath,
    ] as const;
    try {
      const summary = await runMainWireStandard66ValidationArmCliV1(args);
      const serialized = readFileSync(outputPath, "utf8");
      const artifact =
        await parseMainWireStandard66ValidationRunArtifactV1(serialized);
      const envelopeCase =
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.find(
          ({ caseId }) => caseId === "resolution-iv-01",
        )!;

      expect(summary).toMatchObject({
        study: {
          studyKind: "validation-envelope",
          caseId: "resolution-iv-01",
        },
        clockArmId: "dt-2ms-production",
        executionPurpose: "bounded-smoke",
        status: "bounded-smoke-complete",
        outputPath: path.resolve(outputPath),
        settlement: {
          status: "bounded-smoke-complete",
          numericalPeriod1Established: false,
        },
        confirmation: null,
        keyMetrics: null,
      });
      expect(serialized).toBe(
        `${await serializeMainWireStandard66ValidationRunArtifactV1(artifact)}\n`,
      );
      expect(
        artifact.payload.armResult.protocolIdentity.exactConstruction
          .hemodynamicResearchInputs,
      ).toEqual(envelopeCase.hemodynamicResearchInputs);

      await expect(
        runMainWireStandard66ValidationArmCliV1(args),
      ).rejects.toThrow(/EEXIST/);
      expect(readFileSync(outputPath, "utf8")).toBe(serialized);

      await expect(
        runMainWireStandard66ValidationArmCliV1([...args, "--force"]),
      ).resolves.toMatchObject({ outputPath: path.resolve(outputPath) });
      await expect(
        parseMainWireStandard66ValidationRunArtifactV1(
          readFileSync(outputPath, "utf8"),
        ),
      ).resolves.toMatchObject({
        payload: {
          study: {
            studyKind: "validation-envelope",
            caseId: "resolution-iv-01",
          },
        },
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }, 120_000);
});
