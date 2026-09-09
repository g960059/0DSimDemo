import React from "react";
import type { Locale } from "@/localeRouting";
import { ModelEquationV1 as Equation } from "@/components/model/ModelMathV1";
import { ModelDocumentDetailV1 as Detail, MainWireModuleExplanationsV1 } from "./MainWireModuleExplanationsV1";
import { MainWireDetailedCircuitV1, MainWireAssemblyAndInitialStateV1 } from "./MainWireEquationDetailsV1";
import type { StaticCaseDocumentContentV1 } from "./StaticCaseDocumentCompositionV1";
import { resolveStudioItemPresentationV1 as presentation } from "@/studio/presentation/StudioItemPresentationCatalogV1";
import { hfrefSourceEnglishV1, hfrefRationaleEnglishV1 } from "./HfrefCaseDocumentTextV1";
import { MainWireReadingSettingsV1 } from "./MainWireReadingV1";

const p = "text-sm leading-7 text-wb-muted";
const section = "scroll-mt-4 border-t border-wb-line pt-8";
const labels: Record<string, [string, string]> = {
  lvef: ["LVEF", "%"], lvedvi: ["LV EDVI", "mL/m²"], lvesvi: ["LV ESVI", "mL/m²"],
  ci: ["CI", "L/min/m²"], svi: ["SVI", "mL/m²"], meanAo: ["Ao node mean", "mmHg"],
  meanLa: ["mean LAP", "mmHg"], meanRa: ["mean RAP", "mmHg"], meanPap: ["PA node mean", "mmHg"],
  rvef: ["RVEF", "%"], rvedvi: ["RV EDVI", "mL/m²"], rvesvi: ["RV ESVI", "mL/m²"],
  nativeLvEndFillingPressure: ["LV end-filling P", "mmHg"],
  nativeLvEndFillingTransmuralPressure: ["LV end-filling Ptm", "mmHg"],
  positiveDpDt: ["LV +dP/dt", "mmHg/s"], negativeDpDt: ["LV −dP/dt", "mmHg/s"],
  ictMs: ["ICT", "ms"], etMs: ["ET", "ms"], irtMs: ["IRT", "ms"], tei: ["Tei", ""],
  flowEToA: ["E/A (flow)", ""], weissTauMs: ["τ Weiss", "ms"], glantzTauMs: ["τ Glantz", "ms"],
};
const fmt = (x: number | null | undefined) => typeof x === "number" && Number.isFinite(x)
  ? new Intl.NumberFormat("en", { maximumSignificantDigits: 4 }).format(x) : "—";
