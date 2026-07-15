import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import {
  advancePhaseB1NormalSinusBeLivePeriodicControllerV1,
  initializePhaseB1NormalSinusBeLivePeriodicControllerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  buildPhaseB1NormalSinusBePairedSourceParityAuditV1,
  finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_OBSERVATION_V1_ID,
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  buildPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  evaluatePhaseB1TerminalTimestepExtremaV1,
  evaluatePhaseB1TerminalTimestepHiddenSignTopologyV1,
  evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1,
  evaluatePhaseB1TerminalTimestepNominalCoverageV1,
  evaluatePhaseB1TerminalTimestepVentricularVolumeDerivedV1,
  type PhaseB1NormalSinusBeTerminalTimestepObservationV1,
  type PhaseB1TerminalTimestepCircularSignedFlowSampleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";

describe("four-chamber Phase B1 terminal timestep observation", () => {
  it("freezes the source-only 100-scalar and valve-observation policy", () => {
    const manifest =
      buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1({
        sha256Hex: sha256,
      });
    const policy = manifest.comparisonPolicy;
    const integrated = policy.majorScalarComparison.inventory
      .closedLoopEdgeIntegratedFlow;

    expect(policy.majorScalarComparison.inventory.expectedScalarCount).toBe(100);
    expect(policy.emergentValveTimingComparison.expectedTimingScalarCount)
      .toBe(8);
    expect(integrated.sourceField).toBe(
      "terminal-capsule.committedIntervalLedger.integratedEdgeVolumeByFlow",
    );
    expect(integrated.meanSignedFlowDefinition).toBe(
      "ledger.signedVolumeM3/comparison-policy-canonical-cycle-length-sec",
    );
    expect(integrated.meanSignedFlowDenominatorIsActualFloatingPointLedgerDuration)
      .toBe(false);
    expect(integrated.requestedEndpointTrapezoidalOrInterpolatedQuadratureAllowed)
      .toBe(false);
    expect(policy.extremaSamplingContract).toMatchObject({
      initialEndpointIncluded: true,
      everyRequestedSegmentExitEndpointIncluded: true,
      acceptedRetryChildEndpointsIncluded: false,
      endpointEvaluation: "right-continuous-same-time-level-re-evaluation",
    });
    expect(policy.extremaSamplingContract.nominalGridCoverage)
      .toMatchObject({
        observationIndexField: "sample.nominalGridIndex",
        nominalOrCoalescedRequestedSegmentMapping:
          "sample.nominalGridIndex=segment.nominalGridIndex+1",
        eventOnlyRequestedSegmentMapping: {
          sampleNominalGridIndex: null,
          rawUpcomingNominalGridIndexClaimsCoverage: false,
        },
      });
    expect(policy.emergentValveTimingComparison.retryChildSignAudit)
      .toMatchObject({
        hiddenSignReversalRule:
          "expanded-transition-count>requested-transition-count",
        hiddenAdditionalPositiveLobeRule:
          "entry<=0-and-exit<=0-and-any-intermediate-retry-child-flow>0",
        retryChildUsedInTimingTrace: false,
        retryChildUsedForCrossingInterpolation: false,
      });
  });

  it("keeps extrema ties deterministic and derives EDV, ESV, SV, and EF", () => {
    expect(evaluatePhaseB1TerminalTimestepExtremaV1([4, 2, 4, 2]))
      .toEqual({
        minimum: 2,
        maximum: 4,
        minimumSampleIndex: 1,
        maximumSampleIndex: 0,
      });
    const derived = evaluatePhaseB1TerminalTimestepVentricularVolumeDerivedV1([
      90e-6,
      120e-6,
      50e-6,
    ]);
    expect(derived).toMatchObject({
      endDiastolicVolumeM3: 120e-6,
      endSystolicVolumeM3: 50e-6,
      strokeVolumeM3: 70e-6,
    });
    expect(derived.ejectionFraction).toBeCloseTo(70 / 120, 15);
  });

  it("requires exactly one owner for every nominal observation index", () => {
    expect(evaluatePhaseB1TerminalTimestepNominalCoverageV1({
      expectedMaximumNominalIndex: 3,
      observedNominalIndices: [0, 1, 2, 3],
    })).toMatchObject({
      missingNominalIndices: [],
      duplicateNominalIndices: [],
      unexpectedNominalIndices: [],
      everyExpectedNominalIndexPresentExactlyOnce: true,
    });
    expect(evaluatePhaseB1TerminalTimestepNominalCoverageV1({
      expectedMaximumNominalIndex: 3,
      observedNominalIndices: [0, 1, 1, 4],
    })).toMatchObject({
      missingNominalIndices: [2, 3],
      duplicateNominalIndices: [1],
      unexpectedNominalIndices: [4],
      everyExpectedNominalIndexPresentExactlyOnce: false,
    });
  });

  it("detects hidden retry-child valve sign topology without promoting it to timing samples", () => {
    expect(evaluatePhaseB1TerminalTimestepHiddenSignTopologyV1({
      requestedLeftFlowM3PerSec: -1,
      acceptedRetryChildFlowsM3PerSec: [1],
      requestedRightFlowM3PerSec: -1,
    })).toEqual({
      requestedEndpointTransitionCount: 0,
      expandedTransitionCount: 2,
      hiddenAdditionalPositiveLobe: true,
      hiddenSignReversal: true,
      pass: false,
    });
    expect(evaluatePhaseB1TerminalTimestepHiddenSignTopologyV1({
      requestedLeftFlowM3PerSec: -1,
      acceptedRetryChildFlowsM3PerSec: [-0.5, 0.5],
      requestedRightFlowM3PerSec: 1,
    }).pass).toBe(true);
    expect(evaluatePhaseB1TerminalTimestepHiddenSignTopologyV1({
      requestedLeftFlowM3PerSec: 1,
      acceptedRetryChildFlowsM3PerSec: [-1],
      requestedRightFlowM3PerSec: 1,
    })).toMatchObject({
      hiddenAdditionalPositiveLobe: false,
      hiddenSignReversal: true,
      pass: false,
    });
  });

  it("resolves ordinary and cycle-wrapping main positive flow lobes by linear chord", () => {
    const ordinary = evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1({
      cycleLengthSec: 4,
      samples: flowSamples([-1, 1, 3, -1]),
    });
    expect(ordinary).toMatchObject({
      status: "resolved",
      positiveLobeCount: 1,
      maximumPositiveFlowM3PerSec: 3,
      peakPhaseSec: 2,
      openingPhaseSec: 0.5,
      closingPhaseSec: 2.75,
      crossingInterpolation: "linear-chord",
    });

    const wrapping = evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1({
      cycleLengthSec: 4,
      samples: flowSamples([2, -1, -1, 2]),
    });
    expect(wrapping.status).toBe("resolved");
    expect(wrapping.positiveLobeCount).toBe(1);
    expect(wrapping.peakPhaseSec).toBe(0);
    expect(wrapping.openingPhaseSec).toBeCloseTo(2 + 1 / 3, 14);
    expect(wrapping.closingPhaseSec).toBeCloseTo(2 / 3, 14);
  });

  it("rejects ambiguous, missing, duplicate, and unbracketed valve timing traces", () => {
    expect(evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1({
      cycleLengthSec: 4,
      samples: flowSamples([-1, 3, -1, 3]),
    }).status).toBe("ambiguous-main-lobe");
    expect(evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1({
      cycleLengthSec: 4,
      samples: flowSamples([-1, 0, -2, 0]),
    }).status).toBe("no-positive-flow");
    expect(evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1({
      cycleLengthSec: 4,
      samples: flowSamples([1, 2, 3, 4]),
    }).status).toBe("unbracketed-all-positive");
    expect(evaluatePhaseB1TerminalTimestepMainPositiveFlowLobeV1({
      cycleLengthSec: 4,
      samples: [
        { phaseSec: -0, signedFlowM3PerSec: -1, sourceRequestedSegmentIndex: 0 },
        { phaseSec: 0, signedFlowM3PerSec: 1, sourceRequestedSegmentIndex: 1 },
      ],
    }).status).toBe("duplicate-phase");
  });

  it("rejects caller pass booleans and serialized reconstruction", () => {
    expect(() =>
      buildPhaseB1NormalSinusBeTerminalTimestepObservationV1({
        comparisonManifest: Object.freeze({}),
        initialSourceParityAudit: Object.freeze({}),
        terminalCycleCapsule: Object.freeze({}),
        committedCycleEnergyAudit: Object.freeze({}),
        sha256Hex: sha256,
        terminalObservationGatePass: true,
      } as never)).toThrow(/must contain exactly/i);

    const reconstructed = JSON.parse(JSON.stringify({
      observationId:
        PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_OBSERVATION_V1_ID,
      contentSha256: "0".repeat(64),
    })) as PhaseB1NormalSinusBeTerminalTimestepObservationV1;
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
        reconstructed,
        sha256,
      )).toThrow(/not builder-issued/i);
  });

  // A real quarter-millisecond terminal-attractor run may require several
  // complete 0.8 s supercycles. Keep it behind an explicit parent opt-in and
  // never replace its in-process capsule/audit provenance with fixtures.
  it.skipIf(
    process.env.CIRCLEHEART_TERMINAL_TIMESTEP_OBSERVATION_HEAVY_TESTS !== "1",
  )(
    "composes 100 scalars and eight timing values from genuine retained artifacts",
    () => {
      const parentManifest =
        buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
      const parentNumericalEvidence =
        buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
          parentManifest,
          sha256,
        );
      const schedule =
        buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
      const initialSourceParityAudit =
        buildPhaseB1NormalSinusBePairedSourceParityAuditV1({
          parentManifest,
          parentNumericalEvidence,
          schedule,
          sha256Hex: sha256,
        });
      let controller = initializePhaseB1NormalSinusBeLivePeriodicControllerV1({
        sourceCase: parentNumericalEvidence.results.off.eventFreeCase,
        schedule,
        nominalDtSec: 0.00025,
        sha256Hex: sha256,
      });
      let terminal: ReturnType<
        typeof finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1
      > | null = null;
      while (terminal === null) {
        const retainedSourceCase = controller.sourceCase;
        const advanced = advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
          controller,
          sha256Hex: sha256,
        });
        if (advanced.completedCycle === false) {
          throw new Error(
            `${advanced.failure.failureStage}: ${advanced.failure.failureReason}`,
          );
        }
        if (advanced.terminalResult !== null) {
          terminal =
            finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
              parentManifest,
              parentNumericalEvidence,
              schedule,
              sourceCase: retainedSourceCase,
              terminalResult: advanced.terminalResult,
              finalCommittedSupercycleAudit: advanced.committedSupercycleAudit,
              finalPeriodicCheckpoint: advanced.periodicCheckpoint,
              finalCycleEvidence: advanced.cycleEvidence,
              sha256Hex: sha256,
            });
        } else if (advanced.controller !== null) {
          controller = advanced.controller;
        } else {
          throw new Error("live periodic run lost both successor and terminal");
        }
      }
      if (terminal.completed === false) {
        throw new Error(
          `${terminal.failure.failureKind}: ${terminal.failure.contentSha256}`,
        );
      }
      const terminalCycleCapsule = terminal.capsule;
      const committedCycleEnergyAudit =
        buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1({
          terminalCycleCapsule,
          sha256Hex: sha256,
        });
      const comparisonManifest =
        buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1({
          sha256Hex: sha256,
        });
      const observation =
        buildPhaseB1NormalSinusBeTerminalTimestepObservationV1({
          comparisonManifest,
          initialSourceParityAudit,
          terminalCycleCapsule,
          committedCycleEnergyAudit,
          sha256Hex: sha256,
        });

      expect(
        assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
          observation,
          sha256,
        ),
      ).toBe(observation);
      expect(observation.majorScalars).toHaveLength(100);
      expect(observation.valveTimingScalars).toHaveLength(8);
      const expectedDescriptors = expectedMajorScalarDescriptors(
        comparisonManifest,
        terminalCycleCapsule.sourceCase.destinationRegistry,
      );
      expect(observation.majorScalars.map((scalar) => ({
        index: scalar.index,
        label: scalar.label,
        unit: scalar.unit,
        normalizationScale: scalar.normalizationScale,
        normalizationScaleSource: scalar.normalizationScaleSource,
        valueSource: scalar.valueSource,
      }))).toEqual(expectedDescriptors.map((descriptor, index) => ({
        index,
        ...descriptor,
      })));
      const integratedInventory = comparisonManifest.comparisonPolicy
        .majorScalarComparison.inventory.closedLoopEdgeIntegratedFlow;
      for (const flowId of integratedInventory.edgeOrder) {
        const ledger = terminalCycleCapsule.committedIntervalLedger
          .integratedEdgeVolumeByFlow[flowId];
        const expectedValues = {
          "cycle-mean-signed-flow": ledger.signedVolumeM3
            / comparisonManifest.comparisonPolicy.cycleLengthSec,
          "forward-volume": ledger.forwardVolumeM3,
          "regurgitant-volume": ledger.regurgitantVolumeM3,
        } as const;
        for (const component of integratedInventory.componentOrder) {
          const scalar = observation.majorScalars.find((candidate) =>
            candidate.label === `closed-loop-edge.${flowId}.${component}`);
          expect(scalar).toBeDefined();
          expect(scalar!.value).toBe(expectedValues[component]);
          expect(scalar!.valueSource).toBe(
            "authenticated-committed-interval-ledger",
          );
        }
      }
      const expectedTimingDescriptors = comparisonManifest.comparisonPolicy
        .emergentValveTimingComparison.valveFlowOrder.flatMap((valveFlowId) =>
          comparisonManifest.comparisonPolicy.emergentValveTimingComparison
            .eventOrderWithinValve.map((event) => ({
              label: `valve-timing.${valveFlowId}.${event}`,
              valveFlowId,
              event,
            })));
      expect(observation.valveTimingScalars.map((scalar) => ({
        index: scalar.index,
        label: scalar.label,
        valveFlowId: scalar.valveFlowId,
        event: scalar.event,
        unit: scalar.unit,
        available: scalar.available,
      }))).toEqual(expectedTimingDescriptors.map((descriptor, index) => ({
        index,
        ...descriptor,
        unit: "s",
        available: observation.valveTimingScalars[index].phaseSec !== null,
      })));
      expect(observation.valveTimingInventoryCompleteAndOrdered).toBe(true);
      expect(observation.everyValveTimingScalarAvailable).toBe(
        observation.valveTimingScalars.every((scalar) => scalar.available),
      );
      if (!observation.everyValveTimingScalarAvailable) {
        expect(observation.terminalObservationGatePass).toBe(false);
      }
      expect(observation.sampleTrace.samples[0].nominalGridIndex).toBe(0);
      expect(observation.sampleSetAudit
        .acceptedTransactionEndpointsUsedOnlyForHiddenValveSignAudit).toBe(true);
      expect("acceptedTransactionsUsedOnlyForHiddenValveSignAudit"
        in observation.sampleSetAudit).toBe(false);
      expect(observation.sampleSetAudit.nominalCoverage
        .everyExpectedNominalIndexPresentExactlyOnce).toBe(true);
      expect(observation.authenticatedNegativeObservationIssued).toBe(
        !observation.terminalObservationGatePass,
      );
      expect(observation.numericalThreeGridComparisonPass).toBe(false);
      expect(observation.timestepConvergenceAcceptancePass).toBe(false);

      const reconstructed = JSON.parse(JSON.stringify(observation)) as
        PhaseB1NormalSinusBeTerminalTimestepObservationV1;
      expect(() =>
        assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
          reconstructed,
          sha256,
        )).toThrow(/not builder-issued/i);
    },
  );
});

