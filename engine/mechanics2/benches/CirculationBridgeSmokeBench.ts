import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReservePointResultV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const CIRCULATION_BRIDGE_SMOKE_REPORT_ID_V1 =
  "circulation-bridge-smoke-report-v1" as const;

type ProfileIdV1 =
  | "normal-hr75"
  | "normal-hr90"
  | "preload-low"
  | "preload-high"
  | "afterload-high"
  | "contractility-low"
  | "contractility-high";

type BridgeVariantIdV1 =
  | "open-boundary-reference"
  | "shared-source-pressure-feedback-gain012"
  | "shared-source-pressure-feedback-gain020"
  | "shared-source-pressure-feedback-gain004"
  | "shared-source-pressure-feedback-gain007"
  | "systemic-venous-dominant-feedback-gain006"
  | "pulmonary-venous-dominant-feedback-gain006";

type PairedProfileV1 = {
  readonly profileId: ProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type BridgeVariantSpecV1 = {
  readonly variantId: BridgeVariantIdV1;
  readonly description: string;
  readonly outerIterations: number;
  readonly pressureGainMmHgPerMl: number;
  readonly maxPressureStepMmHg: number;
  readonly leftPressureWeight: number;
  readonly rightPressureWeight: number;
  readonly minPulmonaryVenousPressureMmHg: number;
  readonly maxPulmonaryVenousPressureMmHg: number;
  readonly minSystemicVenousPressureMmHg: number;
  readonly maxSystemicVenousPressureMmHg: number;
  readonly maxPulmonaryVenousAdjustmentMmHg: number;
  readonly maxSystemicVenousAdjustmentMmHg: number;
};

type BridgeIterationV1 = {
  readonly iteration: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly systemicVenousPressureMmHg: number;
  readonly leftAovEjectedVolumeMl: number | null;
  readonly rightPvEjectedVolumeMl: number | null;
  readonly signedMismatchMl: number | null;
  readonly absMismatchMl: number | null;
  readonly relativeMismatch: number | null;
  readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
};

export type CirculationBridgeSmokePointResultV1 = {
  readonly profileId: ProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly reference: {
    readonly leftAovEjectedVolumeMl: number | null;
    readonly rightPvEjectedVolumeMl: number | null;
    readonly signedMismatchMl: number | null;
    readonly absMismatchMl: number | null;
    readonly relativeMismatch: number | null;
    readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"] | "missing";
    readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"] | "missing";
  };
  readonly bridge: {
    readonly leftAovEjectedVolumeMl: number | null;
    readonly rightPvEjectedVolumeMl: number | null;
    readonly signedMismatchMl: number | null;
    readonly absMismatchMl: number | null;
    readonly relativeMismatch: number | null;
    readonly pulmonaryVenousPressureMmHg: number;
    readonly systemicVenousPressureMmHg: number;
    readonly pulmonaryVenousPressureAdjustmentMmHg: number;
    readonly systemicVenousPressureAdjustmentMmHg: number;
    readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"] | "missing";
    readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"] | "missing";
    readonly leftFailureReasons: readonly string[];
    readonly rightFailureReasons: readonly string[];
    readonly leftAcceptedPhenotypeReasons: readonly string[];
    readonly rightAcceptedPhenotypeReasons: readonly string[];
  };
  readonly classifications: {
    readonly leftMorphologyPreserved: boolean;
    readonly rightMorphologyPreserved: boolean;
    readonly morphologyPreserved: boolean;
    readonly flowBalanced: boolean;
    readonly mismatchImproved: boolean;
    readonly pressureAdjustmentBounded: boolean;
    readonly cleanBridgePoint: boolean;
  };
  readonly iterationHistory: readonly BridgeIterationV1[];
  readonly failureReasons: readonly string[];
};

export type CirculationBridgeSmokeVariantResultV1 = {
  readonly variantId: BridgeVariantIdV1;
  readonly description: string;
  readonly intervention: Omit<BridgeVariantSpecV1, "variantId" | "description">;
  readonly pointResults: readonly CirculationBridgeSmokePointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly leftMorphologyPreservedCount: number;
    readonly rightMorphologyPreservedCount: number;
    readonly morphologyPreservedCount: number;
    readonly flowBalancedCount: number;
    readonly mismatchImprovedCount: number;
    readonly pressureAdjustmentBoundedCount: number;
    readonly cleanLowContractilityBridgeCount: number;
    readonly meanReferenceAbsMismatchMl: number | null;
    readonly meanBridgeAbsMismatchMl: number | null;
    readonly maxBridgeAbsMismatchMl: number | null;
    readonly meanAbsMismatchImprovementMl: number | null;
    readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxSystemicVenousPressureAdjustmentMmHg: number | null;
  };
};

