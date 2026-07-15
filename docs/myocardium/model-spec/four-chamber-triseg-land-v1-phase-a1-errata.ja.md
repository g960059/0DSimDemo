# Four-chamber TriSeg + Land v1 — Phase A1 errata

**状態:** 規範的な安全側補正。英日親仕様の Section 9.4 / 19.1 へ統合済み。
**対象:** `four-chamber-triseg-land-v1.md` Section 9.4 / 19.1 の TriSeg Taylor 誤差域。
**一次資料:** [Lumens et al., 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2758607/)

## 1. 訂正理由

親仕様は、published fourth-order Taylor tension の誤差が
`|z| < 0.8` の全域で 2% 未満であるかのように読める。しかし、Appendix A4 の
厳密な無次元張力係数

\[
F_{exact}(z)=\frac{\operatorname{atanh}(z)}{z}
\]

と、published Taylor 係数

\[
F_{Taylor}(z)=1+\frac{z^2}{3}+\frac{z^4}{5}
\]

を直接比較すると、その主張は成立しない。厳密係数を分母とする相対誤差

\[
\varepsilon_T(z)
=\frac{|F_{exact}(z)-F_{Taylor}(z)|}{F_{exact}(z)}
\]

は次のとおりである。

| \(|z|\) | \(\varepsilon_T\) |
|---:|---:|
| 0.68 | 1.836% |
| 約 0.68872 | 約 2.000% |
| 0.70 | 2.231% |
| 0.79 | 5.184% |
| 0.80 | 5.681% |

原著の「生理的作動域で 2% 未満」という記述と、Appendix C の adjusted strain
approximation に関する `|z| < 0.8` の文脈を、同一の張力誤差保証として扱わない。

## 2. Phase A1 実装規則

1. `|z| < 0.8` は診断継続域の上限として保持する。
2. published Taylor tension を release-reference 候補として扱うための必要条件は、
   各壁で `epsilon_T <= 0.02` とする。
3. `epsilon_T > 0.02` かつ `|z| < 0.8` は、診断は継続できるが
   `within_0p8_diagnostic_envelope_but_exceeds_2pct_tension_error` と分類する。
4. `|z| >= 0.8` は `out_of_domain` とする。
5. この張力誤差 gate は、TriSeg root、scaled equilibrium residual、root branch、
   exact strain、または whole-heart release acceptance を意味しない。

## 3. Appendix A/C 解析参照の昇格

一次式の再照合後、exact strain normalization、`|u|=1/8` のゼロ曲率switch、
級数剰余上界、Appendix A6の仕事共役恒等式、およびruntime級数から独立した
180桁Decimal reference packを英日親仕様へ規範化した。80桁serialize値は240桁
再評価で一致を監査し、C5a解析微分とA4張力は独立した式経路で計算する。また、
A1 verifierはchecked packとのbyte-for-byte再生成一致を検査する。packのcanonical
payload SHA-256は
`c2ff9b98ebfc2015a13ccab399f8240790859515f90af061110a0aa69b4c7cee`
である。

これによりPhase A1 component oracleは完了扱いにできる。ただし、この参照は元の
spherical one-fiber仮定内の数値参照に限られ、解剖学的真値、TriSeg rootの合格、
実験的生理validation、またはclosed-loop releaseを意味しない。

旧 `|z| < 0.8` 一括誤差主張は英日親仕様から削除し、本補正を Section 9.4 と
19.1 に統合した。本ファイルは誤差条件の導出と変更履歴を保持する。
