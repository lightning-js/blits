const prettier = require('eslint-plugin-prettier')
const globals = require('globals')
const js = require('@eslint/js')

const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

module.exports = [
  ...compat.extends('eslint:recommended', 'plugin:prettier/recommended', 'prettier'),
  {
    plugins: {
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        parser: 'babel-eslint',
      },
    },

    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
      quotes: [2, 'single', 'avoid-escape'],
      semi: [2, 'never'],
      'no-extra-boolean-cast': 'off',

      'no-unused-vars': [
        1,
        {
          argsIgnorePattern: 'res|next|^err',
        },
      ],

      'prettier/prettier': [
        'error',
        {
          trailingComma: 'es5',
          singleQuote: true,
          tabWidth: 2,
          semi: false,
          printWidth: 100,
        },
      ],
    },
  },
]
