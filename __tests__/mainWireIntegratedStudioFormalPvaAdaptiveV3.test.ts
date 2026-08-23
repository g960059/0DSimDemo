import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import { buildMainWireIntegratedModelPeriodicPvaV1 } from "@/engine/myocardium/analysis/MainWireIntegratedModelPeriodicPvaV1";
import type { MainWireIntegratedModelStarlingLocusV3 } from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import type { StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioStandardRuntimeHostV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import { mergeMainWireIntegratedStudioStructuralAnalysesV3 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";

describe("Standard Main Wire formal PVA adaptive chain", () => {
  it("settles a cold source before the adaptive low-volume chain", async () => {
    const lowHost = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const highHost = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-formal-pva-analysis";
    const scenarioId = "scenario/baseline";
    const fixture = {
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    } as const;
    await Promise.all([
      lowHost.createSession(runtimeSessionId, [fixture]),
      highHost.createSession(runtimeSessionId, [fixture]),
    ]);
    const source = lowHost.currentFrame(runtimeSessionId, scenarioId);
    const highSource = highHost.currentFrame(runtimeSessionId, scenarioId);
    expect(highSource).toEqual(source);
    const progress: StudioSimulationAnalysisV2[] = [];
    const [analysis, highAnalysis] = await Promise.all([
      lowHost.requestAnalysis(
        runtimeSessionId,
        scenarioId,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
        source.inputEpoch,
        source.acceptedRevision,
        source.acceptedTimeSec,
        MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
        (partial) => progress.push(partial),
      ),
      highHost.requestAnalysis(
        runtimeSessionId,
        scenarioId,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
        highSource.inputEpoch,
        highSource.acceptedRevision,
        highSource.acceptedTimeSec,
        MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
      ),
    ]);
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
      .filter(
        ({ totalBloodVolumeMl }) =>
          totalBloodVolumeMl >= sourceTbvMl * 0.6 - 1e-6,
      )
      .sort(
        (left, right) => right.totalBloodVolumeMl - left.totalBloodVolumeMl,
      );
    const firstLowScale = corePoints[1]!.totalBloodVolumeMl / sourceTbvMl;
    expect(1 - firstLowScale).toBeGreaterThanOrEqual(0.06);
    expect(1 - firstLowScale).toBeLessThanOrEqual(0.08);
    for (const point of corePoints.slice(1)) {
      const scale = point.totalBloodVolumeMl / sourceTbvMl;
      expect(point.completedBeatCount).toBeGreaterThanOrEqual(
        scale >= 0.82 ? 3 : scale >= 0.7 ? 4 : 5,
      );
    }
    expect(lowHost.currentFrame(runtimeSessionId, scenarioId)).toEqual(source);
    const periodicPva = buildMainWireIntegratedModelPeriodicPvaV1(
      payload.left.starlingLocus as MainWireIntegratedModelStarlingLocusV3,
      "LV",
    );
    expect(periodicPva).toMatchObject({
      status: "collecting",
      reason: expect.stringContaining("higher-preload"),
    });
    const merged = mergeMainWireIntegratedStudioStructuralAnalysesV3([
      highAnalysis,
      analysis,
    ]);
    const mergedLocus = (
      merged.payload as unknown as Readonly<{
        left: Readonly<{
          starlingLocus: MainWireIntegratedModelStarlingLocusV3;
        }>;
      }>
    ).left.starlingLocus;
    const fullPva = buildMainWireIntegratedModelPeriodicPvaV1(
      mergedLocus,
      "LV",
    );
    if (fullPva.status !== "available") throw new Error(fullPva.reason);
    expect(fullPva.status).toBe("available");
    {
      expect(fullPva.source.pointCount).toBeGreaterThan(
        payload.left.starlingLocus.points.length,
      );
      expect(fullPva.espvr).toMatchObject({
        primaryCurveLaw: "measured-domain-shape-preserving-locus",
      });
      expect(fullPva.espvr.educationalLinearApproximation).toMatchObject({
        method: "anchor-local-tangent",
        use: "display-only-not-pva-owner",
      });
      expect(
        fullPva.espvr.educationalLinearApproximation?.elastanceMmHgPerMl,
      ).toBeGreaterThan(0);
      expect(fullPva.espvr.fitPoints).toHaveLength(fullPva.source.pointCount);
      expect(fullPva.potentialEnergy.joule).toBeGreaterThan(0);
      expect(fullPva.pva.joule).toBeCloseTo(
        fullPva.strokeWork.joule + fullPva.potentialEnergy.joule,
        12,
      );
    }
    lowHost.closeSession(runtimeSessionId);
    highHost.closeSession(runtimeSessionId);
  }, 120_000);

  it("keeps an already-hypovolemic source above the normal-adult absolute core floor", async () => {
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-formal-pva-low-source";
    const scenarioId = "scenario/low-source";
    await host.createSession(runtimeSessionId, [
      {
        scenarioId,
        fixture: {
          ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
          hemodynamicResearchInputs: {
            ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1.hemodynamicResearchInputs,
            totalBloodVolumeMl: 4_400,
          },
        },
      },
    ]);
    const source = host.currentFrame(runtimeSessionId, scenarioId);
    const progress: StudioSimulationAnalysisV2[] = [];
    await expect(
      host.requestAnalysis(
        runtimeSessionId,
        scenarioId,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
        source.inputEpoch,
        source.acceptedRevision,
        source.acceptedTimeSec,
        MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
        (partial) => progress.push(partial),
      ),
    ).resolves.toBeDefined();
    expect(progress.length).toBeGreaterThanOrEqual(9);
    const ninthPayload = progress[8]!.payload as unknown as Readonly<{
      left: Readonly<{
        starlingLocus: Readonly<{
          points: readonly Readonly<{ totalBloodVolumeMl: number }>[];
        }>;
      }>;
    }>;
    expect(
      Math.min(
        ...ninthPayload.left.starlingLocus.points.map(
          ({ totalBloodVolumeMl }) => totalBloodVolumeMl,
        ),
      ),
    ).toBeCloseTo(3_360, 8);
    host.closeSession(runtimeSessionId);
  }, 120_000);
});
