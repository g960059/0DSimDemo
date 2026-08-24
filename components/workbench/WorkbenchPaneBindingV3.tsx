import React from "react";
import { ChevronRight } from "lucide-react";

export type WorkbenchPaneBindingModeV3 = "active-slot" | "fixed";

export type WorkbenchPaneBindingScenarioV3 = Readonly<{
  scenarioId: string;
  label: string;
}>;

/** Shared two-state selector used by graph, output, and controller panes. */
export function WorkbenchPaneBindingModeSelectorV3({
  activeLabel,
  fixedDisabled = false,
  fixedLabel,
  groupLabel,
  mode,
  onChange,
}: Readonly<{
  activeLabel: string;
  fixedDisabled?: boolean;
  fixedLabel: string;
  groupLabel: string;
  mode: WorkbenchPaneBindingModeV3;
  onChange: (mode: WorkbenchPaneBindingModeV3) => void;
}>) {
  return (
    <div
      className="workbench-control-segments w-full md:max-w-sm"
      role="radiogroup"
      aria-label={groupLabel}
    >
      {(
        [
          ["active-slot", activeLabel, false],
          ["fixed", fixedLabel, fixedDisabled],
        ] as const
      ).map(([candidate, label, disabled]) => {
        const active = candidate === mode;
        return (
          <button
            key={candidate}
            type="button"
            role="radio"
            aria-checked={active}
            data-active={active ? "true" : "false"}
            disabled={disabled}
            className="workbench-control-segment active:scale-[0.98]"
            onClick={() => onChange(candidate)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Shared, quiet binding affordance for Output and Controller panes.
 *
 * It deliberately reports only the resolved pane context. Scenario visibility
 * is a graph concern. With one Scenario there is no binding choice to explain,
 * so the affordance stays out of the way.
 */
export function WorkbenchPaneBindingButtonV3({
  label,
  modeLabel,
  onClick,
  targetLabel,
  testId,
  visible,
}: Readonly<{
  label: string;
  modeLabel: string;
  onClick: () => void;
  targetLabel: string;
  testId: string;
  visible: boolean;
}>) {
  if (!visible) return null;
  return (
    <div className="workbench-pane-binding-row shrink-0 px-2 pb-0.5 pt-1">
      <button
        type="button"
        className="workbench-pane-binding group inline-flex min-h-7 max-w-full items-center gap-1 rounded-full px-2 text-left text-[11px] font-medium text-wb-muted transition-[background-color,color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        aria-label={label}
        onClick={onClick}
        data-testid={testId}
        title={label}
      >
        <span className="shrink-0 text-wb-subtle">{modeLabel}</span>
        <span className="shrink-0 text-wb-faint" aria-hidden="true">
          ·
        </span>
        <span className="min-w-0 truncate text-wb-text">{targetLabel}</span>
        <ChevronRight
          className="h-3 w-3 shrink-0 text-wb-faint transition-colors duration-150 group-hover:text-wb-muted"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

/**
 * One Pane Settings editor shared by Output and Controller panes.
 *
 * Output panes pass `allowMultipleFixed={false}` and therefore encode exactly
 * one Scenario. Controller panes may target more than one Scenario because a
 * coordinated intervention is a distinct, intentional controller capability.
 */
export function WorkbenchPaneBindingEditorV3({
  activeDescription,
  activeLabel,
  allowMultipleFixed,
  fixedDescription,
  fixedLabel,
  fixedScenarioIds,
  groupLabel,
  mode,
  scenarios,
  onChange,
}: Readonly<{
  activeDescription: string;
  activeLabel: string;
  allowMultipleFixed: boolean;
  fixedDescription: string;
  fixedLabel: string;
  fixedScenarioIds: readonly string[];
  groupLabel: string;
  mode: WorkbenchPaneBindingModeV3;
  scenarios: readonly WorkbenchPaneBindingScenarioV3[];
  onChange: (
    mode: WorkbenchPaneBindingModeV3,
    scenarioIds: readonly string[],
  ) => void;
}>) {
  const firstScenarioId = scenarios[0]?.scenarioId;
  const selectedScenarioId =
    fixedScenarioIds.find((scenarioId) =>
      scenarios.some((scenario) => scenario.scenarioId === scenarioId),
    ) ??
    firstScenarioId ??
    "";

  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">{groupLabel}</legend>
      <WorkbenchPaneBindingModeSelectorV3
        activeLabel={activeLabel}
        fixedDisabled={firstScenarioId === undefined}
        fixedLabel={fixedLabel}
        groupLabel={groupLabel}
        mode={mode}
        onChange={(nextMode) => {
          if (nextMode === "active-slot") {
            onChange("active-slot", []);
          } else {
            if (selectedScenarioId.length > 0) {
              onChange("fixed", [selectedScenarioId]);
            }
          }
        }}
      />
      <p className="text-[10px] leading-4 text-wb-subtle">
        {mode === "active-slot" ? activeDescription : fixedDescription}
      </p>

      {mode === "fixed" &&
        (allowMultipleFixed ? (
          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => {
              const selected = fixedScenarioIds.includes(scenario.scenarioId);
              return (
                <label
                  key={scenario.scenarioId}
                  className="inline-flex items-center gap-1.5 rounded-md bg-wb-soft px-2 py-1.5 text-[10px] text-wb-muted"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={selected && fixedScenarioIds.length === 1}
                    onChange={(event) => {
                      const scenarioIds = event.currentTarget.checked
                        ? [...fixedScenarioIds, scenario.scenarioId]
                        : fixedScenarioIds.filter(
                            (scenarioId) => scenarioId !== scenario.scenarioId,
                          );
                      if (scenarioIds.length > 0)
                        onChange("fixed", scenarioIds);
                    }}
                    className="accent-[var(--wb-accent)]"
                  />
                  {scenario.label}
                </label>
              );
            })}
          </div>
        ) : (
          <label className="grid max-w-sm gap-1.5 text-[10px] text-wb-muted">
            <span className="sr-only">{fixedLabel}</span>
            <select
              aria-label={fixedLabel}
              value={selectedScenarioId}
              onChange={(event) =>
                onChange("fixed", [event.currentTarget.value])
              }
              className="h-9 rounded-lg bg-wb-input px-2.5 text-xs text-wb-text outline-none ring-1 ring-inset ring-wb-line focus:ring-2 focus:ring-wb-accent"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.scenarioId} value={scenario.scenarioId}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </label>
        ))}
    </fieldset>
  );
}
