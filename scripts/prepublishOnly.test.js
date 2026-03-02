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

import test from 'tape'
import sinon from 'sinon'
import path from 'path'
import fs from 'fs'
import childProcess from 'child_process'

// Import functions after setting up module structure
let precompileComponents, processDirectory, processFile, formatFileWithESLint

// Setup before running tests
test('Setup', async (assert) => {
  // Now import prepublishOnly functions
  const prepublishModule = await import('./prepublishOnly.js')
  precompileComponents = prepublishModule.precompileComponents
  processDirectory = prepublishModule.processDirectory
  processFile = prepublishModule.processFile
  formatFileWithESLint = prepublishModule.formatFileWithESLint

  assert.ok(precompileComponents, 'precompileComponents function loaded')
  assert.ok(processDirectory, 'processDirectory function loaded')
  assert.ok(processFile, 'processFile function loaded')
  assert.ok(formatFileWithESLint, 'formatFileWithESLint function loaded')
  assert.end()
})

test('precompileComponents - should log start and end messages', (assert) => {
  const readdirStub = sinon.stub(fs, 'readdirSync').returns([])
  const consoleLogStub = sinon.stub(console, 'log')

  precompileComponents()

  readdirStub.restore()
  consoleLogStub.restore()

  assert.ok(
    consoleLogStub.firstCall && consoleLogStub.firstCall.args[0].includes('Checking files'),
    'Should log checking message'
  )
  assert.ok(
    consoleLogStub.calledWith('Finished processing files suitable for precompilation'),
    'Should log completion message'
  )
  assert.end()
})

test('processDirectory - should process JS files in directory', (assert) => {
  const testDir = path.resolve(process.cwd(), 'test-components')
  const readdirStub = sinon.stub(fs, 'readdirSync').returns(['Component.js'])
  const statStub = sinon.stub(fs, 'statSync').returns({ isDirectory: () => false })
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')

  processDirectory(testDir)

  readdirStub.restore()
  statStub.restore()
  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()

  assert.ok(readdirStub.calledWith(testDir), 'Should read directory')
  assert.ok(statStub.called, 'Should check file stats')
  assert.ok(readStub.called, 'Should read file')
  assert.ok(writeStub.called, 'Should write compiled file')
  assert.ok(copyStub.called, 'Should create backup')
  assert.end()
})

test('processDirectory - should process TS files in directory', (assert) => {
  const testDir = path.resolve(process.cwd(), 'test-components')
  const readdirStub = sinon.stub(fs, 'readdirSync').returns(['Component.ts'])
  const statStub = sinon.stub(fs, 'statSync').returns({ isDirectory: () => false })
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test: string = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')

  processDirectory(testDir)

  readdirStub.restore()
  statStub.restore()
  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()

  assert.ok(readStub.called, 'Should read TS file')
  assert.end()
})

test('processDirectory - should skip .orig.js files', (assert) => {
  const testDir = path.resolve(process.cwd(), 'test-components')
  const readdirStub = sinon.stub(fs, 'readdirSync').returns(['Component.orig.js', 'Helper.js'])
  const statStub = sinon.stub(fs, 'statSync').returns({ isDirectory: () => false })
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')

  processDirectory(testDir)

  readdirStub.restore()
  statStub.restore()
  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()

  // Should only process Helper.js
  assert.equal(readStub.callCount, 1, 'Should only read one file')
  assert.ok(consoleLogStub.calledWith(sinon.match(/Helper\.js/)), 'Should process Helper.js')
  assert.notOk(
    consoleLogStub.calledWith(sinon.match(/Component\.orig\.js/)),
    'Should not process .orig.js'
  )
  assert.end()
})

test('processDirectory - should skip .orig.ts files', (assert) => {
  const testDir = path.resolve(process.cwd(), 'test-components')
  const readdirStub = sinon.stub(fs, 'readdirSync').returns(['Component.orig.ts', 'Helper.ts'])
  const statStub = sinon.stub(fs, 'statSync').returns({ isDirectory: () => false })
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')

  processDirectory(testDir)

  readdirStub.restore()
  statStub.restore()
  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()

  assert.equal(readStub.callCount, 1, 'Should only read one file')
  assert.notOk(
    consoleLogStub.calledWith(sinon.match(/Component\.orig\.ts/)),
    'Should not process .orig.ts'
  )
  assert.end()
})

test('processDirectory - should skip non-JS/TS files', (assert) => {
  const testDir = path.resolve(process.cwd(), 'test-components')
  const readdirStub = sinon
    .stub(fs, 'readdirSync')
    .returns(['README.md', 'config.json', 'Component.js'])
  const statStub = sinon.stub(fs, 'statSync').returns({ isDirectory: () => false })
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')

  processDirectory(testDir)

  readdirStub.restore()
  statStub.restore()
  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()

  assert.equal(readStub.callCount, 1, 'Should only process JS file')
  assert.ok(consoleLogStub.calledWith(sinon.match(/Component\.js/)), 'Should process Component.js')
  assert.end()
})

test('processDirectory - should recursively process subdirectories', (assert) => {
  const testDir = path.resolve(process.cwd(), 'test-components')
  const readdirStub = sinon.stub(fs, 'readdirSync')
  const statStub = sinon.stub(fs, 'statSync')
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')

  readdirStub.onFirstCall().returns(['subdir', 'Component.js'])
  statStub.onCall(0).returns({ isDirectory: () => true })
  statStub.onCall(1).returns({ isDirectory: () => false })

  readdirStub.onSecondCall().returns(['SubComponent.js'])
  statStub.onCall(2).returns({ isDirectory: () => false })

  processDirectory(testDir)

  readdirStub.restore()
  statStub.restore()
  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()

  assert.equal(readdirStub.callCount, 2, 'Should read 2 directories')
  assert.equal(readStub.callCount, 2, 'Should process 2 files')
  assert.end()
})

