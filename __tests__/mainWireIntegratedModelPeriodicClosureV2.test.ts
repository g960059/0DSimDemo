import { describe, expect, it } from "vitest";

import {
  NON_CORONARY_CIRCULATION_BE_V1_ID,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CORONARY_ACCEPTED_AUTOREGULATION_STATE_V3_ID,
  createCoronaryAutoregulationWindowBindingV3,
  createDefaultCoronaryAutoregulationWindowControlV3,
  type CoronaryAcceptedAutoregulationStateV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import type {
  CoronaryConservedVolumeStateV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  CORONARY_TOPOLOGY_ID_V2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
} from "@/engine/coronary/typesV2";
import { createMechanicalSupportConfigV1 } from
  "@/engine/devices/defaultsV1";
import {
  createDynamicMechanicalSupportAcceptedStateV1,
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportAcceptedStateV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import type {
  MechanicalSupportConfigV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_CLAIM_V2,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2,
  assessMainWireIntegratedModelSinglePeriodNumericalClosureV2,
  compareMainWireIntegratedModelAcceptedStatesV2,
  type MainWireIntegratedModelPeriodicAcceptedStateV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_CLAIM_V2,
  classifyMainWireIntegratedModelPeriodicityV2,
  type MainWireIntegratedModelPeriodicCycleObservationV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV2";
import type {
  MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV2";
import type {
  MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV3";
import {
  commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1,
  evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  type AcceptedGeneratedFiveWallRhythmCalciumStateV1,
} from "@/engine/myocardium/rhythm/acceptedGeneratedFiveWallRhythmCalciumOwnerV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

const EXACTNESS_DIAGNOSTIC_NORMALIZED_TOLERANCE = 1e-10;

describe("MainWireIntegratedModelPeriodicClosureV2", () => {
  it("closes a phase-shifted regular-sinus state and reports every accepted owner", () => {
    const fixture = periodicFixture();
    const report = compareMainWireIntegratedModelAcceptedStatesV2(
      fixture.current,
      fixture.reference,
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2,
    );

    expect(report.provenance).toMatchObject({
      sourcePeriodSec: 1,
      acceptedTimeAdvanceSec: 1,
      revisionAdvance: 1,
      nextSourceIndexAdvance: 1,
      avAcceptedActivationCountAdvance: 1,
      avConductedActivationCountAdvance: 1,
      avBlockedActivationCountAdvance: 0,
      pendingEffectiveActivationCount: 1,
      pendingLineageAdvanceByPeriodLag: true,
    });
    expect(report.groups["coronary-v3"].entryCount).toBe(125);
    expect(report.groups["dynamic-mcs-accepted-flow"].entryCount).toBe(4);
    expect(report.groups["generated-calcium"].entryCount).toBe(10);
    expect(report.groups["generated-av-relative-timing"].entryCount).toBe(3);
    expect(report.groups["generated-next-source-relative-timing"].entryCount)
      .toBe(1);
    expect(report.groups["generated-pending-effective-activation"].entryCount)
      .toBe(2);
    expect(report.overall).toMatchObject({
      coronaryNumericEntryCount: 122,
      integratedNumericEntryCount: 20,
      numericEntryCount: 142,
      booleanEntryCount: 3,
      entryCount: 145,
      pendingEffectiveActivationCount: 1,
    });
    expect(report.overall.maximumNormalizedDelta).toBeLessThanOrEqual(
      EXACTNESS_DIAGNOSTIC_NORMALIZED_TOLERANCE,
    );
    expect(report.compatibilityGates).toEqual({
      integratedTransactionIdentityExact: true,
      generatedBindingAndConfigExact: true,
      dynamicMcsInertanceProfileExact: true,
      dynamicMcsStructuralConfigProjectionExact: true,
      coronaryV3CompatibilityAndEmptyWindowsSatisfied: true,
      pendingEventClassTargetsAndLineageExact: true,
    });
    expect(assessMainWireIntegratedModelSinglePeriodNumericalClosureV2(
      report,
      EXACTNESS_DIAGNOSTIC_NORMALIZED_TOLERANCE,
    ))
      .toMatchObject({
        withinFullAcceptedStateNumericalTolerance: true,
        period1EvidenceEstablished: false,
        physiologicalAcceptanceEstablished: false,
        releaseAcceptanceEstablished: false,
      });
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_CLAIM_V2)
      .toMatchObject({
        fixedClosureEntryCount: 143,
        pendingEffectiveActivationNumericEntriesPerEvent: 2,
        irregularOrFlutterApplicability: "not-applicable-fail-closed",
        normalizedTolerancePolicy:
          "caller-supplied-preregistered-numerical-policy-not-embedded-acceptance",
        physiologicalAcceptanceClaimed: false,
        releaseAcceptanceClaimed: false,
      });
  });

  it("detects q, calcium, and normalized pending-event timing perturbations", () => {
    const fixture = periodicFixture();
    const qPerturbed = replaceDynamic(
      fixture.current,
      Object.freeze({
        ...fixture.current.dynamicMechanicalSupport,
        acceptedFlowMlPerSec: Object.freeze({
          ...fixture.current.dynamicMechanicalSupport.acceptedFlowMlPerSec,
          LVAD: fixture.current.dynamicMechanicalSupport
            .acceptedFlowMlPerSec.LVAD + 2,
        }),
      }),
    );
    const qReport = compare(qPerturbed, fixture.reference);
    expect(qReport.groups["dynamic-mcs-accepted-flow"]).toMatchObject({
      maximumNormalizedDelta: 0.02,
      worstPath: "dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD",
    });

    const calcium = fixture.current.generatedRhythmCalcium;
    const lvfw = calcium.calciumStateByWall.LVFW;
    const calciumPerturbed = replaceGenerated(
      fixture.current,
      Object.freeze({
        ...calcium,
        calciumStateByWall: Object.freeze({
          ...calcium.calciumStateByWall,
          LVFW: Object.freeze([lvfw[0], lvfw[1] + 0.01] as const),
        }),
      }),
    );
    const calciumReport = compare(calciumPerturbed, fixture.reference);
    expect(calciumReport.groups["generated-calcium"].maximumNormalizedDelta)
      .toBeCloseTo(0.01, 14);
    expect(calciumReport.groups["generated-calcium"].worstPath)
      .toContain("LVFW.decayDrive");

    const eventPerturbed = replaceGenerated(
      fixture.current,
      perturbPendingEventTime(
        fixture.current.generatedRhythmCalcium,
        0.004,
      ),
    );
    const eventReport = compare(eventPerturbed, fixture.reference);
    expect(eventReport.groups["generated-pending-effective-activation"]
      .maximumNormalizedDelta).toBeCloseTo(0.004, 14);
    expect(eventReport.groups["generated-pending-effective-activation"]
      .worstPath).toContain("activationTimeSecRelativeToAcceptedBoundary");
  });

  it("rejects generated binding and dynamic profile substitution", () => {
    const fixture = periodicFixture();
    const foreignOwner = periodicOwner("foreign");
    const foreignCurrentGenerated = advanceGenerated(
      foreignOwner.acceptedState,
      1,
    );
    expect(() => compare(
      replaceGenerated(fixture.current, foreignCurrentGenerated),
      fixture.reference,
    )).toThrow(/generated binding compatibility differs/);

    const foreignProfile = profile("foreign-profile", 0.02);
    const foreignDynamic = createDynamicMechanicalSupportAcceptedStateV1(
      foreignProfile,
      fixture.config,
      flowRecord(),
    );
    expect(() => compare(
      replaceDynamic(fixture.current, foreignDynamic),
      fixture.reference,
    )).toThrow(/inertance profile differs/);

    const baselineForwardCap = fixture.config.lvad.maximumForwardFlowLMin;
    if (baselineForwardCap === null) {
      throw new Error("periodic closure fixture must declare a forward cap");
    }
    const structuralConfig = createMechanicalSupportConfigV1({
      lvad: { maximumForwardFlowLMin: baselineForwardCap + 1 },
    });
    const structuralDynamic = createDynamicMechanicalSupportAcceptedStateV1(
      fixture.current.dynamicMechanicalSupport.inertanceProfileSnapshot,
      structuralConfig,
      flowRecord(),
    );
    expect(() => compare(
      replaceDynamic(fixture.current, structuralDynamic),
      fixture.reference,
    )).toThrow(/structural config differs/);
  });

  it("supports P1/P2 lags and rejects other clock or source-counter advances", () => {
    const fixture = periodicFixture();
    const twoPeriodGenerated = advanceGenerated(
      fixture.reference.generatedRhythmCalcium,
      2,
    );
    const twoPeriod = integratedState(
      1,
      2,
      coronaryState({ revision: 1, timeSec: 2 }),
      twoPeriodGenerated,
      fixture.current.dynamicMechanicalSupport,
    );
    const period2 = compare(twoPeriod, fixture.reference);
    expect(period2.provenance).toMatchObject({
      periodLag: 2,
      acceptedTimeAdvanceSec: 2,
      nextSourceIndexAdvance: 2,
      avAcceptedActivationCountAdvance: 2,
      avConductedActivationCountAdvance: 2,
      avBlockedActivationCountAdvance: 0,
      pendingLineageAdvanceByPeriodLag: true,
    });
    expect(period2.overall.maximumNormalizedDelta).toBeLessThanOrEqual(
      EXACTNESS_DIAGNOSTIC_NORMALIZED_TOLERANCE,
    );

    const threePeriodGenerated = advanceGenerated(
      fixture.reference.generatedRhythmCalcium,
      3,
    );
    const threePeriod = integratedState(
      1,
      3,
      coronaryState({ revision: 1, timeSec: 3 }),
      threePeriodGenerated,
      fixture.current.dynamicMechanicalSupport,
    );
    expect(() => compare(threePeriod, fixture.reference))
      .toThrow(/exactly one or two source periods/);

    const noRevisionGenerated = Object.freeze({
      ...fixture.current.generatedRhythmCalcium,
      revision: 0,
      generatorState: Object.freeze({
        ...fixture.current.generatedRhythmCalcium.generatorState,
        revision: 0,
      }),
    });
    const noRevision = integratedState(
      0,
      1,
      coronaryState({ revision: 0, timeSec: 1 }),
      noRevisionGenerated,
      fixture.current.dynamicMechanicalSupport,
    );
    expect(() => compare(noRevision, fixture.reference))
      .toThrow(/accepted revision must strictly advance/);

    const generator = fixture.current.generatedRhythmCalcium.generatorState;
    const badCounter = replaceGenerated(
      fixture.current,
      Object.freeze({
        ...fixture.current.generatedRhythmCalcium,
        generatorState: Object.freeze({
          ...generator,
          nextSourceIndex: generator.nextSourceIndex - 1,
          nextSourceActivationTimeSec:
            generator.nextSourceActivationTimeSec - 1,
        }),
      }),
    );
    expect(() => compare(badCounter, fixture.reference))
      .toThrow(/next source time|AV accepted count/);
  });

  it("fails closed for incomplete or extra pending effective-event lineage", () => {
    const fixture = periodicFixture();
    const generated = fixture.current.generatedRhythmCalcium;
    const incomplete = replaceGenerated(
      fixture.current,
      Object.freeze({
        ...generated,
        generatorState: Object.freeze({
          ...generated.generatorState,
          pendingActivationEvents: Object.freeze([]),
        }),
      }),
    );
    expect(() => compare(incomplete, fixture.reference))
      .toThrow(/lineage is incomplete or extra/);

    const event = generated.generatorState.pendingActivationEvents[0]!;
    const extra = replaceGenerated(
      fixture.current,
      Object.freeze({
        ...generated,
        generatorState: Object.freeze({
          ...generated.generatorState,
          pendingActivationEvents: Object.freeze([event, event]),
        }),
      }),
    );
    expect(() => compare(extra, fixture.reference))
      .toThrow(/duplicates a deterministic pending activation/);
  });

  it("classifies three provenance-linked P1 or P2 cycles without physiology acceptance", () => {
    const fixture = periodicFixture();
    const boundaries = periodicBoundaries(fixture, 4);
    const protocolIdentityHash = "b".repeat(64);
    const observations = boundaries.slice(1).map((current, index) => {
      const cycleIndex = index + 1;
      return Object.freeze({
        cycleIndex,
        evidenceRole: "canonical-periodic-protocol" as const,
        protocolIdentityHash,
        period1: compare(current, boundaries[index]!),
        period2: cycleIndex < 2
          ? null
          : compare(current, boundaries[index - 1]!),
      });
    });
    const options = Object.freeze({
      period1NormalizedTolerance: 1e-10,
      period2NormalizedTolerance: 1e-10,
      period2MinimumPeriod1NormalizedDelta: 5e-3,
      consecutiveCycles: 3,
    });
    expect(classifyMainWireIntegratedModelPeriodicityV2(
      observations.slice(0, 3),
      options,
    )).toMatchObject({
      status: "period1-converged",
      evidenceCycleIndices: [1, 2, 3],
      physiologicalAcceptanceEstablished: false,
      releaseAcceptanceEstablished: false,
    });

    const period2Observations = observations.slice(1, 4).map((observation) =>
      Object.freeze({
        ...observation,
        period1: withMaximumNormalizedDelta(observation.period1!, 0.01),
      }));
    expect(classifyMainWireIntegratedModelPeriodicityV2(
      period2Observations,
      options,
    )).toMatchObject({
      status: "period2-suspect",
      evidenceCycleIndices: [2, 3, 4],
      physiologicalAcceptanceEstablished: false,
      releaseAcceptanceEstablished: false,
    });

    const explorationOnly = observations.slice(0, 3).map((observation) =>
      Object.freeze({
        ...observation,
        evidenceRole: "bounded-exploration-only" as const,
      }));
    expect(classifyMainWireIntegratedModelPeriodicityV2(
      explorationOnly,
      options,
    ).status).toBe("not-converged");
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_CLAIM_V2)
      .toMatchObject({
        period1ComparisonLag: 1,
        period2ComparisonLag: 2,
        physiologicalAcceptanceClaimed: false,
        releaseAcceptanceClaimed: false,
      });

    const incompatible = [...observations.slice(0, 3)];
    incompatible[1] = Object.freeze({
      ...incompatible[1]!,
      protocolIdentityHash: "c".repeat(64),
    });
    expect(() => classifyMainWireIntegratedModelPeriodicityV2(
      incompatible,
      options,
    )).toThrow(/different protocol identities/);
  });
});

function periodicBoundaries(
  fixture: ReturnType<typeof periodicFixture>,
  cycleCount: number,
): readonly MainWireIntegratedModelPeriodicAcceptedStateV2[] {
  const states: MainWireIntegratedModelPeriodicAcceptedStateV2[] = [
    fixture.reference,
  ];
  let generated = fixture.reference.generatedRhythmCalcium;
  for (let cycleIndex = 1; cycleIndex <= cycleCount; cycleIndex += 1) {
    generated = advanceGenerated(generated, cycleIndex);
    states.push(integratedState(
      cycleIndex,
      cycleIndex,
      coronaryState({ revision: cycleIndex, timeSec: cycleIndex }),
      generated,
      fixture.current.dynamicMechanicalSupport,
    ));
  }
  return Object.freeze(states);
}

function withMaximumNormalizedDelta(
  report: NonNullable<
    MainWireIntegratedModelPeriodicCycleObservationV2["period1"]
  >,
  maximumNormalizedDelta: number,
) {
  return Object.freeze({
    ...report,
    overall: Object.freeze({
      ...report.overall,
      maximumNormalizedDelta,
    }),
  });
}

type PeriodicFixture = Readonly<{
  reference: MainWireIntegratedModelPeriodicAcceptedStateV2;
  current: MainWireIntegratedModelPeriodicAcceptedStateV2;
  config: MechanicalSupportConfigV1;
}>;

function periodicFixture(): PeriodicFixture {
  const owner = periodicOwner("reference");
  const referenceGenerated = owner.acceptedState;
  const currentGenerated = advanceGenerated(referenceGenerated, 1);
  const config = createMechanicalSupportConfigV1();
  const inertanceProfile = profile("reference-profile", 0.01);
  const acceptedFlow = flowRecord({
    LVAD: 20,
    IMPELLA: -2,
    VA_ECMO: 40,
    VV_ECMO: 30,
  });
  const referenceDynamic = createDynamicMechanicalSupportAcceptedStateV1(
    inertanceProfile,
    config,
    acceptedFlow,
  );
  const currentDynamic = createDynamicMechanicalSupportAcceptedStateV1(
    inertanceProfile,
    config,
    acceptedFlow,
  );
  return Object.freeze({
    reference: integratedState(
      0,
      0,
      coronaryState({ revision: 0, timeSec: 0 }),
      referenceGenerated,
      referenceDynamic,
    ),
    current: integratedState(
      1,
      1,
      coronaryState({ revision: 1, timeSec: 1 }),
      currentGenerated,
      currentDynamic,
    ),
    config,
  });
}

function periodicOwner(suffix: string) {
  return createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      bindingId: `periodic-closure-${suffix}-binding`,
      generatorConfigId: `periodic-closure-${suffix}-config`,
      generatorInstanceId: `periodic-closure-${suffix}-instance`,
      sourceId: `periodic-closure-${suffix}-source`,
    },
  );
}

function advanceGenerated(
  reference: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  candidateTimeSec: number,
): AcceptedGeneratedFiveWallRhythmCalciumStateV1 {
  const trial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
    reference,
    candidateTimeSec,
    reference.binding,
  );
  return commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
    reference,
    trial,
    reference.binding,
  );
}

