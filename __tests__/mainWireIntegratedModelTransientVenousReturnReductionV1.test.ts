import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_DECLARATION_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_ENGINEERING_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_SHA256_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_REPORT_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionDefinitionV1";
import {
  auditMainWireIntegratedModelTransientVenousReturnReductionReportV1,
  runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1,
  type MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1,
  type MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1,
  type MainWireIntegratedModelTransientVenousReturnReductionPayloadV1,
  type MainWireIntegratedModelTransientVenousReturnReductionReportV1,
  type MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1,
  type MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionEngineeringV1";
import {
  auditMainWireIntegratedModelTransientPvRawProjectionV1,
  auditMainWireIntegratedModelTransientPvComparisonV1,
  compareMainWireIntegratedModelTransientPvRelationsV1,
  mainWireIntegratedModelTransientVenousReturnBeatPhaseV1,
  mainWireIntegratedModelTransientVenousReturnResistanceScaleV1,
  projectMainWireIntegratedModelTransientPvBeatFamilyV1,
  type MainWireIntegratedModelTransientPvComparisonV1,
  type MainWireIntegratedModelTransientPvBeatProjectionV1,
  type MainWireIntegratedModelTransientPvRawBeatV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionPureV1";
import type { MainWireIntegratedModelPeriodicSteadyResultV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  parseAndAuditMainWireIntegratedModelTransientVenousReturnReductionArtifactV1,
  serializeMainWireIntegratedModelTransientVenousReturnReductionArtifactV1,
  writeMainWireIntegratedModelTransientVenousReturnReductionArtifactCreateOnlyV1,
} from "@/tools/scientific/MainWireIntegratedModelTransientVenousReturnReductionArtifactV1";

describe("transient systemic venous-return reduction Engineering V1", () => {
  it("binds the complete prospective protocol payload to one fixed digest", async () => {
    expect(
      await sha256CanonicalJsonHex(
        MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1,
      ),
    ).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_SHA256_V1,
    );
  });

  it("freezes one continuous reversible VC_RA schedule and exact beat phases", () => {
    expect(
      [0, 1, 9, 11, 19, 21].map(
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1,
      ),
    ).toEqual([1, 1, 8, 8, 1, 1]);
    expect(
      mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(5),
    ).toBeCloseTo(Math.sqrt(8), 14);
    expect(
      mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(15),
    ).toBeCloseTo(Math.sqrt(8), 14);
    expect(
      Array.from({ length: 21 }, (_, index) =>
        mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(index + 1),
      ),
    ).toEqual(
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1
        .intervention.beatPhases,
    );
    for (const [
      occlusion,
      release,
    ] of MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1
      .intervention.matchedRampBeatPairs) {
      expect(
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
          occlusion - 0.5,
        ),
      ).toBe(
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
          release - 0.5,
        ),
      );
    }
    expect(() =>
      mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(-1),
    ).toThrow(/\[0,21\]/);
    expect(() =>
      mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(22),
    ).toThrow(/1\.\.21/);
  });

  it("projects exact raw landmarks and 64-point transmural loops", async () => {
    const beats = manufacturedBeatFamilyV1();
    const projected =
      await projectMainWireIntegratedModelTransientPvBeatFamilyV1(beats);

    expect(projected).toHaveLength(21);
    expect(projected.map(({ phase }) => phase)).toEqual(
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1
        .intervention.beatPhases,
    );
    for (const beat of projected) {
      expect(beat.LV.compactLoop).toHaveLength(64);
      expect(beat.RV.compactLoop).toHaveLength(64);
      expect(beat.LV.compactLoop[0]!.phase01).toBe(0);
      expect(beat.LV.landmarks.semilunarClosure.source).toBe(
        "semilunar-zero-flow-crossing",
      );
      expect(beat.LV.landmarks.minimumVolume.source).toBe(
        "earliest-raw-minimum-volume",
      );
      expect(beat.LV.compactLoopSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(beat.payloadSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(beat.LV.landmarks.baselineAnchoredIsochronal.phase01).toBe(
        projected[0]!.LV.landmarks.baselineAnchoredIsochronal.phase01,
      );
      expect(beat.RV.landmarks.baselineAnchoredIsochronal.phase01).toBe(
        projected[0]!.RV.landmarks.baselineAnchoredIsochronal.phase01,
      );
    }
    expect(projected[0]!.LV.landmarks.semilunarClosure.phase01).toBeCloseTo(
      0.7,
      5,
    );
    expect(projected[0]!.LV.landmarks.minimumVolume.phase01).toBe(0.5);
  });

  it("builds method-specific occlusion/release relations and hysteresis", async () => {
    const projected =
      await projectMainWireIntegratedModelTransientPvBeatFamilyV1(
        manufacturedBeatFamilyV1(),
      );
    const comparison =
      await compareMainWireIntegratedModelTransientPvRelationsV1(projected);

    expect(comparison.linearRelations).toHaveLength(12);
    expect(comparison.supportEnvelopes).toHaveLength(4);
    expect(comparison.hysteresisPairs).toHaveLength(64);
    expect(comparison.directionFitDifferences).toHaveLength(8);
    expect(comparison.payloadSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(
      new TextEncoder().encode(canonicalJsonStringify(comparison)).byteLength,
    ).toBeLessThan(400 * 1024);
    expect(
      await auditMainWireIntegratedModelTransientPvComparisonV1(comparison),
    ).toEqual({
      auditorId: "main-wire-integrated-model-transient-pv-relation-auditor-v1",
      status: "comparison-audit-passed",
      firstMismatchPath: null,
    });
    for (const envelope of comparison.supportEnvelopes) {
      expect(envelope.maximumSampledLoopPenetrationMmHg).toBeLessThan(1e-10);
      expect(envelope.contacts).toHaveLength(11);
      for (const beat of projected.filter((candidate) =>
        envelope.directionId === "occlusion"
          ? candidate.beatOrdinal <= 11
          : candidate.beatOrdinal >= 11,
      )) {
        for (const point of beat[envelope.ventricleId].compactLoop) {
          expect(
            envelope.elastanceMmHgPerMl * point.volumeMl +
              envelope.interceptMmHg,
          ).toBeGreaterThanOrEqual(point.transmuralPressureMmHg - 1e-10);
        }
      }
    }
    expect(
      comparison.linearRelations.every(({ pointCount }) => pointCount === 11),
    ).toBe(true);
    expect(
      comparison.hysteresisPairs.some(
        ({ releaseMinusOcclusionVolumeMl }) =>
          Math.abs(releaseMinusOcclusionVolumeMl) > 0,
      ),
    ).toBe(true);
  });

  it("rejects coordinated relation tampering after outer reseal", async () => {
    const projected =
      await projectMainWireIntegratedModelTransientPvBeatFamilyV1(
        manufacturedBeatFamilyV1(),
      );
    const comparison =
      await compareMainWireIntegratedModelTransientPvRelationsV1(projected);
    const alteredRelations = comparison.linearRelations.map(
      (relation, index) =>
        index === 0
          ? { ...relation, interceptMmHg: relation.interceptMmHg + 1 }
          : relation,
    );
    const withoutHash = {
      ...comparison,
      linearRelations: alteredRelations,
    };
    const tampered = {
      ...withoutHash,
      payloadSha256: await sha256CanonicalJsonHex(
        omitComparisonHashV1(withoutHash),
      ),
    } as MainWireIntegratedModelTransientPvComparisonV1;

    expect(
      await auditMainWireIntegratedModelTransientPvComparisonV1(tampered),
    ).toMatchObject({
      status: "comparison-audit-failed",
      firstMismatchPath: "linearRelations",
    });
  });

  it("fails closed when a semilunar positive-flow or closure event is absent", async () => {
    const noClosure = manufacturedBeatFamilyV1().map((beat, index) =>
      index === 4
        ? {
            ...beat,
            samples: beat.samples.map((sample) => ({
              ...sample,
              LV: { ...sample.LV, semilunarFlowMlPerSec: 1 },
            })),
          }
        : beat,
    );
    await expect(
      projectMainWireIntegratedModelTransientPvBeatFamilyV1(noClosure),
    ).rejects.toThrow(/lacks semilunar closure/);

    const noPositive = manufacturedBeatFamilyV1().map((beat, index) =>
      index === 8
        ? {
            ...beat,
            samples: beat.samples.map((sample) => ({
              ...sample,
              RV: { ...sample.RV, semilunarFlowMlPerSec: 0 },
            })),
          }
        : beat,
    );
    await expect(
      projectMainWireIntegratedModelTransientPvBeatFamilyV1(noPositive),
    ).rejects.toThrow(/lacks positive semilunar flow/);
  });

  it("rejects finite raw endpoints whose derived interpolation overflows", async () => {
    const overflow = manufacturedBeatFamilyV1().map((beat, beatIndex) =>
      beatIndex === 0
        ? {
            ...beat,
            samples: beat.samples.map((sample, sampleIndex) =>
              sampleIndex === 1
                ? {
                    ...sample,
                    timeSec: 0.01,
                    LV: { ...sample.LV, volumeMl: Number.MAX_VALUE },
                  }
                : sampleIndex === 2
                  ? {
                      ...sample,
                      timeSec: 0.02,
                      LV: { ...sample.LV, volumeMl: -Number.MAX_VALUE },
                    }
                  : sample,
            ),
          }
        : beat,
    );

    await expect(
      projectMainWireIntegratedModelTransientPvBeatFamilyV1(overflow),
    ).rejects.toThrow(/interpolation overflowed/);
  });

  it("keeps all official, ESPVR, PVA and public claims machine-readably false", () => {
    expect(
      Object.values(
        MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1,
      ),
    ).toEqual(Array(22).fill(false));
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1,
    ).toMatchObject({
      officialQualificationEstablished: false,
      independentPeriodicOrbitPerBeatEstablished: false,
      selectedEspvrMethodEstablished: false,
      pvaEstablished: false,
      publicCatalogEligibilityEstablished: false,
    });
  });

  it("retains an audited source-execution failure and enforces create-only canonical artifacts", async () => {
    const report = await manufacturedSourceFailureReportV1();
    expect(
      await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
        report,
      ),
    ).toMatchObject({
      status: "report-audit-passed",
      firstMismatchPath: null,
      reportShapePassed: true,
      payloadHashPassed: true,
    });
    const serialized =
      await serializeMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
        report,
      );
    expect(serialized.endsWith("\n")).toBe(true);
    await expect(
      parseAndAuditMainWireIntegratedModelTransientVenousReturnReductionArtifactV1(
        `${serialized}\n`,
      ),
    ).rejects.toThrow(/not canonical JSON/);

    const directory = mkdtempSync(join(tmpdir(), "transient-vr-v1-"));
    const outputPath = join(directory, "artifact.json");
    try {
      await expect(
        writeMainWireIntegratedModelTransientVenousReturnReductionArtifactCreateOnlyV1(
          outputPath,
          report,
        ),
      ).resolves.toMatchObject({ sizeBytes: serialized.length });
      await expect(
        writeMainWireIntegratedModelTransientVenousReturnReductionArtifactCreateOnlyV1(
          outputPath,
          report,
        ),
      ).rejects.toThrow(/already exists/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }

    const extraField = {
      ...report,
      injectedQualificationClaim: true,
    } as unknown as MainWireIntegratedModelTransientVenousReturnReductionReportV1;
    expect(
      await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
        extraField,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      firstMismatchPath: "reportShapePassed",
      reportShapePassed: false,
    });
  });

  it("rejects a coordinated reseal that omits the required failure arm", async () => {
    const report = await manufacturedSourceFailureReportV1();
    const payload = Object.freeze({
      ...report.payload,
      failureEvidence: null,
      assessment: Object.freeze({
        ...report.payload.assessment,
        firstFailureClass: null,
      }),
    }) satisfies MainWireIntegratedModelTransientVenousReturnReductionPayloadV1;
    const tampered = Object.freeze({
      payload,
      payloadSha256: await sha256CanonicalJsonHex(payload),
    });

    expect(
      await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
        tampered,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      firstMismatchPath: "failureOutcomeReplayPassed",
      failureOutcomeReplayPassed: false,
      assessmentReplayPassed: true,
      payloadHashPassed: true,
    });
  });

  it("runs the fixed 21-beat pipeline through a manufactured nonqualified seam", async () => {
    const fixture = await manufacturedPipelineFixtureV1();
    const outcome =
      await runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1(
        {
          implementationCommitSha: "2".repeat(40),
          dependencies: fixture.dependencies,
        },
      );

    expect(outcome).toMatchObject({
      qualificationScope: "manufactured-non-qualified",
      fixedOwnerArtifactEligible: false,
    });
    expect(outcome.report.payload.beatExecutions).toHaveLength(21);
    expect(outcome.report.payload.producerProjectionAudit).toMatchObject({
      status: "raw-projection-audit-passed",
      firstMismatchPath: null,
    });
    expect(outcome.report.payload.assessment).toMatchObject({
      sourceP1Established: true,
      allTwentyOneBeatsCompleted: true,
      rawProjectionProducerReplayPassed: true,
      transientVenousReturnReductionCharacterizationCompleted: true,
    });
    expect(
      await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
        outcome.report,
      ),
    ).toMatchObject({ status: "report-audit-passed" });
    expect(
      new TextEncoder().encode(canonicalJsonStringify(outcome.report) + "\n")
        .byteLength,
    ).toBeLessThan(524_288);
  });

  it("retains source execution, non-P1, and each binding-failure arm", async () => {
    const base = await manufacturedPipelineFixtureV1();
    const executionFailure =
      await runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1(
        {
          implementationCommitSha: "3".repeat(40),
          dependencies: Object.freeze({
            ...base.dependencies,
            runSource: async () => {
              throw new Error("manufactured source execution failure");
            },
          }),
        },
      );
    expect(executionFailure.report.payload.failureEvidence?.failureClass).toBe(
      "source-execution-failure",
    );
    expect(
      await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
        executionFailure.report,
      ),
    ).toMatchObject({ status: "report-audit-passed" });

    const nonP1Summary = manufacturedNonP1SourceSummaryV1(base.summary);
    const nonP1 = await runManufacturedWithSourceAndBindingV1(
      base,
      manufacturedPeriodicSourceV1(nonP1Summary),
      null,
    );
    expect(nonP1.payload.failureEvidence?.failureClass).toBe("source-not-p1");
    expect(
      await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
        nonP1,
      ),
    ).toMatchObject({ status: "report-audit-passed" });

    const bindingVariants = [
      {
        id: "condition",
        summary: Object.freeze({
          ...base.summary,
          modelConditionIdentityHash: "0".repeat(64),
        }),
        overrides: {
          conditionIdentityMatched: false,
          restoreAttempted: false,
        },
      },
      {
        id: "protocol",
        summary: Object.freeze({
          ...base.summary,
          protocolIdentityHash: "0".repeat(64),
          period1ClassifierInputs: Object.freeze(
            base.summary.period1ClassifierInputs.map((input) =>
              Object.freeze({ ...input, protocolIdentityHash: "0".repeat(64) }),
            ),
          ),
        }),
        overrides: {
          protocolIdentityMatched: false,
          restoreAttempted: false,
        },
      },
      {
        id: "checkpoint-format",
        summary: Object.freeze({
          ...base.summary,
          terminalCheckpointSha256: "malformed-checkpoint-sha",
        }),
        overrides: {
          checkpointIdentityFormatValid: false,
          restoreAttempted: false,
        },
      },
      {
        id: "restore-exception",
        summary: base.summary,
        overrides: {
          restoreAttempted: true,
          restoreException: Object.freeze({
            name: "ManufacturedRestoreFailure",
            message: "checkpoint restore failed",
          }),
        },
      },
      {
        id: "round-trip-sha",
        summary: base.summary,
        overrides: { roundTripCheckpointSha256: "0".repeat(64) },
      },
      {
        id: "restored-time",
        summary: base.summary,
        overrides: {
          restoredAcceptedTimeSec: base.summary.terminalAcceptedTimeSec + 1,
        },
      },
      {
        id: "restored-revision",
        summary: base.summary,
        overrides: {
          restoredAcceptedRevision: base.summary.terminalAcceptedRevision + 1,
        },
      },
      {
        id: "restored-window",
        summary: base.summary,
        overrides: {
          restoredCoronaryWindowIndex: base.summary.terminalCycleIndex + 1,
        },
      },
    ] as const;
    for (const variant of bindingVariants) {
      const diagnostics = manufacturedBindingDiagnosticsV1(
        variant.summary,
        variant.overrides,
      );
      const report = await runManufacturedWithSourceAndBindingV1(
        base,
        manufacturedPeriodicSourceV1(variant.summary),
        diagnostics,
      );
      expect(report.payload.sourceOutcome).toMatchObject({
        status: "source-rejected",
        failureClass: "source-binding-failure",
      });
      expect(report.payload.beatExecutions).toEqual([]);
      expect(report.payload.sourceOutcome.bindingDiagnostics).toMatchObject({
        checkpointExactRestoreMatched: false,
        sourceBindingsMatched: false,
      });
      expect(
        await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
          report,
        ),
        variant.id,
      ).toMatchObject({ status: "report-audit-passed" });
    }
  });

  it("retains trajectory, cycle, projection, relation, and auditor failures", async () => {
    const base = await manufacturedPipelineFixtureV1();
    const sourceTimeSec = base.summary.terminalAcceptedTimeSec;
    const sourceRevision = base.summary.terminalAcceptedRevision;
    const trajectoryFailure = Object.freeze({
      beatExecutions: Object.freeze([]),
      rawBeats: Object.freeze([]),
      failureEvidence: manufacturedFailureEvidenceV1({
        failureClass: "trajectory-step-failure",
        failedBeatOrdinal: 1,
        lastAcceptedTimeSec: sourceTimeSec,
        lastAcceptedRevision: sourceRevision,
        message: "manufactured trajectory failure",
      }),
    });
    const failedBeat = Object.freeze({
      ...base.trajectory.beatExecutions[0]!,
      maximumGlobalTotalBloodVolumeErrorMl: 1,
      integrityPassed: false,
    });
    const cycleFailure = Object.freeze({
      beatExecutions: Object.freeze([failedBeat]),
      rawBeats: Object.freeze([base.trajectory.rawBeats[0]!]),
      failureEvidence: manufacturedFailureEvidenceV1({
        failureClass: "cycle-integrity-failure",
        failedBeatOrdinal: 1,
        lastAcceptedTimeSec: failedBeat.endTimeSec,
        lastAcceptedRevision: failedBeat.terminalAcceptedRevision,
        completedBeatCount: 1,
        message: "manufactured cycle integrity failure",
      }),
    });
    const variants = [
      {
        expected: "trajectory-step-failure",
        overrides: {
          runTransientTrajectory: async () => trajectoryFailure,
        },
      },
      {
        expected: "cycle-integrity-failure",
        overrides: { runTransientTrajectory: async () => cycleFailure },
      },
      {
        expected: "landmark-unavailable",
        overrides: {
          projectBeatFamily: async () => {
            throw new Error("manufactured landmark failure");
          },
        },
      },
      {
        expected: "landmark-unavailable",
        overrides: {
          auditRawProjection: async () => {
            throw new Error("manufactured raw projection auditor failure");
          },
        },
      },
      {
        expected: "relation-integrity-failure",
        overrides: {
          compareRelations: async () => {
            throw new Error("manufactured relation failure");
          },
        },
      },
      {
        expected: "relation-integrity-failure",
        overrides: {
          auditComparison: async () => {
            throw new Error("manufactured auditor failure");
          },
        },
      },
    ] as const;
    for (const variant of variants) {
      const outcome =
        await runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1(
          {
            implementationCommitSha: "4".repeat(40),
            dependencies: Object.freeze({
              ...base.dependencies,
              ...variant.overrides,
            }) as MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1,
          },
        );
      expect(outcome.report.payload.failureEvidence?.failureClass).toBe(
        variant.expected,
      );
      expect(
        await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
          outcome.report,
        ),
        variant.expected,
      ).toMatchObject({ status: "report-audit-passed" });
    }
  });

  it("rejects raw-to-projection tamper before relation construction", async () => {
    const base = await manufacturedPipelineFixtureV1();
    const outcome =
      await runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1(
        {
          implementationCommitSha: "5".repeat(40),
          dependencies: Object.freeze({
            ...base.dependencies,
            projectBeatFamily: async (rawBeats) =>
              tamperedProjectionFamilyV1(
                await projectMainWireIntegratedModelTransientPvBeatFamilyV1(
                  rawBeats,
                ),
              ),
          }),
        },
      );
    expect(outcome.report.payload).toMatchObject({
      comparison: null,
      comparisonAudit: null,
      producerProjectionAudit: {
        status: "raw-projection-audit-failed",
        firstMismatchPath: "beatProjections[0]",
      },
      failureEvidence: { failureClass: "landmark-unavailable" },
    });
    expect(
      await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
        outcome.report,
      ),
    ).toMatchObject({ status: "report-audit-passed" });
  });

  it("rejects coordinated compact-loop shape and phase reseals", async () => {
    const base = await manufacturedPipelineFixtureV1();
    const outcome =
      await runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1(
        {
          implementationCommitSha: "8".repeat(40),
          dependencies: base.dependencies,
        },
      );
    for (const tamper of ["extra-field", "phase"] as const) {
      const report = await coordinatedCompactLoopTamperReportV1(
        outcome.report,
        tamper,
      );
      expect(
        await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
          report,
        ),
        tamper,
      ).toMatchObject({
        status: "report-audit-failed",
        producerProjectionAuditReplayPassed: true,
        comparisonReplayPassed: false,
        payloadHashPassed: true,
      });
    }
  });

  it("rejects shifted source lineage, negative residuals, scale escape, and repeated event IDs", async () => {
    const base = await manufacturedPipelineFixtureV1();
    const outcome =
      await runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1(
        {
          implementationCommitSha: "6".repeat(40),
          dependencies: base.dependencies,
        },
      );
    const shifted = await coordinatedShiftReportV1(outcome.report, 1, 100);
    expect(
      await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
        shifted,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      beatExecutionReplayPassed: false,
      producerProjectionAuditReplayPassed: true,
      comparisonReplayPassed: true,
      failureOutcomeReplayPassed: true,
      assessmentReplayPassed: true,
      payloadHashPassed: true,
    });
    const cases = [
      outcome.report.payload.beatExecutions.map((beat, index) =>
        index === 0
          ? Object.freeze({
              ...beat,
              maximumGlobalTotalBloodVolumeErrorMl: -1,
            })
          : beat,
      ),
      outcome.report.payload.beatExecutions.map((beat, index) =>
        index === 0
          ? Object.freeze({
              ...beat,
              resistanceScale: Object.freeze({
                ...beat.resistanceScale,
                maximumAcceptedCandidate: 2,
              }),
            })
          : beat,
      ),
      outcome.report.payload.beatExecutions.map((beat, index, beats) =>
        index === 1
          ? Object.freeze({
              ...beat,
              acceptedAtrialCaptureIds: beats[0]!.acceptedAtrialCaptureIds,
            })
          : beat,
      ),
    ];
    for (const beatExecutions of cases) {
      const payload = Object.freeze({
        ...outcome.report.payload,
        beatExecutions: Object.freeze(beatExecutions),
      }) satisfies MainWireIntegratedModelTransientVenousReturnReductionPayloadV1;
      const tampered = Object.freeze({
        payload,
        payloadSha256: await sha256CanonicalJsonHex(payload),
      });
      expect(
        await auditMainWireIntegratedModelTransientVenousReturnReductionReportV1(
          tampered,
        ),
      ).toMatchObject({
        status: "report-audit-failed",
        beatExecutionReplayPassed: false,
      });
    }
  });
});

