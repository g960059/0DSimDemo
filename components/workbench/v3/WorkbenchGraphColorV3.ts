import type {
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceGraphTraceColorV2,
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import type { AppThemeId } from "@/appTheme";

export const WORKBENCH_SCENARIO_COLOR_PALETTE_V3 = Object.freeze([
  "#2f8fd3",
  "#d58a19",
  "#8b76d1",
  "#2aa67d",
] as const);

export type WorkbenchGraphRendererV3 =
  | "sweep"
  | "pressure-volume"
  | "structural-return";

export type WorkbenchResolvedGraphTraceStyleV3 = Readonly<{
  color: string;
}>;

const WORKBENCH_SINGLE_SCENARIO_ITEM_PALETTE_V3: Readonly<
  Record<string, Readonly<Record<AppThemeId, string>>>
> = Object.freeze({
  LVP: Object.freeze({ light: "#c72c50", dark: "#ff5a78" }),
  LV: Object.freeze({ light: "#c72c50", dark: "#ff5a78" }),
  LAP: Object.freeze({ light: "#6f42c1", dark: "#b78bfa" }),
  LA: Object.freeze({ light: "#6f42c1", dark: "#b78bfa" }),
  AoP: Object.freeze({ light: "#0072a8", dark: "#33b1ff" }),
  AoV: Object.freeze({ light: "#0072a8", dark: "#33b1ff" }),
  RAP: Object.freeze({ light: "#007d79", dark: "#2dd4bf" }),
  RA: Object.freeze({ light: "#007d79", dark: "#2dd4bf" }),
  RVP: Object.freeze({ light: "#4f46b5", dark: "#7c83fd" }),
  RV: Object.freeze({ light: "#4f46b5", dark: "#7c83fd" }),
  PAP: Object.freeze({ light: "#9c5c00", dark: "#fbbf24" }),
  PV: Object.freeze({ light: "#4f46b5", dark: "#7c83fd" }),
  MV: Object.freeze({ light: "#c72c50", dark: "#ff5a78" }),
  TV: Object.freeze({ light: "#007d79", dark: "#2dd4bf" }),
});

/** Stable semantic seed used only when a single-Scenario trace is allocated. */
export function workbenchSemanticItemColorV3(seriesId: string): string {
  return WORKBENCH_SINGLE_SCENARIO_ITEM_PALETTE_V3[seriesId]?.dark
    ?? "#66717b";
}

export function workbenchDefaultScenarioColorV3(index: number): string {
  if (!Number.isSafeInteger(index) || index < 0) {
    return WORKBENCH_SCENARIO_COLOR_PALETTE_V3[0];
  }
  return WORKBENCH_SCENARIO_COLOR_PALETTE_V3[
    index % WORKBENCH_SCENARIO_COLOR_PALETTE_V3.length
  ]!;
}

/** Scenario color is an allocation seed, not a live graph theme token. */
export function workbenchScenarioColorSeedV3(input: Readonly<{
  surface: ExperimentSurfaceV2;
  scenarioId: string;
  scenarioIndex: number;
}>): string {
  return input.surface.scenarioColorSeeds?.find(({ scenarioId }) =>
    scenarioId === input.scenarioId)?.colorHex
    ?? workbenchDefaultScenarioColorV3(input.scenarioIndex);
}

/**
 * Produces a coherent Scenario family without line-style encoding. The result
 * is persisted immediately; later base-color edits do not recompute it.
 */
export function deriveWorkbenchScenarioItemColorV3(
  baseColorHex: string,
  itemIndex: number,
): string {
  if (!Number.isSafeInteger(itemIndex) || itemIndex <= 0) {
    return canonicalColorHexV3(baseColorHex);
  }
  const [hue, saturation, lightness] = rgbToHslV3(
    hexToRgbV3(canonicalColorHexV3(baseColorHex)),
  );
  const variants = Object.freeze([
    Object.freeze({ hue: 0, saturation: 0, lightness: 0 }),
    Object.freeze({ hue: 14, saturation: -10, lightness: 8 }),
    Object.freeze({ hue: -14, saturation: 4, lightness: -8 }),
    Object.freeze({ hue: 28, saturation: -6, lightness: -2 }),
    Object.freeze({ hue: -28, saturation: -2, lightness: 6 }),
  ]);
  const variant = variants[itemIndex % variants.length]!;
  return rgbToHexV3(hslToRgbV3([
    (hue + variant.hue + 360) % 360,
    clampV3(saturation + variant.saturation, 35, 90),
    clampV3(lightness + variant.lightness, 35, 60),
  ]));
}

export function resolveWorkbenchGraphTraceStyleV3(input: Readonly<{
  pane: ExperimentSurfaceGraphPaneV2;
  surface: ExperimentSurfaceV2;
  renderer: WorkbenchGraphRendererV3;
  authoredScenarioCount: number;
  scenarioId: string;
  scenarioIndex: number;
  seriesId: string | null;
  seriesIndex?: number;
  appTheme?: AppThemeId;
}>): WorkbenchResolvedGraphTraceStyleV3 {
  const materialized = input.pane.traceColors?.find((trace) =>
    trace.scenarioId === input.scenarioId
    && trace.seriesId === input.seriesId);
  const baseColor = workbenchScenarioColorSeedV3(input);
  const fallbackColor = input.renderer === "sweep"
      && input.authoredScenarioCount <= 1
      && input.seriesId !== null
    ? workbenchSemanticItemColorV3(input.seriesId)
    : deriveWorkbenchScenarioItemColorV3(baseColor, input.seriesIndex ?? 0);
  const customColor = materialized?.customColorHex;
  if (customColor !== undefined) {
    return Object.freeze({ color: canonicalColorHexV3(customColor) });
  }
  const automaticColor = materialized?.automaticColorHex ?? fallbackColor;
  return Object.freeze({
    color: resolveWorkbenchAutomaticGraphColorV3({
      colorHex: automaticColor,
      appTheme: input.appTheme ?? "dark",
    }),
  });
}

export function resolveWorkbenchAutomaticGraphColorV3(input: Readonly<{
  colorHex: string;
  appTheme: AppThemeId;
}>): string {
  const canonical = canonicalColorHexV3(input.colorHex);
  const semantic = Object.values(
    WORKBENCH_SINGLE_SCENARIO_ITEM_PALETTE_V3,
  ).find((candidate) => candidate.dark === canonical);
  if (semantic !== undefined) return semantic[input.appTheme];
  return ensureWorkbenchGraphContrastV3(input.colorHex, input.appTheme);
}

/**
 * Adds stable Scenario base seeds and materializes every missing graph trace.
 * Existing automatic and custom colors are retained byte-for-byte.
 */
export function reconcileWorkbenchGraphColorsV3(
  surface: ExperimentSurfaceV2,
  scenarios: readonly Readonly<{ scenarioId: string }>[],
  newTraceStrategy: "scenario-base" | "series" = "scenario-base",
): ExperimentSurfaceV2 {
  const allowed = new Set(scenarios.map(({ scenarioId }) => scenarioId));
  const currentById = new Map(
    (surface.scenarioColorSeeds ?? []).map((seed) => [seed.scenarioId, seed]),
  );
  const usedColors = new Set(
    [...currentById.values()]
      .filter(({ scenarioId }) => allowed.has(scenarioId))
      .map(({ colorHex }) => colorHex),
  );
  const scenarioColorSeeds = scenarios.map(({ scenarioId }, index) => {
    const current = currentById.get(scenarioId);
    if (current !== undefined) return current;
    const preferred = workbenchDefaultScenarioColorV3(index);
    const colorHex = !usedColors.has(preferred)
      ? preferred
      : WORKBENCH_SCENARIO_COLOR_PALETTE_V3.find((color) =>
          !usedColors.has(color)) ?? preferred;
    usedColors.add(colorHex);
    return Object.freeze({ scenarioId, colorHex });
  });
  const baseById = new Map(scenarioColorSeeds.map((seed) => [
    seed.scenarioId,
    seed.colorHex,
  ]));
  let panesChanged = false;
  const graphPanes = surface.graphPanes.map((pane) => {
    const next = reconcilePaneTraceColorsV3(
      pane,
      scenarios,
      baseById,
      newTraceStrategy,
    );
    if (next !== pane) panesChanged = true;
    return next;
  });
  const currentSeeds = surface.scenarioColorSeeds ?? [];
  const seedsChanged = currentSeeds.length !== scenarioColorSeeds.length
    || scenarioColorSeeds.some((seed, index) =>
      currentSeeds[index]?.scenarioId !== seed.scenarioId
      || currentSeeds[index]?.colorHex !== seed.colorHex);
  if (!seedsChanged && !panesChanged) return surface;
  return Object.freeze({
    ...surface,
    scenarioColorSeeds: Object.freeze(scenarioColorSeeds),
    graphPanes: panesChanged ? Object.freeze(graphPanes) : surface.graphPanes,
  });
}

export function updateWorkbenchScenarioBaseColorV3(
  surface: ExperimentSurfaceV2,
  scenarioId: string,
  colorHex: string,
): ExperimentSurfaceV2 {
  const canonical = canonicalColorHexV3(colorHex);
  let found = false;
  const scenarioColorSeeds = (surface.scenarioColorSeeds ?? []).map((seed) => {
    if (seed.scenarioId !== scenarioId) return seed;
    found = true;
    return seed.colorHex === canonical
      ? seed
      : Object.freeze({ ...seed, colorHex: canonical });
  });
  if (!found) return surface;
  return Object.freeze({
    ...surface,
    scenarioColorSeeds: Object.freeze(scenarioColorSeeds),
  });
}

function reconcilePaneTraceColorsV3(
  pane: ExperimentSurfaceGraphPaneV2,
  scenarios: readonly Readonly<{ scenarioId: string }>[],
  baseById: ReadonlyMap<string, string>,
  newTraceStrategy: "scenario-base" | "series",
): ExperimentSurfaceGraphPaneV2 {
  const targetSeriesIds = pane.series.length === 0
    ? [null]
    : pane.series.map(({ seriesId }) => seriesId);
  const targetKeys = new Set(scenarios.flatMap(({ scenarioId }) =>
    targetSeriesIds.map((seriesId) => traceColorKeyV3(scenarioId, seriesId))));
  const currentByKey = new Map(
    (pane.traceColors ?? [])
      .filter(({ scenarioId, seriesId }) =>
        targetKeys.has(traceColorKeyV3(scenarioId, seriesId)))
      .map((trace) => [traceColorKeyV3(trace.scenarioId, trace.seriesId), trace]),
  );
  const traceColors = scenarios.flatMap(({ scenarioId }) =>
    targetSeriesIds.map((seriesId, itemIndex) => {
      const key = traceColorKeyV3(scenarioId, seriesId);
      const current = currentByKey.get(key);
      if (current !== undefined) return current;
      const base = baseById.get(scenarioId) ?? workbenchDefaultScenarioColorV3(0);
      const automaticColorHex = newTraceStrategy === "series"
          && seriesId !== null
          && !isPressureVolumePaneV3(pane)
        ? workbenchSemanticItemColorV3(seriesId)
        : deriveWorkbenchScenarioItemColorV3(base, itemIndex);
      return Object.freeze({
        scenarioId,
        seriesId,
        automaticColorHex,
      } satisfies ExperimentSurfaceGraphTraceColorV2);
    }));
  const current = pane.traceColors ?? [];
  const changed = current.length !== traceColors.length
    || traceColors.some((trace, index) => current[index] !== trace);
  if (!changed) return pane;
  return Object.freeze({
    ...pane,
    traceColors: Object.freeze(traceColors),
  });
}

function isPressureVolumePaneV3(
  pane: ExperimentSurfaceGraphPaneV2,
): boolean {
  return pane.pressureVolumeAnalysisMode !== undefined
    || pane.graphId.includes("pressure-volume");
}

function traceColorKeyV3(scenarioId: string, seriesId: string | null): string {
  return `${scenarioId}\u001f${seriesId ?? ""}`;
}

function canonicalColorHexV3(value: string): string {
  const candidate = value.toLowerCase();
  return /^#[0-9a-f]{6}$/.test(candidate) ? candidate : "#2f8fd3";
}

type RgbV3 = readonly [number, number, number];
type HslV3 = readonly [number, number, number];

function hexToRgbV3(value: string): RgbV3 {
  return Object.freeze([
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]);
}

function rgbToHexV3([red, green, blue]: RgbV3): string {
  return `#${[red, green, blue].map((channel) =>
    Math.round(clampV3(channel, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHslV3([redByte, greenByte, blueByte]: RgbV3): HslV3 {
  const red = redByte / 255;
  const green = greenByte / 255;
  const blue = blueByte / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = 0;
  if (delta !== 0) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  if (hue < 0) hue += 360;
  const saturation = delta === 0
    ? 0
    : delta / (1 - Math.abs(2 * lightness - 1));
  return Object.freeze([hue, saturation * 100, lightness * 100]);
}

function hslToRgbV3([hue, saturationPercent, lightnessPercent]: HslV3): RgbV3 {
  const saturation = saturationPercent / 100;
  const lightness = lightnessPercent / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const component = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = lightness - chroma / 2;
  const [red, green, blue]: RgbV3 = hue < 60
    ? [chroma, component, 0]
    : hue < 120
      ? [component, chroma, 0]
      : hue < 180
        ? [0, chroma, component]
        : hue < 240
          ? [0, component, chroma]
          : hue < 300
            ? [component, 0, chroma]
            : [chroma, 0, component];
  return Object.freeze([
    (red + match) * 255,
    (green + match) * 255,
    (blue + match) * 255,
  ]);
}

function ensureWorkbenchGraphContrastV3(
  colorHex: string,
  appTheme: AppThemeId,
): string {
  const canonical = canonicalColorHexV3(colorHex);
  const background = appTheme === "dark" ? "#081d35" : "#f5f9fc";
  if (contrastRatioV3(canonical, background) >= 4.5) return canonical;
  const [hue, saturation, initialLightness] = rgbToHslV3(
    hexToRgbV3(canonical),
  );
  for (let offset = 1; offset <= 70; offset += 1) {
    const lightness = appTheme === "dark"
      ? clampV3(initialLightness + offset, 0, 88)
      : clampV3(initialLightness - offset, 18, 100);
    const candidate = rgbToHexV3(hslToRgbV3([
      hue,
      Math.max(48, saturation),
      lightness,
    ]));
    if (contrastRatioV3(candidate, background) >= 4.5) return candidate;
  }
  return appTheme === "dark" ? "#edf4fa" : "#1f2933";
}

function contrastRatioV3(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminanceV3(hexToRgbV3(foreground));
  const backgroundLuminance = relativeLuminanceV3(hexToRgbV3(background));
  return (
    Math.max(foregroundLuminance, backgroundLuminance) + 0.05
  ) / (
    Math.min(foregroundLuminance, backgroundLuminance) + 0.05
  );
}

function relativeLuminanceV3([red, green, blue]: RgbV3): number {
  const linear = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function clampV3(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
