/**
 * Localized presentation metadata for model controls and outputs.
 *
 * Numerical contracts own identity, units, ranges, and sampling semantics.
 * This catalog owns human-facing copy and browsing taxonomy so changing a
 * Japanese label never changes model identity.
 */

import type { ControlDefinitionV2 } from "@/studio/contracts/v2/model";
import {
  MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1,
} from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";

export type StudioItemPresentationLocaleV1 = "en" | "ja";

export type StudioItemPresentationCategoryV1 =
  | "hemodynamics"
  | "myocardium"
  | "valves"
  | "coronary"
  | "oxygen"
  | "pericardium"
  | "rhythm"
  | "ventilation"
  | "mechanicalSupport"
  | "advanced";

export type ResolvedStudioItemPresentationV1 = Readonly<{
  itemId: string;
  kind: "control" | "output";
  category: StudioItemPresentationCategoryV1;
  /** Localized canonical label. */
  label: string;
  /** English canonical label used to recognize legacy default labels. */
  canonicalEnglishLabel: string;
  /** Compact dictionary-style copy for hover, focus, and touch disclosure. */
  description: string;
  /** Show the compact copy beside live clinical labels, not only in pickers. */
  inlineDisclosure: boolean;
  /** Search-only vocabulary. Never render this list as user-facing copy. */
  aliases: readonly string[];
  /** Both locales and all hidden aliases, normalized lazily by search. */
  searchTerms: readonly string[];
}>;

export type StudioItemPresentationCatalogFactsV1 = Readonly<{
  controlChangeSemantics?: ControlDefinitionV2["changeSemantics"];
  outputKind?: string;
}>;

type LocalizedTextV1 = Readonly<{ en: string; ja: string }>;

type StudioItemPresentationDraftV1 = Readonly<{
  category: StudioItemPresentationCategoryV1;
  label?: LocalizedTextV1;
  description?: LocalizedTextV1;
  inlineDisclosure?: true;
  aliases?: readonly string[];
  /** Historical generated labels that must remain auto-localizable. */
  historicalDefaultLabels?: readonly string[];
}>;

const textV1 = (en: string, ja: string): LocalizedTextV1 =>
  Object.freeze({ en, ja });

const CARDIAC_PRESSURE_RATE_PRESENTATION_V1: Readonly<
  Record<string, StudioItemPresentationDraftV1>
> = Object.freeze(Object.fromEntries(
  (["LV", "RV"] as const).flatMap((chamber) =>
    ([5, 10, 20] as const).flatMap((windowMs) =>
      (["maximum", "minimum"] as const).map((extremum) => {
        const polarity = extremum === "maximum" ? "max" : "min";
        const outputId =
          `hemodynamics.pressure-rate.${extremum}-windowed-${windowMs}ms.absolute.${chamber}`;
        return [outputId, Object.freeze({
          category: "myocardium" as const,
          inlineDisclosure: true as const,
          label: textV1(
            `${chamber} dP/dt ${polarity} (${windowMs} ms)`,
            `${chamber} dP/dt ${polarity}（${windowMs} ms）`,
          ),
          description: textV1(
            `${polarity === "max" ? "Maximum" : "Minimum"} ${windowMs}-ms fixed-window pressure slope over the latest completed regular-sinus cycle; this is not an instantaneous derivative or an MR/TR-jet dP/dt measurement`,
            `直近の完結した洞調律1心拍における${windowMs} ms固定窓の圧変化率${polarity === "max" ? "最大" : "最小"}値。瞬時微分でもMR/TR jetからのdP/dt実測値でもない`,
          ),
          aliases: [
            `${chamber} dP/dt`,
            `${chamber} dpdt`,
            `${windowMs} ms pressure slope`,
            `${chamber}圧変化率`,
          ],
        })];
      }),
    ),
  ),
));

const CONTROL_PRESENTATION_V1: Readonly<
  Record<string, StudioItemPresentationDraftV1>
> = Object.freeze({
  "rhythm.heart-rate-bpm": {
    category: "rhythm",
    label: textV1("Heart rate (HR)", "心拍数 (HR)"),
    description: textV1("Cardiac cycle frequency", "心周期の頻度"),
    aliases: ["HR", "heart rate", "心拍", "心拍数", "脈拍"],
  },
  "hemodynamics.total-blood-volume-ml": {
    category: "hemodynamics",
    label: textV1("Total blood volume (TBV)", "総血液量 (TBV)"),
    description: textV1(
      "Total blood volume conserved by the circulation model",
      "循環モデル内で保存される総血液量",
    ),
    aliases: ["TBV", "blood volume", "循環血液量", "総血液量"],
  },
  "hemodynamics.systemic-resistance": {
    category: "hemodynamics",
    label: textV1("Systemic vascular resistance (SVR)", "体血管抵抗 (SVR)"),
    description: textV1(
      "Multiplier applied to systemic vascular resistance",
      "体循環の血管抵抗に適用する倍率",
    ),
    aliases: ["SVR", "systemic resistance", "体血管抵抗", "後負荷"],
  },
  "hemodynamics.pulmonary-resistance": {
    category: "hemodynamics",
    label: textV1("Pulmonary vascular resistance (PVR)", "肺血管抵抗 (PVR)"),
    description: textV1(
      "Multiplier applied to pulmonary vascular resistance",
      "肺循環の血管抵抗に適用する倍率",
    ),
    aliases: ["PVR", "pulmonary resistance", "肺血管抵抗", "右室後負荷"],
  },
  "hemodynamics.venous-tone": {
    category: "hemodynamics",
    label: textV1("Venous tone", "静脈トーン"),
    description: textV1(
      "Distribution of blood into the stressed venous volume",
      "静脈系のstressed volumeへの血液分布",
    ),
    aliases: ["venous tone", "venoconstriction", "静脈収縮", "静脈還流"],
  },
  "hemodynamics.arterial-stiffness": {
    category: "hemodynamics",
    label: textV1("Arterial stiffness", "動脈スティフネス"),
    description: textV1(
      "Multiplier applied to systemic arterial stiffness",
      "体動脈compartmentのスティフネスに適用する倍率",
    ),
    aliases: ["arterial stiffness", "動脈硬化", "arterial compliance"],
  },
  "myocardium.contractility": {
    category: "myocardium",
    label: textV1("Common ventricular active tension", "共通心室能動張力"),
    description: textV1(
      "Shared active-tension multiplier for both ventricular free walls and the septum",
      "左右心室自由壁と心室中隔に共通する能動張力倍率",
    ),
    aliases: ["contractility", "inotropy", "収縮性", "心収縮力"],
  },
  "ventilation.peep-cm-h2o": {
    category: "ventilation",
    label: textV1("PEEP", "PEEP"),
    description: textV1(
      "Positive end-expiratory airway pressure",
      "呼気終末の気道陽圧",
    ),
    aliases: ["PEEP", "positive end expiratory pressure", "呼気終末陽圧"],
  },
});

