import { describe, expect, it, beforeEach, vi } from "vitest";

import { sha256CanonicalJsonHex } from "@/engine/integrity";

const dependencies = vi.hoisted(() => {
  const D = "03fa37844067031612436a5330e6d7cae8a1ff84";
  const D_PARENT = "5acaa6f0f0b96b5c3acd38090c8dc7ec766225b6";
  const A = "a".repeat(40);
  const B = "b".repeat(40);
  const HISTORICAL = "28e6c5e9c7c7072853a79758fef6a2c09984cc30";
  const oldBlob = new Uint8Array(86255).fill(32);
  const signature = new TextEncoder().encode(
    "function reducedFourChamberTangentV1(",
  );
  oldBlob.set(signature, 73677);
  const insertion = new TextEncoder().encode("export ");
  const newBlob = new Uint8Array(oldBlob.length + insertion.length);
  newBlob.set(oldBlob.slice(0, 73677), 0);
  newBlob.set(insertion, 73677);
  newBlob.set(oldBlob.slice(73677), 73677 + insertion.length);
  const declarationBlob = new TextEncoder().encode("synthetic-0020-document");
  return {
    D,
    D_PARENT,
    A,
    B,
    HISTORICAL,
    head: A,
    declarationDiffTampered: false,
    terminalReplayTampered: false,
    terminalThrowCallNumber: null as number | null,
    terminalThrowFromCallNumber: null as number | null,
    initialCoordinateTamperCallNumber: null as number | null,
    stageIndexTamperCallNumber: null as number | null,
    solverThrowCallNumber: null as number | null,
    solverScientificFailureCallNumber: null as number | null,
    auditorThrowCallNumber: null as number | null,
    files: new Map<string, string>(),
    writes: [] as string[],
    candidateCalls: [] as Array<Record<string, number>>,
    terminalCalls: [] as Array<Record<string, number>>,
    stageCalls: [] as Array<{ stageIndex: number }>,
    oldBlob,
    newBlob,
    declarationBlob,
  };
});

const A_ALLOWED_PATHS = [
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEvidenceAuditorV2.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV2.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceArtifactV2.ts",
  "__tests__/mainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2.test.ts",
  "__tests__/mainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.test.ts",
  "tools/runMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.ts",
  "package.json",
  "vitest.suites.ts",
] as const;

const FIXED_DEPENDENCY_BLOBS: Readonly<Record<string, string>> = Object.freeze({
  "docs/scientific-runtime/INTEGRATED-MODEL-0018-passive-multichamber-equilibrium-energy-surface-preregistration.md":
    "3fae899b3bb7cb0515797b0338ba1951592b589c",
  "docs/scientific-runtime/INTEGRATED-MODEL-0019-passive-equilibrium-point-solver-numerical-addendum.md":
    "dd09dab325f4d1ac87deed818c17471af71dad08",
  "docs/scientific-runtime/INTEGRATED-MODEL-0020-passive-equilibrium-schur-export-seam.md":
    "6c8c8ba338996dd7b12e99c66cab8ac6d5cfc464",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts":
    "7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointProvenanceV1.ts":
    "ef2ddb13b7ff20d500ba86ffe67e69fc20f22944",
  "engine/myocardium/mechanics/normalAdultFiveWallPriorV1.ts":
    "81a6b1355fe6f9bb34eac4b58ba33895add84b0e",
  "engine/myocardium/mechanics/energyConjugateTriSegV1.ts":
    "630a15b59233b0ee7b1002738182f47a0dd10b48",
  "engine/myocardium/mechanics/equilibriumOneFiberPassiveV1.ts":
    "9f4def0bd01dbf82d040ec81978a2d7aa1561a94",
  "engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1.ts":
    "433a5b280f6827da12bb44b671115932a1ec714c",
  "__tests__/mainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.test.ts":
    "54bb27dc925429154eb1e40260c79b1eb087130f",
});

const changedBlobByPath = Object.freeze(
  Object.fromEntries(
    A_ALLOWED_PATHS.map((entry, index) => [
      entry,
      entry.endsWith("PointOwnerV1.ts")
        ? "7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9"
        : (index + 1).toString(16).padStart(40, "0"),
    ]),
  ) as Record<string, string>,
);

