import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimInstance, PhysicsRefState, PanelInstanceConfig, type LegendPosition } from '../types';
import type { SimSample } from '../engine/protocol';
import { clampLegendFraction, exceededDragThreshold, fractionToPx, isNearDefaultLegendCorner, pxToFraction } from './legendPosition';
import { useDocumentVisible, useOnscreen } from '../hooks/useOnscreen';
import {
    buildWaveformDrawPlan,
    phaseInSegments,
    type WaveformPhaseSegment,
} from './waveformPhaseWipe';
import { buildPvLoopDrawPlan } from './pvLoopTransition';
import {
    chamberPVPoint,
    isDrawablePvLoopBeatData,
    pvLoopBeatDataForDisplay,
    type PvLoopBeatData,
} from './pvLoopPoints';
import {
    starlingSweepSignature,
    type GuytonAxisDomain,
    type GuytonCurvePoint,
    type GuytonSide,
    type GuytonStarlingWorkerMessage,
    type StarlingSweepResponse,
} from '../engine/guytonStarling';
import {
    beginGuytonSteadyMapRequest,
    expireGuytonSteadyMapGhost,
    GUYTON_STEADY_GHOST_ALPHA,
    guytonSteadyMapWarnings,
    initialGuytonSteadyMapState,
    markGuytonSteadyMapPendingWarning,
    receiveGuytonBaseMapResponse,
    receiveGuytonSweepResponse,
    type GuytonSteadyMap,
    type GuytonSteadyMapGhost,
    type GuytonSteadyMapState,
} from './guytonSteadyMapTransition';

interface ChartPanelProps {
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instances: SimInstance[];
  config: Record<string, PanelInstanceConfig>;
  showGuides?: boolean;
  showLegend?: boolean;
  panelId?: string;
  legendInteractive?: boolean;
  onOpenSettings?: (panelId: string) => void;
  legendPosition?: LegendPosition;
  onLegendPositionChange?: (panelId: string, pos?: LegendPosition) => void;
}

interface WaveformProps extends ChartPanelProps {
    timeWindow: number; 
}

type SignalColorVariant = {
    hueOffset: number;
    saturationScale?: number;
    lightnessOffset?: number;
};

const DEFAULT_SIGNAL_COLOR_VARIANTS: Record<string, SignalColorVariant> = {
    LVP: { hueOffset: 0, saturationScale: 1.02, lightnessOffset: 0.02 },
    AoP: { hueOffset: 16, saturationScale: 1.04, lightnessOffset: 0.14 },
    LAP: { hueOffset: -18, saturationScale: 0.95, lightnessOffset: -0.08 },
    RAP: { hueOffset: 34, saturationScale: 0.95, lightnessOffset: -0.06 },
    PAP: { hueOffset: 18, saturationScale: 1.04, lightnessOffset: 0.14 },
    ABP: { hueOffset: 16, saturationScale: 1.04, lightnessOffset: 0.14 },
    ELV_active: { hueOffset: 0, saturationScale: 1.05, lightnessOffset: 0.04 },
    ELV_timeVarying: { hueOffset: 24, saturationScale: 1.02, lightnessOffset: 0.13 },
    ERV_active: { hueOffset: 48, saturationScale: 1.05, lightnessOffset: 0.05 },
    ERV_timeVarying: { hueOffset: 72, saturationScale: 1.02, lightnessOffset: 0.14 },
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const deriveSignalColor = (baseColor: string, variant: SignalColorVariant): string => {
    const hsl = d3.hsl(baseColor);
    if (!Number.isFinite(hsl.h)) return baseColor;
    return d3.hsl(
        (hsl.h + variant.hueOffset + 360) % 360,
        clamp01(hsl.s * (variant.saturationScale ?? 1)),
        clamp01(hsl.l + (variant.lightnessOffset ?? 0)),
    ).formatHex();
};

const getColor = (baseColor: string, signal: string, customBaseColor?: string, customSignalColors?: Record<string, string>): string => {
    if (customSignalColors && customSignalColors[signal]) return customSignalColors[signal];
    const colorToUse = customBaseColor || baseColor;
    const variant = DEFAULT_SIGNAL_COLOR_VARIANTS[signal];
    if (variant) return deriveSignalColor(colorToUse, variant);
    const c = d3.color(colorToUse);
    if (!c) return colorToUse;
    if (['Pla', 'LAP', 'Pra', 'RAP', 'CVP', 'PCWP', 'LA', 'RA'].includes(signal)) return c.darker(1.2).formatHex();
    return c.formatHex();
};

const POSITIVE_ZERO_FLOOR_SIGNALS = new Set([
    'xiMV',
    'xiAoV',
    'xiTV',
    'xiPV',
    'AoV_areaRatio',
    'LVPressureFloorHit01',
    'RVPressureFloorHit01',
    'ELV_active',
    'ERV_active',
    'ELV_timeVarying',
    'ERV_timeVarying',
    'VRA',
    'VHeart',
    'VLVeff',
    'VRVeff',
]);

const shouldUseZeroFloorForWaveforms = (signals: Set<string>): boolean => (
    signals.size > 0 && Array.from(signals).every(sig => POSITIVE_ZERO_FLOOR_SIGNALS.has(sig))
);

// ---- Axis auto-scaling --------------------------------------------------------
// A "nice number" rounded to {1,2,2.5,5}·10^k so the step is appropriate to the
// data's MAGNITUDE (low-value signals like CVP ~2 mmHg get a fine 0-4 scale instead
// of being flattened onto a fixed 0-40 grid).
const niceNum = (range: number, round: boolean): number => {
    if (!(range > 0)) return 1;
    const exp = Math.floor(Math.log10(range));
    const f = range / Math.pow(10, exp);
    let nf: number;
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 4 ? 2.5 : f < 7 ? 5 : 10;
    else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
};

/** Nice [min,max,step] bracketing [dmin,dmax] with ~`ticks` gridlines. */
const niceAxis = (dmin: number, dmax: number, ticks = 5): { min: number; max: number; step: number } => {
    if (!isFinite(dmin) || !isFinite(dmax)) return { min: 0, max: 1, step: 1 };
    if (dmax - dmin < 1e-9) { dmin -= 0.5; dmax += 0.5; }
    const step = niceNum((dmax - dmin) / Math.max(1, ticks - 1), true);
    return { min: Math.floor(dmin / step) * step, max: Math.ceil(dmax / step) * step, step };
};

/**
 * Hysteretic auto-scale: returns a STABLE [min,max] that only rescales when the
 * data leaves the current window or shrinks well inside it — so the axis does not
 * jitter every frame. `cur` holds the last committed range across frames.
 */
const stableRange = (
    cur: { min: number; max: number },
    dmin: number,
    dmax: number,
    opts: { ticks?: number; zeroFloor?: boolean } = {},
): void => {
    if (!isFinite(dmin) || !isFinite(dmax)) return;
    const pad = (dmax - dmin) * 0.08 || 0.5;
    let lo = opts.zeroFloor ? 0 : dmin - pad;
    let hi = dmax + pad;
    const curRange = cur.max - cur.min;
    const valid = isFinite(curRange) && curRange > 1e-6;
    const grows = !opts.zeroFloor && dmin < cur.min || dmax > cur.max;          // data clipped -> must grow
    const shrinks = valid && (hi - lo) < curRange * 0.5;                         // data uses <50% -> zoom in
    if (!valid || grows || shrinks) {
        const a = niceAxis(lo, hi, opts.ticks ?? 5);
        cur.min = a.min;
        cur.max = a.max;
    }
};

const sampleSignalValue = (d: SimSample, sig: string): number => {
    switch(sig) {
        case 'Plv': case 'LVP': return d.LVP;
        case 'Pla': case 'LAP': return d.LAP;
        case 'Prv': case 'RVP': return d.RVP;
        case 'Pra': case 'RAP': return d.RAP;
        case 'AoP': return d.AoP;
        case 'PAP': return d.PAP;
        case 'QAo': return d.QAo;
        case 'QMV': return d.QMV;
        case 'QPA': return d.QPA;
        case 'QPV': return d.QPV;
        case 'QTV': return d.QTV;
        case 'PVF': return d.PVF;
        case 'SVF': return d.SVF;
        case 'QCorLAD': return d.QCorLAD;
        case 'QCorLCx': return d.QCorLCx;
        case 'QCorRCA': return d.QCorRCA;
        case 'QCorTotal': return d.QCorTotal;
        case 'QCS': return d.QCS;
        case 'PimLAD': return d.PimLAD;
        case 'PimLCx': return d.PimLCx;
        case 'PimRCA': return d.PimRCA;
        case 'PLADArt': return d.PLADArt;
        case 'PLCxArt': return d.PLCxArt;
        case 'PRCAArt': return d.PRCAArt;
        case 'PCS': return d.PCS;
        case 'VRA': return d.VRA;
        case 'aRA': return d.aRA;
        case 'cRA': return d.cRA;
        case 'xiMV': return d.xiMV;
        case 'xiAoV': return d.xiAoV;
        case 'xiTV': return d.xiTV;
        case 'xiPV': return d.xiPV;
        case 'dP_MV': return d.dP_MV;
        case 'dP_AoV': return d.dP_AoV;
        case 'dP_TV': return d.dP_TV;
        case 'dP_PV': return d.dP_PV;
        case 'AoV_areaRatio': return d.AoV_areaRatio;
        case 'AoV_loss_R': return d.AoV_loss_R;
        case 'AoV_loss_B': return d.AoV_loss_B;
        case 'AoV_loss_residual': return d.AoV_loss_residual;
        case 'LVPressureFloorHit01': return d.LVPressureFloorHit01;
        case 'RVPressureFloorHit01': return d.RVPressureFloorHit01;
        case 'ELV_active': return d.ELV_active;
        case 'ERV_active': return d.ERV_active;
        case 'ELV_timeVarying': return d.ELV_timeVarying;
        case 'ERV_timeVarying': return d.ERV_timeVarying;
        case 'Pperi': return d.Pperi;
        case 'Ppc': return d.Ppc;
        case 'VHeart': return d.VHeart;
        case 'septumShiftMl': return d.septumShiftMl;
        case 'VLVeff': return d.VLVeff;
        case 'VRVeff': return d.VRVeff;
        case 'PLVfw': return d.PLVfw;
        case 'PRVfw': return d.PRVfw;
        case 'PVI_LV': return d.PVI_LV;
        case 'PVI_RV': return d.PVI_RV;
        case 'septalForceMmHg': return d.septalForceMmHg;
        default: return 0;
    }
};

const firstSampleIndexAtOrAfter = (buf: SimSample[], t: number): number => {
    let lo = 0;
    let hi = buf.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (buf[mid].t < t) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};

type CanvasPoint = { x: number; y: number };

const chartInstanceKey = (instances: SimInstance[]): string => (
    instances
        .map((inst) => `${inst.id}:${inst.name}:${inst.color}:${inst.isVisible !== false}`)
        .join('|')
);

const isPvLoopDebugEnabled = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        return new URLSearchParams(window.location.search).has('pvDebug')
            || window.localStorage.getItem('hemo:pvDebug') === '1';
    } catch {
        return false;
    }
};

