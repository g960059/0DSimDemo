import { expect, test } from "@playwright/test";

const UUID_RESOURCE_ID =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const ARTICLE_RESOURCE_ID =
  `(?:${UUID_RESOURCE_ID}|article-[A-Za-z0-9_-]+)`;

test("@desktop Article Peek keeps its resize divider on the surface edge", async ({
  page,
}) => {
  await page.goto("/ja/articles/new/edit");
  const split = page.locator(".article-reader-split");
  await split.evaluate((element) => {
    element.setAttribute("data-peek-open", "true");
    element.setAttribute("data-peek-dragging", "true");
    (element as HTMLElement).style.setProperty(
      "--article-reader-peek-width",
      "46%",
    );
  });

  const divider = page.getByTestId("article-editor-peek-divider-v3");
  const panel = page.getByTestId("article-editor-peek-column-v3");
  const [dividerBox, panelBox] = await Promise.all([
    divider.boundingBox(),
    panel.boundingBox(),
  ]);
  expect(dividerBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  if (dividerBox === null || panelBox === null) return;

  const dividerCenter = dividerBox.x + dividerBox.width / 2;
  expect(Math.abs(panelBox.x - dividerCenter)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(panelBox.y - dividerBox.y)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(panelBox.height - dividerBox.height)).toBeLessThanOrEqual(0.5);
});

test("@desktop Article Editor preserves native text editing semantics", async ({
  page,
}) => {
  await page.goto("/ja/articles/new/edit");
  await page.getByRole("button", {
    name: "クリックして書き始める（「/」でブロックを選択）",
  }).click();
  const paragraphs = page.getByRole("textbox", { name: "本文" });
  await paragraphs.first().fill("abcdef");

  // Enter confirms Japanese IME composition; it must not become an editor
  // command or create another block.
  await paragraphs.first().dispatchEvent("keydown", {
    bubbles: true,
    isComposing: true,
    key: "Enter",
  });
  await expect(paragraphs).toHaveCount(1);
  await expect(paragraphs.first()).toHaveValue("abcdef");

  // A conventional Enter split replaces the complete selected range.
  await paragraphs.first().evaluate((element) => {
    (element as HTMLTextAreaElement).setSelectionRange(2, 4);
  });
  await paragraphs.first().press("Enter");
  await expect(paragraphs).toHaveCount(2);
  await expect(paragraphs.first()).toHaveValue("ab");
  await expect(paragraphs.last()).toHaveValue("ef");

  // Pausing after a space must not let autosave alter the authored text.
  await paragraphs.last().fill("Stroke volume ");
  await expect(page).toHaveURL(new RegExp(
    `/ja/articles/${ARTICLE_RESOURCE_ID}/edit$`,
  ), { timeout: 15_000 });
  await expect(page.getByTestId("article-editor-status-v3"))
    .toContainText("保存済み", { timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("textbox", { name: "本文" }).first())
    .toHaveValue("ab");
  await expect(page.getByRole("textbox", { name: "本文" }).last())
    .toHaveValue("Stroke volume ");
});

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

test("@desktop Article Editor persists equation, image, and divider blocks", async ({
  page,
}) => {
  await page.goto("/ja/articles/new/edit");
  const writingArea = page.getByRole("button", {
    name: "クリックして書き始める（「/」でブロックを選択）",
  });
  const menu = page.getByTestId("article-insert-menu-v3");

  await writingArea.click();
  await page.getByRole("textbox", { name: "本文" }).press("/");
  await menu.getByRole("menuitem", { name: "数式" }).click();
  await page.getByRole("textbox", { name: "TeX 数式" })
    .fill("CO = HR \\times SV");
  await expect(page.getByTestId("article-equation-v3")).toContainText("CO");

  await writingArea.click();
  await page.getByRole("textbox", { name: "本文" }).press("/");
  await menu.getByRole("menuitem", { name: "画像" }).click();
  const imageUrl = page.getByRole("textbox", { name: "画像URL" });
  await imageUrl.fill("https://example.com/pv-loop.png");
  await imageUrl.press("Enter");
  await page.getByRole("textbox", { name: "代替テキスト" }).fill("PV loop");
  await expect(page.getByTestId("article-image-v3").getByRole("img"))
    .toHaveAttribute("src", "https://example.com/pv-loop.png");

  await writingArea.click();
  await page.getByRole("textbox", { name: "本文" }).press("/");
  await menu.getByRole("menuitem", { name: "区切り線" }).click();
  await expect(page.getByTestId("article-divider-v3")).toHaveCount(1);

  await expect(page).toHaveURL(new RegExp(
    `/ja/articles/${ARTICLE_RESOURCE_ID}/edit$`,
  ), { timeout: 15_000 });
  await expect(page.getByTestId("article-editor-status-v3"))
    .toContainText("保存済み", { timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("textbox", { name: "TeX 数式" }))
    .toHaveValue("CO = HR \\times SV");
  await expect(page.getByTestId("article-image-v3").getByRole("img"))
    .toHaveAttribute("alt", "PV loop");
  await expect(page.getByTestId("article-divider-v3")).toHaveCount(1);
});
