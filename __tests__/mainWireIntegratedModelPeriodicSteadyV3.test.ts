import { describe, expect, it } from "vitest";

import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2 } from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV2";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  mainWireIntegratedModelPeriodicFixtureIdentityV3,
  mainWireIntegratedModelPeriodicProtocolIdentityHashV3,
  runMainWireIntegratedModelPeriodicSteadyV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireFiveWallLandTriSegProviderParameterPreimageV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("integrated Main V3 regular-sinus all-off periodic experiment", () => {
  it("reuses the predeclared V2 policy/scales and makes every MCS circuit explicitly all-off with zero inertance", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2,
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V2,
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3).toMatchObject({
      coronaryAutoregulationResponseTimeConstantSec: 25,
      maximumCycleCount: 250,
    });

    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    expect(fixture.rhythm.configuration.atrialSource.mode).toBe("regular");
    expect(fixture.rhythm.configuration.authoredEctopySchedule.events).toEqual(
      [],
    );
    expect(
      fixture.rhythm.configuration.authoredVentricularPacingReplay,
    ).toBeNull();
    expect([
      fixture.config.lvad.enabled,
      fixture.config.impella.enabled,
      fixture.config.vaEcmo.enabled,
      fixture.config.vvEcmo.enabled,
    ]).toEqual([false, false, false, false]);
    for (const circuit of Object.values(fixture.profile.inertanceByDevice)) {
      expect(
        Object.values(circuit).filter((value) => typeof value === "number"),
      ).toEqual([0, 0, 0, 0]);
    }
    expect(
      Object.values(
        fixture.cold.acceptedState.dynamicMechanicalSupport
          .acceptedFlowMlPerSec,
      ),
    ).toEqual([0, 0, 0, 0]);
  });

  it("binds the protocol SHA to the complete provider preimage, not its rounded FNV proxy", async () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const preimage = fixture.provider.parameterIdentityPreimage as
      MainWireFiveWallLandTriSegProviderParameterPreimageV1;
    expect(preimage.materialByWall.LVFW.parameterPreimage).toMatchObject({
      adapterId: "main-wire-normal-adult-five-wall-material-adapter-v1",
      wallId: "LVFW",
      passive: {
        params: {
          centralTangentPa: expect.any(Number),
          tensionScalePa: expect.any(Number),
        },
      },
      landSls: {
        landEquationParameters: {
          values: {
            CaT50Ref: expect.any(Number),
            Tref: expect.any(Number),
          },
        },
        sls: {
          branchModulusPa: expect.any(Number),
          relaxationTimeSec: expect.any(Number),
        },
      },
    });

    const fixtureIdentity =
      await mainWireIntegratedModelPeriodicFixtureIdentityV3(fixture);
    expect(fixtureIdentity.provider.parameterIdentityPreimage)
      .toEqual(preimage);
    expect(fixtureIdentity.provider)
      .not.toHaveProperty("parameterIdentityHash");

    const mutatedPreimage = Object.freeze({
      ...preimage,
      atria: Object.freeze({
        ...preimage.atria,
        LA: Object.freeze({
          ...preimage.atria.LA,
          wallMaterialVolumeM3:
            preimage.atria.LA.wallMaterialVolumeM3 + 4e-13,
        }),
      }),
    });
    const actualMutation =
      mutatedPreimage.atria.LA.wallMaterialVolumeM3
      - preimage.atria.LA.wallMaterialVolumeM3;
    expect(actualMutation).toBeGreaterThan(0);
    expect(actualMutation).toBeLessThan(0.5e-12);
    const mutatedFixture = Object.freeze({
      ...fixture,
      provider: Object.freeze({
        ...fixture.provider,
        parameterIdentityPreimage: mutatedPreimage,
      }),
    });

    expect(await sha256CanonicalJsonHex(
      await mainWireIntegratedModelPeriodicFixtureIdentityV3(mutatedFixture),
    )).not.toBe(await sha256CanonicalJsonHex(fixtureIdentity));
    expect(await mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
      mutatedFixture,
      {
        nominalDtSec: 0.002,
        maximumCycleCount: 1,
        executionPurpose: "bounded-smoke",
      },
    )).not.toBe(await mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
      fixture,
      {
        nominalDtSec: 0.002,
        maximumCycleCount: 1,
        executionPurpose: "bounded-smoke",
      },
    ));
  });

  it("binds the cycle length and exact cold accepted-state initialization into the protocol SHA", async () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const alternateColdFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3(
        fixture.fixedGlobalTotalBloodVolumeMl - 1,
      );
    const changedCycleLength = Object.freeze({
      ...fixture,
      cycleLengthSec: 0.5,
    }) as unknown as typeof fixture;
    const changedColdAcceptedState = Object.freeze({
      ...fixture,
      cold: alternateColdFixture.cold,
    }) as typeof fixture;
    const protocolOptions = Object.freeze({
      nominalDtSec: 0.002,
      maximumCycleCount: 1,
      executionPurpose: "bounded-smoke" as const,
    });

    const [
      fixtureIdentity,
      changedCycleIdentity,
      changedColdIdentity,
      protocolIdentity,
      changedCycleProtocolIdentity,
      changedColdProtocolIdentity,
    ] = await Promise.all([
      mainWireIntegratedModelPeriodicFixtureIdentityV3(fixture),
      mainWireIntegratedModelPeriodicFixtureIdentityV3(changedCycleLength),
      mainWireIntegratedModelPeriodicFixtureIdentityV3(
        changedColdAcceptedState,
      ),
      mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
        fixture,
        protocolOptions,
      ),
      mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
        changedCycleLength,
        protocolOptions,
      ),
      mainWireIntegratedModelPeriodicProtocolIdentityHashV3(
        changedColdAcceptedState,
        protocolOptions,
      ),
    ]);

    expect(fixtureIdentity.cycleLengthSec).toBe(1);
    expect(fixtureIdentity.coldAcceptedStateInitialization).toMatchObject({
      kind: "exact-main-v3-checkpoint",
      schemaVersion: 3,
      revision: 0,
      acceptedTimeSec: 0,
      checkpointSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(changedCycleIdentity.cycleLengthSec).toBe(0.5);
    expect(changedColdIdentity.coldAcceptedStateInitialization.checkpointSha256)
      .not.toBe(
        fixtureIdentity.coldAcceptedStateInitialization.checkpointSha256,
      );
    expect(await sha256CanonicalJsonHex(changedCycleIdentity))
      .not.toBe(await sha256CanonicalJsonHex(fixtureIdentity));
    expect(await sha256CanonicalJsonHex(changedColdIdentity))
      .not.toBe(await sha256CanonicalJsonHex(fixtureIdentity));
    expect(changedCycleProtocolIdentity).not.toBe(protocolIdentity);
    expect(changedColdProtocolIdentity).not.toBe(protocolIdentity);
  });

  it("advances one canonical-provider cycle with exact event ownership, conservation, raw trace, healthy projection, and V3 checkpoint", async () => {
    const result = await runMainWireIntegratedModelPeriodicSteadyV3({
      nominalDtSec: 0.002,
      maximumCycleCount: 1,
      executionPurpose: "bounded-smoke",
    });

    expect(result).toMatchObject({
      executionPurpose: "bounded-smoke",
      requestedMaximumCycleCount: 1,
      completedCycleCount: 1,
      terminationReason: "maximum-cycles-reached",
      requestedHorizonCompleted: true,
      earlyClassificationStopEligible: true,
      numericalPeriod1Established: false,
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
      terminalCheckpointExactRoundTripVerified: true,
      allCyclesFiniteConservedAndEventExact: true,
    });
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.classification.status).toBe("not-converged");
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]!.evidenceRole).toBe(
      "bounded-exploration-only",
    );

    const cycle = result.cycles[0]!;
    expect(cycle).toMatchObject({
      cycleIndex: 1,
      startTimeSec: 0,
      endTimeSec: 1,
      coronaryAutoregulationWindow: {
        windowIndex: 0,
        startTimeSec: 0,
        endTimeSec: 1,
      },
      finiteAndEventIdentityChecks: {
        allRawValuesFinite: true,
        exactlyOneAtrialCapture: true,
        exactlyOneVentricularCapture: true,
        exactlyTwoDeliveredCalciumDeposits: true,
        oneComposedCalciumOwnerOnly: true,
        allDynamicMcsAcceptedFlowsExactlyZero: true,
        passed: true,
      },
      conservation: { withinInheritedConstructionTolerances: true },
    });
    expect(cycle.acceptedAtrialCaptureIds).toHaveLength(1);
    expect(cycle.acceptedVentricularCaptureIds).toHaveLength(1);
    expect(cycle.deliveredCalciumDepositIds).toHaveLength(2);
    expect(cycle.period1.provenance).toMatchObject({
      sourcePeriodSec: 1,
      periodLag: 1,
      acceptedTimeAdvanceSec: 1,
      regularSourceSequenceAdvance: 1,
      atrialCaptureCountAdvance: 1,
      ventricularCaptureCountAdvance: 1,
      deliveredCalciumDepositCountAdvance: 2,
    });
    expect(Object.keys(cycle.period1.groups)).toEqual([
      "coronary-v3",
      "dynamic-mcs-q",
      "regular-source",
      "electrical-capture",
      "proximal-av",
      "distal-conduction",
      "ventricular-backup",
      "interval-strength",
      "pending-events",
      "five-wall-calcium",
    ]);

    expect(result.terminalCycleTrace).toMatchObject({
      cycleIndex: 1,
      startTimeSec: 0,
      endTimeSec: 1,
      retainedForGraphShapeInspection: true,
      resamplingApplied: false,
      shapeAcceptanceClaimed: false,
    });
    expect(result.terminalCycleTrace.sampleCount).toBe(cycle.acceptedStepCount);
    expect(result.terminalCycleTrace.samples.length).toBeGreaterThan(400);
    for (const sample of result.terminalCycleTrace.samples) {
      expect(Object.values(sample.dynamicMcsAcceptedFlowMlPerSec)).toEqual([
        0, 0, 0, 0,
      ]);
      expect(
        Object.keys(sample.pulmonaryCirculation.nodeVolumeMl),
      ).toEqual(["PA", "PArt", "PCap", "PVen", "PVein"]);
      expect(
        Object.keys(sample.pulmonaryCirculation.edgeFlowMlPerSec),
      ).toEqual([
        "PV",
        "PA_PArt",
        "PArt_PCap",
        "PCap_PVen",
        "PVen_PVein",
        "PVein_LA",
      ]);
    }

    const projection = result.terminalHealthyReferenceProjection;
    expect(projection.assessmentEligibility).toMatchObject({
      eligible: false,
      numericalPeriod1Established: false,
      executionPurpose: "bounded-smoke",
    });
    expect(projection.gateResults).toHaveLength(6);
    expect(
      projection.gateResults.every((gate) => gate.status === "not-assessed"),
    ).toBe(true);
    expect(projection.metric.lvEndDiastolicVolumeMl).toBeGreaterThan(
      projection.metric.lvEndSystolicVolumeMl,
    );
    expect(projection.metric.nativeAorticForwardVolumeMl).toBeGreaterThan(0);
    expect(projection.metric.nativeAorticCardiacOutputLPerMin).toBeGreaterThan(
      0,
    );
    expect(
      projection.metric.nativeAorticCardiacIndexLPerMinPerM2,
    ).toBeGreaterThan(0);
    expect(
      Number.isFinite(projection.metric.pulmonaryArterySystolicPressureMmHg),
    ).toBe(true);
    expect(
      Number.isFinite(projection.metric.leftAtrialTimeWeightedMeanPressureMmHg),
    ).toBe(true);
    expect(result.terminalCheckpoint.checkpointSha256).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(result.terminalCycleStartCheckpoint).toMatchObject({
      acceptedTimeSec: 0,
      schemaVersion: 3,
    });
    expect(result.terminalCycleStartCheckpoint.checkpointSha256).toMatch(
      /^[0-9a-f]{64}$/,
    );
  }, 60_000);

  it("fails closed outside the bounded/canonical cycle caps or with unknown options", async () => {
    await expect(
      runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.002,
        maximumCycleCount: 3,
        executionPurpose: "bounded-smoke",
      }),
    ).rejects.toThrow(/1 through 2/);
    await expect(
      runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.002,
        maximumCycleCount: 251,
        executionPurpose: "fixed-horizon-characterization",
      }),
    ).rejects.toThrow(/1 through 250/);
    await expect(
      runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.002,
        unexpected: true,
      } as never),
    ).rejects.toThrow(/unexpected fields/);
  });
});
