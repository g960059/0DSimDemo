import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import protocolDescriptor from "@/data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
import { THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET } from "@/engine/myocardium/kinematics";
import {
  MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS,
  MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY,
  MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS,
  TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
  runMinimalLoadedAfterloadFamilyPhase3CReport,
} from "@/engine/myocardium/protocols/minimalLoadedAfterloadFamily";

const errors: string[] = [];
const report = runMinimalLoadedAfterloadFamilyPhase3CReport();

if (report.claimBoundary !== MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY) {
  errors.push(`Unexpected claimBoundary: ${report.claimBoundary}`);
}
if (report.evidenceStatus !== MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS) {
  errors.push(`Unexpected evidenceStatus: ${report.evidenceStatus}`);
}
if (report.experimentalTargets !== "deferred") {
  errors.push(`Experimental targets must be deferred, got ${report.experimentalTargets}`);
}
if (report.ownerAcceptanceStatus !== "not-owner-acceptance") {
  errors.push(`Owner acceptance must not be claimed, got ${report.ownerAcceptanceStatus}`);
}
if (report.phaseOwnerGateStatus !== "not-recorded") {
  errors.push(`Phase owner gate must not be recorded, got ${report.phaseOwnerGateStatus}`);
}
if (!report.closurePass) {
  errors.push("Phase 3C minimal loaded afterload-family closurePass=false");
}

const closureSections = report.sections.filter((section) => section.status !== "deferred-target");
if (closureSections.length !== 7) {
  errors.push(`Expected 7 closure sections, got ${closureSections.length}`);
}
for (const section of closureSections) {
  if (section.status !== "closure-pass") {
    errors.push(`${section.id} status=${section.status}`);
  }
}

const decisionIds = protocolDescriptor.pendingOwnerDecisions.map((decision) => decision.decisionId);
if (!sameOrderedSet(decisionIds, [4, 5, 6, 8, 10, 12, 19])) {
  errors.push(`Descriptor pending owner decisions must exactly equal 4,5,6,8,10,12,19, got ${decisionIds.join(",")}`);
}
if (!sameOrderedSet(protocolDescriptor.protocolSettings.memberIds, [...MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS])) {
  errors.push(`Descriptor memberIds must exactly match afterload-low,afterload-normal,afterload-high, got ${protocolDescriptor.protocolSettings.memberIds.join(",")}`);
}
const phase0DecisionIds = protocolDescriptor.phase0DecisionBoundary.map((decision) => decision.decisionId);
if (!sameOrderedSet(phase0DecisionIds, [14, 15])) {
  errors.push(`Decision 14/15 must be governance input only, got ${phase0DecisionIds.join(",")}`);
}
if (
  protocolDescriptor.phase0DecisionBoundary.some(
    (decision) => decision.status !== "Phase 0 accepted governance input",
  )
) {
  errors.push("Decision 14/15 entries must remain accepted governance input only");
}
if (protocolDescriptor.claimBoundary !== MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY) {
  errors.push(`Descriptor claimBoundary mismatch: ${protocolDescriptor.claimBoundary}`);
}
if (protocolDescriptor.evidenceStatus !== MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS) {
  errors.push(`Descriptor evidenceStatus mismatch: ${protocolDescriptor.evidenceStatus}`);
}
if (protocolDescriptor.protocolSettings.afterloadFlowLaw !== "bidirectional-linear-resistor") {
  errors.push(`Unexpected afterload flow law: ${protocolDescriptor.protocolSettings.afterloadFlowLaw}`);
}
if (protocolDescriptor.protocolSettings.phaseOwnerGateStatus !== "not-recorded") {
  errors.push(
    `Phase owner gate status must not be recorded, got ${protocolDescriptor.protocolSettings.phaseOwnerGateStatus}`,
  );
}

