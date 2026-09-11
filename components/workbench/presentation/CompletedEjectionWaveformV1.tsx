import React from "react";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/appTheme";
import type { StudioSimulationAnalysisV2, StudioSimulationFrameV2 } from "@/studio/contracts/v2/simulation";
import { useResponsiveCanvasFrameV3 } from "./WorkbenchCanvasRuntimeV3";
import { WorkbenchItemDescriptionPopoverV3 } from "./WorkbenchItemDescriptionPopoverV3";

type Waveform = { schemaId: "completed-ejection-waveform-v1"; unit: "m/s";
  durationMs: number; peakTimeMs: number; points: readonly (readonly [number, number])[] };
export function completedEjectionWaveformV1(value: unknown): Waveform | null {
  const v = value as Waveform;
  if (!v || v.schemaId !== "completed-ejection-waveform-v1" || v.unit !== "m/s"
    || !Number.isFinite(v.durationMs) || !(v.durationMs > 0)
    || !Number.isFinite(v.peakTimeMs) || v.peakTimeMs < 0 || v.peakTimeMs > v.durationMs
    || !Array.isArray(v.points) || v.points.length < 3 || v.points.length > 4_004
    || v.points.some((p, i) => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)
      || p[0] < 0 || p[0] > v.durationMs || p[1] < 0 || i > 0 && p[0] <= v.points[i - 1]![0])
    || v.points[0]![0] !== 0 || v.points.at(-1)![0] !== v.durationMs) return null;
  return v;
}
export type CompletedEjectionTraceV1 = Readonly<{ scenarioId: string; label: string; color: string;
  analysis?: StudioSimulationAnalysisV2; frame?: StudioSimulationFrameV2 | null }>;
const scope = (t: CompletedEjectionTraceV1) => `${t.scenarioId}/${t.frame?.runtimeSessionId}`;

/** One unsmoothed completed beat. No animation loop and no extra simulation;
 * new frames with unchanged observer/epoch do not redraw this graph. */
export const CompletedEjectionWaveformV1 = React.memo(function CompletedEjectionWaveformV1({ traces }: { traces: readonly CompletedEjectionTraceV1[] }) {
  const { i18n } = useTranslation(), ja = i18n.language.startsWith("ja");
  useAppTheme(); // Redraw a paused completed beat when the palette changes.
  const previous = React.useRef(new Map<string, { waveform: Waveform; epoch: number }>());
  const container = React.useRef<HTMLDivElement>(null), canvas = React.useRef<HTMLCanvasElement>(null);
  const keys = new Set(traces.map(scope));
  for (const key of previous.current.keys()) if (!keys.has(key)) previous.current.delete(key);
  const displayed = traces.flatMap(trace => {
    const a = trace.analysis, f = trace.frame;
    const sameScope = a && f && a.modelId === f.modelId && a.scenarioId === f.scenarioId
      && a.runtimeSessionId === f.runtimeSessionId && a.inputEpoch === f.inputEpoch;
    const payload = a?.payload as { status?: string; cycleWaveform?: unknown } | undefined;
    const waveform = sameScope && payload?.status === "available" ? completedEjectionWaveformV1(payload.cycleWaveform) : null;
    if (waveform) previous.current.set(scope(trace), { waveform, epoch: a!.inputEpoch });
    const saved = previous.current.get(scope(trace));
    return saved ? [{ ...trace, waveform: saved.waveform, stale: !waveform || saved.epoch !== f?.inputEpoch }] : [];
  });
  useResponsiveCanvasFrameV3(container, canvas, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    if (!displayed.length) return;
    const left = 42, top = 15, bottom = Math.max(top + 10, height - 34), right = Math.max(left + 10, width - 15);
    const maxT = Math.ceil(Math.max(...displayed.map(t => t.waveform.durationMs)) / 50) * 50;
    const maxV = Math.max(1, Math.ceil(Math.max(...displayed.flatMap(t => t.waveform.points.map(p => p[1]))) * 2) / 2);
    const x = (t: number) => left + t / maxT * (right - left), y = (v: number) => bottom - v / maxV * (bottom - top);
    const textColor = getComputedStyle(container.current!).color;
    ctx.font = "12px system-ui"; ctx.fillStyle = textColor; ctx.lineWidth = 1;
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const v = maxV * i / 4;
      ctx.globalAlpha = .17; ctx.strokeStyle = textColor; ctx.beginPath(); ctx.moveTo(left, y(v)); ctx.lineTo(right, y(v)); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillText(v.toFixed(1), left - 7, y(v) + 4);
    }
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) ctx.fillText(`${Math.round(maxT * i / 4)}`, x(maxT * i / 4), bottom + 17);
    ctx.fillText(ja ? "駆出開始から (ms)" : "From ejection onset (ms)", (left + right) / 2, height - 2);
    ctx.textAlign = "left"; ctx.fillText("m/s", 2, 11);
    for (const trace of displayed) {
      ctx.strokeStyle = trace.stale ? textColor : trace.color; ctx.fillStyle = ctx.strokeStyle;
      ctx.globalAlpha = trace.stale ? .35 : .95; ctx.lineWidth = 2; ctx.setLineDash(trace.stale ? [4, 4] : []);
      ctx.beginPath(); trace.waveform.points.forEach(([t, v], index) => index ? ctx.lineTo(x(t), y(v)) : ctx.moveTo(x(t), y(v))); ctx.stroke();
      const peak = trace.waveform.points.reduce((a, b) => b[1] > a[1] ? b : a);
      ctx.setLineDash([3, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x(trace.waveform.peakTimeMs), y(peak[1]));
      ctx.lineTo(x(trace.waveform.peakTimeMs), bottom); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x(trace.waveform.peakTimeMs), y(peak[1]), 3, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, "completed-ejection-waveform");
  return <div className="flex h-full min-h-0 flex-col gap-2 p-3 text-wb-text-secondary" data-ejection-waveform="true">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <WorkbenchItemDescriptionPopoverV3 ariaLabel={ja ? "AV流速・駆出時間の説明" : "About AV velocity and ejection timing"} description={ja
      ? "直近の完了拍。モデル内のAV噴流速度であり、ドプラ計測ではありません。LVOT速度補正・圧回復は含みません。ATは駆出開始から最大流速まで、ETは順行流が続く時間です。"
      : "Latest completed beat; modeled AV jet, not Doppler acquisition. No LVOT velocity correction or pressure recovery. AT: onset to peak velocity; ET: forward-flow duration."} />
      {displayed.map(trace => <span key={trace.scenarioId} style={{ color: trace.stale ? undefined : trace.color, opacity: trace.stale ? .45 : 1 }}
        data-ejection-stale={trace.stale ? "true" : "false"}>
        {trace.label} · AT {trace.waveform.peakTimeMs.toFixed(0)} / ET {trace.waveform.durationMs.toFixed(0)} ms
        {trace.stale ? ja ? "（更新待ち）" : " (stale)" : ""}
      </span>)}
      {!displayed.length && <span>{ja ? "完了した駆出波形を待っています" : "Waiting for a completed ejection"}</span>}
    </div>
    <div ref={container} className="relative min-h-0 flex-1"><canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label={ja ? "AV流速とAT・ET" : "AV velocity, AT and ET"} /></div>
  </div>;
}, (a, b) => a.traces.length === b.traces.length && a.traces.every((t, i) => {
  const next = b.traces[i]!;
  return scope(t) === scope(next) && t.label === next.label && t.color === next.color && t.analysis === next.analysis
    && t.frame?.inputEpoch === next.frame?.inputEpoch;
}));
