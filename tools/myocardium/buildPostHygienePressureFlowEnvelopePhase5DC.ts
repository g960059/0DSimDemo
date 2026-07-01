import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildTvfResidualAttributionPhase5DAEvidence } from "./buildTvfResidualAttributionPhase5DA";
import { buildValvePressureFlowContractPhase5CYEvidence } from "./buildValvePressureFlowContractPhase5CY";

export const POST_HYGIENE_PRESSURE_FLOW_ENVELOPE_PHASE5DC_ID =
  "post-hygiene-pressure-flow-envelope-phase5dc-result-v1" as const;
export const POST_HYGIENE_PRESSURE_FLOW_ENVELOPE_PHASE5DC_RESULT_PATH =
  "data/myocardium/protocols/post-hygiene-pressure-flow-envelope-phase5dc-result-v1.json" as const;

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof POST_HYGIENE_PRESSURE_FLOW_ENVELOPE_PHASE5DC_ID;
  readonly phase: "5DC";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly diagnosticQuestion:
      "whether Phase 5CY pressure-flow envelope and Phase 5DA targeted TVF residual interpretation survive the Phase 5DB stateful AV-plane state fix";
  };
  readonly upstreamEvidence: {
    readonly phase5DBArtifactId: "avplane-state-hygiene-phase5db-result-v1";
    readonly phase5DBDecision: "stateful-avplane-state-preserved";
  };
  readonly postHygieneFullEnvelope: {
    readonly sourceBuilder: "buildValvePressureFlowContractPhase5CYEvidence";
    readonly normalizedSha256: string;
    readonly acceptedLegacyGrossPass: string;
    readonly user0BothHeldBaselineGrossPass: string;
    readonly valvePressureFlowLegacyGrossPass: string;
    readonly valvePressureFlowUser0GrossPass: string;
    readonly valvePressureFlowUser0MvfOk: string;
    readonly valvePressureFlowUser0TvfOk: string;
    readonly decision: string;
    readonly residualNotes: readonly string[];
  };
  readonly postHygieneTargetedResidual: {
    readonly sourceBuilder: "buildTvfResidualAttributionPhase5DAEvidence";
    readonly normalizedSha256: string;
    readonly decision: string;
    readonly notes: readonly string[];
    readonly user0ContractilityLowExtraTheta: number | null;
    readonly user0ContractilityLowAcceptedDiodeHitFraction: number | null;
    readonly user0ContractilityLowAcceptedQDotHitFraction: number | null;
    readonly user0ContractilityLowAcceptedComplementarityLeakFraction: number | null;
    readonly user0ContractilityLowRaAvPlaneCorrectionRangeMl: number | null;
  };
  readonly interpretation: {
    readonly decision:
      | "pressure-flow-frontier-persists-after-avplane-state-fix"
      | "pressure-flow-frontier-regressed-after-avplane-state-fix"
      | "pressure-flow-frontier-inconclusive-after-avplane-state-fix";
    readonly notes: readonly string[];
  };
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

export function buildPostHygienePressureFlowEnvelopePhase5DCEvidence(): Evidence {
  const fullEnvelope = buildValvePressureFlowContractPhase5CYEvidence();
  const targetedResidual = buildTvfResidualAttributionPhase5DAEvidence();
  const full = {
    sourceBuilder: "buildValvePressureFlowContractPhase5CYEvidence",
    normalizedSha256: fullEnvelope.normalizedSha256,
    acceptedLegacyGrossPass: fullEnvelope.classification.acceptedLegacyGrossPass,
    user0BothHeldBaselineGrossPass: fullEnvelope.classification.user0BothHeldBaselineGrossPass,
    valvePressureFlowLegacyGrossPass: fullEnvelope.classification.valvePressureFlowLegacyGrossPass,
    valvePressureFlowUser0GrossPass: fullEnvelope.classification.valvePressureFlowUser0GrossPass,
    valvePressureFlowUser0MvfOk: fullEnvelope.classification.valvePressureFlowUser0MvfTvf.mvfOk,
    valvePressureFlowUser0TvfOk: fullEnvelope.classification.valvePressureFlowUser0MvfTvf.tvfOk,
    decision: fullEnvelope.classification.decision,
    residualNotes: fullEnvelope.classification.notes.filter((note) => note.includes("residual notes")),
  } as const;
  const user0Residual = targetedResidual.variantSummaries.find((summary) =>
    summary.variantId === "valve-pressure-flow-user0-inlet-held-release"
  );
  const targeted = {
    sourceBuilder: "buildTvfResidualAttributionPhase5DAEvidence",
    normalizedSha256: targetedResidual.normalizedSha256,
    decision: targetedResidual.interpretation.decision,
    notes: targetedResidual.interpretation.notes,
    user0ContractilityLowExtraTheta: user0Residual?.contractilityLowExtraTheta ?? null,
    user0ContractilityLowAcceptedDiodeHitFraction: user0Residual?.contractilityLowAcceptedDiodeHitFraction ?? null,
    user0ContractilityLowAcceptedQDotHitFraction: user0Residual?.contractilityLowAcceptedQDotHitFraction ?? null,
    user0ContractilityLowAcceptedComplementarityLeakFraction:
      user0Residual?.contractilityLowAcceptedComplementarityLeakFraction ?? null,
    user0ContractilityLowRaAvPlaneCorrectionRangeMl: user0Residual?.contractilityLowRaAvPlaneCorrectionRangeMl ?? null,
  } as const;
  const interpretation = interpret(full, targeted);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: POST_HYGIENE_PRESSURE_FLOW_ENVELOPE_PHASE5DC_ID,
    phase: "5DC",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      diagnosticQuestion:
        "whether Phase 5CY pressure-flow envelope and Phase 5DA targeted TVF residual interpretation survive the Phase 5DB stateful AV-plane state fix",
    },
    upstreamEvidence: {
      phase5DBArtifactId: "avplane-state-hygiene-phase5db-result-v1",
      phase5DBDecision: "stateful-avplane-state-preserved",
    },
    postHygieneFullEnvelope: full,
    postHygieneTargetedResidual: targeted,
    interpretation,
    recommendedNext: recommendation(interpretation.decision),
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialParameterTuningUnlock: true,
      noValveQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return { ...evidenceWithoutHash, normalizedSha256: hashStable(evidenceWithoutHash) };
}

