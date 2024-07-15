import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import { resolve as pathResolve } from 'node:path'

export default {
  input: './index.js',
  output: {
    file: pathResolve('dist/blits.min.js'),
    format: 'esm',
    sourcemap: true,
  },
  onwarn: (msg, warn) => {
    if (msg.code !== 'CIRCULAR_DEPENDENCY') {
      warn(msg)
    }
  },
  plugins: [resolve(), terser()],
  external: ['execa', 'kolorist', 'ora', 'prompts', 'replace-in-file', 'validate-npm-package-name'],
}
