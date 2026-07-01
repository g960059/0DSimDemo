import { createHash } from "node:crypto";
import { expect } from "vitest";

export function expectMechanics2ReportArtifactParity(
  artifact: unknown,
  rerunReport: unknown,
): void {
  const artifactRecord = asRecord(artifact);
  const artifactHash = artifactRecord.normalizedSha256;
  const normalizedArtifact = stripHash(artifactRecord);
  const normalizedRerun = JSON.parse(JSON.stringify(rerunReport)) as unknown;

  expect(typeof artifactHash).toBe("string");
  expect(artifactHash).toHaveLength(64);
  expect(normalizedArtifact).toEqual(normalizedRerun);
  expect(artifactHash).toBe(hashStable(normalizedRerun));
}

function stripHash(record: Record<string, unknown>): Record<string, unknown> {
  const { normalizedSha256: _hash, ...normalized } = record;
  return normalized;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected report artifact object");
  }
  return value as Record<string, unknown>;
}
