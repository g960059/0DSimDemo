import { describe, expect, it } from "vitest";

import { checkpointMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
  type MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  type MainWireFiveWallMechanicalEnergyWallRecordV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalEnergyLedgerV1";
import {
  assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsV1,
  assertMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyProviderReadbackV1,
  runMainWireIntegratedModelPeriodicAnalysisContinuationV1,
  runMainWireIntegratedModelPeriodicAnalysisCycleMirrorV1,
  runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAcceptedObservationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("integrated V3 periodic five-wall mechanical-energy collection", () => {
  it("keeps the established Standard cycle output and trace hash exact when the accepted-success observer is attached", async () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const initial = fixture.cold.acceptedState;
    const withoutObserver = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      fixture,
      initial,
      1,
      0.001,
    );
    const acceptedTuples: Readonly<{
      previousRevision: number;
      revision: number;
      previousTimeSec: number;
      timeSec: number;
      dtSec: number;
    }>[] = [];
    let retainedProviderReadback: unknown = null;
    const withObserver =
      runMainWireIntegratedModelPeriodicAnalysisCycleMirrorV1(
        fixture,
        initial,
        1,
        0.001,
        (observation) => {
          retainedProviderReadback ??=
            observation.successfulStep.coronaryStep.baseStep.mechanicsTrial
              .diagnostics.readback;
          acceptedTuples.push(
            Object.freeze({
              previousRevision: observation.previousAcceptedRevision,
              revision: observation.acceptedRevision,
              previousTimeSec: observation.previousAcceptedTimeSec,
              timeSec: observation.acceptedTimeSec,
              dtSec: observation.acceptedDtSec,
            }),
          );
        },
      );

    expect(withObserver).toEqual(withoutObserver);
    expect(await sha256CanonicalJsonHex(withObserver.traceSamples)).toBe(
      await sha256CanonicalJsonHex(withoutObserver.traceSamples),
    );
    const checkpointContext =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      );
    expect(
      await checkpointMainWireIntegratedModelV3(
        checkpointContext,
        withObserver.terminalAcceptedState,
      ),
    ).toEqual(
      await checkpointMainWireIntegratedModelV3(
        checkpointContext,
        withoutObserver.terminalAcceptedState,
      ),
    );
    expect(acceptedTuples).toHaveLength(withObserver.acceptedStepCount);
    expect(acceptedTuples[0]).toMatchObject({
      previousRevision: initial.revision,
      previousTimeSec: initial.acceptedTimeSec,
    });
    expect(acceptedTuples.at(-1)).toMatchObject({
      revision: withObserver.terminalAcceptedState.revision,
      timeSec: withObserver.endTimeSec,
    });
    for (let index = 1; index < acceptedTuples.length; index += 1) {
      expect(acceptedTuples[index]!.previousRevision).toBe(
        acceptedTuples[index - 1]!.revision,
      );
      expect(acceptedTuples[index]!.previousTimeSec).toBe(
        acceptedTuples[index - 1]!.timeSec,
      );
    }
    expect(() =>
      assertMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyProviderReadbackV1(
        retainedProviderReadback,
      ),
    ).not.toThrow();
    const missingEnergyField = JSON.parse(
      JSON.stringify(retainedProviderReadback),
    ) as Record<string, any>;
    delete missingEnergyField.wallMaterialReadbackByWall.LVFW.energyLedger
      .slsNextStoredEnergyDensityJPerM3;
    expect(() =>
      assertMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyProviderReadbackV1(
        missingEnergyField,
      ),
    ).toThrow(/SLS next energy/);
    const wrongOwner = {
      ...(retainedProviderReadback as Record<string, unknown>),
      providerModelId: "wrong-provider",
    };
    expect(() =>
      assertMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyProviderReadbackV1(
        wrongOwner,
      ),
    ).toThrow(/provider owner fields differ/);
  }, 60_000);

  it("restores an exact checkpoint and observes both fine-grid bridge and measurement cycles without widening their output", async () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const checkpointContext =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      );
    const sourceCheckpoint = await checkpointMainWireIntegratedModelV3(
      checkpointContext,
      fixture.cold.acceptedState,
    );
    const observedByCycle = new Map<number, number>();
    const [continuation, publicFineOwner] = await Promise.all([
      runMainWireIntegratedModelPeriodicAnalysisContinuationV1({
        fixture,
        sourceCheckpoint,
        sourceCycleIndex: 0,
        nominalDtSec: 0.0005,
        observer: (observation) => {
          observedByCycle.set(
            observation.cycleIndex,
            (observedByCycle.get(observation.cycleIndex) ?? 0) + 1,
          );
        },
      }),
      runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1({
        nominalDtSec: 0.0005,
        maximumCycleCount: 1,
        executionPurpose: "canonical-evidence",
      }),
    ]);

    expect(continuation).toMatchObject({
      sourceCycleIndex: 0,
      sourceCheckpointExactRoundTripVerified: true,
      terminalCheckpointExactRoundTripVerified: true,
      bridgeCycle: { startTimeSec: 0, endTimeSec: 1 },
      measurementCycle: { startTimeSec: 1, endTimeSec: 2 },
    });
    expect(observedByCycle.get(1)).toBe(
      continuation.bridgeCycle.acceptedStepCount,
    );
    expect(observedByCycle.get(2)).toBe(
      continuation.measurementCycle.acceptedStepCount,
    );
    expect(continuation.terminalCheckpoint.checkpointSha256).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(continuation.bridgeCycle.traceSamples).toEqual(
      publicFineOwner.terminalCycleTrace.samples,
    );
    expect(continuation.bridgeCycle.terminalAcceptedState).toEqual(
      publicFineOwner.terminalAcceptedState,
    );
    expect(
      await checkpointMainWireIntegratedModelV3(
        checkpointContext,
        continuation.bridgeCycle.terminalAcceptedState,
      ),
    ).toEqual(publicFineOwner.terminalCheckpoint);
  }, 60_000);

  it("fails closed before continuation when the canonical refinement source has not established latest P1", async () => {
    const source =
      await runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1({
        nominalDtSec: 0.001,
        maximumCycleCount: 1,
        executionPurpose: "canonical-evidence",
      });
    const qualified =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1({
        source,
      });

    expect(qualified).toMatchObject({
      status: "not-qualified",
      executionPurpose: "canonical-evidence",
      numericalAccessId:
        "main-wire-integrated-model-periodic-work-refinement-1ms-0.5ms-access-v1",
      requestedMaximumCycleCount: 1,
      gates: {
        protocolIdentityValid: false,
        modelConditionIdentityValid: true,
        normalDefaultConditionPassed: true,
        canonicalLatestPeriod1Source: false,
        sourceCycleIntegrityPassed: true,
        sourceCheckpointExactParityPassed: true,
      },
      bridgeCycleIndex: null,
      measurementCycleIndex: null,
      rawMechanicalTraceSha256: null,
      failureReasons: [
        "protocol-identity-invalid",
        "canonical-latest-period1-source-not-established",
      ],
    });
    expect(qualified.sourceAcceptedStepCount).toBeGreaterThan(0);

    const {
      checkpointSha256: _sourceCheckpointSha256,
      ...sourceCheckpointPayload
    } = source.terminalCheckpoint;
    const mismatchedPayload = Object.freeze({
      ...sourceCheckpointPayload,
      hemodynamicResearchInputIdentitySha256: "f".repeat(64),
    });
    const mismatchedCheckpoint = Object.freeze({
      ...mismatchedPayload,
      checkpointSha256: await sha256CanonicalJsonHex(mismatchedPayload),
    });
    const checkpointMismatch =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1({
        source: Object.freeze({
          ...source,
          terminalCheckpoint: mismatchedCheckpoint,
        }),
      });
    expect(checkpointMismatch).toMatchObject({
      status: "not-qualified",
      gates: { sourceCheckpointExactParityPassed: false },
      failureReasons: expect.arrayContaining([
        "source-checkpoint-exact-parity-failed",
      ]),
    });
  }, 60_000);

  it("reconstructs every per-step SLS balance and retains tolerance-scaled maxima", () => {
    const preceding = syntheticAcceptedObservationV1(
      syntheticMechanicalSampleV1({ strain: 0, slsNext: 0 }),
      0,
    );
    const closing = syntheticAcceptedObservationV1(
      syntheticMechanicalSampleV1({
        strain: 1,
        slsNext: 1,
        slsPhysical: 1,
        slsBackwardEuler: 2,
      }),
      1,
    );
    const assessed =
      assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsV1(
        preceding,
        [closing],
      );

    expect(assessed).toMatchObject({
      passed: true,
      passivityPassed: true,
      residualReconstructionPassed: true,
      evidence: {
        assessedAcceptedStepCount: 1,
        assessedWallStepCount: 5,
        maximumAbsoluteReconstructedResidualDensityJPerM3: 0,
        maximumAbsoluteReadbackAgreementResidualDensityJPerM3: 0,
        maximumReconstructedResidualToleranceRatio: 0,
        maximumReadbackAgreementToleranceRatio: 0,
      },
    });

    const inconsistent = syntheticAcceptedObservationV1(
      syntheticMechanicalSampleV1({
        strain: 1,
        slsNext: 1,
        slsPhysical: 1,
        slsBackwardEuler: 1,
        slsReportedResidual: 0,
      }),
      1,
    );
    const rejected =
      assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsV1(
        preceding,
        [inconsistent],
      );
    expect(rejected.residualReconstructionPassed).toBe(false);
    expect(
      rejected.evidence.maximumReconstructedResidualToleranceRatio,
    ).toBeGreaterThan(1);
    expect(
      rejected.evidence.maximumReadbackAgreementToleranceRatio,
    ).toBeGreaterThan(1);
  });
});

