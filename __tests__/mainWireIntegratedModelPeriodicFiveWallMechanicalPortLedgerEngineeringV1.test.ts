import { describe, expect, it } from "vitest";

import { checkpointMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
  continueMainWireIntegratedModelPeriodicMechanicalPortLedgerV1,
  normalAdultMainWireFiveWallMechanicalPortMaterialBindingV1,
  runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { canonicalJsonStringify } from "@/engine/integrity";

describe("integrated periodic five-wall mechanical-port ledger Engineering V1", () => {
  it("keeps source provenance and historical qualification explicitly unestablished", () => {
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM.canonicalSourceAuthenticationEstablished,
    ).toBe(false);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM.sourceProvenanceVerified,
    ).toBe(false);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM.historicalQualificationTransferred,
    ).toBe(false);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM.periodicityEstablishedByThisAdapter,
    ).toBe(false);
  });

  it("keeps the analysis replay exactly aligned with the canonical cycle executor", async () => {
    const canonicalFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const replayFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const observedRevisions: number[] = [];

    const replay = await expectCycleParity(
      canonicalFixture,
      replayFixture,
      0.01,
      (acceptedRevision, previousAcceptedRevision) => {
        observedRevisions.push(acceptedRevision);
        expect(acceptedRevision).toBe(previousAcceptedRevision + 1);
      },
    );
    expect(observedRevisions).toHaveLength(replay.acceptedStepCount);
    expect(new Set(observedRevisions).size).toBe(observedRevisions.length);
  });

  it("keeps event-clipped non-default-contractility replay aligned", async () => {
    const canonicalFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3(undefined, 1.1);
    const replayFixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3(undefined, 1.1);

    const replay = await expectCycleParity(
      canonicalFixture,
      replayFixture,
      0.007,
    );
    expect(
      replay.traceSamples.some((sample) => sample.acceptedDtSec < 0.007),
    ).toBe(true);
  });

  it("restores a checkpoint, excludes the bridge cycle, and measures one exact accepted path", async () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const context =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      );
    const sourceCheckpoint = await checkpointMainWireIntegratedModelV3(
      context,
      fixture.cold.acceptedState,
    );

    const continuation =
      await continueMainWireIntegratedModelPeriodicMechanicalPortLedgerV1({
        fixture,
        sourceCheckpoint,
        sourceCycleIndex: 0,
        nominalDtSec: 0.01,
      });

    expect(continuation.sourceCheckpointExactRoundTripVerified).toBe(true);
    expect(continuation.terminalCheckpointExactRoundTripVerified).toBe(true);
    expect(continuation.bridgeCycle.startTimeSec).toBe(0);
    expect(continuation.measurementCycle.startTimeSec).toBe(
      continuation.bridgeCycle.endTimeSec,
    );
    expect(continuation.measurementAcceptedIntervals).toHaveLength(
      continuation.measurementCycle.acceptedStepCount,
    );
    expect(continuation.ledger.intervalCount).toBe(
      continuation.measurementCycle.acceptedStepCount,
    );
    expect(continuation.ledger.initialAcceptedTimeSec).toBe(
      continuation.bridgeCycle.endTimeSec,
    );
    expect(continuation.ledger.terminalAcceptedTimeSec).toBe(
      continuation.measurementCycle.endTimeSec,
    );
    expect(continuation.ledger.initialAcceptedRevision).toBe(
      continuation.bridgeCycle.terminalAcceptedState.revision,
    );
    expect(continuation.ledger.terminalAcceptedRevision).toBe(
      continuation.measurementCycle.terminalAcceptedState.revision,
    );
    expect(
      continuation.measurementAcceptedIntervals[0]!.previous.acceptedTimeSec,
    ).toBe(continuation.bridgeCycle.endTimeSec);
    expect(
      continuation.measurementAcceptedIntervals.at(-1)!.next.acceptedTimeSec,
    ).toBe(continuation.measurementCycle.endTimeSec);

    const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
    expect(continuation.materialBinding).toEqual(
      normalAdultMainWireFiveWallMechanicalPortMaterialBindingV1(fixture),
    );
    expect(continuation.materialBinding.ownerId).toBe(prior.priorId);
    expect(continuation.materialBinding.parameterIdentityHash).toBe(
      prior.parameterIdentityHash,
    );
    expect(continuation.materialBinding.mechanicsProviderIdentity).toEqual({
      contractId: fixture.provider.contractId,
      providerId: fixture.provider.providerId,
      parameterSetId: fixture.provider.parameterSetId,
      parameterIdentityHash: fixture.provider.parameterIdentityHash,
      stateSchemaVersion: fixture.provider.stateSchemaVersion,
    });
    expect(continuation.materialBinding.wallMaterialVolumeMlByWall.LVFW).toBe(
      prior.anatomy.triSeg.wallGeometryParameters.LVFW.wallMaterialVolumeM3 *
        1e6,
    );

    for (const wall of Object.values(continuation.ledger.perWall)) {
      expect(Number.isFinite(wall.activeMechanical.netDeliveryMilliJ)).toBe(
        true,
      );
      expect(wall.parallelSls.physicalDissipationMilliJ).toBeGreaterThanOrEqual(
        -1e-10,
      );
      expect(
        wall.parallelSls.backwardEulerNumericalDissipationMilliJ,
      ).toBeGreaterThanOrEqual(-1e-10);
    }
    expect(continuation.ledger.claim.pressureVolumeAreaClaimed).toBe(false);
    expect(continuation.ledger.claim.landThermodynamicStoredEnergyClaimed).toBe(
      false,
    );
    expect(continuation.ledger.claim.officialQualificationEstablished).toBe(
      false,
    );
    expect(
      Math.abs(
        continuation.ledger.backwardEulerWorkConjugacyResidualMilliJ.leftAtrium,
      ),
    ).toBeLessThan(2);
    expect(
      Math.abs(
        continuation.ledger.backwardEulerWorkConjugacyResidualMilliJ
          .rightAtrium,
      ),
    ).toBeLessThan(1);
  });
});

