import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PHASE_SEMANTICS_V1,
  buildPhaseB1PairedAtrialMatchedVolumeTerminalObservationAdapterV1,
  selectPhaseB1AtrialPressureCircularWindowV1,
} from "@/tools/myocardium/phaseB1PairedAtrialMatchedVolumePressureAttributionAdapterV1";
import {
  buildPhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
  type PhaseB1AtrialPressureAttributionSampleV1,
} from "@/tools/myocardium/phaseB1PairedAtrialMatchedVolumePressureAttributionV1";

describe("Phase B1 paired atrial matched-volume terminal-observation adapter", () => {
  it("linearly interpolates exact wrapped boundaries without breaking owner reconstruction", () => {
    const completeCycle = [
      sample(0, 0),
      sample(0.25, 1),
      sample(0.5, 2),
      sample(0.75, 1),
      sample(1, 0),
    ];
    const selected = selectPhaseB1AtrialPressureCircularWindowV1({
      completeCycle,
      startPhaseSec: 0.6,
      endPhaseSec: 1.1,
      cycleLengthSec: 1,
    });

    expect(selected.map((point) => point.phaseSec))
      .toEqual([0.6, 0.75, 1, 1.1]);
    expect(selected[0].volumeM3).toBeCloseTo(1.6, 14);
    expect(selected.at(-1)?.volumeM3).toBeCloseTo(0.4, 14);
    for (const point of selected) {
      expect(point.totalAbsolutePressurePa).toBeCloseTo(
        Object.values(point.pressureComponentsPa).reduce(
          (sum, component) => sum + component,
          0,
        ),
        14,
      );
    }
    expect(Object.isFrozen(selected)).toBe(true);
    expect(Object.isFrozen(selected[0])).toBe(true);
  });

  it("requires builder-issued observations and uses direct same-time-level SLS ownership", () => {
    const manifest =
      buildPhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1({
        phaseWindows:
          PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PHASE_SEMANTICS_V1,
        normalizedGridPointCount: 21,
        reconstructionAbsoluteTolerancePa: 1e-6,
        reconstructionRelativeTolerance: 1e-12,
        sha256Hex: sha256,
      });
    expect(() =>
      buildPhaseB1PairedAtrialMatchedVolumeTerminalObservationAdapterV1({
        analysisManifest: manifest,
        slsOffTerminalObservation: Object.freeze({}) as never,
        slsOnTerminalObservation: Object.freeze({}) as never,
        sha256Hex: sha256,
      })).toThrow(/builder-issued/i);

    const source = readFileSync(
      new URL(
        "../tools/myocardium/phaseB1PairedAtrialMatchedVolumePressureAttributionAdapterV1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).toContain("evaluatePhaseB1EventFreeEndpointV1(");
    expect(source).toContain(
      "const slsOverstress = gamma * wall.slsOverstressPa;",
    );
    expect(source).toContain(
      "const activeLand = gamma * wall.activeKirchhoffStressPa;",
    );
    expect(source).not.toContain(
      "const slsOverstress = totalAbsolutePressurePa",
    );
    expect(source).not.toContain("observation.terminalObservationGatePass");
    expect(source).toContain(
      "phaseBoundaryResolutionIndependentOfGlobalTerminalObservationGate",
    );
    expect(source).toContain(
      "functional-boundary-cyclic-order-unresolved",
    );
    expect(source).toContain("unresolvedPhaseSeries(semantic, boundary.reason)");
    expect(source).toContain("mainLobe.positiveLobeCount !== 1");
  });
});

function sample(
  phaseSec: number,
  value: number,
): PhaseB1AtrialPressureAttributionSampleV1 {
  return Object.freeze({
    phaseSec,
    volumeM3: value,
    totalAbsolutePressurePa: 10 * value,
    pressureComponentsPa: Object.freeze({
      equilibriumPassive: value,
      activeLand: 2 * value,
      slsOverstress: 3 * value,
      commonExternal: 4 * value,
    }),
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
