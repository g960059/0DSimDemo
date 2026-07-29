# INTEGRATED-MODEL-0005: frozen first-lane contract for the V3 browser lane

Status: **frozen contract proposal**. This is not a release record, an approval,
or evidence about physiology, numerics, or browser readiness. It executes
step 1 of `INTEGRATED-MODEL-0004-browser-lane-scope.md` section Q5 — freeze the
first-lane contract — plus the design of `advanceToPresentationTime`, which
Q5 step 3 hangs on.

Date: 2026-07-28
Branch: `feat/v3-browser-wiring`
Scope authority: `docs/scientific-runtime/INTEGRATED-MODEL-0004-browser-lane-scope.md`.
This document does not restate that study. It cites it and builds on it.

## How to read the labels

Every substantive claim below is tagged.

- **READ** — I opened the cited file and the cited lines say this. The
  file:line is the evidence.
- **INFER** — a conclusion I drew from READ facts. The reasoning is given so a
  reviewer can falsify it. No INFER claim is load-bearing without a required
  test naming it.
- **CHOICE** — a value that must be picked rather than read. My recommendation
  and its reason are given; the product owner may overrule it.

This labelling is not ceremony. In this workstream two confident analyses were
falsified by measurement because inferred facts were reported as read ones.

### Where the scope and the source disagree, the source wins

Four places, recorded here because they change the contract:

1. **The scope says V3 "rejects a caller that crosses" a boundary**
   (`INTEGRATED-MODEL-0004` line 25, line 327). **The source does not throw to
   the caller.** The `RangeError` at
   `engine/myocardium/MainWireIntegratedModelTransactionV3.ts:415-419` is
   raised inside the `try` opened at
   `engine/myocardium/MainWireIntegratedModelTransactionV3.ts:391` and caught at
   `engine/myocardium/MainWireIntegratedModelTransactionV3.ts:515-524`, which
   returns a `MainWireIntegratedModelStepFailureV3` with reason
   `"outer-input-clock-binding-or-boundary-rejected"`. **READ.** The advance
   loop in §2 must therefore inspect a returned discriminated failure, not
   catch an exception. A `try/catch`-shaped loop would silently mistake a
   boundary violation for an infrastructure fault.

2. **The scope's Q5 step 2 says to use "real content digests, not the smoke's
   repeated-character placeholder digests"**
   (`INTEGRATED-MODEL-0004` line 429), implying production code already does
   so. It does not. The production periodic fixture ships
   `profileBindingSha256: "0".repeat(64)`
   (`engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:1287`)
   and per-device `circuitProfileBindingSha256: digit.repeat(64)`
   (`engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:1303-1309`).
   **READ.** There is no production precedent for a real digest here, and
   nothing verifies one (see trap T11).

3. **The scope records a measured "15.2-16.0 ms per nominal 2 ms step"**
   (`INTEGRATED-MODEL-0004` line 369) and separately records that it could not
   reproduce that number (`INTEGRATED-MODEL-0004` line 566). The product owner
   now states the measured V3 step is **6.50 ms**, with identified
   optimisations landing near **4.6 ms**. This contract uses the owner's
   figures; the scope's 15.2-16.0 ms is treated as superseded. I did not
   benchmark (another process is measuring on this machine), so I verify
   neither figure. See §1.8 for the arithmetic, which does not follow from the
   owner's prose as stated.

4. **The scope §2.4 says the common lane seam contains `observe`,
   `advanceToPresentationTime`, operational checkpoint/restore and `dispose`.**
   That is the V3 session's internal surface, not a surface the existing lane
   exposes. `SimulationRuntimePortV1` actually exposes `openSession`,
   `startTargetIntent`, `promoteSteadyCandidate`,
   `subscribePresentationSignalChannel`, suspend/resume and `closeSession`
   (`studio/contracts/v1/ports.ts:24-85`). **READ.** Its adapter exposes
   `openSession` at
   `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:362-425`,
   the signal subscription at `:534-548` and `closeSession` at `:574-606`,
   while live advancement/publishing and Worker rotation are private at
   `:1879-2010`, `:2072-2148` and `:2193-2343`. **READ.** The V3 browser host
   exposes the complete driver mechanism — preset creation, observation,
   ordinal advancement, operational checkpoint/restore, disposal and
   termination — at
   `engine/scientificBrowser/MainWireIntegratedScientificBrowserHostV1.ts:79-109`.
   **READ.**

   **Correction to scope §2.4:** the common seam is stream-shaped. Every lane
   supplies immutable lane/execution identity, the exhaustive §3 capability
   descriptor, presentation-signal subscription, capability-gated
   suspend/resume, and close. Open is lane-discriminated: the non-coronary
   member consumes its existing run/input/snapshot references, while V3 uses a
   new non-persisted Worker-owned-preset open command. Intents and promotion
   live on an optional sub-interface supplied only by the non-coronary member.
   Observation, advancement and operational checkpoint/restore are not common
   seam members; each concrete driver owns them privately. **INFER from the
   two READ surfaces above, resolved by the product owner.** This preserves the
   current adapter without making either lane claim a method or capability it
   does not have.

---

# 1. The frozen lane contract

Everything in this section is identity-bearing. Per `INTEGRATED-MODEL-0004`
Q5 step 1, these bytes feed the checkpoint context, the release SHA, the
observable-catalog SHA, and the worker preset selection. Changing any of them
after step 5 mints a different lane, not a corrected one.

## 1.1 Lane identity and display identity

**CHOICE.** No lane descriptor type exists yet; every value here is picked.

| Field | Value |
|---|---|
| `laneKind` (discriminator) | `"integrated-v3-experimental"` |
| `laneId` | `"integrated-coronary-sinus-hmii-9000-experimental-v1"` |
| `displayName` | `Experimental — coronary + sinus + HMII 9000` |
| `badge` | `Experimental · development · unverified` |
| release `id` | `"main-wire-integrated-coronary-sinus-hmii-experimental"` |
| release `version` | `"0.0.1"` |
| `lifecycleStatus` | `"development"` |
| `evidenceStatus` | `"unverified"` |
| release `sha256` | **not choosable now** — minted at Q5 step 5 from the manifest bytes |

`lifecycleStatus` and `evidenceStatus` are existing enum members, not new ones:
`"development"` at `engine/scientific/release/simulationRelease.ts:21-26` and
`"unverified"` at `engine/scientific/release/simulationRelease.ts:30-36`.
**READ.**

Reason for the `laneKind` string: it names both the transaction generation and
the honesty level, so a future non-experimental integrated lane needs a new
member rather than a mutated meaning. Reason for the separate `laneId`: the
kind is the code discriminator; the id is what the checkpoint context, the
manifest and the case catalog bind, and it must change if the preset changes
even when the kind does not.

The existing non-coronary lane becomes the sibling member
`laneKind: "noncoronary-v1"` with all of its current capabilities. **CHOICE**,
following `INTEGRATED-MODEL-0004` section 2.4.

## 1.2 The exact regular-sinus configuration

**This is the single most important finding of this document, and it changes
the scope's step 2.**

`INTEGRATED-MODEL-0004` Q5 step 2 says to "move the bounded-smoke construction
into production-owned code without importing the test helper", implying the
only regular-sinus construction lives in the smoke. **A production-owned,
numerically identical one already exists.** **READ:**

- `engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:1087-1249`
  — `createRegularSinusComposedRhythmV3()`, production file, not a test.
- `engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:320-380`
  — `createMainWireIntegratedModelRegularSinusAllOffFixtureV3()`, which
  assembles it with the coronary inputs of §1.3.

I compared it field by field against the smoke's `composedSinusRhythm()`
(`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:438-598`). Every
numeric parameter is identical. The **only** differences are the identifier
strings (`periodic-v3-*` versus `real-provider-v3-*`) and
`recoveryTimeConstantSec`, written as the literal `1`
(`...PeriodicSteadyV3.ts:1181`) versus `CYCLE_SEC` which is also `1`
(`...SmokeV3.test.ts:528`, with `CYCLE_SEC = 1` at
`...SmokeV3.test.ts:107`). **READ.**

The frozen configuration is therefore:

