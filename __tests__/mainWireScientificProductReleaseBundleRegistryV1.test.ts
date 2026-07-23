import { describe, expect, it } from "vitest";

import {
  SCIENTIFIC_PRODUCT_ALLOWLISTED_RELEASE_REFS_V1,
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1,
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  isCurrentScientificProductReleaseBundleV1,
  isIntegratedPreviewScientificProductReleaseBundleV1,
  resolveScientificProductReleaseBundleV1,
} from "@/components/scientificProduct";
import {
  SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1,
} from "@/components/scientificProduct/ScientificWorkbenchMetricPresentationV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
} from "@/engine/scientific/observables";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("scientific product release bundle registry V1", () => {
  it("resolves the exact stable release to its release-bound catalogs", () => {
    const bundle = resolveScientificProductReleaseBundleV1({
      ...SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
    });

    expect(SCIENTIFIC_PRODUCT_ALLOWLISTED_RELEASE_REFS_V1).toEqual([
      SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
      SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1,
    ]);
    expect(bundle.releaseRef).toBe(SCIENTIFIC_PRODUCT_RELEASE_REF_V1);
    expect(bundle.availability).toMatchObject({
      channel: "stable-product",
      defaultForNewRuns: true,
      frontendSelectable: true,
      clinicalValidationClaimed: false,
    });
    if (!isCurrentScientificProductReleaseBundleV1(bundle)) {
      throw new Error("stable release resolved to a preview bundle");
    }
    expect(bundle.catalogs.cases.entries)
      .toBe(SCIENTIFIC_PRODUCT_CASE_CATALOG_V1);
    expect(bundle.catalogs.controls.valueDomains)
      .toBe(MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0);
    expect(bundle.catalogs.observables.observableRegistry)
      .toBe(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_SNAPSHOT_V1);
    expect(bundle.catalogs.ui.metricPresentations)
      .toBe(SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1);
  });

  it("resolves the integrated release only as an experimental preview", () => {
    const bundle = resolveScientificProductReleaseBundleV1({
      ...SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1,
    });

    expect(bundle.releaseRef)
      .toBe(SCIENTIFIC_PRODUCT_INTEGRATED_PREVIEW_RELEASE_REF_V1);
    expect(bundle.availability).toMatchObject({
      channel: "experimental-preview",
      defaultForNewRuns: false,
      frontendSelectable: true,
      clinicalValidationClaimed: false,
    });
    if (!isIntegratedPreviewScientificProductReleaseBundleV1(bundle)) {
      throw new Error("integrated preview resolved to a stable bundle");
    }
    expect(bundle.catalogs.cases.entries).toEqual([
      expect.objectContaining({
        caseId: "integrated/normal-sinus-p1",
        numericalPeriod1Established: true,
        physiologicalAcceptanceEstablished: false,
      }),
    ]);
    expect(bundle.catalogs.controls.controls[0]).toMatchObject({
      controlId: "mechanical-support.preview-preset",
      kind: "discrete-restart-required",
    });
    expect(bundle.catalogs.observables.observableIds)
      .toContain("coronary.flow.total");
    expect(bundle.catalogs.ui.graphRecipes)
      .toContain("dynamic-mcs-flow-waveforms");
  });

  it("rejects the same release ID and version with a different SHA-256", () => {
    expect(() => resolveScientificProductReleaseBundleV1({
      ...SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
      sha256: "0".repeat(64),
    })).toThrow(/exact SimulationReleaseRef is not allowlisted/);
  });

  it("rejects an unknown release without a fallback to current catalogs", () => {
    expect(() => resolveScientificProductReleaseBundleV1({
      id: "circleheart/adult-five-wall-integrated",
      version: "1.0.0",
      sha256: "1".repeat(64),
    })).toThrow(/exact SimulationReleaseRef is not allowlisted/);
  });

  it("content-addresses every catalog slot of every allowlisted release", async () => {
    for (const releaseRef of SCIENTIFIC_PRODUCT_ALLOWLISTED_RELEASE_REFS_V1) {
      const bundle = resolveScientificProductReleaseBundleV1(releaseRef);
      for (const slot of ["cases", "controls", "observables", "ui"] as const) {
        expect(bundle.catalogRefs[slot].digestSemantics)
          .toBe("sha256-canonical-json-catalog-slot");
        expect(bundle.catalogRefs[slot].sha256).toBe(
          await sha256CanonicalJsonHex(bundle.catalogs[slot]),
        );
      }
    }
  });

  it("returns immutable bundle, release, catalog refs, and catalog content", () => {
    const bundle = resolveScientificProductReleaseBundleV1(
      SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
    );
    if (!isCurrentScientificProductReleaseBundleV1(bundle)) {
      throw new Error("stable release resolved to a preview bundle");
    }

    expect(Object.isFrozen(bundle)).toBe(true);
    expect(Object.isFrozen(bundle.releaseRef)).toBe(true);
    expect(Object.isFrozen(bundle.catalogRefs)).toBe(true);
    expect(Object.values(bundle.catalogRefs).every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(bundle.catalogs)).toBe(true);
    expect(Object.values(bundle.catalogs).every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(bundle.catalogs.cases.entries)).toBe(true);
    expect(Object.isFrozen(bundle.catalogs.controls.valueDomains)).toBe(true);
    expect(Object.isFrozen(bundle.catalogs.observables.observableRegistry))
      .toBe(true);
    expect(Object.isFrozen(bundle.catalogs.ui.metricPresentations)).toBe(true);

    expect(Reflect.set(bundle.releaseRef, "version", "9.9.9")).toBe(false);
    expect(Reflect.set(bundle.catalogRefs.controls, "sha256", "f".repeat(64)))
      .toBe(false);
    expect(Reflect.set(
      bundle.catalogs.controls.baselineValues,
      "circulation.venous-tone",
      1,
    )).toBe(false);
  });
});
