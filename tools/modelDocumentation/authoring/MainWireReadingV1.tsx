import React from "react";
import type { Locale } from "@/localeRouting";
import { ModelEquationV1 as Equation } from "@/components/model/ModelMathV1";
import { MAIN_WIRE_MODEL_MODULES_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { MainWireModuleExplanationsV1, ModelDocumentDetailV1 as Detail } from "./MainWireModuleExplanationsV1";
import { MainWireDetailedCircuitV1, MainWireAssemblyAndInitialStateV1, MainWireParameterTablesV1, type MainWireEquationDataV1 } from "./MainWireEquationDetailsV1";

type Content = { moduleIds: readonly string[]; equations: MainWireEquationDataV1 };

/** This projection contains constitutive definitions, never a case's effective
 * coefficients, assessment or initial state. Values live with the selected preset. */
export function MainWireGuideV1({ document: doc, locale, settingsHref }: { document: Content; locale: Locale; settingsHref: string }) {
  const t = (ja: string, en: string) => locale === "ja" ? ja : en;
  return <div className="space-y-10">
    <section id="overview" className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold">{t("全体像と回路", "Overview and circuit")}</h2>
      <p className="text-sm leading-7 text-wb-muted">{t("心筋が張力を生み、圧差が血液を動かし、変わった体積が再び筋長と圧に影響します。心筋・心臓の形状・弁・血管の相互作用から、圧波形とPV loopを計算する0Dモデルです。", "Muscle tension generates pressure; pressure differences drive blood; changing volume feeds back into muscle length and pressure. This 0D model derives waveforms and PV loops from coupled myocardium, geometry, valves and vessels.")}</p>
      <div className="mt-6"><MainWireDetailedCircuitV1 data={doc.equations} locale={locale} Equation={Equation} settingsHref={settingsHref} /></div>
    </section>
    <section id="mechanisms" className="scroll-mt-24 border-t border-wb-line pt-8">
      <h2 className="mb-4 text-xl font-semibold">{t("構成と数式", "Mechanisms and equations")}</h2>
      <p className="mb-6 text-sm leading-7 text-wb-muted">{t("以下はこのモデルに共通する構成則です。係数の採用値・形状・初期状態は、baselineまたは各プリセットの「設定」にまとめています。両方を合わせて、選んだ作動点のモデルを組み立てられます。", "These are the shared constitutive definitions. Adopted coefficients, anatomy and initial conditions are in each preset's Settings. Use both documents to reconstruct the selected operating point.")}</p>
      <a href={settingsHref} className="mb-6 inline-block rounded text-sm text-wb-accent underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-wb-accent">{t("係数・形状・初期状態を見る", "See coefficients, anatomy and initial state")}</a>
      <MainWireModuleExplanationsV1 moduleIds={doc.moduleIds} equations={doc.equations} locale={locale} reading />
    </section>
    <section id="assembly" className="scroll-mt-24 border-t border-wb-line pt-8">
      <h2 className="mb-4 text-xl font-semibold">{t("結合と時間積分", "Coupling and time integration")}</h2>
      <MainWireAssemblyAndInitialStateV1 data={doc.equations} locale={locale} Equation={Equation} part="equations" />
    </section>
    <section id="scope" className="scroll-mt-24 border-t border-wb-line pt-8">
      <h2 className="mb-4 text-xl font-semibold">{t("適用範囲と限界", "Scope and limitations")}</h2>
      <p className="text-sm leading-7 text-wb-muted">{t("各区画は空間的な分布を平均した代表値です。局所ジェット、波の伝播・反射、心室内の圧分布、局所虚血や組織の不均一性をそのまま再現しません。測定位置・解析方法が異なる実測値を、同じ名称だけで直接比較することはできません。", "Compartments provide spatially lumped values, not local jets, travelling/reflected waves, intraventricular pressure gradients or regional ischemia and tissue heterogeneity. Matching labels do not ensure equivalence to measurements at different sites or by different methods.")}</p>
      <p className="mt-3 text-sm leading-7 text-wb-muted">{t("数式を定めること、ある設定で計算が安定すること、その症例の生理的妥当性を示すことは別です。採用条件・文献との比較・操作後の検証範囲は、各プリセットに記録しています。教育・研究のためのモデルで、患者の診断や治療判断を目的としません。", "Defined equations, numerical stability and physiological validity are separate claims. Each preset records admission conditions, evidence comparisons and tested control scope. This is an educational/research model, not a tool for patient diagnosis or treatment.")}</p>
    </section>
  </div>;
}

/** All effective values move together; splitting the reader must not reduce a
 * preset to knob deltas or silently borrow another preset's geometry/state. */
export function MainWireReadingSettingsV1({ document: doc, locale }: { document: Content; locale: Locale }) {
  return <div className="mt-8" data-reading-parameters>
    <h3 className="text-base font-semibold">{locale === "ja" ? "構成に使う全係数・初期状態" : "Complete coefficients and initial state"}</h3>
    {doc.moduleIds.map(id => {
      const module = MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === id)!;
      // ParameterTables returns null for pure definitions / analysis modules.
      if (!["event-calcium-v1", "land-deactivation-v2", "passive-viscoelastic-v1", "five-wall-energy-triseg-v1", "quasisteady-four-valves-v2", "lumped-algebraic-roots-v1", "coronary-coupling-v3"].includes(id)) return null;
      return <Detail key={id} title={module.title[locale]}><MainWireParameterTablesV1 data={doc.equations} id={id} locale={locale} /></Detail>;
    })}
    <Detail title={locale === "ja" ? "保存された初期状態" : "Saved initial state"}>
      <MainWireAssemblyAndInitialStateV1 data={doc.equations} locale={locale} Equation={Equation} part="initial" />
    </Detail>
  </div>;
}
