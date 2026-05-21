import type {
  Grid,
  GridCoord,
  RoundPhase,
  TeamState,
} from '@kurone-kito/oneiron-core';
import { ELEMENT_AXIS } from '@kurone-kito/oneiron-core';
import { For } from 'solid-js';

const FACING_ARROW: Record<string, string> = {
  north: '↑',
  south: '↓',
  east: '→',
  west: '←',
};

type Props = {
  grid: Grid;
  forbiddenCells: readonly GridCoord[];
  currentPhase: RoundPhase;
};

function isForbidden(
  coord: GridCoord,
  forbidden: readonly GridCoord[],
): boolean {
  return forbidden.some((c) => c.x === coord.x && c.y === coord.y);
}

function CellContent(props: { teams: readonly TeamState[] }) {
  return (
    <For each={props.teams}>
      {(team) => (
        <div
          class="grid-cell__team"
          role="img"
          aria-label={`Team ${team.teamNumber}`}
        >
          <span class="grid-cell__token">{team.teamNumber}</span>
          <span class="grid-cell__facing">{FACING_ARROW[team.facing]}</span>
          <span class="grid-cell__life">
            {team.players.reduce((s, p) => s + p.life, 0)}
          </span>
        </div>
      )}
    </For>
  );
}

export function GameGrid(props: Props) {
  return (
    <section
      class="game-grid"
      aria-label={`Game grid — ${props.currentPhase} phase`}
    >
      <table class="game-grid__table">
        <thead>
          <tr>
            <th class="game-grid__corner" />
            <For each={[...ELEMENT_AXIS]}>
              {(x) => <th class="game-grid__col-label">{x}</th>}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={[...ELEMENT_AXIS]}>
            {(y) => (
              <tr>
                <th class="game-grid__row-label">{y}</th>
                <For each={[...ELEMENT_AXIS]}>
                  {(x) => {
                    const coord: GridCoord = { x, y };
                    const forbidden = isForbidden(coord, props.forbiddenCells);
                    const teams = props.grid[x][y];
                    return (
                      <td
                        class={`game-grid__cell${forbidden ? ' game-grid__cell--forbidden' : ''}`}
                        aria-label={`${x},${y}${forbidden ? ' (forbidden)' : ''}`}
                      >
                        <CellContent teams={teams} />
                      </td>
                    );
                  }}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </section>
  );
}