vi.mock(
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceArtifactV2",
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    const blobSha = (commit: string, relativePath: string): string => {
      if (
        relativePath.endsWith(
          "MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts",
        )
      ) {
        if (commit === dependencies.HISTORICAL || commit === dependencies.D)
          return "43d09f16c8cd1b5fe53688c9c5d7aeaa9d2edc5d";
        return "7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9";
      }
      if (relativePath === "docs/scientific-runtime/README.md")
        return "9".repeat(40);
      if (FIXED_DEPENDENCY_BLOBS[relativePath] !== undefined)
        return FIXED_DEPENDENCY_BLOBS[relativePath];
      if (changedBlobByPath[relativePath] !== undefined)
        return changedBlobByPath[relativePath];
      if (relativePath.includes("seal-manifest")) return "d".repeat(40);
      if (relativePath.includes("unexecuted-tombstone")) return "e".repeat(40);
      throw new Error(
        `unexpected fake blob request: ${commit}:${relativePath}`,
      );
    };
    return {
      ...actual,
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2:
        Object.freeze({
          repositoryRoot: () => "/repo",
          gitCommonDirectory: () => "/git-common",
          gitHeadSha: () => dependencies.head,
          gitParentSha: (_repositoryRoot: string, commit: string) => {
            if (commit === dependencies.B) return dependencies.A;
            if (commit === dependencies.A) return dependencies.D;
            if (commit === dependencies.D) return dependencies.D_PARENT;
            throw new Error(`unexpected fake parent request: ${commit}`);
          },
          gitTreeSha: (_repositoryRoot: string, commit: string) => {
            if (commit === dependencies.D)
              return "7fab075603e8681ffda38b94e13b07ca8be512ed";
            if (commit === dependencies.HISTORICAL)
              return "05b8df7071240931160c91203bf8ae13556471ad";
            return "8".repeat(40);
          },
          gitBlobSha: (
            _repositoryRoot: string,
            commit: string,
            relativePath: string,
          ) => blobSha(commit, relativePath),
          gitBlobBytes: (_repositoryRoot: string, blob: string) => {
            if (blob === "43d09f16c8cd1b5fe53688c9c5d7aeaa9d2edc5d")
              return dependencies.oldBlob;
            if (blob === "7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9")
              return dependencies.newBlob;
            if (blob === "6c8c8ba338996dd7b12e99c66cab8ac6d5cfc464")
              return dependencies.declarationBlob;
            throw new Error(`unexpected fake blob bytes request: ${blob}`);
          },
          gitDiffNames: (_repositoryRoot: string, from: string, to: string) => {
            if (from === dependencies.D_PARENT && to === dependencies.D)
              return dependencies.declarationDiffTampered
                ? [
                    "docs/scientific-runtime/INTEGRATED-MODEL-0020-passive-equilibrium-schur-export-seam.md",
                    "docs/scientific-runtime/README.md",
                    "unexpected.txt",
                  ]
                : [
                    "docs/scientific-runtime/INTEGRATED-MODEL-0020-passive-equilibrium-schur-export-seam.md",
                    "docs/scientific-runtime/README.md",
                  ];
            if (from === dependencies.D && to === dependencies.A)
              return A_ALLOWED_PATHS;
            if (from === dependencies.A && to === dependencies.B)
              return [
                "docs/scientific-runtime/evidence/passive-equilibrium-point-solver-v2-seal-manifest-v1.json",
                "docs/scientific-runtime/evidence/passive-equilibrium-point-solver-v2-unexecuted-tombstone-v1.json",
              ];
            throw new Error(`unexpected fake diff request: ${from}..${to}`);
          },
          gitStatusPorcelain: () => "",
          exists: (absolutePath: string) =>
            dependencies.files.has(absolutePath),
          readUtf8: (absolutePath: string) => {
            const value = dependencies.files.get(absolutePath);
            if (value === undefined)
              throw new Error(`missing fake file: ${absolutePath}`);
            return value;
          },
          ensureDirectoryDurable: () => undefined,
          writeJsonCreateOnlyDurable: (
            absolutePath: string,
            payload: unknown,
          ) => {
            if (dependencies.files.has(absolutePath))
              throw new Error(`fake wx collision: ${absolutePath}`);
            dependencies.files.set(
              absolutePath,
              `${JSON.stringify(payload)}\n`,
            );
            dependencies.writes.push(absolutePath);
          },
          replaceJsonViaCreateOnlyStageDurable: (
            destinationPath: string,
            stagePath: string,
            payload: unknown,
          ) => {
            if (dependencies.files.has(stagePath))
              throw new Error(`fake stage wx collision: ${stagePath}`);
            dependencies.files.set(stagePath, `${JSON.stringify(payload)}\n`);
            dependencies.files.set(
              destinationPath,
              dependencies.files.get(stagePath)!,
            );
            dependencies.files.delete(stagePath);
            dependencies.writes.push(destinationPath);
          },
          randomOpaqueId32Hex: () => "1".repeat(32),
          rawSha256Hex: (bytes: Uint8Array) => {
            if (bytes === dependencies.oldBlob)
              return "3b096c8c3d386113c8b16fa43870d387d6bfd79f72debc04eb1caabb2756adac";
            if (bytes === dependencies.newBlob)
              return "13e760df8266891fcd3a30a40c815d1b08d6875eb4c606ea2fb148b4633b163a";
            if (bytes === dependencies.declarationBlob)
              return "975292ac743ff651e97ad07da3635d97b8707e5d6be70f5a465e302489325d26";
            throw new Error("unexpected fake raw digest request");
          },
        }),
    };
  },
);

vi.mock(
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2",
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    return {
      ...actual,
      solveMainWirePassiveEquilibriumStageKernelV2: (input: any) => {
        dependencies.stageCalls.push({ stageIndex: input.stageIndex });
        const callNumber = dependencies.stageCalls.length;
        if (dependencies.solverThrowCallNumber === callNumber)
          throw new Error("synthetic stage solver exception");
        input.evaluateCandidate(input.initialCoordinates);
        const coordinates = {
          septalMidwallCapVolumeM3: 0.00001,
          junctionRadiusM: 0.02,
        };
        const wrap = actual.wrapMainWirePassiveEquilibriumFloat64V2 as (
          value: number,
        ) => unknown;
        const common = {
          stageIndex:
            dependencies.stageIndexTamperCallNumber === callNumber
              ? input.stageIndex + 1
              : input.stageIndex,
          initialCoordinates: {
            septalMidwallCapVolumeM3: wrap(
              input.initialCoordinates.septalMidwallCapVolumeM3,
            ),
            junctionRadiusM: wrap(
              input.initialCoordinates.junctionRadiusM +
                (dependencies.initialCoordinateTamperCallNumber === callNumber
                  ? 1e-12
                  : 0),
            ),
          },
          iterations: Object.freeze([]),
          completedAcceptedUpdateCount: 0,
          lastAcceptedStepDiagnostics: null,
        };
        const terminalCandidate = Object.freeze({
          internalCoordinates: {
            septalMidwallCapVolumeM3: wrap(
              coordinates.septalMidwallCapVolumeM3,
            ),
            junctionRadiusM: wrap(coordinates.junctionRadiusM),
          },
          wallStoredEnergyJ: { LVFW: wrap(1), SEP: wrap(1), RVFW: wrap(1) },
          rawVentricularStoredEnergyJ: wrap(3),
          scaledGradient: [wrap(0), wrap(0)],
          scaledForceInfinityNorm: wrap(0),
          scaledInternalHessian: [
            [wrap(1), wrap(0)],
            [wrap(0), wrap(1)],
          ],
          scaledInternalHessianEigenvaluesAscending: [wrap(1), wrap(1)],
          strictLocalStabilityPassed: true,
          junctionRadiusPassed: true,
        });
        return Object.freeze(
          dependencies.solverScientificFailureCallNumber === callNumber
            ? {
                ...common,
                status: "failed",
                failureReason: "line-search-failed",
                terminalCandidate,
              }
            : { ...common, status: "converged", terminalCandidate },
        );
      },
    };
  },
);

vi.mock(
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEvidenceAuditorV2",
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    return {
      ...actual,
      auditMainWirePassiveEquilibriumStageKernelV2: async () => {
        if (
          dependencies.auditorThrowCallNumber === dependencies.stageCalls.length
        )
          throw new Error("synthetic stage auditor exception");
        const report = Object.freeze({ auditStatus: "passed" });
        return Object.freeze({
          qualification: "neutral-unqualified-kernel-audit",
          auditorId:
            actual.MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID,
          report,
          reportSha256: await sha256CanonicalJsonHex(report),
        });
      },
    };
  },
);