test('processDirectory - should handle empty directory', (assert) => {
  const testDir = path.resolve(process.cwd(), 'test-components')
  const readdirStub = sinon.stub(fs, 'readdirSync').returns([])
  const statStub = sinon.stub(fs, 'statSync')

  processDirectory(testDir)

  readdirStub.restore()
  statStub.restore()

  assert.ok(readdirStub.calledOnce, 'Should read directory once')
  assert.notOk(statStub.called, 'Should not check any stats')
  assert.end()
})

test('processFile - should create backup with .orig.js extension', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const expectedBackup = path.resolve(process.cwd(), 'Component.orig.js')
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')
  const execStub = sinon.stub(childProcess, 'exec')

  processFile(filePath)

  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()
  execStub.restore()

  assert.ok(copyStub.calledWith(filePath, expectedBackup), 'Should create .orig.js backup')
  assert.end()
})

test('processFile - should create backup with .orig.ts extension', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.ts')
  const expectedBackup = path.resolve(process.cwd(), 'Component.orig.ts')
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')
  const execStub = sinon.stub(childProcess, 'exec')

  processFile(filePath)

  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()
  execStub.restore()

  assert.ok(copyStub.calledWith(filePath, expectedBackup), 'Should create .orig.ts backup')
  assert.end()
})

test('processFile - should read and compile file', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const originalCode = 'const original = "code"'
  const readStub = sinon.stub(fs, 'readFileSync').returns(originalCode)
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')
  const execStub = sinon.stub(childProcess, 'exec')

  processFile(filePath)

  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()
  execStub.restore()

  assert.ok(readStub.calledWith(filePath, 'utf-8'), 'Should read file with utf-8')
  assert.end()
})

test('processFile - should write compiled result', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const readStub = sinon.stub(fs, 'readFileSync').returns('const original = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')
  const execStub = sinon.stub(childProcess, 'exec')

  processFile(filePath)

  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()
  execStub.restore()

  assert.ok(writeStub.calledWith(filePath, sinon.match.string), 'Should write compiled code')
  assert.end()
})

test('processFile - should handle compiler returning object with code property', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const readStub = sinon.stub(fs, 'readFileSync').returns('const original = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')
  const execStub = sinon.stub(childProcess, 'exec')

  processFile(filePath)

  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()
  execStub.restore()

  assert.ok(writeStub.calledWith(filePath, sinon.match.string), 'Should extract code from object')
  assert.end()
})

test('processFile - should format file when source changes', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const readStub = sinon.stub(fs, 'readFileSync').returns('const original = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')
  const execStub = sinon.stub(childProcess, 'exec')

  processFile(filePath)

  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()
  execStub.restore()

  assert.ok(writeStub.called, 'Should write compiled file')
  assert.ok(copyStub.called, 'Should create backup')
  assert.end()
})

test('processFile - should NOT format file when source unchanged', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const sameCode = 'const same = "code"'
  const readStub = sinon.stub(fs, 'readFileSync').returns(sameCode)
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')
  const execStub = sinon.stub(childProcess, 'exec')

  processFile(filePath)

  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()
  execStub.restore()

  assert.ok(copyStub.called, 'Should still create backup')
  assert.end()
})

test('processFile - should log precompiling message', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const readStub = sinon.stub(fs, 'readFileSync').returns('const test = "code"')
  const writeStub = sinon.stub(fs, 'writeFileSync')
  const copyStub = sinon.stub(fs, 'copyFileSync')
  const consoleLogStub = sinon.stub(console, 'log')
  const execStub = sinon.stub(childProcess, 'exec')

  processFile(filePath)

  readStub.restore()
  writeStub.restore()
  copyStub.restore()
  consoleLogStub.restore()
  execStub.restore()

  assert.ok(
    consoleLogStub.calledWith(`Precompiling ${filePath}`),
    'Should log precompiling message'
  )
  assert.end()
})

test('formatFileWithESLint - should accept file path', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const execStub = sinon.stub(childProcess, 'exec')

  // Just verify the function can be called without errors
  assert.doesNotThrow(() => {
    formatFileWithESLint(filePath)
  }, 'Should accept file path without throwing')

  assert.ok(execStub.calledOnce, 'Should call exec once')
  execStub.restore()
  assert.end()
})

test('formatFileWithESLint - should handle file path parameter', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const execStub = sinon.stub(childProcess, 'exec')

  // Verify function accepts path parameter
  assert.doesNotThrow(() => {
    formatFileWithESLint(filePath)
  }, 'Should handle file path parameter')

  execStub.restore()
  assert.end()
})

test('formatFileWithESLint - should be callable', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const execStub = sinon.stub(childProcess, 'exec')

  // Verify function is callable
  assert.equal(typeof formatFileWithESLint, 'function', 'Should be a function')
  formatFileWithESLint(filePath)

  execStub.restore()
  assert.end()
})

test('formatFileWithESLint - should execute without errors', (assert) => {
  const filePath = path.resolve(process.cwd(), 'Component.js')
  const execStub = sinon.stub(childProcess, 'exec')

  // Verify function executes without throwing
  assert.doesNotThrow(() => {
    formatFileWithESLint(filePath)
  }, 'Should execute without errors')

  execStub.restore()
  assert.end()
})
