import type {
  ScientificProductEvidenceSelectedReportV1,
  ScientificProductValidationItemV1,
  ScientificProductValidationSectionV1,
  ScientificProductValidationStatusV1,
  ScientificProductVerificationItemV1,
  ScientificProductVerificationStatusV1,
} from "./ScientificProductEvidencePageV1";

export type ScientificProductEvidenceMetricDomainV1 =
  | "verification"
  | "validation";

export type ScientificProductEvidenceMetricSectionV1 =
  | "verification"
  | ScientificProductValidationSectionV1;

export type ScientificProductEvidenceMetricFilterV1 =
  | "all"
  | "review"
  | "meets"
  | "unassessed";

export type ScientificProductEvidenceMetricFilterInputV1 = Readonly<{
  query: string;
  filter: ScientificProductEvidenceMetricFilterV1;
  domain: "all" | ScientificProductEvidenceMetricDomainV1;
  section: "all" | ScientificProductEvidenceMetricSectionV1;
}>;

type ExplorerMetricSourceV1 =
  | Readonly<{
    kind: "verification";
    item: ScientificProductVerificationItemV1;
    effectiveStatus: ScientificProductVerificationStatusV1;
  }>
  | Readonly<{
    kind: "validation";
    item: ScientificProductValidationItemV1;
    effectiveStatus: ScientificProductValidationStatusV1;
  }>;

export type ScientificProductEvidenceExplorerMetricV1 = Readonly<{
  key: string;
  itemId: string;
  domain: ScientificProductEvidenceMetricDomainV1;
  section: ScientificProductEvidenceMetricSectionV1;
  shortLabel: string;
  fullLabel: string;
  technicalLabel: string;
  plainExplanation: string;
  searchText: string;
  filter: Exclude<ScientificProductEvidenceMetricFilterV1, "all">;
  valueText: string;
  numericValue: number | null;
  unit: string | null;
  referenceLowerInclusive: number | null;
  referenceUpperInclusive: number | null;
  referenceRange: string | null;
  detail: string | null;
  referenceContext: string | null;
  comparisonLabel: string | null;
  referenceIds: readonly string[];
  source: ExplorerMetricSourceV1;
}>;

type MetricLanguageV1 = "en" | "ja";

type MetricLanguageCopyV1 = Readonly<{
  short: string;
  full?: string;
  explanation: string;
  aliases?: readonly string[];
}>;

type MetricCopyV1 = Readonly<Record<MetricLanguageV1, MetricLanguageCopyV1>>;

