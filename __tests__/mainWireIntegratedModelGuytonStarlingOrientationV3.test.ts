import { describe, expect, it } from "vitest";

import {
  guytonStarlingAxisLabelsV3,
  guytonStarlingPlotDomainV3,
  structuralReturnOrientationFromPayloadV3,
} from "@/components/workbench/v3/GuytonStarlingOrientationCanvasV3";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3,
  MAIN_WIRE_INTEGRATED_MODEL_STRUCTURAL_RETURN_SEMANTICS_V3,
  buildMainWireIntegratedModelGuytonStarlingOrientationV3,
} from "@/analysis/methods/mainWire/MainWireGuytonStarlingOrientationV3";
import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_LOW_FLOW_TARGET_L_PER_MIN_V3,
  mainWireIntegratedModelStarlingDescendingLimbV3,
  runMainWireIntegratedModelResponsiveStarlingProtocolV3,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";

describe("Main Wire Integrated V3 Guyton / Starling side analysis", () => {
  it("confirms a high-volume descending limb only after two sustained drops", () => {
    const points = [
      [8, 5.5],
      [12, 5.8],
      [16, 5.72],
      [22, 5.55],
    ].map(([fillingPressureMmHg, cardiacOutputLPerMin]) => ({
      fillingPressureMmHg: fillingPressureMmHg!,
      cardiacOutputLPerMin: cardiacOutputLPerMin!,
      curveEligible: true,
    }));

    expect(mainWireIntegratedModelStarlingDescendingLimbV3(points)).toEqual({
      peakPressureMmHg: 12,
      firstDecliningPressureMmHg: 16,
      confirmedDecliningPressureMmHg: 22,
    });
    expect(
      mainWireIntegratedModelStarlingDescendingLimbV3(points.slice(0, 3)),
    ).toBeNull();
  });

  it("fails closed before an exact accepted-step readback exists", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const result = buildMainWireIntegratedModelGuytonStarlingOrientationV3(
      session.observe(),
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    );

    expect(result).toMatchObject({
      status: "accepted-step-readback-required",
      sourceAcceptedRevision: 0,
      sourceAcceptedTimeSec: 0,
      right: null,
      left: null,
    });
  });

  it("builds read-only structural return orientations without inventing a Starling locus", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const advanced = session.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(1),
    );
    expect(advanced.status).toBe("advanced");
    const acceptedBefore = session.currentAcceptedState();
    const result = buildMainWireIntegratedModelGuytonStarlingOrientationV3(
      session.observe(),
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    );

    expect(session.currentAcceptedState()).toBe(acceptedBefore);
    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error("analysis unavailable");
    expect(result.sourceAcceptedRevision).toBe(acceptedBefore.revision);
    expect(result.sourceAcceptedTimeSec).toBe(acceptedBefore.acceptedTimeSec);
    expect(structuralReturnOrientationFromPayloadV3(result, "right")).toBe(
      result.right,
    );
    expect(structuralReturnOrientationFromPayloadV3(result, "left")).toBe(
      result.left,
    );
    expect(
      structuralReturnOrientationFromPayloadV3(
        { status: "available" },
        "right",
      ),
    ).toBeNull();
    for (const orientation of [result.right, result.left]) {
      expect(orientation.semantics).toBe(
        MAIN_WIRE_INTEGRATED_MODEL_STRUCTURAL_RETURN_SEMANTICS_V3,
      );
      expect(orientation.curve).toHaveLength(121);
      expect(
        orientation.curve.every(
          (point) =>
            Number.isFinite(point.downstreamPressureMmHg) &&
            Number.isFinite(point.returnFlowLPerMin) &&
            point.returnFlowLPerMin >= 0,
        ),
      ).toBe(true);
      for (let index = 1; index < orientation.curve.length; index += 1) {
        expect(orientation.curve[index]!.returnFlowLPerMin).toBeLessThanOrEqual(
          orientation.curve[index - 1]!.returnFlowLPerMin + 1e-8,
        );
      }
      expect(orientation.curve.at(-1)?.returnFlowLPerMin).toBe(0);
      expect(orientation.starlingLocus).toEqual({
        status: "requires-protocol",
        requirement:
          MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3,
        points: [],
      });
      expect(orientation.limitations.join(" ")).toContain(
        "independent fixed-TBV V3 fixture forks",
      );
    }
  });

  it("focuses the plot through the structural zero-flow intercept", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const advanced = session.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(1),
    );
    expect(advanced.status).toBe("advanced");
    const result = buildMainWireIntegratedModelGuytonStarlingOrientationV3(
      session.observe(),
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    );
    if (result.status !== "available") throw new Error("analysis unavailable");
    const domain = guytonStarlingPlotDomainV3(result.right);

    expect(domain.flowMinimumLPerMin).toBe(0);
    expect(domain.flowMaximumLPerMin).toBeGreaterThan(
      Math.max(
        ...result.right.curve.map(({ returnFlowLPerMin }) => returnFlowLPerMin),
      ),
    );
    expect(domain.pressureMinimumMmHg).toBeLessThan(
      result.right.curve[0]!.downstreamPressureMmHg,
    );
    expect(domain.pressureMaximumMmHg).toBeGreaterThan(
      result.right.fillingPressureMmHg,
    );
    expect(domain.pressureMaximumMmHg).toBeLessThan(
      result.right.curve.at(-1)!.downstreamPressureMmHg,
    );
  });

  it("measures an isolated responsive Starling preview without advancing the source", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    let advanced = session.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(1),
    );
    for (let ordinal = 2; ordinal <= 500; ordinal += 1) {
      advanced = session.advanceToPresentationTime(
        mainWireIntegratedModelPresentationTargetTimeSecV3(ordinal),
      );
      if (advanced.status !== "advanced") break;
    }
    expect(advanced.status).toBe("advanced");
    const acceptedBefore = session.currentAcceptedState();

    const progress: Awaited<ReturnType<
      typeof runMainWireIntegratedModelResponsiveStarlingProtocolV3
    >>[] = [];
    const starling = runMainWireIntegratedModelResponsiveStarlingProtocolV3(
      session,
      (partial) => progress.push(partial),
    );
    const result = buildMainWireIntegratedModelGuytonStarlingOrientationV3(
      session.observe(),
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      { right: starling.right, left: starling.left },
    );

    expect(session.currentAcceptedState()).toBe(acceptedBefore);
    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error("analysis unavailable");
    expect(structuralReturnOrientationFromPayloadV3(result, "right")).toBe(
      result.right,
    );
    expect(structuralReturnOrientationFromPayloadV3(result, "left")).toBe(
      result.left,
    );
    for (const orientation of [result.right, result.left]) {
      const locus = orientation.starlingLocus;
      expect(locus.status).toBe("responsive-fixed-tbv-preview");
      if (locus.status !== "responsive-fixed-tbv-preview") {
        throw new Error("responsive Starling preview unavailable");
      }
      expect(locus.points.length).toBeGreaterThanOrEqual(6);
      expect(locus.completedPointCount).toBe(locus.points.length);
      expect(locus.totalPointCount).toBeGreaterThanOrEqual(
        locus.completedPointCount,
      );
      expect(
        locus.points.filter(({ role }) => role === "operating-anchor"),
      ).toHaveLength(1);
      expect(
        locus.points.find(({ role }) => role === "operating-anchor"),
      ).toMatchObject({
        settled: true,
        evidence: "responsive-settled-anchor",
        measurementWindowStatus: "responsive-period1-settled",
      });
      expect(
        locus.points.filter(({ role }) => role === "continuation").every(
          (point) =>
            Number.isFinite(point.fillingPressureMmHg) &&
            Number.isFinite(point.cardiacOutputLPerMin) &&
            Number.isFinite(point.acceptedMeasurementDurationSec) &&
            point.acceptedMeasurementDurationSec > 0 &&
            point.acceptedMeasurementDurationSec <= 36 &&
            point.completedBeatCount >= 3 &&
            point.completedBeatCount <= 20 &&
            point.ventricularPressureVolumeLoop.length >= 12 &&
            point.ventricularPressureVolumeLoop.every((sample) =>
              Number.isFinite(sample.volumeMl) &&
              Number.isFinite(sample.pressureMmHg)) &&
            Object.values(
              point.ventricularPressureVolumeLandmarks.endDiastolic,
            ).every((value) =>
              typeof value !== "number" || Number.isFinite(value)) &&
            Object.values(
              point.ventricularPressureVolumeLandmarks.endSystolic,
            ).every((value) =>
              typeof value !== "number" || Number.isFinite(value)) &&
            (point.measurementWindowStatus === "complete-beat-converged" ||
              point.measurementWindowStatus === "complete-beat-preview" ||
              point.measurementWindowStatus === "complete-beat-cap" ||
              point.measurementWindowStatus === "period-2-detected") &&
            point.finiteAndFixedTbvPassed &&
            point.settled === false,
        ),
      ).toBe(true);
      const curveEligible = locus.points.filter(
        ({ curveEligible }) => curveEligible,
      );
      expect(
        Math.min(
          ...curveEligible.map(
            ({ totalBloodVolumeMl }) =>
              totalBloodVolumeMl /
              acceptedBefore.coronary.fixedGlobalTotalBloodVolumeMl,
          ),
        ),
      ).toBeLessThanOrEqual(0.5);
      expect(
        Math.min(
          ...curveEligible.map(
            ({ cardiacOutputLPerMin }) => cardiacOutputLPerMin,
          ),
        ),
      ).toBeLessThanOrEqual(
        MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_LOW_FLOW_TARGET_L_PER_MIN_V3,
      );
      const anchor = locus.points.find(
        ({ role }) => role === "operating-anchor",
      );
      expect(anchor).toBeDefined();
      expect(orientation.anchoring.status).toBe("starling-operating-anchor");
      expect(orientation.operatingPoint).toMatchObject({
        downstreamPressureMmHg: anchor!.fillingPressureMmHg,
        returnFlowLPerMin: anchor!.cardiacOutputLPerMin,
      });
      expect(orientation.curve).toContainEqual(
        expect.objectContaining({
          downstreamPressureMmHg: anchor!.fillingPressureMmHg,
          returnFlowLPerMin: anchor!.cardiacOutputLPerMin,
        }),
      );
      if (orientation.anchoring.status === "starling-operating-anchor") {
        expect(Math.abs(orientation.anchoring.volumeResidualMl)).toBeLessThan(
          1e-3,
        );
      }
      const plotDomain = guytonStarlingPlotDomainV3(orientation);
      expect(plotDomain.flowMinimumLPerMin).toBe(0);
      expect(plotDomain.flowMaximumLPerMin).toBeGreaterThan(
        Math.max(
          ...curveEligible.map(
            ({ cardiacOutputLPerMin }) => cardiacOutputLPerMin,
          ),
        ),
      );
      expect(plotDomain.pressureMinimumMmHg).toBeLessThanOrEqual(
        orientation.side === "right" ? -3 : -2,
      );
      expect(plotDomain.pressureMinimumMmHg).toBeGreaterThan(-8);
      expect(guytonStarlingAxisLabelsV3(orientation.side)).toEqual({
        horizontal:
          orientation.side === "right"
            ? "CVP / mean RAP (mmHg)"
            : "Mean LAP (PCWP surrogate) (mmHg)",
        vertical: "CO / venous return (L/min)",
      });
    }
    const leftPlotDomain = guytonStarlingPlotDomainV3(result.left);
    expect(leftPlotDomain.flowMaximumLPerMin).toBeLessThan(
      Math.max(
        ...result.left.curve.map(({ returnFlowLPerMin }) => returnFlowLPerMin),
      ),
    );
    expect(progress).toHaveLength(starling.right.points.length);
    expect(
      progress.map(({ right }) =>
        right.status === "responsive-fixed-tbv-preview"
          ? right.completedPointCount
          : -1,
      ),
    ).toEqual(
      Array.from(
        { length: starling.right.points.length },
        (_, index) => index + 1,
      ),
    );
  }, 60_000);
});
