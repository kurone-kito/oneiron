import type { Meta, StoryObj } from '@storybook/react';
import { TeamIcon } from './TeamIcon';

const meta: Meta<typeof TeamIcon> = {
  argTypes: {
    iconIndex: { control: { type: 'range', min: 0, max: 20, step: 1 } },
  },
  component: TeamIcon,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TeamIcon>;

export const Default: Story = { args: { iconIndex: 0 } };
