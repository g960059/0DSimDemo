import { describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowDriverRootAblationV1,
  type MainWireAorticOutflowDriverRootArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowDriverRootComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1,
  measureMainWireAorticOutflowArterialStiffnessAblationV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import {
  compareMainWireAorticOutflowCompliancePartitionV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCompliancePartitionComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
  compareMainWireAorticOutflowCalciumComplianceFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumComplianceFactorialV1";
import {
  replayMainWireAorticValveLocalInertanceV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLocalInertanceReplayV1";
import {
  MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_CLAIM_V1,
  resolveMainWireAorticRootInertanceResearchProfileV1,
  validateMainWireAorticRootInertanceResearchProfileV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import {
  MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1,
} from "@/engine/core/MainWireAorticCompliancePartitionResearchProfileV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1,
  stepMainWireAorticValveLocalInertanceScalarsV1,
  validateMainWireAorticValveLocalInertanceProfileV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDriverRootAblationV1";
import {
  runMainWireNormalAdultFiveWallAorticValveLocalInertanceResearchV1,
  runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1,
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire aortic outflow driver/root ablation V1", () => {
  it("seals the graph-owned Ao_SA inertance scale as a fixed profile", () => {
    const profile = resolveMainWireAorticRootInertanceResearchProfileV1(
      "aortic-root-inertance-high",
    );
    expect(profile).toEqual({
      profileId: "aortic-root-inertance-high",
      dynamicEdgeId: "Ao_SA",
      inertanceScaleFromTopology: 4 / 3,
      parameterSearchOrFitting: false,
    });
    expect(validateMainWireAorticRootInertanceResearchProfileV1(profile))
      .toEqual([]);
    expect(validateMainWireAorticRootInertanceResearchProfileV1({
      ...profile,
      inertanceScaleFromTopology: 2,
    })).toContain(
      "aortic-root inertance research profile inertanceScaleFromTopology differs from its fixed value",
    );
    expect(MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_CLAIM_V1)
      .toMatchObject({
        dynamicFlowStateOwnerChanged: false,
        acceptedStateOrCheckpointTopologyChanged: false,
        valveLocalFlowStateAdded: false,
        valveLocalInertanceAdded: false,
      });
  });

  it("uses an energy-consistent unilateral BE law for the isolated AoV local L", () => {
    const profile = MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1;
    const params = MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1.valves.AoV;
    expect(validateMainWireAorticValveLocalInertanceProfileV1(profile))
      .toEqual([]);
    const evaluate = (upstreamPressureMmHg: number) =>
      stepMainWireAorticValveLocalInertanceScalarsV1(
        0.8,
        500,
        0.001,
        upstreamPressureMmHg,
        90,
        params,
        0.00025,
        profile,
      );
    const center = evaluate(110);
    expect(center.flowMlPerSec).toBeGreaterThan(0);
    expect(center.tangentBranch).toBe("forward-inertial-open-orifice");
    expect(Math.abs(center.openOrificeResidualMmHg)).toBeLessThan(1e-10);
    expect(Math.abs(center.powerBalanceResidualMmHgMlPerSec))
      .toBeLessThan(1e-8);
    const epsilon = 1e-5;
    const finiteDifference = (
      evaluate(110 + epsilon).flowMlPerSec
      - evaluate(110 - epsilon).flowMlPerSec
    ) / (2 * epsilon);
    expect(center.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(finiteDifference, 5);

    const adverse = stepMainWireAorticValveLocalInertanceScalarsV1(
      0.8,
      500,
      0.001,
      85,
      90,
      params,
      0.00025,
      profile,
    );
    expect(adverse.flowMlPerSec).toBeGreaterThan(0);
    expect(adverse.activeDirection).toBe("forward");
    expect(adverse.inertialPressureMmHg).toBeLessThan(0);
  });

  it("runs the fixed 2x2 arms with exact identities and no state-topology change", () => {
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const runs = MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1.map(
      (armId) => runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        armId,
      ),
    );
    const byId = new Map(runs.map((run) => [run.arm.armId, run]));
    const baseline = byId.get("canonical")!;
    const lowDriver = byId.get("ventricular-tref-low")!;
    const highRoot = byId.get("aortic-root-inertance-high")!;
    const combined = byId.get(
      "ventricular-tref-low-plus-aortic-root-inertance-high",
    )!;

    expect(baseline.periodicResult.protocolIdentityHash)
      .toBe(canonical.protocolIdentityHash);
    expect(baseline.periodicResult.retainedCompleteBeats)
      .toEqual(canonical.retainedCompleteBeats);
    expect(lowDriver.periodicResult.protocolComponentHashes
      .mechanicsProviderMetadataStableHash).not.toBe(
        baseline.periodicResult.protocolComponentHashes
          .mechanicsProviderMetadataStableHash,
      );
    expect(highRoot.periodicResult.protocolComponentHashes
      .mechanicsProviderMetadataStableHash).toBe(
        baseline.periodicResult.protocolComponentHashes
          .mechanicsProviderMetadataStableHash,
      );
    expect(highRoot.periodicResult.protocolComponentHashes
      .circulationRuntimeStableHash).not.toBe(
        baseline.periodicResult.protocolComponentHashes
          .circulationRuntimeStableHash,
      );
    expect(combined.periodicResult.protocolComponentHashes
      .circulationRuntimeStableHash).toBe(
        highRoot.periodicResult.protocolComponentHashes
          .circulationRuntimeStableHash,
      );
    expect(combined.periodicResult.protocolComponentHashes
      .mechanicsProviderMetadataStableHash).toBe(
        lowDriver.periodicResult.protocolComponentHashes
          .mechanicsProviderMetadataStableHash,
      );
    for (const run of runs) {
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.claim.aorticValveConstitutiveLawChanged).toBe(false);
      expect(run.claim.acceptedStateOrCheckpointTopologyChanged).toBe(false);
      expect(Object.keys(run.periodicResult.terminalCycleBoundaryWarmStart!
        .checkpoint.circulation.state.dynamicEdgeFlowsMlPerSec))
        .toEqual(["Ao_SA", "PA_PArt"]);
    }
    expect(MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_CLAIM_V1)
      .toMatchObject({
        oneSidedFactorial: true,
        mainEffectsAndInteractionEstimable: true,
        aorticValveConstitutiveLawChanged: false,
      });
  }, 60_000);

  it("couples the historical local L with runner-owned atomic q promotion", () => {
    const run =
      runMainWireNormalAdultFiveWallAorticValveLocalInertanceResearchV1({
        dtSec: 0.02,
        maximumBeatCount: 2,
      });
    expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
    expect(run.periodicResult.terminalCycleBoundaryWarmStart).toBeNull();
    expect(run.externalFlowStateAudit.standardWarmStartEmitted).toBe(false);
    expect(run.externalFlowStateAudit
      .externalFlowPromotedOnlyAfterSuccessfulCoupledStep).toBe(true);
    expect(run.externalFlowStateAudit.cycleBoundaryAcceptedFlowsMlPerSec)
      .toHaveLength(3);
    expect(run.externalFlowStateAudit.cycleBoundaryAcceptedFlowsMlPerSec
      .every((flow) => flow === 0)).toBe(true);
    expect(run.externalFlowStateAudit.period1BoundaryClosureSatisfied)
      .toBe(false);
    const beat = run.periodicResult.retainedCompleteBeats.at(-1)!;
    expect(beat.samples.some((sample) =>
      sample.circulationEdgeFlowMlPerSec.AoV > 0)).toBe(true);
    expect(beat.samples.every((sample) =>
      Number.isFinite(
        sample.valveHydraulics.AoV.powerBalanceResidualMmHgMlPerSec,
      ))).toBe(true);
    expect(Object.keys(run.periodicResult.terminalCycleBoundaryWarmStart ?? {}))
      .toEqual([]);
  }, 60_000);

  it("separates driver and root main effects with exact root balance diagnostics", () => {
    const inputs: MainWireAorticOutflowDriverRootArmInputV1[] =
      MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1.map(
        (armId) => {
          const run = runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
            { dtSec: 0.02, maximumBeatCount: 2 },
            armId,
          );
          return { armId, periodicResult: run.periodicResult };
        },
      );
    const comparison =
      compareMainWireAorticOutflowDriverRootAblationV1(inputs);
    expect(comparison.arms).toHaveLength(4);
    expect(comparison.factorialContrasts).toHaveLength(14);
    expect(comparison.claim.nodeAndDopplerGradientsAreNotInterchangeable)
      .toBe(true);
    const canonical = comparison.arms[0]!;
    const lowDriver = comparison.arms[1]!;
    const highRoot = comparison.arms[2]!;
    const combined = comparison.arms[3]!;
    expect(canonical.ventricularLandTrefScaleFromBaseline).toBe(1);
    expect(lowDriver.ventricularLandTrefScaleFromBaseline).toBe(0.75);
    expect(highRoot.aorticRootInertanceScaleFromTopology).toBeCloseTo(4 / 3);
    expect(combined.aorticRootEffectiveInertanceMmHgSec2PerMl)
      .toBeCloseTo(
        canonical.aorticRootTopologyInertanceMmHgSec2PerMl * 4 / 3,
        14,
      );
    for (const arm of comparison.arms) {
      expect(arm.aorticMaximumFlowMlPerSec).toBeGreaterThan(0);
      expect(arm.aorticFlowPeakCountAboveFivePercent).toBeGreaterThanOrEqual(1);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeGreaterThanOrEqual(0);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeLessThanOrEqual(1);
      expect(arm.maximumAbsoluteAorticRootPressureBalanceResidualMmHg)
        .toBeLessThan(1e-8);
      expect(allNumbersFinite(arm)).toBe(true);
    }
    expect(comparison.factorialContrasts.every(allNumbersFinite)).toBe(true);
    const replay = replayMainWireAorticValveLocalInertanceV1(
      inputs[0]!.periodicResult,
    );
    expect(replay.profiles).toHaveLength(2);
    expect(replay.profiles[0]!
      .maximumAbsoluteFlowDifferenceFromExactSourceMlPerSec).toBeLessThan(1e-8);
    expect(replay.profiles[1]!.localInertanceMmHgSec2PerMl)
      .toBe(replay.source
        .topologyHistoricalAorticValveInertanceMmHgSec2PerMl);
    expect(replay.profiles.every(allNumbersFinite)).toBe(true);
    expect(replay.claim.exactModelStateOrCheckpointChanged).toBe(false);
    expect(replay.claim.coupledModelAcceptanceEstablished).toBe(false);
    expect(() => compareMainWireAorticOutflowDriverRootAblationV1(
      inputs.slice(0, 3),
    )).toThrow("missing aortic-outflow ablation arm");
  }, 60_000);

  it("brackets the exact global arterial PV stiffness without adding state", () => {
    const inputs =
      MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1.map(
        (pointId) => ({
          pointId,
          periodicResult:
            runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              pointId,
            ),
        }),
      );
    const ablation =
      measureMainWireAorticOutflowArterialStiffnessAblationV1(inputs);
    expect(ablation.arms.map((arm) => arm.arterialStiffness))
      .toEqual([0.5625, 0.75, 1]);
    expect(ablation.arms.map((arm) => arm.point.axis))
      .toEqual(["arterial-stiffness", "baseline", "arterial-stiffness"]);
    expect(ablation.arms[0]!.summedArterialNodeTangentCompliance
      .arithmeticMeanMlPerMmHg).toBeGreaterThan(
        ablation.arms[1]!.summedArterialNodeTangentCompliance
          .arithmeticMeanMlPerMmHg,
      );
    expect(ablation.arms[1]!.summedArterialNodeTangentCompliance
      .arithmeticMeanMlPerMmHg).toBeGreaterThan(
        ablation.arms[2]!.summedArterialNodeTangentCompliance
          .arithmeticMeanMlPerMmHg,
      );
    expect(new Set(inputs.map((input) => input.periodicResult
      .protocolComponentHashes.circulationRuntimeStableHash)).size).toBe(3);
    expect(ablation.claim.proximalAorticComplianceIsolated).toBe(false);
    expect(ablation.claim
      .localAreaComplianceComparisonRequiresAnatomicalSupportLength).toBe(true);
    expect(allNumbersFinite(ablation)).toBe(true);
    expect(() => measureMainWireAorticOutflowArterialStiffnessAblationV1(
      inputs.slice(1),
    )).toThrow("missing arterial-stiffness point");
  }, 60_000);

  it("isolates root compliance placement while preserving Ao-plus-SA capacity", () => {
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const profileRuns =
      MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1.map(
        (profileId) =>
          runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1(
            { dtSec: 0.02, maximumBeatCount: 1 },
            profileId,
          ),
      );
    const comparison = compareMainWireAorticOutflowCompliancePartitionV1([
      { armId: "canonical", periodicResult: canonical },
      ...profileRuns.map((run) => ({
        armId: run.profile.profileId,
        periodicResult: run.periodicResult,
      })),
    ]);
    expect(comparison.arms.map((arm) =>
      arm.capacity.resolvedAorticRootVsMl)).toEqual([150, 112.5, 200]);
    expect(comparison.arms.map((arm) =>
      arm.capacity.resolvedAoSaTotalVsMl)).toEqual([550, 550, 550]);
    expect(comparison.arms.every((arm) =>
      arm.capacity.totalVsResidualMl === 0)).toBe(true);
    expect(new Set(comparison.arms.map((arm) =>
      arm.cycle.protocolIdentityHash)).size).toBe(3);
    expect(comparison.claim.globalArterialStiffnessChanged).toBe(false);
    expect(comparison.claim.acceptedStateOrCheckpointTopologyChanged)
      .toBe(false);
    expect(comparison.claim.anatomicalSupportLengthIdentified).toBe(false);
    expect(allNumbersFinite(comparison)).toBe(true);
    expect(() => compareMainWireAorticOutflowCompliancePartitionV1([
      { armId: "canonical", periodicResult: canonical },
      {
        armId: profileRuns[0]!.profile.profileId,
        periodicResult: profileRuns[0]!.periodicResult,
      },
    ])).toThrow("missing aortic compliance partition arm");
  }, 60_000);

  it("measures the fixed delayed-calcium by root-capacity factorial", () => {
    const options = { dtSec: 0.02, maximumBeatCount: 1 } as const;
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      ...options,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const calcium =
      runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1(
        options,
        MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
      );
    const capacity =
      runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1(
        options,
        MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
      );
    const combined =
      runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchV1(
        options,
        MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
        MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
      );
    const inputs = [
      { armId: "canonical" as const, periodicResult: canonical },
      {
        armId: "delayed-calcium-only" as const,
        periodicResult: calcium.periodicResult,
      },
      {
        armId: "low-root-capacity-only" as const,
        periodicResult: capacity.periodicResult,
      },
      {
        armId: "delayed-calcium-plus-low-root-capacity" as const,
        periodicResult: combined.periodicResult,
      },
    ];
    const factorial =
      compareMainWireAorticOutflowCalciumComplianceFactorialV1(inputs);
    expect(factorial.arms).toHaveLength(4);
    expect(factorial.factorialContrasts).toHaveLength(13);
    expect(factorial.allRunsPeriod1AndIntegrated).toBe(false);
    expect(factorial.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    expect(factorial.morphologyPreservedAcrossFactorial).toBe(true);
    expect(new Set(factorial.arms.map((arm) =>
      arm.cycle.protocolIdentityHash)).size).toBe(4);
    expect(factorial.arms[0]!.morphologySafeDirectionalCandidate).toBe(false);
    expect(factorial.arms[3]!.capacity.resolvedAoSaTotalVsMl).toBe(550);
    for (const arm of factorial.arms) {
      expect(arm.kinematicFloor.currentDuration
        .cauchySchwarzFloorSatisfied).toBe(true);
      expect(arm.kinematicFloor.currentDuration
        .timeVaryingAreaFloorSatisfied).toBe(true);
      expect(Math.abs(arm.kinematicFloor.currentDuration
        .multiplicativeReconstructionResidualMmHg)).toBeLessThan(1e-10);
      expect(arm.kinematicFloor.healthyLvetContext
        .modelForwardFlowDurationGapToLower95PiSec).toBeGreaterThan(0);
      expect(arm.kinematicFloor.healthyLvetContext.projections[0]!
        .meanAndPeakGradientFloorMmHg).toBeLessThan(
          arm.kinematicFloor.currentDuration.meanAndPeakGradientFloorMmHg,
        );
    }
    expect(factorial.claim.aorticValveConstitutiveLawChanged).toBe(false);
    expect(factorial.claim.acceptedStateOrCheckpointTopologyChanged)
      .toBe(false);
    expect(allNumbersFinite(factorial)).toBe(true);
    expect(() => compareMainWireAorticOutflowCalciumComplianceFactorialV1(
      inputs.slice(0, 3),
    )).toThrow("missing calcium-compliance arm");
  }, 60_000);

  it("rejects generic parameter patches on the research runner", () => {
    expect(() => runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
      { dtSec: 0.02, maximumBeatCount: 1, rootL: 0.01 } as never,
      "canonical",
    )).toThrow("reject unsupported field: rootL");
  });
});

function allNumbersFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumbersFinite);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(allNumbersFinite);
  }
  return true;
}
