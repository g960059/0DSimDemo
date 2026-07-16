import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  BLOOD_COMPARTMENT_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";

const MMHG_TO_PA = 133.322387415;

type Sample = Readonly<{
  absoluteTimeSec: number;
  phaseSec: number;
  bloodVolumesM3: Readonly<Record<string, number>>;
  compartmentAbsolutePressurePa: Readonly<Record<string, number>>;
  allFlowsM3PerSec: Readonly<Record<string, number>>;
}>;

type Waveform = Readonly<{
  waveformId: string;
  cycleIndex: number;
  cycleStartTimeSec: number;
  cycleLengthSec: number;
  nominalDtSec: number;
  samples: readonly Sample[];
  claimBoundary: Readonly<Record<string, unknown>>;
  sourceReportContentSha256: string;
  contentSha256: string;
}>;

type Report = Readonly<{
  config: Readonly<{
    formalPeriodicProtocol: boolean;
  }>;
  terminal: Readonly<{
    formalPeriodicConvergencePass: boolean;
    stageOneGlobalHemodynamicsScreenEligibilityPass: boolean;
    stageOneGlobalHemodynamicsScreenPass: boolean;
    completePhysiologyEnvelopeGateImplemented: false;
    physiologicalValidationPass: false;
  }>;
  metrics: Readonly<Record<string, unknown>>;
  claimBoundary: Readonly<Record<string, unknown>>;
  contentSha256: string;
}>;

type RenderOptions = Readonly<{
  waveformPath: string;
  reportPath: string;
  outputPath: string;
  fragmentOutputPath: string | null;
}>;

