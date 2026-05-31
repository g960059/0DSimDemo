import { describe, expect, it } from "vitest";
import type { SimInstance, PanelDef } from "@/types";
import {
  caseDocumentToSimInstances,
  isCaseDisplayable,
  simInstancesToCaseDocument,
  type CaseInstance,
} from "@/caseDoc";
import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
import { defaultParams } from "@/engine/ModelCore";

const V = KNOB_MAPPING_VERSION;
const base = defaultParams();

// A knob-primary instance with a clinical deviation.
const knobPrimary: SimInstance = (() => {
  const knobs = { ...neutralKnobs(base), contractility: 0.7, afterload: 1.4, aorticStenosis: 0.5, diastolicStiffness: 1.6 };
  return { id: "1", name: "Heart A", color: "#a855f7", isVisible: true, knobBaseline: base, knobs, params: applyKnobs(base, knobs, V), targetVolume: 5600 };
})();

// A knob-primary instance whose BASELINE was raw-edited (SVR), so baselinePatch matters.
const rawBaseEdited: SimInstance = (() => {
  const knobBaseline = { ...base, systemicResistance: 2.0 };
  const knobs = { ...neutralKnobs(knobBaseline), afterload: 1.3 };
  return { id: "2", name: "Heart B", color: "#f472b6", isVisible: true, knobBaseline, knobs, params: applyKnobs(knobBaseline, knobs, V), targetVolume: 4800 };
})();

// A legacy raw-only instance (no knobs / knobBaseline).
const legacy: SimInstance = { id: "3", name: "Heart C", color: "#22c55e", isVisible: true, params: { ...base, HR: 95 }, targetVolume: 5000 };

const panels: PanelDef[] = [
  { id: "p1", type: "WAVEFORM", title: "Waveforms", w: 5, h: 6, config: { "1": { visible: true, selectedSignals: ["LVP", "AoP"] } }, isSettingsOpen: false },
  { id: "p4", type: "CONTROLS", title: "Controls", w: 4, h: 4, config: { "1": { visible: true, selectedSignals: ["clinical", "Global"] } }, isSettingsOpen: false },
];

const buildDoc = (instances: SimInstance[]) =>
  simInstancesToCaseDocument(instances, panels, {
    id: "case-1", title: "Round-trip", createdAt: 1000, updatedAt: 2000,
    spec: { title: "Round-trip", modelLimitations: ["0D lumped model; no regional wall motion."] },
  });

describe("CaseDocument bridge round-trip (#3-b)", () => {
  it("stamps the schema/engine/knobMapping versions", () => {
    const doc = buildDoc([knobPrimary]);
    expect(doc.knobMappingVersion).toBe(KNOB_MAPPING_VERSION);
    expect(doc.schemaVersion).toBe(1);
    expect(isCaseDisplayable(doc)).toBe(true);
  });

  it("NEVER serializes the derived params (only knobs + baselinePatch)", () => {
    const doc = buildDoc([knobPrimary, rawBaseEdited, legacy]);
    for (const ci of doc.instances as CaseInstance[]) {
      expect((ci as unknown as Record<string, unknown>).params).toBeUndefined();
      expect(ci.baseline).toBe("active-normal");
    }
  });

  it("round-trips through JSON to identical resolved params + targetVolume", () => {
    const original = [knobPrimary, rawBaseEdited, legacy];
    const doc = buildDoc(original);
    const reloaded = caseDocumentToSimInstances(JSON.parse(JSON.stringify(doc)));

    expect(reloaded).toHaveLength(3);
    for (let i = 0; i < original.length; i++) {
      expect(reloaded[i].params, `instance ${original[i].id} params`).toEqual(original[i].params);
      expect(reloaded[i].targetVolume).toBe(original[i].targetVolume);
      expect(reloaded[i].name).toBe(original[i].name);
      expect(reloaded[i].knobBaseline).toBeDefined(); // loaded instances are knob-primary
    }
  });

  it("preserves the panel layout verbatim through JSON", () => {
    const doc = buildDoc([knobPrimary]);
    const round = JSON.parse(JSON.stringify(doc));
    expect(round.panels).toEqual(panels);
  });

  it("refuses to load a case stamped with an unknown knobMappingVersion (no silent fallback)", () => {
    const doc = buildDoc([knobPrimary]);
    const tampered = { ...doc, knobMappingVersion: "knobmap-9.9-bogus" };
    expect(() => caseDocumentToSimInstances(tampered)).toThrow(/Unknown knobMappingVersion/);
  });
});
