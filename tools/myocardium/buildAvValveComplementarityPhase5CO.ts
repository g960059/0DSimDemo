import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore, type ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  activeSourcePressureContractFromSamples,
  type ActiveSourcePressureContractSummary,
  type AvInflowSourcePressureContract,
  type VentricularSourcePressureContract,
} from "@/engine/verification/activeSourcePressureContract";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import {
  lastCompleteBeat,
  localExtrema,
  phaseInWindow,
  phaseOf,
  positiveValvePeaksDetailed,
  type Peak,
} from "@/engine/verification/shapeMetrics";

export const AV_VALVE_COMPLEMENTARITY_PHASE5CO_ID =
  "av-valve-complementarity-phase5co-result-v1" as const;
export const AV_VALVE_COMPLEMENTARITY_PHASE5CO_RESULT_PATH =
  "data/myocardium/protocols/av-valve-complementarity-phase5co-result-v1.json" as const;

type PointId =
  | "normal-hr75"
  | "normal-hr90"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "systemic-afterload-high-hr75"
  | "pulmonary-afterload-high-hr75"
  | "contractility-low-hr75"
  | "contractility-high-hr75";

type VariantId =
  | "legacy-frozen-reference"
  | "current-user0-default"
  | "lv-rv-land-legacy-atria"
  | "transaction-user0"
  | "transaction-legacy-atria"
  | "state-coupled-tv-only-legacy-atria"
  | "tv-state-mv-pressure-refit-legacy-atria"
  | "tv-state-mv-fixedpoint1-legacy-atria"
  | "tv-state-mv-fixedpoint2-legacy-atria"
  | "tv-state-mv-fixedpoint3-legacy-atria"
  | "tv-state-mv-fixedpoint3-relax07-legacy-atria"
  | "tv-state-mv-fixedpoint4-relax07-legacy-atria"
  | "tv-state-mv-fixedpoint2-user0"
  | "tv-state-mv-fixedpoint3-user0"
  | "accepted-av-boundary-legacy-atria"
  | "accepted-av-boundary-user0"
  | "accepted-av-complementarity2-legacy-atria"
  | "accepted-av-complementarity3-relax07-legacy-atria"
  | "accepted-av-complementarity3-relax07-user0";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly closurePath:
    | "legacy-active-stress"
    | "current-user0-all-chamber-landatrial"
    | "lv-rv-land-legacy-atria";
  readonly ventricularChamberTransaction: null | {
    readonly mechanismId: string;
    readonly iterations: number;
    readonly relaxation: number;
    readonly chambers: readonly ["LV", "RV"];
    readonly includeAdjacentLoadNodes: boolean;
    readonly avValveBoundaryMode:
      | "current-diode"
      | "state-coupled-complementarity"
      | "accepted-state-av-boundary"
      | "accepted-state-av-boundary-fixedpoint"
      | "tv-state-coupled-mv-pressure-refit"
      | "tv-state-coupled-mv-pressure-fixedpoint-refit";
    readonly avValveBoundaryTargetValves: readonly ("MV" | "TV")[];
    readonly avValveBoundaryTauSec: number | null;
    readonly avValveBoundaryPressureRefitIterations?: number | null;
    readonly avValveBoundaryPressureRefitRelaxation?: number | null;
  };
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type RefitConfigurationAudit = {
  readonly variantId: VariantId;
  readonly avValveBoundaryMode: NonNullable<VariantSpec["ventricularChamberTransaction"]>["avValveBoundaryMode"] | null;
  readonly labelExpectedPressureRefitIterations: number | null;
  readonly requestedPressureRefitIterations: number | null;
  readonly effectivePressureRefitIterations: number | null;
  readonly labelExpectedPressureRefitRelaxation: number | null;
  readonly requestedPressureRefitRelaxation: number | null;
  readonly effectivePressureRefitRelaxation: number | null;
  readonly requestedMatchesLabel: boolean;
  readonly effectiveMatchesLabel: boolean;
  readonly requestEffectiveMatch: boolean;
  readonly configMatchesLabel: boolean;
  readonly message: string;
};

type RefitConfigurationIntegrity = {
  readonly checkedVariantCount: number;
  readonly mismatchCount: number;
  readonly allConfigMatchesLabel: boolean;
  readonly mismatchedVariantIds: readonly VariantId[];
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type ContractClassCounts = {
  readonly sourceStateMultipeak: number;
  readonly pressureAdapterGeometryAmplification: number;
  readonly valveLoadOrPassiveCoupling: number;
  readonly mixedContractFailure: number;
  readonly cleanVentricularSide: number;
  readonly inletGradientMultipeak: number;
  readonly valveDiodeOrQdotContamination: number;
  readonly extraWaveWithoutClampDominance: number;
  readonly cleanAvInflow: number;
};

type AvInflowResidualCause =
  | "not-measured"
  | "clean-biphasic"
  | "valve-diode-or-qdot-contamination"
  | "pressure-gradient-second-pulse"
  | "valve-state-chatter"
  | "atrial-boundary-pressure-artifact"
  | "ventricular-pressure-rebound"
  | "av-plane-recoil-or-release"
  | "volume-pressure-transaction-mismatch"
  | "extra-wave-unattributed";

type MvPressureRefitTransaction = {
  readonly valve: "MV" | "TV";
  readonly measured: boolean;
  readonly morphologyOk: boolean;
  readonly likelyCause: AvInflowResidualCause;
  readonly message: string;
  readonly diastolicPeakCount: number | null;
  readonly extraPeakCount: number | null;
  readonly ePeakTheta: number | null;
  readonly aPeakTheta: number | null;
  readonly extraPeakTheta: number | null;
  readonly extraPeakProminenceRatio: number | null;
  readonly gradientPeakCount: number | null;
  readonly gradientTroughCount: number | null;
  readonly gradientExtraAlignmentTheta: number | null;
  readonly atrialPressurePeakCount: number | null;
  readonly atrialPressureTroughCount: number | null;
  readonly atrialPressureExtraAlignmentTheta: number | null;
  readonly ventricularPressurePeakCount: number | null;
  readonly ventricularPressureTroughCount: number | null;
  readonly ventricularPressureExtraAlignmentTheta: number | null;
  readonly valveStateExtremaCount: number | null;
  readonly valveStateRange: number | null;
  readonly valveStateExtraAlignmentTheta: number | null;
  readonly diodeImpulseHitFraction: number | null;
  readonly qDotClampHitFraction: number | null;
  readonly continuityResidualRmsMlPerSec: number | null;
  readonly continuityResidualMaxAbsMlPerSec: number | null;
  readonly continuityResidualToFlowPeak: number | null;
  readonly avPlaneReadbackAvailable: boolean;
  readonly avPlaneVelocityExtremaCount: number | null;
  readonly avPlaneVelocityExtraAlignmentTheta: number | null;
  readonly avPlaneEffectiveVolumeCorrectionRangeMl: number | null;
};

type ResidualCauseCounts = Readonly<Record<AvInflowResidualCause, number>>;

type NumericSampleKey = {
  [K in keyof SimSample]: SimSample[K] extends number | undefined ? K : never;
}[keyof SimSample];

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly grossVentricularMorphologyOk: boolean;
  readonly morphologyStatus: MorphologyCheckSummary["status"] | "not-measured";
  readonly failedLabels: readonly string[];
  readonly badges: MorphologyBadgeSummary | null;
  readonly metrics: MetricDigest | null;
  readonly contract: ActiveSourcePressureContractSummary | null;
  readonly avInflowResiduals: Readonly<Record<"MV" | "TV", MvPressureRefitTransaction>> | null;
  readonly contractFailureClasses: readonly string[];
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly grossPassCount: number;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly lvPvOkCount: number;
  readonly rvPvOkCount: number;
  readonly mvfOkCount: number;
  readonly tvfOkCount: number;
  readonly outputPreservedCount: number;
  readonly contractClassCounts: ContractClassCounts;
  readonly residualCauseCounts: ResidualCauseCounts;
  readonly mvResidualCauseCounts: ResidualCauseCounts;
  readonly tvResidualCauseCounts: ResidualCauseCounts;
  readonly firstFailedPoint: PointId | null;
  readonly failedPointIds: readonly PointId[];
};

