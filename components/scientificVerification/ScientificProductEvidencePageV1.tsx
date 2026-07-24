import React from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDashed,
  CircleX,
  ExternalLink,
  Info,
  LoaderCircle,
  Save,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  createScientificProductEvidenceExplorerMetricsV1,
  filterScientificProductEvidenceExplorerMetricsV1,
  scientificProductEvidenceMetricCountsV1,
  type ScientificProductEvidenceExplorerMetricV1,
  type ScientificProductEvidenceMetricDomainV1,
  type ScientificProductEvidenceMetricFilterV1,
  type ScientificProductEvidenceMetricSectionV1,
} from "./ScientificProductEvidenceMetricExplorerV1";

export type ScientificProductEvidenceScenarioGroupV1 =
  | "current-session"
  | "presets"
  | "my-scenarios";

export type ScientificProductEvidencePageStatusV1 =
  | "idle"
  | "passed"
  | "not-assessed"
  | "checking"
  | "findings"
  | "verification-error";

export type ScientificProductVerificationStatusV1 =
  | "passed"
  | "warning"
  | "error"
  | "not-run";

export type ScientificProductValidationStatusV1 =
  | "within-reference"
  | "expected-deviation"
  | "finding"
  | "not-assessed";

export type ScientificProductValidationSectionV1 =
  | "overall"
  | "valve-flow"
  | "waveform";

export type ScientificProductFullSuiteStatusV1 =
  | "not-run"
  | "running"
  | "complete"
  | "unavailable";

export interface ScientificProductEvidenceSubjectV1 {
  key: string;
  name: string;
  description?: string;
  statusLabel?: string;
  disabled?: boolean;
}

export interface ScientificProductEvidenceFactV1 {
  id: string;
  label: string;
  value: string;
  detail?: string;
}

export interface ScientificProductEvidenceSummaryV1 {
  headline: string;
  description: string;
  facts?: readonly ScientificProductEvidenceFactV1[];
  checkedAt?: string;
}

export interface ScientificProductVerificationItemV1 {
  id: string;
  label: string;
  shortLabel?: string;
  plainExplanation?: string;
  searchTerms?: readonly string[];
  status: ScientificProductVerificationStatusV1;
  value?: string;
  numericValue?: number | null;
  unit?: string;
  referenceLowerInclusive?: number | null;
  referenceUpperInclusive?: number | null;
  referenceRange?: string;
  referenceIds?: readonly string[];
  detail?: string;
}

export interface ScientificProductValidationItemV1 {
  id: string;
  label: string;
  shortLabel?: string;
  plainExplanation?: string;
  searchTerms?: readonly string[];
  section?: ScientificProductValidationSectionV1;
  status: ScientificProductValidationStatusV1;
  observedValue?: string;
  numericValue?: number | null;
  unit?: string;
  referenceLowerInclusive?: number | null;
  referenceUpperInclusive?: number | null;
  referenceRange?: string;
  referenceContext?: string;
  comparisonLabel?: string;
  detail?: string;
  referenceIds?: readonly string[];
}

export interface ScientificProductEvidenceReferenceV1 {
  id: string;
  label: string;
  citation: string;
  href?: string;
  note?: string;
}

export interface ScientificProductHealthyReferenceContextV1 {
  title: string;
  description: string;
  attributes: readonly ScientificProductEvidenceFactV1[];
  sourceLabel?: string;
  sourceHref?: string;
}

export interface ScientificProductEvidenceProvenanceItemV1 {
  id: string;
  label: string;
  value: string;
  monospace?: boolean;
  detail?: string;
}

export interface ScientificProductFullSuiteStateV1 {
  status: ScientificProductFullSuiteStatusV1;
  detail: string;
}

export type ScientificProductValidationSummaryStatusV1 =
  | "not-assessed"
  | "within-reference"
  | "findings";

export interface ScientificProductEvidenceValidationV1 {
  status: ScientificProductValidationSummaryStatusV1;
  message: string;
  items: readonly ScientificProductValidationItemV1[];
  healthyReference: ScientificProductHealthyReferenceContextV1;
  references?: readonly ScientificProductEvidenceReferenceV1[];
}

/**
 * One immutable report selected by the parent route. The page remains a pure
 * presentation boundary and never advances or infers scientific state.
 */
export interface ScientificProductEvidenceSelectedReportV1 {
  subjectKey: string;
  status: ScientificProductEvidencePageStatusV1;
  message: string;
  validation: ScientificProductEvidenceValidationV1;
  evidenceSource: string;
  controlStateSha256: string | null;
  parameterEpoch: number | null;
  fullSuiteStatus: ScientificProductFullSuiteStateV1;
  verificationItems: readonly ScientificProductVerificationItemV1[];
  checkedAt?: string;
  summaryFacts?: readonly ScientificProductEvidenceFactV1[];
  provenanceItems?: readonly ScientificProductEvidenceProvenanceItemV1[];
  claimBoundaries?: readonly string[];
}

export interface ScientificProductEvidencePageCopyV1 {
  title: string;
  subtitle: string;
  scenarioPicker: string;
  currentSessionGroup: string;
  presetsGroup: string;
  myScenariosGroup: string;
  backToWorkbench: string;
  save: string;
  saving: string;
  openInWorkbench: string;
  deleteScenario: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  filterLegend: string;
  allFilter: string;
  reviewFilter: string;
  meetsFilter: string;
  unassessedFilter: string;
  domainLabel: string;
  allDomains: string;
  calculationChecks: string;
  calculationChecksHelp: string;
  referenceComparisons: string;
  referenceComparisonsHelp: string;
  sectionLabel: string;
  allSections: string;
  overallCirculation: string;
  valveFlow: string;
  valveFlowHelp: string;
  waveforms: string;
  waveformsHelp: string;
  technicalDetails: string;
  closeDetails: string;
  metricsShown: string;
  skipToMetrics: string;
  noMatches: string;
  noMatchesHint: string;
  noChecksYet: string;
  noChecksYetHint: string;
  clearFilters: string;
  noReviewItems: string;
  checkedAt: string;
  simulationValue: string;
  referenceRange: string;
  noComparisonTarget: string;
  howToRead: string;
  checkDetails: string;
  whyThisRange: string;
  sources: string;
  opensNewTab: string;
  checksPerformed: string;
  referenceSet: string;
  reproducibilityDetails: string;
  limitations: string;
  notAvailable: string;
  notCheckedStatus: string;
  checkingStatus: string;
  noReviewStatus: string;
  notAssessedStatus: string;
  needsReviewStatus: string;
  calculationErrorStatus: string;
  passStatus: string;
  reviewStatus: string;
  notRunStatus: string;
  inRangeStatus: string;
  outsideRangeStatus: string;
  expectedStatus: string;
  noTargetStatus: string;
  unavailableStatus: string;
  calculationPassMeaning: string;
  calculationErrorMeaning: string;
  calculationMeaning: string;
  referenceMeaning: string;
  inRangeMeaning: string;
  aboveRangeMeaning: string;
  belowRangeMeaning: string;
  outsideRangeMeaning: string;
  expectedMeaning: string;
  noTargetMeaning: string;
  unavailableMeaning: string;
  fullSuiteRunningStatus: string;
  fullSuiteCompleteStatus: string;
  fullSuiteUnavailableStatus: string;
  fullSuiteNotRunStatus: string;
}