function compare(
  current: MainWireIntegratedModelPeriodicAcceptedStateV2,
  reference: MainWireIntegratedModelPeriodicAcceptedStateV2,
) {
  return compareMainWireIntegratedModelAcceptedStatesV2(
    current,
    reference,
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2,
  );
}

function integratedState(
  revision: number,
  acceptedTimeSec: number,
  coronary: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  generatedRhythmCalcium: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1,
): MainWireIntegratedModelPeriodicAcceptedStateV2 {
  return Object.freeze({
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID,
    revision,
    acceptedTimeSec,
    coronary,
    generatedRhythmCalcium,
    dynamicMechanicalSupport,
  });
}

function replaceGenerated(
  state: MainWireIntegratedModelPeriodicAcceptedStateV2,
  generatedRhythmCalcium: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
): MainWireIntegratedModelPeriodicAcceptedStateV2 {
  return Object.freeze({ ...state, generatedRhythmCalcium });
}

function replaceDynamic(
  state: MainWireIntegratedModelPeriodicAcceptedStateV2,
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1,
): MainWireIntegratedModelPeriodicAcceptedStateV2 {
  return Object.freeze({ ...state, dynamicMechanicalSupport });
}

function perturbPendingEventTime(
  generated: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  deltaSec: number,
): AcceptedGeneratedFiveWallRhythmCalciumStateV1 {
  const event = generated.generatorState.pendingActivationEvents[0]!;
  const shiftedEvent = Object.freeze({
    ...event,
    activationTimeSec: event.activationTimeSec + deltaSec,
    calciumEvent: Object.freeze({
      ...event.calciumEvent,
      timeSec: event.calciumEvent.timeSec + deltaSec,
    }),
  });
  return Object.freeze({
    ...generated,
    generatorState: Object.freeze({
      ...generated.generatorState,
      pendingActivationEvents: Object.freeze([shiftedEvent]),
    }),
  });
}

