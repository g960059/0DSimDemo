import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_FIXED_PATH = path.resolve(
  "data/myocardium/reports/mainwire-coronary-v2-terminal-boundary-shadow-v1.json",
);
const DEFAULT_AUTOREGULATED_PATH = path.resolve(
  "data/myocardium/reports/mainwire-coronary-v2-autoregulated-terminal-boundary-shadow-v1.json",
);
const DEFAULT_FACTORIAL_SUMMARY_PATH = path.resolve(
  "data/myocardium/reports/mainwire-coronary-v2-resistance-compliance-factorial-summary-v1.json",
);
const DEFAULT_OUTPUT_PATH = path.resolve(
  "data/myocardium/visuals/mainwire-coronary-v2-autoregulated-terminal-boundary-shadow-v1.html",
);

const fixedPath = argument("--fixed", DEFAULT_FIXED_PATH);
const autoregulatedPath = argument("--autoregulated", DEFAULT_AUTOREGULATED_PATH);
const factorialSummaryPath = argument(
  "--factorial-summary",
  DEFAULT_FACTORIAL_SUMMARY_PATH,
);
const outputPath = argument("--output", DEFAULT_OUTPUT_PATH);
const fixed = JSON.parse(readFileSync(fixedPath, "utf8")) as ShadowReport;
const autoregulated = JSON.parse(
  readFileSync(autoregulatedPath, "utf8"),
) as ShadowReport;
const factorialSummary = JSON.parse(
  readFileSync(factorialSummaryPath, "utf8"),
) as FactorialSummary;
validate(fixed, "fixed");
validate(autoregulated, "autoregulated");
validateFactorialSummary(factorialSummary);

const fixedSummary = fixed.finalSummary.summary;
const autoSummary = autoregulated.finalSummary.summary;
const fixedLad = fixedSummary.territory.LAD;
const autoLad = autoSummary.territory.LAD;
const fixedLadEndocardialTissue = fixedLad.layers.subendocardial.tissue;
const autoLadEndocardialTissue = autoLad.layers.subendocardial.tissue;
const autoLadEndocardialR2 = autoLad.layers.subendocardial.r2;
const SHADOW_TONE_LOG_CLOSURE_GATE = 1e-4;
const SHADOW_VOLUME_RELATIVE_CLOSURE_GATE = 1e-5;
const shadowClosureAccepted =
  autoregulated.finalSummary.toneClosure.maximumAbsoluteLogResistanceScaleChange
    <= SHADOW_TONE_LOG_CLOSURE_GATE
  && autoregulated.finalSummary.closure.maximumRelative01
    <= SHADOW_VOLUME_RELATIVE_CLOSURE_GATE;
const metrics = [
  metric(
    "Mean coronary flow · target closure",
    fixedSummary.massNormalizedMeanInletMlPerMinPerG,
    autoSummary.massNormalizedMeanInletMlPerMinPerG,
    "mL/min/g",
    null,
  ),
  metric(
    "LAD inlet D/T forward",
    fixedLad.inlet.diastolicForwardVolumeFraction01,
    autoLad.inlet.diastolicForwardVolumeFraction01,
    "fraction",
    [0.70, 0.85],
  ),
  metric(
    "LAD peak D/S · MVC→AoVC",
    fixedLad.inlet.peakDiastolicToSystolicForwardFlowRatio,
    autoLad.inlet.peakDiastolicToSystolicForwardFlowRatio,
    "ratio",
    null,
  ),
  metric(
    "LAD peak D/ejection · AoVO→AoVC",
    fixedLad.inlet.peakDiastolicToEjectionForwardFlowRatio,
    autoLad.inlet.peakDiastolicToEjectionForwardFlowRatio,
    "ratio",
    null,
  ),
  metric(
    "LAD ENDO/EPI · target closure",
    fixedSummary.endocardialToEpicardialTissueFlowRatio.LAD,
    autoSummary.endocardialToEpicardialTissueFlowRatio.LAD,
    "ratio",
    null,
  ),
  metric(
    "LAD inlet peak after AoVC",
    fixedLad.inlet
      .diastolicPeakDelayAfterAorticClosureSec,
    autoLad.inlet
      .diastolicPeakDelayAfterAorticClosureSec,
    "s",
    null,
  ),
  metric(
    "LAD ENDO Qm peak after AoVC",
    fixedLadEndocardialTissue.diastolicPeakDelayAfterAorticClosureSec,
    autoLadEndocardialTissue.diastolicPeakDelayAfterAorticClosureSec,
    "s",
    null,
  ),
  metric(
    "CV reverse volume",
    fixedSummary.commonVenousOutlet.systole.reverseVolumeMl
      + fixedSummary.commonVenousOutlet.diastole.reverseVolumeMl,
    autoSummary.commonVenousOutlet.systole.reverseVolumeMl
      + autoSummary.commonVenousOutlet.diastole.reverseVolumeMl,
    "mL/beat",
    [0, 0.05],
  ),
];
const factorialRows = factorialSummary.rows;

