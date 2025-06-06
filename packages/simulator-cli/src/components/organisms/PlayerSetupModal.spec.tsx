import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { PlayerSetupModal } from './PlayerSetupModal.js';

describe('PlayerSetupModal', () => {
  it('renders form fields', () => {
    const { lastFrame } = render(<PlayerSetupModal onSubmit={() => {}} />);
    const frame = lastFrame();
    expect(frame).toContain('プレイヤー数');
    expect(frame).toContain('Bot mode');
    expect(frame).toContain('決定');
  });

  it('submits default values on Enter', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(<PlayerSetupModal onSubmit={onSubmit} />);
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalledWith({ playerCount: 6, botMode: true });
  });
});