export type CirculationBridgeSmokeReportV1 = {
  readonly reportId: typeof CIRCULATION_BRIDGE_SMOKE_REPORT_ID_V1;
  readonly gateId: "circulationBridgeSmokeGateV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly rightReportId: "right-heart-strategic-smoke-report-v1";
  };
  readonly variantResults: readonly CirculationBridgeSmokeVariantResultV1[];
  readonly decision: {
    readonly circulationBridgeStatus: "bridge-pass" | "promising-mixed-signal" | "no-go";
    readonly bestVariantId: BridgeVariantIdV1;
    readonly bestPassCount: number;
    readonly referenceMeanAbsMismatchMl: number | null;
    readonly bestMeanAbsMismatchMl: number | null;
    readonly remainingBlockers: readonly string[];
    readonly nextAction: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueCirculationCoupling: false;
    readonly hiddenBloodVolumeTransfer: false;
    readonly morphologyAcceptance: false;
    readonly fourChamberUnlock: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID: LeftHeartDynamicReserveVariantIdV1 =
  "active-length-mv-closure-stateful-root08";

const PROFILES: readonly PairedProfileV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

const BRIDGE_VARIANTS: readonly BridgeVariantSpecV1[] = [
  {
    variantId: "open-boundary-reference",
    description: "No source-pressure feedback; records the paired left/right flow mismatch that the bridge must improve.",
    outerIterations: 0,
    pressureGainMmHgPerMl: 0,
    maxPressureStepMmHg: 0,
    leftPressureWeight: 0,
    rightPressureWeight: 0,
    minPulmonaryVenousPressureMmHg: 3,
    maxPulmonaryVenousPressureMmHg: 24,
    minSystemicVenousPressureMmHg: 1.5,
    maxSystemicVenousPressureMmHg: 14,
    maxPulmonaryVenousAdjustmentMmHg: 0,
    maxSystemicVenousAdjustmentMmHg: 0,
  },
  {
    variantId: "shared-source-pressure-feedback-gain012",
    description: "Low-gain symmetric source-pressure feedback, intended to test whether small morphology-preserving closure can reduce flow mismatch.",
    outerIterations: 6,
    pressureGainMmHgPerMl: 0.012,
    maxPressureStepMmHg: 0.35,
    leftPressureWeight: 1,
    rightPressureWeight: 1,
    minPulmonaryVenousPressureMmHg: 3,
    maxPulmonaryVenousPressureMmHg: 24,
    minSystemicVenousPressureMmHg: 1.5,
    maxSystemicVenousPressureMmHg: 14,
    maxPulmonaryVenousAdjustmentMmHg: 3,
    maxSystemicVenousAdjustmentMmHg: 3,
  },
  {
    variantId: "shared-source-pressure-feedback-gain020",
    description: "Moderate-low symmetric source-pressure feedback for morphology-preserving flow-balance sensitivity.",
    outerIterations: 6,
    pressureGainMmHgPerMl: 0.020,
    maxPressureStepMmHg: 0.55,
    leftPressureWeight: 1,
    rightPressureWeight: 1,
    minPulmonaryVenousPressureMmHg: 3,
    maxPulmonaryVenousPressureMmHg: 24,
    minSystemicVenousPressureMmHg: 1.5,
    maxSystemicVenousPressureMmHg: 14,
    maxPulmonaryVenousAdjustmentMmHg: 4,
    maxSystemicVenousAdjustmentMmHg: 4,
  },
  {
    variantId: "shared-source-pressure-feedback-gain004",
    description: "Symmetric source-pressure feedback from left-minus-right forward ejection mismatch.",
    outerIterations: 6,
    pressureGainMmHgPerMl: 0.04,
    maxPressureStepMmHg: 0.9,
    leftPressureWeight: 1,
    rightPressureWeight: 1,
    minPulmonaryVenousPressureMmHg: 3,
    maxPulmonaryVenousPressureMmHg: 24,
    minSystemicVenousPressureMmHg: 1.5,
    maxSystemicVenousPressureMmHg: 14,
    maxPulmonaryVenousAdjustmentMmHg: 7,
    maxSystemicVenousAdjustmentMmHg: 5,
  },
  {
    variantId: "shared-source-pressure-feedback-gain007",
    description: "Higher-gain symmetric source-pressure feedback for flow-balance sensitivity.",
    outerIterations: 6,
    pressureGainMmHgPerMl: 0.07,
    maxPressureStepMmHg: 1.3,
    leftPressureWeight: 1,
    rightPressureWeight: 1,
    minPulmonaryVenousPressureMmHg: 3,
    maxPulmonaryVenousPressureMmHg: 24,
    minSystemicVenousPressureMmHg: 1.5,
    maxSystemicVenousPressureMmHg: 14,
    maxPulmonaryVenousAdjustmentMmHg: 8,
    maxSystemicVenousAdjustmentMmHg: 6,
  },
  {
    variantId: "systemic-venous-dominant-feedback-gain006",
    description: "Flow-balance feedback that primarily changes the right systemic venous source pressure.",
    outerIterations: 6,
    pressureGainMmHgPerMl: 0.06,
    maxPressureStepMmHg: 1.2,
    leftPressureWeight: 0.4,
    rightPressureWeight: 1.4,
    minPulmonaryVenousPressureMmHg: 3,
    maxPulmonaryVenousPressureMmHg: 24,
    minSystemicVenousPressureMmHg: 1.5,
    maxSystemicVenousPressureMmHg: 14,
    maxPulmonaryVenousAdjustmentMmHg: 5,
    maxSystemicVenousAdjustmentMmHg: 7,
  },
  {
    variantId: "pulmonary-venous-dominant-feedback-gain006",
    description: "Flow-balance feedback that primarily changes the left pulmonary venous source pressure.",
    outerIterations: 6,
    pressureGainMmHgPerMl: 0.06,
    maxPressureStepMmHg: 1.2,
    leftPressureWeight: 1.4,
    rightPressureWeight: 0.4,
    minPulmonaryVenousPressureMmHg: 3,
    maxPulmonaryVenousPressureMmHg: 24,
    minSystemicVenousPressureMmHg: 1.5,
    maxSystemicVenousPressureMmHg: 14,
    maxPulmonaryVenousAdjustmentMmHg: 8,
    maxSystemicVenousAdjustmentMmHg: 4,
  },
];

export function runCirculationBridgeSmokeBenchV1(): CirculationBridgeSmokeReportV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rightParams = buildRightHeartStrategicEnvelopeV1();
  const variants = BRIDGE_VARIANTS.map((variant) => runBridgeVariant(variant, leftParams, rightParams));
  const reference = requiredVariant(variants, "open-boundary-reference");
  const best = [...variants].filter((variant) => variant.variantId !== "open-boundary-reference")
    .sort((a, b) =>
      b.summary.pass - a.summary.pass
      || b.summary.flowBalancedCount - a.summary.flowBalancedCount
      || b.summary.mismatchImprovedCount - a.summary.mismatchImprovedCount
      || (a.summary.meanBridgeAbsMismatchMl ?? 1e9) - (b.summary.meanBridgeAbsMismatchMl ?? 1e9),
    )[0] ?? reference;
  const circulationBridgeStatus = best.summary.pass === best.summary.total
    ? "bridge-pass"
    : best.summary.morphologyPreservedCount === best.summary.total
      && best.summary.flowBalancedCount >= 5
      && best.summary.mismatchImprovedCount >= 5
        ? "promising-mixed-signal"
        : "no-go";
  return {
    reportId: CIRCULATION_BRIDGE_SMOKE_REPORT_ID_V1,
    gateId: "circulationBridgeSmokeGateV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      rightReportId: "right-heart-strategic-smoke-report-v1",
    },
    variantResults: variants,
    decision: {
      circulationBridgeStatus,
      bestVariantId: best.variantId,
      bestPassCount: best.summary.pass,
      referenceMeanAbsMismatchMl: reference.summary.meanReferenceAbsMismatchMl,
      bestMeanAbsMismatchMl: best.summary.meanBridgeAbsMismatchMl,
      remainingBlockers: best.pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => `${point.profileId}: ${point.failureReasons.join(",")}`),
      nextAction: circulationBridgeStatus === "bridge-pass"
        ? "Treat the source-pressure bridge as a useful coupling signal and design the next true reservoir/mass-ledger bridge; do not wire runtime, four-chamber, AV-plane, or LandAtrial yet."
        : circulationBridgeStatus === "promising-mixed-signal"
          ? "Keep MechanicsCore2 on circulation-bridge work. Convert the source-pressure signal into an explicit reservoir/mass-ledger bridge before four-chamber, AV-plane, or LandAtrial work."
          : "Do not proceed to four-chamber, AV-plane, or LandAtrial. Rework the bridge closure because source-pressure feedback does not preserve morphology and flow balance.",
    },
    claimBoundary: {
      runtimeWiring: false,
      trueCirculationCoupling: false,
      hiddenBloodVolumeTransfer: false,
      morphologyAcceptance: false,
      fourChamberUnlock: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runBridgeVariant(
  variant: BridgeVariantSpecV1,
  leftParams: readonly LeftHeartSubsystemParamsV2[],
  rightParams: readonly RightHeartSubsystemParamsV2[],
): CirculationBridgeSmokeVariantResultV1 {
  const pointResults = PROFILES.map((profile) => {
    const left = leftParams.find((params) => params.fixtureId === profile.leftPointId);
    const right = rightParams.find((params) => params.fixtureId === profile.rightPointId);
    if (left == null || right == null) {
      return missingPoint(profile, left, right);
    }
    return runBridgePoint(profile, left, right, variant);
  });
  return {
    variantId: variant.variantId,
    description: variant.description,
    intervention: {
      outerIterations: variant.outerIterations,
      pressureGainMmHgPerMl: variant.pressureGainMmHgPerMl,
      maxPressureStepMmHg: variant.maxPressureStepMmHg,
      leftPressureWeight: variant.leftPressureWeight,
      rightPressureWeight: variant.rightPressureWeight,
      minPulmonaryVenousPressureMmHg: variant.minPulmonaryVenousPressureMmHg,
      maxPulmonaryVenousPressureMmHg: variant.maxPulmonaryVenousPressureMmHg,
      minSystemicVenousPressureMmHg: variant.minSystemicVenousPressureMmHg,
      maxSystemicVenousPressureMmHg: variant.maxSystemicVenousPressureMmHg,
      maxPulmonaryVenousAdjustmentMmHg: variant.maxPulmonaryVenousAdjustmentMmHg,
      maxSystemicVenousAdjustmentMmHg: variant.maxSystemicVenousAdjustmentMmHg,
    },
    pointResults,
    summary: summarizeVariant(pointResults),
  };
}

function runBridgePoint(
  profile: PairedProfileV1,
  leftBase: LeftHeartSubsystemParamsV2,
  rightBase: RightHeartSubsystemParamsV2,
  variant: BridgeVariantSpecV1,
): CirculationBridgeSmokePointResultV1 {
  const referenceLeft = runLeftHeartDynamicReservePointV1(leftBase);
  const referenceRight = runRightHeartStrategicPointV1(rightBase);
  const leftBasePressure = leftPulmonaryPressure(leftBase);
  const rightBasePressure = rightBase.systemicVenousPressureMmHg;
  let pulmonaryVenousPressure = leftBasePressure;
  let systemicVenousPressure = rightBasePressure;
  let bridgeLeft = referenceLeft;
  let bridgeRight = referenceRight;
  const iterationHistory: BridgeIterationV1[] = [];
  for (let iteration = 0; iteration <= variant.outerIterations; iteration++) {
    bridgeLeft = runLeftHeartDynamicReservePointV1(withLeftPulmonaryPressure(leftBase, pulmonaryVenousPressure));
    bridgeRight = runRightHeartStrategicPointV1(withRightSystemicVenousPressure(rightBase, systemicVenousPressure));
    const current = summarizeMismatch(bridgeLeft, bridgeRight);
    iterationHistory.push({
      iteration,
      pulmonaryVenousPressureMmHg: round(pulmonaryVenousPressure),
      systemicVenousPressureMmHg: round(systemicVenousPressure),
      leftAovEjectedVolumeMl: current.leftEjected,
      rightPvEjectedVolumeMl: current.rightEjected,
      signedMismatchMl: current.signedMismatch,
      absMismatchMl: current.absMismatch,
      relativeMismatch: current.relativeMismatch,
      leftStatus: bridgeLeft.status,
      rightStatus: bridgeRight.status,
    });
    if (iteration === variant.outerIterations || current.signedMismatch == null) break;
    const pressureStep = clamp(
      current.signedMismatch * variant.pressureGainMmHgPerMl,
      -variant.maxPressureStepMmHg,
      variant.maxPressureStepMmHg,
    );
    pulmonaryVenousPressure = clamp(
      pulmonaryVenousPressure - pressureStep * variant.leftPressureWeight,
      variant.minPulmonaryVenousPressureMmHg,
      variant.maxPulmonaryVenousPressureMmHg,
    );
    systemicVenousPressure = clamp(
      systemicVenousPressure + pressureStep * variant.rightPressureWeight,
      variant.minSystemicVenousPressureMmHg,
      variant.maxSystemicVenousPressureMmHg,
    );
  }
  const reference = summarizeMismatch(referenceLeft, referenceRight);
  const bridge = summarizeMismatch(bridgeLeft, bridgeRight);
  const pulmonaryAdjustment = pulmonaryVenousPressure - leftBasePressure;
  const systemicAdjustment = systemicVenousPressure - rightBasePressure;
  const classifications = classifyPoint({
    reference,
    bridge,
    referenceLeft,
    referenceRight,
    bridgeLeft,
    bridgeRight,
    pulmonaryAdjustment,
    systemicAdjustment,
    variant,
  });
  const failureReasons = failureReasonsFor(classifications);
  return {
    profileId: profile.profileId,
    leftPointId: profile.leftPointId,
    rightPointId: profile.rightPointId,
    status: failureReasons.length === 0 ? "pass" : "fail",
    reference: {
      leftAovEjectedVolumeMl: reference.leftEjected,
      rightPvEjectedVolumeMl: reference.rightEjected,
      signedMismatchMl: reference.signedMismatch,
      absMismatchMl: reference.absMismatch,
      relativeMismatch: reference.relativeMismatch,
      leftStatus: referenceLeft.status,
      rightStatus: referenceRight.status,
    },
    bridge: {
      leftAovEjectedVolumeMl: bridge.leftEjected,
      rightPvEjectedVolumeMl: bridge.rightEjected,
      signedMismatchMl: bridge.signedMismatch,
      absMismatchMl: bridge.absMismatch,
      relativeMismatch: bridge.relativeMismatch,
      pulmonaryVenousPressureMmHg: round(pulmonaryVenousPressure),
      systemicVenousPressureMmHg: round(systemicVenousPressure),
      pulmonaryVenousPressureAdjustmentMmHg: round(pulmonaryAdjustment),
      systemicVenousPressureAdjustmentMmHg: round(systemicAdjustment),
      leftStatus: bridgeLeft.status,
      rightStatus: bridgeRight.status,
      leftFailureReasons: bridgeLeft.failureReasons,
      rightFailureReasons: bridgeRight.failureReasons,
      leftAcceptedPhenotypeReasons: bridgeLeft.acceptedPhenotypeReasons,
      rightAcceptedPhenotypeReasons: bridgeRight.acceptedPhenotypeReasons,
    },
    classifications,
    iterationHistory,
    failureReasons,
  };
}

function classifyPoint(input: {
  readonly reference: ReturnType<typeof summarizeMismatch>;
  readonly bridge: ReturnType<typeof summarizeMismatch>;
  readonly referenceLeft: LeftHeartDynamicReservePointResultV1;
  readonly referenceRight: RightHeartStrategicSmokePointResultV1;
  readonly bridgeLeft: LeftHeartDynamicReservePointResultV1;
  readonly bridgeRight: RightHeartStrategicSmokePointResultV1;
  readonly pulmonaryAdjustment: number;
  readonly systemicAdjustment: number;
  readonly variant: BridgeVariantSpecV1;
}): CirculationBridgeSmokePointResultV1["classifications"] {
  const leftMorphologyPreserved = input.bridgeLeft.status === "pass";
  const rightMorphologyPreserved = input.bridgeRight.status === "pass";
  const morphologyPreserved = leftMorphologyPreserved && rightMorphologyPreserved;
  const flowBalanced =
    input.bridge.absMismatch != null
    && input.bridge.relativeMismatch != null
    && (input.bridge.absMismatch <= 8 || input.bridge.relativeMismatch <= 0.18);
  const mismatchImproved =
    input.reference.absMismatch != null
    && input.bridge.absMismatch != null
    && input.bridge.absMismatch < input.reference.absMismatch - 0.5;
  const pressureAdjustmentBounded =
    Math.abs(input.pulmonaryAdjustment) <= input.variant.maxPulmonaryVenousAdjustmentMmHg + 1e-9
    && Math.abs(input.systemicAdjustment) <= input.variant.maxSystemicVenousAdjustmentMmHg + 1e-9;
  return {
    leftMorphologyPreserved,
    rightMorphologyPreserved,
    morphologyPreserved,
    flowBalanced,
    mismatchImproved: input.variant.variantId === "open-boundary-reference" ? false : mismatchImproved,
    pressureAdjustmentBounded,
    cleanBridgePoint: morphologyPreserved && flowBalanced && pressureAdjustmentBounded,
  };
}

function failureReasonsFor(
  classifications: CirculationBridgeSmokePointResultV1["classifications"],
): readonly string[] {
  const failures: string[] = [];
  if (!classifications.leftMorphologyPreserved) failures.push("left-surface-not-preserved");
  if (!classifications.rightMorphologyPreserved) failures.push("right-surface-not-preserved");
  if (!classifications.flowBalanced) failures.push("left-right-forward-ejection-mismatch");
  if (!classifications.pressureAdjustmentBounded) failures.push("source-pressure-adjustment-unbounded");
  return failures;
}

function summarizeMismatch(
  left: LeftHeartDynamicReservePointResultV1,
  right: RightHeartStrategicSmokePointResultV1,
): {
  readonly leftEjected: number | null;
  readonly rightEjected: number | null;
  readonly signedMismatch: number | null;
  readonly absMismatch: number | null;
  readonly relativeMismatch: number | null;
} {
  const leftEjected = left.finalBeat?.aovEjectedVolumeMl ?? null;
  const rightEjected = right.finalBeat?.pvEjectedVolumeMl ?? null;
  if (leftEjected == null || rightEjected == null) {
    return {
      leftEjected,
      rightEjected,
      signedMismatch: null,
      absMismatch: null,
      relativeMismatch: null,
    };
  }
  const signedMismatch = leftEjected - rightEjected;
  const absMismatch = Math.abs(signedMismatch);
  const meanForward = (Math.abs(leftEjected) + Math.abs(rightEjected)) / 2;
  return {
    leftEjected: round(leftEjected),
    rightEjected: round(rightEjected),
    signedMismatch: round(signedMismatch),
    absMismatch: round(absMismatch),
    relativeMismatch: meanForward > 1e-9 ? round(absMismatch / meanForward) : null,
  };
}

function summarizeVariant(
  pointResults: readonly CirculationBridgeSmokePointResultV1[],
): CirculationBridgeSmokeVariantResultV1["summary"] {
  const referenceAbs = pointResults.map((point) => point.reference.absMismatchMl ?? Number.NaN);
  const bridgeAbs = pointResults.map((point) => point.bridge.absMismatchMl ?? Number.NaN);
  return {
    total: pointResults.length,
    pass: pointResults.filter((point) => point.status === "pass").length,
    fail: pointResults.filter((point) => point.status === "fail").length,
    inconclusive: pointResults.filter((point) => point.status === "inconclusive").length,
    leftMorphologyPreservedCount: pointResults.filter((point) => point.classifications.leftMorphologyPreserved).length,
    rightMorphologyPreservedCount: pointResults.filter((point) => point.classifications.rightMorphologyPreserved).length,
    morphologyPreservedCount: pointResults.filter((point) => point.classifications.morphologyPreserved).length,
    flowBalancedCount: pointResults.filter((point) => point.classifications.flowBalanced).length,
    mismatchImprovedCount: pointResults.filter((point) => point.classifications.mismatchImproved).length,
    pressureAdjustmentBoundedCount: pointResults.filter((point) => point.classifications.pressureAdjustmentBounded).length,
    cleanLowContractilityBridgeCount: pointResults.filter((point) =>
      point.profileId === "contractility-low" && point.status === "pass"
    ).length,
    meanReferenceAbsMismatchMl: finiteMeanOrNull(referenceAbs),
    meanBridgeAbsMismatchMl: finiteMeanOrNull(bridgeAbs),
    maxBridgeAbsMismatchMl: finiteMaxOrNull(bridgeAbs),
    meanAbsMismatchImprovementMl: finiteMeanOrNull(pointResults.map((point) => {
      const reference = point.reference.absMismatchMl;
      const bridge = point.bridge.absMismatchMl;
      return reference != null && bridge != null ? reference - bridge : Number.NaN;
    })),
    maxPulmonaryVenousPressureAdjustmentMmHg: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.bridge.pulmonaryVenousPressureAdjustmentMmHg)
    )),
    maxSystemicVenousPressureAdjustmentMmHg: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.bridge.systemicVenousPressureAdjustmentMmHg)
    )),
  };
}

