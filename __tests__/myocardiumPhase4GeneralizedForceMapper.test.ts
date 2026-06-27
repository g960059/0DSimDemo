import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/generalized-force-mapper-phase4c-protocols.json";
import phase4CADescriptor from "@/data/myocardium/protocols/passive-energy-phase4c-protocols.json";
import {
  VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
  VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
  VirtualPowerNominalEngineeringV1,
  evaluateVirtualPowerGeneralizedForceV1,
  type VirtualPowerGeneralizedForceV1Input,
} from "@/engine/myocardium/mechanics";
import {
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID,
  runGeneralizedForceMapperReadinessReport,
} from "@/engine/myocardium/protocols/generalizedForceMapperReadiness";
import {
  loadGeneralizedForceMapperReadinessValidationInput,
  validateGeneralizedForceMapperReadiness,
  type TextFileInput,
} from "@/tools/myocardium/verifyGeneralizedForceMapperReadiness";

describe("myocardium Phase 4C-B generalized-force mapper readiness", () => {
  it("passes current artifacts without owner acceptance, runtime wiring, or Phase 4C-A semantic drift", () => {
    const input = fixture();
    const validation = validateGeneralizedForceMapperReadiness(input);
    const report = runGeneralizedForceMapperReadinessReport();

    expect(validation.pass).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(protocolDescriptor.protocolSetId).toBe(GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID);
    expect(protocolDescriptor.phase).toBe(GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE);
    expect(protocolDescriptor.claimBoundary).toBe(GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY);
    expect(protocolDescriptor.evidenceStatus).toBe(GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS);
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.decision4Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision5Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision6Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision8Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision19Status).toBe("ACCEPTED");
    expect(protocolDescriptor.decision19ReuseStatus).toBe("accepted-owner-selection-read-only");
    expect(
      protocolDescriptor.acceptedOwnerDecisionEvidence.some(
        (decision) =>
          decision.decisionId === 19
          && decision.status === "ACCEPTED"
          && decision.reusePolicy === "read-only",
      ),
    ).toBe(true);
    expect(protocolDescriptor.mapperCandidate.modelId).toBe(VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID);
    expect(phase4CADescriptor.protocolSettings.enableMultiCoordinateGeneralizedForceMapper).toBe(false);
    expect(report.readinessPass).toBe(true);
    expect(report.sections).toHaveLength(7);
    expect(report.sections.every((section) => section.status === "readiness-pass")).toBe(true);
    expect(report.mapperEvidence.maxVirtualPowerResidualAbsW).toBeLessThanOrEqual(
      report.mapperEvidence.virtualPowerResidualToleranceW,
    );
    expect(report.mapperEvidence.directionalClosure.pass).toBe(true);
    expect(report.priorGateEvidence.phase3BClosurePass).toBe(true);
    expect(report.priorGateEvidence.phase4BAReadinessPass).toBe(true);
    expect(report.priorGateEvidence.phase4BBReadinessPass).toBe(true);
    expect(report.priorGateEvidence.phase4CAReadinessPass).toBe(true);
    expect(report.priorGateEvidence.phase4CAEnableMultiCoordinateGeneralizedForceMapper).toBe(false);
    expect(report.priorGateEvidence.decision19OwnerSelectionAccepted).toBe(true);
    expect(report.priorGateEvidence.decision19SelectedCandidateId).toBe(
      "thick-sphere-v2-explicit-external-septal-coupling",
    );
  });

  it("reduces to virtual-power-nominal-engineering-v1 for a single cavity-volume coordinate", () => {
    const input = scalarMapperInput();
    const nominal = VirtualPowerNominalEngineeringV1.evaluate(input);
    const generalized = evaluateVirtualPowerGeneralizedForceV1({
      ...input,
      coordinateUnitsById: undefined,
    });

    expect(nominal.coordinateIds).toEqual(generalized.coordinateIds);
    expect(Array.from(generalized.activeContributionsSI)).toEqual(Array.from(nominal.activeContributionsSI));
    expect(Array.from(generalized.passiveContributionsSI)).toEqual(Array.from(nominal.passiveContributionsSI));
    expect(Array.from(generalized.viscousContributionsSI)).toEqual(Array.from(nominal.viscousContributionsSI));
    expect(Array.from(generalized.conjugateForcesSI)).toEqual(Array.from(nominal.conjugateForcesSI));
    expect(generalized.virtualPowerResidualW).toBe(nominal.virtualPowerResidualW);
    expect(generalized.volumeCoordinatePressurePa).toEqual(nominal.volumeCoordinatePressurePa);
  });

  it("maps active, passive, and viscous stress to multi-coordinate forces and m3-only pressure output", () => {
    const input = multiCoordinateMapperInput();
    const output = evaluateVirtualPowerGeneralizedForceV1(input);
    const wallVolume = input.kinematics.wallReferenceVolumeM3;
    const derivatives = Array.from(input.kinematics.dStrainDCoordinate);
    const totalStress =
      input.active.wallActiveNominalStressPa
      + input.passive.passiveNominalStressPa
      + input.passive.viscousNominalStressPa;
    const expectedActive = derivatives.map(
      (derivative) => derivative === 0 ? 0 : wallVolume * input.active.wallActiveNominalStressPa * derivative,
    );
    const expectedPassive = derivatives.map(
      (derivative) => derivative === 0 ? 0 : wallVolume * input.passive.passiveNominalStressPa * derivative,
    );
    const expectedViscous = derivatives.map(
      (derivative) => derivative === 0 ? 0 : wallVolume * input.passive.viscousNominalStressPa * derivative,
    );
    const expectedTotal = derivatives.map((derivative) =>
      derivative === 0 ? 0 : wallVolume * totalStress * derivative
    );

    expect(Array.from(output.activeContributionsSI)).toEqual(expectedActive);
    expect(Array.from(output.passiveContributionsSI)).toEqual(expectedPassive);
    expect(Array.from(output.viscousContributionsSI)).toEqual(expectedViscous);
    expect(Array.from(output.conjugateForcesSI)).toEqual(expectedTotal);
    expect(output.conjugateForcesSI[2]).toBe(0);
    expect(output.activeContributionsSI[2]).toBe(0);
    expect(output.passiveContributionsSI[2]).toBe(0);
    expect(output.viscousContributionsSI[2]).toBe(0);
    expect(output.volumeCoordinatePressurePa).toEqual({
      "cavity-volume": output.conjugateForcesSI[0],
    });
    expect(output.volumeCoordinatePressurePa?.["septal-displacement"]).toBeUndefined();
    expect(Math.abs(output.virtualPowerResidualW)).toBeLessThan(1e-15);
  });

  it("requires explicit coordinate rates when multiple derivative coordinates are nonzero", () => {
    const input = multiCoordinateMapperInput();
    delete (input as { coordinateRatesSI?: readonly number[] }).coordinateRatesSI;

    expect(() => evaluateVirtualPowerGeneralizedForceV1(input)).toThrow(/coordinateRatesSI/);
  });

  it("rejects unit and pressure-map mistakes", () => {
    const missingUnits = multiCoordinateMapperInput();
    delete (missingUnits as { coordinateUnitsById?: Record<string, string> }).coordinateUnitsById;

    expect(() => evaluateVirtualPowerGeneralizedForceV1(missingUnits)).toThrow(/coordinateUnitsById/);
    expect(() =>
      evaluateVirtualPowerGeneralizedForceV1({
        ...multiCoordinateMapperInput(),
        coordinateUnitsById: {
          "cavity-volume": "m3",
          "septal-displacement": "cm",
          "av-plane-displacement": "m",
        } as any,
      })
    ).toThrow(/unit m3 or m/);

    const displacementOnly = evaluateVirtualPowerGeneralizedForceV1({
      ...multiCoordinateMapperInput(),
      kinematics: {
        ...multiCoordinateMapperInput().kinematics,
        coordinateIds: ["septal-displacement"],
        dStrainDCoordinate: Float64Array.of(-0.25),
        fiberEngineeringStrainRatePerSec: 2e-4,
      },
      coordinateRatesSI: [-8e-4],
      coordinateUnitsById: { "septal-displacement": "m" },
    });
    expect(displacementOnly.volumeCoordinatePressurePa).toBeUndefined();

    const scalarDisplacementWithoutUnit = evaluateVirtualPowerGeneralizedForceV1({
      ...multiCoordinateMapperInput(),
      kinematics: {
        ...multiCoordinateMapperInput().kinematics,
        coordinateIds: ["septal-displacement"],
        dStrainDCoordinate: Float64Array.of(-0.25),
        fiberEngineeringStrainRatePerSec: 2e-4,
      },
      coordinateRatesSI: [-8e-4],
      coordinateUnitsById: undefined,
    });
    expect(scalarDisplacementWithoutUnit.volumeCoordinatePressurePa).toBeUndefined();
  });

  it("rejects mismatched arrays, duplicate ids, nonfinite values, nonpositive wall volume, and invalid geometry health", () => {
    const cases: Array<{ label: string; mutate: (input: VirtualPowerGeneralizedForceV1Input) => void; pattern: RegExp }> = [
      {
        label: "empty coordinate array",
        mutate: (input) => {
          (input.kinematics as any).coordinateIds = [];
          (input.kinematics as any).dStrainDCoordinate = new Float64Array();
          (input as any).coordinateRatesSI = [];
        },
        pattern: /at least one generalized coordinate/,
      },
      {
        label: "mismatched derivatives",
        mutate: (input) => {
          (input.kinematics as any).dStrainDCoordinate = Float64Array.of(1, 2);
        },
        pattern: /lengths must match/,
      },
      {
        label: "mismatched rates",
        mutate: (input) => {
          (input as any).coordinateRatesSI = [1, 2];
        },
        pattern: /coordinateRatesSI length/,
      },
      {
        label: "duplicate ids",
        mutate: (input) => {
          (input.kinematics as any).coordinateIds = ["cavity-volume", "cavity-volume", "av-plane-displacement"];
        },
        pattern: /duplicate coordinate id/,
      },
      {
        label: "nonfinite derivative",
        mutate: (input) => {
          (input.kinematics as any).dStrainDCoordinate = Float64Array.of(2000, Number.NaN, 0);
        },
        pattern: /dStrainDCoordinate\[1\] must be finite/,
      },
      {
        label: "nonfinite active stress",
        mutate: (input) => {
          (input.active as any).wallActiveNominalStressPa = Number.POSITIVE_INFINITY;
        },
        pattern: /wallActiveNominalStressPa must be finite/,
      },
      {
        label: "nonfinite rate",
        mutate: (input) => {
          (input as any).coordinateRatesSI = [1.2e-7, Number.NaN, 5e-4];
        },
        pattern: /coordinateRatesSI\[1\] must be finite/,
      },
      {
        label: "nonpositive wall volume",
        mutate: (input) => {
          (input.kinematics as any).wallReferenceVolumeM3 = 0;
        },
        pattern: /wallReferenceVolumeM3 must be positive and finite/,
      },
      {
        label: "invalid geometry health",
        mutate: (input) => {
          (input.kinematics.geometryHealth as any).finite = false;
        },
        pattern: /finite in-domain kinematics/,
      },
    ];

    for (const testCase of cases) {
      const input = multiCoordinateMapperInput();
      testCase.mutate(input);
      expect(
        () => evaluateVirtualPowerGeneralizedForceV1(input),
        testCase.label,
      ).toThrow(testCase.pattern);
    }
  });

  it("fails Decision, official morphology, atrial bridge, and runtime overclaims", () => {
    const input = fixture();
    input.descriptor.ownerAcceptanceStatus = "final-owner-acceptance";
    input.descriptor.decision19Status = "PENDING OWNER";
    input.descriptor.acceptedOwnerDecisionEvidence[0].reusePolicy = "runtime-wiring";
    input.descriptor.claimExclusions.officialMorphologyOutcome = "claimed";
    input.descriptor.claimExclusions.atrialBridgeSelection = "selected";
    input.descriptor.morphologyPass = true;
    input.descriptor.nonCoverage = [
      "Official morphology is covered by this Phase 4C-B gate.",
      "Atrial bridge selection is selected by this Phase 4C-B gate.",
      "RV pressure overload is covered by this Phase 4C-B gate.",
      "Septal bowing is covered by this Phase 4C-B gate.",
      "Ventricular interdependence is covered by this Phase 4C-B gate.",
      "Right-heart failure is covered by this Phase 4C-B gate.",
    ];
    input.runtimeIntegrationFiles = [
      {
        path: "engine/ModelCore.ts",
        text:
          "import { evaluateVirtualPowerGeneralizedForceV1 } from '@/engine/myocardium/mechanics';\n"
          + "const mapper = 'virtual-power-generalized-force-v1';\n"
          + "const enableMultiCoordinateGeneralizedForceMapper = true;",
      },
      {
        path: "data/cases/runtime.json",
        text:
          '{"useProductionMechanics": true, "useStateSchemaWiring": true, '
          + '"enableMultiCoordinateGeneralizedForceMapper": true}',
      },
      {
        path: "components/workbench/PanelGrid.tsx",
        text: "const mapper = 'virtual-power-generalized-force-v1';",
      },
    ];

    const validation = validateGeneralizedForceMapperReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_forbidden_claim")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_decision19_reuse")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_positive_pass_claim")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_coverage_overclaim")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_runtime_leak")).toBe(true);
  });

  it("fails missing prior evidence, Phase 4C-A mapper-disabled evidence, and noncoverage/TriSeg boundaries", () => {
    const input = fixture();
    input.report.priorGateEvidence.phase3BClosurePass = false;
    input.report.priorGateEvidence.phase4BAReadinessPass = false;
    input.report.priorGateEvidence.phase4BBReadinessPass = false;
    input.report.priorGateEvidence.phase4CAReadinessPass = false;
    input.report.priorGateEvidence.phase3BStableSummaryHash = "";
    input.report.priorGateEvidence.phase4CAEnableMultiCoordinateGeneralizedForceMapper = true;
    input.phase4CADescriptor.protocolSettings.enableMultiCoordinateGeneralizedForceMapper = true;
    input.descriptor.sourceDocuments = input.descriptor.sourceDocuments.filter(
      (source: { path?: string }) =>
        source.path !== "data/myocardium/protocols/passive-energy-phase4c-protocols.json",
    );
    input.descriptor.nonCoverage = [];
    input.descriptor.futureTriSegPath.fullTriSegPath = "future path pending";
    input.docs = input.docs.map((file) => ({
      ...file,
      text: "verify:myocardium-generalized-force-mapper-readiness\nPhase 4C-B report.",
    }));

    const validation = validateGeneralizedForceMapperReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_prior_gate_evidence")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4ca_descriptor_boundary")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_direct_provenance")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_non_coverage")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_future_triseg_path")).toBe(true);
  });

  it("fails mapper isolation if concrete kinematics engines or Land implementation imports appear", () => {
    const input = fixture();
    input.candidateFiles = input.candidateFiles.map((file) =>
      file.path.endsWith("virtualPowerGeneralizedForceV1.ts")
        ? {
          ...file,
          text:
            file.text
            + "\nimport { ThickSphereSpikeV1 } from '@/engine/myocardium/kinematics/thickSphereSpikeV1';"
            + "\nimport { solveLand2017 } from '@/engine/myocardium/myofilament/land2017/solver';\n",
        }
        : file
    );

    const validation = validateGeneralizedForceMapperReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4cb_mapper_isolation")).toBe(true);
  });
});