vi.mock(
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV2",
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    const candidate = (volumes: Record<string, number>, coordinates: any) => {
      dependencies.candidateCalls.push({ ...volumes });
      return Object.freeze({
        internalCoordinates: { ...coordinates },
        wallStoredEnergyJ: { LVFW: 1, SEP: 1, RVFW: 1 },
        rawVentricularStoredEnergyJ: 3,
        scaledGradient: [0, 0],
        scaledForceInfinityNorm: 0,
        scaledInternalHessian: [
          [1, 0],
          [0, 1],
        ],
        scaledInternalHessianEigenvaluesAscending: [1, 1],
        strictLocalStabilityPassed: true,
        junctionRadiusPassed: true,
      });
    };
    const terminal = (volumes: Record<string, number>, coordinates: any) => {
      dependencies.terminalCalls.push({ ...volumes });
      const referenceTerminalVolumes = dependencies.terminalCalls[0];
      const isReferenceTerminalTarget =
        referenceTerminalVolumes !== undefined &&
        Object.keys(referenceTerminalVolumes).every((key) =>
          Object.is(referenceTerminalVolumes[key], volumes[key]),
        );
      if (
        dependencies.terminalThrowCallNumber ===
          dependencies.terminalCalls.length ||
        (dependencies.terminalThrowFromCallNumber !== null &&
          dependencies.terminalCalls.length >=
            dependencies.terminalThrowFromCallNumber &&
          isReferenceTerminalTarget)
      )
        throw new Error("synthetic terminal projection exception");
      const canonicalEnergy =
        dependencies.terminalReplayTampered &&
        dependencies.terminalCalls.length >= 2
          ? 4
          : 3;
      return Object.freeze({
        qualification: "unbranded-non-official-projection",
        candidate: Object.freeze({
          internalCoordinates: { ...coordinates },
          rawStoredEnergyJ: { canonicalFactorizedTotal: canonicalEnergy },
          intrinsicMyocardialTransmuralPressuresPa: {
            LA: 10,
            LV: 20,
            RA: 30,
            RV: 40,
          },
          internalEquilibriumEvidence: {
            scaledForceInfinityNorm: 0,
            strictLocalStabilityPassed: true,
            scaledInternalHessianEigenvaluesAscending: [1, 1],
          },
        }),
        reducedFourChamberPressureVolumeTangentPaPerM3: [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ],
        schurOwner: "reducedFourChamberTangentV1",
        qualificationOrRootMinted: false,
      });
    };
    return {
      ...actual,
      evaluateMainWireNormalAdultPassiveEquilibriumCanonicalStageCandidateV2:
        candidate,
      evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2:
        terminal,
    };
  },
);

