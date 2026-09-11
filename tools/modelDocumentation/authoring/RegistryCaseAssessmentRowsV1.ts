import type { Locale } from "@/localeRouting";
import type { MainWireStaticCaseFittingResultV1 as Result } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1 as definitions } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { mainWireBaselineGateRoleV1 as role } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineGateRolesV1";
import { MAIN_WIRE_RELAXATION_TAU_POLICY_V1 as tauPolicy } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import type { runMainWireStaticBaselineQualificationGridV1 as baselineGrid } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { mainWireBaselineRowsV1, type BaselineDocumentationRowV1 as Row } from "@/studio/presentation/modelDocumentation/MainWireBaselineDocumentationV1";
import { hfrefRationaleEnglishV1, hfrefSourceEnglishV1 } from "./HfrefCaseDocumentTextV1";

const caseLabels: Record<string, string> = { lvef: "LVEF", lvedvi: "LV EDVI", ci: "CI",
  meanAo: "AoP mean", meanLa: "mean LAP", meanRa: "mean RAP", weissTauMs: "LV τ (Weiss)",
  avEffectiveAreaCm2: "AVA (SV/VTI)", avVmax: "AV Vmax", avBernoulliMeanGradient: "AV mean PG (4v²)", forwardSvi: "Forward SVI" };

/** Case-specific interpretation of actual observations, not an extra gate.
 * Shared by the review dossier and the standalone historical reading. */
