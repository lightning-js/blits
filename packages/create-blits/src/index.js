/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

import path from 'path'
import process from 'process'
import { dirname } from 'path'
import prompts from 'prompts'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { red, bold } from 'kolorist'
import sequence from './helpers/sequence.js'
import validatePackage from 'validate-npm-package-name'
import {
  addESlint,
  copyLightningFixtures,
  setAppData,
  setBlitsVersion,
  gitInit,
  done,
  spinnerMsg,
} from './helpers/create.js'

const defaultBanner = `
--------------------------------------------------------------------
 Welcome to Blits - The App development framework for Lightning 3 ⚡️
--------------------------------------------------------------------

Answer the questions below to set up a new Lightning 3 Blits App
`

console.log(defaultBanner)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fixturesBase = path.join(__dirname, '../boilerplate')

const questions = [
  {
    type: 'text',
    name: 'appName',
    message: 'What is the name of your App?',
    format: (val) => {
      // Check if the provided application name is empty
      if (!val.trim()) {
        spinnerMsg.fail(red(bold('Please provide a name for the App')))
        return process.exit(1)
      } else {
        return val
      }
    },
    initial: 'My Blits App', // Default value for the application name
  },
  {
    type: 'text',
    name: 'appPackage',
    message: 'What is the package name of your App?',
    format: (val) => {
      // Validate the package name using validate-npm-package-name
      if (!validatePackage(val).validForNewPackages) {
        spinnerMsg.fail(red(bold('Please provide a valid package name')))
        return process.exit(1)
      } else {
        return val
      }
    },
    initial: (prev) =>
      `${prev.replace(/[\sA-Z]/g, (str) => (str === ' ' ? '-' : str.toLowerCase()))}`,
  },
  {
    type: 'text',
    name: 'appFolder',
    message: 'In what folder (relative to the current location) should the App be generated?',
    format: (val, prev) => {
      // Regular expression to validate whether the path is Unix/Windows-based
      const pathRegex = /([A-Za-z]:)?([\\/]+\w+)+/
      // Check if the provided path matches the defined regex
      if (pathRegex.test(val)) {
        try {
          // Check if the path exists
          if (fs.statSync(val)) {
            // Return the resolved file path using path.join
            return `${path.join(val, prev.appPackage)}`
          }
        } catch (e) {
          // Handle case where an error occurred during file system interaction
          if (e.code === 'ENOENT') {
            spinnerMsg.fail(
              red(bold('Entered directory path is invalid, please enter a valid directory!'))
            )
            process.exit()
          }
        }
      } else if (val === prev.appPackage) {
        return path.join(process.cwd(), prev.appPackage)
      }
    },
    initial: (prev, val) => val.appPackage,
  },
  {
    type: 'select',
    name: 'projectType',
    message: 'What kind of project do you want to create?',
    choices: [
      {
        title: 'Javascript',
        description: 'JS based project (with JSDoc for type checking and autocompletion)',
        value: 'js',
      },
      { title: 'TypeScript', description: 'TS based project', value: 'ts' },
    ],
    initial: 0,
  },
  {
    type: 'toggle',
    name: 'esLint',
    message: 'Do you want to enable eslint?',
    initial: true,
    active: 'Yes',
    inactive: 'No',
  },
  {
    type: 'toggle',
    name: 'gitInit',
    message: 'Do you want to generate a git repository?',
    initial: 'true',
    active: 'Yes',
    inactive: 'No',
  },
]

const createApp = () => {
  return new Promise((resolve) => {
    let config
    sequence([
      async () => {
        const onCancel = () => {
          process.exit()
        }
        config = await prompts(questions, { onCancel })
        config.fixturesBase = fixturesBase
        return config
      },
      () => {
        spinnerMsg.start(`Generating new App "${config.appName}" ...`)
        copyLightningFixtures(config)
          .then((targetDir) => (config.targetDir = targetDir))
          .catch(console.error)
        spinnerMsg.succeed()
      },
      () => setAppData(config),
      () => setBlitsVersion(config),
      () => config.esLint && addESlint(config),
      () => config.gitInit && gitInit(config.targetDir, config.fixturesBase),
      () => done(config),
    ])
  })
}

export default createApp
