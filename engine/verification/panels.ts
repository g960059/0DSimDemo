export type VerificationArtifactFile = "waveforms.svg" | "pv-loops.svg" | "report.md";

export type VerificationPanelRef = {
  id: string;
  title: string;
  artifactFile: VerificationArtifactFile;
  gateIds: readonly string[];
};

export const VERIFICATION_WAVEFORM_PANELS = [
  {
    id: "pressures",
    title: "LVP / AoP / LAP (mmHg)",
    artifactFile: "waveforms.svg",
    gateIds: ["lvp-aop-peak-gap", "lvp-diastolic-min", "lv-pressure-floor", "lap-oscillation-index", "lap-prominent-extrema"],
  },
  {
    id: "inflow",
    title: "QMV / QTV model flow (mL/s)",
    artifactFile: "waveforms.svg",
    gateIds: ["qmv-e-peak", "qmv-a-peak", "qmv-a-over-e", "qmv-extra-peaks", "qtv-e-peak", "qtv-a-peak", "qtv-a-over-e"],
  },
  {
    id: "pulmonary-venous-flow",
    title: "PVF model flow (mL/s, not Doppler velocity)",
    artifactFile: "waveforms.svg",
    gateIds: ["pvf-s-peak", "pvf-d-peak", "pvf-ar-present", "pvf-s-fraction", "pvf-s-over-d", "pvf-reverse-fraction"],
  },
  {
    id: "mitral-gradient",
    title: "Transmitral gradient (LAP - LVP, mmHg)",
    artifactFile: "waveforms.svg",
    gateIds: ["mv-gradient-forward-count", "mv-gradient-all-mean", "mv-gradient-e-mean", "mv-gradient-e-peak", "mv-gradient-a-mean", "mv-gradient-a-peak"],
  },
  {
    id: "elastance",
    title: "Apparent elastance reference comparison",
    artifactFile: "waveforms.svg",
    gateIds: ["lv-active-elastance-shape"],
  },
] as const satisfies readonly VerificationPanelRef[];

export const VERIFICATION_PV_LOOP_PANELS = [
  {
    id: "lv-pv-loop",
    title: "LV PV loop",
    artifactFile: "pv-loops.svg",
    gateIds: ["lvp-aop-peak-gap", "lvp-diastolic-min", "lv-filling-edge-roughness", "lv-filling-edge-curvature", "lv-filling-edge-reversals"],
  },
  {
    id: "rv-pv-loop",
    title: "RV PV loop",
    artifactFile: "pv-loops.svg",
    gateIds: ["rv-edp-presystolic", "rv-stroke-fraction", "rvp-max"],
  },
  {
    id: "la-pv-loop",
    title: "LA PV loop",
    artifactFile: "pv-loops.svg",
    gateIds: ["la-figure-eight"],
  },
  {
    id: "ra-pv-loop",
    title: "RA PV loop",
    artifactFile: "pv-loops.svg",
    gateIds: ["ra-figure-eight", "ra-volume-max", "ra-volume-min", "ra-emptying-fraction"],
  },
] as const satisfies readonly VerificationPanelRef[];

export const VERIFICATION_PANELS = [
  ...VERIFICATION_WAVEFORM_PANELS,
  ...VERIFICATION_PV_LOOP_PANELS,
] as const satisfies readonly VerificationPanelRef[];

export function panelForGate(gateId: string): VerificationPanelRef | null {
  return VERIFICATION_PANELS.find((panel) => (panel.gateIds as readonly string[]).includes(gateId)) ?? null;
}
