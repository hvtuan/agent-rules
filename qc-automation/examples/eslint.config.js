// Mirrors qc-automation/starter-pack/eslint/eslint.config.js, placed at the repo
// root where ESLint auto-discovers it and Node resolves the local node_modules.
// Keeping a real copy here proves the shipped rules run against real test code.
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');

module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
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
  {
    ...playwright.configs['flat/recommended'],
    files: ['**/*.spec.ts', '**/*.test.ts', 'tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/valid-expect': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'warn',
    },
  },
];
