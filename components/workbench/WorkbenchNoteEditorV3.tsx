import React from "react";
import { createPortal } from "react-dom";
import { FileText, X } from "lucide-react";

export function WorkbenchNoteEditorV3({
  open,
  value,
  strings,
  onChange,
  onClose,
}: Readonly<{
  open: boolean;
  value: string;
  strings: Readonly<{ close: string; placeholder: string; title: string }>;
  onChange: (value: string) => void;
  onClose: () => void;
}>) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const titleId = React.useId();
  React.useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const animationFrame = requestAnimationFrame(() => textareaRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || dialogRef.current === null) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "textarea,button:not([disabled])",
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="workbench-sheet-enter flex max-h-[80dvh] w-full flex-col rounded-t-2xl bg-wb-panel shadow-2xl sm:max-w-xl sm:rounded-xl sm:ring-1 sm:ring-wb-line"
      >
        <header className="flex min-h-14 items-center gap-3 px-4 py-3 sm:px-5">
          <FileText className="h-4 w-4 text-wb-accent" aria-hidden="true" />
          <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold">
            {strings.title}
          </h2>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={strings.close}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
          <textarea
            ref={textareaRef}
            value={value}
            placeholder={strings.placeholder}
            className="min-h-64 w-full resize-y rounded-xl bg-wb-soft px-4 py-3 text-sm leading-7 text-wb-text outline-none placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
