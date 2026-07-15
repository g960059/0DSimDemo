import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1,
  buildPhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
  serializePhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1,
  type PhaseB1AtrialMatchedVolumePhaseWindowV1,
  type PhaseB1AtrialPressureAttributionSampleV1,
  type PhaseB1AtrialPressurePhaseSeriesV1,
  type PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
  type PhaseB1PairedAtrialPressureSeriesByModeV1,
} from "@/tools/myocardium/phaseB1PairedAtrialMatchedVolumePressureAttributionV1";

describe("Phase B1 paired atrial matched-volume pressure attribution", () => {
  it("interpolates both modes on a fixed common-volume grid and closes every owner sum", () => {
    const analysisManifest = manifest([reservoirWindow()], 3);
    const artifact = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: pairedSeries(analysisManifest, {
        off: [10, 20, 30],
        on: [15, 25, 35],
      }),
      sha256Hex: sha256,
    });

    const result = artifact.attributionByAtrium.LA[0];
    expect(result.status).toBe("matched");
    expect(result.measuredWindowByMode).toEqual({
      off: {
        status: "resolved",
        startPhaseSec: 0,
        endPhaseSec: 0.4,
        reason: null,
      },
      on: {
        status: "resolved",
        startPhaseSec: 0.05,
        endPhaseSec: 0.45,
        reason: null,
      },
    });
    expect(result.commonVolumeOverlapM3).toEqual({ minimum: 15, maximum: 30 });
    expect(result.matchedGrid.map((point) => point.normalizedCommonVolume01))
      .toEqual([0, 0.5, 1]);
    expect(result.matchedGrid.map((point) => point.volumeM3))
      .toEqual([15, 22.5, 30]);
    for (const point of result.matchedGrid) {
      expect(point.deltaTotalAbsolutePressurePa).toBeCloseTo(-1, 12);
      expect(point.deltaPressurePaByOwner).toEqual({
        equilibriumPassive: 0,
        activeLand: -4,
        slsOverstress: 3,
        commonExternal: 0,
      });
      expect(point.deltaComponentSumPa).toBeCloseTo(-1, 12);
      expect(point.deltaReconstructionResidualPa).toBeCloseTo(0, 12);
      expect(point.byMode.off.reconstructionResidualPa).toBeCloseTo(0, 12);
      expect(point.byMode.on.reconstructionResidualPa).toBeCloseTo(0, 12);
    }
    expect(result.mathematicalIntegrityGatePass).toBe(true);
    expect(artifact.gateAudit).toMatchObject({
      inputInventoryComplete: true,
      allInputValuesFinite: true,
      allRequiredBranchesSufficient: true,
      allRequiredBranchesStrictlyMonotone: true,
      allExpectedVolumeDirectionsSatisfied: true,
      allRequiredPhasesHaveCommonVolumeOverlap: true,
      allPressureReconstructionsPass: true,
      artifactIntegrityGatePass: true,
      pressureDeltaSignUsedAsAcceptanceGate: false,
      pvTopologyUsedAsAcceptanceGate: false,
    });
    expect(artifact.sourceProvenanceAuthenticationStatus)
      .toBe("unverified-reference-only");
    expect(artifact.claimBoundary).toMatchObject({
      sourceObservationsAuthenticatedByThisModule: false,
      serializedRoundTripIsAuthentication: false,
      upstreamObservationAuthenticationMustBeEstablishedSeparately: true,
      pressureDeltaSignUsedAsAcceptanceGate: false,
      pvTopologyUsedAsAcceptanceGate: false,
      slsOffFigureEightTopologyRequired: false,
      slsCausalityEstablished: false,
    });
    expect(Object.isFrozen(artifact)).toBe(true);
    expect(Object.isFrozen(result.matchedGrid)).toBe(true);

    const same = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: pairedSeries(analysisManifest, {
        off: [10, 20, 30],
        on: [15, 25, 35],
      }),
      sha256Hex: sha256,
    });
    expect(same).toEqual(artifact);
  });

  it("reports a non-monotone or direction-mismatched phase as ambiguous without a topology or sign gate", () => {
    const analysisManifest = manifest([reservoirWindow()], 5);
    const nonmonotone = pairedSeries(analysisManifest, {
      off: [10, 20, 30],
      on: [15, 25, 20],
    });
    const ambiguous = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: nonmonotone,
      sha256Hex: sha256,
    });
    const result = ambiguous.attributionByAtrium.LA[0];

    expect(result).toMatchObject({
      status: "ambiguous",
      commonVolumeOverlapM3: null,
      matchedGrid: [],
      mathematicalIntegrityGatePass: false,
      pressureDeltaSignUsedAsAcceptanceGate: false,
      pvTopologyUsedAsAcceptanceGate: false,
    });
    expect(result.reasons).toContain("on-volume-not-strict-monotone");
    expect(ambiguous.gateAudit.allRequiredBranchesStrictlyMonotone).toBe(false);
    expect(ambiguous.gateAudit.artifactIntegrityGatePass).toBe(false);

    const directionMismatch = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: pairedSeries(analysisManifest, {
        off: [10, 20, 30],
        on: [35, 25, 15],
      }),
      sha256Hex: sha256,
    });
    expect(directionMismatch.attributionByAtrium.LA[0].status).toBe("ambiguous");
    expect(directionMismatch.attributionByAtrium.LA[0].reasons)
      .toContain("on-volume-direction-mismatch");
  });

  it("reports insufficient samples and no common volume overlap without fabricating a grid", () => {
    const analysisManifest = manifest([reservoirWindow()], 3);
    const insufficientSeries = pairedSeries(analysisManifest, {
      off: [10],
      on: [15, 25],
    });
    const insufficient = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: insufficientSeries,
      sha256Hex: sha256,
    });
    expect(insufficient.attributionByAtrium.LA[0]).toMatchObject({
      status: "insufficient-samples",
      reasons: ["off-insufficient-samples"],
      commonVolumeOverlapM3: null,
      matchedGrid: [],
    });
    expect(insufficient.gateAudit.allRequiredBranchesSufficient).toBe(false);

    const noOverlap = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: pairedSeries(analysisManifest, {
        off: [1, 2],
        on: [3, 4],
      }),
      sha256Hex: sha256,
    });
    expect(noOverlap.attributionByAtrium.LA[0]).toMatchObject({
      status: "no-overlap",
      reasons: ["no-common-volume-overlap"],
      commonVolumeOverlapM3: null,
      matchedGrid: [],
      mathematicalIntegrityGatePass: false,
    });
    expect(noOverlap.gateAudit.allRequiredPhasesHaveCommonVolumeOverlap)
      .toBe(false);
  });

  it("keeps unresolved measured boundaries as an explicit empty-series result", () => {
    const analysisManifest = manifest([reservoirWindow()], 3);
    const series = pairedSeries(analysisManifest, {
      off: [10, 20, 30],
      on: [15, 25, 35],
    });
    const unresolvedReason =
      "functional-av-main-positive-flow-lobe-not-unique";
    const unresolvedSeries: PhaseB1PairedAtrialPressureSeriesByModeV1 = {
      ...series,
      on: {
        ...series.on,
        LA: [{
          ...series.on.LA[0],
          boundaryResolution: {
            status: "unresolved",
            startPhaseSec: null,
            endPhaseSec: null,
            reason: unresolvedReason,
          },
          samples: [],
        }],
      },
    };
    const artifact =
      buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
        analysisManifest,
        sourceProvenanceByMode: provenance(),
        seriesByMode: unresolvedSeries,
        sha256Hex: sha256,
      });
    const result = artifact.attributionByAtrium.LA[0];

    expect(result).toMatchObject({
      status: "insufficient-samples",
      reasons: ["on-insufficient-samples"],
      commonVolumeOverlapM3: null,
      matchedGrid: [],
      measuredWindowByMode: {
        on: {
          status: "unresolved",
          startPhaseSec: null,
          endPhaseSec: null,
          reason: unresolvedReason,
        },
      },
      mathematicalIntegrityGatePass: false,
    });
    expect(artifact.gateAudit.allRequiredBranchesSufficient).toBe(false);
    expect(artifact.gateAudit.artifactIntegrityGatePass).toBe(false);
  });

  it("keeps reconstruction residuals observable and fails only the mathematical audit", () => {
    const analysisManifest = manifest([reservoirWindow()], 3);
    const series = pairedSeries(analysisManifest, {
      off: [10, 20, 30],
      on: [15, 25, 35],
    });
    const first = series.on.LA[0].samples[0];
    const closeSeries = replaceModeAtriumFirstSample(series, "on", "LA", {
      ...first,
      totalAbsolutePressurePa: first.totalAbsolutePressurePa + 0.05,
    });
    const closeArtifact = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: closeSeries,
      sha256Hex: sha256,
    });
    expect(closeArtifact.attributionByAtrium.LA[0].branchByMode.on
      .maximumAbsoluteSourceReconstructionResidualPa).toBeCloseTo(0.05, 12);
    expect(closeArtifact.attributionByAtrium.LA[0].reconstructionAudit
      .sourceAndMatchedReconstructionPass).toBe(true);
    expect(closeArtifact.gateAudit.artifactIntegrityGatePass).toBe(true);

    const badSeries = replaceModeAtriumFirstSample(series, "on", "LA", {
      ...first,
      totalAbsolutePressurePa: first.totalAbsolutePressurePa + 2,
    });
    const artifact = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: badSeries,
      sha256Hex: sha256,
    });
    const result = artifact.attributionByAtrium.LA[0];

    expect(result.status).toBe("matched");
    expect(result.branchByMode.on.maximumAbsoluteSourceReconstructionResidualPa)
      .toBeCloseTo(2, 12);
    expect(result.reconstructionAudit.maximumAbsoluteDeltaResidualPa)
      .toBeGreaterThan(0);
    expect(result.reconstructionAudit.sourceAndMatchedReconstructionPass).toBe(false);
    expect(result.mathematicalIntegrityGatePass).toBe(false);
    expect(artifact.gateAudit.allPressureReconstructionsPass).toBe(false);
    expect(artifact.gateAudit.artifactIntegrityGatePass).toBe(false);
  });

  it("rejects incomplete, non-finite, and unauditable inputs and treats serialization as integrity only", () => {
    const analysisManifest = manifest([reservoirWindow()], 3);
    const series = pairedSeries(analysisManifest, {
      off: [10, 20, 30],
      on: [15, 25, 35],
    });
    expect(() => buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: { off: series.off, on: { LA: series.on.LA } } as never,
      sha256Hex: sha256,
    })).toThrow(/must contain exactly/i);
    expect(() => buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: replaceModeAtriumFirstSample(series, "off", "LA", {
        ...series.off.LA[0].samples[0],
        volumeM3: Number.NaN,
      }),
      sha256Hex: sha256,
    })).toThrow(/must be finite/i);
    expect(() => buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: {
        ...provenance(),
        on: { sourceArtifactId: "on-run", sourceContentSha256: "not-a-hash" },
      },
      seriesByMode: series,
      sha256Hex: sha256,
    })).toThrow(/lowercase 64-hex/i);

    const artifact = buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      analysisManifest,
      sourceProvenanceByMode: provenance(),
      seriesByMode: series,
      sha256Hex: sha256,
    });
    const serialized = serializePhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1(
      artifact,
      sha256,
    );
    expect(serialized.endsWith("\n")).toBe(true);
    expect(JSON.parse(serialized)).toEqual(artifact);
    expect(artifact.claimBoundary.serializedRoundTripIsAuthentication).toBe(false);
    expect(() => serializePhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
      ...artifact,
      contentSha256: "0".repeat(64),
    }, sha256)).toThrow(/does not match/i);
  });
});

