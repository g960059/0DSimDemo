import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  validatePhaseB1MainWireDistributedArtifactBundleV1,
  type PhaseB1MainWireDistributedReportV1,
  type PhaseB1MainWireDistributedWaveformV1,
} from "@/tools/myocardium/runPhaseB1MainWireDistributedV1";

const PA_PER_MMHG = 133.322387415;
const DEFAULT_FRAGMENT_PATH =
  "data/myocardium/visuals/phase-b1-main-wire-distributed-exploratory-v1.fragment.html";

if (
  process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) main();

export function buildPhaseB1MainWireDistributedReviewFragmentV1(
  waveformUnknown: unknown,
  reportUnknown: unknown,
): string {
  const report = reportUnknown as PhaseB1MainWireDistributedReportV1;
  const waveform = waveformUnknown as PhaseB1MainWireDistributedWaveformV1;
  validatePhaseB1MainWireDistributedArtifactBundleV1(report, waveform, sha256);
  const embedded = escapeJsonForScript({
    waveformId: waveform.waveformId,
    cycleIndex: waveform.cycleIndex,
    nominalDtMs: waveform.nominalDtSec * 1000,
    slsMode: waveform.slsMode,
    samples: waveform.samples.map((sample) => ({
      t: round(sample.phaseSec, 7),
      v: mapRecord(sample.bloodVolumesM3, (value) => value * 1e6),
      p: mapRecord(sample.absolutePressurePaByNode, (value) => value / PA_PER_MMHG),
      q: mapRecord(sample.allFlowsM3PerSec, (value) => value * 1e6),
    })),
    atrial: buildAtrialSummary(report),
    terminal: report.terminal,
  });
  return `<div id="mw-four-chamber-v1" data-fragment-contract="single-root-inline-self-contained-v1" aria-label="Main-wire distributed four-chamber waveform review">
  <style>
    #mw-four-chamber-v1{--mw-grid:color-mix(in srgb,var(--border) 58%,transparent);--mw-muted:var(--muted-foreground);--mw-fg:var(--foreground);--mw-bg:var(--background);--mw-c1:var(--viz-series-1);--mw-c2:var(--viz-series-2);--mw-c3:var(--viz-series-3);--mw-c4:var(--viz-series-4);color:var(--mw-fg);background:transparent;width:100%}
    #mw-four-chamber-v1 *{box-sizing:border-box}
    #mw-four-chamber-v1 .mw-status{display:flex;flex-wrap:wrap;gap:.25rem .8rem;margin:0 0 .55rem;color:var(--mw-muted)}
    #mw-four-chamber-v1 .mw-status strong{color:var(--mw-fg);font-weight:500}
    #mw-four-chamber-v1 .mw-atrial{margin:.2rem 0 .8rem}
    #mw-four-chamber-v1 .mw-atrial section{min-width:0}
    #mw-four-chamber-v1 .mw-atrial h3,#mw-four-chamber-v1 .mw-chart h3{font-weight:500;margin:0 0 .18rem;color:var(--mw-fg)}
    #mw-four-chamber-v1 .mw-atrial p,#mw-four-chamber-v1 .mw-chart p{margin:.12rem 0;color:var(--mw-muted)}
    #mw-four-chamber-v1 .mw-controls{margin:.4rem 0 .9rem}
    #mw-four-chamber-v1 .mw-controls output{font-variant-numeric:tabular-nums;color:var(--mw-fg)}
    #mw-four-chamber-v1 .mw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.95rem 1.2rem}
    #mw-four-chamber-v1 .mw-chart{min-width:0}
    #mw-four-chamber-v1 .mw-chart svg{display:block;width:100%;height:auto;overflow:visible}
    #mw-four-chamber-v1 .mw-axis,#mw-four-chamber-v1 .mw-gridline{stroke:var(--mw-grid);stroke-width:1;vector-effect:non-scaling-stroke}
    #mw-four-chamber-v1 .mw-gridline{opacity:.55}
    #mw-four-chamber-v1 .mw-zero{stroke:var(--mw-fg);stroke-width:1;stroke-dasharray:4 3;opacity:.55;vector-effect:non-scaling-stroke}
    #mw-four-chamber-v1 .mw-tick,#mw-four-chamber-v1 .mw-label{fill:var(--mw-muted)}
    #mw-four-chamber-v1 .mw-series{fill:none;stroke-width:2;vector-effect:non-scaling-stroke}
    #mw-four-chamber-v1 .mw-s0{stroke:var(--mw-c1)}#mw-four-chamber-v1 .mw-s1{stroke:var(--mw-c2)}#mw-four-chamber-v1 .mw-s2{stroke:var(--mw-c3)}#mw-four-chamber-v1 .mw-s3{stroke:var(--mw-c4)}
    #mw-four-chamber-v1 .mw-marker{fill:var(--mw-bg);stroke-width:2.5;vector-effect:non-scaling-stroke}
    #mw-four-chamber-v1 .mw-cursor{stroke:var(--mw-fg);stroke-width:1;opacity:.4;vector-effect:non-scaling-stroke}
    #mw-four-chamber-v1 .mw-legend{display:flex;gap:.6rem;flex-wrap:wrap;color:var(--mw-muted);min-height:1rem}
    #mw-four-chamber-v1 .mw-key::before{content:"";display:inline-block;width:.65rem;height:2px;margin:0 .28rem .2rem 0;background:var(--key)}
    @media(max-width:700px){#mw-four-chamber-v1 .mw-grid{grid-template-columns:1fr}}
  </style>
  <div class="mw-status viz-row text-small" aria-live="polite"><strong id="mw-run"></strong><span>exploratory · nonperiodic · no fitting · no projection/model fallback</span><span id="mw-detail"></span></div>
  <div class="mw-atrial viz-grid" id="mw-atrial"></div>
  <div class="mw-controls viz-controls">
    <label class="form-label" for="mw-phase">Phase <output id="mw-phase-value" for="mw-phase">0 ms</output></label>
    <input class="form-range" id="mw-phase" type="range" min="0" max="0" step="1" value="0" aria-label="Terminal cycle phase sample">
  </div>
  <div class="mw-grid" id="mw-grid"></div>
  <script>
  (()=>{
    const root=document.getElementById('mw-four-chamber-v1');if(!root)return;
    const data=${embedded};
    const atrial=root.querySelector('#mw-atrial');
    data.atrial.forEach((a)=>{const section=document.createElement('section');const h=document.createElement('h3');h.textContent=a.atrium+' conduit / later refill';section.appendChild(h);[a.text,a.massBalance,a.area].forEach(value=>{const p=document.createElement('p');p.className='text-small';p.textContent=value;section.appendChild(p)});atrial.appendChild(section)});
    const specs=[
      {title:'Left atrium PV trajectory',kind:'pv',x:['v','LA'],ys:[['p','LA']],xLabel:'Volume (mL)',yLabel:'Pressure (mmHg)',labels:['LA']},
      {title:'Left ventricle PV trajectory',kind:'pv',x:['v','LV'],ys:[['p','LV']],xLabel:'Volume (mL)',yLabel:'Pressure (mmHg)',labels:['LV']},
      {title:'Right atrium PV trajectory',kind:'pv',x:['v','RA'],ys:[['p','RA']],xLabel:'Volume (mL)',yLabel:'Pressure (mmHg)',labels:['RA']},
      {title:'Right ventricle PV trajectory',kind:'pv',x:['v','RV'],ys:[['p','RV']],xLabel:'Volume (mL)',yLabel:'Pressure (mmHg)',labels:['RV']},
      {title:'Left atrial and distributed pulmonary venous pressures',kind:'time',ys:[['p','LA'],['p','PVein'],['p','PVen'],['p','PCap']],xLabel:'Phase (s)',yLabel:'Pressure (mmHg)',labels:['LA','PVein','PVen','PCap']},
      {title:'Left ventricular and arterial pressures',kind:'time',ys:[['p','LV'],['p','Ao'],['p','SA'],['p','Art']],xLabel:'Phase (s)',yLabel:'Pressure (mmHg)',labels:['LV','Ao','SA','Art']},
      {title:'Right atrial and distributed systemic venous pressures',kind:'time',ys:[['p','RA'],['p','VC'],['p','SV'],['p','Cap']],xLabel:'Phase (s)',yLabel:'Pressure (mmHg)',labels:['RA','VC','SV','Cap']},
      {title:'Right ventricular and pulmonary arterial pressures',kind:'time',ys:[['p','RV'],['p','PA'],['p','PArt']],xLabel:'Phase (s)',yLabel:'Pressure (mmHg)',labels:['RV','PA','PArt']},
      {title:'Left valve flows',kind:'time',zero:true,ys:[['q','Q_MV'],['q','Q_AoV']],xLabel:'Phase (s)',yLabel:'Flow (mL/s)',labels:['Mitral','Aortic']},
      {title:'Right valve flows',kind:'time',zero:true,ys:[['q','Q_TV'],['q','Q_PuV']],xLabel:'Phase (s)',yLabel:'Flow (mL/s)',labels:['Tricuspid','Pulmonary']},
      {title:'Distributed venous return',kind:'time',zero:true,ys:[['q','PVein_LA'],['q','VC_RA']],xLabel:'Phase (s)',yLabel:'Flow (mL/s)',labels:['PVein→LA','VC→RA']}
    ];
    const NS='http://www.w3.org/2000/svg',W=520,H=300,M={l:58,r:16,t:12,b:42};const grid=root.querySelector('#mw-grid'),charts=[];
    const get=(s,key)=>s[key[0]][key[1]];const extent=(values)=>{let lo=Math.min(...values),hi=Math.max(...values);if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.07;return[lo-pad,hi+pad]};
    const scale=(d0,d1,r0,r1)=>(x)=>r0+(x-d0)*(r1-r0)/(d1-d0);const path=(points)=>points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');
    const el=(name,attrs={})=>{const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node};
    const text=(svg,x,y,value,klass,anchor='middle')=>{const node=el('text',{x,y,class:klass,'text-anchor':anchor});node.textContent=value;svg.appendChild(node);return node};
    const ticks=(lo,hi,count=4)=>Array.from({length:count+1},(_,index)=>lo+(hi-lo)*index/count);
    specs.forEach((spec)=>{const section=document.createElement('section');section.className='mw-chart';const heading=document.createElement('h3');heading.textContent=spec.title;section.appendChild(heading);const caption=document.createElement('p');caption.textContent=spec.kind==='pv'?'terminal configured cycle':'shared phase cursor';section.appendChild(caption);const svg=el('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':spec.title});const title=el('title');title.textContent=spec.title;svg.appendChild(title);const xs=spec.kind==='time'?data.samples.map(s=>s.t):data.samples.map(s=>get(s,spec.x));const ys=spec.ys.flatMap(key=>data.samples.map(s=>get(s,key)));if(spec.zero)ys.push(0);const [x0,x1]=extent(xs),[y0,y1]=extent(ys),sx=scale(x0,x1,M.l,W-M.r),sy=scale(y0,y1,H-M.b,M.t);ticks(x0,x1).forEach(value=>{const x=sx(value);svg.appendChild(el('line',{x1:x,y1:M.t,x2:x,y2:H-M.b,class:'mw-gridline'}));text(svg,x,H-M.b+17,Math.abs(value)>=100?value.toFixed(0):value.toFixed(2),'mw-tick')});ticks(y0,y1).forEach(value=>{const y=sy(value);svg.appendChild(el('line',{x1:M.l,y1:y,x2:W-M.r,y2:y,class:'mw-gridline'}));text(svg,M.l-7,y+3,Math.abs(value)>=100?value.toFixed(0):value.toFixed(1),'mw-tick','end')});svg.appendChild(el('line',{x1:M.l,y1:H-M.b,x2:W-M.r,y2:H-M.b,class:'mw-axis'}));svg.appendChild(el('line',{x1:M.l,y1:M.t,x2:M.l,y2:H-M.b,class:'mw-axis'}));if(spec.zero)svg.appendChild(el('line',{x1:M.l,y1:sy(0),x2:W-M.r,y2:sy(0),class:'mw-zero'}));text(svg,(M.l+W-M.r)/2,H-7,spec.xLabel,'mw-label');const ylabel=text(svg,14,(M.t+H-M.b)/2,spec.yLabel,'mw-label');ylabel.setAttribute('transform','rotate(-90 14 '+((M.t+H-M.b)/2)+')');const markers=[];spec.ys.forEach((key,index)=>{const points=data.samples.map((sample,sampleIndex)=>[sx(xs[sampleIndex]),sy(get(sample,key))]);svg.appendChild(el('path',{d:path(points),class:'mw-series mw-s'+index}));const marker=el('circle',{r:4,class:'mw-marker mw-s'+index});svg.appendChild(marker);markers.push(marker)});const cursor=el('line',{y1:M.t,y2:H-M.b,class:'mw-cursor'});if(spec.kind==='time')svg.appendChild(cursor);section.appendChild(svg);const legend=document.createElement('div');legend.className='mw-legend';spec.labels.forEach((label,index)=>{const key=document.createElement('span');key.className='mw-key';key.style.setProperty('--key','var(--mw-c'+(index+1)+')');key.textContent=label;legend.appendChild(key)});section.appendChild(legend);grid.appendChild(section);charts.push({spec,sx,sy,xs,markers,cursor})});
    const slider=root.querySelector('#mw-phase'),phaseValue=root.querySelector('#mw-phase-value'),detail=root.querySelector('#mw-detail');slider.max=String(data.samples.length-1);
    const update=(index)=>{const sample=data.samples[index];phaseValue.textContent=(sample.t*1000).toFixed(0)+' ms';detail.textContent='LA '+sample.v.LA.toFixed(1)+' mL / '+sample.p.LA.toFixed(1)+' mmHg · PVein→LA '+sample.q.PVein_LA.toFixed(1)+' mL/s';charts.forEach(chart=>{chart.spec.ys.forEach((key,j)=>{chart.markers[j].setAttribute('cx',String(chart.sx(chart.xs[index])));chart.markers[j].setAttribute('cy',String(chart.sy(get(sample,key))))});if(chart.spec.kind==='time'){const x=chart.sx(sample.t);chart.cursor.setAttribute('x1',String(x));chart.cursor.setAttribute('x2',String(x))}})};
    slider.addEventListener('input',()=>update(Number(slider.value)));update(0);const dt=data.terminal.acceptedTimeStepSec;root.querySelector('#mw-run').textContent='cycle '+(data.cycleIndex+1)+' · nominal Δt '+data.nominalDtMs.toFixed(2)+' ms · accepted '+(dt.minimum*1000).toFixed(2)+'–'+(dt.maximum*1000).toFixed(2)+' ms · subdivisions '+data.terminal.solverRetrySubdivisionCount+' · SLS '+data.slsMode;
  })();
  </script>
</div>`;
}

