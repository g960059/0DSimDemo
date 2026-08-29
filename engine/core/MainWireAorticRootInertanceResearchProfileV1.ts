export const MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_PROFILE_V1_ID =
  "main-wire-aortic-root-inertance-research-profile-v1" as const;

export const MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_PROFILE_IDS_V1 =
  Object.freeze([
    "aortic-root-inertance-half",
    "aortic-root-inertance-two-fifths",
    "aortic-root-inertance-one-third",
    "aortic-root-inertance-one-quarter",
    "aortic-root-inertance-high",
  ] as const);

export type MainWireAorticRootInertanceResearchProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_PROFILE_IDS_V1)[number];

export type MainWireAorticRootInertanceResearchProfileV1 = Readonly<{
  profileId: MainWireAorticRootInertanceResearchProfileIdV1;
  dynamicEdgeId: "Ao_SA";
  /** Multiplies graph-owned Ao_SA L; it is not a second inertance. */
  inertanceScaleFromTopology: number;
  parameterSearchOrFitting: false;
}>;

export const MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_PROFILES_V1 =
  Object.freeze({
    "aortic-root-inertance-half": Object.freeze({
      profileId: "aortic-root-inertance-half" as const,
      dynamicEdgeId: "Ao_SA" as const,
      inertanceScaleFromTopology: 0.5,
      parameterSearchOrFitting: false as const,
    }),
    "aortic-root-inertance-two-fifths": Object.freeze({
      profileId: "aortic-root-inertance-two-fifths" as const,
      dynamicEdgeId: "Ao_SA" as const,
      inertanceScaleFromTopology: 0.4,
      parameterSearchOrFitting: false as const,
    }),
    "aortic-root-inertance-one-third": Object.freeze({
      profileId: "aortic-root-inertance-one-third" as const,
      dynamicEdgeId: "Ao_SA" as const,
      inertanceScaleFromTopology: 1 / 3,
      parameterSearchOrFitting: false as const,
    }),
    "aortic-root-inertance-one-quarter": Object.freeze({
      profileId: "aortic-root-inertance-one-quarter" as const,
      dynamicEdgeId: "Ao_SA" as const,
      inertanceScaleFromTopology: 0.25,
      parameterSearchOrFitting: false as const,
    }),
    "aortic-root-inertance-high": Object.freeze({
      profileId: "aortic-root-inertance-high" as const,
      dynamicEdgeId: "Ao_SA" as const,
      inertanceScaleFromTopology: 4 / 3,
      parameterSearchOrFitting: false as const,
    }),
  } satisfies Readonly<Record<
    MainWireAorticRootInertanceResearchProfileIdV1,
    MainWireAorticRootInertanceResearchProfileV1
  >>);

export const MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_CLAIM_V1 =
  Object.freeze({
    role: "fixed-profile-source-research-ablation" as const,
    dynamicEdge: "Ao_SA" as const,
    inertanceScaleAxis:
      Object.freeze([0.25, 1 / 3, 0.4, 0.5, 4 / 3] as const),
    topologyOwnedInertanceScaled: true as const,
    dynamicFlowStateOwnerChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    valveLocalFlowStateAdded: false as const,
    valveLocalInertanceAdded: false as const,
    resistanceChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireAorticRootInertanceResearchProfileV1(
  profileId: MainWireAorticRootInertanceResearchProfileIdV1,
): MainWireAorticRootInertanceResearchProfileV1 {
  const profile =
    MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_PROFILES_V1[profileId];
  if (profile === undefined) {
    throw new Error(
      `unsupported aortic-root inertance research profile: ${String(profileId)}`,
    );
  }
  return profile;
}

export function validateMainWireAorticRootInertanceResearchProfileV1(
  value: MainWireAorticRootInertanceResearchProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "aortic-root inertance research profile must be an object",
    ]);
  }
  const expected = MAIN_WIRE_AORTIC_ROOT_INERTANCE_RESEARCH_PROFILES_V1[
    value.profileId
  ];
  if (expected === undefined) {
    return Object.freeze([
      "aortic-root inertance research profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "aortic-root inertance research profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireAorticRootInertanceResearchProfileV1]
      !== expected[key as keyof MainWireAorticRootInertanceResearchProfileV1]
    ) {
      issues.push(
        `aortic-root inertance research profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}
