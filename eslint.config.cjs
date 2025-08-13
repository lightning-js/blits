/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

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
