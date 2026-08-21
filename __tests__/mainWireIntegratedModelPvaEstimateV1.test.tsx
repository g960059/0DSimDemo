import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  LvMvo2ReferenceCardV1,
  PvaReferenceResultV1,
  PvaReferenceV1Page,
} from "@/components/analysis/PvaEstimateV1Page";
import {
  buildMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1,
  evaluateMainWireIntegratedModelLvMvo2ReferenceV1,
  loadMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1,
  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1,
  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MVO2_REFERENCE_HEART_RATE_BPM_V1,
} from "@/engine/myocardium/analysis/MainWireIntegratedModelMvo2ReferenceV1";
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

  it("maps the fixed LV PVA reference to a bounded literature MVO2 reference", () => {
    const reference =
      buildMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1();

    expect(reference.status).toBe("limited");
    if (reference.status !== "limited") throw new Error(reference.reason);
    expect(reference.scope).toBe("canonical-normal-adult-lv-reference");
    expect(reference.ventricleId).toBe("LV");
    expect(reference.pvaSource.pvaEstimateJ).toBe(1.581500908199982);
    expect(reference.pvaSource.pvaEstimateMmHgMl).toBe(11862.265104033708);
    expect(reference.pvaSource.pvaEstimateMmHgMlPer100G).toBe(
      10953.153373992343,
    );
    expect(reference.pvaSource.sensitivity).toEqual({
      systolicAreaOutsideMeasuredRangeFraction: 0.4518868571139322,
      releaseSlopeDifferenceFraction: 0.3165487054843358,
    });
    expect(reference.massReference.myocardialMassG).toBe(108.3);
    expect(reference.massReference.myocardialMassG).toBe(
      Number(
        (
          (reference.massReference.wallMaterialVolumeMl.LVFW +
            reference.massReference.wallMaterialVolumeMl.SEP) *
          reference.massReference.myocardialDensityGPerMl
        ).toFixed(reference.massReference.myocardialMassRoundingDigits),
      ),
    );
    expect(reference.referenceHeartRateBpm).toBe(60);
    expect(reference.oxygenDemand).toEqual({
      pvaDependentMlO2PerBeat: 0.21352077187260673,
      unloadedMlO2PerBeat: 0.02166,
      totalMlO2PerBeat: 0.23518077187260672,
      pvaDependentMlO2PerBeatPer100G: 0.1971567607318622,
      unloadedMlO2PerBeatPer100G: 0.02,
      totalMlO2PerBeatPer100G: 0.2171567607318622,
      totalMlO2PerMinPer100G: 13.029405643911732,
    });
    expect(reference.interpretation).toEqual({
      literatureCoefficientProjectionAvailable: true,
      modelSpecificCalibrationEstablished: false,
      validatedModelPredictionEstablished: false,
      modelPredictedOxygenConsumption: false,
      measuredOxygenConsumption: false,
      scenarioSpecificEstimate: false,
      patientSpecificEstimate: false,
      clinicalDecisionSupport: false,
      rightVentricularEstimateAvailable: false,
      wholeHeartEstimateAvailable: false,
    });
  });

  it("caches the compact MVO2 reference without running a model", () => {
    const first = loadMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1();
    const second = loadMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1();

    expect(second).toBe(first);
  });

  it("keeps RV, altered reference conventions, and overflow unavailable", () => {
    const pvaReference =
      buildMainWireIntegratedModelNormalAdultPvaReferenceV1();
    const lvOutput = pvaReference.outputs.find(
      (output) => output.ventricleId === "LV",
    );
    const rvOutput = pvaReference.outputs.find(
      (output) => output.ventricleId === "RV",
    );
    if (
      lvOutput === undefined ||
      rvOutput === undefined ||
      lvOutput.status !== "limited" ||
      rvOutput.status !== "limited"
    ) {
      throw new Error("Expected compact biventricular PVA reference");
    }
    const fixedInput = {
      pvaOutput: lvOutput,
      referenceHeartRateBpm:
        MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MVO2_REFERENCE_HEART_RATE_BPM_V1,
      lvMyocardialMassG:
        MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_LV_MASS_REFERENCE_V1.myocardialMassG,
    };

    expect(
      evaluateMainWireIntegratedModelLvMvo2ReferenceV1({
        ...fixedInput,
        pvaOutput: rvOutput,
      }),
    ).toMatchObject({ status: "unavailable", ventricleId: "LV" });
    expect(
      evaluateMainWireIntegratedModelLvMvo2ReferenceV1({
        ...fixedInput,
        referenceHeartRateBpm: 75,
      }),
    ).toMatchObject({
      status: "unavailable",
      reason:
        "The heart rate and LV mass must match the fixed normal-adult reference",
    });
    expect(
      evaluateMainWireIntegratedModelLvMvo2ReferenceV1({
        ...fixedInput,
        pvaOutput: {
          ...lvOutput,
          pvaEstimateJ: Number.MAX_VALUE,
        },
      }),
    ).toMatchObject({
      status: "unavailable",
      reason: "The MVO2 reference calculation is not positive and finite",
    });
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
    const mvo2Reference =
      buildMainWireIntegratedModelNormalAdultLvMvo2ReferenceV1();
    const mvo2Markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en/analysis/pva"]}>
        <LvMvo2ReferenceCardV1 reference={mvo2Reference} locale="en" />
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
    expect(pageMarkup).toContain("Show PVA / MVO₂ reference");
    expect(pageMarkup).toContain("research-pva-mvo2-558-573-final");
    expect(pageMarkup).toContain("MVO₂");
    expect(mvo2Markup).toContain('data-testid="mvo2-reference-v1-result"');
    expect(mvo2Markup).toContain("≈ 0.22");
    expect(mvo2Markup).toContain("≈ 13 mL O₂");
    expect(mvo2Markup).toContain("108.3 g");
    expect(mvo2Markup).toContain("Limited literature mapping");
    expect(mvo2Markup).toContain("about 45% systolic-area extrapolation");
    expect(mvo2Markup).toContain(
      "about 32% occlusion–release slope difference",
    );
    expect(mvo2Markup).toContain("PMID 3790043");
    expect(mvo2Markup).toContain("Human heart-disease cohort context");
    expect(mvo2Markup).toContain("canine coefficients");
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
