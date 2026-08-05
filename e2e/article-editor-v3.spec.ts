import { expect, test } from "@playwright/test";

test("@desktop Article Editor supports Notion-style block authoring", async ({
  page,
}) => {
  await page.goto("/ja/articles/new/edit");
  await expect(page.getByTestId("article-editor-v3")).toBeVisible();

  await page.getByRole("button", {
    name: "クリックするか「/」でコンテンツを追加",
  }).click();
  await page.getByRole("menuitem", { name: "本文" }).click();

  const paragraphs = page.getByRole("textbox", { name: "本文" });
  await expect(paragraphs).toHaveCount(1);
  await paragraphs.first().fill("循環動態を比較します。");
  await paragraphs.first().press("Enter");
  await expect(paragraphs).toHaveCount(2);

  // Slash changes the current empty block type; it must not leave a second
  // empty paragraph behind or insert an extra block at another boundary.
  await paragraphs.last().press("/");
  await page.getByRole("menuitem", { name: "見出し" }).click();
  await expect(paragraphs).toHaveCount(1);
  const heading = page.getByRole("textbox", { name: "見出し" });
  await expect(heading).toHaveCount(1);
  await heading.fill("圧波形");

  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page).toHaveURL(/\/ja\/articles\/article-[A-Za-z0-9_-]+\/edit$/);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "本文" }))
    .toHaveValue("循環動態を比較します。");
  await expect(page.getByRole("textbox", { name: "見出し" }))
    .toHaveValue("圧波形");

  await page.getByRole("button", {
    name: "コンテンツを追加",
    exact: true,
  }).last().click();
  await page.getByRole("menuitem", { name: "シミュレーション" }).click();
  const picker = page.getByTestId("article-snapshot-picker-v3");
  await expect(picker).toBeVisible();
  await picker.getByRole("button", {
    name: /新しいシミュレーションを作成/,
  }).click();
  await expect(page).toHaveURL(
    /\/ja\/experiments\/new\?articleId=article-[A-Za-z0-9_-]+&sessionToken=session-[A-Za-z0-9._:@+/-]+$/,
  );
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
