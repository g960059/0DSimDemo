# Fixed-control filling-pressure attribution

Research only, prospective. Retain the preceding selected research construction:
HR70, BSA1.9, TBV5200, Rsys1.10, arterial PV-law scale0.6, aortic-root L0,
ventricular passive/SLS scale1.248, slack1.06, beta1-1.92, Tref238816.5463Pa,
ventricular Ca-time scale1.1. No public model, baseline, knob domain or gate
change. No afterload stress test or new dynamical state/law.

## Small factorial before further fitting

Two factors at fixed remaining inputs:

- LA active amplitude1 versus0.8, using the existing per-wall amplitude owner.
  RA and ventricular amplitude are unchanged. This probes the contribution of
  the atrial pump;0.8 is a bounded intervention, not a human normal interval.
- Ventricular Ca trough0.164321 versus0.13uM, retaining the same peak, alpha
  time constants, HR and atrial source. This is a previously admitted source
  waveform counterfactual, not a source-calibrated routine fit coordinate.

Run four independent cold2ms cases on four numerical workers, lean settling
and full terminal observation. All four get the existing reservoir-settled
fixed-coronary-tone preload study at TBV4576/5200/5824mL. Rest hard checks,
reference warnings, right-heart sentinels and shape metrics remain visible.
Do not select just by total pass count or change any cutoff after results.

## Phase readback from the actual qualified endpoints

A research-only fork observer retains references to protocol branches. After
the existing protocol completes, choose the last completed branch at each
exact endpoint TBV. The readback then advances an independent copy, never the
retained source/endpoint. Check before/after source-state fingerprints.

Record two complete atrial-capture-to-capture beats at2ms presentation endpoints
with a full accepted mechanics readback. Boundary-clipped internal substeps may
not all be retained: these are phase-resolved diagnostic samples, not a new
exact derivative or flow-integral definition. Keep complete-beat metrics from
the exact accumulator, compare to the qualified endpoint, report drift and
pressure reconstruction error. If full readback fails, preserve the reserve
measurement and report readback unresolved separately.

Analyze LV pressure into active, equilibrium passive, SLS and external terms at
mitral closure, near end ejection and the inter-atrial-capture filling period.
Distinguish pressure accounting on a trajectory from causal effects of LA/Ca
interventions; do not add causal effects as if independent. E/A is not itself
the atrial contribution to SV, and mean LA pressure is not LV EDP.

The absolute tension/headroom issue is retained, not solved by renormalizing
the knob or expanding a private cap. No grid expansion or new fitter project.
