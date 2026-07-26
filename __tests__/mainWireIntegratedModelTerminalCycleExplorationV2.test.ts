import { describe, expect, it } from "vitest";

import {
  NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2,
} from "@/engine/coronary/autoregulationV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  describeMainWireIntegratedModelTerminalCycleMorphologyV2,
} from "@/engine/myocardium/diagnostics/MainWireIntegratedModelTerminalCycleMorphologyV2";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";

import {
  MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_BOUNDS_V2,
  MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_CLAIM_V2,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V2,
  runMainWireIntegratedModelPeriodicSteadyV2,
  runMainWireIntegratedModelTerminalCycleExplorationV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";

describe("integrated model V2 terminal-cycle exploration", () => {
  it("derives the canonical horizon from ten declared coronary slow time constants without changing closure thresholds", () => {
    const policy = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2;
    const coronaryPolicy =
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2;
    expect(policy.coronaryAutoregulationResponseTimeConstantSec).toBe(
      NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2
        .responseTimeConstantSec,
    );
    expect(policy.coronaryAutoregulationResponseTimeConstantSec).toBe(25);
    expect(policy.canonicalSlowTimeConstantMultiples).toBe(10);
    expect(policy.canonicalMaximumPhysicalTimeSec).toBe(
      10 * NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2
        .responseTimeConstantSec,
    );
    expect(policy.canonicalSinusCycleLengthSec).toBe(1);
    expect(policy.maximumCycleCount).toBe(
      policy.canonicalMaximumPhysicalTimeSec
      / policy.canonicalSinusCycleLengthSec,
    );
    expect(policy.defaultMaximumCycleCount).toBe(250);
    expect(policy.maximumCycleCount).toBe(250);
    expect(policy.period1NormalizedTolerance).toBe(
      coronaryPolicy.period1NormalizedTolerance,
    );
    expect(policy.period2NormalizedTolerance).toBe(
      coronaryPolicy.period2NormalizedTolerance,
    );
    expect(policy.period2MinimumPeriod1NormalizedDelta).toBe(
      coronaryPolicy.period2MinimumPeriod1NormalizedDelta,
    );
    expect(policy.consecutiveCycles).toBe(coronaryPolicy.consecutiveBeats);
    expect(policy.consecutiveCycles).toBe(3);
    expect(policy.boundedSmokeMaximumCycleCount).toBe(2);
    expect(policy.canonicalMaximumHorizonProvenance)
      .toContain("not-derived-from-32-cycle-output");
    expect(policy.supersededMaximumHorizon)
      .toContain("32-cycle-fixed-tone-inherited-cap");
  });

  it("preserves accepted state across three finite conserved exploratory cycles and reports unthresholded limiter/loop trends", () => {
    const result = runMainWireIntegratedModelTerminalCycleExplorationV2({
      cycleCount: 3,
      nominalDtSec: 0.002,
    });

    expect(result.claim).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_CLAIM_V2,
    );
    expect(result.claim.acceptedStatePreservedAcrossCycles).toBe(true);
    expect(result.claim.transactionLoopSharedWithOneCycleVerification)
      .toBe(true);
    expect(result.claim.terminalCycleSampleTraceRetained).toBe(true);
    expect(result.claim.sampleTraceEstablishesShapeAcceptance).toBe(false);
    expect(result.claim.stabilizationToleranceDeclared).toBe(false);
    expect(result.claim.stabilizationPassFailAssessed).toBe(false);
    expect(result.claim.periodicSteadyStateClaimed).toBe(false);
    expect(result.claim.physiologicalAcceptanceClaimed).toBe(false);
    expect(result.claim.clinicalValidationClaimed).toBe(false);
    expect(result.claim.releaseAcceptanceClaimed).toBe(false);
    expect(result.claim.releaseReadyClaimed).toBe(false);
    expect(result.cycles).toHaveLength(3);
    expect(result.consecutiveCycleChange).toHaveLength(2);

    for (const [zeroBasedIndex, cycle] of result.cycles.entries()) {
      expect(cycle.cycleIndex).toBe(zeroBasedIndex + 1);
      expect(cycle.classification).toBe(
        "exploratory-terminal-cycle-not-an-accepted-periodic-or-physiological-cycle",
      );
      expect(cycle.startTimeSec).toBe(zeroBasedIndex * result.cycleLengthSec);
      expect(cycle.endTimeSec).toBe(
        (zeroBasedIndex + 1) * result.cycleLengthSec,
      );
      expect(cycle.acceptedStepCount).toBeLessThanOrEqual(
        MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_EXPLORATION_BOUNDS_V2
          .maximumAcceptedStepCountPerCycle,
      );
      expect(Object.values(cycle.signal).every(Number.isFinite)).toBe(true);
      for (const extrema of Object.values(cycle.extremaBySignal)) {
        expect([
          extrema.minimum,
          extrema.maximum,
          extrema.range,
          extrema.maximumAbsoluteValue,
        ].every(Number.isFinite)).toBe(true);
        expect(extrema.range).toBeGreaterThanOrEqual(0);
      }

      const ownerCountTotal = Object.values(
        cycle.lvadConstraint.ownerSampleCount,
      ).reduce((total, count) => total + count, 0);
      const ownerFractionTotal = Object.values(
        cycle.lvadConstraint.ownerSampleFraction,
      ).reduce((total, fraction) => total + fraction, 0);
      expect(ownerCountTotal).toBe(cycle.acceptedStepCount);
      expect(ownerFractionTotal).toBeCloseTo(1, 14);
      expect(cycle.lvadConstraint.limiterOwnedSampleFraction)
        .toBeGreaterThanOrEqual(0);
      expect(cycle.lvadConstraint.limiterOwnedSampleFraction)
        .toBeLessThanOrEqual(1);

      expect(Number.isFinite(
        cycle.lvadPressureFlow.signedClosedLoopAreaMmHgMlPerSec,
      )).toBe(true);
      expect(Number.isFinite(
        cycle.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec,
      )).toBe(true);
      expect(cycle.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec)
        .toBeGreaterThan(0);
      expect(Number.isFinite(cycle.lvadPressureFlow.flowRangeMlPerSec))
        .toBe(true);
      expect(Number.isFinite(cycle.lvadPressureFlow.pressureRiseRangeMmHg))
        .toBe(true);
      expect(cycle.lvadPressureFlow.periodicEndpointClosureClaimed).toBe(false);

      expect(cycle.closure.allReportedDeltasFinite).toBe(true);
      expect(Object.values(
        cycle.closure.nonCoronaryNodeVolumeDeltaMlByNode,
      ).every(Number.isFinite)).toBe(true);
      expect(Object.values(
        cycle.closure.coronaryNodeVolumeDeltaMlByNode,
      ).every(Number.isFinite)).toBe(true);
      expect(Object.values(
        cycle.closure.dynamicQDeltaMlPerSecByDevice,
      ).every(Number.isFinite)).toBe(true);
      expect(cycle.closure.coronaryWindow.windowIndexDelta).toBe(1);
      expect(cycle.closure.coronaryWindow.endWindowIsEmpty).toBe(true);
      expect(cycle.closure.rhythmPhase.phaseComparable).toBe(true);
      expect(cycle.closure.rhythmPhase.wrappedSourcePhaseDelta01)
        .toBeCloseTo(0, 14);
      expect(cycle.closure.rhythmPhase.generatorSourceIndexDelta).toBe(1);

      expect(cycle.conservation.allResidualsFinite).toBe(true);
      expect(cycle.conservation.withinExistingConstructionTolerances)
        .toBe(true);
      expect(cycle.boundedness.allSignalSamplesFinite).toBe(true);
      expect(cycle.boundedness.allSignalExtremaFinite).toBe(true);
      expect(cycle.boundedness.allClosureDeltasFinite).toBe(true);
      expect(cycle.boundedness.acceptedStepBoundRespected).toBe(true);
      expect(cycle.boundedness.finiteAndStepBounded).toBe(true);
      expect(cycle.boundedness.amplitudeAcceptanceAssessed).toBe(false);
      expect(cycle.scheduler.coronaryWindowCompletionCount).toBe(1);
      expect(cycle.acceptedEventCount).toBe(2);
    }

    for (const [index, change] of
      result.consecutiveCycleChange.entries()) {
      const previous = result.cycles[index]!;
      const current = result.cycles[index + 1]!;
      expect(change.fromCycleIndex).toBe(previous.cycleIndex);
      expect(change.toCycleIndex).toBe(current.cycleIndex);
      expect(change.limiterOwnedSampleFractionDelta).toBe(
        current.lvadConstraint.limiterOwnedSampleFraction
        - previous.lvadConstraint.limiterOwnedSampleFraction,
      );
      expect(change.absoluteLoopAreaDeltaMmHgMlPerSec).toBe(
        current.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec
        - previous.lvadPressureFlow.absoluteClosedLoopAreaMmHgMlPerSec,
      );
      expect(change.allValuesFinite).toBe(true);
      expect(change.assessment).toBe("reported-without-stability-threshold");
    }
    expect(result.stabilizationAssessment).toBe(
      "not-classified-because-no-predeclared-stability-tolerance",
    );
    const trace = result.terminalCycleTrace;
    const terminalCycle = result.cycles.at(-1)!;
    expect(trace.cycleIndex).toBe(terminalCycle.cycleIndex);
    expect(trace.startTimeSec).toBe(terminalCycle.startTimeSec);
    expect(trace.endTimeSec).toBe(terminalCycle.endTimeSec);
    expect(trace.sampleCount).toBe(terminalCycle.acceptedStepCount);
    expect(trace.samples).toHaveLength(trace.sampleCount);
    expect(trace.retainedForGraphShapeInspection).toBe(true);
    expect(trace.eligibleForNumericalOrPhysiologicalShapeGate).toBe(false);
    expect(trace.interpretation).toBe(
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance",
    );
    expect(trace.samples[0]!.acceptedTimeSec).toBeGreaterThan(
      trace.startTimeSec,
    );
    expect(trace.samples.at(-1)!.acceptedTimeSec).toBe(trace.endTimeSec);
    for (const [index, sample] of trace.samples.entries()) {
      expect(sample.cycleIndex).toBe(trace.cycleIndex);
      expect(sample.acceptedStepIndexWithinCycle).toBe(index + 1);
      expect(sample.acceptedTimeSec).toBeGreaterThanOrEqual(
        index === 0
          ? trace.startTimeSec
          : trace.samples[index - 1]!.acceptedTimeSec,
      );
      expect(sample.cyclePhase01).toBeGreaterThan(0);
      expect(sample.cyclePhase01).toBeLessThanOrEqual(1);
      expect(sample.acceptedDtSec).toBeGreaterThan(0);
      expect(Object.values(sample.signal).every(Number.isFinite)).toBe(true);
      for (const valveId of ["MV", "AoV"] as const) {
        const valve = sample.valve[valveId];
        expect([
          valve.signedFlowMlPerSec,
          valve.leafletOpeningFraction01,
          valve.openingTarget01,
          valve.activeEffectiveOrificeAreaCm2,
          valve.forwardEffectiveOrificeAreaCm2,
          valve.reverseEffectiveOrificeAreaCm2,
        ].every(Number.isFinite)).toBe(true);
        expect(valve.leafletOpeningFraction01).toBeGreaterThanOrEqual(0);
        expect(valve.leafletOpeningFraction01).toBeLessThanOrEqual(1);
        expect(valve.openingDriveState).toBe(
          valve.openingTarget01 === 0
            ? "zero-opening-target"
            : "positive-opening-target",
        );
      }
      expect([
        sample.lvad.unrestrictedFlowMlPerSec,
        sample.lvad.flowAccelerationMlPerSec2,
        sample.lvad.inletAvailability01,
        sample.lvad.constraintReactionMmHg,
        sample.lvad.prePumpPressureMmHg,
        sample.lvad.postPumpPressureMmHg,
        sample.lvad.deliveredPumpPressureRiseMmHg,
      ].every(Number.isFinite)).toBe(true);
      expect(sample.lvad.postPumpPressureMmHg
        - sample.lvad.prePumpPressureMmHg)
        .toBeCloseTo(sample.lvad.deliveredPumpPressureRiseMmHg, 14);
      expect([
        "not-declared",
        "non-forward-flow-not-applicable",
        "within-published-experimental-domain",
        "above-published-experimental-domain-within-advertised-capacity",
        "above-advertised-capacity",
      ]).toContain(sample.lvad.forwardFlowEvidenceStatus);
    }
    const morphology =
      describeMainWireIntegratedModelTerminalCycleMorphologyV2(trace);
    expect(morphology.sampleCount).toBe(trace.sampleCount);
    expect(morphology.allReportedNumbersFinite).toBe(true);
    expect(morphology.physiologicalAcceptanceEstablished).toBe(false);
    expect(morphology.shapeAcceptanceEstablished).toBe(false);
    expect(morphology.coronaryPhaseLedger
      .directCrossStationRatioOrAcceptanceAllowed).toBe(false);
    expect(morphology.lvadFlow.pumpPressureReadback
      .maximumAbsolutePostMinusPreIdentityResidualMmHg).toBeLessThanOrEqual(
        1e-12,
      );
    expect(morphology.lvadFlow.forwardResidenceFraction01
      + morphology.lvadFlow.zeroResidenceFraction01
      + morphology.lvadFlow.reverseResidenceFraction01).toBeCloseTo(1, 14);
    expect(result.allCyclesFiniteConservedAndStepBounded).toBe(true);
    expect(result.terminalAcceptedState.acceptedTimeSec).toBe(
      3 * result.cycleLengthSec,
    );
  }, 60_000);

  it("rejects exploration requests outside the structural runtime bounds", () => {
    expect(() => runMainWireIntegratedModelTerminalCycleExplorationV2({
      cycleCount: 6,
      nominalDtSec: 0.002,
    })).toThrow(/cycleCount/);
    expect(() => runMainWireIntegratedModelTerminalCycleExplorationV2({
      cycleCount: 3,
      nominalDtSec: 0.0005,
    })).toThrow(/nominalDtSec/);
  });

  it("runs one bounded periodic-protocol cycle without promoting numerical or physiological acceptance", async () => {
    const result = await runMainWireIntegratedModelPeriodicSteadyV2({
      nominalDtSec: 0.002,
      maximumCycleCount: 1,
      executionPurpose: "bounded-smoke",
    });

    expect(result.executionPurpose).toBe("bounded-smoke");
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.completedCycleCount).toBe(1);
    expect(result.terminationReason).toBe("maximum-cycles-reached");
    expect(result.classification.status).toBe("not-converged");
    expect(result.numericalPeriod1Established).toBe(false);
    expect(result.period2OrbitSuspected).toBe(false);
    expect(result.requestedHorizonCompleted).toBe(true);
    expect(result.earlyClassificationStopEligible).toBe(true);
    expect(result.physiologicalAcceptanceEstablished).toBe(false);
    expect(result.releaseAcceptanceEstablished).toBe(false);
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]!.evidenceRole)
      .toBe("bounded-exploration-only");
    expect(result.observations[0]!.period1?.provenance.periodLag).toBe(1);
    expect(result.observations[0]!.period2).toBeNull();
    expect(result.cycles[0]!.allSignalsFiniteAndConserved).toBe(true);
    const diagnostic = result.cycles[0]!.coronaryAutoregulationWindow;
    expect(diagnostic.windowIndex).toBe(0);
    expect(diagnostic.windowStartAcceptedTimeSec).toBe(0);
    expect(diagnostic.windowEndAcceptedTimeSec).toBe(result.cycleLengthSec);
    expect(diagnostic.acceptedWindowDurationSec).toBe(result.cycleLengthSec);
    expect(diagnostic.acceptedStepCount).toBe(
      result.cycles[0]!.acceptedStepCount,
    );
    expect(diagnostic.layerDiagnosticCount).toBe(6);
    expect(Object.keys(diagnostic.byTerritoryLayer).sort()).toEqual(
      [...CORONARY_TERRITORY_IDS_V2].sort(),
    );
    const seenLayerPaths: string[] = [];
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      const layers = diagnostic.byTerritoryLayer[territoryId];
      expect(Object.keys(layers).sort()).toEqual(
        [...CORONARY_LAYER_IDS_V2].sort(),
      );
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        const layer = layers[layerId];
        seenLayerPaths.push(`${layer.territoryId}.${layer.layerId}`);
        expect(layer.territoryId).toBe(territoryId);
        expect(layer.layerId).toBe(layerId);
        expect(layer.achievedToDemandTargetFlowRatio).toBe(
          layer.achievedMeanTissueFlowMlPerSec
          / layer.demandTargetFlowMlPerSec,
        );
        expect(layer.deltaLogToneResistanceScale).toBe(
          Math.log(layer.nextToneResistanceScale)
          - Math.log(layer.previousToneResistanceScale),
        );
        expect(layer.controlSignalLogPerTimeConstant).toBeCloseTo(
          Math.log(layer.achievedToDemandTargetFlowRatio),
          14,
        );
        expect(layer.boundedAt).toBe("interior");
        expect(layer.deltaLogToneResistanceScale).toBeCloseTo(
          diagnostic.acceptedWindowDurationSec
          / NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2
            .responseTimeConstantSec
          * layer.controlSignalLogPerTimeConstant,
          14,
        );
      }
    }
    expect(seenLayerPaths).toHaveLength(6);
    expect(new Set(seenLayerPaths).size).toBe(6);
    expect(result.terminalCycleTrace.sampleCount)
      .toBe(result.cycles[0]!.acceptedStepCount);
    expect(result.terminalCheckpoint.checkpointSha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(result.terminalCheckpoint.acceptedTimeSec)
      .toBe(result.terminalAcceptedState.acceptedTimeSec);
    expect(result.claim).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_CLAIM_V2,
    );
    expect(result.claim.waveformOrParameterFittingApplied).toBe(false);
    expect(result.policy).toBe(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2);
    expect(result.policy.thresholdProvenance).toContain("not-fit");

    await expect(runMainWireIntegratedModelPeriodicSteadyV2({
      nominalDtSec: 0.002,
      maximumCycleCount: 3,
      executionPurpose: "bounded-smoke",
    })).rejects.toThrow(/maximumCycleCount/);
  }, 30_000);

  it("keeps fixed-horizon characterization outside canonical classifier evidence", async () => {
    const result = await runMainWireIntegratedModelPeriodicSteadyV2({
      nominalDtSec: 0.002,
      maximumCycleCount: 1,
      executionPurpose: "fixed-horizon-characterization",
    });

    expect(result.executionPurpose).toBe("fixed-horizon-characterization");
    expect(result.completedCycleCount).toBe(1);
    expect(result.requestedHorizonCompleted).toBe(true);
    expect(result.earlyClassificationStopEligible).toBe(false);
    expect(result.terminationReason).toBe("maximum-cycles-reached");
    expect(result.classification.status).toBe("not-converged");
    expect(result.observations[0]!.evidenceRole)
      .toBe("bounded-exploration-only");
    expect(result.numericalPeriod1Established).toBe(false);
    expect(result.physiologicalAcceptanceEstablished).toBe(false);
    expect(result.releaseAcceptanceEstablished).toBe(false);
  }, 30_000);
});
