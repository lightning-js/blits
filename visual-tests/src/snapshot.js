import fs from 'fs-extra'
import chalk from 'chalk'
import path from 'path'

import { failedResultsDir } from './index.js'

import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

/**
 * Handles the snapshot capture process.
 *
 * @param page The Playwright page object
 * @param snapshotPath The path to save the snapshot
 * @param options The snapshot options
 * @param subtestName The name of the subtest
 * @param snapshotIndex The index of the snapshot
 * @param overwrite Whether to overwrite the snapshot if it already exists
 * @returns A promise that resolves to a boolean indicating whether the snapshot was saved or skipped
 */
export async function saveSnapshot(
  page,
  snapshotPath,
  options,
  subtestName,
  snapshotIndex,
  overwrite
) {
  process.stdout.write(
    chalk.gray(`Saving snapshot for ${chalk.white(`${subtestName}-${snapshotIndex}`)}... `)
  )

  if (fs.existsSync(snapshotPath) && !overwrite) {
    process.stdout.write(chalk.yellow.bold('SKIPPED! (already exists)\n'))
    return false
  }

  await page.screenshot({ path: snapshotPath, clip: options.clip })
  process.stdout.write(chalk.green.bold('DONE!\n'))
  return true
}

/**
 * Handles the snapshot comparison process.
 */
export async function compareSnapshot(page, snapshotPath, options, subtestName, snapshotIndex) {
  process.stdout.write(chalk.gray(`Running ${chalk.white(`${subtestName}-${snapshotIndex}`)}... `))

  const actualPng = await page.screenshot({ clip: options.clip })

  if (!fs.existsSync(snapshotPath)) {
    console.log(chalk.red.bold('FAILED! (snapshot does not exist!)'))
    await saveFailedSnapshot(subtestName, snapshotIndex, actualPng, null, undefined)
    return false
  }

  const expectedPng = await fs.promises.readFile(snapshotPath)
  const width = options.clip?.width || 1080
  const height = options.clip?.height || 1920
  const result = compareBuffers(actualPng, expectedPng, width, height)

  if (result.doesMatch) {
    console.log(chalk.green.bold('PASS!'))
    return true
  }

  console.log(chalk.red.bold(`FAILED!${result.reason ? ` (${result.reason})` : ''}`))

  await saveFailedSnapshot(
    subtestName,
    snapshotIndex,
    actualPng,
    expectedPng,
    result.diffImageBuffer
  )
  return false
}

/**
 * Saves failed snapshot results for debugging.
 */
export async function saveFailedSnapshot(
  subtestName,
  snapshotIndex,
  actualPng,
  expectedPng,
  diffPng
) {
  const writeTasks = [
    fs.promises.writeFile(
      path.join(failedResultsDir, `${subtestName}-${snapshotIndex}-actual.png`),
      actualPng
    ),
  ]

  if (expectedPng) {
    writeTasks.push(
      fs.promises.writeFile(
        path.join(failedResultsDir, `${subtestName}-${snapshotIndex}-expected.png`),
        expectedPng
      )
    )
  }

  if (diffPng) {
    writeTasks.push(
      fs.promises.writeFile(
        path.join(failedResultsDir, `${subtestName}-${snapshotIndex}-diff.png`),

        PNG.sync.write(diffPng)
      )
    )
  }

  await Promise.all(writeTasks)
}

/**
 * Compare two image buffers and return if they match and a diff image buffer
 *
 * @param actualImageBuffer Buffer of the actual image
 * @param expectedImageBuffer Buffer of the expected image
 * @returns CompareResult
 */
export function compareBuffers(actualImageBuffer, expectedImageBuffer, width, height) {
  const diff = new PNG({ width: width, height: height })
  const actualImage = PNG.sync.read(actualImageBuffer)
  const expectedImage = PNG.sync.read(expectedImageBuffer)

  if (actualImage.width !== expectedImage.width || actualImage.height !== expectedImage.height) {
    return {
      doesMatch: false,
      diffImageBuffer: undefined,
      reason: 'Image dimensions do not match',
    }
  }
  const count = pixelmatch(
    actualImage.data,
    expectedImage.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 } // Adjust threshold for sensitivity
  )

  const doesMatch = count === 0

  return {
    doesMatch,

    diffImageBuffer: doesMatch ? undefined : diff,
    reason: doesMatch ? undefined : `${count} pixels differ`,
  }
}
