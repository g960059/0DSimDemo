# Existing Valve Audit V1

Status: MechanicsCore2 sidecar input audit

The current engine already exposes dynamic-valve-like parameters for all four
valves. MechanicsCore2 should reuse the semantic vocabulary where it is useful
instead of pretending to move from a pure diode to a dynamic valve from scratch.

See the measured JSON artifact:

- `data/mechanics2/reports/existing-valve-audit-v1.json`

Findings:

- MV, AoV, TV, and PV all expose `Aref`, `Amax`, `Aleak`, `kOpen`,
  `tauOpen`, `tauClose`, `R`, `L`, and `B`.
- `DynamicValveTransitionV1` already contains source/hysteretic/prescribed
  opening modes, current/consistent loss modes, reverse-flow policy, and qDot
  limit diagnostics.
- Existing ModelCore diagnostics include qDot and diode/clamp readbacks, but
  MechanicsCore2 still needs accepted-state ownership over flow, area/opening,
  chamber pressure, and chamber volume in one transaction.

Required next semantics:

- same-step q-state and area-state ownership
- soft closure without post-hoc projection morphology repair
- accepted-state pressure-flow loss and inertia readbacks
- energy/passivity and C1 kink readbacks
- disease-profile morphology separated from universal valve artifact guards

Claim boundary:

- No runtime valve change.
- No valve tuning.
- No morphology acceptance.
