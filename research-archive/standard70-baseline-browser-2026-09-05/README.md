# Minimal production extraction browser observations

Research/archive only; excluded from production PR #610. The seven original
script, JSON and PNG files are retained byte-for-byte in `browser-evidence.tar.gz`.
`manifest.json` contains archive and per-file SHA256 values; extraction was
verified against all seven. No source-hash binding was captured by the original
browser script, and none is retroactively claimed.

Both runs used Chromium at 1540×1100 and the new-session launch at local port
4190. HR70/TBV5050, selected pressure/flow readouts, full default controllers,
waveforms, PV/PVA and formal relations were present with no recorded page error.
The selected info panel showed AV ET244 ms and LV +dP/dt2587 as a reference warning.
The first run exposed overflowing morphology text; the second shows the
wrapping correction implemented in production commit `af93d019`.

The second headless snapshot reached model time398.616 s and retained one PVA
result/drawing while Starling had5 of6 settled points and one pending extension.
A separate in-app observation saw6 completed points, but that observation is
not contained in this bundle. The snapshots establish display/start behavior,
not completion of every asynchronous analysis, browser performance guarantees,
or physiological validity.

The subsequent hosted browser suite caught a different issue: its scenario
duplication test assumed an HR60 baseline and expected59 after one decrement,
whereas the selected baseline is70 and correctly produced69. The production
test fix and hosted CI remain authoritative for that interaction; these visual
captures are not a replacement for it.

## Right-heart audit boundary and next bounded comparison

The selected final evidence already includes HR70/60 baseline RV/PV/TV timing,
pressures, volumes, native flow ratios and morphology. Neither those reports nor
the1 ms repeat demonstrates a right-heart model-form failure. Construction
corridors and native event/flow observations are not universal clinical normal
ranges or Doppler/TDI measurements.

The existing reserve evidence is HR70-only. It preserves CO, filling pressure,
end-diastolic RV volume and transmural responses, but not the full low/high
endpoint PAP/PV/TV waveforms, gradients, EF or timing. The HR60 final result
explicitly reports reserve not run. Similar closed-loop LV/RV CO responses do
not identify isolated RV contractility or the limiting chamber.

Before changing another constitutive law, compare the original and selected
baseline with the same current observer at HR60/70, then retain completed beats
and short native traces for the existing low/baseline/high fixed-control preload
protocol. Start with the missing HR70 endpoints; HR60 is the next comparison.
No new afterload battery, invented RV normality gate or symmetric copying of LV
laws is justified by the present evidence. Archived final v7 requests and
results live in the companion baseline-ejection archive.
