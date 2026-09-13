import { describe, expect, it } from "vitest";
import trace from "./fixtures/cardiac-cycle-figure-trace-v1.json";
import { prepareMainWireCardiacCycleFigureV1, interpolateFigureSampleV1, renderMainWireCardiacCyclePvSvgV1 } from "@/studio/presentation/scientificFigures/MainWireCardiacCycleFigureV1";

describe("data-derived cardiac-cycle teaching figures", () => {
  it("retains measured vertices and uses flow events, with the declared pressure reference", () => {
    const f = prepareMainWireCardiacCycleFigureV1(trace, "baseline");
    expect(f.displayWindow).toEqual({startTimeSec:47.974000000000004,endTimeSec:48.832,timeOrigin:"mitral-closure"});
    expect(f.points[0]!.timeSec).toBe(f.events[0]!.timeSec);
    expect(f.points.at(-1)!.values["hemodynamics.flow.valve.MV"]).toBe(0);
    expect(f.pressureReference).toBe("absolute-LV-intracavitary-mmHg");
    expect(f.events.map(e => e.timeSec)).toEqual([47.974000000000004, 48.064, 48.322, 48.414]);
    expect(f.measurement.edvMl).toBeCloseTo(143.7099, 4);
    expect(f.measurement.esvMl).toBeCloseTo(63.5898, 4);
    expect(f.measurement.pesMmHg).toBeCloseTo(106.4347, 4);
    expect(f.measurement.pedMmHg).toBeCloseTo(10.9300, 4);
    expect(f.measurement.svMl).toBeCloseTo(f.metrics.aorticEjection.forwardVolumeMl, 5);
    expect(f.points.slice(1,-1)).toEqual(trace.traces[0]!.samples.filter(s => s.acceptedTimeSec > f.displayWindow.startTimeSec && s.acceptedTimeSec < f.displayWindow.endTimeSec).map(s => ({
      timeSec:s.acceptedTimeSec, values:Object.fromEntries(Object.keys(f.points[0]!.values).map(id => [id,s.values[trace.outputIds.indexOf(id)]])),
    })));
    const svg=renderMainWireCardiacCyclePvSvgV1(f);
    expect(svg).not.toContain("SIMULATION");
    expect(svg).not.toContain("Ees"); // A one-beat trace supplies no multi-load fit.
    expect(svg).not.toContain("NaN");
  });
  it("rejects unavailable or decimated measurements instead of drawing plausible substitutes", () => {
    expect(()=>prepareMainWireCardiacCycleFigureV1({...trace,sampleStride:4},"baseline")).toThrow(/sampleStride/);
    expect(()=>prepareMainWireCardiacCycleFigureV1({...trace,traces:trace.traces.map(t=>({...t,samples:t.samples.filter(s=>s.acceptedTimeSec>=48.6)}))},"baseline")).toThrow(/two complete cycles/);
    const bad=structuredClone(trace);bad.traces[0]!.samples[50]!.states[0]=3;
    expect(()=>prepareMainWireCardiacCycleFigureV1(bad,"baseline")).toThrow(/available finite/);
    expect(()=>prepareMainWireCardiacCycleFigureV1({...trace,outputIds:trace.outputIds.filter(id=>id!=="hemodynamics.volume.LV")},"baseline")).toThrow(/requires/);
  });
  it("interpolates marker coordinates without extrapolation",()=>{
    const s=[{acceptedTimeSec:1,acceptedRevision:1,inputEpoch:0,values:{v:20}},{acceptedTimeSec:2,acceptedRevision:2,inputEpoch:0,values:{v:40}}];
    expect(interpolateFigureSampleV1(s,1.25)).toEqual({v:25});
    expect(()=>interpolateFigureSampleV1(s,.9)).toThrow(/outside/);
    expect(()=>interpolateFigureSampleV1(s,2.1)).toThrow(/outside/);
  });
});
