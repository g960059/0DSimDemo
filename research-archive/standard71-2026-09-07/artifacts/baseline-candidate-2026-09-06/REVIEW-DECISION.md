# 外部レビューの採否 — 2026-09-06

ユーザーの変更条件は Claude Fable 5.1 max / Codex 6 Astra max の **1/2 の賛同**。以下はその適用記録であり、臨床・実験的な独立検証ではない。

## 1. 採用候補の指定

対象は `final-response-v1/vascular-center-R1.04` と、それと同じ construction の `selected-fine-v1`。**HR70 の研究内 baseline 採用候補とする。公開 exact model の mint、既定 baseline、Surface/analysis schema の変更は含めない。**

- **Codex 6 Astra max: 支持確定。** 初回提案時の条件は、同構成の独立 cold 1 ms、Tref ±20% の非再fit応答、生波形確認、同一構成2-grid圧微分品質、checkpoint復元後の次周期完全一致と異構成拒否だった。全条件の実データ・テストを確認した最終レビューで、追加の係数探索は不要、採用候補に賛同、と確定した。
- **Claude Fable 5.1 max: 条件付き支持。** 最終回答を [claude-final-review.md](claude-final-review.md)、無加工CLI出力を [claude-final-review.jsonl](claude-final-review.jsonl) に保存。実行モデルは初期化イベントで `claude-fable-5-1`、CLI指定は `--effort max`。同構成fine、HR60の報告、公開mint前の血管profile比較・単一owner化・既知逸脱記録を条件に挙げた。回答はR1.04のfine完了前に読んだ情報を含むため、その「pending」はその後の実結果で更新する。

**判断:** Astraの支持確定により、候補指定の1/2条件を満たす。Claudeの回答を無条件のmint承認として数えない。通常fit domain、公開control range、臨床正常域が承認されたという解釈はしない。

### Astra最終レビューの要旨

同じ構成のcold1msでAoP121.73/84.44、CI3.211、ET268、ICT67.14、IRT96、Tei0.609が成立。高容量でCO+6.92%、平均LA圧+6.82mmHg、低高容量とも単峰・PV後半陥凹なし。Tref上下端は正常gateへの再fitをしておらず、CO−4.50%/+2.80%という限定的だが方向性のある応答がある。圧微分の2-grid差0.97–3.30%と隣接区間支持、checkpoint検証も確認。高めの+dP/dt、後半寄りの圧ピーク、圧負担を伴うpreload reserveは残る。正常ヒトの材料定数の一意同定、広いpreset域の検証、元の材料/細胞fit保持には反対。安定したモデル内基準点としては支持。

## 2. 今回永続化する研究コードの範囲

| 変更 | Astra | Claude最終 | 判断 |
|---|---|---|---|
| CaT50refとbeta1の単一ownerによる同時研究校正 | 賛同 | 賛同 | 採用。正のCaT50、有限範囲、重複owner拒否、通常baseline-fit role拒否を維持 |
| Ca rise fractionの有限連続範囲0.3–1 | 賛同 | 賛同 | 採用。既存Ca状態数のまま、実eventのriseを変更する |
| Ca peak 0.4–1.2 µM研究入力 | 賛同 | 賛同 | 採用。ヒト正常域というclaimはしない。最終候補はpeakを変更していない |
| Trefのintervention-only上限240→320kPa | 賛同 | 賛同 | 採用。固定候補239kPaの約191/287kPa実応答試験用。通常fit上限198kPaは変更しない |
| 自構成に限った研究checkpoint保存/復元 | 賛同 | テスト確認・異affinity拒否追加提案 | 採用。公開Standard70 checkpointとしてのexportを禁止したまま |

これらは研究constructionに閉じる。公開の材料profile・Ca profile・model identity・既定baselineを今回変更していない。受理閾値やgate役割も、この43実行中には変更していない。

## 3. レビュー提案の取捨選択

採用したもの:

- Claude初回案のsource bridge rates/Aeff、Caピーク/affinity transferを実験で比較。4条件、続けてphi×bridge-exitの4条件を実施した。全安静条件を同時に満たす解はこの範囲では得られず、主候補へ置き換えない。
- Tref120kPaを普遍的なヒト材料定数の上限とは扱わず、有限の独立振幅と実応答で評価する。最終候補のTref239kPaの絶対値には未同定性が残る。
- 復元先のaffinity pairを変えた場合にも拒否される回帰テストを追加。Tref/riseと合わせて検証。
- HR60も追加で報告。同じ構成・TBV・血管条件のままcold定常化し、Ao119.6/78.7、CI3.061、ET286、Tei0.469。RVEDVI91.69のみ安静基準上限90を超えた。HR60を全基準合格baselineとして扱わない。
- 後半寄りのLVP/AoPピーク、平均PAP、EDP、preload圧負担を既知の限界として残す。

今回採用しない/次段階へ分離するもの:

- Ca peak上限1.5µMへの追加拡張: 現在の候補と比較に不要。データ条件との整合性を確認してから、必要な実験の範囲として提案する。
- 既存recovered-root/Zc profileへの置換: 公開mint前の有限な別比較として有用だが、今回の候補証拠には混ぜない。Ao storage node、近位圧、valve loss、圧回復、inertanceのownerと測定場所を揃える必要がある。表示にZcQを足すだけで基礎力学の妥当性を主張しない。
- `arterialStiffness = 1.42/0.65` への単純統合: そのままは採用しない。現研究scaleはsystemicだけ、既存stiffnessは他のarterial nodeにも作用するので、PV曲線・Vu・PAを含む等価性を確認せず置換してはいけない。
- late peakをすべて「心筋でなく血管が原因」と断定: 有力な仮説だが未分離。実装は複数storage nodeを持つ閉ループで、理想2-element Windkesselと同一ではない。
- valve-node gradientをそのままDoppler-equivalentとして新しい上限を導くこと: 不採用。計測定義の整合性が先。

## 4. 次の公開取り込みの境界

追加の無制限fittingは止め、候補を固定して扱う。公開取り込み時は研究スイッチを大量に公開せず、一つの版付き材料/Ca/血管構成へ整理し、最新互換Surfaceとそのanalysisを継承する。生波形上のlate peakと圧計測位置は、既存root profileとの比較で採否を明示する。公開control範囲・settled baseline・mint証拠の変更は、その具体的差分を改めて1/2レビューに出す。
