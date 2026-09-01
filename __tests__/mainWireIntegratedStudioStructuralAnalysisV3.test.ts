import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
} from "@/analysis/methods/mainWire/MainWireGuytonStarlingOrientationV3";
import {
  resolveMainWireStructuralAnalysisExecutionPlanV1,
} from "@/analysis/methods/mainWire/MainWireStructuralAnalysisExecutionV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import type {
  StudioSimulationAnalysisV2,
} from "@/studio/contracts/v2/simulation";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioStandardRuntimeHostV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";

describe("Standard Main Wire structural analysis execution", () => {
  it("connects Standard PV analyses to their bidirectional plans", async () => {
    const legacyPlan = resolveMainWireStructuralAnalysisExecutionPlanV1(
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
    );
    const formalPlan = resolveMainWireStructuralAnalysisExecutionPlanV1(
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
    );
    expect(legacyPlan?.partitions).toEqual([
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
    ]);
    expect(formalPlan?.partitions).toEqual([
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
    ]);
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-pv-analysis";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [
      {
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      },
    ]);
    const source = host.advanceOnePresentationStep(
      runtimeSessionId,
      scenarioId,
    );
    const progress: StudioSimulationAnalysisV2[] = [];
    const analysis = await host.requestAnalysis(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      source.inputEpoch,
      source.acceptedRevision,
      source.acceptedTimeSec,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
      (partial) => progress.push(partial),
    );
    const payload = analysis.payload as unknown as Readonly<{
      left: Readonly<{
        starlingLocus: Readonly<{
          status: string;
          points: readonly Readonly<{
            ventricularPressureVolumeLoop: readonly unknown[];
          }>[];
        }>;
      }>;
    }>;
    expect(analysis.modelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    );
    expect(payload.left.starlingLocus.status).toBe(
      "responsive-fixed-tbv-preview",
    );
    const initialPayload = progress[0]?.payload as unknown as Readonly<{
      left: Readonly<{
        curve: readonly unknown[];
        starlingLocus: Readonly<{ status: string; points: readonly unknown[] }>;
      }>;
    }>;
    expect(initialPayload.left.curve.length).toBeGreaterThan(1);
    expect(initialPayload.left.starlingLocus).toMatchObject({
      status: "requires-protocol",
      points: [],
    });
    expect(payload.left.starlingLocus.points.length).toBeGreaterThan(2);
    expect(
      payload.left.starlingLocus.points.every(
        (point) => point.ventricularPressureVolumeLoop.length >= 12,
      ),
    ).toBe(true);
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(source);
    host.closeSession(runtimeSessionId);
  }, 120_000);
});
