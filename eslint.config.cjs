const { defineConfig, globalIgnores } = require('eslint/config')

const globals = require('globals')
const prettier = require('eslint-plugin-prettier')
const babelParser = require('@babel/eslint-parser')
const js = require('@eslint/js')

const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        globalThis: false,
      },

      parser: babelParser,
      ecmaVersion: 2018,
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,

        babelOptions: {
          plugins: ['@babel/plugin-syntax-import-assertions'],
        },
      },
    },

    plugins: {
      prettier,
    },

    extends: compat.extends('eslint:recommended', 'plugin:prettier/recommended', 'prettier'),

    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
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
          endOfLine: 'auto',
        },
      ],
    },
  },
  globalIgnores(['**/node_modules']),
])