| Owner | Parameter | Value | Evidence |
|---|---|---|---|
| Regular atrial source | `rhythmClass` | `"sinus"` | `...PeriodicSteadyV3.ts:1120` |
| | `cycleLengthSec` | `1` | `...PeriodicSteadyV3.ts:1121` |
| Electrical capture | atrial `refractoryPeriodSec` | `0.2` | `...PeriodicSteadyV3.ts:1096` |
| | ventricular `refractoryPeriodSec` | `0.25` | `...PeriodicSteadyV3.ts:1100` |
| Proximal AV gate | `minimumConductionDelaySec` | `0.125` | `...PeriodicSteadyV3.ts:1179` |
| | `recoveryDelayAmplitudeSec` | `0` | `...PeriodicSteadyV3.ts:1180` |
| | `recoveryTimeConstantSec` | `1` | `...PeriodicSteadyV3.ts:1181` |
| | `postConductionRefractorySec` | `0.25` | `...PeriodicSteadyV3.ts:1182` |
| | `concealedRefractoryExtensionSec` | `0` | `...PeriodicSteadyV3.ts:1183` |
| Distal gate | `hvConductionDelaySec` | `0.0625` | `...PeriodicSteadyV3.ts:1193` |
| | `distalEffectiveRefractoryPeriodSec` | `0` | `...PeriodicSteadyV3.ts:1194` |
| | `modeConfiguration` | `{ mode: "pass" }` | `...PeriodicSteadyV3.ts:1195` |
| Ventricular backup | `intrinsicEscapeCycleLengthSec` | `2` | `...PeriodicSteadyV3.ts:1205` |
| | `vviLowerRateLimitPerMin` | `30` | `...PeriodicSteadyV3.ts:1207` |
| Interval strength | `recoveryTimeConstantSec` | `0.5` | `...PeriodicSteadyV3.ts:1110` |
| | `releaseFractionBeta` | `0.8` | `...PeriodicSteadyV3.ts:1111` |
| | `releasedLoadReturnFractionR` | `0.5` | `...PeriodicSteadyV3.ts:1112` |
| | `intervalInfluxInhibitionFractionH` | `0.2` | `...PeriodicSteadyV3.ts:1113` |
| | `referenceCycleLengthSec` | `1` | `...PeriodicSteadyV3.ts:1114` |
| Ectopy schedule | `events` | `[]` | `...PeriodicSteadyV3.ts:1168` |
| Authored pacing replay | — | `null` | `...PeriodicSteadyV3.ts:1171` |
| Atrial calcium deposit | `electricalToCalciumDelaySec` | `0.0625` | `...PeriodicSteadyV3.ts:1218` |
| PAC atrial deposit | — | `null` | `...PeriodicSteadyV3.ts:1223` |
| Ventricular deposit | `electricalToCalciumDelaySec` | `0.0625` | `...PeriodicSteadyV3.ts:1225` |
| Calcium parameters | five walls, converted from `FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1` at cycle `1` | — | `...PeriodicSteadyV3.ts:1123-1154`, `...:1210-1216` |
| Cold seed | `regularFirstFutureActivationTimeSec` | `0.625` | `...PeriodicSteadyV3.ts:1236` |
| | `acceptedTimeSec` | `0` | `...PeriodicSteadyV3.ts:1235` |
| | `initialNormalizedSrLoadState` | `interval.referenceNormalizedSrLoadState` | `...PeriodicSteadyV3.ts:1239` |
| | five wall calcium states | `zeroExactEventCalciumStateV1()` | `...PeriodicSteadyV3.ts:1240-1246` |

Atrial source mode is `"regular"` with `externalAfOwnerInstanceId: null`
(`...PeriodicSteadyV3.ts:1158-1162`). **READ.** This is what makes the lane
structurally incapable of accepting external AF through two independent
defences. A non-null `externalAfNextBoundaryTimeSec` is rejected by the
composed-rhythm limiter
(`engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2.ts:707-708`) and
throws through the advance loop. With that boundary null, a non-null
`externalAtrialSourceBatch` reaches `externalBatchForCandidate` and is returned
by the advance as a discriminated transaction failure
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:628-635`). **READ.**

**CHOICE — the configuration identifier strings.** These are the one thing that
must be decided rather than read, and they are identity-bearing: the checkpoint
stores `composedRhythmConfigurationIdentitySha256`
(`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:114`, computed at
`...:158`) as the canonical-JSON SHA-256 of the whole configuration object,
which includes every `configurationId` and `ownerInstanceId` string. **READ.**

My recommendation: **mint new `integrated-lane-v1-*` ids, do not reuse
`periodic-v3-*`.** Reason: reusing the periodic fixture's ids would make the
lane's checkpoint identity equal to the periodic-evidence fixture's identity,
so a future change to the periodic evidence protocol — which is a research
artefact with its own lifecycle — would silently change the shipped lane's
identity, or worse, be blocked by it. The numbers should be shared by extracting
the builder to take an id prefix; the *identity* should not. This is Open
Decision O2 because the opposite choice (share the identity so the lane is
provably the same object the periodic study characterised) is a defensible
scientific position that I am not entitled to make.

`parameterProvenance.sourceId` is currently
`"bounded-periodic-v3-construction"` (`...PeriodicSteadyV3.ts:1108`,
`...:1177`, `...:1191`, `...:1202`). **CHOICE:** if new ids are minted, this
must become a lane-specific string; leaving it would attribute the lane's
parameters to the periodic construction.

## 1.3 The exact coronary prior / disease / collapse / autoregulation inputs

Every value here is **READ** from
`engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:330-368`,
and each is byte-identical to the smoke
(`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:118-152`).
Nothing in this subsection is a choice; the lane adopts the existing
production-owned constants by reference.

| Input | Constant | Defined in |
|---|---|---|
| `coronaryPrior` | `MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2` | `engine/coronary/mainWireNormalAdultCoronaryV2.ts` |
| `coronaryDisease` | `NORMAL_CORONARY_DISEASE_INPUT_V2` | `engine/coronary/backwardEulerCoronaryNetworkV2.ts` |
| `collapseHydraulics` | `MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2` | `engine/coronary/mainWireNormalAdultCoronaryV2.ts` |
| `impMechanism` | `"cep-shortening-induced"` | literal, `...PeriodicSteadyV3.ts:336` |
| `shorteningImpPrior` | `NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2` | `engine/coronary/mainWireCoronaryBoundaryV2.ts` |
| `runtime` | `normalAdultMainWireRuntimeV1()` | `engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1.ts` |
| `pericardium` | `createMainWireNormalAdultCommonPericardiumV1()` | `engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1.ts` |
| `calciumDriveParams` | `FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1` | `engine/myocardium/calcium/fiveWallNormalCalciumDriveV1.ts` |
| `circulationNewtonOptions` | `MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2` | `engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2.ts` |
| `fixedGlobalTotalBloodVolumeMl` | `MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1.fullGraphReferenceTotalBloodVolumeMl` | `engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1.ts` |
| `autoregulationWindow.durationSec` | `1` | `...PeriodicSteadyV3.ts:357` |
| `autoregulationWindow.interpretation` | `"periodic-sinus-cycle-aligned"` | `...PeriodicSteadyV3.ts:358` |
| provider | `createCanonicalMainWireNormalAdultFiveWallProviderV1()` | `engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1.ts` |

The autoregulation window duration is **not independently choosable**. With
`interpretation: "periodic-sinus-cycle-aligned"`,
`assertColdRhythmCoronaryWindowPolicy` requires the window duration to equal the
sinus cycle length and the coronary calcium cycle length to equal it too
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:832-869`), and
`assertAcceptedRhythmCoronaryWindowPolicy` re-checks it on every step
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:871-900`). **READ.**
So `cycleLengthSec = 1` in §1.2 and `durationSec = 1` here are one frozen
decision, not two.

**No coronary autoregulation drive is supplied.** `coronaryAutoregulationDrive`
is an optional step-input field
(`engine/myocardium/MainWireFiveWallCoronaryTransactionV3.ts:102-103`,
permitted at `engine/myocardium/MainWireIntegratedModelTransactionV3.ts:795`)
and the production fixture omits it (`...PeriodicSteadyV3.ts:329-342`).
**READ.** The lane omits it too. **CHOICE**, reason: supplying a demand drive
would be an unexposed, unvalidated input that the UI could not name, and the
autoregulation owner already advances on its own window.

## 1.4 MCS config and inertance profile — and the approval hazard

### Config

`mechanicalSupportPresetV1("lvad-hmii-9000")`
(`engine/devices/presetsV1.ts:38-51`). **READ.** It sets `lvad.enabled: true`,
`speedRpm: 9_000`, the HeartMate II literature curve, the HMII cannula segment
as both drainage and return path, the Choi inlet-suction model,
`maximumForwardFlowLMin: null`, and the HMII forward-flow evidence domain.
IABP remains disabled by the preset default; the lane relies on this, because
`dynamicMechanicalSupportHeartRateBpm` rejects IABP outside regular sinus
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:928-946`). **READ.**

### The profile, and how it is named without implying approval

**The hazard is real and the source states it plainly.**
`engine/devices/dynamicNetworkV1.ts:52-55`:

> "This module intentionally defines no release-approved circuit profile."

**READ.** Two further facts make this worse than the scope records, and both
are **READ**:

1. **The digest is never checked against content.**
   `validateDynamicMechanicalSupportInertanceProfileV1`
   (`engine/devices/dynamicNetworkV1.ts:347-381`) validates `profileBindingSha256`
   only as a 64-character lowercase hex string, via the `sha256` helper against
   `SHA256_HEX = /^[0-9a-f]{64}$/` (`engine/devices/dynamicNetworkV1.ts:45`). It
   never recomputes it from `inertanceByDevice`. The type comment says so
   directly (`engine/devices/dynamicNetworkV1.ts:65-70`): the digests "remain
   release metadata", and "live acceptance never trusts those strings alone".
