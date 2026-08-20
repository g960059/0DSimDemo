import { describe, expect, it } from "vitest";

import {
  createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1,
  createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelPeriodicSteadyV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("integrated Main V3 regular-sinus all-off periodic experiment", () => {
  it("owns the predeclared V3 policy/scales and makes every MCS circuit explicitly all-off with zero inertance", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3).toMatchObject({
      policyId:
        "integrated-full-accepted-state-periodic-policy-v3-preregistered",
      coronaryAutoregulationResponseTimeConstantSec: 25,
      maximumCycleCount: 250,
    });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
    ).toMatchObject({
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

  it("keeps model condition identity stable across numerical-only changes and moves both identities for physical/model changes", async () => {
    const baseFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const identityHashes = async (
      fixture: Parameters<
        typeof createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1
      >[0],
      protocol: Readonly<{
        executionPurpose?: "bounded-smoke" | "canonical-evidence";
        nominalDtSec?: number;
        maximumCycleCount?: number;
      }> = {},
    ) =>
      Object.freeze({
        condition: await sha256CanonicalJsonHex(
          createMainWireIntegratedModelPeriodicConditionIdentityPayloadEngineeringV1(
            fixture,
          ),
        ),
        protocol: await sha256CanonicalJsonHex(
          createMainWireIntegratedModelPeriodicProtocolIdentityPayloadV3(
            fixture,
            {
              executionPurpose: protocol.executionPurpose ?? "bounded-smoke",
              nominalDtSec: protocol.nominalDtSec ?? 0.002,
              maximumCycleCount: protocol.maximumCycleCount ?? 2,
            },
          ),
        ),
      });

    const base = await identityHashes(baseFixture);
    expect(await identityHashes(baseFixture)).toEqual(base);

    for (const numericalProtocolOnly of [
      await identityHashes(baseFixture, { nominalDtSec: 0.001 }),
      await identityHashes(baseFixture, { maximumCycleCount: 1 }),
    ]) {
      expect(numericalProtocolOnly.condition).toBe(base.condition);
      expect(numericalProtocolOnly.protocol).not.toBe(base.protocol);
    }

    const newtonPolicyFixture = Object.freeze({
      ...baseFixture,
      coronaryStepInput: Object.freeze({
        ...baseFixture.coronaryStepInput,
        circulationNewtonOptions: Object.freeze({
          ...baseFixture.coronaryStepInput.circulationNewtonOptions,
          scaledResidualInfinityTolerance:
            baseFixture.coronaryStepInput.circulationNewtonOptions
              .scaledResidualInfinityTolerance * 2,
        }),
      }),
    });
    const newtonPolicy = await identityHashes(newtonPolicyFixture);
    expect(newtonPolicy.condition).toBe(base.condition);
    expect(newtonPolicy.protocol).not.toBe(base.protocol);

    const peepFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3({
        ...baseFixture.hemodynamicResearchInputs,
        peepCmH2O: 5,
      });
    const valveAreaFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
        baseFixture.hemodynamicResearchInputs,
        1,
        {
          ...baseFixture.mechanismResearchInputs,
          valveAreas: {
            ...baseFixture.mechanismResearchInputs.valveAreas,
            AoV: {
              ...baseFixture.mechanismResearchInputs.valveAreas.AoV,
              maximumForwardEoaCm2: 3.45,
            },
          },
        },
      );
    const contractilityFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
        baseFixture.hemodynamicResearchInputs,
        1.1,
        baseFixture.mechanismResearchInputs,
      );

    for (const physicalOrModelCondition of [
      await identityHashes(peepFixture),
      await identityHashes(valveAreaFixture),
      await identityHashes(contractilityFixture),
    ]) {
      expect(physicalOrModelCondition.condition).not.toBe(base.condition);
      expect(physicalOrModelCondition.protocol).not.toBe(base.protocol);
    }
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
    });
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.modelConditionIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.modelConditionIdentityId).toBe(
      "main-wire-integrated-model-periodic-condition-identity-engineering-v1",
    );
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
    expect(result.terminalCycleStartTraceSample).toBeNull();
    expect(result.terminalTransmuralBoundaryWorkEngineering).toMatchObject({
      status: "input-gates-not-passed",
      engineeringProjectionOnly: true,
      sourceProvenanceVerified: false,
      officialQualificationEstablished: false,
      gates: {
        startBoundaryProvided: false,
        acceptedPathTraceComplete: false,
      },
    });
    expect(result.terminalPressureBasisDecompositionEngineering).toMatchObject({
      status: "projection-not-computed",
      pathSegmentCandidateCount: 0,
      engineeringProjectionOnly: true,
      periodicityEstablished: false,
      sourceProvenanceVerified: false,
      pvaEstablished: false,
      leftVentricle: { failureReasons: ["start-point-not-provided"] },
      rightVentricle: { failureReasons: ["start-point-not-provided"] },
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
  }, 60_000);

  it("binds a two-cycle real-model trace to its exact prior endpoint and reports all three Engineering pressure bases", async () => {
    const result = await runMainWireIntegratedModelPeriodicSteadyV3({
      nominalDtSec: 0.01,
      maximumCycleCount: 2,
      executionPurpose: "bounded-smoke",
    });

    expect(result.completedCycleCount).toBe(2);
    expect(result.terminalCycleStartTraceSample).not.toBeNull();
    expect(result.terminalCycleStartTraceSample?.acceptedTimeSec).toBe(
      result.terminalCycleTrace.startTimeSec,
    );
    expect(result.terminalCycleStartTraceSample?.cycleIndex).toBe(1);
    expect(result.terminalCycleTrace.cycleIndex).toBe(2);
    expect(result.modelConditionIdentityHash).toMatch(/^[0-9a-f]{64}$/);

    const transmural = result.terminalTransmuralBoundaryWorkEngineering;
    expect(transmural).toMatchObject({
      projectionId:
        "main-wire-integrated-model-periodic-transmural-boundary-work-engineering-projection-v1",
      modelConditionIdentityHash: result.modelConditionIdentityHash,
      sourceCycleIndex: 2,
      acceptedSegmentCount: result.terminalCycleTrace.sampleCount,
      engineeringProjectionOnly: true,
      sourceProvenanceVerified: false,
      officialQualificationEstablished: false,
      publicOutputEstablished: false,
      pvaEstablished: false,
    });
    expect(transmural.leftVentricle.transmuralPathWorkMmHgMl).not.toBeNull();
    expect(transmural.rightVentricle.transmuralPathWorkMmHgMl).not.toBeNull();

    const pressureBasis = result.terminalPressureBasisDecompositionEngineering;
    expect(pressureBasis).toMatchObject({
      projectionId:
        "main-wire-integrated-model-periodic-pressure-basis-decomposition-engineering-projection-v1",
      pathSegmentCandidateCount: result.terminalCycleTrace.sampleCount,
      engineeringProjectionOnly: true,
      acceptedEndpointIdentityVerified: false,
      periodicityEstablished: false,
      sourceProvenanceVerified: false,
      historicalQualificationTransferred: false,
      officialQualificationEstablished: false,
      publicOutputEstablished: false,
      commonPericardiumStoredEnergyEstablished: false,
      perChamberPericardialEnergyAllocationEstablished: false,
      wholeHeartExternalConstraintWorkEstablished: false,
      pvaEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });
    for (const chamber of [
      {
        pressureBasis: pressureBasis.leftVentricle,
        transmural: transmural.leftVentricle,
      },
      {
        pressureBasis: pressureBasis.rightVentricle,
        transmural: transmural.rightVentricle,
      },
    ]) {
      expect(
        chamber.pressureBasis.pathWorkMmHgMl["cavity-absolute-pressure"],
      ).not.toBeNull();
      expect(
        chamber.pressureBasis.pathWorkMmHgMl["ventricular-transmural-pressure"],
      ).not.toBeNull();
      expect(
        chamber.pressureBasis.pathWorkMmHgMl["external-constraint-pressure"],
      ).not.toBeNull();
      expect(
        chamber.pressureBasis.pathWorkMmHgMl["ventricular-transmural-pressure"],
      ).toBe(chamber.transmural.transmuralPathWorkMmHgMl);
      expect(chamber.pressureBasis.decompositionResidualMmHgMl).not.toBeNull();
      expect(
        Math.abs(
          chamber.pressureBasis.decompositionResidualMmHgMl ??
            Number.POSITIVE_INFINITY,
        ),
      ).toBeLessThanOrEqual(1e-8);
      expect(
        chamber.pressureBasis.decompositionResidualWithinNumericalTolerance,
      ).toBe(true);
    }
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
  });
});
