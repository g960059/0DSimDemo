import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";

const DT_SEC = 0.002;
const HORIZON_SEC = 20;
const OUTPUT_IDS = Object.freeze([
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
  "hemodynamics.pressure.absolute.RV",
  "hemodynamics.pressure.absolute.PA",
  "hemodynamics.flow.valve.MV",
  "hemodynamics.flow.valve.AoV",
  "hemodynamics.flow.valve.TV",
  "hemodynamics.flow.valve.PV",
  "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
] as const);

type SignalId =
  | "LVP"
  | "AoP"
  | "RVP"
  | "PAP"
  | "MV"
  | "AoV"
  | "TV"
  | "PV"
  | "AVLocalGradient";
type Sample = Readonly<
  Record<SignalId, number> & Readonly<{ timeSec: number }>
>;

describe("Main Wire Standard67 fixed-horizon waveform morphology V1", () => {
  it("removes major left/right root ringing while retaining AV/RV timing and normal inflow structure", async () => {
    const release =
      createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1();
    const runtimeSessionId = "standard67/morphology";
    const scenarioId = "baseline";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId,
      scenarios: [{
        scenarioId,
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
      }],
    });
    try {
      const samples = await collectSamplesV1(
        release.executables.simulationAdapter,
        runtimeSessionId,
        scenarioId,
      );
      const terminal = samples.filter(
        ({ timeSec }) => timeSec > HORIZON_SEC - 3,
      );
      expect(terminal).toHaveLength(1_500);

      const av = cycleAnchoredForwardEpisodeV1(terminal, "AoV");
      const pv = cycleAnchoredForwardEpisodeV1(terminal, "PV");
      const leftCycle = terminal.slice(av.start, av.nextStart);
      const rightCycle = terminal.slice(pv.start, pv.nextStart);
      const avTiming = ventricularTimingV1(terminal, "MV", av);
      const pvTiming = ventricularTimingV1(terminal, "TV", pv);
      const avLocalMeanGradient = meanV1(
        terminal.slice(av.start, av.end + 1).map(
          ({ AVLocalGradient }) => AVLocalGradient,
        ),
      );
      const pvMeanGradient = meanV1(
        terminal.slice(pv.start, pv.end + 1).map(
          ({ RVP, PAP }) => RVP - PAP,
        ),
      );

      expect(avTiming.ejectionTimeSec).toBeGreaterThanOrEqual(0.24);
      expect(avTiming.ejectionTimeSec).toBeLessThanOrEqual(0.29);
      expect(avLocalMeanGradient).toBeGreaterThanOrEqual(1.5);
      expect(avLocalMeanGradient).toBeLessThanOrEqual(3.5);
      expect(avTiming.teiIndex).toBeGreaterThanOrEqual(0.45);
      expect(avTiming.teiIndex).toBeLessThanOrEqual(0.85);

      expect(pvTiming.ejectionTimeSec).toBeGreaterThanOrEqual(0.24);
      expect(pvTiming.ejectionTimeSec).toBeLessThanOrEqual(0.30);
      expect(pvMeanGradient).toBeGreaterThanOrEqual(3);
      expect(pvMeanGradient).toBeLessThanOrEqual(5.5);
      expect(pvTiming.teiIndex).toBeGreaterThanOrEqual(0.5);
      expect(pvTiming.teiIndex).toBeLessThanOrEqual(0.9);

      expect(significantPressurePeakCountV1(
        terminal.slice(av.start, av.end + 1),
        "AoP",
      )).toBe(1);
      expect(significantPressurePeakCountV1(
        terminal.slice(av.start, av.end + 1),
        "LVP",
      )).toBe(1);
      expect(significantPressurePeakCountV1(
        terminal.slice(pv.start, pv.end + 1),
        "RVP",
      )).toBe(1);
      expect(significantPressurePeakCountV1(rightCycle, "PAP")).toBe(1);

      expect(meaningfulFlowPeakCountV1(leftCycle, "MV")).toBe(2);
      expect(meaningfulFlowPeakCountV1(rightCycle, "TV")).toBe(2);
      for (const valveId of ["MV", "AoV", "TV", "PV"] as const) {
        expect(Math.min(...terminal.map((sample) => sample[valveId])))
          .toBeGreaterThanOrEqual(-1e-9);
      }

      const lvDpDt = pressureRateRangeV1(leftCycle, "LVP");
      const rvDpDt = pressureRateRangeV1(rightCycle, "RVP");
      expect(lvDpDt.maximum).toBeGreaterThan(0);
      expect(lvDpDt.minimum).toBeLessThan(0);
      expect(rvDpDt.maximum).toBeGreaterThan(0);
      expect(rvDpDt.minimum).toBeLessThan(0);
    } finally {
      release.executables.simulationAdapter.disposeSession(runtimeSessionId);
    }
  }, 120_000);
});

async function collectSamplesV1(
  adapter: ReturnType<
    typeof createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1
  >["executables"]["simulationAdapter"],
  runtimeSessionId: string,
  scenarioId: string,
): Promise<Sample[]> {
  const result: Sample[] = [];
  const stepCount = HORIZON_SEC / DT_SEC;
  for (let offset = 0; offset < stepCount;) {
    const count = Math.min(256, stepCount - offset);
    const batch = await adapter.advancePresentationBatch({
      runtimeSessionId,
      scenarioId,
      stepCount: count,
      presentationOutputIds: OUTPUT_IDS,
    });
    for (let row = 0; row < count; row += 1) {
      const value = (column: number): number => {
        const candidate =
          batch.outputValues[row * OUTPUT_IDS.length + column];
        if (!Number.isFinite(candidate)) {
          throw new Error(`unavailable morphology value ${row}/${column}`);
        }
        return candidate;
      };
      result.push(Object.freeze({
        timeSec: batch.acceptedTimesSec[row]!,
        LVP: value(0),
        AoP: value(1),
        RVP: value(2),
        PAP: value(3),
        MV: value(4),
        AoV: value(5),
        TV: value(6),
        PV: value(7),
        AVLocalGradient: value(8),
      }));
    }
    offset += count;
  }
  return result;
}