2. **Both existing V3 profiles carry meaningless placeholder digests.** The
   smoke uses `"a".repeat(64)`
   (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:696`) and
   per-device `digit.repeat(64)` (`...:712-719`); the **production** periodic
   fixture uses `"0".repeat(64)`
   (`engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:1287`)
   and `digit.repeat(64)` (`...:1303-1309`).

So a digest that merely *looks* real would be the exact recurring defect this
document exists to prevent: a field whose name asserts content-addressing that
nothing computes or verifies.

**The contract.** The first lane governs its profile by four mechanisms, in
order of strength:

1. **The profile id carries its own disclaimer, in the identity string.**
   **CHOICE:**
   `profileId: "heartmate-ii-literature-r-l-lane-v1-experimental-not-release-approved"`
   and per device
   `circuitProfileId: "integrated-lane-v1-<device>-experimental-not-release-approved"`.
   Reason: `profileId` is copied verbatim into the accepted state's detached
   snapshot (`engine/devices/dynamicNetworkV1.ts:127`), into the hydraulic
   evaluation (`engine/devices/dynamicNetworkV1.ts:157`), and into the
   checkpoint's profile identity digest
   (`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:159-161`). A
   disclaimer placed there cannot be stripped by a UI change, a doc rewrite, or
   a serialisation round trip. A disclaimer in a comment can.
2. **The digests are computed, not written.** The lane preset must compute
   `profileBindingSha256` and each `circuitProfileBindingSha256` with
   `sha256CanonicalJsonHex` over the corresponding content and assert equality
   at construction. This does not make the profile approved; it makes the field
   mean what its name says. See trap T11 for the check.
3. **The manifest states the negative explicitly.** The step-5 manifest must
   carry `dynamicMcsInertanceProfileReleaseApproved: false as const` and
   `dynamicMcsInertanceProfileProvenance: "literature-circuit-inertance-not-independently-validated"`.
   **CHOICE.** Reason: a `false as const` literal is greppable and a reviewer
   can diff it; prose cannot be diffed.
4. **The UI carries the limitation string** in §1.7.

**Content.** The LVAD inertance is
`HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1`
(`engine/devices/defaultsV1.ts:80-86`): `pumpInternalMmHgSec2PerMl: 0.02177`,
`drainageMmHgSec2PerMl: 0.0127`, `oxygenatorMmHgSec2PerMl: 0`,
`returnPathMmHgSec2PerMl: 0.0127`. **READ.** The other three devices take the
explicit all-zero circuit, as both existing profiles do
(`...SmokeV3.test.ts:686-708`, `...PeriodicSteadyV3.ts:1278-1299`). **READ.**

What the lane must **never** say: that this profile is approved, validated,
patient-derived, or that its digest attests to anything. It is a literature
circuit inertance, production-owned so that no test file is on the browser
import path, and explicitly not approved.

## 1.5 The minimal observable catalog

**CHOICE** throughout — the owner fixed the *set*; the ids, units and source
paths are picked here. `sourceKind` and `availability` values reuse the existing
vocabulary (`engine/scientific/observables/MainWireScientificObservableRegistryV1.ts:16-59`).
**READ** for the vocabulary; **READ** for every source path cited.

Catalog id: `"main-wire-integrated-v3-experimental-observable-registry-v1"`.
Frame id: `"main-wire-integrated-v3-experimental-observable-frame-v1"`.
This is a **new** registry. It does not extend, reuse or reconfigure
`MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID`.

| Observable id | Unit | Kind | sourceKind | Source path | Evidence |
|---|---|---|---|---|---|
| `hemodynamics.volume.LV` | mL | volume | accepted-state | `accepted.coronary.circulation.nodeVolumesMl.LV` | `engine/core/nonCoronaryCirculationBackwardEulerV1.ts:245`; `LV` at `:56` |
| `hemodynamics.pressure.absolute.LV` | mmHg | pressure | accepted-step-readback | `step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.LV` | `engine/core/nonCoronaryCirculationBackwardEulerV1.ts:506` |
| `hemodynamics.pressure.absolute.Ao` | mmHg | pressure | accepted-step-readback | `…nodeAbsolutePressuresMmHg.Ao` | same; `Ao` at `:57` |
| `coronary.flow.total` | mL/s | flow | accepted-step-readback | `step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.totalInletFlowMlPerSec` | `engine/coronary/backwardEulerCoronaryNetworkV2.ts:141`; nesting at `:161`, `:164-170` |
| `coronary.flow.inlet.LAD` | mL/s | flow | accepted-step-readback | `…hydraulics.inletFlowMlPerSecByTerritory.LAD` | `engine/coronary/backwardEulerCoronaryNetworkV2.ts:116`; territory ids at `engine/coronary/typesV2.ts:1-5` |
| `coronary.flow.inlet.LCx` | mL/s | flow | accepted-step-readback | `…inletFlowMlPerSecByTerritory.LCx` | same |
| `coronary.flow.inlet.RCA` | mL/s | flow | accepted-step-readback | `…inletFlowMlPerSecByTerritory.RCA` | same |
| `device.LVAD.flow` | mL/s | flow | accepted-state | `accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD` | `engine/devices/dynamicNetworkV1.ts:130`; read this way at `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:417-418` |

Note the exact field name `nodeAbsolutePressuresMmHg` — **plural** — on the
circulation trial (`engine/core/nonCoronaryCirculationBackwardEulerV1.ts:506`).
The singular `nodeAbsolutePressureMmHg` is a *different* structure, the
diagnostic sample used by the non-coronary experiment path
(`engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1.ts:63`).
**READ.** An implementer who copies the non-coronary session's projection will
reach for the wrong one.

The three territory inlet flows are included. **CHOICE.** Reason: they are three
scalar reads off a record the total is already summed from
(`engine/coronary/backwardEulerCoronaryNetworkV2.ts:1334`, `:1343`), so the
projection cost is nil, and a coronary lane whose only coronary signal is a
single total is hard for a researcher to sanity-check. Confirmed as Open
Decision O3 because it fixes the catalog SHA.

### Status fields — explicitly *not* observables

These are lane status, carried outside the observable frame so no chart can
plot them as physiology and no catalog SHA depends on their formatting.

| Status | Source | Evidence |
|---|---|---|
| model time | `accepted.acceptedTimeSec` | `engine/myocardium/MainWireIntegratedModelTransactionV3.ts:154` |
| accepted revision | `accepted.revision` | `engine/myocardium/MainWireIntegratedModelTransactionV3.ts:153` |
| internal substep count | §2 advance result | — |
| atrial / ventricular capture counts | `accepted.composedRhythm.acceptedAtrialCaptureCount`, `.acceptedVentricularCaptureCount` | read this way at `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:408-410` |
| rhythm label | fixed string `"Regular sinus"` | derived from §1.2, not computed |
| MCS label | fixed string `"HMII 9000"` | derived from §1.4, not computed |
| pacing | `RuntimeLivePacingStateV1` | `studio/contracts/v1/runtime.ts:202-229` |

### Availability rules

**Cold start and post-restore:** every `accepted-step-readback` observable is
`availability: "not-evaluated-at-accepted-state"`, `value: null`. Only the two
`accepted-state` observables are `"available"`. **INFER**, from the fact that a
cold or restored state has no step readback at all — there is no
`circulationTrial` and no `coronaryTrial` object to read. The non-coronary
session does exactly this for the same reason
(`engine/scientific/runtime/MainWireScientificSessionV1.ts:1815-1826`, where
vascular pressures and valve flows are `null` /
`"not-evaluated-at-accepted-state"` at cold). **READ** for the precedent.

**Failed step:** the frame must not advance. The previous frame is retained and
no sample is emitted; see §2.6.

**Never zero for unavailable.** The existing registry declares
`unavailableValuePolicy: "null-never-zero"`
(`engine/scientific/observables/MainWireScientificObservableRegistryV1.ts:151`).
**READ.** The V3 registry adopts the same literal.

## 1.6 Checkpoint context

The operational checkpoint context is fully determined by §1.2-§1.4. Its type is
`MainWireIntegratedModelCheckpointContextV3`
(`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:98-107`): the coronary
checkpoint context plus `rhythm`, `dynamicMechanicalSupportProfile` and
`dynamicMechanicalSupportConfig`. **READ.** The concrete construction to mirror
is `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:628-649`, which
supplies the provider, coronary prior, collapse hydraulics, imp mechanism,
shortening prior, the accepted state's own
`coronaryAutoregulationBinding`, the rhythm configuration, and the profile and
config. **READ.**

This checkpoint is operational only. Its own claim says
`migrationClaimed: false`, `clockRebaseClaimed: false`,
`longTermPhysiologicalValidationEstablished: false`,
`clinicalValidationClaimed: false`, `simulationReady: false`
(`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:88-96`). **READ.** It
is used for Worker rotation and nothing else. It is never written to the
artifact store, never offered as a save, and never described as warm-restartable.

## 1.7 The exact limitation wording the UI must carry

**Amended 2026-07-29.** Limitation 7 originally read *"This lane runs below realtime."* That was true
when this contract was frozen, at roughly 0.21x, and it became **false** once the step reached
1.66 ms/accepted step and the lane measured **1.016x realtime** in a browser. A limitation string that
asserts a performance property the code has since disproved is the same defect this document exists to
prevent, so the string now states what is actually guaranteed — that the rate is measured rather than
declared, and that running below realtime is expected rather than a fault — without claiming a
direction. The lane identity SHA moved accordingly, as it must when a claim changes.


**CHOICE.** Frozen as an ordered, immutable array. The UI renders these strings
verbatim; it does not paraphrase them, and it does not render a subset.

```ts
export const INTEGRATED_V3_LANE_LIMITATIONS_V1 = Object.freeze([
  "Experimental lane. Development lifecycle, unverified evidence. This is not a release.",
  "Fixed input. Regular sinus at a 1.000 s cycle, normal-adult coronary priors, and a HeartMate II LVAD at 9,000 rpm. Nothing on this lane can be adjusted.",
  "Regular sinus only. Atrial fibrillation, other non-sinus rhythms, and IABP are not available on this lane.",
  "The LVAD circuit inertance profile is production-owned and explicitly not release-approved.",
  "Not clinically validated, not patient-specific, and not fitted to any patient or waveform.",
  "Cold, transient exploration. Periodic steady state is not established, and long-term physiological behaviour is not established.",
  "This lane reports the rate it actually achieves, measured rather than declared. That rate depends on the machine and on how many lanes are open, and running slower than realtime is expected here rather than a fault.",
  "Live view only. There is no exact 0.002 s export, no saved snapshot, and no steady-state candidate on this lane.",
] as const);
```

Strings 1, 2, 3, 5, 6 and 7 discharge the six bullets of
`INTEGRATED-MODEL-0004` Q4 "Visible product wording". Strings 4 and 8 are added:
4 because of the §1.4 hazard, 8 because the capability matrix turns those
actions off and a user is owed the reason before they go looking.

Each string is traceable to a source claim rather than to opinion: string 1 and
5 to `releaseReady: false` / `clinicalValidationClaimed: false`
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:117-118`), string 3
to the regular-mode external-AF rejection
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:628-635`) and the
open IABP blocker
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:111-114`), string 4
to `engine/devices/dynamicNetworkV1.ts:52-55`, string 6 to
`longTermPhysiologicalValidationEstablished: false`
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:116`). **READ.**

## 1.8 The pacing arithmetic, stated honestly

The owner's figures are 6.50 ms measured per V3 step against 2 ms needed for
1× realtime, with identified optimisations landing near 4.6 ms ≈ 0.43×.

- At **6.50 ms**: achieved rate = 2 / 6.50 = **0.308×**; a 1 s (60 bpm) beat
  costs 500 × 6.50 ms = **3.25 s** of wall clock.
- At **4.6 ms**: achieved rate = 2 / 4.6 = **0.435×**; a 1 s beat costs
  **2.30 s**.

The owner's "~2.3 s per beat" corresponds to the **4.6 ms optimised** figure,
not to the 6.50 ms measured one. **INFER**, arithmetic only. I flag it because
the lane's *shipped* first behaviour is the 3.25 s number, and a UI or document
promising 2.3 s would be the same class of overclaim this contract is guarding
against. I did not benchmark and verify neither figure.

Boundary substeps make this slightly worse, not better: an interval containing a
rhythm boundary costs two V3 steps instead of one (§2). This is why the lane
must **measure** its achieved rate through
`RuntimeLivePacingStateV1.recentAchievedRate`
(`studio/contracts/v1/runtime.ts:210-223`) rather than derive it from a step
count. **READ** for the field; **INFER** for the consequence.

---

# 2. Driver-private `advanceToPresentationTime(targetTimeSec)`

## 2.1 The problem in one paragraph

V3 clips a requested step at the coronary autoregulation-window cap and at
composed-rhythm event boundaries, and a step whose requested candidate time is
not exactly the clipped time is **rejected as a returned failure**
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:404-419`, caught at
`:515-524`). Studio equates one accepted revision with one 2 ms grid step:
phase is `revision % 500` (`studio/contracts/v1/runtime.ts:54-61`) and exact
replay asserts `revision += 1` with `time += 0.002` per frame
(`studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:441-473`).
**READ.** These cannot both be true for a V3 lane.

