import * as React from "react";
import { Check } from "lucide-react";

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

export type StudioBriefingPickBoxV1Props = Readonly<{
  label: string;
  picked: boolean;
  kind: "graph" | "control" | "signal" | "metric";
  pickKey: string;
  /**
   * `corner` floats the box in a pane's top-right, which is the one corner no
   * pane chrome claims — the PV-relation quality notice sits top-left and the
   * evidence caption bottom-left. Everything else places the box in the
   * element's own flow. Either way the box is the only pointer target the
   * layer adds, so sliders, legends and pane menus keep working while compose
   * is open.
   */
  placement?: "inline" | "corner";
  size?: "sm" | "md";
  onToggle(): void;
}>;

/**
 * A real checkbox beside the element it selects.
 *
 * Nothing is laid over live content: an overlay would swallow the drags and
 * menus the Workbench exists for. Picked state is carried by a filled accent
 * box, never by a wash over a canvas, because tinting a trace changes how the
 * data reads.
 */
export function StudioBriefingPickBoxV1({
  label,
  picked,
  kind,
  pickKey,
  placement = "inline",
  size = "md",
  onToggle,
}: StudioBriefingPickBoxV1Props) {
  const box = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={picked}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      data-testid="scientific-briefing-pick-box-v1"
      data-briefing-pick-kind={kind}
      data-briefing-pick-key={pickKey}
      data-briefing-picked={String(picked)}
      className={`${
        placement === "corner"
          ? "absolute right-1.5 top-1.5 z-30"
          : "relative shrink-0"
      } inline-flex items-center justify-center rounded-[4px] p-[3px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wb-pick)]`}
    >
      <span
        aria-hidden="true"
        className={`${box} inline-flex items-center justify-center rounded-[3px] border transition-colors ${
          picked
            ? "border-[var(--wb-pick)] bg-[var(--wb-pick)] text-white"
            : "border-dashed border-[var(--wb-pick-idle)] bg-transparent hover:border-[var(--wb-pick)] hover:bg-[var(--wb-pick-soft)]"
        }`}
      >
        {picked && <Check className={size === "sm" ? "h-2 w-2" : "h-3 w-3"} />}
      </span>
    </button>
  );
}

/** The leading accent bar that marks a picked element at any size. */
export function studioBriefingPickedEdgeClassV1(
  picked: boolean,
  edge: "left" | "top" = "left",
): string {
  if (!picked) return "";
  return edge === "left"
    ? "shadow-[inset_3px_0_0_0_var(--wb-pick)]"
    : "shadow-[inset_0_3px_0_0_var(--wb-pick)]";
}
