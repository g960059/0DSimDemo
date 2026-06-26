import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/prescribed-calcium-phase2a-synthetic-protocols.json";
import { buildDynamicStateLayout } from "@/engine/myocardium/state/StateLayoutBuilder";
import {
  PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
  PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
  PRESCRIBED_CALCIUM_STATE_LABELS,
  PRESCRIBED_CALCIUM_STATE_SIZE,
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  PRESCRIBED_CALCIUM_TRANSIENT_V1_ID,
  PrescribedCalciumTransientV1,
  derivePrescribedCalciumOdeParameters,
  effectiveCalciumRateTargetAtCycleLength,
  evaluatePrescribedCalciumOutput,
  makePrescribedCalciumStateBlockDescriptor,
  normalizePrescribedCalciumParams,
  prescribedCalciumActivationPulse01,
  runPrescribedCalciumPhase2AProtocolReport,
  stepPrescribedCalciumTransientV1,
  validatePrescribedCalciumInput,
  writePrescribedCalciumResidual,
  type PrescribedCalciumInput,
} from "@/engine/myocardium/calcium";

describe("myocardium Phase 2A prescribed calcium transient", () => {
  it("declares a synthetic waveform-only claim boundary with deferred targets", () => {
    expect(protocolDescriptor.claimBoundary).toBe(PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY);
    expect(protocolDescriptor.evidenceStatus).toBe(PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS);
    expect(protocolDescriptor.experimentalTargets).toBe("deferred");
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.pendingOwnerDecisions).toEqual(
      expect.arrayContaining([expect.objectContaining({ decisionId: 10, status: "PENDING OWNER" })]),
    );
    expect(protocolDescriptor.deferredExperimentalTargets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetId: "ca-land2017-intact-paired-v1" }),
        expect.objectContaining({ targetId: "ca-human-ventricular-37c-rate-v1" }),
      ]),
    );
  });

  it("publishes a two-state calcium block and deterministic layout hash", () => {
    const instance = { chamber: "LV" as const, moduleId: "calcium", instanceId: "lv-global" };
    const descriptor = makePrescribedCalciumStateBlockDescriptor(instance, "calcium.lv.prescribed");
    const model = new PrescribedCalciumTransientV1(instance);
    const layoutA = buildDynamicStateLayout([descriptor]);
    const layoutB = buildDynamicStateLayout([{ ...descriptor }]);

    expect(model.id).toBe(PRESCRIBED_CALCIUM_TRANSIENT_V1_ID);
    expect(model.state.labels).toEqual(PRESCRIBED_CALCIUM_STATE_LABELS);
    expect(descriptor.owner).toBe("calcium");
    expect(descriptor.size).toBe(PRESCRIBED_CALCIUM_STATE_SIZE);
    expect(layoutA.layoutHash).toBe(layoutB.layoutHash);
  });

  it("derives effective knot parameters with endpoint-clamp and piecewise-linear policy", () => {
    const low = effectiveCalciumRateTargetAtCycleLength(PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET, 0.5);
    const mid = effectiveCalciumRateTargetAtCycleLength(PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET, 0.7);
    const high = effectiveCalciumRateTargetAtCycleLength(PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET, 1.2);
    const ode = derivePrescribedCalciumOdeParameters(mid);

    expect(low.interpolationPolicy).toBe("endpoint-clamp");
    expect(mid.interpolationPolicy).toBe("piecewise-linear");
    expect(high.interpolationPolicy).toBe("endpoint-clamp");
    expect(mid.peakAmplitudeUM).toBeCloseTo(0.86, 12);
    expect(ode.tauRiseSec).toBeGreaterThan(0);
    expect(ode.tauRiseSec).toBeLessThan(ode.tauDecaySec);
    expect(ode.normalization).toBeGreaterThan(0);
    expect(ode.normalizationPolicy).toBe("zero-initial-single-pulse-be-v1");
  });

  it("rejects invalid params, unsupported interpolation, runtime temperature, and duplicate input concepts", () => {
    expect(() =>
      normalizePrescribedCalciumParams({
        ...PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
        interpolation: "monotone-cubic",
      }),
    ).toThrow(/deferred/);
    expect(() =>
      normalizePrescribedCalciumParams({
        ...PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
        temperatureK: 310.15,
      } as typeof PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET),
    ).toThrow(/temperatureK/);
    expect(() =>
      normalizePrescribedCalciumParams({
        ...PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
        rateTargets: [
          {
            cycleLengthSec: 0.8,
            diastolicCalciumUM: 0.12,
            peakAmplitudeUM: 0.9,
            riseTimeSec: 0.001,
            decayHalfTimeSec: 0.02,
            releaseWidthSec: 0.018,
          },
        ],
      }),
    ).toThrow(/riseTimeSec/);
    expect(() =>
      validatePrescribedCalciumInput({
        ...representativeInput(0.02),
        heartRateBpm: 75,
      } as PrescribedCalciumInput),
    ).toThrow(/heartRateBpm/);
    expect(() =>
      validatePrescribedCalciumInput({
        ...representativeInput(0.02),
        fiberEngineeringStrain: 0.02,
      } as PrescribedCalciumInput),
    ).toThrow(/fiberEngineeringStrain/);
  });

  it("uses ActivationEvent strength as pulse height and keeps output field names non-flux", () => {
    expect(prescribedCalciumActivationPulse01(0.025, 0.012, 0.026, 1)).toBeCloseTo(1, 4);
    expect(prescribedCalciumActivationPulse01(0.025, 0.012, 0.026, 0.5)).toBeCloseTo(0.5, 4);

    const strong = stepPrescribedCalciumTransientV1(Float64Array.from([0, 0]), representativeInput(0.025, 1));
    const weak = stepPrescribedCalciumTransientV1(Float64Array.from([0, 0]), representativeInput(0.025, 0.5));

    expect(weak.nextState[0]).toBeLessThan(strong.nextState[0]);
    expect(Object.keys(strong.output)).toEqual(
      expect.arrayContaining([
        "freeCalciumUM",
        "riseState01",
        "decayState01",
        "releaseDriveUMPerSec",
        "clearanceDriveUMPerSec",
      ]),
    );
    expect(Object.keys(strong.output).join("\n")).not.toMatch(/Flux|SERCA|RyR|srLoad/i);
  });

  it("writes a BE residual consistent with the closed-form BE step", () => {
    const previous = Float64Array.from([0.1, 0.05]);
    const input = representativeInput(0.03);
    const step = stepPrescribedCalciumTransientV1(previous, input);
    const residual = new Float64Array(PRESCRIBED_CALCIUM_STATE_SIZE);
    writePrescribedCalciumResidual(step.nextState, previous, input, PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET, residual);

    expect(residual[0]).toBeCloseTo(0, 14);
    expect(residual[1]).toBeCloseTo(0, 14);
    expect(evaluatePrescribedCalciumOutput(step.nextState, input).freeCalciumUM).toBeCloseTo(
      step.output.freeCalciumUM,
      14,
    );
  });

  it("carries residual decay across activationEventId increments without resetting state", () => {
    let state = Float64Array.from([0, 0]);
    for (let step = 1; step <= 800; step += 1) {
      const timeSinceActivationSec = step * 0.001;
      state = stepPrescribedCalciumTransientV1(state, representativeInput(timeSinceActivationSec, 1, 0.8, 1, 0.001)).nextState;
    }
    const before = state[1];
    const after = stepPrescribedCalciumTransientV1(state, representativeInput(0, 1, 0.8, 2, 0.001)).nextState;

    expect(before).toBeGreaterThan(0);
    expect(after[1]).toBeGreaterThan(0);
    expect(after[1]).toBeLessThan(before);
  });

  it("passes every synthetic Phase 2A protocol without experimental pass claims", () => {
    const report = runPrescribedCalciumPhase2AProtocolReport();
    const ids = report.sections.map((section) => section.id);

    expect(report.claimBoundary).toBe(PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY);
    expect(report.evidenceStatus).toBe(PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS);
    expect(report.experimentalTargets).toBe("deferred");
    expect(report.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(report.closurePass).toBe(true);
    expect(ids).toEqual(
      expect.arrayContaining([
        "synthetic-waveform-shape-v1",
        "event-cycle-continuity-v1",
        "cycle-length-knot-policy-v1",
        "dt-self-consistency-v1",
        "nonnegative-calcium-v1",
        "claim-boundary-v1",
        "deterministic-replay-v1",
        "deferred-experimental-targets",
      ]),
    );
    expect(JSON.stringify(report)).not.toMatch(/experimentalPass/);
  });

  it("keeps Phase 2A calcium imports inside standalone myocardium and verifier code", () => {
    const repoRoot = process.cwd();
    const references = listFiles(repoRoot)
      .filter((file) => /\.(ts|tsx|json|md)$/.test(file))
      .filter((file) => !file.includes("/node_modules/"))
      .filter((file) => !file.includes("/.git/"))
      .filter((file) => readFileSync(file, "utf8").includes("PrescribedCalciumTransientV1"));

    const allowedFragments = [
      "/__tests__/myocardiumPhase2PrescribedCalcium.test.ts",
      "/data/myocardium/protocols/prescribed-calcium-phase2a-synthetic-protocols.json",
      "/docs/myocardium/",
      "/engine/myocardium/calcium/",
      "/engine/myocardium/protocols/calciumLandIsometric.ts",
      "/engine/myocardium/contracts.ts",
      "/tools/myocardium/verifyPrescribedCalcium.ts",
    ];
    for (const file of references) {
      expect(allowedFragments.some((fragment) => file.includes(fragment))).toBe(true);
    }
    expect(references.some((file) => file.endsWith("/engine/ModelCore.ts"))).toBe(false);
  });
});

function representativeInput(
  timeSinceActivationSec: number,
  activationStrength01 = 1,
  cycleLengthSec = 0.8,
  activationEventId = 1,
  dtSec = 0.001,
): PrescribedCalciumInput {
  return {
    targetId: "lv-free-wall",
    activationEventId,
    timeSinceActivationSec,
    cycleLengthSec,
    activationStrength01,
    dtSec,
  };
}

function listFiles(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", "build", "coverage"].includes(entry.name)) continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}
