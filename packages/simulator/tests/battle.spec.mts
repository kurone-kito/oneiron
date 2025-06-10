import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { GameController } from '../src/game/controller.mts';
import type { GameState, Team } from '../src/types.mts';

declare global {
  interface Window {
    __simulatorGame?: GameController;
  }
}

const goto = async (page: Page) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
};

test.describe('バトルルール検証', () => {
  test('初期化時に各チームが2人2ライフで生成される', async ({ page }) => {
    await goto(page);
    const checkbox = page.getByRole('checkbox');
    await checkbox.uncheck();
    await page.getByRole('button', { name: 'ゲーム開始' }).click();
    await expect(page.getByText('フェーズ: 事前準備')).toBeVisible();
    const state = (await page.evaluate(
      () => window.__simulatorGame?.state,
    )) as GameState;
    expect(state.teams.length).toBe(3);
    for (const team of state.teams) {
      expect(team.players.length).toBe(2);
      for (const p of team.players) expect(p.life).toBe(2);
    }
  });

  test('勝敗が決するとゲームが終了する', async ({ page }) => {
    await goto(page);
    const checkbox = page.getByRole('checkbox');
    await checkbox.uncheck();
    await page.getByRole('button', { name: 'ゲーム開始' }).click();
    await expect(page.getByText('フェーズ: 事前準備')).toBeVisible();

    await page.evaluate(() => {
      const game = window.__simulatorGame;
      if (!game) throw new Error('missing game controller');
      const t1 = {
        id: 1,
        players: [
          {
            id: 'p1',
            name: 'P1',
            isBot: false,
            life: 1,
            isAlive: true,
            cards: [{ attribute: 'fire', number: 1, type: 'attribute' }],
          },
        ],
        position: { x: 0, y: 0 },
        direction: 'north',
        gridCards: [],
        isEliminated: false,
      } as Team;
      const t2 = {
        id: 2,
        players: [
          {
            id: 'p2',
            name: 'P2',
            isBot: false,
            life: 1,
            isAlive: true,
            cards: [{ attribute: 'wood', number: 1, type: 'attribute' }],
          },
        ],
        position: { x: 0, y: 0 },
        direction: 'north',
        gridCards: [],
        isEliminated: false,
      } as Team;
      game.setState('teams', [t1, t2]);
      game.setState('phase', 'battle');
      game.setState('round', 1);
      game.setDeck([]);
    });

    await page.getByRole('button', { name: '次のフェーズ' }).click();
    await expect(page.getByText('フェーズ: 終了')).toBeVisible();
    const state = (await page.evaluate(
      () => window.__simulatorGame?.state,
    )) as GameState;
    expect(state.phase).toBe('finished');
    expect(state.teams[1]?.isEliminated).toBe(true);
    const logs = (await page.evaluate(() =>
      window.__simulatorGame?.log(),
    )) as string[];
    expect(logs.some((l) => l.includes('チーム1') && l.includes('勝利'))).toBe(
      true,
    );
  });
});
