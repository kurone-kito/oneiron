import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { SubmitHint } from './SubmitHint.js';

describe('SubmitHint', () => {
  it('shows hint message', () => {
    const { lastFrame } = render(<SubmitHint />);
    const frame = lastFrame();
    expect(frame).toContain('決定');
    expect(frame).toContain('Enterで閉じます');
  });
});
