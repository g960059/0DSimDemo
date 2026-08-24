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
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1,
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
            maximumNormalizedBeatDelta: number;
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
    const highPoints = (
      highAnalysis.payload as unknown as Readonly<{
        left: Readonly<{
          starlingLocus: Readonly<{
            points: readonly Readonly<{
              totalBloodVolumeMl: number;
              completedBeatCount: number;
              maximumNormalizedBeatDelta: number;
            }>[];
          }>;
        }>;
      }>
    ).left.starlingLocus.points;

    expect(payload.left.starlingLocus).toMatchObject({
      status: "measured-fixed-tbv-protocol",
      slowControllerPolicy: "active-source-period1-then-coronary-tone-frozen",
    });
    expect(
      payload.left.starlingLocus.completedPointCount,
    ).toBeGreaterThanOrEqual(4);
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
    const highScales = highPoints
      .map(({ totalBloodVolumeMl }) => totalBloodVolumeMl / 5_600)
      .sort((left, right) => left - right);
    expect(highScales[0]).toBeCloseTo(1, 12);
    expect(highScales[1]).toBeCloseTo(1.12, 12);
    expect(highScales.at(-1)).toBeGreaterThanOrEqual(1.5);
    expect(highScales.length).toBeLessThanOrEqual(6);
    expect(
      highScales
        .slice(1)
        .some((scale, index) => scale - highScales[index]! >= 0.15),
    ).toBe(true);
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
    ).toBeLessThan(sourceTbvMl * 0.6);
    expect(payload.left.starlingLocus.points.length).toBeLessThanOrEqual(7);
    const corePoints = payload.left.starlingLocus.points
      .filter(
        ({ totalBloodVolumeMl }) =>
          totalBloodVolumeMl >= sourceTbvMl * 0.7 - 1e-6,
      )
      .sort(
        (left, right) => right.totalBloodVolumeMl - left.totalBloodVolumeMl,
      );
    const firstLowScale = corePoints[1]!.totalBloodVolumeMl / sourceTbvMl;
    expect(1 - firstLowScale).toBeCloseTo(0.1, 12);
    const continuationPoints = [
      ...payload.left.starlingLocus.points.slice(1),
      ...highPoints.slice(1),
    ];
    expect(
      continuationPoints.some(
        ({ completedBeatCount }) => completedBeatCount < 12,
      ),
    ).toBe(true);
    for (const point of continuationPoints) {
      expect(point.completedBeatCount).toBeGreaterThanOrEqual(3);
      expect(point.completedBeatCount).toBeLessThanOrEqual(12);
      expect(point.maximumNormalizedBeatDelta).toBeLessThanOrEqual(1);
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
        phaseSelectionPolicy:
          "all-settled-loads-over-fixed-anchor-esv-neighborhood-within-anchor-late-systolic-window",
        phaseSelectionStatus: "complete",
        phaseSelectionPointCount: fullPva.source.pointCount,
        phaseSelectionObjective:
          "positive-active-pressure-area-over-fixed-anchor-esv-neighborhood",
        phaseSelectionCoarseTimeSampleCount: 32,
      });
      expect(
        fullPva.espvr.phaseSelectionIntegrationVolumeRangeMl[0],
      ).toBeCloseTo(59.04704134645029, 12);
      expect(
        fullPva.espvr.phaseSelectionIntegrationVolumeRangeMl[1],
      ).toBeCloseTo(72.16860609010591, 12);
      expect(fullPva.espvr.phaseSelectionAnchorLandmarks).toEqual({
        maximumPressurePhase01: 0.3850000000000158,
        endSystolicPhase01: 0.49500000000003297,
      });
      expect(fullPva.espvr.phaseSelectionCandidatePhaseRange01[0]).toBeCloseTo(
        0.3600000000000158,
        12,
      );
      expect(fullPva.espvr.phaseSelectionCandidatePhaseRange01[1]).toBeCloseTo(
        0.520000000000033,
        12,
      );
      expect(fullPva.espvr.selectedTimeSinceAtrialCaptureSec).toBeGreaterThan(
        fullPva.espvr.phaseSelectionCandidateTimeRangeSec[0],
      );
      expect(fullPva.espvr.selectedTimeSinceAtrialCaptureSec).toBeLessThan(
        fullPva.espvr.phaseSelectionCandidateTimeRangeSec[1],
      );
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
    expect(progress.length).toBeGreaterThanOrEqual(4);
    const bootstrapPayload = progress[3]!.payload as unknown as Readonly<{
      left: Readonly<{
        starlingLocus: Readonly<{
          points: readonly Readonly<{ totalBloodVolumeMl: number }>[];
        }>;
      }>;
    }>;
    expect(
      Math.min(
        ...bootstrapPayload.left.starlingLocus.points.map(
          ({ totalBloodVolumeMl }) => totalBloodVolumeMl,
        ),
      ),
    ).toBeCloseTo(3_360, 8);
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("retains formal ESPVR and EDPVR coverage from a 6800 mL source", async () => {
    const lowHost = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const highHost = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-formal-pva-high-source";
    const scenarioId = "scenario/high-source";
    const fixture = {
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    } as const;
    await Promise.all([
      lowHost.createSession(runtimeSessionId, [fixture]),
      highHost.createSession(runtimeSessionId, [fixture]),
    ]);
    await Promise.all([
      lowHost.applyControl(
        runtimeSessionId,
        scenarioId,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.totalBloodVolumeMl,
        6_800,
        0,
      ),
      highHost.applyControl(
        runtimeSessionId,
        scenarioId,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.totalBloodVolumeMl,
        6_800,
        0,
      ),
    ]);
    const source = lowHost.currentFrame(runtimeSessionId, scenarioId);
    const highSource = highHost.currentFrame(runtimeSessionId, scenarioId);
    const [lowAnalysis, highAnalysis] = await Promise.all([
      lowHost.requestAnalysis(
        runtimeSessionId,
        scenarioId,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
        source.inputEpoch,
        source.acceptedRevision,
        source.acceptedTimeSec,
        MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
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
    const merged = mergeMainWireIntegratedStudioStructuralAnalysesV3([
      highAnalysis,
      lowAnalysis,
    ]);
    const locus = (
      merged.payload as unknown as Readonly<{
        left: Readonly<{
          starlingLocus: MainWireIntegratedModelStarlingLocusV3;
        }>;
      }>
    ).left.starlingLocus;
    const pva = buildMainWireIntegratedModelPeriodicPvaV1(locus, "LV");
    if (pva.status !== "available") throw new Error(pva.reason);
    expect(pva.espvr.fitPoints.length).toBeGreaterThanOrEqual(5);
    expect(pva.edpvr.fitPoints.length).toBeGreaterThanOrEqual(5);
    lowHost.closeSession(runtimeSessionId);
    highHost.closeSession(runtimeSessionId);
  }, 120_000);
});
