import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';

const newRules = rules.slice(0, rules.length);
newRules.push({
  test: /\.css$/,
  type: "asset/source",
});

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules: newRules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};
