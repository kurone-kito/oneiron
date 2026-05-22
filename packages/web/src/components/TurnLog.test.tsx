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

  it('renders all entries when expanded', () => {
    render(() => <TurnLog entries={entries} defaultOpen={true} />);
    expect(screen.getByText('Team 1 vs Team 2')).toBeTruthy();
    expect(screen.getByText('Team 1 moved')).toBeTruthy();
    expect(screen.getByText('Team 3 vs Team 4')).toBeTruthy();
  });

  it('renders newest entry first (reverse chronological)', () => {
    render(() => <TurnLog entries={entries} defaultOpen={true} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('Team 3 vs Team 4');
    expect(items[items.length - 1]?.textContent).toContain('Team 1 vs Team 2');
  });

  it('shows round and phase labels', () => {
    render(() => (
      <TurnLog entries={[entries[0] as LogEntry]} defaultOpen={true} />
    ));
    expect(screen.getByText('R1')).toBeTruthy();
    expect(screen.getByText('battle')).toBeTruthy();
  });

  it('defaults to collapsed', () => {
    const { container } = render(() => <TurnLog entries={entries} />);
    const details = container.querySelector('details.turn-log__container');
    expect(details).toBeTruthy();
    // open is the canonical attribute; absence means closed.
    expect((details as HTMLDetailsElement).open).toBe(false);
  });

  it('renders the summary as a tap-able disclosure', () => {
    render(() => <TurnLog entries={entries} />);
    expect(screen.getByText('Turn Log').tagName.toLowerCase()).toBe('summary');
  });
});
