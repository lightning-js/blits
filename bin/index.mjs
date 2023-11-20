#!/usr/bin/env node
import { green, bold } from 'kolorist';
import path from 'path'
import { dirname } from 'path'
import { execa } from 'execa'
import fs from 'fs-extra'
import replaceInFile from 'replace-in-file'
import prompts from 'prompts'
import ora from 'ora'
import { fileURLToPath } from 'url'

const spinner = ora()
const defaultBanner = 'Welcome to L3 App development'

console.log(defaultBanner)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fixturesBase = path.join(
  __dirname,
  '../boilerplate')

/**
 * Prompt the user for input and capture their response using the prompts library.
 *
 * @param {string} type - The type of input to request (e.g., text, toggle, etc.).
 * @param {string} name - A unique name to identify the user's response.
 * @param {string} question - The question or message to display to the user.
 * @param {string|null} defaultAnswer - (Optional) The default value to pre-fill in the input field.
 * @param {string|null} active - (Optional) The active choice when using a toggle input.
 * @param {string|null} inactive - (Optional) The inactive choice when using a toggle input.
 *
 * @returns {Promise} A Promise that resolves with the user's responses to the prompt.
 */
const ask = (type, name, question, defaultAnswer = null, active = null, inactive = null) => {
  // Use the prompts library to display the question and capture the user's input.
  return prompts({
    type: type,
    name: name,
    message: question,
    initial: defaultAnswer,
    active: active,
    inactive: inactive,
  })
    .then(answers => answers)
}

/**
 * Display a message and start a spinner with the specified message.
 *
 * @param {string} msg - The message to display while starting the spinner.
 */
const spinnerMsg = {
  start(msg) {
    console.log(' ')
    spinner.start(msg)
  },
  stop() {
    spinner.stop()
  },
  succeed(msg) {
    spinner.succeed(msg)
  },
  fail(msg) {
    spinner.fail(msg)
    console.log(' ')
  },
  warn(msg) {
    spinner.warn(msg)
  },
}

/**
 * Execute a sequence of asynchronous steps one after another.
 *
 * @param {Array<Function>} steps - An array of functions representing the asynchronous steps to execute.
 * @returns {Promise} A Promise that resolves when all steps are successfully completed or rejects on the first encountered error.
 */

const sequence = steps => {
  return steps.reduce((promise, method) => {
    return promise
      .then(function() {
        return method(...arguments)
      })
      .catch(e => Promise.reject(e))
  }, Promise.resolve(null))
}

/**
 * Validate the application name to ensure it is not empty.
 *
 * @param {string} appName - The application name to validate.
 * @returns {string} The validated application name.
 */
const validateAppName = appName => {
  if (!appName) {
    exit('Please provide an app Name')
  }
  return appName
}

/**
 * Validate the application package name (app ID) to ensure it is not empty.
 *
 * @param {string} appPackageName - The application package name to validate.
 * @returns {string} The validated application package name.
 */
const validatePackageName = appPackageName => {
  if (!appPackageName) {
    exit('Please provide an app ID')
  }
  return appPackageName
}

/**
 * Validate the specified folder path for correctness and existence.
 *
 * @param {string} folder - The folder path to validate.
 * @returns {string} The validated folder path.
 */
const validateAppFolder = folder => {
  // todo: validate if folder is correct path / doesn't exist etc.
  return folder
}

/**
 * Prompt the user to input the application name and validate it.
 */
const askAppName = () =>
  sequence([
    () => ask('text', 'appName', 'Application Name', 'my_lightning3_app'),
    appName => validateAppName(appName),
  ])

/**
 * Prompt the user to input the application package name and validate it.
 */
const askPackageName = appName =>
  sequence([
    () => ask('text', 'appPackage', 'Package Name', `${(appName.appName).replace(/_/g, '-')}`),
    packageName => validatePackageName(packageName),
  ])

/**
 * Prompt the user to input the application folder name and validate it.
 */
const askAppFolder = appName => {
  return sequence([
    () =>
      ask(
        'text', 'appFolder', 'Specify the location for the app to be created', `${appName}`
      ),
    appFolder => validateAppFolder(appFolder),
  ])
}

