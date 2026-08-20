import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sha256CanonicalJsonHex, sha256TextHex } from "@/engine/integrity";
import {
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DECLARATION_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_NEGATIVE_CLAIMS_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1,
} from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotDefinitionV1";
import {
  evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1,
  projectMainWireIntrinsicVentricularPassiveReducedHessianV1,
  type MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1,
} from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotMathematicsV1";
import {
  auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1,
  createMainWireIntrinsicVentricularPassiveReducedSurfaceStageRecordV1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_COMMITTED_PAYLOAD_SHA256_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_IMPLEMENTATION_COMMIT_SHA_V1,
  projectMainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointToMathInputV1,
  type MainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointV1,
  type MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1,
} from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1";
import { createMainWirePassiveEquilibriumManufacturedCasesV1 } from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonCorpusV1";
import {
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
  solveMainWirePassiveEquilibriumPointEngineeringV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonEngineeringV1";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";
import type { MainWireNormalAdultPassiveEquilibriumMatrix4V3 } from "@/engine/myocardium/experiments/MainWireNormalAdultPassiveEquilibriumCandidateEngineeringV1";
import {
  assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactSizeV1,
  assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotOutputAbsentV1,
} from "@/tools/scientific/MainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactV1";

describe("intrinsic ventricular passive reduced-surface pilot V1", () => {
  it("freezes the declaration, grid, selected solver, protocol hash, and negative claims", async () => {
    expect(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DECLARATION_V1,
    ).toMatchObject({
      commitSha: "e93801ed221c9b3c74b9d837c8d89920c90cbe35",
      documentGitBlobSha1: "42fc0c01e3b27f69e40d6365d42fabc62999ada6",
      declarationStatus: "committed-before-first-normal-adult-pilot-evaluation",
    });
    expect(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1,
    ).toHaveLength(25);
    expect(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1.map(
        (point) => point.pointId,
      ),
    ).toEqual(
      Array.from({ length: 5 }, (_, leftIndex) =>
        Array.from(
          { length: 5 },
          (_, rightIndex) => `grid-lv-${leftIndex}-rv-${rightIndex}`,
        ),
      ).flat(),
    );
    expect(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1.selectedSolverPolicy,
    ).toMatchObject({
      automaticFallbackPolicyId: null,
      levenbergMarquardtEscalationIncluded: false,
    });
    expect(
      await sha256CanonicalJsonHex(
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1,
      ),
    ).toBe("012300c76cb0ffee54fad7ad8f5756a9faadb74b580fa16b6fa3a7a17a326a2c");
    expect(
      Object.values(
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_NEGATIVE_CLAIMS_V1,
      ).every((value) => value === false),
    ).toBe(true);
  });

  it("projects the ordered four-coordinate Hessian with the declared Schur complement", () => {
    const projection =
      projectMainWireIntrinsicVentricularPassiveReducedHessianV1(
        coupledHessian([
          [10, 2, 1, 2],
          [2, 8, 3, 4],
          [1, 3, 5, 1],
          [2, 4, 1, 6],
        ]),
      );
    expect(projection.status).toBe("reduced-hessian-projected");
    if (projection.status !== "reduced-hessian-projected") return;
    expect(projection.reducedHessianPaPerM3[0][0]).toBeCloseTo(
      10 - 22 / 29,
      14,
    );
    expect(projection.reducedHessianPaPerM3[0][1]).toBeCloseTo(2 - 48 / 29, 14);
    expect(projection.reducedHessianPaPerM3[1][0]).toBeCloseTo(2 - 48 / 29, 14);
    expect(projection.reducedHessianPaPerM3[1][1]).toBeCloseTo(
      8 - 110 / 29,
      14,
    );
    expect(projection.normalizedScaledAntisymmetry).toBeLessThan(1e-15);
    expect(projection.analyticAntisymmetryPassed).toBe(true);
  });

  it("fails closed for singular, non-finite, and asymmetric projected blocks", () => {
    expect(
      projectMainWireIntrinsicVentricularPassiveReducedHessianV1(
        coupledHessian([
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ]),
      ),
    ).toMatchObject({
      status: "reduced-hessian-projection-failed",
      failureReason: "singular-internal-block",
    });
    expect(
      projectMainWireIntrinsicVentricularPassiveReducedHessianV1(
        coupledHessian([
          [Number.POSITIVE_INFINITY, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ]),
      ),
    ).toMatchObject({
      status: "reduced-hessian-projection-failed",
      failureReason: "non-finite-input",
    });

    const asymmetric =
      projectMainWireIntrinsicVentricularPassiveReducedHessianV1(
        coupledHessian([
          [10, 1, 0, 0],
          [3, 10, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ]),
      );
    expect(asymmetric.status).toBe("reduced-hessian-projected");
    if (asymmetric.status === "reduced-hessian-projected")
      expect(asymmetric.analyticAntisymmetryPassed).toBe(false);
  });

  it("passes every frozen audit for an exact manufactured quadratic reduced potential", () => {
    const audits =
      evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
        manufacturedQuadraticGrid(),
      );
    expect(audits.counts).toEqual({
      pointAudits: 25,
      energyGradientAudits: 30,
      reducedHessianAudits: 36,
      maxwellAudits: 9,
      rectangularPathAudits: 4,
    });
    expect(audits.pointAndProjectionAuditsPassed).toBe(true);
    expect(audits.energyGradientAuditsPassed).toBe(true);
    expect(audits.reducedHessianAuditsPassed).toBe(true);
    expect(audits.maxwellAuditsPassed).toBe(true);
    expect(audits.rectangularPathAuditsPassed).toBe(true);
    expect(
      Math.max(
        ...audits.energyGradientAudits.map(
          (audit) => audit.normalizedError ?? Number.POSITIVE_INFINITY,
        ),
      ),
    ).toBeLessThan(1e-12);
  });

  it("rejects energy, pressure-Maxwell, projection, and missing-point tampering independently", () => {
    const baseline = manufacturedQuadraticGrid();
    const energyTampered = replacePoint(baseline, 2, 2, (point) => ({
      ...point,
      rawStoredEnergyJ: point.rawStoredEnergyJ! + 1,
    }));
    expect(
      evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
        energyTampered,
      ).energyGradientAuditsPassed,
    ).toBe(false);

    const pressureTampered = replacePoint(baseline, 2, 2, (point) => ({
      ...point,
      intrinsicPressuresPa: {
        LV: point.intrinsicPressuresPa!.LV + 1e6,
        RV: point.intrinsicPressuresPa!.RV,
      },
    }));
    const pressureAudits =
      evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
        pressureTampered,
      );
    expect(pressureAudits.reducedHessianAuditsPassed).toBe(false);
    expect(pressureAudits.maxwellAuditsPassed).toBe(false);
    expect(pressureAudits.rectangularPathAuditsPassed).toBe(false);

    const projectionTampered = replacePoint(baseline, 2, 2, (point) => ({
      ...point,
      analyticProjectionPassed: false,
    }));
    expect(
      evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
        projectionTampered,
      ).pointAndProjectionAuditsPassed,
    ).toBe(false);

    const missing = baseline.filter(
      (point) =>
        !(
          point.leftVentricularIndex === 2 && point.rightVentricularIndex === 2
        ),
    );
    const missingAudits =
      evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
        missing,
      );
    expect(missingAudits.pointAndProjectionAuditsPassed).toBe(false);
    expect(missingAudits.energyGradientAuditsPassed).toBe(false);
  });

  it("enforces the exact compact artifact boundary and create-only preflight", () => {
    expect(
      assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactSizeV1(
        "x".repeat(524_288),
      ),
    ).toBe(524_288);
    expect(() =>
      assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotArtifactSizeV1(
        "x".repeat(524_289),
      ),
    ).toThrow(/limit is 524288/);

    const directory = mkdtempSync(join(tmpdir(), "passive-surface-pilot-v1-"));
    try {
      const output = join(directory, "artifact.json");
      expect(() =>
        assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotOutputAbsentV1(
          output,
        ),
      ).not.toThrow();
      writeFileSync(output, "preserve-me", "utf8");
      expect(() =>
        assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotOutputAbsentV1(
          output,
        ),
      ).toThrow(/create-only execution refused/);
      expect(readFileSync(output, "utf8")).toBe("preserve-me");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("retains and hashes a manufactured failed stage without normal-adult evaluation", async () => {
    const manufactured = createMainWirePassiveEquilibriumManufacturedCasesV1();
    const constantResidual = manufactured.find(
      (testCase) => testCase.caseId === "constant-residual-control",
    )!;
    const result = solveMainWirePassiveEquilibriumPointEngineeringV3({
      policyId: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
      stageIndex: 7,
      initialCoordinates: constantResidual.initialCoordinates,
      evaluateCandidate: constantResidual.evaluateCandidate,
    });
    expect(result.status).toBe("point-solve-failed");
    const stage =
      await createMainWireIntrinsicVentricularPassiveReducedSurfaceStageRecordV1(
        { chamberVolumesM3: { LV: 0, RV: 0 }, result },
      );
    expect(stage).toMatchObject({
      stageIndex: 7,
      status: "point-solve-failed",
      failureReason: result.failureReason,
    });
    expect(stage.stagePayloadSha256).toMatch(/^[0-9a-f]{64}$/);
    const { stagePayloadSha256: _sha, ...preimage } = stage;
    expect(await sha256CanonicalJsonHex(preimage)).toBe(
      stage.stagePayloadSha256,
    );
  });

  it("keeps output preflight before the only normal-adult pilot call", () => {
    const source = readFileSync(
      resolve(
        "tools/scientific/runMainWireIntrinsicVentricularPassiveReducedSurfacePilotV1.ts",
      ),
      "utf8",
    );
    const preflight = source.indexOf(
      "assertMainWireIntrinsicVentricularPassiveReducedSurfacePilotOutputAbsentV1(\n    outputPath",
    );
    const runner = source.indexOf(
      "await runMainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1(\n      { implementationCommitSha }",
    );
    expect(preflight).toBeGreaterThan(0);
    expect(runner).toBeGreaterThan(preflight);
    expect(source).not.toContain("--output");
  });

  it("independently replays the committed compact pilot result", async () => {
    const raw = readFileSync(
      new URL(
        "../artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json",
        import.meta.url,
      ),
      "utf8",
    );
    const report = JSON.parse(
      raw,
    ) as MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1;
    expect(Buffer.byteLength(raw, "utf8")).toBe(332_372);
    expect(await sha256TextHex(raw)).toBe(
      "0ba4d56c98cf933d3d693db36fa5b6086eff2e46b2aa71f7a67f1a5f19caddc7",
    );
    expect(report.payloadSha256).toBe(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_COMMITTED_PAYLOAD_SHA256_V1,
    );
    expect(await sha256CanonicalJsonHex(report.payload)).toBe(
      report.payloadSha256,
    );
    expect(report.payload.implementationCommitSha).toBe(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_IMPLEMENTATION_COMMIT_SHA_V1,
    );
    expect(
      report.payload.primaryGrid.filter(
        (point) => point.primaryLineageEstablished,
      ),
    ).toHaveLength(25);
    expect(
      report.payload
        .sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed,
    ).toBe(true);
    expect(report.payload.firstFailureClass).toBeNull();
    expect(report.payload.executionExceptions).toEqual([]);
    expect(Object.values(report.payload.claims).every((claim) => !claim)).toBe(
      true,
    );
    expect(report.payload.diagnosticLineages).toHaveLength(20);
    expect(
      report.payload.diagnosticLineages.every(
        (lineage) => lineage.status === "diagnostic-lineage-established",
      ),
    ).toBe(true);
    expect(
      report.payload.diagnosticLineageComparisonsAllWithinReportingThresholds,
    ).toBe(false);
    expect(
      await auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1(
        report,
      ),
    ).toMatchObject({ status: "report-audit-passed" });
  });

  it("rejects coordinated primary-terminal, mathematical-audit, and hash resealing", async () => {
    const report = JSON.parse(
      readFileSync(
        new URL(
          "../artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1;
    const targetPointId = "grid-lv-1-rv-1";
    const originalTarget = report.payload.primaryGrid.find(
      (point) => point.pointId === targetPointId,
    );
    if (originalTarget?.terminal === null || originalTarget === undefined)
      throw new Error("expected an established non-diagnostic primary point");

    const {
      pointPayloadSha256: _originalPointPayloadSha256,
      ...tamperedPointPreimage
    } = {
      ...originalTarget,
      terminal: {
        ...originalTarget.terminal,
        rawStoredEnergyJ: originalTarget.terminal.rawStoredEnergyJ + 1e-12,
      },
    };
    const tamperedPoint: MainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointV1 =
      {
        ...tamperedPointPreimage,
        pointPayloadSha256: await sha256CanonicalJsonHex(tamperedPointPreimage),
      };
    const tamperedPrimaryGrid = report.payload.primaryGrid.map((point) =>
      point.pointId === targetPointId ? tamperedPoint : point,
    );
    const tamperedMathematicalAudits =
      evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
        tamperedPrimaryGrid.map(
          projectMainWireIntrinsicVentricularPassiveReducedSurfacePrimaryPointToMathInputV1,
        ),
      );
    expect(tamperedMathematicalAudits).toMatchObject({
      pointAndProjectionAuditsPassed: true,
      energyGradientAuditsPassed: true,
      reducedHessianAuditsPassed: true,
      maxwellAuditsPassed: true,
      rectangularPathAuditsPassed: true,
    });
    const tamperedPayload = {
      ...report.payload,
      primaryGrid: tamperedPrimaryGrid,
      mathematicalAudits: tamperedMathematicalAudits,
    };
    const tamperedReport: MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1 =
      {
        ...report,
        payload: tamperedPayload,
        payloadSha256: await sha256CanonicalJsonHex(tamperedPayload),
      };

    const audit =
      await auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1(
        tamperedReport,
      );
    expect(audit).toMatchObject({
      status: "report-audit-failed",
      primaryTerminalCandidatesReplayPassed: false,
      primaryPointHashesReplayPassed: true,
      mathematicalAuditsReplayPassed: true,
      resultConjunctionReplayPassed: true,
      payloadSha256ReplayPassed: true,
      committedResultPayloadSha256BindingPassed: false,
    });
  });

  it("rejects fixed implementation and diagnostic-trace resealing", async () => {
    const report = JSON.parse(
      readFileSync(
        new URL(
          "../artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1;

    const implementationTamperedPayload = {
      ...report.payload,
      implementationCommitSha: "0000000000000000000000000000000000000000",
    };
    const implementationTamperedAudit =
      await auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1(
        {
          ...report,
          payload: implementationTamperedPayload,
          payloadSha256: await sha256CanonicalJsonHex(
            implementationTamperedPayload,
          ),
        },
      );
    expect(implementationTamperedAudit).toMatchObject({
      status: "report-audit-failed",
      implementationCommitBindingReplayPassed: false,
      payloadSha256ReplayPassed: true,
      committedResultPayloadSha256BindingPassed: false,
    });

    const originalTrace = report.payload.selectedDiagnosticTraces[0]!;
    const originalStage = originalTrace.stages[0]!;
    const originalDecision = originalStage.iterationDecisions[0]!;
    const traceTamperedPayload = {
      ...report.payload,
      selectedDiagnosticTraces: [
        {
          ...originalTrace,
          stages: [
            {
              ...originalStage,
              iterationDecisions: [
                {
                  ...originalDecision,
                  selectedReason: "unregistered-fallback-accepted",
                },
                ...originalStage.iterationDecisions.slice(1),
              ],
            },
            ...originalTrace.stages.slice(1),
          ],
        },
        ...report.payload.selectedDiagnosticTraces.slice(1),
      ],
    };
    const traceTamperedAudit =
      await auditMainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1(
        {
          ...report,
          payload: traceTamperedPayload,
          payloadSha256: await sha256CanonicalJsonHex(traceTamperedPayload),
        },
      );
    expect(traceTamperedAudit).toMatchObject({
      status: "report-audit-failed",
      selectedTraceShapeReplayPassed: true,
      payloadSha256ReplayPassed: true,
      committedResultPayloadSha256BindingPassed: false,
    });
  });
});

function manufacturedQuadraticGrid(): readonly MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1[] {
  const spanLV =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV -
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.LV;
  const spanRV =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV -
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.RV;
  const hessian = [
    [1 / (spanLV * spanLV), 0.2 / (spanLV * spanRV)],
    [0.2 / (spanLV * spanRV), 1.5 / (spanRV * spanRV)],
  ] as const;
  return MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1.map(
    (definition) => {
      const x =
        (definition.chamberVolumesM3.LV -
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV) /
        spanLV;
      const y =
        (definition.chamberVolumesM3.RV -
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV) /
        spanRV;
      return {
        pointId: definition.pointId,
        leftVentricularIndex: definition.leftVentricularIndex,
        rightVentricularIndex: definition.rightVentricularIndex,
        chamberVolumesM3: definition.chamberVolumesM3,
        status: "point-available" as const,
        rawStoredEnergyJ:
          0.1 + 0.2 * x + 0.3 * y + 0.5 * x * x + 0.2 * x * y + 0.75 * y * y,
        intrinsicPressuresPa: {
          LV: (0.2 + x + 0.2 * y) / spanLV,
          RV: (0.3 + 0.2 * x + 1.5 * y) / spanRV,
        },
        reducedHessianPaPerM3: hessian,
        terminalGatesPassed: true,
        analyticProjectionPassed: true,
      };
    },
  );
}

function replacePoint(
  points: readonly MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1[],
  leftIndex: number,
  rightIndex: number,
  update: (
    point: MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1,
  ) => MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1,
): readonly MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1[] {
  return points.map((point) =>
    point.leftVentricularIndex === leftIndex &&
    point.rightVentricularIndex === rightIndex
      ? update(point)
      : point,
  );
}

function coupledHessian(
  values: readonly [
    readonly [number, number, number, number],
    readonly [number, number, number, number],
    readonly [number, number, number, number],
    readonly [number, number, number, number],
  ],
): MainWireNormalAdultPassiveEquilibriumMatrix4V3 {
  return { coordinateOrder: ["LV", "RV", "VS", "y"], values };
}
