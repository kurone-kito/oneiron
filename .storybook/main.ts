import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  addons: [
    dirname(require.resolve(join('@storybook/addon-links', 'package.json'))),
    dirname(
      require.resolve(join('@storybook/addon-essentials', 'package.json'))
    ),
    dirname(
      require.resolve(join('@storybook/addon-interactions', 'package.json'))
    ),
  ],
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
