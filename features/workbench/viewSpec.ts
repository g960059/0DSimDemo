import type { ControllerItem, LegendPosition, MetricType, PanelDef, PanelInstanceConfig, PvLoopDebugTraceMode, PvLoopHistoryMode, WorkbenchWorkspace } from "@/types";

export type ScenarioBinding = { kind: "active" } | { kind: "scenario"; scenarioId: string };

export type GraphViewType = "pvloop" | "pv-relations" | "waveform" | "guyton-right" | "guyton-left" | "guyton-3d";

export type ViewMembership = Record<string, string[]>;

export interface ViewSpecBase {
  id: string;
  title?: string;
}

export interface GraphViewSpec extends ViewSpecBase {
  kind: "graph";
  graphType: GraphViewType;
  membership: ViewMembership;
  aspect?: { ratio: number; fit: "lock" | "prefer" };
  presentation?: {
    showGuides?: boolean;
    timeWindow?: number;
    showLegend?: boolean;
    legendPosition?: LegendPosition;
    pvDebugOverlay?: boolean;
    pvDebugTraceMode?: PvLoopDebugTraceMode;
    pvHistoryBeats?: number;
    pvHistoryMode?: PvLoopHistoryMode;
  };
}

export interface ControllerViewSpec extends ViewSpecBase {
  kind: "controller";
  items: ControllerItem[];
  binding: ScenarioBinding;
}

export interface MetricsViewSpec extends ViewSpecBase {
  kind: "metrics";
  metrics: MetricType[];
  membership: ViewMembership;
}

export type ViewSpec = GraphViewSpec | ControllerViewSpec | MetricsViewSpec;

export type GraphBoardLayout =
  | { type: "leaf"; graphViewId: string }
  | { type: "split"; direction: "row" | "column"; children: GraphBoardLayout[]; sizes: number[] };

/** Non-canonical UI arrangement. It may be stored locally but is not the case source of truth. */
export interface WorkspaceViewState {
  activeGraphViewId?: string;
  activeControllerViewId?: string;
  activeMetricsViewId?: string;
  noteOpen?: boolean;
  metricsOpen?: boolean;
  scrollPositions?: Record<string, number>;
}

/** Runtime-only state. It is free to change in read-only presentations and is not canonical document structure. */
export interface RuntimeState {
  activeScenarioId: string;
  globalVisibility: Record<string, boolean>;
  knobValues?: Record<string, Record<string, number>>;
  transientEdits?: Record<string, unknown>;
}

export type GlobalVisibility = Record<string, boolean> | ReadonlySet<string> | readonly string[];

export type GraphBoardValidationOptions = {
  graphViewIds?: Iterable<string>;
};

export type GraphBoardNormalizationResult = {
  layout?: GraphBoardLayout;
  errors: string[];
};

