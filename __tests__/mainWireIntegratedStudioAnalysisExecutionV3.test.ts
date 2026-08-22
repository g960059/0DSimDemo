import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import type { StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import {
  mergeMainWireIntegratedStudioStructuralAnalysesV3,
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";

describe("Main Wire Integrated V3 analysis execution", () => {
  it("keeps Starling bidirectional and runs formal PVA as preload reduction only", () => {
    const plan = resolveMainWireIntegratedStudioAnalysisExecutionPlanV3(
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
    );

    expect(plan?.partitions).toEqual([
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
    ]);
    expect(
      resolveMainWireIntegratedStudioAnalysisExecutionPlanV3(
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
      )?.partitions,
    ).toEqual([
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
    ]);
    expect(
      resolveMainWireIntegratedStudioAnalysisExecutionPlanV3(
        "analysis/not-registered",
      ),
    ).toBeNull();
  });

  it("merges measured points and collapses the duplicate exact center", () => {
    const low = analysisV3("hypovolemic");
    const high = analysisV3("hypervolemic");
    const merged = mergeMainWireIntegratedStudioStructuralAnalysesV3([
      low,
      high,
    ]);
    const payload = merged.payload as unknown as Readonly<{
      right: Readonly<{
        starlingLocus: Readonly<{
          completedPointCount: number;
          totalPointCount: number;
          points: readonly Readonly<{
            role: string;
            totalBloodVolumeMl: number;
          }>[];
        }>;
      }>;
      left: Readonly<{
        starlingLocus: Readonly<{
          completedPointCount: number;
          points: readonly unknown[];
        }>;
      }>;
    }>;

    expect(
      payload.right.starlingLocus.points.map((point) => [
        point.role,
        point.totalBloodVolumeMl,
      ]),
    ).toEqual([
      ["continuation", 4_000],
      ["operating-anchor", 5_000],
      ["continuation", 6_000],
    ]);
    expect(payload.right.starlingLocus.completedPointCount).toBe(3);
    expect(payload.right.starlingLocus.totalPointCount).toBe(11);
    expect(payload.left.starlingLocus.completedPointCount).toBe(3);
    expect(payload.left.starlingLocus.points).toHaveLength(3);
    expect(Object.isFrozen(merged)).toBe(true);
  });

  it("rejects two Workers that disagree about their exact center", () => {
    expect(() =>
      mergeMainWireIntegratedStudioStructuralAnalysesV3([
        analysisV3("hypovolemic"),
        analysisV3("hypervolemic", 5.6),
      ]),
    ).toThrow(/duplicate Starling point/);
  });

  it("reports the measured union as complete after both directions finish", () => {
    const merged = mergeMainWireIntegratedStudioStructuralAnalysesV3([
      analysisV3("hypovolemic", 5.5, true),
      analysisV3("hypervolemic", 5.5, true),
    ]);
    const payload = merged.payload as unknown as Readonly<{
      right: Readonly<{
        starlingLocus: Readonly<{
          completedPointCount: number;
          totalPointCount: number;
        }>;
      }>;
    }>;

    expect(payload.right.starlingLocus).toMatchObject({
      completedPointCount: 3,
      totalPointCount: 3,
    });
  });
});

function analysisV3(
  partition: "hypovolemic" | "hypervolemic",
  centerFlowLPerMin = 5.5,
  complete = false,
): StudioSimulationAnalysisV2 {
  return Object.freeze({
    modelId: "model/main-wire-v3-r1",
    runtimeSessionId: "runtime/source",
    scenarioId: "scenario/baseline",
    inputEpoch: 2,
    sourceAcceptedRevision: 100,
    sourceAcceptedTimeSec: 0.2,
    analysisId: MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
    payload: Object.freeze({
      status: "available",
      protocolId: "responsive-preview-v3",
      right: sideV3("right", partition, centerFlowLPerMin, complete),
      left: sideV3("left", partition, centerFlowLPerMin, complete),
    }),
  });
}

function sideV3(
  side: "right" | "left",
  partition: "hypovolemic" | "hypervolemic",
  centerFlowLPerMin: number,
  complete: boolean,
) {
  const centerPressure = side === "right" ? 3 : 8;
  const directionalPoint =
    partition === "hypovolemic"
      ? pointV3(4_000, side === "right" ? -1 : 1, 0.4, "continuation")
      : pointV3(6_000, side === "right" ? 8 : 15, 6, "continuation");
  return Object.freeze({
    side,
    semantics: "test-structural-orientation",
    curve: Object.freeze([
      Object.freeze({ downstreamPressureMmHg: -3, returnFlowLPerMin: 7 }),
      Object.freeze({ downstreamPressureMmHg: 17, returnFlowLPerMin: 0 }),
    ]),
    starlingLocus: Object.freeze({
      status: "responsive-fixed-tbv-preview",
      protocolId: "responsive-preview-v3",
      warmupDurationSec: 0,
      measurementDurationSec: 36,
      minimumBeatCount: 3,
      maximumBeatCount: 20,
      completedPointCount: 2,
      totalPointCount: complete ? 2 : 11,
      points: Object.freeze([
        pointV3(5_000, centerPressure, centerFlowLPerMin, "operating-anchor"),
        directionalPoint,
      ]),
    }),
  });
}

function pointV3(
  totalBloodVolumeMl: number,
  fillingPressureMmHg: number,
  cardiacOutputLPerMin: number,
  role: "operating-anchor" | "continuation",
) {
  return Object.freeze({
    totalBloodVolumeMl,
    fillingPressureMmHg,
    cardiacOutputLPerMin,
    role,
    quality: "adaptive-preview",
    curveEligible: true,
  });
}
