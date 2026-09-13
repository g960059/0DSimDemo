import React from "react";
import { useTranslation } from "react-i18next";
import { articleHeadingPhrasesV1 } from "@/studio/application/article/StudioArticleHeadingPhrasesV1";
import type { StudioArticleAccordionContentBlockV2, StudioArticleBlockV2 } from "@/studio/contracts/v2/article";
import {
  articleReadingAnchorV1, articleReadingHrefV1, articleReadingMentionV1,
  articleReadingTargetV1, buildArticleReadingIndexV1, parseArticleReadingTextV1,
  type ArticleReadingIndexV1,
} from "@/studio/application/article/StudioArticleReadingV1";

const ReadingContext = React.createContext<ArticleReadingIndexV1 | null>(null);
type ReadingNavigationV1 = (hash: string, sourceHash?: string) => void;
const ReadingNavigationContext = React.createContext<ReadingNavigationV1 | undefined>(undefined);
export function ArticleReadingProviderV1({blocks, children, onNavigate}: Readonly<{blocks: readonly StudioArticleBlockV2[]; children: React.ReactNode; onNavigate?: ReadingNavigationV1}>) {
  const index = React.useMemo(() => buildArticleReadingIndexV1(blocks), [blocks]);
  return <ReadingContext.Provider value={index}><ReadingNavigationContext.Provider value={onNavigate}>{children}</ReadingNavigationContext.Provider></ReadingContext.Provider>;
}
export function useArticleReadingIndexV1() { return React.useContext(ReadingContext); }

export function ArticleHeadingTextV1({ text }: Readonly<{ text: string }>) {
  const { i18n } = useTranslation();
  const phrases = React.useMemo(() => articleHeadingPhrasesV1(text, i18n.language), [text, i18n.language]);
  return <span className="article-heading-phrases">{phrases.map((phrase, i) =>
    <React.Fragment key={i}>{i > 0 && <wbr />}{phrase}</React.Fragment>)}</span>;
}

