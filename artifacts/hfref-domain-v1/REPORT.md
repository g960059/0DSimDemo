# HFrEF：LV収縮能低下デモの範囲・操作経路検証

2026-09-09。研究worktree `codex/hfref-domain-experiment-v1`。
公開済みStandard72のartifact・baseline・評価記録は変更していない。
この研究候補をStandard73として固定・公開したものではない。

## 採択した範囲

GPT-6 Astra xhighとClaude Fable 5.1 xhighへ一括で独立レビューを依頼し、
両者から条件付き賛成を得た。1/2 gateはAstraの条件に従って満たす。

- LV自由壁と共有中隔の能動張力倍率のみ、下限を0.75から0.25へ拡張。
  上限1.33は維持。RV自由壁・心房・全心室一括操作の範囲は変更しない。
- workbenchの「LV収縮性」はLVFWとSEPを一つのtransactionで同値に設定する。
  個別壁の操作も残す。異なる倍率はmixedとし、平均値で置き換えない。
- 変えるのは能動張力の振幅であり、EF、Ees、viabilityの直接指定ではない。
  Caの時間特性、受動特性、形状、弁、TBV、血管設定はこの候補では変えない。
- baselineから手動で到達できること、同じモデル所有のcheckpointでpresetを
  起動できること、既存の解析・Surface項目を引き継ぐことを採択条件とする。

範囲端での4.8秒の計算継続を検証したが、全Cartesian空間での定常性・
生理的妥当性を保証するものではない。以後の症例ごとに評価が必要である。

## 探索と候補選択

先行するStandard72の現行範囲内の39条件ではHFrEF候補は得られなかった。
LVFW+SEP=0.75の最小EFは45.7%で、冷起動と細かい時間刻みでも再確認された。
これは限定した探索であり、モデル全体の表現不可能性の証明ではない。

研究用の拡張範囲で48条件を8 workerで実行した。所要411秒、21条件が
事前登録のrest screenを通過した。任意の推奨目標すべてを満たす条件はなかった。
最上位の数値解はLV倍率0.30、TBV5122.5、SVR倍率1.00875であったが、
workbench刻みから外れ、設定を増やす理由にも乏しいため採用しなかった。

採択する最初のデモは、baselineからLVFW+SEPだけを0.35に変更したもの。
研究用の固有model identityとcheckpoint domainを使い、新たに冷起動・定常化した。
既存72のcheckpointや先行する広い研究domainのcheckpointを付け替えていない。

| 指標 | baseline | LV収縮性0.35 |
|---|---:|---:|
| LVEF | 55.75% | 34.08% |
| LVEDVI | 75.64 | 94.58 mL/m² |
| CI（正味AoV流量） | 2.952 | 2.256 L/min/m² |
| 平均左房圧 | 8.40 | 20.70 mmHg |
| 平均右房圧 | 3.08 | 4.10 mmHg |
| 平均肺動脈圧 | 17.89 | 27.95 mmHg |
| 平均Ao node圧 | 93.59 | 72.85 mmHg |
| RVEF | 56.92% | 43.03% |
| ET | 258 | 286 ms |
| ICT / IRT | 89.1 / 92 | 42 / 96 ms |
| Tei | 0.702 | 0.483 |
| Weiss τ | 32.04 | 50.41 ms |

これらはシミュレーションの値であって臨床データではない。圧や計時の定義は
registry・measurement実装に従う。CIとEF×EDVI×HRを独立の証拠には数えない。
RVFW入力は同じでも共有中隔・循環負荷を介してRV出力が変わる。
Teiが小さくなることを、病態が改善した・全HFrEFに共通するとは解釈しない。

AV hydraulic mean/peak gradientは2.119/3.599 mmHg、LV +/−dP/dtは
1105/−795 mmHg/s、flow E/Aは1.564。波形・PV loopの目視でも明らかな振動は
認めなかった。Glantz τは推定品質不良で未確定として残し、数値を合否に流用しない。
LVEDVIは推奨100–140の下限に届いていないが、rest screen 80–160には入る。
この不一致を消すためにgateを緩めたり、形状・Ca調整を追加したりしていない。

