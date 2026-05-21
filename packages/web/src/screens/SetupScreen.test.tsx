import { DEFAULT_CONFIG } from '@kurone-kito/oneiron-core';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SetupScreen } from './SetupScreen.tsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SetupScreen', () => {
  it('renders without errors', () => {
    render(() => <SetupScreen onStart={() => undefined} />);

    expect(
      screen.getByRole('heading', { name: 'Dream Duels Setup' }),
    ).toBeTruthy();
    expect(screen.getByLabelText('Player count')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start game' })).toBeTruthy();
  });

  it('updates the team list when player count changes', () => {
    render(() => <SetupScreen onStart={() => undefined} />);

    const playerCount = screen.getByLabelText('Player count');
    fireEvent.input(playerCount, { target: { value: '2' } });
    expect(screen.getByText('Team 1 (pair)')).toBeTruthy();
    expect(screen.queryByText('Team 2 (pair)')).toBeNull();

    fireEvent.input(playerCount, { target: { value: '6' } });
    expect(screen.getByText('Team 3 (pair)')).toBeTruthy();

    fireEvent.input(playerCount, { target: { value: '9' } });
    expect(screen.getByText('Team 5 (solo)')).toBeTruthy();
  });

  it('randomises the seed to a non-zero number', () => {
    vi.spyOn(Date, 'now').mockReturnValue(4242);
    render(() => <SetupScreen onStart={() => undefined} />);

    const seedInput = screen.getByLabelText('Seed') as HTMLInputElement;
    fireEvent.input(seedInput, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Randomise seed' }));

    expect(Number(seedInput.value)).toBe(4242);
  });

  it('fires start game with constructed setup values', () => {
    const onStart = vi.fn();
    render(() => <SetupScreen onStart={onStart} />);

    fireEvent.input(screen.getByLabelText('Player count'), {
      target: { value: '4' },
    });
    fireEvent.input(screen.getByLabelText('Seed'), { target: { value: '77' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    const [values] = onStart.mock.calls[0] as [unknown];
    const setup = values as {
      playerCount: number;
      seed: number;
      config: typeof DEFAULT_CONFIG;
      controls: Map<number, { type: 'human' | 'bot' }>;
    };

    expect(setup.playerCount).toBe(4);
    expect(setup.seed).toBe(77);
    expect(setup.config).toEqual(DEFAULT_CONFIG);
    expect(setup.controls).toBeInstanceOf(Map);
    expect(setup.controls.get(1)?.type).toBe('human');
    expect(setup.controls.get(2)?.type).toBe('bot');
  });

  it('sanitizes config overrides and includes custom team controls', () => {
    const onStart = vi.fn();
    render(() => <SetupScreen onStart={onStart} />);

    fireEvent.change(screen.getByLabelText('Control for Team 1'), {
      target: { value: 'bot' },
    });
    fireEvent.change(screen.getByLabelText('Control for Team 2'), {
      target: { value: 'human' },
    });
    fireEvent.input(screen.getByLabelText('Card copies (A)'), {
      target: { value: '0' },
    });
    fireEvent.input(screen.getByLabelText('Random cards dealt (C)'), {
      target: { value: '-5' },
    });
    fireEvent.input(screen.getByLabelText('Damage overflow factor (E)'), {
      target: { value: '3' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    const [values] = onStart.mock.calls[0] as [unknown];
    const setup = values as {
      config: typeof DEFAULT_CONFIG;
      controls: Map<number, { type: 'human' | 'bot' }>;
    };

    expect(setup.config.cardCopies).toBe(1);
    expect(setup.config.randomCardsDealt).toBe(0);
    expect(setup.config.damageOverflowFactor).toBe(3);
    expect(setup.controls.get(1)?.type).toBe('bot');
    expect(setup.controls.get(2)?.type).toBe('human');
  });

  it('keeps the 2..20 input but blocks start above the engine team limit', () => {
    const onStart = vi.fn();
    render(() => <SetupScreen onStart={onStart} />);

    fireEvent.input(screen.getByLabelText('Player count'), {
      target: { value: '20' },
    });

    expect(
      screen.getByText(
        'Current engine start is capped at 18 players because the 3x3 grid can host at most 9 teams.',
      ),
    ).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Start game' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByText('Team 10 (pair)')).toBeTruthy();
    fireEvent.submit(screen.getByRole('button', { name: 'Start game' }).form);
    expect(onStart).not.toHaveBeenCalled();
  });
});