export function registryCaseNarrativeV1(result: Result, locale: Locale): readonly string[] {
  if (result.rest.status === "unavailable" || !["as-high-gradient-valve-only-v1", "as-low-flow-reduced-ef-v1"].includes(result.rest.referenceId)) return [];
  if (result.rest.referenceId === "baseline" || result.rest.referenceId === "hfref-chronic-dilated-v1") return [];
  const t = (ja: string, en: string) => locale === "ja" ? ja : en;
  const c = result.candidateInputs, v = result.rest.observation.values;
  const n = (value: number | null | undefined, digits = 1) => value != null && Number.isFinite(value)
    ? value.toFixed(digits) : t("未測定", "unmeasured");
  const area = n(c.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2, 2);
  const active = c.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall;
  const lowFlow = result.rest.referenceId === "as-low-flow-reduced-ef-v1";
  return [
    lowFlow ? t(`拡大した左室の収縮能低下と、最大弁口面積 ${area} cm² の弁狭窄を組み合わせた固定構成です。能動張力の倍率はLV自由壁 ${n(active.LVFW, 2)}、中隔 ${n(active.SEP, 2)}。AMIや経時的なリモデリングを再現したものではありません。`,
      `A fixed dilated LV with maximum aortic area ${area} cm². Active-tension scales: LV free wall ${n(active.LVFW, 2)}, septum ${n(active.SEP, 2)}. These are the actual inputs, not inferred from EF. This is not AMI or a simulated remodeling trajectory.`)
      : t(`採用baselineから最大弁口面積だけを ${area} cm² に変更した比較例です。能動張力の倍率はLV自由壁 ${n(active.LVFW, 2)}、中隔 ${n(active.SEP, 2)}。心筋量を増した慢性肥大や、その適応過程の再現ではありません。`,
      `A fixed, non-remodelled baseline ventricle with maximum aortic area ${area} cm². Active-tension scales: LV free wall ${n(active.LVFW, 2)}, septum ${n(active.SEP, 2)}. These amplitudes do not add myocardial mass or reproduce chronic hypertrophy/adaptation.`),
    lowFlow ? t(`今回のLVEFは ${n(v.lvef * 100, 2)}%。EF<50%、順行SVI≤35 mL/m²、平均勾配<40 mmHgと小さなAVAの組合せで、この教材の低EF・低流量・低勾配を確認します。真性・偽性ASの鑑別やDSEの応答を検証したわけではありません。`,
      `Measured LVEF is ${n(v.lvef * 100, 2)}%. This example combines EF<50%, forward SVI≤35 mL/m², mean gradient<40 mmHg and a small AVA. It does not establish true/pseudo-severe discrimination or a DSE response.`)
      : t(`今回のLVEFは ${n(v.lvef * 100, 2)}%。EFは観測値として示し、この弁狭窄のみの比較例ではEF保持を採用条件にしていません。EF保持型AS全体の代表例や、正常収縮性の保証としては扱いません。`,
      `Measured LVEF is ${n(v.lvef * 100, 2)}%. EF is observed, not a preserved-EF selection requirement for this valve-only comparison. This does not represent all preserved-EF AS or establish normal intrinsic contractility.`),
    t("作動点の目標は、この教材を選ぶために全項目の通過を求めます。優先順位は探索順で、任意条件という意味ではありません。臨床分類の境界と、教材として選ぶ範囲は区別します。",
      "Every operating target must pass to select this teaching example. Priority controls search order, not optionality. Clinical classification boundaries and teaching-case selection corridors have different roles."),
    t(`Vmax ${n(v.avVmax, 2)} m/s、平均4v² ${n(v.avBernoulliMeanGradient)} mmHg、順流SVI ${n(v.forwardSvi)} mL/m²。ET ${n(v.etMs, 0)} ms、AT ${n(v.avAccelerationTimeMs, 0)} ms、AT/ET ${n(v.avAtEt, 3)}です。`,
      `Vmax ${n(v.avVmax, 2)} m/s; mean 4v² ${n(v.avBernoulliMeanGradient)} mmHg; forward SVI ${n(v.forwardSvi)} mL/m². ET ${n(v.etMs, 0)} ms; AT ${n(v.avAccelerationTimeMs, 0)} ms; AT/ET ${n(v.avAtEt, 3)}.`),
    t(`平均LAP ${n(v.meanLa)} mmHg、Weiss τ ${n(v.weissTauMs)} msも併記します。充満圧・弛緩やAT/ETは負荷・心筋の性質にも依存し、AS全例に高値を要求しません。ATはモデル流速から求めた時間で、臨床Dopplerの時間基準との一致は未検証です。`,
      `Mean LAP is ${n(v.meanLa)} mmHg and Weiss τ ${n(v.weissTauMs)} ms. Filling pressure, relaxation and AT/ET depend on loading and myocardial properties; high values are not mandatory for every AS case. AT is measured from modeled velocity; agreement with clinical Doppler timing has not been validated.`),
  ];
}
function caseMethod(metric: string, locale: Locale) {
  const t = (ja: string, en: string) => locale === "ja" ? ja : en;
  if (metric === "lvef" || metric === "lvedvi") return t("弁閉鎖に対応する左室内の血液量からEDV・ESV・EFを求め、容積はBSAで補正します。画像で測る最大・最小容積とは測定点が異なる場合があります。",
    "LV blood-pool volumes at native valve closures define EDV, ESV and EF; volumes are indexed by BSA. These landmarks need not equal image-derived maxima/minima.");
  if (metric === "ci") return t("大動脈弁を通る1拍の正味拍出量からCOを求め、BSAで割ります。HR一定ではCIとSVIは独立ではありません。",
    "Beat-net aortic-valve output gives CO, indexed by BSA. CI and SVI are not independent at fixed HR.");
  if (metric === "meanAo") return t("現行モデルでAoPとして表示するAo nodeの1拍の平均圧です。動脈の空間的な伝播や測定過程は再現せず、臨床のMAPと同じ条件とは限りません。",
    "Beat-mean Ao-node pressure, displayed as AoP in the current model. Spatial arterial propagation and clinical MAP acquisition are not simulated.");
  if (metric === "avVmax" || metric === "avBernoulliMeanGradient" || metric === "avEffectiveAreaCm2") return t(
    "現行の準定常弁の式から流速を求めます（LV−Ao圧差から背景抵抗R×Qを除き、血液密度を用いて換算）。Vmaxは順流中の最大速度、平均勾配は瞬時4v²の順流時間平均、AVAは順流量/VTIです。このモデルでは4v²とLV−Ao勾配はほぼ同じで、臨床のDopplerとカテーテルの差を再現しません。LVOT速度補正・圧回復・Doppler計測過程は含まず、AVAと勾配は独立な測定ではありません。",
    "Velocity is reconstructed from the current quasi-steady valve law after subtracting background R×Q from LV−Ao pressure. Vmax is its forward-flow maximum; mean gradient is the forward-time mean of 4v²; AVA is forward SV/VTI. Here 4v² nearly equals the hydraulic LV−Ao gradient: the clinical Doppler–catheter gap is not reproduced. No LVOT velocity correction, pressure recovery or Doppler acquisition. Area and gradient are not independent observations.");
  if (metric === "forwardSvi") return t("AVの1拍の順流量をBSAで割ります。正味SVIとは逆流時に異なり、SV/ETとも異なります。",
    "Beat-forward AV volume divided by BSA. Distinct from net SVI with regurgitation, and from SV/ET.");
  if (metric === "meanLa" || metric === "meanRa") return metric === "meanLa"
    ? t("左房内圧の1拍の平均です。肺動脈楔入圧の測定過程は再現しておらず、PCWP/PAWPそのものではありません。", "Beat-mean LA cavity pressure, not a simulated wedge measurement or direct PCWP/PAWP.")
    : t("右房内圧の1拍の平均です。CVPの参照値とは、測定位置・呼吸条件などの違いに注意して比較します。", "Beat-mean RA cavity pressure; CVP references require attention to measurement site and respiratory conditions.");
  if (metric === "weissTauMs") return t("左室内圧の低下を、漸近圧を0に固定した指数関数で近似します。時間幅で重み付けしたWeiss法で、評価窓・近似品質も別に記録します。",
    "Time-weighted zero-asymptote Weiss fit of falling LV cavity pressure. The measurement window and fit quality are recorded separately.");
  throw new Error(`Missing case measurement explanation: ${metric}`);
}

