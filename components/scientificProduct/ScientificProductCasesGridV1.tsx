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
          className="flex flex-col rounded-xl border border-wb-line bg-wb-panel p-5 transition-all hover:border-wb-line-strong"
          data-case-id={entry.caseId}
          data-case-kind={entry.kind}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-wb-text">
              {entry.displayName}
            </h3>
            <span className={badgeClass(entry)}>{entry.badge}</span>
          </div>
          <p className="mb-3 flex-1 text-sm text-wb-muted">
            {entry.description}
          </p>
          <p className="mb-5 text-xs leading-5 text-wb-warning">
            {entry.claimNotice}
          </p>
          <Link
            to={caseHref(entry.caseId, locale)}
            className="w-full rounded bg-wb-hover px-4 py-2 text-center text-sm font-bold shadow transition-colors hover:bg-wb-active"
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
    // Badges carry their own contrast in both themes: the accent and warning
    // tokens are checked against their surfaces, the raw palette was not.
    ? "border-wb-accent/40 bg-wb-accent-soft text-wb-accent"
    : "border-wb-warning/40 bg-wb-warning-soft text-wb-warning";
  return "shrink-0 rounded border px-2 py-1 text-[11px] font-bold " + tone;
}
