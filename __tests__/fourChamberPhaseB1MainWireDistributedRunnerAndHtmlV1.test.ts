import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1";
import {
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  mainWireDefaultHemodynamicRuntimeControlsV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  transformPhaseB1EndpointToMainWireDistributedV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedEndpointV1";
import {
  createPhaseB1MainWireDistributedResearchModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedMonolithicBackwardEulerV1";
import type {
  PhaseB1ProjectSyntheticNormalSinusScheduledEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  initializeMainWireNonCoronaryVascularStateV1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularInitializerV1";
import {
  PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1,
  assertPhaseB1MainWireDistributedDirectNumericalOwnersUnchangedV1,
  assertPhaseB1MainWireDistributedGitSourceReproducibilityUnchangedV1,
  buildPhaseB1MainWireDistributedArtifactBundleV1,
  buildPhaseB1MainWireDistributedCycleTrendSummaryV1,
  capturePhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1,
  capturePhaseB1MainWireDistributedGitSourceReproducibilityV1,
  evaluatePhaseB1MainWireDistributedEndpointDistanceV1,
  publishPhaseB1MainWireDistributedArtifactBundleV1,
  removePhaseB1MainWireDistributedCanonicalArtifactPairV1,
  runPhaseB1MainWireDistributedCycleV1,
  validatePhaseB1MainWireDistributedArtifactBundleV1,
  type PhaseB1MainWireDistributedReportV1,
  type PhaseB1MainWireDistributedWaveformSampleV1,
  type PhaseB1MainWireDistributedWaveformV1,
} from "@/tools/myocardium/runPhaseB1MainWireDistributedV1";
import {
  buildPhaseB1MainWireDistributedReviewFragmentV1,
  buildPhaseB1MainWireDistributedStandaloneHtmlV1,
} from "@/tools/myocardium/renderPhaseB1MainWireDistributedHtmlV1";

describe("Phase B1 main-wire distributed exploratory runner and renderer", () => {
  it("advances one actual event-aligned smoke interval with a free-Ca-continuous jump", () => {
    const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "off",
      sha256,
    );
    const oldEndpoint = candidate.warmStart.endpoint;
    const oldEvaluation = evaluatePhaseB1EventFreeEndpointV1(
      candidate.model,
      candidate.wallMaterialBinding,
      oldEndpoint,
    );
    const controls = mainWireDefaultHemodynamicRuntimeControlsV1();
    const externalPressurePa = Object.freeze({ pth: 0, palv: 0 });
    const initialized = initializeMainWireNonCoronaryVascularStateV1({
      targetTotalBloodVolumeM3: 5e-3,
      chamberVolumeM3ByNode: {
        LV: oldEndpoint.differentialState.bloodVolumesM3.LV,
        LA: oldEndpoint.differentialState.bloodVolumesM3.LA,
        RV: oldEndpoint.differentialState.bloodVolumesM3.RV,
        RA: oldEndpoint.differentialState.bloodVolumesM3.RA,
      },
      chamberAbsolutePressurePaByNode:
        oldEvaluation.closedLoop.chamberAbsolutePressurePa,
      mainWireRuntimeControls: controls,
      externalPressurePa,
    });
    const transformed = transformPhaseB1EndpointToMainWireDistributedV1({
      sourceEndpoint: oldEndpoint,
      vascularBloodVolumesM3: initialized.vascularVolumeM3ByNode,
      rootDynamicFlowsM3PerSec:
        initialized.solverFlowPartition.dynamicRootFlowsM3PerSec,
    });
    const model = createPhaseB1MainWireDistributedResearchModelV1({
      mechanicsProxyModel: candidate.model,
      mainWireRuntimeControls: controls,
      vascularExternalPressurePa: externalPressurePa,
      maximumNewtonIterations: 24,
    });
    const endTimeSec = 0.025e-3;
    const event = Object.freeze({
      eventKey: "smoke:0:LA",
      cycleIndex: 0,
      wallId: "LA",
      tissueClass: "atrial",
      electricalOffsetWithinCycleSec: endTimeSec,
      calciumDriveOffsetWithinCycleSec: endTimeSec,
      electricalEvent: Object.freeze({
        eventId: "smoke-electrical-LA",
        electricalTimeSec: endTimeSec,
        strength: 1,
      }),
      calciumDriveEvent: Object.freeze({
        wallId: "LA",
        eventId: "smoke-calcium-LA",
        calciumDriveTimeSec: endTimeSec,
        strength: 1,
        timingOwner: "tissue-manifest-electrical-to-calcium-delay",
      }),
    }) satisfies PhaseB1ProjectSyntheticNormalSinusScheduledEventV1;
    const result = runPhaseB1MainWireDistributedCycleV1({
      model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: transformed.endpoint,
      endTimeSec,
      nominalDtSec: endTimeSec,
      maximumRetryDepth: 3,
      orderedEvents: [event],
    });
    if (result.completed === false) {
      throw new Error(result.failedSegment.failure.message);
    }
    expect(result.acceptedIntervalCount).toBe(1);
    expect(result.samples).toHaveLength(2);
    expect(result.samples[0].phaseSec).toBe(0);
    expect(result.samples[1].phaseSec).toBe(endTimeSec);
    expect(result.acceptedIntervals[0].eventAudit).toMatchObject({
      eventCount: 1,
      maximumAbsoluteFreeCalciumJumpUM: 0,
      freeCalciumContinuityPass: true,
      nonCalciumDifferentialStateChanged: false,
      triSegCoordinatesChanged: false,
    });
    expect(result.finalEndpoint.differentialState.calciumByWall.LA.r)
      .toBeGreaterThan(0.99);
    expect(result.finalEndpoint.differentialState.calciumByWall.LA.d)
      .toBeGreaterThan(0.99);
    const distance = evaluatePhaseB1MainWireDistributedEndpointDistanceV1(
      transformed.endpoint,
      result.finalEndpoint,
    );
    expect(distance.maximumNormalizedDistance).toBeGreaterThan(0);
    expect(distance.scalarCount).toBe(63);
    expect(result.projectionApplied).toBe(false);
    expect(result.clampApplied).toBe(false);
    expect(result.modelOrConstitutiveFallbackApplied).toBe(false);
    expect(result.adaptiveRetrySubdivisionApplied).toBe(false);
    expect(result.acceptedTimeStepSec).toEqual({
      minimum: endTimeSec,
      maximum: endTimeSec,
    });
    expect(result.minimumVascularPvDomainMarginM3).toBeGreaterThan(0);
  });

  it("checks integrity of all 15 nodes and 15 flows and detects report tampering", () => {
    const bundle = syntheticArtifactBundleV1();
    expect(bundle.waveform.nodeIds).toEqual(
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
    );
    expect(bundle.waveform.flowIds).toEqual(
      MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
    );
    expect(Object.keys(bundle.waveform.samples[0].bloodVolumesM3)).toHaveLength(15);
    expect(Object.keys(bundle.waveform.samples[0].absolutePressurePaByNode))
      .toHaveLength(15);
    expect(Object.keys(bundle.waveform.samples[0].allFlowsM3PerSec)).toHaveLength(15);
    expect(bundle.report.atrialPvReservoirConduitReadback.claimBoundary)
      .toMatchObject({
        diagnosticOnly: true,
        candidateSelectionPerformed: false,
        parameterFittingPerformed: false,
      });
    expect(bundle.report.atrialConduitAndLaterRefill).toHaveProperty("LA");
    expect(bundle.report.atrialConduitAndLaterRefill).toHaveProperty("RA");
    expect(bundle.report.terminalAtrialPostOpeningMassBalanceDiagnostic)
      .toHaveProperty("LA");
    expect(bundle.report.terminalAtrialPostOpeningMassBalanceDiagnostic)
      .toHaveProperty("RA");
    const laMassBalance = bundle.report
      .terminalAtrialPostOpeningMassBalanceDiagnostic.LA as Readonly<
        Record<string, number | string | boolean>
      >;
    expect(laMassBalance).toMatchObject({
      status: "resolved-right-censored",
      venousFlowId: "PVein_LA",
      avFlowId: "Q_MV",
      rightCensoredAtCycleEnd: true,
      formalPeriodOne: false,
      shapeFitOrGateUsed: false,
    });
    expect(laMassBalance.trapezoidalDiscreteMassBalanceClosureErrorM3)
      .toBeCloseTo(
        Number(laMassBalance.observedAtrialVolumeChangeM3)
          - Number(laMassBalance.netIntegratedInflowMinusOutflowM3),
        15,
      );
    expect(bundle.report.atrialConduitAndLaterRefill.LA).toMatchObject({
      status: "diagnostic-ambiguous",
      sourceConduitBranchStatus: "ambiguous",
      strictEarlyConduitDecreaseResolved: false,
    });
    expect(bundle.report.chamberPvClosedPolygonDiagnosticPaM3).toHaveProperty("LV");
    expect(bundle.report.chamberPvClosedPolygonDiagnosticPaM3.LA).toMatchObject({
      closingChordApplied: true,
      formalPeriodOne: false,
      physiologicalLoopWorkClaimed: false,
    });
    const laClosedPolygon =
      bundle.report.chamberPvClosedPolygonDiagnosticPaM3.LA;
    expect(laClosedPolygon.closingChordContributionPdvPaM3).not.toBe(0);
    expect(laClosedPolygon.closedPolygonIntegralPdvPaM3).toBeCloseTo(
      laClosedPolygon.observedOpenPathIntegralPdvPaM3
        + laClosedPolygon.closingChordContributionPdvPaM3,
      15,
    );
    expect(laClosedPolygon.closedPolygonIntegralPdvPaM3).toBeCloseTo(
      -laClosedPolygon.signedShoelaceAreaPaM3,
      15,
    );
    expect(bundle.report.config.slsMode).toBe("off");
    expect(bundle.waveform.slsMode).toBe("off");
    expect(bundle.report.cycleSummaries[0]).toMatchObject({
      trend: {
        atrialRightCensoredConduitAndLaterRefill: {
          LA: { rightCensoredAtCycleEnd: expect.any(Boolean) },
          RA: { rightCensoredAtCycleEnd: expect.any(Boolean) },
        },
        atrialPostOpeningMassBalanceDiagnostic: {
          LA: expect.any(Object),
          RA: expect.any(Object),
        },
        chamberPvClosedPolygonDiagnosticPaM3: {
          LA: { physiologicalLoopWorkClaimed: false },
          RA: { physiologicalLoopWorkClaimed: false },
        },
        selectedWaveformSummary: {
          volumeByChamberM3: expect.any(Object),
          absolutePressureBySelectedNodePa: expect.any(Object),
          flowBySelectedEdgeM3PerSec: expect.any(Object),
        },
      },
    });
    expect(bundle.waveform.sourceReportContentSha256)
      .toBe(bundle.report.contentSha256);
    expect(bundle.report.claimBoundary).toMatchObject({
      modelOrConstitutiveFallbackApplied: false,
      adaptiveRetrySubdivisionPermitted: true,
      adaptiveRetrySubdivisionUseReportedInArtifact: true,
      fixedTimeStepIntegrationClaimed: false,
    });

    const parsedReport = JSON.parse(JSON.stringify(bundle.report)) as
      PhaseB1MainWireDistributedReportV1;
    const parsedWaveform = JSON.parse(JSON.stringify(bundle.waveform)) as
      PhaseB1MainWireDistributedWaveformV1;
    expect(validatePhaseB1MainWireDistributedArtifactBundleV1(
      parsedReport,
      parsedWaveform,
      sha256,
    ).waveform.contentSha256).toBe(bundle.waveform.contentSha256);
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      { ...parsedReport, generatedAt: "tampered" },
      parsedWaveform,
      sha256,
    )).toThrow(/report content hash/);
  });

  it("canonicalizes a floating cycle-end phase before binding the cycle trend", () => {
    const canonical = syntheticArtifactBundleV1().waveform.samples;
    const finalIndex = canonical.length - 1;
    const floatingEndSamples = canonical.map((sample, index) => index === finalIndex
      ? Object.freeze({
          ...sample,
          absoluteTimeSec: sample.absoluteTimeSec + 4 * Number.EPSILON,
          phaseSec: sample.phaseSec + 4 * Number.EPSILON,
        })
      : sample);
    const canonicalTrend = buildPhaseB1MainWireDistributedCycleTrendSummaryV1(
      canonical,
      0.8,
      sha256,
    );
    const floatingEndTrend =
      buildPhaseB1MainWireDistributedCycleTrendSummaryV1(
        floatingEndSamples,
        0.8,
        sha256,
      );
    expect(floatingEndTrend.atrialPostOpeningMassBalanceDiagnostic)
      .toEqual(canonicalTrend.atrialPostOpeningMassBalanceDiagnostic);
  });

  it("rejects coherently rehashed semantic drift in the artifact contract", () => {
    const source = syntheticArtifactBundleV1();
    const report = JSON.parse(JSON.stringify(source.report)) as
      PhaseB1MainWireDistributedReportV1;
    const waveform = JSON.parse(JSON.stringify(source.waveform)) as
      PhaseB1MainWireDistributedWaveformV1;

    const reversedNodeIds = rehashWaveform({
      ...waveform,
      nodeIds: [...waveform.nodeIds].reverse(),
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      report,
      reversedNodeIds,
      sha256,
    )).toThrow(/nodeIds/);

    const mismatchedDt = rehashWaveform({
      ...waveform,
      nominalDtSec: waveform.nominalDtSec * 2,
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      report,
      mismatchedDt,
      sha256,
    )).toThrow(/config do not agree/);

    const shiftedSamples = waveform.samples.map((sample, index) => index === 4
      ? { ...sample, phaseSec: sample.phaseSec + 1e-4 }
      : sample);
    const inconsistentPhase = rehashWaveform({
      ...waveform,
      samples: shiftedSamples,
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      report,
      inconsistentPhase,
      sha256,
    )).toThrow(/absolute time and phase/);

    const changedAreaReport = rehashReport({
      ...report,
      chamberPvClosedPolygonDiagnosticPaM3: {
        ...report.chamberPvClosedPolygonDiagnosticPaM3,
        LA: {
          ...report.chamberPvClosedPolygonDiagnosticPaM3.LA,
          signedShoelaceAreaPaM3:
            report.chamberPvClosedPolygonDiagnosticPaM3.LA
              .signedShoelaceAreaPaM3 + 1e-9,
        },
      },
    });
    const changedAreaWaveform = rehashWaveform({
      ...waveform,
      sourceReportContentSha256: changedAreaReport.contentSha256,
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      changedAreaReport,
      changedAreaWaveform,
      sha256,
    )).toThrow(/chamber PV closed-polygon diagnostic/);

    const readbackPayload = JSON.parse(JSON.stringify(
      report.atrialPvReservoirConduitReadback,
    ));
    readbackPayload.byAtrium.LA.wholeCyclePv.signedShoelaceAreaPaM3 += 1e-9;
    const { contentSha256: _readbackHash, ...readbackHashPayload } =
      readbackPayload;
    readbackPayload.contentSha256 = computeCanonicalSha256(
      readbackHashPayload,
      sha256,
    );
    const changedReadbackReport = rehashReport({
      ...report,
      atrialPvReservoirConduitReadback: readbackPayload,
    });
    const changedReadbackWaveform = rehashWaveform({
      ...waveform,
      sourceReportContentSha256: changedReadbackReport.contentSha256,
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      changedReadbackReport,
      changedReadbackWaveform,
      sha256,
    )).toThrow(/atrial PV readback/);

    const changedSlsMode = rehashWaveform({
      ...waveform,
      slsMode: "on",
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      report,
      changedSlsMode,
      sha256,
    )).toThrow(/config do not agree/);

    const changedSchema = rehashWaveform({
      ...waveform,
      schemaId: "semantic-drift" as never,
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      report,
      changedSchema,
      sha256,
    )).toThrow(/identity/);

    const unexpectedKey = rehashWaveform({
      ...waveform,
      unexpectedSemanticField: true,
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      report,
      unexpectedKey,
      sha256,
    )).toThrow(/exact declared keys/);

    const changedGitReport = rehashReport({
      ...report,
      provenance: {
        ...report.provenance,
        gitSourceReproducibilityAtRunStart: {
          ...(report.provenance.gitSourceReproducibilityAtRunStart as object),
          repositoryHeadCommit: "not-a-commit",
        },
      },
    });
    const changedGitWaveform = rehashWaveform({
      ...waveform,
      sourceReportContentSha256: changedGitReport.contentSha256,
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      changedGitReport,
      changedGitWaveform,
      sha256,
    )).toThrow(/reproducibility repositoryHeadCommit/);

    const changedAdaptiveReport = rehashReport({
      ...report,
      terminal: {
        ...report.terminal,
        adaptiveRetrySubdivisionApplied: true,
      },
    });
    const changedAdaptiveWaveform = rehashWaveform({
      ...waveform,
      sourceReportContentSha256: changedAdaptiveReport.contentSha256,
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      changedAdaptiveReport,
      changedAdaptiveWaveform,
      sha256,
    )).toThrow(/terminal integration audit is inconsistent/);
  });

  it("rejects shifted or truncated endpoint traces before endpoint phase canonicalization", () => {
    const source = syntheticArtifactBundleV1();
    const shiftedStart = rehashWaveform({
      ...source.waveform,
      samples: source.waveform.samples.map((sample, index) => index === 0
        ? {
            ...sample,
            absoluteTimeSec: sample.absoluteTimeSec + 0.01,
            phaseSec: sample.phaseSec + 0.01,
          }
        : sample),
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      source.report,
      shiftedStart,
      sha256,
    )).toThrow(/original first sample.*cycle start/);

    const truncatedEnd = rehashWaveform({
      ...source.waveform,
      samples: source.waveform.samples.map((sample, index) =>
        index === source.waveform.samples.length - 1
          ? {
              ...sample,
              absoluteTimeSec: sample.absoluteTimeSec - 0.01,
              phaseSec: sample.phaseSec - 0.01,
            }
          : sample),
    });
    expect(() => validatePhaseB1MainWireDistributedArtifactBundleV1(
      source.report,
      truncatedEnd,
      sha256,
    )).toThrow(/original last sample.*cycle end/);
  });

  it("publishes a validated pair through run-specific temporary files and removes all canonical output on mismatch", () => {
    const directory = mkdtempSync(join(tmpdir(), "main-wire-artifacts-"));
    const reportPath = join(directory, "report.json");
    const waveformPath = join(directory, "waveform.json");
    try {
      writeFileSync(reportPath, "stale report", "utf8");
      writeFileSync(waveformPath, "stale waveform", "utf8");
      const bundle = syntheticArtifactBundleV1();
      publishPhaseB1MainWireDistributedArtifactBundleV1({
        reportPath,
        waveformPath,
        bundle,
        sha256Hex: sha256,
      });
      expect(JSON.parse(readFileSync(reportPath, "utf8")).contentSha256)
        .toBe(bundle.report.contentSha256);
      expect(JSON.parse(readFileSync(waveformPath, "utf8")).contentSha256)
        .toBe(bundle.waveform.contentSha256);
      expect(readdirSync(directory).some((name) => name.endsWith(".tmp")))
        .toBe(false);

      const mismatchedWaveform = rehashWaveform({
        ...bundle.waveform,
        sourceReportContentSha256: "0".repeat(64),
      });
      expect(() => publishPhaseB1MainWireDistributedArtifactBundleV1({
        reportPath,
        waveformPath,
        bundle: { report: bundle.report, waveform: mismatchedWaveform },
        sha256Hex: sha256,
      })).toThrow(/does not bind the report/);
      expect(existsSync(reportPath)).toBe(false);
      expect(existsSync(waveformPath)).toBe(false);

      let integrityGateCallCount = 0;
      expect(() => publishPhaseB1MainWireDistributedArtifactBundleV1({
        reportPath,
        waveformPath,
        bundle,
        sha256Hex: sha256,
        integrityGateBeforeCanonicalRename: () => {
          integrityGateCallCount += 1;
          if (integrityGateCallCount === 2) {
            throw new Error("simulated source drift before waveform rename");
          }
        },
      })).toThrow(/simulated source drift/);
      expect(existsSync(reportPath)).toBe(false);
      expect(existsSync(waveformPath)).toBe(false);
      expect(readdirSync(directory).some((name) => name.endsWith(".tmp")))
        .toBe(false);
      removePhaseB1MainWireDistributedCanonicalArtifactPairV1(
        reportPath,
        waveformPath,
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("renders a self-contained common-cursor fragment and standalone document", () => {
    const bundle = syntheticArtifactBundleV1();
    const fragment = buildPhaseB1MainWireDistributedReviewFragmentV1(
      bundle.waveform,
      bundle.report,
    );
    for (const label of [
      "Left atrium PV trajectory",
      "Left ventricle PV trajectory",
      "Right atrium PV trajectory",
      "Right ventricle PV trajectory",
      "Left atrial and distributed pulmonary venous pressures",
      "Left ventricular and arterial pressures",
      "Right atrial and distributed systemic venous pressures",
      "Right ventricular and pulmonary arterial pressures",
      "Left valve flows",
      "Right valve flows",
      "Distributed venous return",
      "['q','PVein_LA']",
      "['q','VC_RA']",
      "['q','Q_MV']",
      "['q','Q_AoV']",
      "['q','Q_TV']",
      "['q','Q_PuV']",
    ]) expect(fragment).toContain(label);
    expect(fragment).toContain('id="mw-phase"');
    expect(fragment).toContain("shared phase cursor");
    expect(fragment).toContain("no fitting · no projection/model fallback");
    expect(fragment).toContain(`\"slsMode\":\"${bundle.waveform.slsMode}\"`);
    expect(fragment).toContain("' ms · accepted '");
    expect(fragment).toContain("' ms · subdivisions '");
    expect(fragment).toContain("' · SLS '+data.slsMode");
    expect(fragment).toContain("post-opening right-censored mass balance");
    expect(fragment).toContain("trapezoidal closure error");
    expect(fragment).toContain("nonperiodic closed-polygon diagnostic");
    expect(fragment).toContain("observed open-path ∫P dV");
    expect(fragment).toContain("closing chord");
    expect(fragment).toContain("no physiological-work interpretation");
    expect(fragment).not.toContain("signed PV area");
    expect(fragment).toContain("mw-zero");
    expect(fragment).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket/);
    expect(fragment).not.toContain("<!doctype");
    expect(fragment.trimStart().startsWith("<div ")).toBe(true);
    expect(fragment.trimEnd().endsWith("</div>")).toBe(true);
    expect(Buffer.byteLength(fragment, "utf8")).toBeLessThan(2_000_000);

    const standalone = buildPhaseB1MainWireDistributedStandaloneHtmlV1(
      bundle.waveform,
      bundle.report,
    );
    expect(standalone).toContain("<!doctype html>");
    expect(standalone).toContain(
      "<title>Main-wire distributed four-chamber review</title>",
    );
    expect(standalone).toContain('id="mw-four-chamber-v1"');
  });

  it("snapshots every direct numerical owner and fails closed on source drift", () => {
    const start = capturePhaseB1MainWireDistributedDirectNumericalOwnerSnapshotV1();
    expect(Object.keys(start)).toEqual(Object.keys(
      PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1,
    ));
    for (const [owner, path] of Object.entries(
      PHASE_B1_MAIN_WIRE_DISTRIBUTED_DIRECT_NUMERICAL_OWNER_PATHS_V1,
    )) {
      expect(start[owner as keyof typeof start]).toMatchObject({
        relativePath: path,
      });
      expect(start[owner as keyof typeof start].contentSha256)
        .toMatch(/^[0-9a-f]{64}$/);
    }
    expect(() => assertPhaseB1MainWireDistributedDirectNumericalOwnersUnchangedV1(
      start,
      start,
    )).not.toThrow();
    const changed = {
      ...start,
      runner: {
        ...start.runner,
        contentSha256: "0".repeat(64),
      },
    };
    expect(() => assertPhaseB1MainWireDistributedDirectNumericalOwnersUnchangedV1(
      start,
      changed,
    )).toThrow(/source changed during run.*runner/);

    const gitSource =
      capturePhaseB1MainWireDistributedGitSourceReproducibilityV1();
    expect(gitSource).toMatchObject({
      repositoryHeadCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
      repositoryHeadTree: expect.stringMatching(/^[0-9a-f]{40}$/),
      trackedWorktreeClean: expect.any(Boolean),
      trackedWorktreePatchSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      trackedIndexPatchSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      packageLockContentSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      nodeVersion: process.version,
      untrackedPathsExcludedFromCleanlinessCheck: true,
      hashAlgorithm: "sha256-file-or-bytes-v1",
    });
    expect(() =>
      assertPhaseB1MainWireDistributedGitSourceReproducibilityUnchangedV1(
        gitSource,
        gitSource,
      )).not.toThrow();
    expect(() =>
      assertPhaseB1MainWireDistributedGitSourceReproducibilityUnchangedV1(
        gitSource,
        { ...gitSource, repositoryHeadCommit: "0".repeat(40) },
      )).toThrow(/reproducibility state changed.*repositoryHeadCommit/);
  });
});

function syntheticArtifactBundleV1() {
  const phases = Array.from({ length: 11 }, (_, index) => index * 0.08);
  const atrialVolumesMl = [50, 55, 60, 65, 70, 71, 60, 50, 58, 54, 52];
  const avFlows = [
    -80e-6, -80e-6, -80e-6, 0, 80e-6, 160e-6,
    160e-6, 80e-6, 0, -80e-6, -80e-6,
  ];
  const samples: PhaseB1MainWireDistributedWaveformSampleV1[] = phases.map(
    (phaseSec, index) => Object.freeze({
      absoluteTimeSec: phaseSec,
      phaseSec,
      bloodVolumesM3: numericRecord(
        MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
        (node) => node === "LA"
          ? atrialVolumesMl[index] * 1e-6
          : node === "RA"
            ? (atrialVolumesMl[index] + 10) * 1e-6
            : baseVolumeM3(node),
      ),
      absolutePressurePaByNode: numericRecord(
        MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
        (node) => basePressurePa(node)
          + (node === "LA" || node === "RA" ? index * 12 : 0),
      ),
      allFlowsM3PerSec: numericRecord(
        MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
        (flow) => flow === "Q_MV" || flow === "Q_TV"
          ? avFlows[index]
          : flow === "PVein_LA"
            ? (70 + 15 * Math.sin(2 * Math.PI * phaseSec / 0.8)) * 1e-6
            : flow === "VC_RA"
              ? (75 + 10 * Math.cos(2 * Math.PI * phaseSec / 0.8)) * 1e-6
              : 72e-6,
      ),
    }),
  );
  return buildPhaseB1MainWireDistributedArtifactBundleV1({
    generatedAt: "2026-07-16T00:00:00.000Z",
    nominalDtSec: 0.004,
    configuredCycleCount: 1,
    maximumRetryDepth: 3,
    maximumNewtonIterations: 60,
    cycleLengthSec: 0.8,
    intrathoracicPressurePa: 0,
    alveolarPressurePa: 0,
    slsMode: "off",
    cycleIndex: 0,
    cycleStartTimeSec: 0,
    terminalCycleSamples: samples,
    cycleSummaries: [{
      cycleIndex: 0,
      endpointDistance: 0.01,
      solverRetrySubdivisionCount: 0,
      maximumRetryDepthUsed: 0,
      acceptedTimeStepSec: { minimum: 0.004, maximum: 0.004 },
      adaptiveRetrySubdivisionApplied: false,
      modelOrConstitutiveFallbackApplied: false,
      fixedTimeStepIntegrationClaimed: false,
      minimumVascularPvDomainMarginM3: 1e-6,
      trend: buildPhaseB1MainWireDistributedCycleTrendSummaryV1(
        samples,
        0.8,
        sha256,
      ),
    }],
    initialization: { construction: "test" },
    provenance: {
      source: "test",
      gitSourceReproducibilityAtRunStart: {
        repositoryHeadCommit: "1".repeat(40),
        repositoryHeadTree: "2".repeat(40),
        trackedWorktreeClean: false,
        trackedWorktreePatchSha256: "3".repeat(64),
        trackedIndexPatchSha256: "4".repeat(64),
        packageLockContentSha256: "5".repeat(64),
        nodeVersion: process.version,
        untrackedPathsExcludedFromCleanlinessCheck: true,
        hashAlgorithm: "sha256-file-or-bytes-v1",
      },
    },
    terminal: {
      completedCycleCount: 1,
      configuredCycleCount: 1,
      status: "completed-configured-exploratory-cycles",
      formalPeriodOneConvergenceEvaluated: false,
      formalPeriodOneConvergencePass: false,
      physiologicalValidationPass: false,
      acceptedTimeStepSec: { minimum: 0.004, maximum: 0.004 },
      solverRetrySubdivisionCount: 0,
      maximumRetryDepthUsed: 0,
      adaptiveRetrySubdivisionApplied: false,
      modelOrConstitutiveFallbackApplied: false,
      fixedTimeStepIntegrationClaimed: false,
      minimumVascularPvDomainMarginM3: 1e-6,
    },
    sha256Hex: sha256,
  });
}

function numericRecord<Key extends string>(
  keys: readonly Key[],
  value: (key: Key) => number,
): Readonly<Record<Key, number>> {
  return Object.freeze(Object.fromEntries(keys.map((key) => [key, value(key)]))) as
    Readonly<Record<Key, number>>;
}

function baseVolumeM3(node: string): number {
  if (node === "LV") return 130e-6;
  if (node === "RV") return 145e-6;
  if (node === "Ao") return 150e-6;
  if (node === "SA") return 650e-6;
  if (node === "Art") return 150e-6;
  if (node === "Cap") return 380e-6;
  if (node === "SV") return 2_600e-6;
  if (node === "VC") return 260e-6;
  if (node === "PA") return 100e-6;
  if (node === "PArt") return 130e-6;
  if (node === "PCap") return 120e-6;
  if (node === "PVen") return 180e-6;
  if (node === "PVein") return 240e-6;
  throw new Error(`missing base volume for ${node}`);
}

function basePressurePa(node: string): number {
  if (node === "LV") return 8 * 133.322387415;
  if (node === "LA") return 7 * 133.322387415;
  if (node === "RV") return 6 * 133.322387415;
  if (node === "RA") return 4 * 133.322387415;
  if (node === "Ao") return 95 * 133.322387415;
  if (node === "SA") return 90 * 133.322387415;
  if (node === "Art") return 70 * 133.322387415;
  if (node === "Cap") return 25 * 133.322387415;
  if (node === "SV") return 8 * 133.322387415;
  if (node === "VC") return 6 * 133.322387415;
  if (node === "PA") return 20 * 133.322387415;
  if (node === "PArt") return 16 * 133.322387415;
  if (node === "PCap") return 11 * 133.322387415;
  if (node === "PVen") return 9 * 133.322387415;
  if (node === "PVein") return 8 * 133.322387415;
  throw new Error(`missing base pressure for ${node}`);
}

function rehashReport(value: unknown): PhaseB1MainWireDistributedReportV1 {
  const { contentSha256: _discarded, ...payload } = value as
    Record<string, unknown>;
  return {
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256),
  } as PhaseB1MainWireDistributedReportV1;
}

function rehashWaveform(value: unknown): PhaseB1MainWireDistributedWaveformV1 {
  const { contentSha256: _discarded, ...payload } = value as
    Record<string, unknown>;
  return {
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256),
  } as PhaseB1MainWireDistributedWaveformV1;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