const drawSmoothPolyline = (ctx: CanvasRenderingContext2D, points: CanvasPoint[]): void => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 2) {
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
        return;
    }
    for (let i = 1; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) * 0.5, (current.y + next.y) * 0.5);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
};

const pvLoopCanvasPoints = (
    beatData: PvLoopBeatData,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
): CanvasPoint[] => beatData.points.map(({ v, p }) => ({ x: xScale(v), y: yScale(p) }));

const drawPvLoopStroke = (
    ctx: CanvasRenderingContext2D,
    points: CanvasPoint[],
    color: string,
    alpha: number,
): void => {
    if (points.length < 2 || alpha <= 0) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    drawSmoothPolyline(ctx, points);
    ctx.restore();
};

const drawRawDots = (ctx: CanvasRenderingContext2D, points: CanvasPoint[], color: string): void => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    for (const point of points) {
        ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
    }
    ctx.restore();
};

const phaseFraction = (phi: number): number => {
    const frac = phi - Math.floor(phi);
    return frac < 0 ? frac + 1 : frac;
};

const pvPointAtDisplayedPhase = (
    buf: SimSample[],
    beatRange: { start: number; end: number; closingIndex: number },
    chamber: string,
    livePhi: number,
): { v: number; p: number } | null => {
    const first = buf[beatRange.start];
    if (!first) return null;
    const beatStartPhi = Math.floor(first.phi);
    const targetPhi = beatStartPhi + phaseFraction(livePhi);
    const lastBeatIndex = Math.max(beatRange.start, beatRange.end - 1);
    const lastCandidateIndex = beatRange.closingIndex >= 0 ? beatRange.closingIndex : lastBeatIndex;

    for (let i = beatRange.start + 1; i <= lastCandidateIndex; i++) {
        const prev = buf[i - 1];
        const cur = buf[i];
        if (!prev || !cur) continue;
        if (prev.phi > targetPhi || cur.phi < targetPhi) continue;
        const prevPoint = chamberPVPoint(prev, chamber);
        const curPoint = chamberPVPoint(cur, chamber);
        const span = cur.phi - prev.phi;
        const alpha = span > 1e-9 ? Math.max(0, Math.min(1, (targetPhi - prev.phi) / span)) : 0;
        return {
            v: prevPoint.v + (curPoint.v - prevPoint.v) * alpha,
            p: prevPoint.p + (curPoint.p - prevPoint.p) * alpha,
        };
    }

    return chamberPVPoint(targetPhi <= first.phi ? first : (buf[lastBeatIndex] ?? first), chamber);
};

const drawPvDebugOverlay = (ctx: CanvasRenderingContext2D, lines: string[]): void => {
    if (lines.length === 0) return;
    ctx.save();
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const x = 56;
    const y = 12;
    const lineHeight = 13;
    const maxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(x - 5, y - 4, maxWidth + 10, lines.length * lineHeight + 8);
    ctx.fillStyle = '#cbd5e1';
    lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
    ctx.restore();
};

export function shouldEnableLegendInteractions({
    canConfigure,
    presentationMode,
}: {
    canConfigure?: boolean;
    presentationMode?: 'studio' | 'reading';
}): boolean {
    return Boolean(canConfigure) && presentationMode !== 'reading';
}

type ChartLegendProps = {
    instances: SimInstance[];
    config: Record<string, PanelInstanceConfig>;
    showLegend?: boolean;
    extraClasses?: string;
    panelId?: string;
    legendInteractive?: boolean;
    onOpenSettings?: (panelId: string) => void;
    legendPosition?: LegendPosition;
    onLegendPositionChange?: (panelId: string, pos?: LegendPosition) => void;
};

type LegendLayout = {
    container: { width: number; height: number };
    legend: { width: number; height: number };
};

type LegendDragState = {
    pointerId: number;
    startClient: { x: number; y: number };
    startPx: { left: number; top: number };
    latestFraction: LegendPosition;
};

const EMPTY_LEGEND_LAYOUT: LegendLayout = {
    container: { width: 0, height: 0 },
    legend: { width: 0, height: 0 },
};
const LEGEND_DRAG_THRESHOLD_PX = 5;

function sameLegendLayout(a: LegendLayout, b: LegendLayout): boolean {
    return a.container.width === b.container.width
        && a.container.height === b.container.height
        && a.legend.width === b.legend.width
        && a.legend.height === b.legend.height;
}

