import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Shared base rules for every workspace. apps/web extends this with Next.js rules.
export default tseslint.config(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/.next',
      '**/.open-next',
      '**/.wrangler',
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // Project rule: functional code only, no classes.
      'no-restricted-syntax': [
        'error',
        { selector: 'ClassDeclaration', message: 'Use functions instead of classes.' },
        { selector: 'ClassExpression', message: 'Use functions instead of classes.' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
)
