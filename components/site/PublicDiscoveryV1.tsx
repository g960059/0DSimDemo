import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
export const PUBLIC_CARD_CLASS_V1 =
  "group flex h-full min-w-0 flex-col rounded-2xl border border-wb-line bg-wb-panel p-5 transition-[border-color,box-shadow] duration-150 hover:border-wb-line-strong hover:bg-wb-hover/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent";
export function PublicSectionHeadingV1({
  headingId,
  icon,
  title,
  viewAllHref,
  viewAllLabel,
}: {
  headingId: string;
  icon: ReactNode;
  title: string;
  viewAllHref: string | null;
  viewAllLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2
        id={headingId}
        className="flex min-w-0 items-center gap-2.5 text-xl font-bold tracking-[-0.02em] text-wb-text sm:text-[1.35rem]"
      >
        <span className="text-wb-accent">{icon}</span>
        <span>{title}</span>
      </h2>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-sm text-[13px] font-semibold text-wb-muted hover:text-wb-text focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
