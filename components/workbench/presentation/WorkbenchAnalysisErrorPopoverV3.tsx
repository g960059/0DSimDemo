import React from "react";
import { useTranslation } from "react-i18next";
import { CircleAlert } from "lucide-react";

/** A recoverable analysis failure does not replace the retained comparison. */
export function WorkbenchAnalysisErrorPopoverV3({ error, onRetry, label = "PVA analysis unavailable", testId = "workbench-pva-analysis-error" }: Readonly<{
  error: string;
  onRetry?: () => boolean;
  label?: string;
  testId?: string;
}>) {
  const { i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => setOpen(false), [error]);
  React.useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return <div ref={rootRef} className="absolute right-2 top-2 z-10">
    <button type="button" aria-expanded={open} aria-label={label} title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-400/45 bg-wb-app/90 text-red-500 shadow-sm backdrop-blur transition-colors hover:bg-wb-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/55"
      data-testid={testId} onClick={() => setOpen(current => !current)}>
      <CircleAlert aria-hidden="true" className="h-4 w-4" />
    </button>
    {open && <div className="absolute right-0 top-9 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-red-400/40 bg-wb-app/95 px-3 py-2.5 text-[11px] leading-4 text-red-500 shadow-lg backdrop-blur"
      data-testid={`${testId}-popover`} role="alert">
      <p className="font-medium">{label}</p>
      <p className="mt-1 break-words text-wb-muted">{error}</p>
      {onRetry !== undefined && <button type="button" className="mt-2 rounded border border-wb-border px-2 py-1 text-wb-text hover:bg-wb-hover"
        onClick={() => { if (onRetry()) setOpen(false); }}>
        {i18n.language.startsWith("ja") ? "現在の状態で再計算" : "Recalculate from current state"}
      </button>}
    </div>}
  </div>;
}
