import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json";
import {
  KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
  KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_V1_ID,
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
  ThickSphereV2SelectedBackend,
  computeThickSphereV2SelectedCandidateStableHash,
  computeThickSphereV2SelectedParameterSetStableHash,
  evaluateThickSphereV2SelectedBackend,
} from "@/engine/myocardium/kinematics";
import {
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM,
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY,
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE,
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID,
  runSelectedMechanicsCalibrationReadinessReport,
} from "@/engine/myocardium/protocols/selectedMechanicsCalibrationReadiness";
import {
  loadSelectedMechanicsCalibrationReadinessValidationInput,
  validateSelectedMechanicsCalibrationReadiness,
  type TextFileInput,
} from "@/tools/myocardium/verifySelectedMechanicsCalibrationReadiness";

const baseValidationInput =
  loadSelectedMechanicsCalibrationReadinessValidationInput(process.cwd());

describe("myocardium Phase 4D selected-mechanics calibration readiness", () => {
  it("passes current Phase 4D artifacts without production, runtime, morphology, or septal/RV coverage claims", () => {
    const input = fixture();
    const validation = validateSelectedMechanicsCalibrationReadiness(input);
    const report = runSelectedMechanicsCalibrationReadinessReport();

    expect(validation.pass).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(protocolDescriptor.protocolSetId).toBe(SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID);
    expect(protocolDescriptor.phase).toBe(SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE);
    expect(protocolDescriptor.claimBoundary).toBe(SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY);
    expect(protocolDescriptor.selectedThickSphereV2CalibrationCandidateExecutableStatus).toBe(
      SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM,
    );
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.decision4Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision5Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision6Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision8Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision19Status).toBe("ACCEPTED");
    expect(protocolDescriptor.decision19ReuseStatus).toBe("accepted-owner-selection-read-only");
    expect(protocolDescriptor.phase4AFrozenStatus).toBe("frozen-read-only");
    expect(report.readinessPass).toBe(true);
    expect(report.sections).toHaveLength(9);
    expect(report.sections.every((section) => section.status === "readiness-pass")).toBe(true);
    expect(report.selectedThickSphereV2CalibrationCandidate.backendId).toBe(THICK_SPHERE_V2_SELECTED_BACKEND_ID);
    expect(report.selectedThickSphereV2CalibrationCandidate.candidateId).toBe(
      THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    );
    expect(report.selectedThickSphereV2CalibrationCandidate.productionCompletionStatus).toBe("not-claimed");
    expect(report.selectedThickSphereV2CalibrationCandidate.runtimeWiringStatus).toBe("not-runtime-wired");
    expect(report.geometryClosure.pass).toBe(true);
    expect(report.geometryClosure.idsDistinctFromPhase3Spike).toBe(true);
    expect(report.geometryClosure.hashesDistinctFromPhase3Spike).toBe(true);
    expect(report.mechanicsCompositionSmoke.pass).toBe(true);
    expect(report.mechanicsCompositionSmoke.allPressureMapsFinite).toBe(true);
    expect(report.priorGateEvidence.phase4BAReadinessPass).toBe(true);
    expect(report.priorGateEvidence.phase4BBReadinessPass).toBe(true);
    expect(report.priorGateEvidence.phase4CAReadinessPass).toBe(true);
    expect(report.priorGateEvidence.phase4CBReadinessPass).toBe(true);
    expect(report.priorGateEvidence.phase4BAExecutableKinematicsModelId).toBe(THICK_SPHERE_SPIKE_V1_ID);
    expect(report.morphologyNoAlternansBoundary.phase4BABeatStabilityReusePolicy).toBe("read-only");
    expect(report.morphologyNoAlternansBoundary.officialMorphologyOutcome).toBe("not-claimed");
    expect(report.morphologyNoAlternansBoundary.robustNoAlternans).toBe("not-claimed");
    expect(report.morphologyNoAlternansBoundary.calciumCyclingAlternansValidation).toBe("not-claimed");
    expect(report.externalSeptalCouplingBoundary.interfaceStatus).toBe("interface-and-provenance-only");
    expect(report.externalSeptalCouplingBoundary.implementationStatus).toBe("not-implemented");
  });

  it("defines v2-owned LV/RV parameter sets and stable hashes distinct from Phase 3 spike", () => {
    expect(ThickSphereV2SelectedBackend.id).toBe(THICK_SPHERE_V2_SELECTED_BACKEND_ID);
    expect(THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.backendId).toBe(THICK_SPHERE_V2_SELECTED_BACKEND_ID);
    expect(THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.selectedCandidateId).toBe(
      THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    );
    expect(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetId).toBe(
      KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    );
    expect(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetId).toBe(
      KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    );
    expect(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.sweepCavityVolumeMinM3).toBe(3.0e-5);
    expect(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3).toBe(1.1e-4);
    expect(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.sweepCavityVolumeMaxM3).toBe(1.7e-4);
    expect(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.sweepCavityVolumeMinM3).toBe(3.0e-5);
    expect(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.anchorCavityVolumeM3).toBe(8.5e-5);
    expect(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.sweepCavityVolumeMaxM3).toBe(1.45e-4);
    expect(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.provenance.lowPreloadDomainExtension)
      .toMatchObject({
        phase: "Phase 5C-B",
        lowerSweepFloorSource:
          "Phase 5C-A fixed low-preload legacy VLV envelope plus RV-domain parity",
        calibrationReadinessScope: "calibration-readiness-only",
        runtimeReplacementStatus: "not-runtime-wired",
        officialMorphologyPass: "not-claimed",
        finalNoAlternansClaim: "not-claimed",
      });
    expect(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetId).not.toBe(
      THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
    );
    expect(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetId).not.toBe(
      THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
    );
    expect(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetStableHash).not.toBe(
      THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash,
    );
    expect(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetStableHash).not.toBe(
      THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash,
    );
    expect(computeThickSphereV2SelectedParameterSetStableHash(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET)).toBe(
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetStableHash,
    );
    expect(computeThickSphereV2SelectedParameterSetStableHash(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET)).toBe(
      THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetStableHash,
    );
    expect(computeThickSphereV2SelectedCandidateStableHash()).toBe(
      THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.candidateStableHash,
    );
  });

  it("executes LV/RV candidate kinematics with finite strain and analytic derivative closure", () => {
    for (const parameterSet of [
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
      THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
    ] as const) {
      const volume = parameterSet.anchorCavityVolumeM3;
      const rate = parameterSet.ventricle === "LV" ? -1e-7 : 8e-8;
      const output = evaluateThickSphereV2SelectedBackend(
        {
          coordinates: [
            {
              id: parameterSet.coordinateId,
              valueSI: volume,
              previousValueSI: volume,
              rateSI: rate,
              unit: "m3",
            },
          ],
          instance: { moduleId: "kinematics", instanceId: `phase4d-test-${parameterSet.ventricle}` },
        },
        parameterSet,
      );
      const h = volume * 1e-5;
      const plus = evaluateThickSphereV2SelectedBackend(
        {
          coordinates: [{ id: parameterSet.coordinateId, valueSI: volume + h, previousValueSI: volume + h, rateSI: 0, unit: "m3" }],
          instance: { moduleId: "kinematics", instanceId: "phase4d-test-plus" },
        },
        parameterSet,
      );
      const minus = evaluateThickSphereV2SelectedBackend(
        {
          coordinates: [{ id: parameterSet.coordinateId, valueSI: volume - h, previousValueSI: volume - h, rateSI: 0, unit: "m3" }],
          instance: { moduleId: "kinematics", instanceId: "phase4d-test-minus" },
        },
        parameterSet,
      );
      const finiteDifference =
        (plus.fiberEngineeringStrain - minus.fiberEngineeringStrain) / (2 * h);

      expect(output.geometryHealth.finite).toBe(true);
      expect(output.geometryHealth.inCalibrationDomain).toBe(true);
      expect(output.coordinateIds).toEqual([parameterSet.coordinateId]);
      expect(output.fiberEngineeringStrain).toBeGreaterThan(-1);
      expect(output.fiberEngineeringStrainRatePerSec).toBeCloseTo(output.dStrainDCoordinate[0] * rate, 14);
      expect(output.dStrainDCoordinate[0]).toBeCloseTo(finiteDifference, 4);
    }
  });

  it("covers the LV 30 mL low-preload floor with finite geometry, derivative closure, and pressure composition smoke", () => {
    const report = runSelectedMechanicsCalibrationReadinessReport();
    const floor = THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.sweepCavityVolumeMinM3;
    const lowEnvelope = evaluateThickSphereV2SelectedBackend(
      {
        coordinates: [
          {
            id: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.coordinateId,
            valueSI: floor,
            previousValueSI: floor,
            rateSI: -8e-8,
            unit: "m3",
          },
        ],
        instance: { moduleId: "kinematics", instanceId: "phase4d-lv-low-envelope-test" },
      },
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
    );
    const lowDerivative = report.geometryClosure.finiteDifferenceSamples.find((sample) =>
      sample.ventricle === "LV" && sample.cavityVolumeM3 === floor
    );
    const lowComposition = report.mechanicsCompositionSmoke.samples.find((sample) =>
      sample.ventricle === "LV" && sample.cavityVolumeM3 === floor
    );

    expect(lowEnvelope.geometryHealth.finite).toBe(true);
    expect(lowEnvelope.geometryHealth.inCalibrationDomain).toBe(true);
    expect(Number.isFinite(lowEnvelope.dStrainDCoordinate[0])).toBe(true);
    expect(lowDerivative).toBeDefined();
    expect(lowDerivative?.finiteDifferenceScheme).toBe("forward-in-domain");
    expect(lowDerivative?.residualAbs).toBeLessThanOrEqual(
      report.geometryClosure.finiteDifferenceTolerance,
    );
    expect(lowComposition).toBeDefined();
    expect(lowComposition?.finite).toBe(true);
    expect(lowComposition?.pressureMapFinite).toBe(true);
    expect(Number.isFinite(lowComposition?.pressureMapPa)).toBe(true);
  });

  it("rejects external septal/RV coverage mutations on candidate params", () => {
    const mutatedParameterSet = {
      ...THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
      externalSeptalCoupling: {
        ...THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.externalSeptalCoupling,
        rvPressureOverloadStatus: "claimed",
      },
    } as any;

    expect(() =>
      evaluateThickSphereV2SelectedBackend(
        {
          coordinates: [
            {
              id: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.coordinateId,
              valueSI: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3,
              previousValueSI: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3,
              rateSI: 0,
              unit: "m3",
            },
          ],
          instance: { moduleId: "kinematics", instanceId: "phase4d-septal-boundary-test" },
        },
        mutatedParameterSet,
      ),
    ).toThrow(/external septal coupling/);
  });

  it("fails if v2 source aliases or re-exports Phase 3 spike identity", () => {
    const input = fixture();
    input.candidateFiles = input.candidateFiles.map((file) =>
      file.path.endsWith("thickSphereV2SelectedBackend.ts")
        ? {
          ...file,
          text:
            file.text
            + "\nexport { ThickSphereSpikeV1, THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET } "
            + "from '@/engine/myocardium/kinematics/thickSphereSpikeV1';\n",
        }
        : file
    );

    const validation = validateSelectedMechanicsCalibrationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4d_spike_alias")).toBe(true);
  });

  it("fails if the Phase 4D report source is missing from the source scan input", () => {
    const input = fixture();
    input.candidateFiles = input.candidateFiles.filter(
      (file) => !file.path.endsWith("selectedMechanicsCalibrationReadiness.ts"),
    );

    const validation = validateSelectedMechanicsCalibrationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4d_candidate_source")).toBe(true);
  });

  it("fails Decision 4/5/6/8 acceptance, production acceptance, and completed selected-backend language", () => {
    const input = fixture();
    input.descriptor.decision4Status = "ACCEPTED";
    input.descriptor.decision5Status = "ACCEPTED";
    input.descriptor.decision6Status = "ACCEPTED";
    input.descriptor.decision8Status = "ACCEPTED";
    input.descriptor.ownerAcceptanceStatus = "final-owner-acceptance";
    input.descriptor.claimExclusions.productionHomogenization = "claimed";
    input.descriptor.claimExclusions.productionPassiveLaw = "claimed";
    input.descriptor.selectedBackendCompleted = true;
    input.report.decision4Status = "ACCEPTED";
    input.report.claimExclusions.productionMechanics = "claimed";

    const validation = validateSelectedMechanicsCalibrationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4d_decision_boundary")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4d_forbidden_claim")).toBe(true);
  });

  it("fails runtime/workbench wiring and enabling flags", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      {
        path: "engine/ModelCore.ts",
        text:
          "import { evaluateThickSphereV2SelectedBackend } from '@/engine/myocardium/kinematics';\n"
          + "const backend = 'thick-sphere-v2';\n"
          + "const useProductionMechanics = true;",
      },
      {
        path: "features/workbench/WorkbenchRoute.tsx",
        text:
          '{"useRuntimeReplacement": true, "useWorkbenchRuntimeWiring": true, '
          + '"implementBiventricularCoupling": true}',
      },
    ];

    const validation = validateSelectedMechanicsCalibrationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4d_runtime_leak")).toBe(true);
  });

  it("fails official morphology, robust no-alternans, calcium-cycling, septal, RV/interdependence, and RHF overclaims", () => {
    const input = fixture();
    input.descriptor.nonCoverage = [
      "Official morphology pass is validated by this Phase 4D gate.",
      "Robust calcium-cycling no-alternans validation passed in this Phase 4D gate.",
      "A septal coordinate and biventricular coupling are implemented by this Phase 4D gate.",
      "RV pressure overload is covered by this Phase 4D gate.",
      "Septal bowing is covered by this Phase 4D gate.",
      "Ventricular interdependence is covered by this Phase 4D gate.",
      "Right-heart failure is covered by this Phase 4D gate.",
    ];
    input.descriptor.externalSeptalCouplingBoundary.implementationStatus = "implemented";
    input.descriptor.claimExclusions.officialMorphologyOutcome = "claimed";
    input.descriptor.claimExclusions.robustNoAlternans = "claimed";
    input.descriptor.claimExclusions.calciumCyclingAlternansValidation = "claimed";
    input.report.externalSeptalCouplingBoundary.septalCoordinateStatus = "implemented";
    input.report.morphologyNoAlternansBoundary.officialMorphologyOutcome = "claimed";

    const validation = validateSelectedMechanicsCalibrationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4d_forbidden_claim")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4d_external_septal_boundary")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4d_morphology_boundary")).toBe(true);
  });

  it("fails missing prior hashes, missing future TriSeg path, and current spike executable claims", () => {
    const input = fixture();
    input.report.priorGateEvidence.phase4BAStableSummaryHash = "";
    input.report.priorGateEvidence.phase4BBStableSummaryHash = "";
    input.report.priorGateEvidence.phase4CAStableSummaryHash = "";
    input.report.priorGateEvidence.phase4CBStableSummaryHash = "";
    input.report.priorGateEvidence.phase4BAReadinessPass = false;
    input.report.frozenPhase4BAExecutableEvidence.selectedThickSphereV2CandidateCurrentExecutableStatus =
      "thick-sphere-spike-v1";
    input.descriptor.futureTriSegPath.fullTriSegPath = "future escalation pending";
    input.docs = input.docs.map((file) => ({
      ...file,
      text:
        "verify:myocardium-selected-mechanics-calibration-readiness\n"
        + "selected-mechanics-calibration-readiness-only\n"
        + "The current selected candidate executable is thick-sphere-spike-v1.",
    }));

    const validation = validateSelectedMechanicsCalibrationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4d_prior_gate_evidence")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4d_future_triseg_path")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4d_current_spike_executable")).toBe(true);
  });

  it("fails vacuous geometry closure sample coverage", () => {
    const input = fixture();
    input.report.geometryClosure.samples = [];
    input.report.geometryClosure.finiteDifferenceSamples = [];
    input.report.geometryClosure.maxFiniteDifferenceResidual = Number.NEGATIVE_INFINITY;
    input.report.geometryClosure.analyticDerivativeMatchesFiniteDifference = true;
    input.report.geometryClosure.pass = true;

    const validation = validateSelectedMechanicsCalibrationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4d_geometry_closure")).toBe(true);
  });
});

type MutableValidationInput = {
  descriptor: Record<string, any>;
  report: any;
  candidateFiles: TextFileInput[];
  runtimeIntegrationFiles: TextFileInput[];
  docs: TextFileInput[];
};

function fixture(): MutableValidationInput {
  return {
    descriptor: clone(baseValidationInput.descriptor),
    report: clone(baseValidationInput.report),
    candidateFiles: baseValidationInput.candidateFiles.map((file) => ({ ...file })),
    runtimeIntegrationFiles: baseValidationInput.runtimeIntegrationFiles.map((file) => ({ ...file })),
    docs: baseValidationInput.docs.map((file) => ({ ...file })),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
