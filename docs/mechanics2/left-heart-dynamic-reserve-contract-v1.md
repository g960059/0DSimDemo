# Left-Heart Dynamic Reserve Contract V1

Status: measured Gate B contract surface, not model acceptance.

Artifacts:

- `data/mechanics2/reports/left-heart-dynamic-reserve-contract-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runLeftHeartDynamicReserveContractBench.ts`

## Purpose

This bench converts the previous static output-reserve signal into a dynamic
left-heart chamber-load test surface. It keeps the work inside MechanicsCore2
left-heart Gate B and does not unlock right-heart, four-chamber, AV-plane, or
LandAtrial work.

The PR adds two contract-level readbacks:

- MV valve-state closure drive, applied to valve openness dynamics rather than
  as a pressure-gradient bias.
- High-pressure root runoff resistance drive, reported with its effective root
  resistance.

It also splits hard clamp readbacks into LA and LV clamp counts.

## Result

The reference `static-output-reserve-broad5-reference` remains 5/7. Adding
stateful root runoff retention creates a broad improvement. The best strict
variant is `active-length-mv-closure-stateful-root08`, now 6/7:

- LV PV OK: 7/7
- MVF OK: 7/7
- Output OK: 6/7
- Morphology OK: 7/7
- Clamp-free: 7/7
- Clean low-output classification: 1/7
- High-drive artifact count: 0/7

The remaining failure is now tightly classified:

- `left-heart-contractility-low` is clean morphology but low output.

Three diagnostic surfaces are important:

- Removing the lower hard floor changes high-drive failure into flow-volume
  decoupling, so the blocker is not just a bound-choice artifact.
- Fixed high root runoff resistance can clean high-drive, but collapses the
  broader envelope; instantaneous high-pressure dynamic root drive does not
  reproduce that broad-clean behavior.
- Stateful root runoff retention cleans high-drive without broad fixed
  root-load scaling, suggesting the missing contract is load memory/retention
  rather than a pure scalar afterload multiplier.

## Boundary

This is a useful architecture signal, not adoption evidence. The result says
MVF kink ownership should stay in valve-state closure dynamics, while high-drive
clamp cleanup needs stateful root/load retention rather than A-wave,
LandAtrial, or simple floor tuning.

Next work should stay in left-heart Gate B and decide how to treat
`contractility-low` clean low-output reserve before any right-heart,
four-chamber, AV-plane, or LandAtrial expansion.
