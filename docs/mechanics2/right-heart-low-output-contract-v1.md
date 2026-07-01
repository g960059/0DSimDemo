# Right-Heart Low-Output Contract V1

Status: measured MechanicsCore2 Gate C attribution, not four-chamber readiness.

Artifacts:

- `data/mechanics2/reports/right-heart-low-output-contract-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runRightHeartLowOutputContractBench.ts`

## Purpose

The low-contractility alignment bench showed that the Gate C residual is not
solved by simply weakening right-heart severity or lowering right-heart safety
gains. This bench tests whether a broader right low-output contract can produce
a clean right phenotype aligned with the owner-approved left low-output point.

The scan varies:

- RV active scale (`trefPa`)
- RV volume policy / dilation bounds
- RV upper safety-pressure gain

The intended positive signal is not just matched left/right forward ejection.
It must be a clean right low-output phenotype: morphology intact, clamp-free,
safety-bounded, and accepted by the same low-contractility policy.

## Result

Decision: `right-low-output-contract-blocked`

- Left low-contractility reference: pass, clean low-output phenotype, AoV
  ejection ~11.7 mL.
- Baseline right low-contractility: pass, PV ejection ~31.4 mL.
- Candidates scanned: 60.
- Candidates aligned with the left ejection magnitude: 53.
- Clean right low-output candidates: 0.
- Clean aligned candidates: 0.
- Clamp-free candidates: 36.
- Safety-bounded candidates: 34.
- Best candidate: `right-low-rv-dilated420-tref-22000-safety-0.25`, mismatch
  ~0.04 mL, clamp-free, but not safety-bounded and therefore not clean.

This confirms that the residual is deeper than a missing right-heart severity
scale. Matching the left low-output magnitude pushes the right surface into
safety-pressure, clamp, repeatability, or morphology artifacts rather than a
clean phenotype.

## Boundary

This is not runtime wiring, true four-chamber coupling, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

Next work should change the right low-output / RV safety ownership contract
itself before returning to reservoir Gate C. Do not unlock four-chamber,
AV-plane, or LandAtrial work from this result.
