import React from "react";

import {
  finiteWorkbenchScalarValueV3,
  type WorkbenchScalarSampleV3,
} from "./WorkbenchScalarSampleV3";
import {
  observedNumericDomainV3,
  positiveModuloV3,
  type WorkbenchNumericDomainV3,
} from "./SweepingWaveformCanvasV3";
import {
  scaleLinearV3,
  useResponsiveCanvasFrameV3,
} from "./WorkbenchCanvasRuntimeV3";

export type WorkbenchPvPressureBasisV3 = "transmural" | "intracavitary";

export type WorkbenchPvPointV3 = Readonly<{
  acceptedTimeSec: number;
  cyclePhase01: number;
  volumeMl: number;
  pressureMmHg: number;
}>;

export type WorkbenchPvGuidePointV3 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

export const SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3 =
  "single-beat-orientation-references-not-formal-pressure-volume-relations" as const;

export type SingleBeatPvOrientationGuidesV3 = Readonly<{
  semantics: typeof SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3;
  pressureBasis: "transmural";
  endSystolicRadialReference: readonly WorkbenchPvGuidePointV3[];
  klotzInformedDiastolicReference: readonly WorkbenchPvGuidePointV3[];
  systolicReferenceContact: WorkbenchPvGuidePointV3;
  maximumVolumeContact: WorkbenchPvGuidePointV3;
}>;

export type CompleteCycleRangeV3 = Readonly<{
  startIndex: number;
  endIndexInclusive: number;
}>;

const CYCLE_PHASE_EPSILON_V3 = 1e-6;
const CYCLE_START_TOLERANCE_V3 = 0.03;
const MINIMUM_COMPLETE_CYCLE_PHASE_SPAN_V3 = 0.8;
const KLOTZ_NORMALIZED_PRESSURE_MMHG_V3 = 28.2;
const KLOTZ_NORMALIZED_EXPONENT_V3 = 2.79;

/**
 * Locates the newest complete model-emitted cycle. The true next-cycle
 * boundary sample is included; renderers must not add a synthetic closing
 * segment when a transient beat's two boundary states differ.
 */
export function lastCompleteCycleRangeV3(
  samples: readonly WorkbenchScalarSampleV3[],
): CompleteCycleRangeV3 | null {
  if (samples.length < 3) return null;
  const boundaries: number[] = [];
  const firstPhase = normalizedModelCyclePhaseV3(samples[0]?.cyclePhase01);
  if (firstPhase !== null && firstPhase <= CYCLE_START_TOLERANCE_V3) {
    boundaries.push(0);
  }

  let previousPhase = firstPhase;
  for (let index = 1; index < samples.length; index += 1) {
    const phase = normalizedModelCyclePhaseV3(samples[index]?.cyclePhase01);
    if (phase === null) {
      boundaries.length = 0;
      previousPhase = null;
      continue;
    }
    if (previousPhase === null && phase <= CYCLE_START_TOLERANCE_V3) {
      boundaries.push(index);
    }
    if (
      previousPhase !== null
      && phase + CYCLE_PHASE_EPSILON_V3 < previousPhase
    ) {
      boundaries.push(index);
    }
    previousPhase = phase;
  }
  if (boundaries.length < 2) return null;
  const startIndex = boundaries.at(-2)!;
  const endIndexInclusive = boundaries.at(-1)!;
  if (endIndexInclusive - startIndex < 3) return null;
  const phases = samples
    .slice(startIndex, endIndexInclusive)
    .flatMap(({ cyclePhase01 }) => {
      const phase = normalizedModelCyclePhaseV3(cyclePhase01);
      return phase === null ? [] : [phase];
    });
  if (
    phases.length < 3
    || Math.max(...phases) - Math.min(...phases)
      < MINIMUM_COMPLETE_CYCLE_PHASE_SPAN_V3
  ) return null;
  return Object.freeze({ startIndex, endIndexInclusive });
}

