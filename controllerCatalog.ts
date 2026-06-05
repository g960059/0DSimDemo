import type { ClinicalKnobs } from "./engine/knobs";

export type ControllerCatalogEntry = {
  key: Exclude<keyof ClinicalKnobs, "baroreflexEnabled">;
  label: string;
  category: string;
  step: number;
  unit?: string;
};

export const CONTROLLER_CATALOG: ControllerCatalogEntry[] = [
  { key: "contractility", label: "LV Contractility", category: "Cardiac Function", step: 0.05, unit: "x" },
  { key: "contractilityRV", label: "RV Contractility", category: "Cardiac Function", step: 0.05, unit: "x" },
  { key: "relaxation", label: "Relaxation", category: "Cardiac Function", step: 0.05, unit: "x" },
  { key: "diastolicStiffness", label: "Diastolic Stiffness", category: "Cardiac Function", step: 0.05, unit: "x" },
  { key: "HR", label: "Heart Rate", category: "Load & Rate", step: 1, unit: "bpm" },
  { key: "afterload", label: "Afterload (SVR)", category: "Load & Rate", step: 0.05, unit: "x" },
  { key: "arterialStiffness", label: "Arterial Stiffness", category: "Load & Rate", step: 0.05, unit: "x" },
  { key: "pulmonaryResistance", label: "Pulmonary Resistance", category: "Load & Rate", step: 0.05, unit: "x" },
  { key: "venousTone", label: "Venous Tone", category: "Load & Rate", step: 0.05 },
  { key: "peep", label: "PEEP", category: "Load & Rate", step: 1, unit: "cmH2O" },
  { key: "aorticStenosis", label: "Aortic Stenosis", category: "Valve Lesions", step: 0.05 },
  { key: "aorticRegurgitation", label: "Aortic Regurgitation", category: "Valve Lesions", step: 0.05 },
  { key: "mitralStenosis", label: "Mitral Stenosis", category: "Valve Lesions", step: 0.05 },
  { key: "mitralRegurgitation", label: "Mitral Regurgitation", category: "Valve Lesions", step: 0.05 },
  { key: "tricuspidRegurgitation", label: "Tricuspid Regurgitation", category: "Valve Lesions", step: 0.05 },
  { key: "pulmonicStenosis", label: "Pulmonic Stenosis", category: "Valve Lesions", step: 0.05 },
];

export const CONTROLLER_CATALOG_SECTIONS = Object.values(
  CONTROLLER_CATALOG.reduce<Record<string, { title: string; controls: ControllerCatalogEntry[] }>>((sections, entry) => {
    sections[entry.category] ??= { title: entry.category, controls: [] };
    sections[entry.category].controls.push(entry);
    return sections;
  }, {}),
);

