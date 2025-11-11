import type { Preview } from '@storybook/react';

import '../app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'slate',
      values: [
        { name: 'slate', value: '#020617' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-slate-950/98 p-8 text-slate-100">
        <div className="mx-auto max-w-4xl space-y-8">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default preview;