export function extractLastCompletePvBeatV3(
  samples: readonly WorkbenchScalarSampleV3[],
  volumeOutputId: string,
  pressureOutputId: string,
): readonly WorkbenchPvPointV3[] {
  const ordered = samples
    .filter(({ acceptedTimeSec }) => Number.isFinite(acceptedTimeSec))
    .slice()
    .sort((left, right) => left.acceptedTimeSec - right.acceptedTimeSec);
  const range = lastCompleteCycleRangeV3(ordered);
  if (range === null) return Object.freeze([]);
  const points = ordered
    .slice(range.startIndex, range.endIndexInclusive + 1)
    .flatMap((sample) => {
      const cyclePhase01 = normalizedModelCyclePhaseV3(sample.cyclePhase01);
      const volumeMl = finiteWorkbenchScalarValueV3(sample, volumeOutputId);
      const pressureMmHg = finiteWorkbenchScalarValueV3(
        sample,
        pressureOutputId,
      );
      if (
        cyclePhase01 === null
        || volumeMl === null
        || pressureMmHg === null
      ) return [];
      return [Object.freeze({
        acceptedTimeSec: sample.acceptedTimeSec,
        cyclePhase01,
        volumeMl,
        pressureMmHg,
      })];
    });
  return points.length >= 3 ? Object.freeze(points) : Object.freeze([]);
}

/**
 * Creates familiar single-beat orientation guides. It intentionally fails
 * closed for intracavitary pressure because both formulas require transmural
 * pressure. The result is never a formal multi-load ESPVR/EDPVR fit.
 */
export function buildSingleBeatPvOrientationGuidesV3(
  beat: readonly WorkbenchPvPointV3[],
  pressureBasis: WorkbenchPvPressureBasisV3,
): SingleBeatPvOrientationGuidesV3 | null {
  if (pressureBasis !== "transmural" || beat.length < 3) return null;
  const finite = beat.filter((point) =>
    Number.isFinite(point.volumeMl)
    && Number.isFinite(point.pressureMmHg)
    && point.volumeMl > 1e-6);
  if (finite.length < 3) return null;
  const maximumPressure = Math.max(...finite.map(({ pressureMmHg }) =>
    pressureMmHg));
  const maximumVolume = Math.max(...finite.map(({ volumeMl }) => volumeMl));
  const systolicCandidates = finite.filter((point) =>
    point.pressureMmHg > 0
    && point.pressureMmHg >= 0.5 * maximumPressure
    && point.volumeMl <= 0.98 * maximumVolume);
  const systolicReference = maximumByV3(
    systolicCandidates.length > 0 ? systolicCandidates : finite,
    (point) => point.pressureMmHg / point.volumeMl,
  );
  const maximumVolumeReference = maximumByV3(
    finite,
    (point) => point.volumeMl - Math.max(0, point.pressureMmHg) * 1e-9,
  );
  if (
    systolicReference === null
    || maximumVolumeReference === null
    || !(systolicReference.pressureMmHg > 0)
    || !(maximumVolumeReference.pressureMmHg > 0)
    || !(maximumVolumeReference.pressureMmHg < 30)
  ) return null;

  // Origin-to-contact is an explicit radial display convention. It is not a
  // fitted V0 or a single-beat/multi-load ESPVR estimator.
  const orientationElastance = systolicReference.pressureMmHg
    / systolicReference.volumeMl;
  const radialEndVolumeMl = Math.max(
    maximumVolume * 1.15,
    systolicReference.volumeMl * 1.2,
  );
  const endSystolicRadialReference = sampleGuideCurveV3(
    0,
    radialEndVolumeMl,
    (volumeMl) => orientationElastance * volumeMl,
    64,
  );

  // Klotz-informed normalized filling guide, anchored at this beat's
  // maximum-volume point. The model does not yet emit a formal ED event, so
  // this is a presentation reference rather than an EDPVR estimate.
  const diastolicV0Ml = clampV3(
    maximumVolumeReference.volumeMl
      * (0.6 - 0.006 * maximumVolumeReference.pressureMmHg),
    0,
    Math.max(0, maximumVolumeReference.volumeMl - 1e-6),
  );
  const diastolicSpanMl = Math.max(
    1e-6,
    maximumVolumeReference.volumeMl - diastolicV0Ml,
  );
  const diastolicV30Ml = diastolicV0Ml + diastolicSpanMl
    / Math.pow(
      maximumVolumeReference.pressureMmHg
        / KLOTZ_NORMALIZED_PRESSURE_MMHG_V3,
      1 / KLOTZ_NORMALIZED_EXPONENT_V3,
    );
  const diastolicV30SpanMl = Math.max(
    1e-6,
    diastolicV30Ml - diastolicV0Ml,
  );
  const diastolicEndVolumeMl = Math.max(
    maximumVolumeReference.volumeMl * 1.12,
    Math.min(
      maximumVolumeReference.volumeMl * 1.28,
      diastolicV0Ml + diastolicSpanMl
        * Math.pow(
          Math.max(30, maximumVolumeReference.pressureMmHg * 2.4)
            / maximumVolumeReference.pressureMmHg,
          1 / KLOTZ_NORMALIZED_EXPONENT_V3,
        ),
    ),
  );
  const klotzInformedDiastolicReference = sampleGuideCurveV3(
    diastolicV0Ml,
    diastolicEndVolumeMl,
    (volumeMl) => KLOTZ_NORMALIZED_PRESSURE_MMHG_V3
      * Math.pow(
        Math.max(0, (volumeMl - diastolicV0Ml) / diastolicV30SpanMl),
        KLOTZ_NORMALIZED_EXPONENT_V3,
      ),
    64,
  );

  const systolicReferenceContact = Object.freeze({
    volumeMl: systolicReference.volumeMl,
    pressureMmHg: systolicReference.pressureMmHg,
  });
  const maximumVolumeContact = Object.freeze({
    volumeMl: maximumVolumeReference.volumeMl,
    pressureMmHg: maximumVolumeReference.pressureMmHg,
  });
  return Object.freeze({
    semantics: SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3,
    pressureBasis: "transmural" as const,
    endSystolicRadialReference: withExactContactV3(
      endSystolicRadialReference,
      systolicReferenceContact,
    ),
    klotzInformedDiastolicReference: withExactContactV3(
      klotzInformedDiastolicReference,
      maximumVolumeContact,
    ),
    systolicReferenceContact,
    maximumVolumeContact,
  });
}