export interface ScientificProductEvidencePageV1Props {
  currentSessions: readonly ScientificProductEvidenceSubjectV1[];
  presets: readonly ScientificProductEvidenceSubjectV1[];
  savedScenarios: readonly ScientificProductEvidenceSubjectV1[];
  selectedSubjectKey: string;
  selectedReport: ScientificProductEvidenceSelectedReportV1;
  onSelect: (subjectKey: string) => void;
  onBack: () => void;
  onSaveCurrent: () => void;
  onOpenCurrent: (subjectKey: string) => void;
  onOpenPreset: (subjectKey: string) => void;
  onOpenSaved: (subjectKey: string) => void;
  onDeleteSaved: (subjectKey: string) => void;
  saveDisabled?: boolean;
  savePending?: boolean;
  saveDisabledReason?: string;
  openInWorkbenchDisabled?: boolean;
  deleteDisabled?: boolean;
  locale?: string;
  initialFilter?: ScientificProductEvidenceMetricFilterV1;
  labels?: Partial<ScientificProductEvidencePageCopyV1>;
  className?: string;
}

interface GroupedEvidenceSubjectV1 extends ScientificProductEvidenceSubjectV1 {
  group: ScientificProductEvidenceScenarioGroupV1;
}

type DetailSelectionV1 =
  | Readonly<{ kind: "metric"; metricKey: string }>
  | Readonly<{ kind: "technical" }>;

type ToneV1 = "success" | "neutral" | "info" | "warning" | "danger";

interface StatusPresentationV1 {
  icon: LucideIcon;
  label: string;
  tone: ToneV1;
  iconMotionClassName?: string;
}

const DEFAULT_COPY: ScientificProductEvidencePageCopyV1 = {
  title: "Model checks",
  subtitle: "Compare simulation values with reference ranges.",
  scenarioPicker: "Scenario",
  currentSessionGroup: "Current session",
  presetsGroup: "Presets",
  myScenariosGroup: "My scenarios",
  backToWorkbench: "Back to Workbench",
  save: "Save",
  saving: "Saving…",
  openInWorkbench: "Open copy",
  deleteScenario: "Delete saved scenario",
  searchLabel: "Search metrics",
  searchPlaceholder: "Search by name or abbreviation…",
  clearSearch: "Clear search",
  filterLegend: "Show metrics",
  allFilter: "All",
  reviewFilter: "Review",
  meetsFilter: "Meets",
  unassessedFilter: "No target",
  domainLabel: "Type",
  allDomains: "All checks",
  calculationChecks: "Calculation checks",
  calculationChecksHelp: "Did the calculation run reliably?",
  referenceComparisons: "Reference comparisons",
  referenceComparisonsHelp: "How do simulation values compare with broad adult research ranges?",
  sectionLabel: "Area",
  allSections: "All areas",
  overallCirculation: "Overall circulation",
  valveFlow: "Valves & flow",
  valveFlowHelp: "Flow values from one simulated heartbeat. No comparison targets are assigned yet.",
  waveforms: "Waveforms",
  waveformsHelp: "Shows whether one heartbeat of waveform data is available. Waveform shape is not assessed yet.",
  technicalDetails: "Technical details",
  closeDetails: "Close details",
  metricsShown: "metrics shown",
  skipToMetrics: "Skip to metric results",
  noMatches: "No matching metrics",
  noMatchesHint: "Try another term or clear the filters.",
  noChecksYet: "No checks are available yet",
  noChecksYetHint:
    "This surface has no connected Studio V&V report. Live simulation and strict settlement are separate.",
  clearFilters: "Clear filters",
  noReviewItems: "Nothing needs review in the checks performed.",
  checkedAt: "Checked",
  simulationValue: "Simulation value",
  referenceRange: "Reference range",
  noComparisonTarget: "No comparison target is assigned.",
  howToRead: "How to read this",
  checkDetails: "Check details",
  whyThisRange: "Why this range?",
  sources: "Sources",
  opensNewTab: "opens in a new tab",
  checksPerformed: "Checks performed",
  referenceSet: "Reference set",
  reproducibilityDetails: "Reproducibility IDs",
  limitations: "What these checks do not claim",
  notAvailable: "Not available",
  notCheckedStatus: "Not checked",
  checkingStatus: "Checking…",
  noReviewStatus: "No items need review",
  notAssessedStatus: "Some comparisons could not be assessed",
  needsReviewStatus: "need review",
  calculationErrorStatus: "Calculation error",
  passStatus: "Pass",
  reviewStatus: "Review",
  notRunStatus: "Not run",
  inRangeStatus: "In range",
  outsideRangeStatus: "Outside range",
  expectedStatus: "Expected",
  noTargetStatus: "No target",
  unavailableStatus: "Unavailable",
  calculationPassMeaning:
    "The equations met this numerical tolerance.",
  calculationErrorMeaning:
    "The calculation did not meet this numerical check. Review it before interpreting the result.",
  calculationMeaning:
    "Calculation checks test numerical reliability. They do not mean the physiology is normal.",
  referenceMeaning:
    "This compares a simulation with a broad adult research range. It is not a patient measurement or diagnosis.",
  inRangeMeaning: "The simulation value is inside the selected reference range.",
  aboveRangeMeaning: "The simulation value is above the selected reference range.",
  belowRangeMeaning: "The simulation value is below the selected reference range.",
  outsideRangeMeaning: "The simulation value is outside the selected reference range.",
  expectedMeaning: "The value matches the selected scenario-specific expectation.",
  noTargetMeaning:
    "This value is available, but no comparison range is assigned.",
  unavailableMeaning:
    "This value could not be calculated from the available heartbeat data.",
  fullSuiteRunningStatus: "Additional checks running",
  fullSuiteCompleteStatus: "Additional checks complete",
  fullSuiteUnavailableStatus: "Additional checks unavailable",
  fullSuiteNotRunStatus: "Additional checks not run",
};

