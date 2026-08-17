import React from "react";
import { Minus, Pause, Play, Plus } from "lucide-react";
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
  const rateChangeDisabled = disabled || rate.calibrating;
  const presetRates = workbenchPlaybackPresetRatesV3();
  const selectRate = (nextRate: number) => onRateChange(
    snapWorkbenchPlaybackRateV3(nextRate, calibratedMaximum),
  );

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
      className="workbench-playback-control relative inline-flex h-9 shrink-0 items-center rounded-lg text-wb-muted"
      data-open={open ? "true" : "false"}
      data-testid="v3-playback-control"
    >
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:text-wb-text active:scale-[0.96] active:bg-wb-hover disabled:cursor-wait disabled:opacity-45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
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

      <button
        type="button"
        className={`inline-flex h-9 min-w-[3rem] items-center justify-center rounded-lg px-1.5 font-mono text-[0.76rem] font-medium tabular-nums text-wb-muted transition-[color,background-color,transform] duration-150 hover:text-wb-text active:scale-[0.97] active:bg-wb-hover disabled:cursor-not-allowed disabled:opacity-45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:min-w-[3.25rem] ${
          open ? "bg-wb-hover text-wb-text" : ""
        }`}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("workbench.live.playbackRate", {
          rate: formatWorkbenchPlaybackRateV3(rate.playbackRate),
        })}
        title={t("workbench.live.playbackRate", {
          rate: formatWorkbenchPlaybackRateV3(rate.playbackRate),
        })}
        onClick={() => setOpen((current) => !current)}
        data-testid="v3-playback-rate-trigger"
      >
        <span>{formatWorkbenchPlaybackRateV3(rate.playbackRate)}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[89] bg-black/20 sm:hidden"
            aria-hidden="true"
            data-testid="v3-playback-rate-backdrop"
            onPointerDown={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={t("workbench.live.playbackRateSettings")}
            className="workbench-playback-rate-popover fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[90] origin-bottom rounded-xl bg-wb-panel p-3 text-xs text-wb-text shadow-2xl ring-1 ring-wb-line sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.45rem)] sm:w-[18rem] sm:origin-top-right"
            data-testid="v3-playback-rate-popover"
          >
            <div
              className="text-center font-mono text-sm font-semibold tabular-nums text-wb-text"
              aria-live="polite"
            >
              {formatWorkbenchPlaybackRateV3(rate.playbackRate)}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                disabled={rateChangeDisabled || rate.playbackRate <= WORKBENCH_MINIMUM_PLAYBACK_RATE_V3}
                aria-label={t("workbench.live.decreasePlaybackRate")}
                onClick={() => selectRate(
                  rate.playbackRate - WORKBENCH_PLAYBACK_RATE_STEP_V3,
                )}
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <input
                type="range"
                min={WORKBENCH_MINIMUM_PLAYBACK_RATE_V3}
                max={sliderMaximum}
                step={WORKBENCH_PLAYBACK_RATE_STEP_V3}
                value={Math.min(rate.playbackRate, sliderMaximum)}
                disabled={rateChangeDisabled}
                onChange={(event) => selectRate(
                  Number(event.currentTarget.value),
                )}
                aria-label={t("workbench.live.playbackRateSlider")}
                aria-valuetext={formatWorkbenchPlaybackRateV3(
                  rate.playbackRate,
                )}
                style={{
                  "--workbench-playback-rate-progress": `${sliderProgress}%`,
                } as React.CSSProperties}
                className="workbench-playback-rate-slider block min-w-0 flex-1 accent-wb-accent"
                data-testid="v3-playback-rate-slider"
              />
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                disabled={rateChangeDisabled || rate.playbackRate >= calibratedMaximum}
                aria-label={t("workbench.live.increasePlaybackRate")}
                onClick={() => selectRate(
                  rate.playbackRate + WORKBENCH_PLAYBACK_RATE_STEP_V3,
                )}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-5 gap-1">
              {presetRates.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={rateChangeDisabled || preset > calibratedMaximum + 1e-9}
                  aria-pressed={Math.abs(rate.playbackRate - preset) < 1e-9}
                  className="workbench-selection-button min-h-9 rounded-lg px-1 font-mono text-xs font-medium tabular-nums transition-[color,background-color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                  onClick={() => selectRate(preset)}
                >
                  {formatWorkbenchPlaybackRateV3(preset)}
                </button>
              ))}
            </div>

            {(rate.calibrating || rate.performanceLimited || calibratedMaximum < WORKBENCH_MAXIMUM_PLAYBACK_RATE_V3) && (
              <p className="mt-2 text-center text-[0.68rem] leading-4 text-wb-subtle">
                {rate.calibrating
                  ? t("workbench.live.measuringPlaybackCapacity")
                  : rate.performanceLimited
                    ? t("workbench.live.playbackPerformanceLimited")
                    : t("workbench.live.devicePlaybackLimit", {
                        rate: formatWorkbenchPlaybackRateV3(calibratedMaximum),
                      })}
              </p>
            )}
          </div>
        </>
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

export function workbenchPlaybackPresetRatesV3(): readonly number[] {
  return Object.freeze([0.25, 0.5, 1, 2, 5]);
}
