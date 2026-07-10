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
  projectWorkConjugateAtrialAVPlaneArtifactV1,
  runWorkConjugateAtrialAVPlaneBenchV1,
  type WorkConjugateAtrialAVPlaneArtifactReportV1,
  type WorkConjugateAtrialAVPlaneProfileV1,
  type WorkConjugateAtrialAVPlaneReportV1,
  type WorkConjugateAtrialAVPlaneVariantIdV1,
} from "@/engine/mechanics2/benches/WorkConjugateAtrialAVPlaneBenchV1";
import { workConjugateAtrialAVPlaneVerificationExitCodeV1 } from
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
        "laActivation01",
        "lvActivation01",
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

  it("writes the review SVG artifacts with explicit sidecar boundaries", () => {
    const repoRoot = process.cwd();
    const files = [
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-normal-hr75-review.svg",
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-normal-hr75-pv-loop.svg",
      "data/mechanics2/visuals/work-conjugate-atrial-av-plane-order-ablation-review.svg",
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
      ...profile.zRangeCm,
      ...profile.uRangeCmPerSec,
    ];
    expect(values.every((value) => Number.isFinite(value))).toBe(true);
  }

  function variant(
    variantId: WorkConjugateAtrialAVPlaneVariantIdV1,
  ) {
    const row = report.variants.find((candidate) => candidate.variantId === variantId);
    if (!row) throw new Error(`missing variant ${variantId}`);
    return row;
  }
});
