import { describe, expect, it } from "vitest";

import { CORONARY_CONSERVED_VOLUME_NODE_IDS_V2 } from "@/engine/coronary/typesV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1,
  runMainWireIntegratedModelTbvAttributionV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTbvAttributionV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelPeriodicKernelV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1 } from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";

describe("integrated Main V3 fixed-global-TBV attribution", () => {
  it("predeclares exactly two arms and changes only the global volume coordinate under the existing cold partition rule", () => {
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1,
    ).toMatchObject({
      primaryNominalDtSec: 0.002,
      primaryMaximumCycleCount: 250,
      primaryClassifierEvidenceRole: "canonical-periodic-protocol",
      boundedSmokeClassifierEvidenceRole: "bounded-exploration-only",
      armOrder: ["current-5600ml", "base-ledger-5535p899898ml"],
      onlyChangedInput: "fixed-global-total-blood-volume-ml",
      coldDistributionPolicy: "same-shared-SV-VC-transmural-pressure-offset",
      healthThresholdApplied: false,
      fitObjectiveApplied: false,
    });

    const canonical =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const explicitCurrent =
      createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3(
        5600,
      );
    expect(explicitCurrent.cold.acceptedState).toEqual(
      canonical.cold.acceptedState,
    );

    const baseLedger =
      createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3(
        5535.899898304685,
      );
    const cold = baseLedger.cold.acceptedState.coronary;
    const coronaryVolumeMl = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce(
      (sum, nodeId) => sum + cold.coronary.volumeMlByNode[nodeId],
      0,
    );
    expect(coronaryVolumeMl).toBeCloseTo(13.789898304684712, 9);
    expect(cold.circulation.totalBloodVolumeMl).toBeCloseTo(
      MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1.fixedTotalBloodVolumeMl,
      9,
    );
    expect(cold.circulation.totalBloodVolumeMl + coronaryVolumeMl).toBeCloseTo(
      5535.899898304685,
      9,
    );

    for (const nodeId of Object.keys(
      canonical.cold.acceptedState.coronary.circulation.nodeVolumesMl,
    )) {
      if (nodeId === "SV" || nodeId === "VC") continue;
      expect(
        baseLedger.cold.acceptedState.coronary.circulation.nodeVolumesMl[
          nodeId as keyof typeof cold.circulation.nodeVolumesMl
        ],
      ).toBe(
        canonical.cold.acceptedState.coronary.circulation.nodeVolumesMl[
          nodeId as keyof typeof cold.circulation.nodeVolumesMl
        ],
      );
    }
  });

  it("runs both bounded arms through the same kernel and reports paired mechanism metrics without promoting a health or release claim", async () => {
    const result = await runMainWireIntegratedModelTbvAttributionV1({
      executionPurpose: "bounded-smoke",
      maximumCycleCount: 1,
    });

    expect(result).toMatchObject({
      executionPurpose: "bounded-smoke",
      nominalDtSec: 0.002,
      requestedMaximumCycleCountPerArm: 1,
      primaryAttributionNumericallyEstablished: false,
      healthThresholdApplied: false,
      fitObjectiveApplied: false,
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
    });
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.pairedDelta.direction).toBe(
      "base-ledger-minus-current-ledger",
    );
    expect(result.pairedDelta.fixedGlobalTotalBloodVolumeMl).toBeCloseTo(
      -64.10010169531529,
      9,
    );

    for (const armId of result.armOrder) {
      const arm = result.arms[armId];
      expect(arm.armProtocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
      expect(arm.numerics).toMatchObject({
        classificationStatus: "not-converged",
        numericalPeriod1Observed: false,
        completedCycleCount: 1,
        terminationReason: "maximum-cycles-reached",
        allCyclesFiniteConservedAndEventExact: true,
        terminalCheckpointExactRoundTripVerified: true,
      });
      expect(arm.ledger.coldGlobalReconstructionResidualMl).toBeCloseTo(0, 9);
      expect(arm.ledger.terminalGlobalReconstructionResidualMl).toBeCloseTo(
        0,
        8,
      );
      expect(arm.hemodynamics.lvEndDiastolicVolumeMl).toBeGreaterThan(
        arm.hemodynamics.lvEndSystolicVolumeMl,
      );
      expect(
        arm.hemodynamics.pulmonaryArterialComplianceProxyMlPerMmHg,
      ).toBeGreaterThan(0);
      expect(
        arm.hemodynamics.pulmonaryVascularResistanceProxyWoodUnits,
      ).toBeGreaterThan(0);
      expect(
        arm.coronary.terminalCycleTimeWeightedMeanInletFlowMlPerMin,
      ).toBeGreaterThan(0);
      expect(arm.morphologyDiagnostics).toMatchObject({
        terminalTraceDurationSec: 1,
        lvPvLoopTraversal: "counter-clockwise",
        graphShapeAcceptanceClaimed: false,
      });
      expect(
        Object.values(
          arm.morphologyDiagnostics.minimumNativeValveFlowMlPerSec,
        ).every((flow) => flow >= 0),
      ).toBe(true);
      expect(
        Number.isFinite(
          arm.morphologyDiagnostics.coronaryOutsideToEjectionMeanFlowRatio,
        ),
      ).toBe(true);
    }

    expect(
      Object.values(result.pairedDelta.hemodynamics).every(Number.isFinite),
    ).toBe(true);
    expect(
      Object.values(result.pairedDelta.coronary)
        .filter((value): value is number => typeof value === "number")
        .every(Number.isFinite),
    ).toBe(true);
  }, 120_000);

  it("fails closed when a shortened run is labeled primary evidence", async () => {
    await expect(
      runMainWireIntegratedModelTbvAttributionV1({
        executionPurpose: "primary-attribution-evidence",
        maximumCycleCount: 2,
      }),
    ).rejects.toThrow(/predeclared maximum cycle count/);
    await expect(
      runMainWireIntegratedModelTbvAttributionV1({
        executionPurpose: "bounded-smoke",
        maximumCycleCount: 3,
      }),
    ).rejects.toThrow(/1 through 2/);
    await expect(
      runMainWireIntegratedModelPeriodicKernelV3(
        createMainWireIntegratedModelRegularSinusAllOffFixtureV3(),
        {
          protocolIdentityHash: "0".repeat(64),
          nominalDtSec: 0.002,
          maximumCycleCount: 1,
          stopAfterClassification: true,
          evidenceRole: "bounded-exploration-only",
          unexpected: true,
        } as never,
      ),
    ).rejects.toThrow(/unexpected fields/);
  });
});
