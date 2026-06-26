import protocolDescriptor from "@/data/myocardium/protocols/land2017-phase1c-source-protocols.json";
import { runLand2017Phase1CProtocolReport } from "@/engine/myocardium/myofilament/land2017";

const report = runLand2017Phase1CProtocolReport();
const errors: string[] = [];

if (report.claimBoundary !== "algorithmic-source-closure-only") {
  errors.push(`claimBoundary must be algorithmic-source-closure-only, got ${report.claimBoundary}`);
}
if (report.experimentalTargets !== "deferred") {
  errors.push(`experimentalTargets must be deferred, got ${report.experimentalTargets}`);
}
if (!report.closurePass) {
  const failing = report.sections
    .filter((section) => section.status === "closure-fail")
    .map((section) => section.id)
    .join(", ");
  errors.push(`closure sections failed: ${failing}`);
}
if (protocolDescriptor.deferredExperimentalTargets.length === 0) {
  errors.push("deferredExperimentalTargets must list the source-grounding gaps");
}
if (report.sections.some((section) => section.status === "deferred-target" && section.id !== "deferred-experimental-targets")) {
  errors.push("Only the explicit deferred target section may use deferred-target status");
}

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    `myocardium Phase 1C Land protocols FAIL checks=${report.sections.length} ` +
      `claimBoundary=${report.claimBoundary} experimentalTargets=${report.experimentalTargets}`,
  );
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 1C Land protocols PASS checks=${report.sections.length} ` +
      `claimBoundary=${report.claimBoundary} experimentalTargets=${report.experimentalTargets} ` +
      `summaryHash=${report.stableSummaryHash}`,
  );
}
