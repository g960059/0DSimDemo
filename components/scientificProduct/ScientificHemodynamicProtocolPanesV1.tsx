import React from "react";

/**
 * Presentation-only DTOs for the release-bound hemodynamic protocols.
 *
 * The protocol owner must perform all event detection, classification and fits.
 * These components deliberately never turn a P2/rejected point into a fitted
 * point and never infer a physiological claim from incomplete data.
 */
export type ScientificProtocolExecutionStatusV1 =
  | "idle"
  | "running"
  | "complete"
  | "partial"
  | "invalid"
  | "error";

export type ScientificProtocolQualityLevelV1 =
  | "pending"
  | "pass"
  | "warning"
  | "fail";

export type ScientificHemodynamicProtocolStatusV1 = Readonly<{
  status: ScientificProtocolExecutionStatusV1;
  label: string;
  phase?: string;
  progress?: Readonly<{
    completed: number;
    total: number;
  }>;
  qc: Readonly<{
    level: ScientificProtocolQualityLevelV1;
    summary: string;
    details?: readonly string[];
  }>;
}>;

export type ScientificGuytonSideV1 = "right" | "left";

export type ScientificGuytonCurvePointV1 = Readonly<{
  pressureMmHg: number;
  flowLPerMin: number;
}>;

export type ScientificGuytonSweepPointV1 = ScientificGuytonCurvePointV1 & Readonly<{
  id: string;
  classification:
    | "estimated"
    | "unclassified"
    | "period1"
    | "audit-suspect"
    | "period2"
    | "rejected";
  totalBloodVolumeMl?: number;
  lvPressureVolumeObservation?: Readonly<{
    endDiastolicVolumeMl: number;
    endDiastolicTransmuralPressureMmHg: number;
    endSystolicVolumeMl: number;
    endSystolicTransmuralPressureMmHg: number;
    strokeWorkMmHgMl: number;
    evidenceRole: "tbv-operating-point-observation-only";
    crossPointFitEligible: false;
  }>;
  reason?: string;
}>;

export type ScientificGuytonOperatingPointV1 = ScientificGuytonCurvePointV1 & Readonly<{
  label?: string;
}>;

export type ScientificGuytonStarlingPaneDataV1 = Readonly<{
  side: ScientificGuytonSideV1;
  title?: string;
  /** Fixed-volume vascular function curve. It is not relabelled as a pump experiment. */
  vascularReturnCurve: readonly ScientificGuytonCurvePointV1[];
  /** Raw P1 preload-family locus. P2 and rejected points stay outside this curve. */
  cardiacPreloadLocus: readonly ScientificGuytonCurvePointV1[];
  /** P1-only runs split at every P2, failed, or unresolved target. */
  cardiacPreloadSegments?: readonly (readonly ScientificGuytonCurvePointV1[])[];
  /** Provisional two-natural-beat estimate; never interpreted as settled P1. */
  estimatedCardiacSegments?: readonly (readonly ScientificGuytonCurvePointV1[])[];
  sweepPoints: readonly ScientificGuytonSweepPointV1[];
  operatingPoint?: ScientificGuytonOperatingPointV1;
  status: ScientificHemodynamicProtocolStatusV1;
  vascularCurveLabel?: string;
  cardiacCurveLabel?: string;
}>;

export type ScientificGuytonStarlingPaneV1Props = Readonly<{
  data: ScientificGuytonStarlingPaneDataV1;
  className?: string;
}>;

const CHART = Object.freeze({
  grid: "var(--wb-border)",
  axis: "var(--wb-border-strong)",
  text: "var(--wb-text-muted)",
  subtle: "var(--wb-text-subtle)",
  vascular: "#22d3ee",
  cardiac: "#fb923c",
  p1: "#60a5fa",
  audit: "#f59e0b",
  p2: "#fbbf24",
  rejected: "#f87171",
  operating: "var(--wb-text)",
});

