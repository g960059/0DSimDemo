import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PanelDef } from "../../types";

export const ReadingControllerSection: React.FC<{
  panel: PanelDef;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ panel, children, defaultOpen = false }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <figure className="my-10 overflow-hidden rounded-lg border border-slate-800/90 bg-slate-950/60">
      <figcaption className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span className="truncate">{panel.title}</span>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded border border-slate-700 px-2 py-1 text-[11px] font-bold normal-case tracking-normal text-slate-200 transition-colors hover:bg-slate-800"
          aria-expanded={open}
        >
          {open ? t("reading.hideControls") : t("reading.adjustModel")}
        </button>
      </figcaption>
      {open && (
        <div className="relative h-[420px] max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      )}
    </figure>
  );
};
