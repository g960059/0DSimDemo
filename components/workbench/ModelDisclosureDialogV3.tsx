import React from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Info, X } from "lucide-react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export type ModelDisclosureDialogV3Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcknowledge: () => void;
  title: string;
  closeLabel: string;
  acknowledgeLabel: string;
  limitations: readonly string[];
  documentationHref?: string;
  documentationLabel?: string;
}>;

/**
 * Controlled disclosure surface shared by the global shell and Workbench.
 * Closing and acknowledging are intentionally separate actions.
 */
export function ModelDisclosureDialogV3({
  open,
  onOpenChange,
  onAcknowledge,
  title,
  closeLabel,
  acknowledgeLabel,
  limitations,
  documentationHref,
  documentationLabel,
}: ModelDisclosureDialogV3Props) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const onOpenChangeRef = React.useRef(onOpenChange);
  const titleId = React.useId();
  const descriptionId = React.useId();
  onOpenChangeRef.current = onOpenChange;

  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const animationFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      const initialFocus = dialog?.querySelector<HTMLElement>(
        "[data-model-disclosure-initial-focus]",
      );
      (initialFocus ?? dialog)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onOpenChangeRef.current(false);
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (dialog === null) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hidden && element.tabIndex !== -1);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousBodyOverflow;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="model-disclosure-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="model-disclosure-panel flex max-h-[min(82dvh,44rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-wb-line-strong bg-wb-panel shadow-2xl outline-none sm:max-w-lg sm:rounded-xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-wb-line px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-wb-accent" aria-hidden="true" />
            <h2 id={titleId} className="truncate text-sm font-semibold text-wb-text">
              {title}
            </h2>
          </div>
          <button
            type="button"
            data-model-disclosure-initial-focus
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            title={closeLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-wb-subtle transition-colors duration-150 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div id={descriptionId} className="min-h-0 overflow-y-auto px-5 py-5">
          <ul className="space-y-3 text-sm leading-6 text-wb-muted">
            {limitations.map((limitation, index) => (
              <li key={`${index}:${limitation}`} className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-wb-subtle" aria-hidden="true" />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
          {documentationHref !== undefined && documentationLabel !== undefined && (
            <a
              href={documentationHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-h-9 items-center gap-1.5 rounded-md text-xs font-semibold text-wb-accent transition-colors hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              data-testid="model-disclosure-documentation-link-v3"
            >
              {documentationLabel}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        <footer className="flex shrink-0 justify-end border-t border-wb-line px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3.5">
          <button
            type="button"
            onClick={onAcknowledge}
            className="min-h-10 rounded-md bg-wb-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-wb-panel"
          >
            {acknowledgeLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
