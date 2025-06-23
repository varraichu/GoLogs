// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
// Import the prettier config and plugin
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import eslintConfigPrettier from 'eslint-config-prettier' // This is for flat config

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // 1. Turns off ESLint rules that conflict with Prettier
      //    This should usually be placed after other configs that might enable formatting rules.
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // 2. Add the prettier/prettier rule from eslint-plugin-prettier
      //    This makes Prettier formatting issues appear as ESLint errors.
      //    If you use `eslint --fix`, Prettier will automatically format.
      'prettier/prettier': 'error', // Or 'warn' if you prefer warnings
    },
  },
  // 3. Recommended way to apply eslint-plugin-prettier/recommended in flat config
  //    This takes care of both extending eslint-config-prettier and enabling the prettier/prettier rule.
  //    Place it last to ensure it overrides any conflicting rules from previous configs.
  eslintPluginPrettierRecommended
)
