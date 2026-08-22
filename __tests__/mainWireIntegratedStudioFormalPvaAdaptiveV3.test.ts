import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import type { StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioStandardRuntimeHostV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";

describe("Standard Main Wire formal PVA adaptive chain", () => {
  it("settles a cold source before the adaptive low-volume chain", async () => {
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-formal-pva-analysis";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [
      {
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      },
    ]);
    const source = host.currentFrame(runtimeSessionId, scenarioId);
    const progress: StudioSimulationAnalysisV2[] = [];
    const analysis = await host.requestAnalysis(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
      source.inputEpoch,
      source.acceptedRevision,
      source.acceptedTimeSec,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
      (partial) => progress.push(partial),
    );
    const payload = analysis.payload as unknown as Readonly<{
      left: Readonly<{
        starlingLocus: Readonly<{
          status: string;
          completedPointCount: number;
          totalPointCount: number;
          slowControllerPolicy: string;
          points: readonly Readonly<{
            totalBloodVolumeMl: number;
            completedBeatCount: number;
          }>[];
        }>;
      }>;
    }>;
    const progressCounts = progress.map((partial) => {
      const partialPayload = partial.payload as unknown as Readonly<{
        left: Readonly<{
          starlingLocus: Readonly<{ completedPointCount: number }>;
        }>;
      }>;
      return partialPayload.left.starlingLocus.completedPointCount;
    });

    expect(payload.left.starlingLocus).toMatchObject({
      status: "measured-fixed-tbv-protocol",
      slowControllerPolicy: "active-source-period1-then-coronary-tone-frozen",
    });
    expect(
      payload.left.starlingLocus.completedPointCount,
    ).toBeGreaterThanOrEqual(9);
    expect(payload.left.starlingLocus.totalPointCount).toBe(
      payload.left.starlingLocus.completedPointCount,
    );
    expect(payload.left.starlingLocus.points).toHaveLength(
      payload.left.starlingLocus.completedPointCount,
    );
    expect(progressCounts).toEqual(
      Array.from(
        { length: payload.left.starlingLocus.completedPointCount },
        (_, index) => index + 1,
      ),
    );
    const sourceTbvMl = Math.max(
      ...payload.left.starlingLocus.points.map(
        ({ totalBloodVolumeMl }) => totalBloodVolumeMl,
      ),
    );
    expect(
      Math.min(
        ...payload.left.starlingLocus.points.map(
          ({ totalBloodVolumeMl }) => totalBloodVolumeMl,
        ),
      ),
    ).toBeLessThanOrEqual(sourceTbvMl * 0.6);
    const corePoints = payload.left.starlingLocus.points
      .filter(({ totalBloodVolumeMl }) =>
        totalBloodVolumeMl >= sourceTbvMl * 0.6 - 1e-6)
      .sort((left, right) =>
        right.totalBloodVolumeMl - left.totalBloodVolumeMl);
    const firstLowScale =
      corePoints[1]!.totalBloodVolumeMl / sourceTbvMl;
    expect(1 - firstLowScale).toBeGreaterThanOrEqual(0.06);
    expect(1 - firstLowScale).toBeLessThanOrEqual(0.08);
    for (const point of corePoints.slice(1)) {
      const scale = point.totalBloodVolumeMl / sourceTbvMl;
      expect(point.completedBeatCount).toBeGreaterThanOrEqual(
        scale >= 0.82 ? 3 : scale >= 0.7 ? 4 : 5,
      );
    }
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(source);
    host.closeSession(runtimeSessionId);
  }, 120_000);
});