export const ChartLegend = ({
    instances,
    config,
    showLegend,
    extraClasses = '',
    panelId,
    legendInteractive = false,
    onOpenSettings,
    legendPosition,
    onLegendPositionChange,
}: ChartLegendProps) => {
    const legendRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<LegendDragState | null>(null);
    const movedRef = useRef(false);
    const suppressClickRef = useRef(false);
    const lastDragEndAtRef = useRef(0);
    const [layout, setLayout] = useState<LegendLayout>(EMPTY_LEGEND_LAYOUT);
    const [livePosition, setLivePosition] = useState<LegendPosition | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const canOpenSettings = legendInteractive && Boolean(panelId) && Boolean(onOpenSettings);
    const canDragLegend = canOpenSettings && Boolean(panelId) && Boolean(onLegendPositionChange);
    const measureLayout = (): LegendLayout => {
        const legendEl = legendRef.current;
        const containerEl = (legendEl?.offsetParent as HTMLElement | null) ?? legendEl?.parentElement ?? null;
        if (!legendEl || !containerEl) return EMPTY_LEGEND_LAYOUT;
        const legendRect = legendEl.getBoundingClientRect();
        const next = {
            container: {
                width: containerEl.clientWidth,
                height: containerEl.clientHeight,
            },
            legend: {
                width: legendEl.offsetWidth || legendRect.width,
                height: legendEl.offsetHeight || legendRect.height,
            },
        };
        setLayout(prev => sameLegendLayout(prev, next) ? prev : next);
        return next;
    };

    useEffect(() => {
        if (showLegend === false) return undefined;
        const legendEl = legendRef.current;
        const containerEl = (legendEl?.offsetParent as HTMLElement | null) ?? legendEl?.parentElement ?? null;
        measureLayout();
        if (!containerEl || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(() => {
            measureLayout();
        });
        observer.observe(containerEl);
        return () => observer.disconnect();
    }, [showLegend, legendPosition, instances.length, config]);

    const openSettings = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        if (Date.now() - lastDragEndAtRef.current < 500) {
            event.preventDefault();
            return;
        }
        if (!canOpenSettings || !panelId) return;
        onOpenSettings?.(panelId);
    };
    const legendItems = instances.flatMap(inst => {
        const cfg = config[inst.id];
        if (!cfg || !cfg.visible || cfg.selectedSignals.length === 0) return [];
        const activeName = cfg.customName || inst.name;

        return cfg.selectedSignals.map(sig => {
            const color = getColor(inst.color, sig, cfg.customBaseColor, cfg.customSignalColors);
            const signalName = (cfg.customSignalNames && cfg.customSignalNames[sig]) || sig;
            return (
                <div key={`${inst.id}-${sig}`} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: color, boxShadow: `0 0 4px ${color}`}}></span>
                    <span className="text-[9px] font-medium text-slate-300 drop-shadow-md tracking-wide">
                        {activeName} ({signalName})
                    </span>
                </div>
            );
        });
    });
    const effectivePosition = livePosition ?? legendPosition;
    const clampedPosition = effectivePosition
        ? clampLegendFraction(effectivePosition, layout.container, layout.legend)
        : undefined;
    const legendPx = clampedPosition ? fractionToPx(clampedPosition, layout.container) : undefined;
    const legendStyle: React.CSSProperties | undefined = legendPx
        ? { left: `${legendPx.left}px`, top: `${legendPx.top}px` }
        : undefined;
    const legendRootStyle: React.CSSProperties | undefined = legendStyle
        ? { ...legendStyle, touchAction: canDragLegend ? 'none' : undefined }
        : (canDragLegend ? { touchAction: 'none' } : undefined);
    const placementClassName = effectivePosition ? '' : 'top-2 right-2';
    const settleTransitionClassName = isDragging ? '' : 'transition-[left,top] duration-150';
    const legendClassName = canOpenSettings
        ? `absolute ${placementClassName} ${settleTransitionClassName} flex flex-col gap-1 z-30 pointer-events-auto p-1.5 bg-slate-900/80 rounded border border-slate-700/50 backdrop-blur-sm hover:bg-slate-900/90 hover:ring-1 hover:ring-sky-400/40 ${isDragging ? 'cursor-grabbing bg-slate-900/90 ring-1 ring-sky-400/50' : 'cursor-grab'} ${extraClasses}`
        : `absolute ${placementClassName} ${settleTransitionClassName} flex flex-col gap-1 z-30 pointer-events-none p-1.5 bg-slate-900/80 rounded border border-slate-700/50 backdrop-blur-sm ${extraClasses}`;

    const stopSuppressedClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (suppressClickRef.current) {
            event.stopPropagation();
            event.preventDefault();
            suppressClickRef.current = false;
        }
    };
    const onLegendPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!canDragLegend || !panelId) return;
        event.stopPropagation();
        const legendEl = legendRef.current;
        const containerEl = (legendEl?.offsetParent as HTMLElement | null) ?? legendEl?.parentElement ?? null;
        if (!legendEl || !containerEl) return;

        const measured = measureLayout();
        const legendRect = legendEl.getBoundingClientRect();
        const containerRect = containerEl.getBoundingClientRect();
        const currentPx = effectivePosition
            ? fractionToPx(clampLegendFraction(effectivePosition, measured.container, measured.legend), measured.container)
            : {
                left: legendRect.left - containerRect.left,
                top: legendRect.top - containerRect.top,
            };
        const currentFraction = clampLegendFraction(pxToFraction(currentPx, measured.container), measured.container, measured.legend);
        dragRef.current = {
            pointerId: event.pointerId,
            startClient: { x: event.clientX, y: event.clientY },
            startPx: currentPx,
            latestFraction: currentFraction,
        };
        movedRef.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const onLegendPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        event.stopPropagation();
        const dx = event.clientX - drag.startClient.x;
        const dy = event.clientY - drag.startClient.y;
        if (!movedRef.current && !exceededDragThreshold(drag.startClient, { x: event.clientX, y: event.clientY }, LEGEND_DRAG_THRESHOLD_PX)) return;
        movedRef.current = true;
        event.preventDefault();
        const measured = measureLayout();
        const nextPx = {
            left: drag.startPx.left + dx,
            top: drag.startPx.top + dy,
        };
        const nextFraction = clampLegendFraction(pxToFraction(nextPx, measured.container), measured.container, measured.legend);
        drag.latestFraction = nextFraction;
        setLivePosition(nextFraction);
        setIsDragging(true);
    };
    const clearLegendDragState = () => {
        dragRef.current = null;
        movedRef.current = false;
        setLivePosition(null);
        setIsDragging(false);
    };
    const finishLegendDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        event.stopPropagation();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        const didDrag = exceededDragThreshold(
            drag.startClient,
            { x: event.clientX, y: event.clientY },
            LEGEND_DRAG_THRESHOLD_PX,
        );
        if (didDrag && panelId) {
            event.preventDefault();
            suppressClickRef.current = true;
            lastDragEndAtRef.current = Date.now();
            const measured = measureLayout();
            const finalPx = {
                left: drag.startPx.left + event.clientX - drag.startClient.x,
                top: drag.startPx.top + event.clientY - drag.startClient.y,
            };
            const finalPosition = clampLegendFraction(pxToFraction(finalPx, measured.container), measured.container, measured.legend);
            const shouldSnapToDefault = isNearDefaultLegendCorner(finalPosition, measured.container, measured.legend);
            onLegendPositionChange?.(panelId, shouldSnapToDefault ? undefined : finalPosition);
        } else {
            suppressClickRef.current = false;
        }
        clearLegendDragState();
    };
    const abortLegendDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        event.stopPropagation();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        suppressClickRef.current = false;
        clearLegendDragState();
    };

    if (showLegend === false) return null;

    return (
        <div
            ref={legendRef}
            className={legendClassName}
            style={legendRootStyle}
            onDoubleClick={canOpenSettings ? openSettings : undefined}
            onPointerDown={canDragLegend ? onLegendPointerDown : undefined}
            onPointerMove={canDragLegend ? onLegendPointerMove : undefined}
            onPointerUp={canDragLegend ? finishLegendDrag : undefined}
            onPointerCancel={canDragLegend ? abortLegendDrag : undefined}
            onClick={canDragLegend ? stopSuppressedClick : undefined}
            title={canOpenSettings ? 'Drag to move · double-click to edit' : undefined}
        >
            {legendItems}
        </div>
    );
};

