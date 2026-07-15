import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildSymmetricClosedLoopScaffoldV1,
  type SymmetricClosedLoopScaffoldV1,
} from "@/engine/myocardium/fourChamberV1/testSupport/symmetricClosedLoopScaffoldV1";

export const PHASE_B1_SYNTHETIC_CLOSED_LOOP_SCAFFOLD_V1_ID =
  "four-chamber-phase-b1-synthetic-closed-loop-scaffold-v1" as const;

/**
 * Frozen test-only geometry and flow numerics used to exercise the biological
 * material coupling. These values are not physiological calibration claims.
 */
export const PHASE_B1_SYNTHETIC_CLOSED_LOOP_SCAFFOLD_CONFIGURATION_V1 =
  Object.freeze({
    configurationId: PHASE_B1_SYNTHETIC_CLOSED_LOOP_SCAFFOLD_V1_ID,
    referenceCenteredGeometryEvidenceId:
      "phase-b1-synthetic-reference-centered-geometry-v1",
    valveNumerics: Object.freeze({
      openAreaM2ByValve: Object.freeze({
        Q_MV: 3e-4,
        Q_AoV: 3e-4,
        Q_TV: 3e-4,
        Q_PuV: 3e-4,
      }),
      numericalReverseAreaM2ByValve: Object.freeze({
        Q_MV: 9e-7,
        Q_AoV: 9e-7,
        Q_TV: 9e-7,
        Q_PuV: 9e-7,
      }),
      pressureGateWidthPaByValve: Object.freeze({
        Q_MV: 20,
        Q_AoV: 20,
        Q_TV: 20,
        Q_PuV: 20,
      }),
      flowSmoothingM3PerSecByValve: Object.freeze({
        Q_MV: 1e-9,
        Q_AoV: 1e-9,
        Q_TV: 1e-9,
        Q_PuV: 1e-9,
      }),
    }),
    testOnly: true,
    physiologicalValidation: false,
    releaseRuntimeReachable: false,
  } as const);

export function buildPhaseB1SyntheticClosedLoopScaffoldV1(
  sha256Hex: CanonicalSha256HexProvider,
): SymmetricClosedLoopScaffoldV1 {
  const configuration =
    PHASE_B1_SYNTHETIC_CLOSED_LOOP_SCAFFOLD_CONFIGURATION_V1;
  return buildSymmetricClosedLoopScaffoldV1({
    sha256Hex,
    referenceCenteredGeometryEvidenceId:
      configuration.referenceCenteredGeometryEvidenceId,
    valveNumerics: configuration.valveNumerics,
  });
}

export function phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(
  sha256Hex: CanonicalSha256HexProvider,
): string {
  return computeCanonicalSha256(
    PHASE_B1_SYNTHETIC_CLOSED_LOOP_SCAFFOLD_CONFIGURATION_V1,
    sha256Hex,
  );
}
