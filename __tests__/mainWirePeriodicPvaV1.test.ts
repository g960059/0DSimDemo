import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type {
  MainWireIntegratedModelPressureVolumeLoopPointV3,
  MainWireIntegratedModelStarlingLocusV3,
  MainWireIntegratedModelStarlingPointV3,
} from "@/analysis/methods/mainWire/MainWireGuytonStarlingOrientationV3";
import {
  buildMainWirePeriodicPvaMethodV8,
  buildMainWirePeriodicPvaMethodV9,
  buildMainWirePeriodicPvaMethodV10,
  buildMainWirePeriodicPvaMethodV13,
  buildMainWireSystolicPressureEnvelopeV1,
  buildMainWireDiastolicLoadRelationV1,
  mainWirePvaLowVolumeTangentPressureV1,
  MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
  MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID,
  MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID,
  MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import { evaluateMainWireIntegratedModelLvMvo2EstimateV1 } from "@/analysis/methods/mainWire/MainWireMvo2ReferenceV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_ABSOLUTE_TBV_ML_V3,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3,
  mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3,
  mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  PressureVolumeLoopCanvasV3,
  retainWorkbenchPvRelationDrawingV3,
  workbenchPvMeasuredHighLoadPointsV1,
  drawWorkbenchPvHighLoadIsochroneV1,
  drawWorkbenchPvaAreasV1,
  drawWorkbenchDiastolicLoadRelationV1,
  drawWorkbenchSystolicLoadRelationV1,
} from "@/components/workbench/presentation/PressureVolumeLoopCanvasV3";
import {
  materializeWorkbenchOutputPresentationItemsV3,
  workbenchPeriodicPvaOutputValueV3,
} from "@/components/workbench/WorkbenchItemPresentation";
import { createDefaultExperimentSurfaceV3 } from "@/components/workbench/WorkbenchSurfaceV3";
import { loadStudioLocalAlgebraicPulmonaryRootClientCompositionV1 } from "@/studio/composition/StudioDefaultCompositionV2";
import { MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1, resolveMainWireAnalysisMethodsForSurfaceV1 } from
  "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import currentStandard70Surface from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import * as canvasRuntime from "@/components/workbench/presentation/WorkbenchCanvasRuntimeV3";

