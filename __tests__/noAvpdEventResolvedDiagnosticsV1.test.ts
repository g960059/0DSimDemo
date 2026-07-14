import { describe, expect, it } from "vitest";

import {
  summarizeNoAvpdEventResolvedDiagnosticsV1,
  type NoAvpdEventDiagnosticSampleV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdEventResolvedDiagnosticsV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

function sample(phase01: number): NoAvpdEventDiagnosticSampleV1 {
  const gradient = Math.sin(4 * Math.PI * phase01);
  const flow = 100 * gradient;
  return {
    phase01,
    volumesMl: {
      leftAtriumMl: 70 + 10 * Math.cos(2 * Math.PI * phase01),
      leftVentricleMl: 120 - 10 * Math.cos(2 * Math.PI * phase01),
      rightAtriumMl: 50 + 8 * Math.cos(2 * Math.PI * phase01),
      rightVentricleMl: 110 - 8 * Math.cos(2 * Math.PI * phase01),
    },
    pressuresMmHg: {
      la: 10 + gradient / 2,
      lv: 10 - gradient / 2,
      ra: 3 + gradient / 2,
      rv: 3 - gradient / 2,
    },
    flowsMlPerSec: { mv: flow, tv: flow },
    freeCalciumUm: { la: 0.1, ra: 0.1 },
    caTroponin01: { la: 0.1, ra: 0.1 },
    thinFilamentAvailability01: { la: 0.1, ra: 0.1 },
    wallReadback: {
      la: { seriesTensionKPa: 1 },
      ra: { seriesTensionKPa: 1 },
    },
  };
}

describe("NoAvpdEventResolvedDiagnosticsV1", () => {
  it("reports multiple smooth-valve transitions as ambiguous without inventing primary events", () => {
    const samples = Array.from({ length: 401 }, (_, index) => sample(index / 200));
    const diagnostics = summarizeNoAvpdEventResolvedDiagnosticsV1({
      samples,
      params: DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      dtSec: 0.005,
      sampleEverySteps: 1,
      exactStepsPerCycle: 200,
      eventAnchorBeatIndex: 30,
    });

    expect(diagnostics.availability).toBe("available-complete-raw-two-cycle-window");
    expect(diagnostics.left?.valveTransitions.modelHalfOpen.selectionStatus)
      .toBe("ambiguous-transition-count");
    expect(diagnostics.left?.valveTransitions.modelHalfOpen.opening).toBeNull();
    expect(diagnostics.left?.valveTransitions.modelHalfOpen.closure).toBeNull();
    expect(diagnostics.left?.inflowSeparationReadback.status).toBe("not-measurable");
    expect(diagnostics.left?.inflowEvents.ePeak).toBeNull();
    expect(diagnostics.changesStructuralStatus).toBe(false);
  });

  it("refuses sparse samples instead of resolving events from a decimated trace", () => {
    const diagnostics = summarizeNoAvpdEventResolvedDiagnosticsV1({
      samples: Array.from({ length: 51 }, (_, index) => sample(index / 50)),
      params: DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
      dtSec: 0.005,
      sampleEverySteps: 4,
      exactStepsPerCycle: 200,
      eventAnchorBeatIndex: 30,
    });

    expect(diagnostics.availability)
      .toBe("unavailable-samples-not-every-accepted-step");
    expect(diagnostics.left).toBeNull();
    expect(diagnostics.right).toBeNull();
  });
});
