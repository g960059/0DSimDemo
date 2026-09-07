import snapshot from "./standard71-documentation-snapshot-v1.json";
import { studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type { Locale } from "@/localeRouting";

export const STANDARD71_DOCUMENTATION_SNAPSHOT_V1 = snapshot;
export type BaselineDocumentationRowV1 = Readonly<{
  id: string; label: string; value: number | null; unit: string;
  role: "target" | "guard" | "reference" | "numerical";
  status: "passed" | "warning" | "failed" | "unassessed" | "reference";
  ranges: readonly { label: string; lower: number | null; upper: number | null }[];
  meaning: string; rationale: string;
  sources: readonly { title: string; url: string; locator: string }[];
}>;
const labels: Record<string, string> = {
  "settlement.period1": "Period-1",
  "systemic-net-flow.cardiac-index": "CI", "systemic-net-flow.stroke-volume-index": "SVI",
  "aortic-pressure.maximum": "AoP max", "aortic-pressure.minimum": "AoP min",
  "central-venous-pressure.mean": "CVP / mean RAP", "pcwp-surrogate.mean": "mean LAP (PCWP surrogate)",
  "pulmonary-artery-pressure.maximum": "PAP max", "pulmonary-artery-pressure.minimum": "PAP min",
  "pulmonary-artery-pressure.mean": "mean PAP", "left-ventricle.native-end-filling-pressure": "LV end-filling P",
  "aortic-valve.ejection-time": "AV ET", "pulmonary-valve.ejection-time": "PV ET",
  "aortic-valve.mean-gradient": "AV mean ΔP", "aortic-valve.peak-gradient": "AV peak ΔP",
  "pulmonary-valve.mean-gradient": "PV mean ΔP", "pulmonary-valve.peak-gradient": "PV peak ΔP",
  "left-ventricle.edv-index": "LV EDVI", "left-ventricle.esv-index": "LV ESVI", "left-ventricle.ejection-fraction": "LVEF",
  "right-ventricle.edv-index": "RV EDVI", "right-ventricle.esv-index": "RV ESVI", "right-ventricle.ejection-fraction": "RVEF",
  "left-ventricle.maximum-dpdt": "LV +dP/dt", "left-ventricle.minimum-dpdt": "LV −dP/dt",
  "right-ventricle.maximum-dpdt": "RV +dP/dt", "right-ventricle.minimum-dpdt": "RV −dP/dt",
  "mitral-flow.peak-e-to-a": "MV E/A", "tricuspid-flow.peak-e-to-a": "TV E/A",
  "timing.ict": "LV ICT", "timing.irt": "LV IRT", "timing.tei-index": "LV Tei",
  "right-timing.ict": "RV ICT", "right-timing.irt": "RV IRT", "right-timing.tei-index": "RV Tei",
  "waveform.LVP.single-peak-no-ringing": "LVP ringing", "waveform.RVP.single-peak-no-ringing": "RVP ringing",
  "waveform.LVP.rounded-not-plateau": "LVP contour", "waveform.RVP.rounded-not-plateau": "RVP contour",
  "waveform.PAP.single-peak-no-ringing": "PAP peaks", "waveform.PV-flow.single-forward-episode": "PV flow episodes",
  "waveform.PV-flow.single-peak-no-ringing": "PV flow peaks", "waveform.PAP.post-PV-closure-rebound": "PAP closure rebound",
};
export function baselineMetricLabelV1(id: string) { return labels[id] ?? id; }
export function baselineMeasurementSummaryV1(id: string, locale: Locale): string {
  const say = (ja: string, en: string) => locale === "ja" ? ja : en;
  if (id.includes("gradient")) return say("弁の上流と下流の圧を同時刻で引き算し、順行流がある時間の平均値・最大値を求めます。Dopplerのジェット速度から求める勾配や、異なる時刻の圧ピーク同士の差とは区別します。", "Mean/maximum simultaneous node pressure difference during forward flow, not maximum-jet Doppler or peak-to-peak catheter gradient.");
  if (id.includes("dpdt")) return say("隣り合う計算時刻の心室内圧の差を経過時間で割り、1拍の最大値・最小値を採ります。表示用の間引きや平滑化は行わず、等容期に限定しません。値は時間刻みに依存します。", "Whole-beat extrema of accepted-step intracavitary pressure differences, before display decimation. These are finite-step rates, not analytic instantaneous derivatives.");
  if (id.startsWith("timing") || id.startsWith("right-timing")) return say("流入弁・流出弁の閉鎖と流量のゼロ交差から等容期を測ります。Tei＝(ICT＋IRT)/ET。エコーの組織Dopplerや弁尖運動からの時刻と同一とは限りません。", "Intervals use native valve closures and flow-zero crossings. Tei=(ICT+IRT)/ET; these timings need not equal tissue-Doppler or leaflet-motion timings.");
  if (id.includes("ejection-time")) return say("半月弁の順行流がある時間の合計です。一度だけ連続して駆出しているかは別の形状検査で確認します。", "Accumulated positive semilunar-valve flow duration; a separate morphology check establishes a single ejection episode.");
  if (id.includes("e-to-a")) return say("心房興奮を基準に分けた拡張早期・心房収縮期の、弁を通る体積流量のピーク比です。Dopplerの局所速度を直接測ったものではありません。", "Ratio of early/atrial volumetric-flow peaks, anchored to atrial capture; not a local Doppler velocity measurement.");
  if (id.includes(".edv-index") || id.includes(".esv-index") || id.includes("ejection-fraction")) return say("弁閉鎖に対応する心腔内血液量からEDV/ESVとEFを求め、体積はBSAで割ります。CMRでは乳頭筋・肉柱の扱いが異なり得るため、分割方法を含めて比較します。男女の範囲を両方表示し、都合のよい方だけを選びません。", "Closure-defined blood-pool EDV/ESV and derived EF, with BSA indexing. CMR segmentation/papillary-muscle conventions matter. Both sex strata are retained.");
  if (id.includes("cardiac-index") || id.includes("stroke-volume-index")) return say("大動脈弁を通る正味拍出量をBSAで補正します。CI＝HR×SVI/1000なので、HR一定では両者は独立な測定ではありません。", "Signed native aortic output indexed by BSA. CI=HR×SVI/1000, so CI and SVI are not independent at fixed HR.");
  if (id === "pcwp-surrogate.mean") return say("ここで計算しているのは左房圧の拍平均です。肺動脈楔入圧の測定過程は再現しておらず、PCWP/PAWPの文献値との比較は参考にとどまります。", "This is beat-mean LA pressure. The wedge measurement is not simulated; comparison with PCWP/PAWP remains contextual.");
  if (id.startsWith("waveform")) return say("計算した圧・流量から、ピーク数・順行流の区間数・波形の変動・閉鎖後の再上昇を調べます。ヒトの正常波形を一つの形に定める検査ではありません。", "Algorithmic peaks, flow episodes, variation and rebounds on accepted samples. These construction thresholds are not universal definitions of healthy human morphology.");
  if (id === "settlement.period1") return say("対応する周期境界で全状態の差を規格化し、連続する周期で許容差内に入ることを確認します。生理学的な正常性とは別の数値検査です。", "Full-state differences at corresponding cycle boundaries must remain within tolerance across consecutive cycles. This is a numerical check, not physiological normality.");
  if (id.includes("pressure")) return say("指定した区画の心腔内／血管内圧について、定常1拍の最大・最小・時間平均、または指定イベント時の値を求めます。外圧の基準と測定位置を合わせて解釈します。", "Maximum/minimum/time-mean compartment pressure over a settled beat, or pressure at the named event. Interpretation depends on pressure reference and station.");
  return "";
}

/** Reader-facing explanations of the frozen record; never a new voting policy. */
function japaneseRationale(row: BaselineDocumentationRowV1): string {
  const id = row.id;
  if (id.startsWith("aortic-pressure")) return "採用範囲は、安静時の血圧を極端な負荷条件にしないための設計値です。参考文献の中心血圧はカフで校正した非侵襲推定値で、モデルの大動脈内圧とは測定法が異なります。年齢・性別ごとの第10〜90百分位は、95%正常範囲として扱いません。拡張期の中心血圧について、同論文から正常上下限は採っていません。";
  if (id === "left-ventricle.native-end-filling-pressure") return "左室への流入が終わる時点の心腔内圧です。過大な充満圧を避ける上限を設けていますが、カテーテルで測るLVEDPとの時刻の同等性は未検証です。下限を正常値として新設してはいません。";
  if (/edv-index|esv-index|ejection-fraction/.test(id)) return "参照先は、乳頭筋・肉柱を血液量から除く心臓MRI（CMR）の集計です。年齢・性別を特定しないbaselineの設計として、男女の範囲の共通部分を採用しました。各指標が範囲内でも、その組み合わせ全体の正常性が証明されるわけではありません。EF＝(EDV−ESV)/EDVであり、これらは独立した指標ではありません。";
  if (id.includes("gradient")) return "この上下限は、十分な弁口面積を持つbaselineで過大な圧損失を見逃さないための設計値です。モデル内の圧差に対する検査であり、ASやPSの臨床的な重症度判定の閾値には使いません。";
  if (id.includes("dpdt")) return "この範囲は開発時に置いた暫定的な参照値です。心室内圧の変化速度は、心筋特性に加えて心拍数・前負荷・圧の振幅・測定帯域にも依存します。範囲外だけで候補を棄却せず、時間刻みを半分にしたときのピークの変化を別に確認します。";
  if (id.startsWith("timing") || id.startsWith("right-timing")) return "ICTは流入弁閉鎖から駆出開始まで、IRTは駆出終了から流入開始までの時間です。提示した範囲は開発時の参考値で、モデルの測定法に対応する正常上下限としては未確立です。Teiは時間配分の比であり、負荷に依存しない収縮力の測定値ではありません。";
  if (id.includes("ejection-time")) return id.startsWith("aortic")
    ? "参照研究のLVETは、僧帽弁の組織Dopplerで測った区間です。集団の心拍数は63±10 bpmで、ここでは心拍数による補正をしていません。測定法の違いがあるため、公開された95%予測区間を参考として併記します。"
    : "成人の肺動脈弁駆出時間について、測定法が対応する数値範囲は確認できていません。加速時間・組織Dopplerの収縮期波の持続時間・左室ETから上下限を代用していません。";
  if (id.includes("e-to-a")) return "E/Aは年齢・心拍数・充満条件・測定位置に左右されます。モデルの流量比とエコーの速度比の同等性は未確立です。この範囲は開発時の参考値として示し、範囲外だけで候補を棄却しません。";
  if (id === "pcwp-surrogate.mean") return "文献のPAWP上限は臨床上の参照値です。左房圧から楔入圧への換算関係を検証した値でも、健康な人の分布の上下限でもありません。";
  if (id.startsWith("waveform")) return row.role === "reference"
    ? "丸みやピーク位置の範囲は開発時の参考値です。実測波形は負荷や圧反射で変わるため、一律のドーム形状を必須にはしていません。"
    : "ピークや再上昇の許容値は、モデルの動作を調べる設計上の基準です。駆出中の原因不明の振動を調べる検査と、正常波形の形を断定することは分けています。具体的な検査内容は下の「数値品質・形状チェックの内容」で確認できます。";
  if (id === "settlement.period1") return "1拍ごとに同じ状態へ戻るかを確認します。循環血液量だけでなく、心筋や血管が持つ内部状態も含めて比較し、偶然1拍だけ一致した場合を除きます。";
  if (id === "lv.tau.weiss") return row.rationale;
  if (id.includes("cardiac-index") || id.includes("stroke-volume-index")) return "参照先は右心カテーテル検査の指標です。モデルでは大動脈弁を通る正味流量を使います。循環全体の心拍出量と対応させるには、定常・補助循環なし・循環を短絡する血流なしの条件が必要です。CIとSVIを別々の独立した目標として数えません。";
  return "参照先は安静時の右心カテーテル検査です。実測値は臥位・呼気終末・圧のゼロ点をそろえて比較します。モデルにはカテーテルの応答特性や、baselineの呼吸性変動を含めていません。";
}

function japaneseRangeLabel(label: string) {
  return label.replace(/women/g, "女性").replace(/\bmen\b/g, "男性")
    .replace(/, pooled adult ages/g, "・成人全体")
    .replace(/Copenhagen pooled healthy adults; HR 63 \+\/- 10/g, "Copenhagenの健康成人・HR 63±10 bpm")
    .replace(/resting adult RHC reference/g, "成人安静時・右心カテーテル")
    .replace(/adult RHC PAWP clinical reference/g, "成人・肺動脈楔入圧")
    .replace(/published-reference-interval/g, "文献の参照範囲")
    .replace(/published-10th-90th-percentiles/g, "第10〜90百分位")
    .replace(/clinical-upper-limit/g, "臨床上の参照上限");
}

export function baselineDocumentationGroupV1(id: string): "circulation" | "chambers" | "timing" | "quality" {
  if (id.startsWith("waveform") || id.startsWith("settlement")) return "quality";
  if (/timing|ejection-time|e-to-a|dpdt|tau/.test(id)) return "timing";
  if (/edv-index|esv-index|ejection-fraction/.test(id)) return "chambers";
  return "circulation";
}
export function baselineNumberV1(value: number | null | undefined, unit = "") {
  if (value == null || !Number.isFinite(value)) return "—";
  const scaled = unit === "s" ? value * 1000 : unit === "fraction" ? value * 100 : value;
  return new Intl.NumberFormat("en", { maximumFractionDigits: Math.abs(scaled) >= 100 ? 1 : 2 }).format(scaled);
}
export function baselineUnitV1(unit: string) {
  return ({ s: "ms", fraction: "%", "mL/m2": "mL/m²", "L/min/m2": "L/min/m²", bool: "", ratio: "", count: "" } as Record<string, string>)[unit] ?? unit;
}
const l = (locale: Locale, ja: string, en: string) => locale === "ja" ? ja : en;
function source(sourceId: string, locator: string) {
  const ref = snapshot.evidence.sources.find(s => s.sourceId === sourceId);
  if (!ref) throw new Error(`Unresolved documentation source: ${sourceId}`);
  return { title: ref.title, url: ref.url, locator };
}

/** Render the saved policy, not today's global gate registry. No new votes. */
export function standard71BaselineRowsV1(grid: 0 | 1, locale: Locale): readonly BaselineDocumentationRowV1[] {
  const o = snapshot.observations[grid];
  const rows: BaselineDocumentationRowV1[] = [];
  const design = l(locale, "設計上の範囲（正常範囲ではない）", "Design interval, not a normal range");
  for (const rule of o.rest.operating) {
    const comparison = o.rest.comparison.entries.find(c => c.metricId === rule.metricId);
    rows.push({ id: rule.metricId, label: baselineMetricLabelV1(rule.metricId), value: rule.actual,
      unit: comparison?.unit ?? "mmHg", role: rule.basis === "source-informed-operating-target" ? "target" : "guard",
      status: rule.status === "passed" ? "passed" : rule.status === "failed" ? "failed" : "unassessed",
      ranges: [{ label: rule.basis === "source-informed-operating-target" ? l(locale, "採用範囲 · 文献を参考", "Adopted, source-informed") : design, lower: rule.lower, upper: rule.upper },
        ...(comparison?.comparisons ?? []).map(c => ({ label: `${c.stratum} · ${c.statistic}`, ...c.range }))],
      meaning: comparison?.mapping ?? l(locale, "流入弁閉鎖時の左室内圧。カテーテルのLVEDPと完全に同じ時点とは限りません。", "Native inlet-closure LV pressure; not validated catheter LVEDP equivalence."),
      rationale: rule.basis === "source-informed-operating-target" ? snapshot.admission.policy.scope : snapshot.admission.policy.loadGuardRationale,
      sources: [source(rule.sourceId, rule.locator)] });
  }
  for (const comparison of o.rest.comparison.entries) {
    if (rows.some(r => r.id === comparison.metricId)) continue;
    const anatomy = comparison.role === "demographic-comparison";
    const outside = comparison.comparisons.some(c => c.status === "outside-source-range");
    rows.push({ id: comparison.metricId, label: baselineMetricLabelV1(comparison.metricId), value: comparison.actual,
      unit: comparison.unit, role: anatomy ? "target" : "reference",
      status: comparison.observationStatus !== "observed" ? "unassessed" : outside ? "warning" : anatomy ? "passed" : "reference",
      ranges: [
        ...(anatomy ? [{ label: l(locale, "採用範囲 · 男女両範囲の共通部分（設計上の選択）", "Adopted intersection of both sex strata (design choice)"),
          lower: Math.max(...comparison.comparisons.map(c => c.range.lower ?? -Infinity)),
          upper: Math.min(...comparison.comparisons.map(c => c.range.upper ?? Infinity)) }] : []),
        ...comparison.comparisons.map(c => ({ label: `${c.stratum} · ${c.statistic}`, ...c.range })),
      ],
      meaning: comparison.mapping,
      rationale: anatomy ? snapshot.admission.policy.anatomyRule
        : l(locale, "文献との比較であり、自動棄却の閾値ではありません。測定法の違いを含めて読みます。", "Source comparison, not an automatic rejection threshold; account for method differences."),
      sources: [source(comparison.sourceId, comparison.locator)] });
  }
  for (const check of o.checks) {
    if (!["construction-guard", "numerical-quality", "reference-warning"].includes(check.historicalRole)
      || rows.some(r => r.id === check.checkId)) continue;
    const group = snapshot.evidence.checkGroups.find(g => g.checkIds.includes(check.checkId));
    if (!group) throw new Error(`Missing documentation method: ${check.checkId}`);
    const reference = check.historicalRole === "reference-warning";
    rows.push({ id: check.checkId, label: baselineMetricLabelV1(check.checkId), value: check.actual, unit: check.unit,
      role: reference ? "reference" : check.historicalRole === "numerical-quality" ? "numerical" : "guard",
      status: !Number.isFinite(check.actual) ? "unassessed" : check.status === "passed" ? reference ? "reference" : "passed"
        : reference ? "warning" : "failed",
      ranges: [{ label: reference ? l(locale, "旧評価範囲 · 参考のみ", "Historical corridor, context only") : design,
        lower: check.minimum, upper: check.maximum }],
      meaning: `${group.measurementMeaning} ${group.observationLimitations}`,
      rationale: `${group.changeReason} ${group.evidenceGap}`,
      sources: group.sourceComparisons.map(c => source(c.sourceId, c.locator)) });
  }
  const tau = o.tau;
  rows.push({ id: "lv.tau.weiss", label: "LV τ (Weiss)", value: tau.weiss.tauMs, unit: "ms", role: "reference",
    status: tau.status !== "measured" ? "unassessed" : tau.referenceStatus === "above-reference" ? "warning" : "reference",
    ranges: [{ label: l(locale, "延長の参考上限 · 正常分布ではない", "Prolongation context, not a normal distribution"), lower: null, upper: snapshot.tauPolicy.referenceUpperMs }],
    meaning: l(locale, "大動脈弁が閉じた後、dP/dtが最小となった二つの計算時刻の中点から近似を始めます。終了は、左室圧が『その後に来る僧帽弁閉鎖時の圧＋5 mmHg』まで下がる時点です。この時点が僧帽弁開放より前にあることを確認します。時間幅で重み付けして指数関数を当てはめ、漸近圧を0に固定します。", "Time-weighted exponential fit of intracavitary LVP from the minimum-dP/dt midpoint to next EDP +5 mmHg, before MVO; zero asymptote. Not interchangeable with free-asymptote Glantz τ."),
    rationale: l(locale, "τの値と、サンプル数・近似残差・評価窓依存性は別の評価です。圧波形を平滑化していません。", "τ and fit usability, residuals and window sensitivity are separate checks. Source pressure is not smoothed."),
    sources: [source("nagueh-2025-lv-diastolic-function", "Invasive relaxation reference; Weiss asymptote/method must be matched")] });
  if (locale !== "ja") return rows;
  const localizedLabels: Record<string, string> = {
    "settlement.period1": "1拍ごとの定常性",
    "pcwp-surrogate.mean": "平均左房圧（PCWP参考）",
    "left-ventricle.native-end-filling-pressure": "LV充満終了時の圧",
    "waveform.LVP.single-peak-no-ringing": "LVPの振動",
    "waveform.RVP.single-peak-no-ringing": "RVPの振動",
    "waveform.LVP.rounded-not-plateau": "LVPの丸み",
    "waveform.RVP.rounded-not-plateau": "RVPの丸み",
    "waveform.PAP.single-peak-no-ringing": "PAPのピーク数",
    "waveform.PV-flow.single-forward-episode": "肺動脈弁の駆出区間数",
    "waveform.PV-flow.single-peak-no-ringing": "肺動脈弁流量のピーク数",
    "waveform.PAP.post-PV-closure-rebound": "肺動脈弁閉鎖後のPAP再上昇",
  };
  return rows.map(row => ({ ...row, label: localizedLabels[row.id] ?? row.label,
    meaning: baselineMeasurementSummaryV1(row.id, locale) || row.meaning,
    rationale: japaneseRationale(row),
    ranges: row.ranges.map(r => ({ ...r, label: japaneseRangeLabel(r.label) })),
  }));
}

export const BASELINE_ROLE_LABELS_V1 = {
  ja: { target: "作動点の目標", guard: "構造・負荷の検査", numerical: "数値品質", reference: "参考" },
  en: { target: "Operating target", guard: "Construction / load guard", numerical: "Numerical quality", reference: "Reference" },
};
export const BASELINE_STATUS_LABELS_V1 = {
  ja: { passed: "適合", warning: "参考範囲外", failed: "不適合", unassessed: "未評価", reference: "参考" },
  en: { passed: "Pass", warning: "Outside reference", failed: "Fail", unassessed: "Unassessed", reference: "Reference" },
};

/** The compact workbench readout and the full page share these exact rows.
 * Do not attach this saved baseline to a different launch fixture. */
export function standard71BaselineInfoV1(modelId: string | undefined, surfaceReleaseId: string | null | undefined,
  fixture: StudioJsonValueV2 | null | undefined, locale: Locale) {
  if (modelId !== snapshot.modelId || surfaceReleaseId !== snapshot.surfaceReleaseId || fixture == null
    || studioCanonicalJsonStringify(fixture) !== studioCanonicalJsonStringify(snapshot.fixtureIdentity)) return undefined;
  const rows = standard71BaselineRowsV1(0, locale);
  const compactIds = ["systemic-net-flow.cardiac-index", "aortic-pressure.maximum", "central-venous-pressure.mean",
    "pcwp-surrogate.mean", "aortic-valve.mean-gradient", "aortic-valve.ejection-time", "timing.tei-index", "lv.tau.weiss",
    "left-ventricle.ejection-fraction", "right-ventricle.ejection-fraction"];
  const warnings = rows.filter(r => r.status === "warning");
  const morphology = rows.filter(r => r.id.startsWith("waveform.") && r.role === "guard");
  const morphologyPassed = morphology.length > 0 && morphology.every(r => r.status === "passed");
  const numericalPassed = snapshot.qualification.classification.status === "period1-converged"
    && snapshot.admission.pressureRateQuality.every(q => q.status === "passed");
  const reservePassed = snapshot.admission.reserve.status === "passed";
  return {
    summary: l(locale, "baselineの保存評価（2 ms）。操作中の症例の評価ではありません。ローカル採択候補。", "Saved baseline assessment (2 ms), not the manipulated scenario. Local candidate."),
    items: [...rows.filter(r => compactIds.includes(r.id)).map(row => ({
      itemId: row.id, label: row.label, value: `${baselineNumberV1(row.value, row.unit)} ${baselineUnitV1(row.unit)}`.trim(),
      detail: `${BASELINE_ROLE_LABELS_V1[locale][row.role]} · ${BASELINE_STATUS_LABELS_V1[locale][row.status]}. ${row.meaning}`,
      status: row.status === "warning" || row.status === "failed" ? "warning" as const
        : row.role === "reference" || row.status === "unassessed" ? "reference" as const : undefined,
    })), ...[
      { itemId: "numerical-quality", label: l(locale, "定常化・dP/dt品質", "Settlement / dP/dt quality"), passed: numericalPassed,
        detail: l(locale, "Period-1と2 ms / 1 msのピーク感度。完全な数値収束の証明ではありません。", "Period-1 and 2/1 ms peak sensitivity, not a full convergence proof.") },
      { itemId: "morphology-guards", label: l(locale, "波形の構造検査", "Waveform guards"), passed: morphologyPassed,
        detail: morphology.map(r => `${r.label}: ${BASELINE_STATUS_LABELS_V1[locale][r.status]}`).join(" / ") },
      { itemId: "preload-reserve", label: "Preload reserve", passed: reservePassed,
        detail: l(locale, "両心室の低／高容量応答と刻み感度。固定制御の設計検査であり臨床輸液反応ではありません。", "Both ventricles, low/high volume and grid sensitivity; fixed-control design checks, not a clinical fluid response.") },
    ].map(r => ({ itemId: r.itemId, label: r.label, value: l(locale, r.passed ? "適合" : "要確認", r.passed ? "Pass" : "Review"),
      detail: r.detail, status: r.passed ? undefined : "warning" as const })),
    { itemId: "reference-warnings", label: l(locale, "参考警告", "Reference warnings"),
      value: String(warnings.length), detail: warnings.map(r => r.label).join(", "),
      status: warnings.length ? "warning" as const : "reference" as const }],
  };
}
