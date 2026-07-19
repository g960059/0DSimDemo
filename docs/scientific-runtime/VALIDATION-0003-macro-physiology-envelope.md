# VALIDATION-0003: macro physiology source envelope

Status: implemented source-level structural response screen; not a
release-resolved validation, calibration, canonical-parameter change, or
production-cutover gate.

## Purpose

The canonical 4 ms healthy screen has a physiologically recognizable closed
loop, but its LV EDV/ESV are high and its systolic pressure and apparent
contractility are low. This experiment separates three semantic owners before
any detailed fitting:

- common ventricular equilibrium passive material plus its ventricular SLS
  branch modulus;
- common ventricular Land `Tref`; and
- the additional stressed systemic venous volume used by the fixed-TBV cold
  operating point.

The seven points are baseline and one reciprocal low/high pair per owner.
Every point is a sealed ID, not an arbitrary patch. It starts from an
independent point-specific cold state with healthy valves, LA SLS on,
membrane-only TriSeg, and the healthy-slack common pericardium. No warm state is
shared and no optimizer or parameter search is used.

Passive scaling multiplies the equilibrium stored-energy stress scale,
algorithmic tangent scale, and SLS branch modulus together while preserving
exponents, transition width, SLS time constant, and reference geometry. The
Land points change only ventricular `Tref` and rebuild the derived parameter
identity. Because LVFW, septum, and RVFW currently share the normal-adult
ventricular material owner, this V1 experiment explicitly does not claim
independent LV and RV EDPVR or inotropy.

## Numerical protocol and hard gates

- time step: 4 ms;
- maximum beats: 32;
- termination: existing groupwise period-1 classifier;
- one accepted terminal cycle retained for measurement;
- all seven points independently cold-started; and
- artifact payload: canonical JSON plus a trailing newline; canonical-payload
  and raw-file SHA-256 digests are reported separately.

Hard gates are integration completion, P1 convergence, resolved identity
agreement, and fixed-TBV conservation over the terminal retained complete
cycle. The runner does not yet retain a whole-run TBV maximum, so this document
does not claim a whole-run conservation measurement. Whole-loop response
directions and magnitudes are descriptive; they are not post-hoc acceptance
thresholds.

This is the same source research runner boundary as `VALIDATION-0002`. It does
not execute a release-resolved Session, Worker command, CaseDocument, or
browser workspace. It therefore cannot support a production cutover or become
a saved-case parameter operation without a new immutable release identity.

## Result

All seven points converged to P1 without a failed accepted step. Within each
terminal retained complete cycle, maximum absolute TBV error remained below
`3e-12 mL`.

| Point | P1 beat | LV EDV (mL) | LV ESV (mL) | LV EF | MAP (mmHg) | CO (L/min) |
|---|---:|---:|---:|---:|---:|---:|
| baseline | 27 | 152.77 | 64.38 | 0.579 | 88.35 | 5.303 |
| common ventricular passive ×0.75 | 26 | 157.23 | 66.53 | 0.577 | 90.37 | 5.442 |
| common ventricular passive ×4/3 | 28 | 148.19 | 62.36 | 0.579 | 86.14 | 5.150 |
| common ventricular `Tref` 90 kPa | 30 | 163.76 | 83.61 | 0.489 | 81.03 | 4.809 |
| common ventricular `Tref` 160 kPa | 28 | 142.17 | 48.36 | 0.660 | 93.28 | 5.629 |
| stressed venous volume ×0.75 | 24 | 142.25 | 58.73 | 0.587 | 83.19 | 5.011 |
| stressed venous volume ×4/3 | 28 | 166.36 | 72.07 | 0.567 | 94.75 | 5.658 |

The generated artifact is
`data/scientific/validation/macro-physiology-envelope-v1.json`. Its canonical
payload SHA-256 is
`1a92ef2cebdfc767b310a489a25cbae7f91d9ced74a6e8ec7c09f22f79644f06`;
its raw file-bytes SHA-256 is
`74292a819f2f66217f88fbcd024935ec529550ae4159185011406894d1e9e92a`.

## Interpretation

The three axes are distinguishable and numerically well behaved over a broad
envelope:

- passive stiffness mainly shifts ventricular volumes; within this common
  biventricular material owner it changes LV EF very little and couples the RV
  and septum in the opposite loading direction;
- Land `Tref` is the dominant systolic/ESV axis. Raising it from 120 to 160 kPa
  lowers LV ESV by 16.0 mL, raises EF by 0.081, and raises MAP by 4.9 mmHg;
- stressed venous volume is a preload/pressure axis. Reducing only the
  additional SV/VC ledger lowers LV EDV by 10.5 mL but also lowers MAP by
  5.2 mmHg.

This supports the user's visual diagnosis that the current high-volume,
low-pressure state is not an SVR-only problem. It also argues against silently
using one fitted scalar to repair everything. A later canonical candidate may
combine a physiologically justified active-force revision with a separately
owned preload operating point, but this envelope does not select or fit that
combination.

The common ventricular passive axis is intentionally diagnostic rather than a
final architecture. Before disease fitting, LVFW/RVFW material ownership and
septal coupling should be made explicit enough that LV EDPVR can change without
being misrepresented as an independent RV or septal fit. Pericardial excess
pressure is zero at baseline and most points, but becomes positive in the weak
`Tref` and high-volume brackets; retaining a real common pericardium is
therefore still important for volume-overload and low-contractility cases.

## Reproduction

```bash
npm run generate:scientific:macro-physiology-envelope
npm run verify:scientific:macro-physiology-envelope
```

Generation is intentionally outside the fast suite because seven independent
periodic cold starts take roughly one to two minutes on the reference
development machine.
