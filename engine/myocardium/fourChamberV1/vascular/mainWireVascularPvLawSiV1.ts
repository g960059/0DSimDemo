import {
  complianceFromPtm,
  stressedVolumeFromPtm,
  type VascularPvLaw,
} from "@/engine/vascularPv";
import {
  mainWireDefaultHemodynamicRuntimeControlsV1,
  resolveMainWireNonCoronaryHemodynamicGraphV1,
  type MainWireNonCoronaryVascularNodeNameV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import type { CoreRuntimeParams } from "@/engine/protocol";
import {
  MAIN_WIRE_CUBIC_METRE_PER_ML_V1,
  MAIN_WIRE_PASCAL_PER_MMHG_V1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1";

export const MAIN_WIRE_VASCULAR_PV_LAW_SI_V1_ID =
  "main-wire-vascular-pv-law-si-adapter-v1" as const;

/**
 * A trial state left the reviewed invertible branch of a vascular PV law.
 * Newton may reject this trial or the outer exploratory integrator may reduce
 * the time step.  Configuration, invariant, and programming errors must not
 * use this class.
 */
export class MainWireVascularPvTrialDomainErrorV1 extends Error {
  readonly errorClass = "main-wire-vascular-pv-trial-domain-v1" as const;

  constructor(message: string) {
    super(message);
    this.name = "MainWireVascularPvTrialDomainErrorV1";
  }
}

const MAIN_WIRE_VENOUS_INVERSE_MINIMUM_PTM_MMHG_V1 = -20;
const MAIN_WIRE_VENOUS_INVERSE_MAXIMUM_PTM_MMHG_V1 = 45;
// engine/vascularPv.ts floors venous compliance at this value.  The SI
// adapter rejects any law whose *raw* derivative reaches that floor, rather
// than pairing a clamped compliance/energy with an unclamped volume law.
const MAIN_WIRE_VENOUS_SOURCE_COMPLIANCE_FLOOR_ML_PER_MMHG_V1 = 1e-4;

export type MainWireVascularPvRuntimeModifiersV1 = Readonly<
  Pick<CoreRuntimeParams, "venousTone" | "arterialStiffness" | "nodeOverrides">
>;

export type MainWireVascularPvInverseSupportV1 =
  | Readonly<{
      kind: "unbounded-linear";
    }>
  | Readonly<{
      kind: "bounded-main-wire-inverse";
      minimumTransmuralPressurePa: number;
      maximumTransmuralPressurePa: number;
      outsidePolicy: "throw";
    }>;

export type CompiledMainWireVascularPvLawSiV1 = Readonly<{
  adapterId: typeof MAIN_WIRE_VASCULAR_PV_LAW_SI_V1_ID;
  nodeName: MainWireNonCoronaryVascularNodeNameV1;
  sourceLawOwnerModule: "engine/vascularPv.ts";
  sourceLawOwnerExports: readonly ["stressedVolumeFromPtm", "complianceFromPtm"];
  runtimeParameterResolverOwner: "engine/core/mainWireHemodynamicGraphV1.ts";
  numericalSemanticsOwner:
    "engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1.ts";
  modelCoreInverseClippingReused: false;
  outOfDomainPolicy: "throw-not-modelcore-clip";
  externalPressureKind: "none" | "pth" | "palv";
  externalPressureIsSeparateInput: true;
  runtimeModifiers: MainWireVascularPvRuntimeModifiersV1;
  effectiveUnstressedVolumeMl: number;
  effectiveUnstressedVolumeM3: number;
  sourceLawMainWireUnits: Readonly<VascularPvLaw>;
  inverseSupport: MainWireVascularPvInverseSupportV1;
}>;

export type MainWireVascularPvEvaluationSiV1 = Readonly<{
  adapterId: typeof MAIN_WIRE_VASCULAR_PV_LAW_SI_V1_ID;
  nodeName: MainWireNonCoronaryVascularNodeNameV1;
  units: Readonly<{
    volume: "m^3";
    pressure: "Pa";
    compliance: "m^3/Pa";
    energy: "J";
  }>;
  physicalVolumeM3: number;
  effectiveUnstressedVolumeM3: number;
  stressedVolumeM3: number;
  transmuralPressurePa: number;
  externalPressurePa: number;
  absolutePressurePa: number;
  absoluteMinusExternalPressurePa: number;
  complianceM3PerPa: number;
  pressureDerivativePaPerM3: number;
  elasticEnergyJ: number;
  elasticEnergyIncludesExternalPressure: false;
}>;

/**
 * Compiles a vascular-node PV law without taking ownership of its parameters.
 * Effective Vu and arterial stiffness are resolved by the shared main-wire
 * graph resolver.  No vascular datum or runtime formula is duplicated here.
 */
export function compileMainWireVascularPvLawSiV1(
  nodeName: MainWireNonCoronaryVascularNodeNameV1,
  runtimeModifiers: MainWireVascularPvRuntimeModifiersV1,
): CompiledMainWireVascularPvLawSiV1 {
  assertRequiredAndOptionalKeys(
    runtimeModifiers,
    ["venousTone", "arterialStiffness"],
    ["nodeOverrides"],
    "runtimeModifiers",
  );
  const venousTone = requireFinite(runtimeModifiers.venousTone, "runtimeModifiers.venousTone");
  const arterialStiffness = requirePositiveFinite(
    runtimeModifiers.arterialStiffness,
    "runtimeModifiers.arterialStiffness",
  );
  const defaults = mainWireDefaultHemodynamicRuntimeControlsV1();
  const resolvedGraph = resolveMainWireNonCoronaryHemodynamicGraphV1({
    ...defaults,
    venousTone,
    arterialStiffness,
    ...(runtimeModifiers.nodeOverrides === undefined
      ? {}
      : { nodeOverrides: runtimeModifiers.nodeOverrides }),
  });
  const node = resolvedGraph.vascularNodes
    .find((candidate) => candidate.name === nodeName);
  if (node === undefined) throw new Error(`unsupported main-wire vascular node ${nodeName}`);
  if (node.externalPressureKind !== "none"
      && node.externalPressureKind !== "pth"
      && node.externalPressureKind !== "palv") {
    throw new Error(`node ${nodeName} requires unsupported external pressure ${node.externalPressureKind}`);
  }

  const effectiveUnstressedVolumeMl = node.effectiveUnstressedVolumeMl;
  const sourceLaw: Readonly<VascularPvLaw> = node.pvLawMainWireUnits;
  let inverseSupport: MainWireVascularPvInverseSupportV1;
  if (sourceLaw.kind === "arterial") {
    const p0 = sourceLaw.P0;
    inverseSupport = Object.freeze({
      kind: "bounded-main-wire-inverse" as const,
      // stressedVolumeFromPtm clamps at -0.95 P0, while ModelCore clamps
      // arterial log-volume at +5.  Inversion is one-to-one only here.
      minimumTransmuralPressurePa: -0.95 * p0 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      maximumTransmuralPressurePa:
        p0 * Math.expm1(5) * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      outsidePolicy: "throw" as const,
    });
  } else if (sourceLaw.kind === "linear") {
    inverseSupport = Object.freeze({ kind: "unbounded-linear" as const });
  } else if (sourceLaw.kind === "venous3") {
    inverseSupport = Object.freeze({
      kind: "bounded-main-wire-inverse" as const,
      // These are the exact brackets used by ModelCore.  Unlike ModelCore's
      // state guard, this adapter throws outside them instead of silently
      // returning a clipped pressure.
      minimumTransmuralPressurePa:
        MAIN_WIRE_VENOUS_INVERSE_MINIMUM_PTM_MMHG_V1
        * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      maximumTransmuralPressurePa:
        MAIN_WIRE_VENOUS_INVERSE_MAXIMUM_PTM_MMHG_V1
        * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      outsidePolicy: "throw" as const,
    });
    assertWorkConjugateVenousLawOnInverseSupportV1(nodeName, sourceLaw);
  } else {
    throw new Error(`node ${nodeName} has no supported main-wire vascular PV law`);
  }

  return Object.freeze({
    adapterId: MAIN_WIRE_VASCULAR_PV_LAW_SI_V1_ID,
    nodeName,
    sourceLawOwnerModule: "engine/vascularPv.ts",
    sourceLawOwnerExports: Object.freeze([
      "stressedVolumeFromPtm",
      "complianceFromPtm",
    ] as const),
    runtimeParameterResolverOwner: "engine/core/mainWireHemodynamicGraphV1.ts",
    numericalSemanticsOwner:
      "engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1.ts",
    modelCoreInverseClippingReused: false,
    outOfDomainPolicy: "throw-not-modelcore-clip",
    externalPressureKind: node.externalPressureKind,
    externalPressureIsSeparateInput: true,
    runtimeModifiers: Object.freeze({
      venousTone,
      arterialStiffness,
      ...(runtimeModifiers.nodeOverrides === undefined
        ? {}
        : { nodeOverrides: runtimeModifiers.nodeOverrides }),
    }),
    effectiveUnstressedVolumeMl,
    effectiveUnstressedVolumeM3:
      effectiveUnstressedVolumeMl * MAIN_WIRE_CUBIC_METRE_PER_ML_V1,
    sourceLawMainWireUnits: sourceLaw,
    inverseSupport,
  });
}

export function mainWireVascularPhysicalVolumeM3FromPtmPaV1(
  compiled: CompiledMainWireVascularPvLawSiV1,
  transmuralPressurePa: number,
): number {
  const pressurePa = requireSupportedPressure(compiled, transmuralPressurePa);
  const pressureMmHg = pressurePa / MAIN_WIRE_PASCAL_PER_MMHG_V1;
  const stressedVolumeMl = stressedVolumeFromPtm(
    compiled.sourceLawMainWireUnits,
    pressureMmHg,
  );
  const volumeM3 = (compiled.effectiveUnstressedVolumeMl + stressedVolumeMl)
    * MAIN_WIRE_CUBIC_METRE_PER_ML_V1;
  return requireNonNegativeFinite(volumeM3, `${compiled.nodeName}.physicalVolumeM3`);
}

export function mainWireVascularComplianceM3PerPaFromPtmPaV1(
  compiled: CompiledMainWireVascularPvLawSiV1,
  transmuralPressurePa: number,
): number {
  const pressurePa = requireSupportedPressure(compiled, transmuralPressurePa);
  const law = compiled.sourceLawMainWireUnits;
  const pressureMmHg = pressurePa / MAIN_WIRE_PASCAL_PER_MMHG_V1;
  const workConjugateComplianceMlPerMmHg = law.kind === "venous3"
    ? rawVenousComplianceMlPerMmHgV1(law, pressureMmHg)
    : complianceFromPtm(law, pressureMmHg);
  return requirePositiveFinite(
    workConjugateComplianceMlPerMmHg
      * MAIN_WIRE_CUBIC_METRE_PER_ML_V1
      / MAIN_WIRE_PASCAL_PER_MMHG_V1,
    `${compiled.nodeName}.complianceM3PerPa`,
  );
}

/**
 * Robust inverse of physical volume.  Linear nodes use their exact inverse;
 * arterial and three-regime venous nodes use a monotone bracketed solve over
 * the reviewed ModelCore inverse domain.  Out-of-domain states fail closed.
 */
export function mainWireVascularPtmPaFromPhysicalVolumeM3V1(
  compiled: CompiledMainWireVascularPvLawSiV1,
  physicalVolumeM3: number,
): number {
  const volumeM3 = requireNonNegativeFinite(physicalVolumeM3, "physicalVolumeM3");
  const targetStressedVolumeMl = volumeM3 / MAIN_WIRE_CUBIC_METRE_PER_ML_V1
    - compiled.effectiveUnstressedVolumeMl;
  const law = compiled.sourceLawMainWireUnits;
  if (law.kind === "linear") {
    return requireFinite(
      targetStressedVolumeMl / law.C * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      `${compiled.nodeName}.transmuralPressurePa`,
    );
  }
  if (compiled.inverseSupport.kind !== "bounded-main-wire-inverse") {
    throw new Error(`${compiled.nodeName} has inconsistent inverse support`);
  }
  let lowerMmHg = compiled.inverseSupport.minimumTransmuralPressurePa
    / MAIN_WIRE_PASCAL_PER_MMHG_V1;
  let upperMmHg = compiled.inverseSupport.maximumTransmuralPressurePa
    / MAIN_WIRE_PASCAL_PER_MMHG_V1;
  const volumeAt = (pressureMmHg: number) =>
    stressedVolumeFromPtm(law, pressureMmHg);
  const lowerVolume = volumeAt(lowerMmHg);
  const upperVolume = volumeAt(upperMmHg);
  const volumeToleranceMl = 2e-12 * Math.max(
    1,
    Math.abs(targetStressedVolumeMl),
    Math.abs(lowerVolume),
    Math.abs(upperVolume),
  );
  if (targetStressedVolumeMl < lowerVolume - volumeToleranceMl
      || targetStressedVolumeMl > upperVolume + volumeToleranceMl) {
    throw new MainWireVascularPvTrialDomainErrorV1(
      `${compiled.nodeName} physical volume is outside the invertible main-wire PV domain`,
    );
  }
  if (Math.abs(targetStressedVolumeMl - lowerVolume) <= volumeToleranceMl) {
    return lowerMmHg * MAIN_WIRE_PASCAL_PER_MMHG_V1;
  }
  if (Math.abs(targetStressedVolumeMl - upperVolume) <= volumeToleranceMl) {
    return upperMmHg * MAIN_WIRE_PASCAL_PER_MMHG_V1;
  }

  // Positive compliance makes the bracket monotone.  A fixed upper iteration
  // count makes the solve deterministic across callers and test environments.
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpoint = 0.5 * (lowerMmHg + upperMmHg);
    if (volumeAt(midpoint) < targetStressedVolumeMl) lowerMmHg = midpoint;
    else upperMmHg = midpoint;
  }
  const pressurePa = 0.5 * (lowerMmHg + upperMmHg) * MAIN_WIRE_PASCAL_PER_MMHG_V1;
  return requireFinite(pressurePa, `${compiled.nodeName}.transmuralPressurePa`);
}

export function mainWireVascularPhysicalVolumeBoundsM3V1(
  compiled: CompiledMainWireVascularPvLawSiV1,
): Readonly<{ minimumM3: number; maximumM3: number }> | null {
  if (compiled.inverseSupport.kind !== "bounded-main-wire-inverse") return null;
  const physicalAt = (pressurePa: number) => {
    const stressedVolumeMl = stressedVolumeFromPtm(
      compiled.sourceLawMainWireUnits,
      pressurePa / MAIN_WIRE_PASCAL_PER_MMHG_V1,
    );
    return requireFinite(
      (compiled.effectiveUnstressedVolumeMl + stressedVolumeMl)
        * MAIN_WIRE_CUBIC_METRE_PER_ML_V1,
      `${compiled.nodeName}.supportPhysicalVolumeM3`,
    );
  };
  const rawMinimumM3 = physicalAt(
    compiled.inverseSupport.minimumTransmuralPressurePa,
  );
  const maximumM3 = requirePositiveFinite(
    physicalAt(compiled.inverseSupport.maximumTransmuralPressurePa),
    `${compiled.nodeName}.maximumSupportPhysicalVolumeM3`,
  );
  const minimumM3 = Math.max(0, rawMinimumM3);
  if (!(maximumM3 > minimumM3)) {
    throw new Error(`${compiled.nodeName} physical-volume support is empty`);
  }
  return Object.freeze({ minimumM3, maximumM3 });
}

/**
 * Elastic energy relative to Ptm=0.  It is exactly the work integral
 * Psi(V)=integral Ptm dV; external pressure is deliberately not stored here.
 */
export function mainWireVascularElasticEnergyJFromPtmPaV1(
  compiled: CompiledMainWireVascularPvLawSiV1,
  transmuralPressurePa: number,
): number {
  const pressurePa = requireSupportedPressure(compiled, transmuralPressurePa);
  const pressureMmHg = pressurePa / MAIN_WIRE_PASCAL_PER_MMHG_V1;
  const law = compiled.sourceLawMainWireUnits;
  let energyMmHgMl: number;
  if (law.kind === "arterial") {
    const logarithmicStressedVolume = Math.log1p(pressureMmHg / law.P0);
    energyMmHgMl = law.P0 * law.VsEff
      * (Math.exp(logarithmicStressedVolume) - 1 - logarithmicStressedVolume);
  } else if (law.kind === "linear") {
    energyMmHgMl = 0.5 * law.C * pressureMmHg * pressureMmHg;
  } else {
    const integrand = (pressure: number) =>
      pressure * rawVenousComplianceMlPerMmHgV1(law, pressure);
    energyMmHgMl = adaptiveSimpsonIntegral(
      integrand,
      0,
      pressureMmHg,
      1e-10,
      20,
    );
  }
  return requireNonNegativeFinite(
    energyMmHgMl * MAIN_WIRE_PASCAL_PER_MMHG_V1 * MAIN_WIRE_CUBIC_METRE_PER_ML_V1,
    `${compiled.nodeName}.elasticEnergyJ`,
  );
}

function assertWorkConjugateVenousLawOnInverseSupportV1(
  nodeName: MainWireNonCoronaryVascularNodeNameV1,
  law: Extract<VascularPvLaw, { kind: "venous3" }>,
): void {
  for (const [field, value] of Object.entries(law)) {
    if (field !== "kind" && !Number.isFinite(value)) {
      throw new Error(`${nodeName}.${field} must be finite`);
    }
  }
  if (!(law.dOpen > 0) || !(law.dStiff > 0)) {
    throw new Error(`${nodeName} venous transition widths must be positive`);
  }

  // Interval arithmetic proves that raw dV/dP stays strictly above the
  // source clamp throughout the complete inverse domain.  If an extreme
  // override cannot be proven safe, compilation fails closed.
  const pending: Array<Readonly<{ lower: number; upper: number; depth: number }>> = [
    Object.freeze({
      lower: MAIN_WIRE_VENOUS_INVERSE_MINIMUM_PTM_MMHG_V1,
      upper: MAIN_WIRE_VENOUS_INVERSE_MAXIMUM_PTM_MMHG_V1,
      depth: 0,
    }),
  ];
  while (pending.length > 0) {
    const interval = pending.pop()!;
    const bounds = rawVenousComplianceBoundsMlPerMmHgV1(
      law,
      interval.lower,
      interval.upper,
    );
    if (!Number.isFinite(bounds.lower) || !Number.isFinite(bounds.upper)) {
      throw new Error(`${nodeName} raw venous compliance is non-finite`);
    }
    if (
      bounds.lower
      > MAIN_WIRE_VENOUS_SOURCE_COMPLIANCE_FLOOR_ML_PER_MMHG_V1
    ) {
      continue;
    }
    const midpoint = 0.5 * (interval.lower + interval.upper);
    const samples = [interval.lower, midpoint, interval.upper].map((pressure) =>
      rawVenousComplianceMlPerMmHgV1(law, pressure));
    if (samples.some((value) => !Number.isFinite(value))) {
      throw new Error(`${nodeName} raw venous compliance is non-finite`);
    }
    if (samples.some(
      (value) =>
        value
        <= MAIN_WIRE_VENOUS_SOURCE_COMPLIANCE_FLOOR_ML_PER_MMHG_V1,
    )) {
      throw new Error(
        `${nodeName} raw venous compliance reaches the source clamp and is not work-conjugate`,
      );
    }
    if (interval.depth >= 40
        || midpoint === interval.lower
        || midpoint === interval.upper) {
      throw new Error(
        `${nodeName} raw venous compliance positivity cannot be certified on the inverse support`,
      );
    }
    pending.push(
      Object.freeze({
        lower: interval.lower,
        upper: midpoint,
        depth: interval.depth + 1,
      }),
      Object.freeze({
        lower: midpoint,
        upper: interval.upper,
        depth: interval.depth + 1,
      }),
    );
  }
}

function rawVenousComplianceBoundsMlPerMmHgV1(
  law: Extract<VascularPvLaw, { kind: "venous3" }>,
  lowerPressureMmHg: number,
  upperPressureMmHg: number,
): Readonly<{ lower: number; upper: number }> {
  const openingCoefficient = law.Copen - law.Ccoll;
  const stiffeningCoefficient = -(law.Copen - law.Cdist);
  const openingLower = stableSigmoidV1(
    (lowerPressureMmHg - law.Popen) / law.dOpen,
  );
  const openingUpper = stableSigmoidV1(
    (upperPressureMmHg - law.Popen) / law.dOpen,
  );
  const stiffeningLower = stableSigmoidV1(
    (lowerPressureMmHg - law.Pstiff) / law.dStiff,
  );
  const stiffeningUpper = stableSigmoidV1(
    (upperPressureMmHg - law.Pstiff) / law.dStiff,
  );
  const openingTermLower = openingCoefficient >= 0
    ? openingCoefficient * openingLower
    : openingCoefficient * openingUpper;
  const openingTermUpper = openingCoefficient >= 0
    ? openingCoefficient * openingUpper
    : openingCoefficient * openingLower;
  const stiffeningTermLower = stiffeningCoefficient >= 0
    ? stiffeningCoefficient * stiffeningLower
    : stiffeningCoefficient * stiffeningUpper;
  const stiffeningTermUpper = stiffeningCoefficient >= 0
    ? stiffeningCoefficient * stiffeningUpper
    : stiffeningCoefficient * stiffeningLower;
  return Object.freeze({
    lower: law.Ccoll + openingTermLower + stiffeningTermLower,
    upper: law.Ccoll + openingTermUpper + stiffeningTermUpper,
  });
}

function rawVenousComplianceMlPerMmHgV1(
  law: Extract<VascularPvLaw, { kind: "venous3" }>,
  pressureMmHg: number,
): number {
  return law.Ccoll
    + (law.Copen - law.Ccoll)
      * stableSigmoidV1((pressureMmHg - law.Popen) / law.dOpen)
    - (law.Copen - law.Cdist)
      * stableSigmoidV1((pressureMmHg - law.Pstiff) / law.dStiff);
}

function stableSigmoidV1(value: number): number {
  if (value >= 40) return 1;
  if (value <= -40) return 0;
  return 1 / (1 + Math.exp(-value));
}

export function evaluateMainWireVascularPvAtPressureSiV1(
  compiled: CompiledMainWireVascularPvLawSiV1,
  transmuralPressurePa: number,
  externalPressurePa: number,
): MainWireVascularPvEvaluationSiV1 {
  const pressurePa = requireSupportedPressure(compiled, transmuralPressurePa);
  const externalPa = requireFinite(externalPressurePa, "externalPressurePa");
  const physicalVolumeM3 = mainWireVascularPhysicalVolumeM3FromPtmPaV1(
    compiled,
    pressurePa,
  );
  return assembleEvaluation(compiled, physicalVolumeM3, pressurePa, externalPa);
}

export function evaluateMainWireVascularPvAtVolumeSiV1(
  compiled: CompiledMainWireVascularPvLawSiV1,
  physicalVolumeM3: number,
  externalPressurePa: number,
): MainWireVascularPvEvaluationSiV1 {
  const volumeM3 = requireNonNegativeFinite(physicalVolumeM3, "physicalVolumeM3");
  const externalPa = requireFinite(externalPressurePa, "externalPressurePa");
  const pressurePa = mainWireVascularPtmPaFromPhysicalVolumeM3V1(compiled, volumeM3);
  return assembleEvaluation(compiled, volumeM3, pressurePa, externalPa);
}

function assembleEvaluation(
  compiled: CompiledMainWireVascularPvLawSiV1,
  physicalVolumeM3: number,
  transmuralPressurePa: number,
  externalPressurePa: number,
): MainWireVascularPvEvaluationSiV1 {
  const complianceM3PerPa = mainWireVascularComplianceM3PerPaFromPtmPaV1(
    compiled,
    transmuralPressurePa,
  );
  const absolutePressurePa = requireFinite(
    externalPressurePa + transmuralPressurePa,
    "absolutePressurePa",
  );
  return Object.freeze({
    adapterId: MAIN_WIRE_VASCULAR_PV_LAW_SI_V1_ID,
    nodeName: compiled.nodeName,
    units: Object.freeze({
      volume: "m^3" as const,
      pressure: "Pa" as const,
      compliance: "m^3/Pa" as const,
      energy: "J" as const,
    }),
    physicalVolumeM3,
    effectiveUnstressedVolumeM3: compiled.effectiveUnstressedVolumeM3,
    stressedVolumeM3: physicalVolumeM3 - compiled.effectiveUnstressedVolumeM3,
    transmuralPressurePa,
    externalPressurePa,
    absolutePressurePa,
    absoluteMinusExternalPressurePa: absolutePressurePa - externalPressurePa,
    complianceM3PerPa,
    pressureDerivativePaPerM3: 1 / complianceM3PerPa,
    elasticEnergyJ: mainWireVascularElasticEnergyJFromPtmPaV1(
      compiled,
      transmuralPressurePa,
    ),
    elasticEnergyIncludesExternalPressure: false as const,
  });
}

function requireSupportedPressure(
  compiled: CompiledMainWireVascularPvLawSiV1,
  transmuralPressurePa: number,
): number {
  const pressurePa = requireFinite(transmuralPressurePa, "transmuralPressurePa");
  if (compiled.inverseSupport.kind === "bounded-main-wire-inverse") {
    const scale = Math.max(
      1,
      Math.abs(compiled.inverseSupport.minimumTransmuralPressurePa),
      Math.abs(compiled.inverseSupport.maximumTransmuralPressurePa),
    );
    const tolerance = 2e-14 * scale;
    if (pressurePa < compiled.inverseSupport.minimumTransmuralPressurePa - tolerance
        || pressurePa > compiled.inverseSupport.maximumTransmuralPressurePa + tolerance) {
      throw new MainWireVascularPvTrialDomainErrorV1(
        `${compiled.nodeName} transmural pressure is outside main-wire inverse support`,
      );
    }
  }
  return pressurePa;
}

function adaptiveSimpsonIntegral(
  fn: (value: number) => number,
  start: number,
  end: number,
  absoluteTolerance: number,
  maximumDepth: number,
): number {
  if (start === end) return 0;
  if (end < start) {
    return -adaptiveSimpsonIntegral(fn, end, start, absoluteTolerance, maximumDepth);
  }
  const midpoint = 0.5 * (start + end);
  const startValue = requireFinite(fn(start), "quadrature.startValue");
  const midpointValue = requireFinite(fn(midpoint), "quadrature.midpointValue");
  const endValue = requireFinite(fn(end), "quadrature.endValue");
  const whole = simpson(start, end, startValue, midpointValue, endValue);
  return adaptiveSimpsonRecursive(
    fn,
    start,
    end,
    startValue,
    midpointValue,
    endValue,
    whole,
    absoluteTolerance,
    maximumDepth,
  );
}

function adaptiveSimpsonRecursive(
  fn: (value: number) => number,
  start: number,
  end: number,
  startValue: number,
  midpointValue: number,
  endValue: number,
  whole: number,
  tolerance: number,
  depth: number,
): number {
  const midpoint = 0.5 * (start + end);
  const leftMidpoint = 0.5 * (start + midpoint);
  const rightMidpoint = 0.5 * (midpoint + end);
  const leftMidpointValue = requireFinite(fn(leftMidpoint), "quadrature.leftMidpointValue");
  const rightMidpointValue = requireFinite(fn(rightMidpoint), "quadrature.rightMidpointValue");
  const left = simpson(start, midpoint, startValue, leftMidpointValue, midpointValue);
  const right = simpson(midpoint, end, midpointValue, rightMidpointValue, endValue);
  const correction = left + right - whole;
  if (depth <= 0 || Math.abs(correction) <= 15 * tolerance) {
    return left + right + correction / 15;
  }
  return adaptiveSimpsonRecursive(
    fn,
    start,
    midpoint,
    startValue,
    leftMidpointValue,
    midpointValue,
    left,
    tolerance / 2,
    depth - 1,
  ) + adaptiveSimpsonRecursive(
    fn,
    midpoint,
    end,
    midpointValue,
    rightMidpointValue,
    endValue,
    right,
    tolerance / 2,
    depth - 1,
  );
}

function simpson(
  start: number,
  end: number,
  startValue: number,
  midpointValue: number,
  endValue: number,
): number {
  return (end - start) * (startValue + 4 * midpointValue + endValue) / 6;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be non-negative and finite`);
  }
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function assertRequiredAndOptionalKeys(
  value: object,
  required: readonly string[],
  optional: readonly string[],
  field: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const keys = Object.keys(value);
  const unknown = keys.filter((key) => !required.includes(key) && !optional.includes(key));
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0) throw new Error(`${field} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`${field} is missing fields: ${missing.join(", ")}`);
}
