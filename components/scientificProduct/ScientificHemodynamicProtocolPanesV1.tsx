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
  classification: "period1" | "audit-suspect" | "period2" | "rejected";
  totalBloodVolumeMl?: number;
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
  sweepPoints: readonly ScientificGuytonSweepPointV1[];
  operatingPoint?: ScientificGuytonOperatingPointV1;
  status: ScientificHemodynamicProtocolStatusV1;
  vascularCurveLabel?: string;
  cardiacCurveLabel?: string;
}>;

export type ScientificPvPointV1 = Readonly<{
  volumeMl: number;
  transmuralPressureMmHg: number;
}>;

export type ScientificPvAnchorV1 = ScientificPvPointV1 & Readonly<{
  event: "end-diastole" | "end-systole";
}>;

export type ScientificPvRelationBeatV1 = Readonly<{
  id: string;
  points: readonly ScientificPvPointV1[];
  classification:
    | "fit-eligible"
    | "alternans-suspect-high"
    | "alternans-suspect-low"
    | "rejected";
  endDiastolic?: ScientificPvAnchorV1;
  endSystolic?: ScientificPvAnchorV1;
  rejectionReason?: string;
}>;

export type ScientificPvFitCurveV1 = Readonly<{
  points: readonly ScientificPvPointV1[];
  rSquared?: number;
  rmseMmHg?: number;
}>;

export type ScientificEspvrResultV1 = Readonly<{
  status: "valid" | "invalid" | "not-run";
  linear?: ScientificPvFitCurveV1 & Readonly<{
    endSystolicElastanceMmHgPerMl: number;
    volumeAxisInterceptMl: number;
  }>;
  quadraticSensitivity?: ScientificPvFitCurveV1 & Readonly<{
    rmseImprovementPercent?: number;
    localSlopeVariationPercent?: number;
  }>;
  invalidReason?: string;
}>;

export type ScientificEdpvrResultV1 = Readonly<{
  status: "valid" | "invalid" | "not-run";
  exponential?: ScientificPvFitCurveV1 & Readonly<{
    pressureOffsetMmHg: number;
    alphaMmHg: number;
    betaPerMl: number;
    referenceVolumeMl: number;
    baselineTangentStiffnessMmHgPerMl?: number;
  }>;
  invalidReason?: string;
}>;

export type ScientificPrswResultV1 = Readonly<{
  status: "valid" | "invalid" | "not-run";
  slopeMmHg?: number;
  volumeAxisInterceptMl?: number;
  rSquared?: number;
  invalidReason?: string;
}>;

export type ScientificPvRelationPaneDataV1 = Readonly<{
  title?: string;
  chamberLabel?: string;
  beats: readonly ScientificPvRelationBeatV1[];
  espvr: ScientificEspvrResultV1;
  edpvr: ScientificEdpvrResultV1;
  prsw: ScientificPrswResultV1;
  status: ScientificHemodynamicProtocolStatusV1;
  invalidReason?: string;
}>;

export type ScientificHemodynamicProtocolPaneDataV1 =
  | Readonly<{ kind: "guyton-starling"; data: ScientificGuytonStarlingPaneDataV1 }>
  | Readonly<{ kind: "pv-relations"; data: ScientificPvRelationPaneDataV1 }>;

export type ScientificGuytonStarlingPaneV1Props = Readonly<{
  data: ScientificGuytonStarlingPaneDataV1;
  className?: string;
}>;

