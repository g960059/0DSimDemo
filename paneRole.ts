import type { PanelRole, PanelType } from "./types";

export function roleOf(type: PanelType): PanelRole {
  switch (type) {
    case "METRICS":
      return "output";
    case "SCENARIOS":
    case "CONTROLS":
      return "control";
    case "NOTE":
      return "note";
    case "PVLOOP":
    case "PV_RELATIONS":
    case "WAVEFORM":
    case "GUYTON_RIGHT":
    case "GUYTON_LEFT":
    case "GUYTON_3D":
      return "graph";
  }
}
