import test from 'tape'
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import injectVersions from './injectVersions.js'

test('version injection resolves installed metadata from Blits, independently of app cwd', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'blits-versions-'))
  try {
    for (const layout of ['nested', 'hoisted', 'linked']) {
      const blits = join(root, layout, 'node_modules/@lightningjs/blits')
      const renderer = join(
        layout === 'nested' ? blits : join(root, layout),
        'node_modules/@lightningjs/renderer'
      )
      mkdirSync(join(blits, 'vite'), { recursive: true })
      mkdirSync(join(renderer, 'dist/exports'), { recursive: true })
      writeFileSync(
        join(blits, 'package.json'),
        JSON.stringify({ type: 'module', version: '1.2.3' })
      )
      writeFileSync(
        join(renderer, 'package.json'),
        JSON.stringify({
          name: '@lightningjs/renderer',
          version: '4.5.6',
          exports: './dist/exports/index.js',
        })
      )
      writeFileSync(join(renderer, 'dist/exports/index.js'), '')
      copyFileSync(
        new URL('./injectVersions.js', import.meta.url),
        join(blits, 'vite/injectVersions.js')
      )
      let pluginPath = join(blits, 'vite/injectVersions.js')
      if (layout === 'linked') {
        const app = join(root, 'consumer/node_modules/@lightningjs')
        mkdirSync(app, { recursive: true })
        symlinkSync(blits, join(app, 'blits'), 'dir')
        pluginPath = join(app, 'blits/vite/injectVersions.js')
      }
      const { default: plugin } = await import(pathToFileURL(pluginPath).href)
      t.deepEqual(
        plugin().config({}, { mode: 'development' }).define,
        {
          __BLITS_VERSION__: '"1.2.3"',
          __RENDERER_VERSION__: '"4.5.6"',
        },
        layout
      )
    }
    const overrides = { __BLITS_VERSION__: '"custom"' }
    t.equal(
      injectVersions().config({ define: overrides }, { mode: 'development' }).define
        .__BLITS_VERSION__,
      overrides.__BLITS_VERSION__,
      'preserves user overrides'
    )
    t.deepEqual(
      injectVersions().config({}, { mode: 'production' }).define,
      injectVersions().config({}, { mode: 'development' }).define,
      'production injects the same versions as development'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
  t.end()
})
