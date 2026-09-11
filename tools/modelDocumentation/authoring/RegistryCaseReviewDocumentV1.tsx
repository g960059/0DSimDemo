import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { compile } from "@tailwindcss/node";
import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import type { MainWireStaticCaseFittingResultV1 as Result } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import type { compareMainWireCaseEvidenceV1 } from "@/analysis/methods/mainWire/MainWireCaseComparisonV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { mainWireStandard70TimingAndInletObservationTraceV1 as observationTrace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { MAIN_WIRE_REFERENCE_CONSTRUCTION_MODULE_IDS_V1 as moduleIds,
  MAIN_WIRE_MODEL_MODULES_V1 as modules } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { MAIN_WIRE_EQUATION_SPECIFICATION_V1 as equationSpecification } from "@/studio/presentation/modelDocumentation/MainWireEquationSpecificationV1";
import { resolvedMainWireEquationDataV1 as equationsFor } from "./ResolvedMainWireEquationDataV1";
import { MainWireReadingSettingsV1 } from "./MainWireReadingV1";
import type { MainWireInitialCandidateComparisonV1 } from "@/tools/scientific/MainWireRegistryInitialCandidatesV1";
import { registryCaseNarrativeV1 as narrative } from "./RegistryCaseAssessmentRowsV1";

type Comparison = Awaited<ReturnType<typeof compareMainWireCaseEvidenceV1>>;
type Series = { label: string; color: string; samples: Result["execution"]["diagnostics"]["terminalTrace"] };
const number = (v: unknown) => typeof v === "number" ? Number.isFinite(v) ? Number(v.toPrecision(6)).toString() : "測定不能" : v === null ? "未測定" : String(v);
const detail = (title: string, value: unknown) => <details><summary>{title}</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>;

export function mainWireReviewBeatSamplesV1(d: Result["execution"]["diagnostics"]) {
  // The numerical-cycle terminal trace alone starts after the completed beat's
  // inlet closure. Include the saved preceding window, never a synthesized seam.
  const beat = d.completedBeat;
  return observationTrace(d).filter(p => p.acceptedTimeSec >= beat.startTimeSec - 1e-10 && p.acceptedTimeSec <= beat.endTimeSec + 1e-10);
}

/** Native samples, straight segments, no smoothing/shape gate. Both comparisons
 * share axes. Pressure is transmural for PV and absolute for the time waveform. */
