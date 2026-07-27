import { describe, expect, it } from "vitest";

import {
  createMainWireScientificResearchControlCatalogV0,
  loadMainWireScientificResearchControlCatalogV0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
  createMainWireScientificResearchControlTargetStateV0,
  loadMainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

const EXACT_RELEASE_REF = {
  id: "circleheart/adult-five-wall-noncoronary",
  version: "0.2.0",
  sha256:
    "aa1947dc572b94370044e97efc03e3e62b000657a2fd580be7883d2b0774e48a",
} as const;

describe("main-wire scientific research control catalog V0", () => {
  it("publishes six release-bound broad-envelope controls with canonical provenance", async () => {
    const [catalog, rebuilt] = await Promise.all([
      createMainWireScientificResearchControlCatalogV0(),
      createMainWireScientificResearchControlCatalogV0(),
    ]);

    expect(catalog.catalogSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(rebuilt.catalogSha256).toBe(catalog.catalogSha256);
    expect(catalog.releaseRef).toEqual(EXACT_RELEASE_REF);
    expect(catalog.classification)
      .toBe("research-only-experimental-not-clinical");
    expect(catalog.controls.map(({ controlId }) => controlId))
      .toEqual(MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0);
    expect(MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0)
      .toEqual([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]);

    expect(catalog.controls).toEqual([
      expect.objectContaining({
        controlId: "circulation.systemic-vascular-resistance-scale",
        target: expect.objectContaining({
          resolvedSessionInputPath:
            "resolvedParameters.circulationRuntime.losses.systemicResistance",
          releaseBaselinePath:
            "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.systemicResistance",
          releaseBaselineValue: 1,
          runtimeUnit: "dimensionless-group-resistance-multiplier",
        }),
        valueDomain: {
          kind: "enumerated-broad-research-envelope",
          baseline: 1,
          allowedValues: [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4],
          unit: "scale-from-release-baseline",
          uiScale: "log-like-exact-stops",
        },
      }),
      expect.objectContaining({
        controlId: "circulation.pulmonary-vascular-resistance-scale",
        target: expect.objectContaining({
          resolvedSessionInputPath:
            "resolvedParameters.circulationRuntime.losses.pulmonaryResistance",
          releaseBaselinePath:
            "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.pulmonaryResistance",
          releaseBaselineValue: 0.625,
          runtimeUnit: "dimensionless-group-resistance-multiplier",
        }),
        valueDomain: {
          kind: "enumerated-broad-research-envelope",
          baseline: 1,
          allowedValues: [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4],
          unit: "scale-from-release-baseline",
          uiScale: "log-like-exact-stops",
        },
      }),
      expect.objectContaining({
        controlId: "circulation.venous-tone",
        target: expect.objectContaining({
          releaseBaselineValue: 0.15,
          runtimeUnit: "model-fraction",
        }),
        valueDomain: {
          kind: "enumerated-broad-research-envelope",
          baseline: 0.15,
          allowedValues: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1],
          unit: "model-fraction",
          uiScale: "linear-exact-stops",
        },
        applicationSemantics: "replace-absolute-runtime-value",
      }),
      expect.objectContaining({
        controlId: "circulation.arterial-stiffness",
        target: expect.objectContaining({
          releaseBaselineValue: 0.75,
          runtimeUnit: "model-scale",
        }),
        valueDomain: {
          kind: "enumerated-broad-research-envelope",
          baseline: 0.75,
          allowedValues: [0.4, 0.55, 0.75, 1, 1.5, 2, 3],
          unit: "model-scale",
          uiScale: "log-like-exact-stops",
        },
        applicationSemantics: "replace-absolute-runtime-value",
      }),
      expect.objectContaining({
        controlId: "ventilation.peep-cm-h2o",
        target: expect.objectContaining({
          releaseBaselineValue: 0,
          runtimeUnit: "mmHg",
        }),
        valueDomain: {
          kind: "enumerated-broad-research-envelope",
          baseline: 0,
          allowedValues: [0, 5, 8, 10, 12, 15, 20, 25],
          unit: "cmH2O",
          uiScale: "practice-informed-exact-stops",
        },
        applicationSemantics: "convert-cmH2O-to-mmHg-then-replace",
      }),
      expect.objectContaining({
        controlId: "pericardium.prescribed-fluid-volume-ml",
        target: expect.objectContaining({
          releaseBaselineValue: 0,
          runtimeUnit: "m3",
        }),
        valueDomain: {
          kind: "enumerated-broad-research-envelope",
          baseline: 0,
          allowedValues: [0, 25, 50, 75, 100, 150],
          unit: "mL",
          uiScale: "healthy-capacity-static-occupancy-exact-stops",
        },
        applicationSemantics:
          "convert-mL-to-m3-then-replace-static-occupancy",
      }),
    ]);
    expect(catalog.provenance).toMatchObject({
      releaseBinding: {
        releaseRef: EXACT_RELEASE_REF,
        role: "exact-executable-release-bound-control-domain",
      },
      evidenceSources: [
        expect.objectContaining({
          role: "source-level-load-response-screen-not-clinical-validation",
        }),
        expect.objectContaining({
          role: "mechanistic-common-pericardium-positive-control-source",
        }),
        expect.objectContaining({
          role: "authoritative-runtime-pressure-conversion-semantics",
        }),
        expect.objectContaining({
          role: "clinical-practice-context-for-peep-anchors-not-model-validation",
        }),
        expect.objectContaining({
          role: "pericardial-pressure-volume-context-not-patient-specific-validation",
        }),
      ],
    });
    expect(catalog.claims).toMatchObject({
      researchOnly: true,
      experimental: true,
      officialTrustClaimed: false,
      clinicalDiagnosisClaimed: false,
      clinicalValidationClaimed: false,
      patientSpecificFitClaimed: false,
      arbitraryParameterPatchAccepted: false,
      completeTargetStateRequired: true,
      broadMechanisticPhysiologyExplorationIntended: true,
      numericalConvergenceOutsideValidatedBaselineNotGuaranteed: true,
      parameterSearchPerformed: false,
      parameterFittingPerformed: false,
    });
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog.controls[0].valueDomain.allowedValues))
      .toBe(true);

    const { catalogSha256, ...payload } = jsonCopy(catalog);
    expect(await sha256CanonicalJsonHex(payload)).toBe(catalogSha256);
    await expect(loadMainWireScientificResearchControlCatalogV0(
      jsonCopy(catalog),
    )).resolves.toEqual(catalog);
  });

  it("rejects unknown keys, substituted release data, and rehashed mutations", async () => {
    const catalog = await createMainWireScientificResearchControlCatalogV0();

    const extraTopLevel = jsonCopy(catalog);
    extraTopLevel.fallback = "legacy-knob";
    await expect(loadMainWireScientificResearchControlCatalogV0(extraTopLevel))
      .rejects.toThrow(/exactly keys/);

    const extraNested = jsonCopy(catalog);
    extraNested.controls[0].target.alias = "SVR";
    await expect(loadMainWireScientificResearchControlCatalogV0(extraNested))
      .rejects.toThrow(/exactly match/);

    const wrongRelease = jsonCopy(catalog);
    wrongRelease.releaseRef.version = "0.2.1";
    await expect(loadMainWireScientificResearchControlCatalogV0(wrongRelease))
      .rejects.toThrow(/release 0.2.0/);

    const rehashedMutation = jsonCopy(catalog);
    rehashedMutation.claims.experimental = false;
    const { catalogSha256: ignored, ...mutatedPayload } = rehashedMutation;
    expect(ignored).toBe(catalog.catalogSha256);
    rehashedMutation.catalogSha256 = await sha256CanonicalJsonHex(
      mutatedPayload,
    );
    await expect(
      loadMainWireScientificResearchControlCatalogV0(rehashedMutation),
    ).rejects.toThrow(/release 0.2.0/);
  });
});

