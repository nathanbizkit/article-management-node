import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginMocha from 'eslint-plugin-mocha';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['**/*.{js,mjs,cjs,ts}'] },
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    pluginJs.configs.recommended,
    pluginMocha.configs.flat.recommended,
    ...tseslint.configs.recommended,
];
