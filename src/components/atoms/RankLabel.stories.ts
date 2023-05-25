import type { Meta, StoryObj } from '@storybook/react';
import { RankLabel } from './RankLabel';

const meta: Meta<typeof RankLabel> = {
  argTypes: {
    children: { control: { type: 'range', min: 1, max: 13, step: 1 } },
  },
  component: RankLabel,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof RankLabel>;

export const Default: Story = { args: { children: 1 } };
