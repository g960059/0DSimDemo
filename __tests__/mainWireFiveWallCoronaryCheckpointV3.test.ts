import { describe, expect, it } from "vitest";

import { defaultParams } from "@/engine/core/params";
import {
  createCoronaryAutoregulationWindowBindingV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
} from "@/engine/coronary/typesV2";
import {
  checkpointMainWireFiveWallCoronaryV3,
  restoreMainWireFiveWallCoronaryV3,
  type MainWireFiveWallCoronaryCheckpointContextV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryCheckpointV3";
import {
  initializeMainWireFiveWallCoronaryV3,
  stepMainWireFiveWallCoronaryV3,
  type MainWireFiveWallCoronaryAcceptedStateV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

type Provider = ReturnType<
  typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
>;
type WallState = ReturnType<Provider["initializeCold"]>["materialState"];

const PENDING_DRIVE = Object.freeze({
  controlId: "checkpoint-pending-hyperemia",
  demandScaleByTerritoryLayer: layerRecord(1),
  hyperemia01ByTerritoryLayer: layerRecord(1),
});

describe("main-wire coronary accepted-autoregulation checkpoint V3", () => {
  it("round-trips a pending desired control and its mid-window accumulator", async () => {
    const fixture = await midWindowFixture();
    const checkpoint = await checkpointMainWireFiveWallCoronaryV3(
      fixture.context,
      fixture.state,
    );
    const restored = await restoreMainWireFiveWallCoronaryV3(
      fixture.context,
      JSON.parse(JSON.stringify(checkpoint)),
    );
    expect(restored).toEqual(fixture.state);
    expect(checkpoint).not.toHaveProperty("exactResumeClaim");
    expect(checkpoint.baseCheckpointV2).not.toHaveProperty("exactResumeClaim");
    expect(checkpoint.coronaryAutoregulation).toMatchObject({
      acceptedDurationSec: 0.004,
      acceptedStepCount: 2,
      windowControl: {
        controlId: "circleheart.coronary-autoregulation-control.rest.v1",
      },
      desiredControl: {
        controlId: "checkpoint-pending-hyperemia",
      },
    });
    expect(checkpoint.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);

    const runtime = testRuntime();
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const continuationInput = {
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
      coronaryAutoregulationDrive: PENDING_DRIVE,
    } as const;
    const uninterrupted = stepMainWireFiveWallCoronaryV3(
      fixture.context.provider,
      fixture.state,
      continuationInput,
    );
    const resumed = stepMainWireFiveWallCoronaryV3(
      fixture.context.provider,
      restored,
      continuationInput,
    );
    expect(resumed).toEqual(uninterrupted);
  }, 60_000);

  it("detects accumulator tampering and rejects a semantically invalid rehash", async () => {
    const fixture = await midWindowFixture();
    const checkpoint = await checkpointMainWireFiveWallCoronaryV3(
      fixture.context,
      fixture.state,
    );
    const tampered = JSON.parse(JSON.stringify(checkpoint));
    tampered.coronaryAutoregulation
      .qmTimeIntegralMlByTerritoryLayer.LAD.subendocardial += 1;
    await expect(restoreMainWireFiveWallCoronaryV3(
      fixture.context,
      tampered,
    )).rejects.toThrow(/SHA-256 mismatch/);

    const invalid = JSON.parse(JSON.stringify(checkpoint));
    invalid.coronaryAutoregulation.acceptedStepCount = 0;
    const { checkpointSha256: _old, ...payload } = invalid;
    invalid.checkpointSha256 = await sha256CanonicalJsonHex(payload);
    await expect(restoreMainWireFiveWallCoronaryV3(
      fixture.context,
      invalid,
    )).rejects.toThrow(/empty-window invariants/);
  }, 60_000);

  it("fails closed under another window binding and rejects direct V2 restore", async () => {
    const fixture = await midWindowFixture();
    const checkpoint = await checkpointMainWireFiveWallCoronaryV3(
      fixture.context,
      fixture.state,
    );
    const anotherContext = Object.freeze({
      ...fixture.context,
      coronaryAutoregulationBinding:
        createCoronaryAutoregulationWindowBindingV3({
          originAcceptedTimeSec: 0,
          durationSec: 2,
          interpretation: "periodic-sinus-cycle-aligned",
        }),
    });
    await expect(restoreMainWireFiveWallCoronaryV3(
      anotherContext,
      checkpoint,
    )).rejects.toThrow(/binding mismatch/);
    await expect(restoreMainWireFiveWallCoronaryV3(
      fixture.context,
      checkpoint.baseCheckpointV2,
    )).rejects.toThrow(/unsupported.*V3 checkpoint schema/);
  }, 60_000);

});

async function midWindowFixture(): Promise<Readonly<{
  context: MainWireFiveWallCoronaryCheckpointContextV3<WallState>;
  state: MainWireFiveWallCoronaryAcceptedStateV3<WallState>;
}>> {
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const runtime = testRuntime();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1();
  const cold = initializeMainWireFiveWallCoronaryV3({
    provider,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
  });
  const first = stepMainWireFiveWallCoronaryV3(
    provider,
    cold.acceptedState,
    {
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    },
  );
  if (first.converged === false) throw new Error(first.message);
  const stepped = stepMainWireFiveWallCoronaryV3(
    provider,
    first.acceptedState,
    {
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
      coronaryAutoregulationDrive: PENDING_DRIVE,
    },
  );
  if (stepped.converged === false) throw new Error(stepped.message);
  const context = Object.freeze({
    provider,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior:
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    coronaryAutoregulationBinding:
      stepped.acceptedState.coronaryAutoregulationBinding,
  }) satisfies MainWireFiveWallCoronaryCheckpointContextV3<WallState>;
  return Object.freeze({ context, state: stepped.acceptedState });
}

function testRuntime() {
  const params = defaultParams();
  return Object.freeze({
    vascular: Object.freeze({
      venousTone: params.venousTone,
      arterialStiffness: params.arterialStiffness,
    }),
    losses: Object.freeze({
      systemicResistance: params.systemicResistance,
      pulmonaryResistance: params.pulmonaryResistance,
    }),
    respiratory: Object.freeze({
      PEEP: 0,
      Pth0: 0,
      respAmpTh: 0,
      respAmpAlv: 0,
      respRate: 0,
    }),
    valveResearchInput: MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
  });
}

function layerRecord(
  value: number,
): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId) => [layerId, value]),
    ))],
  ))) as CoronaryTerritoryLayerRecordV2<number>;
}