**And the boundaries genuinely fall inside presentation intervals.** The smoke
asserts a pending distal ventricular impulse at exactly **0.8125 s**
(`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:346-348`).
**READ.** 0.8125 / 0.002 = 406.25 — it lies strictly between grid ordinals 406
and 407. This is not a hypothetical. More generally, every conduction and
deposit delay in §1.2 is a dyadic rational (0.0625, 0.125, 0.625) while 0.002
is not exactly representable in binary, so grid alignment is the exception
rather than the rule. **INFER** for the generalisation; **READ** for 0.8125.

## 2.2 Signature

The operation lives on the V3 scientific session, inside the Worker. It is
synchronous: `stepMainWireIntegratedModelV3` is synchronous
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:378`). **READ.** The
Worker *command* that wraps it is asynchronous; the two must not be conflated.
**It is a V3 driver-private pacing mechanism, not a member of the common Studio
lane seam.** The Studio-facing driver advances by presentation ordinal and
pushes the resulting samples through its subscription channel.

```ts
/**
 * Advance the accepted V3 tuple to exactly `targetTimeSec`, taking as many
 * internal event-clipped substeps as the coronary window and composed-rhythm
 * boundaries require. Exactly one presentation sample corresponds to one
 * successful call. Internal substeps are not samples and are not ordinals.
 */
advanceToPresentationTime(
  targetTimeSec: number,
): MainWireIntegratedLanePresentationAdvanceV1;
```

`targetTimeSec` must be produced by, and only by:

```ts
export const INTEGRATED_LANE_PRESENTATION_DT_SEC_V1 = 0.002 as const;

/** Pure, drift-free grid map. The ordinal is the sample identity. */
export function integratedLanePresentationTargetTimeSecV1(
  presentationOrdinal: number,
): number {
  if (!Number.isSafeInteger(presentationOrdinal) || presentationOrdinal < 0) {
    throw new Error("integrated lane presentation ordinal is invalid");
  }
  return presentationOrdinal * INTEGRATED_LANE_PRESENTATION_DT_SEC_V1;
}
```

**CHOICE**, and the reason matters: computing the target as
`previousTarget + 0.002` accumulates floating-point drift over a lane that runs
for minutes, and drift here is not cosmetic — it changes which side of a rhythm
boundary a target lands on, and therefore changes the numerics. Multiplying an
integer ordinal is drift-free by construction and makes the ordinal, not the
float, the sample identity.

The lane's origin is `t = 0`, because cold initialisation seeds
`acceptedTimeSec: 0` (`...PeriodicSteadyV3.ts:1235`, and
`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:277` takes
`input.coronary.timeSec ?? 0`). **READ.** So ordinal *n* ↔ time *n* × 0.002 with
no offset term.

## 2.3 The loop

```
precondition:
  if targetTimeSec <  accepted.acceptedTimeSec  -> throw (caller bug)
  if targetTimeSec === accepted.acceptedTimeSec -> return { status: "already-at-target", ... }

substepCount := 0
substeps    := []

while (accepted.acceptedTimeSec !== targetTimeSec) {

  if (substepCount >= INTEGRATED_LANE_MAX_SUBSTEPS_PER_INTERVAL_V1)
    return failed("substep-budget-exhausted")

  limit := limitMainWireIntegratedModelCandidateTimeV3(
             accepted, targetTimeSec,
             { configuration: rhythmConfiguration,
               externalAfNextBoundaryTimeSec: null },
             profile, config)

  if (!(limit.candidateTimeSec > accepted.acceptedTimeSec))
    return failed("candidate-time-did-not-advance")

  result := stepMainWireIntegratedModelV3(provider, accepted, {
              candidateTimeSec: limit.candidateTimeSec,
              coronary: frozenCoronaryStepInput,
              rhythm: { configuration: rhythmConfiguration,
                        externalAfNextBoundaryTimeSec: null,
                        externalAtrialSourceBatch: null },
              dynamicMechanicalSupport: { config, profile },
            })

  if (result.converged === false)
    return failed(result.reason, result.message)   // discriminated, not thrown

  accepted := result.acceptedState
  substepCount += 1
  substeps.push(record(limit, result))
  lastSuccessfulStep := result
}

return advanced(accepted, lastSuccessfulStep, substepCount, substeps)
```

Three points deserve justification.

### Why the exit test is exact `!==`, not a tolerance

**INFER, with a strong supporting mechanism.** The V3 step computes
`candidateDtSec = candidateTimeSec - previous.acceptedTimeSec`
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:421`) and the
circulation computes `candidateTimeSec = previous.acceptedTimeSec + input.dtSec`
(`engine/core/nonCoronaryCirculationBackwardEulerV1.ts:873`), which becomes the
accepted time (`engine/core/nonCoronaryCirculationBackwardEulerV1.ts:1222`,
`:1296`), which the integrated wrapper adopts
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:587`). **READ.** So
the accepted time is `a + (b − a)`, which is not identically `b` in IEEE-754
arithmetic in general.

It is here, for two independent reasons:

1. By Sterbenz's lemma, `b − a` is computed exactly whenever `a/2 ≤ b ≤ 2a`.
   Since times advance and `b − a ≤ 0.002 ≪ a` for all `a > 0.002`, and the
   `a = 0` case is exact trivially, the subtraction is exact; and when the
   subtraction is exact, `a + (b − a)` rounds to exactly `b`.
2. **More importantly, the transaction fails closed if it is not.** The
   composed rhythm commits at exactly `candidateTimeSec`, and
   `validateMainWireIntegratedModelAcceptedStateV3` rejects the promoted state
   with `"composed integrated accepted owner clocks differ"` if
   `state.composedRhythm.acceptedTimeSec !== state.acceptedTimeSec`
   (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:566-573`), using
   strict `!==`. **READ.** That validation runs inside
   `wrapMainWireIntegratedModelAcceptedStateV3`
   (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:592-597`), inside
   the step's `try`, so a clock mismatch surfaces as a step failure with reason
   `"integrated-promotion-rejected"`, never as a silently drifted state.

Therefore the loop's contract is: **either `acceptedTimeSec === targetTimeSec`
bit-exactly, or the call returns a failure.** There is no third outcome and no
tolerance is needed. A tolerance would be worse than useless — it would mask
exactly the drift the transaction already detects. Required test: T-A1.

### Why the loop must inspect a returned failure, not catch

Restated from the "source wins" note: the `RangeError` for a boundary crossing
is caught internally (`...TransactionV3.ts:515-524`). A `catch`-based loop would
see nothing. **READ.**

But `limitMainWireIntegratedModelCandidateTimeV3` **does** throw to the caller —
it is not wrapped. It throws `"composed integrated requested endpoint must
advance"` when the target does not advance
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:333-335`) and
`"composed integrated coronary-capped step must be positive"` when the coronary
window cap is zero (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:349-351`).
**READ.** The second is reachable in principle:
`maximumCoronaryAutoregulationStepDurationV3` returns literal `0` when the
accepted clock sits at the window end
(`engine/coronary/acceptedAutoregulationWindowV3.ts:195-201`). **READ.** In
practice the window index advances on completion — the smoke observes
`windowIndex: 1, acceptedDurationSec: 0` at t = 1.0
(`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:402-407`) — so
the remaining duration resets to a full window. **INFER** that the zero case is
unreachable for well-formed accepted states. The loop must still guard it
(`candidate-time-did-not-advance`) rather than assume it, and the guard must be
tested by construction rather than by hoping.