function manufacturedBeatFamilyV1(
  sourceTimeSec = 0,
): readonly MainWireIntegratedModelTransientPvRawBeatV1[] {
  return Object.freeze(
    Array.from({ length: 21 }, (_, beatIndex) => {
      const beatOrdinal = beatIndex + 1;
      const midpointScale =
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
          beatOrdinal - 0.5,
        );
      const occlusionLoad = Math.log2(midpointScale);
      const releaseOffset = beatOrdinal >= 12 && beatOrdinal <= 19 ? 0.35 : 0;
      const samples = Object.freeze(
        Array.from({ length: 129 }, (_, sampleIndex) => {
          const phase = sampleIndex / 128;
          const timeSec = sourceTimeSec + beatIndex + phase;
          return Object.freeze({
            timeSec,
            LV: manufacturedVentricleSampleV1(
              phase,
              118 - 3.5 * occlusionLoad + releaseOffset,
              10 + 2.2 * occlusionLoad + 0.8 * releaseOffset,
              1,
            ),
            RV: manufacturedVentricleSampleV1(
              phase,
              108 - 2.4 * occlusionLoad + 0.7 * releaseOffset,
              5 + 1.4 * occlusionLoad + 0.5 * releaseOffset,
              0.72,
            ),
          });
        }),
      );
      return Object.freeze({
        beatOrdinal,
        startTimeSec: sourceTimeSec + beatIndex,
        endTimeSec: sourceTimeSec + beatIndex + 1,
        samples,
      });
    }),
  );
}

