import React, { useCallback, useEffect, useRef, useState } from "react";

import type { LegendPosition } from "@/types";

import {
  clampLegendFraction,
  exceededDragThreshold,
  fractionToPx,
  magnetizeLegendPosition,
  pxToFraction,
} from "./legendPosition";

type LegendLayout = Readonly<{
  container: Readonly<{ width: number; height: number }>;
  legend: Readonly<{ width: number; height: number }>;
}>;

type LegendDragState = {
  pointerId: number;
  startClient: { x: number; y: number };
  startPx: { left: number; top: number };
  didDrag: boolean;
  snappedToDefault: boolean;
};

export type InteractiveGraphLegendProps = Readonly<{
  children?: React.ReactNode;
  panelId?: string;
  interactive?: boolean;
  onOpenSettings?: (panelId: string) => void;
  position?: LegendPosition;
  onPositionChange?: (panelId: string, position?: LegendPosition) => void;
  className?: string;
  testId?: string;
  ariaLabel?: string;
  interactionTitle?: string;
}>;

const EMPTY_LAYOUT: LegendLayout = {
  container: { width: 0, height: 0 },
  legend: { width: 0, height: 0 },
};
const LEGEND_DRAG_THRESHOLD_PX = 5;

function sameLayout(a: LegendLayout, b: LegendLayout): boolean {
  return a.container.width === b.container.width
    && a.container.height === b.container.height
    && a.legend.width === b.legend.width
    && a.legend.height === b.legend.height;
}

export function shouldEnableLegendInteractions({
  canConfigure,
  presentationMode,
}: Readonly<{
  canConfigure?: boolean;
  presentationMode?: "studio" | "reading";
}>): boolean {
  return Boolean(canConfigure) && presentationMode !== "reading";
}

/**
 * Shared zero-footprint interaction shell for graph legends.
 *
 * A sub-threshold pointer gesture remains a click. Once the pointer has crossed
 * the drag threshold it stays a drag, even when it returns to its start point,
 * so releasing a moved legend can never accidentally open pane settings.
 */
