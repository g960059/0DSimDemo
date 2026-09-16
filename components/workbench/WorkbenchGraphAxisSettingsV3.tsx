import React from "react";
import { useTranslation } from "react-i18next";
import type { ExperimentGraphAxisRangeV2, ExperimentSurfaceGraphPaneV2 } from "@/studio/contracts/v2/content";
import type { GraphDefinitionV2 } from "@/studio/contracts/v2/model";

export function WorkbenchGraphAxisSettingsV3({ graph, pane, waveformUnit, onChange }: Readonly<{
  graph: GraphDefinitionV2;
  pane: ExperimentSurfaceGraphPaneV2;
  waveformUnit?: string;
  onChange: (pane: ExperimentSurfaceGraphPaneV2) => void;
}>) {
  const { i18n } = useTranslation();
  const ja = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ja");
  if (graph.renderer === "cycle-waveform") return null;
  const update = (axis: "x" | "y", range: ExperimentGraphAxisRangeV2 | undefined) => {
    const axisRanges = { ...pane.axisRanges };
    if (range === undefined) delete axisRanges[axis]; else axisRanges[axis] = range;
    const next = { ...pane };
    if (Object.keys(axisRanges).length === 0) delete next.axisRanges; else next.axisRanges = axisRanges;
    onChange(next);
  };
  const structural = graph.renderer === "structural-return";
  return <fieldset className="space-y-3" data-testid="graph-axis-settings">
    <legend className="mb-2 text-xs font-medium text-wb-text">{ja ? "表示範囲" : "Axis ranges"}</legend>
    {graph.renderer !== "sweep" && <AxisRangeV3 ja={ja} axis="x" range={pane.axisRanges?.x}
      label={structural ? (ja ? "横軸 · 圧 (mmHg)" : "X · pressure (mmHg)") : (ja ? "横軸 · 容積 (mL)" : "X · volume (mL)")}
      initial={structural ? { minimum: -3, maximum: 18 } : { minimum: 0, maximum: 200 }}
      onChange={range => update("x", range)} />}
    <AxisRangeV3 ja={ja} axis="y" range={pane.axisRanges?.y}
      label={structural ? (ja ? "縦軸 · 流量 (L/min)" : "Y · flow (L/min)")
        : graph.renderer === "pressure-volume" ? (ja ? "縦軸 · 圧 (mmHg)" : "Y · pressure (mmHg)")
          : `${ja ? "縦軸" : "Y axis"}${waveformUnit && waveformUnit !== "1" ? ` (${waveformUnit})` : ""}`}
      initial={{ minimum: 0, maximum: structural ? 10 : 150 }} onChange={range => update("y", range)} />
  </fieldset>;
}

function AxisRangeV3({ ja, axis, label, range, initial, onChange }: Readonly<{
  ja: boolean; axis: "x" | "y"; label: string; range?: ExperimentGraphAxisRangeV2;
  initial: ExperimentGraphAxisRangeV2; onChange: (range: ExperimentGraphAxisRangeV2 | undefined) => void;
}>) {
  const [minimum, setMinimum] = React.useState(String(range?.minimum ?? initial.minimum));
  const [maximum, setMaximum] = React.useState(String(range?.maximum ?? initial.maximum));
  React.useEffect(() => {
    setMinimum(String(range?.minimum ?? initial.minimum));
    setMaximum(String(range?.maximum ?? initial.maximum));
  }, [range?.minimum, range?.maximum, initial.minimum, initial.maximum]);
  const valid = minimum.trim() !== "" && maximum.trim() !== "" && Number.isFinite(Number(minimum))
    && Number.isFinite(Number(maximum)) && Number(maximum) > Number(minimum)
    && Number.isFinite(Number(maximum) - Number(minimum));
  const commit = () => { if (valid) onChange({ minimum: Number(minimum), maximum: Number(maximum) }); };
  return <div className="space-y-1.5" data-axis-range={axis}>
    <label className="flex items-center justify-between gap-2 text-xs text-wb-muted">
      <span>{label}</span>
      <select aria-label={label} className="rounded border border-wb-border bg-wb-panel px-2 py-1 text-wb-text"
        value={range === undefined ? "auto" : "manual"}
        onChange={event => onChange(event.target.value === "auto" ? undefined : initial)}>
        <option value="auto">{ja ? "自動" : "Auto"}</option>
        <option value="manual">{ja ? "固定" : "Fixed"}</option>
      </select>
    </label>
    {range !== undefined && <>
      <div className="grid grid-cols-2 gap-2">
        {([['minimum', minimum, setMinimum], ['maximum', maximum, setMaximum]] as const).map(([key, value, setValue]) =>
          <label key={key} className="min-w-0 text-[10px] text-wb-subtle">
            {ja ? key === "minimum" ? "最小値" : "最大値" : key === "minimum" ? "Minimum" : "Maximum"}
            <input type="text" inputMode="decimal" aria-label={`${label} ${key === "minimum" ? ja ? "最小値" : "minimum" : ja ? "最大値" : "maximum"}`}
              aria-invalid={!valid} value={value} onChange={event => setValue(event.target.value)}
              onBlur={commit} onKeyDown={event => { if (event.key === "Enter") commit(); }}
              className="mt-1 block w-full rounded border border-wb-border bg-wb-panel px-2 py-1.5 text-xs text-wb-text" />
          </label>)}
      </div>
      {!valid && <p role="alert" className="text-[10px] text-amber-600">{ja ? "最大値は最小値より大きくしてください。" : "Maximum must be greater than minimum."}</p>}
    </>}
  </div>;
}