type Classification = {
  readonly legacyGrossPass: string;
  readonly currentUser0GrossPass: string;
  readonly lvRvLandLegacyAtriaGrossPass: string;
  readonly bestTransactionVariant: string;
  readonly currentUser0DominantContractClasses: ContractClassCounts;
  readonly lvRvLandLegacyAtriaDominantContractClasses: ContractClassCounts;
  readonly bestTransactionResidualCauseCounts: ResidualCauseCounts;
  readonly bestTransactionMvResidualCauseCounts: ResidualCauseCounts;
  readonly bestTransactionTvResidualCauseCounts: ResidualCauseCounts;
  readonly bestTransactionFailedResidualAttribution: readonly string[];
  readonly decision:
    | "configuration-integrity-failed"
    | "residuals-clean-enough-for-runtime-shadow"
    | "legacy-atria-envelope-pass-user0-transfer-blocked"
    | "partial-positive-mv-fixedpoint-refit"
    | "av-valve-boundary-transaction-redesign-required";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof AV_VALVE_COMPLEMENTARITY_PHASE5CO_ID;
  readonly phase: "5CO";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly grossGate:
      "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count";
    readonly contractReadout:
      "deterministic AV inflow residual attribution over the same last complete beat: pressure gradient, diode/qDot, valve state, atrial/ventricular pressure, AV-plane, and continuity residuals";
    readonly candidateMechanism:
      "ModelCore ventricularChamberTransactionStep with adjacent-load-node volume-flow-provider-state transaction and off-by-default accepted-state AV valve fixed-point complementarity candidates";
  };
  readonly ownerVisualGateCalibration: {
    readonly sourceArtifactId: "morphology-visual-review-phase5ca-result-v1";
    readonly ownerReviewedDownloadsBundle: "~/Downloads/0dsim-morphology-review-phase5ca/index.html";
    readonly failedGateExamplesVisuallyUnacceptable: true;
    readonly someOkGateExamplesStillVisuallyUnacceptable: true;
    readonly conclusion: "do-not-relax-morphology-check-v1-for-failed-gross-pv-or-av-inflow-artifacts";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly refitConfigurationAudits: readonly RefitConfigurationAudit[];
  readonly refitConfigurationIntegrity: RefitConfigurationIntegrity;
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: Classification;
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialTuningUnlock: true;
    readonly noA1A2Reopen: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "normal-hr90", targetTBVMl: 5600, params: { HR: 90 } },
  { id: "low-preload-hr75", targetTBVMl: 4800, params: { HR: 75 } },
  { id: "high-preload-hr75", targetTBVMl: 6200, params: { HR: 75 } },
  { id: "systemic-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, pulmonaryResistance: 0.8 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.8 } },
  { id: "contractility-high-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.2 } },
];

export function buildAvValveComplementarityPhase5COEvidence(): Evidence {
  const variants = [
    legacyVariant(),
    currentUser0Variant(),
    lvRvLandLegacyAtriaVariant(),
    mvFixedPointRefitLegacyAtriaVariant("tv-state-mv-fixedpoint3-relax07-legacy-atria", 3, 0.7),
    acceptedAvBoundaryLegacyAtriaVariant(),
    acceptedAvComplementarityLegacyAtriaVariant("accepted-av-complementarity2-legacy-atria", 2, 1),
    acceptedAvComplementarityLegacyAtriaVariant("accepted-av-complementarity3-relax07-legacy-atria", 3, 0.7),
    acceptedAvComplementarityUser0Variant(),
  ] as const;
  const refitConfigurationAudits = variants.map(refitConfigurationAudit);
  const refitConfigurationIntegrity = summarizeRefitConfigurationIntegrity(refitConfigurationAudits);
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results, refitConfigurationIntegrity);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: AV_VALVE_COMPLEMENTARITY_PHASE5CO_ID,
    phase: "5CO",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      grossGate:
        "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count",
      contractReadout:
        "deterministic AV inflow residual attribution over the same last complete beat: pressure gradient, diode/qDot, valve state, atrial/ventricular pressure, AV-plane, and continuity residuals",
      candidateMechanism:
        "ModelCore ventricularChamberTransactionStep with adjacent-load-node volume-flow-provider-state transaction and off-by-default accepted-state AV valve fixed-point complementarity candidates",
    },
    ownerVisualGateCalibration: {
      sourceArtifactId: "morphology-visual-review-phase5ca-result-v1",
      ownerReviewedDownloadsBundle: "~/Downloads/0dsim-morphology-review-phase5ca/index.html",
      failedGateExamplesVisuallyUnacceptable: true,
      someOkGateExamplesStillVisuallyUnacceptable: true,
      conclusion: "do-not-relax-morphology-check-v1-for-failed-gross-pv-or-av-inflow-artifacts",
    },
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    refitConfigurationAudits,
    refitConfigurationIntegrity,
    points: POINTS,
    results,
    variantSummaries,
    classification,
    recommendedNext: recommendedNext(classification),
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialTuningUnlock: true,
      noA1A2Reopen: true,
      noValveQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function legacyVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  });
  return {
    id: "legacy-frozen-reference",
    label: "Frozen legacy active-stress rollback/reference",
    hypothesis: "Positive morphology reference and rollback path.",
    closurePath: "legacy-active-stress",
    ventricularChamberTransaction: null,
    experimentalOptions: resolved.experimentalOptions,
  };
}

function currentUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "current-user0-default",
    label: "Current user-0 all-chamber LandAtrial plus sourced root/Zc default",
    hypothesis: "Records active-source/pressure-adapter attribution for the live raw morphology blocker.",
    closurePath: "current-user0-all-chamber-landatrial",
    ventricularChamberTransaction: null,
    experimentalOptions: resolved.experimentalOptions,
  };
}

function lvRvLandLegacyAtriaVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "lv-rv-land-legacy-atria",
    label: "LV/RV Land plus legacy atria with sourced root/Zc",
    hypothesis: "Separates ventricular Land source/adapter coupling from LandAtrial AV-plane/effective-wall timing.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: null,
    experimentalOptions: resolved.experimentalOptions,
  };
}

function transactionUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "transaction-user0",
    label: "Current user-0 closure with LV/RV plus adjacent-load-node chamber transaction step",
    hypothesis: "Tests whether solving LV/RV volume, adjacent LA/Ao/RA/PA load-node volume, valve flow, and provider-state advancement in the same fixed-point step rescues raw PV dome and AV inflow morphology.",
    closurePath: "current-user0-all-chamber-landatrial",
    ventricularChamberTransaction: {
      mechanismId: "phase5co-av-inflow-residual-attribution-user0",
      iterations: 4,
      relaxation: 0.7,
      chambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
      avValveBoundaryMode: "current-diode",
      avValveBoundaryTargetValves: ["MV", "TV"],
      avValveBoundaryTauSec: null,
    },
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      "phase5co-av-inflow-residual-attribution-user0",
      "current-diode",
      ["MV", "TV"],
      4,
      0.7,
    ),
  };
}

function transactionLegacyAtriaVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "transaction-legacy-atria",
    label: "LV/RV Land legacy atria with LV/RV plus adjacent-load-node chamber transaction step",
    hypothesis: "Separates LV/RV chamber/load-node/valve/provider transaction effects from LandAtrial AV-plane/effective-wall timing.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: {
      mechanismId: "phase5co-av-inflow-residual-attribution-legacy-atria",
      iterations: 4,
      relaxation: 0.7,
      chambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
      avValveBoundaryMode: "current-diode",
      avValveBoundaryTargetValves: ["MV", "TV"],
      avValveBoundaryTauSec: null,
    },
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      "phase5co-av-inflow-residual-attribution-legacy-atria",
      "current-diode",
      ["MV", "TV"],
      4,
      0.7,
    ),
  };
}

function stateCoupledLegacyAtriaVariant(
  id: "state-coupled-tv-only-legacy-atria",
  targetValves: readonly ("MV" | "TV")[],
  iterations: number,
  relaxation: number,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label: `LV/RV Land legacy atria with state-coupled ${targetValves.join("+")} AV valve complementarity`,
    hypothesis: "Tests whether committing AV valve opening state from the accepted pressure gradient before transaction flow/loss evaluation removes MVF/TVF extra waves while preserving LV/RV PV domes.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: transactionDescriptor(id, targetValves, iterations, relaxation),
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      `phase5co-${id}`,
      "state-coupled-complementarity",
      targetValves,
      iterations,
      relaxation,
    ),
  };
}

