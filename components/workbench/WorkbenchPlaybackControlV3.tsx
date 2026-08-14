import React from "react";
import { ChevronDown, Gauge, Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  WORKBENCH_MAXIMUM_PLAYBACK_RATE_V3,
  WORKBENCH_MINIMUM_PLAYBACK_RATE_V3,
  WORKBENCH_PLAYBACK_RATE_STEP_V3,
  type WorkbenchGroupPlaybackRateStateV3,
} from "@/components/workbench/v3/WorkbenchGroupTimeConductorV3";

export function WorkbenchPlaybackControlV3({
  disabled,
  playing,
  rate,
  onPlaybackToggle,
  onRateChange,
}: Readonly<{
  disabled: boolean;
  playing: boolean;
  rate: WorkbenchGroupPlaybackRateStateV3;
  onPlaybackToggle(): void;
  onRateChange(rate: number): void;
}>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const calibratedMaximum = rate.maximumRate
    ?? WORKBENCH_MAXIMUM_PLAYBACK_RATE_V3;
  // An explicit selection is retained across a Scenario-topology
  // recalibration. If the new ceiling is lower, keep the old position visible
  // so the next drag can move it back into the supported range.
  const sliderMaximum = Math.max(calibratedMaximum, rate.playbackRate);
  const sliderProgress = sliderMaximum === WORKBENCH_MINIMUM_PLAYBACK_RATE_V3
    ? 100
    : (Math.min(rate.playbackRate, sliderMaximum)
      - WORKBENCH_MINIMUM_PLAYBACK_RATE_V3)
      / (sliderMaximum - WORKBENCH_MINIMUM_PLAYBACK_RATE_V3) * 100;

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div
      ref={rootRef}
      className="workbench-playback-control relative inline-flex h-10 shrink-0 items-stretch rounded-[0.85rem] border border-wb-line bg-wb-panel shadow-sm"
      data-testid="v3-playback-control"
    >
      <button
        type="button"
        className="inline-flex min-w-11 items-center justify-center rounded-l-[0.8rem] text-wb-text transition-[color,background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.96] disabled:cursor-wait disabled:opacity-45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        disabled={disabled}
        aria-label={
          playing ? t("workbench.live.pause") : t("workbench.live.play")
        }
        aria-pressed={playing}
        onClick={onPlaybackToggle}
        data-testid="v3-playback-toggle"
      >
        {playing ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      <span className="my-0.5 w-px bg-wb-line" aria-hidden="true" />

      <button
        type="button"
        className="inline-flex min-w-[5.15rem] items-center justify-center gap-1.5 rounded-r-[0.8rem] px-2.5 font-mono text-[0.8rem] font-semibold tabular-nums text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("workbench.live.playbackRate", {
          rate: formatWorkbenchPlaybackRateV3(rate.playbackRate),
        })}
        onClick={() => setOpen((current) => !current)}
        data-testid="v3-playback-rate-trigger"
      >
        <span>{formatWorkbenchPlaybackRateV3(rate.playbackRate)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("workbench.live.playbackRateSettings")}
          className="workbench-playback-rate-popover absolute right-0 top-[calc(100%+0.55rem)] z-[90] w-[18rem] origin-top-right rounded-2xl border border-wb-line bg-wb-panel/95 p-4 text-wb-text shadow-[0_16px_44px_rgba(2,12,27,0.22)] backdrop-blur-xl"
          data-testid="v3-playback-rate-popover"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[-0.006em]">
                {t("workbench.live.playbackRateTitle")}
              </p>
              <p className="mt-0.5 text-[0.68rem] leading-4 text-wb-subtle">
                {rate.calibrating
                  ? t("workbench.live.measuringPlaybackCapacity")
                  : t("workbench.live.devicePlaybackLimit", {
                      rate: formatWorkbenchPlaybackRateV3(
                        rate.maximumRate!,
                      ),
                    })}
              </p>
            </div>
            <div
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-wb-active px-2 py-1 font-mono text-sm font-semibold tabular-nums text-wb-text"
              aria-live="polite"
            >
              <Gauge className="h-3.5 w-3.5 text-wb-accent" aria-hidden="true" />
              {formatWorkbenchPlaybackRateV3(rate.playbackRate)}
            </div>
          </div>

          <div className="relative px-0.5 pb-1 pt-0.5">
            <input
              type="range"
              min={WORKBENCH_MINIMUM_PLAYBACK_RATE_V3}
              max={sliderMaximum}
              step={WORKBENCH_PLAYBACK_RATE_STEP_V3}
              value={Math.min(rate.playbackRate, sliderMaximum)}
              disabled={disabled || rate.calibrating}
              onChange={(event) => onRateChange(
                snapWorkbenchPlaybackRateV3(
                  Number(event.currentTarget.value),
                  calibratedMaximum,
                ),
              )}
              aria-label={t("workbench.live.playbackRateSlider")}
              aria-valuetext={formatWorkbenchPlaybackRateV3(
                rate.playbackRate,
              )}
              style={{
                "--workbench-playback-rate-progress": `${sliderProgress}%`,
              } as React.CSSProperties}
              className="workbench-playback-rate-slider block w-full accent-wb-accent"
              data-testid="v3-playback-rate-slider"
            />
            <div className="mt-2 flex justify-between font-mono text-[0.62rem] tabular-nums text-wb-subtle">
              <span>{formatWorkbenchPlaybackRateV3(
                WORKBENCH_MINIMUM_PLAYBACK_RATE_V3,
              )}</span>
              {calibratedMaximum >= 1 && <span className="text-wb-muted">
                {t("workbench.live.realtimePlaybackRate")}
              </span>}
              <span>{rate.calibrating
                ? "—"
                : formatWorkbenchPlaybackRateV3(calibratedMaximum)}</span>
            </div>
          </div>

          <p className="mt-3 border-t border-wb-line pt-3 text-[0.68rem] leading-4 text-wb-subtle">
            {rate.performanceLimited
              ? t("workbench.live.playbackPerformanceLimited")
              : t("workbench.live.playbackRateFixed")}
          </p>
        </div>
      )}
    </div>
  );
}

export function snapWorkbenchPlaybackRateV3(
  rate: number,
  maximumRate: number,
): number {
  const clamped = Math.min(
    maximumRate,
    Math.max(WORKBENCH_MINIMUM_PLAYBACK_RATE_V3, rate),
  );
  const snapped = Math.round(clamped / WORKBENCH_PLAYBACK_RATE_STEP_V3)
    * WORKBENCH_PLAYBACK_RATE_STEP_V3;
  return Number(Math.min(maximumRate, snapped).toFixed(2));
}

export function formatWorkbenchPlaybackRateV3(rate: number): string {
  return `${rate.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
}