export function PressureVolumeLoopCanvasV3({
  samples,
  volumeOutputId,
  pressureOutputId,
  pressureBasis,
  chamberLabel = "LV",
  color = "#a78bfa",
  showSingleBeatOrientationGuides = true,
  className,
}: Readonly<{
  samples: readonly WorkbenchScalarSampleV3[];
  volumeOutputId: string;
  pressureOutputId: string;
  pressureBasis: WorkbenchPvPressureBasisV3;
  chamberLabel?: string;
  color?: string;
  showSingleBeatOrientationGuides?: boolean;
  className?: string;
}>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const beat = React.useMemo(() => extractLastCompletePvBeatV3(
    samples,
    volumeOutputId,
    pressureOutputId,
  ), [pressureOutputId, samples, volumeOutputId]);
  const guides = React.useMemo(() => showSingleBeatOrientationGuides
    ? buildSingleBeatPvOrientationGuidesV3(beat, pressureBasis)
    : null, [beat, pressureBasis, showSingleBeatOrientationGuides]);

  const draw = React.useCallback((
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const theme = readPvCanvasThemeV3(containerRef.current);
    const plot = pvPlotRectV3(width, height);
    const domainPoints = [
      ...beat,
      ...(guides?.endSystolicRadialReference ?? []),
      ...(guides?.klotzInformedDiastolicReference ?? []),
    ];
    const volumeDomain = paddedPvDomainV3(
      domainPoints.map(({ volumeMl }) => volumeMl),
      true,
    );
    const pressureDomain = paddedPvDomainV3(
      domainPoints.map(({ pressureMmHg }) => pressureMmHg),
      true,
    );
    drawPvAxesV3(
      context,
      plot,
      volumeDomain,
      pressureDomain,
      theme,
    );
    const x = (value: number) => scaleLinearV3(
      value,
      volumeDomain[0],
      volumeDomain[1],
      plot.left,
      plot.right,
    );
    const y = (value: number) => scaleLinearV3(
      value,
      pressureDomain[0],
      pressureDomain[1],
      plot.bottom,
      plot.top,
    );

    if (guides !== null) {
      drawPvCurveV3(context, guides.endSystolicRadialReference, x, y, {
        color: theme.systolicReference,
        width: 1.35,
        dash: [6, 4],
      });
      drawPvCurveV3(context, guides.klotzInformedDiastolicReference, x, y, {
        color: theme.diastolicReference,
        width: 1.35,
        dash: [3, 4],
      });
    }
    drawPvCurveV3(context, beat, x, y, {
      color,
      width: 2,
      dash: [],
    });

    if (beat.length === 0) {
      context.save();
      context.fillStyle = theme.text;
      context.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        "Collecting a complete model-emitted cycle…",
        (plot.left + plot.right) / 2,
        (plot.top + plot.bottom) / 2,
      );
      context.restore();
    }
  }, [beat, color, guides]);

  useResponsiveCanvasFrameV3(
    containerRef,
    canvasRef,
    draw,
  );

  const guideStatus = guides !== null
    ? "Orientation references only · not formal ESPVR/EDPVR relations"
    : pressureBasis === "intracavitary" && showSingleBeatOrientationGuides
      ? "PV orientation references require transmural pressure"
      : null;

  return (
    <div
      ref={containerRef}
      className={`relative min-h-52 h-full w-full overflow-hidden ${className ?? ""}`}
      data-chart-kind="pressure-volume-loop-v3"
      data-cycle-source="model-emitted-cycle-phase"
      data-orientation-guide-semantics={guides?.semantics ?? "unavailable"}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label={`${chamberLabel} pressure-volume loop from the last complete model-emitted cycle`}
      />
      <div className="pointer-events-none absolute left-12 top-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-wb-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-3" style={{ backgroundColor: color }} />
          {chamberLabel} loop
        </span>
        {guides !== null && (
          <>
            <span className="text-fuchsia-300">End-systolic radial reference</span>
            <span className="text-cyan-300">Klotz-informed diastolic reference</span>
          </>
        )}
      </div>
      {guideStatus !== null && (
        <div className="pointer-events-none absolute bottom-1.5 right-2 max-w-[70%] text-right text-[9px] leading-3 text-wb-subtle">
          {guideStatus}
        </div>
      )}
    </div>
  );
}

