import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  FIVE_PATCH_ENVELOPE_FIXED_SETTLE_AND_ASSESS_PROVENANCE_V1,
  FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1,
  assertFivePatchEnvelopeImplementationManifestClosedV1,
  fivePatchEnvelopeParameterIdentitySha256V1,
  parseFivePatchModelEnvelopeCliArgsV1,
  runFivePatchModelEnvelopeCliV1,
  runFivePatchModelEnvelopeProtocolStreamingToDiskV1,
  validateFivePatchModelEnvelopeAssemblyV1,
  validateFivePatchModelEnvelopePersistedResultV1,
} from
  "@/tools/mechanics2/runFivePatchModelEnvelopeV1";
import {
  buildFivePatchEnvelopeProtocolSpecV1,
  buildFivePatchModelEnvelopeArmReadinessPlanV1,
  type FivePatchEnvelopeProtocolRunRequestV1,
  type FivePatchEnvelopeProtocolRunResultV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";

describe("runFivePatchModelEnvelopeV1 CLI", () => {
  it("parses the explicitly bounded preflight mode", () => {
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([])).toThrow(
      /exactly one/,
    );
    expect(parseFivePatchModelEnvelopeCliArgsV1([
      "--preflight",
      "--steps",
      "2",
      "--dt",
      "0.0025",
      "--shard",
      "1/3",
      "--output-dir",
      "/tmp/five-patch-envelope",
    ])).toEqual({
      mode: "preflight",
      phase: null,
      dtSec: 0.0025,
      stepCount: 2,
      shard: { shardIndex: 1, shardCount: 3 },
      outputDirectory: "/tmp/five-patch-envelope",
      planOnly: false,
      streamToDisk: false,
    });
  });

  it("exposes exact committed protocol phases and rejects the obsolete tolerance override", () => {
    expect(parseFivePatchModelEnvelopeCliArgsV1([
      "--phase",
      "full",
      "--plan-only",
      "--shard",
      "4/9",
    ])).toEqual({
      mode: "protocol",
      phase: "full",
      dtSec: null,
      stepCount: null,
      shard: { shardIndex: 4, shardCount: 9 },
      outputDirectory: null,
      planOnly: true,
      streamToDisk: false,
    });
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--phase",
      "screening",
      "--periodicity-tolerance",
      "0.0001",
    ])).toThrow(/unknown argument: --periodicity-tolerance/);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--phase",
      "screening",
      "--dt",
      "0.01",
    ])).toThrow(/committed beats\/dt/);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1(["--help"]))
      .toThrow(/32 beats with a 1e-4.*there is no CLI override/);
  });

  it("rejects an unbounded prefix or invalid shard", () => {
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--preflight",
      "--steps",
      "5",
    ])).toThrow(/\[1, 4\]/);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--preflight",
      "--shard",
      "2/2",
    ])).toThrow(/\[0, count\)/);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--preflight",
      "--periodicity-tolerance",
      "0.01",
    ])).toThrow(/unknown argument: --periodicity-tolerance/);
  });

  it("bounds streaming to protocol execution with an explicit output directory", () => {
    expect(parseFivePatchModelEnvelopeCliArgsV1([
      "--phase",
      "full",
      "--stream-to-disk",
      "--output-dir",
      "/tmp/five-patch-envelope",
    ]).streamToDisk).toBe(true);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--preflight",
      "--stream-to-disk",
      "--output-dir",
      "/tmp/five-patch-envelope",
    ])).toThrow(/protocol phases/);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--phase",
      "full",
      "--stream-to-disk",
    ])).toThrow(/requires --output-dir/);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--phase",
      "full",
      "--stream-to-disk",
      "--output-dir",
      "/tmp/five-patch-envelope",
      "--plan-only",
    ])).toThrow(/cannot be combined/);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--phase",
      "full",
      "--resume",
    ])).toThrow(/unknown argument/);
    expect(() => parseFivePatchModelEnvelopeCliArgsV1([
      "--phase",
      "full",
      "--skip-existing",
    ])).toThrow(/unknown argument/);
  });

  it("uses a stable SHA-256 for the canonical subsystem parameter identity", () => {
    expect(fivePatchEnvelopeParameterIdentitySha256V1("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("keeps the explicit implementation manifest closed over transitive calcium imports", () => {
    expect(() => assertFivePatchEnvelopeImplementationManifestClosedV1())
      .not.toThrow();
    for (const omittedPath of [
      "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV1.ts",
      "engine/mechanics2/solver/FivePatchDampedNewtonV1.ts",
      "engine/myocardium/calcium/PrescribedCalciumTransientV1.ts",
      "engine/myocardium/contracts.ts",
    ]) {
      const incompleteManifest =
        FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1.filter(
          (path) => path !== omittedPath,
        );
      expect(() => assertFivePatchEnvelopeImplementationManifestClosedV1(
        incompleteManifest,
      )).toThrow(
        new RegExp(`-> .*${omittedPath.split("/").at(-1)}`),
      );
    }
  });

  it("atomically persists the exact canonical identity and its SHA-256", () => {
    const directory = mkdtempSync(join(tmpdir(), "five-patch-envelope-"));
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      const results = runFivePatchModelEnvelopeCliV1([
        "--preflight",
        "--steps",
        "1",
        "--shard",
        "0/12",
        "--output-dir",
        directory,
      ]);
      expect(results).toHaveLength(1);
      const files = readdirSync(directory);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/\.json$/);
      const persisted = JSON.parse(
        readFileSync(join(directory, files[0]!), "utf8"),
      ) as {
        parameterIdentityCanonicalJson: string;
        parameterIdentitySha256: string;
        provenance: {
          settleAndAssessProtocolSha256: string;
          fixedSettleAndAssessProtocol: unknown;
          implementationDependencyCoverage: string;
          implementationSourcePaths: readonly string[];
        };
      };
      expect(persisted.parameterIdentityCanonicalJson).toBe(
        results[0]!.parameterIdentityCanonicalJson,
      );
      expect(persisted.parameterIdentitySha256).toBe(
        fivePatchEnvelopeParameterIdentitySha256V1(
          persisted.parameterIdentityCanonicalJson,
        ),
      );
      expect(persisted.provenance.settleAndAssessProtocolSha256).toMatch(
        /^[0-9a-f]{64}$/,
      );
      expect(persisted.provenance.fixedSettleAndAssessProtocol).toEqual(
        FIVE_PATCH_ENVELOPE_FIXED_SETTLE_AND_ASSESS_PROVENANCE_V1,
      );
      expect(persisted.provenance.fixedSettleAndAssessProtocol).toMatchObject({
        cliOverrideAllowed: false,
        fullStateReturnMapMaxAbsDimensionlessTolerance: 1e-4,
        settleAndAssessSchedule: {
          calciumAmplitudeRamp: {
            beatNumbers: [1, 2, 3, 4],
            commonMultipliers: [0.25, 0.5, 0.75, 1],
          },
          discardSettleBeatNumbersInclusive: [5, 29],
          assessmentBeatNumbersInclusive: [30, 32],
        },
      });
      expect(persisted.provenance.implementationDependencyCoverage).toBe(
        "all-repository-local-static-imports-transitively-closed",
      );
      expect(persisted.provenance.implementationSourcePaths).toEqual(
        FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1,
      );
    } finally {
      stdout.mockRestore();
      rmSync(directory, { recursive: true, force: true });
    }
  }, 20_000);

  it("persists each protocol result before the next fixed-order run without skip or adaptation", () => {
    const directory = mkdtempSync(join(tmpdir(), "five-patch-streaming-"));
    const requests = buildFivePatchModelEnvelopeArmReadinessPlanV1().slice(0, 3);
    const canonicalRunIds = requests.map(
      (request) => buildFivePatchEnvelopeProtocolSpecV1(request).runId,
    );
    const executionOrder: FivePatchEnvelopeProtocolRunRequestV1[] = [];
    const firstPath = join(directory, artifactFileName(canonicalRunIds[0]!));
    writeFileSync(firstPath, "pre-existing sentinel\n", "utf8");
    try {
      const streamed = runFivePatchModelEnvelopeProtocolStreamingToDiskV1(
        requests,
        directory,
        {},
        {
          executeRun: (request) => {
            const ordinal = executionOrder.length;
            if (ordinal === 1) {
              expect(existsSync(firstPath)).toBe(true);
              const firstPersisted = JSON.parse(
                readFileSync(firstPath, "utf8"),
              ) as { status: string; parameterIdentityCanonicalJson: string };
              expect(firstPersisted).toMatchObject({
                status: "numerical-failure",
                parameterIdentityCanonicalJson:
                  buildFivePatchEnvelopeProtocolSpecV1(requests[0]!)
                    .parameterIdentityCanonicalJson,
              });
            }
            executionOrder.push(request);
            return fakeProtocolResult(request, ordinal);
          },
        },
      );

      expect(executionOrder).toEqual(requests);
      expect(streamed.executedRunCount).toBe(3);
      expect(streamed.results.map((result) => ({
        runOrdinal: result.runOrdinal,
        runId: result.runId,
        status: result.status,
      }))).toEqual([
        { runOrdinal: 0, runId: canonicalRunIds[0], status: "numerical-failure" },
        { runOrdinal: 1, runId: canonicalRunIds[1], status: "protocol-run-complete" },
        { runOrdinal: 2, runId: canonicalRunIds[2], status: "protocol-run-complete" },
      ]);
      expect(readdirSync(directory).sort()).toEqual(
        canonicalRunIds.map(artifactFileName).sort(),
      );
      expect(readFileSync(firstPath, "utf8")).not.toContain(
        "pre-existing sentinel",
      );
      expect(readdirSync(directory).some((file) => file.endsWith(".tmp")))
        .toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects content tampering and validates an exact assembly manifest", () => {
    const directory = mkdtempSync(join(tmpdir(), "five-patch-provenance-"));
    try {
      const requests = buildFivePatchModelEnvelopeArmReadinessPlanV1().slice(
        0,
        1,
      );
      runFivePatchModelEnvelopeProtocolStreamingToDiskV1(
        requests,
        directory,
        {},
        { executeRun: (request) => fakeProtocolResult(request, 0) },
      );
      const artifact = JSON.parse(readFileSync(
        join(
          directory,
          artifactFileName(
            buildFivePatchEnvelopeProtocolSpecV1(requests[0]!).runId,
          ),
        ),
        "utf8",
      ));
      expect(validateFivePatchModelEnvelopePersistedResultV1(artifact))
        .toBe(artifact);
      const manifest = validateFivePatchModelEnvelopeAssemblyV1(
        [artifact],
        requests,
      );
      expect(manifest.artifactCount).toBe(1);
      expect(manifest.assemblyNormalizedSha256).toMatch(/^[0-9a-f]{64}$/);

      const tampered = structuredClone(artifact) as { stepsAccepted: number };
      tampered.stepsAccepted += 999;
      expect(() => validateFivePatchModelEnvelopePersistedResultV1(tampered))
        .toThrow(/normalized hash mismatch/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

function fakeProtocolResult(
  request: FivePatchEnvelopeProtocolRunRequestV1,
  ordinal: number,
): FivePatchEnvelopeProtocolRunResultV1 {
  const spec = buildFivePatchEnvelopeProtocolSpecV1(request);
  return {
    runId: spec.runId,
    request,
    parameterIdentityCanonicalJson: spec.parameterIdentityCanonicalJson,
    initialVolumeOverridesMl: spec.initialVolumeOverridesMl,
    status: ordinal === 0 ? "numerical-failure" : "protocol-run-complete",
    stepsAccepted: ordinal === 0 ? 0 : 1,
    stepsAttempted: 1,
    finalCycleSamples: ordinal === 0 ? [] : [{ deliberately: "large" }],
    periodicity: {
      status: "report-only-unestablished-no-tolerance",
    },
  } as unknown as FivePatchEnvelopeProtocolRunResultV1;
}

function artifactFileName(runId: string): string {
  return `${runId.replaceAll(/[^a-zA-Z0-9._-]/g, "_")}.json`;
}
