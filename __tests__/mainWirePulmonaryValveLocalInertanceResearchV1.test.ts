import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_PROFILES_V1,
  resolveMainWirePulmonaryValveLocalInertanceResearchProfileV1,
  stepMainWirePulmonaryValveLocalInertanceScalarsV1,
  validateMainWirePulmonaryValveLocalInertanceResearchProfileV1,
} from "@/engine/valves/MainWirePulmonaryValveLocalInertanceResearchV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";

describe("research-only pulmonary-valve local inertance V1", () => {
  it("owns only the fixed 2/4/7 cm physical brackets", () => {
    const profiles = Object.values(
      MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_PROFILES_V1,
    );
    expect(profiles.map((profile) => profile.effectiveColumnLengthCm))
      .toEqual([2, 4, 7]);
    expect(profiles.map((profile) => profile.fixedFlowAreaCm2))
      .toEqual([4, 4, 4]);
    expect(profiles.map((profile) => profile.parameterSearchOrFitting))
      .toEqual([false, false, false]);
    expect(profiles[0]!.localInertanceMmHgSec2PerMl)
      .toBeCloseTo(0.0003975326, 10);
    expect(profiles[1]!.localInertanceMmHgSec2PerMl
      / profiles[0]!.localInertanceMmHgSec2PerMl).toBe(2);
    expect(profiles[2]!.localInertanceMmHgSec2PerMl
      / profiles[0]!.localInertanceMmHgSec2PerMl).toBeCloseTo(3.5, 14);
    for (const profile of profiles) {
      expect(validateMainWirePulmonaryValveLocalInertanceResearchProfileV1(
        profile,
      )).toEqual([]);
    }
    expect(() => resolveMainWirePulmonaryValveLocalInertanceResearchProfileV1(
      "unsupported" as never,
    )).toThrow(/unsupported/);
  });

  it("solves the implicit momentum law with an energy-consistent BE ledger and analytic tangent", () => {
    const profile = resolveMainWirePulmonaryValveLocalInertanceResearchProfileV1(
      "rvot-4cm-column-local-inertance",
    );
    const params = MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves.PV;
    const evaluate = (gradientMmHg: number) =>
      stepMainWirePulmonaryValveLocalInertanceScalarsV1(
        0.55,
        180,
        0.002,
        20 + gradientMmHg,
        20,
        params,
        profile,
      );
    const evaluation = evaluate(12);
    expect(evaluation.flowMlPerSec).toBeGreaterThan(0);
    expect(evaluation.tangentBranch).toBe("forward-inertial-open-orifice");
    expect(Math.abs(evaluation.openOrificeResidualMmHg)).toBeLessThan(1e-12);
    expect(Math.abs(evaluation.powerBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-9);

    const epsilon = 1e-5;
    const finiteDifference = (
      evaluate(12 + epsilon).flowMlPerSec
      - evaluate(12 - epsilon).flowMlPerSec
    ) / (2 * epsilon);
    expect(evaluation.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(finiteDifference, 5);
  });

  it("enforces unilateral competent-valve contact without reverse flow", () => {
    const profile = resolveMainWirePulmonaryValveLocalInertanceResearchProfileV1(
      "rvot-2cm-column-local-inertance",
    );
    const evaluation = stepMainWirePulmonaryValveLocalInertanceScalarsV1(
      0,
      0,
      0.002,
      10,
      20,
      MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves.PV,
      profile,
    );
    expect(evaluation.flowMlPerSec).toBe(0);
    expect(evaluation.tangentBranch).toBe("unilateral-flow-contact");
    expect(evaluation.competentReverseClosureActive).toBe(true);
    expect(Math.abs(evaluation.hydraulicBalanceResidualMmHg)).toBeLessThan(1e-12);
    expect(Math.abs(evaluation.powerBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-12);
  });
});
