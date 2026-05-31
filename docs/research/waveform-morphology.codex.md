# Waveform morphology check - official cases

Model files: `officialCases.ts` (case authoring) · `engine/ModelCore.ts`
(node/edge dynamics, sampled signals, debug observables) · `engine/chambers.ts`
(active-stress LV/RV) · `engine/knobs.ts` (valve mapping).

Commit checked: `23dd74e` (`engine/app: recalibrate regurgitant leak coefficients per research (#3-d adj)`).

## Method

I sampled each official case instance after `ModelCore.settleToSteady()` using a
1 ms step and one complete settled beat. Aortic valve closure was estimated from
the end of the positive `QAo` ejection window (`QAo > max(2 mL/s, 5% peak QAo)`).
AoP/LVP "dicrotic notch" was counted only if there was a local post-closure minimum
within 85 ms followed by a rebound within 80 ms; a broad diastolic runoff was not
counted as a notch.

Pulmonary venous flow is not an official `SimSample` / UI `SignalType`. The engine
debug API exposes `Q_PCap_PVen` (pulmonary capillary to pulmonary venous compartment),
not the final pulmonary-vein-to-LA inflow. For morphology only, I reconstructed
`Q_PVein_LA ~= (P_PVein - LAP) / 0.02` from the static `PVein_LA` edge in
`ModelCore.ts`.

## Executive verdict

| Feature | Verdict |
|---|---|
| AoP dicrotic notch | **Absent in all official instances**, including Normal. AoP decays monotonically after aortic closure; no near-closure local min + rebound. Responsible structure: lumped aortic compliance / Windkessel runoff plus smooth valve `xi`; no aortic-root / leaflet-impact / wave-reflection physics. |
| LVP no dicrotic notch | Correct for Normal, LV failure, dobutamine, AS, and hypovolemia. **MR severe has a small post-ejection LVP dip/rebound** (11.4 -> 14.3 mmHg) caused by severe regurgitant unloading near very small LV volume, not by an aortic incisura. |
| LAP/RAP a/c/v/x/y | A, v, x/y are generally identifiable when vertically scaled. The c wave is weak/merged because the model lacks explicit AV valve-plane/annular motion and leaflet bulging. MR has a large systolic LA wave, but c/v are merged into an early systolic regurgitant peak. |
| LV PV loop top | Correct: rounded in all instances. Ejection-top arch ratio 0.236-0.520 and opening/closing corner angles 24-35 deg; no sharp rectangular box. |
| MV inflow E/A | Both waves present in all instances. E>A holds in Normal, dobutamine, AS, MR, and hypovolemia. LV failure has A>E (E/A 0.91), plausible for impaired relaxation but fails a blanket "E>A" criterion. |
| PVF S/D/Ar | Not exposed as an official waveform. Reconstructed `PVein_LA` has S and D in all instances; Ar appears in Normal/AS/hypovolemia but is absent in LV failure, dobutamine, and MR. The exposed debug `Q_PCap_PVen` never shows Ar. |

## Metrics table

| Case instance | Health | AoP notch | LVP notch? | LAP/RAP waves | PV loop top | QMV E/A | Reconstructed PVF |
|---|---|---|---|---|---|---|---|
| Normal | ok, 0 clamps | absent | no | LAP a 4.40, v 4.21, y 1.83; RAP a 4.30, v 3.92 | rounded; arch 0.347, corners 30/31 deg | E 309, A 213, E/A 1.45 | S 91, D 123, Ar -9 |
| LV failure | ok, 0 clamps | absent | no | LAP elevated; v 8.32, y 5.61, a 7.56 | rounded; arch 0.236, corners 28/24 deg | E 224, A 247, E/A 0.91 | S 77, D 132, no Ar (+34) |
| + Dobutamine | ok, 0 clamps | absent | no | LAP lower than failure; v 7.18, y 4.22, a 5.82 | rounded; arch 0.275, corners 24/26 deg | E 284, A 259, E/A 1.10 | S 99, D 136, no Ar (+67) |
| Aortic stenosis | ok, 0 clamps | absent | no | Similar to Normal; LAP a 5.31, v 5.18 | rounded; arch 0.330, corners 26/35 deg | E 276, A 209, E/A 1.32 | S 88, D 125, Ar -10 |
| Mitral regurgitation | ok, 0 clamps | absent | **small dip/rebound** | Large systolic LAP wave 11.92; y 2.50; a 5.67 | rounded; arch 0.520, corners 26/25 deg | E 355, A 224, E/A 1.58; regurg QMV min -439 | S 166, D 173, no Ar (+1) |
| Hypovolemia | ok, 0 clamps | absent | no | Low-amplitude but scaled waves visible; LAP a 1.80, v 1.31 | rounded; arch 0.341, corners 31/31 deg | E 278, A 156, E/A 1.78 | S 59, D 68, Ar -5.5 |

Pressures are mmHg, flows are mL/s. PV loop "arch" is
`(P_peak - average(P_start_eject, P_end_eject)) / P_peak`; values well above 0
indicate a curved top rather than a flat rectangular top.

## Case notes

### Normal physiology

