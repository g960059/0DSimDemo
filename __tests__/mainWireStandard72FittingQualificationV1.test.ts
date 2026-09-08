import { describe, expect, it } from "vitest";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { runMainWireStandard72QualificationGridV1 as runGrid,
  assessMainWireStandard72FittingQualificationV1 as assess,
  type MainWireStandard72QualificationGridV1 as Grid } from "@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1";
import { MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 } from "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import { MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 } from "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1 } from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";

const candidate = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
async function failedPair() {
  const invalid = { ...candidate, hemodynamicResearchInputs: { ...candidate.hemodynamicResearchInputs, heartRateBpm: 65 } };
  return { coarse: await runGrid({ candidateInputs: invalid, nominalDtSec: .002 }),
    fine: await runGrid({ candidateInputs: invalid, nominalDtSec: .001 }) };
}

describe("Standard72 final qualification boundary", () => {
  it("records invalid input as held, never as a scientific or publication approval", async () => {
    const report = await assess(await failedPair());
    expect(report).toMatchObject({ status: "held", pressureRateQuality: null, preloadReserve: null,
      clinicalNormalityClaimed: false, publicBaselinePromotionAuthorized: false });
    expect(report.issues).toEqual(expect.arrayContaining(["coarse:execution-failed", "fine:execution-failed"]));
    expect(report.grids.coarse.evaluation).toMatchObject({ status: "invalid-or-physical", phase: "request-validation" });
  });

  it("keeps interruption separate from physiological failure", async () => {
    const controller = new AbortController(); controller.abort();
    const coarse = await runGrid({ candidateInputs: candidate, nominalDtSec: .002, abortSignal: controller.signal });
    expect(coarse).toMatchObject({ status: "grid-failed", evaluation: { status: "operational-interrupted" } });
  });

  it("owns parameters, grid and cancellation reference before its first await", async () => {
    const controller = new AbortController(); controller.abort();
    const requested = JSON.parse(JSON.stringify(candidate));
    const request: Parameters<typeof runGrid>[0] & { nominalDtSec: .002 | .001; abortSignal?: AbortSignal } = {
      candidateInputs: requested, nominalDtSec: .002, abortSignal: controller.signal };
    const pending = runGrid(request);
    request.nominalDtSec = .001;
    request.abortSignal = undefined;
    requested.hemodynamicResearchInputs.totalBloodVolumeMl = 1;
    const grid = await pending;
    expect(grid.nominalDtSec).toBe(.002);
    expect(grid.candidateIdentitySha256).toBe(await sha256CanonicalJsonHex(candidate));
    expect(grid.evaluation.status).toBe("operational-interrupted");
  });

  it("binds grid ordering, candidate identity and model identity", async () => {
    const pair = await failedPair();
    const report = await assess({ coarse: pair.fine, fine: { ...pair.coarse,
      modelId: "wrong-model", candidateIdentitySha256: "f".repeat(64) } as unknown as Grid });
    expect(report.issues).toEqual(expect.arrayContaining(["coarse:identity-or-dt", "fine:identity-or-dt", "same-candidate-required"]));
  });

  it("does not accept a passed vote without terminal evidence", async () => {
    const pair = await failedPair();
    const coarse = { ...pair.coarse, status: "grid-evaluated", evaluation: {
      ...pair.coarse.evaluation, status: "accepted", rest: { status: "passed" } } } as unknown as Grid;
    const report = await assess({ ...pair, coarse });
    expect(report.status).toBe("held");
    expect(report.issues).toContain("coarse:missing-terminal-evidence");
  });

  it("digests operative reserve floors and settlement, not only policy names", async () => {
    const report = await assess(await failedPair());
    expect(report.policy).toMatchObject({ initialization: "independent-cold-grids", afterloadTest: false,
      reserveExecution: { base: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
        response: MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1, settlement: MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2,
        admissionReplacesLegacyPressureAmplitudeFloor: true } });
    expect(report.policyIdentitySha256).toBe(await sha256CanonicalJsonHex(report.policy));
    const { reportSha256, ...body } = report;
    expect(reportSha256).toBe(await sha256CanonicalJsonHex(body));
  });
});
