import { describe, expect, it } from "vitest";
import {
  runNoAvpdFourChamberAtrialLandTriSegBenchV2,
  summarizeNoAvpdFourChamberAtrialLandBenchPhysiologyV2,
  type NoAvpdFourChamberAtrialLandWarmStartProvenanceV2,
  type NoAvpdFourChamberAtrialLandBenchSampleV2,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberAtrialLandTriSegBenchV2";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2,
  initialNoAvpdFourChamberAtrialLandTriSegStateV2,
  totalBloodVolumeMl,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberAtrialLandTriSegV2";

describe("NoAvpdFourChamberAtrialLandTriSegBenchV2 event diagnostics", () => {
  it("segments the cycle and identifies separated E/A peaks from MVO, LA activation, and MVC", () => {
    const flows = [0, 1, 3, 6, 3, 1, 2, 5, 2, 0, 0];
    const gradients = [-1, 1, 2, 2, 2, 2, 2, 2, 1, -1, -1];
    const result = summarizeNoAvpdFourChamberAtrialLandBenchPhysiologyV2(
      syntheticBeat(flows, gradients),
      0.6,
    );

    expect(result?.phaseSegmentation.status).toBe(
      "identified-from-pressure-crossings-and-la-activation",
    );
    expect(result?.phaseSegmentation.conduitEarlyFilling).toMatchObject({
      startPhase01: 0.05,
      endPhase01: 0.6,
      wrapsCycleBoundary: false,
    });
    expect(result?.mitralInflowIdentification.status).toBe("separated");
    expect(result?.ePeak).toMatchObject({ phase01: 0.3, flowMlPerSec: 6 });
    expect(result?.aPeak).toMatchObject({ phase01: 0.7, flowMlPerSec: 5 });
    expect(result?.eaPeakRatio).toBeCloseTo(1.2, 12);
  });

  it("reports fused rather than inventing two peaks when forward flow spans activation", () => {
    const flows = [0, 1, 2, 4, 6, 8, 9, 8, 4, 0, 0];
    const gradients = [-1, 1, 2, 2, 2, 2, 2, 2, 1, -1, -1];
    const result = summarizeNoAvpdFourChamberAtrialLandBenchPhysiologyV2(
      syntheticBeat(flows, gradients),
      0.6,
    );

    expect(result?.mitralInflowIdentification.status).toBe("fused");
    expect(result?.mitralInflowIdentification.reason).toBe(
      "forward-flow-spans-la-activation-without-two-resolved-maxima",
    );
    expect(result?.eaPeakRatio).toBeNull();
  });

  it("reports not-identifiable when ordered valve events are absent", () => {
    const result = summarizeNoAvpdFourChamberAtrialLandBenchPhysiologyV2(
      syntheticBeat([0, 1, 2, 3, 2, 1, 2, 3, 2, 1, 0], Array(11).fill(-1)),
      0.6,
    );

    expect(result?.phaseSegmentation.status).toBe(
      "not-identifiable-missing-ordered-events",
    );
    expect(result?.mitralInflowIdentification.status).toBe("not-identifiable");
    expect(result?.ePeak).toBeNull();
    expect(result?.aPeak).toBeNull();
  });
});

describe("NoAvpdFourChamberAtrialLandTriSegBenchV2 warm-start boundary", () => {
  const params = DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2;
  const initial = initialNoAvpdFourChamberAtrialLandTriSegStateV2(params);
  const provenance: NoAvpdFourChamberAtrialLandWarmStartProvenanceV2 = {
    resumeMode: "exact-same-parameter-checkpoint",
    sourceArtifactId: "synthetic-test-checkpoint",
    sourceNormalizedSha256: "normalized-sha",
    sourceParameterSha256: "parameter-sha",
    sourceImplementationSha256: "implementation-sha",
    sourceHarnessSha256: "harness-sha",
    sourceCheckpointStateSha256: "checkpoint-state-sha",
    sourceModelId: NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2,
    sourceEquationsVersionId:
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2,
    sourceStateLayoutId:
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2,
    sourceRhythmTopologyId:
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2,
    sourceCycleLengthSec: params.cycleLengthSec,
    sourceDtSec: 0.002,
    sourceTotalBloodVolumeMl: totalBloodVolumeMl(initial.volumes),
    periodClassification: "unclassified",
  };

  it("requires provenance for an injected cycle-boundary state", () => {
    expect(() => runNoAvpdFourChamberAtrialLandTriSegBenchV2({
      beats: 3,
      dtSec: 0.002,
      initialState: initial,
    })).toThrow("warm initialState requires warmStartProvenance");
  });

  it("rejects provenance without an injected state", () => {
    expect(() => runNoAvpdFourChamberAtrialLandTriSegBenchV2({
      beats: 3,
      dtSec: 0.002,
      warmStartProvenance: provenance,
    })).toThrow("warmStartProvenance requires initialState");
  });

  it("rejects an incompatible LA material identity before stepping", () => {
    const incompatible = {
      ...initial,
      walls: {
        ...initial.walls,
        leftAtrium: {
          ...initial.walls.leftAtrium,
          materialIdentity: {
            ...initial.walls.leftAtrium.materialIdentity,
            landEffectiveParamsCanonicalJson: "different-land-pack",
          },
        },
      },
    };
    expect(() => runNoAvpdFourChamberAtrialLandTriSegBenchV2({
      beats: 3,
      dtSec: 0.002,
      initialState: incompatible,
      warmStartProvenance: provenance,
    })).toThrow("initialState left-atrial material identity is incompatible");
  });
});

function syntheticBeat(
  mitralFlowsMlPerSec: readonly number[],
  laMinusLvGradientsMmHg: readonly number[],
): readonly NoAvpdFourChamberAtrialLandBenchSampleV2[] {
  return mitralFlowsMlPerSec.map((flow, index) => {
    const phase01 = index / (mitralFlowsMlPerSec.length - 1);
    const laPressure = 8;
    return {
      timeSec: phase01,
      beatIndex: 0,
      phase01,
      volumesMl: {
        leftAtriumMl: 60 + phase01,
        leftVentricleMl: 120 - phase01,
      },
      pressuresMmHg: {
        la: laPressure,
        lv: laPressure - laMinusLvGradientsMmHg[index]!,
      },
      flowsMlPerSec: { mv: flow },
    } as unknown as NoAvpdFourChamberAtrialLandBenchSampleV2;
  });
}
