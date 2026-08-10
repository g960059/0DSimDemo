import { expect, test } from "@playwright/test";

const UUID_RESOURCE_ID =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const ARTICLE_RESOURCE_ID =
  `(?:${UUID_RESOURCE_ID}|article-[A-Za-z0-9_-]+)`;

test("@desktop Article Editor supports Notion-style block authoring", async ({
  page,
}) => {
  await page.goto("/ja/articles/new/edit");
  await expect(page.getByTestId("article-editor-v3")).toBeVisible();

  // Clicking the empty writing area starts a focused paragraph directly.
  await page.getByRole("button", {
    name: "クリックして書き始める（「/」でブロックを選択）",
  }).click();
  const paragraphs = page.getByRole("textbox", { name: "本文" });
  await expect(paragraphs).toHaveCount(1);
  await paragraphs.first().fill("循環動態を比較します。");
  await paragraphs.first().press("Enter");
  await expect(paragraphs).toHaveCount(2);

  // Slash opens the searchable insert menu and changes the current empty
  // block type; it must not leave a second empty paragraph behind or insert
  // an extra block at another boundary.
  await paragraphs.last().press("/");
  const insertMenu = page.getByTestId("article-insert-menu-v3");
  await expect(insertMenu).toBeVisible();
  await insertMenu.getByRole("menuitem", { name: "見出し", exact: true }).click();
  await expect(paragraphs).toHaveCount(1);
  const heading = page.getByRole("textbox", { name: "見出し", exact: true });
  await expect(heading).toHaveCount(1);
  await heading.fill("圧波形");

  // Markdown shortcut: "## " converts a paragraph into a subheading.
  await heading.press("Enter");
  await expect(paragraphs).toHaveCount(2);
  await paragraphs.last().pressSequentially("## ");
  const subheading = page.getByRole("textbox", { name: "小見出し", exact: true });
  await expect(subheading).toHaveCount(1);
  await expect(paragraphs).toHaveCount(1);
  await subheading.fill("早期の変化");

  // The document autosaves: the route adopts the durable Article identity
  // and the header reports the persisted state without a manual save.
  await expect(page).toHaveURL(new RegExp(
    `/ja/articles/${ARTICLE_RESOURCE_ID}/edit$`,
  ), { timeout: 15_000 });
  await expect(page.getByTestId("article-editor-status-v3"))
    .toContainText("保存済み", { timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("textbox", { name: "本文" }))
    .toHaveValue("循環動態を比較します。");
  await expect(page.getByRole("textbox", { name: "見出し", exact: true }))
    .toHaveValue("圧波形");
  await expect(page.getByRole("textbox", { name: "小見出し", exact: true }))
    .toHaveValue("早期の変化");

  // Simulations insert through the same slash menu.
  await page.getByRole("button", {
    name: "クリックして書き始める（「/」でブロックを選択）",
  }).click();
  await expect(paragraphs).toHaveCount(2);
  await paragraphs.last().press("/");
  await expect(insertMenu).toBeVisible();
  await insertMenu.getByRole("menuitem", { name: "シミュレーション" }).click();
  const picker = page.getByTestId("article-snapshot-picker-v3");
  await expect(picker).toBeVisible();
  await picker.getByRole("button", {
    name: /新しいシミュレーションを作成/,
  }).click();
  await expect(page).toHaveURL(new RegExp(
    `/ja/experiments/new\\?articleId=${ARTICLE_RESOURCE_ID}`
      + "&sessionToken=session-[A-Za-z0-9._:@+/-]+$",
  ));
  const workbench = page.getByTestId("v3-dockview-workbench");
  await expect(workbench).toBeVisible();
  await expect.poll(async () => Number(
    await workbench.getAttribute("data-accepted-revision"),
  )).toBeGreaterThan(0);
  const briefButton = page.getByRole("button", { name: "Brief" });
  await expect(briefButton).toBeVisible();
  await briefButton.click();
  const composer = page.getByTestId("workbench-briefing-composer-v3");
  await expect(composer).toBeVisible();
  const closeComposer = composer.getByRole("button", { name: "閉じる" });
  await expect(closeComposer).toBeFocused();
  await closeComposer.click();
  await expect(briefButton).toBeFocused();
});
