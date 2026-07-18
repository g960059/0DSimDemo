import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange?: (val: number) => void;
  onCommit?: (val: number) => void;
  unit?: string;
  /** Precise model semantics shown as a hover tooltip and exposed to assistive technology. */
  description?: string;
  baseline?: number;
  onReset?: () => void;
  disabled?: boolean;
  /** Optional exact runtime values. The thumb moves by index and never emits
   * an intermediate value outside this set. */
  stops?: readonly Readonly<{ value: number; label: string }>[];
}

export const hasChanged = (value: number, baseline: number | undefined, step: number) =>
  baseline !== undefined && Math.abs(value - baseline) > Math.max(step/2, 1e-6);

export const Slider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  unit,
  description,
  baseline,
  onReset,
  disabled = false,
  stops,
}: SliderProps) => {
  const { t } = useTranslation();
  const [draftValue, setDraftValue] = useState(value);
  const draftValueRef = useRef(value);
  const editingRef = useRef(false);
  const lastCommittedRef = useRef(value);
  const decimals = step < 0.01 ? 3 : (step < 0.1 ? 2 : (step < 1 ? 1 : 0));
  const commitThreshold = Math.max(step / 2, 1e-9);
  const liveValue = onCommit ? draftValue : value;
  const isChanged = hasChanged(liveValue, baseline, step);
  const exactStops = (stops ?? [])
    .filter((stop, index, values) =>
      Number.isFinite(stop.value)
      && values.findIndex((candidate) => candidate.value === stop.value) === index)
    .sort((left, right) => left.value - right.value);
  const usesExactStops = exactStops.length >= 2;
  const nearestStopIndex = usesExactStops
    ? exactStops.reduce((bestIndex, stop, index) =>
      Math.abs(stop.value - liveValue)
        < Math.abs(exactStops[bestIndex]!.value - liveValue)
        ? index
        : bestIndex, 0)
    : 0;
  const selectedStop = usesExactStops ? exactStops[nearestStopIndex] : undefined;
  const valueText = exactStopDisplayValue(selectedStop, unit)
    ?? liveValue.toFixed(decimals);
  const baselineText = exactStopDisplayValue(
    exactStops.find((stop) => stop.value === baseline),
    unit,
  ) ?? baseline?.toFixed(decimals);

  useEffect(() => {
    // When a parent mirrors the in-progress draft, do not move the commit
    // baseline on every input event. The eventual pointer/key release must
    // still observe a change and invoke onCommit exactly once.
    if (!editingRef.current) {
      lastCommittedRef.current = value;
      draftValueRef.current = value;
      setDraftValue(value);
    }
  }, [value]);

  const updateDraft = (next: number) => {
    if (disabled) return;
    editingRef.current = true;
    draftValueRef.current = next;
    setDraftValue(next);
    onChange?.(next);
  };

  const commitDraft = () => {
    if (!onCommit || disabled) return;
    editingRef.current = false;
    const next = draftValueRef.current;
    if (Math.abs(next - lastCommittedRef.current) <= commitThreshold) return;
    lastCommittedRef.current = next;
    onCommit(next);
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if ([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Enter",
      " ",
    ].includes(event.key)) {
      commitDraft();
    }
  };

  return (
  <div className={`rounded-md border px-2 py-1.5 transition-colors ${isChanged ? 'border-wb-line bg-wb-active' : 'border-transparent hover:border-wb-line hover:bg-wb-input'}`}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5">
      <span
        className={`min-w-0 truncate text-[11px] font-medium ${isChanged ? 'text-wb-text' : 'text-wb-muted'}`}
        title={description}
      >
        {label}
      </span>
      <span
        className={`rounded border px-1.5 py-0.5 text-[10px] font-mono leading-none ${isChanged ? 'border-wb-accent bg-wb-active text-wb-text' : 'border-wb-line bg-wb-input text-wb-text'}`}
        title={isChanged ? t("workbench.controls.baselineValue", { value: baselineText, unit: unit ? ` ${unit}` : "" }) : undefined}
      >
        {valueText}
        {unit && <span className="ml-0.5 text-[9px] text-wb-muted">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={onReset}
        disabled={disabled || !isChanged || !onReset}
        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${isChanged && onReset ? 'border-wb-line bg-wb-active text-wb-text hover:bg-wb-active' : 'pointer-events-none border-transparent text-transparent'}`}
        title={isChanged && baseline !== undefined ? t("workbench.controls.resetTo", { value: baselineText, unit: unit ? ` ${unit}` : "" }) : undefined}
        aria-label={t("workbench.controls.resetAria", { label })}
      >
        <RotateCcw className="h-3 w-3" />
      </button>
    </div>
    <input
      type="range"
      min={usesExactStops ? 0 : min}
      max={usesExactStops ? exactStops.length - 1 : max}
      step={usesExactStops ? 1 : step}
      value={usesExactStops ? nearestStopIndex : liveValue}
      onChange={(e) => {
        const raw = parseFloat(e.target.value);
        updateDraft(usesExactStops ? exactStops[Math.round(raw)]!.value : raw);
      }}
      onPointerUp={commitDraft}
      onTouchEnd={commitDraft}
      onKeyUp={handleKeyUp}
      onBlur={commitDraft}
      disabled={disabled}
      aria-label={label}
      aria-description={description}
      title={description}
      aria-valuetext={selectedStop?.label ?? `${valueText}${unit ? ` ${unit}` : ''}`}
      className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded bg-wb-hover accent-wb-accent hover:accent-wb-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-wb-panel disabled:cursor-not-allowed disabled:opacity-50"
    />
    {usesExactStops && (
      <div className="mt-1 flex justify-between gap-1 px-0.5 text-[9px] font-medium tabular-nums text-wb-subtle" aria-hidden="true">
        {exactStops.map((stop) => (
          <span key={stop.value}>{stop.label}</span>
        ))}
      </div>
    )}
  </div>
  );
};

function exactStopDisplayValue(
  stop: Readonly<{ value: number; label: string }> | undefined,
  unit: string | undefined,
): string | undefined {
  if (stop === undefined) return undefined;
  const label = stop.label.trim();
  if (unit && label.endsWith(unit)) {
    return label.slice(0, -unit.length).trimEnd();
  }
  return label;
}
