import { expect, test } from '@playwright/test';

test('show the page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(
    page.getByText('オリジナルカードゲーム シミュレーター'),
  ).toBeVisible();
});