function manufacturedVentricleSampleV1(
  phase: number,
  centerVolumeMl: number,
  pressureOffsetMmHg: number,
  scale: number,
) {
  const volumeMl = centerVolumeMl + 12 * scale * Math.cos(2 * Math.PI * phase);
  const systolic = Math.max(0, Math.sin(Math.PI * phase));
  const transmuralPressureMmHg =
    pressureOffsetMmHg + 70 * scale * systolic * systolic;
  return Object.freeze({
    volumeMl,
    transmuralPressureMmHg,
    absolutePressureMmHg: transmuralPressureMmHg + 3,
    semilunarFlowMlPerSec: 80 * scale * Math.sin(2 * Math.PI * (phase - 0.2)),
  });
}

function omitComparisonHashV1(
  value: Omit<MainWireIntegratedModelTransientPvComparisonV1, "payloadSha256"> &
    Partial<
      Pick<MainWireIntegratedModelTransientPvComparisonV1, "payloadSha256">
    >,
) {
  const { payloadSha256: _payloadSha256, ...body } = value;
  return body;
}

async function manufacturedSourceFailureReportV1(): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportV1> {
  const payload = Object.freeze({
    reportSchemaId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_REPORT_V1_ID,
    characterizationOwnerId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_ENGINEERING_V1_ID,
    declaration:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_DECLARATION_V1,
    implementationCommitSha: "1".repeat(40),
    protocolPayload:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1,
    protocolPayloadSha256:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_SHA256_V1,
    sourceOutcome: Object.freeze({
      status: "source-execution-failed" as const,
      failureClass: "source-execution-failure" as const,
      summary: null,
      bindingDiagnostics: null,
      exception: Object.freeze({
        name: "SyntheticSourceFailure",
        message: "manufactured source failure",
      }),
    }),
    beatExecutions: Object.freeze([]),
    producerProjectionAudit: null,
    comparison: null,
    comparisonAudit: null,
    failureEvidence: Object.freeze({
      failureClass: "source-execution-failure" as const,
      failedBeatOrdinal: null,
      lastAcceptedTimeSec: null,
      lastAcceptedRevision: null,
      failedCandidateTimeSec: null,
      failedCandidateResistanceScale: null,
      completedBeatCount: 0,
      message: "manufactured source failure",
      exception: Object.freeze({
        name: "SyntheticSourceFailure",
        message: "manufactured source failure",
      }),
    }),
    assessment: Object.freeze({
      sourceP1Established: false,
      sourceBindingsReplayed: false,
      exactSequentialBeatSetRetained: true,
      allTwentyOneBeatsCompleted: false,
      allBeatIntegrityGatesPassed: false,
      rawProjectionProducerReplayPassed: false,
      compactLoopAndLandmarkProjectionCompleted: false,
      relationAndHysteresisIndependentReplayPassed: false,
      transientVenousReturnReductionCharacterizationCompleted: false,
      firstFailureClass: "source-execution-failure" as const,
      methodAgreementIsQualificationGate: false as const,
      positiveSlopeIsQualificationGate: false as const,
      hysteresisMagnitudeIsQualificationGate: false as const,
    }),
    negativeClaims:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_NEGATIVE_CLAIMS_V1,
  }) satisfies MainWireIntegratedModelTransientVenousReturnReductionPayloadV1;
  return Object.freeze({
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

async function manufacturedPipelineFixtureV1() {
  const summary = committedPeriodicSourceSummaryV1();
  const source = manufacturedPeriodicSourceV1(summary);
  const trajectory = await manufacturedCompletedTrajectoryV1(summary);
  const successfulDiagnostics = manufacturedBindingDiagnosticsV1(summary, {});
  const dependencies = Object.freeze({
    runSource: async () => source,
    createFixture: (() =>
      Object.freeze(
        {},
      )) as unknown as MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1["createFixture"],
    bindAndRestoreSource: (async () =>
      Object.freeze({
        status: "bound" as const,
        restoredState: Object.freeze({}),
        diagnostics: successfulDiagnostics,
      })) as unknown as MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1["bindAndRestoreSource"],
    runTransientTrajectory: (async () =>
      trajectory) as unknown as MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1["runTransientTrajectory"],
    projectBeatFamily: projectMainWireIntegratedModelTransientPvBeatFamilyV1,
    auditRawProjection: auditMainWireIntegratedModelTransientPvRawProjectionV1,
    compareRelations: compareMainWireIntegratedModelTransientPvRelationsV1,
    auditComparison: auditMainWireIntegratedModelTransientPvComparisonV1,
  }) satisfies MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1;
  return Object.freeze({ summary, source, trajectory, dependencies });
}

function committedPeriodicSourceSummaryV1(): MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1 {
  const artifactPath = join(
    process.cwd(),
    "artifacts/mechanical-port-ledger/periodic-five-wall-mechanical-port-ledger-dt-characterization-v1.json",
  );
  const parsed = JSON.parse(readFileSync(artifactPath, "utf8")) as {
    payload: {
      sourceOutcome: {
        summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1;
      };
    };
  };
  return parsed.payload.sourceOutcome.summary;
}

function manufacturedPeriodicSourceV1(
  summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
): MainWireIntegratedModelPeriodicSteadyResultV3 {
  const observations = summary.period1ClassifierInputs.map((input, index) => {
    const terminal = index === summary.period1ClassifierInputs.length - 1;
    const period1 = terminal
      ? summary.terminalPeriod1Closure
      : Object.freeze({
          ...summary.terminalPeriod1Closure,
          overall: Object.freeze({
            ...summary.terminalPeriod1Closure.overall,
            maximumNormalizedDelta: input.period1MaximumNormalizedDelta,
          }),
        });
    const period2 =
      input.period2MaximumNormalizedDelta === null
        ? null
        : Object.freeze({
            ...summary.terminalPeriod1Closure,
            overall: Object.freeze({
              ...summary.terminalPeriod1Closure.overall,
              maximumNormalizedDelta: input.period2MaximumNormalizedDelta,
            }),
          });
    return Object.freeze({
      cycleIndex: input.cycleIndex,
      evidenceRole: input.evidenceRole,
      protocolIdentityHash: input.protocolIdentityHash,
      period1,
      period2,
    });
  });
  return Object.freeze({
    experimentId: summary.experimentId,
    executionPurpose: summary.executionPurpose,
    protocolIdentityHash: summary.protocolIdentityHash,
    modelConditionIdentityHash: summary.modelConditionIdentityHash,
    nominalDtSec: summary.nominalDtSec,
    requestedMaximumCycleCount: summary.requestedMaximumCycleCount,
    completedCycleCount: summary.completedCycleCount,
    terminationReason: summary.terminationReason,
    classification: summary.classification,
    numericalPeriod1Established: summary.numericalPeriod1Established,
    allCyclesFiniteConservedAndEventExact:
      summary.allCyclesFiniteConservedAndEventExact,
    cycles: Object.freeze([
      Object.freeze({
        cycleIndex: summary.terminalCycleIndex,
        period1: summary.terminalPeriod1Closure,
      }),
    ]),
    observations: Object.freeze(observations),
    terminalCycleTrace: Object.freeze({
      cycleIndex: summary.terminalCycleIndex,
    }),
    terminalAcceptedState: Object.freeze({
      acceptedTimeSec: summary.terminalAcceptedTimeSec,
      revision: summary.terminalAcceptedRevision,
    }),
    terminalCheckpoint: Object.freeze({
      checkpointSha256: summary.terminalCheckpointSha256,
    }),
    terminalCheckpointExactRoundTripVerified:
      summary.terminalCheckpointExactRoundTripVerified,
  }) as unknown as MainWireIntegratedModelPeriodicSteadyResultV3;
}

function manufacturedNonP1SourceSummaryV1(
  source: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
): MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1 {
  const maximumNormalizedDelta = 0.01;
  const inputs = Object.freeze(
    source.period1ClassifierInputs.map((input) =>
      Object.freeze({
        ...input,
        period1MaximumNormalizedDelta: maximumNormalizedDelta,
        period2MaximumNormalizedDelta: null,
      }),
    ),
  );
  return Object.freeze({
    ...source,
    terminationReason: "maximum-cycles-reached" as const,
    classification: Object.freeze({
      ...source.classification,
      status: "not-converged" as const,
      evidenceCycleIndices: Object.freeze([]),
      latestPeriod1MaximumNormalizedDelta: maximumNormalizedDelta,
      latestPeriod2MaximumNormalizedDelta: null,
    }),
    numericalPeriod1Established: false,
    period1ClassifierInputs: inputs,
    terminalPeriod1Closure: Object.freeze({
      ...source.terminalPeriod1Closure,
      overall: Object.freeze({
        ...source.terminalPeriod1Closure.overall,
        maximumNormalizedDelta,
      }),
    }),
  });
}

function manufacturedBindingDiagnosticsV1(
  summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
  overrides: Partial<
    Pick<
      MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1,
      | "conditionIdentityMatched"
      | "protocolIdentityMatched"
      | "checkpointIdentityFormatValid"
      | "restoreAttempted"
      | "roundTripCheckpointSha256"
      | "restoredAcceptedTimeSec"
      | "restoredAcceptedRevision"
      | "restoredCoronaryWindowIndex"
      | "restoreException"
    >
  >,
): MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1 {
  const conditionIdentityMatched = overrides.conditionIdentityMatched ?? true;
  const protocolIdentityMatched = overrides.protocolIdentityMatched ?? true;
  const checkpointIdentityFormatValid =
    overrides.checkpointIdentityFormatValid ?? true;
  const restoreAttempted = overrides.restoreAttempted ?? true;
  const restoreException = overrides.restoreException ?? null;
  const retainedRestoreValues = restoreAttempted && restoreException === null;
  const roundTripCheckpointSha256 =
    overrides.roundTripCheckpointSha256 ??
    (retainedRestoreValues ? summary.terminalCheckpointSha256 : null);
  const restoredAcceptedTimeSec =
    overrides.restoredAcceptedTimeSec ??
    (retainedRestoreValues ? summary.terminalAcceptedTimeSec : null);
  const restoredAcceptedRevision =
    overrides.restoredAcceptedRevision ??
    (retainedRestoreValues ? summary.terminalAcceptedRevision : null);
  const restoredCoronaryWindowIndex =
    overrides.restoredCoronaryWindowIndex ??
    (retainedRestoreValues ? summary.terminalCycleIndex : null);
  const checkpointExactRestoreMatched =
    restoreAttempted &&
    restoreException === null &&
    roundTripCheckpointSha256 === summary.terminalCheckpointSha256 &&
    restoredAcceptedTimeSec === summary.terminalAcceptedTimeSec &&
    restoredAcceptedRevision === summary.terminalAcceptedRevision &&
    restoredCoronaryWindowIndex === summary.terminalCycleIndex;
  return Object.freeze({
    conditionIdentityMatched,
    protocolIdentityMatched,
    checkpointIdentityFormatValid,
    restoreAttempted,
    roundTripCheckpointSha256,
    restoredAcceptedTimeSec,
    restoredAcceptedRevision,
    restoredCoronaryWindowIndex,
    restoreException,
    checkpointExactRestoreMatched,
    sourceBindingsMatched:
      conditionIdentityMatched &&
      protocolIdentityMatched &&
      checkpointIdentityFormatValid &&
      checkpointExactRestoreMatched,
  });
}

async function manufacturedCompletedTrajectoryV1(
  summary: MainWireIntegratedModelTransientVenousReturnReductionSourceSummaryV1,
) {
  const rawBeats = manufacturedBeatFamilyV1(summary.terminalAcceptedTimeSec);
  const beatExecutions: MainWireIntegratedModelTransientVenousReturnReductionBeatExecutionV1[] =
    [];
  let revision = summary.terminalAcceptedRevision;
  for (const rawBeat of rawBeats) {
    const acceptedStepCount = rawBeat.samples.length - 1;
    const startAcceptedRevision = revision;
    revision += acceptedStepCount;
    const candidateScales = rawBeat.samples
      .slice(1)
      .map((sample) =>
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
          sample.timeSec - summary.terminalAcceptedTimeSec,
        ),
      );
    const beatOrdinal = rawBeat.beatOrdinal;
    beatExecutions.push(
      Object.freeze({
        beatOrdinal,
        phase:
          mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(beatOrdinal),
        startTimeSec: rawBeat.startTimeSec,
        endTimeSec: rawBeat.endTimeSec,
        startAcceptedRevision,
        terminalAcceptedRevision: revision,
        acceptedStepCount,
        boundaryClippedStepCount: 0,
        resistanceScale: Object.freeze({
          start: mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
            beatOrdinal - 1,
          ),
          midpoint:
            mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
              beatOrdinal - 0.5,
            ),
          end: mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
            beatOrdinal,
          ),
          minimumAcceptedCandidate: Math.min(...candidateScales),
          maximumAcceptedCandidate: Math.max(...candidateScales),
        }),
        fixedGlobalTotalBloodVolumeMl: 5000,
        maximumGlobalTotalBloodVolumeErrorMl: 0,
        maximumCoronaryBloodVolumeLedgerResidualMl: 0,
        maximumDynamicMcsConservationResidualMlPerSec: 0,
        acceptedAtrialCaptureIds: Object.freeze([`atrial-${beatOrdinal}`]),
        acceptedVentricularCaptureIds: Object.freeze([
          `ventricular-${beatOrdinal}`,
        ]),
        deliveredCalciumDepositIds: Object.freeze([
          `calcium-${beatOrdinal}-0`,
          `calcium-${beatOrdinal}-1`,
        ]),
        completedCoronaryWindowIndices: Object.freeze([
          summary.terminalCycleIndex + beatOrdinal - 1,
        ]),
        oneComposedCalciumOwnerOnly: true,
        allDynamicMcsAcceptedFlowsExactlyZero: true,
        allRawValuesFinite: true,
        minimumSystemicVenousReturnMlPerSec: 10,
        maximumSystemicVenousReturnMlPerSec: 20,
        integrityPassed: true,
        rawAcceptedSampleCount: rawBeat.samples.length,
        rawAcceptedSamplesSha256: await sha256CanonicalJsonHex(rawBeat.samples),
      }),
    );
  }
  return Object.freeze({
    beatExecutions: Object.freeze(beatExecutions),
    rawBeats,
    terminalAcceptedTimeSec: summary.terminalAcceptedTimeSec + 21,
    terminalAcceptedRevision: revision,
  });
}