const JAPANESE_COPY: ScientificProductEvidencePageCopyV1 = {
  ...DEFAULT_COPY,
  title: "モデルの確認",
  subtitle: "シミュレーション値を参考範囲と比べます。",
  scenarioPicker: "シナリオ",
  currentSessionGroup: "現在のセッション",
  presetsGroup: "プリセット",
  myScenariosGroup: "マイシナリオ",
  backToWorkbench: "ワークベンチに戻る",
  save: "保存",
  saving: "保存中…",
  openInWorkbench: "コピーを開く",
  deleteScenario: "保存済みシナリオを削除",
  searchLabel: "指標を検索",
  searchPlaceholder: "指標名・略語で検索…",
  clearSearch: "検索を消去",
  filterLegend: "表示する指標",
  allFilter: "すべて",
  reviewFilter: "要確認",
  meetsFilter: "基準内",
  unassessedFilter: "基準なし",
  domainLabel: "種類",
  allDomains: "すべての確認",
  calculationChecks: "計算チェック",
  calculationChecksHelp: "計算自体を信頼できるかを確認します。",
  referenceComparisons: "参考範囲との比較",
  referenceComparisonsHelp: "シミュレーション値を成人研究の広い参考範囲と比べます。",
  sectionLabel: "領域",
  allSections: "すべての領域",
  overallCirculation: "循環全体",
  valveFlow: "弁と血流",
  valveFlowHelp: "シミュレーション1拍分の弁通過血流です。比較基準はまだ設定していません。",
  waveforms: "波形",
  waveformsHelp: "1拍分の波形データがあるかを示します。波形の形はまだ判定していません。",
  technicalDetails: "技術情報",
  closeDetails: "詳細を閉じる",
  metricsShown: "件を表示",
  skipToMetrics: "指標一覧へ移動",
  noMatches: "一致する指標はありません",
  noMatchesHint: "別の語で検索するか、絞り込みを解除してください。",
  noChecksYet: "確認結果はまだありません",
  noChecksYetHint:
    "この画面には Studio V&V レポートがまだ接続されていません。ライブ計算と厳密収束は別に動作します。",
  clearFilters: "絞り込みを解除",
  noReviewItems: "実行したチェックに要確認の項目はありません。",
  checkedAt: "確認日時",
  simulationValue: "シミュレーション値",
  referenceRange: "参考範囲",
  noComparisonTarget: "比較する基準範囲は設定されていません。",
  howToRead: "結果の見方",
  checkDetails: "確認内容",
  whyThisRange: "この範囲の根拠",
  sources: "出典",
  opensNewTab: "新しいタブで開きます",
  checksPerformed: "実行した確認",
  referenceSet: "比較対象",
  reproducibilityDetails: "再現性のためのID",
  limitations: "この確認で保証しないこと",
  notAvailable: "利用できません",
  notCheckedStatus: "未確認",
  checkingStatus: "確認中…",
  noReviewStatus: "要確認項目なし",
  notAssessedStatus: "未評価の比較があります",
  needsReviewStatus: "件の要確認",
  calculationErrorStatus: "計算エラー",
  passStatus: "通過",
  reviewStatus: "要確認",
  notRunStatus: "未実行",
  inRangeStatus: "範囲内",
  outsideRangeStatus: "範囲外",
  expectedStatus: "想定内",
  noTargetStatus: "基準なし",
  unavailableStatus: "値なし",
  calculationPassMeaning:
    "方程式の誤差が、この数値チェックの許容範囲内でした。",
  calculationErrorMeaning:
    "この数値チェックを満たしていません。結果を解釈する前に確認してください。",
  calculationMeaning:
    "計算チェックは数値的な信頼性を確認するもので、生理学的な正常を示すものではありません。",
  referenceMeaning:
    "成人研究の広い参考範囲との比較です。患者の実測値や診断ではありません。",
  inRangeMeaning: "シミュレーション値は、選択した参考範囲内です。",
  aboveRangeMeaning: "シミュレーション値は、選択した参考範囲より高い値です。",
  belowRangeMeaning: "シミュレーション値は、選択した参考範囲より低い値です。",
  outsideRangeMeaning: "シミュレーション値は、選択した参考範囲外です。",
  expectedMeaning: "選択したシナリオ固有の想定と一致しています。",
  noTargetMeaning:
    "値はありますが、比較する基準範囲は設定されていません。",
  unavailableMeaning:
    "この拍動データから値を計算できませんでした。",
  fullSuiteRunningStatus: "追加確認を実行中",
  fullSuiteCompleteStatus: "追加確認済み",
  fullSuiteUnavailableStatus: "追加確認を利用できません",
  fullSuiteNotRunStatus: "追加確認は未実行",
};

const SCENARIO_GROUP_ORDER: readonly ScientificProductEvidenceScenarioGroupV1[] = [
  "current-session",
  "presets",
  "my-scenarios",
];

const GROUP_ORDER: readonly ScientificProductEvidenceMetricSectionV1[] = [
  "verification",
  "overall",
  "valve-flow",
  "waveform",
];