- AoP: no true dicrotic notch. Closure at theta 0.234; AoP then decays from
  90.9 to 70.3 mmHg over the near-closure window with no local rebound.
- LVP: correct no-notch behavior; post-closure LVP falls smoothly from 49.6 to
  16.3 mmHg over the same window.
- LAP/RAP: atrial wave timing is plausible. LAP has a 4.40 mmHg a wave, 4.21 mmHg
  v wave, and 1.83 mmHg y trough. RAP has distinct v and a peaks. LAP c is a weak
  shoulder rather than a separate textbook local peak.
- QMV: E 309 mL/s at theta 0.531 and A 213 mL/s at theta 0.851, so E>A.
- PVF: reconstructed `PVein_LA` has S/D/Ar. The official sample does not expose it.

### LV failure +/- dobutamine

- AoP notch: absent in both instances. The pressure decay is smooth after closure.
- LVP: no dicrotic notch in either instance.
- Atrial waves: LAP is elevated in failure (v 8.32, y 5.61) and partially unloaded
  by dobutamine (v 7.18, y 4.22). c remains weak/merged.
- QMV: failure has both E and A, but A exceeds E (224/247, E/A 0.91), consistent
  with impaired relaxation / failure physiology. Dobutamine restores E>A only
  narrowly (284/259, E/A 1.10).
- PVF: reconstructed S and D are present. Ar is absent in both, because the
  pulmonary venous-to-LA gradient stays forward during atrial systole.

### Valvular lesions

#### Aortic stenosis

- Raw check: severe AS resolves to `AoV_Amax = 0.875` and `AoV_R = 0.030`.
- AoP notch: absent. This is not AS-specific; it is the same missing aortic-root /
  valve-closure rebound structure seen in Normal.
- PV loop: rounded top remains intact despite the stenotic load.
- QMV and atrial waves: remain qualitatively normal with E>A and identifiable a/v/y.

#### Mitral regurgitation

- Raw check: severe MR now resolves to `MV_Aleak = 0.5` with `MV_Amax = 5.0`, as
  intended by the 0.1 coefficient.
- Non-degeneracy check: **passes**. Health is `ok`, clamp count is 0, EF_L is 0.865
  (below the 0.92 degeneracy guard), and sampled min VLV is 12.92 mL, safely above
  the 3 mL state floor.
- Regurgitation check: QMV minimum is -439 mL/s, confirming a strong systolic
  regurgitant component. LAP has a large systolic wave, max 11.92 mmHg, with y
  descent to 2.50 mmHg. This is the expected v-wave teaching point, though in the
  lumped trace it appears as an early systolic c/v-merged peak.
- LVP caveat: severe MR has a small post-ejection LVP dip/rebound after aortic
  closure (18.5 -> 11.4 -> 14.3 mmHg). That means the "LVP has no notch" shape gate
  is not clean for this instance. The likely cause is rapid LV unloading through
  the large MV leak near the low-volume active-stress geometry range, not a true
  aortic dicrotic notch.

### Hypovolemia

- AoP notch: absent, same structural reason as Normal.
- Atrial waves: present only at low amplitude. LAP ranges 0.34-1.80 mmHg; RAP
  ranges roughly 0.45-1.86 mmHg, so visual detectability depends on autoscaling.
- QMV: both E and A are present and E>A (278/156, E/A 1.78).
- PVF: reconstructed S/D/Ar are present but low amplitude.

## Structural limitations to carry into M12

1. **AoP incisura is missing at the reference operating point.** The current 0D
   arterial node is a smooth pressure-volume compliance with no explicit reflected
   wave, aortic-root elastic recoil, or leaflet-impact closure transient. Adding a
   visible incisura will require an explicit valve/aortic-root closure feature or
   a calibrated inertance/compliance submodel, not just retuning scalar SVR.
2. **The atrial c wave is under-specified.** Atria have time-varying elastance and
   AV flow coupling, but there is no explicit AV valve-plane displacement or leaflet
   bulge into the atrium, so c is weak or merged with v.
3. **PVF is not a first-class observable.** `SimSample` and `SignalType` expose
   QAo/QMV/QPA/QTV only. `debugObservables()` exposes `Q_PCap_PVen`, but not true
   `PVein_LA` flow. If PVF morphology is an M12 gate, expose `Q_PVein_LA` directly.
4. **Severe MR is now numerically usable but close to the low-volume regime.** The
   0.1 leak coefficient fixes the prior 3 mL-floor degeneration, but the MR LVP
   dip/rebound shows the active-stress low-volume behavior is still visible.

## Source anchors

1. `engine/ModelCore.ts:214-230` - valve and pulmonary venous edge definitions.
2. `engine/ModelCore.ts:742-797` - flow ODE and valve opening dynamics.
3. `engine/ModelCore.ts:938-960` - valve effective loss / area-ratio scaling.
4. `engine/ModelCore.ts:1024-1042` - chamber and flow state clamps.
5. `engine/ModelCore.ts:1094-1137` - debug observables and exposed pulmonary venous debug flow.
6. `types.ts:7` - official waveform signal list omits pulmonary venous flow.
