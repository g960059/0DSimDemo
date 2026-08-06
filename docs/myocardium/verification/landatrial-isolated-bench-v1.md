# LandAtrial isolated bench V1

Status: active diagnostic bench

The bench in `engine/myocardium/atrialIsolatedBench.ts` isolates atrial Land
active mechanics and AV-plane/effective-wall geometry from closed-loop valve,
root/Zc, preload, and venous-return effects.

It evaluates LA and RA under a prescribed normal-rate volume waveform with
reservoir, conduit, and booster phases. Outputs include passive/active pressure
components, source active stress, wall stretch/strain, the AV-plane effective
volume correction, loop area, and provider solve health.

Runtime inputs come from `engine/myocardium/landAtrialRuntimeContract.ts` and
`engine/myocardium/atrialLandContract.ts`. The bench does not change runtime
selection, tune valves or root/Zc, certify atrial physiology, or qualify a
Studio snapshot. It is a reproducible attribution surface for proposed atrial
mechanics changes.
