import type {
  Land2017SourceParameterSet,
  Land2017StrongBridgeDeactivationExit,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  LAND2017_STATE_INDEX,
  assertLand2017StateVectorLength,
} from "@/engine/myocardium/myofilament/land2017/types";
import { requireFiniteNumber } from "@/engine/myocardium/units";

export type Land2017StrongBridgeDeactivationExitRateTermsV1 = Readonly<{
  ratePerSec: number;
  derivativeByCaTRPNPerSec: number;
}>;

export type Land2017StrongBridgeDeactivationExitTermsV1 = Readonly<{
  ratePerSec: number;
  populationExcess: number;
  populationFluxPerSec: number;
  derivativeByCaTRPNPerSec: number;
  derivativeByWeakPopulationPerSec: number;
  derivativeByStrongPopulationPerSec: number;
  populationGateActive: boolean;
  equilibriumStrongToWeakRatio: number;
}>;

/**
 * The selected extension rate is a fixed octic transform of the source Land
 * thin-filament unactivation fraction. CaTRPN is dimensionless, so the rate
 * and its CaTRPN derivative both retain units of 1/s.
 */
export function evaluateLand2017StrongBridgeDeactivationExitRateTermsV1(
  CaTRPN: number,
  parameterSet: Land2017SourceParameterSet,
): Land2017StrongBridgeDeactivationExitRateTermsV1 {
  const extension = requireSelectedExtension(parameterSet);
  const calciumTroponin = requireFiniteNumber(
    CaTRPN,
    "Land 2017 strong-bridge deactivation-exit CaTRPN",
  );
  if (!(calciumTroponin > 0)) {
    throw new Error(
      "Land 2017 strong-bridge deactivation exit requires positive CaTRPN",
    );
  }
  const exponent = requireFiniteNumber(
    parameterSet.values.nTm,
    "Land 2017 strong-bridge deactivation-exit nTm",
  );
  const threshold = requireFiniteNumber(
    parameterSet.values.TRPN50,
    "Land 2017 strong-bridge deactivation-exit TRPN50",
  );
  if (!(exponent > 0) || !(threshold > 0)) {
    throw new Error(
      "Land 2017 strong-bridge deactivation exit requires positive nTm and TRPN50",
    );
  }

  const thresholdPower = Math.pow(threshold, exponent);
  const calciumPower = Math.pow(calciumTroponin, exponent);
  const denominator = thresholdPower + calciumPower;
  const baseGate = thresholdPower / denominator;
  const baseGateDerivative = -thresholdPower
    * exponent
    * Math.pow(calciumTroponin, exponent - 1)
    / (denominator * denominator);
  const levelGate = Math.pow(baseGate, extension.cooperativeGatePower);
  const levelGateDerivative = extension.cooperativeGatePower
    * Math.pow(baseGate, extension.cooperativeGatePower - 1)
    * baseGateDerivative;
  return {
    ratePerSec: extension.maximumRatePerSec * levelGate,
    derivativeByCaTRPNPerSec:
      extension.maximumRatePerSec * levelGateDerivative,
  };
}

/**
 * Active extension flux from S to the implicit unbound population U. Only the
 * positive S excess above the source zero-distortion S/W equilibrium is
 * eligible; the declared derivative at equality is the inactive-side value.
 */
export function evaluateLand2017StrongBridgeDeactivationExitTermsV1(
  state: ArrayLike<number>,
  parameterSet: Land2017SourceParameterSet,
): Land2017StrongBridgeDeactivationExitTermsV1 {
  assertLand2017StateVectorLength(
    state,
    "Land 2017 strong-bridge deactivation-exit state",
  );
  const rate = evaluateLand2017StrongBridgeDeactivationExitRateTermsV1(
    state[LAND2017_STATE_INDEX.CaTRPN],
    parameterSet,
  );
  const ratio = land2017ZeroDistortionStrongToWeakRatioV1(parameterSet);
  const weakPopulation = requireFiniteNumber(
    state[LAND2017_STATE_INDEX.W],
    "Land 2017 strong-bridge deactivation-exit weak population",
  );
  const strongPopulation = requireFiniteNumber(
    state[LAND2017_STATE_INDEX.S],
    "Land 2017 strong-bridge deactivation-exit strong population",
  );
  const rawPopulationExcess = strongPopulation - ratio * weakPopulation;
  // B, W, S, and implicit U are normalized populations. Keep the declared
  // inactive-side derivative stable across the representational fuzz at the
  // positive-part kink without introducing a physiological smoothing scale.
  const populationGateTolerance = 64 * Number.EPSILON;
  if (!(rawPopulationExcess > populationGateTolerance)) {
    return {
      ratePerSec: rate.ratePerSec,
      populationExcess: 0,
      populationFluxPerSec: 0,
      derivativeByCaTRPNPerSec: 0,
      derivativeByWeakPopulationPerSec: 0,
      derivativeByStrongPopulationPerSec: 0,
      populationGateActive: false,
      equilibriumStrongToWeakRatio: ratio,
    };
  }
  return {
    ratePerSec: rate.ratePerSec,
    populationExcess: rawPopulationExcess,
    populationFluxPerSec: rate.ratePerSec * rawPopulationExcess,
    derivativeByCaTRPNPerSec:
      rate.derivativeByCaTRPNPerSec * rawPopulationExcess,
    derivativeByWeakPopulationPerSec: -rate.ratePerSec * ratio,
    derivativeByStrongPopulationPerSec: rate.ratePerSec,
    populationGateActive: true,
    equilibriumStrongToWeakRatio: ratio,
  };
}

export function land2017ZeroDistortionStrongToWeakRatioV1(
  parameterSet: Land2017SourceParameterSet,
): number {
  requireSelectedExtension(parameterSet);
  const ratio = parameterSet.values.kws / parameterSet.derived.ksu;
  if (!(ratio > 0) || !Number.isFinite(ratio)) {
    throw new Error(
      "Land 2017 strong-bridge deactivation exit requires a positive finite zero-distortion S/W ratio",
    );
  }
  return ratio;
}

function requireSelectedExtension(
  parameterSet: Land2017SourceParameterSet,
): Land2017StrongBridgeDeactivationExit {
  const extension = parameterSet.strongBridgeDeactivationExit;
  if (extension === undefined) {
    throw new Error(
      "Land 2017 strong-bridge deactivation-exit sidecar requires the active extension",
    );
  }
  const identityValid =
    extension.extensionId === "land2017-strong-bridge-deactivation-exit-v1"
      ? extension.maximumRatePerSec === 30
      : extension.extensionId === "land2017-strong-bridge-deactivation-exit-v2"
        && Number.isFinite(extension.maximumRatePerSec)
        && extension.maximumRatePerSec > 0
        && extension.maximumRatePerSec <= 500
        && Number.isFinite(extension.cooperativeGatePower)
        && extension.cooperativeGatePower >= 0.5
        && extension.cooperativeGatePower <= 16;
  if (
    !identityValid
    || extension.calciumTroponinGate
      !== "TRPN50-power-over-TRPN50-power-plus-CaTRPN-power"
    || (
      extension.extensionId === "land2017-strong-bridge-deactivation-exit-v1"
      && extension.cooperativeGatePower !== 8
    )
    || extension.deactivationDirectionGate !== "none"
    || extension.strongPopulationGate
      !== "positive-excess-over-zero-distortion-equilibrium"
    || extension.exitDestination !== "unbound"
    || extension.sourceIdentityClaimed !== false
  ) {
    throw new Error(
      "Land 2017 strong-bridge deactivation exit must match the fixed V1 mechanism",
    );
  }
  return extension;
}
