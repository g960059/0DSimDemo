import React from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  FlaskConical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
  type ScenarioPresetV2,
} from "@/studio/contracts/v2/content";

export type WorkbenchScenarioDescriptorV3 = Readonly<{
  scenarioId: string;
  label: string;
}>;

export type WorkbenchScenarioAddIntentV3 = Readonly<{
  /** Exact identity proposed by the UI and admitted or rejected by the parent. */
  scenarioId: string;
  label: string;
  /**
   * The parent clones `preset.capture` into the new Scenario. It must never
   * retain a live link to this reusable Preset.
   */
  preset: ScenarioPresetV2;
}>;

export type WorkbenchScenarioDuplicateIntentV3 = Readonly<{
  sourceScenarioId: string;
  scenarioId: string;
  label: string;
}>;

export type WorkbenchScenarioRenameIntentV3 = Readonly<{
  scenarioId: string;
  label: string;
}>;

export type WorkbenchScenarioDeleteIntentV3 = Readonly<{
  scenarioId: string;
}>;

export type WorkbenchScenarioManagerStringsV3 = Readonly<{
  activeScenario: string;
  add: string;
  addFromPreset: string;
  close: string;
  controllerSlot: string;
  copySuffix: string;
  delete: string;
  deleteLastScenario: string;
  duplicate: string;
  emptyScenarios: string;
  incompatiblePreset: string;
  noControllerSelection: string;
  noPresets: string;
  preset: string;
  rename: string;
  scenarioLimitReached: string;
  scenarioName: string;
  scenarios: string;
  title: string;
}>;

export const DEFAULT_WORKBENCH_SCENARIO_MANAGER_STRINGS_V3:
WorkbenchScenarioManagerStringsV3 = Object.freeze({
  activeScenario: "Active",
  add: "Add",
  addFromPreset: "Add from preset",
  close: "Close Scenario inspector",
  controllerSlot: "Parameters",
  copySuffix: "copy",
  delete: "Delete",
  deleteLastScenario: "Keep at least one Scenario",
  duplicate: "Duplicate",
  emptyScenarios: "No Scenarios are available.",
  incompatiblePreset: "This Preset belongs to a different registered model.",
  noControllerSelection: "Select a Scenario to adjust its parameters.",
  noPresets: "No compatible Presets are available.",
  preset: "Preset",
  rename: "Rename",
  scenarioLimitReached: "At most 4 Scenarios can be compared.",
  scenarioName: "Scenario name",
  scenarios: "Scenarios",
  title: "Scenario inspector",
});

export type WorkbenchScenarioActionDisabledReasonsV3 = Readonly<{
  add?: string;
  delete?: string;
  duplicate?: string;
  rename?: string;
}>;

type WorkbenchScenarioManagerSharedPropsV3 = Readonly<{
  modelId: string;
  scenarios: readonly WorkbenchScenarioDescriptorV3[];
  activeScenarioId: string | null;
  presets: readonly ScenarioPresetV2[];
  strings: WorkbenchScenarioManagerStringsV3;
  actionDisabledReasons?: WorkbenchScenarioActionDisabledReasonsV3;
  renderControllerSlot: (
    scenario: WorkbenchScenarioDescriptorV3,
  ) => React.ReactNode;
  onSelectScenario: (scenarioId: string) => void;
  onAddFromPreset: (intent: WorkbenchScenarioAddIntentV3) => void;
  onDuplicateScenario: (intent: WorkbenchScenarioDuplicateIntentV3) => void;
  onRenameScenario: (intent: WorkbenchScenarioRenameIntentV3) => void;
  onDeleteScenario: (intent: WorkbenchScenarioDeleteIntentV3) => void;
}>;

export type WorkbenchScenarioManagerV3Props =
  & WorkbenchScenarioManagerSharedPropsV3
  & (
    | Readonly<{
        /** Portal side sheet; retained for narrow screens and focused editing. */
        variant?: "sheet";
        open: boolean;
        onClose: () => void;
      }>
    | Readonly<{
        /** Inline Dockview control-role content. No portal or dialog semantics. */
        variant: "embedded";
        open?: never;
        onClose?: never;
      }>
  );

/**
 * Produces a portable, collision-free Scenario identity suggestion. The
 * application transaction remains the identity authority and may reject it.
 */