/**
 * Prompt the user to select whether it is to be a js or ts project
 */
const askTypeScript = () =>
  ask('toggle', 'tsProject', 'Do you want to create tyescript project', '', 'Yes', 'No').then(
    val => val

  )

/**
 * Prompt the user to select whether to include eslint
 */
const askESlint = () =>
  ask('toggle', 'configType', 'Enable eslint', 'true', 'Yes', 'No').then(value => value)

/**
 * Prompt the user to select whether to initialize git repo
 */
const askGitInit = () =>
  ask('toggle', 'configType', 'Enable gitInit', 'true', 'Yes', 'No').then(value => value)

/**
 * Initialize an empty Git repository in the specified directory and copy a .gitignore file.
 *
 * @param {string} cwd - The current working directory where the Git repository will be created.
 * @param {string} fixturesBase - The base directory for fixtures.
 * @returns {Promise} A Promise that resolves when the Git initialization and file copying are completed successfully
 */
const gitInit = (cwd, fixturesBase) => {
  spinnerMsg.start('Initializing empty GIT repository')
  let msg
  return execa('git', ['init'], { cwd })
    .then(({ stdout }) => (msg = stdout))
    .then(() => {
      return fs.copyFileSync(path.join(fixturesBase, 'common/git/.gitignore'), path.join(cwd, '.gitignore'))
    })
    .then(() => spinnerMsg.succeed(msg))
    .catch(e => spinnerMsg.fail(`Error occurred while creating git repository\n\n${e}`))
}

/**
 * Display an error message and exit the program with an error status.
 *
 * @param {string} msg - The error message to display before exiting the program.
 */
const exit = msg => {
  spinnerMsg.fail(msg)
  process.exit()
}

/**
 * This function execute sequence of steps to collect the input form the user
 * @returns {Promise} A Promise that resolves with the final configuration object based on user input.
 */
const askConfig = async () => {
  const config = {}
  return sequence([
    () => askAppName().then(appName => (config.appName = appName)),
    () => askPackageName(config.appName).then(appPackageName => (config.appPackageName = appPackageName)),
    () => askAppFolder(config.appName.appName).then(folder => (config.appFolder = folder)),
    // () =>
    //   askTypeScript().then(
    //     projectType =>
    //       config.projectType = projectType.tsProject ? 'ts' : 'js'
    //   ),
    () => askESlint().then(eslint => (config.eslint = eslint)),
    () => askGitInit().then(gitInit => config.gitInit=gitInit),
    () => config

  ])
}

/**
 * This function replaces placeholders like '{$appName}' and '{$appPackage}' in files within the target directory
 * with the actual values from the configuration object.
 *
 * @param {Object} config - The configuration object containing application data.
 */
const setAppData = config => {
  replaceInFile.sync({
    files: config.targetDir + '/*',
    from: /\{\$appName\}/g,
    to: config.appName.appName,
  })

  replaceInFile.sync({
    files: config.targetDir + '/*',
    from: /\{\$appPackage\}/g,
    to: config.appPackageName.appPackage,
  })
}

/**
 * This function sets the version by fetching the latest blits version
 * @param config
 * @returns {Promise<unknown>}
 */
const setSdkVersion = config => {
  return new Promise((resolve, reject) => {
    execa('npm', ['view', '@lightningjs/blits', 'version'])
      .then(({ stdout }) => {
        replaceInFile.sync({
          files: config.targetDir + '/*',
          from: /\{\$sdkVersion\}/g,
          to: '^' + stdout,
        })
        resolve()
      })
      .catch(e => {
        spinnerMsg.fail(`Error occurred while setting sdk version\n\n${e}`)
        reject()
      })
  })
}

/**
 * This function adds eslint related configuration to the project folder to be created
 * @param config
 * @returns {boolean}
 */
