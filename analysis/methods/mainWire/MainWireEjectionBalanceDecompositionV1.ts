export const MAIN_WIRE_EJECTION_BALANCE_DECOMPOSITION_V1_ID = "main-wire-ejection-balance-decomposition-v1" as const;

/** Accepted-interval algebra only; this module does not reimplement a vascular
 * law, solve a model, smooth a trace or establish causal/physiological claims. */
export function splitMainWireAcceptedProductV1(input: Readonly<{
  startTimeSec: number; endTimeSec: number; acceptedDtSec: number;
  aStart: number; aEnd: number; bStart: number; bEnd: number;
}>) {
  const interval = acceptedIntervalV1(input.startTimeSec, input.endTimeSec, input.acceptedDtSec);
  for (const key of ["aStart", "aEnd", "bStart", "bEnd"] as const) finiteV1(input[key], key);
  const aChange = finiteV1(input.aEnd - input.aStart, "a change");
  const bChange = finiteV1(input.bEnd - input.bStart, "b change");
  const aMean = input.aStart / 2 + input.aEnd / 2;
  const bMean = input.bStart / 2 + input.bEnd / 2;
  const productStart = finiteV1(input.aStart * input.bStart, "starting product");
  const productEnd = finiteV1(input.aEnd * input.bEnd, "ending product");
  const productChange = finiteV1(productEnd - productStart, "product change");
  const aChangeContribution = finiteV1(bMean * aChange, "a-change contribution");
  const bChangeContribution = finiteV1(aMean * bChange, "b-change contribution");
  const reconstructedChange = finiteV1(aChangeContribution + bChangeContribution, "reconstructed product change");
  return Object.freeze({ methodId: MAIN_WIRE_EJECTION_BALANCE_DECOMPOSITION_V1_ID, interval,
    basis: "delta(a*b)=mean(b)*delta(a)+mean(a)*delta(b)" as const,
    aChange, bChange, aMean, bMean, productStart, productEnd, productChange,
    aChangeContribution, bChangeContribution, reconstructedChange,
    residual: finiteV1(productChange - reconstructedChange, "product split residual"),
    rates: Object.freeze({ basis: "accepted-interval-difference-not-instantaneous-derivative" as const,
      productPerSec: finiteV1(productChange / interval.dtSec, "product rate"),
      aChangeContributionPerSec: finiteV1(aChangeContribution / interval.dtSec, "a contribution rate"),
      bChangeContributionPerSec: finiteV1(bChangeContribution / interval.dtSec, "b contribution rate") }) });
}

export type MainWireAorticStorageEndpointV1 = Readonly<{
  timeSec: number; volumeMl: number; transmuralPressureMmHg: number; absolutePressureMmHg: number;
}>;
export type MainWireAorticStorageIntervalInputV1 = Readonly<{
  previous: MainWireAorticStorageEndpointV1;
  next: MainWireAorticStorageEndpointV1 & Readonly<{ acceptedDtSec: number }>;
  /** Actual accepted endpoint flows used by the backward-Euler continuity
   * equation. Signs follow the named edge, not clipped forward magnitudes. */
  endFlows: Readonly<{
    aorticValveMlPerSec: number;
    aortaToSystemicMlPerSec: number;
    coronary: Readonly<{ connected: true; inletFlowMlPerSec: number }> | Readonly<{ connected: false }>;
    /** Every additional branch/device contribution, positive INTO Ao. Supply
     * explicitly even when empty; the caller owns topology completeness. */
    otherNetInflowMlPerSecByBranch: Readonly<Record<string, number>>;
  }>;
  /** Optional positive finite inverse secant computed by the caller from the
   * actual fixed constitutive law. At coincident endpoints it may be that law's
   * explicitly computed limiting secant; no tangent is inferred here. */
  constitutiveSecantMmHgPerMl?: number;
}>;

/** Ao storage uses +AoV -Ao_SA -coronary-inlet +all-other-node-inflows.
 * Coronary inlet is the companion's actual Ao-connected total, not a duplicate
 * of excluded coronary graph edges. Pressure storage is transmural; changing
 * external pressure is retained separately when reconstructing absolute Ao. */
