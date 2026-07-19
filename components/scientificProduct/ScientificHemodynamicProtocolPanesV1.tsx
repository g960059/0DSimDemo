import React from "react";

import { InteractiveGraphLegend } from "@/components/InteractiveGraphLegend";

import type { ScientificWorkbenchLegendInteractionV1 } from "./ScientificWorkbenchAnimatedChartsV1";

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
  /** Provisional short-horizon estimate; never interpreted as settled P1. */
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

/**
 * User-facing response chart DTOs.
 *
 * A generation is one parameter revision. `current` remains present while the
 * next revision is computed; once promoted, callers move it to `history`.
 * History is newest first and the pane deliberately renders at most five old
 * generations so a long editing session cannot make the chart unreadable.
 */
export type ScientificHemodynamicResponseDisplayModeV1 =
  | "estimated"
  | "settled"
  | "both";

export type ScientificHemodynamicResponseGenerationV1 = Readonly<{
  id: string;
  label?: string;
  vascularReturnCurve: readonly ScientificGuytonCurvePointV1[];
  estimatedCardiacSegments?: readonly (readonly ScientificGuytonCurvePointV1[])[];
  settledCardiacSegments?: readonly (readonly ScientificGuytonCurvePointV1[])[];
  estimatedPoints?: readonly ScientificGuytonSweepPointV1[];
  settledPoints?: readonly ScientificGuytonSweepPointV1[];
  operatingPoint?: ScientificGuytonOperatingPointV1;
  warnings?: readonly string[];
}>;

export type ScientificHemodynamicResponseScenarioV1 = Readonly<{
  id: string;
  name: string;
  /** The scenario owns hue. Generation and evidence quality only change alpha/weight/shape. */
  color: string;
  current: ScientificHemodynamicResponseGenerationV1 | null;
  /** Newest historical parameter revision first. At most five are rendered. */
  history?: readonly ScientificHemodynamicResponseGenerationV1[];
  visible?: boolean;
  warnings?: readonly string[];
}>;

export type ScientificCardiacOutputFillingPressurePaneDataV1 = Readonly<{
  side: ScientificGuytonSideV1;
  title?: string;
  scenarios: readonly ScientificHemodynamicResponseScenarioV1[];
  displayMode?: ScientificHemodynamicResponseDisplayModeV1;
  showLegend?: boolean;
  /** Default false: the clinically useful filling-pressure view starts at zero. */
  allowNegativePressure?: boolean;
  /** Clamped to 0...5. */
  historicalGenerationCount?: number;
  status: ScientificHemodynamicProtocolStatusV1;
}>;

