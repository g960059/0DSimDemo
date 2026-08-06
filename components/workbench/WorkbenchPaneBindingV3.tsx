import React from "react";
import { ChevronRight } from "lucide-react";

export type WorkbenchPaneBindingModeV3 = "active-slot" | "fixed";

export type WorkbenchPaneBindingScenarioV3 = Readonly<{
  scenarioId: string;
  label: string;
}>;

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
  mode,
  paneId,
  scenarios,
  onChange,
}: Readonly<{
  activeDescription: string;
  activeLabel: string;
  allowMultipleFixed: boolean;
  fixedDescription: string;
  fixedLabel: string;
  fixedScenarioIds: readonly string[];
  mode: WorkbenchPaneBindingModeV3;
  paneId: string;
  scenarios: readonly WorkbenchPaneBindingScenarioV3[];
  onChange: (
    mode: WorkbenchPaneBindingModeV3,
    scenarioIds: readonly string[],
  ) => void;
}>) {
  const firstScenarioId = scenarios[0]?.scenarioId;
  const selectedScenarioId = fixedScenarioIds.find((scenarioId) =>
    scenarios.some((scenario) => scenario.scenarioId === scenarioId))
    ?? firstScenarioId
    ?? "";

  return (
    <fieldset className="grid gap-3">
      <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-wb-soft/55 px-3 py-3">
        <input
          type="radio"
          name={`pane-binding-${paneId}`}
          checked={mode === "active-slot"}
          onChange={() => onChange("active-slot", [])}
          className="mt-0.5 accent-[var(--wb-accent)]"
        />
        <span>
          <span className="block text-xs font-medium text-wb-text">
            {activeLabel}
          </span>
          <span className="mt-1 block text-[10px] leading-4 text-wb-subtle">
            {activeDescription}
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-wb-soft/55 px-3 py-3">
        <input
          type="radio"
          name={`pane-binding-${paneId}`}
          checked={mode === "fixed"}
          disabled={firstScenarioId === undefined}
          onChange={() => {
            if (selectedScenarioId.length > 0) {
              onChange("fixed", [selectedScenarioId]);
            }
          }}
          className="mt-0.5 accent-[var(--wb-accent)]"
        />
        <span>
          <span className="block text-xs font-medium text-wb-text">
            {fixedLabel}
          </span>
          <span className="mt-1 block text-[10px] leading-4 text-wb-subtle">
            {fixedDescription}
          </span>
        </span>
      </label>

      {mode === "fixed" && (
        allowMultipleFixed ? (
          <div className="ml-5 flex flex-wrap gap-2">
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
                        : fixedScenarioIds.filter((scenarioId) =>
                            scenarioId !== scenario.scenarioId);
                      if (scenarioIds.length > 0) onChange("fixed", scenarioIds);
                    }}
                    className="accent-[var(--wb-accent)]"
                  />
                  {scenario.label}
                </label>
              );
            })}
          </div>
        ) : (
          <label className="ml-5 grid max-w-sm gap-1.5 text-[10px] text-wb-muted">
            <span>{fixedLabel}</span>
            <select
              value={selectedScenarioId}
              onChange={(event) => onChange("fixed", [event.currentTarget.value])}
              className="h-9 rounded-lg bg-wb-input px-2.5 text-xs text-wb-text outline-none ring-1 ring-inset ring-wb-line focus:ring-2 focus:ring-wb-accent"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.scenarioId} value={scenario.scenarioId}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </label>
        )
      )}
    </fieldset>
  );
}
