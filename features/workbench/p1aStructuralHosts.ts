import type { MetricType, PanelDef, PanelInstanceConfig, PanelType, SimInstance, WorkbenchWorkspace } from "@/types";
import { effectiveVisibility, type ViewMembership } from "@/features/workbench/viewSpec";

const GRAPH_PANEL_TYPES = new Set<PanelType>(["PVLOOP", "WAVEFORM", "GUYTON_RIGHT", "GUYTON_LEFT", "GUYTON_3D"]);

export type BuiltInMetricsCategoryId = "pressure" | "flowVolume" | "function" | "coronary";

export type BuiltInMetricsTab = { kind: "builtIn"; id: BuiltInMetricsCategoryId; titleKey: string; metrics: MetricType[] };
export type AuthoredMetricsTab = { kind: "authored"; id: string; title: string; panel: PanelDef };
export type MetricsHostTab = BuiltInMetricsTab | AuthoredMetricsTab;

const BUILT_IN_METRIC_CATEGORIES: Array<{
  id: BuiltInMetricsCategoryId;
  titleKey: string;
  metrics: MetricType[];
}> = [
  { id: "pressure", titleKey: "workbench.panelGrid.metricsTabs.pressure", metrics: ["ABP", "CVP", "PAP", "PCWP"] },
  { id: "flowVolume", titleKey: "workbench.panelGrid.metricsTabs.flowVolume", metrics: ["SV", "CO"] },
  { id: "function", titleKey: "workbench.panelGrid.metricsTabs.function", metrics: ["LVEF", "RVEF"] },
  {
    id: "coronary",
    titleKey: "workbench.panelGrid.metricsTabs.coronary",
    metrics: ["COR", "COR_PCT", "LAD_DF", "LCx_DF", "RCA_DF", "FFR_LAD", "FFR_LCx", "FFR_RCA", "COR_SDI_L", "COR_SDI_R"],
  },
];

export function isGraphPanel(panel: PanelDef): boolean {
  return GRAPH_PANEL_TYPES.has(panel.type);
}

export function graphPanelsOnly(panels: readonly PanelDef[]): PanelDef[] {
  return panels.filter(isGraphPanel);
}

export function firstPanelOfType(panels: readonly PanelDef[], type: PanelType): PanelDef | undefined {
  return panels.find((panel) => panel.type === type);
}

export function deriveBuiltInMetricsTabs(metrics: readonly MetricType[]): BuiltInMetricsTab[] {
  const available = new Set(metrics);
  return BUILT_IN_METRIC_CATEGORIES
    .map((category) => ({
      kind: "builtIn" as const,
      id: category.id,
      titleKey: category.titleKey,
      metrics: category.metrics.filter((metric) => available.has(metric)),
    }))
    .filter((tab) => tab.metrics.length > 0);
}

export function authoredMetricsTabsFromPanels(panels: readonly PanelDef[]): MetricsHostTab[] {
  return panels
    .filter((panel) => panel.type === "METRICS")
    .map((panel) => ({ kind: "authored" as const, id: panel.id, title: panel.title, panel }));
}

export function metricsHostTabs(metrics: readonly MetricType[], panels: readonly PanelDef[]): MetricsHostTab[] {
  return [
    ...deriveBuiltInMetricsTabs(metrics),
    ...authoredMetricsTabsFromPanels(panels),
  ];
}

export function effectiveGlobalConfig(
  config: Record<string, PanelInstanceConfig>,
  instances: readonly SimInstance[],
): Record<string, PanelInstanceConfig> {
  const membership: ViewMembership = Object.fromEntries(
    Object.entries(config)
      .filter(([, instanceConfig]) => instanceConfig.visible)
      .map(([instanceId, instanceConfig]) => [instanceId, instanceConfig.selectedSignals]),
  );
  const globallyVisibleIds = instances
    .filter((instance) => instance.isVisible !== false)
    .map((instance) => instance.id);
  const visibleMembership = effectiveVisibility(membership, globallyVisibleIds);

  return Object.fromEntries(
    Object.entries(config).map(([instanceId, instanceConfig]) => [
      instanceId,
      {
        ...instanceConfig,
        visible: Boolean(visibleMembership[instanceId]),
      },
    ]),
  );
}

export function builtInMetricsConfig(
  instances: readonly SimInstance[],
  metrics: readonly MetricType[],
): Record<string, PanelInstanceConfig> {
  return Object.fromEntries(
    instances.map((instance) => [
      instance.id,
      {
        visible: instance.isVisible !== false,
        selectedSignals: [...metrics],
      },
    ]),
  );
}

export function noteOpenFromWorkspace(workspace?: WorkbenchWorkspace): boolean {
  return workspace?.regions.note?.visible === true || workspace?.regions.note?.visible === "compact";
}

export function metricsOpenFromWorkspace(workspace?: WorkbenchWorkspace): boolean {
  const visible = workspace?.regions.output?.visible;
  return visible === undefined ? true : visible === true || visible === "compact";
}

export function mainDockviewViewStatesOnly(workspace: WorkbenchWorkspace): WorkbenchWorkspace {
  const main = workspace.viewStates?.main ?? workspace.viewState;
  const { viewStates: _viewStates, ...withoutViewStates } = workspace;
  const { viewState: _viewState, ...withoutLegacyViewState } = withoutViewStates;
  return main ? { ...withoutLegacyViewState, viewStates: { main } } : withoutLegacyViewState;
}
