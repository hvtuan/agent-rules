/* QC automation lint rules — drop into a test repo's root or extend it. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'playwright'],
  extends: ['plugin:playwright/recommended'],
  rules: {
    'playwright/no-wait-for-timeout': 'error',
    'playwright/no-element-handle': 'error',
    'playwright/valid-expect': 'error',
    'playwright/no-focused-test': 'error',
    'playwright/no-skipped-test': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    'no-restricted-syntax': [
      'error',
      { selector: "CallExpression[callee.property.name='locator'][arguments.0.value=/^xpath=|^\\/\\//]",
        message: 'XPath locators are banned — use role/label/testid.' },
    ],
  },
};