### Why a substep budget exists

**CHOICE:** `INTEGRATED_LANE_MAX_SUBSTEPS_PER_INTERVAL_V1 = 16`. The composed
rhythm exposes at most seven boundary owners from one accepted state
(`engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2.ts:1282-1301`:
regular atrial source, authored ectopy, authored pacing replay, pending proximal
AV output, pending distal ventricular impulse, ventricular backup, pending
calcium deposit) — **READ** — of which the lane's fixed configuration disables
ectopy and pacing replay. Plus one coronary window cap. Sixteen is comfortable
headroom, matches the existing audited
`maximumTransientStepCountPerCommand: 16`
(`engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1.ts:13`,
**READ**), and turns a hypothetical non-progress bug into a reported failure
instead of a frozen tab. It is a backstop, not the termination mechanism.

## 2.4 What it returns

```ts
export const INTEGRATED_LANE_PRESENTATION_COVERAGE_V1 =
  "integrated-v3-live-presentation" as const;

/** One internal accepted commit. Not a sample. Has no ordinal and no values. */
export type MainWireIntegratedLaneSubstepRecordV1 = Readonly<{
  acceptedRevision: number;
  acceptedTimeSec: number;
  landedOnPresentationTarget: boolean;
  clippedByCoronaryWindow: boolean;
  clippedByRhythmBoundary: boolean;
  rhythmBoundaryTimeSec: number | null;
  rhythmBoundaryOwners: readonly string[];
}>;

export type MainWireIntegratedLanePresentationAdvanceV1 =
  | Readonly<{
      status: "advanced";
      /** Exactly the requested target. Asserted, not assumed. */
      presentationTimeSec: number;
      acceptedTimeSec: number;      // === presentationTimeSec
      acceptedRevision: number;     // NOT an ordinal, NOT a sample index
      acceptedRevisionSpanFromPrevious: number;  // >= 1, often 1, sometimes 2+
      internalAcceptedSubstepCount: number;      // >= 1
      boundaryClippedSubstepCount: number;       // substeps that did not land on target
      substeps: readonly MainWireIntegratedLaneSubstepRecordV1[];
      observation: MainWireIntegratedLaneObservationV1;
    }>
  | Readonly<{
      status: "already-at-target";
      presentationTimeSec: number;
      acceptedTimeSec: number;
      acceptedRevision: number;
      internalAcceptedSubstepCount: 0;
      observation: MainWireIntegratedLaneObservationV1;
    }>
  | Readonly<{
      status: "failed";
      reason:
        | MainWireIntegratedModelStepFailureReasonV3
        | "substep-budget-exhausted"
        | "candidate-time-did-not-advance";
      message: string;
      /** True model state after the failure. NOT the requested target. */
      acceptedTimeSec: number;
      acceptedRevision: number;
      /** True when substeps committed before the failing one. */
      partiallyAdvanced: boolean;
      internalAcceptedSubstepCount: number;
      requestedPresentationTimeSec: number;
    }>;
```

`MainWireIntegratedModelStepFailureReasonV3` is the existing union
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:228-231`). **READ.**

**The failure variant admits partial advance, and this is deliberate.** If
substep 1 succeeds and substep 2 fails, the session sits at an *off-grid*
accepted time. Rolling back would require a per-interval checkpoint, and
`checkpointMainWireIntegratedModelV3` is async and hashes the entire coronary,
rhythm and MCS state
(`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:129-186`) — **READ** —
which is not affordable per 2 ms interval. So the honest design reports the true
state and lets the caller retry the *same ordinal*, which remains a valid target
because it is still strictly greater than the accepted time. A retry budget must
be declared by the driver; a deterministically repeating failure must fail the
branch rather than spin. **CHOICE.**

## 2.5 How the returned sample is identified in time

Two independent identities, never conflated:

- **Presentation identity:** `(presentationOrdinal, presentationTimeSec)`. The
  ordinal is owned by the driver, increments by exactly 1 per emitted sample,
  and is the only thing a chart's x-axis and any retention/stride logic may use.
- **Model identity:** `(acceptedRevision, acceptedTimeSec)`. Owned by the
  transaction. `acceptedRevision` increments by the number of internal
  substeps — 1 usually, 2 or more across a boundary — and is **never** an
  ordinal, an index, or a phase input.

The bridging invariant, asserted at the lane boundary on every `"advanced"`
result: `acceptedTimeSec === presentationTimeSec ===
integratedLanePresentationTargetTimeSecV1(presentationOrdinal)`. If it does not
hold, the lane fails rather than emits.

**Phase is not reported.** **CHOICE**, and this is a real restriction. The
obvious formula `acceptedTimeSec mod 1` would be wrong: the first sinus
activation is seeded at 0.625 s (`...PeriodicSteadyV3.ts:1236`, **READ**), so
the beat is not aligned to integer seconds, and a phase computed that way would
place a "canonical beat boundary" in mid-systole. The correct alternative —
deriving phase from the composed rhythm's own accepted ventricular activation —
is a real design with a real cost, and it is not needed to draw LV volume
against time. So the first lane reports **no** presentation phase and **no**
beat estimates, and the capability matrix says so (§3). Consequences: no
`RuntimePresentationBeatEstimateV1`, no per-beat metrics, no
`canonical-beat-boundary` retention reason.

## 2.6 Reporting substeps without letting them be mistaken for samples

Five mechanisms, each independently sufficient to catch a mistake:

1. **Different type.** `MainWireIntegratedLaneSubstepRecordV1` has no
   `presentationOrdinal`, no `values`, no `coverage`, no `phase`, and no
   `retentionReason`. It is structurally unassignable to
   `RuntimePresentationSampleV1`
   (`studio/contracts/v1/runtime.ts:93-102`, **READ**).
2. **Different names.** The field is `internalAcceptedSubstepCount`. Not
   `stepCount`, not `sampleCount`, not `frameCount`. A reviewer grepping for
   `sampleCount` will not find substeps hiding behind it.
3. **Different coverage literal.** `"integrated-v3-live-presentation"`, distinct
   from both `RUNTIME_PRESENTATION_COVERAGE_V1 = "decimated-presentation"`
   (`studio/contracts/v1/runtime.ts:31-32`) and
   `EXACT_SIGNAL_REPLAY_COVERAGE_V1` (`studio/contracts/v1/export.ts:24-25`).
   **READ.**
4. **No values.** A substep record carries no observable values at all, so it
   cannot be projected into a chart even by accident.
5. **A counting test.** T-A2 below: an interval containing the 0.8125 s boundary
   must produce `internalAcceptedSubstepCount === 2` and exactly **one** emitted
   sample, with `acceptedRevisionSpanFromPrevious === 2` and the ordinal
   incremented by 1.

The substep records exist so the lane can *explain* why a given interval was
slow and which rhythm owner fired — `rhythmBoundaryOwners` comes straight from
the limiter (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:370`,
**READ**). They are diagnostics. If carrying them per interval proves too heavy
on the Worker message path, the correct reduction is to carry only the counts
and drop the array — never to promote them to samples.

## 2.7 Every Studio contract site that would be wrong, with a verdict

Verdicts: **fix** = this increment must change it; **bypass** = correct where it
is, V3 must not route through it, and it must not be widened; **refuse** = V3
must not implement or construct it at all.

