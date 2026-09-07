# Numerical check of adverse shape, not candidate promotion

Population-v1 produced two LVP/RVP peaks for kws36/s at both amplitudes,
despite aortic-root L=0. The recovery-only contrast produced a nearly flat
central ejection pressure without a large post-peak rebound. These are
observations at2ms; they do not yet identify numerical versus constitutive
origins. No case is adopted, and the clinical gate is unchanged.

Freeze a1ms cold rerun of source6-kws36-Tref160000 (two peaks) and
source6-phi0.4-Tref160000 (flat) using identical exact construction inputs.
Use two local workers, the same three-consecutive-cycle criterion and complete
accepted terminal metrics. No other parameter tuning or stress experiment.

Compare ejection shape and timing/gradient/pressure before interpreting the
artifact as more than a coarse-step effect. Agreement of2ms and1ms is useful
evidence, not a proof of convergence or clinical normality.