async function runManufacturedWithSourceAndBindingV1(
  base: Awaited<ReturnType<typeof manufacturedPipelineFixtureV1>>,
  source: MainWireIntegratedModelPeriodicSteadyResultV3,
  diagnostics: MainWireIntegratedModelTransientVenousReturnReductionSourceBindingDiagnosticsV1 | null,
) {
  const dependencies = Object.freeze({
    ...base.dependencies,
    runSource: async () => source,
    bindAndRestoreSource: (async () => {
      if (diagnostics === null) {
        throw new Error("binding must not run for a non-P1 source");
      }
      return Object.freeze({
        status: "binding-failed" as const,
        message: "manufactured source binding failure",
        diagnostics,
      });
    }) as unknown as MainWireIntegratedModelTransientVenousReturnReductionManufacturedDependenciesV1["bindAndRestoreSource"],
  });
  const outcome =
    await runMainWireIntegratedModelTransientVenousReturnReductionManufacturedV1(
      {
        implementationCommitSha: "7".repeat(40),
        dependencies,
      },
    );
  return outcome.report;
}

function manufacturedFailureEvidenceV1(
  input: Readonly<{
    failureClass: "trajectory-step-failure" | "cycle-integrity-failure";
    failedBeatOrdinal: number;
    lastAcceptedTimeSec: number;
    lastAcceptedRevision: number;
    completedBeatCount?: number;
    message: string;
  }>,
) {
  return Object.freeze({
    failureClass: input.failureClass,
    failedBeatOrdinal: input.failedBeatOrdinal,
    lastAcceptedTimeSec: input.lastAcceptedTimeSec,
    lastAcceptedRevision: input.lastAcceptedRevision,
    failedCandidateTimeSec: null,
    failedCandidateResistanceScale: null,
    completedBeatCount: input.completedBeatCount ?? 0,
    message: input.message,
    exception: null,
  });
}

