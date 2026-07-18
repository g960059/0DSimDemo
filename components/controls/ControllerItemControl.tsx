import React from "react";
import type { ControllerItem } from "@/types";
import { Slider } from "./Slider";

type ControllerItemControlProps = {
  item: ControllerItem;
  value: number;
  baseline?: number;
  unit?: string;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  onOptionCommit?: (v: number) => void;
  onReset?: () => void;
  disabled?: boolean;
};

const isActiveOption = (value: number, optionValue: number, step: number | undefined) =>
  Math.abs(value - optionValue) <= Math.max((step ?? 0)/2, 1e-6);

const PresetChips = ({ item, value, unit, onChange, disabled }: Pick<ControllerItemControlProps, "item" | "value" | "unit" | "onChange" | "disabled">) => {
  const options = item.options ?? [];

  return (
    <div className="flex gap-1 bg-wb-input rounded p-0.5 border border-wb-line" role="group" aria-label={item.label}>
      {options.map((option) => {
        const active = isActiveOption(value, option.value, item.step);
        return (
          <button
            key={`${option.label}-${option.value}`}
            type="button"
            aria-pressed={active}
            title={`${option.value}${unit ? ` ${unit}` : ""}`}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`min-h-7 flex flex-1 items-center justify-center rounded px-2 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${active ? 'bg-wb-active text-wb-accent ring-1 ring-wb-accent' : 'text-wb-subtle hover:text-wb-muted'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export const ControllerItemControl = ({ item, value, baseline, unit, onChange, onCommit, onOptionCommit, onReset, disabled = false }: ControllerItemControlProps) => {
  const options = item.options ?? [];
  const label = item.label ?? item.paramKey;
  const min = item.min ?? 0;
  const max = item.max ?? 1;
  const step = item.step ?? 0.01;

  if (item.kind === "buttonGroup" && options.length > 0) {
    return (
      <div className="space-y-1">
        <span className="block text-[11px] font-semibold text-wb-muted">{label}</span>
        <PresetChips item={item} value={value} unit={unit} onChange={onOptionCommit ?? onChange} disabled={disabled} />
      </div>
    );
  }

  if (options.length > 0) {
    return (
      <div className="space-y-1">
        <PresetChips item={item} value={value} unit={unit} onChange={onOptionCommit ?? onChange} disabled={disabled} />
        <Slider
          label={label}
          value={value}
          min={min}
          max={max}
          step={step}
          onCommit={onCommit ?? onChange}
          unit={unit}
          baseline={baseline}
          onReset={onReset}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <Slider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onCommit={onCommit ?? onChange}
      unit={unit}
      baseline={baseline}
      onReset={onReset}
      disabled={disabled}
    />
  );
};