describe("settled hot-start PVA V1", () => {
  it("keeps the analytic tangent root exact without clipping real pressure differences", () => {
    // RV baseline from the information-spaced low-load sweep. The affine
    // expression alone evaluates to +2.22e-16 mmHg at its own known root.
    const extension = {
      measuredStartVolumeMl: 29.45630621636632,
      measuredStartPressureMmHg: 0.8997857804533416,
      slopeMmHgPerMl: 0.16209420877467579,
      zeroPressureVolumeMl: 23.905301111032067,
    };
    const pressure = (v: number) => mainWirePvaLowVolumeTangentPressureV1(extension, v);
    expect(pressure(extension.zeroPressureVolumeMl)).toBe(0);
    expect(pressure(extension.zeroPressureVolumeMl - 1e-9)).toBeLessThan(0);
    expect(pressure(extension.zeroPressureVolumeMl + 1e-9)).toBeGreaterThan(0);
    expect(pressure(extension.measuredStartVolumeMl)).toBe(extension.measuredStartPressureMmHg);
    expect(pressure(25)).toBe(extension.measuredStartPressureMmHg
      + extension.slopeMmHgPerMl * (25 - extension.measuredStartVolumeMl));
  });
  it.each([
    "suga-pva-common-isochrone-owner-with-separate-end-ejection-load-response-display-v11",
    "suga-pva-common-isochrone-owner-with-full-load-pressure-envelope-display-v12",
  ])("rejects the retired, unpublished derivation %s rather than silently reinterpreting it", (retiredId) => {
    const retired = { ...currentStandard70Surface, derivedOutputCatalog: currentStandard70Surface.derivedOutputCatalog.map((output) => ({
      ...output, derivationId: retiredId, requiredCapabilities: output.requiredCapabilities.map((capability) =>
        capability.replace(MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID, retiredId)),
    })) };
    expect(() => resolveMainWireAnalysisMethodsForSurfaceV1(retired)).toThrow(/Client does not support analysis derivation/);
    expect(resolveMainWireAnalysisMethodsForSurfaceV1(currentStandard70Surface).periodicPvaDerivation?.methodId)
      .toBe(MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID);
  });
  it("draws the first two-load envelope before an EDPVR fit exists, without dereferencing a missing intercept", () => {
    const context = new Proxy({ measureText: () => ({ width: 20 }) }, {
      get: (target, key) => key in target ? (target as any)[key] : vi.fn(),
    }) as unknown as CanvasRenderingContext2D;
    const hook = vi.spyOn(canvasRuntime, "useResponsiveCanvasFrameV3").mockImplementation((_root, _canvas, draw) => {
      draw(context, 600, 400);
    });
    try {
      const periodicPva = buildMainWirePeriodicPvaMethodV13(formalLocusV1(settledPointsV1([1, 1.08]), 9), "LV");
      expect(periodicPva.loadRelations?.diastolic?.sourcePointCount).toBe(2);
      expect(periodicPva.loadRelations?.systolic?.sourcePointCount).toBe(2);
      const traces = [{ scenarioId: "a", scenarioLabel: "A", chamberId: "LV", chamberLabel: "LV", samples: [],
        volumeOutputId: "LV.volume", pressureOutputId: "LV.pressure", pressureBasis: "transmural" as const,
        cyclePhaseOutputId: "phase", chamberColor: "#d9822b", periodicPva }];
      expect(() => renderToStaticMarkup(React.createElement(PressureVolumeLoopCanvasV3, { traces }))).not.toThrow();
    } finally { hook.mockRestore(); }
  });
  it.each(["LV", "RV"] as const)("separates %s display without changing any V10 numerical owner", (ventricle) => {
    const locus = formalLocusV1(settledPointsV1());
    const previous = buildMainWirePeriodicPvaMethodV10(locus, ventricle);
    const next = buildMainWirePeriodicPvaMethodV13(locus, ventricle);
    if (previous.status !== "available" || next.status !== "available") throw new Error("expected PVA");
    expect(next.methodId).toBe(MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID);
    for (const key of ["anchor", "strokeWork", "espvr", "edpvr", "potentialEnergy", "pva", "source", "limitations"] as const) {
      expect(JSON.stringify(next[key])).toBe(JSON.stringify(previous[key]));
    }
    // Only the derivation provenance changes in the literature projection.
    expect(JSON.stringify(next.estimatedMvo2).replaceAll(MAIN_WIRE_PERIODIC_PVA_METHOD_V13_ID, MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID))
      .toBe(JSON.stringify(previous.estimatedMvo2));
    expect(next.loadRelations?.diastolic?.segments.flat().map(({volumeMl, pressureMmHg}) => ({volumeMl, pressureMmHg})))
      .toEqual([...locus.points].sort((a,b) => a.totalBloodVolumeMl-b.totalBloodVolumeMl)
        .map((p) => ({volumeMl:p.ventricularPressureVolumeLandmarks.endDiastolic.volumeMl,
          pressureMmHg:p.ventricularPressureVolumeLandmarks.endDiastolic.pressureMmHg})));
    expect(next.loadRelations?.systolic?.sourcePointCount).toBe(locus.points.length);
    expect(previous).not.toHaveProperty("loadRelations");
    expect(previous).not.toHaveProperty("areaDisplay");
    const strip = next.areaDisplay!.potentialEnergyStrip;
    let area = 0;
    for (let i = 1; i < strip.length; i += 1) {
      const a = strip[i - 1]!, b = strip[i]!;
      area += 0.5 * (a.upperPressureMmHg - a.lowerPressureMmHg + b.upperPressureMmHg - b.lowerPressureMmHg)
        * (b.volumeMl - a.volumeMl);
    }
    expect(area).toBeCloseTo(next.potentialEnergy.mmHgMl, 9);
    expect(strip[0]!.volumeMl).toBe(next.potentialEnergy.leftIntersectionVolumeMl);
    expect(strip.at(-1)!.volumeMl).toBe(next.anchor.endSystolicVolumeMl);
    expect(next.areaDisplay!.strokeWorkLoop).toBe(locus.points.find((p) => p.role === "operating-anchor")!.ventricularPressureVolumeLoop);
    const context = Object.fromEntries(["save", "restore", "setLineDash", "beginPath", "closePath", "moveTo", "lineTo", "stroke", "arc", "fill", "clip"]
      .map((method) => [method, vi.fn()])) as unknown as CanvasRenderingContext2D;
    drawWorkbenchPvaAreasV1(context, next.areaDisplay!, (v) => v, (p) => 120 - p, "#d9822b", 1);
    expect(context.fill).toHaveBeenCalledTimes(1); // SW solid, PE separately hatched.
    expect(context.clip).toHaveBeenCalledTimes(1);
  });

  it("preserves the observed high-load diastolic fold, singleton previews, and negative pressures without fitting", () => {
    const source = settledPointsV1([1, 1.08, 1.16]);
    const coordinates = [[148.95244286, 20.95739991], [147.20279761, 22.79901673], [146.18417039, 26.44282295]];
    const points = source.map((p, i) => ({...p, ventricularPressureVolumeLandmarks:{...p.ventricularPressureVolumeLandmarks,
      endDiastolic:{...p.ventricularPressureVolumeLandmarks.endDiastolic, volumeMl:coordinates[i]![0]!,pressureMmHg:coordinates[i]![1]!}}}));
    const input = formalLocusV1(points);
    const before = JSON.stringify(input);
    const result = buildMainWireDiastolicLoadRelationV1(input)!;
    expect(result.segments[0]!.map((p) => [p.volumeMl, p.pressureMmHg])).toEqual(coordinates);
    expect(result.sourcePointCount).toBe(3);
    expect(result.displayExtrapolation).toBe("none");
    expect(JSON.stringify(input)).toBe(before);
    const context = Object.fromEntries(["save","restore","setLineDash","beginPath","moveTo","lineTo","stroke","arc","fill"]
      .map(method => [method,vi.fn()])) as unknown as CanvasRenderingContext2D;
    const fills: number[] = [], lines: number[] = [];
    vi.mocked(context.fill).mockImplementation(() => { fills.push(context.globalAlpha); });
    vi.mocked(context.stroke).mockImplementation(() => { lines.push(context.lineWidth); });
    drawWorkbenchDiastolicLoadRelationV1(context,result,v=>v,p=>p,"#d9822b",1,"#0b1720");
    expect(context.fill).toHaveBeenCalledTimes(3);
    expect(context.setLineDash).toHaveBeenCalledWith([4, 3]);
    expect(fills).toEqual([0.55, 0.55, 0.55]);
    expect(lines[0]).toBe(1.3);
    expect(context.strokeStyle).toBe("#0b1720");
    expect(vi.mocked(context.moveTo).mock.calls).toEqual([coordinates[0]!]);
    expect(vi.mocked(context.lineTo).mock.calls).toEqual(coordinates.slice(1));
    expect(vi.mocked(context.arc).mock.calls.map(([v,p])=>[v,p])).toEqual(coordinates);
    const first = {...points[0]!, ventricularPressureVolumeLandmarks:{...points[0]!.ventricularPressureVolumeLandmarks,
      endDiastolic:{...points[0]!.ventricularPressureVolumeLandmarks.endDiastolic,pressureMmHg:-1}}};
    const singleton = buildMainWireDiastolicLoadRelationV1(formalLocusV1([first], 9))!;
    expect(singleton.segments[0]![0]!.pressureMmHg).toBe(-1);
    expect(singleton.completionStatus).toBe("progressive");
  });

  it("does not bridge missing/unsettled or duplicate-TBV diastolic support", () => {
    const points = settledPointsV1([1, 1.08, 1.16]);
    const locus = formalLocusV1(points);
    const result = buildMainWireDiastolicLoadRelationV1({...locus, points: locus.points.map((p,i) =>
      i === 1 ? {...p, settled:false, curveEligible:false} : p)} as unknown as MainWireIntegratedModelStarlingLocusV3)!;
    expect(result.segments.map((run)=>run.length)).toEqual([1,1]);
    expect(result.excludedPointCount).toBe(1);
    const duplicate = buildMainWireDiastolicLoadRelationV1(formalLocusV1([points[0]!,points[1]!,points[1]!,points[2]!]))!;
    expect(duplicate.segments.map((run)=>run.length)).toEqual([1,1]);
    expect(duplicate.excludedPointCount).toBe(2);
  });

  it("does not choose the envelope clock from the operating anchor or closure landmark", () => {
    const points = settledPointsV1();
    const expected = buildMainWireSystolicPressureEnvelopeV1(formalLocusV1(points));
    const changed = points.map((p, index) => ({ ...p,
      role: index === 4 ? "operating-anchor" as const : "continuation" as const,
      ventricularPressureVolumeLandmarks: { ...p.ventricularPressureVolumeLandmarks,
        endSystolic: { volumeMl: 999, pressureMmHg: NaN, event: "minimum-volume-fallback" as const } },
    })).reverse();
    expect(buildMainWireSystolicPressureEnvelopeV1(formalLocusV1(changed))).toEqual(expected);
    const partial = buildMainWireSystolicPressureEnvelopeV1(formalLocusV1(points.slice(1), points.length))!;
    expect(partial.completionStatus).toBe("progressive");
    expect(partial.sourcePointCount).toBe(points.length - 1);
  });

  it("recovers Emax in an ideal isovolumic linear-elastance family, without extrapolation", () => {
    const points = isovolumicEnvelopePointsV1([40, 60, 80], [40, 80, 120]);
    const result = buildMainWireSystolicPressureEnvelopeV1(formalLocusV1(points))!;
    for (const p of result.segments.flat()) {
      expect(p.pressureMmHg).toBeCloseTo(2 * (p.volumeMl - 20), 10);
      expect(p.timeSinceAtrialCaptureSec).toBeCloseTo(0.2, 10);
    }
    expect(result.segments[0]![0]!.volumeMl).toBe(40);
    expect(result.segments[0]!.at(-1)!.volumeMl).toBe(80);
    expect(result.volumeDomain).toBe("observed-minimum-volume-range");
    expect(result.displayExtrapolation).toBe("none");
    expect(result.loadSupportPoints.map(({volumeMl, pressureMmHg}) => [volumeMl, pressureMmHg]))
      .toEqual([[40, 40], [60, 80], [80, 120]]);
    expect(result.loadSupportPoints.map((p) => p.minimumVolumeSourceTotalBloodVolumeMl))
      .toEqual(points.map((p) => p.totalBloodVolumeMl));
    const context = Object.fromEntries(["save","restore","setLineDash","beginPath","moveTo","lineTo","stroke","arc","fill"]
      .map(method => [method,vi.fn()])) as unknown as CanvasRenderingContext2D;
    const fills: number[] = [], lines: number[] = [];
    vi.mocked(context.fill).mockImplementation(() => { fills.push(context.globalAlpha); });
    vi.mocked(context.stroke).mockImplementation(() => { lines.push(context.lineWidth); });
    drawWorkbenchSystolicLoadRelationV1(context,result,v=>v,p=>p,"#d9822b",1,"#0b1720");
    expect(vi.mocked(context.arc).mock.calls.map(([v,p]) => [v,p])).toEqual([[40,40],[60,80],[80,120]]);
    expect(fills).toEqual([0.55, 0.55, 0.55]); // Per load, not per interpolation vertex.
    expect(context.setLineDash).toHaveBeenCalledWith([4, 3]);
    expect(lines[0]).toBe(1.3);
    expect(context.strokeStyle).toBe("#0b1720");
  });

  it("finds an interior load/time maximum rather than missing it on a coarse phase grid", () => {
    const points = isovolumicEnvelopePointsV1([10, 13], [0, 4]).map((p, i) => ({
      ...p, ventricularPressureVolumeLoop: i === 0
        ? [{ phase01: 0, volumeMl: 10, pressureMmHg: 0 },
          { phase01: 0.5, volumeMl: 11, pressureMmHg: 0 },
          { phase01: 0.9, volumeMl: 10, pressureMmHg: 0 }]
        : [{ phase01: 0, volumeMl: 13, pressureMmHg: 4 },
          { phase01: 0.5, volumeMl: 15, pressureMmHg: 12 },
          { phase01: 0.9, volumeMl: 13, pressureMmHg: 4 }],
    }));
    const result = buildMainWireSystolicPressureEnvelopeV1(formalLocusV1(points))!;
    const point = result.segments.flat().find((p) => p.volumeMl > 12)!;
    const v = point.volumeMl - 10;
    // P(u) = (v-u)(4+8u)/(3+u); dP/du has one interior maximum.
    const u = (-48 + Math.sqrt(2304 + 32 * (20 * v - 12))) / 16;
    expect(u).toBeGreaterThan(0); expect(u).toBeLessThan(1);
    expect(point.pressureMmHg).toBeCloseTo((v - u) * (4 + 8 * u) / (3 + u), 10);
    // At the second load's minimum V, the envelope can peak between retained
    // times and loads. Its dot is support provenance, not a raw ES landmark.
    expect(result.loadSupportPoints).toHaveLength(2);
    const support = result.loadSupportPoints[1]!;
    expect(support.volumeMl).toBe(13);
    expect(support.minimumVolumeSourceTotalBloodVolumeMl).toBe(points[1]!.totalBloodVolumeMl);
    expect(support.sourceTotalBloodVolumeRangeMl).toEqual(points.map((p) => p.totalBloodVolumeMl));
    expect(support.pressureMmHg).toBeGreaterThan(4);
    expect(support.pressureMmHg).toBeCloseTo(result.segments[0]!.at(-1)!.pressureMmHg, 10);
    // Subdividing the same linear paths cannot move this maximum.
    const subdivided = points.map((p) => ({ ...p,
      ventricularPressureVolumeLoop: p.ventricularPressureVolumeLoop.flatMap((a, i, loop) => {
        const b = loop[i + 1];
        return b ? [a, { phase01: (a.phase01 + b.phase01) / 2,
          volumeMl: (a.volumeMl + b.volumeMl) / 2, pressureMmHg: (a.pressureMmHg + b.pressureMmHg) / 2 }] : [a];
      }),
    }));
    const refined = buildMainWireSystolicPressureEnvelopeV1(formalLocusV1(subdivided))!;
    result.segments.flat().forEach((p, i) => expect(refined.segments.flat()[i]!.pressureMmHg).toBeCloseTo(p.pressureMmHg, 10));
  });

  it("uses higher loads and preserves a genuine descending envelope instead of forcing a textbook shape", () => {
    const points = isovolumicEnvelopePointsV1([40, 70, 60], [40, 80, 100]);
    const result = buildMainWireSystolicPressureEnvelopeV1(formalLocusV1(points))!;
    const curve = result.segments.flat();
    expect(Math.max(...curve.map((p) => p.pressureMmHg))).toBeGreaterThan(99);
    expect(curve.at(-1)!.volumeMl).toBe(70);
    expect(curve.at(-1)!.pressureMmHg).toBe(80);
    expect(result.sourcePointCount).toBe(3);
    expect(curve.some((p) => p.sourceTotalBloodVolumeRangeMl[1] === points[2]!.totalBloodVolumeMl)).toBe(true);
    expect(curve.slice(1).some((p, i) => p.pressureMmHg < curve[i]!.pressureMmHg)).toBe(true);
  });

  it.each(["missing-loop", "nonfinite", "duplicate-load", "unsettled"])("does not bridge %s observations", (problem) => {
    const source = formalLocusV1(settledPointsV1());
    if (source.status !== "measured-fixed-tbv-protocol") throw new Error("expected formal");
    const changed = structuredClone(source);
    const p = changed.points[4]! as any;
    if (problem === "missing-loop") p.ventricularPressureVolumeLoop = [];
    if (problem === "nonfinite") p.ventricularPressureVolumeLoop[0].pressureMmHg = NaN;
    if (problem === "duplicate-load") p.totalBloodVolumeMl = changed.points[3]!.totalBloodVolumeMl;
    if (problem === "unsettled") p.settled = false;
    const result = buildMainWireSystolicPressureEnvelopeV1(changed)!;
    expect(result.excludedPointCount).toBe(problem === "duplicate-load" ? 2 : 1);
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]!.at(-1)!.volumeMl).toBeLessThan(result.segments[1]![0]!.volumeMl);
    expect(result.sourcePointCount).toBe(source.points.length - result.excludedPointCount);
    expect(result.loadSupportPoints).toHaveLength(result.sourcePointCount);
    expect(result.loadSupportPoints.some((point) =>
      point.minimumVolumeSourceTotalBloodVolumeMl === p.totalBloodVolumeMl)).toBe(false);
    for (const point of result.loadSupportPoints) expect(result.segments.some((segment) =>
      point.volumeMl >= segment[0]!.volumeMl && point.volumeMl <= segment.at(-1)!.volumeMl)).toBe(true);
  });

  it("does not hide measured load relations when PVA timing is unavailable, and does not relabel them as its energy boundary", () => {
    const points = settledPointsV1().map((p) => ({ ...p, role: "continuation" as const }));
    const result = buildMainWirePeriodicPvaMethodV13(formalLocusV1(points), "RV");
    expect(result.status).toBe("unavailable");
    expect(result.loadRelations?.systolic?.sourcePointCount).toBe(points.length);
    expect(result.loadRelations?.diastolic?.sourcePointCount).toBe(points.length);
    expect(result.areaDisplay).toBeUndefined();
    const traces = [{ scenarioId: "a", scenarioLabel: "A", chamberId: "RV", chamberLabel: "RV",
      samples: [], volumeOutputId: "RV.volume", pressureOutputId: "RV.pressure", pressureBasis: "transmural" as const,
      cyclePhaseOutputId: "phase", chamberColor: "#d9822b", periodicPva: result }];
    const normal = renderToStaticMarkup(React.createElement(PressureVolumeLoopCanvasV3, { traces }));
    expect(normal).toContain('data-pv-envelope-source-point-count="9"');
    expect(normal).toContain('data-pv-relation-semantics="full-load-pressure-envelope-measured-diastolic-locus"');
    expect(normal).toContain('data-pva-result-count="0"');
    const energy = renderToStaticMarkup(React.createElement(PressureVolumeLoopCanvasV3, { traces, showPvaBoundary: true }));
    expect(energy).toContain('data-pv-envelope-source-point-count="0"');
    expect(energy).toContain('data-pva-drawing-count="0"');
    expect(energy).toContain('data-pv-energy-area-count="0"');
  });

  it("switches to the energy boundary without displaying both systolic definitions at once", () => {
    const result = buildMainWirePeriodicPvaMethodV13(formalLocusV1(settledPointsV1()), "LV");
    const traces = [{ scenarioId: "a", scenarioLabel: "A", chamberId: "LV", chamberLabel: "LV",
      samples: [], volumeOutputId: "LV.volume", pressureOutputId: "LV.pressure", pressureBasis: "transmural" as const,
      cyclePhaseOutputId: "phase", chamberColor: "#d9822b", periodicPva: result }];
    const normal = renderToStaticMarkup(React.createElement(PressureVolumeLoopCanvasV3, { traces }));
    const energy = renderToStaticMarkup(React.createElement(PressureVolumeLoopCanvasV3, { traces, showPvaBoundary: true }));
    expect(normal).toContain('data-pv-envelope-source-point-count="9"');
    expect(normal).toContain('data-pv-energy-area-count="0"');
    expect(energy).toContain('data-pv-envelope-source-point-count="0"');
    expect(energy).toContain('data-pv-energy-area-count="1"');
    expect(energy).toContain('data-pva-result-count="1"');
  });

  it("keeps a valid measured isochrone visible but exposes the reason when its PE tail is not admitted", () => {
    const available = buildMainWirePeriodicPvaMethodV13(formalLocusV1(settledPointsV1()), "LV");
    if (available.status !== "available") throw new Error(available.reason);
    const unavailable = {
      analysisId: available.analysisId, methodId: available.methodId, ventricleId: available.ventricleId,
      pressureBasis: available.pressureBasis, status: "unavailable" as const, progress: available.progress,
      reason: "No positive finite low-volume tangent", loadRelations: available.loadRelations,
      preview: { stage: "relations" as const, pointCount: 9, anchor: available.anchor,
        strokeWork: available.strokeWork, espvr: available.espvr, edpvr: available.edpvr,
        potentialEnergy: null, pva: null, estimatedMvo2: null },
    };
    const traces = [{ scenarioId: "a", scenarioLabel: "A", chamberId: "LV", chamberLabel: "LV", samples: [],
      volumeOutputId: "LV.volume", pressureOutputId: "LV.pressure", pressureBasis: "transmural" as const,
      cyclePhaseOutputId: "phase", chamberColor: "#d9822b", periodicPva: unavailable }];
    const energy = renderToStaticMarkup(React.createElement(PressureVolumeLoopCanvasV3, { traces, showPvaBoundary: true }));
    expect(energy).toContain('data-pva-drawing-count="1"');
    expect(energy).toContain('data-pva-result-count="0"');
    expect(energy).toContain('data-pv-energy-area-count="0"');
    expect(energy).toContain('data-testid="workbench-pva-analysis-error"');
    const normal = renderToStaticMarkup(React.createElement(PressureVolumeLoopCanvasV3, { traces }));
    expect(normal).toContain('data-pv-envelope-source-point-count="9"');
    expect(normal).not.toContain('data-testid="workbench-pva-analysis-error"');
  });

  it("adds measured high-load common-time display without changing V9 numerical ownership", () => {
    const locus = formalLocusV1(settledPointsV1());
    const previous = buildMainWirePeriodicPvaMethodV9(locus, "LV");
    const next = buildMainWirePeriodicPvaMethodV10(locus, "LV");
    if (previous.status !== "available" || next.status !== "available") throw new Error("expected PVA");
    expect(next.methodId).toBe(MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID);
    for (const key of ["anchor", "strokeWork", "edpvr", "potentialEnergy", "pva"] as const) {
      expect(JSON.stringify(next[key])).toBe(JSON.stringify(previous[key]));
    }
    const { highLoadIsochroneDisplay: high, ...numericalEspvr } = next.espvr;
    expect(JSON.stringify(numericalEspvr)).toBe(JSON.stringify(previous.espvr));
    expect(high).toMatchObject({ use: "measured-load-continuation-not-pva-owner",
      interpolation: "tbv-ordered-polyline", displayExtrapolation: "none",
      timeSinceAtrialCaptureSec: previous.espvr.selectedTimeSinceAtrialCaptureSec });
    expect(high?.points.map((point) => point.totalBloodVolumeMl)).toEqual([5600, 5600 * 1.08, 5600 * 1.16]);
    expect(high?.points[0]?.volumeMl).toBe(next.anchor.endSystolicVolumeMl);
    expect(high?.points.at(-1)?.volumeMl).toBeGreaterThan(next.espvr.measuredVolumeRangeMl[1]);
    expect(previous.espvr).not.toHaveProperty("highLoadIsochroneDisplay");
  });

  it("preserves an observed folded high-load locus in load order, outside the PVA owner", () => {
    const folded = settledPointsV1().map((point) => point.totalBloodVolumeMl <= 5600 ? point : {
      ...point, ventricularPressureVolumeLoop: point.ventricularPressureVolumeLoop.map((sample) => ({
        ...sample, volumeMl: sample.volumeMl - (point.totalBloodVolumeMl > 6100 ? 15 : 0),
      })),
    });
    const previous = buildMainWirePeriodicPvaMethodV9(formalLocusV1(folded), "LV");
    const next = buildMainWirePeriodicPvaMethodV10(formalLocusV1(folded), "LV");
    if (previous.status !== "available" || next.status !== "available") throw new Error("expected PVA");
    const points = next.espvr.highLoadIsochroneDisplay!.points;
    expect(points[2]!.totalBloodVolumeMl).toBeGreaterThan(points[1]!.totalBloodVolumeMl);
    expect(points[2]!.volumeMl).toBeLessThan(points[1]!.volumeMl);
    expect(workbenchPvMeasuredHighLoadPointsV1(next.espvr)).toBe(points);
    const context = Object.fromEntries(["save", "restore", "setLineDash", "beginPath", "moveTo", "lineTo", "stroke", "arc", "fill"]
      .map((method) => [method, vi.fn()])) as unknown as CanvasRenderingContext2D;
    drawWorkbenchPvHighLoadIsochroneV1(context, next.espvr, (x) => x, (y) => y, "#d9822b", 1);
    expect(context.moveTo).toHaveBeenCalledWith(points[0]!.volumeMl, points[0]!.pressureMmHg);
    expect(context.lineTo).toHaveBeenNthCalledWith(1, points[1]!.volumeMl, points[1]!.pressureMmHg);
    expect(context.lineTo).toHaveBeenNthCalledWith(2, points[2]!.volumeMl, points[2]!.pressureMmHg);
    expect(context.arc).toHaveBeenCalledTimes(2);
    expect(next.potentialEnergy).toEqual(previous.potentialEnergy);
    expect(next.pva).toEqual(previous.pva);
    expect(next.espvr.fitPoints).toEqual(previous.espvr.fitPoints);
  });

  it("does not invent high-load observations when a common-time loop is unavailable", () => {
    const missing = settledPointsV1().map((point) => point.totalBloodVolumeMl > 6100
      ? { ...point, ventricularPressureVolumeLoop: [] } : point);
    const result = buildMainWirePeriodicPvaMethodV10(formalLocusV1(missing), "LV");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.espvr.highLoadIsochroneDisplay).toBeNull();
  });

  it("keeps hypervolemic loads in EDPVR but ends the V9 ESPVR at the operating anchor", () => {
    const points = settledPointsV1();
    const result = buildMainWirePeriodicPvaMethodV9(
      formalLocusV1(points),
      "LV",
    );

    if (result.status !== "available") throw new Error(result.reason);
    expect(result.status).toBe("available");
    expect(result.methodId).toBe(MAIN_WIRE_PERIODIC_PVA_METHOD_V9_ID);
    expect(result.espvr.phaseSelectionPolicy).toBe(
      "preload-reduction-through-anchor-over-lower-anchor-esv-neighborhood-within-anchor-late-systolic-window",
    );
    expect(result.espvr.phaseSelectionPointCount).toBe(7);
    expect(result.espvr.fitPoints).toHaveLength(7);
    expect(result.edpvr.fitPoints).toHaveLength(points.length);
    expect(result.espvr.fitPoints.at(-1)?.volumeMl).toBeCloseTo(
      result.anchor.endSystolicVolumeMl,
      12,
    );
    expect(result.espvr.fitPoints.every((point, index, fitPoints) =>
      index === 0 || (
        point.volumeMl > fitPoints[index - 1]!.volumeMl
        && point.pressureMmHg > fitPoints[index - 1]!.pressureMmHg
      ))).toBe(true);
  });

  it("calculates accepted-step SW, an area-max common-isochrone ESPVR, exponential EDPVR, PE, PVA, and LV MVO2", () => {
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.methodId).toBe(MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID);
    expect(result.completionStatus).toBe("complete");
    expect(result.source).toMatchObject({
      primaryLineage: "persistent-worker-settled-hot-start-chain",
      pointCount: 9,
      slowControllerPolicy: "active-source-period1-then-coronary-tone-frozen",
      endDiastolicLandmark: "maximum-volume-proxy",
      endSystolicLandmark: "active-pressure-area-max-common-isochrone",
    });
    expect(result.espvr.primaryMethod).toBe(
      "active-pressure-area-max-common-isochrone",
    );
    expect(result.espvr.selectedTimeSinceAtrialCaptureSec).toBeCloseTo(
      0.4375,
      12,
    );
    expect(result.espvr.selectedPhase01AtAnchor).toBeCloseTo(0.546875, 12);
    expect(result.espvr.phaseSelectionScoreMmHgMl).toBeGreaterThan(0);
    expect(
      result.espvr.phaseSelectionIntegrationVolumeRangeMl[1],
    ).toBeGreaterThan(result.espvr.phaseSelectionIntegrationVolumeRangeMl[0]);
    expect(result.espvr.phaseSelectionIntegrationVolumeRangeMl[0]).toBeCloseTo(
      50.4,
      12,
    );
    expect(result.espvr.phaseSelectionIntegrationVolumeRangeMl[1]).toBeCloseTo(
      61.6,
      12,
    );
    expect(result.espvr.phaseSelectionCandidatePhaseRange01[0]).toBeCloseTo(
      0.521875,
      12,
    );
    expect(result.espvr.phaseSelectionCandidatePhaseRange01[1]).toBeCloseTo(
      0.571875,
      12,
    );
    expect(result.espvr.phaseSelectionCandidateTimeRangeSec[0]).toBeCloseTo(
      0.4175,
      12,
    );
    expect(result.espvr.phaseSelectionCandidateTimeRangeSec[1]).toBeCloseTo(
      0.4575,
      12,
    );
    expect(result.espvr.phaseSelectionAnchorLandmarks).toEqual({
      maximumPressurePhase01: 0.546875,
      endSystolicPhase01: 0.546875,
    });
    expect(result.espvr.phaseSelectionPolicy).toBe(
      "all-settled-loads-over-fixed-anchor-esv-neighborhood-within-anchor-late-systolic-window",
    );
    expect(result.espvr.phaseSelectionStatus).toBe("complete");
    expect(result.espvr.phaseSelectionPointCount).toBe(9);
    expect(result.espvr).toMatchObject({
      phaseSelectionObjective:
        "positive-active-pressure-area-over-fixed-anchor-esv-neighborhood",
      phaseSelectionCoarseTimeSampleCount: 32,
      phaseSelectionLocalRefinementIntervalCount: 32,
    });
    expect(result.espvr.primaryCurveLaw).toBe(
      "measured-domain-shape-preserving-locus",
    );
    expect(result.espvr.fitPoints).toHaveLength(9);
    expect(result.espvr).toMatchObject({
      interpolation: "shape-preserving-cubic-hermite",
      continuity: "C1",
      displayExtrapolation: "none",
    });
    expect(result.espvr.curve).toHaveLength(65);
    expect(result.espvr.pressureEnvelopeDiagnostic).toMatchObject({
      method: "phase-wise-maximum-pressure-envelope",
      use: "optional-display-and-single-phase-adequacy-diagnostic-not-pva-owner",
      excessAreaMmHgMl: 0,
      excessAreaFraction: 0,
    });
    expect(result.edpvr.scaleMmHg).toBeGreaterThan(0);
    expect(result.edpvr.exponentPerMl).toBeCloseTo(0.02, 2);
    expect(Math.abs(result.edpvr.zeroPressureVolumeMl - 60)).toBeLessThan(1);
    expect(result.strokeWork).toMatchObject({
      method: "accepted-step-transmural-path-work",
      mmHgMl: 8_500,
    });
    expect(result.anchor.measuredHeartRateBpm).toBeCloseTo(75, 12);
    expect(result.potentialEnergy).toMatchObject({
      method:
        "area-between-nonlinear-espvr-and-nonnegative-edpvr-from-left-intersection-to-anchor-esv",
      measuredEspvrStartVolumeMl: result.espvr.measuredVolumeRangeMl[0],
      lowVolumeTangentExtensionUsed: true,
    });
    expect(result.potentialEnergy.leftIntersectionVolumeMl).toBeGreaterThan(0);
    expect(result.potentialEnergy.leftIntersectionVolumeMl).toBeLessThan(
      result.anchor.endSystolicVolumeMl,
    );
    expect(result.potentialEnergy.joule).toBeGreaterThanOrEqual(0);
    expect(result.pva.joule).toBeCloseTo(
      result.strokeWork.joule + result.potentialEnergy.joule,
      12,
    );
    expect(result.estimatedMvo2).toMatchObject({
      status: "available",
      ventricleId: "LV",
      heartRateBpm: 75,
      massReference: {
        allocation: "LVFW-plus-SEP",
      },
      interpretation: {
        pvaDefinitionReproducesCoefficientSourceProtocol: false,
        modelSpecificCalibrationEstablished: false,
        measuredOxygenConsumption: false,
      },
    });
  });

  it("uses a curved measured common isochrone as the non-extrapolated C1 PVA boundary", () => {
    const curved = settledPointsV1().map((point) => {
      return Object.freeze({
        ...point,
        ventricularPressureVolumeLoop: Object.freeze(
          point.ventricularPressureVolumeLoop.map((sample) =>
            sample.phase01! >= 0.4 && sample.phase01! <= 0.6
              ? Object.freeze({
                  ...sample,
                  pressureMmHg:
                    sample.pressureMmHg + 0.012 * (sample.volumeMl - 50) ** 2,
                })
              : sample,
          ),
        ),
      });
    });
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(curved),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.espvr.primaryMethod).toBe(
      "active-pressure-area-max-common-isochrone",
    );
    expect(result.espvr.primaryCurveLaw).toBe(
      "measured-domain-shape-preserving-locus",
    );
    expect(result.espvr).toMatchObject({
      interpolation: "shape-preserving-cubic-hermite",
      continuity: "C1",
      displayExtrapolation: "none",
    });
    expect(result.espvr.fitPoints).toHaveLength(curved.length);
    expect(result.espvr.curve[0]!.volumeMl).toBe(
      result.espvr.measuredVolumeRangeMl[0],
    );
    expect(result.espvr.curve.at(-1)!.volumeMl).toBe(
      result.espvr.measuredVolumeRangeMl[1],
    );
    expect(result.potentialEnergy.method).toContain("nonlinear-espvr");
    expect(result.potentialEnergy.lowVolumeTangentExtensionUsed).toBe(true);
    const endpointSecantPeMmHgMl = endpointSecantPotentialEnergyV1(result);
    expect(
      Math.abs(result.potentialEnergy.mmHgMl - endpointSecantPeMmHgMl) /
        result.potentialEnergy.mmHgMl,
    ).toBeGreaterThan(1e-3);
  });

  it("keeps the common-phase ESPVR separate from a volume-dependent pressure envelope", () => {
    const points = settledPointsV1().map((point, index) => {
      const peakPhase01 = 0.15 + index * 0.025;
      const endSystolicVolumeMl =
        point.ventricularPressureVolumeLandmarks.endSystolic.volumeMl;
      return Object.freeze({
        ...point,
        ventricularPressureVolumeLoop: Object.freeze(
          point.ventricularPressureVolumeLoop.map((sample) => {
            const normalizedActivation = Math.max(
              0,
              1 - Math.abs(sample.phase01! - peakPhase01) / 0.25,
            );
            return Object.freeze({
              ...sample,
              volumeMl: endSystolicVolumeMl,
              pressureMmHg:
                (1 + normalizedActivation) * (endSystolicVolumeMl - 20),
            });
          }),
        ),
      });
    });

    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(points),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    const diagnostic = result.espvr.pressureEnvelopeDiagnostic;
    expect(diagnostic.timeSinceAtrialCaptureRangeSec[1]).toBeGreaterThan(
      diagnostic.timeSinceAtrialCaptureRangeSec[0],
    );
    expect(diagnostic.phase01AtAnchorRange[1]).toBeGreaterThan(
      diagnostic.phase01AtAnchorRange[0],
    );
    expect(diagnostic.excessAreaMmHgMl).toBeGreaterThan(0);
    expect(diagnostic.excessAreaFraction).toBeGreaterThan(0);
    expect(
      new Set(
        diagnostic.winningTimeByVolume.map(
          ({ timeSinceAtrialCaptureSec }) => timeSinceAtrialCaptureSec,
        ),
      ).size,
    ).toBeGreaterThan(1);
    expect(result.espvr.selectedPhase01AtAnchor).toBeGreaterThanOrEqual(
      diagnostic.phase01AtAnchorRange[0],
    );
    expect(result.espvr.selectedPhase01AtAnchor).toBeLessThanOrEqual(
      diagnostic.phase01AtAnchorRange[1],
    );
  });

  it("is insensitive to adaptive point density over the same volume domain", () => {
    const uniform = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    const adaptive = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(
        settledPointsV1([
          1.16, 1.08, 1, 0.99, 0.965, 0.925, 0.86, 0.78, 0.7, 0.64, 0.6,
        ]),
      ),
      "LV",
    );

    expect(uniform.status).toBe("available");
    expect(adaptive.status).toBe("available");
    if (uniform.status !== "available" || adaptive.status !== "available") {
      throw new Error("synthetic PVA family was unavailable");
    }
    expect(adaptive.espvr.selectedTimeSinceAtrialCaptureSec).toBeCloseTo(
      uniform.espvr.selectedTimeSinceAtrialCaptureSec,
      12,
    );
    expect(adaptive.espvr.phaseSelectionPointCount).toBe(11);
    expect(uniform.espvr.phaseSelectionPointCount).toBe(9);
    expect(
      Math.abs(
        adaptive.potentialEnergy.mmHgMl - uniform.potentialEnergy.mmHgMl,
      ) / uniform.potentialEnergy.mmHgMl,
    ).toBeLessThan(1e-7);
    expect(
      Math.abs(adaptive.pva.mmHgMl - uniform.pva.mmHgMl) / uniform.pva.mmHgMl,
    ).toBeLessThan(1e-7);
  });

  it("reports point progress until the formal hot-start chain completes", () => {
    const points = settledPointsV1([1.08, 1, 0.92, 0.84]);
    const partial = formalLocusV1(points, 21);

    expect(
      buildMainWirePeriodicPvaMethodV8(partial, "LV"),
    ).toMatchObject({
      status: "collecting",
      progress: { completedPointCount: 4, totalPointCount: 5 },
      preview: {
        stage: "anchor",
        pointCount: 4,
      },
    });
  });

  it("progresses from a narrow three-point preview to a bilateral five-point PVA", () => {
    const relations = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.08, 1, 0.92]), 21),
      "LV",
    );
    const provisionalPva = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1, 0.92, 0.84, 0.76]), 21),
      "LV",
    );

    expect(relations).toMatchObject({
      status: "collecting",
      preview: {
        stage: "anchor",
        pointCount: 3,
        pva: null,
      },
    });
    if (relations.status === "collecting") {
      expect(relations.preview?.espvr).toBeNull();
      expect(relations.preview?.edpvr).toBeNull();
    }
    expect(provisionalPva).toMatchObject({
      status: "available",
      completionStatus: "progressive",
      progress: { completedPointCount: 5, totalPointCount: 5 },
    });
    if (provisionalPva.status === "available") {
      expect(provisionalPva.espvr.phaseSelectionStatus).toBe("progressive");
      expect(provisionalPva.espvr.phaseSelectionPointCount).toBe(5);
      expect(provisionalPva.pva.joule).toBeGreaterThan(0);
      expect(provisionalPva.estimatedMvo2).toMatchObject({
        status: "available",
      });
    }
  });

  it("publishes PVA after five bidirectional points while the wider family continues", () => {
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1, 0.92, 0.84, 0.76]), 21),
      "LV",
    );

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error(result.reason);
    expect(result.completionStatus).toBe("progressive");
    expect(result.progress).toEqual({
      completedPointCount: 5,
      totalPointCount: 5,
    });
    expect(result.source.familyProgress).toEqual({
      completedPointCount: 5,
      totalPointCount: 21,
    });
  });

  it("uses every settled load for preview but keeps the five-load PVA admission minimum", () => {
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1.08, 1, 0.92, 0.84]), 21),
      "LV",
    );

    expect(result).toMatchObject({
      status: "collecting",
      progress: { completedPointCount: 4, totalPointCount: 5 },
      preview: {
        stage: "relations",
        espvr: {
          phaseSelectionStatus: "progressive",
          phaseSelectionPointCount: 5,
        },
      },
    });
  });

  it("allows additional settled loads to update the common time over the fixed anchor-ESV domain", () => {
    const phaseAdaptiveRatios = [1.16, 1, 0.92, 0.84, 0.76, 1.08, 0.68, 0.6];
    const phaseAdaptiveFamily = settledPointsV1(phaseAdaptiveRatios).map(
      (point, pointIndex) => {
        const addedLoad = pointIndex >= 5;
        const peakPhase01 = addedLoad ? 0.52 : 0.45;
        return Object.freeze({
          ...point,
          ventricularPressureVolumeLoop: Object.freeze(
            point.ventricularPressureVolumeLoop.map((sample) => {
              const normalizedActivation = Math.max(
                0,
                1 - Math.abs(sample.phase01! - peakPhase01) / 0.18,
              );
              return Object.freeze({
                ...sample,
                pressureMmHg:
                  (1.6 + 0.4 * normalizedActivation) *
                  Math.max(1, sample.volumeMl - 20),
              });
            }),
          ),
        });
      },
    );
    const core = phaseAdaptiveFamily.slice(0, 5);
    const coreResult = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(core, phaseAdaptiveFamily.length),
      "LV",
    );
    const extendedResult = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(phaseAdaptiveFamily),
      "LV",
    );

    expect(coreResult.status).toBe("available");
    expect(extendedResult.status).toBe("available");
    if (
      coreResult.status !== "available" ||
      extendedResult.status !== "available"
    ) {
      throw new Error("synthetic PVA core was unavailable");
    }
    expect(extendedResult.espvr.selectedTimeSinceAtrialCaptureSec).not.toBe(
      coreResult.espvr.selectedTimeSinceAtrialCaptureSec,
    );
    expect(extendedResult.espvr.phaseSelectionIntegrationVolumeRangeMl).toEqual(
      coreResult.espvr.phaseSelectionIntegrationVolumeRangeMl,
    );
    expect(coreResult.espvr.phaseSelectionPointCount).toBe(5);
    expect(extendedResult.espvr.phaseSelectionPointCount).toBe(8);
    expect(coreResult.espvr.phaseSelectionStatus).toBe("progressive");
    expect(extendedResult.espvr.phaseSelectionStatus).toBe("complete");
    expect(extendedResult.espvr.fitPoints.length).toBeGreaterThan(
      coreResult.espvr.fitPoints.length,
    );
    expect(extendedResult.edpvr.fitPoints.length).toBeGreaterThan(
      coreResult.edpvr.fitPoints.length,
    );
    expect(extendedResult.strokeWork).toEqual(coreResult.strokeWork);
  });

  it("uses a relative baseline span without pushing low-TBV Scenarios below the absolute floor", () => {
    const sourceTbvMl =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3.totalBloodVolumeMl;
    const adaptiveRatios = [
      1.16, 1.08, 1, 0.96, 0.91, 0.855, 0.8, 0.75, 0.7, 0.65, 0.6,
    ];
    const adaptive = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1(adaptiveRatios)),
      "LV",
    );

    expect(MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3).toBe(
      5,
    );
    expect(
      mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3(
        sourceTbvMl,
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3,
      ),
    ).toBe(sourceTbvMl * 0.7);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_ABSOLUTE_TBV_ML_V3,
    ).toBe(3_360);
    expect(
      mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3(sourceTbvMl),
    ).toBeCloseTo(3_920, 10);
    expect(mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3(4_400)).toBe(
      3_360,
    );
    expect(mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3(4_200)).toBe(
      3_360,
    );
    expect(mainWireIntegratedModelFormalPvaMinimumGlobalTbvMlV3(7_000)).toBe(
      4_900,
    );
    expect(adaptive.status).toBe("available");
    if (adaptive.status === "available") {
      expect(adaptive.source.pointCount).toBe(adaptiveRatios.length);
      expect(adaptive.espvr.fitPoints.length).toBeGreaterThanOrEqual(5);
      expect(adaptive.espvr.fitPoints).toHaveLength(adaptiveRatios.length);
      expect(adaptive.edpvr.fitPoints).toHaveLength(adaptiveRatios.length);
    }
  });

  it("does not expose a separate semilunar-closure or classical Ees/V0 owner", () => {
    const points = settledPointsV1().map((point) =>
      Object.freeze({
        ...point,
        ventricularPressureVolumeLandmarks: Object.freeze({
          ...point.ventricularPressureVolumeLandmarks,
          endSystolic: Object.freeze({
            ...point.ventricularPressureVolumeLandmarks.endSystolic,
            event: "minimum-volume-fallback" as const,
          }),
        }),
      }),
    );

    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(points),
      "LV",
    );
    expect(result.status).toBe("available");
    if (result.status === "available") {
      expect(result.espvr.primaryMethod).toBe(
        "active-pressure-area-max-common-isochrone",
      );
      expect("semilunarClosureComparator" in result.espvr).toBe(false);
      expect("educationalLinearApproximation" in result.espvr).toBe(false);
    }
  });

  it("fails closed when phased loops cannot define a common isochrone", () => {
    const points = settledPointsV1().map((point) =>
      Object.freeze({
        ...point,
        ventricularPressureVolumeLoop: Object.freeze(
          point.ventricularPressureVolumeLoop.map(
            ({ phase01: _phase01, ...sample }) => Object.freeze(sample),
          ),
        ),
      }),
    );

    expect(
      buildMainWirePeriodicPvaMethodV8(formalLocusV1(points), "LV"),
    ).toMatchObject({ status: "unavailable" });
  });

  it("rejects PE geometry when EDPVR reaches or crosses the selected ESPVR", () => {
    const points = settledPointsV1().map((point, index) =>
      Object.freeze({
        ...point,
        ventricularPressureVolumeLandmarks: Object.freeze({
          ...point.ventricularPressureVolumeLandmarks,
          endDiastolic: Object.freeze({
            ...point.ventricularPressureVolumeLandmarks.endDiastolic,
            pressureMmHg: 180 + index * 20,
          }),
        }),
      }),
    );

    expect(
      buildMainWirePeriodicPvaMethodV8(formalLocusV1(points), "LV"),
    ).toMatchObject({
      status: "unavailable",
      reason: expect.stringContaining("fixed anchor-ESV neighborhood"),
    });
  });

  it("does not expose an RV oxygen estimate", () => {
    const result = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "RV",
    );
    expect(result.status).toBe("available");
    if (result.status === "available") expect(result.estimatedMvo2).toBeNull();
  });

  it("keeps the PV pane focused on curves instead of a numerical result card", () => {
    const periodicPva = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
        traces: [
          {
            scenarioId: "scenario/current",
            scenarioLabel: "Current",
            samples: Object.freeze([]),
            volumeOutputId: "LV.volume",
            pressureOutputId: "LV.pressure",
            pressureBasis: "transmural" as const,
            cyclePhaseOutputId: "clock.phase",
            chamberId: "LV",
            chamberLabel: "LV",
            chamberColor: "#d9822b",
            periodicPva,
            periodicPvaAnalysisPending: false,
          },
        ],
      }),
    );

    expect(html).toContain('data-pva-result-count="1"');
    expect(html).toContain('data-pva-drawing-count="1"');
    expect(html).toContain('data-pva-retained-drawing-count="0"');
    expect(html).toContain(
      'data-pv-relation-model="all-settled-shape-preserving-locus"',
    );
    expect(html).toContain('data-pv-pressure-envelope-visible="false"');
    expect(html).not.toContain('data-testid="workbench-pva-results"');

    const envelopeHtml = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
        showPressureEnvelope: true,
        traces: [
          {
            scenarioId: "scenario/current",
            scenarioLabel: "Current",
            samples: Object.freeze([]),
            volumeOutputId: "LV.volume",
            pressureOutputId: "LV.pressure",
            pressureBasis: "transmural" as const,
            cyclePhaseOutputId: "clock.phase",
            chamberId: "LV",
            chamberLabel: "LV",
            chamberColor: "#d9822b",
            periodicPva,
            periodicPvaAnalysisPending: false,
          },
        ],
      }),
    );
    expect(envelopeHtml).toContain('data-pv-pressure-envelope-visible="true"');
  });

  it("renders settled-point progress in the PV pane", () => {
    const periodicPva = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1, 0.92, 0.84, 0.76]), 21),
      "LV",
    );
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
        traces: [
          {
            scenarioId: "scenario/current",
            scenarioLabel: "Current",
            samples: Object.freeze([]),
            volumeOutputId: "LV.volume",
            pressureOutputId: "LV.pressure",
            pressureBasis: "transmural" as const,
            cyclePhaseOutputId: "clock.phase",
            chamberId: "LV",
            chamberLabel: "LV",
            chamberColor: "#d9822b",
            periodicPva,
            periodicPvaAnalysisPending: true,
          },
        ],
      }),
    );

    expect(html).toContain("PVA ready · Starling extension 5 settled points");
  });

  it("retains the last valid relation drawing only while an update is pending", () => {
    const previous: Readonly<{ relationId: string }> = Object.freeze({
      relationId: "settled/five-points",
    });

    expect(retainWorkbenchPvRelationDrawingV3(null, previous, true)).toEqual({
      drawing: previous,
      retainedFromPriorUpdate: true,
    });
    expect(
      retainWorkbenchPvRelationDrawingV3(
        Object.freeze({ relationId: "settled/six-points" }),
        previous,
        true,
      ),
    ).toMatchObject({
      drawing: { relationId: "settled/six-points" },
      retainedFromPriorUpdate: false,
    });
    expect(retainWorkbenchPvRelationDrawingV3(null, previous, false)).toEqual({
      drawing: null,
      retainedFromPriorUpdate: false,
    });
  });

  it("keeps live SW separate while materializing PE, PVA, and estimated MVO2", async () => {
    const { contract } = (
      await loadStudioLocalAlgebraicPulmonaryRootClientCompositionV1()
    ).modelSurface;
    const analysisOutputIds = Object.values(
      MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1,
    );
    expect(
      contract.outputCatalog.some(({ outputId }) =>
        analysisOutputIds.includes(
          outputId as (typeof analysisOutputIds)[number],
        )),
    ).toBe(true);
    const periodicPva = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1()),
      "LV",
    );
    expect(periodicPva.status).toBe("available");
    if (periodicPva.status !== "available") throw new Error(periodicPva.reason);
    const defaultPane = createDefaultExperimentSurfaceV3(
      contract,
      "scenario/current",
    ).outputPanes[0]!;
    const outputIds = analysisOutputIds;
    const outputLabels = [
      "LV potential energy (PE)",
      "LV pressure–volume area (PVA)",
      "Estimated LV MVO₂ per beat",
      "Estimated LV MVO₂ per minute",
    ] as const;
    const pane = {
      ...defaultPane,
      items: outputIds.map((outputId, order) => ({
        outputId,
        label: outputLabels[order]!,
        order,
      })),
    };

    const items = materializeWorkbenchOutputPresentationItemsV3({
      contract,
      frame: null,
      locale: "en",
      notAssessedNotice: "Not assessed",
      pane,
      periodicPva,
    });

    expect(items).toEqual([
      expect.objectContaining({
        itemId: "myocardium.energy.potential.LV-pressure-volume-area",
        label: "LV potential energy (PE)",
        value: periodicPva.potentialEnergy.joule * 1e3,
        unit: "mJ",
        availability: "available",
      }),
      expect.objectContaining({
        itemId: "myocardium.energy.pressure-volume-area.LV",
        label: "LV pressure–volume area (PVA)",
        value: periodicPva.pva.joule * 1e3,
        unit: "mJ",
        availability: "available",
      }),
      expect.objectContaining({
        itemId: "oxygen.consumption.estimated-myocardial.LV-per-beat-per-100g",
        value:
          periodicPva.estimatedMvo2?.status === "available"
            ? periodicPva.estimatedMvo2.oxygenDemand.totalMlO2PerBeatPer100G
            : null,
        unit: "mL O2/beat/100g",
        availability: "available",
      }),
      expect.objectContaining({
        itemId: "oxygen.consumption.estimated-myocardial.LV-per-min-per-100g",
        value:
          periodicPva.estimatedMvo2?.status === "available"
            ? periodicPva.estimatedMvo2.oxygenDemand.totalMlO2PerMinPer100G
            : null,
        unit: "mL O2/min/100g",
        availability: "available",
      }),
    ]);
    expect(
      workbenchPeriodicPvaOutputValueV3(
        periodicPva,
        "myocardium.work.stroke.LV",
      ),
    ).toBeUndefined();

    const early = buildMainWirePeriodicPvaMethodV8(
      formalLocusV1(settledPointsV1([1.16, 1, 0.92, 0.84, 0.76]), 21),
      "LV",
    );
    expect(early.status).toBe("available");
    if (early.status !== "available") {
      throw new Error("five-point bidirectional PVA was unavailable");
    }
    const earlyPvaMilliJoule = early.pva.joule * 1e3;
    const progressItems = materializeWorkbenchOutputPresentationItemsV3({
      contract,
      frame: null,
      locale: "en",
      notAssessedNotice: "Not assessed",
      pane: {
        ...defaultPane,
        items: [
          {
            outputId:
              MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule,
            label: "PVA",
            order: 0,
          },
        ],
      },
      periodicPva: early,
    });
    expect(progressItems[0]).toMatchObject({
      availability: "available",
      value: earlyPvaMilliJoule,
    });
  });

  it("renders a formal analysis failure instead of leaving an empty pane", () => {
    const html = renderToStaticMarkup(
      React.createElement(PressureVolumeLoopCanvasV3, {
        traces: [
          {
            scenarioId: "scenario/current",
            scenarioLabel: "Current",
            samples: Object.freeze([]),
            volumeOutputId: "LV.volume",
            pressureOutputId: "LV.pressure",
            pressureBasis: "transmural" as const,
            cyclePhaseOutputId: "clock.phase",
            chamberId: "LV",
            chamberLabel: "LV",
            chamberColor: "#d9822b",
            periodicPvaAnalysisError:
              "formal pressure-volume load 0.95 rejected: qualification failed",
            periodicPvaAnalysisPending: false,
          },
        ],
      }),
    );

    expect(html).toContain('data-testid="workbench-pva-analysis-error"');
    expect(html).toContain("PVA analysis unavailable");
    expect(html).not.toContain("formal pressure-volume load 0.95 rejected");
  });

  it("rejects non-finite and overflowing literature projections", () => {
    expect(
      evaluateMainWireIntegratedModelLvMvo2EstimateV1({
        pvaOutputId: "pva/test",
        pvaMethodId: "method/test",
        pvaEstimateJ: Number.MAX_VALUE,
        heartRateBpm: 60,
      }),
    ).toMatchObject({ status: "unavailable" });
    expect(
      evaluateMainWireIntegratedModelLvMvo2EstimateV1({
        pvaOutputId: "pva/test",
        pvaMethodId: "method/test",
        pvaEstimateJ: Number.NaN,
        heartRateBpm: 60,
      }),
    ).toMatchObject({ status: "unavailable" });
  });
});

