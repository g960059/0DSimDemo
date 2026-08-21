import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  PvaReferenceResultV1,
  PvaReferenceV1Page,
} from "@/components/analysis/PvaEstimateV1Page";
import {
  buildMainWireIntegratedModelNormalAdultPvaReferenceV1,
  evaluateMainWireIntegratedModelPvaOutputV1,
  loadMainWireIntegratedModelNormalAdultPvaReferenceV1,
  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1,
} from "@/engine/myocardium/analysis/MainWireIntegratedModelPvaEstimateV1";
import i18n from "@/i18n";

describe("method-specific PVA reference V1", () => {
  it("reproduces the compact normal-adult LV and RV energy decomposition", () => {
    const reference = buildMainWireIntegratedModelNormalAdultPvaReferenceV1();

    expect(reference.status).toBe("limited");
    expect(reference.scope).toBe("canonical-normal-adult-reference");
    expect(reference.targetSurface).toBe(
      "precomputed-completed-protocol-reference",
    );
    expect(reference.pressureBasis).toBe("ventricular-transmural");
    expect(reference.outputs).toHaveLength(2);
    expect(
      reference.outputs.map((output) =>
        output.status === "limited"
          ? {
              ventricleId: output.ventricleId,
              externalWorkJ: output.externalWorkJ,
              peJ: output.potentialEnergyEquivalentJ,
              pvaJ: output.pvaEstimateJ,
            }
          : output,
      ),
    ).toEqual([
      {
        ventricleId: "LV",
        externalWorkJ: 1.2864541324474803,
        peJ: 0.2950467757525017,
        pvaJ: 1.581500908199982,
      },
      {
        ventricleId: "RV",
        externalWorkJ: 0.42431207785891467,
        peJ: 0.16408974762922215,
        pvaJ: 0.5884018254881368,
      },
    ]);
  });

  it("keeps generic, clinical, live, and MVO2 claims false", () => {
    const interpretation =
      buildMainWireIntegratedModelNormalAdultPvaReferenceV1().interpretation;

    expect(interpretation.methodSpecificEstimateAvailable).toBe(true);
    expect(interpretation.scenarioSpecificEstimate).toBe(false);
    expect(interpretation.genericPvaEstablished).toBe(false);
    expect(interpretation.clinicalPvaEstablished).toBe(false);
    expect(interpretation.liveSingleBeatOutput).toBe(false);
    expect(interpretation.myocardialOxygenConsumptionEstablished).toBe(false);
  });

  it("returns unavailable for a non-finite compact reference", () => {
    const invalid = {
      ...MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_INPUTS_V1[0],
      externalWorkJ: Number.NaN,
    };

    expect(evaluateMainWireIntegratedModelPvaOutputV1(invalid)).toMatchObject({
      ventricleId: "LV",
      status: "unavailable",
      reason: "PVA reference contains a non-finite value",
    });
  });

  it("returns unavailable when finite inputs overflow the energy projection", () => {
    const overflow = {
      ...MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_INPUTS_V1[0],
      systolicEndpoint: {
        ...MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_INPUTS_V1[0]
          .systolicEndpoint,
        volumeMl: Number.MAX_VALUE,
      },
    };

    expect(evaluateMainWireIntegratedModelPvaOutputV1(overflow)).toMatchObject({
      ventricleId: "LV",
      status: "unavailable",
      reason: "PVA energy decomposition is not positive and finite",
    });
  });

  it("loads a precomputed reference and retains immutable research provenance", () => {
    const first = loadMainWireIntegratedModelNormalAdultPvaReferenceV1();
    const second = loadMainWireIntegratedModelNormalAdultPvaReferenceV1();

    expect(second).toBe(first);
    expect(first.provenance).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1,
    );
    expect(first.provenance).toMatchObject({
      sourceResearchTag: "research-pva-mvo2-558-573-final",
      sourceCommitSha: "7fa68a21607107db0e766c3449788d9d90d59e60",
      sourceStudyId:
        "main-wire-integrated-model-phase-wise-pva-qualification-v2",
      pressureBasis: "ventricular-transmural",
      externalWorkSource: "accepted-periodic-pv-path-work-research-reference",
    });
  });

  it("renders the reference values, PE geometry, provenance, and claim boundary", async () => {
    await i18n.changeLanguage("en");
    const reference = buildMainWireIntegratedModelNormalAdultPvaReferenceV1();
    const resultMarkup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en/analysis/pva"]}>
        <PvaReferenceResultV1 reference={reference} locale="en" />
      </MemoryRouter>,
    );
    const pageMarkup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en/analysis/pva"]}>
        <PvaReferenceV1Page />
      </MemoryRouter>,
    );

    expect(resultMarkup).toContain('data-testid="pva-reference-v1-result"');
    expect(resultMarkup).toContain("1.582");
    expect(resultMarkup).toContain("0.588");
    expect(resultMarkup).toContain("Limited estimate");
    expect(resultMarkup).toContain("Measured volume range");
    expect(resultMarkup).toContain("not a PV-loop PVA rendering");
    expect(resultMarkup).toContain("Passive-reference subtraction: 0.000 J");
    expect(resultMarkup).toContain("45% of the systolic area");
    expect(resultMarkup).toContain("4.1% at finer phase resolution");
    expect(pageMarkup).toContain('data-testid="pva-reference-v1-page"');
    expect(pageMarkup).toContain("Show PVA reference");
    expect(pageMarkup).toContain("research-pva-mvo2-558-573-final");
    expect(pageMarkup).toContain("MVO₂");
  });

  it("reflects an unavailable aggregate in the top-level status badge", async () => {
    await i18n.changeLanguage("en");
    const limited = buildMainWireIntegratedModelNormalAdultPvaReferenceV1();
    const unavailableOutput = evaluateMainWireIntegratedModelPvaOutputV1({
      ...MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_INPUTS_V1[0],
      externalWorkJ: Number.NaN,
    });
    const unavailable = {
      ...limited,
      status: "unavailable" as const,
      outputs: Object.freeze([unavailableOutput]),
    };

    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en/analysis/pva"]}>
        <PvaReferenceResultV1 reference={unavailable} locale="en" />
      </MemoryRouter>,
    );

    expect(markup).toContain("Unavailable");
    expect(markup).not.toContain("Limited estimate");
  });
});