function graphTypeForPanel(panel: PanelDef): GraphViewType | undefined {
  switch (panel.type) {
    case "PVLOOP":
      return "pvloop";
    case "PV_RELATIONS":
      return "pv-relations";
    case "WAVEFORM":
      return "waveform";
    case "GUYTON_RIGHT":
      return "guyton-right";
    case "GUYTON_LEFT":
      return "guyton-left";
    case "GUYTON_3D":
      return "guyton-3d";
    default:
      return undefined;
  }
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

export function normalizeMembership(membership: ViewMembership): ViewMembership {
  return Object.fromEntries(
    Object.entries(membership)
      .map(([scenarioId, itemIds]) => [scenarioId, unique(itemIds)] as const)
      .filter(([, itemIds]) => itemIds.length > 0),
  );
}

function membershipFromPanelConfig(config: Record<string, PanelInstanceConfig>): ViewMembership {
  return normalizeMembership(
    Object.fromEntries(
      Object.entries(config)
        .filter(([, instanceConfig]) => instanceConfig.visible)
        .map(([scenarioId, instanceConfig]) => [scenarioId, instanceConfig.selectedSignals]),
    ),
  );
}

function itemsFromMembership(membership: ViewMembership): string[] {
  return unique(Object.values(membership).flat());
}

function globallyVisible(globalVisibility: GlobalVisibility, scenarioId: string): boolean {
  if (Array.isArray(globalVisibility)) return globalVisibility.includes(scenarioId);
  if (globalVisibility instanceof Set) return globalVisibility.has(scenarioId);
  return globalVisibility[scenarioId] === true;
}

export function effectiveVisibility(membership: ViewMembership, globalVisibility: GlobalVisibility): ViewMembership {
  return normalizeMembership(
    Object.fromEntries(
      Object.entries(membership).filter(([scenarioId]) => globallyVisible(globalVisibility, scenarioId)),
    ),
  );
}

export function effectiveScenarioIds(membership: ViewMembership, globalVisibility: GlobalVisibility): string[] {
  return Object.keys(effectiveVisibility(membership, globalVisibility));
}

function positiveNormalizedSizes(sizes: readonly number[], count: number): number[] {
  const usable = sizes.length === count && sizes.every((size) => Number.isFinite(size) && size > 0)
    ? sizes
    : Array.from({ length: count }, () => 1);
  const total = usable.reduce((sum, size) => sum + size, 0);
  return usable.map((size) => size / total);
}

export function validateGraphBoardLayout(
  layout: GraphBoardLayout | undefined,
  options: GraphBoardValidationOptions = {},
): string[] {
  if (!layout) return ["GraphBoardLayout is missing."];

  const errors: string[] = [];
  const validGraphViewIds = options.graphViewIds ? new Set(options.graphViewIds) : undefined;
  const seenLeaves = new Set<string>();

  function visit(node: GraphBoardLayout, path: string): void {
    if (node.type === "leaf") {
      if (!node.graphViewId) errors.push(`${path}: leaf graphViewId is required.`);
      if (validGraphViewIds && !validGraphViewIds.has(node.graphViewId)) {
        errors.push(`${path}: leaf graphViewId "${node.graphViewId}" is not resolvable.`);
      }
      if (seenLeaves.has(node.graphViewId)) errors.push(`${path}: duplicate leaf graphViewId "${node.graphViewId}".`);
      seenLeaves.add(node.graphViewId);
      return;
    }

    if (node.children.length < 2) errors.push(`${path}: split must have at least 2 children.`);
    if (node.sizes.length !== node.children.length) errors.push(`${path}: sizes length must match children length.`);
    node.sizes.forEach((size, index) => {
      if (!Number.isFinite(size) || size <= 0) errors.push(`${path}.sizes[${index}]: size must be a positive finite ratio.`);
    });
    node.children.forEach((child, index) => visit(child, `${path}.children[${index}]`));
  }

  visit(layout, "layout");
  return errors;
}

export function normalizeGraphBoardLayout(
  layout: GraphBoardLayout | undefined,
  options: GraphBoardValidationOptions = {},
): GraphBoardNormalizationResult {
  if (!layout) return { errors: ["GraphBoardLayout is missing."] };

  function normalizeNode(node: GraphBoardLayout): GraphBoardLayout | undefined {
    if (node.type === "leaf") return { type: "leaf", graphViewId: node.graphViewId };

    const children = node.children
      .map((child) => normalizeNode(child))
      .filter((child): child is GraphBoardLayout => Boolean(child));

    if (children.length === 0) return undefined;
    if (children.length === 1) return children[0];

    return {
      type: "split",
      direction: node.direction,
      children,
      sizes: positiveNormalizedSizes(node.sizes, children.length),
    };
  }

  const normalized = normalizeNode(layout);
  const errors = validateGraphBoardLayout(normalized, options);
  return errors.length > 0 ? { errors } : { layout: normalized, errors: [] };
}

function graphViewSpecFromPanel(panel: PanelDef, graphType: GraphViewType): GraphViewSpec {
  return {
    id: panel.sourceViewId ?? panel.id,
    title: panel.title,
    kind: "graph",
    graphType,
    membership: membershipFromPanelConfig(panel.config),
    ...(graphType === "pvloop" ? { aspect: { ratio: 1, fit: "lock" as const } } : {}),
    presentation: {
      ...(panel.showGuides !== undefined ? { showGuides: panel.showGuides } : {}),
      ...(panel.timeWindow !== undefined ? { timeWindow: panel.timeWindow } : {}),
      ...(panel.showLegend !== undefined ? { showLegend: panel.showLegend } : {}),
      ...(panel.view?.kind === "graph" && panel.view.legendPosition !== undefined
        ? { legendPosition: panel.view.legendPosition }
        : {}),
      ...(panel.pvDebugOverlay !== undefined ? { pvDebugOverlay: panel.pvDebugOverlay } : {}),
      ...(panel.pvDebugTraceMode !== undefined ? { pvDebugTraceMode: panel.pvDebugTraceMode } : {}),
      ...(panel.pvHistoryBeats !== undefined ? { pvHistoryBeats: panel.pvHistoryBeats } : {}),
      ...(panel.pvHistoryMode !== undefined ? { pvHistoryMode: panel.pvHistoryMode } : {}),
    },
  };
}

function metricsViewSpecFromPanel(panel: PanelDef): MetricsViewSpec {
  const membership = membershipFromPanelConfig(panel.config);
  return {
    id: panel.id,
    title: panel.title,
    kind: "metrics",
    metrics: itemsFromMembership(membership) as MetricType[],
    membership,
  };
}

function controllerViewSpecFromPanel(panel: PanelDef): ControllerViewSpec {
  const items = panel.view?.kind === "control" ? (panel.view.controllerItems ?? []) : [];
  return {
    id: panel.id,
    title: panel.title,
    kind: "controller",
    items,
    binding: { kind: "active" },
  };
}

type Rect = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function rectForPanel(panel: PanelDef, fallbackIndex: number): Rect {
  return {
    id: panel.id,
    x: panel.x ?? fallbackIndex,
    y: panel.y ?? 0,
    w: panel.w || 1,
    h: panel.h || 1,
  };
}

function buildFallbackSplit(rects: Rect[], direction: "row" | "column"): GraphBoardLayout {
  return {
    type: "split",
    direction,
    children: rects.map((rect) => ({ type: "leaf", graphViewId: rect.id })),
    sizes: positiveNormalizedSizes(rects.map((rect) => direction === "row" ? rect.w : rect.h), rects.length),
  };
}

function findCleanSplit(rects: Rect[], direction: "row" | "column"): GraphBoardLayout | undefined {
  const min = Math.min(...rects.map((rect) => direction === "row" ? rect.x : rect.y));
  const max = Math.max(...rects.map((rect) => direction === "row" ? rect.x + rect.w : rect.y + rect.h));
  const boundaries = unique(
    rects
      .map((rect) => String(direction === "row" ? rect.x + rect.w : rect.y + rect.h))
      .filter((boundary) => Number(boundary) > min && Number(boundary) < max),
  )
    .map(Number)
    .sort((a, b) => a - b);

  for (const boundary of boundaries) {
    const before = rects.filter((rect) => (direction === "row" ? rect.x + rect.w : rect.y + rect.h) <= boundary);
    const after = rects.filter((rect) => (direction === "row" ? rect.x : rect.y) >= boundary);
    if (before.length + after.length !== rects.length || before.length === 0 || after.length === 0) continue;

    const beforeLayout = buildLayoutFromRects(before);
    const afterLayout = buildLayoutFromRects(after);
    const beforeSize = boundary - min;
    const afterSize = max - boundary;
    return {
      type: "split",
      direction,
      children: [beforeLayout, afterLayout],
      sizes: positiveNormalizedSizes([beforeSize, afterSize], 2),
    };
  }

  return undefined;
}

function buildLayoutFromRects(rects: Rect[]): GraphBoardLayout {
  if (rects.length === 1) return { type: "leaf", graphViewId: rects[0].id };

  const minX = Math.min(...rects.map((rect) => rect.x));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.w));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.h));
  const primary: "row" | "column" = (maxX - minX) >= (maxY - minY) ? "row" : "column";
  const secondary: "row" | "column" = primary === "row" ? "column" : "row";

  return findCleanSplit(rects, primary)
    ?? findCleanSplit(rects, secondary)
    ?? buildFallbackSplit(
      [...rects].sort((a, b) => a.y - b.y || a.x - b.x),
      primary,
    );
}

