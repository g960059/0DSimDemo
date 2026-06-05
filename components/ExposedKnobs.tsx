import React from "react";
import { KNOB_RANGES } from "@/engine/knobs";
import { KNOB_LABELS, KNOB_STEPS } from "@/knobMetadata";
import { resolveKnobValue } from "@/lessonKnobs";
import type { NumericKnobKey } from "@/lessonDoc";
import type { SimInstance } from "@/types";

type ExposedKnobsProps = {
  instance: SimInstance;
  keys: NumericKnobKey[];
  onChange: (key: NumericKnobKey, value: number) => void;
};

const formatValue = (key: NumericKnobKey, value: number): string => {
  if (key === "HR") return `${Math.round(value)} bpm`;
  if (key === "peep") return `${Math.round(value)} cmH2O`;
  if (key === "venousTone") return value.toFixed(2);
  return `${value.toFixed(2)}x`;
};

export const ExposedKnobs: React.FC<ExposedKnobsProps> = ({ instance, keys, onChange }) => (
  <div className="h-full overflow-y-auto custom-scrollbar p-3 space-y-3">
    <div className="flex items-center gap-2 min-w-0">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: instance.color }} />
      <div className="text-xs font-bold text-slate-200 truncate">{instance.name}</div>
    </div>
    {keys.map((key) => {
      const range = KNOB_RANGES[key];
      if (!range) return null;
      const value = resolveKnobValue(instance, key);
      return (
        <label key={key} className="block rounded border border-slate-800 bg-slate-950/70 px-3 py-2">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-bold text-slate-300 truncate">{KNOB_LABELS[key] ?? key}</span>
            <span className="shrink-0 text-[11px] font-bold text-blue-300">{formatValue(key, value)}</span>
          </div>
          <input
            type="range"
            min={range[0]}
            max={range[1]}
            step={KNOB_STEPS[key]}
            value={value}
            onChange={(event) => onChange(key, Number(event.target.value))}
            className="w-full accent-blue-500"
          />
        </label>
      );
    })}
  </div>
);
