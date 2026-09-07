独立した科学・実装レビューをお願いします。忖度不要、主担当の方向性を前提にせず判断してください。編集せずread-onlyで、AGENTS.mdとsource/testsを優先してください。

目的は生理的・数理的・物理的に妥当で、過度に複雑でなく、多様なpresetの表現余裕を持つ心血管0Dモデルの正常baseline候補です。HRは60または70のみ、後負荷stress試験なし。AoP/CIは正常域中央近傍を目指し、ET/AV mean・peak gradient、ICT/IRT/Tei/E/A、圧・PV波形、両心室サイズ・EF、固定制御の低/高容量preload応答を合わせて検討します。

ユーザーはbaseline候補が出るまで継続を希望。範囲、基準、モデル式も根拠があれば変更可。永続変更はあなた(Claude Fable5.1 max)またはCodex6 Astra maxの少なくとも1/2の賛同が必要です。過去の判断を追認する必要はありません。

経過と数値の入口（これらの結論に縛られず原データ/コードも確認してください）:
- artifacts/reference-passive-coupling-2026-09-06/REPORT.md
- artifacts/filling-reserve-attribution-2026-09-06/REPORT.md
- artifacts/ca-length-coupling-2026-09-06/REPORT.md
- artifacts/population-moment-closed-loop-2026-09-06/REPORT.md
- artifacts/activation-huxley-2026-09-06/REPORT.md
- engine/myocardium/experiments/MainWireBaselineReferenceResearchV1.ts
- analysis/policies/mainWire/MainWireBaselineGateRolesV1.ts
- data/physiology/main-wire-normal-reference-evidence-v1.json

現行publicbaselineは変更されていません。上記の多数の材料比較はまだ研究です。最も進んだ研究構成はAo121/82,CI3.01,ET247msですが、高容量CO+3.7%と充満圧負担、Tref239kPaなどが問題視されました。これを独立に再評価し、baselineへ至る最有望の具体策1–2案、反証試験、現行の仮定・探索域・gateで不合理な自己制約の有無、永続変更として支持できるもの/できないものを論じてください。sourceモデルへの一致をヒトデータへの適合と混同しないでください。必要ならprimary文献を検索してください。

最終候補結果は後送します。まず自由な見解を回答してください。数値計算・コード編集・git操作・永続変更はしないでください。