type MutableValidationInput = {
  descriptor: Record<string, any>;
  phase4CADescriptor: Record<string, any>;
  report: any;
  candidateFiles: TextFileInput[];
  runtimeIntegrationFiles: TextFileInput[];
  docs: TextFileInput[];
};

function fixture(): MutableValidationInput {
  const input = loadGeneralizedForceMapperReadinessValidationInput(process.cwd());
  return {
    descriptor: clone(input.descriptor),
    phase4CADescriptor: clone(input.phase4CADescriptor),
    report: clone(input.report),
    candidateFiles: input.candidateFiles.map((file) => ({ ...file })),
    runtimeIntegrationFiles: input.runtimeIntegrationFiles.map((file) => ({ ...file })),
    docs: input.docs.map((file) => ({ ...file })),
  };
}

function scalarMapperInput(): VirtualPowerGeneralizedForceV1Input {
  return {
    kinematics: {
      sarcomereLengthM: 2.08e-6,
      fiberStretchRatio: 1.04,
      fiberEngineeringStrain: 0.04,
      fiberEngineeringStrainRatePerSec: 4.2e-4,
      coordinateIds: ["cavity-volume"],
      dStrainDCoordinate: Float64Array.of(1750),
      wallReferenceVolumeM3: 1.2e-4,
      geometryHealth: {
        finite: true,
        inCalibrationDomain: true,
      },
    },
    active: {
      wallActiveNominalStressPa: 33000,
      wallStabilizationStiffnessPa: 52000,
      wallAlgorithmicTangentPa: 61000,
      homogenizationModelId: "synthetic-active-stress-test-fixture-v1",
      activeTissueFraction: 1,
      orientationRuleId: "synthetic-orientation-test-fixture-v1",
    },
    passive: {
      passiveNominalStressPa: 4500,
      viscousNominalStressPa: -700,
      dPassiveStressDStrainPa: 88000,
      storedEnergyDensityJPerM3: 20,
      dissipationDensityWPerM3: 0.294,
    },
  };
}

