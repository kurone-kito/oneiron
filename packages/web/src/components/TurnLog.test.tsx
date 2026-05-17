import type { LogEntry } from '@kurone-kito/oneiron-core';
import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { TurnLog } from './TurnLog.tsx';

afterEach(cleanup);

const entries: LogEntry[] = [
  { round: 1, phase: 'battle', message: 'Team 1 vs Team 2' },
  { round: 1, phase: 'movement', message: 'Team 1 moved' },
  { round: 2, phase: 'battle', message: 'Team 3 vs Team 4' },
];

describe('TurnLog', () => {
  it('renders without errors when entries is empty', () => {
    render(() => <TurnLog entries={[]} />);
    expect(screen.getByLabelText('Turn log')).toBeTruthy();
  });

  it('renders all entries', () => {
    render(() => <TurnLog entries={entries} />);
    expect(screen.getByText('Team 1 vs Team 2')).toBeTruthy();
    expect(screen.getByText('Team 1 moved')).toBeTruthy();
    expect(screen.getByText('Team 3 vs Team 4')).toBeTruthy();
  });

  it('renders newest entry first (reverse chronological)', () => {
    render(() => <TurnLog entries={entries} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('Team 3 vs Team 4');
    expect(items[items.length - 1]?.textContent).toContain('Team 1 vs Team 2');
  });

  it('shows round and phase labels', () => {
    render(() => <TurnLog entries={[entries[0] as LogEntry]} />);
    expect(screen.getByText('R1')).toBeTruthy();
    expect(screen.getByText('battle')).toBeTruthy();
  });
});
