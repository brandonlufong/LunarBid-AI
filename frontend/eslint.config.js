import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // `motion` is used as <motion.div>, which this rule does not detect without the React plugin.
      // Unused `catch (error)` bindings are allowed.
      'no-unused-vars': ['error', { varsIgnorePattern: '^([A-Z_]|motion$)', caughtErrors: 'none' }],
      // Context files export a provider and its hook together; this only affects hot reload in development.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
