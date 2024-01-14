import parser from '../src/lib/templateparser/parser.js'
import generator from '../src/lib/codegenerator/generator.js'
import path from 'path'

export default function () {
  let config
  return {
    name: 'preCompiler',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    transform(source, filePath) {
      if (config.blits && config.blits.precompile === false) return source
      if (source.indexOf('Blits.Component(') > -1 || source.indexOf('Blits.Application(') > -1) {
        // get the start of the template key in de component configuration object
        const templateKeyRegex = /template:\s*([`"'])*/g
        const templateStartResult = templateKeyRegex.exec(source)
        const typeOfQuotesUsed = templateStartResult[1]
        const templateStartIndex = templateStartResult.index

        // get the template contents from the configuration object
        const templateContentsRegex = new RegExp(
          `${typeOfQuotesUsed}([\\s\\S]*?)${typeOfQuotesUsed}`
        )

        const templateContentResult = templateContentsRegex.exec(source.slice(templateStartIndex))
        const templateEndIndex =
          templateStartIndex + templateContentResult.index + templateContentResult[0].length

        // Parse the template
        let resourceName = 'Blits.Application'
        if (source.indexOf('Blits.Component(') > -1) {
          resourceName = source.match(/Blits\.Component\(['"](.*)['"]\s*,/)[1]
        }
        const componentPath = path.relative(process.cwd(), filePath)
        const parsed = parser(templateContentResult[1], resourceName, null, componentPath)

        // Generate the code
        const code = generator.call({ components: {} }, parsed)

        // Insert the code in the component using the 'code' key, replacing the template key
        const replacement = `code: { render: ${code.render.toString()}, effects: [${code.effects.map(
          (fn) => fn.toString() + ','
        )}], context: {}}`
        const newSource =
          source.substring(0, templateStartIndex) + replacement + source.substring(templateEndIndex)

        return newSource
      }
    },
  }
}
