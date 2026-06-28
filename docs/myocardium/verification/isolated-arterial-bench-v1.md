# Isolated arterial bench v1

Status: proposed morphology next-evidence plan
Scope: arterial-load signal generation and comparison only; no production adoption

## Motivation

The morphology lane can currently report ejection-limb squareness, AoP/LVP phase, proximal pressures, and available arterial signals. It still cannot directly test Zc/reflection hypotheses when characteristic impedance and reflection signals are unavailable.

The next arterial-load evidence should therefore be an isolated arterial bench, not a production runtime change.

## Objective

Create a diagnostic bench that injects prescribed inflow into the current arterial tree and future candidate arterial-load elements so that input pressure, input impedance, and candidate Zc/reflection signals can be measured under controlled conditions.

## Non-goals

- no official morphology pass;
- no default runtime comparator;
- no official case wiring;
- no myocardium source-stress decision;
- no Land parameter changes;
- no production Zc/reflection adoption;
- no inference of Zc/reflection from existing waveform proxies alone.

## Protocol outline

```text
prescribed Q_in(t)
    ↓
arterial load under test
    ↓
measured P_in(t), downstream pressures, flows, stored volumes
    ↓
frequency-domain and time-domain summaries
```

Candidate inputs:

- impulse-like or short-pulse inflow;
- physiological ejection-shaped inflow;
- frequency-sweep or multisine inflow;
- normal, low, and high peripheral resistance/compliance states.

## Required readouts

```text
inputPressurePa
inputFlowM3PerSec
estimatedInputImpedanceSpectrum
lowFrequencyResistanceEstimate
highFrequencyImpedanceEstimate
candidateCharacteristicImpedancePaSecPerM3
candidateReflectionCoefficient
pressureWaveTravelOrDelayProxy
incisuraCandidateScore
energyStorageAndDissipationSummary
```

If a signal is unavailable, it must be marked unavailable. Do not backfill it with a proxy and call it Zc or reflection.

## Acceptance for bench readiness

The bench is ready when it can:

- run the current arterial load as a baseline;
- run at least one off-by-default candidate load;
- emit raw and resampled time traces;
- emit impedance summaries with units;
- report which signals are direct and which are unavailable;
- prove that no official case or runtime default was changed;
- compare ejection-limb morphology using the existing PV-loop morphology metrics without claiming production acceptance.

## Handoff to arterial-load comparator work

The isolated bench should feed a later comparator PR:

```text
arterial-load-zc-root-comparator-v1
```

That later PR may implement candidate Zc/root/reflection behavior only off by default and only after the bench proves that the relevant signals can be measured.

## Relationship to myocardium lane

Myocardium must not tune Land source stress or Tref to compensate for an arterial-load signal gap. The arterial bench exists to keep this issue out of the myocardium parameter space.
