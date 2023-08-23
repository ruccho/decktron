import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: 'default-src \'self\' \'unsafe-inline\' data:; script-src \'self\' \'unsafe-eval\' \'unsafe-inline\' data:; img-src https://pbs.twimg.com',
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/host/index.html',
            js: './src/host/index.ts',
            name: 'host',
            preload: {
              js: './src/host/preload.ts',
            },
          },
          {
            html: './src/pane/index.html',
            js: './src/pane/index.ts',
            name: 'PANE_VIEW',
            preload: {
              js: './src/pane/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
