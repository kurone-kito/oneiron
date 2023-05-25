import type { Meta, StoryObj } from '@storybook/react';
import { PipCard } from './PipCard';

const meta: Meta<typeof PipCard> = {
  argTypes: { rank: { control: { type: 'range', min: 1, max: 13, step: 1 } } },
  component: PipCard,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PipCard>;

export const Default: Story = { args: { suit: 'fire', rank: 1 } };