function mvPressureRefitLegacyAtriaVariant(
  id: "tv-state-mv-pressure-refit-legacy-atria",
  targetValves: readonly ("MV" | "TV")[],
  iterations: number,
  relaxation: number,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label: `LV/RV Land legacy atria with MV pressure-refit and ${targetValves.includes("TV") ? "TV state coupling" : "no TV state coupling"}`,
    hypothesis: "Tests whether recomputing MV pressure gradient from the projected LV/LA/Ao transaction state removes the two remaining MV residual points while preserving the Phase 5CJ TVF/PV gains.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: transactionDescriptor(
      id,
      targetValves,
      iterations,
      relaxation,
      "tv-state-coupled-mv-pressure-refit",
    ),
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      `phase5co-${id}`,
      "tv-state-coupled-mv-pressure-refit",
      targetValves,
      iterations,
      relaxation,
    ),
  };
}

function mvFixedPointRefitLegacyAtriaVariant(
  id: Extract<
    VariantId,
    | "tv-state-mv-fixedpoint1-legacy-atria"
    | "tv-state-mv-fixedpoint2-legacy-atria"
    | "tv-state-mv-fixedpoint3-legacy-atria"
    | "tv-state-mv-fixedpoint3-relax07-legacy-atria"
    | "tv-state-mv-fixedpoint4-relax07-legacy-atria"
  >,
  pressureRefitIterations: number,
  pressureRefitRelaxation: number,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label: `LV/RV Land legacy atria with TV state coupling and ${pressureRefitIterations}x MV fixed-point pressure refit`,
    hypothesis: "Tests whether iterating MV pressure/flow against the projected LV/LA/Ao transaction state removes the remaining low-preload MV residual while preserving the Phase 5CK PV, TVF, and MVF gains.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: transactionDescriptor(
      id,
      ["MV", "TV"],
      4,
      0.7,
      "tv-state-coupled-mv-pressure-fixedpoint-refit",
      pressureRefitIterations,
      pressureRefitRelaxation,
    ),
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      `phase5co-${id}`,
      "tv-state-coupled-mv-pressure-fixedpoint-refit",
      ["MV", "TV"],
      4,
      0.7,
      pressureRefitIterations,
      pressureRefitRelaxation,
    ),
  };
}

function mvFixedPointRefitUser0Variant(
  id: "tv-state-mv-fixedpoint2-user0" | "tv-state-mv-fixedpoint3-user0",
  pressureRefitIterations: number,
  pressureRefitRelaxation: number,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label: `Current user-0 closure with TV state coupling and ${pressureRefitIterations}x MV fixed-point pressure refit`,
    hypothesis: "Checks whether the legacy-atria MV fixed-point pressure-refit candidates transfer back to the current all-chamber LandAtrial default closure without LandAtrial tuning.",
    closurePath: "current-user0-all-chamber-landatrial",
    ventricularChamberTransaction: transactionDescriptor(
      id,
      ["MV", "TV"],
      4,
      0.7,
      "tv-state-coupled-mv-pressure-fixedpoint-refit",
      pressureRefitIterations,
      pressureRefitRelaxation,
    ),
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      `phase5co-${id}`,
      "tv-state-coupled-mv-pressure-fixedpoint-refit",
      ["MV", "TV"],
      4,
      0.7,
      pressureRefitIterations,
      pressureRefitRelaxation,
    ),
  };
}

function acceptedAvBoundaryLegacyAtriaVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "accepted-av-boundary-legacy-atria",
    label: "LV/RV Land legacy atria with accepted-state AV valve fixed-point complementarity",
    hypothesis: "Tests whether solving MV/TV flow once from the accepted chamber pressure, accepted valve state, and pre-step valve flow removes AV inflow residuals without multi-timestep refit.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: transactionDescriptor(
      "accepted-av-boundary-legacy-atria",
      ["MV", "TV"],
      4,
      0.7,
      "accepted-state-av-boundary",
    ),
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      "phase5co-accepted-av-boundary-legacy-atria",
      "accepted-state-av-boundary",
      ["MV", "TV"],
      4,
      0.7,
    ),
  };
}

function acceptedAvBoundaryUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "accepted-av-boundary-user0",
    label: "Current user-0 closure with accepted-state AV valve fixed-point complementarity",
    hypothesis: "Checks whether the accepted-state AV valve fixed-point complementarity transfers to all-chamber LandAtrial without LandAtrial tuning.",
    closurePath: "current-user0-all-chamber-landatrial",
    ventricularChamberTransaction: transactionDescriptor(
      "accepted-av-boundary-user0",
      ["MV", "TV"],
      4,
      0.7,
      "accepted-state-av-boundary",
    ),
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      "phase5co-accepted-av-boundary-user0",
      "accepted-state-av-boundary",
      ["MV", "TV"],
      4,
      0.7,
    ),
  };
}

function acceptedAvComplementarityLegacyAtriaVariant(
  id: "accepted-av-complementarity2-legacy-atria" | "accepted-av-complementarity3-relax07-legacy-atria",
  pressureRefitIterations: number,
  pressureRefitRelaxation: number,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label: `LV/RV Land legacy atria with ${pressureRefitIterations}x accepted-state AV valve fixed-point complementarity`,
    hypothesis: "Tests whether iterating MV/TV flow against accepted chamber pressure, accepted valve state, and fixed pre-step valve flow removes AV inflow residuals without multi-timestep advancement.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: transactionDescriptor(
      id,
      ["MV", "TV"],
      4,
      0.7,
      "accepted-state-av-boundary-fixedpoint",
      pressureRefitIterations,
      pressureRefitRelaxation,
    ),
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      `phase5co-${id}`,
      "accepted-state-av-boundary-fixedpoint",
      ["MV", "TV"],
      4,
      0.7,
      pressureRefitIterations,
      pressureRefitRelaxation,
    ),
  };
}

function acceptedAvComplementarityUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "accepted-av-complementarity3-relax07-user0",
    label: "Current user-0 closure with 3x accepted-state AV valve fixed-point complementarity",
    hypothesis: "Checks whether the accepted-state AV valve fixed-point complementarity transfers to all-chamber LandAtrial without LandAtrial tuning.",
    closurePath: "current-user0-all-chamber-landatrial",
    ventricularChamberTransaction: transactionDescriptor(
      "accepted-av-complementarity3-relax07-user0",
      ["MV", "TV"],
      4,
      0.7,
      "accepted-state-av-boundary-fixedpoint",
      3,
      0.7,
    ),
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      "phase5co-accepted-av-complementarity3-relax07-user0",
      "accepted-state-av-boundary-fixedpoint",
      ["MV", "TV"],
      4,
      0.7,
      3,
      0.7,
    ),
  };
}

function transactionDescriptor(
  mechanismId: string,
  targetValves: readonly ("MV" | "TV")[],
  iterations: number,
  relaxation: number,
  mode:
    | "state-coupled-complementarity"
    | "accepted-state-av-boundary"
    | "accepted-state-av-boundary-fixedpoint"
    | "tv-state-coupled-mv-pressure-refit"
    | "tv-state-coupled-mv-pressure-fixedpoint-refit" = "state-coupled-complementarity",
  pressureRefitIterations: number | null = null,
  pressureRefitRelaxation: number | null = null,
): NonNullable<VariantSpec["ventricularChamberTransaction"]> {
  return {
    mechanismId,
    iterations,
    relaxation,
    chambers: ["LV", "RV"],
    includeAdjacentLoadNodes: true,
    avValveBoundaryMode: mode,
    avValveBoundaryTargetValves: targetValves,
    avValveBoundaryTauSec: null,
    avValveBoundaryPressureRefitIterations: pressureRefitIterations,
    avValveBoundaryPressureRefitRelaxation: pressureRefitRelaxation,
  };
}

function withVentricularChamberTransactionStep(
  experimentalOptions: ModelCoreExperimentalOptions,
  mechanismId: string,
  avValveBoundaryMode:
    | "current-diode"
    | "state-coupled-complementarity"
    | "accepted-state-av-boundary"
    | "accepted-state-av-boundary-fixedpoint"
    | "tv-state-coupled-mv-pressure-refit"
    | "tv-state-coupled-mv-pressure-fixedpoint-refit",
  targetValves: readonly ("MV" | "TV")[],
  iterations: number,
  relaxation: number,
  pressureRefitIterations: number | null = null,
  pressureRefitRelaxation: number | null = null,
): ModelCoreExperimentalOptions {
  const providers = experimentalOptions.activeSourceProviders;
  if (!providers?.LV || !providers.RV) {
    throw new Error("Phase 5CO AV inflow residual attribution requires LV and RV source providers.");
  }
  return {
    ...experimentalOptions,
    ventricularChamberTransactionStep: {
      mechanismId,
      iterations,
      relaxation,
      providerStateCouplingChambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
      avValveBoundaryMode,
      avValveBoundaryTargetValves: targetValves,
      avValveBoundaryPressureRefitIterations: pressureRefitIterations ?? undefined,
      avValveBoundaryPressureRefitRelaxation: pressureRefitRelaxation ?? undefined,
    },
  };
}