function profile(
  suffix: string,
  pumpInternalMmHgSec2PerMl: number,
): DynamicMechanicalSupportInertanceProfileV1 {
  const sameInertance = inertance(pumpInternalMmHgSec2PerMl);
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId: `integrated-periodic-${suffix}`,
    profileBindingSha256: "a".repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: deviceBinding("LVAD", suffix, "1"),
      IMPELLA: deviceBinding("IMPELLA", suffix, "2"),
      VA_ECMO: deviceBinding("VA_ECMO", suffix, "3"),
      VV_ECMO: deviceBinding("VV_ECMO", suffix, "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: sameInertance,
      IMPELLA: sameInertance,
      VA_ECMO: sameInertance,
      VV_ECMO: sameInertance,
    }),
  });
}

function deviceBinding(
  deviceId: RotarySupportDeviceIdV1,
  suffix: string,
  hex: string,
) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId: `integrated-periodic-${deviceId}-${suffix}`,
    circuitProfileBindingSha256: hex.repeat(64),
  });
}

function inertance(
  pumpInternalMmHgSec2PerMl: number,
): DynamicRotaryPumpCircuitInertanceV1 {
  return Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  });
}

function flowRecord(
  overrides: Partial<Record<RotarySupportDeviceIdV1, number>> = {},
) {
  return Object.freeze({
    LVAD: 0,
    IMPELLA: 0,
    VA_ECMO: 0,
    VV_ECMO: 0,
    ...overrides,
  });
}

