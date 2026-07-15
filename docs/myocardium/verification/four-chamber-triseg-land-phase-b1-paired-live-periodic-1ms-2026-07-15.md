# Four-chamber TriSeg + Land Phase B1: paired 1 ms live-periodic evidence

## 実行条件

- 実行日: 2026-07-15 (Asia/Tokyo)
- コマンド: `npm run diagnose:four-chamber-triseg-land-b1-paired-live-periodic-be`
- 固定 timestep: backward Euler, `dt = 0.001 s`
- 固定 mode 順: SLS-off, SLS-on
- parent manifest SHA-256: `218d5abd7b53dd0e4db594bac1ac1848d3ac49acc3efbdd02b843ee27338bf24`
- parent numerical evidence SHA-256: `7dd2cc61e9f5da24d9495a89b20369bfea143eb03e511fa312ee0c55a3acc9ec`
- event schedule SHA-256: `341c9f3eee1df13cc4e5615741c9911ac8315191d3ce5fbd90611985b5ea8c50`
- initial source parity audit SHA-256: `eee3744691a49dd4806ef5f4b4a31f86264673a32ab1e4ef53bf0df67caeb6c7`
- exit code: `0`
- wall elapsed time: `3367.650973958 s`

## 結果

| mode | completed cycles | terminal state distance | terminal SLS distance | terminal flow mismatch | terminal capsule SHA-256 | energy audit SHA-256 |
|---|---:|---:|---:|---:|---|---|
| SLS-off | 14 | `3.38619285495183e-8` | `null` | `2.5894262185556623e-8` | `5cfade01c928dfda986c965081dbc60723f00148aa4afd15255e28e2c57d148b` | `dc75a5e0288e16bb9198d76e580e5d7d565aaa5f1fc813ff9416c9255b207e51` |
| SLS-on | 14 | `3.269009152356987e-8` | `1.898296896541411e-9` | `2.5706973265794126e-8` | `ac4abd7bf917f3f594e89f35baf745dda6af5dd4bb3e1a43ea59ed314523763d` | `1d8698f344e5e7a42727d14ab9989d7d89823f9f4f0b78f3f61de4320b7f6c0a` |

両 mode とも、period-1 の全局所 gate を3周期連続で通過した。terminal cycle の accepted transaction / energy stage は SLS-off が `800 / 800`、SLS-on が `805 / 805` で一致し、terminal finalization のための数値 cycle 再実行は行っていない。run-end nominal-grid boundary の exact 1 ULP coalescence は、両 mode の cycle 5 と cycle 12 で認証済み ledger に記録された。

最終 paired evidence SHA-256 は `9be84c084a3f89b5993e61c882110a02b4c89cf73b43d94186a63c7710b93661`。同一プロセス内で、同一 parent manifest、parent numerical evidence、schedule の object identity、retained capsule cross-link、および両 mode の energy summary 発行順を確認し、`pairedOneMillisecondPeriodicEvidencePass = true` を発行した。

## Claim boundary

この結果が支持するのは、project-synthetic normal-sinus、single-start、1 ms backward-Euler、SLS-off/on paired periodic evidence に限る。SLS の因果効果、full-beat acceptance、multi-start、3-grid timestep convergence、cycle-energy acceptance、physiological validation、Phase B1 acceptance、`ModelCore` 統合、browser/runtime adoption は支持しない。

builder-issued authentication は WeakSet による同一プロセス限定であり、serialization 後には再認証できない。下記 JSONL は実行時 stream の byte snapshot と hash/provenance の監査資料であって、serialized object を builder-issued evidence として再構成するものではない。

### Post-run remediation

同日の実行後静的監査で、stream cycle record の nullable 3フィールドを実際の `number | null` に修正し、core terminal summary が単独では認証できなかった `committedCycleRecordMustPrecedeTerminalFinalization` を claim boundary から削除した。前者は型だけ、後者はsummary policy/hashだけの修正であり、数値積分、terminal capsule、energy audit、paired capsule composer の入力または判定は変更していない。そのため上記 capsule、energy、最終 paired evidence の実測値を数値回帰資料として保持する一方、JSONL内の2個の `terminalEvidenceSummaryContentSha256` は修正前policyに属し、現在のbuilder-issued summaryとして再認証可能とは扱わない。修正後は focused 16 tests と `tsc --noEmit` を通過した。後続3-grid実行では修正後コードから1 ms memberも同一プロセス内で再実行する。

## Raw stream

- JSONL: `four-chamber-triseg-land-phase-b1-paired-live-periodic-1ms-2026-07-15.jsonl`
- record count: `37` (`sequence = 0..36`, contiguous)
- JSONL file SHA-256: `5fdfffd0cc86c07723c459085222df41a4788158c2144741594abd587564e7ca`
