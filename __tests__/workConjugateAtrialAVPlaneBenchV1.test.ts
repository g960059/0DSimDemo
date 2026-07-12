import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from
  "@/__tests__/helpers/mechanics2ReportParity";
import workConjugateAtrialAVPlaneReport from
  "@/data/mechanics2/reports/work-conjugate-atrial-av-plane-report-v1.json";
import {
  HARD_GATE_THRESHOLDS_V1,
  WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1,
  integrateNegativeLinearFlowSegmentV1,
  pulmonaryVenousMomentumDecompositionV1,
  projectWorkConjugateAtrialAVPlaneArtifactV1,
  runWorkConjugateAtrialAVPlaneBenchV1,
  type WorkConjugateAtrialAVPlaneArtifactReportV1,
  type WorkConjugateAtrialAVPlaneProfileV1,
  type WorkConjugateAtrialAVPlaneReportV1,
  type WorkConjugateAtrialAVPlaneVariantIdV1,
} from "@/engine/mechanics2/benches/WorkConjugateAtrialAVPlaneBenchV1";
import {
  assertFiniteJsonNumbersV1,
  workConjugateAtrialAVPlaneVerificationExitCodeV1,
} from
  "@/tools/mechanics2/runWorkConjugateAtrialAVPlaneBenchV1";

