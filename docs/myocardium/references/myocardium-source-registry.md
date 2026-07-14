---
title: "Myocardium source registry — Revision 3"
status: "Proposed"
date: "2026-06-26"
source_of_truth: "../../../data/myocardium/sources.json"
---

# Myocardium source registry

実装者は `data/myocardium/sources.json` をmachine-readable source of truthとして使用する。

## Policy

- `verificationStatus: verified` 以外のsourceをPhase Aの方程式、parameter、target、acceptance thresholdへ使用しない。
- 略記、PMID-only、二次引用をそのまま実装sourceへしない。
- source parameterを変更する場合は派生parameter-set IDを発行し、sourceとの差分を保存する。
- equation fixtureにはsource IDとequation/table/figure locationを必須とする。

## Phase A normative sources

1. Land et al. 2017 — Land equations、source parameter variants、cell/tissue protocols.
2. Regazzoni & Quarteroni 2020 — active-stiffness stabilization and solver comparison.
3. Regazzoni et al. 2022 — closed-loop energy/coupling context.

## Verified comparison sources

- Land & Niederer 2018 — atrial cross-bridge cycling and calcium-sensitivity literature prior; not a digitized target or patient fit.
- Marchesseau et al. 2013 — BCS calibration/identifiability comparison.
- Caruel et al. 2014 — dimensional reduction and calibration methodology.
- Regazzoni, Dedè & Quarteroni 2020 — RDQ20 research comparison.
- CircAdapt TriSeg 2407 documentation — Phase 4 mechanics candidate definition.

## Excluded unresolved shorthand

`Caruel–Moireau–Chapelle 2019 / PMID 30607642` は、完全書誌と実装上の役割が確定するまでsource registryから除外する。これは「存在しない」と断定するものではなく、誤ったcitationをnormative sourceにしないための保留である。