const OUTPUT_PRESENTATION_V1: Readonly<
  Record<string, StudioItemPresentationDraftV1>
> = Object.freeze({
  "presentation.pressure-summary.Ao": {
    category: "hemodynamics",
    label: textV1("Aortic pressure (AoP)", "大動脈圧 (AoP)"),
    description: textV1(
      "Systolic and diastolic aortic-root pressure with the time mean in parentheses",
      "大動脈基部圧の最大値／最小値と括弧内の時間平均",
    ),
    aliases: [
      "AoP",
      "central blood pressure",
      "central SBP",
      "central DBP",
      "central MAP",
      "大動脈圧",
      "中心血圧",
    ],
  },
  "presentation.pressure-summary.SA": {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1("Arterial blood pressure (ABP)", "体動脈圧 (ABP)"),
    description: textV1(
      "Maximum, minimum, and time-mean pressure of the lumped systemic-arterial (SA) compartment; it is not tied to a specific cuff or arterial-line site and omits wave travel and reflection",
      "集中定数系の体動脈（SA）compartment圧の最大値／最小値と時間平均。特定のカフ・動脈ライン位置には対応せず、波伝播・反射は含まない",
    ),
    aliases: [
      "ABP",
      "SBP",
      "DBP",
      "MAP",
      "blood pressure",
      "arterial pressure",
      "血圧",
      "体動脈圧",
    ],
  },
  "presentation.pressure-summary.PA": {
    category: "hemodynamics",
    label: textV1("Pulmonary artery pressure (PAP)", "肺動脈圧 (PAP)"),
    description: textV1(
      "Systolic and diastolic pulmonary arterial pressure with the time mean in parentheses",
      "肺動脈圧の最大値／最小値と括弧内の時間平均",
    ),
    aliases: ["PAP", "sPAP", "dPAP", "mPAP", "肺動脈圧"],
  },
  "rhythm.heart-rate.instantaneous": {
    category: "rhythm",
    label: textV1("Heart rate (HR)", "心拍数 (HR)"),
    description: textV1(
      "Current heart rate emitted by the rhythm model",
      "リズムモデルが出力する現在の心拍数",
    ),
    aliases: ["HR", "heart rate", "心拍", "脈拍"],
  },
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port": {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1("Aortic pressure (AoP)", "大動脈圧 (AoP)"),
    description: textV1(
      "Model proximal-aortic pressure after local static pressure recovery to the fixed ascending-aortic area; it is not a specific catheter-site pressure, and wave travel or reflection is not modeled",
      "固定上行大動脈断面までの局所的な静圧回復を反映したモデル近位大動脈圧。特定のカテーテル測定部位には対応せず、圧波の伝播・反射はモデル化していない",
    ),
    aliases: [
      "AoP",
      "aortic pressure",
      "proximal aortic pressure",
      "aortic port pressure",
      "Pprox",
      "大動脈圧",
      "近位大動脈圧",
    ],
  },
  "hemodynamics.pressure.absolute.SA": {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1("Arterial blood pressure (ABP)", "体動脈圧 (ABP)"),
    description: textV1(
      "Pressure of the lumped systemic-arterial (SA) compartment; it is not tied to a specific cuff or arterial-line site and omits wave travel and reflection",
      "集中定数系の体動脈（SA）compartment圧。特定のカフ・動脈ライン位置には対応せず、波伝播・反射は含まない",
    ),
    aliases: [
      "ABP",
      "arterial blood pressure",
      "systemic arterial pressure",
      "SA pressure",
      "血圧",
      "体動脈圧",
    ],
    historicalDefaultLabels: ["Systemic arterial pressure"],
  },
  "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV": {
    category: "valves",
    inlineDisclosure: true,
    label: textV1("AV local pressure gradient", "大動脈弁局所圧較差"),
    description: textV1(
      "Instantaneous modeled LV − proximal AoP hydraulic pressure difference; it is neither the raw LV − Ao compliance-node difference nor a catheter- or Doppler-equivalent gradient",
      "モデル上の瞬時LV − 近位AoP局所水力学的圧較差。raw LV − Ao compliance-node差ではなく、カテーテル・Doppler等価性も主張しない",
    ),
    aliases: [
      "AV gradient",
      "aortic valve gradient",
      "LV Ao gradient",
      "local hydraulic gradient",
      "大動脈弁圧較差",
    ],
  },
  "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV": {
    category: "valves",
    inlineDisclosure: true,
    label: textV1(
      "AV vena-contracta Bernoulli gradient",
      "大動脈弁vena contracta Bernoulli圧較差",
    ),
    description: textV1(
      "Instantaneous ideal Bernoulli pressure at the model vena contracta from AoV flow and active EOA; pressure recovery acts downstream and measured-Doppler equivalence is not claimed",
      "AoV flowとactive EOAから求めるモデルvena contractaでの瞬時ideal Bernoulli圧。下流では圧回復が作用し、実測Dopplerとの等価性は主張しない",
    ),
    aliases: [
      "AV Bernoulli gradient",
      "vena contracta gradient",
      "Doppler gradient",
      "大動脈弁圧較差",
      "ベルヌーイ圧較差",
    ],
  },
  [MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.aorticMeanLocalGradientMmHg]: {
    category: "valves",
    inlineDisclosure: true,
    label: textV1(
      "AV mean gradient (LV–AoP)",
      "大動脈弁平均圧較差 (LV–AoP)",
    ),
    description: textV1(
      "Time mean of the positive part of the modeled local LV − proximal AoP hydraulic gradient while AoV flow is positive; AoP includes local static-pressure recovery, and catheter or Doppler equivalence is not claimed",
      "AoV前方流の持続中におけるモデル局所LV − 近位AoP水力学的圧較差の正成分の時間平均。AoPは局所静圧回復を反映し、カテーテル・Dopplerとの等価性は主張しない",
    ),
    aliases: ["AV mPG", "mean AV gradient", "平均大動脈弁圧較差"],
  },
  [MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
    .aorticMeanVenaContractaGradientMmHg]: {
    category: "valves",
    inlineDisclosure: true,
    label: textV1("AV mean gradient (VC)", "大動脈弁平均圧較差 (VC)"),
    description: textV1(
      "Time mean of the model vena-contracta ideal-Bernoulli gradient while AoV flow is positive; it is a model station upstream of pressure recovery, not a measured Doppler gradient",
      "AoV前方流の持続中におけるモデルvena contracta ideal-Bernoulli圧較差の時間平均。圧回復前のモデル位置であり、実測Doppler圧較差ではない",
    ),
    aliases: ["AV mPG VC", "mean Bernoulli gradient", "平均VC圧較差"],
  },
  [MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.leftVentricularEjectionTimeMs]: {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1("LV ejection time (ET)", "左室駆出時間 (ET)"),
    description: textV1(
      "Duration of the dominant positive model AoV-flow episode in the latest completed regular-sinus cycle; model flow events are not clinical valve clicks",
      "直近の完結した洞調律1心拍における主要なモデルAoV前方流episodeの持続時間。モデルflow eventは臨床的な弁音時相そのものではない",
    ),
    aliases: ["ET", "LVET", "ejection time", "駆出時間"],
  },
  [MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
    .leftVentricularEjectionTimeThresholdMs]: {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1(
      "LV ejection time (ET, 1% peak)",
      "左室駆出時間 (ET, peak 1%)",
    ),
    description: textV1(
      "AoV-flow duration above 1% of that beat's peak forward flow; reported beside positive-flow ET as a threshold-sensitivity check",
      "当該心拍のAoV最大前方流の1%を超える持続時間。閾値依存性を確認するためpositive-flow ETと併記する",
    ),
    aliases: ["threshold ET", "LVET 1%", "閾値駆出時間"],
  },
  [MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
    .leftVentricularIsovolumicContractionTimeMs]: {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1(
      "Isovolumic contraction time (ICT)",
      "等容性収縮時間 (ICT)",
    ),
    description: textV1(
      "Interval from model MV forward-flow closure to model AoV forward-flow opening in the latest completed regular-sinus cycle",
      "直近の完結した洞調律1心拍におけるモデルMV前方流閉鎖からモデルAoV前方流開始までの時間",
    ),
    aliases: ["ICT", "IVCT", "isovolumic contraction", "等容性収縮時間"],
  },
  [MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
    .leftVentricularIsovolumicRelaxationTimeMs]: {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1(
      "Isovolumic relaxation time (IVRT)",
      "等容性弛緩時間 (IVRT)",
    ),
    description: textV1(
      "Interval from model AoV forward-flow closure to model MV forward-flow opening in the latest completed regular-sinus cycle",
      "直近の完結した洞調律1心拍におけるモデルAoV前方流閉鎖からモデルMV前方流開始までの時間",
    ),
    aliases: ["IVRT", "IRT", "isovolumic relaxation", "等容性弛緩時間"],
  },
  [MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
    .leftVentricularMyocardialPerformanceIndex]: {
    category: "myocardium",
    inlineDisclosure: true,
    label: textV1("LV Tei-like index", "左室Tei類似指数"),
    description: textV1(
      "Model-flow-event ratio (ICT + IVRT) / positive-flow ET; it is intentionally labeled Tei-like because no Doppler or tissue-Doppler measurement protocol is reproduced",
      "モデルflow eventから求める (ICT + IVRT) / positive-flow ET。Doppler・組織Doppler計測手順を再現しないためTei類似指数と明示する",
    ),
    aliases: ["Tei", "MPI", "myocardial performance index", "Tei index"],
  },
  [MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.aorticForwardFlowShapeFactor]: {
    category: "valves",
    inlineDisclosure: true,
    label: textV1("AV flow shape factor", "大動脈弁flow shape factor"),
    description: textV1(
      "Dimensionless ET·∫Q²dt/SV² over the dominant positive AoV-flow episode; 1 is rectangular and larger values indicate a more peaked ejection waveform",
      "主要なAoV前方流episodeで求める無次元量 ET·∫Q²dt/SV²。1は矩形波に相当し、大きいほど駆出波形が尖鋭である",
    ),
    aliases: ["flow shape", "ejection shape", "flow concentration", "駆出波形"],
  },
  ...CARDIAC_PRESSURE_RATE_PRESENTATION_V1,
  "hemodynamics.pressure.systolic.Ao": {
    category: "hemodynamics",
    label: textV1("Aortic pressure (AoP max)", "大動脈圧 (AoP max)"),
    description: textV1(
      "Maximum aortic-root pressure during the accepted beat",
      "解析対象となる1心拍における大動脈基部圧の最大値",
    ),
    aliases: ["AoP", "AoP max", "central SBP", "大動脈圧", "収縮期圧"],
  },
  "hemodynamics.pressure.diastolic.Ao": {
    category: "hemodynamics",
    label: textV1("Aortic pressure (AoP min)", "大動脈圧 (AoP min)"),
    description: textV1(
      "Minimum aortic-root pressure during the accepted beat",
      "解析対象となる1心拍における大動脈基部圧の最小値",
    ),
    aliases: ["AoP", "AoP min", "central DBP", "大動脈圧", "拡張期圧"],
  },
  "hemodynamics.pressure.mean.Ao": {
    category: "hemodynamics",
    label: textV1("Mean aortic pressure (AoP mean)", "平均大動脈圧 (AoP mean)"),
    description: textV1(
      "Time-mean aortic-root pressure over the accepted beat",
      "解析対象となる1心拍における大動脈基部圧の時間平均",
    ),
    aliases: ["AoP", "AoP mean", "central MAP", "大動脈圧", "平均圧"],
  },
  "hemodynamics.pressure.systolic.SA": {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1("Systolic arterial pressure (SBP)", "収縮期体動脈圧 (SBP)"),
    description: textV1(
      "Maximum pressure of the lumped systemic-arterial compartment during the accepted beat; it is not tied to a specific cuff or arterial-line site and omits wave travel and reflection",
      "解析対象となる1心拍における集中定数系の体動脈compartment圧の最大値。特定のカフ・動脈ライン位置には対応せず、波伝播・反射は含まない",
    ),
    aliases: ["SBP", "systolic blood pressure", "収縮期血圧", "血圧"],
  },
  "hemodynamics.pressure.diastolic.SA": {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1("Diastolic arterial pressure (DBP)", "拡張期体動脈圧 (DBP)"),
    description: textV1(
      "Minimum pressure of the lumped systemic-arterial compartment during the accepted beat; it is not tied to a specific cuff or arterial-line site and omits wave travel and reflection",
      "解析対象となる1心拍における集中定数系の体動脈compartment圧の最小値。特定のカフ・動脈ライン位置には対応せず、波伝播・反射は含まない",
    ),
    aliases: ["DBP", "diastolic blood pressure", "拡張期血圧", "血圧"],
  },
  "hemodynamics.pressure.mean.SA": {
    category: "hemodynamics",
    inlineDisclosure: true,
    label: textV1("Mean arterial pressure (MAP)", "平均体動脈圧 (MAP)"),
    description: textV1(
      "Time-mean pressure of the lumped systemic-arterial compartment over the accepted beat; it is not tied to a specific cuff or arterial-line site and omits wave travel and reflection",
      "解析対象となる1心拍における集中定数系の体動脈compartment圧の時間平均。特定のカフ・動脈ライン位置には対応せず、波伝播・反射は含まない",
    ),
    aliases: ["MAP", "mean arterial pressure", "平均血圧", "血圧"],
  },
  "hemodynamics.pressure.mean.PA": {
    category: "hemodynamics",
    label: textV1(
      "Mean pulmonary arterial pressure (mPAP)",
      "平均肺動脈圧 (mPAP)",
    ),
    description: textV1(
      "Time-mean pulmonary arterial pressure over the accepted beat",
      "解析対象となる1心拍における肺動脈圧の時間平均",
    ),
    aliases: ["mPAP", "PAP", "mean pulmonary artery pressure", "平均肺動脈圧"],
  },
  "hemodynamics.pressure.systolic.PA": {
    category: "hemodynamics",
    label: textV1(
      "Systolic pulmonary arterial pressure (sPAP)",
      "収縮期肺動脈圧 (sPAP)",
    ),
    description: textV1(
      "Maximum pulmonary arterial pressure during the accepted beat",
      "解析対象となる1心拍における肺動脈圧の最大値",
    ),
    aliases: ["sPAP", "PAP", "pulmonary artery pressure", "肺動脈圧"],
  },
  "hemodynamics.pressure.diastolic.PA": {
    category: "hemodynamics",
    label: textV1(
      "Diastolic pulmonary arterial pressure (dPAP)",
      "拡張期肺動脈圧 (dPAP)",
    ),
    description: textV1(
      "Minimum pulmonary arterial pressure during the accepted beat",
      "解析対象となる1心拍における肺動脈圧の最小値",
    ),
    aliases: ["dPAP", "PAP", "pulmonary artery pressure", "肺動脈圧"],
  },
  "hemodynamics.pressure.mean.LA": {
    category: "hemodynamics",
    label: textV1("Mean left atrial pressure (mLAP)", "平均左房圧 (mLAP)"),
    description: textV1(
      "Time-mean left atrial pressure over the accepted beat",
      "解析対象となる1心拍における左房圧の時間平均",
    ),
    aliases: ["LAP", "mLAP", "left atrial pressure", "左房圧"],
  },
  "hemodynamics.pressure.mean.RA": {
    category: "hemodynamics",
    label: textV1(
      "Central venous pressure (CVP / mRAP)",
      "中心静脈圧 (CVP / mRAP)",
    ),
    description: textV1(
      "Time-mean right atrial pressure presented as central venous pressure",
      "中心静脈圧として表示する右房圧の時間平均",
    ),
    aliases: [
      "CVP",
      "RAP",
      "mRAP",
      "central venous pressure",
      "右房圧",
      "中心静脈圧",
    ],
  },
  "hemodynamics.volume.end-diastolic.LV-at-MV-closure": {
    category: "hemodynamics",
    label: textV1(
      "LV end-diastolic volume (LVEDV)",
      "左室拡張末期容積 (LVEDV)",
    ),
    description: textV1(
      "LV volume at mitral-valve closure",
      "僧帽弁閉鎖時点の左室容積",
    ),
    aliases: ["LVEDV", "EDV", "end diastolic volume", "拡張末期容積"],
  },
  "hemodynamics.pressure.absolute.end-diastolic.LV-at-MV-closure": {
    category: "hemodynamics",
    label: textV1(
      "LV end-diastolic pressure (LVEDP)",
      "左室拡張末期圧 (LVEDP)",
    ),
    description: textV1(
      "Absolute LV pressure at mitral-valve closure",
      "僧帽弁閉鎖時点の絶対左室圧",
    ),
    aliases: ["LVEDP", "EDP", "end diastolic pressure", "拡張末期圧"],
  },
  "hemodynamics.volume.end-systolic.LV-at-AoV-closure": {
    category: "hemodynamics",
    label: textV1("LV end-systolic volume (LVESV)", "左室収縮末期容積 (LVESV)"),
    description: textV1(
      "LV volume at aortic-valve closure",
      "大動脈弁閉鎖時点の左室容積",
    ),
    aliases: ["LVESV", "ESV", "end systolic volume", "収縮末期容積"],
  },
  "hemodynamics.pressure.absolute.end-systolic.LV-at-AoV-closure": {
    category: "hemodynamics",
    label: textV1("LV end-systolic pressure (LVESP)", "左室収縮末期圧 (LVESP)"),
    description: textV1(
      "Absolute LV pressure at aortic-valve closure",
      "大動脈弁閉鎖時点の絶対左室圧",
    ),
    aliases: ["LVESP", "ESP", "end systolic pressure", "収縮末期圧"],
  },
  "hemodynamics.stroke-volume.LV-event-defined": {
    category: "hemodynamics",
    label: textV1("LV stroke volume (LVSV)", "左室一回拍出量 (LVSV)"),
    description: textV1(
      "Difference between event-defined LVEDV and LVESV",
      "event-defined LVEDVとLVESVの差",
    ),
    aliases: ["LVSV", "SV", "stroke volume", "一回拍出量"],
  },
  "hemodynamics.ejection-fraction.LV-event-defined": {
    category: "hemodynamics",
    label: textV1("LV ejection fraction (LVEF)", "左室駆出率 (LVEF)"),
    description: textV1(
      "Event-defined LV stroke volume divided by LVEDV",
      "event-defined LVSVをLVEDVで除した値",
    ),
    aliases: ["LVEF", "EF", "ejection fraction", "駆出率"],
  },
  "hemodynamics.valve-volume.net.AoV": {
    category: "valves",
    label: textV1(
      "Effective LV forward stroke volume",
      "実効左室前方一回拍出量",
    ),
    description: textV1(
      "Net volume crossing the aortic valve during one accepted beat",
      "解析対象となる1心拍中に大動脈弁を通過した正味容積",
    ),
    aliases: ["effective SV", "AoV net", "forward stroke volume", "実効拍出量"],
  },
  "hemodynamics.output.effective-native-left": {
    category: "hemodynamics",
    label: textV1("Effective systemic cardiac output", "実効体循環心拍出量"),
    description: textV1(
      "Net aortic-valve volume per beat multiplied by heart rate",
      "大動脈弁正味通過量に心拍数を乗じた実効心拍出量",
    ),
    aliases: ["CO", "cardiac output", "effective CO", "心拍出量"],
  },
  "myocardium.work.external.LV-transmural-pressure-volume-path": {
    category: "myocardium",
    label: textV1("LV stroke work (SW)", "左室一回仕事量 (SW)"),
    description: textV1(
      "Accepted-beat LV stroke work from the negative signed transmural pressure–volume line integral",
      "解析対象となる1心拍のLV経壁圧–容積線積分 −∫Ptm dVから求めた一回仕事量",
    ),
    aliases: [
      "SW",
      "stroke work",
      "PV loop area",
      "PV path work",
      "LV path work",
      "一回仕事量",
      "圧容積経路仕事",
    ],
  },
  "myocardium.work.stroke.LV": {
    category: "myocardium",
    label: textV1("LV stroke work (SW)", "左室一回仕事量 (SW)"),
    description: textV1(
      "Accepted-beat LV stroke work reported in millijoules",
      "解析対象となる1心拍の左室一回仕事量をミリジュールで表示",
    ),
    aliases: ["SW", "stroke work", "PV loop area", "一回仕事量"],
  },
  "myocardium.energy.potential.LV-pressure-volume-area": {
    category: "myocardium",
    label: textV1(
      "LV potential energy (PE)",
      "左室ポテンシャルエネルギー (PE)",
    ),
    description: textV1(
      "Potential-energy component of the settled preload-reduction LV pressure–volume area estimate",
      "settled preload-reduction解析から求めた左室PVAのポテンシャルエネルギー成分",
    ),
    aliases: ["PE", "potential energy", "PVA PE", "ポテンシャルエネルギー"],
  },
  "myocardium.energy.pressure-volume-area.LV": {
    category: "myocardium",
    label: textV1("LV pressure–volume area (PVA)", "左室圧容積面積 (PVA)"),
    description: textV1(
      "LV pressure–volume area defined as accepted-beat stroke work plus potential energy",
      "解析対象となる1心拍のSWとPEの和として求めた左室圧容積面積",
    ),
    aliases: ["PVA", "pressure volume area", "圧容積面積"],
  },
  "oxygen.consumption.estimated-myocardial.LV-per-beat-per-100g": {
    category: "oxygen",
    label: textV1(
      "Estimated LV MVO₂ per beat",
      "推定左室MVO₂（1心拍・100 gあたり）",
    ),
    description: textV1(
      "Literature-reference LV myocardial oxygen-consumption estimate from the current PVA per beat and model-derived LV mass",
      "現在のPVAとモデル由来LV質量から求めた文献参照式による左室心筋酸素消費量推定値",
    ),
    aliases: ["MVO2", "MVO₂", "oxygen consumption", "心筋酸素消費量"],
  },
  "oxygen.consumption.estimated-myocardial.LV-per-min-per-100g": {
    category: "oxygen",
    label: textV1(
      "Estimated LV MVO₂ per minute",
      "推定左室MVO₂（1分・100 gあたり）",
    ),
    description: textV1(
      "Estimated LV myocardial oxygen consumption per minute using the measured accepted-beat heart rate",
      "解析対象となる心拍の実測心拍数を用いた1分あたり左室心筋酸素消費量推定値",
    ),
    aliases: ["MVO2", "MVO₂", "oxygen consumption", "心筋酸素消費量"],
  },
  "oxygen.delivery.systemic": {
    category: "oxygen",
    label: textV1("Systemic oxygen delivery (DO₂)", "全身酸素供給量 (DO₂)"),
    description: textV1(
      "Oxygen delivered to the systemic circulation per minute",
      "体循環へ1分間に供給される酸素量",
    ),
    aliases: ["DO2", "DO₂", "oxygen delivery", "酸素供給量"],
  },
});

