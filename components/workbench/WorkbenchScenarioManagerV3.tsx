import React from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  Eye,
  EyeOff,
  FlaskConical,
  LoaderCircle,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
  type ScenarioPresetV2,
} from "@/studio/contracts/v2/content";
import { workbenchDefaultScenarioColorV3 } from "./v3/WorkbenchGraphColorV3";

export type WorkbenchScenarioDescriptorV3 = Readonly<{
  scenarioId: string;
  label: string;
}>;

export type WorkbenchScenarioAddIntentV3 = Readonly<{
  scenarioId: string;
  label: string;
  /** The parent owns a deep clone; a Scenario never retains a live Preset link. */
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
  addFromPreset: string;
  analysisRunning: string;
  baseColor: string;
  close: string;
  copySuffix: string;
  delete: string;
  deleteLastScenario: string;
  duplicate: string;
  emptyScenarios: string;
  hideScenario: string;
  incompatiblePreset: string;
  noPresets: string;
  rename: string;
  scenarioLimitReached: string;
  scenarioMenu: string;
  scenarioName: string;
  scenarios: string;
  showScenario: string;
  title: string;
}>;

export const DEFAULT_WORKBENCH_SCENARIO_MANAGER_STRINGS_V3: WorkbenchScenarioManagerStringsV3 =
  Object.freeze({
    addFromPreset: "Add from preset",
    analysisRunning: "Recalculating Guyton / Starling",
    baseColor: "Base color for new traces",
    close: "Close Scenario inspector",
    copySuffix: "copy",
    delete: "Delete",
    deleteLastScenario: "Keep at least one Scenario",
    duplicate: "Duplicate",
    emptyScenarios: "No Scenarios are available.",
    hideScenario: "Hide Scenario",
    incompatiblePreset: "This Preset belongs to a different registered model.",
    noPresets: "No compatible Presets are available.",
    rename: "Rename",
    scenarioLimitReached: "At most 4 Scenarios can be compared.",
    scenarioMenu: "Scenario menu",
    scenarioName: "Scenario name",
    scenarios: "Scenarios",
    showScenario: "Show Scenario",
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
  pendingScenarioIds?: readonly string[];
  visibleScenarioIds?: readonly string[];
  scenarioBaseColors?: readonly Readonly<{
    scenarioId: string;
    colorHex: string;
  }>[];
  presets: readonly ScenarioPresetV2[];
  strings: WorkbenchScenarioManagerStringsV3;
  actionDisabledReasons?: WorkbenchScenarioActionDisabledReasonsV3;
  onSelectScenario: (scenarioId: string) => void;
  onToggleScenarioVisibility?: (scenarioId: string) => void;
  onChangeScenarioBaseColor?: (scenarioId: string, colorHex: string) => void;
  onAddFromPreset: (intent: WorkbenchScenarioAddIntentV3) => void;
  onDuplicateScenario: (intent: WorkbenchScenarioDuplicateIntentV3) => void;
  onRenameScenario: (intent: WorkbenchScenarioRenameIntentV3) => void;
  onDeleteScenario: (intent: WorkbenchScenarioDeleteIntentV3) => void;
}>;

export type WorkbenchScenarioManagerV3Props =
  WorkbenchScenarioManagerSharedPropsV3 &
    (
      | Readonly<{
          variant?: "sheet";
          open: boolean;
          onClose: () => void;
        }>
      | Readonly<{
          variant: "embedded" | "embedded-mobile";
          open?: never;
          onClose?: never;
        }>
    );

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
 * Controlled Scenario inspector. Visibility is deliberately a Workbench view
 * concern; fixture/checkpoint ownership remains in the runtime and durable
 * Experiment content managed by the parent.
 */
export function WorkbenchScenarioManagerV3(
  props: WorkbenchScenarioManagerV3Props,
) {
  const {
    modelId,
    scenarios,
    activeScenarioId,
    pendingScenarioIds,
    visibleScenarioIds,
    scenarioBaseColors,
    presets,
    strings,
    actionDisabledReasons,
    onSelectScenario,
    onToggleScenarioVisibility,
    onChangeScenarioBaseColor,
    onAddFromPreset,
    onDuplicateScenario,
    onRenameScenario,
    onDeleteScenario,
  } = props;
  const variant = props.variant ?? "sheet";
  const sheetOpen = variant === "sheet" && props.open;
  const onClose = variant === "sheet" ? props.onClose : undefined;
  const onCloseRef = React.useRef(onClose);
  const panelRef = React.useRef<HTMLElement | null>(null);
  const openMenuRef = React.useRef<HTMLDivElement | null>(null);
  const menuReturnFocusRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const [editingScenarioId, setEditingScenarioId] = React.useState<
    string | null
  >(null);
  const [draftLabel, setDraftLabel] = React.useState("");
  const [presetMenuPosition, setPresetMenuPosition] =
    React.useState<MenuPositionV3 | null>(null);
  const [scenarioMenu, setScenarioMenu] = React.useState<Readonly<{
    scenarioId: string;
    position: MenuPositionV3;
  }> | null>(null);
  const compatiblePresets = React.useMemo(
    () => presets.filter((preset) => preset.modelId === modelId),
    [modelId, presets],
  );
  const visible = React.useMemo(
    () =>
      new Set(
        visibleScenarioIds ?? scenarios.map(({ scenarioId }) => scenarioId),
      ),
    [scenarios, visibleScenarioIds],
  );
  const pending = React.useMemo(
    () => new Set(pendingScenarioIds ?? []),
    [pendingScenarioIds],
  );
  const existingScenarioIds = new Set(
    scenarios.map(({ scenarioId }) => scenarioId),
  );
  const existingLabels = new Set(scenarios.map(({ label }) => label));
  const scenarioLimitReason =
    scenarios.length >= STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2
      ? strings.scenarioLimitReached
      : undefined;
  const addDisabledReason = actionDisabledReasons?.add ?? scenarioLimitReason;
  const duplicateDisabledReason =
    actionDisabledReasons?.duplicate ?? scenarioLimitReason;

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (
      editingScenarioId !== null &&
      !scenarios.some(({ scenarioId }) => scenarioId === editingScenarioId)
    ) {
      setEditingScenarioId(null);
      setDraftLabel("");
    }
    if (
      scenarioMenu !== null &&
      !scenarios.some(
        ({ scenarioId }) => scenarioId === scenarioMenu.scenarioId,
      )
    )
      setScenarioMenu(null);
  }, [editingScenarioId, scenarioMenu, scenarios]);

  React.useEffect(() => {
    if (!sheetOpen || typeof document === "undefined") return undefined;
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const animationFrame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("[data-scenario-manager-initial-focus]")
        ?.focus();
    });
    return () => {
      window.cancelAnimationFrame(animationFrame);
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [sheetOpen]);

  const menuOpen = presetMenuPosition !== null || scenarioMenu !== null;
  React.useLayoutEffect(() => {
    if (!menuOpen || typeof document === "undefined") return undefined;
    const menu = openMenuRef.current;
    const firstItem = menu?.querySelector<HTMLElement>(
      '[role="menuitem"]:not(:disabled)',
    );
    (firstItem ?? menu)?.focus();
    return () => {
      const returnFocus = menuReturnFocusRef.current;
      menuReturnFocusRef.current = null;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if ((!sheetOpen && !menuOpen) || typeof document === "undefined") {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (menuOpen) {
        setPresetMenuPosition(null);
        setScenarioMenu(null);
        return;
      }
      onCloseRef.current?.();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [menuOpen, sheetOpen]);

  if (variant === "sheet" && (!sheetOpen || typeof document === "undefined")) {
    return null;
  }

  const beginRename = (scenario: WorkbenchScenarioDescriptorV3) => {
    if (actionDisabledReasons?.rename !== undefined) return;
    setScenarioMenu(null);
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
  const addPreset = (preset: ScenarioPresetV2) => {
    if (addDisabledReason !== undefined) return;
    setPresetMenuPosition(null);
    onAddFromPreset({
      scenarioId: suggestWorkbenchScenarioIdV3(
        preset.presetId,
        existingScenarioIds,
      ),
      label: suggestWorkbenchScenarioLabelV3(preset.title, existingLabels),
      preset,
    });
  };
  const duplicate = (scenario: WorkbenchScenarioDescriptorV3) => {
    if (duplicateDisabledReason !== undefined) return;
    setScenarioMenu(null);
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
          }
        : { "aria-label": strings.title })}
      className={
        variant === "sheet"
          ? "workbench-floating-surface workbench-sheet-enter pointer-events-auto flex h-full w-full max-w-[420px] flex-col text-wb-text"
          : variant === "embedded-mobile"
            ? "workbench-scenario-manager flex min-h-full w-full min-w-0 flex-col bg-transparent text-wb-text"
            : "workbench-scenario-manager flex max-h-[280px] min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden bg-transparent text-wb-text"
      }
      data-scenario-manager-variant={variant}
      data-testid="workbench-scenario-manager-v3"
    >
      {variant === "sheet" && (
        <header className="flex min-h-14 shrink-0 items-center gap-3 px-4 py-3">
          <FlaskConical
            className="h-4 w-4 shrink-0 text-wb-accent"
            aria-hidden="true"
          />
          <h2
            id={titleId}
            className="min-w-0 flex-1 truncate text-sm font-semibold"
          >
            {strings.title}
          </h2>
          <button
            type="button"
            data-scenario-manager-initial-focus
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={strings.close}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
      )}

      <div
        className={variant === "embedded-mobile"
          ? "px-2 pb-3 pt-2"
          : "min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-2"}
      >
        <section aria-label={strings.scenarios}>
          <header className="flex min-h-10 items-center gap-2 px-2">
            <h3 className="workbench-scenario-heading min-w-0 flex-1 text-wb-text">
              {strings.scenarios}{" "}
              <span className="text-wb-subtle">({scenarios.length})</span>
            </h3>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={strings.addFromPreset}
              aria-haspopup="menu"
              aria-expanded={presetMenuPosition !== null}
              disabled={addDisabledReason !== undefined}
              title={addDisabledReason ?? strings.addFromPreset}
              onClick={(event) => {
                menuReturnFocusRef.current = event.currentTarget;
                const rect = event.currentTarget.getBoundingClientRect();
                setPresetMenuPosition((current) =>
                  current === null
                    ? boundedMenuPositionV3(
                        rect.right - 248,
                        rect.bottom + 4,
                        256,
                        300,
                      )
                    : null,
                );
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          {scenarios.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-wb-muted">
              {strings.emptyScenarios}
            </p>
          ) : (
            <div className="mt-1 grid gap-0.5">
              {scenarios.map((scenario, index) => {
                const active = scenario.scenarioId === activeScenarioId;
                const editing = scenario.scenarioId === editingScenarioId;
                const scenarioVisible = visible.has(scenario.scenarioId);
                const analysisPending = pending.has(scenario.scenarioId);
                const baseColor =
                  scenarioBaseColors?.find(
                    ({ scenarioId }) => scenarioId === scenario.scenarioId,
                  )?.colorHex ?? scenarioIdentityColorV3(index);
                return (
                  <div
                    key={scenario.scenarioId}
                    className={`workbench-scenario-row group flex min-h-11 items-center gap-1 rounded-lg px-2 transition-colors ${
                      active ? "bg-wb-active" : "hover:bg-wb-hover"
                    }`}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      menuReturnFocusRef.current =
                        document.activeElement instanceof HTMLElement
                          ? document.activeElement
                          : null;
                      onSelectScenario(scenario.scenarioId);
                      setScenarioMenu({
                        scenarioId: scenario.scenarioId,
                        position: boundedMenuPositionV3(
                          event.clientX,
                          event.clientY,
                          192,
                          180,
                        ),
                      });
                    }}
                  >
                    {onChangeScenarioBaseColor === undefined ? (
                      <span
                        className="ml-1 h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/15"
                        style={{ backgroundColor: baseColor }}
                        aria-hidden="true"
                      />
                    ) : (
                      <label
                        className="relative ml-1 h-5 w-5 shrink-0 cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-wb-accent focus-within:ring-offset-2 focus-within:ring-offset-wb-panel"
                        title={`${strings.baseColor}: ${scenario.label}`}
                      >
                        <span
                          className="absolute inset-[3px] rounded-full ring-1 ring-black/15"
                          style={{ backgroundColor: baseColor }}
                          aria-hidden="true"
                        />
                        <input
                          type="color"
                          value={baseColor}
                          aria-label={`${strings.baseColor}: ${scenario.label}`}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          onChange={(event) =>
                            onChangeScenarioBaseColor(
                              scenario.scenarioId,
                              event.target.value.toLowerCase(),
                            )
                          }
                        />
                      </label>
                    )}
                    {editing ? (
                      <input
                        type="text"
                        autoFocus
                        value={draftLabel}
                        aria-label={strings.scenarioName}
                        className="h-9 min-w-0 flex-1 rounded-md bg-wb-soft px-2 text-xs font-semibold outline-none ring-1 ring-wb-accent"
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
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                        aria-label={`${scenario.label} ${scenario.scenarioId}`}
                        aria-pressed={active}
                        title={scenario.scenarioId}
                        onClick={() => onSelectScenario(scenario.scenarioId)}
                        onDoubleClick={() => beginRename(scenario)}
                      >
                        <span
                          className={`workbench-scenario-label truncate ${
                            scenarioVisible ? "text-wb-text" : "text-wb-subtle"
                          }`}
                        >
                          {scenario.label}
                        </span>
                      </button>
                    )}
                    {!editing && analysisPending && (
                      <span
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-wb-accent"
                        data-scenario-analysis-pending="true"
                        role="status"
                        title={`${strings.analysisRunning}: ${scenario.label}`}
                      >
                        <LoaderCircle
                          className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          {strings.analysisRunning}: {scenario.label}
                        </span>
                      </span>
                    )}
                    {!editing && onToggleScenarioVisibility !== undefined && (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                        aria-label={`${
                          scenarioVisible
                            ? strings.hideScenario
                            : strings.showScenario
                        }: ${scenario.label}`}
                        aria-pressed={scenarioVisible}
                        onClick={() =>
                          onToggleScenarioVisibility(scenario.scenarioId)
                        }
                      >
                        {scenarioVisible ? (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    )}
                    {!editing && (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-subtle opacity-100 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        aria-label={`${strings.scenarioMenu}: ${scenario.label}`}
                        aria-haspopup="menu"
                        aria-expanded={
                          scenarioMenu?.scenarioId === scenario.scenarioId
                        }
                        onClick={(event) => {
                          menuReturnFocusRef.current = event.currentTarget;
                          const rect =
                            event.currentTarget.getBoundingClientRect();
                          setScenarioMenu({
                            scenarioId: scenario.scenarioId,
                            position: boundedMenuPositionV3(
                              rect.right - 192,
                              rect.bottom + 4,
                              192,
                              180,
                            ),
                          });
                        }}
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </aside>
  );

  const menus =
    typeof document === "undefined"
      ? null
      : createPortal(
          <>
            {(presetMenuPosition !== null || scenarioMenu !== null) && (
              <button
                type="button"
                className="fixed inset-0 z-[89] cursor-default"
                aria-label={strings.close}
                onClick={() => {
                  setPresetMenuPosition(null);
                  setScenarioMenu(null);
                }}
              />
            )}
            {presetMenuPosition !== null && (
              <div
                ref={openMenuRef}
                role="menu"
                tabIndex={-1}
                aria-label={strings.addFromPreset}
                className="fixed z-[90] w-64 overflow-hidden rounded-xl bg-wb-panel p-1.5 text-xs shadow-2xl ring-1 ring-wb-line"
                style={{
                  left: presetMenuPosition.x,
                  top: presetMenuPosition.y,
                }}
              >
                {compatiblePresets.length === 0 ? (
                  <p className="px-3 py-4 text-wb-muted">
                    {presets.length === 0
                      ? strings.noPresets
                      : strings.incompatiblePreset}
                  </p>
                ) : (
                  compatiblePresets.map((preset, index) => (
                    <button
                      key={preset.presetId}
                      type="button"
                      role="menuitem"
                      autoFocus={index === 0}
                      className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                      onClick={() => addPreset(preset)}
                    >
                      <span className="block font-semibold">
                        {preset.title}
                      </span>
                      {preset.description.trim().length > 0 && (
                        <span className="mt-0.5 line-clamp-2 block text-[10px] leading-4 text-wb-subtle">
                          {preset.description}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
            {scenarioMenu !== null &&
              (() => {
                const scenario = scenarios.find(
                  ({ scenarioId }) => scenarioId === scenarioMenu.scenarioId,
                );
                if (scenario === undefined) return null;
                return (
                  <div
                    ref={openMenuRef}
                    role="menu"
                    tabIndex={-1}
                    aria-label={`${strings.scenarioMenu}: ${scenario.label}`}
                    className="fixed z-[90] w-48 overflow-hidden rounded-xl bg-wb-panel p-1.5 text-xs shadow-2xl ring-1 ring-wb-line"
                    style={{
                      left: scenarioMenu.position.x,
                      top: scenarioMenu.position.y,
                    }}
                  >
                    <ScenarioMenuButtonV3
                      autoFocus
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      label={strings.rename}
                      disabledReason={actionDisabledReasons?.rename}
                      onClick={() => beginRename(scenario)}
                    />
                    <ScenarioMenuButtonV3
                      icon={<Copy className="h-3.5 w-3.5" />}
                      label={strings.duplicate}
                      disabledReason={duplicateDisabledReason}
                      onClick={() => duplicate(scenario)}
                    />
                    <ScenarioMenuButtonV3
                      destructive
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      label={strings.delete}
                      disabledReason={
                        scenarios.length <= 1
                          ? strings.deleteLastScenario
                          : actionDisabledReasons?.delete
                      }
                      onClick={() => {
                        setScenarioMenu(null);
                        onDeleteScenario({ scenarioId: scenario.scenarioId });
                      }}
                    />
                  </div>
                );
              })()}
          </>,
          document.body,
        );

  if (variant === "embedded" || variant === "embedded-mobile")
    return (
      <>
        {panel}
        {menus}
      </>
    );
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[85] flex justify-end">
      {panel}
      {menus}
    </div>,
    document.body,
  );
}

type MenuPositionV3 = Readonly<{ x: number; y: number }>;

function boundedMenuPositionV3(
  x: number,
  y: number,
  width: number,
  height: number,
): MenuPositionV3 {
  return Object.freeze({
    x: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
  });
}

export function scenarioIdentityColorV3(index: number): string {
  return workbenchDefaultScenarioColorV3(Math.abs(index));
}

function ScenarioMenuButtonV3({
  autoFocus = false,
  destructive = false,
  disabledReason,
  icon,
  label,
  onClick,
}: Readonly<{
  autoFocus?: boolean;
  destructive?: boolean;
  disabledReason?: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      role="menuitem"
      autoFocus={autoFocus}
      disabled={disabledReason !== undefined}
      title={disabledReason ?? label}
      className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left font-medium focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-35 ${
        destructive
          ? "text-wb-danger hover:bg-wb-danger-soft focus-visible:ring-wb-danger"
          : "text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:ring-wb-accent"
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