export function ScientificGuytonStarlingPaneV1({
  data,
  className,
}: ScientificGuytonStarlingPaneV1Props) {
  const [containerRef, size] = useScientificPaneSizeV1();
  const compact = size.width < 500 || size.height < 330;
  const labels = scientificGuytonAxisLabelsV1(data.side);
  const allPoints = [
    ...data.vascularReturnCurve,
    ...data.cardiacPreloadLocus,
    ...(data.estimatedCardiacSegments?.flat() ?? []),
    ...data.sweepPoints,
    ...(data.operatingPoint ? [data.operatingPoint] : []),
  ];
  const xDomain = scientificProtocolAxisDomainV1(
    allPoints.map(({ pressureMmHg }) => pressureMmHg),
    { includeZero: true, minimumSpan: 4 },
  );
  const yDomain = scientificProtocolAxisDomainV1(
    allPoints.map(({ flowLPerMin }) => flowLPerMin),
    { includeZero: true, minimumSpan: 2, lowerBoundZeroWhenNonnegative: true },
  );
  const plot = scientificProtocolPlotRectV1(size, compact, true);
  const x = linearScaleV1(xDomain, [plot.left, plot.right]);
  const y = linearScaleV1(yDomain, [plot.bottom, plot.top]);
  const vascularPath = scientificSvgPathV1(
    data.vascularReturnCurve.map(({ pressureMmHg, flowLPerMin }) => ({
      x: x(pressureMmHg),
      y: y(flowLPerMin),
    })),
  );
  const cardiacPaths = (data.cardiacPreloadSegments
    ?? [data.cardiacPreloadLocus]).map((segment) => scientificSvgPathV1(
    segment.map(({ pressureMmHg, flowLPerMin }) => ({
      x: x(pressureMmHg),
      y: y(flowLPerMin),
    })),
  ));
  const estimatedCardiacPaths = (data.estimatedCardiacSegments ?? []).map(
    (segment) => scientificSvgPathV1(segment.map(({
      pressureMmHg,
      flowLPerMin,
    }) => ({
      x: x(pressureMmHg),
      y: y(flowLPerMin),
    }))),
  );
  const title = data.title
    ?? (data.side === "right" ? "Right-heart Guyton / Starling" : "Left-heart Guyton / Starling");

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-0 w-full overflow-hidden bg-wb-app ${className ?? ""}`}
      data-testid={`scientific-${data.side}-guyton-starling-pane-v1`}
      data-protocol-status={data.status.status}
      data-qc-level={data.status.qc.level}
    >
      <ScientificProtocolTopChromeV1
        title={title}
        status={data.status}
        compact={compact}
      />
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-labelledby={`guyton-title-${data.side} guyton-desc-${data.side}`}
      >
        <title id={`guyton-title-${data.side}`}>{title}</title>
        <desc id={`guyton-desc-${data.side}`}>
          {`${labels.xLong} against flow. Period-1 points are eligible for the preload locus; period-2-suspect and rejected points remain visibly excluded.`}
        </desc>
        <ScientificCartesianGridV1
          plot={plot}
          xDomain={xDomain}
          yDomain={yDomain}
          xLabel={labels.x}
          yLabel="Flow (L/min)"
          compact={compact}
        />
        {vascularPath && (
          <path
            d={vascularPath}
            fill="none"
            stroke={CHART.vascular}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            data-series="vascular-return"
          />
        )}
        {estimatedCardiacPaths.map((estimatedPath, segmentIndex) =>
          estimatedPath && (
            <path
              key={`estimated-cardiac-segment-${segmentIndex}`}
              d={estimatedPath}
              fill="none"
              stroke={CHART.cardiac}
              strokeWidth={1.75}
              strokeOpacity={0.52}
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              data-series="rapid-finite-hold-preview"
              data-segment-index={segmentIndex}
            />
          ))}
        {cardiacPaths.map((cardiacPath, segmentIndex) => cardiacPath && (
          <path
            key={`cardiac-preload-segment-${segmentIndex}`}
            d={cardiacPath}
            fill="none"
            stroke={CHART.cardiac}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            data-series="cardiac-preload-locus"
            data-segment-index={segmentIndex}
          />
        ))}
        {data.sweepPoints.map((point) => (
          <ScientificGuytonPointMarkerV1
            key={point.id}
            point={point}
            cx={x(point.pressureMmHg)}
            cy={y(point.flowLPerMin)}
          />
        ))}
        {data.operatingPoint && (
          <g
            transform={`translate(${x(data.operatingPoint.pressureMmHg)} ${y(data.operatingPoint.flowLPerMin)})`}
            data-marker="operating-point"
          >
            <circle r={7} fill="var(--wb-app-bg)" stroke={CHART.operating} strokeWidth={2} />
            <circle r={2.5} fill={CHART.operating} />
            <title>{data.operatingPoint.label ?? "Operating point"}</title>
          </g>
        )}
      </svg>
      <div
        className="pointer-events-none absolute left-2 top-10 flex max-w-[calc(100%-1rem)] flex-wrap gap-x-3 gap-y-1 text-[9px] font-medium text-wb-muted"
        aria-hidden="true"
      >
        <ScientificLegendLineV1 color={CHART.vascular} label={data.vascularCurveLabel ?? "Vascular return · fixed-volume PV laws"} />
        <ScientificLegendLineV1 color={CHART.cardiac} label="Rapid finite-hold estimate · not settled" dashed />
        <ScientificLegendLineV1 color={CHART.cardiac} label={data.cardiacCurveLabel ?? "Cardiac response · P1 preload locus"} />
        <ScientificLegendMarkerV1 color={CHART.p1} label="P1" />
        <ScientificLegendMarkerV1 color={CHART.audit} label="Audit warning" />
        <ScientificLegendMarkerV1 color={CHART.p2} label="P2 suspect · excluded" diamond />
        <ScientificLegendMarkerV1 color={CHART.rejected} label="Rejected" crossed />
      </div>
      <div className="pointer-events-none absolute bottom-1.5 left-2 max-w-[42%] text-[9px] leading-3 text-wb-subtle">
        {labels.xLong}. TBV sweep is shown as a one-dimensional operating locus, not a two-dimensional surface.
      </div>
      <ScientificProtocolQcCalloutV1 status={data.status} compact={compact} />
    </div>
  );
}

export function ScientificGuytonRightPaneV1({
  data,
  className,
}: Readonly<{
  data: Omit<ScientificGuytonStarlingPaneDataV1, "side">;
  className?: string;
}>) {
  return <ScientificGuytonStarlingPaneV1 data={{ ...data, side: "right" }} className={className} />;
}

export function ScientificGuytonLeftPaneV1({
  data,
  className,
}: Readonly<{
  data: Omit<ScientificGuytonStarlingPaneDataV1, "side">;
  className?: string;
}>) {
  return <ScientificGuytonStarlingPaneV1 data={{ ...data, side: "left" }} className={className} />;
}

export function scientificGuytonAxisLabelsV1(side: ScientificGuytonSideV1): Readonly<{
  x: string;
  xLong: string;
}> {
  return side === "right"
    ? Object.freeze({
      x: "Mean transmural RAP / CVP (mmHg)",
      xLong: "CVP is the cycle-mean transmural right-atrial pressure",
    })
    : Object.freeze({
      x: "Mean transmural LAP / PCWP surrogate (mmHg)",
      xLong: "PCWP surrogate is the cycle-mean transmural left-atrial pressure",
    });
}

export function scientificProtocolAxisDomainV1(
  values: readonly number[],
  options: Readonly<{
    includeZero?: boolean;
    minimumSpan?: number;
    lowerBoundZeroWhenNonnegative?: boolean;
    paddingFraction?: number;
  }> = {},
): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  let minimum = finite.length > 0 ? Math.min(...finite) : 0;
  let maximum = finite.length > 0 ? Math.max(...finite) : (options.minimumSpan ?? 1);
  if (options.includeZero) {
    minimum = Math.min(0, minimum);
    maximum = Math.max(0, maximum);
  }
  const minimumSpan = Math.max(options.minimumSpan ?? 1, Number.EPSILON);
  if (maximum - minimum < minimumSpan) {
    const center = (minimum + maximum) / 2;
    minimum = center - minimumSpan / 2;
    maximum = center + minimumSpan / 2;
  }
  const padding = (maximum - minimum) * (options.paddingFraction ?? 0.06);
  minimum -= padding;
  maximum += padding;
  if (options.lowerBoundZeroWhenNonnegative && finite.every((value) => value >= 0)) {
    minimum = 0;
  }
  return Object.freeze([minimum, maximum]);
}

export function scientificSvgPathV1(
  points: readonly Readonly<{ x: number; y: number }>[],
  close = false,
): string | null {
  const finite = points.filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y));
  if (finite.length < 2) return null;
  const commands = finite.map(({ x, y }, index) =>
    `${index === 0 ? "M" : "L"}${roundSvgV1(x)},${roundSvgV1(y)}`);
  if (close) commands.push("Z");
  return commands.join(" ");
}

function ScientificProtocolTopChromeV1({
  title,
  status,
  compact,
}: Readonly<{
  title: string;
  status: ScientificHemodynamicProtocolStatusV1;
  compact: boolean;
}>) {
  const progress = status.progress;
  const normalizedProgress = progress && progress.total > 0
    ? Math.min(1, Math.max(0, progress.completed / progress.total))
    : null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between gap-2 border-b border-wb-line/60 bg-wb-app/90 px-2 backdrop-blur-sm">
      <span className="min-w-0 truncate text-[10px] font-semibold text-wb-text">{title}</span>
      <div className="flex min-w-0 items-center gap-1.5">
        {progress && !compact && (
          <span className="truncate text-[9px] text-wb-subtle">
            {status.phase ?? `${progress.completed}/${progress.total}`}
          </span>
        )}
        <span className={scientificProtocolStatusBadgeClassV1(status.status)}>
          {status.status === "running" && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          )}
          <span className="truncate">{status.label}</span>
        </span>
      </div>
      {normalizedProgress !== null && status.status === "running" && (
        <span className="absolute inset-x-0 bottom-0 h-px bg-wb-line">
          <span
            className="block h-full bg-wb-accent transition-[width] duration-200"
            style={{ width: `${normalizedProgress * 100}%` }}
          />
        </span>
      )}
    </div>
  );
}

function ScientificProtocolQcCalloutV1({
  status,
  compact,
}: Readonly<{
  status: ScientificHemodynamicProtocolStatusV1;
  compact: boolean;
}>) {
  const details = compact ? [] : status.qc.details?.slice(0, 2) ?? [];
  return (
    <div
      className={`pointer-events-none absolute bottom-1.5 right-2 max-w-[min(22rem,52%)] rounded border px-2 py-1 text-[9px] leading-3 ${scientificQcCalloutClassV1(status.qc.level)}`}
      role="status"
      data-testid="scientific-protocol-qc-callout-v1"
    >
      <div className="font-semibold">{status.qc.summary}</div>
      {details.map((detail) => <div key={detail} className="opacity-80">{detail}</div>)}
    </div>
  );
}

function ScientificCartesianGridV1({
  plot,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  compact,
}: Readonly<{
  plot: ScientificPlotRectV1;
  xDomain: readonly [number, number];
  yDomain: readonly [number, number];
  xLabel: string;
  yLabel: string;
  compact: boolean;
}>) {
  const x = linearScaleV1(xDomain, [plot.left, plot.right]);
  const y = linearScaleV1(yDomain, [plot.bottom, plot.top]);
  const xTicks = scientificTicksV1(xDomain, compact ? 4 : 6);
  const yTicks = scientificTicksV1(yDomain, compact ? 4 : 6);
  return (
    <g aria-hidden="true">
      {xTicks.map((tick) => (
        <g key={`x-${tick}`}>
          <line x1={x(tick)} x2={x(tick)} y1={plot.top} y2={plot.bottom} stroke={CHART.grid} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={x(tick)} y={plot.bottom + 16} textAnchor="middle" fill={CHART.subtle} fontSize={9}>{formatTickV1(tick)}</text>
        </g>
      ))}
      {yTicks.map((tick) => (
        <g key={`y-${tick}`}>
          <line x1={plot.left} x2={plot.right} y1={y(tick)} y2={y(tick)} stroke={CHART.grid} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={plot.left - 7} y={y(tick) + 3} textAnchor="end" fill={CHART.subtle} fontSize={9}>{formatTickV1(tick)}</text>
        </g>
      ))}
      <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} stroke={CHART.axis} vectorEffect="non-scaling-stroke" />
      <line x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} stroke={CHART.axis} vectorEffect="non-scaling-stroke" />
      <text x={(plot.left + plot.right) / 2} y={plot.bottom + 32} textAnchor="middle" fill={CHART.text} fontSize={10}>{xLabel}</text>
      <text
        x={12}
        y={(plot.top + plot.bottom) / 2}
        textAnchor="middle"
        fill={CHART.text}
        fontSize={10}
        transform={`rotate(-90 12 ${(plot.top + plot.bottom) / 2})`}
      >
        {yLabel}
      </text>
    </g>
  );
}

function ScientificGuytonPointMarkerV1({
  point,
  cx,
  cy,
}: Readonly<{
  point: ScientificGuytonSweepPointV1;
  cx: number;
  cy: number;
}>) {
  const title = [
    point.classification === "estimated"
      ? "Estimated near-steady · predictor-assisted · P1 not established"
      : point.classification === "unclassified"
        ? "Finite two-beat hold · near-P1 gate not met"
    : point.classification === "period1"
      ? "P1 accepted"
      : point.classification === "audit-suspect"
        ? "P1 continuation · independent audit warning"
        : point.classification === "period2"
          ? "P2 suspect · excluded"
          : "Rejected",
    point.totalBloodVolumeMl === undefined ? null : `${formatNumberV1(point.totalBloodVolumeMl, 0)} mL TBV`,
    point.lvPressureVolumeObservation === undefined
      ? null
      : `LV ED ${formatNumberV1(point.lvPressureVolumeObservation.endDiastolicVolumeMl, 1)} mL / ${formatNumberV1(point.lvPressureVolumeObservation.endDiastolicTransmuralPressureMmHg, 1)} mmHg; ES ${formatNumberV1(point.lvPressureVolumeObservation.endSystolicVolumeMl, 1)} mL / ${formatNumberV1(point.lvPressureVolumeObservation.endSystolicTransmuralPressureMmHg, 1)} mmHg; SW ${formatNumberV1(point.lvPressureVolumeObservation.strokeWorkMmHgMl, 0)} mmHg·mL; observation only, no cross-point fit`,
    point.reason,
  ].filter(Boolean).join(" · ");
  if (point.classification === "period2") {
    return (
      <g transform={`translate(${cx} ${cy})`} data-point-classification="period2">
        <path d="M0,-5 L5,0 L0,5 L-5,0 Z" fill="var(--wb-app-bg)" stroke={CHART.p2} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
        <title>{title}</title>
      </g>
    );
  }
  if (point.classification === "estimated") {
    return (
      <g data-point-classification="estimated">
        <circle cx={cx} cy={cy} r={4.5} fill="var(--wb-app-bg)" stroke={CHART.cardiac} strokeWidth={1.75} strokeOpacity={0.75} vectorEffect="non-scaling-stroke" />
        <title>{title}</title>
      </g>
    );
  }
  if (point.classification === "unclassified") {
    return (
      <g data-point-classification="unclassified">
        <circle cx={cx} cy={cy} r={4.5} fill="var(--wb-app-bg)" stroke={CHART.p2} strokeWidth={1.5} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        <title>{title}</title>
      </g>
    );
  }
  if (point.classification === "rejected") {
    return (
      <g transform={`translate(${cx} ${cy})`} data-point-classification="rejected">
        <circle r={5.5} fill="var(--wb-app-bg)" stroke={CHART.rejected} strokeWidth={1} opacity={0.7} />
        <path d="M-3.5,-3.5 L3.5,3.5 M3.5,-3.5 L-3.5,3.5" stroke={CHART.rejected} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
        <title>{title}</title>
      </g>
    );
  }
  if (point.classification === "audit-suspect") {
    return (
      <g data-point-classification="audit-suspect">
        <circle cx={cx} cy={cy} r={5.5} fill="var(--wb-app-bg)" stroke={CHART.audit} strokeWidth={2} strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke" />
        <circle cx={cx} cy={cy} r={2} fill={CHART.audit} />
        <title>{title}</title>
      </g>
    );
  }
  return (
    <g data-point-classification="period1">
      <circle cx={cx} cy={cy} r={4} fill={CHART.p1} stroke="var(--wb-app-bg)" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
      <title>{title}</title>
    </g>
  );
}

function ScientificLegendLineV1({
  color,
  label,
  dashed = false,
}: Readonly<{ color: string; label: string; dashed?: boolean }>) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span
        className="h-px w-3 shrink-0"
        style={dashed
          ? { backgroundImage: `repeating-linear-gradient(to right, ${color} 0 4px, transparent 4px 7px)` }
          : { backgroundColor: color }}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

function ScientificLegendMarkerV1({
  color,
  label,
  diamond = false,
  crossed = false,
}: Readonly<{
  color: string;
  label: string;
  diamond?: boolean;
  crossed?: boolean;
}>) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`relative h-1.5 w-1.5 shrink-0 border ${diamond ? "rotate-45" : "rounded-full"}`}
        style={{ borderColor: color, backgroundColor: crossed ? "transparent" : color }}
      >
        {crossed && <span className="absolute -left-px top-[2px] h-px w-2 rotate-45" style={{ backgroundColor: color }} />}
      </span>
      {label}
    </span>
  );
}

type ScientificPaneSizeV1 = Readonly<{ width: number; height: number }>;
type ScientificPlotRectV1 = Readonly<{ left: number; right: number; top: number; bottom: number }>;

function useScientificPaneSizeV1(): readonly [
  React.RefCallback<HTMLDivElement>,
  ScientificPaneSizeV1,
] {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<ScientificPaneSizeV1>({ width: 760, height: 440 });
  React.useEffect(() => {
    if (!node) return undefined;
    const update = () => {
      const next = {
        width: Math.max(240, Math.round(node.clientWidth || 760)),
        height: Math.max(220, Math.round(node.clientHeight || 440)),
      };
      setSize((current) => current.width === next.width && current.height === next.height ? current : next);
    };
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, size] as const;
}

function scientificProtocolPlotRectV1(
  size: ScientificPaneSizeV1,
  compact: boolean,
  hasLegend: boolean,
): ScientificPlotRectV1 {
  const top = hasLegend ? (compact ? 74 : 68) : 44;
  // Reserve a real footer band for the axis label, interpretation note, and
  // QC callout. Keeping these overlays out of the plotting rectangle matters
  // in the short Workbench split panes where a 48 px footer made all three
  // compete for the same baseline.
  const bottomPadding = compact ? 96 : 108;
  return Object.freeze({
    left: compact ? 44 : 54,
    right: Math.max(compact ? 72 : 96, size.width - (compact ? 12 : 18)),
    top,
    bottom: Math.max(top + 48, size.height - bottomPadding),
  });
}

function linearScaleV1(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const denominator = Math.max(Number.EPSILON, domain[1] - domain[0]);
  const slope = (range[1] - range[0]) / denominator;
  return (value) => range[0] + (value - domain[0]) * slope;
}

function scientificTicksV1(
  domain: readonly [number, number],
  approximateCount: number,
): readonly number[] {
  const rawStep = (domain[1] - domain[0]) / Math.max(1, approximateCount);
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rawStep, Number.EPSILON)));
  const normalized = rawStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceNormalized * magnitude;
  const first = Math.ceil(domain[0] / step) * step;
  const ticks: number[] = [];
  for (let value = first; value <= domain[1] + step * 1e-9 && ticks.length < 12; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }
  return ticks;
}

function scientificProtocolStatusBadgeClassV1(status: ScientificProtocolExecutionStatusV1): string {
  const common = "inline-flex min-w-0 max-w-48 items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold";
  switch (status) {
    case "complete": return `${common} border-emerald-400/30 bg-emerald-400/10 text-emerald-300`;
    case "running": return `${common} border-wb-accent/35 bg-wb-accent-soft text-wb-accent`;
    case "partial": return `${common} border-wb-warning/35 bg-wb-warning-soft text-wb-warning`;
    case "invalid":
    case "error": return `${common} border-wb-danger/35 bg-wb-danger-soft text-wb-danger`;
    default: return `${common} border-wb-line bg-wb-input text-wb-muted`;
  }
}

function scientificQcCalloutClassV1(level: ScientificProtocolQualityLevelV1): string {
  switch (level) {
    case "pass": return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    case "warning": return "border-wb-warning/30 bg-wb-warning-soft text-wb-warning";
    case "fail": return "border-wb-danger/30 bg-wb-danger-soft text-wb-danger";
    default: return "border-wb-line bg-wb-panel/88 text-wb-muted backdrop-blur-sm";
  }
}

function roundSvgV1(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function formatTickV1(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 100) return value.toFixed(0);
  if (absolute >= 10) return value.toFixed(1).replace(/\.0$/, "");
  return value.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatNumberV1(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}
