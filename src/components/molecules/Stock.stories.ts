import type { Meta, StoryObj } from '@storybook/react';
import { Stock } from './Stock';

const meta: Meta<typeof Stock> = {
  component: Stock,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Stock>;

export const Default: Story = {
  args: {
    cards: [
      { rank: 2, suit: 'fire' },
      { rank: 3, suit: 'fire' },
      { rank: 4, suit: 'fire' },
      { rank: 6, suit: 'tree' },
      { rank: 6, suit: 'tree' },
      { rank: 6, suit: 'tree' },
      { rank: 1, suit: 'water' },
      { rank: 1, suit: 'water' },
      { rank: 1, suit: 'water' },
      { rank: 11, suit: 'water' },
      { rank: 12, suit: 'water' },
      { rank: 13, suit: 'water' },
      { joker: true },
      { joker: true },
    ],
  },
};
