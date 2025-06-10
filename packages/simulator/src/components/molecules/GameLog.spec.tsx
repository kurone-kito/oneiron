import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { GameLog } from './GameLog.js';

describe('GameLog', () => {
  it('lists logs', () => {
    const logs = ['a', 'b'];
    const { getByText } = render(() => (
      <GameLog logs={logs} isPlaying={true} onPlaybackChange={() => {}} />
    ));
    expect(getByText('a')).toBeTruthy();
    expect(getByText('b')).toBeTruthy();
  });
});
