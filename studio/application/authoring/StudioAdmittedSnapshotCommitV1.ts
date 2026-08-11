import {
  assertExperimentCapturesMatchModelV2,
  assertExperimentContentMatchesModelV2,
  validateExperimentSnapshotV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  studioSnapshotAdmissionServiceV1,
} from "@/studio/application/authoring/StudioSnapshotAdmissionServiceV1";
import type {
  ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import type {
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";

const ADMITTED_SNAPSHOT_COMMIT_V1 = Symbol(
  "StudioAdmittedSnapshotCommitV1",
);
const admittedSnapshotCommitsV1 = new WeakSet<object>();

/**
 * Process-local proof that one immutable candidate crossed the common Studio
 * admission boundary. Browser Worker and authenticated headless authoring use
 * this same persistence capability; neither repository accepts raw Snapshot
 * JSON.
 */
export type StudioAdmittedSnapshotCommitV1 = Readonly<{
  snapshot: ExperimentSnapshotV2;
  [ADMITTED_SNAPSHOT_COMMIT_V1]: true;
}>;

/**
 * Admits a direct exact-runtime candidate and mints the only value accepted by
 * headless Snapshot persistence.
 */
export async function admitAndSealStudioSnapshotCommitV1(input: Readonly<{
  snapshot: ExperimentSnapshotV2;
  runtime: ResolvedExactModelRuntimeV2;
}>): Promise<StudioAdmittedSnapshotCommitV1> {
  const snapshot = validateExperimentSnapshotV2(input.snapshot);
  assertExperimentContentMatchesModelV2(
    snapshot.content,
    input.runtime.contract,
  );
  await assertExperimentCapturesMatchModelV2(
    snapshot.content,
    input.runtime.contract,
    input.runtime.captureAdapter,
  );
  await studioSnapshotAdmissionServiceV1.admitFrozenCandidate({
    adapter: input.runtime.snapshotGate,
    model: input.runtime.contract,
    content: snapshot.content,
  });
  return sealValidatedStudioSnapshotCommitV1(snapshot);
}

export function assertStudioAdmittedSnapshotCommitV1(
  value: unknown,
): asserts value is StudioAdmittedSnapshotCommitV1 {
  if (
    value === null
    || typeof value !== "object"
    || !admittedSnapshotCommitsV1.has(value)
  ) {
    throw new Error(
      "Snapshot persistence requires a sealed admitted runtime result",
    );
  }
}

function sealValidatedStudioSnapshotCommitV1(
  snapshot: ExperimentSnapshotV2,
): StudioAdmittedSnapshotCommitV1 {
  const commit = {
    snapshot,
  } as StudioAdmittedSnapshotCommitV1;
  Object.defineProperty(commit, ADMITTED_SNAPSHOT_COMMIT_V1, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  Object.freeze(commit);
  admittedSnapshotCommitsV1.add(commit);
  return commit;
}
