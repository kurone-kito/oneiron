import type { Meta, StoryObj } from '@storybook/react';
import { DownCard } from './DownCard';

const meta: Meta<typeof DownCard> = {
  component: DownCard,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof DownCard>;

export const Default: Story = {};
