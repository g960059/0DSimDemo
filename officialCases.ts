// Official lesson cases (milestone #3-d). Static, in-repo CaseDocuments authored
// purely on the "active-normal" baseline via clinical knobs / named interventions
// (no raw params), each carrying mandatory model limitations. These drive the
// Official Cases / Learning Path pages offline (#3-f) and are the M12-lite
// waveform-shape gate's subjects (#3-e).

import type { CaseDocument, CaseInstance } from "@/caseDoc";
import { CASE_SCHEMA_VERSION, ENGINE_VERSION, DEFAULT_SOLVER } from "@/caseDoc";
import { KNOB_MAPPING_VERSION } from "@/engine/knobs";
import type { PanelDef } from "@/types";

const COLORS = ["#a855f7", "#f472b6", "#22c55e", "#38bdf8", "#fbbf24"];

/** A standard teaching layout (note + waveforms + PV loop + controls + metrics),
 *  with a per-instance config entry for every instance in the case. */
function buildPanels(instanceIds: string[]): PanelDef[] {
  const cfg = (signals: string[]) => Object.fromEntries(instanceIds.map((id) => [id, { visible: true, selectedSignals: signals }]));
  return [
    { id: "p_note", type: "NOTE", title: "Interactive Notes", w: 4, h: 10, config: {}, isSettingsOpen: false },
    { id: "p1", type: "WAVEFORM", title: "Waveforms", w: 5, h: 6, config: cfg(["LVP", "AoP"]), isSettingsOpen: false, timeWindow: 5000 },
    { id: "p2", type: "PVLOOP", title: "PV Loop", w: 3, h: 6, config: cfg(["LV"]), isSettingsOpen: false, showGuides: true },
    { id: "p4", type: "CONTROLS", title: "Controls", w: 4, h: 4, config: cfg(["clinical", "Global", "fluids"]), isSettingsOpen: false },
    { id: "p3", type: "METRICS", title: "Metrics", w: 4, h: 4, config: cfg(["ABP", "CO", "CVP"]), isSettingsOpen: false },
  ];
}

type InstanceAuthor = Pick<CaseInstance, "name" | "knobs" | "interventions" | "targetVolume">;

function instance(i: number, a: InstanceAuthor): CaseInstance {
  return {
    id: String(i + 1),
    name: a.name,
    color: COLORS[i % COLORS.length],
    isVisible: true,
    baseline: "active-normal",
    knobs: a.knobs,
    interventions: a.interventions,
    rawPatch: {},
    targetVolume: a.targetVolume,
  };
}

function makeCase(p: { id: string; title: string; description: string; modelLimitations: string[]; instances: InstanceAuthor[] }): CaseDocument {
  const instances = p.instances.map((a, i) => instance(i, a));
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: { id: p.id, title: p.title, author: "HemoSim", createdAt: 0, updatedAt: 0 },
    spec: { title: p.title, description: p.description, modelLimitations: p.modelLimitations },
    instances,
    panels: buildPanels(instances.map((x) => x.id)),
  };
}

const LIMIT_GENERAL = "0D lumped-parameter closed-loop model — no spatial flow, regional wall motion, or pulsatile wave reflection physics.";
const LIMIT_CALIB = "Active-stress single-fibre ventricles; parameters are not yet calibrated (M12), so absolute metric values are indicative, not validated — read the waveform SHAPE.";

export const OFFICIAL_CASES: CaseDocument[] = [
  makeCase({
    id: "normal-sinus",
    title: "Normal physiology",
    description: "A roughly-physiological resting adult — the reference operating point all other cases deviate from.",
    modelLimitations: [LIMIT_GENERAL, LIMIT_CALIB],
    instances: [{ name: "Normal", knobs: {}, interventions: [], targetVolume: 5600 }],
  }),
  makeCase({
    id: "lv-failure-dobutamine",
    title: "Cardiogenic shock: LV failure ± dobutamine",
    description: "Severe global LV pump failure, and the response to a β1 inotrope (dobutamine). Compare the two side by side: CO and arterial pressure recover, filling pressure falls.",
    modelLimitations: [
      LIMIT_GENERAL,
      "LV failure is modelled as GLOBAL contractility depression — the 0D model cannot represent a regional wall-motion abnormality (e.g. a territorial infarct).",
      LIMIT_CALIB,
    ],
    instances: [
      { name: "LV failure", knobs: {}, interventions: [{ uid: "f", id: "lvPumpFailure", args: { severity: 0.6 } }], targetVolume: 5600 },
      { name: "+ Dobutamine", knobs: {}, interventions: [{ uid: "f", id: "lvPumpFailure", args: { severity: 0.6 } }, { uid: "d", id: "dobutamine", args: { dose: 7 } }], targetVolume: 5600 },
    ],
  }),
  makeCase({
    id: "valve-lesions",
    title: "Valvular lesions: aortic stenosis & mitral regurgitation",
    description: "Two classic left-heart valve lesions. AS imposes a systolic LV–aortic pressure gradient; MR sends a regurgitant jet into the LA, raising LAP and cutting forward output.",
    modelLimitations: [
      LIMIT_GENERAL,
      "Valve lesions are modelled by lumped orifice area / leak area / resistance changes — no real geometry, jet, or turbulence; gradients are indicative of direction, not exact severity.",
      LIMIT_CALIB,
    ],
    instances: [
      { name: "Aortic stenosis", knobs: {}, interventions: [{ uid: "as", id: "aorticStenosis", args: { severity: "severe" } }], targetVolume: 5600 },
      { name: "Mitral regurgitation", knobs: {}, interventions: [{ uid: "mr", id: "mitralRegurgitation", args: { severity: "severe" } }], targetVolume: 5600 },
    ],
  }),
  makeCase({
    id: "hypovolemia",
    title: "Hypovolemia",
    description: "Reduced circulating volume (e.g. haemorrhage): preload falls, so stroke volume and cardiac output drop while the heart itself is normal — a preload, not a pump, problem.",
    modelLimitations: [
      LIMIT_GENERAL,
      "Volume status is set via the target total blood volume; there is no dynamic bleeding/transfusion in this static case (see the Fluids & Hemorrhage controls for that).",
      LIMIT_CALIB,
    ],
    instances: [{ name: "Hypovolemia", knobs: {}, interventions: [], targetVolume: 4000 }],
  }),
];

export function officialCaseById(id: string): CaseDocument | undefined {
  return OFFICIAL_CASES.find((c) => c.meta.id === id);
}
