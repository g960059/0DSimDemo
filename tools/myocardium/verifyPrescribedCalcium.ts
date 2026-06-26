import {
  PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
  PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
  runPrescribedCalciumPhase2AProtocolReport,
} from "@/engine/myocardium/calcium";

const errors: string[] = [];
const report = runPrescribedCalciumPhase2AProtocolReport();

if (report.claimBoundary !== PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY) {
  errors.push(`Unexpected claimBoundary: ${report.claimBoundary}`);
}
if (report.evidenceStatus !== PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS) {
  errors.push(`Unexpected evidenceStatus: ${report.evidenceStatus}`);
}
if (report.experimentalTargets !== "deferred") {
  errors.push(`Experimental targets must be deferred, got ${report.experimentalTargets}`);
}
if (report.ownerAcceptanceStatus !== "not-owner-acceptance") {
  errors.push(`Owner acceptance must not be claimed, got ${report.ownerAcceptanceStatus}`);
}
if (!report.closurePass) {
  errors.push("Phase 2A prescribed calcium closurePass=false");
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

if (JSON.stringify(report).includes("experimentalPass")) {
  errors.push("Report must not contain experimentalPass claims");
}

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error("myocardium Phase 2A prescribed calcium FAIL");
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 2A prescribed calcium PASS checks=${closureSections.length} `
    + `claimBoundary=${report.claimBoundary} evidenceStatus=${report.evidenceStatus} `
    + `experimentalTargets=${report.experimentalTargets} summaryHash=${report.stableSummaryHash}`,
  );
}