const expectedMemberIds = [...MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS];
const reportMemberIds = report.memberResults.map((member) => member.id);
if (!sameOrderedSet(reportMemberIds, expectedMemberIds)) {
  errors.push(`Unexpected member IDs: ${reportMemberIds.join(",")}`);
}
for (const error of verifyFamilyInvariant()) {
  errors.push(error);
}
for (const error of verifyResistorSamples()) {
  errors.push(error);
}
for (const error of verifyClaimBoundaryText()) {
  errors.push(error);
}
for (const error of scanBoundaryReferences(process.cwd())) {
  errors.push(error);
}

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error("myocardium Phase 3C minimal loaded afterload family FAIL");
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  const ordering = report.memberResults.map((member) =>
    `${member.id}:${member.metrics.peakAfterloadPressurePa.toFixed(3)}Pa`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 3C minimal loaded afterload family PASS checks=${closureSections.length} `
    + `claimBoundary=${report.claimBoundary} evidenceStatus=${report.evidenceStatus} `
    + `experimentalTargets=${report.experimentalTargets} summaryHash=${report.stableSummaryHash} `
    + `peakAfterloadOrdering=${ordering.join(",")}`,
  );
}

function verifyFamilyInvariant(): readonly string[] {
  const invariantErrors: string[] = [];
  const allowedParameterKeys = [
    "complianceM3PerPa",
    "initialAfterloadPressurePa",
    "resistancePaSecPerM3",
  ];
  const fixedSettings = report.familyMembers.map((member) => JSON.stringify(member.fixedProtocolSettings));
  if (new Set(fixedSettings).size !== 1) {
    invariantErrors.push("Family members must share identical fixed protocol settings");
  }
  if (report.familyMembers.some((member) => member.afterloadModelId !== TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID)) {
    invariantErrors.push("Family members must share the two-element afterload model ID");
  }
  for (const member of report.familyMembers) {
    const keys = Object.keys(member.parameters).sort();
    if (!sameOrderedSet(keys, allowedParameterKeys)) {
      invariantErrors.push(`${member.id} has unexpected afterload parameter keys: ${keys.join(",")}`);
    }
  }
  const afterloadParameterTuples = report.familyMembers.map((member) => JSON.stringify(member.parameters));
  if (new Set(afterloadParameterTuples).size !== report.familyMembers.length) {
    invariantErrors.push("Each family member must have distinct afterload parameters");
  }
  const familySection = report.sections.find((section) => section.id === "protocol-family-completion-v1");
  if (familySection?.metrics.memberDifferenceInvariant !== true) {
    invariantErrors.push("Report must assert memberDifferenceInvariant=true");
  }
  return invariantErrors;
}

function verifyResistorSamples(): readonly string[] {
  const sampleErrors: string[] = [];
  const minVolume = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.sweepCavityVolumeMinM3;
  const maxVolume = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.sweepCavityVolumeMaxM3;
  for (const member of report.memberResults) {
    const params = member.definition.parameters;
    if (!member.ok) {
      sampleErrors.push(`${member.id} failed: ${member.failureReason ?? "unknown"}`);
      continue;
    }
    for (const sample of member.samples) {
      const expectedFlow =
        (sample.internalPressurePa - sample.afterloadPressurePa) / params.resistancePaSecPerM3;
      const expectedVolume = sample.cavityVolumeM3 - sample.resistorFlowM3PerSec * sample.dtSec;
      const expectedAfterloadPressure =
        sample.afterloadPressurePa
        + (sample.resistorFlowM3PerSec * sample.dtSec) / params.complianceM3PerPa;
      if (!nearlyEqual(sample.resistorFlowM3PerSec, expectedFlow, 1e-15, 1e-12)) {
        sampleErrors.push(`${member.id} resistor flow mismatch at t=${sample.timeSec}`);
      }
      if (!nearlyEqual(sample.nextCavityVolumeM3, expectedVolume, 1e-15, 1e-12)) {
        sampleErrors.push(`${member.id} cavity volume update mismatch at t=${sample.timeSec}`);
      }
      if (!nearlyEqual(sample.nextAfterloadPressurePa, expectedAfterloadPressure, 1e-9, 1e-12)) {
        sampleErrors.push(`${member.id} afterload pressure update mismatch at t=${sample.timeSec}`);
      }
      if (
        sample.cavityVolumeM3 < minVolume
        || sample.cavityVolumeM3 > maxVolume
        || sample.nextCavityVolumeM3 < minVolume
        || sample.nextCavityVolumeM3 > maxVolume
      ) {
        sampleErrors.push(`${member.id} left Phase 3A volume domain at t=${sample.timeSec}`);
      }
    }
  }
  return sampleErrors;
}

function verifyClaimBoundaryText(): readonly string[] {
  const boundaryErrors: string[] = [];
  const descriptorText = JSON.stringify(protocolDescriptor);
  const reportText = JSON.stringify({
    claimBoundary: report.claimBoundary,
    evidenceStatus: report.evidenceStatus,
    experimentalTargets: report.experimentalTargets,
    ownerAcceptanceStatus: report.ownerAcceptanceStatus,
    phaseOwnerGateStatus: report.phaseOwnerGateStatus,
    modelIds: report.modelIds,
    fixedProtocolSettings: report.fixedProtocolSettings,
    familyMembers: report.familyMembers,
    memberMetrics: report.memberResults.map((member) => ({
      id: member.id,
      ok: member.ok,
      metrics: member.metrics,
      finalCavityVolumeM3: member.finalCavityVolumeM3,
      finalAfterloadPressurePa: member.finalAfterloadPressurePa,
    })),
  });
  const positivePassClaimPattern =
    /experimentalPass|tier[A-Z0-9]*Pass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass|ownerGOPass|ownerGatePass|downstreamPass|morphologyPass|production(?:Mechanics|Homogenization|Loaded)?Pass|singleChamberSolverPass|dynamicValveState|qDotClampState|tbvProjectionState/i;
  if (positivePassClaimPattern.test(descriptorText)) {
    boundaryErrors.push("Descriptor must not contain positive target, owner, production, or downstream pass fields");
  }
  if (positivePassClaimPattern.test(reportText)) {
    boundaryErrors.push("Report must not contain positive target, owner, production, or downstream pass fields");
  }
  const protocolSettings = protocolDescriptor.protocolSettings;
  const forbiddenEnabledSettings = [
    ["useDynamicValve", protocolSettings.useDynamicValve],
    ["useQDotClamp", protocolSettings.useQDotClamp],
    ["useTBVProjection", protocolSettings.useTBVProjection],
    ["useProductionMechanics", protocolSettings.useProductionMechanics],
    ["usePassiveLawAcceptance", protocolSettings.usePassiveLawAcceptance],
    ["useSeptalPericardialCoupling", protocolSettings.useSeptalPericardialCoupling],
    ["useClosedLoopSteadyState", protocolSettings.useClosedLoopSteadyState],
  ] as const;
  for (const [name, value] of forbiddenEnabledSettings) {
    if (value !== false) {
      boundaryErrors.push(`${name} must be false`);
    }
  }
  for (const [name, value] of Object.entries(protocolDescriptor.claimExclusions)) {
    if (value !== "not-claimed") {
      boundaryErrors.push(`claimExclusions.${name} must be not-claimed`);
    }
  }
  return boundaryErrors;
}

function scanBoundaryReferences(repoRoot: string): readonly string[] {
  const boundaryErrors: string[] = [];
  const phase3cEngineFile = path.join(repoRoot, "engine/myocardium/protocols/minimalLoadedAfterloadFamily.ts");
  const phase3cEngineText = readFileSync(phase3cEngineFile, "utf8");
  if (
    /\bfrom\s+["']@\/engine\/(?:ModelCore|chambers|harness|runtime|protocol|stateContract|core\/stateLayout)/m
      .test(phase3cEngineText)
  ) {
    boundaryErrors.push("Phase 3C artifact must not import ModelCore, chamber, runtime, schema, or protocol integration code");
  }
  if (/ActiveStressChamberModel|legacyActiveStress|oldActiveStress/.test(phase3cEngineText)) {
    boundaryErrors.push("Phase 3C artifact must not wire old active-stress code");
  }

  const integrationTargets = [
    path.join(repoRoot, "engine/ModelCore.ts"),
    path.join(repoRoot, "engine/chambers.ts"),
    path.join(repoRoot, "engine/harness.ts"),
    path.join(repoRoot, "engine/protocol.ts"),
    path.join(repoRoot, "engine/stateContract.ts"),
    path.join(repoRoot, "officialCases.ts"),
    path.join(repoRoot, "data/cases"),
    path.join(repoRoot, "public/cases"),
  ];
  const phase3cReferencePattern =
    /minimalLoadedAfterload|runMinimalLoadedAfterload|minimal-loaded-phase3c|afterload-family-phase3c|TWO_ELEMENT_AFTERLOAD_PHASE3C|minimal-loaded-afterload-family-smoke-only/;
  for (const target of integrationTargets) {
    if (!existsSync(target)) continue;
    for (const file of listFiles(target)) {
      const text = readFileSync(file, "utf8");
      if (phase3cReferencePattern.test(text)) {
        boundaryErrors.push(`Forbidden Phase 3C reference from runtime/case layer: ${path.relative(repoRoot, file)}`);
      }
    }
  }
  return boundaryErrors;
}

function listFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx|json)$/.test(target) ? [target] : [];
  const out: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|json)$/.test(entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}

function sameOrderedSet<T>(actual: readonly T[], expected: readonly T[]): boolean {
  return actual.length === expected.length && expected.every((value, index) => actual[index] === value);
}

function nearlyEqual(actual: number, expected: number, absoluteTolerance: number, relativeTolerance: number): boolean {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  return Math.abs(actual - expected) <= absoluteTolerance + relativeTolerance * scale;
}
