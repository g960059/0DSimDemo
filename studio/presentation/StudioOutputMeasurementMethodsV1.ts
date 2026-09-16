type Localized = Readonly<{ en: string; ja: string }>;
export type StudioOutputMeasurementMethodV1 = Readonly<{
  outputId: string;
  label: Localized;
}>;
export type StudioOutputMeasurementFamilyV1 = Readonly<{
  /** Picker identity only. Persist the chosen method's existing outputId. */
  id: string;
  settingLabel: Localized;
  /** First method is the default for new selections, never for saved items. */
  methods: readonly StudioOutputMeasurementMethodV1[];
}>;

const method = (outputId: string, en: string, ja: string): StudioOutputMeasurementMethodV1 => ({ outputId, label: { en, ja } });

export const STUDIO_OUTPUT_MEASUREMENT_FAMILIES_V1: readonly StudioOutputMeasurementFamilyV1[] = [
  ...(["mean", "peak"] as const).map(kind => ({
    id: `presentation.output-method.AV-${kind}-PG`,
    settingLabel: { en: "Calculation method", ja: "計算方法" },
    methods: [
      method(`hemodynamics.pressure-gradient.valve.${kind}-hydraulic-forward.AoV`, "From pressure", "圧から計算"),
      method(`hemodynamics.pressure-gradient.${kind}-bernoulli-jet.AoV`, "From velocity", "流速から推定"),
    ],
  })),
  ...(["stroke-volume", "ejection-fraction"] as const).map(kind => ({
    id: `presentation.output-method.LV-${kind}`,
    settingLabel: { en: "Calculation method", ja: "計算方法" },
    methods: [
      method(`hemodynamics.${kind}.LV-event-defined`, "Valve closure", "弁閉鎖時点"),
      method(`hemodynamics.${kind}.LV-extrema`, "Volume extrema", "最大・最小容積"),
    ],
  })),
  ...(["LV", "RV"] as const).flatMap(chamber => (["maximum", "minimum"] as const).map(kind => ({
    id: `presentation.output-method.${chamber}-${kind}-pressure-rate`,
    settingLabel: { en: "Time interval", ja: "時間幅" },
    methods: [
      method(`hemodynamics.pressure-rate.${kind}-accepted-step.absolute.${chamber}`, "Short interval", "短時間"),
      method(`hemodynamics.pressure-rate.${kind}-windowed-10ms.absolute.${chamber}`, "10 ms", "10 ms"),
    ],
  }))),
];

export function studioOutputMeasurementFamilyV1(outputId: string) {
  return STUDIO_OUTPUT_MEASUREMENT_FAMILIES_V1.find(family => family.methods.some(method => method.outputId === outputId));
}

/** Scenario copies of one method do not require method badges. */
export function studioOutputComparisonMethodLabelsV1(outputIds: readonly (string | null)[], locale: "en" | "ja"): ReadonlyMap<string, string> {
  const ids = new Set(outputIds);
  return new Map(STUDIO_OUTPUT_MEASUREMENT_FAMILIES_V1.flatMap(family => {
    const selected = family.methods.filter(method => ids.has(method.outputId));
    return selected.length > 1 ? selected.map(method => [method.outputId, method.label[locale]] as const) : [];
  }));
}
