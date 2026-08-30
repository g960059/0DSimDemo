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

/**
 * Small progressive-disclosure affordance shared by chart legends and live
 * controls. The copy is portaled so compact pane overflow never clips it.
 */
export function WorkbenchItemDescriptionPopoverV3({
  ariaLabel,
  description,
}: Readonly<{
  ariaLabel: string;
  description: string;
}>) {
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const popoverRef = React.useRef<HTMLSpanElement | null>(null);
  const closeTimerRef =
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
      if (event.key === "Escape") setOpen(false);
    };
    const reposition = () => updatePosition();
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, updatePosition]);

  React.useEffect(
    () => () => cancelScheduledClose(),
    [cancelScheduledClose],
  );

  const popover =
    open && position !== null && typeof document !== "undefined"
      ? createPortal(
          <span
            ref={popoverRef}
            id={descriptionId}
            role="tooltip"
            className="fixed z-[120] block rounded-lg border border-wb-line bg-wb-floating px-3 py-2 text-[11px] font-normal leading-4 text-wb-text shadow-xl"
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
        ref={buttonRef}
        type="button"
        aria-controls={open ? descriptionId : undefined}
        aria-describedby={open ? descriptionId : undefined}
        aria-expanded={open}
        aria-label={ariaLabel}
        className="pointer-events-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
        data-testid="workbench-item-description-trigger-v3"
        onBlur={(event) => {
          if (event.relatedTarget !== popoverRef.current) setOpen(false);
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          cancelScheduledClose();
          const focusedAtPointerDown = focusedAtPointerDownRef.current;
          focusedAtPointerDownRef.current = null;
          setOpen(
            focusedAtPointerDown === null || focusedAtPointerDown
              ? (current) => !current
              : true,
          );
        }}
        onFocus={() => {
          cancelScheduledClose();
          setOpen(true);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          cancelScheduledClose();
          setOpen(true);
        }}
        onPointerDown={() => {
          focusedAtPointerDownRef.current =
            document.activeElement === buttonRef.current;
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "touch") return;
          scheduleClose();
        }}
      >
        <Info aria-hidden="true" className="h-3 w-3" />
      </button>
      {popover}
    </>
  );
}
