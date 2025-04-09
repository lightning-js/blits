#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync } from 'fs'

// Read the input provided by the pre-push hook
const input = readFileSync(0, 'utf-8').trim().split(' ')
if (input.length < 4) {
  console.log('Insufficient input from pre-push hook. Skipping lint.')
  process.exit(0)
}

const localSha = input[1] // The SHA being pushed
const remoteSha = input[3] // The remote SHA, can be zeros for new branch

// If remote is all zeros, it's a new branch
const isNewBranch = remoteSha === '0000000000000000000000000000000000000000'

let filesToLint

try {
  if (isNewBranch) {
    // For a new branch, compare with dev
    filesToLint = execSync(`git diff --name-only dev...${localSha} | grep '\\.js$'`, {
      encoding: 'utf8',
    })
  } else {
    // Only check files in the commits that are being pushed right now
    filesToLint = execSync(`git diff --name-only ${remoteSha}..${localSha} | grep '\\.js$'`, {
      encoding: 'utf8',
    })
  }
} catch (error) {
  // grep will exit with code 1 if it doesn't find anything
  console.log('No JavaScript files changed. Nothing to lint.')
  process.exit(0)
}

if (!filesToLint.trim()) {
  console.log('No JavaScript files changed. Nothing to lint.')
  process.exit(0)
}

const fileList = filesToLint.trim().split('\n')
console.log(`Running ESLint on ${fileList.length} changed JavaScript files:\n`)
console.log(filesToLint)

try {
  // Run ESLint on the changed files
  execSync(`npx eslint ${fileList.join(' ')}`, { stdio: 'inherit' })
  console.log('Linting passed successfully!\n')
  process.exit(0)
} catch (error) {
  console.log('\n==========================================================================')
  console.log('ESLint found issues in your code. Please fix them before pushing.')
  console.log('You can run:\n')
  console.log('npx eslint --fix "**/*.js"\n')
  console.log('on the specific files to automatically fix some issues.')
  console.log('==========================================================================\n')
  process.exit(1)
}