function formalLocusV1(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  totalPointCount = points.length,
): MainWireIntegratedModelStarlingLocusV3 {
  return Object.freeze({
    status: "measured-fixed-tbv-protocol" as const,
    protocolId: "formal-pv/test",
    requirement:
      "persistent-fixed-tone-preload-reduction-chain-with-complete-beat-period1-settlement" as const,
    minimumBeatCount: 3,
    maximumBeatCount: 20,
    completedPointCount: points.length,
    totalPointCount,
    slowControllerPolicy:
      "active-source-period1-then-coronary-tone-frozen" as const,
    convergencePolicy: "complete-beat-output-period1-closure" as const,
    points: Object.freeze(
      points.map((point) =>
        Object.freeze({
          ...point,
          quality: "locally-converged" as const,
          curveEligible: true as const,
          settled: true as const,
          evidence: "fixed-tone-periodic" as const,
          measurementWindowStatus: "fixed-tone-period1-settled" as const,
        }),
      ),
    ),
  });
}

function endpointSecantPotentialEnergyV1(
  result: Extract<
    ReturnType<typeof buildMainWirePeriodicPvaMethodV8>,
    Readonly<{ status: "available" }>
  >,
): number {
  const first = result.espvr.fitPoints[0]!;
  const last = result.espvr.fitPoints.at(-1)!;
  const slope =
    (last.pressureMmHg - first.pressureMmHg) / (last.volumeMl - first.volumeMl);
  const intercept = first.pressureMmHg - slope * first.volumeMl;
  const pressureDifference = (volumeMl: number) =>
    slope * volumeMl +
    intercept -
    Math.max(
      0,
      result.edpvr.scaleMmHg *
        Math.expm1(
          result.edpvr.exponentPerMl *
            (volumeMl - result.edpvr.zeroPressureVolumeMl),
        ),
    );
  let leftVolumeMl = 0;
  let leftDifferenceMmHg = pressureDifference(leftVolumeMl);
  let rightVolumeMl = Number.NaN;
  for (let index = 1; index <= 512; index += 1) {
    const volumeMl = (index / 512) * result.anchor.endSystolicVolumeMl;
    const differenceMmHg = pressureDifference(volumeMl);
    if (leftDifferenceMmHg <= 0 && differenceMmHg > 0) {
      rightVolumeMl = volumeMl;
      break;
    }
    leftVolumeMl = volumeMl;
    leftDifferenceMmHg = differenceMmHg;
  }
  if (!Number.isFinite(rightVolumeMl)) {
    throw new Error("endpoint secant did not cross the fitted EDPVR");
  }
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpointVolumeMl = 0.5 * (leftVolumeMl + rightVolumeMl);
    if (pressureDifference(midpointVolumeMl) > 0) {
      rightVolumeMl = midpointVolumeMl;
    } else {
      leftVolumeMl = midpointVolumeMl;
    }
  }
  const intersectionVolumeMl = 0.5 * (leftVolumeMl + rightVolumeMl);
  const intervalCount = 4_096;
  const widthMl =
    (result.anchor.endSystolicVolumeMl - intersectionVolumeMl) / intervalCount;
  let areaMmHgMl = 0;
  let previousDifferenceMmHg = pressureDifference(intersectionVolumeMl);
  for (let index = 1; index <= intervalCount; index += 1) {
    const volumeMl = intersectionVolumeMl + index * widthMl;
    const differenceMmHg = pressureDifference(volumeMl);
    areaMmHgMl += 0.5 * (previousDifferenceMmHg + differenceMmHg) * widthMl;
    previousDifferenceMmHg = differenceMmHg;
  }
  return areaMmHgMl;
}