function coronaryState(
  options: Readonly<{ revision: number; timeSec: number }>,
): MainWireFiveWallCoronaryPeriodicAcceptedStateV3 {
  const base = coronaryBaseState(options);
  const binding = createCoronaryAutoregulationWindowBindingV3({
    originAcceptedTimeSec: 0,
    durationSec: 1,
    interpretation: "periodic-sinus-cycle-aligned",
  });
  const autoregulation = Object.freeze({
    stateId: CORONARY_ACCEPTED_AUTOREGULATION_STATE_V3_ID,
    windowIndex: Math.floor(options.timeSec + 1e-12),
    windowOriginAcceptedTimeSec: 0,
    windowStartAcceptedTimeSec: options.timeSec,
    windowStartRevision: options.revision,
    acceptedDurationSec: 0,
    acceptedStepCount: 0,
    qmTimeIntegralMlByTerritoryLayer: layerRecord(0),
    perfusionPressureTimeIntegralMmHgSecByTerritory: territoryRecord(0),
    windowControl: null,
    desiredControl: createDefaultCoronaryAutoregulationWindowControlV3(),
  }) satisfies CoronaryAcceptedAutoregulationStateV3;
  return Object.freeze({
    ...base,
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID,
    coronaryAutoregulationBinding: binding,
    coronaryAutoregulation: autoregulation,
  });
}

