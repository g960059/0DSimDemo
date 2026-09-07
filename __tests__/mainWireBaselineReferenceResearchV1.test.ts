import { describe, expect, it, vi } from "vitest";
import { MainWireIntegratedTypedAuthoritySessionV1 } from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import baseline from "@/data/model-baselines/standard70-launch-baseline.json";
import { baselineRelativeParameterDomainV1, currentMainWireBaselineHeadroomV1,
  mainWireBaselineReferenceScreenV1, assertMainWireBaselineReferenceJobFieldsV1 } from "@/analysis/policies/mainWire/MainWireBaselineReferenceDesignV1";
import { buildNodes } from "@/engine/core/topology";
import { vascularPvLawFromNodeV1 } from "@/engine/core/circulationGraphKernelV1";
import { complianceFromPtm, ptmFromStressedVolume, stressedVolumeFromPtm } from "@/engine/vascularPv";
import { createMainWireBaselineReferenceResearchV1,
  MainWireBaselineReferenceResearchSessionV1 } from "@/engine/myocardium/experiments/MainWireBaselineReferenceResearchV1";
import { createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type { MainWireIntegratedModelRuntimeV3 } from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import { restoreMainWireIntegratedModelStandard70V1, checkpointMainWireIntegratedModelStandard70V1 } from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import { checkpointMainWireIntegratedModelV3, restoreMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import { warmStartMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import { readMainWireEjectionMaterialV1, recordMainWireFillingMaterialCycleV1 } from "@/analysis/methods/mainWire/MainWireEjectionMaterialReadbackV1";
import { evaluateLand2017ContinuousOutput } from "@/engine/myocardium/myofilament/land2017";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1 as sourceMaterial } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { runMainWireIntegratedModelRegularSinusAllOffCycleV3, createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3 as Fixture } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

const inputs = baseline.candidateInputs;
const unitActive = { ...inputs.mechanismResearchInputs,
  chamberMechanics: { ...inputs.mechanismResearchInputs.chamberMechanics,
    activeTensionScaleByWall: { LA: 1, LVFW: 1, SEP: 1, RVFW: 1, RA: 1 } },
} as MainWireIntegratedModelMechanismResearchInputsV3;
const request = { hemodynamicResearchInputs: inputs.hemodynamicResearchInputs,
  mechanismResearchInputs: unitActive,
  parameters: { ventricularTrefPa: 158_400, systemicArterialComplianceScale: 1 } };

describe("baseline reference parameter ownership and intervention headroom", () => {
  it("retains outer progress and requested target when a later 1 ms subinterval fails", () => {
    const target = createMainWireBaselineReferenceResearchV1(request);
    const session = new MainWireBaselineReferenceResearchSessionV1(target, target.cold.acceptedState, undefined, .001);
    const start = session.currentAcceptedState();
    const prototype = MainWireIntegratedTypedAuthoritySessionV1.prototype;
    const original = prototype.advanceStructuralAnalysisToPresentationTimeV1;
    let calls = 0;
    const spy = vi.spyOn(prototype, "advanceStructuralAnalysisToPresentationTimeV1")
      .mockImplementation(function(this: MainWireIntegratedTypedAuthoritySessionV1, time: number) {
        if (++calls === 1) return original.call(this, time);
        const state = this.currentAcceptedState();
        return { status: "failed", reason: "candidate-time-did-not-advance", message: "injected",
          acceptedTimeSec: state.acceptedTimeSec, acceptedRevision: state.revision,
          partiallyAdvanced: false, internalAcceptedSubstepCount: 0, requestedPresentationTimeSec: time };
      });
    try {
      const advance = session.advanceStructuralAnalysisToPresentationTimeV1(start.acceptedTimeSec + .008);
      expect(advance.status).toBe("failed");
      if (advance.status !== "failed") throw new Error("missing injected failure");
      expect(advance.requestedPresentationTimeSec).toBe(start.acceptedTimeSec + .008);
      expect(advance.partiallyAdvanced).toBe(true);
      expect(advance.internalAcceptedSubstepCount).toBeGreaterThanOrEqual(1);
      expect(advance.substeps?.length).toBe(advance.internalAcceptedSubstepCount);
      expect(advance.acceptedTimeSec).toBe(start.acceptedTimeSec + .001);
    } finally { spy.mockRestore(); }
  });

  it("carries 1 ms numerical stepping through both reserve fork types without changing the construction", () => {
    const target = createMainWireBaselineReferenceResearchV1(request);
    const source = new MainWireBaselineReferenceResearchSessionV1(target, target.cold.acceptedState, undefined, .001);
    const fixed = source.forkAtFixedGlobalTotalBloodVolume(inputs.hemodynamicResearchInputs.totalBloodVolumeMl);
    const responsive = fixed.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(inputs.hemodynamicResearchInputs.totalBloodVolumeMl);
    for (const session of [source, fixed, responsive]) {
      expect(session.researchNumericalStepSec).toBe(.001);
      const start = session.currentAcceptedState();
      const advance = session.advanceStructuralAnalysisToPresentationTimeV1(start.acceptedTimeSec + .008);
      expect(advance.status).toBe("advanced");
      if (advance.status !== "advanced") throw new Error("missing advance");
      expect(advance.internalAcceptedSubstepCount).toBeGreaterThanOrEqual(8);
      expect(advance.acceptedRevisionSpanFromPrevious).toBe(advance.acceptedRevision - start.revision);
      expect(advance.substeps.length).toBe(advance.internalAcceptedSubstepCount);
      let previous = start.acceptedTimeSec;
      for (const step of advance.substeps) {
        expect(step.acceptedTimeSec - previous).toBeGreaterThan(0);
        expect(step.acceptedTimeSec - previous).toBeLessThanOrEqual(.001 + 1e-12);
        previous = step.acceptedTimeSec;
      }
      expect(session.advanceStructuralAnalysisToPresentationTimeV1(advance.acceptedTimeSec).status).toBe("already-at-target");
    }
    expect(() => new MainWireBaselineReferenceResearchSessionV1(target, target.cold.acceptedState, undefined, .003)).toThrow(/numerical step/);
  });

  it.each([.8,1])("binds research Ca peak %s to the actual exact event pulse while retaining its floor", peak => {
    const a = createMainWireBaselineReferenceResearchV1(request);
    const b = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularPeakCalciumUM: peak, ventricularDiastolicCalciumUM: .11 });
    expect(b.researchLandParameters).toEqual(a.researchLandParameters);
    expect(b.rhythm.configuration.calciumParametersByWall.LA).toEqual(a.rhythm.configuration.calciumParametersByWall.LA);
    expect(b.researchClaim.calciumSourceFitRetained).toBe(false);
    expect(b.researchParameterIdentity).not.toBe(a.researchParameterIdentity);
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(b as unknown as Fixture,
      b.cold.acceptedState, 1, .002);
    const ca = run.traceSamples.map(s => s.freeCalciumUMByWall.LVFW);
    expect(Math.min(...ca)).toBeCloseTo(.11, 4);
    expect(Math.max(...ca)).toBeCloseTo(peak, 4);
    expect(run.oneComposedCalciumOwnerOnly).toBe(true);
  },30_000);

  it.each([NaN,Infinity,0,.39,1.21])("rejects invalid Ca peak %s before construction", peak => {
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularPeakCalciumUM: peak })).toThrow(/Ca peak/);
  });
  it("owns a joint affinity transfer without changing source Ca, other kinetics, or passive laws", () => {
    const a = createMainWireBaselineReferenceResearchV1(request);
    const calibration = { caT50RefUM: .6, beta1UM: -1.2 };
    const b = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularAffinityCalibration: calibration });
    expect(b.researchLandParameters.values).toEqual({ ...a.researchLandParameters.values,
      CaT50Ref: .6, beta1: -1.2 });
    expect(b.researchLandParameters.derived).toEqual(a.researchLandParameters.derived);
    expect(b.rhythm).toEqual(a.rhythm);
    expect(b.coronaryStepInput.calciumDriveParams).toEqual(a.coronaryStepInput.calciumDriveParams);
    expect(b.researchClaim.lengthDependentCalciumSensitivityChanged).toBe(true);
    expect(b.researchClaim.clinicalNormality).toBe(false);
    expect(b.researchParameterIdentity).not.toBe(a.researchParameterIdentity);
    expect(b.provider.parameterIdentityHash).not.toBe(a.provider.parameterIdentityHash);
    calibration.beta1UM = -2;
    expect(b.researchAffinityCalibration?.beta1UM).toBe(-1.2);
  });

  it.each([
    { caT50RefUM: NaN, beta1UM: -1.2 },
    { caT50RefUM: .6, beta1UM: Infinity },
    { caT50RefUM: .49, beta1UM: -1.2 },
    { caT50RefUM: .6, beta1UM: .1 },
    { caT50RefUM: .6, beta1UM: -2.5 },
    { caT50RefUM: .6, beta1UM: -1.2, invented: 1 },
  ])("rejects invalid affinity calibration before numerical work (%j)", calibration => {
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularAffinityCalibration: calibration })).toThrow(/affinity calibration/);
  });

  it("does not silently add affinity to baseline fitting or compose two slope owners", () => {
    const calibration = { caT50RefUM: .6, beta1UM: -1.2 };
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularAffinityCalibration: calibration })).toThrow(/not admitted baseline fit/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularAffinityCalibration: calibration, ventricularLengthSensitivityScale: 1 })).toThrow(/duplicate owners/);
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...mainWireBaselineReferenceScreenV1()[0]!,
      ventricularAffinityCalibration: { ...calibration, arbitrary: 2 } })).toThrow(/affinity calibration fields/);
  });
  it("rejects a nonfinite or nonpositive readback period before advancing the copy", () => {
    const target = createMainWireBaselineReferenceResearchV1(request);
    const copy = new MainWireBaselineReferenceResearchSessionV1(target, target.cold.acceptedState);
    const before = structuredClone(copy.currentAcceptedState());
    for (const period of [0, -1, NaN, Infinity]) {
      expect(() => recordMainWireFillingMaterialCycleV1(copy, target.researchLandSlackStretch, period))
        .toThrow(/invalid filling readback cycle length/);
    }
    expect(copy.currentAcceptedState()).toEqual(before);
  });

  it("binds a pericardial capacity contrast to the existing owner without changing myocardial inputs", () => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const varied = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      mechanismResearchInputs: { ...unitActive, pericardium: { ...unitActive.pericardium,
        referenceCapacityScale: 1.05 } } });
    expect(varied.researchLandParameters).toEqual(source.researchLandParameters);
    expect(varied.rhythm).toEqual(source.rhythm);
    expect(varied.mechanismResearchInputs.chamberMechanics).toEqual(source.mechanismResearchInputs.chamberMechanics);
    expect(varied.researchParameterIdentity).not.toBe(source.researchParameterIdentity);
    expect(varied.mechanismResearchInputs.pericardium)
      .toEqual({ ...source.mechanismResearchInputs.pericardium, referenceCapacityScale: 1.05 });
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...mainWireBaselineReferenceScreenV1()[0]!,
      pericardialReferenceCapacityScale: 1.05 })).not.toThrow();
  });

  it.each([false, true])("retains research forks without changing them when sampling a fixed-tone copy (start at capture: %s)", atCapture => {
    const target = createMainWireBaselineReferenceResearchV1(request);
    const forks: MainWireBaselineReferenceResearchSessionV1[] = [];
    const source = new MainWireBaselineReferenceResearchSessionV1(target, target.cold.acceptedState,
      branch => forks.push(branch));
    const first = source.forkAtFixedGlobalTotalBloodVolume(inputs.hemodynamicResearchInputs.totalBloodVolumeMl);
    if (atCapture) {
      const captureTime = first.currentAcceptedState().composedRhythm.regularAtrialSourceState!.nextActivationTimeSec;
      expect(first.advanceStructuralAnalysisToPresentationTimeV1(captureTime).status).toBe("advanced");
    }
    const fixed = first.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(inputs.hemodynamicResearchInputs.totalBloodVolumeMl);
    expect(forks).toEqual([first, fixed]);
    const before = structuredClone(fixed.currentAcceptedState());
    const readback = recordMainWireFillingMaterialCycleV1(
      new MainWireBaselineReferenceResearchSessionV1(target, fixed.currentAcceptedState()),
      target.researchLandSlackStretch, target.cycleLengthSec);
    expect(fixed.currentAcceptedState()).toEqual(before);
    expect(readback.completedBeats).toHaveLength(2);
    expect(readback.samples.length).toBeGreaterThan(800);
    expect(readback.samples.every(s => Math.abs(s.material.lvPressureReconstructionErrorMmHg) < 1e-8)).toBe(true);
    expect(readback.dedicatedNumericalQualification).toBe(false);
    expect(readback.completedBeats[1]!.startTimeSec).toBe(readback.completedBeats[0]!.endTimeSec);
  }, 30_000);

  it("isolates the existing left-atrial amplitude input without altering ventricular material or source Ca", () => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const varied = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      mechanismResearchInputs: { ...unitActive, chamberMechanics: { ...unitActive.chamberMechanics,
        activeTensionScaleByWall: { ...unitActive.chamberMechanics.activeTensionScaleByWall, LA: .8 } } } });
    expect(varied.researchLandParameters).toEqual(source.researchLandParameters);
    expect(varied.rhythm).toEqual(source.rhythm);
    expect(varied.researchParameterIdentity).not.toBe(source.researchParameterIdentity);
    expect(varied.provider.parameterIdentityHash).not.toBe(source.provider.parameterIdentityHash);
    expect(varied.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall)
      .toEqual({ ...source.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, LA: .8 });
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...mainWireBaselineReferenceScreenV1()[0]!,
      leftAtrialActiveScale: .8 })).not.toThrow();
  });
  it("does not manufacture more range by showing the current baseline as one", () => {
    const h = currentMainWireBaselineHeadroomV1();
    expect(h.activeTension.availableIncreaseFraction).toBeCloseTo(1.33 / 1.32 - 1, 14);
    expect(h.activeTension.relativeMaximum).toBeLessThan(1.01);
    expect(h.arterialStiffness.availableIncreaseFraction).toBeCloseTo(1.5 / 1.42 - 1, 14);
    expect(baselineRelativeParameterDomainV1(158400, 118800, 198000).relativeMaximum).toBe(1.25);
    expect(baselineRelativeParameterDomainV1(158400, 118800, 198000).claim)
      .toBe("declared-coordinate-range-only-not-physiological-reserve");
    expect(() => baselineRelativeParameterDomainV1(0, 0, 1)).toThrow();
    expect(() => baselineRelativeParameterDomainV1(1, .8, .9)).toThrow();
  });

  it("predeclares balanced amplitude/compliance contrasts without changing HR or preload", () => {
    const jobs = mainWireBaselineReferenceScreenV1();
    expect(jobs).toHaveLength(9);
    expect(new Set(jobs.map(j => j.id)).size).toBe(9);
    expect(jobs.every(j => j.heartRateBpm === 70)).toBe(true);
    expect(jobs.some(j => j.parameters.ventricularTrefPa === 126720)).toBe(true);
    expect(jobs.some(j => j.parameters.ventricularTrefPa === 190080)).toBe(true);
    expect(() => jobs.forEach(assertMainWireBaselineReferenceJobFieldsV1)).not.toThrow();
  });

  it("rejects unsupported per-job resolution and misspelled probes instead of ignoring them", () => {
    const job = mainWireBaselineReferenceScreenV1()[0]!;
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...job, nominalDtSec: .001 }))
      .toThrow(/unsupported research job fields: nominalDtSec.*--dt-sec/);
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...job,
      ventricularCalciumTimescale: 1.1 })).toThrow(/ventricularCalciumTimescale/);
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...job,
      parameters: { ...job.parameters, ventricularTRefPa: 120000 } })).toThrow(/ventricularTRefPa/);
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...job,
      ventricularBridgeExit: { maximumRatePerSec: 60, cooperativeGatePower: 16, extraRate: 5 } }))
      .toThrow(/extraRate/);
  });

  it("requires actual experiment flags and preserves explicit false and zero", () => {
    const job = mainWireBaselineReferenceScreenV1()[0]!;
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...job,
      aorticRootInertanceScale: 0, preloadReserve: false, mechanismTrace: false,
      ventricularBridgeExit: "none", initialization: "cold" })).not.toThrow();
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...job, preloadReserve: "false" }))
      .toThrow(/must be boolean/);
    expect(() => assertMainWireBaselineReferenceJobFieldsV1({ ...job, initialization: "warm" }))
      .toThrow(/unsupported research initialization/);
    expect(() => assertMainWireBaselineReferenceJobFieldsV1(null)).toThrow(/must be an object/);
  });

  it("keeps all source laws bit-identical at unit systemic compliance", () => {
    const p = inputs.hemodynamicResearchInputs;
    for (const n of buildNodes().filter(n => n.kind !== "heartActive")) {
      expect(vascularPvLawFromNodeV1(n, { ...p, systemicArterialComplianceResearchScale: 1 }))
        .toEqual(vascularPvLawFromNodeV1(n, p));
    }
  });

  it.each([.8, 1.2])("changes only systemic arterial storage and keeps pressure/compliance inverses consistent (%s)", scale => {
    for (const node of buildNodes().filter(n => n.kind !== "heartActive")) {
      const a = vascularPvLawFromNodeV1(node, inputs.hemodynamicResearchInputs);
      const b = vascularPvLawFromNodeV1(node, { ...inputs.hemodynamicResearchInputs,
        systemicArterialComplianceResearchScale: scale });
      if (!["Ao", "SA", "Art"].includes(node.name)) {
        expect(b).toEqual(a);
        continue;
      }
      expect(b.Vu).toBe(a.Vu);
      for (const pressure of [60, 90, 120]) {
        expect(complianceFromPtm(b, pressure)).toBeCloseTo(complianceFromPtm(a, pressure) * scale, 12);
        expect(stressedVolumeFromPtm(b, pressure)).toBeCloseTo(stressedVolumeFromPtm(a, pressure) * scale, 12);
        expect(ptmFromStressedVolume(b, stressedVolumeFromPtm(b, pressure))).toBeCloseTo(pressure, 10);
      }
    }
  });

  it("rejects duplicate active amplitude ownership and unexamined domain expansion", () => {
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      aorticRootInertanceScale: .5 as never })).toThrow(/source L or L=0/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      mechanismResearchInputs: inputs.mechanismResearchInputs as MainWireIntegratedModelMechanismResearchInputsV3 }))
      .toThrow(/single absolute/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      parameters: { ...request.parameters, ventricularTrefPa: 240000 } })).toThrow(/outside declared domain/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      parameters: { ...request.parameters, systemicArterialComplianceScale: 0 } })).toThrow(/outside declared domain/);
  });

  it("does not turn intervention endpoint admission into a larger baseline fit domain", () => {
    const endpoint = { ...request,
      parameters: { ventricularTrefPa: 174240 * 1.2, systemicArterialComplianceScale: .8 } };
    expect(() => createMainWireBaselineReferenceResearchV1(endpoint)).toThrow(/outside declared domain/);
    const intervention = createMainWireBaselineReferenceResearchV1({ ...endpoint, admissionRole: "intervention" });
    expect(intervention.researchClaim.admissionRole).toBe("intervention");
    expect(intervention.researchClaim.clinicalNormality).toBe(false);
  });

  it("admits a fixed-candidate 20% amplitude response without declaring its finite research ceiling normal", () => {
    const parameters = { ...request.parameters, ventricularTrefPa: 238816.54628141236 * 1.2 };
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, parameters })).toThrow(/outside declared domain/);
    const target = createMainWireBaselineReferenceResearchV1({ ...request, parameters, admissionRole: "intervention" });
    expect(target.researchLandParameters.values.Tref).toBe(parameters.ventricularTrefPa);
    expect(target.researchClaim.clinicalNormality).toBe(false);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      parameters: { ...parameters, ventricularTrefPa: 320001 } })).toThrow(/outside declared domain/);
  });

  it("restores its own research checkpoint exactly and refuses another Tref, Ca or affinity construction", async () => {
    const probe = { ...request, admissionRole: "intervention" as const, aorticRootInertanceScale: 0 as const,
      ventricularAffinityCalibration: { caT50RefUM: .6, beta1UM: -1.2 },
      ventricularCalciumRiseFraction: .9, ventricularDiastolicCalciumUM: .13 as const };
    const target = createMainWireBaselineReferenceResearchV1(probe);
    const fixture = target as unknown as Fixture;
    const first = runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, target.cold.acceptedState, 1, .002);
    const context = createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(fixture);
    const checkpoint = await checkpointMainWireIntegratedModelV3(context, first.terminalAcceptedState);
    const restored = await restoreMainWireIntegratedModelV3(context, checkpoint);
    expect(await checkpointMainWireIntegratedModelV3(context, restored)).toEqual(checkpoint);
    const uninterrupted = runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, first.terminalAcceptedState, 2, .002);
    const replayed = runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, restored, 2, .002);
    expect(replayed.terminalAcceptedState).toEqual(uninterrupted.terminalAcceptedState);
    expect(replayed.traceSamples).toEqual(uninterrupted.traceSamples);
    for (const changed of [
      { ...probe, parameters: { ...probe.parameters, ventricularTrefPa: probe.parameters.ventricularTrefPa * 1.1 } },
      { ...probe, ventricularCalciumRiseFraction: .8 },
      { ...probe, ventricularAffinityCalibration: { caT50RefUM: .65, beta1UM: -1.1 } },
    ]) {
      const other = createMainWireBaselineReferenceResearchV1(changed);
      await expect(restoreMainWireIntegratedModelV3(
        createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(other as unknown as Fixture), checkpoint))
        .rejects.toThrow();
    }
  }, 30_000);

  it("binds changed primitives to a distinct research construction rather than the published checkpoint owner", async () => {
    const r = createMainWireBaselineReferenceResearchV1(request);
    const changed = createMainWireBaselineReferenceResearchV1({ ...request,
      parameters: { ...request.parameters, ventricularTrefPa: 190080 } });
    expect(r.researchParameterIdentity).not.toBe(changed.researchParameterIdentity);
    expect(r.provider.parameterIdentityHash).not.toBe(changed.provider.parameterIdentityHash);
    expect(r.runtime.vascular.algebraicPulmonaryArterialRootProfile)
      .toEqual(changed.runtime.vascular.algebraicPulmonaryArterialRootProfile);
    await expect(checkpointMainWireIntegratedModelStandard70V1(r.researchConstructionId,
      baseline.qualificationCheckpoint.baseStandardCheckpointV2)).rejects.toThrow();
  });

  it.each([.002, .001])("carries changed systemic compliance through both canonical and structural-analysis stepping at %s s", dt => {
    const varied = createMainWireBaselineReferenceResearchV1({ ...request,
      aorticRootInertanceScale: 0,
      parameters: { ventricularTrefPa: 166320, systemicArterialComplianceScale: .8 } });
    let first: typeof varied.cold.acceptedState | null = null;
    runMainWireIntegratedModelRegularSinusAllOffCycleV3(varied as unknown as Fixture,
      varied.cold.acceptedState, 1, dt, step => { first ??= step.acceptedState; });
    expect(first).not.toBeNull();
    const expected = first! as typeof varied.cold.acceptedState;
    const structural = new MainWireBaselineReferenceResearchSessionV1(varied, varied.cold.acceptedState, undefined, dt);
    expect(structural.advanceStructuralAnalysisToPresentationTimeV1(expected.acceptedTimeSec).status).toBe("advanced");
    for (const [node, volume] of Object.entries(expected.coronary.circulation.nodeVolumesMl)) {
      expect(structural.currentAcceptedState().coronary.circulation.nodeVolumesMl[node]).toBeCloseTo(volume, 8);
    }
  }, 30_000);

  it("reproduces the complete canonical cycle after exact source restore and reference rebinding", async () => {
    const s = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(inputs.hemodynamicResearchInputs, 1,
      inputs.mechanismResearchInputs as MainWireIntegratedModelMechanismResearchInputsV3);
    const restored = await restoreMainWireIntegratedModelStandard70V1({
      base: { ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(s),
        mechanismResearchInputs: s.mechanismResearchInputs },
      algebraicPulmonaryRootAssemblyId: s.algebraicPulmonaryRootAssemblyId,
    }, baseline.qualificationCheckpoint);
    const r = createMainWireBaselineReferenceResearchV1({ ...request, aorticRootInertanceScale: 1 });
    const warmed = warmStartMainWireIntegratedModelV3({ source: restored.acceptedState,
      sourceRuntime: s as unknown as MainWireIntegratedModelRuntimeV3,
      targetRuntime: r as unknown as MainWireIntegratedModelRuntimeV3 });
    expect(warmed.acceptedTimeSec).toBe(restored.acceptedState.acceptedTimeSec);
    expect(warmed.revision).toBe(restored.acceptedState.revision);
    const canonical = runMainWireIntegratedModelRegularSinusAllOffCycleV3(s as unknown as Fixture,
      restored.acceptedState, 1, .002);
    const research = runMainWireIntegratedModelRegularSinusAllOffCycleV3(r as unknown as Fixture, warmed, 1, .002);
    expect(research.traceSamples).toEqual(canonical.traceSamples);
    expect(research.maximumGlobalTotalBloodVolumeErrorMl).toBe(canonical.maximumGlobalTotalBloodVolumeErrorMl);
    const structural = new MainWireBaselineReferenceResearchSessionV1(r, warmed);
    const fixed = structural.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(5050 * 1.12);
    expect(fixed.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl).toBe(5050 * 1.12);
    expect(structural.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl).toBe(5050);
    expect(fixed.advanceStructuralAnalysisToPresentationTimeV1(warmed.acceptedTimeSec + .01).status).toBe("advanced");
  }, 30_000);

  it("removes only the aortic momentum memory while retaining source material and pulmonary-root law", () => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const r = createMainWireBaselineReferenceResearchV1({ ...request, aorticRootInertanceScale: 0 });
    expect(r.researchParameterIdentity).not.toBe(source.researchParameterIdentity);
    expect(r.runtime.losses).toEqual(source.runtime.losses);
    expect(r.coronaryStepInput.calciumDriveParams).toEqual(source.coronaryStepInput.calciumDriveParams);
    expect(r.runtime.vascular.algebraicPulmonaryArterialRootProfile)
      .toEqual(source.runtime.vascular.algebraicPulmonaryArterialRootProfile);
    const initial = r.cold.acceptedState;
    const perturbed = { ...initial, coronary: { ...initial.coronary,
      circulation: { ...initial.coronary.circulation,
        dynamicEdgeFlowsMlPerSec: { Ao_SA: -731, PA_PArt: 947 } } } };
    const a = runMainWireIntegratedModelRegularSinusAllOffCycleV3(r as unknown as Fixture, initial, 1, .002);
    const b = runMainWireIntegratedModelRegularSinusAllOffCycleV3(r as unknown as Fixture, perturbed, 1, .002);
    expect(b.traceSamples).toEqual(a.traceSamples);
    expect(b.terminalAcceptedState).toEqual(a.terminalAcceptedState);
  }, 30_000);

  it("keeps myocardial counterfactuals separate from admitted baseline fit coordinates", () => {
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularCalciumTimeScale: 1.1 })).toThrow(/not admitted baseline fit/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularCalciumRiseFraction: .3 })).toThrow(/not admitted baseline fit/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularLandSlackStretch: 1 })).toThrow(/not admitted baseline fit/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularCalciumRiseFraction: .29 })).toThrow(/bounded myocardial/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularAeff: 25 })).toThrow(/not admitted baseline fit/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularDiastolicCalciumUM: .13 })).toThrow(/not admitted baseline fit/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularLandSlackStretch: 1.07 })).toThrow(/not admitted baseline fit/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularKineticRestoration: "kuw" })).toThrow(/not admitted baseline fit/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularKineticRestoration: "unknown" as never })).toThrow(/bounded myocardial/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularDiastolicCalciumUM: .08 as never })).toThrow(/bounded myocardial/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularLandSlackStretch: 1.2 as never })).toThrow(/bounded myocardial/);
    for (const scale of [.89, 1.21, NaN, Infinity]) {
      expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
        ventricularCalciumTimeScale: scale })).toThrow(/bounded myocardial/);
    }
  });

  it("restores only source Aeff and recomputes the derived Land parameters", () => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const restored = createMainWireBaselineReferenceResearchV1({ ...request,
      admissionRole: "intervention", ventricularAeff: 25 });
    expect(restored.researchLandParameters.values).toEqual({ ...source.researchLandParameters.values, Aeff: 25 });
    expect(restored.researchLandParameters.derived).not.toEqual(source.researchLandParameters.derived);
    expect(restored.researchLandParameters.strongBridgeDeactivationExit)
      .toEqual(source.researchLandParameters.strongBridgeDeactivationExit);
    expect(restored.rhythm).toEqual(source.rhythm);
  });

  it("admits only explicit, bounded intervention bridge-exit probes and canonicalizes the source setting", () => {
    const probe = { maximumRatePerSec: 30, cooperativeGatePower: 16 } as const;
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, ventricularBridgeExit: probe }))
      .toThrow(/not admitted baseline fit/);
    for (const invalid of [null, "unknown", {}, { ...probe, extra: true },
      { ...probe, maximumRatePerSec: 0 }, { ...probe, maximumRatePerSec: NaN },
      { ...probe, cooperativeGatePower: 32 }]) {
      expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
        ventricularBridgeExit: invalid as never })).toThrow(/bounded bridge-exit/);
    }
    const a = createMainWireBaselineReferenceResearchV1(request);
    const b = createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularBridgeExit: { maximumRatePerSec: 60, cooperativeGatePower: 16 } });
    expect(b.researchParameterIdentity).toBe(a.researchParameterIdentity);
    expect(b.researchLandParameters).toEqual(a.researchLandParameters);
  });

  it("keeps recruitment/distortion contrasts bounded, single-owned and outside ordinary fitting", () => {
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularRecruitmentDistortion: { kwsScale: .8, phiScale: 1 } })).toThrow(/not admitted baseline fit/);
    for (const probe of [null, {}, { kwsScale: .8, phiScale: .8 }, { kwsScale: 1.2, phiScale: 1 },
      { kwsScale: 1, phiScale: NaN }, { kwsScale: 1, phiScale: 1, extra: 1 }]) {
      expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
        ventricularRecruitmentDistortion: probe as never })).toThrow(/bounded recruitment/);
    }
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularKineticRestoration: "kws", ventricularRecruitmentDistortion: { kwsScale: .8, phiScale: 1 } }))
      .toThrow(/duplicate primitive owners/);
    const source = createMainWireBaselineReferenceResearchV1(request);
    const unit = createMainWireBaselineReferenceResearchV1({ ...request,
      ventricularRecruitmentDistortion: { kwsScale: 1, phiScale: 1 } });
    expect(unit.researchLandParameters).toEqual(source.researchLandParameters);
    expect(unit.researchParameterIdentity).toBe(source.researchParameterIdentity);
  });

  it("recomputes dependent rates for the joint recruitment/distortion probe and binds its provenance", () => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const target = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularRecruitmentDistortion: { kwsScale: .8, phiScale: 1.2 } });
    const a = source.researchLandParameters, b = target.researchLandParameters;
    expect(b.values).toEqual({ ...a.values, kws: a.values.kws * .8, phi: a.values.phi * 1.2 });
    expect(b.derived.cs).toBeCloseTo(a.derived.cs * .8 * 1.2, 12);
    expect(b.derived.cw).toBeCloseTo(a.derived.cw * 1.2, 12);
    expect(b.derived.ksu).toBeCloseTo(a.derived.ksu * .8, 12);
    expect(b.derived.kwu).toBeCloseTo(a.values.kuw * (1 / a.values.rw - 1) - b.values.kws, 12);
    expect(b.strongBridgeDeactivationExit).toEqual(a.strongBridgeDeactivationExit);
    for (const key of ["kws", "phi"] as const) {
      expect(b.sourceParameters.find(p => p.parameter === key)?.runtime.value).toBe(b.values[key]);
      expect(b.sourceParameters.find(p => p.parameter === key)?.original)
        .toEqual(a.sourceParameters.find(p => p.parameter === key)?.original);
    }
    expect(target.researchParameterIdentity).not.toBe(source.researchParameterIdentity);
    expect(target.provider.parameterIdentityHash).not.toBe(source.provider.parameterIdentityHash);
    expect(target.rhythm).toEqual(source.rhythm);
  });

  it.each([.4, .6] as const)("separates source population kinetics from bounded distortion recovery (%s)", phiScale => {
    const input = { ...request, admissionRole: "intervention" as const,
      ventricularKineticRestoration: "both" as const, ventricularBridgeExit: "none" as const,
      ventricularAeff: 25 as const };
    const source = createMainWireBaselineReferenceResearchV1(input);
    const varied = createMainWireBaselineReferenceResearchV1({ ...input,
      ventricularRecruitmentDistortion: { kwsScale: 1, phiScale } });
    const p = source.researchLandParameters, q = varied.researchLandParameters;
    expect(q.values).toEqual({ ...p.values, phi: p.values.phi * phiScale });
    expect(q.derived.ksu).toBe(p.derived.ksu);
    expect(q.derived.kwu).toBe(p.derived.kwu);
    expect(q.derived.cw).toBeCloseTo(p.derived.cw * phiScale, 12);
    expect(q.derived.cs).toBeCloseTo(p.derived.cs * phiScale, 12);
    expect(q.strongBridgeDeactivationExit).toBeUndefined();
    expect(varied.rhythm).toEqual(source.rhythm);
    expect(varied.researchParameterIdentity).not.toBe(source.researchParameterIdentity);
    expect(varied.researchClaim.clinicalNormality).toBe(false);
  });

  it.each([{ kwsScale: 5, phiScale: .2 }, { kwsScale: 7.5, phiScale: 0.13333333333333333 }] as const)(
    "retains the declared distortion clock while accelerating the strong population (%s)", probe => {
      const varied = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
        ventricularKineticRestoration: "kuw", ventricularBridgeExit: "none", ventricularAeff: 25,
        ventricularRecruitmentDistortion: probe });
      const p = varied.researchLandParameters;
      expect(p.values.kuw).toBe(182);
      expect(p.values.kws).toBe(4.8 * probe.kwsScale);
      expect(p.derived.cs).toBeCloseTo(16.056, 10);
      expect(p.derived.ksu).toBe(7.2 * probe.kwsScale);
      expect(p.strongBridgeDeactivationExit).toBeUndefined();
      expect(varied.researchClaim.newContinuousState).toBe(false);
    });

  it("keeps the fixed-reference length contrast explicit without shifting calcium affinity, kinetics or ordinary-fit amplitude bounds", () => {
    const probe = { ...request, ventricularLengthSensitivityScale: .8 as const,
      parameters: { ...request.parameters, ventricularTrefPa: 238816.54628141236 } };
    expect(() => createMainWireBaselineReferenceResearchV1(probe)).toThrow(/not admitted baseline fit/);
    for (const scale of [null, .6, .9, NaN]) {
      expect(() => createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
        ventricularLengthSensitivityScale: scale as never })).toThrow(/bounded fixed-reference/);
    }
    const target = createMainWireBaselineReferenceResearchV1({ ...probe, admissionRole: "intervention" });
    const source = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention", parameters: probe.parameters });
    expect(target.researchLandParameters.values).toEqual({ ...source.researchLandParameters.values,
      beta1: source.researchLandParameters.values.beta1 * .8 });
    expect(target.researchLandParameters.derived).toEqual(source.researchLandParameters.derived);
    expect(target.researchLandParameters.strongBridgeDeactivationExit).toEqual(source.researchLandParameters.strongBridgeDeactivationExit);
    expect(target.researchClaim.lengthDependentCalciumSensitivityChanged).toBe(true);
    expect(target.researchClaim.calciumSourceFitRetained).toBe(true);
    expect(target.researchParameterIdentity).not.toBe(source.researchParameterIdentity);
    expect(target.rhythm).toEqual(source.rhythm);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...request, parameters: probe.parameters })).toThrow(/outside declared domain/);
    expect(() => createMainWireBaselineReferenceResearchV1({ ...probe, admissionRole: "intervention",
      parameters: { ...probe.parameters, ventricularTrefPa: 320001 } })).toThrow(/outside declared domain/);
  });

  it.each(["none", { maximumRatePerSec: 30, cooperativeGatePower: 16 }] as const)(
    "binds the bridge-exit intervention to mechanics without changing calcium or source primitives (%s)", probe => {
      const source = createMainWireBaselineReferenceResearchV1(request);
      const varied = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
        aorticRootInertanceScale: 0, ventricularBridgeExit: probe });
      expect(varied.researchLandParameters.values).toEqual(source.researchLandParameters.values);
      expect(varied.researchLandParameters.derived).toEqual(source.researchLandParameters.derived);
      expect(varied.researchLandParameters.sourceParameters).toEqual(source.researchLandParameters.sourceParameters);
      expect(varied.researchLandParameters.parameterSetStableHash).not.toBe(source.researchLandParameters.parameterSetStableHash);
      expect(varied.rhythm).toEqual(source.rhythm);
      expect(varied.researchClaim.calciumSourceFitRetained).toBe(true);
      expect(varied.researchClaim.calciumOrKineticsChanged).toBe(true);
      if (probe === "none") expect(varied.researchBridgeExit).toBeNull();
      else expect(varied.researchBridgeExit).toMatchObject(probe);
      let first: typeof varied.cold.acceptedState | null = null;
      runMainWireIntegratedModelRegularSinusAllOffCycleV3(varied as unknown as Fixture,
        varied.cold.acceptedState, 1, .002, step => { first ??= step.acceptedState; });
      const expected = first! as typeof varied.cold.acceptedState;
      const structural = new MainWireBaselineReferenceResearchSessionV1(varied, varied.cold.acceptedState);
      expect(structural.advanceStructuralAnalysisToPresentationTimeV1(expected.acceptedTimeSec).status).toBe("advanced");
      for (const [node, volume] of Object.entries(expected.coronary.circulation.nodeVolumesMl)) {
        expect(structural.currentAcceptedState().coronary.circulation.nodeVolumesMl[node]).toBeCloseTo(volume, 8);
      }
    }, 30_000);

  it.each(["kuw", "kws", "both"] as const)("isolates source kinetic restoration (%s), preserving Ca, Aeff and bridge-exit law", restoration => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const restored = createMainWireBaselineReferenceResearchV1({ ...request,
      admissionRole: "intervention", ventricularKineticRestoration: restoration });
    expect(restored.researchLandParameters.values).toEqual({ ...source.researchLandParameters.values,
      ...(["kuw", "both"].includes(restoration) ? { kuw: 182 } : {}),
      ...(["kws", "both"].includes(restoration) ? { kws: 12 } : {}) });
    expect(restored.researchLandParameters.derived).not.toEqual(source.researchLandParameters.derived);
    expect(restored.researchLandParameters.strongBridgeDeactivationExit)
      .toEqual(source.researchLandParameters.strongBridgeDeactivationExit);
    expect(restored.rhythm).toEqual(source.rhythm);
    expect(restored.coronaryStepInput.calciumDriveParams).toEqual(source.coronaryStepInput.calciumDriveParams);
    expect(restored.provider.parameterIdentityHash).not.toBe(source.provider.parameterIdentityHash);
    expect(restored.researchClaim.calciumSourceFitRetained).toBe(true);
  });

  it("changes the actual accepted Ca event owner, retains extrema and records reconstructible material pressure", () => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const changed = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularCalciumTimeScale: 1.1 });
    expect(changed.researchClaim.calciumSourceFitRetained).toBe(false);
    expect(changed.rhythm.configuration.calciumParametersByWall.LVFW.tauRiseSec)
      .toBeCloseTo(source.rhythm.configuration.calciumParametersByWall.LVFW.tauRiseSec * 1.1, 11);
    expect(changed.rhythm.configuration.calciumParametersByWall.LA)
      .toEqual(source.rhythm.configuration.calciumParametersByWall.LA);
    const r = runMainWireIntegratedModelRegularSinusAllOffCycleV3(changed as unknown as Fixture,
      changed.cold.acceptedState, 1, .002, step => {
        const material = readMainWireEjectionMaterialV1(step);
        expect(Math.abs(material.lvPressureReconstructionErrorMmHg)).toBeLessThan(1e-8);
      });
    const ca = r.traceSamples.map(s => s.freeCalciumUMByWall.LVFW);
    expect(Math.max(...ca)).toBeCloseTo(.592586, 4);
    expect(Math.min(...ca)).toBeCloseTo(.164321, 4);
    expect(r.oneComposedCalciumOwnerOnly).toBe(true);
    expect(r.acceptedVentricularCaptureIds).toHaveLength(1);
  }, 30_000);

  it.each([.3,.6,.8,1])("owns independent Ca rise shape %s in exact event memory and removes only the additional Land stretch multiplier", fraction => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const changed = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularCalciumRiseFraction: fraction, ventricularLandSlackStretch: 1 });
    expect(changed.researchParameterIdentity).not.toBe(source.researchParameterIdentity);
    expect(changed.researchClaim.calciumSourceFitRetained).toBe(fraction === 1);
    expect(changed.researchClaim.newContinuousState).toBe(false);
    expect(changed.rhythm.configuration.calciumParametersByWall.LA)
      .toEqual(source.rhythm.configuration.calciumParametersByWall.LA);
    expect(changed.rhythm.configuration.calciumParametersByWall.LVFW.tauRiseSec)
      .toBeCloseTo(source.rhythm.configuration.calciumParametersByWall.LVFW.tauRiseSec * fraction, 11);
    expect(changed.rhythm.configuration.calciumParametersByWall.LVFW.tauDecaySec)
      .toBe(source.rhythm.configuration.calciumParametersByWall.LVFW.tauDecaySec);
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(changed as unknown as Fixture,
      changed.cold.acceptedState, 1, .002, step => {
        const m = readMainWireEjectionMaterialV1(step, changed.researchLandSlackStretch);
        for (const wall of ["LVFW", "SEP", "RVFW"] as const) {
          const lambda = Math.exp(m.walls[wall]!.fiberLogStrain);
          expect(m.walls[wall]!.landStretch).toBe(lambda);
          const state = step.acceptedState.coronary.mechanics.materialState.wallStateByWall[wall].landState;
          const force = evaluateLand2017ContinuousOutput(state, {
            freeCalciumUM: step.calciumDrive.freeCalciumUMByWall[wall],
            fiberEngineeringStrain: lambda - 1, fiberEngineeringStrainRatePerSec: 0,
          }, changed.researchLandParameters).sourceActiveFiberStressPa;
          expect(m.walls[wall]!.activeStressPa).toBeCloseTo(lambda
            * sourceMaterial.orientationFraction01 * sourceMaterial.viableActiveFraction01 * force, 8);
        }
      });
    const ca = run.traceSamples.map(s => s.freeCalciumUMByWall.LVFW);
    expect(Math.min(...ca)).toBeCloseTo(.164321, 4);
    expect(Math.max(...ca)).toBeCloseTo(.592586, 4);
    expect(run.oneComposedCalciumOwnerOnly).toBe(true);
    expect(run.acceptedVentricularCaptureIds).toHaveLength(1);
  }, 30_000);

  it("binds a changed trough to the event owner, preserves peak/timing, and reads the actual changed Land stretch", () => {
    const source = createMainWireBaselineReferenceResearchV1(request);
    const changed = createMainWireBaselineReferenceResearchV1({ ...request, admissionRole: "intervention",
      ventricularDiastolicCalciumUM: .13, ventricularLandSlackStretch: 1.07 });
    expect(changed.researchClaim.calciumSourceFitRetained).toBe(false);
    expect(changed.researchParameterIdentity).not.toBe(source.researchParameterIdentity);
    expect(changed.provider.parameterIdentityHash).not.toBe(source.provider.parameterIdentityHash);
    expect(changed.coronaryStepInput.calciumDriveParams.ventricular)
      .toEqual({ ...source.coronaryStepInput.calciumDriveParams.ventricular,
        diastolicCalciumUM: .13, peakAmplitudeUM: .592586 - .13 });
    expect(changed.rhythm.configuration.calciumParametersByWall.LA)
      .toEqual(source.rhythm.configuration.calciumParametersByWall.LA);
    const event = changed.rhythm.configuration.calciumParametersByWall.LVFW;
    expect(event.tauRiseSec).toBe(source.rhythm.configuration.calciumParametersByWall.LVFW.tauRiseSec);
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(changed as unknown as Fixture,
      changed.cold.acceptedState, 1, .002, step => {
        const m = readMainWireEjectionMaterialV1(step, changed.researchLandSlackStretch);
        expect(m.walls.LVFW!.landStretch).toBe(1.07 * Math.exp(m.walls.LVFW!.fiberLogStrain));
        expect(Math.abs(m.lvPressureReconstructionErrorMmHg)).toBeLessThan(1e-8);
        for (const wall of ["LVFW", "SEP", "RVFW"] as const) {
          const lambda = m.walls[wall]!.landStretch;
          const state = step.acceptedState.coronary.mechanics.materialState.wallStateByWall[wall].landState;
          // Reconstruct the force actually returned by the coupled provider,
          // not just the diagnostic's stretch label. Active force is rate-free
          // once the accepted distortion state is fixed.
          const force = evaluateLand2017ContinuousOutput(state, {
            freeCalciumUM: step.calciumDrive.freeCalciumUMByWall[wall],
            fiberEngineeringStrain: lambda - 1, fiberEngineeringStrainRatePerSec: 0,
          }, changed.researchLandParameters).sourceActiveFiberStressPa;
          expect(m.walls[wall]!.activeStressPa).toBeCloseTo(lambda
            * sourceMaterial.orientationFraction01 * sourceMaterial.viableActiveFraction01 * force, 8);
        }
      });
    const ca = run.traceSamples.map(s => s.freeCalciumUMByWall.LVFW);
    expect(Math.min(...ca)).toBeCloseTo(.13, 4);
    expect(Math.max(...ca)).toBeCloseTo(.592586, 4);
    expect(run.oneComposedCalciumOwnerOnly).toBe(true);
    expect(run.acceptedVentricularCaptureIds).toHaveLength(1);
  }, 30_000);
});
