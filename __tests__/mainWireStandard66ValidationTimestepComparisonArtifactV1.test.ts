import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_CLAIM_V1,
  createMainWireStandard66ValidationTimestepComparisonArtifactFromSerializedRunsV1,
  createMainWireStandard66ValidationTimestepComparisonArtifactV1,
  parseMainWireStandard66ValidationTimestepComparisonArtifactV1,
  serializeMainWireStandard66ValidationTimestepComparisonArtifactV1,
  verifyMainWireStandard66ValidationTimestepComparisonArtifactAgainstSerializedRunsV1,
} from "@/analysis/runtime/MainWireStandard66ValidationTimestepComparisonArtifactV1";
import {
  createMainWireStandard66ValidationRunArtifactV1,
  serializeMainWireStandard66ValidationRunArtifactV1,
  type MainWireStandard66ValidationRunArtifactV1,
} from "@/analysis/runtime/MainWireStandard66ValidationRunArtifactV1";
import { runMainWireStandard66ValidationArmV1 } from "@/analysis/runtime/MainWireStandard66ValidationArmRunnerV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";
import {
  compareMainWireStandard66ValidationArmArtifactsCliV1,
  summarizeMainWireStandard66ValidationComparisonForReceiptV1,
} from "@/tools/scientific/compareMainWireStandard66ValidationArmArtifactsV1";

