import { describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowDriverRootAblationV1,
  type MainWireAorticOutflowDriverRootArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowDriverRootComparisonV1";
import {
  replayMainWireAorticValveLocalInertanceV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLocalInertanceReplayV1";
import {
  MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_CLAIM_V1,
  resolveMainWireAorticRootInertanceResearchProfileV1,
  validateMainWireAorticRootInertanceResearchProfileV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
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
  runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
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
