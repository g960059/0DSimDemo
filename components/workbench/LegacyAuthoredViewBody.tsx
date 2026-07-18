import React from "react";

import {
  GuytonPanel,
  MetricsPanel,
  PVLoopPanel,
  WaveformPanel,
} from "@/components/Charts";
import { Controls } from "@/components/Controls";
import {
  metricsViewConfig,
  type AuthoredViewSpec,
} from "@/features/workbench/authoredViews";
import { resolveControllerTargetId } from "@/features/workbench/controllerBinding";
import { effectiveGlobalConfig } from "@/features/workbench/p1aStructuralHosts";
import type { PanelInstanceConfig } from "@/types";

import type { AuthoredViewRuntime } from "./AuthoredViewEmbed";

/**
 * Legacy renderer kept behind a dynamic import so the scientific product route
 * does not pull the legacy ModelCore presentation stack into its static graph.
 */
export default function LegacyAuthoredViewBody({
  view,
  runtime,
}: Readonly<{
  view: AuthoredViewSpec;
  runtime: AuthoredViewRuntime;
}>) {
  const instances = runtime.instances ?? [];
  const physicsRefs = runtime.physicsRefs;
  const activeInstanceId = runtime.activeScenarioId
    ?? runtime.activeInstanceId
    ?? instances[0]?.id
    ?? "";

  if (view.kind === "controller") {
    if (
      !runtime.updateInstanceParams
      || !runtime.updateInstanceKnobs
      || !runtime.updateInstanceVolume
    ) return null;
    const targetId = resolveControllerTargetId(
      view.binding,
      activeInstanceId,
      instances,
    );
    return (
      <Controls
        isPaneMode
        paneConfig={targetId
          ? { [targetId]: { visible: true, selectedSignals: ["clinical"] } }
          : {}}
        instances={instances.map((instance) => (
          instance.id === targetId ? { ...instance, isVisible: true } : instance
        ))}
        instanceHealth={runtime.instanceHealth}
        activeInstanceId={targetId}
        updateInstanceParams={runtime.updateInstanceParams}
        updateInstanceKnobs={runtime.updateInstanceKnobs}
        updateInstanceVolume={runtime.updateInstanceVolume}
        presentationMode={runtime.presentationMode}
        controllerItems={view.items}
      />
    );
  }

  if (!physicsRefs) return null;
  if (view.kind === "metrics") {
    return (
      <MetricsPanel
        physicsRefs={physicsRefs}
        instances={instances}
        config={effectiveGlobalConfig(metricsViewConfig(view, instances), instances)}
      />
    );
  }

  const config = effectiveGlobalConfig(
    graphMembershipConfig(view.membership, instances.map(({ id }) => id)),
    instances,
  );
  if (view.graphType === "pvloop") {
    return (
      <PVLoopPanel
        physicsRefs={physicsRefs}
        instances={instances}
        config={config}
        showGuides={view.presentation?.showGuides}
        showLegend={view.presentation?.showLegend}
        legendPosition={view.presentation?.legendPosition}
        pvDebugOverlay={view.presentation?.pvDebugOverlay}
        pvDebugTraceMode={view.presentation?.pvDebugTraceMode}
        activeInstanceId={activeInstanceId}
        panelId={view.id}
      />
    );
  }
  if (view.graphType === "waveform") {
    return (
      <WaveformPanel
        physicsRefs={physicsRefs}
        instances={instances}
        timeWindow={view.presentation?.timeWindow ?? 10_000}
        config={config}
        showLegend={view.presentation?.showLegend}
        legendPosition={view.presentation?.legendPosition}
        activeInstanceId={activeInstanceId}
        panelId={view.id}
      />
    );
  }
  if (view.graphType === "guyton-right" || view.graphType === "guyton-left") {
    return (
      <GuytonPanel
        physicsRefs={physicsRefs}
        instances={instances}
        config={config}
        type={view.graphType === "guyton-right" ? "GUYTON_RIGHT" : "GUYTON_LEFT"}
      />
    );
  }
  return null;
}

function graphMembershipConfig(
  membership: Readonly<Record<string, readonly string[]>>,
  instanceIds: readonly string[],
): Record<string, PanelInstanceConfig> {
  return Object.fromEntries(instanceIds.map((id) => [
    id,
    {
      visible: Boolean(membership[id]),
      selectedSignals: [...(membership[id] ?? [])],
    },
  ]));
}
