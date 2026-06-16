// QC automation lint rules — ESLint 9 flat config. Drop into a test repo root as
// `eslint.config.js`, or import and spread it into an existing flat config.
// Requires: eslint@^9, typescript-eslint@^8, eslint-plugin-playwright@^2.
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');

module.exports = [
  // Type-aware rules for ALL TS (page objects + specs).
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      // Best-effort ban on XPath locators (literal arg). Code review is the real guard.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='locator'] > Literal.arguments:first-child[value=/^xpath=|^\\/\\//]",
          message: 'XPath locators are banned — use role/label/testid.',
        },
        {
          selector:
            "CallExpression[callee.property.name='locator'] > TemplateLiteral.arguments:first-child[quasis.0.value.raw=/^xpath=|^\\/\\//]",
          message: 'XPath locators are banned — use role/label/testid.',
        },
      ],
    },
  },
  // Playwright recommended + QC overrides, scoped to test files only.
  {
    ...playwright.configs['flat/recommended'],
    files: ['**/*.spec.ts', '**/*.test.ts', 'tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/valid-expect': 'error',
      'playwright/no-focused-test': 'error',
      // 'warn' not 'error': an intentional test.skip(cond, 'reason') is allowed
      // (see reporting.md). Run eslint WITHOUT --max-warnings=0 so it informs, not blocks.
      'playwright/no-skipped-test': 'warn',
    },
  },
];
