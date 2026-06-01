# Coronary circulation

Model files:
- `engine/ModelCore.ts`
- `engine/protocol.ts`
- `components/Charts.tsx`
- `components/Controls.tsx`
- `engine/__tests__/coronary.test.ts`

## Parameters In Play

| Parameter | Model value | Rationale / target | Verdict |
|---|---:|---|---|
| `coronaryEnabled` | `true` | Coronary runoff is part of the closed loop at baseline. | Implemented |
| `coronaryResistanceScale` | `1.0` | Global multiplier on LAD/LCx/RCA resistive bed; resting flow gate is 200-350 mL/min and 3-7% of CO. | Calibration knob |
| `coronaryCompressionScale` | `1.2` | Scales intramyocardial external pressure and time-varying microvascular resistance. Chosen to make LAD flow diastolic-dominant without destabilizing baseline. | Calibration knob |
| `coronaryVasodilator` | `0` | `0..1` hyperemia control; microvascular resistance is divided by `1 + (reserveMax - 1) * vasodilator`. | FFR/CFR entry point |
| `coronaryReserveMax` | `3.5` | Typical CFR target is order 3-4 in uncomplicated physiology; kept as tunable rather than hard physiology. | Calibration knob |
| `LADStenosis`, `LCxStenosis`, `RCAStenosis` | `0` | Diameter stenosis, clamped to `0..0.95`, converted to area ratio. | Implemented |
| LAD resistance set | `1 + 12 + 33 + 2 mmHg*s/mL` | Flow share target about 42% of total coronary flow at rest. | Implemented |
| LCx resistance set | `1.5 + 22 + 56 + 3 mmHg*s/mL` | Flow share target about 28%. | Implemented |
| RCA resistance set | `1.5 + 20 + 43 + 3 mmHg*s/mL` | Flow share target about 30%. | Implemented |
| Coronary compliance | Art `0.02..0.03`, IM `0.06..0.09`, Ven `0.08..0.12`, CS `1.5` mL/mmHg | Small enough not to act as a systemic reservoir; large enough to produce phasic storage. | Implemented |

## Topology

The model adds three explicit coronary territories:

```text
Ao -> LAD_Art -> LAD_IM -> LAD_Ven -> CS -> RA
Ao -> LCx_Art -> LCx_IM -> LCx_Ven -> CS -> RA
Ao -> RCA_Art -> RCA_IM -> RCA_Ven -> CS -> RA
```

This was chosen over a first-pass left/right two-bed model because the existing graph core can carry ten additional nodes cheaply, and territory-level observability makes LAD/LCx/RCA stenosis and RV-pressure-dependent RCA behavior testable.

Each coronary node uses the existing volume-state ODE:

```text
dV_k/dt = inflow_k - outflow_k
```

so total blood volume remains conserved by the graph incidence balance. The added coronary blood volume is included in `TBV`; target-TBV initialization redistributes the remaining volume into the venous reservoir.

## Pressure Model

Linear coronary nodes use:

```text
P_k = P_ext,k + P_tm,k
P_tm,k = (V_k - V_u,k) / C_k
```

Epicardial arterial nodes and the coronary sinus use `Pth`. Intramyocardial and coronary venous nodes use ventricular-pressure-dependent external pressure:

```text
P_im,r = P_peri
       + S_comp * (gamma_LV,r * max(P_LV,tm, 0)
                 + gamma_RV,r * max(P_RV,tm, 0))

P_imV,r = P_peri
        + S_comp * eta_v * (gamma_LV,r * max(P_LV,tm, 0)
                          + gamma_RV,r * max(P_RV,tm, 0))
```

where `S_comp = coronaryCompressionScale` and `eta_v = 0.45`.

| Territory | `gamma_LV` | `gamma_RV` | Meaning |
|---|---:|---:|---|
| LAD | 0.65 | 0.00 | LV anterior / septal bed |
| LCx | 0.55 | 0.05 | LV lateral bed with small RV coupling |
| RCA | 0.20 | 0.45 | RV and inferior-wall contribution |

The pressure source uses free-wall transmural pressures from the current pericardium/septum model (`PLVfw`, `PRVfw`). This keeps coronary compression tied to the same mechanical state that drives the ventricular pressure-volume loops.

## Flow And Losses

All coronary edges are resistive in the MVP:

```text
Q = solveQuadraticFlow(P_up - P_down, R_eff, B_eff)
```

Microvascular resistances vary with activation:

```text
R_p,r(t) = R_p0,r * coronaryResistanceScale
         * (1 + S_comp * k_p,r * a_r(t)) / reserve

R_d,r(t) = R_d0,r * coronaryResistanceScale
         * (1 + S_comp * k_d,r * a_r(t)) / reserve

reserve = 1 + (coronaryReserveMax - 1) * coronaryVasodilator
```

Activation is `aLV` for LAD/LCx and `0.45*aLV + 0.55*aRV` for RCA. Coefficients:

| Territory | `k_p` | `k_d` |
|---|---:|---:|
| LAD | 0.5 | 2.0 |
| LCx | 0.5 | 1.8 |
| RCA | 0.3 | 1.0 |

Epicardial stenosis maps diameter stenosis `s` to area ratio:

```text
A_ratio = max((1 - s)^2, 0.0025)
loss = min(A_ratio^-2, 5000)
R_ost,eff = R_ost,0 * loss
B_ost,eff = B_ost,0 + 0.06 * (loss - 1)
```

