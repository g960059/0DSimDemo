import React from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  HeartPulse,
  Network,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { homeHref } from "@/homeLinks";
import type { Locale } from "@/localeRouting";
import type {
  MainWireStandard68DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard68DocumentationFactsV1";
import { MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID, MAIN_WIRE_PERIODIC_PVA_METHOD_V12_ID } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";

const COPY = Object.freeze({
  ja: Object.freeze({
    back: "ホームへ戻る",
    eyebrow: "MODEL DOCUMENTATION",
    title: "Main Wire Standard 68",
    subtitle: "rounded-ejection baselineを備えた統合0D循環動態モデル",
    qualifiedTitle: "Main Wire Standard 69",
    qualifiedSubtitle: "検証済みbaselineを備えた統合0D循環動態モデル",
    pulmonaryRootTitle: "Main Wire Standard 70",
    pulmonaryRootSubtitle:
      "代数的肺動脈rootを備えた統合0D循環動態モデル",
    status: "研究・教育用モデル · 臨床的妥当性は未確立",
    lead:
      "このページはStandard 68のexact model、現在のModel Surface、versioned analysisを分けて説明します。baseline gateは数理・生理的な品質管理であり、患者個別の診断や治療判断を保証するものではありません。",
    qualifiedLead:
      "このページはStandard 69のexact model、現在のModel Surface、versioned analysisを分けて説明します。Standard 69はStandard 68の数式構成を保ち、独立したbaseline fittingとmint gateを通過した既定作動点を持ちます。これは患者個別の診断や治療判断を保証するものではありません。",
    pulmonaryRootLead:
      "このページはStandard 70のexact model、現在のModel Surface、versioned analysisを分けて説明します。Standard 70はStandard 69を基礎に、PA–PArt間だけをsourceの損失係数を保つ代数的flow lawへ変更し、右心・肺動脈を含むbaseline gateを通過しています。現在の二次損失係数は0で、名目上は線形抵抗です。これは患者個別の診断や治療判断を保証するものではありません。",
    scopeTitle: "モデルの範囲",
    scopeBody:
      "心室相互作用、四弁、体循環・肺循環、冠循環、regular sinus rhythm、呼吸・心膜圧を結合した集中定数モデルです。心室materialとmatched-alpha calcium/relaxation構成をrounded-ejection assemblyへ更新しています。",
    stationTitle: "AoPとABPのstation",
    aopTitle: "AoP",
    aopBody:
      "このexact releaseでは、大動脈弁直後のsource aortic-root compliance node圧を表示します。局所pressure recovery後のPproxではありません。",
    abpTitle: "ABP",
    abpBody:
      "体動脈（SA）compartment圧です。特定のカフ・動脈ライン位置、圧波伝播後の末梢圧とは同一ではありません。",
    stationWarning:
      "AoP、ABPとも、分布定数系の伝播遅延・進行波・反射波を含みません。recovered proximal constitutive-port圧をこのexact releaseへ代用していません。",
    dynamicsTitle: "exact dynamics",
    dynamicsItems: Object.freeze([
      "心室active/passive materialはversioned rounded-ejection profileです。",
      "近位体・肺動脈はsourceのmomentum/compliance topologyを保持します。Standard 67の代数的rootは継承しません。",
      "新しいcontinuous state、AV opening state、局所pressure-recovery correctionは追加していません。",
    ]),
    pulmonaryRootDynamicsItem:
      "近位体動脈はsource momentum/compliance topologyを保ちます。PA–PArt間のみ局所inertanceを持たない代数的flow lawとし、線形抵抗・source二次損失係数・PA/PArt complianceは保持します。source二次損失係数は現在0です。",
    analysisTitle: "Surfaceとanalysis",
    analysisBody:
      "現在のModel Surfaceはraw exact PV orbitに加え、versioned ESPVR、EDPVR、PVA/PE、Guyton / Starling analysisをpinします。ESPVRはpreload低下側からbaselineまでを用い、EDPVRとStarlingは高容量側を含む双方向familyを保持します。これらの分岐計算はexact stateやcheckpointを変更しません。",
    analysisPhaseLimit:
      "ESPVRを評価する共通時刻は、各作動点の収縮後期から選択します。作動点と評価範囲に依存するため、TBVだけの変更でも曲線はずれ得ます。その差だけを収縮力の変化とは解釈できません。",
    measuredHighLoadBody:
      "高容量側は同じ選択時刻で得た計算上の実測点をTBV順に結びます。外挿や単調性の強制は行わず、PE/PVAの計算境界には使用しません。",
    loadResponseBody:
      "通常表示のESPVRは、低容量側・高容量側を含む定常化済みの負荷群から得た経壁圧の包絡線です。共通の心房興奮時刻で隣り合うTBV条件を結び、保存された拍内経路を時間方向に線形補間したPV面について、各容積で圧が最大となる時刻・枝を選びます。容積順に負荷を並べ替えたり、弁閉鎖点を結んだりはしません。区間内の最大値も評価するため、別の粗い時刻グリッドを設けません。表示域は負荷群で観測された最小心室容積の範囲に限定し、域外を収縮能力として外挿しません。欠測・未収束の負荷は補間で橋渡ししません。これはEmax曲線でも、等容性収縮能力でも、負荷に完全に独立な収縮力指標でもなく、収縮履歴・循環の相互作用・sweepの範囲に依存し得ます。EDPVRは同じ負荷群の最大容積時点による指数関数近似です。追加のsweepは行いません。",
    energyViewBody:
      "pane設定のPVAを選ぶと、通常のESPVR近似の代わりにPVA計算で採用した同時刻境界を表示します。時刻はanchor ESV付近の狭い容積範囲で能動圧面積を最大化して選択するため、TBVだけでも変化します。SWは受理された計算ステップの経壁圧–容積仕事、PEはその境界と非負EDPVRの間の幾何学的面積、PVAはSW+PEです。低容量側の未観測域には既存の端点接線近似を用います。SWの塗りは保持されたループの標本、PEの斜線は計算に用いる積分点です。両者を別々に示し、重複した領域の和集合をPVAとは扱いません。同時刻であっても同一のLand/SLS内部状態を意味せず、PEを回収可能な弾性エネルギー、PVAをATP消費の直接測定とは解釈できません。MVO2は文献係数による推定です。",
    baselineTitle: "baseline mint qualification",
    baselineBody: (cycles: number, checks: number) =>
      `${cycles}周期でperiod-1 settlementを確認し、圧・AV/LV/RVP・timing・形態・indexed size/functionの${checks}項目を記録しています。この記録の評価方針における必須gateと、双方向preload reserve gateを通過しています。`,
    qualifiedBaselinePolicy:
      "Standard69の追加floorは、各方向・両心室でCO変化率3%以上、CO/充満圧勾配0.02 L/min/mmHg以上、EDV変化率3%以上です。探索結果の確認後に固定したconstruction用退行防止基準であり、独立した生理学的検証ではありません。",
    pulmonaryRootBaselinePolicy:
      "Standard70はPVのraw pressure gradient/ET、TV E/A、右室ICT/IRT/Tei、PAP/PV flowの形態も検査します。旧baseline記録では左右の±dP/dtにも狭い必須範囲を用いましたが、新しい評価では参考警告とし、時間刻み依存性と単発スパイクを別の数値品質検査に分けています。旧記録は再ラベルしません。これらは臨床診断閾値ではありません。",
    controlTitle: "control semantics",
    controlBody:
      "Heart rateなど通常のcontrol変更はaccepted stateとmodel clockを起点に、新しいfixture epochへatomic warm startします。TBV変更はdetached preflightされ、bounded continuationが必要な場合は後続のaccepted boundaryをatomic commitすることがあります。いずれも自律神経反射を再現するものではありません。",
    limitationsTitle: "限界",
    limitations: Object.freeze([
      "0Dモデルのため、局所3D flow、jet形状、壁面応力、空間的なwave propagationを解像しません。",
      "AoPには局所pressure recoveryを適用していないため、Doppler・catheter・特定上行大動脈断面の圧と交換できません。",
      "baseline gate、数値収束、形態チェックは、全ての負荷条件や患者での臨床的正常性を保証しません。",
      "本モデルはAS診断、重症度判定、治療選択、患者個別予測には使用できません。",
    ]),
    identityTitle: "固定されたidentity",
    modelId: "Exact model ID",
    surfaceReleaseId: "Surface release ID",
    surfaceSeriesId: "Surface series ID",
  }),
  en: Object.freeze({
    back: "Back to home",
    eyebrow: "MODEL DOCUMENTATION",
    title: "Main Wire Standard 68",
    subtitle: "Integrated 0D haemodynamic model with a rounded-ejection baseline",
    qualifiedTitle: "Main Wire Standard 69",
    qualifiedSubtitle: "Integrated 0D haemodynamic model with a qualified baseline",
    pulmonaryRootTitle: "Main Wire Standard 70",
    pulmonaryRootSubtitle:
      "Integrated 0D haemodynamic model with an algebraic pulmonary root",
    status: "Research and education model · not clinically validated",
    lead:
      "This page separates the Standard 68 exact model, its current Model Surface, and versioned analyses. Baseline gates are mathematical and physiological quality controls, not patient-specific diagnostic or treatment validation.",
    qualifiedLead:
      "This page separates the Standard 69 exact model, its current Model Surface, and versioned analyses. Standard 69 retains the Standard 68 equations and adds a separately fitted, mint-qualified default operating point. This does not establish patient-specific diagnostic or treatment validity.",
    pulmonaryRootLead:
      "This page separates the Standard 70 exact model, its current Model Surface, and versioned analyses. Standard 70 changes only PA–PArt to an algebraic flow law retaining the source loss coefficients, and passes baseline gates that include the right heart and pulmonary artery. The current quadratic coefficient is zero, so the nominal relation is linear. This does not establish patient-specific diagnostic or treatment validity.",
    scopeTitle: "Model scope",
    scopeBody:
      "A lumped model coupling ventricular interaction, four valves, systemic and pulmonary circulation, coronary circulation, regular sinus rhythm, respiration, and pericardial pressure. Ventricular material and matched-alpha calcium/relaxation use the rounded-ejection assembly.",
    stationTitle: "AoP and ABP stations",
    aopTitle: "AoP",
    aopBody:
      "In this exact release, AoP is the source aortic-root compliance-node pressure immediately downstream of the aortic valve. It is not the recovered Pprox station.",
    abpTitle: "ABP",
    abpBody:
      "Pressure of the systemic-arterial (SA) compartment. It is not a literal cuff or arterial-line station after peripheral wave travel.",
    stationWarning:
      "Neither AoP nor ABP includes distributed propagation delay, travelling waves, or reflections. Recovered proximal constitutive-port pressure is not substituted into this exact release.",
    dynamicsTitle: "Exact dynamics",
    dynamicsItems: Object.freeze([
      "Ventricular active/passive material uses a versioned rounded-ejection profile.",
      "The proximal systemic and pulmonary arteries retain the source momentum/compliance topology; the Standard 67 algebraic roots are not inherited.",
      "No new continuous state, AV opening state, or local pressure-recovery correction is added.",
    ]),
    pulmonaryRootDynamicsItem:
      "The proximal systemic artery retains the source momentum/compliance topology. Only PA–PArt uses an algebraic flow law without local inertance; linear resistance, the source quadratic-loss coefficient, and PA/PArt compliance remain. The source quadratic coefficient is currently zero.",
    analysisTitle: "Surface and analysis",
    analysisBody:
      "The current Model Surface pins versioned ESPVR, EDPVR, PVA/PE, and Guyton / Starling analyses alongside the raw exact PV orbit. ESPVR uses the preload-reduction limb through baseline, while EDPVR and Starling retain the bidirectional family. Their branch computations do not mutate exact state or checkpoints.",
    analysisPhaseLimit:
      "The common ESPVR sampling time is selected within late systole for each operating state. It depends on that state and the scoring volume range, so changing TBV alone can shift the curve; that difference alone does not establish altered contractility.",
    measuredHighLoadBody:
      "Higher-load points are sampled from simulated beats at the same selected time and joined in TBV order, without extrapolation or forced monotonicity. They do not define the PE/PVA boundary.",
    loadResponseBody:
      "The default ESPVR is the transmural pressure envelope of the settled family, including both lower and higher loads. Adjacent TBV branches are interpolated at a common atrial-capture clock, with linear interpolation along retained beat paths. At each volume, the maximum pressure over time and supported branches is selected, including extrema inside time intervals, without a separate coarse time grid. Loads are not sorted by ventricular volume and closure landmarks are not joined. Display is limited to the family's observed minimum-volume range; other volumes are not extrapolated as systolic capability. Missing or unsettled loads are not bridged. This is neither Emax, isovolumic capability, nor a fully load-independent contractility measure: contraction history, circulatory coupling and sweep coverage can still change it. EDPVR fits an exponential to maximum-volume filling points from the same family. No additional sweep is run.",
    energyViewBody:
      "Selecting PVA in pane settings replaces the default ESPVR approximation with the common-time boundary adopted by the PVA calculation. Timing maximizes active-pressure area over a small anchor-ESV neighborhood and can change with TBV alone. SW uses accepted-step transmural path work; PE is geometric area between this boundary and nonnegative EDPVR, including the existing local tangent for the unresolved low-volume tail; PVA = SW + PE. The SW fill illustrates the retained sampled loop; the PE hatch uses the owner's quadrature nodes. They are separate illustrations, not an area union when overlapping. A common clock does not imply a common Land/SLS state. PE is not a measurement of recoverable elastic energy, nor PVA a direct measurement of ATP use; MVO2 remains a literature-coefficient estimate.",
    baselineTitle: "Baseline mint qualification",
    baselineBody: (cycles: number, checks: number) =>
      `Period-1 settlement was established over ${cycles} cycles, recording ${checks} pressure, AV/LV/RVP, timing, morphology, and indexed size/function checks. Mandatory gates under the recorded assessment policy and the bidirectional preload-reserve gate passed.`,
    qualifiedBaselinePolicy:
      "Standard69 adds floors of 3% CO change, 0.02 L/min/mmHg CO/filling-pressure slope, and 3% EDV change in each direction for both ventricles. They were frozen after exploratory result inspection as construction non-regression floors, not independent physiological validation.",
    pulmonaryRootBaselinePolicy:
      "Standard70 also examines PV raw pressure gradient/ET, TV E/A, right-sided ICT/IRT/Tei, and PAP/PV-flow morphology. Historical baseline evidence used narrow mandatory LV/RV ±dP/dt ranges; current assessments retain these as reference warnings and separately screen time-step sensitivity and isolated spikes. Historical reports are not relabelled. These are not clinical diagnostic thresholds.",
    controlTitle: "Control semantics",
    controlBody:
      "Heart rate and ordinary controls atomically warm-start a new fixture epoch from the accepted state and model clock. TBV is detached-preflighted; when bounded continuation is required, it may atomically commit a later accepted boundary. Neither transition models an autonomic reflex.",
    limitationsTitle: "Limitations",
    limitations: Object.freeze([
      "A 0D model does not resolve local 3D flow, jet geometry, wall stress, or spatial wave propagation.",
      "AoP has no local pressure-recovery correction and is not interchangeable with Doppler, catheter, or a specified ascending-aortic station.",
      "Baseline gates, numerical convergence, and morphology checks do not establish clinical normality for every loading condition or patient.",
      "The model must not be used to diagnose or grade aortic stenosis, select treatment, or make patient-specific predictions.",
    ]),
    identityTitle: "Pinned identities",
    modelId: "Exact model ID",
    surfaceReleaseId: "Surface release ID",
    surfaceSeriesId: "Surface series ID",
  }),
} as const);

export function MainWireStandard68DocumentationV1({
  facts,
  locale,
}: Readonly<{
  facts: MainWireStandard68DocumentationFactsV1;
  locale: Locale;
}>) {
  const text = COPY[locale];
  const qualified = facts.generation === 69;
  const pulmonaryRoot = facts.generation === 70;
  const title = pulmonaryRoot
    ? text.pulmonaryRootTitle
    : qualified
      ? text.qualifiedTitle
      : text.title;
  const subtitle = pulmonaryRoot
    ? text.pulmonaryRootSubtitle
    : qualified
      ? text.qualifiedSubtitle
      : text.subtitle;
  const lead = pulmonaryRoot
    ? text.pulmonaryRootLead
    : qualified
      ? text.qualifiedLead
      : text.lead;
  const dynamicsItems = pulmonaryRoot
    ? Object.freeze([
        text.dynamicsItems[0],
        text.pulmonaryRootDynamicsItem,
        text.dynamicsItems[2],
      ])
    : text.dynamicsItems;
  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid={pulmonaryRoot
        ? "standard70-model-documentation-v1"
        : qualified
          ? "standard69-model-documentation-v1"
          : "standard68-model-documentation-v1"}
    >
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <Link
          to={homeHref(locale)}
          className="inline-flex min-h-9 items-center gap-2 rounded-md text-sm font-medium text-wb-muted hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {text.back}
        </Link>

        <header className="mt-10 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-wb-accent">{text.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-3 text-base font-medium text-wb-muted sm:text-lg">{subtitle}</p>
          <p className="mt-5 inline-flex rounded-full border border-wb-line-strong bg-wb-soft px-3 py-1.5 text-xs font-semibold text-wb-warning">{text.status}</p>
          <p className="mt-6 max-w-3xl text-[15px] leading-8 text-wb-muted">{lead}</p>
        </header>

        <Section icon={HeartPulse} title={text.scopeTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">{text.scopeBody}</p>
        </Section>

        <Section icon={Network} title={text.stationTitle}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FactCard title={text.aopTitle} body={text.aopBody} identity={facts.stations.aopOutputId} />
            <FactCard title={text.abpTitle} body={text.abpBody} identity={facts.stations.abpOutputId} />
          </div>
          <p className="mt-4 rounded-xl border border-wb-warning/35 bg-wb-warning/10 px-4 py-3 text-sm leading-6 text-wb-muted">{text.stationWarning}</p>
        </Section>

        <Section icon={Gauge} title={text.dynamicsTitle}>
          <ul className="space-y-3">
            {dynamicsItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-7 text-wb-muted">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-wb-accent" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Activity} title={text.analysisTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">{
            facts.surface.periodicPvaMethodId === MAIN_WIRE_PERIODIC_PVA_METHOD_V12_ID
              ? text.loadResponseBody : text.analysisBody}</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-wb-muted">
            {facts.surface.periodicPvaMethodId === MAIN_WIRE_PERIODIC_PVA_METHOD_V12_ID
              ? text.energyViewBody : text.analysisPhaseLimit}
            {facts.surface.periodicPvaMethodId === MAIN_WIRE_PERIODIC_PVA_METHOD_V10_ID
              ? ` ${text.measuredHighLoadBody}` : ""}
          </p>
          {facts.surface.periodicPvaMethodId === MAIN_WIRE_PERIODIC_PVA_METHOD_V12_ID && (
            <p className="mt-3 text-xs leading-6 text-wb-muted">
              <a className="underline" href="https://pubmed.ncbi.nlm.nih.gov/7218521/">Suga 1981: end ejection ≠ end systole</a>
              {" · "}<a className="underline" href="https://pubmed.ncbi.nlm.nih.gov/426086/">Suga 1979: PVA and oxygen consumption</a>
              {" · "}<a className="underline" href="https://pubmed.ncbi.nlm.nih.gov/22879535/">Han 2012: energetics limitations</a>
            </p>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FactCard
              title={text.baselineTitle}
              body={text.baselineBody(
                facts.baseline.completedCycleCount,
                facts.baseline.passedCheckCount,
              ) + (pulmonaryRoot
                ? ` ${text.pulmonaryRootBaselinePolicy}`
                : qualified
                  ? ` ${text.qualifiedBaselinePolicy}`
                  : "")}
            />
            <FactCard title={text.controlTitle} body={text.controlBody} identity={facts.runtime.heartRateControlId} />
          </div>
        </Section>

        <Section icon={ShieldAlert} title={text.limitationsTitle}>
          <ul className="space-y-3">
            {text.limitations.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-7 text-wb-muted">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-wb-warning" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={CheckCircle2} title={text.identityTitle}>
          <dl className="divide-y divide-wb-line overflow-hidden rounded-xl border border-wb-line bg-wb-panel">
            <IdentityRow label={text.modelId} value={facts.identity.modelId} />
            <IdentityRow label={text.surfaceReleaseId} value={facts.identity.surfaceReleaseId} />
            <IdentityRow label={text.surfaceSeriesId} value={facts.identity.surfaceSeriesId} />
          </dl>
        </Section>
      </main>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: Readonly<{
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="mt-12 border-t border-wb-line pt-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-wb-accent/12 text-wb-accent">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FactCard({
  title,
  body,
  identity,
}: Readonly<{ title: string; body: string; identity?: string }>) {
  return (
    <div className="rounded-xl border border-wb-line bg-wb-panel p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-wb-muted">{body}</p>
      {identity !== undefined && (
        <code className="mt-3 block break-all text-[11px] leading-5 text-wb-subtle">{identity}</code>
      )}
    </div>
  );
}

function IdentityRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold text-wb-muted">{label}</dt>
      <dd className="break-all font-mono text-xs leading-5 text-wb-text">{value}</dd>
    </div>
  );
}
