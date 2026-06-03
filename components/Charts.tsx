import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimInstance, PhysicsRefState, PanelInstanceConfig } from '../types';
import { useDocumentVisible, useOnscreen } from '../hooks/useOnscreen';
import {
    buildGuytonPaneData,
    starlingSweepSignature,
    type GuytonCurvePoint,
    type GuytonPaneData,
    type GuytonSide,
    type StarlingSweepResponse,
} from '../engine/guytonStarling';

interface ChartPanelProps {
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instances: SimInstance[];
  config: Record<string, PanelInstanceConfig>;
  showGuides?: boolean;
  showLegend?: boolean;
}

interface WaveformProps extends ChartPanelProps {
    timeWindow: number; 
}

const getColor = (baseColor: string, signal: string, customBaseColor?: string, customSignalColors?: Record<string, string>): string => {
    if (customSignalColors && customSignalColors[signal]) return customSignalColors[signal];
    const colorToUse = customBaseColor || baseColor;
    const c = d3.color(colorToUse);
    if (!c) return colorToUse;
    if (['AoP', 'PAP', 'ABP'].includes(signal)) return c.brighter(1.5).formatHex();
    if (['Pla', 'LAP', 'Pra', 'RAP', 'CVP', 'PCWP', 'LA', 'RA'].includes(signal)) return c.darker(1.2).formatHex();
    return c.formatHex();
};

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

const ChartLegend = ({ instances, config, showLegend, extraClasses = '' }: { instances: SimInstance[], config: Record<string, PanelInstanceConfig>, showLegend?: boolean, extraClasses?: string }) => {
    if (showLegend === false) return null;
    return (
        <div className={`absolute top-2 right-2 flex flex-col gap-1 z-30 pointer-events-none p-1.5 bg-slate-900/80 rounded border border-slate-700/50 backdrop-blur-sm ${extraClasses}`}>
            {instances.flatMap(inst => {
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
            })}
        </div>
    );
};

