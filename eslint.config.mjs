import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['out/', 'dist/', '.webpack/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // IPC payloads are untyped; keep this as a warning as in typescript-eslint v5.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', '*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/preload/**/*.ts', 'src/renderer/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
);
