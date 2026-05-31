import { describe, expect, it } from "vitest";
import { parseCaseDocument, serializeCaseDocument } from "@/casePersist";
import { simInstancesToCaseDocument } from "@/caseDoc";
import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
import { defaultParams } from "@/engine/ModelCore";
import type { SimInstance } from "@/types";

const base = defaultParams();
const inst: SimInstance = (() => {
  const knobs = { ...neutralKnobs(base), contractility: 0.8 };
  return { id: "1", name: "Heart A", color: "#a855f7", isVisible: true, knobBaseline: base, knobs, params: applyKnobs(base, knobs, KNOB_MAPPING_VERSION), targetVolume: 5600 };
})();
const doc = simInstancesToCaseDocument([inst], [], {
  id: "c1", title: "T", createdAt: 1, updatedAt: 2,
  spec: { modelLimitations: ["0D model."] },
});

describe("casePersist parse/serialize (#3-c)", () => {
  it("serialize -> parse round-trips a CaseDocument unchanged", () => {
    expect(parseCaseDocument(serializeCaseDocument(doc))).toEqual(doc);
  });

  it("rejects non-JSON", () => {
    expect(() => parseCaseDocument("{not json")).toThrow(/valid JSON/);
  });

  it("rejects a JSON object that is not a case file", () => {
    expect(() => parseCaseDocument(JSON.stringify({ hello: "world" }))).toThrow(/schemaVersion/);
    expect(() => parseCaseDocument(JSON.stringify({ schemaVersion: 1 }))).toThrow(/knobMappingVersion/);
    expect(() => parseCaseDocument(JSON.stringify({ schemaVersion: 1, knobMappingVersion: "x" }))).toThrow(/instances/);
  });
});