| # | Site | Why it is wrong for V3 | Verdict |
|---|---|---|---|
| 1 | `studio/contracts/v1/runtime.ts:54-61` `runtimePresentationCanonicalPhaseV1` | Derives phase from `revision % 500`. V3 revisions are not 2 ms ordinals. | **bypass** — correct for the non-coronary lane; never call from V3 |
| 2 | `studio/contracts/v1/runtime.ts:67-76` `runtimePresentationStepsToNextCanonicalBoundaryV1` | Same revision-as-grid assumption. | **bypass** |
| 3 | `studio/contracts/v1/runtime.ts:93-102` `RuntimePresentationSampleV1` | `phase` is unavailable (§2.5); `acceptedStepSpanFromPrevious` means revisions, which for V3 is not a presentation span; `coverage` literal is the non-coronary one. | **refuse** — new DTO |
| 4 | `studio/contracts/v1/runtime.ts:140-162` `RuntimePresentationBeatEstimateV1` | Requires `bothCanonicalBeatBoundariesRetained: true`, `revisionsContiguous`, `cadenceUniform`. None are establishable. | **refuse** |
| 5 | `studio/contracts/v1/runtime.ts:164-176` `RuntimePresentationMetricStateV1` | `"complete"` requires a beat estimate. | **refuse** — lane reports no metric state |
| 6 | `studio/contracts/v1/runtime.ts:231-236` `INITIAL_RUNTIME_LIVE_PACING_STATE_V1` | Hardcodes `mode: "realtime-1x"`. V3 cannot open at 1× (§1.8). | **fix** — V3 needs its own initial pacing state, or the mode must be measurement-derived from the first chunk |
| 7 | `studio/contracts/v1/runtime.ts:273-284` `OpenScenarioRuntimeBranchV1` / `OpenSimulationSessionCommandV1` | Requires `sourceRunRef`, `sourceInputRef`, `sourceSnapshotRef`, `initialTargetInputSha256`. V3 cold-starts from a Worker preset and has none. | **refuse** — new non-persisted open command (Q5 step 7) |
| 8 | `studio/contracts/v1/runtime.ts:309-336` control intent types | Controls are capability-off; no owner-preserving V3 transition protocol exists. | **refuse** |
| 9 | `studio/contracts/v1/runtime.ts:383-395` `RuntimeSteadyCandidateV1` | Literal `steadyStatus: "converged"`, `numericalHealth: "passed"`. | **refuse** |
| 10 | `studio/contracts/v1/runtime.ts:413-424` `PromoteSteadyCandidateCommandV1` | Requires a candidate that cannot exist. | **refuse** |
| 11 | `studio/contracts/v1/runtime.ts:537-567` `ScenarioRuntimeBranchStateV1` | Requires run/input/snapshot refs, `latestSteadyCandidate`, `pinnedRunRefs`. | **refuse** — lane-discriminated branch state |
| 12 | `studio/contracts/v1/runtime.ts:202-229` `RuntimeLivePacingStateV1` | Nothing. It is correct for V3 and is the mechanism for reporting `degraded` and `recentAchievedRate`. | **reuse unchanged** |
| 13 | `studio/contracts/v1/ports.ts:24-87` `SimulationRuntimePortV1` | Every method is mandatory, including `startTargetIntent` and `promoteSteadyCandidate`. A V3 driver cannot implement them honestly, and implementing-then-throwing is precisely the defect the capability matrix exists to prevent. | **refuse** — do not implement, do not widen the port |
| 14 | `studio/contracts/v1/export.ts:97-103,141-153` exact export coverage and claims | Promises `dtSec: 0.002`, `observationStride: 1`, `acceptedStepRevisionAndTimeContinuityValidated: true`, `presentationSamplesConsumed: false`. | **refuse** |
| 15 | `studio/contracts/v1/artifacts.ts:67-81` `StudioRunArtifactContentV1` | Asserts `steadyStatus: "converged"`, `numericalHealth: "passed"`, `snapshotIsWarmRestartable: true`. | **refuse** |
| 16 | `studio/contracts/v1/analysis.ts:14-33` `StudioSettledAnalysisSourceV1` | Requires an artifact-bound settled V4 snapshot source. | **refuse** |
| 17 | `studio/adapters/mainWire/MainWireStudioSessionHostV1.ts:73-113` | `restoreV4`, `forkControl`, `settlePeriodic`, `checkpointV4` are mandatory; `runTransient` takes `(dtSec, stepCount)`, which is the false one-step-one-sample assumption in its signature. | **refuse** — new V3 host interface |
| 18 | `studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:441-473` `assertTransientChunkV1` | Asserts `revision + stepCount` and `time + stepCount × 0.002`, and for stride 1 `revision + 1` per frame. | **bypass** — correct for the exact lane; must not be relaxed to accommodate V3 |
| 19 | `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:2214`, `:3266`, `:3272` | Computes `phase` from `frame.revision` and `acceptedStepSpanFromPrevious` as a revision delta. | **bypass** — new V3 projector |
| 20 | `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:153` `LIVE_HOST_ROTATION_REQUEST_COUNT_V1 = 90_000`, with `maximumRequestCountPerLifetime: 100_000` at `engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1.ts:11` | The threshold was chosen for a lane whose request:model-time ratio differs. A 0.31× lane consumes requests per second of model time at a different rate. | **fix** — the V3 lane must declare its own rotation threshold (Open Decision O5) |
| 21 | `components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1.ts:200-206` | Throws for any supplied value whose catalog entry is `not-modeled` — which is exactly `coronary.flow.total` and `device.LVAD.flow`. | **bypass** — never route V3 values through it |
| 22 | `engine/scientific/observables/MainWireScientificObservableRegistryV1.ts:108-109` | Declares `coronary.flow.total` and `device.LVAD.flow` `not-modeled` / `capability-placeholder`. | **must not change** — flipping these would falsify the shipped 0.2.0 release and its checked-in catalog |
| 23 | `engine/scientific/runtime/MainWireScientificExactCheckpointV3.ts` / `...V4.ts` | Named "V3"/"V4" but fix the **non-coronary** assembly and transaction. Unrelated to `MainWireIntegratedModelCheckpointV3`. | **refuse** — never import from the V3 lane |

Sites 1, 2, 18, 19, 21, 22 are the dangerous ones, because they are *correct
code* that a well-meaning implementer would "generalise". The verdict for all of
them is: leave them alone and route around them.

---

# 3. The capability matrix, as data

The scope's requirement is that unavailable actions are absent or disabled
*before* invocation, not throwing after (`INTEGRATED-MODEL-0004` line 151). That
requires a value the UI can read, and a reason it can display.

## 3.1 Shape

```ts
export const INTEGRATED_V3_LANE_KIND_V1 = "integrated-v3-experimental" as const;

export type StudioLaneCapabilityUnavailableReasonV1 =
  | "not-implemented-for-this-lane"
  | "no-owner-preserving-transition-protocol"
  | "no-periodic-tracker-for-this-lane"
  | "no-versioned-persisted-artifact-for-this-lane"
  | "accepted-revision-is-not-a-presentation-sample-index"
  | "protocol-bound-to-noncoronary-accepted-state"
  | "no-canonical-beat-boundary-for-this-lane"
  | "blocked-by-open-release-blocker"
  | "out-of-scope-for-this-increment";

export type StudioLaneCapabilityV1 =
  | Readonly<{ available: true }>
  | Readonly<{
      available: false;
      reason: StudioLaneCapabilityUnavailableReasonV1;
      /** Rendered verbatim next to the disabled control. */
      explanation: string;
    }>;

export type StudioLaneCapabilitiesV1 = Readonly<{
  liveWorkerExecution: StudioLaneCapabilityV1;
  decimatedLivePresentation: StudioLaneCapabilityV1;
  livePacingReporting: StudioLaneCapabilityV1;
  suspendResumePresentation: StudioLaneCapabilityV1;
  operationalWorkerRotationCheckpoint: StudioLaneCapabilityV1;
  interactiveResearchControls: StudioLaneCapabilityV1;
  strictPeriodicSettlement: StudioLaneCapabilityV1;
  steadyCandidatePromotion: StudioLaneCapabilityV1;
  candidatePinning: StudioLaneCapabilityV1;
  persistedWarmSnapshot: StudioLaneCapabilityV1;
  exactSignalExport: StudioLaneCapabilityV1;
  presentationBeatEstimates: StudioLaneCapabilityV1;
  hemodynamicSideAnalysis: StudioLaneCapabilityV1;
  pvRelationsSideAnalysis: StudioLaneCapabilityV1;
  tbvContinuationSeedPrediction: StudioLaneCapabilityV1;
  externalAfRhythm: StudioLaneCapabilityV1;
  iabpSupport: StudioLaneCapabilityV1;
  releaseOrCandidateIdentity: StudioLaneCapabilityV1;
}>;

export type StudioLaneDescriptorV1 = Readonly<{
  laneKind: typeof INTEGRATED_V3_LANE_KIND_V1 | "noncoronary-v1";
  laneId: string;
  displayName: string;
  badge: string;
  releaseRef: SimulationReleaseRef;
  lifecycleStatus: SimulationReleaseLifecycleStatusV1;
  evidenceStatus: SimulationReleaseEvidenceStatusV1;
  observableCatalogId: string;
  observableCatalogSha256: string;
  limitations: readonly string[];
  capabilities: StudioLaneCapabilitiesV1;
}>;
```

The record is **exhaustive over the key set**, not a partial map. Reason: a
partial map lets a new capability default to "available" by omission, which is
the failure mode this structure exists to prevent. A missing key must be a type
error.

## 3.2 Values for this lane