export type ScientificCardiacOutputFillingPressurePaneV1Props = Readonly<{
  data: ScientificCardiacOutputFillingPressurePaneDataV1;
  className?: string;
  legendInteraction?: ScientificWorkbenchLegendInteractionV1;
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

const GENERATION_OPACITY_V1 = Object.freeze([1, 0.42, 0.26, 0.16, 0.09, 0.04]);
const FALLBACK_SCENARIO_COLOR_V1 = "#38bdf8";

type ScientificHoveredResponsePointV1 = Readonly<{
  key: string;
  scenarioName: string;
  generationLabel: string;
  evidenceLabel: string;
  point: ScientificGuytonSweepPointV1;
  left: number;
  top: number;
}>;

export function ScientificCardiacOutputFillingPressurePaneV1({
  data,
  className,
  legendInteraction,
}: ScientificCardiacOutputFillingPressurePaneV1Props) {
  const [containerRef, size] = useScientificPaneSizeV1();
  const [hoveredPoint, setHoveredPoint] = React.useState<ScientificHoveredResponsePointV1 | null>(null);
  const [openWarningScenarioId, setOpenWarningScenarioId] = React.useState<string | null>(null);
  const clipId = `response-plot-${React.useId().replace(/:/g, "")}`;
  const compact = size.width < 500 || size.height < 330;
  const displayMode = data.displayMode ?? "estimated";
  const historyCount = Math.max(0, Math.min(5, Math.floor(data.historicalGenerationCount ?? 5)));
  const scenarios = data.scenarios.filter((scenario) => scenario.visible !== false && scenario.current !== null);
  const generations = scenarios.flatMap((scenario) => [
    { scenario, generation: scenario.current!, generationIndex: 0 },
    ...(scenario.history ?? []).slice(0, historyCount).map((generation, index) => ({
      scenario,
      generation,
      generationIndex: index + 1,
    })),
  ]);
  const allPoints = generations.flatMap(({ generation }) =>
    scientificHemodynamicGenerationPointsV1(generation, displayMode));
  const domainPoints = data.allowNegativePressure
    ? allPoints
    : allPoints.filter(({ pressureMmHg }) => pressureMmHg >= 0);
  const xDomain = scientificProtocolAxisDomainV1(
    domainPoints.map(({ pressureMmHg }) => pressureMmHg),
    {
      includeZero: true,
      minimumSpan: 4,
      clampLowerBoundZero: !data.allowNegativePressure,
    },
  );
  const currentCardiacPoints = scenarios.flatMap(({ current }) =>
    current === null
      ? []
      : scientificHemodynamicGenerationCardiacPointsV1(current, displayMode));
  const currentOperatingFlows = scenarios.flatMap(({ current }) =>
    current?.operatingPoint === undefined ? [] : [current.operatingPoint.flowLPerMin]);
  const yDomain = scientificHemodynamicFocusedFlowDomainV1(
    currentCardiacPoints.map(({ flowLPerMin }) => flowLPerMin),
    currentOperatingFlows,
  );
  const plot = scientificProtocolPlotRectV1(
    size,
    compact,
    data.showLegend !== false && scenarios.length > 0,
    Math.min(4, scenarios.length),
    "floating-status",
  );
  const x = linearScaleV1(xDomain, [plot.left, plot.right]);
  const y = linearScaleV1(yDomain, [plot.bottom, plot.top]);
  const labels = scientificCardiacOutputPressureAxisLabelsV1(data.side);
  const title = data.title ?? scientificCardiacOutputFillingPressureTitleV1(data.side);
  const openWarningScenario = openWarningScenarioId === null
    ? null
    : scenarios.find(({ id }) => id === openWarningScenarioId) ?? null;
  const openWarnings = openWarningScenario === null
    ? []
    : scientificScenarioWarningsV1(openWarningScenario, data.status);

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-0 w-full overflow-hidden bg-wb-app ${className ?? ""}`}
      data-testid={`scientific-${data.side}-cardiac-output-filling-pressure-pane-v1`}
      data-protocol-status={data.status.status}
      data-qc-level={data.status.qc.level}
      data-flow-domain-min={roundSvgV1(yDomain[0])}
      data-flow-domain-max={roundSvgV1(yDomain[1])}
    >
      <ScientificProtocolFloatingStatusV1 status={data.status} />
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-labelledby={`response-title-${data.side} response-desc-${data.side}`}
      >
        <title id={`response-title-${data.side}`}>{title}</title>
        <desc id={`response-desc-${data.side}`}>
          {`Cardiac output against ${labels.long}. Current and historical parameter responses are shown for each visible scenario.`}
        </desc>
        <defs>
          <clipPath id={clipId}>
            <rect
              x={plot.left}
              y={plot.top}
              width={Math.max(0, plot.right - plot.left)}
              height={Math.max(0, plot.bottom - plot.top)}
            />
          </clipPath>
        </defs>
        <ScientificCartesianGridV1
          plot={plot}
          xDomain={xDomain}
          yDomain={yDomain}
          xLabel={labels.short}
          yLabel="Cardiac output (L/min)"
          compact={compact}
        />
        <g clipPath={`url(#${clipId})`}>
          {generations.map(({ scenario, generation, generationIndex }) => (
            <ScientificHemodynamicResponseGenerationLayerV1
              key={`${scenario.id}:${generation.id}:${generationIndex}`}
              scenario={scenario}
              generation={generation}
              generationIndex={generationIndex}
              displayMode={displayMode}
              x={x}
              y={y}
              interactive={generationIndex === 0}
              allowNegativePressure={data.allowNegativePressure === true}
              onHoverPoint={setHoveredPoint}
            />
          ))}
        </g>
      </svg>
      {data.showLegend !== false && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-20 overflow-visible">
          <InteractiveGraphLegend
            panelId={legendInteraction?.panelId}
            interactive={legendInteraction?.interactive}
            contentInteractive
            onOpenSettings={legendInteraction?.onOpenSettings}
            position={legendInteraction?.legendPosition}
            onPositionChange={legendInteraction?.onLegendPositionChange}
            ariaLabel={legendInteraction?.ariaLabel}
            className="max-w-[min(30rem,66%)] overflow-visible rounded-md border border-wb-line/70 bg-wb-panel/88 px-1.5 py-1 text-[9px] font-medium text-wb-muted shadow-sm backdrop-blur-sm"
            testId="scientific-hemodynamic-scenario-legend-v1"
          >
            {scenarios.map((scenario) => {
              const warnings = scientificScenarioWarningsV1(scenario, data.status);
              const warningOpen = openWarningScenarioId === scenario.id;
              return (
                <div key={scenario.id} className="relative flex h-[18px] min-w-0 items-center gap-1.5" data-scenario-legend={scenario.id}>
                  <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: scenario.color }} />
                  <span className="min-w-0 flex-1 truncate text-wb-text">{scenario.name}</span>
                  {displayMode === "both" && (
                    <span className="shrink-0 text-[8px] text-wb-subtle">Estimate + reference</span>
                  )}
                  {warnings.length > 0 && (
                    <button
                      type="button"
                      className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-wb-warning hover:bg-wb-warning-soft focus-visible:outline focus-visible:outline-1 focus-visible:outline-wb-warning"
                      aria-label={`${scenario.name}: ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`}
                      aria-expanded={warningOpen}
                      title={warnings.join("\n")}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenWarningScenarioId(warningOpen ? null : scenario.id);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      onPointerEnter={() => setOpenWarningScenarioId(scenario.id)}
                      onPointerLeave={() => setOpenWarningScenarioId(null)}
                      onFocus={() => setOpenWarningScenarioId(scenario.id)}
                      onBlur={() => setOpenWarningScenarioId(null)}
                      onKeyDown={(event) => event.stopPropagation()}
                      data-testid={`scientific-hemodynamic-warning-${scenario.id}`}
                    >
                      <span aria-hidden="true">⚠</span>
                    </button>
                  )}
                </div>
              );
            })}
          </InteractiveGraphLegend>
        </div>
      )}
      {openWarningScenario !== null && openWarnings.length > 0 && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-2 right-2 z-40 max-h-[calc(100%-3rem)] w-64 max-w-[calc(100%-1rem)] overflow-y-auto rounded-md border border-wb-warning/35 bg-wb-panel px-2 py-1.5 text-[9px] font-normal leading-3 text-wb-text shadow-lg"
          data-testid="scientific-hemodynamic-warning-popover-v1"
        >
          <div className="mb-0.5 truncate font-semibold">{openWarningScenario.name}</div>
          {openWarnings.map((warning) => <div key={warning}>{warning}</div>)}
        </div>
      )}
      {hoveredPoint && (
        <ScientificHemodynamicPointTooltipV1 point={hoveredPoint} plot={plot} size={size} />
      )}
    </div>
  );
}

