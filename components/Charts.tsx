import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimInstance, PhysicsRefState, ChamberId, SignalType, PanelInstanceConfig, MetricType, PanelType, SimulationParams } from '../types';

interface ChartPanelProps {
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instances: SimInstance[];
  config: PanelInstanceConfig;
  showGuides?: boolean;
}

interface WaveformProps extends ChartPanelProps {
    timeWindow: number; 
}

interface GuytonProps extends ChartPanelProps {
    type: 'GUYTON_RIGHT' | 'GUYTON_LEFT' | 'GUYTON_3D';
}

// Helper: Color logic
const getColor = (baseColor: string, signal: string, customColors?: { [key: string]: string }): string => {
    if (customColors && customColors[signal]) {
        return customColors[signal];
    }
    const c = d3.color(baseColor);
    if (!c) return baseColor;

    switch (signal) {
        // Waveform Signals
        case 'AoP': case 'PAP': case 'ABP':
            return c.brighter(1.5).formatHex(); 
        case 'Pla': case 'Pra': case 'CVP': case 'PCWP':
            return c.darker(1.2).formatHex();
        // PV Loop Chambers
        case 'LA': case 'RA':
             return c.darker(1.2).formatHex();
        default: return c.formatHex();
    }
};

// --------------------------------------------------------
// PV Loop Panel
// --------------------------------------------------------
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

    const xScale = d3.scaleLinear().domain([0, 300]).range([50, width - 20]);
    const yScale = d3.scaleLinear().domain([0, 200]).range([height - 40, 20]);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Auto-scale calc
      let currentFrameMaxV = 0;
      let currentFrameMaxP = 0;
      let hasData = false;

      instances.forEach(inst => {
          const cfg = config[inst.id];
          if (!cfg || !cfg.visible || cfg.selectedSignals.length === 0) return;
          
          const physState = physicsRefs.current.get(inst.id);
          if (!physState || physState.buffer.length < 2) return;
          
          const data = physState.buffer.slice(-500); 
          for (let i = 0; i < data.length; i += 10) {
              const d = data[i];
              cfg.selectedSignals.forEach(chamber => {
                  let v = 0, p = 0;
                  switch(chamber) {
                      case 'LV': v = d.y.Qlv; p = d.aux.Plv; break;
                      case 'LA': v = d.y.Qla; p = d.aux.Pla; break;
                      case 'RV': v = d.y.Qrv; p = d.aux.Prv; break;
                      case 'RA': v = d.y.Qra; p = d.aux.Pra; break;
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
          // Smooth Lerp
          scaleRef.current.maxV = scaleRef.current.maxV * 0.9 + Math.max(150, Math.ceil(currentFrameMaxV / 50) * 50) * 0.1;
          scaleRef.current.maxP = scaleRef.current.maxP * 0.9 + Math.max(100, Math.ceil(currentFrameMaxP / 50) * 50) * 0.1;
      }

      xScale.domain([0, scaleRef.current.maxV]).range([50, width - 20]);
      yScale.domain([0, scaleRef.current.maxP]).range([height - 40, 20]);

      // 2. Draw Grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      xScale.ticks(6).forEach(t => { ctx.moveTo(xScale(t), height-40); ctx.lineTo(xScale(t), 20); });
      yScale.ticks(6).forEach(t => { ctx.moveTo(50, yScale(t)); ctx.lineTo(width-20, yScale(t)); });
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      xScale.ticks(6).forEach(t => ctx.fillText(t.toString(), xScale(t), height - 25));
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      yScale.ticks(6).forEach(t => ctx.fillText(t.toString(), 45, yScale(t)));

      // Titles
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("Volume (mL)", width / 2, height - 10);
      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Pressure (mmHg)", 0, 0);
      ctx.restore();

      // 3. Draw Data
      instances.forEach(inst => {
          const cfg = config[inst.id];
          if (!cfg || !cfg.visible) return;

          const physState = physicsRefs.current.get(inst.id);
          if (!physState || physState.buffer.length < 2) return;
          const loopData = physState.buffer.slice(-1200); 

          if (showGuides && cfg.selectedSignals.includes('LV')) {
              ctx.save();
              ctx.setLineDash([2, 4]);
              ctx.lineWidth = 1;
              ctx.globalAlpha = 0.5;
              ctx.strokeStyle = inst.color;
              const vMax = scaleRef.current.maxV;
              // ESPVR
              ctx.beginPath();
              ctx.moveTo(xScale(inst.params.LV_V0), yScale(0));
              ctx.lineTo(xScale(vMax), yScale(inst.params.LV_Ees * (vMax - inst.params.LV_V0)));
              ctx.stroke();
              // EDPVR
              ctx.beginPath();
              let firstPt = true;
              for (let v = Math.max(0, inst.params.LV_V0); v <= vMax; v += (vMax/50)) {
                  const ped = inst.params.LV_beta * (Math.exp(inst.params.LV_alpha * (v - inst.params.LV_V0)) - 1);
                  if (ped > scaleRef.current.maxP) break;
                  const px = xScale(v), py = yScale(ped);
                  if(firstPt) { ctx.moveTo(px,py); firstPt=false;} else ctx.lineTo(px,py);
              }
              ctx.stroke();
              ctx.restore();
          }

          const drawLoop = (c: string) => {
              ctx.beginPath();
              ctx.strokeStyle = getColor(inst.color, c, cfg.customColors);
              ctx.lineWidth = 2;
              const getPt = (d: any) => {
                  switch(c) {
                      case 'LV': return [d.y.Qlv, d.aux.Plv];
                      case 'LA': return [d.y.Qla, d.aux.Pla];
                      case 'RV': return [d.y.Qrv, d.aux.Prv];
                      case 'RA': return [d.y.Qra, d.aux.Pra];
                      default: return [0,0];
                  }
              };
              if(loopData.length === 0) return;
              const [sV, sP] = getPt(loopData[0]);
              ctx.moveTo(xScale(sV), yScale(sP));
              for(let i=1; i<loopData.length; i++) {
                  const [v, p] = getPt(loopData[i]);
                  ctx.lineTo(xScale(v), yScale(p));
              }
              ctx.stroke();
              const [eV, eP] = getPt(loopData[loopData.length-1]);
              ctx.beginPath();
              ctx.fillStyle = '#fff';
              ctx.arc(xScale(eV), yScale(eP), 3, 0, 2*Math.PI);
              ctx.fill();
          }
          cfg.selectedSignals.forEach(c => drawLoop(c));
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(containerRef.current);
    return () => { cancelAnimationFrame(animationFrameId); resizeObserver.disconnect(); }
  }, [instances, config, showGuides]);

  return (
      <div ref={containerRef} className="w-full h-full relative">
         <canvas ref={canvasRef} className="block" />
      </div>
  );
};

// --------------------------------------------------------
// Waveform Panel (With Auto-Scaling)
// --------------------------------------------------------
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
        
        const margin = { top: 10, right: 10, bottom: 20, left: 40 };

        let animationFrameId: number;
        const render = () => {
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
            const yScale = d3.scaleLinear().range([margin.top + innerHeight, margin.top]);

            ctx.clearRect(0, 0, width, height);
            
            let localMin = 1000;
            let localMax = -1000;
            let hasData = false;
            let maxT = 0;

            instances.forEach(inst => {
                const cfg = config[inst.id];
                if (!cfg || !cfg.visible) return;
                const phys = physicsRefs.current.get(inst.id);
                if (!phys) return;
                if(phys.t > maxT) maxT = phys.t;

                if (phys.buffer.length < 2) return;
                const startTime = phys.t - timeWindow;
                const visibleData = phys.buffer.filter(p => p.t > startTime);
                
                if (visibleData.length === 0) return;
                const step = Math.max(1, Math.floor(visibleData.length / 200));

                for (let i = 0; i < visibleData.length; i += step) {
                     const pt = visibleData[i];
                     cfg.selectedSignals.forEach(sig => {
                         let val = 0;
                         switch(sig) {
                            case 'Plv': val = pt.aux.Plv; break;
                            case 'Pla': val = pt.aux.Pla; break;
                            case 'Prv': val = pt.aux.Prv; break;
                            case 'Pra': val = pt.aux.Pra; break;
                            case 'AoP': val = pt.aux.AoP; break;
                            case 'PAP': val = pt.aux.PAP; break;
                         }
                         if (val < localMin) localMin = val;
                         if (val > localMax) localMax = val;
                         hasData = true;
                     });
                }
            });

            if (hasData) {
                const range = localMax - localMin;
                const pad = Math.max(10, range * 0.1);
                const targetMin = Math.max(0, localMin - pad);
                const targetMax = localMax + pad;
                scaleRef.current.yMin = scaleRef.current.yMin * 0.9 + targetMin * 0.1;
                scaleRef.current.yMax = scaleRef.current.yMax * 0.9 + targetMax * 0.1;
            } else {
                scaleRef.current.yMin = scaleRef.current.yMin * 0.95;
                scaleRef.current.yMax = scaleRef.current.yMax * 0.95 + 160 * 0.05;
            }

            yScale.domain([scaleRef.current.yMin, scaleRef.current.yMax]);

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(margin.left, margin.top);
            ctx.lineTo(margin.left, margin.top + innerHeight);
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            yScale.ticks(5).forEach(t => {
                const y = yScale(t);
                ctx.beginPath();
                ctx.moveTo(margin.left, y);
                ctx.lineTo(margin.left - 5, y);
                ctx.stroke();
                ctx.fillText(t.toString(), margin.left - 8, y);
                
                ctx.save();
                ctx.strokeStyle = '#334155';
                ctx.globalAlpha = 0.2;
                ctx.beginPath();
                ctx.moveTo(margin.left, y);
                ctx.lineTo(width - margin.right, y);
                ctx.stroke();
                ctx.restore();
            });

            if (maxT === 0) { animationFrameId = requestAnimationFrame(render); return; }

            instances.forEach(inst => {
                const cfg = config[inst.id];
                if (!cfg || !cfg.visible) return;

                const phys = physicsRefs.current.get(inst.id);
                if (!phys || phys.buffer.length < 2) return;
                const validData = phys.buffer.filter(p => p.t > phys.t - timeWindow - 100);

                const drawSig = (sig: SignalType) => {
                    ctx.beginPath();
                    ctx.strokeStyle = getColor(inst.color, sig, cfg.customColors);
                    ctx.lineWidth = 2;
                    let first = true; let prevX = -1;
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(margin.left, margin.top, innerWidth, innerHeight);
                    ctx.clip();
                    ctx.beginPath();

                    for(let i=0; i<validData.length; i+=2) {
                        const pt = validData[i];
                        let val = 0;
                        switch(sig) {
                            case 'Plv': val = pt.aux.Plv; break;
                            case 'Pla': val = pt.aux.Pla; break;
                            case 'Prv': val = pt.aux.Prv; break;
                            case 'Pra': val = pt.aux.Pra; break;
                            case 'AoP': val = pt.aux.AoP; break;
                            case 'PAP': val = pt.aux.PAP; break;
                        }
                        const xRel = (pt.t % timeWindow) / timeWindow;
                        const x = margin.left + xRel * innerWidth;
                        const y = yScale(val);
                        
                        if(first) { ctx.moveTo(x,y); first=false; }
                        else { 
                            if(x < prevX) { ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y); }
                            else ctx.lineTo(x,y); 
                        }
                        prevX = x;
                    }
                    ctx.stroke();
                    ctx.restore();
                };
                cfg.selectedSignals.forEach(s => drawSig(s as SignalType));

                if(phys.buffer.length>0) {
                    const pt = phys.buffer[phys.buffer.length-1];
                    const xRel = (pt.t % timeWindow) / timeWindow;
                    const x = margin.left + xRel * innerWidth;
                    
                    const drawHead = (sig: SignalType) => {
                        let val = 0;
                        switch(sig) {
                            case 'Plv': val = pt.aux.Plv; break;
                            case 'Pla': val = pt.aux.Pla; break;
                            case 'Prv': val = pt.aux.Prv; break;
                            case 'Pra': val = pt.aux.Pra; break;
                            case 'AoP': val = pt.aux.AoP; break;
                            case 'PAP': val = pt.aux.PAP; break;
                        }
                        ctx.beginPath();
                        ctx.fillStyle = getColor(inst.color, sig, cfg.customColors);
                        ctx.arc(x, yScale(val), 4, 0, 2*Math.PI);
                        ctx.fill();
                        ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
                    };
                    cfg.selectedSignals.forEach(s => drawHead(s as SignalType));
                }
            });

            const xRelCursor = (maxT % timeWindow) / timeWindow;
            const cursorX = margin.left + xRelCursor * innerWidth;
            const eraseWidth = (300 / timeWindow) * innerWidth; 
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(margin.left, margin.top, innerWidth, innerHeight);
            ctx.clip();
            ctx.clearRect(cursorX, margin.top, eraseWidth, innerHeight);
            if (cursorX + eraseWidth > width) {
                const remainder = (cursorX + eraseWidth) - (margin.left + innerWidth);
                if (remainder > 0) ctx.clearRect(margin.left, margin.top, remainder, innerHeight);
            }
            ctx.restore();

            animationFrameId = requestAnimationFrame(render);
        };
        render();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(containerRef.current);
        return () => { cancelAnimationFrame(animationFrameId); resizeObserver.disconnect(); }
    }, [instances, timeWindow, config]);

    return (
        <div className="flex flex-col h-full w-full relative group">
            <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
                <canvas ref={canvasRef} className="block relative z-10" />
            </div>
            <div className="absolute top-2 right-2 pointer-events-none z-20 opacity-50 text-[10px] text-slate-400">
                Window: {timeWindow/1000}s
            </div>
        </div>
    );
};

