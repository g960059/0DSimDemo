import type { CaseDocument, CaseSource } from "@/caseDoc";
import { normalizeControllerItems } from "@/controllerItems";
import { toTypedPanelView } from "@/panelView";
import type { NoteContent } from "@/noteTypes";
import type {
  ChamberId,
  ControllerItem,
  ControlPanelView,
  GraphPanelView,
  LegendPosition,
  MetricType,
  PanelDef,
  PanelType,
  SignalType,
  WorkbenchWorkspace,
} from "@/types";
import type { WorkbenchLayoutState, WorkbenchControlsSide } from "@/components/workbench/PanelGrid";
import type { WorkbenchHeaderMode, WorkbenchThemeId } from "@/components/workbench/WorkbenchSidePanel";

// Ordered so that ADJACENT palette entries are maximally distinct in hue — a
// duplicate (which takes the next free slot) lands on a clearly different color
// instead of purple->pink (which read as near-identical on a dark canvas).
export const INSTANCE_COLORS = ['#a855f7', '#22c55e', '#fbbf24', '#38bdf8', '#f472b6'];
//                               purple     green      amber      cyan       pink

export const UNTITLED_CASE_TITLE = 'Untitled case';

function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const int = Number.parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

// "Redmean" approximation of perceptual color distance — close enough to rank
// palette colors without pulling in a color-space dependency.
function perceptualColorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const rbar = (r1 + r2) / 2;
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt((2 + rbar / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rbar) / 256) * db * db);
}

/**
 * Pick an instance color that stays visually distinct from those already in use.
 * Prefers the first UNUSED palette color; once the palette is exhausted it returns
 * the candidate whose nearest OTHER in-use color is farthest away (max-min distance),
 * so even >5 scenarios stay as separable as the palette allows. It inspects the SET
 * of colors currently in use (not the instance count), so it is deletion-order
 * independent. `avoidColor` (e.g. the source scenario's color on a duplicate) is
 * dropped from the candidate set so a duplicate never echoes its source's color.
 */
export function pickDistinctInstanceColor(usedColors: Iterable<string>, avoidColor?: string): string {
  const avoid = avoidColor?.toLowerCase();
  const filtered = INSTANCE_COLORS.filter((c) => c.toLowerCase() !== avoid);
  const palette = filtered.length > 0 ? filtered : INSTANCE_COLORS;
  const used = new Set(Array.from(usedColors, (c) => c.toLowerCase()));
  const unused = palette.find((c) => !used.has(c.toLowerCase()));
  if (unused) return unused;
  // Every candidate is already in use — rank by distance to the nearest OTHER
  // in-use color. Self-matches are skipped so a color does not score 0 against
  // itself (which would otherwise collapse every candidate to the first entry).
  let best = palette[0];
  let bestScore = -Infinity;
  for (const cand of palette) {
    const candLower = cand.toLowerCase();
    let nearest = Infinity;
    for (const u of used) {
      if (u === candLower) continue;
      nearest = Math.min(nearest, perceptualColorDistance(cand, u));
    }
    if (nearest > bestScore) { bestScore = nearest; best = cand; }
  }
  return best;
}