export const PVLoopPanel: React.FC<ChartPanelProps> = ({ physicsRefs, instances, config, showGuides, showLegend, panelId, legendInteractive, onOpenSettings, legendPosition, onLegendPositionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef({ maxV: 300, maxP: 200 });
  const isOnscreen = useOnscreen(containerRef);
  const isDocumentVisible = useDocumentVisible();
  const canAnimate = isOnscreen && isDocumentVisible;
  const instanceKey = useMemo(() => chartInstanceKey(instances), [instances]);

  useEffect(() => {
    if (!canAnimate) return;
    if (!containerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    
    const resize = () => {
        width = containerRef.current!.clientWidth;
        height = containerRef.current!.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    };
    resize();

    let animationFrameId: number | null = null;
    let stopped = false;

    const render = () => {
      if (stopped) return;
      const xScale = d3.scaleLinear().domain([0, 300]).range([50, width - 15]);
      const yScale = d3.scaleLinear().domain([0, 200]).range([height - 35, 25]);

      ctx.clearRect(0, 0, width, height);

      let currentFrameMaxV = 0;
      let currentFrameMaxP = 0;
      let hasData = false;

      const scanLoopForScale = (beatData: PvLoopBeatData) => {
          beatData.points.forEach(({ v, p }) => {
              if (v > currentFrameMaxV) currentFrameMaxV = v;
              if (p > currentFrameMaxP) currentFrameMaxP = p;
              hasData = true;
          });
      };

      instances.forEach(inst => {
          const cfg = (config as any)[inst.id];
          if (!cfg || !cfg.visible || cfg.selectedSignals.length === 0) return;

          const physState = physicsRefs.current.get(inst.id);
          if (!physState || physState.buffer.length < 2) return;

          const instanceLatestT = physState.buffer.at(-1)?.t ?? physState.core.t;
          const drawPlan = buildPvLoopDrawPlan({
              status: physState.transition?.status,
              previousEpoch: physState.previousEpoch,
              instanceLatestT,
          });

          cfg.selectedSignals.forEach((chamber: string) => {
              const displayBeatData = pvLoopBeatDataForDisplay({
                  buffer: physState.buffer,
                  previousBuffer: physState.previousEpoch?.buffer,
                  waveformBreakT: physState.waveformBreakT,
                  chamber,
                  showPrevious: drawPlan.showPrevious,
              });
              if (
                  displayBeatData.currentBeatData
                  && isDrawablePvLoopBeatData(chamber, displayBeatData.currentBeatData)
              ) {
                  scanLoopForScale(displayBeatData.currentBeatData);
              }

              if (
                  displayBeatData.previousBeatData
                  && isDrawablePvLoopBeatData(chamber, displayBeatData.previousBeatData)
              ) {
                  scanLoopForScale(displayBeatData.previousBeatData);
              }
          });
      });

      if (hasData) {
          // Nice-number + hysteretic, 0-anchored. No forced 150mL/100mmHg minimum, so a
          // low-pressure/low-volume chamber (LA/RA: V ~10-45 mL, P ~0.5-3 mmHg) fills the
          // box and its figure-8 loop is visible instead of collapsing into the corner.
          const rv = { min: 0, max: scaleRef.current.maxV };
          stableRange(rv, 0, currentFrameMaxV, { ticks: 6, zeroFloor: true });
          scaleRef.current.maxV = rv.max;
          const rp = { min: 0, max: scaleRef.current.maxP };
          stableRange(rp, 0, currentFrameMaxP, { ticks: 6, zeroFloor: true });
          scaleRef.current.maxP = rp.max;
      }

      xScale.domain([0, scaleRef.current.maxV]).range([50, width - 15]);
      yScale.domain([0, scaleRef.current.maxP]).range([height - 35, 10]);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      xScale.ticks(6).forEach(t => { ctx.moveTo(xScale(t), height-35); ctx.lineTo(xScale(t), 10); });
      yScale.ticks(6).forEach(t => { ctx.moveTo(50, yScale(t)); ctx.lineTo(width-15, yScale(t)); });
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      xScale.ticks(6).forEach(t => ctx.fillText(t.toString(), xScale(t), height - 20));
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      yScale.ticks(6).forEach(t => ctx.fillText(t.toString(), 42, yScale(t)));

      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("Volume (mL)", width / 2, height - 4);
      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Pressure (mmHg)", 0, 0);
      ctx.restore();

	      const pvDebug = isPvLoopDebugEnabled();
	      const debugLines: string[] = [];
	      const pvLoopItems: Array<{
	          inst: SimInstance;
	          cfg: PanelInstanceConfig;
	          physState: PhysicsRefState;
	          buf: SimSample[];
	          chamber: string;
	          color: string;
	          drawPlan: ReturnType<typeof buildPvLoopDrawPlan>;
	          currentBeatData: PvLoopBeatData;
	          currentPoints: CanvasPoint[];
	      }> = [];
	      const pvLoopGhostItems: Array<{
	          chamber: string;
	          color: string;
	          drawPlan: ReturnType<typeof buildPvLoopDrawPlan>;
	          previousBeatData: PvLoopBeatData;
	      }> = [];

	      instances.forEach(inst => {
	          const cfg = (config as any)[inst.id];
	          if (!cfg || !cfg.visible) return;

	          const physState = physicsRefs.current.get(inst.id);
	          if (!physState || physState.buffer.length < 2) return;

	          // PV loops are always drawn over the LAST COMPLETE beat. Unlike waveforms,
	          // transition feedback is a short ghost overlay, not a phase sweep.
	          const buf = physState.buffer;
	          const instanceLatestT = buf.at(-1)?.t ?? physState.core.t;
	          const drawPlan = buildPvLoopDrawPlan({
	              status: physState.transition?.status,
	              previousEpoch: physState.previousEpoch,
	              instanceLatestT,
	          });

	          cfg.selectedSignals.forEach((chamber: string) => {
	              const color = getColor(inst.color, chamber, cfg.customBaseColor, cfg.customSignalColors);
	              const displayBeatData = pvLoopBeatDataForDisplay({
	                  buffer: buf,
	                  previousBuffer: physState.previousEpoch?.buffer,
	                  waveformBreakT: physState.waveformBreakT,
	                  chamber,
	                  showPrevious: drawPlan.showPrevious,
	              });
	              if (
	                  displayBeatData.previousBeatData
	                  && isDrawablePvLoopBeatData(chamber, displayBeatData.previousBeatData)
	              ) {
	                  pvLoopGhostItems.push({
	                      chamber,
	                      color,
	                      drawPlan,
	                      previousBeatData: displayBeatData.previousBeatData,
	                  });
	              }
	              const currentBeatData = displayBeatData.currentBeatData;
	              if (!currentBeatData || !isDrawablePvLoopBeatData(chamber, currentBeatData)) return;
	              const currentPoints = pvLoopCanvasPoints(currentBeatData, xScale, yScale);
	              pvLoopItems.push({
	                  inst,
	                  cfg,
	                  physState,
	                  buf: displayBeatData.currentBuffer,
	                  chamber,
	                  color,
	                  drawPlan,
	                  currentBeatData,
	                  currentPoints,
	              });
	          });
	      });

	      pvLoopGhostItems.forEach(({ color, drawPlan, previousBeatData }) => {
	          drawPvLoopStroke(
	              ctx,
	              pvLoopCanvasPoints(previousBeatData, xScale, yScale),
	              color,
	              drawPlan.previousAlpha,
	          );
	      });

	      pvLoopItems.forEach(({ physState, chamber, color, currentBeatData }) => {
	          if (!showGuides || (chamber !== 'LV' && chamber !== 'RV')) return;
	          if (!Number.isFinite(currentBeatData.vMin) || !Number.isFinite(currentBeatData.vMax)) return;
	          const curveMin = Math.max(0, currentBeatData.vMin - 10);
	          const curveMax = Math.min(scaleRef.current.maxV, Math.max(currentBeatData.vMax + 20, curveMin + 20));
	          const passiveCurve = physState.core.passivePressureVolumeCurve(chamber, curveMin, curveMax, 72)
	              .filter((pt) => Number.isFinite(pt.v) && Number.isFinite(pt.p) && pt.p >= -10 && pt.p <= scaleRef.current.maxP * 1.4)
	              .map((pt) => ({ x: xScale(pt.v), y: yScale(pt.p) }));
	          if (passiveCurve.length > 1) {
	              ctx.save();
	              ctx.strokeStyle = color;
	              ctx.globalAlpha = 0.34;
	              ctx.lineWidth = 1.2;
	              ctx.setLineDash([5, 4]);
	              drawSmoothPolyline(ctx, passiveCurve);
	              ctx.restore();
	          }
	      });

	      pvLoopItems.forEach(({ color, drawPlan, currentPoints }) => {
	          drawPvLoopStroke(ctx, currentPoints, color, drawPlan.currentAlpha);
	      });

	      if (pvDebug) {
	          pvLoopItems.forEach(({ inst, cfg, chamber, color, currentPoints }) => {
	              drawRawDots(ctx, currentPoints, color);
	              const activeName = cfg.customName || inst.name;
	              debugLines.push(`${activeName} ${chamber}: ${currentPoints.length} pts`);
	          });
	      }

	      pvLoopItems.forEach(({ buf, chamber, color, drawPlan, currentBeatData }) => {
	          // Marker is a live-phase cursor on the displayed beat. The loop is
	          // intentionally last-complete-beat; using the latest transient PV
	          // coordinate would make the dot float away from that displayed curve.
	          const lastPoint = buf[buf.length - 1];
	          if (!lastPoint) return;
	          const markerPv = pvPointAtDisplayedPhase(buf, currentBeatData.beatRange, chamber, lastPoint.phi) ?? chamberPVPoint(lastPoint, chamber);
	          ctx.save();
	          ctx.globalAlpha = drawPlan.markerAlpha;
	          ctx.beginPath();
	          ctx.arc(xScale(markerPv.v), yScale(markerPv.p), 4, 0, Math.PI * 2);
	          ctx.fillStyle = color;
	          ctx.fill();
	          ctx.restore();
	      });

	      if (pvDebug) drawPvDebugOverlay(ctx, debugLines);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const ro = new ResizeObserver(() => resize());
    if (containerRef.current) {
        ro.observe(containerRef.current);
    }

    return () => {
      stopped = true;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      ro.disconnect();
    };
  }, [instanceKey, config, showGuides, canAnimate]);

  return (
      <div ref={containerRef} className="absolute inset-0 rounded-b-xl overflow-hidden pointer-events-none">
         <ChartLegend instances={instances} config={config} showLegend={showLegend} panelId={panelId} legendInteractive={legendInteractive} onOpenSettings={onOpenSettings} legendPosition={legendPosition} onLegendPositionChange={onLegendPositionChange} />
         <canvas ref={canvasRef} className="block pointer-events-auto" />
      </div>
  );
};

export const WaveformPanel: React.FC<WaveformProps> = ({ physicsRefs, instances, timeWindow, config, showLegend, panelId, legendInteractive, onOpenSettings, legendPosition, onLegendPositionChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scaleRef = useRef({ yMin: 0, yMax: 160 });
    const isOnscreen = useOnscreen(containerRef);
    const isDocumentVisible = useDocumentVisible();
    const canAnimate = isOnscreen && isDocumentVisible;
    const instanceKey = useMemo(() => chartInstanceKey(instances), [instances]);

    useEffect(() => {
        if (!canAnimate) return;
        if (!containerRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = containerRef.current.clientWidth;
        let height = containerRef.current.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        
        const resize = () => {
            width = containerRef.current!.clientWidth;
            height = containerRef.current!.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        };
        resize();

        let animationFrameId: number | null = null;
        let stopped = false;

        const render = () => {
            if (stopped) return;
            ctx.clearRect(0, 0, width, height);
            
            let currentGlobalTime = 0;
            instances.forEach(inst => {
                const physState = physicsRefs.current.get(inst.id);
                if (physState && physState.buffer.length > 0) {
                    const latestT = physState.buffer[physState.buffer.length - 1].t;
                    if (latestT > currentGlobalTime) currentGlobalTime = latestT;
                }
            });
            const timeSec = timeWindow / 1000;
            const gapSec = timeSec * 0.025;
            const tMin = Math.max(0, currentGlobalTime - timeSec + gapSec);
            const tMax = currentGlobalTime;

            let frameYMax = -Infinity;
            let frameYMin = Infinity;
            let hasData = false;
            const frameSignals = new Set<string>();

            instances.forEach(inst => {
                const cfg = (config as any)[inst.id];
                if (!cfg || !cfg.visible || cfg.selectedSignals.length === 0) return;
                const physState = physicsRefs.current.get(inst.id);
                if (!physState) return;

                const latestT = physState.buffer.at(-1)?.t ?? physState.core.t ?? currentGlobalTime;
                const drawPlan = buildWaveformDrawPlan({
                    status: physState.transition?.status,
                    previousEpoch: physState.previousEpoch,
                    instanceLatestT: latestT,
                    timeWindowSec: timeSec,
                });

                const scanBuffer = (buf: SimSample[], minT: number, maxT: number, segments: WaveformPhaseSegment[]) => {
                    if (segments.length === 0) return;
                    const startIndex = firstSampleIndexAtOrAfter(buf, minT);
                    const stepFrames = 10;
                    for (let i = startIndex; i < buf.length; i += stepFrames) {
                        const d = buf[i];
                        if (d.t > maxT) break;
                        if (!phaseInSegments(d.t % timeSec, segments, timeSec)) continue;
                        cfg.selectedSignals.forEach((sig: string) => {
                            const val = sampleSignalValue(d, sig);
                            if (!Number.isFinite(val)) return;
                            if (val > frameYMax) frameYMax = val;
                            if (val < frameYMin) frameYMin = val;
                            hasData = true;
                            frameSignals.add(sig);
                        });
                    }
                };

                scanBuffer(physState.buffer, tMin, tMax, drawPlan.currentSegments);
                if (drawPlan.previousAlpha > 0 && physState.previousEpoch) {
                    const previous = physState.previousEpoch.buffer;
                    const previousMaxT = previous.at(-1)?.t ?? 0;
                    const previousMinT = Math.max(0, previousMaxT - timeSec + gapSec);
                    scanBuffer(previous, previousMinT, previousMaxT, drawPlan.previousSegments);
                }
            });

            if (hasData) {
                // Nice-number + hysteretic scaling: stable axis that only rescales when
                // the trace clips or shrinks well inside the window, and that resolves
                // low-amplitude signals (CVP/LAP ~2 mmHg) instead of flattening them.
                const r = { min: scaleRef.current.yMin, max: scaleRef.current.yMax };
                stableRange(r, frameYMin, frameYMax, {
                    ticks: 5,
                    zeroFloor: shouldUseZeroFloorForWaveforms(frameSignals),
                });
                scaleRef.current.yMin = r.min;
                scaleRef.current.yMax = r.max;
            }

            const xScale = d3.scaleLinear().domain([0, timeSec]).range([30, width - 5]);
            const yScale = d3.scaleLinear().domain([scaleRef.current.yMin, scaleRef.current.yMax]).range([height - 25, 10]);

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            yScale.ticks(4).forEach(t => { ctx.moveTo(30, yScale(t)); ctx.lineTo(width-5, yScale(t)); });
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            yScale.ticks(4).forEach(t => ctx.fillText(t.toString(), 28, yScale(t)));

            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            xScale.ticks(5).forEach(t => ctx.fillText(t.toFixed(1) + 's', xScale(t) + 2, height - 20));

            instances.forEach(inst => {
                const cfg = (config as any)[inst.id];
                if (!cfg || !cfg.visible) return;
                const physState = physicsRefs.current.get(inst.id);
                if (!physState) return;

                const drawBuffer = (
                    buf: SimSample[],
                    minT: number,
                    maxT: number,
                    sig: string,
                    color: string,
                    alpha: number,
                    segments: WaveformPhaseSegment[],
                    markerAlpha = 0,
                    dash: number[] = [],
                ) => {
                    if (segments.length === 0) return;
                    const startIndex = firstSampleIndexAtOrAfter(buf, minT);
                    const visibleCount = buf.length - startIndex;
                    const drawStep = Math.max(1, Math.floor(visibleCount / Math.max(1, width * 2)));
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash(dash);

                    let prevX = -1;
                    let lastPx = -1;
                    let lastPy = -1;

                    for (let i = startIndex; i < buf.length; i += drawStep) {
                        const d = buf[i];
                        if (d.t > maxT) break;
                        const val = sampleSignalValue(d, sig);

                        const modT = d.t % timeSec;
                        const px = xScale(modT);
                        const py = yScale(val);
                        if (!phaseInSegments(modT, segments, timeSec)) {
                            if (prevX !== -1) {
                                ctx.stroke();
                                ctx.beginPath();
                                prevX = -1;
                            }
                            continue;
                        }

                        if (prevX === -1 || px < prevX) {
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.strokeStyle = color;
                            ctx.lineWidth = 1.5;
                            ctx.setLineDash(dash);
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                        prevX = px;
                        lastPx = px;
                        lastPy = py;
                    }
                    ctx.stroke();
                    ctx.restore();

                    if (markerAlpha > 0 && lastPx !== -1) {
                         ctx.save();
                         ctx.globalAlpha = markerAlpha;
                         ctx.beginPath();
                         ctx.arc(lastPx, lastPy, 4, 0, Math.PI * 2);
                         const c = d3.color(color);
                         ctx.fillStyle = c ? c.brighter(0.5).formatHex() : color;
                         ctx.fill();
                         ctx.restore();
                    }
                };

                const latestT = physState.buffer.at(-1)?.t ?? physState.core.t ?? currentGlobalTime;
                const drawPlan = buildWaveformDrawPlan({
                    status: physState.transition?.status,
                    previousEpoch: physState.previousEpoch,
                    instanceLatestT: latestT,
                    timeWindowSec: timeSec,
                });
                const previous = physState.previousEpoch?.buffer;
                const previousMaxT = previous?.at(-1)?.t ?? 0;
                const previousMinT = Math.max(0, previousMaxT - timeSec + gapSec);
                cfg.selectedSignals.forEach((sig: string) => {
                    const color = getColor(inst.color, sig, cfg.customBaseColor, cfg.customSignalColors);
                    if (previous && drawPlan.previousAlpha > 0) {
                        drawBuffer(
                            previous,
                            previousMinT,
                            previousMaxT,
                            sig,
                            color,
                            drawPlan.previousAlpha,
                            drawPlan.previousSegments,
                        );
                    }
                    drawBuffer(
                        physState.buffer,
                        tMin,
                        tMax,
                        sig,
                        color,
                        drawPlan.currentAlpha,
                        drawPlan.currentSegments,
                        drawPlan.markerAlpha,
                    );
                });
            });

            animationFrameId = requestAnimationFrame(render);
        };
        render();

        const ro = new ResizeObserver(() => resize());
        if (containerRef.current) {
            ro.observe(containerRef.current);
        }
        return () => {
            stopped = true;
            if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
            ro.disconnect();
        };
    }, [instanceKey, timeWindow, config, canAnimate]);

    return (
        <div ref={containerRef} className="absolute inset-0 rounded-b-xl overflow-hidden pointer-events-none">
            <ChartLegend instances={instances} config={config} showLegend={showLegend} panelId={panelId} legendInteractive={legendInteractive} onOpenSettings={onOpenSettings} legendPosition={legendPosition} onLegendPositionChange={onLegendPositionChange} />
            <canvas ref={canvasRef} className="block pointer-events-auto" />
        </div>
    );
};

export const MetricsPanel: React.FC<ChartPanelProps> = ({ physicsRefs, instances, config }) => {
    const [tick, setTick] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 500); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-5">
            {instances.map(inst => {
                const cfg = (config as any)[inst.id];
                if (!cfg || !cfg.visible || cfg.selectedSignals.length === 0) return null;

                const physState = physicsRefs.current.get(inst.id);
                if (!physState) return null;
                const met = physState.core.metrics();
                const p = physState.core.p;

                const metricsMap: Record<string, string | number> = {
                    'ABP': `${Math.round(met.AoPSys)}/${Math.round(met.AoPDia)} (${Math.round(met.AoPMean)})`,
                    'CVP': Math.round(met.RAPMean),
                    'PAP': Math.round(met.PAPMean),
                    'PCWP': Math.round(met.LAPMean),
                    'SV': Math.round(met.SV_L),
                    'CO': met.CO_L.toFixed(1),
                    'Ea_LV': (met.AoPSys / Math.max(1, met.SV_L)).toFixed(2),
                    'LVEF': Math.round(met.EF_LApprox * 100),
                    'RVEF': Math.round(met.EF_RApprox * 100),
                    'COR': Math.round(met.CorFlowTotalMlMin),
                    'COR_PCT': met.CorPctCO.toFixed(1),
                    'LAD_DF': Math.round(met.CorDiastolicFractionLAD * 100),
                    'LCx_DF': Math.round(met.CorDiastolicFractionLCx * 100),
                    'RCA_DF': Math.round(met.CorDiastolicFractionRCA * 100),
                    'FFR_LAD': met.FFR_LAD.toFixed(2),
                    'FFR_LCx': met.FFR_LCx.toFixed(2),
                    'FFR_RCA': met.FFR_RCA.toFixed(2),
                    'COR_SDI_L': met.CorSupplyDemandL.toFixed(2),
                    'COR_SDI_R': met.CorSupplyDemandR.toFixed(2)
                };

                const unitsMap: Record<string, string> = {
                    'ABP': 'mmHg',
                    'CVP': 'mmHg',
                    'PAP': 'mmHg',
                    'PCWP': 'mmHg',
                    'SV': 'mL',
                    'CO': 'L/min',
                    'Ea_LV': 'mmHg/mL',
                    'LVEF': '%',
                    'RVEF': '%',
                    'COR': 'mL/min',
                    'COR_PCT': '%CO',
                    'LAD_DF': '%',
                    'LCx_DF': '%',
                    'RCA_DF': '%',
                    'FFR_LAD': '',
                    'FFR_LCx': '',
                    'FFR_RCA': '',
                    'COR_SDI_L': '',
                    'COR_SDI_R': ''
                };

                const activeName = cfg.customName || inst.name;
                const activeColor = cfg.customBaseColor || inst.color;

                return (
                    <div key={inst.id} className="flex flex-col gap-1 pb-2">
                         <div className="flex items-center gap-2 pb-1 pt-1">
                             <div className="w-2 h-2 rounded-full shadow-sm" style={{backgroundColor: activeColor, boxShadow: `0 0 6px ${activeColor}`}}></div>
                             <span className="font-medium text-[13px] text-slate-200">{activeName}</span>
                         </div>
                         <div className="flex flex-wrap gap-x-8 gap-y-2.5 px-2">
                             {cfg.selectedSignals.map((sig: string) => {
                                 const signalName = (cfg.customSignalNames && cfg.customSignalNames[sig]) || sig;
                                 return metricsMap[sig] ? (
                                     <div key={sig} className="flex items-baseline gap-2">
                                         <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">{signalName}</span>
                                         <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-mono text-slate-100 font-medium">{metricsMap[sig]}</span>
                                            {unitsMap[sig] && <span className="text-[10px] text-slate-500">{unitsMap[sig]}</span>}
                                         </div>
                                     </div>
                                 ) : null;
                             })}
                         </div>
                    </div>
                )
            })}
        </div>
    );
};

type GuytonSeries = {
    inst: SimInstance;
    current?: GuytonSteadyMap;
    ghost?: GuytonSteadyMapGhost;
    axis: GuytonAxisDomain;
    status: 'ready' | 'pending' | 'empty';
    warnings: string[];
};

export const GuytonPanel: React.FC<ChartPanelProps & { type: string }> = ({ instances, config, type }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isOnscreen = useOnscreen(containerRef);
    const isDocumentVisible = useDocumentVisible();
    const canAnimate = isOnscreen && isDocumentVisible;
    const side: GuytonSide = type === 'GUYTON_LEFT' ? 'left' : 'right';
    const [tick, setTick] = useState(0);
    const [refreshSeq, setRefreshSeq] = useState(0);
    const [workerBusy, setWorkerBusy] = useState(false);
    const [workerError, setWorkerError] = useState<string | null>(null);
    const forceRefreshRef = useRef(false);
    const steadyMapRef = useRef<Map<string, GuytonSteadyMapState>>(new Map());

    const visibleInstances = useMemo(() => (
        instances.filter((inst) => {
            const cfg = config[inst.id];
            return inst.isVisible !== false && cfg?.visible;
        })
    ), [instances, config]);

    const sweepInputs = useMemo(() => visibleInstances.map((inst) => ({
        instanceId: inst.id,
        params: inst.params,
        targetVolumeMl: inst.targetVolume,
        signature: starlingSweepSignature(side, inst.id, inst.params, inst.targetVolume),
    })), [visibleInstances, side]);

    const sweepKey = useMemo(() => JSON.stringify(sweepInputs.map((input) => ({
        id: input.instanceId,
        signature: input.signature,
    }))), [sweepInputs]);

    const cacheKeyForId = (instanceId: string): string => `${side}:${instanceId}`;
    const cacheKey = (inst: SimInstance): string => cacheKeyForId(inst.id);

    useEffect(() => {
        const interval = window.setInterval(() => setTick((t) => t + 1), 500);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const nowMs = Date.now();
        const force = forceRefreshRef.current;
        forceRefreshRef.current = false;
        const visibleIds = new Set(sweepInputs.map((input) => cacheKeyForId(input.instanceId)));
        for (const key of steadyMapRef.current.keys()) {
            if (!visibleIds.has(key)) steadyMapRef.current.delete(key);
        }
        for (const input of sweepInputs) {
            const key = cacheKeyForId(input.instanceId);
            const current = steadyMapRef.current.get(key) ?? initialGuytonSteadyMapState(side);
            steadyMapRef.current.set(
                key,
                beginGuytonSteadyMapRequest(current, input.signature, nowMs, { force }),
            );
        }
        setTick((t) => t + 1);

        if (sweepInputs.length === 0) {
            setWorkerBusy(false);
            return;
        }

        if (typeof Worker === 'undefined') {
            for (const input of sweepInputs) {
                const key = cacheKeyForId(input.instanceId);
                const current = steadyMapRef.current.get(key) ?? initialGuytonSteadyMapState(side);
                steadyMapRef.current.set(
                    key,
                    markGuytonSteadyMapPendingWarning(
                        current,
                        input.signature,
                        'Steady map worker unavailable',
                        Date.now(),
                    ),
                );
            }
            setWorkerBusy(false);
            setWorkerError('Steady map worker unavailable');
            setTick((t) => t + 1);
            return;
        }

        let cancelled = false;
        let remaining = sweepInputs.length;
        const worker = new Worker(new URL('../engine/guytonStarlingWorker.ts', import.meta.url), { type: 'module' });
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setWorkerBusy(true);
            setWorkerError(null);
            for (const input of sweepInputs) {
                worker.postMessage({
                    requestId: `${input.instanceId}-${Date.now()}`,
                    signature: input.signature,
                    instanceId: input.instanceId,
                    params: input.params,
                    targetVolumeMl: input.targetVolumeMl,
                });
            }
        }, 450);

        worker.onmessage = (event: MessageEvent<GuytonStarlingWorkerMessage | StarlingSweepResponse>) => {
            if (cancelled) return;
            const response = event.data;
            const key = cacheKeyForId(response.instanceId);
            const current = steadyMapRef.current.get(key) ?? initialGuytonSteadyMapState(side);
            if ('type' in response && response.type === 'base-map') {
                steadyMapRef.current.set(key, receiveGuytonBaseMapResponse(current, side, response, Date.now()));
                setTick((t) => t + 1);
                return;
            }

            const sweepResponse = response as StarlingSweepResponse;
            steadyMapRef.current.set(key, receiveGuytonSweepResponse(current, sweepResponse, Date.now()));
            if (sweepResponse.error) setWorkerError(sweepResponse.error);
            setTick((t) => t + 1);
            remaining -= 1;
            if (remaining <= 0) {
                setWorkerBusy(false);
                worker.terminate();
            }
        };
        worker.onerror = (event) => {
            if (cancelled) return;
            const message = event.message || 'Starling sweep worker failed';
            for (const input of sweepInputs) {
                const key = cacheKeyForId(input.instanceId);
                const current = steadyMapRef.current.get(key) ?? initialGuytonSteadyMapState(side);
                steadyMapRef.current.set(
                    key,
                    markGuytonSteadyMapPendingWarning(current, input.signature, message, Date.now()),
                );
            }
            setWorkerError(message);
            setWorkerBusy(false);
            setTick((t) => t + 1);
            worker.terminate();
        };

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            worker.terminate();
        };
    }, [sweepKey, refreshSeq]);

    const requestMapRefresh = () => {
        forceRefreshRef.current = true;
        setRefreshSeq((seq) => seq + 1);
    };

    const series: GuytonSeries[] = useMemo(() => {
        void tick;
        const visibleIds = new Set(visibleInstances.map((inst) => cacheKey(inst)));
        for (const id of steadyMapRef.current.keys()) {
            if (!visibleIds.has(id)) steadyMapRef.current.delete(id);
        }
        const nowMs = Date.now();
        return visibleInstances.flatMap((inst) => {
            const key = cacheKey(inst);
            const state = expireGuytonSteadyMapGhost(
                steadyMapRef.current.get(key) ?? initialGuytonSteadyMapState(side),
                nowMs,
            );
            steadyMapRef.current.set(key, state);
            const status = state.current ? 'ready' : state.pending ? 'pending' : 'empty';
            return [{
                inst,
                current: state.current,
                ghost: state.ghost,
                axis: state.axis,
                status,
                warnings: guytonSteadyMapWarnings(state),
            }];
        });
    }, [visibleInstances, side, tick]);

    useEffect(() => {
        if (!canAnimate || !containerRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = Math.max(containerRef.current.clientWidth, 1);
        const height = Math.max(containerRef.current.clientHeight, 1);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawGuytonCanvas(ctx, width, height, series, side);
    }, [canAnimate, series, side]);

    const primarySeries = series[0];
    const hasRenderableMap = series.some((item) => item.current || item.ghost);
    const hasPendingMap = series.some((item) => item.status === 'pending');
    const hasGhostMap = series.some((item) => item.ghost);
    const statusBadges = [
        ...(primarySeries?.status === 'ready' ? ['Steady map ready'] : []),
        ...(hasPendingMap ? ['Computing steady map'] : []),
        ...(hasGhostMap ? ['Previous map'] : []),
        ...(workerBusy ? ['Worker running'] : []),
    ];
    const warnings = Array.from(new Set([
        ...series.flatMap((item) => item.warnings),
        ...(workerError ? [workerError] : []),
    ])).slice(0, 2);

    return (
        <div ref={containerRef} className="absolute inset-0 bg-[#0B1120] rounded-b-xl overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            {visibleInstances.length > 0 && (
                <div className="absolute right-3 top-2 flex flex-wrap justify-end gap-1.5 pointer-events-auto">
                    <button
                        type="button"
                        onClick={requestMapRefresh}
                        className="rounded border border-slate-700/80 bg-slate-950/85 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-slate-500 hover:text-white"
                    >
                        Refresh map
                    </button>
                    <span className="rounded border border-slate-700/70 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-400">Axis fixed</span>
                </div>
            )}
            {visibleInstances.length > 0 && (statusBadges.length > 0 || warnings.length > 0) && (
                <div className="absolute left-3 top-2 right-32 flex flex-wrap gap-1.5 pointer-events-none">
                    {statusBadges.map((badge) => (
                        <span key={badge} className="rounded border border-slate-700/70 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-400">{badge}</span>
                    ))}
                    {warnings.map((warning) => (
                        <span key={warning} className="rounded border border-amber-500/30 bg-amber-950/40 px-2 py-1 text-[10px] text-amber-200">{warning}</span>
                    ))}
                </div>
            )}
            {!hasRenderableMap && visibleInstances.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
                    <div className="rounded border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">Computing steady map</div>
                </div>
            )}
            {series.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-center">
                    <div className="text-xs text-slate-500">No visible instance</div>
                </div>
            )}
        </div>
    );
};

function drawGuytonCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    series: GuytonSeries[],
    side: GuytonSide,
) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, 0, width, height);

    const plot = {
        left: 48,
        right: Math.max(width - 18, 60),
        top: 34,
        bottom: Math.max(height - 76, 80),
    };
    if (plot.right <= plot.left || plot.bottom <= plot.top) return;

    if (series.length === 0) return;
    const xAxis = niceAxis(
        Math.min(...series.map((item) => item.axis.xMin)),
        Math.max(...series.map((item) => item.axis.xMax)),
        7,
    );
    const yAxis = niceAxis(
        Math.min(0, ...series.map((item) => item.axis.yMin)),
        Math.max(1, ...series.map((item) => item.axis.yMax)),
        6,
    );
    const x = d3.scaleLinear().domain([xAxis.min, xAxis.max]).range([plot.left, plot.right]);
    const y = d3.scaleLinear().domain([yAxis.min, yAxis.max]).range([plot.bottom, plot.top]);

    ctx.save();
    const first = series.find((item) => item.current || item.ghost);
    const firstPane = first?.current?.pane ?? first?.ghost?.pane;
    if (firstPane && firstPane.collapsePressure > xAxis.min && firstPane.collapsePressure < xAxis.max) {
        ctx.fillStyle = 'rgba(51, 65, 85, 0.24)';
        ctx.fillRect(plot.left, plot.top, x(firstPane.collapsePressure) - plot.left, plot.bottom - plot.top);
    }

    ctx.strokeStyle = '#243244';
    ctx.lineWidth = 1;
    ctx.beginPath();
    x.ticks(7).forEach((t) => { ctx.moveTo(x(t), plot.top); ctx.lineTo(x(t), plot.bottom); });
    y.ticks(6).forEach((t) => { ctx.moveTo(plot.left, y(t)); ctx.lineTo(plot.right, y(t)); });
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(plot.left, plot.bottom);
    ctx.lineTo(plot.right, plot.bottom);
    ctx.moveTo(plot.left, plot.top);
    ctx.lineTo(plot.left, plot.bottom);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    x.ticks(7).forEach((t) => ctx.fillText(formatTick(t), x(t), plot.bottom + 6));
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    y.ticks(6).forEach((t) => ctx.fillText(formatTick(t), plot.left - 7, y(t)));

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '11px sans-serif';
    ctx.fillText(side === 'right' ? 'RAP / CVP (mmHg)' : 'LAP / PCWP (mmHg)', (plot.left + plot.right) / 2, height - 34);
    ctx.save();
    ctx.translate(14, (plot.top + plot.bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Flow (L/min)', 0, 0);
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(side === 'right' ? 'Systemic Guyton / RV Starling' : 'Pulmonary Guyton / LV Starling', plot.left, 10);

    for (const item of series) {
        const base = d3.color(item.inst.color) ?? d3.color('#a855f7')!;
        const venousColor = base.brighter(1.15).formatHex();
        const classicColor = base.brighter(0.2).formatHex();
        const sweepColor = '#fb923c';

        if (item.ghost) {
            drawGuytonSteadyMap(ctx, item.ghost, {
                venousColor,
                classicColor,
                sweepColor,
                pointColor: item.inst.color,
                alpha: GUYTON_STEADY_GHOST_ALPHA,
                label: undefined,
                side,
                x,
                y,
                plot,
            });
        }
        if (item.current) {
            drawGuytonSteadyMap(ctx, item.current, {
                venousColor,
                classicColor,
                sweepColor,
                pointColor: item.inst.color,
                alpha: 1,
                label: item.inst.name,
                side,
                x,
                y,
                plot,
            });
        }
    }

    drawLegend(ctx, plot, {
        hasSweep: Boolean(series.some((item) => {
            const map = item.current ?? item.ghost;
            const sweep = side === 'right' ? map?.sweep.right : map?.sweep.left;
            return sweep && sweep.points.length >= 2;
        })),
        hasGhost: Boolean(series.some((item) => item.ghost)),
    });
    ctx.restore();
}

function drawGuytonSteadyMap(
    ctx: CanvasRenderingContext2D,
    map: GuytonSteadyMap,
    args: {
        venousColor: string;
        classicColor: string;
        sweepColor: string;
        pointColor: string;
        alpha: number;
        label?: string;
        side: GuytonSide;
        x: d3.ScaleLinear<number, number>;
        y: d3.ScaleLinear<number, number>;
        plot: { left: number; right: number; top: number; bottom: number };
    },
) {
    ctx.save();
    ctx.globalAlpha = args.alpha;
    drawVertical(ctx, args.x(map.pane.fillingPressure), args.plot, args.classicColor, [4, 4]);
    drawLine(ctx, map.pane.classicVenousReturn.points, args.x, args.y, args.classicColor, 1.2, [4, 5]);
    drawLine(ctx, map.pane.venousReturn.points, args.x, args.y, args.venousColor, 2.2);

    const sweep = args.side === 'right' ? map.sweep.right : map.sweep.left;
    if (sweep && sweep.points.length >= 2) {
        drawLine(ctx, sweep.points, args.x, args.y, args.sweepColor, 2);
        for (const point of sweep.points) drawPoint(ctx, args.x(point.x), args.y(point.y), args.sweepColor, point.settled === false ? 2.5 : 3.5);
    }

    drawPoint(ctx, args.x(map.pane.operatingPoint.pressure), args.y(map.pane.operatingPoint.flow), args.pointColor, 5.5);
    if (args.label) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(args.label, args.x(map.pane.operatingPoint.pressure) + 7, args.y(map.pane.operatingPoint.flow));
    }
    ctx.restore();
}


