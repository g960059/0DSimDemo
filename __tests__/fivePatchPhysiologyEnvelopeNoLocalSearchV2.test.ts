import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import * as definitionExports from
  "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2";
import {
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DEFINITION_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2";

describe("five-patch physiology envelope V2 non-local-search contract", () => {
  it("precommits an outcome-independent global envelope", () => {
    const protocol = FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2;
    expect(protocol.design).toMatchObject({
      sampleCount: 64,
      dimensionCount: 12,
      selectionUsesSimulationOutcomes: false,
    });
    expect(protocol.executionPolicy).toMatchObject({
      initialization: "independent-cold-start-each-point-scenario",
      scenarioComposition: "scenario-scales-multiply-mapped-candidate-scales",
      crossCandidateWarmStartAllowed: false,
      simulationOutcomeAdaptiveSamplingAllowed: false,
      gradientOrLocalOptimizerAllowed: false,
      scalarWinnerScoreAllowed: false,
      automaticWinnerSelectionAllowed: false,
      parameterRangeChangeAfterOutcomeInspectionAllowed: false,
      resultDependentRunExtensionAllowed: false,
    });
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DEFINITION_V2.selectionPolicy)
      .toEqual({
        type: "pre-registered-space-filling-envelope-with-fixed-subsets",
        usesSimulationOutcomeToChoosePoints: false,
        localOptimizationAvailable: false,
        automaticWinnerSelectionAvailable: false,
        vLoopMetricsAreReportOnly: true,
      });
    expect(protocol.claimBoundary).toMatchObject({
      runtimeAdoption: false,
      patientFit: false,
      normalHumanCalibration: false,
      physiologyAcceptance: false,
      structuralWinnerDeclared: false,
      vLoopMechanismDeclared: false,
      designMayBeChangedAfterResults: false,
    });
  });

  it("keeps all V-loop outputs report-only and outside every decision path", () => {
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.executionPolicy)
      .toMatchObject({
        vLoopMetricsAffectEligibility: false,
        vLoopMetricsAffectSelection: false,
        settleAndAssess: { morphologyMetricsUsedAsSettlingGate: false },
      });
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.reportingPolicy)
      .toMatchObject({
        vLoopStatus: "report-only",
        excludedFromSettling: true,
        excludedFromOperatingPointEligibility: true,
        excludedFromCandidateSelection: true,
        excludedFromRangeRevision: true,
      });
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.eligibilityPolicy)
      .toMatchObject({
        predeclaredBeforeSimulationResults: true,
        numerical: { excludedMetrics: ["v-loop"] },
        broadOperatingPoint: {
          role: "plausibility-screen-not-normal-human-calibration",
          excludedMetrics: ["v-loop"],
          valveReverseFlow: {
            reverseFlowDuty: {
              status: "report-only",
              eligibilityThreshold: null,
            },
          },
        },
      });
  });

  it("contains no runner, subsystem, result, or random-number dependency", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2.ts",
      ),
      "utf8",
    );
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("engine/mechanics2/subsystems/");
    expect(source).not.toContain("engine/mechanics2/benches/");
    expect(source).not.toContain("data/mechanics2/reports/");
    expect(source).not.toContain("FivePatchModelEnvelopeRunnerV1");
    expect(Object.keys(definitionExports).some((name) =>
      /run|fit|score|rank|optimize/i.test(name)
    )).toBe(false);
  });

  it("does not mutate or masquerade as the V1 protocol", () => {
    const v1 = JSON.parse(readFileSync(resolve(
      process.cwd(),
      "data/mechanics2/protocols/five-patch-model-envelope-v1.json",
    ), "utf8")) as { protocolId: string; design: { dimensionCount: number } };
    expect(v1).toMatchObject({
      protocolId: "five-patch-model-envelope-v1",
      design: { dimensionCount: 16 },
    });
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.protocolId).toBe(
      "five-patch-physiology-envelope-v2",
    );
    expect(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.design.dimensionCount)
      .toBe(12);
  });
});