function refitConfigurationAudit(variant: VariantSpec): RefitConfigurationAudit {
  const requested = variant.ventricularChamberTransaction;
  const effective = new ModelCore(DEFAULT_PARAMS, variant.experimentalOptions)
    .debugExperimentalVentricularChamberTransactionStep();
  const mode = requested?.avValveBoundaryMode ?? null;
  const labelExpectation = labelPressureRefitExpectation(variant.id, mode);
  const requestedConfig = requestedPressureRefitConfiguration(requested);
  const effectiveConfig = effectivePressureRefitConfiguration(effective);
  const requestedMatchesLabel = numericNullableEqual(
    requestedConfig.iterations,
    labelExpectation.iterations,
  ) && numericNullableEqual(
    requestedConfig.relaxation,
    labelExpectation.relaxation,
  );
  const effectiveMatchesLabel = numericNullableEqual(
    effectiveConfig.iterations,
    labelExpectation.iterations,
  ) && numericNullableEqual(
    effectiveConfig.relaxation,
    labelExpectation.relaxation,
  );
  const requestEffectiveMatch = numericNullableEqual(
    requestedConfig.iterations,
    effectiveConfig.iterations,
  ) && numericNullableEqual(
    requestedConfig.relaxation,
    effectiveConfig.relaxation,
  );
  const configMatchesLabel = requestedMatchesLabel && effectiveMatchesLabel && requestEffectiveMatch;
  return {
    variantId: variant.id,
    avValveBoundaryMode: mode,
    labelExpectedPressureRefitIterations: labelExpectation.iterations,
    requestedPressureRefitIterations: requestedConfig.iterations,
    effectivePressureRefitIterations: effectiveConfig.iterations,
    labelExpectedPressureRefitRelaxation: labelExpectation.relaxation,
    requestedPressureRefitRelaxation: requestedConfig.relaxation,
    effectivePressureRefitRelaxation: effectiveConfig.relaxation,
    requestedMatchesLabel,
    effectiveMatchesLabel,
    requestEffectiveMatch,
    configMatchesLabel,
    message: configMatchesLabel
      ? "requested/effective MV pressure-refit settings match the variant label"
      : "requested/effective MV pressure-refit settings do not match the variant label",
  };
}

function summarizeRefitConfigurationIntegrity(
  audits: readonly RefitConfigurationAudit[],
): RefitConfigurationIntegrity {
  const mismatches = audits.filter((audit) => !audit.configMatchesLabel);
  return {
    checkedVariantCount: audits.length,
    mismatchCount: mismatches.length,
    allConfigMatchesLabel: mismatches.length === 0,
    mismatchedVariantIds: mismatches.map((audit) => audit.variantId),
  };
}

function labelPressureRefitExpectation(
  variantId: VariantId,
  mode: RefitConfigurationAudit["avValveBoundaryMode"],
): { readonly iterations: number | null; readonly relaxation: number | null } {
  if (variantId.includes("fixedpoint1")) return { iterations: 1, relaxation: 1 };
  if (variantId.includes("fixedpoint2")) return { iterations: 2, relaxation: 1 };
  if (variantId.includes("fixedpoint3-relax07")) return { iterations: 3, relaxation: 0.7 };
  if (variantId.includes("fixedpoint3")) return { iterations: 3, relaxation: 1 };
  if (variantId.includes("fixedpoint4-relax07")) return { iterations: 4, relaxation: 0.7 };
  if (variantId.includes("complementarity2")) return { iterations: 2, relaxation: 1 };
  if (variantId.includes("complementarity3-relax07")) return { iterations: 3, relaxation: 0.7 };
  if (variantId.includes("complementarity3")) return { iterations: 3, relaxation: 1 };
  if (mode === "tv-state-coupled-mv-pressure-refit") return { iterations: 1, relaxation: 1 };
  return { iterations: null, relaxation: null };
}

function requestedPressureRefitConfiguration(
  requested: VariantSpec["ventricularChamberTransaction"],
): { readonly iterations: number | null; readonly relaxation: number | null } {
  if (!requested) return { iterations: null, relaxation: null };
  if (
    requested.avValveBoundaryMode === "tv-state-coupled-mv-pressure-fixedpoint-refit"
    || requested.avValveBoundaryMode === "accepted-state-av-boundary-fixedpoint"
  ) {
    return {
      iterations: requested.avValveBoundaryPressureRefitIterations ?? 3,
      relaxation: requested.avValveBoundaryPressureRefitRelaxation ?? 1,
    };
  }
  if (requested.avValveBoundaryMode === "tv-state-coupled-mv-pressure-refit") {
    return {
      iterations: 1,
      relaxation: requested.avValveBoundaryPressureRefitRelaxation ?? 1,
    };
  }
  return { iterations: null, relaxation: null };
}

function effectivePressureRefitConfiguration(
  effective: ModelCoreExperimentalOptions["ventricularChamberTransactionStep"] | null,
): { readonly iterations: number | null; readonly relaxation: number | null } {
  if (!effective) return { iterations: null, relaxation: null };
  if (
    effective.avValveBoundaryMode === "tv-state-coupled-mv-pressure-fixedpoint-refit"
    || effective.avValveBoundaryMode === "accepted-state-av-boundary-fixedpoint"
  ) {
    return {
      iterations: effective.avValveBoundaryPressureRefitIterations ?? 3,
      relaxation: effective.avValveBoundaryPressureRefitRelaxation ?? 1,
    };
  }
  if (effective.avValveBoundaryMode === "tv-state-coupled-mv-pressure-refit") {
    return {
      iterations: 1,
      relaxation: effective.avValveBoundaryPressureRefitRelaxation ?? 1,
    };
  }
  return { iterations: null, relaxation: null };
}

function numericNullableEqual(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return a == null && b == null;
  return Math.abs(a - b) < 1e-9;
}