The coefficient is deliberately lower than many standalone stenosis equations because this engine's flow unit is mL/s and the added loss is applied inside a full closed-loop model. The behavioral gate is monotonic FFR/flow reduction, not exact lesion-specific pressure-drop prediction.

## Observables

`SimSample` now includes:

```text
QCorLAD, QCorLCx, QCorRCA, QCorTotal, QCS
PLADArt, PLCxArt, PRCAArt, PCS
PimLAD, PimLCx, PimRCA
```

`SimMetrics` now includes:

```text
CorFlow*MlMin
CorPctCO
CorDiastolicFraction*
FFR_*
CorSupplyDemandL/R
```

FFR is reported as beat-average distal epicardial pressure over beat-average aortic pressure:

```text
FFR_r = mean(P_r,Art) / mean(P_Ao)
```

The metric is most meaningful under `coronaryVasodilator = 1`, matching the usual hyperemic use of FFR.

Diastolic fraction integrates positive ostial flow while `QAo <= 5 mL/s`, divided by positive beat-integrated ostial flow.

Supply-demand indices are simple normalized teaching indicators:

```text
D_L = HR/75 * (lvTmaxScale/0.85) * (mean(LVP)/90)^0.4
D_R = HR/75 * rvTmaxScale       * (mean(RVP)/25)^0.4
SDI_L = (Q_LAD + Q_LCx) / (0.05*CO*0.70*D_L)
SDI_R = Q_RCA / (0.05*CO*0.30*D_R)
```

They are not a metabolic autoregulation model and should not be interpreted as oxygen extraction.

## Baseline Verification

Measured with `runScenario(DEFAULT_PARAMS, { settleSeconds: 45, measureSeconds: 12 })` after implementation:

| Metric | Value |
|---|---:|
| Total coronary flow | 213.7 mL/min |
| Coronary flow / CO | 3.43% |
| LAD flow | 92.3 mL/min |
| LCx flow | 53.9 mL/min |
| RCA flow | 67.4 mL/min |
| LAD diastolic fraction | 0.617 |
| RCA diastolic fraction | 0.439 |
| Resting FFR LAD/LCx/RCA | 0.982 / 0.984 / 0.980 |

Automated gates:

- Resting coronary flow: `200..350 mL/min`.
- Resting coronary flow / CO: `3..7%`.
- LAD diastolic fraction: `>0.6`.
- LAD diastolic fraction exceeds RCA by at least `0.12`.
- Hyperemia increases total coronary flow above `450 mL/min`.
- 80% LAD stenosis under hyperemia lowers LAD FFR by at least `0.3` and reduces LAD flow below 20% of unobstructed hyperemia.
- RV pressure overload increases RCA diastolic fraction and lowers RCA flow.

## Literature Rationale

StatPearls summarizes two anchors used here: coronary circulation supplies the myocardium and is approximately 5% of cardiac output, and coronary flow differs from most tissues because myocardial contraction compresses vessels and shifts especially left coronary flow toward diastole.

Lee and Smith's coronary blood-flow review describes the multi-scale modeling tradition and emphasizes the importance of mechanical heart-coronary interaction, including waterfall and intramyocardial-pump mechanisms.

Arthurs et al. used a patient-specific coronary flow-control model with intramyocardial vessel compliance and exercise flow-control behavior; this supports keeping compliance and future metabolic control as separate mechanisms rather than folding everything into one static resistance.

Duanmu et al. built a patient-specific lumped-parameter coronary circulation model and evaluated stenosis effects with FFR, supporting the present choice to expose distal epicardial pressure and hyperemia mode.

Yong et al. (Journal of Biomechanics, 2025) specifically argue that conventional coronary LPMs with intramyocardial pressure and vascular compliance still miss dynamic resistance changes during myocardial contraction; their reported emphasis on RCA and pulmonary-hypertension behavior motivates the time-varying resistance term.

Cai et al. (2024) derive a coronary LPM for blood-supply capacity and study healthy vs stenotic states with relative flow and FFR, supporting the educational stenosis/FFR gates.

## Open Questions

- Metabolic autoregulation is not yet dynamic. The present `coronaryVasodilator` is an external hyperemia knob, not an ODE state.
- There is no transmural epi/mid/endo split, so subendocardial ischemia is not represented.
- Stenosis loss is calibrated for stable educational behavior, not patient-specific geometry.
- Coronary venous anatomy is collapsed to one `CS` compartment; Thebesian drainage and collateral flow are absent.

## References

- StatPearls, "Physiology, Coronary Circulation": <https://www.ncbi.nlm.nih.gov/books/NBK482413/>
- Lee and Smith, "The Multi-Scale Modelling of Coronary Blood Flow": <https://pmc.ncbi.nlm.nih.gov/articles/PMC3463786/>
- Arthurs et al., "A mathematical model of coronary blood flow control": <https://pmc.ncbi.nlm.nih.gov/articles/PMC4867386/>
- Duanmu et al., "A patient-specific lumped-parameter model of coronary circulation": <https://www.nature.com/articles/s41598-018-19164-w>
- Yong et al., "A lumped parameter model of the coronary circulation incorporating time-varying resistance, intramyocardial pressure and vascular compliance": <https://doi.org/10.1016/j.jbiomech.2025.112679>
- Cai et al., "A lumped parameter model for evaluating coronary artery blood supply capacity": <https://www.aimspress.com/article/doi/10.3934/mbe.2024258?viewType=HTML>