// --------------------------------------------------------
// Metrics Panel
// --------------------------------------------------------
export const MetricsPanel: React.FC<ChartPanelProps> = ({ physicsRefs, instances, config }) => {
    // We update metrics every 500ms to avoid UI flickering
    const [metricsData, setMetricsData] = useState<{[key:string]: {[key:string]: string}}>({});

    useEffect(() => {
        const interval = setInterval(() => {
            const nextData: any = {};
            
            instances.forEach(inst => {
                const cfg = config[inst.id];
                if (!cfg || !cfg.visible || cfg.selectedSignals.length === 0) return;
                
                const phys = physicsRefs.current.get(inst.id);
                if (!phys || phys.buffer.length < 100) return;

                const activeHR = phys.activeParams.HR;
                const cycleMs = 60000 / activeHR;
                
                // Get data for last cardiac cycle + buffer
                const endTime = phys.t;
                const startTime = endTime - cycleMs;
                const cycleData = phys.buffer.filter(d => d.t >= startTime);
                
                if (cycleData.length < 10) return;

                const calcMetrics: {[key:string]: string} = {};

                // Helpers
                const getArr = (fn: (d:any)=>number) => cycleData.map(fn);
                const max = (arr: number[]) => Math.max(...arr);
                const min = (arr: number[]) => Math.min(...arr);
                const mean = (arr: number[]) => arr.reduce((a,b)=>a+b,0)/arr.length;

                // 1. AoP (Sys/Dia)
                if (cfg.selectedSignals.includes('ABP')) {
                    const vals = getArr(d => d.aux.AoP);
                    calcMetrics['ABP'] = `${max(vals).toFixed(0)} / ${min(vals).toFixed(0)} mmHg`;
                }
                // 2. PAP (Sys/Dia)
                if (cfg.selectedSignals.includes('PAP')) {
                    const vals = getArr(d => d.aux.PAP);
                    calcMetrics['PAP'] = `${max(vals).toFixed(0)} / ${min(vals).toFixed(0)} mmHg`;
                }
                // 3. CVP (Mean Pra)
                if (cfg.selectedSignals.includes('CVP')) {
                    const vals = getArr(d => d.aux.Pra);
                    calcMetrics['CVP'] = `${mean(vals).toFixed(1)} mmHg`;
                }
                // 4. PCWP (Mean Pla)
                if (cfg.selectedSignals.includes('PCWP')) {
                    const vals = getArr(d => d.aux.Pla);
                    calcMetrics['PCWP'] = `${mean(vals).toFixed(1)} mmHg`;
                }
                // 5. SV (Max - Min LV Volume)
                const lvVols = getArr(d => d.y.Qlv);
                const sv = max(lvVols) - min(lvVols);
                if (cfg.selectedSignals.includes('SV')) {
                    calcMetrics['SV'] = `${sv.toFixed(1)} mL`;
                }
                // 6. CO
                if (cfg.selectedSignals.includes('CO')) {
                    const co = (sv * activeHR) / 1000;
                    calcMetrics['CO'] = `${co.toFixed(2)} L/min`;
                }
                // 7. Ea (Effective Arterial Elastance) approx ESP/SV
                // ESP approx max Plv.
                if (cfg.selectedSignals.includes('Ea_LV')) {
                   const plvVals = getArr(d => d.aux.Plv);
                   const esp = max(plvVals);
                   const ea = sv > 0 ? esp / sv : 0;
                   calcMetrics['Ea_LV'] = `${ea.toFixed(2)} mmHg/mL`;
                }

                nextData[inst.id] = calcMetrics;
            });
            setMetricsData(nextData);

        }, 200);
        return () => clearInterval(interval);
    }, [instances, config]);

    return (
        <div className="w-full h-full p-2 overflow-y-auto custom-scrollbar">
            {instances.map(inst => {
                const cfg = config[inst.id];
                const data = metricsData[inst.id];
                if (!cfg || !cfg.visible || !data) return null;

                return (
                    <div key={inst.id} className="mb-4 bg-slate-900/50 rounded border border-slate-800 p-2">
                         <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-1">
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: inst.color}}></span>
                            <span className="text-xs font-bold text-slate-300">{inst.name}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                             {cfg.selectedSignals.map(sig => (
                                 data[sig] ? (
                                     <div key={sig} className="flex flex-col bg-slate-950/50 p-1.5 rounded">
                                         <span className="text-[10px] text-slate-500 uppercase font-bold">{sig}</span>
                                         <span className="text-sm font-mono text-slate-200">{data[sig]}</span>
                                     </div>
                                 ) : null
                             ))}
                         </div>
                    </div>
                )
            })}
        </div>
    );
}