function syntheticMechanicalSampleV1(
  input: Readonly<{
    strain: number;
    slsNext: number;
    slsPhysical?: number;
    slsBackwardEuler?: number;
    slsReportedResidual?: number;
  }>,
): MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1 {
  return Object.freeze({
    nodeVolumeMl: Object.freeze({ LA: 1, LV: 1, RA: 1, RV: 1 }),
    chamberTransmuralPressureMmHg: Object.freeze({
      LA: 1,
      LV: 1,
      RA: 1,
      RV: 1,
    }),
    commonPericardium: Object.freeze({
      excessPressureMmHg: 0,
      storedEnergyMilliJ: 0,
    }),
    wallStressPa: syntheticWallRecordV1(() =>
      Object.freeze({
        total: 4,
        landActive: 0,
        equilibriumPassive: 0,
        parallelSls: 4,
      }),
    ),
    wallFiberLogStrain: syntheticWallRecordV1(() => input.strain),
    wallEnergyLedgerDensity: syntheticWallRecordV1(() =>
      Object.freeze({
        equilibriumPassiveStoredEnergyDensityJPerM3: 0,
        slsPreviousStoredEnergyDensityJPerM3: 0,
        slsNextStoredEnergyDensityJPerM3: input.slsNext,
        slsPhysicalDissipationIncrementDensityJPerM3: input.slsPhysical ?? 0,
        slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
          input.slsBackwardEuler ?? 0,
        slsDiscreteEnergyBalanceResidualJPerM3: input.slsReportedResidual ?? 0,
      }),
    ),
  });
}

