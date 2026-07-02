import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { SimSample } from "@/engine/protocol";
import {
  morphologyPhysiologyAuditReportFromSamples,
  type MorphologyPhysiologyAuditInputV1,
  type MorphologyPhysiologyAuditReportV1,
  type PhysiologyMorphologyProfileId,
} from "@/engine/diagnostics/morphology";

export const MORPHOLOGY_PHYSIOLOGY_AUDIT_SHADOW_PACK_PATH_V1 =
  "data/diagnostics/morphology/morphology-physiology-audit-shadow-pack-v1.json" as const;

export type ShadowPackScenarioV1 = {
  readonly scenarioId: string;
  readonly profileId: PhysiologyMorphologyProfileId;
  readonly label: string;
  readonly expectedMvPattern: string;
  readonly expectedTvPattern: string;
  readonly notes: readonly string[];
  readonly report: MorphologyPhysiologyAuditReportV1;
};

export type MorphologyPhysiologyAuditShadowPackV1 = {
  readonly reportId: "morphology-physiology-audit-shadow-pack-v1";
  readonly mode: "shadow";
  readonly strictNormalBaselineEarned: false;
  readonly generatedAt: string;
  readonly summary: {
    readonly scenarioCount: number;
    readonly allReportOnly: boolean;
    readonly noScenarioCanAffectGate: boolean;
    readonly artifactFailuresRemainVisible: boolean;
    readonly diseaseProfilesReportOnly: boolean;
    readonly lowPreloadDirectionalityReported: boolean;
  };
  readonly scenarios: readonly ShadowPackScenarioV1[];
  readonly normalizedSha256: string;
};

type WaveDefinition = {
  readonly e: number;
  readonly eTheta: number;
  readonly a: number;
  readonly aTheta: number;
  readonly l?: number;
  readonly lTheta?: number;
  readonly plateau?: number;
  readonly negative?: number;
  readonly kink?: boolean;
};

