import { beforeAll, describe, expect, it } from "vitest";

import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  buildMainWireStandard70BaselineLocalProposalSourceV1,
  MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_SOURCE_V1_ID,
  type MainWireStandard70BaselineLocalProposalSourceArtifactsV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineLocalProposalSourceV1";
import {
  buildMainWireBaselineConditioningSyntheticArtifactsV1,
} from "@/__tests__/fixtures/mainWireBaselineConditioningSyntheticFixtureV1";

type SyntheticArtifactsV1 = Awaited<ReturnType<
  typeof buildMainWireBaselineConditioningSyntheticArtifactsV1
>>;

let supported: SyntheticArtifactsV1;
let deficient: SyntheticArtifactsV1;

beforeAll(async () => {
  [supported, deficient] = await Promise.all([
    buildMainWireBaselineConditioningSyntheticArtifactsV1(1.02),
    buildMainWireBaselineConditioningSyntheticArtifactsV1(-1),
  ]);
});

describe("Standard70 local proposal source adapter", () => {
  it("reconstructs and compacts the admitted rest-HR60 source chain", async () => {
    const source = await buildMainWireStandard70BaselineLocalProposalSourceV1(
      serializedArtifactsV1(supported),
    );

    expect(source.sourceId).toBe(
      MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_SOURCE_V1_ID,
    );
    expect(source.sourceIdentitySha256).toMatch(/^[0-9a-f]{64}$/);
    expect(source.provenance.refinedArtifactIdentitySha256).toBe(
      await sha256CanonicalJsonHex(supported.refined),
    );
    expect(source.provenance.stageArtifactIdentitySha256).toBe(
      await sha256CanonicalJsonHex(supported.stage),
    );
    expect(source.context).toMatchObject({
      conditionId: "rest-hr60",
      refinedNominalDtSec: 0.001,
    });
    expect(source.coordinates).toEqual([
      {
        parameterId: "hemodynamics.total-blood-volume-ml",
        centerValue: 4_900,
      },
      {
        parameterId:
          "myocardium.common-ventricular-active-tension-scale",
        centerValue: 1.24,
      },
    ]);
    expect(source.basis).toMatchObject({
      basisId: "rest-operating-point-identification",
      basisRole: "primary-policy",
      rowInventoryStatus: "complete",
      compositionRobustnessStatus:
        "supported-across-reported-compositions",
      practicalRank: 2,
    });
    expect(source.basis.rows).toHaveLength(9);
    expect(source.centerObservations).toHaveLength(9);
    expect(source.basis.rows.map(({ checkId }) => checkId)).toEqual(
      source.centerObservations.map(({ checkId }) => checkId),
    );
    expect(source.claim).toEqual({
      sourceArtifactChainReconstructed: true,
      centerRecordReconstructedFromArtifact: true,
      targetEvaluated: false,
      exactReplayExecuted: false,
      refinedDtConvergenceClaimed: false,
      parameterSubsetAutomaticallySelected: false,
    });
  });

  it("owns the artifact chain before its first verifier await", async () => {
    const mutable = serializedArtifactsV1(supported) as {
      stageArtifact: SyntheticArtifactsV1["stage"];
    } & MainWireStandard70BaselineLocalProposalSourceArtifactsV1;
    const pending = buildMainWireStandard70BaselineLocalProposalSourceV1(
      mutable,
    );
    const pair = mutable.stageArtifact.subsets.find(({ coordinateIds }) =>
      coordinateIds.join("::").includes("active-tension")) as unknown as {
        compositionRobustnessStatus: string;
      };
    pair.compositionRobustnessStatus = "deficient";

    await expect(pending).resolves.toMatchObject({
      sourceId: MAIN_WIRE_STANDARD70_BASELINE_LOCAL_PROPOSAL_SOURCE_V1_ID,
      claim: { sourceArtifactChainReconstructed: true },
    });
  });

  it("rejects altered artifacts and a numerically deficient pair", async () => {
    const altered = serializedArtifactsV1(supported) as {
      stageArtifact: SyntheticArtifactsV1["stage"];
    } & MainWireStandard70BaselineLocalProposalSourceArtifactsV1;
    const stage = altered.stageArtifact as unknown as {
      stagePolicy: { policyIdentitySha256: string };
    };
    stage.stagePolicy.policyIdentitySha256 = "f".repeat(64);
    await expect(buildMainWireStandard70BaselineLocalProposalSourceV1(
      altered,
    )).rejects.toThrow(/differs from its reconstruction/);

    await expect(buildMainWireStandard70BaselineLocalProposalSourceV1(
      serializedArtifactsV1(deficient),
    )).rejects.toThrow(/primary source basis is not admitted/);
  });
});

function serializedArtifactsV1(
  artifacts: SyntheticArtifactsV1,
): MainWireStandard70BaselineLocalProposalSourceArtifactsV1 {
  return JSON.parse(JSON.stringify({
    coarseArtifact: artifacts.coarse,
    refinedArtifact: artifacts.refined,
    perturbationAttributionArtifact: artifacts.attribution,
    stageArtifact: artifacts.stage,
  })) as MainWireStandard70BaselineLocalProposalSourceArtifactsV1;
}
