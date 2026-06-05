import React from "react";
import type { PanelDef } from "../../types";

function bodyClassFor(panel: PanelDef): string {
  if (panel.type === "PVLOOP") return "relative h-[360px] sm:h-[420px]";
  if (panel.type === "METRICS") return "relative min-h-[160px]";
  if (panel.type === "WAVEFORM" || panel.type === "GUYTON_LEFT" || panel.type === "GUYTON_RIGHT" || panel.type === "GUYTON_3D") {
    return "relative h-[300px] sm:h-[340px]";
  }
  return "relative min-h-[240px]";
}

function bleedClassFor(panel: PanelDef): string {
  if (panel.type === "WAVEFORM" || panel.type === "GUYTON_LEFT" || panel.type === "GUYTON_RIGHT" || panel.type === "GUYTON_3D") {
    return "sm:-mx-6";
  }
  return "";
}

export const ReadingPaneCard: React.FC<{ panel: PanelDef; children: React.ReactNode; title?: string }> = ({ panel, children, title }) => (
  <section className={`rounded-lg border border-slate-800 bg-[#0B1120] overflow-hidden ${bleedClassFor(panel)}`}>
    {title && (
      <div className="h-8 px-3 flex items-center border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </div>
    )}
    <div className={bodyClassFor(panel)}>
      {children}
    </div>
  </section>
);
