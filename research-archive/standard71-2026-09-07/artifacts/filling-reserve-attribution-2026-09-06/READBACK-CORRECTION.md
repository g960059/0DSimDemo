# Diagnostic capture-boundary correction

The four initial physiological evaluations completed and preserved their formal
reserve measurements. Phase readback was complete for source/LA1 and low-Ca/LA0.8,
but unavailable for source/LA0.8 and low-Ca/LA1. The cause was the diagnostic
sampler's floor(3T/2ms) horizon: an accumulator freshly created exactly at an
atrial capture needs three future captures to retain two full beats, and the
last HR70 boundary can fall just beyond the final2ms sample.

Extend only the diagnostic horizon by rounding up and one extra tick. Test
sampling from both an ordinary start and an exact atrial capture. No numerical
solver, qualification protocol, settlement tolerance, Ca/atrial input, or gate
is changed. Repeat only the two incomplete readbacks in a new directory,
retaining both attempts. Compare rest and formal reserve metrics with the
original evaluations before using the new phase data.
