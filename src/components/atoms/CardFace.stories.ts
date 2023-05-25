import type { Meta, StoryObj } from '@storybook/react';
import { CardFace } from './CardFace';

const meta: Meta<typeof CardFace> = {
  component: CardFace,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof CardFace>;

export const Default: Story = { args: { children: 'children' } };
