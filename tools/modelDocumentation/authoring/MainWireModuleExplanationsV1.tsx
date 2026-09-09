import React from "react";
import { ChevronRight } from "lucide-react";
import type { Locale } from "@/localeRouting";
import { MAIN_WIRE_MODEL_MODULES_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { MainWireModuleEquationDetailsV1, type MainWireEquationDataV1 } from "./MainWireEquationDetailsV1";
import { ModelEquationV1 as Equation, ModelInlineMathV1 as InlineMath } from "@/components/model/ModelMathV1";

export function ModelDocumentDetailV1({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return <details className="group mt-3 rounded-lg border border-wb-line">
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-4 py-2 text-sm text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />{title}
    </summary>
    <div className="border-t border-wb-line px-4 py-4">{children}</div>
  </details>;
}

/** Shared by baseline and disease-case authoring, never resolved by a saved reader. */
export function MainWireModuleExplanationsV1({ moduleIds, equations, locale }: {
  moduleIds: readonly string[]; equations: MainWireEquationDataV1; locale: Locale;
}) {
  return <div className="space-y-8">{moduleIds.map(id => {
    const m = MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === id);
    if (!m) throw new Error(`Unknown explanatory module: ${id}`);
    return <article key={id} id={id}>
      <h3 className="mb-2 text-base font-semibold">{m.title[locale]}</h3>
      <p className="text-sm leading-7 text-wb-muted">{m.summary[locale]}</p>
      <ModelDocumentDetailV1 title={locale === "ja" ? "数式・仮定を詳しく" : "Equations and assumptions"}>
        <p className="text-sm leading-7 text-wb-muted">{m.detail[locale]}</p>
        {m.equation && <><Equation expression={m.equation} /><p className="text-xs leading-6 text-wb-subtle">{m.equationNote?.[locale]}</p></>}
        {m.symbols && <dl className="model-symbol-definitions mt-5 space-y-4 text-sm leading-7">{m.symbols.map(([symbol, meaning]) =>
          <div key={symbol} className="grid min-w-0 gap-1 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5">
            <dt className="text-[15px] text-wb-text"><InlineMath expression={symbol} /></dt><dd className="min-w-0 text-wb-muted">{meaning[locale]}</dd>
          </div>)}</dl>}
        {m.additionalEquations?.map(e => <div key={e.expression} className="mt-5"><Equation expression={e.expression} /><p className="text-sm leading-7 text-wb-muted">{e.note[locale]}</p></div>)}
        <MainWireModuleEquationDetailsV1 data={equations} id={id} locale={locale} Equation={Equation} />
        {m.references?.map(r => <p key={r.url} className="mt-4 text-xs leading-6 text-wb-muted">
          <a href={r.url} target="_blank" rel="noreferrer" className="text-wb-accent underline">{r.title}</a><span className="ml-2">{r.context[locale]}</span></p>)}
        {id === "land-deactivation-v2" && <a href="https://doi.org/10.1016/j.yjmcc.2017.03.008" className="mt-4 inline-block text-xs text-wb-accent underline" target="_blank" rel="noreferrer">
          Land et al. 2017</a>}
      </ModelDocumentDetailV1>
    </article>;
  })}</div>;
}
