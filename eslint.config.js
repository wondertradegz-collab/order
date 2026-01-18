import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow setState in effects for form sync patterns
      'react-hooks/set-state-in-effect': 'off',
      // Allow window.location modification
      'react-hooks/immutability': 'off',
      // Allow ref access during render for state sync patterns
      'react-hooks/refs': 'off',
      // Allow purity exceptions for ID generation
      'react-hooks/purity': 'off',
      // Relax any type restrictions (prefer to fix but don't block)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow hook exports from context files
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
