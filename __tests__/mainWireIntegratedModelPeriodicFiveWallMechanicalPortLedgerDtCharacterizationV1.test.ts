import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditMainWireFiveWallMechanicalPortLedgerThreeGridV1,
  characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1,
  projectMainWireFiveWallMechanicalPortLedgerDtV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalPortLedgerDtProjectionV1";
import {
  measureMainWireFiveWallMechanicalPortLedgerV1,
  type MainWireFiveWallMechanicalPortAcceptedEndpointV1,
  type MainWireFiveWallMechanicalPortAcceptedIntervalV1,
  type MainWireFiveWallMechanicalPortChamberRecordV1,
  type MainWireFiveWallMechanicalPortLedgerV1,
  type MainWireFiveWallMechanicalPortStressReadbackV1,
  type MainWireFiveWallMechanicalPortWallRecordV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalPortLedgerEngineeringV1";
import {
  auditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1,
  auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_PAYLOAD_SHA256_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_IMPLEMENTATION_COMMIT_SHA_V1,
  runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtExecutionDependenciesV1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_DECLARATION_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_NEGATIVE_CLAIMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_SHA256_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationDefinitionV1";
import {
  normalAdultMainWireFiveWallMechanicalPortMaterialBindingV1,
  runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayForDtCharacterizationV1,
  runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayV1,
  type MainWireIntegratedModelPeriodicMechanicalPortContinuationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
  createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1,
  createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_RAW_FILE_SHA256_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_SIZE_BYTES_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_OUTPUT_PATH_V1,
  assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactSizeV1,
  assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtOutputAbsentV1,
  parseAndAuditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1,
  serializeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1,
  writeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactCreateOnlyV1,
} from "@/tools/scientific/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1";

const IMPLEMENTATION_SHA =
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_IMPLEMENTATION_COMMIT_SHA_V1;
const CHECKPOINT_SHA = "2".repeat(64);

describe("periodic five-wall mechanical-port ledger dt characterization V1", () => {
  it("freezes the declaration, exact numerical access, taxonomy, and negative claims", async () => {
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_DECLARATION_V1,
    ).toMatchObject({
      declarationCommitSha: "cee4a52152771b0a21c12dd2060b9ee324f60ce8",
      declarationDocumentGitBlobSha1:
        "13c8669165236470e7314d2c6fb912a24665ef01",
      declarationParentCommitSha: "b1d46922ab5e2aabdb417f8f2a1dede6c7504933",
    });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1,
    ).toEqual([
      {
        armId: "coarse",
        nominalDtSec: 0.001,
        maximumAcceptedStepCountPerCycle: 1_100,
      },
      {
        armId: "middle",
        nominalDtSec: 0.0005,
        maximumAcceptedStepCountPerCycle: 2_200,
      },
      {
        armId: "fine",
        nominalDtSec: 0.00025,
        maximumAcceptedStepCountPerCycle: 4_400,
      },
    ]);
    expect(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1,
    ).toHaveLength(25);
    expect(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1,
    ).toHaveLength(21);
    expect(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1,
    ).toHaveLength(11);
    expect(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1,
    ).toHaveLength(20);
    expect(
      new Set([
        ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1,
        ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1,
        ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1,
        ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1,
      ]).size,
    ).toBe(77);
    expect(
      Object.values(
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_NEGATIVE_CLAIMS_V1,
      ).every((value) => value === false),
    ).toBe(true);
    expect(
      await sha256CanonicalJsonHex(
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1,
      ),
    ).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_SHA256_V1,
    );
  });

  it("keeps sub-millisecond access outside the existing Standard replay entry point", () => {
    expect(() =>
      runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayV1(
        {} as never,
        {} as never,
        1,
        0.0005,
      ),
    ).toThrow(/outside V3 policy/);
    expect(() =>
      runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayForDtCharacterizationV1(
        {} as never,
        {} as never,
        1,
        0.0003 as 0.00025,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
      ),
    ).toThrow(/not declared/);
    expect(() =>
      runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayForDtCharacterizationV1(
        {} as never,
        {} as never,
        1,
        0.00025,
        "wrong-access" as typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
      ),
    ).toThrow(/access differs/);
  });

  it("projects exact metric sets and computes separate finite- and zero-limit trends", async () => {
    const ledgers = trendLedgers();
    mutable(ledgers.coarse).perWall.LA.activeMechanical.netDeliveryMilliJ = -10;
    mutable(ledgers.middle).perWall.LA.activeMechanical.netDeliveryMilliJ = -11;
    mutable(ledgers.fine).perWall.LA.activeMechanical.netDeliveryMilliJ = -11.5;
    const projections = await Promise.all([
      projectMainWireFiveWallMechanicalPortLedgerDtV1("coarse", ledgers.coarse),
      projectMainWireFiveWallMechanicalPortLedgerDtV1("middle", ledgers.middle),
      projectMainWireFiveWallMechanicalPortLedgerDtV1("fine", ledgers.fine),
    ]);
    const characterization =
      await characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1(
        projections,
      );
    const finite = characterization.payload.finiteLimit[0]!;
    expect(finite.valueMilliJ).toEqual({ coarse: 10, middle: 11, fine: 11.5 });
    expect(finite.differenceOrder).toMatchObject({
      status: "defined",
      value: 1,
      reason: null,
    });
    expect(finite.adjacentDifferenceShrank).toBe(true);
    expect(
      characterization.payload.finiteLimit.find(
        (metric) =>
          metric.metricId === "wall.LA.activeMechanical.netDeliveryMilliJ",
      )?.signClass,
    ).toEqual({ coarse: "negative", middle: "negative", fine: "negative" });

    const zero = characterization.payload.zeroLimit[0]!;
    expect(zero.magnitudeMilliJ).toEqual({ coarse: 4, middle: 2, fine: 1 });
    expect(zero.coarseToMiddleOrder.value).toBe(1);
    expect(zero.middleToFineOrder.value).toBe(1);
    expect(zero.coarseToMiddleMagnitudeDecreased).toBe(true);
    expect(zero.middleToFineMagnitudeDecreased).toBe(true);
    expect(characterization.payload.descriptiveSummary).toMatchObject({
      finiteLimitMetricCount: 25,
      zeroLimitMetricCount: 21,
      closureMetricCount: 11,
      algebraicResidualMetricCount: 20,
      numericalTrendIsQualificationGate: false,
    });
    expect(
      await auditMainWireFiveWallMechanicalPortLedgerThreeGridV1(
        ledgers,
        projections,
        characterization,
      ),
    ).toEqual({ status: "audit-passed", firstMismatchPath: null });
  });

  it("retains exact-zero order reasons and rejects overflow before canonical output", async () => {
    const ledgers = trendLedgers();
    for (const ledger of Object.values(ledgers))
      mutable(
        ledger,
      ).perWall.LA.equilibriumPassiveBackwardEulerRemainderMilliJ = 0;
    const projections = await Promise.all([
      projectMainWireFiveWallMechanicalPortLedgerDtV1("coarse", ledgers.coarse),
      projectMainWireFiveWallMechanicalPortLedgerDtV1("middle", ledgers.middle),
      projectMainWireFiveWallMechanicalPortLedgerDtV1("fine", ledgers.fine),
    ]);
    const characterized =
      await characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1(
        projections,
      );
    expect(characterized.payload.zeroLimit[0]).toMatchObject({
      coarseToMiddleOrder: {
        status: "undefined",
        value: null,
        reason: "both-zero",
      },
      middleToFineOrder: {
        status: "undefined",
        value: null,
        reason: "both-zero",
      },
    });

    const overflow = trendLedgers();
    mutable(overflow.coarse).cavityWork.trapezoidalWorkOnWallMilliJ.LA =
      Number.MAX_VALUE;
    mutable(overflow.middle).cavityWork.trapezoidalWorkOnWallMilliJ.LA =
      -Number.MAX_VALUE;
    const overflowProjections = await Promise.all([
      projectMainWireFiveWallMechanicalPortLedgerDtV1(
        "coarse",
        overflow.coarse,
      ),
      projectMainWireFiveWallMechanicalPortLedgerDtV1(
        "middle",
        overflow.middle,
      ),
      projectMainWireFiveWallMechanicalPortLedgerDtV1("fine", overflow.fine),
    ]);
    await expect(
      characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1(
        overflowProjections,
      ),
    ).rejects.toThrow(/difference overflowed/);
  });

  it("runs one mocked source, attempts all three arms, and audits the compact report", async () => {
    const calls: string[] = [];
    const { dependencies, ledgers } = await mockedDependencies(calls);
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        dependencies,
      );
    expect(calls).toEqual(["source", "coarse", "middle", "fine"]);
    expect(report.payload.assessment).toMatchObject({
      sourceP1Established: true,
      allThreeArmsAttemptedAfterSourceSuccess: true,
      allThreeArmsFulfilled: true,
      allArmsBindSharedSourceCheckpoint: true,
      independentProjectionAndTrendReplayPassed: true,
      threeGridMechanicalPortLedgerCharacterizationCompleted: true,
      firstFailureClass: null,
      numericalTrendIsQualificationGate: false,
    });
    expect(report.payload.armOutcomes.map((arm) => arm.status)).toEqual([
      "fulfilled",
      "fulfilled",
      "fulfilled",
    ]);
    expect(
      report.payload.armOutcomes.map((arm) =>
        arm.status === "fulfilled"
          ? arm.ledger.cavityWork.trapezoidalWorkOnWallMilliJ.LA
          : null,
      ),
    ).toEqual([
      ledgers.coarse.cavityWork.trapezoidalWorkOnWallMilliJ.LA,
      ledgers.middle.cavityWork.trapezoidalWorkOnWallMilliJ.LA,
      ledgers.fine.cavityWork.trapezoidalWorkOnWallMilliJ.LA,
    ]);
    expect(
      report.payload.armOutcomes.map((arm) =>
        arm.status === "fulfilled" ? arm.ledger.maximumAcceptedDtSec : null,
      ),
    ).toEqual([0.001, 0.0005, 0.00025]);
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        report,
      ),
    ).toMatchObject({ status: "report-audit-passed", firstMismatchPath: null });
    expect(
      assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactSizeV1(
        `${canonicalJsonStringify(report)}\n`,
      ),
    ).toBeLessThanOrEqual(524_288);
  });

  it("retains an arm failure without suppressing the later arm", async () => {
    const calls: string[] = [];
    const { dependencies } = await mockedDependencies(calls, "middle");
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        dependencies,
      );
    expect(calls).toEqual(["source", "coarse", "middle", "fine"]);
    expect(report.payload.armOutcomes.map((arm) => arm.status)).toEqual([
      "fulfilled",
      "failed",
      "fulfilled",
    ]);
    expect(report.payload.armOutcomes[1]).toMatchObject({
      failureClass: "arm-execution-failure",
      ledger: null,
      projection: null,
      exception: { name: "Error", message: "synthetic middle failure" },
    });
    expect(report.payload.characterization).toBeNull();
    expect(report.payload.assessment).toMatchObject({
      allThreeArmsAttemptedAfterSourceSuccess: true,
      allThreeArmsFulfilled: false,
      allArmsBindSharedSourceCheckpoint: false,
      threeGridMechanicalPortLedgerCharacterizationCompleted: false,
      firstFailureClass: "arm-execution-failure",
    });
    const audit =
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        report,
      );
    expect(audit.status, canonicalJsonStringify(audit)).toBe(
      "report-audit-passed",
    );
  });

  it("retains a non-P1 source outcome without attempting an arm", async () => {
    const calls: string[] = [];
    const { dependencies } = await mockedDependencies(calls);
    const runSource = dependencies.runSource;
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        {
          ...dependencies,
          runSource: async () => {
            const source = clone(await runSource());
            mutable(source).terminationReason = "maximum-cycles-reached";
            mutable(source).classification.status = "not-converged";
            mutable(source).classification.evidenceCycleIndices = [];
            mutable(source).classification.latestPeriod1MaximumNormalizedDelta =
              1;
            mutable(source).numericalPeriod1Established = false;
            mutable(
              source.observations.at(-1)!.period1.overall,
            ).maximumNormalizedDelta = 1;
            mutable(
              source.cycles.at(-1)!.period1.overall,
            ).maximumNormalizedDelta = 1;
            return source;
          },
        },
      );
    expect(calls).toEqual(["source"]);
    expect(report.payload.sourceOutcome).toMatchObject({
      status: "source-rejected",
      failureClass: "source-not-p1",
      summary: {
        nominalDtSec: 0.001,
        classification: { status: "not-converged" },
        numericalPeriod1Established: false,
      },
    });
    expect(report.payload.armOutcomes).toHaveLength(3);
    expect(
      report.payload.armOutcomes.every(
        (arm) => arm.status === "not-attempted-source-unavailable",
      ),
    ).toBe(true);
    const audit =
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        report,
      );
    expect(audit.status, canonicalJsonStringify(audit)).toBe(
      "report-audit-passed",
    );
  });

  it("independently replays a period2-suspect source rejection", async () => {
    const calls: string[] = [];
    const { dependencies } = await mockedDependencies(calls);
    const runSource = dependencies.runSource;
    const period1Delta =
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2MinimumPeriod1NormalizedDelta;
    const period2Delta =
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2NormalizedTolerance;
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        {
          ...dependencies,
          runSource: async () => {
            const source = clone(await runSource());
            for (const observation of mutable(source.observations)) {
              observation.period1.overall.maximumNormalizedDelta = period1Delta;
              observation.period2 = mutable(
                sourcePeriod2Closure(
                  observation.cycleIndex,
                  period2Delta,
                  observation.period1.provenance.currentRevision,
                ),
              );
            }
            mutable(
              source.cycles.at(-1)!.period1.overall,
            ).maximumNormalizedDelta = period1Delta;
            mutable(source).terminationReason = "period2-suspect";
            mutable(source).classification.status = "period2-suspect";
            mutable(source).classification.evidenceCycleIndices = [3, 4, 5];
            mutable(source).classification.latestPeriod1MaximumNormalizedDelta =
              period1Delta;
            mutable(source).classification.latestPeriod2MaximumNormalizedDelta =
              period2Delta;
            mutable(source).numericalPeriod1Established = false;
            return source;
          },
        },
      );
    expect(calls).toEqual(["source"]);
    expect(report.payload.sourceOutcome).toMatchObject({
      status: "source-rejected",
      failureClass: "source-not-p1",
      summary: {
        terminationReason: "period2-suspect",
        classification: {
          status: "period2-suspect",
          evidenceCycleIndices: [3, 4, 5],
        },
        numericalPeriod1Established: false,
      },
    });
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        report,
      ),
    ).toMatchObject({ status: "report-audit-passed" });
  });

  it("independently replays retained continuation- and projection-failure evidence", async () => {
    const ledgerCalls: string[] = [];
    const ledgerMock = await mockedDependencies(ledgerCalls);
    const ledgerContinue = ledgerMock.dependencies.continueArm;
    const ledgerFailure =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        {
          ...ledgerMock.dependencies,
          continueArm: async (input) => {
            const continuation = clone(await ledgerContinue(input));
            mutable(continuation.measurementCycle).startTimeSec += 0.25;
            return continuation;
          },
        },
      );
    expect(
      ledgerFailure.payload.armOutcomes.every((arm) => arm.status === "failed"),
    ).toBe(true);
    expect(ledgerFailure.payload.armOutcomes[0]).toMatchObject({
      failureClass: "ledger-integrity-failure",
      retainedContinuationEvidence: {
        measurementCycle: { startTimeSec: 6.25 },
      },
      ledger: { ledgerId: expect.any(String) },
      projection: null,
    });
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        ledgerFailure,
      ),
    ).toMatchObject({ status: "report-audit-passed" });

    const projectionCalls: string[] = [];
    const projectionMock = await mockedDependencies(projectionCalls);
    const projectionContinue = projectionMock.dependencies.continueArm;
    const projectionFailure =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        {
          ...projectionMock.dependencies,
          continueArm: async (input) => {
            const continuation = clone(await projectionContinue(input));
            (
              mutable(continuation.ledger) as unknown as { ledgerId: string }
            ).ledgerId = "wrong-ledger-owner";
            return continuation;
          },
        },
      );
    expect(
      projectionFailure.payload.armOutcomes.every(
        (arm) =>
          arm.status === "failed" &&
          arm.failureClass === "projection-integrity-failure",
      ),
    ).toBe(true);
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        projectionFailure,
      ),
    ).toMatchObject({ status: "report-audit-passed" });
  });

  it("rejects coordinated projection and outer-payload resealing", async () => {
    const { dependencies } = await mockedDependencies([]);
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        dependencies,
      );
    const tampered = clone(report);
    const firstArm = tampered.payload.armOutcomes[0]!;
    if (firstArm.status !== "fulfilled") throw new Error("fixture arm failed");
    mutable(firstArm.projection).payload.finiteLimitMetrics[0]!.valueMilliJ +=
      1;
    mutable(firstArm.projection).payloadSha256 = await sha256CanonicalJsonHex(
      firstArm.projection.payload,
    );
    mutable(tampered).payloadSha256 = await sha256CanonicalJsonHex(
      tampered.payload,
    );
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        tampered,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      independentProjectionAndTrendReplayPassed: false,
    });
  });

  it("rejects resealed report identities and source identity hashes", async () => {
    const { dependencies } = await mockedDependencies([]);
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        dependencies,
      );

    const wrongOwner = clone(report);
    (
      mutable(wrongOwner.payload) as unknown as {
        reportSchemaId: string;
      }
    ).reportSchemaId = "wrong-report-schema";
    mutable(wrongOwner).payloadSha256 = await sha256CanonicalJsonHex(
      wrongOwner.payload,
    );
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        wrongOwner,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      reportIdentityPassed: false,
    });

    const wrongSource = clone(report);
    if (wrongSource.payload.sourceOutcome.summary === null)
      throw new Error("fixture source failed");
    mutable(wrongSource.payload.sourceOutcome.summary).protocolIdentityHash =
      "f".repeat(64);
    mutable(wrongSource).payloadSha256 = await sha256CanonicalJsonHex(
      wrongSource.payload,
    );
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        wrongSource,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      sourceIdentityReplayPassed: false,
    });
  });

  it("rejects a coordinated P1 classifier-input reseal", async () => {
    const { dependencies } = await mockedDependencies([]);
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        dependencies,
      );
    const tampered = clone(report);
    const source = tampered.payload.sourceOutcome;
    if (source.summary === null) throw new Error("fixture source failed");
    for (const input of mutable(source.summary.period1ClassifierInputs))
      input.period1MaximumNormalizedDelta = 1;
    mutable(
      source.summary.terminalPeriod1Closure.overall,
    ).maximumNormalizedDelta = 1;
    mutable(source.summary.classification).latestPeriod1MaximumNormalizedDelta =
      1;
    mutable(tampered).payloadSha256 = await sha256CanonicalJsonHex(
      tampered.payload,
    );
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        tampered,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      sourceOutcomeShapePassed: false,
    });
  });

  it("rejects coordinated window, ledger-lineage, and material-binding reseals", async () => {
    const { dependencies } = await mockedDependencies([]);
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        dependencies,
      );

    const wrongWindow = clone(report);
    const wrongWindowCoarse = wrongWindow.payload.armOutcomes[0]!;
    if (wrongWindowCoarse.status !== "fulfilled")
      throw new Error("fixture arm failed");
    mutable(wrongWindowCoarse.bridgeCycle).coronaryWindowIndex += 1;
    mutable(wrongWindow).payloadSha256 = await sha256CanonicalJsonHex(
      wrongWindow.payload,
    );
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        wrongWindow,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      armOutcomeShapePassed: false,
    });

    const wrongLedger = clone(report);
    const wrongLedgerCoarse = wrongLedger.payload.armOutcomes[0]!;
    if (wrongLedgerCoarse.status !== "fulfilled")
      throw new Error("fixture arm failed");
    mutable(wrongLedgerCoarse.ledger).initialAcceptedTimeSec += 0.25;
    mutable(wrongLedgerCoarse.ledger.materialBinding).parameterIdentityHash =
      "tampered-material-binding";
    await resealFulfilledProjectionsAndCharacterization(wrongLedger);
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        wrongLedger,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      armOutcomeShapePassed: false,
      independentProjectionAndTrendReplayPassed: true,
    });
  });

  it("rejects a resealed arm whose retained cycle gates did not pass", async () => {
    const { dependencies } = await mockedDependencies([]);
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        dependencies,
      );
    const tampered = clone(report);
    const coarse = tampered.payload.armOutcomes[0]!;
    if (coarse.status !== "fulfilled") throw new Error("fixture arm failed");
    mutable(coarse.bridgeCycle).allRawValuesFinite = false;
    mutable(tampered).payloadSha256 = await sha256CanonicalJsonHex(
      tampered.payload,
    );
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        tampered,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      armOutcomeShapePassed: false,
    });
  });

  it("replays retained successful projections even when another arm failed", async () => {
    const { dependencies } = await mockedDependencies([], "middle");
    const report =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        { implementationCommitSha: IMPLEMENTATION_SHA },
        dependencies,
      );
    const tampered = clone(report);
    const coarse = tampered.payload.armOutcomes[0]!;
    if (coarse.status !== "fulfilled") throw new Error("fixture arm failed");
    mutable(coarse.projection).payload.zeroLimitMetrics[0]!.valueMilliJ += 1;
    mutable(coarse.projection).payloadSha256 = await sha256CanonicalJsonHex(
      coarse.projection.payload,
    );
    mutable(tampered).payloadSha256 = await sha256CanonicalJsonHex(
      tampered.payload,
    );
    expect(
      await auditMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        tampered,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      independentProjectionAndTrendReplayPassed: false,
    });
  });

  it("locks, audits, and create-only rewrites the committed artifact", async () => {
    const raw = readFileSync(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_OUTPUT_PATH_V1,
      "utf8",
    );
    expect(Buffer.byteLength(raw, "utf8")).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_SIZE_BYTES_V1,
    );
    expect(createHash("sha256").update(raw).digest("hex")).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_RAW_FILE_SHA256_V1,
    );
    const report = JSON.parse(
      raw,
    ) as MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1;
    expect(report.payload.implementationCommitSha).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_IMPLEMENTATION_COMMIT_SHA_V1,
    );
    expect(report.payloadSha256).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_PAYLOAD_SHA256_V1,
    );
    expect(await sha256CanonicalJsonHex(report.payload)).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_COMMITTED_PAYLOAD_SHA256_V1,
    );
    expect(
      await auditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        report,
      ),
    ).toMatchObject({
      status: "report-audit-passed",
      implementationCommitBindingPassed: true,
      committedPayloadBindingPassed: true,
    });
    expect(
      await serializeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
        report,
      ),
    ).toBe(raw);

    const extraTopLevel = {
      ...report,
      injectedClaim: true,
    } as unknown as MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1;
    expect(
      await auditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        extraTopLevel,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      reportIdentityPassed: false,
    });
    await expect(
      serializeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
        extraTopLevel,
      ),
    ).rejects.toThrow(/audit failed/);
    await expect(
      parseAndAuditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
        raw.replace(/\n$/, " \n"),
      ),
    ).rejects.toThrow(/byte count differs/);

    const tampered = clone(report);
    mutable(tampered.payload).implementationCommitSha = "3".repeat(40);
    mutable(tampered).payloadSha256 = await sha256CanonicalJsonHex(
      tampered.payload,
    );
    expect(
      await auditCommittedMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtReportV1(
        tampered,
      ),
    ).toMatchObject({
      status: "report-audit-failed",
      implementationCommitBindingPassed: false,
      payloadHashReplayPassed: true,
      committedPayloadBindingPassed: false,
    });

    const directory = mkdtempSync(join(tmpdir(), "mechanical-port-dt-v1-"));
    const outputPath = join(directory, "artifact.json");
    try {
      assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtOutputAbsentV1(
        outputPath,
      );
      const written =
        await writeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactCreateOnlyV1(
          outputPath,
          report,
        );
      expect(written.sizeBytes).toBeGreaterThan(0);
      expect(readFileSync(outputPath, "utf8")).toBe(
        await serializeMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactV1(
          report,
        ),
      );
      expect(() =>
        assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtOutputAbsentV1(
          outputPath,
        ),
      ).toThrow(/already exists/);
      expect(() =>
        assertMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtArtifactSizeV1(
          "x".repeat(524_289),
        ),
      ).toThrow(/limit/);
      writeFileSync(join(directory, "sentinel"), "kept");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

async function mockedDependencies(
  calls: string[],
  failingArm?: "coarse" | "middle" | "fine",
): Promise<
  Readonly<{
    dependencies: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtExecutionDependenciesV1;
    ledgers: ReturnType<typeof trendLedgers>;
  }>
> {
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const [modelConditionIdentityHash, protocolIdentityHash] = await Promise.all([
    sha256CanonicalJsonHex(
      createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1(
        fixture,
      ),
    ),
    sha256CanonicalJsonHex(
      createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3(fixture, {
        executionPurpose: "canonical-evidence",
        nominalDtSec: 0.001,
        maximumCycleCount: 250,
      }),
    ),
  ]);
  const terminalPeriod1Closure = sourcePeriod1Closure(5, 1e-7, 500);
  const observations = [3, 4, 5].map((cycleIndex) => ({
    cycleIndex,
    evidenceRole: "canonical-periodic-protocol" as const,
    protocolIdentityHash,
    period1:
      cycleIndex === 5
        ? terminalPeriod1Closure
        : sourcePeriod1Closure(cycleIndex, 1e-7, 300 + cycleIndex * 40),
    period2: null,
  }));
  const source = {
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V3_ID,
    executionPurpose: "canonical-evidence",
    nominalDtSec: 0.001,
    requestedMaximumCycleCount: 250,
    completedCycleCount: 5,
    terminationReason: "period1-converged",
    protocolIdentityHash,
    modelConditionIdentityHash,
    classification: {
      classifierId:
        "main-wire-integrated-composed-rhythm-periodic-classifier-v3",
      status: "period1-converged",
      latestCycleIndex: 5,
      consecutiveCyclesRequired: 3,
      minimumConsecutiveCycles: 3,
      acceptedEvidenceRole: "canonical-periodic-protocol",
      evidenceCycleIndices: [3, 4, 5],
      latestPeriod1MaximumNormalizedDelta: 1e-7,
      latestPeriod2MaximumNormalizedDelta: null,
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
    },
    numericalPeriod1Established: true,
    allCyclesFiniteConservedAndEventExact: true,
    terminalCheckpointExactRoundTripVerified: true,
    terminalCheckpoint: { checkpointSha256: CHECKPOINT_SHA },
    terminalCycleTrace: { cycleIndex: 5 },
    terminalAcceptedState: { acceptedTimeSec: 5, revision: 500 },
    observations,
    cycles: [{ cycleIndex: 5, period1: terminalPeriod1Closure }],
  } as unknown as MainWireIntegratedModelPeriodicSteadyResultV3;
  const ledgers = trendLedgers();
  const materialBinding =
    normalAdultMainWireFiveWallMechanicalPortMaterialBindingV1(fixture);
  for (const ledger of Object.values(ledgers))
    mutable(ledger).materialBinding = clone(materialBinding);
  return {
    ledgers,
    dependencies: {
      runSource: async () => {
        calls.push("source");
        return source;
      },
      createFixture: () => fixture,
      continueArm: async (input) => {
        const arm =
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1.find(
            (candidate) => candidate.nominalDtSec === input.nominalDtSec,
          )!;
        calls.push(arm.armId);
        if (arm.armId === failingArm)
          throw new Error(`synthetic ${arm.armId} failure`);
        return continuation(
          ledgers[arm.armId],
          input.sourceCycleIndex,
          input.nominalDtSec,
        );
      },
    },
  };
}

function continuation(
  ledger: MainWireFiveWallMechanicalPortLedgerV1,
  sourceCycleIndex: number,
  nominalDtSec: number,
): MainWireIntegratedModelPeriodicMechanicalPortContinuationV1 {
  const stepCount = ledger.intervalCount;
  const bridge = cycle(sourceCycleIndex, stepCount, 5, 6, 500);
  const measurement = cycle(sourceCycleIndex + 1, stepCount, 6, 7, 501);
  return {
    sourceCycleIndex,
    sourceCheckpointSha256: CHECKPOINT_SHA,
    sourceCheckpointExactRoundTripVerified: true,
    bridgeCycle: bridge as never,
    measurementCycle: measurement as never,
    measurementAcceptedIntervals: Array.from(
      { length: stepCount },
      () => ({}) as MainWireFiveWallMechanicalPortAcceptedIntervalV1,
    ),
    materialBinding: ledger.materialBinding,
    ledger: {
      ...ledger,
      initialAcceptedRevision: 501,
      terminalAcceptedRevision: 502,
      initialAcceptedTimeSec: 6,
      terminalAcceptedTimeSec: 7,
      elapsedTimeSec: 1,
      minimumAcceptedDtSec: Math.min(ledger.minimumAcceptedDtSec, nominalDtSec),
      maximumAcceptedDtSec: nominalDtSec,
    },
    terminalCheckpoint: { checkpointSha256: "3".repeat(64) } as never,
    terminalCheckpointExactRoundTripVerified: true,
  };
}

function cycle(
  windowIndex: number,
  acceptedStepCount: number,
  startTimeSec: number,
  endTimeSec: number,
  startAcceptedRevision: number,
) {
  return {
    startTimeSec,
    endTimeSec,
    acceptedStepCount,
    terminalAcceptedState: {
      revision: startAcceptedRevision + acceptedStepCount,
    },
    coronaryAutoregulationWindow: { windowIndex },
    maximumGlobalTotalBloodVolumeErrorMl: 0,
    maximumCoronaryBloodVolumeLedgerResidualMl: 0,
    maximumDynamicMcsConservationResidualMlPerSec: 0,
    allRawValuesFinite: true,
    oneComposedCalciumOwnerOnly: true,
    allDynamicMcsAcceptedFlowsExactlyZero: true,
  };
}

function sourcePeriod1Closure(
  cycleIndex: number,
  maximumNormalizedDelta: number,
  currentRevision: number,
) {
  return {
    closureId:
      "main-wire-integrated-composed-rhythm-full-accepted-state-periodic-closure-v3",
    referenceScaleSetId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.referenceScaleSetId,
    gates: {
      ownerClocksAndRevisionsValid: true,
      modelConfigurationsExact: true,
      regularSinusLineageAdvancesByPeriodLag: true,
      captureAvDistalBackupAndIntervalCountersAdvanceByPeriodLag: true,
      withinStateVentricularLineageExact: true,
      pendingQueuesCompletelyPaired: true,
      dynamicMcsAllOffAndZero: true,
      coronaryV3CompatibilityAndEmptyWindowsSatisfied: true,
    },
    provenance: {
      sourcePeriodSec: 1,
      periodLag: 1,
      currentAcceptedTimeSec: cycleIndex,
      referenceAcceptedTimeSec: cycleIndex - 1,
      acceptedTimeAdvanceSec: 1,
      currentRevision,
      referenceRevision: currentRevision - 100,
      revisionAdvance: 100,
    },
    overall: { maximumNormalizedDelta },
  };
}

function sourcePeriod2Closure(
  cycleIndex: number,
  maximumNormalizedDelta: number,
  currentRevision: number,
): MainWireIntegratedModelPeriodicSteadyResultV3["observations"][number]["period2"] {
  const closure = sourcePeriod1Closure(
    cycleIndex,
    maximumNormalizedDelta,
    currentRevision,
  );
  return {
    ...closure,
    provenance: {
      ...closure.provenance,
      periodLag: 2,
      referenceAcceptedTimeSec: cycleIndex - 2,
      acceptedTimeAdvanceSec: 2,
      referenceRevision: currentRevision - 200,
      revisionAdvance: 200,
    },
  } as unknown as MainWireIntegratedModelPeriodicSteadyResultV3["observations"][number]["period2"];
}

function trendLedgers(): Readonly<{
  coarse: MainWireFiveWallMechanicalPortLedgerV1;
  middle: MainWireFiveWallMechanicalPortLedgerV1;
  fine: MainWireFiveWallMechanicalPortLedgerV1;
}> {
  const base = baseLedger();
  return {
    coarse: shapedLedger(base, 10, 4, 3, 1e-9),
    middle: shapedLedger(base, 11, 2, 2, 5e-10),
    fine: shapedLedger(base, 11.5, 1, 1.5, 2.5e-10),
  };
}

function shapedLedger(
  source: MainWireFiveWallMechanicalPortLedgerV1,
  finiteValue: number,
  zeroValue: number,
  closureValue: number,
  algebraicValue: number,
): MainWireFiveWallMechanicalPortLedgerV1 {
  const ledger = mutable(clone(source));
  for (const chamberId of ["LA", "LV", "RA", "RV"] as const) {
    ledger.cavityWork.trapezoidalWorkOnWallMilliJ[chamberId] = finiteValue;
    ledger.cavityWork.quadratureDifferenceMilliJ[chamberId] = zeroValue;
  }
  for (const wallId of ["LA", "LVFW", "SEP", "RVFW", "RA"] as const) {
    const wall = ledger.perWall[wallId];
    wall.activeMechanical.deliveryPositiveMilliJ = finiteValue;
    wall.activeMechanical.absorptionMagnitudeMilliJ = finiteValue;
    wall.activeMechanical.netDeliveryMilliJ = finiteValue;
    wall.parallelSls.physicalDissipationMilliJ = finiteValue;
    wall.equilibriumPassiveBackwardEulerRemainderMilliJ = zeroValue;
    wall.parallelSls.backwardEulerNumericalDissipationMilliJ = zeroValue;
    wall.equilibriumPassiveStoredEnergyChangeMilliJ = closureValue;
    wall.parallelSls.storedEnergyChangeMilliJ = closureValue;
    wall.stressAssemblyResidualMilliJ = algebraicValue;
    wall.parallelSls.reportedDiscreteBalanceResidualMilliJ = algebraicValue;
    wall.parallelSls.reconstructedDiscreteBalanceResidualMilliJ =
      algebraicValue;
    wall.parallelSls.readbackAgreementResidualMilliJ = algebraicValue;
  }
  ledger.commonPericardium.trapezoidalPressureWorkOnBagMilliJ = finiteValue;
  ledger.commonPericardium.quadratureDifferenceMilliJ = zeroValue;
  ledger.commonPericardium.backwardEulerRemainderMilliJ = zeroValue;
  ledger.commonPericardium.trapezoidalRemainderMilliJ = zeroValue;
  ledger.commonPericardium.storedEnergyChangeMilliJ = closureValue;
  ledger.backwardEulerWorkConjugacyResidualMilliJ.leftAtrium = zeroValue;
  ledger.backwardEulerWorkConjugacyResidualMilliJ.rightAtrium = zeroValue;
  ledger.backwardEulerWorkConjugacyResidualMilliJ.ventricularWallsCombined =
    zeroValue;
  ledger.backwardEulerWorkConjugacyResidualMilliJ.allFiveWalls = zeroValue;
  return ledger as unknown as MainWireFiveWallMechanicalPortLedgerV1;
}

function baseLedger(): MainWireFiveWallMechanicalPortLedgerV1 {
  const previous = endpoint(0, 0, 0);
  const next = endpoint(1, 1, 0.1);
  return clone(
    measureMainWireFiveWallMechanicalPortLedgerV1({
      materialBinding: {
        ownerId: "synthetic-owner",
        parameterIdentityHash: "synthetic-parameters",
        mechanicsProviderIdentity: {
          contractId: "synthetic-contract",
          providerId: "synthetic-provider",
          parameterSetId: "synthetic-set",
          parameterIdentityHash: "synthetic-provider-parameters",
          stateSchemaVersion: 1,
        },
        wallMaterialVolumeMlByWall: wallRecord(() => 1_000),
      },
      acceptedIntervals: [{ previous, next }],
    }),
  );
}

function endpoint(
  acceptedRevision: number,
  acceptedTimeSec: number,
  strain: number,
): MainWireFiveWallMechanicalPortAcceptedEndpointV1 {
  const wallStress = stress({ total: 100, active: 20, passive: 30, sls: 50 });
  return {
    acceptedRevision,
    acceptedTimeSec,
    nodeVolumeMl: chamberRecord(10 + acceptedRevision),
    chamberTransmuralPressureMmHg: chamberRecord(2 + acceptedRevision),
    commonPericardium: {
      excessPressureMmHg: acceptedRevision,
      storedEnergyMilliJ: acceptedRevision,
    },
    wallStressPa: wallRecord(() => wallStress),
    wallFiberLogStrain: wallRecord(() => strain),
    wallEnergyLedgerDensity: wallRecord(() => ({
      equilibriumPassiveStoredEnergyDensityJPerM3: acceptedRevision,
      slsPreviousStoredEnergyDensityJPerM3: 0,
      slsNextStoredEnergyDensityJPerM3: 0,
      slsPhysicalDissipationIncrementDensityJPerM3: acceptedRevision,
      slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
        acceptedRevision,
      slsDiscreteEnergyBalanceResidualJPerM3: 0,
    })),
  };
}

function stress(input: {
  total: number;
  active: number;
  passive: number;
  sls: number;
}): MainWireFiveWallMechanicalPortStressReadbackV1 {
  return {
    total: input.total,
    landActive: input.active,
    equilibriumPassive: input.passive,
    parallelSls: input.sls,
  };
}

function chamberRecord(
  value: number,
): MainWireFiveWallMechanicalPortChamberRecordV1<number> {
  return { LA: value, LV: value, RA: value, RV: value };
}

function wallRecord<T>(
  build: () => T,
): MainWireFiveWallMechanicalPortWallRecordV1<T> {
  return {
    LA: build(),
    LVFW: build(),
    SEP: build(),
    RVFW: build(),
    RA: build(),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(canonicalJsonStringify(value)) as T;
}

async function resealFulfilledProjectionsAndCharacterization(
  report: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
): Promise<void> {
  const fulfilled = report.payload.armOutcomes.map((arm) => {
    if (arm.status !== "fulfilled") throw new Error("fixture arm failed");
    return arm;
  });
  for (const arm of fulfilled)
    mutable(arm).projection = mutable(
      await projectMainWireFiveWallMechanicalPortLedgerDtV1(
        arm.armId,
        arm.ledger,
      ),
    );
  mutable(report.payload).characterization = mutable(
    await characterizeMainWireFiveWallMechanicalPortLedgerThreeGridV1(
      fulfilled.map((arm) => arm.projection),
    ),
  );
  mutable(report).payloadSha256 = await sha256CanonicalJsonHex(report.payload);
}

function mutable<T>(value: T): DeepMutable<T> {
  return value as DeepMutable<T>;
}

type DeepMutable<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? DeepMutable<U>[]
    : T extends object
      ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
      : T;
