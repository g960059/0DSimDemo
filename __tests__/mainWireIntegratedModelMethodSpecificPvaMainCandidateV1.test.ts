import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  projectMainWireIntegratedModelMethodSpecificPvaMainCandidateV1,
  type MainWireIntegratedModelMethodSpecificPvaMainCandidateV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaMainCandidateV1";
import type { MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1";

describe("method-specific PVA main candidate V1", () => {
  it("selects the method but retains qualification blockers before product publication", () => {
    const candidate = committedCandidateV1();

    expect(candidate.status).toBe("qualification-required");
    expect(candidate.targetSurface).toBe("completed-protocol-analysis");
    expect(candidate.methodSelection.status).toBe(
      "selected-for-main-qualification",
    );
    expect(candidate.methodSelection.methodId).toBe(
      "suga-compatible-pva-estimate-phase-wise-venous-occlusion-fixed-passive-slice-v1",
    );
    expect(candidate.methodSelection.systolicRelation).toBe(
      "maximum-positive-occlusion-phase-wise-isochronal",
    );
    expect(candidate.outputs.map((output) => output.researchEstimateJ)).toEqual(
      [1.581500908199982, 0.5884018254881368],
    );
    expect(
      candidate.outputs.every((output) => output.mainOutputValueJ === null),
    ).toBe(true);
    expect(candidate.promotion.mainIntegrationReady).toBe(false);
    expect(candidate.promotion.blockers).toEqual([
      "passive-reference-source-identity-not-established",
      "baseline-exclusion-sensitivity-not-characterized",
      "selected-phase-state-dispersion-not-characterized",
      "phase-resolution-sensitivity-not-characterized",
    ]);
    expect(candidate.outputs[0]!.limitations).toEqual([
      "domain-supported-potential-energy-not-established",
      "systolic-relation-extrapolation-required",
      "fixed-contralateral-passive-reference",
      "protocol-direction-sensitivity-retained",
    ]);
  });

  it("retains the method-specific estimate, uncertainty inputs, and passive slice identity", () => {
    const [LV, RV] = committedCandidateV1().outputs;

    expect(LV?.energy).toMatchObject({
      externalWorkJ: 1.2864541324474803,
      potentialEnergyEquivalentJ: 0.2950467757525017,
      pvaEstimateJ: 1.581500908199982,
    });
    expect(LV?.uncertainty).toEqual({
      systolicAreaOutsideMeasuredRangeFraction: 0.4518868571139322,
      externalWorkCoarseFineDifferenceJ: 0.004339933917046013,
      baselineExclusionSensitivityJ: null,
      selectedPhaseStateDispersionAvailable: false,
    });
    expect(LV?.passiveReference).toMatchObject({
      fixedContralateralVentricleId: "RV",
      fixedContralateralVolumeMl: 150.21875,
    });
    expect(RV?.passiveReference).toMatchObject({
      fixedContralateralVentricleId: "LV",
      fixedContralateralVolumeMl: 138.70000000000002,
    });
  });

  it("does not mistake a protocol result for a live or generic PVA", () => {
    expect(committedCandidateV1().interpretation).toEqual({
      genericPvaEstablished: false,
      clinicalPvaEstablished: false,
      oxygenConsumptionEstablished: false,
      liveSingleBeatOutput: false,
      methodSpecificProtocolOutputSelected: true,
      productValuePublished: false,
      domainSupportedVariantEstablished: false,
    });
  });

  it("does not mistake transient-periodic compatibility for complete PVA source identity", () => {
    const source = committedPhaseWiseV1();
    const incompatible = structuredClone(source) as unknown as {
      interpretation: {
        transientPeriodicSourceCompatibilityEstablished: boolean;
      };
      baselinePva: Array<Record<string, unknown>>;
    };
    incompatible.interpretation.transientPeriodicSourceCompatibilityEstablished = false;
    const result =
      projectMainWireIntegratedModelMethodSpecificPvaMainCandidateV1(
        incompatible as unknown as MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1,
      );
    expect(result.status).toBe("qualification-required");
    expect(result.promotion.blockers).toContain(
      "transient-periodic-source-compatibility-not-established",
    );
    expect(result.promotion.nextRequiredStudy).toBe(
      "phase-wise-pva-qualification-v2",
    );
  });
});

function committedCandidateV1(): MainWireIntegratedModelMethodSpecificPvaMainCandidateV1 {
  return JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "artifacts/transient-preload/method-specific-pva-main-candidate-v1.json",
      ),
      "utf8",
    ),
  ) as MainWireIntegratedModelMethodSpecificPvaMainCandidateV1;
}

function committedPhaseWiseV1(): MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1 {
  return JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "artifacts/transient-preload/phase-wise-emax-baseline-pva-research-v1.json",
      ),
      "utf8",
    ),
  ) as MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1;
}