export function buildMorphologyPhysiologyAuditShadowPackV1(): MorphologyPhysiologyAuditShadowPackV1 {
  const nominalSamples = syntheticSamples({ e: 86, eTheta: 0.38, a: 44, aTheta: 0.92 });
  const nominalReport = reportForSamples(
    nominalSamples,
    "normal_sinus_central",
    "normal-ea-biphasic",
    "normal-ea-biphasic-run",
  );
  const nominalBaseline = {
    runId: nominalReport.runId,
    mvf: nominalReport.mvf?.patternClass.evidence,
    tvf: nominalReport.tvf?.patternClass.evidence,
  };

  const scenarioInputs = [
    {
      scenarioId: "normal-ea-biphasic",
      profileId: "normal_sinus_central" as const,
      label: "Normal central clean E/A",
      wave: { e: 86, eTheta: 0.38, a: 44, aTheta: 0.92 },
      expectedMvPattern: "EA_biphasic",
      expectedTvPattern: "EA_biphasic",
      notes: ["Central normal should classify as clean biphasic and remain report-only."],
    },
    {
      scenarioId: "normal-low-preload-e-reduced",
      profileId: "normal_sinus_low_preload" as const,
      label: "Low preload E-reduced / A-relative contribution",
      wave: { e: 48, eTheta: 0.38, a: 43, aTheta: 0.92 },
      expectedMvPattern: "EA_biphasic",
      expectedTvPattern: "EA_biphasic",
      nominalBaseline,
      notes: ["Requires directionality versus nominal rather than absolute E/A reversal."],
    },
    {
      scenarioId: "high-hr-ea-fusion",
      profileId: "normal_sinus_high_hr" as const,
      label: "High HR E/A fusion",
      wave: { e: 62, eTheta: 0.56, a: 54, aTheta: 0.68 },
      expectedMvPattern: "EA_fused",
      expectedTvPattern: "EA_fused",
      notes: ["Fusion is allowed in high HR shadow profile but remains report-only."],
    },
    {
      scenarioId: "high-afterload-too-normal-missing-response",
      profileId: "normal_sinus_high_afterload" as const,
      label: "High afterload with missing load-response evidence",
      wave: { e: 86, eTheta: 0.38, a: 44, aTheta: 0.92 },
      expectedMvPattern: "EA_biphasic",
      expectedTvPattern: "EA_biphasic",
      notes: ["High-afterload should not be pattern-only met without output/pressure response evidence."],
    },
    {
      scenarioId: "bradycardia-small-l-wave",
      profileId: "bradycardia_sinus" as const,
      label: "Bradycardia smooth small L-wave-like flow",
      wave: { e: 72, eTheta: 0.34, l: 16, lTheta: 0.68, a: 36, aTheta: 0.92 },
      expectedMvPattern: "ELA_triphasic",
      expectedTvPattern: "ELA_triphasic",
      notes: ["A small smooth L-wave-like component can be reported only with clean artifact guard."],
    },
    {
      scenarioId: "artifact-reservoir-third-wave",
      profileId: "bradycardia_sinus" as const,
      label: "Artifact third wave with reservoir overlap",
      wave: { e: 72, eTheta: 0.34, l: 44, lTheta: 0.70, a: 34, aTheta: 0.92 },
      hints: { overlapsReservoirTransfer: true },
      expectedMvPattern: "ELA_triphasic",
      expectedTvPattern: "ELA_triphasic",
      notes: ["Profile-allowed L-wave shape must still fail artifact guard when reservoir overlap exists."],
    },
    {
      scenarioId: "artifact-kinked-e-wave",
      profileId: "normal_sinus_central" as const,
      label: "Kinked E-wave artifact",
      wave: { e: 86, eTheta: 0.38, a: 44, aTheta: 0.92, kink: true },
      hints: { c1KinkSeverity: 5.4 },
      expectedMvPattern: "kink_artifact",
      expectedTvPattern: "kink_artifact",
      notes: ["Visible C1 discontinuity should not be rescued by profile logic."],
    },
    {
      scenarioId: "artifact-unphysiologic-sharpness",
      profileId: "normal_sinus_central" as const,
      label: "Unphysiologically sharp but otherwise biphasic inflow",
      wave: { e: 86, eTheta: 0.38, a: 44, aTheta: 0.92 },
      hints: { sharpnessSeverity: 4.4, sharpnessLimit: 3.2 },
      expectedMvPattern: "EA_biphasic",
      expectedTvPattern: "EA_biphasic",
      notes: ["Sharp legacy-like inflow must fail the universal artifact guard even when peak count is clean."],
    },
    {
      scenarioId: "artifact-closed-valve-forward-flow",
      profileId: "normal_sinus_central" as const,
      label: "Forward flow while valve state remains closed",
      wave: { e: 86, eTheta: 0.38, a: 44, aTheta: 0.92 },
      forceClosedValveState: true,
      expectedMvPattern: "EA_biphasic",
      expectedTvPattern: "EA_biphasic",
      notes: ["Valve-state support should be derived from xiMV/xiTV when no explicit hint is supplied."],
    },
    {
      scenarioId: "af-a-wave-absent",
      profileId: "atrial_fibrillation_report_only" as const,
      label: "AF report-only A-wave absent",
      wave: { e: 78, eTheta: 0.42, a: 0, aTheta: 0.92 },
      rhythm: "af" as const,
      expectedMvPattern: "E_only_or_A_absent",
      expectedTvPattern: "E_only_or_A_absent",
      notes: ["AF profile is disease report-only and must not affect current gates."],
    },
    {
      scenarioId: "mitral-stenosis-prolonged-inflow",
      profileId: "mitral_stenosis_report_only" as const,
      label: "MS report-only prolonged inflow",
      wave: { e: 38, eTheta: 0.42, a: 20, aTheta: 0.92, plateau: 22 },
      tvWave: { e: 64, eTheta: 0.38, a: 34, aTheta: 0.92 },
      expectedMvPattern: "prolonged_diastolic_inflow",
      expectedTvPattern: "EA_biphasic",
      notes: ["MS profile is report-only; prolonged inflow is a profile expectation skeleton."],
    },
  ];

  const scenarios = scenarioInputs.map((scenario) => {
    const samples = syntheticSamples(scenario.wave, scenario.tvWave, {
      forceClosedValveState: scenario.forceClosedValveState,
    });
    const report = reportForSamples(
      samples,
      scenario.profileId,
      scenario.scenarioId,
      `${scenario.scenarioId}-run`,
      {
        rhythm: scenario.rhythm,
        mvfHints: scenario.hints,
        tvfHints: scenario.hints,
        nominalBaseline: scenario.nominalBaseline,
      },
    );
    return {
      scenarioId: scenario.scenarioId,
      profileId: scenario.profileId,
      label: scenario.label,
      expectedMvPattern: scenario.expectedMvPattern,
      expectedTvPattern: scenario.expectedTvPattern,
      notes: scenario.notes,
      report,
    };
  });
  const packWithoutHash = {
    reportId: "morphology-physiology-audit-shadow-pack-v1" as const,
    mode: "shadow" as const,
    strictNormalBaselineEarned: false as const,
    generatedAt: "1970-01-01T00:00:00.000Z",
    summary: {
      scenarioCount: scenarios.length,
      allReportOnly: scenarios.every((scenario) => scenario.report.overall.finalDecision === "report-only"),
      noScenarioCanAffectGate: scenarios.every((scenario) => !scenario.report.overall.canAffectGate),
      artifactFailuresRemainVisible: scenarios.some((scenario) => scenario.report.overall.artifactGuard === "fail"),
      diseaseProfilesReportOnly: scenarios
        .filter((scenario) => scenario.profileId.endsWith("_report_only"))
        .every((scenario) => scenario.report.overall.finalDecision === "report-only"),
      lowPreloadDirectionalityReported: scenarios
        .find((scenario) => scenario.scenarioId === "normal-low-preload-e-reduced")
        ?.report.mvf?.profileExpectation.expectationIdsMet.includes("low-preload-directionality-met") ?? false,
    },
    scenarios,
  };
  return {
    ...packWithoutHash,
    normalizedSha256: hashNormalized(packWithoutHash),
  };
}

