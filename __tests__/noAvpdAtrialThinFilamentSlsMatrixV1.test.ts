import { describe, expect, it } from "vitest";

import {
  NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1,
  NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1,
  buildNoAvpdAtrialThinFilamentSlsParamsV1,
} from "@/engine/mechanics2/benches/NoAvpdAtrialThinFilamentSlsMatrixV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  initialNoAvpdFourChamberHillTriSegStateV1,
  stepNoAvpdFourChamberHillTriSegV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpdAtrialThinFilamentSlsMatrixV1", () => {
  it("predeclares the independent cold-start HR60 2x2 without a winner rule", () => {
    expect(
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1.map(
        (entry) => entry.candidateId,
      ),
    ).toEqual(["ALG_SLS4", "ALG_SLS8", "LAG25_SLS4", "LAG25_SLS8"]);
    expect(NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1).toMatchObject({
      initialization: "independent-cold-start-each-candidate",
      crossCandidateWarmStartAllowed: false,
      beats: 32,
      dtSec: 0.005,
      heartRateBpm: 60,
      fixedTriSegGeneralizedForceMapping:
        "lumens-2009-representative-tension-area-work",
      automaticWinnerSelection: false,
      physiologyGateApplied: false,
      calibrationClaimed: false,
      fixedGlobalNewtonProtocol: {
        maxIterations: 14,
        jacobianReuseMaxAcceptedSteps: 0,
        jacobianPolicy: "fresh-finite-difference-jacobian-every-iteration",
      },
    });
    expect(
      NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_PROTOCOL_V1.eaTreatment,
    ).toContain("report-only-never-an-objective-gate-or-ranking-term");
  });

  it("varies only LA thin-filament dynamics and LA SLS modulus", () => {
    const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    for (const candidate of NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1) {
      const params = buildNoAvpdAtrialThinFilamentSlsParamsV1(
        candidate.candidateId,
      );
      const activation = params.atria.left.material.calciumTroponinActivation;

      expect(params.triSegGeneralizedForceMapping).toBe(
        "lumens-2009-representative-tension-area-work",
      );
      expect(params.triSegColdInitialization).toBe("legacy-seed");
      expect(params.solver.maxIterations).toBe(14);
      expect(params.solver.jacobianReuse.maxAcceptedSteps).toBe(0);
      expect(params.atria.left.material.sls.modulusPa).toBe(
        candidate.laSlsModulusPa,
      );
      expect(params.atria.right).toBe(baseline.atria.right);
      expect(params.triSeg).toBe(baseline.triSeg);
      expect(params.valves).toBe(baseline.valves);
      expect(params.vascular).toBe(baseline.vascular);

      if (candidate.thinFilamentFactor === "algebraic-equilibrium") {
        expect(
          Object.prototype.hasOwnProperty.call(
            activation,
            "thinFilamentDynamics",
          ),
        ).toBe(false);
      } else {
        expect(activation.thinFilamentDynamics).toEqual({
          mode: "one-state-normalized-lag",
          timeConstantSec: 0.025,
        });
      }
    }
  });

  it("cold-initializes and accepts the first 5 ms step for every arm", () => {
    for (const candidate of NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_CANDIDATES_V1) {
      const params = buildNoAvpdAtrialThinFilamentSlsParamsV1(
        candidate.candidateId,
      );
      const initial = initialNoAvpdFourChamberHillTriSegStateV1(params);
      const output = stepNoAvpdFourChamberHillTriSegV1(initial, 0.005, params);

      expect(
        output.accepted,
        `${candidate.candidateId}: ${output.failureReasons.join(",")}`,
      ).toBe(true);
      expect(output.failureReasons).toEqual([]);
      const availability =
        output.state.walls.leftAtrium.thinFilamentAvailability01;
      if (candidate.thinFilamentFactor === "algebraic-equilibrium") {
        expect(availability).toBeUndefined();
      } else {
        expect(availability).toBeTypeOf("number");
        expect(availability).toBeGreaterThanOrEqual(0);
        expect(availability).toBeLessThanOrEqual(1);
      }
    }
  });
});
