import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimInstance, PhysicsRefState, PanelInstanceConfig } from '../types';

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

  useEffect(() => {
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

    let animationFrameId: number;

    const render = () => {
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
          currentFrameMaxV *= 1.1; 
          currentFrameMaxP *= 1.1;
          scaleRef.current.maxV = scaleRef.current.maxV * 0.9 + Math.max(150, Math.ceil(currentFrameMaxV / 50) * 50) * 0.1;
          scaleRef.current.maxP = scaleRef.current.maxP * 0.9 + Math.max(100, Math.ceil(currentFrameMaxP / 50) * 50) * 0.1;
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
          
          const T_s = 60 / Math.max(inst.params.HR, 1);
          const pointsNeeded = Math.ceil((T_s * 1.5) / 0.002);
          const startIndex = Math.max(0, physState.buffer.length - pointsNeeded);
          
          const data = physState.buffer.slice(startIndex);
          
          cfg.selectedSignals.forEach((chamber: string) => {
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

              const lastPoint = data[data.length - 1];
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
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
    };
  }, [instances, config, showGuides]);

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

    useEffect(() => {
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

        let animationFrameId: number;

        const render = () => {
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
                            case 'QTV': val = d.QTV; break;
                        }
                        if (val > frameYMax) frameYMax = val;
                        if (val < frameYMin) frameYMin = val;
                        hasData = true;
                    });
                }
            });

            if (hasData) {
                frameYMax = Math.ceil(frameYMax / 40) * 40;
                frameYMin = Math.floor(frameYMin / 10) * 10;
                scaleRef.current.yMax = scaleRef.current.yMax * 0.95 + frameYMax * 0.05;
                scaleRef.current.yMin = scaleRef.current.yMin * 0.95 + frameYMin * 0.05;
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
                            case 'QTV': val = d.QTV; break;
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
        return () => { cancelAnimationFrame(animationFrameId); ro.disconnect(); };
    }, [instances, timeWindow, config]);

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
