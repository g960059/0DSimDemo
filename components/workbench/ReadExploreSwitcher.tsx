import React from "react";
import { useTranslation } from "react-i18next";
import type { ReadExploreMode } from "@/features/workbench/readExplore";

export function ReadExploreSwitcher({
  mode,
  onModeChange,
  className = "",
}: {
  mode: ReadExploreMode;
  onModeChange: (mode: ReadExploreMode) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const segments: Array<{ mode: ReadExploreMode; label: string }> = [
    { mode: "read", label: t("workbench.header.read") },
    { mode: "explore", label: t("workbench.header.explore") },
  ];

  return (
    <div className={`inline-flex h-8 items-center rounded-md bg-wb-input p-0.5 ${className}`} role="tablist" aria-label={t("workbench.header.readExploreSwitcher")}>
      {segments.map((segment) => {
        const active = mode === segment.mode;
        return (
          <button
            key={segment.mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onModeChange(segment.mode)}
            className={`h-7 rounded px-3 text-xs font-bold transition-colors ${
              active
                ? "bg-wb-active text-wb-text"
                : "text-wb-muted hover:bg-wb-hover hover:text-wb-text"
            }`}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
