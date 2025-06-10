import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const goto = async (page: Page) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
};

test('ボードが表示される', async ({ page }) => {
  await goto(page);
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  await expect(page.getByTestId('game-board')).toBeVisible();
  await expect(page.getByTestId('grid-cell')).toHaveCount(25);
});

test('降下後にカードが配置される', async ({ page }) => {
  await goto(page);
  const checkbox = page.getByRole('checkbox');
  await checkbox.uncheck();
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  await page.getByRole('button', { name: '次のフェーズ' }).click();
  await page.getByRole('button', { name: '次のフェーズ' }).click();
  await expect(
    page.locator('[data-testid="grid-cell"] .card').first(),
  ).toBeVisible();
});
