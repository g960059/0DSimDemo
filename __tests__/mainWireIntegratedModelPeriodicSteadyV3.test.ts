import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_CLAIM,
  MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  runMainWireIntegratedModelPeriodicSteadyV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  stepMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRelaxationProfileV1";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import {
  MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";

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

  it("keeps the legacy fixture literal while the fixed selected assembly composes its compatible controls without adding hemodynamic state", async () => {
    const legacy = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    expect(Object.keys(legacy)).toEqual([
      "hemodynamicResearchInputs",
      "ventricularContractilityScale",
      "mechanismResearchInputs",
      "provider",
      "runtime",
      "pericardium",
      "rhythm",
      "profile",
      "config",
      "dynamicMechanicalSupport",
      "coronaryStepInput",
      "cycleLengthSec",
      "cold",
    ]);
    expect(Object.keys(legacy.runtime.vascular)).toEqual([
      "venousTone",
      "arterialStiffness",
    ]);
    expect("selectedAorticOutflowProfile" in legacy.runtime.vascular)
      .toBe(false);
    expect("fixedAssemblyId" in legacy).toBe(false);
    expect(legacy.provider.parameterSetId)
      .not.toContain(MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID);
    expect(legacy.rhythm.configuration.avGateParameters
      .minimumConductionDelaySec).toBe(0.125);
    expect(legacy.rhythm.configuration.distalGate.hvConductionDelaySec)
      .toBe(0.0625);
    expect(legacy.rhythm.configuration.sinusAtrialCalciumDeposit
      .electricalToCalciumDelaySec).toBe(0.0625);
    expect(legacy.rhythm.configuration.ventricularCalciumDeposit
      .electricalToCalciumDelaySec).toBe(0.0625);

    const hemodynamicResearchInputs = Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      systemicResistance: 1.1,
      arterialStiffness: 0.8,
      heartRateBpm: 72,
      totalBloodVolumeMl: 5_700,
    });
    const defaultMechanism =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3;
    const mechanismResearchInputs = {
      ...defaultMechanism,
      valveAreas: {
        ...defaultMechanism.valveAreas,
        AoV: {
          ...defaultMechanism.valveAreas.AoV,
          maximumForwardEoaCm2: 3.25,
        },
      },
      chamberMechanics: {
        ...defaultMechanism.chamberMechanics,
        activeTensionScaleByWall: {
          ...defaultMechanism.chamberMechanics.activeTensionScaleByWall,
          LA: 1.01,
        },
        passiveStiffnessScaleByWall: {
          ...defaultMechanism.chamberMechanics.passiveStiffnessScaleByWall,
          LVFW: 1.02,
        },
      },
      pericardium: {
        ...defaultMechanism.pericardium,
        prescribedFluidVolumeMl: 5,
      },
      coronaryDisease: {
        ...defaultMechanism.coronaryDisease,
        focalDiameterLossFraction01ByTerritory: {
          ...defaultMechanism.coronaryDisease
            .focalDiameterLossFraction01ByTerritory,
          LAD: 0.05,
        },
      },
      oxygenTransport: {
        ...defaultMechanism.oxygenTransport,
        hemoglobinGPerDl: 13,
      },
    };
    const selected = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
      hemodynamicResearchInputs,
      1.05,
      mechanismResearchInputs,
    );
    expect(selected.fixedAssemblyId)
      .toBe(MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID);
    expect(selected.fixedAssemblyClaim)
      .toBe(MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_CLAIM);
    expect(selected.hemodynamicResearchInputs).toEqual(
      hemodynamicResearchInputs,
    );
    expect(selected.ventricularContractilityScale).toBe(1.05);
    expect(selected.mechanismResearchInputs.valveAreas.AoV
      .maximumForwardEoaCm2).toBe(3.25);
    expect(selected.mechanismResearchInputs.chamberMechanics
      .activeTensionScaleByWall.LA).toBe(1.01);
    expect(selected.mechanismResearchInputs.chamberMechanics
      .activeTensionScaleByWall.LVFW).toBe(1.05);
    expect(selected.mechanismResearchInputs.chamberMechanics
      .passiveStiffnessScaleByWall.LVFW).toBe(1.02);
    expect(selected.mechanismResearchInputs.pericardium
      .prescribedFluidVolumeMl).toBe(5);
    expect(selected.mechanismResearchInputs.coronaryDisease
      .focalDiameterLossFraction01ByTerritory.LAD).toBe(0.05);
    expect(selected.mechanismResearchInputs.oxygenTransport
      .hemoglobinGPerDl).toBe(13);
    expect(selected.cycleLengthSec).toBe(60 / 72);
    expect(selected.runtime.losses.systemicResistance).toBe(1.1);
    expect(selected.runtime.vascular.arterialStiffness).toBe(0.8);
    expect(selected.runtime.vascular.selectedAorticOutflowProfile)
      .toBe(MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1);
    expect(selected.runtime.valveResearchInput.valves.AoV
      .maximumForwardEoaCm2).toBe(3.25);
    expect(selected.provider.parameterSetId)
      .toContain(MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID);
    expect(selected.rhythm.configuration.avGateParameters
      .minimumConductionDelaySec).toBe(0.08);
    expect(selected.rhythm.configuration.distalGate.hvConductionDelaySec)
      .toBe(0.04);
    expect(selected.rhythm.configuration.sinusAtrialCalciumDeposit
      .electricalToCalciumDelaySec).toBe(0.012);
    expect(selected.rhythm.configuration.ventricularCalciumDeposit
      .electricalToCalciumDelaySec).toBe(0.012);
    const calciumDescriptor = selected.coronaryStepInput.calciumDriveParams;
    const exactVentricularCalcium =
      selected.rhythm.configuration.calciumParametersByWall.LVFW;
    expect(calciumDescriptor.parameterSetId)
      .toBe(
        MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID,
      );
    expect(calciumDescriptor.cycleLengthSec).toBe(selected.cycleLengthSec);
    expect(calciumDescriptor.ventricular.riseTimeConstantSec)
      .toBe(calciumDescriptor.ventricular.decayTimeConstantSec);
    expect(exactVentricularCalcium.tauRiseSec)
      .toBe(calciumDescriptor.ventricular.riseTimeConstantSec);
    expect(exactVentricularCalcium.tauDecaySec)
      .toBe(calciumDescriptor.ventricular.decayTimeConstantSec);

    expect(() =>
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
        MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        1,
        {
          ...defaultMechanism,
          chamberMechanics: {
            ...defaultMechanism.chamberMechanics,
            calciumDecayTimeScaleByWall: {
              ...defaultMechanism.chamberMechanics
                .calciumDecayTimeScaleByWall,
              LVFW: 1.1,
            },
          },
        },
      )
    ).toThrow(/requires unit calcium decay-time scales.*LVFW/);

    const legacyCirculation = legacy.cold.acceptedState.coronary.circulation;
    const selectedCirculation =
      selected.cold.acceptedState.coronary.circulation;
    expect(Object.keys(selectedCirculation))
      .toEqual(Object.keys(legacyCirculation));
    expect(Object.keys(selectedCirculation.nodeVolumesMl))
      .toEqual(Object.keys(legacyCirculation.nodeVolumesMl));
    expect(Object.keys(selectedCirculation.dynamicEdgeFlowsMlPerSec))
      .toEqual(Object.keys(legacyCirculation.dynamicEdgeFlowsMlPerSec));
    expect(Object.keys(selectedCirculation.valveStates))
      .toEqual(Object.keys(legacyCirculation.valveStates));
    for (const valveState of Object.values(selectedCirculation.valveStates)) {
      expect(Object.keys(valveState)).toEqual(["leafletOpeningFraction01"]);
    }
    expect(selected.provider.stateSchemaVersion)
      .toBe(legacy.provider.stateSchemaVersion);
    const legacyWallState =
      legacy.cold.acceptedState.coronary.mechanics.materialState.wallStateByWall;
    const selectedWallState =
      selected.cold.acceptedState.coronary.mechanics.materialState.wallStateByWall;
    expect(Object.keys(selectedWallState)).toEqual(Object.keys(legacyWallState));
    for (const wallId of ["LA", "LVFW", "SEP", "RVFW", "RA"] as const) {
      expect(Object.keys(selectedWallState[wallId]))
        .toEqual(Object.keys(legacyWallState[wallId]));
      expect(selectedWallState[wallId].landState.length)
        .toBe(legacyWallState[wallId].landState.length);
    }

    const stepped = stepMainWireIntegratedModelV3(
      selected.provider,
      selected.cold.acceptedState,
      Object.freeze({
        candidateTimeSec: 0.002,
        coronary: selected.coronaryStepInput,
        rhythm: Object.freeze({
          configuration: selected.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        }),
        dynamicMechanicalSupport: selected.dynamicMechanicalSupport,
      }),
    );
    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    const valveEvaluations =
      stepped.coronaryStep.baseStep.circulationTrial.valveEvaluations;
    expect(valveEvaluations.AoV.modelId)
      .toBe(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID);
    for (const valve of ["MV", "TV", "PV"] as const) {
      expect(valveEvaluations[valve].modelId)
        .toBe(MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID);
    }

    const selectedCheckpointContext =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        selected,
      );
    const selectedCheckpoint = await checkpointMainWireIntegratedModelV3(
      selectedCheckpointContext,
      selected.cold.acceptedState,
    );
    expect(await restoreMainWireIntegratedModelV3(
      selectedCheckpointContext,
      selectedCheckpoint,
    )).toEqual(selected.cold.acceptedState);
    const legacyCheckpointContext =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        legacy,
      );
    await expect(restoreMainWireIntegratedModelV3(
      legacyCheckpointContext,
      selectedCheckpoint,
    )).rejects.toThrow(/rhythm configuration.*identity mismatch/);
  }, 60_000);

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

  it("keeps a non-binary regular-sinus period on the coronary-owned boundary across consecutive cycles", async () => {
    const heartRateBpm = 65;
    const cycleLengthSec = 60 / heartRateBpm;
    const result = await runMainWireIntegratedModelPeriodicSteadyV3({
      nominalDtSec: 0.002,
      maximumCycleCount: 2,
      executionPurpose: "bounded-smoke",
      hemodynamicResearchInputs: Object.freeze({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        heartRateBpm,
      }),
    });

    expect(result.completedCycleCount).toBe(2);
    expect(result.cycles.map((cycle) => ({
      startTimeSec: cycle.startTimeSec,
      endTimeSec: cycle.endTimeSec,
      windowStartTimeSec: cycle.coronaryAutoregulationWindow.startTimeSec,
      windowEndTimeSec: cycle.coronaryAutoregulationWindow.endTimeSec,
      periodLag: cycle.period1.provenance.periodLag,
    }))).toEqual([
      {
        startTimeSec: 0,
        endTimeSec: cycleLengthSec,
        windowStartTimeSec: 0,
        windowEndTimeSec: cycleLengthSec,
        periodLag: 1,
      },
      {
        startTimeSec: cycleLengthSec,
        endTimeSec: 2 * cycleLengthSec,
        windowStartTimeSec: cycleLengthSec,
        windowEndTimeSec: 2 * cycleLengthSec,
        periodLag: 1,
      },
    ]);
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
