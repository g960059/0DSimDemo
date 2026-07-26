import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  type MainWireScientificResearchControlIdV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  createMainWireScientificResearchControlTargetStateV0,
  loadMainWireScientificResearchControlTargetStateV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
} from "@/engine/scientific/release";
import type {
  RuntimeControlPatchV1,
  RuntimeControlValueV1,
  Sha256HexV1,
} from "@/studio/contracts/v1";

export const MAIN_WIRE_STUDIO_TARGET_INPUT_V1_SCHEMA_ID =
  "circleheart-main-wire-studio-target-input-v1" as const;

export type MainWireStudioResolvedTargetInputV1 = Readonly<{
  patch: RuntimeControlPatchV1;
  targetState: MainWireScientificResearchControlTargetStateV0;
}>;

export class MainWireStudioTargetResolutionErrorV1 extends Error {
  constructor(message: string) {
    super(`MainWire Studio target rejected: ${message}`);
    this.name = "MainWireStudioTargetResolutionErrorV1";
  }
}

/**
 * Resolves a Studio partial intent against the complete source target state.
 * No compatibility aliases are accepted: keys are exact model catalog IDs.
 */
export async function resolveMainWireStudioTargetInputV1(
  sourceState: unknown,
  baseSessionInputSha256: string,
  values: Readonly<Record<string, RuntimeControlValueV1>>,
): Promise<MainWireStudioResolvedTargetInputV1> {
  if (!/^[0-9a-f]{64}$/.test(baseSessionInputSha256)) {
    throw targetErrorV1("base session input identity is invalid");
  }
  const source =
    await loadMainWireScientificResearchControlTargetStateV0(sourceState);
  const entries = Object.entries(values);
  if (entries.length === 0) {
    throw targetErrorV1("at least one control value is required");
  }
  const allowedIds = new Set<string>(
    MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  );
  const nextControls: Record<string, number> = { ...source.controls };
  for (const [controlId, value] of entries) {
    if (!allowedIds.has(controlId)) {
      throw targetErrorV1(`unknown control ID ${controlId}`);
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw targetErrorV1(`control ${controlId} must be a finite number`);
    }
    nextControls[controlId] = value;
  }
  const targetState =
    await createMainWireScientificResearchControlTargetStateV0(
      nextControls as Record<MainWireScientificResearchControlIdV0, number>,
    );
  const targetInputSha256 = await mainWireStudioTargetInputSha256V1(
    targetState,
    baseSessionInputSha256,
  );
  const patchValues = Object.freeze({
    ...targetState.controls,
  }) as Readonly<Record<string, RuntimeControlValueV1>>;
  return Object.freeze({
    patch: Object.freeze({
      targetInputSha256,
      values: patchValues,
    }),
    targetState,
  });
}

export async function mainWireStudioTargetInputSha256V1(
  targetStateValue: unknown,
  baseSessionInputSha256: string,
): Promise<Sha256HexV1> {
  if (!/^[0-9a-f]{64}$/.test(baseSessionInputSha256)) {
    throw targetErrorV1("base session input identity is invalid");
  }
  const targetState =
    await loadMainWireScientificResearchControlTargetStateV0(targetStateValue);
  const identity = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId: MAIN_WIRE_STUDIO_TARGET_INPUT_V1_SCHEMA_ID,
    schemaVersion: 1,
    releaseRef: targetState.releaseRef,
    baseSessionInputSha256,
    controlTargetStateSha256: targetState.targetStateSha256,
    runtimeUpdatePolicy: {
      kind: "state-preserving-command-boundary-replacement",
      applicationBoundary: "next-accepted-command-boundary",
      ramp: "none",
      liveTimeScale: 1,
    },
    automaticLanes: {
      live: true,
      strictPeriodicSettlement: true,
      strictAutoPromotion: false,
    },
  });
  return await sha256CanonicalJsonHex(identity) as Sha256HexV1;
}

export async function assertMainWireStudioTargetPatchV1(
  sourceState: unknown,
  baseSessionInputSha256: string,
  patch: RuntimeControlPatchV1,
): Promise<MainWireScientificResearchControlTargetStateV0> {
  const keys = Object.keys(patch.values).sort();
  const expectedKeys = [
    ...MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  ].sort();
  if (
    keys.length !== expectedKeys.length
    || keys.some((key, index) => key !== expectedKeys[index])
  ) throw targetErrorV1(
    "runtime control values must contain the complete exact model catalog",
  );
  const resolved = await resolveMainWireStudioTargetInputV1(
    sourceState,
    baseSessionInputSha256,
    patch.values,
  );
  if (resolved.patch.targetInputSha256 !== patch.targetInputSha256) {
    throw targetErrorV1(
      "targetInputSha256 does not bind the resolved release/input/control/policy",
    );
  }
  return resolved.targetState;
}

function targetErrorV1(message: string): MainWireStudioTargetResolutionErrorV1 {
  return new MainWireStudioTargetResolutionErrorV1(message);
}
