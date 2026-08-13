import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { Home } from "@/components/Home";
import i18n from "@/i18n";

describe("Home V4", () => {
  it("shows a loading projection instead of a false empty catalog", async () => {
    await i18n.changeLanguage("ja");
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/ja"]}>
        <Home />
      </MemoryRouter>,
    );

    expect(markup).toContain("公開コンテンツを読み込んでいます…");
    expect(markup).not.toContain("公開中の記事はまだありません。");
    expect(markup).not.toContain("公開中のシミュレーションはまだありません。");
  });
});