function runPoint(variant: VariantSpec, point: PointSpec): PointResult {
  try {
    const params = { ...DEFAULT_PARAMS, ...point.params };
    const settle = settleToSteadyState(params, {
      targetTBV: point.targetTBVMl,
      dt: profile.dt,
      sampleHz: profile.sampleHz,
      settlePolicy: profile.settlePolicy,
      measureBeats: profile.measureBeats,
      requireProjectorQuiet: profile.requireProjectorQuiet,
      experimentalOptions: variant.experimentalOptions,
    });
    const measurement = settle.ok
      ? measureSteady(settle.core, settle.settleStatus, {
        targetTBV: point.targetTBVMl,
        dt: profile.dt,
        sampleHz: profile.sampleHz,
        settlePolicy: profile.settlePolicy,
        measureBeats: profile.measureBeats,
        requireProjectorQuiet: profile.requireProjectorQuiet,
        experimentalOptions: variant.experimentalOptions,
      })
      : null;
    const morphology = measurement ? morphologyCheckSummaryFromSamples(measurement.samples) : null;
    const contract = measurement ? activeSourcePressureContractFromSamples(measurement.samples) : null;
    const avInflowResiduals = measurement
      ? {
        MV: avValveBoundaryTransaction(measurement.samples, "MV", morphology?.badges.mvf === "ok"),
        TV: avValveBoundaryTransaction(measurement.samples, "TV", morphology?.badges.tvf === "ok"),
      }
      : null;
    const grossVentricularMorphologyOk = Boolean(
      morphology?.badges.lvPv === "ok"
      && morphology.badges.rvPv === "ok"
      && morphology.badges.mvf === "ok"
      && morphology.badges.tvf === "ok",
    );
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      grossVentricularMorphologyOk,
      morphologyStatus: morphology?.status ?? "not-measured",
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      badges: morphology?.badges ?? null,
      metrics: measurement ? metricDigest(measurement.metrics) : null,
      contract,
      avInflowResiduals,
      contractFailureClasses: contract?.dominantFailureClasses ?? ["not-measured"],
      errorMessage: null,
    };
  } catch (error) {
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: false,
      settleReason: "exception",
      healthStatus: "exception",
      grossVentricularMorphologyOk: false,
      morphologyStatus: "not-measured",
      failedLabels: [error instanceof Error ? error.message : String(error)],
      badges: null,
      metrics: null,
      contract: null,
      avInflowResiduals: null,
      contractFailureClasses: ["not-measured"],
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function metricDigest(metrics: SimMetrics): MetricDigest {
  return {
    AoPMean: round(metrics.AoPMean),
    PAPMean: round(metrics.PAPMean),
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    LAPMean: round(metrics.LAPMean),
    RAPMean: round(metrics.RAPMean),
    EF_LApprox: round(metrics.EF_LApprox),
    EF_RApprox: round(metrics.EF_RApprox),
  };
}

function summarizeVariant(variant: VariantSpec, results: readonly PointResult[]): VariantSummary {
  const own = results.filter((result) => result.variantId === variant.id);
  const failures = own.filter((result) =>
    !result.grossVentricularMorphologyOk || !result.settled || result.healthStatus !== "ok"
  );
  const badgeOkCount = (badge: keyof MorphologyBadgeSummary) =>
    own.filter((result) => result.badges?.[badge] === "ok").length;
  return {
    variantId: variant.id,
    grossPassCount: own.filter((result) =>
      result.grossVentricularMorphologyOk && result.settled && result.healthStatus === "ok"
    ).length,
    measuredCount: own.filter((result) => result.morphologyStatus !== "not-measured").length,
    settledOkCount: own.filter((result) => result.settled && result.healthStatus === "ok").length,
    lvPvOkCount: badgeOkCount("lvPv"),
    rvPvOkCount: badgeOkCount("rvPv"),
    mvfOkCount: badgeOkCount("mvf"),
    tvfOkCount: badgeOkCount("tvf"),
    outputPreservedCount: own.filter((result) =>
      result.metrics
      && result.metrics.CO_L > 3.5
      && result.metrics.CO_L < 7.5
      && result.metrics.CO_R > 3.5
      && result.metrics.CO_R < 7.5
    ).length,
    contractClassCounts: countContractClasses(own),
    residualCauseCounts: countResidualCauses(own.flatMap((result) =>
      result.avInflowResiduals ? [result.avInflowResiduals.MV, result.avInflowResiduals.TV] : []
    )),
    mvResidualCauseCounts: countResidualCauses(own.flatMap((result) =>
      result.avInflowResiduals ? [result.avInflowResiduals.MV] : []
    )),
    tvResidualCauseCounts: countResidualCauses(own.flatMap((result) =>
      result.avInflowResiduals ? [result.avInflowResiduals.TV] : []
    )),
    firstFailedPoint: failures[0]?.pointId ?? null,
    failedPointIds: failures.map((result) => result.pointId),
  };
}

function countContractClasses(results: readonly PointResult[]): ContractClassCounts {
  const ventricularContracts = results.flatMap((result) =>
    result.contract ? [result.contract.ventricles.LV, result.contract.ventricles.RV] : []
  );
  const avContracts = results.flatMap((result) =>
    result.contract ? [result.contract.avInflows.MV, result.contract.avInflows.TV] : []
  );
  return {
    sourceStateMultipeak: countVentricular(ventricularContracts, "source-state-multipeak"),
    pressureAdapterGeometryAmplification: countVentricular(ventricularContracts, "pressure-adapter-geometry-amplification"),
    valveLoadOrPassiveCoupling: countVentricular(ventricularContracts, "valve-load-or-passive-coupling"),
    mixedContractFailure: countVentricular(ventricularContracts, "mixed-contract-failure"),
    cleanVentricularSide: countVentricular(ventricularContracts, "clean-single-dome"),
    inletGradientMultipeak: countAv(avContracts, "inlet-gradient-multipeak"),
    valveDiodeOrQdotContamination: countAv(avContracts, "valve-diode-or-qdot-contamination"),
    extraWaveWithoutClampDominance: countAv(avContracts, "extra-wave-without-clamp-dominance"),
    cleanAvInflow: countAv(avContracts, "clean-biphasic"),
  };
}

function countVentricular(
  contracts: readonly VentricularSourcePressureContract[],
  className: VentricularSourcePressureContract["likelyFailureClass"],
): number {
  return contracts.filter((contract) => contract.likelyFailureClass === className).length;
}

function countAv(
  contracts: readonly AvInflowSourcePressureContract[],
  className: AvInflowSourcePressureContract["likelyFailureClass"],
): number {
  return contracts.filter((contract) => contract.likelyFailureClass === className).length;
}

function countResidualCauses(residuals: readonly MvPressureRefitTransaction[]): ResidualCauseCounts {
  const out: Record<AvInflowResidualCause, number> = {
    "not-measured": 0,
    "clean-biphasic": 0,
    "valve-diode-or-qdot-contamination": 0,
    "pressure-gradient-second-pulse": 0,
    "valve-state-chatter": 0,
    "atrial-boundary-pressure-artifact": 0,
    "ventricular-pressure-rebound": 0,
    "av-plane-recoil-or-release": 0,
    "volume-pressure-transaction-mismatch": 0,
    "extra-wave-unattributed": 0,
  };
  for (const residual of residuals) out[residual.likelyCause]++;
  return out;
}

function avValveBoundaryTransaction(
  samples: readonly SimSample[],
  valve: "MV" | "TV",
  morphologyOk: boolean,
): MvPressureRefitTransaction {
  const beat = lastCompleteBeat([...samples]);
  if (beat.length === 0) return unmeasuredResidual(valve, "no complete beat");

  const keys = valve === "MV"
    ? {
      flow: "QMV" as const,
      gradient: "dP_MV" as const,
      atrialPressure: "LAP" as const,
      ventricularPressure: "LVP" as const,
      valveState: "xiMV" as const,
      diode: "MV_diodeImpulse" as const,
      qDot: "MV_qDotClampHit01" as const,
      atrialVolumeRate: "dVLAdtMlPerSec" as const,
      ventricularVolumeRate: "dVLVdtMlPerSec" as const,
      avPlaneVelocity: "LAAvPlaneDescentVelocity01PerSec" as const,
      avPlaneCorrection: "LAAvPlaneEffectiveVolumeCorrectionMl" as const,
      atrialExpected: (sample: SimSample) => sample.PVF - sample.QMV,
      ventricularExpected: (sample: SimSample) => sample.QMV - sample.QAo,
    }
    : {
      flow: "QTV" as const,
      gradient: "dP_TV" as const,
      atrialPressure: "RAP" as const,
      ventricularPressure: "RVP" as const,
      valveState: "xiTV" as const,
      diode: "TV_diodeImpulse" as const,
      qDot: "TV_qDotClampHit01" as const,
      atrialVolumeRate: "dVRAdtMlPerSec" as const,
      ventricularVolumeRate: "dVRVdtMlPerSec" as const,
      avPlaneVelocity: "RAAvPlaneDescentVelocity01PerSec" as const,
      avPlaneCorrection: "RAAvPlaneEffectiveVolumeCorrectionMl" as const,
      atrialExpected: (sample: SimSample) => sample.SVF - sample.QTV,
      ventricularExpected: (sample: SimSample) => sample.QTV - sample.QPV,
    };

  const peaks = positiveValvePeaksDetailed([...beat], keys.flow, 0.12, 20);
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75)));
  const aPeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08)));
  const extraPeak = diastolic
    .filter((peak) => peak !== ePeak && peak !== aPeak)
    .sort((a, b) => b.value - a.value)[0] ?? null;
  const extraPeakCount = Math.max(0, diastolic.length - 2);
  const extraPeakTheta = extraPeak?.theta ?? null;
  const extraPeakProminenceRatio = extraPeak && ePeak && ePeak.value > 1e-9 ? extraPeak.value / ePeak.value : null;

  const gradientProminence = Math.max(valve === "MV" ? 0.5 : 0.35, 0.12 * rangeForKey(beat, keys.gradient));
  const gradientPeaks = localExtrema([...beat], keys.gradient, "max", gradientProminence);
  const gradientTroughs = localExtrema([...beat], keys.gradient, "min", gradientProminence);
  const atrialPressureProminence = Math.max(valve === "MV" ? 0.35 : 0.45, 0.12 * rangeForKey(beat, keys.atrialPressure));
  const atrialPressurePeaks = localExtrema([...beat], keys.atrialPressure, "max", atrialPressureProminence);
  const atrialPressureTroughs = localExtrema([...beat], keys.atrialPressure, "min", atrialPressureProminence);
  const ventPressureProminence = Math.max(valve === "MV" ? 0.5 : 0.35, 0.12 * rangeForKey(beat, keys.ventricularPressure));
  const ventPressurePeaks = localExtrema([...beat], keys.ventricularPressure, "max", ventPressureProminence);
  const ventPressureTroughs = localExtrema([...beat], keys.ventricularPressure, "min", ventPressureProminence);
  const valveStateRange = rangeForKey(beat, keys.valveState);
  const valveStateProminence = Math.max(0.03, 0.12 * valveStateRange);
  const valveStateExtrema = [
    ...localExtrema([...beat], keys.valveState, "max", valveStateProminence),
    ...localExtrema([...beat], keys.valveState, "min", valveStateProminence),
  ];
  const diodeImpulseHitFraction = fraction(beat, (sample) => Math.abs(Number(sample[keys.diode] ?? 0)) > 1e-9);
  const qDotClampHitFraction = fraction(beat, (sample) => Number(sample[keys.qDot] ?? 0) > 0.5);
  const atrialContinuity = continuityResidual(beat, keys.atrialVolumeRate, keys.atrialExpected);
  const ventricularContinuity = continuityResidual(beat, keys.ventricularVolumeRate, keys.ventricularExpected);
  const continuityResidualRmsMlPerSec = Math.max(atrialContinuity.rms, ventricularContinuity.rms);
  const continuityResidualMaxAbsMlPerSec = Math.max(atrialContinuity.maxAbs, ventricularContinuity.maxAbs);
  const flowPeak = Math.max(0, ...beat.map((sample) => Number(sample[keys.flow])));
  const continuityResidualToFlowPeak = flowPeak > 1e-9 ? continuityResidualRmsMlPerSec / flowPeak : null;
  const avPlaneReadbackAvailable = beat.some((sample) => Number.isFinite(Number(sample[keys.avPlaneVelocity])));
  const avPlaneVelocityExtrema = avPlaneReadbackAvailable
    ? [
      ...localExtrema([...beat], keys.avPlaneVelocity, "max", Math.max(0.05, 0.12 * rangeForKey(beat, keys.avPlaneVelocity))),
      ...localExtrema([...beat], keys.avPlaneVelocity, "min", Math.max(0.05, 0.12 * rangeForKey(beat, keys.avPlaneVelocity))),
    ]
    : [];
  const avPlaneEffectiveVolumeCorrectionRangeMl = avPlaneReadbackAvailable
    ? rangeForKey(beat, keys.avPlaneCorrection)
    : null;

  const gradientExtraAlignmentTheta = nearestThetaDistance(extraPeakTheta, [...gradientPeaks, ...gradientTroughs]);
  const atrialPressureExtraAlignmentTheta =
    nearestThetaDistance(extraPeakTheta, [...atrialPressurePeaks, ...atrialPressureTroughs]);
  const ventricularPressureExtraAlignmentTheta =
    nearestThetaDistance(extraPeakTheta, [...ventPressurePeaks, ...ventPressureTroughs]);
  const valveStateExtraAlignmentTheta = nearestThetaDistance(extraPeakTheta, valveStateExtrema);
  const avPlaneVelocityExtraAlignmentTheta = avPlaneReadbackAvailable
    ? nearestThetaDistance(extraPeakTheta, avPlaneVelocityExtrema)
    : null;
  const likelyCause = classifyResidual({
    morphologyOk: morphologyOk || Boolean(ePeak && aPeak && extraPeakCount === 0),
    extraPeakCount,
    diodeImpulseHitFraction,
    qDotClampHitFraction,
    gradientPeakCount: gradientPeaks.length,
    gradientTroughCount: gradientTroughs.length,
    gradientExtraAlignmentTheta,
    atrialPressurePeakCount: atrialPressurePeaks.length,
    atrialPressureTroughCount: atrialPressureTroughs.length,
    atrialPressureExtraAlignmentTheta,
    ventricularPressurePeakCount: ventPressurePeaks.length,
    ventricularPressureTroughCount: ventPressureTroughs.length,
    ventricularPressureExtraAlignmentTheta,
    valveStateExtremaCount: valveStateExtrema.length,
    valveStateExtraAlignmentTheta,
    continuityResidualToFlowPeak,
    avPlaneReadbackAvailable,
    avPlaneVelocityExtremaCount: avPlaneVelocityExtrema.length,
    avPlaneVelocityExtraAlignmentTheta,
  });
  return {
    valve,
    measured: true,
    morphologyOk: morphologyOk || likelyCause === "clean-biphasic",
    likelyCause,
    message: residualMessage(valve, likelyCause),
    diastolicPeakCount: diastolic.length,
    extraPeakCount,
    ePeakTheta: roundNullable(ePeak?.theta ?? null),
    aPeakTheta: roundNullable(aPeak?.theta ?? null),
    extraPeakTheta: roundNullable(extraPeakTheta),
    extraPeakProminenceRatio: roundNullable(extraPeakProminenceRatio),
    gradientPeakCount: gradientPeaks.length,
    gradientTroughCount: gradientTroughs.length,
    gradientExtraAlignmentTheta: roundNullable(gradientExtraAlignmentTheta),
    atrialPressurePeakCount: atrialPressurePeaks.length,
    atrialPressureTroughCount: atrialPressureTroughs.length,
    atrialPressureExtraAlignmentTheta: roundNullable(atrialPressureExtraAlignmentTheta),
    ventricularPressurePeakCount: ventPressurePeaks.length,
    ventricularPressureTroughCount: ventPressureTroughs.length,
    ventricularPressureExtraAlignmentTheta: roundNullable(ventricularPressureExtraAlignmentTheta),
    valveStateExtremaCount: valveStateExtrema.length,
    valveStateRange: roundNullable(valveStateRange),
    valveStateExtraAlignmentTheta: roundNullable(valveStateExtraAlignmentTheta),
    diodeImpulseHitFraction: round(diodeImpulseHitFraction),
    qDotClampHitFraction: round(qDotClampHitFraction),
    continuityResidualRmsMlPerSec: round(continuityResidualRmsMlPerSec),
    continuityResidualMaxAbsMlPerSec: round(continuityResidualMaxAbsMlPerSec),
    continuityResidualToFlowPeak: roundNullable(continuityResidualToFlowPeak),
    avPlaneReadbackAvailable,
    avPlaneVelocityExtremaCount: avPlaneReadbackAvailable ? avPlaneVelocityExtrema.length : null,
    avPlaneVelocityExtraAlignmentTheta: roundNullable(avPlaneVelocityExtraAlignmentTheta),
    avPlaneEffectiveVolumeCorrectionRangeMl: roundNullable(avPlaneEffectiveVolumeCorrectionRangeMl),
  };
}

