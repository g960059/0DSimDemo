import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  evaluateLand2017ContinuousOutput,
  type Land2017RuntimeParameters,
} from "@/engine/myocardium/myofilament/land2017";
import {
  initializeLand2017IsometricSteadyStateV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildAtrialHumanPriorLandEquationParametersV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  NORMAL_ADULT_ACTIVE_TISSUE_CLASS_BY_WALL_V1,
  NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_CLAIM_BOUNDARY,
  NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_PINNED_HASHES,
  NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  NORMAL_ADULT_ATRIAL_SATURATION_MAPPING_V1,
  NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildNormalAdultActiveTissueClassPriorAuditV1,
  buildNormalAdultAtrialActiveLandParameterSetV1,
  normalAdultActiveTissueClassPriorAuditHashPayloadV1,
  type NormalAdultActiveTissueClassPriorAuditV1,
} from "@/engine/myocardium/fourChamberV1/land/normalAdultActiveTissueClassPriorV1";

describe("normal-adult active tissue-class prior v1", () => {
  it("maps the Lewalle pCa4.5 LA stress through the replayed six-state saturation factor", () => {
    const candidate = buildNormalAdultAtrialActiveLandParameterSetV1();
    const calciumUM = Math.pow(10, 6 - 4.5);
    const state = initializeLand2017IsometricSteadyStateV1(1, calciumUM, candidate);
    const output = evaluateLand2017ContinuousOutput(state, {
      freeCalciumUM: calciumUM,
      fiberEngineeringStrain: 0,
      fiberEngineeringStrainRatePerSec: 0,
    }, candidate);

    expect(NORMAL_ADULT_ATRIAL_SATURATION_MAPPING_V1.freeCalciumUM).toBe(calciumUM);
    expect(candidate.values.Tref).toBe(11_661.151010550097);
    expect(output.sourceActiveFiberStressPa).toBeCloseTo(11_600, 9);
    expect(audit().atrialClass.saturationMapping.absoluteReplayErrorPa).toBeLessThan(1e-9);
    expect(audit().atrialClass.saturationMapping.steadyState).toEqual(Array.from(state));
  });

  it("changes only atrial Tref and preserves every inherited kinetic value bit-exactly", () => {
    const legacy = buildAtrialHumanPriorLandEquationParametersV1();
    const candidate = buildNormalAdultAtrialActiveLandParameterSetV1();
    const names = Object.keys(legacy.values) as Array<keyof Land2017RuntimeParameters>;
    const changed = names.filter((name) => !Object.is(legacy.values[name], candidate.values[name]));

    expect(changed).toEqual(["Tref"]);
    expect(candidate.derived).toEqual(legacy.derived);
    expect(Object.keys(legacy.derived).every((name) => Object.is(
      legacy.derived[name as keyof typeof legacy.derived],
      candidate.derived[name as keyof typeof candidate.derived],
    ))).toBe(true);
    expect(audit().atrialClass.allOtherPrimitiveValuesBitExact).toBe(true);
    expect(audit().atrialClass.derivedKineticsBitExact).toBe(true);
  });

  it("shares one LA-derived atrial class between LA and RA without a chamber-wise gain", () => {
    const report = audit();

    expect(report.tissueClassByWall).toBe(NORMAL_ADULT_ACTIVE_TISSUE_CLASS_BY_WALL_V1);
    expect(report.tissueClassByWall.LA).toBe("atrial-shared");
    expect(report.tissueClassByWall.RA).toBe(report.tissueClassByWall.LA);
    expect(report.atrialClass.sharedBy).toEqual(["LA", "RA"]);
    expect(report.atrialClass.rightAtriumEvidenceBoundary)
      .toBe("la-derived-class-prior-extrapolated-to-ra-without-independent-ra-force-scale");
    expect(report.exclusionBoundary.chamberSpecificActiveGainUsed).toBe(false);
  });

  it("reconstructs component timing while recording the ventricular RT90 miss", () => {
    const report = audit();

    expect(NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1).toMatchObject({
      tauRiseSec: 0.0125,
      tauDecaySec: 0.3,
      calciumDiastolicUM: 0.1,
      calciumAmplitudeUM: 0.5,
    });
    expect(NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1).toMatchObject({
      tauRiseSec: 0.07,
      tauDecaySec: 0.11,
      calciumDiastolicUM: 0.11,
      calciumAmplitudeUM: 0.89,
    });
    expect(report.calciumTiming.reconstructionClass)
      .toBe("low-order-component-metric-reconstruction-not-measured-waveform");
    expect(report.calciumTiming.digitizedCalciumTraceUsed).toBe(false);
    expect(report.calciumTiming.atrial.replay.timeToPeakMs).toBeCloseTo(85, 0);
    expect(report.calciumTiming.atrial.replay.relaxationTime50Ms).toBeCloseTo(71, 0);
    expect(report.calciumTiming.ventricular.replay.timeToPeakMs).toBeCloseTo(171, 0);
    expect(report.calciumTiming.ventricular.replay.relaxationTime50Ms).toBeCloseTo(122, 0);
    expect(report.calciumTiming.ventricular.replay.relaxationTime90Ms).toBeCloseTo(224, 0);
    expect(report.calciumTiming.ventricular.replay.rt90ContextReproduced).toBe(false);
    expect(report.calciumTiming.ventricular.sourceContext.relaxationTime90Ms).toBe(281);
  });

  it("uses isolated source-equation audits and excludes PV-loop and passive-material fitting", () => {
    const report = audit();

    expect(report.componentAudit.generatorId).toBe("buildIsolatedLandTargetPackV1");
    expect(report.componentAudit.atrialTargetPackSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(report.componentAudit.ventricularTargetPackSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(report.exclusionBoundary).toEqual({
      pvLoopOrPvMorphologyFitUsed: false,
      moyerPassiveMaterialUsed: false,
      passiveMaterialCalibrationUsed: false,
      chamberSpecificActiveGainUsed: false,
      lewalleMicroscopicParameterVectorTransplanted: false,
      closedLoopPhysiologyValidated: false,
    });
    expect(report.claimBoundary).toBe(NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_CLAIM_BOUNDARY);
  });

  it("is recursively frozen and canonically self-hashed", () => {
    const first = audit();
    const second = buildNormalAdultActiveTissueClassPriorAuditV1(sha256);
    const candidateA = buildNormalAdultAtrialActiveLandParameterSetV1();
    const candidateB = buildNormalAdultAtrialActiveLandParameterSetV1();

    expect(first).toEqual(second);
    expect(first.contentSha256).toBe(computeCanonicalSha256(
      normalAdultActiveTissueClassPriorAuditHashPayloadV1(first),
      sha256,
    ));
    expect(candidateA.parameterSetStableHash).toBe(candidateB.parameterSetStableHash);
    expect(candidateA.parameterSetStableHash).toMatch(/^[0-9a-f]{8}$/);
    expect({
      audit: first.contentSha256,
      atrialParameterSetStableHash: candidateA.parameterSetStableHash,
      atrialTargetPack: first.componentAudit.atrialTargetPackSha256,
      ventricularTargetPack: first.componentAudit.ventricularTargetPackSha256,
    }).toEqual(NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_PINNED_HASHES);
    expect(recursivelyFrozen(first)).toBe(true);
    expect(recursivelyFrozen(candidateA)).toBe(true);
  });
});

let cachedAudit: NormalAdultActiveTissueClassPriorAuditV1 | undefined;

function audit(): NormalAdultActiveTissueClassPriorAuditV1 {
  cachedAudit ??= buildNormalAdultActiveTissueClassPriorAuditV1(sha256);
  return cachedAudit;
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function recursivelyFrozen(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  return Object.isFrozen(value)
    && Object.values(value as Record<string, unknown>).every(recursivelyFrozen);
}
