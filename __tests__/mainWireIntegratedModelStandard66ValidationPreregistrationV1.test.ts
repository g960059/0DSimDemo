import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_PEAK_FRACTION_V1,
  MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import {
  MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID,
  mainWireLeftVentricularPressureRateConfigurationIdentityV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_HELD_OUT_LOADS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_STAGE_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_PROTOCOL_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_RESOLUTION_IV_BASE_TABLE_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIRS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1,
  deriveMainWireIntegratedModelStandard66ValidationAorticVmaxV1,
  evaluateMainWireIntegratedModelStandard66ValidationDtGateV1,
  validateMainWireIntegratedModelStandard66ValidationEnvelopeV1,
  type MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";
import {
  MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";

describe("Standard66 validation preregistration V1", () => {
  it("pins the production, intermediate, and reference clocks and every unordered pair", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1)
      .toEqual([
        {
          armId: "dt-2ms-production",
          requestedStepSec: 0.002,
          role: "production",
        },
        {
          armId: "dt-1ms-intermediate",
          requestedStepSec: 0.001,
          role: "intermediate",
        },
        {
          armId: "dt-0p5ms-reference",
          requestedStepSec: 0.0005,
          role: "reference",
        },
      ]);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIRS_V1)
      .toHaveLength(3);
    expect(new Set(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIRS_V1
        .map(({ pairId }) => pairId),
    ).size).toBe(3);
    expect(Object.isFrozen(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
    )).toBe(true);
  });

  it("builds exactly default plus the explicit 16-run resolution-IV fraction", () => {
    const envelope =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1;
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_RESOLUTION_IV_BASE_TABLE_V1)
      .toHaveLength(16);
    expect(envelope).toHaveLength(17);
    expect(() =>
      validateMainWireIntegratedModelStandard66ValidationEnvelopeV1(envelope))
      .not.toThrow();
    expect(envelope[0]).toMatchObject({
      caseId: "default",
      designKind: "default",
      signs: null,
      hemodynamicResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    });

    const fractional = envelope.slice(1);
    const ids = fractional.map(({ caseId }) => caseId);
    const tupleKeys = envelope.map(({ hemodynamicResearchInputs }) =>
      MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3
        .map((key) => `${key}=${hemodynamicResearchInputs[key]}`)
        .join("|"));
    expect(new Set(ids).size).toBe(16);
    expect(new Set(tupleKeys).size).toBe(17);
    expect(new Set(fractional.map(({ signs }) => [
      signs!.AHeartRate,
      signs!.BSystemicResistance,
      signs!.CPulmonaryResistance,
      signs!.DTotalBloodVolume,
    ].join("/"))).size).toBe(16);

    for (const candidate of fractional) {
      const signs = candidate.signs!;
      expect(signs.EVenousTone).toBe(
        signs.AHeartRate
          * signs.BSystemicResistance
          * signs.CPulmonaryResistance,
      );
      expect(signs.FArterialStiffness).toBe(
        signs.AHeartRate
          * signs.BSystemicResistance
          * signs.DTotalBloodVolume,
      );
      expect(signs.GPeep).toBe(
        signs.AHeartRate
          * signs.CPulmonaryResistance
          * signs.DTotalBloodVolume,
      );
      expect(candidate.claim).toEqual({
        publicRangeEndpointStudy: false,
        fullCartesianStudy: false,
        coldConstructibilityClaimedByProtocol: false,
        exactColdFixtureAdmissionRequiredBeforeRun: true,
      });
    }
    for (const signKey of [
      "AHeartRate",
      "BSystemicResistance",
      "CPulmonaryResistance",
      "DTotalBloodVolume",
      "EVenousTone",
      "FArterialStiffness",
      "GPeep",
    ] as const) {
      expect(fractional.filter(({ signs }) => signs![signKey] === -1))
        .toHaveLength(8);
      expect(fractional.filter(({ signs }) => signs![signKey] === 1))
        .toHaveLength(8);
    }
  });

  it("rejects duplicate case identities and complete input tuples", () => {
    const envelope = [
      ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
    ];
    const duplicateId = envelope.map((candidate, index) => index === 1
      ? Object.freeze({ ...candidate, caseId: "default" as const })
      : candidate) as readonly MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1[];
    expect(() =>
      validateMainWireIntegratedModelStandard66ValidationEnvelopeV1(duplicateId))
      .toThrow(/duplicate.*case id/);

    const duplicateTuple = envelope.map((candidate, index) => index === 2
      ? Object.freeze({
        ...candidate,
        hemodynamicResearchInputs: envelope[1]!.hemodynamicResearchInputs,
      })
      : candidate) as readonly MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1[];
    expect(() =>
      validateMainWireIntegratedModelStandard66ValidationEnvelopeV1(
        duplicateTuple,
      )).toThrow(/duplicate.*input tuple/);
  });

  it("uses fixed-reference gates with pair-order-invariant absolute differences", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1)
      .toEqual([
        expect.objectContaining({
          metricId: "aortic-ejection-time",
          absoluteFloor: 0.002,
          referenceRelativeFraction: 0,
        }),
        expect.objectContaining({
          metricId: "aortic-local-hydraulic-mean-gradient",
          absoluteFloor: 0.25,
          referenceRelativeFraction: 0.02,
        }),
        expect.objectContaining({
          metricId: "aortic-local-hydraulic-peak-gradient",
          absoluteFloor: 0.25,
          referenceRelativeFraction: 0.02,
        }),
        expect.objectContaining({
          metricId: "aortic-vena-contracta-bernoulli-mean-gradient",
          absoluteFloor: 0.25,
          referenceRelativeFraction: 0.02,
        }),
        expect.objectContaining({
          metricId: "aortic-vena-contracta-bernoulli-peak-gradient",
          absoluteFloor: 0.25,
          referenceRelativeFraction: 0.02,
        }),
        expect.objectContaining({
          metricId: "stroke-volume",
          absoluteFloor: 1,
          referenceRelativeFraction: 0.01,
        }),
        expect.objectContaining({
          metricId: "mean-arterial-pressure",
          absoluteFloor: 0.5,
          referenceRelativeFraction: 0.01,
        }),
        expect.objectContaining({
          metricId: "aortic-vmax",
          absoluteFloor: 0.02,
          referenceRelativeFraction: 0.01,
        }),
        expect.objectContaining({
          metricId: "lv-pressure-maximum-dp-dt",
          absoluteFloor: 50,
          referenceRelativeFraction: 0.03,
        }),
        expect.objectContaining({
          metricId: "lv-pressure-minimum-dp-dt",
          absoluteFloor: 50,
          referenceRelativeFraction: 0.03,
        }),
      ]);
    const values = Object.freeze({
      "dt-2ms-production": 20.5,
      "dt-1ms-intermediate": 20.2,
      "dt-0p5ms-reference": -20,
    });
    const forward =
      evaluateMainWireIntegratedModelStandard66ValidationDtGateV1(
        "aortic-local-hydraulic-mean-gradient",
        "dt-2ms-production",
        "dt-1ms-intermediate",
        values,
      );
    const reversed =
      evaluateMainWireIntegratedModelStandard66ValidationDtGateV1(
        "aortic-local-hydraulic-mean-gradient",
        "dt-1ms-intermediate",
        "dt-2ms-production",
        values,
      );
    expect(forward).toEqual(reversed);
    expect(forward).toMatchObject({
      pairId: "dt-2ms-vs-dt-1ms",
      referenceMagnitude: 20,
      tolerance: 0.4,
      passed: true,
    });
    expect(forward.absoluteDifference).toBeCloseTo(0.3, 14);

    const equality =
      evaluateMainWireIntegratedModelStandard66ValidationDtGateV1(
        "aortic-ejection-time",
        "dt-2ms-production",
        "dt-0p5ms-reference",
        Object.freeze({
          "dt-2ms-production": 0.202,
          "dt-1ms-intermediate": 0.201,
          "dt-0p5ms-reference": 0.2,
        }),
      );
    expect(equality.tolerance).toBe(0.002);
    expect(equality.passed).toBe(true);
    expect(() =>
      evaluateMainWireIntegratedModelStandard66ValidationDtGateV1(
        "aortic-vmax",
        "dt-1ms-intermediate",
        "dt-0p5ms-reference",
        Object.freeze({
          "dt-2ms-production": -0,
          "dt-1ms-intermediate": -0,
          "dt-0p5ms-reference": -0,
        }),
      )).not.toThrow();
    expect(() =>
      evaluateMainWireIntegratedModelStandard66ValidationDtGateV1(
        "stroke-volume",
        "dt-2ms-production",
        "dt-2ms-production",
        values,
      )).toThrow(/unsupported.*clock pair/);
  });

  it("binds every gate to a preregistered measurement station and method", () => {
    const bindings =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1;
    expect(bindings.aorticEjectionTime).toEqual({
      gateMetricId: "aortic-ejection-time",
      analysisMethodId:
        MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID,
      analysisMetric: "modelFlowEventAorticEjectionDurationSec",
      eventDefinition:
        "AVO-to-AVC-at-one-percent-of-same-beat-positive-AoV-flow-peak",
      peakFraction01:
        MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_PEAK_FRACTION_V1,
      excludedSubstituteOutputId:
        "hemodynamics.duration.valve-forward-flow.AoV",
      excludedSubstituteMeaning: "Q_AoV-strictly-positive-duration",
    });
    expect(bindings.aorticGradients).toEqual([
      {
        gateMetricId: "aortic-local-hydraulic-mean-gradient",
        station: "local-hydraulic",
        statistic: "mean",
        exactOutputId:
          "hemodynamics.pressure-gradient.valve.mean-local-hydraulic-forward.AoV",
      },
      {
        gateMetricId: "aortic-local-hydraulic-peak-gradient",
        station: "local-hydraulic",
        statistic: "peak",
        exactOutputId:
          "hemodynamics.pressure-gradient.valve.peak-local-hydraulic-forward.AoV",
      },
      {
        gateMetricId: "aortic-vena-contracta-bernoulli-mean-gradient",
        station: "vena-contracta-bernoulli",
        statistic: "mean",
        exactOutputId:
          "hemodynamics.pressure-gradient.valve.mean-vena-contracta-bernoulli-forward.AoV",
      },
      {
        gateMetricId: "aortic-vena-contracta-bernoulli-peak-gradient",
        station: "vena-contracta-bernoulli",
        statistic: "peak",
        exactOutputId:
          "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV",
      },
    ]);
    expect(bindings.strokeVolume).toMatchObject({
      primaryOutputId: "hemodynamics.valve-volume.forward.AoV",
      auditOnlyOutputId: "hemodynamics.stroke-volume.LV-event-defined",
      auditOutputMayReplacePrimaryGate: false,
    });
    expect(bindings.meanArterialPressure).toMatchObject({
      primaryOutputId: "hemodynamics.pressure.mean.SA",
      excludedHistoricalOutputId: "hemodynamics.pressure.mean.Ao",
      historicalAorticNodeMayReplacePrimaryGate: false,
    });

    const exactOutputIds = new Set(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
    );
    for (const outputId of [
      bindings.aorticEjectionTime.excludedSubstituteOutputId,
      ...bindings.aorticGradients.map(({ exactOutputId }) => exactOutputId),
      bindings.strokeVolume.primaryOutputId,
      bindings.strokeVolume.auditOnlyOutputId,
      bindings.meanArterialPressure.primaryOutputId,
      bindings.meanArterialPressure.excludedHistoricalOutputId,
      bindings.aorticVmax.sourceOutputId,
    ]) {
      expect(exactOutputIds.has(outputId), outputId).toBe(true);
    }

    expect(bindings.aorticVmax).toMatchObject({
      valveConstants: {
        pascalPerMmHg: MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
        bloodDensityKgPerM3:
          MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
      },
      simplifiedBernoulliAudit: { mayReplacePrimaryGate: false },
      modeledDopplerLike: true,
      clinicalDopplerMeasurementClaimed: false,
    });
    expect(
      deriveMainWireIntegratedModelStandard66ValidationAorticVmaxV1(4),
    ).toBeCloseTo(Math.sqrt(
      2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2 * 4
        / MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
    ), 15);
    expect(() =>
      deriveMainWireIntegratedModelStandard66ValidationAorticVmaxV1(-1))
      .toThrow(/finite and nonnegative/);

    expect(bindings.leftVentricularPressureRate).toMatchObject({
      analysisMethodId:
        MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID,
      primaryConfigurationIdentity:
        mainWireLeftVentricularPressureRateConfigurationIdentityV1(0.01),
      pressureBasis: "absolute-left-ventricular",
      estimator: "centered-secant-over-full-window",
      primaryWindowSec: 0.01,
      sensitivityWindowsSec: [0.005, 0.02],
      sensitivityMayReplacePrimaryGate: false,
    });
    expect(bindings.status).toMatchObject({
      analysisOwned: true,
      preregisteredBeforeOutcomeInspection: true,
      exactFrameOutputReserved: false,
      clinicalMeasurementEquivalenceClaimed: false,
    });
  });

  it("pins a protocol rather than asserting that the envelope converges", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1)
      .toEqual({
        protocolId: "standard66-production-envelope-settling-v1",
        initialHorizonSec: 48,
        extensionSec: 25,
        maximumHorizonSec: 250,
        evaluationHorizonsSec: [
          48, 73, 98, 123, 148, 173, 198, 223, 248, 250,
        ],
        evaluationHorizonPolicy:
          "initial-horizon-then-fixed-extension-with-one-final-clamp-to-maximum",
        extensionMayNotCrossMaximumHorizon: true,
        maximumHorizonEvaluationRequired: true,
        terminalExtensionMayBeClippedToMaximumHorizon: true,
        classifier: "full-accepted-state-period-1",
        consecutiveP1ClosuresRequired: 3,
        failedClosureResetsConsecutiveCount: true,
        claim: {
          protocolOnly: true,
          convergenceOfAnyEnvelopeCaseClaimed: false,
          shorterAcceptedEventSubstepsPermitted: true,
        },
      });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1
        .status,
    ).toEqual({
      researchOnly: true,
      exactModelContract: false,
      outputRegistryContract: false,
      modelSurfaceContract: false,
      outcomeOrConvergenceClaim: false,
    });
  });

  it("orders mechanism knockouts and the closed geometry profile immutably", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_IDS_V1)
      .toEqual([
        "pressure-recovery",
        "aortic-opening-drive-raw-versus-local",
        "arterial-tangent-multiplier",
        "characteristic-impedance-resistance-split",
        "proximal-aortic-inertance",
        "land-active-tension-dynamics",
        "matched-alpha-aortic-valve-timing",
        "strong-bridge-exit",
      ]);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_PROTOCOL_V1)
      .toMatchObject({
        oneFactorAtATimeBeforeBundles: true,
        bundleStudyPermittedOnlyAfterOrderedKnockouts: true,
        status: "research-only",
      });
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1
      .orderedStages.map(({ stageId }) => stageId)).toEqual(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_STAGE_IDS_V1,
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1)
      .toMatchObject({
        localGeometryLawGateRequiredBeforeHeldOutLoads: true,
        parameterFittingAtHeldOutLoadsPermitted: false,
        status: "research-only",
      });
    expect(Object.isFrozen(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1.orderedStages,
    )).toBe(true);
  });

  it("keeps all envelope tuples and three physiology-named geometry loads exactly cold-constructible", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_HELD_OUT_LOADS_V1
      .map(({ loadId }) => loadId)).toEqual([
      "held-out-load-default",
      "held-out-load-high-forward-flow-stress",
      "held-out-load-low-flow-high-afterload-stress",
    ]);
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_HELD_OUT_LOADS_V1[1])
      .toMatchObject({
        physiology: "high-forward-flow-stress",
        hemodynamicResearchInputs: {
          heartRateBpm: 90,
          systemicResistance: 0.8,
          pulmonaryResistance: 0.5,
          totalBloodVolumeMl: 6_200,
          venousTone: 0.15,
          arterialStiffness: 0.75,
          peepCmH2O: 0,
        },
      });
    expect(MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_HELD_OUT_LOADS_V1[2])
      .toMatchObject({
        physiology: "low-flow-high-afterload-stress",
        hemodynamicResearchInputs: {
          heartRateBpm: 50,
          systemicResistance: 1.2,
          pulmonaryResistance: 0.75,
          totalBloodVolumeMl: 5_000,
          venousTone: 0.15,
          arterialStiffness: 0.75,
          peepCmH2O: 0,
        },
      });

    const fixtureAdapter =
      createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1()
        .executables.fixtureAdapter;
    const completeTuples = [
      ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.map(
        ({ caseId, hemodynamicResearchInputs }) => ({
          caseId: `envelope/${caseId}`,
          hemodynamicResearchInputs,
        }),
      ),
      ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_HELD_OUT_LOADS_V1.map(
        ({ loadId, hemodynamicResearchInputs }) => ({
          caseId: `geometry/${loadId}`,
          hemodynamicResearchInputs,
        }),
      ),
    ];
    expect(completeTuples).toHaveLength(20);
    for (const candidate of completeTuples) {
      expect(() => fixtureAdapter.validateCompleteFixture({
        context: Object.freeze({
          scenarioId: candidate.caseId,
          modelId:
            MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
        }),
        fixture: Object.freeze({
          ...MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
          hemodynamicResearchInputs: candidate.hemodynamicResearchInputs,
        }),
      }), candidate.caseId).not.toThrow();
    }
  });
});