async function expectCycleParity(
  canonicalFixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  replayFixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  nominalDtSec: number,
  observeRevision?: (
    acceptedRevision: number,
    previousAcceptedRevision: number,
  ) => void,
) {
  const canonical = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
    canonicalFixture,
    canonicalFixture.cold.acceptedState,
    1,
    nominalDtSec,
  );
  const replay = runMainWireIntegratedModelPeriodicMechanicalPortCycleReplayV1(
    replayFixture,
    replayFixture.cold.acceptedState,
    1,
    nominalDtSec,
    (observation) => {
      observeRevision?.(
        observation.acceptedRevision,
        observation.previousAcceptedRevision,
      );
      expect(observation.acceptedTimeSec).toBeGreaterThan(
        observation.previousAcceptedTimeSec,
      );
    },
  );
  const {
    terminalAcceptedState: canonicalTerminalAcceptedState,
    ...canonicalProjection
  } = canonical;
  const {
    terminalAcceptedState: replayTerminalAcceptedState,
    ...replayProjection
  } = replay;
  expect(canonicalJsonStringify(replayProjection)).toBe(
    canonicalJsonStringify(canonicalProjection),
  );
  const [canonicalCheckpoint, replayCheckpoint] = await Promise.all([
    checkpointMainWireIntegratedModelV3(
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        canonicalFixture,
      ),
      canonicalTerminalAcceptedState,
    ),
    checkpointMainWireIntegratedModelV3(
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        replayFixture,
      ),
      replayTerminalAcceptedState,
    ),
  ]);
  expect(canonicalJsonStringify(replayCheckpoint)).toBe(
    canonicalJsonStringify(canonicalCheckpoint),
  );
  return replay;
}