export type StudioOutputPressureSummaryV1 = Readonly<{
  presentationId: string;
  maximumOutputId: string;
  minimumOutputId: string;
  meanOutputId: string;
  memberOutputIds: readonly [string, string, string];
}>;

const pressureSummaryV1 = (
  presentationId: string,
  maximumOutputId: string,
  minimumOutputId: string,
  meanOutputId: string,
): StudioOutputPressureSummaryV1 =>
  Object.freeze({
    presentationId,
    maximumOutputId,
    minimumOutputId,
    meanOutputId,
    memberOutputIds: Object.freeze([
      maximumOutputId,
      minimumOutputId,
      meanOutputId,
    ] as const),
  });

/**
 * Clinical display recipes over atomic outputs. The numerical output registry
 * remains unchanged so refs, claims, fitting, and validation retain scalar IDs.
 */
export const STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1: readonly StudioOutputPressureSummaryV1[] =
  Object.freeze([
    pressureSummaryV1(
      "presentation.pressure-summary.Ao",
      "hemodynamics.pressure.systolic.Ao",
      "hemodynamics.pressure.diastolic.Ao",
      "hemodynamics.pressure.mean.Ao",
    ),
    pressureSummaryV1(
      "presentation.pressure-summary.SA",
      "hemodynamics.pressure.systolic.SA",
      "hemodynamics.pressure.diastolic.SA",
      "hemodynamics.pressure.mean.SA",
    ),
    pressureSummaryV1(
      "presentation.pressure-summary.PA",
      "hemodynamics.pressure.systolic.PA",
      "hemodynamics.pressure.diastolic.PA",
      "hemodynamics.pressure.mean.PA",
    ),
  ]);