export function decomposeMainWireAorticStorageIntervalV1(input: MainWireAorticStorageIntervalInputV1) {
  const { previous, next, endFlows } = input;
  const interval = acceptedIntervalV1(previous.timeSec, next.timeSec, next.acceptedDtSec);
  for (const [label, endpoint] of [["previous", previous], ["next", next]] as const) {
    for (const key of ["volumeMl", "transmuralPressureMmHg", "absolutePressureMmHg"] as const) finiteV1(endpoint[key], `${label}.${key}`);
    if (!(endpoint.volumeMl > 0)) throw new Error(`${label}.volumeMl must be positive`);
  }
  const coronary = endFlows.coronary;
  if (coronary === undefined || coronary === null || typeof coronary !== "object"
    || (coronary.connected !== true && coronary.connected !== false)
    || (!coronary.connected && "inletFlowMlPerSec" in coronary)) {
    throw new Error("coronary connection and its actual inlet flow must be explicit");
  }
  const other = endFlows.otherNetInflowMlPerSecByBranch;
  if (other === null || typeof other !== "object" || Array.isArray(other)) {
    throw new Error("all other Ao branch contributions must be explicitly supplied");
  }
  const namedRates: Array<readonly [string, number]> = [
    ["AoV", finiteV1(endFlows.aorticValveMlPerSec, "AoV flow")],
    ["Ao_SA", -finiteV1(endFlows.aortaToSystemicMlPerSec, "Ao_SA flow")],
    ["coronary", coronary.connected ? -finiteV1(coronary.inletFlowMlPerSec, "coronary inlet flow") : 0],
  ];
  for (const [name, rate] of Object.entries(other).sort(([a], [b]) => a.localeCompare(b))) {
    if (name.trim().length === 0 || ["AoV", "Ao_SA", "coronary"].includes(name)) {
      throw new Error("other Ao branches must have nonempty, nonduplicated names");
    }
    namedRates.push([name, finiteV1(rate, `other Ao branch ${name}`)]);
  }
  const volumeChangeMl = finiteV1(next.volumeMl - previous.volumeMl, "Ao volume change");
  const transmuralChangeMmHg = finiteV1(next.transmuralPressureMmHg - previous.transmuralPressureMmHg, "Ao transmural pressure change");
  const absoluteChangeMmHg = finiteV1(next.absolutePressureMmHg - previous.absolutePressureMmHg, "Ao absolute pressure change");
  const externalChangeMmHg = finiteV1(absoluteChangeMmHg - transmuralChangeMmHg, "Ao external pressure change");
  const netInflowAtEndMlPerSec = finiteV1(namedRates.reduce((sum, [, rate]) => sum + rate, 0), "Ao endpoint net inflow");
  const fromFlowsChangeMl = finiteV1(interval.dtSec * netInflowAtEndMlPerSec, "Ao flow-based volume change");
  const continuityResidualMl = finiteV1(volumeChangeMl - fromFlowsChangeMl, "Ao continuity residual");

  let secantMmHgPerMl: number | null = null;
  let secantIssue: string | null = null;
  const secantSource = input.constitutiveSecantMmHgPerMl === undefined
    ? "observed-endpoint-pressure-volume-ratio" as const : "caller-supplied-constitutive-secant" as const;
  if (input.constitutiveSecantMmHgPerMl !== undefined) {
    secantMmHgPerMl = finiteV1(input.constitutiveSecantMmHgPerMl, "constitutive secant");
    if (!(secantMmHgPerMl > 0)) throw new Error("caller constitutive secant must be positive finite");
  } else if (volumeChangeMl === 0) {
    secantIssue = "zero-volume-change-no-secant-inferred";
  } else {
    const observed = transmuralChangeMmHg / volumeChangeMl;
    if (!Number.isFinite(observed) || observed < 0) secantIssue = "nonfinite-or-negative-observed-secant";
    else secantMmHgPerMl = observed;
  }
  const pressureFromVolume = (volume: number) => secantMmHgPerMl === null ? null
    : finiteV1(secantMmHgPerMl * volume, "secant pressure contribution");
  const branches = namedRates.map(([branchId, rate]) => {
    const volume = finiteV1(interval.dtSec * rate, `${branchId} volume contribution`);
    return Object.freeze({ branchId, endpointNetInflowMlPerSec: rate, volumeChangeMl: volume,
      transmuralPressureChangeMmHg: pressureFromVolume(volume) });
  });
  const constitutiveResidualMmHg = secantMmHgPerMl === null ? null
    : finiteV1(transmuralChangeMmHg - pressureFromVolume(volumeChangeMl)!, "constitutive endpoint residual");
  const flowStorageChangeMmHg = pressureFromVolume(fromFlowsChangeMl);
  const continuityResidualContributionMmHg = pressureFromVolume(continuityResidualMl);
  const reconstructedAbsoluteChangeMmHg = secantMmHgPerMl === null ? null : finiteV1(flowStorageChangeMmHg!
    + continuityResidualContributionMmHg! + constitutiveResidualMmHg! + externalChangeMmHg, "reconstructed absolute pressure change");
  const compliance = secantMmHgPerMl === null || secantMmHgPerMl === 0 ? null : 1 / secantMmHgPerMl;
  return Object.freeze({ methodId: MAIN_WIRE_EJECTION_BALANCE_DECOMPOSITION_V1_ID, interval,
    flowBasis: "backward-euler-same-accepted-endpoint-signed-node-flows" as const,
    coronaryConnected: coronary.connected,
    branches: Object.freeze(branches),
    volume: Object.freeze({ observedChangeMl: volumeChangeMl, fromFlowsChangeMl, netInflowAtEndMlPerSec, continuityResidualMl }),
    pressure: Object.freeze({ basis: "transmural-storage-plus-separate-external-pressure-change" as const,
      observedTransmuralChangeMmHg: transmuralChangeMmHg, observedAbsoluteChangeMmHg: absoluteChangeMmHg, externalChangeMmHg,
      secantMmHgPerMl, secantSource, secantIssue,
      complianceMlPerMmHg: compliance !== null && Number.isFinite(compliance) ? compliance : null,
      constitutiveResidualMmHg, flowStorageChangeMmHg, continuityResidualContributionMmHg,
      reconstructedAbsoluteChangeMmHg,
      absoluteClosureResidualMmHg: reconstructedAbsoluteChangeMmHg === null ? null
        : finiteV1(absoluteChangeMmHg - reconstructedAbsoluteChangeMmHg, "absolute pressure closure residual") }),
    caveats: Object.freeze([
      "Caller must supply every actual Ao branch; the arithmetic cannot verify topology or detect cancelling omissions.",
      "Continuity and constitutive residuals are retained, not silently assigned to a physiological mechanism.",
      "An observed secant makes constitutive closure algebraic; it is not independent validation of the vascular law.",
      "Endpoint-flow storage and interval product splits are discrete identities, not instantaneous derivatives or causal effects.",
      "No physiological range, smoothing, acceptance decision or production-state change is introduced.",
    ]) });
}
export type MainWireAorticStorageIntervalDecompositionV1 = ReturnType<typeof decomposeMainWireAorticStorageIntervalV1>;

function acceptedIntervalV1(startTimeSec: number, endTimeSec: number, acceptedDtSec: number) {
  finiteV1(startTimeSec, "start time"); finiteV1(endTimeSec, "end time"); finiteV1(acceptedDtSec, "accepted dt");
  const elapsedTimeSec = finiteV1(endTimeSec - startTimeSec, "elapsed accepted time");
  const tolerance = 128 * Number.EPSILON * Math.max(1, Math.abs(startTimeSec), Math.abs(endTimeSec), Math.abs(acceptedDtSec));
  if (startTimeSec < 0 || !(elapsedTimeSec > 0) || !(acceptedDtSec > 0) || Math.abs(elapsedTimeSec - acceptedDtSec) > tolerance) {
    throw new Error("increasing nonnegative accepted times and matching actual accepted dt are required");
  }
  // Backward Euler used the recorded accepted step h, not the rounded
  // subtraction of two potentially large accumulated clock values.
  return Object.freeze({ startTimeSec, endTimeSec, dtSec: acceptedDtSec, elapsedTimeSec });
}
function finiteV1(value: number, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}
