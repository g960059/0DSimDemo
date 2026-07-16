import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_CLAIM_BOUNDARY,
  NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_ID,
  NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_EVIDENCE_V2,
  NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2,
  buildNormalAdultHumanAtrialCalciumTimingCandidateAuditV2,
  computeUnscaledExactEventCalciumTimingMetricsV2,
} from "@/engine/myocardium/fourChamberV1/calcium/normalAdultHumanAtrialCalciumTimingCandidateV2";
import {
  buildNormalAdultAtrialMechanicsCenterCandidateV3,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultAtrialMechanicsCandidateV3";
import {
  buildNormalAdultVentricularMechanicsCandidateV2,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultVentricularMechanicsCandidateV2";
import {
  ATRIAL_POPULATION_ONLY_LAND_V1_ID,
} from "@/engine/myocardium/fourChamberV1/land/atrialPopulationOnlyLandV1";
import {
  NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildNormalAdultActiveTissueClassPriorAuditV1,
} from "@/engine/myocardium/fourChamberV1/land/normalAdultActiveTissueClassPriorV1";
import {
  VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  buildPhaseB1MechanisticRebuildSourceDistortionControlBindingV6,
  buildPhaseB1MechanisticRebuildVentricularCalciumAblationBindingV5,
  buildPhaseB1MechanisticRebuildWallMaterialBindingV4,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";

const PA_PER_MMHG = 133.322387415;

describe("normal-adult human atrial calcium timing candidate V2", () => {
  it("changes only the two biexponential timing constants from the preceding normal-adult candidate", () => {
    const previous = NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1;
    const candidate = NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2;
    const changed = Object.keys(previous).filter((key) => !Object.is(
      previous[key as keyof typeof previous],
      candidate[key as keyof typeof candidate],
    ));

    expect(changed).toEqual(["tauRiseSec", "tauDecaySec", "evidenceId"]);
    expect(candidate).toMatchObject({
      tauRiseSec: 0.020,
      tauDecaySec: 0.215,
      calciumDiastolicUM: 0.1,
      calciumAmplitudeUM: 0.5,
      electricalToCalciumDelaySec: 0.012,
      status: "candidate-prior",
    });
  });

  it("reconstructs the unscaled biexponential timing deterministically inside the 37 C human-atrial ranges", () => {
    const first = computeUnscaledExactEventCalciumTimingMetricsV2(
      NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2,
    );
    const second = computeUnscaledExactEventCalciumTimingMetricsV2(
      NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2,
    );
    const audit = buildNormalAdultHumanAtrialCalciumTimingCandidateAuditV2();

    expect(first).toEqual(second);
    expect(first.timeToPeakSec * 1000).toBeCloseTo(52.3697166393, 9);
    expect(first.postPeakRelaxationTime50Sec * 1000)
      .toBeCloseTo(170.0099459483, 9);
    expect(first.timeToTenPercentFromOnsetSec * 1000)
      .toBeCloseTo(568.4177825879, 9);
    expect(audit).toMatchObject({
      candidateId: NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_ID,
      claimBoundary:
        NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_CLAIM_BOUNDARY,
      acceptance: {
        timeToPeakWithinReportedRange: true,
        postPeakRelaxationTime50WithinReportedRange: true,
        tt90SurrogateWithinReportedTtCaRange: true,
        allTimingMetricsWithinReportedRanges: true,
        tt90IsOnlySurrogateForReportedTtCa: true,
        pvLoopOrClosedLoopMetricUsed: false,
      },
    });
    expect(audit.evidence).toBe(NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_EVIDENCE_V2);
    expect(audit.evidence).toMatchObject({
      sourceDoi: "10.1113/JP283974",
      temperatureC: 37,
      waveformTraceDigitized: false,
      calciumAmplitudeIdentified: false,
      electricalToCalciumDelayIdentified: false,
      totalTransientInterpretation:
        "onset-to-10-percent-TT90-is-a-surrogate-for-reported-TT_Ca-not-an-identity",
    });
    expect(audit.retainedUnidentifiedValues).toEqual({
      calciumDiastolicUM: 0.1,
      calciumAmplitudeUM: 0.5,
      electricalToCalciumDelaySec: 0.012,
      amplitudeClaimedAsMeasured: false,
      delayClaimedAsMeasured: false,
    });
  });

  it("binds the same V2 candidate to LA and RA in both kinematic closures and the V5 ventricular control", () => {
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const atrialCandidate = buildNormalAdultAtrialMechanicsCenterCandidateV3({
      bodySurfaceAreaM2: 1.9,
    });
    const ventricularCandidate = buildNormalAdultVentricularMechanicsCandidateV2({
      bodySurfaceAreaM2: 1.9,
      leftVentricularEndDiastolicPressurePa: 8 * PA_PER_MMHG,
    });
    const activePrior = buildNormalAdultActiveTissueClassPriorAuditV1(sha256);
    const populationOnly = buildPhaseB1MechanisticRebuildWallMaterialBindingV4(
      bundle,
      ventricularCandidate.passiveFit,
      atrialCandidate,
      activePrior,
      sha256,
    );
    const ventricularControl =
      buildPhaseB1MechanisticRebuildVentricularCalciumAblationBindingV5(
        bundle,
        ventricularCandidate.passiveFit,
        atrialCandidate,
        activePrior,
        sha256,
      );
    const sourceDistortion =
      buildPhaseB1MechanisticRebuildSourceDistortionControlBindingV6(
        bundle,
        ventricularCandidate.passiveFit,
        atrialCandidate,
        activePrior,
        sha256,
      );

    for (const binding of [populationOnly, ventricularControl, sourceDistortion]) {
      expect(binding.runtimeByWall.LA.prescribedCalciumParameters)
        .toBe(NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2);
      expect(binding.runtimeByWall.RA.prescribedCalciumParameters)
        .toBe(binding.runtimeByWall.LA.prescribedCalciumParameters);
      for (const wallId of ["LA", "RA"] as const) {
        expect(binding.descriptor.wallBindings.find((entry) => entry.wallId === wallId))
          .toMatchObject({
            prescribedCalciumEvidenceId:
              NORMAL_ADULT_HUMAN_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_V2.evidenceId,
            atrialActiveConstruction: {
              calciumTimingCandidateId:
                NORMAL_ADULT_HUMAN_ATRIAL_CALCIUM_TIMING_CANDIDATE_V2_ID,
              calciumTimingSourceDoi: "10.1113/JP283974",
              calciumTraceDigitized: false,
              calciumAmplitudeIdentifiedFromTimingSource: false,
              calciumTt90IsOnlySurrogateForReportedTtCa: true,
            },
          });
      }
    }

    expect(populationOnly.descriptor.wallBindings.find((entry) => entry.wallId === "LA")
      ?.atrialActiveConstruction?.organScaleKinematicReduction)
      .toBe(ATRIAL_POPULATION_ONLY_LAND_V1_ID);
    expect(ventricularControl.descriptor.wallBindings.find((entry) => entry.wallId === "LA")
      ?.atrialActiveConstruction?.organScaleKinematicReduction)
      .toBe(ATRIAL_POPULATION_ONLY_LAND_V1_ID);
    expect(sourceDistortion.descriptor.wallBindings.find((entry) => entry.wallId === "LA")
      ?.atrialActiveConstruction?.organScaleKinematicReduction)
      .toBe("land-2017-source-distortion-control");

    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      expect(populationOnly.runtimeByWall[wallId].prescribedCalciumParameters)
        .toBe(VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1);
      expect(sourceDistortion.runtimeByWall[wallId].prescribedCalciumParameters)
        .toBe(VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1);
    }
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