export function graphBoardLayoutFromPanels(panels: PanelDef[]): GraphBoardLayout | undefined {
  const graphPanels = panels
    .map((panel, index) => ({ panel, index }))
    .filter(({ panel }) => graphTypeForPanel(panel));

  if (graphPanels.length === 0) return undefined;

  return buildLayoutFromRects(graphPanels.map(({ panel, index }) => rectForPanel(panel, index)));
}

export function migratePanelsToViewSpecs(
  panels: PanelDef[],
  _workspace?: WorkbenchWorkspace,
): { views: ViewSpec[]; graphBoardLayout?: GraphBoardLayout } {
  const views = panels.flatMap((panel): ViewSpec[] => {
    const graphType = graphTypeForPanel(panel);
    if (graphType) return [graphViewSpecFromPanel(panel, graphType)];
    if (panel.type === "METRICS") return [metricsViewSpecFromPanel(panel)];
    if (panel.type === "CONTROLS") return [controllerViewSpecFromPanel(panel)];
    return [];
  });

  const graphBoardLayout = graphBoardLayoutFromPanels(panels);
  return {
    views,
    ...(graphBoardLayout ? { graphBoardLayout } : {}),
  };
}

export function remapMembershipScenarioIds(membership: ViewMembership, scenarioIdMap: Map<string, string>): ViewMembership {
  return normalizeMembership(
    Object.fromEntries(
      Object.entries(membership).map(([scenarioId, itemIds]) => [scenarioIdMap.get(scenarioId) ?? scenarioId, itemIds]),
    ),
  );
}

