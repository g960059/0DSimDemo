# Contributing to CircleHeart

## 日本語

CircleHeartは、現在、一人のメンテナーがAIツールを活用して開発・運営している、
循環動態の教育・研究プロジェクトです。

### フィードバック

不具合、モデルの生理学的・数値的な問題、教材の誤りや分かりにくさ、教育現場での
利用経験を歓迎します。[GitHub Issues](https://github.com/g960059/CircleHeart/issues)へ
お寄せください。日本語・英語のどちらでも構いません。

分かる範囲で、対象ページや共有実験、再現手順、期待した結果と実際の結果を
記載してください。モデルや設定、ブラウザ・端末の情報、参考文献や比較条件も、
問題の確認に役立ちます。報告のために、修正案や完全な検証を用意する必要はありません。

### 変更提案とPull Request

コード、テスト、文書、翻訳の変更を作成・提出する前に、まずIssueで目的と範囲を
ご相談ください。事前合意のない変更PRは原則として受け付けていません。
提案の受領や相談は、採用・マージ・対応時期を約束するものではありません。

外部の著作物を取り込む際は、提出者が提供できる権利と、プロジェクトに必要な
利用・再許諾の条件を、提出に先立って書面で合意します。将来の別ライセンスでの
提供に必要な権利も、その合意の対象です。変更範囲への同意だけで、こうした
権利処理を済ませたことにはしません。

この方針は、投稿されたコードや文書の著作権を自動的に譲渡させるものではありません。
Issueに添付されたコード、文書、図等を取り込む場合も、同じ方針で扱います。
利用許諾の範囲と相談窓口は[LICENSING.md](LICENSING.md)を参照してください。

### 合意した変更の進め方

変更は合意した目的に絞り、理由と確認結果を説明してください。数値モデルや解析に
関する変更では、影響する前提・測定法・再現手順を示してください。第三者の
コード・図・データを含む場合は、出典と利用条件を明示し、必要な表示を維持してください。

AIツールの利用自体は妨げません。提出者は、内容・出典・提供権限を確認し、変更を
説明して検証する責任を持ちます。AIによる生成やレビューだけを、正しさや利用権限の
根拠とはしないでください。

現在の開発上の境界は[AGENTS.md](https://github.com/g960059/CircleHeart/blob/main/AGENTS.md)、設計上の境界は
[docs/README.md](https://github.com/g960059/CircleHeart/blob/main/docs/README.md)、実行可能な確認コマンドは
[package.json](https://github.com/g960059/CircleHeart/blob/main/package.json)を参照してください。

### 公開する情報と非公開の相談

患者情報、個人情報、認証情報、公開権限のない資料をIssueやPRに投稿しないでください。
公開した共有リンクや添付資料に、それらが含まれていないことも確認してください。

セキュリティ上の問題や非公開の相談は、[Xの@0xYusukeへのDM](https://x.com/0xYusuke)で
ご連絡ください。公開Issueには、悪用につながる詳細を記載しないでください。

## English

CircleHeart is an education and research project about cardiovascular
hemodynamics, currently developed and maintained by one maintainer using
AI tools.

### Feedback

We welcome bug reports, physiological or numerical concerns, corrections
and confusing passages in educational materials, and experience using
CircleHeart for teaching. Please use
[GitHub Issues](https://github.com/g960059/CircleHeart/issues). Japanese and
English are both welcome.

Where available, include the page or shared experiment, reproduction
steps, and expected and actual results. Model and setting details, browser
and device information, references, and comparison conditions can help.
A fix or a complete validation study is not required to report a concern.

### Changes and pull requests

Before preparing or submitting changes to code, tests, documentation, or
translations, discuss their purpose and scope in an issue. Unsolicited
change PRs are generally not accepted. Receiving or discussing a proposal
does not commit the maintainer to adoption, merging, or a delivery date.

Before external copyrightable material is submitted for incorporation,
agree in writing on the rights the contributor can grant and the usage
and sublicensing rights the project needs. The agreement must also address
rights needed for future distribution under different license terms.
Agreement on the technical scope alone does not settle these terms.

This policy does not automatically transfer copyright in submitted code
or documentation. It also applies when incorporating code, documentation,
figures, or other copyrightable material supplied through issues. See
[LICENSING.md](LICENSING.md) for licensing scope and contact details.

### Preparing an agreed change

Keep changes focused on the agreed purpose and explain the reason and
verification results. For numerical or analysis changes, identify affected
assumptions, measurement methods, and reproduction steps. Identify sources
and usage terms for third-party code, figures, or data, and preserve
required notices.

AI tools may be used. The contributor remains responsible for checking the
content, provenance, and authority to submit it, and for explaining and
verifying the change. AI generation or review alone does not establish
correctness or permission to use material.

See [AGENTS.md](https://github.com/g960059/CircleHeart/blob/main/AGENTS.md) for development boundaries,
[docs/README.md](https://github.com/g960059/CircleHeart/blob/main/docs/README.md) for architectural boundaries, and
[package.json](https://github.com/g960059/CircleHeart/blob/main/package.json) for executable verification commands.

### Public information and private inquiries

Do not post patient information, personal data, credentials, or material
you are not authorized to publish in issues or PRs. Check shared links
and attachments as well.

For security concerns or private inquiries, please
[DM @0xYusuke on X](https://x.com/0xYusuke). Do not post exploitable security
details in public issues.
