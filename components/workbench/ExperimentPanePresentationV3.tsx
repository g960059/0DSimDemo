import React from "react";
import { Plus, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { studioNumericControlValueIssueV2 } from "@/studio/contracts/v2/control";
import type { ExperimentControlPresentationV2 } from "@/studio/contracts/v2/content";
import type { ControlDefinitionV2 } from "@/studio/contracts/v2/model";

export type ExperimentOutputPresentationItemV3 = Readonly<{
  itemId: string;
  label: string;
  description?: string;
  value: number | null;
  /** Presentation-only composition over one or more atomic numerical outputs. */
  displayValue?: string;
  unit: string;
  significantDigits?: number;
  availability?: string;
  quality?: string;
  qualityNotice?: string;
}>;

export type ExperimentPaneAddItemActionV3 = Readonly<{
  label: string;
  onClick: () => void;
  prominent?: boolean;
}>;

/**
 * Shared graph chrome for the full Experiment Session and Article projections.
 * Runtime-specific adapters own trace materialization; this component owns the
 * visual surface so both contexts retain identical theme and spacing rules.
 */
export function ExperimentGraphPresentationV3({
  canvasClassName = "",
  children,
  className = "",
  label,
  variant,
  ...figureProps
}: Readonly<{
  canvasClassName?: string;
  children: React.ReactNode;
  label?: string;
  variant: "pane" | "article";
}> &
  Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const figureClassName =
    variant === "pane"
      ? "h-full min-h-0 min-w-0 bg-wb-canvas p-3"
      : "min-w-0 rounded-xl bg-wb-canvas p-3 sm:p-4";
  return (
    <figure
      className={`${figureClassName} ${className}`.trim()}
      {...figureProps}
      data-experiment-graph-presentation={variant}
    >
      {label !== undefined && (
        <figcaption className="mb-2 text-sm font-semibold tracking-tight text-wb-text">
          {label}
        </figcaption>
      )}
      <div className={canvasClassName}>
        {children}
      </div>
    </figure>
  );
}

/** One output vocabulary shared by docked panes and Article Briefings. */
export function ExperimentOutputGridV3({
  addItemAction,
  emptyMessage,
  items,
  scrollMode = "contained",
  variant,
}: Readonly<{
  addItemAction?: ExperimentPaneAddItemActionV3;
  emptyMessage?: string;
  items: readonly ExperimentOutputPresentationItemV3[];
  scrollMode?: "contained" | "parent";
  variant: "pane" | "article";
}>) {
  const layoutClassName =
    variant === "pane"
      ? `min-h-0 flex-1 content-start grid-cols-[repeat(auto-fit,minmax(11.5rem,1fr))] px-2 pb-2 ${
          scrollMode === "contained" ? "overflow-auto" : "overflow-visible"
        }`
      : "article-output-grid gap-x-2 gap-y-2";
  const itemClassName =
    variant === "article"
      ? "rounded-lg bg-wb-floating/55 px-2 py-2"
      : "px-2.5 py-2";
  return (
    <div
      className={`workbench-output-grid grid ${layoutClassName}`}
      data-experiment-output-presentation={variant}
    >
      {items.length === 0 && emptyMessage !== undefined && (
        <p className="col-span-full p-4 text-xs text-wb-subtle">
          {emptyMessage}
        </p>
      )}
      {items.map((item) => {
        const display = resolveExperimentOutputDisplayV3(item);
        return (
          <div
            key={item.itemId}
            className={`workbench-output-item min-w-0 ${itemClassName}`}
            data-output-availability={item.availability ?? "unavailable"}
            data-output-quality={item.quality ?? "not-assessed"}
            title={item.description}
          >
            <p className="workbench-output-label truncate">{item.label}</p>
            <p className="workbench-output-value mt-0.5 whitespace-nowrap tabular-nums">
              {display.value}
              <span className="workbench-output-unit ml-1">
                {display.unit}
              </span>
            </p>
            {item.qualityNotice !== undefined && (
              <p className="mt-1 text-[11px] text-wb-warning">
                {item.qualityNotice}
              </p>
            )}
          </div>
        );
      })}
      {addItemAction !== undefined && (
        <ExperimentPaneAddItemButtonV3
          label={addItemAction.label}
          layout="output-tile"
          onClick={addItemAction.onClick}
          prominent={addItemAction.prominent}
        />
      )}
    </div>
  );
}

/** Shared low-emphasis path from a live output/control pane to its item catalog. */
export function ExperimentPaneAddItemButtonV3({
  label,
  layout = "row",
  onClick,
  prominent = false,
}: Readonly<{
  label: string;
  layout?: "row" | "output-tile";
  onClick: () => void;
  prominent?: boolean;
}>) {
  return (
    <div
      className={
        layout === "output-tile"
          ? "workbench-pane-add-item-shell min-w-0"
          : "workbench-pane-add-item-shell shrink-0 px-2 pb-2"
      }
      data-prominent={prominent ? "true" : "false"}
    >
      <button
        type="button"
        className={`workbench-pane-add-item inline-flex w-full items-center justify-center gap-1.5 rounded-md text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${
          layout === "output-tile"
            ? "min-h-[3.35rem] px-2.5 py-2"
            : "min-h-9 px-3"
        }`}
        onClick={onClick}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </button>
    </div>
  );
}

const EXPERIMENT_CLINICAL_PERCENT_OUTPUT_PREFIXES_V3 = Object.freeze([
  "hemodynamics.ejection-fraction.",
  "hemodynamics.valve-regurgitant-fraction.",
  "oxygen.saturation.",
] as const);

export function resolveExperimentOutputDisplayV3(
  item: ExperimentOutputPresentationItemV3,
): Readonly<{ value: string; unit: string }> {
  if (item.displayValue !== undefined) {
    return Object.freeze({ value: item.displayValue, unit: item.unit });
  }
  const clinicalPercent =
    item.unit === "1" &&
    (EXPERIMENT_CLINICAL_PERCENT_OUTPUT_PREFIXES_V3.some((prefix) =>
      item.itemId.startsWith(prefix),
    ) || item.itemId === "oxygen.extraction-ratio.required");
  const value =
    item.value === null
      ? "—"
      : formatExperimentOutputValueV3(
          clinicalPercent ? item.value * 100 : item.value,
          item.significantDigits,
        );
  return Object.freeze({
    value,
    unit: clinicalPercent ? "%" : item.unit,
  });
}

export function ExperimentNumericControlV3({
  contextLabel,
  control,
  disabled,
  error = null,
  label,
  mixed,
  onCommit,
  pending,
  presentation,
  value,
}: Readonly<{
  contextLabel?: string;
  control: ControlDefinitionV2;
  disabled: boolean;
  error?: string | null;
  label: string;
  mixed: boolean;
  onCommit: (value: number) => Promise<boolean>;
  pending: boolean;
  presentation: ExperimentControlPresentationV2;
  value: number;
}>) {
  const { t } = useTranslation();
  const precision = controlStepPrecisionV3(control.step);
  const formatValue = React.useCallback(
    (candidate: number) => candidate.toFixed(precision),
    [precision],
  );
  const [draft, setDraft] = React.useState(value);
  const [draftText, setDraftText] = React.useState(() => formatValue(value));
  React.useEffect(() => {
    setDraft(value);
    setDraftText(formatValue(value));
  }, [formatValue, value]);
  const commit = async (candidate: number) => {
    const result = await resolveControlDraftCommitV3({
      acceptedValue: value,
      candidate,
      control,
      forceCommit: mixed,
      onCommit,
    });
    setDraft(result.displayValue);
    setDraftText(formatValue(result.displayValue));
  };
  const changed = mixed || workbenchControlValueChangedV3(value, control);
  const displayUnit = workbenchControlDisplayUnitV3(control.unit);
  const valueInputCharacters = workbenchControlInputCharactersV3(
    control,
    draftText,
    precision,
  );
  const progress = workbenchControlRangeProgressV3(draft, control);
  return (
    <div
      className="workbench-control-row"
      data-control-presentation={presentation.kind}
      aria-busy={pending}
    >
      <p className="workbench-control-label" title={label}>
        <span className="block truncate">{label}</span>
        {contextLabel !== undefined && (
          <span className="workbench-control-context block truncate">
            {contextLabel}
          </span>
        )}
      </p>

      <div className="workbench-control-widget">
        {presentation.kind === "buttons" ? (
          <div
            className="workbench-control-segments"
            role="group"
            aria-label={label}
          >
            {presentation.options.map((option) => {
              const active = !mixed && option.value === value;
              const optionIssue = studioNumericControlValueIssueV2(
                option.value,
                control,
              );
              return (
                <button
                  key={`${option.label}:${option.value}`}
                  type="button"
                  aria-pressed={active}
                  data-active={active ? "true" : "false"}
                  disabled={disabled || optionIssue !== undefined}
                  title={
                    optionIssue ??
                    `${option.value.toFixed(precision)} ${displayUnit}`
                  }
                  className="workbench-control-segment"
                  onClick={() => void commit(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            className="workbench-control-range"
            style={
              {
                "--workbench-control-progress": `${progress}%`,
              } as React.CSSProperties
            }
            type="range"
            min={control.minimum}
            max={control.maximum}
            step={control.step}
            value={draft}
            disabled={disabled}
            aria-label={label}
            title={`${control.minimum}–${control.maximum} ${displayUnit}`}
            onChange={(event) => {
              const nextValue = Number(event.currentTarget.value);
              setDraft(nextValue);
              setDraftText(formatValue(nextValue));
            }}
            onPointerUp={(event) =>
              void commit(Number(event.currentTarget.value))
            }
            onKeyUp={(event) => {
              if (
                [
                  "ArrowDown",
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "End",
                  "Home",
                  "PageDown",
                  "PageUp",
                ].includes(event.key)
              ) {
                void commit(Number(event.currentTarget.value));
              }
            }}
          />
        )}
      </div>

      <div className="workbench-control-value">
        <span className="workbench-control-pending-slot" aria-hidden="true">
          {pending && <span className="workbench-control-pending-dot" />}
        </span>
        {pending && (
          <span className="sr-only" role="status">
            {t("workbench.live.applying")}
          </span>
        )}
        {mixed ? (
          <span className="workbench-control-mixed">
            {t("workbench.live.mixedValue")}
          </span>
        ) : presentation.kind === "buttons" ? (
          <output className="workbench-control-output">
            <span>{formatValue(value)}</span>
            <span className="workbench-control-unit">{displayUnit}</span>
          </output>
        ) : (
          <label className="workbench-control-number-group">
            <span className="sr-only">
              {t("workbench.live.exactControlValue", { label })}
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={draftText}
              disabled={disabled}
              style={{ width: `${valueInputCharacters}ch` }}
              className="workbench-control-number"
              aria-label={`${t("workbench.live.exactControlValue", { label })} ${displayUnit}`}
              onChange={(event) => {
                const nextText = event.currentTarget.value;
                setDraftText(nextText);
                const parsed = Number(nextText);
                if (nextText.length > 0 && Number.isFinite(parsed)) {
                  setDraft(parsed);
                }
              }}
              onBlur={() => {
                const parsed = Number(draftText);
                if (!Number.isFinite(parsed)) {
                  setDraft(value);
                  setDraftText(formatValue(value));
                  return;
                }
                void commit(parsed);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setDraft(value);
                  setDraftText(formatValue(value));
                  event.currentTarget.blur();
                }
              }}
            />
            <span className="workbench-control-unit">{displayUnit}</span>
          </label>
        )}
        <button
          type="button"
          className="workbench-control-reset"
          aria-label={`${t("workbench.live.resetControl")}: ${label}`}
          title={t("workbench.live.resetControl")}
          disabled={disabled || !changed}
          onClick={() => {
            setDraft(control.defaultValue);
            setDraftText(formatValue(control.defaultValue));
            void commit(control.defaultValue);
          }}
        >
          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {error !== null && (
        <p
          className="workbench-control-error text-[11px] text-wb-danger"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export type ControlDraftCommitResultV3 = Readonly<{
  accepted: boolean;
  displayValue: number;
}>;

export async function resolveControlDraftCommitV3({
  acceptedValue,
  candidate,
  control,
  forceCommit = false,
  onCommit,
}: Readonly<{
  acceptedValue: number;
  candidate: number;
  control: ControlDefinitionV2;
  forceCommit?: boolean;
  onCommit: (value: number) => Promise<boolean>;
}>): Promise<ControlDraftCommitResultV3> {
  const normalized = normalizeControlValueV3(candidate, control);
  if (!forceCommit && normalized === acceptedValue) {
    return Object.freeze({ accepted: true, displayValue: acceptedValue });
  }
  const accepted = await onCommit(normalized);
  return Object.freeze({
    accepted,
    displayValue: accepted ? normalized : acceptedValue,
  });
}

export function formatExperimentOutputValueV3(
  value: number,
  significantDigits?: number,
): string {
  if (!Number.isFinite(value)) return "—";
  if (significantDigits !== undefined) {
    const absolute = Math.abs(value);
    const decimalPlaces =
      absolute === 0
        ? significantDigits - 1
        : significantDigits - 1 - Math.floor(Math.log10(absolute));
    if (decimalPlaces > 12) {
      return value.toExponential(significantDigits - 1);
    }
    if (decimalPlaces >= 0) return value.toFixed(decimalPlaces);
    const scale = 10 ** -decimalPlaces;
    return (Math.round(value / scale) * scale).toFixed(0);
  }
  const absolute = Math.abs(value);
  if (absolute >= 100) return value.toFixed(1);
  if (absolute >= 10) return value.toFixed(2);
  return value.toFixed(3);
}

export function formatExperimentPressureSummaryV3(
  values: Readonly<{
    maximum: number | null;
    minimum: number | null;
    mean: number | null;
    significantDigits?: number;
  }>,
): string {
  const format = (value: number | null) =>
    value === null
      ? "—"
      : formatExperimentOutputValueV3(value, values.significantDigits);
  return `${format(values.maximum)}/${format(values.minimum)}(${format(values.mean)})`;
}

function workbenchControlDisplayUnitV3(unit: string): string {
  return unit === "1" ? "×" : unit;
}

function workbenchControlInputCharactersV3(
  control: ControlDefinitionV2,
  draftText: string,
  precision: number,
): number {
  const longest = Math.max(
    draftText.length,
    control.minimum.toFixed(precision).length,
    control.maximum.toFixed(precision).length,
    control.defaultValue.toFixed(precision).length,
  );
  return Math.max(3, Math.min(10, longest));
}

function workbenchControlRangeProgressV3(
  value: number,
  control: ControlDefinitionV2,
): number {
  const span = control.maximum - control.minimum;
  if (!(span > 0)) return 0;
  return Math.max(0, Math.min(100, ((value - control.minimum) / span) * 100));
}

function workbenchControlValueChangedV3(
  value: number,
  control: ControlDefinitionV2,
): boolean {
  return (
    Math.abs(value - control.defaultValue) >
    Math.max(Math.abs(control.step) * 1e-6, 1e-12)
  );
}

function normalizeControlValueV3(
  value: number,
  control: ControlDefinitionV2,
): number {
  const clamped = Math.min(control.maximum, Math.max(control.minimum, value));
  const steps = Math.round((clamped - control.minimum) / control.step);
  const snapped = control.minimum + steps * control.step;
  return Number(
    snapped.toFixed(Math.min(12, controlStepPrecisionV3(control.step) + 2)),
  );
}

function controlStepPrecisionV3(step: number): number {
  const text = step.toString();
  if (text.includes("e-")) return Math.min(6, Number(text.split("e-")[1]));
  return Math.min(6, text.split(".")[1]?.length ?? 0);
}
