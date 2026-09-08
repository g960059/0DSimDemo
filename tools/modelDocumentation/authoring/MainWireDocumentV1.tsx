import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { homeHref } from "@/homeLinks";
import type { Locale } from "@/localeRouting";
import { MAIN_WIRE_MODEL_MODULES_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { mainWireBaselineRowsV1, type MainWireBaselineSnapshotV1,
  baselineNumberV1 as number, baselineUnitV1 as unit, BASELINE_ROLE_LABELS_V1,
  BASELINE_STATUS_LABELS_V1, type BaselineDocumentationRowV1 } from "@/studio/presentation/modelDocumentation/MainWireBaselineDocumentationV1";
import { baselineDocumentationGroupV1 } from "@/studio/presentation/modelDocumentation/MainWireBaselineDocumentationV1";
import { resolveStudioItemPresentationV1 } from "@/studio/presentation/StudioItemPresentationCatalogV1";
import { MainWireDetailedCircuitV1, MainWireModuleEquationDetailsV1, MainWireAssemblyAndInitialStateV1, type MainWireEquationDataV1 } from "./MainWireEquationDetailsV1";
import { ModelEquationV1 as Equation, ModelInlineMathV1 as InlineMath, ModelMathLabelV1 as MathLabel } from "@/components/model/ModelMathV1";

const text = (locale: Locale, ja: string, en: string) => locale === "ja" ? ja : en;
const paragraph = "text-sm leading-7 text-wb-muted";
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent";
const section = "scroll-mt-4 border-t border-wb-line pt-9";
const parameterNumber = (value: number) => new Intl.NumberFormat("en", { maximumSignificantDigits: 8 }).format(value);
const materialMeaning: Record<string, string> = {
  kTRPN: "Caとトロポニンの結合・解離の速度係数", nTRPN: "Ca結合の協同性の指数",
  CaT50Ref: "Ca感受性の基準濃度", ku: "結合可能状態への遷移速度係数",
  nTm: "薄いフィラメントの活性化に関わる協同性の指数", TRPN50: "活性化の基準となるCa結合割合",
  kuw: "非結合から弱結合への遷移速度", kws: "弱結合から強結合への遷移速度",
  rw: "弱結合割合の基準", rs: "強結合割合の基準", gammaS: "強結合の歪み依存離脱係数",
  gammaW: "弱結合の歪み依存離脱係数", phi: "歪み緩和の速度倍率", Aeff: "短縮速度が結合歪みに及ぼす係数",
  beta0: "筋長による張力変化の係数", beta1: "筋長によるCa感受性変化の係数",
  Tref: "能動張力の基準応力", temperatureK: "原著の実験温度の条件",
};
function controlLabel(id: string, locale: Locale) {
  const resolved = resolveStudioItemPresentationV1({ kind: "control", itemId: id, fallbackEnglishLabel: id, locale });
  if (resolved.label !== id) return resolved.label;
  const pericardium: Record<string, string> = {
    "pericardium.reference-capacity-scale": text(locale, "心膜の基準容量の倍率", "Pericardial reference capacity scale"),
    "pericardium.pressure-scale": text(locale, "心膜圧の倍率", "Pericardial pressure scale"),
    "pericardium.exponential-stiffness-scale": text(locale, "心膜の指数的硬さの倍率", "Pericardial exponential stiffness scale"),
    "pericardium.prescribed-fluid-volume-ml": text(locale, "心嚢液量", "Pericardial fluid volume"),
  };
  if (pericardium[id]) return pericardium[id];
  const diameter = /^coronary\.focal-diameter-loss-fraction\.(LAD|LCx|RCA)$/.exec(id);
  if (diameter) return `${diameter[1]} ${text(locale, "局所狭窄の直径減少率", "focal diameter loss fraction")}`;
  const resistance = /^coronary\.structural-(r1|rm)-resistance-scale\.(LAD|LCx|RCA)\.(subepicardial|subendocardial)$/.exec(id);
  if (resistance) return `${resistance[2]} · ${resistance[3] === "subepicardial" ? text(locale, "心外膜側", "subepicardial") : text(locale, "心内膜側", "subendocardial")} · ${resistance[1] === "r1" ? text(locale, "流入側抵抗の倍率", "inlet resistance scale") : text(locale, "微小血管抵抗の倍率", "microvascular resistance scale")}`;
  return resolved.label;
}
function Detail({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return <details className="group mt-3 rounded-lg border border-wb-line">
    <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-4 py-2 text-sm text-wb-text ${focus}`}>
      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />{title}
    </summary>
    <div className="border-t border-wb-line px-4 py-4">{children}</div>
  </details>;
}

function CirculationDiagram({ locale }: { locale: Locale }) {
  const title = text(locale, "左右の心臓と、体循環・肺循環が一つの回路を作る", "The heart connects systemic and pulmonary circulation in one circuit");
  const nodes = [
    { x: 45, y: 30, label: "LA", sub: text(locale, "左房", "Left atrium") },
    { x: 230, y: 30, label: "LV", sub: text(locale, "左室", "Left ventricle") },
    { x: 415, y: 30, label: "Ao → SA", sub: text(locale, "体循環", "Systemic vessels") },
    { x: 415, y: 160, label: "RA", sub: text(locale, "右房", "Right atrium") },
    { x: 230, y: 160, label: "RV", sub: text(locale, "右室", "Right ventricle") },
    { x: 45, y: 160, label: "PA → PVn", sub: text(locale, "肺循環", "Pulmonary vessels") },
  ];
  return <figure className="my-6 rounded-xl border border-wb-line bg-wb-panel p-3 sm:p-5">
    <svg viewBox="0 0 600 270" role="img" aria-label={title} className="mx-auto w-full max-w-2xl text-wb-muted">
      <defs><marker id="model-flow-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="currentColor" /></marker></defs>
      <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#model-flow-arrow)">
        <path d="M175 65 H225" /><path d="M360 65 H410" /><path d="M480 100 V155" />
        <path d="M415 195 H365" /><path d="M230 195 H180" /><path d="M110 160 V105" />
      </g>
      {nodes.map(n => <g key={n.label}>
        <rect x={n.x} y={n.y} width="130" height="70" rx="10" className="fill-wb-app stroke-wb-line" />
        <text x={n.x + 65} y={n.y + 28} textAnchor="middle" fontSize="17" className="fill-wb-text">{n.label}</text>
        <text x={n.x + 65} y={n.y + 52} textAnchor="middle" fontSize="13" fill="currentColor">{n.sub}</text>
      </g>)}
      <g fontSize="12" fill="currentColor" textAnchor="middle">
        <text x="200" y="53">MV</text><text x="390" y="53">AV</text>
        <text x="390" y="219">TV</text><text x="201" y="219">PV</text>
        <text x="300" y="134">{text(locale, "LV ↔ 中隔 ↔ RV", "LV ↔ septum ↔ RV")}</text>
      </g>
    </svg>
    <figcaption className="text-xs leading-6 text-wb-subtle">{text(locale,
      "接続の概念図。各血管系をまとめており、冠循環・外圧・細かな血管区画は省略しています。PVは肺動脈弁、PVnは肺静脈を示します。",
      "Connection schematic, grouping vessel compartments and omitting coronary branches and external pressures. PV denotes the pulmonary valve; PVn denotes pulmonary veins.")}</figcaption>
  </figure>;
}

function BaselineRow({ row, locale }: { row: BaselineDocumentationRowV1; locale: Locale }) {
  const first = row.ranges[0];
  const range = (r: typeof first) => row.unit === "bool" ? text(locale, "条件成立", "Criteria met")
    : `${r.lower == null ? "≤ " : `${number(r.lower, row.unit)} – `}${r.upper == null ? "∞" : number(r.upper, row.unit)}`;
  const displayValue = row.unit === "bool" && row.value !== null
    ? text(locale, row.value === 1 ? "条件成立" : "不成立", row.value === 1 ? "Met" : "Not met")
    : number(row.value, row.unit);
  return <details className="group border-b border-wb-line" data-metric-id={row.id} data-status={row.status}>
    <summary className={`grid min-h-14 cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded px-3 py-3 sm:grid-cols-[1.25fr_1fr_1fr_1fr] ${focus}`}>
      <span className="flex items-center gap-2 text-sm font-medium"><ChevronRight className="h-3 w-3 shrink-0 text-wb-subtle transition-transform group-open:rotate-90" aria-hidden="true" />{row.label}</span>
      <span className="text-right text-sm tabular-nums">{displayValue} <span className="text-xs text-wb-subtle">{unit(row.unit)}</span></span>
      <span className="pl-5 text-xs tabular-nums text-wb-subtle sm:pl-0 sm:text-right">{first ? range(first) : text(locale, "数値範囲なし", "No numeric interval")}</span>
      <span className={`text-right text-xs ${row.status === "warning" || row.status === "failed" ? "text-amber-400" : "text-wb-muted"}`}>
        {BASELINE_STATUS_LABELS_V1[locale][row.status]}{row.status === "reference" ? "" : ` · ${BASELINE_ROLE_LABELS_V1[locale][row.role]}`}
      </span>
    </summary>
    <div className="space-y-3 bg-wb-panel px-4 py-4">
      <h4 className="text-xs font-medium">{text(locale, "測定方法", "Measurement")}</h4>
      <p className={paragraph}>{row.meaning}</p>
      <ul className="space-y-2 text-xs leading-6 text-wb-muted">{row.ranges.map((r, i) => <li key={i}>
        {r.label}: <span className="tabular-nums text-wb-text">{range(r)} {unit(row.unit)}</span>
      </li>)}</ul>
      <h4 className="text-xs font-medium">{text(locale, "範囲の根拠と読み方", "Rationale and interpretation")}</h4>
      <p className={paragraph}>{row.rationale}</p>
      {row.sources.length === 0 ? <p className="text-xs leading-6 text-wb-subtle">{text(locale,
        "この数値を正常範囲として支持する一次文献は登録されていません。設計上の検査・参考として区別しています。",
        "No primary source establishes this cutoff as a normal range. It remains a design check or context.")}</p>
        : <ul className="space-y-2 text-xs leading-6">{row.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer" className={`text-wb-accent underline underline-offset-4 ${focus}`}>{s.title}</a><span className="block text-wb-subtle">{s.locator}</span></li>)}</ul>}
    </div>
  </details>;
}

export type MainWireDocumentContentV1 = MainWireBaselineSnapshotV1 & {
  title: string; moduleIds: readonly string[]; equations: MainWireEquationDataV1;
  copy: { release: Record<Locale, string>; changes: Record<Locale, string>; provenance: Record<Locale, string>;
    assessment: Record<Locale, string>; records: readonly Record<Locale, string>[] };
  analysisMethods: readonly string[];
};

/** Mint-time authoring only. The reader never imports this template. */
export function MainWireDocumentV1({ document: doc, locale, recordIndex = 0 }: { document: MainWireDocumentContentV1; locale: Locale; recordIndex?: 0 | 1 }) {
const reserveRules = doc.admission.reserve.responses[0];
const reserveFloor = (field: string) => {
  const rule = [...reserveRules.margins, ...reserveRules.ratioMargins].find(r => r.field === field);
  if (!rule) throw new Error(`Missing saved reserve threshold: ${field}`);
  return rule.floor;
};

  const root = React.useRef<HTMLElement>(null);
  const grid = recordIndex;
  const o = doc.observations[grid];
  const rows = mainWireBaselineRowsV1(doc, grid, locale);
  const warn = rows.filter(r => r.status === "warning");
  const hemo = doc.fixtureIdentity.hemodynamicResearchInputs;
  const headings = [
    ["overview", text(locale, "全体像", "Overview")], ["mechanisms", text(locale, "しくみ", "Mechanisms")],
    ["settings", text(locale, "baselineの設定", "Baseline settings")], ["baseline", text(locale, "baselineの評価", "Baseline assessment")],
    ["record", text(locale, "変更履歴・再現情報", "History and reproducibility")],
  ];
  const expand = (open: boolean) => root.current?.querySelectorAll("details").forEach(d => { d.open = open; });
  return <div className="h-full overflow-y-auto bg-wb-app text-wb-text" data-testid="model-documentation-v2">
    <main ref={root} className="mx-auto max-w-4xl space-y-10 px-5 py-8 sm:px-10 sm:py-12">
      <header>
        <Link to={homeHref(locale)} className={`inline-flex items-center gap-2 text-sm text-wb-muted ${focus}`}><ArrowLeft className="h-4 w-4" />{text(locale, "ホーム", "Home")}</Link>
        <p className="mt-7 text-xs uppercase tracking-widest text-wb-subtle">Model documentation</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{doc.title}</h1>
        <p className="mt-4 text-lg leading-8 text-wb-muted">{text(locale, "心筋・心臓の形状・血管を結び、圧と血流の変化を計算するモデルです。", "A model coupling myocardium, chamber geometry and vessels to calculate pressure and blood flow.")}</p>
        <p className="mt-3 text-xs leading-6 text-wb-subtle">{doc.copy.release[locale]}</p>
      </header>
      <nav aria-label={text(locale, "このページの内容", "On this page")} className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
        {headings.map(([id, title]) => <a key={id} href={`#${id}`} className={`text-wb-accent underline-offset-4 hover:underline ${focus}`}>{title}</a>)}
      </nav>
      <div data-document-toolbar className="flex gap-5 text-xs text-wb-muted"><button data-document-action="expand" onClick={() => expand(true)} className={focus}>{text(locale, "説明をすべて開く", "Expand explanations")}</button><button data-document-action="collapse" onClick={() => expand(false)} className={focus}>{text(locale, "すべて閉じる", "Collapse explanations")}</button></div>
      <section id="overview" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{headings[0][1]}</h2>
        <p className={paragraph}>{text(locale, "心臓・弁・血管を区画に分け、各部を代表する圧・流量・体積で表します。このような空間的な分布を省いた表現を0Dモデルと呼びます。心筋が張力を生み、圧差が血液を動かし、変わった体積が再び心筋の長さと圧に影響します。波形はこの相互作用から生じます。", "This 0D model replaces spatial distributions with representative compartment pressures, flows and volumes. Muscle tension generates pressure; pressure drives flow; changing volume feeds back into muscle length and pressure. Waveforms emerge from this interaction.")}</p>
        <p className={`mt-3 ${paragraph}`}>{text(locale, "設計では、血圧や拍出量だけでなく、負荷を変えたときの応答も重視しています。多様な症例を表現できることと、計算の安定性・構成の簡潔さを両立させることが目標です。", "The design considers responses to changed loading as well as blood pressure and output, aiming to balance case expressiveness, numerical robustness and simplicity.")}</p>
        <CirculationDiagram locale={locale} />
        <p className={paragraph}>{text(locale, "血流・圧の時間変化を調べるためのモデルであり、局所ジェットや伝播・反射波を再現するものではありません。AoP/PAPはモデル内の代表圧で、特定の測定位置と一対一には対応しません。", "The model explores pressure and flow over time, not local jets or travelling/reflected waves. AoP/PAP are representative model pressures, not one-to-one reproductions of specific measurement sites.")}</p>
        <Detail title={text(locale, "詳しい回路と区画（node）", "Detailed circuit and compartments (nodes)")}>
          <MainWireDetailedCircuitV1 data={doc.equations} locale={locale} Equation={Equation} />
        </Detail>
        <Detail title={text(locale, "式の読み方と、計算の前提", "Reading the equations and numerical assumptions")}>
          <p className={paragraph}>{text(locale, "体積・Ca濃度・クロスブリッジの割合のように、時間とともに変わる量が状態変数です。抵抗・弁口面積・反応速度の係数はパラメータです。圧や流量の一部は、各時刻で釣り合いの式を解いて求めます。", "Volumes, calcium and crossbridge populations evolve as states. Resistances, areas and rate coefficients are parameters. Some pressures and flows follow algebraic balance equations at each time.")}</p>
          <p className={`mt-3 ${paragraph}`}>{text(locale, "数式の上の点は時間微分、Δは差を表します。以下の各節に、規則的洞調律・補助循環なしの方程式、閉鎖・虚脱などの分岐条件、係数と初期状態を掲載しています。記号は各節で定義します。循環はmmHg・mL・s、心筋と形状はPa・m・sを使うので、結合時に1 mmHg＝133.322387415 Pa、1 mL＝10⁻⁶ m³で換算します。", "Dots denote time derivatives and Δ differences. Sections specify the regular-sinus, unassisted equations, closure/collapse branches, coefficients and initial state. Symbols are local to each section. Circulation uses mmHg/mL/s; mechanics uses Pa/m/s. Convert with 1 mmHg=133.322387415 Pa and 1 mL=10⁻⁶ m³.")}</p>
          <p className={`mt-3 ${paragraph}`}>{text(locale, "力学と循環を連立して時間を進め、粘弾性などには陰的な時間積分を用います。baselineは1拍ごとの変化が小さくなるまで計算した状態から起動します。保存された2 msと1 msの結果を下で比較できますが、二つの刻みの一致だけで全条件の収束が証明されるわけではありません。", "Mechanics and circulation are coupled, with implicit time integration for components including viscoelasticity. Baseline starts from a periodically settled state. Stored 2 and 1 ms records are compared below; their agreement is not proof of convergence in every condition.")}</p>
        </Detail>
      </section>
      <section id="mechanisms" className={section}>
        <h2 className="mb-5 text-xl font-semibold">{headings[1][1]}</h2>
        <p className="mb-4 text-xs leading-6 text-wb-subtle sm:hidden">{text(locale, "横長の数式・表は横にスクロールできます。", "Swipe horizontally to read wide equations and tables.")}</p>
        <figure className="mb-8 rounded-xl border border-wb-line p-5">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">{[text(locale, "興奮・Ca", "Activation / Ca"), text(locale, "筋原線維の張力", "Myofilament tension"), text(locale, "心室形状・圧", "Geometry / pressure"), text(locale, "弁・血流・体積", "Valves / flow / volume")].map((s, i) => <React.Fragment key={s}>{i > 0 && <span aria-hidden="true">{i === 1 ? "→" : "↔"}</span>}<span className="rounded-md bg-wb-panel px-3 py-2">{s}</span></React.Fragment>)}</div>
          <figcaption className="mt-3 text-center text-xs leading-6 text-wb-subtle">{text(locale, "体積が変わると、筋長・短縮速度を通じて張力も変わります。矢印は相互作用を示しています。", "Volume feeds back through length and shortening velocity into tension. Arrows show interactions.")}</figcaption>
        </figure>
        <div className="space-y-8">{doc.moduleIds.map(id => {
          const m = MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === id)!;
          return <article key={id} id={id}>
            <h3 className="mb-2 text-base font-semibold">{m.title[locale]}</h3><p className={paragraph}>{m.summary[locale]}</p>
            <Detail title={text(locale, "数式・仮定を詳しく", "Equations and assumptions")}>
              <p className={paragraph}>{m.detail[locale]}</p>
              {m.equation && <><Equation expression={m.equation} /><p className="text-xs leading-6 text-wb-subtle">{m.equationNote?.[locale]}</p></>}
              {m.symbols && <dl className="model-symbol-definitions mt-5 space-y-4 text-sm leading-7">{m.symbols.map(([symbol, meaning]) => <div key={symbol} className="grid min-w-0 gap-1 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5"><dt className="text-[15px] text-wb-text"><InlineMath expression={symbol} /></dt><dd className="min-w-0 text-wb-muted">{meaning[locale]}</dd></div>)}</dl>}
              {m.additionalEquations?.map(e => <div key={e.expression} className="mt-5"><Equation expression={e.expression} /><p className={paragraph}>{e.note[locale]}</p></div>)}
              <MainWireModuleEquationDetailsV1 data={doc.equations} id={id} locale={locale} Equation={Equation} />
              {m.references?.map(r => <p key={r.url} className="mt-4 text-xs leading-6 text-wb-muted"><a href={r.url} target="_blank" rel="noreferrer" className="text-wb-accent underline">{r.title}</a><span className="ml-2">{r.context[locale]}</span></p>)}
              {id === "land-deactivation-v2" && <a href={`https://doi.org/${doc.material.doi}`} className="mt-4 inline-block text-xs text-wb-accent underline" target="_blank" rel="noreferrer">Land et al. 2017 · {text(locale, "基礎となる収縮モデル", "Underlying contraction model")}</a>}
            </Detail>
          </article>;
        })}</div>
        <div id="assembly" className="mt-8 scroll-mt-4">
          <h3 className="text-base font-semibold">{text(locale, "方程式を一つの循環モデルに組み立てる", "Assembling the coupled circulation model")}</h3>
          <p className={`mt-2 ${paragraph}`}>{text(locale, "接続・構成式・状態の時間発展を結び、保存されたbaselineから計算を始めるための条件です。", "Coupling the connections, constitutive laws and evolving states, with conditions for starting from the saved baseline.")}</p>
          <Detail title={text(locale, "連立方程式・初期条件を詳しく", "Coupled equations and initial conditions")}>
            <MainWireAssemblyAndInitialStateV1 data={doc.equations} locale={locale} Equation={Equation} />
          </Detail>
        </div>
      </section>
      <section id="settings" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{headings[2][1]}</h2>
        <p className={paragraph}>{text(locale, "安静・洞調律・補助循環なしの基準作動点です。体格BSA 1.9 m²、年齢・性別は特定していません。今回の検証はHR 70で行っています。症例presetや患者デモにこのbaselineの評価範囲をそのまま強制するものではありません。", "A resting, sinus, unassisted operating point at BSA 1.9 m², without an assigned age or sex. This evidence is for HR 70. Its baseline intervals are not automatically imposed on disease presets or patient demos.")}</p>
        <dl className="my-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-wb-line bg-wb-line sm:grid-cols-4">
          {[["HR", `${hemo.heartRateBpm} bpm`], ["TBV", `${hemo.totalBloodVolumeMl} mL`], ["BSA", `${o.rest.comparison.subject.bodySurfaceAreaM2} m²`], [text(locale, "収縮力倍率", "Contractility"), number(doc.fixtureIdentity.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW)]].map(([k,v]) => <div key={k} className="bg-wb-panel p-4"><dt className="text-xs text-wb-subtle">{k}</dt><dd className="mt-2 font-medium tabular-nums">{v}</dd></div>)}
        </dl>
        <p className={paragraph}>{text(locale, "心筋の物性やCa波形の係数はモデルの基礎として固定し、症例の操作には総血液量・抵抗・収縮力倍率などを使います。収縮力1はこのモデルの基準張力に対する倍率です。正常な収縮力の絶対単位を意味しません。", "Constitutive/calcium calibration is separate from day-to-day case controls. Contractility 1 scales this model's reference material; it is not an absolute unit of normal contractility.")}</p>
        <Detail title={text(locale, "採用値とパラメータ設定", "Adopted settings and control domains")}>
          <p className={paragraph}>{text(locale, "以下は保存されたbaselineの設定値です。血圧・拍出・充満・予備能を同時に評価して選んだ組み合わせで、各係数を実測から一つずつ同定した値ではありません。操作方法と設定可能な範囲は、workbenchの項目説明で確認できます。", "These saved baseline settings were selected jointly for pressure, output, filling and reserve, not individually identified from measurements. Control usage and accepted domains are explained in the workbench.")}</p>
          <p className={`mt-3 ${paragraph}`}>{text(locale, "静脈トーンを増やすと、圧を生まずに収容できる静脈血液量が減ります。総血液量を増やす操作とは異なり、血液の配分を変えます。抵抗と動脈の硬さの設定値は基準に対する倍率です。表の共通心室能動張力は、左右自由壁と中隔の値を一括指定する操作で、個別値に重ねて掛ける別係数ではありません。", "Venous tone reduces unstressed venous capacity and redistributes blood rather than adding volume. Resistance and arterial stiffness values are relative scales. The common ventricular control sets both free walls and septum together; it is not another multiplier applied over the individual wall values.")}</p>
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-wb-line"><th className="p-2">{text(locale, "パラメータ", "Parameter")}</th><th className="p-2">baseline</th></tr></thead><tbody>{doc.settings.map(c => <tr key={c.controlId} className="border-b border-wb-line" data-control-id={c.controlId}><th scope="row" className="p-2 font-normal">{controlLabel(c.controlId, locale)}</th><td className="whitespace-nowrap p-2 tabular-nums">{parameterNumber(c.defaultValue)} {c.unit === "1" ? text(locale, "（無次元）", "(dimensionless)") : c.unit === "cm2" ? "cm²" : c.unit}</td></tr>)}</tbody></table></div>
        </Detail>
        <Detail title={text(locale, "固定した材料・Ca源と来歴", "Fixed material, calcium source and provenance")}>
          <p className={paragraph}>{text(locale, "心室のLand由来係数。原著の値と採用値を区別します。単位が違う行は換算も含みます。Tref・Ca感受性・結合速度の変更は閉ループ校正であり、個々の係数を正常ヒト実測から独立に同定したものではありません。", "Ventricular Land-derived coefficients: source and adopted values are distinct; some rows include unit conversion. Changes in tension scale, calcium affinity and binding kinetics are closed-loop calibration, not independent identification of healthy-human coefficients.")}</p>
          <a href={`https://doi.org/${doc.material.doi}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-wb-accent underline">Land et al. 2017 · {doc.material.doi}</a>
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-wb-line"><th className="p-2">{text(locale, "記号と意味", "Parameter")}</th><th className="p-2">{text(locale, "出典の値", "Source")}</th><th className="p-2">{text(locale, "採用値", "Adopted")}</th></tr></thead><tbody>{doc.material.sourceParameters.map(p => <tr key={p.parameter} className="border-b border-wb-line"><th className="p-2 text-left font-normal" scope="row"><MathLabel label={p.parameter} />{locale === "ja" && <span className="mt-1 block leading-5 text-wb-subtle">{materialMeaning[p.parameter]}</span>}</th><td className="whitespace-nowrap p-2 tabular-nums">{parameterNumber(p.original.value)} {p.original.unit === "dimensionless" ? "—" : p.original.unit}</td><td className="whitespace-nowrap p-2 tabular-nums">{parameterNumber(p.runtime.value)} {p.runtime.unit === "dimensionless" ? "—" : p.runtime.unit}</td></tr>)}</tbody></table></div>
          <p className="mt-4 text-xs leading-6 text-wb-muted">{text(locale, "追加した強結合離脱の最大速度：", "Non-source strong-bridge exit rate: ")}{doc.material.strongBridgeDeactivation.maximumRatePerSec} s⁻¹ · {text(locale, "協同性の指数p：", "cooperativity p: ")}{doc.material.strongBridgeDeactivation.cooperativeGatePower}。{text(locale, "心室の筋長基準の倍率：", "Ventricular slack-stretch scale: ")}{doc.material.landSlackStretch}。{text(locale, "体動脈コンプライアンスの固定倍率：", "Fixed systemic compliance multiplier: ")}{doc.assembly.systemicArterialComplianceScale}。</p>
          <p className={`mt-3 ${paragraph}`}>{text(locale, "Trefの出典値は原著の心室全体モデルの列を使っています。Ca感受性・結合速度・張力の変更は、駆出と弛緩を閉ループ全体で評価した調整です。一つのbaselineを再現する係数の組み合わせは複数あり、今回の設定が唯一の生理的な解という意味ではありません。", "The source Tref comes from the paper's whole-organ column. Affinity, kinetics and tension were adjusted jointly against closed-loop ejection and relaxation. Multiple parameter combinations can reproduce a baseline; this is not a uniquely identified physiological solution.")}</p>
          <p className="mt-4 text-xs leading-6 text-wb-muted">{text(locale, "心室Caイベント源の採用値（全心室壁共通）：", "Adopted ventricular event-source values (shared by ventricular walls): ")}
            τr = {number(doc.calcium.LVFW.tauRiseSec, "s")} ms, τd = {number(doc.calcium.LVFW.tauDecaySec, "s")} ms, Ca₀ = {doc.calcium.LVFW.calciumRestUM} µM, g = {doc.calcium.LVFW.calciumGainUMPerUnitDrive} µM.</p>
        </Detail>
      </section>
      <section id="baseline" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{headings[3][1]}</h2>
        <p className={paragraph}>{text(locale, "保存されたbaselineの評価です。workbenchで現在操作している症例をその場で評価したものではありません。必須検査への適合と、各文献の参考範囲との一致は別です。", "This is the saved baseline assessment, not an on-demand assessment of the current workbench scenario. Passing required checks is distinct from matching every source reference interval.")}</p>
        <div className="my-5 rounded-lg border border-wb-line bg-wb-panel p-4 text-sm leading-7">
          <p>{doc.copy.assessment[locale]}</p>
          <p className="mt-2 text-amber-400">{text(locale, "参考警告：", "Reference flags: ")}{warn.map(r => r.label).join(" / ") || "—"}</p>
          <p className="mt-2 text-xs text-wb-muted">{text(locale, "PAP拡張期値、LVの等容期・Tei・dP/dtには参考範囲からの逸脱が残ります。範囲内の値についても、実測との同等性や多様な症例での妥当性が確認されたことにはなりません。", "Diastolic PAP and LV timing/dP/dt retain reference cautions. Even an in-range value does not establish measurement equivalence or validity across clinical cases.")}</p>
        </div>
        <label data-document-record-selector className="mb-4 flex flex-wrap items-center gap-3 text-xs text-wb-muted">{text(locale, "表示する検証記録", "Assessment record")}
          <select data-document-action="record" aria-label={text(locale, "検証記録", "Assessment record")} value={grid} onChange={() => {}} className={`rounded border border-wb-line bg-wb-panel px-3 py-2 text-wb-text ${focus}`}>
            {doc.copy.records.map((record, index) => <option key={index} value={index}>{record[locale]}</option>)}
          </select>
        </label>
        <p className="mb-4 text-xs leading-6 text-wb-subtle">{text(locale, "各行を開くと測定方法・採用範囲・原著の範囲・根拠を読めます。値は各記録の最終定常拍に基づきます。資料に閾値の根拠がない項目は、そのことも表示します。", "Open a row for its measurement method, adopted/source ranges and rationale. Values come from each record's final settled beat. Unsupported thresholds are identified as such.")}</p>
        <p className="mb-5 text-xs leading-6 text-wb-muted">{text(locale, "「作動点の目標」はbaselineの採択に用いる範囲、「構造・負荷の検査」は過大な負荷や不自然な挙動を調べる設計基準です。「参考」は範囲外でも自動棄却せず、測定法や条件と合わせて読みます。「数値品質」は計算の安定性を調べます。", "Operating targets guide baseline admission; construction/load guards check design behavior. References are contextual and do not independently reject a candidate. Numerical quality checks computation.")}</p>
        {(["circulation", "chambers", "timing", "quality"] as const).map((group, index) => <div key={group} className="mb-6">
        <h3 className="mb-2 text-sm font-medium">{[text(locale, "血圧・拍出・弁の圧差", "Pressure, output and valve gradients"), text(locale, "心室の大きさと駆出率", "Ventricular volumes and ejection fraction"), text(locale, "収縮・弛緩と流入", "Contraction, relaxation and filling"), text(locale, "数値・波形", "Numerical and waveform checks")][index]}</h3>
        <div className="rounded-lg border border-wb-line">
          <div aria-hidden="true" className="hidden grid-cols-[1.25fr_1fr_1fr_1fr] gap-4 border-b border-wb-line px-3 py-3 text-xs text-wb-subtle sm:grid">
            <span>{text(locale, "指標", "Metric")}</span><span className="text-right">{text(locale, "baseline値", "Baseline value")}</span><span className="text-right">{text(locale, "採用／参考範囲", "Adopted / reference")}</span><span className="text-right">{text(locale, "評価と役割", "Assessment / role")}</span>
          </div>
          {rows.filter(row => baselineDocumentationGroupV1(row.id) === group).map(row => <BaselineRow key={`${grid}:${row.id}`} row={row} locale={locale} />)}
        </div></div>)}
        <Detail title={text(locale, "数値品質・形状チェックの内容", "Numerical quality and morphology checks")}>
          <p className={paragraph}>{text(locale, "定常判定では、対応する心周期の境界で全状態の差を比較します。形状の検査は、実測のPV loopに一律のドーム形状を強制するものではありません。ピーク位置・丸みの評価と、原因不明の振動・閉鎖付近の再上昇の検査を分けています。", "Settlement checks periodic differences of the full accepted state. Morphology checks do not impose a universal dome on measured PV loops. Peak phase/roundness context is separate from unexplained ringing and closure-rebound guards.")}</p>
          <p className={`mt-3 ${paragraph}`}>{text(locale, "LVP・RVPの形状は、流出弁の流量が『1 mL/sとピーク流量の1%の大きい方』を超える区間で調べます。これは小さな流れを除くための区切り方で、順行流がある全時間を足したETとは異なります。", "LVP/RVP morphology uses outlet flow above max(1 mL/s, 1% of peak flow), distinct from ET's full positive-flow duration.")}</p>
          <p className={`mt-3 ${paragraph}`}>{text(locale, "有意ピークは統計的有意差を意味しません。各ピークから左右にたどり、より高いピークか区間端に達するまでの谷を探します。左右の谷のうち高い方からの突出が『0.5 mmHgと区間の圧幅の5%の大きい方』以上なら数えます。", "Significance is algorithmic, not statistical. Search each side to a higher peak or boundary; count prominence above the higher valley if at least max(0.5 mmHg, 5% of episode pressure range).")}</p>
          <Equation expression={String.raw`\mathrm{variation}=\frac{\sum_i|P_{i+1}-P_i|}{P_{max}-P_{min}}`} />
          <p className={paragraph}>{text(locale, "変動比は、隣り合う圧の変化の絶対値を全て足し、区間内の最高圧と最低圧の差で割った値です。途中の上がり下がりが増えると大きくなります。丸みは区間中央25〜75%の圧幅を全区間の圧幅で割って記録し、ピーク位置とともに参考として示します。", "Variation sums absolute successive pressure changes divided by episode pressure range. Central roundness uses the middle 25–75% sample range divided by full range, with peak phase retained as context.")}</p>
          <dl className="mt-4 space-y-2 text-xs leading-6">
            <div><dt>{text(locale, "1拍ごとの定常性", "Period-1")}</dt><dd className="text-wb-muted">{text(locale, "計算した心周期：", "Cycles: ")}{doc.qualification.cycles} · {text(locale, "連続適合数：", "Consecutive passes: ")}{doc.settlementPolicy.consecutiveCycles} · {text(locale, "規格化した差の許容値：", "Normalized tolerance: ")}{doc.settlementPolicy.period1NormalizedTolerance}</dd></div>
            <div><dt>LVP / RVP</dt><dd className="text-wb-muted">{text(locale, "有意ピーク数 / 変動比：", "Significant peaks / variation ratio: ")}{o.measurements.LVP.significantPeakCount} / {number(o.measurements.LVP.totalVariationRatio)} · {o.measurements.RVP.significantPeakCount} / {number(o.measurements.RVP.totalVariationRatio)}. {text(locale, "上限変動比：", "Variation limit: ")}{doc.morphologyPolicy.maximumTotalVariationRatio}</dd></div>
            <div><dt>LV τ</dt><dd className="text-wb-muted">Weiss {number(o.tau.weiss.tauMs)} ms (R² {o.tau.weiss.rSquared.toFixed(4)}), Glantz {number(o.tau.glantz.tauMs)} ms (P∞ {number(o.tau.glantz.asymptoteMmHg)} mmHg). {o.tau.window.sampleCount} samples. {text(locale, "別の漸近圧モデルのため同じ基準では比較しません。", "Different asymptote models are not judged by the same cutoff.")}</dd></div>
          </dl>
          <Equation expression={String.raw`P(t)=P_{\infty}+A\exp(-(t-t_0)/\tau)`} />
          <p className={paragraph}>{text(locale, "τは圧低下を指数関数で近似した時定数です。Aは近似開始時刻t₀の圧と漸近圧P∞の差です。Weiss法ではP∞＝0、Glantz法ではP∞も推定します。材料の粘弾性時定数を直接測っているわけではありません。", "τ fits pressure decay exponentially. A is pressure above the asymptote at t₀. Weiss fixes P∞=0; Glantz fits it. Neither directly measures the material viscoelastic constant.")}</p>
          <p className="mt-3 text-xs leading-6 text-wb-muted">{text(locale, "τの近似には、少なくとも", "τ fitting requires at least ")}{doc.tauPolicy.minimumSamples}{text(locale, "点、", " points, ")}{number(doc.tauPolicy.minimumDurationSec, "s")} ms{ text(locale, "の区間、", ", ")}{doc.tauPolicy.minimumPressureDropMmHg} mmHg{ text(locale, "の圧低下が必要です。適合度R²はWeiss法で", ". Required R²: Weiss ")}{doc.tauPolicy.minimumWeissRSquared}{text(locale, "以上、Glantz法で", ", Glantz ")}{doc.tauPolicy.minimumGlantzRSquared}{text(locale, "以上とし、圧低下幅で規格化した誤差は", "; normalized error ≤ ")}{doc.tauPolicy.maximumNormalizedPressureRmse}{text(locale, "以下とします。", ".")}</p>
          <p className="mt-4 text-xs leading-6 text-wb-muted">{text(locale, "dP/dtの2 ms / 1 ms差（時間刻み感度。完全な収束証明ではない）：", "dP/dt sensitivity, 2 ms versus 1 ms (not a full convergence proof): ")}{doc.admission.pressureRateQuality.map(q => `${q.checkId.startsWith("left") ? "LV" : "RV"} ${q.checkId.endsWith("maximum-dpdt") ? "+" : "−"}: ${number(q.relativeDifference * 100)}%`).join(" / ")}</p>
        </Detail>
        <Detail title={text(locale, "血液量を増減したときの応答（preload reserve）", "Low/high-volume preload reserve")}>
          <p className={paragraph}>{text(locale, "総血液量を増減し、それぞれ定常状態になるまで計算します。心拍数や静脈トーンを固定したまま、両心室の心拍出量・充満圧・拡張末期容積・経壁圧が変化する余地を調べます。下限値はモデルの応答余地を保つための設計値です。自律神経反射を伴う実際の輸液反応の正常範囲とは異なります。", "Each changed-TBV endpoint is settled at fixed HR/tone controls. Both ventricles are assessed for CO, filling pressure, EDV and transmural end-filling pressure responses. Floors preserve model response headroom; they are not normal saline-response intervals.")}</p>
          <p className="mt-3 text-xs leading-6 text-wb-muted">{text(locale, "総血液量（低容量／baseline／高容量）：", "TBV (low/baseline/high): ")}{number(o.reserveMeasurement.hypovolemicGlobalTbvMl)} / {number(o.reserveMeasurement.sourceGlobalTbvMl)} / {number(o.reserveMeasurement.hypervolemicGlobalTbvMl)} mL</p>
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-wb-line"><th className="p-2">{text(locale, "条件", "Condition")}</th><th className="p-2">ΔCO</th><th className="p-2">{text(locale, "Δ充満圧", "Δ filling P")}</th><th className="p-2">ΔEDV</th><th className="p-2">{text(locale, "Δ拡張末期経壁圧", "Δ end-diastolic Ptm")}</th></tr></thead><tbody>{(["left", "right"] as const).flatMap(side => (["hypovolemic", "hypervolemic"] as const).map(direction => {
            const r = o.reserveMeasurement[side][direction]; const sign = direction === "hypovolemic" ? "−" : "+";
            return <tr key={side + direction} className="border-b border-wb-line"><th className="p-2 font-normal">{side === "left" ? "LV" : "RV"} {sign}TBV</th><td className="whitespace-nowrap p-2">{sign}{number(r.directionalCardiacOutputChangeFraction01 * 100)}%</td><td className="p-2">{sign}{number(r.directionalFillingPressureChangeMmHg)} mmHg</td><td className="p-2">{sign}{number(r.directionalEndDiastolicVolumeChangeMl)} mL</td><td className="p-2">{sign}{number(r.directionalEndDiastolicTransmuralPressureChangeMmHg)} mmHg</td></tr>;
          }))}</tbody></table></div>
          <p className="mt-4 text-xs leading-6 text-wb-muted">{text(locale, "表の差はbaselineからの変化です。充満圧はLVでは平均左房圧、RVでは平均右房圧を使います。以下の下限は、低容量では減少幅、高容量では増加幅に適用します。二つの時間刻みで条件を満たし、閾値からの余裕が刻みによる差を上回るかも確認します。", "Changes are relative to baseline. Filling pressure uses mean LA for LV and mean RA for RV. Floors apply to decreases on the low-volume limb and increases on the high-volume limb, with margins exceeding grid sensitivity.")}</p>
          <p className="mt-3 text-xs leading-6 text-wb-muted">
            |ΔCO|/CO₀ ≥{number(100 * reserveFloor("CardiacOutputLPerMin:fractional-floor-residual"))}% {text(locale, "かつ", "and")} |ΔCO| ≥{reserveFloor("directionalCardiacOutputChangeLPerMin")} L/min;<br />
            |ΔEDV|/EDV₀ ≥{number(100 * reserveFloor("EndDiastolicVolumeMl:fractional-floor-residual"))}% {text(locale, "かつ", "and")} |ΔEDV| ≥{reserveFloor("directionalEndDiastolicVolumeChangeMl")} mL;<br />
            |Δ{ text(locale, "充満圧", "filling P")}| &gt;{reserveFloor("directionalFillingPressureChangeMmHg")} mmHg;<br />
            |Δ{ text(locale, "拡張末期経壁圧", "end-diastolic Ptm")}| ≥{reserveFloor("directionalEndDiastolicTransmuralPressureChangeMmHg")} mmHg;<br />
            ΔCO/Δ{ text(locale, "充満圧", "filling P")} ≥{reserveFloor("CO-pressure-secant-residual")} L/min/mmHg。
            {text(locale, "添字0はbaseline値です。低容量では減少、高容量では増加するという方向の条件も必要です。", "Subscript 0 denotes baseline. The required decrease/increase direction is also checked.")}
          </p>
          <p className="mt-3 text-xs leading-6 text-wb-subtle">{text(locale, "低容量側のRV経壁圧には、時間刻みを変えると約7%の差が残ります。増減後の全条件でτや振動を厳密に再検査すること、最後の3拍の心房圧のずれをmmHgで示すことは未実施です。後負荷試験は含みません。", "Low-volume RV transmural pressure retains about 7% grid sensitivity. Comprehensive endpoint τ/ringing reassessment and last-three-beat atrial-pressure drift in mmHg are not available. No afterload test is included.")}</p>
          <a href={`https://doi.org/${doc.admission.reserve.policy.source.doi}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-wb-accent underline">{doc.admission.reserve.policy.source.locator}</a>
        </Detail>
      </section>
      <section id="record" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{headings[4][1]}</h2>
        <Detail title={text(locale, "この版で変わったこと", "Changes in this version")}>
          <p className={paragraph}>{doc.copy.changes[locale]}</p>
        </Detail>
        <Detail title={text(locale, "固定した識別情報と記録", "Pinned identities and evidence record")}>
          <p className={`mb-4 ${paragraph}`}>{text(locale, "モデル本体、画面・解析項目の定義（Surface）、baseline、採択基準を別々に識別します。SHA-256は、同じ設定・保存状態であるかを照合するための識別値です。数値の妥当性を示す点数ではありません。", "The model, presentation/analysis definition (Surface), baseline and admission policy have separate identities. SHA-256 identifies identical records; it is not a quality score.")}</p>
          <dl className="space-y-3 break-all text-xs leading-6">{[["Model", doc.modelId], ["Surface", doc.surfaceReleaseId], ["baseline", doc.baselineId], ["Policy", doc.admission.policy.policyId], ["Construction SHA-256", doc.admission.constructionSha256], ["Qualification checkpoint SHA-256", doc.qualification.checkpoint.checkpointSha256], ["Launch checkpoint SHA-256", doc.qualification.launchPreparation.targetCheckpointSha256]].map(([k,v]) => <div key={k}><dt className="text-wb-subtle">{k}</dt><dd className="font-mono">{v}</dd></div>)}</dl>
          <p className="mt-5 text-xs leading-6 text-wb-muted">{doc.copy.provenance[locale]}</p>
          <h3 className="mt-5 text-sm">{text(locale, "Surfaceが固定する解析法", "Analysis methods pinned by the Surface")}</h3>
          <ul className="mt-2 break-all text-xs leading-6">{doc.analysisMethods.map(id => <li key={id}>{id}</li>)}</ul>
          <a href="#document-measurements" data-document-action="measurements"  className="mt-4 inline-block text-sm text-wb-accent underline">{text(locale, "表示データ・測定記録をダウンロード", "Download presentation and measurement record")}</a>
          <a href="#document-archive" data-document-action="archive" className="mt-3 block text-sm text-wb-accent underline">{text(locale, "この説明を保存（オフラインHTML）", "Save this explanation (offline HTML)")}</a>
        </Detail>
      </section>
    </main>
  </div>;
}
