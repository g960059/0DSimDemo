import { describe, expect, it } from "vitest";

import {
  buildContractileActivationPhenotypeResidualsV1,
  calibrateEventDrivenActivationPhenotypeV1,
  measurePeriodicContractileActivationPhenotypeFromSamplesV1,
  measurePeriodicContractileActivationPhenotypeV1,
  type ContractileActivationPhenotypeV1,
} from "@/engine/mechanics2/activation/ContractileActivationPhenotypeV1";
import type { EventDrivenContractileActivationParamsV1 } from
  "@/engine/mechanics2/activation/EventDrivenContractileActivationV1";

const CENTER_PARAMS: EventDrivenContractileActivationParamsV1 = {
  electricalEventReference: "prescribed-effective-sidecar-event",
  electricalToCalciumDelaySec: 0.015,
  calciumKernel: {
    riseTauSec: 0.025,
    decayTauSec: 0.075,
  },
  contractileKinetics: {
    onRatePerSec: 40,
    offRatePerSec: 14,
  },
};

const CYCLE_LENGTH_SEC = 0.8;
const SAMPLE_INTERVAL_SEC = 0.001;

function centerPhenotype(): ContractileActivationPhenotypeV1 {
  const readback = measurePeriodicContractileActivationPhenotypeV1(
    CENTER_PARAMS,
    CYCLE_LENGTH_SEC,
    SAMPLE_INTERVAL_SEC,
  );
  if (readback === null) throw new Error("center phenotype must be measurable");
  return readback.phenotype;
}