function syntheticAcceptedObservationV1(
  sample: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  acceptedStepIndexWithinCycle: number,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAcceptedObservationV1 {
  return Object.freeze({
    sample,
    source: Object.freeze({
      cycleIndex: 1,
      acceptedStepIndexWithinCycle,
      cycleStartTimeSec: 0,
      cycleEndTimeSec: 1,
      previousAcceptedRevision: acceptedStepIndexWithinCycle,
      acceptedRevision: acceptedStepIndexWithinCycle + 1,
      previousAcceptedTimeSec: acceptedStepIndexWithinCycle,
      acceptedTimeSec: acceptedStepIndexWithinCycle + 1,
      acceptedDtSec: 1,
      candidateMaterialStateFingerprint: "0".repeat(8),
      providerReadbackOwner: Object.freeze({
        providerModelId: "main-wire-five-wall-land-triseg-provider-v1",
        solveMode: "trial",
        hiddenBloodVolumeMl: 0,
        pistonVolumeApplied: false,
      }),
      mechanicsIdentity: Object.freeze({
        contractId: "contract",
        providerId: "provider",
        parameterSetId: "parameters",
        parameterIdentityHash: "identity",
        stateSchemaVersion: 1,
      }),
      wallSourceByWall: syntheticWallRecordV1((wallId) =>
        Object.freeze({
          adapterId: "adapter",
          wallId,
          passiveModelId: "passive",
          passiveParameterIdentityHash: "passive-hash",
          landParameterSetStableHash: "land-hash",
          slsPassive: true,
          landThermodynamicStoredEnergyClaimed: false,
          totalThermodynamicPotentialIncludingLandClaimed: false,
        }),
      ),
    }),
  });
}

function syntheticWallRecordV1<T>(
  build: (
    wallId: (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1)[number],
  ) => T,
): MainWireFiveWallMechanicalEnergyWallRecordV1<T> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map((wallId) => [
        wallId,
        build(wallId),
      ]),
    ),
  ) as MainWireFiveWallMechanicalEnergyWallRecordV1<T>;
}
