import React from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

/** One quiet status for initial preparation; it never gates ready content. */
export function SimulationPreparationV1({ onRetry, standalone = false }: Readonly<{
  onRetry?: () => void;
  standalone?: boolean;
}>) {
  const { t } = useTranslation();
  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 10_000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className={standalone
      ? "flex h-full flex-col items-center justify-center gap-2 bg-wb-app px-4 text-center"
      : "flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-wb-app px-3 py-1.5"}
      data-simulation-preparation="true">
      <div role="status" aria-atomic="true" className="text-xs leading-5 text-wb-muted">
        <span>{t("workbench.live.loading")}</span>
        {slow && <span className="block text-wb-subtle">{t("workbench.live.loadingSlow")}</span>}
      </div>
      {slow && onRetry && <button type="button" onClick={onRetry}
        className="rounded px-2 py-1 text-xs text-wb-accent hover:bg-wb-accent/10 focus-visible:outline focus-visible:outline-2">
        {t("workbench.live.retryPreparation")}
      </button>}
    </div>
  );
}

/** Shapes only: no fabricated measurements, waveforms, or guessed item names. */
export function SimulationPanePlaceholderV1({ kind = "graph", itemCount = 6, showLegend = true }: Readonly<{
  kind?: "graph" | "output" | "control";
  itemCount?: number;
  showLegend?: boolean;
}>) {
  return <div aria-hidden="true" data-simulation-placeholder={kind}
    className="h-full min-h-0 overflow-hidden p-3">
    {kind === "graph" ? <div className="flex h-full min-h-32 flex-col gap-4">
      {showLegend && <div className="h-2 w-16 rounded bg-wb-line/50" />}
      <div className="mb-6 ml-9 mr-3 min-h-0 flex-1 border-b border-l border-wb-line/60" />
    </div> : <div className={kind === "output" ? "grid grid-cols-[repeat(auto-fit,minmax(115px,1fr))] gap-x-5 gap-y-4" : "flex flex-col gap-6"}>
      {Array.from({ length: Math.min(itemCount, 12) }, (_, index) => <div key={index} className="flex flex-col gap-2.5">
        <div className="h-2 w-16 max-w-full rounded bg-wb-line/50" />
        <div className={kind === "output" ? "h-4 w-12 rounded bg-wb-line/40" : "h-1.5 w-full rounded bg-wb-line/40"} />
      </div>)}
    </div>}
  </div>;
}

export function SimulationLegendPlaceholderV1() {
  return <div aria-hidden="true" className="flex min-h-7 items-center">
    <span className="h-2 w-16 rounded bg-wb-line/50" />
  </div>;
}

/** An overlay does not resize the plot when readiness changes. */
export function SimulationChartStatusV1({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="pointer-events-none absolute inset-x-3 top-2 flex justify-center"
    data-simulation-chart-status="true">
    <span role="status" aria-atomic="true"
      className="max-w-full rounded bg-wb-canvas/90 px-2 py-1 text-center text-[11px] leading-4 text-wb-muted">
      {children}
    </span>
  </div>;
}

/** Status, not a button: details remain available on hover and to screen readers. */
export function SimulationUpdatingIndicatorV1({ label }: Readonly<{ label: string }>) {
  return <span role="status" aria-label={label} title={label} tabIndex={0}
    data-simulation-update="true"
    className="inline-flex h-7 w-7 shrink-0 cursor-default items-center justify-center rounded text-wb-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">
    <RefreshCw className="h-3 w-3 motion-safe:animate-spin motion-safe:[animation-duration:2s]" aria-hidden="true" />
  </span>;
}