function reservoirWindow(): PhaseB1AtrialMatchedVolumePhaseWindowV1 {
  return {
    phaseId: "reservoir-mvc-to-mvo",
    role: "reservoir",
    startBoundary: "MVC",
    endBoundary: "MVO",
    expectedVolumeDirection: "increasing",
  };
}

function manifest(
  phaseWindows: readonly PhaseB1AtrialMatchedVolumePhaseWindowV1[],
  normalizedGridPointCount: number,
) {
  return buildPhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1({
    phaseWindows,
    normalizedGridPointCount,
    reconstructionAbsoluteTolerancePa: 0.1,
    reconstructionRelativeTolerance: 1e-12,
    sha256Hex: sha256,
  });
}

function pairedSeries(
  analysisManifest: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
  volumes: Readonly<{ off: readonly number[]; on: readonly number[] }>,
): PhaseB1PairedAtrialPressureSeriesByModeV1 {
  const phases = (mode: "off" | "on"): readonly PhaseB1AtrialPressurePhaseSeriesV1[] =>
    analysisManifest.phaseWindows.map((window) => ({
      phaseId: window.phaseId,
      startBoundary: window.startBoundary,
      endBoundary: window.endBoundary,
      boundaryResolution: {
        status: "resolved" as const,
        startPhaseSec: mode === "off" ? 0 : 0.05,
        endPhaseSec: mode === "off" ? 0.4 : 0.45,
        reason: null,
      },
      samples: volumes[mode].map((volumeM3, index) => sample(
        (mode === "off" ? 0 : 0.05)
          + (index + 1) * 0.4
            / (volumes[mode].length + 1),
        volumeM3,
        mode,
      )),
    }));
  return {
    off: { LA: phases("off"), RA: phases("off") },
    on: { LA: phases("on"), RA: phases("on") },
  };
}

