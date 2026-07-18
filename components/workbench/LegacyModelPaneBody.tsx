import React from "react";

import { Controls } from "@/components/Controls";
import {
  GuytonPanel,
  MetricsPanel,
  PVLoopPanel,
  WaveformPanel,
  shouldEnableLegendInteractions,
} from "@/components/Charts";
import { effectiveGlobalConfig } from "@/features/workbench/p1aStructuralHosts";
import type { PanelDef } from "@/types";

import type { PaneBodyContext } from "./renderPaneBody";

/** Legacy-only model renderer, kept behind a lazy boundary. */
export default function LegacyModelPaneBody({
  panel,
  ctx,
}: Readonly<{ panel: PanelDef; ctx: PaneBodyContext }>) {
  if (panel.type === "PVLOOP") {
    return (
      <PVLoopPanel
        physicsRefs={ctx.physicsRefs}
        instances={ctx.instances}
        config={effectiveGlobalConfig(panel.config, ctx.instances)}
        showGuides={panel.showGuides}
        showLegend={panel.showLegend}
        pvDebugOverlay={panel.pvDebugOverlay}
        pvDebugTraceMode={panel.pvDebugTraceMode}
        activeInstanceId={ctx.activeInstanceId}
        panelId={panel.id}
        legendInteractive={shouldEnableLegendInteractions({
          canConfigure: ctx.canConfigure,
          presentationMode: ctx.presentationMode,
        })}
        onOpenSettings={ctx.onOpenSettings}
        legendPosition={ctx.legendPosition}
        onLegendPositionChange={ctx.onLegendPositionChange}
      />
    );
  }
  if (panel.type === "WAVEFORM") {
    return (
      <WaveformPanel
        physicsRefs={ctx.physicsRefs}
        instances={ctx.instances}
        timeWindow={panel.timeWindow || 10000}
        config={effectiveGlobalConfig(panel.config, ctx.instances)}
        showLegend={panel.showLegend}
        activeInstanceId={ctx.activeInstanceId}
        panelId={panel.id}
        legendInteractive={shouldEnableLegendInteractions({
          canConfigure: ctx.canConfigure,
          presentationMode: ctx.presentationMode,
        })}
        onOpenSettings={ctx.onOpenSettings}
        legendPosition={ctx.legendPosition}
        onLegendPositionChange={ctx.onLegendPositionChange}
      />
    );
  }
  if (panel.type === "METRICS") {
    return (
      <MetricsPanel
        physicsRefs={ctx.physicsRefs}
        instances={ctx.instances}
        config={effectiveGlobalConfig(panel.config, ctx.instances)}
      />
    );
  }
  if (
    panel.type === "CONTROLS"
    && ctx.updateInstanceParams
    && ctx.updateInstanceKnobs
    && ctx.updateInstanceVolume
  ) {
    return (
      <Controls
        isPaneMode
        paneConfig={panel.config}
        instances={ctx.instances}
        instanceHealth={ctx.instanceHealth}
        activeInstanceId={ctx.activeInstanceId ?? ""}
        updateInstanceParams={ctx.updateInstanceParams}
        updateInstanceKnobs={ctx.updateInstanceKnobs}
        updateInstanceVolume={ctx.updateInstanceVolume}
        presentationMode={ctx.presentationMode}
        controllerItems={panel.view?.kind === "control"
          ? panel.view.controllerItems
          : undefined}
      />
    );
  }
  if (panel.type === "GUYTON_RIGHT" || panel.type === "GUYTON_LEFT") {
    return (
      <GuytonPanel
        physicsRefs={ctx.physicsRefs}
        instances={ctx.instances}
        config={effectiveGlobalConfig(panel.config, ctx.instances)}
        type={panel.type}
      />
    );
  }
  return null;
}
