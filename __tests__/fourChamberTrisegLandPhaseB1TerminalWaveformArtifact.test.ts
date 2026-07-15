import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type {
  PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  PHASE_B1_TERMINAL_WAVEFORM_ARTIFACT_V1_ID,
  buildPhaseB1TerminalWaveformSeriesV1,
  serializePhaseB1TerminalWaveformArtifactV1,
  type PhaseB1TerminalWaveformArtifactPayloadV1,
  type PhaseB1TerminalWaveformArtifactV1,
} from "@/tools/myocardium/phaseB1TerminalWaveformArtifactV1";

describe("Phase B1 terminal waveform artifact projection", () => {
  it("preserves SI values and projects the authenticated sample order columnarly", () => {
    const samples = [
      sample(0, 0, 1),
      sample(1, 0.001, 2),
    ];
    const waveform = buildPhaseB1TerminalWaveformSeriesV1(samples);

    expect(waveform.sampleIndex).toEqual([0, 1]);
    expect(waveform.phaseSec).toEqual([0, 0.001]);
    expect(waveform.nominalGridIndex).toEqual([0, 1]);
    expect(waveform.chamberBloodVolumeM3).toEqual({
      LA: [1e-6, 2e-6],
      LV: [2e-6, 4e-6],
      RA: [5e-6, 10e-6],
      RV: [6e-6, 12e-6],
    });
    expect(waveform.compartmentAbsolutePressurePa.LA).toEqual([101, 102]);
    expect(waveform.compartmentAbsolutePressurePa.PV).toEqual([808, 816]);
    expect(waveform.valveFlowM3PerSec.Q_MV).toEqual([1e-6, 2e-6]);
    expect(waveform.valveFlowM3PerSec.Q_PuV).toEqual([4e-6, 8e-6]);
    expect(waveform.allClosedLoopFlowM3PerSec.Q_sys).toEqual([7e-6, 14e-6]);
    expect(waveform.allClosedLoopFlowM3PerSec.Q_pul).toEqual([8e-6, 16e-6]);
    expect(Object.isFrozen(waveform)).toBe(true);
    expect(Object.isFrozen(waveform.phaseSec)).toBe(true);
  });

  it("rejects phase or sample-index drift", () => {
    expect(() => buildPhaseB1TerminalWaveformSeriesV1([
      sample(1, 0, 1),
    ])).toThrow(/indices must be contiguous/i);
    expect(() => buildPhaseB1TerminalWaveformSeriesV1([
      sample(0, 0, 1),
      sample(1, 0, 2),
    ])).toThrow(/phases must strictly increase/i);
  });

  it("serializes a canonical content-hashed payload with a terminal newline", () => {
    const payload = {
      artifactId: PHASE_B1_TERMINAL_WAVEFORM_ARTIFACT_V1_ID,
      status:
        "authenticated-in-process-terminal-observation-projection-for-visual-qa",
      testOnly: true,
    } as unknown as PhaseB1TerminalWaveformArtifactPayloadV1;
    const artifact = {
      ...payload,
      contentSha256: computeCanonicalSha256(payload, sha256),
    } as PhaseB1TerminalWaveformArtifactV1;
    const serialized = serializePhaseB1TerminalWaveformArtifactV1(
      artifact,
      sha256,
    );

    expect(serialized.endsWith("\n")).toBe(true);
    expect(JSON.parse(serialized)).toEqual(artifact);
    expect(() => serializePhaseB1TerminalWaveformArtifactV1({
      ...artifact,
      contentSha256: "0".repeat(64),
    }, sha256)).toThrow(/does not match/i);
  });
});

function sample(
  sampleIndex: number,
  phaseSec: number,
  multiplier: number,
): PhaseB1NormalSinusBeTerminalTimestepObservationSampleV1 {
  return Object.freeze({
    sampleIndex,
    sourceKind: sampleIndex === 0
      ? "run-initial-endpoint" as const
      : "requested-segment-exit-endpoint" as const,
    requestedSegmentIndex: sampleIndex === 0 ? null : sampleIndex - 1,
    absoluteTimeSec: 10 + phaseSec,
    phaseSec,
    nominalGridIndex: sampleIndex,
    runnerNominalGridIndex: sampleIndex === 0 ? null : sampleIndex - 1,
    eventKeysAtEnd: Object.freeze(sampleIndex === 0 ? [] : ["event"]),
    endedAtNominalGridBoundary: sampleIndex !== 0,
    endedAtRunBoundary: false,
    endedAtEventBoundary: false,
    eventOnlyExtraEndpoint: false,
    oneUlpNominalGridBoundaryCoalesced: false,
    oneUlpRunEndNominalGridBoundaryCoalesced: false,
    rightContinuousSameTimeLevelReevaluation: true as const,
    bloodVolumesM3: Object.freeze({
      LA: 1e-6 * multiplier,
      LV: 2e-6 * multiplier,
      SA: 3e-6 * multiplier,
      SV: 4e-6 * multiplier,
      RA: 5e-6 * multiplier,
      RV: 6e-6 * multiplier,
      PA: 7e-6 * multiplier,
      PV: 8e-6 * multiplier,
    }),
    compartmentAbsolutePressurePa: Object.freeze({
      LA: 100 + multiplier,
      LV: 200 + multiplier,
      SA: 300 + multiplier,
      SV: 400 + multiplier,
      RA: 500 + multiplier,
      RV: 600 + multiplier,
      PA: 700 + multiplier,
      PV: 800 + 8 * multiplier,
    }),
    allFlowsM3PerSec: Object.freeze({
      Q_MV: 1e-6 * multiplier,
      Q_AoV: 2e-6 * multiplier,
      Q_TV: 3e-6 * multiplier,
      Q_PuV: 4e-6 * multiplier,
      Q_VC: 5e-6 * multiplier,
      Q_PV: 6e-6 * multiplier,
      Q_sys: 7e-6 * multiplier,
      Q_pul: 8e-6 * multiplier,
    }),
    wallFiberLogStrain: Object.freeze({
      LA: 0.01,
      RA: 0.02,
      LVFW: 0.03,
      SEP: 0.04,
      RVFW: 0.05,
    }),
    wallActiveKirchhoffStressPa: Object.freeze({
      LA: 1,
      RA: 2,
      LVFW: 3,
      SEP: 4,
      RVFW: 5,
    }),
    septalSignedMidwallCurvaturePerM: 1,
    septalMidwallVolumeM3: 1e-6,
    junctionRadiusM: 0.01,
    pericardialExcessPressurePa: 0,
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
