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

The reference `static-output-reserve-broad5-reference` remains 5/7. The best
strict variant is `active-length-blend-plus-mv-closure`, also 5/7, but with
better morphology decomposition:

- LV PV OK: 7/7
- MVF OK: 7/7
- Output OK: 6/7
- Morphology OK: 6/7
- Clean low-output classification: 1/7

The remaining failures are now tightly classified:

- `left-heart-contractility-low` is clean morphology but low output.
- `left-heart-contractility-high` is cleaned for LV PV and MVF under the
  active-length + MV closure surface, but still hits the LV lower hard clamp.

Two diagnostic no-go surfaces are important:

- Removing the lower hard floor changes high-drive failure into flow-volume
  decoupling, so the blocker is not just a bound-choice artifact.
- Fixed high root runoff resistance can clean high-drive, but collapses the
  broader envelope; instantaneous high-pressure dynamic root drive does not
  reproduce that broad-clean behavior.

## Boundary

This is a useful architecture signal, not adoption evidence. The result says
MVF kink ownership should stay in valve-state closure dynamics, while the
remaining high-drive issue is a pump/load coupling contract problem rather than
an A-wave, LandAtrial, or simple floor-tuning problem.

Next work should stay in left-heart Gate B and address high-drive pump/load
coupling without broad fixed root-load scaling.
