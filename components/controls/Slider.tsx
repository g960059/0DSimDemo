import React from "react";
import { RotateCcw } from "lucide-react";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  unit?: string;
  baseline?: number;
  onReset?: () => void;
}

export const hasChanged = (value: number, baseline: number | undefined, step: number) =>
  baseline !== undefined && Math.abs(value - baseline) > Math.max(step/2, 1e-6);

export const Slider = ({ label, value, min, max, step, onChange, unit, baseline, onReset }: SliderProps) => {
  const decimals = step < 0.01 ? 3 : (step < 0.1 ? 2 : (step < 1 ? 1 : 0));
  const isChanged = hasChanged(value, baseline, step);
  const valueText = value.toFixed(decimals);
  return (
  <div className={`rounded-md border px-2 py-1.5 transition-colors ${isChanged ? 'border-blue-400/30 bg-blue-500/10' : 'border-transparent hover:border-slate-800/80 hover:bg-slate-900/40'}`}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5">
      <span className={`min-w-0 truncate text-[11px] font-medium ${isChanged ? 'text-blue-100' : 'text-slate-300'}`}>{label}</span>
      <span
        className={`rounded border px-1.5 py-0.5 text-[10px] font-mono leading-none ${isChanged ? 'border-blue-400/40 bg-blue-400/15 text-blue-100' : 'border-slate-700/60 bg-slate-950/60 text-slate-200'}`}
        title={isChanged ? `Baseline ${baseline?.toFixed(decimals)}${unit ? ` ${unit}` : ''}` : undefined}
      >
        {valueText}
        {unit && <span className="ml-0.5 text-[9px] text-slate-400">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={onReset}
        disabled={!isChanged || !onReset}
        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${isChanged && onReset ? 'border-blue-400/30 bg-blue-400/10 text-blue-100 hover:bg-blue-400/20' : 'pointer-events-none border-transparent text-transparent'}`}
        title={isChanged && baseline !== undefined ? `Reset to ${baseline.toFixed(decimals)}${unit ? ` ${unit}` : ''}` : undefined}
        aria-label={`Reset ${label}`}
      >
        <RotateCcw className="h-3 w-3" />
      </button>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      aria-label={label}
      aria-valuetext={`${valueText}${unit ? ` ${unit}` : ''}`}
      className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded bg-slate-800 accent-blue-500 hover:accent-blue-400 focus:outline-none"
    />
  </div>
  );
};
