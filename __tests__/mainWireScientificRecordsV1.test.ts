import { describe, expect, it } from "vitest";

import {
  BUILD_ARTIFACT_REF_V1_SCHEMA_ID,
  BuildArtifactRefValidationErrorV1,
  createMainWireAdultFiveWallNonCoronaryReleaseV1,
  createRunArtifactV1,
  loadBuildArtifactRefV1,
  loadRunArtifactV1,
  MAIN_WIRE_ADULT_FIVE_WALL_NUMERICAL_RUNTIME_ABI_V1,
  RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
  RUN_ARTIFACT_REF_V1_SCHEMA_ID,
  RunArtifactValidationErrorV1,
  sha256CanonicalJsonHex,
  type BuildArtifactRefV1,
  type RunArtifactContentInputV1,
} from "@/engine/scientific";

describe("BuildArtifactRef V1", () => {
  it("loads only caller-supplied exact provenance and recursively detaches it", async () => {
    const input = await mutableBuildArtifactRef();
    const loaded = loadBuildArtifactRefV1(input);

    expect(loaded).toEqual(input);
    expect(loaded.schemaId).toBe(BUILD_ARTIFACT_REF_V1_SCHEMA_ID);
    expect(loaded.numericalRuntimeAbi).toEqual({
      id: MAIN_WIRE_ADULT_FIVE_WALL_NUMERICAL_RUNTIME_ABI_V1.id,
      version: MAIN_WIRE_ADULT_FIVE_WALL_NUMERICAL_RUNTIME_ABI_V1.version,
    });
    expect(loaded.source).toEqual({
      repository: "g960059/0DSimDemo",
      gitCommitSha: "1".repeat(40),
      gitTreeSha: "2".repeat(40),
      gitWorktreeStatus: "clean",
    });
    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen(loaded.simulationReleaseRef)).toBe(true);
    expect(Object.isFrozen(loaded.numericalRuntimeAbi)).toBe(true);
    expect(Object.isFrozen(loaded.source)).toBe(true);

    input.source.repository = "mutated/repository";
    input.simulationReleaseRef.id = "mutated/release";
    expect(loaded.source.repository).toBe("g960059/0DSimDemo");
    expect(loaded.simulationReleaseRef.id).not.toBe("mutated/release");

    const dirtyInput = await mutableBuildArtifactRef();
    dirtyInput.source.gitWorktreeStatus = "dirty";
    expect(loadBuildArtifactRefV1(dirtyInput).source.gitWorktreeStatus)
      .toBe("dirty");
  });

  it("fails closed on unknown, abbreviated, or invalid provenance", async () => {
    const unknown = await mutableBuildArtifactRef();
    unknown.generatedAt = "now";
    expect(() => loadBuildArtifactRefV1(unknown)).toThrow(
      /buildArtifactRef.generatedAt is not allowed/,
    );

    const abbreviatedCommit = await mutableBuildArtifactRef();
    abbreviatedCommit.source.gitCommitSha = "f229143";
    expect(() => loadBuildArtifactRefV1(abbreviatedCommit)).toThrow(
      /full lowercase 40- or 64-character Git object SHA/,
    );

    const unknownSource = await mutableBuildArtifactRef();
    unknownSource.source.branch = "main";
    expect(() => loadBuildArtifactRefV1(unknownSource)).toThrow(
      /buildArtifactRef.source.branch is not allowed/,
    );

    const invalidArtifactDigest = await mutableBuildArtifactRef();
    invalidArtifactDigest.artifactSha256 = "deadbeef";
    expect(() => loadBuildArtifactRefV1(invalidArtifactDigest)).toThrow(
      BuildArtifactRefValidationErrorV1,
    );

    const invalidAbi = await mutableBuildArtifactRef();
    invalidAbi.numericalRuntimeAbi.version = "1";
    expect(() => loadBuildArtifactRefV1(invalidAbi)).toThrow(
      /exact semantic version/,
    );

    const invalidCanonicalValue = await mutableBuildArtifactRef();
    invalidCanonicalValue.source.repository = Number.NaN;
    expect(() => loadBuildArtifactRefV1(invalidCanonicalValue)).toThrow(
      /numbers must be finite/,
    );
  });
});

