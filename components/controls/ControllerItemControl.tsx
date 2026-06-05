import React from "react";
import type { ControllerItem } from "@/types";
import { Slider } from "./Slider";

type ControllerItemControlProps = {
  item: ControllerItem;
  value: number;
  baseline?: number;
  unit?: string;
  onChange: (v: number) => void;
  onReset?: () => void;
};

const isActiveOption = (value: number, optionValue: number, step: number | undefined) =>
  Math.abs(value - optionValue) <= Math.max((step ?? 0)/2, 1e-6);

const PresetChips = ({ item, value, unit, onChange }: Pick<ControllerItemControlProps, "item" | "value" | "unit" | "onChange">) => {
  const options = item.options ?? [];

  return (
    <div className="flex gap-1 bg-slate-950 rounded p-0.5 border border-slate-800" role="group" aria-label={item.label}>
      {options.map((option) => {
        const active = isActiveOption(value, option.value, item.step);
        return (
          <button
            key={`${option.label}-${option.value}`}
            type="button"
            aria-pressed={active}
            title={`${option.value}${unit ? ` ${unit}` : ""}`}
            onClick={() => onChange(option.value)}
            className={`min-h-7 flex flex-1 items-center justify-center rounded px-2 py-1 text-[11px] font-semibold transition-colors ${active ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/40' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export const ControllerItemControl = ({ item, value, baseline, unit, onChange, onReset }: ControllerItemControlProps) => {
  const options = item.options ?? [];
  const label = item.label ?? item.paramKey;
  const min = item.min ?? 0;
  const max = item.max ?? 1;
  const step = item.step ?? 0.01;

  if (item.kind === "buttonGroup" && options.length > 0) {
    return (
      <div className="space-y-1">
        <span className="block text-[11px] font-semibold text-slate-300">{label}</span>
        <PresetChips item={item} value={value} unit={unit} onChange={onChange} />
      </div>
    );
  }

  if (options.length > 0) {
    return (
      <div className="space-y-1">
        <PresetChips item={item} value={value} unit={unit} onChange={onChange} />
        <Slider
          label={label}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          unit={unit}
          baseline={baseline}
          onReset={onReset}
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
      onChange={onChange}
      unit={unit}
      baseline={baseline}
      onReset={onReset}
    />
  );
};
