import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { SetupForm } from './SetupForm.js';

describe('SetupForm', () => {
  it('triggers callbacks on interactions', async () => {
    const onCount = vi.fn();
    const onMode = vi.fn();
    const onStart = vi.fn();
    const { getByText, getByRole } = render(() => (
      <SetupForm
        playerCount={4}
        isAutoMode={false}
        onPlayerCountChange={onCount}
        onAutoModeChange={onMode}
        onStart={onStart}
      />
    ));
    const playerSelect = getByRole('combobox') as HTMLSelectElement;
    const checkbox = getByRole('checkbox') as HTMLInputElement;
    await fireEvent.change(playerSelect, { target: { value: '5' } });
    expect(onCount).toHaveBeenCalledWith(5);
    await fireEvent.click(checkbox);
    expect(onMode).toHaveBeenCalledWith(true);
    const button = getByText('ゲーム開始');
    await fireEvent.click(button);
    expect(onStart).toHaveBeenCalled();
  });
});
