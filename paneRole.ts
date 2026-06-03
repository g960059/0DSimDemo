import type { PanelRole, PanelType } from "./types";

export function roleOf(type: PanelType): PanelRole {
  switch (type) {
    case "METRICS":
      return "output";
    case "CONTROLS":
      return "control";
    case "SCENARIOS":
      return "scenario";
    case "NOTE":
      return "note";
    case "PVLOOP":
    case "WAVEFORM":
    case "GUYTON_RIGHT":
    case "GUYTON_LEFT":
    case "GUYTON_3D":
      return "graph";
  }
}