const METRIC_COPY_V1: Readonly<Record<string, MetricCopyV1>> = Object.freeze({
  "steady-state-check": metricCopyV1(
    "Repeating beat",
    "The simulation returned to nearly the same state after one heartbeat. This means the calculation settled; it does not mean a normal heart rhythm.",
    ["steady state", "period 1", "P1"],
    "拍動の反復",
    "1拍後にほぼ同じ状態へ戻ったことを確認します。計算が定常化したという意味で、正常な心調律を示すものではありません。",
    ["定常状態", "定常化", "P1"],
  ),
  "following-cycle-check": metricCopyV1(
    "Full heartbeat data",
    "A complete heartbeat was retained after the simulation settled, so pressures, flows, and volumes can be compared over the same beat.",
    ["complete cycle", "501 frames"],
    "1拍分のデータ",
    "計算が定常化した後の1拍を保存し、圧・流量・容積を同じ拍動内で比較できることを確認します。",
    ["完全な1拍", "501フレーム"],
  ),
  "numerics.mechanics.residual": metricCopyV1(
    "Heart-wall consistency",
    "Checks whether the heart-wall mechanics equations closed within their numerical tolerance.",
    ["mechanics residual", "wall residual"],
    "心壁計算の整合性",
    "心壁の力学方程式が、設定された数値許容誤差内で解けたかを確認します。",
    ["心壁残差", "力学残差"],
  ),
  "numerics.circulation.residual": metricCopyV1(
    "Circulation consistency",
    "Checks whether the circulation equations closed within their numerical tolerance.",
    ["circulation residual"],
    "循環計算の整合性",
    "循環の方程式が、設定された数値許容誤差内で解けたかを確認します。",
    ["循環残差"],
  ),
  "numerics.continuity.residual": metricCopyV1(
    "Flow continuity",
    "Checks that blood entering and leaving each modeled connection remains numerically consistent.",
    ["continuity residual", "flow conservation"],
    "血流の連続性",
    "各接続部へ入る血流と出る血流が、数値的に整合しているかを確認します。",
    ["連続性残差", "流量保存"],
  ),
  "numerics.total_blood_volume.error": metricCopyV1(
    "Blood-volume conservation",
    "Checks that the closed-loop model did not numerically gain or lose blood volume.",
    ["blood volume error", "TBV conservation"],
    "血液量の保存",
    "閉鎖循環モデル内の総血液量が、計算上増減していないかを確認します。",
    ["血液量誤差", "TBV保存"],
  ),
  "healthy.lv.edvi": metricCopyV1(
    "LV EDVi",
    "Blood in the left ventricle just before it contracts, adjusted for body size.",
    ["LVEDVi", "end diastolic volume index", "EDV index"],
    "左室 EDVi",
    "左室が収縮する直前に入っている血液量を、体格で補正した値です。",
    ["左室拡張末期容積係数", "左室拡張末期容量係数"],
    "左室拡張末期容積係数（LV EDVi）",
  ),
  "healthy.lv.esvi": metricCopyV1(
    "LV ESVi",
    "Blood left in the left ventricle after it contracts, adjusted for body size.",
    ["LVESVi", "end systolic volume index", "ESV index"],
    "左室 ESVi",
    "左室が収縮したあとに残る血液量を、体格で補正した値です。",
    ["左室収縮末期容積係数", "左室収縮末期容量係数"],
    "左室収縮末期容積係数（LV ESVi）",
  ),
  "healthy.lv.ef": metricCopyV1(
    "LVEF",
    "The percentage of blood pumped out of the left ventricle in one beat.",
    ["ejection fraction", "EF", "left ventricular ejection fraction"],
    "左室EF",
    "左室内の血液を1回の拍動で何％送り出したかを示します。",
    ["左室駆出率", "駆出率", "LVEF"],
    "左室駆出率（LVEF）",
  ),
  "healthy.cardiac_index": metricCopyV1(
    "Cardiac index",
    "Blood pumped per minute, adjusted for body size.",
    ["CI", "cardiac output index"],
    "心係数",
    "1分間に送り出す血液量を体格で補正した値です。",
    ["CI", "心拍出係数"],
  ),
  "healthy.pulmonary_artery.systolic": metricCopyV1(
    "PA systolic pressure",
    "The highest simulated pulmonary-artery pressure during one heartbeat.",
    ["PASP", "pulmonary artery systolic pressure", "RVSP"],
    "肺動脈収縮期圧",
    "1拍の中で最も高いシミュレーション上の肺動脈圧です。",
    ["PASP", "肺動脈圧", "RVSP"],
  ),
  "healthy.left_atrium.mean": metricCopyV1(
    "Mean LA pressure",
    "Average simulated left-atrial pressure over one heartbeat.",
    ["mean LAP", "left atrial pressure", "LA pressure"],
    "平均左房圧",
    "1拍を通したシミュレーション上の左房圧の平均です。",
    ["LAP", "左房圧"],
  ),
});

export function createScientificProductEvidenceExplorerMetricsV1(
  report: ScientificProductEvidenceSelectedReportV1,
  locale = "en",
): readonly ScientificProductEvidenceExplorerMetricV1[] {
  const language = languageV1(locale);
  const verification = report.verificationItems.map((item) =>
    verificationMetricV1(item, language));
  const validation = report.validation.items.map((item) =>
    validationMetricV1(item, language));
  return Object.freeze([...verification, ...validation]);
}

export function filterScientificProductEvidenceExplorerMetricsV1(
  metrics: readonly ScientificProductEvidenceExplorerMetricV1[],
  filter: ScientificProductEvidenceMetricFilterInputV1,
): readonly ScientificProductEvidenceExplorerMetricV1[] {
  const tokens = normalizedSearchV1(filter.query).split(/\s+/).filter(Boolean);
  return metrics.filter((metric) => {
    if (filter.filter !== "all" && metric.filter !== filter.filter) return false;
    if (filter.domain !== "all" && metric.domain !== filter.domain) return false;
    if (filter.section !== "all" && metric.section !== filter.section) return false;
    return tokens.every((token) => metric.searchText.includes(token));
  });
}

export function scientificProductEvidenceMetricCountsV1(
  metrics: readonly ScientificProductEvidenceExplorerMetricV1[],
): Readonly<Record<ScientificProductEvidenceMetricFilterV1, number>> {
  return Object.freeze({
    all: metrics.length,
    review: metrics.filter(({ filter }) => filter === "review").length,
    meets: metrics.filter(({ filter }) => filter === "meets").length,
    unassessed: metrics.filter(({ filter }) => filter === "unassessed").length,
  });
}