export function suggestWorkbenchScenarioIdV3(
  seed: string,
  existingScenarioIds: ReadonlySet<string>,
): string {
  const tail = seed.split(/[/:]/).filter(Boolean).at(-1) ?? "scenario";
  const portableTail = tail
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._@+-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  const base = `scenario/${portableTail.length > 0 ? portableTail : "scenario"}`;
  if (!existingScenarioIds.has(base)) return base;
  let suffix = 2;
  while (existingScenarioIds.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function suggestWorkbenchScenarioLabelV3(
  seed: string,
  existingLabels: ReadonlySet<string>,
): string {
  const trimmed = seed.trim() || "Scenario";
  if (!existingLabels.has(trimmed)) return trimmed;
  let suffix = 2;
  while (existingLabels.has(`${trimmed} ${suffix}`)) suffix += 1;
  return `${trimmed} ${suffix}`;
}

/**
 * Controlled Scenario inspector. It emits intents only: no Scenario is
 * optimistically invented, no Preset is linked, and no runtime is started or
 * stopped by this presentation component.
 */
export function WorkbenchScenarioManagerV3(
  props: WorkbenchScenarioManagerV3Props,
) {
  const {
    modelId,
    scenarios,
    activeScenarioId,
    presets,
    strings,
    actionDisabledReasons,
    renderControllerSlot,
    onSelectScenario,
    onAddFromPreset,
    onDuplicateScenario,
    onRenameScenario,
    onDeleteScenario,
  } = props;
  const variant = props.variant ?? "sheet";
  const sheetOpen = variant === "sheet" && props.open;
  const onClose = variant === "sheet" ? props.onClose : undefined;
  const panelRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef<(() => void) | undefined>(onClose);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const presetDescriptionId = React.useId();
  const [editingScenarioId, setEditingScenarioId] = React.useState<string | null>(
    null,
  );
  const [draftLabel, setDraftLabel] = React.useState("");
  const compatiblePresets = React.useMemo(
    () => presets.filter((preset) => preset.modelId === modelId),
    [modelId, presets],
  );
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>(
    compatiblePresets[0]?.presetId ?? "",
  );
  const selectedPreset = compatiblePresets.find(({ presetId }) =>
    presetId === selectedPresetId) ?? compatiblePresets[0];
  const activeScenario = scenarios.find(({ scenarioId }) =>
    scenarioId === activeScenarioId);
  const existingScenarioIds = new Set(scenarios.map(({ scenarioId }) =>
    scenarioId));
  const existingLabels = new Set(scenarios.map(({ label }) => label));
  const scenarioLimitReason =
    scenarios.length >= STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2
      ? strings.scenarioLimitReached
      : undefined;
  const addDisabledReason = actionDisabledReasons?.add ?? scenarioLimitReason;
  const duplicateDisabledReason =
    actionDisabledReasons?.duplicate ?? scenarioLimitReason;
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (
      compatiblePresets.length > 0
      && !compatiblePresets.some(({ presetId }) => presetId === selectedPresetId)
    ) {
      setSelectedPresetId(compatiblePresets[0]!.presetId);
    }
  }, [compatiblePresets, selectedPresetId]);

  React.useEffect(() => {
    if (
      editingScenarioId !== null
      && !scenarios.some(({ scenarioId }) => scenarioId === editingScenarioId)
    ) {
      setEditingScenarioId(null);
      setDraftLabel("");
    }
  }, [editingScenarioId, scenarios]);

  React.useEffect(() => {
    if (!sheetOpen || typeof document === "undefined") return undefined;
    const returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const animationFrame = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(
        "[data-scenario-manager-initial-focus]",
      )?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRef.current?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", onKeyDown);
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [sheetOpen]);

  if (variant === "sheet" && (!sheetOpen || typeof document === "undefined")) {
    return null;
  }

  const beginRename = (scenario: WorkbenchScenarioDescriptorV3) => {
    if (actionDisabledReasons?.rename !== undefined) return;
    setEditingScenarioId(scenario.scenarioId);
    setDraftLabel(scenario.label);
  };
  const cancelRename = () => {
    setEditingScenarioId(null);
    setDraftLabel("");
  };
  const commitRename = (scenario: WorkbenchScenarioDescriptorV3) => {
    const label = draftLabel.trim();
    if (label.length > 0 && label !== scenario.label) {
      onRenameScenario({ scenarioId: scenario.scenarioId, label });
    }
    cancelRename();
  };
  const addSelectedPreset = () => {
    if (selectedPreset === undefined || addDisabledReason !== undefined) {
      return;
    }
    onAddFromPreset({
      scenarioId: suggestWorkbenchScenarioIdV3(
        selectedPreset.presetId,
        existingScenarioIds,
      ),
      label: suggestWorkbenchScenarioLabelV3(
        selectedPreset.title,
        existingLabels,
      ),
      preset: selectedPreset,
    });
  };
  const duplicate = (scenario: WorkbenchScenarioDescriptorV3) => {
    if (duplicateDisabledReason !== undefined) return;
    const labelSeed = `${scenario.label} ${strings.copySuffix}`;
    onDuplicateScenario({
      sourceScenarioId: scenario.scenarioId,
      scenarioId: suggestWorkbenchScenarioIdV3(
        `${scenario.scenarioId}-copy`,
        existingScenarioIds,
      ),
      label: suggestWorkbenchScenarioLabelV3(labelSeed, existingLabels),
    });
  };

  const panel = (
    <aside
      ref={panelRef}
      {...(variant === "sheet"
        ? {
            role: "dialog",
            "aria-modal": false,
            "aria-labelledby": titleId,
            "aria-describedby": descriptionId,
          }
        : {
            "aria-label": strings.title,
          })}
      className={variant === "sheet"
        ? "workbench-sheet-enter pointer-events-auto flex h-full w-full max-w-[440px] flex-col bg-wb-panel text-wb-text shadow-2xl sm:ring-1 sm:ring-wb-line"
        : "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-wb-panel text-wb-text"}
      data-scenario-manager-variant={variant}
      data-testid="workbench-scenario-manager-v3"
    >
      {variant === "sheet" && (
        <header className="flex min-h-14 shrink-0 items-center gap-3 px-4 py-3 sm:px-5">
          <span className="rounded-lg bg-wb-active p-2 text-wb-accent">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-sm font-semibold">
              {strings.title}
            </h2>
            <p id={descriptionId} className="text-[11px] text-wb-subtle">
              {strings.scenarios}
            </p>
          </div>
          <button
            type="button"
            data-scenario-manager-initial-focus
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-wb-muted transition-colors duration-150 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={strings.close}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
      )}

      <div className={variant === "sheet"
        ? "min-h-0 flex-1 overflow-y-auto px-3 pb-5 sm:px-4"
        : "min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-2"}
      >
          <section className={variant === "sheet"
            ? "rounded-xl bg-wb-soft p-3"
            : "rounded-lg bg-wb-soft p-2.5"}
          aria-labelledby={presetDescriptionId}>
            <div className="flex items-center justify-between gap-3">
              <h3
                id={presetDescriptionId}
                className="text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle"
              >
                {strings.addFromPreset}
              </h3>
              {addDisabledReason !== undefined && (
                <span className="truncate text-[10px] text-wb-subtle">
                  {addDisabledReason}
                </span>
              )}
            </div>
            {compatiblePresets.length === 0 ? (
              <p className="mt-2 text-xs leading-5 text-wb-muted">
                {presets.length === 0
                  ? strings.noPresets
                  : strings.incompatiblePreset}
              </p>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">{strings.preset}</span>
                    <select
                      value={selectedPreset?.presetId ?? ""}
                      className="min-h-10 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-transparent focus:ring-wb-accent"
                      onChange={(event) => setSelectedPresetId(event.target.value)}
                    >
                      {compatiblePresets.map((preset) => (
                        <option key={preset.presetId} value={preset.presetId}>
                          {preset.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-wb-primary px-3 text-xs font-semibold text-white hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={
                      selectedPreset === undefined
                      || addDisabledReason !== undefined
                    }
                    title={addDisabledReason}
                    onClick={addSelectedPreset}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {strings.add}
                  </button>
                </div>
                {selectedPreset !== undefined && (
                  <div className="mt-2 min-w-0">
                    <p className="truncate font-mono text-[9px] text-wb-subtle">
                      {selectedPreset.presetId}
                    </p>
                    {selectedPreset.description.trim().length > 0 && (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-wb-muted">
                        {selectedPreset.description}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          <section
            className={variant === "sheet" ? "mt-5" : "mt-3"}
            aria-label={strings.scenarios}
          >
            {scenarios.length === 0 ? (
              <p className="rounded-xl bg-wb-soft px-4 py-8 text-center text-xs text-wb-muted">
                {strings.emptyScenarios}
              </p>
            ) : (
              <div className="grid gap-1">
                {scenarios.map((scenario, index) => {
                  const active = scenario.scenarioId === activeScenarioId;
                  const editing = scenario.scenarioId === editingScenarioId;
                  return (
                    <div
                      key={scenario.scenarioId}
                      className={`group rounded-lg px-2 py-2 transition-colors ${
                        active ? "bg-wb-active" : "hover:bg-wb-hover"
                      }`}
                    >
                      <div className="flex min-h-10 items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wb-soft font-mono text-[10px] text-wb-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                          aria-label={`${strings.activeScenario}: ${scenario.label}`}
                          aria-pressed={active}
                          onClick={() => onSelectScenario(scenario.scenarioId)}
                        >
                          {index + 1}
                        </button>

                        {editing ? (
                          <input
                            type="text"
                            autoFocus
                            value={draftLabel}
                            aria-label={strings.scenarioName}
                            className="min-h-9 min-w-0 flex-1 rounded-md bg-wb-soft px-2.5 text-xs font-semibold outline-none ring-1 ring-wb-accent"
                            onFocus={(event) => event.currentTarget.select()}
                            onChange={(event) => setDraftLabel(event.target.value)}
                            onBlur={() => commitRename(scenario)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") event.currentTarget.blur();
                              if (event.key === "Escape") {
                                event.stopPropagation();
                                cancelRename();
                              }
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                            onClick={() => onSelectScenario(scenario.scenarioId)}
                            onDoubleClick={() => beginRename(scenario)}
                          >
                            <span className="block truncate text-xs font-semibold">
                              {scenario.label}
                            </span>
                            <span className="block truncate font-mono text-[9px] text-wb-subtle">
                              {scenario.scenarioId}
                            </span>
                          </button>
                        )}

                        {!editing && (
                          <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <ScenarioIconButtonV3
                              label={strings.rename}
                              disabledReason={actionDisabledReasons?.rename}
                              onClick={() => beginRename(scenario)}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </ScenarioIconButtonV3>
                            <ScenarioIconButtonV3
                              label={strings.duplicate}
                              disabledReason={duplicateDisabledReason}
                              onClick={() => duplicate(scenario)}
                            >
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            </ScenarioIconButtonV3>
                            <ScenarioIconButtonV3
                              label={strings.delete}
                              destructive
                              disabledReason={scenarios.length <= 1
                                ? strings.deleteLastScenario
                                : actionDisabledReasons?.delete}
                              onClick={() => onDeleteScenario({
                                scenarioId: scenario.scenarioId,
                              })}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </ScenarioIconButtonV3>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section
            className={variant === "sheet" ? "mt-5" : "mt-3"}
            aria-label={strings.controllerSlot}
          >
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
              {strings.controllerSlot}
            </h3>
            {activeScenario === undefined ? (
              <div className="rounded-xl bg-wb-soft px-4 py-8 text-center text-xs text-wb-muted">
                {strings.noControllerSelection}
              </div>
            ) : (
              <div
                key={activeScenario.scenarioId}
                data-controller-scenario-id={activeScenario.scenarioId}
                className="min-w-0 rounded-xl bg-wb-soft p-3"
              >
                {renderControllerSlot(activeScenario)}
              </div>
            )}
          </section>
      </div>
    </aside>
  );

  if (variant === "embedded") return panel;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[85] flex justify-end">
      {panel}
    </div>,
    document.body,
  );
}

function ScenarioIconButtonV3({
  label,
  disabledReason,
  destructive = false,
  onClick,
  children,
}: Readonly<{
  label: string;
  disabledReason?: string;
  destructive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabledReason !== undefined}
      title={disabledReason ?? label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-35 ${
        destructive
          ? "text-wb-subtle hover:bg-red-500/10 hover:text-red-500 focus-visible:ring-red-500"
          : "text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:ring-wb-accent"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