export function studioOutputPressureSummaryForOutputIdV1(
  outputId: string,
): StudioOutputPressureSummaryV1 | undefined {
  return STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1.find(({ memberOutputIds }) =>
    memberOutputIds.includes(outputId),
  );
}

export function resolveStudioOutputPressureSummaryStoredLabelV1(
  input: Readonly<{
    summary: StudioOutputPressureSummaryV1;
    items: readonly Readonly<{ outputId: string; label: string }>[];
    locale: "en" | "ja";
    fallbackEnglishLabel: (outputId: string) => string;
  }>,
): string | undefined {
  for (const item of input.items) {
    const legacyDefaultLabel = input.fallbackEnglishLabel(item.outputId);
    const atomicPresentation = resolveStudioItemPresentationV1({
      kind: "output",
      itemId: item.outputId,
      fallbackEnglishLabel: legacyDefaultLabel,
      locale: input.locale,
    });
    if (
      item.label !== legacyDefaultLabel &&
      item.label !== atomicPresentation.canonicalEnglishLabel &&
      item.label !== atomicPresentation.label
    ) {
      return item.label;
    }
  }
  return undefined;
}

const WALL_LABEL_V1: Readonly<Record<string, LocalizedTextV1>> = Object.freeze({
  LA: textV1("LA", "LA"),
  LVFW: textV1("LV free wall", "LV自由壁"),
  SEP: textV1("Ventricular septum", "心室中隔"),
  RVFW: textV1("RV free wall", "RV自由壁"),
  RA: textV1("RA", "RA"),
});

