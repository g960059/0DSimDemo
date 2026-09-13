import {
  buildMainWireCardiacCycleMetricsV1,
  MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1,
  type MainWireCardiacCycleAcceptedSampleV1,
} from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";
import type { traceStudioExperimentV1 } from "@/studio/application/authoring/StudioAuthoringTraceV1";

export const MAIN_WIRE_CARDIAC_CYCLE_FIGURE_V1_ID = "main-wire-cardiac-cycle-teaching-figure-v1";
export const CARDIAC_CYCLE_FIGURE_OUTPUT_IDS_V1 = [...new Set([
  ...MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1,
  "hemodynamics.volume.LV", "hemodynamics.pressure.absolute.LA", "hemodynamics.pressure.absolute.Ao",
])] as const;
const V = "hemodynamics.volume.LV", P = "hemodynamics.pressure.absolute.LV";
const MV = "hemodynamics.flow.valve.MV", AV = "hemodynamics.flow.valve.AoV";
type Trace = Awaited<ReturnType<typeof traceStudioExperimentV1>>;

/** Presentation consumes a versioned analysis; it never redetects physiological events.
 * Raw vertices are retained. Only event/boundary/time-marker coordinates are interpolated. */
export function prepareMainWireCardiacCycleFigureV1(trace: Trace, scenarioId: string) {
  if (trace.sampleStride !== 1) throw new Error("Figure requires every exact presentation boundary (sampleStride 1)");
  const selected = trace.traces.find(t => t.scenarioId === scenarioId);
  if (!selected) throw new Error("Figure scenario is unavailable");
  if (new Set(trace.outputIds).size !== trace.outputIds.length) throw new Error("Duplicate trace output IDs");
  const figureOutputs: readonly string[] = [...CARDIAC_CYCLE_FIGURE_OUTPUT_IDS_V1, ...(trace.outputIds.includes("hemodynamics.pressure.mean.LA") ? ["hemodynamics.pressure.mean.LA"] : [])];
  const indices = figureOutputs.map(id => {
    const i = trace.outputIds.indexOf(id);
    if (i < 0) throw new Error(`Figure requires ${id}`);
    return i;
  });
  const samples: MainWireCardiacCycleAcceptedSampleV1[] = selected.samples.map(s => {
    const values: Record<string, number> = {};
    indices.forEach(i => {
      const state = s.states[i], value = s.values[i];
      if (state === undefined || state < 0 || state > 2 || value == null || !Number.isFinite(value))
        throw new Error(`Figure requires available finite samples: ${trace.outputIds[i]}`);
      values[trace.outputIds[i]!] = value;
    });
    return { inputEpoch: selected.inputEpoch, acceptedRevision: s.acceptedRevision, acceptedTimeSec: s.acceptedTimeSec, values };
  });
  const latest = buildMainWireCardiacCycleMetricsV1(samples);
  if (latest.status !== "available") throw new Error(`Figure cycle unavailable: ${latest.reason}`);
  // Two analysis-owned cycles supply consecutive closure events. Moving the
  // presentation window does not change the numerical method's phase boundary.
  const wrapIndex = samples.findIndex(s => s.acceptedTimeSec >= latest.source.cycleStartTimeSec);
  const metrics = buildMainWireCardiacCycleMetricsV1(samples.slice(0, wrapIndex + 1));
  if (metrics.status !== "available") throw new Error(`Figure requires two complete cycles: ${metrics.reason}`);
  const start = metrics.flowEvents.mitralClosureBeforeAorticOpeningTimeSec;
  const end = latest.flowEvents.mitralClosureBeforeAorticOpeningTimeSec;
  if (start === null || end === null || end <= start) throw new Error("Consecutive mitral closures unavailable");
  const times = [metrics.flowEvents.mitralClosureBeforeAorticOpeningTimeSec,
    metrics.aorticEjection.openingTimeSec, metrics.aorticEjection.closureTimeSec,
    metrics.flowEvents.mitralOpeningAfterAorticClosureTimeSec];
  if (times.some(t => t === null)) throw new Error("Four valve events are required; missing events are not inferred");
  const eventTimes = times as number[];
  if (!(start <= eventTimes[0]! && eventTimes[0]! < eventTimes[1]! && eventTimes[1]! < eventTimes[2]!
    && eventTimes[2]! < eventTimes[3]! && eventTimes[3]! <= end)) throw new Error("Four-phase event ordering unavailable");
  const at = (timeSec: number) => interpolateFigureSampleV1(samples, timeSec);
  const events = eventTimes.map((t, i) => ({ number: i + 1, timeSec: t, values: at(t) }));
  const points = [{ timeSec: start, values: at(start) }, ...samples.filter(s => s.acceptedTimeSec > start && s.acceptedTimeSec < end)
    .map(s => ({ timeSec: s.acceptedTimeSec, values: s.values as Record<string, number> })), { timeSec: end, values: at(end) }];
  return { figureId: MAIN_WIRE_CARDIAC_CYCLE_FIGURE_V1_ID, source: trace.source, scenarioId,
    pressureReference: "absolute-LV-intracavitary-mmHg" as const, metrics, points, events,
    displayWindow: { startTimeSec: start, endTimeSec: end, timeOrigin: "mitral-closure" as const },
    measurement: { edvMl: events[0]!.values[V]!, esvMl: events[2]!.values[V]!,
      svMl: events[0]!.values[V]! - events[2]!.values[V]!, pesMmHg: events[2]!.values[P]!, pedMmHg: events[0]!.values[P]! },
    rendering: { curve: "raw-accepted-vertices-with-interpolated-cycle-endpoints", smoothing: false,
      coordinateInterpolation: "linear-at-method-events-and-cycle-boundaries" },
  };
}

