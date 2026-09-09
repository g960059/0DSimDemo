import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MODEL_READING_ENTRIES_V1, modelReadingPresetLabelV1 } from "@/studio/presentation/modelDocumentation/ModelReadingCatalogV1";

/** Two reference destinations, neither claims to describe an edited scenario. */
export function ModelReferenceLinksV1({ href, label, testId }: { href: string; label: string; testId: string }) {
  const { i18n } = useTranslation();
  const ja = (i18n.resolvedLanguage ?? i18n.language).startsWith("ja");
  const url = new URL(href, "https://reader.invalid");
  const presets = new URL(url);
  presets.searchParams.set("view", "presets"); presets.hash = "";
  const internal = url.origin === "https://reader.invalid" && /^\/(ja|en)\/models\//.test(url.pathname);
  const entry = internal ? MODEL_READING_ENTRIES_V1.find(e =>
    url.pathname.endsWith(`/${encodeURIComponent(e.identity.modelId)}`)
    && url.searchParams.get("surface") === e.identity.surfaceReleaseId
    && (!url.searchParams.has("document") || url.searchParams.get("document") === e.documentId)) : undefined;
  const presetLabel = entry ? modelReadingPresetLabelV1(entry, ja ? "ja" : "en") : ja ? "baseline・プリセット" : "Baseline & presets";
  return <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
    {[[href, label, testId], ...(internal ? [[presets.pathname + presets.search, presetLabel, `${testId}-presets`]] : [])].map(([to, title, id]) =>
      <a key={id} href={to} target="_blank" rel="noreferrer" data-testid={id}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-md text-xs font-semibold text-wb-accent hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
        {title}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>)}
  </div>;
}
