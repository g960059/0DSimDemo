import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import * as envelopeExports from
  "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";
import {
  FIVE_PATCH_MODEL_ENVELOPE_DEFINITION_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";

describe("five-patch envelope non-local-search contract", () => {
  it("commits the design and all subsets before any model result", () => {
    const protocol = FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1;
    expect(protocol.design).toMatchObject({
      sampleCount: 64,
      dimensionCount: 16,
      selectionUsesSimulationOutcomes: false,
      sameUnitPointsAcrossStructuralArms: true,
    });
    expect(protocol.executionPolicy).toMatchObject({
      initialization: "independent-cold-start-each-arm-point-scenario",
      bloodVolumeAllocation: {
        meaning:
          "exact-total-blood-volume-scale-with-fixed-compliant-venous-allocation",
        mutableCompartments: ["systemicVeinMl", "pulmonaryVeinMl"],
        systemicVeinWeight: 60,
        pulmonaryVeinWeight: 13,
      },
      crossCandidateWarmStartAllowed: false,
      simulationOutcomeAdaptiveSamplingAllowed: false,
      gradientOrLocalOptimizerAllowed: false,
      scalarWinnerScoreAllowed: false,
      automaticWinnerSelectionAllowed: false,
      parameterRangeChangeAfterOutcomeInspectionAllowed: false,
      fullStateReturnMapMaxAbsDimensionlessTolerance: 1e-4,
      settleAndAssess: {
        appliesToPhases: ["screening", "stress-validation", "dt-refinement"],
        singleContinuousRun: true,
        resultDependentExtensionAllowed: false,
        calciumAmplitudeRamp: {
          beatNumbers: [1, 2, 3, 4],
          commonMultipliers: [0.25, 0.5, 0.75, 1],
        },
        discardSettleBeatNumbersInclusive: [5, 29],
        assessmentBeatNumbersInclusive: [30, 32],
        retainedAssessmentCycleBoundaryStateCount: 3,
        retainedRawCycleCount: 2,
        consecutiveFullStateReturnMapCount: 2,
        evaluationRequiresCompletedRun: true,
        morphologyMetricsUsedAsSettlingGate: false,
      },
      screening: { retainEveryEndpointOfFinalCycle: true },
      armNumericalReadiness: { retainEveryEndpointOfFinalCycle: true },
      stressValidation: { retainEveryEndpointOfFinalCycle: true },
      dtRefinement: { retainEveryEndpointOfFinalCycle: true },
    });
    expect(protocol.claimBoundary).toMatchObject({
      patientFit: false,
      physiologyAcceptance: false,
      structuralWinnerDeclared: false,
      designMayBeChangedAfterResults: false,
    });
    expect(FIVE_PATCH_MODEL_ENVELOPE_DEFINITION_V1.selectionPolicy).toEqual({
      type: "pre-registered-space-filling-envelope-with-fixed-subsets",
      usesSimulationOutcomeToChoosePoints: false,
      localOptimizationAvailable: false,
      automaticWinnerSelectionAvailable: false,
    });
  });

  it("contains no runner, subsystem, report, or random-number dependency", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1.ts",
      ),
      "utf8",
    );
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("engine/mechanics2/subsystems/");
    expect(source).not.toContain("engine/mechanics2/benches/");
    expect(source).not.toContain("data/mechanics2/reports/");
    expect(Object.keys(envelopeExports).some((name) =>
      /run|fit|score|rank|optimize/i.test(name)
    )).toBe(false);
  });

  it("keeps the runner free of fitting, ranking, and outcome-driven batch stops", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1.ts",
      ),
      "utf8",
    );
    expect(source).not.toContain("Math.random");
    expect(source).not.toMatch(/break\s*;\s*}\s*return Object\.freeze\(canonical\.slice/);
    expect(source).toContain(
      "outcomeDependentBatchStoppingAllowed: false",
    );
    expect(source).toContain(
      "contributesToPhysiologyOrModelClassPassFraction: false",
    );
    expect(source).toContain(
      "runFivePatchModelEnvelopeProtocolRunV1(request, options)",
    );
    expect(source).not.toContain("sourceParams.Tref =");
  });

  it("selects validation points by index, never by candidate outcome", () => {
    const stress = FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1.executionPolicy
      .stressValidation;
    const dt = FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1.executionPolicy
      .dtRefinement;
    expect(stress.selection).toBe("fixed-index-modulo-4-before-results");
    expect(stress.candidateIndices).toEqual(
      Array.from({ length: 16 }, (_, index) => index * 4),
    );
    expect(dt.selection).toBe("fixed-index-quartiles-before-results");
    expect(dt.candidateIndices).toEqual([0, 16, 32, 48]);
    expect(dt.dtSec).toEqual([0.005, 0.0025]);
  });
});