const VALVE_LABEL_V1: Readonly<Record<string, LocalizedTextV1>> = Object.freeze(
  {
    MV: textV1("Mitral valve (MV)", "僧帽弁 (MV)"),
    AoV: textV1("Aortic valve (AoV)", "大動脈弁 (AoV)"),
    TV: textV1("Tricuspid valve (TV)", "三尖弁 (TV)"),
    PV: textV1("Pulmonary valve (PV)", "肺動脈弁 (PV)"),
  },
);

function patternedControlPresentationV1(
  itemId: string,
): StudioItemPresentationDraftV1 | undefined {
  const wallMatch =
    /^myocardium\.(active-tension|passive-stiffness|calcium-decay-time)-scale\.(LA|LVFW|SEP|RVFW|RA)$/.exec(
      itemId,
    );
  if (wallMatch !== null) {
    const mechanism = wallMatch[1]!;
    const wall = WALL_LABEL_V1[wallMatch[2]!]!;
    if (mechanism === "active-tension") {
      return {
        category: "myocardium",
        label: textV1(`${wall.en} active tension`, `${wall.ja} 能動張力`),
        description: textV1(
          `Active-tension multiplier for the ${wall.en}`,
          `${wall.ja}が発生する能動張力に適用する倍率`,
        ),
        aliases: ["contractility", "active tension", "収縮性", wallMatch[2]!],
      };
    }
    if (mechanism === "passive-stiffness") {
      return {
        category: "myocardium",
        label: textV1(
          `${wall.en} passive stiffness`,
          `${wall.ja} 受動スティフネス`,
        ),
        description: textV1(
          `Passive material-stiffness multiplier for the ${wall.en}`,
          `${wall.ja}の受動的な材料スティフネスに適用する倍率`,
        ),
        aliases: [
          "stiffness",
          "compliance",
          "受動特性",
          "スティフネス",
          wallMatch[2]!,
        ],
      };
    }
    return {
      category: "myocardium",
      label: textV1(`${wall.en} relaxation time`, `${wall.ja} 弛緩時間`),
      description: textV1(
        `Active-tension decay-time multiplier for the ${wall.en}; larger values slow relaxation`,
        `${wall.ja}の能動張力減衰時間に適用する倍率（大きいほど弛緩が遅延）`,
      ),
      aliases: [
        "relaxation",
        "lusitropy",
        "calcium decay",
        "弛緩",
        wallMatch[2]!,
      ],
    };
  }

  const valveMatch =
    /^valve\.(maximum-forward-eoa-cm2|closed-reverse-eroa-cm2)\.(MV|AoV|TV|PV)$/.exec(
      itemId,
    );
  if (valveMatch !== null) {
    const valve = VALVE_LABEL_V1[valveMatch[2]!]!;
    const forward = valveMatch[1] === "maximum-forward-eoa-cm2";
    return {
      category: "valves",
      label: forward
        ? textV1(`${valve.en} maximum EOA`, `${valve.ja} 最大EOA`)
        : textV1(`${valve.en} reverse EROA`, `${valve.ja} 逆流EROA`),
      description: forward
        ? textV1(
            `Maximum effective forward orifice area of the ${valve.en}`,
            `${valve.ja}の最大有効前方弁口面積`,
          )
        : textV1(
            `Residual reverse orifice area when the ${valve.en} is closed`,
            `${valve.ja}閉鎖時に残る逆流有効弁口面積`,
          ),
      aliases: forward
        ? [valveMatch[2]!, "EOA", "valve area", "弁口面積", "狭窄"]
        : [valveMatch[2]!, "EROA", "regurgitation", "逆流", "逆流弁口面積"],
    };
  }

  if (itemId.startsWith("oxygen.")) {
    const oxygenCopy: Readonly<
      Record<
        string,
        readonly [LocalizedTextV1, LocalizedTextV1, readonly string[]]
      >
    > = {
      "oxygen.hemoglobin-g-per-dl": [
        textV1("Hemoglobin (Hb)", "ヘモグロビン (Hb)"),
        textV1("Blood hemoglobin concentration", "血中ヘモグロビン濃度"),
        ["Hb", "hemoglobin", "ヘモグロビン"],
      ],
      "oxygen.inspired-oxygen-fraction": [
        textV1("Inspired oxygen fraction (FiO₂)", "吸入酸素濃度 (FiO₂)"),
        textV1("Inspired oxygen fraction", "吸入気中の酸素分率"),
        ["FiO2", "FiO₂", "inspired oxygen", "吸入酸素"],
      ],
      "oxygen.arterial-carbon-dioxide-pressure-mm-hg": [
        textV1("Arterial PCO₂ (PaCO₂)", "動脈血二酸化炭素分圧 (PaCO₂)"),
        textV1(
          "Arterial carbon-dioxide pressure used by the gas calculation",
          "ガス計算に用いる動脈血二酸化炭素分圧",
        ),
        ["PaCO2", "PaCO₂", "PCO2", "二酸化炭素分圧"],
      ],
      "oxygen.respiratory-exchange-ratio": [
        textV1("Respiratory exchange ratio (RER)", "呼吸交換比 (RER)"),
        textV1(
          "Respiratory exchange ratio used by alveolar gas calculation",
          "肺胞気ガス計算に用いる呼吸交換比",
        ),
        ["RER", "respiratory quotient", "呼吸交換比"],
      ],
      "oxygen.barometric-pressure-mm-hg": [
        textV1("Barometric pressure", "大気圧"),
        textV1(
          "Ambient barometric pressure used by the gas calculation",
          "ガス計算に用いる大気圧",
        ),
        ["PB", "barometric pressure", "大気圧"],
      ],
      "oxygen.true-shunt-fraction": [
        textV1("True shunt fraction", "真性シャント率"),
        textV1(
          "Fraction of blood flow that bypasses oxygenation",
          "酸素化を受けずに通過する血流の割合",
        ),
        ["shunt", "Qs/Qt", "シャント"],
      ],
      "oxygen.target-consumption-ml-per-min": [
        textV1("Target oxygen consumption (VO₂)", "目標酸素消費量 (VO₂)"),
        textV1(
          "Whole-body target oxygen consumption per minute",
          "全身の1分あたり目標酸素消費量",
        ),
        ["VO2", "VO₂", "oxygen consumption", "酸素消費量"],
      ],
    };
    const copy = oxygenCopy[itemId];
    if (copy !== undefined) {
      return {
        category: "oxygen",
        label: copy[0],
        description: copy[1],
        aliases: copy[2],
      };
    }
  }

  if (itemId.startsWith("pericardium.")) {
    return {
      category: "pericardium",
      description: textV1(
        "Parameter of the common pericardial pressure–volume relation",
        "共通心膜pressure–volume relationのparameter",
      ),
      aliases: ["pericardium", "pericardial", "心膜"],
    };
  }

  if (itemId.startsWith("coronary.")) {
    return {
      category: "coronary",
      description: itemId.includes("focal-diameter-loss")
        ? textV1(
            "Focal coronary diameter loss in the named territory",
            "指定冠動脈領域における局所的な内径狭窄率",
          )
        : textV1(
            "Structural-resistance multiplier in the named coronary layer",
            "指定冠動脈layerの構造的抵抗に適用する倍率",
          ),
      aliases: ["coronary", "coronary resistance", "冠動脈", "冠血管抵抗"],
    };
  }

  return undefined;
}

