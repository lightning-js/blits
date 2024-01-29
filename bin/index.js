#!/usr/bin/env node
import path from 'path'
import { dirname } from 'path'
import prompts from 'prompts'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import { red, bold } from 'kolorist'
import sequence from '../src/helpers/sequence.js'
import validatePackage from 'validate-npm-package-name'
import {
  addESlint,
  copyLightningFixtures,
  setAppData,
  setBlitsVersion,
  gitInit,
  done, spinnerMsg
} from './helpers.js'

const defaultBanner = `
------------------------------------------------------------------
 Welcome to Blits - The App development framework for Lightning 3
------------------------------------------------------------------


Answer the questions below to set up a new App
`

console.log(defaultBanner)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fixturesBase = path.join(
  __dirname,
  '../boilerplate')

const questions = [
  {
    type: 'text',
    name: 'appName',
    message: 'App name',
    format: val => {
      // Check if the provided application name is empty
      if (!val.trim()) {
        spinnerMsg.fail(red(bold("Please provide a name for the App")))
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
    message: 'Package Name',
    format: val => {
      // Validate the package name using validate-npm-package-name
      if (!validatePackage(val).validForNewPackages) {
        spinnerMsg.fail(red(bold("Please provide a valid package name")))
        return process.exit(1)
      } else {
        return val
      }
    },
    initial: prev => `${prev.replace(/_/g, '-')}`,
  },
  {
    type: 'text',
    name: 'appFolder',
    message: 'Specify the location for the app to be created',
    format: (val, prev) => {
      // Regular expression to validate whether the path is Unix/Windows-based
      const pathRegex = /([A-Za-z]:)?([\\/]+\w+)+/
      // Check if the provided path matches the defined regex
      if (pathRegex.test(val)) {
        try {
          // Check if the path exists
          if (fs.statSync(val)) {
            // Return the resolved file path using path.join
            return `${path.join(val, prev.appName)}`
          }
        } catch (e) {
          // Handle case where an error occurred during file system interaction
          if (e.code === 'ENOENT') {
            spinnerMsg.fail(red(bold("Entered directory path is invalid, please enter a valid directory!")))
            process.exit()
          }
        }
      } else if (val === prev.appName) {
        return path.join(process.cwd(), prev.appName)
      }
    },
    initial: (prev, val) => val.appName,
  },
  // {
  //   type: 'toggle',
  //   name: 'tsProject',
  //   message: 'Do you want to create typescript project',
  //   initial: '',
  //   active: 'Yes',
  //   inactive: 'No'
  // },
  {
    type: 'toggle',
    name: 'esLint',
    message: 'Enable eslint',
    initial: 'true',
    active: 'Yes',
    inactive: 'No',
  },
  {
    type: 'toggle',
    name: 'gitInit',
    message: 'Enable gitInit',
    initial: 'true',
    active: 'Yes',
    inactive: 'No',
  },
  // {
  //   type: 'select',
  //   name: 'config',
  //   message: 'Select config',
  //   choices: [
  //     { title: 'EsLint', value: 'eslintPrettier' },
  //     // { title: 'EsLint+Prettier', value: 'eslintPrettier' }
  //     // { title: 'Eslint+Airbnb', value: 'eslintAirbnb' },
  //   ],
  // }
]


const createApp = () => {
  return new Promise(resolve => {
    let config
    sequence([
      async () => {
        config = await prompts(questions)
        config.fixturesBase = fixturesBase
        return config
      },
      () => {
        spinnerMsg.start(`Creating Blits Lightning 3 App ${config.appName}`)
        return copyLightningFixtures(config).then(targetDir => (config.targetDir = targetDir))
      },
      () => setAppData(config),
      () => setBlitsVersion(config),
      () => config.esLint && addESlint(config),
      () => config.gitInit&& gitInit(config.targetDir, config.fixturesBase),
      () => done(config)
    ])
  })
}

createApp()