function flowSamples(
  values: readonly number[],
): readonly PhaseB1TerminalTimestepCircularSignedFlowSampleV1[] {
  return values.map((signedFlowM3PerSec, phaseSec) => ({
    phaseSec,
    signedFlowM3PerSec,
    sourceRequestedSegmentIndex: phaseSec,
  }));
}

type ComparisonManifest = ReturnType<
  typeof buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1
>;

type TerminalCycleCapsule =
  PhaseB1NormalSinusBeTerminalTimestepObservationV1["terminalCycleCapsule"];
type DestinationRegistry =
  TerminalCycleCapsule["sourceCase"]["destinationRegistry"];

type ExpectedMajorScalarDescriptor = Readonly<{
  label: string;
  unit: "m3" | "Pa" | "m3/s" | "m3/beat" | "1" | "1/m" | "m";
  normalizationScale: number;
  normalizationScaleSource: string;
  valueSource:
    | "authenticated-extrema-sample-trace"
    | "authenticated-committed-interval-ledger";
}>;

function expectedMajorScalarDescriptors(
  manifest: ComparisonManifest,
  registry: DestinationRegistry,
): readonly ExpectedMajorScalarDescriptor[] {
  const inventory = manifest.comparisonPolicy.majorScalarComparison.inventory;
  const expected: ExpectedMajorScalarDescriptor[] = [];
  const appendExtrema = (
    category: string,
    subjects: readonly string[],
    extremaOrder: readonly ("minimum" | "maximum")[],
    unit: ExpectedMajorScalarDescriptor["unit"],
    scaleFor: (subject: string) => number,
    normalizationScaleSource: string,
  ) => {
    for (const subject of subjects) {
      for (const extrema of extremaOrder) {
        expected.push({
          label: `${category}.${subject}.${extrema}`,
          unit,
          normalizationScale: scaleFor(subject),
          normalizationScaleSource,
          valueSource: "authenticated-extrema-sample-trace",
        });
      }
    }
  };
  appendExtrema(
    "compartment-volume",
    inventory.compartmentVolumeExtrema.compartmentOrder,
    inventory.compartmentVolumeExtrema.extremaOrder,
    "m3",
    (subject) => registry.unknownScales.bloodVolumeM3[
      subject as keyof typeof registry.unknownScales.bloodVolumeM3
    ],
    inventory.compartmentVolumeExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "compartment-absolute-pressure",
    inventory.compartmentAbsolutePressureExtrema.compartmentOrder,
    inventory.compartmentAbsolutePressureExtrema.extremaOrder,
    "Pa",
    () => registry.residualScales.pressurePa,
    inventory.compartmentAbsolutePressureExtrema.normalizationScaleSource,
  );
  for (const flowId of inventory.closedLoopEdgeIntegratedFlow.edgeOrder) {
    for (const component of inventory.closedLoopEdgeIntegratedFlow.componentOrder) {
      const mean = component === "cycle-mean-signed-flow";
      expected.push({
        label: `closed-loop-edge.${flowId}.${component}`,
        unit: mean ? "m3/s" : "m3/beat",
        normalizationScale: registry.unknownScales.inertialFlowM3PerSec
          * (mean ? 1 : manifest.comparisonPolicy.cycleLengthSec),
        normalizationScaleSource: mean
          ? inventory.closedLoopEdgeIntegratedFlow
            .meanSignedFlowNormalizationScaleSource
          : inventory.closedLoopEdgeIntegratedFlow
            .integratedVolumeNormalizationScaleSource,
        valueSource: "authenticated-committed-interval-ledger",
      });
    }
  }
  for (const flowId of inventory.valvePeakFlow.valveFlowOrder) {
    for (const component of inventory.valvePeakFlow.componentOrder) {
      expected.push({
        label: `valve-flow.${flowId}.${component}`,
        unit: "m3/s",
        normalizationScale: registry.unknownScales.inertialFlowM3PerSec,
        normalizationScaleSource:
          inventory.valvePeakFlow.normalizationScaleSource,
        valueSource: "authenticated-extrema-sample-trace",
      });
    }
  }
  for (const chamberId of inventory.ventricularVolumeDerived.chamberOrder) {
    for (const component of inventory.ventricularVolumeDerived.scalarOrder) {
      const ef = component === "ejection-fraction";
      expected.push({
        label: `ventricular-volume.${chamberId}.${component}`,
        unit: ef ? "1" : "m3",
        normalizationScale: ef
          ? inventory.ventricularVolumeDerived
            .ejectionFractionNormalizationScale
          : registry.unknownScales.bloodVolumeM3[chamberId],
        normalizationScaleSource: ef
          ? "comparison-policy.ejectionFractionNormalizationScale"
          : inventory.ventricularVolumeDerived.volumeNormalizationScaleSource,
        valueSource: "authenticated-extrema-sample-trace",
      });
    }
  }
  appendExtrema(
    "wall-fiber-log-strain",
    inventory.wallFiberLogStrainExtrema.wallOrder,
    inventory.wallFiberLogStrainExtrema.extremaOrder,
    "1",
    () => registry.unknownScales.fiberLogStrain,
    inventory.wallFiberLogStrainExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "wall-active-kirchhoff-stress",
    inventory.wallActiveKirchhoffStressExtrema.wallOrder,
    inventory.wallActiveKirchhoffStressExtrema.extremaOrder,
    "Pa",
    (subject) => registry.residualScales.tissueStressByWallPa[
      subject as keyof typeof registry.residualScales.tissueStressByWallPa
    ],
    inventory.wallActiveKirchhoffStressExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "triseg-septal-signed-curvature",
    [inventory.septalSignedCurvatureExtrema.wallId],
    inventory.septalSignedCurvatureExtrema.extremaOrder,
    "1/m",
    () => 1 / registry.unknownScales.junctionRadiusM,
    inventory.septalSignedCurvatureExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "triseg-septal-midwall-volume",
    [inventory.septalMidwallVolumeExtrema.coordinateId],
    inventory.septalMidwallVolumeExtrema.extremaOrder,
    "m3",
    () => registry.unknownScales.septalMidwallVolumeM3,
    inventory.septalMidwallVolumeExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "triseg-junction-radius",
    [inventory.junctionRadiusExtrema.coordinateId],
    inventory.junctionRadiusExtrema.extremaOrder,
    "m",
    () => registry.unknownScales.junctionRadiusM,
    inventory.junctionRadiusExtrema.normalizationScaleSource,
  );
  appendExtrema(
    "pericardial-excess-pressure",
    [inventory.pericardialExcessPressureExtrema.scalarId],
    inventory.pericardialExcessPressureExtrema.extremaOrder,
    "Pa",
    () => registry.residualScales.pressurePa,
    inventory.pericardialExcessPressureExtrema.normalizationScaleSource,
  );
  return expected;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