export function InteractiveGraphLegend({
  children,
  panelId,
  interactive = false,
  onOpenSettings,
  position,
  onPositionChange,
  className = "",
  testId,
  ariaLabel = "Open pane settings",
  interactionTitle = "Drag to move · click to edit",
}: InteractiveGraphLegendProps) {
  const legendRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<LegendDragState | null>(null);
  const suppressNextClickRef = useRef(false);
  const [layout, setLayout] = useState<LegendLayout>(EMPTY_LAYOUT);
  const [livePosition, setLivePosition] = useState<LegendPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canOpenSettings = interactive && Boolean(panelId) && Boolean(onOpenSettings);
  const canDrag = interactive && Boolean(panelId) && Boolean(onPositionChange);
  const canInteract = canOpenSettings || canDrag;

  const measureLayout = useCallback((): LegendLayout => {
    const legend = legendRef.current;
    const container = (legend?.offsetParent as HTMLElement | null)
      ?? legend?.parentElement
      ?? null;
    if (!legend || !container) return EMPTY_LAYOUT;
    const rect = legend.getBoundingClientRect();
    const next = {
      container: {
        width: container.clientWidth,
        height: container.clientHeight,
      },
      legend: {
        width: legend.offsetWidth || rect.width,
        height: legend.offsetHeight || rect.height,
      },
    };
    setLayout((previous) => sameLayout(previous, next) ? previous : next);
    return next;
  }, []);

  useEffect(() => {
    const legend = legendRef.current;
    const container = (legend?.offsetParent as HTMLElement | null)
      ?? legend?.parentElement
      ?? null;
    measureLayout();
    if (!legend || !container || typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver(measureLayout);
    observer.observe(container);
    observer.observe(legend);
    return () => observer.disconnect();
  }, [measureLayout]);

  const effectivePosition = livePosition ?? position;
  const clampedPosition = effectivePosition
    ? clampLegendFraction(effectivePosition, layout.container, layout.legend)
    : undefined;
  const positionPx = clampedPosition
    ? fractionToPx(clampedPosition, layout.container)
    : undefined;
  const style: React.CSSProperties | undefined = positionPx
    ? {
        left: `${positionPx.left}px`,
        top: `${positionPx.top}px`,
        touchAction: canDrag ? "none" : undefined,
      }
    : (canDrag ? { touchAction: "none" } : undefined);
  const placementClass = effectivePosition ? "" : "right-2 top-2";
  const settleClass = isDragging ? "" : "transition-[left,top] duration-150";
  const interactionClass = canInteract
    ? `pointer-events-auto hover:bg-wb-panel/90 hover:ring-1 hover:ring-wb-accent ${isDragging ? "cursor-grabbing ring-1 ring-wb-accent" : canDrag ? "cursor-grab" : "cursor-pointer"}`
    : "pointer-events-none";
  const isLiveSnapped = isDragging && dragRef.current?.snappedToDefault === true;

  const currentRawPosition = (
    drag: LegendDragState,
    client: Readonly<{ x: number; y: number }>,
    measured: LegendLayout,
  ): LegendPosition => clampLegendFraction(pxToFraction({
    left: drag.startPx.left + client.x - drag.startClient.x,
    top: drag.startPx.top + client.y - drag.startClient.y,
  }, measured.container), measured.container, measured.legend);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canDrag || !panelId) return;
    // A new pointer sequence is intentional user input. Only the click event
    // synthesized from the previous drag release should ever be suppressed.
    suppressNextClickRef.current = false;
    event.stopPropagation();
    const legend = legendRef.current;
    const container = (legend?.offsetParent as HTMLElement | null)
      ?? legend?.parentElement
      ?? null;
    if (!legend || !container) return;

    const measured = measureLayout();
    const legendRect = legend.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const currentPx = effectivePosition
      ? fractionToPx(
          clampLegendFraction(effectivePosition, measured.container, measured.legend),
          measured.container,
        )
      : {
          left: legendRect.left - containerRect.left,
          top: legendRect.top - containerRect.top,
        };
    dragRef.current = {
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startPx: currentPx,
      didDrag: false,
      snappedToDefault: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (
      !drag.didDrag
      && !exceededDragThreshold(
        drag.startClient,
        { x: event.clientX, y: event.clientY },
        LEGEND_DRAG_THRESHOLD_PX,
      )
    ) return;

    drag.didDrag = true;
    event.preventDefault();
    const measured = measureLayout();
    const magnet = magnetizeLegendPosition(
      currentRawPosition(drag, { x: event.clientX, y: event.clientY }, measured),
      measured.container,
      measured.legend,
      drag.snappedToDefault,
    );
    drag.snappedToDefault = magnet.snapped;
    setLivePosition(magnet.position);
    setIsDragging(true);
  };

  const clearDrag = () => {
    dragRef.current = null;
    setLivePosition(null);
    setIsDragging(false);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const didDrag = drag.didDrag || exceededDragThreshold(
      drag.startClient,
      { x: event.clientX, y: event.clientY },
      LEGEND_DRAG_THRESHOLD_PX,
    );
    if (didDrag && panelId) {
      event.preventDefault();
      suppressNextClickRef.current = true;
      const measured = measureLayout();
      const magnet = magnetizeLegendPosition(
        currentRawPosition(drag, { x: event.clientX, y: event.clientY }, measured),
        measured.container,
        measured.legend,
        drag.snappedToDefault,
      );
      onPositionChange?.(panelId, magnet.snapped ? undefined : magnet.position);
    }
    clearDrag();
  };

  const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    clearDrag();
  };

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (suppressNextClickRef.current) {
      event.preventDefault();
      suppressNextClickRef.current = false;
      return;
    }
    if (!canOpenSettings || !panelId) return;
    onOpenSettings?.(panelId);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenSettings || !panelId || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onOpenSettings?.(panelId);
  };

  return (
    <div
      ref={legendRef}
      className={`absolute z-30 ${placementClass} ${settleClass} ${interactionClass} ${className}`}
      style={style}
      data-testid={testId}
      data-legend-placement={!effectivePosition || isLiveSnapped ? "default" : "custom"}
      data-legend-magnet={isLiveSnapped ? "snapped" : "free"}
      role={canOpenSettings ? "button" : undefined}
      tabIndex={canOpenSettings ? 0 : undefined}
      aria-label={canOpenSettings ? ariaLabel : undefined}
      title={canInteract ? interactionTitle : undefined}
      onPointerDown={canDrag ? onPointerDown : undefined}
      onPointerMove={canDrag ? onPointerMove : undefined}
      onPointerUp={canDrag ? onPointerUp : undefined}
      onPointerCancel={canDrag ? onPointerCancel : undefined}
      onClick={canInteract ? onClick : undefined}
      onKeyDown={canOpenSettings ? onKeyDown : undefined}
    >
      {children}
    </div>
  );
}
