import type { SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";

export type ExpectedFindingDirection = "up" | "down" | "unchanged" | "present" | "absent";
export type ExpectedFindingGate = "smoke" | "teaching" | "validation";

export type ExpectedFinding = {
  id: string;
  description: string;
  instanceId: string;
  comparatorInstanceId?: string;
  metric?: keyof SimMetrics;
  observable?: keyof SimSample;
  direction: ExpectedFindingDirection;
  tolerance?: number;
  gate: ExpectedFindingGate;
};

export type StructuredModelLimitation = {
  id: string;
  category: "0d" | "uncalibrated" | "missing-reflex" | "valve" | "coronary" | "pericardium" | "numerical" | "ui";
  severity: "info" | "caution" | "hard-limit";
  message: string;
  affects: string[];
  surfaceInUi: boolean;
};

export type ExpectedFindingResult = {
  finding: ExpectedFinding;
  status: "pass" | "fail" | "skip";
  actualValue?: number | boolean;
  comparatorValue?: number | boolean;
  message: string;
};

export type CaseValidationSolverConfig = {
  dt: number;
  sampleHz: number;
  settleSeconds?: number;
  recordSeconds?: number;
  measureBeats?: number;
};

export type CaseValidationReport = {
  schemaVersion: 1;
  generatedAt: string;
  modelVersion: string;
  engineVersion: string;
  knobMappingVersion: string;
  caseId: string;
  caseTitle: string;
  solver: CaseValidationSolverConfig;
  settleStatusByInstance: Record<string, SettleStatus | null>;
  healthByInstance: Record<string, SimulationHealth | null>;
  metricsByInstance: Record<string, SimMetrics | null>;
  expectedFindings: ExpectedFindingResult[];
  morphologyGates: [];
  limitations: StructuredModelLimitation[];
  warnings: string[];
  errors: string[];
  verdict: "pass" | "warning" | "fail";
};
