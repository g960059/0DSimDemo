import React, { useState } from "react";
import type { PanelDef } from "../../types";

export const ReadingControllerSection: React.FC<{
  panel: PanelDef;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ panel, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-lg border border-slate-800 bg-[#0B1120] overflow-hidden">
      <div className="h-8 px-3 flex items-center justify-between border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span className="truncate">{panel.title}</span>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded border border-slate-700 px-2 py-1 text-[11px] font-bold normal-case tracking-normal text-slate-200 transition-colors hover:bg-slate-800"
          aria-expanded={open}
        >
          {open ? "Hide controls" : "Adjust the model"}
        </button>
      </div>
      {open && (
        <div className="relative h-[420px] max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      )}
    </section>
  );
};