export function buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
  waveformUnknown: unknown,
  reportUnknown: unknown,
): string {
  const waveform = validateWaveform(waveformUnknown);
  const report = validateReport(reportUnknown);
  if (waveform.sourceReportContentSha256 !== report.contentSha256) {
    throw new Error("waveform does not bind the supplied report content hash");
  }
  const samples = waveform.samples.map((sample) => ({
    t: round(sample.phaseSec, 6),
    v: mapRecord(sample.bloodVolumesM3, (value) => value * 1e6),
    p: mapRecord(sample.compartmentAbsolutePressurePa, (value) => value / MMHG_TO_PA),
    q: mapRecord(sample.allFlowsM3PerSec, (value) => value * 1e6),
  }));
  const summary = buildSummary(report.metrics);
  const embedded = escapeJsonForScript({
    waveformId: waveform.waveformId,
    samples,
    cycleIndex: waveform.cycleIndex,
    nominalDtMs: waveform.nominalDtSec * 1000,
    formalPeriodicProtocol:
      report.config.formalPeriodicProtocol,
    formalPeriodicConvergencePass:
      report.terminal.formalPeriodicConvergencePass,
    stageOneScreenEligibilityPass:
      report.terminal.stageOneGlobalHemodynamicsScreenEligibilityPass,
    stageOneScreenPass:
      report.terminal.stageOneGlobalHemodynamicsScreenPass,
    summary,
  });
  return `<div id="pe-review-v1" data-fragment-contract="single-root-inline-self-contained-v1" aria-label="Four-chamber physiology envelope waveform review">
  <style>
    #pe-review-v1{--pe-grid:color-mix(in srgb,var(--border,#536174) 58%,transparent);--pe-muted:var(--muted-foreground,#9aa7b8);--pe-fg:var(--foreground,#eef2f7);--pe-bg:var(--background,#0d131d);--pe-c1:var(--viz-series-1,#63b3ff);--pe-c2:var(--viz-series-2,#ff9f5a);--pe-c3:var(--viz-series-3,#72d69c);--pe-c4:var(--viz-series-4,#c59cff);color:var(--pe-fg);background:transparent;font-family:Inter,ui-sans-serif,system-ui,sans-serif;width:100%;}
    #pe-review-v1 *{box-sizing:border-box}
    #pe-review-v1 .pe-status{display:flex;gap:.8rem;align-items:center;flex-wrap:wrap;margin:0 0 .7rem;color:var(--pe-muted)}
    #pe-review-v1 .pe-status strong{color:var(--pe-fg);font-weight:500}
    #pe-review-v1 .pe-warning{color:var(--destructive,#ff7b7b)}
    #pe-review-v1 .pe-claims{margin:.2rem 0 .9rem;padding:.55rem .7rem;border:1px solid var(--pe-grid);border-radius:.35rem;color:var(--pe-muted);font-size:12px;line-height:1.45}
    #pe-review-v1 .pe-claims strong{color:var(--pe-fg);font-weight:500}
    #pe-review-v1 .pe-controls{display:grid;grid-template-columns:minmax(9rem,1fr) 5rem;gap:.7rem;align-items:center;margin:.35rem 0 1rem}
    #pe-review-v1 input[type=range]{width:100%}
    #pe-review-v1 output{font-variant-numeric:tabular-nums;text-align:right;color:var(--pe-fg)}
    #pe-review-v1 .pe-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem 1.25rem}
    #pe-review-v1 .pe-chart{min-width:0}
    #pe-review-v1 .pe-chart h3{font-size:var(--font-size-base,14px);font-weight:500;margin:0 0 .15rem;color:var(--pe-fg)}
    #pe-review-v1 .pe-chart p{font-size:11px;margin:0 0 .2rem;color:var(--pe-muted);min-height:1rem}
    #pe-review-v1 .pe-chart svg{display:block;width:100%;height:auto;overflow:visible}
    #pe-review-v1 .pe-axis,#pe-review-v1 .pe-gridline{stroke:var(--pe-grid);stroke-width:1;vector-effect:non-scaling-stroke}
    #pe-review-v1 .pe-gridline{opacity:.55}
    #pe-review-v1 .pe-tick,#pe-review-v1 .pe-label{fill:var(--pe-muted);font-size:10px}
    #pe-review-v1 .pe-series{fill:none;stroke-width:2;vector-effect:non-scaling-stroke}
    #pe-review-v1 .pe-s0{stroke:var(--pe-c1)} #pe-review-v1 .pe-s1{stroke:var(--pe-c2)} #pe-review-v1 .pe-s2{stroke:var(--pe-c3)} #pe-review-v1 .pe-s3{stroke:var(--pe-c4)}
    #pe-review-v1 .pe-marker{fill:var(--pe-bg);stroke-width:2.5;vector-effect:non-scaling-stroke}
    #pe-review-v1 .pe-cursor{stroke:var(--pe-fg);stroke-width:1;opacity:.38;vector-effect:non-scaling-stroke}
    #pe-review-v1 .pe-legend{display:flex;gap:.6rem;flex-wrap:wrap;color:var(--pe-muted);font-size:11px;min-height:1rem}
    #pe-review-v1 .pe-key::before{content:"";display:inline-block;width:.65rem;height:2px;margin:0 .28rem .2rem 0;background:var(--key)}
    @media(max-width:700px){#pe-review-v1 .pe-grid{grid-template-columns:1fr}}
  </style>
  <div class="pe-status" aria-live="polite">
    <strong id="pe-run-status"></strong>
    <span id="pe-summary"></span>
    <span id="pe-warning" class="pe-warning"></span>
  </div>
  <div class="pe-claims" role="note">
    <strong>Interpretation boundary:</strong>
    atrial PV trajectories are held-out readback only and never enter fitting, ranking, or the Stage-1 screen. They become loops only after period-1 closure. This prospective readback does not claim physiological validation.
  </div>
  <div class="pe-controls">
    <label for="pe-phase">Phase in terminal beat</label>
    <output id="pe-phase-value" for="pe-phase">0 ms</output>
    <input id="pe-phase" type="range" min="0" max="0" step="1" value="0" aria-label="Terminal beat phase sample">
  </div>
  <div class="pe-grid" id="pe-grid"></div>
  <script>
  (()=>{
    const root=document.getElementById('pe-review-v1');
    if(!root)return;
    const data=${embedded};
    const pvTopology=data.formalPeriodicConvergencePass?'PV loop':'PV trajectory';
    const specs=[
      {id:'pv-la',title:'Left atrium '+pvTopology,subtitle:'held-out readback · not a fit target',kind:'pv',x:['v','LA'],ys:[['p','LA']],xLabel:'Volume (mL)',yLabel:'Pressure (mmHg)',labels:['LA']},
      {id:'pv-lv',title:'Left ventricle '+pvTopology,subtitle:'terminal beat',kind:'pv',x:['v','LV'],ys:[['p','LV']],xLabel:'Volume (mL)',yLabel:'Pressure (mmHg)',labels:['LV']},
      {id:'pv-ra',title:'Right atrium '+pvTopology,subtitle:'held-out readback · not a fit target',kind:'pv',x:['v','RA'],ys:[['p','RA']],xLabel:'Volume (mL)',yLabel:'Pressure (mmHg)',labels:['RA']},
      {id:'pv-rv',title:'Right ventricle '+pvTopology,subtitle:'terminal beat',kind:'pv',x:['v','RV'],ys:[['p','RV']],xLabel:'Volume (mL)',yLabel:'Pressure (mmHg)',labels:['RV']},
      {id:'p-left',title:'Left-heart pressures',subtitle:'same time axis',kind:'time',ys:[['p','LA'],['p','LV'],['p','SA'],['p','PV']],xLabel:'Phase (s)',yLabel:'Pressure (mmHg)',labels:['LA','LV','SA','PV']},
      {id:'p-right',title:'Right-heart pressures',subtitle:'same time axis',kind:'time',ys:[['p','RA'],['p','RV'],['p','PA'],['p','SV']],xLabel:'Phase (s)',yLabel:'Pressure (mmHg)',labels:['RA','RV','PA','SV']},
      {id:'q-left',title:'Left valve flows',subtitle:'positive in anatomical direction',kind:'time',ys:[['q','Q_MV'],['q','Q_AoV']],xLabel:'Phase (s)',yLabel:'Flow (mL/s)',labels:['Mitral','Aortic']},
      {id:'q-right',title:'Right valve flows',subtitle:'positive in anatomical direction',kind:'time',ys:[['q','Q_TV'],['q','Q_PuV']],xLabel:'Phase (s)',yLabel:'Flow (mL/s)',labels:['Tricuspid','Pulmonary']},
      {id:'q-venous',title:'Venous inflow',subtitle:'pulmonary vein and vena cava',kind:'time',ys:[['q','Q_PV'],['q','Q_VC']],xLabel:'Phase (s)',yLabel:'Flow (mL/s)',labels:['PV→LA','VC→RA']},
      {id:'q-periphery',title:'Peripheral flows',subtitle:'systemic and pulmonary beds',kind:'time',ys:[['q','Q_sys'],['q','Q_pul']],xLabel:'Phase (s)',yLabel:'Flow (mL/s)',labels:['Systemic','Pulmonary']}
    ];
    const NS='http://www.w3.org/2000/svg',W=520,H=310,M={l:58,r:16,t:12,b:44};
    const grid=root.querySelector('#pe-grid');
    const charts=[];
    const get=(s,key)=>s[key[0]][key[1]];
    const extent=(a)=>{let lo=Math.min(...a),hi=Math.max(...a);if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.07;return[lo-pad,hi+pad]};
    const scale=(d0,d1,r0,r1)=>(x)=>r0+(x-d0)*(r1-r0)/(d1-d0);
    const path=(points)=>points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');
    const el=(name,attrs={})=>{const n=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));return n};
    const text=(svg,x,y,value,klass,anchor='middle')=>{const n=el('text',{x,y,class:klass,'text-anchor':anchor});n.textContent=value;svg.appendChild(n);return n};
    const ticks=(lo,hi,n=4)=>Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n);
    specs.forEach((spec)=>{
      const section=document.createElement('section');section.className='pe-chart';
      const h=document.createElement('h3');h.textContent=spec.title;section.appendChild(h);
      const p=document.createElement('p');p.textContent=spec.subtitle;section.appendChild(p);
      const svg=el('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':spec.title});
      const title=el('title');title.textContent=spec.title;svg.appendChild(title);
      const xValues=spec.kind==='time'?data.samples.map(s=>s.t):data.samples.map(s=>get(s,spec.x));
      const yValues=spec.ys.flatMap(k=>data.samples.map(s=>get(s,k)));
      const [x0,x1]=extent(xValues),[y0,y1]=extent(yValues);
      const sx=scale(x0,x1,M.l,W-M.r),sy=scale(y0,y1,H-M.b,M.t);
      ticks(x0,x1).forEach(v=>{const x=sx(v);svg.appendChild(el('line',{x1:x,y1:M.t,x2:x,y2:H-M.b,class:'pe-gridline'}));text(svg,x,H-M.b+17,Math.abs(v)>=100?v.toFixed(0):v.toFixed(2),'pe-tick')});
      ticks(y0,y1).forEach(v=>{const y=sy(v);svg.appendChild(el('line',{x1:M.l,y1:y,x2:W-M.r,y2:y,class:'pe-gridline'}));text(svg,M.l-7,y+3,Math.abs(v)>=100?v.toFixed(0):v.toFixed(1),'pe-tick','end')});
      svg.appendChild(el('line',{x1:M.l,y1:H-M.b,x2:W-M.r,y2:H-M.b,class:'pe-axis'}));svg.appendChild(el('line',{x1:M.l,y1:M.t,x2:M.l,y2:H-M.b,class:'pe-axis'}));
      text(svg,(M.l+W-M.r)/2,H-8,spec.xLabel,'pe-label');const yl=text(svg,14,(M.t+H-M.b)/2,spec.yLabel,'pe-label');yl.setAttribute('transform','rotate(-90 14 '+((M.t+H-M.b)/2)+')');
      const markers=[];
      spec.ys.forEach((key,j)=>{const points=data.samples.map((s,i)=>[sx(xValues[i]),sy(get(s,key))]);svg.appendChild(el('path',{d:path(points),class:'pe-series pe-s'+j}));const marker=el('circle',{r:4,class:'pe-marker pe-s'+j});svg.appendChild(marker);markers.push(marker)});
      const cursor=el('line',{y1:M.t,y2:H-M.b,class:'pe-cursor'});if(spec.kind==='time')svg.appendChild(cursor);
      section.appendChild(svg);
      const legend=document.createElement('div');legend.className='pe-legend';spec.labels.forEach((label,j)=>{const span=document.createElement('span');span.className='pe-key';span.style.setProperty('--key','var(--pe-c'+(j+1)+')');span.textContent=label;legend.appendChild(span)});section.appendChild(legend);grid.appendChild(section);
      charts.push({spec,sx,sy,xValues,markers,cursor});
    });
    const slider=root.querySelector('#pe-phase'),phaseValue=root.querySelector('#pe-phase-value');slider.max=String(data.samples.length-1);
    const update=(index)=>{const s=data.samples[index];phaseValue.textContent=(s.t*1000).toFixed(0)+' ms';charts.forEach(c=>{c.spec.ys.forEach((key,j)=>{const x=c.sx(c.xValues[index]),y=c.sy(get(s,key));c.markers[j].setAttribute('cx',String(x));c.markers[j].setAttribute('cy',String(y))});if(c.spec.kind==='time'){const x=c.sx(s.t);c.cursor.setAttribute('x1',String(x));c.cursor.setAttribute('x2',String(x))}})};
    slider.addEventListener('input',()=>update(Number(slider.value)));update(0);
    root.querySelector('#pe-run-status').textContent=data.waveformId+' · cycle '+(data.cycleIndex+1)+' · Δt '+data.nominalDtMs.toFixed(2)+' ms';
    root.querySelector('#pe-summary').textContent=data.summary;
    const warnings=[];if(!data.formalPeriodicProtocol)warnings.push('exploratory timestep');if(!data.formalPeriodicConvergencePass)warnings.push('periodicity not established');if(!data.stageOneScreenEligibilityPass)warnings.push('Stage-1 screen ineligible');else if(!data.stageOneScreenPass)warnings.push('Stage-1 screen incomplete');root.querySelector('#pe-warning').textContent=warnings.join(' · ');
  })();
  </script>
</div>`;
}

