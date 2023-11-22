#!/usr/bin/env node
import { bold, black, bgLightGray } from 'kolorist'
import prompts from 'prompts'
import ora from 'ora'

const spinner = ora()
let response
const defaultBanner = 'Welcome to L3 App development'
console.log(`${bold(black(bgLightGray(defaultBanner)))}`)

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
        spinner.fail("Please enter Application name")
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
  {
    type: 'toggle',
    name: 'tsProject',
    message: 'Do you want to create typescript project',
    initial: '',
    active: 'Yes',
    inactive: 'No'
  },
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
  }
]

const createL3App = async () => {
  response = await prompts(questions)
}

createL3App()