// --------------------------------------------------------
// Guyton & Starling Panel (2D and 3D)
// --------------------------------------------------------
export const GuytonPanel: React.FC<GuytonProps> = ({ physicsRefs, instances, config, type }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Scaling state to smooth transitions
    const scaleRef = useRef({
        maxPra: 20,
        maxPla: 25,
        maxCO: 15
    });

    // Calc helpers based on resistance chains for Guyton
    const getGuytonParams = (p: SimulationParams) => {
        // Systemic W calculation based on resistance chain
        const W_s = 
            p.Cas_prox * (p.Rda + p.Ras + p.Rcs + p.Rvs) +
            p.Cda * (p.Ras + p.Rcs + p.Rvs) +
            p.Cas * (p.Rcs + p.Rvs) +
            p.Cvs * (p.Rvs);
        const C_s = p.Cas_prox + p.Cda + p.Cas + p.Cvs;

        // Pulmonary W
        const W_p = 
            p.Cap_prox * (p.Rcp + p.Rap + p.Rvp) +
            p.Cap * (p.Rap + p.Rvp) +
            p.Cvp * (p.Rvp);
        const C_p = p.Cap_prox + p.Cap + p.Cvp;

        return { W_s, C_s, W_p, C_p };
    };

    const getStarlingCO = (P_ed: number, Ees: number, V0: number, alpha: number, beta: number, Ea: number, HR: number) => {
        if (P_ed < 0) return 0;
        const term = (Ees / (Ees + Ea)) * (1.0 / alpha) * Math.log((P_ed + beta) / beta);
        const sv_est = Math.max(0, term); 
        return (sv_est * HR) / 1000.0; // L/min
    };

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
            
            // Common setup
            const margin = { top: 20, right: 20, bottom: 30, left: 40 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            // 1. Auto-scaling Logic
            let maxPraFound = 10;
            let maxPlaFound = 10;
            let maxCOFound = 5;

            instances.forEach(inst => {
                const cfg = config[inst.id];
                if (!cfg || !cfg.visible) return;
                const phys = physicsRefs.current.get(inst.id);
                if (!phys || phys.buffer.length < 10) return;
                const p = phys.activeParams;
                
                const lastCycle = phys.buffer.slice(-Math.floor(60000/p.HR));
                const meanPra = d3.mean(lastCycle, d => d.aux.Pra) || 0;
                const meanPla = d3.mean(lastCycle, d => d.aux.Pla) || 0;
                const vols = lastCycle.map(d => d.y.Qlv);
                const sv = (d3.max(vols)||0) - (d3.min(vols)||0);
                const meanCO = (sv * p.HR) / 1000.0;
                
                if (meanPra > maxPraFound) maxPraFound = meanPra;
                if (meanPla > maxPlaFound) maxPlaFound = meanPla;
                if (meanCO > maxCOFound) maxCOFound = meanCO;
            });

            // Target limits with padding (e.g., +30%)
            const targetMaxPra = Math.max(20, maxPraFound * 1.3);
            const targetMaxPla = Math.max(25, maxPlaFound * 1.3);
            const targetMaxCO = Math.max(15, maxCOFound * 1.3);

            // Smooth Lerp
            scaleRef.current.maxPra = scaleRef.current.maxPra * 0.9 + targetMaxPra * 0.1;
            scaleRef.current.maxPla = scaleRef.current.maxPla * 0.9 + targetMaxPla * 0.1;
            scaleRef.current.maxCO = scaleRef.current.maxCO * 0.9 + targetMaxCO * 0.1;

            const { maxPra, maxPla, maxCO } = scaleRef.current;


            if (type !== 'GUYTON_3D') {
                // -----------------------
                // 2D RENDERING
                // -----------------------
                
                const xMax = type === 'GUYTON_RIGHT' ? maxPra : maxPla;
                const xScale = d3.scaleLinear().domain([0, xMax]).range([margin.left, margin.left + innerWidth]);
                const yScale = d3.scaleLinear().domain([0, maxCO]).range([margin.top + innerHeight, margin.top]);

                // Grid
                ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
                ctx.beginPath();
                xScale.ticks(6).forEach(t => { ctx.moveTo(xScale(t), margin.top + innerHeight); ctx.lineTo(xScale(t), margin.top); });
                yScale.ticks(6).forEach(t => { ctx.moveTo(margin.left, yScale(t)); ctx.lineTo(margin.left + innerWidth, yScale(t)); });
                ctx.stroke();

                // Labels
                ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                xScale.ticks(6).forEach(t => ctx.fillText(t.toString(), xScale(t), margin.top + innerHeight + 15));
                ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
                yScale.ticks(6).forEach(t => ctx.fillText(t.toString(), margin.left - 5, yScale(t)));

                // Titles
                ctx.textAlign = 'center';
                ctx.fillText(type === 'GUYTON_RIGHT' ? "RA Pressure (mmHg)" : "LA Pressure (mmHg)", margin.left + innerWidth / 2, height - 5);
                ctx.save();
                ctx.translate(15, margin.top + innerHeight / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText("CO (L/min)", 0, 0);
                ctx.restore();

                instances.forEach(inst => {
                    const cfg = config[inst.id];
                    if (!cfg || !cfg.visible) return;
                    const phys = physicsRefs.current.get(inst.id);
                    if (!phys || phys.buffer.length < 10) return;
                    const p = phys.activeParams;
                    
                    const lastCycle = phys.buffer.slice(-Math.floor(60000/p.HR));
                    const meanPra = d3.mean(lastCycle, d => d.aux.Pra) || 0;
                    const meanPla = d3.mean(lastCycle, d => d.aux.Pla) || 0;
                    const meanP = type === 'GUYTON_RIGHT' ? meanPra : meanPla;
                    
                    const vols = lastCycle.map(d => d.y.Qlv);
                    const sv = (d3.max(vols)||0) - (d3.min(vols)||0);
                    const co = (sv * p.HR) / 1000.0;

                    // 1. Draw Guyton
                    const { W_s, C_s, W_p, C_p } = getGuytonParams(p);
                    const W_t = W_s + W_p;
                    
                    const V_total = inst.targetVolume; 
                    const V_ch_mean = d3.mean(lastCycle, d => d.y.Qlv + d.y.Qla + d.y.Qrv + d.y.Qra) || 500;
                    
                    const drawGuyton = () => {
                        ctx.beginPath();
                        ctx.strokeStyle = inst.color;
                        ctx.setLineDash([5, 5]);
                        ctx.lineWidth = 1.5;

                        const p1 = 0;
                        const p2 = xMax; 

                        const calcCO = (px: number) => {
                            let num = V_total - V_ch_mean;
                            if (type === 'GUYTON_RIGHT') {
                                num -= (C_s * px + C_p * meanPla);
                            } else {
                                num -= (C_s * meanPra + C_p * px);
                            }
                            return (num / W_t) * 60.0; // Conv mL/ms -> L/min
                        };

                        const co1 = calcCO(p1);
                        const co2 = calcCO(p2);

                        ctx.moveTo(xScale(p1), yScale(co1));
                        ctx.lineTo(xScale(p2), yScale(co2));
                        ctx.stroke();
                    };
                    drawGuyton();

                    // 2. Draw Starling
                    const drawStarling = () => {
                        ctx.beginPath();
                        ctx.strokeStyle = inst.color;
                        ctx.setLineDash([]);
                        ctx.lineWidth = 2;
                        
                        let Ees, alpha, beta, V0, Ea;
                        
                        if (type === 'GUYTON_RIGHT') {
                            Ees=p.RV_Ees; alpha=p.RV_alpha; beta=p.RV_beta; V0=p.RV_V0;
                            const R_pulm = p.Rap_prox + p.Rcp + p.Rap + p.Rvp;
                            Ea = R_pulm / (60000/p.HR);
                        } else {
                            Ees=p.LV_Ees; alpha=p.LV_alpha; beta=p.LV_beta; V0=p.LV_V0;
                            const R_sys = p.Ras_prox + p.Rda + p.Ras + p.Rcs + p.Rvs;
                            Ea = R_sys / (60000/p.HR);
                        }

                        let first=true;
                        for(let px=0; px<=xMax; px+= (xMax/40)) {
                            const co_est = getStarlingCO(px, Ees, V0, alpha, beta, Ea, p.HR);
                            const x = xScale(px);
                            const y = yScale(co_est);
                            if (y >= margin.top && y <= margin.top + innerHeight) {
                                if(first) { ctx.moveTo(x,y); first=false; }
                                else ctx.lineTo(x,y);
                            }
                        }
                        ctx.stroke();
                    };
                    drawStarling();

                    // 3. Operating Point
                    ctx.beginPath();
                    ctx.fillStyle = inst.color;
                    ctx.arc(xScale(meanP), yScale(co), 4, 0, 2*Math.PI);
                    ctx.fill();
                    ctx.stroke();

                });

            } else {
                // -----------------------
                // 3D RENDERING
                // -----------------------
                
                // Isometric Projection Helper (Normalized by Max Limits)
                const iso = (x: number, y: number, z: number) => {
                    const sx = x / maxPra;
                    const sy = y / maxPla;
                    const sz = z / maxCO;
                    
                    const angle = Math.PI / 6; // 30 deg
                    const u = (sx - sy) * Math.cos(angle);
                    const v = (sx + sy) * Math.sin(angle) - sz;
                    
                    const scale = Math.min(width, height) * 0.5;
                    const cx = width / 2;
                    const cy = height * 0.75;
                    
                    return { x: cx + u * scale, y: cy + v * scale };
                };

                // Draw Axes
                const origin = iso(0,0,0);
                const xEnd = iso(maxPra,0,0);
                const yEnd = iso(0,maxPla,0);
                const zEnd = iso(0,0,maxCO);

                ctx.strokeStyle = '#64748b'; ctx.lineWidth=1;
                // Pra Axis
                ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(xEnd.x, xEnd.y); ctx.stroke();
                ctx.fillStyle='#94a3b8'; ctx.textAlign='left'; ctx.fillText(`Pra (0-${maxPra.toFixed(0)})`, xEnd.x, xEnd.y);
                // Pla Axis
                ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(yEnd.x, yEnd.y); ctx.stroke();
                ctx.textAlign='right'; ctx.fillText(`Pla (0-${maxPla.toFixed(0)})`, yEnd.x, yEnd.y);
                // CO Axis
                ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(zEnd.x, zEnd.y); ctx.stroke();
                ctx.textAlign='center'; ctx.fillText(`CO (0-${maxCO.toFixed(0)})`, zEnd.x, zEnd.y - 10);

                // Draw Grid (Base)
                const steps = 5;
                ctx.strokeStyle = '#334155'; ctx.lineWidth=0.5;
                
                // Lines along X (Pra) varying Y (Pla)
                for(let i=0; i<=steps; i++) {
                    const val = (i/steps) * maxPra;
                    const p1 = iso(val, 0, 0); 
                    const p2 = iso(val, maxPla, 0);
                    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }
                // Lines along Y (Pla) varying X (Pra)
                for(let i=0; i<=steps; i++) {
                    const val = (i/steps) * maxPla;
                    const p1 = iso(0, val, 0); 
                    const p2 = iso(maxPra, val, 0);
                    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }

                instances.forEach(inst => {
                    const cfg = config[inst.id];
                    if (!cfg || !cfg.visible) return;
                    const phys = physicsRefs.current.get(inst.id);
                    if (!phys || phys.buffer.length < 10) return;
                    const p = phys.activeParams;

                    // Averages
                    const lastCycle = phys.buffer.slice(-Math.floor(60000/p.HR));
                    const meanPra = d3.mean(lastCycle, d => d.aux.Pra) || 0;
                    const meanPla = d3.mean(lastCycle, d => d.aux.Pla) || 0;
                    const vols = lastCycle.map(d => d.y.Qlv);
                    const sv = (d3.max(vols)||0) - (d3.min(vols)||0);
                    const meanCO = (sv * p.HR) / 1000.0;

                    // 1. Draw Starling Line (Cardiac Function Curve in 3D)
                    // Iterate Pra -> Get CO -> Solve Pla needed for that CO
                    
                    const R_sys = p.Ras_prox + p.Rda + p.Ras + p.Rcs + p.Rvs;
                    const Ea_L = R_sys / (60000/p.HR);
                    const k_L = (p.LV_Ees / (p.LV_Ees + Ea_L)) * (1.0 / p.LV_alpha);
                    
                    const R_pulm = p.Rap_prox + p.Rcp + p.Rap + p.Rvp;
                    const Ea_R = R_pulm / (60000/p.HR);

                    ctx.strokeStyle = inst.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    
                    let first = true;
                    // Draw continuous curve
                    for (let pra = 0; pra <= maxPra; pra += (maxPra/40)) {
                        const co_est = getStarlingCO(pra, p.RV_Ees, p.RV_V0, p.RV_alpha, p.RV_beta, Ea_R, p.HR); // L/min
                        if (co_est <= 0.01 || co_est > maxCO) continue;

                        // Inverse LV to find Pla
                        if (k_L <= 0.001) continue;
                        const sv_needed = co_est * 1000.0 / p.HR;
                        // Pla = b * (exp(sv/k_L) - 1)
                        const pla = p.LV_beta * (Math.exp(sv_needed / k_L) - 1);
                        
                        if (pla >= 0 && pla <= maxPla) {
                            const pt = iso(pra, pla, co_est);
                            if (first) { ctx.moveTo(pt.x, pt.y); first = false; }
                            else ctx.lineTo(pt.x, pt.y);
                        }
                    }
                    ctx.stroke();

                    // 2. Draw Operating Point
                    const pt = iso(meanPra, meanPla, meanCO);
                    ctx.beginPath();
                    ctx.fillStyle = inst.color;
                    ctx.arc(pt.x, pt.y, 4, 0, 2*Math.PI);
                    ctx.fill(); ctx.stroke();

                    // 3. Drop lines
                    ctx.strokeStyle = inst.color; ctx.lineWidth=0.5; ctx.setLineDash([2,2]);
                    const base = iso(meanPra, meanPla, 0);
                    ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(base.x, base.y); ctx.stroke(); // Vertical drop
                    
                    const praAxis = iso(meanPra, 0, 0);
                    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(praAxis.x, praAxis.y); ctx.stroke();
                    
                    const plaAxis = iso(0, meanPla, 0);
                    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(plaAxis.x, plaAxis.y); ctx.stroke();

                    ctx.setLineDash([]);
                });
            }

            animationFrameId = requestAnimationFrame(render);
        };
        render();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(containerRef.current);
        return () => { cancelAnimationFrame(animationFrameId); resizeObserver.disconnect(); }
    }, [instances, config, type]);

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};