function patternedOutputPresentationV1(
  itemId: string,
): StudioItemPresentationDraftV1 | undefined {
  if (itemId.startsWith("oxygen.")) {
    return {
      category: "oxygen",
      description: textV1(
        "Value calculated by the beat-mean oxygen-transport observer",
        "beat-mean oxygen transport observerが算出する値",
      ),
      aliases: ["oxygen", "O2", "O₂", "酸素"],
    };
  }
  if (itemId.startsWith("pericardium.")) {
    return {
      category: "pericardium",
      description: textV1(
        "Value emitted by the common pericardial mechanics observer",
        "共通心膜mechanics observerが出力する値",
      ),
      aliases: ["pericardium", "pericardial", "心膜"],
    };
  }
  if (itemId.startsWith("myocardium.")) {
    return {
      category: "myocardium",
      aliases: ["myocardium", "myocardial", "心筋", "PV"],
    };
  }
  if (itemId.startsWith("coronary.")) {
    return {
      category: "coronary",
      aliases: ["coronary", "冠動脈", "冠血流"],
    };
  }
  return undefined;
}

export function studioItemPresentationCategoryV1(
  itemId: string,
): StudioItemPresentationCategoryV1 {
  const normalized = itemId.toLocaleLowerCase();
  if (normalized.startsWith("rhythm.") || normalized.includes("heart-rate")) {
    return "rhythm";
  }
  if (
    normalized.startsWith("ventilation.") ||
    normalized.startsWith("respiration.") ||
    normalized.includes("pleural") ||
    normalized.includes("alveolar")
  )
    return "ventilation";
  if (normalized.startsWith("oxygen.")) return "oxygen";
  if (normalized.startsWith("myocardium.")) return "myocardium";
  if (normalized.startsWith("pericardium.")) return "pericardium";
  if (
    normalized.startsWith("valve.") ||
    normalized.includes(".valve-") ||
    normalized.includes(".valve.") ||
    normalized.includes("regurgitant")
  )
    return "valves";
  if (normalized.startsWith("coronary.")) return "coronary";
  if (
    normalized.startsWith("mcs.") ||
    normalized.startsWith("device.") ||
    normalized.includes("mechanical-support") ||
    normalized.includes("impella") ||
    normalized.includes("ecmo")
  )
    return "mechanicalSupport";
  if (normalized.startsWith("hemodynamics.")) return "hemodynamics";
  return "advanced";
}

