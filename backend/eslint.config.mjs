import js from '@eslint/js';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginNode from 'eslint-plugin-n';
import globals from 'globals';
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    ignores: [
      '**/migrations/*',
      '**/node_modules/*',
      '**/coverage/*',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: typescriptEslintParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        createDefaultProgram: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.jest,
        NodeJS: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      import: eslintPluginImport,
      n: eslintPluginNode,
      boundaries,
    },
    rules: {
      // TypeScript and code style rules
      semi: 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'space-before-function-paren': 'off',
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      'comma-dangle': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { overrides: { constructors: 'no-public' } }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Node.js specific rules
      'n/no-deprecated-api': 'error',
      'n/no-missing-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',

      // Import organization
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // General rules
      'no-use-before-define': ['error', { variables: true }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      'max-len': ['off', { code: 120 }],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],      ...boundaries.configs.recommended.rules,
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'app',
          pattern: 'src/{app,server}.ts',
        },
        {
          type: 'config',
          pattern: 'src/config/**/*',
        },
        {
          type: 'core',
          pattern: 'src/core/**/*',
        },
        {
          type: 'database',
          pattern: 'src/dataBase/**/*',
        },
        {
          type: 'exceptions',
          pattern: 'src/exceptions/**/*',
        },
        {
          type: 'helpers',
          pattern: 'src/helpers/**/*',
        },
        {
          type: 'middlewares',
          pattern: 'src/middlewares/**/*',
        },
        {
          type: 'modules',
          pattern: 'src/modules/**/*',
        },
        {
          type: 'utils',
          pattern: 'src/utils/**/*',
        },
        {
          type: 'validators',
          pattern: 'src/validators/**/*',
        },
      ],
      'boundaries/ignore': [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/jest.setup.ts',
      ],
    },
  },
];
