import React from "react";

export const WORKBENCH_MAXIMUM_CANVAS_PIXEL_RATIO_V3 = 2;

export function boundedCanvasPixelRatioV3(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(
    WORKBENCH_MAXIMUM_CANVAS_PIXEL_RATIO_V3,
    Math.max(1, value),
  );
}

export type WorkbenchCanvasFrameSchedulerV3 = Readonly<{
  schedule(): void;
  dispose(): void;
}>;

/** One pending animation frame is enough; replacing it can starve rendering. */
export function createWorkbenchCanvasFrameSchedulerV3(
  render: () => void,
  request: (callback: () => void) => number = requestAnimationFrame,
  cancel: (frameId: number) => void = cancelAnimationFrame,
): WorkbenchCanvasFrameSchedulerV3 {
  let frameId: number | null = null;
  let disposed = false;
  return Object.freeze({
    schedule() {
      if (disposed || frameId !== null) return;
      frameId = request(() => {
        frameId = null;
        if (!disposed) render();
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frameId !== null) cancel(frameId);
      frameId = null;
    },
  });
}

export function useResponsiveCanvasFrameV3(
  containerRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => void,
): void {
  const drawRef = React.useRef(draw);
  const scheduleRef = React.useRef<(() => void) | null>(null);

  React.useLayoutEffect(() => {
    drawRef.current = draw;
    scheduleRef.current?.();
  }, [draw]);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (container === null || canvas === null) return undefined;
    const context = canvas.getContext("2d");
    if (context === null) return undefined;
    let width = 1;
    let height = 1;

    const updateBounds = (
      nextWidth?: number,
      nextHeight?: number,
    ) => {
      if (nextWidth === undefined || nextHeight === undefined) {
        const bounds = container.getBoundingClientRect();
        nextWidth = bounds.width;
        nextHeight = bounds.height;
      }
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
    };

    const render = () => {
      const pixelRatio = boundedCanvasPixelRatioV3(
        window.devicePixelRatio || 1,
      );
      const pixelWidth = Math.max(1, Math.round(width * pixelRatio));
      const pixelHeight = Math.max(1, Math.round(height * pixelRatio));
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      drawRef.current(context, width, height);
    };
    const frameScheduler = createWorkbenchCanvasFrameSchedulerV3(render);
    const schedule = frameScheduler.schedule;
    const observer = typeof ResizeObserver === "function"
      ? new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry !== undefined) {
            updateBounds(entry.contentRect.width, entry.contentRect.height);
          } else {
            updateBounds();
          }
          schedule();
        })
      : null;
    observer?.observe(container);
    const handleWindowResize = () => {
      updateBounds();
      schedule();
    };
    window.addEventListener("resize", handleWindowResize);
    updateBounds();
    scheduleRef.current = schedule;
    schedule();
    return () => {
      scheduleRef.current = null;
      observer?.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      frameScheduler.dispose();
    };
  }, [canvasRef, containerRef]);
}

export function scaleLinearV3(
  value: number,
  domainMinimum: number,
  domainMaximum: number,
  rangeMinimum: number,
  rangeMaximum: number,
): number {
  const span = domainMaximum - domainMinimum;
  const ratio = span > 1e-12 ? (value - domainMinimum) / span : 0.5;
  return rangeMinimum + ratio * (rangeMaximum - rangeMinimum);
}