import { runMainWireNormalAdultPassiveEquilibriumEngineeringEvidenceV2 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2";
import * as engineeringArtifactModuleV2 from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceArtifactV2";
import {
  sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2,
  verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2,
} from "@/tools/runMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2";

describe("passive equilibrium V2 sealed engineering orchestration", () => {
  beforeEach(() => {
    dependencies.head = dependencies.A;
    dependencies.declarationDiffTampered = false;
    dependencies.terminalReplayTampered = false;
    dependencies.terminalThrowCallNumber = null;
    dependencies.terminalThrowFromCallNumber = null;
    dependencies.initialCoordinateTamperCallNumber = null;
    dependencies.stageIndexTamperCallNumber = null;
    dependencies.solverThrowCallNumber = null;
    dependencies.solverScientificFailureCallNumber = null;
    dependencies.auditorThrowCallNumber = null;
    dependencies.files.clear();
    dependencies.writes.length = 0;
    dependencies.candidateCalls.length = 0;
    dependencies.terminalCalls.length = 0;
    dependencies.stageCalls.length = 0;
  });

  it("keeps both official orchestration exports zero-argument and fails before target without B", async () => {
    expect(
      runMainWireNormalAdultPassiveEquilibriumEngineeringEvidenceV2.length,
    ).toBe(0);
    expect(
      "sealMainWireNormalAdultPassiveEquilibriumArtifactPayloadV2" in
        engineeringArtifactModuleV2,
    ).toBe(false);
    expect(
      verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2.length,
    ).toBe(0);
    await expect(
      verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2(),
    ).rejects.toThrow(/seal manifest/);
    expect(dependencies.candidateCalls).toHaveLength(0);
    expect(dependencies.stageCalls).toHaveLength(0);
    expect(dependencies.writes).toHaveLength(0);
  });

  it("seals A without evaluating a target and rejects a tampered D declaration diff before durable write", async () => {
    dependencies.declarationDiffTampered = true;
    await expect(
      sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2(),
    ).rejects.toThrow(/parent-to-D documentation allowlist/);
    expect(dependencies.writes).toHaveLength(0);
    expect(dependencies.candidateCalls).toHaveLength(0);

    dependencies.declarationDiffTampered = false;
    const manifest =
      await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    expect(manifest.payload.changedImplementationBlobs).toHaveLength(11);
    expect(manifest.payload.inheritedDependencyBlobs).toHaveLength(10);
    expect(dependencies.candidateCalls).toHaveLength(0);
    expect(dependencies.stageCalls).toHaveLength(0);
  });

  it("runs the exact zero-argument sealer path through root, literal, canonical, and 12/66 branch audit under mocks", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;

    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

    expect(artifact.payload.status).toBe("pass");
    expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
      true,
    );
    expect(
      artifact.payload.executions.map((entry) => entry.executionId),
    ).toEqual([
      "literal-midpoint-primary-v2",
      "canonical-index16-primary-v2",
      "reference-branch-audit-v2",
    ]);
    expect(
      artifact.payload.executions.every(
        (entry) => entry.status === "fulfilled",
      ),
    ).toBe(true);
    expect(dependencies.stageCalls).toHaveLength(522);
    expect(dependencies.stageCalls[0]).toEqual({ stageIndex: 0 });
    expect(
      dependencies.stageCalls.slice(1, 33).map((entry) => entry.stageIndex),
    ).toEqual(Array.from({ length: 32 }, (_, index) => index + 1));
    expect(
      dependencies.stageCalls.slice(33, 65).map((entry) => entry.stageIndex),
    ).toEqual(Array.from({ length: 32 }, (_, index) => index + 1));
    const branch = artifact.payload.executions[2].result;
    expect(branch.status).toBe("branch-agreement-established");
    if (branch.status !== "branch-agreement-established")
      throw new Error("expected fulfilled branch evidence");
    expect(branch.result.participants).toHaveLength(12);
    expect(branch.result.pairwiseComparisons).toHaveLength(66);
    expect(branch.independentAuditorReport.status).toBe("passed");
    for (const participantId of [
      "seed-zero-plus-0.25",
      "seed-plus-0.25-plus-0.25",
    ] as const) {
      const participant = branch.result.participants.find(
        (candidate) => candidate.participantId === participantId,
      );
      if (participant === undefined)
        throw new Error(`missing named seed participant ${participantId}`);
      const { casePayloadSha256, ...casePayload } = participant;
      expect(await sha256CanonicalJsonHex(casePayload)).toBe(casePayloadSha256);
    }
    expect(artifact.payload.referenceRootOutcome.status).toBe("admitted");
    if (artifact.payload.referenceRootOutcome.status !== "admitted")
      throw new Error("expected admitted root");
    expect(
      await sha256CanonicalJsonHex(
        artifact.payload.referenceRootOutcome.referenceRootAuditorReport,
      ),
    ).toBe(
      artifact.payload.referenceRootOutcome.referenceRootAuditorReportSha256,
    );
    expect(
      await sha256CanonicalJsonHex(
        artifact.payload.referenceRootOutcome.admittedReferenceRootPayload,
      ),
    ).toBe(artifact.payload.referenceRootOutcome.admittedReferenceRootSha256);
    expect(
      artifact.payload.journalLineage.map((entry) => entry.payload.state),
    ).toEqual([
      "reserved",
      "reference-root",
      "literal",
      "canonical",
      "branch-audit",
      "completed",
    ]);
    const tamperedReport = structuredClone(
      artifact.payload.referenceRootOutcome.referenceRootAuditorReport,
    ) as any;
    tamperedReport.firstMismatchId = "coordinated-tamper";
    expect(await sha256CanonicalJsonHex(tamperedReport)).not.toBe(
      artifact.payload.referenceRootOutcome.referenceRootAuditorReportSha256,
    );
  });

  it("fails closed when the terminal projection changes between publication and independent root replay", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.terminalReplayTampered = true;

    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

    expect(artifact.payload).toMatchObject({
      status: "failed",
      officialSealedEngineeringEvidenceEligible: false,
      referenceRootOutcome: {
        status: "not-admitted",
        admittedReferenceRootPayload: null,
        admittedReferenceRootSha256: null,
        rootFailureReason: "reference-root-independent-audit-failed",
        auditOutcome: { status: "failed" },
      },
    });
    expect(artifact.payload.executions.map((entry) => entry.status)).toEqual([
      "dependency-failed",
      "dependency-failed",
      "dependency-failed",
    ]);
    const dependencyBranch = artifact.payload.executions[2].result;
    expect(dependencyBranch.status).toBe("dependency-failed");
    if (
      dependencyBranch.status !== "dependency-failed" ||
      !("namedSeedStageZeroDiagnostics" in dependencyBranch)
    )
      throw new Error("expected dependency-failed branch evidence");
    expect(dependencyBranch.namedSeedStageZeroDiagnostics).toHaveLength(2);
    expect(
      artifact.payload.preAdmissionIndependentAuditorReport
        .rootPayloadAndReportReplayPassed,
    ).toBe(true);
    expect(dependencies.stageCalls).toHaveLength(3);
  });

  it("rejects a coordinated failed-to-passed root report reseal after terminal replay divergence", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.terminalReplayTampered = true;
    const originalFreeze = Object.freeze;
    let rootReportResealed = false;
    const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
      value: object,
    ) => {
      if (
        !rootReportResealed &&
        "status" in value &&
        value.status === "failed" &&
        "scientificStatus" in value &&
        value.scientificStatus === "scientific-success" &&
        "terminalProjectionReplayPassed" in value &&
        value.terminalProjectionReplayPassed === false &&
        "stageZeroPayloadReplayPassed" in value
      ) {
        const mutable = value as unknown as {
          status: "passed" | "failed";
          scientificOutcomeReplayPassed: boolean;
          terminalProjectionReplayPassed: boolean;
          firstMismatchId: string | null;
        };
        mutable.status = "passed";
        mutable.scientificOutcomeReplayPassed = true;
        mutable.terminalProjectionReplayPassed = true;
        mutable.firstMismatchId = null;
        rootReportResealed = true;
      }
      return originalFreeze(value);
    }) as typeof Object.freeze);
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(rootReportResealed).toBe(true);
      expect(artifact.payload.referenceRootOutcome).toMatchObject({
        status: "admitted",
        referenceRootAuditorReport: {
          status: "passed",
          scientificOutcomeReplayPassed: true,
          terminalProjectionReplayPassed: true,
        },
      });
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .rootPayloadAndReportReplayPassed,
      ).toBe(false);
      expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
        false,
      );
    } finally {
      freezeSpy.mockRestore();
    }
  });

  it.each([
    ["wrong root stage index", "stageIndexTamperCallNumber"],
    ["wrong root loaded seed", "initialCoordinateTamperCallNumber"],
  ] as const)(
    "rejects a structurally self-consistent %s before root admission",
    async (_label, flag) => {
      await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
      dependencies.head = dependencies.B;
      dependencies[flag] = 1;

      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(artifact.payload.referenceRootOutcome).toMatchObject({
        status: "not-admitted",
        rootFailureReason: "reference-root-independent-audit-failed",
        auditOutcome: {
          status: "failed",
          referenceRootAuditorReport: {
            stageKernelPayloadBindingPassed: false,
            firstMismatchId: "stage-kernel-payload",
          },
        },
      });
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .rootPayloadAndReportReplayPassed,
      ).toBe(false);
    },
  );

  it("rejects a root stage whose retained chamber volumes differ from the canonical reference target", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    const originalFreeze = Object.freeze;
    let rootVolumeTampered = false;
    const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
      value: object,
    ) => {
      if (
        !rootVolumeTampered &&
        dependencies.stageCalls.length === 1 &&
        "chamberVolumesM3" in value &&
        "kernelEvidence" in value &&
        !("kernelAudit" in value)
      ) {
        const mutable = value as unknown as {
          chamberVolumesM3: Record<string, number>;
        };
        mutable.chamberVolumesM3 = {
          ...mutable.chamberVolumesM3,
          LV: mutable.chamberVolumesM3.LV + 1e-12,
        };
        rootVolumeTampered = true;
      }
      return originalFreeze(value);
    }) as typeof Object.freeze);
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(rootVolumeTampered).toBe(true);
      expect(artifact.payload.referenceRootOutcome).toMatchObject({
        status: "not-admitted",
        auditOutcome: {
          status: "failed",
          referenceRootAuditorReport: {
            stageKernelPayloadBindingPassed: false,
            firstMismatchId: "reference-volume-bits",
          },
        },
      });
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .rootPayloadAndReportReplayPassed,
      ).toBe(false);
    } finally {
      freezeSpy.mockRestore();
    }
  });

  it.each([
    "terminalCoordinates",
    "outcomeIdentity",
    "stageZeroEvidence",
  ] as const)(
    "rejects an admitted sealed-root hidden %s tamper",
    async (tamperKind) => {
      await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
      dependencies.head = dependencies.B;
      const originalFreeze = Object.freeze;
      let hiddenRootTampered = false;
      const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
        value: object,
      ) => {
        if (
          !hiddenRootTampered &&
          "outcome" in value &&
          "stageZeroEvidence" in value &&
          "terminalCoordinates" in value
        ) {
          const mutable = value as any;
          if (tamperKind === "terminalCoordinates")
            mutable.terminalCoordinates = {
              ...mutable.terminalCoordinates,
              junctionRadiusM:
                mutable.terminalCoordinates.junctionRadiusM + 1e-12,
            };
          else if (tamperKind === "outcomeIdentity")
            mutable.outcome = structuredClone(mutable.outcome);
          else
            mutable.stageZeroEvidence = {
              ...mutable.stageZeroEvidence,
              chamberVolumesM3: {
                ...mutable.stageZeroEvidence.chamberVolumesM3,
                LV: mutable.stageZeroEvidence.chamberVolumesM3.LV + 1e-12,
              },
            };
          hiddenRootTampered = true;
        }
        return originalFreeze(value);
      }) as typeof Object.freeze);
      try {
        const artifact =
          await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

        expect(hiddenRootTampered).toBe(true);
        expect(artifact.payload.referenceRootOutcome.status).toBe("admitted");
        expect(
          artifact.payload.preAdmissionIndependentAuditorReport
            .rootPayloadAndReportReplayPassed,
        ).toBe(false);
        expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
          false,
        );
      } finally {
        freezeSpy.mockRestore();
      }
    },
  );

  it.each([
    {
      label: "solver exception",
      flag: "solverThrowCallNumber" as const,
      attemptStatus: "solver-execution-failed",
      rootFailureReason: "reference-root-solver-execution-failed",
    },
    {
      label: "terminal projection exception",
      flag: "terminalThrowCallNumber" as const,
      attemptStatus: "terminal-projection-execution-failed",
      rootFailureReason: "reference-root-terminal-projection-execution-failed",
    },
  ])(
    "replays the exact not-run root union after a $label",
    async ({ flag, attemptStatus, rootFailureReason }) => {
      await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
      dependencies.head = dependencies.B;
      dependencies[flag] = 1;

      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(artifact.payload.referenceRootOutcome).toMatchObject({
        status: "not-admitted",
        rootFailureReason,
        referenceRootAttemptEvidence: { status: attemptStatus },
        auditOutcome: {
          status: "not-run",
          auditorNotRunReason: rootFailureReason,
        },
      });
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .rootPayloadAndReportReplayPassed,
      ).toBe(true);
      expect(dependencies.stageCalls).toHaveLength(3);
    },
  );

  it("replays the exact execution-failed root union after a kernel-auditor exception", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.auditorThrowCallNumber = 1;

    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

    expect(artifact.payload.referenceRootOutcome).toMatchObject({
      status: "not-admitted",
      rootFailureReason: "reference-root-kernel-auditor-execution-failed",
      referenceRootAttemptEvidence: {
        status: "kernel-auditor-execution-failed",
      },
      auditOutcome: {
        status: "execution-failed",
        auditorExecutionFailure: {
          name: "Error",
          message: "synthetic stage auditor exception",
        },
      },
    });
    expect(
      artifact.payload.preAdmissionIndependentAuditorReport
        .rootPayloadAndReportReplayPassed,
    ).toBe(true);
    expect(dependencies.stageCalls).toHaveLength(3);
  });

  it("rejects a coordinated solver-failure plus independent-auditor-execution-failed cross-arm reseal", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.solverThrowCallNumber = 1;
    const originalFreeze = Object.freeze;
    let invalidRootArmInjected = false;
    const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
      value: object,
    ) => {
      if (
        !invalidRootArmInjected &&
        "status" in value &&
        value.status === "not-admitted" &&
        "referenceRootAttemptEvidence" in value &&
        (value.referenceRootAttemptEvidence as Readonly<{ status: string }>)
          .status === "solver-execution-failed"
      ) {
        const mutable = value as unknown as {
          rootFailureReason: string;
          auditOutcome: unknown;
        };
        mutable.rootFailureReason =
          "reference-root-independent-auditor-execution-failed";
        mutable.auditOutcome = originalFreeze({
          status: "execution-failed",
          referenceRootAuditorReport: null,
          referenceRootAuditorReportSha256: null,
          auditorNotRunReason: null,
          auditorExecutionFailure: originalFreeze({
            name: "Error",
            message: "synthetic impossible downstream auditor exception",
          }),
        });
        invalidRootArmInjected = true;
      }
      return originalFreeze(value);
    }) as typeof Object.freeze);
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(invalidRootArmInjected).toBe(true);
      expect(artifact.payload.referenceRootOutcome).toMatchObject({
        status: "not-admitted",
        referenceRootAttemptEvidence: { status: "solver-execution-failed" },
        rootFailureReason:
          "reference-root-independent-auditor-execution-failed",
        auditOutcome: { status: "execution-failed" },
      });
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .rootPayloadAndReportReplayPassed,
      ).toBe(false);
      expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
        false,
      );
    } finally {
      freezeSpy.mockRestore();
    }
  });

  it("replays the full passing root report when only internal root sealing fails", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    const originalWeakSetAdd = WeakSet.prototype.add;
    const addSpy = vi
      .spyOn(WeakSet.prototype, "add")
      .mockImplementation(function (value: object) {
        if (
          "outcome" in value &&
          "stageZeroEvidence" in value &&
          "terminalCoordinates" in value
        )
          throw new Error("synthetic sealed-root registry failure");
        return originalWeakSetAdd.call(this, value);
      });
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(artifact.payload.referenceRootOutcome).toMatchObject({
        status: "not-admitted",
        rootFailureReason: "reference-root-sealing-failed",
        referenceRootAttemptEvidence: { status: "scientific-success" },
        auditOutcome: { status: "passed-but-sealing-failed" },
      });
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .rootPayloadAndReportReplayPassed,
      ).toBe(true);
      expect(dependencies.stageCalls).toHaveLength(3);
    } finally {
      addSpy.mockRestore();
    }
  });

  it("retains and independently replays the complete frozen cases after an audited reference-root scientific failure", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.solverScientificFailureCallNumber = 1;

    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

    expect(artifact.payload).toMatchObject({
      status: "failed",
      officialSealedEngineeringEvidenceEligible: false,
      referenceRootOutcome: {
        status: "not-admitted",
        rootFailureReason: "line-search-failed",
        referenceRootAttemptEvidence: {
          status: "scientific-failure",
          failurePhase: "stage-solve",
          failureReason: "line-search-failed",
        },
        auditOutcome: { status: "passed-but-scientific-failure" },
      },
    });
    if (artifact.payload.referenceRootOutcome.status !== "not-admitted")
      throw new Error("expected retained scientific root failure");
    const attempt =
      artifact.payload.referenceRootOutcome.referenceRootAttemptEvidence;
    expect(attempt.stageKernelEvidence).not.toBeNull();
    if (attempt.stageKernelEvidence === null)
      throw new Error("expected retained failed root stage evidence");
    expect(attempt.rootInputEvidence.referenceVolumesM3).toEqual(
      attempt.stageKernelEvidence.chamberVolumesM3,
    );
    expect(attempt.rootInputEvidence.initialCoordinates).toEqual(
      attempt.stageKernelEvidence.kernelEvidence.stageResult.initialCoordinates,
    );
    expect(
      artifact.payload.referenceRootOutcome.auditOutcome
        .referenceRootAuditorReport?.fullProvenanceReplayPassed,
    ).toBe(true);

    expect(artifact.payload.executions.map((entry) => entry.status)).toEqual([
      "dependency-failed",
      "dependency-failed",
      "dependency-failed",
    ]);
    for (const execution of artifact.payload.executions.slice(0, 2)) {
      if (
        execution.result.status !== "dependency-failed" ||
        !("casePayloadSha256" in execution.result)
      )
        throw new Error("expected frozen dependency case payload");
      const { casePayloadSha256, ...casePayload } = execution.result;
      expect(await sha256CanonicalJsonHex(casePayload)).toBe(casePayloadSha256);
    }
    const branch = artifact.payload.executions[2].result;
    if (
      branch.status !== "dependency-failed" ||
      !("namedSeedStageZeroDiagnostics" in branch)
    )
      throw new Error("expected named seed dependency diagnostics");
    for (const diagnostic of branch.namedSeedStageZeroDiagnostics) {
      const { payloadSha256, ...casePayload } = diagnostic;
      expect(await sha256CanonicalJsonHex(casePayload)).toBe(payloadSha256);
    }
    expect(artifact.payload.preAdmissionIndependentAuditorReport).toMatchObject(
      {
        status: "failed",
        rootPayloadAndReportReplayPassed: true,
        literalCaseReplayPassed: true,
        canonicalCaseReplayPassed: true,
        namedSeedCaseReplayPassed: true,
        branchResultAndAllStageReplayPassed: true,
      },
    );
    expect(dependencies.stageCalls).toHaveLength(3);
  });

  it.each([
    ["branch schedule stage index", "stageIndexTamperCallNumber", 66],
    [
      "named seed loaded-coordinate lineage",
      "initialCoordinateTamperCallNumber",
      391,
    ],
  ] as const)(
    "rejects a resealed %s tamper in the independent branch lineage auditor",
    async (_label, flag, callNumber) => {
      await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
      dependencies.head = dependencies.B;
      dependencies[flag] = callNumber;

      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(artifact.payload.status).toBe("failed");
      expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
        false,
      );
      expect(artifact.payload.executions[2].status).toBe(
        "evidence-audit-failure",
      );
      const branch = artifact.payload.executions[2].result;
      expect(branch.status).toBe("branch-audit-failed");
      if (branch.status !== "branch-audit-failed" || !("result" in branch))
        throw new Error("expected retained branch-audit evidence");
      expect(branch.independentAuditorReport).toMatchObject({
        status: "failed",
        participantStageLineageReplayPassed: false,
        firstMismatchId: "participant-stage-lineage",
      });
      expect(dependencies.stageCalls).toHaveLength(522);
    },
  );

  it("retains completed primary stages when a later stage solver throws and continues all dependency-available executions", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.solverThrowCallNumber = 3;

    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

    expect(artifact.payload.status).toBe("failed");
    expect(artifact.payload.executions.map((entry) => entry.status)).toEqual([
      "execution-exception",
      "fulfilled",
      "fulfilled",
    ]);
    const literal = artifact.payload.executions[0].result;
    expect(literal.status).toBe("not-equilibrated");
    if (literal.status !== "not-equilibrated")
      throw new Error("expected retained primary failure");
    expect(literal).toMatchObject({
      failurePhase: "stage-solver",
      failureReason: "stage-solver-execution-failed",
      exception: {
        name: "Error",
        message: "synthetic stage solver exception",
      },
    });
    expect(literal.completedStages).toHaveLength(1);
    expect(
      literal.completedStages[0]?.kernelEvidence.stageResult.stageIndex,
    ).toBe(1);
    expect(artifact.payload.executions[2].result.status).toBe(
      "branch-agreement-established",
    );
  });

  it("retains and structurally replays a primary raw kernel after its stage auditor throws", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.auditorThrowCallNumber = 3;

    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

    expect(artifact.payload.executions[0].status).toBe("execution-exception");
    const literal = artifact.payload.executions[0].result;
    expect(literal.status).toBe("not-equilibrated");
    if (literal.status !== "not-equilibrated")
      throw new Error("expected retained primary auditor failure");
    expect(literal).toMatchObject({
      failurePhase: "stage-auditor",
      failureReason: "stage-evidence-auditor-execution-failed",
      exception: {
        name: "Error",
        message: "synthetic stage auditor exception",
      },
    });
    expect(literal.completedStages).toHaveLength(1);
    expect(literal.failedStageKernelEvidence).not.toBeNull();
    expect(literal.failedStage).toBeNull();
    expect(
      artifact.payload.preAdmissionIndependentAuditorReport
        .literalCaseReplayPassed,
    ).toBe(true);
  });

  it("rejects a resealed primary audited-stage failure carrying a forbidden exception field", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.solverScientificFailureCallNumber = 3;
    const originalFreeze = Object.freeze;
    let forbiddenExceptionInjected = false;
    const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
      value: object,
    ) => {
      if (
        !forbiddenExceptionInjected &&
        "status" in value &&
        value.status === "not-equilibrated" &&
        "failurePhase" in value &&
        value.failurePhase === "stage-scientific" &&
        "failedStage" in value &&
        value.failedStage !== null &&
        "exception" in value &&
        value.exception === null
      ) {
        (value as { exception: unknown }).exception = {
          name: "Error",
          message: "forbidden coordinated exception tamper",
        };
        forbiddenExceptionInjected = true;
      }
      return originalFreeze(value);
    }) as typeof Object.freeze);
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(forbiddenExceptionInjected).toBe(true);
      expect(artifact.payload.executions[0].status).toBe("execution-exception");
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .literalCaseReplayPassed,
      ).toBe(false);
      expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
        false,
      );
    } finally {
      freezeSpy.mockRestore();
    }
  });

  it("retains and independently validates an audited branch scientific failure without relabeling it as an audit failure", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.solverScientificFailureCallNumber = 70;

    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

    expect(artifact.payload.status).toBe("failed");
    expect(artifact.payload.executions[2].status).toBe("scientific-failure");
    const branch = artifact.payload.executions[2].result;
    expect(branch.status).toBe("branch-audit-failed");
    if (branch.status !== "branch-audit-failed" || !("result" in branch))
      throw new Error("expected retained audited branch failure");
    expect(branch.independentAuditorReport).toMatchObject({
      status: "passed",
      participantStageLineageReplayPassed: true,
    });
    const failedParticipant = branch.result.participants[0];
    expect(failedParticipant.status).toBe("participant-failed");
    if (failedParticipant.status !== "participant-failed")
      throw new Error("expected failed primary branch participant");
    expect(failedParticipant).toMatchObject({
      failurePhase: "homotopy-stage-scientific",
      failureReason: "line-search-failed",
      exception: null,
    });
    expect(failedParticipant.homotopyStages).toHaveLength(4);
    expect(failedParticipant.failedHomotopyStage).not.toBeNull();
    expect(failedParticipant.failedHomotopyStageKernelEvidence).not.toBeNull();
  });

  it.each([
    {
      label: "seed stage-zero solver exception",
      flag: "solverThrowCallNumber" as const,
      callNumber: 226,
      participantIndex: 3,
      failurePhase: "stage-zero-solver",
      completedStageCount: 0,
      stageZeroKernelRetained: false,
      failedHomotopyKernelRetained: false,
    },
    {
      label: "seed stage-zero auditor exception",
      flag: "auditorThrowCallNumber" as const,
      callNumber: 226,
      participantIndex: 3,
      failurePhase: "stage-zero-auditor",
      completedStageCount: 0,
      stageZeroKernelRetained: true,
      failedHomotopyKernelRetained: false,
    },
    {
      label: "homotopy-stage auditor exception",
      flag: "auditorThrowCallNumber" as const,
      callNumber: 70,
      participantIndex: 0,
      failurePhase: "homotopy-stage-auditor",
      completedStageCount: 4,
      stageZeroKernelRetained: true,
      failedHomotopyKernelRetained: true,
    },
  ])(
    "retains and independently validates a $label",
    async ({
      flag,
      callNumber,
      participantIndex,
      failurePhase,
      completedStageCount,
      stageZeroKernelRetained,
      failedHomotopyKernelRetained,
    }) => {
      await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
      dependencies.head = dependencies.B;
      dependencies[flag] = callNumber;

      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(artifact.payload.status).toBe("failed");
      expect(artifact.payload.executions[2].status).toBe("execution-exception");
      const branch = artifact.payload.executions[2].result;
      expect(branch.status).toBe("branch-audit-failed");
      if (branch.status !== "branch-audit-failed" || !("result" in branch))
        throw new Error("expected retained branch failure evidence");
      expect(branch.independentAuditorReport).toMatchObject({
        status: "passed",
        stageZeroRootLineageReplayPassed: true,
        participantStageLineageReplayPassed: true,
      });
      const participant = branch.result.participants[participantIndex];
      expect(participant.status).toBe("participant-failed");
      if (participant.status !== "participant-failed")
        throw new Error("expected retained failed participant");
      expect(participant.failurePhase).toBe(failurePhase);
      expect(participant.homotopyStages).toHaveLength(completedStageCount);
      expect(participant.stageZeroKernelEvidence !== null).toBe(
        stageZeroKernelRetained,
      );
      expect(participant.failedHomotopyStageKernelEvidence !== null).toBe(
        failedHomotopyKernelRetained,
      );
      expect(participant.exception).toMatchObject({
        name: "Error",
      });
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .branchResultAndAllStageReplayPassed,
      ).toBe(true);
    },
  );

  it("retains and independently replays branch terminal-Schur execution exceptions", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.terminalThrowFromCallNumber = 4;

    const artifact =
      await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

    expect(artifact.payload.executions[2].status).toBe("execution-exception");
    const branch = artifact.payload.executions[2].result;
    expect(branch.status).toBe("branch-audit-failed");
    if (branch.status !== "branch-audit-failed" || !("result" in branch))
      throw new Error("expected retained branch terminal failure");
    expect(branch.independentAuditorReport).toMatchObject({
      status: "passed",
      participantStageLineageReplayPassed: true,
    });
    expect(branch.result.participants[0]).toMatchObject({
      status: "participant-failed",
      failurePhase: "terminal-schur",
      failureReason: "terminal-schur-execution-failed",
      exception: {
        name: "Error",
        message: "synthetic terminal projection exception",
      },
    });
    expect(
      artifact.payload.preAdmissionIndependentAuditorReport
        .branchResultAndAllStageReplayPassed,
    ).toBe(true);
  });

  it("rejects a named-seed case digest tamper even when the enclosing branch result is resealed", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    const originalFreeze = Object.freeze;
    let caseDigestTampered = false;
    const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
      value: object,
    ) => {
      if (
        !caseDigestTampered &&
        "participantId" in value &&
        value.participantId === "seed-zero-plus-0.25" &&
        "casePayloadSha256" in value
      ) {
        (value as { casePayloadSha256: string }).casePayloadSha256 = "f".repeat(
          64,
        );
        caseDigestTampered = true;
      }
      return originalFreeze(value);
    }) as typeof Object.freeze);
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(caseDigestTampered).toBe(true);
      const branch = artifact.payload.executions[2].result;
      expect(branch.status).toBe("branch-audit-failed");
      if (branch.status !== "branch-audit-failed" || !("result" in branch))
        throw new Error("expected retained resealed branch result");
      expect(await sha256CanonicalJsonHex(branch.result)).toBe(
        branch.resultSha256,
      );
      expect(branch.independentAuditorReport).toMatchObject({
        status: "failed",
        participantStageLineageReplayPassed: false,
      });
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .namedSeedCaseReplayPassed,
      ).toBe(false);
    } finally {
      freezeSpy.mockRestore();
    }
  });

  it("rejects a resealed top-level status that contradicts its retained result and exception precedence", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.solverScientificFailureCallNumber = 70;
    const originalFreeze = Object.freeze;
    let topStatusTampered = false;
    const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
      value: object,
    ) => {
      if (
        !topStatusTampered &&
        "executionId" in value &&
        value.executionId === "reference-branch-audit-v2" &&
        "status" in value &&
        value.status === "scientific-failure" &&
        !("payloadSha256" in value)
      ) {
        (value as { status: string }).status = "fulfilled";
        topStatusTampered = true;
      }
      return originalFreeze(value);
    }) as typeof Object.freeze);
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(topStatusTampered).toBe(true);
      const execution = artifact.payload.executions[2];
      expect(execution.status).toBe("fulfilled");
      expect(
        await sha256CanonicalJsonHex({
          executionId: execution.executionId,
          status: execution.status,
          result: execution.result,
          exception: execution.exception,
        }),
      ).toBe(execution.payloadSha256);
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .executionOrderAndEnvelopeHashReplayPassed,
      ).toBe(false);
      expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
        false,
      );
    } finally {
      freezeSpy.mockRestore();
    }
  });

  it("rejects a coordinated outer-branch and top-level success reseal over an inner scientific failure", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.solverScientificFailureCallNumber = 70;
    const originalFreeze = Object.freeze;
    let outerBranchTampered = false;
    let topLevelTampered = false;
    const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
      value: object,
    ) => {
      if (
        !outerBranchTampered &&
        "resultSha256" in value &&
        "independentAuditorReport" in value &&
        "branchAgreementEstablished" in value &&
        "status" in value &&
        value.status === "branch-audit-failed"
      ) {
        const mutable = value as unknown as {
          status: string;
          branchAgreementEstablished: boolean;
        };
        mutable.status = "branch-agreement-established";
        mutable.branchAgreementEstablished = true;
        outerBranchTampered = true;
      } else if (
        !topLevelTampered &&
        "executionId" in value &&
        value.executionId === "reference-branch-audit-v2" &&
        "status" in value &&
        value.status === "fulfilled" &&
        !("payloadSha256" in value)
      ) {
        topLevelTampered = true;
      }
      return originalFreeze(value);
    }) as typeof Object.freeze);
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect({ outerBranchTampered, topLevelTampered }).toEqual({
        outerBranchTampered: true,
        topLevelTampered: true,
      });
      const execution = artifact.payload.executions[2];
      expect(execution.status).toBe("fulfilled");
      const branch = execution.result;
      expect(branch.status).toBe("branch-agreement-established");
      if (
        branch.status !== "branch-agreement-established" ||
        !("result" in branch)
      )
        throw new Error("expected coordinated outer branch tamper");
      expect(branch.result.branchAgreementEstablished).toBe(false);
      expect(branch.branchAgreementEstablished).toBe(true);
      expect(
        await sha256CanonicalJsonHex(branch.independentAuditorReport),
      ).toBe(branch.independentAuditorReportSha256);
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .executionOrderAndEnvelopeHashReplayPassed,
      ).toBe(false);
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .branchResultAndAllStageReplayPassed,
      ).toBe(false);
      expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
        false,
      );
    } finally {
      freezeSpy.mockRestore();
    }
  });

  it("rejects a retained branch report whose summary boolean is tampered and then resealed", async () => {
    await sealMainWireNormalAdultFiveWallPassiveEquilibriumCommitACliV2();
    dependencies.head = dependencies.B;
    dependencies.solverScientificFailureCallNumber = 70;
    const originalFreeze = Object.freeze;
    let reportTampered = false;
    const freezeSpy = vi.spyOn(Object, "freeze").mockImplementation(((
      value: object,
    ) => {
      if (
        !reportTampered &&
        "reportId" in value &&
        value.reportId ===
          "main-wire-normal-adult-passive-equilibrium-branch-audit-independent-report-v2" &&
        "summaryReplayPassed" in value
      ) {
        (value as { summaryReplayPassed: boolean }).summaryReplayPassed = false;
        reportTampered = true;
      }
      return originalFreeze(value);
    }) as typeof Object.freeze);
    try {
      const artifact =
        await verifyMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceCliV2();

      expect(reportTampered).toBe(true);
      const branch = artifact.payload.executions[2].result;
      expect(branch.status).toBe("branch-audit-failed");
      if (branch.status !== "branch-audit-failed" || !("result" in branch))
        throw new Error("expected retained branch evidence");
      expect(branch.independentAuditorReport).toMatchObject({
        status: "passed",
        summaryReplayPassed: false,
      });
      expect(
        await sha256CanonicalJsonHex(branch.independentAuditorReport),
      ).toBe(branch.independentAuditorReportSha256);
      expect(
        artifact.payload.preAdmissionIndependentAuditorReport
          .branchResultAndAllStageReplayPassed,
      ).toBe(false);
      expect(artifact.payload.officialSealedEngineeringEvidenceEligible).toBe(
        false,
      );
    } finally {
      freezeSpy.mockRestore();
    }
  });
});