export function resolveStudioItemPresentationV1(
  input: Readonly<{
    kind: "control" | "output";
    itemId: string;
    fallbackEnglishLabel: string;
    locale: string;
    catalogFacts?: StudioItemPresentationCatalogFactsV1;
  }>,
): ResolvedStudioItemPresentationV1 {
  const authored =
    input.kind === "control"
      ? (CONTROL_PRESENTATION_V1[input.itemId] ??
        patternedControlPresentationV1(input.itemId))
      : (OUTPUT_PRESENTATION_V1[input.itemId] ??
        patternedOutputPresentationV1(input.itemId));
  const locale: StudioItemPresentationLocaleV1 = input.locale.startsWith("ja")
    ? "ja"
    : "en";
  const canonicalEnglishLabel =
    authored?.label?.en ?? input.fallbackEnglishLabel;
  const label = authored?.label?.[locale] ?? canonicalEnglishLabel;
  const fallbackDescription = fallbackStudioItemDescriptionV1({
    ...input,
    label,
    locale,
  });
  const baseDescription = dictionaryDescriptionV1(
    authored?.description?.[locale] ?? fallbackDescription,
  );
  const description = dictionaryDescriptionV1(
    input.kind === "control" &&
        input.catalogFacts?.controlChangeSemantics === "cold-restart"
      ? locale === "ja"
        ? `${baseDescription}。この値を変更するとモデル時刻0から新しい計算軌道を開始し、それまでの確定済みモデル時刻・軌道を置き換える`
        : `${baseDescription}. Changing this value starts a new model trajectory at t = 0 and replaces the prior accepted model clock and trajectory`
      : baseDescription,
  );
  const aliases = Object.freeze([...(authored?.aliases ?? [])]);
  const searchTerms = Object.freeze(
    [
      input.itemId,
      input.fallbackEnglishLabel,
      canonicalEnglishLabel,
      authored?.label?.ja,
      authored?.description?.en,
      authored?.description?.ja,
      description,
      ...aliases,
      ...(authored?.historicalDefaultLabels ?? []),
    ].filter((term): term is string => term !== undefined),
  );
  return Object.freeze({
    itemId: input.itemId,
    kind: input.kind,
    category:
      authored?.category ?? studioItemPresentationCategoryV1(input.itemId),
    label,
    canonicalEnglishLabel,
    description,
    inlineDisclosure: authored?.inlineDisclosure === true,
    aliases,
    searchTerms,
  });
}

