import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const CELL_COLORS = [
  "#43c6ff",
  "#4ed6a6",
  "#ffad57",
  "#d78cff",
  "#6f91ff",
] as const;
const SUMMARY_SCHEMA = "circleheart.coronary-v2-factorial-comparison-summary.v1";
const REPORT_SCHEMA = "circleheart.coronary-v2-terminal-boundary-shadow.v1";
const MEAN_FLOW_GATE = Object.freeze([0.95, 1.05] as const);
const RELATIVE_CLOSURE_GATE = 1e-6;
const PASSIVE_POWER_TOLERANCE = -1e-10;

const summaryPath = requiredPathArgument("--summary");
const inputPaths = inputArguments("--input");
const outputPath = requiredPathArgument("--output");

if ([summaryPath, ...inputPaths].includes(outputPath)) {
  throw new Error("--output must not overwrite an input JSON file");
}

const summaryText = readFileSync(summaryPath, "utf8");
const summary = JSON.parse(summaryText) as FactorialSummary;
validateSummary(summary);
if (inputPaths.length > 0 && inputPaths.length !== summary.rows.length) {
  throw new Error(
    `--input count ${inputPaths.length} does not match summary row count ${summary.rows.length}`,
  );
}

inputPaths.forEach((inputPath, inputIndex) => {
  const sourceText = readFileSync(inputPath, "utf8");
  const report = JSON.parse(sourceText) as ShadowReport;
  validateReport(report, inputPath);
  const expectedRow = summary.rows[inputIndex]!;
  const sha256 = createHash("sha256").update(sourceText).digest("hex");
  if (expectedRow.inputIndex !== inputIndex) {
    throw new Error(`summary row ${inputIndex} has inputIndex=${expectedRow.inputIndex}`);
  }
  if (expectedRow.source.sha256 !== sha256) {
    throw new Error(
      `summary/report hash mismatch at input ${inputIndex}: rerun the compact summarizer`,
    );
  }
  if (
    report.configuration.boundaryFingerprint
      !== expectedRow.provenance.boundaryFingerprint
    || report.configuration.dtSec !== expectedRow.provenance.dtSec
    || report.configuration.cycleLengthSec
      !== expectedRow.provenance.cycleLengthSec
    || report.configuration.phaseDefinition.aorticClosurePhase01
      !== expectedRow.provenance.aorticClosurePhase01
  ) {
    throw new Error(`summary/report provenance mismatch at input ${inputIndex}`);
  }
});

const boundaryFingerprints = new Set(
  summary.rows.map((row) => row.provenance.boundaryFingerprint),
);
if (boundaryFingerprints.size !== 1) {
  throw new Error("factorial cells do not share one terminal-boundary fingerprint");
}
const dtValues = new Set(summary.rows.map((row) => row.provenance.dtSec));
const cycleLengths = new Set(summary.rows.map((row) => row.provenance.cycleLengthSec));
if (dtValues.size !== 1 || cycleLengths.size !== 1) {
  throw new Error("factorial cells do not share dt and cycle length");
}

const cells = summary.rows.map((row, index) => buildCell(row, index));
const numericalPassCount = cells.filter((cell) => cell.gates.numerical).length;
const provisionalCandidate = cells.find((cell) =>
  cell.construction.partition === "60:30:10"
  && nearlyEqual(cell.construction.largeArterialComplianceScale, 0.4)
  && nearlyEqual(cell.construction.c1, 1)
  && nearlyEqual(cell.construction.c2, 1));
if (provisionalCandidate === undefined) {
  throw new Error(
    "summary does not contain the provisional 60:30:10 / Art C 0.4 / C1 1 / C2 1 candidate",
  );
}
const fixedBoundaryStatus = summary.rows.every((row) =>
  row.provenance.claimRole === "fixed-boundary-topology-falsification"
  && row.r1Reference.finalToneMode === "fixed"
  && row.r1Reference.waveformObjectiveUsed === false
  && row.r1Reference.sourceNonInteriorLayerCount === 0
  && row.r1Reference.sourceMaximumRelativeMeanQmTargetError01 <= 1e-3);
const cycleLengthSec = cells[0]!.cycleLengthSec;
const closurePhase01 = cells[0]!.aorticClosurePhase01;

