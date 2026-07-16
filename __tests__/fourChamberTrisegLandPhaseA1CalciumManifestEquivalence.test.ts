import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  advanceExactEventCalciumV1,
  applyExactCalciumDriveEventV1,
  calciumDriveEventFromElectricalV1,
  evaluateExactEventCalciumV1,
  exactEventCalciumNormalizationV1,
  propagateExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
  type ExactEventCalciumParametersV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  isolatedLandTargetPackHashPayloadV1,
  validateIsolatedLandTargetPackV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import {
  evaluateLandBackwardEulerDistortionEquivalenceV1,
  evaluateLandContinuousDistortionEquivalenceV1,
  landDistortionEquivalenceParametersV1,
  rateFreeXiToSourceZetaV1,
  sourceZetaToRateFreeXiV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeDistortionEquivalenceV1";
import {
  ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1,
  VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildAtrialHumanPriorLandEquationParametersV1,
  buildPhaseA1TissueManifestBundleV1,
  phaseA1TissueManifestBundleHashPayloadV1,
  phaseA1TissueManifestHashPayloadV1,
  validatePhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import { PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1 } from
  "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import { PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1 } from
  "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { compilePhaseA1LandWallAdapterContextV1 } from
  "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";

describe("four-chamber TriSeg/Land Phase A1 calcium, manifests, target packs, and xi oracle", () => {
  it("reaches the exact isolated-event calcium peak and keeps the reachable state domain", () => {
    const parameters = VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1;
    const { peakTimeSec, normalization } = exactEventCalciumNormalizationV1(parameters);
    const postEvent = applyExactCalciumDriveEventV1(zeroExactEventCalciumStateV1(), {
      eventId: "unit",
      calciumDriveTimeSec: 0,
      strength: 1,
      timingOwner: "tissue-manifest-electrical-to-calcium-delay",
    });
    const atPeak = propagateExactEventCalciumV1(postEvent, peakTimeSec, parameters);
    const evaluation = evaluateExactEventCalciumV1(atPeak, parameters);

    expect(normalization).toBeGreaterThan(0);
    expect(evaluation.normalizedTransient).toBeCloseTo(1, 13);
    expect(evaluation.freeCalciumUM).toBeCloseTo(
      parameters.calciumDiastolicUM + parameters.calciumAmplitudeUM,
      13,
    );
    expect(atPeak[1]).toBeGreaterThan(atPeak[0]);
    expect(Object.isFrozen(atPeak)).toBe(true);
    expect(() => evaluateExactEventCalciumV1([1, 0.5], parameters)).toThrow(/decayDrive >= riseDrive/);
  });

  it("keeps normalization finite for nearly equal time constants and rejects duplicate timing ownership", () => {
    const nearlyEqual: ExactEventCalciumParametersV1 = {
      ...VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
      tauRiseSec: 0.1,
      tauDecaySec: 0.100000000001,
      evidenceId: "near-equal-numerical-regression",
    };
    const normalization = exactEventCalciumNormalizationV1(nearlyEqual);
    expect(normalization.peakTimeSec).toBeCloseTo(0.1, 9);
    expect(normalization.normalization).toBeGreaterThan(0);
    expect(Number.isFinite(normalization.normalization)).toBe(true);
    const oneUlpApart: ExactEventCalciumParametersV1 = {
      ...nearlyEqual,
      tauDecaySec: 0.10000000000000002,
      evidenceId: "one-ulp-separation-numerical-regression",
    };
    const oneUlpNormalization = exactEventCalciumNormalizationV1(oneUlpApart);
    const relativeSeparation = (oneUlpApart.tauDecaySec - oneUlpApart.tauRiseSec)
      / oneUlpApart.tauRiseSec;
    expect(oneUlpNormalization.normalization / (relativeSeparation / Math.E)).toBeCloseTo(1, 14);
    expect(() => exactEventCalciumNormalizationV1({
      ...nearlyEqual,
      strain: 0.1,
    } as ExactEventCalciumParametersV1)).toThrow(/unknown fields/);
    expect(() => calciumDriveEventFromElectricalV1({
      eventId: "e0",
      electricalTimeSec: 0.2,
      strength: 1,
      schedulerCalciumDelaySec: 0.01,
    } as never, nearlyEqual)).toThrow(/unknown fields/);
  });

  it("propagates variable-RR superposition exactly and owns events on (start,end]", () => {
    const parameters = VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1;
    const electricalEvents = [
      { eventId: "e1", electricalTimeSec: 0.188, strength: 1 },
      { eventId: "e2", electricalTimeSec: 0.588, strength: 0.4 },
      { eventId: "e3", electricalTimeSec: 0.988, strength: 0.7 },
    ] as const;
    const events = electricalEvents.map((event) => calciumDriveEventFromElectricalV1(event, parameters));
    expect(events.map((event) => event.calciumDriveTimeSec)).toEqual([0.2, 0.6, 1]);
    const state = advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      0,
      1,
      events,
      parameters,
    );
    const expectedRise = events.reduce((sum, event) =>
      sum + event.strength * Math.exp(-(1 - event.calciumDriveTimeSec) / parameters.tauRiseSec), 0);
    const expectedDecay = events.reduce((sum, event) =>
      sum + event.strength * Math.exp(-(1 - event.calciumDriveTimeSec) / parameters.tauDecaySec), 0);
    expect(state[0]).toBeCloseTo(expectedRise, 14);
    expect(state[1]).toBeCloseTo(expectedDecay, 14);
    expect(state[0]).toBeGreaterThanOrEqual(0);
    expect(state[1]).toBeGreaterThanOrEqual(state[0]);

    const afterEndEvent = advanceExactEventCalciumV1(state, 1, 1.1, [], parameters);
    expect(afterEndEvent[0]).toBeLessThan(state[0]);
    expect(() => advanceExactEventCalciumV1(zeroExactEventCalciumStateV1(), 0, 1, [
      events[0],
      { ...events[0] },
    ], parameters)).toThrow(/duplicate eventId/);
    expect(() => advanceExactEventCalciumV1(zeroExactEventCalciumStateV1(), 0.2, 1, [
      events[0],
    ], parameters)).toThrow(/\(startTimeSec, endTimeSec\]/);
  });

  it("proves continuous and backward-Euler zeta/xi equivalence over a changing-length trajectory", () => {
    const parameters = landDistortionEquivalenceParametersV1(
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.derived,
    );
    const continuous = evaluateLandContinuousDistortionEquivalenceV1(
      { w: 0.08, s: -0.2 },
      1.07,
      -0.35,
      parameters,
    );
    expect(Math.abs(continuous.residualPerSec.w)).toBeLessThan(1e-12);
    expect(Math.abs(continuous.residualPerSec.s)).toBeLessThan(1e-12);
    const reconstructed = rateFreeXiToSourceZetaV1(continuous.xi, 1.07, parameters);
    expect(reconstructed.w).toBeCloseTo(0.08, 14);
    expect(reconstructed.s).toBeCloseTo(-0.2, 14);

    let zeta = { w: 0.03, s: -0.1 };
    let lambdaPrevious = 0.96;
    for (const lambdaNext of [0.99, 1.04, 1.08, 1.01, 0.97]) {
      const oracle = evaluateLandBackwardEulerDistortionEquivalenceV1(
        zeta,
        lambdaPrevious,
        lambdaNext,
        0.002,
        parameters,
      );
      expect(Math.abs(oracle.sourceResidual.w)).toBeLessThan(1e-12);
      expect(Math.abs(oracle.sourceResidual.s)).toBeLessThan(1e-12);
      expect(Math.abs(oracle.rateFreeResidual.w)).toBeLessThan(1e-12);
      expect(Math.abs(oracle.rateFreeResidual.s)).toBeLessThan(1e-12);
      expect(Math.abs(oracle.reconstructionResidual.w)).toBeLessThan(1e-12);
      expect(Math.abs(oracle.reconstructionResidual.s)).toBeLessThan(1e-12);
      zeta = oracle.sourceZetaNext;
      lambdaPrevious = lambdaNext;
    }
    expect(landDistortionEquivalenceParametersV1({
      Aw: 0,
      As: 1,
      cw: 1,
      cs: 1,
    }).A).toEqual({ w: 0, s: 1 });
    expect(() => landDistortionEquivalenceParametersV1({
      Aw: -Number.EPSILON,
      As: 1,
      cw: 1,
      cs: 1,
    })).toThrow(/Aw.*nonnegative/);
    expect(() => sourceZetaToRateFreeXiV1(
      { w: Number.MAX_VALUE, s: 0 },
      2,
      { A: { w: Number.MAX_VALUE, s: 1 }, cPerSec: { w: 1, s: 1 } },
    )).toThrow(/remain finite/);
  });

  it("pins an independently hand-derived xi sign and backward-Euler vector", () => {
    const parameters = { A: { w: 2, s: 3 }, cPerSec: { w: 4, s: 5 } } as const;
    const continuous = evaluateLandContinuousDistortionEquivalenceV1(
      { w: 0.4, s: -0.2 },
      1.1,
      -0.3,
      parameters,
    );
    expect(continuous.xi.w).toBeCloseTo(-1.8, 15);
    expect(continuous.xi.s).toBeCloseTo(-3.5, 15);
    expect(continuous.sourceZetaDotPerSec.w).toBeCloseTo(-2.2, 15);
    expect(continuous.sourceZetaDotPerSec.s).toBeCloseTo(0.1, 15);
    expect(continuous.rateFreeXiDotPerSec.w).toBeCloseTo(-1.6, 15);
    expect(continuous.rateFreeXiDotPerSec.s).toBeCloseTo(1, 14);

    const backwardEuler = evaluateLandBackwardEulerDistortionEquivalenceV1(
      { w: 0.4, s: -0.2 },
      1.1,
      0.95,
      0.1,
      parameters,
    );
    expect(backwardEuler.rateFreeXiPrevious.w).toBeCloseTo(-1.8, 15);
    expect(backwardEuler.rateFreeXiPrevious.s).toBeCloseTo(-3.5, 15);
    expect(backwardEuler.sourceZetaNext.w).toBeCloseTo(1 / 14, 15);
    expect(backwardEuler.sourceZetaNext.s).toBeCloseTo(-13 / 30, 15);
    expect(backwardEuler.rateFreeXiNext.w).toBeCloseTo(-64 / 35, 15);
    expect(backwardEuler.rateFreeXiNext.s).toBeCloseTo(-197 / 60, 15);
  });

  it("builds complete, immutable, real-SHA candidate manifests and separate source target packs", () => {
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const ventricular = bundle.ventricularManifest;
    const atrial = bundle.atrialManifest;
    const atrialParameterSet = buildAtrialHumanPriorLandEquationParametersV1();
    expect({
      bundle: bundle.contentSha256,
      ventricularManifest: ventricular.contentSha256,
      atrialManifest: atrial.contentSha256,
      ventricularTargetPack: bundle.ventricularTargetPack.contentSha256,
      atrialTargetPack: bundle.atrialTargetPack.contentSha256,
    }).toEqual(PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1);

    expect(validatePhaseA1TissueManifestBundleV1(bundle, sha256)).toBe(bundle);
    expect(bundle.contentSha256).toBe(sha256(canonicalizeJson(phaseA1TissueManifestBundleHashPayloadV1(bundle))));
    expect(ventricular.contentSha256).toBe(sha256(canonicalizeJson(phaseA1TissueManifestHashPayloadV1(ventricular))));
    expect(atrial.contentSha256).toBe(sha256(canonicalizeJson(phaseA1TissueManifestHashPayloadV1(atrial))));
    expect(ventricular.status).toBe("candidate-prior");
    expect(atrial.status).toBe("candidate-prior");
    expect(ventricular.completeParameterInventory).toBe(true);
    expect(ventricular.land.primitiveParameters).toHaveLength(18);
    expect(ventricular.land.derivedParameters).toHaveLength(7);
    expect(ventricular.prescribedCalcium.parameters).toHaveLength(5);
    expect(ventricular.passiveSls.primitiveParameters).toHaveLength(6);
    expect(ventricular.passiveSls.derivedParameters).toHaveLength(2);
    expect(ventricular.passiveSls.passivePriorSha256).toBe(
      computeCanonicalSha256(PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1, sha256),
    );
    expect(ventricular.passiveSls.slsPriorSha256).toBe(
      computeCanonicalSha256(PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1, sha256),
    );
    expect(ventricular.passiveSls.passivePriorSha256).not.toBe(computeCanonicalSha256({
      ...PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
      supportedFiberLogStrainRange: [-0.4, 0.4],
    }, sha256));
    expect(ventricular.passiveSls.slsPriorSha256).not.toBe(computeCanonicalSha256({
      ...PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1,
      sharedByWalls: ["LVFW", "RVFW"],
    }, sha256));
    expect(atrial.atrialDiff?.changedPrimitiveParameters).toEqual([
      "calcium.calciumAmplitudeUM",
      "calcium.calciumDiastolicUM",
      "calcium.tauDecaySec",
      "calcium.tauRiseSec",
      "land.CaT50Ref",
      "land.kws",
      "passive.A",
      "passive.B",
      "passive.K_comp_eff",
      "sls.r_class",
      "sls.tau_class",
    ]);
    expect(atrial.atrialDiff?.recomputedDerivedParameters).toEqual([
      "land.cs",
      "land.ksu",
      "land.kwu",
      "passive.K0",
      "sls.E_v",
    ]);
    expect(atrial.atrialDiff?.exactPrimitiveRateMapping).toEqual(["land.kws"]);
    expect(atrialParameterSet.values.CaT50Ref).toBe(0.86);
    expect(atrialParameterSet.values.kws).toBe(
      3 * LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.kws,
    );
    expect(atrialParameterSet.derived.kwu).not.toBe(
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.derived.kwu,
    );
    expect(bundle.ventricularTargetPack.contentSha256).not.toBe(bundle.atrialTargetPack.contentSha256);
    expect(bundle.ventricularTargetPack.forceCalciumTargets).toHaveLength(12);
    expect(bundle.atrialTargetPack.forceCalciumTargets).toHaveLength(12);
    expect(Math.max(...bundle.ventricularTargetPack.forceCalciumTargets.map((target) => target.rhsMaxAbsPerSec)))
      .toBeLessThan(1e-10);
    expect(bundle.ventricularTargetPack.isolatedTwitchTarget.peakAmplitudePa).toBeGreaterThan(0);
    expect(bundle.atrialTargetPack.isolatedTwitchTarget.peakAmplitudePa).toBeGreaterThan(0);
    expect(bundle.ventricularTargetPack.isolatedTwitchTarget.minimumPopulation).toBeGreaterThanOrEqual(-1e-12);
    expect(bundle.atrialTargetPack.isolatedTwitchTarget.minimumPopulation).toBeGreaterThanOrEqual(-1e-12);
    expect(bundle.ventricularTargetPack.releaseGate.experimentalValidation).toBe("not-claimed");
    expect(bundle.atrialTargetPack.releaseGate.experimentalValidation).toBe("not-claimed");
    expect(bundle.closedLoopReleaseEligible).toBe(false);
    expect(Object.isFrozen(bundle)).toBe(true);
    expect(Object.isFrozen(atrial.land.primitiveParameters)).toBe(true);
    const ventricularContext = compilePhaseA1LandWallAdapterContextV1(
      bundle,
      "ventricular",
      sha256,
    );
    const atrialContext = compilePhaseA1LandWallAdapterContextV1(bundle, "atrial", sha256);
    expect(ventricularContext.tissueManifestSha256).toBe(ventricular.contentSha256);
    expect(atrialContext.tissueManifestSha256).toBe(atrial.contentSha256);
    expect(atrialContext.allowFreeGain).toBe(false);
    expect(atrialContext.fitToPVLoop).toBe(false);
  }, 30_000);

  it("rejects semantically changed manifests and source targets even when an attacker rehashes them", () => {
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const changedManifestPayload = {
      ...phaseA1TissueManifestHashPayloadV1(bundle.ventricularManifest),
      status: "release",
    };
    const changedManifest = {
      ...changedManifestPayload,
      contentSha256: sha256(canonicalizeJson(changedManifestPayload)),
    };
    const changedBundlePayload = {
      ...phaseA1TissueManifestBundleHashPayloadV1(bundle),
      ventricularManifest: changedManifest,
    };
    const changedBundle = {
      ...changedBundlePayload,
      contentSha256: sha256(canonicalizeJson(changedBundlePayload)),
    } as unknown as PhaseA1TissueManifestBundleV1;
    expect(() => validatePhaseA1TissueManifestBundleV1(changedBundle, sha256)).toThrow(
      /canonical complete candidate bundle/,
    );

    const targetPayload = isolatedLandTargetPackHashPayloadV1(bundle.ventricularTargetPack);
    const changedTargets = [...targetPayload.forceCalciumTargets];
    changedTargets[0] = {
      ...changedTargets[0],
      sourceActiveStressPa: changedTargets[0].sourceActiveStressPa + 1,
    };
    const changedTargetPayload = { ...targetPayload, forceCalciumTargets: changedTargets };
    const changedTargetPack = {
      ...changedTargetPayload,
      contentSha256: sha256(canonicalizeJson(changedTargetPayload)),
    };
    expect(() => validateIsolatedLandTargetPackV1(
      changedTargetPack,
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
      VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
      sha256,
    )).toThrow(/normative source-generated payload/);
  }, 30_000);
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
