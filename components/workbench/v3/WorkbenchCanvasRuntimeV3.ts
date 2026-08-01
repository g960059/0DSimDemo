import React from "react";

export function useResponsiveCanvasFrameV3(
  containerRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => void,
): void {
  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (container === null || canvas === null) return undefined;
    let frameId: number | null = null;
    const render = () => {
      frameId = null;
      const bounds = container.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
      const pixelWidth = Math.max(1, Math.round(width * pixelRatio));
      const pixelHeight = Math.max(1, Math.round(height * pixelRatio));
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      const context = canvas.getContext("2d");
      if (context === null) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      draw(context, width, height);
    };
    const schedule = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(render);
    };
    const observer = typeof ResizeObserver === "function"
      ? new ResizeObserver(schedule)
      : null;
    observer?.observe(container);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [canvasRef, containerRef, draw]);
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