function verificationMetricV1(
  item: ScientificProductVerificationItemV1,
  language: MetricLanguageV1,
): ScientificProductEvidenceExplorerMetricV1 {
  const localized = localizedMetricCopyV1(item.id, item.label, language);
  const filter = item.status === "passed"
    ? "meets" as const
    : item.status === "not-run"
      ? "unassessed" as const
      : "review" as const;
  return Object.freeze({
    key: `verification:${item.id}`,
    itemId: item.id,
    domain: "verification" as const,
    section: "verification" as const,
    shortLabel: item.shortLabel ?? localized.short,
    fullLabel: localized.full,
    technicalLabel: item.label,
    plainExplanation: item.plainExplanation ?? localized.explanation,
    searchText: searchTextV1(item, localized),
    filter,
    valueText: verificationValueTextV1(item, language),
    numericValue: finiteOrNullV1(item.numericValue),
    unit: displayUnitV1(item.unit, language),
    referenceLowerInclusive: finiteOrNullV1(item.referenceLowerInclusive),
    referenceUpperInclusive: finiteOrNullV1(item.referenceUpperInclusive),
    referenceRange: item.referenceRange?.trim() || null,
    detail: item.detail?.trim() || null,
    referenceContext: null,
    comparisonLabel: null,
    referenceIds: item.referenceIds ?? Object.freeze([]),
    source: Object.freeze({
      kind: "verification" as const,
      item,
      effectiveStatus: item.status,
    }),
  });
}

function validationMetricV1(
  item: ScientificProductValidationItemV1,
  language: MetricLanguageV1,
): ScientificProductEvidenceExplorerMetricV1 {
  const hasReferenceRange = Boolean(item.referenceRange?.trim());
  const effectiveStatus = item.status === "within-reference" && !hasReferenceRange
    ? "not-assessed" as const
    : item.status;
  const localized = localizedMetricCopyV1(item.id, item.label, language);
  const filter = effectiveStatus === "within-reference"
      || effectiveStatus === "expected-deviation"
    ? "meets" as const
    : effectiveStatus === "finding"
      ? "review" as const
      : "unassessed" as const;
  return Object.freeze({
    key: `validation:${item.id}`,
    itemId: item.id,
    domain: "validation" as const,
    section: item.section ?? "overall",
    shortLabel: item.shortLabel ?? localized.short,
    fullLabel: localized.full,
    technicalLabel: item.label,
    plainExplanation: item.plainExplanation ?? localized.explanation,
    searchText: searchTextV1(item, localized),
    filter,
    valueText: item.observedValue ?? "—",
    numericValue: finiteOrNullV1(item.numericValue),
    unit: displayUnitV1(item.unit, language),
    referenceLowerInclusive: finiteOrNullV1(item.referenceLowerInclusive),
    referenceUpperInclusive: finiteOrNullV1(item.referenceUpperInclusive),
    referenceRange: item.referenceRange?.trim() || null,
    detail: item.detail?.trim() || null,
    referenceContext: item.referenceContext?.trim() || null,
    comparisonLabel: item.comparisonLabel?.trim() || null,
    referenceIds: item.referenceIds ?? Object.freeze([]),
    source: Object.freeze({
      kind: "validation" as const,
      item,
      effectiveStatus,
    }),
  });
}

function localizedMetricCopyV1(
  itemId: string,
  fallbackLabel: string,
  language: MetricLanguageV1,
): Readonly<{
  short: string;
  full: string;
  explanation: string;
  aliases: readonly string[];
}> {
  const fixed = METRIC_COPY_V1[itemId]?.[language];
  if (fixed !== undefined) return Object.freeze({
    short: fixed.short,
    full: fixed.full ?? fixed.short,
    explanation: fixed.explanation,
    aliases: fixed.aliases ?? Object.freeze([]),
  });
  const valve = valveMetricCopyV1(itemId, language);
  if (valve !== null) return valve;
  const waveform = waveformMetricCopyV1(itemId, fallbackLabel, language);
  if (waveform !== null) return waveform;
  return Object.freeze({
    short: fallbackLabel,
    full: fallbackLabel,
    explanation: language === "ja"
      ? "このシミュレーションから得られた指標です。詳細な判定条件と根拠を確認してください。"
      : "A metric calculated from this simulation. Open the details to review how it was assessed.",
    aliases: Object.freeze([]),
  });
}

