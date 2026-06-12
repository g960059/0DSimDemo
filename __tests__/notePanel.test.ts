import React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import type { NoteContent } from "@/noteTypes";

vi.mock("@blocknote/mantine", async () => {
  const React = await import("react");
  return {
    BlockNoteView: () => React.createElement("div", { "data-blocknote-view": "true" }),
  };
});

vi.mock("@blocknote/react", () => ({
  createReactBlockSpec: () => () => ({}),
  getDefaultReactSlashMenuItems: () => [],
  SuggestionMenuController: () => null,
  useCreateBlockNote: () => ({ document: [] }),
}));

vi.mock("@blocknote/core", () => ({
  BlockNoteSchema: { create: () => ({}) },
  defaultBlockSpecs: {},
}));

vi.mock("@blocknote/core/extensions", () => ({
  filterSuggestionItems: (items: unknown[]) => items,
  insertOrUpdateBlockForSlashMenu: () => ({}),
}));

import {
  deriveHeadingAnchors,
  normalizeStaticBlocks,
  NotePanel,
  renderInlineContent,
  renderStaticBlock,
  slugifyHeading,
  StaticQuiz,
} from "@/components/NotePanel";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

function textBlock(type: string, text: string, props: Record<string, unknown> = {}): Record<string, unknown> {
  return { type, props, content: [{ type: "text", text, styles: {} }] };
}

describe("NotePanel static read helpers", () => {
  it("slugifies headings and derives ordered duplicate-disambiguated anchors", () => {
    const blocks: NoteContent = [
      textBlock("heading", "A Better PV Loop", { level: 2 }),
      textBlock("paragraph", "body"),
      textBlock("heading", "A Better PV Loop", { level: 3 }),
      textBlock("heading", "Missing Level"),
    ];

    expect(slugifyHeading(" A Better PV Loop! ")).toBe("a-better-pv-loop");
    expect(deriveHeadingAnchors(blocks)).toEqual([
      { id: "a-better-pv-loop", text: "A Better PV Loop", level: 2 },
      { id: "a-better-pv-loop-2", text: "A Better PV Loop", level: 3 },
      { id: "missing-level", text: "Missing Level", level: 2 },
    ]);
  });

  it("renders styled inline text and links with reading classes", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        "p",
        null,
        renderInlineContent([
          { type: "text", text: "bold", styles: { bold: true } },
          { type: "text", text: " italic", styles: { italic: true } },
          { type: "text", text: " code", styles: { code: true } },
          { type: "link", href: "https://example.test", content: [{ type: "text", text: " link", styles: {} }] },
        ]),
      ),
    );

    expect(html).toContain("font-semibold text-slate-100");
    expect(html).toContain("italic");
    expect(html).toContain("rounded bg-slate-800/70 px-1.5 py-0.5 font-mono text-[0.88em] text-sky-200 ring-1 ring-slate-700/60");
    expect(html).toContain('href="https://example.test"');
    expect(html).toContain("font-medium text-sky-400 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-300");
  });

  it("normalizes adjacent list items into one list group and passes non-lists through", () => {
    const normalized = normalizeStaticBlocks([
      textBlock("bulletListItem", "One"),
      textBlock("bulletListItem", "Two"),
      textBlock("paragraph", "Break"),
      textBlock("numberedListItem", "First"),
      textBlock("numberedListItem", "Second"),
    ]);

    expect(normalized).toHaveLength(3);
    expect(normalized[0]).toMatchObject({ type: "staticList", listType: "bullet" });
    expect((normalized[0] as { items: unknown[] }).items).toHaveLength(2);
    expect(normalized[1]).toMatchObject({ type: "paragraph" });
    expect(normalized[2]).toMatchObject({ type: "staticList", listType: "numbered" });
  });

  it("renders heading defaults, article ladder classes, and compact scale", () => {
    const defaultArticleH2 = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock(textBlock("heading", "No level"), 0, true, "no-level")));
    const articleH1 = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock(textBlock("heading", "One", { level: 1 }), 0, true, "one")));
    const articleH2 = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock(textBlock("heading", "Two", { level: 2 }), 0, true, "two")));
    const articleH3 = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock(textBlock("heading", "Three", { level: 3 }), 0, true, "three")));
    const compactH1 = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock(textBlock("heading", "Compact"), 0, false)));

    expect(defaultArticleH2).toContain("<h2");
    expect(defaultArticleH2).toContain('id="no-level"');
    expect(defaultArticleH2).toContain("text-[22px]");
    expect(articleH1).toContain("<h1");
    expect(articleH1).toContain('id="one"');
    expect(articleH1).toContain("text-[28px]");
    expect(articleH2).toContain("text-[22px]");
    expect(articleH3).toContain("text-[18px]");
    expect(compactH1).toContain("text-base");
  });

  it("renders heading ids in pre-order for nested heading trees", () => {
    const block = {
      ...textBlock("heading", "Parent"),
      children: [
        {
          ...textBlock("paragraph", "Nested body"),
          children: [textBlock("heading", "Child")],
        },
        textBlock("heading", "Sibling"),
      ],
    };

    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock(block, 0, true, ["parent", "child", "sibling"])));

    expect(html.indexOf('id="parent"')).toBeLessThan(html.indexOf('id="child"'));
    expect(html.indexOf('id="child"')).toBeLessThan(html.indexOf('id="sibling"'));
    expect(html).toContain('<h2 id="parent"');
    expect(html).toContain('<h2 id="child"');
    expect(html).toContain('<h2 id="sibling"');
  });

  it("renders equations through KaTeX output instead of the old raw mono block", () => {
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock({ type: "equation", props: { tex: "SV = EDV - ESV" } }, 0, true)));

    expect(html).toContain("katex");
    expect(html).not.toContain("font-mono text-sm text-slate-200");
  });

  it("renders static quizzes with one button per option and answer metadata", () => {
    const html = renderToStaticMarkup(React.createElement(StaticQuiz, { question: "Pick one", options: " A | | B | C ", answerIndex: "1" }));

    expect(html).toContain("Pick one");
    expect(html.match(/<button/g)).toHaveLength(3);
    expect(html).toContain('data-answer-index="1"');
    expect(html).toMatch(/>A<\/button>/);
    expect(html).toMatch(/>B<\/button>/);
    expect(html).toMatch(/>C<\/button>/);
    expect(html).not.toContain("> A <");
  });

  it("renders controller refs as de-emphasized inert inline chips", () => {
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock({ type: "controller_ref", props: { label: "Contractility" } }, 0, true)));

    expect(html).toContain("mx-1 inline rounded bg-slate-800/45 px-1.5 py-0.5 font-mono text-xs text-slate-500");
    expect(html).toContain("Contractility");
  });

  it("renders dangling view refs with placeholder treatment", () => {
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, renderStaticBlock({ type: "view_ref", props: { viewId: "missing-view" } }, 0, true)));

    expect(html).toContain("Referenced view unavailable");
    expect(html).toContain("missing-view");
  });

  it("keeps author mode on the editor path", () => {
    const html = renderToString(React.createElement(NotePanel, { mode: "author", content: [textBlock("paragraph", "Editable")] }));

    expect(html).toContain('data-blocknote-view="true"');
    expect(html).not.toContain("Editable");
  });
});
