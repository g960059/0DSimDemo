import {
  assertModelSurfaceExactKeysV1,
  modelSurfaceNonEmptyStringV1,
  modelSurfaceRecordV1,
} from "@/engine/modelSurface/v1/validationV1";

export const CAPABILITY_STAGES_V1 = Object.freeze([
  "absent",
  "kernel-only",
  "transaction-wired",
  "session-wired",
  "product-exposed",
] as const);

export type CapabilityStageV1 = (typeof CAPABILITY_STAGES_V1)[number];

export type AvailabilityUnavailableStatusV1 =
  | "not-modeled"
  | "not-wired"
  | "not-applicable"
  | "not-evaluated"
  | "not-converged"
  | "not-supported-by-profile";

export type AvailabilityV1 =
  | Readonly<{ status: "available" }>
  | Readonly<{
      status: AvailabilityUnavailableStatusV1;
      reasonCode: string;
      explanation: string;
    }>;

const UNAVAILABLE_STATUSES = new Set<AvailabilityUnavailableStatusV1>([
  "not-modeled",
  "not-wired",
  "not-applicable",
  "not-evaluated",
  "not-converged",
  "not-supported-by-profile",
]);

export function isCapabilityStageV1(
  value: unknown,
): value is CapabilityStageV1 {
  return typeof value === "string"
    && (CAPABILITY_STAGES_V1 as readonly string[]).includes(value);
}

export function loadAvailabilityV1(value: unknown): AvailabilityV1 {
  const record = modelSurfaceRecordV1(value, "availability");
  const status = modelSurfaceNonEmptyStringV1(
    record.status,
    "availability.status",
  );
  if (status === "available") {
    assertModelSurfaceExactKeysV1(
      record,
      ["status"],
      [],
      "available availability",
    );
    return Object.freeze({ status: "available" as const });
  }
  if (!UNAVAILABLE_STATUSES.has(status as AvailabilityUnavailableStatusV1)) {
    throw new Error(
      `model surface schema rejected: unknown availability status ${status}`,
    );
  }
  assertModelSurfaceExactKeysV1(
    record,
    ["status", "reasonCode", "explanation"],
    [],
    "unavailable availability",
  );
  return Object.freeze({
    status: status as AvailabilityUnavailableStatusV1,
    reasonCode: modelSurfaceNonEmptyStringV1(
      record.reasonCode,
      "availability.reasonCode",
    ),
    explanation: modelSurfaceNonEmptyStringV1(
      record.explanation,
      "availability.explanation",
    ),
  });
}
