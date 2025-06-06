import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { LogPane } from './LogPane.js';

describe('LogPane', () => {
  it('renders logs and status', () => {
    const { lastFrame } = render(<LogPane logs={['test']} status="status" />);
    const frame = lastFrame();
    expect(frame).toContain('status');
    expect(frame).toContain('test');
  });
});
