import resultArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json";
import { ModelCore } from "@/engine/ModelCore";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import { validateDeveloperOnlyLvLandRuntimeFlagRfc } from "@/tools/myocardium/verifyDeveloperOnlyLvLandRuntimeFlagRfc";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5U developer-only LV Land runtime flag RFC", () => {
  it("records an RFC-only artifact with owner decision still required", () => {
    expect(resultArtifact.id).toBe("myocardium-developer-only-lv-land-runtime-flag-rfc-v1");
    expect(resultArtifact.phase).toBe("Phase 5U");
    expect(resultArtifact.claimBoundary).toBe("developer-only-runtime-flag-rfc-no-runtime-wiring");
    expect(resultArtifact.ownerDecision.status).toBe("rfc-draft-owner-decision-needed");
    expect(resultArtifact.ownerDecision.accepted).toBe(false);
    expect(resultArtifact.implementationStatus.productionRuntimeWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.officialCaseWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.workbenchRuntimeWiring).toBe("absent");
    expect(resultArtifact.implementationStatus.stateSchemaMigration).toBe("absent");
  });

  it("requires an explicit non-production acknowledgement before creating options", () => {
    expect(() =>
      createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
        acknowledgement: "wrong" as typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
      })).toThrow(/non-production acknowledgement/);
  });

  it("creates an LV-only experimental provider visible through ModelCore debug ids", () => {
    const flag = createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
      acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
    });
    const core = new ModelCore(undefined, flag.experimentalOptions);

    expect(flag.claimBoundary).toBe("developer-only-rfc-helper-not-production-runtime");
    expect(flag.sourceProviderScope).toBe("LV-only");
    expect(flag.commitScheme).toBe("BE");
    expect(flag.calciumMapping.scenarioId).toBe("phase2b-absolute-peak-ca");
    expect(core.debugExperimentalActiveSourceProviderIds()).toEqual({ LV: flag.sourceProviderId });
    expect(Object.keys(core.debugExperimentalActiveSourceProviderStates())).toEqual(["LV"]);
  });

  it("passes the live verifier", () => {
    const report = validateDeveloperOnlyLvLandRuntimeFlagRfc(process.cwd());

    expect(report.errors).toEqual([]);
    expect(report.pass).toBe(true);
    expect(report.warnings.map((warning) => warning.code))
      .toContain("phase5u_rfc_only_owner_decision_needed");
  });
});