## 数値・操作の検証

`route-002/report.json`および`gradual-to-hfref.json`に実値と許容差を保存した。

- 独立した2 msと1 msのcold計算。EF差0.021 percentage point、CI差0.085%。
  ETは286→283 msであり、イベント時刻の時間刻み依存性は別に記録した。
- 実adapterでbaseline→0.35→1、各経路を再定常化。冷起動結果と一致。
- 1→0.75→0.50→0.35、各操作間に200 exact stepを進めた経路も再定常化し、
  直接操作・冷起動の終点と一致。
- fixtureの同一性と、履歴を含むcheckpointの同一性を区別。
  JSON保存・再読込は各経路12 step、source対compiled artifactは両症例各1000 stepで一致。
- 同値再設定、NaN、刻み外、範囲外、古いinput epochの拒否と非部分commit。
- LV一括0.25/1.33、LVFW単独0.25、SEP単独0.25で各4.8秒の継続。
- 新Surfaceは既存の全output/graph/analysis pinを引き継ぎ、LV一括操作だけ追加。

比較の許容差はEF0.5 percentage point、indexed volume/CI 1%、平均圧0.5 mmHg。
これらは数値再現性の判定であって、新しい臨床正常範囲ではない。

## 実ブラウザ確認と過渡期の解析

`http://127.0.0.1:4189/ja/dev/model-lab?research=hfref`で確認した。
起動時baselineと「Presetから追加」の定常化済みHFrEFを重ねて表示できる。
PV loop、ESPVR、EDPVR、Guyton/Starlingを確認し、fixed-tone TBV familyは
baseline 11点、HFrEF 13点が表示された。LV収縮性の手動1→0.35と1への復元も行った。

大きな操作直後に開始したPV解析は、既存のsource settlement上限で
period-1 closureを成立させられず失敗することがある。live計算は継続し、
古い解析結果を表示せず、利用不可の理由を出す。従来は失敗が画面に残るだけだった。
エラー詳細へ「現在の状態で再計算」を加え、落ち着いた状態から同じ解析を
再実行してESPVR/EDPVRが復帰するところまでブラウザで確認した。
自動無限retry・閾値緩和・別の解析法へのfallbackは追加していない。

反復した開発用HMR・reloadの終盤で、in-app browserのタブが一度crashした。
新しいタブでは同じbundleから正常起動し、比較表示を再開できた。
このブラウザプロセス終了の原因は未特定であり、長時間UI耐久性の保証はしない。

研究側のHFrEF reference/controls/PVAテスト65件、汎用parallel runtimeと
steady-candidateテスト21件、TypeScript検査は通過。公開72の別worktreeでは
既存のstudio binding 12件（controls/checkpoint/PV/Starlingを含む）が通過し、
reference注記のテスト11件も通過した。
研究worktreeの旧72 source専用テスト全体の成功は主張しない。研究ownerは
分離されており、公開72のsource互換性をこのprototypeが保証するものではない。

## 来歴の補足と残す限界

Patel 2020のrelaxation timeはTable2でHFrEF 93.3 msだが、abstractでは
HFrEF/HFpEFの値が逆になっている。publisher本文で確認し、元のTable2値は
保ったまま原著内の不一致を注記した。IRTをscreen/targetに追加していない。
reference content hashは注記により更新されるが、過去の結果を書き換えていない。

次はこの固定形状・うっ血性デモを起点に、必要なら慢性拡張・リモデリングを
別の症例表現として評価する。今回の.35を全HFrEFやAMIに一般化しない。
症例の到達性をbaseline→明示された操作列→同じfixture→定常化済みpresetの
一致で確認する方式を続ける。範囲や露出を追加する提案はまとめてレビューする。
正式な公開registryへの登録やモデル固定は今回の研究採択とは別の判断である。