describe("Standard66 validation timestep comparison artifact V1", () => {
  let armArtifacts: readonly [
    MainWireStandard66ValidationRunArtifactV1,
    MainWireStandard66ValidationRunArtifactV1,
    MainWireStandard66ValidationRunArtifactV1,
  ];
  let serializedArms: readonly [string, string, string];
  let differentCaseArtifact: MainWireStandard66ValidationRunArtifactV1;
  let differentCohortArtifact: MainWireStandard66ValidationRunArtifactV1;

  beforeAll(async () => {
    const resolutionCase =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.find(
        ({ caseId }) => caseId === "resolution-iv-01",
      )!;
    const [dt2, dt1, dt05, differentCase, differentCohort] = await Promise.all([
      runMainWireStandard66ValidationArmV1({
        clockArmId: "dt-2ms-production",
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec: 0.01,
      }),
      runMainWireStandard66ValidationArmV1({
        clockArmId: "dt-1ms-intermediate",
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec: 0.01,
      }),
      runMainWireStandard66ValidationArmV1({
        clockArmId: "dt-0p5ms-reference",
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec: 0.01,
      }),
      runMainWireStandard66ValidationArmV1({
        clockArmId: "dt-0p5ms-reference",
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec: 0.01,
        hemodynamicResearchInputs: resolutionCase.hemodynamicResearchInputs,
      }),
      runMainWireStandard66ValidationArmV1({
        clockArmId: "dt-0p5ms-reference",
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec: 0.01,
        ventricularContractilityScale: 1.01,
      }),
    ]);
    armArtifacts = await Promise.all([
      wrapEnvelopeArmV1("default", dt2),
      wrapEnvelopeArmV1("default", dt1),
      wrapEnvelopeArmV1("default", dt05),
    ]);
    serializedArms = await Promise.all([
      serializeMainWireStandard66ValidationRunArtifactV1(armArtifacts[0]),
      serializeMainWireStandard66ValidationRunArtifactV1(armArtifacts[1]),
      serializeMainWireStandard66ValidationRunArtifactV1(armArtifacts[2]),
    ]);
    differentCaseArtifact = await wrapEnvelopeArmV1(
      "resolution-iv-01",
      differentCase,
    );
    differentCohortArtifact = await wrapEnvelopeArmV1(
      "default",
      differentCohort,
    );
  }, 120_000);

  it("uses the pure evaluator, retains upstream unavailability, and emits no partial gates", async () => {
    const artifact =
      await createMainWireStandard66ValidationTimestepComparisonArtifactV1([
        armArtifacts[2],
        armArtifacts[0],
        armArtifacts[1],
      ]);

    expect(artifact.payload.sourceArms.map(({ armId }) => armId)).toEqual([
      "dt-2ms-production",
      "dt-1ms-intermediate",
      "dt-0p5ms-reference",
    ]);
    expect(artifact.payload.comparisonResult.status).toBe("unavailable");
    if (artifact.payload.comparisonResult.status !== "unavailable") {
      throw new Error("bounded smoke cannot produce a numerical comparison");
    }
    expect(artifact.payload.comparisonResult.pairEvaluations).toBeNull();
    expect(
      artifact.payload.comparisonResult.unavailableReasons.map(
        ({ code, sourceReason }) => ({ code, sourceReason }),
      ),
    ).toEqual(
      expect.arrayContaining([
        {
          code: "period1-settlement-unavailable",
          sourceReason: "settling:bounded-smoke-complete",
        },
        {
          code: "fresh-period1-confirmation-unavailable",
          sourceReason: "confirmation:not-run",
        },
        {
          code: "terminal-measurements-unavailable",
          sourceReason: "terminal:bounded-smoke-complete",
        },
      ]),
    );
    expect(artifact.payload.claim).toEqual(
      MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_CLAIM_V1,
    );
    expect(artifact.payload.claim).toMatchObject({
      researchOnly: true,
      unavailableInputsProducePartialGateEvaluations: false,
      physiologicalAcceptanceEstablished: false,
      releaseAcceptanceEstablished: false,
      clinicalUseAuthorized: false,
      causalAttributionClaimed: false,
      standaloneParseReverifiesSourceArtifacts: false,
      sourceArtifactSha256ReferencesAreDigitalSignatures: false,
      strictSourceBindingRequiresSerializedRunArtifacts: true,
    });
  });

  it("is input-order invariant and round-trips as detached canonical JSON", async () => {
    const first =
      await createMainWireStandard66ValidationTimestepComparisonArtifactV1(
        armArtifacts,
      );
    const second =
      await createMainWireStandard66ValidationTimestepComparisonArtifactV1([
        armArtifacts[1],
        armArtifacts[2],
        armArtifacts[0],
      ]);
    const firstSerialized =
      await serializeMainWireStandard66ValidationTimestepComparisonArtifactV1(
        first,
      );
    const secondSerialized =
      await serializeMainWireStandard66ValidationTimestepComparisonArtifactV1(
        second,
      );
    expect(secondSerialized).toBe(firstSerialized);

    const parsed =
      await parseMainWireStandard66ValidationTimestepComparisonArtifactV1(
        firstSerialized,
      );
    expect(parsed).toEqual(first);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.payload.sourceArms)).toBe(true);
    expect(Object.isFrozen(parsed.payload.sourceArms[0]!.comparisonInput)).toBe(
      true,
    );
  });

  it("rejects wrong topology before numerical comparison", async () => {
    await expect(
      createMainWireStandard66ValidationTimestepComparisonArtifactV1(
        armArtifacts.slice(0, 2),
      ),
    ).rejects.toThrow(/exactly three canonical arm artifacts/);
    await expect(
      createMainWireStandard66ValidationTimestepComparisonArtifactV1([
        armArtifacts[0],
        armArtifacts[1],
        differentCaseArtifact,
      ]),
    ).rejects.toThrow(/exact same validation-envelope coordinate/);
    await expect(
      createMainWireStandard66ValidationTimestepComparisonArtifactV1([
        armArtifacts[0],
        armArtifacts[1],
        differentCohortArtifact,
      ]),
    ).rejects.toThrow(/identical comparison cohort identity/);

    const geometryArtifact =
      await createMainWireStandard66ValidationRunArtifactV1({
        study: {
          studyKind: "geometry-profile",
          stageId: "held-out-load-default",
        },
        armResult: armArtifacts[2].payload.armResult,
      });
    await expect(
      createMainWireStandard66ValidationTimestepComparisonArtifactV1([
        armArtifacts[0],
        armArtifacts[1],
        geometryArtifact,
      ]),
    ).rejects.toThrow(/validation-envelope arm artifacts only/);
  });

  it("lets the owner evaluator report duplicate and missing clock arms without partial gates", async () => {
    const artifact =
      await createMainWireStandard66ValidationTimestepComparisonArtifactV1([
        armArtifacts[0],
        armArtifacts[0],
        armArtifacts[2],
      ]);
    expect(artifact.payload.comparisonResult.status).toBe("unavailable");
    if (artifact.payload.comparisonResult.status !== "unavailable") {
      throw new Error("invalid clock coverage cannot be evaluated");
    }
    expect(artifact.payload.comparisonResult.pairEvaluations).toBeNull();
    expect(
      artifact.payload.comparisonResult.unavailableReasons.map(
        ({ code }) => code,
      ),
    ).toEqual(expect.arrayContaining(["duplicate-arm-id", "missing-arm-id"]));
  });

  it("recomputes the pure result and rejects a self-consistently rehashed fabrication", async () => {
    const artifact =
      await createMainWireStandard66ValidationTimestepComparisonArtifactV1(
        armArtifacts,
      );
    const fabricated = JSON.parse(
      await serializeMainWireStandard66ValidationTimestepComparisonArtifactV1(
        artifact,
      ),
    ) as Record<string, any>;
    fabricated.payload.comparisonResult.unavailableReasons[0].message =
      "fabricated reason";
    fabricated.payloadSha256 = await sha256CanonicalJsonHex(fabricated.payload);

    await expect(
      parseMainWireStandard66ValidationTimestepComparisonArtifactV1(
        JSON.stringify(fabricated),
      ),
    ).rejects.toThrow(/does not match the pure evaluator/);
  });

  it("rejects self-consistent source records with different construction identities", async () => {
    const artifact =
      await createMainWireStandard66ValidationTimestepComparisonArtifactV1(
        armArtifacts,
      );
    const fabricated = JSON.parse(
      await serializeMainWireStandard66ValidationTimestepComparisonArtifactV1(
        artifact,
      ),
    ) as Record<string, any>;
    fabricated.payload.sourceArms[0].constructionIdentityHash = "0".repeat(64);
    fabricated.payloadSha256 = await sha256CanonicalJsonHex(fabricated.payload);

    await expect(
      parseMainWireStandard66ValidationTimestepComparisonArtifactV1(
        JSON.stringify(fabricated),
      ),
    ).rejects.toThrow(/identical construction identity hashes/);
  });

  it("keeps standalone source references non-authoritative and strictly rebinds supplied runs", async () => {
    const artifact =
      await createMainWireStandard66ValidationTimestepComparisonArtifactV1(
        armArtifacts,
      );
    await expect(
      verifyMainWireStandard66ValidationTimestepComparisonArtifactAgainstSerializedRunsV1(
        artifact,
        [serializedArms[2], serializedArms[0], serializedArms[1]],
      ),
    ).resolves.toEqual(artifact);

    const detachedReferenceEdit = JSON.parse(
      await serializeMainWireStandard66ValidationTimestepComparisonArtifactV1(
        artifact,
      ),
    ) as Record<string, any>;
    detachedReferenceEdit.payload.sourceArms[0].runArtifactSha256 =
      "0123456789abcdef".repeat(4);
    detachedReferenceEdit.payloadSha256 = await sha256CanonicalJsonHex(
      detachedReferenceEdit.payload,
    );
    const standalone =
      await parseMainWireStandard66ValidationTimestepComparisonArtifactV1(
        JSON.stringify(detachedReferenceEdit),
      );
    expect(standalone.payload.claim).toMatchObject({
      standaloneParseReverifiesSourceArtifacts: false,
      sourceArtifactSha256ReferencesAreDigitalSignatures: false,
      strictSourceBindingRequiresSerializedRunArtifacts: true,
    });
    await expect(
      verifyMainWireStandard66ValidationTimestepComparisonArtifactAgainstSerializedRunsV1(
        standalone,
        serializedArms,
      ),
    ).rejects.toThrow(/does not match canonical recreation/);
  });

  it("makes evaluated gate failures explicit in comparison receipts", () => {
    expect(
      summarizeMainWireStandard66ValidationComparisonForReceiptV1({
        status: "pairwise-gates-evaluated",
        summary: {
          allPreregisteredPairwiseNumericalAgreementGatesPassed: false,
          gateEvaluationCount: 30,
          passedGateCount: 29,
          failedGateCount: 1,
        },
      }),
    ).toEqual({
      numericalAgreementEvaluated: true,
      allPreregisteredPairwiseNumericalAgreementGatesPassed: false,
      gateEvaluationCount: 30,
      passedGateCount: 29,
      failedGateCount: 1,
    });
  });

  it("parses all three source artifacts fail-closed and compares files through the CLI", async () => {
    const staleSource = JSON.parse(serializedArms[0]) as Record<string, any>;
    staleSource.payload.claim.causalAttributionClaimed = true;
    await expect(
      createMainWireStandard66ValidationTimestepComparisonArtifactFromSerializedRunsV1(
        [JSON.stringify(staleSource), serializedArms[1], serializedArms[2]],
      ),
    ).rejects.toThrow(/payload hash is invalid/);

    const directory = mkdtempSync(
      path.join(tmpdir(), "circleheart-standard66-dt-comparison-"),
    );
    try {
      const inputPaths = serializedArms.map((serialized, index) => {
        const inputPath = path.join(directory, `arm-${index}.json`);
        writeFileSync(inputPath, `${serialized}\n`, "utf8");
        return inputPath;
      }) as [string, string, string];
      const outputPath = path.join(directory, "comparison.json");
      const compareArgs = [
        "--input",
        inputPaths[2],
        "--input",
        inputPaths[0],
        "--input",
        inputPaths[1],
        "--output",
        outputPath,
      ] as const;
      const result =
        await compareMainWireStandard66ValidationArmArtifactsCliV1(compareArgs);

      expect(result.receipt).toMatchObject({
        comparisonStatus: "unavailable",
        numericalAgreementEvaluated: false,
        allPreregisteredPairwiseNumericalAgreementGatesPassed: null,
        gateEvaluationCount: null,
        passedGateCount: null,
        failedGateCount: null,
        outputPath,
      });
      expect(result.receipt.artifactSha256).toBe(
        await sha256CanonicalJsonHex(result.artifact),
      );
      expect(readFileSync(outputPath, "utf8")).toBe(`${result.serialized}\n`);
      await expect(
        parseMainWireStandard66ValidationTimestepComparisonArtifactV1(
          readFileSync(outputPath, "utf8"),
        ),
      ).resolves.toEqual(result.artifact);
      await expect(
        compareMainWireStandard66ValidationArmArtifactsCliV1(compareArgs),
      ).rejects.toThrow(/EEXIST/);
      expect(readFileSync(outputPath, "utf8")).toBe(`${result.serialized}\n`);
      await expect(
        compareMainWireStandard66ValidationArmArtifactsCliV1([
          ...compareArgs,
          "--force",
        ]),
      ).resolves.toMatchObject({
        receipt: { outputPath, numericalAgreementEvaluated: false },
      });
      await expect(
        compareMainWireStandard66ValidationArmArtifactsCliV1([
          ...compareArgs,
          "--force",
          "--force",
        ]),
      ).rejects.toThrow(/--force may be specified only once/);
      await expect(
        compareMainWireStandard66ValidationArmArtifactsCliV1([
          "--input",
          inputPaths[0],
          "--input",
          inputPaths[1],
          "--input",
          inputPaths[2],
          "--force",
        ]),
      ).rejects.toThrow(/--force requires --output/);
      await expect(
        compareMainWireStandard66ValidationArmArtifactsCliV1([
          "--input",
          inputPaths[0],
          "--input",
          inputPaths[1],
          "--input",
          inputPaths[2],
          "--output",
          inputPaths[0],
        ]),
      ).rejects.toThrow(/must not overwrite/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

async function wrapEnvelopeArmV1(
  caseId: "default" | `resolution-iv-${string}`,
  armResult: Awaited<ReturnType<typeof runMainWireStandard66ValidationArmV1>>,
): Promise<MainWireStandard66ValidationRunArtifactV1> {
  return createMainWireStandard66ValidationRunArtifactV1({
    study: { studyKind: "validation-envelope", caseId },
    armResult,
  });
}
