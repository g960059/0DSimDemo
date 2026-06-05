import React from "react";
import { KNOB_RANGES } from "@/engine/knobs";
import { defaultControllerItemFor } from "@/knobMetadata";
import { resolveKnobValue } from "@/lessonKnobs";
import type { NumericKnobKey } from "@/lessonDoc";
import type { SimInstance } from "@/types";
import { ControllerItemControl } from "./controls/ControllerItemControl";

type ExposedKnobsProps = {
  instance: SimInstance;
  keys: NumericKnobKey[];
  onChange: (key: NumericKnobKey, value: number) => void;
};

const unitFor = (key: NumericKnobKey): string | undefined => {
  if (key === "HR") return "bpm";
  if (key === "peep") return "cmH2O";
  if (key === "venousTone") return undefined;
  return "x";
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
        <div key={key} className="rounded border border-slate-800 bg-slate-950/70 px-3 py-2">
          <ControllerItemControl
            item={{ ...defaultControllerItemFor(key), min: range[0], max: range[1] }}
            value={value}
            unit={unitFor(key)}
            onChange={(nextValue) => onChange(key, nextValue)}
          />
        </div>
      );
    })}
  </div>
);