function classifyResidual(input: {
  readonly morphologyOk: boolean;
  readonly extraPeakCount: number;
  readonly diodeImpulseHitFraction: number;
  readonly qDotClampHitFraction: number;
  readonly gradientPeakCount: number;
  readonly gradientTroughCount: number;
  readonly gradientExtraAlignmentTheta: number | null;
  readonly atrialPressurePeakCount: number;
  readonly atrialPressureTroughCount: number;
  readonly atrialPressureExtraAlignmentTheta: number | null;
  readonly ventricularPressurePeakCount: number;
  readonly ventricularPressureTroughCount: number;
  readonly ventricularPressureExtraAlignmentTheta: number | null;
  readonly valveStateExtremaCount: number;
  readonly valveStateExtraAlignmentTheta: number | null;
  readonly continuityResidualToFlowPeak: number | null;
  readonly avPlaneReadbackAvailable: boolean;
  readonly avPlaneVelocityExtremaCount: number;
  readonly avPlaneVelocityExtraAlignmentTheta: number | null;
}): AvInflowResidualCause {
  if (input.morphologyOk && input.extraPeakCount === 0) return "clean-biphasic";
  if (input.diodeImpulseHitFraction > 0.12 || input.qDotClampHitFraction > 0.05) {
    return "valve-diode-or-qdot-contamination";
  }
  if (input.valveStateExtremaCount > 3 && aligned(input.valveStateExtraAlignmentTheta, 0.06)) {
    return "valve-state-chatter";
  }
  if (
    (input.gradientPeakCount > 2 || input.gradientTroughCount > 2)
    && aligned(input.gradientExtraAlignmentTheta, 0.08)
  ) {
    return "pressure-gradient-second-pulse";
  }
  if (
    input.avPlaneReadbackAvailable
    && input.avPlaneVelocityExtremaCount > 2
    && aligned(input.avPlaneVelocityExtraAlignmentTheta, 0.08)
  ) {
    return "av-plane-recoil-or-release";
  }
  if (
    input.atrialPressurePeakCount + input.atrialPressureTroughCount > 4
    && aligned(input.atrialPressureExtraAlignmentTheta, 0.08)
  ) {
    return "atrial-boundary-pressure-artifact";
  }
  if (
    input.ventricularPressurePeakCount + input.ventricularPressureTroughCount > 3
    && aligned(input.ventricularPressureExtraAlignmentTheta, 0.08)
  ) {
    return "ventricular-pressure-rebound";
  }
  if ((input.continuityResidualToFlowPeak ?? 0) > 0.08) {
    return "volume-pressure-transaction-mismatch";
  }
  if (input.gradientPeakCount > 2 || input.gradientTroughCount > 2) return "pressure-gradient-second-pulse";
  return "extra-wave-unattributed";
}