function missingPoint(
  profile: PairedProfileV1,
  left: LeftHeartSubsystemParamsV2 | undefined,
  right: RightHeartSubsystemParamsV2 | undefined,
): CirculationBridgeSmokePointResultV1 {
  return {
    profileId: profile.profileId,
    leftPointId: profile.leftPointId,
    rightPointId: profile.rightPointId,
    status: "inconclusive",
    reference: {
      leftAovEjectedVolumeMl: null,
      rightPvEjectedVolumeMl: null,
      signedMismatchMl: null,
      absMismatchMl: null,
      relativeMismatch: null,
      leftStatus: left == null ? "missing" : "inconclusive",
      rightStatus: right == null ? "missing" : "inconclusive",
    },
    bridge: {
      leftAovEjectedVolumeMl: null,
      rightPvEjectedVolumeMl: null,
      signedMismatchMl: null,
      absMismatchMl: null,
      relativeMismatch: null,
      pulmonaryVenousPressureMmHg: left != null ? leftPulmonaryPressure(left) : Number.NaN,
      systemicVenousPressureMmHg: right?.systemicVenousPressureMmHg ?? Number.NaN,
      pulmonaryVenousPressureAdjustmentMmHg: 0,
      systemicVenousPressureAdjustmentMmHg: 0,
      leftStatus: left == null ? "missing" : "inconclusive",
      rightStatus: right == null ? "missing" : "inconclusive",
      leftFailureReasons: left == null ? ["missing-left-point"] : [],
      rightFailureReasons: right == null ? ["missing-right-point"] : [],
      leftAcceptedPhenotypeReasons: [],
      rightAcceptedPhenotypeReasons: [],
    },
    classifications: {
      leftMorphologyPreserved: false,
      rightMorphologyPreserved: false,
      morphologyPreserved: false,
      flowBalanced: false,
      mismatchImproved: false,
      pressureAdjustmentBounded: false,
      cleanBridgePoint: false,
    },
    iterationHistory: [],
    failureReasons: [
      ...(left == null ? ["missing-left-point"] : []),
      ...(right == null ? ["missing-right-point"] : []),
    ],
  };
}

