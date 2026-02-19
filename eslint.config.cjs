const coreDapps = require('@dcl/eslint-config/core-dapps.config')

/**
 * Custom naming-convention overrides so we can avoid eslint-disable comments for:
 * - Default imports (e.g. MUI icons): allow PascalCase for variables.
 * - Object properties (HTTP headers, API snake_case): allow names containing '-' or '_'.
 */
const namingConventionOverrides = [
  'error',
  // Allow any format for property names with hyphen, underscore, or 0x prefix (HTTP headers, API keys, wallet keys)
  {
    selector: 'objectLiteralProperty',
    format: null,
    filter: { regex: '[-_]|^0x', match: true }
  },
  {
    selector: 'typeProperty',
    format: null,
    filter: { regex: '[-_]', match: true }
  },
  { selector: 'default', format: ['camelCase'] },
  { selector: 'import', format: ['camelCase', 'PascalCase'] },
  {
    selector: 'variableLike',
    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
    leadingUnderscore: 'allow'
  },
  {
    selector: 'variable',
    format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
    leadingUnderscore: 'allow'
  },
  {
    selector: 'variable',
    types: ['function'],
    format: ['PascalCase', 'camelCase']
  },
  {
    selector: 'parameter',
    format: ['camelCase'],
    leadingUnderscore: 'allow'
  },
  { selector: 'memberLike', format: ['camelCase'] },
  {
    selector: 'memberLike',
    modifiers: ['private'],
    format: ['camelCase'],
    leadingUnderscore: 'allow'
  },
  { selector: 'typeLike', format: ['PascalCase'] },
  { selector: 'typeParameter', format: ['PascalCase'], prefix: ['T'] },
  {
    selector: 'interface',
    format: ['PascalCase'],
    custom: { regex: '^I[A-Z]', match: false }
  },
  {
    selector: ['variable', 'function', 'objectLiteralProperty', 'objectLiteralMethod'],
    types: ['function'],
    format: ['StrictPascalCase', 'strictCamelCase']
  },
  {
    selector: ['enum'],
    format: ['UPPER_CASE', 'PascalCase'],
    leadingUnderscore: 'allow'
  },
  {
    selector: ['enumMember'],
    format: ['UPPER_CASE'],
    leadingUnderscore: 'allow'
  }
]

module.exports = [
  ...coreDapps,
  {
    ignores: ['scripts/**', 'vite.config.ts', 'eslint.config.cjs', 'prettier.config.cjs']
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.app.json'
      }
    }
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/naming-convention': namingConventionOverrides
    }
  }
]
