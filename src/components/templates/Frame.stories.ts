import type { Meta, StoryObj } from '@storybook/react';
import { Frame } from './Frame';

const meta: Meta<typeof Frame> = {
  component: Frame,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Frame>;

export const Default: Story = { args: { children: 'Children' } };
