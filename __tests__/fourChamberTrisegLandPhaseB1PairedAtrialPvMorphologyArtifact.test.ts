import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_OBSERVATION_V1_ID,
  type PhaseB1NormalSinusBeTerminalTimestepObservationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  buildPhaseB1AtrialPvMorphologyProjectionFromTerminalObservationV1,
  buildPhaseB1PairedAtrialPvMorphologyAnalysisManifestV1,
  buildPhaseB1PairedAtrialPvMorphologyArtifactV1,
  classifyPhaseB1AtrialPvMorphologyV1,
  classifyPhaseB1PairedAtrialPvMorphologyOutcomeV1,
  projectPhaseB1AtrialPvMorphologySeriesFromTerminalSamplesV1,
  serializePhaseB1PairedAtrialPvMorphologyArtifactV1,
  type PhaseB1AtrialPvMorphologySampleV1,
  type PhaseB1AtrialPvMorphologyTerminalProjectionSampleV1,
  type PhaseB1PairedAtrialPvMorphologySeriesByModeV1,
} from "@/tools/myocardium/phaseB1PairedAtrialPvMorphologyArtifactV1";

describe("Phase B1 paired atrial PV morphology artifact", () => {
  it("deterministically classifies present, absent, and ambiguous traces", () => {
    const manifest = analysisManifest();
    const present = classifyPhaseB1AtrialPvMorphologyV1({
      atriumId: "LA",
      samples: figureEightSamples(),
      analysisManifest: manifest,
      sha256Hex: sha256,
    });
    const absent = classifyPhaseB1AtrialPvMorphologyV1({
      atriumId: "LA",
      samples: simpleLoopSamples(),
      analysisManifest: manifest,
      sha256Hex: sha256,
    });
    const indeterminate = classifyPhaseB1AtrialPvMorphologyV1({
      atriumId: "LA",
      samples: ambiguousContactSamples(),
      analysisManifest: manifest,
      sha256Hex: sha256,
    });

    expect(present).toMatchObject({
      classification: "present",
      qualifiedIntersectionCount: 1,
      ambiguousContactCount: 0,
      opposedSignedLobes: true,
      reasons: [],
      morphologyOutcomeUsedAsAcceptanceGate: false,
      analysisCompleted: true,
    });
    expect(present.primaryCrossing?.circularPhaseSeparation01)
      .toBeCloseTo(0.5, 12);
    expect(present.signedDimensionlessLobeAreas?.[0]
      * (present.signedDimensionlessLobeAreas?.[1] ?? 0)).toBeLessThan(0);
    expect(absent).toMatchObject({
      classification: "absent",
      rawPointIntersectionCount: 0,
      qualifiedIntersectionCount: 0,
      reasons: ["no-self-intersection"],
      analysisCompleted: true,
    });
    expect(indeterminate).toMatchObject({
      classification: "indeterminate",
      sampleCount: 8,
      analysisCompleted: true,
    });
    expect(indeterminate.ambiguousContactCount).toBeGreaterThan(0);
    expect(indeterminate.reasons).toContain(
      "non-transverse-or-overlapping-contact",
    );

    expect(classifyPhaseB1AtrialPvMorphologyV1({
      atriumId: "LA",
      samples: figureEightSamples(),
      analysisManifest: manifest,
      sha256Hex: sha256,
    })).toEqual(present);
  });

  it("makes paired outcomes a deterministic readback", () => {
    expect(classifyPhaseB1PairedAtrialPvMorphologyOutcomeV1(
      "present",
      "present",
    )).toBe("present-in-both");
    expect(classifyPhaseB1PairedAtrialPvMorphologyOutcomeV1(
      "absent",
      "present",
    )).toBe("present-only-on");
    expect(classifyPhaseB1PairedAtrialPvMorphologyOutcomeV1(
      "present",
      "absent",
    )).toBe("present-only-off");
    expect(classifyPhaseB1PairedAtrialPvMorphologyOutcomeV1(
      "absent",
      "absent",
    )).toBe("absent-in-both");
    expect(classifyPhaseB1PairedAtrialPvMorphologyOutcomeV1(
      "indeterminate",
      "present",
    )).toBe("indeterminate");
  });

  it("passes the completeness gate when SLS-off is absent and SLS-on is present", () => {
    const manifest = analysisManifest();
    const artifact = buildPhaseB1PairedAtrialPvMorphologyArtifactV1({
      analysisManifest: manifest,
      seriesByMode: pairedSeries({
        off: simpleLoopSamples(),
        on: figureEightSamples(),
      }),
      sha256Hex: sha256,
    });

    expect(artifact.morphologyByMode.off.LA.classification).toBe("absent");
    expect(artifact.morphologyByMode.on.LA.classification).toBe("present");
    expect(artifact.pairedOutcomeByAtrium).toEqual({
      LA: "present-only-on",
      RA: "present-only-on",
    });
    expect(artifact.morphologyReportCompletenessGatePass).toBe(true);
    expect(artifact.reportCompleteness).toEqual({
      scope: "pv-morphology-only",
      bothModesReported: true,
      bothAtriaReportedInEachMode: true,
      allFourAnalysesCompleted: true,
      analysisManifestAuthenticated: true,
      morphologyOutcomeUsedAsAcceptanceGate: false,
      reservoirConduitPumpPhaseOwnershipIncluded: false,
      matchedVolumePressureAttributionIncluded: false,
      waveformAmplitudeDeltasIncluded: false,
      fullRequiredSlsAblationReportComplete: false,
    });
    expect(artifact.claimBoundary).toMatchObject({
      mandatoryPairedMorphologyReporting: true,
      fullRequiredSlsAblationReportComplete: false,
      antiOverfitEvidenceOnly: true,
      morphologyOutcomeUsedAsAcceptanceGate: false,
      morphologyReportCompletenessIsOnlyGate: true,
      slsCausalityEstablished: false,
      physiologicalValidationEstablished: false,
    });
    expect(artifact.slsCausalityEstablished).toBe(false);
    expect(artifact.physiologicalValidationPass).toBe(false);
    expect(artifact.phaseB1AcceptancePass).toBe(false);
    expect(Object.isFrozen(artifact)).toBe(true);
    expect(Object.isFrozen(artifact.morphologyByMode.off.LA.reasons)).toBe(true);
  });

  it("reports indeterminate without failing completeness", () => {
    const manifest = analysisManifest();
    const artifact = buildPhaseB1PairedAtrialPvMorphologyArtifactV1({
      analysisManifest: manifest,
      seriesByMode: pairedSeries({
        off: figureEightSamples().slice(0, 4),
        on: figureEightSamples(),
      }),
      sha256Hex: sha256,
    });

    expect(artifact.morphologyByMode.off.LA.classification)
      .toBe("indeterminate");
    expect(artifact.pairedOutcomeByAtrium.LA).toBe("indeterminate");
    expect(artifact.morphologyReportCompletenessGatePass).toBe(true);
  });

  it("rejects incomplete mode/atrium inventories and post-hash mutation", () => {
    const manifest = analysisManifest();
    expect(() => buildPhaseB1PairedAtrialPvMorphologyArtifactV1({
      analysisManifest: manifest,
      seriesByMode: {
        on: {
          LA: figureEightSamples(),
          RA: figureEightSamples(),
        },
      },
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);
    expect(() => buildPhaseB1PairedAtrialPvMorphologyArtifactV1({
      analysisManifest: manifest,
      seriesByMode: {
        off: {
          LA: simpleLoopSamples(),
          RA: simpleLoopSamples(),
        },
        on: {
          LA: figureEightSamples(),
        },
      },
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);

    const artifact = buildPhaseB1PairedAtrialPvMorphologyArtifactV1({
      analysisManifest: manifest,
      seriesByMode: pairedSeries({
        off: simpleLoopSamples(),
        on: figureEightSamples(),
      }),
      sha256Hex: sha256,
    });
    const serialized = serializePhaseB1PairedAtrialPvMorphologyArtifactV1(
      artifact,
      sha256,
    );
    expect(serialized.endsWith("\n")).toBe(true);
    expect(JSON.parse(serialized)).toEqual(artifact);
    expect(() => serializePhaseB1PairedAtrialPvMorphologyArtifactV1({
      ...artifact,
      contentSha256: "0".repeat(64),
    }, sha256)).toThrow(/does not match/i);
  });

  it("rejects malformed samples instead of converting them into morphology", () => {
    const manifest = analysisManifest();
    const samples = figureEightSamples();
    expect(() => classifyPhaseB1AtrialPvMorphologyV1({
      atriumId: "LA",
      samples: [samples[1], samples[0], ...samples.slice(2)],
      analysisManifest: manifest,
      sha256Hex: sha256,
    })).toThrow(/strictly increasing/i);
    expect(() => classifyPhaseB1AtrialPvMorphologyV1({
      atriumId: "LA",
      samples: samples.map((sample, index) => index === 3
        ? { ...sample, cavityPressurePa: Number.NaN }
        : sample),
      analysisManifest: manifest,
      sha256Hex: sha256,
    })).toThrow(/must be finite/i);
  });

  it("projects authenticated-trace coordinates to half-open periodic LA/RA series", () => {
    const source = terminalProjectionSamples();
    const projected =
      projectPhaseB1AtrialPvMorphologySeriesFromTerminalSamplesV1({
        samples: source,
        canonicalCycleLengthSec: 0.8,
      });

    expect(projected.LA).toEqual([
      { phase01: 0, volumeM3: 30e-6, cavityPressurePa: 800 },
      { phase01: 0.25, volumeM3: 34e-6, cavityPressurePa: 1_000 },
      { phase01: 0.5, volumeM3: 31e-6, cavityPressurePa: 900 },
    ]);
    expect(projected.RA).toEqual([
      { phase01: 0, volumeM3: 40e-6, cavityPressurePa: 500 },
      { phase01: 0.25, volumeM3: 44e-6, cavityPressurePa: 650 },
      { phase01: 0.5, volumeM3: 41e-6, cavityPressurePa: 550 },
    ]);
    expect(projected.LA).toHaveLength(source.length - 1);
    expect(projected.LA.at(-1)?.phase01).toBe(0.5);
    expect(Object.isFrozen(projected)).toBe(true);
    expect(Object.isFrozen(projected.LA)).toBe(true);
    expect(Object.isFrozen(projected.LA[0])).toBe(true);
  });

  it("requires one exact duplicated cycle-end endpoint and rejects serialized observation reconstruction", () => {
    const samples = terminalProjectionSamples();
    expect(() =>
      projectPhaseB1AtrialPvMorphologySeriesFromTerminalSamplesV1({
        samples: samples.slice(0, -1),
        canonicalCycleLengthSec: 0.8,
      })).toThrow(/exact cycle-end endpoint/i);
    expect(() =>
      projectPhaseB1AtrialPvMorphologySeriesFromTerminalSamplesV1({
        samples: [samples[1], samples[0], ...samples.slice(2)],
        canonicalCycleLengthSec: 0.8,
      })).toThrow(/start at phase zero|strictly increase/i);

    const reconstructed = JSON.parse(JSON.stringify({
      observationId:
        PHASE_B1_NORMAL_SINUS_BE_TERMINAL_TIMESTEP_OBSERVATION_V1_ID,
      contentSha256: "0".repeat(64),
    })) as PhaseB1NormalSinusBeTerminalTimestepObservationV1;
    expect(() =>
      buildPhaseB1AtrialPvMorphologyProjectionFromTerminalObservationV1({
        terminalObservation: reconstructed,
        sha256Hex: sha256,
      })).toThrow(/not builder-issued/i);
  });
});

function analysisManifest() {
  return buildPhaseB1PairedAtrialPvMorphologyAnalysisManifestV1({
    coordinateScaleByAtrium: {
      LA: { volumeM3: 1, cavityPressurePa: 1 },
      RA: { volumeM3: 1, cavityPressurePa: 1 },
    },
    sha256Hex: sha256,
  });
}

function pairedSeries(input: Readonly<{
  off: readonly PhaseB1AtrialPvMorphologySampleV1[];
  on: readonly PhaseB1AtrialPvMorphologySampleV1[];
}>): PhaseB1PairedAtrialPvMorphologySeriesByModeV1 {
  return {
    off: { LA: input.off, RA: input.off },
    on: { LA: input.on, RA: input.on },
  };
}

function figureEightSamples(
  sampleCount = 64,
): readonly PhaseB1AtrialPvMorphologySampleV1[] {
  return curveSamples(sampleCount, (phase01) => ({
    volumeM3: 2 + Math.sin(2 * Math.PI * phase01),
    cavityPressurePa: 2 + Math.sin(4 * Math.PI * phase01),
  }));
}

function simpleLoopSamples(
  sampleCount = 64,
): readonly PhaseB1AtrialPvMorphologySampleV1[] {
  return curveSamples(sampleCount, (phase01) => ({
    volumeM3: 2 + Math.cos(2 * Math.PI * phase01),
    cavityPressurePa: 2 + Math.sin(2 * Math.PI * phase01),
  }));
}

function ambiguousContactSamples(): readonly PhaseB1AtrialPvMorphologySampleV1[] {
  const points = [
    [0, 0],
    [1, 1],
    [2, 0],
    [1, -1],
    [0, 0],
    [-1, 1],
    [-2, 0],
    [-1, -1],
  ] as const;
  return points.map(([volumeM3, cavityPressurePa], index) => ({
    phase01: (index + 0.25) / points.length,
    volumeM3: 3 + volumeM3,
    cavityPressurePa: 3 + cavityPressurePa,
  }));
}

function terminalProjectionSamples():
readonly PhaseB1AtrialPvMorphologyTerminalProjectionSampleV1[] {
  return [
    terminalProjectionSample(0, 30e-6, 40e-6, 800, 500),
    terminalProjectionSample(0.2, 34e-6, 44e-6, 1_000, 650),
    terminalProjectionSample(0.4, 31e-6, 41e-6, 900, 550),
    // The observation trace owns this cycle-end endpoint. The morphology
    // projection closes the polyline itself and drops this point once.
    terminalProjectionSample(0.8, 30.1e-6, 40.1e-6, 805, 505),
  ];
}

function terminalProjectionSample(
  phaseSec: number,
  laVolumeM3: number,
  raVolumeM3: number,
  laPressurePa: number,
  raPressurePa: number,
): PhaseB1AtrialPvMorphologyTerminalProjectionSampleV1 {
  return {
    phaseSec,
    bloodVolumesM3: { LA: laVolumeM3, RA: raVolumeM3 },
    compartmentAbsolutePressurePa: {
      LA: laPressurePa,
      RA: raPressurePa,
    },
  };
}

function curveSamples(
  sampleCount: number,
  curve: (phase01: number) => Readonly<{
    volumeM3: number;
    cavityPressurePa: number;
  }>,
): readonly PhaseB1AtrialPvMorphologySampleV1[] {
  return Array.from({ length: sampleCount }, (_, index) => {
    // The quarter-index offset keeps the expected transverse crossing inside
    // both polyline segments instead of placing it on a sampled endpoint.
    const phase01 = (index + 0.25) / sampleCount;
    return { phase01, ...curve(phase01) };
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
