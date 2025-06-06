import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { PlayerCountField } from './PlayerCountField.js';

describe('PlayerCountField', () => {
  it('renders label text', () => {
    const { lastFrame } = render(
      <PlayerCountField value="3" onChange={() => {}} onSubmit={() => {}} />,
    );
    expect(lastFrame()).toContain('プレイヤー数');
  });

  it('calls onSubmit on Enter', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <PlayerCountField value="" onChange={() => {}} onSubmit={onSubmit} />,
    );
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalled();
  });
});
