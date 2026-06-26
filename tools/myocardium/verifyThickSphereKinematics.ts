import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import protocolDescriptor from "@/data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json";
import {
  THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY,
  THICK_SPHERE_PHASE3A_EVIDENCE_STATUS,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  computeThickSphereSpikeParameterSetStableHash,
  runThickSpherePhase3AKinematicsReport,
} from "@/engine/myocardium/kinematics";

const errors: string[] = [];
const report = runThickSpherePhase3AKinematicsReport();

if (report.claimBoundary !== THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY) {
  errors.push(`Unexpected claimBoundary: ${report.claimBoundary}`);
}
if (report.evidenceStatus !== THICK_SPHERE_PHASE3A_EVIDENCE_STATUS) {
  errors.push(`Unexpected evidenceStatus: ${report.evidenceStatus}`);
}
if (report.experimentalTargets !== "deferred") {
  errors.push(`Experimental targets must be deferred, got ${report.experimentalTargets}`);
}
if (report.ownerAcceptanceStatus !== "not-owner-acceptance") {
  errors.push(`Owner acceptance must not be claimed, got ${report.ownerAcceptanceStatus}`);
}
if (!report.closurePass) {
  errors.push("Phase 3A thick-sphere kinematics closurePass=false");
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
if (!decisionIds.includes(5) || !decisionIds.includes(19)) {
  errors.push(`Descriptor must include pending owner Decisions 5 and 19, got ${decisionIds.join(",")}`);
}
if (protocolDescriptor.claimBoundary !== THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY) {
  errors.push(`Descriptor claimBoundary mismatch: ${protocolDescriptor.claimBoundary}`);
}
if (protocolDescriptor.evidenceStatus !== THICK_SPHERE_PHASE3A_EVIDENCE_STATUS) {
  errors.push(`Descriptor evidenceStatus mismatch: ${protocolDescriptor.evidenceStatus}`);
}
if (protocolDescriptor.midwallConvention.id !== "arithmetic-mean-midwall-phase3a-only") {
  errors.push(`Unexpected midwall convention: ${protocolDescriptor.midwallConvention.id}`);
}

const reportText = JSON.stringify(report);
if (/experimentalPass/i.test(reportText)) {
  errors.push("Report must not contain experimentalPass claims");
}
if (
  /(tier[A-Z0-9]*Pass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass|productionMechanicsPass|loadedPressurePass|chamberPass|valvePass|qDotPass|homogenizationPass|generalizedForcePass)/i
    .test(reportText)
) {
  errors.push("Report must not contain target, owner-acceptance, fit, validation, production, or downstream pass fields");
}

const descriptorText = JSON.stringify(protocolDescriptor);
if (/experimentalPass|acceptedTarget|acceptedThreshold|acceptancePass/i.test(descriptorText)) {
  errors.push("Descriptor must not contain experimental or owner-acceptance pass fields");
}
if (protocolDescriptor.candidateParameterProvenance.fitToPVLoop !== false) {
  errors.push("Candidate parameter provenance must state fitToPVLoop=false");
}

const parameterSetHash = computeThickSphereSpikeParameterSetStableHash();
if (THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash !== parameterSetHash) {
  errors.push(
    `Candidate parameter hash mismatch: `
    + `${THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash} != ${parameterSetHash}`,
  );
}
const replay = runThickSpherePhase3AKinematicsReport();
if (report.stableSummaryHash !== replay.stableSummaryHash) {
  errors.push(`Report summary hash is not deterministic: ${report.stableSummaryHash} != ${replay.stableSummaryHash}`);
}

for (const error of scanBoundaryReferences(process.cwd())) {
  errors.push(error);
}

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error("myocardium Phase 3A thick-sphere kinematics FAIL");
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 3A thick-sphere kinematics PASS checks=${closureSections.length} `
    + `claimBoundary=${report.claimBoundary} evidenceStatus=${report.evidenceStatus} `
    + `experimentalTargets=${report.experimentalTargets} summaryHash=${report.stableSummaryHash} `
    + `parameterSetHash=${report.parameterSet.parameterSetStableHash}`,
  );
}

function scanBoundaryReferences(repoRoot: string): readonly string[] {
  const boundaryErrors: string[] = [];
  const kinematicsRoot = path.join(repoRoot, "engine/myocardium/kinematics");
  for (const file of listFiles(kinematicsRoot)) {
    const text = readFileSync(file, "utf8");
    if (/^import\s+.*(?:engine\/ModelCore|engine\/chambers|myofilament\/land2017|homogenization|generalized-force|generalizedForce)/m.test(text)) {
      boundaryErrors.push(`Forbidden import in kinematics artifact: ${path.relative(repoRoot, file)}`);
    }
  }

  const integrationTargets = [
    path.join(repoRoot, "engine/ModelCore.ts"),
    path.join(repoRoot, "engine/chambers.ts"),
    path.join(repoRoot, "engine/myocardium/myofilament/land2017"),
    path.join(repoRoot, "engine/myocardium/homogenization"),
    path.join(repoRoot, "engine/myocardium/generalized-force"),
    path.join(repoRoot, "engine/myocardium/generalizedForce"),
  ];
  const phase3ReferencePattern =
    /thickSpherePhase3A|runThickSpherePhase3A|thick-sphere-phase3a|ThickSphereSpikeV1|thickSphereSpikeV1/;
  for (const target of integrationTargets) {
    if (!existsSync(target)) continue;
    for (const file of listFiles(target)) {
      const text = readFileSync(file, "utf8");
      if (phase3ReferencePattern.test(text)) {
        boundaryErrors.push(`Forbidden Phase 3A kinematics reference from integration/source layer: ${path.relative(repoRoot, file)}`);
      }
    }
  }

  return boundaryErrors;
}

function listFiles(target: string): string[] {
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx)$/.test(target) ? [target] : [];
  const out: string[] = [];
  const entries = readdirSync(target, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}