function withLeftPulmonaryPressure(
  params: LeftHeartSubsystemParamsV2,
  pressureMmHg: number,
): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    pulmonaryVenousPressureMmHg: pressureMmHg,
    pulmonaryVenousInitialPressureMmHg: pressureMmHg,
    pulmonaryVenousSourcePressureMmHg: pressureMmHg,
  };
}

function withRightSystemicVenousPressure(
  params: RightHeartSubsystemParamsV2,
  pressureMmHg: number,
): RightHeartSubsystemParamsV2 {
  return {
    ...params,
    systemicVenousPressureMmHg: pressureMmHg,
  };
}

function leftPulmonaryPressure(params: LeftHeartSubsystemParamsV2): number {
  return params.pulmonaryVenousBoundaryMode === "fixed-pressure"
    ? params.pulmonaryVenousPressureMmHg
    : params.pulmonaryVenousSourcePressureMmHg;
}

function requiredVariant(
  variants: readonly CirculationBridgeSmokeVariantResultV1[],
  variantId: BridgeVariantIdV1,
): CirculationBridgeSmokeVariantResultV1 {
  const variant = variants.find((candidate) => candidate.variantId === variantId);
  if (variant == null) throw new Error(`Missing bridge variant ${variantId}`);
  return variant;
}

function finiteMeanOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
