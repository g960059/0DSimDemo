# Analytic fixed-length force-Ca transfer audit

This is an analysis-only assay, not a new runtime or an initializer change.
At fixed length, zero distortion and fixed free Ca, solve the source population
balance algebraically and check it against the exact RHS and existing iterative
fixed-input initializer. The selected positive-excess bridge exit must vanish at
that equilibrium. Preserve the Eq48 unblocking limit100, rather than replacing
it by an unconstrained Hill approximation. Check populations and residuals.

For length-independent rate parameters, normalized equilibrium force depends on
Ca/CaT50(lambda). Thus the shift of the half-force point between two lengths is
log10(CaT50(short)/CaT50(long)); this is a model consequence, not measured data.
Calculate half-force points explicitly to verify the identity. The multiplicative
force-length factor and Tref cancel when each length is normalized to its own
saturating active force. Do not confuse the force half-point with CaTRPN half-point.

Land2017 section3.3 reports skinned nTm2.2, beta1-2.4, CaT50Ref2.5uM (n5 cells;
cell-specific CaT50Ref varied). Section3.5 transfers to intact CaT50Ref0.805 and
nTm5 with other rate changes, retaining the dimensional beta1. Therefore compare
the analytic shifts for CaT50Ref2.5 and0.805, and current beta1x0.8. The2.5 row is
an affinity-only comparison, not a reconstruction of the complete skinned model.
Land lambda=SL/SL0; use0.95/1.15 as an illustrative20% extension contrast. An
assumedSL0=2.0um maps these to Tanner2023's1.9/2.3um but does not establish the
organ geometry's sarcomere-length calibration. Tanner's permeabilized donor
myocardium(n6 hearts) is not intact-cell or population-baseline evidence.

Audit result does not authorize changing beta1, nTm, Ca source, caps or gates.
It identifies source-transfer assumptions and provides a fast component check
for future candidate design without running a closed-loop settle at every Ca.