| Capability | Value | Reason | Explanation string |
|---|---|---|---|
| `liveWorkerExecution` | `true` | — | — |
| `decimatedLivePresentation` | `true` | — | — |
| `livePacingReporting` | `true` | — | — |
| `suspendResumePresentation` | `false` | `out-of-scope-for-this-increment` | "Suspend and resume presentation are out of scope for this increment." |
| `operationalWorkerRotationCheckpoint` | `true` | internal only; never user-visible | — |
| `interactiveResearchControls` | `false` | `no-owner-preserving-transition-protocol` | "This experimental lane runs one fixed input. Controls need a transition protocol that preserves the coronary, rhythm and device state, which this lane does not have yet." |
| `strictPeriodicSettlement` | `false` | `no-periodic-tracker-for-this-lane` | "Periodic settlement needs a periodicity tracker for the integrated model. This lane has none." |
| `steadyCandidatePromotion` | `false` | `no-periodic-tracker-for-this-lane` | "There is no settled candidate to promote on this lane." |
| `candidatePinning` | `false` | `no-versioned-persisted-artifact-for-this-lane` | "Pinning writes a run artifact that asserts a converged, warm-restartable state. This lane has neither." |
| `persistedWarmSnapshot` | `false` | `no-versioned-persisted-artifact-for-this-lane` | "This lane's checkpoint is internal only. It is not a portable or restorable saved state." |
| `exactSignalExport` | `false` | `accepted-revision-is-not-a-presentation-sample-index` | "Exact 0.002 s export is not available for this experimental lane." |
| `presentationBeatEstimates` | `false` | `no-canonical-beat-boundary-for-this-lane` | "Per-beat metrics need a canonical beat boundary, which this lane does not define." |
| `hemodynamicSideAnalysis` | `false` | `protocol-bound-to-noncoronary-accepted-state` | "This analysis runs on the non-coronary model and cannot read this lane's state." |
| `pvRelationsSideAnalysis` | `false` | `protocol-bound-to-noncoronary-accepted-state` | same wording |
| `tbvContinuationSeedPrediction` | `false` | `protocol-bound-to-noncoronary-accepted-state` | same wording |
| `externalAfRhythm` | `false` | `out-of-scope-for-this-increment` | "This lane is regular sinus only." |
| `iabpSupport` | `false` | `blocked-by-open-release-blocker` | "IABP needs an accepted ventricular event-triggered owner, which is not integrated yet." |
| `releaseOrCandidateIdentity` | `false` | `out-of-scope-for-this-increment` | "This lane has a development, unverified identity. It is not a release or a release candidate." |

The `iabpSupport` reason is not editorial: V3 records
`iabpAcceptedVentricularSynchronization: "open"`
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:112-113`) and
`dynamicMechanicalSupportHeartRateBpm` throws with that exact rationale
(`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:932-937`). **READ.**

The three side-analysis reasons are likewise sourced: the hemodynamic and PV
protocols take a non-coronary checkpoint or accepted state and invoke the
non-coronary transaction directly (`INTEGRATED-MODEL-0004` section 2.2, "Scientific
side-analysis protocols" row, with its file:line list).

## 3.3 The UI rule that makes this worth doing

The descriptor is the **only** source for whether an action renders. A component
must not consult `laneKind` to decide whether to show Export; it must consult
`capabilities.exactSignalExport.available`. Reason: `laneKind` checks scatter and
rot, and a third lane silently inherits whichever branch the `if` fell through
to. Required check: trap T9.

---

# 4. What the lane must never claim, as checkable assertions

The scope lists ten guarantee traps in prose. Prose does not fail a build. Each
becomes an assertion with a grep or a named test. `<lane>` means the set of files
constituting the V3 lane (session, preset, registry, worker protocol, driver,
UI), which the step-2 commit must enumerate in one place so these greps are
mechanically scopeable.

| # | Assertion | Check |
|---|---|---|
| T1 | The non-coronary claim still types `coronaryCirculationIncluded: false as const` and `deviceGraphIncluded: false as const`. | `grep -n "coronaryCirculationIncluded\|deviceGraphIncluded" engine/scientific/runtime/MainWireScientificSessionV1.ts` must show `false as const` at `:128-129`. Existing `__tests__/mainWireScientificSessionV1.test.ts:80-85` must stay green **unmodified**. |
| T2 | The V3 lane never touches the non-coronary session checkpoint envelopes. | `grep -rn "MainWireScientificExactCheckpointV3\|MainWireScientificExactCheckpointV4\|MainWireScientificSessionExactCheckpointV[34]" <lane>` returns nothing. New test asserts the lane's checkpoint `checkpointId` is `MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID`. |
| T3 | No V3 value ever enters a `not-modeled` slot of the V1 registry. | `grep -rn "projectMainWireScientificObservationV1\|ScientificProductStudioObservableFrameProjectionV1\|MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1" <lane>` returns nothing. Existing `__tests__/mainWireScientificObservableRegistryV1.test.ts` stays green unmodified. |
| T4 | No run artifact is minted for the live-only lane. | `grep -rn "StudioRunArtifactContentV1\|STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID" <lane>` returns nothing. New test: opening the lane, advancing 500 ordinals and closing performs **zero** artifact-store writes. |
| T5 | No presentation trace is described as exact. | The lane's sample `coverage` literal is `"integrated-v3-live-presentation"` and is neither `RUNTIME_PRESENTATION_COVERAGE_V1` nor `EXACT_SIGNAL_REPLAY_COVERAGE_V1`. `grep -rn "ExactSignalExport\|EXACT_SIGNAL" <lane>` returns nothing. |
| T6 | Phase is never derived from accepted revision. | `grep -rn "runtimePresentationCanonicalPhaseV1\|runtimePresentationStepsToNextCanonicalBoundaryV1" <lane>` returns nothing. Positive test T-A2 asserts a 2-revision span against a 1-ordinal increment. |
| T7 | The inertance profile is not called approved, and its digests mean what they say. | `profileId` and every `circuitProfileId` match `/not-release-approved$/`. New test recomputes `sha256CanonicalJsonHex` over the profile's own content and asserts equality with `profileBindingSha256` — and a second test substitutes a placeholder and asserts construction fails. `grep -rn "repeat(64)" <lane>` returns nothing. |
| T8 | No bounded-cycle or all-off evidence is described as active-MCS validation. | The lane manifest asserts `longTermPhysiologicalValidationEstablished: false` and `activeMcsPeriodicSteadyEvidence: "none"`. Test asserts the UI limitation array is exactly `INTEGRATED_V3_LANE_LIMITATIONS_V1` — same length, same order, same strings. |
| T9 | No action is offered that the capability record denies. | `grep -rn "laneKind ===" <lane UI>` returns nothing outside the descriptor factory. New test enumerates every capability key, renders the lane, and asserts each `available: false` capability has no enabled control and does render its `explanation`. |
| T10 | Release 0.2.0's identity, badge, claims, protocols and limitations are not reused. | `grep -rn "main-wire-adult-five-wall-noncoronary\|0\.2\.0\|verified-research" <lane>` returns nothing. Existing `__tests__/mainWireScientificProductReleaseBundleRegistryV1.test.ts:20-53` stays green unmodified. |
| T11 | *(new)* A profile digest is never a hand-written literal. | Covered by T7's recompute-and-compare. Necessary because `validateDynamicMechanicalSupportInertanceProfileV1` checks only hex format (`engine/devices/dynamicNetworkV1.ts:347-381`) and both existing profiles ship placeholders (`...PeriodicSteadyV3.ts:1287`, `...SmokeV3.test.ts:696`). |
| T12 | *(new)* Substeps are never counted as samples. | Test T-A2. |
| T13 | *(new)* A failed advance emits no sample. | New test: force a step failure mid-interval; assert zero samples appended, `status: "failed"`, and that the reported `acceptedTimeSec` is the true value and **not** `requestedPresentationTimeSec`. |
| T14 | *(new)* The lane never opens claiming `realtime-1x`. | `grep -rn "INITIAL_RUNTIME_LIVE_PACING_STATE_V1\|\"realtime-1x\"" <lane>` returns nothing outside a measurement-derived assignment. Test asserts the first published pacing state has a measured or null `recentAchievedRate`, never a hardcoded 1× mode. |
| T15 | *(new)* The operational checkpoint is never presented as a save. | `grep -rn "checkpointMainWireIntegratedModelV3" <lane>` appears only on the rotation path. Test asserts the checkpoint is never handed to the artifact store and that `persistedWarmSnapshot.available === false`. |

## 4.1 Required tests for §2

Named so a reviewer can check they exist.

- **T-A1 — exact landing.** For 500 consecutive ordinals from cold, every
  `"advanced"` result satisfies `acceptedTimeSec === presentationTimeSec`
  with `===`, not `toBeCloseTo`. This is the test that makes the §2.3
  floating-point INFER load-bearing rather than hopeful.
- **T-A2 — boundary inside an interval.** Advance to the ordinal whose interval
  contains 0.8125 s (ordinal 407, spanning 0.812 → 0.814). Assert
  `internalAcceptedSubstepCount === 2`, `acceptedRevisionSpanFromPrevious === 2`,
  exactly one emitted sample, the ordinal advanced by 1, and one substep record
  with `clippedByRhythmBoundary: true` and `rhythmBoundaryTimeSec === 0.8125`.
- **T-A3 — lockstep.** Advancing 500 ordinals through
  `advanceToPresentationTime` yields an accepted state deep-equal to driving
  `limitMainWireIntegratedModelCandidateTimeV3` +
  `stepMainWireIntegratedModelV3` directly in the smoke's loop shape
  (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:238-341`).
