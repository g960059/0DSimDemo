import { describe, expect, it } from "vitest";

import {
  createMainWireScientificResearchControlCatalogV0,
  loadMainWireScientificResearchControlCatalogV0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
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
    "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4",
} as const;

describe("main-wire scientific research control catalog V0", () => {
  it("publishes only release-bound SVR/PVR scales with canonical provenance", async () => {
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
      .toEqual([0.75, 1, 4 / 3]);

    expect(catalog.controls).toEqual([
      expect.objectContaining({
        controlId: "circulation.systemic-vascular-resistance-scale",
        target: {
          resolvedSessionInputPath:
            "resolvedParameters.circulationRuntime.losses.systemicResistance",
          releaseBaselinePath:
            "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.systemicResistance",
          releaseBaselineValue: 1,
        },
        valueDomain: {
          kind: "enumerated-multiplicative-scale",
          baseline: 1,
          allowedValues: [0.75, 1, 4 / 3],
          unit: "scale-from-release-baseline",
        },
      }),
      expect.objectContaining({
        controlId: "circulation.pulmonary-vascular-resistance-scale",
        target: {
          resolvedSessionInputPath:
            "resolvedParameters.circulationRuntime.losses.pulmonaryResistance",
          releaseBaselinePath:
            "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.pulmonaryResistance",
          releaseBaselineValue: 0.625,
        },
        valueDomain: {
          kind: "enumerated-multiplicative-scale",
          baseline: 1,
          allowedValues: [0.75, 1, 4 / 3],
          unit: "scale-from-release-baseline",
        },
      }),
    ]);
    expect(catalog.provenance).toMatchObject({
      releaseBinding: {
        releaseRef: EXACT_RELEASE_REF,
        role: "exact-executable-release-bound-control-domain",
      },
      sourceLevelEvidence: {
        envelopeSha256:
          "4d7283c681d16a173c74f25273e6bd8c87538f50513936e8ed4e889fb4e1862b",
        role:
          "source-level-structural-response-screen-not-release-bound-validation",
      },
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
  it("creates a complete immutable neutral state with both baselines at one", async () => {
    const [baseline, rebuilt] = await Promise.all([
      createMainWireScientificResearchControlBaselineTargetStateV0(),
      createMainWireScientificResearchControlBaselineTargetStateV0(),
    ]);

    expect(baseline.controls).toEqual({
      "circulation.systemic-vascular-resistance-scale": 1,
      "circulation.pulmonary-vascular-resistance-scale": 1,
    });
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
      baselineScaleIsOne: true,
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
            "circulation.systemic-vascular-resistance-scale": systemicScale,
            "circulation.pulmonary-vascular-resistance-scale": pulmonaryScale,
          });
        expect(state.controls).toEqual({
          "circulation.systemic-vascular-resistance-scale": systemicScale,
          "circulation.pulmonary-vascular-resistance-scale": pulmonaryScale,
        });
      }
    }
  });

  it("rejects partial, additional, and out-of-domain target values", async () => {
    await expect(createMainWireScientificResearchControlTargetStateV0({
      "circulation.systemic-vascular-resistance-scale": 1,
    })).rejects.toThrow(/exactly keys/);

    await expect(createMainWireScientificResearchControlTargetStateV0({
      "circulation.systemic-vascular-resistance-scale": 1,
      "circulation.pulmonary-vascular-resistance-scale": 1,
      "circulation.venous-tone-scale": 1,
    })).rejects.toThrow(/exactly keys/);

    await expect(createMainWireScientificResearchControlTargetStateV0({
      "circulation.systemic-vascular-resistance-scale": 1.1,
      "circulation.pulmonary-vascular-resistance-scale": 1,
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
        value.controls["circulation.venous-tone-scale"] = 1;
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
