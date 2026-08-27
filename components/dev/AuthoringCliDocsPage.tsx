import React from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  ListCollapse,
  ShieldCheck,
  TerminalSquare,
  Workflow,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { homeHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";

const SOURCE_GUIDE_URL =
  "https://github.com/g960059/0DSimDemo/blob/main/tools/authoring/README.md";

const copy = {
  ja: {
    eyebrow: "CircleHeart developer tools",
    title: "AIアシスタント向け Authoring CLI",
    lead:
      "CodexやClaude Codeが、あなた自身のCircleHeartアカウント権限でExperiment・Snapshot・Briefing・Articleを安全に編集するためのローカルCLIです。医療者がコマンドを暗記するための機能ではなく、assistant AIが機械契約を発見し、再試行可能な操作を行うための境界です。",
    back: "ホームへ戻る",
    source: "実装ガイドをGitHubで見る",
    principlesTitle: "設計の原則",
    principles: [
      ["同じ権限", "ブラウザと同じGoogle / Supabaseユーザーとして動作し、service-role keyは受け付けません。"],
      ["機械可読", "stdoutは常に1つのJSON envelopeです。進捗と診断だけをstderrへ出します。"],
      ["安全な再試行", "write commandのauthority request fingerprintは最低30日間commandIdへ束縛されます。応答が失われても、同じsemantic commandを同じcommandIdで再実行できます。"],
      ["公開は明示的", "保存・Snapshot化・Briefing配置・公開は別actionです。previewや保存が勝手に公開へ進むことはありません。"],
    ],
    setupTitle: "1. ログイン",
    setupBody:
      "初回だけSupabaseのproject URLとpublishable keyを環境変数で渡し、Googleログインを行います。refresh tokenはmacOS Keychainへ保存され、access tokenやsecretはstdoutへ出ません。profile名は任意です。",
    discoveryTitle: "2. AIは最初に契約を発見する",
    discoveryBody:
      "コマンド例をコピーし続けるのではなく、毎回--describeが返すJSON Schemaをauthorityとして使います。actionごとの入力・成功結果・構造化エラー・recoveryが含まれます。",
    workflowTitle: "3. 数値authoringの標準フロー",
    workflow: [
      ["Read", "model.describe / article.read / experiment.readで現在のauthority stateを読む。"],
      ["Preview", "experiment.previewでScenario追加・parameter変更・計算量・差分を確定する。durable stateは変わらない。"],
      ["Apply", "previewのplan digestをexperiment.applyへ渡し、同じexact model / Surfaceで保存する。"],
      ["Seal", "snapshot.sealで保存済みaccepted checkpointを共通admissionへ通し、immutable Snapshotにする。"],
      ["Brief", "article.briefing.placeでSnapshotからgraph・output・controlを選び、Articleへ配置する。"],
      ["Publish", "experiment.publish / article.publishは独立した明示action。公開前に必ずauthority stateを読み直す。"],
    ],
    recoveryTitle: "4. エラーからの回復",
    recoveryBody:
      "assistantは人間向けmessageを解析せず、error.code・commitState・recoveryだけに従います。transport failureでcommitStateがunknownならoperation.readを行い、未commitと確認できたときだけbyte-identicalなcommandを再実行します。semantic requestを変更する場合は、新しいcommandIdが必要です。",
    blocksTitle: "Article block契約",
    blocksBody:
      "paragraph・heading・equation・image・divider・accordion・quiz・link・experimentをUIと同じportable blockとして操作できます。accordion内にも文章・見出し・数式・画像・区切り線・quiz・linkを配置できますが、隠れたsimulation起動を避けるためExperimentとaccordionの再帰は許可しません。quizの回答はReader内だけに保持され、サーバーへ保存されません。linkは別記事やシリーズ冒頭への相対URLにも対応します。",
    commandsTitle: "主なaction",
    readLabel: "Read / discovery",
    writeLabel: "Explicit mutations",
    noteTitle: "臨床用途との境界",
    note:
      "これは臨床現場の自動意思決定ツールではありません。CircleHeart内のsimulation authoringを支援する機能です。Snapshot admission・数値verification・モデルlimitationsは維持されますが、作成された教育内容と科学的主張は公開前に人間が確認してください。",
  },
  en: {
    eyebrow: "CircleHeart developer tools",
    title: "Authoring CLI for AI assistants",
    lead:
      "A local CLI that lets Codex or Claude Code edit Experiments, Snapshots, Briefings, and Articles under your own CircleHeart account authority. It is not a command surface clinicians must memorize; it is a machine contract assistants can discover and retry safely.",
    back: "Back to home",
    source: "View the implementation guide on GitHub",
    principlesTitle: "Design principles",
    principles: [
      ["Same authority", "It acts as the same Google / Supabase user as the browser and rejects service-role keys."],
      ["Machine-readable", "stdout is exactly one JSON envelope. Only progress and diagnostics use stderr."],
      ["Safe retries", "Each write's authority request fingerprint remains bound to its commandId for at least 30 days. After a lost response, retry the identical semantic command with the identical commandId."],
      ["Explicit publication", "Save, Snapshot seal, Briefing placement, and publication are separate actions. Preview and save never publish implicitly."],
    ],
    setupTitle: "1. Sign in",
    setupBody:
      "For the first login, provide the Supabase project URL and publishable key, then complete Google sign-in. The refresh token is kept in macOS Keychain; access tokens and secrets are never written to stdout. Profile names are arbitrary.",
    discoveryTitle: "2. Let the assistant discover the contract",
    discoveryBody:
      "Do not keep copying old examples. Treat the JSON Schema returned by --describe as authority. It includes each action input, success result, structured error, and recovery instruction.",
    workflowTitle: "3. Standard numerical-authoring flow",
    workflow: [
      ["Read", "Read current authority state with model.describe, article.read, and experiment.read."],
      ["Preview", "Use experiment.preview to fix Scenario changes, parameter assignments, work budgets, and the exact diff without mutating durable state."],
      ["Apply", "Pass the preview plan digest to experiment.apply and save against the same exact model and Surface."],
      ["Seal", "Use snapshot.seal to send the saved accepted checkpoint through common admission and mint an immutable Snapshot."],
      ["Brief", "Use article.briefing.place to select graphs, outputs, and controls from the Snapshot and place them in an Article."],
      ["Publish", "experiment.publish and article.publish are independent explicit actions. Re-read authority state before publishing."],
    ],
    recoveryTitle: "4. Recover from errors",
    recoveryBody:
      "Assistants must follow error.code, commitState, and recovery rather than parsing the human message. If a transport failure reports an unknown commit state, call operation.read and retry the byte-identical command only after confirming it is uncommitted. A changed semantic request requires a new commandId.",
    blocksTitle: "Article block contract",
    blocksBody:
      "The UI and CLI share portable paragraph, heading, equation, image, divider, accordion, quiz, link, and experiment blocks. Accordions may contain prose, headings, equations, images, dividers, quizzes, and links, but not nested accordions or hidden live Experiments. Quiz answers remain Reader-local and are never persisted. Link blocks accept app-relative destinations for another Article or a series start.",
    commandsTitle: "Core actions",
    readLabel: "Read / discovery",
    writeLabel: "Explicit mutations",
    noteTitle: "Clinical boundary",
    note:
      "This is not an autonomous clinical decision tool. It assists simulation authoring inside CircleHeart. Snapshot admission, numerical verification, and model limitations remain in force, but a human must review educational content and scientific claims before publication.",
  },
} as const;

const loginCommand = `export CIRCLEHEART_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
npm run author:login -- --profile my-author`;

const discoverCommand =
  "npm --silent run author:content -- --describe";

const executeCommand =
  "npm --silent run author:content -- --profile my-author --command command.json";

export function AuthoringCliDocsPage() {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const text = copy[locale];

  return (
    <div className="h-full overflow-y-auto bg-wb-app text-wb-text">
      <main className="mx-auto w-full max-w-4xl px-6 pb-24 pt-12 sm:px-10 sm:pt-16">
        <Link
          to={homeHref(locale)}
          className="inline-flex items-center gap-2 text-sm font-medium text-wb-muted transition-colors hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {text.back}
        </Link>

        <header className="mt-12 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-wb-accent">
            <Bot className="h-4 w-4" aria-hidden="true" />
            {text.eyebrow}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {text.title}
          </h1>
          <p className="mt-6 text-base leading-8 text-wb-muted sm:text-lg">
            {text.lead}
          </p>
          <a
            href={SOURCE_GUIDE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-wb-accent hover:text-wb-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            {text.source}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </header>

        <DocsSection icon={ShieldCheck} title={text.principlesTitle}>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {text.principles.map(([title, body]) => (
              <div key={title}>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-wb-accent" aria-hidden="true" />
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-wb-muted">{body}</p>
              </div>
            ))}
          </div>
        </DocsSection>

        <DocsSection icon={KeyRound} title={text.setupTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">{text.setupBody}</p>
          <CodeBlock value={loginCommand} />
        </DocsSection>

        <DocsSection icon={TerminalSquare} title={text.discoveryTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">{text.discoveryBody}</p>
          <CodeBlock value={discoverCommand} />
          <CodeBlock value={executeCommand} />
        </DocsSection>

        <DocsSection icon={Workflow} title={text.workflowTitle}>
          <ol className="space-y-6">
            {text.workflow.map(([title, body], index) => (
              <li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wb-hover text-xs font-semibold text-wb-accent">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-wb-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </DocsSection>

        <DocsSection icon={ShieldCheck} title={text.recoveryTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">{text.recoveryBody}</p>
        </DocsSection>

        <DocsSection icon={ListCollapse} title={text.blocksTitle}>
          <p className="max-w-3xl text-sm leading-7 text-wb-muted">{text.blocksBody}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["paragraph", "heading", "equation", "image", "divider", "accordion", "quiz", "link", "experiment"].map((kind) => (
              <code key={kind} className="rounded-md bg-wb-hover px-2.5 py-1.5 text-xs text-wb-muted">
                {kind}
              </code>
            ))}
          </div>
        </DocsSection>

        <DocsSection icon={TerminalSquare} title={text.commandsTitle}>
          <ActionGroup
            label={text.readLabel}
            actions={[
              "experiment.list", "experiment.read", "snapshot.list",
              "snapshot.read", "article.list", "article.read",
              "operation.read", "model.describe", "experiment.preview",
            ]}
          />
          <ActionGroup
            label={text.writeLabel}
            actions={[
              "experiment.apply", "experiment.presentation.save",
              "snapshot.seal", "article.briefing.place",
              "article.blocks.patch", "article.save",
              "experiment.publish", "article.publish",
            ]}
          />
        </DocsSection>

        <aside className="mt-16 rounded-xl bg-wb-hover/70 px-5 py-5 sm:px-6">
          <h2 className="text-sm font-semibold">{text.noteTitle}</h2>
          <p className="mt-2 text-sm leading-7 text-wb-muted">{text.note}</p>
        </aside>
      </main>
    </div>
  );
}

function DocsSection({
  children,
  icon: Icon,
  title,
}: Readonly<{
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
}>) {
  return (
    <section className="mt-16 border-t border-wb-line pt-9 sm:mt-20 sm:pt-10">
      <h2 className="mb-7 flex items-center gap-2.5 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
        <Icon className="h-5 w-5 text-wb-accent" aria-hidden={true} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function CodeBlock({ value }: Readonly<{ value: string }>) {
  return (
    <pre className="mt-5 overflow-x-auto rounded-xl bg-wb-panel px-4 py-4 text-[0.78rem] leading-6 text-wb-text ring-1 ring-inset ring-wb-line sm:px-5">
      <code>{value}</code>
    </pre>
  );
}

function ActionGroup({
  actions,
  label,
}: Readonly<{ actions: readonly string[]; label: string }>) {
  return (
    <div className="mt-7 first:mt-0">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-wb-subtle">
        {label}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <code
            key={action}
            className="rounded-md bg-wb-hover px-2.5 py-1.5 text-xs text-wb-muted"
          >
            {action}
          </code>
        ))}
      </div>
    </div>
  );
}