export function ScientificProductEvidencePageV1({
  currentSessions,
  presets,
  savedScenarios,
  selectedSubjectKey,
  selectedReport,
  onSelect,
  onBack,
  onSaveCurrent,
  onOpenCurrent,
  onOpenPreset,
  onOpenSaved,
  onDeleteSaved,
  saveDisabled = false,
  savePending = false,
  saveDisabledReason,
  openInWorkbenchDisabled = false,
  deleteDisabled = false,
  locale = "en",
  initialFilter = "all",
  labels,
  className = "",
}: ScientificProductEvidencePageV1Props) {
  const language = locale.toLocaleLowerCase().startsWith("ja") ? "ja" : "en";
  const copy = React.useMemo(
    () => ({ ...(language === "ja" ? JAPANESE_COPY : DEFAULT_COPY), ...labels }),
    [labels, language],
  );
  const scenarios: readonly GroupedEvidenceSubjectV1[] = React.useMemo(() => [
    ...currentSessions.map((subject) => ({ ...subject, group: "current-session" as const })),
    ...presets.map((subject) => ({ ...subject, group: "presets" as const })),
    ...savedScenarios.map((subject) => ({ ...subject, group: "my-scenarios" as const })),
  ], [currentSessions, presets, savedScenarios]);
  const selectedScenario = scenarios.find(({ key }) => key === selectedSubjectKey);
  const selectedGroup = selectedScenario?.group ?? null;
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ScientificProductEvidenceMetricFilterV1>(initialFilter);
  const [domain, setDomain] = React.useState<"all" | ScientificProductEvidenceMetricDomainV1>("all");
  const [section, setSection] = React.useState<"all" | ScientificProductEvidenceMetricSectionV1>("all");
  const [detail, setDetail] = React.useState<DetailSelectionV1 | null>(null);
  const [compactViewport, setCompactViewport] = React.useState(false);
  const lastTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const detailHeadingRef = React.useRef<HTMLHeadingElement | null>(null);

  React.useEffect(() => setFilter(initialFilter), [initialFilter]);
  React.useEffect(() => setDetail(null), [selectedSubjectKey]);
  React.useEffect(() => {
    const media = globalThis.matchMedia?.("(max-width: 1023px)");
    if (media === undefined) return undefined;
    const update = () => setCompactViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const metrics = React.useMemo(
    () => createScientificProductEvidenceExplorerMetricsV1(selectedReport, locale),
    [locale, selectedReport],
  );
  const counts = React.useMemo(
    () => scientificProductEvidenceMetricCountsV1(metrics),
    [metrics],
  );
  const visibleMetrics = React.useMemo(
    () => filterScientificProductEvidenceExplorerMetricsV1(metrics, {
      query,
      filter,
      domain,
      section,
    }),
    [domain, filter, metrics, query, section],
  );
  const selectedMetric = detail?.kind === "metric"
    ? metrics.find(({ key }) => key === detail.metricKey) ?? null
    : null;

  React.useEffect(() => {
    if (detail?.kind === "metric" && selectedMetric === null) setDetail(null);
  }, [detail, selectedMetric]);

  const closeDetail = React.useCallback(() => {
    setDetail(null);
    globalThis.requestAnimationFrame?.(() => {
      const fallback = lastTriggerRef.current?.isConnected
        ? lastTriggerRef.current
        : searchInputRef.current;
      fallback?.focus();
    });
  }, []);

  React.useEffect(() => {
    if (detail === null) return undefined;
    globalThis.requestAnimationFrame?.(() => detailHeadingRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDetail();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDetail, detail]);

  const openMetric = (
    event: React.MouseEvent<HTMLButtonElement>,
    metricKey: string,
  ) => {
    lastTriggerRef.current = event.currentTarget;
    setDetail(Object.freeze({ kind: "metric", metricKey }));
  };
  const openTechnicalDetails = (event: React.MouseEvent<HTMLButtonElement>) => {
    lastTriggerRef.current = event.currentTarget;
    setDetail(Object.freeze({ kind: "technical" }));
  };
  const openSelectedInWorkbench = () => {
    if (selectedGroup === "presets") onOpenPreset(selectedSubjectKey);
    else if (selectedGroup === "my-scenarios") onOpenSaved(selectedSubjectKey);
    else if (selectedGroup === "current-session") onOpenCurrent(selectedSubjectKey);
  };
  const clearFilters = () => {
    setQuery("");
    setFilter("all");
    setDomain("all");
    setSection("all");
    globalThis.requestAnimationFrame?.(() => searchInputRef.current?.focus());
  };
  const statusSummary = pageStatusSummaryV1(selectedReport.status, counts.review, copy);
  const liveMessage = language === "ja"
    ? `${metrics.length}件中${visibleMetrics.length}件を表示`
    : `${visibleMetrics.length} of ${metrics.length} metrics shown`;
  const detailOpen = detail !== null;
  const detailTitle = detail?.kind === "metric"
    ? selectedMetric?.fullLabel ?? copy.checkDetails
    : copy.technicalDetails;

  return (
    <main
      className={`relative min-h-full overflow-y-auto bg-wb-app text-wb-text ${className}`}
      data-testid="scientific-product-evidence-page-v1"
      data-evidence-page-status={selectedReport.status}
      data-selected-subject-key={selectedSubjectKey}
      data-report-subject-key={selectedReport.subjectKey}
    >
      <div inert={compactViewport && detailOpen ? true : undefined}>
        <header className="sticky top-0 z-30 border-b border-wb-line bg-wb-panel/95 backdrop-blur-xl">
          <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className={iconButtonClassNameV1()}
                aria-label={copy.backToWorkbench}
                title={copy.backToWorkbench}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="mr-auto min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight text-wb-text sm:text-lg">
                  {copy.title}
                </h1>
                <p className="mt-0.5 hidden text-xs text-wb-subtle sm:block">{copy.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedGroup === "current-session" && (
                  <button
                    type="button"
                    onClick={onSaveCurrent}
                    disabled={saveDisabled || savePending}
                    title={saveDisabled ? saveDisabledReason : undefined}
                    aria-label={savePending ? copy.saving : copy.save}
                    aria-busy={savePending}
                    className={secondaryButtonClassNameV1()}
                  >
                    {savePending
                      ? <LoaderCircle className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span className="hidden sm:inline">{savePending ? copy.saving : copy.save}</span>
                  </button>
                )}
                {selectedGroup === "my-scenarios" && (
                  <button
                    type="button"
                    onClick={() => onDeleteSaved(selectedSubjectKey)}
                    disabled={deleteDisabled}
                    className={iconButtonClassNameV1(true)}
                    aria-label={copy.deleteScenario}
                    title={copy.deleteScenario}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {selectedGroup !== null && selectedGroup !== "current-session" && (
                  <button
                    type="button"
                    onClick={openSelectedInWorkbench}
                    disabled={openInWorkbenchDisabled}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-wb-primary px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-100 hover:bg-wb-primary-hover active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent motion-reduce:transform-none"
                  >
                    {copy.openInWorkbench}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(14rem,22rem)_minmax(16rem,1fr)_auto] lg:items-end">
              <label className="min-w-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
                  {copy.scenarioPicker}
                </span>
                <select
                  value={selectedSubjectKey}
                  onChange={(event) => onSelect(event.currentTarget.value)}
                  className={selectClassNameV1()}
                >
                  {SCENARIO_GROUP_ORDER.map((group) => {
                    const options = scenarios.filter((scenario) => scenario.group === group);
                    if (options.length === 0) return null;
                    return (
                      <optgroup key={group} label={scenarioGroupLabelV1(group, copy)}>
                        {options.map((scenario) => (
                          <option key={scenario.key} value={scenario.key} disabled={scenario.disabled}>
                            {scenario.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </label>

              <form
                role="search"
                aria-label={copy.searchLabel}
                onSubmit={(event) => event.preventDefault()}
                className="min-w-0"
              >
                <label htmlFor="scientific-evidence-metric-search-v1" className="sr-only">
                  {copy.searchLabel}
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wb-subtle" aria-hidden="true" />
                  <input
                    ref={searchInputRef}
                    id="scientific-evidence-metric-search-v1"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && query !== "") {
                        event.preventDefault();
                        event.stopPropagation();
                        setQuery("");
                      }
                    }}
                    placeholder={copy.searchPlaceholder}
                    className="h-10 w-full rounded-lg border border-wb-line bg-wb-input pl-9 pr-9 text-sm text-wb-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-wb-subtle focus:border-wb-accent focus-visible:ring-1 focus-visible:ring-wb-accent motion-reduce:transition-none"
                  />
                  {query !== "" && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                      aria-label={copy.clearSearch}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </form>

              <button
                type="button"
                onClick={openTechnicalDetails}
                aria-expanded={detail?.kind === "technical"}
                aria-controls="scientific-evidence-detail-surface-v1"
                aria-haspopup={compactViewport ? "dialog" : undefined}
                className={secondaryButtonClassNameV1()}
                data-testid="scientific-product-technical-details-trigger-v1"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.technicalDetails}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <fieldset className="flex min-w-0 items-center gap-1 overflow-x-auto" aria-label={copy.filterLegend}>
                <legend className="sr-only">{copy.filterLegend}</legend>
                {([
                  ["all", copy.allFilter],
                  ["review", copy.reviewFilter],
                  ["meets", copy.meetsFilter],
                  ["unassessed", copy.unassessedFilter],
                ] as const).map(([value, label]) => (
                  <FilterRadioV1
                    key={value}
                    value={value}
                    label={label}
                    count={counts[value]}
                    selected={filter === value}
                    onChange={setFilter}
                  />
                ))}
              </fieldset>

              <label className="ml-auto flex items-center gap-1.5 text-[11px] text-wb-subtle">
                <span className="hidden sm:inline">{copy.domainLabel}</span>
                <select
                  value={domain}
                  onChange={(event) => {
                    const next = event.currentTarget.value as "all" | ScientificProductEvidenceMetricDomainV1;
                    setDomain(next);
                    if (next === "verification") setSection("all");
                  }}
                  className={compactSelectClassNameV1()}
                  aria-label={copy.domainLabel}
                >
                  <option value="all">{copy.allDomains}</option>
                  <option value="verification">{copy.calculationChecks}</option>
                  <option value="validation">{copy.referenceComparisons}</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-[11px] text-wb-subtle">
                <span className="hidden sm:inline">{copy.sectionLabel}</span>
                <select
                  value={section}
                  disabled={domain === "verification"}
                  onChange={(event) => setSection(
                    event.currentTarget.value as "all" | ScientificProductEvidenceMetricSectionV1,
                  )}
                  className={compactSelectClassNameV1()}
                  aria-label={copy.sectionLabel}
                >
                  <option value="all">{copy.allSections}</option>
                  <option value="overall">{copy.overallCirculation}</option>
                  <option value="valve-flow">{copy.valveFlow}</option>
                  <option value="waveform">{copy.waveforms}</option>
                </select>
              </label>

              <span className="text-[11px] tabular-nums text-wb-subtle" aria-hidden="true">
                {visibleMetrics.length}/{metrics.length}
              </span>
            </div>

            <div className="mt-2 flex min-h-5 items-center gap-2 text-xs">
              <PageStatusSummaryV1
                status={selectedReport.status}
                label={statusSummary}
              />
            </div>
          </div>
        </header>

        <a
          href="#scientific-evidence-metric-results-v1"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-wb-panel focus:px-3 focus:py-2 focus:text-sm focus:text-wb-text focus:ring-2 focus:ring-wb-accent"
        >
          {copy.skipToMetrics}
        </a>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusSummary}. {liveMessage}
        </div>

        <div
          id="scientific-evidence-metric-results-v1"
          aria-busy={selectedReport.status === "checking"}
          className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
          tabIndex={-1}
        >
          {visibleMetrics.length === 0 ? (
            <EmptyResultsV1
              hasMetrics={metrics.length > 0}
              query={query}
              reviewFilterActive={filter === "review"}
              copy={copy}
              onClear={clearFilters}
            />
          ) : (
            <div className="space-y-8">
              {GROUP_ORDER.map((group) => {
                const groupMetrics = visibleMetrics.filter(({ section: candidate }) => candidate === group);
                if (groupMetrics.length === 0) return null;
                return (
                  <MetricGroupV1
                    key={group}
                    group={group}
                    metrics={groupMetrics}
                    selectedMetricKey={selectedMetric?.key ?? null}
                    copy={copy}
                    locale={locale}
                    compact={compactViewport}
                    onOpenMetric={openMetric}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detail !== null && (
        <DetailSurfaceV1
          compact={compactViewport}
          title={detailTitle}
          headingRef={detailHeadingRef}
          onClose={closeDetail}
          onKeyDown={compactViewport ? trapFocusV1 : undefined}
          copy={copy}
        >
          {detail.kind === "metric" && selectedMetric !== null ? (
            <MetricInspectorV1
              metric={selectedMetric}
              references={selectedReport.validation.references ?? []}
              copy={copy}
              locale={locale}
            />
          ) : (
            <TechnicalDetailsV1 report={selectedReport} copy={copy} />
          )}
        </DetailSurfaceV1>
      )}
    </main>
  );
}

function FilterRadioV1({
  value,
  label,
  count,
  selected,
  onChange,
}: Readonly<{
  value: ScientificProductEvidenceMetricFilterV1;
  label: string;
  count: number;
  selected: boolean;
  onChange: (value: ScientificProductEvidenceMetricFilterV1) => void;
}>) {
  return (
    <label className="shrink-0">
      <input
        type="radio"
        name="scientific-evidence-status-filter-v1"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-wb-subtle transition-[background-color,color,transform] duration-100 hover:bg-wb-hover hover:text-wb-muted active:scale-[0.985] peer-checked:bg-wb-active peer-checked:text-wb-text peer-focus-visible:ring-2 peer-focus-visible:ring-wb-accent motion-reduce:transform-none">
        {label}
        <span className="tabular-nums opacity-65">{count}</span>
      </span>
    </label>
  );
}

function PageStatusSummaryV1({
  status,
  label,
}: Readonly<{
  status: ScientificProductEvidencePageStatusV1;
  label: string;
}>) {
  const presentation = pageStatusPresentationV1(status, label);
  const Icon = presentation.icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 font-medium ${toneTextClassNameV1(presentation.tone)}`}>
      <Icon className={`h-3.5 w-3.5 ${presentation.iconMotionClassName ?? ""}`} aria-hidden="true" />
      {presentation.label}
    </span>
  );
}

function MetricGroupV1({
  group,
  metrics,
  selectedMetricKey,
  copy,
  locale,
  compact,
  onOpenMetric,
}: Readonly<{
  group: ScientificProductEvidenceMetricSectionV1;
  metrics: readonly ScientificProductEvidenceExplorerMetricV1[];
  selectedMetricKey: string | null;
  copy: ScientificProductEvidencePageCopyV1;
  locale: string;
  compact: boolean;
  onOpenMetric: (event: React.MouseEvent<HTMLButtonElement>, metricKey: string) => void;
}>) {
  const headingId = `scientific-evidence-group-${group}`;
  const isVerification = group === "verification";
  return (
    <section
      aria-labelledby={headingId}
      data-evidence-section={group}
      data-validation-section={isVerification ? undefined : group}
    >
      <div className="mb-2 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 id={headingId} className="text-sm font-semibold tracking-tight text-wb-text">
            {groupLabelV1(group, copy)}
          </h2>
          <p className="mt-0.5 text-[11px] leading-4 text-wb-subtle">
            {groupHelpV1(group, copy)}
          </p>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-wb-subtle">{metrics.length}</span>
      </div>
      <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-1 p-0">
        {metrics.map((metric) => (
          <li key={metric.key} className="min-w-0">
            <MetricTileV1
              metric={metric}
              selected={selectedMetricKey === metric.key}
              copy={copy}
              locale={locale}
              compact={compact}
              onOpen={onOpenMetric}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function MetricTileV1({
  metric,
  selected,
  copy,
  locale,
  compact,
  onOpen,
}: Readonly<{
  metric: ScientificProductEvidenceExplorerMetricV1;
  selected: boolean;
  copy: ScientificProductEvidencePageCopyV1;
  locale: string;
  compact: boolean;
  onOpen: (event: React.MouseEvent<HTMLButtonElement>, metricKey: string) => void;
}>) {
  const status = metricStatusPresentationV1(metric, copy);
  const Icon = status.icon;
  const value = metricDisplayValueV1(metric, locale);
  const visuallyShowStatus = metric.source.kind === "verification"
    ? metric.source.effectiveStatus !== "passed"
    : metric.source.effectiveStatus !== "within-reference";
  const tileId = React.useId();
  const labelId = `${tileId}-label`;
  const valueId = `${tileId}-value`;
  const statusId = `${tileId}-status`;
  const dataKind = metric.domain === "verification" && metric.source.effectiveStatus === "error"
    ? "verification-error"
    : metric.domain === "validation" && metric.source.effectiveStatus === "finding"
      ? "validation-finding"
      : `${metric.domain}-metric`;
  return (
    <button
      type="button"
      onClick={(event) => onOpen(event, metric.key)}
      aria-labelledby={`${labelId} ${valueId}`}
      aria-describedby={statusId}
      aria-expanded={selected}
      aria-controls="scientific-evidence-detail-surface-v1"
      aria-haspopup={compact ? "dialog" : undefined}
      className={`group flex min-h-[5.5rem] w-full flex-col rounded-lg px-3 py-3 text-left outline-none transition-[background-color,color,transform] duration-100 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-wb-accent motion-reduce:transform-none ${selected ? "bg-wb-active" : "bg-transparent hover:bg-wb-hover"}`}
      data-testid="scientific-product-metric-tile-v1"
      data-evidence-domain={metric.domain}
      data-evidence-section={metric.section}
      data-effective-status={metric.source.effectiveStatus}
      data-filter-bucket={metric.filter}
      data-evidence-kind={dataKind}
    >
      <span className="flex w-full min-w-0 items-start justify-between gap-2">
        <span id={labelId} className="truncate text-[11px] font-semibold leading-4 text-wb-muted">
          {metric.shortLabel}
          <span className="sr-only">, {metric.fullLabel}</span>
        </span>
        <span className={toneTextClassNameV1(status.tone)} aria-hidden="true">
          <Icon className={`h-3.5 w-3.5 ${status.iconMotionClassName ?? ""}`} />
        </span>
      </span>
      <span id={valueId} className="mt-2 flex min-w-0 items-baseline gap-1.5">
        <span className={`min-w-0 truncate font-semibold tabular-nums tracking-tight text-wb-text ${value.numeric ? "text-xl" : "text-sm"}`}>
          {value.primary}
        </span>
        {value.unit && <span className="truncate text-[10px] font-medium text-wb-subtle">{value.unit}</span>}
      </span>
      <ReferenceBandV1 metric={metric} />
      <span
        id={statusId}
        className={visuallyShowStatus
          ? `mt-auto pt-2 text-[10px] font-medium ${toneTextClassNameV1(status.tone)}`
          : "sr-only"}
      >
        {status.label}
      </span>
    </button>
  );
}

function ReferenceBandV1({
  metric,
}: Readonly<{ metric: ScientificProductEvidenceExplorerMetricV1 }>) {
  const lower = metric.referenceLowerInclusive;
  const upper = metric.referenceUpperInclusive;
  const value = metric.numericValue;
  if (
    metric.domain === "verification"
    || lower === null
    || upper === null
    || value === null
    || upper <= lower
  ) return null;
  const range = upper - lower;
  const displayMin = lower - range * 0.25;
  const displayMax = upper + range * 0.25;
  const position = Math.max(0, Math.min(100, ((value - displayMin) / (displayMax - displayMin)) * 100));
  return (
    <span className="relative mt-2 block h-1 rounded-full bg-wb-line" aria-hidden="true">
      <span className="absolute inset-y-0 left-[16.667%] right-[16.667%] rounded-full bg-emerald-500/35" />
      <span
        className="absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current text-wb-text"
        style={{ left: `${position}%` }}
      />
    </span>
  );
}

function EmptyResultsV1({
  hasMetrics,
  query,
  reviewFilterActive,
  copy,
  onClear,
}: Readonly<{
  hasMetrics: boolean;
  query: string;
  reviewFilterActive: boolean;
  copy: ScientificProductEvidencePageCopyV1;
  onClear: () => void;
}>) {
  const noReviewResults = hasMetrics && reviewFilterActive && query === "";
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      {noReviewResults
        ? <CheckCircle2 className="h-6 w-6 text-emerald-400" aria-hidden="true" />
        : <CircleDashed className="h-6 w-6 text-wb-subtle" aria-hidden="true" />}
      <h2 className="mt-3 text-sm font-semibold text-wb-text">
        {!hasMetrics ? copy.noChecksYet : noReviewResults ? copy.noReviewItems : copy.noMatches}
      </h2>
      <p className="mt-1 text-xs leading-5 text-wb-subtle">
        {!hasMetrics ? copy.noChecksYetHint : copy.noMatchesHint}
      </p>
      {hasMetrics && (
        <button type="button" onClick={onClear} className={`${secondaryButtonClassNameV1()} mt-4`}>
          {copy.clearFilters}
        </button>
      )}
    </section>
  );
}

function DetailSurfaceV1({
  compact,
  title,
  headingRef,
  onClose,
  onKeyDown,
  copy,
  children,
}: Readonly<{
  compact: boolean;
  title: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
  copy: ScientificProductEvidencePageCopyV1;
  children: React.ReactNode;
}>) {
  return (
    <>
      {compact && (
        <div
          className="fixed inset-0 z-40 bg-black/45"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        id="scientific-evidence-detail-surface-v1"
        role={compact ? "dialog" : undefined}
        aria-modal={compact ? true : undefined}
        aria-labelledby="scientific-evidence-detail-heading-v1"
        onKeyDown={onKeyDown}
        className={compact
          ? "fixed inset-x-0 bottom-0 z-50 flex max-h-[82dvh] flex-col rounded-t-2xl border-t border-wb-line bg-wb-panel shadow-2xl"
          : "fixed inset-y-0 right-0 z-50 flex w-[24rem] max-w-[calc(100vw-2rem)] flex-col border-l border-wb-line bg-wb-panel shadow-2xl"}
      >
        {compact && <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-wb-line-strong" aria-hidden="true" />}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2
            ref={headingRef}
            id="scientific-evidence-detail-heading-v1"
            tabIndex={-1}
            className="text-xs font-semibold text-wb-muted outline-none"
          >
            <span className="sr-only">{title}</span>
            <span aria-hidden="true">{copy.title}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={iconButtonClassNameV1()}
            aria-label={copy.closeDetails}
            title={copy.closeDetails}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">{children}</div>
      </aside>
    </>
  );
}

function MetricInspectorV1({
  metric,
  references,
  copy,
  locale,
}: Readonly<{
  metric: ScientificProductEvidenceExplorerMetricV1;
  references: readonly ScientificProductEvidenceReferenceV1[];
  copy: ScientificProductEvidencePageCopyV1;
  locale: string;
}>) {
  const status = metricStatusPresentationV1(metric, copy);
  const Icon = status.icon;
  const value = metricDisplayValueV1(metric, locale);
  const linkedReferences = references.filter(({ id }) => metric.referenceIds.includes(id));
  const statusMeaning = metricStatusMeaningV1(metric, copy);
  return (
    <article data-testid="scientific-product-metric-inspector-v1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
        {metric.domain === "verification" ? copy.calculationChecks : copy.referenceComparisons}
      </p>
      <h3 className="mt-2 text-xl font-semibold leading-7 tracking-tight text-wb-text">
        {metric.fullLabel}
      </h3>
      {metric.fullLabel !== metric.technicalLabel && (
        <p className="mt-1 text-[11px] text-wb-subtle">{metric.technicalLabel}</p>
      )}
      <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${toneTextClassNameV1(status.tone)}`}>
        <Icon className={`h-3.5 w-3.5 ${status.iconMotionClassName ?? ""}`} aria-hidden="true" />
        {status.label}
      </div>

      <section className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-wb-subtle">
          {copy.simulationValue}
        </p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className={`font-semibold tabular-nums tracking-tight text-wb-text ${value.numeric ? "text-3xl" : "text-xl"}`}>
            {value.primary}
          </span>
          {value.unit && <span className="text-sm font-medium text-wb-subtle">{value.unit}</span>}
        </p>
        <div className="mt-3"><ReferenceBandV1 metric={metric} /></div>
      </section>

      <section className="mt-6 rounded-xl bg-wb-strip px-4 py-3">
        <h4 className="text-xs font-semibold text-wb-text">{copy.howToRead}</h4>
        <p className="mt-1.5 text-xs leading-5 text-wb-muted">{metric.plainExplanation}</p>
        <p className={`mt-3 text-xs font-medium leading-5 ${toneTextClassNameV1(status.tone)}`}>
          {statusMeaning}
        </p>
        {(metric.domain === "verification" || metric.referenceRange !== null) && (
          <p className="mt-2 text-[11px] leading-5 text-wb-subtle">
            {metric.domain === "verification" ? copy.calculationMeaning : copy.referenceMeaning}
          </p>
        )}
      </section>

      <section className="mt-6">
        <h4 className="text-xs font-semibold text-wb-text">{copy.referenceRange}</h4>
        <p className="mt-1 text-sm font-medium tabular-nums text-wb-muted">
          {metric.referenceRange ?? copy.noComparisonTarget}
        </p>
      </section>

      {(metric.detail || metric.referenceContext) && (
        <details className="mt-6 rounded-lg bg-wb-strip px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-wb-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
            {copy.checkDetails}
          </summary>
          <div className="mt-3 border-t border-wb-line pt-3">
            {metric.detail && <p className="text-xs leading-5 text-wb-muted">{metric.detail}</p>}
            {metric.referenceContext && <p className="mt-2 text-xs leading-5 text-wb-subtle">{metric.referenceContext}</p>}
          </div>
        </details>
      )}

      {linkedReferences.length > 0 && (
        <ReferenceLinksV1 references={linkedReferences} copy={copy} />
      )}
    </article>
  );
}

function TechnicalDetailsV1({
  report,
  copy,
}: Readonly<{
  report: ScientificProductEvidenceSelectedReportV1;
  copy: ScientificProductEvidencePageCopyV1;
}>) {
  const fullSuite = fullSuiteStatusPresentationV1(report.fullSuiteStatus.status, copy);
  const FullSuiteIcon = fullSuite.icon;
  const provenance: readonly ScientificProductEvidenceProvenanceItemV1[] = [
    {
      id: "evidence-source",
      label: "Evidence source",
      value: report.evidenceSource,
    },
    {
      id: "control-state",
      label: "Control state",
      value: report.controlStateSha256 ?? copy.notAvailable,
      monospace: report.controlStateSha256 !== null,
    },
    {
      id: "parameter-epoch",
      label: "Parameter epoch",
      value: report.parameterEpoch === null ? copy.notAvailable : String(report.parameterEpoch),
    },
    ...(report.provenanceItems ?? []),
  ];
  return (
    <article data-testid="scientific-product-technical-details-v1">
      <h3 className="text-xl font-semibold tracking-tight text-wb-text">{copy.technicalDetails}</h3>
      {report.checkedAt && (
        <p className="mt-2 text-xs text-wb-subtle">{copy.checkedAt}: {report.checkedAt}</p>
      )}

      <section className="mt-6">
        <h4 className="text-xs font-semibold text-wb-text">{copy.checksPerformed}</h4>
        <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${toneTextClassNameV1(fullSuite.tone)}`}>
          <FullSuiteIcon className={`h-3.5 w-3.5 ${fullSuite.iconMotionClassName ?? ""}`} aria-hidden="true" />
          {fullSuite.label}
        </div>
        <p className="mt-2 text-xs leading-5 text-wb-subtle">{report.fullSuiteStatus.detail}</p>
      </section>

      <section className="mt-6">
        <h4 className="text-xs font-semibold text-wb-text">{copy.referenceSet}</h4>
        <p className="mt-2 text-sm font-medium text-wb-muted">{report.validation.healthyReference.title}</p>
        <p className="mt-1 text-xs leading-5 text-wb-subtle">{report.validation.healthyReference.description}</p>
        {report.validation.healthyReference.attributes.length > 0 && (
          <dl className="mt-3 space-y-2">
            {report.validation.healthyReference.attributes.map((attribute) => (
              <div key={attribute.id} className="flex items-start justify-between gap-4 text-xs">
                <dt className="text-wb-subtle">{attribute.label}</dt>
                <dd className="text-right font-medium text-wb-muted">{attribute.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {(report.validation.references?.length ?? 0) > 0 && (
        <ReferenceLinksV1 references={report.validation.references ?? []} copy={copy} />
      )}

      <details className="mt-6 rounded-lg bg-wb-strip px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-wb-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
          {copy.reproducibilityDetails}
        </summary>
        <dl className="mt-3 space-y-3 border-t border-wb-line pt-3">
          {provenance.map((item) => (
            <div key={item.id}>
              <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-wb-subtle">{item.label}</dt>
              <dd className={`mt-1 break-all text-[11px] leading-5 text-wb-muted ${item.monospace ? "font-mono" : ""}`}>
                {item.value}
              </dd>
              {item.detail && <p className="mt-1 text-[11px] leading-4 text-wb-subtle">{item.detail}</p>}
            </div>
          ))}
        </dl>
      </details>

      {(report.claimBoundaries?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h4 className="text-xs font-semibold text-wb-text">{copy.limitations}</h4>
          <ul className="mt-2 space-y-2 text-xs leading-5 text-wb-subtle">
            {report.claimBoundaries?.map((boundary) => <li key={boundary}>— {boundary}</li>)}
          </ul>
        </section>
      )}
    </article>
  );
}

function ReferenceLinksV1({
  references,
  copy,
}: Readonly<{
  references: readonly ScientificProductEvidenceReferenceV1[];
  copy: ScientificProductEvidencePageCopyV1;
}>) {
  return (
    <section className="mt-6">
      <h4 className="text-xs font-semibold text-wb-text">{copy.sources}</h4>
      <ul className="mt-2 space-y-3">
        {references.map((reference) => (
          <li key={reference.id} className="text-[11px] leading-5 text-wb-subtle">
            <p className="font-medium text-wb-muted">{reference.label}</p>
            {reference.href ? (
              <a
                href={reference.href}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-start gap-1 underline decoration-wb-line-strong underline-offset-2 hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                <span>{reference.citation}</span>
                <ExternalLink className="mt-1 h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span className="sr-only">, {copy.opensNewTab}</span>
              </a>
            ) : <p className="mt-0.5">{reference.citation}</p>}
            {reference.note && <p className="mt-1">{reference.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function metricStatusPresentationV1(
  metric: ScientificProductEvidenceExplorerMetricV1,
  copy: ScientificProductEvidencePageCopyV1,
): StatusPresentationV1 {
  if (metric.source.kind === "verification") {
    const status = metric.source.effectiveStatus;
    if (status === "passed") return { icon: Check, label: copy.passStatus, tone: "success" };
    if (status === "error") return { icon: CircleX, label: copy.calculationErrorStatus, tone: "danger" };
    if (status === "warning") return { icon: CircleAlert, label: copy.reviewStatus, tone: "warning" };
    if (metric.source.item.value?.toLocaleLowerCase().includes("checking")) {
      return {
        icon: LoaderCircle,
        label: copy.checkingStatus,
        tone: "neutral",
        iconMotionClassName: "animate-spin motion-reduce:animate-none",
      };
    }
    return { icon: CircleDashed, label: copy.notRunStatus, tone: "neutral" };
  }
  const status = metric.source.effectiveStatus;
  if (status === "within-reference") return { icon: Check, label: copy.inRangeStatus, tone: "success" };
  if (status === "expected-deviation") return { icon: Info, label: copy.expectedStatus, tone: "info" };
  if (status === "finding") {
    if (metric.numericValue !== null && metric.referenceUpperInclusive !== null
        && metric.numericValue > metric.referenceUpperInclusive) {
      return { icon: ArrowUp, label: copy.outsideRangeStatus, tone: "warning" };
    }
    if (metric.numericValue !== null && metric.referenceLowerInclusive !== null
        && metric.numericValue < metric.referenceLowerInclusive) {
      return { icon: ArrowDown, label: copy.outsideRangeStatus, tone: "warning" };
    }
    return { icon: CircleAlert, label: copy.outsideRangeStatus, tone: "warning" };
  }
  return metricHasValueV1(metric)
    ? { icon: CircleDashed, label: copy.noTargetStatus, tone: "neutral" }
    : { icon: Circle, label: copy.unavailableStatus, tone: "neutral" };
}

function metricStatusMeaningV1(
  metric: ScientificProductEvidenceExplorerMetricV1,
  copy: ScientificProductEvidencePageCopyV1,
): string {
  if (metric.source.kind === "verification") {
    if (metric.source.effectiveStatus === "passed") return copy.calculationPassMeaning;
    if (metric.source.effectiveStatus === "error") {
      return copy.calculationErrorMeaning;
    }
    return metric.detail ?? copy.notRunStatus;
  }
  if (metric.source.effectiveStatus === "within-reference") {
    return copy.inRangeMeaning;
  }
  if (metric.source.effectiveStatus === "finding") {
    if (
      metric.numericValue !== null
      && metric.referenceUpperInclusive !== null
      && metric.numericValue > metric.referenceUpperInclusive
    ) return copy.aboveRangeMeaning;
    if (
      metric.numericValue !== null
      && metric.referenceLowerInclusive !== null
      && metric.numericValue < metric.referenceLowerInclusive
    ) return copy.belowRangeMeaning;
    return copy.outsideRangeMeaning;
  }
  if (metric.source.effectiveStatus === "expected-deviation") {
    return copy.expectedMeaning;
  }
  return metricHasValueV1(metric) ? copy.noTargetMeaning : copy.unavailableMeaning;
}

function pageStatusPresentationV1(
  status: ScientificProductEvidencePageStatusV1,
  label: string,
): StatusPresentationV1 {
  if (status === "checking") return {
    icon: LoaderCircle,
    label,
    tone: "neutral",
    iconMotionClassName: "animate-spin motion-reduce:animate-none",
  };
  if (status === "verification-error") return { icon: CircleX, label, tone: "danger" };
  if (status === "findings") return { icon: CircleAlert, label, tone: "warning" };
  if (status === "passed") return { icon: CheckCircle2, label, tone: "success" };
  return { icon: CircleDashed, label, tone: "neutral" };
}

function fullSuiteStatusPresentationV1(
  status: ScientificProductFullSuiteStatusV1,
  copy: ScientificProductEvidencePageCopyV1,
): StatusPresentationV1 {
  if (status === "running") return {
    icon: LoaderCircle,
    label: copy.fullSuiteRunningStatus,
    tone: "neutral",
    iconMotionClassName: "animate-spin motion-reduce:animate-none",
  };
  if (status === "complete") return { icon: Check, label: copy.fullSuiteCompleteStatus, tone: "success" };
  if (status === "unavailable") return { icon: CircleX, label: copy.fullSuiteUnavailableStatus, tone: "danger" };
  return { icon: CircleDashed, label: copy.fullSuiteNotRunStatus, tone: "neutral" };
}

function pageStatusSummaryV1(
  status: ScientificProductEvidencePageStatusV1,
  reviewCount: number,
  copy: ScientificProductEvidencePageCopyV1,
): string {
  if (status === "checking") return copy.checkingStatus;
  if (status === "verification-error") return copy.calculationErrorStatus;
  if (reviewCount > 0) return `${reviewCount} ${copy.needsReviewStatus}`;
  if (status === "idle") return copy.notCheckedStatus;
  if (status === "not-assessed") return copy.notAssessedStatus;
  return copy.noReviewStatus;
}

function metricDisplayValueV1(
  metric: ScientificProductEvidenceExplorerMetricV1,
  locale: string,
): Readonly<{ primary: string; unit: string | null; numeric: boolean }> {
  if (metric.numericValue !== null) {
    const absolute = Math.abs(metric.numericValue);
    const primary = absolute !== 0 && (absolute < 0.001 || absolute >= 10_000)
      ? metric.numericValue.toExponential(2)
      : new Intl.NumberFormat(locale, {
        maximumFractionDigits: absolute < 10 ? 2 : 1,
      }).format(metric.numericValue);
    return Object.freeze({ primary, unit: metric.unit, numeric: true });
  }
  return Object.freeze({ primary: metric.valueText, unit: null, numeric: false });
}

function metricHasValueV1(metric: ScientificProductEvidenceExplorerMetricV1): boolean {
  if (metric.numericValue !== null) return true;
  const normalized = metric.valueText.trim().toLocaleLowerCase();
  return normalized !== ""
    && normalized !== "—"
    && normalized !== "not available"
    && normalized !== "unavailable";
}

function scenarioGroupLabelV1(
  group: ScientificProductEvidenceScenarioGroupV1,
  copy: ScientificProductEvidencePageCopyV1,
): string {
  if (group === "current-session") return copy.currentSessionGroup;
  if (group === "presets") return copy.presetsGroup;
  return copy.myScenariosGroup;
}

function groupLabelV1(
  group: ScientificProductEvidenceMetricSectionV1,
  copy: ScientificProductEvidencePageCopyV1,
): string {
  if (group === "verification") return copy.calculationChecks;
  if (group === "overall") return copy.overallCirculation;
  if (group === "valve-flow") return copy.valveFlow;
  return copy.waveforms;
}

function groupHelpV1(
  group: ScientificProductEvidenceMetricSectionV1,
  copy: ScientificProductEvidencePageCopyV1,
): string {
  if (group === "verification") return copy.calculationChecksHelp;
  if (group === "overall") return copy.referenceComparisonsHelp;
  if (group === "valve-flow") return copy.valveFlowHelp;
  return copy.waveformsHelp;
}

function toneTextClassNameV1(tone: ToneV1): string {
  if (tone === "success") return "text-emerald-400";
  if (tone === "info") return "text-sky-400";
  if (tone === "warning") return "text-wb-warning";
  if (tone === "danger") return "text-wb-danger";
  return "text-wb-subtle";
}

function selectClassNameV1(): string {
  return "h-10 w-full rounded-lg border border-wb-line bg-wb-input px-3 text-sm font-medium text-wb-text outline-none transition-[border-color,box-shadow] duration-150 focus:border-wb-accent focus-visible:ring-1 focus-visible:ring-wb-accent motion-reduce:transition-none";
}

function compactSelectClassNameV1(): string {
  return "h-8 max-w-[11rem] rounded-md border border-wb-line bg-wb-input px-2 text-[11px] font-medium text-wb-muted outline-none transition-[border-color,box-shadow] duration-150 focus:border-wb-accent focus-visible:ring-1 focus-visible:ring-wb-accent disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none";
}

function secondaryButtonClassNameV1(): string {
  return "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-wb-line bg-wb-panel px-3 text-xs font-semibold text-wb-muted transition-[background-color,color,border-color,transform] duration-100 hover:bg-wb-hover hover:text-wb-text active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent motion-reduce:transform-none";
}

function iconButtonClassNameV1(danger = false): string {
  return `inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-[background-color,color,transform] duration-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent motion-reduce:transform-none ${danger ? "text-wb-subtle hover:bg-wb-danger-soft hover:text-wb-danger" : "text-wb-subtle hover:bg-wb-hover hover:text-wb-text"}`;
}

function trapFocusV1(event: React.KeyboardEvent<HTMLElement>): void {
  if (event.key !== "Tab") return;
  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
    "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex='-1'])",
  )).filter((element) => element.offsetParent !== null);
  if (focusable.length === 0) return;
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
  if (event.shiftKey && activeIndex <= 0) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (activeIndex === -1 || activeIndex === focusable.length - 1)) {
    event.preventDefault();
    first.focus();
  }
}
