import { $ } from 'execa'
import { argv } from 'process'
import path from 'path'
import { fileURLToPath } from 'url'

import { detectContainerRuntime } from './detectDockerRuntime.js'

/**
 * Builds a container image using the detected container runtime.
 * Changes the working directory to one level higher than the script's location.
 * @param runtime - The container runtime (`podman` or `docker`).
 * @param imageName - The name of the container image to build.
 */
async function buildContainer(runtime, imageName) {
  // Change working directory to one level higher than the script's location
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const scriptDir = path.resolve(__dirname, '../../')
  process.chdir(scriptDir)

  console.log(`Working directory changed to: ${scriptDir}`)
  console.log(`Using ${runtime} to build the container image: ${imageName}`)
  try {
    await $({ stdio: 'inherit' })`${runtime} build -t ${imageName} .`
  } catch (error) {
    console.error(`Failed to build the image with ${runtime}.`, error)
    process.exit(1)
  }
}

;(async () => {
  const imageName = argv[2] || 'visual-tests' // Default image name
  try {
    const runtime = await detectContainerRuntime()
    await buildContainer(runtime, imageName)
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exit(1)
  }
})()
