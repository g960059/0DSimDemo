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
});
