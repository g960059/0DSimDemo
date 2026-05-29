import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimInstance, PhysicsRefState, PanelInstanceConfig } from '../types';

interface ChartPanelProps {
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instances: SimInstance[];
  config: PanelInstanceConfig;
  showGuides?: boolean;
}

interface WaveformProps extends ChartPanelProps {
    timeWindow: number; 
}

const getColor = (baseColor: string, signal: string, customColors?: { [key: string]: string }): string => {
    if (customColors && customColors[signal]) return customColors[signal];
    const c = d3.color(baseColor);
    if (!c) return baseColor;
    if (['AoP', 'PAP', 'ABP'].includes(signal)) return c.brighter(1.5).formatHex();
    if (['Pla', 'LAP', 'Pra', 'RAP', 'CVP', 'PCWP', 'LA', 'RA'].includes(signal)) return c.darker(1.2).formatHex();
    return c.formatHex();
};

export const PVLoopPanel: React.FC<ChartPanelProps> = ({ physicsRefs, instances, config, showGuides }) => {
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
      const xScale = d3.scaleLinear().domain([0, 300]).range([50, width - 20]);
      const yScale = d3.scaleLinear().domain([0, 200]).range([height - 40, 20]);

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

      xScale.domain([0, scaleRef.current.maxV]).range([50, width - 20]);
      yScale.domain([0, scaleRef.current.maxP]).range([height - 40, 20]);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      xScale.ticks(6).forEach(t => { ctx.moveTo(xScale(t), height-40); ctx.lineTo(xScale(t), 20); });
      yScale.ticks(6).forEach(t => { ctx.moveTo(50, yScale(t)); ctx.lineTo(width-20, yScale(t)); });
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      xScale.ticks(6).forEach(t => ctx.fillText(t.toString(), xScale(t), height - 25));
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      yScale.ticks(6).forEach(t => ctx.fillText(t.toString(), 45, yScale(t)));

      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("Volume (mL)", width / 2, height - 10);
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
              const color = getColor(inst.color, chamber, cfg.customColors);
              
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
      <div ref={containerRef} className="w-full h-full relative">
         <canvas ref={canvasRef} className="block" />
      </div>
  );
};

export const WaveformPanel: React.FC<WaveformProps> = ({ physicsRefs, instances, timeWindow, config }) => {
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
            const tMin = Math.max(0, currentGlobalTime - (timeWindow / 1000));
            const tMax = Math.max((timeWindow / 1000), currentGlobalTime);

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

            const xScale = d3.scaleLinear().domain([tMin, tMax]).range([40, width - 10]);
            const yScale = d3.scaleLinear().domain([scaleRef.current.yMin, scaleRef.current.yMax]).range([height - 20, 10]);

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            yScale.ticks(4).forEach(t => { ctx.moveTo(40, yScale(t)); ctx.lineTo(width-10, yScale(t)); });
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            yScale.ticks(4).forEach(t => ctx.fillText(t.toString(), 35, yScale(t)));

            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            xScale.ticks(5).forEach(t => ctx.fillText(t.toFixed(1) + 's', xScale(t) + 2, height - 15));

            instances.forEach(inst => {
                const cfg = (config as any)[inst.id];
                if (!cfg || !cfg.visible) return;
                const physState = physicsRefs.current.get(inst.id);
                if (!physState) return;

                const drawStep = Math.max(1, Math.floor(physState.buffer.length / (width * 2)));

                cfg.selectedSignals.forEach((sig: string) => {
                    const color = getColor(inst.color, sig, cfg.customColors);
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;

                    let isFirst = true;
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

                        const px = xScale(d.t);
                        const py = yScale(val);

                        if (isFirst) { ctx.moveTo(px, py); isFirst = false; } 
                        else { ctx.lineTo(px, py); }
                    }
                    ctx.stroke();
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
        <div ref={containerRef} className="w-full h-full relative">
            <canvas ref={canvasRef} className="block" />
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
        <div className="w-full h-full p-2 overflow-y-auto custom-scrollbar">
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
                    'LVEF': Math.round(met.EF_LApprox * 100) + '%',
                    'RVEF': Math.round(met.EF_RApprox * 100) + '%'
                };

                return (
                    <div key={inst.id} className="mb-4">
                         <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-800">
                             <div className="w-2 h-2 rounded-full" style={{backgroundColor: inst.color}}></div>
                             <span className="font-bold text-xs text-slate-300">{inst.name}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                             {cfg.selectedSignals.map((sig: string) => (
                                 metricsMap[sig] ? (
                                     <div key={sig} className="flex flex-col bg-slate-950/50 p-1.5 rounded">
                                         <span className="text-[10px] text-slate-500 uppercase font-bold">{sig}</span>
                                         <span className="text-sm font-mono text-slate-200">{metricsMap[sig]}</span>
                                     </div>
                                 ) : null
                             ))}
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
        <div className="w-full h-full p-2 overflow-y-auto flex items-center justify-center bg-slate-900 border border-slate-800 rounded">
           <div className="flex flex-col text-center opacity-50">
                <span className="text-sm font-bold text-slate-400">Guyton Plot</span>
                <span className="text-xs text-slate-500 mt-2">Analytical intersection rendering <br/> is disabled for ModelCore v2</span> 
           </div>
        </div>
    );
};
