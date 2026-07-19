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
const phasicSummary = finalBeat.summary.phasicCoronaryFlow;
const atLeast = (value: number | null, lower: number): boolean =>
  value !== null && value >= lower;
const atMost = (value: number | null, upper: number): boolean =>
  value !== null && value <= upper;
const csOutletMinimum = flowSummary.coronarySinusOutlet.minimum;
const storageDriftMl = flowSummary.signedBoundaryNetStorageChangeOverRunMl;
const coronaryOutputAccepted = atLeast(
  flowSummary.coronaryToNetCardiacOutputFraction01,
  0.02,
) && atMost(
  flowSummary.coronaryToNetCardiacOutputFraction01,
  0.07,
) && atLeast(
  flowSummary.massNormalizedCoronaryFlowMlPerMinPerG,
  0.7,
) && atMost(
  flowSummary.massNormalizedCoronaryFlowMlPerMinPerG,
  1.3,
);
const leftCoronaryPhasicAccepted =
  phasicSummary.phaseDefinition.eventSegmentationAccepted
  && atLeast(
    phasicSummary.territory.LAD.diastolicForwardVolumeFraction01,
    0.7,
  )
  && atLeast(
    phasicSummary.territory.LCx.diastolicForwardVolumeFraction01,
    0.7,
  )
  && atLeast(
    phasicSummary.territory.LAD
      .peakDiastolicToSystolicForwardFlowRatio,
    1.5,
  )
  && atLeast(
    phasicSummary.territory.LCx
      .peakDiastolicToSystolicForwardFlowRatio,
    1.5,
  )
  && atLeast(
    phasicSummary.territory.LAD
      .earlyDiastolicForwardVolumeFractionOfDiastole01,
    0.3,
  )
  && atLeast(
    phasicSummary.territory.LCx
      .earlyDiastolicForwardVolumeFractionOfDiastole01,
    0.3,
  )
  && atMost(
    phasicSummary.territory.LAD
      .diastolicForwardFlowCentroidAfterAorticClosureSec,
    0.35,
  )
  && atMost(
    phasicSummary.territory.LCx
      .diastolicForwardFlowCentroidAfterAorticClosureSec,
    0.35,
  );