export type ScientificPvRelationPaneV1Props = Readonly<{
  data: ScientificPvRelationPaneDataV1;
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
  es: "#fb923c",
  ed: "#c084fc",
  espvr: "#38bdf8",
  edpvr: "#e879f9",
  loop: "#60a5fa",
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

export function ScientificPvRelationPaneV1({
  data,
  className,
}: ScientificPvRelationPaneV1Props) {
  const [containerRef, size] = useScientificPaneSizeV1();
  const compact = size.width < 520 || size.height < 350;
  const allPoints = [
    ...data.beats.flatMap(({ points }) => points),
    ...(data.espvr.linear?.points ?? []),
    ...(data.espvr.quadraticSensitivity?.points ?? []),
    ...(data.edpvr.exponential?.points ?? []),
  ];
  const xDomain = scientificProtocolAxisDomainV1(
    allPoints.map(({ volumeMl }) => volumeMl),
    { includeZero: true, minimumSpan: 20, lowerBoundZeroWhenNonnegative: true },
  );
  const yDomain = scientificProtocolAxisDomainV1(
    allPoints.map(({ transmuralPressureMmHg }) => transmuralPressureMmHg),
    { includeZero: true, minimumSpan: 20, lowerBoundZeroWhenNonnegative: true },
  );
  const plot = scientificProtocolPlotRectV1(size, compact, true);
  const x = linearScaleV1(xDomain, [plot.left, plot.right]);
  const y = linearScaleV1(yDomain, [plot.bottom, plot.top]);
  const title = data.title ?? `${data.chamberLabel ?? "LV"} pressure–volume relations`;
  const displayInvalidReason = data.invalidReason
    ?? firstDefinedV1(
      data.espvr.status === "invalid" ? data.espvr.invalidReason : undefined,
      data.edpvr.status === "invalid" ? data.edpvr.invalidReason : undefined,
      data.prsw.status === "invalid" ? data.prsw.invalidReason : undefined,
    );

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-0 w-full overflow-hidden bg-wb-app ${className ?? ""}`}
      data-testid="scientific-pv-relation-pane-v1"
      data-protocol-status={data.status.status}
      data-qc-level={data.status.qc.level}
      data-fit-valid={displayInvalidReason ? "false" : "true"}
    >
      <ScientificProtocolTopChromeV1 title={title} status={data.status} compact={compact} />
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-labelledby="pv-relations-title pv-relations-desc"
      >
        <title id="pv-relations-title">{title}</title>
        <desc id="pv-relations-desc">
          Multi-beat pressure-volume loops using transmural pressure, with end-systolic and end-diastolic anchors and independently validated relation fits.
        </desc>
        <ScientificCartesianGridV1
          plot={plot}
          xDomain={xDomain}
          yDomain={yDomain}
          xLabel="Volume (mL)"
          yLabel="Transmural pressure (mmHg)"
          compact={compact}
        />
        {data.beats.map((beat, index) => {
          const path = scientificSvgPathV1(beat.points.map((point) => ({
            x: x(point.volumeMl),
            y: y(point.transmuralPressureMmHg),
          })), true);
          const style = scientificPvBeatStyleV1(beat.classification, index, data.beats.length);
          return path ? (
            <path
              key={beat.id}
              d={path}
              fill="none"
              stroke={style.color}
              strokeWidth={style.width}
              strokeOpacity={style.opacity}
              strokeDasharray={style.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              data-beat-classification={beat.classification}
            >
              <title>{beat.rejectionReason ? `${beat.id}: ${beat.rejectionReason}` : beat.id}</title>
            </path>
          ) : null;
        })}
        <ScientificPvFitPathV1
          points={data.espvr.linear?.points}
          x={x}
          y={y}
          color={CHART.espvr}
          width={data.espvr.status === "valid" ? 2.4 : 1.7}
          dash={data.espvr.status === "valid" ? undefined : "4 3"}
          opacity={data.espvr.status === "valid" ? 1 : 0.58}
          dataSeries="espvr-linear"
        />
        <ScientificPvFitPathV1
          points={data.espvr.quadraticSensitivity?.points}
          x={x}
          y={y}
          color={CHART.espvr}
          width={1.5}
          dash={data.espvr.status === "valid" ? "5 4" : "2 4"}
          opacity={data.espvr.status === "valid" ? 0.72 : 0.48}
          dataSeries="espvr-quadratic-sensitivity"
        />
        <ScientificPvFitPathV1
          points={data.edpvr.exponential?.points}
          x={x}
          y={y}
          color={CHART.edpvr}
          width={2.2}
          dataSeries="edpvr-exponential"
        />
        {data.beats.flatMap((beat) => [
          beat.endDiastolic ? (
            <ScientificPvAnchorMarkerV1
              key={`${beat.id}-ed`}
              anchor={beat.endDiastolic}
              cx={x(beat.endDiastolic.volumeMl)}
              cy={y(beat.endDiastolic.transmuralPressureMmHg)}
              excluded={beat.classification !== "fit-eligible"}
            />
          ) : null,
          beat.endSystolic ? (
            <ScientificPvAnchorMarkerV1
              key={`${beat.id}-es`}
              anchor={beat.endSystolic}
              cx={x(beat.endSystolic.volumeMl)}
              cy={y(beat.endSystolic.transmuralPressureMmHg)}
              excluded={beat.classification !== "fit-eligible"}
            />
          ) : null,
        ])}
      </svg>
      <div
        className="pointer-events-none absolute left-2 top-10 flex max-w-[calc(100%-1rem)] flex-wrap gap-x-3 gap-y-1 text-[9px] font-medium text-wb-muted"
        aria-hidden="true"
      >
        <ScientificLegendLineV1 color={CHART.loop} label="Raw transient PV loops" />
        <ScientificLegendMarkerV1 color={CHART.p2} label="Alternans suspect · excluded" diamond />
        <ScientificLegendMarkerV1 color={CHART.es} label="ES · aortic closure" />
        <ScientificLegendMarkerV1 color={CHART.ed} label="ED · low-flow onset surrogate" />
        <ScientificLegendLineV1
          color={CHART.espvr}
          label={data.espvr.status === "invalid" && data.espvr.linear
            ? "ESPVR diagnostic · QC rejected"
            : "ESPVR"}
        />
        <ScientificLegendLineV1 color={CHART.edpvr} label="EDPVR" />
      </div>
      <ScientificPvRelationSummaryV1 data={data} compact={compact} />
      {displayInvalidReason ? (
        <div
          className="pointer-events-none absolute bottom-1.5 left-2 max-w-[min(40rem,calc(100%-1rem))] rounded border border-wb-danger/35 bg-wb-danger-soft px-2 py-1 text-[9px] leading-3 text-wb-danger"
          role="status"
          data-testid="scientific-pv-relation-invalid-reason-v1"
        >
          <span className="font-semibold">Fit withheld.</span> {displayInvalidReason}
        </div>
      ) : (
        <ScientificProtocolQcCalloutV1 status={data.status} compact={compact} />
      )}
    </div>
  );
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

function ScientificPvRelationSummaryV1({
  data,
  compact,
}: Readonly<{
  data: ScientificPvRelationPaneDataV1;
  compact: boolean;
}>) {
  const linear = data.espvr.linear;
  const exponential = data.edpvr.exponential;
  const quadratic = data.espvr.quadraticSensitivity;
  const rows = [
    linear
      ? `${data.espvr.status === "valid" ? "Ees" : "Diagnostic Ees"} ${formatNumberV1(linear.endSystolicElastanceMmHgPerMl, 2)} mmHg/mL · V₀ ${formatNumberV1(linear.volumeAxisInterceptMl, 1)} mL${linear.rSquared === undefined ? "" : ` · R² ${formatNumberV1(linear.rSquared, 3)}`}`
      : "ESPVR unavailable",
    exponential
      ? `EDPVR β ${formatNumberV1(exponential.betaPerMl, 3)} /mL${exponential.baselineTangentStiffnessMmHgPerMl === undefined ? "" : ` · kED ${formatNumberV1(exponential.baselineTangentStiffnessMmHgPerMl, 2)} mmHg/mL`}`
      : "EDPVR unavailable",
    data.prsw.status === "valid" && data.prsw.slopeMmHg !== undefined
      ? `PRSW Mw ${formatNumberV1(data.prsw.slopeMmHg, 1)} mmHg${data.prsw.rSquared === undefined ? "" : ` · R² ${formatNumberV1(data.prsw.rSquared, 3)}`}`
      : `PRSW ${data.prsw.status}`,
    quadratic && !compact
      ? `Quadratic sensitivity${quadratic.rmseImprovementPercent === undefined ? "" : ` · RMSE −${formatNumberV1(quadratic.rmseImprovementPercent, 1)}%`}${quadratic.localSlopeVariationPercent === undefined ? "" : ` · local slope Δ ${formatNumberV1(quadratic.localSlopeVariationPercent, 1)}%`}`
      : null,
  ].filter((row): row is string => row !== null);
  return (
    <div
      className="pointer-events-none absolute right-2 top-10 max-w-[min(24rem,56%)] rounded border border-wb-line bg-wb-panel/88 px-2 py-1 text-[9px] leading-3 text-wb-muted backdrop-blur-sm"
      data-testid="scientific-pv-relation-summary-v1"
    >
      {rows.slice(0, compact ? 2 : rows.length).map((row) => <div key={row}>{row}</div>)}
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
    point.classification === "period1"
      ? "P1 accepted"
      : point.classification === "audit-suspect"
        ? "P1 continuation · independent audit warning"
        : point.classification === "period2"
          ? "P2 suspect · excluded"
          : "Rejected",
    point.totalBloodVolumeMl === undefined ? null : `${formatNumberV1(point.totalBloodVolumeMl, 0)} mL TBV`,
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

function ScientificPvAnchorMarkerV1({
  anchor,
  cx,
  cy,
  excluded,
}: Readonly<{
  anchor: ScientificPvAnchorV1;
  cx: number;
  cy: number;
  excluded: boolean;
}>) {
  const color = anchor.event === "end-systole" ? CHART.es : CHART.ed;
  return (
    <g data-anchor-event={anchor.event} data-anchor-excluded={excluded ? "true" : "false"}>
      <circle
        cx={cx}
        cy={cy}
        r={3.8}
        fill={excluded ? "var(--wb-app-bg)" : color}
        stroke={color}
        strokeWidth={excluded ? 1.2 : 0.8}
        strokeDasharray={excluded ? "2 1" : undefined}
        opacity={excluded ? 0.55 : 1}
        vectorEffect="non-scaling-stroke"
      />
      <title>{`${anchor.event === "end-systole" ? "End systole · aortic closure" : "End diastole · maximum-volume low-flow onset surrogate"}${excluded ? " · excluded from fit" : ""}`}</title>
    </g>
  );
}

function ScientificPvFitPathV1({
  points,
  x,
  y,
  color,
  width,
  dash,
  opacity = 1,
  dataSeries,
}: Readonly<{
  points?: readonly ScientificPvPointV1[];
  x: (value: number) => number;
  y: (value: number) => number;
  color: string;
  width: number;
  dash?: string;
  opacity?: number;
  dataSeries: string;
}>) {
  if (!points) return null;
  const path = scientificSvgPathV1(points.map((point) => ({
    x: x(point.volumeMl),
    y: y(point.transmuralPressureMmHg),
  })));
  return path ? (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      data-series={dataSeries}
    />
  ) : null;
}

function ScientificLegendLineV1({ color, label }: Readonly<{ color: string; label: string }>) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="h-px w-3 shrink-0" style={{ backgroundColor: color }} />
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

function scientificPvBeatStyleV1(
  classification: ScientificPvRelationBeatV1["classification"],
  index: number,
  beatCount: number,
): Readonly<{ color: string; opacity: number; width: number; dash?: string }> {
  const recency = beatCount <= 1 ? 1 : (index + 1) / beatCount;
  if (classification === "rejected") {
    return Object.freeze({ color: CHART.rejected, opacity: 0.34, width: 1.2, dash: "3 3" });
  }
  if (classification === "alternans-suspect-high") {
    return Object.freeze({ color: CHART.p2, opacity: 0.72, width: 1.6 });
  }
  if (classification === "alternans-suspect-low") {
    return Object.freeze({ color: CHART.p2, opacity: 0.5, width: 1.4, dash: "4 3" });
  }
  return Object.freeze({ color: CHART.loop, opacity: 0.24 + 0.7 * recency, width: index === beatCount - 1 ? 2 : 1.35 });
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

function firstDefinedV1(...values: readonly (string | undefined)[]): string | undefined {
  return values.find((value): value is string => Boolean(value));
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
