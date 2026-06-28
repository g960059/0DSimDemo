import { describe, expect, it } from "vitest";
import {
  loadArterialLoadZcReflectionComparatorValidationInput,
  validateArterialLoadZcReflectionComparatorReadiness,
  type ArterialLoadZcReflectionComparatorValidationInput,
} from "@/tools/myocardium/verifyArterialLoadZcReflectionComparatorReadiness";

const baseValidationInput =
  loadArterialLoadZcReflectionComparatorValidationInput(process.cwd());

describe("PV-loop arterial-load Zc/reflection comparator readiness boundary", () => {
  it("passes the current docs/data artifacts without runtime, default, official-case, or package-script wiring", () => {
    const input = fixture();
    const validation = validateArterialLoadZcReflectionComparatorReadiness(input);

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.summary.protocolId).toBe("arterial-load-zc-reflection-comparator-v1");
    expect(input.protocol.runtimeBoundary).toMatchObject({
      implementationStatus: "not-implemented",
      comparatorActivation: "off-by-default",
      defaultRuntimeWiring: "forbidden",
      officialCaseWiring: "forbidden",
      packageScriptWiring: "forbidden",
      signalAvailabilityChange: "forbidden",
    });
    expect(input.protocol.claimExclusions).toMatchObject({
      officialMorphologyPass: "not-claimed",
      productionMorphologyPass: "not-claimed",
      noProductionDefaultAcceptedOfficialMorphologyPassClaims: true,
    });
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "index.tsx")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "WorkbenchPage.tsx")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "components/Charts.tsx")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => (
      file.path === "tools/myocardium/verifyPvLoopMorphologyQuality.ts"
    ))).toBe(true);
  });

  it("preserves PR #181-base evidence as non-acceptance context and no runtime hypothesis promotion", () => {
    const snapshot = fixture().protocol.pr181BaseEvidenceSnapshot;
    const observations = Object.fromEntries(
      snapshot.observations.map((entry: any) => [entry.metric, entry]),
    );

    expect(snapshot.source).toBe("PR #181-base");
    expect(snapshot.snapshotRole).toBe("historical-non-acceptance-context");
    expect(snapshot.acceptanceStatus).toBe("non-acceptance-context");
    expect(snapshot.provenance).toMatchObject({
      baseCommit: "543b74434bbb42de629cccb760153ddcc06407ee",
      runnerCommand: "npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=artifacts/myocardium/pv-loop-morphology/zc-reflection-baseline-2026-06-28",
      summaryArtifactPath: "artifacts/myocardium/pv-loop-morphology/zc-reflection-baseline-2026-06-28/summary.json",
      summarySha256: "0c6c3c52a7799f8df712b76de4a3be0399089c251a4ed4e389a7353e78dcb1e4",
    });
    expect(observations.maxRawCoreSquareness).toMatchObject({
      value: 0.328,
      comparison: "less-than",
      threshold: 0.55,
    });
    expect(observations.maxRawCorePlateau).toMatchObject({
      value: 0.229,
      comparison: "less-than",
      threshold: 0.45,
    });
    expect(observations.minRawCoreIncisuraScore).toMatchObject({
      value: 0.188,
      comparison: "greater-than",
      threshold: 0.1,
    });
    expect(snapshot.runnerEmissionSnapshot).toMatchObject({
      arterialLoadStructureHypothesis: "not-emitted",
      zcReflectionHandoff: "ejection-limb-arterial-load-signal-gap-only",
    });
  });

  it("keeps current Zc/reflection unavailable/no-proxy and blocks field-only hypothesis promotion", () => {
    const boundary = fixture().protocol.currentRuntimeSignalBoundary;

    expect(boundary.status).toBe("zc-reflection-unavailable-no-proxy");
    expect(boundary.futureCandidateFieldPolicy)
      .toBe("future-candidate-fields-alone-must-not-promote-hypotheses");
    expect(boundary.interpretabilityGate)
      .toBe("comparative-raw-vs-resampled-metrics-plus-anti-gaming-readouts");
    expect(boundary.notModeledSignals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "characteristicImpedancePaSecPerM3",
        boundary: "unavailable-no-proxy",
        proxyPolicy: "forbidden",
      }),
      expect.objectContaining({
        name: "arterialReflectionCoefficient",
        boundary: "unavailable-no-proxy",
        proxyPolicy: "forbidden",
      }),
    ]));
  });

  it("requires raw-vs-resampled evidence and anti-gaming output/work/pressure/duration/reverse-volume/clamp readouts", () => {
    const requirements = fixture().protocol.futureComparatorRequirements;
    const readoutNames = requirements.antiGamingReadouts.map((entry: any) => entry.name);

    expect(requirements.activation).toMatchObject({
      mode: "off-by-default",
      defaultEnabled: false,
      requiresExplicitDiagnosticInvocation: true,
      noOfficialCaseDefaultRuntimeWiring: true,
      noPackageJsonScript: true,
    });
    expect(requirements.evidence).toMatchObject({
      rawBeforeResampled: true,
      comparativeRawVsResampledRequired: true,
      transitionInclusiveAndExcludedRequired: true,
    });
    expect(readoutNames).toEqual(expect.arrayContaining([
      "strokeVolumeM3",
      "cardiacOutputM3PerSec",
      "strokeWorkJ",
      "peakPressurePa",
      "ejectionDurationSec",
      "semilunarReverseVolumeM3",
      "qDotClampHitFraction",
    ]));
  });

  it("rejects comparator-specific runtime, default, official-case, and package-script wiring", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      ...input.runtimeIntegrationFiles,
      {
        path: "engine/ModelCore.ts",
        text: "const arterialLoadZcReflectionComparator = true;",
      },
      {
        path: "index.tsx",
        text: "const wired = 'ZcReflectionComparator';",
      },
      {
        path: "tools/myocardium/verifyPvLoopMorphologyQuality.ts",
        text: "signalAvailability().arterialLoadZcReflectionComparator = true;",
      },
      {
        path: "officialCases.ts",
        text: "case.meta.tags.push('arterial-load-zc-reflection-comparator-v1');",
      },
    ];
    input.packageJsonText = JSON.stringify({
      scripts: {
        "verify:myocardium-arterial-load-zc-reflection-comparator-readiness":
          "vite-node tools/myocardium/verifyArterialLoadZcReflectionComparatorReadiness.ts",
        "verify:unrelated-existing-script": "vite-node tools/myocardium/verifyPhase0.ts",
      },
    });

    const validation = validateArterialLoadZcReflectionComparatorReadiness(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("zc_reflection_runtime_leak");
    expect(codes).toContain("zc_reflection_package_script_leak");
  });

  it("rejects forbidden production/default/accepted/official morphology pass claims", () => {
    const input = fixture();
    input.protocol.claimExclusions.officialMorphologyPass = "accepted";
    input.protocol.claimExclusions.defaultRuntimeAdoption = "claimed";
    input.protocol.purpose = "The comparator is runtime wired.";
    input.docs = input.docs.map((doc) => (
      doc.path.endsWith("arterial-load-zc-reflection-comparator-v1.md")
        ? {
            ...doc,
            text: `${doc.text}\n\nThis boundary is not implementation. This comparator is production ready and official morphology pass accepted.\n`,
          }
        : doc.path.endsWith("README.md")
        ? {
            ...doc,
            text: `${doc.text}\n\nThis comparator is official case ready.\n`,
          }
        : doc
    ));

    const validation = validateArterialLoadZcReflectionComparatorReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("zc_reflection_forbidden_claim");
  });

  it("rejects missing evidence snapshot, no-proxy, off-by-default, raw-vs-resampled, and anti-gaming boundaries", () => {
    const input = fixture();
    input.protocol.pr181BaseEvidenceSnapshot.observations =
      input.protocol.pr181BaseEvidenceSnapshot.observations.filter((entry: any) => (
        entry.metric !== "maxRawCoreSquareness"
      ));
    input.protocol.pr181BaseEvidenceSnapshot.runnerEmissionSnapshot.arterialLoadStructureHypothesis = "emitted";
    input.protocol.currentRuntimeSignalBoundary.notModeledSignals =
      input.protocol.currentRuntimeSignalBoundary.notModeledSignals.filter((entry: any) => (
        entry.name !== "arterialReflectionCoefficient"
      ));
    input.protocol.currentRuntimeSignalBoundary.futureCandidateFieldPolicy = "candidate-fields-promote-hypotheses";
    input.protocol.futureComparatorRequirements.activation.defaultEnabled = true;
    input.protocol.futureComparatorRequirements.evidence.comparativeRawVsResampledRequired = false;
    input.protocol.futureComparatorRequirements.antiGamingReadouts =
      input.protocol.futureComparatorRequirements.antiGamingReadouts.filter((entry: any) => (
        entry.name !== "qDotClampHitFraction"
      ));

    const validation = validateArterialLoadZcReflectionComparatorReadiness(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("zc_reflection_evidence_snapshot");
    expect(codes).toContain("zc_reflection_no_proxy_boundary");
    expect(codes).toContain("zc_reflection_off_by_default");
    expect(codes).toContain("zc_reflection_raw_resampled_boundary");
    expect(codes).toContain("zc_reflection_anti_gaming_readouts");
  });
});

function fixture(): MutableValidationInput {
  return structuredClone(baseValidationInput) as MutableValidationInput;
}

type MutableValidationInput = ArterialLoadZcReflectionComparatorValidationInput & {
  protocol: any;
  docs: any[];
  runtimeIntegrationFiles: any[];
  packageJsonText: string;
};
