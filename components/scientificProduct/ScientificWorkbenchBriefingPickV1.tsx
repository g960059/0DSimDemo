import * as React from "react";
import { Check, Plus } from "lucide-react";

/**
 * Picking a presentation element directly on the Workbench.
 *
 * Compose treats the Workbench as its palette, so the affordance belongs on
 * the thing being chosen rather than in a parallel list. The layer is inert
 * unless compose is open, which is what keeps the clinical surface clean.
 */
export type StudioBriefingPickApiV1 = Readonly<{
  isGraphPinned(paneId: string): boolean;
  toggleGraph(panelId: string, paneId: string): void;
  isControlPinned(parameterKey: string): boolean;
  toggleControl(parameterKey: string): void;
  /** An instantaneous readback, named by the waveform signal it reads. */
  isSignalPinned(signalId: string): boolean;
  toggleSignal(signalId: string, label: string, unit: string): void;
  /** A per-beat metric, named by its metric id. */
  isBeatMetricPinned(metricId: string): boolean;
  toggleBeatMetric(metricId: string, label: string, unit: string): void;
}>;

const StudioBriefingPickContextV1 =
  React.createContext<StudioBriefingPickApiV1 | null>(null);

export function StudioBriefingPickProviderV1({
  value,
  children,
}: Readonly<{
  value: StudioBriefingPickApiV1 | null;
  children: React.ReactNode;
}>) {
  return (
    <StudioBriefingPickContextV1.Provider value={value}>
      {children}
    </StudioBriefingPickContextV1.Provider>
  );
}

export function useStudioBriefingPickV1(): StudioBriefingPickApiV1 | null {
  return React.useContext(StudioBriefingPickContextV1);
}

export type StudioBriefingPickOverlayV1Props = Readonly<{
  label: string;
  picked: boolean;
  kind: "graph" | "control" | "signal" | "metric";
  pickKey: string;
  /** Inline elements carry the badge alone; there is no room for a wash. */
  compact?: boolean;
  onToggle(): void;
}>;

/**
 * A full-area toggle laid over the element it selects.
 *
 * Picked elements keep a faint white wash so the chosen set is legible at a
 * glance without moving anything, and the element underneath stays readable.
 */
export function StudioBriefingPickOverlayV1({
  label,
  picked,
  kind,
  pickKey,
  compact = false,
  onToggle,
}: StudioBriefingPickOverlayV1Props) {
  return (
    <button
      type="button"
      aria-pressed={picked}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      data-testid="scientific-briefing-pick-overlay-v1"
      data-briefing-pick-kind={kind}
      data-briefing-pick-key={pickKey}
      data-briefing-picked={String(picked)}
      className={compact
        ? `absolute inset-0 z-20 rounded transition-colors ${
          picked
            ? "bg-white/[0.14] hover:bg-white/[0.18]"
            : "bg-transparent hover:bg-white/[0.07]"
        }`
        : `absolute inset-0 z-20 flex items-start justify-end p-1.5 transition-colors ${
          picked
            ? "bg-white/[0.09] hover:bg-white/[0.13]"
            : "bg-transparent hover:bg-white/[0.05]"
        }`}
    >
      {/* The element already names itself; the badge only carries state. */}
      {!compact && <span
        aria-hidden="true"
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-opacity ${
          picked
            ? "bg-white/20 text-wb-text"
            : "bg-white/10 text-wb-text opacity-0 group-hover/pick:opacity-100"
        }`}
      >
        {picked ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      </span>}
    </button>
  );
}
