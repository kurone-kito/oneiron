import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { GameController } from '../src/game/controller.mts';
import type { GameState } from '../src/types.mts';

declare global {
  interface Window {
    __simulatorGame?: GameController;
  }
}

const goto = async (page: Page) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
};

test.describe('ゲームルール検証', () => {
  test('チーム編成と初期配布', async ({ page }) => {
    await goto(page);
    const playerSelect = page.getByRole('combobox');
    await playerSelect.selectOption('3');
    const checkbox = page.getByRole('checkbox');
    await checkbox.uncheck();
    await page.getByRole('button', { name: 'ゲーム開始' }).click();
    await expect(page.getByText('フェーズ: 事前準備')).toBeVisible();
    let state = (await page.evaluate(
      () => window.__simulatorGame?.state,
    )) as GameState;
    expect(state.teams.length).toBe(2);
    expect(state.teams[1]?.players.length).toBe(1);
    expect(state.teams[1]?.players[0]?.life).toBe(3);
    expect(state.teams[0]?.players[0]?.cards.length).toBe(0);
    await page.getByRole('button', { name: '次のフェーズ' }).click();
    await expect(page.getByText('フェーズ: 降下')).toBeVisible();
    state = (await page.evaluate(
      () => window.__simulatorGame?.state,
    )) as GameState;
    const t0 = state.teams[0];
    const total = t0?.players.reduce((acc, p) => acc + p.cards.length, 0);
    expect(total).toBeGreaterThanOrEqual(5);
    const hasJoker = state.teams[1]?.players[0]?.cards.some(
      (c) => c.type === 'joker',
    );
    expect(hasJoker).toBe(true);
  });

  test('降下後に位置が設定される', async ({ page }) => {
    await goto(page);
    const playerSelect = page.getByRole('combobox');
    await playerSelect.selectOption('3');
    const checkbox = page.getByRole('checkbox');
    await checkbox.uncheck();
    await page.getByRole('button', { name: 'ゲーム開始' }).click();
    await page.getByRole('button', { name: '次のフェーズ' }).click();
    await page.getByRole('button', { name: '次のフェーズ' }).click();
    await expect(page.getByText('フェーズ: バトル')).toBeVisible();
    const state = (await page.evaluate(
      () => window.__simulatorGame?.state,
    )) as GameState;
    for (const t of state.teams) {
      expect(t.position.x).toBeGreaterThan(0);
      expect(t.position.y).toBeGreaterThan(0);
    }
    expect(state.round).toBe(1);
  });

  test('バトルでログが生成される', async ({ page }) => {
    await goto(page);
    const playerSelect = page.getByRole('combobox');
    await playerSelect.selectOption('3');
    const checkbox = page.getByRole('checkbox');
    await checkbox.uncheck();
    await page.getByRole('button', { name: 'ゲーム開始' }).click();
    await page.getByRole('button', { name: '次のフェーズ' }).click();
    await page.getByRole('button', { name: '次のフェーズ' }).click();
    await page.getByRole('button', { name: '次のフェーズ' }).click();
    const logs = (await page.evaluate(() =>
      window.__simulatorGame?.log(),
    )) as string[];
    expect(logs.some((l) => l.includes('チーム'))).toBe(true);
  });

  test('フェーズが一巡する', async ({ page }) => {
    await goto(page);
    const checkbox = page.getByRole('checkbox');
    await checkbox.uncheck();
    await page.getByRole('button', { name: 'ゲーム開始' }).click();
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: '次のフェーズ' }).click();
    }
    await expect(page.getByText('フェーズ: バトル')).toBeVisible();
    const state = (await page.evaluate(
      () => window.__simulatorGame?.state,
    )) as GameState;
    expect(state.round).toBe(2);
  });
});
