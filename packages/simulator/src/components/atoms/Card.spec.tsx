import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { Card } from './Card.js';

describe('Card', () => {
  it('applies rotation style', () => {
    const card = { attribute: 'fire', number: 1, type: 'attribute' } as const;
    const { container } = render(() => <Card card={card} angle={90} />);
    const div = container.querySelector('.card') as HTMLDivElement;
    expect(div.style.transform).toContain('rotate(90deg)');
  });
});
