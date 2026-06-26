import protocolDescriptor from "@/data/myocardium/protocols/calcium-land-phase2c-prescribed-shortening-protocols.json";
import {
  CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY,
  CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS,
  runCalciumLandPrescribedShorteningPhase2CReport,
} from "@/engine/myocardium/protocols/calciumLandPrescribedShortening";

const errors: string[] = [];
const report = runCalciumLandPrescribedShorteningPhase2CReport();

if (report.claimBoundary !== CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_CLAIM_BOUNDARY) {
  errors.push(`Unexpected claimBoundary: ${report.claimBoundary}`);
}
if (report.evidenceStatus !== CALCIUM_LAND_PRESCRIBED_SHORTENING_PHASE2C_EVIDENCE_STATUS) {
  errors.push(`Unexpected evidenceStatus: ${report.evidenceStatus}`);
}
if (report.experimentalTargets !== "deferred") {
  errors.push(`Experimental targets must be deferred, got ${report.experimentalTargets}`);
}
if (report.ownerAcceptanceStatus !== "not-owner-acceptance") {
  errors.push(`Owner acceptance must not be claimed, got ${report.ownerAcceptanceStatus}`);
}
if (!report.closurePass) {
  errors.push("Phase 2C prescribed shortening closurePass=false");
}

const closureSections = report.sections.filter((section) => section.status !== "deferred-target");
if (closureSections.length !== 6) {
  errors.push(`Expected 6 closure sections, got ${closureSections.length}`);
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
if (JSON.stringify(protocolDescriptor).includes("calcium-land-phase2b-isometric-protocols-v1")) {
  errors.push("Phase 2C descriptor must not depend on the Phase 2B isometric protocol descriptor");
}
if (/(tierC2Pass|tierPass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass)/i.test(reportText)) {
  errors.push("Report must not contain Tier C2 pass or target-acceptance fields");
}
if (
  /\b(?:LV|RV|chamber|loaded|loadedPressure|pressure|valve|qDot|homogenization|generalizedForces?)\b|free-wall|(?:lv|rv)?freeWall/i
    .test(reportText)
) {
  errors.push("Report must not contain chamber, loaded-system, valve, qDot, homogenization, or generalized-force fields");
}

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error("myocardium Phase 2C prescribed shortening FAIL");
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 2C prescribed shortening PASS checks=${closureSections.length} `
    + `claimBoundary=${report.claimBoundary} evidenceStatus=${report.evidenceStatus} `
    + `experimentalTargets=${report.experimentalTargets} summaryHash=${report.stableSummaryHash} `
    + `trajectoryProvenanceHash=${report.trajectoryFamily.trajectoryProvenanceHash}`,
  );
}
