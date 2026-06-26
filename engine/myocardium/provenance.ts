import type { ModelProvenance } from "@/engine/myocardium/contracts";

export type ModelProvenanceValidationIssue = {
  field: keyof ModelProvenance;
  message: string;
};

const REQUIRED_STRING_FIELDS = [
  "equationsVersion",
  "parameterSetId",
  "parameterSetSha256",
  "activationSchedulerFamilyId",
  "activationModelId",
  "calciumModelId",
  "homogenizationModelId",
  "mechanicsModelId",
  "generalizedForceModelId",
  "calibrationCodeVersion",
  "solverVersion",
  "temperatureModelId",
  "decisionBaselineId",
] as const satisfies readonly (keyof ModelProvenance)[];

const REQUIRED_STRING_ARRAY_FIELDS = [
  "calibrationDatasetIds",
  "validationTargetPackIds",
  "sourceReferences",
  "modelLimitations",
] as const satisfies readonly (keyof ModelProvenance)[];

export function validateModelProvenance(provenance: ModelProvenance): readonly ModelProvenanceValidationIssue[] {
  const issues: ModelProvenanceValidationIssue[] = [];

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = provenance[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      issues.push({
        field,
        message: `${field} must be a non-empty string`,
      });
    }
  }

  if (!Number.isInteger(provenance.stateSchemaVersion) || provenance.stateSchemaVersion <= 0) {
    issues.push({
      field: "stateSchemaVersion",
      message: "stateSchemaVersion must be a positive integer",
    });
  }

  for (const field of REQUIRED_STRING_ARRAY_FIELDS) {
    const value = provenance[field];
    if (!Array.isArray(value) || value.length === 0) {
      issues.push({
        field,
        message: `${field} must contain at least one source string`,
      });
      continue;
    }

    value.forEach((entry, index) => {
      if (typeof entry !== "string" || entry.trim().length === 0) {
        issues.push({
          field,
          message: `${field}[${index}] must be a non-empty string`,
        });
      }
    });
  }

  return issues;
}

export function assertValidModelProvenance(provenance: ModelProvenance): ModelProvenance {
  const issues = validateModelProvenance(provenance);
  if (issues.length > 0) {
    throw new Error(`Invalid myocardium model provenance: ${issues.map((issue) => issue.message).join("; ")}`);
  }
  return provenance;
}
