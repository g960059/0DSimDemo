import React from "react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Gauge,
  HeartPulse,
  Network,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { homeHref } from "@/homeLinks";
import type { Locale } from "@/localeRouting";
import type {
  MainWireStandard66DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard66DocumentationFactsV1";

const COPY = Object.freeze({
  ja: Object.freeze({
    back: "ホームへ戻る",
    eyebrow: "MODEL DOCUMENTATION",
    title: "Main Wire Standard 66",
    subtitle: "選択大動脈流出路を備えた統合0D循環動態モデル",
    status: "研究・教育用モデル · 臨床的妥当性は未確立",
    lead:
      "このページは、exact modelが計算する量と、現在のModel Surfaceが臨床向けにどう表示するかを分けて説明します。数値verificationは行われていますが、患者個別予測、診断、治療判断を目的としたモデルではありません。",
    scopeTitle: "モデルの範囲",
    scopeBody:
      "心室相互作用、体循環・肺循環、冠循環、regular sinus rhythm、呼吸・心膜圧を結合した集中定数モデルです。このreleaseではdynamic mechanical supportをoffに固定し、選択大動脈流出路とmatched-alpha calcium/relaxation構成を使用します。",
    stationTitle: "大動脈圧のstation",
    stationLead:
      "AoP、ABP、vena-contracta gradientは同じ圧を別名で示すものではありません。下図の各位置と計算基準を保って解釈します。",
    lvTitle: "LV chamber",
    lvLabel: "LVP",
    lvBody: "左室内のabsolute chamber pressure。",
    valveTitle: "AV / vena contracta",
    valveLabel: "jet maximum",
    valveBody:
      "effective orificeを通るjetのBernoulli gradient。forward flowでは、この後にstatic pressure recoveryを適用します。",
    proxTitle: "Proximal constitutive port",
    proxLabel: "AoP / Pprox",
    proxBody:
      "vena contractaから固定上行大動脈断面までの局所static pressure recoveryを弁則内で反映した後の代数的port pressure。",
    aoNodeTitle: "Ao compliance node",
    aoNodeLabel: "Surfaceでは非表示",
    aoNodeBody:
      "PproxからalgebraicなZc·Qを差し引いた内部compliance state。臨床AoPとして表示しません。",
    saTitle: "Systemic artery node",
    saLabel: "ABP / SA",
    saBody:
      "体動脈compliance compartmentの圧。末梢への波の伝播や反射を経たcuff/arterial-line pressureではありません。",
    relationTitle: "exact aortic law",
    relationLead:
      "以下はexact sourceのclaimが既知の意味と一致するときだけ表示されます。claimまたはSurface mappingが変わった場合、この文書はfail closedで利用不能になります。",
    forwardLawTitle: "Forward pressure law",
    forwardLawBody:
      "局所圧差は、source由来の線形弁損失、Garcia型energy-loss coefficientによる不可逆損失、固定上行大動脈断面のkinetic headから構成されます。arterial characteristic loadは弁散逸には分類しません。reverse flowにはpressure recoveryを適用しません。",
    parameterTitle: "固定された流出路parameter",
    eoa: "Reference maximum forward EOA",
    aaDiameter: "Ascending-aortic diameter",
    aaArea: "Ascending-aortic area",
    zc: "Characteristic impedance Zc",
    residualResistance: "Residual downstream resistance",
    sourceResistance: "Original Ao–SA topology resistance",
    memoryTitle: "状態と数値構造",
    memoryItems: Object.freeze([
      "AVのaccepted memoryはbounded leaflet-opening fractionだけです。flow memoryやlocal valve inertanceはありません。",
      "openingとalgebraic flowはbackward-Euler関係を満たすよう同時に解きます。追加のcontinuous state、pressure/flow smoothing、parameter fittingはありません。",
      "Zc·Qは代数的characteristic loadです。分布定数系の伝播時間、進行波、反射波は計算していません。",
    ]),
    surfaceTitle: "Workbenchでの表示",
    exactBadge: "Exact model",
    surfaceBadge: "Model Surface",
    aopTitle: "AoP",
    aopBody:
      "Pproxを短い臨床ラベルで表示します。固定上行大動脈断面までの局所static pressure recovery後ですが、特定距離のcatheter tipと同一であるとは主張しません。",
    abpTitle: "ABP",
    abpBody:
      "SA compartment pressureを表示します。central/peripheral arterial waveform、cuff pressure、反射波を含む実測ABPとの同一性は主張しません。",
    gradientTitle: "Gradient",
    gradientBody:
      "LV−Pproxのlocal hydraulic gradient、vena-contracta Bernoulli gradient、臨床Doppler/catheter gradientを区別します。raw LV−Ao compliance-node差は臨床AV gradientとして表示しません。",
    runtimeTitle: "PV loopとcontrol semantics",
    pvTitle: "PV loop",
    pvBody:
      "このSurfaceのPV loopはexact accepted trajectoryから描くraw loopです。formal PVA/ESPVR/EDPVRやGuyton/Starling structural analysisは、このSurfaceでは計算・表示しません。",
    hrTitle: "Heart rate",
    hrBody:
      "Heart rate変更はwarm perturbationではありません。新しいfixture epochを作り、accepted clockとtrajectoryを0から置き換えるatomic cold restartです。",
    beatAnalysisTitle: "心周期derived outputs",
    beatAnalysisLead:
      "このSurface releaseでは、exact modelのstateやcheckpointを増やさず、直近の完結したregular-sinus cycleからanalysis layerがbeat指標を導出します。",
    beatSourceTitle: "時間基準と心周期",
    beatSourceBody:
      "固定間隔のexact presentation境界をbucket化・平滑化せず保持し、regular-sinus phase wrap間を1心周期とします。presentation境界間の内部accepted solver substepは別frameとして観測しません。入力epoch、時刻格子、必須outputが連続しない場合は結果を利用不能にします。",
    beatGradientTitle: "AV mean gradientとET",
    beatGradientBody:
      "主要なAoV前方流episodeを選び、positive-flow ETとpeak flow 1%閾値ETを併記します。local mPGはLV−AoP局所勾配の正成分、VC mPGはvena-contracta Bernoulli勾配を同じpositive-flow ETで時間平均します。別の前方流episodeが総前方volumeの1%を超える場合は曖昧として利用不能にします。",
    beatTimingTitle: "ICT・IVRT・Tei-like",
    beatTimingBody:
      "MV前方流閉鎖からAoV前方流開始までをICT、AoV前方流終了からMV前方流開始までをIVRTとし、両者とpositive-flow ETからTei-like indexを求めます。model flow eventであり、Doppler、tissue Doppler、弁音の臨床計測手順を再現しません。",
    beatRateTitle: "dP/dtとflow shape",
    beatRateBody:
      "LV/RV pressureについて5、10、20 ms固定窓のsecant slopeの最大・最小を報告します。瞬時微分でもMR/TR jet法でもありません。AV flow shape factorは同一ejection episodeの時間、前方volume、flow二乗積分から波形の集中度を表す無次元指標です。",
    beatMethod: "Analysis method ID",
    beatInterval: "Exact presentation interval",
    limitationTitle: "限界とvalidationの境界",
    limitationItems: Object.freeze([
      "0D集中定数モデルのため、局所3D flow、jet形状、壁面応力、空間的なwave propagationやreflectionを解像しません。",
      "上行大動脈断面は固定され、pressure recoveryはforward flowの準定常な局所則です。患者固有の大動脈形状や測定位置を再現しません。",
      "数値の有限性、保存、rollback、checkpoint continuityなどのverificationは、生理学的・臨床的validationではありません。",
      "似た臨床名を持つoutputも、station、pressure basis、時間集計、測定modalityが一致しなければ交換できません。",
      "本モデルはASの診断、重症度判定、治療選択、患者個別予後予測には使用できません。",
    ]),
    evidenceTitle: "pressure recoveryの式と解釈の根拠",
    evidenceBody:
      "以下はenergy-loss coefficientとDoppler/catheter差を理解するためのequation/interpretation anchorです。Standard 66そのものの臨床validation evidenceではありません。",
    garcia2000: "Garcia et al., Circulation 2000 — energy loss concept",
    garcia2003: "Garcia et al., JACC 2003 — pressure recovery and measurement discrepancy",
    identityTitle: "固定されたidentity",
    modelId: "Exact model ID",
    surfaceReleaseId: "Surface release ID",
    surfaceSeriesId: "Surface series ID",
  }),
  en: Object.freeze({
    back: "Back to home",
    eyebrow: "MODEL DOCUMENTATION",
    title: "Main Wire Standard 66",
    subtitle: "Integrated 0D haemodynamic model with selected aortic outflow",
    status: "Research and education model · not clinically validated",
    lead:
      "This page separates quantities computed by the exact model from the way the current Model Surface presents them to clinicians. The implementation has numerical verification, but it is not intended for patient-specific prediction, diagnosis, or treatment decisions.",
    scopeTitle: "Model scope",
    scopeBody:
      "A lumped-parameter model coupling ventricular interaction, systemic and pulmonary circulation, coronary circulation, regular sinus rhythm, respiration, and pericardial pressure. This release fixes dynamic mechanical support off and uses the selected aortic-outflow and matched-alpha calcium/relaxation assembly.",
    stationTitle: "Aortic pressure stations",
    stationLead:
      "AoP, ABP, and the vena-contracta gradient are not alternative names for one pressure. Interpret each at its declared location and calculation basis.",
    lvTitle: "LV chamber",
    lvLabel: "LVP",
    lvBody: "Absolute pressure in the left-ventricular chamber.",
    valveTitle: "AV / vena contracta",
    valveLabel: "jet maximum",
    valveBody:
      "Bernoulli gradient of the jet through the effective orifice. Forward flow then undergoes the modeled static pressure recovery.",
    proxTitle: "Proximal constitutive port",
    proxLabel: "AoP / Pprox",
    proxBody:
      "Algebraic port pressure after the valve law accounts for local static recovery from the vena contracta to the fixed ascending-aortic area.",
    aoNodeTitle: "Ao compliance node",
    aoNodeLabel: "hidden by this Surface",
    aoNodeBody:
      "Internal compliance state obtained by subtracting the algebraic Zc·Q load from Pprox. It is not presented as clinical AoP.",
    saTitle: "Systemic artery node",
    saLabel: "ABP / SA",
    saBody:
      "Pressure of the systemic-arterial compliance compartment. It is not a cuff or arterial-line pressure after peripheral wave travel and reflection.",
    relationTitle: "Exact aortic law",
    relationLead:
      "These relations are shown only while exact source claims match their recognized meaning. A changed claim or Surface mapping makes this document fail closed instead of retaining stale explanatory copy.",
    forwardLawTitle: "Forward pressure law",
    forwardLawBody:
      "The local pressure difference comprises the source linear valve loss, irreversible loss from a Garcia-type energy-loss coefficient, and kinetic head at the fixed ascending-aortic area. The arterial characteristic load is not classified as valve dissipation. Pressure recovery is not applied to reverse flow.",
    parameterTitle: "Fixed outflow parameters",
    eoa: "Reference maximum forward EOA",
    aaDiameter: "Ascending-aortic diameter",
    aaArea: "Ascending-aortic area",
    zc: "Characteristic impedance Zc",
    residualResistance: "Residual downstream resistance",
    sourceResistance: "Original Ao–SA topology resistance",
    memoryTitle: "State and numerical structure",
    memoryItems: Object.freeze([
      "The sole accepted AV memory is a bounded leaflet-opening fraction. There is no flow memory or local valve inertance.",
      "Opening and algebraic flow are solved together under a backward-Euler relation. No additional continuous state, pressure/flow smoothing, or parameter fitting is added.",
      "Zc·Q is an algebraic characteristic load. The model has no distributed propagation delay, travelling wave, or reflected wave.",
    ]),
    surfaceTitle: "Presentation in Workbench",
    exactBadge: "Exact model",
    surfaceBadge: "Model Surface",
    aopTitle: "AoP",
    aopBody:
      "Pprox is presented under a short clinical label. It is downstream of the modeled local static recovery to the fixed ascending-aortic area, but is not claimed to equal a catheter tip at a specified distance.",
    abpTitle: "ABP",
    abpBody:
      "The SA compartment pressure is presented as ABP. It is not claimed to equal a measured central or peripheral arterial waveform, cuff pressure, or signal containing reflected waves.",
    gradientTitle: "Gradient",
    gradientBody:
      "The LV−Pprox local hydraulic gradient, vena-contracta Bernoulli gradient, and clinical Doppler/catheter gradients remain distinct. The raw LV−Ao compliance-node difference is not presented as a clinical AV gradient.",
    runtimeTitle: "PV loop and control semantics",
    pvTitle: "PV loop",
    pvBody:
      "This Surface draws a raw loop from the exact accepted trajectory. It does not compute or present formal PVA/ESPVR/EDPVR or Guyton/Starling structural analysis.",
    hrTitle: "Heart rate",
    hrBody:
      "Changing heart rate is not a warm perturbation. It creates a new fixture epoch and atomically replaces the accepted clock and trajectory from zero.",
    beatAnalysisTitle: "Cardiac-cycle derived outputs",
    beatAnalysisLead:
      "In this Surface release, the analysis layer derives beat metrics from the latest completed regular-sinus cycle without adding exact-model state or checkpoint fields.",
    beatSourceTitle: "Timebase and cycle boundary",
    beatSourceBody:
      "Fixed-interval exact presentation boundaries are retained without bucketization or smoothing, and consecutive regular-sinus phase wraps define one cycle. Internal accepted solver substeps between presentation boundaries are not exposed as separate frames. A broken input epoch, time grid, or required output makes the result unavailable.",
    beatGradientTitle: "AV mean gradients and ET",
    beatGradientBody:
      "The dominant forward AoV-flow episode supplies positive-flow ET and a secondary 1%-of-peak threshold ET. Local mPG averages the positive part of the LV−AoP local gradient, while VC mPG averages the vena-contracta Bernoulli gradient over the same positive-flow ET. A second episode exceeding 1% of total forward volume makes the beat ambiguous and unavailable.",
    beatTimingTitle: "ICT, IVRT, and Tei-like index",
    beatTimingBody:
      "ICT spans model MV forward-flow closure to AoV forward-flow onset; IVRT spans AoV forward-flow cessation to MV forward-flow onset. They are combined with positive-flow ET as a Tei-like index. These model flow events do not reproduce Doppler, tissue-Doppler, or valve-sound protocols.",
    beatRateTitle: "dP/dt and flow shape",
    beatRateBody:
      "LV and RV pressure report maximum and minimum fixed-window secant slopes at 5, 10, and 20 ms. They are neither instantaneous derivatives nor MR/TR-jet measurements. The AV flow-shape factor is a dimensionless concentration measure built from time, forward volume, and the flow-squared integral of the same ejection episode.",
    beatMethod: "Analysis method ID",
    beatInterval: "Exact presentation interval",
    limitationTitle: "Limitations and validation boundary",
    limitationItems: Object.freeze([
      "As a 0D lumped model, it does not resolve local three-dimensional flow, jet geometry, wall stress, spatial wave propagation, or reflection.",
      "The ascending-aortic area is fixed, and pressure recovery is a forward-flow quasi-steady local law. Patient-specific aortic geometry and measurement position are not reproduced.",
      "Verification of finite values, conservation, rollback, and checkpoint continuity is not physiological or clinical validation.",
      "Outputs with familiar clinical names are not interchangeable unless station, pressure basis, temporal aggregation, and measurement modality match.",
      "The model must not be used to diagnose or grade aortic stenosis, select treatment, or predict an individual patient's outcome.",
    ]),
    evidenceTitle: "Equation and interpretation anchors for pressure recovery",
    evidenceBody:
      "These sources anchor the energy-loss coefficient and interpretation of Doppler/catheter differences. They are not clinical validation evidence for Standard 66 itself.",
    garcia2000: "Garcia et al., Circulation 2000 — energy loss concept",
    garcia2003: "Garcia et al., JACC 2003 — pressure recovery and measurement discrepancy",
    identityTitle: "Pinned identities",
    modelId: "Exact model ID",
    surfaceReleaseId: "Surface release ID",
    surfaceSeriesId: "Surface series ID",
  }),
} as const);

export function MainWireStandard66DocumentationV1({
  facts,
  locale,
}: Readonly<{
  facts: MainWireStandard66DocumentationFactsV1;
  locale: Locale;
}>) {
  const text = COPY[locale];
  const number = (value: number, maximumFractionDigits: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);

  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="standard66-model-documentation-v1"
    >
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <Link
          to={homeHref(locale)}
          className="inline-flex min-h-9 items-center gap-2 rounded-md text-sm font-medium text-wb-muted transition-colors hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {text.back}
        </Link>

        <header className="mt-10 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-wb-accent">
            {text.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {text.title}
          </h1>
          <p className="mt-3 text-base font-medium text-wb-muted sm:text-lg">
            {text.subtitle}
          </p>
          <p className="mt-5 inline-flex rounded-full border border-wb-line-strong bg-wb-soft px-3 py-1.5 text-xs font-semibold text-wb-warning">
            {text.status}
          </p>
          <p className="mt-6 max-w-3xl text-[15px] leading-8 text-wb-muted">
            {text.lead}
          </p>
        </header>

        <DocumentationSectionV1 icon={HeartPulse} title={text.scopeTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">
            {text.scopeBody}
          </p>
        </DocumentationSectionV1>

        <DocumentationSectionV1 icon={Network} title={text.stationTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">
            {text.stationLead}
          </p>
          <div className="mt-6 overflow-x-auto pb-2">
            <ol className="grid min-w-[58rem] grid-cols-5 gap-3" aria-label={text.stationTitle}>
              <StationCardV1
                title={text.lvTitle}
                label={text.lvLabel}
                body={text.lvBody}
              />
              <StationCardV1
                title={text.valveTitle}
                label={text.valveLabel}
                body={text.valveBody}
              />
              <StationCardV1
                title={text.proxTitle}
                label={text.proxLabel}
                body={text.proxBody}
                emphasized
              />
              <StationCardV1
                title={text.aoNodeTitle}
                label={text.aoNodeLabel}
                body={text.aoNodeBody}
              />
              <StationCardV1
                title={text.saTitle}
                label={text.saLabel}
                body={text.saBody}
                emphasized
              />
            </ol>
          </div>
        </DocumentationSectionV1>

        <DocumentationSectionV1 icon={Gauge} title={text.relationTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">
            {text.relationLead}
          </p>
          <div className="mt-7 rounded-xl border border-wb-line bg-wb-soft p-4 sm:p-5">
            <h3 className="text-sm font-semibold">{text.forwardLawTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-wb-muted">
              {text.forwardLawBody}
            </p>
          </div>

          <h3 className="mt-8 text-sm font-semibold">{text.parameterTitle}</h3>
          <dl className="mt-3 divide-y divide-wb-line overflow-hidden rounded-xl border border-wb-line bg-wb-panel">
            <FactRowV1 label={text.eoa} value={`${number(facts.aortic.referenceMaximumForwardEoaCm2, 3)} cm²`} />
            <FactRowV1 label={text.aaDiameter} value={`${number(facts.aortic.ascendingAorticDiameterCm, 3)} cm`} />
            <FactRowV1 label={text.aaArea} value={`${number(facts.aortic.ascendingAorticAreaCm2, 3)} cm²`} />
            <FactRowV1 label={text.zc} value={`${number(facts.aortic.characteristicImpedanceResistanceMmHgSecPerMl, 7)} mmHg·s/mL`} />
            <FactRowV1 label={text.residualResistance} value={`${number(facts.aortic.residualDownstreamResistanceMmHgSecPerMl, 7)} mmHg·s/mL`} />
            <FactRowV1 label={text.sourceResistance} value={`${number(facts.aortic.sourceTopologyResistanceMmHgSecPerMl, 7)} mmHg·s/mL`} />
          </dl>

          <h3 className="mt-8 text-sm font-semibold">{text.memoryTitle}</h3>
          <BulletListV1 items={text.memoryItems} />
        </DocumentationSectionV1>

        <DocumentationSectionV1 icon={Activity} title={text.surfaceTitle}>
          <div className="grid gap-4 md:grid-cols-3">
            <BoundaryCardV1
              badge={text.surfaceBadge}
              title={text.aopTitle}
              body={text.aopBody}
              identity={facts.stations.aopOutputId}
            />
            <BoundaryCardV1
              badge={text.surfaceBadge}
              title={text.abpTitle}
              body={text.abpBody}
              identity={facts.stations.abpOutputId}
            />
            <BoundaryCardV1
              badge={text.exactBadge}
              title={text.gradientTitle}
              body={text.gradientBody}
              identities={[
                facts.stations.localHydraulicGradientOutputId,
                facts.stations.venaContractaGradientOutputId,
              ]}
            />
          </div>
        </DocumentationSectionV1>

        <DocumentationSectionV1 icon={CheckCircle2} title={text.runtimeTitle}>
          <div className="grid gap-4 sm:grid-cols-2">
            <BoundaryCardV1
              badge={text.surfaceBadge}
              title={text.pvTitle}
              body={text.pvBody}
            />
            <BoundaryCardV1
              badge={text.exactBadge}
              title={text.hrTitle}
              body={text.hrBody}
              identity={facts.runtime.heartRateControlId}
            />
          </div>
        </DocumentationSectionV1>

        {facts.surface.cardiacCycleAnalysis !== null && (
          <DocumentationSectionV1
            icon={Activity}
            title={text.beatAnalysisTitle}
          >
            <p className="max-w-3xl text-sm leading-7 text-wb-muted">
              {text.beatAnalysisLead}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <BoundaryCardV1
                badge={text.surfaceBadge}
                title={text.beatSourceTitle}
                body={text.beatSourceBody}
              />
              <BoundaryCardV1
                badge={text.surfaceBadge}
                title={text.beatGradientTitle}
                body={text.beatGradientBody}
              />
              <BoundaryCardV1
                badge={text.surfaceBadge}
                title={text.beatTimingTitle}
                body={text.beatTimingBody}
              />
              <BoundaryCardV1
                badge={text.surfaceBadge}
                title={text.beatRateTitle}
                body={text.beatRateBody}
              />
            </div>
            <dl className="mt-4 rounded-xl border border-wb-line bg-wb-panel px-4 py-3">
              <IdentityRowV1
                label={text.beatMethod}
                value={facts.surface.cardiacCycleAnalysis.methodId}
              />
              <div className="mt-3 border-t border-wb-line pt-3">
                <IdentityRowV1
                  label={text.beatInterval}
                  value={`${number(
                    facts.surface.cardiacCycleAnalysis
                      .exactPresentationIntervalMs,
                    3,
                  )} ms`}
                />
              </div>
            </dl>
          </DocumentationSectionV1>
        )}

        <DocumentationSectionV1 icon={ShieldAlert} title={text.limitationTitle}>
          <BulletListV1 items={text.limitationItems} />
        </DocumentationSectionV1>

        <DocumentationSectionV1 icon={BookOpen} title={text.evidenceTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">
            {text.evidenceBody}
          </p>
          <div className="mt-4 grid gap-2">
            <EvidenceLinkV1
              href="https://doi.org/10.1161/01.CIR.101.7.765"
              label={text.garcia2000}
            />
            <EvidenceLinkV1
              href="https://doi.org/10.1016/S0735-1097(02)02764-X"
              label={text.garcia2003}
            />
          </div>
        </DocumentationSectionV1>

        <details className="mt-14 rounded-xl border border-wb-line bg-wb-panel px-4 py-3.5">
          <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
            {text.identityTitle}
          </summary>
          <dl className="mt-4 grid gap-4 border-t border-wb-line pt-4">
            <IdentityRowV1 label={text.modelId} value={facts.identity.modelId} />
            <IdentityRowV1 label={text.surfaceReleaseId} value={facts.identity.surfaceReleaseId} />
            <IdentityRowV1 label={text.surfaceSeriesId} value={facts.identity.surfaceSeriesId} />
          </dl>
        </details>
      </main>
    </div>
  );
}

function DocumentationSectionV1({
  children,
  icon: Icon,
  title,
}: Readonly<{
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
}>) {
  return (
    <section className="mt-16 border-t border-wb-line pt-8">
      <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em]">
        <Icon className="h-5 w-5 text-wb-accent" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StationCardV1({
  body,
  emphasized = false,
  label,
  title,
}: Readonly<{
  body: string;
  emphasized?: boolean;
  label: string;
  title: string;
}>) {
  return (
    <li className={`relative rounded-xl border p-4 after:absolute after:-right-3 after:top-1/2 after:z-10 after:-translate-y-1/2 after:text-wb-subtle after:content-['→'] last:after:hidden ${
      emphasized
        ? "border-wb-accent/45 bg-wb-active"
        : "border-wb-line bg-wb-panel"
    }`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-wb-subtle">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-wb-text">{label}</p>
      <p className="mt-3 text-xs leading-5 text-wb-muted">{body}</p>
    </li>
  );
}

function FactRowV1({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
      <dt className="text-xs text-wb-muted">{label}</dt>
      <dd className="font-mono text-xs font-semibold text-wb-text">{value}</dd>
    </div>
  );
}

function BoundaryCardV1({
  badge,
  body,
  identity,
  identities,
  title,
}: Readonly<{
  badge: string;
  body: string;
  identity?: string;
  identities?: readonly string[];
  title: string;
}>) {
  const displayedIdentities = identities ?? (
    identity === undefined ? [] : [identity]
  );
  return (
    <article className="rounded-xl border border-wb-line bg-wb-panel p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-wb-accent">
        {badge}
      </p>
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-wb-muted">{body}</p>
      {displayedIdentities.length > 0 && (
        <div className="mt-4 grid gap-1.5">
          {displayedIdentities.map((displayedIdentity) => (
            <code
              key={displayedIdentity}
              className="block break-all rounded-md bg-wb-soft px-2.5 py-2 font-mono text-[10px] leading-4 text-wb-subtle"
            >
              {displayedIdentity}
            </code>
          ))}
        </div>
      )}
    </article>
  );
}

function BulletListV1({ items }: Readonly<{ items: readonly string[] }>) {
  return (
    <ul className="mt-4 grid gap-3 text-sm leading-7 text-wb-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-wb-accent" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function EvidenceLinkV1({
  href,
  label,
}: Readonly<{ href: string; label: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-10 items-center justify-between gap-3 rounded-lg border border-wb-line bg-wb-panel px-3.5 py-2.5 text-sm font-medium text-wb-text transition-colors hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      <span>{label}</span>
      <ExternalLink className="h-4 w-4 shrink-0 text-wb-subtle" aria-hidden="true" />
    </a>
  );
}

function IdentityRowV1({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-xs leading-5 text-wb-muted">
        {value}
      </dd>
    </div>
  );
}
