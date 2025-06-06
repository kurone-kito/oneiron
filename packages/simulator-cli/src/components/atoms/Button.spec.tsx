import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders label in brackets', () => {
    const { lastFrame } = render(<Button label="OK" />);
    expect(lastFrame()).toContain('[OK]');
  });
});
