# M12-proper #1 — LA/RA → Active-Stress: Implementation Scaffolding (claude2)

Status: DRAFT / prep. No code committed. This is the HOW-in-code plan, synced to
`m12-la-preload-design.md` §A7 (claude1 physiology gates), §B7.1 (codex1 param
scaffold) and §B8 (codex1 migration surface). claude2 executes this once the
circuit pass lands and params are confirmed.

HUMAN APPROVED (via lead): the two-phase plan + ADD an `atrialContractility`
clinical knob (see §6). Ownership: **claude2 is the SOLE engine file-editor**;
codex1 is read-only (sweeps/analysis), lead integrates and commits — single editor
on the shared tree to avoid conflicts.

Read for this plan: `engine/chambers.ts`, `engine/ModelCore.ts`, `engine/math.ts`
(all full) + the design doc above.

---

## 0. Staging dependency (do NOT skip)

Per §A8 + §B9 (both reviewers agree): **mean LAP and EDV are CIRCUIT-set**, not
atrial. The order is:

1. **PHASE 1 — circuit / central-volume distribution pass (lands first).**
   codex1 is sweeping circuit params NOW (central-volume mobilisation +
   pulmonary-venous compliance ~7-15 mL/mmHg + `PVein_LA.R`) to hit LAP 8-12 /
   RAP 2-6 / EDV 110-120 / CO 5 on the CURRENT elastance atria. When codex1 posts
   candidate values, **I (claude2) apply them to the engine** (sole editor); lead
   integrates/commits. This moves LAP ~1.7→8-12 and fixes LAP<RAP.
   ⚠ APPLY THE **REVISED** CANDIDATE ONLY — codex1's first candidate overshot MAP
   to 100 / AoP 144/91 (hypertensive Normal regression vs M12-lite 85 / 120/78).
   The candidate evolves across iterations (#1 hypertensive; #2 EF 0.699 from
   afterload over-cut + PVein_LA.R 0.0038 too aggressive; 4 levers couldn't hit all
   gates — raising preload over-pumps at fixed contractility). Phase-1 apply scope is
   now **5 coupled levers**: SV/VC `Vu` + `PVein_LA.R` (node specs) **+
   `systemicResistance` + `arterialStiffness` + `lvTmaxScale` (+`rvTmaxScale`)**
   (CoreRuntimeParams defaults). NOTE the 5th lever is the RUNTIME contractility
   SCALARS `lvTmaxScale`/`rvTmaxScale` — NOT the M12-lite `Tmax0`/`geomChi` (those
   stay frozen). Apply ONLY the candidate passing ALL Phase-1 standalone gates incl
   **EF 0.55-0.65** and **MAP ~85 / AoP ~120/80**. Still elastance atria in Phase 1.