const addESlint = config => {
  // Make husky dir
  fs.mkdirSync(path.join(config.targetDir, '.husky'), { recursive: true })

  // Copy husky hook
  fs.copyFileSync(
    path.join(config.fixturesBase, 'common/eslint/husky/pre-commit'),
    path.join(config.targetDir, '.husky/pre-commit')
  )

  // Copy editor config from common
  fs.copyFileSync(
    path.join(config.fixturesBase, 'common/eslint/.editorconfig'),
    path.join(config.targetDir, '.editorconfig')
  )

  // Copy eslintignore from common
  fs.copyFileSync(
    path.join(config.fixturesBase, 'common/eslint/.eslintignore'),
    path.join(config.targetDir, '.eslintignore')
  )

  // Copy eslintrc.js from fixtured specfic directory
  fs.copyFileSync(
    path.join(config.fixturesBase, 'common/eslint/.eslintrc.cjs'),
    path.join(config.targetDir, '.eslintrc.cjs')
  )

  // Copy IDE stuff from fixture base
  fs.copySync(path.join(config.fixturesBase, 'common/ide'), path.join(config.targetDir))

// Copy and merge fixture specific package.json
  const origPackageJson = JSON.parse(fs.readFileSync(path.join(config.targetDir, 'package.json')))
  const eslintPackageJson = JSON.parse(
    fs.readFileSync(path.join(config.fixturesBase, 'common/eslint/package.json'))
  )
  fs.writeFileSync(
    path.join(config.targetDir, 'package.json'),
    JSON.stringify(
      {
        ...origPackageJson,
        ...eslintPackageJson,
        devDependencies: {
          ...(origPackageJson.devDependencies || {}),
          ...(eslintPackageJson.devDependencies || {}),
        },
      },
      null,
      2
    )
  )

  return true
}

/**
 * This function Creates a L3 application
 */
const createApp = config => {
  spinnerMsg.start('Creating Lightning App ' + config.appName.appName)
  return sequence([
    () => copyLightningFixtures(config).then(targetDir => (config.targetDir = targetDir)),
    () => setAppData(config),
    () => setSdkVersion(config),
    () => config.eslint.configType && addESlint(config),
    () => config.gitInit.configType && gitInit(config.targetDir, config.fixturesBase),
    () =>
      new Promise(resolve => {
        setTimeout(() => {
          spinnerMsg.succeed()
          resolve()
        }, 5000)
      }),
    () => config,
  ])
}

/**
 * This function copies Lightning fixtures to the target directory for creating a L3 application.
 */

const copyLightningFixtures = config => {
  config.fixturesBase = fixturesBase
  return new Promise(resolve => {

    const targetDir = path.join(process.cwd(), config.appFolder.appFolder || '')
    if (config.appFolder && fs.pathExistsSync(targetDir)) {
      exit('The target directory ' + targetDir + ' already exists')
    }
    //this will be removed once ts support is added
    fs.copySync(path.join(path.join(config.fixturesBase, 'js'), 'default'), targetDir)
    //
    // if (config.projectType === 'ts') {
    //   fs.copySync(path.join(path.join(config.fixturesBase, 'ts'), 'default'), targetDir)
    // } else {
    //   fs.copySync(path.join(path.join(config.fixturesBase, 'js'), 'default'), targetDir)
    // }

    resolve(targetDir)
  })
}

/**
 * This function displays a completion message and providing instructions to the user
 * after the creation of a L3 application is successfully completed.
 * @param {Object} config - The configuration object containing relevant details of the created application.
 */
const done = (config) => {
  console.log(
    '================================== ⚡️⚡️⚡️⚡️ ================================== '
  )
  console.log('Your new boilerplate Lightning 3 App has been created!')
  console.log('')
  console.log(`    ${green(bold(`cd ${config.appFolder.appFolder}`))}`)
  console.log(`    ${green(bold('npm install'))}`)
  console.log(`    ${green(bold('npm run dev'))}`)
  console.log(
    '================================== ⚡️⚡️⚡️⚡️ ================================== ')
}

const createL3App = () => {
  return new Promise(resolve => {
    sequence([
      askConfig,
      config => createApp(config),
      config => done(config),
      config => resolve(config),
    ])
  })
}

createL3App()
