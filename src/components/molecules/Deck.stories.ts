import type { Meta, StoryObj } from '@storybook/react';
import { Deck } from './Deck';

const meta: Meta<typeof Deck> = {
  argTypes: {
    length: { control: { type: 'range', min: 0, max: 13 * 3 * 4, step: 1 } },
  },
  component: Deck,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Deck>;

export const Default: Story = { args: { length: 3 } };