const display = (id: string, x: number | null | undefined) => fmt(x == null ? null : id.endsWith("ef") ? x * 100 : x);
const comparisonDisplay = (id: string, x: number | null | undefined) => {
  if (typeof x !== "number" || !Number.isFinite(x)) return "—";
  const digits = id === "positiveDpDt" || id === "negativeDpDt" ? 0
    : id === "ci" || id === "tei" || id === "flowEToA" ? 2 : 1;
  return new Intl.NumberFormat("en", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(id.endsWith("ef") ? x * 100 : x);
};

/** Reusable static-case page, compiled into the same offline document format.
 * The explanatory modules and equation tables are shared with baseline pages. */
export function StaticCaseDocumentV1({ document: doc, locale, recordIndex = 0, reading = false }: {
  document: StaticCaseDocumentContentV1; locale: Locale; recordIndex?: number; reading?: boolean;
}) {
  const t = (ja: string, en: string) => locale === "ja" ? ja : en;
  const o = doc.observations[recordIndex]!;
  const reference = doc.reference;
  const sourceLinks = (ids: readonly string[]) => <ul className="mt-3 space-y-2 text-xs leading-6">{ids.map(id => {
    const source = reference.sources.find(s => s.sourceId === id);
    if (!source) throw new Error(`Unresolved source: ${id}`);
    return <li key={id}><a className="text-wb-accent underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
      <span className="block text-wb-subtle">{source.locator}</span></li>;
  })}</ul>;
  const navigation = [["overview", t("症例の全体像", "Case overview")], ["mechanisms", t("モデルのしくみ", "Model mechanisms")],
    ["settings", t("設定", "Settings")], ["baseline", t("症例の評価", "Case assessment")], ["record", t("根拠・再現情報", "Evidence and reproducibility")]];
  const c = doc.construction;
  const rules = [...o.assessment.screen.map(r => ({ ...r, group: "screen" as const, role: t("必須", "Required") })),
    ...o.assessment.targets.map(r => ({ ...r, group: "target" as const, role: t("症例の目標", "Case preference") }))];
  const passive = doc.passiveComparison, tail = doc.slowTail.find(r => r.dtSec === o.dtSec)!;
  const active = c.mechanismInputs.chamberMechanics.activeTensionScaleByWall;
  const Body = reading ? "div" : "main";
  return <div className={reading ? "" : "h-full overflow-y-auto bg-wb-app text-wb-text"} data-testid="model-documentation-v2">
    <Body className={reading ? "space-y-10" : "mx-auto max-w-4xl space-y-9 px-5 py-8 sm:px-10 sm:py-12"}>
      {!reading && <>
      <header>
        <a href={`/${locale}`} className="text-sm text-wb-accent">{t("ホーム", "Home")}</a>
        <p className="mt-6 text-xs tracking-widest text-wb-subtle">Model & case documentation</p>
        <h1 className="mt-3 text-3xl font-semibold">{t(doc.title, "HFrEF · chronic LV-dilated case")}</h1>
        <p className="mt-4 text-lg leading-8 text-wb-muted">{t("左室が大きくなり、送り出す割合が低下した一つの安静時モデルです。", "One resting construction with a larger left ventricle and reduced ejected fraction.")}</p>
        <p className="mt-3 text-xs text-wb-subtle">{t("研究・教育用の採用候補。正式登録前であり、患者の診断・治療には用いません。", "Research/education candidate, not formally registered or intended for diagnosis or treatment.")}</p>
      </header>
      <nav className="flex flex-wrap gap-4 text-sm" aria-label={t("このページの内容", "On this page")}>
        {navigation.map(([id, title]) => <a key={id} href={`#${id}`} className="text-wb-accent underline">{title}</a>)}
      </nav>
      <div data-document-toolbar className="flex gap-5 text-xs text-wb-muted">
        <button data-document-action="expand">{t("説明をすべて開く", "Expand explanations")}</button>
        <button data-document-action="collapse">{t("すべて閉じる", "Collapse explanations")}</button>
      </div>
      </>}
      <section id="overview" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{navigation[0]![1]}</h2>
        <p className={p}>{t("HFrEFはEFが低下した心不全の分類であり、慢性期・左室拡大・特定の原因を一括して意味する名前ではありません。ここでは慢性の左室拡大型を選びました。急性心筋梗塞、局所虚血、心室が拡大していく時間経過は再現していません。", "HFrEF identifies heart failure with reduced EF; it does not itself specify chronicity, dilation or etiology. This case selects a chronic LV-dilated phenotype, not acute infarction, regional ischemia or the time course of remodeling.")}</p>
        {sourceLinks(["heidenreich-2022-hf", "kato-1996-dcm-pv"])}
        <p className={`mt-4 ${p}`}>{t("見せたいのは、大きな左室に血液が多く残ること、安静時の拍出は残ること、左房圧が高めになることです。一方、RVや流入波形まで典型的なHFrEF像を必ず示すとは限りません。以下では、意図した特徴と実際に観測した値を分けます。", "The intended lesson is greater residual LV blood, retained resting forward output and elevated left atrial pressure. RV behavior and filling need not match a universal HFrEF pattern. Intentions and observed results are separated below.")}</p>
        {!reading && <Detail title={t("回路・圧の位置と読み方", "Circuit and pressure interpretation")}>
          <MainWireDetailedCircuitV1 data={doc.equations} locale={locale} Equation={Equation} />
        </Detail>}
      </section>
      {!reading && <section id="mechanisms" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{navigation[1]![1]}</h2>
        <p className={`mb-6 ${p}`}>{t("心筋が張力を生み、心室形状と釣り合う圧が血液を動かします。波形を直接指定するモデルではありません。共通の構成則と、この症例で使う係数を併記します。", "Myocardium generates tension; geometry and equilibrium determine pressure and blood flow. Waveforms are not prescribed. Shared equations and this case's effective coefficients follow.")}</p>
        <MainWireModuleExplanationsV1 moduleIds={doc.moduleIds} equations={doc.equations} locale={locale} />
        <Detail title={t("連立方程式と保存された初期状態", "Coupled equations and saved initial state")}>
          <MainWireAssemblyAndInitialStateV1 data={doc.equations} locale={locale} Equation={Equation} />
        </Detail>
      </section>}
      <section id="settings" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{navigation[2]![1]}</h2>
        <p className={p}>{doc.equations.constructionNote![locale]}</p>
        <dl className="my-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[["HR", `${c.hemodynamicInputs.heartRateBpm} bpm`], ["TBV", `${c.hemodynamicInputs.totalBloodVolumeMl} mL`],
            ["BSA", `${reference.scope.bodySurfaceAreaM2} m²`], [t("LV心筋量", "LV tissue mass"), `${fmt(c.anatomy.lvMassG)} g`]].map(([k, v]) =>
            <div key={k} className="rounded border border-wb-line p-3"><dt className="text-xs text-wb-muted">{k}</dt><dd className="mt-2">{v}</dd></div>)}
        </dl>
        <p className={p}>{t(`LV自由壁・中隔の能動張力倍率は${fmt(active.LVFW)}／${fmt(active.SEP)}、体血管抵抗倍率は${fmt(c.hemodynamicInputs.systemicResistance)}です。倍率1はこのモデルの基準であり、正常収縮力の絶対単位ではありません。この心筋質量だけで病的肥大を実証することはできません。Ca源、架橋の速度、受動材料係数はbaselineと同じです。`, `LV free-wall/septal active tension is ${fmt(active.LVFW)}/${fmt(active.SEP)} and systemic resistance ${fmt(c.hemodynamicInputs.systemicResistance)} times reference. One is a model reference, not an absolute unit of normal contractility. This tissue mass does not establish pathological hypertrophy. Calcium, crossbridge kinetics and passive coefficients are unchanged.`)}</p>
        <Detail title={t("全入力値・材料係数の来歴", "Complete inputs and material provenance")}>
          <div className="overflow-x-auto"><table className="w-full text-left text-xs leading-6" data-equation-table>
            <caption className="py-3 text-left">{t("保存された入力値", "Saved primitive inputs")}</caption>
            <thead><tr><th>{t("項目", "Parameter")}</th><th className="pr-3 text-right">{t("値", "Value")}</th><th>{t("単位", "Unit")}</th></tr></thead>
            <tbody>{doc.settings.map(s => <tr key={s.controlId} className="border-t border-wb-line"><th className="py-2 font-normal">{presentation({ kind: "control", itemId: s.controlId, fallbackEnglishLabel: s.controlId, locale }).label}</th>
              <td className="pr-3 text-right tabular-nums" data-stored-number={s.observed.status === "value" ? s.observed.value : undefined}>{s.observed.status === "value" ? fmt(s.observed.value) : t("壁別の値を参照", "See individual walls")}</td><td>{s.unit}</td></tr>)}</tbody>
          </table></div>
          <p className={`mt-4 ${p}`}>{t("共通の収縮力操作は壁別パラメータを同時に設定する操作で、別の倍率を重ねるものではありません。症例はknob値だけでなく、すべての入力値・固定形状・計算状態を保存します。形状の異なる症例への切替では、その症例自身の保存状態を読み込みます。", "Grouped contractility sets the individual wall inputs; it does not multiply them again. Cases retain primitive inputs, fixed anatomy and state, not only knob positions. Switching geometry loads the target case's own state.")}</p>
          <a className="mt-3 block text-xs text-wb-accent underline" href={`https://doi.org/${doc.material.doi}`}>Land et al. 2017</a>
          <table className="mt-3 w-full text-left text-xs" data-equation-table>
            <caption className="py-2 text-left">{t("基礎モデルからの材料校正（張力倍率を掛ける前）", "Material calibration before case tension scaling")}</caption>
            <thead><tr><th>{t("項目", "Parameter")}</th><th>{t("出典の値", "Source")}</th><th>{t("モデルの基準値", "Model reference")}</th></tr></thead>
            <tbody>{doc.material.sourceParameters.map(s => <tr key={s.parameter} className="border-t border-wb-line">
              <th className="py-2 font-normal">{s.parameter}</th><td>{s.original.value} {s.original.unit}</td><td>{s.runtime.value} {s.runtime.unit}</td></tr>)}</tbody>
          </table>
        </Detail>
        <Detail title={t("心膜と冠循環：この構成で固定したもの", "Fixed pericardial and coronary construction")}>
          <p className={p}>{t("増えた壁体積も、同じ心膜袋の中を占めます。心膜袋を自動で広げる調整はしていません。冠血管床の容量・抵抗の基準と絶対酸素需要はbaselineのままで、現在の心筋量から再設定していません。したがって、拡大心の冠灌流や酸素需給が生理的に十分であるとは主張しません。", "Added tissue occupies the same pericardial bag, without automatic enlargement. Coronary reference storage/resistance and absolute oxygen demand are not rescaled to current mass. Adequate perfusion or oxygen supply in the enlarged heart is not established.")}</p>
        </Detail>
        {reading && <MainWireReadingSettingsV1 document={doc} locale={locale} />}
      </section>
      <section id="baseline" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{navigation[3]![1]}</h2>
        {"historicalEvidence" in doc && <p className={`mb-4 ${p}`}>{t("安静時の比較と起動状態は、このモデル自身で新たに計算しました。PVA・受動曲線・操作試験・長時間の観察は、同じ構成で行った以前の研究記録を、元のモデルIDと来歴を保って参照しています。", "Rest comparisons and launch states were calculated in this exact model. PVA, passive curves, control diagnostics and slow-tail observations refer to prior experiments with the same construction, retaining their original model identity and provenance.")}</p>}
        <label data-document-record-selector className="mb-5 flex items-center gap-3 text-sm">{t("検証記録", "Assessment record")}
          <select data-document-action="record" value={recordIndex} onChange={() => {}} className="rounded border border-wb-line bg-wb-panel px-3 py-2">
            {doc.observations.map((r, i) => <option key={r.dtSec} value={i}>{r.dtSec * 1000} ms · {t(i === 0 ? "起動状態と同じ刻み" : "独立した細かい刻み", i === 0 ? "launch grid" : "independent fine grid")}</option>)}
          </select>
        </label>
        <p className={p}>{t("必須条件と症例の目標は両方の刻みで満たしています。ただし、これは選んだ作動点の適合であり、HFrEFの診断や臨床検証ではありません。文献から得た集団の平均・ばらつきと、症例を選ぶための設計範囲は別です。", "Both grids meet required conditions and case preferences. This qualifies a selected operating point, not a diagnosis or clinical validation. Population statistics and model selection intervals are distinct.")}</p>
        <div className="my-5 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm">
          <caption className="sr-only">{t("保存されたbaselineと症例の比較", "Saved baseline and case comparison")}</caption>
          <thead className="text-xs leading-6"><tr><th className="p-2">{t("指標", "Metric")}</th><th className="p-2 text-right">{t("比較baseline", "Comparator baseline")}<span className="block font-normal text-wb-muted">{t("2 ms 固定", "2 ms, fixed")}</span></th><th className="p-2 text-right">{t("この症例", "This case")}<span className="block font-normal text-wb-muted">{o.dtSec * 1000} ms</span></th><th className="p-2">{t("単位", "Unit")}</th></tr></thead>
          <tbody>{Object.entries(labels).map(([id, [label, u]]) => <tr key={id} className="border-t border-wb-line" data-case-metric={id}>
            <th scope="row" className="p-2 font-normal">{label}</th><td className="p-2 text-right tabular-nums">{comparisonDisplay(id, doc.baseline[id])}</td><td className="p-2 text-right tabular-nums">{comparisonDisplay(id, o.values[id])}</td><td className="p-2 text-xs text-wb-muted">{u}</td></tr>)}</tbody>
        </table></div>
        <p className="mb-3 text-xs leading-6 text-wb-muted">{t("比較baselineは保存済みの2 ms記録です。症例を1 msに切り替えても、baselineを再計算した意味にはなりません。丸め前の値はJSONに含まれます。", "The comparator baseline remains its saved 2 ms record; selecting the 1 ms case does not recompute it. Unrounded values are included in the JSON export.")}</p>
        <p className={p}>{t("比較は同じ負荷に揃えた実験ではありません。低いEFでも拍出量はゼロにならず、Teiがbaselineより小さくても収縮力が良いとは言えません。平均左房圧・充満末期LV内圧・経壁圧は異なる値です。E/Aは容積流量の比であり、臨床Doppler速度の比ではありません。", "This is not a load-matched comparison. Reduced EF can coexist with forward output; a smaller Tei than baseline does not demonstrate better contractility. Mean LA, end-filling cavity and transmural pressures differ. E/A uses volumetric flow, not Doppler velocity.")}</p>
        <h3 className="mt-7 text-base font-semibold">{t("範囲とその根拠", "Intervals and rationale")}</h3>
        {rules.map((r, i) => <Detail key={r.metricId + i} title={<span className="flex w-full flex-wrap justify-between gap-3">
          <span>{labels[r.metricId]?.[0] ?? r.metricId} · {r.role}</span>
          <span>{display(r.metricId, r.actual)} / {display(r.metricId, r.lower)}–{display(r.metricId, r.upper)} {labels[r.metricId]?.[1]} · {r.status === "passed" ? t("適合", "Met") : r.status === "failed" ? t("範囲外", "Outside interval") : t("未評価", "Unavailable")}</span>
        </span>}>
          <p className={p}>{locale === "ja" ? r.rationale : hfrefRationaleEnglishV1(r.group, r.metricId)}</p>
          <p className="mt-3 text-xs text-wb-subtle">{t("測定法：", "Method: ")}{"method" in r ? r.method : reference.restScreen.find(s => s.metricId === r.metricId)?.method}</p>
          {sourceLinks(r.sourceIds)}
        </Detail>)}
        <Detail title={t("τ・圧変化率・流入の測定", "Relaxation, pressure rates and filling")}>
          <Equation expression={String.raw`P(t)=P_{\infty}+A e^{-(t-t_0)/\tau},\qquad \mathrm{Tei}=\frac{ICT+IRT}{ET}`} />
          <p className={p}>{t("τは左室内圧の圧低下から求めます。Weiss法は漸近圧を0とし、Glantz法は漸近圧も推定します。この症例のGlantz適合は不良のため、数値欄では欠測として扱います。Weissの延長は観測できますが、Caや架橋の速度は変えていません。負荷・形状・観測窓から生じる変化を、固有の弛緩異常と同一視しません。", "Tau is fitted to cavity-pressure decay. Weiss fixes the asymptote at zero; Glantz estimates it. Glantz does not pass fit quality here and is shown as unavailable. Weiss is prolonged despite unchanged calcium/crossbridge kinetics; effects of loading, geometry and the observation window are not identified intrinsic relaxation disease.")}</p>
          <p className={`mt-3 ${p}`}>Weiss: {fmt(o.tau?.weiss?.tauMs)} ms · R² {fmt(o.tau?.weiss?.rSquared)} · {t("窓", "window")} {fmt((o.tau?.window?.durationSec ?? 0) * 1000)} ms · {o.tau?.window?.sampleCount} {t("点", "samples")}.</p>
          <p className={`mt-3 ${p}`}>{t(`測定窓は最小dP/dtの区間中央から、次のLV充満末期圧＋${doc.tauPolicy.endPressureAboveNextEdpMmHg} mmHgに達するまで（僧帽弁開放より前）です。時間間隔で重み付けし、Weissは対数圧と時間、GlantzはdP/dtと圧の直線回帰を使います。最低${doc.tauPolicy.minimumSamples}点・${doc.tauPolicy.minimumDurationSec * 1000} ms・圧低下${doc.tauPolicy.minimumPressureDropMmHg} mmHg、R²はWeiss ${doc.tauPolicy.minimumWeissRSquared}／Glantz ${doc.tauPolicy.minimumGlantzRSquared}以上、再構成圧のRMSEは圧低下の${doc.tauPolicy.maximumNormalizedPressureRmse * 100}%以下としています。これらは計測の利用可能性を判定する設計値で、疾患の正常域ではありません。`, `The window runs from the midpoint of the minimum-dP/dt interval to the next end-filling LV pressure plus ${doc.tauPolicy.endPressureAboveNextEdpMmHg} mmHg, before mitral opening. Time-weighted linear regressions use log-pressure versus time for Weiss and dP/dt versus pressure for Glantz. Required support is ${doc.tauPolicy.minimumSamples} samples, ${doc.tauPolicy.minimumDurationSec * 1000} ms and ${doc.tauPolicy.minimumPressureDropMmHg} mmHg decay; minimum R² is ${doc.tauPolicy.minimumWeissRSquared}/${doc.tauPolicy.minimumGlantzRSquared}, and reconstructed-pressure RMSE must be ≤${doc.tauPolicy.maximumNormalizedPressureRmse * 100}% of the decay. These are measurement-usability design rules, not disease-normality limits.`)}</p>
          <p className={`mt-3 ${p}`}>{t("GlantzのR²はdP/dt対圧の回帰に対する値です。圧波形を再構成した誤差が小さくても、この適合条件を満たすとは限りません。", "Glantz R² describes the dP/dt-versus-pressure regression. A small reconstructed-pressure error does not override that fit-quality requirement.")}</p>
          <p className={`mt-3 ${p}`}>{t("dP/dtは受理された計算ステップ間の左室内圧差を時間差で割り、最大・最小を取ります。解析微分ではなく、センサーの帯域・平滑化も再現しません。ICT・ET・IRTは弁イベント／順行流から求めるため、臨床で別の測定法から得た閾値と直接同一視しません。", "dP/dt uses accepted-step cavity-pressure differences divided by elapsed time, not an analytic derivative or a filtered sensor. ICT/ET/IRT follow valve events/forward flow, not interchangeable clinical acquisition methods.")}</p>
          <p className={`mt-3 ${p}`}>{t(`流量E/Aは${fmt(o.values.flowEToA)}で、baselineの${fmt(doc.baseline.flowEToA)}と同じくA波優位です。Lavineらの高充満圧DCM群では早期流入の割合が増え、心房収縮による割合は低下しており、この症例とは方向が異なります。流量とDoppler速度の違いだけで整合したとは考えません。今回のA波優位は、再現できたHFrEFの所見ではなく、baselineと共有する流入特性として扱います。`, `Flow E/A is ${fmt(o.values.flowEToA)}, A-dominant as in baseline (${fmt(doc.baseline.flowEToA)}). Lavine's high-filling-pressure DCM group had a greater early filling fraction and a lower atrial fraction, a different direction. The flow-versus-Doppler distinction alone does not resolve this mismatch. A-dominance is a model inflow trait shared with baseline, not an established HFrEF finding reproduced here.`)}</p>
          <p className={`mt-3 ${p}`}>{t(`LV充満末期内圧と平均左房圧の差も${fmt(o.values.nativeLvEndFillingPressure! - o.values.meanLa!)} mmHgあります。Katoらの群平均の差は4 mmHgでしたが、個人差の分布ではありません。平均左房圧をPCWPやLV充満末期圧へ読み替えず、この違いも流入機構の今後の検討点として残します。`, `End-filling LV cavity pressure exceeds mean LA pressure by ${fmt(o.values.nativeLvEndFillingPressure! - o.values.meanLa!)} mmHg. Kato's difference of cohort means was 4 mmHg, not a distribution of individual differences. Mean LA is not substituted for PCWP or end-filling LV pressure; this discrepancy remains an inflow-mechanism limitation.`)}</p>
          {sourceLinks(["lavine-1989-dcm-filling", "kato-1996-dcm-pv"])}
        </Detail>
        <Detail title={t("波形と定常性", "Waveform and settlement")}>
          <p className={p}>{t("LVP/RVPの有意ピークは各1個です。駆出期の主ピーク位置やPV loopの丸みを一律の正常範囲に押し込みません。小さな変動や操作後の全範囲での振動まで否定するものではありません。", "LVP/RVP each have one significant peak. Peak position and PV-loop roundness are not forced into a universal normal interval. This does not rule out small fluctuations or ringing under every control combination.")}</p>
          <p className={`mt-3 ${p}`}>LVP: {o.morphology.LVP.significantPeakCount} peaks · variation {fmt(o.morphology.LVP.totalVariationRatio)} · peak {fmt(o.morphology.LVP.peakPhase01 * 100)}% ET.<br />
            RVP: {o.morphology.RVP.significantPeakCount} peaks · variation {fmt(o.morphology.RVP.totalVariationRatio)}.</p>
          <p className={`mt-3 ${p}`}>{t("対応する周期境界の状態差が連続3周期で許容内となった後、別の1周期も確認しています。", "Three consecutive periodic-boundary passes were followed by a separate audit beat.")} {o.cycles} {t("周期", "cycles")} · {fmt(o.maximumNormalizedDelta)}.</p>
          <p className={`mt-3 ${p}`}>{t(`既存の保存状態からさらに${tail.extensionCycles}拍進めた記録では、冠血管トーンは${fmt(tail.initialStateValue)}→${fmt(tail.finalStateValue)}と変化しています。CI変化は${fmt(tail.finalValues.ci! - tail.initialValues.ci!)} L/min/m²、Ao node平均圧の変化は${fmt(tail.finalValues.meanAo! - tail.initialValues.meanAo!)} mmHgです。血行指標の変化は小さいものの、全状態が完全に一定になったとは主張しません。`, `An additional ${tail.extensionCycles} beats from the earlier saved state changed coronary tone ${fmt(tail.initialStateValue)}→${fmt(tail.finalStateValue)}. CI changed ${fmt(tail.finalValues.ci! - tail.initialValues.ci!)} L/min/m² and mean Ao-node pressure ${fmt(tail.finalValues.meanAo! - tail.initialValues.meanAo!)} mmHg. Small hemodynamic changes do not establish complete stationarity.`)}</p>
          <p className={`mt-3 ${p}`}>{t("この追加記録は以前のlab-003で行ったものです。現在の起動記録lab-004との数値状態・解法予測子・構成・開始時観測値の一致を確認して参照しており、今回再実行したとは扱いません。", "This extension was run on lab-003, not rerun for lab-004. Its numerical starting state, solver predictor, construction and initial observations were checked against the current launch record before reusing it.")}</p>
        </Detail>
        <Detail title={t("PV解析と受動的な容量特性", "PV analysis and passive accommodation")}>
          <p className={p}>{t("以下のPV解析は2 msの起動状態に対する別の負荷変更解析です。1 msに切り替えても、この解析を1 msで再実行した意味にはなりません。縦軸は経壁圧です。", "The following separate loading analyses use the 2 ms launch. Selecting the 1 ms record does not rerun or relabel this PV analysis. Pressure is transmural.")}</p>
          <div className="my-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>LV · J/beat</th><th className="text-right">baseline</th><th className="text-right">HFrEF</th></tr></thead>
            <tbody>{(["strokeWork", "potentialEnergy", "pva"] as const).map((key, i) => <tr key={key} className="border-t border-wb-line">
              <th className="py-2 font-normal">{["SW", "PE", "PVA"][i]}</th><td className="text-right tabular-nums">{doc.pv.baseline.left[key].joule.toFixed(3)}</td><td className="text-right tabular-nums">{doc.pv.hfref.left[key].joule.toFixed(3)}</td></tr>)}</tbody></table></div>
          <p className={p}>{t("この例ではSWが低下し、PEの寄与が大きくなっています。ESPVR/EDPVRはモデルの負荷変更で得た関係で、臨床カテーテルのEesや純粋な受動材料曲線そのものではありません。PEは低容量側へ接線で延長した部分も含みます。", "SW falls while PE contributes more. Model load-family ESPVR/EDPVR are not catheter Ees or an isolated passive material law. PE includes a low-volume tangent extension.")} {fmt(doc.pv.hfref.left.potentialEnergy.lowVolumeTangentExtensionSpanMl)} mL.</p>
          <p className={`mt-3 ${p}`}>{t(`別の完全受動・粘性緩和後の比較では、RV容積${fmt(passive.rvVolumeMl)} mLを固定し、LV経壁圧${fmt(passive.lvTransmuralPressureMmHg)} mmHgで支えられるLV容積が${fmt(passive.baselineVolumeMl)}→${fmt(passive.caseVolumeMl)} mLになりました。RV圧を合わせた比較でも、動的EDPVRでもありません。`, `A separate fully passive, viscously relaxed comparison at fixed RV volume ${fmt(passive.rvVolumeMl)} mL found ${fmt(passive.baselineVolumeMl)}→${fmt(passive.caseVolumeMl)} mL LV volume at ${fmt(passive.lvTransmuralPressureMmHg)} mmHg LV transmural pressure. It is neither RV-pressure-matched nor a dynamic EDPVR.`)}</p>
          <p className={`mt-3 ${p}`}>{t("PVA由来の酸素消費推定は現在のLV質量で換算しますが、イヌ由来の関係と未校正の収縮性依存切片を用いる参考計算です。疾患の実際の代謝・酸素不足・機械効率を証明しません。", "The PVA-derived oxygen estimate uses current LV mass, but remains illustrative: a canine relation and an uncalibrated contractility-dependent intercept do not validate disease metabolism, ischemia or mechanical efficiency.")}</p>
        </Detail>
        <Detail title={t("操作できる範囲と、検証した範囲", "Controls and qualification scope")}>
          <p className={p}>{t(`${doc.settings.length}項目の操作を継承していますが、全組合せが検証済みという意味ではありません。LV収縮性0.25/0.75/1.33、TBV4200/7000 mL、HR60への単独変更では、操作・継続・保存復元を確認しました。変更後にHFrEFの目標を満たすことは要求していません。`, `The ${doc.settings.length} controls are inherited, not a certification of all combinations. Single edits to LV tension 0.25/0.75/1.33, TBV4200/7000 mL and HR60 passed interaction, continuation and checkpoint tests. The altered states need not retain HFrEF targets.`)}</p>
          <p className={`mt-3 ${p}`}>{t("既知の制約：TBV7000 mLでゼロから始めると、2 ms刻みでは初期化中に失敗しました。保存状態からの変更と、1 msの独立初期化は成功しています。自動的に刻みを細かくする処理はありません。症例の標準起動には検証した2 msの保存状態を使います。", "Known limit: TBV7000 mL cold initialization failed at 2 ms. Changing from a saved state and independent 1 ms cold initialization succeeded. No automatic time-step fallback is implemented. Standard case launch uses its qualified 2 ms saved state.")}</p>
        </Detail>
      </section>
      <section id="record" className={section}>
        <h2 className="mb-4 text-xl font-semibold">{navigation[4]![1]}</h2>
        <Detail title={t("引用資料の対象・測定法・限界", "Source populations, methods and limitations")}>
          {reference.sources.map(s => { const text = locale === "ja" ? s : hfrefSourceEnglishV1(s.sourceId); return <div key={s.sourceId} className="mb-5 border-b border-wb-line pb-4">
            <a href={s.url} className="text-sm text-wb-accent underline" target="_blank" rel="noreferrer">{s.title}</a>
            <p className="mt-2 text-xs leading-6 text-wb-muted">{text.population}</p>
            <p className="mt-2 text-xs leading-6 text-wb-muted">{text.method}</p>
            <p className="mt-2 text-xs leading-6 text-wb-subtle">{text.limitations}</p>
          </div>; })}
          <p className="text-xs leading-6 text-wb-subtle">{t("転記訂正：Ishihara 1994のEa/Ees平均は、原著抄録に合わせて3.14から3.24へ訂正しました。元の記録は保存しています。文脈情報の訂正であり、選択範囲・評価結果・モデル数値は変えていません。", "Transcription correction: Ishihara 1994 mean Ea/Ees was corrected from 3.14 to 3.24 against the primary abstract. The original record is preserved. This contextual correction changes neither selection intervals, assessment results nor model values.")}</p>
        </Detail>
        <Detail title={t("識別情報・保存・正式採用の状態", "Identity, export and adoption status")}>
          <p className={p}>{t("このページは固定された文書スナップショットで、評価時の数値・基準・来歴を含みます。説明コードが退役しても読むことができます。文書の作成や適合表示は、正式採用の承認とは別です。", "This saved snapshot contains the assessed values, criteria and provenance and survives retirement of authoring code. Generating it or meeting intervals is not an adoption approval.")}</p>
          <dl className="mt-4 space-y-3 break-all text-xs leading-6">{[
            ["Model", doc.modelId], ["Surface", doc.surfaceReleaseId], ["Case", doc.baselineId],
            ...Object.entries(doc.qualification),
          ].map(([k, v]) => <div key={k}><dt className="text-wb-subtle">{k}</dt><dd>{v}</dd></div>)}</dl>
          <p className={`mt-4 ${p}`}>{t("正式登録には、外部2者のうち少なくとも1者の無条件賛同と、新しいexact release自身のartifact・保存状態・Surfaceの整合確認が必要です。既存Standard72の保存状態を改名して代用しません。", "Formal registration still requires at least one unconditional approval from the two reviewers and a new exact release's own artifact, captures and Surface binding. Existing Standard72 checkpoints will not be relabeled.")}</p>
          <ul className="mt-4 break-all text-xs leading-6">{doc.analysisMethods.map(id => <li key={id}>{id}</li>)}</ul>
          <a href="#document-measurements" data-document-action="measurements" className="mt-4 block text-sm text-wb-accent underline">{t("入力・評価・根拠を保存（JSON）", "Save inputs, assessment and evidence (JSON)")}</a>
          <a href="#document-archive" data-document-action="archive" className="mt-3 block text-sm text-wb-accent underline">{t("説明ページを保存（オフラインHTML）", "Save offline HTML")}</a>
        </Detail>
      </section>
    </Body>
  </div>;
}
