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

const PREREGISTERED_DEFAULT_ARTIFACT_PATH_V1 = path.join(
  process.cwd(),
  "data/myocardium/verification/mainwire-standard66-aortic-validation-v1/preregistered/default/dt-2ms-production.json",
);

function readPreregisteredDefaultArtifactV1(): Record<string, any> {
  return JSON.parse(
    readFileSync(PREREGISTERED_DEFAULT_ARTIFACT_PATH_V1, "utf8"),
  ) as Record<string, any>;
}

function cloneArtifactV1<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function rehashArtifactV1(
  artifact: Record<string, any>,
  options: Readonly<{ armProtocol?: boolean }> = {},
): Promise<void> {
  if (options.armProtocol) {
    artifact.payload.armResult.protocolIdentityHash =
      await sha256CanonicalJsonHex(artifact.payload.armResult.protocolIdentity);
  }
  artifact.payloadSha256 = await sha256CanonicalJsonHex(artifact.payload);
}

/**
 * Validator-only semantic-relation fixture. It is not evidence that the owner
 * runner emitted a research result because the compact artifact omits the
 * settling and confirmation protocol preimages needed to establish that.
 */
async function asSyntheticResearchCompleteValidatorFixtureV1(
  artifact: Record<string, any>,
): Promise<Record<string, any>> {
  const research = cloneArtifactV1(artifact);
  const arm = research.payload.armResult;
  arm.executionPurpose = "research-screening";
  arm.protocolIdentity.executionPurpose = "research-screening";
  arm.protocolIdentity.outcomePolicy.terminalOutcomesRequireSettlingStatus =
    "research-period1-candidate";
  arm.settlement.executionPurpose = "research-eager";
  arm.settlement.status = "research-period1-candidate";
  arm.settlement.numericalPeriod1Established = false;
  arm.settlement.latestPeriod1Observation.consecutiveClosures = 3;
  arm.status = "research-screening-complete";
  arm.modeEligibility = {
    testOnlyBoundedSmoke: false,
    eligibleForPreregisteredSingleArmMeasurement: false,
  };
  await rehashArtifactV1(research, { armProtocol: true });
  return research;
}

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

  it("rejects hash-recalculated purpose, status, eligibility, and settling-purpose forgeries", async () => {
    const formal = readPreregisteredDefaultArtifactV1();
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(formal),
    ).resolves.toBeUndefined();

    const research =
      await asSyntheticResearchCompleteValidatorFixtureV1(formal);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(research),
    ).resolves.toBeUndefined();

    const outcomeWithFailure = cloneArtifactV1(research);
    outcomeWithFailure.payload.armResult.failure = {
      stage: "terminal-trace-or-analysis",
      message: "forged failure beside a completed outcome",
    };
    await rehashArtifactV1(outcomeWithFailure);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(outcomeWithFailure),
    ).rejects.toThrow(/lack settled confirmation/);

    const relabeledResearch = cloneArtifactV1(research);
    relabeledResearch.payload.armResult.status = "terminal-analysis-complete";
    relabeledResearch.payload.armResult.modeEligibility.eligibleForPreregisteredSingleArmMeasurement = true;
    await rehashArtifactV1(relabeledResearch);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(relabeledResearch),
    ).rejects.toThrow(/outcome availability is inconsistent/);

    const unknownStatus = cloneArtifactV1(formal);
    unknownStatus.payload.armResult.status = "future-complete";
    unknownStatus.payload.armResult.outcomes = null;
    unknownStatus.payload.armResult.modeEligibility.eligibleForPreregisteredSingleArmMeasurement = false;
    await rehashArtifactV1(unknownStatus);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(unknownStatus),
    ).rejects.toThrow(/purpose and status are inconsistent/);

    const ineligibleFormal = cloneArtifactV1(formal);
    ineligibleFormal.payload.armResult.modeEligibility.eligibleForPreregisteredSingleArmMeasurement = false;
    await rehashArtifactV1(ineligibleFormal);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(ineligibleFormal),
    ).rejects.toThrow(/mode eligibility is inconsistent/);

    const wrongSettlingPurpose = cloneArtifactV1(formal);
    wrongSettlingPurpose.payload.armResult.settlement.executionPurpose =
      "research-eager";
    await rehashArtifactV1(wrongSettlingPurpose);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(wrongSettlingPurpose),
    ).rejects.toThrow(/settling execution purposes are inconsistent/);

    const unknownPurpose = cloneArtifactV1(formal);
    unknownPurpose.payload.armResult.executionPurpose = "future-validation";
    unknownPurpose.payload.armResult.protocolIdentity.executionPurpose =
      "future-validation";
    await rehashArtifactV1(unknownPurpose, { armProtocol: true });
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(unknownPurpose),
    ).rejects.toThrow(/execution purpose is invalid/);
  });

  it("rejects every hash-recalculated outcome-policy deviation", async () => {
    const formal = readPreregisteredDefaultArtifactV1();
    const mutations: readonly ((policy: Record<string, any>) => void)[] = [
      (policy) => {
        policy.terminalOutcomesRequireSettlingStatus =
          "research-period1-candidate";
      },
      (policy) => {
        policy.terminalOutcomesRequireFreshConfirmationStatus =
          "future-confirmed";
      },
      (policy) => {
        policy.boundedSmokeCanProduceTerminalOutcomes = true;
      },
      (policy) => {
        policy.partialTerminalOutcomesReturnedAfterAnalysisFailure = true;
      },
      (policy) => {
        policy.unregisteredPolicyField = false;
      },
    ];

    for (const mutate of mutations) {
      const forged = cloneArtifactV1(formal);
      mutate(forged.payload.armResult.protocolIdentity.outcomePolicy);
      await rehashArtifactV1(forged, { armProtocol: true });
      await expect(
        assertMainWireStandard66ValidationRunArtifactV1(forged),
      ).rejects.toThrow(/outcome policy is inconsistent/);
    }
  });

  it("rejects hash-recalculated research gate-evidence forgeries", async () => {
    const research = await asSyntheticResearchCompleteValidatorFixtureV1(
      readPreregisteredDefaultArtifactV1(),
    );
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(research),
    ).resolves.toBeUndefined();

    const settlingMutations: readonly ((arm: Record<string, any>) => void)[] = [
      (arm) => {
        arm.settlement.latestPeriod1Observation.withinTolerance = false;
      },
      (arm) => {
        arm.settlement.latestPeriod1Observation.consecutiveClosures = 2;
      },
      (arm) => {
        arm.settlement.latestPeriod1Observation.consecutiveClosures = 4;
      },
      (arm) => {
        arm.settlement.latestPeriod1Observation.maximumNormalizedDelta = 1;
      },
      (arm) => {
        arm.settlement.failure = { kind: "forged-failure" };
      },
    ];
    for (const mutate of settlingMutations) {
      const forged = cloneArtifactV1(research);
      mutate(forged.payload.armResult);
      await rehashArtifactV1(forged);
      await expect(
        assertMainWireStandard66ValidationRunArtifactV1(forged),
      ).rejects.toThrow(/passing settling suffix/);
    }

    const confirmationMutations: readonly ((
      arm: Record<string, any>,
    ) => void)[] = [
      (arm) => {
        arm.confirmation.freshSuffix.requiredConsecutivePeriod1Closures = 2;
      },
      (arm) => {
        arm.confirmation.freshSuffix.comparisonCount = 2;
      },
      (arm) => {
        arm.confirmation.freshSuffix.consecutivePeriod1Closures = 2;
      },
      (arm) => {
        arm.confirmation.freshSuffix.failedClosureResetsConsecutiveCount = false;
      },
      (arm) => {
        arm.confirmation.freshSuffix.observations =
          arm.confirmation.freshSuffix.observations.slice(1);
      },
      (arm) => {
        arm.confirmation.freshSuffix.observations[0].withinPeriod1Tolerance = false;
      },
      (arm) => {
        arm.confirmation.freshSuffix.observations[0].period1MaximumNormalizedDelta = 1;
      },
      (arm) => {
        arm.confirmation.freshSuffix.observations[1].consecutivePeriod1Closures = 1;
      },
      (arm) => {
        arm.confirmation.freshSuffix.observations[2].acceptedRevision += 1;
      },
      (arm) => {
        arm.confirmation.failure = { kind: "forged-failure" };
      },
    ];
    for (const mutate of confirmationMutations) {
      const forged = cloneArtifactV1(research);
      mutate(forged.payload.armResult);
      await rehashArtifactV1(forged);
      await expect(
        assertMainWireStandard66ValidationRunArtifactV1(forged),
      ).rejects.toThrow(/exact fresh confirmation suffix/);
    }

    const longerConfirmation = cloneArtifactV1(research);
    longerConfirmation.payload.armResult.confirmation.freshSuffix.comparisonCount = 4;
    await rehashArtifactV1(longerConfirmation);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(longerConfirmation),
    ).resolves.toBeUndefined();

    const candidateAnchor = cloneArtifactV1(research);
    candidateAnchor.payload.armResult.settlement.latestPeriod1Observation.acceptedTimeSec += 1;
    await rehashArtifactV1(candidateAnchor);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(candidateAnchor),
    ).rejects.toThrow(/not anchored at its candidate boundary/);

    const formalReferenceAnchor = readPreregisteredDefaultArtifactV1();
    formalReferenceAnchor.payload.armResult.confirmation.freshSuffix.firstReferenceBoundaryRevision += 1;
    await rehashArtifactV1(formalReferenceAnchor);
    await expect(
      assertMainWireStandard66ValidationRunArtifactV1(formalReferenceAnchor),
    ).rejects.toThrow(/reference does not follow settlement/);
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
      researchScreening: false,
      forceOverwrite: false,
    });
    expect(
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--research-screening",
        "--case",
        "default",
        "--arm",
        "dt-2ms-production",
      ]).researchScreening,
    ).toBe(true);
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
    expect(() =>
      parseMainWireStandard66ValidationArmCliArgumentsV1([
        "--case",
        "default",
        "--arm",
        "dt-2ms-production",
        "--research-screening",
        "--bounded-smoke-seconds",
        "1",
      ]),
    ).toThrow(/mutually exclusive/);
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
