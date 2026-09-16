import React from "react";
import { useLocation } from "react-router-dom";
import { localeFromPathname } from "@/localeRouting";

export function ModelDocumentationLoadingV1() {
  const locale = localeFromPathname(useLocation().pathname);
  return <div role="status" aria-label={locale === "ja" ? "文書を読み込んでいます" : "Loading documentation"} className="h-full overflow-hidden bg-wb-app px-5 py-8 sm:px-8" data-testid="model-documentation-loading-v1">
    <div aria-hidden="true" className="mx-auto max-w-7xl motion-safe:animate-pulse">
      <div className="h-3 w-44 rounded-full bg-wb-line/60" />
      <div className="mt-8 flex gap-6 border-b border-wb-line pb-5"><div className="h-3 w-28 rounded-full bg-wb-line/60" /><div className="h-3 w-36 rounded-full bg-wb-line/40" /></div>
      <div className="mt-12 max-w-3xl"><div className="h-8 w-3/5 rounded bg-wb-line/60" /><div className="mt-6 h-3 w-4/5 rounded-full bg-wb-line/40" />
        {[0, 1, 2].map(i => <div key={i} className="mt-12 space-y-4"><div className="mb-7 h-5 w-40 rounded bg-wb-line/60" /><div className="h-3 rounded-full bg-wb-line/40" /><div className="h-3 rounded-full bg-wb-line/40" /><div className="h-3 w-3/4 rounded-full bg-wb-line/40" /></div>)}
      </div>
    </div>
  </div>;
}