function valveMetricCopyV1(
  itemId: string,
  language: MetricLanguageV1,
): ReturnType<typeof localizedMetricCopyV1> | null {
  const match = /^valve-flow-(AoV|MV|TV|PV)-(forward|reverse|regurgitation|peak-gradient|mean-gradient)$/.exec(itemId);
  if (match === null) return null;
  const valveId = match[1] as "AoV" | "MV" | "TV" | "PV";
  const metricId = match[2] as "forward" | "reverse" | "regurgitation" | "peak-gradient" | "mean-gradient";
  const valve = language === "ja"
    ? ({ AoV: "大動脈弁", MV: "僧帽弁", TV: "三尖弁", PV: "肺動脈弁" } as const)[valveId]
    : ({ AoV: "Aortic", MV: "Mitral", TV: "Tricuspid", PV: "Pulmonary" } as const)[valveId];
  const metric = language === "ja"
    ? ({
      forward: "順方向量",
      reverse: "逆流量",
      regurgitation: "逆流率",
      "peak-gradient": "最大圧較差",
      "mean-gradient": "平均圧較差",
    } as const)[metricId]
    : ({
      forward: "forward volume",
      reverse: "reverse volume",
      regurgitation: "regurgitation",
      "peak-gradient": "peak gradient",
      "mean-gradient": "mean gradient",
    } as const)[metricId];
  return Object.freeze({
    short: language === "ja" ? `${valve}・${metric}` : `${valve} · ${metric}`,
    full: language === "ja" ? `${valve}の${metric}` : `${valve} valve ${metric}`,
    explanation: language === "ja"
      ? "定常化後の1拍から計算した弁通過血流の記述値です。現在は比較基準を設定していません。"
      : "A descriptive valve-flow value calculated over the retained heartbeat. No comparison target is assigned yet.",
    aliases: Object.freeze([valveId, metricId]),
  });
}

function waveformMetricCopyV1(
  itemId: string,
  fallbackLabel: string,
  language: MetricLanguageV1,
): ReturnType<typeof localizedMetricCopyV1> | null {
  if (!itemId.startsWith("waveform-")) return null;
  const japanese: Readonly<Record<string, string>> = Object.freeze({
    "Aortic pressure": "大動脈圧波形",
    "LV pressure": "左室圧波形",
    "LA pressure": "左房圧波形",
    "Mitral flow": "僧帽弁血流波形",
    "Aortic flow": "大動脈弁血流波形",
    "Tricuspid flow": "三尖弁血流波形",
    "Pulmonary flow": "肺動脈弁血流波形",
  });
  const label = language === "ja"
    ? japanese[fallbackLabel] ?? fallbackLabel
    : `${fallbackLabel} data`;
  return Object.freeze({
    short: label,
    full: label,
    explanation: language === "ja"
      ? "保存した1拍のうち、この波形データを取得できたフレーム数です。波形形状そのものの妥当性はまだ判定していません。"
      : "Shows how many frames contain this waveform in the retained heartbeat. Waveform shape is not assessed yet.",
    aliases: Object.freeze([fallbackLabel, itemId.replace("waveform-", "")]),
  });
}

function searchTextV1(
  item: ScientificProductVerificationItemV1 | ScientificProductValidationItemV1,
  localized: Readonly<{
    short: string;
    full: string;
    explanation: string;
    aliases: readonly string[];
  }>,
): string {
  return normalizedSearchV1([
    item.id,
    item.label,
    item.shortLabel,
    item.unit,
    ...(item.searchTerms ?? []),
    localized.short,
    localized.full,
    ...localized.aliases,
  ].filter((value): value is string => Boolean(value)).join(" "));
}

function normalizedSearchV1(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[·・/_-]+/g, " ").trim();
}

function finiteOrNullV1(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function displayUnitV1(
  unit: string | null | undefined,
  language: MetricLanguageV1,
): string | null {
  const normalized = unit?.trim() ?? "";
  if (normalized === "" || normalized === "1" || normalized === "fraction") {
    return null;
  }
  return language === "ja"
    ? normalized.replace(/\bframes\b/giu, "フレーム")
    : normalized;
}

function verificationValueTextV1(
  item: ScientificProductVerificationItemV1,
  language: MetricLanguageV1,
): string {
  const value = item.value?.trim() || "—";
  if (language !== "ja") return value;
  if (value === "Confirmed") return "確認済み";
  if (value === "Checking") return "確認中";
  if (value === "Unavailable") return "利用できません";
  if (value === "Verification error") return "計算エラー";
  return value.replace(/\bframes\b/giu, "フレーム");
}

function languageV1(locale: string): MetricLanguageV1 {
  return locale.toLocaleLowerCase().startsWith("ja") ? "ja" : "en";
}

function metricCopyV1(
  englishShort: string,
  englishExplanation: string,
  englishAliases: readonly string[],
  japaneseShort: string,
  japaneseExplanation: string,
  japaneseAliases: readonly string[],
  japaneseFull?: string,
): MetricCopyV1 {
  return Object.freeze({
    en: Object.freeze({
      short: englishShort,
      explanation: englishExplanation,
      aliases: Object.freeze([...englishAliases]),
    }),
    ja: Object.freeze({
      short: japaneseShort,
      ...(japaneseFull === undefined ? {} : { full: japaneseFull }),
      explanation: japaneseExplanation,
      aliases: Object.freeze([...japaneseAliases]),
    }),
  });
}