export function buildPhaseB1PhysiologyEnvelopeStandaloneHtmlV1(
  waveformUnknown: unknown,
  reportUnknown: unknown,
): string {
  const fragment = buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
    waveformUnknown,
    reportUnknown,
  );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Four-chamber physiology envelope review</title>
<style>:root{color-scheme:dark;--background:#0d131d;--foreground:#eef2f7;--muted-foreground:#9aa7b8;--border:#536174;--destructive:#ff8a8a;--viz-series-1:#63b3ff;--viz-series-2:#ff9f5a;--viz-series-3:#72d69c;--viz-series-4:#c59cff}body{margin:0;padding:20px;background:var(--background);color:var(--foreground)}</style>
</head>
<body>
${fragment}
</body>
</html>
`;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const [waveformRaw, reportRaw] = await Promise.all([
    readFile(options.waveformPath, "utf8"),
    readFile(options.reportPath, "utf8"),
  ]);
  const waveform = JSON.parse(waveformRaw) as unknown;
  const report = JSON.parse(reportRaw) as unknown;
  await writeUtf8Atomically(
    options.outputPath,
    buildPhaseB1PhysiologyEnvelopeStandaloneHtmlV1(waveform, report),
  );
  if (options.fragmentOutputPath !== null) {
    await writeUtf8Atomically(
      options.fragmentOutputPath,
      buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(waveform, report),
    );
  }
  process.stdout.write(`${options.outputPath}\n`);
}

function parseArgs(args: readonly string[]): RenderOptions {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!["--waveform", "--report", "--output", "--fragment-output"].includes(flag) || value === undefined) {
      throw new Error("usage: --waveform <json> --report <json> --output <html> [--fragment-output <html>]");
    }
    if (values.has(flag)) throw new Error(`${flag} may be specified only once`);
    values.set(flag, value);
  }
  for (const required of ["--waveform", "--report", "--output"]) {
    if (!values.has(required)) throw new Error(`${required} is required`);
  }
  const options = Object.freeze({
    waveformPath: path.resolve(values.get("--waveform")!),
    reportPath: path.resolve(values.get("--report")!),
    outputPath: path.resolve(values.get("--output")!),
    fragmentOutputPath: values.has("--fragment-output")
      ? path.resolve(values.get("--fragment-output")!)
      : null,
  });
  const sourcePaths = new Set([options.waveformPath, options.reportPath]);
  const destinationPaths = [
    options.outputPath,
    ...(options.fragmentOutputPath === null ? [] : [options.fragmentOutputPath]),
  ];
  if (
    destinationPaths.some((destination) => sourcePaths.has(destination))
    || new Set(destinationPaths).size !== destinationPaths.length
  ) throw new Error("input, standalone output, and fragment output paths must be distinct");
  return options;
}

async function writeUtf8Atomically(outputPath: string, content: string): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

function validateWaveform(value: unknown): Waveform {
  const waveform = requirePlainRecord(value, "waveform");
  assertHasValidCanonicalContentHash(waveform, "waveform");
  requireCanonicalSha256(
    waveform.sourceReportContentSha256,
    "waveform.sourceReportContentSha256",
  );
  requireNonEmptyString(waveform.waveformId, "waveform.waveformId");
  const cycleIndex = requireNonNegativeInteger(
    waveform.cycleIndex,
    "waveform.cycleIndex",
  );
  const cycleStartTimeSec = requireFiniteNumber(
    waveform.cycleStartTimeSec,
    "waveform.cycleStartTimeSec",
  );
  const cycleLengthSec = requirePositiveFiniteNumber(
    waveform.cycleLengthSec,
    "waveform.cycleLengthSec",
  );
  requirePositiveFiniteNumber(waveform.nominalDtSec, "waveform.nominalDtSec");
  validateReviewClaimBoundary(waveform.claimBoundary, "waveform.claimBoundary");
  if (!Array.isArray(waveform.samples) || waveform.samples.length < 2) {
    throw new Error("waveform.samples must contain at least two points");
  }
  for (const [index, sample] of waveform.samples.entries()) {
    const sampleRecord = requirePlainRecord(sample, `waveform.samples[${index}]`);
    const absoluteTimeSec = requireFiniteNumber(
      sampleRecord.absoluteTimeSec,
      `waveform.samples[${index}].absoluteTimeSec`,
    );
    const phaseSec = requireNonNegativeFiniteNumber(
      sampleRecord.phaseSec,
      `waveform.samples[${index}].phaseSec`,
    );
    if (!approximatelyEqual(phaseSec, absoluteTimeSec - cycleStartTimeSec)) {
      throw new Error(`waveform.samples[${index}] phase and absolute time disagree`);
    }
    if (phaseSec > cycleLengthSec
      && !approximatelyEqual(phaseSec, cycleLengthSec)) {
      throw new Error(`waveform.samples[${index}].phaseSec exceeds the cycle`);
    }
    if (index > 0) {
      const previous = requirePlainRecord(
        waveform.samples[index - 1],
        `waveform.samples[${index - 1}]`,
      );
      if (
        !(absoluteTimeSec > requireFiniteNumber(
          previous.absoluteTimeSec,
          `waveform.samples[${index - 1}].absoluteTimeSec`,
        ))
        || !(phaseSec > requireFiniteNumber(
          previous.phaseSec,
          `waveform.samples[${index - 1}].phaseSec`,
        ))
      ) throw new Error("waveform samples must be strictly chronological");
    }
    validateCanonicalFiniteRecord(
      sampleRecord.bloodVolumesM3,
      BLOOD_COMPARTMENT_IDS,
      `waveform.samples[${index}].bloodVolumesM3`,
      true,
    );
    validateCanonicalFiniteRecord(
      sampleRecord.compartmentAbsolutePressurePa,
      BLOOD_COMPARTMENT_IDS,
      `waveform.samples[${index}].compartmentAbsolutePressurePa`,
      false,
    );
    validateCanonicalFiniteRecord(
      sampleRecord.allFlowsM3PerSec,
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
      `waveform.samples[${index}].allFlowsM3PerSec`,
      false,
    );
  }
  const first = requirePlainRecord(waveform.samples[0], "waveform.samples[0]");
  const last = requirePlainRecord(
    waveform.samples[waveform.samples.length - 1],
    `waveform.samples[${waveform.samples.length - 1}]`,
  );
  if (
    !approximatelyEqual(requireFiniteNumber(first.phaseSec, "first phase"), 0)
    || !approximatelyEqual(
      requireFiniteNumber(last.phaseSec, "last phase"),
      cycleLengthSec,
    )
  ) {
    throw new Error("waveform must cover one complete cycle from phase 0 to cycleLengthSec");
  }
  if (cycleIndex < 0) throw new Error("waveform.cycleIndex must be non-negative");
  return value as Waveform;
}

function validateReport(value: unknown): Report {
  const report = requirePlainRecord(value, "report");
  assertHasValidCanonicalContentHash(report, "report");
  const config = requirePlainRecord(report.config, "report.config");
  const terminal = requirePlainRecord(report.terminal, "report.terminal");
  const metrics = requirePlainRecord(report.metrics, "report.metrics");
  const sourceCodeEvidence = requirePlainRecord(
    report.sourceCodeEvidence,
    "report.sourceCodeEvidence",
  );
  if (
    sourceCodeEvidence.evidenceId
      !== "phase-b1-physiology-envelope-source-code-evidence-v1"
    || sourceCodeEvidence.canonicalObjectHashAlgorithm
      !== "sha256-canonical-json-v1"
    || sourceCodeEvidence.sourceFileHashAlgorithm !== "sha256-file-bytes-v1"
    || sourceCodeEvidence.repositoryCommitIdentityClaimed !== false
  ) throw new Error("report source-code evidence contract is invalid");
  requireCanonicalSha256(
    sourceCodeEvidence.targetPackCanonicalContentSha256,
    "report.sourceCodeEvidence.targetPackCanonicalContentSha256",
  );
  requireCanonicalSha256(
    sourceCodeEvidence.protocolCanonicalContentSha256,
    "report.sourceCodeEvidence.protocolCanonicalContentSha256",
  );
  const sourceFileSha256 = requirePlainRecord(
    sourceCodeEvidence.sourceFileSha256,
    "report.sourceCodeEvidence.sourceFileSha256",
  );
  const sourceFileKeys = [
    "caseBuilder",
    "protocol",
    "targetPack",
    "metrics",
    "runner",
  ] as const;
  if (
    Object.keys(sourceFileSha256).sort().join("\0")
      !== [...sourceFileKeys].sort().join("\0")
  ) throw new Error("report source-code evidence file keys are invalid");
  for (const key of sourceFileKeys) {
    requireCanonicalSha256(
      sourceFileSha256[key],
      `report.sourceCodeEvidence.sourceFileSha256.${key}`,
    );
  }
  validateReviewClaimBoundary(report.claimBoundary, "report.claimBoundary");
  for (const [field, observed] of [
    ["report.config.formalPeriodicProtocol", config.formalPeriodicProtocol],
    [
      "report.terminal.formalPeriodicConvergencePass",
      terminal.formalPeriodicConvergencePass,
    ],
    [
      "report.terminal.stageOneGlobalHemodynamicsScreenEligibilityPass",
      terminal.stageOneGlobalHemodynamicsScreenEligibilityPass,
    ],
    [
      "report.terminal.stageOneGlobalHemodynamicsScreenPass",
      terminal.stageOneGlobalHemodynamicsScreenPass,
    ],
  ] as const) {
    if (typeof observed !== "boolean") throw new Error(`${field} must be boolean`);
  }
  if (terminal.physiologicalValidationPass !== false) {
    throw new Error("report must explicitly decline physiological validation");
  }
  if (terminal.completePhysiologyEnvelopeGateImplemented !== false) {
    throw new Error("report must not claim a complete physiology-envelope gate");
  }
  const pvHoldout = requirePlainRecord(
    metrics.atrialPvLoopMorphology,
    "report.metrics.atrialPvLoopMorphology",
  );
  if (
    pvHoldout.status
      !== "held-out-not-evaluated-by-operating-point-metrics"
    || pvHoldout.selectable !== false
    || pvHoldout.contributesToNormalTargetGate !== false
    || pvHoldout.contributesToScalarScore !== false
  ) throw new Error("report atrial PV-loop held-out contract is invalid");
  const metricsClaim = requirePlainRecord(
    metrics.claimBoundary,
    "report.metrics.claimBoundary",
  );
  if (
    metricsClaim.physiologicalValidationClaimed !== false
    || metricsClaim.atrialPvShapeFittingPerformed !== false
    || metricsClaim.atrialPvMorphologyCanSelectCandidate !== false
    || metricsClaim.stageOneHardCardiacOutputUsesSignedValveFlowIntegral !== true
    || metricsClaim.chamberVolumeAndEjectionFractionAreStageTwoSupportiveReadback
      !== true
    || metricsClaim.fixedFillingWindowReadbackIsSecondary !== true
    || metricsClaim.fixedFillingWindowClinicalDopplerMappingValidated !== false
    || metricsClaim.fixedFillingWindowReadbackContributesToGate !== false
  ) throw new Error("report metrics claim boundary is invalid");
  const normalTargetGate = requirePlainRecord(
    metrics.normalTargetGate,
    "report.metrics.normalTargetGate",
  );
  if (
    normalTargetGate.scalarScoreComputed !== false
    || normalTargetGate.candidateRankingPerformed !== false
    || typeof normalTargetGate.inputEligibilityPass !== "boolean"
    || typeof normalTargetGate.physiologyBandComparisonsAreProvisional
      !== "boolean"
  ) throw new Error("report must not score or rank physiology candidates");
  const expectedStageOneEligibility = config.formalPeriodicProtocol === true
    && terminal.formalPeriodicConvergencePass === true
    && normalTargetGate.inputEligibilityPass === true;
  if (
    terminal.stageOneGlobalHemodynamicsScreenEligibilityPass
      !== expectedStageOneEligibility
    || (terminal.stageOneGlobalHemodynamicsScreenPass === true
      && !expectedStageOneEligibility)
    || (expectedStageOneEligibility === false
      && normalTargetGate.physiologyBandComparisonsAreProvisional !== true)
  ) throw new Error("report Stage-1 eligibility and provisional-readback flags disagree");
  return value as Report;
}

function buildSummary(metrics: Record<string, unknown>): string {
  const pressure = optionalPlainRecord(metrics.pressureByCompartment);
  const circulation = optionalPlainRecord(metrics.circulation);
  const volume = optionalPlainRecord(metrics.volumeByChamber);
  if (pressure === null || circulation === null || volume === null) return "";
  const left = optionalPlainRecord(circulation.left);
  const right = optionalPlainRecord(circulation.right);
  const lv = optionalPlainRecord(volume.LV);
  const rv = optionalPlainRecord(volume.RV);
  const mmHg = (pa: unknown) => typeof pa === "number" ? pa / MMHG_TO_PA : null;
  return [
    `L/R signed CO ${number(left?.signedOutflowCardiacOutputLPerMin, 2)}/${number(right?.signedOutflowCardiacOutputLPerMin, 2)} L/min`,
    `MAP ${number(mmHg(recordField(pressure, "SA", "timeWeightedMeanPa")), 1)} mmHg`,
    `LAP ${number(mmHg(recordField(pressure, "LA", "timeWeightedMeanPa")), 1)} mmHg`,
    `RAP ${number(mmHg(recordField(pressure, "RA", "timeWeightedMeanPa")), 1)} mmHg`,
    `mPAP ${number(mmHg(recordField(pressure, "PA", "timeWeightedMeanPa")), 1)} mmHg`,
    `L/R EF ${percent(lv?.ejectionFractionFromExtrema)}/${percent(rv?.ejectionFractionFromExtrema)}`,
  ].join(" · ");
}

function number(value: unknown, digits: number): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function percent(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${(100 * value).toFixed(0)}%`
    : "n/a";
}

