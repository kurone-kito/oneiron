import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { RulesOverview } from './RulesOverview.js';

describe('RulesOverview', () => {
  it('renders rule list', () => {
    const { getByText } = render(() => <RulesOverview />);
    expect(getByText('ゲームルール概要')).toBeDefined();
    expect(getByText('三すくみ: 🔥火→🌳木→💧水→🔥火')).toBeDefined();
  });
});
