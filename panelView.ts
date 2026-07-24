import type {
  ChamberId,
  ControlPanelView,
  GraphPanelView,
  MetricType,
  OutputPanelView,
  PanelDef,
  PanelInstanceConfig,
  PanelInstancePresentation,
  PanelType,
  PanelViewConfig,
  ScenarioPanelView,
  SignalType,
} from "./types";

function graphTypeForPanel(type: PanelType): GraphPanelView["graphType"] | undefined {
  switch (type) {
    case "PVLOOP":
      return "pvloop";
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

function instancePresentationFromLegacy(
  config: Record<string, PanelInstanceConfig>,
): Record<string, PanelInstancePresentation> | undefined {
  const entries = Object.entries(config).map(([id, cfg]) => [
    id,
    {
      visible: cfg.visible,
      ...(cfg.customName ? { label: cfg.customName } : {}),
      ...(cfg.customBaseColor ? { color: cfg.customBaseColor } : {}),
      ...(cfg.customSignalNames || cfg.customSignalColors
        ? {
            items: Object.fromEntries(
              Array.from(new Set([...Object.keys(cfg.customSignalNames ?? {}), ...Object.keys(cfg.customSignalColors ?? {})])).map((key) => [
                key,
                {
                  ...(cfg.customSignalNames?.[key] ? { label: cfg.customSignalNames[key] } : {}),
                  ...(cfg.customSignalColors?.[key] ? { color: cfg.customSignalColors[key] } : {}),
                },
              ]),
            ),
          }
        : {}),
    } satisfies PanelInstancePresentation,
  ]);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function uniqueLegacySelections(panel: PanelDef): string[] {
  return Array.from(
    new Set(Object.values(panel.config).flatMap((cfg) => cfg.selectedSignals)),
  );
}

export function toTypedPanelView(panel: PanelDef): PanelViewConfig {
  if (panel.view) return panel.view;

  const selected = uniqueLegacySelections(panel);
  const graphType = graphTypeForPanel(panel.type);
  if (graphType) {
    const view: GraphPanelView = {
      kind: "graph",
      graphType,
      instances: instancePresentationFromLegacy(panel.config),
      ...(graphType === "pvloop" ? { chambers: selected as ChamberId[] } : {}),
      ...(graphType === "waveform" ? { signals: selected as SignalType[] } : {}),
      ...(panel.timeWindow ? { timeWindow: panel.timeWindow } : {}),
      ...(panel.showGuides !== undefined ? { showGuides: panel.showGuides } : {}),
      ...(panel.showLegend !== undefined ? { showLegend: panel.showLegend } : {}),
      ...(panel.pvDebugOverlay !== undefined ? { pvDebugOverlay: panel.pvDebugOverlay } : {}),
      ...(panel.pvDebugTraceMode !== undefined ? { pvDebugTraceMode: panel.pvDebugTraceMode } : {}),
      ...(panel.pvHistoryBeats !== undefined
        ? { pvHistoryBeats: panel.pvHistoryBeats }
        : {}),
      ...(panel.pvHistoryMode !== undefined
        ? { pvHistoryMode: panel.pvHistoryMode }
        : {}),
      ...(panel.pvParameterHistoryCount !== undefined
        ? { pvParameterHistoryCount: panel.pvParameterHistoryCount }
        : {}),
      ...(panel.pvRelationDisplayMode !== undefined
        ? { pvRelationDisplayMode: panel.pvRelationDisplayMode }
        : {}),
      ...(panel.pvRelationPressureBasis !== undefined
        ? { pvRelationPressureBasis: panel.pvRelationPressureBasis }
        : {}),
      ...(panel.pvRelationShowSamplePoints !== undefined
        ? { pvRelationShowSamplePoints: panel.pvRelationShowSamplePoints }
        : {}),
      ...(panel.hemodynamicDetailMode !== undefined
        ? { hemodynamicDetailMode: panel.hemodynamicDetailMode }
        : {}),
      ...(panel.hemodynamicParameterHistoryCount !== undefined
        ? {
          hemodynamicParameterHistoryCount:
            panel.hemodynamicParameterHistoryCount,
        }
        : {}),
      ...(panel.hemodynamicAllowNegativeFillingPressure !== undefined
        ? {
          hemodynamicAllowNegativeFillingPressure:
            panel.hemodynamicAllowNegativeFillingPressure,
        }
        : {}),
    };
    return view;
  }

  if (panel.type === "METRICS") {
    const view: OutputPanelView = {
      kind: "output",
      metrics: selected as MetricType[],
      mode: "compact",
      instances: instancePresentationFromLegacy(panel.config),
    };
    return view;
  }

  if (panel.type === "CONTROLS") {
    const view: ControlPanelView = {
      kind: "control",
      groups: selected,
      editable: true,
      instances: instancePresentationFromLegacy(panel.config),
    };
    return view;
  }

  if (panel.type === "SCENARIOS") {
    const view: ScenarioPanelView = {
      kind: "scenario",
      mode: "list",
      instances: instancePresentationFromLegacy(panel.config),
    };
    return view;
  }

  return { kind: "note", noteId: panel.id, mode: "scratch" };
}

export function toLegacyPanelConfig(
  instanceIds: string[],
  view: PanelViewConfig,
  previous: Record<string, PanelInstanceConfig> = {},
): Record<string, PanelInstanceConfig> {
  const selected =
    view.kind === "graph"
      ? (view.chambers ?? view.signals ?? ["Default"])
      : view.kind === "output"
        ? view.metrics
      : view.kind === "control"
        ? (view.groups ?? view.knobs ?? [])
        : view.kind === "scenario"
          ? []
        : [];

  return Object.fromEntries(
    instanceIds.map((id) => {
      const prior = previous[id];
      const inst = "instances" in view ? view.instances?.[id] : undefined;
      const itemOverrides = inst?.items ?? {};
      return [
        id,
        {
          visible: inst?.visible ?? prior?.visible ?? true,
          selectedSignals: prior?.selectedSignals?.length ? prior.selectedSignals : selected,
          ...(inst?.label ? { customName: inst.label } : prior?.customName ? { customName: prior.customName } : {}),
          ...(inst?.color ? { customBaseColor: inst.color } : prior?.customBaseColor ? { customBaseColor: prior.customBaseColor } : {}),
          customSignalNames: Object.fromEntries(
            Object.entries(itemOverrides).flatMap(([key, item]) => item.label ? [[key, item.label]] : []),
          ),
          customSignalColors: Object.fromEntries(
            Object.entries(itemOverrides).flatMap(([key, item]) => item.color ? [[key, item.color]] : []),
          ),
        },
      ];
    }),
  );
}
