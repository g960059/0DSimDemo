# Follow-up before v3 execution: separate a confounded effect

v2 source-rate, old LVFW path at 0.5ms: source Land work 16.138 kJ/m³,
Land phi=1 11.688, strict moment 11.537. Most of the work reduction is therefore
associated with removing phi, not uniquely the use of actual population flux.

Add exactly one explicitly phenomenological closure, retaining source phi:

    Mw' = Aw W lambda' - outgoingW Mw - (phi-1) incomingW Mw/W
    Ms' = As S lambda' - outgoingS Ms - (phi-1) incomingS Ms/S

The last terms describe additional within-pool mean relaxation tied to turnover;
they are NOT implied by zero-distortion births and mean-distortion departures.
They are NOT a derived correction for distortion variance or an ATP energy law.
Do not mislabel them as exact first moments of the Land/Huxley distributions.
phi >= 1 is required by the chosen dissipative excess-relaxation interpretation.
No new state or fitted numerical coefficient. Empty-pool mean is zero only when
its moment is also zero. Zero incoming flux removes the extra relaxation.

Repeat the same assays/steps, preserve all earlier results and compare the new
closure against both original Land and strict moments. Same progression rule:
no automatic clinical acceptance or closed-loop integration from prettier tails.
