import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  PvaEstimateResultV1,
  PvaEstimateV1Page,
} from "@/components/analysis/PvaEstimateV1Page";
import {
  buildMainWireIntegratedModelNormalAdultPvaAnalysisV1,
  evaluateMainWireIntegratedModelPvaOutputV1,
  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_INPUTS_V1,
  runMainWireIntegratedModelNormalAdultPvaAnalysisOnDemandV1,
} from "@/engine/myocardium/analysis/MainWireIntegratedModelPvaEstimateV1";
import i18n from "@/i18n";

describe("method-specific PVA estimate V1", () => {
  it("reproduces the compact normal-adult LV and RV energy decomposition", () => {
    const analysis = buildMainWireIntegratedModelNormalAdultPvaAnalysisV1();

    expect(analysis.status).toBe("limited");
    expect(analysis.scope).toBe("canonical-normal-adult-reference");
    expect(analysis.pressureBasis).toBe("ventricular-transmural");
    expect(analysis.outputs).toHaveLength(2);
    expect(
      analysis.outputs.map((output) =>
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
      buildMainWireIntegratedModelNormalAdultPvaAnalysisV1().interpretation;

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

  it("runs only on demand and reuses the compact cached result", async () => {
    const first =
      await runMainWireIntegratedModelNormalAdultPvaAnalysisOnDemandV1();
    const second =
      await runMainWireIntegratedModelNormalAdultPvaAnalysisOnDemandV1();

    expect(second).toBe(first);
  });

  it("renders the limited values, method, extrapolation, and claim boundary", async () => {
    await i18n.changeLanguage("en");
    const analysis = buildMainWireIntegratedModelNormalAdultPvaAnalysisV1();
    const resultMarkup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en/analysis/pva"]}>
        <PvaEstimateResultV1 analysis={analysis} locale="en" />
      </MemoryRouter>,
    );
    const pageMarkup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en/analysis/pva"]}>
        <PvaEstimateV1Page />
      </MemoryRouter>,
    );

    expect(resultMarkup).toContain('data-testid="pva-estimate-v1-result"');
    expect(resultMarkup).toContain("1.582");
    expect(resultMarkup).toContain("0.588");
    expect(resultMarkup).toContain("Limited estimate");
    expect(resultMarkup).toContain("Measured volume range");
    expect(resultMarkup).toContain("45% of the systolic area");
    expect(resultMarkup).toContain("4.1% at finer phase resolution");
    expect(pageMarkup).toContain('data-testid="pva-estimate-v1-page"');
    expect(pageMarkup).toContain("Show PVA estimate");
    expect(pageMarkup).toContain("MVO₂");
  });
});
