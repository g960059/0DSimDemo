import React from "react";
import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Shared authoring entry; read-only article panes never mount this control. */
export function WorkbenchPaneSettingsButtonV3({
  title,
  onOpen,
  compact = false,
}: Readonly<{ title: string; onOpen: (anchor: HTMLElement) => void; compact?: boolean }>) {
  const { t } = useTranslation();
  const label = `${t("workbench.live.paneSettings")}: ${title}`;
  return (
    <button
      type="button"
      data-testid="pane-settings-button-v3"
      aria-haspopup="dialog"
      aria-label={label}
      title={label}
      onClick={(event) => onOpen(event.currentTarget)}
      className={`inline-flex shrink-0 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:ring-2 focus-visible:ring-wb-accent ${compact ? "workbench-pane-settings-compact h-7 w-7" : "h-9 w-9"}`}
    >
      <Settings2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