describe("main-wire scientific research control target state V0", () => {
  it("creates a complete immutable state with every explicit release baseline", async () => {
    const [baseline, rebuilt] = await Promise.all([
      createMainWireScientificResearchControlBaselineTargetStateV0(),
      createMainWireScientificResearchControlBaselineTargetStateV0(),
    ]);

    expect(baseline.controls)
      .toEqual(MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0);
    expect(Object.keys(baseline.controls).sort()).toEqual(
      [...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0].sort(),
    );
    expect(baseline.releaseRef).toEqual(EXACT_RELEASE_REF);
    expect(baseline.catalogRef.catalogSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(baseline.targetStateSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(rebuilt.targetStateSha256).toBe(baseline.targetStateSha256);
    expect(baseline.classification)
      .toBe("research-only-experimental-not-clinical");
    expect(baseline.provenance.resolution)
      .toBe("complete-target-state-not-patch");
    expect(baseline.claims).toMatchObject({
      completeTargetState: true,
      baselineValuesExplicit: true,
      partialPatchAccepted: false,
      arbitraryParameterPatchAccepted: false,
      implicitLastWriteWinsApplied: false,
      researchOnly: true,
      experimental: true,
      clinicalDiagnosisClaimed: false,
      clinicalValidationClaimed: false,
      patientSpecificFitClaimed: false,
    });
    expect(Object.isFrozen(baseline)).toBe(true);
    expect(Object.isFrozen(baseline.controls)).toBe(true);

    const { targetStateSha256, ...payload } = jsonCopy(baseline);
    expect(await sha256CanonicalJsonHex(payload)).toBe(targetStateSha256);
    await expect(loadMainWireScientificResearchControlTargetStateV0(
      jsonCopy(baseline),
    )).resolves.toEqual(baseline);
  });

  it("accepts every enumerated scale without exposing arbitrary values", async () => {
    for (const systemicScale of
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0) {
      for (const pulmonaryScale of
        MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0) {
        const state =
          await createMainWireScientificResearchControlTargetStateV0({
            ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
            "circulation.systemic-vascular-resistance-scale": systemicScale,
            "circulation.pulmonary-vascular-resistance-scale": pulmonaryScale,
          });
        expect(state.controls).toEqual({
          ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
          "circulation.systemic-vascular-resistance-scale": systemicScale,
          "circulation.pulmonary-vascular-resistance-scale": pulmonaryScale,
        });
      }
    }

    for (const controlId of MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0) {
      const domain =
        MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[controlId];
      for (const endpoint of [
        domain.allowedValues[0],
        domain.allowedValues[domain.allowedValues.length - 1],
      ]) {
        const state =
          await createMainWireScientificResearchControlTargetStateV0({
            ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
            [controlId]: endpoint,
          });
        expect(state.controls[controlId]).toBe(endpoint);
      }
    }
  });

  it("rejects partial, additional, and out-of-domain target values", async () => {
    await expect(createMainWireScientificResearchControlTargetStateV0({
      "circulation.systemic-vascular-resistance-scale": 1,
    })).rejects.toThrow(/exactly keys/);

    await expect(createMainWireScientificResearchControlTargetStateV0({
      ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
      "legacy.extra-control": 1,
    })).rejects.toThrow(/exactly keys/);

    await expect(createMainWireScientificResearchControlTargetStateV0({
      ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
      "circulation.systemic-vascular-resistance-scale": 1.1,
    })).rejects.toThrow(/must be one of/);
  });

  it("rejects every additional envelope key and content-address mismatch", async () => {
    const baseline =
      await createMainWireScientificResearchControlBaselineTargetStateV0();

    const mutations = [
      (value: ReturnType<typeof jsonCopy>) => {
        value.fallback = true;
      },
      (value: ReturnType<typeof jsonCopy>) => {
        value.controls["legacy.extra-control"] = 1;
      },
      (value: ReturnType<typeof jsonCopy>) => {
        delete value.controls[
          "circulation.pulmonary-vascular-resistance-scale"
        ];
      },
      (value: ReturnType<typeof jsonCopy>) => {
        value.releaseRef.version = "0.2.1";
      },
      (value: ReturnType<typeof jsonCopy>) => {
        value.catalogRef.catalogSha256 = "0".repeat(64);
      },
      (value: ReturnType<typeof jsonCopy>) => {
        value.provenance.patchOrder = "last-write-wins";
      },
      (value: ReturnType<typeof jsonCopy>) => {
        value.claims.clinicalUseAllowed = true;
      },
      (value: ReturnType<typeof jsonCopy>) => {
        value.targetStateSha256 = "0".repeat(64);
      },
    ];

    for (const mutate of mutations) {
      const candidate = jsonCopy(baseline);
      mutate(candidate);
      await expect(
        loadMainWireScientificResearchControlTargetStateV0(candidate),
      ).rejects.toThrow();
    }

    const rehashedMutation = jsonCopy(baseline);
    rehashedMutation.claims.experimental = false;
    const { targetStateSha256: ignored, ...mutatedPayload } = rehashedMutation;
    expect(ignored).toBe(baseline.targetStateSha256);
    rehashedMutation.targetStateSha256 = await sha256CanonicalJsonHex(
      mutatedPayload,
    );
    await expect(
      loadMainWireScientificResearchControlTargetStateV0(rehashedMutation),
    ).rejects.toThrow(/exactly match/);
  });
});

function jsonCopy<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}
