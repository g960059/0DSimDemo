import {
  CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY,
  CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS,
  runCalciumLandIsometricPhase2BReport,
} from "@/engine/myocardium/protocols/calciumLandIsometric";

const errors: string[] = [];
const report = runCalciumLandIsometricPhase2BReport();

if (report.claimBoundary !== CALCIUM_LAND_ISOMETRIC_PHASE2B_CLAIM_BOUNDARY) {
  errors.push(`Unexpected claimBoundary: ${report.claimBoundary}`);
}
if (report.evidenceStatus !== CALCIUM_LAND_ISOMETRIC_PHASE2B_EVIDENCE_STATUS) {
  errors.push(`Unexpected evidenceStatus: ${report.evidenceStatus}`);
}
if (report.experimentalTargets !== "deferred") {
  errors.push(`Experimental targets must be deferred, got ${report.experimentalTargets}`);
}
if (report.ownerAcceptanceStatus !== "not-owner-acceptance") {
  errors.push(`Owner acceptance must not be claimed, got ${report.ownerAcceptanceStatus}`);
}
if (!report.closurePass) {
  errors.push("Phase 2B isometric Ca+Land closurePass=false");
}

const closureSections = report.sections.filter((section) => section.status !== "deferred-target");
if (closureSections.length !== 5) {
  errors.push(`Expected 5 closure sections, got ${closureSections.length}`);
}
for (const section of closureSections) {
  if (section.status !== "closure-pass") {
    errors.push(`${section.id} status=${section.status}`);
  }
}

const reportText = JSON.stringify(report);
if (/experimentalPass/.test(reportText)) {
  errors.push("Report must not contain experimentalPass claims");
}
if (/(tierC1Pass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass)/i.test(reportText)) {
  errors.push("Report must not contain Tier C1 pass or target-acceptance fields");
}
if (/(LVP|pressure|valve|qDot|loadedPressure|generalizedForces)/i.test(reportText)) {
  errors.push("Report must not contain loaded pressure, valve, qDot, or generalized-force fields");
}

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error("myocardium Phase 2B isometric Ca+Land FAIL");
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 2B isometric Ca+Land PASS checks=${closureSections.length} `
    + `claimBoundary=${report.claimBoundary} evidenceStatus=${report.evidenceStatus} `
    + `experimentalTargets=${report.experimentalTargets} summaryHash=${report.stableSummaryHash}`,
  );
}
