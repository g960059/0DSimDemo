import React from "react";
import type { Locale } from "@/localeRouting";
import type archivedDocument from "@/studio/presentation/modelDocumentation/packages/standard71-document-v1.json";
export type MainWireEquationDataV1 = typeof archivedDocument.scientificRecord.equations & {
  inputScales?: { hemodynamic: { systemicResistance: number; pulmonaryResistance: number } };
  effectiveWalls?: readonly { wallId: string; activeScale: number; passiveScale: number;
    trefPa: number; slsModulusPa: number; slsTimeSec: number }[];
};
import { MAIN_WIRE_EQUATION_SPECIFICATION_V1 } from "@/studio/presentation/modelDocumentation/MainWireEquationSpecificationV1";
import { ModelMathLabelV1 as MathLabel } from "@/components/model/ModelMathV1";

const tr = (l: Locale, ja: string, en: string) => l === "ja" ? ja : en;
const prose = "text-sm leading-7 text-wb-muted";
const fmt = (x: number) => Number(x.toPrecision(12)).toString();
type Eq = React.ComponentType<{ expression: string }>;
const wallIds = ["LA", "LVFW", "SEP", "RVFW", "RA"] as const;
const territoryIds = ["LAD", "LCx", "RCA"] as const;
const layerIds = ["subepicardial", "subendocardial"] as const;
const names: Record<string, readonly [string, string]> = {
  LV: ["左室", "Left ventricle"], LA: ["左房", "Left atrium"], RV: ["右室", "Right ventricle"], RA: ["右房", "Right atrium"],
  Ao: ["近位大動脈", "Proximal aorta"], SA: ["体動脈", "Systemic arteries"], Art: ["体抵抗血管側", "Systemic resistance-vessel side"], Cap: ["体毛細管", "Systemic capillary bed"], SV: ["体静脈", "Systemic veins"], VC: ["大静脈", "Vena cava"],
  PA: ["近位肺動脈", "Proximal pulmonary artery"], PArt: ["肺抵抗血管側", "Pulmonary resistance-vessel side"], PCap: ["肺毛細管", "Pulmonary capillary bed"], PVen: ["肺細静脈側", "Pulmonary venular side"], PVein: ["肺静脈・左房流入口側", "Pulmonary vein / LA inlet"],
  LVFW: ["左室自由壁", "LV free wall"], SEP: ["心室中隔", "Ventricular septum"], RVFW: ["右室自由壁", "RV free wall"], CV: ["共通冠静脈容量", "Common coronary venous storage"],
};
function nodeLabel(id: string, locale: Locale): string {
  const name = names[id];
  if (name) return `${name[locale === "ja" ? 0 : 1]} (${id})`;
  const [territory, , kind, layer] = id.split(".");
  if (!kind) return `${territory} ${tr(locale, "大動脈側容量", "large arterial storage")} (Art)`;
  return `${territory} ${layerLabel(layer, locale)} ${kind === "Art" ? "C1" : "C2"}`;
}
function layerLabel(layer: string, locale: Locale) { return layer === "subepicardial" ? tr(locale, "心外膜側", "epi") : tr(locale, "心内膜側", "endo"); }
function externalLabel(kind: string, locale: Locale) {
  if (kind === "heart") return "Pth + Pperi";
  if (kind === "pth") return "Pth";
  if (kind === "palv") return "Palv";
  return tr(locale, "0（基準圧）", "0 (reference)");
}
function Table({ caption, headings, rows }: { caption: string; headings: readonly React.ReactNode[]; rows: readonly (readonly React.ReactNode[])[] }) {
  const label = (v: React.ReactNode) => typeof v === "string" ? <MathLabel label={v} /> : v;
  return <div className="my-5 overflow-x-auto rounded border border-wb-line" role="region" aria-label={caption} tabIndex={0}>
    <table className="w-full text-left text-xs leading-6" data-equation-table>
      <caption className="px-3 py-2 text-left font-medium text-wb-text">{caption}</caption>
      <thead className="bg-wb-panel"><tr>{headings.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-3 py-2">{label(h)}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i} className="border-t border-wb-line">{row.map((v, j) => j === 0
        ? <th key={j} scope="row" className="min-w-36 px-3 py-2 font-normal">{label(v)}</th>
        : <td key={j} data-stored-number={typeof v === "number" ? String(v) : undefined} className="px-3 py-2 align-top tabular-nums text-wb-muted">{typeof v === "number" ? fmt(v) : label(v)}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function MainWireDetailedCircuitV1({ data, locale, Equation }: { data: MainWireEquationDataV1; locale: Locale; Equation: Eq }) {
  const routes = [
    { title: tr(locale, "体循環", "Systemic path"), nodes: ["LV", "Ao", "SA", "Art", "Cap", "SV", "VC", "RA"] },
    { title: tr(locale, "肺循環", "Pulmonary path"), nodes: ["RV", "PA", "PArt", "PCap", "PVen", "PVein", "LA"] },
  ];
  return <div data-testid="detailed-circuit">
    <p className={prose}>{tr(locale, "四心腔と11の主循環血管区画に、16の冠血管区画を接続します。各区画は血液を蓄える場所で、接続部が流れにくさを表します。名前は代表する領域を示すもので、カテーテル先端の正確な位置を指定するものではありません。中隔は心筋壁であり、血液を蓄えるnodeではありません。", "Four cavities and eleven main-circuit vascular compartments connect to sixteen coronary compartments. Compartments store blood; links carry hydraulic losses. Names denote lumped regions, not exact catheter positions. The septum is a material wall, not a blood-storage node.")}</p>
    <figure className="my-5 space-y-5 rounded-lg bg-wb-panel p-4">
      {routes.map(route => <div key={route.title}><h4 className="mb-3 text-sm font-medium">{route.title}</h4><ol className="flex flex-wrap items-center gap-2 text-xs">{route.nodes.map((id, i) => <li key={id} className="flex items-center gap-2">{i > 0 && <span aria-hidden="true">{i === 1 ? (id === "Ao" ? "—AV→" : "—PV→") : "→"}</span>}<span className="rounded border border-wb-line bg-wb-app px-3 py-2">{nodeLabel(id, locale)}</span></li>)}</ol></div>)}
      <figcaption className="text-xs leading-6 text-wb-subtle">{tr(locale, "左房 —MV→ 左室、右房 —TV→ 右室で閉じた回路になります。矢印は流量の正方向です。逆流を許す接続では、負の流量も体積収支に含めます。冠循環はAoから分岐し、RAへ戻ります。", "LA —MV→ LV and RA —TV→ RV close the circuit. Arrows define positive flow; permitted reverse flow enters continuity with its sign. Coronaries branch from Ao and return to RA.")}</figcaption>
    </figure>
    <p className={prose}>{tr(locale, "Ao・SA・Artを分けることで、近位の血液貯留と末梢へ向かう圧低下を別々に扱います。ただし、区画の間を脈波が伝わる時間や反射は表していません。SVは主な静脈貯留部、VCは胸腔圧の影響を受ける右房直前の区画です。肺側では、PCapに肺胞圧、PVen・PVeinに胸腔圧を作用させ、左房までの貯留と流入抵抗を分けています。この分割は、各血管を解剖学的に一本ずつ再現するためではありません。", "Ao/SA/Art separate proximal storage from pressure loss toward the periphery, without representing pulse transit or reflection between compartments. SV is the main venous reservoir; VC is the thoracic-pressure-exposed compartment before RA. PCap receives alveolar pressure, while PVen/PVein receive thoracic pressure, separating pulmonary storage and resistance along the path to LA. This is a functional partition, not a vessel-by-vessel anatomical reconstruction.")}</p>
    <Table caption={tr(locale, "主循環の全区画：役割と圧の基準", "All main-circuit compartments: law and pressure reference")}
      headings={[tr(locale, "区画", "Compartment"), tr(locale, "圧を決める関係", "Pressure relation"), tr(locale, "外圧", "External pressure"), tr(locale, "表示との対応", "Displayed counterpart")]}
      rows={data.nodes.map(n => [nodeLabel(n.id, locale), n.law === null ? tr(locale, "心筋・形状の釣り合い", "Material / geometry balance") : n.law.kind === "arterial" ? tr(locale, "動脈の指数則", "Exponential arterial") : n.law.kind === "linear" ? tr(locale, "線形容量則", "Linear storage") : tr(locale, "静脈型の非線形容量則", "Nonlinear venous-type"), externalLabel(n.external, locale), ({ LV: "LVP", LA: "LAP", RV: "RVP", RA: "RAP / CVP", Ao: "AoP", SA: "ABP", PA: "PAP" } as Record<string, string>)[n.id] ?? "—"])} />
    <p className={prose}>{tr(locale, "AoP・PAPはAo・PA区画の内圧で、表示の段階でZcQを足しません。ABPはSAの代表圧で、上腕カフ圧の再現ではありません。CVPは平均右房圧、PCWPは平均左房圧を代用する表示であり、肺毛細管楔入の手技は計算していません。PV loopは心室経壁圧を使います。", "AoP/PAP are Ao/PA intravascular pressures, with no display-only ZcQ. ABP is SA pressure, not a simulated brachial cuff. CVP uses mean RA; PCWP uses mean LA as a proxy, without simulating catheter wedging. PV loops use ventricular transmural pressure.")}</p>
    <Equation expression={String.raw`\dot V_i=\sum_j N_{ij}Q_j,\qquad N_{ij}=\begin{cases}+1&j\text{ enters }i\\-1&j\text{ leaves }i\\0&\text{otherwise}\end{cases},\qquad\sum_{i=1}^{31}V_i=TBV`} />
    <p className={prose}>{tr(locale, "接続行列Nは下の接続表から組み立てられます。どの接続も一方から出た量が他方へ入るため、閉回路全体では血液量が保存されます。心筋体積・心嚢液量はこの合計とは別です。TBVを変更しない限り、圧や拍出量を合わせるための血液の追加・削除は行いません。", "The link tables define incidence matrix N. Each flow leaves one compartment and enters another, conserving total blood. Myocardium and pericardial fluid are excluded. Blood is not added or removed to match pressure or output at fixed TBV.")}</p>
  </div>;
}

function TriSegFigure({ locale }: { locale: Locale }) {
  return <figure className="my-5 rounded-lg border border-wb-line p-3">
    <svg viewBox="0 0 580 265" className="mx-auto w-full max-w-lg" role="img" aria-label={tr(locale, "TriSegの断面模式図：共通の接合円、左室壁、中隔、右室壁", "TriSeg cross-section: shared junction, LV wall, septum and RV wall")}>
      <g fill="none" strokeWidth="3"><path d="M260 35 C-20 35 -20 225 260 225" stroke="#e59442" /><path d="M260 35 Q355 130 260 225" stroke="#8e98ff" /><path d="M260 35 C560 35 560 225 260 225" stroke="#26bfa8" /></g>
      <path d="M260 35V225 M90 130H510" fill="none" stroke="currentColor" strokeDasharray="4 5" className="text-wb-subtle" />
      <g fontSize="14" className="fill-wb-text"><text x="105" y="113">LV</text><text x="403" y="113">RV</text><text x="310" y="161">SEP</text><text x="238" y="91">y</text><text x="203" y="251">{tr(locale, "接合円の断面", "Junction circle")}</text><text x="375" y="151">{tr(locale, "右室方向 ＋", "Positive toward RV")}</text></g>
    </svg>
    <figcaption className="text-xs leading-6 text-wb-subtle">{tr(locale, "三つの壁が同じ円で接する球冠近似の模式図です。断面形状や壁厚の実測図ではありません。hは接合面から各球冠頂点までの符号付き高さです。", "Schematic of spherical caps sharing a junction circle, not measured geometry or wall thickness. h is signed height from the junction plane to each cap apex.")}</figcaption>
  </figure>;
}

function CoronaryFigure({ locale }: { locale: Locale }) {
  return <figure className="my-5 rounded-lg border border-wb-line p-4">
    <div className="overflow-x-auto"><svg viewBox="0 0 620 210" className="min-w-[480px] w-full" role="img" aria-label={tr(locale, "冠循環：領域ごとの並列二層回路", "Coronary circuit: two parallel layers per territory")}>
      <defs><marker id="coronary-spec-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="currentColor" /></marker></defs>
      <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#coronary-spec-arrow)" className="text-wb-muted"><path d="M40 110H116" /><path d="M170 110H205V58H257" /><path d="M205 110V162H257" /><path d="M305 58H397" /><path d="M305 162H397" /><path d="M442 58H482V110H510" /><path d="M442 162H482V110" /><path d="M550 110H605" /></g>
      <g className="fill-wb-text" fontSize="14" textAnchor="middle"><text x="23" y="114">Ao</text><text x="143" y="114">Art</text><text x="280" y="62">C1</text><text x="280" y="166">C1</text><text x="420" y="62">C2</text><text x="420" y="166">C2</text><text x="531" y="114">CV</text><text x="605" y="97">RA</text><text x="237" y="48">R1</text><text x="351" y="48">Rm</text><text x="460" y="48">R2</text><text x="351" y="25">{tr(locale, "心外膜側", "Subepicardial")}</text><text x="351" y="199">{tr(locale, "心内膜側", "Subendocardial")}</text></g>
    </svg></div>
    <figcaption className="text-xs leading-6 text-wb-subtle">{tr(locale, "LAD・LCx・RCAそれぞれにこの分岐があり、CVだけを共有します。Art・CVには共通心外圧、C1・C2には各領域・層の心筋内圧が作用します。", "This branch is repeated for LAD/LCx/RCA, sharing only CV. Art/CV receive common cardiac external pressure; C1/C2 receive territory/layer-specific intramyocardial pressure.")}</figcaption>
  </figure>;
}

const landMeanings: Record<string, readonly [string, string, string]> = {
  kTRPN: ["トロポニン結合速度", "Troponin rate", "s⁻¹"], nTRPN: ["Ca結合の指数", "Ca binding exponent", "1"], CaT50Ref: ["Ca50,ref：Ca感受性", "Ca50,ref", "µM"],
  ku: ["薄いフィラメントの活性化速度", "Thin-filament activation rate", "s⁻¹"], nTm: ["薄いフィラメントの指数", "Thin-filament exponent", "1"], TRPN50: ["θ：基準結合割合", "θ: reference bound fraction", "1"],
  kuw: ["非結合→弱結合", "Unbound→weak", "s⁻¹"], kws: ["弱結合→強結合", "Weak→strong", "s⁻¹"], rw: ["r𝓌：基準弱結合割合", "r𝓌: reference weak fraction", "1"], rs: ["rₛ：基準強結合割合", "rₛ: reference strong fraction", "1"],
  gammaS: ["γs：強結合の歪み依存離脱", "γs: strong distortion detachment", "s⁻¹"], gammaW: ["γw：弱結合の歪み依存離脱", "γw: weak distortion detachment", "s⁻¹"], phi: ["φ：歪み緩和倍率", "φ: distortion relaxation scale", "1"],
  Aeff: ["Aeff：速度感受性", "Aeff: velocity sensitivity", "1"], beta0: ["β0：張力の長さ依存", "β0: force-length dependence", "1"], beta1: ["β1：Ca感受性の長さ依存", "β1: affinity-length dependence", "µM"], Tref: ["Tref：張力係数", "Tref: tension scale", "Pa"], temperatureK: ["実験温度（速度の可変係数ではない）", "Source temperature (not a variable kinetic factor)", "K"],
};
function ParameterTables({ data, id, locale }: { data: MainWireEquationDataV1; id: string; locale: Locale }) {
  const two = [tr(locale, "記号・意味", "Symbol / meaning"), tr(locale, "採用値", "Adopted value")];
  if (id === "event-calcium-v1") { const p = data.rhythm.ventricularIntervalStrength; return <>
    <Table caption={tr(locale, "Ca源の採用係数", "Adopted calcium source")}
      headings={[tr(locale, "壁", "Wall"), "τr (s)", "τd (s)", "Ca₀ (µM)", "g (µM)"]} rows={wallIds.map(w => { const p = data.calcium[w]; return [nodeLabel(w, locale), p.tauRiseSec, p.tauDecaySec, p.calciumRestUM, p.calciumGainUMPerUnitDrive]; })} />
    <Table caption={tr(locale,"拍間隔依存の係数と基準状態","Interval-strength coefficients and reference state")} headings={two}
      rows={[["τrec (s)",p.recoveryTimeConstantSec],["β",p.releaseFractionBeta],["r",p.releasedLoadReturnFractionR],
        ["h",p.intervalInfluxInhibitionFractionH],["γ",p.normalizedIntervalInfluxGamma],
        ["Tref (s)",p.referenceCycleLengthSec],["aref",p.referenceRecoveryFractionA],["Lref",p.referenceNormalizedSrLoadState]]} />
  </>; }
  if (id === "land-deactivation-v2") return <>
    <p className={prose}>{tr(locale,"以下は数理モデルの基準係数です。能動倍率は壁ごとのTrefに適用します。有効値は受動・粘弾性の節の表にも示しています。","These are model reference coefficients. Active multipliers apply to each wall's Tref; effective values are also tabulated in the passive/viscoelastic section.")}</p>
    <Table caption={tr(locale, "Land独立係数：心室と心房", "Independent Land parameters: ventricles and atria")} headings={[two[0], tr(locale, "心室三壁", "Ventricular walls"), tr(locale, "両心房", "Atria"), tr(locale, "単位", "Unit")]} rows={Object.keys(data.land.ventricular.values).map(k => [<span><MathLabel label={k} /><span className="block text-wb-subtle">{landMeanings[k]?.[locale === "ja" ? 0 : 1].replace(/^[^：:]+[：:]\s*/, "")}</span></span>, data.land.ventricular.values[k as keyof typeof data.land.ventricular.values], data.land.atrial.values[k as keyof typeof data.land.atrial.values], landMeanings[k]?.[2]])} />
    <Table caption={tr(locale, "式から定まるLand派生係数", "Derived Land coefficients")} headings={ ["", tr(locale, "心室", "Ventricle"), tr(locale, "心房", "Atrium")] } rows={Object.entries(data.land.ventricular.derived).map(([k,v]) => [k, v, data.land.atrial.derived[k as keyof typeof data.land.atrial.derived]])} />
    <p className={prose}>{tr(locale, "心室の追加離脱：kmax＝60 s⁻¹、p＝16。心房は追加離脱なしです。原著値との比較・調整の来歴は「baselineの設定」に掲載しています。これらは同一被験者から独立に測定された材料定数ではありません。", "Ventricular added exit: kmax=60 s⁻¹, p=16; atria have no added exit. Baseline settings compare adopted values with source values and calibration provenance. These are not independently measured constants from one subject.")}</p>
  </>;
  if (id === "passive-viscoelastic-v1") { const v=data.passive.ventricular, a=data.passive.atrial; return <>
    <Table caption={tr(locale, "受動則の基準係数（壁ごとの倍率は別途適用）", "Reference passive coefficients (wall multipliers applied separately)")} headings={two} rows={[
      ["K0 (Pa)", v.centralTangentPa], ["Kt (Pa)", v.tensionScalePa], ["a", v.tensionExponent], ["Kc (Pa)", v.compressionAdditionalTangentPa], ["δ", v.transitionWidthStrain],
      ["C1 (Pa)", a.isotropicC1Pa], ["C2 (Pa)", a.isotropicC2Pa], ["C3 (Pa)", a.fiberC3Pa], ["C4", a.fiberC4],
    ]} />
    {data.effectiveWalls ? <Table caption={tr(locale,"各壁の倍率と有効材料係数","Wall multipliers and effective material coefficients")}
      headings={[tr(locale,"壁","Wall"),tr(locale,"能動倍率","Active scale"),tr(locale,"受動倍率","Passive scale"),"Tref (Pa)","Ev (Pa)","τv (s)"]}
      rows={data.effectiveWalls.map(w => [nodeLabel(w.wallId,locale),w.activeScale,w.passiveScale,w.trefPa,w.slsModulusPa,w.slsTimeSec])} />
      : <Table caption={tr(locale, "粘弾性の採用値（倍率適用済み）", "Effective viscoelastic parameters")} headings={[tr(locale,"材料","Material"),"Ev (Pa)","τv (s)"]} rows={[[tr(locale,"心室","Ventricular"),data.sls.ventricular.branchModulusPa,data.sls.ventricular.relaxationTimeSec],[tr(locale,"心房","Atrial"),data.sls.atrial.branchModulusPa,data.sls.atrial.relaxationTimeSec]]} />}
    <p className={prose}>{tr(locale, "粘弾性の0.3 s枝は健康羊RV組織のProny係数を参考に各材料へ縮約した設計値で、ヒトの全壁で同定された値ではありません。", "The 0.3 s branch is a reduction informed by healthy ovine RV Prony data, not identified in every human wall.")} <a className="text-wb-accent underline" href="https://doi.org/10.1016/j.actbio.2022.08.043" target="_blank" rel="noreferrer">Acta Biomaterialia 2022</a></p>
  </>; }
  if (id === "five-wall-energy-triseg-v1") return <>
    <Table caption={tr(locale,"心室壁の形状定数","Ventricular wall geometry constants")} headings={[tr(locale,"壁","Wall"),"M (m³)","Aref (m²)"]} rows={(["LVFW","SEP","RVFW"] as const).map(w => [nodeLabel(w,locale),data.anatomy.triSeg.wallGeometryParameters[w].wallMaterialVolumeM3,data.anatomy.triSeg.wallGeometryParameters[w].referenceMidwallAreaM2])} />
    <Table caption={tr(locale,"心房の形状定数","Atrial geometry constants")} headings={[tr(locale,"壁","Wall"),"M (mL)","Vref (mL)"]} rows={(["LA","RA"] as const).map(w => [nodeLabel(w,locale),data.anatomy.atria[w].wallMaterialVolumeMl,data.anatomy.atria[w].inverseUnloadedReferenceCavityVolumeMl])} />
    <Table caption={tr(locale,"心膜の係数","Pericardial constants")} headings={two} rows={[["V0 (m³)",data.pericardium.parameters.referenceHeartVolumeM3],["P* (Pa)",data.pericardium.parameters.exponentialPressureScalePa],["k",data.pericardium.parameters.exponentialStiffness],["Poffset (Pa)",data.pericardium.parameters.prescribedPressureOffsetPa],["Vfluid (m³)",data.pericardium.prescribedPericardialFluidVolumeM3]]} />
    <p className={prose}>{tr(locale,"体格はBSA 1.9 m²、心筋密度1053 kg/m³です。形状定数は集団の画像・心筋量を組み合わせた構成値で、同一人物の全測定ではありません。基準面積は負荷時の基準伸長比1.1から定めた設計値です。心膜係数も機構検査のための設定であり、ヒト正常範囲として同定したものではありません。","BSA is 1.9 m² and tissue density 1053 kg/m³. Geometry combines population imaging/mass data, not one subject's complete measurements. Reference areas use a construction stretch of 1.1 at the loaded reference. Pericardial constants are mechanism-test choices, not identified human normal intervals.")}</p>
  </>;
  if (id === "quasisteady-four-valves-v2") return <Table caption={tr(locale,"四弁の全係数（L＝0）","Four-valve coefficients (L=0)")} headings={[tr(locale,"弁","Valve"),"R (mmHg·s/mL)","Amax (cm²)","Ar (cm²)","ko (mmHg⁻¹)","d (mmHg)","τopen (s)","τclose (s)"]} rows={Object.entries(data.valves).map(([id,p])=>[id==="AoV"?"AV":id,p.backgroundLinearResistanceMmHgSecPerMl,p.maximumForwardEoaCm2,p.closedReverseEroaCm2,p.openingGainPerMmHg,p.openingDriveDeadbandMmHg,p.openingTimeConstantSec,p.closingTimeConstantSec])} />;
  if (id === "lumped-algebraic-roots-v1") return <>
    <Table caption={tr(locale,"動脈・線形区画の有効係数","Effective arterial and linear coefficients")} headings={[tr(locale,"区画","Compartment"),"Vu (mL)","P0 (mmHg)","Vs (mL)","C (mL/mmHg)"]} rows={data.nodes.flatMap(n=>{ const p=n.law; if (!p || p.kind==="venous3") return []; return [[nodeLabel(n.id,locale),p.Vu,p.kind==="arterial"?p.P0:"—",p.kind==="arterial"?p.VsEff:"—",p.kind==="linear"?p.C:"—"]]; })} />
    <Table caption={tr(locale,"静脈型区画の有効係数","Effective venous-type coefficients")} headings={[tr(locale,"区画","Compartment"),"Vu (mL)","Cc / Co / Cd (mL/mmHg)","po / ps (mmHg)","do / ds (mmHg)","Vu,元 / G (mL)"]} rows={data.nodes.flatMap(n=>{const p=n.law; if(p?.kind!=="venous3")return []; return [[nodeLabel(n.id,locale),p.Vu,`${p.Ccoll} / ${p.Copen} / ${p.Cdist}`,`${p.Popen} / ${p.Pstiff}`,`${p.dOpen} / ${p.dStiff}`,`${n.unstressedReferenceMl} / ${n.venousToneGainMl}`]];})} />
    <Table caption={tr(locale,"主循環の接続と非弁抵抗（倍率適用済み）","Main-circuit links and effective non-valve resistance")} headings={[tr(locale,"接続：正方向","Link: positive direction"),"R (mmHg·s/mL)",tr(locale,"倍率対象","Multiplier group"),tr(locale,"追加条件","Additional law")]} rows={data.edges.map(e=>[`${nodeLabel(e.upstream,locale)} → ${nodeLabel(e.downstream,locale)}`,e.valve?tr(locale,"四弁の表を参照","See valve table"):e.loss!.resistanceMmHgSecPerMl,e.resistanceGroup==="systemic"?tr(locale,"体抵抗 ×","Systemic ×") + fmt(data.inputScales?.hemodynamic.systemicResistance ?? 1.04):e.resistanceGroup==="pulmonary"?tr(locale,"肺抵抗 ×","Pulmonary ×") + fmt(data.inputScales?.hemodynamic.pulmonaryResistance ?? .625):"—",e.valve?tr(locale,"弁の開口・方向則","Valve opening / direction"):e.waterfall?`waterfall + χ (${externalLabel(e.external,locale)})`:"—"])} />
    <p className={prose}>{tr(locale,"血管区画の係数と直列抵抗の配分は集中定数モデルの構成・校正値です。各値を特定のヒト血管部位で直接測った値と解釈しないでください。表のRへ操作倍率を重ねて掛ける必要はありません。","Vascular coefficients and resistance partition are lumped construction/calibration values, not direct measurements at specified human vascular sites. Do not apply baseline multipliers a second time to the listed R.")}</p>
  </>;
  if (id === "coronary-coupling-v3") return <>
    <Table caption={tr(locale,"冠区画の圧–容量定数","Coronary compartment PV constants")} headings={[tr(locale,"区画","Compartment"),"Vref (mL)","Cref (mL/mmHg)","P* (mmHg)","Vh (mL)"]} rows={data.coronary.topology.nodes.map(n=>[nodeLabel(n.nodeId,locale),n.pressureVolume.referenceVolumeMl,n.pressureVolume.referenceComplianceMlPerMmHg,n.pressureVolume.pressureScaleMmHg,data.coronary.collapse.hydraulicAreaReferenceVolumeMlByNode[n.nodeId as keyof typeof data.coronary.collapse.hydraulicAreaReferenceVolumeMlByNode]])} />
    <Table caption={tr(locale,"冠血管の全接続と基準抵抗（トーン・虚脱倍率を掛ける前）","All coronary links and reference resistance (before tone / collapse)")} headings={[tr(locale,"接続：正方向","Link: positive direction"),"R (mmHg·s/mL)"]} rows={data.coronary.topology.edges.map(e=>[`${nodeLabel(e.upstreamNodeId,locale)} → ${nodeLabel(e.downstreamNodeId,locale)}`,e.referenceResistanceMmHgSecPerMl])} />
    <Table caption={tr(locale,"冠循環の結合重み・短縮圧係数","Coronary coupling weights and shortening gain")} headings={[tr(locale,"領域","Territory"),"wL / wS / wR","K (mmHg)",tr(locale,"安静Qtarget：心外膜 / 心内膜 (mL/s)","Rest Qtarget: epi / endo (mL/s)")]} rows={territoryIds.map(t=>{const w=data.coronary.imp.perfusedWallWeightByTerritory[t], p=data.coronary.prior.territories[t]; return [t,`${w.LVFW} / ${w.SEP} / ${w.RVFW}`,data.coronary.shortening.pressureGainMmHgPerUnitShorteningByTerritory[t],layerIds.map(l=>fmt(p.targetRestingFlowMlPerMin/60*p.layers[l].restingFlowFractionWithinTerritory01)).join(" / ")];})} />
    <p className={prose}>{tr(locale,"層深さdは心外膜側0.25・心内膜側0.75です。容量配分はブタ冠循環の形態、C1/C2はイヌの有効コンプライアンスを出発点とし、拍動下の局所検査で一部を調整しています。ヒト個別データから一意に同定した回路ではありません。","Layer depths are 0.25 (epi) and 0.75 (endo). Volume allocation starts from porcine morphometry and C1/C2 from canine effective compliance, with selected adjustments from beating-boundary checks. This is not a uniquely identified human circuit.")}</p>
    <p className="mt-3 text-xs leading-6"><a className="text-wb-accent underline" href="https://pubmed.ncbi.nlm.nih.gov/7810711/" target="_blank" rel="noreferrer">Kassab et al. 1994</a> · <a className="text-wb-accent underline" href="https://doi.org/10.1152/ajpheart.2000.278.2.H383" target="_blank" rel="noreferrer">Spaan et al. 2000</a></p>
  </>;
  return null;
}

export function MainWireModuleEquationDetailsV1({ data, id, locale, Equation }: { data: MainWireEquationDataV1; id: string; locale: Locale; Equation: Eq }) {
  const blocks=MAIN_WIRE_EQUATION_SPECIFICATION_V1[id];
  if(!blocks) return null;
  return <div className="mt-6 border-t border-wb-line pt-1" data-equation-module={id}>
    {id==="five-wall-energy-triseg-v1"&&<TriSegFigure locale={locale}/>}
    {id==="coronary-coupling-v3"&&<CoronaryFigure locale={locale}/>}
    {blocks.map(b=><section key={b.id} id={b.id} className="mt-6 scroll-mt-4" data-equation-block={b.id}>
      <h4 className="mb-3 text-sm font-semibold">{b.title[locale]}</h4>
      {b.paragraphs.map((p,i)=><p key={i} className={`mt-3 ${prose}`}>{p[locale]}</p>)}
      {b.equations.map(e=><Equation key={e} expression={e}/>)}
    </section>)}
    <ParameterTables data={data} id={id} locale={locale}/>
  </div>;
}

export function MainWireAssemblyAndInitialStateV1({ data, locale, Equation }: { data: MainWireEquationDataV1; locale: Locale; Equation: Eq }) {
  const s=data.initial;
  return <div data-testid="equation-initial-state">
    <p className={prose}>{tr(locale,"独立した血液量は31区画に分布し、その総和をTBVに固定します（独立自由度は30）。各壁にLandの6状態・粘性歪み1状態・Ca源2状態、四弁に開口状態を持ちます。さらに冠循環の6トーンと、拍時刻・Ca入力強度・直前の僧帽弁閉鎖時歪みを引き継ぎます。心腔圧・血管圧・流量・中隔位置・接合円半径は、その時点の連立条件で求める量です。","Blood occupies 31 compartments, constrained by fixed TBV (30 independent volume degrees of freedom). Each wall has six Land states, one viscous strain and two calcium states; four valves have opening states. Six coronary tones and event/load/previous-MVC memories are retained. Pressures, flows and internal geometry follow simultaneous algebraic constraints.")}</p>
    <Equation expression={String.raw`\begin{aligned}V_{n+1}-V_n&=\Delta t\,NQ_{n+1},\\z_{n+1}-z_n&=\Delta t\,f(z_{n+1},Ca_{n+1},\lambda_{n+1},\dot\lambda_{n+1}),\\0&=g(V_{n+1},z_{n+1},P_{n+1},Q_{n+1},v_{S,n+1},y_{n+1}).\end{aligned}`} />
    <p className={`mt-3 ${prose}`}>{tr(locale,"zはLand・粘弾性・開口の状態、fは各節の時間発展式、gは圧–容量関係・流量則・力の釣り合いです。全体を後退Eulerで連立し、Ca源はイベント間の指数解を使います。候補容積→形状・筋長→材料応力→圧→流量→容積収支が同時に整合するまで解きます。血管だけを先に更新して古い心腔圧を使い続ける手順ではありません。","z collects Land/viscous/opening states; f is the documented evolution and g the constitutive, hydraulic and force-balance constraints. The coupled system uses backward Euler, with exact inter-event calcium propagation. Candidate volume, geometry, stress, pressure and flow must satisfy continuity together; vascular updates do not keep stale cavity pressures.")}</p>
    <p className={`mt-3 ${prose}`}>{tr(locale,"通常刻みは2 msです。興奮・Ca入力・制御周期の境界ではステップを分けます。冠トーンは完了周期の流量積分を用いて更新します。状態の非負性・有限性・体積保存・非線形残差を満たさない試行は採用しません。別の数値積分法でも同じ連続モデルを組めますが、有限刻みのピーク・弁イベント・保存されたbaselineとの一致は別途検証が必要です。","Nominal step is 2 ms, split at activation, calcium and control-window boundaries. Coronary tone updates from completed-cycle flow integrals. Invalid populations, nonfinite states, volume imbalance or failed nonlinear solves are not accepted. Another integrator may approximate the same continuous equations, but finite-step peaks/events and saved baseline parity require separate checks.")}</p>
    <h4 className="mt-6 text-sm font-semibold">{tr(locale,"保存されたbaselineの初期条件","Saved baseline initial conditions")}</h4>
    <p className={`mt-3 ${prose}`}>{tr(locale,"以下は起動に使う定常化済み状態です。基準時刻t₀＝","The settled launch state below is at t₀=")}{fmt(s.timeSec)} s。{tr(locale,"時刻を0へ移す場合は、興奮予定・最後の興奮・制御周期の時刻も同じだけ移します。容積だけを移して材料やCaを0にすると、同じ初期条件にはなりません。表示は有効数字12桁で、保存値全桁の表をCSVで取得できます。","If shifting time to zero, shift event and control times equally. Keeping volumes but zeroing material/Ca states is not equivalent. Display uses 12 significant digits; CSV retains full stored precision.")}</p>
    <Table caption={tr(locale,"初期血液量（mL）","Initial blood volume (mL)")} headings={[tr(locale,"区画","Compartment"),"V(t₀)" ]} rows={[...Object.entries(s.volumesMl),...Object.entries(s.coronary.volumeMlByNode)].map(([id,v])=>[nodeLabel(id,locale),v])}/>
    <Table caption={tr(locale,"初期Land状態（全て無次元）","Initial Land states (dimensionless)")} headings={[tr(locale,"壁","Wall"),"c","b","W","S","ζw","ζs"]} rows={wallIds.map(w=>[nodeLabel(w,locale),...s.mechanics.wallStateByWall[w].landState])}/>
    <Table caption={tr(locale,"初期歪みとCa状態（無次元）","Initial strain / calcium states (dimensionless)")} headings={[tr(locale,"壁","Wall"),"e(t₀)","α(t₀)","xr(t₀)","xd(t₀)"]} rows={wallIds.map(w=>[nodeLabel(w,locale),s.mechanics.wallStateByWall[w].previousFiberLogStrain,s.mechanics.wallStateByWall[w].slsState.viscousLogStrain,...s.rhythm.calciumStateByWall[w]])}/>
    <Table caption={tr(locale,"初期開口・形状","Initial opening / geometry")} headings={[tr(locale,"量","Quantity"),tr(locale,"値","Value")]} rows={[...Object.entries(s.valveStates).map(([w,p])=>[`${w==="AoV"?"AV":w} ξ`,p.leafletOpeningFraction01]),["vS (m³)",s.mechanics.trisegCoordinates.septalMidwallCapVolumeM3],["y (m)",s.mechanics.trisegCoordinates.junctionRadiusM]]}/>
    <Table caption={tr(locale,"冠トーン・周期途中の積分","Coronary tone and partial-window integrals")} headings={[tr(locale,"領域・層","Territory / layer"),"θ(t₀)","∫Qm dt (mL)"]} rows={territoryIds.flatMap(t=>layerIds.map(l=>[`${t} ${layerLabel(l,locale)}`,s.coronary.toneResistanceScaleByTerritoryLayer[t][l],s.coronaryAutoregulation.qmTimeIntegralMlByTerritoryLayer[t][l]]))}/>
    <Table caption={tr(locale,"引き継ぐ時刻と離散状態","Retained timing and discrete memory")} headings={[tr(locale,"量","Quantity"),tr(locale,"値","Value")]} rows={[
      [tr(locale,"次の心房興奮 (s)","Next atrial activation (s)"),s.rhythm.regularAtrialSourceState.nextActivationTimeSec],
      [tr(locale,"直前の心室興奮 (s)","Last ventricular activation (s)"),s.rhythm.ventricularIntervalStrengthState.lastAcceptedVentricularActivation.activationTimeSec],
      ["L(t₀)",s.rhythm.ventricularIntervalStrengthState.normalizedSrLoadState],
      [tr(locale,"冠制御周期の開始 (s)","Coronary window start (s)"),s.coronaryAutoregulation.windowStartAcceptedTimeSec],
      [tr(locale,"冠制御周期の経過 (s)","Elapsed coronary window (s)"),s.coronaryAutoregulation.acceptedDurationSec],
      ...Object.entries(s.shorteningReference.reference.referenceFiberLogStrainByWall).map(([w,v])=>[`eMVC,${w}`,v]),
    ]}/>
    <p className={prose}>{tr(locale,"この時刻に未処理のCa入力・伝導イベントはありません。次のCa入力時刻は、上の次回心房興奮に12 ms（心房）または132 ms（心室）を加えます。冠制御周期は元の時刻0からT＝60/70 sごとです。初期状態から再計算し、少なくとも複数周期の整合を確認してください。収束の一意性や全症例での安定性まで、この状態表が保証するものではありません。","There are no pending calcium/conduction events at this instant. Next calcium deposits follow the next atrial activation by 12 ms (atria) or 132 ms (ventricles). Coronary windows are T=60/70 s from original time zero. Recompute several cycles to verify consistency; this table does not establish uniqueness or stability in every scenario.")}</p>
    <button data-document-action="csv" className="mt-4 text-sm text-wb-accent underline focus-visible:ring-2 focus-visible:ring-wb-accent">{tr(locale,"採用値・初期条件の表を保存（CSV）","Save parameter and initial-state tables (CSV)")}</button>
  </div>;
}