describe("ContractileActivationPhenotypeV1", () => {
  it("measures periodic-pre-event phenotype on the final bounded activation state", () => {
    const readback = measurePeriodicContractileActivationPhenotypeV1(
      CENTER_PARAMS,
      CYCLE_LENGTH_SEC,
      SAMPLE_INTERVAL_SEC,
    );

    expect(readback).not.toBeNull();
    expect(readback!.phenotype).toMatchObject({
      eventReference: CENTER_PARAMS.electricalEventReference,
      effectiveOnsetDelaySec: CENTER_PARAMS.electricalToCalciumDelaySec,
      referenceCycleLengthSec: CYCLE_LENGTH_SEC,
      baselineDefinition: "periodic-pre-event",
    });
    expect(readback!.baselineActivation01).toBeGreaterThan(0);
    expect(readback!.baselineActivation01).toBeLessThan(1);
    expect(readback!.peakActivation01).toBeLessThanOrEqual(1);
    expect(readback!.phenotype.peakExcursion01).toBeCloseTo(
      readback!.peakActivation01 - readback!.baselineActivation01,
      14,
    );
    expect(readback!.phenotype.timeFromEventToPeakSec).toBeGreaterThan(
      CENTER_PARAMS.electricalToCalciumDelaySec,
    );
    expect(readback!.phenotype.relaxationTimeTo50Sec).toBeGreaterThan(0);
    expect(readback!.halfRelaxationTimeSec).toBeCloseTo(
      readback!.peakTimeSec + readback!.phenotype.relaxationTimeTo50Sec,
      14,
    );
    expect(readback!.phenotype.excursionIntegralSec).toBeGreaterThan(0);
    expect(readback!.historicalEventCount).toBeGreaterThan(1);
  });

  it("measures an event-centered sampled cycle with the shared refined-peak contract", () => {
    const eventTimeSec = 0.04;
    const numberOfSteps = 800;
    const sampleIntervalSec = CYCLE_LENGTH_SEC / numberOfSteps;
    const samples = Array.from({ length: numberOfSteps + 1 }, (_, index) => {
      const phase01 = index / numberOfSteps;
      return {
        timeSec: eventTimeSec + index * sampleIntervalSec,
        activation01: 0.1 + 0.4 * (1 - Math.cos(2 * Math.PI * phase01)),
      };
    });
    const readback = measurePeriodicContractileActivationPhenotypeFromSamplesV1(
      samples,
      {
        eventTimeSec,
        eventReference: "prescribed-calcium-onset",
        effectiveOnsetDelaySec: 0,
        referenceCycleLengthSec: CYCLE_LENGTH_SEC,
      },
    );

    expect(readback).not.toBeNull();
    expect(readback!.baselineActivation01).toBeCloseTo(0.1, 14);
    expect(readback!.peakActivation01).toBeCloseTo(0.9, 14);
    expect(readback!.peakTimeSec).toBeCloseTo(eventTimeSec + 0.4, 14);
    expect(readback!.halfRelaxationTimeSec).toBeCloseTo(
      eventTimeSec + 0.6,
      14,
    );
    expect(readback!.phenotype).toMatchObject({
      eventReference: "prescribed-calcium-onset",
      effectiveOnsetDelaySec: 0,
      baselineDefinition: "periodic-pre-event",
    });
    expect(readback!.phenotype.timeFromEventToPeakSec).toBeCloseTo(0.4, 14);
    expect(readback!.phenotype.relaxationTimeTo50Sec).toBeCloseTo(0.2, 14);
    expect(readback!.phenotype.peakExcursion01).toBeCloseTo(0.8, 14);
    expect(readback!.phenotype.excursionIntegralSec).toBeCloseTo(0.32, 14);

    const expected: ContractileActivationPhenotypeV1 = {
      eventReference: "prescribed-calcium-onset",
      effectiveOnsetDelaySec: 0,
      timeFromEventToPeakSec: 0.4,
      relaxationTimeTo50Sec: 0.2,
      peakExcursion01: 0.8,
      excursionIntegralSec: 0.32,
      referenceCycleLengthSec: CYCLE_LENGTH_SEC,
      baselineDefinition: "periodic-pre-event",
    };
    expect(buildContractileActivationPhenotypeResidualsV1(
      readback!.phenotype,
      expected,
      sampleIntervalSec,
    ).normalizedMaximumAbsolute).toBeLessThan(1e-12);
    expect(() => buildContractileActivationPhenotypeResidualsV1(
      readback!.phenotype,
      { ...expected, eventReference: "prescribed-effective-sidecar-event" },
      sampleIntervalSec,
    )).toThrow(/eventReference must match/);
  });

  it("keeps parabolic peak refinement inside the bounded contractile state", () => {
    const readback = measurePeriodicContractileActivationPhenotypeFromSamplesV1(
      [0.1, 0.9999, 0.99995, 0.8, 0.1].map((activation01, index) => ({
        timeSec: 0.1 * index,
        activation01,
      })),
      {
        eventTimeSec: 0,
        eventReference: "prescribed-effective-sidecar-event",
        effectiveOnsetDelaySec: 0,
        referenceCycleLengthSec: 0.4,
      },
    );

    expect(readback).not.toBeNull();
    expect(readback!.peakActivation01).toBe(1);
    expect(readback!.phenotype.peakExcursion01).toBeCloseTo(0.9, 14);
    expect(readback!.phenotype.relaxationTimeTo50Sec).toBeGreaterThan(0);
  });

  it("recovers an already-realized phenotype and reports local numerical conditioning", () => {
    const target = centerPhenotype();
    const result = calibrateEventDrivenActivationPhenotypeV1(
      target,
      CENTER_PARAMS,
      { sampleIntervalSec: SAMPLE_INTERVAL_SEC },
    );

    expect(result.status).toBe("converged");
    expect(result.internalParams).not.toBeNull();
    expect(result.internalParams!.calciumKernel.riseTauSec).toBeCloseTo(
      CENTER_PARAMS.calciumKernel.riseTauSec,
      14,
    );
    expect(result.internalParams!.calciumKernel.decayTauSec).toBeCloseTo(
      CENTER_PARAMS.calciumKernel.decayTauSec,
      14,
    );
    expect(result.internalParams!.contractileKinetics.onRatePerSec).toBeCloseTo(
      CENTER_PARAMS.contractileKinetics.onRatePerSec,
      12,
    );
    expect(result.internalParams!.contractileKinetics.offRatePerSec).toBeCloseTo(
      CENTER_PARAMS.contractileKinetics.offRatePerSec,
      12,
    );
    expect(result.targetResiduals?.normalizedMaximumAbsolute).toBeLessThan(1e-12);
    expect(result.localJacobianCondition).not.toBeNull();
    expect(result.localJacobianCondition!).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.localJacobianCondition!)).toBe(true);
    expect(result.localJacobianCondition!).toBeLessThan(1e4);
    expect(result.calibrationManifold).toBe("log-rise-decay-on-off-4d");
    expect(result.message).toMatch(/no parameter-identifiability claim/i);
  });

  it.each([0.92, 1.08])(
    "maps a fixed-dose RT50 factor %s while holding the other phenotype targets",
    (rt50Factor) => {
      const center = centerPhenotype();
      const target: ContractileActivationPhenotypeV1 = {
        ...center,
        relaxationTimeTo50Sec: rt50Factor * center.relaxationTimeTo50Sec,
      };
      const result = calibrateEventDrivenActivationPhenotypeV1(
        target,
        CENTER_PARAMS,
        {
          sampleIntervalSec: SAMPLE_INTERVAL_SEC,
          normalizedResidualTolerance: 0.015,
        },
      );

      expect(result.status).toBe("converged");
      expect(result.internalParams).not.toBeNull();
      expect(result.targetResiduals!.normalizedMaximumAbsolute).toBeLessThanOrEqual(0.015);
      expect(Math.sign(
        result.realizedPhenotype!.phenotype.relaxationTimeTo50Sec -
          center.relaxationTimeTo50Sec,
      )).toBe(Math.sign(rt50Factor - 1));
      expect(result.realizedPhenotype!.phenotype.timeFromEventToPeakSec).toBeCloseTo(
        center.timeFromEventToPeakSec,
        2,
      );
    },
  );

  it("does not install a larger RT50 request when this seed/bounds/local solve fails", () => {
    const center = centerPhenotype();
    const result = calibrateEventDrivenActivationPhenotypeV1(
      {
        ...center,
        relaxationTimeTo50Sec: 1.2 * center.relaxationTimeTo50Sec,
      },
      CENTER_PARAMS,
      {
        sampleIntervalSec: SAMPLE_INTERVAL_SEC,
        normalizedResidualTolerance: 0.015,
      },
    );

    expect(result.status).not.toBe("converged");
    expect(result.internalParams).toBeNull();
    expect(result.candidateInternalParams).toBeDefined();
    expect(result.targetResiduals).not.toBeNull();
    expect(result.message).toMatch(/single-seed local/i);
    expect(result.message).toMatch(/does not establish/i);
  });

  it("fails closed when the same fit is rejected by the condition limit", () => {
    const result = calibrateEventDrivenActivationPhenotypeV1(
      centerPhenotype(),
      CENTER_PARAMS,
      {
        sampleIntervalSec: SAMPLE_INTERVAL_SEC,
        maximumJacobianCondition: 1,
      },
    );

    expect(result.status).toBe("ill-conditioned");
    expect(result.internalParams).toBeNull();
    expect(result.candidateInternalParams.contractileKinetics.offRatePerSec).toBeCloseTo(
      CENTER_PARAMS.contractileKinetics.offRatePerSec,
      12,
    );
    expect(result.realizedPhenotype).not.toBeNull();
    expect(result.localJacobianCondition!).toBeGreaterThan(1);
  });

  it("returns a JSON-safe null when the local condition estimate is non-finite", () => {
    const result = calibrateEventDrivenActivationPhenotypeV1(
      centerPhenotype(),
      CENTER_PARAMS,
      {
        sampleIntervalSec: SAMPLE_INTERVAL_SEC,
        finiteDifferenceLogStep: Number.MIN_VALUE,
      },
    );

    expect(result.status).toBe("ill-conditioned");
    expect(result.internalParams).toBeNull();
    expect(result.localJacobianCondition).toBeNull();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/NaN|Infinity/);
    expect(JSON.parse(serialized).localJacobianCondition).toBeNull();
  });

  it("rejects internally inconsistent phenotype requests before solving", () => {
    const center = centerPhenotype();
    expect(() => calibrateEventDrivenActivationPhenotypeV1(
      {
        ...center,
        excursionIntegralSec: 1.01 *
          center.peakExcursion01 * center.referenceCycleLengthSec,
      },
      CENTER_PARAMS,
    )).toThrow(/bounded-excursion maximum/);
    expect(() => calibrateEventDrivenActivationPhenotypeV1(
      {
        ...center,
        baselineDefinition: "event-window-minimum" as "periodic-pre-event",
      },
      CENTER_PARAMS,
    )).toThrow(/baselineDefinition/);
    expect(() => calibrateEventDrivenActivationPhenotypeV1(
      {
        ...center,
        timeFromEventToPeakSec: center.effectiveOnsetDelaySec,
      },
      CENTER_PARAMS,
    )).toThrow(/peak must follow/);
    expect(() => calibrateEventDrivenActivationPhenotypeV1(
      center,
      CENTER_PARAMS,
      {
        bounds: {
          riseTauSec: [0.03, 0.2],
          decayTauSec: [0.01, 0.2],
          onRatePerSec: [1, 100],
          offRatePerSec: [1, 100],
        },
      },
    )).toThrow(/seed internal parameters/);
  });
});