describe("RunArtifact V1", () => {
  it("creates deterministic content identity and round-trips immutable data", async () => {
    const firstInput = await mutableRunArtifactInput();
    const secondInput = await mutableRunArtifactInput();
    secondInput.protocolDescriptor = reverseKeys(secondInput.protocolDescriptor);
    secondInput.outputs = reverseKeys(secondInput.outputs);

    const first = await createRunArtifactV1(firstInput);
    const second = await createRunArtifactV1(secondInput);

    expect(first.ref).toEqual({
      schemaId: RUN_ARTIFACT_REF_V1_SCHEMA_ID,
      sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(first.content.schemaId).toBe(RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID);
    expect(first.ref.sha256).toBe(
      await sha256CanonicalJsonHex(first.content),
    );
    expect(second.ref).toEqual(first.ref);
    expect(second.content).toEqual(first.content);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.ref)).toBe(true);
    expect(Object.isFrozen(first.content)).toBe(true);
    expect(Object.isFrozen(first.content.executionLedger)).toBe(true);
    expect(Object.isFrozen(first.content.executionLedger[0] as object)).toBe(true);
    expect(Object.isFrozen(first.content.outputs as object)).toBe(true);

    (firstInput.outputs as any).frames[0].revision = 999;
    (firstInput.executionLedger as any)[0].requestId = "mutated";
    expect((first.content.outputs as any).frames[0].revision).toBe(0);
    expect((first.content.executionLedger[0] as any).requestId).toBe("create-1");

    const loaded = await loadRunArtifactV1(mutable(first));
    expect(loaded).toEqual(first);
    expect(Object.isFrozen(loaded.content.audits as object)).toBe(true);
  });

  it("supports an exact checkpoint identity without inventing time or run IDs", async () => {
    const input = await mutableRunArtifactInput();
    input.initializationIdentity = {
      kind: "exact-checkpoint",
      checkpointSha256: "d".repeat(64),
    };
    const artifact = await createRunArtifactV1(input);

    expect(artifact.content.initializationIdentity).toEqual({
      kind: "exact-checkpoint",
      checkpointSha256: "d".repeat(64),
    });
    expect(artifact).not.toHaveProperty("createdAt");
    expect(artifact).not.toHaveProperty("runId");
    expect(artifact.content).not.toHaveProperty("environment");
  });

  it("rejects tampering and every unknown envelope or identity field", async () => {
    const artifact = await createRunArtifactV1(await mutableRunArtifactInput());

    const tamperedOutput = mutable(artifact);
    tamperedOutput.content.outputs.frames[0].revision = 1;
    await expect(loadRunArtifactV1(tamperedOutput)).rejects.toThrow(
      /does not match the canonical content digest/,
    );

    const unknownRoot = mutable(artifact);
    unknownRoot.legacyCaseId = "old-case";
    await expect(loadRunArtifactV1(unknownRoot)).rejects.toThrow(
      /runArtifact.legacyCaseId is not allowed/,
    );

    const unknownContent = mutable(artifact);
    unknownContent.content.savedCase = { id: "legacy" };
    unknownContent.ref.sha256 = await sha256CanonicalJsonHex(
      unknownContent.content,
    );
    await expect(loadRunArtifactV1(unknownContent)).rejects.toThrow(
      /runArtifact.content.savedCase is not allowed/,
    );

    const unknownInitialization = mutable(artifact);
    unknownInitialization.content.initializationIdentity.timestamp = 123;
    unknownInitialization.ref.sha256 = await sha256CanonicalJsonHex(
      unknownInitialization.content,
    );
    await expect(loadRunArtifactV1(unknownInitialization)).rejects.toThrow(
      /initializationIdentity.timestamp is not allowed/,
    );

    const invalidCheckpoint = await mutableRunArtifactInput();
    invalidCheckpoint.initializationIdentity = {
      kind: "exact-checkpoint",
      checkpointSha256: "short",
    };
    await expect(createRunArtifactV1(invalidCheckpoint)).rejects.toThrow(
      RunArtifactValidationErrorV1,
    );

    const unknownInput = await mutableRunArtifactInput();
    unknownInput.createdAt = "2026-07-18T00:00:00Z";
    await expect(createRunArtifactV1(unknownInput)).rejects.toThrow(
      /run artifact input.createdAt is not allowed/,
    );
  });
});

async function mutableBuildArtifactRef(): Promise<any> {
  const release = await createMainWireAdultFiveWallNonCoronaryReleaseV1();
  return {
    schemaId: BUILD_ARTIFACT_REF_V1_SCHEMA_ID,
    simulationReleaseRef: mutable(release.ref),
    numericalRuntimeAbi: {
      id: MAIN_WIRE_ADULT_FIVE_WALL_NUMERICAL_RUNTIME_ABI_V1.id,
      version: MAIN_WIRE_ADULT_FIVE_WALL_NUMERICAL_RUNTIME_ABI_V1.version,
    },
    source: {
      repository: "g960059/0DSimDemo",
      gitCommitSha: "1".repeat(40),
      gitTreeSha: "2".repeat(40),
      gitWorktreeStatus: "clean",
    },
    artifactSha256: "a".repeat(64),
  };
}

async function mutableRunArtifactInput(): Promise<any> {
  return {
    buildArtifactRef: await mutableBuildArtifactRef() as BuildArtifactRefV1,
    protocolDescriptor: {
      protocolId: "main-wire-fixed-duration-transient-v1",
      protocolVersion: "1.0.0",
      dtSec: 0.002,
      stepCount: 2,
    },
    initializationIdentity: {
      kind: "canonical-initialization",
      protocolId: "main-wire-normal-adult-five-wall-fixed-tbv-cold-initialization-v1",
      protocolVersion: "1.0.0",
    },
    executionLedger: [
      {
        commandKind: "createCanonicalSession",
        requestId: "create-1",
        acceptedRevision: 0,
      },
      {
        commandKind: "runTransient",
        requestId: "transient-1",
        requestedStepCount: 2,
        completedStepCount: 2,
      },
    ],
    outputs: {
      frames: [
        { revision: 0, acceptedTimeSec: 0 },
        { revision: 2, acceptedTimeSec: 0.004 },
      ],
    },
    audits: {
      exactReleaseRefMatch: true,
      totalBloodVolumeErrorMl: 0,
    },
  } satisfies RunArtifactContentInputV1;
}

function mutable<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

function reverseKeys(value: unknown): any {
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).reverse());
}