function Plot({ series, side, pv }: { series: Series[]; side: "LV" | "RV"; pv: boolean }) {
  const paths = series.map(s => ({ ...s, points: s.samples.map(p => ({
    x: pv ? p.chamberVolumeMl[side] : p.acceptedTimeSec - s.samples[0]!.acceptedTimeSec,
    y: pv ? p.transmuralPressureMmHg[side] : p.absolutePressureMmHg[side],
  })) }));
  const points = paths.flatMap(p => p.points);
  if (!points.length || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return <p>原波形がないため図は未作成です。</p>;
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(0, ...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
  const x = (v: number) => 55 + 430 * (v - minX) / (maxX - minX || 1);
  const y = (v: number) => 220 - 180 * (v - minY) / (maxY - minY || 1);
  const title = `${side} ${pv ? "PV loop · 経壁圧" : "圧波形 · 心腔内圧"}`;
  return <figure><figcaption>{title}</figcaption><svg viewBox="0 0 520 270" role="img" aria-label={title}>
    {[0, .5, 1].map(f => <g key={f}><line x1="55" x2="485" y1={y(minY + f * (maxY - minY))} y2={y(minY + f * (maxY - minY))} stroke="#ccd5df" />
      <text x="49" y={y(minY + f * (maxY - minY)) + 4} textAnchor="end">{number(minY + f * (maxY - minY))}</text>
      <text x={x(minX + f * (maxX - minX))} y="241" textAnchor="middle">{number(minX + f * (maxX - minX))}</text></g>)}
    <text x="55" y="24">mmHg</text><text x="485" y="261" textAnchor="end">{pv ? "Volume (mL)" : "Time (s)"}</text>
    {paths.map(p => <polyline key={p.label} points={p.points.map(v => `${x(v.x)},${y(v.y)}`).join(" ")} fill="none" stroke={p.color} strokeWidth="2" />)}
  </svg></figure>;
}

/** A reusable case dossier, not a model-specific page or a publication vote.
 * Existing parameter/math components consume this case's resolved construction;
 * no historical case's measurements or completed reviews are copied forward. */
async function createScientificDocument(input: {
  referenceId: string; title: string; description: string; kind: string; context: unknown;
  modelId: string; surface: unknown; assessment: unknown; status: string; issues: readonly string[];
  comparison: Comparison; results: readonly Result[]; previousDiagnostics: unknown | null;
  comparisonOrigin?: "initial-construction" | "historical-input" | "new-construction"; historicalComparison?: Comparison | null;
  candidateInputs: unknown; inputBinding: unknown; sourceFiles: readonly string[];
  initialCandidates?: MainWireInitialCandidateComparisonV1;
  initialResults?: readonly { startId: string; result: Result }[];
}) {
  if (input.comparison.referenceId !== input.referenceId
    || input.results.some(r => r.rest.referenceId !== input.referenceId || r.modelId !== input.modelId)
    || input.initialCandidates && input.initialCandidates.referenceId !== input.referenceId
    || input.initialResults?.some(s => s.result.rest.referenceId !== input.referenceId || s.result.modelId !== input.modelId
      || !input.initialCandidates?.starts.some(c => c.startId === s.startId)))
    throw new Error("Document case or model differs from its observations");
  const result = input.results.find(r => r.nominalDtSec === .002), c = result?.candidateInputs;
  const fixture = c && fixtureFor(c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  const equations = result && c && fixture ? equationsFor(c, result.execution.checkpoint.base, fixture) : null;
  if (equations && fixture) equations.anatomy = { ...equations.anatomy,
    triSeg: { ...equations.anatomy.triSeg, wallGeometryParameters: fixture.staticAnatomy.trisegWalls } };
  const body = { schemaId: "main-wire-registry-case-review-document-v1", identity: { modelId: input.modelId, referenceId: input.referenceId },
    title: input.title, description: input.description, kind: input.kind, status: input.status, issues: input.issues,
    surface: input.surface, caseSpecification: input.context, candidateInputs: input.candidateInputs, inputBinding: input.inputBinding,
    observations: input.results.map(r => ({ modelId: r.modelId, numericalSourceSha256: r.sourceSha256,
      resultSha256: r.resultSha256, nominalDtSec: r.nominalDtSec, initialization: r.initialization,
      cycles: r.execution.completedCycleCount, rest: r.rest, referenceContext: r.referenceContext })),
    qualification: input.assessment, comparison: input.comparison,
    comparisonOrigin: input.comparisonOrigin ?? "historical-input", historicalComparison: input.historicalComparison ?? null,
    initialCandidates: input.initialCandidates ?? null,
    equations, modules: moduleIds.map(id => modules.find(m => m.id === id)!), equationSpecification,
    sourceFiles: input.sourceFiles, historicalSupportingExperiments: "not-revalidated",
    clinicalValidationClaimed: false, publicPromotionAuthorized: false };
  return { ...body, contentSha256: await hash(body) };
}
export async function composeRegistryCaseReviewDocumentV1(input: Parameters<typeof createScientificDocument>[0]) {
  const document = await createScientificDocument(input);
  const result = input.results.find(r => r.nominalDtSec === .002);
  const series: Series[] = [];
  const addSeries = (diagnostics: Result["execution"]["diagnostics"], label: string, color: string) => {
    series.push({ label, color, samples: mainWireReviewBeatSamplesV1(diagnostics) });
  };
  const previousLabel = input.comparisonOrigin === "initial-construction" ? "初期入力" : "引継ぎ元";
  if (input.previousDiagnostics && input.comparison.previous.status === "observed")
    addSeries(input.previousDiagnostics as Result["execution"]["diagnostics"], previousLabel, "#64748b");
  if (result) addSeries(result.execution.diagnostics, "今回 · 2 ms", "#b45309");
  const startSeries = (input.initialResults ?? []).map((s, i) => ({ label: s.startId,
    color: ["#095c91", "#b45309", "#28734c", "#7c3b87"][i % 4]!, samples: mainWireReviewBeatSamplesV1(s.result.execution.diagnostics) }));
  const renderInput = { sourceDossierSha256: document.contentSha256, series, startSeries,
    narrativeJa: result ? narrative(result, "ja") : [] };
  return { document, renderInput, html: renderRegistryCaseReviewDocumentV1(document, renderInput) };
}

/** Layout-only regeneration: use the saved scientific content and plots,
 * including its original interpretation. Never remeasure, qualify or restore. */
export function renderRegistryCaseReviewDocumentV1(document: Awaited<ReturnType<typeof createScientificDocument>>,
  rendering: { sourceDossierSha256: string; series: Series[]; startSeries: Series[]; narrativeJa: readonly string[] }): string {
  if (document.contentSha256 !== rendering.sourceDossierSha256) throw new Error("Saved rendering belongs to another dossier");
  const input = { ...document, ...document.identity, context: document.caseSpecification, assessment: document.qualification };
  const { series, startSeries } = rendering, { equations } = document;
  const previousLabel = input.comparisonOrigin === "initial-construction" ? "初期入力" : "引継ぎ元";
  const starts = input.initialCandidates?.starts ?? [], multipleStarts = starts.length > 1;
  const startMetrics = [...new Set(starts.flatMap(s => s.score.observations.map(o => o.metricId)))];
  return renderToStaticMarkup(<main>
    <header><p>研究候補 · 未公開</p><h1>{input.title}</h1><p>{input.description}</p>
      <p>状態: <strong>{input.status}</strong>。自動確認、症例レビュー、正式採択は別の段階です。</p>
      {rendering.narrativeJa.map((p, i) => <p key={i}>{p}</p>)}</header>
    <nav aria-label="目次"><a href="#assessment">評価</a>{multipleStarts && <a href="#initial-candidates">初期候補</a>}<a href="#comparison">比較</a><a href="#waveforms">原波形</a>
      <a href="#settings">設定</a><a href="#evidence">測定法・根拠</a><a href="#provenance">出自</a></nav>
    <section id="assessment"><h2>評価と未完了項目</h2>
      {input.issues.length ? <ul>{input.issues.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p>自動確認の保留はありません。下記の症例レビューは未完了です。</p>}
      {detail("最終確認・レビュー項目", input.assessment)}
      {detail("各刻みの観測と安静評価（参考警告は必須条件と区別）", document.observations)}
      <p>過去のPV解析・受動力学・操作試験を今回も通過したとは扱いません。この資料だけでは正式採択されません。</p></section>
    {multipleStarts && <section id="initial-candidates"><h2>初期候補の比較</h2>
      <p>実行前に指定した全候補をcold 2/1 msで確認しています。条件を満たす候補を優先し、なければ測定・数値計算に保留のない候補を既存の症例スコアで比較します。同点は指定順です。</p>
      <p>選択した初期候補: <strong>{input.initialCandidates!.selectedStartId}</strong>。探索する場合も起点は一つです。
        初期候補{starts.length}件を症例全体の{input.initialCandidates!.maximumEvaluationsPerCase}件の評価予算に含めています。最終確認は別に記録します。</p>
      <div className="table-scroll"><table><thead><tr><th>候補</th><th>確認結果</th></tr></thead><tbody>
        {starts.map(s => <tr key={s.startId}><th>{s.startId}{s.startId === input.initialCandidates!.selectedStartId ? " · 選択" : ""}</th>
          <td>{s.inputIssue ? "入力保留" : s.assessment?.status === "review-pending" ? "自動確認通過・レビュー待ち"
            : input.initialCandidates!.searchableStartIds.includes(s.startId) ? "症例目標未達・探索可能" : "測定・計算の保留"}</td></tr>)}</tbody></table></div>
      <details><summary>各候補の保留・未達理由</summary>{starts.map(s => {
        const issues = [...new Set([s.inputIssue, ...(s.assessment?.qualification.issues ?? []),
          ...(s.assessment?.caseTargetIssues ?? []), ...s.score.holds].filter(Boolean))];
        return <div key={s.startId}><h3>{s.startId}</h3>{issues.length ? <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>
          : <p>自動確認での保留なし。正式採択ではありません。</p>}</div>;
      })}</details>
      {startMetrics.length > 0 && <details><summary>各候補の観測値（2 ms）</summary><div className="table-scroll"><table>
        <thead><tr><th>測定項目</th>{starts.map(s => <th key={s.startId}>{s.startId}</th>)}</tr></thead>
        <tbody>{startMetrics.map(metric => <tr key={metric}><th>{metric}</th>{starts.map(s => <td key={s.startId}>
          {number(s.score.observations.find(o => o.metricId === metric)?.actual ?? null)}</td>)}</tr>)}</tbody></table></div></details>}
      {startSeries.length > 0 && <details><summary>初期候補の原波形を比較</summary>
        <p>{startSeries.map(s => <span key={s.label} style={{ color: s.color }}>{s.label}　</span>)}</p>
        <p>2 msの保存点を直線で結んだ比較です。波形のない候補は図に描かず、上の表に保留理由を残します。</p>
        <div className="plots">{(["LV", "RV"] as const).flatMap(side => [true, false].map(pv => <Plot key={`${side}-${pv}`} series={startSeries} side={side} pv={pv} />))}</div></details>}
      {detail("全候補の入力・出自・評価と選択規則", input.initialCandidates)}</section>}
    <section id="comparison"><h2>{input.comparisonOrigin === "new-construction" ? "初回構成（比較元なし）"
      : input.comparisonOrigin === "initial-construction" ? "初期入力からの変化" : "同じ測定法による新旧比較"}</h2>
      {input.comparisonOrigin === "new-construction" ? <p>今回は新規症例の初回評価です。引継ぎ元の欠損ではなく、比較する過去の実行結果がありません。</p> : <>
      <p>両方の原データを現行の症例評価法で測り直します。差は記述的な比較で、新しい許容閾値ではありません。入力や刻みも変わった場合、数理モデル変更だけの影響とは解釈できません。</p>
      <p>{previousLabel}: {input.comparison.previous.status} / 今回: {input.comparison.current.status}</p>
      {input.comparison.previous.issue && <p>{previousLabel}: {input.comparison.previous.issue}</p>}
      </>}
      {input.comparison.current.issue && <p>今回: {input.comparison.current.issue}</p>}
      {input.comparison.sameNominalDt === false && <p>注意: 比較する時間刻みが異なります。</p>}
      {input.comparison.rows.length > 0 && <div className="table-scroll"><table><thead><tr><th>測定項目（元の名前・単位）</th><th>{previousLabel}</th><th>今回</th><th>差</th></tr></thead>
        <tbody>{input.comparison.rows.map(row => <tr key={row.metric}><th>{row.metric}</th><td>{number(row.previous)}</td><td>{number(row.current)}</td><td>{number(row.delta)}</td></tr>)}</tbody></table></div>}
      {detail("変更入力と元の評価方法・出自", input.comparison)}
      {input.historicalComparison && detail("引継ぎ元の旧入力・原データとの比較", input.historicalComparison)}</section>
    <section id="waveforms"><h2>原波形とPV loop</h2><p>{series.map(s => <span key={s.label} style={{ color: s.color }}>{s.label}　</span>)}</p>
      <p>受理された点を直線で結んでいます。平滑化や形状の補正はしていません。時間軸は各拍の最初の保存点を0としています。</p>
      <div className="plots">{(["LV", "RV"] as const).flatMap(side => [true, false].map(pv => <Plot key={`${side}-${pv}`} series={series} side={side} pv={pv} />))}</div></section>
    <section id="settings"><h2>この症例の設定</h2>{detail("全入力・引継ぎ時の解釈", { candidateInputs: input.candidateInputs, binding: input.inputBinding })}
      {equations && <MainWireReadingSettingsV1 document={{ moduleIds: document.modules.map(m => m.id), equations }} locale="ja" />}</section>
    <section id="evidence"><h2>測定方法・条件・根拠</h2><p>条件の出典と、その資料が支持する範囲を症例仕様のまま保存しています。健常baselineの条件を他の症例へ転用しません。</p>
      {detail("症例仕様と文献・評価規則", input.context)}{detail("共通モデルの版付き説明モジュール・数式仕様", { modules: document.modules, equationSpecification: document.equationSpecification })}</section>
    <section id="provenance"><h2>出自と保存資料</h2><p>{input.modelId}</p>
      {detail("Surface・解析方法", input.surface)}{detail("参照ファイル", input.sourceFiles)}
      <p>旧checkpointは比較のために復元していません。各症例の実行可能captureは別のbundleに保存され、公開設定は変更しません。</p>
      <p>資料SHA-256: <code>{document.contentSha256}</code></p></section>
  </main>);
}

/** Freeze fonts/styles into the offline dossier; no CDN or runtime dependency. */
export async function registryCaseReviewHtmlV1(body: string) {
  const require = createRequire(import.meta.url), cssPath = require.resolve("katex/dist/katex.min.css");
  let katex = await readFile(cssPath, "utf8");
  const urls = [...new Set([...katex.matchAll(/url\(([^)]+)\)/g)].map(m => m[1]!))];
  for (const url of urls) {
    const name = url.replaceAll(/["']/g, ""), data = await readFile(resolve(dirname(cssPath), name));
    const mime = name.endsWith(".woff2") ? "font/woff2" : name.endsWith(".woff") ? "font/woff" : "font/ttf";
    katex = katex.replaceAll(`url(${url})`, `url(data:${mime};base64,${data.toString("base64")})`);
  }
  const classes = [...new Set([...body.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1]!.split(/\s+/)))];
  const compiler = await compile(await readFile("index.css", "utf8"), { base: process.cwd(), onDependency: () => {} });
  const css = `body{margin:0;background:#fff;color:#172b3b;font:16px/1.7 system-ui,sans-serif}main{max-width:1060px;margin:auto;padding:36px 24px}h1{font-size:2rem}h2{font-size:1.35rem;margin:0 0 16px}h1,h2,h3{font-weight:650}section{padding:32px 0;border-top:1px solid #ccd5df;scroll-margin-top:16px}p{margin:12px 0}nav{display:flex;flex-wrap:wrap;gap:18px;margin:28px 0}a{color:#095c91;text-decoration:underline}details{margin:18px 0}summary{cursor:pointer;font-weight:600}pre{font:12px/1.6 ui-monospace,monospace;max-height:440px;overflow:auto;background:#f4f7fa;padding:14px;white-space:pre-wrap;overflow-wrap:anywhere}.table-scroll{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px;border-bottom:1px solid #dbe2e9}th{font-weight:500}td{font-variant-numeric:tabular-nums}code{overflow-wrap:anywhere}svg text{font:12px system-ui}.plots{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:16px}figure{margin:0}figcaption{font-weight:600}li{margin-left:1.5em;list-style:disc}.text-wb-muted{color:#435c70!important}.text-wb-text{color:#172b3b!important}.bg-wb-panel,.bg-wb-base{background:#f4f7fa!important}.border-wb-line{border-color:#ccd5df!important}`;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>症例の研究候補</title><style>${compiler.build(classes)}\n${katex}\n${css}\nmain{overflow-wrap:anywhere}section,details,.plots>*{min-width:0}table{overflow-wrap:normal}</style></head><body>${body}</body></html>`;
}

export function registryCaseReviewIndexV1(cases: readonly { title: string; status: string; documentFile: string | null;
  initialCandidatesFile?: string | null; registrationProposalFile?: string | null;
  archiveFiles?: { ja: string; en: string } | null; issues: readonly string[] }[]) {
  return renderToStaticMarkup(<main><h1>Registry fitting · 研究候補</h1><p>公開・正式採択は行っていません。</p>
    <ul>{cases.map((c, i) => <li key={i}>{c.documentFile && /^[a-z0-9-]+-document\.json$/.test(c.documentFile)
      ? <a href={c.documentFile.replace(/-document\.json$/, ".html")}>{c.title}</a> : c.title} — {c.status}
      {!c.documentFile && c.initialCandidatesFile && /^[a-z0-9-]+-initial-candidates\.json$/.test(c.initialCandidatesFile)
        && <p><a href={c.initialCandidatesFile}>初期候補・入力と保留理由</a></p>}
      {c.registrationProposalFile && /^[a-z0-9-]+-registration-proposal\.json$/.test(c.registrationProposalFile)
        && <p><a href={c.registrationProposalFile}>登録用資料（1/2レビュー未完了）</a></p>}
      {c.archiveFiles && Object.values(c.archiveFiles).every(f => /^[a-z0-9.-]+-(ja|en)\.html$/.test(f))
        && <p>保存文書: <a href={c.archiveFiles.ja}>日本語</a> · <a href={c.archiveFiles.en}>English</a></p>}
      {c.issues.length > 0 && <p>{c.issues.join(" / ")}</p>}</li>)}</ul>
    <p><a href="report.json">全例の結果・保留理由</a> · <a href="bundle.json">実行用captureと出自</a></p></main>);
}
