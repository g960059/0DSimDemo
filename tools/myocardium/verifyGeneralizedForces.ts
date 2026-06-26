import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import protocolDescriptor from "@/data/myocardium/protocols/identity-force-phase3b-protocols.json";
import {
  IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY,
  IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS,
  runIdentityForcePhase3BReport,
} from "@/engine/myocardium/mechanics/identityForcePhase3BReport";

const errors: string[] = [];
const report = runIdentityForcePhase3BReport();

if (report.claimBoundary !== IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY) {
  errors.push(`Unexpected claimBoundary: ${report.claimBoundary}`);
}
if (report.evidenceStatus !== IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS) {
  errors.push(`Unexpected evidenceStatus: ${report.evidenceStatus}`);
}
if (report.experimentalTargets !== "deferred") {
  errors.push(`Experimental targets must be deferred, got ${report.experimentalTargets}`);
}
if (report.ownerAcceptanceStatus !== "not-owner-acceptance") {
  errors.push(`Owner acceptance must not be claimed, got ${report.ownerAcceptanceStatus}`);
}
if (!report.closurePass) {
  errors.push("Phase 3B generalized-force closurePass=false");
}

const closureSections = report.sections.filter((section) => section.status !== "deferred-target");
if (closureSections.length !== 8) {
  errors.push(`Expected 8 closure sections, got ${closureSections.length}`);
}
for (const section of closureSections) {
  if (section.status !== "closure-pass") {
    errors.push(`${section.id} status=${section.status}`);
  }
}

const decisionIds = protocolDescriptor.pendingOwnerDecisions.map((decision) => decision.decisionId);
for (const requiredDecisionId of [4, 5, 6, 8, 19]) {
  if (!decisionIds.includes(requiredDecisionId)) {
    errors.push(`Descriptor must include pending owner Decision ${requiredDecisionId}`);
  }
}
if (protocolDescriptor.claimBoundary !== IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY) {
  errors.push(`Descriptor claimBoundary mismatch: ${protocolDescriptor.claimBoundary}`);
}
if (protocolDescriptor.evidenceStatus !== IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS) {
  errors.push(`Descriptor evidenceStatus mismatch: ${protocolDescriptor.evidenceStatus}`);
}
if (protocolDescriptor.ownerAcceptanceStatus !== "not-owner-acceptance") {
  errors.push(`Descriptor ownerAcceptanceStatus mismatch: ${protocolDescriptor.ownerAcceptanceStatus}`);
}

const reportText = JSON.stringify(report);
const descriptorText = JSON.stringify(protocolDescriptor);
const positivePassClaimPattern =
  /experimentalPass|tier[A-Z0-9]*Pass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass|production(?:Homogenization|Mechanics)Pass|loaded(?:Afterload|Pressure)?Pass|chamber(?:Runtime|Integration)?Pass|valvePass|qDotPass|tbvProjectionPass|morphologyPass/i;
if (positivePassClaimPattern.test(reportText)) {
  errors.push("Report must not contain experimental, target, fit, validation, production, loaded, or runtime pass fields");
}
if (positivePassClaimPattern.test(descriptorText)) {
  errors.push("Descriptor must not contain experimental, target, fit, validation, production, loaded, or runtime pass fields");
}
if (protocolDescriptor.claimExclusions.ownerAcceptance !== "not-claimed") {
  errors.push("Descriptor owner acceptance exclusion must remain not-claimed");
}

for (const error of scanBoundaryReferences(process.cwd())) {
  errors.push(error);
}

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error("myocardium Phase 3B generalized forces FAIL");
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 3B generalized forces PASS checks=${closureSections.length} `
    + `claimBoundary=${report.claimBoundary} evidenceStatus=${report.evidenceStatus} `
    + `experimentalTargets=${report.experimentalTargets} summaryHash=${report.stableSummaryHash}`,
  );
}

function scanBoundaryReferences(repoRoot: string): readonly string[] {
  const boundaryErrors: string[] = [];
  const enginePhase3BRoots = [
    path.join(repoRoot, "engine/myocardium/homogenization"),
    path.join(repoRoot, "engine/myocardium/mechanics"),
  ];
  for (const root of enginePhase3BRoots) {
    for (const file of listFiles(root)) {
      const text = readFileSync(file, "utf8");
      if (
        /^import\s+(?!type\b).*(@\/)?engine\/(?:ModelCore|chambers|myocardium\/protocols|myocardium\/myofilament\/land2017\/(?:equations|solver|residual|jacobian|outputs|protocols))/m
          .test(text)
      ) {
        boundaryErrors.push(`Forbidden runtime/Land implementation import in Phase 3B engine artifact: ${path.relative(repoRoot, file)}`);
      }
      if (/ThickSphereSpikeV1|thickSphereSpikeV1|thick-sphere-phase3a/.test(text) && file.includes("/engine/myocardium/mechanics/virtualPowerNominalEngineeringV1.ts")) {
        boundaryErrors.push(`Generalized-force engine must not depend on concrete Phase 3A kinematics model: ${path.relative(repoRoot, file)}`);
      }
    }
  }

  const integrationTargets = [
    path.join(repoRoot, "engine/ModelCore.ts"),
    path.join(repoRoot, "engine/chambers.ts"),
    path.join(repoRoot, "engine/harness.ts"),
    path.join(repoRoot, "engine/myocardium/myofilament/land2017"),
  ];
  const phase3BReferencePattern =
    /identityForcePhase3B|runIdentityForcePhase3B|identity-force-phase3b|IdentityFiberNominalV1|VirtualPowerNominalEngineeringV1|identity-fiber-nominal-v1|virtual-power-nominal-engineering-v1/;
  for (const target of integrationTargets) {
    if (!existsSync(target)) continue;
    for (const file of listFiles(target)) {
      const text = readFileSync(file, "utf8");
      if (phase3BReferencePattern.test(text)) {
        boundaryErrors.push(`Forbidden Phase 3B reference from integration/source layer: ${path.relative(repoRoot, file)}`);
      }
    }
  }

  return boundaryErrors;
}

function listFiles(target: string): string[] {
  if (!existsSync(target)) return [];
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