export const PVLoopPanel: React.FC<ChartPanelProps> = ({ physicsRefs, instances, config, showGuides, showLegend }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef({ maxV: 300, maxP: 200 });
  const isOnscreen = useOnscreen(containerRef);
  const isDocumentVisible = useDocumentVisible();
  const canAnimate = isOnscreen && isDocumentVisible;

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
        ctx.scale(dpr, dpr);
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

      instances.forEach(inst => {
          const cfg = (config as any)[inst.id];
          if (!cfg || !cfg.visible || cfg.selectedSignals.length === 0) return;
          
          const physState = physicsRefs.current.get(inst.id);
          if (!physState || physState.buffer.length < 2) return;
          
          const data = physState.buffer.slice(-500); 
          for (let i = 0; i < data.length; i += 10) {
              const d = data[i];
              cfg.selectedSignals.forEach((chamber: string) => {
                  let v = 0, p = 0;
                  switch(chamber) {
                      case 'LV': v = d.VLV; p = d.LVP; break;
                      case 'LA': v = d.VLA; p = d.LAP; break;
                      case 'RV': v = d.VRV; p = d.RVP; break;
                      case 'RA': v = d.VRA; p = d.RAP; break;
                  }
                  if (v > currentFrameMaxV) currentFrameMaxV = v;
                  if (p > currentFrameMaxP) currentFrameMaxP = p;
                  hasData = true;
              });
          }
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

      instances.forEach(inst => {
          const cfg = (config as any)[inst.id];
          if (!cfg || !cfg.visible) return;

          const physState = physicsRefs.current.get(inst.id);
          if (!physState || physState.buffer.length < 2) return;
          
          // PV loops must be drawn over the LAST COMPLETE beat (floor-aligned),
          // not a trailing 1.0-phase window that mixes a partial current beat —
          // otherwise the loop's crossing point shifts and stray segments appear.
          const buf = physState.buffer;
          const phiNow = buf[buf.length - 1]?.phi ?? 0;
          const beatEnd = Math.floor(phiNow);
          const beatStart = beatEnd - 1;
          let data = beatEnd >= 1 ? buf.filter(d => d.phi >= beatStart && d.phi <= beatEnd) : buf;
          const closing = beatEnd >= 1 ? buf.find(d => d.phi > beatEnd) : undefined;
          if (closing) data = [...data, closing];

          cfg.selectedSignals.forEach((chamber: string) => {
              // The LA figure-8 needs a full beat to render its two sub-loops;
              // skip only a degenerate/partial window (live buffer is ~tens of
              // samples per beat, so the old 80 threshold hid the loop entirely).
              if (chamber === 'LA' && data.length < 16) return;
              const color = getColor(inst.color, chamber, cfg.customBaseColor, cfg.customSignalColors);
              
              ctx.beginPath();
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              
              let isFirst = true;
              for (let i = 0; i < data.length; i++) {
                  const d = data[i];
                  let v = 0, p = 0;
                  switch (chamber) {
                      case 'LV': v = d.VLV; p = d.LVP; break;
                      case 'LA': v = d.VLA; p = d.LAP; break;
                      case 'RV': v = d.VRV; p = d.RVP; break;
                      case 'RA': v = d.VRA; p = d.RAP; break;
                  }
                  
                  const px = xScale(v);
                  const py = yScale(p);
                  
                  if (isFirst) {
                      ctx.moveTo(px, py);
                      isFirst = false;
                  } else {
                      ctx.lineTo(px, py);
                  }
              }
              ctx.stroke();

              // Marker rides the LIVE current sample (buf end), not the end of the
              // last-complete-beat window — otherwise the dot sits at a near-fixed
              // phase and only jumps once per beat instead of tracking the loop.
              const lastPoint = buf[buf.length - 1];
              if (lastPoint) {
                 let v = 0, p = 0;
                 switch (chamber) {
                      case 'LV': v = lastPoint.VLV; p = lastPoint.LVP; break;
                      case 'LA': v = lastPoint.VLA; p = lastPoint.LAP; break;
                      case 'RV': v = lastPoint.VRV; p = lastPoint.RVP; break;
                      case 'RA': v = lastPoint.VRA; p = lastPoint.RAP; break;
                 }
                 ctx.beginPath();
                 ctx.arc(xScale(v), yScale(p), 4, 0, Math.PI * 2);
                 ctx.fillStyle = color;
                 ctx.fill();
              }
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
  }, [instances, config, showGuides, canAnimate]);

  return (
      <div ref={containerRef} className="absolute inset-0 rounded-b-xl overflow-hidden pointer-events-none">
         <ChartLegend instances={instances} config={config} showLegend={showLegend} />
         <canvas ref={canvasRef} className="block pointer-events-auto" />
      </div>
  );
};

export const WaveformPanel: React.FC<WaveformProps> = ({ physicsRefs, instances, timeWindow, config, showLegend }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scaleRef = useRef({ yMin: 0, yMax: 160 });
    const isOnscreen = useOnscreen(containerRef);
    const isDocumentVisible = useDocumentVisible();
    const canAnimate = isOnscreen && isDocumentVisible;

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
            ctx.scale(dpr, dpr);
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

            let frameYMax = 50;
            let frameYMin = 0;
            let hasData = false;

            instances.forEach(inst => {
                const cfg = (config as any)[inst.id];
                if (!cfg || !cfg.visible || cfg.selectedSignals.length === 0) return;
                const physState = physicsRefs.current.get(inst.id);
                if (!physState) return;
                
                const stepFrames = 10;
                for (let i = 0; i < physState.buffer.length; i += stepFrames) {
                    const d = physState.buffer[i];
                    if (d.t < tMin || d.t > tMax) continue;
                    cfg.selectedSignals.forEach((sig: string) => {
                        let val = 0;
                        switch(sig) {
                            case 'Plv': case 'LVP': val = d.LVP; break;
                            case 'Pla': case 'LAP': val = d.LAP; break;
                            case 'Prv': case 'RVP': val = d.RVP; break;
                            case 'Pra': case 'RAP': val = d.RAP; break;
                            case 'AoP': val = d.AoP; break;
                            case 'PAP': val = d.PAP; break;
                            case 'QAo': val = d.QAo; break;
                            case 'QMV': val = d.QMV; break;
                            case 'QPA': val = d.QPA; break;
                            case 'QPV': val = d.QPV; break;
                            case 'QTV': val = d.QTV; break;
                            case 'PVF': val = d.PVF; break;
                            case 'SVF': val = d.SVF; break;
                            case 'QCorLAD': val = d.QCorLAD; break;
                            case 'QCorLCx': val = d.QCorLCx; break;
                            case 'QCorRCA': val = d.QCorRCA; break;
                            case 'QCorTotal': val = d.QCorTotal; break;
                            case 'QCS': val = d.QCS; break;
                            case 'PimLAD': val = d.PimLAD; break;
                            case 'PimLCx': val = d.PimLCx; break;
                            case 'PimRCA': val = d.PimRCA; break;
                            case 'PLADArt': val = d.PLADArt; break;
                            case 'PLCxArt': val = d.PLCxArt; break;
                            case 'PRCAArt': val = d.PRCAArt; break;
                            case 'PCS': val = d.PCS; break;
                            case 'VRA': val = d.VRA; break;
                            case 'aRA': val = d.aRA; break;
                            case 'cRA': val = d.cRA; break;
                            case 'xiTV': val = d.xiTV; break;
                            case 'xiPV': val = d.xiPV; break;
                            case 'dP_TV': val = d.dP_TV; break;
                            case 'dP_PV': val = d.dP_PV; break;
                            case 'Pperi': val = d.Pperi; break;
                            case 'Ppc': val = d.Ppc; break;
                            case 'VHeart': val = d.VHeart; break;
                            case 'septumShiftMl': val = d.septumShiftMl; break;
                            case 'VLVeff': val = d.VLVeff; break;
                            case 'VRVeff': val = d.VRVeff; break;
                            case 'PLVfw': val = d.PLVfw; break;
                            case 'PRVfw': val = d.PRVfw; break;
                            case 'PVI_LV': val = d.PVI_LV; break;
                            case 'PVI_RV': val = d.PVI_RV; break;
                            case 'septalForceMmHg': val = d.septalForceMmHg; break;
                        }
                        if (val > frameYMax) frameYMax = val;
                        if (val < frameYMin) frameYMin = val;
                        hasData = true;
                    });
                }
            });

            if (hasData) {
                // Nice-number + hysteretic scaling: stable axis that only rescales when
                // the trace clips or shrinks well inside the window, and that resolves
                // low-amplitude signals (CVP/LAP ~2 mmHg) instead of flattening them.
                const r = { min: scaleRef.current.yMin, max: scaleRef.current.yMax };
                stableRange(r, frameYMin, frameYMax, { ticks: 5 });
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

                const drawStep = Math.max(1, Math.floor(physState.buffer.length / (width * 2)));

                cfg.selectedSignals.forEach((sig: string) => {
                    const color = getColor(inst.color, sig, cfg.customBaseColor, cfg.customSignalColors);
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;

                    let prevX = -1;
                    let lastPx = -1;
                    let lastPy = -1;

                    for (let i = 0; i < physState.buffer.length; i += drawStep) {
                        const d = physState.buffer[i];
                        if (d.t < tMin) continue;
                        if (d.t > tMax) break;

                        let val = 0;
                        switch(sig) {
                            case 'Plv': case 'LVP': val = d.LVP; break;
                            case 'Pla': case 'LAP': val = d.LAP; break;
                            case 'Prv': case 'RVP': val = d.RVP; break;
                            case 'Pra': case 'RAP': val = d.RAP; break;
                            case 'AoP': val = d.AoP; break;
                            case 'PAP': val = d.PAP; break;
                            case 'QAo': val = d.QAo; break;
                            case 'QMV': val = d.QMV; break;
                            case 'QPA': val = d.QPA; break;
                            case 'QPV': val = d.QPV; break;
                            case 'QTV': val = d.QTV; break;
                            case 'PVF': val = d.PVF; break;
                            case 'SVF': val = d.SVF; break;
                            case 'QCorLAD': val = d.QCorLAD; break;
                            case 'QCorLCx': val = d.QCorLCx; break;
                            case 'QCorRCA': val = d.QCorRCA; break;
                            case 'QCorTotal': val = d.QCorTotal; break;
                            case 'QCS': val = d.QCS; break;
                            case 'PimLAD': val = d.PimLAD; break;
                            case 'PimLCx': val = d.PimLCx; break;
                            case 'PimRCA': val = d.PimRCA; break;
                            case 'PLADArt': val = d.PLADArt; break;
                            case 'PLCxArt': val = d.PLCxArt; break;
                            case 'PRCAArt': val = d.PRCAArt; break;
                            case 'PCS': val = d.PCS; break;
                            case 'VRA': val = d.VRA; break;
                            case 'aRA': val = d.aRA; break;
                            case 'cRA': val = d.cRA; break;
                            case 'xiTV': val = d.xiTV; break;
                            case 'xiPV': val = d.xiPV; break;
                            case 'dP_TV': val = d.dP_TV; break;
                            case 'dP_PV': val = d.dP_PV; break;
                            case 'Pperi': val = d.Pperi; break;
                            case 'Ppc': val = d.Ppc; break;
                            case 'VHeart': val = d.VHeart; break;
                            case 'septumShiftMl': val = d.septumShiftMl; break;
                            case 'VLVeff': val = d.VLVeff; break;
                            case 'VRVeff': val = d.VRVeff; break;
                            case 'PLVfw': val = d.PLVfw; break;
                            case 'PRVfw': val = d.PRVfw; break;
                            case 'PVI_LV': val = d.PVI_LV; break;
                            case 'PVI_RV': val = d.PVI_RV; break;
                            case 'septalForceMmHg': val = d.septalForceMmHg; break;
                        }

                        const modT = d.t % timeSec;
                        const px = xScale(modT);
                        const py = yScale(val);

                        if (prevX === -1 || px < prevX) {
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.strokeStyle = color;
                            ctx.lineWidth = 1.5;
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                        prevX = px;
                        lastPx = px;
                        lastPy = py;
                    }
                    ctx.stroke();

                    if (lastPx !== -1) {
                         ctx.beginPath();
                         ctx.arc(lastPx, lastPy, 4, 0, Math.PI * 2);
                         const c = d3.color(color);
                         ctx.fillStyle = c ? c.brighter(0.5).formatHex() : color;
                         ctx.fill();
                    }
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
    }, [instances, timeWindow, config, canAnimate]);

    return (
        <div ref={containerRef} className="absolute inset-0 rounded-b-xl overflow-hidden pointer-events-none">
            <ChartLegend instances={instances} config={config} showLegend={showLegend} />
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
    pane: GuytonPaneData;
    sweep?: StarlingSweepResponse;
    signature: string;
};

export const GuytonPanel: React.FC<ChartPanelProps & { type: string }> = ({ physicsRefs, instances, config, type }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isOnscreen = useOnscreen(containerRef);
    const isDocumentVisible = useDocumentVisible();
    const canAnimate = isOnscreen && isDocumentVisible;
    const side: GuytonSide = type === 'GUYTON_LEFT' ? 'left' : 'right';
    const [tick, setTick] = useState(0);
    const [sweeps, setSweeps] = useState<Record<string, StarlingSweepResponse>>({});
    const [sweepBusy, setSweepBusy] = useState(false);
    const [sweepError, setSweepError] = useState<string | null>(null);

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

    useEffect(() => {
        const interval = window.setInterval(() => setTick((t) => t + 1), 500);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (typeof Worker === 'undefined' || sweepInputs.length === 0) return;
        let cancelled = false;
        let remaining = sweepInputs.length;
        const worker = new Worker(new URL('../engine/guytonStarlingWorker.ts', import.meta.url), { type: 'module' });
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setSweepBusy(true);
            setSweepError(null);
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

        worker.onmessage = (event: MessageEvent<StarlingSweepResponse>) => {
            if (cancelled) return;
            const response = event.data;
            if (response.error) setSweepError(response.error);
            else setSweeps((prev) => ({ ...prev, [response.instanceId]: response }));
            remaining -= 1;
            if (remaining <= 0) {
                setSweepBusy(false);
                worker.terminate();
            }
        };
        worker.onerror = (event) => {
            if (cancelled) return;
            setSweepError(event.message || 'Starling sweep worker failed');
            setSweepBusy(false);
            worker.terminate();
        };

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            worker.terminate();
        };
    }, [sweepKey]);

    const series: GuytonSeries[] = useMemo(() => {
        void tick;
        return visibleInstances.flatMap((inst) => {
            const ref = physicsRefs.current.get(inst.id);
            if (!ref) return [];
            try {
                const pane = buildGuytonPaneData(side, ref.core.metrics(), ref.core.debugObservables());
                const signature = starlingSweepSignature(side, inst.id, inst.params, inst.targetVolume);
                const sweep = sweeps[inst.id]?.signature === signature ? sweeps[inst.id] : undefined;
                return [{ inst, pane, sweep, signature }];
            } catch {
                return [];
            }
        });
    }, [visibleInstances, physicsRefs, side, sweeps, tick]);

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

    const primary = series[0]?.pane;
    const primarySweep = series[0]?.sweep;
    const primaryStarling = side === 'right' ? primarySweep?.right : primarySweep?.left;
    const warnings = [
        ...(primary?.warnings ?? []),
        ...(primaryStarling?.warnings ?? []),
        ...(sweepError ? [sweepError] : []),
    ].slice(0, 2);

    return (
        <div ref={containerRef} className="absolute inset-0 bg-[#0B1120] rounded-b-xl overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            {primary && (
                <div className="absolute left-3 right-3 bottom-2 flex flex-wrap gap-1.5 pointer-events-none">
                    <GuytonStat label={primary.fillingPressureLabel} value={primary.fillingPressure} unit="mmHg" />
                    <GuytonStat label={side === 'right' ? 'RAP' : 'LAP'} value={primary.operatingPoint.pressure} unit="mmHg" />
                    <GuytonStat label="CO" value={primary.operatingPoint.flow} unit="L/min" />
                    <GuytonStat label="Gradient" value={primary.gradient} unit="mmHg" />
                    <GuytonStat label="Rvr" value={primary.summary.effectiveResistanceMmHgPerLMin} unit="mmHg/L/min" />
                    <GuytonStat label="Stressed V" value={primary.summary.stressedVolumeMl} unit="mL" decimals={0} />
                    {sweepBusy && <span className="rounded border border-slate-700/70 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-400">Sweep...</span>}
                    {warnings.map((warning) => (
                        <span key={warning} className="rounded border border-amber-500/30 bg-amber-950/40 px-2 py-1 text-[10px] text-amber-200">{warning}</span>
                    ))}
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

function GuytonStat({ label, value, unit, decimals = 1 }: { label: string; value: number; unit: string; decimals?: number }) {
    return (
        <span className="rounded border border-slate-700/70 bg-slate-950/80 px-2 py-1 text-[10px]">
            <span className="text-slate-500">{label}</span>
            <span className="ml-1 font-mono text-slate-100">{Number.isFinite(value) ? value.toFixed(decimals) : '--'}</span>
            <span className="ml-0.5 text-slate-500">{unit}</span>
        </span>
    );
}

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

    const allPoints: GuytonCurvePoint[] = [];
    for (const item of series) {
        allPoints.push(...item.pane.venousReturn.points, ...item.pane.classicVenousReturn.points, ...item.pane.localStarling.points);
        const sweep = side === 'right' ? item.sweep?.right : item.sweep?.left;
        if (sweep) allPoints.push(...sweep.points);
        allPoints.push({ x: item.pane.operatingPoint.pressure, y: item.pane.operatingPoint.flow });
        allPoints.push({ x: item.pane.fillingPressure, y: 0 });
    }
    if (allPoints.length === 0) return;

    const xExtent = d3.extent(allPoints, (p) => p.x) as [number, number];
    const yMax = Math.max(1, d3.max(allPoints, (p) => p.y) ?? 1);
    const xAxis = niceAxis(xExtent[0], xExtent[1], 7);
    const yAxis = niceAxis(0, yMax * 1.05, 6);
    const x = d3.scaleLinear().domain([xAxis.min, xAxis.max]).range([plot.left, plot.right]);
    const y = d3.scaleLinear().domain([yAxis.min, yAxis.max]).range([plot.bottom, plot.top]);

    ctx.save();
    const first = series[0]?.pane;
    if (first && first.collapsePressure > xAxis.min && first.collapsePressure < xAxis.max) {
        ctx.fillStyle = 'rgba(51, 65, 85, 0.24)';
        ctx.fillRect(plot.left, plot.top, x(first.collapsePressure) - plot.left, plot.bottom - plot.top);
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
        const starlingColor = '#f43f5e';

        drawVertical(ctx, x(item.pane.fillingPressure), plot, classicColor, [4, 4]);
        drawLine(ctx, item.pane.classicVenousReturn.points, x, y, classicColor, 1.2, [4, 5]);
        drawLine(ctx, item.pane.venousReturn.points, x, y, venousColor, 2.2);

        const sweep = side === 'right' ? item.sweep?.right : item.sweep?.left;
        if (sweep && sweep.points.length >= 2) {
            drawLine(ctx, sweep.points, x, y, sweepColor, 2);
            for (const point of sweep.points) drawPoint(ctx, x(point.x), y(point.y), sweepColor, point.settled === false ? 2.5 : 3.5);
        } else {
            drawLine(ctx, item.pane.localStarling.points, x, y, starlingColor, 1.7, [6, 4]);
        }

        drawPoint(ctx, x(item.pane.operatingPoint.pressure), y(item.pane.operatingPoint.flow), item.inst.color, 5.5);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.inst.name, x(item.pane.operatingPoint.pressure) + 7, y(item.pane.operatingPoint.flow));
    }

    drawLegend(ctx, plot, Boolean(series.some((item) => {
        const sweep = side === 'right' ? item.sweep?.right : item.sweep?.left;
        return sweep && sweep.points.length >= 2;
    })));
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

function drawLegend(ctx: CanvasRenderingContext2D, plot: { right: number; top: number }, hasSweep: boolean) {
    const x0 = plot.right - 154;
    const y0 = plot.top + 6;
    const rows = [
        ['#38bdf8', 'venous return'],
        [hasSweep ? '#fb923c' : '#f43f5e', hasSweep ? 'preload sweep' : 'local Starling'],
    ] as const;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x0 - 8, y0 - 6, 142, 42, 5);
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
