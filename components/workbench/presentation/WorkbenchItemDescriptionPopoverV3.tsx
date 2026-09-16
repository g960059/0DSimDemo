import React from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

type WorkbenchItemDescriptionPositionV3 = Readonly<{
  left: number;
  placement: "above" | "below";
  top: number;
  width: number;
}>;

const WORKBENCH_ITEM_DESCRIPTION_MAX_WIDTH_PX_V3 = 320;
const WORKBENCH_ITEM_DESCRIPTION_VIEWPORT_MARGIN_PX_V3 = 12;
const WORKBENCH_ITEM_DESCRIPTION_GAP_PX_V3 = 8;
const WORKBENCH_ITEM_DESCRIPTION_ESTIMATED_HEIGHT_PX_V3 = 112;
export const WORKBENCH_ITEM_DESCRIPTION_HOVER_DELAY_MS_V3 = 500;

/**
 * Small progressive-disclosure affordance shared by chart legends and live
 * controls. The copy is portaled so compact pane overflow never clips it.
 */
export function WorkbenchItemDescriptionPopoverV3({
  ariaLabel,
  description,
  children,
  triggerProps,
}: Readonly<{
  ariaLabel: string;
  description: string;
  children?: React.ReactNode;
  /** Preserve an existing action (e.g. legend visibility) on the same label. */
  triggerProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}>) {
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const popoverRef = React.useRef<HTMLSpanElement | null>(null);
  const closeTimerRef =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusedAtPointerDownRef = React.useRef<boolean | null>(null);
  const descriptionId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] =
    React.useState<WorkbenchItemDescriptionPositionV3 | null>(null);

  const cancelScheduledClose = React.useCallback(() => {
    if (closeTimerRef.current === null) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);
  const cancelScheduledOpen = React.useCallback(() => {
    if (openTimerRef.current === null) return;
    clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  }, []);
  const scheduleClose = React.useCallback(() => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      if (document.activeElement !== buttonRef.current) setOpen(false);
    }, 120);
  }, [cancelScheduledClose]);
  const updatePosition = React.useCallback(() => {
    const button = buttonRef.current;
    if (button === null || typeof window === "undefined") return;
    const rect = button.getBoundingClientRect();
    const viewportMargin = WORKBENCH_ITEM_DESCRIPTION_VIEWPORT_MARGIN_PX_V3;
    const width = Math.max(
      1,
      Math.min(
        WORKBENCH_ITEM_DESCRIPTION_MAX_WIDTH_PX_V3,
        window.innerWidth - viewportMargin * 2,
      ),
    );
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, viewportMargin),
      Math.max(viewportMargin, window.innerWidth - width - viewportMargin),
    );
    const roomBelow = window.innerHeight - rect.bottom;
    const placement =
      roomBelow >= WORKBENCH_ITEM_DESCRIPTION_ESTIMATED_HEIGHT_PX_V3 ||
        roomBelow >= rect.top
        ? "below"
        : "above";
    setPosition(
      Object.freeze({
        left,
        placement,
        top:
          placement === "below"
            ? rect.bottom + WORKBENCH_ITEM_DESCRIPTION_GAP_PX_V3
            : rect.top - WORKBENCH_ITEM_DESCRIPTION_GAP_PX_V3,
        width,
      }),
    );
  }, []);

  React.useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    updatePosition();
    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    const reposition = () => updatePosition();
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, updatePosition]);

  React.useEffect(
    () => () => {
      cancelScheduledOpen();
      cancelScheduledClose();
    },
    [cancelScheduledOpen, cancelScheduledClose],
  );

  const popover =
    open && position !== null && typeof document !== "undefined"
      ? createPortal(
          <span
            ref={popoverRef}
            id={descriptionId}
            role="tooltip"
            className="fixed z-[120] block whitespace-pre-line rounded-lg border border-wb-line bg-wb-floating px-3 py-2 text-[11px] font-normal leading-4 text-wb-text shadow-xl"
            data-placement={position.placement}
            data-testid="workbench-item-description-popover-v3"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              transform:
                position.placement === "above"
                  ? "translateY(-100%)"
                  : undefined,
            }}
            onPointerEnter={cancelScheduledClose}
            onPointerLeave={scheduleClose}
          >
            {description}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        {...triggerProps}
        ref={buttonRef}
        type="button"
        aria-controls={triggerProps?.["aria-controls"] ?? (open ? descriptionId : undefined)}
        aria-describedby={open ? descriptionId : undefined}
        aria-expanded={triggerProps?.["aria-expanded"] ?? open}
        aria-label={triggerProps?.["aria-label"] ?? ariaLabel}
        className={triggerProps?.className ?? (children === undefined
          ? "pointer-events-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
          : "pointer-events-auto min-w-0 rounded-sm text-left hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent")}
        data-testid="workbench-item-description-trigger-v3"
        onBlur={(event) => {
          triggerProps?.onBlur?.(event);
          cancelScheduledOpen();
          if (event.relatedTarget !== popoverRef.current) setOpen(false);
        }}
        onClick={(event) => {
          cancelScheduledOpen();
          cancelScheduledClose();
          if (triggerProps?.onClick) {
            // An existing action owns the click; its help must not cover the
            // next target (for example another Scenario's legend entry).
            setOpen(false);
            triggerProps.onClick(event);
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          const focusedAtPointerDown = focusedAtPointerDownRef.current;
          focusedAtPointerDownRef.current = null;
          setOpen(
            focusedAtPointerDown === null || focusedAtPointerDown
              ? (current) => !current
              : true,
          );
        }}
        onFocus={(event) => {
          triggerProps?.onFocus?.(event);
          cancelScheduledOpen();
          cancelScheduledClose();
          setOpen(true);
        }}
        onPointerEnter={(event) => {
          triggerProps?.onPointerEnter?.(event);
          if (event.pointerType === "touch") return;
          cancelScheduledClose();
          cancelScheduledOpen();
          if (open) return;
          openTimerRef.current = setTimeout(() => {
            openTimerRef.current = null;
            setOpen(true);
          }, WORKBENCH_ITEM_DESCRIPTION_HOVER_DELAY_MS_V3);
        }}
        onPointerDown={(event) => {
          triggerProps?.onPointerDown?.(event);
          focusedAtPointerDownRef.current =
            document.activeElement === buttonRef.current;
        }}
        onPointerLeave={(event) => {
          triggerProps?.onPointerLeave?.(event);
          if (event.pointerType === "touch") return;
          cancelScheduledOpen();
          scheduleClose();
        }}
      >
        {children ?? <Info aria-hidden="true" className="h-3 w-3" />}
      </button>
      {popover}
    </>
  );
}
