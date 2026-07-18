import type React from "react";

import type { AuthoredViewSpec } from "@/features/workbench/authoredViews";
import type { PanelDef, SimInstance } from "@/types";

/**
 * Presentation seam between the Workbench shell and a simulation runtime.
 *
 * The shell owns panes, Dockview placement, notes and authored-view identity.
 * A runtime renderer owns scientific values and controls. Returning undefined
 * deliberately delegates to the legacy renderer; scientific product routes
 * therefore return an explicit node for every model-bearing view.
 */
export type WorkbenchRuntimeRenderContext = Readonly<{
  instances: readonly SimInstance[];
  activeInstanceId?: string;
  presentationMode: "studio" | "reading";
}>;

export type WorkbenchRuntimeRenderer = Readonly<{
  runtimeId: string;
  renderPanel: (
    panel: PanelDef,
    context: WorkbenchRuntimeRenderContext,
  ) => React.ReactNode | undefined;
  renderAuthoredView: (
    view: AuthoredViewSpec,
    context: WorkbenchRuntimeRenderContext,
  ) => React.ReactNode | undefined;
}>;
