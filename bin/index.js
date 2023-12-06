#!/usr/bin/env node
import path from 'path'
import { dirname } from 'path'
import prompts from 'prompts'
import { fileURLToPath } from 'url'
import { red, bold } from 'kolorist'
import sequence from "../src/helpers/sequence.js"
import validatePackage from 'validate-npm-package-name'
import {
  addESlint,
  copyLightningFixtures,
  setAppData,
  setBlitsVersion,
  gitInit,
  done, spinnerMsg, isValidPath
} from './helpers.js'

let config
const defaultBanner = 'Welcome to L3 App development'

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
    message:  'Application Name',
    format: val => {
      if(!val.trim()){
        spinnerMsg.fail(red(bold("Application name should not be empty!")))
        return process.exit(1)
      } else return val
    },
    initial : 'my_lightning3_app',
  },
  {
    type: 'text',
    name: 'appPackage',
    message: 'Package Name',
    format: val => {
      if(!validatePackage(val).validForNewPackages) {
        spinnerMsg.fail(red(bold("Package name is invalid!")))
        return process.exit(1)
      } else return val
    },
    initial: prev => `${prev.replace(/_/g, '-')}`
  },
  {
    type: 'text',
    name: 'appFolder',
    message: 'Specify the location for the app to be created',
    initial: prev => prev
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


const createL3App = () => {
  return new Promise(resolve => {
    sequence([
      async () => {
        config = await prompts(questions)
        config.fixturesBase = fixturesBase
      },
      () => {
        spinnerMsg.start(`Creating Lightning 3 application with name ${config.appName}`)
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

createL3App()



