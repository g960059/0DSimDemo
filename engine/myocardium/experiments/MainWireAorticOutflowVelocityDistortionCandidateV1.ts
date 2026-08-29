import type {
  MainWireAorticOutflowCandidateProtocolV8,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV8";

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATE_V1_ID =
  "main-wire-aortic-outflow-velocity-distortion-candidate-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATE_IDS_V1 =
  Object.freeze([
    "source-Aeff-three-halves-candidate",
    "source-Aeff-five-thirds-candidate",
  ] as const);

export type MainWireAorticOutflowVelocityDistortionCandidateIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATE_IDS_V1)[number];

export type MainWireAorticOutflowVelocityDistortionCandidateV1 =
  MainWireAorticOutflowCandidateProtocolV8<
    MainWireAorticOutflowVelocityDistortionCandidateIdV1
  >;

function candidate(
  candidateId: MainWireAorticOutflowVelocityDistortionCandidateIdV1,
  sourceVelocityDistortionProfileId:
    "source-Aeff-three-halves" | "source-Aeff-five-thirds",
): MainWireAorticOutflowVelocityDistortionCandidateV1 {
  return Object.freeze({
    candidateId,
    calciumProfileId:
      "main-wire-ventricular-calcium-land-coppini-source-trace-v1" as const,
    kuwProfileId: "land-whole-organ-kuw-nu4" as const,
    sarcomereReferenceProfileId:
      "land-sarcomere-reference-plus-5-percent" as const,
    calciumSensitivityLengthProfileId: "land-beta1-canonical" as const,
    twitchRetentionCandidateId:
      "source-twitch-retention-canonical" as const,
    trefForceLoadProfileId: "tref-force-load-baseline" as const,
    sourceVelocityDistortionProfileId,
    strongBridgeDeactivationExitProfileId:
      "strong-to-blocked-deactivation-off" as const,
    atrioventricularDelayProfileId:
      "coppini-source-atrioventricular-delay-160ms" as const,
    complianceProfileId: "arterial-stiffness-twofold" as const,
    characteristicResistancePlacementProfileId:
      "Land2017-characteristic-impedance-matched" as const,
    rootInertanceProfileId: "aortic-root-inertance-two-fifths" as const,
    aorticMaximumForwardEoaCm2: 3.5 as const,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATES_V1 =
  Object.freeze({
    "source-Aeff-three-halves-candidate": candidate(
      "source-Aeff-three-halves-candidate",
      "source-Aeff-three-halves",
    ),
    "source-Aeff-five-thirds-candidate": candidate(
      "source-Aeff-five-thirds-candidate",
      "source-Aeff-five-thirds",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowVelocityDistortionCandidateIdV1,
    MainWireAorticOutflowVelocityDistortionCandidateV1
  >>);

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRIOR_LOAD_ENVELOPE_SELECTED_CANDIDATE_V1 =
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATES_V1[
    "source-Aeff-five-thirds-candidate"
  ];

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATE_CLAIM_V1 =
  Object.freeze({
    role: "fixed-two-point-load-envelope-shortlist-not-canonical-default" as const,
    broadSourceReferencedAeffBracketCompletedBeforeShortlist: true as const,
    shortlistSelectionUsedPriorClosedLoopOutcomes: true as const,
    sourceIdentityClaimed: false as const,
    sourceCalciumAndTwitchKineticsRetainedExactly: true as const,
    fixedLengthIsometricTrajectoryChangedByCandidateAxis: false as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    macroHemodynamicRecalibrationApplied: false as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    numericOptimizerApplied: false as const,
    parameterSearchOrPatientFit: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_SELECTION_CLAIM_V1 =
  Object.freeze({
    role: "retrospective-prior-load-envelope-selection" as const,
    priorSelectedCandidateId:
      "source-Aeff-five-thirds-candidate" as const,
    priorPrimarySelectionCriterion:
      "ET-proxy-remains-inside-descriptive-healthy-interval-across-fixed-load-envelope" as const,
    gradientVelocityMorphologyAndDiastolicReadbacksUsedAsFalsificationScreens:
      true as const,
    macroHemodynamicRetentionWasNotPrimarySelectionCriterion: true as const,
    parameterValueWasOneOfPredeclaredBroadBracketPoints: true as const,
    interpolationOrNumericOptimizationApplied: false as const,
    sourceIdentityClaimed: false as const,
    currentSelectionStatus:
      "rejected-after-exact-source-velocity-protocol-audit" as const,
    rejectionBasis:
      "noncanonical-Aeff-fails-Land2017-constant-shortening-source-shortlist-cost" as const,
    wholeOrganMaterialReidentificationAccepted: false as const,
    currentCandidateForCanonicalAdoption: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowVelocityDistortionCandidateV1(
  candidateId: MainWireAorticOutflowVelocityDistortionCandidateIdV1,
): MainWireAorticOutflowVelocityDistortionCandidateV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATES_V1[candidateId];
  if (resolved === undefined) {
    throw new Error(`unsupported velocity-distortion candidate: ${String(candidateId)}`);
  }
  return resolved;
}
