import { describe, expect, it } from "vitest";

import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
  createMainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  MainWireScientificSessionV1,
  type MainWireScientificResearchControlForkExpectedSourceIdentityV0,
} from "@/engine/scientific/runtime/MainWireScientificSessionV1";

describe("main-wire ScientificSession research-control fork V0", () => {
  it("clones the exact accepted state, applies the full runtime overlay, and resets only the target tracker", async () => {
    const source = await MainWireScientificSessionV1.createCanonical();
    const initialTransient = source.runTransient({
      dtSec: 0.002,
      stepCount: 4,
    });
    expect(initialTransient.completed).toBe(true);
    const sourceSettlement = source.settlePeriodic();
    expect(sourceSettlement).toMatchObject({
      completed: true,
      trackerStartedThisCall: true,
      beatCompletedThisCall: true,
      completedBeatCount: 1,
    });

    const baseline =
      await createMainWireScientificResearchControlBaselineTargetStateV0();
    const target = await createMainWireScientificResearchControlTargetStateV0({
      ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
      "circulation.systemic-vascular-resistance-scale": 1.5,
      "circulation.pulmonary-vascular-resistance-scale": 0.75,
      "circulation.venous-tone": 0.5,
      "circulation.arterial-stiffness": 1.5,
      "ventilation.peep-cm-h2o": 10,
      "pericardium.prescribed-fluid-volume-ml": 100,
    });
    const sourceIdentity = expectedIdentity(source, baseline.targetStateSha256, 0);
    const sourceCheckpointBefore = await source.checkpointExact();
    const sourceObservationBefore = source.observe();

    const forked = await source.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: target,
      expectedSourceIdentity: sourceIdentity,
    });

    expect(await source.checkpointExact()).toEqual(sourceCheckpointBefore);
    expect(source.observe()).toBe(sourceObservationBefore);
    expect(source.stateIdentity()).toEqual(forked.targetSession.stateIdentity());
    expect(forked.targetSession.observe()).toMatchObject({
      source: "research-control-state-fork",
      revision: sourceIdentity.revision,
      acceptedTimeSec: sourceIdentity.acceptedTimeSec,
      chamber: {
        LA: { volumeMl: sourceObservationBefore.chamber.LA.volumeMl },
        LV: { volumeMl: sourceObservationBefore.chamber.LV.volumeMl },
        RA: { volumeMl: sourceObservationBefore.chamber.RA.volumeMl },
        RV: { volumeMl: sourceObservationBefore.chamber.RV.volumeMl },
      },
    });
    expect(forked.receipt).toMatchObject({
      source: sourceIdentity,
      target: {
        revision: sourceIdentity.revision,
        acceptedTimeSec: sourceIdentity.acceptedTimeSec,
        totalBloodVolumeMl: sourceIdentity.totalBloodVolumeMl,
        parameterEpoch: 1,
        controlStateSha256: target.targetStateSha256,
      },
      resolvedRuntimeLosses: {
        systemicResistance: 1.5,
        pulmonaryResistance: 0.46875,
      },
      resolvedRuntimeOverlay: {
        vascular: {
          venousTone: 0.5,
          arterialStiffness: 1.5,
        },
        respiratory: {
          peepCmH2O: 10,
          peepMmHg: expect.closeTo(7.355612727081803, 12),
        },
        prescribedPericardialFluidVolumeMl: 100,
      },
      transition: {
        transitionCompatibilityFingerprintPreserved: true,
        transitionCompatibilityFingerprintSemantics:
          "transition-compatibility-only-non-authoritative",
        canonicalTransactionCheckpointPreserved: true,
        sourceSessionUnchanged: true,
        periodicSettlementTrackerResetInTargetOnly: true,
        replacedRuntimePaths: [
          "circulationRuntime.losses.systemicResistance",
          "circulationRuntime.losses.pulmonaryResistance",
          "circulationRuntime.vascular.venousTone",
          "circulationRuntime.vascular.arterialStiffness",
          "circulationRuntime.respiratory.PEEP",
          "commonPericardium.prescribedPericardialFluidVolumeM3",
        ],
      },
    });
    expect(forked.receipt.transition.targetTransitionCompatibilityFingerprint)
      .toBe(
        forked.receipt.transition.sourceTransitionCompatibilityFingerprint,
      );
    expect(forked.receipt.transition.sourceTransitionCompatibilityFingerprint)
      .toBe(sourceCheckpointBefore.transaction.checkpointFingerprint);
    await expect(forked.targetSession.checkpointExact()).rejects.toThrow(
      /control-state-aware checkpoint schema/,
    );
    await expect(
      forked.targetSession.checkpointLegacyCanonicalExactV2(),
    ).rejects.toThrow(/control-state-aware checkpoint schema/);

    const targetSettlement = forked.targetSession.settlePeriodic();
    expect(targetSettlement).toMatchObject({
      completed: true,
      trackerStartedThisCall: true,
      beatCompletedThisCall: true,
      completedBeatCount: 1,
    });
    const continuedSourceSettlement = source.settlePeriodic();
    expect(continuedSourceSettlement).toMatchObject({
      completed: true,
      trackerStartedThisCall: false,
      beatCompletedThisCall: true,
      completedBeatCount: 2,
    });
  }, 120_000);

  it("fails closed on stale CAS/digest/runtime identity and supports a valid chained fork", async () => {
    const source = await MainWireScientificSessionV1.createCanonical();
    const baseline =
      await createMainWireScientificResearchControlBaselineTargetStateV0();
    const highSystemic =
      await createMainWireScientificResearchControlTargetStateV0({
        ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
        "circulation.systemic-vascular-resistance-scale": 1.5,
        "circulation.pulmonary-vascular-resistance-scale": 1,
      });
    const expected = expectedIdentity(source, baseline.targetStateSha256, 0);

    await expect(source.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: highSystemic,
      expectedSourceIdentity: {
        ...expected,
        controlStateSha256: highSystemic.targetStateSha256,
      },
    })).rejects.toThrow(/current control digest mismatch/);
    await expect(source.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: highSystemic,
      expectedSourceIdentity: { ...expected, revision: expected.revision + 1 },
    })).rejects.toThrow(/expected source identity mismatch/);

    const first = await source.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: highSystemic,
      expectedSourceIdentity: expected,
    });
    const highIdentity = expectedIdentity(
      first.targetSession,
      highSystemic.targetStateSha256,
      1,
    );
    await expect(first.targetSession.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: baseline,
      expectedSourceIdentity: {
        ...highIdentity,
        controlStateSha256: baseline.targetStateSha256,
      },
    })).rejects.toThrow(/current session runtime overlay/);

    const second = await first.targetSession.forkResearchControlTargetV0({
      sourceControlState: highSystemic,
      targetControlState: baseline,
      expectedSourceIdentity: highIdentity,
    });
    expect(second.receipt.target).toMatchObject({
      parameterEpoch: 2,
      controlStateSha256: baseline.targetStateSha256,
    });
    expect(second.receipt.resolvedRuntimeLosses).toEqual({
      systemicResistance: 1,
      pulmonaryResistance: 0.625,
    });

    const forgedRelease = JSON.parse(JSON.stringify(baseline));
    forgedRelease.releaseRef.sha256 = "0".repeat(64);
    await expect(source.forkResearchControlTargetV0({
      sourceControlState: forgedRelease,
      targetControlState: highSystemic,
      expectedSourceIdentity: expected,
    })).rejects.toThrow(/release-bound catalog|target state payload/);
  }, 60_000);

  it("keeps every one-factor broad-envelope anchor numerically executable at the first accepted step", async () => {
    const source = await MainWireScientificSessionV1.createCanonical();
    const baseline =
      await createMainWireScientificResearchControlBaselineTargetStateV0();
    const sourceIdentity = expectedIdentity(source, baseline.targetStateSha256, 0);

    const failures: string[] = [];
    for (const controlId of MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0) {
      const values = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
        controlId
      ].allowedValues;
      for (const endpoint of values) {
        if (endpoint === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0[
          controlId
        ]) continue;
        const target =
          await createMainWireScientificResearchControlTargetStateV0({
            ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
            [controlId]: endpoint,
          });
        const forked = await source.forkResearchControlTargetV0({
          sourceControlState: baseline,
          targetControlState: target,
          expectedSourceIdentity: sourceIdentity,
        });
        const firstStep = forked.targetSession.step(0.002);
        if (firstStep.converged === false) {
          failures.push(`${controlId}=${endpoint}: ${firstStep.message}`);
          continue;
        }
        expect(firstStep.observation.revision).toBe(sourceIdentity.revision + 1);
        expect(firstStep.observation.diagnostics.totalBloodVolumeErrorMl)
          .toBeLessThan(1e-6);
      }
    }
    expect(failures).toEqual([]);
  }, 120_000);

  it("keeps selected two-factor clinical-envelope corners executable at the first accepted step", async () => {
    const source = await MainWireScientificSessionV1.createCanonical();
    const baseline =
      await createMainWireScientificResearchControlBaselineTargetStateV0();
    const sourceIdentity = expectedIdentity(source, baseline.targetStateSha256, 0);
    const totalBloodVolumeMl = sourceIdentity.totalBloodVolumeMl;
    const corners = [
      {
        label: "PEEP 25 cmH2O + pulmonary resistance scale 4",
        controls: {
          "ventilation.peep-cm-h2o": 25,
          "circulation.pulmonary-vascular-resistance-scale": 4,
        },
      },
      {
        label: "pericardial occupancy 150 mL + venous tone 1",
        controls: {
          "pericardium.prescribed-fluid-volume-ml": 150,
          "circulation.venous-tone": 1,
        },
      },
      {
        label: "arterial PV stiffness 3 + systemic resistance scale 4",
        controls: {
          "circulation.arterial-stiffness": 3,
          "circulation.systemic-vascular-resistance-scale": 4,
        },
      },
      {
        label: "PEEP 25 cmH2O + pericardial occupancy 150 mL",
        controls: {
          "ventilation.peep-cm-h2o": 25,
          "pericardium.prescribed-fluid-volume-ml": 150,
        },
      },
    ] as const;

    const failures: string[] = [];
    for (const corner of corners) {
      const target =
        await createMainWireScientificResearchControlTargetStateV0({
          ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
          ...corner.controls,
        });
      const forked = await source.forkResearchControlTargetV0({
        sourceControlState: baseline,
        targetControlState: target,
        expectedSourceIdentity: sourceIdentity,
      });

      if ("ventilation.peep-cm-h2o" in corner.controls) {
        expect(forked.receipt.resolvedRuntimeOverlay.respiratory.peepCmH2O)
          .toBe(corner.controls["ventilation.peep-cm-h2o"]);
      }
      if ("pericardium.prescribed-fluid-volume-ml" in corner.controls) {
        expect(
          forked.receipt.resolvedRuntimeOverlay
            .prescribedPericardialFluidVolumeMl,
        ).toBe(corner.controls["pericardium.prescribed-fluid-volume-ml"]);
      }

      const firstStep = forked.targetSession.step(0.002);
      if (firstStep.converged === false) {
        failures.push(`${corner.label}: ${firstStep.message}`);
        continue;
      }
      expect(firstStep.observation.revision).toBe(sourceIdentity.revision + 1);
      expect(Math.abs(
        firstStep.observation.diagnostics.totalBloodVolumeErrorMl,
      ))
        .toBeLessThan(1e-6);
      expect(forked.targetSession.stateIdentity().totalBloodVolumeMl)
        .toBeCloseTo(totalBloodVolumeMl, 9);
      expect(Object.values(firstStep.observation.chamber).every((chamber) =>
        Number.isFinite(chamber.volumeMl)
        && Number.isFinite(chamber.absolutePressureMmHg)
        && Number.isFinite(chamber.transmuralPressureMmHg)))
        .toBe(true);
      expect(Object.values(firstStep.observation.valve).every((valve) =>
        Number.isFinite(valve.flowMlPerSec)
        && Number.isFinite(valve.openingFraction01)))
        .toBe(true);
      expect(Object.values(firstStep.observation.diagnostics).every((value) =>
        value === null || Number.isFinite(value)))
        .toBe(true);
    }
    expect(failures).toEqual([]);
  }, 120_000);
});

function expectedIdentity(
  session: MainWireScientificSessionV1,
  controlStateSha256: string,
  parameterEpoch: number,
): MainWireScientificResearchControlForkExpectedSourceIdentityV0 {
  return Object.freeze({
    ...session.stateIdentity(),
    parameterEpoch,
    controlStateSha256,
  });
}
