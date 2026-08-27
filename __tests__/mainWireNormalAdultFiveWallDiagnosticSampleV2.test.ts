import { describe, expect, it } from "vitest";

import {
  initializeMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_CLAIM,
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  normalAdultMainWireRuntimeV1,
  sampleMainWireNormalAdultFiveWallStepV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";

describe("main-wire normal-adult five-wall diagnostic sample V2", () => {
  it("wraps the byte-stable V1 sample with accepted readbacks only", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = normalAdultMainWireRuntimeV1();
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.002,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
      },
    );
    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);

    const base = sampleMainWireNormalAdultFiveWallStepV1(stepped);
    const diagnostic = sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped);
    const {
      diagnosticSampleId: _diagnosticSampleId,
      commonIntrathoracicPressureMmHg: _commonIntrathoracicPressureMmHg,
      circulationNodeAbsolutePressureMmHg:
        _circulationNodeAbsolutePressureMmHg,
      circulationEdgeFlowMlPerSec: _circulationEdgeFlowMlPerSec,
      wallFiberLogStrain: _wallFiberLogStrain,
      wallEnergyLedgerDensity: _wallEnergyLedgerDensity,
      acceptedMechanicsJacobianAudit: _acceptedMechanicsJacobianAudit,
      valveHydraulics: _valveHydraulics,
      ...baseProjection
    } = diagnostic;

    expect(baseProjection).toEqual(base);
    expect(diagnostic.commonIntrathoracicPressureMmHg)
      .toBe(stepped.commonIntrathoracicPressureMmHg);
    expect(diagnostic.circulationNodeAbsolutePressureMmHg)
      .toEqual(stepped.circulationTrial.nodeAbsolutePressuresMmHg);
    expect(diagnostic.circulationEdgeFlowMlPerSec)
      .toEqual(stepped.circulationTrial.edgeFlowsMlPerSec);
    expect(Object.keys(base)).not.toContain("wallFiberLogStrain");
    expect(Object.values(diagnostic.wallFiberLogStrain).every(Number.isFinite))
      .toBe(true);
    expect(Object.values(diagnostic.wallEnergyLedgerDensity).every((ledger) =>
      Object.values(ledger).every((value) =>
        typeof value !== "number" || Number.isFinite(value))))
      .toBe(true);
    expect(diagnostic.acceptedMechanicsJacobianAudit).toMatchObject({
      derivativeSource: "analytic-triseg-hessian",
      symmetricWithinTolerance: true,
      strictLocalStableEquilibrium: true,
    });
    expect(Object.entries(diagnostic.acceptedMechanicsJacobianAudit)
      .every(([, value]) => typeof value !== "number" || Number.isFinite(value)))
      .toBe(true);
    expect(Object.values(diagnostic.valveHydraulics).every((valve) =>
      Object.values(valve).every((value) =>
        typeof value !== "number" || Number.isFinite(value)))).toBe(true);
    expect(Object.values(diagnostic.valveHydraulics).every((valve) =>
      ["forward", "reverse", "zero-gradient"].includes(
        valve.activeDirection,
      ))).toBe(true);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_CLAIM
      .changesFixedV1RunnerJson).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_CLAIM
      .emitsAuthoritativeCommonIntrathoracicPressure).toBe(true);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_CLAIM
      .emitsCompleteCirculationNodeAndEdgeReadback).toBe(true);
  }, 60_000);
});