const plotSamples = Object.freeze(report.samples.map((sample) => Object.freeze({
  cyclePhase01: sample.cyclePhase01,
  pressureMmHg: sample.pressureMmHg,
  flowMlPerSec: sample.flowMlPerSec,
  valveOpeningFraction01: sample.valveOpeningFraction01,
})).sort((left, right) => left.cyclePhase01 - right.cyclePhase01));
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
  healthyCoronaryAccepted:
    coronaryOutputAccepted && leftCoronaryPhasicAccepted,
  coronaryOutputAccepted,
  leftCoronaryPhasicAccepted,
  finalBeatIndex: finalBeat.beatIndex,
  totalBeatCount: report.beatSummaries.length,
  completedStepCount: report.completedStepCount,
  retainedSampleCount: report.samples.length,
  coronaryToNetCardiacOutputFraction01:
    flowSummary.coronaryToNetCardiacOutputFraction01,
  massNormalizedCoronaryFlowMlPerMinPerG:
    flowSummary.massNormalizedCoronaryFlowMlPerMinPerG,
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
  healthyCoronaryAccepted: boolean;
  coronaryOutputAccepted: boolean;
  leftCoronaryPhasicAccepted: boolean;
  finalBeatIndex: number;
  totalBeatCount: number;
  completedStepCount: number;
  retainedSampleCount: number;
  coronaryToNetCardiacOutputFraction01: number | null;
  massNormalizedCoronaryFlowMlPerMinPerG: number;
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
.warning{margin:22px 0;padding:17px 19px;border:1px solid #8f6825;background:linear-gradient(90deg,#2a2112,#1b1820);border-radius:14px}.warning strong{display:block;color:var(--warn);font-size:16px;letter-spacing:.04em}.warning p{color:#dfcda6;margin-top:6px}.warning code{color:#fff;background:#33291a;padding:2px 5px;border-radius:5px}.warning.fail{border-color:#884049;background:linear-gradient(90deg,#2b171d,#1b1820)}.warning.fail strong{color:var(--danger)}
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
<section class="warning ${input.healthyCoronaryAccepted ? "" : "fail"}"><strong>PROVISIONAL / NON-PERIODIC — healthy coronary acceptance ${input.healthyCoronaryAccepted ? "not yet release-eligible" : "currently fails"}</strong><p>This is beat ${input.finalBeatIndex} of a bounded ${input.totalBeatCount}-beat cold-start run, not an accepted periodic steady state. Systole is measured from mitral closure to aortic closure; the gray band is the narrower AoV ejection interval. Output gate: <code>${input.coronaryOutputAccepted ? "pass" : "fail"}</code> (${format(100 * (input.coronaryToNetCardiacOutputFraction01 ?? Number.NaN), 2)}% CO; ${format(input.massNormalizedCoronaryFlowMlPerMinPerG, 3)} mL/min/g). Left phasic gate: <code>${input.leftCoronaryPhasicAccepted ? "pass" : "fail"}</code>. Coronary storage still changed by <code>${format(input.storageDriftMl, 5)} mL/beat</code>. CS→RA flow reached <code>${format(input.csOutletMinimum, 3)} mL/s</code>; the negative value denotes transient RA→CS-reservoir reverse flow and remains an explicit model-review item.</p></section>
<section class="cards" id="cards"></section>
<section class="grid">
  <article class="plot span2"><h2>Boundary, chamber and distal pressures</h2><div class="sub">LV/RV, Ao, post-lesion Pd by territory, CS and RA · gray band = AoV-defined ejection</div><div class="canvas-wrap"><canvas id="pressure"></canvas></div></article>
  <article class="plot span2"><h2>Mechanics-derived intramyocardial pressure</h2><div class="sub">EPI/ENDO layers by LAD, LCx and RCA territory · mmHg</div><div class="canvas-wrap"><canvas id="imp"></canvas></div></article>
  <article class="plot"><h2>Territory inlet flow</h2><div class="sub">Signed Ao→territory flow · gray band = AoV-defined ejection · mL/s</div><div class="canvas-wrap"><canvas id="inlet"></canvas></div></article>
  <article class="plot"><h2>Coronary sinus outlet flow</h2><div class="sub">Positive CS→RA; negative RA→CS · mL/s</div><div class="canvas-wrap"><canvas id="sinus"></canvas></div></article>
  <article class="plot span2"><h2>Proximal inflow decomposition</h2><div class="sub">Total inlet = current tissue-bed inflow + distal arterial storage rate · signed mL/s</div><div class="canvas-wrap"><canvas id="storage"></canvas></div></article>
  <article class="plot span2"><h2>Layer arteriolar / tissue-bed inflow</h2><div class="sub">Signed terminal arterial→intramyocardial layer flow · mL/s</div><div class="canvas-wrap"><canvas id="layers"></canvas></div></article>
</section>
<div class="table-wrap"><table><thead><tr><th>Territory</th><th>Mean inlet</th><th>Inlet D/T forward</th><th>Inlet peak D/S</th><th>Early-D forward share</th><th>D-flow centroid after AoVC</th><th>Systolic forward volume</th><th>Systolic reverse volume</th><th>EPI D/T net</th><th>ENDO D/T net</th><th>EPI systolic reverse</th><th>ENDO systolic reverse</th><th>EPI peak delay</th><th>ENDO peak delay</th><th>Mean EPI arteriolar</th><th>Mean ENDO arteriolar</th><th>ENDO/EPI ratio</th><th>Pd range</th></tr></thead><tbody id="territoryRows"></tbody></table></div>
<p class="foot">Artifact retains ${input.retainedSampleCount} accepted final-beat samples from ${input.completedStepCount} accepted steps. The JSON report owns exact values and solver/ledger diagnostics; this HTML is a self-contained visual readback. Healthy focal-lesion input makes Pd coincide with Ao by construction.</p>
</main>
<script type="application/json" id="validation-data">${input.embedded}</script>
<script>
"use strict";
const data=JSON.parse(document.getElementById("validation-data").textContent);const S=data.samples,F=data.finalBeatSummary.flowMlPerSec,P=data.finalBeatSummary.pressureMmHg,H=data.finalBeatSummary.phasicCoronaryFlow;
const C={ao:"#f5f7ff",lad:"#49a6ff",lcx:"#52e3b2",rca:"#ffb454",epi:"#8a9bb5",endo:"#ff6685",cs:"#c497ff",ra:"#62d9f5",total:"#f7dc6f"};
const fmt=(x,d=2)=>x===null||!Number.isFinite(Number(x))?"—":Number(x).toFixed(d);const cards=[
 ["Aortic net cardiac output",fmt(F.aorticNetCardiacOutputMlPerMin/1000,2),"L/min"],
 ["Mean coronary inlet",fmt(F.meanTotalCoronaryInletMlPerMin,1),"mL/min"],
 ["Coronary / net CO",fmt(100*F.coronaryToNetCardiacOutputFraction01,2),"%"],
 ["Mass-normalized coronary flow",fmt(F.massNormalizedCoronaryFlowMlPerMinPerG,3),"mL/min/g"],
 ["Resting-flow target attained",fmt(F.targetRestingFlowAttainmentFraction01,3),"fraction"],
 ["LAD diastolic fraction",fmt(H.territory.LAD.diastolicForwardVolumeFraction01,3),""],
 ["LCx diastolic fraction",fmt(H.territory.LCx.diastolicForwardVolumeFraction01,3),""],
 ["RCA diastolic fraction",fmt(H.territory.RCA.diastolicForwardVolumeFraction01,3),""],
 ["LAD early-D share",fmt(H.territory.LAD.earlyDiastolicForwardVolumeFractionOfDiastole01,3),""],
 ["LCx early-D share",fmt(H.territory.LCx.earlyDiastolicForwardVolumeFractionOfDiastole01,3),""],
 ["LAD systolic inlet stored",fmt((H.territoryDistalArterialStorage.LAD.systole.forwardVolumeMl-H.territoryDistalArterialStorage.LAD.systole.reverseVolumeMl)/H.territory.LAD.systole.forwardVolumeMl,3),"fraction"],
 ["LCx systolic inlet stored",fmt((H.territoryDistalArterialStorage.LCx.systole.forwardVolumeMl-H.territoryDistalArterialStorage.LCx.systole.reverseVolumeMl)/H.territory.LCx.systole.forwardVolumeMl,3),"fraction"],
 ["CS reverse volume",fmt(H.coronarySinus.systole.reverseVolumeMl+H.coronarySinus.diastole.reverseVolumeMl,3),"mL/beat"],
 ["CS reverse duration",fmt(H.coronarySinus.reverseDurationSec,3),"s/beat"],
 ["Storage drift",fmt(F.signedBoundaryNetStorageChangeOverRunMl,4),"mL/beat"],
 ["Global ledger max",Number(data.finalBeatSummary.maximumAbsoluteLedgerErrorMl.globalAccepted).toExponential(2),"mL"],
 ["Coronary ledger max",Number(data.finalBeatSummary.maximumAbsoluteLedgerErrorMl.coronaryLocalTrial).toExponential(2),"mL"]];
document.getElementById("cards").innerHTML=cards.map(x=>'<div class="card"><div class="k">'+x[0]+'</div><div class="v">'+x[1]+'<span class="u">'+x[2]+'</span></div></div>').join("");
const terr=["LAD","LCx","RCA"];document.getElementById("territoryRows").innerHTML=terr.map(t=>{const m=F.meanArteriolarMlPerMinByTerritoryLayer[t],r=F.meanArteriolarEndocardialToEpicardialFlowRatioByTerritory[t],pd=P.postLesionPdByTerritory[t],h=H.territory[t],e=H.layerArteriolar[t].subepicardial,n=H.layerArteriolar[t].subendocardial;return '<tr><td>'+t+'</td><td>'+fmt(F.meanInletMlPerMinByTerritory[t],1)+' mL/min</td><td>'+fmt(h.diastolicForwardVolumeFraction01,3)+'</td><td>'+fmt(h.peakDiastolicToSystolicForwardFlowRatio,2)+'</td><td>'+fmt(h.earlyDiastolicForwardVolumeFractionOfDiastole01,3)+'</td><td>'+fmt(h.diastolicForwardFlowCentroidAfterAorticClosureSec,3)+' s</td><td>'+fmt(h.systole.forwardVolumeMl,3)+' mL</td><td>'+fmt(h.systole.reverseVolumeMl,3)+' mL</td><td>'+fmt(e.diastolicNetVolumeFraction01,3)+'</td><td>'+fmt(n.diastolicNetVolumeFraction01,3)+'</td><td>'+fmt(e.systole.reverseVolumeMl,3)+' mL</td><td>'+fmt(n.systole.reverseVolumeMl,3)+' mL</td><td>'+fmt(e.diastolicPeakDelayAfterAorticClosureSec,3)+' s</td><td>'+fmt(n.diastolicPeakDelayAfterAorticClosureSec,3)+' s</td><td>'+fmt(m.subepicardial,1)+' mL/min</td><td>'+fmt(m.subendocardial,1)+' mL/min</td><td>'+fmt(r,3)+'</td><td>'+fmt(pd.minimum,1)+'–'+fmt(pd.maximum,1)+' mmHg</td></tr>'}).join("");
const charts=[
 {id:"pressure",zero:true,series:[
  ["LV",C.lad,s=>s.pressureMmHg.LV],["RV",C.rca,s=>s.pressureMmHg.RV],["Ao",C.ao,s=>s.pressureMmHg.Ao],["Pd LAD",C.lad,s=>s.pressureMmHg.postLesionPdByTerritory.LAD,0.45],["Pd LCx",C.lcx,s=>s.pressureMmHg.postLesionPdByTerritory.LCx,0.45],["Pd RCA",C.rca,s=>s.pressureMmHg.postLesionPdByTerritory.RCA,0.45],["CS",C.cs,s=>s.pressureMmHg.CS],["RA",C.ra,s=>s.pressureMmHg.RA]]},
 {id:"imp",zero:true,series:[["Perivascular external",C.ao,s=>s.pressureMmHg.perivascularExternal,0.55],...terr.flatMap(t=>[[t+" EPI",C[t.toLowerCase()],s=>s.pressureMmHg.intramyocardialByTerritoryLayer[t].subepicardial,0.55],[t+" ENDO",C[t.toLowerCase()],s=>s.pressureMmHg.intramyocardialByTerritoryLayer[t].subendocardial,1]])]},
 {id:"inlet",zero:true,series:[["LAD",C.lad,s=>s.flowMlPerSec.inletByTerritory.LAD],["LCx",C.lcx,s=>s.flowMlPerSec.inletByTerritory.LCx],["RCA",C.rca,s=>s.flowMlPerSec.inletByTerritory.RCA],["Total",C.total,s=>s.flowMlPerSec.totalCoronaryInlet]]},
 {id:"sinus",zero:true,series:[["CS→RA",C.cs,s=>s.flowMlPerSec.coronarySinusOutlet]]},
 {id:"storage",zero:true,series:[["Total inlet",C.total,s=>s.flowMlPerSec.totalCoronaryInlet],["Current tissue-bed inflow",C.lcx,s=>terr.reduce((a,t)=>a+s.flowMlPerSec.arteriolarByTerritoryLayer[t].subepicardial+s.flowMlPerSec.arteriolarByTerritoryLayer[t].subendocardial,0)],["Distal arterial storage rate",C.cs,s=>s.flowMlPerSec.totalCoronaryInlet-terr.reduce((a,t)=>a+s.flowMlPerSec.arteriolarByTerritoryLayer[t].subepicardial+s.flowMlPerSec.arteriolarByTerritoryLayer[t].subendocardial,0)]]},
 {id:"layers",zero:true,series:terr.flatMap(t=>[[t+" EPI",C[t.toLowerCase()],s=>s.flowMlPerSec.arteriolarByTerritoryLayer[t].subepicardial,0.55],[t+" ENDO",C[t.toLowerCase()],s=>s.flowMlPerSec.arteriolarByTerritoryLayer[t].subendocardial,1]])}
];
function draw(spec){const cv=document.getElementById(spec.id),box=cv.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);cv.width=Math.max(1,Math.round(box.width*dpr));cv.height=Math.max(1,Math.round(box.height*dpr));const g=cv.getContext("2d");g.scale(dpr,dpr);const W=box.width,CH=box.height,m={l:54,r:16,t:42,b:31},pw=W-m.l-m.r,ph=CH-m.t-m.b;let ys=spec.series.flatMap(q=>S.map(q[2]));let lo=Math.min(...ys),hi=Math.max(...ys);if(spec.zero){lo=Math.min(0,lo);hi=Math.max(0,hi)}let pad=Math.max((hi-lo)*.08,.001);lo-=pad;hi+=pad;const X=x=>m.l+x*pw,Y=y=>m.t+(hi-y)/(hi-lo)*ph;const eo=H.phaseDefinition.aorticOpeningPhase01,ec=H.phaseDefinition.aorticClosurePhase01,mc=H.phaseDefinition.mitralClosurePhase01;if(eo!==null&&ec!==null){g.fillStyle="rgba(168,184,208,.09)";if(eo<=ec)g.fillRect(X(eo),m.t,X(ec)-X(eo),ph);else{g.fillRect(m.l,m.t,X(ec)-m.l,ph);g.fillRect(X(eo),m.t,W-m.r-X(eo),ph)}g.fillStyle="#8190a6";g.font="10px ui-sans-serif,-apple-system,sans-serif";g.textAlign="center";g.textBaseline="bottom";g.fillText("AoV ejection",X((eo+ec)/2),m.t-3)}[[mc,"MVC","#ffca5c"],[ec,"AoVC","#a9b8cc"]].forEach(v=>{if(v[0]===null)return;g.strokeStyle=v[2];g.setLineDash([3,4]);g.beginPath();g.moveTo(X(v[0]),m.t);g.lineTo(X(v[0]),CH-m.b);g.stroke();g.setLineDash([]);g.fillStyle=v[2];g.font="9px ui-sans-serif,-apple-system,sans-serif";g.textAlign="center";g.textBaseline="top";g.fillText(v[1],X(v[0]),m.t+2)});g.font="11px ui-sans-serif,-apple-system,sans-serif";g.lineWidth=1;g.strokeStyle="#25364d";g.fillStyle="#8596ae";g.textAlign="right";g.textBaseline="middle";for(let i=0;i<=4;i++){const y=lo+(hi-lo)*i/4,py=Y(y);g.beginPath();g.moveTo(m.l,py);g.lineTo(W-m.r,py);g.stroke();g.fillText(Math.abs(y)>=100?y.toFixed(0):y.toFixed(1),m.l-8,py)}g.textAlign="center";g.textBaseline="top";for(let i=0;i<=4;i++){const x=i/4,px=X(x);g.beginPath();g.moveTo(px,m.t);g.lineTo(px,CH-m.b);g.stroke();g.fillText(x.toFixed(2),px,CH-m.b+7)}if(lo<0&&hi>0){g.strokeStyle="#62748e";g.setLineDash([4,4]);g.beginPath();g.moveTo(m.l,Y(0));g.lineTo(W-m.r,Y(0));g.stroke();g.setLineDash([])}spec.series.forEach((q,idx)=>{g.strokeStyle=q[1];g.globalAlpha=q[3]??1;g.lineWidth=idx===spec.series.length-1&&spec.id==="inlet"?2.4:1.8;g.beginPath();S.forEach((s,i)=>{const x=s.cyclePhase01,y=q[2](s),wrapped=i>0&&x<S[i-1].cyclePhase01;if(i===0||wrapped)g.moveTo(X(x),Y(y));else g.lineTo(X(x),Y(y))});g.stroke()});g.globalAlpha=1;let lx=m.l,ly=12;g.textAlign="left";g.textBaseline="middle";spec.series.forEach(q=>{const width=g.measureText(q[0]).width+25;if(lx+width>W-m.r){lx=m.l;ly+=16}g.fillStyle=q[1];g.fillRect(lx,ly-1,12,2);g.fillStyle="#aebbd0";g.fillText(q[0],lx+16,ly);lx+=width});}
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
    LV: number;
    RV: number;
    RA: number;
    CS: number;
    perivascularExternal: number;
    postLesionPdByTerritory: Readonly<Record<string, number>>;
    intramyocardialByTerritoryLayer: Readonly<
      Record<string, Readonly<Record<string, number>>>
    >;
  }>;
  flowMlPerSec: Readonly<{
    aorticValve: number;
    mitralValve: number;
    totalCoronaryInlet: number;
    coronarySinusOutlet: number;
    inletByTerritory: Readonly<Record<string, number>>;
    arteriolarByTerritoryLayer: Readonly<
      Record<string, Readonly<Record<string, number>>>
    >;
  }>;
  valveOpeningFraction01: Readonly<{ AoV: number; MV: number }>;
}>;
type ValidationReport = Readonly<{
  schema: string;
  diagnosticsVersion: number;
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
        aorticNetCardiacOutputMlPerMin: number | null;
        meanTotalCoronaryInletMlPerMin: number;
        coronaryToNetCardiacOutputFraction01: number | null;
        massNormalizedCoronaryFlowMlPerMinPerG: number;
        targetRestingFlowAttainmentFraction01: number;
        meanInletMlPerMinByTerritory: Readonly<Record<string, number>>;
        meanArteriolarMlPerMinByTerritoryLayer: Readonly<
          Record<string, Readonly<Record<string, number>>>
        >;
        meanArteriolarEndocardialToEpicardialFlowRatioByTerritory:
          Readonly<Record<string, number>>;
      }>;
      phasicCoronaryFlow: PhasicCoronaryFlowSummary;
    }>;
  }>[];
  samples: readonly ValidationSample[];
}>;

