import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { decodeCanonicalFlatDataV1, encodeCanonicalFlatDataIntoV1, measureCanonicalFlatDataV1 } from "@/engine/vnext/CanonicalFlatDataV1";
import { MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID,
  validateAndOwnMainWireFiveWallCoupledPredictorCheckpointV2 as ownPredictor,
  type MainWireFiveWallCoupledPredictorCheckpointV2 } from "@/engine/vnext/coupled/MainWireFiveWallCoupledPredictorV1";
import { restoreMainWireIntegratedModelStandardV2, validateMainWireIntegratedModelStandardCheckpointV2 as validateBase,
  type MainWireIntegratedModelStandardCheckpointV2 } from "./MainWireIntegratedModelStandardCheckpointV2";
import { createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3 as baseContext } from "./experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 } from "./experiments/MainWireIntegratedModelStandard71FixtureV1";
import type { MainWireIntegratedModelStaticCaseFixtureV1 as Fixture } from "./experiments/MainWireIntegratedModelStaticCaseFixtureV1";

const checkpointId = "circleheart.main-wire-research-static-case-checkpoint.v1" as const;

/** Mutable development owner, not a released model ID. Bind resolved anatomy,
 * mass and constitutive inputs, not just a label or rounded provider hash. */
function construction(fixture: Fixture) {
  return Object.freeze({ assemblyId: fixture.staticCaseAssemblyId,
    numericalContinuation: MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID,
    anatomy: fixture.staticAnatomy, coronaryConstruction: fixture.coronaryConstruction,
    referenceWallMaterial: MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1,
    mechanismInputs: fixture.mechanismResearchInputs,
    hemodynamicInputs: fixture.hemodynamicResearchInputs,
    pericardium: fixture.pericardium,
    vascular: fixture.runtime.vascular,
    calcium: fixture.coronaryStepInput.calciumDriveParams,
  });
}

export type MainWireStaticCaseCheckpointV1 = Readonly<{
  checkpointId: typeof checkpointId;
  schemaVersion: 1;
  construction: ReturnType<typeof construction>;
  base: MainWireIntegratedModelStandardCheckpointV2;
  coupledPredictor: MainWireFiveWallCoupledPredictorCheckpointV2;
  checkpointSha256: string;
}>;

export async function checkpointMainWireStaticCaseV1(
  fixture: Fixture, baseInput: unknown, predictorInput: unknown,
): Promise<MainWireStaticCaseCheckpointV1> {
  const captured = ownSnapshot<{ construction: ReturnType<typeof construction>;
    base: MainWireIntegratedModelStandardCheckpointV2; predictor: MainWireFiveWallCoupledPredictorCheckpointV2 }>(
    { construction: construction(fixture), base: baseInput, predictor: predictorInput });
  const predictor = ownPredictor(captured.predictor);
  const base = await validateBase(captured.base);
  assertPredictorClock(base, predictor);
  const payload = Object.freeze({ checkpointId, schemaVersion: 1 as const,
    construction: captured.construction, base, coupledPredictor: predictor });
  return Object.freeze({ ...payload, checkpointSha256: await sha256CanonicalJsonHex(payload) });
}

export async function restoreMainWireStaticCaseV1(fixture: Fixture, input: unknown) {
  // Snapshot before the first await, including caller-owned nested arrays.
  const saved = ownSnapshot<MainWireStaticCaseCheckpointV1>(input);
  const expectedConstruction = canonicalJsonStringify(construction(fixture));
  exactFields(saved, ["checkpointId", "schemaVersion", "construction", "base", "coupledPredictor", "checkpointSha256"]);
  if (saved.checkpointId !== checkpointId || saved.schemaVersion !== 1) {
    throw new Error("Unsupported static case checkpoint schema");
  }
  if (canonicalJsonStringify(saved.construction) !== expectedConstruction) {
    throw new Error("Static case construction mismatch; another anatomy requires its own scenario state");
  }
  const { checkpointSha256, ...payload } = saved;
  if (typeof checkpointSha256 !== "string" || !/^[0-9a-f]{64}$/.test(checkpointSha256)
    || await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("Static case checkpoint SHA-256 mismatch");
  }
  const predictor = ownPredictor(saved.coupledPredictor);
  const base = await validateBase(saved.base);
  assertPredictorClock(base, predictor);
  const restored = await restoreMainWireIntegratedModelStandardV2({
    ...baseContext(fixture), mechanismResearchInputs: fixture.mechanismResearchInputs,
  }, base);
  // The exact owner additionally validates the predictor root against the
  // restored accepted state before the facade can escape.
  return Object.freeze({ ...restored, coupledPredictor: predictor });
}

function assertPredictorClock(base: MainWireIntegratedModelStandardCheckpointV2, predictor: MainWireFiveWallCoupledPredictorCheckpointV2) {
  if (predictor.historyDepth !== 0 && (predictor.expectedBaseRevision !== base.revision
    || !Object.is(predictor.expectedBaseAcceptedTimeSec, base.acceptedTimeSec))) {
    throw new Error("Static case predictor clock differs from accepted state");
  }
}

function exactFields(input: unknown, fields: readonly string[]) {
  if (input === null || typeof input !== "object" || Array.isArray(input)
    || Reflect.ownKeys(input).length !== fields.length
    || Reflect.ownKeys(input).some(key => typeof key !== "string" || !fields.includes(key))) {
    throw new Error("Static case checkpoint has an unexpected field set");
  }
}

function freeze(value: unknown): void {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

function ownSnapshot<T>(input: unknown): T {
  canonicalJsonStringify(input); // Reject non-JSON fields, accessors and nonfinite values.
  const data = new Uint8Array(measureCanonicalFlatDataV1(input));
  if (encodeCanonicalFlatDataIntoV1(input, data) !== data.byteLength) throw new Error("Case snapshot length mismatch");
  const result = decodeCanonicalFlatDataV1(data) as T; // Retain exact numeric values, including -0.
  freeze(result);
  return result;
}
