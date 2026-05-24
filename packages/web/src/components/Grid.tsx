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
                    // `props.forbiddenCells` and `props.grid` are
                    // Solid reactive sources via the props proxy.
                    // Reading them inside getter / JSX expressions
                    // keeps the cell reactive across round
                    // transitions; binding them to plain `const`s
                    // here would snapshot the values on first
                    // render and never refresh — that was the
                    // "bots don't appear to move" bug from #167.
                    const coord: GridCoord = { x, y };
                    const isCellForbidden = () =>
                      isForbidden(coord, props.forbiddenCells);
                    return (
                      <td
                        class={`game-grid__cell${isCellForbidden() ? ' game-grid__cell--forbidden' : ''}`}
                        aria-label={`${x},${y}${isCellForbidden() ? ' (forbidden)' : ''}`}
                      >
                        <CellContent teams={props.grid[x][y]} />
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