function multiCoordinateMapperInput(): VirtualPowerGeneralizedForceV1Input {
  return {
    kinematics: {
      sarcomereLengthM: 2.1e-6,
      fiberStretchRatio: 1.05,
      fiberEngineeringStrain: 0.05,
      fiberEngineeringStrainRatePerSec: 4.4e-4,
      coordinateIds: ["cavity-volume", "septal-displacement", "av-plane-displacement"],
      dStrainDCoordinate: Float64Array.of(2000, -0.25, 0),
      wallReferenceVolumeM3: 1.1e-4,
      geometryHealth: {
        finite: true,
        inCalibrationDomain: true,
      },
    },
    active: {
      wallActiveNominalStressPa: 42000,
      wallStabilizationStiffnessPa: 50000,
      wallAlgorithmicTangentPa: 60000,
      homogenizationModelId: "synthetic-active-stress-test-fixture-v1",
      activeTissueFraction: 1,
      orientationRuleId: "synthetic-orientation-test-fixture-v1",
    },
    passive: {
      passiveNominalStressPa: 8000,
      viscousNominalStressPa: -2000,
      dPassiveStressDStrainPa: 90000,
      storedEnergyDensityJPerM3: 100,
      dissipationDensityWPerM3: 0.88,
    },
    coordinateRatesSI: [1.2e-7, -8e-4, 5e-4],
    coordinateUnitsById: {
      "cavity-volume": "m3",
      "septal-displacement": "m",
      "av-plane-displacement": "m",
    },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