export function buildPhaseB1MainWireDistributedStandaloneHtmlV1(
  waveformUnknown: unknown,
  reportUnknown: unknown,
): string {
  const fragment = buildPhaseB1MainWireDistributedReviewFragmentV1(
    waveformUnknown,
    reportUnknown,
  );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Main-wire distributed four-chamber review</title>
<style>
:root{color-scheme:light;--background:#ffffff;--foreground:#18202b;--muted-foreground:#566273;--border:#bcc5d0;--viz-series-1:#1565c0;--viz-series-2:#d96818;--viz-series-3:#16855b;--viz-series-4:#7a4db4}
@media(prefers-color-scheme:dark){:root{color-scheme:dark;--background:#0d131d;--foreground:#eef2f7;--muted-foreground:#9aa7b8;--border:#536174;--viz-series-1:#63b3ff;--viz-series-2:#ff9f5a;--viz-series-3:#72d69c;--viz-series-4:#c59cff}}
body{margin:0;padding:20px;background:var(--background);color:var(--foreground)}
</style>
</head>
<body>
${fragment}
</body>
</html>
`;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const waveform = JSON.parse(readFileSync(options.waveformPath, "utf8")) as unknown;
  const report = JSON.parse(readFileSync(options.reportPath, "utf8")) as unknown;
  const standalone = buildPhaseB1MainWireDistributedStandaloneHtmlV1(
    waveform,
    report,
  );
  const fragment = buildPhaseB1MainWireDistributedReviewFragmentV1(
    waveform,
    report,
  );
  writeUtf8(options.outputPath, standalone);
  writeUtf8(options.fragmentOutputPath, fragment);
  process.stdout.write(`${options.outputPath}\n${options.fragmentOutputPath}\n`);
}

function buildAtrialSummary(
  report: PhaseB1MainWireDistributedReportV1,
): readonly Readonly<{
  atrium: "LA" | "RA";
  text: string;
  massBalance: string;
  area: string;
}>[] {
  return (["LA", "RA"] as const).map((atrium) => {
    const raw = report.atrialConduitAndLaterRefill[atrium] as Readonly<{
      status: string;
      sourceReasons?: readonly string[];
      earlyConduitMinimum: Readonly<{ phaseSec: number; volumeM3: number }> | null;
      maximumLaterRefill: Readonly<{ phaseSec: number; volumeM3: number }> | null;
      laterRefillIncreaseM3: number | null;
    }>;
    const rawMassBalance = report
      .terminalAtrialPostOpeningMassBalanceDiagnostic[atrium] as Readonly<{
        status: string;
        sourceReasons?: readonly string[];
        intervalStartPhaseSec?: number;
        intervalEndPhaseSec?: number;
        trapezoidalVenousInflowVolumeM3?: number;
        trapezoidalAvOutflowVolumeM3?: number;
        observedAtrialVolumeChangeM3?: number;
        trapezoidalDiscreteMassBalanceClosureErrorM3?: number;
      }>;
    const diagnostic = report.chamberPvClosedPolygonDiagnosticPaM3[atrium];
    const text = raw.earlyConduitMinimum === null
      || raw.maximumLaterRefill === null
      || raw.laterRefillIncreaseM3 === null
      ? `branch ${raw.status}${raw.sourceReasons?.length ? ` · ${raw.sourceReasons.join(", ")}` : ""}`
      : `${raw.status === "resolved" ? "strict branch" : raw.status === "diagnostic-right-censored" ? "right-censored cycle diagnostic" : "ambiguous branch diagnostic"} · minimum ${(raw.earlyConduitMinimum.volumeM3 * 1e6).toFixed(2)} mL at ${(raw.earlyConduitMinimum.phaseSec * 1000).toFixed(0)} ms · later maximum ${(raw.maximumLaterRefill.volumeM3 * 1e6).toFixed(2)} mL · increase ${(raw.laterRefillIncreaseM3 * 1e6).toFixed(2)} mL${raw.sourceReasons?.length ? ` · ${raw.sourceReasons.join(", ")}` : ""}`;
    return Object.freeze({
      atrium,
      text,
      massBalance: rawMassBalance.status !== "resolved-right-censored"
        || rawMassBalance.trapezoidalVenousInflowVolumeM3 === undefined
        || rawMassBalance.trapezoidalAvOutflowVolumeM3 === undefined
        || rawMassBalance.observedAtrialVolumeChangeM3 === undefined
        || rawMassBalance.trapezoidalDiscreteMassBalanceClosureErrorM3 === undefined
        ? `post-opening mass balance ${rawMassBalance.status}${rawMassBalance.sourceReasons?.length ? ` · ${rawMassBalance.sourceReasons.join(", ")}` : ""}`
        : `post-opening right-censored mass balance · ∫Qven ${(rawMassBalance.trapezoidalVenousInflowVolumeM3 * 1e6).toFixed(2)} mL · ∫QAV ${(rawMassBalance.trapezoidalAvOutflowVolumeM3 * 1e6).toFixed(2)} mL · observed ΔV ${(rawMassBalance.observedAtrialVolumeChangeM3 * 1e6).toFixed(2)} mL · trapezoidal closure error ${(rawMassBalance.trapezoidalDiscreteMassBalanceClosureErrorM3 * 1e6).toFixed(3)} mL`,
      area: `nonperiodic closed-polygon diagnostic · signed shoelace ${(diagnostic.signedShoelaceAreaPaM3 * 1e6 / PA_PER_MMHG).toFixed(2)} mL·mmHg · observed open-path ∫P dV ${(diagnostic.observedOpenPathIntegralPdvPaM3 * 1e6 / PA_PER_MMHG).toFixed(2)} mL·mmHg · closing chord ${(diagnostic.closingChordContributionPdvPaM3 * 1e6 / PA_PER_MMHG).toFixed(2)} mL·mmHg · no physiological-work interpretation`,
    });
  });
}

function parseArgs(args: readonly string[]): Readonly<{
  waveformPath: string;
  reportPath: string;
  outputPath: string;
  fragmentOutputPath: string;
}> {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!["--waveform", "--report", "--output", "--fragment-output"].includes(flag)
        || value === undefined) {
      throw new Error(
        "usage: --waveform <json> --report <json> --output <html> [--fragment-output <html>]",
      );
    }
    if (values.has(flag)) throw new Error(`${flag} may be specified only once`);
    values.set(flag, value);
  }
  for (const required of ["--waveform", "--report", "--output"]) {
    if (!values.has(required)) throw new Error(`${required} is required`);
  }
  const result = Object.freeze({
    waveformPath: resolve(values.get("--waveform")!),
    reportPath: resolve(values.get("--report")!),
    outputPath: resolve(values.get("--output")!),
    fragmentOutputPath: resolve(
      values.get("--fragment-output") ?? DEFAULT_FRAGMENT_PATH,
    ),
  });
  const all = [
    result.waveformPath,
    result.reportPath,
    result.outputPath,
    result.fragmentOutputPath,
  ];
  if (new Set(all).size !== all.length) {
    throw new Error("renderer input and output paths must be distinct");
  }
  return result;
}

function writeUtf8(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function mapRecord(
  record: Readonly<Record<string, number>>,
  map: (value: number) => number,
): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(Object.entries(record).map(([key, value]) => [
    key,
    round(map(value), 7),
  ])));
}

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}

function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