const payload = JSON.stringify({
  fixed: {
    configuration: fixed.configuration,
    finalSummary: fixed.finalSummary,
    samples: fixed.samples,
  },
  autoregulated: {
    configuration: autoregulated.configuration,
    finalSummary: autoregulated.finalSummary,
    samples: autoregulated.samples,
  },
  metrics,
  factorialRows,
})
  .replaceAll("<", "\\u003c");
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Coronary V2 accepted-layer shadow</title>
  <style>
    :root { color-scheme: dark; --bg:#07101c; --panel:#0b1727; --line:#20314a;
      --text:#ecf4ff; --muted:#91a3bb; --cyan:#39c5ff; --blue:#5c8dff;
      --orange:#ff9b54; --green:#42d3a4; --yellow:#ffd65a; --red:#ff6f7d; }
    * { box-sizing:border-box; }
    body { margin:0; background:radial-gradient(circle at 25% 0,#10233c 0,#07101c 42%);
      color:var(--text); font:14px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif; }
    main { width:min(1600px,100%); margin:auto; padding:28px; }
    h1 { margin:0; font-size:clamp(25px,3vw,42px); letter-spacing:-.035em; }
    h2 { margin:0; font-size:18px; }
    p { margin:.45rem 0 0; color:var(--muted); }
    .topline { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; }
    .badge { flex:none; border:1px solid #8e6920; background:#30250d; color:#ffe09a;
      border-radius:999px; padding:7px 11px; font-size:12px; font-weight:700; }
    .metrics { display:grid; grid-template-columns:repeat(8,minmax(130px,1fr)); gap:10px;
      margin:22px 0; }
    .metric { min-width:0; padding:13px 14px; background:rgba(11,23,39,.84);
      border:1px solid var(--line); border-radius:12px; }
    .metric .name { color:var(--muted); min-height:38px; font-size:12px; }
    .metric .values { display:flex; align-items:baseline; gap:7px; margin-top:7px; }
    .metric .auto { font-size:23px; font-weight:720; letter-spacing:-.03em; }
    .metric .fixed { color:#72839a; text-decoration:line-through; }
    .metric .unit { color:var(--muted); font-size:11px; }
    .metric .gate { margin-top:5px; font-size:11px; color:var(--muted); }
    .metric.pass { border-color:#245e53; }
    .metric.fail { border-color:#70404b; }
    .metric.context { border-color:#3c506d; }
    .factorial { margin:0 0 18px; padding:16px 18px 13px; overflow:auto;
      background:rgba(11,23,39,.88); border:1px solid var(--line); border-radius:14px; }
    .factorial h2 { margin-bottom:3px; }
    table { width:100%; min-width:980px; border-collapse:collapse; margin-top:12px;
      font-variant-numeric:tabular-nums; }
    th,td { padding:9px 10px; text-align:right; border-top:1px solid var(--line); white-space:nowrap; }
    th { color:var(--muted); font-size:11px; font-weight:650; }
    th:first-child,td:first-child { text-align:left; }
    td.warn { color:#ff9f9f; }
    td.ok { color:#86e6c7; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .panel { min-width:0; background:rgba(11,23,39,.88); border:1px solid var(--line);
      border-radius:14px; overflow:hidden; }
    .panel header { padding:14px 16px 0; }
    .panel header p { font-size:12px; }
    canvas { display:block; width:100%; height:340px; }
    .legend { display:flex; flex-wrap:wrap; gap:10px 16px; padding:0 16px 14px;
      color:var(--muted); font-size:12px; }
    .swatch { display:inline-block; width:18px; border-top:2px solid; margin-right:6px;
      transform:translateY(-3px); }
    .notes { display:grid; grid-template-columns:1.1fr .9fr; gap:14px; margin-top:14px; }
    .note { padding:18px; background:rgba(11,23,39,.88); border:1px solid var(--line);
      border-radius:14px; }
    .note ul { margin:10px 0 0; padding-left:20px; color:var(--muted); }
    .note li + li { margin-top:7px; }
    code { color:#c8dcf7; }
    @media(max-width:1050px){ .metrics{grid-template-columns:repeat(3,1fr)} }
    @media(max-width:760px){ main{padding:18px}.grid,.notes{grid-template-columns:1fr}
      .metrics{grid-template-columns:repeat(2,1fr)}.topline{display:block}.badge{display:inline-block;margin-top:14px} }
  </style>
</head>
<body><main>
  <div class="topline"><div>
    <h1>Coronary V2 · accepted-layer shadow</h1>
    <p>Terminal main-wire boundary replay · C1–Rm–C2 · signed passive flow · fixed tone versus 6-state accepted autoregulation</p>
  </div><span class="badge">SHADOW ONLY · NO CLOSED-LOOP FEEDBACK</span></div>
  <section class="metrics">${metrics.map(metricHtml).join("")}</section>
  <section class="factorial"><h2>Mechanism ablation · resistance partition × proximal compliance</h2>
    <p>All four rows use the same terminal main-wire boundary and accepted mean-flow controller. No row qualifies as healthy when reserve and internal phase diagnostics are included.</p>
    <table><thead><tr><th>microvascular partition</th><th>Art C scale</th><th>flow<br>mL/min/g</th>
      <th>LAD D/T</th><th>peak D/S<br>MVC→AoVC</th><th>peak D/ejection<br>AoVO→AoVC</th><th>peak after AoVC</th><th>systolic reverse</th><th>ENDO R1 scale</th></tr></thead>
      <tbody>${factorialRows.map(factorialRowHtml).join("")}</tbody></table>
  </section>
  <section class="grid">
    ${panel("boundary", "Driving pressures", "Ao and mechanics-derived intramyocardial pressure; grey bands mark MVC→AoVC systole.", [
      ["#39c5ff", "Ao"], ["#ff9b54", "LAD EPI IMP"], ["#ff6f7d", "LAD ENDO IMP"],
    ])}
    ${panel("inlet", "Epicardial inlet flow", "Finite systolic forward flow is retained. Dashed traces are fixed-tone V2; solid traces advance accepted layer tone.", [
      ["#39c5ff", "LAD"], ["#42d3a4", "LCx"], ["#ff9b54", "RCA"],
    ])}
    ${panel("r1", "LAD arteriolar inflow Q1", "Subendocardial early-systolic reverse and early-diastolic refill are allowed without a diode.", [
      ["#5c8dff", "EPI"], ["#ffd65a", "ENDO"],
    ])}
    ${panel("qm", "LAD tissue transfer Qm", "Qm is the mean-perfusion owner. Its phase must be audited against Q1/Q2 storage, not equated to a proximal human Doppler trace.", [
      ["#5c8dff", "EPI"], ["#ffd65a", "ENDO"],
    ])}
    ${panel("q2", "LAD venular extrusion Q2", "Systolic venous extrusion is deliberately distinct from Qm.", [
      ["#5c8dff", "EPI"], ["#ffd65a", "ENDO"],
    ])}
    ${panel("cv", "Common coronary venous outlet", "Normal target is biphasic forward flow with only a short, small reverse component.", [
      ["#42d3a4", "CV → RA"], ["#7789a2", "zero"],
    ])}
  </section>
  <section class="notes">
    <div class="note"><h2>Current verdict</h2><ul>
      <li>The structural C1–Rm–C2 split fixes the gross inlet integral: LAD D/T rises from the rejected V1 value 0.526 to about ${format(autoLad.inlet.diastolicForwardVolumeFraction01, 3)} while systolic flow remains finite.</li>
      <li>The terminal accepted iteration ${shadowClosureAccepted ? "meets" : "does not meet"} the declared shadow closure gates: max log-tone change ≤ ${SHADOW_TONE_LOG_CLOSURE_GATE.toExponential(0)} and max relative volume drift ≤ ${SHADOW_VOLUME_RELATIVE_CLOSURE_GATE.toExponential(0)}. This is not closed-loop P1.</li>
      <li>Matching mean ENDO flow requires LAD ENDO R1 scale ${format(autoregulated.finalSummary.toneResistanceScaleByTerritoryLayer.LAD.subendocardial, 3)} versus the maximal-dilation floor 0.089. A healthy rest state that consumes nearly all reserve is not acceptable.</li>
      <li>Peak ratio is protocol-sensitive: ${format(autoLad.inlet.peakDiastolicToSystolicForwardFlowRatio, 2)} using MVC→AoVC but ${format(autoLad.inlet.peakDiastolicToEjectionForwardFlowRatio, 2)} using AoVO→AoVC. Neither is a hard gate until the cited measurement protocol and site are aligned.</li>
      <li>The inlet peak is ${format(autoLad.inlet.diastolicPeakDelayAfterAorticClosureSec, 3)} s after AoVC; ENDO Q1 and Qm must not be judged as the same measurement site.</li>
      <li>LAD ENDO Qm peaks ${format(autoLadEndocardialTissue.diastolicPeakDelayAfterAorticClosureSec, 3)} s after AoVC and only ${format(autoLadEndocardialTissue.earlyDiastolicForwardVolumeFractionOfDiastole01, 3)} of its diastolic forward volume occurs in the first 200 ms. The tissue-transfer phase remains too late for a healthy release.</li>
      <li>CV→RA has no reverse flow, but LAD ENDO Q2 backfills from CV for ${format(autoLadEndocardialR2.diastole.reverseDurationSec, 3)} s in diastole. A clean outlet trace does not establish normal internal venous physiology.</li>
      <li>Therefore this is a mechanism diagnostic, not a healthy canonical coronary release.</li>
    </ul></div>
    <div class="note"><h2>What is deliberately absent</h2><ul>
      <li>No hard diode, no valve-like gating, no inertance, no prescribed flow waveform.</li>
      <li>No oxygen state; “metabolic” tone is only a reduced accepted flow-demand controller.</li>
      <li>No source feedback and no fixed-TBV atomic coupling yet; Ao, RA and IMP are replayed from the same terminal main-wire beat.</li>
      <li>The 2×2 ablation rejects a one-knob compliance or resistance-partition repair. Next: construct the normal reference resistance under the beating boundary, then audit IMP and collapse ownership before adding conduit wave impedance.</li>
    </ul></div>
  </section>
</main>
<script>const DATA=${payload};
const C={grid:'#20314a',text:'#91a3bb',systole:'rgba(255,111,125,.07)'};
const fixed=[...DATA.fixed.samples].sort((a,b)=>a.cyclePhase01-b.cyclePhase01);
const auto=[...DATA.autoregulated.samples].sort((a,b)=>a.cyclePhase01-b.cyclePhase01);
const events=DATA.autoregulated.configuration.phaseDefinition;
function setup(id){const c=document.getElementById(id),d=Math.max(1,devicePixelRatio||1),r=c.getBoundingClientRect();c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);return {c,x,w:r.width,h:r.height};}
function systolic(p){const a=events.mitralClosurePhase01,b=events.aorticClosurePhase01;return a<=b?p>=a&&p<b:p>=a||p<b;}
function draw(id,series,yLabel){const o=setup(id),m={l:58,r:18,t:18,b:42},pw=o.w-m.l,ph=o.h-m.t;let vals=[];series.forEach(s=>s.values.forEach(v=>{if(Number.isFinite(v))vals.push(v)}));let min=Math.min(0,...vals),max=Math.max(0,...vals);if(max-min<1e-9){max=min+1}const pad=(max-min)*.1;max+=pad;min=min<0?min-pad:0;
  o.x.fillStyle=C.systole;let runs=[],start=null;for(let i=0;i<=500;i++){let p=i/500,on=systolic(p);if(on&&start===null)start=p;if((!on||i===500)&&start!==null){runs.push([start,on&&i===500?1:p]);start=null}}runs.forEach(r=>o.x.fillRect(m.l+r[0]*pw,m.t,(r[1]-r[0])*pw,ph));
  o.x.strokeStyle=C.grid;o.x.lineWidth=1;o.x.fillStyle=C.text;o.x.font='11px system-ui';for(let i=0;i<=4;i++){let p=i/4,y=m.t+ph-i/4*ph;o.x.beginPath();o.x.moveTo(m.l,y);o.x.lineTo(m.l+pw,y);o.x.stroke();let v=min+p*(max-min);o.x.fillText(v.toFixed(Math.abs(v)<10?2:1),8,y+4)}for(let i=0;i<=5;i++){let p=i/5,x=m.l+p*pw;o.x.beginPath();o.x.moveTo(x,m.t);o.x.lineTo(x,m.t+ph);o.x.stroke();o.x.fillText(p.toFixed(1),x-9,m.t+ph+20)}
  const y0=m.t+(max/(max-min))*ph;o.x.strokeStyle='#62748d';o.x.beginPath();o.x.moveTo(m.l,y0);o.x.lineTo(m.l+pw,y0);o.x.stroke();
  series.forEach(s=>{o.x.strokeStyle=s.color;o.x.globalAlpha=s.alpha??1;o.x.lineWidth=s.width??2;o.x.setLineDash(s.dash??[]);o.x.beginPath();s.values.forEach((v,i)=>{let x=m.l+s.phases[i]*pw,y=m.t+(max-v)/(max-min)*ph;i?o.x.lineTo(x,y):o.x.moveTo(x,y)});o.x.stroke()});o.x.globalAlpha=1;o.x.setLineDash([]);o.x.fillStyle=C.text;o.x.fillText('cycle phase',m.l+pw/2-27,o.h-8);o.x.save();o.x.translate(14,m.t+ph/2+30);o.x.rotate(-Math.PI/2);o.x.fillText(yLabel,0,0);o.x.restore();}
function phases(s){return s.map(x=>x.cyclePhase01)}
function vals(s,f){return s.map(f)}
function render(){
 draw('boundary',[{phases:phases(auto),values:vals(auto,s=>s.boundaryPressureMmHg.Ao),color:'#39c5ff'},{phases:phases(auto),values:vals(auto,s=>s.boundaryPressureMmHg.intramyocardialByTerritoryLayer.LAD.subepicardial),color:'#ff9b54'},{phases:phases(auto),values:vals(auto,s=>s.boundaryPressureMmHg.intramyocardialByTerritoryLayer.LAD.subendocardial),color:'#ff6f7d'}],'pressure (mmHg)');
 let inlet=[];[['LAD','#39c5ff'],['LCx','#42d3a4'],['RCA','#ff9b54']].forEach(z=>{inlet.push({phases:phases(fixed),values:vals(fixed,s=>s.flowMlPerSec.inletByTerritory[z[0]]),color:z[1],dash:[6,5],alpha:.38,width:1.5});inlet.push({phases:phases(auto),values:vals(auto,s=>s.flowMlPerSec.inletByTerritory[z[0]]),color:z[1]})});draw('inlet',inlet,'flow (mL/s)');
 const two=(field)=>[{phases:phases(auto),values:vals(auto,s=>s.flowMlPerSec[field].LAD.subepicardial),color:'#5c8dff'},{phases:phases(auto),values:vals(auto,s=>s.flowMlPerSec[field].LAD.subendocardial),color:'#ffd65a'}];draw('r1',two('r1ByTerritoryLayer'),'flow (mL/s)');draw('qm',two('tissueByTerritoryLayer'),'flow (mL/s)');draw('q2',two('r2ByTerritoryLayer'),'flow (mL/s)');draw('cv',[{phases:phases(fixed),values:vals(fixed,s=>s.flowMlPerSec.commonVenousOutlet),color:'#42d3a4',dash:[6,5],alpha:.35,width:1.5},{phases:phases(auto),values:vals(auto,s=>s.flowMlPerSec.commonVenousOutlet),color:'#42d3a4'}],'flow (mL/s)');}
let timer;addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(render,80)});render();
</script></body></html>`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html);
process.stdout.write(`${outputPath}\n`);

type PhaseLedger = Readonly<{
  systole: Readonly<{ forwardVolumeMl: number; reverseVolumeMl: number; reverseDurationSec: number }>;
  diastole: Readonly<{ forwardVolumeMl: number; reverseVolumeMl: number; reverseDurationSec: number }>;
  ejection: Readonly<{ forwardVolumeMl: number; reverseVolumeMl: number; reverseDurationSec: number }>;
  diastolicForwardVolumeFraction01: number;
  peakDiastolicToSystolicForwardFlowRatio: number;
  peakDiastolicToEjectionForwardFlowRatio: number;
  diastolicToSystolicMeanNetFlowRatio: number;
  earlyDiastolicForwardVolumeFractionOfDiastole01: number;
  diastolicPeakDelayAfterAorticClosureSec: number;
}>;
type TerritorySummary = Readonly<{
  inlet: PhaseLedger;
  layers: Readonly<Record<"subepicardial" | "subendocardial", Readonly<{
    tissue: PhaseLedger;
    r2: PhaseLedger;
  }>>>;
}>;
type CycleSummary = Readonly<{
  massNormalizedMeanInletMlPerMinPerG: number;
  commonVenousOutlet: PhaseLedger;
  territory: Readonly<Record<"LAD" | "LCx" | "RCA", TerritorySummary>>;
  endocardialToEpicardialTissueFlowRatio:
    Readonly<Record<"LAD" | "LCx" | "RCA", number>>;
}>;
type ShadowReport = Readonly<{
  completed: boolean;
  configuration: Readonly<{
    toneMode: "fixed" | "accepted-layer-autoregulation";
    resistancePartitionMode?: "symmetric-60-30-10" | "chilian-directional-transmural";
    largeArterialComplianceScale?: number;
  }>;
  finalSummary: Readonly<{
    summary: CycleSummary;
    toneResistanceScaleByTerritoryLayer: Readonly<Record<
      "LAD" | "LCx" | "RCA",
      Readonly<Record<"subepicardial" | "subendocardial", number>>
    >>;
    toneClosure: Readonly<{
      maximumAbsoluteLogResistanceScaleChange: number;
    }>;
    closure: Readonly<{ maximumRelative01: number }>;
  }>;
  samples: readonly unknown[];
}>;
type Metric = Readonly<{
  name: string;
  fixed: number;
  autoregulated: number;
  unit: string;
  gate: readonly [number, number] | null;
  pass: boolean | null;
}>;
type FactorialRow = Readonly<{
  partition: string;
  compliance: string;
  meanFlow: number;
  diastolicFraction: number;
  peakRatio: number;
  ejectionPeakRatio: number;
  peakDelaySec: number;
  systolicReverseMl: number;
  endocardialTone: number;
}>;
type FactorialSummary = Readonly<{
  schema: "circleheart.coronary-v2-mechanism-factorial-summary.v1";
  completed: boolean;
  rows: readonly FactorialRow[];
}>;

function metric(
  name: string,
  fixedValue: number,
  autoregulatedValue: number,
  unit: string,
  gate: readonly [number, number] | null,
): Metric {
  return Object.freeze({
    name,
    fixed: fixedValue,
    autoregulated: autoregulatedValue,
    unit,
    gate,
    pass: gate === null
      ? null
      : autoregulatedValue >= gate[0] && autoregulatedValue <= gate[1],
  });
}

function metricHtml(value: Metric): string {
  return `<article class="metric ${value.pass === null ? "context" : value.pass ? "pass" : "fail"}">
    <div class="name">${value.name}</div>
    <div class="values"><span class="auto">${format(value.autoregulated, 3)}</span>
      <span class="fixed">${format(value.fixed, 3)}</span></div>
    <div class="unit">${value.unit}</div>
    <div class="gate">${value.gate === null
      ? "protocol-sensitive · no hard gate"
      : `provisional gate ${format(value.gate[0], 2)}–${format(value.gate[1], 2)}`}</div>
  </article>`;
}

function factorialRowHtml(row: FactorialRow): string {
  const gate = (value: number, lower: number, upper: number): string =>
    value >= lower && value <= upper ? "ok" : "warn";
  return `<tr><td>${row.partition}</td><td>${row.compliance}</td>
    <td>${format(row.meanFlow, 3)}</td>
    <td class="${gate(row.diastolicFraction, 0.70, 0.85)}">${format(row.diastolicFraction, 3)}</td>
    <td>${format(row.peakRatio, 2)}</td>
    <td>${format(row.ejectionPeakRatio, 2)}</td>
    <td>${Math.round(row.peakDelaySec * 1e3)} ms</td>
    <td>${format(row.systolicReverseMl, 3)} mL</td>
    <td class="${gate(row.endocardialTone, 0.2, 1.8)}">${format(row.endocardialTone, 3)}</td></tr>`;
}

function panel(
  id: string,
  title: string,
  subtitle: string,
  legend: readonly (readonly [string, string])[],
): string {
  return `<article class="panel"><header><h2>${title}</h2><p>${subtitle}</p></header>
    <canvas id="${id}"></canvas><div class="legend">${legend.map(([color, label]) =>
      `<span><i class="swatch" style="border-color:${color}"></i>${label}</span>`).join("")}</div></article>`;
}

function format(value: number, digits: number): string {
  if (Math.abs(value) > 0 && Math.abs(value) < 1e-3) {
    return value.toExponential(1);
  }
  return value.toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function validate(report: ShadowReport, role: string): void {
  if (!report.completed || report.samples.length < 100 || !report.finalSummary) {
    throw new Error(`${role} report is incomplete`);
  }
}

function validateFactorialSummary(summary: FactorialSummary): void {
  if (
    summary.schema !== "circleheart.coronary-v2-mechanism-factorial-summary.v1"
    || !summary.completed
    || summary.rows.length !== 4
  ) {
    throw new Error("factorial summary is incomplete or has the wrong schema");
  }
}

function argument(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  return index < 0 ? fallback : path.resolve(process.argv[index + 1]!);
}
