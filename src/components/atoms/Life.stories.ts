import type { Meta, StoryObj } from '@storybook/react';
import { Life } from './Life';

const meta: Meta<typeof Life> = {
  argTypes: {
    life: { control: { type: 'range', min: 0, max: 4, step: 1 } },
  },
  component: Life,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Life>;

export const Default: Story = { args: { life: 1 } };
