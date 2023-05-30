import type { Meta, StoryObj } from '@storybook/react';
import { TeamSummary } from './TeamSummary';

const meta: Meta<typeof TeamSummary> = {
  argTypes: {
    iconIndex: { control: { type: 'range', min: 0, max: 20, step: 1 } },
  },
  component: TeamSummary,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TeamSummary>;

export const Default: Story = { args: { iconIndex: 0, life: [1, 2] } };
