import type {
  MainWireScientificWorkspaceDocumentV1,
  MainWireScientificWorkspacePressureVolumeTrajectoryV1,
} from "@/engine/scientific/documents/MainWireScientificWorkspaceDocumentV1";

const SCIENTIFIC_PV_CHAMBERS_V1 =
  Object.freeze(["LA", "RA", "LV", "RV"] as const);
type ScientificPvChamberV1 =
  (typeof SCIENTIFIC_PV_CHAMBERS_V1)[number];

/**
 * Resolves the same portable PV selection understood by the shared renderer.
 *
 * Workspace trajectory ids are authoritative and carry their already
 * validated volume/pressure observable pair. The four chamber names remain
 * deliberate renderer aliases; every other id must exist in the workspace
 * catalog and therefore fails closed when forged.
 */
export function resolveScientificProductPvTrajectoryV1(
  workspace: MainWireScientificWorkspaceDocumentV1,
  candidate: string,
): MainWireScientificWorkspacePressureVolumeTrajectoryV1 | null {
  const fromWorkspace =
    scientificProductPvTrajectoryCatalogV1(workspace).get(candidate);
  if (fromWorkspace !== undefined) return fromWorkspace;

  const chamber = SCIENTIFIC_PV_CHAMBERS_V1.find(
    (value) => value === candidate.toUpperCase(),
  );
  return chamber === undefined
    ? null
    : scientificProductChamberPvTrajectoryV1(chamber);
}

export function scientificProductPvTrajectoryCatalogV1(
  workspace: MainWireScientificWorkspaceDocumentV1,
): ReadonlyMap<
  string,
  MainWireScientificWorkspacePressureVolumeTrajectoryV1
> {
  return new Map(
    workspace.content.panels.flatMap(({ view }) =>
      view.kind === "pressure-volume"
        ? view.trajectories.map(
            (trajectory) => [trajectory.trajectoryId, trajectory] as const,
          )
        : [],
    ),
  );
}

function scientificProductChamberPvTrajectoryV1(
  chamber: ScientificPvChamberV1,
): MainWireScientificWorkspacePressureVolumeTrajectoryV1 {
  return Object.freeze({
    trajectoryId: `${chamber.toLowerCase()}-pressure-volume`,
    label: `${chamber} pressure–volume loop`,
    volumeObservableId: `hemodynamics.volume.${chamber}`,
    pressureObservableId: `hemodynamics.pressure.absolute.${chamber}`,
  });
}
