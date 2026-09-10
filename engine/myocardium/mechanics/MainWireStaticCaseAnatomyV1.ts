import { stableHash } from "@/engine/integrity/stableHash";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 as prior } from "./normalAdultFiveWallPriorV1";

/** Two fixed constructions, not a continuous remodeling or live-control domain. */
export type MainWireStaticCaseAnatomyIdV1 = "baseline-v1" | "dilated-lv-v1";
const anatomySchemaId = "main-wire-static-case-anatomy-v1" as const;

function construct(caseId: MainWireStaticCaseAnatomyIdV1) {
  const enlarged = caseId === "dilated-lv-v1";
  const sourceWalls = prior.anatomy.triSeg.wallGeometryParameters;
  const resize = (wall: "LVFW" | "SEP") => enlarged ? Object.freeze({ ...sourceWalls[wall],
    referenceMidwallAreaM2: sourceWalls[wall].referenceMidwallAreaM2 * 1.15,
    wallMaterialVolumeM3: sourceWalls[wall].wallMaterialVolumeM3 * 1.25,
  }) : sourceWalls[wall];
  const trisegWalls = Object.freeze({ LVFW: resize("LVFW"), SEP: resize("SEP"), RVFW: sourceWalls.RVFW });
  const atrium = (wall: "LA" | "RA") => Object.freeze({
    wallMaterialVolumeM3: prior.anatomy.atria[wall].wallMaterialVolumeMl * 1e-6,
    referenceCavityBloodVolumeM3: prior.anatomy.atria[wall].inverseUnloadedReferenceCavityVolumeMl * 1e-6,
  });
  const atria = Object.freeze({ LA: atrium("LA"), RA: atrium("RA") });
  const mass = (volumeM3: number) => volumeM3 * prior.myocardialDensityKgPerM3 * 1000;
  const wallMassG = Object.freeze({ LA: mass(atria.LA.wallMaterialVolumeM3),
    LVFW: mass(trisegWalls.LVFW.wallMaterialVolumeM3), SEP: mass(trisegWalls.SEP.wallMaterialVolumeM3),
    RVFW: mass(trisegWalls.RVFW.wallMaterialVolumeM3), RA: mass(atria.RA.wallMaterialVolumeM3) });
  const body = Object.freeze({ anatomySchemaId, caseId, sourcePriorId: prior.priorId,
    sourcePriorParameterIdentityHash: prior.parameterIdentityHash,
    trisegWalls, atria, myocardialDensityKgPerM3: prior.myocardialDensityKgPerM3, wallMassG,
    lvMassG: wallMassG.LVFW + wallMassG.SEP, lvMassAllocation: "LVFW-plus-SEP" as const,
    // Same initial Newton seed and nondimensionalization as the qualified study.
    initialTriSegCoordinates: prior.anatomy.triSeg.loadedCoordinates,
    internalCoordinateScales: Object.freeze({
      septalMidwallCapVolumeM3: Math.abs(prior.anatomy.triSeg.loadedCoordinates.septalMidwallCapVolumeM3),
      junctionRadiusM: prior.anatomy.triSeg.loadedCoordinates.junctionRadiusM,
    }),
  });
  // Internal fingerprint only. Public exact persistence must hash/bind the
  // complete descriptor, not trust this short hash or an arbitrary case label.
  return Object.freeze({ ...body, anatomyFingerprint: stableHash(body) });
}

const baseline = construct("baseline-v1"), dilated = construct("dilated-lv-v1");
export type MainWireStaticCaseAnatomyV1 = ReturnType<typeof construct>;

export function resolveMainWireStaticCaseAnatomyV1(id: unknown): MainWireStaticCaseAnatomyV1 {
  if (id === "baseline-v1") return baseline;
  if (id === "dilated-lv-v1") return dilated;
  throw new Error("Unsupported static case anatomy; numeric geometry patches are not accepted");
}
