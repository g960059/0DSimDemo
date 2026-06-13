import { describe, expect, it } from "vitest";
import { HARD_CLAMP } from "@/engine/protocol";
import { RAW_PARAM_CATALOG, RAW_PARAM_CATALOG_SECTIONS, rawParamCatalogEntry } from "@/rawParameterCatalog";

describe("RAW_PARAM_CATALOG", () => {
  it("contains only keys with HARD_CLAMP ranges", () => {
    for (const entry of RAW_PARAM_CATALOG) {
      expect(HARD_CLAMP[entry.key]).toEqual([entry.min, entry.max]);
    }
  });

  it("excludes clinical duplicates and non-physiology/runtime controls", () => {
    expect(RAW_PARAM_CATALOG.map((entry) => entry.key)).not.toEqual(expect.arrayContaining([
      "HR",
      "contractility",
      "relaxation",
      "systemicResistance",
      "pulmonaryResistance",
      "venousTone",
      "arterialStiffness",
      "PEEP",
      "speed",
    ]));
  });

  it("groups entries into stable category sections", () => {
    expect(RAW_PARAM_CATALOG_SECTIONS.map((section) => section.title)).toEqual([
      "electricalTiming",
      "respiratory",
      "fluids",
      "contractilityScaling",
      "geometry",
      "pericardium",
      "septalCoupling",
      "coronary",
    ]);
    expect(rawParamCatalogEntry("LADStenosis")).toMatchObject({ category: "coronary", min: 0, max: 0.95 });
  });
});