async function tamperedProjectionFamilyV1(
  projections: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
): Promise<readonly MainWireIntegratedModelTransientPvBeatProjectionV1[]> {
  const first = projections[0]!;
  const compactLoop = Object.freeze(
    first.LV.compactLoop.map((point, index) =>
      index === 0
        ? Object.freeze({ ...point, volumeMl: point.volumeMl + 1 })
        : point,
    ),
  );
  const LV = Object.freeze({
    ...first.LV,
    compactLoop,
    compactLoopSha256: await sha256CanonicalJsonHex(compactLoop),
  });
  const { payloadSha256: _payloadSha256, ...firstBody } = first;
  const body = Object.freeze({ ...firstBody, LV });
  const tamperedFirst = Object.freeze({
    ...body,
    payloadSha256: await sha256CanonicalJsonHex(body),
  });
  return Object.freeze([tamperedFirst, ...projections.slice(1)]);
}

async function coordinatedShiftReportV1(
  report: MainWireIntegratedModelTransientVenousReturnReductionReportV1,
  timeShiftSec: number,
  revisionShift: number,
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportV1> {
  const comparison = report.payload.comparison!;
  const producerAudit = report.payload.producerProjectionAudit!;
  const beatExecutions = Object.freeze(
    report.payload.beatExecutions.map((beat) =>
      Object.freeze({
        ...beat,
        startTimeSec: beat.startTimeSec + timeShiftSec,
        endTimeSec: beat.endTimeSec + timeShiftSec,
        startAcceptedRevision: beat.startAcceptedRevision + revisionShift,
        terminalAcceptedRevision: beat.terminalAcceptedRevision + revisionShift,
      }),
    ),
  );
  const beatProjections = Object.freeze(
    await Promise.all(
      comparison.beatProjections.map(async (projection) => {
        const shiftVentricle = (ventricle: typeof projection.LV) =>
          Object.freeze({
            ...ventricle,
            landmarks: Object.freeze({
              baselineAnchoredIsochronal: Object.freeze({
                ...ventricle.landmarks.baselineAnchoredIsochronal,
                timeSec:
                  ventricle.landmarks.baselineAnchoredIsochronal.timeSec +
                  timeShiftSec,
              }),
              semilunarClosure: Object.freeze({
                ...ventricle.landmarks.semilunarClosure,
                timeSec:
                  ventricle.landmarks.semilunarClosure.timeSec + timeShiftSec,
              }),
              minimumVolume: Object.freeze({
                ...ventricle.landmarks.minimumVolume,
                timeSec:
                  ventricle.landmarks.minimumVolume.timeSec + timeShiftSec,
              }),
            }),
          });
        const { payloadSha256: _payloadSha256, ...projectionBody } = projection;
        const body = Object.freeze({
          ...projectionBody,
          startTimeSec: projection.startTimeSec + timeShiftSec,
          endTimeSec: projection.endTimeSec + timeShiftSec,
          LV: shiftVentricle(projection.LV),
          RV: shiftVentricle(projection.RV),
        });
        return Object.freeze({
          ...body,
          payloadSha256: await sha256CanonicalJsonHex(body),
        });
      }),
    ),
  );
  const comparisonBody = Object.freeze({
    ...omitComparisonHashV1(comparison),
    beatProjections,
  });
  const shiftedComparison = Object.freeze({
    ...comparisonBody,
    payloadSha256: await sha256CanonicalJsonHex(comparisonBody),
  });
  const rawBeatBindings = Object.freeze(
    producerAudit.rawBeatBindings.map((binding) =>
      Object.freeze({
        ...binding,
        startTimeSec: binding.startTimeSec + timeShiftSec,
        endTimeSec: binding.endTimeSec + timeShiftSec,
      }),
    ),
  );
  const shiftedProducerAudit = Object.freeze({
    ...producerAudit,
    rawBeatBindings,
    rawBeatFamilySha256: await sha256CanonicalJsonHex(rawBeatBindings),
    projectionFamilySha256: await sha256CanonicalJsonHex(beatProjections),
  });
  const payload = Object.freeze({
    ...report.payload,
    beatExecutions,
    producerProjectionAudit: shiftedProducerAudit,
    comparison: shiftedComparison,
  }) satisfies MainWireIntegratedModelTransientVenousReturnReductionPayloadV1;
  return Object.freeze({
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

async function coordinatedCompactLoopTamperReportV1(
  report: MainWireIntegratedModelTransientVenousReturnReductionReportV1,
  tamper: "extra-field" | "phase",
): Promise<MainWireIntegratedModelTransientVenousReturnReductionReportV1> {
  const comparison = report.payload.comparison!;
  const producerAudit = report.payload.producerProjectionAudit!;
  const first = comparison.beatProjections[0]!;
  const compactLoop = Object.freeze(
    first.LV.compactLoop.map((point, index) => {
      if (index !== 1) return point;
      if (tamper === "phase") {
        return Object.freeze({ ...point, phase01: point.phase01 + 1 / 128 });
      }
      return Object.freeze({
        ...point,
        injectedQualificationClaim: true,
      }) as unknown as typeof point;
    }),
  );
  const LV = Object.freeze({
    ...first.LV,
    compactLoop,
    compactLoopSha256: await sha256CanonicalJsonHex(compactLoop),
  });
  const { payloadSha256: _firstPayloadSha256, ...firstBody } = first;
  const tamperedFirstBody = Object.freeze({ ...firstBody, LV });
  const tamperedFirst = Object.freeze({
    ...tamperedFirstBody,
    payloadSha256: await sha256CanonicalJsonHex(tamperedFirstBody),
  });
  const beatProjections = Object.freeze([
    tamperedFirst,
    ...comparison.beatProjections.slice(1),
  ]);
  const comparisonBody = Object.freeze({
    ...omitComparisonHashV1(comparison),
    beatProjections,
  });
  const tamperedComparison = Object.freeze({
    ...comparisonBody,
    payloadSha256: await sha256CanonicalJsonHex(comparisonBody),
  });
  const tamperedProducerAudit = Object.freeze({
    ...producerAudit,
    projectionFamilySha256: await sha256CanonicalJsonHex(beatProjections),
  });
  const payload = Object.freeze({
    ...report.payload,
    producerProjectionAudit: tamperedProducerAudit,
    comparison: tamperedComparison,
  }) satisfies MainWireIntegratedModelTransientVenousReturnReductionPayloadV1;
  return Object.freeze({
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}