export function remapViewSpecIds(
  view: ViewSpec,
  maps: { scenarioIdMap: Map<string, string>; viewIdMap?: Map<string, string> },
): ViewSpec {
  const viewIdMap = maps.viewIdMap ?? new Map<string, string>();
  const id = viewIdMap.get(view.id) ?? view.id;

  if (view.kind === "graph") {
    return {
      ...view,
      id,
      membership: remapMembershipScenarioIds(view.membership, maps.scenarioIdMap),
    };
  }

  if (view.kind === "metrics") {
    return {
      ...view,
      id,
      membership: remapMembershipScenarioIds(view.membership, maps.scenarioIdMap),
    };
  }

  return {
    ...view,
    id,
    binding: view.binding.kind === "scenario"
      ? { kind: "scenario", scenarioId: maps.scenarioIdMap.get(view.binding.scenarioId) ?? view.binding.scenarioId }
      : view.binding,
  };
}

export function remapGraphBoardLayoutViewIds(
  layout: GraphBoardLayout | undefined,
  viewIdMap: Map<string, string>,
): GraphBoardLayout | undefined {
  if (!layout) return undefined;
  if (layout.type === "leaf") {
    return { type: "leaf", graphViewId: viewIdMap.get(layout.graphViewId) ?? layout.graphViewId };
  }
  return {
    ...layout,
    children: layout.children.map((child) => remapGraphBoardLayoutViewIds(child, viewIdMap)!),
    sizes: [...layout.sizes],
  };
}