export function interpolateFigureSampleV1(samples: readonly MainWireCardiacCycleAcceptedSampleV1[], time: number): Record<string, number> {
  const right = samples.findIndex(s => s.acceptedTimeSec >= time);
  if (right < 0 || (right === 0 && samples[0]!.acceptedTimeSec !== time)) throw new Error("Figure coordinate outside measured trace");
  const b = samples[right]!, a = samples[Math.max(0, right - 1)]!;
  const fraction = b.acceptedTimeSec === a.acceptedTimeSec ? 0 : (time - a.acceptedTimeSec) / (b.acceptedTimeSec - a.acceptedTimeSec);
  return Object.fromEntries(Object.keys(b.values).map(id => {
    const av = a.values[id], bv = b.values[id];
    if (av == null || bv == null || !Number.isFinite(av) || !Number.isFinite(bv)) throw new Error("Missing figure coordinate");
    return [id, av + (bv - av) * fraction];
  }));
}

type Figure = ReturnType<typeof prepareMainWireCardiacCycleFigureV1>;
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const n = (v: number) => v.toFixed(2);
const colors = ["#9a6818", "#b9334a", "#485db7", "#16816f"];
const label = {
  ja: { valve: ["僧帽弁 閉鎖", "大動脈弁 開放", "大動脈弁 閉鎖", "僧帽弁 開放"],
    phase: ["等容収縮", "駆出", "等容弛緩", "充満"], volume: "左室容積 (mL)", pressure: "左室内圧 (mmHg)",
    pv: "PV loopの弁イベント・心周期・圧と容積",
    wave: "同じ弁イベントを、圧と流量で読む", time: "僧帽弁閉鎖からの時間 (ms)",
    pressureWave: "内腔圧 (mmHg)", flow: "弁流量 (mL/s)", lv: "左室", ao: "大動脈", la: "左房", mv: "僧帽弁", av: "大動脈弁" },
  en: { valve: ["Mitral closure", "Aortic opening", "Aortic closure", "Mitral opening"],
    phase: ["Isovolumic contraction", "Ejection", "Isovolumic relaxation", "Filling"], volume: "LV volume (mL)", pressure: "LV pressure (mmHg)",
    pv: "PV loop: valve events, phases, pressure and volume",
    wave: "The same valve events in pressure and flow", time: "Time from mitral closure (ms)",
    pressureWave: "Intracavitary pressure (mmHg)", flow: "Valve flow (mL/s)", lv: "LV", ao: "Aorta", la: "LA", mv: "Mitral", av: "Aortic" },
};
function svgDocument(height: number, title: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" viewBox="0 0 720 ${height}" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#46536a"/></marker></defs><style>text{font-family:"Hiragino Sans","Noto Sans CJK JP",sans-serif;fill:#263347;font-size:21px} .small{font-size:18px;fill:#526177} .axis{stroke:#748297;stroke-width:1.3} .grid{stroke:#e8ecf1;stroke-width:1} .guide{stroke:#8894a8;stroke-dasharray:5 5;fill:none} .curve{fill:none;stroke-linejoin:round;stroke-linecap:round;stroke-width:3.5}</style><rect width="720" height="${height}" rx="16" fill="#fbfcfe"/>${body}</svg>`;
}
const text = (x: number, y: number, s: string, extra = "") => `<text x="${n(x)}" y="${n(y)}" ${extra}>${escape(s)}</text>`;
const line = (x1: number,y1: number,x2: number,y2: number, extra = 'class="axis"') => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${extra}/>`;
const badge = (x: number,y: number,index: number,neutral = false) => `<circle cx="${n(x)}" cy="${n(y)}" r="15" fill="#fff" stroke="${neutral ? "#526177" : colors[index]}" stroke-width="2.5"/>${text(x,y+7,String(index+1),'text-anchor="middle" style="font-size:20px;font-weight:700"')}`;
function legend(y: number, l: typeof label.ja | typeof label.en, neutral = false) {
  return l.valve.map((s,i) => {const x=i%2===0?48:380, top=y+Math.floor(i/2)*46;
    return badge(x,top,i,neutral)+text(x+25,top+7,s);}).join("");
}

export function renderMainWireCardiacCyclePvSvgV1(f: Figure, locale: "ja"|"en" = "ja") {
  const l = label[locale], e = f.events, m = f.measurement;
  // A definition view: preserve the measured trajectory and a zero origin, but
  // label physiological coordinates instead of displaying case-specific values.
  const xmax = Math.ceil((Math.max(...f.points.map(p => p.values[V]!)) + 35) / 20) * 20;
  const ymax = Math.ceil((Math.max(...f.points.map(p => p.values[P]!)) + 15) / 20) * 20;
  const x = (v: number) => 108 + v / xmax * 500, y = (p: number) => 472 - p / ymax * 374;
  const phase = (t: number) => t < e[0]!.timeSec ? 3 : t < e[1]!.timeSec ? 0 : t < e[2]!.timeSec ? 1 : t < e[3]!.timeSec ? 2 : 3;
  const xs = x(m.esvMl), xd = x(m.edvMl), middle = (xs + xd) / 2;
  const pressureLabel = (p: number, subscript: string) => line(108,y(p),subscript === "es" ? xs : xd,y(p),'class="guide"')
    + `<text x="92" y="${n(y(p)+7)}" text-anchor="end">P<tspan baseline-shift="sub" font-size="14">${subscript}</tspan></text>`;
  let b = text(46,62,locale === "ja" ? "左室圧" : "LV pressure")
    + line(108,82,108,472) + line(108,472,655,472)
    + text(95,501,"0",'text-anchor="end" class="small"')
    + pressureLabel(m.pesMmHg,"es") + pressureLabel(m.pedMmHg,"ed");
  for (let i=1; i<f.points.length; i++) {
    const a=f.points[i-1]!, c=f.points[i]!;
    b+=line(x(a.values[V]!),y(a.values[P]!),x(c.values[V]!),y(c.values[P]!),
      `stroke="${colors[phase((a.timeSec+c.timeSec)/2)]}" stroke-width="3.5" stroke-linecap="round"`);
  }
  // Small direction arrows use measured coordinates; the orbit is never smoothed.
  const samples = f.points.map(p => ({acceptedTimeSec:p.timeSec,acceptedRevision:0,inputEpoch:0,values:p.values}));
  for (const [i,event] of e.entries()) {
    const end=e[i+1]?.timeSec ?? f.displayWindow.endTimeSec;
    const av=interpolateFigureSampleV1(samples,event.timeSec+(end-event.timeSec)*.25);
    const cv=interpolateFigureSampleV1(samples,event.timeSec+(end-event.timeSec)*.45);
    b+=line(x(av[V]!),y(av[P]!),x(cv[V]!),y(cv[P]!), 'stroke="#46536a" stroke-width="2" marker-end="url(#arrow)"');
  }
  b+=text(middle,126,l.phase[1]!,'text-anchor="middle"');
  b+=text(middle,417,l.phase[3]!,'text-anchor="middle"');
  const verticalPhase=(px:number,cy:number,name:string) => locale === "ja"
    ? text(px,cy-42,name,'style="writing-mode:vertical-rl;font-size:20px"')
    : text(px,cy,name,`text-anchor="middle" transform="rotate(-90 ${n(px)} ${n(cy)})" style="font-size:14px"`);
  b+=verticalPhase(xd-29,locale === "ja" ? 365 : 350,l.phase[0]!)+verticalPhase(xs+29,305,l.phase[2]!);
  const eventLabel=(i:number,px:number,py:number) => {
    const parts = l.valve[i]!.split(" ");
    return parts.map((part,j)=>text(px,py+j*27,part,'text-anchor="middle" style="font-size:19px"')).join("");
  };
  b+=eventLabel(2,xs-57,124)+line(xs-34,158,xs-12,y(m.pesMmHg)-12);
  b+=eventLabel(1,xd+78,y(e[1]!.values[P]!)-20)+line(xd+17,y(e[1]!.values[P]!),xd+37,y(e[1]!.values[P]!));
  b+=eventLabel(3,xs-59,375)+line(xs-36,410,xs-12,y(e[3]!.values[P]!)-12);
  b+=eventLabel(0,xd+78,396)+line(xd+36,430,xd+12,y(m.pedMmHg)-8);
  b+=e.map((p,i)=>badge(x(p.values[V]!),y(p.values[P]!),i)).join("");
  // ESV and EDV belong on the volume axis; SV is the interval between them.
  for (const [v,name] of [[m.esvMl,"ESV"],[m.edvMl,"EDV"]] as const)
    b+=line(x(v),y(v === m.esvMl ? e[3]!.values[P]! : m.pedMmHg)+16,x(v),488,'class="guide"')
      +text(x(v),515,name,'text-anchor="middle" style="font-weight:600"');
  b+=text(648,locale === "ja" ? 515 : 504,locale === "ja" ? "左室容積" : "LV volume",'text-anchor="end" style="font-size:19px"');
  b+=line(xs,542,xd,542,'stroke="#46536a" stroke-width="1.7" marker-start="url(#arrow)" marker-end="url(#arrow)"')
    +text(middle,579,"SV = EDV − ESV",'text-anchor="middle"');
  return svgDocument(606,l.pv,b);
}

export function renderMainWireCardiacCycleWaveSvgV1(f: Figure, locale: "ja"|"en" = "ja") {
  const l=label[locale], start=f.displayWindow.startTimeSec, duration=f.displayWindow.endTimeSec-start;
  const x=(t:number)=>95+(t-start)/duration*550;
  let b="";
  const panels=[{top:75,bottom:270,ids:[P,"hemodynamics.pressure.absolute.Ao","hemodynamics.pressure.absolute.LA"],names:[l.lv,l.ao,l.la],colors:["#b9334a","#4869b1","#16816f"],title:l.pressureWave,step:40},
    {top:370,bottom:565,ids:[AV,MV],names:[l.av,l.mv],colors:["#b9334a","#16816f"],title:l.flow,step:200}];
  for(const p of panels) {
    const max=Math.ceil(Math.max(...f.points.flatMap(v=>p.ids.map(id=>v.values[id]!)))/p.step)*p.step;
    const min=Math.min(0,Math.floor(Math.min(...f.points.flatMap(v=>p.ids.map(id=>v.values[id]!)))/p.step)*p.step);
    const y=(v:number)=>p.bottom-(v-min)/(max-min)*(p.bottom-p.top);
    b+=text(32,p.top-35,p.title);
    for(let v=min;v<=max;v+=p.step) b+=line(95,y(v),645,y(v),'class="grid"')+text(70,y(v)+6,String(v),'text-anchor="end" class="small"');
    b+=line(95,p.top,95,p.bottom)+line(95,p.bottom,645,p.bottom);
    for(const [i,id] of p.ids.entries()) {
      const pts=f.points.map(v=>`${n(x(v.timeSec))},${n(y(v.values[id]!))}`).join(" ");
      b+=`<polyline points="${pts}" class="curve" stroke="${p.colors[i]}"/>`;
      b+=line(355+i*(p.ids.length===2?140:105),p.top-41,380+i*(p.ids.length===2?140:105),p.top-41,`stroke="${p.colors[i]}" stroke-width="3"`)+text(386+i*(p.ids.length===2?140:105),p.top-35,p.names[i]!,'class="small"');
    }
    for(const [i,e] of f.events.entries()) b+=line(x(e.timeSec),p.top,x(e.timeSec),p.bottom,'class="guide"')+(p===panels[0] ? badge(x(e.timeSec),p.top-8,i,true) : "");
    for(let ms=0;ms<=duration*1000;ms+=200) b+=text(x(start+ms/1000),p.bottom+27,String(ms),'text-anchor="middle" class="small"');
  }
  b+=text(365,623,l.time,'text-anchor="middle"')+legend(674,l,true);
  return svgDocument(750,l.wave,b);
}

/** The arterial line is the definition Pes/SV, not a regression or an ESPVR. */
export function renderMainWireCardiacCycleEaSvgV1(f: Figure, locale: "ja"|"en" = "ja") {
  const m=f.measurement, x=(v:number)=>95+v/180*510, y=(p:number)=>405-p/140*325;
  const xs=x(m.esvMl), xd=x(m.edvMl), yp=y(m.pesMmHg);
  let b=line(95,65,95,405)+line(95,405,650,405)
    +text(35,45,locale==="ja"?"左室圧":"LV pressure")
    +text(650,447,locale==="ja"?"左室容積":"LV volume",'text-anchor="end" style="font-size:19px"')
    +text(82,436,"0",'text-anchor="end" class="small"');
  b+=`<path d="M ${xs} 405 L ${xs} ${yp} L ${xd} 405 Z" fill="#dbe8f3"/>`;
  b+=`<polyline points="${f.points.map(p=>`${n(x(p.values[V]!))},${n(y(p.values[P]!))}`).join(" ")}" fill="none" stroke="#9ca8b8" stroke-width="2.5"/>`;
  b+=line(95,yp,xs,yp,'class="guide"')+`<text x="82" y="${yp+7}" text-anchor="end">P<tspan baseline-shift="sub" font-size="14">es</tspan></text>`
    +line(xs,405,xs,yp,'stroke="#467ba8" stroke-width="2"')
    +line(xs,yp,xd,405,'stroke="#284b72" stroke-width="3"')
    +`<circle cx="${xs}" cy="${yp}" r="5" fill="#284b72"/>`;
  b+=text(xs-18,yp-22,locale==="ja"?"収縮末期点":"End-systolic point",'text-anchor="end" style="font-size:18px"');
  b+=`<text x="${xd+12}" y="285" style="font-size:23px;font-weight:600">Ea = P<tspan baseline-shift="sub" font-size="15">es</tspan> / SV</text>`
    +line(xd+8,300,(xs+xd)/2+14,(yp+405)/2,'class="axis"');
  b+=text(xs,445,"ESV",'text-anchor="middle"')+text(xd,445,"EDV",'text-anchor="middle"');
  b+=line(xs,480,xd,480,'stroke="#46536a" stroke-width="1.7" marker-start="url(#arrow)" marker-end="url(#arrow)"')
    +text((xs+xd)/2,518,"SV",'text-anchor="middle"');
  return svgDocument(552,locale==="ja"?"収縮末期圧と一回拍出量から読むEa":"Ea from end-systolic pressure and stroke volume",b);
}

/** Reuse the same measured beat, expanding pressure during diastole. The mean
 * is an exact exposed beat summary; presentation does not recompute it. */
export function renderMainWireCardiacCycleFillingSvgV1(f: Figure, locale: "ja"|"en" = "ja") {
  const l=label[locale], start=f.events[2]!.timeSec, end=f.displayWindow.endTimeSec;
  const la="hemodynamics.pressure.absolute.LA", mean="hemodynamics.pressure.mean.LA";
  const meanLa=f.points.at(-1)!.values[mean];
  if(meanLa===undefined || !Number.isFinite(meanLa)) throw new Error("Filling figure requires exact mean LA pressure");
  const points=f.points.filter(p=>p.timeSec>=start), x=(t:number)=>95+(t-start)/(end-start)*550;
  const yp=(v:number)=>345-v/20*195, yq=(v:number)=>615-v/500*190;
  let b='<defs><clipPath id="pressure-zoom"><rect x="94" y="150" width="552" height="196"/></clipPath></defs>';
  b+=text(32,119,l.pressureWave);
  b+=line(385,111,410,111,'stroke="#b9334a" stroke-width="3"')+text(420,118,l.lv,'class="small"')
    +line(515,111,540,111,'stroke="#16816f" stroke-width="3"')+text(550,118,l.la,'class="small"');
  for(const [idx,event] of [[2,f.events[2]!],[3,f.events[3]!],[0,{timeSec:end}]] as const){
    const px=x(event.timeSec), words=l.valve[idx]!.split(" ");
    b+=words.map((word,j)=>text(px,39+j*26,word,'text-anchor="middle" style="font-size:17px"')).join("");
    b+=line(px,150,px,345,'class="guide"')+line(px,425,px,615,'class="guide"');
  }
  for(let v=0;v<=20;v+=5)b+=line(95,yp(v),645,yp(v),'class="grid"')+text(77,yp(v)+6,String(v),'text-anchor="end" class="small"');
  b+=line(95,150,95,345)+line(95,345,645,345);
  b+=line(95,yp(meanLa),645,yp(meanLa),'stroke="#16816f" stroke-width="1.3" stroke-dasharray="5 5"');
  for(const [id,color] of [[P,"#b9334a"],[la,"#16816f"]])b+=`<polyline clip-path="url(#pressure-zoom)" points="${points.map(p=>`${n(x(p.timeSec))},${n(yp(p.values[id!]!))}`).join(" ")}" class="curve" stroke="${color}"/>`;
  const ped=points.at(-1)!.values[P]!;
  b+=`<circle cx="645" cy="${yp(ped)}" r="5" fill="#b9334a"/>`
    +text(630,190,"LVEDP",'text-anchor="end" style="font-size:19px"')
    +line(620,197,643,yp(ped)-8,'class="axis"')
    +text(352,yp(meanLa)-13,locale==="ja"?"平均左房圧":"Mean LA pressure",'style="font-size:18px;fill:#16816f"');
  b+=text(32,397,locale==="ja"?"僧帽弁流量 (mL/s)":"Mitral flow (mL/s)");
  for(let v=0;v<=500;v+=250)b+=line(95,yq(v),645,yq(v),'class="grid"')+text(77,yq(v)+6,String(v),'text-anchor="end" class="small"');
  b+=line(95,425,95,615)+line(95,615,645,615)
    +`<polyline points="${points.map(p=>`${n(x(p.timeSec))},${n(yq(p.values[MV]!))}`).join(" ")}" class="curve" stroke="#16816f"/>`;
  b+=text(260,442,locale==="ja"?"早期充満":"Early filling",'text-anchor="middle" style="font-size:17px"')
    +text(550,432,locale==="ja"?"心房収縮":"Atrial contraction",'text-anchor="middle" style="font-size:17px"');
  for(let ms=0;ms<(end-start)*1000;ms+=100)b+=text(x(start+ms/1000),648,String(ms),'text-anchor="middle" class="small"');
  b+=text(370,691,locale==="ja"?"大動脈弁閉鎖からの時間 (ms)":"Time from aortic closure (ms)",'text-anchor="middle"');
  return svgDocument(722,locale==="ja"?"拡張期の流入と、LVEDP・平均左房圧":"Diastolic filling, LVEDP and mean LA pressure",b);
}
