import type { CaseDocument } from "@/caseDoc";
import { resolveReadingColumn } from "@/readingConversion";

export type ReadExploreMode = "read" | "explore";

type ReadExploreDoc = Pick<CaseDocument, "panels" | "notes" | "reading" | "defaultEntry">;

function hasTextContent(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasTextContent);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) => {
    if (key === "type" || key === "id" || key === "styles") return false;
    return hasTextContent(nested);
  });
}

export function hasCaseReadingContent(doc: Pick<CaseDocument, "notes" | "reading">): boolean {
  if (doc.reading) return true;
  return Object.values(doc.notes ?? {}).some(hasTextContent);
}

export function canUseReadExplore(doc: ReadExploreDoc): boolean {
  if (!hasCaseReadingContent(doc)) return false;
  return "column" in resolveReadingColumn(doc);
}

export function deriveReadExploreEntryMode(doc: ReadExploreDoc, opts: { readOnly: boolean }): ReadExploreMode {
  if (!opts.readOnly) return "explore";
  const canRead = canUseReadExplore(doc);
  if (doc.defaultEntry === "explore") return "explore";
  if (doc.defaultEntry === "read") return canRead ? "read" : "explore";
  return canRead ? "read" : "explore";
}

export function switchReadExplorePresentation<TState extends { presentation: ReadExploreMode }>(
  state: TState,
  presentation: ReadExploreMode,
): TState {
  return state.presentation === presentation ? state : { ...state, presentation };
}
