# INTEGRATED-MODEL-0033: transient systemic venous-return reduction Engineering V1 result

Status: **retained scientific failure; characterization not established**.

This document records the single create-only execution declared by
INTEGRATED-MODEL-0031 and narrowed by INTEGRATED-MODEL-0032. The run is not
repeated, repaired, or retrospectively reclassified.

## Frozen result identity

| Field                    | Exact value                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| declaration commit       | `a775a6aa64565e8feceb0a53b17c70e896c5fd27`                                                   |
| evidence addendum commit | `3c2bcff48bb470bc8f0f730fa7d0083f22263ec9`                                                   |
| implementation commit    | `a9fb20b281912ca72712ca08e68ef370989527b2`                                                   |
| protocol payload SHA-256 | `6b4d5557c7f711708e1958e05ef76553eab1d7b8fcd50c57ff8cda310f6b73c9`                           |
| artifact payload SHA-256 | `2a851337ed35fb0858209c64a883002a9834c59f7db0236c9a2b0a97b655b5bb`                           |
| raw artifact SHA-256     | `81a37af6c8f68497efb75102d737f6b28bb8a2e837dc2089f30790bf04358a26`                           |
| raw artifact size        | `100788` bytes                                                                               |
| artifact path            | `artifacts/transient-preload/transient-systemic-venous-return-reduction-engineering-v1.json` |

The raw file is canonical JSON with exactly one terminal newline. The committed
verifier requires the implementation, payload, raw-file, byte-count,
declaration, and addendum identities above in addition to the generic
structural audit.

## What completed

The canonical source was reconstructed internally and independently replayed as
period-1:

- terminal accepted time: `71 s`;
- terminal accepted revision: `71142`;
- terminal cycle index: `71`;
- terminal period-1 maximum normalized delta:
  `9.627467769572906e-4`;
- checkpoint exact restore, condition identity, protocol identity, accepted
  time, revision, and coronary-window identity: all passed.

The fixed 21-beat intervention then completed without a trajectory or integrity
failure:

- all `21` beat executions were retained in exact order;
- retained per-beat counts sum to `21042` accepted steps and `42`
  event-boundary-clipped steps; no successful-step records are committed;
- each in-memory raw beat contained `1003` accepted PV endpoints, for `21063`
  endpoints in total; the artifact retains only each beat's count and hash,
  not the raw endpoint arrays;
- fixed global total blood volume remained `5600 mL`;
- maximum global-TBV error was `2.7284841053187847e-12 mL`;
- maximum coronary blood-volume ledger residual was
  `8.793219553101389e-10 mL`;
- maximum dynamic-MCS conservation residual was `0 mL/s`; and
- every beat passed its finite, conservation, event-identity, calcium-owner,
  and all-off MCS gates.

The intervention also produced the intended systemic venous-return response.
The retained within-beat range changed from `48.20496257648881` to
`137.59307726493506 mL/s` in the baseline beat to `26.99336397730686` to
`33.840500194184465 mL/s` in plateau beat 10 at resistance scale `8`. Across
all 21 beats, the minimum and maximum retained systemic venous return were
`26.99336397730686` and `165.2205169783568 mL/s`, respectively. These are
descriptive accepted-trajectory values, not a qualified venous-return curve.

## Where the protocol failed

Projection began only after all 21 beats had completed. The frozen landmark
owner then returned:

```text
failureClass: landmark-unavailable
exception: Error: LV beat 1 lacks semilunar closure
```

The required closure landmark was the first positive-to-nonpositive `AoV` flow
crossing after the beat's maximum positive flow, with no fallback. That exact
crossing was not found in baseline beat 1. Consequently:

- compact loop and landmark projection did not complete;
- producer raw-to-projection replay was not entered and is retained as `null`;
- all relation, support-envelope, and hysteresis payloads are `null`; and
- `transientVenousReturnReductionCharacterizationCompleted` is `false`.

The artifact retains `completedBeatCount = 21` and `failedBeatOrdinal = 21`
because the current producer assigns a batch projection failure to the terminal
retained beat after the complete trajectory; the sanitized exception localizes
the first unavailable landmark to LV beat 1. This field convention is reported
rather than reinterpreted.

This result does **not** show that the 21-beat hemodynamic trajectory failed,
that the aortic valve never closed by every possible valve-state definition,
or that no PV relation exists. It shows only that the preregistered exact
zero-flow-crossing landmark was unavailable in the retained execution and that
the all-required-method completion conjunction therefore failed.

## Claim boundary

All 22 machine-readable negative claims remain `false`:

```text
canonicalSourceAuthenticationEstablished
clinicalValidationEstablished
edpvrEstablished
externalBloodWithdrawalEstablished
globalUniquenessEstablished
historicalQualificationTransferred
independentPeriodicOrbitPerBeatEstablished
isochronalEspvrEstablished
literalCavalOcclusionEstablished
minimumVolumeEspvrEstablished
mvo2Established
officialQualificationEstablished
physiologicalValidationEstablished
potentialEnergyEstablished
productionProtocolEstablished
publicCatalogEligibilityEstablished
pvaEstablished
selectedEspvrMethodEstablished
semilunarClosureEspvrEstablished
supportEnvelopeEspvrEstablished
transientProtocolNumericallyQualified
wholeHeartEnergyEstablished
```

In particular, the accepted trajectory is not a literal caval occlusion or
external blood withdrawal experiment. No unqualified ESPVR, EDPVR, PVA,
potential energy, MVO2, physiological validation, official qualification, or
public output is established.

## Prospective consequence

The failure must not be repaired by silently adding a closure threshold,
changing the landmark after observing this result, or rerunning the same output
path. A future versioned experiment should first retain compact semilunar-flow
diagnostics sufficient to distinguish:

- a strictly positive sampled flow floor;
- a zero crossing outside the chosen beat boundary;
- a valve-state closure without an exact signed-flow crossing; and
- an actual absence of a closure event.

It should also make the four method projections all-settled so that an
unavailable semilunar-closure landmark cannot erase otherwise valid
isochronal, minimum-volume, or support-envelope diagnostics. Any revised
closure owner, threshold, valve-state event, or output path requires a new
prospective declaration. This V1 artifact remains immutable failure evidence.
