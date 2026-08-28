export const MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_V1_ID =
  "main-wire-aortic-valve-area-control-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1 = Object.freeze([
  "aortic-eoa-3p0cm2",
  "canonical-aortic-eoa-3p5cm2",
  "aortic-eoa-4p0cm2",
] as const);

export type MainWireAorticValveAreaControlPointIdV1 =
  (typeof MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_POINT_IDS_V1)[number];

export type MainWireAorticValveAreaControlPointV1 = Readonly<{
  pointId: MainWireAorticValveAreaControlPointIdV1;
  maximumForwardEoaCm2: 3 | 3.5 | 4;
  role: "fixed-area-identifiability-control";
  isCanonicalArea: boolean;
}>;

export const MAIN_WIRE_AORTIC_VALVE_AREA_CONTROL_CLAIM_V1 = Object.freeze({
  role: "fixed-area-identifiability-control-not-calibration" as const,
  continuousAreaResearchInputUsed: true as const,
  onlyAorticMaximumForwardEoaChangedAcrossPoints: true as const,
  aorticValveConstitutiveLawChanged: false as const,
  openingKineticsChanged: false as const,
  closedReverseEroaChanged: false as const,
  circulationLoadOrDriverChanged: false as const,
  acceptedStateOrCheckpointTopologyChanged: false as const,
  parameterSearchOrFitting: false as const,
  clinicalThresholdOrValidationClaimed: false as const,
  canonicalAdoptionEstablished: false as const,
});

const POINTS = Object.freeze({
  "aortic-eoa-3p0cm2": point("aortic-eoa-3p0cm2", 3, false),
  "canonical-aortic-eoa-3p5cm2": point(
    "canonical-aortic-eoa-3p5cm2",
    3.5,
    true,
  ),
  "aortic-eoa-4p0cm2": point("aortic-eoa-4p0cm2", 4, false),
} satisfies Readonly<
  Record<
    MainWireAorticValveAreaControlPointIdV1,
    MainWireAorticValveAreaControlPointV1
  >
>);

export function resolveMainWireAorticValveAreaControlPointV1(
  pointId: MainWireAorticValveAreaControlPointIdV1,
): MainWireAorticValveAreaControlPointV1 {
  const result = POINTS[pointId];
  if (result === undefined) {
    throw new Error(`unknown aortic valve area control point: ${pointId}`);
  }
  return result;
}

function point(
  pointId: MainWireAorticValveAreaControlPointIdV1,
  maximumForwardEoaCm2: 3 | 3.5 | 4,
  isCanonicalArea: boolean,
): MainWireAorticValveAreaControlPointV1 {
  return Object.freeze({
    pointId,
    maximumForwardEoaCm2,
    role: "fixed-area-identifiability-control" as const,
    isCanonicalArea,
  });
}
