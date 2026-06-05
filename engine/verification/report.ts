import { defaultParams } from "@/engine/ModelCore";
import {
  measureSteady,
  settleToSteadyState,
  type SteadyMeasurement,
} from "@/engine/measure";
import type { CoreRuntimeParams, SimMetrics } from "@/engine/protocol";
import { panelForGate, type VerificationArtifactFile } from "@/engine/verification/panels";
import type { SettleStatus } from "@/engine/settling";
import {
  baselineShapeSummary,
  collectNormalBaselineGates,
  collectValidityGates,
  settleGate,
  summarizeGates,
  type BaselineShapeSummary,
  type GateResult,
  type VerificationSummary,
} from "@/engine/verification/gates";
import {
  resolveVerificationProfile,
  type VerificationMode,
  type VerificationProfile,
} from "@/engine/verification/profiles";

export type VerificationGateSet = "validityOnly" | "normalBaseline";

export type VerificationReport = {
  profile: VerificationProfile;
  gateSet: VerificationGateSet;
  generatedAt: string;
  summary: VerificationSummary;
  settleStatus: SettleStatus | null;
  metrics: SimMetrics | null;
  shape: BaselineShapeSummary | null;
  gates: GateResult[];
  failureLocations: FailureLocation[];
  measurement: SteadyMeasurement | null;
};

export type FailureLocation = {
  gateId: string;
  severity: GateResult["severity"];
  artifactFile: VerificationArtifactFile;
  panelId: string;
  panelTitle: string;
  value?: GateResult["value"];
  threshold?: string;
};

export type VerificationArtifact = Omit<VerificationReport, "measurement"> & {
  measurement: null;
};

export type VerificationRunOptions = {
  profile?: VerificationMode | VerificationProfile;
  gateSet?: VerificationGateSet;
  now?: Date;
};

export function runVerification(
  params: Partial<CoreRuntimeParams> = defaultParams(),
  options: VerificationRunOptions = {},
): VerificationReport {
  const profile = resolveVerificationProfile(options.profile ?? "verifyAccurate");
  const gateSet = options.gateSet ?? "validityOnly";
  const settled = settleToSteadyState(params, {
    targetTBV: profile.targetTBV,
    dt: profile.dt,
    sampleHz: profile.sampleHz,
    settlePolicy: profile.settlePolicy,
    measureBeats: profile.measureBeats,
    requireProjectorQuiet: profile.requireProjectorQuiet,
  });

  if (!settled.ok) {
    const gates = [settleGate(settled.settleStatus)];
    return {
      profile,
      gateSet,
      generatedAt: (options.now ?? new Date()).toISOString(),
      summary: summarizeGates(gates),
      settleStatus: settled.settleStatus,
      metrics: null,
      shape: null,
      gates,
      failureLocations: failureLocations(gates),
      measurement: null,
    };
  }

  const measurement = measureSteady(settled.core, settled.settleStatus, {
    targetTBV: profile.targetTBV,
    dt: profile.dt,
    sampleHz: profile.sampleHz,
    settlePolicy: profile.settlePolicy,
    measureBeats: profile.measureBeats,
    requireProjectorQuiet: profile.requireProjectorQuiet,
  });

  const gates = adjustGatesForProfile([
    settleGate(settled.settleStatus),
    ...collectValidityGates(measurement).filter((gate) => {
      return profile.requireProjectorQuiet || gate.id !== "projector-quiet";
    }),
    ...(gateSet === "normalBaseline" ? collectNormalBaselineGates(measurement) : []),
  ], profile);

  return {
    profile,
    gateSet,
    generatedAt: (options.now ?? new Date()).toISOString(),
    summary: summarizeGates(gates),
    settleStatus: settled.settleStatus,
    metrics: measurement.metrics,
    shape: gateSet === "normalBaseline" ? baselineShapeSummary(measurement) : null,
    gates,
    failureLocations: failureLocations(gates),
    measurement,
  };
}

function adjustGatesForProfile(gates: GateResult[], profile: VerificationProfile): GateResult[] {
  if (profile.mode === "verifyAccurate") return gates;
  const triageSoftIds = new Set([
    "lv-active-elastance-shape",
  ]);
  return gates.map((gate) => {
    const triageSoft =
      triageSoftIds.has(gate.id) ||
      gate.id.startsWith("pvf-") ||
      gate.id.startsWith("mv-gradient-");
    if (!triageSoft) return gate;
    return {
      ...gate,
      severity: "soft" as const,
      message: `${gate.message} Triage profile records this as score-only; verifyAccurate enforces it as a hard gate.`,
    };
  });
}