export const ALL_CHAMBERS: ChamberId[] = ['LV', 'LA', 'RV', 'RA'];
export const ALL_SIGNALS: SignalType[] = [
  'LVP', 'AoP', 'LAP', 'RVP', 'PAP', 'RAP',
  'QAo', 'QMV', 'QPA', 'QPV', 'QTV', 'PVF', 'SVF',
  'QCorLAD', 'QCorLCx', 'QCorRCA', 'QCorTotal', 'QCS',
  'PimLAD', 'PimLCx', 'PimRCA', 'PLADArt', 'PLCxArt', 'PRCAArt', 'PCS',
  'VRA', 'aRA', 'cRA', 'xiMV', 'xiAoV', 'xiTV', 'xiPV',
  'dP_MV', 'dP_AoV', 'dP_TV', 'dP_PV',
  'AoV_areaRatio', 'AoV_loss_R', 'AoV_loss_B', 'AoV_loss_residual',
  'LVPressureFloorHit01', 'RVPressureFloorHit01',
  'ELV_active', 'ERV_active', 'ELV_timeVarying', 'ERV_timeVarying',
  'Pperi', 'Ppc', 'VHeart', 'septumShiftMl', 'VLVeff', 'VRVeff',
  'PLVfw', 'PRVfw', 'PVI_LV', 'PVI_RV', 'septalForceMmHg',
];
export const ALL_METRICS: MetricType[] = ['ABP', 'CVP', 'PAP', 'PCWP', 'SV', 'CO', 'LVEF', 'COR', 'COR_PCT', 'LAD_DF', 'RCA_DF', 'FFR_LAD'];
export const ALL_CONTROL_GROUPS: string[] = ['clinical', 'Global', 'ventricles', 'atria', 'vascular', 'coronary', 'fluids', 'valves', 'resp', 'advanced'];
export const DEFAULT_MODEL_LIMITATIONS = [
  '0D lumped-parameter closed-loop model — no regional wall motion or spatial flow.',
  'Active-stress single-fibre ventricles; parameters are not yet calibrated (M12).',
];
export const WORKBENCH_THEME_STORAGE_KEY = 'hemosim.workbench.theme';
export const DEFAULT_WORKBENCH_THEME: WorkbenchThemeId = 'midnight';
export const WORKBENCH_THEMES = new Set<WorkbenchThemeId>(['midnight', 'graphite', 'clinical']);
export const LOCAL_COPY_AUTHOR = 'Local copy';
export const EMPTY_NOTE_SPINE: NoteContent = [
  { type: 'paragraph', content: [{ type: 'text', text: '', styles: {} }] },
];

export const INITIAL_PANELS: PanelDef[] = [
  {
      id: 'p1', type: 'WAVEFORM', title: 'Waveforms', w: 5, h: 6,
      config: { '1': { visible: true, selectedSignals: ['LVP', 'AoP'] } },
      isSettingsOpen: false, timeWindow: 5000
  },
  {
      id: 'p2', type: 'PVLOOP', title: 'PV Loop', w: 3, h: 6,
      config: { '1': { visible: true, selectedSignals: ['LV'] } },
      isSettingsOpen: false, showGuides: true
  },
  {
      id: 'p0', type: 'SCENARIOS', title: 'Scenarios', zone: 'sideRail', w: 4, h: 4,
      config: { '1': { visible: true, selectedSignals: [] } },
      isSettingsOpen: false
  },
  {
      id: 'p4', type: 'CONTROLS', title: 'Controls', w: 4, h: 4,
      // Keep ventricular mechanics visible as a collapsed group so the
      // pericardium/septum controls are discoverable without opening panel
      // settings. Default model stays active-stress.
      config: { '1': { visible: true, selectedSignals: ['clinical', 'Global', 'ventricles', 'fluids'] } },
      isSettingsOpen: false
  },
  {
      id: 'p3', type: 'METRICS', title: 'Metrics', w: 4, h: 4,
      config: { '1': { visible: true, selectedSignals: ['ABP', 'CO', 'CVP'] } },
      isSettingsOpen: false
  }
];

export const DEFAULT_WORKBENCH_LAYOUT: WorkbenchLayoutState = {
  controlsSide: 'left',
  controlsWidth: 320,
  caseRailWidth: 260,
  outputHeight: 190,
};

export function layoutStateFromWorkspace(workspace?: WorkbenchWorkspace): WorkbenchLayoutState {
  const controlPosition = workspace?.regions.control?.position;
  const controlsSide: WorkbenchControlsSide = controlPosition === 'right' ? 'right' : 'left';
  return {
    controlsSide,
    controlsWidth: workspace?.regions.control?.size ?? DEFAULT_WORKBENCH_LAYOUT.controlsWidth,
    caseRailWidth: workspace?.regions.note?.size ?? DEFAULT_WORKBENCH_LAYOUT.caseRailWidth,
    outputHeight: workspace?.regions.output?.size ?? DEFAULT_WORKBENCH_LAYOUT.outputHeight,
  };
}

export function getStoredWorkbenchTheme(): WorkbenchThemeId {
  if (typeof localStorage === 'undefined') return DEFAULT_WORKBENCH_THEME;
  const stored = localStorage.getItem(WORKBENCH_THEME_STORAGE_KEY);
  return WORKBENCH_THEMES.has(stored as WorkbenchThemeId) ? (stored as WorkbenchThemeId) : DEFAULT_WORKBENCH_THEME;
}