function residualMessage(valve: "MV" | "TV", cause: AvInflowResidualCause): string {
  if (cause === "clean-biphasic") return `${valve} inflow is cleanly biphasic.`;
  if (cause === "valve-diode-or-qdot-contamination") {
    return `${valve} extra inflow waves overlap valve diode or qDot clamp engagement.`;
  }
  if (cause === "pressure-gradient-second-pulse") {
    return `${valve} extra inflow waves align with a multi-peaked AV pressure gradient.`;
  }
  if (cause === "valve-state-chatter") return `${valve} extra inflow waves align with valve-state chatter.`;
  if (cause === "atrial-boundary-pressure-artifact") {
    return `${valve} extra inflow waves align with atrial boundary pressure extrema.`;
  }
  if (cause === "ventricular-pressure-rebound") {
    return `${valve} extra inflow waves align with ventricular filling pressure rebound.`;
  }
  if (cause === "av-plane-recoil-or-release") {
    return `${valve} extra inflow waves align with AV-plane velocity extrema.`;
  }
  if (cause === "volume-pressure-transaction-mismatch") {
    return `${valve} extra inflow waves coincide with chamber flow/volume-rate mismatch.`;
  }
  if (cause === "extra-wave-unattributed") return `${valve} extra inflow waves remain unattributed by local readbacks.`;
  return `${valve} residual attribution was not measured.`;
}

function unmeasuredResidual(valve: "MV" | "TV", reason: string): MvPressureRefitTransaction {
  return {
    valve,
    measured: false,
    morphologyOk: false,
    likelyCause: "not-measured",
    message: `${valve} residual attribution not measured: ${reason}.`,
    diastolicPeakCount: null,
    extraPeakCount: null,
    ePeakTheta: null,
    aPeakTheta: null,
    extraPeakTheta: null,
    extraPeakProminenceRatio: null,
    gradientPeakCount: null,
    gradientTroughCount: null,
    gradientExtraAlignmentTheta: null,
    atrialPressurePeakCount: null,
    atrialPressureTroughCount: null,
    atrialPressureExtraAlignmentTheta: null,
    ventricularPressurePeakCount: null,
    ventricularPressureTroughCount: null,
    ventricularPressureExtraAlignmentTheta: null,
    valveStateExtremaCount: null,
    valveStateRange: null,
    valveStateExtraAlignmentTheta: null,
    diodeImpulseHitFraction: null,
    qDotClampHitFraction: null,
    continuityResidualRmsMlPerSec: null,
    continuityResidualMaxAbsMlPerSec: null,
    continuityResidualToFlowPeak: null,
    avPlaneReadbackAvailable: false,
    avPlaneVelocityExtremaCount: null,
    avPlaneVelocityExtraAlignmentTheta: null,
    avPlaneEffectiveVolumeCorrectionRangeMl: null,
  };
}

