#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

const folder = process.argv.slice(2).pop()

if (!folder) {
  console.error('Please specify a folder for your new Lightning 3 App')
} else {
  if (fs.existsSync(folder)) {
    console.error(`The directory ${folder} already exists! Choose a different location.`)
  } else {
    fs.cpSync(path.join(__dirname, '..', 'boilerplate'), folder, { recursive: true })
    console.log(
      '================================== ⚡️⚡️⚡️⚡️ ================================== '
    )
    console.log('Your new boilerplate Lightning 3 App has been created!')
    console.log('')
    console.log(`Go to ${folder}, run npm install, followed by npm run dev to get started`)
    console.log(
      '================================== ⚡️⚡️⚡️⚡️ ================================== '
    )
  }
}