export function cloneInitialPanels(): PanelDef[] {
  return INITIAL_PANELS.map((panel) => ({
    ...panel,
    config: Object.fromEntries(
      Object.entries(panel.config).map(([id, config]) => [id, { ...config, selectedSignals: [...config.selectedSignals] }]),
    ),
  }));
}

export function defaultSignalsForPanelType(type: PanelType): string[] {
  if (type === 'PVLOOP') return ['LV'];
  if (type === 'WAVEFORM') return ['LVP', 'AoP'];
  if (type === 'METRICS') return ['ABP', 'CO'];
  if (type === 'SCENARIOS') return [];
  if (type === 'CONTROLS') return ['clinical', 'Global', 'ventricles', 'fluids'];
  if (type === 'GUYTON_RIGHT' || type === 'GUYTON_LEFT' || type === 'GUYTON_3D') return ['Default'];
  return [];
}

export function addHiddenInstanceConfigsToPanels(panels: PanelDef[], ids: string[]): PanelDef[] {
  return panels.map((panel) => {
    let changed = false;
    const config = { ...panel.config };
    for (const id of ids) {
      if (config[id]) continue;
      config[id] = { visible: false, selectedSignals: defaultSignalsForPanelType(panel.type) };
      changed = true;
    }
    return changed ? { ...panel, config } : panel;
  });
}

export function mergePanelControllerItems(panel: PanelDef, items: ControllerItem[]): PanelDef {
  if (panel.type !== 'CONTROLS') return panel;

  const normalized = normalizeControllerItems(items).items;
  const baseView: ControlPanelView = panel.view?.kind === 'control'
    ? panel.view
    : (toTypedPanelView({ ...panel, type: 'CONTROLS', view: undefined }) as ControlPanelView);
  return {
    ...panel,
    view: {
      ...baseView,
      kind: 'control',
      controllerItems: normalized,
    },
  };
}

const GRAPH_PANEL_TYPES = new Set<PanelType>(['PVLOOP', 'WAVEFORM', 'GUYTON_RIGHT', 'GUYTON_LEFT', 'GUYTON_3D']);

export function mergePanelLegendPosition(panel: PanelDef, pos?: LegendPosition): PanelDef {
  if (!GRAPH_PANEL_TYPES.has(panel.type)) return panel;

  const derivedView = panel.view?.kind === 'graph'
    ? panel.view
    : toTypedPanelView({ ...panel, view: undefined });
  if (derivedView.kind !== 'graph') return panel;

  const baseView: GraphPanelView = derivedView;
  if (pos !== undefined) {
    return {
      ...panel,
      view: {
        ...baseView,
        legendPosition: pos,
      },
    };
  }

  const { legendPosition: _legendPosition, ...viewWithoutPosition } = baseView;
  return {
    ...panel,
    view: viewWithoutPosition,
  };
}

export function resolveHeaderModeFromAuthor(author?: string, source?: CaseSource): WorkbenchHeaderMode {
  if (source?.kind === 'official') return 'learner';
  const normalized = author?.trim();
  if (!normalized) return 'sandbox';
  if (normalized === LOCAL_COPY_AUTHOR) return 'sandbox';
  return 'learner';
}

export function inferCaseSource(doc: CaseDocument, opts: { trustedOfficial?: boolean } = {}): CaseSource | undefined {
  if (opts.trustedOfficial) return { kind: 'official', id: doc.meta.id };
  if (doc.source?.kind === 'official') return undefined;
  return doc.source;
}

function textFromNoteBlock(block: unknown): string {
  if (!block || typeof block !== 'object') return '';
  const content = (block as { content?: unknown }).content;
  if (!Array.isArray(content)) return '';
  return content
    .map((item) => item && typeof item === 'object' ? ((item as { text?: unknown }).text ?? '') : '')
    .filter((text): text is string => typeof text === 'string')
    .join(' ')
    .trim();
}

export function noteExcerpt(note: NoteContent): string {
  const text = note.map(textFromNoteBlock).find(Boolean);
  return text ? (text.length > 96 ? `${text.slice(0, 93)}...` : text) : 'Empty note';
}