const payload = JSON.stringify({
  cycleLengthSec,
  closurePhase01,
  cells: cells.map((cell) => ({
    id: cell.id,
    label: cell.label,
    shortLabel: cell.shortLabel,
    color: cell.color,
    samples: cell.samples,
  })),
}).replaceAll("<", "\\u003c");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Coronary V2 transport factorial</title>
  <style>
    :root {
      color-scheme: dark;
      --bg:#07101b; --panel:#0c1828; --panel2:#0f1e31; --line:#243650;
      --text:#edf5ff; --muted:#93a6bf; --faint:#667b96; --cyan:#43c6ff;
      --green:#4ed6a6; --orange:#ffad57; --violet:#d78cff; --yellow:#ffd665;
      --red:#ff7887;
    }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--text); background:
      radial-gradient(circle at 18% -5%,#122b47 0,#07101b 39%);
      font:14px/1.48 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    main { width:min(1680px,100%); margin:auto; padding:28px; }
    h1 { margin:0; font-size:clamp(27px,3.2vw,44px); letter-spacing:-.04em; }
    h2 { margin:0; font-size:19px; letter-spacing:-.015em; }
    h3 { margin:0; font-size:14px; }
    p { margin:.45rem 0 0; color:var(--muted); }
    .hero { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
    .status { flex:none; max-width:380px; padding:12px 14px; border:1px solid #735e2e;
      background:#2a230f; color:#ffe29a; border-radius:12px; font-size:12px; font-weight:680; }
    .scope { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:22px 0 14px; }
    .scope article { background:rgba(12,24,40,.9); border:1px solid var(--line);
      border-radius:13px; padding:14px 15px; }
    .scope .value { margin-top:5px; font-size:22px; font-weight:740; letter-spacing:-.035em; }
    .scope .label { color:var(--muted); font-size:12px; }
    .warning { margin:0 0 14px; padding:14px 16px; border:1px solid #514d70;
      border-left:4px solid var(--violet); border-radius:12px; background:#15172b; }
    .warning strong { color:#efe2ff; }
    .card { min-width:0; background:rgba(12,24,40,.91); border:1px solid var(--line);
      border-radius:15px; overflow:hidden; }
    .card > header { padding:16px 18px 0; }
    .table-wrap { overflow:auto; padding:0 4px 8px; }
    table { width:100%; min-width:1440px; border-collapse:collapse; margin-top:12px;
      font-variant-numeric:tabular-nums; }
    th,td { border-top:1px solid var(--line); padding:9px 10px; text-align:right; white-space:nowrap; }
    th { color:var(--muted); font-size:11px; line-height:1.25; font-weight:650; }
    th:first-child,td:first-child { text-align:left; }
    td { font-size:12px; }
    .cell-name { display:flex; align-items:center; gap:8px; font-weight:680; }
    .dot { width:9px; height:9px; border-radius:50%; flex:none; }
    .pass { color:#81e7c5; } .fail { color:#ff9ba5; } .context { color:#bdcbe0; }
    .candidate-row td { background:rgba(78,214,166,.055); }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:14px; }
    .wide { grid-column:1/-1; }
    canvas { display:block; width:100%; height:330px; }
    .small-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1px;
      background:var(--line); margin-top:12px; }
    .small-plot { min-width:0; background:var(--panel); padding-top:10px; }
    .small-plot h3 { padding:0 15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .small-plot canvas { height:270px; }
    .legend { display:flex; flex-wrap:wrap; gap:8px 17px; padding:9px 18px 15px;
      color:var(--muted); font-size:12px; }
    .legend span { white-space:nowrap; }
    .swatch { display:inline-block; width:18px; border-top:2px solid; margin-right:6px;
      transform:translateY(-3px); }
    .interpretation { display:grid; grid-template-columns:1.1fr .9fr; gap:14px; margin-top:14px; }
    .note { padding:18px; }
    .note ul { margin:10px 0 0; padding-left:20px; color:var(--muted); }
    .note li + li { margin-top:8px; }
    .audit table { min-width:1080px; }
    details { margin-top:14px; color:var(--muted); }
    summary { cursor:pointer; color:#c9d8eb; }
    code { color:#d2e4fa; overflow-wrap:anywhere; }
    .foot { margin-top:14px; color:var(--faint); font-size:11px; }
    @media (max-width:1050px) { .scope { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:760px) {
      main { padding:17px; } .hero { display:block; } .status { margin-top:14px; max-width:none; }
      .grid,.interpretation,.small-grid { grid-template-columns:1fr; } .wide { grid-column:auto; }
      .scope { grid-template-columns:1fr 1fr; } canvas { height:290px; }
    }
  </style>
</head>
<body><main>
  <section class="hero"><div>
    <h1>Coronary V2 · resistance–compliance mechanism factorial</h1>
    <p>${cells.length} construction-level cells · one terminal main-wire boundary · SIP + bounded collapse · final fixed-tone waveform isolation</p>
  </div><div class="status">PROVISIONAL FIXED-BOUNDARY CANDIDATE<br>${escapeHtml(provisionalCandidate.shortLabel)}<br>${fixedBoundaryStatus ? "shared boundary and waveform-blind R1 reference confirmed" : "provenance check incomplete"}<br>not canonical</div></section>

  <section class="scope">
    <article><div class="label">Terminal boundary</div><div class="value">shared × ${cells.length}</div><p>fingerprint ${escapeHtml([...boundaryFingerprints][0]!.slice(0, 12))}…</p></article>
    <article><div class="label">Numerical gate</div><div class="value">${numericalPassCount}/${cells.length} pass</div><p>periodicity, passive power, mean-flow construction target</p></article>
    <article><div class="label">Candidate inlet morphology</div><div class="value">D/(D+S) ${format(provisionalCandidate.metrics.ladDiastolicFraction, 3)}</div><p>forward-volume fraction · peak ${format(provisionalCandidate.metrics.ladPeakDelay, 3)} s after AoVC</p></article>
    <article><div class="label">Candidate Q1 fingerprint</div><div class="value">${format(provisionalCandidate.metrics.q1PeakDelay, 3)} s</div><p>first-200-ms share ${format(provisionalCandidate.metrics.q1EarlyShare, 3)}</p></article>
  </section>

  <section class="warning"><strong>The former Qm phase rule is retired.</strong> Qm is the signed transfer between the two intramyocardial compliant reservoirs (C1 → Rm → C2). It is a hidden internal coordinate, not a directly measured tissue-perfusion or epicardial Doppler waveform. Peak delay and early-volume share are retained below only as transfer-function fingerprints; they are not physiological pass/fail gates. Q1, Qm, Q2 and storage must be read together.</section>

  <section class="card"><header><h2>${cells.length}-cell comparison</h2><p>Candidate selection is owned by observable inlet morphology, observation-proximal Q1 morphology, numerical integrity, and retained resistance reserve. Mean flow and mean-Qm ENDO/EPI are construction targets, not waveform evidence. Q2 reverse burden remains an explicit concern because no measurement-site-normalized venous release gate has yet been declared.</p></header>
    <div class="table-wrap"><table><thead><tr>
      <th>cell</th><th>resistance split</th><th>Art C</th><th>C1 / C2</th><th>mean<br>mL/min/g</th><th>LAD inlet forward<br>D/(D+S)</th><th>LAD peak<br>D/S</th><th>LAD peak<br>after AoVC</th>
      <th>Q1 peak /<br>early share</th><th>Qm diagnostic only<br>peak / early share</th><th>Q2 reverse<br>mL / s</th><th>mean-Qm<br>ENDO/EPI</th><th>LAD R1 scale<br>EPI / ENDO</th><th>role</th>
    </tr></thead><tbody>${cells.map(comparisonRowHtml).join("")}</tbody></table></div>
  </section>

  <section class="grid">
    ${overlayPanel("total-inlet", "Total coronary inlet", "Signed total inlet over the retained terminal cycle.", "flow (mL/s)", cells)}
    ${overlayPanel("lad-inlet", "LAD epicardial inlet", "Finite systolic flow remains visible; dashed vertical line is aortic valve closure (AoVC).", "flow (mL/s)", cells)}
    <section class="card wide"><header><h2>LAD subendocardial internal transport</h2><p>Q1 is arteriolar inflow to C1; Qm transfers C1→C2 through Rm; Q2 leaves C2 toward the common venous compartment. Negative values are reverse flow.</p></header>
      <div class="small-grid">${cells.map((cell) => `<article class="small-plot"><h3><span class="dot" style="display:inline-block;background:${cell.color};margin-right:7px"></span>${escapeHtml(cell.shortLabel)}</h3><canvas id="edges-${cell.id}" aria-label="${escapeHtml(cell.label)} Q1 Qm Q2 waveform"></canvas></article>`).join("")}</div>
      <div class="legend"><span><i class="swatch" style="border-color:#43c6ff"></i>Q1 · C1 inflow</span><span><i class="swatch" style="border-color:#ffd665"></i>Qm · internal C1→C2 transfer</span><span><i class="swatch" style="border-color:#d78cff"></i>Q2 · C2 outflow</span><span><i class="swatch" style="border-color:#ff7887;border-top-style:dashed"></i>AoVC</span></div>
    </section>
    <section class="card wide"><header><h2>Driving pressure audit</h2><p>Aortic pressure and the mechanics-derived LAD subendocardial IMP actually supplied to the solver; both are retained in the compact artifact and use mmHg.</p></header>
      <div class="small-grid">${cells.map((cell) => `<article class="small-plot"><h3><span class="dot" style="display:inline-block;background:${cell.color};margin-right:7px"></span>${escapeHtml(cell.shortLabel)}</h3><canvas id="pressure-${cell.id}" aria-label="${escapeHtml(cell.label)} aortic and intramyocardial pressure"></canvas></article>`).join("")}</div>
      <div class="legend"><span><i class="swatch" style="border-color:#43c6ff"></i>Aortic pressure</span><span><i class="swatch" style="border-color:#ffad57"></i>LAD ENDO IMP</span><span><i class="swatch" style="border-color:#ff7887;border-top-style:dashed"></i>AoVC</span></div>
    </section>
  </section>

  <section class="card audit" style="margin-top:14px"><header><h2>Conservation, passivity and solver audit</h2><p>All values refer to the terminal retained cycle. Passive-edge power may approach zero, but must not become negative beyond numerical tolerance.</p></header>
    <div class="table-wrap"><table><thead><tr><th>cell</th><th>max relative<br>periodic drift</th><th>max absolute<br>drift (mL)</th><th>ledger residual<br>(mL)</th><th>minimum passive power<br>(mmHg·mL/s)</th><th>solver residual<br>(mL)</th><th>max Newton<br>iterations</th><th>passivity</th></tr></thead>
    <tbody>${cells.map(auditRowHtml).join("")}</tbody></table></div>
  </section>

  <section class="interpretation">
    <article class="card note"><h2>Gate interpretation</h2><ul>
      <li>${numericalPassCount === cells.length ? `All ${cells.length} cells satisfy` : "Not all cells satisfy"} the declared numerical screen: normalized mean flow ${MEAN_FLOW_GATE[0].toFixed(2)}–${MEAN_FLOW_GATE[1].toFixed(2)} mL/min/g, relative periodic drift ≤ ${RELATIVE_CLOSURE_GATE.toExponential(0)}, and nonnegative passive-edge power within ${Math.abs(PASSIVE_POWER_TOLERANCE).toExponential(0)} tolerance.</li>
      <li>${escapeHtml(provisionalCandidate.shortLabel)} is the provisional fixed-boundary candidate: LAD inlet forward-volume D/(D+S) ${format(provisionalCandidate.metrics.ladDiastolicFraction, 3)}, inlet peak ${format(provisionalCandidate.metrics.ladPeakDelay, 3)} s after AoVC, and LAD ENDO Q1 peak ${format(provisionalCandidate.metrics.q1PeakDelay, 3)} s with first-200-ms share ${format(provisionalCandidate.metrics.q1EarlyShare, 3)}. Its structural LAD R1 scales ${format(provisionalCandidate.metrics.r1Epi, 3)} / ${format(provisionalCandidate.metrics.r1Endo, 3)} remain compatible with retaining resistance reserve.</li>
      <li>Candidate LAD peak D/S is ${format(provisionalCandidate.metrics.ladPeakDiastolicToSystolic, 3)}, below the measurement-context range around 2.0–2.3. Together with the delayed inlet peak, this keeps proximal morphology explicitly unresolved; it is a context metric, not a fitted hard gate.</li>
      <li>Candidate Q2 reverse burden is ${format(provisionalCandidate.metrics.q2ReverseMl, 4)} mL over ${format(provisionalCandidate.metrics.q2ReverseDurationSec, 3)} s. This remains a venous-side diagnostic concern and must be judged against measurement-site-matched experimental morphology before release.</li>
      <li>Qm peak and early-share values (${format(Math.min(...cells.map((cell) => cell.metrics.qmEarlyShare)), 3)}–${format(Math.max(...cells.map((cell) => cell.metrics.qmEarlyShare)), 3)}) distinguish internal time constants only. No Qm value on this page is used as a physiological acceptance criterion.</li>
      <li>All non-candidate rows are mechanism ablations. Cell B is still not canonical: coronary flow reserve requires a separate hyperemic perturbation, and the candidate must survive closed-loop coupling and observable inlet/Q1/Q2 waveform validation.</li>
    </ul></article>
    <article class="card note"><h2>Claim boundary</h2><ul>
      <li>No source feedback: Ao, RA and mechanics-derived IMP are replayed from terminal beat ${summary.rows[0]!.provenance.sourceTerminalBeatIndex} of the same main-wire report.</li>
      <li>R1 was structurally rebased from a mean-Qm-only accepted reference. No waveform objective was used; final tone is fixed at 1.</li>
      <li>No diode, valve gating, inertance or prescribed coronary-flow waveform is added in these cells.</li>
      <li>These ${cells.length} cells isolate resistance partition, large-arterial compliance, and C2 compliance. They do not validate oxygen-demand feedback, stenosis, hyperemia, or closed-loop coronary–systemic interaction.</li>
    </ul></article>
  </section>
  <details><summary>Transient-source provenance</summary><p>The full reports are disposable intermediates. Their paths and hashes remain here as protocol records; rendering uses the compact artifact above.</p><ul>${cells.map((cell) => `<li>${escapeHtml(cell.shortLabel)}: <code>${escapeHtml(cell.sourcePath)}</code> · sha256 <code>${escapeHtml(cell.sourceSha256.slice(0, 16))}…</code></li>`).join("")}</ul></details>
  <p class="foot">Generated from self-contained compact summary <code>${escapeHtml(displayPath(summaryPath))}</code>. Minimal terminal waveforms are retained with source hashes; full intermediate reports are not required to reproduce this HTML.</p>
</main>
<script>
const DATA=${payload};
const STYLE={grid:'#243650',text:'#93a6bf',zero:'#60738d',closure:'#ff7887'};
const EDGE_COLORS={q1:'#43c6ff',qm:'#ffd665',q2:'#d78cff'};
function setup(id){const canvas=document.getElementById(id),d=Math.max(1,window.devicePixelRatio||1),rect=canvas.getBoundingClientRect();canvas.width=Math.round(rect.width*d);canvas.height=Math.round(rect.height*d);const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,d,0,0);return {ctx,w:rect.width,h:rect.height};}
function finite(values){return values.filter(Number.isFinite);}
function envelope(series,forceZero){const values=finite(series.flatMap(s=>s.values));let lo=Math.min(...values),hi=Math.max(...values);if(forceZero){lo=Math.min(0,lo);hi=Math.max(0,hi);}if(!Number.isFinite(lo)||!Number.isFinite(hi)){lo=0;hi=1;}if(Math.abs(hi-lo)<1e-10){hi=lo+1;}const pad=(hi-lo)*.10;return [lo-(lo<0?pad:0),hi+pad];}
function ticks(value){const a=Math.abs(value);return a>=100?value.toFixed(0):a>=10?value.toFixed(1):value.toFixed(2);}
function draw(id,series,yLabel,forceZero=true){const {ctx,w,h}=setup(id),m={l:58,r:16,t:18,b:43},pw=w-m.l,ph=h-m.t,[lo,hi]=envelope(series,forceZero);ctx.font='11px system-ui';ctx.lineWidth=1;ctx.fillStyle=STYLE.text;ctx.strokeStyle=STYLE.grid;
  for(let i=0;i<=4;i++){const f=i/4,y=m.t+ph-f*ph;ctx.beginPath();ctx.moveTo(m.l,y);ctx.lineTo(m.l+pw,y);ctx.stroke();ctx.fillText(ticks(lo+f*(hi-lo)),7,y+4);}
  for(let i=0;i<=5;i++){const f=i/5,x=m.l+f*pw;ctx.beginPath();ctx.moveTo(x,m.t);ctx.lineTo(x,m.t+ph);ctx.stroke();ctx.fillText((f*DATA.cycleLengthSec).toFixed(1),x-8,m.t+ph+20);}
  const y0=m.t+(hi/(hi-lo))*ph;if(lo<=0&&hi>=0){ctx.strokeStyle=STYLE.zero;ctx.beginPath();ctx.moveTo(m.l,y0);ctx.lineTo(m.l+pw,y0);ctx.stroke();}
  const closureX=m.l+DATA.closurePhase01*pw;ctx.strokeStyle=STYLE.closure;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(closureX,m.t);ctx.lineTo(closureX,m.t+ph);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=STYLE.closure;ctx.fillText('AoVC',Math.min(closureX+5,m.l+pw-32),m.t+11);
  series.forEach(s=>{ctx.strokeStyle=s.color;ctx.lineWidth=s.width||2;ctx.globalAlpha=s.alpha??1;ctx.setLineDash(s.dash||[]);ctx.beginPath();s.values.forEach((v,i)=>{const phase=s.phases[i],x=m.l+phase*pw,y=m.t+(hi-v)/(hi-lo)*ph;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();});ctx.globalAlpha=1;ctx.setLineDash([]);ctx.fillStyle=STYLE.text;ctx.fillText('time (s)',m.l+pw/2-20,h-8);ctx.save();ctx.translate(14,m.t+ph/2+30);ctx.rotate(-Math.PI/2);ctx.fillText(yLabel,0,0);ctx.restore();}
function phase(cell){return cell.samples.map(s=>s.phase01);}
function values(cell,key){return cell.samples.map(s=>s[key]);}
function overlay(id,key){draw(id,DATA.cells.map(cell=>({phases:phase(cell),values:values(cell,key),color:cell.color,width:2})), 'flow (mL/s)');}
function render(){overlay('total-inlet','totalInlet');overlay('lad-inlet','ladInlet');DATA.cells.forEach(cell=>{draw('edges-'+cell.id,[{phases:phase(cell),values:values(cell,'q1'),color:EDGE_COLORS.q1},{phases:phase(cell),values:values(cell,'qm'),color:EDGE_COLORS.qm},{phases:phase(cell),values:values(cell,'q2'),color:EDGE_COLORS.q2}], 'flow (mL/s)');const pressure=[{phases:phase(cell),values:values(cell,'ao'),color:'#43c6ff'}];if(cell.samples.some(s=>Number.isFinite(s.imp)))pressure.push({phases:phase(cell),values:values(cell,'imp'),color:'#ffad57'});draw('pressure-'+cell.id,pressure,'pressure (mmHg)',true);});}
let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,90);});render();
</script></body></html>`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html);
process.stdout.write(`${outputPath}\n`);

type ReverseSummary = Readonly<{
  totalVolumeMl: number | null;
  totalDurationSec: number | null;
}>;

type CompactLedger = Readonly<{
  diastolicForwardVolumeFraction01: number | null;
  peakDiastolicToSystolicForwardFlowRatio: number | null;
  diastolicPeakDelayAfterAorticClosureSec: number | null;
  earlyDiastolicForwardVolumeFractionOfDiastole01: number | null;
  reverse: ReverseSummary;
}>;

type SummaryRow = Readonly<{
  inputIndex: number;
  source: Readonly<{ path: string; sha256: string; schema: string; completed: boolean }>;
  provenance: Readonly<{
    claimRole: string;
    sourceTerminalBeatIndex: number;
    boundaryFingerprint: string;
    dtSec: number;
    cycleLengthSec: number;
    aorticClosurePhase01: number;
  }>;
  construction: Readonly<{
    resistancePartitionMode: string;
    largeArterialComplianceScale: number | null;
    intramyocardialComplianceScale: Readonly<{
      c1Proximal: number | null;
      c2Distal: number | null;
    }>;
  }>;
  r1Reference: Readonly<{
    waveformObjectiveUsed: boolean;
    finalToneMode: string;
    sourceMaximumRelativeMeanQmTargetError01: number;
    sourceNonInteriorLayerCount: number;
    structuralScaleByTerritoryLayer: Readonly<Record<"LAD", Readonly<{
      subepicardial: number | null;
      subendocardial: number | null;
    }>>>;
  }>;
  meanFlow: Readonly<{ massNormalizedInletMlPerMinPerG: number | null }>;
  focusEdges: Readonly<{
    inlet: CompactLedger;
    q1: CompactLedger;
    qmInternal: CompactLedger;
    q2: CompactLedger;
  }>;
  endocardialToEpicardialMeanQmInternalRatio: Readonly<Record<"LAD", number | null>>;
  numericalAudit: Readonly<{
    periodicClosure: Readonly<{ maximumAbsoluteMl: number | null; maximumRelative01: number | null }>;
    toneClosure: Readonly<{ maximumAbsoluteLogResistanceScaleChange: number | null }>;
    minimumEdgeDissipatedPowerMmHgMlPerSec: number | null;
    allPassiveEdgesNonnegativePower: boolean | null;
    maximumAbsoluteLedgerResidualMl: number | null;
    maximumNewtonIterations: number | null;
    maximumSolverResidualInfinityNormMl: number | null;
  }>;
  waveformSamples: ReadonlyArray<SummaryWaveformSample>;
}>;

type FactorialSummary = Readonly<{
  schema: string;
  completed: boolean;
  sourceCount: number;
  claim: Readonly<{ sourceWaveformSamplesRetained: boolean; parameterFit: boolean }>;
  rows: ReadonlyArray<SummaryRow>;
}>;

type ShadowReport = Readonly<{
  schema: string;
  completed: boolean;
  configuration: Readonly<{
    cycleLengthSec: number;
    dtSec: number;
    toneMode: string;
    boundaryFingerprint: string;
    phaseDefinition: Readonly<{ aorticClosurePhase01: number }>;
  }>;
  samples: ReadonlyArray<unknown>;
}>;

type SummaryWaveformSample = Readonly<{
  phase01: number;
  totalInlet: number;
  territoryInlet: number;
  q1: number;
  qmInternal: number;
  q2: number;
  ao: number;
  imp: number | null;
}>;

type WaveformSample = Readonly<{
  phase01: number;
  totalInlet: number;
  ladInlet: number;
  q1: number;
  qm: number;
  q2: number;
  ao: number;
  imp: number | null;
}>;

type Cell = Readonly<{
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  sourcePath: string;
  sourceSha256: string;
  cycleLengthSec: number;
  aorticClosurePhase01: number;
  construction: Readonly<{
    partition: string;
    largeArterialComplianceScale: number;
    c1: number;
    c2: number;
  }>;
  metrics: Readonly<{
    meanFlow: number;
    ladDiastolicFraction: number;
    ladPeakDiastolicToSystolic: number;
    ladPeakDelay: number;
    q1PeakDelay: number;
    q1EarlyShare: number;
    qmPeakDelay: number;
    qmEarlyShare: number;
    q2ReverseMl: number;
    q2ReverseDurationSec: number;
    endoEpi: number;
    r1Epi: number;
    r1Endo: number;
  }>;
  audit: Readonly<{
    closureRelative: number;
    closureAbsoluteMl: number;
    ledgerResidualMl: number;
    minPassivePower: number;
    solverResidualMl: number;
    maxNewtonIterations: number;
    passive: boolean;
  }>;
  gates: Readonly<{ numerical: boolean }>;
  samples: ReadonlyArray<WaveformSample>;
}>;

function validateSummary(value: FactorialSummary): void {
  if (
    value.schema !== SUMMARY_SCHEMA
    || value.completed !== true
    || !Number.isInteger(value.sourceCount)
    || value.sourceCount < 4
    || value.rows?.length !== value.sourceCount
    || value.claim?.sourceWaveformSamplesRetained !== true
    || value.claim?.parameterFit !== false
    || value.rows.some((row) => !Array.isArray(row.waveformSamples)
      || row.waveformSamples.length < 4
      || !Number.isFinite(
        row.r1Reference.sourceMaximumRelativeMeanQmTargetError01,
      )
      || !Number.isInteger(row.r1Reference.sourceNonInteriorLayerCount))
  ) {
    throw new Error(`invalid transport-factorial compact summary: ${summaryPath}`);
  }
}

function validateReport(value: ShadowReport, inputPath: string): void {
  if (
    value.schema !== REPORT_SCHEMA
    || value.completed !== true
    || value.configuration?.toneMode !== "fixed"
    || !Number.isFinite(value.configuration?.cycleLengthSec)
    || !Number.isFinite(value.configuration?.phaseDefinition?.aorticClosurePhase01)
    || !Array.isArray(value.samples)
    || value.samples.length < 4
  ) {
    throw new Error(`invalid completed fixed-tone shadow report: ${inputPath}`);
  }
}

function buildCell(row: SummaryRow, index: number): Cell {
  const c1 = finiteOr(row.construction.intramyocardialComplianceScale.c1Proximal, 1);
  const c2 = finiteOr(row.construction.intramyocardialComplianceScale.c2Distal, 1);
  const largeArterialComplianceScale = finiteOr(
    row.construction.largeArterialComplianceScale,
    1,
  );
  const partition = partitionRatio(row.construction.resistancePartitionMode);
  const arterialComplianceLabel = largeArterialComplianceScale === 1
    ? ""
    : ` · Art C ${format(largeArterialComplianceScale, 1)}×`;
  const shortLabel = `${partition}${arterialComplianceLabel} · C2 ${format(c2, 1)}×`;
  const meanFlow = requiredNumber(row.meanFlow.massNormalizedInletMlPerMinPerG, "mean flow");
  const qmPeakDelay = requiredNumber(
    row.focusEdges.qmInternal.diastolicPeakDelayAfterAorticClosureSec,
    "Qm peak delay",
  );
  const qmEarlyShare = requiredNumber(
    row.focusEdges.qmInternal.earlyDiastolicForwardVolumeFractionOfDiastole01,
    "Qm early share",
  );
  const closureRelative = requiredNumber(
    row.numericalAudit.periodicClosure.maximumRelative01,
    "relative closure",
  );
  const minPassivePower = requiredNumber(
    row.numericalAudit.minimumEdgeDissipatedPowerMmHgMlPerSec,
    "minimum passive power",
  );
  const passive = row.numericalAudit.allPassiveEdgesNonnegativePower === true;
  const numerical = meanFlow >= MEAN_FLOW_GATE[0]
    && meanFlow <= MEAN_FLOW_GATE[1]
    && closureRelative <= RELATIVE_CLOSURE_GATE
    && passive
    && minPassivePower >= PASSIVE_POWER_TOLERANCE;
  const sortedSamples = row.waveformSamples
    .map(toWaveformSample)
    .sort((left, right) => left.phase01 - right.phase01);
  const cyclicSamples = [...sortedSamples];
  const first = sortedSamples[0]!;
  if (first.phase01 > 1e-8) {
    cyclicSamples.unshift(Object.freeze({ ...first, phase01: 0 }));
  }
  cyclicSamples.push(Object.freeze({ ...first, phase01: 1 }));
  return Object.freeze({
    id: `cell-${index + 1}`,
    label: `Cell ${String.fromCharCode(65 + index)} · ${partition} · Art C ${format(largeArterialComplianceScale, 1)}× · C1 ${format(c1, 1)}× / C2 ${format(c2, 1)}×`,
    shortLabel: `Cell ${String.fromCharCode(65 + index)} · ${shortLabel}`,
    color: CELL_COLORS[index % CELL_COLORS.length]!,
    sourcePath: row.source.path,
    sourceSha256: row.source.sha256,
    cycleLengthSec: row.provenance.cycleLengthSec,
    aorticClosurePhase01: row.provenance.aorticClosurePhase01,
    construction: Object.freeze({
      partition,
      largeArterialComplianceScale,
      c1,
      c2,
    }),
    metrics: Object.freeze({
      meanFlow,
      ladDiastolicFraction: requiredNumber(row.focusEdges.inlet.diastolicForwardVolumeFraction01, "LAD D fraction"),
      ladPeakDiastolicToSystolic: requiredNumber(
        row.focusEdges.inlet.peakDiastolicToSystolicForwardFlowRatio,
        "LAD peak diastolic-to-systolic ratio",
      ),
      ladPeakDelay: requiredNumber(row.focusEdges.inlet.diastolicPeakDelayAfterAorticClosureSec, "LAD peak delay"),
      q1PeakDelay: requiredNumber(row.focusEdges.q1.diastolicPeakDelayAfterAorticClosureSec, "Q1 peak delay"),
      q1EarlyShare: requiredNumber(row.focusEdges.q1.earlyDiastolicForwardVolumeFractionOfDiastole01, "Q1 early share"),
      qmPeakDelay,
      qmEarlyShare,
      q2ReverseMl: finiteOr(row.focusEdges.q2.reverse.totalVolumeMl, 0),
      q2ReverseDurationSec: finiteOr(row.focusEdges.q2.reverse.totalDurationSec, 0),
      endoEpi: requiredNumber(
        row.endocardialToEpicardialMeanQmInternalRatio.LAD,
        "LAD mean-Qm ENDO/EPI",
      ),
      r1Epi: requiredNumber(row.r1Reference.structuralScaleByTerritoryLayer.LAD.subepicardial, "LAD EPI R1"),
      r1Endo: requiredNumber(row.r1Reference.structuralScaleByTerritoryLayer.LAD.subendocardial, "LAD ENDO R1"),
    }),
    audit: Object.freeze({
      closureRelative,
      closureAbsoluteMl: requiredNumber(row.numericalAudit.periodicClosure.maximumAbsoluteMl, "absolute closure"),
      ledgerResidualMl: requiredNumber(row.numericalAudit.maximumAbsoluteLedgerResidualMl, "ledger residual"),
      minPassivePower,
      solverResidualMl: requiredNumber(row.numericalAudit.maximumSolverResidualInfinityNormMl, "solver residual"),
      maxNewtonIterations: requiredNumber(row.numericalAudit.maximumNewtonIterations, "Newton iterations"),
      passive,
    }),
    gates: Object.freeze({ numerical }),
    samples: Object.freeze(cyclicSamples),
  });
}

function toWaveformSample(sample: SummaryWaveformSample): WaveformSample {
  const phase01 = ((sample.phase01 % 1) + 1) % 1;
  return Object.freeze({
    phase01,
    totalInlet: sample.totalInlet,
    ladInlet: sample.territoryInlet,
    q1: sample.q1,
    qm: sample.qmInternal,
    q2: sample.q2,
    ao: sample.ao,
    imp: sample.imp,
  });
}

function comparisonRowHtml(cell: Cell): string {
  const metric = cell.metrics;
  const candidate = cell.id === provisionalCandidate.id;
  return `<tr class="${candidate ? "candidate-row" : ""}"><td><span class="cell-name"><i class="dot" style="background:${cell.color}"></i>${escapeHtml(cell.label)}</span></td><td>${escapeHtml(cell.construction.partition)}</td><td>${format(cell.construction.largeArterialComplianceScale, 1)}×</td><td>${format(cell.construction.c1, 1)}× / ${format(cell.construction.c2, 1)}×</td><td>${format(metric.meanFlow, 3)}</td><td>${format(metric.ladDiastolicFraction, 3)}</td><td class="context">${format(metric.ladPeakDiastolicToSystolic, 3)}</td><td>${format(metric.ladPeakDelay, 3)} s</td><td>${format(metric.q1PeakDelay, 3)} s / ${format(metric.q1EarlyShare, 3)}</td><td class="context">${format(metric.qmPeakDelay, 3)} s / ${format(metric.qmEarlyShare, 3)}</td><td>${format(metric.q2ReverseMl, 4)} / ${format(metric.q2ReverseDurationSec, 3)}</td><td>${format(metric.endoEpi, 3)}</td><td>${format(metric.r1Epi, 3)} / ${format(metric.r1Endo, 3)}</td><td class="${candidate ? "pass" : "context"}">${candidate ? "provisional fixed-boundary candidate" : "mechanism ablation"}<br>${cell.gates.numerical ? "numerics ✓" : "numerics ×"}</td></tr>`;
}

function auditRowHtml(cell: Cell): string {
  const audit = cell.audit;
  return `<tr><td><span class="cell-name"><i class="dot" style="background:${cell.color}"></i>${escapeHtml(cell.shortLabel)}</span></td><td>${scientific(audit.closureRelative)}</td><td>${scientific(audit.closureAbsoluteMl)}</td><td>${scientific(audit.ledgerResidualMl)}</td><td>${scientific(audit.minPassivePower)}</td><td>${scientific(audit.solverResidualMl)}</td><td>${format(audit.maxNewtonIterations, 0)}</td><td class="${audit.passive ? "pass" : "fail"}">${audit.passive ? "nonnegative ✓" : "violation ×"}</td></tr>`;
}

function overlayPanel(
  id: string,
  title: string,
  description: string,
  unit: string,
  values: ReadonlyArray<Cell>,
): string {
  return `<section class="card"><header><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></header><canvas id="${id}" aria-label="${escapeHtml(title)} waveform comparison"></canvas><div class="legend">${values.map((cell) => `<span><i class="swatch" style="border-color:${cell.color}"></i>${escapeHtml(cell.shortLabel)}</span>`).join("")}<span><i class="swatch" style="border-color:#ff7887;border-top-style:dashed"></i>AoVC</span><span>${escapeHtml(unit)}</span></div></section>`;
}

function partitionRatio(mode: string): string {
  if (mode === "symmetric-60-30-10") return "60:30:10";
  if (mode === "transport-fast-70-15-15") {
    return "low-Rm 70:15:15 ablation";
  }
  if (mode === "low-rm-70-15-15-ablation") {
    return "low-Rm 70:15:15 ablation";
  }
  return mode;
}

function requiredNumber(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`summary is missing ${label}`);
  }
  return value;
}

function finiteOr(value: number | null, fallback: number): number {
  return value !== null && Number.isFinite(value) ? value : fallback;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 1e-9;
}

function format(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function scientific(value: number): string {
  return Number.isFinite(value) ? value.toExponential(2) : "—";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayPath(absolutePath: string): string {
  const relative = path.relative(process.cwd(), absolutePath);
  return relative !== "" && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
    ? relative
    : absolutePath;
}

function inputArguments(flag: string): ReadonlyArray<string> {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== flag) continue;
    const raw = process.argv[index + 1];
    if (raw === undefined || raw.startsWith("--")) {
      throw new Error(`${flag} requires comma-separated paths`);
    }
    raw.split(",").map((entry) => entry.trim()).filter(Boolean)
      .forEach((entry) => values.push(path.resolve(entry)));
  }
  return Object.freeze(values);
}

function requiredPathArgument(flag: string): string {
  const index = process.argv.indexOf(flag);
  const raw = index < 0 ? undefined : process.argv[index + 1];
  if (raw === undefined || raw.startsWith("--")) {
    throw new Error(`${flag} is required`);
  }
  return path.resolve(raw);
}
