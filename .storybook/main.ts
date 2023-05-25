import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-styling',
  ].map((pkg) => dirname(require.resolve(join(pkg, 'package.json')))),
  docs: { autodocs: 'tag' },
  features: {
    argTypeTargetsV7: true,
    buildStoriesJson: true,
    storyStoreV7: true,
  },
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
};
export default config;
