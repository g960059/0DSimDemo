import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimInstance, PhysicsRefState, PanelInstanceConfig } from '../types';
import { useDocumentVisible, useOnscreen } from '../hooks/useOnscreen';

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
                            case 'VRA': val = d.VRA; break;
                            case 'aRA': val = d.aRA; break;
                            case 'cRA': val = d.cRA; break;
                            case 'xiTV': val = d.xiTV; break;
                            case 'xiPV': val = d.xiPV; break;
                            case 'dP_TV': val = d.dP_TV; break;
                            case 'dP_PV': val = d.dP_PV; break;
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
                            case 'VRA': val = d.VRA; break;
                            case 'aRA': val = d.aRA; break;
                            case 'cRA': val = d.cRA; break;
                            case 'xiTV': val = d.xiTV; break;
                            case 'xiPV': val = d.xiPV; break;
                            case 'dP_TV': val = d.dP_TV; break;
                            case 'dP_PV': val = d.dP_PV; break;
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
                    'RVEF': Math.round(met.EF_RApprox * 100)
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
                    'RVEF': '%'
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

export const GuytonPanel: React.FC<ChartPanelProps & { type: string }> = ({ physicsRefs, instances, config, type }) => {
    // Guyton Plot Disabled temporarily for refactor, 
    // rendering just the operating point for now.
    const [tick, setTick] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 500); 
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="absolute inset-0 p-2 overflow-y-auto flex items-center justify-center bg-[#0B1120] rounded-b-xl">
           <div className="flex flex-col text-center opacity-50">
                <span className="text-sm font-bold text-slate-400">Guyton Plot</span>
                <span className="text-xs text-slate-500 mt-2">Analytical intersection rendering <br/> is disabled for ModelCore v2</span> 
           </div>
        </div>
    );
};
