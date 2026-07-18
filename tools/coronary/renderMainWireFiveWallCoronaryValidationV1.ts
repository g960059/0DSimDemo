import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const inputPath = argument(
  "--input",
  path.resolve(
    "data/myocardium/reports",
    "mainwire-five-wall-coronary-twelve-beat-dt2ms-validation-v1.json",
  ),
);
const outputPath = argument(
  "--output",
  path.resolve(
    "data/myocardium/visuals",
    "mainwire-five-wall-coronary-twelve-beat-dt2ms-validation-v1.html",
  ),
);

const report = JSON.parse(readFileSync(inputPath, "utf8")) as ValidationReport;
validateReport(report);
const finalBeat = report.beatSummaries.at(-1)!;
const flowSummary = finalBeat.summary.flowMlPerSec;
const csOutletMinimum = flowSummary.coronarySinusOutlet.minimum;
const storageDriftMl = flowSummary.signedBoundaryNetStorageChangeOverRunMl;
const plotSamples = report.samples.map((sample) => Object.freeze({
  cyclePhase01: sample.cyclePhase01,
  pressureMmHg: sample.pressureMmHg,
  flowMlPerSec: sample.flowMlPerSec,
}));
const embedded = JSON.stringify(Object.freeze({
  reportSchema: report.schema,
  transactionId: report.transactionId,
  configuration: report.configuration,
  finalBeatIndex: finalBeat.beatIndex,
  totalBeatCount: report.beatSummaries.length,
  finalBeatSummary: finalBeat.summary,
  samples: plotSamples,
})).replaceAll("<", "\\u003c");

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html({
  embedded,
  storageDriftMl,
  csOutletMinimum,
  finalBeatIndex: finalBeat.beatIndex,
  totalBeatCount: report.beatSummaries.length,
  completedStepCount: report.completedStepCount,
  retainedSampleCount: report.samples.length,
}));
process.stdout.write(`${JSON.stringify({
  inputPath,
  outputPath,
  completedStepCount: report.completedStepCount,
  finalBeatIndex: finalBeat.beatIndex,
  totalBeatCount: report.beatSummaries.length,
  retainedSampleCount: report.samples.length,
  storageDriftMl,
  csOutletMinimumMlPerSec: csOutletMinimum,
}, null, 2)}\n`);

