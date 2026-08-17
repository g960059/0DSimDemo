import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1,
  MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1,
  MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUTS_V1,
  MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
  MAIN_WIRE_FOUR_VALVE_IDS_V1,
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
  composeMainWireFourValveDiseaseResearchInputV1,
  createMainWireFourValveContinuousAreaResearchInputV1,
  validateAndOwnMainWireFourValveAreaInputsV1,
  validateMainWireFourValveDiseaseResearchInputV1,
  type MainWireFourValveDiseaseResearchInputV1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";

describe("main-wire four-valve disease research input V1", () => {
  it("publishes the complete V2 normal baseline valve parameter set", () => {
    expect(MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.bracketIds).toEqual(
      [],
    );
    expect(MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves).toEqual({
      MV: expect.objectContaining({
        valveId: "MV",
        backgroundLinearResistanceMmHgSecPerMl: 0.0027,
        maximumForwardEoaCm2: 5.5,
        closedReverseEroaCm2: 0,
        openingGainPerMmHg: 2,
        openingDriveDeadbandMmHg: 0.6,
        openingTimeConstantSec: 0.024,
        closingTimeConstantSec: 0.016,
      }),
      AoV: expect.objectContaining({
        valveId: "AoV",
        backgroundLinearResistanceMmHgSecPerMl: 0.0015,
        maximumForwardEoaCm2: 3.5,
        closedReverseEroaCm2: 0,
        openingGainPerMmHg: 3,
        openingTimeConstantSec: 0.006,
        closingTimeConstantSec: 0.008,
      }),
      TV: expect.objectContaining({
        valveId: "TV",
        backgroundLinearResistanceMmHgSecPerMl: 0.0035,
        maximumForwardEoaCm2: 8,
        closedReverseEroaCm2: 0,
        openingTimeConstantSec: 0.018,
        closingTimeConstantSec: 0.01,
      }),
      PV: expect.objectContaining({
        valveId: "PV",
        backgroundLinearResistanceMmHgSecPerMl: 0.005,
        maximumForwardEoaCm2: 4,
        closedReverseEroaCm2: 0,
        openingTimeConstantSec: 0.01,
        closingTimeConstantSec: 0.006,
      }),
    });
    expect(MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.claim).toMatchObject({
      researchInputRole: "ordered-research-bracket-not-clinical-diagnosis",
      clinicalDiagnosisOrSeverityClaimed: false,
      clinicalEoaSemantics:
        "effective-orifice-area-with-discharge-coefficient-absorbed-exactly-once",
      backgroundLinearResistance:
        "reference-topology-derived-series-loss-fixed-across-brackets-not-effective-area-scaled",
      closedReverseEroaInterpretation:
        "clinical-reverse-phase-EROA-seeded-bidirectional-residual-hydraulic-gap",
      valveBulkFlowMemory: false,
      rootInertanceOwnership: { systemic: "Ao_SA", pulmonary: "PA_PArt" },
      stenosisAndRegurgitationParameterFieldsComposeWithoutConflict: true,
      allDirectionFlowResponsesAreIndependent: false,
    });
    expect(
      validateMainWireFourValveDiseaseResearchInputV1(
        MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
      ),
    ).toEqual([]);
  });

  it("publishes 24 complete, explicitly non-diagnostic research brackets", () => {
    expect(MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1).toHaveLength(24);
    expect(new Set(MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1).size).toBe(24);
    expect(MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1).toHaveLength(24);
    expect(
      Object.keys(MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUTS_V1),
    ).toHaveLength(24);
    for (const bracket of MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1) {
      const researchInput =
        MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUTS_V1[bracket.bracketId];
      expect(Object.keys(researchInput.valves).sort()).toEqual(
        [...MAIN_WIRE_FOUR_VALVE_IDS_V1].sort(),
      );
      expect(researchInput.bracketIds).toEqual([bracket.bracketId]);
      expect(bracket.label).toContain("research bracket");
      expect(bracket.label).toContain("not a clinical diagnosis");
      expect(bracket.labelSemantics).toBe(
        "research-bracket-not-clinical-diagnosis",
      );
      expect(bracket.requiresClosedLoopHemodynamicValidation).toBe(true);
      expect(bracket.requiresPostSolveAreaCalibration).toBe(
        bracket.lesionCode === "PS" || bracket.lesionCode === "PR",
      );
      expect(
        validateMainWireFourValveDiseaseResearchInputV1(researchInput),
      ).toEqual([]);
    }
  });

  it("changes only the target valve area while preserving healthy kinetics", () => {
    for (const bracket of MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1) {
      const researchInput =
        MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUTS_V1[bracket.bracketId];
      for (const valveId of MAIN_WIRE_FOUR_VALVE_IDS_V1) {
        const normal =
          MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves[valveId];
        const candidate = researchInput.valves[valveId];
        expect(kinetics(candidate)).toEqual(kinetics(normal));
        if (valveId !== bracket.targetValveId) {
          expect(physicalParameters(candidate)).toEqual(
            physicalParameters(normal),
          );
          continue;
        }
        if (bracket.lesionKind === "stenosis") {
          expect(candidate.maximumForwardEoaCm2).toBe(bracket.areaCm2);
          expect(candidate.closedReverseEroaCm2).toBe(
            normal.closedReverseEroaCm2,
          );
        } else {
          expect(candidate.closedReverseEroaCm2).toBe(bracket.areaCm2);
          expect(candidate.maximumForwardEoaCm2).toBe(
            normal.maximumForwardEoaCm2,
          );
        }
      }
    }
  });

  it("uses the requested area brackets and evidence-strength metadata", () => {
    expect(area("AS-mild")).toBe(1.75);
    expect(area("AS-moderate")).toBe(1.25);
    expect(area("AS-severe")).toBe(0.8);
    expect(area("MS-mild")).toBe(1.75);
    expect(area("MS-moderate")).toBe(1.25);
    expect(area("MS-severe")).toBe(0.8);
    expect(area("TS-mild")).toBe(2.0);
    expect(area("TS-moderate")).toBe(1.4);
    expect(area("TS-severe")).toBe(0.9);
    expect(area("PS-mild")).toBe(1.4);
    expect(area("PS-moderate")).toBe(0.7);
    expect(area("PS-severe")).toBe(0.45);
    expect(area("AR-mild")).toBe(0.05);
    expect(area("AR-moderate")).toBe(0.2);
    expect(area("AR-severe")).toBe(0.35);
    expect(area("MR-mild")).toBe(0.1);
    expect(area("MR-moderate")).toBe(0.25);
    expect(area("MR-severe")).toBe(0.45);
    expect(area("TR-mild")).toBe(0.1);
    expect(area("TR-moderate")).toBe(0.3);
    expect(area("TR-severe")).toBe(0.5);
    expect(area("PR-mild")).toBe(0.1);
    expect(area("PR-moderate")).toBe(0.4);
    expect(area("PR-severe")).toBe(0.9);

    for (const code of ["AS", "MS", "AR", "MR", "TR"] as const) {
      expect(bracket(`${code}-moderate`).evidenceBasis).toBe(
        "guideline-area-anchor",
      );
      expect(bracket(`${code}-moderate`).clinicalAreaThresholdStatus).toBe(
        "guideline-area-anchor",
      );
    }
    expect(bracket("TS-mild").evidenceBasis).toBe("engineering-only-bracket");
    expect(bracket("TS-moderate").evidenceBasis).toBe(
      "engineering-only-bracket",
    );
    expect(bracket("TS-severe").evidenceBasis).toBe("guideline-area-anchor");
    expect(bracket("TS-moderate").clinicalAreaThresholdStatus).toBe(
      "engineering-only-no-clinical-grade-anchor",
    );
    expect(bracket("TS-severe").clinicalAreaThresholdStatus).toBe(
      "guideline-significant-endpoint-anchor",
    );
    expect(bracket("PS-moderate").evidenceBasis).toBe(
      "hemodynamic-calibration-required",
    );
    expect(bracket("PR-moderate").evidenceBasis).toBe(
      "hemodynamic-calibration-required",
    );
    expect(bracket("PS-moderate").clinicalAreaThresholdStatus).toBe(
      "no-fixed-clinical-area-threshold",
    );
    expect(bracket("PR-moderate").clinicalAreaThresholdStatus).toBe(
      "no-fixed-clinical-area-threshold",
    );
  });

  it("composes same-valve stenosis and regurgitation parameter fields without conflict", () => {
    const mixed = composeMainWireFourValveDiseaseResearchInputV1([
      "AS-severe",
      "AR-moderate",
    ]);
    expect(mixed.valves.AoV.maximumForwardEoaCm2).toBe(0.8);
    expect(mixed.valves.AoV.closedReverseEroaCm2).toBe(0.2);
    expect(kinetics(mixed.valves.AoV)).toEqual(
      kinetics(MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves.AoV),
    );
    for (const valveId of ["MV", "TV", "PV"] as const) {
      expect(physicalParameters(mixed.valves[valveId])).toEqual(
        physicalParameters(
          MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves[valveId],
        ),
      );
    }
  });

  it("owns continuous four-valve EOA/EROA inputs with distinct provenance", () => {
    const areas = validateAndOwnMainWireFourValveAreaInputsV1({
      ...MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
      MV: {
        maximumForwardEoaCm2: 1.1,
        closedReverseEroaCm2: 0.25,
      },
      AoV: {
        maximumForwardEoaCm2: 0.8,
        closedReverseEroaCm2: 0.2,
      },
    });
    const continuous =
      createMainWireFourValveContinuousAreaResearchInputV1(areas);

    expect(continuous.bracketIds).toEqual([]);
    expect(continuous.brackets).toEqual([]);
    expect(continuous.valves.MV).toMatchObject(areas.MV);
    expect(continuous.valves.AoV).toMatchObject(areas.AoV);
    expect(continuous.valves.MV.parameterSetId).toContain("continuous");
    expect(continuous.parameterSetId).toContain("continuous-areas");
    expect(continuous.claim).toMatchObject({
      researchInputRole:
        "continuous-effective-area-research-not-clinical-diagnosis",
      canonicalSeverityBracketClaimed: false,
    });
    expect(validateMainWireFourValveDiseaseResearchInputV1(continuous)).toEqual(
      [],
    );
    expect(continuous).not.toEqual(
      MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
    );
  });

  it("rejects continuous valve areas outside the numerical envelope", () => {
    expect(() =>
      validateAndOwnMainWireFourValveAreaInputsV1({
        ...MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
        AoV: {
          maximumForwardEoaCm2: 0.4,
          closedReverseEroaCm2: 0,
        },
      }),
    ).toThrow(/AoV maximum forward EOA/);
    expect(() =>
      validateAndOwnMainWireFourValveAreaInputsV1({
        ...MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
        PV: {
          maximumForwardEoaCm2: 0.35,
          closedReverseEroaCm2: 0.4,
        },
      }),
    ).toThrow(/reverse EROA must not exceed forward EOA/);
  });

  it("makes composition identities and parameter sets independent of order", () => {
    const left = composeMainWireFourValveDiseaseResearchInputV1([
      "MR-moderate",
      "PS-severe",
      "AS-mild",
    ]);
    const right = composeMainWireFourValveDiseaseResearchInputV1([
      "AS-mild",
      "MR-moderate",
      "PS-severe",
    ]);
    expect(left).toEqual(right);
    expect(left.parameterSetId).toBe(right.parameterSetId);
    expect(left.parameterIdentityHash).toBe(right.parameterIdentityHash);
    expect(left.bracketIds).toEqual(["AS-mild", "MR-moderate", "PS-severe"]);
  });

  it("rejects duplicate direction lesions on one valve but permits mixed disease", () => {
    expect(() =>
      composeMainWireFourValveDiseaseResearchInputV1(["AS-mild", "AS-severe"]),
    ).toThrow(/conflicting four-valve disease brackets/);
    expect(() =>
      composeMainWireFourValveDiseaseResearchInputV1(["MR-mild", "MR-mild"]),
    ).toThrow(/conflicting four-valve disease brackets/);
    expect(() =>
      composeMainWireFourValveDiseaseResearchInputV1([
        "AS-moderate",
        "AR-severe",
      ]),
    ).not.toThrow();
    expect(() =>
      composeMainWireFourValveDiseaseResearchInputV1([
        "AS-moderate",
        "MS-severe",
      ]),
    ).not.toThrow();
  });

  it("rejects closed reverse EROA larger than forward maximum EOA", () => {
    const valid = composeMainWireFourValveDiseaseResearchInputV1(["AS-severe"]);
    const invalid = {
      ...valid,
      valves: {
        ...valid.valves,
        AoV: {
          ...valid.valves.AoV,
          closedReverseEroaCm2: 0.81,
        },
      },
    } as MainWireFourValveDiseaseResearchInputV1;
    expect(validateMainWireFourValveDiseaseResearchInputV1(invalid)).toContain(
      "valves.AoV.closedReverseEroaCm2 must not exceed maximumForwardEoaCm2",
    );
  });

  it("rejects spoofed bracket, hash, claim, and per-valve provenance", () => {
    const valid = composeMainWireFourValveDiseaseResearchInputV1([
      "MR-moderate",
    ]);
    const spoofed = {
      ...valid,
      bracketIds: ["AR-moderate"],
      brackets: [bracket("AR-moderate")],
      parameterIdentityHash: "deadbeef",
      claim: {
        ...valid.claim,
        clinicalDiagnosisOrSeverityClaimed: true,
      },
    } as unknown as MainWireFourValveDiseaseResearchInputV1;
    const issues = validateMainWireFourValveDiseaseResearchInputV1(spoofed);
    expect(issues).toContain("claim must exactly match the canonical V1 claim");
    expect(issues).toContain(
      "parameterIdentityHash does not match research input contents",
    );
    expect(issues).toContain(
      "valves.MV.parameterSetId does not match bracket provenance",
    );
    expect(issues).toContain(
      "valves.AoV.parameterSetId does not match bracket provenance",
    );
  });
});

function bracket(
  bracketId: (typeof MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1)[number],
) {
  return MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1.find(
    (candidate) => candidate.bracketId === bracketId,
  )!;
}

function area(
  bracketId: (typeof MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1)[number],
): number {
  return bracket(bracketId).areaCm2;
}

function kinetics(
  params: MainWireFourValveDiseaseResearchInputV1["valves"]["MV"],
) {
  return {
    openingGainPerMmHg: params.openingGainPerMmHg,
    openingPressureOffsetMmHg: params.openingPressureOffsetMmHg,
    openingDriveDeadbandMmHg: params.openingDriveDeadbandMmHg,
    openingDriveSmoothingMmHg: params.openingDriveSmoothingMmHg,
    openingTimeConstantSec: params.openingTimeConstantSec,
    closingTimeConstantSec: params.closingTimeConstantSec,
  };
}

function physicalParameters(
  params: MainWireFourValveDiseaseResearchInputV1["valves"]["MV"],
) {
  const { parameterSetId: _parameterSetId, ...physical } = params;
  return physical;
}