2. **PHASE 2 — LA/RA → active-stress migration (THIS PLAN's core).**
   reservoir/conduit/booster mechanics + emergent a-wave/Ar + the
   `atrialContractility` knob, calibrated to the a-wave gate, NOT to mean LAP.

⚠️ My migration must NOT use atrial passive stiffness as a mean-pressure lever
(§A4/§B5: dLAP/dEes is negative; passive stiffening costs CO and over-peaks the
a-wave). Calibrate atrial active params to a-wave (+3-6 mmHg) & LAEF only.

Acceptance gates (split, per lead — circuit-only CANNOT hit LAP 8-12 at CO~5
without the forbidden passive-stiffness hack, so the strict targets are the
COMBINED final gate after Phase 2 adds the booster):

- **PHASE-1 STANDALONE gate** (circuit pass, current elastance atria, TBV 5600):
  EDV 110-115, CO 4.5-5.5, RAP 2-6, EF ~0.55-0.65, 0 clamps, official suite green,
  AND LAP raised toward ~5-6 with the inversion NEUTRALISED (LAP−RAP ≥ ~0, trending
  positive). **Do NOT block Phase 1 on LAP 8-12.**
- **COMBINED FINAL gate** (after Phase 2): mean LAP 8-12, LAP−RAP +3-6, a-wave
  +3-6, v>a, LAEF 45-65%, booster 20-30% of LV EDV, atrial peak active stress
  ~15-40 kPa — all at TBV 5600, 0 clamps.
- **LA PV-LOOP FIGURE-8** (human, via lead): the LA pressure-volume loop must be a
  proper figure-8 with BOTH sub-loops having area — a non-degenerate **reservoir
  (v) loop** AND **booster (a) loop**. Today the booster A-loop has area but the
  reservoir V-loop is collapsed to a near-line (elastance-atria artifact); opening
  it is a Phase-2 acceptance requirement. MECHANISM = HYSTERESIS: the atrium must be
  at DIFFERENT stress during reservoir-fill vs early-diastolic-empty (so the fill
  and empty paths don't retrace the same line). Levers = atrial active/relaxation
  KINETICS (`Arel0`, `tauCa0`, `Trel0`/`TrelMax`) + timing (`atrialLeadSec`): the
  atrium must RELAX during ventricular systole to fill as a compliant reservoir,
  then contract for the a-wave. ⚠ A pure passive STIFFNESS bump KILLS the reservoir
  loop — do NOT use it. **claude1 is writing the pass/fail metric** (a/v loop
  areas). No action now — Phase 1 first; this is a Phase-2 calibration goal (§7.8).

---

## 0b. PHASE-1 CANDIDATE (codex1, PASSES all standalone gates) — apply on claude1 OK

Result: CO 4.93 / EDV 113.4 / EF 0.589 / MAP 88.2 / AoP 118.4/81.4 / RAP 2.99 /
LAP 5.45 / gradient +2.455 / 0 clamps. **HOLD for claude1 physiology sign-off**
(PAP-improvement + lvTmaxScale=0.80 checks), THEN apply, run full suite, post for
review-gate. M12-lite Tmax0/geomChi/EDPVR stay FROZEN (these are Vu/R/runtime-scalar
changes only).

**APPLIED ✓ (claude1 OK received).** All 6 changes in engine/ModelCore.ts (with
M12-proper-#1 Phase-1 code comments). Baseline reproduces the candidate EXACTLY
(AoP 118.4/81.4, RAP 2.99, LAP 5.45 gradient +2.46, CO 4.93, EF_L 0.589); baseline
snapshot REGENERATED. Full suite = **99 pass / 1 fail**. ONLY failure = official MR
case (mr-001) degeneracy: EF 0.976 > 0.92 guard — mitralRegurgitation 0.7 was
calibrated to the M12-lite operating point; at the new lower-afterload/lower-LV-
contractility point the LV over-empties via dual forward+regurgitant outflow.
MR directionality test still PASSES. OPEN: reduce mr-001 severity (per-case retune,
0.7→lower) to clear the guard — awaiting lead/claude1 on the exact value + sweep.
officialCases.ts UNTOUCHED so far. NOT committed.

Exact changes (6 — rvTmaxScale UNCHANGED):
| File / site | From | To |
|---|---|---|
| ModelCore `buildNodes` SV `Vu` (L200) | 2500 | 1590.909 |
| ModelCore `buildNodes` VC `Vu` (L201) | 250 | 159.091 |
| ModelCore `buildEdges` PVein_LA `R` (L230) | 0.02 | 0.012 |
| ModelCore `defaultParams` systemicResistance (L153) | 1.25 | 1.10 |
| ModelCore `defaultParams` arterialStiffness (L156) | 1.0 | 0.75 |
| ModelCore `defaultParams` lvTmaxScale (L171) | 1.0 | 0.80 |
| ModelCore `defaultParams` rvTmaxScale (L172) | 1.0 | **1.0 (no change)** |

POST-APPLY VERIFICATION (lead, important): the −20% baseline LV contractility
(lvTmaxScale 0.80) shifts EVERY official case's operating point. After applying:
1. Regenerate the baseline snapshot.
2. RE-VERIFY all official cases teach correctly — check directionality/clamps for
   **dobutamine, LV-failure, AS, MR, hypovolemia** especially; 0 clamps where
   required.
3. Run the FULL suite.
4. If any official case regresses, FLAG it — may need a per-case dose/severity
   retune (like the M12-lite dobutamine retune). Hand lead the green result + diff
   for the review-gate + Phase-1 commit.

## 1. Atrial defaults (chambers.ts) — from §B7.1

Spread `defaultActiveLV` then override geometry + force + Ca + timing. Values are
codex1's §B7.1 starting box (re-fit after the circuit pass):

```ts
export const defaultActiveLA: ActiveChamberParams = {
  ...defaultActiveLV,
  V0: 5, Vw: 15.9, Vref: 45, Vmin: 1,
  Trel0: 0.09, TrelMin: 0.06, TrelMax: 0.12,
  tauCa0: 0.08,          // shorter atrial Ca transient (LV 0.18)
  Arel0: 0.30,           // LV default 0.12 too weak for an atrial a-wave
  sigmaPas0: 80, bPas: 8, lambdaPas0: 0.90,   // soft atrial passive; NOT a mean-LAP lever
  Tmax0: 20000,          // sweep 10-40 kPa to the a-wave gate
  geomChi: 1.121,        // thin-wall thick-sphere (NOT LV 1.36)
  atrialLeadSec: 0.16,   // NEW FIELD (see §2) — HR-aware; thetaOn derived at runtime
};
export const defaultActiveRA: ActiveChamberParams = {
  ...defaultActiveLA,
  Vref: 55, Vw: 18.2, Tmax0: 15000, geomChi: 1.112,
};
```

## 1b. Timing — HR-aware, NOT static thetaOn (resolves claude1 gate + §B7.1)

claude1 §A3/§A7 mandates preserving the existing HR-aware `~0.16/T` (~160 ms)
lead. A static `thetaOn` fraction would NOT hold a constant ms-lead across HR, so:

- Add `atrialLeadSec?: number` to `ActiveChamberParams` (optional; ventricles omit
  it → behave exactly as today).
- In `ActiveStressChamberModel.internalDerivatives`, derive the onset when the lead
  is set, else fall back to the static `thetaOn`:

```ts
const T = 60 / Math.max(ctx.HR, 20);
const thetaOnEff = this.ap.atrialLeadSec != null
  ? frac(1 - this.ap.atrialLeadSec / T)   // HR-aware constant-ms lead
  : this.ap.thetaOn;
const pulse = raisedCosinePulse(theta, thetaOnEff, durationTheta, T);
```

`raisedCosinePulse` already wraps (`s = frac(theta - thetaOn + 1)`, math.ts L41),
so onset≈0.80 straddling θ=1→0 is fine. NOTE (§B7): the pressure a-wave PEAK lags
the onset (Ca/activation lag) — in the §B7 prototype peak θ≈0.93 for a 160 ms
onset. If a-wave timing reads late vs the ECG P→a interval, start the lead earlier
(sweep `atrialLeadSec` 0.12-0.18). Keep `thetaOn: 0.80` on the params as the
documented static fallback.

`atrialLeadSec` lives on `ActiveChamberParams` → it is PER-CHAMBER by construction.
Per claude1: default BOTH LA and RA to 0.16 s for this migration (behavior-neutral,
matches the current elastance baseline which applies 0.16/T to both; no A7 gate
depends on inter-atrial delay). DEFERRED refinement (not now): physiologically the
RA leads the LA by ~30-50 ms (SA node in RA, Bachmann's-bundle conduction), so the
fully-correct model is RA `atrialLeadSec ≈ 0.20` vs LA `0.16` (both still in the
120-200 ms gate). Enabling it later is a one-line param change — flagged on the
deferred list, only worth doing if simultaneous CVP-vs-LAP a-wave timing becomes a
teaching target.

---

## 2. ModelCore wiring — adopt codex1 §B8 (generalize, don't hard-code +4)

The active internal Ca/activation state is hard-coded LV/RV. Rather than add four
more fixed `cLA/aLA/cRA/aRA` fields, **generalize** (codex1 §B8.1):

1. **StateIndex / makeIndex()** — replace the fixed `cLV,aLV,cRV,aRV` with a
   generated `activeInternal: Record<Chamber,{c:number;a:number}>` built by
   iterating the active heart chambers, each allocating two slots. idx.size grows
   by +4 (two atria × {c,a}). Keep `phi` etc. unchanged.
2. **activeModels** (L244) — widen `Record<"LV"|"RV",…>` →
   `Partial<Record<Chamber, ActiveStressChamberModel>>`; construct LA/RA from
   `defaultActiveLA/RA`.
3. **Node specs** (L192/L194) — LA/RA `kind:'heartElastance'`→`'heartActive'`,
   add `active: defaultActiveLA / defaultActiveRA`.
4. **reset()** (L304-309) — loop active chambers, seed each chamber's {c,a} slots
   from `model.initialInternal()` (no longer LV/RV-specific).
5. **rhs()** (L803-810) — iterate active heart nodes; write `cDot/aDot` into that
   chamber's slots via the generated map.
6. **computePressures() heartActive branch** (L851-860) — currently casts
   `ch as "LV"|"RV"` and picks `x[idx.cLV]` vs `cRV`. Replace with
   `activeModels[ch].pressure(V, internal_from_map[ch], chamberCtx(ch,x))`.
7. **chamberCtx()** (L885) — binary `isLV ? lv* : rv*`. Atria must NOT inherit RV
   knobs. Route atria to: `contractility: 1.0` (don't inherit the ventricular
   contractility knob), `tmaxScale: p.atrialContractility` (the new clinical knob,
   §6), `geomScale: 1`, `caReleaseScale: 1`. This isolates atrial contractility
   under its own knob and keeps base atrial mechanics in `node.active`.
8. **sanitizeState()** (L1046-1049) — clamp every active chamber's {c,a} via the
   map (mirror the LV/RV `clamp(c,0,5)`/`clamp(a,0,1)`), not four fixed lines.
9. **setImmediateParameters() rebuild** (L358-362) — the loop restricts to chamber
   LV/RV; extend to ALL heartActive nodes with `active` so atrial
   `nodeOverrides.active` edits take effect.

`rebuildElastanceModels()` (L899) already builds elastance models for BOTH
heartElastance AND heartActive nodes, so the `stableElastanceBaseline` opt-out
(heartModel==='elastance' → elastance path, L846) keeps working for atria. Good.

---

## 3. Breakage / must-touch checklist

1. **State-vector layout change (+4)** — RESOLVED (lead, confirmed): save-load
   (`casePersist`/`caseDoc`) serializes **knobs/params/panels, NOT the raw `x`**;
   `StateSnapshot` is a **runtime-only settled-state cache**. So the +4 atrial
   state slots need **NO save-load layout migration and NO schemaVersion bump**
   (the persisted format does not pin `x`). The only follow-up: **rebaseline the
   frozen baseline snapshot post-gate** (its values shift — that's the point).
   `SimSample` exposes only `aLV/aRV`; add `aLA/aRA` if observability needs it
   (§B8.8). [Correction note: an earlier draft of this doc wrongly claimed
   StateSnapshot persists raw `x`+schemaVersion — that was my assumption, not
   lead's word; lead's actual answer is the above.]
2. **Atrial initial volumes** — LA/RA node `x0:60`, `V0:5` were elastance-tuned.
   For active-stress, start near λ≈1 for the new Vref (45/55) so first beats sit on
   the passive curve. Retune x0.
3. **officialCases.ts** — migrate any atrial elastance overrides (alpha/beta/Ees)
   to `active:{…}`; inert otherwise. (Grep before execution.)
4. **Snapshots/baselines** — knobs/baseline/officialCases tests shift (the point);
   rebaseline post-gate, with the snapshot-version bump from item 1.
5. **knob resolver** — any knob scaling atrial Ees → remap onto atrial Tmax0.
6. **Calibration discipline (§B7.1)** — if a-wave too small: raise
   Arel0/caReleaseScale/Tmax0, NOT bPas. If too tall/narrow: lower Arel0/Tmax0 or
   shift timing. If mean LAP low with good a-wave: that's the CIRCUIT pass's job.

---

## 4. Execution order (once circuit pass + params land)

1. chambers.ts: add `atrialLeadSec?` to `ActiveChamberParams`; HR-aware onset in
   `internalDerivatives`; add `defaultActiveLA/RA` (§B7.1 values).
2. ModelCore.ts: §2 items 1-9 (generalized state map, registry, node kind, reset,
   rhs, pressure dispatch, chamberCtx, sanitizeState, override rebuild).
3. Run suite; inspect LA/RA PV loops + a/v/x/y waveform SHAPE first (team priority:
   shape > metric values), then the §A7 numeric gates.
4. Bump StateSnapshot version + rebaseline after review-gate sign-off.

## 5. Open questions (remaining)

- lead: where is the `x`-vector layout serialized (StateSnapshot/save-load) so I
  can migrate it for the +4 slots? (breakage #1) — still open.

RESOLVED: atrialContractility knob → APPROVED, add it (§6). Circuit pass owner →
codex1 sweeps, claude2 applies (Phase 1). Timing → `atrialLeadSec` + HR-derived
onset, per-chamber, both default 0.16 (§1b).

---

## 6. `atrialContractility` clinical knob (HUMAN APPROVED)

A user-facing clinical knob scaling atrial active stress (the booster / a-wave),
analogous to `lvTmaxScale`/`rvTmaxScale` for the ventricles. Wiring:

1. **`CoreRuntimeParams`** (protocol.ts): add `atrialContractility: number`,
   default `1.0` in `defaultParams()` (ModelCore L147).
2. **chamberCtx()** (§2.7): atria get `tmaxScale: p.atrialContractility`.
3. **smoothParams()** (L1000-1003): add `atrialContractility` to the smoothed-nums
   list so live edits ramp like the other scales.
4. **HARD_CLAMP / RUNTIME_CLAMP_KEYS** (protocol.ts): add range 0-3 (matching the
   ventricular tmaxScale clamp) so sanitizeParams + the per-frame clamp bound it.
5. **NEUTRAL_PARAMS** (protocol.ts): add `atrialContractility: 1.0` so the
   neutral/reset baseline includes it (lead requirement).
6. **Knob resolver** (engine/knobs.ts / instanceKnobs.ts): surface
   `atrialContractility` in the knob vocabulary; any legacy atrial-Ees knob remaps
   onto it. **A NEW knob in the vocabulary IS a mapping change → BUMP
   `KNOB_MAPPING_VERSION`** (lead: unlike the bPas-default case, this one bumps).
   Regenerate the frozen-resolver snapshot + update ALL knob tests/snapshots.
7. **UI**: atrial-contractility slider (clinical lessons: weak atrium / AF-like
   loss of kick low, hyperdynamic high). Coordinate the control with lead's UI work.

CAUTIONS (lead): (a) route the scale ONLY to LA/RA — never LV/RV; (b) neutral 1.0
must reproduce the calibrated baseline exactly; (c) this knob governs the
a-wave/booster ONLY (§A4/§B5) — NOT a mean-LAP lever.

---

## 7. Phase-2 CONCRETE DIFF DRAFT (drafted while holding for Phase 1; apply after P1 commits)

Verified against real source. Apply order = chambers.ts → ModelCore.ts → protocol.ts
→ knobs.ts → instanceKnobs.ts → tests.

### 7.1 engine/chambers.ts
- Add to `ActiveChamberParams`: `atrialLeadSec?: number` (optional; ventricles omit).
- In `ActiveStressChamberModel.internalDerivatives`, replace the `thetaOn` use:
  ```ts
  const thetaOnEff = this.ap.atrialLeadSec != null
    ? frac(1 - this.ap.atrialLeadSec / T)   // HR-aware constant-ms atrial lead
    : this.ap.thetaOn;
  const pulse = raisedCosinePulse(theta, thetaOnEff, durationTheta, T);
  ```
  (`T = 60/HR` already computed above; `frac` already imported.)
- Add `defaultActiveLA` / `defaultActiveRA` (§1 values, both `atrialLeadSec: 0.16`,
  keep `thetaOn: 0.80` as documented fallback).

### 7.2 engine/ModelCore.ts
- Import `defaultActiveLA, defaultActiveRA`.
- `StateIndex` + `makeIndex()`: replace fixed `cLV,aLV,cRV,aRV` with a generated
  `activeInternal: Record<Chamber,{c:number;a:number}>` allocating 2 slots per
  active heart chamber (LV,RV,LA,RA) → idx.size +4. Helper to list active chambers.
- `activeModels`: `Record<"LV"|"RV",…>` → `Partial<Record<Chamber,ActiveStressChamberModel>>`;
  add LA:`new ActiveStressChamberModel(defaultActiveLA)`, RA: defaultActiveRA.
- `buildNodes()` L192/L194: LA/RA `kind:'heartElastance'`→`'heartActive'`,
  add `active: defaultActiveLA / defaultActiveRA`. Retune atrial `x0` (start ~λ1).
- `reset()` L304-309: loop active chambers, seed each `{c,a}` slot from
  `model.initialInternal()`.
- `setImmediateParameters()` rebuild loop L358-362: drop the `chamber==='LV'|'RV'`
  restriction — rebuild for ALL heartActive nodes with `active`.
- `rhs()` L803-810: loop active chambers, write `cDot/aDot` to their slots.
- `computePressures()` heartActive branch L851-860: read `activeInternal[ch]` slots
  and `activeModels[ch]` (drop the `ch as "LV"|"RV"` cast + cLV/cRV ternary).
- `chamberCtx()` L885-896: atria → `contractility:1.0`,
  `tmaxScale: p.atrialContractility`, `geomScale:1`, `caReleaseScale:1`.
  Ventricles unchanged.
- `sanitizeState()` L1046-1049: clamp every active chamber's `{c,a}` via the map.
- `defaultParams()` L147: add `atrialContractility: 1.0`.
- `smoothParams()` nums list L1000-1003: add `"atrialContractility"`.

### 7.3 engine/protocol.ts  (VERIFIED — earlier draft was wrong)
- `CoreRuntimeParams`: add `atrialContractility: number;`.
- **`CORE_NUMERIC_KEYS`** (L139): add `"atrialContractility"`. ⚠ CRITICAL —
  `sanitizeParams` REBUILDS params from this whitelist, so a param NOT listed is
  silently DROPPED before the integrator (the chamberCtx read would always see the
  fallback, making the knob a dead no-op).
- **`NEUTRAL_PARAMS`** (L155): add `atrialContractility: 1.0`. ⚠ It EXISTS (§7.7);
  `caseContract.test.ts` asserts `NEUTRAL_PARAMS` deep-equals `defaultParams()`, so
  both must carry the field at the SAME value.
- `HARD_CLAMP` (L106): add `atrialContractility: [0.1, 3.0]` (form like lv/rvTmaxScale;
  lead said "0-3", 0.1 floor mirrors the tmax clamps, avoids the zero-stress edge).
- **`RUNTIME_CLAMP_KEYS`** (L131): explicit list, NOT auto-derived — add
  `"atrialContractility"` so smoothParams clamps it at runtime.

### 7.4 engine/knobs.ts  (⚠ VERSION = STRING; ADD a resolver, don't mutate)
`KNOB_MAPPING_VERSION` is a STRING (`"knobmap-0.2-activestress"`); rule (L119): never
edit a published mapping in place — add a NEW version.
- Add `resolveActiveStress_0_3` = copy of `resolveActiveStress_0_2` PLUS one line:
  `atrialContractility: base.atrialContractility * k.atrialContractility` (multiplier,
  symmetric with `lvTmaxScale: base.lvTmaxScale * k.contractility`).
- `KNOB_RESOLVERS["knobmap-0.3-atrialcontractility"] = resolveActiveStress_0_3;`
  (KEEP 0.2 so old cases resolve identically).
- Bump `export const KNOB_MAPPING_VERSION = "knobmap-0.3-atrialcontractility";`.
- `ClinicalKnobs` interface: add `atrialContractility: number;` (multiplier, 1.0=base).
- `KNOB_RANGES`: add `atrialContractility: [0.25, 2.5]` (mirror contractility).
- `neutralKnobs()`: add `atrialContractility: 1,`.
- (Optional `KNOB_TEACHING_SAFE`: `atrialContractility: [0.4, 1.8]`.)

### 7.5 engine/instanceKnobs.ts
- No structural change: consumes `ClinicalKnobs`/`KNOB_MAPPING_VERSION` generically.
  Once the field is in `ClinicalKnobs` + `neutralKnobs`, instanceKnobs flows through.
  Verify the default-knob path includes it (via neutralKnobs).

### 7.6 Tests / snapshots (real files — verified)
- `caseContract.test.ts`: asserts `NEUTRAL_PARAMS` === `defaultParams()` — passes only
  if both add `atrialContractility: 1.0`. (Primary guard.)
- `knobs.test.ts`: mappingVersion → `"knobmap-0.3-atrialcontractility"`; add a
  resolution test (off-neutral scales `params.atrialContractility`; neutral 1.0 →
  baseline byte-for-byte; old 0.2 still resolves via 0.2).
- `instanceKnobs.test.ts`: default knobs include the new field.
- `caseResolve.test.ts` / `caseDoc.test.ts` / `casePersist.test.ts`: any
  KNOB_MAPPING_VERSION assertion → 0.3.
- `chambers.test.ts`: add active-atria coverage (LA/RA a-wave; knob scales it; neutral
  reproduces baseline).
- `baseline.test.ts` + `officialCases.test.ts`: REBASELINE post-gate — only after
  review-gate sign-off.
- Regenerate `engine/__tests__/__snapshots__` frozen-resolver snapshot.

### 7.7 CORRECTION — `NEUTRAL_PARAMS` DOES exist (I was wrong)
I earlier flagged that `NEUTRAL_PARAMS` doesn't exist — WRONG. It's at
`engine/protocol.ts` L155 and `caseContract.test.ts` L22-25 asserts it deep-equals
`defaultParams()`. lead's checklist item was correct: add `atrialContractility: 1.0`
to BOTH `defaultParams()` and `NEUTRAL_PARAMS`, PLUS `CORE_NUMERIC_KEYS` (else
sanitizeParams drops it). Covered in §7.3 — no open question here.

### 7.8 Phase-2 CALIBRATION GOALS (after the structural diffs run)
Once the §7.1-7.7 structural migration compiles and runs, calibrate the atrial
params (codex1's §B7.1 box is the start) to the COMBINED FINAL gate + the figure-8:
1. **a-wave** +3-6 mmHg, v>a, LAEF 45-65%, booster 20-30% of LV EDV — via
   `Tmax0`/`Arel0`/`caReleaseScale`, NOT passive stiffness (§A4/§B5).
2. **Figure-8 reservoir loop** — open the collapsed v-loop via atrial relaxation
   KINETICS (`Arel0`, `tauCa0`, `Trel0`/`TrelMax`) + `atrialLeadSec` so the atrium
   sits at different stress on fill vs empty (hysteresis). NEVER via `sigmaPas0`/
   `bPas` (collapses it). claude1 owns the numeric pass/fail (a/v loop areas) — wire
   the gate in once she posts it.
3. **atrialContractility knob** sweep 0.25-2.5: low = weak/AF-like loss of kick
   (reservoir-dominant, small a-loop), high = hyperdynamic (large a-loop); neutral
   1.0 reproduces the calibrated baseline.
Iteration is read-only sweeps (codex1) → I apply the chosen params → re-check gate.
WAVEFORM SHAPE first (team priority), then numeric gates.
