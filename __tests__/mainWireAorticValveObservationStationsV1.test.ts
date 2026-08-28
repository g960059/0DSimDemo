import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_VALVE_OBSERVATION_STATIONS_CLAIM_V1,
  evaluateMainWireAorticValveObservationSampleV1,
  measureMainWireAorticValveObservationStationsV1,
  type MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

const GEOMETRY = Object.freeze({
  geometryId: "fixed-lvot-d2p3cm-aa-d3p0cm-v1",
  provenance: "fixed-research-bracket" as const,
  lvotCrossSectionalAreaCm2: Math.PI * (2.3 / 2) ** 2,
  ascendingAorticCrossSectionalAreaCm2: Math.PI * (3 / 2) ** 2,
}) satisfies MainWireAorticValveObservationGeometryV1;

describe("main-wire aortic-valve observation stations V1", () => {
  it("keeps Doppler, node, recovered-static, and irreversible-loss observations distinct", () => {
    const flowMlPerSec = 500;
    const activeEoaCm2 = 3.5;
    const resistance = 0.0015;
    const fullVenaContractaPortGradientMmHg = resistance * flowMlPerSec
      + idealBernoulliLossFromEffectiveOrificeAreaV2(activeEoaCm2)
        * flowMlPerSec ** 2;
    const sample = evaluateMainWireAorticValveObservationSampleV1({
      flowMlPerSec,
      activeEoaCm2,
      nodePressureGradientMmHg: fullVenaContractaPortGradientMmHg,
      backgroundLinearResistanceMmHgSecPerMl: resistance,
      modelDissipativePowerMmHgMlPerSec:
        fullVenaContractaPortGradientMmHg * flowMlPerSec,
    }, GEOMETRY);

    expect(sample.venaContractaVelocityMPerSec)
      .toBeGreaterThan(sample.lvotVelocityMPerSec);
    expect(sample.lvotVelocityMPerSec)
      .toBeGreaterThan(sample.ascendingAorticVelocityMPerSec);
    expect(sample.proximalVelocityCorrectedDopplerGradientMmHg)
      .toBeLessThan(sample.simplifiedDopplerGradientMmHg);
    expect(sample.recoveredStaticPortGradientMmHg)
      .toBeLessThan(sample.fullVenaContractaPortGradientMmHg);
    expect(sample.irreversibleConvectivePressureLossMmHg).toBeGreaterThan(0);
    expect(sample.downstreamKineticPressureMmHg).toBeGreaterThan(0);
    expect(sample.recoveredPressureFromVenaContractaMmHg).toBeGreaterThan(0);
    expect(sample.modelNodeMinusFullVenaContractaPortGradientMmHg)
      .toBeCloseTo(0, 12);
    expect(sample.modelNodeMinusRecoveredStaticPortGradientMmHg)
      .toBeGreaterThan(0);
    expect(sample.energyLossCoefficientAreaCm2).toBeGreaterThan(activeEoaCm2);
    expect(sample.energyLossCoefficientAreaCm2)
      .toBeLessThan(GEOMETRY.ascendingAorticCrossSectionalAreaCm2);
  });

  it("requires measurement areas to exceed the active EOA", () => {
    expect(() => evaluateMainWireAorticValveObservationSampleV1({
      flowMlPerSec: 500,
      activeEoaCm2: 3.5,
      nodePressureGradientMmHg: 10,
      backgroundLinearResistanceMmHgSecPerMl: 0.0015,
      modelDissipativePowerMmHgMlPerSec: 5000,
    }, {
      ...GEOMETRY,
      lvotCrossSectionalAreaCm2: 3.5,
    })).toThrow(/LVOT area must exceed/);
    expect(() => evaluateMainWireAorticValveObservationSampleV1({
      flowMlPerSec: 500,
      activeEoaCm2: 3.5,
      nodePressureGradientMmHg: 10,
      backgroundLinearResistanceMmHgSecPerMl: 0.0015,
      modelDissipativePowerMmHgMlPerSec: 5000,
    }, {
      ...GEOMETRY,
      ascendingAorticCrossSectionalAreaCm2: 3.5,
    })).toThrow(/ascending-aortic area must exceed/);
  });

  it("measures all stations from an accepted beat without mutating the exact model", () => {
    const periodicResult = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const observation = measureMainWireAorticValveObservationStationsV1(
      periodicResult,
      GEOMETRY,
    );

    expect(observation.source.sampleCount).toBe(50);
    expect(observation.forwardFlow.sampleCount).toBeGreaterThan(0);
    expect(observation.forwardFlow.volumeMl).toBeGreaterThan(0);
    expect(observation.timeMeanGradientMmHg.proximalVelocityCorrectedDoppler)
      .toBeLessThan(observation.timeMeanGradientMmHg.simplifiedDoppler);
    expect(observation.timeMeanGradientMmHg.irreversibleConvectiveLoss)
      .toBeLessThan(
        observation.timeMeanGradientMmHg.geometryRecoveredStaticCounterfactual,
      );
    expect(observation.cycleEnergyMmHgMl.acceptedModelDissipation)
      .toBeGreaterThan(0);
    expect(observation.interpretationEligible).toBe(false);
    expect(MAIN_WIRE_AORTIC_VALVE_OBSERVATION_STATIONS_CLAIM_V1)
      .toMatchObject({
        exactFrameMutation: false,
        exactModelFeedback: false,
        gradientKindsInterchangeable: false,
        pressureRecoveryChangesExactDynamics: false,
      });
  });
});
