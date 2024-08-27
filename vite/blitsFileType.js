export default function blitsFileType() {
  return {
    name: 'vite-plugin-blits-file-type',
    enforce: 'pre',
    transform(src, id) {
      if (id.endsWith('.blits')) {
        try {
          const { template, script } = parseBlitsFile(src)
          const transformedCode = injectTemplate(script, template)
          return {
            code: transformedCode,
            map: null, // no source map
          }
        } catch (error) {
          this.error(error)
        }
      }
    },
  }
}

function parseBlitsFile(source) {
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/)
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/)

  return {
    template: templateMatch ? templateMatch[1].trim() : '',
    script: scriptMatch ? scriptMatch[1].trim() : '',
  }
}

function injectTemplate(script, template) {
  const componentRegex =
    /(Blits\.Component|Component)\s*\(\s*(['"])(.+?)\2\s*,\s*\{|Blits\.Application\s*\(\s*\{/
  const match = script.match(componentRegex)

  if (!match) {
    // we might consider initializing a component if it's not found automatically
    throw new Error(
      'Could not find Blits.Component, Component, or Blits.Application initialization in the script'
    )
  }

  const [fullMatch] = match
  const insertIndex = script.indexOf(fullMatch) + fullMatch.length - 1

  // Using template literals to preserve multiline strings and escape characters
  const injection = `\n  template: \`${template.replace(/`/g, '\\`')}\`,\n`
  return script.slice(0, insertIndex) + injection + script.slice(insertIndex)
}
