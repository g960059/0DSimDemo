# 心房Land文献・component監査（2026-07-16）

## 結論

現時点では、心房active materialをLewalle 2026の最尤parameterへ置き換えない。v1はLand 2017の6状態active topologyを保持し、Land--Niederer 2018で独立に変更されたprimitive（`CaT50Ref = 0.86 uM`、`kws`の心室比3倍）だけを再現可能なlegacy candidateとして扱う。心房PV loop形状はLand/calcium parameterのfit targetにしない。

ただし、現在のbase parameter setはLand 2017 Appendix Bの完全な「intact/whole-organ列」ではない。`CaT50Ref = 0.805 uM`、`nTm = 5`、`kuw = 182 1/s`、`kws = 12 1/s`はwhole-organ列だが、`Tref = 40.5 kPa`はskinned cellular force--pCa fitの値である。whole-organ列の`Tref = 120 kPa`はreduced one-fiber wall scaleへのmappingが未解決なので、今回runtime defaultには昇格させない。既存runtime parameter ID/valueは再現性のため変更せず、hybrid source candidateであることを文献referenceに明記した。

Gerach 2021の`CaT50Ref = 1.05 uM`、`beta1 = -0.5 uM`は、現在の6状態active topologyと整合する重要な競合候補として採用する。ただし、Courtemanche Ca、双方向Ca--troponin coupling、AVPDを含むwhole-heart electromechanicsという条件で得られた調整値であり、現在のprescribed Caへ直接移植しない。Strocchi 2023は単一の「推奨心房parameter set」ではなく、Courtemanche--Landのglobal sensitivity/history-matching ensembleとしてのみ扱う。

Lewalle 2026のヒトLA実験値は重要だが、同論文の較正モデルは6状態Landへの単純なparameter updateではない。`Boff`/`Uoff`、力依存OFF--ON feedback、線形parallel passive springを追加した別topologyである。このため、実験observableはv1の独立targetとして採用し、公開model parameterは直接移植しない。

## 一次資料

