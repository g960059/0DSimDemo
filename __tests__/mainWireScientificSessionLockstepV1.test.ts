import { describe, expect, it } from "vitest";

import {
  initializeMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireScientificSessionV1,
} from "@/engine/scientific/runtime";

describe("ScientificSession migration lockstep", () => {
  it("matches the promoted #478 transaction exactly for accepted steps", async () => {
    const session = await createMainWireScientificSessionV1();
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
    const runtime = normalAdultMainWireRuntimeV1();
    const pericardium = createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "healthy-slack",
    );
    const bloodVolume = resolveMainWireNormalAdultBloodVolumeOperatingPointV1(
      runtime,
    );
    let directState = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
      circulationInitial: Object.freeze({
        fixedTotalBloodVolumeMl: bloodVolume.fixedTotalBloodVolumeMl,
        nodeVolumesMl: bloodVolume.nodeVolumesMl,
      }),
    }).acceptedState;

    for (let stepIndex = 1; stepIndex <= 5; stepIndex += 1) {
      const direct = stepMainWireFiveWallNonCoronaryV1(provider, directState, {
        dtSec: 0.002,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
      });
      expect(direct.converged, `direct step ${stepIndex}`).toBe(true);
      if (direct.converged === false) return;
      directState = direct.acceptedState;
      const expected = sampleMainWireNormalAdultFiveWallDiagnosticStepV2(direct);

      const hosted = session.step(0.002);
      expect(hosted.converged, `session step ${stepIndex}`).toBe(true);
      if (hosted.converged === false) return;
      const actual = hosted.observation;

      expect(session.stateIdentity()).toEqual({
        revision: directState.revision,
        acceptedTimeSec: directState.acceptedTimeSec,
        totalBloodVolumeMl: directState.circulation.totalBloodVolumeMl,
      });
      expect(actual.revision).toBe(directState.revision);
      expect(actual.acceptedTimeSec).toBe(expected.timeSec);
      for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
        expect(actual.chamber[chamber]).toEqual({
          volumeMl: expected.nodeVolumeMl[chamber],
          absolutePressureMmHg: expected.nodeAbsolutePressureMmHg[chamber],
          transmuralPressureMmHg:
            expected.chamberTransmuralPressureMmHg[chamber],
          pressureAvailability: "available",
        });
      }
      for (const valve of ["MV", "AoV", "TV", "PV"] as const) {
        expect(actual.valve[valve]).toEqual({
          flowMlPerSec: expected.flowMlPerSec[valve],
          openingFraction01: expected.valveOpeningFraction01[valve],
          flowAvailability: "available",
        });
      }
      expect(actual.pulmonaryVenousFlowMlPerSec)
        .toBe(expected.flowMlPerSec.PVein_LA);
      expect(actual.diagnostics).toEqual({
        mechanicsResidualNorm: expected.diagnostics.mechanicsResidualNorm,
        mechanicsIterations: expected.diagnostics.mechanicsIterations,
        circulationScaledResidualInfinityNorm:
          expected.diagnostics.circulationScaledResidualInfinityNorm,
        maximumContinuityResidualMl:
          expected.diagnostics.maximumContinuityResidualMl,
        totalBloodVolumeErrorMl:
          expected.diagnostics.totalBloodVolumeErrorMl,
        mechanicsCallbackCount:
          expected.diagnostics.mechanicsCallbackCount,
        mechanicsCallbackCacheHits:
          expected.diagnostics.mechanicsCallbackCacheHits,
        commonPericardialExcessPressureMmHg:
          expected.commonPericardium.excessPressureMmHg,
      });
    }
  }, 120_000);
});