type PhasicFlowLedger = Readonly<{
  systole: Readonly<{
    forwardVolumeMl: number;
    reverseVolumeMl: number;
  }>;
  diastole: Readonly<{
    forwardVolumeMl: number;
    reverseVolumeMl: number;
  }>;
  earlyDiastole: Readonly<{
    forwardVolumeMl: number;
    reverseVolumeMl: number;
  }>;
  diastolicForwardVolumeFraction01: number | null;
  diastolicNetVolumeFraction01: number | null;
  diastolicSignedVolumeFractionOfGross01: number | null;
  earlyDiastolicForwardVolumeFractionOfDiastole01: number | null;
  diastolicForwardFlowCentroidAfterAorticClosureSec: number | null;
  peakDiastolicToSystolicForwardFlowRatio: number | null;
  diastolicPeakDelayAfterAorticClosureSec: number | null;
}>;

type PhasicCoronaryFlowSummary = Readonly<{
  phaseDefinition: Readonly<{
    eventSegmentationAccepted: boolean;
    orderedEventPairingAccepted: boolean;
    eventDurationEnvelopeAccepted: boolean;
    mitralClosurePhase01: number | null;
    aorticOpeningPhase01: number | null;
    aorticClosurePhase01: number | null;
    openingPhase01: number | null;
    closingPhase01: number | null;
  }>;
  territory: Readonly<Record<string, PhasicFlowLedger>>;
  territoryDistalArterialStorage:
    Readonly<Record<string, PhasicFlowLedger>>;
  layerArteriolar: Readonly<
    Record<string, Readonly<Record<string, PhasicFlowLedger>>>
  >;
  coronarySinus: PhasicFlowLedger & Readonly<{
    reverseDurationSec: number;
  }>;
}>;

function validateReport(report: ValidationReport): void {
  if (
    report.schema
      !== "circleheart.main-wire-five-wall-coronary-bounded-validation.v1"
    || report.diagnosticsVersion !== 2
    || report.completed !== true
    || report.beatSummaries.length < 1
    || report.samples.length < 1
    || report.beatSummaries.at(-1)?.summary.phasicCoronaryFlow
      .phaseDefinition.orderedEventPairingAccepted === undefined
    || report.samples.some((sample) =>
      sample.valveOpeningFraction01.MV === undefined)
  ) throw new Error(
    "input is not a completed coronary diagnostics-v2 validation report",
  );
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
