import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1,
  runMainWireIntegratedModelPulmonaryWaveformAuditV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPulmonaryWaveformAuditV1";

describe("integrated Main V3 pulmonary waveform mechanism audit", () => {
  it("predeclares an instrumentation-only post-observation protocol with explicit evidence limits", () => {
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1,
    ).toMatchObject({
      protocolVersion: 1,
      primaryNominalDtSec: 0.002,
      primaryMaximumCycleCount: 250,
      parameterChangesApplied: false,
      waveformFittingApplied: false,
      healthGateUsedAsFitObjective: false,
      retainedAcceptedEndpointReadback: {
        nodeVolumes: ["PA", "PArt", "PCap", "PVen", "PVein"],
        edgeFlows: [
          "PV",
          "PA_PArt",
          "PArt_PCap",
          "PCap_PVen",
          "PVen_PVein",
          "PVein_LA",
        ],
        interpolationApplied: false,
        resamplingApplied: false,
        smoothingApplied: false,
      },
      numericalInterpretationTolerances: {
        materialPressureRiseMmHg: 1e-6,
        continuityResidualMl: 1e-7,
        dynamicEdgePressureBalanceResidualMmHg: 1e-8,
      },
    });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
        .literatureContext,
    ).toHaveLength(4);
  });

  it("retains the expanded accepted readback and closes continuity and the proximal dynamic-edge balance in a bounded run", async () => {
    const result =
      await runMainWireIntegratedModelPulmonaryWaveformAuditV1({
        executionPurpose: "bounded-smoke",
        maximumCycleCount: 1,
      });

    expect(result).toMatchObject({
      executionPurpose: "bounded-smoke",
      requestedMaximumCycleCount: 1,
      completedCycleCount: 1,
      classificationStatus: "not-converged",
      allCyclesFiniteConservedAndEventExact: true,
      terminalCheckpointExactRoundTripVerified: true,
      primaryMechanismAttributionEstablished: false,
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
    });
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    const diagnostics = result.diagnostics;
    expect(diagnostics.terminalTraceSampleCount).toBeGreaterThan(400);
    expect(diagnostics.terminalTraceDurationSec).toBe(1);
    expect(diagnostics.topology).toMatchObject({
      proximalDynamicEdge: "PA_PArt",
      upstreamNode: "PA",
      downstreamNode: "PArt",
      downstreamResistiveEdge: "PArt_PCap",
      paAndPartShareExternalPressureKind: true,
      respiratoryExternalPressureIsTimeInvariant: true,
    });
    expect(
      diagnostics.events.ejectionPrimaryPressureMaximum
        .pulmonaryValveFlowMlPerSec,
    ).toBeGreaterThan(0);
    expect(
      diagnostics.events.ejectionFirstClosedEndpoint
        .pulmonaryValveFlowMlPerSec,
    ).toBe(0);
    expect(
      diagnostics.acceptedContinuityAudit
        .withinPredeclaredNumericalTolerance,
    ).toBe(true);
    expect(
      diagnostics.proximalDynamicEdgeAudit
        .withinPredeclaredNumericalTolerance,
    ).toBe(true);
    expect(
      diagnostics.localLinearizedTwoNodeRlcContext.undampedPeriodSec,
    ).toBeGreaterThan(0);
    expect(
      diagnostics.wholeBedDescriptiveContext
        .pulmonaryArterialComplianceProxyMlPerMmHg,
    ).toBeGreaterThan(0);
    expect(
      diagnostics.wholeBedDescriptiveContext
        .pulmonaryVascularResistanceProxyWoodUnits,
    ).toBeGreaterThan(0);
    expect(diagnostics.graphShapeAcceptanceClaimed).toBe(false);
  }, 60_000);

  it("fails closed for shortened primary evidence, an excessive smoke horizon, or unknown options", async () => {
    await expect(
      runMainWireIntegratedModelPulmonaryWaveformAuditV1({
        executionPurpose: "primary-mechanism-audit",
        maximumCycleCount: 2,
      }),
    ).rejects.toThrow(/predeclared maximum cycle count/);
    await expect(
      runMainWireIntegratedModelPulmonaryWaveformAuditV1({
        executionPurpose: "bounded-smoke",
        maximumCycleCount: 3,
      }),
    ).rejects.toThrow(/1 through 2/);
    await expect(
      runMainWireIntegratedModelPulmonaryWaveformAuditV1({
        unexpected: true,
      } as never),
    ).rejects.toThrow(/unexpected fields/);
  });
});
