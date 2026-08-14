import React from "react";
import { ChevronDown, Minus, Pause, Play, Plus } from "lucide-react";
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
  const presetRates = workbenchPlaybackPresetRatesV3(calibratedMaximum);
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
      className="workbench-playback-control relative inline-flex h-9 shrink-0 items-stretch text-wb-muted"
      data-testid="v3-playback-control"
    >
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] disabled:cursor-wait disabled:opacity-45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
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

      <span className="my-2 w-px bg-wb-line" aria-hidden="true" />

      <button
        type="button"
        className="inline-flex h-9 min-w-[3.65rem] items-center justify-center gap-1 rounded-lg px-1.5 font-mono text-[0.78rem] font-semibold tabular-nums text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:min-w-[4.25rem] sm:px-2"
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
        <>
          <div
            className="fixed inset-0 z-[89] bg-black/30 sm:hidden"
            aria-hidden="true"
            data-testid="v3-playback-rate-backdrop"
            onPointerDown={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={t("workbench.live.playbackRateSettings")}
            className="workbench-playback-rate-popover fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[90] origin-bottom rounded-2xl border border-wb-line bg-wb-panel/95 p-4 text-wb-text shadow-[0_16px_44px_rgba(2,12,27,0.22)] backdrop-blur-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.55rem)] sm:w-[18rem] sm:origin-top-right"
            data-testid="v3-playback-rate-popover"
          >
            <div
              className="text-center font-mono text-2xl font-semibold tabular-nums tracking-[-0.03em] text-wb-text"
              aria-live="polite"
            >
              {formatWorkbenchPlaybackRateV3(rate.playbackRate)}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wb-soft text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                disabled={rateChangeDisabled || rate.playbackRate <= WORKBENCH_MINIMUM_PLAYBACK_RATE_V3}
                aria-label={t("workbench.live.decreasePlaybackRate")}
                onClick={() => selectRate(
                  rate.playbackRate - WORKBENCH_PLAYBACK_RATE_STEP_V3,
                )}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
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
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wb-soft text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                disabled={rateChangeDisabled || rate.playbackRate >= calibratedMaximum}
                aria-label={t("workbench.live.increasePlaybackRate")}
                onClick={() => selectRate(
                  rate.playbackRate + WORKBENCH_PLAYBACK_RATE_STEP_V3,
                )}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {presetRates.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={rateChangeDisabled}
                  className={`min-h-10 rounded-full px-1 font-mono text-[0.72rem] font-semibold tabular-nums transition-[color,background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${
                    Math.abs(rate.playbackRate - preset) < 1e-9
                      ? "bg-wb-active text-wb-text"
                      : "bg-wb-soft text-wb-muted hover:bg-wb-hover hover:text-wb-text"
                  }`}
                  onClick={() => selectRate(preset)}
                >
                  {formatWorkbenchPlaybackRateV3(preset)}
                </button>
              ))}
            </div>

            {(rate.calibrating || rate.performanceLimited || calibratedMaximum < WORKBENCH_MAXIMUM_PLAYBACK_RATE_V3) && (
              <p className="mt-3 text-center text-[0.68rem] leading-4 text-wb-subtle">
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

export function workbenchPlaybackPresetRatesV3(
  maximumRate: number,
): readonly number[] {
  const candidates = maximumRate <= 1
    ? [0.25, 0.5, 0.75, 1]
    : [1, 1.25, 1.5, 2, 3];
  const retained = candidates.filter((candidate) =>
    candidate <= maximumRate + 1e-9
  );
  if (!retained.some((candidate) =>
    Math.abs(candidate - maximumRate) < 1e-9
  )) retained.push(maximumRate);
  return Object.freeze(retained.sort((left, right) => left - right));
}
