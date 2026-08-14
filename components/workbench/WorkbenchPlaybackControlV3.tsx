import React from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  WORKBENCH_MINIMUM_PLAYBACK_RATE_V3,
  type WorkbenchGroupPlaybackRateStateV3,
} from "@/components/workbench/v3/WorkbenchGroupTimeConductorV3";

const WORKBENCH_PLAYBACK_RATE_STEP_V3 = 0.05;
const WORKBENCH_PLAYBACK_RATE_DETENTS_V3 = Object.freeze([
  0.25,
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  2,
]);

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
  onRateChange(rate: number | "auto"): void;
}>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const sliderMaximum = Math.max(
    WORKBENCH_MINIMUM_PLAYBACK_RATE_V3,
    rate.safeMaximumRate,
  );
  const sliderProgress = sliderMaximum === WORKBENCH_MINIMUM_PLAYBACK_RATE_V3
    ? 100
    : (Math.min(rate.effectiveRate, sliderMaximum)
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
      className="workbench-playback-control relative inline-flex h-9 shrink-0 items-stretch rounded-xl border border-wb-line bg-wb-panel shadow-sm"
      data-testid="v3-playback-control"
    >
      <button
        type="button"
        className="inline-flex min-w-10 items-center justify-center rounded-l-[0.7rem] text-wb-text transition-[color,background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.96] disabled:cursor-wait disabled:opacity-45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        disabled={disabled}
        aria-label={
          playing ? t("workbench.live.pause") : t("workbench.live.play")
        }
        aria-pressed={playing}
        onClick={onPlaybackToggle}
        data-testid="v3-playback-toggle"
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>

      <span className="my-0.5 w-px bg-wb-line" aria-hidden="true" />

      <button
        type="button"
        className="inline-flex min-w-[4.65rem] items-center justify-center gap-1.5 rounded-r-[0.7rem] px-2.5 font-mono text-[0.78rem] font-semibold tabular-nums text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("workbench.live.playbackRate", {
          rate: formatWorkbenchPlaybackRateV3(rate.effectiveRate),
        })}
        onClick={() => setOpen((current) => !current)}
        data-testid="v3-playback-rate-trigger"
      >
        <span>{formatWorkbenchPlaybackRateV3(rate.effectiveRate)}</span>
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
          className="absolute right-0 top-[calc(100%+0.55rem)] z-[90] w-[17rem] origin-top-right rounded-2xl border border-wb-line bg-wb-panel/95 p-3.5 text-wb-text shadow-[0_16px_44px_rgba(2,12,27,0.22)] backdrop-blur-xl"
          data-testid="v3-playback-rate-popover"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[-0.006em]">
                {t("workbench.live.playbackRateTitle")}
              </p>
              <p className="mt-0.5 text-[0.68rem] leading-4 text-wb-subtle">
                {rate.warmingUp
                  ? t("workbench.live.measuringPlaybackCapacity")
                  : t("workbench.live.devicePlaybackLimit", {
                      rate: formatWorkbenchPlaybackRateV3(
                        rate.safeMaximumRate,
                      ),
                    })}
              </p>
            </div>
            <button
              type="button"
              className={`min-h-7 rounded-lg px-2 text-[0.68rem] font-semibold transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${
                rate.mode === "auto"
                  ? "bg-wb-active text-wb-text"
                  : "text-wb-muted hover:bg-wb-hover hover:text-wb-text"
              }`}
              aria-pressed={rate.mode === "auto"}
              onClick={() => onRateChange("auto")}
              data-testid="v3-playback-rate-auto"
            >
              {t("workbench.live.playbackRateAuto")}
            </button>
          </div>

          <div className="relative px-0.5 pb-1 pt-1">
            <input
              type="range"
              min={WORKBENCH_MINIMUM_PLAYBACK_RATE_V3}
              max={sliderMaximum}
              // The measured ceiling rarely falls on the 0.05× lattice. Let
              // the native control reach that exact endpoint, then apply our
              // own detent/step snapping in onChange.
              step="any"
              value={Math.min(rate.effectiveRate, sliderMaximum)}
              onChange={(event) => onRateChange(
                snapWorkbenchPlaybackRateV3(
                  Number(event.currentTarget.value),
                  sliderMaximum,
                ),
              )}
              aria-label={t("workbench.live.playbackRateSlider")}
              aria-valuetext={formatWorkbenchPlaybackRateV3(
                rate.effectiveRate,
              )}
              style={{
                "--workbench-playback-rate-progress": `${sliderProgress}%`,
              } as React.CSSProperties}
              className="workbench-playback-rate-slider block w-full accent-wb-accent"
              data-testid="v3-playback-rate-slider"
            />
            <div className="mt-1.5 flex justify-between font-mono text-[0.62rem] tabular-nums text-wb-subtle">
              <span>{formatWorkbenchPlaybackRateV3(
                WORKBENCH_MINIMUM_PLAYBACK_RATE_V3,
              )}</span>
              <span>{formatWorkbenchPlaybackRateV3(sliderMaximum)}</span>
            </div>
          </div>

          <div className="mt-2 flex min-h-6 items-center gap-1 overflow-hidden">
            {WORKBENCH_PLAYBACK_RATE_DETENTS_V3.filter(
              (candidate) => candidate <= sliderMaximum + 1e-9,
            ).map((candidate) => (
              <button
                key={candidate}
                type="button"
                className="min-h-6 flex-1 rounded-md px-1 font-mono text-[0.62rem] font-medium tabular-nums text-wb-subtle transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                onClick={() => onRateChange(candidate)}
              >
                {formatWorkbenchPlaybackRateV3(candidate)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function snapWorkbenchPlaybackRateV3(
  rate: number,
  safeMaximumRate: number,
): number {
  const clamped = Math.min(
    safeMaximumRate,
    Math.max(WORKBENCH_MINIMUM_PLAYBACK_RATE_V3, rate),
  );
  // The measured ceiling is itself a meaningful endpoint even when it falls
  // between the regular 0.05× slider steps (for example 0.47×).
  if (Math.abs(clamped - safeMaximumRate) <= 1e-9) {
    return Number(safeMaximumRate.toFixed(3));
  }
  const nearbyDetent = WORKBENCH_PLAYBACK_RATE_DETENTS_V3.find(
    (candidate) =>
      candidate <= safeMaximumRate + 1e-9
      && Math.abs(candidate - clamped) <= 0.035,
  );
  const snapped = nearbyDetent
    ?? Math.round(clamped / WORKBENCH_PLAYBACK_RATE_STEP_V3)
      * WORKBENCH_PLAYBACK_RATE_STEP_V3;
  return Number(Math.min(safeMaximumRate, snapped).toFixed(3));
}

export function formatWorkbenchPlaybackRateV3(rate: number): string {
  return `${rate.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
}
