import type {
  ExperimentSnapshotAdmissionPortV2,
  ExperimentSnapshotAdmissionResultV2,
} from "@/studio/contracts/v2/authoring";
import type { ExperimentContentV2 } from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";

export class StudioExperimentSnapshotAdmissionRejectedErrorV2 extends Error {
  constructor(reason: string) {
    super(`Studio Experiment Snapshot admission rejected: ${reason}`);
    this.name = "StudioExperimentSnapshotAdmissionRejectedErrorV2";
  }
}

export class StudioExperimentSnapshotAdmissionProtocolErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio Experiment Snapshot admission returned an invalid result: ${message}`);
    this.name = "StudioExperimentSnapshotAdmissionProtocolErrorV2";
  }
}

/**
 * The one Studio-owned admission boundary for both Article Briefing and
 * standalone Experiment publication.
 * The executable adapter belongs to the Standard exact release. Admission
 * remains a Studio policy boundary rather than authored content or model
 * identity.
 */
export class StudioSnapshotAdmissionServiceV1 {
  async admitFrozenCandidate(input: Readonly<{
    adapter: ExperimentSnapshotAdmissionPortV2;
    model: ModelContractV2;
    content: ExperimentContentV2;
  }>): Promise<void> {
    const result = await input.adapter.admitFrozenCandidate({
      model: input.model,
      content: input.content,
    });
    assertSnapshotAdmissionResultEnvelopeV1(result);
    if (result.status === "rejected") {
      throw new StudioExperimentSnapshotAdmissionRejectedErrorV2(
        result.reason,
      );
    }
  }
}

export const studioSnapshotAdmissionServiceV1 = Object.freeze(
  new StudioSnapshotAdmissionServiceV1(),
);

function assertSnapshotAdmissionResultEnvelopeV1(
  value: unknown,
): asserts value is ExperimentSnapshotAdmissionResultV2 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new StudioExperimentSnapshotAdmissionProtocolErrorV2(
      "result must be an object",
    );
  }
  const record = value as Record<string, unknown>;
  if (record.status === "passed") {
    assertAdmissionResultKeysV1(record, ["status"]);
    return;
  }
  if (record.status === "rejected") {
    assertAdmissionResultKeysV1(record, ["status", "reason"]);
    if (typeof record.reason !== "string" || record.reason.trim().length === 0) {
      throw new StudioExperimentSnapshotAdmissionProtocolErrorV2(
        "rejected result must contain a non-empty reason",
      );
    }
    return;
  }
  throw new StudioExperimentSnapshotAdmissionProtocolErrorV2(
    'status must be exactly "passed" or "rejected"',
  );
}

function assertAdmissionResultKeysV1(
  value: Record<string, unknown>,
  expected: readonly string[],
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw new StudioExperimentSnapshotAdmissionProtocolErrorV2(
      `fields must be exactly ${required.join(", ")}`,
    );
  }
}