function dictionaryDescriptionV1(value: string): string {
  return value.trim().replace(/[。.!]+$/u, "");
}

function fallbackStudioItemDescriptionV1(
  input: Readonly<{
    kind: "control" | "output";
    itemId: string;
    label: string;
    locale: StudioItemPresentationLocaleV1;
    catalogFacts?: StudioItemPresentationCatalogFactsV1;
  }>,
): string {
  if (input.kind === "control") {
    return input.locale === "ja"
      ? `「${input.label}」に対応する数理モデルparameter`
      : `Model parameter represented by “${input.label}”`;
  }

  const outputKind = input.catalogFacts?.outputKind ?? "output";
  return input.locale === "ja"
    ? outputKind === "signal"
      ? `「${input.label}」の時系列信号`
      : `解析対象となる1心拍から算出した「${input.label}」`
    : outputKind === "signal"
      ? `Time-varying signal for “${input.label}”`
      : `Accepted-beat value for “${input.label}”`;
}

export function resolveStudioSurfaceItemLabelV1(
  input: Readonly<{
    storedLabel: string | undefined;
    legacyDefaultLabel: string;
    presentation: ResolvedStudioItemPresentationV1;
  }>,
): string {
  if (
    input.storedLabel === undefined ||
    input.storedLabel === input.legacyDefaultLabel ||
    input.storedLabel === input.presentation.canonicalEnglishLabel ||
    historicalStudioItemDefaultLabelsV1(input.presentation).includes(
      input.storedLabel,
    )
  )
    return input.presentation.label;
  return input.storedLabel;
}

function historicalStudioItemDefaultLabelsV1(
  presentation: ResolvedStudioItemPresentationV1,
): readonly string[] {
  const authored = presentation.kind === "control"
    ? CONTROL_PRESENTATION_V1[presentation.itemId]
    : OUTPUT_PRESENTATION_V1[presentation.itemId];
  return authored?.historicalDefaultLabels ?? Object.freeze([]);
}

export function normalizeStudioItemSearchTextV1(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[ァ-ヶ]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0x60),
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function studioItemPresentationMatchesQueryV1(
  presentation: ResolvedStudioItemPresentationV1,
  query: string,
  extraTerms: readonly (string | undefined)[] = [],
): boolean {
  const tokens = normalizeStudioItemSearchTextV1(query)
    .split(" ")
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = normalizeStudioItemSearchTextV1(
    [
      ...presentation.searchTerms,
      ...extraTerms.filter((term): term is string => term !== undefined),
    ].join(" "),
  );
  return tokens.every((token) => haystack.includes(token));
}
