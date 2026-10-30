const base = require('./eslint.base.cjs')
const tseslint = require('typescript-eslint')

const files = ['**/*.{ts,mts,cts}']

module.exports = [
  ...base,
  ...tseslint.configs.recommended.map((config) => ({ ...config, files })),
  {
    files,
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: 'res|next|^err',
        },
      ],
    },
  },
]