- **T-A4 — retry purity.** Re-issuing the same advance after a failure produces
  an identical result and does not mutate the previous accepted state. The smoke
  already demonstrates this at the single-step level
  (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:269-287`).
- **T-A5 — exact continuation across checkpoint.** Checkpoint mid-interval and
  at an interval boundary, restore, continue, and assert the resumed state
  equals the uninterrupted one — the smoke's structure at
  `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:349-400`,
  extended to a mid-interval (off-grid) origin.
- **T-A6a — external AF boundary is refused by the limiter.** Supplying a
  non-null `externalAfNextBoundaryTimeSec` makes the advance throw with a
  message matching
  `/regular atrial mode must not supply an external AF boundary/`
  (`engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2.ts:707-708`).
- **T-A6b — external AF batch is refused by the transaction.** Supplying a
  non-null `externalAtrialSourceBatch` with the boundary null makes the advance
  return `status: "failed"` rather than throw, with a reason from
  `MainWireIntegratedModelStepFailureReasonV3` and a message matching
  `/regular composed rhythm rejects external AF inputs/`
  (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:628-633`).
  These are independent defences at two layers; collapsing them into one path
  would silently remove a defence.

---

# 5. Open decisions — RESOLVED by the product owner, 2026-07-28

The five questions below were put to the product owner and answered. The answers are
binding for this increment; the original framing of each question is retained beneath
its resolution so a reviewer can see what was traded away.

| # | Decision | Resolution |
|---|---|---|
| **O1** | Unapproved MCS inertance profile in a user-visible lane | **Accepted, governed by identity-embedded disclaimer.** Implement §1.4 in full: `profileId` and every `circuitProfileId` end in `-experimental-not-release-approved`; `profileBindingSha256` and every `circuitProfileBindingSha256` are computed with `sha256CanonicalJsonHex` over their own content and asserted at construction; the manifest carries `dynamicMcsInertanceProfileReleaseApproved: false as const`. Trap T7 and T11 are mandatory, including the negative test that a placeholder digest fails construction. |
| **O2** | Configuration identifier strings | **Mint new `integrated-lane-v1-*` ids.** The lane's identity is decoupled from the periodic-evidence fixture's lifecycle. Share the numbers by extracting the builder to take an id prefix; do not share the identity. `parameterProvenance.sourceId` must become lane-specific rather than `"bounded-periodic-v3-construction"`. |
| **O3** | Territory inlet flows in the first catalog | **Included.** `coronary.flow.inlet.LAD`, `.LCx` and `.RCA` ship in the first observable catalog and are fixed into its SHA. |
| **O4** | `suspendResumePresentation` in the first capability set | **Not included.** The first worker protocol stays minimal per scope Q5 step 6. The capability record therefore carries `suspendResumePresentation: { available: false, reason: "out-of-scope-for-this-increment" }` — it is still an explicit, displayed capability, not an omission. |
| **O5** | Worker-rotation threshold | **75,000 requests, provisional.** Step 6 measured a 47,938-byte checkpoint at model time 1 s/revision 504, with checkpoint production median 2.698 ms, `JSON.stringify` median 0.043 ms and operational restore median 28.905 ms in Node. At one request per presentation ordinal, 75,000 requests buys 150 simulated seconds and leaves 25,000 requests below the audited 100,000 lifetime cap. Structured-clone cost, long-session memory growth, browser rotation latency and user-visible interruption remain unmeasured, so this is explicitly not an audited final threshold. |

## 5.1 The original questions, for the record

### Original framing

#### Open decisions for the product owner

Five. Each is genuinely underdetermined — an implementer defaulting one of these
would be making a product or scientific call, not a coding call.

**O1 — Who owns the unapproved inertance profile, and is shipping it in a
user-visible lane acceptable?**
No release-approved dynamic MCS inertance profile exists
(`engine/devices/dynamicNetworkV1.ts:52-55`, **READ**). §1.4 proposes governing
it by putting the disclaimer inside the identity string, computing real digests,
and stating `dynamicMcsInertanceProfileReleaseApproved: false` in the manifest.
That is the strongest mitigation available without an approval process. The
question that remains is whether a lane whose LVAD hydraulics rest on an
unapproved profile should be visible to users at all in this increment, and if
so, who signs that off. I can make it honest; I cannot make it approved.

**O2 — New `integrated-lane-v1-*` configuration ids, or reuse `periodic-v3-*`?**
These strings enter `composedRhythmConfigurationIdentitySha256`
(`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:114`, `:158`) and
therefore the lane's identity. New ids decouple the shipped lane from the
periodic-evidence fixture's lifecycle (my recommendation, §1.2). Reused ids make
the lane provably the same configuration object the periodic study
characterised, which has real scientific value. This is a trade between
independence and traceability, and it is not mine to settle.

**O3 — Do the three territory inlet flows ship in the first catalog?**
The owner's minimum lists them as optional. Including them costs nothing
computationally (§1.5) but fixes them into the observable-catalog SHA and thus
into the manifest. Excluding them means a researcher sees only a summed total.
Decide before Q5 step 4, because step 5 hashes the result.

**O4 — Is `suspendResumePresentation` in the first capability set?**
I recommend yes (§3.2): it makes no scientific claim and a lane running at 0.31×
that cannot be paused is unpleasant. But it adds a Worker command and a state
transition to the first protocol, which Q5 step 6 deliberately keeps minimal.
This is a scope call.

**O5 — What is the V3 lane's Worker-rotation threshold?**
The non-coronary lane rotates at 90,000 requests against an audited 100,000
lifetime cap (`studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:153`,
`engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1.ts:11`,
**READ**). The V3 lane's requests-per-second-of-model-time differs, and its
checkpoint payload — a full coronary, rhythm and MCS state
(`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:109-122`) — has an
unmeasured serialisation cost. I was instructed not to benchmark, so I cannot
propose a number. It must be measured and chosen before Q5 step 6, not
inherited.

---

# 6. What I verified, and what I did not

**Independently re-verified in this checkout (READ):**

- At contract-freeze time, nothing under `studio/` or `components/` imported
  the V3 lane. Ordered steps 2-6 subsequently added the production preset,
  session, registry, identity and browser host. Step 7 now adds imports only in
  the new `studio/adapters/mainWire/StudioLiveLaneV1.ts`,
  `studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1.ts` and
  `studio/adapters/mainWire/MainWireStudioLiveLaneFactoryV1.ts`; no pre-existing
  Studio file and no component imports V3. Exhaustive `grep`, not an inference.
  The original non-coronary adapter therefore remains a separate, unchanged
  member rather than being widened.
- The boundary `RangeError` is caught internally and returned as a failure
  (correcting the scope; §"source wins" item 1).
- The production periodic fixture ships placeholder profile digests, and
  profile digests are never content-verified (correcting the scope's step-2
  premise; §"source wins" item 2, trap T11).
- A production-owned regular-sinus composed-rhythm builder already exists at
  `engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:1087`
  and is numerically identical to the smoke's, differing only in identifier
  strings. This materially reduces Q5 step 2.
- Rhythm boundaries fall strictly inside presentation intervals — 0.8125 s,
  asserted by an existing passing test.
- `maximumCoronaryAutoregulationStepDurationV3` can return literal `0`
  (`engine/coronary/acceptedAutoregulationWindowV3.ts:195-201`), which would make
  the limiter throw; the window-index advance appears to make this unreachable,
  but the loop guards it anyway.
- Step 7 verification passed with 73 regression files/601 tests and 120 fast
  files/1,017 tests, including the unchanged non-coronary adapter suite, the
  real V3 500-ordinal lockstep, event-boundary and operational-checkpoint tests,
  and the new stream-driver/factory tests. TypeScript, the suite manifest,
  repository hygiene and both scientific browser-bundle boundary verifiers
  also passed.

**Not verified, and why:**

1. **Performance.** I did not benchmark; another process is measuring on this
   machine. Both 6.50 ms and 4.6 ms are taken as given from the owner. The
   scope's 15.2-16.0 ms figure is treated as superseded, and the scope itself
   could not reproduce it (`INTEGRATED-MODEL-0004` line 566).
2. **The floating-point exactness argument in §2.3** is an INFER backed by
   Sterbenz's lemma plus a fail-closed validation in the transaction. T-A1 now
   verifies the required exact endpoint invariant across 500 ordinals; that
   passing execution does not turn the explanatory lemma argument itself into
   a source READ.
3. **Substep frequency.** I did not count how many rhythm boundaries occur per
   beat under the frozen configuration, so I did not estimate the substep
   overhead on the achieved rate beyond "small and positive". The lane must
   measure, not estimate.
4. **Browser-specific rotation cost and long-session behaviour.** Step 6
   measured checkpoint size, production, JSON serialisation and restore in
   Node (§5 O5). Structured-clone cost, browser rotation latency,
   user-perceived interruption and long-session memory growth remain
   unmeasured, which is why 75,000 is provisional.
5. **Which observables researchers actually want** is unresolved and unresolvable
   from the source. §1.5 implements the owner's stated minimum; O3 asks the one
   question that changes the catalog SHA.