function isovolumicEnvelopePointsV1(volumes: readonly number[], pressures: readonly number[]): readonly MainWireIntegratedModelStarlingPointV3[] {
  return settledPointsV1(volumes.map((_, i) => 0.8 + i * 0.2)).map((point, i) => ({
    ...point, ventricularPressureVolumeLoop: [
      { phase01: 0, volumeMl: volumes[i]!, pressureMmHg: 0 },
      { phase01: 0.25, volumeMl: volumes[i]!, pressureMmHg: pressures[i]! },
      { phase01: 0.75, volumeMl: volumes[i]!, pressureMmHg: 0 },
    ],
  }));
}

function settledPointsV1(
  ratios: readonly number[] = [
    1.16, 1.08, 1, 0.92, 0.84, 0.76, 0.68, 0.64, 0.6,
  ],
): readonly MainWireIntegratedModelStarlingPointV3[] {
  return Object.freeze(
    ratios.map((ratio) => {
      const reductionOrdinal = (1 - ratio) / 0.05;
      const endSystolicVolumeMl = 56 - reductionOrdinal * 2;
      const endDiastolicVolumeMl = 121 - reductionOrdinal * 4;
      const endSystolicPressureMmHg = 2 * (endSystolicVolumeMl - 20);
      const endDiastolicPressureMmHg =
        2 * Math.expm1(0.02 * (endDiastolicVolumeMl - 60));
      return Object.freeze({
        totalBloodVolumeMl: 5_600 * ratio,
        fillingPressureMmHg: 11.5 - reductionOrdinal * 0.9,
        cardiacOutputLPerMin: 5.5,
        role:
          ratio === 1
            ? ("operating-anchor" as const)
            : ("continuation" as const),
        quality: "locally-converged" as const,
        curveEligible: true,
        completedBeatCount: 8,
        maximumNormalizedBeatDelta: 1e-8,
        settled: true,
        finiteAndFixedTbvPassed: true as const,
        evidence: "qualified-periodic" as const,
        measurementWindowStatus: "canonical-period1-qualified" as const,
        acceptedMeasurementDurationSec: 8,
        acceptedTransmuralPathWorkMmHgMl: 8_500 - reductionOrdinal * 75,
        acceptedBeatDurationSec: 0.8,
        ventricularPressureVolumeLoop: syntheticLoopV1({
          endSystolicVolumeMl,
          endSystolicPressureMmHg,
          endDiastolicVolumeMl,
          endDiastolicPressureMmHg,
        }),
        ventricularPressureVolumeLandmarks: Object.freeze({
          pressureBasis: "transmural" as const,
          endSystolic: Object.freeze({
            volumeMl: endSystolicVolumeMl,
            pressureMmHg: endSystolicPressureMmHg,
            event: "semilunar-valve-closure" as const,
          }),
          endDiastolic: Object.freeze({
            volumeMl: endDiastolicVolumeMl,
            pressureMmHg: endDiastolicPressureMmHg,
            event: "maximum-volume" as const,
          }),
        }),
      });
    }),
  );
}

