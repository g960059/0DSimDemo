/** Optional selection recipes, not combined measurements or severity labels.
 * A recipe is shown only when the active Surface exposes every member. */
export const STUDIO_AS_OUTPUT_SELECTION_V1 = Object.freeze([
  "hemodynamics.velocity.peak-quasi-steady-jet.AoV",
  "hemodynamics.pressure-gradient.mean-bernoulli-jet.AoV",
  "hemodynamics.area.forward-SV-over-jet-VTI.AoV",
  "hemodynamics.stroke-volume-index.forward.AoV-reference-bsa1p9",
  "hemodynamics.ejection-fraction.LV-event-defined",
] as const);
