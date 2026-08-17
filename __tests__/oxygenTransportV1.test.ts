import { describe, expect, it } from "vitest";

import {
  DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
  evaluateOxygenTransportV1,
  validateAndOwnOxygenTransportInputsV1,
} from "@/engine/physiology/oxygenTransportV1";

describe("whole-body beat-mean oxygen transport V1", () => {
  it("closes the default Fick and true-shunt content balances exactly", () => {
    const result = evaluateOxygenTransportV1(
      DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
      5,
    );

    expect(result.fickClosureStatus).toBe("feasible-within-content-domain");
    expect(result.alveolarOxygenPressureMmHg).toBeCloseTo(99.73, 10);
    expect(result.arterialOxygenContentMlPerDl).not.toBeNull();
    expect(result.requiredMixedVenousOxygenContentMlPerDl).not.toBeNull();
    expect(
      result.arterialOxygenContentMlPerDl! -
        result.requiredMixedVenousOxygenContentMlPerDl!,
    ).toBeCloseTo(5, 12);
    expect(result.oxygenDeliveryMlPerMin).toBeCloseTo(
      5 * 10 * result.arterialOxygenContentMlPerDl!,
      12,
    );
    expect(result.requiredOxygenExtractionRatio01).toBeCloseTo(
      result.targetOxygenConsumptionMlPerMin / result.oxygenDeliveryMlPerMin!,
      12,
    );
    expect(result.oxygenDeliveryToConsumptionRatio).toBeCloseTo(
      1 / result.requiredOxygenExtractionRatio01!,
      12,
    );
  });

  it("shows the expected supply directions without changing target VO2", () => {
    const baseline = evaluateOxygenTransportV1(
      DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
      5,
    );
    const anemia = evaluateOxygenTransportV1(
      {
        ...DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
        hemoglobinGPerDl: 8,
      },
      5,
    );
    const lowFlow = evaluateOxygenTransportV1(
      DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
      3,
    );
    const shunt = evaluateOxygenTransportV1(
      {
        ...DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
        trueShuntFraction01: 0.2,
      },
      5,
    );

    expect(anemia.targetOxygenConsumptionMlPerMin).toBe(
      baseline.targetOxygenConsumptionMlPerMin,
    );
    expect(anemia.oxygenDeliveryMlPerMin!).toBeLessThan(
      baseline.oxygenDeliveryMlPerMin!,
    );
    expect(anemia.requiredOxygenExtractionRatio01!).toBeGreaterThan(
      baseline.requiredOxygenExtractionRatio01!,
    );
    expect(lowFlow.requiredMixedVenousOxygenPressureMmHg!).toBeLessThan(
      baseline.requiredMixedVenousOxygenPressureMmHg!,
    );
    expect(lowFlow.requiredOxygenExtractionRatio01!).toBeGreaterThan(
      baseline.requiredOxygenExtractionRatio01!,
    );
    expect(shunt.arterialOxygenContentMlPerDl!).toBeLessThan(
      baseline.arterialOxygenContentMlPerDl!,
    );
    expect(shunt.alveolarArterialOxygenGradientMmHg!).toBeGreaterThan(
      baseline.alveolarArterialOxygenGradientMmHg!,
    );
  });

  it("returns explicit infeasibility instead of inventing delivered VO2", () => {
    const zeroFlow = evaluateOxygenTransportV1(
      DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
      0,
    );
    const reverseFlow = evaluateOxygenTransportV1(
      DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
      -1,
    );
    const insufficientFlow = evaluateOxygenTransportV1(
      DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
      0.1,
    );

    expect(zeroFlow.fickClosureStatus).toBe("requires-nonpositive-flow");
    expect(reverseFlow.fickClosureStatus).toBe("requires-nonpositive-flow");
    expect(zeroFlow.oxygenDeliveryMlPerMin).toBeNull();
    expect(insufficientFlow.fickClosureStatus).toBe(
      "requires-negative-venous-content",
    );
    expect(insufficientFlow.requiredMixedVenousOxygenContentMlPerDl).toBeNull();
  });

  it("rejects exact-field, range, and alveolar-gas inconsistencies", () => {
    expect(() =>
      validateAndOwnOxygenTransportInputsV1({
        ...DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
        extra: 1,
      }),
    ).toThrow(/fields must match exactly/);
    expect(() =>
      validateAndOwnOxygenTransportInputsV1({
        ...DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
        hemoglobinGPerDl: 4.9,
      }),
    ).toThrow(/hemoglobinGPerDl/);
    expect(() =>
      validateAndOwnOxygenTransportInputsV1({
        ...DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
        barometricPressureMmHg: 500,
        arterialCarbonDioxidePressureMmHg: 80,
        respiratoryExchangeRatio: 0.7,
      }),
    ).toThrow(/nonpositive alveolar PO2/);
  });
});
