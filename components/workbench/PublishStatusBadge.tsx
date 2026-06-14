import { useTranslation } from "react-i18next";
import type { CaseStatus, CaseVisibility } from "@/caseDoc";

export type PublishBadgeKind = "draft" | "unlisted" | "public";

export function publishBadgeKind(status?: CaseStatus, visibility?: CaseVisibility): PublishBadgeKind {
  if (status === "published" && visibility === "public") return "public";
  if (status === "published" && visibility === "unlisted") return "unlisted";
  return "draft";
}

export function publishBadgeClassName(kind: PublishBadgeKind): string {
  const base = "inline-flex h-8 shrink-0 items-center rounded-md border px-2.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent";
  if (kind === "draft") return `${base} border-wb-line bg-wb-strip text-wb-subtle hover:bg-wb-hover hover:text-wb-muted`;
  return `${base} border-wb-accent/40 bg-wb-accent-soft text-wb-accent hover:bg-wb-active`;
}

export function PublishStatusBadge({
  status,
  visibility,
  onClick,
}: {
  status?: CaseStatus;
  visibility?: CaseVisibility;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const kind = publishBadgeKind(status, visibility);
  return (
    <button
      type="button"
      onClick={onClick}
      className={publishBadgeClassName(kind)}
      title={t("publish.badge.tooltip")}
      aria-label={t("publish.badge.tooltip")}
    >
      {t(`publish.badge.${kind}`)}
    </button>
  );
}