function interpret(
  full: Evidence["postHygieneFullEnvelope"],
  targeted: Evidence["postHygieneTargetedResidual"],
): Evidence["interpretation"] {
  const pressureFlowPersists = full.valvePressureFlowUser0GrossPass === "7/8"
    && full.valvePressureFlowUser0MvfOk === "8/8"
    && full.valvePressureFlowUser0TvfOk === "7/8"
    && targeted.decision === "tvf-extra-wave-is-clean-pressure-flow-coasting-window";
  if (pressureFlowPersists) {
    return {
      decision: "pressure-flow-frontier-persists-after-avplane-state-fix",
      notes: [
        "The Phase 5CY user0 pressure-flow frontier remains 7/8 after the Phase 5DB stateful AV-plane state fix.",
        "The remaining failure is still the contractility-low HR75 TVF mid-diastolic extra wave.",
        "The targeted Phase 5DA window remains clean of accepted diode hits, qDot clamp hits, and complementarity leak, so the next work should focus on right AV pressure-flow coasting/energy consistency rather than AV-plane state persistence.",
      ],
    };
  }
  const regressed = !full.valvePressureFlowUser0GrossPass.endsWith("/8")
    || Number(full.valvePressureFlowUser0GrossPass.split("/")[0]) < 7;
  return {
    decision: regressed
      ? "pressure-flow-frontier-regressed-after-avplane-state-fix"
      : "pressure-flow-frontier-inconclusive-after-avplane-state-fix",
    notes: [
      `Post-hygiene user0 pressure-flow gross pass: ${full.valvePressureFlowUser0GrossPass}.`,
      `Post-hygiene targeted residual decision: ${targeted.decision}.`,
      "Do not proceed to right AV coasting fixes until this post-hygiene frontier is understood.",
    ],
  };
}

function recommendation(decision: Evidence["interpretation"]["decision"]): readonly string[] {
  if (decision === "pressure-flow-frontier-persists-after-avplane-state-fix") {
    return [
      "Proceed to a right AV pressure-flow coasting/energy-consistency surface; keep the Phase 5CY pressure-flow contract and Phase 5DB AV-plane state fix as prerequisites.",
      "Do not use simple AV-plane gain-off, LandAtrial parameter tuning, qDot/root/Zc, valve threshold, Tref, or source-stress scaling as the adoption path.",
      "Keep the representative 8-point morphology envelope as the acceptance gate; this artifact only refreshes the post-hygiene evidence boundary.",
    ];
  }
  return [
    "Re-localize the post-hygiene regression before adding more contract variants.",
    "Keep LandAtrial tuning locked and do not relabel the current pressure-flow path as accepted.",
  ];
}

function stable(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, sortJson(entry)]),
  );
}

export function writePostHygienePressureFlowEnvelopePhase5DCEvidence(): Evidence {
  const evidence = buildPostHygienePressureFlowEnvelopePhase5DCEvidence();
  const outPath = path.resolve(process.cwd(), POST_HYGIENE_PRESSURE_FLOW_ENVELOPE_PHASE5DC_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writePostHygienePressureFlowEnvelopePhase5DCEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    interpretation: evidence.interpretation,
    postHygieneFullEnvelope: evidence.postHygieneFullEnvelope,
    postHygieneTargetedResidual: evidence.postHygieneTargetedResidual,
    resultPath: POST_HYGIENE_PRESSURE_FLOW_ENVELOPE_PHASE5DC_RESULT_PATH,
  }, null, 2));
}
