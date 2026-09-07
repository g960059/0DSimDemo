Static review complete. I read all in-scope files, the two artifacts, the report and decision log, and checked the sources I could reach. I could not run the test suite, since this session has no shell, so test results below are the parent's, not mine.

## Verdict: APPROVE (scope-limited)

The patch does what it claims. It is additive, returns no pass count, no demographic selection, no epsilon, and no admission decision. Source transcriptions match everything I could verify independently. Two follow-ups are recommended but neither blocks.

**Source verification**

| Source | What I checked | Result |
|---|---|---|
| ESC/ERS 2022 Table 11 (local PDF p.3646) | RAP 2–6, sPAP 15–30, dPAP 4–12, mPAP 8–20, PAWP ≤15, CI 2.5–4.0, SVI 33–47; mid-thoracic zero, end-expiration | Matches profile exactly |
| SCMR 2025 Tables 2/8 (PMC final) | Sex-specific pooled-adult EDVi/ESVi/EF, papillary/trabeculae in mass | All twelve bounds match |
| Copenhagen 2023 (PMC) | LVET 292±23, 95% PI 248–336; HR 63±10; TDI M-mode through anterior mitral leaflet | Matches. Sex strata also published (F 253–338, M 242–330) but not listed |
| van Oort 1988 (Europe PMC abstract) | 215 subjects, 1–65 y, PA and RVOT stations, no adult ET numbers | Matches registry verificationScope |
| Herbert 2014 Table 2 | Paywalled; abstract elided on every mirror I tried | **Not verified by me.** Accepted on the parent's stated full-text check |

**Code findings**

- **Correct and defensive.** EF derived from the same two closure landmarks, redundant field ignored. Inconsistent Ao/PA summaries, disordered landmarks, wrong valve IDs, and non-finite values all throw. Missing landmarks stay null with every comparison marked unavailable. The artifact statuses are consistent with the numbers, including the marginal dPAP exceedance and the one Ao max stratum miss.
- **Runner integration is additive.** Output field, protocol identity component, and source snapshot only. The job type restricts HR to 60 or 70 and BSA comes from the fixed 1.9 prior, so the fail-fast in the comparison cannot fire from a valid job today.
- **Follow-up 1, ET observer wording.** The comparison uses accumulated positive AoV-flow duration from the gradient accumulator. The existing gate observer sums accepted steps over the first forward episode. These coincide only when the LVP forward-episode count is one, which this readback does not check. The mapping string reads as if the single-episode condition is enforced here. Reword to say the condition is enforced by the separate morphology check, or pass the episode count in. Values agree for both saved candidates.
- **Follow-up 2, fail-fast placement.** If the job type is ever widened, the throw at the end of a settled run discards the whole result. A "not-applicable" record, or a guard before simulation, would be safer.
- **Nits.** The one-sided PAWP limit reports "inside-source-range", which is slightly generous wording for "not above a clinical upper limit"; the statistic field disambiguates. Copenhagen could list the sex strata for consistency with the CMR entries.

## Admission-policy recommendation

**Principle for limits versus warnings.** A source can support a prospective engineering operating limit when the model observable and the source observable are the same physical quantity class, the interval is a published resting reference, and no transfer function is needed. Otherwise it is a warning.

**Operating limits (blocking), declared as engineering envelopes for a sex-unspecified BSA 1.9 subject, not as a normal population:**

- ESC/ERS Table 11 for mean RA, sPAP, dPAP, mPAP, and CI on signed net AoV flow. The lumped invasive-like nodes without respiration are closest to end-expiratory catheter values. mPAP must be included, since it is the threshold the old candidate missed.
- SCMR 2025 anatomical LV and RV EDVi, ESVi, EF at the **intersection** of the male and female intervals. Intersection is the stricter choice for a sex-neutral subject and is the opposite of cherry-picking. Union would be the cherry-pick. Treat the three per ventricle as one family, since EF is derived.

**Warnings (report, do not block):**

- SVI: algebraically coupled to CI at fixed HR. Report both intervals, gate on CI only.
- PAWP ≤15 on mean LA: not a wedge, no lower bound.
- Copenhagen LVET, pooled and by sex: color-TDI leaflet timing versus hydraulic duration, HR 63 versus 70.
- Herbert cSBP P10/P90: noninvasive, cuff-calibrated, age-stratified.
- Existing construction intervals for AoP max/min, AV ET, PV ET stay as construction constraints labelled as such. They gain no new provenance from this patch.

**Consequence for TBV4935 under those limits, stated without softening:**

| Limit | 4935 at 2 ms / 1 ms | Status |
|---|---|---|
| dPAP 4–12 | 12.056 / 12.034 | Outside by ~0.05 |
| mPAP 8–20 | 17.89 / 17.87 | Inside |
| Everything else in the limit set | see comparison.json | Inside, both sexes |

**Working candidate: yes. Mint: not yet.** TBV4935 is the right working candidate. It is the only explored point that brings mPAP, LA mean, and native LVEDP down while keeping CI inside, with identical construction, all rest checks passing at both steps, and a reserve failure confined to one amplitude criterion. Working-candidate selection means it is the reference point for further diagnostics and any subsequent single-variable move. Minting needs three explicit decisions first, none of which should be made by re-running until it passes:

1. **Freeze the prospective policy** above with one 1/2 review, before rescoring.
2. **Decide the 1 mmHg atrial-pressure floor as a policy item.** My view: it was never derived from data, the pressure amplitude under fixed-TBV change is a closed-loop property, and the CO, EDV, and Ptm responses are substantive. Removing a non-derived amplitude criterion in favour of direction plus substantive response is defensible. Lowering it to 0.95 is not. Record it as "criterion removed for lack of derivation", never as "candidate passes".
3. **Handle the dPAP miss honestly.** Either mint with dPAP recorded as a known marginal miss in the release notes, or pre-register one pulmonary-side single-variable move chosen by the model owner, run once at 2 ms then 1 ms, and stop regardless of outcome. The report already identifies that the pulmonary resistance knob scales only two of five segments, which is a plausible single lever. No grid, no myocardial retuning.

**Carry as known limitations, not blockers:** hydraulic ICT near 90 ms and Tei near 0.7 (about twice the Copenhagen IVCT prediction interval, method mismatch acknowledged), late LVP and AoP peak phase, ±dP/dt warnings, Weiss versus Glantz tau gap, and LV ED transmural pressure above 20 mmHg at the high-volume reserve endpoint.

Sources checked: [ESC/ERS 2022 local PDF](artifacts/physiology-evaluation-2026-09-07/references/esc-ers-2022.pdf), [SCMR 2025 PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12159681/), [Alhakak 2023 PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11946970/), [van Oort 1988 Europe PMC](https://europepmc.org/article/MED/3383877), [Herbert 2014 abstract page, paywalled](https://academic.oup.com/eurheartj/article/35/44/3122/2293191).