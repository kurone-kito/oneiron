import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  args: { down: false, joker: false, selectOnHover: false, floated: false },
  component: Card,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Pip: Story = {
  argTypes: {
    rank: { control: { type: 'range', min: 1, max: 13, step: 1 } },
  },
  args: { suit: 'fire', rank: 1 },
};

export const Joker: Story = { args: { joker: true } };
