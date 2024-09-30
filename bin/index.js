#!/usr/bin/env node
import { execSync } from 'child_process'

try {
  execSync('npx --yes blits-create@latest', { stdio: 'inherit' })
} catch (error) {
  console.error('Error running blits-create:', error)
  process.exit(1)
}
