import { normalizeControllerItems } from "@/controllerItems";
import type { ControllerItem, MetricType, PanelDef, PanelInstanceConfig, SimInstance } from "@/types";
import { migratePanelsToViewSpecs, normalizeMembership, type ControllerViewSpec, type MetricsViewSpec, type ViewMembership, type ViewSpec } from "@/features/workbench/viewSpec";

export type AuthoredViewSpec = ControllerViewSpec | MetricsViewSpec;

export const BUILT_IN_INSPECTOR_VIEW_ID = "builtin-inspector";

const BUILT_IN_METRICS_SIGNATURES = new Set([
  "ABP|CVP|PAP|PCWP",
  "CO|SV",
  "LVEF|RVEF",
  "COR|COR_PCT|COR_SDI_L|COR_SDI_R|FFR_LAD|FFR_LCx|FFR_RCA|LAD_DF|LCx_DF|RCA_DF",
]);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function titleOrFallback(title: string | undefined, fallback: string): string {
  const trimmed = title?.trim();
  return trimmed ? trimmed : fallback;
}

function metricSignature(metrics: readonly string[]): string {
  return [...new Set(metrics)].sort().join("|");
}

function metricsFromMembership(membership: ViewMembership): MetricType[] {
  return [...new Set(Object.values(membership).flat())] as MetricType[];
}

function isBuiltInMetricsPanel(view: MetricsViewSpec): boolean {
  return BUILT_IN_METRICS_SIGNATURES.has(metricSignature(view.metrics.length > 0 ? view.metrics : metricsFromMembership(view.membership)));
}

export function authoredViewsOnly(views: readonly ViewSpec[] | undefined): AuthoredViewSpec[] {
  return (views ?? [])
    .filter((view): view is AuthoredViewSpec => view.kind === "controller" || view.kind === "metrics")
    .map((view) => clone(view));
}

export function controllerViews(views: readonly AuthoredViewSpec[]): ControllerViewSpec[] {
  return views.filter((view): view is ControllerViewSpec => view.kind === "controller");
}

export function metricsViews(views: readonly AuthoredViewSpec[]): MetricsViewSpec[] {
  return views.filter((view): view is MetricsViewSpec => view.kind === "metrics");
}

export function createControllerViewSpec(id: string, title: string, items: ControllerItem[] = []): ControllerViewSpec {
  return {
    id,
    title: titleOrFallback(title, "Controller view"),
    kind: "controller",
    items: normalizeControllerItems(items).items,
    binding: { slot: "active" },
  };
}

export function createMetricsViewSpec(
  id: string,
  title: string,
  metrics: MetricType[] = [],
  instances: readonly SimInstance[] = [],
  membership?: ViewMembership,
): MetricsViewSpec {
  const uniqueMetrics = [...new Set(metrics)] as MetricType[];
  return {
    id,
    title: titleOrFallback(title, "Metrics view"),
    kind: "metrics",
    metrics: uniqueMetrics,
    membership: metricsMembershipForInstances(uniqueMetrics, instances, membership),
  };
}

export function duplicateAuthoredView(view: AuthoredViewSpec, id: string, title: string): AuthoredViewSpec {
  return {
    ...clone(view),
    id,
    title: titleOrFallback(title, view.kind === "controller" ? "Controller view copy" : "Metrics view copy"),
  };
}

export function upsertAuthoredView(views: readonly AuthoredViewSpec[], nextView: AuthoredViewSpec): AuthoredViewSpec[] {
  const normalized = nextView.kind === "controller"
    ? { ...nextView, items: normalizeControllerItems(nextView.items).items }
    : { ...nextView, metrics: [...new Set(nextView.metrics)] as MetricType[], membership: normalizeMembership(nextView.membership) };
  const index = views.findIndex((view) => view.id === nextView.id);
  if (index < 0) return [...views, normalized];
  return views.map((view, viewIndex) => viewIndex === index ? normalized : view);
}

export function deleteAuthoredView(views: readonly AuthoredViewSpec[], id: string): AuthoredViewSpec[] {
  return views.filter((view) => view.id !== id);
}

export function metricsMembershipForInstances(
  metrics: readonly MetricType[],
  instances: readonly SimInstance[],
  existing?: ViewMembership,
): ViewMembership {
  const selectedSignals = [...new Set(metrics)] as string[];
  if (selectedSignals.length === 0) return {};

  const existingIds = new Set(Object.keys(existing ?? {}));
  const ids = existingIds.size > 0
    ? [...existingIds]
    : instances.map((instance) => instance.id);

  return normalizeMembership(Object.fromEntries(ids.map((id) => [id, selectedSignals])));
}

export function metricsViewConfig(
  view: MetricsViewSpec,
  instances: readonly SimInstance[],
): Record<string, PanelInstanceConfig> {
  const membership = Object.keys(view.membership).length > 0
    ? view.membership
    : metricsMembershipForInstances(view.metrics, instances);
  return Object.fromEntries(
    instances.map((instance) => [
      instance.id,
      {
        visible: Boolean(membership[instance.id]),
        selectedSignals: [...(membership[instance.id] ?? [])],
      },
    ]),
  );
}

export function migrateLegacyPanelsToAuthoredViews(
  panels: readonly PanelDef[],
  existingViews: readonly AuthoredViewSpec[],
): AuthoredViewSpec[] {
  const existingKeys = new Set(existingViews.map((view) => `${view.kind}:${view.id}`));
  return migratePanelsToViewSpecs([...panels]).views
    .filter((view): view is AuthoredViewSpec => view.kind === "controller" || view.kind === "metrics")
    .filter((view) => {
      if (existingKeys.has(`${view.kind}:${view.id}`)) return false;
      if (view.kind === "controller") return view.items.length > 0;
      return view.metrics.length > 0 && !isBuiltInMetricsPanel(view);
    })
    .map((view) => view.kind === "controller"
      ? createControllerViewSpec(view.id, view.title ?? "Controller view", view.items)
      : { ...view, membership: normalizeMembership(view.membership) });
}

export function authoredViewsForLoad(
  views: readonly ViewSpec[] | undefined,
  panels: readonly PanelDef[],
): AuthoredViewSpec[] {
  const authored = authoredViewsOnly(views);
  return [
    ...authored,
    ...migrateLegacyPanelsToAuthoredViews(panels, authored),
  ];
}

export function serializableAuthoredViews(views: readonly ViewSpec[] | readonly AuthoredViewSpec[] | undefined): AuthoredViewSpec[] | undefined {
  const authored = authoredViewsOnly(views);
  return authored.length > 0 ? authored : undefined;
}
