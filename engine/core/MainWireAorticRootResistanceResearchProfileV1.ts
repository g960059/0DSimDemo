export const MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_PROFILE_V1_ID =
  "main-wire-aortic-root-resistance-research-profile-v1" as const;

export const MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_PROFILE_IDS_V1 =
  Object.freeze([
    "aortic-root-resistance-high",
    "aortic-root-resistance-three-halves",
  ] as const);

export type MainWireAorticRootResistanceResearchProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_PROFILE_IDS_V1)[number];

export type MainWireAorticRootResistanceResearchProfileV1 = Readonly<{
  profileId: MainWireAorticRootResistanceResearchProfileIdV1;
  dynamicEdgeId: "Ao_SA";
  /** Multiplies graph-owned Ao_SA R; it is not an added serial element. */
  resistanceScaleFromTopology: number;
  parameterSearchOrFitting: false;
}>;

export const MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_PROFILES_V1 =
  Object.freeze({
    "aortic-root-resistance-high": Object.freeze({
      profileId: "aortic-root-resistance-high" as const,
      dynamicEdgeId: "Ao_SA" as const,
      resistanceScaleFromTopology: 4 / 3,
      parameterSearchOrFitting: false as const,
    }),
    "aortic-root-resistance-three-halves": Object.freeze({
      profileId: "aortic-root-resistance-three-halves" as const,
      dynamicEdgeId: "Ao_SA" as const,
      resistanceScaleFromTopology: 1.5,
      parameterSearchOrFitting: false as const,
    }),
  } satisfies Readonly<Record<
    MainWireAorticRootResistanceResearchProfileIdV1,
    MainWireAorticRootResistanceResearchProfileV1
  >>);

export const MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_CLAIM_V1 =
  Object.freeze({
    role: "fixed-profile-source-research-ablation" as const,
    dynamicEdge: "Ao_SA" as const,
    resistanceScaleAxis: Object.freeze([4 / 3, 1.5] as const),
    topologyOwnedResistanceScaled: true as const,
    serialResistanceElementAdded: false as const,
    topologyOwnedInertanceChanged: false as const,
    dynamicFlowStateOwnerChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    valveConstitutiveLawChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireAorticRootResistanceResearchProfileV1(
  profileId: MainWireAorticRootResistanceResearchProfileIdV1,
): MainWireAorticRootResistanceResearchProfileV1 {
  const profile =
    MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_PROFILES_V1[profileId];
  if (profile === undefined) {
    throw new Error(
      `unsupported aortic-root resistance research profile: ${String(profileId)}`,
    );
  }
  return profile;
}

export function validateMainWireAorticRootResistanceResearchProfileV1(
  value: MainWireAorticRootResistanceResearchProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "aortic-root resistance research profile must be an object",
    ]);
  }
  const expected = MAIN_WIRE_AORTIC_ROOT_RESISTANCE_RESEARCH_PROFILES_V1[
    value.profileId
  ];
  if (expected === undefined) {
    return Object.freeze([
      "aortic-root resistance research profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "aortic-root resistance research profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireAorticRootResistanceResearchProfileV1]
      !== expected[key as keyof MainWireAorticRootResistanceResearchProfileV1]
    ) {
      issues.push(
        `aortic-root resistance research profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}