- Land S, Niederer SA. [Influence of atrial contraction dynamics on cardiac function](https://doi.org/10.1002/cnm.2931). 2018.
- Land S et al. [A model of cardiac contraction based on novel measurements of tension development in human cardiomyocytes](https://doi.org/10.1016/j.yjmcc.2017.03.008). 2017.
- Gerach T et al. [Electro-Mechanical Whole-Heart Digital Twins: A Fully Coupled Multi-Physics Approach](https://doi.org/10.3390/math9111247). 2021.
- Strocchi M et al. [Cell to whole organ global sensitivity analysis on a four-chamber heart electromechanics model using Gaussian processes emulators](https://doi.org/10.1371/journal.pcbi.1011257). 2023.
- Lewalle A et al. [Human atrial skinned muscle fibers exhibit reduced length-dependent activation but show faster force development kinetics than ventricular muscle](https://doi.org/10.1016/j.yjmcc.2025.12.001). 2026.
- Lewalle et al. public model: [AlexLewalle/LA_LV_models](https://github.com/AlexLewalle/LA_LV_models), captured commit `6ce5c37cefe98376671a26bead2984b2c042315a`.

## 文献から固定した内容

Land--Niederer 2018については、`kws`だけを独立に3倍し、`kwu`、`ksu`、`cs`を関係式から再計算する。心房Ca transientの文脈はdiastolic `0.1 uM`、peak `0.6 uM`、model outputはTTP `82 ms`、RT50 `75 ms`である。ただし後二者は独立実験validationではない。現v1 targetのTTP `72 ms`、RT50 `38 ms`との差は残差として報告し、PV loopを使って隠さない。

Gerach 2021では、Land--Niederer parameterをCourtemanche--Landへ入れると、心室収縮とAVPDによる心房stretchで非生理的な心房tension再上昇と収縮延長が生じた。Table 7では心房の`ku = 1/ms`と`nTm = 5`を維持し、length-dependent calcium sensitivityを`beta1 = -0.5 uM`へ、half activationを`CaT50Ref = 1.05 uM`へ変更した。これは全crossbridge rateを独立に再検証した証拠ではない。1000 cycle、BCL `1 s`後のmodel outputはTPT `73.5 ms`、RT50 `78.1 ms`である。この結果は現在問題になっているlate-stretch couplingに直接関係するが、独立したヒト心房parameter測定ではない。

Strocchi 2023のCourtemanche--Land解析は、defaultとして`ca50 = 0.86 uM`、`beta1 = -2.4 uM`、weak-to-strong rate scale `mu = 9`を使い、`Tref`はGSA/HMで`120/100 kPa`、HM範囲は`80--120 kPa`とした。最終的にwhole-organ simulationへ使用可能とされた`148,527` sampleはhistory-matched ensembleであり、単一best vectorではない。また、心房peak tension `20--40 kPa`やduration `240 +/- 25 ms`は、心房実測の不足からventricular data、prior model、whole-organ numerical stabilityに部分的に依存する。従って、`Tref = 120 kPa`またはensemble中の値を現在のone-fiber modelへ直接採用する根拠にはしない。

Lewalle 2026については、37 °C、9 donor、LA 59 preparation、LV 67 preparationの実験設計を記録した。LAの代表的なtargetは、sarcomere length 1.9/2.2 umでのmaximum active force `10.52 +/- 1.17` / `12.60 +/- 1.34 kPa`、minimum passive force `1.40 +/- 0.19` / `2.07 +/- 0.21 kPa`、pCa50 `5.80 +/- 0.02` / `5.82 +/- 0.02`、Hill coefficient `2.25 +/- 0.10` / `2.00 +/- 0.11`、slack--restretch residual fraction `0.76 +/- 0.07` / `0.77 +/- 0.06`である。20 ms slack--restretch後の実測 `ktr` はLA `40 +/- 13 1/s`、LV `15 +/- 3 1/s`である。Supplementはmixed-effects表の`+/-`を「corresponding uncertainty」と記しており、SEMとは明記していないため、reference fieldも`sem`ではなく`reportedUncertainty`として保存する。

公開codeの`ku = 6639.855... 1/s`は、論文表のLand由来固定値`1000 1/s`という記載と一致しない。この不一致を解消するまで、parameter-level reproductionの合否判定には用いない。source unitは`Koff`がdimensionless、`k1`が`1/s`、`koffon`が`1/Pa`である。captured commitにはlicense declarationがないため、公開codeの実装をcopyする根拠にも使わない。

## 今回実装した監査層

- `engine/myocardium/fourChamberV1/land/atrialLandLiteratureReferenceV1.ts`
  - 文献reference SHA-256: `3655a58973ac884eefaefc3d7e29555717f4aef36899283a1a51064de3ea27b7`
  - 現candidate audit SHA-256: `3b9b106a8971f56fbe5890d49b0ce0d4e765ab0d865e03ad77d9cb6afed38485`
  - runtime parameter ID/valueは未変更
  - current baseのhybrid provenance、Gerach competing candidate、Strocchi ensemble-only boundaryをcanonical payloadへ固定
- `engine/myocardium/fourChamberV1/protocols/atrialLandLateStretchComponentProtocolV1.ts`
  - isometric、shortening--hold、shortening--restretch、active-offの4 arm
  - `dt = 1, 0.5, 0.25 ms`
  - 全armをbit-exactに同一のburn-in後状態から分岐
  - electrical eventからCa driveまでの12 ms delayをmanifestにbinding
  - result SHA-256: `1de5a8a72c28b648c0f72d1e3dabda330a2a2c5dd9e8b57509649dddd975a8ff`
- `engine/myocardium/fourChamberV1/protocols/atrialLandGerachCandidateProtocolV1.ts`
  - 現legacy候補とGerach-like候補（`CaT50Ref = 1.05 uM`、`beta1 = -0.5 uM`）を、同一Ca、同一strain、同一`Tref`、同一wall adapterで比較。ただし各candidateは固有のdiastolic equilibriumへ別々にburn-inするため、candidate間のevent前Land状態はbit-exact同一ではない
  - `dt = 1, 0.5, 0.25 ms`のisometric、shortening--hold、shortening--restretchを実行
  - PV loop fitting、PV topology、形態をgateに使用しない
  - runtime defaultとpromotion eligibilityは変更しない
  - audit SHA-256: `59ffed9b20dc156d83230fdbb4f3128487caeb7cb15e6ea407a15ebbb72c03c4`

0.25 ms結果では、restretch minus matched holdのpeakは`64.253693 Pa`（event後`178.5 ms`）で、active-off自己再上昇`0.935137 Pa`を差し引いたcomponentは`63.318556 Pa`だった。一方、総active stressに独立したsecondary spikeは検出されなかった。この結果は「Landにrestretch固有成分がある」ことを示すcomponent診断であり、閉ループのLA/RA v-loop、Lewalleの`ktr` protocol、生理学的妥当性を確立しない。

同じ0.25 ms gridのcontrolled comparisonでは、Gerach-like候補のisometric peak above baselineは`4168.93 Pa`で、現legacy候補`16327.98 Pa`の`0.2553`倍だった。restretch minus matched hold peakは`21.701 Pa`対`64.254 Pa`（`0.3377`倍）、正のcomponent impulseは`1.0753`対`4.0692 Pa s`だった。一方、primary active-stress amplitudeで正規化したcomponentは`0.006283`対`0.004914`で増加した。Ca drive後のpeak時刻は`72.5`から`70.25 ms`、relaxation-50は`38.75`から`34.0 ms`へ短縮した。両候補ともtotal-stress secondary peakは検出されない。`CaT50Ref`と`beta1`を同時に変更し、force scaleも大きく移動するため、この比較からlength sensitivityの低下または上昇を単独同定しない。現在の低いprescribed Ca peak下でabsolute active stressとabsolute componentが大きく下がることだけを結論とし、この結果だけで採択または棄却せず、Ca source、wall-scale mapping、および`CaT50Ref`／`beta1`の分離比較を次段へ送る。

## 未完了gate

- 絶対sarcomere lengthへのone-fiber strain mapping
- cellular/skinned `Tref = 40.5 kPa`およびwhole-organ-column `Tref = 120 kPa`からreduced wall stressへの独立mapping
- Lewalleと同じsteady F--pCa、+/-1% quick length step、20% slack--restretch/`ktr` protocol
- intact human atrial Ca transientの独立source
- SLS-on/off閉ループの同位相・同容積pressure attribution
- multi-start、3-grid、held-out disease envelope

SLS-offで8の字を保持することはgateではない。SLS-on/offは同一解析で報告し、8の字が保持・生成・消失のどれになったかを帰属結果として残す。
