import React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";

export type WorkbenchPopoverAnchorV3 = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
  element: HTMLElement | null;
}>;

export function workbenchPopoverAnchorV3(
  element?: HTMLElement | null,
): WorkbenchPopoverAnchorV3 {
  const target =
    element ??
    (typeof document !== "undefined" &&
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
  const rect = target?.getBoundingClientRect();
  return {
    left: rect?.left ?? 16,
    right: rect?.right ?? 48,
    top: rect?.top ?? 64,
    bottom: rect?.bottom ?? 96,
    element: target,
  };
}

type WorkbenchDialogViewportV3 = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
  layoutHeight: number;
}>;
type WorkbenchDialogOriginV3 = Readonly<{ left: number; top: number }>;

/** Choose an opening corner once; content changes must not flip an active editor. */
export function resolveWorkbenchDialogPositionV3({
  anchor,
  viewport,
  preferredWidth,
  contentHeight,
  origin,
}: Readonly<{
  anchor: Pick<WorkbenchPopoverAnchorV3, "left" | "top" | "bottom">;
  viewport: WorkbenchDialogViewportV3;
  preferredWidth: number;
  contentHeight: number;
  origin?: WorkbenchDialogOriginV3;
}>): React.CSSProperties {
  const margin = 8;
  const gap = 5;
  const maxHeight = Math.max(0, viewport.height - 24);
  if (viewport.width < 640)
    return {
      left: viewport.left + margin,
      // CSS keeps the sheet attached to the visible bottom without measuring each expansion.
      bottom: viewport.layoutHeight - viewport.top - viewport.height + margin,
      width: Math.max(0, viewport.width - margin * 2),
      maxHeight,
    };
  const width = Math.max(
    0,
    Math.min(preferredWidth, viewport.width - margin * 2),
  );
  const minimumUsableHeight = Math.min(240, maxHeight);
  const openingHeight = Math.min(contentHeight, maxHeight);
  const roomBelow =
    viewport.top + viewport.height - margin - anchor.bottom - gap;
  const roomAbove = anchor.top - gap - viewport.top - margin;
  const openAbove =
    roomBelow < Math.max(openingHeight, minimumUsableHeight) &&
    roomAbove > roomBelow;
  const openingTop = openAbove
    ? anchor.top - openingHeight - gap
    : anchor.bottom + gap;
  const top = Math.max(
    viewport.top + margin,
    Math.min(
      origin?.top ?? openingTop,
      viewport.top + viewport.height - margin - minimumUsableHeight,
    ),
  );
  return {
    left: Math.max(
      viewport.left + margin,
      Math.min(
        origin?.left ?? anchor.left,
        viewport.left + viewport.width - width - margin,
      ),
    ),
    top,
    width,
    maxHeight: Math.min(
      maxHeight,
      viewport.top + viewport.height - margin - top,
    ),
  };
}

/** One local picker surface for desktop anchors and the mobile bottom sheet. */
export function WorkbenchAnchoredDialogV3({
  anchor,
  title,
  closeLabel,
  backLabel,
  onBack,
  onClose,
  children,
  footer,
  testId,
  focusKey,
  mobileBackdrop = false,
  width: preferredWidth = 384,
}: Readonly<{
  anchor: WorkbenchPopoverAnchorV3;
  title: string;
  closeLabel: string;
  backLabel?: string;
  onBack?: () => void;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
  focusKey?: string;
  mobileBackdrop?: boolean;
  width?: number;
}>) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const titleId = React.useId();
  const [position, setPosition] = React.useState<React.CSSProperties>({
    visibility: "hidden",
  });
  React.useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let desktopOrigin: WorkbenchDialogOriginV3 | undefined;
    const place = () => {
      const visualViewport = window.visualViewport;
      const viewport = {
        width: visualViewport?.width ?? window.innerWidth,
        height: visualViewport?.height ?? window.innerHeight,
        left: visualViewport?.offsetLeft ?? 0,
        top: visualViewport?.offsetTop ?? 0,
        layoutHeight: window.innerHeight,
      };
      const mobile = viewport.width < 640;
      if (mobile) desktopOrigin = undefined;
      // Measure at the actual opening width, before the first visible paint.
      // Subsequent content changes are handled by max-height and the inner scroll areas.
      let contentHeight = 0;
      if (!mobile && !desktopOrigin) {
        dialog.style.width = `${Math.max(0, Math.min(preferredWidth, viewport.width - 16))}px`;
        dialog.style.maxHeight = `${Math.max(0, viewport.height - 24)}px`;
        contentHeight = dialog.getBoundingClientRect().height;
      }
      const anchorRect = anchor.element?.isConnected
        ? anchor.element.getBoundingClientRect()
        : anchor;
      const next = resolveWorkbenchDialogPositionV3({
        anchor: anchorRect,
        viewport,
        preferredWidth,
        contentHeight,
        origin: desktopOrigin,
      });
      if (!mobile && !desktopOrigin)
        desktopOrigin = { left: next.left as number, top: next.top as number };
      setPosition(next);
    };
    place();
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [anchor, preferredWidth]);
  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = elements[0],
        last = elements.at(-1);
      if (!first) {
        event.preventDefault();
        dialogRef.current?.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (anchor.element?.isConnected)
        anchor.element.focus({ preventScroll: true });
    };
  }, [anchor]);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => {
      const search = window.matchMedia("(min-width: 640px)").matches
        ? dialogRef.current?.querySelector<HTMLElement>('input[type="search"]')
        : null;
      (
        search ?? dialogRef.current?.querySelector<HTMLElement>("button")
      )?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [focusKey]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className={`fixed inset-0 z-[90]${mobileBackdrop ? " bg-black/30 sm:bg-transparent" : ""}`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        style={position}
        className="workbench-anchored-dialog fixed flex flex-col overflow-hidden rounded-xl border border-wb-line bg-wb-panel text-wb-text shadow-2xl"
      >
        <header className="flex min-h-12 shrink-0 items-center gap-2 border-b border-wb-line px-2 py-1">
          {onBack && (
            <button
              type="button"
              aria-label={backLabel}
              onClick={onBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <h2
            id={titleId}
            className="min-w-0 flex-1 pl-2 text-sm font-semibold"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-wb-line px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
