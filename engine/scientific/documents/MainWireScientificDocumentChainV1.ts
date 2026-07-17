import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  createMainWireScientificCaseDocumentV1,
  loadMainWireScientificCaseDocumentV1,
  mainWireScientificColdStartDescriptorV1,
  type MainWireScientificCaseDocumentV1,
  type MainWireScientificCaseProtocolDescriptorV1,
} from "@/engine/scientific/documents/MainWireScientificCaseDocumentV1";
import {
  createMainWireScientificPresetDocumentV1,
  loadMainWireScientificPresetDocumentV1,
  type MainWireScientificPresetDocumentV1,
} from "@/engine/scientific/documents/MainWireScientificPresetDocumentV1";
import {
  createMainWireScientificWorkspaceDocumentV1,
  loadMainWireScientificWorkspaceDocumentV1,
  type MainWireScientificWorkspaceDocumentV1,
  type MainWireScientificWorkspacePanelV1,
  type MainWireScientificWorkspacePressureVolumeTrajectoryV1,
} from "@/engine/scientific/documents/MainWireScientificWorkspaceDocumentV1";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
} from "@/engine/scientific/presets/officialHealthyPeriodicCheckpointPresetV1";
import type {
  BundledOfficialHealthyPeriodicPresetIdentityV1,
} from "@/engine/scientific/presets/bundledOfficialHealthyPeriodicCheckpointPresetV1";
import type {
  MainWireScientificResearchPresetRefV1,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";
import {
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  resolveMainWireScientificResearchPresetV1,
} from "@/engine/scientific/worker/MainWireScientificResearchPresetResolverV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_SCIENTIFIC_DOCUMENT_CHAIN_V1_ID =
  "main-wire-scientific-document-chain-v1" as const;

export type MainWireScientificDocumentChainPresetRefV1 =
  | MainWireScientificResearchPresetRefV1
  | BundledOfficialHealthyPeriodicPresetIdentityV1;

/**
 * A verified scientific chain and its presentation-only workspace. Catalog
 * trust deliberately is not copied into any of these documents.
 */
export type MainWireScientificDocumentChainV1 = Readonly<{
  chainId: typeof MAIN_WIRE_SCIENTIFIC_DOCUMENT_CHAIN_V1_ID;
  presetDocument: MainWireScientificPresetDocumentV1;
  caseDocument: MainWireScientificCaseDocumentV1;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
}>;

export type MainWireScientificDocumentChainBuildErrorCodeV1 =
  | "invalid-preset-ref"
  | "official-v2-start-not-representable"
  | "document-chain-invariant-failed";

export class MainWireScientificDocumentChainBuildErrorV1 extends Error {
  readonly code: MainWireScientificDocumentChainBuildErrorCodeV1;

  constructor(
    code: MainWireScientificDocumentChainBuildErrorCodeV1,
    message: string,
  ) {
    super(`main-wire scientific document chain rejected: ${message}`);
    this.name = "MainWireScientificDocumentChainBuildErrorV1";
    this.code = code;
  }
}

/**
 * Builds the current bounded research-preset chain. The official healthy
 * identity is recognized but rejected explicitly: its catalog-approved start
 * is an exact checkpoint V2, while CaseDocumentV1 permits only a resolved cold
 * start or a session-input-bound exact checkpoint V3. Relabeling that V2 state
 * as either supported start would silently change the meaning of the official
 * periodic preset.
 */
export async function buildMainWireScientificDocumentChainV1(
  untrustedPresetRef: unknown,
): Promise<MainWireScientificDocumentChainV1> {
  if (isOfficialHealthyIdentityCandidate(untrustedPresetRef)) {
    loadExactOfficialHealthyIdentity(untrustedPresetRef);
    throw new MainWireScientificDocumentChainBuildErrorV1(
      "official-v2-start-not-representable",
      "the official healthy periodic preset is bound to exact-checkpoint V2, "
        + "but CaseDocumentV1 accepts only release-resolved cold start or "
        + "session-input-bound exact-checkpoint V3; refusing to relabel the "
        + "official periodic state",
    );
  }

  let resolved;
  try {
    resolved = await resolveMainWireScientificResearchPresetV1(
      untrustedPresetRef,
    );
  } catch (error) {
    throw new MainWireScientificDocumentChainBuildErrorV1(
      "invalid-preset-ref",
      error instanceof Error ? error.message : String(error),
    );
  }

  try {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    if (!sameSimulationReleaseRef(release.ref, resolved.releaseRef)) {
      throw new Error("research preset resolved against a different release");
    }

    const presetDocument = await createMainWireScientificPresetDocumentV1(
      release,
      resolved.intent,
    );
    const protocolDescriptor = periodicProtocolDescriptor(release);
    const caseDocument = await createMainWireScientificCaseDocumentV1(
      release,
      {
        sourceIntent: resolved.intent,
        resolvedSessionInput: resolved.resolvedSessionInput,
        protocolDescriptor,
        startDescriptor: mainWireScientificColdStartDescriptorV1(
          resolved.resolvedSessionInput,
        ),
        lineage: {
          kind: "preset-instantiation",
          sourcePresetRef: presetDocument.ref,
          parentCaseRef: null,
        },
      },
    );
    const workspaceDocument = await createDefaultWorkspaceDocument(
      caseDocument,
    );

    const verifiedPreset = await loadMainWireScientificPresetDocumentV1(
      release,
      presetDocument,
    );
    const verifiedCase = await loadMainWireScientificCaseDocumentV1(
      release,
      caseDocument,
    );
    const verifiedWorkspace =
      await loadMainWireScientificWorkspaceDocumentV1(workspaceDocument);
    if (
      verifiedCase.content.resolvedSessionInput.sessionInputSha256
      !== resolved.resolvedSessionInput.sessionInputSha256
    ) {
      throw new Error("case session-input identity changed during construction");
    }
    if (
      verifiedWorkspace.content.caseDocumentRef.sha256
      !== verifiedCase.ref.sha256
    ) {
      throw new Error("workspace is not bound to the constructed case");
    }

    return Object.freeze({
      chainId: MAIN_WIRE_SCIENTIFIC_DOCUMENT_CHAIN_V1_ID,
      presetDocument: verifiedPreset,
      caseDocument: verifiedCase,
      workspaceDocument: verifiedWorkspace,
    });
  } catch (error) {
    if (error instanceof MainWireScientificDocumentChainBuildErrorV1) {
      throw error;
    }
    throw new MainWireScientificDocumentChainBuildErrorV1(
      "document-chain-invariant-failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function createDefaultWorkspaceDocument(
  caseDocument: MainWireScientificCaseDocumentV1,
): Promise<MainWireScientificWorkspaceDocumentV1> {
  return createMainWireScientificWorkspaceDocumentV1({
    revision: 0,
    caseDocumentRef: caseDocument.ref,
    panels: DEFAULT_WORKSPACE_PANELS_V1,
    notes: null,
  });
}

function periodicProtocolDescriptor(
  release: Awaited<ReturnType<
    typeof loadMainWireAdultFiveWallNonCoronaryReleaseV1
  >>,
): MainWireScientificCaseProtocolDescriptorV1 {
  const approved = release.manifest.approvedProtocols.find((candidate) =>
    candidate.protocolId
      === MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID
  );
  if (approved === undefined) {
    throw new Error("release does not approve the required periodic protocol");
  }
  return Object.freeze({
    protocolId: approved.protocolId,
    protocolVersion: approved.protocolVersion,
  });
}

function isOfficialHealthyIdentityCandidate(value: unknown): boolean {
  return isRecord(value)
    && value.presetId
      === OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID;
}

function loadExactOfficialHealthyIdentity(
  value: unknown,
): BundledOfficialHealthyPeriodicPresetIdentityV1 {
  if (!isRecord(value)) {
    throw new MainWireScientificDocumentChainBuildErrorV1(
      "invalid-preset-ref",
      "official preset identity must be an object",
    );
  }
  const keys = Object.keys(value).sort();
  if (
    keys.length !== 2
    || keys[0] !== "presetId"
    || keys[1] !== "presetVersion"
  ) {
    throw new MainWireScientificDocumentChainBuildErrorV1(
      "invalid-preset-ref",
      "official preset identity must contain exactly presetId and presetVersion",
    );
  }
  if (
    value.presetId !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID
    || value.presetVersion
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION
  ) {
    throw new MainWireScientificDocumentChainBuildErrorV1(
      "invalid-preset-ref",
      "official healthy preset identity or version is unsupported",
    );
  }
  return Object.freeze({
    presetId: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
    presetVersion: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const DEFAULT_WORKSPACE_PANELS_V1 = Object.freeze([
  Object.freeze({
    panelId: "four-chamber-pv",
    title: "Four-chamber pressure-volume loops",
    view: Object.freeze({
      kind: "pressure-volume" as const,
      trajectories: Object.freeze([
        pvTrajectory("la", "Left atrium", "LA"),
        pvTrajectory("ra", "Right atrium", "RA"),
        pvTrajectory("lv", "Left ventricle", "LV"),
        pvTrajectory("rv", "Right ventricle", "RV"),
      ]),
    }),
    layout: Object.freeze({ x: 0, y: 0, width: 8, height: 6 }),
  }),
  Object.freeze({
    panelId: "four-valve-flow",
    title: "Four-valve flow",
    view: Object.freeze({
      kind: "time-series" as const,
      observableIds: Object.freeze([
        "valve.MV.flow",
        "valve.AoV.flow",
        "valve.TV.flow",
        "valve.PV.flow",
      ] as const),
    }),
    layout: Object.freeze({ x: 8, y: 0, width: 4, height: 6 }),
  }),
  pressurePanel(
    "atrial-pressure",
    "Atrial pressure",
    [
      "hemodynamics.pressure.absolute.LA",
      "hemodynamics.pressure.absolute.RA",
    ],
    { x: 0, y: 6, width: 4, height: 4 },
  ),
  pressurePanel(
    "ventricular-pressure",
    "Ventricular pressure",
    [
      "hemodynamics.pressure.absolute.LV",
      "hemodynamics.pressure.absolute.RV",
    ],
    { x: 4, y: 6, width: 4, height: 4 },
  ),
  pressurePanel(
    "vascular-pressure",
    "Vascular pressure",
    [
      "hemodynamics.pressure.absolute.Ao",
      "hemodynamics.pressure.absolute.PA",
      "hemodynamics.pressure.absolute.PVein",
    ],
    { x: 8, y: 6, width: 4, height: 4 },
  ),
] satisfies readonly MainWireScientificWorkspacePanelV1[]);

function pvTrajectory(
  trajectoryId: "la" | "ra" | "lv" | "rv",
  label: string,
  chamber: "LA" | "RA" | "LV" | "RV",
): MainWireScientificWorkspacePressureVolumeTrajectoryV1 {
  return Object.freeze({
    trajectoryId,
    label,
    volumeObservableId: `hemodynamics.volume.${chamber}` as const,
    pressureObservableId:
      `hemodynamics.pressure.absolute.${chamber}` as const,
  });
}

function pressurePanel(
  panelId: string,
  title: string,
  observableIds: readonly (
    | "hemodynamics.pressure.absolute.LA"
    | "hemodynamics.pressure.absolute.RA"
    | "hemodynamics.pressure.absolute.LV"
    | "hemodynamics.pressure.absolute.RV"
    | "hemodynamics.pressure.absolute.Ao"
    | "hemodynamics.pressure.absolute.PA"
    | "hemodynamics.pressure.absolute.PVein"
  )[],
  layout: Readonly<{ x: number; y: number; width: number; height: number }>,
): MainWireScientificWorkspacePanelV1 {
  return Object.freeze({
    panelId,
    title,
    view: Object.freeze({
      kind: "time-series" as const,
      observableIds: Object.freeze([...observableIds]),
    }),
    layout: Object.freeze({ ...layout }),
  });
}