describe("WorkConjugateAtrialAVPlaneBench V1", () => {
  let report: WorkConjugateAtrialAVPlaneReportV1;
  let artifactProjection: WorkConjugateAtrialAVPlaneArtifactReportV1;

  beforeAll(() => {
    report = runWorkConjugateAtrialAVPlaneBenchV1();
    artifactProjection = projectWorkConjugateAtrialAVPlaneArtifactV1(report);
  }, 120_000);

  it("keeps the recalibrated canonical profile hard-gated and morphology-diagnostic", () => {
    const canonical = variant("canonical-quasistatic-wall-viscous");
    const profile = canonical.profile;

    expect(report.inputs.canonical.laCircumferentialActiveStressMaxKPa).toBe(2.2);
    expect(report.inputs.canonical.laLongitudinalActiveStressMaxKPa).toBe(1.65);
    expect(report.inputs.canonical.lvLongitudinalActiveStressMaxKPa).toBe(30.25);
    expect(canonical.hardGates).toEqual({
      finiteAndSolverConvergence: true,
      periodicity: true,
      closedVolumeMass: true,
      hiddenSourceExactlyZero: true,
      wallVirtualWorkResidual: true,
      pressureAreaIdentity: true,
      avForcePowerResidual: true,
      passiveReferenceRestoringDerivativeNegative: true,
      allHardGatesPass: true,
    });
    expect(profile.allFinite).toBe(true);
    expect(profile.allStepsConverged).toBe(true);
    expect(profile.allAcceptedSteps).toBe(true);
    expect(profile.cycleClosure.pass).toBe(true);
    expect(profile.cycleClosure.maxAbsActivation01)
      .toBeLessThanOrEqual(HARD_GATE_THRESHOLDS_V1.periodicActivation01);
    expect(Number.isFinite(profile.cycleClosure.laActivation01)).toBe(true);
    expect(Number.isFinite(profile.cycleClosure.lvActivation01)).toBe(true);
    expect(profile.residualExtrema.maxHiddenBloodVolumeSourceMl).toBe(0);
    expect(profile.staticPassiveReference.netForceDerivativeNPerCm).toBeLessThan(0);
    expectFiniteDiagnosticPayload(profile);
    expect(canonical.diagnosticRole).toEqual({
      morphology: "owner-visual-review-required",
      mitralWaveform: "diagnostic-pending-owner-review",
      clinicalFit: false,
    });
    expect(report.acceptancePolicy.morphologyAndMvf)
      .toBe("diagnostic-pending-owner-visual-review");
    expect(report.claimBoundary).toEqual({
      runtimeWiring: false,
      defaultSelection: false,
      fullFourChamberValidation: false,
      clinicalValidation: false,
      morphologyAcceptance: false,
    });
    expect(report.model.absentMechanisms).toContain("independent-AV-spring-K");
    expect(report.model.absentMechanisms).toContain("hidden-volume");

    const canonicalMechanicalProjection = profile.samples.map((sample) => [
      sample.laVolumeMl,
      sample.lvVolumeMl,
      sample.laPressureMmHg,
      sample.lvPressureMmHg,
      sample.qPulmonaryVenousMlPerSec,
      sample.qMitralMlPerSec,
      sample.qAorticMlPerSec,
      sample.avPlanePositionCm,
      sample.avPlaneVelocityCmPerSec,
      sample.laActivation01,
      sample.lvActivation01,
    ]);
    expect(createHash("sha256")
      .update(JSON.stringify(canonicalMechanicalProjection))
      .digest("hex"))
      .toBe("ad76acaa6cbebf9940e9ac880aa4aa8bd090f17515d4ffaf179385b469513713");

    for (const row of report.envelope) {
      expect(row.finite).toBe(true);
      expect(row.allStepsConverged).toBe(true);
      expect(row.allAcceptedSteps).toBe(true);
      expect(row.periodicSteadyState).toBe(true);
      expect(row.cycleClosure.pass).toBe(true);
      expect(row.cycleClosure.maxAbsActivation01)
        .toBeLessThanOrEqual(HARD_GATE_THRESHOLDS_V1.periodicActivation01);
    }
  });

  it("keeps activation timing sensitivity transparent and non-canonical", () => {
    const timing = variant("activation-timing-sensitivity");
    const profile = timing.profile;

    expect(timing.role).toBe("activation-timing-diagnostic");
    expect(timing.activationTiming.lvDuration).toEqual({
      kind: "cycle-fraction",
      value: 0.30,
    });
    expect(timing.activationTiming.laStart).toEqual({
      kind: "cycle-fraction",
      value: 0.80,
    });
    expect(timing.params.lvWall.axes.circumferential.passiveStressScaleKPa).toBe(20);
    expect(timing.params.activation.lvFallTauSec).toBe(0.025);
    expect(timing.params.activation.laFallTauSec).toBe(0.050);
    expect(timing.description).toContain("later LA drive");
    expect(profile.allFinite).toBe(true);
    expect(profile.allStepsConverged).toBe(true);
    expect(profile.allAcceptedSteps).toBe(true);
    expectFiniteDiagnosticPayload(profile);
    expect(timing.diagnosticRole.morphology).toBe("owner-visual-review-required");
    expect(timing.diagnosticRole.mitralWaveform)
      .toBe("diagnostic-pending-owner-review");
  });

  it("isolates the event-driven LA activation law without changing mechanics or LV drive", () => {
    const canonical = variant("canonical-quasistatic-wall-viscous");
    const eventActivation = variant("event-driven-atrial-activation-ablation");
    const baselineReadback = canonical.profile.activationReadback;
    const eventReadback = eventActivation.profile.activationReadback;

    expect(eventActivation.role).toBe("activation-model-diagnostic");
    expect(eventActivation.params).toEqual(canonical.params);
    expect(eventActivation.activationTiming).toEqual(canonical.activationTiming);
    expect(eventActivation.activationModel.kind)
      .toBe("event-driven-ca-like-bounded-state");
    if (eventActivation.activationModel.kind !==
      "event-driven-ca-like-bounded-state") {
      throw new Error("event activation model kind must be event-driven");
    }
    expect(eventActivation.activationModel.fixedHillMapping).toEqual({
      halfMaxCalciumDrive: 0.5,
      coefficient: 2,
    });
    expect(eventActivation.activationModel.eventHistory).toEqual({
      kind: "finite-periodic-history-no-beat-reset",
      decayTauMultiples: 32,
      riseTauMultiples: 16,
    });
    expect(eventActivation.activationModel).toEqual(eventActivation.profile.activationModel);
    expect(eventActivation.profile.samples.map((sample) =>
      sample.lvActivationDrive01
    )).toEqual(canonical.profile.samples.map((sample) =>
      sample.lvActivationDrive01
    ));
    expect(eventActivation.profile.samples.map((sample) =>
      sample.laElectricalActivation01
    )).toEqual(canonical.profile.samples.map((sample) =>
      sample.laElectricalActivation01
    ));
    expect(eventActivation.hardGates.allHardGatesPass).toBe(true);
    expect(eventReadback.eventReference)
      .toBe("prescribed-effective-sidecar-event");
    expect(eventReadback.phaseBoundarySource).toBe("realized-grid-event-onset");
    expect(eventReadback.laEventOnsetTheta)
      .toBeCloseTo(eventReadback.laNominalEventOnsetTheta +
        eventReadback.laEventGridOffsetSec /
        eventActivation.profile.cycleLengthSec, 14);
    const eventSampleIndex = eventActivation.profile.samples.findIndex(
      (sample) => sample.theta === eventReadback.laEventOnsetTheta,
    );
    expect(eventSampleIndex).toBeGreaterThanOrEqual(0);
    const firstPostEventSample = eventActivation.profile.samples[
      (eventSampleIndex + 1) % eventActivation.profile.samples.length
    ]!;
    expect(eventReadback.laCalciumDriveAtFirstDriveSample)
      .toBe(firstPostEventSample.laCalciumDrive);
    expect(eventReadback.laCalciumDriveAtFirstDriveSample).not.toBe(
      eventActivation.profile.samples[0]!.laCalciumDrive,
    );
    expect(Number.isFinite(eventReadback.laEventToContractilePeakSec)).toBe(true);
    expect(eventReadback.laContractileRt50Sec === null ||
      Number.isFinite(eventReadback.laContractileRt50Sec)).toBe(true);
    expect(eventReadback.laContractilePeak01).toBeGreaterThan(0);
    expect(eventReadback.laContractilePeak01).toBeLessThanOrEqual(1);
    expect(Number.isFinite(
      eventReadback.laActivationAtMitralClosingConductanceMidpoint01,
    )).toBe(true);
    expect(eventReadback.pressurePeakVolumePosition.measurementValid).toBe(true);
    expect(Number.isFinite(
      eventReadback.pressurePeakVolumePosition.fractionFromMinimumToEventVolume,
    )).toBe(true);
    expect(eventActivation.profile.laPvLobes).toHaveProperty("reason");
    expect(["present", "absent"]).toContain(
      eventReadback.pulmonaryVenousAtrialReversal.status,
    );
    expect(baselineReadback.modelKind).toBe("legacy-rectangular-first-order");
    for (const profile of [canonical.profile, eventActivation.profile]) {
      const y = profile.xvyPressureReadback;
      expect([
        "interior-trough",
        "right-censored-at-atrial-event",
        "not-measurable-mitral-opening-fallback",
      ])
        .toContain(y.yDescentMeasurementStatus);
      if (y.yDescentMeasurementStatus === "right-censored-at-atrial-event") {
        expect(Math.abs(y.yToAtrialEventMarginSec))
          .toBeLessThanOrEqual(profile.dtSec);
      }
    }
  });

  it("records static-root and dt diagnostics without turning their current values into gates", () => {
    expect(report.staticRootEnvelope.role).toBe("report-only-not-hard-gated");
    expect(report.staticRootEnvelope.caseCount).toBe(81);
    expect(report.staticRootEnvelope.cases).toHaveLength(81);
    expect(report.staticRootEnvelope.mathematicalGlobalUniquenessProof).toBe(false);
    expect(report.staticRootEnvelope.method)
      .toBe("uniform-0.01cm-sign-change-bracketing-plus-bisection");
    expect(
      report.staticRootEnvelope.uniqueStableRootCaseCount +
      report.staticRootEnvelope.zeroRootCaseCount +
      report.staticRootEnvelope.multipleRootCaseCount,
    ).toBeLessThanOrEqual(81);
    expect(Number.isFinite(
      report.staticRootEnvelope.minimumRootBoundaryMarginCm,
    )).toBe(true);
    expect(Number.isFinite(
      report.staticRootEnvelope.maximumAbsRootForceResidualN,
    )).toBe(true);
    expect(Number.isFinite(
      report.staticRootEnvelope.minimumAbsNetForceDerivativeNPerCm,
    )).toBe(true);
    for (const row of report.staticRootEnvelope.cases) {
      expect(row.rootCount).toBe(row.roots.length);
      for (const root of row.roots) {
        expect(Number.isFinite(root.avPlanePositionCm)).toBe(true);
        expect(Number.isFinite(root.boundaryMarginCm)).toBe(true);
        expect(Number.isFinite(root.forceResidualN)).toBe(true);
        expect(Number.isFinite(root.netForceDerivativeNPerCm)).toBe(true);
        expect(typeof root.stableRestoringSign).toBe("boolean");
      }
    }

    expect(report.activationDtSensitivity.cases.map((row) => row.dtSec))
      .toEqual([0.001, 0.0005, 0.00025]);
    for (const row of report.activationDtSensitivity.cases) {
      expect(typeof row.periodicSteadyState).toBe("boolean");
      expect(typeof row.allHardGatesPass).toBe("boolean");
      expect(Number.isFinite(row.laContractilePeak01)).toBe(true);
      expect(Number.isFinite(row.laEventToContractilePeakSec)).toBe(true);
    }
    const dtDifference =
      report.activationDtSensitivity.coarseToFineAbsoluteDifference;
    expect(Number.isFinite(dtDifference.laContractilePeak01)).toBe(true);
    expect(Number.isFinite(dtDifference.laEventToContractilePeakSec)).toBe(true);
  });

  it("keeps phase attribution one-factor-at-a-time and morphology report-only", () => {
    const attribution = report.phaseAttribution;
    const reference = attribution.reference;

    expect(attribution.role)
      .toBe("report-only-one-factor-at-a-time-causal-screen");
    expect(attribution.baselineVariantId)
      .toBe("event-driven-atrial-activation-ablation");
    expect(attribution.physiologyHardGated).toBe(false);
    expect(attribution.perturbationBasis)
      .toBe("local-engineering-brackets-not-clinical-priors-or-fit-bounds");
    expect(attribution.literatureContext.role)
      .toBe("soft-display-context-not-hard-gates");
    expect(attribution.literatureContext.currentEventIsSurfacePWave).toBe(false);
    expect(attribution.literatureContext.currentEventIsLocalLaDepolarization)
      .toBe(false);
    expect(attribution.literatureContext.aorticValveHasLeafletClosureState)
      .toBe(false);
    expect(attribution.literatureContext
      .flowEndToMitralConductanceOpeningComparableToClinicalIvrt)
      .toBe(false);
    expect(attribution.literatureContext.ivrtSoftEnvelopeSec)
      .toEqual([0.060, 0.100]);
    expect(attribution.literatureContext.aggregateQpvVelocityGateAllowed)
      .toBe(false);
    expect(attribution.literatureContext.sources.length).toBeGreaterThan(0);
    expect(reference.position).toBe("reference");
    expect(reference.parameterValue).toBeNull();
    expect(reference.deltaFromReference).toBeNull();
    expect(reference.changedParameterPaths).toEqual([]);
    expect(reference.singleFactorIsolation.differingLeafPaths).toEqual([]);
    expect(reference.singleFactorIsolation.exactDeclaredPathMatch).toBe(true);
    expect(attribution.factors.map((factor) => factor.factorId)).toEqual([
      "effective-event-to-calcium-delay",
      "lv-activation-fall-time",
      "pulmonary-venous-series-resistance",
    ]);

    for (const factor of attribution.factors) {
      expect(factor.cases).toHaveLength(2);
      for (const row of factor.cases) {
        expect(row.changedParameterPaths).toEqual([factor.parameterPath]);
        expect(row.parameterValue).not.toBe(factor.referenceValue);
        expect(row.deltaFromReference).toBeCloseTo(
          (row.parameterValue ?? factor.referenceValue) - factor.referenceValue,
          14,
        );
        expect(row.singleFactorIsolation).toEqual({
          activationModelFamilyUnchanged: true,
          wallActiveStressAmplitudeUnchanged: true,
          wallAndAvPlaneLawUnchanged: true,
          bloodVolumeLedgerUnchanged: true,
          nonlinearUnknownCount: 10,
          noRuntimeOrDefaultWiring: true,
          differingLeafPaths: [factor.parameterPath],
          exactDeclaredPathMatch: true,
        });
        expect(row.readback.laEventOnsetTheta)
          .toBe(reference.readback.laEventOnsetTheta);
        expect(row.trace.length).toBeGreaterThan(0);
        expect(row.trace.length)
          .toBeLessThan(variant("event-driven-atrial-activation-ablation")
            .profile.samples.length);
        expect(row.trace.every((sample) =>
          Object.values(sample).every(Number.isFinite)
        )).toBe(true);
        for (const value of Object.values(row.numerics)) {
          expect(typeof value).toBe("boolean");
        }
        expect(["present", "absent"]).toContain(
          row.readback.pulmonaryVenousAtrialReversalStatus,
        );
        expect(typeof row.readback
          .aorticFlowEndToMitralConductanceOpeningMeasurementValid)
          .toBe("boolean");
        expect(Number.isFinite(
          row.readback.pulmonaryVenousMomentumIdentityMaxAbsResidualMmHg,
        )).toBe(true);
        expect(
          row.readback.pulmonaryVenousMomentumIdentityMaxAbsResidualMmHg,
        ).toBeLessThan(1e-7);
        expect(row.readback.pulmonaryVenousMomentumDifferenceSampleCount)
          .toBeGreaterThan(0);
        expect(row.readback.pulmonaryVenousMomentumDifferenceSource)
          .toBe(
            "within-final-cycle-endpoint-differences-excludes-cycle-boundary",
          );
        expect(["measurable", "not-measurable"])
          .toContain(row.readback.laPvLobeStatus);
      }
    }

    const referenceLaActivation = reference.trace.map((sample) =>
      sample.laActivation01
    );
    const referenceLvActivation = reference.trace.map((sample) =>
      sample.lvActivation01
    );
    const expectTraceClose = (
      actual: readonly number[],
      expected: readonly number[],
    ) => {
      expect(actual).toHaveLength(expected.length);
      actual.forEach((value, index) => {
        expect(Math.abs(value - expected[index]!)).toBeLessThan(1e-12);
      });
    };
    const delay = attribution.factors[0]!;
    const lvRelaxation = attribution.factors[1]!;
    const pulmonaryVenousResistance = attribution.factors[2]!;
    for (const row of delay.cases) {
      expectTraceClose(
        row.trace.map((sample) => sample.lvActivation01),
        referenceLvActivation,
      );
    }
    for (const row of lvRelaxation.cases) {
      expectTraceClose(
        row.trace.map((sample) => sample.laActivation01),
        referenceLaActivation,
      );
    }
    for (const row of pulmonaryVenousResistance.cases) {
      expectTraceClose(
        row.trace.map((sample) => sample.laActivation01),
        referenceLaActivation,
      );
      expectTraceClose(
        row.trace.map((sample) => sample.lvActivation01),
        referenceLvActivation,
      );
    }
    for (const row of [
      reference,
      ...attribution.factors.flatMap((factor) => factor.cases),
    ]) {
      expect(
        row.readback.pulmonaryVenousMomentumIdentityMaxAbsResidualMmHg,
      ).toBeLessThan(1e-7);
    }
  });

  it("keeps activation-by-AVPD screening free-coupled and auditable", () => {
    const interaction = report.activationAvpdInteraction;
    const activationPath =
      "activationModel.params.calciumKernel.riseTauSec";
    const avpdPath =
      "params.lvWall.axes.longitudinal.activeStressMaxKPa";

    expect(interaction.role)
      .toBe("report-only-free-coupled-two-factor-interaction-screen");
    expect(interaction.design).toBe("center-plus-four-corners");
    expect(interaction.physiologyHardGated).toBe(false);
    expect(interaction.fittingBounds).toBe(false);
    expect(interaction.explicitActivationTimesAvPlaneCrossTerm).toBe(false);
    expect(interaction.avPlaneTrajectoryPrescribed).toBe(false);
    expect(interaction.avpdEmergesFromSharedWallForceBalance).toBe(true);
    expect(interaction.factors.activation.parameterPath).toBe(activationPath);
    expect(interaction.factors.avpdDriver.parameterPath).toBe(avpdPath);
    expect(interaction.factors.avpdDriver
      .fixedLvCircumferentialActiveStressMaxKPa).toBe(55);
    expect(interaction.factors.avpdDriver
      .derivedLongitudinalToCircumferentialActiveStressMaxRatios)
      .toEqual([0.45, 0.55, 0.65]);
    expect(interaction.cases.map((row) => row.caseId)).toEqual([
      "interaction-center",
      "fast-rise-low-lv-longitudinal",
      "fast-rise-high-lv-longitudinal",
      "slow-rise-low-lv-longitudinal",
      "slow-rise-high-lv-longitudinal",
    ]);
    expect(interaction.cases.map((row) =>
      row.lvLongitudinalToCircumferentialActiveStressMaxRatio
    )).toEqual([0.55, 0.45, 0.65, 0.45, 0.65]);
    const center = interaction.cases[0]!;
    expect(center.position).toBe("center");
    expect(center.changedParameterPaths).toEqual([]);
    expect(center.configurationAudit.differingLeafPaths).toEqual([]);
    expect(center.configurationAudit.exactDeclaredPathMatch).toBe(true);
    for (const row of interaction.cases.slice(1)) {
      expect(row.position).toBe("corner");
      expect(row.changedParameterPaths).toEqual([activationPath, avpdPath]);
      expect(row.configurationAudit.differingLeafPaths)
        .toEqual([activationPath, avpdPath]);
      expect(row.configurationAudit.exactDeclaredPathMatch).toBe(true);
      expect(row.configurationAudit.activationModelFamilyUnchanged).toBe(true);
      expect(row.configurationAudit.lvCircumferentialActiveStressMaxKPa)
        .toBe(55);
      expect(row.configurationAudit
        .lvLongitudinalActiveStressMaxIsDeclaredAvpdDriver).toBe(true);
      expect(row.configurationAudit.allOtherWallParametersUnchanged).toBe(true);
      expect(row.configurationAudit.avPlaneCoordinateEquationUnchanged)
        .toBe(true);
      expect(row.configurationAudit.avPlaneTrajectoryPrescribed).toBe(false);
      expect(row.configurationAudit.explicitActivationTimesAvPlaneCrossTerm)
        .toBe(false);
      expect(row.configurationAudit.bloodVolumeLedgerUnchanged).toBe(true);
      expect(row.configurationAudit.nonlinearUnknownCount).toBe(10);
      expect(row.numerics.allHardGatesPass).toBe(true);
      expect([
        "interior-ivct-peak",
        "boundary-at-mitral-closing-conductance-midpoint",
        "boundary-at-aortic-flow-onset",
        "not-measurable",
      ]).toContain(row.readback.cWaveCandidateStatus);
      for (const value of [
        row.readback.laContractilePeak01,
        row.readback.laContractileStateTimeIntegralSec,
        row.readback.laActiveZWorkSignedJ,
        row.readback.laActiveZWorkAbsoluteJ,
        row.readback.lvRealizedActiveStressAtCircumferentialPeak
          .circumferentialKPa,
        row.readback.lvRealizedActiveStressAtCircumferentialPeak
          .longitudinalKPa,
        row.readback.lvActiveZForcePeakAbsN,
        row.readback.lvActiveZWorkSignedJ,
        row.readback.lvActiveZWorkAbsoluteJ,
      ]) expect(Number.isFinite(value)).toBe(true);
      expect(row.readback.lvRealizedActiveStressAtCircumferentialPeak
        .longitudinalToCircumferentialRatio === null ||
        Number.isFinite(row.readback.lvRealizedActiveStressAtCircumferentialPeak
          .longitudinalToCircumferentialRatio)).toBe(true);
      expect(typeof row.readback
        .mitralClosingMidpointToAorticFlowEndMeasurementValid)
        .toBe("boolean");
      if (row.readback
        .mitralClosingMidpointToAorticFlowEndMeasurementValid) {
        expect(Number.isFinite(row.readback
          .mitralClosingMidpointToAorticFlowEndDisplacementCm)).toBe(true);
        expect(Number.isFinite(row.readback
          .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec))
          .toBe(true);
      }
      expect(row.trace.length).toBeGreaterThan(0);
      expect(row.trace.every((sample) =>
        Object.values(sample).every(Number.isFinite)
      )).toBe(true);
    }
    expect(interaction.evidenceBoundary
      .independentAvpdObservationRequiredForJointFitting).toBe(true);
    expect(interaction.evidenceBoundary.laPvLoopAloneIdentifiesBothFactors)
      .toBe(false);
    expect(interaction.evidenceBoundary
      .sufficiencyForParameterIdentifiabilityEstablished).toBe(false);
    expect(interaction.evidenceBoundary.recommendedIndependentObservables)
      .toContain("time-resolved-AVPD-or-mitral-annular-motion");
    expect(interaction.evidenceBoundary.sources.length).toBeGreaterThan(0);
    expect(interaction.interactionContrast.noClinicalMagnitudeThreshold)
      .toBe(true);
    for (const value of [
      interaction.interactionContrast.avPlaneCycleExcursionCm,
      interaction.interactionContrast.cardiacOutputLPerMin,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
    }
    for (const value of [
      interaction.interactionContrast
        .mitralClosingMidpointToAorticFlowEndDisplacementCm,
      interaction.interactionContrast
        .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec,
      interaction.interactionContrast.pressurePeakVolumePositionFraction,
      interaction.interactionContrast.cToXDepthMmHg,
    ]) {
      expect(value === null || Number.isFinite(value)).toBe(true);
    }
    expect(interaction.interactionContrast.yDescentDepthMmHg).toBeNull();
    expect(interaction.interactionContrast.yDescentContrastStatus)
      .toBe("not-measurable-one-or-more-censored-or-fallback");
    expect([
      "homogeneous-interior-candidate",
      "homogeneous-boundary-candidate",
      "not-measurable-or-heterogeneous-candidate-definition",
    ]).toContain(interaction.interactionContrast.cToXContrastStatus);
    expect(interaction.interactionContrast.cToXDepthMmHg).toBeNull();
    expect(interaction.interactionContrast.cToXContrastStatus)
      .toBe("not-measurable-or-heterogeneous-candidate-definition");
    expect(interaction.interactionContrast.normalizedMagnitudePolicy)
      .toBe("absolute-contrast-divided-by-four-corner-range-null-if-range-not-positive");
    for (const value of Object.values(
      interaction.interactionContrast.cornerRangeNormalizedMagnitude,
    )) expect(value === null || Number.isFinite(value)).toBe(true);
    const interactionDt = interaction.discretizationRobustness;
    expect(interactionDt.role)
      .toBe("report-only-four-corner-interaction-discretization-check");
    expect(interactionDt.physiologyGate).toBe(false);
    expect(interactionDt.dtValuesSec).toEqual([0.001, 0.0005, 0.00025]);
    expect(interactionDt.cases).toHaveLength(3);
    for (const row of interactionDt.cases) {
      expect(row.allCornersFinite).toBe(true);
      expect(row.allCornersPeriodicSteadyState).toBe(true);
      expect(row.allCornersHardGatesPass).toBe(true);
      for (const value of Object.values(row.contrast)) {
        expect(value === null || Number.isFinite(value)).toBe(true);
      }
      for (const value of Object.values(
        row.cornerRangeNormalizedMagnitude,
      )) expect(value === null || Number.isFinite(value)).toBe(true);
    }
    for (const value of Object.values(interactionDt.signStableAcrossDt)) {
      expect(value === null || typeof value === "boolean").toBe(true);
    }
    expect(interactionDt.signStableAcrossDt
      .mitralClosingMidpointToAorticFlowEndDisplacementCm).toBe(true);
    expect(interactionDt.signStableAcrossDt
      .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec)
      .toBe(true);
    expect(interactionDt.signStableAcrossDt
      .pressurePeakVolumePositionFraction).toBe(false);
    expect(interactionDt.signStableAcrossDt.cToXDepthMmHg).toBeNull();
    for (const value of Object.values(
      interactionDt.coarseToFineAbsoluteDifference,
    )) expect(value === null || Number.isFinite(value)).toBe(true);
  });

  it("varies only the prescribed LV RT50 phenotype target and fails closed on legacy substitution", () => {
    const screen = report.lvRelaxationPhenotypeScreen;
    const center = screen.engineeringCenter.readback.phenotype;

    expect(screen.role)
      .toBe("report-only-fixed-dose-lv-contractile-rt50-screen");
    expect(screen.design).toBe("one-factor-three-dose-phenotype-manifold");
    expect(screen.physiologyHardGated).toBe(false);
    expect(screen.clinicalFit).toBe(false);
    expect(screen.phenotypeContract.targetHeldFixed).toEqual([
      "effective-onset-delay",
      "time-from-event-to-peak",
      "peak-excursion",
      "excursion-integral",
    ]);
    expect(screen.phenotypeContract.targetVaried)
      .toBe("relaxation-time-to-50");
    expect(screen.phenotypeContract.doseFactors).toEqual([0.92, 1, 1.08]);
    expect(screen.phenotypeContract.coupledTargetNormalizedResidualTolerance)
      .toBe(0.015);
    expect(screen.phenotypeContract.runtimeFutureLookingNormalization)
      .toBe(false);

    expect(screen.legacyLvSubstitutionAudit.calibration.status)
      .toBe("non-converged");
    expect(screen.legacyLvSubstitutionAudit.calibration.internalParams)
      .toBeNull();
    expect(screen.legacyLvSubstitutionAudit.eventDrivenReplacementInstalled)
      .toBe(false);
    expect(screen.legacyLvSubstitutionAudit.targetPhenotype
      .timeFromEventToPeakSec).toBeGreaterThan(0.295);
    expect(screen.legacyLvSubstitutionAudit.targetPhenotype
      .timeFromEventToPeakSec).toBeLessThan(0.305);
    expect(screen.legacyLvSubstitutionAudit.targetPhenotype
      .baselineDefinition).toBe("periodic-pre-event");

    expect(screen.cases.map((row) => row.caseId)).toEqual([
      "lv-rt50-low",
      "lv-rt50-center",
      "lv-rt50-high",
    ]);
    for (const row of screen.cases) {
      expect(row.calibration.status).toBe("converged");
      expect(row.calibration.internalParams).not.toBeNull();
      expect(row.calibration.localJacobianCondition).not.toBeNull();
      expect(Number.isFinite(row.calibration.localJacobianCondition!)).toBe(true);
      expect(row.calibration.targetResiduals!.normalizedMaximumAbsolute)
        .toBeLessThanOrEqual(0.015);
      expect(row.installationStatus)
        .toBe("installed-for-report-only-screen");
      expect(row.configurationAudit.allNonRt50PhenotypeTargetsIdentical)
        .toBe(true);
      expect(row.configurationAudit.laActivationFixed).toBe(true);
      expect(row.configurationAudit.lvWallFixed).toBe(true);
      expect(row.configurationAudit.valveAndCircuitParametersFixed).toBe(true);
      expect(row.configurationAudit.avPlaneTrajectoryPrescribed).toBe(false);
      expect(row.configurationAudit.bloodVolumeLedgerUnchanged).toBe(true);
      expect(row.configurationAudit.nonlinearUnknownCount).toBe(10);
      expect(row.targetPhenotype.timeFromEventToPeakSec)
        .toBe(center.timeFromEventToPeakSec);
      expect(row.targetPhenotype.peakExcursion01)
        .toBe(center.peakExcursion01);
      expect(row.targetPhenotype.excursionIntegralSec)
        .toBe(center.excursionIntegralSec);
      expect(row.targetPhenotype.relaxationTimeTo50Sec)
        .toBeCloseTo(row.rt50DoseFactor * center.relaxationTimeTo50Sec, 14);
      expect(row.numerics).not.toBeNull();
      expect(row.numerics!.allHardGatesPass).toBe(true);
      expect(row.readback).not.toBeNull();
      expect(row.readback!.coupledTargetWithinTolerance).toBe(true);
      expect(row.readback!.coupledTargetResiduals.normalizedMaximumAbsolute)
        .toBeLessThanOrEqual(0.015);
      expect(row.readback!.pressureFlowTimingIsAnatomicalValveClaim)
        .toBe(false);
      expect(row.readback!.pressureFlowTimingIsClinicalIvrtClaim).toBe(false);
      expect(row.readback!.conductanceTimingIsAnatomicalValveClaim).toBe(false);
      expect(row.readback!.aorticClosingToMitralOpeningStatus)
        .toBe("measurable-pressure-flow-contract");
      expect(row.readback!.aorticClosingToMitralOpeningSec).toBeGreaterThan(0);
      const pressureFlowInterval =
        row.readback!.aorticClosingToMitralOpeningUncertaintyIntervalSec;
      expect(pressureFlowInterval).not.toBeNull();
      expect(pressureFlowInterval!.lowerBoundSec)
        .toBeLessThanOrEqual(row.readback!.aorticClosingToMitralOpeningSec!);
      expect(pressureFlowInterval!.upperBoundSec)
        .toBeGreaterThanOrEqual(row.readback!.aorticClosingToMitralOpeningSec!);
      expect(row.valvePhaseEvents?.aortic.closing.status).toBe("measurable");
      expect(row.valvePhaseEvents?.mitral.opening.status).toBe("measurable");
      expect(row.valvePhaseEvents?.aortic.conductanceMidpoint
        .anatomicalValveEventClaim).toBe(false);
      expect(row.trace.length).toBeGreaterThan(0);
      expect(row.trace.at(-1)!.theta).toBe(1);
      expect(row.trace.every((sample) =>
        Object.values(sample).every(Number.isFinite)
      )).toBe(true);
    }
    expect(screen.result).toEqual({
      allMappingsInstallable: true,
      allCasesPassMechanicalHardGates: true,
      anyInteriorY: false,
      anySeparatedEa: false,
      anyPartialEaFusion: true,
      verdict: "local-fixed-dose-does-not-resolve-interior-y-or-ea-separation",
    });
    const dt = screen.discretizationRobustness;
    expect(dt.role)
      .toBe("report-only-fixed-raw-parameter-lv-phenotype-dt-check");
    expect(dt.physiologyGate).toBe(false);
    expect(dt.eventGridPhaseRobustnessEvaluated).toBe(false);
    expect(dt.limitation)
      .toBe("dt-grids-share-the-same-event-alignment-no-half-step-phase-shift-test");
    expect(dt.dtValuesSec).toEqual([0.001, 0.0005, 0.00025]);
    for (const row of dt.cases) {
      expect(row.allRowsFinite).toBe(true);
      expect(row.allRowsPeriodicSteadyState).toBe(true);
      expect(row.allRowsHardGatesPass).toBe(true);
      expect(row.rows).toHaveLength(3);
      expect(row.rows.every((item) =>
        item.realizedLvRt50Sec !== null &&
        item.aorticClosingToMitralOpeningSec !== null
      )).toBe(true);
      expect(row.rows.every((item) =>
        item.pressureFlowIntervalMeasurable &&
        item.aorticPressureFlowClosingStatus === "measurable" &&
        item.aorticPressureFlowClosingReason ===
          "one-qualified-pressure-flow-event" &&
        item.mitralPressureFlowOpeningStatus === "measurable" &&
        item.mitralPressureFlowOpeningReason ===
          "one-qualified-pressure-flow-event"
      )).toBe(true);
    }
    expect(dt.classificationStableAcrossDt).toEqual({
      pressureFlowIntervalMeasurable: true,
      mitralFusionClass: true,
      yDescentMeasurementStatus: true,
    });
    for (const value of Object.values(
      dt.coarseToFineMaximumAbsoluteDifferenceAcrossDoses,
    )) expect(value === null || Number.isFinite(value)).toBe(true);

    for (const row of report.variants) {
      expect(row.profile.valvePhaseEvents.mitral.inputValidation.status)
        .toBe("valid");
      expect(row.profile.valvePhaseEvents.aortic.inputValidation.status)
        .toBe("valid");
      expect(row.profile.valvePhaseEvents.mitral.observationMode)
        .toBe("periodic-tiled-center-cycle");
      expect(row.profile.valvePhaseEvents.aortic.observationMode)
        .toBe("periodic-tiled-center-cycle");
      expect(row.profile.valvePhaseEvents.mitral.claimBoundary)
        .toEqual({
          reportOnly: true,
          modifiesSolverState: false,
          anatomicalLeafletTimingClaim: false,
        });
    }
  });

  it("interpolates valve conductance midpoints instead of using the next sample", () => {
    const profile = variant("event-driven-atrial-activation-ablation").profile;
    const samples = profile.samples;
    const expectedCrossingTheta = (
      field: "mitralOpen01" | "aorticOpen01",
      direction: "opening" | "closing",
      afterTheta: number,
    ): number => {
      for (let index = 1; index < samples.length; index += 1) {
        const previous = samples[index - 1]!;
        const current = samples[index]!;
        if (current.theta <= afterTheta) continue;
        const crosses = direction === "opening"
          ? previous[field] < 0.5 && current[field] >= 0.5
          : previous[field] >= 0.5 && current[field] < 0.5;
        if (!crosses) continue;
        const fraction = (0.5 - previous[field]) /
          (current[field] - previous[field]);
        const theta = previous.theta +
          fraction * (current.theta - previous.theta);
        expect(theta).toBeGreaterThan(previous.theta);
        expect(theta).toBeLessThan(current.theta);
        return theta;
      }
      throw new Error(`missing ${field} ${direction} crossing`);
    };
    const mitralClosingTheta = expectedCrossingTheta(
      "mitralOpen01",
      "closing",
      0,
    );
    const mitralOpeningTheta = expectedCrossingTheta(
      "mitralOpen01",
      "opening",
      mitralClosingTheta,
    );
    const aorticOpeningTheta = expectedCrossingTheta(
      "aorticOpen01",
      "opening",
      mitralClosingTheta,
    );
    const aorticClosingTheta = expectedCrossingTheta(
      "aorticOpen01",
      "closing",
      aorticOpeningTheta,
    );
    expect(profile.xvyPressureReadback
      .mitralClosingConductanceMidpointTheta)
      .toBeCloseTo(mitralClosingTheta, 14);
    expect(profile.xvyPressureReadback
      .mitralClosingConductanceMidpointStatus).toBe("threshold-crossing");
    expect(profile.xvyPressureReadback
      .mitralOpeningConductanceMidpointTheta)
      .toBeCloseTo(mitralOpeningTheta, 14);
    expect(profile.xvyPressureReadback
      .mitralOpeningConductanceMidpointStatus).toBe("threshold-crossing");
    expect(profile.xvyPressureReadback.aorticConductanceOpeningMidpointTheta)
      .toBeCloseTo(aorticOpeningTheta, 14);
    expect(profile.xvyPressureReadback.aorticConductanceClosingMidpointTheta)
      .toBeCloseTo(aorticClosingTheta, 14);
  });

  it("retains noncanonical controls without turning morphology into a hard gate", () => {
    const legacy = variant("legacy-inherited-inertia-m1p1-negative-control");
    const highVisc = variant("higher-wall-viscosity-topology-control");

    expect(legacy.role).toBe("negative-control");
    expect(legacy.profile.allAcceptedSteps).toBe(true);
    expect(legacy.profile.periodicSteadyState).toBe(false);
    expect(legacy.hardGates.periodicity).toBe(false);
    expect(legacy.hardGates.allHardGatesPass).toBe(false);

    expect(highVisc.hardGates.allHardGatesPass).toBe(true);
    expectFiniteDiagnosticPayload(highVisc.profile);
    expect(highVisc.diagnosticRole.morphology).toBe("owner-visual-review-required");
  });

  it("integrates only the negative portion of a linearly crossing PV-flow segment", () => {
    expect(integrateNegativeLinearFlowSegmentV1(1, -1, 0.002)).toEqual({
      durationSec: 0.001,
      reverseVolumeMl: 0.0005,
    });
    expect(integrateNegativeLinearFlowSegmentV1(-1, 1, 0.002)).toEqual({
      durationSec: 0.001,
      reverseVolumeMl: 0.0005,
    });
    expect(integrateNegativeLinearFlowSegmentV1(-2, -4, 0.002)).toEqual({
      durationSec: 0.002,
      reverseVolumeMl: 0.006,
    });
    expect(integrateNegativeLinearFlowSegmentV1(1, 2, 0.002)).toEqual({
      durationSec: 0,
      reverseVolumeMl: 0,
    });
  });

  it("keeps the PV momentum pressure-drop signs and units explicit", () => {
    expect(pulmonaryVenousMomentumDecompositionV1({
      previousFlowMlPerSec: 10,
      currentFlowMlPerSec: 12,
      pulmonaryVenousPressureMmHg: 15,
      laPressureMmHg: 5,
      dtSec: 0.1,
      resistanceMmHgSecPerMl: 0.5,
      inertanceMmHgSec2PerMl: 0.2,
    })).toEqual({
      pressureGradientMmHg: 10,
      resistiveDropMmHg: 6,
      inertialDropMmHg: 4,
      identityResidualMmHg: 0,
    });
    expect(() => pulmonaryVenousMomentumDecompositionV1({
      previousFlowMlPerSec: 0,
      currentFlowMlPerSec: 0,
      pulmonaryVenousPressureMmHg: 0,
      laPressureMmHg: 0,
      dtSec: 0,
      resistanceMmHgSecPerMl: 0,
      inertanceMmHgSec2PerMl: 0,
    })).toThrow(/positive dt/);
  });

  it("projects raw event-aware compact traces without changing summaries or gates", () => {
    expect(artifactProjection.variants).toHaveLength(report.variants.length);
    for (const compactVariant of artifactProjection.variants) {
      const fullVariant = variant(compactVariant.variantId);
      const metadata = compactVariant.profile.compactTrace;
      expect(compactVariant.params).toEqual(fullVariant.params);
      expect(compactVariant.hardGates).toEqual(fullVariant.hardGates);
      const {
        samples: _compactSamples,
        compactTrace: _compactTrace,
        ...compactProfileSummary
      } = compactVariant.profile;
      const { samples: _fullSamples, ...fullProfileSummary } = fullVariant.profile;
      expect(compactProfileSummary).toEqual(fullProfileSummary);
      expect(metadata.rawDtSec).toBe(fullVariant.profile.dtSec);
      expect(metadata.strideSamples)
        .toBe(WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1);
      expect(metadata.sourceSampleCount).toBe(fullVariant.profile.samples.length);
      expect(metadata.retainedSampleCount).toBe(compactVariant.profile.samples.length);
      expect(metadata.retainedSampleCount).toBeLessThan(metadata.sourceSampleCount);
      expect(metadata.gatesAndSummariesComputedFromFullTrace).toBe(true);
      expect(metadata.rendererUsesFullInMemoryTrace).toBe(true);

      const sample = compactVariant.profile.samples[0]!;
      expect(Object.keys(sample)).toEqual([
        "theta",
        "phase",
        "laVolumeMl",
        "lvVolumeMl",
        "laPressureMmHg",
        "lvPressureMmHg",
        "qPulmonaryVenousMlPerSec",
        "qMitralMlPerSec",
        "qAorticMlPerSec",
        "avPlanePositionCm",
        "avPlaneVelocityCmPerSec",
        "laActivationDrive01",
        "laCalciumDrive",
        "laActivation01",
        "lvActivation01",
        "laActiveTransmuralPressureMmHg",
        "laTotalFzN",
        "lvTotalFzN",
        "avWallForceSumN",
        "avForceResidualN",
        "maxNormalizedEquationResidual",
        "acceptedStep",
      ]);

      for (const sourceIndex of Object.values(metadata.retainedEventSourceIndices)) {
        const sourceSample = fullVariant.profile.samples[sourceIndex]!;
        expect(compactVariant.profile.samples.some((candidate) =>
          candidate.theta === sourceSample.theta
        )).toBe(true);
      }
    }
  });

  it("keeps the compact committed report artifact and hash aligned", () => {
    expectMechanics2ReportArtifactParity(
      workConjugateAtrialAVPlaneReport,
      artifactProjection,
    );
    const artifactPath = resolve(
      process.cwd(),
      "data/mechanics2/reports/work-conjugate-atrial-av-plane-report-v1.json",
    );
    expect(statSync(artifactPath).size).toBeLessThanOrEqual(3 * 1024 * 1024);
  }, 120_000);

  it("keeps the dedicated LV phenotype report hashed with its display traces", () => {
    const artifactPath = resolve(
      process.cwd(),
      "data/mechanics2/reports/work-conjugate-atrial-av-plane-lv-relaxation-phenotype-v1.json",
    );
    const parsed = JSON.parse(readFileSync(artifactPath, "utf8")) as {
      readonly normalizedSha256: string;
      readonly role: string;
      readonly cases: readonly { readonly trace: readonly unknown[] }[];
    } & Record<string, unknown>;
    const { normalizedSha256, ...payload } = parsed;
    expect(createHash("sha256").update(JSON.stringify(payload)).digest("hex"))
      .toBe(normalizedSha256);
    expect(payload).toEqual(report.lvRelaxationPhenotypeScreen);
    expect(parsed.role)
      .toBe("report-only-fixed-dose-lv-contractile-rt50-screen");
    expect(parsed.cases).toHaveLength(3);
    expect(parsed.cases.every((row) => row.trace.length > 0)).toBe(true);
    expect(artifactProjection.lvRelaxationPhenotypeScreen.compactTraceStorage)
      .toBe("dedicated-lv-relaxation-phenotype-report");
    expect(artifactProjection.lvRelaxationPhenotypeScreen.cases.every((row) =>
      !("trace" in row)
    )).toBe(true);
  });

  it("fails closed before JSON serialization can turn non-finite numbers into null", () => {
    expect(() => assertFiniteJsonNumbersV1({ nested: [0, Number.NaN] }))
      .toThrow("root.nested[1] must be a finite JSON number");
    expect(() => assertFiniteJsonNumbersV1({ value: Number.POSITIVE_INFINITY }))
      .toThrow("root.value must be a finite JSON number");
    expect(() => assertFiniteJsonNumbersV1({ value: null })).not.toThrow();
  });

  it("returns a failing exit code after preserving a diagnostic report", () => {
    expect(workConjugateAtrialAVPlaneVerificationExitCodeV1({
      canonicalHardGates: report.canonicalHardGates,
    })).toBe(0);
    expect(workConjugateAtrialAVPlaneVerificationExitCodeV1({
      canonicalHardGates: {
        ...report.canonicalHardGates,
        allHardGatesPass: false,
      },
    })).toBe(1);
  });

  it("nulls the c-like candidate when MV closing uses a fallback extremum", () => {
    const legacy = variant("legacy-inherited-inertia-m1p1-negative-control");
    const xvy = legacy.profile.xvyPressureReadback;
    expect(xvy.mitralClosingConductanceMidpointStatus)
      .toBe("fallback-extremum");
    expect(xvy.cWaveCandidate).toEqual({
      status: "not-measurable",
      peakTheta: null,
      peakPressureMmHg: null,
      riseFromMitralClosingConductanceMidpointMmHg: null,
      cToXDepthMmHg: null,
      cToXSec: null,
      cToXNonIncreasingFraction: null,
      postCSecondaryRiseMmHg: null,
    });
  });

  it("writes the review SVG artifacts with explicit sidecar boundaries", () => {
    const repoRoot = process.cwd();
    const files = [
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-normal-hr75-review.svg",
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-normal-hr75-pv-loop.svg",
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-order-ablation-review.svg",
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-activation-ablation-review.svg",
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-phase-attribution-review.svg",
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-activation-avpd-interaction-review.svg",
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-lv-relaxation-phenotype-review.svg",
    ];
    for (const file of files) {
      const absolute = resolve(repoRoot, file);
      expect(existsSync(absolute)).toBe(true);
      const svg = readFileSync(absolute, "utf8");
      expect(svg).toContain("<svg");
      expect(svg.toLowerCase()).toContain("sidecar");
    }

    const composite = readFileSync(resolve(repoRoot, files[0]!), "utf8");
    expect(composite).toContain("no independent AV spring K");
    expect(composite).toContain("no hidden volume/source");
    expect(composite).toContain("cycle phase theta (-)");

    const pvOnly = readFileSync(resolve(repoRoot, files[1]!), "utf8");
    expect(pvOnly).toContain("LA blood volume V_LA (mL)");
    expect(pvOnly).toContain("LA pressure P_LA (mmHg)");
    expect(pvOnly).not.toContain("measurable:measurable");

    const ablation = readFileSync(resolve(repoRoot, files[2]!), "utf8");
    expect(ablation).toContain("LA blood volume V_LA (mL)");
    expect(ablation).toContain("LA pressure P_LA (mmHg)");

    const activationAblation = readFileSync(resolve(repoRoot, files[3]!), "utf8");
    expect(activationAblation).toContain("event → Ca-like → bounded state");
    expect(activationAblation).toContain("shared PV axes");
    expect(activationAblation).toContain("P_act / peak");
    expect(activationAblation).toContain("Activation alone is therefore insufficient");
    expect(activationAblation).toContain("E/A not measurable (complete-fusion)");
    expect(activationAblation)
      .toContain("A/v not measurable (multiple-self-intersections)");
    expect(activationAblation).toContain("not a global proof");
    expect(activationAblation).toContain("event-censored");

    const phaseAttribution = readFileSync(resolve(repoRoot, files[4]!), "utf8");
    expect(phaseAttribution).toContain("one factor at a time");
    expect(phaseAttribution).toContain("shared axes");
    expect(phaseAttribution).toContain("x' uses a c-like candidate");
    expect(phaseAttribution).toContain("neither is clinical IVRT");
    expect(phaseAttribution).toContain("Delay alone does not separate E/A or generate Ar");
    expect(phaseAttribution).toContain("invasive LV pressure tau");
    expect(phaseAttribution).toContain("Local R alone is insufficient");
    expect(phaseAttribution)
      .toContain("Do not gate strict MV-close-conductance-midpoint→x monotonicity");

    const interaction = readFileSync(resolve(repoRoot, files[5]!), "utf8");
    expect(interaction).toContain("free-coupled sidecar");
    expect(interaction).toContain("no prescribed z(t)");
    expect(interaction).toContain("no explicit cross-term");
    expect(interaction).toContain("Difference-of-differences");
    expect(interaction).toContain("y=n/m");
    expect(interaction).toContain("event-censored");
    expect(interaction).toContain("LA PV shape alone is insufficient");
    expect(interaction).toContain("it is not a morphology success");

    const lvPhenotype = readFileSync(resolve(repoRoot, files[6]!), "utf8");
    expect(lvPhenotype).toContain("phenotype-normalized LV RT50");
    expect(lvPhenotype).toContain("The legacy LV plateau was not installed");
    expect(lvPhenotype).toContain("P-qualified Q proxy");
    expect(lvPhenotype)
      .toContain("not anatomical leaflet timing or clinical IVRT");
    expect(lvPhenotype).toContain("there is no interior y");
    expect(lvPhenotype).toContain("Partial fusion is not separation");
    expect(lvPhenotype).toContain("not legacy-equivalent");
  });

  function expectFiniteDiagnosticPayload(
    profile: WorkConjugateAtrialAVPlaneProfileV1,
  ): void {
    expect(profile.samples.length).toBeGreaterThan(0);
    expect(profile.laPvLobes).toHaveProperty("status");
    expect(profile.laPvLobes).toHaveProperty("aLoopAreaMmHgMl");
    expect(profile.laPvLobes).toHaveProperty("vLoopAreaMmHgMl");
    const values = [
      profile.laPvLobes.aLoopAreaMmHgMl,
      profile.laPvLobes.vLoopAreaMmHgMl,
      profile.laPvLobes.aToVAreaRatio,
      profile.laPvLobes.crossingAngleDeg,
      profile.pathOrdering.conduitBeforeCrossingBelowReservoirPathFraction,
      profile.pathOrdering.pumpingAfterCrossingAboveReservoirPathFraction,
      profile.mitral.peakEToARatio,
      profile.mitral.vtiEToARatio,
      profile.xvyPressureReadback.xDescentDepthMmHg,
      profile.xvyPressureReadback
        .mitralClosingConductanceMidpointToXSec,
      profile.xvyPressureReadback
        .postMitralClosingConductanceMidpointToXNonIncreasingFraction,
      profile.xvyPressureReadback
        .postMitralClosingConductanceMidpointSecondaryRiseMmHg,
      profile.xvyPressureReadback.aorticConductanceOpeningMidpointTheta,
      profile.xvyPressureReadback.aorticConductanceClosingMidpointTheta,
      profile.xvyPressureReadback
        .aorticFlowAtConductanceClosingMidpointMlPerSec,
      profile.xvyPressureReadback.aorticForwardFlowStartTheta,
      profile.xvyPressureReadback.aorticForwardFlowEndTheta,
      profile.xvyPressureReadback
        .mitralOpeningConductanceMidpointToYSec,
      profile.xvyPressureReadback.yToAtrialEventMarginSec,
      profile.activationReadback.laActivationDrivePeak01,
      profile.activationReadback.laContractilePeak01,
      profile.activationReadback.laEventToContractilePeakSec,
      profile.activationReadback.laActiveTransmuralPressurePeakMmHg,
      ...profile.zRangeCm,
      ...profile.uRangeCmPerSec,
    ];
    expect(values.every((value) => Number.isFinite(value))).toBe(true);
    const nullableValues = [
      profile.xvyPressureReadback
        .aorticFlowEndToMitralConductanceOpeningSec,
      profile.xvyPressureReadback.cWaveCandidate.peakTheta,
      profile.xvyPressureReadback.cWaveCandidate.peakPressureMmHg,
      profile.xvyPressureReadback.cWaveCandidate
        .riseFromMitralClosingConductanceMidpointMmHg,
      profile.xvyPressureReadback.cWaveCandidate.cToXDepthMmHg,
      profile.xvyPressureReadback.cWaveCandidate.cToXSec,
      profile.xvyPressureReadback.cWaveCandidate.cToXNonIncreasingFraction,
      profile.xvyPressureReadback.cWaveCandidate.postCSecondaryRiseMmHg,
    ];
    expect(nullableValues.every((value) =>
      value === null || Number.isFinite(value)
    )).toBe(true);
    expect([
      "interior-ivct-peak",
      "boundary-at-mitral-closing-conductance-midpoint",
      "boundary-at-aortic-flow-onset",
      "not-measurable",
    ]).toContain(profile.xvyPressureReadback.cWaveCandidate.status);
    expect(["threshold-crossing", "fallback-extremum"])
      .toContain(
        profile.xvyPressureReadback
          .mitralClosingConductanceMidpointStatus,
      );
    expect(["threshold-crossing", "fallback-extremum"])
      .toContain(
        profile.xvyPressureReadback
          .mitralOpeningConductanceMidpointStatus,
      );
    expect(["threshold-crossing", "fallback-extremum"])
      .toContain(
        profile.xvyPressureReadback.aorticConductanceOpeningMidpointStatus,
      );
    expect(["threshold-crossing", "fallback-extremum"])
      .toContain(
        profile.xvyPressureReadback.aorticConductanceClosingMidpointStatus,
      );
    expect(["linear-zero-crossing", "fallback-nearest-zero"])
      .toContain(profile.xvyPressureReadback.aorticForwardFlowStartStatus);
    expect(["linear-zero-crossing", "fallback-nearest-zero"])
      .toContain(profile.xvyPressureReadback.aorticForwardFlowEndStatus);
    expect(typeof profile.xvyPressureReadback
      .aorticFlowEndToMitralConductanceOpeningMeasurementValid)
      .toBe("boolean");
    if (profile.xvyPressureReadback
      .aorticFlowEndToMitralConductanceOpeningMeasurementValid) {
      expect(Number.isFinite(profile.xvyPressureReadback
        .aorticFlowEndToMitralConductanceOpeningSec)).toBe(true);
    } else {
      expect(profile.xvyPressureReadback
        .aorticFlowEndToMitralConductanceOpeningSec).toBeNull();
    }
    const cValues = [
      profile.xvyPressureReadback.cWaveCandidate.peakTheta,
      profile.xvyPressureReadback.cWaveCandidate.peakPressureMmHg,
      profile.xvyPressureReadback.cWaveCandidate
        .riseFromMitralClosingConductanceMidpointMmHg,
      profile.xvyPressureReadback.cWaveCandidate.cToXDepthMmHg,
      profile.xvyPressureReadback.cWaveCandidate.cToXSec,
      profile.xvyPressureReadback.cWaveCandidate.cToXNonIncreasingFraction,
      profile.xvyPressureReadback.cWaveCandidate.postCSecondaryRiseMmHg,
    ];
    if (profile.xvyPressureReadback.cWaveCandidate.status ===
      "not-measurable") {
      expect(cValues.every((value) => value === null)).toBe(true);
    } else {
      expect(cValues.every((value) => Number.isFinite(value))).toBe(true);
    }
  }

  function variant(
    variantId: WorkConjugateAtrialAVPlaneVariantIdV1,
  ) {
    const row = report.variants.find((candidate) => candidate.variantId === variantId);
    if (!row) throw new Error(`missing variant ${variantId}`);
    return row;
  }
});
