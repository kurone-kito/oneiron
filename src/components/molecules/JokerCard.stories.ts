import type { Meta, StoryObj } from '@storybook/react';
import { JokerCard } from './JokerCard';

const meta: Meta<typeof JokerCard> = {
  component: JokerCard,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof JokerCard>;

export const Default: Story = {};
