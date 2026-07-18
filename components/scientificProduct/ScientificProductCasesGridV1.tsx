import React from "react";
import { Link } from "react-router-dom";

import { caseHref } from "@/homeLinks";
import type { Locale } from "@/localeRouting";

import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  type ScientificProductCaseV1,
} from "./scientificProductCaseCatalogV1";

export type ScientificProductCasesGridV1Props = Readonly<{
  locale: Locale;
  openLabel: string;
  cases?: readonly ScientificProductCaseV1[];
}>;

export function ScientificProductCasesGridV1({
  locale,
  openLabel,
  cases = SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
}: ScientificProductCasesGridV1Props) {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      data-testid="scientific-product-cases-grid-v1"
    >
      {cases.map((entry) => (
        <article
          key={entry.caseId}
          className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700"
          data-case-id={entry.caseId}
          data-case-kind={entry.kind}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-200">
              {entry.displayName}
            </h3>
            <span className={badgeClass(entry)}>{entry.badge}</span>
          </div>
          <p className="mb-3 flex-1 text-sm text-slate-400">
            {entry.description}
          </p>
          <p className="mb-5 text-xs leading-5 text-amber-300/90">
            {entry.claimNotice}
          </p>
          <Link
            to={caseHref(entry.caseId, locale)}
            className="w-full rounded bg-slate-800 px-4 py-2 text-center text-sm font-bold shadow transition-colors hover:bg-slate-700"
          >
            {openLabel}
          </Link>
        </article>
      ))}
    </div>
  );
}

function badgeClass(entry: ScientificProductCaseV1): string {
  const tone = entry.kind === "official-exact-periodic"
    ? "border-sky-700/70 bg-sky-950/50 text-sky-300"
    : "border-amber-700/70 bg-amber-950/40 text-amber-300";
  return "shrink-0 rounded border px-2 py-1 text-[11px] font-bold " + tone;
}
