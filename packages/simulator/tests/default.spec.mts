import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const goto = async (page: Page) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
};

test('初期値がプレイヤー6人かつオートモード', async ({ page }) => {
  await goto(page);
  const playerSelect = page.getByRole('combobox');
  await expect(playerSelect).toHaveValue('6');
  const checkbox = page.getByRole('checkbox');
  await expect(checkbox).toBeChecked();
});