export function writeMorphologyPhysiologyAuditShadowPackV1():
MorphologyPhysiologyAuditShadowPackV1 & { readonly outPath: string } {
  const report = buildMorphologyPhysiologyAuditShadowPackV1();
  const outPath = path.resolve(process.cwd(), MORPHOLOGY_PHYSIOLOGY_AUDIT_SHADOW_PACK_PATH_V1);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return { ...report, outPath };
}

function reportForSamples(
  samples: readonly SimSample[],
  profileId: PhysiologyMorphologyProfileId,
  scenarioId: string,
  runId: string,
  overrides: Partial<MorphologyPhysiologyAuditInputV1> = {},
): MorphologyPhysiologyAuditReportV1 {
  return morphologyPhysiologyAuditReportFromSamples(samples, {
    profileId,
    scenarioId,
    runId,
    mode: "shadow",
    strictNormalBaselineEarned: false,
    ...overrides,
  });
}

function syntheticSamples(
  wave: WaveDefinition,
  tvWave: WaveDefinition = wave,
  options: { readonly forceClosedValveState?: boolean } = {},
): SimSample[] {
  const samples: SimSample[] = [];
  const beats = 3;
  const samplesPerBeat = 180;
  const beatSeconds = 0.8;
  for (let beat = 0; beat < beats; beat++) {
    for (let i = 0; i < samplesPerBeat; i++) {
      const theta = i / samplesPerBeat;
      const phi = beat + theta;
      const t = phi * beatSeconds;
      const qmv = flowAtTheta(theta, wave, 1);
      const qtv = flowAtTheta(theta, tvWave, 0.86);
      samples.push(baseSample({
        t,
        phi,
        QMV: qmv,
        QTV: qtv,
        LAP: 10 + 0.045 * Math.max(0, qmv),
        LVP: 8 + 0.005 * Math.max(0, qmv),
        RAP: 6 + 0.04 * Math.max(0, qtv),
        RVP: 4.5 + 0.004 * Math.max(0, qtv),
        xiMV: options.forceClosedValveState ? 0 : qmv > 2 ? 1 : 0,
        xiTV: options.forceClosedValveState ? 0 : qtv > 2 ? 1 : 0,
        dP_MV: 2 + 0.04 * Math.max(0, qmv),
        dP_TV: 1.5 + 0.04 * Math.max(0, qtv),
      }));
    }
  }
  return samples;
}