export function registryCaseSourcesV1(referenceId: Result["rest"]["referenceId"], locale: Locale) {
  if (referenceId === "baseline") return definitions.baseline.context().assessmentPolicy.evidence.sources
    .map(s => ({ id: s.sourceId, title: s.title, url: s.url, description: s.verificationScope }));
  if (referenceId === "as-high-gradient-valve-only-v1" || referenceId === "as-low-flow-reduced-ef-v1") return definitions[referenceId].context().assessmentPolicy.evidence.sources
    .map(s => ({ id: s.sourceId, title: s.title, url: s.url,
      description: locale === "ja" ? `${s.population} ${s.method} ${s.limitations} (${s.locator})`
        : `${s.locator}. Source-informed construction, not clinical validation; acquisition and population differences remain. See the case measurement notes.` }));
  if (referenceId !== "hfref-chronic-dilated-v1") throw new Error(`Missing case-specific sources: ${referenceId}`);
  const target = definitions["hfref-chronic-dilated-v1"].context().assessmentPolicy;
  if (target.kind !== "source-informed-disease-construction") throw new Error("Missing case sources");
  return target.evidence.sources.map(s => {
    const text = locale === "ja" ? s : hfrefSourceEnglishV1(s.sourceId);
    return { id: s.sourceId, title: s.title, url: s.url,
      description: `${text.population} ${text.method} ${text.limitations} (${s.locator})` };
  });
}

/** Presentation only. The caller has re-observed and qualified the pair; these
 * rows keep the original roles, units and provenance, not a second gate. */