function sample(
  phaseSec: number,
  volumeM3: number,
  mode: "off" | "on",
): PhaseB1AtrialPressureAttributionSampleV1 {
  const pressureComponentsPa = {
    equilibriumPassive: 2 * volumeM3,
    activeLand: mode === "off" ? 10 : 6,
    slsOverstress: mode === "off" ? 0 : 3,
    commonExternal: 5,
  };
  return {
    phaseSec,
    volumeM3,
    totalAbsolutePressurePa: Object.values(pressureComponentsPa)
      .reduce((sum, value) => sum + value, 0),
    pressureComponentsPa,
  };
}

function replaceModeAtriumFirstSample(
  series: PhaseB1PairedAtrialPressureSeriesByModeV1,
  mode: "off" | "on",
  atriumId: "LA" | "RA",
  replacement: PhaseB1AtrialPressureAttributionSampleV1,
): PhaseB1PairedAtrialPressureSeriesByModeV1 {
  const phases = series[mode][atriumId];
  return {
    ...series,
    [mode]: {
      ...series[mode],
      [atriumId]: [{
        ...phases[0],
        samples: [replacement, ...phases[0].samples.slice(1)],
      }],
    },
  };
}

function provenance() {
  return {
    off: { sourceArtifactId: "paired-run-off", sourceContentSha256: "a".repeat(64) },
    on: { sourceArtifactId: "paired-run-on", sourceContentSha256: "b".repeat(64) },
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