function navigateReadingAnchor(event: React.MouseEvent<HTMLAnchorElement>, navigate?: ReadingNavigationV1) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const id = decodeURIComponent(event.currentTarget.hash.slice(1));
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
  }
  target.scrollIntoView({ block: target.tagName === "A" ? "center" : "start", behavior: "instant" });
  target.focus({ preventScroll: true });
  // Preserve browser back/forward navigation as well as explicit backlinks.
  if (navigate) navigate(event.currentTarget.hash, event.currentTarget.id ? articleReadingHrefV1(event.currentTarget.id) : undefined);
  else window.history.pushState(window.history.state, "", event.currentTarget.hash);
}
export function ArticleReadingAnchorV1({anchor, children, ...props}: Readonly<{
  anchor: string; children: React.ReactNode; className?: string; id?: string; title?: string;
  "aria-label"?: string; role?: React.AriaRole;
}>) {
  const navigate = React.useContext(ReadingNavigationContext);
  return <a {...props} href={articleReadingHrefV1(anchor)} onClick={event => navigateReadingAnchor(event, navigate)}>{children}</a>;
}
export function ArticleReadingTextV1({ text, fieldId }: Readonly<{text: string; fieldId: string}>) {
  const index = useArticleReadingIndexV1();
  const { i18n } = useTranslation();
  const ja = i18n.language.startsWith("ja");
  if (!index) return <>{text}</>;
  return <>{parseArticleReadingTextV1(text).map((token, i, tokens) => {
    if (token.kind === "text") return token.text;
    const target = articleReadingTargetV1(index, token);
    if (!target) return <span key={i}>{token.raw}</span>;
    const next = tokens[i + 1];
    const continues = next?.kind === "reference" && articleReadingTargetV1(index, next);
    const label = token.kind === "reference" ? `${target.number}${continues ? "," : ")"}` : token.kind === "note" ? `${ja ? "注" : "Note "}${target.number}` : `${ja ? "図" : "Figure "}${target.number}`;
    const ariaLabel = token.kind === "reference" ? `${ja ? "文献" : "Reference "}${target.number}` : label;
    const link = <ArticleReadingAnchorV1 anchor={articleReadingAnchorV1(token.kind, token.targetId)}
      id={articleReadingMentionV1(fieldId, token.offset)} className="article-reading-anchor" aria-label={ariaLabel}
      role={token.kind === "note" ? "doc-noteref" : token.kind === "reference" ? "doc-biblioref" : undefined}
      title={token.kind === "reference" ? (target.block as {label:string}).label : (target.block as {title?:string}).title}>
      {label}
    </ArticleReadingAnchorV1>;
    return token.kind === "figure" ? <React.Fragment key={i}>{link}</React.Fragment>
      : <sup key={i} className="article-reading-marker">{link}</sup>;
  })}</>;
}
export function ArticleTableOfContentsV1({blocks}: Readonly<{blocks:readonly StudioArticleBlockV2[]}>) {
  const { i18n } = useTranslation();
  const headings = blocks.filter(b => b.kind === "heading" && b.level === 2);
  if (headings.length < 3) return null;
  return <details className="article-toc"><summary>{i18n.language.startsWith("ja") ? "目次" : "Contents"}</summary>
    <nav aria-label={i18n.language.startsWith("ja") ? "記事の目次" : "Article contents"}>
      <ol>{headings.map(b => <li key={b.blockId}><ArticleReadingAnchorV1 anchor={`block-${b.blockId}`}>{b.kind === "heading" ? b.text : ""}</ArticleReadingAnchorV1></li>)}</ol>
    </nav>
  </details>;
}
export function ArticleEndMatterV1({ renderNoteBlock }: Readonly<{
  renderNoteBlock: (block: StudioArticleAccordionContentBlockV2) => React.ReactNode;
}>) {
  const index = useArticleReadingIndexV1();
  const { i18n } = useTranslation();
  if (!index) return null;
  const ja = i18n.language.startsWith("ja");
  const backs = (items: readonly string[]) => <span className="article-reading-backlinks">{items.map((id, i) =>
    <ArticleReadingAnchorV1 key={id} anchor={id} aria-label={ja ? `引用箇所${i + 1}に戻る` : `Return to mention ${i + 1}`} role="doc-backlink">↩{items.length > 1 ? i + 1 : ""}</ArticleReadingAnchorV1>)}</span>;
  return <>
    {index.notes.length > 0 && <section className="article-endnotes" role="doc-endnotes" aria-labelledby="article-notes-heading">
      <h2 id="article-notes-heading" className="article-heading-2">{ja ? "注釈" : "Notes"}</h2>
      <ol>{index.notes.map(entry => <li key={entry.block.blockId} id={articleReadingAnchorV1("note", entry.block.blockId)} tabIndex={-1} role="doc-endnote">
        <div className="article-endnote-title"><span>{ja ? "注" : "Note "}{entry.number}</span><strong>{entry.block.title}</strong>{backs(entry.backlinks)}</div>
        {entry.block.blocks.filter(b => !(b.kind === "link" && b.role === "reference")).map(b => <React.Fragment key={b.blockId}>{renderNoteBlock(b)}</React.Fragment>)}
      </li>)}</ol>
    </section>}
    {index.references.length > 0 && <section className="article-references" role="doc-bibliography" aria-labelledby="article-references-heading">
      <h2 id="article-references-heading" className="article-heading-2">{ja ? "文献" : "References"}</h2>
      <ol>{index.references.map(entry => <li key={entry.block.blockId} id={articleReadingAnchorV1("reference", entry.block.blockId)} tabIndex={-1} value={entry.number}>
        {entry.block.href ? <a href={entry.block.href} target="_blank" rel="noreferrer">{entry.block.label}</a> : <span>{entry.block.label}</span>}{" "}
        <span>{entry.block.description}</span>{backs(entry.backlinks)}
      </li>)}</ol>
    </section>}
  </>;
}