export function registryCaseAssessmentRowsV1(result: Result, grid: unknown, locale: Locale): readonly Row[] {
  const rest = result.rest;
  if (rest.status === "unavailable") throw new Error("Cannot archive unavailable case observations");
  if (rest.referenceId === "baseline") {
    const saved = grid as Awaited<ReturnType<typeof baselineGrid>>;
    if (saved.status !== "grid-evaluated") throw new Error("Baseline document needs its own evaluated grid");
    const { policy, evidence } = definitions.baseline.context().assessmentPolicy;
    return mainWireBaselineRowsV1({ evidence, admission: { policy }, tauPolicy,
      observations: [{ rest: rest.assessment, tau: saved.relaxation,
        checks: rest.observation.checks.map(c => ({ ...c, historicalRole: role(c.checkId) })) }] }, 0, locale);
  }
  const isAs = rest.referenceId === "as-high-gradient-valve-only-v1" || rest.referenceId === "as-low-flow-reduced-ef-v1";
  const context = definitions[rest.referenceId].context().assessmentPolicy;
  if (context.kind !== "source-informed-disease-construction") throw new Error("Missing case evidence");
  const reference = context.evidence;
  const t = (ja: string, en: string) => locale === "ja" ? ja : en;
  return (["screen", "targets"] as const).flatMap(group => rest.assessment[group].map(rule => {
    const specification = (group === "screen" ? reference.restScreen : reference.fittingTargets).find(r => r.metricId === rule.metricId)!;
    // Targets may omit a unit only where the same observable already has a screen.
    const screen = reference.restScreen.find(r => r.metricId === rule.metricId);
    const unit = ("unit" in specification ? specification.unit : undefined) ?? screen?.unit;
    if (!unit) throw new Error(`Missing case document unit: ${rule.metricId}`);
    const sources = rule.sourceIds.map(id => {
      const source = reference.sources.find(s => s.sourceId === id);
      if (!source) throw new Error(`Missing case document source: ${id}`);
      return { title: source.title, url: source.url, locator: source.locator };
    });
    if (!sources.length) throw new Error("Case document condition has no evidence");
    return { id: `${group}.${rule.metricId}`, label: caseLabels[rule.metricId] ?? rule.metricId, value: rule.actual, unit: unit === "1" ? "fraction" : unit,
      role: group === "screen" ? "guard" as const : "target" as const,
      status: rule.actual === null ? "unassessed" as const : rule.status === "passed" ? "passed" as const : "failed" as const,
      ranges: [{ label: t("この教育例の採用条件（臨床分類を含む設計範囲）", "Selection interval for this example, informed by clinical grading"), lower: rule.lower, upper: rule.upper,
        lowerInclusive: "lowerInclusive" in rule ? rule.lowerInclusive : true, upperInclusive: "upperInclusive" in rule ? rule.upperInclusive : true }],
      meaning: caseMethod(rule.metricId, locale),
      rationale: locale === "ja" ? rule.rationale : isAs ? asEnglishRationale(rule.metricId, group, rest.referenceId === "as-low-flow-reduced-ef-v1")
        : hfrefRationaleEnglishV1(group === "screen" ? "screen" : "target", rule.metricId), sources };
  }));
}

function asEnglishRationale(metric: string, group: "screen" | "targets", lowFlow: boolean) {
  const text: Record<string, string> = {
    avEffectiveAreaCm2: "Select an effective area at or below 1 cm²; positivity is a measurement requirement. Model-derived SV/VTI is not independent anatomical validation.",
    avVmax: lowFlow ? "Select positive Vmax<4 m/s for this concordant low-gradient example, not as a replacement for the complete 2025 flow/EF/gradient classification." : "Select Vmax ≥4 m/s, without an invented clinical severity ceiling.",
    avBernoulliMeanGradient: group === "screen" ? lowFlow ? "Select positive mean gradient<40 mmHg. This is not sufficient by itself to classify stenosis." : "Select concordant high-gradient AS (mean ≥40 mmHg). Requiring both velocity and gradient here is phenotype selection, not a replacement diagnostic algorithm."
      : lowFlow ? "20–35 mmHg is a teaching-case selection corridor, not a published normal interval. It avoids the classification boundary while retaining visible valve load." : "Select mean gradients from 40 to below 60 mmHg for this example. Vmax and peak 4v² are not added as independent losses.",
    lvef: "Select reduced EF (<50%), not a load-independent measurement of intrinsic contractility; volumes are measured at native valve closure.",
    forwardSvi: lowFlow ? group === "screen" ? "The clinical low-flow boundary is forward SVI≤35 mL/m². SV/ET is a separate observable."
      : "25–35 mL/m² is required to select this teaching example with retained resting output. Priority is search order, not optionality. The lower limit is a design choice, not a universal physiological boundary. CI is dependent at fixed HR."
      : "Require 35<SVI≤50 mL/m² for this non-low-flow teaching example. Priority is search order, not optionality. The upper limit of 50 is a design choice, not a universal normal bound. SV/ET remains separate.",
  };
  if (!text[metric]) throw new Error(`Missing AS rationale: ${metric}`);
  return text[metric]!;
}
