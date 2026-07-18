import type { PanelDef, PanelType, WorkbenchZoneId } from "./types";

export function defaultZoneOf(type: PanelType): WorkbenchZoneId {
  switch (type) {
    case "CONTROLS":
    case "SCENARIOS":
      return "sideRail";
    case "METRICS":
      return "bottomPanel";
    case "NOTE":
      return "caseRail";
    case "PVLOOP":
    case "PV_RELATIONS":
    case "WAVEFORM":
    case "GUYTON_RIGHT":
    case "GUYTON_LEFT":
    case "GUYTON_3D":
      return "main";
  }
}

export function zoneOf(panel: PanelDef): WorkbenchZoneId {
  return panel.zone ?? defaultZoneOf(panel.type);
}
