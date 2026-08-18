import { describe, expect, it } from "vitest";

import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
  runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1,
  runMainWireIntegratedModelPeriodicSteadyV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";

describe("integrated Main V3 regular-sinus all-off periodic experiment", () => {
  it("owns the predeclared V3 policy/scales and makes every MCS circuit explicitly all-off with zero inertance", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3).toMatchObject({
      policyId:
        "integrated-full-accepted-state-periodic-policy-v3-preregistered",
      coronaryAutoregulationResponseTimeConstantSec: 25,
      maximumCycleCount: 250,
    });
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3)
      .toMatchObject({
        scaleSetId:
          "fixed-dimensional-reference-scales-integrated-composed-rhythm-v3",
        dynamicMcsAcceptedFlowMlPerSecByDevice: {
          LVAD: 100,
          IMPELLA: 50,
          VA_ECMO: 100,
          VV_ECMO: 100,
        },
        generatedCalciumRiseDrive: 1,
        generatedCalciumDecayDrive: 1,
        generatedAvRelativeTimingSec: 1,
        generatedNextSourceRelativeTimingSec: 1,
        generatedPendingRelativeTimingSec: 1,
        generatedPendingActivationStrength01: 1,
      });

    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    expect(fixture.rhythm.configuration.atrialSource.mode).toBe("regular");
    expect(fixture.rhythm.configuration.authoredEctopySchedule.events).toEqual(
      [],
    );
    expect(
      fixture.rhythm.configuration.authoredVentricularPacingReplay,
    ).toBeNull();
    expect([
      fixture.config.lvad.enabled,
      fixture.config.impella.enabled,
      fixture.config.vaEcmo.enabled,
      fixture.config.vvEcmo.enabled,
    ]).toEqual([false, false, false, false]);
    for (const circuit of Object.values(fixture.profile.inertanceByDevice)) {
      expect(
        Object.values(circuit).filter((value) => typeof value === "number"),
      ).toEqual([0, 0, 0, 0]);
    }
    expect(
      Object.values(
        fixture.cold.acceptedState.dynamicMechanicalSupport
          .acceptedFlowMlPerSec,
      ),
    ).toEqual([0, 0, 0, 0]);
  });

  it("advances one canonical-provider cycle with exact event ownership, conservation, raw trace, healthy projection, and V3 checkpoint", async () => {
    const result = await runMainWireIntegratedModelPeriodicSteadyV3({
      nominalDtSec: 0.002,
      maximumCycleCount: 1,
      executionPurpose: "bounded-smoke",
    });

    expect(result).toMatchObject({
      executionPurpose: "bounded-smoke",
      requestedMaximumCycleCount: 1,
      completedCycleCount: 1,
      terminationReason: "maximum-cycles-reached",
      requestedHorizonCompleted: true,
      earlyClassificationStopEligible: true,
      numericalPeriod1Established: false,
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
      terminalCheckpointExactRoundTripVerified: true,
      allCyclesFiniteConservedAndEventExact: true,
      numericalAccess: {
        accessId:
          "main-wire-integrated-model-periodic-standard-numerical-access-v3",
        minimumNominalDtSec: 0.001,
        maximumNominalDtSec: 0.01,
        refinementEvidenceOnly: false,
      },
    });
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.modelConditionIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.classification.status).toBe("not-converged");
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]!.evidenceRole).toBe(
      "bounded-exploration-only",
    );

    const cycle = result.cycles[0]!;
    expect(cycle).toMatchObject({
      cycleIndex: 1,
      startTimeSec: 0,
      endTimeSec: 1,
      coronaryAutoregulationWindow: {
        windowIndex: 0,
        startTimeSec: 0,
        endTimeSec: 1,
      },
      finiteAndEventIdentityChecks: {
        allRawValuesFinite: true,
        exactlyOneAtrialCapture: true,
        exactlyOneVentricularCapture: true,
        exactlyTwoDeliveredCalciumDeposits: true,
        oneComposedCalciumOwnerOnly: true,
        allDynamicMcsAcceptedFlowsExactlyZero: true,
        passed: true,
      },
      conservation: { withinInheritedConstructionTolerances: true },
    });
    expect(cycle.acceptedAtrialCaptureIds).toHaveLength(1);
    expect(cycle.acceptedVentricularCaptureIds).toHaveLength(1);
    expect(cycle.deliveredCalciumDepositIds).toHaveLength(2);
    expect(cycle.period1.provenance).toMatchObject({
      sourcePeriodSec: 1,
      periodLag: 1,
      acceptedTimeAdvanceSec: 1,
      regularSourceSequenceAdvance: 1,
      atrialCaptureCountAdvance: 1,
      ventricularCaptureCountAdvance: 1,
      deliveredCalciumDepositCountAdvance: 2,
    });
    expect(Object.keys(cycle.period1.groups)).toEqual([
      "coronary-v3",
      "dynamic-mcs-q",
      "regular-source",
      "electrical-capture",
      "proximal-av",
      "distal-conduction",
      "ventricular-backup",
      "interval-strength",
      "pending-events",
      "five-wall-calcium",
    ]);

    expect(result.terminalCycleTrace).toMatchObject({
      cycleIndex: 1,
      startTimeSec: 0,
      endTimeSec: 1,
      retainedForGraphShapeInspection: true,
      resamplingApplied: false,
      shapeAcceptanceClaimed: false,
    });
    expect(result.terminalCycleTrace.sampleCount).toBe(cycle.acceptedStepCount);
    expect(result.terminalCycleTrace.samples.length).toBeGreaterThan(400);
    for (const sample of result.terminalCycleTrace.samples) {
      expect(Object.values(sample.dynamicMcsAcceptedFlowMlPerSec)).toEqual([
        0, 0, 0, 0,
      ]);
    }

    expect(result.terminalPeriodicExternalWork).toMatchObject({
      status: "not-qualified",
      acceptedSegmentCount: 0,
      biventricularExternalWorkEstablished: false,
      syntheticEndToStartClosingSegmentApplied: false,
      gates: {
        protocolIdentityValid: true,
        modelConditionIdentityValid: true,
        canonicalPeriod1Established: false,
        terminalCycleOwnsLatestPeriod1Evidence: false,
        terminalCycleIntegrityPassed: true,
        previousCycleTerminalBoundaryAvailable: false,
        acceptedPathTraceComplete: false,
      },
      leftVentricle: {
        pathWorkMmHgMl: null,
        externalWorkMmHgMl: null,
        failureReasons: [
          "canonical-period1-not-established",
          "previous-cycle-terminal-boundary-unavailable",
        ],
      },
      rightVentricle: {
        pathWorkMmHgMl: null,
        externalWorkMmHgMl: null,
      },
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });

    const projection = result.terminalHealthyReferenceProjection;
    expect(projection.assessmentEligibility).toMatchObject({
      eligible: false,
      numericalPeriod1Established: false,
      executionPurpose: "bounded-smoke",
    });
    expect(projection.gateResults).toHaveLength(6);
    expect(
      projection.gateResults.every((gate) => gate.status === "not-assessed"),
    ).toBe(true);
    expect(projection.metric.lvEndDiastolicVolumeMl).toBeGreaterThan(
      projection.metric.lvEndSystolicVolumeMl,
    );
    expect(projection.metric.nativeAorticForwardVolumeMl).toBeGreaterThan(0);
    expect(projection.metric.nativeAorticCardiacOutputLPerMin).toBeGreaterThan(
      0,
    );
    expect(
      projection.metric.nativeAorticCardiacIndexLPerMinPerM2,
    ).toBeGreaterThan(0);
    expect(
      Number.isFinite(projection.metric.pulmonaryArterySystolicPressureMmHg),
    ).toBe(true);
    expect(
      Number.isFinite(projection.metric.leftAtrialTimeWeightedMeanPressureMmHg),
    ).toBe(true);
    expect(result.terminalCheckpoint.checkpointSha256).toMatch(
      /^[0-9a-f]{64}$/,
    );

    const alternateDt = await runMainWireIntegratedModelPeriodicSteadyV3({
      nominalDtSec: 0.005,
      maximumCycleCount: 1,
      executionPurpose: "bounded-smoke",
    });
    expect(alternateDt.modelConditionIdentityId).toBe(
      result.modelConditionIdentityId,
    );
    expect(alternateDt.modelConditionIdentityHash).toBe(
      result.modelConditionIdentityHash,
    );
    expect(alternateDt.protocolIdentityHash).not.toBe(
      result.protocolIdentityHash,
    );

    const alteredOxygenBoundary =
      await runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.005,
        maximumCycleCount: 1,
        executionPurpose: "bounded-smoke",
        mechanismResearchInputs: {
          ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
          oxygenTransport: {
            ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
              .oxygenTransport,
            hemoglobinGPerDl: 14.9,
          },
        },
      });
    expect(alteredOxygenBoundary.modelConditionIdentityHash).not.toBe(
      result.modelConditionIdentityHash,
    );
  }, 60_000);

  it("keeps the shared 1 ms trajectory exact while giving the preregistered refinement arm a distinct protocol identity", async () => {
    const options = {
      nominalDtSec: 0.001,
      maximumCycleCount: 1,
      executionPurpose: "bounded-smoke" as const,
    };
    const standard = await runMainWireIntegratedModelPeriodicSteadyV3(
      options,
    );
    const refinement =
      await runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1(
        options,
      );

    expect(refinement.numericalAccess).toEqual({
      accessId:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
      minimumNominalDtSec: 0.0005,
      maximumNominalDtSec: 0.001,
      maximumAcceptedStepCountPerCycle: 2_200,
      refinementEvidenceOnly: true,
    });
    expect(refinement.modelConditionIdentityHash).toBe(
      standard.modelConditionIdentityHash,
    );
    expect(refinement.protocolIdentityHash).not.toBe(
      standard.protocolIdentityHash,
    );
    expect(refinement.terminalCheckpoint.checkpointSha256).toBe(
      standard.terminalCheckpoint.checkpointSha256,
    );
    const {
      protocolIdentityHash: standardWorkProtocolIdentityHash,
      ...standardPressureBasisWork
    } = standard.terminalPeriodicPressureBasisWork;
    const {
      protocolIdentityHash: refinementWorkProtocolIdentityHash,
      ...refinementPressureBasisWork
    } = refinement.terminalPeriodicPressureBasisWork;
    expect(refinementWorkProtocolIdentityHash).not.toBe(
      standardWorkProtocolIdentityHash,
    );
    expect(refinementPressureBasisWork).toEqual(standardPressureBasisWork);
  }, 60_000);

  it("fails closed outside the bounded/canonical cycle caps or with unknown options", async () => {
    await expect(
      runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.002,
        maximumCycleCount: 3,
        executionPurpose: "bounded-smoke",
      }),
    ).rejects.toThrow(/1 through 2/);
    await expect(
      runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.002,
        maximumCycleCount: 251,
        executionPurpose: "fixed-horizon-characterization",
      }),
    ).rejects.toThrow(/1 through 250/);
    await expect(
      runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.002,
        unexpected: true,
      } as never),
    ).rejects.toThrow(/unexpected fields/);
    await expect(
      runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1({
        nominalDtSec: 0.0004,
        maximumCycleCount: 1,
        executionPurpose: "bounded-smoke",
      }),
    ).rejects.toThrow(/exactly 0\.001 or 0\.0005/);
  });
});
