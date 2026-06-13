import type { PanelDef, PanelInstanceConfig, PanelType } from "./types";
import { roleOf } from "./paneRole";

export const GRID_COLUMNS = 12;

function pane(
  id: string,
  type: PanelType,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
  config: Record<string, PanelInstanceConfig> = {},
  extras: Partial<PanelDef> = {},
): PanelDef {
  return {
    id,
    type,
    title,
    role: roleOf(type),
    x,
    y,
    w,
    h,
    config,
    isSettingsOpen: false,
    ...extras,
  };
}

function isPlaced(panel: PanelDef): panel is PanelDef & { x: number; y: number } {
  return Number.isInteger(panel.x) && Number.isInteger(panel.y) && (panel.x ?? 0) >= 0 && (panel.y ?? 0) >= 0;
}

function cloneWithRole(panel: PanelDef): PanelDef {
  return {
    ...panel,
    role: panel.role ?? roleOf(panel.type),
    config: { ...panel.config },
  };
}

function mark(occupied: Set<string>, panel: PanelDef & { x: number; y: number }) {
  const w = Math.min(Math.max(1, panel.w), GRID_COLUMNS);
  const h = Math.max(1, panel.h);
  for (let yy = panel.y; yy < panel.y + h; yy++) {
    for (let xx = panel.x; xx < panel.x + w; xx++) {
      occupied.add(`${xx},${yy}`);
    }
  }
}

function fits(occupied: Set<string>, x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || y < 0 || x + w > GRID_COLUMNS) return false;
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (occupied.has(`${xx},${yy}`)) return false;
    }
  }
  return true;
}

function firstOpenSlot(occupied: Set<string>, panel: PanelDef): { x: number; y: number } {
  const w = Math.min(Math.max(1, panel.w), GRID_COLUMNS);
  const h = Math.max(1, panel.h);
  for (let y = 0; y < 1000; y++) {
    for (let x = 0; x <= GRID_COLUMNS - w; x++) {
      if (fits(occupied, x, y, w, h)) return { x, y };
    }
  }
  throw new Error("Unable to flow-pack panels into grid.");
}

export function flowPack(panels: PanelDef[]): PanelDef[] {
  const occupied = new Set<string>();
  return panels.map((input) => {
    const panel = cloneWithRole(input);
    const w = Math.min(Math.max(1, panel.w), GRID_COLUMNS);
    const placedCandidate = isPlaced(panel)
      ? {
          ...panel,
          x: Math.min(Math.max(0, panel.x), GRID_COLUMNS - w),
          y: Math.max(0, panel.y),
        }
      : undefined;
    const placed = placedCandidate && fits(occupied, placedCandidate.x, placedCandidate.y, w, Math.max(1, panel.h))
      ? placedCandidate
      : { ...panel, ...firstOpenSlot(occupied, panel) };
    mark(occupied, placed);
    return placed;
  });
}

export const READ_PRESET: PanelDef[] = flowPack([
  pane("read-note", "NOTE", "Notes", 0, 0, 4, 12),
  pane("read-waveform", "WAVEFORM", "Waveforms", 4, 0, 5, 7, {}, { timeWindow: 5000 }),
  pane("read-output", "METRICS", "Output", 9, 0, 3, 4),
  pane("read-pv", "PVLOOP", "PV Loop", 4, 7, 5, 5, {}, { showGuides: true }),
  pane("read-controls", "CONTROLS", "Controls", 9, 4, 3, 8),
]);