function recordField(
  record: Readonly<Record<string, unknown>>,
  recordKey: string,
  field: string,
): unknown {
  return optionalPlainRecord(record[recordKey])?.[field];
}

function mapRecord(
  value: Readonly<Record<string, number>>,
  transform: (value: number) => number,
): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(
    Object.entries(value).map(([key, numberValue]) => [key, round(transform(numberValue), 7)]),
  ));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function validateReviewClaimBoundary(value: unknown, field: string): void {
  const boundary = requirePlainRecord(value, field);
  if (
    boundary.stageOneGlobalHemodynamicsScreenIsProspectiveOnly !== true
    || boundary.physiologyBandClassificationRequiresFormalPeriodOne !== true
    || typeof boundary.stageOneGlobalHemodynamicsScreenEligibilityPass
      !== "boolean"
    || boundary.completePhysiologyEnvelopeGateImplemented !== false
    || boundary.physiologicalValidationPass !== false
    || boundary.atrialPvLoopHeldOutFromSelection !== true
  ) throw new Error(`${field} does not preserve the review-only claim boundary`);
}

function validateCanonicalFiniteRecord<K extends string>(
  value: unknown,
  expectedKeys: readonly K[],
  field: string,
  nonNegative: boolean,
): void {
  const record = requirePlainRecord(value, field);
  const actualKeys = Object.keys(record).sort();
  const canonicalKeys = [...expectedKeys].sort();
  if (
    actualKeys.length !== canonicalKeys.length
    || actualKeys.some((key, index) => key !== canonicalKeys[index])
  ) throw new Error(`${field} must contain the exact canonical keys`);
  for (const key of expectedKeys) {
    const observed = requireFiniteNumber(record[key], `${field}.${key}`);
    if (nonNegative && observed < 0) {
      throw new Error(`${field}.${key} must be non-negative`);
    }
  }
}

function requirePlainRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (!isPlainRecord(value)) throw new Error(`${field} must be a plain record`);
  return value;
}

function optionalPlainRecord(value: unknown): Record<string, unknown> | null {
  return isPlainRecord(value) ? value : null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requireCanonicalSha256(value: unknown, field: string): string {
  const resolved = requireNonEmptyString(value, field);
  if (!/^[0-9a-f]{64}$/.test(resolved)) {
    throw new Error(`${field} must be a lowercase SHA-256 hex digest`);
  }
  return resolved;
}

function assertHasValidCanonicalContentHash(
  record: Record<string, unknown>,
  field: string,
): void {
  const contentSha256 = requireCanonicalSha256(
    record.contentSha256,
    `${field}.contentSha256`,
  );
  const { contentSha256: _omitted, ...payload } = record;
  assertCanonicalSha256(payload, contentSha256, sha256, `${field}.contentSha256`);
}

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8).digest("hex");
}

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFiniteNumber(value: unknown, field: string): number {
  const observed = requireFiniteNumber(value, field);
  if (observed < 0) throw new Error(`${field} must be non-negative`);
  return observed;
}

function requirePositiveFiniteNumber(value: unknown, field: string): number {
  const observed = requireFiniteNumber(value, field);
  if (!(observed > 0)) throw new Error(`${field} must be positive`);
  return observed;
}

function requireNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer`);
  }
  return value;
}

function approximatelyEqual(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= 64 * Number.EPSILON * scale;
}

function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