function ScientificHemodynamicResponseGenerationLayerV1({
  scenario,
  generation,
  generationIndex,
  displayMode,
  x,
  y,
  interactive,
  allowNegativePressure,
  onHoverPoint,
}: Readonly<{
  scenario: ScientificHemodynamicResponseScenarioV1;
  generation: ScientificHemodynamicResponseGenerationV1;
  generationIndex: number;
  displayMode: ScientificHemodynamicResponseDisplayModeV1;
  x: (value: number) => number;
  y: (value: number) => number;
  interactive: boolean;
  allowNegativePressure: boolean;
  onHoverPoint: React.Dispatch<React.SetStateAction<ScientificHoveredResponsePointV1 | null>>;
}>) {
  const generationLabel = generation.label
    ?? (generationIndex === 0 ? "Current parameters" : `${generationIndex} change${generationIndex === 1 ? "" : "s"} ago`);
  const opacity = GENERATION_OPACITY_V1[generationIndex] ?? GENERATION_OPACITY_V1.at(-1)!;
  const vascularPath = scientificCurvePathV1(generation.vascularReturnCurve, x, y);
  const estimated = displayMode !== "settled";
  const settled = displayMode !== "estimated";
  const estimatedSegments = estimated ? (generation.estimatedCardiacSegments ?? []) : [];
  const settledSegments = settled ? (generation.settledCardiacSegments ?? []) : [];
  return (
    <g
      opacity={opacity}
      data-scenario-id={scenario.id}
      data-generation-id={generation.id}
      data-generation-index={generationIndex}
      data-generation-role={generationIndex === 0 ? "current" : "history"}
    >
      {vascularPath && (
        <path
          d={vascularPath}
          fill="none"
          stroke={scenario.color}
          strokeWidth={1.45}
          strokeOpacity={0.62}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          data-series="vascular-return"
        />
      )}
      {estimatedSegments.map((segment, segmentIndex) => {
        const path = scientificShapePreservingCurvePathV1(segment, x, y);
        return path && (
          <path
            key={`estimated-${segmentIndex}`}
            d={path}
            fill="none"
            stroke={scenario.color}
            strokeWidth={displayMode === "both" ? 1.65 : 2.2}
            strokeOpacity={displayMode === "both" ? 0.76 : 0.92}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            data-series="rapid-finite-hold-preview"
            data-evidence="estimated"
            data-interpolation="shape-preserving-cubic"
          />
        );
      })}
      {settledSegments.map((segment, segmentIndex) => {
        const path = scientificShapePreservingCurvePathV1(segment, x, y);
        return path && (
          <path
            key={`settled-${segmentIndex}`}
            d={path}
            fill="none"
            stroke={scenario.color}
            strokeWidth={displayMode === "both" ? 2.7 : 2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            data-series="cardiac-preload-locus"
            data-evidence="settled"
            data-interpolation="shape-preserving-cubic"
          />
        );
      })}
      {interactive && estimated && (generation.estimatedPoints ?? [])
        .filter((point) => allowNegativePressure || point.pressureMmHg >= 0)
        .map((point) => (
        <ScientificHemodynamicResponsePointV1
          key={`estimated:${point.id}`}
          point={point}
          scenario={scenario}
          generationLabel={generationLabel}
          evidenceLabel={scientificResponseEvidenceLabelV1(point, "estimated")}
          evidence="estimated"
          cx={x(point.pressureMmHg)}
          cy={y(point.flowLPerMin)}
          onHoverPoint={onHoverPoint}
        />
      ))}
      {interactive && settled && (generation.settledPoints ?? [])
        .filter((point) => allowNegativePressure || point.pressureMmHg >= 0)
        .map((point) => (
        <ScientificHemodynamicResponsePointV1
          key={`settled:${point.id}`}
          point={point}
          scenario={scenario}
          generationLabel={generationLabel}
          evidenceLabel={scientificResponseEvidenceLabelV1(point, "settled")}
          evidence="settled"
          cx={x(point.pressureMmHg)}
          cy={y(point.flowLPerMin)}
          onHoverPoint={onHoverPoint}
        />
      ))}
      {generationIndex === 0
        && generation.operatingPoint
        && (allowNegativePressure || generation.operatingPoint.pressureMmHg >= 0) && (
        <g
          transform={`translate(${x(generation.operatingPoint.pressureMmHg)} ${y(generation.operatingPoint.flowLPerMin)})`}
          data-marker="operating-point"
        >
          <circle r={6} fill="var(--wb-app-bg)" stroke={scenario.color} strokeWidth={2} />
          <circle r={2.2} fill={scenario.color} />
          <title>{generation.operatingPoint.label ?? "Current operating point"}</title>
        </g>
      )}
    </g>
  );
}

function ScientificHemodynamicResponsePointV1({
  point,
  scenario,
  generationLabel,
  evidenceLabel,
  evidence,
  cx,
  cy,
  onHoverPoint,
}: Readonly<{
  point: ScientificGuytonSweepPointV1;
  scenario: ScientificHemodynamicResponseScenarioV1;
  generationLabel: string;
  evidenceLabel: string;
  evidence: "estimated" | "settled";
  cx: number;
  cy: number;
  onHoverPoint: React.Dispatch<React.SetStateAction<ScientificHoveredResponsePointV1 | null>>;
}>) {
  const key = `${scenario.id}:${generationLabel}:${evidence}:${point.id}`;
  const show = () => onHoverPoint({
    key,
    scenarioName: scenario.name,
    generationLabel,
    evidenceLabel,
    point,
    left: cx,
    top: cy,
  });
  const hide = () => onHoverPoint((current) => current?.key === key ? null : current);
  const marker = scientificResponseMarkerV1(point.classification);
  return (
    <g
      transform={`translate(${cx} ${cy})`}
      role="button"
      tabIndex={0}
      aria-label={scientificResponsePointDescriptionV1(point, scenario.name, evidenceLabel)}
      data-point-classification={point.classification}
      data-point-evidence={evidence}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {marker === "diamond" ? (
        <path d="M0,-4.5 L4.5,0 L0,4.5 L-4.5,0 Z" fill="var(--wb-app-bg)" stroke={scenario.color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
      ) : marker === "cross" ? (
        <>
          <circle r={4.8} fill="var(--wb-app-bg)" stroke={scenario.color} strokeWidth={1.2} />
          <path d="M-3,-3 L3,3 M3,-3 L-3,3" stroke={scenario.color} strokeWidth={1.7} vectorEffect="non-scaling-stroke" />
        </>
      ) : (
        <circle
          r={evidence === "settled" ? 4.1 : 2.6}
          fill={evidence === "settled" ? "var(--wb-app-bg)" : scenario.color}
          stroke={scenario.color}
          strokeWidth={evidence === "settled" ? 1.8 : 1.1}
          strokeDasharray={point.classification === "audit-suspect" ? "2 1.5" : undefined}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle r={9} fill="transparent" stroke="none" />
      <title>{scientificResponsePointDescriptionV1(point, scenario.name, evidenceLabel)}</title>
    </g>
  );
}

function ScientificHemodynamicPointTooltipV1({
  point,
  plot,
  size,
}: Readonly<{
  point: ScientificHoveredResponsePointV1;
  plot: ScientificPlotRectV1;
  size: ScientificPaneSizeV1;
}>) {
  const placeRight = point.left < (plot.left + plot.right) / 2;
  const left = Math.max(8, Math.min(size.width - 8, point.left + (placeRight ? 10 : -10)));
  const top = Math.max(42, Math.min(size.height - 8, point.top));
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-30 max-w-64 rounded-md border border-wb-line bg-wb-panel/96 px-2 py-1.5 text-[9px] leading-3 text-wb-text shadow-lg backdrop-blur-sm"
      style={{
        left,
        top,
        transform: `translate(${placeRight ? "0" : "-100%"}, -50%)`,
      }}
      data-testid="scientific-hemodynamic-point-tooltip-v1"
    >
      <div className="font-semibold">{point.scenarioName}</div>
      <div className="text-wb-muted">{point.generationLabel} · {point.evidenceLabel}</div>
      <div className="mt-0.5 tabular-nums">
        {formatNumberV1(point.point.pressureMmHg, 1)} mmHg · {formatNumberV1(point.point.flowLPerMin, 2)} L/min
      </div>
      {point.point.totalBloodVolumeMl !== undefined && (
        <div className="tabular-nums text-wb-muted">TBV {formatNumberV1(point.point.totalBloodVolumeMl, 0)} mL</div>
      )}
      {point.point.reason && <div className="mt-0.5 text-wb-warning">{point.point.reason}</div>}
    </div>
  );
}

function ScientificGuytonStarlingPaneLegacyPresentationV1({
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
        <ScientificLegendLineV1 color={CHART.cardiac} label="Adaptive rapid estimate · not settled" dashed />
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

/** Backward-compatible single-scenario adapter for current protocol callers. */
export function ScientificGuytonStarlingPaneV1({
  data,
  className,
}: ScientificGuytonStarlingPaneV1Props) {
  const scenarioName = data.title?.split("·")[0]?.trim() || "Current scenario";
  const warningDetails = data.status.qc.level === "warning" || data.status.qc.level === "fail"
    ? [data.status.qc.summary, ...(data.status.qc.details ?? [])]
    : [];
  const estimatedPoints = data.sweepPoints.filter(({ classification }) =>
    classification === "estimated" || classification === "unclassified");
  const settledPoints = data.sweepPoints.filter(({ classification }) =>
    classification !== "estimated" && classification !== "unclassified");
  const title = data.title && !/Guyton\s*\/\s*Starling/i.test(data.title)
    ? data.title
    : undefined;
  return (
    <ScientificCardiacOutputFillingPressurePaneV1
      className={className}
      data={{
        side: data.side,
        title,
        displayMode: data.estimatedCardiacSegments?.length ? "both" : "settled",
        scenarios: [{
          id: "legacy-current-scenario",
          name: scenarioName,
          color: FALLBACK_SCENARIO_COLOR_V1,
          current: {
            id: "legacy-current-generation",
            vascularReturnCurve: data.vascularReturnCurve,
            estimatedCardiacSegments: data.estimatedCardiacSegments,
            settledCardiacSegments: data.cardiacPreloadSegments ?? [data.cardiacPreloadLocus],
            estimatedPoints,
            settledPoints,
            operatingPoint: data.operatingPoint,
            warnings: warningDetails,
          },
        }],
        status: data.status,
      }}
    />
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

export function scientificCardiacOutputFillingPressureTitleV1(
  side: ScientificGuytonSideV1,
): string {
  return side === "right"
    ? "Right heart: cardiac output & CVP"
    : "Left heart: cardiac output & PCWP";
}

export function scientificCardiacOutputPressureAxisLabelsV1(
  side: ScientificGuytonSideV1,
): Readonly<{ short: string; long: string }> {
  return side === "right"
    ? Object.freeze({
      short: "CVP (mmHg)",
      long: "cycle-mean transmural central venous pressure (CVP)",
    })
    : Object.freeze({
      short: "PCWP (mmHg)",
      long: "cycle-mean transmural left-atrial pressure used as a PCWP estimate",
    });
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
    clampLowerBoundZero?: boolean;
    paddingFraction?: number;
  }> = {},
): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  const domainValues = options.clampLowerBoundZero
    ? finite.filter((value) => value >= 0)
    : finite;
  let minimum = domainValues.length > 0 ? Math.min(...domainValues) : 0;
  let maximum = domainValues.length > 0 ? Math.max(...domainValues) : (options.minimumSpan ?? 1);
  if (options.includeZero) {
    minimum = Math.min(0, minimum);
    maximum = Math.max(0, maximum);
  }
  const minimumSpan = Math.max(options.minimumSpan ?? 1, Number.EPSILON);
  if (options.clampLowerBoundZero) {
    minimum = 0;
    maximum = Math.max(maximum, minimumSpan);
  }
  if (maximum - minimum < minimumSpan) {
    const center = (minimum + maximum) / 2;
    minimum = center - minimumSpan / 2;
    maximum = center + minimumSpan / 2;
  }
  const padding = (maximum - minimum) * (options.paddingFraction ?? 0.06);
  minimum -= padding;
  maximum += padding;
  if (options.clampLowerBoundZero
    || (options.lowerBoundZeroWhenNonnegative && finite.every((value) => value >= 0))) {
    minimum = 0;
  }
  return Object.freeze([minimum, maximum]);
}

/**
 * Keeps the user-facing view centred on the pump response and operating point.
 *
 * The high-flow end of the analytical vascular-return line is intentionally
 * absent from this calculation: it remains available in the clipped plot, but
 * must not flatten the measured/predicted cardiac response. With one scenario,
 * the operating point sits at about 64% of the plot height. With several
 * scenarios the median is preferred, while the highest operating point and
 * every current cardiac-response sample retain explicit headroom.
 */
export function scientificHemodynamicFocusedFlowDomainV1(
  currentCardiacFlowsLPerMin: readonly number[],
  currentOperatingFlowsLPerMin: readonly number[],
): readonly [number, number] {
  const cardiac = currentCardiacFlowsLPerMin.filter(Number.isFinite);
  const operating = currentOperatingFlowsLPerMin.filter(Number.isFinite);
  const all = [...cardiac, ...operating];
  if (all.some((value) => value < 0)) {
    return scientificProtocolAxisDomainV1(all, {
      includeZero: true,
      minimumSpan: 2,
      paddingFraction: 0.08,
    });
  }

  const maximumCardiac = cardiac.length > 0 ? Math.max(...cardiac) : 0;
  const sortedOperating = [...operating].sort((left, right) => left - right);
  const maximumOperating = sortedOperating.at(-1) ?? 0;
  const medianOperating = sortedOperating.length === 0
    ? 0
    : sortedOperating.length % 2 === 1
      ? sortedOperating[(sortedOperating.length - 1) / 2]
      : (sortedOperating[sortedOperating.length / 2 - 1]
        + sortedOperating[sortedOperating.length / 2]) / 2;

  // The three constraints respectively keep the full current response visible,
  // centre the representative intersection, and preserve headroom for the
  // highest intersection in a multi-scenario comparison.
  const upper = Math.max(
    2,
    maximumCardiac / 0.9,
    medianOperating / 0.64,
    maximumOperating / 0.82,
  );
  return Object.freeze([0, upper]);
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

function scientificCurvePathV1(
  points: readonly ScientificGuytonCurvePointV1[],
  x: (value: number) => number,
  y: (value: number) => number,
): string | null {
  return scientificSvgPathV1(points.map(({ pressureMmHg, flowLPerMin }) => ({
    x: x(pressureMmHg),
    y: y(flowLPerMin),
  })));
}

/**
 * Fritsch-Carlson/PCHIP-style cubic Hermite interpolation rendered as SVG
 * Beziers. Chord length is the independent parameter, so acquisition order is
 * retained even when filling pressure locally reverses. Each screen-space
 * coordinate is shape preserving between samples, preventing spline overshoot.
 */
export function scientificShapePreservingSvgPathV1(
  points: readonly Readonly<{ x: number; y: number }>[],
): string | null {
  const unique: Array<{ x: number; y: number }> = [];
  points
    .filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
    .forEach((point) => {
      const previous = unique.at(-1);
      if (previous !== undefined
        && Math.hypot(point.x - previous.x, point.y - previous.y) <= 1e-9) return;
      unique.push({ x: point.x, y: point.y });
    });
  if (unique.length < 2) return null;
  if (unique.length === 2) {
    return scientificSvgPathV1(unique);
  }

  const chord = [0];
  for (let index = 1; index < unique.length; index += 1) {
    chord.push(chord[index - 1] + Math.hypot(
      unique[index].x - unique[index - 1].x,
      unique[index].y - unique[index - 1].y,
    ));
  }
  const xDerivatives = scientificPchipDerivativesV1(
    chord,
    unique.map(({ x }) => x),
  );
  const yDerivatives = scientificPchipDerivativesV1(
    chord,
    unique.map(({ y }) => y),
  );

  const commands = [`M${roundSvgV1(unique[0].x)},${roundSvgV1(unique[0].y)}`];
  for (let index = 0; index < unique.length - 1; index += 1) {
    const current = unique[index];
    const next = unique[index + 1];
    const width = chord[index + 1] - chord[index];
    commands.push([
      "C",
      `${roundSvgV1(current.x + xDerivatives[index] * width / 3)},${roundSvgV1(current.y + yDerivatives[index] * width / 3)}`,
      `${roundSvgV1(next.x - xDerivatives[index + 1] * width / 3)},${roundSvgV1(next.y - yDerivatives[index + 1] * width / 3)}`,
      `${roundSvgV1(next.x)},${roundSvgV1(next.y)}`,
    ].join(" "));
  }
  return commands.join(" ");
}

function scientificPchipDerivativesV1(
  parameter: readonly number[],
  values: readonly number[],
): readonly number[] {
  const intervalWidths = parameter.slice(0, -1).map((value, index) =>
    parameter[index + 1] - value);
  const secants = intervalWidths.map((width, index) =>
    (values[index + 1] - values[index]) / width);
  const derivatives = new Array<number>(values.length).fill(0);
  const endpointDerivative = (
    firstWidth: number,
    secondWidth: number,
    firstSecant: number,
    secondSecant: number,
  ) => {
    let derivative = ((2 * firstWidth + secondWidth) * firstSecant
      - firstWidth * secondSecant) / (firstWidth + secondWidth);
    if (Math.sign(derivative) !== Math.sign(firstSecant)) derivative = 0;
    else if (Math.sign(firstSecant) !== Math.sign(secondSecant)
      && Math.abs(derivative) > Math.abs(3 * firstSecant)) {
      derivative = 3 * firstSecant;
    }
    return derivative;
  };

  derivatives[0] = endpointDerivative(
    intervalWidths[0],
    intervalWidths[1],
    secants[0],
    secants[1],
  );
  for (let index = 1; index < values.length - 1; index += 1) {
    const previousSecant = secants[index - 1];
    const nextSecant = secants[index];
    if (previousSecant === 0 || nextSecant === 0
      || Math.sign(previousSecant) !== Math.sign(nextSecant)) continue;
    const previousWidth = intervalWidths[index - 1];
    const nextWidth = intervalWidths[index];
    const previousWeight = 2 * nextWidth + previousWidth;
    const nextWeight = nextWidth + 2 * previousWidth;
    derivatives[index] = (previousWeight + nextWeight)
      / (previousWeight / previousSecant + nextWeight / nextSecant);
  }
  derivatives[values.length - 1] = endpointDerivative(
    intervalWidths.at(-1)!,
    intervalWidths.at(-2)!,
    secants.at(-1)!,
    secants.at(-2)!,
  );
  return derivatives;
}

function scientificShapePreservingCurvePathV1(
  points: readonly ScientificGuytonCurvePointV1[],
  x: (value: number) => number,
  y: (value: number) => number,
): string | null {
  return scientificShapePreservingSvgPathV1(points.map(({ pressureMmHg, flowLPerMin }) => ({
    x: x(pressureMmHg),
    y: y(flowLPerMin),
  })));
}


function scientificHemodynamicGenerationPointsV1(
  generation: ScientificHemodynamicResponseGenerationV1,
  displayMode: ScientificHemodynamicResponseDisplayModeV1,
): readonly ScientificGuytonCurvePointV1[] {
  return [
    ...generation.vascularReturnCurve,
    ...(displayMode === "settled" ? [] : generation.estimatedCardiacSegments?.flat() ?? []),
    ...(displayMode === "estimated" ? [] : generation.settledCardiacSegments?.flat() ?? []),
    ...(displayMode === "settled" ? [] : generation.estimatedPoints ?? []),
    ...(displayMode === "estimated" ? [] : generation.settledPoints ?? []),
    ...(generation.operatingPoint ? [generation.operatingPoint] : []),
  ];
}

function scientificHemodynamicGenerationCardiacPointsV1(
  generation: ScientificHemodynamicResponseGenerationV1,
  displayMode: ScientificHemodynamicResponseDisplayModeV1,
): readonly ScientificGuytonCurvePointV1[] {
  return [
    ...(displayMode === "settled" ? [] : generation.estimatedCardiacSegments?.flat() ?? []),
    ...(displayMode === "estimated" ? [] : generation.settledCardiacSegments?.flat() ?? []),
    ...(displayMode === "settled" ? [] : generation.estimatedPoints ?? []),
    ...(displayMode === "estimated" ? [] : generation.settledPoints ?? []),
  ];
}

function scientificScenarioWarningsV1(
  scenario: ScientificHemodynamicResponseScenarioV1,
  aggregateStatus: ScientificHemodynamicProtocolStatusV1,
): readonly string[] {
  const aggregateWarnings = aggregateStatus.qc.level === "warning" || aggregateStatus.qc.level === "fail"
    ? [aggregateStatus.qc.summary, ...(aggregateStatus.qc.details ?? [])]
    : [];
  return [...new Set([
    ...(scenario.warnings ?? []),
    ...(scenario.current?.warnings ?? []),
    ...aggregateWarnings,
  ].filter((warning) => warning.trim().length > 0))];
}

function scientificResponseMarkerV1(
  classification: ScientificGuytonSweepPointV1["classification"],
): "circle" | "diamond" | "cross" {
  if (classification === "period2") return "diamond";
  if (classification === "rejected") return "cross";
  return "circle";
}

function scientificResponseEvidenceLabelV1(
  point: ScientificGuytonSweepPointV1,
  evidence: "estimated" | "settled",
): string {
  if (point.classification === "period2") return "Alternating response · excluded";
  if (point.classification === "rejected") return "Excluded point";
  if (point.classification === "audit-suspect") return "Reference · quality warning";
  if (point.classification === "unclassified") return "Provisional response";
  return evidence === "settled" ? "Settled reference" : "Estimated response";
}

function scientificResponsePointDescriptionV1(
  point: ScientificGuytonSweepPointV1,
  scenarioName: string,
  evidenceLabel: string,
): string {
  return [
    scenarioName,
    evidenceLabel,
    `${formatNumberV1(point.pressureMmHg, 1)} mmHg`,
    `${formatNumberV1(point.flowLPerMin, 2)} L/min`,
    point.totalBloodVolumeMl === undefined
      ? null
      : `TBV ${formatNumberV1(point.totalBloodVolumeMl, 0)} mL`,
    point.reason,
  ].filter(Boolean).join(" · ");
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
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between gap-2 border-b border-wb-line/60 bg-wb-app/90 px-2 backdrop-blur-sm"
      data-testid="scientific-protocol-top-chrome-v1"
    >
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

function ScientificProtocolFloatingStatusV1({
  status,
}: Readonly<{
  status: ScientificHemodynamicProtocolStatusV1;
}>) {
  const progress = status.progress;
  const normalizedProgress = progress && progress.total > 0
    ? Math.min(1, Math.max(0, progress.completed / progress.total))
    : null;
  return (
    <div
      className="pointer-events-none absolute left-2 top-2 z-30 max-w-[min(12rem,28%)]"
      role="status"
      aria-label={status.phase ? `${status.label}: ${status.phase}` : status.label}
      title={status.phase}
      data-testid="scientific-hemodynamic-floating-status-v1"
    >
      <span
        className={`${scientificProtocolStatusBadgeClassV1(status.status)} relative max-w-full overflow-hidden bg-wb-panel/88 shadow-sm backdrop-blur-sm`}
      >
        {status.status === "running" && (
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        )}
        <span className="truncate">{status.label}</span>
        {normalizedProgress !== null && status.status === "running" && (
          <span className="absolute inset-x-0 bottom-0 h-px bg-wb-line/70">
            <span
              className="block h-full bg-current transition-[width] duration-200"
              style={{ width: `${normalizedProgress * 100}%` }}
            />
          </span>
        )}
      </span>
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
        x={compact ? 18 : 20}
        y={(plot.top + plot.bottom) / 2}
        textAnchor="middle"
        fill={CHART.text}
        fontSize={10}
        transform={`rotate(-90 ${compact ? 18 : 20} ${(plot.top + plot.bottom) / 2})`}
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
  legendRowCount = hasLegend ? 1 : 0,
  chrome: "top-bar" | "floating-status" = "top-bar",
): ScientificPlotRectV1 {
  const visibleLegendRows = Math.max(0, Math.min(4, legendRowCount));
  const top = chrome === "floating-status"
    ? hasLegend
      ? 24 + visibleLegendRows * 18
      : 36
    : hasLegend
      ? 46 + visibleLegendRows * 18 + (compact ? 2 : 4)
      : 42;
  const bottomPadding = compact ? 48 : 54;
  return Object.freeze({
    left: compact ? 56 : 68,
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
