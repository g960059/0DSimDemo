import type { Locale } from "@/localeRouting";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import { isRegisteredCurrentBaselineFixtureV1 } from "@/studio/registry/RegisteredCurrentModelBaselineV1";
import binding from "@/studio/integrations/mainWireIntegratedV3/standard72-baseline-binding-evidence.json";
import eligibility from "@/data/model-baselines/standard72-reviewed-eligibility-v1.json";
import checkpoint from "@/studio/integrations/mainWireIntegratedV3/standard72-launch-checkpoint.json";
import { baselineMetricLabelV1, baselineMeasurementSummaryV1 } from "./modelDocumentation/MainWireBaselineDocumentationV1";

type Item = Readonly<{ itemId: string; label: string; value: string; detail: string; status?: "reference" | "warning" }>;

/** A compact readback of the adopted record, not a live or new gate evaluation. */
export function registeredCurrentBaselinePresentationV1(modelId: string | null | undefined,
  fixture: StudioJsonValueV2 | null | undefined, locale: Locale) {
  if (!isRegisteredCurrentBaselineFixtureV1(modelId, fixture)) return undefined;
  const say = (ja: string, en: string) => locale === "ja" ? ja : en;
  const reference = say("参考比較であり、正常性を保証する合否判定ではありません。", "Contextual comparison, not a normality verdict.");
  const observation = eligibility.observations[0]!;
  const beat = checkpoint.baseStandardCheckpointV2.completedBeatMetrics;
  const items: Item[] = [];
  items.push(Object.freeze({ itemId: "baseline-construction-checks", label: say("数値・構造チェック", "Numerical / construction checks"),
    value: say("採用条件を確認済み", "Adoption checks verified"),
    status: binding.rest.status === "passed" && binding.rest.unavailable.length === 0
      && binding.rest.invalidOrFailedRetained.length === 0 ? undefined : "warning",
    detail: say("定常化・流量と弁イベント・波形の数値的な整合性など、採用時の必須項目の記録です。単峰性や一つのPV loop形状をヒトの正常条件とはしません。詳細と参考警告はモデル文書に記載しています。", "Recorded required settlement, flow/event and waveform construction checks. Single-peaked pressure or one PV contour is not a universal human-normality requirement. The model document retains details and reference cautions.") }));
  const add = (id: string, value: number, unit: string, status?: Item["status"], detail = "") => {
    const scale = unit === "s" ? 1000 : unit === "fraction" ? 100 : 1;
    const shownUnit = unit === "s" ? "ms" : unit === "fraction" ? "%" : unit;
    items.push(Object.freeze({ itemId: id, label: baselineMetricLabelV1(id),
      value: `${(value * scale).toFixed(unit === "s" || unit === "mmHg/s" ? 0 : 2)} ${shownUnit}`.trim(),
      status, detail: [baselineMeasurementSummaryV1(id, locale), detail].filter(Boolean).join(" ") }));
  };
  for (const row of binding.rest.operating) add(row.metricId, row.actual,
    row.metricId.includes("cardiac-index") ? "L/min/m²" : "mmHg",
    row.status === "passed" ? undefined : "warning",
    `${say("採用条件", "Adoption criterion")}: ${row.lower ?? "—"}–${row.upper ?? "—"}. `
      + say("文献の正常範囲と設計上の負荷制限を区別します。", "Source-informed operating targets and engineering load guards are distinct."));
  const operatingIds = new Set(binding.rest.operating.map(row => row.metricId));
  for (const row of binding.rest.comparison.entries) {
    if (operatingIds.has(row.metricId)) continue;
    const warning = row.comparisons.some(c => c.status === "outside-source-range");
    add(row.metricId, row.actual, row.unit, warning ? "warning" : "reference", reference);
  }
  for (const side of ["left", "right"] as const) {
    const native = observation.native[side], ventricle = side === "left" ? "LV" : "RV";
    for (const [suffix, value, unit] of [["ict", native.timing.ictSec, "s"],
      ["irt", native.timing.irtSec, "s"], ["tei-index", native.timing.teiIndex, ""]] as const) {
      const id = `${side === "left" ? "timing" : "right-timing"}.${suffix}`;
      add(id, value, unit, binding.rest.historicalWarnings.some(w => w.checkId === id) ? "warning" : "reference", reference);
    }
    add(`${side === "left" ? "mitral" : "tricuspid"}-flow.peak-e-to-a`, native.inletFlow.peakEToA, "", "reference", reference);
    const rates = beat.ventricularAbsolutePressureRateExtrema[ventricle];
    for (const [extremum, value] of [["maximum", rates.maximumMmHgPerSec], ["minimum", rates.minimumMmHgPerSec]] as const) {
      const id = `${side}-ventricle.${extremum}-dpdt`;
      add(id, value, "mmHg/s", binding.rest.historicalWarnings.some(w => w.checkId === id) ? "warning" : "reference", reference);
    }
  }
  for (const [name, valve] of [["aortic", "AoV"], ["pulmonary", "PV"]] as const) {
    const gradient = beat.valveForwardPressureGradients[valve];
    add(`${name}-valve.mean-gradient`, gradient.timeWeightedMeanMmHg, "mmHg", "reference", reference);
    add(`${name}-valve.peak-gradient`, gradient.peakMmHg, "mmHg", "reference", reference);
  }
  items.push(Object.freeze({ itemId: "lv-relaxation-tau", label: "LV τ (Weiss / Glantz)",
    value: `${observation.tau.weiss.tauMs.toFixed(1)} / ${observation.tau.glantz.tauMs.toFixed(1)} ms`, status: "reference",
    detail: say("弛緩期の圧を2通りの指数モデルで評価します。漸近圧の仮定が異なるため、同じ閾値で比較しません。", "Two relaxation estimators with different pressure-asymptote assumptions; their thresholds are not interchangeable.") }));
  items.push(Object.freeze({ itemId: "fixed-tone-preload-reserve", label: say("固定制御下のpreload応答", "Fixed-tone preload response"),
    value: say("低容量・高容量とも確認済み", "Low/high volume verified"),
    status: eligibility.reserve.status === "passed" ? undefined : "warning",
    detail: say("同じ物理構築の低容量・高容量条件で、CO・EDV・充満圧・経壁圧の応答と時間刻みへの感度を確認した記録です。臨床的な輸液反応性の正常範囲ではありません。", "Inherited same-construction low/high-volume CO, EDV, filling and transmural pressure responses with two-grid sensitivity checks; not a clinical fluid-responsiveness reference range.") }));
  return Object.freeze({
    summary: say("baseline採用時の記録です。✓は採用条件の確認、ⓘは参考値、△は比較上の注意を示します。正常性の一括判定ではありません。", "Recorded at baseline adoption: checks denote adoption criteria, information icons contextual values, triangles comparison cautions—not a blanket normality claim."),
    items: Object.freeze(items),
  });
}
