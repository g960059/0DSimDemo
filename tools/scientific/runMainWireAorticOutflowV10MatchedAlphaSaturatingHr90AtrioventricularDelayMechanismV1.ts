import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1";
import { MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayBracketV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const outputPath = optionalArgument("--output");
const runs =
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.map(
    (profileId, index) => {
      process.stderr.write(
        `[${index + 1}/${MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.length}] ${profileId}\n`,
      );
      return runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1(
        { dtSec: 60 / 90 / 2_000, maximumBeatCount: 72 },
        profileId,
      );
    },
  );
const analysis =
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1(
    runs,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  execution: Object.freeze({
    heartRateBpm: 90 as const,
    stepsPerCycle: 2_000 as const,
    role: "primary-cycle-over-2000-characterization" as const,
    maximumBeatCount: 72 as const,
    initialization: "independent-canonical-cold-start-per-arm" as const,
  }),
  exactIdentities: Object.freeze(
    runs.map((run) =>
      Object.freeze({
        profileId: run.atrioventricularDelayBracketProfile.profileId,
        protocolIdentityHash: run.periodicResult.protocolIdentityHash,
        protocolComponentHashes: run.periodicResult.protocolComponentHashes,
        exactAssemblyAudit: run.exactAssemblyAudit,
        runnerClaim: run.claim,
      }),
    ),
  ),
  analysis,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

let resolvedOutputPath: string | null = null;
if (outputPath !== null) {
  resolvedOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, serialized, "utf8");
}

process.stdout.write(
  `${JSON.stringify({
    methodId: analysis.methodId,
    outputPath: resolvedOutputPath,
    byteLength: Buffer.byteLength(serialized),
    allArmsInterpretationEligible: analysis.allArmsInterpretationEligible,
    exactIsolation: {
      controlCalciumParamsIdentityReusedExactly:
        analysis.controlCalciumParamsIdentityReusedExactly,
      allReferenceNonCalciumAssemblyIdentitiesExact:
        analysis.allReferenceNonCalciumAssemblyIdentitiesExact,
      allNonCalciumExactAssemblyAuditHashesIdentical:
        analysis.allNonCalciumExactAssemblyAuditHashesIdentical,
      allCalciumDriveHashesDistinct: analysis.allCalciumDriveHashesDistinct,
      allProtocolIdentityHashesDistinct:
        analysis.allProtocolIdentityHashesDistinct,
    },
    anyCandidateNewFusionOrUnresolved:
      analysis.anyCandidateNewFusionOrUnresolved,
    anyCandidateNewCategoricalAReadbackLoss:
      analysis.anyCandidateNewCategoricalAReadbackLoss,
    allShorterDelayArmsShortenFlowDerivedCanonicalIct:
      analysis.allShorterDelayArmsShortenFlowDerivedCanonicalIct,
    delay100NonEquivalentCopenhagenReferenceOverlayCorrectedIctMs:
      analysis.delay100NonEquivalentCopenhagenReferenceOverlayCorrectedIctSec *
      1_000,
    arms: analysis.armsInCatalogOrder.map((arm) => ({
      profileId: arm.profile.profileId,
      atrioventricularDelayMs: arm.profile.atrioventricularDelaySec * 1_000,
      completedBeatCount: arm.ledger.completedBeatCount,
      interpretationEligible: arm.ledger.interpretationEligible,
      metrics: arm.metrics,
      controlRelativeDelta: arm.controlRelativeDelta,
      mvcToCalciumShareOfIctShortening01:
        analysis.allArmsInterpretationEligible &&
        arm.controlRelativeDelta.canonicalIctSec !== 0
          ? arm.controlRelativeDelta.mvcToCalciumRiseSignedSec! /
            arm.controlRelativeDelta.canonicalIctSec!
          : null,
      aWaveFlags: arm.aWaveFlags,
    })),
  })}\n`,
);

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(`${name}=`),
  );
  if (equalsArgument !== undefined) {
    const value = equalsArgument.slice(name.length + 1);
    if (value === "") throw new Error(`${name} requires a value`);
    return value;
  }
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
