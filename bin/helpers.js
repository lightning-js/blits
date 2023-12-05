import { green, bold } from 'kolorist';
import path from 'path'
import { execa } from 'execa'
import fs from 'fs-extra'
import replaceInFile from 'replace-in-file'
import ora from 'ora'
const spinner = ora()

/**
 * This function copies Lightning fixtures to the target directory for creating a L3 application.
 */

export const copyLightningFixtures = config => {
    return new Promise(resolve => {
        const targetDir = path.join(process.cwd(), config.appFolder || '')
        if (config.appFolder && fs.pathExistsSync(targetDir)) {
            exit('The target directory ' + targetDir + ' already exists')
        }
        //this will be removed once ts support is added
        fs.copySync(path.join(path.join(config.fixturesBase, 'js'), 'default'), targetDir)
        fs.copySync(
          path.join(config.fixturesBase, 'common/public'),
          path.join(targetDir, 'public')
        )

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
 * This function adds eslint related configuration to the project folder to be created
 * @param config
 * @returns {boolean}
 */
export const addESlint = config => {
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
 * This function sets the version by fetching the latest blits version
 * @param config
 * @returns {Promise<unknown>}
 */
export const setBlitsVersion = config => {
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
 * Display a message and start a spinner with the specified message.
 *
 * @param {string} msg - The message to display while starting the spinner.
 */
export const spinnerMsg = {
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
 * This function replaces placeholders like '{$appName}' and '{$appPackage}' in files within the target directory
 * with the actual values from the configuration object.
 *
 * @param {Object} config - The configuration object containing application data.
 */
export const setAppData = config => {
    replaceInFile.sync({
        files: config.targetDir + '/*',
        from: /\{\$appName\}/g,
        to: config.appName,
    })

    replaceInFile.sync({
        files: config.targetDir + '/*',
        from: /\{\$appPackage\}/g,
        to: config.appPackage,
    })
}


/**
 * Display an error message and exit the program with an error status.
 *
 * @param {string} msg - The error message to display before exiting the program.
 */
export const exit = msg => {
    spinnerMsg.fail(msg)
    process.exit()
}

/**
 * Initialize an empty Git repository in the specified directory and copy a .gitignore file.
 *
 * @param {string} cwd - The current working directory where the Git repository will be created.
 * @param {string} fixturesBase - The base directory for fixtures.
 * @returns {Promise} A Promise that resolves when the Git initialization and file copying are completed successfully
 */
export const gitInit = (cwd, fixturesBase) => {
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


export const done = (config) => {
    console.log(
        '================================== ⚡️⚡️⚡️⚡️ ================================== '
    )
    console.log('Your new boilerplate Lightning 3 App has been created!')
    console.log('')
    console.log(`    ${green(bold(`cd ${config.appFolder}`))}`)
    console.log(`    ${green(bold('npm install'))}`)
    console.log(`    ${green(bold('npm run dev'))}`)
    console.log(
        '================================== ⚡️⚡️⚡️⚡️ ================================== ')
}