function cycleAnchoredForwardEpisodeV1(
  samples: readonly Sample[],
  signalId: "AoV" | "PV",
) {
  const peak = Math.max(...samples.map((sample) => sample[signalId]));
  const threshold = Math.max(1, 0.01 * peak);
  const runs: Array<readonly [number, number]> = [];
  let start: number | null = null;
  for (let index = 0; index < samples.length; index += 1) {
    if (samples[index]![signalId] > threshold && start === null) start = index;
    if (samples[index]![signalId] <= threshold && start !== null) {
      runs.push(Object.freeze([start, index - 1] as const));
      start = null;
    }
  }
  if (start !== null) runs.push(Object.freeze([start, samples.length - 1]));
  const selectedIndex = runs.length - 2;
  const selected = runs[selectedIndex];
  const next = runs[selectedIndex + 1];
  if (
    selected === undefined
    || next === undefined
    || selected[0] === 0
    || selected[1] >= samples.length - 1
  ) {
    throw new Error(`${signalId} lacks a complete cycle-anchored ejection`);
  }
  return Object.freeze({
    start: selected[0],
    end: selected[1],
    nextStart: next[0],
    threshold,
  });
}

function ventricularTimingV1(
  samples: readonly Sample[],
  inletId: "MV" | "TV",
  outlet: Readonly<{ start: number; end: number }>,
) {
  const peak = Math.max(...samples.map((sample) => sample[inletId]));
  const threshold = Math.max(1, 0.01 * peak);
  const open = samples.map((sample) => sample[inletId] > threshold);
  let inletClosure = -1;
  for (let index = outlet.start - 1; index >= 1; index -= 1) {
    if (open[index - 1] && !open[index]) {
      inletClosure = index;
      break;
    }
  }
  let inletOpening = -1;
  for (let index = outlet.end + 1; index < open.length; index += 1) {
    if (!open[index - 1] && open[index]) {
      inletOpening = index;
      break;
    }
  }
  if (inletClosure < 0 || inletOpening < 0) {
    throw new Error(`${inletId} timing transitions are unresolved`);
  }
  const isovolumicContractionTimeSec =
    (outlet.start - inletClosure) * DT_SEC;
  const ejectionTimeSec = (outlet.end - outlet.start + 1) * DT_SEC;
  const isovolumicRelaxationTimeSec =
    (inletOpening - outlet.end - 1) * DT_SEC;
  return Object.freeze({
    isovolumicContractionTimeSec,
    ejectionTimeSec,
    isovolumicRelaxationTimeSec,
    teiIndex:
      (isovolumicContractionTimeSec + isovolumicRelaxationTimeSec)
      / ejectionTimeSec,
  });
}

function significantPressurePeakCountV1(
  samples: readonly Sample[],
  signalId: "LVP" | "AoP" | "RVP" | "PAP",
): number {
  const values = samples.map((sample) => sample[signalId]);
  const threshold = Math.max(
    0.5,
    0.05 * (Math.max(...values) - Math.min(...values)),
  );
  return localMaximumIndicesV1(values).filter((index, ordinal, peaks) => {
    const left = ordinal === 0 ? 0 : peaks[ordinal - 1]!;
    const right = ordinal === peaks.length - 1
      ? values.length - 1
      : peaks[ordinal + 1]!;
    const leftMinimum = Math.min(...values.slice(left, index + 1));
    const rightMinimum = Math.min(...values.slice(index, right + 1));
    return values[index]! - Math.max(leftMinimum, rightMinimum) >= threshold;
  }).length;
}

function meaningfulFlowPeakCountV1(
  samples: readonly Sample[],
  signalId: "MV" | "TV",
): number {
  const values = samples.map((sample) => sample[signalId]);
  const peak = Math.max(...values);
  const threshold = 0.02 * peak;
  const peaks = localMaximumIndicesV1(values);
  return peaks.filter((index, ordinal) => {
    const left = ordinal === 0 ? 0 : peaks[ordinal - 1]!;
    const right = ordinal === peaks.length - 1
      ? values.length - 1
      : peaks[ordinal + 1]!;
    const prominence = values[index]! - Math.max(
      Math.min(...values.slice(left, index + 1)),
      Math.min(...values.slice(index, right + 1)),
    );
    return values[index]! > threshold && prominence >= threshold;
  }).length;
}

function localMaximumIndicesV1(values: readonly number[]): number[] {
  const result: number[] = [];
  for (let index = 1; index < values.length - 1; index += 1) {
    if (
      values[index]! > values[index - 1]!
      && values[index]! >= values[index + 1]!
    ) {
      result.push(index);
    }
  }
  return result;
}

function pressureRateRangeV1(
  samples: readonly Sample[],
  signalId: "LVP" | "RVP",
) {
  const rates = samples.slice(1).map((sample, index) =>
    (sample[signalId] - samples[index]![signalId]) / DT_SEC);
  return Object.freeze({
    maximum: Math.max(...rates),
    minimum: Math.min(...rates),
  });
}

function meanV1(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