function drawLine(
    ctx: CanvasRenderingContext2D,
    points: GuytonCurvePoint[],
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleLinear<number, number>,
    color: string,
    width: number,
    dash: number[] = [],
) {
    if (points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    points.forEach((point, index) => {
        const px = x(point.x);
        const py = y(point.y);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
}

function drawVertical(
    ctx: CanvasRenderingContext2D,
    px: number,
    plot: { left: number; right: number; top: number; bottom: number },
    color: string,
    dash: number[],
) {
    if (px < plot.left || px > plot.right) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(px, plot.top);
    ctx.lineTo(px, plot.bottom);
    ctx.stroke();
    ctx.restore();
}

function drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawLegend(
    ctx: CanvasRenderingContext2D,
    plot: { right: number; top: number },
    options: { hasSweep: boolean; hasGhost: boolean },
) {
    const x0 = plot.right - 154;
    const y0 = plot.top + 6;
    const rows: Array<[string, string]> = [['#38bdf8', 'venous return']];
    if (options.hasSweep) rows.push(['#fb923c', 'preload sweep']);
    if (options.hasGhost) rows.push(['rgba(148, 163, 184, 0.7)', 'previous map']);
    const legendHeight = 8 + rows.length * 17;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x0 - 8, y0 - 6, 142, legendHeight, 5);
    ctx.fill();
    ctx.stroke();
    rows.forEach(([color, label], i) => {
        const yy = y0 + i * 17;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, yy);
        ctx.lineTo(x0 + 20, yy);
        ctx.stroke();
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x0 + 26, yy);
    });
    ctx.restore();
}

function formatTick(value: number): string {
    if (Math.abs(value) >= 10) return value.toFixed(0);
    if (Math.abs(value) >= 1) return value.toFixed(1);
    return value.toFixed(2);
}
