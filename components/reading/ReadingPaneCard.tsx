import React from "react";
import type { PanelDef } from "../../types";

function bodyClassFor(panel: PanelDef): string {
  if (panel.type === "PVLOOP") return "relative h-[380px] sm:h-[460px]";
  if (panel.type === "METRICS") return "relative min-h-[180px]";
  if (panel.type === "WAVEFORM" || panel.type === "GUYTON_LEFT" || panel.type === "GUYTON_RIGHT" || panel.type === "GUYTON_3D") {
    return "relative h-[320px] sm:h-[360px]";
  }
  return "relative min-h-[240px]";
}

function bleedClassFor(panel: PanelDef): string {
  if (panel.type === "WAVEFORM" || panel.type === "GUYTON_LEFT" || panel.type === "GUYTON_RIGHT" || panel.type === "GUYTON_3D") {
    return "sm:-mx-8";
  }
  return "";
}

export const ReadingPaneCard: React.FC<{ panel: PanelDef; children: React.ReactNode; title?: string }> = ({ panel, children, title }) => (
  <figure className={`my-10 overflow-hidden rounded-lg border border-wb-line bg-wb-input ${bleedClassFor(panel)}`}>
    {title && (
      <figcaption className="border-b border-wb-line px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-wb-subtle">
        {title}
      </figcaption>
    )}
    <div className={bodyClassFor(panel)}>
      {children}
    </div>
  </figure>
);