function classify(
  summaries: readonly VariantSummary[],
  results: readonly PointResult[],
  refitConfigurationIntegrity: RefitConfigurationIntegrity,
): Classification {
  const legacy = requiredSummary(summaries, "legacy-frozen-reference");
  const current = requiredSummary(summaries, "current-user0-default");
  const lvRv = requiredSummary(summaries, "lv-rv-land-legacy-atria");
  const transactionCandidates = [
    requiredSummary(summaries, "tv-state-mv-fixedpoint3-relax07-legacy-atria"),
    requiredSummary(summaries, "accepted-av-boundary-legacy-atria"),
    requiredSummary(summaries, "accepted-av-complementarity2-legacy-atria"),
    requiredSummary(summaries, "accepted-av-complementarity3-relax07-legacy-atria"),
    requiredSummary(summaries, "accepted-av-complementarity3-relax07-user0"),
  ];
  const bestTransaction = bestSummary(transactionCandidates);
  const user0Transfer = requiredSummary(summaries, "accepted-av-complementarity3-relax07-user0");
  const focusCurrent = requiredResult(results, "current-user0-default", "low-preload-hr75");
  const focusLvRv = requiredResult(results, "lv-rv-land-legacy-atria", "low-preload-hr75");
  const focusBestTransaction = requiredResult(results, bestTransaction.variantId, "low-preload-hr75");
  const bestLegacyOrAnyCleanEnough =
    bestTransaction.grossPassCount === POINTS.length
    && bestTransaction.contractClassCounts.cleanVentricularSide >= POINTS.length * 2
    && bestTransaction.residualCauseCounts["clean-biphasic"] >= POINTS.length * 2;
  const user0TransferCleanEnough =
    user0Transfer.grossPassCount === POINTS.length
    && user0Transfer.contractClassCounts.cleanVentricularSide >= POINTS.length * 2
    && user0Transfer.residualCauseCounts["clean-biphasic"] >= POINTS.length * 2;
  const partialMvFixedPointRefitPositive =
    (
      bestTransaction.variantId.includes("mv-pressure-refit")
      || bestTransaction.variantId.includes("mv-fixedpoint")
      || bestTransaction.variantId.includes("accepted-av-boundary")
      || bestTransaction.variantId.includes("accepted-av-complementarity")
    )
    && bestTransaction.grossPassCount >= 7
    && bestTransaction.lvPvOkCount === POINTS.length
    && bestTransaction.rvPvOkCount === POINTS.length
    && bestTransaction.tvfOkCount >= 7
    && bestTransaction.mvfOkCount >= 7;
  return {
    legacyGrossPass: `${legacy.grossPassCount}/${POINTS.length}`,
    currentUser0GrossPass: `${current.grossPassCount}/${POINTS.length}`,
    lvRvLandLegacyAtriaGrossPass: `${lvRv.grossPassCount}/${POINTS.length}`,
    bestTransactionVariant: `${bestTransaction.variantId}:${bestTransaction.grossPassCount}/${POINTS.length}`,
    currentUser0DominantContractClasses: current.contractClassCounts,
    lvRvLandLegacyAtriaDominantContractClasses: lvRv.contractClassCounts,
    bestTransactionResidualCauseCounts: bestTransaction.residualCauseCounts,
    bestTransactionMvResidualCauseCounts: bestTransaction.mvResidualCauseCounts,
    bestTransactionTvResidualCauseCounts: bestTransaction.tvResidualCauseCounts,
    bestTransactionFailedResidualAttribution: failedResidualNotes(results, bestTransaction.variantId),
    decision: !refitConfigurationIntegrity.allConfigMatchesLabel
      ? "configuration-integrity-failed"
      : user0TransferCleanEnough
      ? "residuals-clean-enough-for-runtime-shadow"
      : bestLegacyOrAnyCleanEnough
        ? "legacy-atria-envelope-pass-user0-transfer-blocked"
        : partialMvFixedPointRefitPositive
          ? "partial-positive-mv-fixedpoint-refit"
          : "av-valve-boundary-transaction-redesign-required",
    notes: [
      `Current user-0 low-preload residual-point failed labels: ${focusCurrent.failedLabels.join(", ") || "none"}.`,
      `LV/RV Land legacy-atria low-preload residual-point failed labels: ${focusLvRv.failedLabels.join(", ") || "none"}.`,
      `Best transaction low-preload residual-point failed labels: ${focusBestTransaction.failedLabels.join(", ") || "none"}.`,
      `Best transaction gross pass count: ${bestTransaction.grossPassCount}/${POINTS.length}.`,
      `Best transaction residual causes: ${formatCounts(bestTransaction.residualCauseCounts)}.`,
      `Accepted-complementarity user0 transfer gross pass count: ${user0Transfer.grossPassCount}/${POINTS.length}.`,
      `Accepted-complementarity user0 transfer residual causes: ${formatCounts(user0Transfer.residualCauseCounts)}.`,
      `Refit configuration integrity: ${refitConfigurationIntegrity.mismatchCount}/${refitConfigurationIntegrity.checkedVariantCount} mismatched.`,
      `Refit configuration mismatches: ${refitConfigurationIntegrity.mismatchedVariantIds.join(", ") || "none"}.`,
      `Current user-0 contract classes: ${formatCounts(current.contractClassCounts)}.`,
      `LV/RV Land legacy-atria contract classes: ${formatCounts(lvRv.contractClassCounts)}.`,
      "The low-preload HR75 notes retain the Phase 5CK residual focus, while the decision uses the full representative morphology envelope.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.decision === "configuration-integrity-failed") {
    return [
      "do not interpret the morphology counts until requested/effective MV pressure-refit settings match each variant label",
      "fix ModelCore normalization or the Phase 5CO runner labels, then rerun the same 8-point morphology envelope",
      "do not adopt, wire, or transfer the fixed-point MV refit while configuration integrity is failed",
    ];
  }
  if (classification.decision === "residuals-clean-enough-for-runtime-shadow") {
    return [
      "rerun the full morphology envelope with the same active-source/pressure contract before runtime shadow",
      "resume LandAtrial AV-plane/effective-wall release timing only after LV/RV PV plus MVF/TVF remain robust",
    ];
  }
  if (classification.decision === "legacy-atria-envelope-pass-user0-transfer-blocked") {
    return [
      "do not adopt the fixed-point MV refit as runtime/default yet because all-chamber user0 transfer remains below the full morphology envelope",
      "carry accepted-av-boundary-legacy-atria forward only if it passes the full morphology envelope and transfers to user0 without LandAtrial tuning",
      "next run a transfer-focused all-chamber user0 residual attribution against low-preload HR75 and contractility-high HR75 without reopening A1/A2 or tuning valve/qDot/root/Zc/Tref/source-stress",
      "resume LandAtrial AV-plane/effective-wall release timing only as a transfer residual lane after the LV/RV plus legacy-atria transaction stays robust",
    ];
  }
  if (classification.decision === "partial-positive-mv-fixedpoint-refit") {
    return [
      "do not adopt the MV fixed-point pressure-refit candidate as runtime/default unless the full envelope passes and transfers to all-chamber user0",
      "if accepted-state AV boundary improves over Phase 5CM same-step refit, carry it forward as diagnostic component evidence only and rerun a transfer-focused all-chamber user0 surface",
      "if accepted-state AV boundary still leaves residual MV/TV diode artifacts, stop pointwise refit escalation and return to a broader chamber pressure-adapter contract redesign",
      "keep LandAtrial AV-plane/effective-wall release timing frozen until LV/RV PV plus MVF/TVF pass the morphology envelope",
    ];
  }
  const causes = classification.bestTransactionResidualCauseCounts;
  const valveBoundaryDominant =
    causes["valve-diode-or-qdot-contamination"] + causes["valve-state-chatter"]
    > causes["pressure-gradient-second-pulse"] + causes["ventricular-pressure-rebound"];
  const pressureContractDominant =
    causes["pressure-gradient-second-pulse"] + causes["ventricular-pressure-rebound"]
    >= causes["valve-diode-or-qdot-contamination"] + causes["valve-state-chatter"];
  const next: string[] = [
    "do not adopt the adjacent-load-node, state-coupled-complementarity, or MV fixed-point pressure-refit ventricularChamberTransactionStep candidates unless they pass the full morphology envelope",
  ];
  if (valveBoundaryDominant) {
    next.push("accepted-state AV valve fixed-point complementarity improves the legacy-atria surface only partially if the full morphology envelope remains below acceptance; move the next surface toward a broader chamber pressure/valve-load complementarity solve or pressure-adapter contract redesign");
  }
  if (pressureContractDominant) {
    next.push("prioritize a chamber pressure-adapter contract or broader graph-level chamber/load transaction because residual inflow waves align more with pressure-gradient or ventricular-pressure rebound than with local smoothing");
  }
  next.push(
    "do not spend more phases on zeta/tau/smoothing/substeps, qDot/root/Zc/valve-threshold retuning, Tref, source-stress scaling, or LandAtrial parameter tuning while this blocker is active",
  );
  return next;
}

function failedResidualNotes(
  results: readonly PointResult[],
  variantId: VariantId,
): readonly string[] {
  return results
    .filter((result) => result.variantId === variantId && result.avInflowResiduals)
    .flatMap((result) => {
      const residuals = result.avInflowResiduals!;
      return (["MV", "TV"] as const)
        .filter((valve) => residuals[valve].likelyCause !== "clean-biphasic")
        .map((valve) => {
          const residual = residuals[valve];
          return `${result.pointId}/${valve}: ${residual.likelyCause}; extraTheta=${formatNullable(residual.extraPeakTheta)}, gradientAlign=${formatNullable(residual.gradientExtraAlignmentTheta)}, diodeHit=${formatNullable(residual.diodeImpulseHitFraction)}, qDotHit=${formatNullable(residual.qDotClampHitFraction)}, continuityRatio=${formatNullable(residual.continuityResidualToFlowPeak)}`;
        });
    });
}

function bestSummary(summaries: readonly VariantSummary[]): VariantSummary {
  return [...summaries].sort((a, b) => {
    const gross = b.grossPassCount - a.grossPassCount;
    if (gross !== 0) return gross;
    const badges =
      (b.lvPvOkCount + b.rvPvOkCount + b.mvfOkCount + b.tvfOkCount)
      - (a.lvPvOkCount + a.rvPvOkCount + a.mvfOkCount + a.tvfOkCount);
    if (badges !== 0) return badges;
    return b.outputPreservedCount - a.outputPreservedCount;
  })[0];
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5CO variant summary ${id}.`);
  return summary;
}

function requiredResult(results: readonly PointResult[], variantId: VariantId, pointId: PointId): PointResult {
  const result = results.find((entry) => entry.variantId === variantId && entry.pointId === pointId);
  if (!result) throw new Error(`Missing Phase 5CO result ${variantId}/${pointId}.`);
  return result;
}

function formatCounts(counts: Readonly<Record<string, number>>): string {
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ") || "none";
}

function maxPeak(peaks: readonly Peak[]): Peak | null {
  if (peaks.length === 0) return null;
  return peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]);
}

function rangeForKey<K extends NumericSampleKey>(samples: readonly SimSample[], key: K): number {
  const values = samples.map((sample) => Number(sample[key])).filter(Number.isFinite);
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

function fraction(samples: readonly SimSample[], predicate: (sample: SimSample) => boolean): number {
  if (samples.length === 0) return 0;
  return samples.filter(predicate).length / samples.length;
}

function continuityResidual<K extends NumericSampleKey>(
  samples: readonly SimSample[],
  actualKey: K,
  expected: (sample: SimSample) => number,
): { readonly rms: number; readonly maxAbs: number } {
  const residuals = samples
    .map((sample) => {
      const actual = Number(sample[actualKey]);
      const expectedValue = expected(sample);
      return Number.isFinite(actual) && Number.isFinite(expectedValue) ? actual - expectedValue : null;
    })
    .filter((value): value is number => value != null && Number.isFinite(value));
  if (residuals.length === 0) return { rms: 0, maxAbs: 0 };
  const sumSquares = residuals.reduce((acc, value) => acc + value * value, 0);
  return {
    rms: Math.sqrt(sumSquares / residuals.length),
    maxAbs: Math.max(...residuals.map(Math.abs)),
  };
}

function nearestThetaDistance(theta: number | null, peaks: readonly Peak[]): number | null {
  if (theta == null || peaks.length === 0) return null;
  return Math.min(...peaks.map((peak) => circularThetaDistance(theta, peak.theta)));
}

function circularThetaDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 1;
  return Math.min(raw, 1 - raw);
}

function aligned(distanceTheta: number | null, thresholdTheta: number): boolean {
  return distanceTheta != null && distanceTheta <= thresholdTheta;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function roundNullable(value: number | null): number | null {
  return value == null ? null : round(value);
}

function formatNullable(value: number | null): string {
  return value == null ? "n/a" : String(round(value));
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

export function writeAvValveComplementarityPhase5COEvidence(): Evidence {
  const evidence = buildAvValveComplementarityPhase5COEvidence();
  const outPath = path.resolve(process.cwd(), AV_VALVE_COMPLEMENTARITY_PHASE5CO_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeAvValveComplementarityPhase5COEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    refitConfigurationIntegrity: evidence.refitConfigurationIntegrity,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
