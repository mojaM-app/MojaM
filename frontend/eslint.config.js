// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('prettier');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-member-accessibility": "error",
      // 'rxjs/no-async-subscribe': 'error',
      // 'rxjs/no-ignored-observable': 'error',
      // 'rxjs/no-ignored-subscription': 'error',
      // 'rxjs/no-nested-subscribe': 'error',
      // 'rxjs/no-unbound-methods': 'error',
      // 'rxjs/throw-error': 'error',
      //'prettier/prettier': 'warn',
      'linebreak-style': ['off', 'windows'],
      'import/prefer-default-export': 'off',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          default: [
            'public-decorated-field',
            'public-field',
            'protected-field',
            'private-field',
            'constructor',
            'public-method',
            'protected-method',
            'private-method',
          ],
        },
      ],
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'classProperty',
          leadingUnderscore: 'require',
          modifiers: ['private'],
          format: ['camelCase'],
        },
        {
          selector: ['variable', 'function', 'classMethod'],
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: ['class'],
          format: ['PascalCase'],
          leadingUnderscore: 'forbid',
        },
        {
          selector: 'variable',
          modifiers: ['global', 'const'],
          format: ['UPPER_CASE'],
        },
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
          prefix: ['T'],
        },
      ],
      '@typescript-eslint/no-unused-vars': 'warn',
      'max-len': 'off',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-spread': 'off',
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  }
);
