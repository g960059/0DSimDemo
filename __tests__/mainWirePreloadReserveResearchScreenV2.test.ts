import { describe, expect, it } from "vitest";
import baseline from "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import { screenMainWirePreloadReserveResponseV2 } from "@/analysis/policies/mainWire/MainWirePreloadReserveResearchScreenV2";
import { mainWireStandard70PreloadReserveDirectionalResponsePassedV1 } from "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";

const response = { ...baseline.preloadReserve.right.hypovolemic, endpointDirection: "hypovolemic" as const };
function coherent(overrides: Partial<typeof response> = {}) {
  const r = { ...response, ...overrides };
  const dp = r.baselineFillingPressureMmHg - r.endpointFillingPressureMmHg;
  const dq = r.baselineCardiacOutputLPerMin - r.endpointCardiacOutputLPerMin;
  const dv = r.baselineEndDiastolicVolumeMl - r.endpointEndDiastolicVolumeMl;
  const dtm = r.baselineEndDiastolicTransmuralPressureMmHg - r.endpointEndDiastolicTransmuralPressureMmHg;
  return { ...r, directionalFillingPressureChangeMmHg: dp, directionalCardiacOutputChangeLPerMin: dq,
    directionalCardiacOutputChangeFraction01: dq / r.baselineCardiacOutputLPerMin, cardiacOutputSlopeLPerMinPerMmHg: dq / dp,
    directionalEndDiastolicVolumeChangeMl: dv, directionalEndDiastolicVolumeChangeFraction01: dv / r.baselineEndDiastolicVolumeMl,
    directionalEndDiastolicTransmuralPressureChangeMmHg: dtm, endDiastolicVolumeResponseMlPerMmHg: dv / dtm };
}
describe("prospective preload response screen without a normal-pressure excursion claim", () => {
  it("keeps the historical result separate and never grants qualification or admission", () => {
    const r = coherent({ endpointFillingPressureMmHg: response.baselineFillingPressureMmHg - .5 });
    expect(mainWireStandard70PreloadReserveDirectionalResponsePassedV1(r)).toBe(false);
    const screen = screenMainWirePreloadReserveResponseV2(r);
    expect(screen.status).toBe("directional-screen-passed");
    expect(screen.historicalPressureAmplitude.passed).toBe(false);
    expect(screen.pressureCoordinateResolved).toBe(false);
    expect(screen.numericalQualificationEstablished).toBe(false);
    expect(screen.baselineAdmissionEstablished).toBe(false);
  });
  it.each([0, -.1])("rejects nonpositive pressure direction %s", delta => {
    expect(screenMainWirePreloadReserveResponseV2(coherent({ endpointFillingPressureMmHg: response.baselineFillingPressureMmHg - delta })).status)
      .not.toBe("directional-screen-passed");
  });
  it("does not equate a finite huge secant with a resolved pressure coordinate", () => {
    const r = screenMainWirePreloadReserveResponseV2(coherent({ endpointFillingPressureMmHg: response.baselineFillingPressureMmHg - 1e-12 }));
    expect(r.status).toBe("directional-screen-passed");
    expect(r.pressureCoordinateResolved).toBe(false);
    expect(r.baselineAdmissionEstablished).toBe(false);
  });
  it.each(Object.keys(response).filter(key => typeof response[key as keyof typeof response] === "number"))
    ("rejects nonfinite scalar %s", key => {
      for (const value of [NaN, Infinity, -Infinity]) {
        expect(screenMainWirePreloadReserveResponseV2({ ...response, [key]: value }).status).toBe("unresolved");
      }
    });
  it.each([
    { endpointCardiacOutputLPerMin: response.baselineCardiacOutputLPerMin - .01 },
    { endpointCardiacOutputLPerMin: response.baselineCardiacOutputLPerMin * .99 },
    { endpointFillingPressureMmHg: response.baselineFillingPressureMmHg - 1000 },
    { endpointEndDiastolicVolumeMl: response.baselineEndDiastolicVolumeMl - .1 },
    { endpointEndDiastolicVolumeMl: response.baselineEndDiastolicVolumeMl * .99 },
    { endpointEndDiastolicTransmuralPressureMmHg: response.baselineEndDiastolicTransmuralPressureMmHg - .1 },
    { endpointEndDiastolicTransmuralPressureMmHg: response.baselineEndDiastolicTransmuralPressureMmHg + 1 },
  ])("retains response floors for coherent endpoints %j", overrides => {
    expect(screenMainWirePreloadReserveResponseV2(coherent(overrides)).status).toBe("response-not-supported");
  });
  it("rejects inconsistent direction, redundant deltas and endpoint signs", () => {
    expect(screenMainWirePreloadReserveResponseV2({ ...response, endpointDirection: "hypervolemic" }).status).toBe("unresolved");
    expect(screenMainWirePreloadReserveResponseV2({ ...response, endpointFillingPressureMmHg: response.baselineFillingPressureMmHg + 1 }).status).toBe("unresolved");
    const tiny = coherent({ endpointFillingPressureMmHg: response.baselineFillingPressureMmHg - 1e-12 });
    expect(screenMainWirePreloadReserveResponseV2({ ...tiny,
      endpointFillingPressureMmHg: response.baselineFillingPressureMmHg + 1e-12 }).status).toBe("unresolved");
  });
});
