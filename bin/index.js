#!/usr/bin/env node
import path from 'path'
import { dirname } from 'path'
import prompts from 'prompts'
import { fileURLToPath } from 'url'
import sequence from "../src/helpers/sequence.js"
import {
  addESlint,
  copyLightningFixtures,
  setAppData,
  setBlitsVersion,
  gitInit,
  done, spinnerMsg
} from '../src/helpers/cli-helpers.js'

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
    initial : 'my_lightning3_app',
  },
  {
    type: prev => {
      if(!prev.trim()){
        return process.exit(1)
      } else return 'text'
    },
    name: 'appPackage',
    message: 'Package Name',
    initial: prev =>`${prev.replace(/_/g, '-')}`
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



