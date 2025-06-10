import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const goto = async (page: Page) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
};

test('オートモードでは時間経過でフェーズが進行する', async ({ page }) => {
  await goto(page);
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  await expect(page.getByText('フェーズ: 事前準備')).toBeVisible();
  await expect(page.getByText('フェーズ: 降下')).toBeVisible({
    timeout: 4000,
  });
});
