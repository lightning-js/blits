#!/usr/bin/env node
import { execSync } from 'child_process'

try {
  execSync('npx --yes @lightningjs/create-blits@latest', { stdio: 'inherit' })
} catch (error) {
  console.error('Error while creating new Lightning 3 Blits App', error)
  process.exit(1)
}
