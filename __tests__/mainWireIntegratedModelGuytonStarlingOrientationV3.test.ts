import { describe, expect, it } from "vitest";

import {
  guytonStarlingPlotDomainV3,
  structuralReturnOrientationFromPayloadV3,
} from "@/components/workbench/v3/GuytonStarlingOrientationCanvasV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3,
  MAIN_WIRE_INTEGRATED_MODEL_STRUCTURAL_RETURN_SEMANTICS_V3,
  buildMainWireIntegratedModelGuytonStarlingOrientationV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";

describe("Main Wire Integrated V3 Guyton / Starling side analysis", () => {
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
    expect(structuralReturnOrientationFromPayloadV3(result, "right"))
      .toBe(result.right);
    expect(structuralReturnOrientationFromPayloadV3(result, "left"))
      .toBe(result.left);
    expect(structuralReturnOrientationFromPayloadV3({ status: "available" }, "right"))
      .toBeNull();
    for (const orientation of [result.right, result.left]) {
      expect(orientation.semantics).toBe(
        MAIN_WIRE_INTEGRATED_MODEL_STRUCTURAL_RETURN_SEMANTICS_V3,
      );
      expect(orientation.curve).toHaveLength(121);
      expect(orientation.curve.every((point) =>
        Number.isFinite(point.downstreamPressureMmHg)
        && Number.isFinite(point.returnFlowLPerMin)
        && point.returnFlowLPerMin >= 0)).toBe(true);
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

  it("keeps both structural and future qualified protocol points inside the plot domain", async () => {
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
      Math.max(...result.right.curve.map(({ returnFlowLPerMin }) =>
        returnFlowLPerMin)),
    );
    expect(domain.pressureMinimumMmHg).toBeLessThan(
      result.right.curve[0]!.downstreamPressureMmHg,
    );
    expect(domain.pressureMaximumMmHg).toBeGreaterThan(
      result.right.curve.at(-1)!.downstreamPressureMmHg,
    );
  });
});