export function reportToMarkdown(report: VerificationReport): string {
  const lines: string[] = [];
  lines.push(`# Verification Report`);
  lines.push("");
  lines.push(`- Profile: ${report.profile.label} (${report.profile.mode})`);
  lines.push(`- Gate set: ${report.gateSet}`);
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Pass: ${report.summary.pass ? "yes" : "no"}`);
  lines.push(`- Hard failures: ${report.summary.hardFailures}`);
  lines.push(`- Soft failures: ${report.summary.softFailures}`);
  lines.push(`- Score: ${round(report.summary.score, 3)}`);
  if (report.failureLocations.length > 0) {
    lines.push("");
    lines.push("## Failure Localization");
    lines.push("");
    for (const loc of report.failureLocations) {
      const value = loc.value === undefined ? "" : ` value=${String(loc.value)}`;
      const threshold = loc.threshold ? ` threshold=${loc.threshold}` : "";
      lines.push(`- ${loc.gateId} -> ${loc.artifactFile}#${loc.panelId} (${loc.panelTitle})${value}${threshold}`);
    }
  }
  if (report.metrics) {
    lines.push("");
    lines.push("## Metrics");
    lines.push("");
    lines.push(`- AoP: ${round(report.metrics.AoPSys, 1)}/${round(report.metrics.AoPDia, 1)} (mean ${round(report.metrics.AoPMean, 1)}) mmHg`);
    lines.push(`- CO: L ${round(report.metrics.CO_L, 2)} / R ${round(report.metrics.CO_R, 2)} L/min`);
    lines.push(`- EF: L ${round(report.metrics.EF_LApprox, 2)} / R ${round(report.metrics.EF_RApprox, 2)}`);
    lines.push(`- Filling pressures: LAP ${round(report.metrics.LAPMean, 1)}, RAP ${round(report.metrics.RAPMean, 1)}, LVEDP ${round(report.metrics.LVEDPApprox, 1)} mmHg`);
    lines.push(`- PAP mean: ${round(report.metrics.PAPMean, 1)} mmHg`);
  }
  if (report.shape) {
    lines.push("");
    lines.push("## Shape");
    lines.push("");
    lines.push(`- LVP/AoP peak gap: ${round(report.shape.lvpAopPeakGap, 2)} mmHg`);
    lines.push(`- QMV A/E: ${nullableRound(report.shape.qmvAOverE, 3)}`);
    lines.push(`- QTV A/E: ${nullableRound(report.shape.qtvAOverE, 3)}`);
    lines.push(`- PVF S fraction: ${nullableRound(report.shape.pvfSFraction, 3)}`);
    lines.push(`- PVF S/D: ${nullableRound(report.shape.pvfSOverD, 3)}`);
    lines.push(`- PVF reverse fraction: ${nullableRound(report.shape.pvfReverseFraction, 3)}`);
    lines.push(`- LA/RA loop intersections: ${report.shape.laSelfIntersections}/${report.shape.raSelfIntersections}`);
  }
  lines.push("");
  lines.push("## Gates");
  lines.push("");
  for (const gate of report.gates) {
    const icon = gate.status === "pass" ? "PASS" : "FAIL";
    const value = gate.value === undefined ? "" : ` value=${String(gate.value)}`;
    const threshold = gate.threshold ? ` threshold=${gate.threshold}` : "";
    lines.push(`- ${icon} [${gate.severity}] ${gate.id}: ${gate.message}${value}${threshold}`);
  }
  return `${lines.join("\n")}\n`;
}

function failureLocations(gates: GateResult[]): FailureLocation[] {
  return gates
    .filter((gate) => gate.status === "fail")
    .map((gate) => {
      const panel = panelForGate(gate.id);
      return {
        gateId: gate.id,
        severity: gate.severity,
        artifactFile: panel?.artifactFile ?? "report.md",
        panelId: panel?.id ?? "gates",
        panelTitle: panel?.title ?? "Gates",
        value: gate.value,
        threshold: gate.threshold,
      };
    });
}

export function toVerificationArtifact(report: VerificationReport): VerificationArtifact {
  return {
    ...report,
    measurement: null,
  };
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function nullableRound(value: number | null, dp: number): string {
  return value == null ? "n/a" : String(round(value, dp));
}
