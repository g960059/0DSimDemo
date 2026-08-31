import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_METRICS_V1,
  MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_CLAIM_V1,
  summarizeMainWireStandard66ValidationEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireStandard66ValidationEnvelopeSummaryV1";
import { MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID } from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import {
  MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID,
  mainWireLeftVentricularPressureRateConfigurationIdentityV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";
import { MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID } from "@/analysis/methods/mainWire/MainWireStandard66AorticOutflowShapeDiagnosticV1";
import { MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID } from "@/analysis/methods/mainWire/MainWireStandard66TerminalBeatValidationMeasurementsV1";
import {
  createMainWireStandard66ValidationRunArtifactV1,
  serializeMainWireStandard66ValidationRunArtifactV1,
  type MainWireStandard66ValidationRunArtifactV1,
} from "@/analysis/runtime/MainWireStandard66ValidationRunArtifactV1";
import {
  runMainWireStandard66ValidationArmV1,
  type MainWireStandard66ValidationArmResultV1,
} from "@/analysis/runtime/MainWireStandard66ValidationArmRunnerV1";
import {
  MAIN_WIRE_STANDARD66_P1_CONFIRMATION_PROTOCOL_IDENTITY_V1_ID,
  MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
} from "@/analysis/runtime/MainWireStandard66P1SettlingRunnerV1";
import { MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID } from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
  type MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";
import { summarizeMainWireStandard66ValidationEnvelopeCliV1 } from "@/tools/scientific/summarizeMainWireStandard66ValidationEnvelopeV1";

describe("Standard66 validation envelope summary V1", () => {
  let boundedSmoke: MainWireStandard66ValidationArmResultV1;

  beforeAll(async () => {
    boundedSmoke = await runMainWireStandard66ValidationArmV1({
      clockArmId: "dt-2ms-production",
      executionPurpose: "bounded-smoke",
      boundedSmokeHorizonSec: 0.01,
    });
  }, 120_000);

  it("returns preregistered-order rows and all-tie-aware extrema only for the complete 17-case arm", async () => {
    const artifacts = await completedEnvelopeArtifactsV1(boundedSmoke);
    const result = await summarizeMainWireStandard66ValidationEnvelopeV1(
      [...artifacts].reverse(),
    );

    expect(result.status).toBe("envelope-summarized");
    if (result.status !== "envelope-summarized") {
      throw new Error("expected a complete envelope summary");
    }
    expect(result.caseRows.map(({ caseId }) => caseId)).toEqual(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.map(
        ({ caseId }) => caseId,
      ),
    );
    expect(Object.keys(result.caseRows[0]!.values)).toHaveLength(
      MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_METRICS_V1.length,
    );
    expect(result.metricExtrema).toHaveLength(
      MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_METRICS_V1.length,
    );
    expect(
      result.metricExtrema.find(
        ({ metricId }) => metricId === "aortic-ejection-duration",
      ),
    ).toMatchObject({
      minimum: 0.18,
      minimumCaseIds: ["default"],
      maximum: 0.196,
      maximumCaseIds: ["resolution-iv-16"],
    });
    expect(
      result.metricExtrema.find(
        ({ metricId }) => metricId === "lv-minimum-dp-dt-10ms",
      ),
    ).toMatchObject({
      minimum: -1_516,
      minimumCaseIds: ["resolution-iv-16"],
      maximum: -1_500,
      maximumCaseIds: ["default"],
    });
    expect(
      result.metricExtrema.find(
        ({ metricId }) => metricId === "configured-maximum-forward-eoa",
      ),
    ).toMatchObject({
      minimum: 3.5,
      maximum: 3.5,
      minimumCaseIds:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.map(
          ({ caseId }) => caseId,
        ),
      maximumCaseIds:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.map(
          ({ caseId }) => caseId,
        ),
    });
    expect(result.common).toMatchObject({
      clockArmId: "dt-2ms-production",
      requestedBoundaryIntervalSec: 0.002,
      configuredMaximumForwardEoaCm2: 3.5,
    });
    expect(result.claim).toEqual(
      MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_CLAIM_V1,
    );
    expect(result.claim).toMatchObject({
      clinicalThresholdsApplied: false,
      clinicalNormalityClaimed: false,
      releaseReadinessClaimed: false,
      causalAttributionClaimed: false,
      independenceClaimed: false,
    });
  });

  it("fails closed on duplicate/missing coverage without returning partial numerical rows", async () => {
    const artifacts = await completedEnvelopeArtifactsV1(boundedSmoke);
    const result = await summarizeMainWireStandard66ValidationEnvelopeV1([
      ...artifacts.slice(0, -1),
      artifacts[0]!,
    ]);

    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("expected unavailable envelope summary");
    }
    expect(result.caseRows).toBeNull();
    expect(result.metricExtrema).toBeNull();
    expect(result.unavailableReasons.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["duplicate-case-id", "missing-case-id"]),
    );
    expect(result.unavailableReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-case-id",
          caseId: "resolution-iv-16",
        }),
      ]),
    );
  });

  it("preserves upstream non-settlement reasons and returns no partial envelope", async () => {
    const artifacts = await completedEnvelopeArtifactsV1(boundedSmoke);
    const unavailable = await boundedSmokeArtifactForCaseV1(
      boundedSmoke,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1[4]!,
    );
    artifacts[4] = unavailable;
    const result =
      await summarizeMainWireStandard66ValidationEnvelopeV1(artifacts);

    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("expected unavailable envelope summary");
    }
    expect(result.caseRows).toBeNull();
    expect(result.metricExtrema).toBeNull();
    expect(result.unavailableReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "period1-settlement-unavailable",
          caseId: "resolution-iv-04",
          sourceReason: "bounded-smoke-complete",
        }),
        expect.objectContaining({
          code: "fresh-period1-confirmation-unavailable",
          caseId: "resolution-iv-04",
          sourceReason: "confirmation:not-run",
        }),
        expect.objectContaining({
          code: "terminal-outcomes-unavailable",
          caseId: "resolution-iv-04",
          sourceReason: "terminal:bounded-smoke-complete",
        }),
      ]),
    );
  });

  it("rejects stale integrity, method drift, and a mixed clock arm before summarizing", async () => {
    const artifacts = await completedEnvelopeArtifactsV1(boundedSmoke);
    const stale = structuredClone(artifacts[1]) as any;
    stale.payload.armResult.outcomes.terminalBeatMeasurements.completedBeatMeasurements.primaryStrokeVolumeAoVForwardMl = 999;
    artifacts[1] = stale;

    const wrongMethod = structuredClone(artifacts[2]) as any;
    wrongMethod.payload.armResult.outcomes.terminalBeatMeasurements.flowEventTiming.methodId =
      "wrong-flow-method";
    wrongMethod.payloadSha256 = await sha256CanonicalJsonHex(
      wrongMethod.payload,
    );
    artifacts[2] = wrongMethod;

    const mixedClock = structuredClone(artifacts[3]) as any;
    mixedClock.payload.armResult.protocolIdentity.clock = {
      armId: "dt-1ms-intermediate",
      requestedBoundaryIntervalSec: 0.001,
      requestedGridOriginSec: 0,
    };
    mixedClock.payload.armResult.settlement.clock.armId = "dt-1ms-intermediate";
    mixedClock.payload.armResult.settlement.clock.requestedStepSec = 0.001;
    mixedClock.payload.armResult.confirmation.clock.armId =
      "dt-1ms-intermediate";
    mixedClock.payload.armResult.confirmation.clock.requestedStepSec = 0.001;
    mixedClock.payload.armResult.protocolIdentityHash =
      await sha256CanonicalJsonHex(
        mixedClock.payload.armResult.protocolIdentity,
      );
    mixedClock.payloadSha256 = await sha256CanonicalJsonHex(mixedClock.payload);
    artifacts[3] = mixedClock;

    const result =
      await summarizeMainWireStandard66ValidationEnvelopeV1(artifacts);
    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("expected unavailable envelope summary");
    }
    expect(result.caseRows).toBeNull();
    expect(result.metricExtrema).toBeNull();
    expect(result.unavailableReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "artifact-invalid",
          caseId: "resolution-iv-01",
          sourceReason: expect.stringMatching(/payload hash is invalid/),
        }),
        expect.objectContaining({
          code: "method-identity-mismatch",
          caseId: "resolution-iv-02",
          sourceReason: "method:model-flow-event-timing",
        }),
        expect.objectContaining({
          code: "common-clock-arm-mismatch",
          caseId: "resolution-iv-03",
          sourceReason: "dt-1ms-intermediate",
        }),
      ]),
    );
  });

  it("requires one mechanism construction and one contractility scale across cases", async () => {
    const artifacts = await completedEnvelopeArtifactsV1(boundedSmoke);
    const changed = structuredClone(artifacts[7]) as any;
    const arm = changed.payload.armResult;
    const mechanism = structuredClone(
      arm.protocolIdentity.exactConstruction.mechanismResearchInputs,
    );
    mechanism.valveAreas.MV.maximumForwardEoaCm2 = 5.45;
    arm.protocolIdentity.exactConstruction.mechanismResearchInputs = mechanism;
    arm.protocolIdentity.exactConstruction.ventricularContractilityScale = 1.01;
    arm.comparisonCohortIdentity.exactConstruction =
      arm.protocolIdentity.exactConstruction;
    arm.constructionIdentityHash = await sha256CanonicalJsonHex(
      arm.protocolIdentity.exactConstruction,
    );
    arm.comparisonCohortIdentityHash = await sha256CanonicalJsonHex(
      arm.comparisonCohortIdentity,
    );
    arm.protocolIdentity.comparisonCohortIdentityHash =
      arm.comparisonCohortIdentityHash;
    arm.protocolIdentityHash = await sha256CanonicalJsonHex(
      arm.protocolIdentity,
    );
    changed.payloadSha256 = await sha256CanonicalJsonHex(changed.payload);
    artifacts[7] = changed;

    const result =
      await summarizeMainWireStandard66ValidationEnvelopeV1(artifacts);
    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("expected unavailable envelope summary");
    }
    expect(result.caseRows).toBeNull();
    expect(result.metricExtrema).toBeNull();
    expect(result.unavailableReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "common-mechanism-construction-mismatch",
          caseId: "resolution-iv-07",
        }),
        expect.objectContaining({
          code: "common-contractility-mismatch",
          caseId: "resolution-iv-07",
          sourceReason: "1.01",
        }),
      ]),
    );
  });

  it("summarizes exactly 17 owner-parsed files and writes canonical JSON only with explicit overwrite authority", async () => {
    const temporaryDirectory = mkdtempSync(
      path.join(os.tmpdir(), "standard66-envelope-cli-"),
    );
    try {
      const artifacts = await completedEnvelopeArtifactsV1(boundedSmoke);
      const inputPaths = await writeArtifactsV1(
        temporaryDirectory,
        [...artifacts].reverse(),
      );
      const outputPath = path.join(temporaryDirectory, "summary.json");
      const args = inputPaths.flatMap((inputPath) => ["--input", inputPath]);
      const first =
        await summarizeMainWireStandard66ValidationEnvelopeCliV1([
          ...args,
          "--output",
          outputPath,
        ]);

      expect(first.summary.status).toBe("envelope-summarized");
      expect(readFileSync(outputPath, "utf8")).toBe(`${first.serialized}\n`);
      expect(first.serialized).toBe(canonicalJsonStringify(first.summary));
      expect(first.receipt).toMatchObject({
        status: "envelope-summarized",
        caseCount: 17,
        metricCount: MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_METRICS_V1.length,
        unavailableReasonCount: null,
        summarySha256: await sha256CanonicalJsonHex(first.summary),
        outputPath,
      });

      await expect(
        summarizeMainWireStandard66ValidationEnvelopeCliV1([
          ...args,
          "--output",
          outputPath,
        ]),
      ).rejects.toMatchObject({ code: "EEXIST" });
      await expect(
        summarizeMainWireStandard66ValidationEnvelopeCliV1([
          ...args,
          "--output",
          outputPath,
          "--force",
        ]),
      ).resolves.toMatchObject({
        receipt: { status: "envelope-summarized", caseCount: 17 },
      });
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it("persists an unavailable scientific summary but rejects CLI and source-file errors", async () => {
    const temporaryDirectory = mkdtempSync(
      path.join(os.tmpdir(), "standard66-envelope-cli-unavailable-"),
    );
    try {
      const artifacts = await completedEnvelopeArtifactsV1(boundedSmoke);
      artifacts[16] = artifacts[0]!;
      const inputPaths = await writeArtifactsV1(temporaryDirectory, artifacts);
      const args = inputPaths.flatMap((inputPath) => ["--input", inputPath]);
      const outputPath = path.join(temporaryDirectory, "unavailable.json");
      const result =
        await summarizeMainWireStandard66ValidationEnvelopeCliV1([
          ...args,
          "--output",
          outputPath,
        ]);

      expect(result.summary.status).toBe("unavailable");
      expect(result.receipt).toMatchObject({
        status: "unavailable",
        caseCount: null,
        metricCount: null,
        unavailableReasonCount: 2,
        outputPath,
      });
      expect(readFileSync(outputPath, "utf8")).toBe(`${result.serialized}\n`);

      await expect(
        summarizeMainWireStandard66ValidationEnvelopeCliV1(args.slice(0, -2)),
      ).rejects.toThrow(/exactly 17 --input/);
      await expect(
        summarizeMainWireStandard66ValidationEnvelopeCliV1([
          ...args,
          "--force",
        ]),
      ).rejects.toThrow(/--force requires --output/);

      writeFileSync(inputPaths[0]!, "{}\n", "utf8");
      await expect(
        summarizeMainWireStandard66ValidationEnvelopeCliV1(args),
      ).rejects.toThrow(/validation artifact/);
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});

async function writeArtifactsV1(
  directory: string,
  artifacts: readonly MainWireStandard66ValidationRunArtifactV1[],
): Promise<string[]> {
  return Promise.all(
    artifacts.map(async (artifact, index) => {
      const inputPath = path.join(directory, `input-${index}.json`);
      writeFileSync(
        inputPath,
        `${await serializeMainWireStandard66ValidationRunArtifactV1(artifact)}\n`,
        "utf8",
      );
      return inputPath;
    }),
  );
}

async function completedEnvelopeArtifactsV1(
  boundedSmoke: MainWireStandard66ValidationArmResultV1,
): Promise<MainWireStandard66ValidationRunArtifactV1[]> {
  return Promise.all(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.map(
      async (envelopeCase, index) =>
        createMainWireStandard66ValidationRunArtifactV1({
          study: Object.freeze({
            studyKind: "validation-envelope" as const,
            caseId: envelopeCase.caseId,
          }),
          armResult: await completedArmForCaseV1(
            boundedSmoke,
            envelopeCase,
            index,
          ),
        }),
    ),
  );
}

async function completedArmForCaseV1(
  boundedSmoke: MainWireStandard66ValidationArmResultV1,
  envelopeCase: MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
  index: number,
): Promise<MainWireStandard66ValidationArmResultV1> {
  const arm = structuredClone(boundedSmoke) as any;
  const construction = {
    ...arm.protocolIdentity.exactConstruction,
    hemodynamicResearchInputs: envelopeCase.hemodynamicResearchInputs,
  };
  arm.executionPurpose = "preregistered-validation";
  arm.protocolIdentity.executionPurpose = "preregistered-validation";
  arm.protocolIdentity.exactConstruction = construction;
  arm.comparisonCohortIdentity.exactConstruction = construction;
  arm.settlement.executionPurpose = "preregistered-settling";
  arm.settlement.status = "period1-settled";
  arm.settlement.numericalPeriod1Established = true;
  arm.settlement.terminalAcceptedTimeSec = 48;
  arm.settlement.terminalAcceptedRevision = 24_000;
  arm.settlement.failure = null;
  arm.confirmation = {
    runnerId: MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
    protocolIdentityId:
      MAIN_WIRE_STANDARD66_P1_CONFIRMATION_PROTOCOL_IDENTITY_V1_ID,
    protocolIdentityHash: "1".repeat(64),
    settlementProtocolIdentityHash: arm.settlement.protocolIdentityHash,
    status: "period1-confirmed",
    clock: {
      armId: "dt-2ms-production",
      requestedStepSec: 0.002,
      anchoredRequestedGridOriginSec: 0,
      requestedGridPhaseResetAtConfirmationStart: false,
      acceptedStepsMayBeShortenedAtModelEvents: true,
    },
    settlementTerminal: {
      acceptedTimeSec: 48,
      acceptedRevision: 24_000,
      wasExactCoronaryWindowBoundary: true,
    },
    freshSuffix: {
      firstReferenceBoundaryTimeSec: 48,
      firstReferenceBoundaryRevision: 24_000,
      comparisonCount: 3,
      consecutivePeriod1Closures: 3,
      requiredConsecutivePeriod1Closures: 3,
      failedClosureResetsConsecutiveCount: true,
      observations: [],
    },
    counters: {
      advanceCallCount: 1_500,
      requestedGridLandingCount: 1_500,
      internalAcceptedCommitCount: 1_500,
      eventClippedAcceptedCommitCount: 0,
      completedCoronaryWindowCount: 3,
    },
    numericalPeriod1Confirmed: true,
    terminalAcceptedTimeSec: 51,
    terminalAcceptedRevision: 25_500,
    failure: null,
  };
  arm.status = "terminal-analysis-complete";
  arm.modeEligibility = {
    testOnlyBoundedSmoke: false,
    eligibleForPreregisteredSingleArmMeasurement: true,
  };
  arm.outcomes = outcomesV1(index);
  arm.failure = null;
  arm.constructionIdentityHash = await sha256CanonicalJsonHex(construction);
  arm.comparisonCohortIdentityHash = await sha256CanonicalJsonHex(
    arm.comparisonCohortIdentity,
  );
  arm.protocolIdentity.comparisonCohortIdentityHash =
    arm.comparisonCohortIdentityHash;
  arm.protocolIdentityHash = await sha256CanonicalJsonHex(arm.protocolIdentity);
  return arm as MainWireStandard66ValidationArmResultV1;
}

async function boundedSmokeArtifactForCaseV1(
  boundedSmoke: MainWireStandard66ValidationArmResultV1,
  envelopeCase: MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
): Promise<MainWireStandard66ValidationRunArtifactV1> {
  const arm = structuredClone(boundedSmoke) as any;
  const construction = {
    ...arm.protocolIdentity.exactConstruction,
    hemodynamicResearchInputs: envelopeCase.hemodynamicResearchInputs,
  };
  arm.protocolIdentity.exactConstruction = construction;
  arm.comparisonCohortIdentity.exactConstruction = construction;
  arm.constructionIdentityHash = await sha256CanonicalJsonHex(construction);
  arm.comparisonCohortIdentityHash = await sha256CanonicalJsonHex(
    arm.comparisonCohortIdentity,
  );
  arm.protocolIdentity.comparisonCohortIdentityHash =
    arm.comparisonCohortIdentityHash;
  arm.protocolIdentityHash = await sha256CanonicalJsonHex(arm.protocolIdentity);
  return createMainWireStandard66ValidationRunArtifactV1({
    study: Object.freeze({
      studyKind: "validation-envelope" as const,
      caseId: envelopeCase.caseId,
    }),
    armResult: arm,
  });
}

function outcomesV1(index: number): any {
  const value = (base: number) => base + index;
  const captureSource = {
    startAtrialCaptureId: `start-${index}`,
    endAtrialCaptureId: `end-${index}`,
  };
  const pressureWindow = (
    windowSec: 0.005 | 0.01 | 0.02,
    maximum: number,
    minimum: number,
  ) => ({
    role: windowSec === 0.01 ? "primary" : "sensitivity",
    windowSec,
    result: {
      methodId: MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID,
      configurationIdentity:
        mainWireLeftVentricularPressureRateConfigurationIdentityV1(windowSec),
    },
    maximumPositiveMmHgPerSec: maximum,
    minimumNegativeMmHgPerSec: minimum,
  });
  return {
    traceProvenance: {
      traceRunnerId: MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
    },
    terminalBeatMeasurements: {
      evaluatorId:
        MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID,
      source: captureSource,
      flowEventTiming: {
        methodId: MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID,
      },
      requiredFlowEventMeasurements: {
        aorticEjectionDurationSec: {
          status: "available",
          value: 0.18 + index * 0.001,
        },
        isovolumicContractionDurationSec: {
          status: "available",
          value: 0.04 + index * 0.001,
        },
        isovolumicRelaxationDurationSec: {
          status: "available",
          value: 0.06 + index * 0.001,
        },
        teiLike: { status: "available", value: 0.5 + index * 0.01 },
      },
      aorticFlowDurationAudit: {
        positiveFlowDurationSec: 0.2 + index * 0.001,
      },
      completedBeatMeasurements: {
        aorticLocalHydraulicForwardGradient: {
          meanMmHg: value(2),
          peakMmHg: value(4),
        },
        aorticVenaContractaBernoulliForwardGradient: {
          meanMmHg: value(3),
          peakMmHg: value(5),
        },
        primaryStrokeVolumeAoVForwardMl: value(60),
        primaryMeanSystemicArterialPressureMmHg: value(90),
        primaryModeledAorticVmaxMPerSec: 1 + index * 0.01,
      },
      pressureRate: {
        primaryWindowSec: 0.01,
        windows: [
          pressureWindow(0.005, value(1_700), -value(1_700)),
          pressureWindow(0.01, value(1_500), -value(1_500)),
          pressureWindow(0.02, value(1_300), -value(1_300)),
        ],
      },
      waveformAudit: {
        absoluteLeftVentricularPressureMmHg: rangeV1(value(5), value(125)),
        aorticProximalConstitutivePortPressureMmHg: rangeV1(
          value(70),
          value(120),
        ),
        absoluteSystemicArterialPressureMmHg: rangeV1(value(65), value(115)),
        absoluteHistoricalAorticNodePressureMmHg: rangeV1(
          value(68),
          value(118),
        ),
      },
    },
    aorticOutflowShapeDiagnostic: {
      methodId: MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID,
      source: captureSource,
      configuredMaximumForwardEoa: { areaCm2: 3.5 },
      reconstructedActiveEoa: {
        maximumAcceptedEndpoint: {
          areaCm2: 3.45 - index * 0.001,
          fractionOfConfiguredMaximum01: (3.45 - index * 0.001) / 3.5,
        },
        flowWeightedMeanAreaCm2: 3.3 - index * 0.001,
        flowWeightedMeanFractionOfConfiguredMaximum01:
          (3.3 - index * 0.001) / 3.5,
      },
      forwardFlowShape: {
        positiveFlowDurationSec: 0.2 + index * 0.001,
        strokeVolumeMl: value(60),
        timeWeightedMeanFlowMlPerSec: value(300),
        timeWeightedRmsFlowMlPerSec: value(330),
        peakFlowMlPerSec: value(450),
        shapeFactors: {
          peakToMean: 1.5 + index * 0.001,
          rmsToMean: 1.1 + index * 0.001,
          meanToPeak: 2 / 3 + index * 0.001,
        },
      },
      flowEventTimingEvidence: {
        methodId: MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID,
      },
      modelFlowEjectionEpisode: {
        status: "available",
        timeFromOpeningToFirstPeakSec: 0.06 + index * 0.001,
        timeFromOpeningToFirstPeakFraction01: 0.3 + index * 0.001,
        forwardVolumeWithinEpisodeMl: value(59),
        flowCentroidFromOpeningSec: 0.09 + index * 0.001,
        flowCentroidFromOpeningFraction01: 0.45 + index * 0.001,
        forwardVolumeFractions: {
          earlyThird: 0.4 + index * 0.001,
          middleThird: 0.4,
          lateThird: 0.2 - index * 0.001,
        },
      },
    },
  };
}

function rangeV1(minimum: number, maximum: number) {
  return { minimum, maximum, pulse: maximum - minimum };
}