function coronaryBaseState(
  options: Readonly<{ revision: number; timeSec: number }>,
): MainWireFiveWallCoronaryPeriodicAcceptedStateV2 {
  const fixedGlobalTotalBloodVolumeMl = 5600;
  const coronaryVolumeMlByNode = Object.freeze(Object.fromEntries(
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId) => [nodeId, 1]),
  )) as CoronaryConservedVolumeStateV2;
  const coronaryBloodVolumeMl = Object.values(coronaryVolumeMlByNode)
    .reduce((sum, volume) => sum + volume, 0);
  const fixedNodeVolumes = Object.freeze({
    LV: 120,
    LA: 50,
    RV: 130,
    RA: 55,
    Ao: 140,
    SA: 150,
    Art: 160,
    Cap: 170,
    VC: 190,
    PA: 80,
    PArt: 90,
    PCap: 100,
    PVen: 110,
    PVein: 120,
  });
  const nonSvBloodVolumeMl = Object.values(fixedNodeVolumes)
    .reduce((sum, volume) => sum + volume, 0);
  const nodeVolumesMl = Object.freeze({
    LV: fixedNodeVolumes.LV,
    LA: fixedNodeVolumes.LA,
    RV: fixedNodeVolumes.RV,
    RA: fixedNodeVolumes.RA,
    Ao: fixedNodeVolumes.Ao,
    SA: fixedNodeVolumes.SA,
    Art: fixedNodeVolumes.Art,
    Cap: fixedNodeVolumes.Cap,
    SV: fixedGlobalTotalBloodVolumeMl - coronaryBloodVolumeMl
      - nonSvBloodVolumeMl,
    VC: fixedNodeVolumes.VC,
    PA: fixedNodeVolumes.PA,
    PArt: fixedNodeVolumes.PArt,
    PCap: fixedNodeVolumes.PCap,
    PVen: fixedNodeVolumes.PVen,
    PVein: fixedNodeVolumes.PVein,
  });
  const wallStateByWall = Object.freeze({
    LA: wallState(),
    LVFW: wallState(),
    SEP: wallState(),
    RVFW: wallState(),
    RA: wallState(),
  });
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    revision: options.revision,
    acceptedTimeSec: options.timeSec,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBinding: Object.freeze({
      topologyId: CORONARY_TOPOLOGY_ID_V2,
      priorFingerprint: "fnv1a32-11111111",
      collapseHydraulicsFingerprint: "fnv1a32-22222222",
      boundaryResolverId: MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
      impMechanism: "cep-shortening-induced" as const,
      shorteningImpPriorFingerprint: "fnv1a32-33333333",
      mvcReferenceSemantics:
        "previous-accepted-mitral-closure-fiber-strain-v1" as const,
    }),
    circulation: Object.freeze({
      transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
      revision: options.revision,
      acceptedTimeSec: options.timeSec,
      totalBloodVolumeMl: fixedGlobalTotalBloodVolumeMl
        - coronaryBloodVolumeMl,
      nodeVolumesMl,
      dynamicEdgeFlowsMlPerSec: Object.freeze({ Ao_SA: 10, PA_PArt: 8 }),
      valveStates: Object.freeze({
        MV: Object.freeze({ leafletOpeningFraction01: 0.2 }),
        AoV: Object.freeze({ leafletOpeningFraction01: 0.3 }),
        TV: Object.freeze({ leafletOpeningFraction01: 0.4 }),
        PV: Object.freeze({ leafletOpeningFraction01: 0.5 }),
      }),
    }),
    coronary: Object.freeze({
      acceptedTimeSec: options.timeSec,
      revision: options.revision,
      volumeMlByNode: coronaryVolumeMlByNode,
      toneResistanceScaleByTerritoryLayer: layerRecord(1),
    }),
    mechanics: Object.freeze({
      contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
      providerId: "integrated-periodic-test-provider-v1",
      parameterSetId: "integrated-periodic-test-prior-v1",
      parameterIdentityHash: "integrated-periodic-same-provider-parameters",
      stateSchemaVersion: 2,
      revision: options.revision,
      acceptedTimeSec: options.timeSec,
      acceptedVolumesMl: Object.freeze({
        LA: nodeVolumesMl.LA,
        LV: nodeVolumesMl.LV,
        RA: nodeVolumesMl.RA,
        RV: nodeVolumesMl.RV,
      }),
      materialState: Object.freeze({
        wallStateByWall,
        trisegCoordinates: Object.freeze({
          septalMidwallCapVolumeM3: 42e-6,
          junctionRadiusM: 0.033,
        }),
      }),
      materialStateFingerprint: "integrated-periodic-test-fingerprint",
    }),
    mvcReferenceState: Object.freeze({
      reference: Object.freeze({
        referenceFiberLogStrainByWall: Object.freeze({
          LVFW: 0.1,
          SEP: 0.08,
          RVFW: 0.06,
        }),
      }),
      referenceAcceptedTimeSec: Math.max(0, options.timeSec - 0.1),
      referenceRevision: Math.max(0, options.revision - 1),
      mitralForwardFlowActive: false,
      acceptedMitralClosureEventCount: Math.floor(options.timeSec),
    }),
  });
}

function wallState() {
  return Object.freeze({
    landState: Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]),
    slsState: Object.freeze({ viscousLogStrain: 0.01 }),
    previousFiberLogStrain: 0.01,
    previousFreeCalciumUM: 0.1,
  });
}

function layerRecord(value: number): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId) => [layerId, value]),
    ))],
  ))) as CoronaryTerritoryLayerRecordV2<number>;
}

function territoryRecord(value: number): CoronaryTerritoryRecordV2<number> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, value],
  ))) as CoronaryTerritoryRecordV2<number>;
}