function flowAtTheta(theta: number, wave: WaveDefinition, scale: number): number {
  const e = wave.e * gaussian(theta, wave.eTheta, 0.045);
  const a = wave.a * gaussian(theta, wave.aTheta, 0.045);
  const l = (wave.l ?? 0) * gaussian(theta, wave.lTheta ?? 0.68, 0.05);
  const plateau = (wave.plateau ?? 0) * smoothBox(theta, 0.34, 0.84);
  const negative = -(wave.negative ?? 0) * gaussian(theta, 0.18, 0.04);
  const kink = wave.kink && Math.abs(theta - 0.39) < 0.008 ? wave.e * 0.7 : 0;
  return scale * (e + a + l + plateau + kink + negative);
}

function gaussian(theta: number, center: number, width: number): number {
  const d = circularDistance(theta, center);
  return Math.exp(-0.5 * (d / width) ** 2);
}

function smoothBox(theta: number, start: number, end: number): number {
  const left = 1 / (1 + Math.exp(-(theta - start) / 0.02));
  const right = 1 / (1 + Math.exp((theta - end) / 0.02));
  return left * right;
}

function circularDistance(theta: number, center: number): number {
  const delta = Math.abs(theta - center) % 1;
  return Math.min(delta, 1 - delta);
}

function baseSample(overrides: Partial<SimSample>): SimSample {
  return {
    t: 0,
    AoP: 90,
    PAP: 18,
    systemicArterialPressurePa: 90 * 133.322,
    downstreamPulmonaryArterialPressurePa: 18 * 133.322,
    LAP: 10,
    RAP: 6,
    LVP: 8,
    RVP: 4,
    QAo: 0,
    QPA: 0,
    QPV: 0,
    QMV: 0,
    QTV: 0,
    PVF: 0,
    SVF: 0,
    QCapSV: 0,
    QPArtPCap: 0,
    aorticRootToSystemicArteryFlowM3PerSec: 0,
    proximalPulmonaryArterialFlowM3PerSec: 0,
    QCorLAD: 0,
    QCorLCx: 0,
    QCorRCA: 0,
    QCorTotal: 0,
    QCS: 0,
    aorticRootComplianceM3PerPa: 0,
    pulmonaryRootComplianceM3PerPa: 0,
    VLV: 120,
    VRV: 130,
    VLA: 55,
    VRA: 60,
    VSystemicVenous: 2600,
    VPulmonaryVenous: 450,
    P_PVein: 9,
    phi: 0,
    aLV: 0,
    aRV: 0,
    aLA: 0,
    aRA: 0,
    cRA: 0,
    rLA: 0,
    rRA: 0,
    xiMV: 0,
    xiAoV: 0,
    xiTV: 0,
    xiPV: 0,
    dP_MV: 0,
    dP_AoV: 0,
    dP_TV: 0,
    dP_PV: 0,
    AoV_areaRatio: 0,
    AoV_loss_R: 0,
    AoV_loss_B: 0,
    AoV_loss_residual: 0,
    AoV_qNextPreDiode: 0,
    AoV_qNextPostDiode: 0,
    AoV_qNextPreFlowClamp: 0,
    AoV_qNextPostFlowClamp: 0,
    AoV_qDotPreDiode: 0,
    AoV_qDotPostDiode: 0,
    AoV_qDotPreFlowClamp: 0,
    AoV_qDotRaw: 0,
    AoV_qDotPost: 0,
    AoV_qDotClampHit01: 0,
    AoV_qDotClampImpulse: 0,
    AoV_diodeImpulse: 0,
    AoV_flowClampImpulse: 0,
    LVPressureFloorHit01: 0,
    RVPressureFloorHit01: 0,
    ELV_active: 0,
    ERV_active: 0,
    ELV_timeVarying: 0,
    ERV_timeVarying: 0,
    Pperi: 0,
    Ppc: 0,
    VHeart: 650,
    septumShiftMl: 0,
    VLVeff: 120,
    VRVeff: 130,
    PLVfw: 0,
    PRVfw: 0,
    PVI_LV: 0,
    PVI_RV: 0,
    septalForceMmHg: 0,
    PLADArt: 0,
    PLCxArt: 0,
    PRCAArt: 0,
    PCS: 0,
    PimLAD: 0,
    PimLCx: 0,
    PimRCA: 0,
    TBV: 5000,
    ...overrides,
  };
}

function hashNormalized(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = writeMorphologyPhysiologyAuditShadowPackV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    outPath: report.outPath,
    summary: report.summary,
  }, null, 2));
}