function html(input: Readonly<{
  embedded: string;
  storageDriftMl: number;
  csOutletMinimum: number;
  finalBeatIndex: number;
  totalBeatCount: number;
  completedStepCount: number;
  retainedSampleCount: number;
}>): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Main-wire coronary validation · final beat</title>
<style>
:root{color-scheme:dark;--bg:#07101d;--panel:#0d1828;--panel2:#111e30;--line:#26364d;--text:#e7edf7;--muted:#91a1b8;--warn:#ffca5c;--danger:#ff7b84}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 15% 0,#10243b 0,transparent 34rem),var(--bg);color:var(--text);font:14px/1.45 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1560px;margin:auto;padding:28px}.eyebrow{color:#54d6ff;font-weight:700;letter-spacing:.13em;text-transform:uppercase}h1{font-size:clamp(25px,3vw,42px);line-height:1.08;margin:.35rem 0 .5rem}p{margin:.25rem 0;color:var(--muted)}
.warning{margin:22px 0;padding:17px 19px;border:1px solid #8f6825;background:linear-gradient(90deg,#2a2112,#1b1820);border-radius:14px}.warning strong{display:block;color:var(--warn);font-size:16px;letter-spacing:.04em}.warning p{color:#dfcda6;margin-top:6px}.warning code{color:#fff;background:#33291a;padding:2px 5px;border-radius:5px}
.cards{display:grid;grid-template-columns:repeat(6,minmax(130px,1fr));gap:10px;margin:18px 0}.card{background:rgba(17,30,48,.86);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.card .k{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.card .v{font:600 20px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:4px}.card .u{font-size:11px;color:var(--muted);margin-left:3px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.plot{background:rgba(13,24,40,.94);border:1px solid var(--line);border-radius:14px;padding:14px;min-width:0}.plot h2{font-size:16px;margin:0}.plot .sub{font-size:12px;color:var(--muted);min-height:18px}.canvas-wrap{height:310px;margin-top:8px}canvas{display:block;width:100%;height:100%}.span2{grid-column:span 2}
.table-wrap{overflow:auto;margin-top:18px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}table{border-collapse:collapse;width:100%;min-width:820px}th,td{padding:10px 13px;border-bottom:1px solid #1c2c41;text-align:right;font-variant-numeric:tabular-nums}th:first-child,td:first-child{text-align:left}th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}tbody tr:last-child td{border-bottom:0}.foot{margin:15px 0 0;font-size:12px;color:var(--muted)}
@media(max-width:1000px){.cards{grid-template-columns:repeat(3,1fr)}.grid{grid-template-columns:1fr}.span2{grid-column:auto}}@media(max-width:600px){main{padding:18px}.cards{grid-template-columns:repeat(2,1fr)}.canvas-wrap{height:270px}}
</style>
</head>
<body><main>
<div class="eyebrow">Mechanistic coronary circulation · bounded validation</div>
<h1>Final-beat coronary hemodynamics</h1>
<p>Actual full Land/SLS + membrane TriSeg + common pericardium transaction, dt = 2 ms. Signed flows are never rectified for display.</p>
<section class="warning"><strong>PROVISIONAL / NON-PERIODIC — not a release calibration</strong><p>This is beat ${input.finalBeatIndex} of a bounded ${input.totalBeatCount}-beat cold-start run, not an accepted periodic steady state. Coronary storage still changed by <code>${format(input.storageDriftMl, 5)} mL/beat</code>. CS→RA flow reached <code>${format(input.csOutletMinimum, 3)} mL/s</code>; the negative value denotes transient RA→CS reverse flow and remains an explicit model-review item.</p></section>
<section class="cards" id="cards"></section>
<section class="grid">
  <article class="plot span2"><h2>Boundary and distal pressures</h2><div class="sub">Ao, post-lesion Pd by territory, CS and RA · mmHg</div><div class="canvas-wrap"><canvas id="pressure"></canvas></div></article>
  <article class="plot span2"><h2>Mechanics-derived intramyocardial pressure</h2><div class="sub">EPI/ENDO layers by LAD, LCx and RCA territory · mmHg</div><div class="canvas-wrap"><canvas id="imp"></canvas></div></article>
  <article class="plot"><h2>Territory inlet flow</h2><div class="sub">Signed Ao→territory flow · mL/s</div><div class="canvas-wrap"><canvas id="inlet"></canvas></div></article>
  <article class="plot"><h2>Coronary sinus outlet flow</h2><div class="sub">Positive CS→RA; negative RA→CS · mL/s</div><div class="canvas-wrap"><canvas id="sinus"></canvas></div></article>
  <article class="plot span2"><h2>Layer arteriolar / tissue-bed inflow</h2><div class="sub">Signed terminal arterial→intramyocardial layer flow · mL/s</div><div class="canvas-wrap"><canvas id="layers"></canvas></div></article>
</section>
<div class="table-wrap"><table><thead><tr><th>Territory</th><th>Mean inlet</th><th>Mean EPI arteriolar</th><th>Mean ENDO arteriolar</th><th>ENDO/EPI ratio</th><th>Pd range</th></tr></thead><tbody id="territoryRows"></tbody></table></div>
<p class="foot">Artifact retains ${input.retainedSampleCount} accepted final-beat samples from ${input.completedStepCount} accepted steps. The JSON report owns exact values and solver/ledger diagnostics; this HTML is a self-contained visual readback. Healthy focal-lesion input makes Pd coincide with Ao by construction.</p>
</main>
<script type="application/json" id="validation-data">${input.embedded}</script>
<script>
"use strict";
const data=JSON.parse(document.getElementById("validation-data").textContent);const S=data.samples,F=data.finalBeatSummary.flowMlPerSec,P=data.finalBeatSummary.pressureMmHg;
const C={ao:"#f5f7ff",lad:"#49a6ff",lcx:"#52e3b2",rca:"#ffb454",epi:"#8a9bb5",endo:"#ff6685",cs:"#c497ff",ra:"#62d9f5",total:"#f7dc6f"};
const fmt=(x,d=2)=>Number(x).toFixed(d);const cards=[
 ["Mean coronary inlet",fmt(F.meanTotalCoronaryInletMlPerMin,1),"mL/min"],
 ["Mean CS outlet",fmt(F.meanCoronarySinusOutletMlPerMin,1),"mL/min"],
 ["Storage drift",fmt(F.signedBoundaryNetStorageChangeOverRunMl,4),"mL/beat"],
 ["CS reverse minimum",fmt(F.coronarySinusOutlet.minimum,2),"mL/s"],
 ["Global ledger max",Number(data.finalBeatSummary.maximumAbsoluteLedgerErrorMl.globalAccepted).toExponential(2),"mL"],
 ["Coronary ledger max",Number(data.finalBeatSummary.maximumAbsoluteLedgerErrorMl.coronaryLocalTrial).toExponential(2),"mL"]];
document.getElementById("cards").innerHTML=cards.map(x=>'<div class="card"><div class="k">'+x[0]+'</div><div class="v">'+x[1]+'<span class="u">'+x[2]+'</span></div></div>').join("");
const terr=["LAD","LCx","RCA"];document.getElementById("territoryRows").innerHTML=terr.map(t=>{const m=F.meanArteriolarMlPerMinByTerritoryLayer[t],r=F.meanArteriolarEndocardialToEpicardialFlowRatioByTerritory[t],pd=P.postLesionPdByTerritory[t];return '<tr><td>'+t+'</td><td>'+fmt(F.meanInletMlPerMinByTerritory[t],1)+' mL/min</td><td>'+fmt(m.subepicardial,1)+' mL/min</td><td>'+fmt(m.subendocardial,1)+' mL/min</td><td>'+fmt(r,3)+'</td><td>'+fmt(pd.minimum,1)+'–'+fmt(pd.maximum,1)+' mmHg</td></tr>'}).join("");
const charts=[
 {id:"pressure",zero:true,series:[
  ["Ao",C.ao,s=>s.pressureMmHg.Ao],["Pd LAD",C.lad,s=>s.pressureMmHg.postLesionPdByTerritory.LAD],["Pd LCx",C.lcx,s=>s.pressureMmHg.postLesionPdByTerritory.LCx],["Pd RCA",C.rca,s=>s.pressureMmHg.postLesionPdByTerritory.RCA],["CS",C.cs,s=>s.pressureMmHg.CS],["RA",C.ra,s=>s.pressureMmHg.RA]]},
 {id:"imp",zero:true,series:terr.flatMap(t=>[[t+" EPI",C[t.toLowerCase()],s=>s.pressureMmHg.intramyocardialByTerritoryLayer[t].subepicardial,0.55],[t+" ENDO",C[t.toLowerCase()],s=>s.pressureMmHg.intramyocardialByTerritoryLayer[t].subendocardial,1]])},
 {id:"inlet",zero:true,series:[["LAD",C.lad,s=>s.flowMlPerSec.inletByTerritory.LAD],["LCx",C.lcx,s=>s.flowMlPerSec.inletByTerritory.LCx],["RCA",C.rca,s=>s.flowMlPerSec.inletByTerritory.RCA],["Total",C.total,s=>s.flowMlPerSec.totalCoronaryInlet]]},
 {id:"sinus",zero:true,series:[["CS→RA",C.cs,s=>s.flowMlPerSec.coronarySinusOutlet]]},
 {id:"layers",zero:true,series:terr.flatMap(t=>[[t+" EPI",C[t.toLowerCase()],s=>s.flowMlPerSec.arteriolarByTerritoryLayer[t].subepicardial,0.55],[t+" ENDO",C[t.toLowerCase()],s=>s.flowMlPerSec.arteriolarByTerritoryLayer[t].subendocardial,1]])}
];
function draw(spec){const cv=document.getElementById(spec.id),box=cv.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);cv.width=Math.max(1,Math.round(box.width*dpr));cv.height=Math.max(1,Math.round(box.height*dpr));const g=cv.getContext("2d");g.scale(dpr,dpr);const W=box.width,H=box.height,m={l:54,r:16,t:34,b:31},pw=W-m.l-m.r,ph=H-m.t-m.b;let ys=spec.series.flatMap(q=>S.map(q[2]));let lo=Math.min(...ys),hi=Math.max(...ys);if(spec.zero){lo=Math.min(0,lo);hi=Math.max(0,hi)}let pad=Math.max((hi-lo)*.08,.001);lo-=pad;hi+=pad;const X=x=>m.l+x*pw,Y=y=>m.t+(hi-y)/(hi-lo)*ph;g.font="11px ui-sans-serif,-apple-system,sans-serif";g.lineWidth=1;g.strokeStyle="#25364d";g.fillStyle="#8596ae";g.textAlign="right";g.textBaseline="middle";for(let i=0;i<=4;i++){const y=lo+(hi-lo)*i/4,py=Y(y);g.beginPath();g.moveTo(m.l,py);g.lineTo(W-m.r,py);g.stroke();g.fillText(Math.abs(y)>=100?y.toFixed(0):y.toFixed(1),m.l-8,py)}g.textAlign="center";g.textBaseline="top";for(let i=0;i<=4;i++){const x=i/4,px=X(x);g.beginPath();g.moveTo(px,m.t);g.lineTo(px,H-m.b);g.stroke();g.fillText(x.toFixed(2),px,H-m.b+7)}if(lo<0&&hi>0){g.strokeStyle="#62748e";g.setLineDash([4,4]);g.beginPath();g.moveTo(m.l,Y(0));g.lineTo(W-m.r,Y(0));g.stroke();g.setLineDash([])}spec.series.forEach((q,idx)=>{g.strokeStyle=q[1];g.globalAlpha=q[3]??1;g.lineWidth=idx===spec.series.length-1&&spec.id==="inlet"?2.4:1.8;g.beginPath();S.forEach((s,i)=>{const x=s.cyclePhase01,y=q[2](s);if(i===0)g.moveTo(X(x),Y(y));else g.lineTo(X(x),Y(y))});g.stroke()});g.globalAlpha=1;let lx=m.l,ly=12;g.textAlign="left";g.textBaseline="middle";spec.series.forEach(q=>{const width=g.measureText(q[0]).width+25;if(lx+width>W-m.r){lx=m.l;ly+=16}g.fillStyle=q[1];g.fillRect(lx,ly-1,12,2);g.fillStyle="#aebbd0";g.fillText(q[0],lx+16,ly);lx+=width});}
function drawAll(){charts.forEach(draw)};new ResizeObserver(()=>requestAnimationFrame(drawAll)).observe(document.querySelector(".grid"));drawAll();
</script>
</body></html>\n`;
}

function format(value: number, digits: number): string {
  return value.toFixed(digits);
}

type Range = Readonly<{ minimum: number; maximum: number }>;
type ValidationSample = Readonly<{
  cyclePhase01: number;
  pressureMmHg: Readonly<{
    Ao: number;
    RA: number;
    CS: number;
    postLesionPdByTerritory: Readonly<Record<string, number>>;
    intramyocardialByTerritoryLayer: Readonly<
      Record<string, Readonly<Record<string, number>>>
    >;
  }>;
  flowMlPerSec: Readonly<{
    totalCoronaryInlet: number;
    coronarySinusOutlet: number;
    inletByTerritory: Readonly<Record<string, number>>;
    arteriolarByTerritoryLayer: Readonly<
      Record<string, Readonly<Record<string, number>>>
    >;
  }>;
}>;
type ValidationReport = Readonly<{
  schema: string;
  transactionId: string;
  configuration: unknown;
  completed: boolean;
  completedStepCount: number;
  beatSummaries: readonly Readonly<{
    beatIndex: number;
    summary: Readonly<{
      pressureMmHg: Readonly<{
        postLesionPdByTerritory: Readonly<Record<string, Range>>;
      }>;
      flowMlPerSec: Readonly<{
        coronarySinusOutlet: Range;
        signedBoundaryNetStorageChangeOverRunMl: number;
      }>;
    }>;
  }>[];
  samples: readonly ValidationSample[];
}>;

function validateReport(report: ValidationReport): void {
  if (
    report.schema
      !== "circleheart.main-wire-five-wall-coronary-bounded-validation.v1"
    || report.completed !== true
    || report.beatSummaries.length < 1
    || report.samples.length < 1
  ) throw new Error("input is not a completed coronary bounded-validation report");
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