type PvPlotRectV3 = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

type PvCanvasThemeV3 = Readonly<{
  grid: string;
  axis: string;
  text: string;
  systolicReference: string;
  diastolicReference: string;
}>;

function normalizedModelCyclePhaseV3(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return positiveModuloV3(value, 1);
}

function paddedPvDomainV3(
  values: readonly number[],
  includeZero: boolean,
): WorkbenchNumericDomainV3 {
  return observedNumericDomainV3(values, {
    includeZero,
    paddingFraction: 0.08,
  });
}

function sampleGuideCurveV3(
  startVolumeMl: number,
  endVolumeMl: number,
  pressureAtVolume: (volumeMl: number) => number,
  sampleCount: number,
): readonly WorkbenchPvGuidePointV3[] {
  const count = Math.max(2, Math.floor(sampleCount));
  const points = Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    const volumeMl = startVolumeMl
      + ratio * (endVolumeMl - startVolumeMl);
    return Object.freeze({
      volumeMl,
      pressureMmHg: pressureAtVolume(volumeMl),
    });
  });
  return Object.freeze(points);
}

function withExactContactV3(
  points: readonly WorkbenchPvGuidePointV3[],
  contact: WorkbenchPvGuidePointV3,
): readonly WorkbenchPvGuidePointV3[] {
  if (points.length === 0) return Object.freeze([contact]);
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  points.forEach(({ volumeMl }, index) => {
    const distance = Math.abs(volumeMl - contact.volumeMl);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return Object.freeze(points.map((point, index) =>
    index === closestIndex ? contact : point));
}

function maximumByV3<T>(
  values: readonly T[],
  score: (value: T) => number,
): T | null {
  let best: T | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    const candidate = score(value);
    if (!Number.isFinite(candidate) || candidate <= bestScore) continue;
    best = value;
    bestScore = candidate;
  }
  return best;
}

function pvPlotRectV3(width: number, height: number): PvPlotRectV3 {
  const left = Math.min(58, width * 0.24);
  const top = Math.min(34, height * 0.22);
  return Object.freeze({
    left,
    right: Math.max(left + 1, width - 16),
    top,
    bottom: Math.max(top + 1, height - 34),
  });
}

function drawPvAxesV3(
  context: CanvasRenderingContext2D,
  plot: PvPlotRectV3,
  volumeDomain: WorkbenchNumericDomainV3,
  pressureDomain: WorkbenchNumericDomainV3,
  theme: PvCanvasThemeV3,
): void {
  context.save();
  context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = theme.text;
  context.strokeStyle = theme.grid;
  context.lineWidth = 1;
  for (let ordinal = 0; ordinal <= 4; ordinal += 1) {
    const ratio = ordinal / 4;
    const x = plot.left + ratio * (plot.right - plot.left);
    const y = plot.bottom - ratio * (plot.bottom - plot.top);
    context.beginPath();
    context.moveTo(x, plot.top);
    context.lineTo(x, plot.bottom);
    context.stroke();
    context.beginPath();
    context.moveTo(plot.left, y);
    context.lineTo(plot.right, y);
    context.stroke();
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(
      formatPvAxisNumberV3(
        volumeDomain[0] + ratio * (volumeDomain[1] - volumeDomain[0]),
      ),
      x,
      plot.bottom + 7,
    );
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillText(
      formatPvAxisNumberV3(
        pressureDomain[0] + ratio * (pressureDomain[1] - pressureDomain[0]),
      ),
      plot.left - 6,
      y,
    );
  }
  context.strokeStyle = theme.axis;
  context.strokeRect(
    plot.left,
    plot.top,
    plot.right - plot.left,
    plot.bottom - plot.top,
  );
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillText(
    "Volume (mL)",
    (plot.left + plot.right) / 2,
    plot.bottom + 31,
  );
  context.save();
  context.translate(12, (plot.top + plot.bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.fillText("Pressure (mmHg)", 0, 0);
  context.restore();
  context.restore();
}

function drawPvCurveV3<T extends Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>>(
  context: CanvasRenderingContext2D,
  points: readonly T[],
  x: (value: number) => number,
  y: (value: number) => number,
  style: Readonly<{
    color: string;
    width: number;
    dash: readonly number[];
  }>,
): void {
  if (points.length === 0) return;
  context.save();
  context.strokeStyle = style.color;
  context.lineWidth = style.width;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.setLineDash([...style.dash]);
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(x(point.volumeMl), y(point.pressureMmHg));
    else context.lineTo(x(point.volumeMl), y(point.pressureMmHg));
  });
  context.stroke();
  context.restore();
}

function readPvCanvasThemeV3(element: HTMLElement | null): PvCanvasThemeV3 {
  if (element === null || typeof getComputedStyle !== "function") {
    return fallbackPvCanvasThemeV3();
  }
  const styles = getComputedStyle(element);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return Object.freeze({
    grid: read("--wb-border", "rgba(148, 163, 184, 0.18)"),
    axis: read("--wb-border-strong", "rgba(148, 163, 184, 0.48)"),
    text: read("--wb-text-muted", "#94a3b8"),
    systolicReference: "#e879f9",
    diastolicReference: "#67e8f9",
  });
}

function fallbackPvCanvasThemeV3(): PvCanvasThemeV3 {
  return Object.freeze({
    grid: "rgba(148, 163, 184, 0.18)",
    axis: "rgba(148, 163, 184, 0.48)",
    text: "#94a3b8",
    systolicReference: "#e879f9",
    diastolicReference: "#67e8f9",
  });
}

function formatPvAxisNumberV3(value: number): string {
  return Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
}

function clampV3(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