function syntheticLoopV1(
  input: Readonly<{
    endSystolicVolumeMl: number;
    endSystolicPressureMmHg: number;
    endDiastolicVolumeMl: number;
    endDiastolicPressureMmHg: number;
  }>,
): readonly MainWireIntegratedModelPressureVolumeLoopPointV3[] {
  return Object.freeze(
    Array.from({ length: 64 }, (_, index) => {
      const phase01 = index / 64;
      const ejectionFraction =
        phase01 <= 0.1 ? 0 : phase01 <= 0.55 ? (phase01 - 0.1) / 0.45 : 1;
      const fillingFraction = phase01 <= 0.65 ? 0 : (phase01 - 0.65) / 0.35;
      const volumeMl =
        phase01 <= 0.55
          ? input.endDiastolicVolumeMl -
            ejectionFraction *
              (input.endDiastolicVolumeMl - input.endSystolicVolumeMl)
          : input.endSystolicVolumeMl +
            fillingFraction *
              (input.endDiastolicVolumeMl - input.endSystolicVolumeMl);
      const normalizedActivation = Math.max(
        0,
        1 - Math.abs(phase01 - 0.55) / 0.25,
      );
      const elastanceMmHgPerMl = 0.05 + 1.95 * normalizedActivation;
      const passivePressureMmHg =
        input.endDiastolicPressureMmHg * fillingFraction ** 2;
      return Object.freeze({
        phase01,
        volumeMl,
        pressureMmHg: Math.max(
          passivePressureMmHg,
          elastanceMmHgPerMl * (volumeMl - 20),
        ),
      });
    }),
  );
}
